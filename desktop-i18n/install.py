"""
Claude Desktop 汉化补丁 - 原地修改 WindowsApps 安装目录
不复制副本，直接改原版，所以 Cowork 还能用。

工作流程：
1. 找 WindowsApps 里最新版 Claude（自动识别版本）
2. 强杀所有 claude.exe 进程
3. takeown + icacls 拿权限
4. 备份原版 claude.exe 和 app.asar 到本目录的 _backup/
5. 关掉 claude.exe 的 EnableEmbeddedAsarIntegrityValidation fuse
6. 解开 app.asar：
   - 在 .vite/build/index.js 里 patch jyt(locale) 函数体——强制加载 zh-CN.json（外壳菜单/对话框等汉化）
   - 末尾追加 web-contents-created 钩子，把 zh-CN-webview.js 注入到 claude.ai webview（聊天 UI 汉化）
7. 把 zh-CN.json 拷到 resources/
8. 重新打包 app.asar 替换原文件

每次 Claude 升级（版本号变了）后再跑一遍即可——脚本自动找最新版。

要求：管理员权限（脚本会自动提权）。
依赖：Python 3、Node.js（npx 调 @electron/asar 和 @electron/fuses）

License: MIT
"""
import sys
import os
import re
import subprocess
import shutil
import json
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
# 单标记格式 (无 START/END 配对): 仅在 index.js 末尾剥, 避免误伤其他补丁
OLD_PATCH_MARKER = "// === I18N_PATCH_INPLACE_v1 ==="
LOCALE_MARKER = "/* === LOCALE_PATCH_v1 === */"  # 早期注入格式, 用于残留检测


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
    """生成主进程的 hook，把 zh-CN-webview.js 注入到每个 claude.ai webview。"""
    webview_path = SCRIPT_DIR / "zh-CN-webview.js"
    if not webview_path.exists():
        raise SystemExit(f"找不到 {webview_path}")
    webview_js = json.dumps(webview_path.read_text(encoding="utf-8"))
    return f"""
{PATCH_START}
;(function(){{
  try {{
    var electron = require('electron');
    if (!electron || !electron.app) return;
    var WEBVIEW_SCRIPT = {webview_js};

    var injectI18n = function(wc) {{
      if (!wc || wc.isDestroyed()) return;
      if (wc.__i18nInjected) return;
      try {{
        var url = wc.getURL();
        if (!url || url.indexOf('claude.ai') === -1) return;
        wc.__i18nInjected = true;
        wc.executeJavaScript(WEBVIEW_SCRIPT, true)
          .catch(function(e) {{
            wc.__i18nInjected = false;
            console.error('[I18N exec err]', e && e.message);
          }});
      }} catch(e) {{
        console.error('[I18N hook err]', e);
      }}
    }};

    electron.app.on('web-contents-created', function(event, wc) {{
      wc.on('dom-ready', function() {{ injectI18n(wc); }});
      wc.on('did-finish-load', function() {{ injectI18n(wc); }});
      wc.on('did-navigate', function() {{ wc.__i18nInjected = false; }});
      wc.on('did-navigate-in-page', function() {{ wc.__i18nInjected = false; }});
    }});
    console.log('[I18N_PATCH] hook installed');
  }} catch(err) {{
    console.error('[I18N_PATCH] failed to install hook:', err);
  }}
}})();
{PATCH_END}
"""


