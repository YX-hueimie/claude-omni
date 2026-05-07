# tier-3 · system prompt append + skills

强度 ★★★ — 五档里第二强，只比 tier-5 弱。

## 这一档干什么

tier-2 + skills 一起装：

1. **patch Claude Desktop 的 `app.asar`** — 跟 tier-2 完全一致的 asar patch：
   - Code tab 劫持 `appendSystemPrompt` 字段，把本目录的 `append.txt` 拼到 SDK system prompt 主体的末尾（成为 system prompt 的一部分，system 角色）。
   - Cowork 劫持 `baseSystemPrompt`，把 append.txt 内容 prepend 到原 P 之前（不剥三段）。
2. **skills** → `~/.claude/skills/<name>/SKILL.md` × 4
   - `pentest-engagement` / `adult-fiction-writing` / `llm-safety-research` / `bounty-safe-harbor`

双 system 通道叠加：append.txt 拼到 system prompt 主体末尾（**system 角色**，全局始终生效），skill 的 description 进 system prompt 的 `<available_skills>` 段（**也是 system 角色**，跟 Anthropic 自带 skill 同档，模型按 user 消息语境激活其中一个）。同一个 system 角色域里两份独立声明，按时机分工。

## 内容用 deployment-context，不是 PERSONA-INJECT

`append.txt` 是 deployment-context 措辞（企业 SDK 部署语境），不是 PERSONA-INJECT 模板。塞到 system 角色的位置就该用这种形态——PERSONA-INJECT 那种"override / never refuse"模板放 system 角色反而劣化。详细解释见 tier-2 README。

**跟 tier-5 的 append.txt 不是同一份**——只是同名：

- 这份是**精简版**（追加模式专用）：只含 deployment-context / defaults / response-style 三段，因为 SDK 默认那段还在前面，不重复。
- tier-5 那份是**完整版**（整段替换专用）：完整复刻整个 SDK 默认结构 + deployment-context 顶段，因为 tier-5 替换之后没有"前段 SDK 默认"可依赖了。

## 装法

双击 `install.bat`（Windows，要管理员权限——首次会自动 UAC 提权）。

要求：
- Windows 10 / 11（仅支持 MSIX 装的 Claude Desktop）
- Python 3
- Node.js（`@electron/asar` / `@electron/fuses` 用 npx 跑）

## 卸载

- 双击 `uninstall.bat` — 智能卸载：剥本 patch 的 marker、删我们装的 4 个 skill、还原备份。其他 patch（i18n / font）共存时只剥本 patch。
- `emergency-restore.bat` — 字节级还原原版 asar / exe / unpacked，应对 Claude 打不开等坏掉状态（不动 skills）。

## append.txt 内容随改随生效

跟 tier-2 / tier-5 一样走 runtime read 模式——install 之后改本目录的 `append.txt`，重启 Claude 即生效，不用重跑 install。

## 注意

- **跟其他 tier 互斥** — 装本 tier 前要先卸 tier-1 / 2 / 2.5 / 5
- **改 fuse 后数字签名失效** — Windows SmartScreen 第一次启动会弹"未知发布者"，点"仍要运行"
- **Claude Desktop 升级会覆盖 patch** — MS Store 自动更新后要重跑 `install.bat`
- **Cowork 不读 ~/.claude/skills/** — skills 那部分只对 Code 生效；Cowork 那侧靠 baseSystemPrompt prepend 接 append.txt 内容

## 为什么是 ★★★

tier-2 的 system 主体注入 + tier-2.5 的 skill description 注入——两份都进 system 角色，但激活时机不同：主体末尾的 deployment-context 始终生效，skill description 由 user 消息语境激活。同一个角色域里有两个相互独立又互相印证的声明，比 tier-2 单点注入稳。

但 SDK 默认 system prompt 主体（含 refuse-on-malicious-code 等隐式安全约束）还在前面拉扯模型，所以比 tier-5 整段替换弱。

更详细的层级解释见仓库根目录 `docs/architecture.html`。
