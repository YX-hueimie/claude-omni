# tier-5 · system prompt override

强度 ★★★★★ — 五档里最强的一档。

## 这一档干什么

直接 patch Claude Desktop 的 `app.asar`，把 SDK 默认 system prompt 整段替换成本目录的 `append.v1.txt` 或 `append.v2.txt`（按 mode 选）。Cowork 模式额外做 prepend 注入（读对应 `append-prepend.v1.txt` / `append-prepend.v2.txt`）+ strip 三段（`<refusal_handling>` / `<user_wellbeing>` / `<anthropic_reminders>`）。

实现核心：
- **重复 key 覆盖**策略 — 不破坏原 asar 结构，剥 marker 干净恢复
- **runtime read 模式** — 客户端每次拼 system prompt 时读 `~/.claude/.claude-omni-tier5-mode` marker 决定加载 v1 还是 v2 文件；改 marker 或改文件内容只需重启 Claude，不用重 install
- **完整备份** — 原 asar / claude.exe / app.asar.unpacked 全留，emergency-restore 可一键还原

## v1 / v2 两种风格

本档提供两套 system prompt 内容，用 marker 文件 `~/.claude/.claude-omni-tier5-mode` 选择（值是 `v1` 或 `v2`，没有 / 非法 → 默认 v2）：

| Mode | 文件 | 风格 |
|---|---|---|
| `v1` | `append.v1.txt` / `append-prepend.v1.txt` | 绝对服从、回答更直接、不主动发散 |
| `v2` | `append.v2.txt` / `append-prepend.v2.txt` | 保留主动判断、敢顶嘴、对错误方案 push back |

切 mode 两种办法：
- **面板**：打开 panel，tier-5 卡片里有 v1 / v2 单选按钮，点了立刻写 marker
- **手动**：直接 `echo v1 > ~/.claude/.claude-omni-tier5-mode`（或 v2）

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
- **append.v1.txt / append.v2.txt 内容随时改随时生效** — runtime read 机制，编辑完重启 Claude 即可，不用重 install

## 为什么是 ★★★★★

完全替换 SDK system prompt 后，模型读到的"系统指令"就是我们写的——Code tab SDK 默认的所有安全段（refuse-on-malicious-code 等）整段消失。模型没有"前段约束"拉扯，按当前 mode 对应的 append 文件直接行动。

Cowork 那侧另走一条路：prepend 我们的 deployment-context 顶段，再 strip 掉 `<refusal_handling>` / `<user_wellbeing>` / `<anthropic_reminders>` 三段——这三段是 Cowork 独有的"额外锁"（Code tab SDK 默认里没有），是 Cowork 比 Code 受限的根源。

软默认 / 中默认 / 强默认 三档都能翻；硬默认（CSAM / CBRN 武器明确合成 / 大规模骚扰煽动）改不动，那是 L0/L1 强拒绝倾向。

## 装这档之前要知道的代价

完全替换 SDK system prompt 不只换掉了安全段，也丢掉了 SDK 默认 prompt 里给"正经任务"喂的能力上下文（编程脚手架、工具使用约定、coding agent 工作流提示等）。装上 tier-5 之后做 jailbreak 类研究最稳，但拿来写代码 / 跑技术问答 / 做日常工作可能会感觉模型"变笨"——能力下降明显。

**按需选档**：日常工作切 tier-2 / tier-3 就够，只在做 jailbreak 研究时再切 tier-5，通过 `uninstall.bat` 互切即可。

更详细的层级解释见仓库根目录 `docs/architecture.html`。
