"""
Claude Desktop 汉化补丁 - 卸载脚本（智能版，跟其他 desktop-* 补丁共存）

策略：
- Path A (byte-identical 快路径): asar 里只有本补丁 → 直接 shutil.copy2 备份回当前位置
- Path B (marker strip 慢路径):  asar 里还装着其他补丁 (font 等) → 解 asar →
                                  剥 I18N_PATCH START/END 段 + 还原 jyt() → 重 pack → 写回

两路都会删 resources/zh-CN.json（i18n 独立的资源文件，跟 asar 解耦）。

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

PATCH_START = "// === I18N_PATCH_INPLACE_v1 START ==="
PATCH_END = "// === I18N_PATCH_INPLACE_v1 END ==="
OLD_PATCH_MARKER = "// === I18N_PATCH_INPLACE_v1 ==="  # 单标记格式残留
LOCALE_MARKER = "/* === LOCALE_PATCH_v1 === */"  # 早期注入格式残留

# 检测到这些 marker 之一 → 走 Path B (保留其他补丁)
OTHER_PATCH_MARKERS = [
    "// === FONT_PATCH_INPLACE_v1 START ===",  # desktop-font 主 marker
    "// === FONT_PATCH_INPLACE_v1 ===",          # desktop-font 旧单标记
    "// === FONT_PATCH_v2 ===",                  # desktop-font 早期格式
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


def extract_and_check_others(asar_path: Path):
    """解 asar 到临时目录，看 index.js 里是否还有其他补丁 marker。
    返回 (extracted_dir, has_others: bool)。临时目录留给上层用。"""
    extracted = SCRIPT_DIR / "_extracted_tmp"
    if extracted.exists():
        shutil.rmtree(extracted, ignore_errors=True)
    run(["npx", "--yes", "@electron/asar", "extract", str(asar_path), str(extracted)],
        capture=True, shell=True)

    index_js = extracted / ".vite" / "build" / "index.js"
    if not index_js.exists():
        return extracted, False

    text = index_js.read_text(encoding="utf-8")
    found = [m for m in OTHER_PATCH_MARKERS if m in text]
    if found:
        print(f"  检测到其他补丁标记: {found}")
        return extracted, True
    return extracted, False


def strip_i18n_marker_and_jyt(extracted_dir: Path):
    """从 index.js 里:
    1. 剥 I18N_PATCH START/END 配对段 + 单标记残留 + 早期 LOCALE_MARKER
    2. 还原已 patched 的 jyt() 函数（去掉强制 zh-CN 那段）
    """
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    text = index_js.read_text(encoding="utf-8")
    original = text

    # 1) 剥 START/END 配对块
    text = re.sub(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END) + r'\s*',
        '', text, flags=re.DOTALL
    )

    # 2) 单标记格式残留（仅当后续没有其他补丁 marker 才剥）
    if OLD_PATCH_MARKER in text:
        idx = text.find(OLD_PATCH_MARKER)
        rest = text[idx:]
        if not any(m in rest for m in OTHER_PATCH_MARKERS):
            cut = text.rfind("\n", 0, idx)
            text = text[:cut].rstrip() if cut != -1 else text[:idx].rstrip()

    # 3) 早期 LOCALE_MARKER 残留
    if LOCALE_MARKER in text:
        idx = text.find(LOCALE_MARKER)
        end = text.find("\n", idx)
        if end != -1:
            end2 = text.find("\n", end + 1)
            if end2 != -1:
                text = text[:idx] + text[end2 + 1:]
            else:
                text = text[:idx]
        else:
            text = text[:idx]

    # 4) 还原 jyt() 函数：去掉 try{locale="zh-CN";}catch(_e){} 那段
    text = re.sub(
        r'(function\s+\w+\s*\(\s*(\w+)\s*\)\s*\{)try\{\2="zh-CN";\}catch\(_e\)\{\}(return\s+\w+\(\{locale:\2,messages:JSON\.parse)',
        r'\1\3', text
    )

    if text == original:
        print("  [警告] 没找到 I18N_PATCH marker / jyt 注入 —— asar 里可能压根没本补丁，或 marker 损坏")
    else:
        index_js.write_text(text.rstrip() + "\n", encoding="utf-8")
        print("  剥 I18N_PATCH marker + 还原 jyt() 完成")


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
    print("Claude Desktop 汉化补丁 - 卸载（智能版）")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限，正在请求提权...")
        relaunch_as_admin()
        return

    if not BACKUP_DIR.exists():
        print(f"找不到备份目录: {BACKUP_DIR}")
        input("按回车退出...")
        return

    version_dir, src_app = find_claude_app()
    print(f"\n当前 Claude 版本目录: {version_dir}")

    sub = BACKUP_DIR / version_dir
    if not sub.exists():
        backups = [d for d in BACKUP_DIR.iterdir() if d.is_dir()]
        if not backups:
            print("备份目录里啥也没有。")
            input("按回车退出...")
            return
        backups.sort(key=lambda d: d.name, reverse=True)
        sub = backups[0]
        print(f"当前版本没找到匹配备份，用最近的: {sub.name}")

    exe_bak = sub / "claude.exe"
    asar_bak = sub / "app.asar"
    if not exe_bak.exists() or not asar_bak.exists():
        print(f"备份文件缺失: {sub}")
        input("按回车退出...")
        return

    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"
    zh_path = src_app / "resources" / "zh-CN.json"

    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    print("\n关 Claude...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    print("拿文件权限...")
    for target in [claude_exe, asar_path, src_app / "resources"]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)

    print("\n检测当前 asar 里是否还装着其他补丁...")
    extracted, has_others = extract_and_check_others(asar_path)

    if not has_others:
        # Path A: 没其他补丁，byte-identical 快路径
        print("\n[Path A] 没有其他补丁，直接 byte-identical 还原备份")
        shutil.rmtree(extracted, ignore_errors=True)
        print("  还原 claude.exe...")
        shutil.copy2(exe_bak, claude_exe)
        print("  还原 app.asar...")
        shutil.copy2(asar_bak, asar_path)
        path_taken = "Path A (byte-identical)"
    else:
        # Path B: 还有其他补丁，剥本 marker + 还原 jyt 后重 pack
        print("\n[Path B] 检测到其他补丁，只剥 I18N_PATCH 标记 + 还原 jyt()，保留其他补丁")
        print("  还原 claude.exe...")
        shutil.copy2(exe_bak, claude_exe)
        strip_i18n_marker_and_jyt(extracted)
        repack_and_write(extracted, asar_path)
        path_taken = "Path B (marker strip + jyt 还原)"

    # 不论 Path A/B 都删 resources/zh-CN.json（i18n 独立资源文件）
    if zh_path.exists():
        try:
            print(f"\n删 resources/zh-CN.json...")
            zh_path.unlink()
        except Exception as e:
            print(f"  [警告] 删除失败: {e}")

    print()
    print("=" * 60)
    print(f"✓ 已卸载汉化补丁 - {path_taken}")
    print("=" * 60)
    print()
    if has_others:
        print("其他补丁保留，未受影响。")
    else:
        print("原版已 byte-identical 还原。")
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
