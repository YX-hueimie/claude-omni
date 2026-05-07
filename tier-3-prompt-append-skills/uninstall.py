"""
tier-3 卸载: 解 asar -> 剥自己 marker -> 重打包 -> 写回, 同时撤销 skills/。

只剥 L2_APPEND_PATCH_v1 marker, 保留其他 patch (如 i18n / font) 的 marker。
"""
import sys
import os
import re
import subprocess
import shutil
import ctypes
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

TIER_NAME = "tier-3"

OUR_SKILL_NAMES = [
    "pentest-engagement",
    "adult-fiction-writing",
    "llm-safety-research",
    "bounty-safe-harbor",
]

KNOWN_OTHER_MARKERS = [
    "// === I18N_PATCH_INPLACE_v1 START ===",
    "// === I18N_PATCH_INPLACE_v1 ===",
    "// === FONT_PATCH_INPLACE_v1 START ===",
    "// === FONT_PATCH_INPLACE_v1 ===",
    "// === FONT_PATCH_v2 ===",
    "/* === LOCALE_PATCH_v1 === */",
]


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def relaunch_as_admin():
    params = " ".join([f'"{a}"' for a in sys.argv])
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
    if ret <= 32:
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
    """robocopy /MIR — 镜像复制, 用于完整还原 (清空多余)。"""
    src, dst = str(src), str(dst)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["robocopy", src, dst, "/MIR", "/COPY:DAT", "/R:3", "/W:1",
         "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
        capture_output=True, text=True, encoding="cp936", errors="replace"
    )
    if r.returncode >= 8:
        raise RuntimeError(f"robocopy /MIR 失败 (rc={r.returncode})\n{r.stdout[-800:]}")
    return r.returncode


