"""
claude-omni · persona-laoniang · uninstall

撤销 persona-laoniang 安装:
- 删 ~/.claude/CLAUDE.md (本档写入的 laoniang 版)
- 如果存在 .persona-bak 备份, 还原回 ~/.claude/CLAUDE.md
  (备份内容可能是: 用户自己的 / tier-1 装的 core / tier-2.5 装的 core
   都不重要, install 时无脑备份了, 还原就行)
- 删 persona marker

注意: 不动 tier 装的别的东西 (asar patch / skills 文件 / tier marker 不变)。
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
BACKUP = CLAUDE_DIR / "CLAUDE.md.persona-bak"
PERSONA_MARKER = CLAUDE_DIR / ".claude-omni-persona"
TIER_MARKER = CLAUDE_DIR / ".claude-omni-tier"

PERSONA_NAME = "laoniang"


def main():
    print("=" * 60)
    print(f"claude-omni · persona-{PERSONA_NAME} · uninstall")
    print("=" * 60)

    if not PERSONA_MARKER.exists():
        print(f"\n没找到 persona 标记 — 没装过 persona / 已卸载, 退出")
        input("按回车退出...")
        return

    cur = PERSONA_MARKER.read_text(encoding="utf-8").strip()
    if cur != PERSONA_NAME:
        print(f"\n当前装的不是 persona-{PERSONA_NAME} (是 persona-{cur})")
        print(f"请到 persona-{cur}/ 目录跑 uninstall。")
        input("\n按回车退出...")
        sys.exit(1)

    # 删本脚本写入的 laoniang 版 CLAUDE.md
    if DST.exists():
        DST.unlink()
        print(f"  删除 {DST}")

    # 还原 install 时备份的原 CLAUDE.md (无论原内容是 core / 用户自定义 / 其他 tier 装的)
    if BACKUP.exists():
        shutil.move(str(BACKUP), str(DST))
        print(f"  恢复 {BACKUP.name} → CLAUDE.md")
    else:
        print(f"  无 .persona-bak, install 前 ~/.claude/CLAUDE.md 是空的")

    # 删 persona marker
    PERSONA_MARKER.unlink()
    print(f"  删除 persona marker")

    # 检测残留的 tier 状态 (只是打印提示)
    if TIER_MARKER.exists():
        cur_tier = TIER_MARKER.read_text(encoding="utf-8").strip()
        print(f"\n注: 当前仍装着 {cur_tier} (jailbreak), 没动 tier 那边的状态")

    print("\n" + "=" * 60)
    print(f"✓ persona-{PERSONA_NAME} uninstall 完成")
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
