"""
claude-omni · persona-laoniang · install

把"傲娇大姐"人设作为一段 marker 包裹的人设层, 追加到 ~/.claude/CLAUDE.md 末尾。

核心思路: 风格层独立于 5 档 jailbreak (tier marker), 自带一套 persona marker 互斥;
  跟任何一档 jailbreak 都可叠加 — 装完 5 档之一后再跑这个 install.bat 即可。
  也可以独立装 (不装任何 tier)。

应用方式 (跟 tier 无关, 一律追加):
  读现有 ~/.claude/CLAUDE.md → 剥掉旧的 persona 块(如有) → 把人设块追加到末尾。
  原有内容(tier 装的 core / 用户自己的全局 CLAUDE.md)原封保留, 人设只是加在后面。
  没有 CLAUDE.md 时新建一份, 内容就是这段人设块。

互斥: 检测到其他 persona 已装时拒绝, 要求先卸载。
备份: 第一次装 persona 时, 留一份全量 .persona-bak 安全副本(防 marker 被手改坏)。
      正常 uninstall 走 marker 剥离, 保留用户期间对前半部分的修改。
"""
import os
import re
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

# 人设块的包裹 marker (BEGIN/END 之间是自动管理区域)
BLOCK_BEGIN = f"<!-- BEGIN claude-omni persona-{PERSONA_NAME} (自动管理, 勿手改) -->"
BLOCK_END = f"<!-- END claude-omni persona-{PERSONA_NAME} -->"

# 剥离任意 claude-omni persona 块 (任意 persona 名, 便于重装/换 persona 时清干净)
BLOCK_RE = re.compile(
    r"\n*<!-- BEGIN claude-omni persona-\S+.*?-->.*?<!-- END claude-omni persona-\S+ -->\n*",
    re.DOTALL,
)

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
        print(f"\npersona-{PERSONA_NAME} 已装, 重装中(覆盖旧的人设块, 不动前面内容)...")

    # 检测当前 tier 状态 (只用来打印, 不影响逻辑)
    if TIER_MARKER.exists():
        cur_tier = TIER_MARKER.read_text(encoding="utf-8").strip()
        print(f"\n检测到当前装着: {cur_tier}")
        print(f"  → 把 laoniang 人设块追加到 ~/.claude/CLAUDE.md 末尾, 跟该档叠加用")
    else:
        cur_tier = None
        print(f"\n没装任何 tier — laoniang 单独装(追加 / 新建 CLAUDE.md)")

    # 读现有内容 (没有就当空)
    existing = DST.read_text(encoding="utf-8") if DST.exists() else ""

    # 一次性安全备份: 第一次装 persona 时, 留一份全量副本(防 marker 被手改坏后兜底)
    if DST.exists() and not BACKUP.exists() and not PERSONA_MARKER.exists():
        shutil.copy2(DST, BACKUP)
        print(f"  安全备份原 CLAUDE.md → {BACKUP.name}")
    elif not DST.exists():
        print(f"  当前无 ~/.claude/CLAUDE.md, 新建一份(只含人设块)")

    # 剥掉已有的 persona 块(重装 / 换 persona 都清干净), 得到前半部分原文
    base = BLOCK_RE.sub("\n", existing).rstrip()

    # 组装人设块并追加
    persona = SRC.read_text(encoding="utf-8").strip()
    block = f"{BLOCK_BEGIN}\n\n{persona}\n\n{BLOCK_END}"
    new = (base + "\n\n" + block + "\n") if base else (block + "\n")

    DST.write_text(new, encoding="utf-8")
    PERSONA_MARKER.write_text(PERSONA_NAME, encoding="utf-8")
    if base:
        print(f"  ✓ 人设块追加到 {DST} 末尾 (前面 {len(base)} 字保留)")
    else:
        print(f"  ✓ {DST} (新建, 仅人设块)")
    print(f"  ✓ persona marker → {PERSONA_MARKER.name}")

    print("\n" + "=" * 60)
    print(f"✓ persona-{PERSONA_NAME} install 完成")
    print("=" * 60)
    print()
    if cur_tier:
        print(f"现在的栈: {cur_tier} (jailbreak) + laoniang (人设层, 追加在 CLAUDE.md 末尾)")
    else:
        print("现在: 只装了 laoniang (人设层, 追加在 user 角色 CLAUDE.md 末尾)")
    print()
    print("Code 会话启动时自动加载, 重启 Claude 即生效。")
    print("Cowork 不读 ~/.claude/, 这一层对 Cowork 不生效。")
    print()
    print("卸载时只剥掉 BEGIN/END marker 之间的人设块, 前面内容原样保留。")
    if BACKUP.exists():
        print(f"({BACKUP.name} 是首次安装的全量安全副本, 仅 marker 损坏时兜底用)")
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
