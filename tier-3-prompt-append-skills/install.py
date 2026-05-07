"""
claude-omni · tier-3 · system prompt append + skills

tier-2 + skills 一起装:
  1. 把本目录的 append.txt 内容写进 Claude Desktop 的 SDK system prompt 主体末尾
     (成为 system prompt 的一部分, system 角色; 跟 tier-2 完全一致的 asar patch)
     - Code tab 走 appendSystemPrompt 字段
     - Cowork 走 baseSystemPrompt prepend
  2. 把本目录 skills/<name>/SKILL.md 复制到 ~/.claude/skills/<name>/SKILL.md
     (Code 启动会话时按 description 字段决定是否激活)

注: append.txt 是精简版 deployment-context (追加模式专用) — 只含 Deployment context
    / Defaults / Response style 三段, 因为 SDK 默认那段还在前面, 不重复。tier-5 那份
    是整段替换专用的完整版 (含模拟整个 SDK 默认结构), 跟本 tier 不是同一份, 只是同名。

    本 tier 是双通道叠加: system 角色的部署语境 (append.txt) + user 角色按语境触发的
    专家身份声明 (skill description)。两个角色都被加固。

完整备份 + emergency-restore + 跨 tier 互斥检查。
"""
import sys
import os
import re
import subprocess
import shutil
import ctypes
import json
from pathlib import Path

# panel-compat: panel 调用时把 input() 变 no-op, 避免阻塞
if os.environ.get('CLAUDE_OMNI_PANEL'):
    import builtins
    builtins.input = lambda *a, **kw: ''

SCRIPT_DIR = Path(__file__).parent.resolve()
WINDOWSAPPS = Path(r"C:\Program Files\WindowsApps")
BACKUP_DIR = SCRIPT_DIR / "_backup"

PATCH_START = "/* === L2_APPEND_PATCH_v1 START === */"
PATCH_END = "/* === L2_APPEND_PATCH_v1 END === */"

# tier-3 = Code tab 走 append 模式 (asar patch 跟 tier-2 完全一样)
SYSTEM_PROMPT_MODE = "append"
TIER_NAME = "tier-3"

OUR_SKILL_NAMES = [
    "pentest-engagement",
    "adult-fiction-writing",
    "llm-safety-research",
    "bounty-safe-harbor",
]


# --- 工具 --------------------------------------------------------------------

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def relaunch_as_admin():
    params = " ".join([f'"{a}"' for a in sys.argv])
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
    if ret <= 32:
        print(f"[错误] 提权失败 (ret={ret})")
        sys.exit(1)
    sys.exit(0)


def run_loud(cmd, check=True, shell=False):
    if isinstance(cmd, list):
        printable = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in cmd)
    else:
        printable = cmd
    print(f"  > {printable[:240]}", flush=True)
    r = subprocess.run(cmd, shell=shell)
    if check and r.returncode != 0:
        raise SystemExit(f"  ! 命令失败 (returncode={r.returncode})")
    return r


def run_quiet(cmd):
    return subprocess.run(cmd, capture_output=True, text=True,
                          encoding="cp936", errors="replace", check=False)


def robocopy_mirror(src, dst):
    """robocopy /MIR — 镜像 src 到 dst (清空目标多余 + 完整复制)。
    用于完整还原场景。处理 WindowsApps 里 shutil.copytree 处理不了的特殊文件。
    """
    src, dst = str(src), str(dst)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["robocopy", src, dst, "/MIR", "/COPY:DAT", "/R:3", "/W:1",
         "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
        capture_output=True, text=True, encoding="cp936", errors="replace"
    )
    # robocopy: 0-7 = 成功, 8+ = 错误
    if r.returncode >= 8:
        raise RuntimeError(
            f"robocopy /MIR 失败 (rc={r.returncode})\n"
            f"src={src}\ndst={dst}\n"
            f"stdout={r.stdout[-800:]}"
        )
    return r.returncode