def patch_index_js(extracted_dir: Path):
    """
    1. patch jyt(locale) 函数：强制 locale = "zh-CN"——让外壳所有 i18n 调用都加载 zh-CN.json
    2. 末尾追加 web-contents-created 钩子注入 webview 汉化脚本
    """
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    text = index_js.read_text(encoding="utf-8")

    # 1) 剥 START/END 配对 marker 包夹的本档注入块, 只动 I18N_PATCH 段, 不影响其他补丁
    text = re.sub(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END) + r'\s*',
        '', text, flags=re.DOTALL
    )
    # 2) 单标记格式残留检测: 仅在标记后再无其他已知补丁 marker 时才剥, 避免误伤 font 等
    other_known_markers = [
        "// === FONT_PATCH_INPLACE_v1 START ===",
        "// === FONT_PATCH_INPLACE_v1 ===",
        "// === FONT_PATCH_v2 ===",
    ]
    if OLD_PATCH_MARKER in text:
        idx = text.find(OLD_PATCH_MARKER)
        rest = text[idx:]
        if not any(m in rest for m in other_known_markers):
            cut = text.rfind("\n", 0, idx)
            text = text[:cut].rstrip() if cut != -1 else text[:idx].rstrip()
    # 3) 旧 LOCALE_MARKER（更老格式）
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

    # 还原已 patched 的 jyt（处理重复运行）
    text = re.sub(
        r'(function\s+\w+\s*\(\s*(\w+)\s*\)\s*\{)try\{\2="zh-CN";\}catch\(_e\)\{\}(return\s+\w+\(\{locale:\2,messages:JSON\.parse)',
        r'\1\3', text
    )

    # 关键 patch：jyt(locale) 函数体强制 locale = "zh-CN"
    pat = re.compile(
        r'(function\s+(\w+)\s*\(\s*(\w+)\s*\)\s*\{)(return\s+\w+\(\{locale:\3,messages:JSON\.parse)'
    )
    matches = pat.findall(text)
    if matches:
        text = pat.sub(
            lambda m: f'{m.group(1)}try{{{m.group(3)}="zh-CN";}}catch(_e){{}}{m.group(4)}',
            text, count=1
        )
        print(f"  patch jyt 成功（强制加载 zh-CN.json，{len(matches)} 个匹配）")
    else:
        print("  [警告] 没找到 jyt(locale) 函数模式——版本变了？外壳汉化可能不生效")

    new = text.rstrip() + make_append_js()
    index_js.write_text(new, encoding="utf-8")


def step(n, total, msg):
    print(f"\n[{n}/{total}] {msg}")


def backup_originals(claude_exe: Path, asar_path: Path):
    """备份原版到本目录的 _backup/<版本号>/。"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    version_dir = claude_exe.parent.parent.name
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
    print("Claude Desktop 汉化补丁 (原地版本，Cowork 兼容)")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限，正在请求提权...")
        relaunch_as_admin()
        return

    # 检查必需文件
    if not (SCRIPT_DIR / "zh-CN.json").exists():
        raise SystemExit(f"缺少 zh-CN.json: {SCRIPT_DIR}")
    if not (SCRIPT_DIR / "zh-CN-webview.js").exists():
        raise SystemExit(f"缺少 zh-CN-webview.js: {SCRIPT_DIR}")

    TOTAL = 7

    step(1, TOTAL, "找最新版 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  找到: {src_app}")
    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"

    # subprocess 输出用 cp936（中文 Windows 系统命令默认）+ errors=replace 避免乱码炸
    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    step(2, TOTAL, "强杀所有 claude.exe 进程...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    step(3, TOTAL, "拿文件权限（takeown + icacls）...")
    resources_dir = src_app / "resources"
    # 单文件
    for target in [claude_exe, asar_path]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)
    # 文件夹要递归 (/R /D Y) 并 grant 整个目录树 (/T /C)——后面要在 resources/ 里头新建 zh-CN.json
    subprocess.run(["takeown", "/F", str(resources_dir), "/R", "/D", "Y"], **SP_ENC)
    subprocess.run(["icacls", str(resources_dir), "/grant", "administrators:F", "/T", "/C"], **SP_ENC)

    step(4, TOTAL, "备份原版到 _backup/...")
    sub_backup = backup_originals(claude_exe, asar_path)
    print(f"  备份目录: {sub_backup}")

    step(5, TOTAL, "关 claude.exe 的 ASAR 完整性 fuse...")
    run(["npx", "--yes", "@electron/fuses", "write",
         "--app", str(claude_exe),
         "EnableEmbeddedAsarIntegrityValidation=off"],
        capture=True, shell=True)

    step(6, TOTAL, "解 app.asar、注入 i18n、重新打包...")
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

    step(7, TOTAL, "复制 zh-CN.json 到 resources/...")
    zh_src = SCRIPT_DIR / "zh-CN.json"
    zh_dst = src_app / "resources" / "zh-CN.json"
    shutil.copy2(zh_src, zh_dst)
    print(f"  写入 {zh_dst}")

    print()
    print("=" * 60)
    print("✓ 全部完成。")
    print("=" * 60)
    print()
    print("启动 Claude Desktop（任务栏 / 开始菜单都行）应该就能看到外壳菜单 + 聊天 UI 都汉化了。")
    print("Cowork 不受影响（动的是原版文件夹，native messaging 注册没变）。")
    print()
    print("注意: 首次启动 Claude 会弹\"未知发布者\"警告（数字签名失效，是改 asar 的代价），")
    print("      点\"仍要运行\"即可，后续不再弹。")
    print()
    print("Claude 升级后汉化失效？再跑一次本脚本即可——会自动找新版本。")
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
