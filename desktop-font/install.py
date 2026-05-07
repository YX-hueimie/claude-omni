"""
Claude Desktop 字体补丁 - 原地修改 WindowsApps 安装目录
不复制副本，直接改原版，所以 Cowork 还能用。

工作流程：
1. 装思源宋体到当前用户字体目录（可选，已装就跳）
2. 找 WindowsApps 里最新版 Claude（自动识别版本）
3. 强杀所有 claude.exe 进程
4. takeown + icacls 拿权限
5. 备份原版 claude.exe 和 app.asar 到本目录的 _backup/
6. 关掉 claude.exe 的 EnableEmbeddedAsarIntegrityValidation fuse
7. 解开 app.asar，在 .vite/build/index.js 末尾追加 web-contents-created 钩子注入字体 CSS
8. 重新打包 app.asar 替换原文件

每次 Claude 升级（版本号变了）后再跑一遍即可——脚本自动找最新版。

要求：管理员权限（脚本会自动提权）。
依赖：Python 3、Node.js（npx 调 @electron/asar 和 @electron/fuses）

License: MIT
"""
import sys
import os
import subprocess
import shutil
import json
import ctypes
import urllib.request
from pathlib import Path

# panel-compat: panel 调用时把 input() 变 no-op, 避免阻塞
if os.environ.get('CLAUDE_OMNI_PANEL'):
    import builtins
    builtins.input = lambda *a, **kw: ''