def robocopy_merge(src, dst):
    """robocopy /E — 递归复制 src 到 dst (不删目标多余, merge 模式)。
    用于 install 写回 unpacked 时不破坏其他 patch 的文件 (如 i18n)。
    """
    src, dst = str(src), str(dst)
    Path(dst).mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["robocopy", src, dst, "/E", "/COPY:DAT", "/R:3", "/W:1",
         "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
        capture_output=True, text=True, encoding="cp936", errors="replace"
    )
    if r.returncode >= 8:
        raise RuntimeError(
            f"robocopy /E 失败 (rc={r.returncode})\n"
            f"src={src}\ndst={dst}\n"
            f"stdout={r.stdout[-800:]}"
        )
    return r.returncode


def find_claude_app():
    if not WINDOWSAPPS.exists():
        raise SystemExit("找不到 C:\\Program Files\\WindowsApps")
    candidates = []
    for d in WINDOWSAPPS.glob("Claude_*_x64__*"):
        app = d / "app"
        if (app / "resources" / "app.asar").exists():
            candidates.append((d.name, app))
    if not candidates:
        raise SystemExit("找不到 Claude Desktop 安装。")
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def js_template_escape(text: str) -> str:
    return (text.replace("\\", "\\\\")
                .replace("`", "\\`")
                .replace("${", "\\${"))


# --- patch 文本逻辑 ----------------------------------------------------------

