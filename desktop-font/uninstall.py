"""
Claude Desktop 字体补丁 - 卸载脚本
- 用 _backup/<版本号>/ 里的 claude.exe 和 app.asar 还原 WindowsApps 安装目录
- 不卸思源宋体（不痛不痒，留着也行；要卸自己进 Win+R fonts 卸）

要求：管理员权限
"""
import sys
import os
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
    params = " ".join([f'"{a}"' for a in sys.argv])
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
    if ret <= 32:
        sys.exit(1)
    sys.exit(0)


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
    return candidates[0][0], candidates[0][1]  # 返回版本目录名 + app 路径


def main():
    print("=" * 60)
    print("Claude Desktop 字体补丁 - 卸载")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限，正在请求提权...")
        relaunch_as_admin()
        return

    if not BACKUP_DIR.exists():
        print(f"找不到备份目录: {BACKUP_DIR}")
        print("可能你从未装过补丁，或者 _backup/ 被你删了。")
        input("按回车退出...")
        return

    version_dir, src_app = find_claude_app()
    print(f"\n当前 Claude 版本目录: {version_dir}")

    sub = BACKUP_DIR / version_dir
    if not sub.exists():
        # 找最近的备份
        backups = [d for d in BACKUP_DIR.iterdir() if d.is_dir()]
        if not backups:
            print(f"备份目录里啥也没有。")
            input("按回车退出...")
            return
        backups.sort(key=lambda d: d.name, reverse=True)
        sub = backups[0]
        print(f"当前版本没找到匹配备份，用最近的: {sub.name}")
    else:
        print(f"用对应备份: {sub}")

    exe_bak = sub / "claude.exe"
    asar_bak = sub / "app.asar"

    if not exe_bak.exists() or not asar_bak.exists():
        print(f"备份文件缺失: {sub}")
        input("按回车退出...")
        return

    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"

    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    print("\n关 Claude...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    print("拿文件权限...")
    for target in [claude_exe, asar_path]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)

    print("还原 claude.exe...")
    shutil.copy2(exe_bak, claude_exe)
    print("还原 app.asar...")
    shutil.copy2(asar_bak, asar_path)

    print()
    print("=" * 60)
    print("✓ 已恢复原版。")
    print("=" * 60)
    print()
    print("思源宋体没卸（无痛留着）。要卸自己进 Win+R -> fonts 删。")
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
        input("\n出错了，按回车退出...")