SCRIPT_DIR = Path(__file__).parent.resolve()
WINDOWSAPPS = Path(r"C:\Program Files\WindowsApps")
FONT_CACHE = SCRIPT_DIR / "_font_cache"
BACKUP_DIR = SCRIPT_DIR / "_backup"
USER_FONTS = Path(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts"))

# 思源宋体（Source Han Serif CN）—— 开源中文衬线字体，跟 Anthropic Serif 风格搭
SOURCE_HAN_FONTS = [
    {
        "filename": "SourceHanSerifCN-Light.otf",
        "reg_name": "Source Han Serif CN Light (OpenType)",
        "url": "https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-serif@release/SubsetOTF/CN/SourceHanSerifCN-Light.otf",
    },
    {
        "filename": "SourceHanSerifCN-Regular.otf",
        "reg_name": "Source Han Serif CN Regular (OpenType)",
        "url": "https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-serif@release/SubsetOTF/CN/SourceHanSerifCN-Regular.otf",
    },
    {
        "filename": "SourceHanSerifCN-Bold.otf",
        "reg_name": "Source Han Serif CN Bold (OpenType)",
        "url": "https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-serif@release/SubsetOTF/CN/SourceHanSerifCN-Bold.otf",
    },
]

PATCH_START = "// === FONT_PATCH_INPLACE_v1 START ==="
PATCH_END = "// === FONT_PATCH_INPLACE_v1 END ==="
OLD_PATCH_MARKER = "// === FONT_PATCH_INPLACE_v1 ==="  # 单标记格式 (无 START/END 配对), 用于残留检测

CSS = (
    "@font-face { font-family: 'CustomCJKSerif'; "
    "src: local('SourceHanSerifCN-Light'), local('Source Han Serif CN Light'); "
    "font-weight: 100 600; font-style: normal; } "
    "@font-face { font-family: 'CustomCJKSerif'; "
    "src: local('SourceHanSerifCN-Bold'), local('Source Han Serif CN Bold'), "
    "local('SourceHanSerifCN-Regular'), local('Source Han Serif CN Regular'); "
    "font-weight: 601 1000; font-style: normal; } "
    ":root, .darkTheme { "
    "--font-sans: 'Anthropic Serif', Georgia, "
    "'CustomCJKSerif', 'Source Han Serif SC', 'Source Han Serif CN', 'Noto Serif SC', "
    "'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', sans-serif !important; "
    "} "
    "*:not(svg):not([style*=\"anthropicons\" i])"
    ":not([style*=\"Anthropicons-Variable\"])"
    ":not([class*=\"icon\" i]):not([class*=\"Icon\"])"
    ":not(i):not([data-icon]):not([class*=\"lucide\" i])"
    " { "
    "font-family: 'Anthropic Serif', Georgia, "
    "'CustomCJKSerif', 'Source Han Serif SC', 'Source Han Serif CN', 'Noto Serif SC', "
    "'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', sans-serif !important; "
    "}"
)


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def relaunch_as_admin():
    params = " ".join([f'"{a}"' for a in sys.argv])
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
    if ret <= 32:
        print(f"[错误] 提权失败 (ShellExecute ret={ret})")
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
    """找 WindowsApps 里最新的 Claude_xxx_x64__xxx 目录。"""
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


def make_append_js():
    css_js = json.dumps(CSS)
    return f"""
{PATCH_START}
;(function(){{
  try {{
    var electron = require('electron');
    if (!electron || !electron.app) return;
    var CSS = {css_js};
    var injectCSS = function(wc) {{
      if (!wc || wc.isDestroyed()) return;
      try {{ wc.insertCSS(CSS); }} catch(e) {{}}
    }};
    electron.app.on('web-contents-created', function(event, wc) {{
      wc.on('dom-ready', function() {{ injectCSS(wc); }});
      wc.on('did-finish-load', function() {{ injectCSS(wc); }});
      wc.on('did-frame-finish-load', function() {{ injectCSS(wc); }});
      wc.on('did-stop-loading', function() {{ injectCSS(wc); }});
    }});
    console.log('[FONT_PATCH_INPLACE] hook installed');
  }} catch(err) {{
    console.error('[FONT_PATCH_INPLACE] failed to install hook:', err);
  }}
}})();
{PATCH_END}
"""


def patch_index_js(extracted_dir: Path):
    """末尾追加字体 CSS hook，剥旧 patch（如果在）"""
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    text = index_js.read_text(encoding="utf-8")

    import re as _re
    # 1) 剥 START/END 配对 marker 包夹的本档注入块, 只动 FONT_PATCH 段, 不影响其他补丁
    text = _re.sub(
        _re.escape(PATCH_START) + r'.*?' + _re.escape(PATCH_END) + r'\s*',
        '', text, flags=_re.DOTALL
    )
    # 2) 单标记格式残留检测: 仅在标记后再无其他已知补丁 marker 时才剥, 避免误伤 i18n / locale
    other_known_markers = [
        "// === I18N_PATCH_INPLACE_v1 START ===",
        "// === I18N_PATCH_INPLACE_v1 ===",
        "/* === LOCALE_PATCH_v1 === */",
    ]
    for marker in [OLD_PATCH_MARKER, "// === FONT_PATCH_v2 ===", "// === FONT_PATCH ==="]:
        if marker in text:
            idx = text.find(marker)
            rest = text[idx:]
            if not any(m in rest for m in other_known_markers):
                cut = text.rfind("\n", 0, idx)
                text = text[:cut].rstrip() if cut != -1 else text[:idx].rstrip()

    new = text.rstrip() + make_append_js()
    index_js.write_text(new, encoding="utf-8")


def step(n, total, msg):
    print(f"\n[{n}/{total}] {msg}")


def install_chinese_fonts():
    """下载并安装思源宋体到当前用户字体目录。已装的字体跳过。"""
    import winreg

    USER_FONTS.mkdir(parents=True, exist_ok=True)
    FONT_CACHE.mkdir(parents=True, exist_ok=True)

    try:
        reg_key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts",
            0, winreg.KEY_READ
        )
        installed = set()
        i = 0
        while True:
            try:
                installed.add(winreg.EnumValue(reg_key, i)[0])
                i += 1
            except OSError:
                break
        winreg.CloseKey(reg_key)
    except Exception:
        installed = set()

    any_installed = False
    for font in SOURCE_HAN_FONTS:
        if font["reg_name"] in installed:
            print(f"  ✓ {font['filename']} 已注册，跳过")
            continue

        cache = FONT_CACHE / font["filename"]
        if not cache.exists() or cache.stat().st_size < 1_000_000:
            print(f"  下载 {font['filename']}（约 11 MB）...", end="", flush=True)
            try:
                urllib.request.urlretrieve(font["url"], cache)
                print(f" ✓ {cache.stat().st_size // 1024} KB")
            except Exception as e:
                print(f" ✗ 失败: {e}")
                continue

        dst = USER_FONTS / font["filename"]
        try:
            shutil.copy2(cache, dst)
        except Exception as e:
            print(f"  [警告] 复制 {dst} 失败: {e}")
            continue

        try:
            reg_key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts",
                0, winreg.KEY_SET_VALUE
            )
            winreg.SetValueEx(reg_key, font["reg_name"], 0, winreg.REG_SZ, str(dst))
            winreg.CloseKey(reg_key)
        except Exception as e:
            print(f"  [警告] 写注册表失败: {e}")
            continue

        try:
            ctypes.windll.gdi32.AddFontResourceW(str(dst))
        except Exception:
            pass

        print(f"  ✓ 装好 {font['filename']}")
        any_installed = True

    if any_installed:
        try:
            HWND_BROADCAST = 0xFFFF
            WM_FONTCHANGE = 0x001D
            ctypes.windll.user32.PostMessageW(HWND_BROADCAST, WM_FONTCHANGE, 0, 0)
        except Exception:
            pass