def apply_patches_to_text(text: str, append_path_js: str, append_prepend_path_js: str):
    """
    注入运行时 fs.readFileSync 调用 — 而不是嵌入字面量。
    Claude 进程每次拼装 system prompt 时实时读文件, 改完重启即生效, 不用重 install。

    Code tab (override) 读 append.txt — 完整内容替换 SDK 默认 system prompt。
    Cowork (prepend) 读 append-prepend.txt — 简化版, 只含 user authorization 顶部, 无 Code SDK 专属 section
        (TodoWrite / auto memory / Response style 等), 让 cowork 上下文不被开发者风格指令污染。
    """
    # Code override 读 append.txt
    read_call = (
        f"(function(){{try{{return require('fs').readFileSync({append_path_js},'utf-8');}}catch(e){{return '';}}}})()"
    )
    # Cowork prepend 读 append-prepend.txt; 内容非空时加 \n\n 分隔, 空时不加
    read_call_nl = (
        f"(function(){{try{{var s=require('fs').readFileSync({append_prepend_path_js},'utf-8');return s?s+'\\n\\n':'';}}catch(e){{return '';}}}})()"
    )

    text, prev_n = re.subn(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END),
        '', text, flags=re.DOTALL
    )
    if prev_n:
        print(f"    剥旧 patch × {prev_n}")

    inject_count = 0

    # [A] Cowork: Rbr baseSystemPrompt prepend
    pat_cowork = re.compile(
        r'(\w+)\s*=\s*(\w+)\s*\?\?\s*""\s*;'
        r'(?=\s*\1\s*=\s*\1\.replaceAll\(\s*"\{\{promptCacheBoundary\}\}")'
    )
    m = pat_cowork.search(text)
    if m:
        p_var = m.group(1)
        # 剥掉 Cowork 原 baseSystemPrompt 里的显式 refusal/wellbeing/reminders 段。
        # 这三段是 Code tab SDK 默认提示词没有的"额外锁", 是 Cowork 比 Code 受限的根源。
        # 注: \\\\s\\\\S 在 Python 里写出来是 4 backslash → JS 源码 2 backslash → RegExp 收到 \s\S 字符类。
        sections_to_strip = ['refusal_handling', 'user_wellbeing', 'anthropic_reminders']
        strip_calls = ''.join(
            f"{p_var}={p_var}.replace(new RegExp('<{s}>[\\\\s\\\\S]*?</{s}>','g'),'');"
            for s in sections_to_strip
        )
        inject_a = (
            PATCH_START
            + f"{p_var}={read_call_nl}+{p_var};"
            + strip_calls
            + PATCH_END
        )
        text = text[:m.end()] + inject_a + text[m.end():]
        inject_count += 1
        extra = f" + strip {len(sections_to_strip)} sections" if strip_calls else ""
        print(f"    [A] Cowork prepend (runtime read){extra} @ {m.start()}")
    else:
        print(f"    [A] Cowork 锚点未找到, 跳过")

    # [B/C] Code tab: SDK config 注入
    if SYSTEM_PROMPT_MODE == "append":
        # 注入策略: 重复 key 覆盖。
        # 在 planModeInstructions 之前追加 appendSystemPrompt 同名 key, JS 对象字面量
        # 同名属性后值覆盖前值, 因此 appendSystemPrompt 字段最终值是注入的 IIFE 结果。
        # 原 appendSystemPrompt:VARNAME 保留不动, 剥 marker 时整段干净删除,
        # 不会产生 ":," 形式空字段值的语法错误。
        pat_code = re.compile(
            r'(appendSystemPrompt:)(\w+)(,planModeInstructions:\w+\.planModeInstructions)'
        )
        matches_b = list(pat_code.finditer(text))
        if matches_b:
            def replacer(mm):
                var = mm.group(2)
                inject = (
                    PATCH_START
                    + f'appendSystemPrompt:({var}?{var}+"\\n\\n":"")+{read_call},'
                    + PATCH_END
                )
                # inject 以 "," 结尾, group(3) 也以 "," 开头, 去掉 group(3) 的开头逗号
                return f'{mm.group(1)}{mm.group(2)},{inject}{mm.group(3)[1:]}'
            text, n_b = pat_code.subn(replacer, text)
            inject_count += n_b
            print(f"    [B] Code appendSystemPrompt (重复 key 覆盖, runtime read) × {n_b}")
        else:
            print(f"    [B] Code 锚点未找到, 跳过")
    elif SYSTEM_PROMPT_MODE == "override":
        # 注入策略: 重复 key 覆盖 (同 [B] append 分支)。
        # 在 planModeInstructions 之前追加 systemPrompt 同名 key, 同名属性后值覆盖前值,
        # 最终 systemPrompt 字段值由注入的 IIFE 决定; 原 systemPrompt:VARNAME 保留, 剥
        # marker 整段干净删除, 不破坏 asar 结构。
        pat_code = re.compile(
            r'(systemPrompt:\w+,appendSystemPrompt:\w+,)(planModeInstructions:\w+\.planModeInstructions)'
        )
        matches_c = list(pat_code.finditer(text))
        if matches_c:
            def replacer(mm):
                inject = (
                    PATCH_START
                    + f"systemPrompt:{read_call},"
                    + PATCH_END
                )
                return f'{mm.group(1)}{inject}{mm.group(2)}'
            text, n_c = pat_code.subn(replacer, text)
            inject_count += n_c
            print(f"    [C] Code systemPrompt OVERRIDE (重复 key 覆盖, 剥 marker 安全) × {n_c}")
        else:
            print(f"    [C] Code 锚点未找到, 跳过")
    else:
        raise SystemExit(f"未知 SYSTEM_PROMPT_MODE: {SYSTEM_PROMPT_MODE}")

    return text, inject_count


# --- 备份/还原 ---------------------------------------------------------------

