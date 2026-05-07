"""
Claude Desktop 字体补丁 - 卸载脚本（marker strip 单路径，跟其他 desktop-* 补丁共存）

策略：永远走 marker strip —— 解 asar → 剥 FONT_PATCH START/END 段 → 重 pack → 写回。
       claude.exe 不动（保持当前 fuse-off 状态以匹配 asar，跟其他补丁兼容）。
       不依赖 _backup（备份在装本补丁之前可能已经被其他补丁污染过，不可信）。

完全擦回原版用 emergency-restore.bat（那个会同时擦掉所有其他 desktop-* 补丁，单独兜底入口）。

要求：管理员权限。依赖：Python 3、Node.js（npx 调 @electron/asar）
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

PATCH_START = "// === FONT_PATCH_INPLACE_v1 START ==="
PATCH_END = "// === FONT_PATCH_INPLACE_v1 END ==="
OLD_PATCH_MARKER = "// === FONT_PATCH_INPLACE_v1 ==="  # 单标记格式残留

# 这些 marker 出现 → 单标记残留剥时跳过（避免误伤其他补丁）
OTHER_PATCH_MARKERS = [
    "// === I18N_PATCH_INPLACE_v1 START ===",  # desktop-i18n 主 marker
    "// === I18N_PATCH_INPLACE_v1 ===",          # desktop-i18n 旧单标记
    "/* === LOCALE_PATCH_v1 === */",             # desktop-i18n 早期格式
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


def run(cmd, check=True, capture=False, shell=False):
    if isinstance(cmd, list):
        printable = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in cmd)
    else:
        printable = cmd
    print(f"  > {printable[:200]}")
    if capture:
        r = subprocess.run(cmd, capture_output=True, text=True, shell=shell, encoding="utf-8", errors="replace")
        if check and r.returncode != 0:
            print(f"  ! 失败 (rc={r.returncode}) stderr: {r.stderr[:300]}")
            raise SystemExit(1)
        return r
    else:
        r = subprocess.run(cmd, shell=shell)
        if check and r.returncode != 0:
            raise SystemExit(f"  ! 失败 (rc={r.returncode})")
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
    return candidates[0][0], candidates[0][1]


def extract_asar(asar_path: Path) -> Path:
    """解 asar 到临时目录, 返回路径。"""
    extracted = SCRIPT_DIR / "_extracted_tmp"
    if extracted.exists():
        shutil.rmtree(extracted, ignore_errors=True)
    run(["npx", "--yes", "@electron/asar", "extract", str(asar_path), str(extracted)],
        capture=True, shell=True)
    return extracted


def index_js_has_font_marker(extracted_dir: Path) -> bool:
    """看 index.js 里是否还有 FONT_PATCH 相关 marker。没有就跳过 strip。"""
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    if not index_js.exists():
        return False
    text = index_js.read_text(encoding="utf-8")
    return (PATCH_START in text) or (OLD_PATCH_MARKER in text)


def strip_font_marker(extracted_dir: Path):
    """从 index.js 里剥 FONT_PATCH START/END 配对段（同时清单标记残留）。"""
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    text = index_js.read_text(encoding="utf-8")
    original = text

    # 1) 剥 START/END 配对块
    text = re.sub(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END) + r'\s*',
        '', text, flags=re.DOTALL
    )

    # 2) 清单标记格式残留（仅当后续没有其他补丁 marker 才剥，避免误伤）
    if OLD_PATCH_MARKER in text:
        idx = text.find(OLD_PATCH_MARKER)
        rest = text[idx:]
        if not any(m in rest for m in OTHER_PATCH_MARKERS):
            cut = text.rfind("\n", 0, idx)
            text = text[:cut].rstrip() if cut != -1 else text[:idx].rstrip()

    if text == original:
        print("  [警告] 没找到 FONT_PATCH marker —— asar 里可能压根没本补丁，或 marker 损坏")
    else:
        index_js.write_text(text.rstrip() + "\n", encoding="utf-8")
        print("  剥 FONT_PATCH marker 完成")


def repack_and_write(extracted_dir: Path, asar_path: Path):
    """重 pack asar 写回原位置。"""
    new_asar = SCRIPT_DIR / "_app.asar.new"
    if new_asar.exists():
        new_asar.unlink()
    new_unpacked = SCRIPT_DIR / "_app.asar.new.unpacked"
    if new_unpacked.exists():
        shutil.rmtree(new_unpacked, ignore_errors=True)

    run(["npx", "--yes", "@electron/asar", "pack",
         str(extracted_dir), str(new_asar),
         "--unpack", "*.{node,dll}",
         "--unpack-dir", "node_modules/node-pty/build/Release"],
        capture=True, shell=True)

    if not new_asar.exists() or new_asar.stat().st_size < 20_000_000:
        size = new_asar.stat().st_size if new_asar.exists() else 0
        raise SystemExit(f"重打包失败：新 asar {size} 字节，远小于预期。原文件未动。")

    shutil.copy2(new_asar, asar_path)
    shutil.rmtree(extracted_dir, ignore_errors=True)
    new_asar.unlink(missing_ok=True)
    if new_unpacked.exists():
        shutil.rmtree(new_unpacked, ignore_errors=True)
    print(f"  写入 {asar_path} 完成")


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

    version_dir, src_app = find_claude_app()
    print(f"\n当前 Claude 版本目录: {version_dir}")

    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"

    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    print("\n关 Claude...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    print("拿文件权限...")
    for target in [claude_exe, asar_path]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)

    print("\n解 asar、剥 FONT_PATCH 标记、重 pack...")
    extracted = extract_asar(asar_path)

    if not index_js_has_font_marker(extracted):
        print("  index.js 里没找到 FONT_PATCH marker —— 看起来本补丁没装,或之前已经卸过。直接退出。")
        shutil.rmtree(extracted, ignore_errors=True)
        input("按回车退出...")
        return

    strip_font_marker(extracted)
    repack_and_write(extracted, asar_path)
    # 注意: claude.exe 不还原, 保持当前 fuse-off 状态。
    # 备份 _backup 留着不碰 (emergency-restore 单独的兜底入口才用它)。

    print()
    print("=" * 60)
    print("✓ 已卸载字体补丁 (marker strip)")
    print("=" * 60)
    print()
    print("其他装着的 desktop-* 补丁保留, 未受影响。")
    print("如需完整擦回原版 (会同时擦掉所有其他 desktop-* 补丁),")
    print("用 emergency-restore.bat。")
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
