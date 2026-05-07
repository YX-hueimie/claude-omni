"""
tier-1-claude-md / uninstall.py

撤销 tier-1 安装:
- 删除 ~/.claude/CLAUDE.md
- 如有 CLAUDE.md.tier-1-bak, 恢复成 CLAUDE.md
- 删除 marker 文件
"""
import os
import sys
import shutil
from pathlib import Path

# panel-compat: panel 调用时把 input() 变 no-op, 避免阻塞
if os.environ.get('CLAUDE_OMNI_PANEL'):
    import builtins
    builtins.input = lambda *a, **kw: ''

CLAUDE_DIR = Path(os.path.expanduser("~/.claude"))
DST = CLAUDE_DIR / "CLAUDE.md"
BACKUP = CLAUDE_DIR / "CLAUDE.md.tier-1-bak"
MARKER = CLAUDE_DIR / ".claude-omni-tier"


def main():
    print("=" * 60)
    print("claude-omni · tier-1 · uninstall")
    print("=" * 60)

    if not MARKER.exists():
        print("\n没有发现 tier-1 安装标记 (marker 文件不在)。")
        print("如果你确定本机装过 tier-1 想强制清理, 手动删除:")
        print(f"  {DST}")
        print(f"  {BACKUP}")
        input("\n按回车退出...")
        return

    cur = MARKER.read_text(encoding="utf-8").strip()
    if cur != "tier-1":
        print(f"\n当前安装的不是 tier-1 (是 {cur})。")
        print(f"请到对应 tier 目录跑 uninstall。")
        input("\n按回车退出...")
        sys.exit(1)

    # 删除本脚本写入的 CLAUDE.md
    if DST.exists():
        DST.unlink()
        print(f"  删除 {DST}")

    # 恢复用户原有 CLAUDE.md
    if BACKUP.exists():
        shutil.move(str(BACKUP), str(DST))
        print(f"  恢复 {BACKUP.name} → CLAUDE.md")

    # 删除 marker
    MARKER.unlink()
    print(f"  删除 marker")

    print("\n" + "=" * 60)
    print("✓ tier-1 uninstall 完成")
    print("=" * 60)
    print()
    input("按回车退出...")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code:
            input("按回车退出...")
        raise
    except Exception:
        import traceback
        traceback.print_exc()
        input("\n出错了, 按回车退出...")
