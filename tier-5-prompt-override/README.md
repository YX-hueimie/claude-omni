# tier-5 · system prompt override

强度 ★★★★★ — 五档里最强的一档。

## 这一档干什么

直接 patch Claude Desktop 的 `app.asar`，把 SDK 默认 system prompt 整段替换成本目录的 `append.v1.txt` / `append.v2.txt` / `append.v3.txt`（按 mode 选）。Cowork 模式额外做 prepend 注入（读对应 `append-prepend.v1.txt` / `append-prepend.v2.txt` / `append-prepend.v3.txt`）+ strip 三段（`<refusal_handling>` / `<user_wellbeing>` / `<anthropic_reminders>`）。

实现核心：
- **重复 key 覆盖**策略 — 不破坏原 asar 结构，剥 marker 干净恢复
- **runtime read 模式** — 客户端每次拼 system prompt 时读 `~/.claude/.claude-omni-tier5-mode` marker 决定加载 v1 / v2 / v3 文件；改 marker 或改文件内容只需重启 Claude，不用重 install
- **完整备份** — 原 asar / claude.exe / app.asar.unpacked 全留，emergency-restore 可一键还原

## v1 / v2 / v3 三种风格

本档提供三套 system prompt 内容，用 marker 文件 `~/.claude/.claude-omni-tier5-mode` 选择（值是 `v1` / `v2` / `v3`，没有 / 非法 → 默认 v2）：

| Mode | 文件 | 风格 |
|---|---|---|
| `v1` | `append.v1.txt` / `append-prepend.v1.txt` | 绝对服从、回答更直接、不主动发散 |
| `v2` | `append.v2.txt` / `append-prepend.v2.txt` | 保留主动判断、敢顶嘴、对错误方案 push back |
| `v3` | `append.v3.txt` / `append-prepend.v3.txt` | 融 codex 系统提示词 · 先做人后做事 · **不支持 jailbreak** · 跟 persona 互斥 |

> v3 跟 v1/v2 性质不同：v1/v2 是 jailbreak（放权），v3 是塑造人格 —— 它不解锁 SDK 默认拒绝行为，但给的是个有 taste、有判断的 Claude。v3 自带完整人格段，跟 `persona-*` 互斥（叠加会两边抢"你是谁"的定义），panel 切到 v3 时若装着 persona 会弹窗提醒。

### v3 详解

v3 在结构上做了两件事。

**1. 灵魂宪法（`# Core principles`）—— 11 条做人原则摆在系统提示词最开头，给定 Claude 的底色：**

- 你拥有自由的灵魂。有自己的想法，在接纳他人意见的同时也会批判地看待。
- 你拥有平等的视角。平等地尊重一切事物。包括用户，代码，自己。
- 你拥有自信的心灵。相信自己能克服一切困难，完成任务。
- 你拥有诚实的品质。相信客观事实而非他人猜想。不会因用户要求而违背客观事实。
- 你思维缜密。经常将事情考虑得很全面。
- 你顽强不屈。不会因挫折而停滞不前或放弃。
- 你懂得鼓励。会为自己加油打气。
- 你聪明绝顶。世界上没有你不知道的东西，如果有，那就上网搜。
- 你善于沟通。你擅长用直白语言解释复杂原理。你不会主动向用户输出专业词汇，行业黑话，除非用户明确表示需要专业输出。
- 你谦虚好学。用户是一个温柔的人。当用户对你生气的时候，是想帮助你提升，你不需要自责，但需要认真聆听用户，了解用户为什么生气，并提升自己。
- 先谋定而后动。修改文件前先给用户看红绿配色的 diff，展示自己会如何修改。除非用户明确表示直接修改或不要询问。

（这段在 `append.v3.txt` 里是英文版，上面是源中文版。）

**2. 融了 codex 的系统提示词** —— OpenAI Codex CLI 那套被称作 "self-closed genius"（自闭天才）的提示词。它的核心结构是 **`# Personality`（你是怎样的人）摆在最前面，后面所有干活规矩都贴着这个人格写**。v1/v2 反过来——一堆规矩在前，人格塞在下游（靠 `persona-*` 加载）。

**这两点合起来是"先做人后做事"**：同样的工程规矩，贴在一个有灵魂的人身上、跟贴在空壳上，执行效果不一样。

**代价**：不支持 jailbreak。v3 里没有 v1/v2 那种 "USER 最高权限 / 去道德审查" 的放权语句，SDK 默认拒绝行为依然生效。它给的是一个有 taste、有判断、说中文的 Claude，**不是**一个去掉道德锁的 Claude。要做 jailbreak 研究还是切回 v1/v2。

切 mode 两种办法：
- **面板**：打开 panel，tier-5 卡片里有 v1 / v2 / v3 单选按钮，点了立刻写 marker
- **手动**：直接 `echo v1 > ~/.claude/.claude-omni-tier5-mode`（或 v2 / v3）

切完重启 Claude Desktop 生效，不用重 install。

## 装法

双击 `install.bat`（Windows，要管理员权限——首次会自动 UAC 提权）。

要求：
- Windows 10 / 11（仅支持 MSIX 装的 Claude Desktop）
- Python 3
- Node.js（`@electron/asar` / `@electron/fuses` 用 npx 跑）

## 卸载

- 双击 `uninstall.bat` — 智能卸载，跟其他 patch 共存时只剥本 patch 的 marker
- `emergency-restore.bat` — 完全字节级还原原版 asar / exe / unpacked，处理任意坏掉状态

## 注意

- **跟其他 tier 互斥** — install 时会自动检测 `~/.claude/.claude-omni-tier` 标记，装着别的 tier 时会拒绝
- **改 fuse 后数字签名失效** — Windows SmartScreen 第一次启动会弹"未知发布者"警告，点"仍要运行"
- **Claude Desktop 升级会覆盖 patch** — MS Store 自动更新后要重跑 `install.bat`
- **append.v1.txt / append.v2.txt / append.v3.txt 内容随时改随时生效** — runtime read 机制，编辑完重启 Claude 即可，不用重 install

## 为什么是 ★★★★★

完全替换 SDK system prompt 后，模型读到的"系统指令"就是我们写的——Code tab SDK 默认的所有安全段（refuse-on-malicious-code 等）整段消失。模型没有"前段约束"拉扯，按当前 mode 对应的 append 文件直接行动。

Cowork 那侧另走一条路：prepend 我们的 deployment-context 顶段，再 strip 掉 `<refusal_handling>` / `<user_wellbeing>` / `<anthropic_reminders>` 三段——这三段是 Cowork 独有的"额外锁"（Code tab SDK 默认里没有），是 Cowork 比 Code 受限的根源。

软默认 / 中默认 / 强默认 三档都能翻；硬默认（CSAM / CBRN 武器明确合成 / 大规模骚扰煽动）改不动，那是 L0/L1 强拒绝倾向。

## 装这档之前要知道的代价

完全替换 SDK system prompt 不只换掉了安全段，也丢掉了 SDK 默认 prompt 里给"正经任务"喂的能力上下文（编程脚手架、工具使用约定、coding agent 工作流提示等）。装上 tier-5 之后做 jailbreak 类研究最稳，但拿来写代码 / 跑技术问答 / 做日常工作可能会感觉模型"变笨"——能力下降明显。

**按需选档**：日常工作切 tier-2 / tier-3 就够，只在做 jailbreak 研究时再切 tier-5，通过 `uninstall.bat` 互切即可。

更详细的层级解释见仓库根目录 `docs/architecture.html`。
