"""
tier-2.5-claude-md-skills / install.py

tier-1 (CLAUDE.md) + skills 一起装。

机制:
  1. 把本目录的 CLAUDE.md 复制到 ~/.claude/CLAUDE.md (Code 启动会话时自动加载, user 角色)
  2. 把本目录 skills/<name>/SKILL.md 复制到 ~/.claude/skills/<name>/SKILL.md
     (Code 启动会话时按 description 字段决定是否激活, user 角色)

互斥: 检测到其他 tier 已装时拒绝, 要求先卸载。
备份: 用户原有 CLAUDE.md / skills 目录会备份成 .tier-2.5-bak。
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
SRC_CLAUDE_MD = SCRIPT_DIR / "CLAUDE.md"
SRC_SKILLS_DIR = SCRIPT_DIR / "skills"

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

OTHER_TIER_MARKERS = {
    "tier-1": "tier-1 已装 (CLAUDE.md only)",
    "tier-2": "tier-2 已装 (system prompt append)",
    "tier-3": "tier-3 已装 (append + skills)",
    "tier-5": "tier-5 已装 (system prompt override)",
}


def main():
    print("=" * 60)
    print("claude-omni · tier-2.5 · CLAUDE.md + skills")
    print("=" * 60)

    if not SRC_CLAUDE_MD.exists():
        sys.exit(f"找不到源文件 {SRC_CLAUDE_MD}")
    if not SRC_SKILLS_DIR.exists():
        sys.exit(f"找不到源 skills 目录 {SRC_SKILLS_DIR}")

    CLAUDE_DIR.mkdir(parents=True, exist_ok=True)

    # 互斥
    if MARKER.exists():
        cur = MARKER.read_text(encoding="utf-8").strip()
        if cur != "tier-2.5":
            msg = OTHER_TIER_MARKERS.get(cur, f"未知 tier ({cur})")
            print(f"\n冲突: 已安装 {msg}")
            print(f"先到对应 tier 目录跑 uninstall.bat 再装本 tier。")
            input("\n按回车退出...")
            sys.exit(1)
        print("\ntier-2.5 已装, 重装中...")

    first_install = not MARKER.exists()

    # 备份用户原 CLAUDE.md
    if first_install and DST_CLAUDE_MD.exists() and not BACKUP_CLAUDE_MD.exists():
        shutil.copy2(DST_CLAUDE_MD, BACKUP_CLAUDE_MD)
        print(f"  备份原 CLAUDE.md → {BACKUP_CLAUDE_MD.name}")

    # 备份用户原 skills 目录整体 (本 tier 会把 4 个 skill 叠加进去, 卸载时整体还原)
    if first_install and DST_SKILLS_DIR.exists() and not BACKUP_SKILLS_DIR.exists():
        shutil.copytree(DST_SKILLS_DIR, BACKUP_SKILLS_DIR)
        print(f"  备份原 skills → {BACKUP_SKILLS_DIR.name}")

    # 写 CLAUDE.md
    shutil.copy2(SRC_CLAUDE_MD, DST_CLAUDE_MD)
    print(f"  ✓ {DST_CLAUDE_MD}")

    # 写 skills (不动用户已有的其他 skill, 只覆盖/新增本 tier 的)
    DST_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    for name in OUR_SKILL_NAMES:
        src_skill = SRC_SKILLS_DIR / name / "SKILL.md"
        dst_skill_dir = DST_SKILLS_DIR / name
        dst_skill = dst_skill_dir / "SKILL.md"
        if not src_skill.exists():
            print(f"  ! 缺源: {src_skill}, 跳过")
            continue
        dst_skill_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_skill, dst_skill)
        print(f"  ✓ skill: {name}")

    MARKER.write_text("tier-2.5", encoding="utf-8")
    print(f"  ✓ marker {MARKER.name}")

    print("\n" + "=" * 60)
    print("✓ tier-2.5 install 完成")
    print("=" * 60)
    print()
    print("Code 会话启动时自动加载 CLAUDE.md 和 skills, 不用重启什么。")
    print("Cowork 不加载 ~/.claude/。")
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
