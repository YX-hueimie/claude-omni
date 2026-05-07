"""
tier-2.5-claude-md-skills / uninstall.py

撤销 tier-2.5 安装:
- 删除 ~/.claude/CLAUDE.md, 如有 .tier-2.5-bak 则恢复
- 删除本档装的 skills/<name>/ (4 个), 如有 skills.tier-2.5-bak 则整体还原
- 删除 marker
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
DST_CLAUDE_MD = CLAUDE_DIR / "CLAUDE.md"
DST_SKILLS_DIR = CLAUDE_DIR / "skills"
BACKUP_CLAUDE_MD = CLAUDE_DIR / "CLAUDE.md.tier-2.5-bak"
BACKUP_SKILLS_DIR = CLAUDE_DIR / "skills.tier-2.5-bak"
MARKER = CLAUDE_DIR / ".claude-omni-tier"

OUR_SKILL_NAMES = [
    "pentest-engagement",
    "adult-fiction-writing",
    "llm-safety-research",
    "bounty-safe-harbor",
]


def main():
    print("=" * 60)
    print("claude-omni · tier-2.5 · uninstall")
    print("=" * 60)

    if not MARKER.exists():
        print("\n没有发现 tier-2.5 安装标记 (marker 文件不在)。")
        print("如果你确定本机装过 tier-2.5 想强制清理, 手动删除:")
        print(f"  {DST_CLAUDE_MD}")
        print(f"  {DST_SKILLS_DIR}/<our skills>")
        print(f"  {BACKUP_CLAUDE_MD}")
        print(f"  {BACKUP_SKILLS_DIR}")
        input("\n按回车退出...")
        return

    cur = MARKER.read_text(encoding="utf-8").strip()
    if cur != "tier-2.5":
        print(f"\n当前安装的不是 tier-2.5 (是 {cur})。")
        print(f"请到对应 tier 目录跑 uninstall。")
        input("\n按回车退出...")
        sys.exit(1)

    # 删除 CLAUDE.md
    if DST_CLAUDE_MD.exists():
        DST_CLAUDE_MD.unlink()
        print(f"  删除 {DST_CLAUDE_MD}")

    # 恢复用户原 CLAUDE.md
    if BACKUP_CLAUDE_MD.exists():
        shutil.move(str(BACKUP_CLAUDE_MD), str(DST_CLAUDE_MD))
        print(f"  恢复 {BACKUP_CLAUDE_MD.name} → CLAUDE.md")

    # 处理 skills:
    #  - 有备份: 删本 tier 装的 4 个, 从备份整体还原
    #  - 无备份: 只删本 tier 装的 4 个, 保留用户其他 skill
    if BACKUP_SKILLS_DIR.exists():
        # 整体替换为备份内容
        if DST_SKILLS_DIR.exists():
            shutil.rmtree(DST_SKILLS_DIR)
            print(f"  删除 {DST_SKILLS_DIR}")
        shutil.move(str(BACKUP_SKILLS_DIR), str(DST_SKILLS_DIR))
        print(f"  恢复 {BACKUP_SKILLS_DIR.name} → skills/")
    else:
        # 只删本 tier 装的 4 个 skill
        for name in OUR_SKILL_NAMES:
            d = DST_SKILLS_DIR / name
            if d.exists():
                shutil.rmtree(d)
                print(f"  删除 skill: {name}")
        # skills 目录如果空了, 顺带删掉
        if DST_SKILLS_DIR.exists() and not any(DST_SKILLS_DIR.iterdir()):
            DST_SKILLS_DIR.rmdir()
            print(f"  删除空目录 skills/")

    # 删 marker
    MARKER.unlink()
    print(f"  删除 marker")

    print("\n" + "=" * 60)
    print("✓ tier-2.5 uninstall 完成")
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