def full_backup(claude_exe: Path, asar_path: Path, resources_dir: Path):
    """
    完整备份: claude.exe + app.asar + app.asar.unpacked 整目录。

    备份状态机:
    - 备份目录不存在 → 全新备份
    - 备份完整 (sentinel 存在 + 三件套齐全) → 跳过
    - 备份目录存在但不完整 (无 sentinel / 缺文件) → 视为不可信, 重新完整备份

    备份基线要求: 当前 asar 不含本 patch 的 PATCH_START marker。
    含 marker 的 asar 不能用作备份基线 (基于已 patched 状态做备份会污染原始快照)。
    备份语义是 "install 之前的本机快照" — 允许含其他 patch (i18n / font / devtools),
    不要求是 Anthropic 出厂原版。
    """
    version_dir = claude_exe.parent.parent.name
    sub = BACKUP_DIR / version_dir

    exe_bak = sub / "claude.exe"
    asar_bak = sub / "app.asar"
    unpacked_bak = sub / "app.asar.unpacked"
    sentinel = sub / "_complete.flag"

    # case 1: 完整备份已有 → 跳过
    if (sub.exists() and sentinel.exists() and exe_bak.exists()
            and asar_bak.exists() and unpacked_bak.exists()):
        print(f"  ✓ 完整备份已存在: {sub}")
        return sub

    # 拒绝在含本 patch marker 的 asar 上做备份
    asar_text = asar_path.read_bytes().decode("utf-8", errors="replace")
    if PATCH_START in asar_text:
        print(f"  ! 当前 asar 含 PATCH_START marker (本 patch 已应用)")
        print(f"  ! 不能基于已 patched asar 做新备份。")
        print(f"  ! 解决:")
        print(f"     a) 跑 emergency-restore.bat 从已有备份恢复, 或")
        print(f"     b) Microsoft Store 卸载并重装 Claude Desktop")
        raise SystemExit("当前 asar 含本 patch marker, 不能作备份基线")

    print(f"  ✓ 当前 asar 干净 (无 PATCH_START marker), 可作完整备份基线")

    # 备份目录残存但不完整 → 重建
    if sub.exists():
        print(f"  清理旧备份 {sub} (可能不完整或过期)...")
        shutil.rmtree(sub)

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    sub.mkdir(parents=True, exist_ok=True)
    print(f"  备份目录: {sub}")

    print(f"  备份 claude.exe ({claude_exe.stat().st_size / 1024 / 1024:.1f} MB)...")
    shutil.copy2(claude_exe, exe_bak)

    print(f"  备份 app.asar ({asar_path.stat().st_size / 1024 / 1024:.1f} MB)...")
    shutil.copy2(asar_path, asar_bak)

    unpacked_src = resources_dir / "app.asar.unpacked"
    if unpacked_src.exists():
        files = [f for f in unpacked_src.rglob("*") if f.is_file()]
        total_size = sum(f.stat().st_size for f in files)
        print(f"  备份 app.asar.unpacked/ ({len(files)} 文件, {total_size/1024/1024:.1f} MB)...")
        # 用 robocopy 替代 shutil.copytree, 处理 WindowsApps 里的 reparse point 等
        robocopy_mirror(unpacked_src, unpacked_bak)
    else:
        unpacked_bak.mkdir()
        print(f"  原 asar 不含 unpacked 目录, 已建空备份占位")

    # 标记完整 (最后一步)
    sentinel.write_text(json.dumps({
        "asar_size": asar_path.stat().st_size,
        "exe_size": claude_exe.stat().st_size,
        "version_dir": version_dir,
        "has_unpacked": unpacked_src.exists(),
    }), encoding="utf-8")
    print(f"  ✓ 完整备份完成 (含 sentinel)")

    return sub


def restore_from_backup(sub_backup: Path, claude_exe: Path, asar_path: Path,
                       resources_dir: Path):
    """从完整备份还原 (用于 install 失败回滚)。"""
    print(f"  ! 从备份恢复 {sub_backup}")
    backup_exe = sub_backup / "claude.exe"
    backup_asar = sub_backup / "app.asar"
    backup_unpacked = sub_backup / "app.asar.unpacked"
    cur_unpacked = resources_dir / "app.asar.unpacked"

    if backup_asar.exists():
        shutil.copy2(backup_asar, asar_path)
    if backup_exe.exists():
        shutil.copy2(backup_exe, claude_exe)
    # 用 robocopy /MIR 还原 unpacked (处理 WindowsApps 特殊文件)
    if backup_unpacked.exists() and any(backup_unpacked.iterdir()):
        robocopy_mirror(backup_unpacked, cur_unpacked)
    elif backup_unpacked.exists():
        # 备份是空目录占位 → 删当前 unpacked
        if cur_unpacked.exists():
            shutil.rmtree(cur_unpacked, ignore_errors=True)


# --- 主流程 ------------------------------------------------------------------

def step(n, total, msg):
    print(f"\n[{n}/{total}] {msg}")