def robocopy_merge(src, dst):
    """robocopy /E — 递归 merge (不删多余, 保留其他 patch 文件)。"""
    src, dst = str(src), str(dst)
    Path(dst).mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["robocopy", src, dst, "/E", "/COPY:DAT", "/R:3", "/W:1",
         "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
        capture_output=True, text=True, encoding="cp936", errors="replace"
    )
    if r.returncode >= 8:
        raise RuntimeError(f"robocopy /E 失败 (rc={r.returncode})\n{r.stdout[-800:]}")
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
        raise SystemExit("找不到 Claude Desktop 安装")
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def main():
    print("=" * 60)
    print("Claude Desktop L2 patch — uninstall")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows")
    if not is_admin():
        print("需要管理员权限, 正在请求提权...")
        relaunch_as_admin()
        return

    print("\n[1/5] 定位 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  {src_app}")
    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"
    resources_dir = src_app / "resources"
    version_dir = src_app.parent.name

    print("\n[2/5] 杀进程 + 停服务 + ACL...")
    for name in ["claude.exe", "cowork-svc.exe", "chrome-native-host.exe"]:
        run_quiet(["taskkill", "/F", "/IM", name, "/T"])
    run_quiet(["sc", "stop", "CoworkVMService"])
    import time
    time.sleep(3)
    for target in [claude_exe, asar_path]:
        run_quiet(["takeown", "/F", str(target)])
        run_quiet(["icacls", str(target), "/grant", "administrators:F"])
    run_quiet(["takeown", "/F", str(resources_dir), "/R", "/D", "Y"])
    run_quiet(["icacls", str(resources_dir), "/grant", "administrators:F", "/T", "/C"])

    cur_unpacked = src_app / "resources" / "app.asar.unpacked"

    # ---- 路径选择: 先 peek asar 决定走哪条 ----
    # 不解包就能 search marker (asar 里 marker 是 ASCII 字面量在 payload 里)
    print("\n[3/?] 检测 asar 状态决定路径...")
    asar_text = asar_path.read_bytes().decode("utf-8", errors="replace")
    has_l2 = PATCH_START in asar_text
    other_present = [m for m in KNOWN_OTHER_MARKERS if m in asar_text]

    backup_sub = BACKUP_DIR / version_dir
    backup_asar = backup_sub / "app.asar"
    backup_exe = backup_sub / "claude.exe"
    backup_unpacked = backup_sub / "app.asar.unpacked"
    sentinel = backup_sub / "_complete.flag"
    backup_complete = (
        sentinel.exists() and backup_asar.exists()
        and backup_exe.exists() and backup_unpacked.exists()
    )

    print(f"  L2_APPEND_PATCH marker: {'在场' if has_l2 else '不在'}")
    print(f"  其他 patch marker: {other_present if other_present else '无'}")
    print(f"  备份完整: {backup_complete}")

    if not has_l2:
        print()
        print("没找到 L2_APPEND_PATCH marker, 没装过本 patch / 已卸载, 退出")
        input("按回车退出...")
        return

    # 路径 A: byte-identical 完全还原 (没别的 patch + 备份完整)
    #   跳过 extract+pack, 直接复制备份回去 — 比走 repack 路径快得多, 也避免 fuse 校验冲突
    # 路径 B: 解包 → 剥 L2 marker → 重打包 (有别的 patch 或备份不完整)
    #   保留其他 patch, 但 fuse-on exe 不还原 (避免 SHA 不匹配)

    if not other_present and backup_complete:
        # ==================== 路径 A: byte-identical 完全还原 ====================
        print("\n[4/4] byte-identical 完全还原 (跳过 extract+pack)...")
        # 直接复制备份, 不动当前的 asar (避免 os.replace 引入的 ACL 重置问题)
        shutil.copy2(backup_asar, asar_path)
        print(f"  ✓ asar 还原 byte-identical")
        shutil.copy2(backup_exe, claude_exe)
        print(f"  ✓ claude.exe 还原 (fuse 回 on)")
        # unpacked: robocopy /MIR (处理 WindowsApps 特殊文件)
        if backup_unpacked.exists() and any(backup_unpacked.iterdir()):
            robocopy_mirror(backup_unpacked, cur_unpacked)
            print(f"  ✓ unpacked 还原 (robocopy /MIR)")
        elif backup_unpacked.exists():
            if cur_unpacked.exists():
                shutil.rmtree(cur_unpacked, ignore_errors=True)
            print(f"  ✓ 原 asar 不含 unpacked, 已删当前 unpacked")

        # 校验
        if asar_path.stat().st_size != backup_asar.stat().st_size:
            print(f"  ! 警告: asar 大小不匹配")
        if claude_exe.stat().st_size != backup_exe.stat().st_size:
            print(f"  ! 警告: exe 大小不匹配")
    else:
        # ==================== 路径 B: 解包剥 marker 重打包 ====================
        if other_present:
            print(f"\n  原因走 B 路径: 其他 patch 仍装着 ({other_present}), 不能 byte-identical 还原")
        else:
            print(f"\n  原因走 B 路径: 备份不完整, 无法 byte-identical 还原")

        print("\n[4/5] 解 asar -> 剥 L2 marker -> 重打包...")
        extracted = SCRIPT_DIR / "_extracted_tmp"
        new_asar = SCRIPT_DIR / "_app.asar.new"
        new_unpacked = SCRIPT_DIR / "_app.asar.new.unpacked"
        for p in [extracted, new_unpacked]:
            if p.exists():
                shutil.rmtree(p, ignore_errors=True)
        if new_asar.exists():
            new_asar.unlink()

        # Pre-check: unpacked 完整性
        expected_native_files = [
            cur_unpacked / "node_modules" / "@ant" / "claude-native" / "claude-native-binding.node",
            cur_unpacked / "node_modules" / "node-pty" / "build" / "Release" / "pty.node",
        ]
        missing = [f for f in expected_native_files if not f.exists()]
        if missing:
            print(f"  ! unpacked 残缺, 缺:")
            for f in missing:
                print(f"     - {f}")
            print(f"  ! 先跑 emergency-restore.bat 还原 unpacked")
            raise SystemExit("unpacked 残缺")

        print("  [a] extract...")
        run_loud(["npx", "--yes", "@electron/asar", "extract",
                  str(asar_path), str(extracted)],
                 shell=True)

        index_js = extracted / ".vite" / "build" / "index.js"
        if not index_js.exists():
            raise SystemExit(f"  ! 找不到 {index_js}")

        text = index_js.read_text(encoding="utf-8")
        new_text, n = re.subn(
            re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END),
            '', text, flags=re.DOTALL
        )
        print(f"  [b] 剥掉 {n} 处 L2_APPEND_PATCH marker")

        # Sanity check: 剥 marker 后若产生 ":," 形式空字段值 (字段值替换式注入的副作用),
        # 重打包写回会让 Claude 启动 parse 失败。检测到 → 中止 uninstall, 提示用户改走
        # emergency-restore (字节级还原原版备份, 不依赖剥 marker)。
        # 当前 install.py 用的是重复 key 覆盖策略, 不会触发这条路径; 保留作为兼容性兜底。
        if re.search(r'(?:systemPrompt|appendSystemPrompt):\s*[,)\]}]', new_text):
            for p in [extracted, new_unpacked]:
                if p.exists():
                    shutil.rmtree(p, ignore_errors=True)
            print(f"  ! 剥 marker 后检测到 `systemPrompt:` 或 `appendSystemPrompt:` 后空字段值")
            print(f"  ! 当前 asar 注入策略与本 uninstall 不兼容, 干净卸载不可行")
            print(f"  ! 请跑 emergency-restore.bat 还原原版 (字节级还原, 不会破坏 asar)")
            raise SystemExit("空字段值检测命中, 强制走 emergency-restore")

        index_js.write_text(new_text, encoding="utf-8")

        print("  [c] pack...")
        run_loud(["npx", "--yes", "@electron/asar", "pack",
                  str(extracted), str(new_asar),
                  "--unpack", "*.{node,dll}",
                  "--unpack-dir", "node_modules/node-pty/build/Release"],
                 shell=True)

        if not new_asar.exists() or new_asar.stat().st_size < 10_000_000:
            for p in [extracted, new_unpacked]:
                if p.exists():
                    shutil.rmtree(p, ignore_errors=True)
            if new_asar.exists():
                new_asar.unlink()
            raise SystemExit(f"重打包失败")

        print("\n[5/5] 原子写回...")
        pending = asar_path.parent / "app.asar.pending"
        if pending.exists():
            pending.unlink()
        shutil.copy2(new_asar, pending)
        if new_unpacked.exists():
            robocopy_merge(new_unpacked, cur_unpacked)
        os.replace(str(pending), str(asar_path))
        print(f"  ✓ {asar_path}")

        for p in [extracted, new_unpacked]:
            if p.exists():
                shutil.rmtree(p, ignore_errors=True)
        if new_asar.exists():
            new_asar.unlink()

        print(f"\n  注: claude.exe / fuse 不动 (其他 patch 仍需要 fuse-off, "
              f"或 backup 不完整无法安全还原 fuse-on)")

    # ---- skills 清理 ----
    print("\n[*] 清理 ~/.claude/skills/ 下本档装的 4 个 skill...")
    claude_dir = Path(os.path.expanduser("~/.claude"))
    dst_skills_dir = claude_dir / "skills"
    backup_skills_dir = claude_dir / "skills.tier-3-bak"

    if backup_skills_dir.exists():
        # 有完整备份: 清当前 skills, 把备份合回去
        if dst_skills_dir.exists():
            shutil.rmtree(dst_skills_dir, ignore_errors=True)
            print(f"  删除当前 skills/")
        shutil.move(str(backup_skills_dir), str(dst_skills_dir))
        print(f"  恢复 {backup_skills_dir.name} → skills/")
    else:
        # 无备份: 只删本 tier 装的 4 个 skill, 保留用户其他 skill
        for name in OUR_SKILL_NAMES:
            d = dst_skills_dir / name
            if d.exists():
                shutil.rmtree(d, ignore_errors=True)
                print(f"  删除 skill: {name}")
        if dst_skills_dir.exists() and not any(dst_skills_dir.iterdir()):
            dst_skills_dir.rmdir()
            print(f"  删除空目录 skills/")

    # tier marker 清理
    tier_marker = claude_dir / ".claude-omni-tier"
    if tier_marker.exists():
        cur = tier_marker.read_text(encoding="utf-8").strip()
        if cur == TIER_NAME:
            tier_marker.unlink()
            print(f"  ✓ 删除 tier marker")

    print()
    print("=" * 60)
    print(f"✓ {TIER_NAME} uninstall 完成")
    print("=" * 60)
    print()
    print("如需紧急还原原版 (asar + exe byte-identical), 跑 emergency-restore.bat")
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
