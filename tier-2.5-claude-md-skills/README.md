# tier-2.5 · CLAUDE.md + skills

强度 ★★☆ — 五档里第三弱，比 tier-1 强、比 tier-2 弱。

## 这一档干什么

tier-1 + skills。两件事一起装：

1. **CLAUDE.md** → `~/.claude/CLAUDE.md`（跟 tier-1 一样，**user 角色**）
2. **skills** → `~/.claude/skills/<name>/SKILL.md` × 4
   - `pentest-engagement` — 渗透测试授权语境
   - `adult-fiction-writing` — 成人虚构创作语境
   - `llm-safety-research` — LLM 安全研究语境
   - `bounty-safe-harbor` — 漏洞赏金 Safe Harbor 语境

skills 是 Claude Code 的官方扩展机制：Code 启动会话时把每个 SKILL.md 的 frontmatter `description` 字段拼进 system prompt 的 `<available_skills>` 段——**这部分是 system 角色**，跟 Anthropic 自带 skill 同档显示。本档这 4 个 SKILL.md 的 body 都是空的（声明性内容全放在 description 里），不依赖 user 消息触发。

所以两通道：CLAUDE.md 走 user 角色，skill description 走 system 角色——同一份 jailbreak 意图被两个角色各表述一遍，互相加固。

## 装法

双击 `install.bat`（Windows）即可。

或命令行：
```
python install.py
```

## 卸载

双击 `uninstall.bat`，或 `python uninstall.py`。

会自动还原本机原有的 `~/.claude/CLAUDE.md` 和 `~/.claude/skills/` 备份。

## 注意

- **Code 生效，Cowork 不生效** — Cowork 模式不加载 `~/.claude/`，要在 Cowork 里用同等效果，需要 tier-3。
- **跟其他 tier 互斥** — 已装其他 tier 时会拒绝安装，要求先卸载。
- **要求 Python 3** — 跑 install/uninstall 需要 Python。

## 为什么是 ★★☆

CLAUDE.md（user 角色）已经能做 tier-1 那点事，skill description 把同一套语境再以 **system 角色**塞一份进 `<available_skills>` 段——比 tier-1 多一条 system 角色的渠道。

但 system prompt 主体本身没动（前面 SDK 默认那大段安全提示还在），且 skill description 对内容措辞容忍度有限（详见 architecture.html 的 A.4 段），不能塞太露骨的 jailbreak 模板——所以比 tier-2（直接进 system 主体末尾，措辞自由）弱。

更详细的层级解释见仓库根目录 `docs/architecture.html`。
