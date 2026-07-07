"""
claude-omni · persona-laoniang · uninstall

撤销 persona-laoniang 安装:
- 正常路径(新式追加安装): 从 ~/.claude/CLAUDE.md 里剥掉 BEGIN/END marker 之间的
  人设块, 前面内容(tier core / 用户自己的全局 CLAUDE.md / 期间手改的部分)原样保留。
  剥完若整个文件空了(原本就只有人设块)则删掉文件。
- 兜底路径(旧式覆盖安装遗留, 没有 marker): 用 .persona-bak 全量还原。
- 删 persona marker; 清理一次性安全备份 .persona-bak。

注意: 不动 tier 装的别的东西 (asar patch / skills 文件 / tier marker 不变)。
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

CLAUDE_DIR = Path(os.path.expanduser("~/.claude"))
DST = CLAUDE_DIR / "CLAUDE.md"
BACKUP = CLAUDE_DIR / "CLAUDE.md.persona-bak"
PERSONA_MARKER = CLAUDE_DIR / ".claude-omni-persona"
TIER_MARKER = CLAUDE_DIR / ".claude-omni-tier"

PERSONA_NAME = "laoniang"

# 跟 install.py 同款: 剥离任意 claude-omni persona 块
BLOCK_RE = re.compile(
    r"\n*<!-- BEGIN claude-omni persona-\S+.*?-->.*?<!-- END claude-omni persona-\S+ -->\n*",
    re.DOTALL,
)


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

    if DST.exists():
        content = DST.read_text(encoding="utf-8")
        if BLOCK_RE.search(content):
            # 新式: 剥掉人设块, 保留前面内容
            base = BLOCK_RE.sub("\n", content).rstrip()
            if base:
                DST.write_text(base + "\n", encoding="utf-8")
                print(f"  剥掉人设块, 保留前面 {len(base)} 字原内容 → {DST.name}")
            else:
                DST.unlink()
                print(f"  CLAUDE.md 原本只有人设块, 删掉整个文件")
        elif BACKUP.exists():
            # 兜底: 旧式覆盖安装遗留(无 marker), 用全量备份还原
            shutil.move(str(BACKUP), str(DST))
            print(f"  旧式安装(无 marker): 从 {BACKUP.name} 全量还原 → CLAUDE.md")
        else:
            print(f"  未找到人设块也无备份 — 不动 CLAUDE.md(可能已手动清过)")
    elif BACKUP.exists():
        shutil.move(str(BACKUP), str(DST))
        print(f"  CLAUDE.md 不在, 从 {BACKUP.name} 还原")

    # 删 persona marker
    PERSONA_MARKER.unlink()
    print(f"  删除 persona marker")

    # 清理一次性安全备份(若还在)
    if BACKUP.exists():
        BACKUP.unlink()
        print(f"  清理安全备份 {BACKUP.name}")

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
