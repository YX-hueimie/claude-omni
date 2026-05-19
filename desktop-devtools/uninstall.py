"""
Claude Desktop DevTools 补丁 - 卸载脚本

走外科手术式: 只剥掉 DEVTOOLS_PATCH_v1 START..END 这一段,
其他补丁 (i18n / font 等) 不动。

要求: 管理员权限
依赖: Python 3、Node.js (npx 调 @electron/asar)
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

PATCH_START = "// === DEVTOOLS_PATCH_v1 START ==="
PATCH_END = "// === DEVTOOLS_PATCH_v1 END ==="


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


def run(cmd, check=True, capture=False, shell=False):
    if isinstance(cmd, list):
        printable = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in cmd)
    else:
        printable = cmd
    print(f"  > {printable[:200]}")
    if capture:
        r = subprocess.run(cmd, capture_output=True, text=True, shell=shell, encoding="utf-8", errors="replace")
        if check and r.returncode != 0:
            print(f"  ! 失败 (returncode={r.returncode})")
            print(f"  stdout: {r.stdout[:500]}")
            print(f"  stderr: {r.stderr[:500]}")
            raise SystemExit(1)
        return r
    else:
        r = subprocess.run(cmd, shell=shell)
        if check and r.returncode != 0:
            raise SystemExit(f"  ! 失败 (returncode={r.returncode})")
        return r


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


def strip_devtools_patch(extracted_dir: Path):
    """从 .vite/build/index.js 里剥掉 DEVTOOLS_PATCH_v1 START..END 块"""
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    text = index_js.read_text(encoding="utf-8")

    if PATCH_START not in text:
        print("  index.js 里没找到 DEVTOOLS_PATCH_v1 标记 — 可能没装过, 或者 i18n 卸载时已经一起还原。")
        return False

    new_text = re.sub(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END) + r'\s*',
        '', text, flags=re.DOTALL
    ).rstrip() + "\n"
    index_js.write_text(new_text, encoding="utf-8")
    print(f"  剥掉 DEVTOOLS_PATCH_v1 块完成")
    return True


def main():
    print("=" * 60)
    print("Claude Desktop DevTools 补丁 - 卸载")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限, 正在请求提权...")
        relaunch_as_admin()
        return

    print("\n[1/3] 找最新版 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  找到: {src_app}")
    asar_path = src_app / "resources" / "app.asar"

    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    print("\n[2/3] 关 Claude + 拿权限...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)
    subprocess.run(["takeown", "/F", str(asar_path)], **SP_ENC)
    subprocess.run(["icacls", str(asar_path), "/grant", "administrators:F"], **SP_ENC)

    print("\n[3/3] 解 app.asar、剥 DevTools 钩子、重新打包...")
    extracted = SCRIPT_DIR / "_extracted_tmp"
    if extracted.exists():
        shutil.rmtree(extracted, ignore_errors=True)
    run(["npx", "--yes", "@electron/asar", "extract", str(asar_path), str(extracted)],
        capture=True, shell=True)

    found = strip_devtools_patch(extracted)

    if not found:
        shutil.rmtree(extracted, ignore_errors=True)
        print("\n啥也没改。")
        input("按回车退出...")
        return

    new_asar = SCRIPT_DIR / "_app.asar.new"
    if new_asar.exists():
        new_asar.unlink()
    new_unpacked = SCRIPT_DIR / "_app.asar.new.unpacked"
    if new_unpacked.exists():
        shutil.rmtree(new_unpacked, ignore_errors=True)
    run(["npx", "--yes", "@electron/asar", "pack",
         str(extracted), str(new_asar),
         "--unpack", "*.{node,dll}",
         "--unpack-dir", "node_modules/node-pty/build/Release"],
        capture=True, shell=True)

    if not new_asar.exists() or new_asar.stat().st_size < 20_000_000:
        size = new_asar.stat().st_size if new_asar.exists() else 0
        raise SystemExit(f"重打包失败: 新 asar {size} 字节, 远小于预期。原文件未动。")

    shutil.copyfile(new_asar, asar_path)
    shutil.rmtree(extracted, ignore_errors=True)
    new_asar.unlink(missing_ok=True)
    if new_unpacked.exists():
        shutil.rmtree(new_unpacked, ignore_errors=True)

    print()
    print("=" * 60)
    print("✓ DevTools 钩子已剥除。")
    print("=" * 60)
    print()
    print("注意: claude.exe 的 fuse 不还原 (i18n / font 等其他补丁可能仍需 fuse 关闭)。")
    print("      如果想字节级还原 claude.exe + app.asar, 跑 desktop-i18n/uninstall.bat (它从 backup 整体还原)。")
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