def backup_originals(claude_exe: Path, asar_path: Path):
    """备份原版到本目录的 _backup/，按版本号区分目录避免覆盖。"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    # 用 app 目录的爹（含版本号）作为子目录名
    version_dir = claude_exe.parent.parent.name  # 如 Claude_1.5354.0.0_x64__pzs8sxrjxfjjc
    sub = BACKUP_DIR / version_dir
    sub.mkdir(parents=True, exist_ok=True)

    exe_bak = sub / "claude.exe"
    asar_bak = sub / "app.asar"
    if not exe_bak.exists():
        print(f"  备份 claude.exe -> {exe_bak}")
        shutil.copy2(claude_exe, exe_bak)
    else:
        print(f"  ✓ {exe_bak.name} 已备份过，跳过")
    if not asar_bak.exists():
        print(f"  备份 app.asar -> {asar_bak}")
        shutil.copy2(asar_path, asar_bak)
    else:
        print(f"  ✓ {asar_bak.name} 已备份过，跳过")
    return sub


def main():
    print("=" * 60)
    print("Claude Desktop 字体补丁 (原地版本，Cowork 兼容)")
    print("=" * 60)
    print()
    print("注意: 首次安装需联网，会从 jsdelivr CDN 下载思源宋体（约 33 MB）到")
    print("      本目录的 _font_cache/，再注册到当前用户字体目录")
    print("      （%LOCALAPPDATA%\\Microsoft\\Windows\\Fonts，无需管理员）。")
    print("      如果国内网络访问 jsdelivr 困难，请挂代理或先手动下载思源宋体放到 _font_cache/。")
    print()

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限，正在请求提权...")
        relaunch_as_admin()
        return

    TOTAL = 7

    step(1, TOTAL, "安装思源宋体（中文衬线字体）...")
    install_chinese_fonts()

    step(2, TOTAL, "找最新版 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  找到: {src_app}")

    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"

    # subprocess 输出用 cp936（中文 Windows 系统命令默认）+ errors=replace 避免乱码炸
    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    step(3, TOTAL, "强杀所有 claude.exe 进程...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    step(4, TOTAL, "拿文件权限（takeown + icacls）...")
    for target in [claude_exe, asar_path]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)

    step(5, TOTAL, "备份原版到 _backup/...")
    sub_backup = backup_originals(claude_exe, asar_path)
    print(f"  备份目录: {sub_backup}")

    step(6, TOTAL, "关 claude.exe 的 ASAR 完整性 fuse...")
    run(["npx", "--yes", "@electron/fuses", "write",
         "--app", str(claude_exe),
         "EnableEmbeddedAsarIntegrityValidation=off"],
        capture=True, shell=True)

    step(7, TOTAL, "解 app.asar、注入 CSS、重新打包...")
    extracted = SCRIPT_DIR / "_extracted_tmp"
    if extracted.exists():
        shutil.rmtree(extracted, ignore_errors=True)
    run(["npx", "--yes", "@electron/asar", "extract", str(asar_path), str(extracted)],
        capture=True, shell=True)

    patch_index_js(extracted)

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
        raise SystemExit(f"重打包失败：新 asar {size} 字节，远小于预期。原文件未动。")

    shutil.copy2(new_asar, asar_path)
    shutil.rmtree(extracted, ignore_errors=True)
    new_asar.unlink(missing_ok=True)
    if new_unpacked.exists():
        shutil.rmtree(new_unpacked, ignore_errors=True)
    print(f"  写入 {asar_path} 完成。")

    print()
    print("=" * 60)
    print("✓ 全部完成。")
    print("=" * 60)
    print()
    print("启动 Claude Desktop（任务栏 / 开始菜单都行）应该就能看到字体改了。")
    print("Cowork 不受影响（动的是原版文件夹，native messaging 注册没变）。")
    print()
    print("注意: 首次启动 Claude 会弹\"未知发布者\"警告（数字签名失效，是改 asar 的代价），")
    print("      点\"仍要运行\"即可，后续不再弹。")
    print()
    print("Claude 升级后字体没了？再跑一次本脚本即可——会自动找新版本。")
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
