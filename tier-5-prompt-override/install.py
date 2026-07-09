"""
Claude Desktop L2 system prompt append patch.

完整备份策略:
  _backup/<version>/
    ├── claude.exe              (原版, fuse-on)
    ├── app.asar                (原版)
    └── app.asar.unpacked/      (原版, 含 native modules .node/.dll)

任何写回失败立即从备份恢复; emergency-restore.py 永远能完整还原。
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

# Code tab system prompt 注入模式:
#   "append"   — append.txt 追加到 SDK 默认 system prompt 末尾, 保留默认内容
#                Final: [SDK 默认: You are Claude Code, # Tools, # Env, ...] + [append.txt]
#   "override" — append.txt 整段替代 SDK 默认, 取得对 system prompt 的完全控制
#                Final: [append.txt] (SDK 默认全部消失, 包括 # Tools 工具描述)
# 本档 (tier-5) 走 override 模式
SYSTEM_PROMPT_MODE = "override"

# --- 工具 --------------------------------------------------------------------

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def relaunch_as_admin():
    # 提权后新进程 cwd 会变成 System32, 相对路径找不到脚本 → 用绝对路径 + 显式 workdir
    script = os.path.abspath(sys.argv[0])
    params = " ".join(f'"{a}"' for a in [script] + sys.argv[1:])
    workdir = os.path.dirname(script)
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, workdir, 1)
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


def run_acl_check(cmd):
    """跑 takeown / icacls 这种 ACL 命令, 失败时打印 stderr 警告 (不 halt install)。
    跟 run_quiet 区别: run_quiet 完全静默, 这个会让 ACL 失败浮出表面。"""
    r = subprocess.run(cmd, capture_output=True, text=True,
                       encoding="cp936", errors="replace", check=False)
    if r.returncode != 0:
        msg = (r.stderr or r.stdout or "").strip()
        print(f"  [警告] {cmd[0]} rc={r.returncode}: {msg[:200]}", flush=True)
    return r


def _refresh_path_for_current_process():
    """从注册表读最新系统 PATH + 用户 PATH，合并到当前 process env['PATH']。
    winget 装完 Node.js 不会自动刷当前 shell 的 PATH，需要手动同步。"""
    try:
        import winreg
        parts = []
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                            r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as k:
            sys_path, _ = winreg.QueryValueEx(k, "Path")
            parts.append(sys_path)
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
                user_path, _ = winreg.QueryValueEx(k, "Path")
                parts.append(user_path)
        except FileNotFoundError:
            pass
        os.environ["PATH"] = ";".join(p for p in parts if p)
    except Exception as e:
        print(f"  ! 刷新 PATH 失败 (非致命): {e}")


def ensure_node_available():
    """确保 Node.js / npx 可用，缺了就尝试 winget 自动装。
    Node.js 是这个补丁的硬依赖（npx 调 @electron/asar 和 @electron/fuses）。"""
    import shutil as _shutil
    if _shutil.which("npx") or _shutil.which("npx.cmd"):
        return

    print()
    print("  ! 没找到 Node.js (npx 不可用)")
    print("  正在尝试用 winget 自动安装 Node.js LTS...")
    print("  (要联网，包约 30MB，装一下，估计 30-60 秒)")
    print()

    winget = _shutil.which("winget") or _shutil.which("winget.exe")
    if winget:
        try:
            r = subprocess.run(
                ["winget", "install", "-e", "--id", "OpenJS.NodeJS.LTS",
                 "--accept-source-agreements", "--accept-package-agreements",
                 "--silent"],
                shell=True
            )
        except Exception as e:
            print(f"  ! winget 启动失败: {e}")
            r = None

        if r is not None and r.returncode == 0:
            print("  ✓ Node.js 安装成功，正在刷新当前 shell 的 PATH...")
            _refresh_path_for_current_process()
            if _shutil.which("npx") or _shutil.which("npx.cmd"):
                print("  ✓ npx 已可用，继续安装")
                return
            # PATH 没刷到 current process (有时 winget 不写注册表立刻生效)
            # 退而求其次：直接到默认安装位置找 npx
            candidates = [
                r"C:\Program Files\nodejs\npx.cmd",
                r"C:\Program Files (x86)\nodejs\npx.cmd",
                os.path.expandvars(r"%LocalAppData%\Programs\nodejs\npx.cmd"),
            ]
            for c in candidates:
                if os.path.isfile(c):
                    # 把那个目录塞到 PATH 最前
                    os.environ["PATH"] = os.path.dirname(c) + ";" + os.environ.get("PATH", "")
                    if _shutil.which("npx") or _shutil.which("npx.cmd"):
                        print(f"  ✓ 已找到并加入 PATH: {c}")
                        return
            print()
            print("  ! Node.js 已装好，但当前命令窗口的 PATH 还没刷新到。")
            print("  ! 请关掉当前 cmd / git bash 窗口，重新打开，再跑一遍 install.bat 即可。")
            raise SystemExit("Node.js 已装，需要重开 cmd 继续")
        else:
            rc = r.returncode if r is not None else "?"
            print(f"  ! winget 装失败 (rc={rc})")

    print()
    print("  ! 自动安装失败，需要手动装 Node.js")
    print()
    print("  下载链接: https://nodejs.org/zh-cn/")
    print("  装 LTS 版即可，安装时勾选 'Add to PATH'")
    print("  装好后关掉当前 cmd 窗口，重新打开再跑 install.bat")
    raise SystemExit("Node.js 不可用，跑不下去")


def fuse_off_with_retry(claude_exe, max_retries=3):
    """关 EnableEmbeddedAsarIntegrityValidation fuse, EBUSY 时再补杀进程后重试。
    fuse 写入需要 exclusive 拿到 claude.exe, 进程没杀干净就 EBUSY。"""
    import time as _time
    for attempt in range(max_retries):
        r = subprocess.run(
            ["npx", "--yes", "@electron/fuses", "write",
             "--app", str(claude_exe),
             "EnableEmbeddedAsarIntegrityValidation=off"],
            capture_output=True, text=True, shell=True,
            encoding="utf-8", errors="replace"
        )
        out = (r.stdout or "") + (r.stderr or "")
        if r.returncode == 0:
            print(f"  ✓ fuse 关闭成功", flush=True)
            return
        is_ebusy = "EBUSY" in out or "resource busy" in out or "locked" in out
        if is_ebusy and attempt < max_retries - 1:
            print(f"  ! fuse 失败 EBUSY (尝试 {attempt+1}/{max_retries}): claude.exe 被进程持有, 再补杀一次", flush=True)
            for name in ["claude.exe", "cowork-svc.exe", "chrome-native-host.exe", "ant-base.exe"]:
                subprocess.run(["taskkill", "/F", "/IM", name, "/T"],
                               capture_output=True, text=True,
                               encoding="cp936", errors="replace")
            subprocess.run(["sc", "stop", "CoworkVMService"],
                           capture_output=True, text=True,
                           encoding="cp936", errors="replace")
            _time.sleep(5)
            continue
        # 失败兜底: 出诊断 + raise
        print(f"  ! fuse 失败 (rc={r.returncode}):", flush=True)
        tail = out[-800:] if len(out) > 800 else out
        for line in tail.splitlines():
            print(f"    {line}", flush=True)
        if is_ebusy:
            print(f"\n  ! 诊断: claude.exe 持续被进程持有, 自动 retry {max_retries} 次仍 EBUSY。", flush=True)
            print(f"  ! 手动处理建议:")
            print(f"    (1) 检查任务栏右下角是否还有 Claude 图标, 右键退出 (任务栏托盘)")
            print(f"    (2) 任务管理器搜 'claude' / 'cowork' / 'ant', 全部 '结束任务'")
            print(f"    (3) 关掉 Windows Defender 实时保护 (它有时会持有文件 handle)")
            print(f"    (4) 重启 Windows 后再跑 install (最稳兜底)")
        raise SystemExit(f"fuse 写入失败 (rc={r.returncode})")


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

def apply_patches_to_text(text: str, append_v1_js: str, append_v2_js: str, append_v3_js: str,
                          append_v4_js: str,
                          prepend_v1_js: str, prepend_v2_js: str, prepend_v3_js: str,
                          prepend_v4_js: str,
                          marker_js: str):
    """
    注入运行时 fs.readFileSync 调用 — 不嵌入字面量。
    Claude 进程每次拼装 system prompt 时:
      1. 读 marker 文件 (~/.claude/.claude-omni-tier5-mode) 看是 v1 / v2 / v3 / v4 (没有/非法 → v2)
      2. 按 mode 读对应 append.<mode>.txt 跟 append-prepend.<mode>.txt
    切 mode = 改 marker 文件 + 重启 Claude, 不用重 install。
    """
    # Code override: marker 选 mode, 读 append.v{1,2,3,4}.txt
    read_call = (
        f"(function(){{try{{"
        f"var fs=require('fs');"
        f"var m='v2';try{{var v=fs.readFileSync({marker_js},'utf-8').trim();if(v==='v1'||v==='v3'||v==='v4')m=v;}}catch(_e){{}}"
        f"var fp=m==='v4'?{append_v4_js}:m==='v3'?{append_v3_js}:m==='v1'?{append_v1_js}:{append_v2_js};"
        f"return fs.readFileSync(fp,'utf-8');"
        f"}}catch(e){{return '';}}}})()"
    )
    # Cowork prepend: marker 选 mode, 读 append-prepend.v{1,2,3,4}.txt; 非空加 \n\n (v4 留空 → 不注入)
    read_call_nl = (
        f"(function(){{try{{"
        f"var fs=require('fs');"
        f"var m='v2';try{{var v=fs.readFileSync({marker_js},'utf-8').trim();if(v==='v1'||v==='v3'||v==='v4')m=v;}}catch(_e){{}}"
        f"var fp=m==='v4'?{prepend_v4_js}:m==='v3'?{prepend_v3_js}:m==='v1'?{prepend_v1_js}:{prepend_v2_js};"
        f"var s=fs.readFileSync(fp,'utf-8');"
        f"return s?s+'\\n\\n':'';"
        f"}}catch(e){{return '';}}}})()"
    )

    text, prev_n = re.subn(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END),
        '', text, flags=re.DOTALL
    )
    if prev_n:
        print(f"    剥旧 patch × {prev_n}")

    inject_count = 0

    # [A] Cowork: baseSystemPrompt prepend
    # 锚点定位 K=K.replaceAll("{{promptCacheBoundary}}",...) —— 那句执行时 K 已经是完整
    # baseSystemPrompt (无论走 sp_variant replace 分支还是 n??"" 分支都汇到 K)。
    # 在这句 **前** 插入 K=<prepend>+K; 加剥离 XML 段, 语义上等价于以前追加在 K=Y??"" 之后。
    pat_cowork = re.compile(
        r'(?<!\w)(\w+)\s*=\s*\1\.replaceAll\(\s*"\{\{promptCacheBoundary\}\}"'
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
        text = text[:m.start()] + inject_a + text[m.start():]
        inject_count += 1
        extra = f" + strip {len(sections_to_strip)} sections" if strip_calls else ""
        print(f"    [A] Cowork prepend (runtime read){extra} @ {m.start()}")
    else:
        print(f"    [A] Cowork 锚点未找到, 跳过")

    # [B/C] Code tab: SDK config 注入
    if SYSTEM_PROMPT_MODE == "append":
        pat_code = re.compile(
            r'(appendSystemPrompt:)(\w+)(,planModeInstructions:\w+\.planModeInstructions)'
        )
        matches_b = list(pat_code.finditer(text))
        if matches_b:
            def replacer(mm):
                var = mm.group(2)
                new_value = (
                    PATCH_START
                    + f'({var}?{var}+"\\n\\n":"")+{read_call}'
                    + PATCH_END
                )
                return f'{mm.group(1)}{new_value}{mm.group(3)}'
            text, n_b = pat_code.subn(replacer, text)
            inject_count += n_b
            print(f"    [B] Code appendSystemPrompt (runtime read) × {n_b}")
        else:
            print(f"    [B] Code 锚点未找到, 跳过")
    elif SYSTEM_PROMPT_MODE == "override":
        # 注入策略: 重复 key 覆盖。
        # 在 planModeInstructions 之前追加 systemPrompt 同名 key, JS 对象字面量同名属性
        # 后值覆盖前值, 因此 systemPrompt 字段最终值是注入的 IIFE 结果。
        # 原 systemPrompt:VARNAME 保留不动, 剥 marker 整段干净删除, 不破坏 asar 结构。
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

def _prune_old_backups(keep=2):
    """备份按版本号只留最新 keep 个 (当前 + 前一版兜底), 删更旧的。单个 claude.exe
    ~222MB, 不清会随每次 Claude 版本更新无限累积 (曾涨到 22GB)。"""
    import re
    if not BACKUP_DIR.exists():
        return
    def _vkey(p):
        m = re.match(r"Claude_(.+?)_x64__", p.name)
        return tuple(int(x) for x in re.findall(r"\d+", m.group(1))) if m else ()
    subs = sorted((p for p in BACKUP_DIR.glob("Claude_*_x64__*") if p.is_dir()), key=_vkey)
    for old in (subs[:-keep] if keep > 0 else []):
        try:
            shutil.rmtree(old, ignore_errors=True)
            print(f"  清理旧备份 (省磁盘): {old.name}")
        except Exception:
            pass


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
    shutil.copyfile(claude_exe, exe_bak)

    print(f"  备份 app.asar ({asar_path.stat().st_size / 1024 / 1024:.1f} MB)...")
    shutil.copyfile(asar_path, asar_bak)

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

    _prune_old_backups(keep=2)
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
        shutil.copyfile(backup_asar, asar_path)
    if backup_exe.exists():
        shutil.copyfile(backup_exe, claude_exe)
    # 用 robocopy /MIR 还原 unpacked (处理 WindowsApps 特殊文件)
    if backup_unpacked.exists() and any(backup_unpacked.iterdir()):
        robocopy_mirror(backup_unpacked, cur_unpacked)
    elif backup_unpacked.exists():
        # 备份是空目录占位 → 删当前 unpacked
        if cur_unpacked.exists():
            shutil.rmtree(cur_unpacked, ignore_errors=True)


# --- 主流程 ------------------------------------------------------------------

TIER_NAME = "tier-5"


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


def step(n, total, msg):
    print(f"\n[{n}/{total}] {msg}")


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

    append_v1_path = (SCRIPT_DIR / "append.v1.txt").resolve()
    append_v2_path = (SCRIPT_DIR / "append.v2.txt").resolve()
    append_v3_path = (SCRIPT_DIR / "append.v3.txt").resolve()
    append_v4_path = (SCRIPT_DIR / "append.v4.txt").resolve()
    prepend_v1_path = (SCRIPT_DIR / "append-prepend.v1.txt").resolve()
    prepend_v2_path = (SCRIPT_DIR / "append-prepend.v2.txt").resolve()
    prepend_v3_path = (SCRIPT_DIR / "append-prepend.v3.txt").resolve()
    prepend_v4_path = (SCRIPT_DIR / "append-prepend.v4.txt").resolve()
    for p, name in [(append_v1_path, "append.v1.txt"), (append_v2_path, "append.v2.txt"),
                    (append_v3_path, "append.v3.txt"), (append_v4_path, "append.v4.txt"),
                    (prepend_v1_path, "append-prepend.v1.txt"), (prepend_v2_path, "append-prepend.v2.txt"),
                    (prepend_v3_path, "append-prepend.v3.txt"), (prepend_v4_path, "append-prepend.v4.txt")]:
        if not p.exists():
            raise SystemExit(f"缺少 {name}: {p}")
    marker_path = Path(os.path.expanduser("~/.claude/.claude-omni-tier5-mode"))
    # runtime read: 每次 Claude 拼 system prompt 时读 marker → 选 v1 / v2 / v3 / v4 对应文件。
    # 切 mode = 改 marker (面板代办) + 重启 Claude, 不用重 install。marker 没有/非法 → 默认 v2。
    append_v1_js = json.dumps(str(append_v1_path))
    append_v2_js = json.dumps(str(append_v2_path))
    append_v3_js = json.dumps(str(append_v3_path))
    append_v4_js = json.dumps(str(append_v4_path))
    prepend_v1_js = json.dumps(str(prepend_v1_path))
    prepend_v2_js = json.dumps(str(prepend_v2_path))
    prepend_v3_js = json.dumps(str(prepend_v3_path))
    prepend_v4_js = json.dumps(str(prepend_v4_path))
    marker_js = json.dumps(str(marker_path))
    print(f"  v1 路径: {append_v1_path}")
    print(f"  v2 路径: {append_v2_path}")
    print(f"  v3 路径: {append_v3_path} (自闭天才 · 不支持 jailbreak)")
    print(f"  v4 路径: {append_v4_path} (漏洞挖掘 · redteam mindset)")
    print(f"  mode marker: {marker_path} (默认 v2)")

    # 检查并确保 Node.js / npx 可用，缺了 winget 自动装
    ensure_node_available()

    TOTAL = 7

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
        run_acl_check(["takeown", "/F", str(target)])
        run_acl_check(["icacls", str(target), "/grant", "administrators:F"])
    run_acl_check(["takeown", "/F", str(resources_dir), "/R", "/D", "Y"])
    run_acl_check(["icacls", str(resources_dir), "/grant", "administrators:F", "/T", "/C"])

    step(3, TOTAL, "完整备份 (asar + exe + unpacked/)...")
    sub_backup = full_backup(claude_exe, asar_path, resources_dir)

    step(4, TOTAL, "关 ASAR fuse...")
    fuse_off_with_retry(claude_exe)

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
        shutil.copyfile(backup_asar_clean, asar_path)
        # unpacked 也还原 (避免 i18n 等其他 patch 的旧文件残留与新装版本不匹配)
        cur_unpacked_pre = resources_dir / "app.asar.unpacked"
        if backup_unpacked_clean.exists() and any(backup_unpacked_clean.iterdir()):
            robocopy_mirror(backup_unpacked_clean, cur_unpacked_pre)
        print(f"  ✓ asar + unpacked 已 reset 到备份快照")

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

    print("  [b] patch 入口 JS...")
    build_dir = extracted / ".vite" / "build"
    index_js = build_dir / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    # 1.19367+ 起 index.js 被拆成 loader shim, 真代码搬去 index.chunk-XXXX.js (hash 每次构建变)。
    # 兼容策略: 先看 index.js 自身有没有 Code 锚点 (旧版本); 没有就扫同目录 *.js 找到含锚点的 chunk。
    code_anchor_probe = re.compile(
        r'systemPrompt:\w+,appendSystemPrompt:\w+,planModeInstructions:\w+\.planModeInstructions'
    )
    target_js = None
    if code_anchor_probe.search(index_js.read_text(encoding="utf-8")):
        target_js = index_js
        print(f"    锚点在 index.js (旧版本布局)")
    else:
        for f in sorted(build_dir.glob("*.js")):
            if f.name == "index.js":
                continue
            try:
                t = f.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            if code_anchor_probe.search(t):
                target_js = f
                break
        if target_js is None:
            raise SystemExit("index.js 是 loader shim 但在 .vite/build/ 下没找到含 Code 锚点的入口 chunk")
        print(f"    index.js 是 loader shim, 真代码在 {target_js.name}")

    text = target_js.read_text(encoding="utf-8")
    new_text, n = apply_patches_to_text(text, append_v1_js, append_v2_js, append_v3_js,
                                        append_v4_js,
                                        prepend_v1_js, prepend_v2_js, prepend_v3_js,
                                        prepend_v4_js, marker_js)
    if n == 0:
        raise SystemExit("两条注入路径都没找到锚点")
    target_js.write_text(new_text, encoding="utf-8")
    if PATCH_START not in target_js.read_text(encoding="utf-8"):
        raise SystemExit(f"写入 {target_js.name} 后校验失败")
    print(f"  ✓ 注入 {n} 处 → {target_js.name}")

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

    # 写入策略: 优先 atomic (.pending + os.replace); AppX 拦截创建 .pending 时退化到 direct overwrite。
    # WindowsApps 受 AppX 部署引擎保护, 即使 admin Full ACL 也可能拒绝 "在 resources/ 创建新文件"
    # (如 .pending), 但允许 "覆盖已有文件" (app.asar 本身)。direct overwrite 失去原子性, 中断时
    # asar 可能损坏, 但 emergency-restore.bat 可兜底恢复, 这是 "装不上" vs "偶尔可能损坏可恢复"
    # 之间的权衡, 后者更可接受。
    fallback_to_direct = False

    try:
        # 1. 试 atomic 路径: 写 .pending
        shutil.copyfile(new_asar, pending)
        if pending.stat().st_size != new_asar.stat().st_size:
            raise SystemExit(".pending 写入大小不匹配")
    except (PermissionError, OSError) as e:
        err_str = str(e)
        if "WinError 5" in err_str or "Permission" in err_str.lower() or "拒绝访问" in err_str:
            print(f"  ! 创建 .pending 被拒 ({type(e).__name__}: {e})")
            print(f"  ! AppX/系统保护层拦截 'WindowsApps 里创建新文件', 退化到 direct overwrite")
            print(f"    (非 atomic 但绕过 AppX 限制; 中断时跑 emergency-restore.bat 兜底)")
            if pending.exists():
                pending.unlink(missing_ok=True)
            fallback_to_direct = True
        else:
            raise  # 其他错误走外层 except 诊断

    try:
        if not fallback_to_direct:
            # atomic 路径: pending 已写好, 走 merge unpacked + os.replace
            if new_unpacked.exists():
                robocopy_merge(new_unpacked, target_unpacked)
            os.replace(str(pending), str(asar_path))
            print(f"  ✓ {asar_path} (atomic)")
        else:
            # direct overwrite 路径: 直接覆盖 app.asar 本身, 绕过 AppX 创建新文件限制
            shutil.copyfile(new_asar, asar_path)
            if asar_path.stat().st_size != new_asar.stat().st_size:
                raise SystemExit("direct overwrite 大小不匹配")
            if new_unpacked.exists():
                robocopy_merge(new_unpacked, target_unpacked)
            print(f"  ✓ {asar_path} (direct overwrite, 非 atomic)")

    except Exception as e:
        print(f"  ! 写回失败: {e}")
        # 诊断: WinError 5 / Permission denied 类的权限错误, 给具体根因排查
        err_str = str(e)
        if "WinError 5" in err_str or "Permission" in err_str.lower() or "拒绝访问" in err_str:
            print(f"  ! 这是 Windows 权限错误 (拒绝访问), 常见三种原因:")
            print(f"    (1) Windows Defender 实时保护拦截 WindowsApps 写入")
            print(f"        → 临时关 Defender 实时保护后重试")
            print(f"    (2) 项目放在受保护目录 (如 System32 / Program Files)")
            print(f"        → 把 claude-omni/ 整个移到 Desktop / Documents 下重跑")
            print(f"    (3) Trusted Installer 仍持有 deny ACL")
            print(f"        → 管理员 PowerShell 跑: takeown /F \"{resources_dir}\" /R /D Y")
            print(f"                              : icacls \"{resources_dir}\" /reset /T /C")
            # 实地查一下 resources_dir 当前 ACL, 让用户能贴给我们看
            acl_r = subprocess.run(
                ["icacls", str(resources_dir)],
                capture_output=True, text=True, encoding="cp936", errors="replace"
            )
            if acl_r.stdout:
                print(f"  ! 当前 resources/ ACL (如要贴 issue 复制这段):")
                for line in acl_r.stdout.splitlines()[:10]:
                    print(f"    {line}")
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

    step(7, TOTAL, "写 tier marker...")
    write_tier_marker()

    print()
    print("=" * 60)
    print(f"✓ {TIER_NAME} install 完成")
    print("=" * 60)
    print()
    print("启动 Claude Desktop 测一下 — 能不能开 + 注入是否生效")
    print(f"改 v1 内容: 编辑 {append_v1_path} 跟 {prepend_v1_path}")
    print(f"改 v2 内容: 编辑 {append_v2_path} 跟 {prepend_v2_path}")
    print(f"改 v3 内容: 编辑 {append_v3_path} 跟 {prepend_v3_path}")
    print(f"改 v4 内容: 编辑 {append_v4_path} (漏洞挖掘; prepend 留空, Cowork 不注入)")
    print(f"切 mode: 改 {marker_path} 写 'v1' / 'v2' / 'v3' / 'v4' (面板有按钮代办)")
    print("  改完重启 Claude 即生效, 不用重 install (runtime read)")
    print()
    print("注意: 首次启动 Claude 会弹\"未知发布者\"警告 (数字签名失效, 是改 asar 的代价),")
    print("      点\"仍要运行\"即可, 后续不再弹。")
    print()
    print("出问题:")
    print("  - 想剥 marker 留 patch 框架 → uninstall.bat")
    print("  - Claude 打不开 / 紧急情况 → emergency-restore.bat (从完整备份恢复)")
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