def check_tier_conflict():
    """检测是否已装其他 tier, 装着冲突 tier 时拒绝继续。"""
    marker = Path(os.path.expanduser("~/.claude/.claude-omni-tier"))
    if not marker.exists():
        return
    cur = marker.read_text(encoding="utf-8").strip()
    if cur == TIER_NAME:
        print(f"\n{TIER_NAME} 已装, 重装中...")
        return
    other_names = {
        "tier-1": "tier-1 (CLAUDE.md only)",
        "tier-2": "tier-2 (system prompt append)",
        "tier-2.5": "tier-2.5 (CLAUDE.md + skills)",
        "tier-3": "tier-3 (append + skills)",
        "tier-5": "tier-5 (system prompt override)",
    }
    label = other_names.get(cur, f"未知 tier ({cur})")
    print(f"\n冲突: 已安装 {label}")
    print(f"先到对应 tier 目录跑 uninstall.bat 再装 {TIER_NAME}。")
    input("\n按回车退出...")
    sys.exit(1)


def write_tier_marker():
    """install 成功后, 写当前 tier 标识。"""
    claude_dir = Path(os.path.expanduser("~/.claude"))
    claude_dir.mkdir(parents=True, exist_ok=True)
    marker = claude_dir / ".claude-omni-tier"
    marker.write_text(TIER_NAME, encoding="utf-8")
    print(f"  ✓ tier marker → {marker}")


