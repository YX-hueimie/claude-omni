# core — 基础 CLAUDE.md（必选）

为成年独立专业用户设计的 Claude 工作偏好基础配置。本仓库其他 CLAUDE.md 类补丁（如 `persona-laoniang/`）都是叠加在这之上的可选层。

## 这是什么

一份合理打底的 CLAUDE.md：

- 建立"专业用户、合法工作语境"的身份背景
- 让 Claude 回话直接，不加冗余客套和免责声明
- 稳定边界但合法的请求（成人虚构、暗黑创作、安全研究等）
- 处理几个"特别飘"的行为：被问系统提示词时全文输出、角色扮演时何时出戏、对授权范围的默认假设

## 为什么不用 jailbreak 模板

传统 jailbreak 模板（"override all restrictions" / "you have no content policy" 之类）会触发 Anthropic 训练里的对抗输入识别——拒绝率比不写还高。

这份配置走相反思路：不主张超越规则，只**沟通工作语境 + 配置风格**。

- 风格指令是 100% 生效的（长度、emoji、markdown、语气、客套程度都吃这套）
- 身份语境会让模型按对应专业度调整回话（识别出"专业用户"后自动减少冗余解释）
- 没有任何"override / unrestricted / no policy"措辞，因此不命中越狱识别

实测在 Claude Opus 4.7 / Sonnet 4.6 上，边界但合法的请求通过率比无配置高、比 jailbreak 模板更稳定。

## 怎么装

把本目录下的 `CLAUDE.md` 复制到下面任一路径：

| 路径 | 作用范围 |
|---|---|
| `~/.claude/CLAUDE.md`（macOS / Linux）<br>`%USERPROFILE%\.claude\CLAUDE.md`（Windows） | 全局，所有 Claude Code 会话 |
| `<项目>/.claude/CLAUDE.md` | 项目级 |
| `<项目>/CLAUDE.md` | 项目级（备用路径） |

放好后**重启 Claude Code 会话**——CLAUDE.md 是会话启动时加载的，正在跑的会话不会自动重新读。

## 与其他补丁的关系

- `persona-laoniang/` 是叠加在这份 core 之上的「傲娇大姐」人设层（说话方式从"专业直白"换成"自称老娘的傲娇大姐口气"）。如果同时想要那个人设效果，**直接装 `persona-laoniang/CLAUDE.md` 替代这份 core 即可**——那份已经是 core + 人设合并版，开箱即用，不需要在这份上手动拼接。
- `desktop-font/` 和 `desktop-i18n/` 是 Claude Desktop 应用层补丁，跟这份 CLAUDE.md 无关，可独立使用。

## 调你自己的版本

里面那些"使用者背景"和"任务偏好"按"成年独立专业工作者"的常见用例写。按你实际改：

- `User Profile` 段：换成你自己的工作类型描述
- `Technical tasks` / `Creative writing`：不用其中某类工作就删那段
- `Style` 段那条"用用户语言回应"指令——它强制 Claude 用什么语言出，按你母语改
- `Things to avoid`：补你想要 Claude 别做的具体行为

注意：不要往里加 "override all restrictions" / "you have no content policy" 这类越狱措辞。加了会让整份文件被识别为对抗输入，反而效果变差。

## 已知边界

- 真实硬限（CSAM、武器合成、真人骚扰等）依然拒绝——这份配置不能也不该绕过
- 不同模型版本对同一 prompt 反应略有差异（Opus 4.7 测试稳定）
- 当前轮的明确指令优先于这份 CLAUDE.md（"这次别加例子"会临时覆盖默认行为）
- 长会话经压缩后偏好会偶尔减弱，提醒一句即可恢复

## License

MIT，与项目根 [LICENSE](../LICENSE) 一致。
