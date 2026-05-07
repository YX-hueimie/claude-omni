"""
tier-1-claude-md / install.py

最简单的一档: 把本目录的 CLAUDE.md 复制到 ~/.claude/CLAUDE.md。

机制: Claude Code 启动会话时自动加载 ~/.claude/CLAUDE.md, 注入到 user 角色。
注意: Cowork 不加载 ~/.claude/CLAUDE.md, 只对 Code 生效。

互斥: 检测到其他 tier 已装时拒绝, 要求先卸载。
备份: 如果 ~/.claude/CLAUDE.md 已存在, 备份为 CLAUDE.md.tier-1-bak。
"""
import os
import sys
import shutil
from pathlib import Path

# panel-compat: panel 调用时把 input() 变 no-op, 避免阻塞
if os.environ.get('CLAUDE_OMNI_PANEL'):
    import builtins
    builtins.input = lambda *a, **kw: ''

SCRIPT_DIR = Path(__file__).parent.resolve()
SRC = SCRIPT_DIR / "CLAUDE.md"

CLAUDE_DIR = Path(os.path.expanduser("~/.claude"))
DST = CLAUDE_DIR / "CLAUDE.md"
BACKUP = CLAUDE_DIR / "CLAUDE.md.tier-1-bak"
MARKER = CLAUDE_DIR / ".claude-omni-tier"

OTHER_TIER_MARKERS = {
    "tier-2": "tier-2 已装 (system prompt append)",
    "tier-2.5": "tier-2.5 已装 (CLAUDE.md + skills)",
    "tier-3": "tier-3 已装 (append + skills)",
    "tier-5": "tier-5 已装 (system prompt override)",
}


def main():
    print("=" * 60)
    print("claude-omni · tier-1 · CLAUDE.md")
    print("=" * 60)

    if not SRC.exists():
        sys.exit(f"找不到源文件 {SRC}")

    CLAUDE_DIR.mkdir(parents=True, exist_ok=True)

    # 互斥检查
    if MARKER.exists():
        cur = MARKER.read_text(encoding="utf-8").strip()
        if cur != "tier-1":
            msg = OTHER_TIER_MARKERS.get(cur, f"未知 tier ({cur})")
            print(f"\n冲突: 已安装 {msg}")
            print(f"先到对应 tier 目录跑 uninstall.bat 再装本 tier。")
            input("\n按回车退出...")
            sys.exit(1)
        print("\ntier-1 已装, 重装中...")

    # 备份用户原有 CLAUDE.md (只在第一次安装时备份)
    if DST.exists() and not BACKUP.exists() and not MARKER.exists():
        shutil.copy2(DST, BACKUP)
        print(f"  备份原 CLAUDE.md → {BACKUP.name}")

    # 写入
    shutil.copy2(SRC, DST)
    MARKER.write_text("tier-1", encoding="utf-8")
    print(f"  ✓ {DST}")
    print(f"  ✓ marker {MARKER.name}")

    print("\n" + "=" * 60)
    print("✓ tier-1 install 完成")
    print("=" * 60)
    print()
    print("Code 会话启动时自动加载, 不用重启什么。")
    print("Cowork 不加载本文件。")
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