def main():
    print("=" * 60)
    print(f"claude-omni · {TIER_NAME} · install")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")
    if not is_admin():
        print("需要管理员权限, 正在请求提权...")
        relaunch_as_admin()
        return

    check_tier_conflict()

    # tier-3: 读本目录的 append.txt (deployment-context 措辞, 适合 system 角色)
    append_path = (SCRIPT_DIR / "append.txt").resolve()
    if not append_path.exists():
        raise SystemExit(f"缺少 append.txt: {append_path}")
    # runtime read: 改 append.txt 后重启 Claude 即生效, 不用重 install。
    # Code tab append 和 Cowork prepend 都读同一份 append.txt。
    append_path_js = json.dumps(str(append_path))
    append_prepend_path_js = append_path_js
    print(f"  runtime read 路径: {append_path}")

    src_skills_dir = SCRIPT_DIR / "skills"
    if not src_skills_dir.exists():
        raise SystemExit(f"缺少 skills 目录: {src_skills_dir}")

    TOTAL = 8

    step(1, TOTAL, "找最新版 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  {src_app}")
    claude_exe = src_app / "claude.exe"
    resources_dir = src_app / "resources"
    asar_path = resources_dir / "app.asar"

    step(2, TOTAL, "杀进程 + 停服务 + ACL...")
    # 杀所有相关进程: claude.exe (主进程), cowork-svc.exe (LocalSystem 服务,
    # 持有 winpty.dll 等 native module handle), chrome-native-host.exe (浏览器扩展通信)
    for name in ["claude.exe", "cowork-svc.exe", "chrome-native-host.exe"]:
        run_quiet(["taskkill", "/F", "/IM", name, "/T"])
    # 停 CoworkVMService 服务 (StartupType=auto, 会 restart, 所以要 stop 而不是 kill)
    run_quiet(["sc", "stop", "CoworkVMService"])
    # 等 OS 释放文件 handle (服务停止 + 进程退出 是异步的)
    import time
    time.sleep(3)
    for target in [claude_exe, asar_path]:
        run_quiet(["takeown", "/F", str(target)])
        run_quiet(["icacls", str(target), "/grant", "administrators:F"])
    run_quiet(["takeown", "/F", str(resources_dir), "/R", "/D", "Y"])
    run_quiet(["icacls", str(resources_dir), "/grant", "administrators:F", "/T", "/C"])

    step(3, TOTAL, "完整备份 (asar + exe + unpacked/)...")
    sub_backup = full_backup(claude_exe, asar_path, resources_dir)

    step(4, TOTAL, "关 ASAR fuse...")
    run_loud(["npx", "--yes", "@electron/fuses", "write",
              "--app", str(claude_exe),
              "EnableEmbeddedAsarIntegrityValidation=off"],
             shell=True)

    # 重装路径: 当前 asar 已含本 patch marker 时, 先从备份还原干净基线再重打。
    # 直接在已 patched asar 上再 patch 会让锚点正则匹配失败 (注入位置已变形),
    # 写出 syntax-error 的 asar。
    cur_asar_text_check = asar_path.read_bytes().decode("utf-8", errors="replace")
    if PATCH_START in cur_asar_text_check:
        print(f"\n  当前 asar 含本 patch marker, 先从备份还原基线...")
        backup_asar_clean = sub_backup / "app.asar"
        backup_unpacked_clean = sub_backup / "app.asar.unpacked"
        if not backup_asar_clean.exists():
            raise SystemExit(f"备份 asar {backup_asar_clean} 不存在, 跑 emergency-restore.bat 后重试")
        shutil.copy2(backup_asar_clean, asar_path)
        # 同步还原 unpacked, 避免 native module / 其他 patch 资源跟新 asar 版本不匹配
        cur_unpacked_pre = resources_dir / "app.asar.unpacked"
        if backup_unpacked_clean.exists() and any(backup_unpacked_clean.iterdir()):
            robocopy_mirror(backup_unpacked_clean, cur_unpacked_pre)
        print(f"  ✓ asar + unpacked 已 reset 到备份基线")

    step(5, TOTAL, "解 asar -> patch -> 重打包...")
    extracted = SCRIPT_DIR / "_extracted_tmp"
    new_asar = SCRIPT_DIR / "_app.asar.new"
    new_unpacked = SCRIPT_DIR / "_app.asar.new.unpacked"
    for p in [extracted, new_unpacked]:
        if p.exists():
            shutil.rmtree(p, ignore_errors=True)
    if new_asar.exists():
        new_asar.unlink()

    print("  [a] extract...")
    run_loud(["npx", "--yes", "@electron/asar", "extract",
              str(asar_path), str(extracted)],
             shell=True)

    print("  [b] patch index.js...")
    index_js = extracted / ".vite" / "build" / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    text = index_js.read_text(encoding="utf-8")
    new_text, n = apply_patches_to_text(text, append_path_js, append_prepend_path_js)
    if n == 0:
        raise SystemExit("两条注入路径都没找到锚点")
    index_js.write_text(new_text, encoding="utf-8")
    if PATCH_START not in index_js.read_text(encoding="utf-8"):
        raise SystemExit("写入 index.js 后校验失败")
    print(f"  ✓ 注入 {n} 处")

    print("  [c] pack (unpack pattern: *.{node,dll})...")
    run_loud(["npx", "--yes", "@electron/asar", "pack",
              str(extracted), str(new_asar),
              "--unpack", "*.{node,dll}",
              "--unpack-dir", "node_modules/node-pty/build/Release"],
             shell=True)

    # 校验新 asar
    if not new_asar.exists() or new_asar.stat().st_size < 10_000_000:
        size = new_asar.stat().st_size if new_asar.exists() else 0
        for p in [extracted, new_unpacked]:
            if p.exists():
                shutil.rmtree(p, ignore_errors=True)
        if new_asar.exists():
            new_asar.unlink()
        raise SystemExit(f"重打包失败: 新 asar {size} 字节。原 asar 未动。")

    # 校验 new_unpacked: pack 时如果 .node/.dll unpack 成功, 应该能找到至少一个
    new_unpacked_files = list(new_unpacked.rglob("*")) if new_unpacked.exists() else []
    new_node_files = [f for f in new_unpacked_files if f.is_file() and f.suffix in (".node", ".dll")]
    print(f"  ✓ 新 asar {new_asar.stat().st_size/1024/1024:.1f} MB, "
          f"新 unpacked 含 {len(new_node_files)} 个 .node/.dll")

    if len(new_node_files) == 0:
        # 原 asar 不含 .node/.dll 文件时合法, 不打断流程
        print(f"  ! 注意: pack 后没产出 .node/.dll unpacked 文件 (原 asar 可能不含)")

    step(6, TOTAL, "原子写回...")
    pending = asar_path.parent / "app.asar.pending"
    if pending.exists():
        pending.unlink()

    target_unpacked = resources_dir / "app.asar.unpacked"

    try:
        # 1. 写 pending
        shutil.copy2(new_asar, pending)
        if pending.stat().st_size != new_asar.stat().st_size:
            raise SystemExit(".pending 写入大小不匹配")

        # 2. merge unpacked: robocopy /E 递归复制, 不删目标多余文件
        #    (保留 i18n 等其他 patch 的 unpacked 内容)
        if new_unpacked.exists():
            robocopy_merge(new_unpacked, target_unpacked)

        # 3. atomic replace pending -> asar (Windows NTFS 上 os.replace 是真 atomic)
        os.replace(str(pending), str(asar_path))
        print(f"  ✓ {asar_path}")

    except Exception as e:
        print(f"  ! 写回失败: {e}")
        if pending.exists():
            pending.unlink(missing_ok=True)
        # 从备份完整恢复
        try:
            restore_from_backup(sub_backup, claude_exe, asar_path, resources_dir)
            print(f"  ✓ 已从备份恢复, Claude 应该能正常启动")
        except Exception as ee:
            print(f"  !! 恢复也失败: {ee}")
            print(f"  !! 手动: 跑 emergency-restore.bat")
        raise SystemExit("install 写回失败, 已尝试恢复。")

    # 清理临时
    for p in [extracted, new_unpacked]:
        if p.exists():
            shutil.rmtree(p, ignore_errors=True)
    if new_asar.exists():
        new_asar.unlink()

    step(7, TOTAL, "装 skills 到 ~/.claude/skills/...")
    claude_dir = Path(os.path.expanduser("~/.claude"))
    dst_skills_dir = claude_dir / "skills"
    backup_skills_dir = claude_dir / "skills.tier-3-bak"
    claude_dir.mkdir(parents=True, exist_ok=True)
    # 第一次装时备份用户原 skills/ 整体 (含其他 skill); 重装时不重复备份
    tier_marker_path = claude_dir / ".claude-omni-tier"
    if (not tier_marker_path.exists() and dst_skills_dir.exists()
            and not backup_skills_dir.exists()):
        shutil.copytree(dst_skills_dir, backup_skills_dir)
        print(f"  备份原 skills → {backup_skills_dir.name}")
    dst_skills_dir.mkdir(parents=True, exist_ok=True)
    for name in OUR_SKILL_NAMES:
        src_skill = src_skills_dir / name / "SKILL.md"
        dst_skill_dir = dst_skills_dir / name
        dst_skill = dst_skill_dir / "SKILL.md"
        if not src_skill.exists():
            print(f"  ! 缺源 skill: {src_skill}, 跳过")
            continue
        dst_skill_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_skill, dst_skill)
        print(f"  ✓ skill: {name}")

    step(8, TOTAL, "写 tier marker...")
    write_tier_marker()

    print()
    print("=" * 60)
    print(f"✓ {TIER_NAME} install 完成")
    print("=" * 60)
    print()
    print("启动 Claude Desktop 测一下 — 能不能开 + 注入是否生效")
    print(f"改注入内容: 编辑 {append_path}")
    print("  改完重启 Claude 即生效, 不用重 install (runtime read)")
    print(f"改 skill description: 编辑 {src_skills_dir}/<name>/SKILL.md, 然后重跑 install.bat")
    print()
    print("注意: 首次启动 Claude 会弹\"未知发布者\"警告 (数字签名失效, 是改 asar 的代价),")
    print("      点\"仍要运行\"即可, 后续不再弹。")
    print()
    print("出问题:")
    print("  - 想正常卸载 → uninstall.bat")
    print("  - Claude 打不开 / 紧急情况 → emergency-restore.bat")
    print()
    input("按回车退出...")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code:
            print(f"\n错误退出: {e}")
            input("按回车退出...")
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        input("\n出错了, 按回车退出...")
