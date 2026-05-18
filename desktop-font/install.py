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
    # 提权后新进程 cwd 会变成 System32, 相对路径找不到脚本 → 用绝对路径 + 显式 workdir
    script = os.path.abspath(sys.argv[0])
    params = " ".join(f'"{a}"' for a in [script] + sys.argv[1:])
    workdir = os.path.dirname(script)
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, workdir, 1)
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

    # 检查并确保 Node.js / npx 可用，缺了 winget 自动装
    ensure_node_available()

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
    fuse_off_with_retry(claude_exe)

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
