"""
desktop-devtools 紧急还原: 从 _backup/<version>/ byte-identical 还原 asar + claude.exe。

跟 uninstall.bat 的区别:
- emergency 整个 asar + claude.exe 抹回备份, 会同时擦掉同时装着的其他 desktop-* 补丁
- uninstall 走 marker strip 只剥本档 marker, 保留同时装着的其他 desktop-* 补丁

什么时候用 emergency: install / uninstall 出问题、Claude 打不开时,最后兜底。
正常情况优先用 uninstall.bat (会保留其他 desktop-* 补丁不动)。
"""
import sys
import os
import time
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
        sys.exit(1)
    sys.exit(0)


def run_quiet(cmd):
    return subprocess.run(cmd, capture_output=True, text=True,
                          encoding="cp936", errors="replace", check=False)


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
    print("desktop-devtools · 紧急还原 (byte-identical)")
    print("=" * 60)
    print()
    print("WARNING: 这会把 asar 和 claude.exe 整个还原成原版,")
    print("         同时装着的其他补丁 (font / i18n) 会一起被擦掉。")
    print("         Claude 当前能正常用就优先点'卸载', 那个会保留其他补丁。")
    print()

    if os.name != "nt":
        raise SystemExit("只支持 Windows")
    if not is_admin():
        relaunch_as_admin()
        return

    print("[1/4] 定位 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  {src_app}")
    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"
    version_dir = src_app.parent.name

    print(f"\n[2/4] 找 _backup/{version_dir}/...")
    backup_sub = BACKUP_DIR / version_dir
    backup_asar = backup_sub / "app.asar"
    backup_exe = backup_sub / "claude.exe"

    if not backup_sub.exists():
        all_backups = sorted(
            [p for p in BACKUP_DIR.glob("Claude_*_x64__*") if p.is_dir()],
            reverse=True
        ) if BACKUP_DIR.exists() else []
        if all_backups:
            print(f"  ! 当前版本无备份, 仅有: {[p.name for p in all_backups]}")
            print(f"  ! 跨版本备份还原不安全 (asar 内部跟版本绑定)。")
        else:
            print(f"  ! 完全没备份。")
        print(f"  ! 解决: Microsoft Store 卸载并重装 Claude Desktop。")
        raise SystemExit("无备份可还原")

    if not backup_asar.exists() or not backup_exe.exists():
        raise SystemExit(f"备份缺失 asar 或 exe: {backup_sub}")

    print(f"  ✓ asar 备份 ({backup_asar.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  ✓ exe 备份 ({backup_exe.stat().st_size / 1024 / 1024:.1f} MB)")

    print("\n[3/4] 杀进程 + ACL...")
    run_quiet(["taskkill", "/F", "/IM", "claude.exe", "/T"])
    time.sleep(2)
    for target in [claude_exe, asar_path]:
        run_quiet(["takeown", "/F", str(target)])
        run_quiet(["icacls", str(target), "/grant", "administrators:F"])

    print("\n[4/4] byte-identical 还原...")
    shutil.copy2(backup_asar, asar_path)
    print(f"  ✓ {asar_path}")
    shutil.copy2(backup_exe, claude_exe)
    print(f"  ✓ {claude_exe}")

    if asar_path.stat().st_size != backup_asar.stat().st_size:
        raise SystemExit("! asar 大小不匹配")
    if claude_exe.stat().st_size != backup_exe.stat().st_size:
        raise SystemExit("! exe 大小不匹配")

    print()
    print("=" * 60)
    print("✓ 紧急还原完成 — Claude Desktop 应该能正常启动了")
    print("=" * 60)
    print()
    print("如果 Claude 还开不了, 备份本身可能就是错的。")
    print("最后兜底: Microsoft Store 卸载 Claude 重装。")
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
