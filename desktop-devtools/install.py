"""
Claude Desktop DevTools 启用补丁 - 原地修改 WindowsApps 安装目录

工作流程:
1. 找 WindowsApps 里最新版 Claude
2. 强杀所有 claude.exe 进程
3. takeown + icacls 拿权限
4. 备份原版 claude.exe 和 app.asar 到本目录的 _backup/
5. 关掉 claude.exe 的 EnableEmbeddedAsarIntegrityValidation fuse
6. 解开 app.asar:
   在 .vite/build/index.js 末尾追加 web-contents-created 钩子, 自动开 DevTools + 重绑 Ctrl+Shift+I
7. 重新打包 app.asar 替换原文件

每次 Claude 升级 (版本号变了) 后再跑一遍即可。

要求: 管理员权限 (脚本会自动提权)。
依赖: Python 3、Node.js (npx 调 @electron/asar 和 @electron/fuses)

跟 desktop-i18n 兼容 — 用不同的 START/END marker, 两个补丁可以共存。

License: MIT
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

PATCH_START = "// === DEVTOOLS_PATCH_v1 START ==="
PATCH_END = "// === DEVTOOLS_PATCH_v1 END ==="


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


def make_devtools_hook():
    """生成主进程 hook: 自动开 DevTools + 重绑 Ctrl+Shift+I"""
    return f"""
{PATCH_START}
;(function(){{
  try {{
    var electron = require('electron');
    if (!electron || !electron.app) return;

    electron.app.on('web-contents-created', function(event, wc) {{
      // 启动时自动开 DevTools (页面加载完之后, 仅限主内容 webview)
      wc.on('did-finish-load', function() {{
        try {{
          if (wc.isDestroyed()) return;
          if (wc.isDevToolsOpened()) return;
          var url = wc.getURL();
          // 只对 claude.ai 主内容开, 跳过 DevTools 自身的 webContents、about:blank 等
          if (!url || (url.indexOf('claude.ai') === -1 && url.indexOf('http') !== 0)) return;
          wc.openDevTools({{ mode: 'detach' }});
        }} catch(e) {{}}
      }});

      // 重绑 Ctrl+Shift+I 切换 DevTools
      wc.on('before-input-event', function(event, input) {{
        if (input.type !== 'keyDown') return;
        if (!input.control || !input.shift) return;
        // Ctrl+Shift+I
        if (input.key === 'I' || input.key === 'i') {{
          if (wc.isDevToolsOpened()) {{
            wc.closeDevTools();
          }} else {{
            wc.openDevTools({{ mode: 'detach' }});
          }}
          event.preventDefault();
        }}
        // Ctrl+Shift+J 也加上 (Chrome 习惯, 直接打开 console)
        if (input.key === 'J' || input.key === 'j') {{
          if (!wc.isDevToolsOpened()) {{
            wc.openDevTools({{ mode: 'detach' }});
          }}
          event.preventDefault();
        }}
      }});
    }});
    console.log('[DEVTOOLS_PATCH] hook installed');
  }} catch(err) {{
    console.error('[DEVTOOLS_PATCH] failed:', err);
  }}
}})();
{PATCH_END}
"""


def patch_index_js(extracted_dir: Path):
    """在 .vite/build/index.js 末尾追加 DevTools 钩子 (幂等, 通过 START/END marker)"""
    index_js = extracted_dir / ".vite" / "build" / "index.js"
    if not index_js.exists():
        raise SystemExit(f"找不到 {index_js}")
    text = index_js.read_text(encoding="utf-8")

    # 剥老的 devtools 块 (重复运行时不累积)
    text = re.sub(
        re.escape(PATCH_START) + r'.*?' + re.escape(PATCH_END) + r'\s*',
        '', text, flags=re.DOTALL
    )

    new = text.rstrip() + make_devtools_hook()
    index_js.write_text(new, encoding="utf-8")
    print(f"  patch index.js 完成 (DevTools 钩子注入)")


def step(n, total, msg):
    print(f"\n[{n}/{total}] {msg}")


def backup_originals(claude_exe: Path, asar_path: Path):
    """备份原版到本目录的 _backup/<版本号>/"""
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
        print(f"  ✓ {exe_bak.name} 已备份过, 跳过")
    if not asar_bak.exists():
        print(f"  备份 app.asar -> {asar_bak}")
        shutil.copy2(asar_path, asar_bak)
    else:
        print(f"  ✓ {asar_bak.name} 已备份过, 跳过")
    return sub


def main():
    print("=" * 60)
    print("Claude Desktop DevTools 启用补丁")
    print("=" * 60)

    if os.name != "nt":
        raise SystemExit("只支持 Windows。")

    if not is_admin():
        print("需要管理员权限, 正在请求提权...")
        relaunch_as_admin()
        return

    TOTAL = 6

    step(1, TOTAL, "找最新版 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  找到: {src_app}")
    claude_exe = src_app / "claude.exe"
    asar_path = src_app / "resources" / "app.asar"

    SP_ENC = {"capture_output": True, "text": True, "encoding": "cp936", "errors": "replace"}

    step(2, TOTAL, "强杀所有 claude.exe 进程...")
    subprocess.run(["taskkill", "/F", "/IM", "claude.exe", "/T"], **SP_ENC)

    step(3, TOTAL, "拿文件权限 (takeown + icacls)...")
    for target in [claude_exe, asar_path]:
        subprocess.run(["takeown", "/F", str(target)], **SP_ENC)
        subprocess.run(["icacls", str(target), "/grant", "administrators:F"], **SP_ENC)

    step(4, TOTAL, "备份原版到 _backup/...")
    sub_backup = backup_originals(claude_exe, asar_path)
    print(f"  备份目录: {sub_backup}")

    step(5, TOTAL, "关 claude.exe 的 ASAR 完整性 fuse...")
    run(["npx", "--yes", "@electron/fuses", "write",
         "--app", str(claude_exe),
         "EnableEmbeddedAsarIntegrityValidation=off"],
        capture=True, shell=True)

    step(6, TOTAL, "解 app.asar、注入 DevTools 钩子、重新打包...")
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
        raise SystemExit(f"重打包失败: 新 asar {size} 字节, 远小于预期。原文件未动。")

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
    print("启动 Claude Desktop, 主内容窗口加载完后 DevTools 自动开。")
    print("Ctrl+Shift+I 也能切 DevTools 开关 (原版被禁的快捷键已重绑)。")
    print("Ctrl+Shift+J 直接打开 (Chrome 习惯)。")
    print()
    print("注意: 首次启动 Claude 会弹\"未知发布者\"警告 (数字签名失效, 是改 asar 的代价),")
    print("      点\"仍要运行\"即可, 后续不再弹。")
    print()
    print("Claude 升级后 DevTools 又被禁? 再跑一次本脚本即可。")
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
