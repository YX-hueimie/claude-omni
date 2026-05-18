"""
紧急还原: 从 _backup/<version>/ 完整还原 — asar + claude.exe + app.asar.unpacked/。

跟 install.py 的 restore_from_backup 等价, 但是独立脚本, 跑得最快。

用途: install/uninstall 出问题, Claude 打不开时, 这是最后一道防线。

先决条件: _backup/<当前版本>/ 必须含完整备份 (sentinel _complete.flag 存在)。
如果备份不完整, 报错 — 此时只能 Microsoft Store 重装 Claude Desktop。
"""
import sys
import os
import subprocess
import shutil
import ctypes
import json
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


def robocopy_mirror(src, dst):
    """robocopy /MIR 镜像复制 — 处理 WindowsApps 里 shutil.copytree 处理不了的特殊文件。"""
    src, dst = str(src), str(dst)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["robocopy", src, dst, "/MIR", "/COPY:DAT", "/R:3", "/W:1",
         "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP"],
        capture_output=True, text=True, encoding="cp936", errors="replace"
    )
    if r.returncode >= 8:
        raise RuntimeError(
            f"robocopy /MIR 失败 (rc={r.returncode})\n"
            f"src={src}\ndst={dst}\n"
            f"stdout={r.stdout[-800:]}"
        )
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
    print("Claude Desktop emergency restore (完整还原)")
    print("=" * 60)
    print()
    print("WARNING: 这会同时抹掉其他 patch (i18n / font 等)。")
    print("如果 Claude 当前能用, 优先用 uninstall.bat。")
    print()

    if os.name != "nt":
        raise SystemExit("只支持 Windows")
    if not is_admin():
        relaunch_as_admin()
        return

    print("[1/5] 定位 Claude Desktop...")
    src_app = find_claude_app()
    print(f"  {src_app}")
    claude_exe = src_app / "claude.exe"
    resources_dir = src_app / "resources"
    asar_path = resources_dir / "app.asar"
    cur_unpacked = resources_dir / "app.asar.unpacked"
    version_dir = src_app.parent.name

    print(f"\n[2/5] 找 _backup/{version_dir}/...")
    backup_sub = BACKUP_DIR / version_dir
    backup_asar = backup_sub / "app.asar"
    backup_exe = backup_sub / "claude.exe"
    backup_unpacked = backup_sub / "app.asar.unpacked"
    sentinel = backup_sub / "_complete.flag"

    if not backup_sub.exists():
        all_backups = sorted(
            [p for p in BACKUP_DIR.glob("Claude_*_x64__*") if p.is_dir()],
            reverse=True
        ) if BACKUP_DIR.exists() else []
        if all_backups:
            print(f"  ! 当前版本无备份。仅有其他版本备份: {[p.name for p in all_backups]}")
            print(f"  ! 跨版本备份还原不安全 (asar 内部结构跟版本绑定)。")
        else:
            print(f"  ! 完全没备份。")
        print(f"  ! 解决: Microsoft Store 卸载并重装 Claude Desktop。")
        raise SystemExit("无备份可还原")

    if not sentinel.exists():
        print(f"  ! 备份不完整 (无 _complete.flag sentinel)。")
        print(f"  ! 不能保证还原后 Claude 能启动。建议 Microsoft Store 重装 Claude Desktop。")
        if input("  ? 仍要尝试还原吗? (y/N): ").strip().lower() != "y":
            raise SystemExit("用户放弃")

    if not backup_asar.exists() or not backup_exe.exists():
        raise SystemExit(f"备份缺失 asar 或 exe")

    # 显示备份信息
    if sentinel.exists():
        try:
            meta = json.loads(sentinel.read_text(encoding="utf-8"))
            print(f"  ✓ 备份元信息: asar={meta.get('asar_size')} 字节, "
                  f"exe={meta.get('exe_size')} 字节")
        except Exception:
            pass
    print(f"  ✓ asar 备份 ({backup_asar.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  ✓ exe 备份 ({backup_exe.stat().st_size / 1024 / 1024:.1f} MB)")
    if backup_unpacked.exists():
        files = [f for f in backup_unpacked.rglob("*") if f.is_file()]
        total = sum(f.stat().st_size for f in files)
        print(f"  ✓ unpacked 备份 ({len(files)} 文件, {total/1024/1024:.1f} MB)")
    else:
        print(f"  ! 无 unpacked 备份")

    print("\n[3/5] 杀进程 + 停服务 + ACL...")
    # 杀所有相关进程 + 停 LocalSystem 服务 (持有 winpty.dll 等 native handle)
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

    print("\n[4/5] byte-identical 还原...")
    # 1. 还原 asar
    shutil.copy2(backup_asar, asar_path)
    print(f"  ✓ {asar_path}")
    # 2. 还原 claude.exe (含原 fuse)
    shutil.copy2(backup_exe, claude_exe)
    print(f"  ✓ {claude_exe}")

    # 3. 还原 unpacked — 三种 case
    if backup_unpacked.exists() and any(backup_unpacked.iterdir()):
        # case A: 备份里有内容 → robocopy /MIR 镜像 (清空目标多余 + 完整复制)
        # 用 robocopy 替代 shutil.copytree, 处理 WindowsApps 里特殊文件 (reparse point 等)
        print(f"  robocopy mirror unpacked (备份 → WindowsApps)...")
        robocopy_mirror(backup_unpacked, cur_unpacked)
        print(f"  ✓ 还原 unpacked (从备份)")
    elif backup_unpacked.exists():
        # case B: 备份是空目录占位 → 原 asar 不含 unpacked, 删当前 unpacked
        if cur_unpacked.exists():
            shutil.rmtree(cur_unpacked, ignore_errors=True)
        print(f"  ✓ 原 asar 不含 unpacked, 已删当前 unpacked 目录")
    else:
        # case C: 备份连占位都没 (老的不完整备份)
        print(f"  ! unpacked 备份缺失 (老的不完整备份), 保留当前 unpacked 不动")
        print(f"    如果 Claude 仍打不开, 请 Microsoft Store 重装")

    print("\n[5/5] 校验...")
    if asar_path.stat().st_size != backup_asar.stat().st_size:
        raise SystemExit(f"! asar 大小不匹配")
    if claude_exe.stat().st_size != backup_exe.stat().st_size:
        raise SystemExit(f"! exe 大小不匹配")
    print(f"  ✓ asar 大小匹配 ({asar_path.stat().st_size} 字节)")
    print(f"  ✓ exe 大小匹配 ({claude_exe.stat().st_size} 字节)")

    print()
    print("=" * 60)
    print("✓ emergency restore 完成 — Claude Desktop 应该能正常启动了")
    print("=" * 60)
    print()
    print("如果 Claude 还是开不了 — 备份本身可能就是错的 (老 install 留下的)。")
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
