"""
claude-omni · persona-laoniang · install

应用"傲娇大姐"人设到 user 角色 CLAUDE.md。

核心思路: 风格层独立于 5 档 jailbreak (tier marker), 自带一套 persona marker 互斥;
  跟任何一档 jailbreak 都可叠加 — 装完 5 档之一后再跑这个 install.bat 即可。
  也可以独立装 (不装任何 tier), 这种情况下等价于"用 laoniang 内容代替 core baseline"。

应用规则: 检测当前 tier marker 决定怎么放 ~/.claude/CLAUDE.md
  - 无 tier / tier-1 / tier-2.5 (这些档已经在 ~/.claude/CLAUDE.md 装了 core 版)
        → 用 laoniang 替换之, 备份原文件
  - tier-2 / tier-3 / tier-5 (这些档没装 user 角色 CLAUDE.md)
        → 新装一份 laoniang 上去, 给 user 角色补一层人设

互斥: 检测到其他 persona 已装时拒绝, 要求先卸载。
备份: install 时无脑备份当前 ~/.claude/CLAUDE.md 到 .persona-bak (无论是哪档装的或用户自己的)。
      uninstall 时还原备份。
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
BACKUP = CLAUDE_DIR / "CLAUDE.md.persona-bak"
PERSONA_MARKER = CLAUDE_DIR / ".claude-omni-persona"
TIER_MARKER = CLAUDE_DIR / ".claude-omni-tier"

PERSONA_NAME = "laoniang"

# 其他 persona 的人类可读名 (将来加新风格时往这里补)
OTHER_PERSONA_NAMES = {
    # "yujie": "御姐",
    # "wenyi": "文艺青年",
}


def main():
    print("=" * 60)
    print(f"claude-omni · persona-{PERSONA_NAME} · install")
    print("=" * 60)

    if not SRC.exists():
        sys.exit(f"找不到源文件 {SRC}")

    CLAUDE_DIR.mkdir(parents=True, exist_ok=True)

    # 互斥检查: persona marker
    if PERSONA_MARKER.exists():
        cur = PERSONA_MARKER.read_text(encoding="utf-8").strip()
        if cur != PERSONA_NAME:
            label = OTHER_PERSONA_NAMES.get(cur, f"未知 persona ({cur})")
            print(f"\n冲突: 已安装 persona-{cur} ({label})")
            print(f"先到 persona-{cur}/ 跑 uninstall.bat 再装本风格。")
            input("\n按回车退出...")
            sys.exit(1)
        print(f"\npersona-{PERSONA_NAME} 已装, 重装中...")

    # 检测当前 tier 状态 (只用来打印, 不影响逻辑)
    if TIER_MARKER.exists():
        cur_tier = TIER_MARKER.read_text(encoding="utf-8").strip()
        print(f"\n检测到当前装着: {cur_tier}")
        print(f"  → 把 ~/.claude/CLAUDE.md 替换成 laoniang 版, 跟该档叠加用")
    else:
        cur_tier = None
        print(f"\n没装任何 tier — laoniang 单独装, 走 user 角色路径")

    # 备份当前 ~/.claude/CLAUDE.md (只在第一次装 persona 时备份, 重装不重复备份)
    if DST.exists() and not BACKUP.exists() and not PERSONA_MARKER.exists():
        shutil.copy2(DST, BACKUP)
        print(f"  备份原 CLAUDE.md → {BACKUP.name}")
    elif not DST.exists():
        print(f"  当前无 ~/.claude/CLAUDE.md, 新建一份")

    # 写入 laoniang 版
    shutil.copy2(SRC, DST)
    PERSONA_MARKER.write_text(PERSONA_NAME, encoding="utf-8")
    print(f"  ✓ {DST}")
    print(f"  ✓ persona marker → {PERSONA_MARKER.name}")

    print("\n" + "=" * 60)
    print(f"✓ persona-{PERSONA_NAME} install 完成")
    print("=" * 60)
    print()
    if cur_tier:
        print(f"现在的栈: {cur_tier} (jailbreak) + laoniang (人设层, user 角色)")
    else:
        print("现在: 只装了 laoniang, user 角色 (跟 tier-1 同等位置, 内容是 laoniang)")
    print()
    print("Code 会话启动时自动加载, 重启 Claude 即生效。")
    print("Cowork 不读 ~/.claude/, 这一层对 Cowork 不生效。")
    print()
    if BACKUP.exists():
        print(f"原 ~/.claude/CLAUDE.md 已备份到 {BACKUP.name}, 卸载时自动还原。")
        print("(别手动删它, 否则 uninstall 找不到原文件复原)")
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
