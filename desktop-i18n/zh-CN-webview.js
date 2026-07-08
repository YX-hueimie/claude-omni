/**
 * Claude.ai 主对话 UI 汉化脚本（webview 注入版本）
 *
 * 关键设计（避开 React 翻译的三大坑）：
 *   1. 只替换 textNode 的 textContent + 属性，绝不动 innerHTML——避免破坏 React 事件绑定
 *   2. MutationObserver 触发时先 disconnect 自己再翻译，翻译完再 connect——避免无限循环
 *   3. 用 queueMicrotask 合并同一批 mutation，延迟接近 0——避免"先英后中"闪烁
 */
(function () {
  "use strict";
  if (window.__CLAUDE_I18N_INSTALLED__) return;
  window.__CLAUDE_I18N_INSTALLED__ = true;

  const translations = {
    // Word 安装提示 / 连接错误 / 回复
    "Opening Word… Nothing happened?": "正在打开 Word… 没反应？",
    "Install from Microsoft AppSource instead.": "改从 Microsoft AppSource 安装。",
    "We couldn't connect to Claude. Please check your network connection and try again.": "无法连接到 Claude。请检查你的网络连接后重试。",
    "We couldn’t connect to Claude. Please check your network connection and try again.": "无法连接到 Claude。请检查你的网络连接后重试。",
    "Reply": "回复",
    // 职业选择 / 启动状态 / 停止按钮
    "Starting up…": "启动中…",
    "Starting up...": "启动中…",
    "Preparing session…": "正在准备会话…",
    "Preparing session...": "正在准备会话…",
    "What kind of work do you do?": "你从事什么工作？",
    "What shall we think through?": "有什么要一起想清楚的？",
    "Scientist": "科学家",
    "Student": "学生",
    "Founder": "创始人",
    "Healthcare": "医疗",
    "Writer": "作家",
    "Educator": "教育工作者",
    "Consultant": "顾问",
    "Researcher": "研究员",
    "Stop Claude response": "停止 Claude 回复",
    "Queue": "排队",
    // Cowork onboarding 引导页
    "Get to know Cowork": "了解 Cowork",
    "Turn on notifications": "开启通知",
    "Claude can ping you when it finishes work or needs your input": "Claude 完成工作或需要你输入时会提醒你",
    "Customize Claude to your role": "按你的角色定制 Claude",
    "Add ready-made tools and workflows": "添加现成的工具和工作流",
    "Schedule a recurring task": "安排周期性任务",
    "Great for reminders, reports, or regular check-ins": "适合提醒、报告或定期检查",
    "Working on it…": "处理中…",
    "Thought process": "思考过程",
    "You've got the basics!": "你已掌握基础！",
    "You’ve got the basics!": "你已掌握基础！",
    // 会话筛选空状态
    "No sessions match the current filters": "没有会话符合当前筛选条件",
    "Show all sessions": "显示所有会话",
    // 跳过所有权限对话框 / 打开文件夹
    "Claude will read, edit, and execute files without asking — including potentially destructive commands. Only use this in isolated or disposable environments.": "Claude 将无需询问即可读取、编辑和执行文件——包括潜在的破坏性命令。请仅在隔离或一次性环境中使用。",
    "Open folder…": "打开文件夹…",
    "Open folder...": "打开文件夹...",
    // 计划提议栏 / 接受模式 / 用量限制横幅
    "Claude proposed a plan": "Claude 提议了一个计划",
    "Open plan": "打开计划",
    "Revise…": "修改…",
    "Revise...": "修改...",
    "Revise": "修改",
    "Accept and auto mode": "接受并自动运行",
    "Accept and allow edits": "接受并允许编辑",
    "Accept and bypass permissions": "接受并跳过权限",
    "Select any text to leave a comment for Claude": "选中任意文本即可给 Claude 留言",
    "Anything else to add?": "还有什么要补充的？",
    "Approaching weekly usage limit": "即将达到每周用量上限",
    // 发送菜单 / 取消套餐对话框
    "Send and stay here": "发送并留在此处",
    "You'll lose access to": "你将失去以下访问权限",
    "You’ll lose access to": "你将失去以下访问权限",
    "Build, debug, and ship by describing what you need.": "用自然语言描述需求，即可构建、调试并发布。",
    "Hand off tasks to Claude so you can focus on other work.": "把任务交给 Claude，你就能专注于其他工作。",
    "Keep your Max plan": "保留你的 Max 套餐",
    // 后台任务空状态
    "Background work appears here": "后台任务会显示在这里",
    "Background work appears here.": "后台任务会显示在这里。",
    // changelog 2026-06-18 (1.14271.0)
    // 改进
    "Changed routines to count against your regular usage limits instead of a separate daily included-run limit, and removed the included-runs indicator.": "将定时任务改为计入你的常规用量上限，而非单独的每日包含运行次数上限，并移除了包含运行次数指示器。",
    "Updated the model picker to show restricted models as non-selectable with an explanatory badge, and to reflect your organization's allowed default model.": "更新了模型选择器：受限模型显示为不可选并带说明徽标，同时反映你所在组织允许的默认模型。",
    "Updated the model picker to show restricted models as non-selectable with an explanatory badge, and to reflect your organization’s allowed default model.": "更新了模型选择器：受限模型显示为不可选并带说明徽标，同时反映你所在组织允许的默认模型。",
    // 修复
    "Fixed the app prompting you to sign in again every day when your claude.ai session was more than a day old.": "修复了当你的 claude.ai 会话存在超过一天后，应用每天都提示你重新登录的问题。",
    "Fixed Claude Design links in chat navigating the app in place instead of opening Claude Design.": "修复了聊天中的 Claude Design 链接在原地跳转应用、而非打开 Claude Design 的问题。",
    "Fixed the app showing a blank window when a network proxy redirects the connection to Claude.": "修复了网络代理重定向到 Claude 的连接时应用显示空白窗口的问题。",
    "Fixed HTML and SVG file previews showing black text on a dark background in dark mode.": "修复了深色模式下 HTML 和 SVG 文件预览在深色背景上显示黑色文字的问题。",
    "Fixed menus and popovers opening behind the preview panel.": "修复了菜单和弹出框打开时被预览面板遮挡的问题。",
    "Fixed Claude in Chrome file uploads failing for files in the session's shared folders and outputs.": "修复了 Claude in Chrome 上传会话共享文件夹和输出中的文件时失败的问题。",
    "Fixed Claude in Chrome file uploads failing for files in the session’s shared folders and outputs.": "修复了 Claude in Chrome 上传会话共享文件夹和输出中的文件时失败的问题。",
    "Fixed scheduled tasks leaving earlier processes running after each scheduled run.": "修复了定时任务在每次计划运行后仍残留先前进程的问题。",
    "Fixed Windows file paths showing garbled characters in the folder access approval card, and reduced unnecessary folder access denials when allowed workspace folders are configured.": "修复了 Windows 文件路径在文件夹访问授权卡中显示乱码的问题，并在已配置允许的工作区文件夹时减少了不必要的文件夹访问拒绝。",
    // changelog 2026-06-16 (1.13576.0)
    // 新
    "Added a unified Artifacts view that lists your chat, Code, and Cowork artifacts in one searchable place, with a \"New artifact\" menu and a \"Filter by\" control to narrow the list by source.": "新增了统一的 Artifacts 视图，把你的 Chat、Code 和 Cowork artifact 集中到一个可搜索的位置，并带有「新建 artifact」菜单和「筛选方式」控件，可按来源缩小列表范围。",
    "Added a unified Artifacts view that lists your chat, Code, and Cowork artifacts in one searchable place, with a “New artifact” menu and a “Filter by” control to narrow the list by source.": "新增了统一的 Artifacts 视图，把你的 Chat、Code 和 Cowork artifact 集中到一个可搜索的位置，并带有「新建 artifact」菜单和「筛选方式」控件，可按来源缩小列表范围。",
    "Added running dev servers to the Background tasks panel, with stop and open-preview actions.": "把运行中的开发服务器加入了后台任务面板，并提供停止和打开预览操作。",
    // 改进
    "Improved find-in-page to search the entire session transcript instead of only the text scrolled into view, and the find bar now reliably takes keyboard focus when opened.": "改进了页内查找：现在搜索整个会话记录，而不只是滚动到可见区域的文本；查找栏打开时也能稳定获得键盘焦点。",
    "Improved the Code file viewer: images, video, and audio now play inline instead of showing as text, and Markdown, CSV, and image files refresh automatically when Claude edits them.": "改进了 Code 文件查看器：图片、视频和音频现在内联播放，而不再以文本显示；Markdown、CSV 和图片文件在 Claude 编辑后会自动刷新。",
    "Updated the model picker. The three headline models appear at the top level with older models and context-size variants under \"More models\", each model shows a capability description, and currently-unavailable models appear disabled instead of failing when selected.": "更新了模型选择器：三个主力模型显示在顶层，较旧的模型和上下文长度变体归到「更多模型」下；每个模型都有能力说明；当前不可用的模型显示为禁用，而不再在选中时报错。",
    "Updated the model picker. The three headline models appear at the top level with older models and context-size variants under “More models”, each model shows a capability description, and currently-unavailable models appear disabled instead of failing when selected.": "更新了模型选择器：三个主力模型显示在顶层，较旧的模型和上下文长度变体归到「更多模型」下；每个模型都有能力说明；当前不可用的模型显示为禁用，而不再在选中时报错。",
    "Updated the in-session artifact panel: switch between a session's published artifacts from the title dropdown, see when an artifact was last updated, copy a share link, and open, share, or delete the artifact from the overflow menu.": "更新了会话内 artifact 面板：可从标题下拉切换会话已发布的各个 artifact、查看 artifact 的最后更新时间、复制分享链接，并从溢出菜单打开、分享或删除 artifact。",
    "Updated the in-session artifact panel: switch between a session’s published artifacts from the title dropdown, see when an artifact was last updated, copy a share link, and open, share, or delete the artifact from the overflow menu.": "更新了会话内 artifact 面板：可从标题下拉切换会话已发布的各个 artifact、查看 artifact 的最后更新时间、复制分享链接，并从溢出菜单打开、分享或删除 artifact。",
    "Changed the Code sessions tab from \"Projects\" to \"All sessions\". It now lists your non-project sessions alongside project sessions and adds a multi-select Environment filter.": "把 Code 会话标签页从「项目」改为「所有会话」：现在会把你的非项目会话与项目会话一并列出，并新增了多选的环境筛选。",
    "Changed the Code sessions tab from “Projects” to “All sessions”. It now lists your non-project sessions alongside project sessions and adds a multi-select Environment filter.": "把 Code 会话标签页从「项目」改为「所有会话」：现在会把你的非项目会话与项目会话一并列出，并新增了多选的环境筛选。",
    // 修复
    "Fixed keyboard shortcut conflicts failing silently. Assigning a shortcut already held by another app now tells you and keeps your previous shortcut working, and Quick Entry registration errors now appear in Settings.": "修复了键盘快捷键冲突静默失败的问题：现在为已被其他应用占用的快捷键赋值会有提示，并保留你原来的快捷键继续生效；Quick Entry 注册错误现在也会显示在设置中。",
    "Fixed the first-run notification explaining that Claude keeps running in the notification area never appearing on Windows.": "修复了说明「Claude 会在通知区域持续运行」的首次启动通知在 Windows 上从不出现的问题。",
    "Fixed corrupt plugin downloads crashing or hanging the app.": "修复了损坏的插件下载导致应用崩溃或卡死的问题。",
    "Fixed skills sometimes staying on an older version after being edited until toggled off and on.": "修复了技能在编辑后有时仍停留在旧版本、需要关闭再重新开启才更新的问题。",
    "Fixed pull request status checks. Failures now show a small warning indicator on the branch row instead of repeated error popups, the \"status couldn't be checked\" warning appears less often and can always be dismissed, and only GitHub CLI sign-in problems still raise a notification.": "修复了拉取请求状态检查：失败现在在分支行显示一个小的警告标记，而不再反复弹出错误；「无法检查状态」警告出现得更少且始终可关闭；只有 GitHub CLI 登录问题仍会触发通知。",
    "Fixed pull request status checks. Failures now show a small warning indicator on the branch row instead of repeated error popups, the “status couldn’t be checked” warning appears less often and can always be dismissed, and only GitHub CLI sign-in problems still raise a notification.": "修复了拉取请求状态检查：失败现在在分支行显示一个小的警告标记，而不再反复弹出错误；「无法检查状态」警告出现得更少且始终可关闭；只有 GitHub CLI 登录问题仍会触发通知。",
    // changelog 2026-06-11
    "Added Find Next and Find Previous keyboard shortcuts to in-app search.": "为应用内搜索新增了「查找下一个」和「查找上一个」快捷键。",
    "Added the Files panel to remote and SSH sessions — search the session's files and open them in the viewer — plus a Show in Files button in the file viewer.": "为远程和 SSH 会话新增了文件面板——可搜索会话的文件并在查看器中打开——并在文件查看器中加了「在文件中显示」按钮。",
    "Added the Files panel to remote and SSH sessions — search the session’s files and open them in the viewer — plus a Show in Files button in the file viewer.": "为远程和 SSH 会话新增了文件面板——可搜索会话的文件并在查看器中打开——并在文件查看器中加了「在文件中显示」按钮。",
    "Added a running-tasks button to the activity indicator that opens the Tasks panel, and Bash rows in the Background tasks panel now open to show their output, including a live tail while the command runs.": "在活动指示器上新增了运行中任务按钮，点击可打开任务面板；后台任务面板中的 Bash 行现在可展开查看输出，命令运行期间还能实时跟踪。",
    "Added model-picker memory — the picker now remembers your last model choice.": "新增了模型选择器记忆——选择器现在会记住你上次选择的模型。",
    "Fixed preview panes stealing keyboard focus from the chat input when they reloaded or navigated.": "修复了预览面板在重新加载或跳转时从聊天输入框抢走键盘焦点的问题。",
    "Fixed sessions failing to start after your sign-in expired — the app now prompts you to sign in again.": "修复了登录过期后会话无法启动的问题——应用现在会提示你重新登录。",
    "Fixed SSH sessions: forking no longer opens an empty conversation, and connections no longer fail with \"Failed to upload file\" errors on remotes first set up by early-2026 versions of the app.": "修复了 SSH 会话：派生不再打开空对话；在由 2026 年初版本应用首次配置的远程主机上，连接也不再因「文件上传失败」错误而失败。",
    "Fixed SSH sessions: forking no longer opens an empty conversation, and connections no longer fail with “Failed to upload file” errors on remotes first set up by early-2026 versions of the app.": "修复了 SSH 会话：派生不再打开空对话；在由 2026 年初版本应用首次配置的远程主机上，连接也不再因「文件上传失败」错误而失败。",
    "Fixed renaming a session while its title was still generating — the generated title no longer overwrites the name you set.": "修复了标题仍在生成时重命名会话的问题——生成的标题不再覆盖你设置的名称。",
    "Fixed the Pull Requests view showing \"No open pull requests\" when GitHub isn't connected — it now prompts you to connect.": "修复了未连接 GitHub 时拉取请求视图显示「没有打开的拉取请求」的问题——现在会提示你连接。",
    "Fixed the Pull Requests view showing “No open pull requests” when GitHub isn’t connected — it now prompts you to connect.": "修复了未连接 GitHub 时拉取请求视图显示「没有打开的拉取请求」的问题——现在会提示你连接。",
    // Cowork 介绍弹窗 + Go back
    "Go back": "返回",
    "You set the direction. Cowork gets it done.": "你定方向，Cowork 来搞定。",
    "You set the direction.": "你定方向。",
    "Cowork gets it done.": "Cowork 来搞定。",
    "Tell Claude what you need so you can move on to whatever's next. It'll organize files, draft reports, and crunch data—all at the same time.": "把你需要的告诉 Claude，你就能去忙下一件事。它会同时整理文件、起草报告、处理数据。",
    "Tell Claude what you need so you can move on to whatever’s next. It’ll organize files, draft reports, and crunch data—all at the same time.": "把你需要的告诉 Claude，你就能去忙下一件事。它会同时整理文件、起草报告、处理数据。",
    "Check in when you want or just let Claude run.": "想看进度随时查，或者放手让 Claude 跑。",
    "Write a PRD for the new notifications feature": "为新的通知功能写一份 PRD",
    "What level of detail do you need?": "你需要多详细？",
    "High-level overview": "高层概览",
    "MVP scoping": "MVP 范围界定",
    "Detailed spec": "详细规格",
    "Something else": "其他",
    "Try Cowork": "试试 Cowork",
    "Later": "稍后",
    // 图片右键菜单 (Copy/Save partial 会把 image 漏翻, 整项 exact 覆盖)
    "Copy image": "复制图片",
    "Save image": "保存图片",
    // 后台任务(Workflow)面板 (Agent 作为术语保留英文, 不翻"代理")
    "Phases": "阶段",
    "No agents have started yet": "尚无 Agent 启动",
    // 安全切换模型提示
    "This model has safety measures that flagged something in this session. This sometimes happens with safe, normal conversations. These measures let us bring you Mythos-level capability in other areas sooner, and we're working to refine them.": "此模型的安全机制在本次会话中标记了某些内容。这有时也会发生在安全、正常的对话中。这些机制让我们能更快地在其他领域为你带来 Mythos 级能力，我们也在持续改进它们。",
    "This model has safety measures that flagged something in this session. This sometimes happens with safe, normal conversations. These measures let us bring you Mythos-level capability in other areas sooner, and we’re working to refine them.": "此模型的安全机制在本次会话中标记了某些内容。这有时也会发生在安全、正常的对话中。这些机制让我们能更快地在其他领域为你带来 Mythos 级能力，我们也在持续改进它们。",
    // 模型不可用提示 (isn't 直/弯撇号双版本)
    "This model isn't available": "此模型不可用",
    "This model isn’t available": "此模型不可用",
    "Switch to a different model from the model picker to continue.": "请从模型选择器切换到其他模型以继续。",
    // 朗读 (TTS): Read 是单词级条目, partial 残留 "aloud", 整短语优先
    "Read aloud": "朗读",
    "Send feedback": "发送反馈",
    "feedback": "反馈",
    "learn more": "了解更多",
    "or": "或",
    // 不问直接操作 已开启横幅
    "Claude works, uses connectors, and browses the web without pausing for approval. You can turn off individual connectors in the Add menu.": "Claude 会直接工作、使用连接器并浏览网页，不再暂停等待批准。你可以在「添加」菜单中关闭单个连接器。",
    "For this task, Claude will work and use connectors without pausing for approval.": "对于此任务，Claude 将直接工作并使用连接器，不再暂停等待批准。",
    "Don't show again": "不再显示",
    "Don’t show again": "不再显示",
    // 不问直接操作(自动运行)对话框
    "Claude will work and use your connectors without pausing for approval. This can put your data at risk.": "Claude 将直接工作并使用你的连接器，不再暂停等待批准。这可能使你的数据面临风险。",
    "Claude can act anywhere on the internet, which could put your data at risk.": "Claude 可以在互联网上任意操作，这可能使你的数据面临风险。",
    // 文件夹访问授权对话框
    "This includes all files and subfolders. Claude will be able to read, edit, and permanently delete—and may share file contents with third-party tools it connects to. Be careful about exposing sensitive information.": "这包括所有文件和子文件夹。Claude 将能够读取、编辑和永久删除——并可能与它所连接的第三方工具共享文件内容。请谨慎对待敏感信息的暴露。",
    "Always allow": "始终允许",
    "Allow": "允许",
    // 文件访问错误 toast
    "File access was denied.": "文件访问被拒绝。",
    "File access was denied": "文件访问被拒绝",
    "Open a GitHub project on your computer, make a quick code change, and run the tests.": "在你的电脑上打开一个 GitHub 项目，做个快速的代码改动，然后运行测试。",
    // Dispatch / 应用授权 / 通知页
    "Revoke access": "撤销访问权限",
    "Revoke access?": "撤销访问权限？",
    "Revoke Access": "撤销访问权限",
    "This will revoke access for this application. You'll need to reconnect it if you want to use it again.": "这将撤销此应用的访问权限。如需再次使用，需要重新连接。",
    "This will revoke access for this application. You’ll need to reconnect it if you want to use it again.": "这将撤销此应用的访问权限。如需再次使用，需要重新连接。",
    "Dispatch is off": "Dispatch 已关闭",
    "Turn it on in Settings to dispatch work to Claude from your phone.": "在设置中开启，即可从手机向 Claude 派发任务。",
    "Go to Settings": "前往设置",
    "Go to": "前往",
    "Bypass": "跳过",
    "Dismiss": "忽略",
    // 手机 App 配对页
    "Pair with the Claude Mobile app": "与 Claude 手机 App 配对",
    "Use the mobile app to talk to Claude while it works from your desktop. Scan the code to download it on your phone.": "在桌面端工作时，用手机 App 与 Claude 对话。扫码即可在手机上下载。",
    "Use the mobile app to talk to Claude while it works from your desktop.": "在桌面端工作时，用手机 App 与 Claude 对话。",
    "Scan the code to download it on your phone.": "扫码即可在手机上下载。",
    "I'm signed in on my phone": "我已在手机上登录",
    "I’m signed in on my phone": "我已在手机上登录",
    "Set up later": "稍后设置",
    // 手机通知未送达提示 (won't 直/弯撇号双版本)
    "Notifications won't reach your phone yet. Open Claude on your phone and allow notifications.": "通知暂时还无法送达你的手机。请在手机上打开 Claude 并允许通知。",
    "Notifications won’t reach your phone yet. Open Claude on your phone and allow notifications.": "通知暂时还无法送达你的手机。请在手机上打开 Claude 并允许通知。",
    // === 思考强度滑杆 (Opus 4.8 effort: Faster ←→ Smarter) ===
    "Faster": "更快",
    "Smarter": "更聪明",
    "Extra": "超高",            // 新档位，等同旧 "Extra high"
    // "Ultracode" 保留英文 — 功能名，不翻 (同 Cowork / Artifacts)

    // === 消息悬浮/右键菜单 (整段精确，盖掉 Copy/Pin partial 拆词) ===
    "Copy this code": "复制此代码",
    "Attach selection as context": "将选区作为上下文附加",
    "Copy message": "复制消息",
    "Copy as Markdown": "复制为 Markdown",
    "Attach message as context": "将消息作为上下文附加",
    "Pin as chapter": "置顶为章节",

    // === 模型选择器 changelog / Fable 介绍 ===
    "View changelog": "查看更新日志",
    "Fable is the most capable model and draws down usage 2× faster than Opus": "Fable 是能力最强的模型，用量消耗速度是 Opus 的 2 倍",

    // === Cowork 用量推广卡 (含日期的两条走 dynamicPatterns) ===
    "2× usage for Cowork": "Cowork 双倍用量",
    "Let's tackle something together": "一起来搞定点什么吧",
    "Let’s tackle something together": "一起来搞定点什么吧",
    "Start task": "开始任务",

    // === 设置/通用: 消息被标记时切换模型 ===
    // 标题 exact; 描述太长 + 含撇号/内部空白，exact 命不中，改走 dynamicPatterns 正则
    "Switch models when a message is flagged": "消息被标记时切换模型",

    // === 设置/外观 ===
    "High-contrast dark theme": "高对比深色主题",
    "Use a darker, near-black background when dark mode is on.": "深色模式开启时使用更深的近黑色背景。",
    "Interface font": "界面字体",
    "Font for the Claude Code interface — menus, sidebar, and chat.": "Claude Code 界面的字体 —— 菜单、侧边栏和对话。",
    "Anthropic Sans": "Anthropic 无衬线",
    "Transcript text size": "对话文字大小",
    "Size of the conversation transcript text.": "对话记录文字的大小。",
    "Transcript width": "对话宽度",
    "Maximum width of the transcript and composer columns.": "对话和输入栏的最大宽度。",
    "Narrow": "窄",
    "Wide": "宽",

    // === 设置/Beta: 动态工作流 (Workflow 功能) ===
    "Dynamic workflows": "动态工作流",
    "Let Claude run multiple agents in parallel for complex tasks. Workflows can use a lot of your usage limit quickly.": "让 Claude 为复杂任务并行运行多个 agent。工作流可能很快消耗大量用量。",

    // === git / repo 右键菜单 (整段精确，盖掉 Open/Copy/Add/from partial 拆词) ===
    "Open repo in GitHub": "在 GitHub 中打开仓库",
    "Copy branch name": "复制分支名",
    "Create PR": "创建 PR",
    "Create draft PR": "创建草稿 PR",
    "Manually create PR": "手动创建 PR",
    "Add another folder": "添加另一个文件夹",
    "worktree": "工作树",
    // === 分支选择器 ===
    "Branch to start from": "起始分支",
    "Search branches…": "搜索分支…",
    "Search branches...": "搜索分支...",
    "No branches match.": "没有匹配的分支。",
    "No branches match": "没有匹配的分支",

    // === Code tab 顶栏 / 上下文菜单 ===
    "Working directory": "工作目录",
    "Diff": "差异",
    "Background tasks": "后台任务",
    "Unread": "未读",

    // === Cowork 工作区启动失败 (lead 段被 "重装工作区" 链接切分，走 dynamicPatterns) ===
    "VM service not running. The service failed to start.": "VM 服务未运行。服务启动失败。",

    // === 模型选择器 (含 effort 子菜单 tooltip) ===
    "For your toughest challenges": "应对你最棘手的挑战",
    "For complex tasks": "处理复杂任务",
    "Higher effort means more thorough responses, but takes longer and uses your limits faster.": "更高的强度意味着回答更全面，但耗时更久、消耗额度更快。",
    "May use excessive tokens resulting in long response times and may hit token limits. Use sparingly for the hardest tasks.": "可能消耗过多 token，导致响应时间变长并可能触及 token 上限。仅在最难的任务上谨慎使用。",
    "Can think for more complex tasks": "可为更复杂的任务进行思考",

    // === 文件查看器错误 ===
    "File could not be read. It may have been deleted or moved, or it lives outside the session folder.": "无法读取文件。它可能已被删除或移动，或不在会话文件夹内。",

    // === 删除会话 确认对话框 (描述走 dynamicPatterns, 含撇号) ===
    "Delete sessions stored by Anthropic?": "删除 Anthropic 存储的会话？",
    "Delete stored sessions": "删除已存储的会话",
    "This can't be undone.": "此操作无法撤销。",
    "This can’t be undone.": "此操作无法撤销。",
    // 删除任务 确认：整串 exact 优先于通用 dynamicPattern 4495，避免 "this task" 被当变量残留
    "Are you sure you want to delete this task?": "确认删除此任务？",

    // === 设置/记忆 + 连接器搜索 ===
    "Allow Claude to remember relevant context from your chats. Memory includes your entire chat history with Claude.": "允许 Claude 记住对话中的相关上下文。记忆涵盖你与 Claude 的全部对话历史。",
    "Connector search": "连接器搜索",
    "Let Claude search the connector directory and surface ones relevant to your conversation.": "让 Claude 搜索连接器目录，并呈现与你对话相关的连接器。",

    // === 用量额度 ===
    "Usage credits": "用量额度",
    "Turn on usage credits to keep using Claude if you hit a limit.": "开启用量额度，达到上限后仍可继续使用 Claude。",

    // === 账单页 ===
    "Payment": "付款",
    "Total": "合计",
    "Actions": "操作",
    "Paid": "已支付",
    "Refunded": "已退款",
    "Cancellation": "取消订阅",
    "Cancel plan": "取消套餐",

    // === 设置/隐私 + 已分享 ===
    "Help improve our AI models": "帮助改进我们的 AI 模型",
    "No shared content found": "未找到已分享的内容",

    // === 设置/外观: Motion / 字体 ===
    "Anthropic Serif": "Anthropic 衬线",
    "Motion": "动效",
    "Reduced": "减弱",
    // 描述: 整句一节点走 dynamic; 若被拆成两句, 下面两条 fragment 兜
    "Reduce animation in streaming responses and other interface elements.": "减少流式回复和其他界面元素中的动画。",
    "System follows your operating system's reduce-motion setting.": "系统会跟随你操作系统的减弱动效设置。",
    "System follows your operating system’s reduce-motion setting.": "系统会跟随你操作系统的减弱动效设置。",

    // === 设置/语音 (Voice) ===
    "Voice": "语音",
    "Style": "风格",
    "Speed": "速度",
    "Slow": "慢速",
    // 语音风格名 (音色形容词) / "English" 语言名保留英文
    "Buttery": "顺滑",
    "Airy": "轻盈",
    "Mellow": "柔和",
    "Glassy": "清亮",
    "Rounded": "圆润",
    "Commit changes": "提交更改",

    // === 扩展设置页 ===
    // "Extension settings"/"Extension developer" 标题被拆成 "Extension"+后半 独立节点,
    // 整串精确(1131/1139)对不上, 加 "Extension" 片段接住前半
    "Extension": "扩展",
    "Open extension folder": "打开扩展文件夹",
    "Open Extension Settings Folder": "打开扩展设置文件夹",
    "Edit Config": "编辑配置",

    // === 设置/隐私 — 我们如何保护你的数据 (bullet) ===
    "You have control over your conversation data and can change your preferences any time in your": "你可以掌控自己的对话数据，要更改偏好可随时前往你的",
    "Anthropic deletes your data promptly when requested, except for safety violations or conversations you've shared through feedback.": "Anthropic 会在你提出请求时及时删除你的数据，但安全违规或你通过反馈分享的对话除外。",
    "Anthropic deletes your data promptly when requested, except for safety violations or conversations you’ve shared through feedback.": "Anthropic 会在你提出请求时及时删除你的数据，但安全违规或你通过反馈分享的对话除外。",
    "Anthropic doesn't sell your data to third parties.": "Anthropic 不会把你的数据出售给第三方。",
    "Anthropic doesn’t sell your data to third parties.": "Anthropic 不会把你的数据出售给第三方。",

    // === 设置/隐私 — 我们如何使用你的数据 (bullet) ===
    "With your permission, we will use your chats and coding sessions to train and improve our AI models. This helps us to 1) improve our AI models to make Claude more helpful and accurate for everyone and 2) develop more robust safeguards against harmful outputs.": "在你许可的情况下，我们会用你的对话和编程会话来训练并改进我们的 AI 模型。这有助于我们：1）改进 AI 模型，让 Claude 对所有人更有用、更准确；2）开发更强健的防护以抵御有害输出。",
    "Anthropic may use your email for account verification, billing, and Anthropic-led communications and marketing (e.g., emails sharing new product offerings and features).": "Anthropic 可能将你的邮箱用于账户验证、账单，以及 Anthropic 主导的通讯和营销（例如分享新产品和功能的邮件）。",
    "Anthropic may conduct aggregated, anonymized analysis of data to understand how people use Claude.": "Anthropic 可能对数据进行汇总、匿名化的分析，以了解人们如何使用 Claude。",
    "Anthropic may offer additional features, which will enable us to collect and use more of your data. You'll always be in control and can turn off these features in your account settings.": "Anthropic 可能提供额外功能，这会让我们收集并使用更多你的数据。你始终拥有控制权，可在账户设置中关闭这些功能。",
    "Anthropic may offer additional features, which will enable us to collect and use more of your data. You’ll always be in control and can turn off these features in your account settings.": "Anthropic 可能提供额外功能，这会让我们收集并使用更多你的数据。你始终拥有控制权，可在账户设置中关闭这些功能。",

    // === 导出数据对话框 ===
    "Conversations from": "对话范围",
    "From": "起始",
    "To": "结束",
    "Export will include": "导出将包含",
    "Conversations": "对话",
    "Users": "用户",
    "Export": "导出",
    "Export started": "导出已开始",

    // === 定价页 ===
    "Downgrade to Pro": "降级到 Pro",
    "Adjust usage": "调整用量",
    "Access to more Claude models": "使用更多 Claude 模型",
    "Questions? Chat with our buying agent.": "有疑问？与我们的购买顾问聊聊。",
    "Saved": "已保存",
    // "Seat price + usage at API rates" 等被 "API rates" 链接拆分, 补 lead 片段
    // ("API rates"→"API 费率" 已在 3112)
    "Seat price + usage at": "席位价格 + 用量按",
    "Usage credits available at": "用量额度可按",
    "Usage credits available at API rates": "用量额度可按 API 费率使用",

    // === 开启计算机使用 (Computer use) 对话框 ===
    "Turn on computer use?": "开启计算机使用？",
    "Claude will take screenshots of your screen and control your mouse and keyboard. You'll approve each app, but not confirm each step Claude performs.": "Claude 会截取你的屏幕，并控制你的鼠标和键盘。你会逐个批准应用，但不会确认 Claude 执行的每一步。",
    "Claude will take screenshots of your screen and control your mouse and keyboard. You’ll approve each app, but not confirm each step Claude performs.": "Claude 会截取你的屏幕，并控制你的鼠标和键盘。你会逐个批准应用，但不会确认 Claude 执行的每一步。",
    "Keep in mind:": "请注意：",
    "Some actions can't be undone.": "有些操作无法撤销。",
    "Some actions can’t be undone.": "有些操作无法撤销。",
    "Apps you approve could open other apps that you haven't approved.": "你批准的应用可能打开你未批准的其他应用。",
    "Apps you approve could open other apps that you haven’t approved.": "你批准的应用可能打开你未批准的其他应用。",
    "Websites and docs could contain malicious instructions that misdirect Claude.": "网站和文档可能包含误导 Claude 的恶意指令。",
    "Close anything sensitive. Claude can see your screen.": "关闭任何敏感内容。Claude 能看到你的屏幕。",
    "This is a research preview. Start with tasks where mistakes are easy to fix.": "这是研究预览版。请从容易纠错的任务开始。",
    "Read safe use tips": "阅读安全使用提示",

    // === 其它 ===
    "Explore architectural concepts": "探讨建筑概念",
    "Use voice mode": "使用语音模式",

    // === 项目页 / 排序下拉 ===
    "Recent activity": "最近活动",
    "Last edited": "最后编辑",
    "Date created": "创建日期",
    "Search projects...": "搜索项目...",
    "Search projects…": "搜索项目…",
    "Example project": "示例项目",
    "Create a project": "新建项目",
    "An example project that also doubles as a how-to guide for using Claude. Chat with it to learn more about how to get the most out of chatting with Claude!": "一个示例项目，同时也是使用 Claude 的入门指南。和它聊聊，了解如何充分利用与 Claude 的对话！",
    // === Artifacts 页 ===
    "Search artifacts...": "搜索 Artifact...",
    "Search artifacts…": "搜索 Artifact…",

    // === 思考状态指示器 (时间/token 是独立节点已翻; 这些状态短语单独节点) ===
    "still thinking...": "仍在思考中...",
    "still thinking…": "仍在思考中…",
    "thinking more...": "继续思考中...",
    "thinking more…": "继续思考中…",
    "almost done thinking...": "即将思考完毕...",
    "almost done thinking…": "即将思考完毕…",
    "thinking some more...": "再想想...",
    "thinking some more…": "再想想…",
    "thinking...": "思考中...",
    "thinking…": "思考中…",
    // 趣味思考状态 (首字母大写版; 这套很多, 见到再补)
    "Still thinking...": "还在思考...",
    "Still thinking…": "还在思考…",
    "Thinking hard...": "努力思考...",
    "Thinking hard…": "努力思考…",
    "Deep in thought...": "陷入沉思...",
    "Deep in thought…": "陷入沉思…",
    "Mulling it over...": "仔细琢磨...",
    "Mulling it over…": "仔细琢磨…",
    "Caramelizing onions...": "焦糖化洋葱中...",
    "Caramelizing onions…": "焦糖化洋葱中…",
    "Shelling...": "剥壳中...",
    "Shelling…": "剥壳中…",
    "Scrambling...": "炒蛋中...",
    "Scrambling…": "炒蛋中…",
    "Sautéing...": "煸炒中...",
    "Sautéing…": "煸炒中…",
    "Path copied to clipboard.": "路径已复制到剪贴板。",

    // === 域名白名单 / worktree 位置 ===
    "Claude can access all domains on the internet.": "Claude 可以访问互联网上的所有域名。",
    "Claude can only access domains you specify below. Add domains individually using wildcards if needed.": "Claude 只能访问你在下方指定的域名。如有需要，可逐个添加域名并使用通配符。",
    "Custom...": "自定义...",
    "Custom…": "自定义…",

    // === 分享设置对话框 ===
    "Require repository access": "需要仓库访问权限",
    "Only users with repository access can view your shared sessions.": "只有拥有仓库访问权限的用户才能查看你分享的会话。",
    "Show your name": "显示你的名字",
    "Your name appears on sessions you share.": "你的名字会显示在你分享的会话上。",

    // === 筛选/分组菜单 + 会话表 ===
    "All environments": "全部环境",
    "PR status": "PR 状态",
    "Apps and extensions": "应用和扩展",
    "Terminate": "终止",

    // === 后台任务 / dev server 预览菜单 ===
    "Finished": "已完成",
    "Open file...": "打开文件...",
    "Open file…": "打开文件…",
    "Show session logs": "显示会话日志",
    "Clear session data": "清空会话数据",
    "Enable auto-verify": "启用自动验证",
    "Edit config in VS Code": "在 VS Code 中编辑配置",
    "Run your dev server to inspect network requests, debug with logs, and see changes live.": "运行你的开发服务器，以检查网络请求、用日志调试、实时查看改动。",

    // === 杂项卡片/toast ===
    "Your styles have migrated to Skills": "你的风格已迁移到技能",
    "Add relevant context for your project": "为你的项目添加相关上下文",
    "Upload documents, code, and other files to the project for Claude to reference in your chats.": "上传文档、代码和其他文件到项目，供 Claude 在对话中引用。",
    "In this example project, we've added key files about how to use Claude.": "在这个示例项目里，我们添加了关于如何使用 Claude 的关键文件。",
    "In this example project, we’ve added key files about how to use Claude.": "在这个示例项目里，我们添加了关于如何使用 Claude 的关键文件。",
    "Analyze data, build presentations, draft documents, and triage your inbox with Claude alongside you.": "分析数据、制作演示、起草文档、整理收件箱，Claude 全程陪你。",

    // === Dispatch 手机配对引导页 ===
    "Online": "在线",
    "One conversation from anywhere": "随时随地，一段对话",
    "From your couch to your commute, hand off tasks to Claude and pick up exactly where you left off.": "从沙发到通勤路上，把任务交给 Claude，随时无缝续上。",
    "Pair your phone": "配对你的手机",
    "Claude will access your desktop (files, apps, and browser) to complete tasks you send from your phone. This may have security risks. Only pair devices that you own and trust.": "Claude 会访问你的桌面（文件、应用和浏览器）来完成你从手机发来的任务。这可能有安全风险，请只配对你拥有且信任的设备。",
    "Learn how to use this safely": "了解如何安全使用",

    // === 会话颜色菜单 ===
    "Color": "颜色",
    "Red": "红色",
    "Blue": "蓝色",
    "Green": "绿色",
    "Yellow": "黄色",
    "Purple": "紫色",
    "Orange": "橙色",
    "Pink": "粉色",
    "Cyan": "青色",

    // 更新内容(changelog)区块标题 ("New"→"新" 已在 1353); 个别长条目不逐条翻(读一次/每版新增, ROI 低)
    "Improved": "改进",
    "Fixed": "修复",

    // === 更新内容(changelog)正文条目 ===
    // Cowork 更新内容
    "Added a “Free Up Cowork Disk Space” option under Help > Troubleshooting, and Cowork now cleans up caches and old temporary files automatically when its workspace disk runs low.": "在 帮助 > 故障排查 下新增\"释放 Cowork 磁盘空间\"选项；工作区磁盘空间不足时，Cowork 现在会自动清理缓存和旧临时文件。",
    "Added a low-disk-space warning before Cowork downloads the files it needs to run.": "Cowork 下载运行所需文件前，磁盘空间不足会先警告。",
    "Added in-session effort and thinking controls for local Cowork projects.": "为本地 Cowork 项目加入了会话内的思考强度和思考开关。",
    "Updated the New project folder picker to default to your Claude data folder (~/Claude/Projects) instead of ~/Documents.": "新建项目的文件夹选择器现在默认指向你的 Claude 数据文件夹（~/Claude/Projects），而不是 ~/Documents。",
    "Fixed Claude reporting that a skill was updated when the change was never saved to your account.": "修复了改动从未保存到你账户、Claude 却报告 skill 已更新的问题。",
    "Fixed the /schedule command in Cowork showing as unavailable.": "修复了 Cowork 中 /schedule 命令显示为不可用的问题。",
    "Added a \"Free Up Cowork Disk Space\" option under Help > Troubleshooting, and Cowork now cleans up caches and old temporary files automatically when its workspace disk runs low.": "在 帮助 > 故障排查 下新增\"释放 Cowork 磁盘空间\"选项；工作区磁盘空间不足时，Cowork 现在会自动清理缓存和旧临时文件。",
    "Improved the read/unread toggle on sidebar sessions: it now works on the currently open session, has a larger click target, and shows a tooltip describing what a click will do.": "改进了侧边栏会话的已读/未读切换：现在对当前打开的会话生效、点击区域更大，并显示说明点击作用的提示。",
    // changelog 内联代码块切分 → 翻周围文字片段
    ") remembers where you placed and sized it": "）会记住你摆放的位置和大小",
    "Files you reference with": "你用",
    "show as chips in the transcript, not just videos": "引用的文件会在记录中显示为 chip，不只是视频",
    "Right-click any message →": "右键任意消息 →",
    "Every folder you've worked in appears under Recent — click the": "你处理过的每个文件夹都会出现在「最近」下——点击",
    "Every folder you’ve worked in appears under Recent — click the": "你处理过的每个文件夹都会出现在「最近」下——点击",
    "next to one to start a session there": "旁边的即可在那里开始会话",
    "Right-click a message or select text →": "右键消息或选中文本 →",
    "to reference it in your next message": "以便在下条消息中引用",
    "Your project's": "你项目的",
    "Your project’s": "你项目的",
    "model is used by default for new sessions": "中的模型会作为新会话的默认",
    "Project rows in the Recents sidebar expand with a click, and a hover-revealed": "最近侧边栏的项目行点一下即可展开，悬停显示的",
    "button opens the project page": "按钮可打开项目页",
    "When a remote session's working folder has been deleted,": "远程会话的工作文件夹被删除时，",
    "recovers it into a fresh worktree": "会把它恢复到一个全新的 worktree",
    "from the + menu opens straight to the installable plugin list": "从 + 菜单会直接打开可安装插件列表",
    "link in a response to highlight those lines in the file panel": "链接，点击即可在文件面板高亮这些行",
    "paths in responses are now clickable": "路径在回复中现在可点击",
    "Open a session in its own window to work on sessions side by side — drag it out from the sidebar, or": "在独立窗口打开会话以并排处理——从侧边栏拖出，或",
    "Pick your code font and theme in": "在以下位置选择代码字体和主题：",
    "Move a local session to the cloud from its": "把本地会话从它的",
    "menu so it keeps running when you close your laptop": "菜单移到云端，这样合上笔记本它也继续运行",
    "Dotfiles show up in the file tree and": "点文件（dotfiles）现在出现在文件树和",
    "-mention search": "提及搜索中",
    "Create and name your own session groups — drag sessions in, or right-click a session →": "创建并命名你自己的会话分组——把会话拖进去，或右键会话 →",
    "Turn on Remote Control for all new local sessions in": "在以下位置为所有新建本地会话开启远程控制：",
    "Right-click any folder in the file tree →": "右键文件树中的任意文件夹 →",
    "Right-click any file in the diff tree for": "右键 diff 树中的任意文件，可选",
    "from the diff view or a session's right-click menu": "从 diff 视图或会话的右键菜单",
    "Right-click any image in a response to": "右键回复中的任意图片以",
    "and bare URLs in your messages become clickable links": "以及你消息中的裸 URL 现在变成可点击链接",
    "Browse your project's files in a side pane — fuzzy-find by name, search contents with": "在侧边面板浏览项目文件——按名称模糊查找、用",
    "to find in file": "在文件内查找",
    "renames the current session": "重命名当前会话",
    "now shows a marker in the transcript where context was compacted": "现在会在记录中标出上下文被压缩的位置",
    "shows your token usage for the current session inline": "内联显示当前会话的 token 用量",
    "switches the model mid-session": "在会话中途切换模型",
    "steps back to before your last message": "回退到你上条消息之前",
    "sends feedback about the current session without leaving it": "提交关于当前会话的反馈，无需离开",
    "finds sessions you started since opening the app, and searches branches inside folders": "能找到你打开应用后开始的会话，并在文件夹内搜索分支",
    "attaches a file from your computer": "从你的电脑附加文件",
    "cycle focus between split panes": "在分屏面板间循环切换焦点",
    "opens a side chat with Claude without interrupting your main session": "打开与 Claude 的侧边对话，不打断你的主会话",
    "hooks run for local sessions too — jj and Sapling setups can use worktree isolation": "钩子在本地会话中也会运行——jj 和 Sapling 配置可以使用 worktree 隔离",
    "Search file contents with": "用",
    "works for folders that aren't git repos": "搜索文件内容，适用于非 git 仓库的文件夹",
    "Agents you define in your project's": "你在项目",
    "show up in the": "中定义的 agent 出现在",
    "-mention picker — and new ones appear without a restart": "提及选择器里——新增的无需重启即可出现",
    "The floating side chat": "悬浮侧边对话",
    "remembers where you placed and sized it": "会记住你摆放的位置和大小",
    "The floating side chat (Ctrl ;) remembers where you placed and sized it": "悬浮侧边对话（Ctrl ;）会记住你摆放的位置和大小",
    "Ctrl K finds sessions you started since opening the app, and searches branches inside folders": "Ctrl K 能找到你打开应用后开始的会话，并在文件夹内搜索分支",
    "/rename renames the current session": "/rename 重命名当前会话",
    "/usage shows your token usage for the current session inline": "/usage 内联显示当前会话的 token 用量",
    "Ctrl ] and Ctrl [ cycle focus between split panes": "Ctrl ] 和 Ctrl [ 在分屏面板间循环切换焦点",
    "Open a session in its own window to work on sessions side by side — drag it out from the sidebar, or Ctrl Click it": "在独立窗口打开会话以并排处理——从侧边栏拖出，或 Ctrl 点击它",
    "/btw or Ctrl ; opens a side chat with Claude without interrupting your main session": "/btw 或 Ctrl ; 打开与 Claude 的侧边对话，不打断你的主会话",
    "Ctrl U attaches a file from your computer": "Ctrl U 从你的电脑附加文件",
    "Pick your code font and theme in Settings → Claude Code → Appearance": "在 设置 → Claude Code → 外观 中选择代码字体和主题",
    "/model switches the model mid-session": "/model 在会话中途切换模型",
    "Right-click any message → Copy as Markdown or Copy link": "右键任意消息 → 复制为 Markdown 或 复制链接",
    "Open in editor from the diff view or a session's right-click menu": "从 diff 视图或会话右键菜单\"在编辑器中打开\"",
    "#123 and bare URLs in your messages become clickable links": "你消息中的 #123 和裸 URL 现在变成可点击链接",
    "/rewind steps back to before your last message": "/rewind 回退到你上条消息之前",
    "Improved responsiveness in Code sessions: smoother streaming of long code blocks, quicker side-panel shortcuts, and less delay opening cloud sessions with many screenshots.": "提升了 Code 会话的响应速度：长代码块流式输出更顺滑、侧边栏快捷操作更快、打开含大量截图的云会话延迟更低。",
    "Fixed Clear Cache and Restart signing you out instead of just clearing caches.": "修复了\"清除缓存并重启\"会把你登出、而不只是清缓存的问题。",
    "Fixed mouse back and forward buttons not navigating on macOS for mice managed by driver software like Logitech Options+, and added trackpad swipe navigation.": "修复了在 macOS 上由 Logitech Options+ 等驱动软件管理的鼠标，前进/后退键无法导航的问题，并新增触控板滑动导航。",
    "Fixed organization plugins sometimes failing to open right after app launch, and the plugin directory now offers Install again after an uninstall.": "修复了组织插件有时在应用启动后立即打开失败的问题；插件目录现在在卸载后会再次提供\"安装\"。",
    "Fixed connector, Chrome extension, and plugin toggles in the composer's \"+\" menu not responding when you click directly on the switch.": "修复了输入框\"+\"菜单里的连接器、Chrome 扩展和插件开关，直接点开关时不响应的问题。",
    "Fixed an issue where signing in could leave the app unable to start sessions until it was restarted.": "修复了登录后应用可能无法开始会话、需重启才行的问题。",
    "Fixed shell-exported custom request headers not reaching Claude Code sessions.": "修复了 shell 导出的自定义请求头无法传到 Claude Code 会话的问题。",
    "Fixed Claude losing its coding instructions, file-link formatting, and worktree context after a session resumed from idle.": "修复了会话从空闲恢复后，Claude 丢失编码指令、文件链接格式和 worktree 上下文的问题。",
    "Fixed the preview pane sometimes connecting to an unrelated dev server that was already using the configured port, and it now reopens the dev server you last picked for each project.": "修复了预览面板有时连到一个已占用配置端口的无关开发服务器的问题；现在会为每个项目重新打开你上次选的开发服务器。",
    "Fixed popovers, dialogs, and the rewind picker not appearing — and typed characters jumping to the end of the composer — when a Code session is opened in its own window.": "修复了 Code 会话在独立窗口打开时，弹层、对话框和回退选择器不显示、以及输入字符跳到输入框末尾的问题。",
    "Fixed the slash-command menu opening behind the side chat panel.": "修复了斜杠命令菜单打开在侧边对话面板后面的问题。",
    "Fixed the source-branch picker showing nothing for SSH sessions with worktree enabled.": "修复了启用 worktree 的 SSH 会话中源分支选择器空白的问题。",
    "Added a banner when an update fails to install, instead of failing silently.": "更新安装失败时会显示横幅，而不再静默失败。",
    "Added math rendering for inline and block expressions in Claude Code transcripts.": "Claude Code 记录中的行内和块级数学表达式现在会渲染。",
    "Added Ultracode to the effort slider, which selects the highest effort level and turns on dynamic workflows for the session.": "在思考强度滑杆中加入了 Ultracode，它会选中最高强度并为当前会话开启动态工作流。",
    "Added drag-to-reorder and A→Z sorting for projects in the Claude Code sidebar.": "Claude Code 侧边栏的项目现在支持拖动排序和 A→Z 排序。",
    "Added triple-click to select a whole code block, plus right-click menu actions to copy a code block or inline code, in Claude Code transcripts.": "Claude Code 记录中现在可三击选中整个代码块，右键菜单还能复制代码块或行内代码。",
    "Fixed reinstalling Claude on Windows failing after an uninstall when IT had installed it for all users.": "修复了在 Windows 上由 IT 为所有用户安装的 Claude，卸载后重装失败的问题。",
    "Fixed the app not starting automatically at login on Windows.": "修复了 Windows 上应用不随登录自动启动的问题。",
    "Fixed built-in connectors staying disconnected after a crash — existing sessions now reconnect them automatically, and disconnecting a built-in connector now signs it out and keeps it disconnected across restarts.": "修复了内置连接器在崩溃后保持断连的问题——现有会话现在会自动重连；断开内置连接器现在会将其登出，并在重启后保持断连。",
    "Fixed resuming Code sessions when the working folder had moved or been deleted — sessions saved with a ~ path no longer show as missing or re-prompt for trust, and a deleted remote folder now reports clearly and offers a Fork session button instead of retrying in a loop.": "修复了工作文件夹被移动或删除后恢复 Code 会话的问题——以 ~ 路径保存的会话不再显示为缺失或重复要求信任；被删除的远程文件夹现在会清楚报告，并提供\"派生会话\"按钮，而不是循环重试。",

    // === changelog 1.15200.0 / 1.15962.0 / 1.15962.2 / 1.17377.1 / 1.18286.0 / 1.18286.2 (2026-06 ~ 2026-07) ===
    // 1.15200.0 之前收尾的一批修复
    "Fixed a crash on launch caused by an unusually large saved session.": "修复了因某个保存的会话过大导致启动崩溃的问题。",
    "Fixed the conversation jumping and the Progress panel flashing when opening a completed task.": "修复了打开已完成任务时对话跳动、进度面板闪烁的问题。",
    "Fixed high background CPU usage when several Code sessions were open in the same large repository.": "修复了同一个大仓库中打开多个 Code 会话时后台 CPU 占用过高的问题。",
    "Fixed people without a Claude Code seat being sent to the marketing site from /code; they now see an in-app organization switcher.": "修复了没有 Claude Code 席位的用户从 /code 被跳到营销站的问题；现在会看到应用内的组织切换器。",
    // /code 是独立 <code> 节点, 整段命不中; 拆前后片段
    "Fixed people without a Claude Code seat being sent to the marketing site from": "修复了没有 Claude Code 席位的用户从",
    "; they now see an in-app organization switcher.": "被跳到营销站的问题；现在会看到应用内的组织切换器。",
    "Fixed attachment cards for files that exist only inside a session doing nothing when clicked; they now open in the File pane, lightbox, Preview pane, or Files browser.": "修复了只存在于会话内的文件附件卡点击后无反应的问题；现在会在文件面板、灯箱、预览面板或文件浏览器中打开。",

    // 1.15200.0 (June 23, 2026)
    "Added an inline card for multiple-choice questions from Claude, so you can pick an option and step through each question before your choices are sent as a single reply.": "为 Claude 提出的多选题加入了行内卡片，可以先逐题选择，之后一次性作为单条回复发送。",
    "Fixed the app crashing shortly after opening the Code tab when local session history files are very large.": "修复了本地会话历史文件很大时，打开 Code 标签后应用短时间内崩溃的问题。",
    "Fixed the integrated terminal eventually failing to open new shells after the app had been running for several days on macOS.": "修复了 macOS 上应用连续运行数天后，集成终端最终无法打开新 shell 的问题。",
    "Fixed forked sessions not carrying over pull requests from the original conversation, and pull request rows staying marked as closed after being reopened on GitHub.": "修复了派生会话未继承原对话的 PR，以及 PR 在 GitHub 上重新打开后仍显示为已关闭的问题。",
    "Fixed the @-mention dropdown, side-chat panel, and plan-comment popover rendering, resizing, and dismissing in the wrong window when a session is opened in its own window.": "修复了会话在独立窗口打开时，@ 提及下拉、侧边对话面板和计划评论浮层在错误窗口渲染、调整大小和关闭的问题。",
    "Fixed an extra tab opening in the system browser when navigating with the Artifacts pane open.": "修复了 Artifacts 面板打开时导航会在系统浏览器多开一个标签的问题。",
    "Fixed plugin and skill downloads stalling for several minutes on a dead connection before retrying; stalled downloads now retry sooner.": "修复了连接断开时插件和 skill 下载卡数分钟才重试的问题；卡住的下载现在会更快重试。",
    "Fixed prompt and tool-detail content missing from OpenTelemetry exports for standard deployments that have not set an explicit content-capture policy; third-party deployments are unchanged.": "修复了未显式设置内容采集策略的标准部署中，OpenTelemetry 导出缺失提示词和工具详情内容的问题；第三方部署行为不变。",
    "Fixed folder access and cross-session requests being rejected after you approved them when permission mode was Auto or Bypass permissions.": "修复了权限模式为 Auto 或 Bypass 时，你批准后文件夹访问和跨会话请求反被拒绝的问题。",
    "Fixed failed mid-turn message sends (for example, while offline) dropping your text instead of returning it to the input.": "修复了回合中途发送失败（例如离线时）会丢失你输入的文本，而不是退回输入框的问题。",
    "Fixed new session worktrees branching from the currently checked-out branch instead of the repository's default branch, and archived sessions leaving their worktree folders on disk.": "修复了新会话的 worktree 从当前签出分支而不是仓库默认分支拉分支，以及归档会话会在磁盘上遗留 worktree 目录的问题。",
    "Fixed new session worktrees branching from the currently checked-out branch instead of the repository’s default branch, and archived sessions leaving their worktree folders on disk.": "修复了新会话的 worktree 从当前签出分支而不是仓库默认分支拉分支，以及归档会话会在磁盘上遗留 worktree 目录的问题。",

    // 1.15962.0 (June 25, 2026)
    "Added support for custom cron expressions when scheduling local routines.": "为本地定时任务调度加入了自定义 cron 表达式支持。",
    "Added \"Open in VS Code\", \"Open in Cursor\", and similar actions to the file panel, file tree, plan panel, titlebar, and sidebar in SSH sessions.": "在 SSH 会话的文件面板、文件树、计划面板、标题栏和侧边栏加入了\"在 VS Code 中打开\"\"在 Cursor 中打开\"等类似操作。",
    "Added a \"Load more\" button to the All sessions list for people with many sessions.": "为会话很多的用户在\"全部会话\"列表加入了\"加载更多\"按钮。",
    "Improved keyboard navigation: a message's action buttons are now a single Tab stop, with arrow keys to move between them.": "改进键盘导航：一条消息的操作按钮现在是一个 Tab 停靠点，用方向键在其间切换。",
    "Improved keyboard navigation: a message’s action buttons are now a single Tab stop, with arrow keys to move between them.": "改进键盘导航：一条消息的操作按钮现在是一个 Tab 停靠点，用方向键在其间切换。",
    "Fixed pressing Enter not sending your message when an @mention had no matching results.": "修复了 @ 提及无匹配结果时，按 Enter 无法发送消息的问题。",
    // apt update 是 code 独立节点; 拆片段
    "failing on Linux after uninstalling a Claude that was installed from the apt repository.": "在 Linux 上从 apt 仓库安装并卸载 Claude 后失败的问题。",
    "Fixed the file-open spinner on Linux staying up after the download completed.": "修复了 Linux 上下载完成后打开文件的转圈还一直显示的问题。",
    "Fixed Remote Control sessions spinning forever with no error after you sent a message when the hosting computer was no longer connected.": "修复了宿主电脑已断连时，发送消息后远程控制会话一直转圈却没有报错的问题。",
    "Fixed the sidebar project + button opening an empty prompt (or pointing at github.com) for GitHub Enterprise repositories.": "修复了 GitHub Enterprise 仓库中，侧边栏项目 + 按钮打开空提示（或指向 github.com）的问题。",
    "Fixed background tasks and workflows continuing to show as running after they finished, the session restarted, or the session was stopped.": "修复了后台任务和工作流在完成、会话重启或会话停止后仍显示为运行中的问题。",

    // 1.15962.2 (June 30, 2026) 与 1.18286.2 (July 7, 2026) 共用
    "Updated the embedded Claude Code engine to the latest version.": "将内嵌的 Claude Code 引擎更新到最新版本。",

    // 1.17377.1 (June 30, 2026)
    "Added Linux support: Claude Desktop is now available for Debian and Ubuntu on x64 and arm64, installable as a .deb package.": "加入 Linux 支持：Claude Desktop 现已在 x64 和 arm64 架构的 Debian 与 Ubuntu 上提供，可作为 .deb 包安装。",
    "Added an integrated terminal pane and inline image previews in the transcript for SSH sessions.": "为 SSH 会话加入了集成终端面板和记录中的内联图片预览。",
    "Added step-by-step progress and a Stop button while a session's worktree is being set up, so a long checkout on a large repository can be cancelled.": "在会话的 worktree 建立过程中加入了逐步进度和\"停止\"按钮，可取消超大仓库上的长时间签出。",
    "Added step-by-step progress and a Stop button while a session’s worktree is being set up, so a long checkout on a large repository can be cancelled.": "在会话的 worktree 建立过程中加入了逐步进度和\"停止\"按钮，可取消超大仓库上的长时间签出。",
    "Added a right-click menu in the Terminal pane with Copy, Paste, and Attach selection as context.": "在终端面板加入了右键菜单，含复制、粘贴，以及将选中内容作为上下文附加。",
    "Updated the plugin Directory to show admin-configured marketplaces under the Organization tab and refresh them automatically when the source repository updates.": "更新了插件目录：在\"组织\"标签下显示管理员配置的市场，并在源仓库更新时自动刷新。",
    "Changed zoom in and out to use smaller steps for finer control.": "缩放操作改用更小的步长，控制更细腻。",
    "Updated the transcript to mask API keys and tokens by default; click the eye icon to reveal them.": "记录中的 API 密钥和 token 现在默认打码；点击眼睛图标显示。",

    // 1.18286.0 (July 2, 2026)
    "Added a \"Choose folder\" option to recover a session whose working folder is missing: the conversation forks into the folder you pick and the stuck session is archived.": "为工作文件夹缺失的会话加入了\"选择文件夹\"选项：对话会派生到你选的文件夹，卡住的会话则被归档。",
    "Added drag-to-reorder for queued messages, and Steer now works for messages that include images.": "排队消息现在支持拖动排序，Steer 也可用于含图片的消息。",
    "Added a \"Switch organization\" option on the \"session not found\" page so you can reopen a session link under the right organization.": "在\"未找到会话\"页面加入了\"切换组织\"选项，可在正确的组织下重新打开会话链接。",
    "Improved the Code tab's live preview: it now reports honest connection and loading status (including when a page arrives but never finishes loading, or a server overloads itself with requests), adds browser-style Back, Forward, and Reload/Stop controls, and lets you close other preview tabs.": "改进 Code 标签的实时预览：现在会如实报告连接和加载状态（包括页面到达但从未加载完，或服务器把自己请求爆的情况），加入了浏览器风格的后退/前进/重载/停止控件，并可关闭其他预览标签。",
    "Improved the Code tab’s live preview: it now reports honest connection and loading status (including when a page arrives but never finishes loading, or a server overloads itself with requests), adds browser-style Back, Forward, and Reload/Stop controls, and lets you close other preview tabs.": "改进 Code 标签的实时预览：现在会如实报告连接和加载状态（包括页面到达但从未加载完，或服务器把自己请求爆的情况），加入了浏览器风格的后退/前进/重载/停止控件，并可关闭其他预览标签。",
    "Fixed remote SSH sessions getting stuck in a reconnect loop on very large messages, being lost when the computer woke from sleep mid-reconnect, and occasionally sending the same input twice after reconnecting.": "修复了远程 SSH 会话在超大消息上陷入重连循环、电脑在重连中途从睡眠唤醒时丢失，以及偶尔在重连后重复发送同一条输入的问题。",
    // "10 分钟" 已被翻; 分两条兜整段前/后, 走 dynamic 更稳
    "Fixed setup on Windows getting stuck retrying a download when the download folder was locked or inaccessible.": "修复了下载文件夹被锁定或不可访问时，Windows 上安装卡在下载重试的问题。",
    "Fixed being unable to disable, delete, or uninstall plugins from GitHub-connected marketplaces, or to remove those marketplaces.": "修复了无法禁用、删除或卸载来自 GitHub 连接市场的插件，也无法移除这些市场的问题。",
    "Added automatic updates on Linux through the Anthropic apt repository, so new versions arrive with apt upgrade (and unattended upgrades where enabled).": "在 Linux 上通过 Anthropic 的 apt 仓库加入了自动更新，新版本会随 apt upgrade 一起到来（启用无人值守升级的机器则自动升级）。",
    // apt upgrade 是独立 <code> 节点, 整段命不中; 拆前后片段
    "Added automatic updates on Linux through the Anthropic apt repository, so new versions arrive with": "在 Linux 上通过 Anthropic 的 apt 仓库加入了自动更新，新版本会随",
    "(and unattended upgrades where enabled).": "一起到来（启用无人值守升级的机器则自动升级）。",
    // command palette (Ctrl K) 里 Ctrl/K 是独立 <kbd>, 整段命不中; 只翻括号前的引导片段
    "Added the ability to archive or delete the current chat, project, task, or coding session directly from the command palette (": "现在可直接从命令面板（",
    // sign-in 长句 (10 分钟 里 "10" 是数字, "minutes" 走 partial 翻分钟, 整段 exact 命中原文)
    "Fixed being asked to sign in repeatedly after a session expired while you were using the app; your in-progress message draft now returns when you sign back in within 10 minutes, and signing out still clears it.": "修复了使用应用时会话过期后被反复要求登录的问题；你写到一半的消息草稿现在会在 10 分钟内重新登录时回到输入框，登出仍会清空它。",
    "Added descriptive branch names for local Code sessions, derived from your first message, in place of the random adjective-noun names.": "为本地 Code 会话加入了描述性分支名（由你的第一条消息生成），替代随机的形容词-名词组合。",
    "Changed the default transcript and composer width to a narrower, more readable column; a width you already chose in Settings → Appearance is preserved.": "默认记录与输入框宽度改为更窄、更易读的单列；你已在 设置 → 外观 中选择的宽度会保留。",
    "Fixed repeated crashes on Linux caused by unstable graphics acceleration; the app now turns acceleration off automatically and tells you.": "修复了 Linux 上因图形加速不稳定导致的反复崩溃；应用现在会自动关闭加速并告知你。",
    "Fixed the app becoming unresponsive when a session folder is on a slow or disconnected network drive.": "修复了会话文件夹位于缓慢或已断开的网络驱动器时，应用无响应的问题。",
    "Fixed bank payment-verification (3DS) pages not loading during checkout.": "修复了结账过程中银行支付验证（3DS）页面无法加载的问题。",
    "Fixed MCP connectors in artifacts being silently dropped; approving a connector now reliably grants its tools to the artifact, and a previously stuck approval heals itself the next time you approve.": "修复了 artifact 中的 MCP 连接器被静默丢弃的问题；现在批准一个连接器可稳定把其工具授予该 artifact，之前卡住的批准会在你下次批准时自动修复。",
    "Fixed freezes and stalls: while restoring a large number of sessions at startup, while builds or file syncs churned files inside a watched folder, and while the diff panel refreshed during a response.": "修复了一批卡顿：启动时恢复大量会话、构建或文件同步在受监控文件夹中反复改写文件，以及响应过程中 diff 面板刷新导致的卡顿。",
    "Fixed newly trusted folders sometimes failing to start a session with a \"workspace is not trusted\" error.": "修复了新信任的文件夹有时以\"工作区未受信任\"错误无法开始会话的问题。",
    "Fixed \"Open in Finder\", \"Open in editor\", and \"Attach to chat\" doing nothing, or using the wrong path, for files in the diff panel when the session folder differs from the repo folder.": "修复了会话文件夹与仓库文件夹不同时，diff 面板中\"在 Finder 中打开\"\"在编辑器中打开\"\"附加到对话\"无反应或使用错误路径的问题。",
    "Fixed security-key and phone sign-ins not completing in preview tabs.": "修复了预览标签中安全密钥和手机登录无法完成的问题。",
    "Click a filename on an Edited or Wrote row to open that file in the diff pane": "点击\"编辑了\"或\"写入了\"行上的文件名，即可在 diff 面板中打开该文件",
    "Project rows in the Recents sidebar expand with a click, and a hover-revealed View project button opens the project page": "最近侧边栏的项目行点一下即可展开，悬停显示的\"查看项目\"按钮可打开项目页",
    "When a remote session's working folder has been deleted, Fork session recovers it into a fresh worktree": "远程会话的工作文件夹被删除时，\"派生会话\"会把它恢复到一个全新的 worktree",
    "Add plugin from the + menu opens straight to the installable plugin list": "从 + 菜单的\"添加插件\"会直接打开可安装插件列表",
    "Rename from the sidebar's right-click menu edits the name in place": "侧边栏右键菜单的\"重命名\"现在就地编辑名称",
    "Sessions with an open draft PR no longer show or sort as closed": "有未关闭草稿 PR 的会话不再显示或排序为已关闭",
    "Dropdowns near the top of the window are clickable instead of dragging the window": "窗口顶部附近的下拉菜单现在可点击，而不是拖动窗口",
    "SSH session setup works when the remote home directory is on a network filesystem": "远程主目录在网络文件系统上时，SSH 会话设置也能正常工作",
    "Tables in popout windows use the right font size": "弹出窗口中的表格现在使用正确的字号",
    "Choose effort with a slider next to the model picker": "在模型选择器旁用滑杆选择思考强度",
    "Mark a waiting session as completed from the sidebar's right-click menu — clears the yellow dot without sending a reply": "从侧边栏右键菜单把等待中的会话标记为已完成——清除黄点但不发送回复",
    "When the model is overloaded, pick a different one right from the error card's retry menu": "模型过载时，直接从错误卡片的重试菜单换一个模型",
    "The Files panel stays open when you switch between sessions": "在会话间切换时，文件面板保持打开",
    "Usage-limit notices now say which limit you hit and when it resets": "用量上限提示现在会说明你触及的是哪个上限以及何时重置",
    "Press a number key to pick an option when Claude asks a question": "Claude 提问时，按数字键即可选择选项",
    "Opening a very large repository no longer crashes on startup": "打开超大仓库不再在启动时崩溃",
    "The diff panel and file previews work in SSH sessions": "diff 面板和文件预览现在在 SSH 会话中可用",
    "Sessions in their own window stay responsive when the main window is hidden": "主窗口隐藏时，独立窗口中的会话保持响应",
    "Archiving or deleting a session works while it's starting up or responding": "会话在启动或响应过程中也能归档或删除",
    "Claude Opus 4.8 is now available in the model picker": "模型选择器中现已提供 Claude Opus 4.8",
    "Dynamic workflows let Claude fan out to many subagents on a single task": "动态工作流让 Claude 在单个任务上分发给多个子 agent",
    "Your WorktreeCreate and WorktreeRemove hooks run for local sessions too — jj and Sapling setups can use worktree isolation": "你的 WorktreeCreate 和 WorktreeRemove 钩子现在在本地会话中也会运行——jj 和 Sapling 配置可以使用 worktree 隔离",
    "Search file contents with ? works for folders that aren't git repos": "用 ? 搜索文件内容现在适用于非 git 仓库的文件夹",
    "Agents you define in your project's .claude/agents show up in the @-mention picker — and new ones appear without a restart": "你在项目 .claude/agents 中定义的 agent 会出现在 @ 提及选择器里——新增的无需重启即可出现",
    "The PR bar finds your open PR even when your local branch name doesn't match the remote's": "即使本地分支名与远程不一致，PR 栏也能找到你打开的 PR",
    "Local video attachments play in the lightbox": "本地视频附件现在可在灯箱中播放",
    "Starting a session on a branch works with macOS's built-in git": "在某个分支上开始会话现在可配合 macOS 自带的 git 使用",
    "Split view now tiles into an adaptive grid — fit more sessions on a wide screen": "分屏视图现在会铺成自适应网格——宽屏上可容纳更多会话",
    "/compact now shows a marker in the transcript where context was compacted": "/compact 现在会在记录中标出上下文被压缩的位置",
    "Get a desktop notification when a routine run fails": "定时任务运行失败时收到桌面通知",
    "Remote Control shows as a badge in the title bar — click it to turn on or off": "远程控制现在在标题栏显示为徽标——点击即可开关",
    "Click an image path in a response to preview it, even when it's outside your project folder": "点击回复中的图片路径即可预览，即使它在项目文件夹之外",
    "Files you reference with @ show as chips in the transcript, not just videos": "你用 @ 引用的文件现在在记录中显示为 chip，不只是视频",
    "Queued messages collapse into a stack — click to expand": "排队的消息会折叠成一摞——点击展开",
    "Bash commands in the transcript are syntax-highlighted": "记录中的 Bash 命令现在带语法高亮",
    "Your most recent sessions open faster from the sidebar": "你最近的会话现在从侧边栏打开更快",
    "Trackpad scrolling works over code and diff blocks": "触控板滚动现在在代码和 diff 块上可用",
    "The transcript stays where you scrolled instead of snapping back to the bottom": "记录现在停在你滚动到的位置，而不是弹回底部",
    "Cancelling a queued message no longer interrupts the turn in progress": "取消排队消息不再打断进行中的回合",
    "Sessions with uncommitted changes are no longer auto-archived": "有未提交改动的会话不再被自动归档",
    "Auto mode is now available on the Pro plan — Sonnet 4.6 is now supported, alongside Opus 4.7": "自动模式现已在 Pro 套餐可用——现在支持 Sonnet 4.6，以及 Opus 4.7",
    "Videos you attach appear as chips in the transcript — click to play": "你附加的视频现在在记录中显示为 chip——点击播放",
    "Click a #L5-L20 link in a response to highlight those lines in the file panel": "点击回复中的 #L5-L20 链接，即可在文件面板高亮这些行",
    "file:// paths in responses are now clickable": "回复中的 file:// 路径现在可点击",
    "Remote sessions reconnect on their own after sleep or network changes": "远程会话在睡眠或网络变化后会自行重连",
    "Group sessions by PR state from the filter icon at the top of the sidebar": "从侧边栏顶部的筛选图标按 PR 状态分组会话",
    "Sessions remember your scroll position when you come back to them": "回到会话时会记住你的滚动位置",
    "Get a desktop notification when Claude finishes while you're in another app": "你在其他应用时，Claude 完成后收到桌面通知",
    "Move a local session to the cloud from its ••• menu so it keeps running when you close your laptop": "从本地会话的 ••• 菜单把它移到云端，这样合上笔记本它也继续运行",
    "Dotfiles show up in the file tree and @-mention search": "点文件（dotfiles）现在出现在文件树和 @ 提及搜索中",
    "Create and name your own session groups — drag sessions in, or right-click a session → Move to group": "创建并命名你自己的会话分组——把会话拖进去，或右键会话 → 移到分组",
    "Click any file in the file panel to edit it in place": "点击文件面板中的任意文件即可就地编辑",
    "Turn on Remote Control for all new local sessions in Settings → Claude Code": "在 设置 → Claude Code 中为所有新建本地会话开启远程控制",
    "Resolved review comments collapse in the diff view so you can focus on what's open": "已解决的评审评论在 diff 视图中折叠，让你专注于未解决的",
    "Attach up to 20 images in a single message for local sessions": "本地会话单条消息最多可附加 20 张图片",
    "\"Always allow\" choices now persist after you quit the app": "\"始终允许\"的选择现在在退出应用后保留",
    "Sidebar pins and starred sessions survive sign-out": "侧边栏的置顶和星标会话在登出后保留",
    "Open multiple terminal tabs in the terminal pane": "在终端面板中打开多个终端标签",
    "Right-click any folder in the file tree → Open in terminal": "右键文件树中的任意文件夹 → 在终端中打开",
    "Queue follow-up messages while Claude is still working — they send automatically when it's ready": "Claude 还在工作时排队后续消息——就绪后自动发送",
    "See related and stacked PRs together in the PR bar": "在 PR 栏一起查看关联和堆叠的 PR",
    "Sort sessions from the filter icon in the sidebar": "从侧边栏的筛选图标排序会话",
    "Drag, resize, and keyboard-navigate split panes with sessions side by side": "拖动、调整大小、用键盘导航并排的分屏面板",
    "Draw directly on the preview to show Claude what you mean — click the pencil icon in the preview toolbar": "直接在预览上绘制来向 Claude 表达你的意思——点击预览工具栏的铅笔图标",
    "Markdown files render as formatted previews in the file panel": "Markdown 文件现在在文件面板中渲染为格式化预览",
    "Right-click any file in the diff tree for Open, Copy path, and Attach as context": "右键 diff 树中的任意文件，可选 打开、复制路径、作为上下文附加",
    "Archive or delete several sessions at once from the Recents header menu": "从最近标题菜单一次归档或删除多个会话",
    "Right-click any image in a response to Copy or Save it": "右键回复中的任意图片以复制或保存",
    "Browse your project's files in a side pane — fuzzy-find by name, search contents with ?, Ctrl F to find in file": "在侧边面板浏览项目文件——按名称模糊查找、用 ? 搜索内容、Ctrl F 在文件内查找",
    "Every folder you've worked in appears under Recent — click the + next to one to start a session there": "你处理过的每个文件夹都会出现在\"最近\"下——点击旁边的 + 即可在那里开始会话",
    "Right-click a message or select text → Attach as context to reference it in your next message": "右键消息或选中文本 → 作为上下文附加，以便在下条消息中引用",
    "Math renders inline in responses": "回复中的数学现在行内渲染",
    "Toggle Fast mode from the model picker on supported models for quicker responses": "在支持的模型上从模型选择器切换快速模式以加快响应",
    "Your project's settings.json model is used by default for new sessions": "新会话默认使用你项目 settings.json 中的模型",
    "Scroll the transcript with arrow and page keys": "用方向键和翻页键滚动记录",
    "Claude's suggested follow-up tasks appear as a notification in the top right — click to spin one off or handle it here": "Claude 建议的后续任务以通知形式出现在右上角——点击可拆出或就地处理",
    "See what each background agent was asked and what it returned by expanding its row": "展开每个后台 agent 的行，查看它收到的请求和返回的内容",
    "Set up Routines to run a prompt on a schedule — find them in the sidebar": "设置定时任务以按计划运行提示词——在侧边栏中找到它们",
    "See a one-line recap of Claude's thinking above each tool group in thinking view": "在思考视图中，每个工具组上方显示 Claude 思考的一行摘要",

    // === 头像 / 定时任务额度 / 用量额度对话框 ===
    "Clear avatar": "清空头像",
    "Included routine runs per rolling 24 hours. Additional runs use usage credits when turned on.": "每滚动 24 小时内含的定时任务运行额度。开启后，额外运行将消耗用量额度。",
    "Turn on usage credits": "开启用量额度",
    "Help Center article": "帮助中心文章",
    "AI-powered Artifacts disabled": "AI 驱动的 Artifacts 已禁用",

    // === 导入记忆对话框 ===
    "Import memory to Claude": "导入记忆到 Claude",
    "Copy this prompt into a chat with your other AI provider": "把这段提示词复制到你与其他 AI 提供商的对话中",
    "Paste results below to add to Claude's memory": "把结果粘贴到下方，添加到 Claude 的记忆",
    "Paste results below to add to Claude’s memory": "把结果粘贴到下方，添加到 Claude 的记忆",
    "Paste your memory details here": "在此粘贴你的记忆详情",
    "Add to memory": "添加到记忆",
    // 注: 步骤2下方那段英文提示词模板是"复制去粘贴到别的 AI"的功能性 prompt, 不翻 (翻了会改变复制内容)

    // === token scope pill 悬浮 tooltip ===
    "Upload files on your behalf": "代表你上传文件",
    "Contribute to your Claude subscription usage": "计入你的 Claude 订阅用量",
    "Access your Anthropic profile information": "访问你的 Anthropic 个人资料信息",
    "Access your Claude Code sessions": "访问你的 Claude Code 会话",

    // === 更改位置对话框描述 — React 把两个路径插值成独立节点, 翻静态片段 ===
    "Copy files to": "将文件复制到",
    "and restart the app. Your existing files will remain in": "并重启应用。你现有的文件仍保留在",

    // === Cowork files 位置设置 + 更改位置对话框 ===
    "Cowork files": "Cowork 文件",
    "Use recommended": "使用推荐位置",
    "Change": "更改",
    "Moving out of the Documents folder can avoid file permission issues.": "移出 Documents 文件夹可避免文件权限问题。",
    "Change location for Cowork files?": "更改 Cowork 文件的位置？",
    "Copy and restart": "复制并重启",
    // 全局指令编辑器 placeholder (translateAttributes 覆盖 placeholder/data-placeholder)
    "Add instructions for Claude to follow in all Cowork sessions...": "添加 Claude 在所有 Cowork 会话中应遵循的指令...",
    "Add instructions for Claude to follow in all Cowork sessions…": "添加 Claude 在所有 Cowork 会话中应遵循的指令…",

    // === 任务建议 ("Pick a task, any task" 区) ===
    "Pick a task, any task": "随便挑个任务",
    "Optimize my week": "优化我的一周",
    "Organize my screenshots": "整理我的截图",
    "Find insights in files": "从文件中发现洞察",
    "Customize with plugins": "用插件个性化",

    // === Workflow 权限弹窗 / 任务面板 ===
    "Starting workflow": "正在启动工作流",
    "tasks panel": "任务面板",
    "Deny": "拒绝",
    "Allow once": "允许一次",

    // === 设置/账户: 授权 token 列表 (Authorization tokens/Application/Scopes 已在 993-995) ===
    "Created when you sign in to Claude Code. Revoke a token to sign out from that device.": "登录 Claude Code 时创建。吊销某个 token 即可从对应设备退出登录。",

    // === 设置/隐私: 删除 Anthropic 存储的会话 ===
    "Claude Code (CLI, Desktop, IDE)": "Claude Code（CLI、桌面端、IDE）",
    "Delete sessions stored by Anthropic": "删除 Anthropic 存储的会话",

    // === 分页栏 (React 把 "Showing 1–5 of 11" 拆成多个 textNode, 只能按片段翻) ===
    // "Showing"→显示, "Page"→页; 中间的独立 " of " 片段由 dynamicPatterns 处理
    "Showing": "显示",
    "Page": "页",

    // === 后补条目（覆盖新版 Claude 漏翻的 UI） ===
    "Approaching usage limit": "用量接近上限",
    "Fast mode": "快速模式",
    "Fast": "快速",
    "Enable fast mode": "启用快速模式",
    "Enable fast": "启用快速",
    "Project": "项目",
    "Environment": "环境",
    "Date": "日期",
    "Alphabetically": "按字母顺序",
    "Recency": "按最近",
    "Created Time": "按创建时间",
    "Time": "时间",
    "Create a personal project": "创建个人项目",
    "a personal project": "个人项目",
    "a new project": "新项目",
    "Projects help organize your work and leverage knowledge across multiple conversations. Upload docs, code, and files to create themed collections that Claude can reference again and again.": "项目能帮你跨对话整理工作、复用知识。上传文档、代码、文件做成主题集合，Claude 可以反复引用。",
    "A dedicated place for ongoing work, where context builds over time. Files and instructions stay in a folder on your computer.": "持续工作的专属空间，上下文随时间累积。文件和指令存在你电脑的文件夹里。",
    "Start from scratch": "从头新建",
    "Set up a new folder with instructions and files.": "新建一个带指令和文件的文件夹。",
    "Import a project": "导入项目",
    "Bring a project you made in Chat over to Cowork.": "把你在 Chat 里做的项目带到 Cowork。",
    "Bring a project you made in Chat over to Cowork. Changes in Cowork won't affect your project in Chat.": "把你在 Chat 里做的项目带到 Cowork。在 Cowork 里的改动不会影响 Chat 里的项目。",
    "Bring a project you made in Chat over to Cowork. Changes in Cowork won’t affect your project in Chat.": "把你在 Chat 里做的项目带到 Cowork。在 Cowork 里的改动不会影响 Chat 里的项目。",
    "Use an existing folder": "使用已有文件夹",
    "Give Claude a folder you already work from.": "把你已经在用的文件夹交给 Claude。",
    "Pick a folder and Claude will treat its files as project context. Add instructions to shape how Claude approaches the work.": "选一个文件夹，Claude 会把里面的文件当作项目上下文。加些指令来调整 Claude 怎么处理工作。",
    "Drop files here or click to browse": "把文件拖到这里，或点击浏览",
    "Choose where to save this project on your computer.": "选择此项目在你电脑上的保存位置。",
    "Search projects in Chat...": "在 Chat 里搜索项目...",
    "Search projects in Chat": "在 Chat 里搜索项目",
    "Tell Claude how to work in this project (optional)": "告诉 Claude 怎么处理这个项目 (可选)",
    "Tell Claude how to work in this project": "告诉 Claude 怎么处理这个项目",
    "Choose a folder...": "选择一个文件夹...",
    "Choose a folder": "选择一个文件夹",
    "is on": "已开启",
    "is off": "已关闭",
    "Memory is on": "记忆已开启",
    "Memory is off": "记忆已关闭",
    "Add files": "添加文件",
    "Choose project location": "选择项目位置",
    "Project location": "项目位置",
    "Project from Chat": "来自 Chat 的项目",
    "from Chat": "来自 Chat",
    "Project name": "项目名称",
    "Choose a folder": "选择一个文件夹",
    "Select folder": "选择文件夹",
    "Choose folder": "选择文件夹",
    // === Cowork project 详情页 ===
    "Claude will remember context across conversations in this project. Turn this off in settings.": "Claude 会在这个项目里跨对话记住上下文。在设置里可以关闭。",
    "Claude will remember context across conversations in this project.": "Claude 会在这个项目里跨对话记住上下文。",
    "Turn this off in settings.": "在设置里可以关闭。",
    "Turn this off in settings": "在设置里可以关闭",
    "What would you like to work on in this project?": "想在这个项目里做点啥？",
    "What would you like to work on": "想做点啥",
    "Add tone, formatting, or rules to guide how Claude works.": "添加语气、格式或规则，引导 Claude 怎么干活。",
    "Add tone, formatting, or rules to guide how Claude works": "添加语气、格式或规则，引导 Claude 怎么干活",
    "Set up recurring tasks for this project.": "为这个项目设置定时任务。",
    "Set up recurring tasks for this project": "为这个项目设置定时任务",
    "Set up recurring tasks": "设置定时任务",
    "recurring tasks": "定时任务",
    "On your computer": "在你的电脑上",
    "Give Claude a task and it'll pick up your project context automatically.": "给 Claude 一个任务，它会自动接上项目上下文。",
    "Give Claude a task and it’ll pick up your project context automatically.": "给 Claude 一个任务，它会自动接上项目上下文。",
    "Give Claude a task": "给 Claude 一个任务",
    "Pin project": "置顶项目",
    "Edit instructions": "编辑指令",
    "Ask": "提问",
    "What are you working on?": "你在做什么？",
    "What are you trying to achieve?": "你想达成什么？",
    "Name your project": "命名你的项目",
    "Describe your project, goals, subject, etc...": "描述你的项目、目标、主题等...",
    "Start a task in Cowork": "在 Cowork 里开始任务",
    "Start a chat to keep conversations organized and re-use project knowledge.": "开始聊天，整理对话、复用项目知识。",
    "Project memory will show here after a few chats.": "几轮聊天后，项目记忆会显示在这里。",
    "Add instructions to tailor Claude's responses": "添加指令定制 Claude 的回答",
    "Add instructions to tailor Claude’s responses": "添加指令定制 Claude 的回答",
    "Add PDFs, documents, or other text to reference in this project.": "添加 PDF、文档或其他文本作为本项目参考。",
    "Only you": "仅你自己",
    "Edit details": "编辑详情",
    "details": "详情",
    "Project deleted": "项目已删除",
    "deleted": "已删除",
    "Search projects Ctrl+F": "搜索项目 Ctrl+F",
    "Search projects": "搜索项目",
    "projects": "项目",
    "Upload materials, set custom instructions, and organize conversations in one space.": "上传资料、设置自定义指令、把对话集中在一处。",
    "Theme": "主题",
    "Font": "字体",
    "Plan 25%": "套餐 25%",
    "Plan 50%": "套餐 50%",
    "Plan 75%": "套餐 75%",
    "Plan 80%": "套餐 80%",
    "Plan 90%": "套餐 90%",
    "Plan 100%": "套餐 100%",
    "No plan yet.": "还没有计划。",
    "No plan yet": "还没有计划",
    "No tasks.": "暂无任务。",
    "No tasks": "暂无任务",
    "No changes to show.": "没有要显示的改动。",
    "No changes to show": "没有要显示的改动",
    "Claude writes the plan here as it explores. Keep chatting.": "Claude 探索时会把计划写在这里，接着聊就行。",
    "Filter files... (?text to search contents)": "筛选文件... (?text 搜索内容)",
    "Filter files...": "筛选文件...",
    "Filter files": "筛选文件",
    "Filter tasks Ctrl+F": "筛选任务 Ctrl+F",
    "Filter tasks": "筛选任务",
    // 写作 (Writing) 子菜单 (主选项 + 二级 prompt 候选)
    "Develop storytelling frameworks": "做故事框架",
    "Write video scripts": "写视频脚本",
    "Develop podcast scripts": "做播客脚本",
    "Create presentation scripts": "做演示文稿脚本",
    "Develop instructional content": "做教学内容",
    "Write grant proposals": "写资助申请",
    "Develop content calendars": "做内容日历",
    "Research topics for my writing": "研究写作主题",
    "Craft something that reads differently depending on the reader's mood": "写点会随读者心情而变味的东西",
    "Craft something that reads differently depending on the reader’s mood": "写点会随读者心情而变味的东西",
    "Write event descriptions": "写活动介绍",
    "Edit and proofread my writing": "校对和润色我的写作",
    "Generate writing prompts": "生成写作灵感",
    "Improve sentence flow": "优化句子节奏",
    "Build character backstories": "做人物背景设定",
    "Outline a novel": "写小说大纲",
    "Brainstorm article ideas": "头脑风暴文章选题",
    "Create user documentation": "写用户文档",
    "Write product descriptions": "写产品介绍",
    "Create persuasive arguments": "写有说服力的论证",
    "Improve my writing style": "提升我的写作风格",
    "Create a piece that blends two completely different writing styles": "写一篇融合两种完全不同风格的作品",
    "Develop content briefs": "做内容简报",
    "Create interview questions": "写采访问题",
    "Help me identify my writing weaknesses": "帮我找出写作薄弱点",
    "Draft an outline for my project": "起草项目大纲",
    "Write marketing copy": "写营销文案",
    "Brainstorm creative ideas": "头脑风暴创意点子",
    "Create a content strategy": "制定内容策略",
    "Help me develop a unique voice for an audience": "帮我为受众打造独特的写作声音",
    "Write something in the voice of my favorite historical figure": "用我最喜欢的历史人物的语气写点东西",
    // 学习 (Learning) 子菜单
    "Design presentation visuals": "设计演示文稿视觉",
    "Transform these notes into a structured summary": "把这些笔记整理成结构化摘要",
    "Design study modules": "设计学习模块",
    "Design study challenges": "设计学习挑战",
    "Create a curriculum inspired by my favorite cultural movement": "根据我喜欢的文化运动创建一套课程",
    "Create educational rubrics": "创建教学评分表",
    "Help me understand a complex topic from scratch": "从零开始帮我理解一个复杂主题",
    "Compare study resources": "对比学习资源",
    "Develop critical analyses": "做批判性分析",
    "Design study journals": "设计学习日志",
    "Design research questions": "设计研究问题",
    "Create annotated bibliographies": "创建带注释的参考文献",
    "Design educational activities": "设计教学活动",
    "Explain a concept in simple terms": "用简单的话解释一个概念",
    "Develop study objectives": "做学习目标",
    "Develop research methodologies": "制定研究方法论",
    "Create assessment questions": "创建测评题目",
    "Create study summaries": "创建学习摘要",
    // Code 子菜单
    "Write unit test cases": "写单元测试用例",
    "Help me develop a personal learning roadmap for coding": "帮我做一份编程学习路线图",
    "Create security protocols": "创建安全协议",
    "Create debugging workflows": "创建调试工作流",
    "Vibe code with me": "陪我 vibe coding",
    "Create dependency maps": "创建依赖关系图",
    "Invent a coding language based on my favorite hobby": "根据我的爱好发明一门编程语言",
    "Develop deployment strategies": "做部署策略",
    "Develop coding standards": "做编码规范",
    "Design a software architecture": "设计软件架构",
    "Create technical diagrams": "画技术图表",
    "Design scalability plans": "设计可扩展性方案",
    "Develop performance benchmarks": "做性能基准测试",
    "Design error handling": "设计错误处理",
    "Design feature flags": "设计功能开关",
    "Design database schemas": "设计数据库模式",
    "Create API documentation": "写 API 文档",
    "Create code snippets": "写代码片段",
    "Create a coding Easter egg that would make my team smile": "写一个能让团队会心一笑的代码彩蛋",
    "Design a digital pet that grows based on my coding habits": "设计一只随我编程习惯成长的电子宠物",
    "Debug my code and give me tips": "调试我的代码并给我建议",
    "Evaluate my coding style based on a snippet": "根据一段代码评估我的编程风格",
    "Design a game that teaches coding concepts through storytelling": "设计一款用故事讲编程概念的游戏",
    // 生活 (Life) 子菜单
    "Plan healthy meals": "计划健康餐食",
    "Create family traditions": "创建家庭传统",
    "Improve my habits": "改善我的习惯",
    "Organize my living space": "整理我的生活空间",
    "Help with decision making": "帮我做决定",
    "Plan home improvements": "规划家居改造",
    "Help me reflect on an experience": "帮我反思一段经历",
    "Develop exercise workflows": "做锻炼流程",
    "Create a personal development plan": "制定个人成长计划",
    "Help me work through a decision": "帮我理清一个决策",
    "Develop mindfulness practices": "做正念练习",
    "Generate gift or travel ideas": "生成礼物或旅行建议",
    "Plan my day or week": "规划一天或一周",
    "Plan educational pursuits": "规划学习计划",
    "Create family activities": "创建家庭活动",
    "Improve time management": "改善时间管理",
    "Manage household tasks": "管理家务",
    "Guide me through a decision-making framework for a life choice": "用决策框架带我做一个人生选择",
    "Improve financial literacy": "提升理财素养",
    "Plan special celebrations": "规划特别的庆祝活动",
    "Create a personal budget": "做一份个人预算",
    "Develop exercise routines": "做锻炼习惯",
    "Balance social commitments": "平衡社交安排",
    // Claude 推荐 (Claude Recommends) 子菜单
    "Discuss space exploration questions": "聊聊太空探索的问题",
    "Solve an interesting problem": "解一道有趣的问题",
    "Discuss creative thinking techniques": "聊聊创意思维方法",
    "Debate an ethical dilemma": "辩一个伦理困境",
    "Discuss social dynamics": "聊聊人际互动",
    "Play a word game together": "一起玩文字游戏",
    "Discuss art interpretation": "聊聊艺术解读",
    "Explore logical fallacies": "探讨逻辑谬误",
    "Explore mathematical paradoxes": "探讨数学悖论",
    "Explore psychological phenomena": "探讨心理学现象",
    "Analyze historical turning points": "分析历史转折点",
    "Discuss symbolic communication": "聊聊符号化沟通",
    "Analyze literary themes": "分析文学主题",
    "Consider alternate histories": "设想另类历史",
    "Discover a new perspective": "发现新视角",
    "Consider economic theories": "聊聊经济学理论",
    "Examine nature phenomena": "观察自然现象",
    "Explore ancient wisdom": "探索古代智慧",
    "Discuss food science": "聊聊食品科学",
    "Explore thought experiments": "探讨思想实验",
    "?text to search contents": "?text 搜索内容",
    "You've used 25% of your weekly limit": "本周已用 25%",
    "You've used 50% of your weekly limit": "本周已用 50%",
    "You've used 75% of your weekly limit": "本周已用 75%",
    "You've used 80% of your weekly limit": "本周已用 80%",
    "You've used 90% of your weekly limit": "本周已用 90%",
    "You've used 100% of your weekly limit": "本周已用 100%",
    "You've used": "已用",
    "You've used ": "已用 ",
    "of your weekly limit": "(本周)",
    " of your weekly limit": " (本周)",
    "of your daily limit": "(今日)",
    " of your daily limit": " (今日)",
    "of your monthly limit": "(本月)",
    " of your monthly limit": " (本月)",
    "You've": "你已",
    "you've": "你已",
    "You've used 25% of your daily limit": "今日已用 25%",
    "You've used 50% of your daily limit": "今日已用 50%",
    "You've used 75% of your daily limit": "今日已用 75%",
    "You've used 90% of your daily limit": "今日已用 90%",
    "You've used 25% of your monthly limit": "本月已用 25%",
    "You've used 50% of your monthly limit": "本月已用 50%",
    "You've used 75% of your monthly limit": "本月已用 75%",
    "You've used 90% of your monthly limit": "本月已用 90%",
    "Get more usage": "获取更多用量",
    "Maximum of 5 images allowed.": "最多允许 5 张图片。",
    "Maximum of 5 images allowed": "最多允许 5 张图片",
    "weekly limit": "周限额",
    "daily limit": "日限额",
    "monthly limit": "月限额",
    "Appears in the / menu. Claude can also run it automatically when relevant.": "出现在 / 菜单里，Claude 也会在相关情境下自动运行。",
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop. Once enabled, browser tools are always available to Claude. Only grant full permissions for trusted sites.": "Chrome 中的 Claude 让 Claude 通过 Claude Desktop 在浏览器里干活。启用后浏览器工具会一直可用，仅对受信任的站点授予完整权限。",
    "See more": "查看更多",
    "Do more with Claude, everywhere you work": "在你工作的每个地方，用 Claude 做得更多",
    "Analyze data, build presentations, and draft documents with Claude alongside you.": "分析数据、制作演示、起草文档，Claude 全程陪你。",
    "Build, debug, and ship from your terminal or IDE.": "在终端或 IDE 里构建、调试、发布。",
    "Chat, cowork, and code in one app. Claude works with your files, apps, and browser tabs.": "聊天、协作、写代码，一个应用搞定。Claude 能用你的文件、应用和浏览器标签。",
    "Chat hands-free, connect Claude to your favorite apps, and kick off tasks on the go.": "免提聊天，把 Claude 连到你常用的应用，随时随地启动任务。",
    "Claude navigates, clicks buttons, and fills forms in your browser. Works in Cowork.": "Claude 在浏览器里导航、点按钮、填表单。Cowork 里也能用。",
    "Which names are the top movers in my portfolio and why?": "我组合里哪些股票涨跌最大？为什么？",
    "My downloads folder is a mess! Can you clean it up?": "我的下载文件夹乱成一团！能帮我清理一下吗？",
    "Turn these receipts into an expense report": "把这些票据整理成报销单",
    "Let's look at your latest runs and make a plan to trim some time.": "来看看你最近的跑步，做个计划提点速。",
    "Create a shopping list, go on Chrome, and make an order": "做个购物清单，打开 Chrome 下单",
    "Fix the auth bug in signup flow": "修复注册流程里的鉴权 bug",
    "Searching...": "搜索中...",
    "Contemplating...": "思考中...",
    "Contemplating": "思考中",
    "Mobile": "移动端",
    "Returns": "退货",
    "Start a return": "开始退货",
    "Start return": "开始退货",
    "Confirmation": "确认",
    "Select reason": "选择原因",
    "reason": "原因",
    "Delivered": "已送达",
    "health data": "健康数据",
    "Create new skills": "创建新技能",
    "new skills": "新技能",
    "New skill": "新建技能",
    "New skills": "新建技能",
    "Browse plugins": "浏览插件",
    "Browse plugin": "浏览插件",
    "Customize Claude": "个性化 Claude",
    "Routine": "定时任务",
    "routine": "定时任务",
    "routines": "定时任务",
    "New routine": "新建定时任务",
    "New Routine": "新建定时任务",
    "No routines yet.": "还没有定时任务。",
    "No routines yet": "还没有定时任务",
    "Create templated routines that can be kicked off on schedule, by API, or webhook.": "创建模板化的定时任务，可按时间表、API 或 webhook 触发。",
    "Remote": "远程",
    "Remote Control": "远程控制",
    "Set up remote control": "设置远程控制",
    // "Run claude rc on your machine to code from here." 被 claude rc code chip 切开，补 trailing 片段（Run→运行 已生效）
    "on your machine to code from here.": "，以从这里编写代码。",
    "Add SSH host...": "添加 SSH 主机...",
    "Add SSH host": "添加 SSH 主机",
    "host": "主机",
    "12 AM": "凌晨 12 点",
    "1 AM": "凌晨 1 点",
    "2 AM": "凌晨 2 点",
    "3 AM": "凌晨 3 点",
    "4 AM": "凌晨 4 点",
    "5 AM": "凌晨 5 点",
    "6 AM": "上午 6 点",
    "7 AM": "上午 7 点",
    "8 AM": "上午 8 点",
    "9 AM": "上午 9 点",
    "10 AM": "上午 10 点",
    "11 AM": "上午 11 点",
    "12 PM": "中午 12 点",
    "1 PM": "下午 1 点",
    "2 PM": "下午 2 点",
    "3 PM": "下午 3 点",
    "4 PM": "下午 4 点",
    "5 PM": "下午 5 点",
    "6 PM": "傍晚 6 点",
    "7 PM": "晚上 7 点",
    "8 PM": "晚上 8 点",
    "9 PM": "晚上 9 点",
    "10 PM": "晚上 10 点",
    "11 PM": "晚上 11 点",
    "Plan": "计划",
    "Previous-generation model. May be removed in a future update.": "上一代模型。未来更新中可能会被移除。",
    "Previous-generation model": "上一代模型",
    "May be removed in a future update.": "未来更新中可能会被移除。",
    "Not connected": "未连接",
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop. Once enabled, browser tools are always available to Claude. Only grant full permissions for trusted sites. See more safety tips.": "Chrome 中的 Claude 让 Claude 通过 Claude Desktop 在浏览器里干活。启用后浏览器工具会一直可用，仅对受信任的站点授予完整权限。查看更多安全提示。",
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop.": "Chrome 中的 Claude 让 Claude 通过 Claude Desktop 在浏览器里干活。",
    "Once enabled, browser tools are always available to Claude.": "启用后浏览器工具会一直可用。",
    "Only grant full permissions for trusted sites.": "仅对受信任的站点授予完整权限。",
    "See more safety tips": "查看更多安全提示",
    "safety tips": "安全提示",
    "Don't have the chrome extension yet?": "还没有 Chrome 扩展？",
    "Tool permissions": "工具权限",
    "Site-level permissions are inherited from the Chrome extension.": "站点级权限继承自 Chrome 扩展。",
    "Site-level permissions": "站点级权限",
    "in the Chrome extension settings to control which sites Claude can browse, click, and type on.": "在 Chrome 扩展设置里控制 Claude 能浏览、点击和输入的站点。",
    "Manage permissions": "管理权限",
    "permissions": "权限",
    "Added by": "添加者",
    "Trigger": "触发",
    "Try in chat": "在聊天里试用",
    "Replace": "替换",
    "auto": "自动",
    "You": "你",
    "Created time": "按创建时间",
    "Created Date": "创建日期",
    "Created date": "创建日期",
    "Legacy": "旧版",

    // 主菜单
    "Settings": "设置",
    "Language": "语言",
    "Get help": "获取帮助",
    "Upgrade plan": "升级套餐",
    "Learn more": "了解更多",
    "Log out": "退出登录",
    "Sign in": "登录",
    "Sign up": "注册",

    // 设置 - 标签页
    "General": "通用",
    "Account": "账户",
    "Appearance": "外观",
    "Privacy": "隐私",
    "Capabilities": "功能",
    "Beta features": "Beta 功能",
    "Billing": "账单",
    "Usage": "用量",
    "Connectors": "连接器",
    // 连接器弹窗
    "Bring your tools and data into Claude": "把你的工具和数据接入 Claude",
    "Read repos, open pull requests": "读取仓库、创建拉取请求",
    "Configured Claude.ai connectors will also be available here": "已配置的 Claude.ai 连接器也会出现在这里",
    "Browse directory": "浏览目录",
    // === 角色/兴趣 onboarding (tips 引导) ===
    // 标题首词被 What→什么 / You→你 词条翻；整串 exact 先试，加粗拆节点时 You 那条有片段兜底
    "What do you do?": "你是做什么的？",
    "Pick all that apply — we'll tailor tips to your workflow.": "勾选所有适用项 —— 我们会根据你的工作流定制提示。",
    "Pick all that apply — we’ll tailor tips to your workflow.": "勾选所有适用项 —— 我们会根据你的工作流定制提示。",
    "Product": "产品",
    "Skip": "跳过",
    "What will you make?": "你想做点什么？",
    "Choose a few — or skip to see everything.": "选几个 —— 或跳过查看全部。",
    "Product mockups": "产品原型图",
    "Interactive prototypes": "交互式原型",
    "Data dashboards": "数据仪表盘",
    "Dev handoff": "开发交接",
    "Just exploring": "只是逛逛",
    "You're all set": "你都准备好了",
    "You’re all set": "你都准备好了",
    "'re all set": "都准备好了",
    "’re all set": "都准备好了",
    "Tap or arrow through.": "点击或用方向键浏览。",
    // ↓ 数字是独立节点, 整串 pattern 命不中 → 拆片段 ("Here are"|"6"|"quick tips picked for you.")
    "Here are": "这是",
    "quick tips picked for you.": "条为你挑选的快速提示。",
    "Keep this tab open and come back in": "让标签页开着，稍后回来——大约",
    "minutes": "分钟",
    "Start": "开始",
    // tips 轮播
    "Bring your context": "带上你的上下文",
    "Drop images or paste screenshots with ⌘V. Mount a local folder from the Import menu so Claude reads your codebase live.": "拖入图片或用 ⌘V 粘贴截图。从导入菜单挂载本地文件夹，让 Claude 实时读取你的代码库。",
    "Point at what to change": "指出要改的地方",
    "Click Comment in the toolbar, then click any element to annotate it. Leave several — they batch into one message when you send.": "点击工具栏中的「评论」，再点击任意元素进行标注。可以留多条 —— 发送时会合并成一条消息。",
    "Sketch an idea": "勾勒想法",
    "The napkin tool lets you draw a rough layout freehand. Claude reads your sketch and turns it into a real design.": "餐巾纸工具让你随手画出粗略布局。Claude 会读取你的草图并把它变成真正的设计。",
    "Start with slides": "从幻灯片开始",
    "Pick Slide deck when you create a project and describe your deck. Claude builds the full presentation — layout, content, speaker notes — in one pass.": "创建项目时选择「幻灯片组」并描述你的演示文稿。Claude 会一次性生成完整演示 —— 布局、内容、演讲者备注。",
    "Mock it up": "做个原型",
    "Design mode starts with quick wireframe explorations before committing to high fidelity. Say what the screen does; Claude sketches options.": "设计模式会先快速探索线框图，再进入高保真。说明这个界面做什么，Claude 就会勾勒出多个方案。",
    "Make it interactive": "让它可交互",
    "Prototype mode builds a real working app — state, transitions, API calls. Your prototype can even call the Claude API directly without a backend.": "原型模式会构建一个真正能运行的应用 —— 状态、转场、API 调用。你的原型甚至可以不用后端直接调用 Claude API。",
    // 用户菜单
    "Signed in as": "登录身份",
    "Organization": "组织",
    "Docs": "文档",
    "Tutorial": "教程",
    "Give feedback": "提供反馈",
    "Claude Code": "Claude Code",

    // 设置 - 个人资料
    "Profile": "个人资料",
    "Avatar": "头像",
    "Preferences": "偏好",
    "Instructions for Claude": "给 Claude 的指令",
    "Claude will keep these in mind across chats and Cowork within": "Claude 会在所有对话和 Cowork 中记住这些，遵循",
    "Get notified when Claude has finished a response. Useful for long-running tasks.": "Claude 完成回复时收到通知。对长任务有用。",
    "Code notifications": "Code 通知",
    "Claude can choose to notify you about important updates from a Code session.": "Claude 可以在 Code 会话有重要更新时通知你。",
    "Full name": "全名",
    "What should Claude call you?": "Claude 该怎么称呼你？",
    "What best describes your work?": "你的工作是？",
    "Select your work function": "选择你的工作领域",
    "What personal preferences should Claude consider in responses?": "Claude 回复时应该考虑你哪些个人偏好？",
    "Your preferences will apply to all conversations, within Anthropic's guidelines.": "你的偏好会应用到所有对话，在 Anthropic 的准则范围内。",
    "personal preferences": "个人偏好",
    "Anthropic's guidelines": "Anthropic 的准则",

    // 设置 - 通知
    "Notifications": "通知",
    "Response completions": "回复完成提醒",
    "Get notified when Claude has finished a response. Most useful for long-running tasks like tool calls, Research, and Claude Code on the web.": "Claude 完成回复时收到通知。对长任务（工具调用、Research、网页版 Claude Code）最有用。",
    "Emails from Claude Code on the web": "网页版 Claude Code 邮件",
    "Get an email when Claude Code on the web has finished building or needs your response.": "网页版 Claude Code 完成构建或需要你回复时发邮件。",

    // 设置 - 外观
    "Color mode": "颜色模式",
    "Light": "浅色",
    "Dark": "深色",
    "System": "系统",  // 通用译法，"跟随系统"留给整段精确匹配

    // 聊天
    "New chat": "新建对话",
    "Search chats": "搜索对话",
    "Search chats...": "搜索对话...",
    "Search chats…": "搜索对话…",
    "Select chats": "选择对话",
    "Search": "搜索",
    "Today": "今天",
    "Yesterday": "昨天",
    "Previous 7 days": "过去 7 天",
    "Previous 30 days": "过去 30 天",
    "Older": "更早",

    // 对话操作
    "Rename": "重命名",
    "Share": "分享",
    "Archive": "归档",
    "Unarchive": "取消归档",
    "Pin": "置顶",
    "Unpin": "取消置顶",
    "Duplicate": "复制",
    "Move to project": "移到项目",
    "Remove from project": "从项目移除",
    "Download": "下载",

    // 输入
    "Type a message...": "输入消息……",
    "Type a message…": "输入消息……",
    "Write a message...": "写消息……",
    "Write a message…": "写消息……",
    "Type / for commands": "输入 / 调用命令",
    "Describe a task or ask a question": "描述任务或提问",
    "Describe a task": "描述任务",
    "ask a question": "提问",
    "Ask Claude...": "问 Claude……",
    "Send message": "发送",
    "Stop generating": "停止生成",
    "Attach files": "添加文件",
    "Upload image": "上传图片",
    "Add context": "添加上下文",

    // 按钮
    "Copy": "复制",
    "Copied": "已复制",
    "Copy code": "复制代码",
    "Edit": "编辑",
    "Delete": "删除",
    "Regenerate": "重新生成",
    "Retry": "重试",
    "Try again": "再试一次",
    "Confirm": "确认",
    "Apply": "应用",
    "Reset": "重置",
    "Refresh": "刷新",

    // 项目
    "Projects": "项目",
    "Create project": "新建项目",
    "Project settings": "项目设置",
    "Add to project": "加入项目",
    "Project name": "项目名称",
    "Project description": "项目描述",
    "View project": "查看项目",
    "Edit project": "编辑项目",
    "Delete project": "删除项目",
    "Delete project?": "删除项目？",
    "Failed to delete project": "删除项目失败",
    "Actions for Untitled": "未命名 的操作",
    "Delete \"Untitled\"? This cannot be undone.": "确认删除「未命名」？此操作无法撤销。",
    "Delete “Untitled”? This cannot be undone.": "确认删除「未命名」？此操作无法撤销。",

    // 文件
    "File": "文件",
    "Files": "文件",
    "Folder": "文件夹",
    "Upload": "上传",
    "Uploading...": "上传中……",
    "Downloading...": "下载中……",
    "Remove": "移除",
    "Preview": "预览",

    // 状态
    "Thinking...": "思考中……",
    "Typing...": "输入中……",
    "Loading...": "加载中……",
    "Processing...": "处理中……",
    "Generating...": "生成中……",
    "Something went wrong": "出错了",
    "Network error": "网络错误",
    "Error": "错误",
    "Success": "成功",
    "Failed": "失败",
    "Completed": "已完成",

    // 时间
    "Just now": "刚刚",
    "minute ago": "分钟前",
    "minutes ago": "分钟前",
    "hour ago": "小时前",
    "hours ago": "小时前",
    "day ago": "天前",
    "days ago": "天前",
    "week ago": "周前",
    "weeks ago": "周前",
    "month ago": "个月前",
    "months ago": "个月前",
    "year ago": "年前",
    "years ago": "年前",

    // 套餐
    "Free plan": "免费套餐",
    "Pro": "Pro",
    "Team": "团队版",
    "Enterprise": "企业版",
    "Upgrade": "升级",
    "Current plan": "当前套餐",
    "Monthly": "月付",
    "Annually": "年付",
    "Subscribe": "订阅",
    "Subscription": "订阅",
    "Manage subscription": "管理订阅",
    "Payment method": "付款方式",
    "Billing history": "账单历史",

    // 用量
    "Messages": "消息",
    "Tokens": "Token",
    "Remaining": "剩余",
    "Used": "已使用",
    "Unlimited": "无限",
    "Reset in": "重置时间",

    // Claude Code / 终端
    "Run code": "运行代码",
    "Terminal": "终端",
    "Console": "控制台",
    "Output": "输出",
    "Input": "输入",
    "Clear": "清空",
    "Stop": "停止",
    "Run": "运行",

    // 通用
    "Cancel": "取消",
    "Save": "保存",
    "Close": "关闭",
    "Continue": "继续",
    "Back": "返回",
    "Next": "下一步",
    "Done": "完成",
    "Yes": "是",
    "No": "否",
    "OK": "确定",
    "Submit": "提交",
    "Send": "发送",
    "Create": "创建",
    "Update": "更新",
    "View": "查看",
    "Open": "打开",
    "Select": "选择",
    "Choose": "选择",
    "Browse": "浏览",
    "Show": "显示",
    "Hide": "隐藏",
    "Expand": "展开",
    "Collapse": "折叠",
    "More": "更多",
    "Less": "收起",
    "All": "全部",
    "None": "无",
    "Default": "默认",
    "Custom": "自定义",

    // claude.ai 侧边栏常见
    "New session": "新建会话",
    "Customize": "个性化",
    "Customize sidebar": "自定义侧边栏",
    "Choose which items appear in your sidebar.": "选择侧边栏显示哪些项目。",
    "sidebar": "侧边栏",
    "Routines": "定时任务",
    "Pinned": "置顶",
    "Drag to pin": "拖动以置顶",
    "Code": "Code",
    "Reinstall": "重装",

    // Cowork / 提示
    "Cowork requires a newer installation": "Cowork 需要新版本",
    "Reinstall the desktop app to access Cowork and start handing off longer tasks.": "重装桌面应用以使用 Cowork 接手更长的任务。",

    // 顶部 / 通用导航
    "Skip to content": "跳到正文",
    "Click to collapse": "点击折叠",
    "Drag to resize": "拖动以调整大小",
    "Chat": "对话",
    "Cowork": "Cowork",
    "Recents": "最近",
    "Personal skills": "个人技能",
    "New task": "新建任务",
    "Scheduled": "定时",
    "Live artifacts": "实时 Artifacts",
    "Create dynamic artifacts that stay up-to-date using live data from your connectors.": "用连接器的实时数据创建会自动更新的 artifacts。",
    "Chat with Claude": "和 Claude 对话",
    "Create your first artifact": "创建你的第一个 artifact",
    "What needs my attention": "我需要关注什么",
    "What needs my attention?": "我需要关注什么？",
    "Update these anytime in": "随时在以下位置更新",
    "Update these anytime in settings.": "随时在设置中更新这些。",
    "Prevents sleep while Dispatch is running.": "Dispatch 运行期间阻止睡眠。",
    "Install Claude in Chrome": "安装 Chrome 中的 Claude",
    "Lets Dispatch navigate, click, and fill forms in your browser.": "让 Dispatch 在你的浏览器里导航、点击和填表。",
    "Dispatch can use every connector you've authenticated.": "Dispatch 可以使用你已授权的每个连接器。",
    "Dispatch can use every connector you’ve authenticated.": "Dispatch 可以使用你已授权的每个连接器。",
    "Side chat": "侧边对话",
    "Chat about this session without touching the main thread. Claude sees the full context, and nothing here is added to the conversation.": "在不影响主线程的情况下，针对这个会话进行讨论。Claude 能看到完整上下文，但这里的内容不会加入主对话。",
    "Local": "本地",
    "Accept edits": "接受修改",
    "Artifacts": "Artifacts",
    "How can I help you today?": "今天我能帮你做什么？",
    "Adaptive": "自适应",
    "Adaptive thinking": "自适应思考",
    "Let's knock something off your list": "把清单上的事情干掉一件吧",
    "Let’s knock something off your list": "把清单上的事情干掉一件吧",
    "Coffee and Claude time?": "来杯咖啡跟 Claude 聊聊？",
    "Clear active": "清空活跃",
    "Brand voice": "品牌语调",
    "Generate brand voice guidelines": "生成品牌语调指南",
    "Apply brand guidelines": "应用品牌指南",
    "Discover brand materials": "发现品牌素材",
    "Review design feedback": "审查设计反馈",
    "Audit and extend system": "审计并扩展系统",
    "Write UX copy": "写 UX 文案",
    "Review code changes": "审查代码改动",
    "Review pre-deployment checklist": "审查部署前清单",
    "Generate standup update": "生成站会更新",
    "Open PDF in viewer": "在查看器中打开 PDF",
    "Learn how to use Cowork safely.": "了解如何安全使用 Cowork。",
    "Learn how to use Cowork safely": "了解如何安全使用 Cowork",
    // 上面整句可能被拆成多个 textNode（"Learn" 是链接），分别加：
    "how to use Cowork safely.": "如何安全使用 Cowork。",
    "how to use Cowork safely": "如何安全使用 Cowork",
    "High risk:": "高风险：",
    "Claude can use connectors, browse the web, and control apps without asking. This could put your data at risk.": "Claude 可以使用连接器、浏览网页、控制应用，不再询问。这可能让你的数据面临风险。",
    "See safe use tips": "查看安全使用提示",
    "Work in a project": "在项目中工作",
    "Work in a project or folder": "在项目或文件夹中工作",
    // 会话中断横幅
    "We got interrupted — Claude works right here in your browser, so when this tab closed, the work paused.": "我们被中断了 —— Claude 就在你的浏览器里运行，所以这个标签页关闭时，工作就暂停了。",
    "Resume": "继续",
    // 首页趣味问候
    "Moonlit chat?": "月下闲聊？",
    "More actions": "更多操作",
    "Reload": "重新加载",
    "Other…": "其他…",
    "Other...": "其他...",
    "Reading, Editing, Generating HTML": "读取、编辑、生成 HTML",
    // === Claude Design - 用 Claude Code 上传组件 / 生成设计系统 ===
    "Couldn't duplicate file — [not_found] source not found": "无法复制文件 ——[not_found] 源文件未找到",
    "Use Claude Code to upload your components": "用 Claude Code 上传你的组件",
    "Your system already lives in code, so there's nothing to set up here. Open your design-system package in Claude Code and run": "你的系统已经在代码里了，这里无需额外设置。在 Claude Code 中打开你的设计系统包并运行",
    "Your system already lives in code, so there’s nothing to set up here. Open your design-system package in Claude Code and run": "你的系统已经在代码里了，这里无需额外设置。在 Claude Code 中打开你的设计系统包并运行",
    "— it reads your tokens and React components directly.": "—— 它会直接读取你的 token 和 React 组件。",
    "Claude can create new design systems or update an existing system.": "Claude 可以创建新的设计系统或更新现有系统。",
    "When it finishes, your system appears under Design systems for everyone in your org.": "完成后，你的系统会出现在「设计系统」下，供组织内所有人使用。",
    "Don't have Claude Code?": "还没有 Claude Code？",
    "Don’t have Claude Code?": "还没有 Claude Code？",
    "Install it": "安装它",
    "You can step away. Keep the tab open in the background.": "你可以先去忙别的。让标签页在后台开着。",
    "Generate": "生成",
    "Generating your design system…": "正在生成你的设计系统…",
    "Generating your design system...": "正在生成你的设计系统...",
    "Generating your design system": "正在生成你的设计系统",
    // ↑ 实为 "Generating"(→创建中) + "your design system…" 拆节点 (design 排除 partial), 补后段片段
    "your design system…": "你的设计系统…",
    "your design system...": "你的设计系统...",
    "your design system": "你的设计系统",
    "Turn on usage credits to keep using Claude if you hit a limit": "开启用量额度，达到上限后仍可继续使用 Claude",
    "Manage usage credits": "管理用量额度",
    // 设置 - Enter 键 / 状态行 / callout
    "Enter key": "Enter 键",
    "Sends message": "发送消息",
    "Starts a new line": "另起一行",
    "for a new line.": "即可换行。",
    "to send.": "即可发送。",
    "Set project title, Listing files": "设置项目标题、列出文件",
    "Listing files": "正在列出文件",
    "USEFUL INFO": "实用信息",
    "Useful INFO": "实用信息",
    "Useful info": "实用信息",
    "Useful Info": "实用信息",
    "useful info": "实用信息",
    "Data file": "数据文件",
    // 文件树 section header (实际 Title-case + CSS 大写)
    "Folders": "文件夹",
    "Stylesheets": "样式表",
    "Stylesheet": "样式表",
    "Scripts": "脚本",
    "Documents": "文档",
    "Feedback": "反馈",
    "Loading design system": "正在加载设计系统",
    "design system": "设计系统",
    "Add usage notes": "添加使用说明",
    // === 工作区启动失败 / 定时任务页 / 创建定时任务表单 ===
    "share your debug logs": "分享你的调试日志",
    "to help us improve.": "以帮助我们改进。",
    "Dismiss question": "忽略问题",
    "What do you want automated?": "你想自动化什么？",
    "Summarize my open PRs every weekday morning": "每个工作日早上汇总我打开的 PR",
    "Triage new issues and flag duplicates each morning": "每天早上分类新 issue 并标记重复项",
    "Draft release notes whenever a PR merges": "每当 PR 合并时起草发布说明",
    "Draft routine": "起草定时任务",
    "Notify me when this routine finishes": "这个定时任务完成时通知我",
    "Scheduled tasks use a randomized delay of several minutes for server performance.": "为提升服务器性能，定时任务会使用几分钟的随机延迟。",
    "Claude works, uses connectors, browses the web, and controls apps on your computer without pausing for approval. You can turn off individual connectors in the Add menu.": "Claude 会直接工作、使用连接器、浏览网页并控制你电脑上的应用，不再暂停等待批准。你可以在「添加」菜单中关闭单个连接器。",
    "Local routines only run while your computer is awake.": "本地定时任务仅在电脑唤醒时运行。",
    "Review yesterday's commits and flag anything concerning": "审查昨天的提交并标记任何值得注意的地方",
    "Review yesterday’s commits and flag anything concerning": "审查昨天的提交并标记任何值得注意的地方",
    "Look at the commits from the last 24 hours. Summarize what changed, call out any risky patterns or missing tests, and note anything worth following up on.": "查看过去 24 小时的提交。总结改动，指出任何有风险的模式或缺失的测试，并记下任何值得跟进的内容。",
    "Schedule": "时间表",
    "Run on a recurring cron schedule or once at a future time": "按周期性 cron 计划运行，或在未来某个时间运行一次",
    "New local routine": "新建本地定时任务",
    "No more connectors available": "没有更多可用的连接器",
    "Ultracode is xhigh effort plus workflows. Most thorough, slowest, and heaviest on your limits. Resets when you close the tab or restart the app.": "Ultracode 是超高思考强度加上工作流。最彻底、最慢，也最消耗你的用量上限。关闭标签页或重启应用后重置。",
    "Bypass Permissions mode isn't enabled. The session started in Accept Edits — enable Bypass Permissions in Settings to use it.": "未启用「跳过权限」模式。本次会话以「接受编辑」启动——在设置中启用「跳过权限」即可使用。",
    "Bypass Permissions mode isn’t enabled. The session started in Accept Edits — enable Bypass Permissions in Settings to use it.": "未启用「跳过权限」模式。本次会话以「接受编辑」启动——在设置中启用「跳过权限」即可使用。",
    "Permission mode couldn't be changed. You can try again.": "无法更改权限模式。你可以重试。",
    // === 开发者模式: 配置第三方推理 (若此窗口非 claude.ai 页, 这些不会生效) ===
    "Configure third-party inference": "配置第三方推理",
    "Search settings": "搜索设置",
    "Connection": "连接",
    "Workspace restrictions": "工作区限制",
    "Connectors & extensions": "连接器与扩展",
    "Telemetry & updates": "遥测与更新",
    "Egress Requirements": "出站要求",
    "Choose where Claude Desktop sends inference requests.": "选择 Claude Desktop 将推理请求发送到何处。",
    "Gateway": "网关",
    "Gateway credentials": "网关凭据",
    "Credential kind": "凭据类型",
    "Selects the credential source. When set, only that source is used (no fallback).": "选择凭据来源。设置后只使用该来源（无回退）。",
    "Gateway base URL": "网关基础 URL",
    "Full URL of the inference gateway endpoint.": "推理网关端点的完整 URL。",
    "Custom inference headers": "自定义推理请求头",
    "Add header": "添加请求头",
    "Hide details": "隐藏详情",
    "Show details": "显示详情",
    "Model discovery": "模型发现",
    "Apply Changes": "应用更改",
    "Usage limits": "用量上限",
    "Plugins & skills": "插件与技能",
    "Source": "源码",
    "Extra HTTP headers sent on every inference request to the configured provider. For tenant routing, org IDs, Bedrock Guardrails, etc.": "在每次向所配置的提供方发送的推理请求上附带的额外 HTTP 请求头。用于租户路由、组织 ID、Bedrock Guardrails 等。",
    "Static API key": "静态 API 密钥",
    "Helper script": "辅助脚本",
    "Interactive sign-in": "交互式登录",
    "Connect to your own gateway": "连接到你自己的网关",
    "Model list": "模型列表",
    "Override the auto-discovered model list. First entry is the default.": "覆盖自动发现的模型列表。第一项为默认。",
    "Display name": "显示名称",
    "Shown in the model picker. Leave blank to auto-format from the ID.": "显示在模型选择器中。留空则根据 ID 自动格式化。",
    "Offer 1M-context variant": "提供 100 万上下文变体",
    "Tier alias": "档位别名",
    "Which Claude tier this model stands in for. Pins the bare alias (e.g. 'opus') and, for opus/fable, the refusal fallback.": "此模型代表哪个 Claude 档位。会固定其裸别名（如 'opus'），对 opus/fable 还会固定拒绝回退。",
    "Which Claude tier this model stands in for. Pins the bare alias (e.g. ‘opus’) and, for opus/fable, the refusal fallback.": "此模型代表哪个 Claude 档位。会固定其裸别名（如 'opus'），对 opus/fable 还会固定拒绝回退。",
    "Add model": "添加模型",
    "Invalid input": "输入无效",
    "value": "值",
    "Auto-populate the model picker from /v1/models at launch; when this key isn't set in the config, discovery is skipped if the model list below makes it unnecessary.": "启动时从 /v1/models 自动填充模型选择器；当配置中未设置此键时，若下方的模型列表已使其无必要，则跳过发现。",
    "Auto-populate the model picker from /v1/models at launch; when this key isn’t set in the config, discovery is skipped if the model list below makes it unnecessary.": "启动时从 /v1/models 自动填充模型选择器；当配置中未设置此键时，若下方的模型列表已使其无必要，则跳过发现。",
    "Auto-populate the model picker from the provider's model-list endpoint at launch. For gateway and Anthropic providers, a config that doesn't set this key skips discovery automatically when the model list below already makes it unnecessary; the toggle here only sets it explicitly on or off. Turn off if the endpoint isn't reachable from your network, or to use a fixed list. When off, the model list below is required and must use full model IDs (aliases like sonnet/opus are resolved via discovery).": "启动时从提供方的模型列表端点自动填充模型选择器。对于网关和 Anthropic 提供方，若配置未设置此键，当下方模型列表已使其无必要时会自动跳过发现；这里的开关只是显式打开或关闭它。如果该端点在你的网络中不可达，或想使用固定列表，请关闭。关闭时，下方模型列表为必填，且必须使用完整的模型 ID（sonnet/opus 这类别名通过发现解析）。",
    "Auto-populate the model picker from the provider’s model-list endpoint at launch. For gateway and Anthropic providers, a config that doesn’t set this key skips discovery automatically when the model list below already makes it unnecessary; the toggle here only sets it explicitly on or off. Turn off if the endpoint isn’t reachable from your network, or to use a fixed list. When off, the model list below is required and must use full model IDs (aliases like sonnet/opus are resolved via discovery).": "启动时从提供方的模型列表端点自动填充模型选择器。对于网关和 Anthropic 提供方，若配置未设置此键，当下方模型列表已使其无必要时会自动跳过发现；这里的开关只是显式打开或关闭它。如果该端点在你的网络中不可达，或想使用固定列表，请关闭。关闭时，下方模型列表为必填，且必须使用完整的模型 ID（sonnet/opus 这类别名通过发现解析）。",
    "Permission mode couldn’t be changed. You can try again.": "无法更改权限模式。你可以重试。",

    // === Fable 5 回归卡 ===
    "Fable 5 is back": "Fable 5 回来了",
    "Our newest model tackles your biggest challenges with fewer check-ins needed.": "我们最新的模型能应对最棘手的挑战，需要的核对确认更少。",
    "Try Fable 5": "试试 Fable 5",

    // === "Claude 还在工作" 拦截对话框 (标题 exact; 描述被 <a>项目 overview</a> 链接切分, 走片段) ===
    "Claude is still working": "Claude 还在工作",
    "Claude is working in": "Claude 正在处理",
    ". Relaunching now will interrupt that work.": "。现在重启会打断这项工作。",
    "Wait for Claude": "等 Claude",
    "Update anyway": "仍然更新",
    "anyway": "仍然",

    // === 记忆功能引导卡 ===
    "Can you remind me of everything I've accomplished this quarter?": "能提醒我本季度都完成了哪些事吗？",
    "Can you remind me of everything I’ve accomplished this quarter?": "能提醒我本季度都完成了哪些事吗？",
    "Have to write a very overdue self review...": "得写一份严重逾期的自我评价……",
    "Have to write a very overdue self review…": "得写一份严重逾期的自我评价……",
    // 标题 "Claude has Memory" 里 Memory 是独立节点(已翻记忆), 只需翻前缀
    "Claude has": "Claude 拥有",
    "Now Claude can make relevant connections across your chats. Memory includes your entire chat history with Claude.": "现在 Claude 能在你的对话之间建立相关关联。记忆包含你与 Claude 的完整聊天历史。",
    // 底部链接: 整串 + "About" 单独兜 (DOM 拆分两种情况)
    "About Memory": "关于记忆",
    "About": "关于",
    // 按钮: 整串 + 前缀单独兜 (Memory 独立节点会走 partial → 记忆)
    "Don't use Memory": "不使用记忆",
    "Don’t use Memory": "不使用记忆",
    "Don't use": "不使用",
    "Don’t use": "不使用",
    "Use Memory": "使用记忆",
    "Use": "使用",

    // === 视图切换 toast ===
    "Switched transcript view to Thinking": "已切换到思考视图",
    "Switched transcript view to Standard": "已切换到标准视图",

    // === 会话/文件右键菜单 (剩余项) ===
    "Copy filename": "复制文件名",
    "filename": "文件名",
    "Session actions": "会话操作",

    // === Artifacts 面板空态 ===
    "Artifacts published in this session appear here.": "本次会话中发布的 Artifacts 会显示在这里。",

    // === 文件预览空态 (working directory 外) ===
    "This file is outside the working directory": "该文件在工作目录之外",
    "It can't be opened here, but it may still exist on disk.": "无法在此打开，但磁盘上可能仍然存在。",
    "It can’t be opened here, but it may still exist on disk.": "无法在此打开，但磁盘上可能仍然存在。",

    // === PR diff 折叠提示 ===
    "Files are collapsed for large diffs. Select a file to expand it.": "大 diff 时文件已折叠。选中某个文件即可展开。",

    // === 会话右键 "在 XX 中打开" 子菜单 ===
    "New window": "新窗口",
    "window": "窗口",

    // === Fable 5 顶部提示条 (整段一节点; 日期变量在 dynamicPatterns) ===
    "Fable 5 is the most capable model and draws down usage much faster than Opus 4.8": "Fable 5 是能力最强的模型，用量消耗比 Opus 4.8 快得多",

    // === Cowork 主界面 (对话/Cowork 分段控件 tooltip) ===
    "Chat with Claude, one response at a time": "与 Claude 对话，一次一条回复",

    // === 项目/文件夹 选择器 (Cowork 起始态) ===
    "Project or folder": "项目或文件夹",
    "or folder": "或文件夹",

    // === "灵感推荐" 区域 (拆节点: Inspiration/Send/Organize/Customize 前缀已翻, 后段没词条) ===
    "Inspiration for you": "为你推荐",
    "for you": "推荐",
    "Send me a daily briefing": "给我发一份日报",
    "me a daily briefing": "我一份日报",
    "Organize my inbox": "整理我的收件箱",
    "my inbox": "我的收件箱",
    "Customize Cowork for me": "为我定制 Cowork",
    "Cowork for me": "Cowork（为我定制）",
    "for me": "为我",

    // === "Cowork 双倍用量" 引导卡 (右下角) + 顶部延长期气泡 ===
    "Extended:": "延长期：",
    "Extended": "延长期",

    // === Cowork 分段控件 tooltip (另一个提示) ===
    "Give Claude a task (or a few) to run autonomously": "给 Claude 派一个（或多个）任务自主运行",

    // === "Cowork 有了新家" 引导气泡 (整串 + 前缀兜; "home" 拆节点时留英文) ===
    "Cowork has a new home": "Cowork 有了新家",
    "Cowork has a": "Cowork 有了",
    "new home": "新家",
    "Chat with Claude or switch to Cowork. Claude will research, build, and keep going independently.": "和 Claude 对话，或切换到 Cowork。Claude 会自主查资料、构建，持续推进。",

    // === Cowork 权限模式下拉 (手动 / 跳过) ===
    "Manually approve each action": "手动批准每个操作",
    "Claude pauses so you can approve every action.": "Claude 会暂停，让你批准每个操作。",
    "Skip all approvals": "跳过所有批准",
    "all approvals": "所有批准",
    "Claude never pauses, even for unsafe actions.": "Claude 从不暂停，即使是不安全的操作也不停。",

    // === "跳过所有批准?" 确认对话框 (Use Chrome 开关) ===
    "Use Chrome": "使用 Chrome",
    "Claude can browse and act on sites in your Chrome browser. Claude decides which actions are safe to take without asking.": "Claude 可以在你的 Chrome 浏览器里浏览网站并进行操作。Claude 会自行判断哪些操作可以直接执行、不必询问。",

    // === Fable 5 模型选择器 tooltip 气泡 (百分比整段) ===
    "You can use up to 50% of your weekly limits on Fable 5, then it runs on usage credits. Fable 5 draws down usage much faster than Opus 4.8.": "你最多可将每周用量上限的 50% 用于 Fable 5，之后转为消耗用量额度。Fable 5 消耗用量的速度比 Opus 4.8 快得多。",

    // === 项目合并提示条 (对话与 Cowork 的项目合并到一处) ===
    "Projects made in Chat and Cowork are now all in one place.": "在对话和 Cowork 中创建的项目现在都汇集在同一处。",

    // === 设置 > 可信设备 (远程控制) ===
    "Trusted devices": "可信设备",
    "devices": "设备",
    "Devices that can control your local machine through remote sessions.": "可以通过远程会话控制你本机的设备。",
    "Added": "添加时间",
    "No trusted devices.": "无可信设备。",

    // === 设置 > 通知 ===
    "Flash the taskbar button when Claude needs your attention and the app is not focused.": "当 Claude 需要你注意且应用未处于焦点时，闪烁任务栏按钮。",

    // === 设置 > 消息标记切模型 描述末段 (独立 textNode, 跟已有 5085 "Also applies..." 措辞不同) ===
    "Applies to local sessions on this machine.": "适用于本机的本地会话。",
    "Applies to web and remote sessions.": "适用于网页和远程会话。",

    // === 设置 > Preview 标签会话持久化 ===
    "Persist sessions": "保留会话",
    "Save cookies, local storage, and login sessions for Preview tabs across app restarts. Shared uses the same data for every session in a project. Separate gives each session its own copy, so sessions never see each other's logins.": "在应用重启后为 Preview 标签保留 cookies、本地存储和登录会话。「已分享」在项目内所有会话共用同一份数据。「独立」为每个会话单独保留一份，会话之间互不看到彼此的登录。",
    "Save cookies, local storage, and login sessions for Preview tabs across app restarts. Shared uses the same data for every session in a project. Separate gives each session its own copy, so sessions never see each other’s logins.": "在应用重启后为 Preview 标签保留 cookies、本地存储和登录会话。「已分享」在项目内所有会话共用同一份数据。「独立」为每个会话单独保留一份，会话之间互不看到彼此的登录。",
    "Don't keep": "不保留",
    "Don’t keep": "不保留",
    "Separate": "独立",

    // === 设置 > 分支前缀描述 (本地 + 云端会话) ===
    "Prefix added to branch names for both local and cloud sessions": "本地与云端会话分支名的前缀",

    // === 设置 > 可信 Cowork 文件夹 ===
    "Trusted Cowork folders": "可信 Cowork 文件夹",
    "folders": "文件夹",
    "When you attach one of these folders to a Cowork task, Claude won't ask you to confirm.": "把这里列出的文件夹附加到 Cowork 任务时，Claude 不会再向你确认。",
    "When you attach one of these folders to a Cowork task, Claude won’t ask you to confirm.": "把这里列出的文件夹附加到 Cowork 任务时，Claude 不会再向你确认。",

    // === 定时任务 > 自定义 cron 表达式 ===
    "Cron expression": "Cron 表达式",

    // === 会话空态 ===
    "No messages yet": "还没有消息",

    // === Artifacts 列表页空态 (跟已有面板空态 "Artifacts published in this session appear here." 不同) ===
    "Your artifacts will be listed here once you create one.": "你创建 artifact 后，会在这里列出。",

    // === 用量额度 (Usage credits) 全套 ===
    // 开启对话框描述 (末尾 "帮助中心文章" 是独立链接节点, 拆前段兜)
    "Turn on usage credits to keep working after you hit your plan limit. Credits are billed separately from your plan — see our": "开启用量额度，达到套餐上限后仍可继续使用。额度与套餐分开计费——参见我们的",
    // 已开启 / 已关闭 toast (整串 + 后段兜 DOM 拆节点)
    "Usage credits are on": "用量额度已开启",
    "Usage credits are off": "用量额度已关闭",
    "are on": "已开启",
    "are off": "已关闭",
    // 用量额度设置页
    "Monthly spend limit": "月度消费上限",
    "spend limit": "消费上限",
    "Adjust limit": "调整上限",
    "Auto-reload": "自动充值",
    "current balance": "当前余额",
    "balance": "余额",
    "Buy usage credits": "购买用量额度",
    // 设置月度上限页
    "Set monthly spend limit": "设置月度消费上限",
    "monthly spend limit": "月度消费上限",
    "Set a monthly limit for how much you can spend on usage credits.": "设置每月最多可用于用量额度的消费金额。",
    "This spend limit goes into effect immediately": "此消费上限立即生效",
    "Set to unlimited": "设为无限制",
    "to unlimited": "为无限制",
    "Set spend limit": "设置消费上限",
    // "$X.XX spent" DOM 拆节点场景 ($X.XX 独立节点, "spent" 独立节点; dynamic 命不中)
    "spent": "已花费",

    // === 购买用量额度页 ===
    "Choose an amount to start. You can always buy more later.": "选择一个金额开始，之后可随时再买更多。",
    // Pay button DOM 拆节点时兜 "Pay" 独立段 (dynamic 只兜整段 "Pay $X now")
    "Pay": "付款",
    "now": "立即",

    // === "从 GitHub 添加内容" 对话框 ===
    "Add content from GitHub": "从 GitHub 添加内容",
    "content": "内容",
    "Pick a repository and branch to link in this chat": "选择要在此对话中关联的仓库和分支",
    "Pick a repository and branch — Claude reads it through the GitHub connector when it needs it. Nothing is downloaded now, and sending is never blocked.": "选择仓库和分支——Claude 需要时会通过 GitHub 连接器读取。现在不会下载任何东西，也不会阻塞发送。",
    "Paste GitHub URL": "粘贴 GitHub URL",
    "Add repository": "添加仓库",
    "repository": "仓库",

    // === "试用 Claude Code for GitHub" 弹窗 (整串 exact 优先命中, 挡住 "Code"→"代码" partial 错译) ===
    "Try Claude Code for GitHub": "试用 Claude Code（GitHub 版）",
    "Try Claude Code": "试用 Claude Code",
    "for GitHub": "（GitHub 版）",
    "Claude Code on the web is a far more capable way to work with your GitHub repos. It can read, edit, run, and reason over your whole codebase.": "网页版 Claude Code 处理你 GitHub 仓库的能力远更强。它可以读取、编辑、运行并推理整个代码库。",
    // "Learn more about Claude Code" 拆节点: "了解更多" 是 partial "Learn more" 已翻, "about Claude Code" 独立
    "about Claude Code": "关于 Claude Code",
    // "Continue to GitHub sync" 拆节点
    "Continue to GitHub sync": "继续到 GitHub 同步",
    "to GitHub sync": "到 GitHub 同步",

    // === 连接器列表页 (表头 + 徽标 + 名称) ===
    "Connector": "连接器",
    "Included": "内置",
    "GitHub Integration": "GitHub 集成",

    // === 更新付款方式 表单 (发票命名相关) ===
    "Use a different name on invoices": "在发票上使用不同的名称",
    "Bill to": "收款抬头",
    "Company or individual name": "公司或个人名称",
    "This name will appear on your invoices.": "此名称将显示在你的发票上。",

    // === 开启自动充值 (Auto-reload) 对话框 ===
    "Turn on Auto-reload?": "开启自动充值？",
    "Automatically buy more usage credits when you're running low.": "余额不足时自动购买更多用量额度。",
    "Automatically buy more usage credits when you’re running low.": "余额不足时自动购买更多用量额度。",
    "When usage credits drop to:": "当用量额度降到：",
    "Top up to:": "充值到：",
    "You agree that Anthropic will charge the card you have on file in the amount above on a recurring basis whenever your balance reaches the amount indicated. To cancel, turn off auto-reload.": "你同意每当余额触及所指金额时，Anthropic 按上述金额向你已存卡定期扣款。如需取消，请关闭自动充值。",
    "Discount": "折扣",
    "Total due": "应付合计",
    "due": "应付",
    "By clicking Pay now, you allow Anthropic to charge your card in the amount above.": "点击「立即付款」即表示你授权 Anthropic 按上述金额向你的卡扣款。",

    // === 月度消费上限 tooltip (组织级) ===
    "Set a monthly limit for Claude usage in your organization. Note, once the org hits that limit, Claude access will be cut off for all users until the limit resets.": "为你的组织设置 Claude 使用的月度上限。注意：一旦组织触及该上限，所有用户都将无法访问 Claude，直至上限重置。",

    // 关闭确认对话框
    "Turn off usage credits?": "关闭用量额度？",
    "Turn off": "关闭",
    "Usage credits keep you going when you hit your plan limits. If you're past a limit now, your current chat will get cut off.": "达到套餐上限时用量额度让你继续使用。如果你现在已经超过上限，当前对话会被截断。",
    "Usage credits keep you going when you hit your plan limits. If you’re past a limit now, your current chat will get cut off.": "达到套餐上限时用量额度让你继续使用。如果你现在已经超过上限，当前对话会被截断。",

    // === 设置 > 云端运行新任务 ===
    "Run new tasks in the cloud": "在云端运行新任务",
    "tasks in the cloud": "任务在云端",
    "in the cloud": "在云端",
    "When on, new Cowork tasks start in the cloud instead of on this computer.": "开启后，新的 Cowork 任务会在云端启动，而不是这台电脑上。",

    "No repositories found": "未找到仓库",
    // 网络访问级别
    "Blocks internet access for maximum security.": "屏蔽互联网访问以获得最高安全性。",
    "Downloads packages from verified sources.": "从已验证的来源下载软件包。",
    "Full": "完全",
    "Unrestricted internet access for maximum flexibility.": "不受限的互联网访问以获得最大灵活性。",
    "Create a list of allowed domains.": "创建允许访问的域名列表。",
    "Runs every hour": "每小时运行",
    "Once": "一次",
    "At minute": "在第几分钟",
    "Run at": "运行时间",
    "Runs are staggered by a few minutes to spread server load.": "为分散服务器负载，各次运行会错开几分钟。",
    "Claude will send you a one-line summary when each run completes — only when there's something worth telling you for routines that watch for a condition.": "每次运行完成时，Claude 会给你发一行摘要——对于监测条件的定时任务，仅在有值得告诉你的内容时才发。",
    "Claude will send you a one-line summary when each run completes — only when there’s something worth telling you for routines that watch for a condition.": "每次运行完成时，Claude 会给你发一行摘要——对于监测条件的定时任务，仅在有值得告诉你的内容时才发。",
    "Push notification": "推送通知",
    "Sent to the Claude mobile and desktop apps.": "发送到 Claude 手机和桌面应用。",
    "Email": "邮件",
    "Sent to the email address on your account.": "发送到你账户的邮箱地址。",
    "Sent as a direct message by the Claude app in your Slack workspace, matched by your account email. Takes effect the next time the routine runs.": "由 Claude 应用在你的 Slack 工作区以私信发送，按你的账户邮箱匹配。下次定时任务运行时生效。",
    "Check design system, Listing files": "检查设计系统、列出文件",
    "A rubber band over a stripped screw head gives enough grip to turn it.": "在拧花的螺丝头上套一根橡皮筋，就能有足够的摩擦力把它拧动。",
    "Run walnuts over scratched wood furniture. The oils fill the scratches.": "用核桃仁擦拭刮花的木家具，核桃油会填平划痕。",
    "Image copied to clipboard": "图片已复制到剪贴板",
    "Mount a local folder from the Import menu — Claude reads your codebase live, no copying.": "从导入菜单挂载本地文件夹 —— Claude 实时读取你的代码库，无需复制。",
    "Click \"Comment\" in the toolbar, then click any element to annotate it.": "点击工具栏中的「评论」，然后点击任意元素进行标注。",
    "Click “Comment” in the toolbar, then click any element to annotate it.": "点击工具栏中的「评论」，然后点击任意元素进行标注。",
    "Ask Claude to use the Web Speech API for interactive voice input and output.": "让 Claude 使用 Web Speech API 实现交互式语音输入和输出。",
    "\"Handoff to Claude Code\" creates a dev-ready package with specs and structure. Download it, then tell Claude Code \"create this design.\"": "「交给 Claude Code」会生成一个带规格和结构、可直接开发的包。下载后，告诉 Claude Code「创建这个设计」。",
    "“Handoff to Claude Code” creates a dev-ready package with specs and structure. Download it, then tell Claude Code “create this design.”": "「交给 Claude Code」会生成一个带规格和结构、可直接开发的包。下载后，告诉 Claude Code「创建这个设计」。",
    "Adding a splash of water instead of milk makes fluffier eggs. Milk makes them dense.": "用一点水代替牛奶能让鸡蛋更蓬松。牛奶会让它们更紧实。",
    "Put a wooden spoon across a boiling pot. It won't boil over.": "在沸腾的锅上横放一把木勺，汤就不会溢出来。",
    "Put a wooden spoon across a boiling pot. It won’t boil over.": "在沸腾的锅上横放一把木勺，汤就不会溢出来。",
    "Microwave a damp paper towel for 30 seconds. Crud wipes right off the inside.": "把湿纸巾放进微波炉加热 30 秒，内壁的污垢一擦就掉。",
    "The Share menu lets you export as PPTX, PDF, or a folder to give to Claude Code.": "分享菜单可以让你导出为 PPTX、PDF，或导出成一个文件夹交给 Claude Code。",
    "You cannot unsee a bad font pairing. Choose carefully.": "糟糕的字体搭配一旦看到就再也忘不掉。请谨慎选择。",
    "Comments and text edits appear as chips in the composer. Remove any you don't want.": "评论和文本编辑会以 chip 形式出现在输入框里。不想要的随时移除。",
    "Comments and text edits appear as chips in the composer. Remove any you don’t want.": "评论和文本编辑会以 chip 形式出现在输入框里。不想要的随时移除。",
    "The best design system is the one nobody notices.": "最好的设计系统是没人会注意到的那个。",
    "\"Prototype\" starts at wireframes, moves to hi-fi, and ends as a working interactive app.": "「原型」从线框图开始，进阶到高保真，最终成为一个可运行的交互式应用。",
    "“Prototype” starts at wireframes, moves to hi-fi, and ends as a working interactive app.": "「原型」从线框图开始，进阶到高保真，最终成为一个可运行的交互式应用。",
    "The user's mental model is the only spec that matters.": "用户的心智模型才是唯一重要的规格。",
    "The user’s mental model is the only spec that matters.": "用户的心智模型才是唯一重要的规格。",
    "Attach skills or reference design systems from the Import menu.": "从导入菜单附加技能或引用设计系统。",
    "If you need more than three colors, you have zero colors.": "如果你需要超过三种颜色，那你就等于没有颜色。",
    "To talk to Claude, hold down Space to dictate.": "想跟 Claude 说话，按住空格键即可口述。",
    "Leave multiple comments before sending — they all batch into one message.": "发送前可以留多条评论 —— 它们会合并成一条消息。",
    "Import → Web Capture lets you copy elements from real web pages and paste them to Claude.": "「导入 → Web Capture」可以让你从真实网页复制元素并粘贴给 Claude。",
    "The napkin sketch tool lets you draw freehand — great for rough layouts.": "餐巾纸草图工具让你随手画 —— 很适合粗略布局。",
    "Every pixel argues for attention. Most should lose.": "每个像素都在争夺注意力。大多数都该落败。",
    "Turn on speaker notes when creating decks to get a full presenter script.": "创建演示文稿时开启演讲者备注，即可获得完整的演讲脚本。",
    "Whitespace is not empty. It is the silence between the notes.": "留白并非空白。它是音符之间的静默。",
    "Text edit mode lets you click text in the preview and rewrite it in-place.": "文本编辑模式让你点击预览中的文字，原地重写。",
    "Send (Ctrl+Enter)": "发送 (Ctrl+Enter)",
    // 设计系统详情页 (design 已从 partial 排除, "X design" 短语需整短语 exact)
    "Your team's new projects will use this design system by default. You can always update this design system using the chat.": "你团队的新项目将默认使用这个设计系统。你随时可以通过对话更新这个设计系统。",
    "Your team’s new projects will use this design system by default. You can always update this design system using the chat.": "你团队的新项目将默认使用这个设计系统。你随时可以通过对话更新这个设计系统。",
    "Use this system": "使用此系统",
    "New design": "新建设计",
    "Check design system": "检查设计系统",
    "Auth failed: internal server error": "认证失败：内部服务器错误",
    "A prototype nobody clicks is just a painting.": "没人点击的原型只是一幅画。",
    // 用量弹窗 "Resets" 标签 (日期由 app i18n 格式成中文, 是独立英文节点)
    "Resets": "重置于",
    "No cards yet — add <!-- @dsCard group=\"…\" --> as the first line of any .html file.": "尚无卡片 —— 在任意 .html 文件的第一行加上 <!-- @dsCard group=\"…\" -->。",
    "Claude can call the Claude API from inside your prototypes. No backend needed.": "Claude 可以在你的原型内部调用 Claude API。无需后端。",
    "Finishing up": "即将完成",
    "Tweaks": "微调",
    "Describe a tweak…": "描述一个微调…",
    "Describe a tweak...": "描述一个微调...",
    "Ideas": "灵感",
    "Working…": "处理中…",
    "Working...": "处理中...",
    "Copying starter": "正在复制起始模板",
    "Copying": "复制中",
    "Undo": "撤销",
    "Chat history": "对话历史",
    "New version ready": "新版本就绪",
    "Claude has some questions": "Claude 有几个问题",
    "inserts a new line.": "即可换行。",
    "Checking the design for issues...": "正在检查设计的问题...",
    "Checking the design for issues…": "正在检查设计的问题…",
    "Act": "执行",
    "Active": "活跃",
    "Claude desktop font settings not applying": "Claude 桌面字体设置不生效",
    "Get to work with": "开始使用",
    "Pdf viewer": "PDF 查看器",
    "Annotate PDF": "标注 PDF",
    "Sign PDF document": "签署 PDF 文档",
    "Fill PDF form fields": "填写 PDF 表单",
    "See all": "查看全部",
    "Recent": "最近",
    "Select a different folder": "选择其他文件夹",
    "Choose a different folder": "选择其他文件夹",
    "Search folders": "搜索文件夹",
    "More models": "更多模型",
    "Currently unavailable": "当前不可用",
    "Manage plugins": "管理插件",
    // Scheduled tasks 页
    "Scheduled tasks": "定时任务",
    "Run tasks on a schedule or whenever you need them. Type /schedule in any existing task to set one up.": "按时间表或随时运行任务。在任意已有任务里输入 /schedule 设置。",
    "Scheduled tasks only run while your computer is awake.": "定时任务只在电脑唤醒时运行。",
    "Keep awake": "保持唤醒",
    "When enabled, Claude will prevent your computer from going to sleep.": "启用后，Claude 将阻止你的电脑进入睡眠。",
    "No scheduled tasks yet.": "暂无定时任务。",
    "Next run": "下次运行",
    // 副标题被 /schedule code chip 切成两段渲染（整串 1325 命不中），拆段补
    "Run tasks on a schedule or whenever you need them. Type": "按时间表或随时运行任务。在任意已有任务里输入",
    "in any existing task to set one up.": "设置。",
    "Search scheduled tasks…": "搜索定时任务…",
    "Search scheduled tasks...": "搜索定时任务...",
    "Create your first scheduled task": "创建你的第一个定时任务",
    // 下拉项 / 快捷模板：Set up/Daily/Weekly 是单词级条目，partial 会残留英文，整短语 exact 优先
    "Set up manually": "手动设置",
    "Daily brief": "每日简报",
    "Weekly review": "每周回顾",
    "Name": "名称",
    "Filter scheduled tasks": "筛选定时任务",
    "Create scheduled task": "创建定时任务",
    "Description": "描述",
    "Default model": "默认模型",
    "Frequency": "频率",
    "Manual": "手动",
    "Hourly": "每小时",
    "Daily": "每天",
    "Weekdays": "工作日",
    // 定时任务详情页：Run/Manual 是单词级条目，partial 残留英文，整短语 exact 优先
    "Run now": "立即运行",
    "Manual only": "仅手动",
    "History": "历史",
    "Repeats": "重复",
    "Always allowed": "始终允许",
    "Runs": "运行记录",
    // "scheduled task" 词组无条目 → Edit/Delete/Ran 被 partial 翻、词组留英文；
    // 整短语 exact 保单节点无空格 + 小写词条兜底拆节点/其他组合
    "Edit scheduled task": "编辑定时任务",
    "Delete scheduled task": "删除定时任务",
    "Ran scheduled task": "运行了定时任务",
    "scheduled task": "定时任务",
    // 删除定时任务对话框 复选框
    "Also delete files on disk": "同时删除磁盘上的文件",

    // === 斜杠命令 popover 简介 (命令名保持英文, 只翻描述; 命令名 skip 逻辑见 isInSkipElement) ===
    // 描述是独立 text node 且含空格, 不会被 lowercase-命令名 skip 命中; 普通 exact 即可
    // /schedule
    "Create a scheduled task that can be run on demand or automatically on an interval.": "创建一个可按需运行、或按间隔自动运行的定时任务。",
    // 旁支提问 (/ask 之类)
    "Ask a quick side question without adding to the conversation": "快速问一个旁支问题，不加入当前对话",
    // /ultrareview
    "Launch a remote Ultrareview session for this repository": "为该仓库启动一个远程 Ultrareview 会话",
    // /rewind
    "Rewind the conversation to a previous turn": "把对话回退到之前某一轮",
    // /fork
    "Fork this conversation into a new session": "把当前对话派生为一个新会话",
    // /mcp
    "Manage MCP connectors": "管理 MCP 连接器",
    // /feedback
    "Submit feedback, report a bug, or share your conversation": "提交反馈、报告 bug 或分享你的对话",
    // /model
    "Set the model for this session": "设置该会话使用的模型",
    // /rename
    "Rename this session": "重命名该会话",
    // /workflows
    "Browse workflow history (running and completed)": "浏览工作流历史（运行中和已完成）",
    // /usage
    "Show plan usage and rate limits": "查看套餐用量和速率限制",
    // /settings
    "Open Claude Code settings": "打开 Claude Code 设置",
    // /reload-plugins
    "Reload plugins and refresh available commands": "重新加载插件并刷新可用命令",
    // /reset-limits
    "Reset local rate-limit counters": "重置本地速率限制计数器",
    // /pr (createPr) — 源串是直撇号; 加弯撇号变体兜 claude.ai 可能的规范化
    "Open a pull request for this session's branch": "为该会话的分支创建 PR",
    "Open a pull request for this session’s branch": "为该会话的分支创建 PR",

    // === skill 目录(marketplace)卡片描述 (skill 名/artifact 保持英文; 卡片 CSS line-clamp 截断, DOM 内是完整描述, 翻全文) ===
    // 只收录已确认精确原文的 (本地 manifest / 已装 skill); marketplace 上未装的 skill 描述本地取不到, 需另抓
    // skill-creator (源串含直撇号 skill's, 加弯撇号变体兜)
    "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.": "创建新 skill、修改和改进现有 skill，并评估 skill 表现。当用户想从零创建 skill、编辑或优化现有 skill、跑 eval 测试 skill、用方差分析对 skill 表现做基准测试，或优化 skill 的描述以提升触发准确度时使用。",
    "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill’s description for better triggering accuracy.": "创建新 skill、修改和改进现有 skill，并评估 skill 表现。当用户想从零创建 skill、编辑或优化现有 skill、跑 eval 测试 skill、用方差分析对 skill 表现做基准测试，或优化 skill 的描述以提升触发准确度时使用。",
    // doc-coauthoring
    "Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content. This workflow helps users efficiently transfer context, refine content through iteration, and verify the doc works for readers. Trigger when user mentions writing docs, creating proposals, drafting specs, or similar documentation tasks.": "引导用户走完一套结构化的文档协作撰写流程。当用户想写文档、提案、技术规格、决策文档或类似的结构化内容时使用。该流程帮助用户高效传递上下文、通过迭代打磨内容，并验证文档对读者是否有效。当用户提到写文档、创建提案、起草规格或类似文档任务时触发。",
    // theme-factory
    "Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creating, or can generate a new theme on-the-fly.": "用主题为 artifact 设定样式的工具包。这些 artifact 可以是幻灯片、文档、报告、HTML 落地页等。内置 10 套带配色/字体的预设主题，可应用到任何已创建的 artifact，也可以即时生成新主题。",
    // web-artifacts-builder
    "Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts.": "用于创建复杂的、多组件 claude.ai HTML artifact 的工具套件，采用现代前端技术（React、Tailwind CSS、shadcn/ui）。适用于需要状态管理、路由或 shadcn/ui 组件的复杂 artifact——不适用于简单的单文件 HTML/JSX artifact。",
    // mcp-builder
    "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).": "创建高质量 MCP（Model Context Protocol）服务器的指南，让 LLM 能通过精心设计的工具与外部服务交互。在构建 MCP 服务器以集成外部 API 或服务时使用，无论是用 Python（FastMCP）还是 Node/TypeScript（MCP SDK）。",
    // internal-comms
    "A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.).": "一套帮我撰写各类内部沟通材料的资源，使用我公司惯用的格式。每当被要求撰写某种内部沟通材料（状态报告、领导层汇报、3P 更新、公司通讯、常见问题、事故报告、项目更新等）时，Claude 应使用此 skill。",
    // canvas-design (源串含直撇号 artists', 加弯撇号变体)
    "Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other static piece. Create original visual designs, never copying existing artists' work to avoid copyright violations.": "运用设计理念，在 .png 和 .pdf 文档中创作精美的视觉艺术。当用户要求制作海报、艺术作品、设计或其他静态作品时使用此 skill。创作原创视觉设计，绝不复制现有艺术家的作品，以避免侵犯版权。",
    "Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other static piece. Create original visual designs, never copying existing artists’ work to avoid copyright violations.": "运用设计理念，在 .png 和 .pdf 文档中创作精美的视觉艺术。当用户要求制作海报、艺术作品、设计或其他静态作品时使用此 skill。创作原创视觉设计，绝不复制现有艺术家的作品，以避免侵犯版权。",
    // brand-guidelines (源串含直撇号 Anthropic's ×2, 加弯撇号变体)
    "Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.": "将 Anthropic 官方品牌配色和字体应用到任何可能受益于 Anthropic 观感的 artifact 上。当涉及品牌配色或风格规范、视觉格式或公司设计标准时使用。",
    "Applies Anthropic’s official brand colors and typography to any sort of artifact that may benefit from having Anthropic’s look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.": "将 Anthropic 官方品牌配色和字体应用到任何可能受益于 Anthropic 观感的 artifact 上。当涉及品牌配色或风格规范、视觉格式或公司设计标准时使用。",
    // algorithmic-art (源串含直撇号 artists', 加弯撇号变体)
    "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work to avoid copyright violations.": "使用 p5.js 创作算法艺术，带随机种子和交互式参数探索。当用户请求用代码创作艺术、生成艺术、算法艺术、流场或粒子系统时使用。创作原创算法艺术，而不是复制现有艺术家的作品，以避免侵犯版权。",
    "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists’ work to avoid copyright violations.": "使用 p5.js 创作算法艺术，带随机种子和交互式参数探索。当用户请求用代码创作艺术、生成艺术、算法艺术、流场或粒子系统时使用。创作原创算法艺术，而不是复制现有艺术家的作品，以避免侵犯版权。",
    // slack-gif-creator (源串含直双引号, 加弯双引号变体)
    "Knowledge and utilities for creating animated GIFs optimized for Slack. Provides constraints, validation tools, and animation concepts. Use when users request animated GIFs for Slack like \"make me a GIF of X doing Y for Slack.\"": "创建为 Slack 优化的动态 GIF 的知识与工具。提供约束条件、校验工具和动画概念。当用户请求用于 Slack 的动态 GIF（例如「给我做个 X 在 Slack 里做 Y 的 GIF」）时使用。",
    "Knowledge and utilities for creating animated GIFs optimized for Slack. Provides constraints, validation tools, and animation concepts. Use when users request animated GIFs for Slack like “make me a GIF of X doing Y for Slack.”": "创建为 Slack 优化的动态 GIF 的知识与工具。提供约束条件、校验工具和动画概念。当用户请求用于 Slack 的动态 GIF（例如「给我做个 X 在 Slack 里做 Y 的 GIF」）时使用。",

    // === 连接器目录 one_liner (自动生成, 勿手改; 源 _capture/servers_zh.json + merge.js) ===
    // 连接器名保持英文, 只翻卡片标语。已在词典的键 merge.js 自动跳过。整段按批用 BEGIN/END 替换。
    // CONNECTOR-ONELINER-BEGIN
    "Browse, summarize, autofill, and even generate new Canva designs directly from Claude. Make Canva a native part of your AI workflow—an AI-powered design agent that helps you create polished visuals faster, with less friction.": "直接在 Claude 中浏览、总结、自动填充，甚至生成新的 Canva 设计稿。让 Canva 成为你 AI 工作流的原生一环——一个 AI 驱动的设计 agent，帮你更快、更省心地做出精致的视觉作品。",
    "Access SharePoint, OneDrive, Outlook, and Teams directly in Claude. Search and analyze documents across sites and libraries, review email threads and communications, and extract insights from calendar and chat data. Make Microsoft 365 a native part of your Claude workflows while respecting all existing permissions and security controls. Built for Microsoft 365 at work — your company's SharePoint, OneDrive, Outlook, and Teams. Requires a work or school account (you@yourcompany.com). Personal accounts like outlook.com, hotmail.com, or live.com aren't supported.": "直接在 Claude 中访问 SharePoint、OneDrive、Outlook 和 Teams。跨站点和库搜索并分析文档，查看邮件会话和沟通记录，从日历和聊天数据中提取洞察。让 Microsoft 365 成为你 Claude 工作流的原生一环，同时尊重所有现有权限和安全控制。为职场版 Microsoft 365 打造——你公司的 SharePoint、OneDrive、Outlook 和 Teams。需要工作或学校账户（you@yourcompany.com）。不支持 outlook.com、hotmail.com、live.com 这类个人账户。",
    "The Figma MCP server helps you pull in Figma context and generate high-quality code that aligns with your codebase and design intent. Use the MCP server to retrieve code resources from Figma Design or Make files, and turn your ideas into production apps.\n\n **Key features:** \n• **Generate code from selected frames or nodes** - Select a frame in Figma or provide a node URL to have an AI agent turn your design into code. \n• **Extract design context from layers** - Pull out variables, components, and layouts from a design to ensure builds adhere to design patterns. \n• **Code smarter with Code Connect** - Boost output quality by reusing your actual components, the MCP server informs AI agents about existing components derived from Code Connect information. \n• **Map your flows with diagrams** - The Figma MCP server can turn your Claude prompts into flow charts, Gantt charts, or other diagrams in FigJam. \n\n **Note:** The get_screenshot tool is currently limited to returning a descripton of screenshots in Figma when called in Claude and Claude Code. See developer term [here](https://www.figma.com/legal/developer-terms/)": "Figma MCP 服务器帮你引入 Figma 上下文，生成与你的代码库和设计意图一致的高质量代码。用它从 Figma Design 或 Make 文件中获取代码资源，把你的想法变成可上线的应用。\n\n **主要功能：** \n• **从选中的框架或节点生成代码** - 在 Figma 中选中一个框架或提供节点 URL，让 AI agent 把你的设计变成代码。\n• **从图层提取设计上下文** - 抽取设计中的变量、组件和布局，确保构建遵循设计规范。\n• **借助 Code Connect 更聪明地写代码** - 复用你实际的组件来提升产出质量，MCP 服务器会把 Code Connect 里已有的组件信息告知 AI agent。\n• **用图表梳理流程** - Figma MCP 服务器能把你的 Claude 提示词变成 FigJam 里的流程图、甘特图或其他图表。\n\n **注意：** 在 Claude 和 Claude Code 中调用时，get_screenshot 工具目前只能返回 Figma 中截图的文字描述。开发者条款见[此处](https://www.figma.com/legal/developer-terms/)",
    "Connect Gmail to Claude to quickly find important emails and understand long conversations. Claude can search through your messages, read entire email threads to give you context, and help you stay on top of your inbox. Perfect for finding that message you remember sending, catching up on email chains you missed, or preparing for meetings.": "把 Gmail 连接到 Claude，快速找到重要邮件、读懂冗长的会话。Claude 能搜索你的邮件、读完整个邮件会话给你上下文，帮你掌控收件箱。特别适合找回你记得发过的某封邮件、补看错过的邮件往来，或为会议做准备。",
    "Notion MCP helps you plug tools into your Notion workspace, allowing you to create, edit, search and organize content directly from Claude. Get contextual and relevant assistance from Claude, while keeping knowledge organized in Notion.": "Notion MCP 帮你把工具接入 Notion 工作区，让你直接在 Claude 中创建、编辑、搜索并整理内容。从 Claude 获得贴合上下文的相关协助，同时把知识有序地留在 Notion 里。",
    "Connect Google Drive to Claude to search through your documents, read file contents, upload new files, and analyze your data. Claude can find specific documents even when you don't remember the exact name, read and analyze the content of Google Docs, Sheets, Slides, and PDFs, and upload files directly to your Drive. Useful for finding project notes, extracting data from spreadsheets, preparing meeting materials, or organizing files scattered across your Drive.": "把 Google Drive 连接到 Claude，搜索你的文档、读取文件内容、上传新文件并分析数据。即使你记不清确切文件名，Claude 也能找到特定文档，读取并分析 Google 文档、表格、幻灯片和 PDF 的内容，还能把文件直接上传到你的云端硬盘。适合查找项目笔记、从表格提取数据、准备会议材料，或整理散落在云端硬盘各处的文件。",
    "Atlassian’s Rovo MCP Server enables secure, permission-aware access to Jira and Confluence from external AI tools like Claude. It supports summarization, creation, and multi-step actions, helping teams tap into structured enterprise knowledge wherever they work—all while preserving data privacy and leveraging Atlassian’s open, interoperable Teamwork Graph foundation.": "Atlassian 的 Rovo MCP 服务器让 Claude 等外部 AI 工具能安全、感知权限地访问 Jira 和 Confluence。它支持总结、创建和多步操作，帮助团队在任何工作场景中利用结构化的企业知识——同时保护数据隐私，并基于 Atlassian 开放、可互操作的 Teamwork Graph 基础。",
    "Connect Google Calendar to Claude to view your schedule, manage events, and coordinate meetings. Claude can search your calendar for events, check your availability, find free time slots, create and update events, respond to invitations, and help you prepare for meetings. Useful for understanding what's coming up, scheduling new meetings by finding mutual availability, managing your calendar by creating or updating events, coordinating schedules across multiple people, or preparing for meetings by reviewing attendee lists and details.": "把 Google 日历连接到 Claude，查看日程、管理事件、协调会议。Claude 能搜索你日历中的事件、查看空闲情况、找出空档、创建和更新事件、回复邀请，并帮你为会议做准备。适合了解接下来的安排、通过寻找共同空闲时间来安排新会议、通过创建或更新事件来管理日历、跨多人协调日程，或通过查看参会者名单和细节为会议做准备。",
    "Connect to Slack to share messages and create canvases directly to simplify collaboration and boost productivity. Search and retrieve messages, channels, threads, files, and users, giving Claude the context to streamline your work.": "连接 Slack，直接分享消息、创建画布，简化协作、提升效率。搜索并获取消息、频道、会话、文件和用户，为 Claude 提供理顺工作所需的上下文。",
    "CRM context for every answer, insight, and action": "为每一次回答、洞察和操作提供 CRM 上下文",
    "Bring HubSpot customer context into Claude. Search and update contacts, companies, deals, tickets, campaigns, and more - without leaving Claude. Analyze campaign performance across emails, landing pages, and blog posts. Forecast pipeline, qualify leads, and update deal stages in seconds. Useful for pre-call prep, pipeline reviews, campaign attribution, and full account visibility. Permission-aware, real-time, secure.": "把 HubSpot 的客户上下文带入 Claude。搜索并更新联系人、公司、交易、工单、营销活动等——无需离开 Claude。跨邮件、落地页和博客文章分析营销活动效果。数秒内预测销售管道、甄别线索、更新交易阶段。适合通话前准备、管道复盘、活动归因和全面的客户视图。感知权限、实时、安全。",
    "The monday MCP server exposes core monday.com capabilities to agents. It enables actions like searching boards, creating and updating items and columns, assigning owners, setting timelines, and posting updates - supporting a wide range of work management use cases across teams and departments.": "monday MCP 服务器把 monday.com 的核心能力开放给 agent。它支持搜索看板、创建和更新条目与列、指派负责人、设置时间线、发布更新等操作——覆盖跨团队和部门的广泛工作管理场景。",
    "Manage issues, projects, and team workflows in Linear with natural language. Create and update issues, track progress, plan cycles, and coordinate development tasks using Linear’s streamlined project management interface for faster, more efficient workflows.": "用自然语言在 Linear 中管理 issue、项目和团队工作流。借助 Linear 精简的项目管理界面创建和更新 issue、跟踪进度、规划周期、协调开发任务，让工作流更快、更高效。",
    "Connect Claude to Miro to summarize existing boards or build new ones from scratch. Run sharper workshops, sprint planning, and product strategy sessions with Claude-generated layouts, frames, sticky notes, images, docs, diagrams, tables, and more.\n\nKey use cases:\n\n• Summarize and search boards: Drop a board URL into Claude to pull out themes, decisions, and open questions from retros, planning sessions, and strategy maps. Search across every board you have access to.\n• Build new boards from scratch: Generate ready-to-run layouts for retros, sprint planning, and product strategy with frames, sticky notes, cards, tables, docs, and images.\n• Bring research onto the canvas: Have Claude research a topic — competitors, user feedback, market trends, prior art — and lay the findings out on a fresh board as diagrams, sticky notes, tables, docs, and images, ready to share with your team.\n• Visualize complex ideas: Turn a prompt, PR, or spec into architecture, sequence-flow, ERD, or user-journey diagrams directly on the canvas.\n• Act on feedback agentically: Read and resolve comments, reply in-thread, and convert scattered team discussion into a clear list of action items right on the board.": "把 Claude 连接到 Miro，总结现有看板或从零搭建新看板。用 Claude 生成的布局、框架、便签、图片、文档、图表、表格等，把工作坊、冲刺规划和产品策略会开得更犀利。\n\n主要用例：\n\n• 总结并搜索看板：把看板 URL 丢给 Claude，从复盘、规划会和策略图中提炼主题、决策和待解问题。可跨你有权限的所有看板搜索。\n• 从零搭建新看板：为复盘、冲刺规划和产品策略生成开箱即用的布局，含框架、便签、卡片、表格、文档和图片。\n• 把调研搬上画布：让 Claude 调研某个主题——竞品、用户反馈、市场趋势、既有成果——并把结果以图表、便签、表格、文档和图片的形式铺在一块新看板上，随时与团队分享。\n• 可视化复杂想法：直接在画布上把提示词、PR 或规格变成架构图、时序流程图、ERD 或用户旅程图。\n• 以 agent 方式处理反馈：阅读并解决评论、在会话内回复，把零散的团队讨论整理成看板上清晰的行动项清单。",
    "The Zoom for Claude connector allows users to search their Zoom meetings using natural language, retrieve meeting assets such as AI summaries, docs, recordings, and whiteboards, and access recording-specific resources including transcripts, summaries, next steps, and playback links. Users can ask questions to quickly locate the exact moment a topic was discussed in a meeting recording, generate agendas, capture notes, identify action items, and follow up using the transcript, summary, and shared materials.": "Zoom for Claude 连接器让用户用自然语言搜索自己的 Zoom 会议，获取 AI 摘要、文档、录制和白板等会议资料，并访问录制专属资源，包括转写、摘要、下一步和回放链接。用户可以提问以快速定位会议录制中某个话题被讨论的确切时刻，生成议程、记录笔记、识别行动项，并借助转写、摘要和共享材料进行跟进。",
    "Search, edit and get insights on your Box content": "搜索、编辑你的 Box 内容并从中获取洞察",
    "Connect Claude to your content stored in Box. Enable Claude to search and access files, use AI to query documents, create or update content, extract metadata fields, and more, while enforcing existing Box security and access policies.": "把 Claude 连接到你存在 Box 里的内容。让 Claude 搜索并访问文件、用 AI 查询文档、创建或更新内容、提取元数据字段等，同时执行 Box 现有的安全和访问策略。",
    "Adobe for creativity brings Photoshop, Lightroom, Illustrator, Firefly, Premiere, Express, InDesign, and Stock capabilities directly into Claude. Create, edit, and design with natural language, without switching apps. Edit multiple photos, create assets, and refine video for polished results. Sign in with your Adobe account for higher usage limits and saved work across sessions.\nKey capabilities:\n• Edit and transform images: Adjust color and lighting, remove/blur backgrounds, and expand or crop images.\n• Create and animate assets: Start from a template, trim video, and license stock.\n• Search, organize, and summarize: Find assets, summarize content, and manage files.": "Adobe for creativity 把 Photoshop、Lightroom、Illustrator、Firefly、Premiere、Express、InDesign 和 Stock 的能力直接带入 Claude。用自然语言创作、编辑和设计，无需切换应用。批量修图、创建素材、精修视频，产出精致成品。用你的 Adobe 账户登录可获得更高用量上限并跨会话保存作品。\n主要能力：\n• 编辑和变换图像：调整色彩和光线、移除/虚化背景、扩展或裁剪图像。\n• 创建并动画化素材：从模板开始、剪辑视频、授权使用 stock 素材。\n• 搜索、整理和总结：查找素材、总结内容、管理文件。",
    "The Intercom MCP Server gives your AI tools access to customer data—conversations, tickets, and user data. This lets teams across your business, not just support, use that data in their workflows: from spotting bugs and shaping the product roadmap to refining messaging and preparing for QBRs. Every team can act with clearer visibility into what customers need.": "Intercom MCP 服务器让你的 AI 工具能访问客户数据——对话、工单和用户数据。这让业务中的各个团队（不只是客服）都能在工作流中用上这些数据：从发现 bug、塑造产品路线图，到打磨话术、准备 QBR。每个团队都能更清楚地看到客户需要什么，并据此行动。",
    "Access Asana’s Work Graph directly from Claude to search, create, update, and track tasks, projects, and goals. Coordinate work across teams while connecting AI insights to real deliverables. Complements your Asana workspace with 30+ tools for seamless work management alongside your team’s existing workflows.": "直接从 Claude 访问 Asana 的 Work Graph，搜索、创建、更新并跟踪任务、项目和目标。跨团队协调工作，同时把 AI 洞察连接到真实交付物。用 30+ 工具补足你的 Asana 工作区，与团队现有工作流无缝配合。",
    "Yale's harmonized US public health surveillance data": "耶鲁整合的美国公共卫生监测数据",
    "PopHIVE provides harmonized US public health surveillance data from the Yale School of Public Health. Ask about respiratory disease activity (RSV, flu, COVID, measles), chronic disease prevalence (diabetes, obesity), injury trends (overdose, firearm, heat illness), and childhood vaccination coverage across US states and counties. Signals are synthesized from CDC systems, Epic Cosmos, wastewater monitoring, Google Health Trends, and more. Every level, trend, rank, and correlation is computed server-side with full provenance, caveats, and a deep link to the matching pophive.org chart. All data is public, aggregate, and de-identified.": "PopHIVE 提供来自耶鲁公共卫生学院的整合美国公共卫生监测数据。可查询呼吸道疾病活动（RSV、流感、COVID、麻疹）、慢性病患病率（糖尿病、肥胖）、伤害趋势（用药过量、枪支、热病）以及全美各州各县的儿童疫苗接种率。信号综合自 CDC 系统、Epic Cosmos、废水监测、Google Health Trends 等。每一个水平值、趋势、排名和相关性都在服务端计算，附完整溯源、注意事项，以及指向对应 pophive.org 图表的深链。所有数据均为公开、聚合、去标识化的。",
    "Design antibiotics and prioritise vaccine targets against drug-resistant pathogens using EDEN, Basecamp Research's biological foundation model.": "用 Basecamp Research 的生物基础模型 EDEN 设计抗生素、优先筛选针对耐药病原体的疫苗靶点。",
    "EDEN is Basecamp Research's frontier biological foundation model, trained on BaseData — the\nworld's largest biological dataset, encompassing over 10 billion novel genes from more than a million species collected across 200+ sampling expeditions in 30+ countries.\nThis connector gives Claude access to two EDEN capabilities:\n\nAntibiotic design (EDEN-AMP): Generate novel antimicrobial peptide candidates with predicted\npotency against 11 drug-resistant bacterial strains, including MRSA, Acinetobacter baumannii, and Pseudomonas aeruginosa. 97% of EDEN-designed AMPs are active in the lab; one candidate showed efficacy in mice comparable to last-resort antibiotics.\n\nVaccine target prioritisation (EDEN-Immunogenicity): Predict the probability that a protein-coding antigen will trigger an immune response, using EDEN embeddings with AUROC 0.85 on external validation data. Reduces weeks of empirical target selection to a single workflow. Every BaseData sequence is collected under informed-consent and benefit-sharing agreements, with each sequence traceable to country-specific collection permits. For research use only.": "EDEN 是 Basecamp Research 的前沿生物基础模型，基于 BaseData 训练——\n全球最大的生物数据集，涵盖来自 30+ 个国家、200+ 次采样考察、超过一百万个物种的 100 亿+ 个新基因。\n本连接器让 Claude 能使用 EDEN 的两项能力：\n\n抗生素设计（EDEN-AMP）：生成新型抗菌肽候选物，预测其对 11 种耐药细菌株（含 MRSA、鲍曼不动杆菌、铜绿假单胞菌）的效力。97% 的 EDEN 设计抗菌肽在实验室中具有活性；其中一个候选物在小鼠体内显示出与最后一线抗生素相当的疗效。\n\n疫苗靶点优先级排序（EDEN-Immunogenicity）：预测某个蛋白编码抗原触发免疫反应的概率，使用 EDEN 嵌入，在外部验证数据上 AUROC 达 0.85。把数周的经验性靶点筛选压缩为单个工作流。每条 BaseData 序列都在知情同意和惠益分享协议下采集，每条序列可追溯到具体国家的采集许可。仅供研究使用。",
    "Query human genomics & longitudinal clinical data": "查询人类基因组学与纵向临床数据",
    "Bring Helix GenoSphere™ — a growing research clinico-genomic dataset of more than 500,000 exome-sequenced participants with linked longitudinal EHR data — directly into Claude. Query gene-level carrier counts and pathogenic variants, determine target genes on curated panels, search standardized medical vocabularies (conditions, drugs, labs), and obtain privacy-protected patient counts for any concept. All responses are aggregated and statistically de-identified, with small groups suppressed to protect participant privacy. A read-only window into population-scale genomics, no SQL required.": "把 Helix GenoSphere™——一个不断扩充的临床基因组研究数据集，含超过 50 万名经外显子测序、并链接了纵向 EHR 数据的参与者——直接带入 Claude。查询基因级携带者计数和致病变异、在精选基因组上确定目标基因、检索标准化医学词表（病症、药物、化验），并获取任意概念的隐私保护患者计数。所有响应均为聚合且统计去标识化的，小样本组会被抑制以保护参与者隐私。一个只读的、面向人群规模基因组学的窗口，无需 SQL。",
    "Simplify your workflow by using Claude to generate foundational Lucidchart diagrams directly from your conversation. Beyond seamless diagram creation, this integration acts as a digital bridge, allowing you to instantly search, retrieve, share, and summarize your existing Lucid documents right within Claude. Whether you are jumpstarting a new process map or extracting insights from complex boards, you can now eliminate the bottleneck of context-switching and provide your AI with the visual context it needs to accelerate your work.": "用 Claude 直接从对话中生成基础的 Lucidchart 图表，简化你的工作流。除了顺畅地创建图表，这个集成还像一座数字桥梁，让你在 Claude 内即时搜索、检索、分享并总结你现有的 Lucid 文档。无论是启动一张新的流程图，还是从复杂看板中提炼洞察，你现在都能消除来回切换的瓶颈，为你的 AI 提供加速工作所需的视觉上下文。",
    "The Microsoft Learn MCP Server enables clients like GitHub Copilot and other AI agents to bring trusted and up-to-date information directly from Microsoft's official documentation. It is a remote MCP server that uses streamable http. It allows to search through documentation, fetch a complete article, and search through code samples.": "Microsoft Learn MCP 服务器让 GitHub Copilot 等客户端和其他 AI agent 能直接从微软官方文档获取可信、最新的信息。它是一个使用 streamable http 的远程 MCP 服务器，支持搜索文档、获取完整文章、检索代码示例。",
    "Connect Claude to your meeting history. Ask questions about your work and use your conversation context to get things done.": "把 Claude 连接到你的会议历史。就你的工作提问，用你的对话上下文把事情办成。",
    "Search, organize, and take action on your Dropbox content": "搜索、整理你的 Dropbox 内容并对其采取操作",
    "The Dropbox connector for Claude connects your Dropbox files directly to Claude, so you can search, organize, save generated content, and create sharing links without switching tools. It respects your existing Dropbox permissions, and Claude only works with files you already have access to.": "面向 Claude 的 Dropbox 连接器把你的 Dropbox 文件直接接入 Claude，让你无需切换工具就能搜索、整理、保存生成的内容并创建分享链接。它尊重你现有的 Dropbox 权限，Claude 只处理你本就有权访问的文件。",
    "State-of-the-art ADMET prediction models for drug discovery": "面向药物发现的顶尖 ADMET 预测模型",
    "Query Insider One CDP and APIs using natural language": "用自然语言查询 Insider One CDP 和 API",
    "Check balances, view orders, analyze markets, and backtest trading strategies on Revolut X. All through natural language in Claude.": "在 Revolut X 上查看余额、订单，分析行情并回测交易策略——全部通过 Claude 用自然语言完成。",
    "Securely connect AI assistants to your Kiteworks instance for file, folder, and search operations": "将 AI 助手安全连接到你的 Kiteworks 实例，进行文件、文件夹和搜索操作",
    "Let Claude access your filesystem to read and write files.": "让 Claude 访问你的文件系统，读写文件。",
    "Provides access to PubMed's biomedical citations and PubMed Central's full-text archive. Search articles, retrieve metadata and abstracts, access full-text content (when available in PMC), find related research, and more.": "提供对 PubMed 生物医学文献引用和 PubMed Central 全文库的访问。搜索文章、获取元数据和摘要、访问全文内容（PMC 中可用时）、查找相关研究等。",
    "Predict molecular structures and binding interactions, screen libraries, and design binders with the Boltz API.": "用 Boltz API 预测分子结构和结合作用、筛选化合物库并设计结合分子。",
    "The official Model Context Protocol (MCP) server for the Boltz API. Predict molecular structures and binding interactions, screen small-molecule and protein libraries against a target, and design small molecules and protein binders — all from chat. Each workflow estimates cost before running, then downloads structured results to your workspace when the job completes.": "Boltz API 的官方 Model Context Protocol (MCP) 服务器。预测分子结构和结合作用、针对某个靶点筛选小分子和蛋白质库、设计小分子和蛋白质结合物——全部在对话中完成。每个工作流运行前会预估成本，任务完成后把结构化结果下载到你的工作区。",
    "Simplify contract management with intelligent automation powered by Docusign. Go beyond simple execution to make complex agreement workflows effortless. Use natural language to connect with your agreement data, instantly surface insights like renewal dates and key obligations, and create automated workflows that keep your business moving faster and with less friction.": "用 Docusign 的智能自动化简化合同管理。超越简单的签署执行，让复杂的协议工作流变得轻松。用自然语言连接你的协议数据，即时呈现续约日期、关键义务等洞察，并创建自动化工作流，让你的业务更快、更省心地推进。",
    "Compare hotels and find the lowest rate": "比较酒店，找到最低价",
    "Find hotel deals on Super.com, right inside Claude. Ask for the cheapest room at a specific hotel, or compare prices across an entire city to find the best value. Results include hotel ratings, amenities, photos, and a direct booking link, so you can compare options and book with confidence on Super.com.": "在 Claude 里直接找 Super.com 的酒店优惠。可以问某家酒店的最低房价，或比较整座城市的价格找到最超值的。结果包含酒店评分、设施、照片和直接预订链接，让你放心地比价并在 Super.com 上下单。",
    "Vercel MCP is Vercel’s official MCP server, allowing you to search and navigate documentation, manage projects and deployments, and analyze deployment logs—all in one place.": "Vercel MCP 是 Vercel 的官方 MCP 服务器，让你在一处搜索并浏览文档、管理项目和部署、分析部署日志。",
    "Real-time oil, gas & commodity prices. 26 tools: spot, history, futures, alerts, market briefs.": "实时油、气及大宗商品价格。26 个工具：现货、历史、期货、提醒、市场简报。",
    "The energy commodity MCP server. Live spot prices for Brent, WTI, natural gas, diesel, gasoline and 70+ commodities, plus historical data, futures curves, refining spreads, rig counts, OPEC production, price alerts and multi-commodity market briefs. Works instantly in demo mode (no API key) with a limited commodity set; a free API key from oilpriceapi.com unlocks everything.": "能源大宗商品 MCP 服务器。提供 Brent、WTI、天然气、柴油、汽油等 70+ 种大宗商品的实时现货价格，外加历史数据、期货曲线、炼油价差、钻机数、OPEC 产量、价格提醒和多商品市场简报。演示模式（无需 API 密钥）即可即时使用有限的商品集；从 oilpriceapi.com 获取免费 API 密钥可解锁全部。",
    "Search knowledge across your apps and execute real-world actions by connecting Claude with the 8,000 apps on Zapier. Run workflows like sending emails, updating CRMs, scheduling meetings, and more, all within Claude.": "把 Claude 与 Zapier 上的 8000 款应用连接起来，跨应用搜索知识并执行真实世界的操作。在 Claude 内运行发送邮件、更新 CRM、安排会议等各种工作流。",
    "Bring operational data and context into the flow of your Claude conversations. You can ask questions, create and update records, and analyze your data—all through conversation. Use the data in Airtable as input to the work you're doing in Claude, like building a landing page using content you've organized in Airtable. Make quick updates to Airtable without leaving the chat. Airtable for Claude is ideal anytime you need quick access to structured internal data to inform your conversation.": "把运营数据和上下文带入你的 Claude 对话流。你可以提问、创建和更新记录、分析数据——全部通过对话完成。把 Airtable 里的数据作为你在 Claude 中工作的输入，比如用你在 Airtable 整理好的内容搭建一个落地页。无需离开对话就能快速更新 Airtable。每当你需要快速访问结构化的内部数据来支撑对话时，Airtable for Claude 都是理想之选。",
    "Search, analyze, and act on your recruiting data": "搜索、分析你的招聘数据并对其采取操作",
    "Connect Ashby to Claude to get instant access to your ATS data including pipeline, candidate profiles, open roles, and applications. Ask questions, dig into hiring data, and take action by adding notes, moving stages, or sending emails directly from the conversation. Ashby connects Claude to your live recruiting data through secure user-level OAuth. Every request and action respects your existing permissions and your data stays protected.": "把 Ashby 连接到 Claude，即时访问你的 ATS 数据，包括流程管道、候选人档案、开放职位和申请。提问、深挖招聘数据，并直接在对话中添加备注、推进阶段或发邮件采取行动。Ashby 通过安全的用户级 OAuth 把 Claude 连接到你的实时招聘数据。每一次请求和操作都尊重你现有的权限，你的数据始终受保护。",
    "Read and write Conviso Platform data (companies, projects, issues, assets, tickets, requirements, applications, scans, supply chain, AI-pentest, threat modeling) from MCP clients.": "从 MCP 客户端读写 Conviso 平台数据（公司、项目、issue、资产、工单、需求、应用、扫描、供应链、AI 渗透测试、威胁建模）。",
    "This MCP server exposes the Conviso Platform to MCP clients. It provides read tools for companies, projects, issues, assets, tickets, requirements, applications, scan histories, SBOM/supply-chain components, AI-pentest artifacts/executions and threat-model artifacts, plus write tools: a generic allowlisted mutation engine (list/describe/execute) and curated shortcuts for the most common writes (change issue status, create vulnerabilities/projects/assets/tickets, run DAST, trigger AI-pentest).": "这个 MCP 服务器把 Conviso 平台开放给 MCP 客户端。它提供对公司、项目、issue、资产、工单、需求、应用、扫描历史、SBOM/供应链组件、AI 渗透测试制品/执行和威胁模型制品的读取工具，外加写入工具：一个通用的允许列表变更引擎（list/describe/execute）和针对最常见写入的精选快捷方式（更改 issue 状态、创建漏洞/项目/资产/工单、运行 DAST、触发 AI 渗透测试）。",
    "Transform ideas into presentations, documents, social media posts, and websites directly from Claude. Gamma generates beautifully designed content from prompts or notes, with smart layouts, customizable themes, and AI visuals. Work in 60+ languages, control tone and detail level, and export to PDF or PPTX — all without leaving your workflow in Claude.": "直接从 Claude 把想法变成演示文稿、文档、社交媒体帖子和网站。Gamma 从提示词或笔记生成设计精美的内容，带智能布局、可定制主题和 AI 视觉。支持 60+ 种语言，可控制语气和详略程度，导出为 PDF 或 PPTX——全程不用离开你在 Claude 的工作流。",
    "Manage Supabase projects directly through Claude. Execute SQL queries on PostgreSQL databases, design and modify table schemas, deploy serverless edge functions, and configure user authentication. Access real-time logs for debugging, generate TypeScript types for your schema, create and apply database migrations, and manage development branches through natural language commands.": "直接通过 Claude 管理 Supabase 项目。在 PostgreSQL 数据库上执行 SQL 查询、设计和修改表结构、部署无服务器 edge function、配置用户身份验证。访问实时日志调试、为你的 schema 生成 TypeScript 类型、创建并应用数据库迁移，并通过自然语言命令管理开发分支。",
    "Analyze data and launch bioinformatics workflows": "分析数据并启动生物信息学工作流",
    "The Latch MCP lets you connect Latch to Claude, allowing you to browse data, start bioinformatics workflows and monitor workflow executions. Run serverless bioinformatics pipelines written in Nextflow or Python without leaving Claude.": "Latch MCP 让你把 Latch 连接到 Claude，浏览数据、启动生物信息学工作流并监控工作流执行。无需离开 Claude 即可运行用 Nextflow 或 Python 编写的无服务器生物信息学流水线。",
    "Biomni Lab by Phylo — the Integrated Biology Environment for AI-native research": "Phylo 出品的 Biomni Lab——面向 AI 原生研究的集成生物学环境",
    "Biomni Lab is the first Integrated Biology Environment (IBE), a unified workspace where biologists collaborate with AI agents to execute complex research with rigor and at scale. Built by Phylo, an applied research lab dedicated to studying agentic intelligence for biomedical discovery, Biomni Lab combines large language models with specialized bioinformatics tools, curated databases (UniProt, NCBI, ClinVar, Ensembl), and cloud compute (CPU and GPU) in a single platform. This MCP connector exposes Biomni Lab's core capabilities: starting and managing research tasks, streaming agent output in real time, uploading and managing project files, and retrieving analysis results. Every task is reproducible with full code, transparent reasoning, and clear references. Phylo is ISO 27001 certified and SOC 2 Type 2 compliant.": "Biomni Lab 是首个集成生物学环境（IBE），一个让生物学家与 AI agent 协作、严谨且大规模开展复杂研究的统一工作空间。它由 Phylo 打造——一个专注于研究面向生物医学发现的 agent 智能的应用研究实验室。Biomni Lab 在单一平台中把大语言模型与专业生物信息学工具、精选数据库（UniProt、NCBI、ClinVar、Ensembl）以及云计算（CPU 和 GPU）结合起来。这个 MCP 连接器开放 Biomni Lab 的核心能力：启动和管理研究任务、实时流式输出 agent 结果、上传和管理项目文件、检索分析结果。每个任务都可复现，附完整代码、透明推理和清晰引用。Phylo 已通过 ISO 27001 认证和 SOC 2 Type 2 合规。",
    "Manage your WorkOS workspace from Claude": "在 Claude 中管理你的 WorkOS 工作区",
    "Manage Ultipa Cloud instances and run GQL graph queries, algorithms, backups, and metrics from Claude.": "在 Claude 中管理 Ultipa Cloud 实例，运行 GQL 图查询、算法、备份和指标。",
    "Model Context Protocol server for Ultipa Cloud and any self-managed Ultipa GQLDB instance. Provision and operate instances, run GQL queries and graph algorithms, manage backups and firewall rules, and view metrics and billing — all through natural language.": "面向 Ultipa Cloud 和任意自管理 Ultipa GQLDB 实例的 Model Context Protocol 服务器。预配和运维实例、运行 GQL 查询和图算法、管理备份和防火墙规则、查看指标和账单——全部通过自然语言。",
    "MCP Server": "MCP 服务器",
    "Backlog MCP Server connects Claude to Nulab's Backlog — a project management, issue tracking, and Git/SVN platform used by teams worldwide. Manage projects, issues, comments, wikis, and version-control activity directly from your conversations.": "Backlog MCP 服务器把 Claude 连接到 Nulab 的 Backlog——一个全球团队使用的项目管理、问题跟踪和 Git/SVN 平台。直接从对话中管理项目、issue、评论、wiki 和版本控制活动。",
    "Explore a new way to discover music and podcasts, with recommendations that are uniquely you. Want music to power your next run, study session, or party? Just ask and Spotify will drop the right songs, artists or playlists into your conversation. With Spotify in Claude you can; Ask for songs, artists, albums, or playlists and play them in Spotify. Find podcasts for any topic you are exploring. Spotify Premium listeners can describe a vibe and get a personalized playlist made to match. Easily see where Spotify is playing and switch devices to keep listening wherever you are.": "探索发现音乐和播客的全新方式，推荐独属于你。想要音乐为你的下一次跑步、学习或派对助兴？只管开口，Spotify 就会把合适的歌曲、艺人或歌单丢进你的对话。在 Claude 里用 Spotify，你可以：点歌曲、艺人、专辑或歌单并在 Spotify 播放。为你正在探索的任何主题找播客。Spotify Premium 用户可以描述一种氛围，获得为之量身定制的个性化歌单。轻松查看 Spotify 正在哪台设备播放，并切换设备随处续听。",
    "Access the ChEMBL Database": "访问 ChEMBL 数据库",
    "The ChEMBL Connector gives Claude access to the ChEMBL Database, a manually curated resource of bioactive drug-like compounds with quantitative binding and functional data against biological targets.": "ChEMBL 连接器让 Claude 能访问 ChEMBL 数据库——一个人工精选的生物活性类药化合物资源，含针对生物靶点的定量结合和功能数据。",
    "Access bioRxiv and medRxiv preprint data": "访问 bioRxiv 和 medRxiv 预印本数据",
    "The bioRxiv Connector gives Claude access to bioRxiv and medRxiv preprint servers, hosting research papers in biological and medical sciences posted before peer review.": "bioRxiv 连接器让 Claude 能访问 bioRxiv 和 medRxiv 预印本服务器，上面托管着同行评审前发布的生物和医学领域研究论文。",
    "Access ClinicalTrials.gov data": "访问 ClinicalTrials.gov 数据",
    "The Clinical Trials Connector gives Claude access to ClinicalTrials.gov, the NIH/NLM registry of FDA-regulated clinical studies conducted worldwide.": "Clinical Trials 连接器让 Claude 能访问 ClinicalTrials.gov——NIH/NLM 维护的全球 FDA 监管临床研究登记库。",
    "Verify scams from web & email": "核查来自网页和邮件的诈骗",
    "Stay protected while you chat with Claude. Norton brings real-time, AI-powered scam detection directly into your conversations, backed by the Norton Genie AI assistant. Share suspicious emails, texts, messages, images, or links for instant analysis and clear cyber safety guidance to help you avoid phishing, scams, and malicious content before you click. You can also ask everyday questions about security, privacy, identity protection, and device performance, and get trusted answers right where you’re already chatting.": "在你与 Claude 对话时保持防护。Norton 把实时、AI 驱动的诈骗检测直接带入你的对话，背后是 Norton Genie AI 助手。分享可疑的邮件、短信、消息、图片或链接即可即时分析，并给出清晰的网络安全指引，帮你在点击前避开钓鱼、诈骗和恶意内容。你也可以随口问安全、隐私、身份保护和设备性能方面的日常问题，在你已经在聊天的地方直接获得可信答案。",
    "Search and retrieve job listings, access detailed job descriptions and requirements, and provide direct job links to users. This integration streamlines the job search process by bringing Indeed's extensive job database and company information directly into Claude conversations, enabling seamless career exploration, job searching, and employment research capabilities.": "搜索并获取职位列表、访问详细的职位描述和要求，并向用户提供直接的职位链接。这个集成把 Indeed 庞大的职位数据库和公司信息直接带入 Claude 对话，简化求职流程，实现顺畅的职业探索、职位搜索和就业研究。",
    "SEO, competitor research, and traffic analysis": "SEO、竞品调研和流量分析",
    "Semrush data helps you plan and improve SEO, uncover competitor strategies, find keyword opportunities, research backlinks, audit websites, and reveal paid tactics.": "Semrush 数据帮你规划并改进 SEO、洞察竞品策略、发现关键词机会、研究反向链接、审计网站，并揭示付费打法。",
    "Access Sentry Issue and Error details, create projects and query for project information, trigger Seer Issue Fix run to generate root cause analysis, and retrieve solutions. Access Sentry context to debug applications faster.": "访问 Sentry 的 Issue 和错误详情、创建项目并查询项目信息、触发 Seer Issue Fix 运行以生成根因分析并获取解决方案。借助 Sentry 上下文更快地调试应用。",
    "Turn natural language into data insights. Analyze BI data, visualize trends, and answer complex business questions using Zoho Analytics": "把自然语言变成数据洞察。用 Zoho Analytics 分析 BI 数据、可视化趋势并解答复杂的业务问题",
    "The Zoho Analytics MCP Server (Beta) implements the Model Context Protocol (MCP), a standardized interface that enables AI models to interact seamlessly with applications. This middleware solution bridges the connection between AI agents and Zoho Analytics, providing powerful data analysis capabilities through a unified interface.": "Zoho Analytics MCP 服务器（Beta）实现了 Model Context Protocol (MCP)——一个让 AI 模型与应用无缝交互的标准化接口。这个中间件方案架起 AI agent 与 Zoho Analytics 之间的桥梁，通过统一接口提供强大的数据分析能力。",
    "A flexible and scalable way to connect Claude to NetSuite and use AI to query and analyze NetSuite data.": "一种灵活、可扩展的方式，把 Claude 连接到 NetSuite，用 AI 查询和分析 NetSuite 数据。",
    "Access ZoomInfo's GTM intelligence to ground your AI workflows with verified B2B data. Search companies and identify key stakeholders with natural language. Enrich with 300+ data points, build targeted account lists, and drive momentum from first touch to renewal.": "访问 ZoomInfo 的 GTM 情报，用经核实的 B2B 数据为你的 AI 工作流打底。用自然语言搜索公司并识别关键决策人。用 300+ 数据点做数据丰富、构建目标客户名单，从首次触达到续约一路推进。",
    "Search and analyze scientific papers": "搜索并分析科研论文",
    "Access a corpus of over 125 million academic papers. Search for relevant literature using natural language queries, create structured reports that extract and synthesize data across papers, and retrieve detailed report results — all programmatically. Built for life sciences R&D workflows, the server enables agents to rapidly survey evidence, compare findings across studies, and surface key data points without manual literature review, accelerating everything from target discovery to systematic evidence assessment.": "访问超过 1.25 亿篇学术论文的语料库。用自然语言查询搜索相关文献，创建结构化报告以跨论文提取并综合数据，并以编程方式检索详细的报告结果。它面向生命科学研发工作流打造，让 agent 能快速梳理证据、跨研究比较发现、呈现关键数据点，无需手动查阅文献，从靶点发现到系统性证据评估全面提速。",
    "Add real-time chat, voice, and video to your app.": "为你的应用加入实时聊天、语音和视频。",
    "Add real-time chat, voice, video, and moderation to your app directly through Claude. Search CometChat's documentation, fetch any reference page, and pull complete implementation bundles for React, Flutter, iOS, Android, React Native, the JavaScript SDK, the no-code widget, moderation, multi-tenant SaaS chat, and presence — each bundle is a ready-to-run recipe so Claude gets the integration right on the first try. Read-only and no account required. Free for your first 100 monthly active users.": "直接通过 Claude 为你的应用加入实时聊天、语音、视频和内容审核。搜索 CometChat 文档、获取任意参考页，并拉取 React、Flutter、iOS、Android、React Native、JavaScript SDK、无代码组件、审核、多租户 SaaS 聊天和在线状态的完整实现套件——每个套件都是开箱即用的配方，让 Claude 一次就把集成做对。只读、无需账户。前 100 名月活用户免费。",
    "Extract data from any website with thousands of scrapers, crawlers, and automations on Apify Store.": "用 Apify Store 上数千款抓取器、爬虫和自动化工具，从任意网站提取数据。",
    "Apify is the world's largest marketplace of tools for web scraping, crawling, data extraction, and web automation. Get structured data from social media, e-commerce, search engines, maps, travel sites, or any other website.": "Apify 是全球最大的网页抓取、爬取、数据提取和网页自动化工具市场。从社交媒体、电商、搜索引擎、地图、旅行网站或任意其他网站获取结构化数据。",
    "Build, iterate, inspect, and deploy Lovable apps": "构建、迭代、检查并部署 Lovable 应用",
    "Lovable MCP Server lets you create, iterate on, inspect, and deploy Lovable projects.": "Lovable MCP 服务器让你创建、迭代、检查并部署 Lovable 项目。",
    "Provide real-time geospatial context from TomTom - including maps, routing, search geocoding and traffic.": "提供来自 TomTom 的实时地理空间上下文——包括地图、路线规划、搜索地理编码和交通路况。",
    "The TomTom Maps MCP Server simplifies geospatial development by providing seamless access to TomTom's location services, including search, routing, traffic, and dynamic map rendering with native modules bundled.": "TomTom Maps MCP 服务器通过无缝访问 TomTom 的位置服务（含搜索、路线规划、交通和动态地图渲染，并捆绑原生模块）来简化地理空间开发。",
    "With Postman's MCP server, you can prompt AI to automate work across your Postman collections, environments, workspaces, and more.": "有了 Postman 的 MCP 服务器，你可以让 AI 跨你的 Postman 集合、环境、工作区等自动化处理工作。",
    "Connect Apollo to Claude so you can prospect and take action from a single conversation. Search Apollo's database to find the right people and companies, then enrich records to reveal verified contact details when you're ready. Create or update contacts, and add or remove contacts from existing sequences to keep outbound moving.": "把 Apollo 连接到 Claude，让你在一次对话中就能开发潜客并采取行动。搜索 Apollo 数据库找到合适的人和公司，准备好后再做数据丰富、揭示经核实的联系方式。创建或更新联系人，把联系人加入或移出现有的序列，让外呼持续推进。",
    "Get feedback on anything you build in Claude.": "为你在 Claude 里构建的任何东西获取反馈。",
    "Build something in Claude. Get feedback in seconds. Say \"add dot. feedback to my artifact\" and Claude creates a shareable review link — anyone can click anywhere on the page to leave pinned comments. No deploy, no signup for reviewers, no switching tabs. Works with Claude artifacts, Vercel previews, Lovable, v0, or any URL. You can also ask Claude to check your feedback or list your projects without leaving the conversation.": "在 Claude 里做点东西，几秒就能拿到反馈。说「给我的 artifact 加上 dot. 反馈」，Claude 就会生成一个可分享的评审链接——任何人都能点页面上任意位置留下钉住的评论。无需部署、评审者无需注册、不用切标签页。适用于 Claude artifact、Vercel 预览、Lovable、v0 或任意 URL。你也可以让 Claude 查看你的反馈或列出你的项目，全程不离开对话。",
    "The official Excalidraw MCP app allowing you to build interactive visual applications right in Claude. Ask Claude to create hand-drawn style diagrams using Excalidraw with smooth viewport camera control and interactive fullscreen editing.": "官方 Excalidraw MCP 应用，让你直接在 Claude 里构建交互式视觉应用。让 Claude 用 Excalidraw 创建手绘风格的图表，带平滑的视口镜头控制和交互式全屏编辑。",
    "Explore and debug your Coralogix observability data": "探索并调试你的 Coralogix 可观测性数据",
    "Bring Coralogix into your AI workflow. Enable Claude to work with your logs, metrics, and traces so you can explore and debug issues through natural language - run queries, inspect incidents and alert details, and ground answers in the data your team already relies on. Spend less time jumping between tools and more time understanding what your telemetry is telling you.": "把 Coralogix 带入你的 AI 工作流。让 Claude 处理你的日志、指标和追踪，让你通过自然语言探索和调试问题——运行查询、检查事件和告警详情，把答案扎根于你团队已经依赖的数据。少花时间在工具间跳转，多花时间理解你的遥测数据在告诉你什么。",
    "Make Smartsheet a native part of your AI workflow. Ask Claude to analyze project timelines, create graphs to summarize your sheet information, all through conversation. The Smartsheet connector eliminates manual data entry and repetitive updates, letting you focus on decisions while Claude handles the details. Transform how you manage projects with AI that understands your Smartsheet data and can act on it.": "让 Smartsheet 成为你 AI 工作流的原生一环。让 Claude 分析项目时间线、创建图表来总结你的表格信息，全部通过对话完成。Smartsheet 连接器免除手动录入和重复更新，让你专注决策，细节交给 Claude。用能读懂并能操作你 Smartsheet 数据的 AI，改变你管理项目的方式。",
    "Shopify for Claude makes store management as easy as having a conversation. Effortlessly connect your existing store and simply chat to add products, adjust inventory across locations, create discount codes, browse recent orders, view customer details, or pull analytics on your store's performance.": "Shopify for Claude 让店铺管理像聊天一样轻松。轻松连接你现有的店铺，直接聊天即可添加商品、跨门店调整库存、创建折扣码、浏览近期订单、查看客户详情，或拉取店铺业绩分析。",
    "Explore open data portals based on CKAN (dati.gov.it, data.gov, open.canada.ca, ...)": "探索基于 CKAN 的开放数据门户（dati.gov.it、data.gov、open.canada.ca 等）",
    "MCP server for interacting with CKAN-based open data portals. Provides tools for advanced dataset search with Solr syntax, DataStore queries for tabular data analysis, organization and group exploration, and complete metadata access.": "用于与基于 CKAN 的开放数据门户交互的 MCP 服务器。提供支持 Solr 语法的高级数据集搜索、用于表格数据分析的 DataStore 查询、组织和分组探索，以及完整的元数据访问。",
    "Build classroom activities, lessons, & more with Brisk": "用 Brisk 制作课堂活动、课程等",
    "The Brisk Teaching connector brings your classroom toolkit into Claude. Create interactive student activities, engaging podcasts, and more right in the tools you already use. Just describe what you need, and Brisk builds it in your account with easy-to-share links, so you can turn your ideas into classroom-ready materials in seconds. Edit, refine, and bring them to your students whenever you're ready.": "Brisk Teaching 连接器把你的课堂工具箱带入 Claude。在你已经在用的工具里直接创建互动学生活动、引人入胜的播客等。只需描述你的需求，Brisk 就会在你的账户里生成，并给出便于分享的链接，让你几秒钟就把想法变成课堂可用的材料。随时编辑、打磨，并在准备好时呈现给学生。",
    "See what AI agents are doing across your endpoint fleet": "查看 AI agent 在你的终端设备群中的活动",
    "See what AI agents are doing across your fleet — without leaving Claude. Origin Analytics connects Claude to your live endpoint telemetry through a typed analytics graph spanning endpoints, identities, sessions, prompts, and files. Ask in plain English which agents are running, who's using them, which prompts are being issued, and what files they're touching. Investigate suspicious sessions, audit AI usage for compliance, hunt shadow AI, or build adoption reports. Every answer comes from your real data — never inferred, never stale.": "无需离开 Claude 就能看到 AI agent 在你的设备群中的活动。Origin Analytics 通过一张覆盖端点、身份、会话、提示词和文件的类型化分析图，把 Claude 连接到你的实时端点遥测。用大白话就能问：哪些 agent 在运行、谁在用、发出了哪些提示词、碰了哪些文件。调查可疑会话、为合规审计 AI 使用、揪出影子 AI，或生成采用率报告。每个答案都来自你的真实数据——绝不推断、绝不过时。",
    "Make presentations and slides, export to PowerPoint": "制作演示文稿和幻灯片，导出为 PowerPoint",
    "Use SlidesGPT to generate presentations with AI. First, name a topic that the presentation should be about. SlidesGPT will generate your presentation slides. Finally you can export to PowerPoint. Available features include: generate a structure and outline for a presentation, choose layouts and themes, refine slide content in a chat-based conversation, export and download as PowerPoint, Google Slides, PDF, and more.": "用 SlidesGPT 借助 AI 生成演示文稿。先说出演示要讲的主题，SlidesGPT 会生成你的演示幻灯片，最后可导出为 PowerPoint。可用功能包括：为演示生成结构和大纲、选择布局和主题、在对话中打磨幻灯片内容、导出并下载为 PowerPoint、Google Slides、PDF 等。",
    "Generate and adapt SAP Fiori elements applications with AI coding assistants. Supports List Report, Object Page, and Flexible Column layouts.": "用 AI 编码助手生成和适配 SAP Fiori elements 应用。支持列表报表、对象页和弹性列布局。",
    "Prospect with Clay inside Claude: run deep company and contact research without leaving your conversation. Use Clay's contact databases, enrichment providers, and AI agents to research target accounts, surface verified, enriched contact info, and draft personalized outreach—all in Claude. Ask things like \"Find VP-level finance leaders at Okta who joined in the last 6 months,\" and Clay will return results directly in your chat.": "在 Claude 内用 Clay 开发潜客：不离开对话就能做深度的公司和联系人调研。用 Clay 的联系人数据库、数据丰富服务商和 AI agent 调研目标客户、呈现经核实且已丰富的联系方式，并起草个性化触达——全部在 Claude 里完成。比如问「找出过去 6 个月内加入 Okta 的 VP 级财务负责人」，Clay 就会把结果直接返回到你的对话中。",
    "The ClickUp connector enables secure, real-time interaction between AI agents like Claude and your ClickUp workspace. Unlock powerful AI-driven automation by connecting your favorite AI tools directly to ClickUp tasks, docs, Chat, and more.": "ClickUp 连接器让 Claude 等 AI agent 与你的 ClickUp 工作区安全、实时地交互。把你喜欢的 AI 工具直接接入 ClickUp 的任务、文档、Chat 等，解锁强大的 AI 驱动自动化。",
    "Check email addresses and domains for data breaches": "检查邮箱地址和域名是否发生过数据泄露",
    "Search email addresses and domains against the world's most widely used data breach corpus. Have I Been Pwned helps individuals determine whether their accounts have appeared in known breaches and enables organisations to investigate exposure across verified domains. Explore detailed breach information, identify exposed data types, review paste and stealer log exposure, and gain trusted security intelligence to better understand account compromise and cyber risk.": "在全球使用最广的数据泄露语料库中检索邮箱地址和域名。Have I Been Pwned 帮助个人判断自己的账户是否出现在已知泄露事件中，并让组织能在经核实的域名范围内排查暴露情况。查看详细的泄露信息、识别被暴露的数据类型、审查 paste 和窃取日志的暴露情况，获取可信的安全情报，更好地理解账户失陷和网络风险。",
    "Research keywords, analyze backlinks, track rankings, and monitor brand visibility across traditional search and AI platforms. Discover keyword opportunities, compare competitor performance, audit link profiles, and measure share of voice in LLM responses. Claude combines multiple Ahrefs analyses in a single conversation — asking clarifying questions, cross-referencing data points, and turning complex SEO metrics into actionable insights.": "研究关键词、分析反向链接、跟踪排名，并跨传统搜索和 AI 平台监控品牌可见度。发现关键词机会、比较竞品表现、审计链接画像，并衡量在 LLM 回答中的声量占比。Claude 在一次对话中综合多项 Ahrefs 分析——追问澄清、交叉比对数据点，把复杂的 SEO 指标变成可落地的洞察。",
    "Search, complete, and manage your tasks in Todoist": "在 Todoist 中搜索、完成和管理你的任务",
    "Allow Claude to assist you in managing your productivity and time blocking, by searching your current tasks, completing them, and general management of tasks in Todoist.": "让 Claude 通过搜索你当前的任务、完成任务以及在 Todoist 中对任务的一般管理，协助你管理效率和时间分块。",
    "Record, transcribe, search, and remember every meeting and voice memo. Privacy-first, local-only transcription with whisper.cpp.": "记录、转写、搜索并记住每一次会议和语音备忘。隐私优先，用 whisper.cpp 纯本地转写。",
    "MCP server for AI access to SmartBear tools, including BugSnag, PactFlow, QMetry, Reflect, Swagger and Zephyr.": "让 AI 访问 SmartBear 工具的 MCP 服务器，包括 BugSnag、PactFlow、QMetry、Reflect、Swagger 和 Zephyr。",
    "Connect Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads + 320 more": "连接 Meta Ads、Google Ads、TikTok Ads、LinkedIn Ads 等 320+ 数据源",
    "Analyze multi-channel marketing, analytics, sales, and e-commerce data within Claude by connecting to your Windsor.ai data flows: Query metrics from over 325 sources. Fetch and blend data from top platforms like Facebook, Google Ads, Instagram, Google Analytics 4, TikTok, Shopify, Salesforce, HubSpot, Google My Business, and LinkedIn into actionable intelligence for smarter, faster decision-making with accurate, up-to-date business information.": "连接你的 Windsor.ai 数据流，在 Claude 内分析多渠道营销、分析、销售和电商数据：从 325+ 个数据源查询指标。从 Facebook、Google Ads、Instagram、Google Analytics 4、TikTok、Shopify、Salesforce、HubSpot、Google My Business 和 LinkedIn 等顶级平台获取并融合数据，凭借准确、最新的业务信息，做出更聪明、更快的决策。",
    "Talk to your n8n instance directly from Claude - create and test automations, search and manage resources like workflows, data tables and projects": "直接从 Claude 与你的 n8n 实例对话——创建并测试自动化，搜索并管理工作流、数据表和项目等资源。",
    "Data from The Demographic and Health Surveys Program": "来自「人口与健康调查项目」的数据",
    "The Demographic and Health Surveys (DHS) Program spans more than 90 countries and 450+ nationally representative household surveys on population, health, and nutrition. This MCP enables AI tools to query the DHS Program's public aggregate-indicator API to answer questions on fertility, mortality, maternal and child health, nutrition, family planning, and more. Results can be disaggregated by sex, age, residence, and wealth. No individual-level survey records are exposed; microdata access remains governed by DHS's existing registration flow. All results include appropriate citation (survey, country, year).": "人口与健康调查（DHS）项目覆盖 90 多个国家、450+ 项具全国代表性的家庭调查，涉及人口、健康和营养。这个 MCP 让 AI 工具能查询 DHS 项目的公开聚合指标 API，解答关于生育、死亡、母婴健康、营养、计划生育等的问题。结果可按性别、年龄、居住地和财富分层。不暴露任何个体级调查记录；微观数据的访问仍受 DHS 现有注册流程管理。所有结果都附恰当引用（调查、国家、年份）。",
    "MCP server for interacting with Kubernetes clusters via kubectl": "通过 kubectl 与 Kubernetes 集群交互的 MCP 服务器",
    "Estimate your refund, and check what documents you need": "估算你的退税，并查看需要准备哪些材料",
    "Compare filing costs, estimate your refund, and check what documents you need.": "比较报税费用、估算你的退税，并查看你需要准备哪些材料。",
    "Easily find and fix security issues in your applications leveraging Snyk platform capabilities.": "借助 Snyk 平台能力，轻松发现并修复应用中的安全问题。",
    "Snowflake MCP server can be used to securely and easily retrieve both structured and unstructured data from your Snowflake account. You can use natural language to execute SQL queries, making analytics accessible to all including business users. With support for Cortex Agents, the Snowflake MCP server empowers teams to unlock deep insights from their data.": "Snowflake MCP 服务器可用于安全、便捷地从你的 Snowflake 账户检索结构化和非结构化数据。你可以用自然语言执行 SQL 查询，让业务用户等所有人都能做分析。借助对 Cortex Agents 的支持，Snowflake MCP 服务器让团队从数据中挖掘深度洞察。",
    "BigQuery: Advanced analytical insights for agents": "BigQuery：面向 agent 的高级分析洞察",
    "Integrate analytical data into your agent workflows to achieve superior business results. By connecting your agents with BigQuery, you can provide actionable insights directly to them. Move past standard analytics and utilize BigQuery's advanced features, such as forecasting, to generate higher-value intelligence.": "把分析数据整合进你的 agent 工作流，取得更卓越的业务成果。通过把 agent 与 BigQuery 连接，你可以直接为它们提供可落地的洞察。超越标准分析，利用 BigQuery 的高级功能（如预测）生成更高价值的智能。",
    "Build, explore, and automate on your local machine with access to files and terminal.": "在你的本地机器上构建、探索并自动化，可访问文件和终端。",
    "The Stripe Model Context Protocol server defines a set of tools that AI agents can use to interact with the Stripe API and search its knowledge base (including documentation and support articles).": "Stripe Model Context Protocol 服务器定义了一套工具，让 AI agent 能与 Stripe API 交互并检索其知识库（含文档和支持文章）。",
    "MCP server for interacting with the NotePlan app on macOS": "与 macOS 上 NotePlan 应用交互的 MCP 服务器",
    "Read, create, and edit notes and tasks in NotePlan. Manage calendar events and reminders via native macOS integration. Search across all notes with full-text and property filters. Control plugins, themes, and templates. Organize folders, spaces, and tags. All operations run locally on your device.": "在 NotePlan 中读取、创建和编辑笔记与任务。通过原生 macOS 集成管理日历事件和提醒。用全文和属性过滤器跨所有笔记搜索。控制插件、主题和模板。整理文件夹、空间和标签。所有操作都在你的设备本地运行。",
    "Context7 fetches up-to-date code examples and documentation right into your LLM's context. No tab-switching, no hallucinated APIs that don't exist, no outdated code generation.": "Context7 把最新的代码示例和文档直接取入你 LLM 的上下文。不用切标签页、不会幻觉出不存在的 API、不会生成过时的代码。",
    "Turn ideas into apps and websites instantly": "瞬间把创意变成应用和网站",
    "Replit's MCP server lets users create, update, and manage full-stack web and mobile applications directly from Claude using natural language. Powered by Replit Agent, it transforms prompts into live, deployed apps — complete with databases, authentication, and custom domains. Users can iterate on their apps conversationally, ask the Agent questions about their project, and access a live preview URL as the app builds. No coding experience required. The server supports OAuth 2.0 authentication and Streamable HTTP transport, integrating seamlessly with Replit's cloud development platform.": "Replit 的 MCP 服务器让用户直接在 Claude 中用自然语言创建、更新和管理全栈 Web 和移动应用。由 Replit Agent 驱动，它把提示词变成上线部署的应用——含数据库、身份验证和自定义域名。用户可以对话式地迭代应用、就项目向 Agent 提问，并在应用构建时访问实时预览 URL。无需编程经验。服务器支持 OAuth 2.0 身份验证和 Streamable HTTP 传输，与 Replit 的云开发平台无缝集成。",
    "Google Ads, Facebook Ads, TikTok, LinkedIn, Instagram, Salesforce, Shopify & 200+ sources": "Google Ads、Facebook Ads、TikTok、LinkedIn、Instagram、Salesforce、Shopify 等 200+ 数据源",
    "Natural language access to Signals electronic notebook": "用自然语言访问 Signals 电子实验记录本",
    "Connect Claude.AI assistants to the Revvity Signals scientific intelligence platform. The Signals AI MCP Server combines foundation-model reasoning with trusted scientific intelligence from Signals, ChemDraw, BioDesign and related scientific systems, enabling natural-language interaction with experiments, compounds, sequences, materials and scientific results. Go beyond search to generate insights, summaries, reports, comparisons and recommendations grounded in trusted scientific data, provenance and workflow context, turning information into understanding, decisions and action.": "把 Claude.AI 助手连接到 Revvity Signals 科学智能平台。Signals AI MCP 服务器把基础模型推理与来自 Signals、ChemDraw、BioDesign 及相关科学系统的可信科学智能结合起来，让你用自然语言与实验、化合物、序列、材料和科学结果交互。超越搜索，生成扎根于可信科学数据、溯源和工作流上下文的洞察、摘要、报告、比较和建议，把信息变成理解、决策和行动。",
    "Connect AI agents to your Intent Layer. Get strategic context, dependency graphs, and implementation prompts.": "把 AI agent 连接到你的意图层。获取战略上下文、依赖关系图和实现提示词。",
    "Pathmode MCP Server connects Claude Code, Cursor, and other AI agents to your product team's Intent Layer. AI agents get structured specifications (objectives, outcomes, constraints, edge cases), dependency graph analysis (critical path, bottlenecks, cycles), and workspace strategy context — so they build the right thing, not just any thing.": "Pathmode MCP 服务器把 Claude Code、Cursor 等 AI agent 连接到你产品团队的意图层。AI agent 获得结构化规格（目标、成果、约束、边界情况）、依赖关系图分析（关键路径、瓶颈、环路）和工作区策略上下文——让它们做对的事，而不是随便做点什么。",
    "Manage your MCP Servers and MCP Apps hosted on Alpic": "管理托管在 Alpic 上的 MCP 服务器和 MCP 应用",
    "Business Finances made simple": "让企业财务变简单",
    "Turn your business's raw financial data into clear financial insights. Analyze profitability, cash flow, and compare your performance against similar businesses in your industry and region. Generate accounting-compliant profit & loss and cash flow statements in minutes. Upload CSVs, PDFs, images, or paste transactions directly into Claude — QuickBooks will sync and analyze your personalized results as your business evolves.": "把你企业的原始财务数据变成清晰的财务洞察。分析盈利能力、现金流，并与你所在行业和地区的同类企业对比表现。几分钟内生成符合会计准则的损益表和现金流量表。上传 CSV、PDF、图片，或直接把交易粘进 Claude——随着你的业务演进，QuickBooks 会同步并分析你的个性化结果。",
    "Explore, query, and build with dbt projects": "探索、查询并基于 dbt 项目构建",
    "Discover, query, run, and manage your dbt projects directly from Claude. Browse models, sources, and lineage; query metrics from the semantic layer; and trigger jobs on the dbt platform. Make dbt a native part of your AI workflow that helps you understand your project, ship changes, and answer questions from your data faster, with full context and less friction.": "直接从 Claude 发现、查询、运行并管理你的 dbt 项目。浏览模型、数据源和血缘；从语义层查询指标；在 dbt 平台上触发作业。让 dbt 成为你 AI 工作流的原生一环，帮你理解项目、交付变更，并更快、更省心地从数据中回答问题——带完整上下文。",
    "Secure AI access to manage your WordPress.com sites": "安全的 AI 访问，管理你的 WordPress.com 站点",
    "Query a range of S&P Global datasets": "查询一系列 S&P Global 数据集",
    "Use natural language to query a range of S&P Global datasets, including S&P Capital IQ Financials, S&P Capital IQ Estimates, Company Intelligence, Private Company Financials, transactions, transcripts, and more. Designed for professionals such as investment bankers, equity analysts, consultants, and other data-driven roles, this connector enables fast, reliable financial data retrieval unlocking S&P Global's trusted data and insights.": "用自然语言查询一系列 S&P Global 数据集，包括 S&P Capital IQ 财务、S&P Capital IQ 预测、公司情报、非上市公司财务、交易、纪要等。它为投资银行家、股票分析师、顾问等数据驱动岗位打造，实现快速、可靠的财务数据检索，解锁 S&P Global 可信的数据和洞察。",
    "Manage tickets, assets, changes, and IT requests": "管理工单、资产、变更和 IT 请求",
    "Manage IT service requests, incidents, and assets directly from Claude. Browse, create, and update tickets, incidents, and service requests in Freshservice without leaving your conversation. Fetch asset details, check ticket statuses, assign agents, and automate routine IT workflows using natural language. Make Freshservice a native part of your AI workflow—an intelligent IT service management agent that helps your team resolve issues faster and keep operations running smoothly.": "直接从 Claude 管理 IT 服务请求、事件和资产。不离开对话就能在 Freshservice 中浏览、创建和更新工单、事件和服务请求。用自然语言获取资产详情、查看工单状态、指派工程师，并自动化日常 IT 工作流。让 Freshservice 成为你 AI 工作流的原生一环——一个智能的 IT 服务管理 agent，帮你的团队更快解决问题、让运营顺畅运转。",
    "TomTom maps, routing, geocoding & traffic data": "TomTom 地图、路线规划、地理编码和交通数据",
    "Validates Mermaid syntax, renders diagrams as high-quality SVG, and displays them instantly in an interactive UI where users can preview, zoom, and iterate in real time.": "校验 Mermaid 语法，把图表渲染成高质量 SVG，并即时显示在交互式界面中，用户可实时预览、缩放和迭代。",
    "Send emails and manage templates using Mailtrap": "用 Mailtrap 发送邮件并管理模板",
    "PitchBook data, embedded in the way you work.": "把 PitchBook 数据嵌入你的工作方式。",
    "Bring the depth of PitchBook's industry-leading private capital market intelligence into Claude. Powered by our MCP server, PitchBook clients can seamlessly search and analyze firms, deals, funds, and key players—unlocking trusted insights for confident decisions, actionable intelligence, and market benchmarking, all within their AI workflows.": "把 PitchBook 业界领先的私募资本市场情报的深度带入 Claude。由我们的 MCP 服务器驱动，PitchBook 客户可以无缝搜索并分析公司、交易、基金和关键人物——在他们的 AI 工作流中就解锁可信洞察，做出笃定决策、获取可落地情报并进行市场对标。",
    "Transform your prompts into active skill-building": "把你的提示词转化为主动的技能构建",
    "Bring your organization's trusted Coursera catalog into the flow of your Claude conversations. The Coursera connector enables seamless integration between Claude and your learning content, allowing you to instantly discover courses, short videos, hands-on projects, learning paths, and certificates. Going beyond simple search, the connector makes active learning a native part of your day by dynamically generating real-world practice scenarios, like professional role plays, grounded in verified learning material. Bridge theory to practice in a safe environment and receive structured feedback to accelerate skill mastery, all without leaving the chat.": "把你组织信赖的 Coursera 目录带入你的 Claude 对话流。Coursera 连接器让 Claude 与你的学习内容无缝集成，让你即时发现课程、短视频、动手项目、学习路径和证书。它超越简单搜索，通过基于经核实学习材料动态生成真实实践场景（如专业角色扮演），把主动学习变成你日常的一部分。在安全的环境中把理论桥接到实践，获得结构化反馈以加速技能掌握，全程不离开对话。",
    "Connect Claude to your Datasite virtual data room - the secure workspace where thousands of M&A deals are facilitated annually. Set up folder structures, invite users, search documents, track buyer Q&A, and audit data room readiness, all through natural language. No workflow interruptions. No security trade-offs. Built for advisors, bankers, and corporate development teams - backed by the enterprise security and permissioning every transaction demands.": "把 Claude 连接到你的 Datasite 虚拟数据室——每年促成数千笔并购交易的安全工作空间。搭建文件夹结构、邀请用户、搜索文档、跟踪买方 Q&A、审计数据室就绪度，全部通过自然语言。不打断工作流。不在安全上妥协。为顾问、银行家和企业发展团队打造——背靠每笔交易所需的企业级安全和权限管理。",
    "Analyze, summarize, and explore your Strava data": "分析、总结并探索你的 Strava 数据",
    "You'll be able to ask questions about your Strava performance. Use it to help spot training patterns, suggest improvements, cheer you on, or whatever else you can dream up.": "你将能就自己的 Strava 表现提问。用它帮你发现训练规律、给出改进建议、为你加油，或任何你能想到的用法。",
    "Control Palo Alto Networks PA-Series firewalls and Panorama with AI. 117 tools across 16 modules: security policies, NAT, objects, VPN, logs, WildFire, GlobalProtect, decryption, and more. Supports staged commits and read-only inspection. For multi-firewall setups use the CLI mode — see github.com/apius-tech/Palo-MCP.": "用 AI 控制 Palo Alto Networks PA 系列防火墙和 Panorama。16 个模块共 117 个工具：安全策略、NAT、对象、VPN、日志、WildFire、GlobalProtect、解密等。支持分阶段提交和只读检查。多防火墙场景请用 CLI 模式——见 github.com/apius-tech/Palo-MCP。",
    "Manage, update and move work forward from Claude": "在 Claude 中管理、更新并推进工作",
    "Access your Wrike workspace directly from Claude to plan, prioritise, update and track work. Turn chats into projects, tasks, and timelines your team can see and execute. Pull in meeting notes, assign owners, set due dates — all without switching tools. Keep your team moving forward, right from Claude.": "直接从 Claude 访问你的 Wrike 工作区，规划、排优先级、更新并跟踪工作。把对话变成团队看得见、能执行的项目、任务和时间线。引入会议记录、指派负责人、设置截止日期——全部无需切换工具。让你的团队持续前进，就在 Claude 里。",
    "Operate your portfolio directly from Claude": "在 Claude 中直接运营你的资产组合",
    "Use Claude to get real work done in AppFolio. Go deep with data analysis and create reports and presentations, build and trigger complex workflows to run in AppFolio, and drive actions across leasing, maintenance, accounting, and communications. Your AppFolio user permissions securely govern all activity. Through this connector Claude gets more than just API access – it can talk agent-to-agent with Realm-X and handle multi-step processes from prompt to completion. Extend your AppFolio experience to Claude and get work done wherever you work best.": "用 Claude 在 AppFolio 里把活干成。深入做数据分析、创建报表和演示，构建并触发复杂工作流在 AppFolio 中运行，并推动租赁、维护、会计和沟通等各环节的操作。你的 AppFolio 用户权限安全地管控所有活动。通过这个连接器，Claude 得到的不只是 API 访问——它能与 Realm-X 进行 agent 对 agent 的对话，从提示词到完成一手处理多步流程。把你的 AppFolio 体验延伸到 Claude，在你最顺手的地方把活干完。",
    "Trade, invest, analyze, and manage global markets": "交易、投资、分析并管理全球市场",
    "Connect your Interactive Brokers account to Claude and manage your portfolio through natural language. Ask about positions, balances, P&L, allocations, and open orders, or request real-time quotes and historical market data. You can also prompt Claude to draft trade instructions — for example, \"Buy 100 shares of AAPL at a limit of $200\" — which are sent to your IBKR account for your review and approval. Claude never submits orders directly to the market. Any trading symbols displayed or discussed are for illustrative purposes only and are not intended to portray recommendations. Member SIPC.": "把你的 Interactive Brokers 账户连接到 Claude，用自然语言管理你的投资组合。询问持仓、余额、盈亏、配置和未成交订单，或请求实时报价和历史市场数据。你也可以让 Claude 起草交易指令——比如「以 200 美元限价买入 100 股 AAPL」——发送到你的 IBKR 账户供你审阅和批准。Claude 绝不直接向市场提交订单。所显示或讨论的任何交易标的仅作示意，无意构成推荐。SIPC 成员。",
    "Get your trip started with Booking.com directly on Claude. Search, compare, and find your next stay – from a pet-friendly beach house in Miami to a sleek 5-star hotel near the Eiffel Tower, just ask. Filter by what matters most to you, like price, ratings and facilities. Finding what you're looking for has never been easier. Your ideal stay – just a prompt away.": "在 Claude 上直接用 Booking.com 开启你的旅程。搜索、比较并找到你的下一处住宿——从迈阿密的宠物友好海滨别墅，到埃菲尔铁塔旁时尚的五星酒店，开口即可。按你最在意的条件筛选，比如价格、评分和设施。找到心仪之选从未如此轻松。你的理想住宿——一句提示词的距离。",
    "Email inboxes for AI agents": "为 AI agent 提供的邮箱收件箱",
    "Analyze and generate insights from meeting transcripts": "从会议记录中分析并生成洞察",
    "Extract valuable insights from meeting transcripts and summaries.": "从会议记录和摘要中提取有价值的洞察。",
    "SQL-native query and provisioning engine for cloud infrastructure, served over MCP via 'stackql mcp'.": "面向云基础设施的 SQL 原生查询与预配引擎，通过 'stackql mcp' 以 MCP 提供。",
    "Find, evaluate, and manage your grants": "查找、评估并管理你的资助项目",
    "Instrumentl integration for nonprofits. Make Instrumentl a native part of your AI workflow — an intelligent partner that helps you find, win, and manage grants faster, directly in Claude.": "面向非营利组织的 Instrumentl 集成。让 Instrumentl 成为你 AI 工作流的原生一环——一个智能伙伴，帮你在 Claude 中更快地发现、赢得并管理资助项目。",
    "Lattice, wherever you work.": "无论你在哪工作，都有 Lattice。",
    "Performance management doesn't happen just in performance management software. It happens in meetings, feedback, goals, updates, and increasingly in the AI tool you open before your email. Lattice MCP connects that context into Claude so employees can submit updates, managers can draft stronger reviews, and prepare for people conversations without leaving the conversation. It brings Lattice data into the flow of work, grounded in the same permissions customers already trust.": "绩效管理并不只发生在绩效管理软件里。它发生在会议、反馈、目标、更新中，也越来越多地发生在你打开邮箱前先打开的那个 AI 工具里。Lattice MCP 把这些上下文接入 Claude，让员工提交更新、管理者起草更有力的评价、并为与人相关的对话做准备，全程不离开对话。它把 Lattice 数据带入工作流，并扎根于客户早已信赖的同一套权限。",
    "View OpenReplay sessions, charts, and replays from Claude.": "在 Claude 中查看 OpenReplay 的会话、图表和回放。",
    "Build animated slides and motion graphics with HTML": "用 HTML 制作动画幻灯片和动态图形",
    "Claude can now help you create animated slides, explainer videos and motion graphics to communicate and visualize your ideas. HyperFrames is an open source solution developed by HeyGen that turns HTML code into videos.": "Claude 现在能帮你创建动画幻灯片、讲解视频和动态图形，来传达和可视化你的想法。HyperFrames 是 HeyGen 开发的开源方案，把 HTML 代码变成视频。",
    "Discover O'Reilly's expert learning content": "发现 O'Reilly 的专家级学习内容",
    "Connect Claude to O’Reilly’s extensive catalog of high-quality technical and professional skills development resources. Just tell Claude what you’re looking for and you’ll get top recommendations for O’Reilly books, video courses, upcoming live events, curated learning plans, and more.": "把 Claude 连接到 O’Reilly 庞大的高质量技术和职业技能提升资源目录。只需告诉 Claude 你在找什么，你就会得到 O’Reilly 图书、视频课程、即将举行的直播活动、精选学习计划等的顶级推荐。",
    "The most productive email app ever, for Gmail & Outlook": "史上最高效的邮件应用，支持 Gmail 和 Outlook",
    "Connect Superhuman Mail to Claude, and build powerful workflows for email and calendar. Find anything in your inbox, draft replies that sound like you for every recipient, check read statuses, set reminders, schedule meetings, and send — all without leaving Claude.": "把 Superhuman Mail 连接到 Claude，为邮件和日历构建强大的工作流。在收件箱里找到任何东西、为每个收件人起草听起来像你本人的回复、查看已读状态、设置提醒、安排会议并发送——全部不离开 Claude。",
    "Pull Profound Visibility, Citation, & AI Bot Visit Data": "拉取 Profound 的可见度、引用及 AI 爬虫访问数据",
    "Access all of your Profound data: visibility, citations, and AI bot traffic directly from Claude. Build automated reports, alerts, and other workflows to power your marketing data.": "直接从 Claude 访问你所有的 Profound 数据：可见度、引用和 AI 爬虫流量。构建自动化报告、提醒和其他工作流，为你的营销数据赋能。",
    "Run Make scenarios and manage your Make account": "运行 Make 场景并管理你的 Make 账户",
    "Run active and on-demand Make scenarios, view and modify Make scenarios and their related entities (e.g., connections, webhooks, and data stores), and view and modify teams and organizations - all from within Claude.": "运行活跃的和按需的 Make 场景，查看和修改 Make 场景及其相关实体（如连接、webhook 和数据存储），查看和修改团队与组织——全部在 Claude 内完成。",
    "Manage Webflow CMS, pages, assets and sites": "管理 Webflow 的 CMS、页面、资源和站点",
    "Webflow MCP lets AI tools design pages, manage CMS content. Browse and update collections, create and edit pages, modify layouts and styles, and automate site-level tasks through natural language prompts. Bring Webflow into your AI workflow with a structured, secure interface that translates AI actions into real changes across your site—helping teams build, update, and scale Webflow projects faster with less manual work.": "Webflow MCP 让 AI 工具设计页面、管理 CMS 内容。通过自然语言提示浏览和更新集合、创建和编辑页面、修改布局和样式，并自动化站点级任务。用一个结构化、安全的接口把 Webflow 带入你的 AI 工作流，把 AI 操作转化为站点上的真实变更——帮团队更快构建、更新并扩展 Webflow 项目，减少手动工作。",
    "Helping agents see and understand data.": "帮助 agent 看见并理解数据。",
    "Zscaler MCP Server — AI-powered management of the Zscaler Zero Trust Exchange across ZIA, ZPA, ZDX, ZCC, ZTW, ZIdentity, EASM, Z-Insights, and ZMS via the Model Context Protocol.": "Zscaler MCP 服务器——通过 Model Context Protocol，以 AI 驱动管理 Zscaler Zero Trust Exchange，覆盖 ZIA、ZPA、ZDX、ZCC、ZTW、ZIdentity、EASM、Z-Insights 和 ZMS。",
    "Zscaler MCP Server is a Model Context Protocol (MCP) server for managing Zscaler products with LLMs (Claude, ChatGPT, Gemini, etc.). It exposes hundreds of tools across nine Zscaler services. Read-only operations are available by default; create / update / delete tools require explicit allowlisting via the 'Enable Write Tools' and 'Write Tools Allowlist' settings below, and destructive operations additionally require an in-session HMAC confirmation token.": "Zscaler MCP 服务器是一个用 LLM（Claude、ChatGPT、Gemini 等）管理 Zscaler 产品的 Model Context Protocol (MCP) 服务器。它跨九个 Zscaler 服务开放数百个工具。默认提供只读操作；创建/更新/删除工具需通过下方「Enable Write Tools」和「Write Tools Allowlist」设置显式加入允许列表，破坏性操作还额外需要会话内的 HMAC 确认令牌。",
    "Scite delivers answers grounded in peer-reviewed research you can verify. Each response is backed by real scientific sources, with citations that show how studies have been supported, disputed, or contextualized by other researchers. Behind the scenes, Scite’s proprietary citation-based ranking model prioritizes trustworthy, validated research, helping users move beyond claims to evidence.": "Scite 给出扎根于可核验同行评审研究的答案。每个回答都由真实的科学来源支撑，引用会显示某项研究如何被其他研究者支持、质疑或加以情境化。在幕后，Scite 专有的基于引用的排名模型优先呈现可信、经验证的研究，帮助用户从主张走向证据。",
    "Generate gene expression from a virtual human": "从虚拟人生成基因表达",
    "Synthesize Bio lets Claude generate and analyze gene expression data from a virtual human from a natural language prompt. Describe any experiment — \"tumor vs normal lung tissue\" or \"KRAS knockout vs control\" — and the platform generates realistic human expression profiles using its Gene Expression Model (GEM). You can use this gene expression data just as if you had done a laboratory experiment on human samples. Supports both bulk and single-cell RNA-seq modalities. See https://www.synthesize.bio/ to learn more about virtual humans, GEM, and to register for an account.": "Synthesize Bio 让 Claude 根据自然语言提示，从一个虚拟人生成并分析基因表达数据。描述任何实验——「肿瘤 vs 正常肺组织」或「KRAS 敲除 vs 对照」——平台就会用其基因表达模型（GEM）生成逼真的人类表达谱。你可以像真的在人类样本上做过实验室实验一样使用这些基因表达数据。支持 bulk 和单细胞 RNA-seq 两种模态。访问 https://www.synthesize.bio/ 了解更多关于虚拟人、GEM 的信息并注册账户。",
    "Analyze, query, and manage your Mixpanel data": "分析、查询并管理你的 Mixpanel 数据",
    "Query and analyze your Mixpanel data directly in Claude. Run segmentation, funnel, and retention analyses, explore your event taxonomy, manage Lexicon metadata, analyze session replays, and resolve data quality issues. With Mixpanel as persistent context, Claude can reason about your product data alongside your code, documents, and decisions, across any conversation.": "直接在 Claude 中查询和分析你的 Mixpanel 数据。运行细分、漏斗和留存分析，探索你的事件分类，管理 Lexicon 元数据，分析会话回放，并解决数据质量问题。把 Mixpanel 作为持久上下文，Claude 就能在任意对话中，把你的产品数据与代码、文档和决策放在一起推理。",
    "Bring enterprise context to Claude and your AI tools": "把企业上下文带入 Claude 和你的 AI 工具",
    "Bring enterprise context to Claude and your AI tools with Glean's Remote MCP server. Search across all your organization's connected data sources—documents, wikis, code repositories, and more. Find employees by name, role, or expertise. Read specific documents, access Gmail and Outlook emails, and lookup meeting details. Custom agent workflows enable powerful automation tailored to your organization. Make Glean your AI assistant's enterprise memory—ensuring Claude and other MCP-enabled applications have deep knowledge of your company's context wherever you work.": "用 Glean 的远程 MCP 服务器把企业上下文带入 Claude 和你的 AI 工具。跨你组织所有已连接的数据源搜索——文档、wiki、代码仓库等。按姓名、角色或专长查找员工。读取特定文档、访问 Gmail 和 Outlook 邮件、查询会议详情。自定义 agent 工作流实现贴合你组织的强大自动化。让 Glean 成为你 AI 助手的企业记忆——确保 Claude 和其他支持 MCP 的应用在你工作的任何地方都深谙你公司的上下文。",
    "Build applications with compute, storage, and AI": "用计算、存储和 AI 构建应用",
    "Enables users to build applications on Cloudflare Workers using built-in storage, AI, and compute primitives. Deploy code to production, create and query databases, manage KV stores, and more.": "让用户用内置的存储、AI 和计算原语在 Cloudflare Workers 上构建应用。把代码部署到生产、创建并查询数据库、管理 KV 存储等。",
    "Search, create, edit, and share Vani Spaces": "搜索、创建、编辑并分享 Vani Spaces",
    "Search Spaces, summarize discussions, draft documents, and build visual structures in Vani directly from Claude. Make Vani a native part of your AI workflow—a thinking workspace where Claude helps your whole team plan, organize, and decide faster.": "直接从 Claude 在 Vani 中搜索 Space、总结讨论、起草文档并构建可视化结构。让 Vani 成为你 AI 工作流的原生一环——一个思考工作空间，Claude 在这里帮你的整个团队更快地规划、组织和决策。",
    "Access your meeting summaries, transcripts, and action items so you can ask questions and build deliverables grounded in what was actually said on your calls. No copy-pasting summaries. No context switching. Just better outputs, faster.": "访问你的会议摘要、转写和行动项，让你能基于通话中真正说过的话提问并产出交付物。不用复制粘贴摘要。不用切换上下文。只有更好的产出，更快。",
    "Plan trips, flights and hotels": "规划行程、机票和酒店",
    "Discover and search flights and hotels worldwide. Get real-time pricing and availability to plan your perfect trip.": "发现并搜索全球的航班和酒店。获取实时价格和空房情况，规划你的完美行程。",
    "Query and explore your Metabase data": "查询并探索你的 Metabase 数据",
    "Search tables and metrics, explore field values, and construct or run queries against your data.": "搜索表和指标、探索字段值，并针对你的数据构建或运行查询。",
    "Import, edit, or create video with prompts": "用提示词导入、编辑或创建视频",
    "Descript is a video editor you can direct through conversation. Describe what you want — clean up a podcast episode, pull highlight clips from an interview or translate a video into Spanish. Descript handles the end-to-end production: transcribing, removing filler words, cleaning up background noise, adding captions, adding visuals and more.": "Descript 是一个你可以通过对话来指挥的视频编辑器。描述你想要什么——清理一集播客、从一段采访里剪出高光片段，或把视频翻译成西班牙语。Descript 全流程搞定制作：转写、去除口头禅、清理背景噪音、加字幕、加视觉元素等。",
    "Manage your Adobe Experience Manager content": "管理你的 Adobe Experience Manager 内容",
    "Create, edit, search, and publish pages and content fragments in Adobe Experience Manager — simply by describing what you need. Instead of navigating the user interface, tell Claude what to do in plain language: update a hero banner, find pages about a campaign, or schedule content for launch. All changes respect your AEM permissions. Work faster, reduce repetitive tasks, and stay focused on what matters most — your content.": "在 Adobe Experience Manager 中创建、编辑、搜索并发布页面和内容片段——只需描述你的需求。不用在界面里点来点去，用大白话告诉 Claude 该做什么：更新一个 hero banner、查找关于某次活动的页面，或安排内容上线。所有变更都尊重你的 AEM 权限。更快工作、减少重复任务，专注于最重要的事——你的内容。",
    "Manage your Qonto business finances from Claude": "在 Claude 中管理你的 Qonto 企业财务",
    "Qonto MCP brings your business account into Claude. Once connected, Claude can browse your transactions, statements, and bank accounts; manage clients, products, and quotes; issue and track client invoices and credit notes; review pending supplier invoices; manage debit, virtual, and flash cards; and handle team expense requests. Every action runs with the same access you already have in the Qonto app.": "Qonto MCP 把你的企业账户带入 Claude。连接后，Claude 可以浏览你的交易、对账单和银行账户；管理客户、产品和报价；开具并跟踪客户发票和贷记单；查看待处理的供应商发票；管理借记卡、虚拟卡和 flash 卡；并处理团队报销请求。每个操作都以你在 Qonto 应用中已有的相同权限运行。",
    "Access Stack Overflow's trusted content": "访问 Stack Overflow 的可信内容",
    "Enables AI tools and agents to access trusted developer knowledge from Stack Overflow.": "让 AI 工具和 agent 能访问来自 Stack Overflow 的可信开发者知识。",
    "Search, access, and analyze your Ramp financial data": "搜索、访问并分析你的 Ramp 财务数据",
    "Enables secure, read-only access to Ramp data for customer-defined logic. Supports loading and querying transactions, reimbursements, bills, purchase orders, cards, vendors, and more, enabling dynamic data fetching and analysis via Claude.": "为客户自定义逻辑提供对 Ramp 数据的安全只读访问。支持加载和查询交易、报销、账单、采购订单、卡片、供应商等，通过 Claude 实现动态数据获取和分析。",
    "Find and enrich B2B contacts and companies": "查找并丰富 B2B 联系人和公司信息",
    "Connect Lusha to Claude to access verified B2B contact and company data without leaving your chat. Lusha is a sales intelligence platform with 300M+ verified contacts, direct emails, phone numbers, and mobile numbers, plus actionable buyer signals used across sales, marketing, and RevOps workflows. Backed by GDPR, CCPA, SOC 2 Type II, and ISO 27701 compliance. Perfect for building prospect lists, researching accounts before a call, qualifying inbound leads, and natural language prospecting inside Claude.": "把 Lusha 连接到 Claude，不离开对话就能访问经核实的 B2B 联系人和公司数据。Lusha 是一个销售情报平台，拥有 3 亿+ 经核实的联系人、直拨邮箱、电话和手机号，外加用于销售、营销和 RevOps 工作流的可落地买家信号。符合 GDPR、CCPA、SOC 2 Type II 和 ISO 27701 合规。特别适合在 Claude 里构建潜客名单、通话前调研客户、甄别入站线索和用自然语言开发潜客。",
    "Fast search and full-text access over arXiv pre-prints": "对 arXiv 预印本进行快速搜索和全文访问",
    "Fast retrieval (both keyword and embedding search) tools across the millions of papers in the arXiv corpus. Give your agent context on the latest research papers.": "在 arXiv 语料库数百万篇论文中进行快速检索（关键词和嵌入搜索）的工具。为你的 agent 提供最新研究论文的上下文。",
    "Check your profit and loss, see who owes you money, review your cash position, and find your top customers — directly from Claude. Xero surfaces visual financial summaries with flexible date ranges and year-over-year comparisons, so you can stay on top of your numbers without switching apps. Every response links back to Xero for deeper analysis. Make Xero a native part of your AI workflow — a fast, read-only window into your business finances.": "直接从 Claude 查看你的损益、看谁欠你钱、检查现金状况、找出你的头部客户。Xero 呈现可视化的财务摘要，支持灵活的日期范围和同比对比，让你不切换应用就能掌控你的数字。每个回答都链接回 Xero 以做深入分析。让 Xero 成为你 AI 工作流的原生一环——一个快速、只读的企业财务窗口。",
    "Schedule smarter with Calendly in Claude. Manage your entire scheduling workflow through simple conversation — create and update event types, share scheduling links, adjust availability, book meetings, and more, without ever leaving Claude.": "在 Claude 里用 Calendly 更聪明地安排日程。通过简单对话管理你的整个日程安排工作流——创建和更新活动类型、分享预约链接、调整可用时段、预约会议等，全程不离开 Claude。",
    "Turn scattered feedback into decisions grounded in customer evidence": "把零散的反馈变成有客户证据支撑的决策",
    "Connect your customer intelligence to Claude and put real customer data behind every answer.": "把你的客户情报连接到 Claude，让每一个回答背后都有真实的客户数据。",
    "Query, analyze, and manage your PostHog insights": "查询、分析并管理你的 PostHog 洞察",
    "Connect to PostHog and work with your product data through natural conversation. Query analytics using HogQL or natural language, build and manage dashboards and insights, control feature flags, run and monitor experiments, create and analyze surveys, track errors, explore logs, and monitor LLM costs. Results include inline charts so you can visualize trends without leaving the conversation. Browse event and property definitions to understand your data model, search across all PostHog entities, and look up PostHog docs for instant context.": "连接到 PostHog，通过自然对话处理你的产品数据。用 HogQL 或自然语言查询分析，构建和管理仪表盘和洞察，控制功能开关，运行并监控实验，创建并分析问卷，跟踪错误，探索日志，监控 LLM 成本。结果含内联图表，让你不离开对话就能可视化趋势。浏览事件和属性定义以理解你的数据模型，跨所有 PostHog 实体搜索，并查阅 PostHog 文档即时获取上下文。",
    "Explore scientific research": "探索科学研究",
    "Interact with AI agents built for biology": "与专为生物学打造的 AI agent 交互",
    "Owkin build AI agents for biology to accelerate drug discovery and de-risk clinical trials. The Owkin connector currently powers HistoPLUS, an agent that transforms H&E slides from the TCGA database into granular, queryable insights. Researchers can use it to quantify distinct cell types, analyze complex spatial tumor microenvironments, and validate hypotheses through cohort-level survival analysis. Use this connector to bridge the gap between raw biological data and actionable patient stratification, starting with histopathology.": "Owkin 为生物学打造 AI agent，加速药物发现、降低临床试验风险。Owkin 连接器目前驱动 HistoPLUS——一个把 TCGA 数据库中的 H&E 切片转化为细粒度、可查询洞察的 agent。研究者可以用它量化不同细胞类型、分析复杂的空间肿瘤微环境，并通过队列级生存分析验证假设。用这个连接器弥合原始生物数据与可落地患者分层之间的鸿沟，从组织病理学起步。",
    "Store and recall long-term memory for AI agents. Persistent memory across Claude, Cursor, ChatGPT — semantic search retrieves the right context across sessions, projects, and tools.": "为 AI agent 存储并召回长期记忆。在 Claude、Cursor、ChatGPT 之间持久保存——语义搜索跨会话、项目和工具检索到正确的上下文。",
    "Mnemoverse gives your AI assistant long-term memory that persists across sessions and across tools. Store preferences, decisions, and lessons with memory_write; recall them by natural-language search with memory_read. The same memory is shared everywhere you use your Mnemoverse API key — Claude, Cursor, VS Code, and any MCP client. Requires a free API key from https://console.mnemoverse.com.": "Mnemoverse 为你的 AI 助手提供跨会话、跨工具持久保存的长期记忆。用 memory_write 存储偏好、决策和经验；用 memory_read 通过自然语言搜索召回。只要你用你的 Mnemoverse API 密钥，同一份记忆在任何地方共享——Claude、Cursor、VS Code 和任意 MCP 客户端。需要从 https://console.mnemoverse.com 获取免费 API 密钥。",
    "Query and analyze your financial data": "查询并分析你的财务数据",
    "The Grasshopper Bank MCP server connects Claude to your banking data, enabling AI-powered access to account information, transactions, and other insights. Query balances, analyze spending patterns, retrieve transaction history, and surface financial trends — all through natural language. Purpose-built for Grasshopper Bank customers, this connector brings your banking data into Claude workflows without switching tools. Accelerate routine analysis, support financial decisions, and unlock deeper visibility into your banking operations.": "Grasshopper Bank MCP 服务器把 Claude 连接到你的银行数据，实现 AI 驱动地访问账户信息、交易和其他洞察。查询余额、分析消费模式、检索交易历史、呈现财务趋势——全部通过自然语言。它专为 Grasshopper Bank 客户打造，把你的银行数据带入 Claude 工作流，无需切换工具。加速日常分析、支撑财务决策，深入洞察你的银行业务。",
    "Access the Hugging Face Hub and thousands of Gradio Apps": "访问 Hugging Face Hub 和数千款 Gradio 应用",
    "Provides access to Hugging Face Hub information and Gradio AI Applications.": "提供对 Hugging Face Hub 信息和 Gradio AI 应用的访问。",
    "Answer legal queries, search vaults, and research": "解答法律问题、检索资料库并做研究",
    "Bring Harvey's legal intelligence into Claude. The Harvey MCP server supports general legal inquiries, analysis over Vault projects, and research questions for select knowledge sources. The server also exposes discovery tools to list available Vault projects and knowledge sources, so you always know what is available for access.": "把 Harvey 的法律智能带入 Claude。Harvey MCP 服务器支持一般法律咨询、对 Vault 项目的分析，以及针对选定知识来源的研究提问。服务器还开放发现工具，用于列出可用的 Vault 项目和知识来源，让你随时知道有哪些可供访问。",
    "Talk to your quinbook ticketing system in plain language — bookings, slots, calendar, contacts, coupons and cart/order operations as tools for Claude.": "用大白话与你的 quinbook 票务系统对话——预订、时段、日历、联系人、优惠券及购物车/订单操作，都作为 Claude 的工具。",
    "MCP server exposing the quinbook API. Read tools for slots, orders, coupons and contacts; write tools for cart, order lifecycle and contacts that execute immediately (the bundled skills require confirming with the user first). OAuth login with your own quinbook credentials; multi-tenant via me_switch_company.": "开放 quinbook API 的 MCP 服务器。针对时段、订单、优惠券和联系人的读取工具；针对购物车、订单生命周期和联系人的写入工具，会立即执行（捆绑的 skill 要求先与用户确认）。用你自己的 quinbook 凭据做 OAuth 登录；通过 me_switch_company 支持多租户。",
    "Create, deploy, manage, and secure websites on Netlify.": "在 Netlify 上创建、部署、管理并加固网站。",
    "Create, deploy, and manage websites on Netlify. You'll be able to control all aspects of your site from creating secrets to enforcing access controls to aggregating your form submissions. The full power of the Netlify platform available from your AI agent.": "在 Netlify 上创建、部署和管理网站。你将能掌控站点的方方面面，从创建密钥到实施访问控制，再到汇总你的表单提交。Netlify 平台的全部能力，都可从你的 AI agent 调用。",
    "Search your inbox, and draft replies in your voice": "搜索你的收件箱，并以你的口吻起草回复",
    "Ask questions across your inbox and meeting notes to surface action items, decisions, and key discussions. Pull up meeting summaries and transcripts. Describe what you want to say and get a reply drafted in your voice, ready to send.": "跨你的收件箱和会议记录提问，呈现行动项、决策和关键讨论。调出会议摘要和转写。描述你想说什么，就能得到一份以你的口吻起草、可直接发送的回复。",
    "Connect Claude to your BlueConic CDP and explore tenant data through dynamically generated MCP tools.": "把 Claude 连接到你的 BlueConic CDP，通过动态生成的 MCP 工具探索租户数据。",
    "BlueConic MCP runs locally, loads your tenant's OpenAPI specification at startup, and exposes BlueConic's read-only GET endpoints as MCP tools. The same codebase also works with Cursor, VS Code, and other stdio-based MCP clients.": "BlueConic MCP 在本地运行，启动时加载你租户的 OpenAPI 规范，把 BlueConic 的只读 GET 端点开放为 MCP 工具。同一套代码库也适用于 Cursor、VS Code 和其他基于 stdio 的 MCP 客户端。",
    "Resolve any scholarly identifier (DOI, PMID, PMCID, ISBN, arXiv, ISSN, ADS, WHO IRIS) into 10,000+ CSL styles or nine export formats, single or batch, plus retraction, open-access, and citation-verification checks (Topaz et al. Lancet 2026 fabrication-pattern detection).": "把任意学术标识符（DOI、PMID、PMCID、ISBN、arXiv、ISSN、ADS、WHO IRIS）解析为 10,000+ 种 CSL 引用格式或九种导出格式，支持单条或批量，并附撤稿、开放获取和引用核验检查（Topaz 等，《柳叶刀》2026，捏造模式检测）。",
    "Scholar Sidekick MCP resolves any scholarly identifier (DOI, PMID, PMCID, ISBN, arXiv, ISSN, NASA ADS bibcodes, WHO IRIS URLs) into structured bibliographic metadata, formats citations in 10,000+ CSL styles (Vancouver, APA, AMA, IEEE, Chicago, Harvard, MLA, Nature, BMJ, Lancet, and many more), and exports references to BibTeX, RIS, CSL JSON, EndNote (XML/Refer), RefWorks, MEDLINE, Zotero RDF, and CSV. The format/export/resolve tools accept a single identifier or a comma/newline-separated batch, so an assistant can chain resolveIdentifier → formatCitation → exportCitation in one prompt for an end-to-end 'raw IDs → exportable bibliography' workflow. Three single-citation checks complete the picture: checkRetraction surfaces retractions, corrections, and expressions of concern from Crossref / Retraction Watch; checkOpenAccess returns OA status and the best legal landing or PDF URL from Unpaywall; verifyCitation cross-checks the cited title against the resolved record at the cited identifier to detect the AI-driven fabrication pattern documented by Topaz et al. (Lancet 2026 — 1 in 277 biomedical papers in early 2026 contains at least one fabricated reference; the dominant pattern is real DOI + invented title, which simple identifier resolution cannot catch). Each formatted response carries a provenance metadata block (formatter, styleUsed, requestId, warnings) so users can see exactly which engine produced each citation.": "Scholar Sidekick MCP 把任意学术标识符（DOI、PMID、PMCID、ISBN、arXiv、ISSN、NASA ADS 书目码、WHO IRIS URL）解析为结构化的书目元数据，用 10,000+ 种 CSL 格式（Vancouver、APA、AMA、IEEE、Chicago、Harvard、MLA、Nature、BMJ、Lancet 等）格式化引用，并把参考文献导出为 BibTeX、RIS、CSL JSON、EndNote（XML/Refer）、RefWorks、MEDLINE、Zotero RDF 和 CSV。format/export/resolve 工具接受单个标识符或逗号/换行分隔的批量，所以助手可以在一次提示里串起 resolveIdentifier → formatCitation → exportCitation，实现「原始 ID → 可导出书目」的端到端工作流。三项单条引用检查补齐全貌：checkRetraction 从 Crossref / Retraction Watch 呈现撤稿、更正和关注声明；checkOpenAccess 从 Unpaywall 返回开放获取状态和最佳合法落地页或 PDF URL；verifyCitation 把被引标题与该标识符解析出的记录交叉核对，以检测 Topaz 等人记录的 AI 驱动捏造模式（《柳叶刀》2026——2026 年初每 277 篇生物医学论文就有 1 篇含至少一处捏造引用；主流模式是真 DOI + 编造标题，简单的标识符解析抓不到）。每个格式化回答都带一个溯源元数据块（formatter、styleUsed、requestId、warnings），让用户能确切看到每条引用由哪个引擎生成。",
    "Clinical trial software and site ranking tools": "临床试验软件与试验中心排名工具",
    "Pharmaceutical drug & clinical trial intelligence": "药物与临床试验情报",
    "AdisInsight gives Claude real-time access to the world's most comprehensive pharmaceutical drug and clinical trial intelligence database, powered by Springer Nature. Search and explore drug pipelines by developer, therapeutic area, development phase, mechanism of action, and 40+ parameters. Find clinical trials by compound, sponsor, indication, phase, and status. Analyze competitive landscapes by company portfolios. Generate interactive charts visualizing pipeline distributions and trial landscapes. Access detailed drug profiles including development history, adverse events, and regulatory milestones.": "AdisInsight 让 Claude 实时访问全球最全面的药物和临床试验情报数据库，由 Springer Nature 提供支持。按开发方、治疗领域、开发阶段、作用机制和 40+ 参数搜索并探索药物管线。按化合物、申办方、适应症、阶段和状态查找临床试验。按公司组合分析竞争格局。生成可视化管线分布和试验格局的交互式图表。访问详细的药物档案，包括开发历史、不良事件和监管里程碑。",
    "Connect to Pendo for product and user insights": "连接 Pendo 获取产品和用户洞察",
    "The Pendo connector for product analytics and behavioral data to AI environments. Access visitor and account metadata, query user behavior, and analyze pages, features, and events. Supports real-time product data integration for tasks like customer call preparation, adoption analysis, churn investigation, and support ticket enrichment.": "把产品分析和行为数据带入 AI 环境的 Pendo 连接器。访问访客和账户元数据、查询用户行为、分析页面、功能和事件。支持实时产品数据集成，用于客户通话准备、采用分析、流失调查和支持工单丰富等任务。",
    "Design the genuine experiences of tomorrow.": "设计未来的真实体验。",
    "Query Celayix workforce management data (employees, shifts, customers, sites, services, time off, qualifications) directly from the LLM.": "直接从 LLM 查询 Celayix 劳动力管理数据（员工、排班、客户、站点、服务、休假、资质）。",
    "Connects your LLM to the hosted Celayix MCP server. Authenticate once with a Celayix MCP token (generated via the Celayix Token API) and ask the LLM natural questions like \"show shifts for next week\" or \"who are our active customers?\". Sessions are generated automatically — no per-tool login required.": "把你的 LLM 连接到托管的 Celayix MCP 服务器。用一个 Celayix MCP 令牌（通过 Celayix Token API 生成）认证一次，就能向 LLM 自然发问，比如「显示下周的排班」或「我们的活跃客户有哪些？」。会话自动生成——无需按工具逐个登录。",
    "Manage incidents, services and on-call schedules": "管理事件、服务和值班排期",
    "Manage incidents, create services, schedule overrides, and track on-call rotations with your PagerDuty account": "用你的 PagerDuty 账户管理事件、创建服务、安排替班并跟踪值班轮换。",
    "Process, sign, redact, and transform documents from Claude Desktop using Nutrient.": "用 Nutrient 在 Claude Desktop 中处理、签署、脱敏并转换文档。",
    "A local Claude Desktop extension for document processing with Nutrient. It runs as a stdio MCP server, reads files from a user-selected sandbox directory, opens a browser for OAuth on the first request that uses the Nutrient API, and writes processed results back to local output paths.": "用 Nutrient 做文档处理的本地 Claude Desktop 扩展。它作为 stdio MCP 服务器运行，从用户选定的沙箱目录读取文件，在首次使用 Nutrient API 的请求时打开浏览器做 OAuth，并把处理结果写回本地输出路径。",
    "Report, strategize & create with real-time Klaviyo data": "用实时 Klaviyo 数据做报表、定策略、搞创作",
    "Chat directly with Klaviyo to report, strategize, and launch faster. Ask for performance summaries, content and copy, optimization opportunities, and profile insights – AI responds with the full context of your Klaviyo data.": "直接与 Klaviyo 对话，更快地做报表、定策略、上线。询问业绩摘要、内容和文案、优化机会和用户档案洞察——AI 会结合你 Klaviyo 数据的完整上下文作答。",
    "Lightweight MCP Server for macOS desktop interaction": "用于 macOS 桌面交互的轻量级 MCP 服务器",
    "Manage your partner program and access your Partner Data Lake with Claude.": "用 Claude 管理你的合作伙伴计划并访问你的合作伙伴数据湖。",
    "Manage your partner program and access your Partner Data Lake with Claude — instant actions and answers on deals, commissions, onboarding, and partner performance, no dashboard required. Partners can register deals and access live data across their pipeline, enablement, certifications, payouts and more.": "用 Claude 管理你的合作伙伴计划并访问你的合作伙伴数据湖——就交易、佣金、入驻和合作伙伴表现即时执行操作、即时获得答案，无需仪表盘。合作伙伴可以登记交易，并跨管道、赋能、认证、payout 等访问实时数据。",
    "Connect Claude to Spark - read, draft, triage, and act on your email, calendars, meetings, and contacts.": "把 Claude 连接到 Spark——读取、起草、分拣你的邮件、日历、会议和联系人并对其采取操作。",
    "Give Claude access to Spark on macOS so it can both answer questions about your workspace and act on it. Search and browse emails, list folders, read full threads with bodies and attachments, look up contacts, check calendar events, find mutual availability with teammates, and review meeting transcripts. With write access, Claude can also compose drafts (new, reply, forward, with attachments, or from saved templates) and share them with teammates, post team chat comments on shared threads, triage messages (archive, pin, snooze, move, label, mark as done, share with team, assign and delegate), reclassify smart categories, and manage contacts (block/accept, category, important/primary, auto-summary). Tools are discovered dynamically from the running Spark Desktop app. Each account and shared inbox has its own access level - read-only or triage - configurable in Spark Desktop > Settings > AI Agents.": "让 Claude 访问 macOS 上的 Spark，既能回答关于你工作空间的问题，也能对其采取操作。搜索并浏览邮件、列出文件夹、读取含正文和附件的完整会话、查找联系人、查看日历事件、与同事找共同空闲时间，并查看会议转写。有写入权限时，Claude 还能撰写草稿（新建、回复、转发、带附件或用保存的模板），并与同事分享、在共享会话上发布团队聊天评论、分拣消息（归档、置顶、稍后处理、移动、贴标签、标记完成、与团队分享、指派和委派）、重新归类智能分类，并管理联系人（拉黑/接受、分类、重要/主要、自动摘要）。工具从运行中的 Spark Desktop 应用动态发现。每个账户和共享收件箱都有各自的访问级别——只读或分拣——可在 Spark Desktop > 设置 > AI Agents 中配置。",
    "Access institutional-quality financial data and analytics": "访问机构级金融数据和分析",
    "Access, comprehensive financial data and analytics through AI-powered tools. Connect to FactSet global prices, fundamental analysis, earnings estimates, and research insights into Claude, to enhance your financial analysis, earning estimates and investment research with trusted, institutional-quality data.": "通过 AI 驱动的工具访问全面的金融数据和分析。把 FactSet 的全球价格、基本面分析、盈利预测和研究洞察接入 Claude，用可信的机构级数据增强你的财务分析、盈利预测和投资研究。",
    "Query, create, update, and search your Dataverse data": "查询、创建、更新并搜索你的 Dataverse 数据",
    "Connect AI assistants to Microsoft Dataverse to query, create, update, delete, and search data in Dataverse.": "把 AI 助手连接到 Microsoft Dataverse，以在 Dataverse 中查询、创建、更新、删除和搜索数据。",
    "Read-only access to Baremetrics SaaS analytics — metrics, customers, subscriptions, plans, charges, and events.": "只读访问 Baremetrics 的 SaaS 分析——指标、客户、订阅、套餐、扣费和事件。",
    "Managed MCP servers with Unity Catalog and Mosaic AI": "带 Unity Catalog 和 Mosaic AI 的托管 MCP 服务器",
    "Deploy and monitor MCP servers": "部署并监控 MCP 服务器",
    "Manufact lets you deploy, monitor and manage MCP servers and MCP Apps in Manufact, the cloud built for MCP": "Manufact 让你在 Manufact——为 MCP 打造的云——中部署、监控和管理 MCP 服务器和 MCP 应用。",
    "Create flowcharts, mindmaps, wireframes and diagrams": "创建流程图、思维导图、线框图和图表",
    "Explain and visualize concepts with flowcharts, mindmaps, wireframes and sequence diagrams.": "用流程图、思维导图、线框图和时序图来解释和可视化概念。",
    "Search and metadata tools for Synapse scientific data": "面向 Synapse 科研数据的搜索和元数据工具",
    "Pseudonymise patient identifiers and PII in text, and restore them — on-device, nothing leaves your machine.": "对文本中的患者标识符和个人信息做假名化并可还原——在本机运行，数据不出你的设备。",
    "Redacta replaces patient identifiers and personal data (NHS numbers with Modulus-11 validation, names, dates of birth, MRNs, emails, phones, postcodes, plus general PII like URLs, IPs, payment cards and account numbers) with labelled tokens, so text can be safely shared or processed by AI. It includes a HIPAA Safe Harbor mode and is fully reversible via a token map. All processing happens locally in the server process — it makes no network calls and stores nothing.": "Redacta 用带标签的令牌替换患者标识符和个人数据（含 Modulus-11 校验的 NHS 号码、姓名、出生日期、MRN、邮箱、电话、邮编，以及 URL、IP、支付卡和账号等一般 PII），让文本能安全地被分享或由 AI 处理。它包含 HIPAA Safe Harbor 模式，并可通过令牌映射完全还原。所有处理都在服务器进程本地进行——不发起任何网络调用、不存储任何东西。",
    "Docling MCP Server - Document processing and analysis with remote API and local conversion support": "Docling MCP 服务器——文档处理与分析，支持远程 API 和本地转换",
    "Monitor and improve visibility across AI search platforms (ChatGPT, Gemini, Grok, Google AI Overviews, AI Mode) and in local search (Google Maps, Apple Maps) with 37 tools for AI visibility tracking, geo-grid rank analysis, competitor intelligence, campaign management, and Google Business Profile monitoring.": "用 37 个工具监控并提升在 AI 搜索平台（ChatGPT、Gemini、Grok、Google AI Overviews、AI Mode）和本地搜索（Google Maps、Apple Maps）中的可见度，涵盖 AI 可见度跟踪、地理网格排名分析、竞品情报、活动管理和 Google 商家资料监控。",
    "Search, summarize and analyze hiring data": "搜索、总结并分析招聘数据",
    "Retrieve and analyze hiring data, including scheduled interview context and prep materials, AI-generated notes and post-interview summaries, interviewer scorecards and candidate assessments from your ATS (e.g., Greenhouse), structured interview guides with questions and competencies, and job descriptions for open positions.": "检索并分析招聘数据，包括已安排的面试上下文和准备材料、AI 生成的笔记和面试后摘要、来自你 ATS（如 Greenhouse）的面试官评分卡和候选人评估、含问题和能力项的结构化面试指南，以及开放职位的职位描述。",
    "Map and analyze your geospatial data": "映射并分析你的地理空间数据",
    "Felt is a modern GIS platform for creating, analyzing, and sharing interactive maps. The Felt MCP server lets Claude run geospatial analysis end-to-end: query connected databases and storage (Databricks, Snowflake, BigQuery, PostgreSQL, S3) with spatial SQL, build and style map layers with Felt Style Language (FSL), upload files, manage annotations like pins and polygons, share maps, and tap into Felt's curated library of public datasets covering boundaries, demographics, infrastructure, and climate.": "Felt 是一个现代 GIS 平台，用于创建、分析和分享交互式地图。Felt MCP 服务器让 Claude 端到端地做地理空间分析：用空间 SQL 查询已连接的数据库和存储（Databricks、Snowflake、BigQuery、PostgreSQL、S3），用 Felt 样式语言（FSL）构建并美化地图图层，上传文件，管理图钉和多边形等标注，分享地图，并调用 Felt 精选的公共数据集库（涵盖边界、人口、基础设施和气候）。",
    "Buy and sell tickets safely, fan to fan, at fair prices": "在粉丝之间以公平价格安全买卖门票",
    "Tixel is the safe, fair way to buy and sell tickets to live events — concerts, festivals, sports, theatre, and comedy. Every ticket is verified to prevent fraud, sellers are identity-checked, and resale prices are capped near face value so fans never overpay. Browse real-time availability, buy instantly, or join a waitlist for sold-out events. Trusted by fans worldwide and partnered with leading venues, festivals, and promoters across the US, UK, and Australia.": "Tixel 是买卖现场活动门票——演唱会、音乐节、体育、戏剧和喜剧——的安全、公平之选。每张票都经过验证以防欺诈，卖家经过身份核验，转售价格被限制在接近面值的水平，让粉丝绝不多花冤枉钱。浏览实时余票、即时购买，或为售罄活动加入候补名单。深受全球粉丝信赖，并与美国、英国和澳大利亚的顶级场馆、音乐节和主办方合作。",
    "Create websites, pages, and blog posts with AI. Manage clients and credits.": "用 AI 创建网站、页面和博客文章。管理客户和额度。",
    "Lindo AI is a website builder platform for agencies. This extension lets you create websites, pages, and blog posts using AI directly from Claude. You can also manage clients, assign websites, generate magic login links, and allocate credits — all without leaving the conversation.": "Lindo AI 是面向代理商的网站构建平台。这个扩展让你直接从 Claude 用 AI 创建网站、页面和博客文章。你还可以管理客户、分配网站、生成 magic 登录链接和分配额度——全程不离开对话。",
    "Explore customer data and generate insights via Claude": "通过 Claude 探索客户数据并生成洞察",
    "Let Claude work directly with your Customer.io workspace to create segments, inspect user profiles, search for customers, and access workspace data. Analyze customer attributes, manage audience targeting, and explore your workspace without switching tabs.": "让 Claude 直接处理你的 Customer.io 工作区，创建细分、检查用户档案、搜索客户并访问工作区数据。分析客户属性、管理受众定向、探索你的工作区，无需切换标签页。",
    "Read, annotate, and interact with PDF files — interactive viewer with search, navigation, annotations, form filling, and text extraction": "阅读、批注 PDF 文件并与之交互——交互式查看器，支持搜索、导航、批注、表单填写和文本提取",
    "Plan, book, and manage business travel": "规划、预订并管理商务出行",
    "Otto brings business travel bookings into Claude. Search flights and hotels, compare options, then book your choice. Your preferences filter search results (cabin class, seat, hotel brand, airline), and your loyalty numbers attach to reservations. When plans change, exchange or cancel a flight or hotel. It retrieves trip details on request: flight times, hotel addresses, confirmation numbers.": "Otto 把商务差旅预订带入 Claude。搜索航班和酒店、比较选项，然后预订你的选择。你的偏好会过滤搜索结果（舱位、座位、酒店品牌、航司），你的会员号会附加到预订上。计划有变时，可改签或取消航班或酒店。它按需检索行程详情：航班时间、酒店地址、确认号。",
    "Real time web, mobile app, and market data.": "实时的网站、移动应用和市场数据。",
    "Research any website or app using Similarweb's market intelligence data. Analyze competitor traffic, uncover top keywords, explore audience demographics, and benchmark performance across industries—all through simple prompts. Ask things like \"Show me Nike's traffic sources breakdown\" or \"What keywords is Adidas ranking for?\" and get real-time insights without switching tools. Whether you're a marketer, analyst, investor, or strategist, Similarweb helps you turn competitive questions into answers instantly.": "用 Similarweb 的市场情报数据研究任意网站或应用。分析竞品流量、挖掘热门关键词、探索受众画像，并跨行业对标业绩——全部通过简单提示。比如问「给我看 Nike 的流量来源分布」或「Adidas 在哪些关键词上有排名？」，无需切换工具就能获得实时洞察。无论你是营销人员、分析师、投资者还是策略师，Similarweb 都能帮你即时把竞争问题变成答案。",
    "Unleash your team's best performance with Outreach AI": "用 Outreach AI 释放团队的最佳表现",
    "Bring Outreach knowledge and actions into Claude so your teams can move faster, combine insights across systems, and complete advanced revenue tasks without switching tools. Outreach is an end-to-end AI Revenue Platform for all go-to-market teams. By embedding agentic AI across every revenue workflow, Outreach increases sales productivity, boosts pipeline, and gives leaders the visibility and predictability they need to grow revenue at scale.": "把 Outreach 的知识和操作带入 Claude，让你的团队更快行动、跨系统整合洞察，并在不切换工具的情况下完成高级营收任务。Outreach 是面向所有 go-to-market 团队的端到端 AI 营收平台。通过在每个营收工作流中嵌入 agent 化 AI，Outreach 提升销售效率、扩大管道，并给管理者提供大规模增长营收所需的可见度和可预测性。",
    "Adobe Marketing Agent for Claude Enterprise lets you interact with Adobe using natural language. Ask questions, get insights, and take action without leaving your workflow. It understands your intent and connects with Adobe solutions like Real-Time CDP, Journey Optimizer, and Customer Journey Analytics to deliver answers that help teams move faster and work smarter.": "面向 Claude Enterprise 的 Adobe Marketing Agent 让你用自然语言与 Adobe 交互。提问、获取洞察、采取行动，全程不离开你的工作流。它理解你的意图，并连接 Real-Time CDP、Journey Optimizer 和 Customer Journey Analytics 等 Adobe 解决方案，给出帮助团队更快、更聪明工作的答案。",
    "Create forms & analyze submissions inside Claude": "在 Claude 中创建表单并分析提交内容",
    "Create and edit online forms, then access and analyze submissions directly in Claude. Design forms through natural language, review incoming responses, and generate insights or reports without leaving the chat. Make data collection and analysis seamless, helping businesses, educators, and teams capture structured input and act on it instantly.": "创建和编辑在线表单，然后直接在 Claude 中访问并分析提交内容。用自然语言设计表单、查看收到的回复，并生成洞察或报告，全程不离开对话。让数据收集和分析变得无缝，帮助企业、教育者和团队捕获结构化输入并即时据此行动。",
    "Thomson Reuters CoCounsel Legal, in Claude": "汤森路透 CoCounsel Legal，尽在 Claude",
    "CoCounsel Legal delivers comprehensive Westlaw Deep Research reports with inline, linked citations to Westlaw and Practical Law sources.": "CoCounsel Legal 提供全面的 Westlaw 深度研究报告，含指向 Westlaw 和 Practical Law 来源的内联链接引用。",
    "Stocks, options & indices market data via Massive.com financial data API. Access real-time and historical prices, quotes, trades, and aggregates for equities, options contracts, ETFs, FX, crypto, and more.": "通过 Massive.com 金融数据 API 获取股票、期权及指数行情。访问股票、期权合约、ETF、外汇、加密货币等的实时和历史价格、报价、成交和聚合数据。",
    "Access ICD-10-CM and ICD-10-PCS code sets": "访问 ICD-10-CM 和 ICD-10-PCS 编码集",
    "The ICD-10 Codes Connector gives Claude access to the complete ICD-10-CM (diagnosis) and ICD-10-PCS (procedure) code sets for medical classification and billing.": "ICD-10 Codes 连接器让 Claude 能访问完整的 ICD-10-CM（诊断）和 ICD-10-PCS（操作）编码集，用于医学分类和计费。",
    "Enhance responses with scholarly research and citations": "用学术研究和引用增强回答",
    "Security guard for AI agents — blocks malicious skills, prevents data leaks, protects secrets.": "AI agent 的安全卫士——拦截恶意 skill、防止数据泄露、保护密钥。",
    "GoPlus AgentGuard is an AI-agent security framework. It exposes MCP tools for scanning skills, looking up and managing a trust registry, evaluating runtime actions against policy, and simulating Web3 transactions. 20+ detection rules cover dangerous commands, secret exfiltration, and risky on-chain actions.": "GoPlus AgentGuard 是一个 AI agent 安全框架。它开放 MCP 工具用于扫描 skill、查询和管理信任注册表、依据策略评估运行时操作，以及模拟 Web3 交易。20+ 条检测规则覆盖危险命令、密钥外泄和高风险的链上操作。",
    "Trigger, automate, and orchestrate enterprise workflows": "触发、自动化并编排企业工作流",
    "Bring real buyer signals into AI workflows": "把真实的买家信号带入 AI 工作流",
    "The G2 MCP server brings real-time Buyer Intent and review insights into AI workflows. It lets AI summarize in-market buyer research, competitive interest, and customer sentiment from the G2 platform. Teams can automatically prioritize accounts, personalize outreach, inform messaging, and uncover market trends—turning trusted, first-party buyer data into action.": "G2 MCP 服务器把实时的买家意图和评价洞察带入 AI 工作流。它让 AI 从 G2 平台总结市场中的买家调研、竞争兴趣和客户情绪。团队可以自动为客户排优先级、个性化触达、指导话术并发现市场趋势——把可信的第一方买家数据变成行动。",
    "Cloudinary Asset Management MCP Server": "Cloudinary 资产管理 MCP 服务器",
    "A comprehensive MCP server for managing your Cloudinary assets. Upload, organize, search, and transform images, videos, and files with AI-powered tools.": "一个全面的 MCP 服务器，用于管理你的 Cloudinary 资产。用 AI 驱动的工具上传、整理、搜索并转换图片、视频和文件。",
    "Manage and build sites and apps on Wix": "在 Wix 上管理和构建站点和应用",
    "The Wix MCP provides users with the ability to manage their account's websites and apps (Stores, Bookings, Blog etc.). In addition, the MCP also helps devs create new sites using Wix Headless, the Wix Design system and more.": "Wix MCP 让用户能管理账户下的网站和应用（Stores、Bookings、Blog 等）。此外，MCP 还帮开发者用 Wix Headless、Wix 设计系统等创建新站点。",
    "Search flights in Claude": "在 Claude 中搜索航班",
    "Brings flight search directly into Claude. The Kiwi connector supports one-way/round-trip, flexible dates, multiple passengers, all cabin classes. Works with Claude and Claude Desktop.": "把航班搜索直接带入 Claude。Kiwi 连接器支持单程/往返、灵活日期、多名乘客、所有舱位。适用于 Claude 和 Claude Desktop。",
    "Create forms, analyze submissions, and download files": "创建表单、分析提交内容并下载文件",
    "MCP server for Miggo's public API - query services, endpoints, vulnerabilities, findings, dependencies, and third-party integrations": "面向 Miggo 公开 API 的 MCP 服务器——查询服务、端点、漏洞、发现项、依赖和第三方集成",
    "Connect Claude to your Miggo security environment. This extension provides 25 tools to explore and analyze your application security posture including services, endpoints, vulnerabilities, findings, dependencies, and third-party integrations. Use natural language to assess risk, investigate threats, onboard security teams, and prioritize remediation across your entire environment.": "把 Claude 连接到你的 Miggo 安全环境。这个扩展提供 25 个工具来探索和分析你的应用安全态势，包括服务、端点、漏洞、发现项、依赖和第三方集成。用自然语言评估风险、调查威胁、让安全团队上手，并在整个环境中为修复排优先级。",
    "Hire talent with confidence": "放心招募人才",
    "Upwork makes it easy to turn a simple conversation into real work, right from Claude. Describe what you need and instantly get matched with expert talent from Upwork or generate a job post in seconds. Then, move seamlessly to Upwork to hire quickly and get started.": "Upwork 让你直接在 Claude 里把一次简单对话变成真实的工作。描述你的需求，即刻从 Upwork 匹配到专业人才，或几秒生成一则招聘帖。然后无缝转到 Upwork 快速雇佣、开始合作。",
    "Real-time web search & extraction for AI agents": "为 AI agent 提供实时网页搜索与提取",
    "Nimble connects AI agents to the live web with vertically-tuned search, extraction, mapping, and crawling. Each query is routed to the right sources and returned as structured JSON instead of noisy text. Headless browsers fully render JavaScript-heavy and anti-bot-protected sites that indexed search tools can't reach. Focus modes (shopping, social, news, geo, general) tune sourcing and extraction per domain, so agents get task-ready data without extra LLM parsing calls. SOC 2 compliant and built for production scale.": "Nimble 用垂直调优的搜索、提取、映射和爬取，把 AI agent 连接到实时网络。每个查询都被路由到合适的来源，并以结构化 JSON（而非杂乱文本）返回。无头浏览器完整渲染重 JavaScript、有反爬保护的站点——索引式搜索工具够不到的地方。聚焦模式（购物、社交、新闻、地理、通用）按领域调优取源和提取，让 agent 拿到即用的数据，无需额外的 LLM 解析调用。符合 SOC 2 合规，为生产规模打造。",
    "The connected ERP for private capital": "面向私募资本的互联 ERP",
    "Access cap table and investor data directly to your AI workflow. Cap table customers can pull cap table ownership, 409A valuations, and stakeholder details. Model pro-forma rounds and analyze exit scenarios. For investors, access investment metrics, fund performance, accounting data, and company financials instantly. Ask questions, run scenarios, and uncover insights without context switching—your Carta data remains secure and integrated.": "把股权结构表和投资者数据直接带入你的 AI 工作流。股权表客户可以拉取股权归属、409A 估值和股东详情。为增发轮做形式测算并分析退出情形。对投资者，可即时访问投资指标、基金业绩、会计数据和公司财务。提问、跑情形、挖掘洞察，无需切换上下文——你的 Carta 数据始终安全且集成。",
    "Search domains and check availability": "搜索域名并查询可用性",
    "Use GoDaddy to find available domains and get smart suggestions based on your ideas and keywords.": "用 GoDaddy 查找可用域名，并根据你的想法和关键词获得智能建议。",
    "See and manage everything in incident.io": "在 incident.io 中查看和管理一切",
    "Manage your full incident.io workspace from one place. Declare and triage incidents, ack pages, check who's on call, and track follow-ups - without switching tools. Analyze incident trends, escalation response rates, and alert noise across your organization. Browse your catalog, query telemetry from connected observability tools, and run structured operational reviews. Everything your team needs to stay on top of things, without the tab juggling.": "在一处管理你的整个 incident.io 工作区。声明和分诊事件、确认呼叫、查看谁在值班、跟踪后续项——无需切换工具。跨你的组织分析事件趋势、升级响应率和告警噪音。浏览你的目录、查询已连接可观测性工具的遥测，并进行结构化的运营复盘。团队掌控一切所需的一切，无需在标签页间来回切换。",
    "MCP server for SAPUI5/OpenUI5 development. Create and validate apps, access API docs, and get development guidelines.": "面向 SAPUI5/OpenUI5 开发的 MCP 服务器。创建并校验应用、访问 API 文档、获取开发指南。",
    "Create marketing campaigns": "创建营销活动",
    "Go from business goals to omnichannel campaigns in seconds. Provide your business goals, and we'll generate a data-backed omnichannel strategy with ready-to-use layouts, not just the text, to ensure brand consistency while saving you hours of manual work. Ready to send? Simply connect or create a Mailchimp account to import your assets and reach your audience.": "几秒钟从业务目标到全渠道营销活动。提供你的业务目标，我们就生成一份有数据支撑的全渠道策略，附即用的版式（不只是文字），在为你省下数小时手动工作的同时确保品牌一致。准备发送？只需连接或创建一个 Mailchimp 账户来导入你的素材、触达你的受众。",
    "Access US National Provider Identifier (NPI) Registry": "访问美国国家医疗提供者标识（NPI）注册库",
    "The NPI Registry Connector gives Claude access to the US National Provider Identifier (NPI) Registry, containing information about all HIPAA-covered healthcare providers in the United States.": "NPI Registry 连接器让 Claude 能访问美国国家医疗提供者标识（NPI）注册库，其中包含全美所有受 HIPAA 覆盖的医疗提供者信息。",
    "Search and manage transaction, merchant, and payment data": "搜索并管理交易、商户和支付数据",
    "Access Square’s commerce platform to view transaction data, manage customer profiles, track inventory, process payments, and analyze sales patterns. Handle point-of-sale operations, generate financial reports, and manage business operations through Claude’s natural language interface for streamlined commerce management.": "访问 Square 的商务平台，查看交易数据、管理客户档案、跟踪库存、处理支付并分析销售模式。通过 Claude 的自然语言接口处理 POS 操作、生成财务报表并管理业务运营，实现精简的商务管理。",
    "Save, read, search, and learn": "保存、阅读、搜索并学习",
    "Access your full library of Readwise highlights and Reader documents: search them semantically, save new documents, create new highlights, move documents, tag them, etc. Using the exposed tools, you can trivially triage your library, organize your library, and give Claude access to every word of everything you've read.": "访问你 Readwise 高亮和 Reader 文档的完整库：语义搜索、保存新文档、创建新高亮、移动文档、打标签等。用开放的工具，你可以轻松分拣和整理你的库，并让 Claude 访问你读过的一切的每一个字。",
    "Search, access, and get insights on your Nooks data": "搜索、访问你的 Nooks 数据并从中获取洞察",
    "Connect Nooks to Claude to analyze your outbound data in plain language. Search across prospects, sequences, tasks, and calls to surface insights, investigate performance, and answer questions about your pipeline.": "把 Nooks 连接到 Claude，用大白话分析你的外呼数据。跨潜在客户、序列、任务和通话搜索，呈现洞察、探究业绩，并回答关于你管道的问题。",
    "Manage planning, projects, tasks, and approvals": "管理规划、项目、任务和审批",
    "Search, summarize, create, and update projects, tasks, workspaces, planning records  and approvals directly from Claude. Make Adobe Workfront a native part of your AI workflow — an AI-powered work management agent that helps you stay on top of deadlines, surface risks, and move work forward faster.": "直接从 Claude 搜索、总结、创建和更新项目、任务、工作区、规划记录和审批。让 Adobe Workfront 成为你 AI 工作流的原生一环——一个 AI 驱动的工作管理 agent，帮你掌控截止日期、呈现风险，并更快推进工作。",
    "Web Search + Code Docs Search": "网页搜索 + 代码文档搜索",
    "Exa MCP gives you real-time web searches and can extracts content from any URL. It also finds the best code examples and documentation, searches billions of GitHub repos, docs sites, and StackOverflow to give you fresh coding context.": "Exa MCP 为你提供实时网页搜索，并能从任意 URL 提取内容。它还能找到最好的代码示例和文档，搜索数十亿个 GitHub 仓库、文档站点和 StackOverflow，给你新鲜的编码上下文。",
    "Search and access context from meetings": "搜索并获取会议上下文",
    "Bring context from Circleback into Claude. Search and access meeting notes, transcripts, calendar events, emails, people, companies, and more.": "把来自 Circleback 的上下文带入 Claude。搜索并访问会议笔记、转写、日历事件、邮件、人员、公司等。",
    "This server provides tools to query the Tripadvisor hotels data, with functions to search for hotels in an area and to retrieve hotel details, photos, reviews, review ratings, availability, pricing, and nearby points of interest. It should be invoked for user queries involving hotel research, comparison, rating checks, or gathering contextual data about a hotel's surroundings (e.g., attractions, amenities). The tools operate on specific Tripadvisor location or hotel IDs; follow-up requests should re-use these identifiers to refine results accurately. The model must handle edge cases like ambiguous location names (e.g., \"Springfield\") by seeking clarification before executing a search. This tool's primary function is to ground accommodation planning in factual, real-time data along with opinions from other travelers.": "这个服务器提供查询 Tripadvisor 酒店数据的工具，含搜索某地区酒店以及检索酒店详情、照片、评价、评分、空房、价格和附近兴趣点的功能。当用户查询涉及酒店调研、比较、评分核查，或收集关于酒店周边（如景点、设施）的上下文数据时，应调用它。工具基于特定的 Tripadvisor 地点或酒店 ID 运作；后续请求应复用这些标识符以准确细化结果。模型必须处理诸如地名歧义（如「Springfield」）这类边界情况，在执行搜索前先寻求澄清。此工具的主要功能是把住宿规划扎根于真实、实时的数据以及其他旅行者的观点。",
    "MCP server for the Avanquest PDF API, offering scalable tools for PDF conversion, merging, compression, splitting, and advanced document processing automation.": "面向 Avanquest PDF API 的 MCP 服务器，提供可扩展的 PDF 转换、合并、压缩、拆分及高级文档处理自动化工具。",
    "Search and explore your Everlaw database in Claude.": "在 Claude 中搜索并探索你的 Everlaw 数据库。",
    "Combine Everlaw's powerful AI and analytics with your Claude-based workflows. Connect Everlaw to Claude to search, analyze, and pull case insights in seconds—right from your documents. Stay in control and move faster on live matters without risking confidentiality or defensibility.": "把 Everlaw 强大的 AI 和分析与你基于 Claude 的工作流结合。把 Everlaw 连接到 Claude，几秒内就能从你的文档中搜索、分析并提取案件洞察。在处理进行中的案件时保持掌控、更快推进，且不冒泄密或可辩护性受损的风险。",
    "A Jira-like project tracker MCP server for AI agents. SQLite-backed, per-project scoped, with full hierarchy and activity logging — so LLMs never lose track.": "面向 AI agent 的类 Jira 项目跟踪 MCP 服务器。基于 SQLite、按项目隔离，具备完整层级和活动日志——让 LLM 永不迷失。",
    "Find company & contact data": "查找公司和联系人数据",
    "Turn your Claude agent into a prospecting platform. Find any company or professional right in your Claude. Get contact information, roles, tech stack, business events, website changes, Intent data, and much more. Build lead lists, research prospects, identify talent, and craft personalized outreach, all without leaving your chat. Vibe Prospecting delivers fresh B2B data backed by 50+ data sources. Vibe Prospecting has 150M+ companies and 800M+ professionals, with verified contact information, firmographics, technographics, hiring trends, intent signals, funding events, and more.": "把你的 Claude agent 变成一个潜客开发平台。就在 Claude 里查找任意公司或专业人士。获取联系方式、职位、技术栈、商业动态、网站变更、意图数据等等。构建线索名单、调研潜客、识别人才并打造个性化触达，全程不离开对话。Vibe Prospecting 提供由 50+ 数据源支撑的新鲜 B2B 数据。Vibe Prospecting 拥有 1.5 亿+ 家公司和 8 亿+ 名专业人士，含经核实的联系方式、企业属性、技术画像、招聘趋势、意图信号、融资事件等。",
    "Bring your meetings into Claude": "把你的会议带入 Claude",
    "Your meetings are full of decisions, context, and next steps that shouldn't stay locked in a recording. The Read AI connector gives Claude direct access to your meeting data - including full transcripts, summaries, action items, key questions, topics, and engagement metrics. Browse recent meetings or pull up a specific session and use what was actually said as the starting point for follow-up work: drafting documents, extracting commitments, prepping for the next conversation, or synthesizing themes across multiple calls.": "你的会议充满了不该锁在录制里的决策、上下文和下一步。Read AI 连接器让 Claude 直接访问你的会议数据——包括完整转写、摘要、行动项、关键问题、话题和参与度指标。浏览近期会议或调出某场会议，把真正说过的话作为后续工作的起点：起草文档、提取承诺、为下一次对话做准备，或跨多场通话综合主题。",
    "Search the BioRender library, find your files, and generate new scientific figures directly from Claude.": "搜索 BioRender 素材库、查找你的文件，并在 Claude 中直接生成新的科研配图。",
    "Search BioRender's library of scientific templates, find your files, and generate custom first-draft figures with AI. Results and previews appear right in your conversation, and every item links back to BioRender so you can open and keep editing.": "搜索 BioRender 的科学模板库、查找你的文件，并用 AI 生成定制的初稿配图。结果和预览就在你的对话中出现，每一项都链接回 BioRender，让你能打开并继续编辑。",
    "Query live data about deals, engagement, and pipeline": "查询关于交易、互动和销售管道的实时数据",
    "Access your live Salesloft data directly inside Claude. Ask about deals, accounts, contacts, conversations, and pipeline status — and get answers grounded in real engagement data, call transcripts, and deal activity. Secured with OAuth 2.0 and role-scoped permissions so you only see your own data.": "直接在 Claude 内访问你的实时 Salesloft 数据。询问交易、客户、联系人、对话和管道状态——得到扎根于真实互动数据、通话转写和交易活动的答案。用 OAuth 2.0 和按角色划分的权限保护，让你只看到自己的数据。",
    "Legal research across millions of court records": "在数百万份法院记录中进行法律检索",
    "Connects Claude to CourtListener, the Free Law Project's legal research platform, with access to millions of U.S. court opinions, PACER dockets, judge profiles, oral arguments, and citation data. Search case law across federal and state courts, retrieve full case metadata, extract and verify legal citations against a canonical database, and set up alerts for new opinions or docket updates. Built and operated by Free Law Project, a 501(c)(3) nonprofit dedicated to making the law broadly accessible. Suited for attorneys, legal researchers, journalists, academics, and pro se litigants who need fast, reliable access to primary legal sources.": "把 Claude 连接到 CourtListener——Free Law Project 的法律检索平台，可访问数百万份美国法院意见、PACER 案卷、法官档案、口头辩论和引用数据。跨联邦和州法院检索判例，检索完整案件元数据，对照权威数据库提取并核验法律引用，并为新意见或案卷更新设置提醒。由 Free Law Project（一个致力于让法律广泛可及的 501(c)(3) 非营利组织）构建和运营。适合需要快速、可靠地访问一手法律来源的律师、法律研究者、记者、学者和自我代理诉讼当事人。",
    "Analyze campaigns, know your audience and create drafts": "分析活动、了解受众并创建草稿",
    "Connect Brevo to Claude to analyze email campaign performance and A/B test results, look up contacts, and explore audience segments in plain language, all without leaving your conversation. Claude can also generate HTML email templates, draft email campaigns, and draft SMS campaigns, saved directly to your Brevo account for you to review before sending. Claude will never send or schedule email campaigns, and will never delete anything on your behalf. Available on all Brevo plans.": "把 Brevo 连接到 Claude，用大白话分析邮件营销活动效果和 A/B 测试结果、查询联系人、探索受众细分，全程不离开对话。Claude 还能生成 HTML 邮件模板、起草邮件营销活动和短信营销活动，直接保存到你的 Brevo 账户供你发送前审阅。Claude 绝不会发送或安排邮件营销活动，也绝不会代你删除任何东西。所有 Brevo 套餐均可用。",
    "Answer questions with the Hex agent": "用 Hex agent 解答问题",
    "Connect to your Hex workspace to get data insights directly in Claude. Find Hex projects and answer questions with the Hex agent.": "连接到你的 Hex 工作区，直接在 Claude 中获取数据洞察。查找 Hex 项目，并用 Hex agent 解答问题。",
    "Drug target discovery and prioritisation platform": "药物靶点发现与优先级排序平台",
    "This MCP provides a purpose-built interface and instructions to access and interpret the data and analyses in the Open Targets Platform. The Open Targets Platform is a comprehensive tool that supports systematic identification and prioritisation of potential therapeutic drug targets, integrating publicly available datasets to build and score target-disease associations. It also integrates relevant annotation information about targets, diseases/phenotypes, drugs, variants, GWAS and molecular QTL studies, and credible sets, as well as their most relevant relationships.": "这个 MCP 提供一个专门构建的接口和指令，用于访问和解读 Open Targets 平台中的数据和分析。Open Targets 平台是一个全面的工具，支持系统性地识别和优先排序潜在的治疗药物靶点，整合公开数据集来构建并评分靶点-疾病关联。它还整合关于靶点、疾病/表型、药物、变异、GWAS 和分子 QTL 研究以及可信集的相关注释信息，以及它们最相关的关系。",
    "Search, share content, and take action to win deals": "搜索、分享内容并采取行动赢得订单",
    "Demo PDF viewer that renders PDFs from allowed URLs like arxiv.org": "演示版 PDF 查看器，渲染来自 arxiv.org 等允许 URL 的 PDF",
    "Demo interactive PDF viewer that renders PDFs from a limited set of allowed URLs (e.g., arxiv.org) for security reasons.": "演示版交互式 PDF 查看器，出于安全原因，只渲染来自一组受限允许 URL（如 arxiv.org）的 PDF。",
    "Motion connects Claude to your meta ad data. Analyze creative performance across campaigns — surface top performers, spot declining creatives, and understand what's working and why. Research competitor ad libraries for trends and inspiration. Access demographic breakdowns, creative transcripts, and performance reports. Motion helps marketers make faster, data-driven decisions about what to create next.": "Motion 把 Claude 连接到你的 Meta 广告数据。跨营销活动分析创意表现——呈现表现最好的、发现下滑的创意，理解什么有效、为何有效。研究竞品广告库以获取趋势和灵感。访问人口画像分解、创意转写和业绩报告。Motion 帮营销人员更快地做出数据驱动的决策，想清楚下一步创作什么。",
    "Deep research any account's teams, tech, and people": "深入调研任意客户的团队、技术栈和人员",
    "Search, compare and book flights, dynamic packages (flight + hotel) and hotels across global airlines and hotel suppliers.": "跨全球航司和酒店供应商搜索、比价并预订机票、动态套餐（机票+酒店）和酒店。",
    "Access real-time flight and hotel data directly through Claude to search, compare, and book flights, dynamic packages (flight + hotel), and hotels across a global network of airlines and hotel suppliers. Benefit from instant price comparisons, flexible filters, and intelligent recommendations that seamlessly integrate Claude's capabilities into your travel planning. Enhance your workflow with comprehensive flight, dynamic package, and hotel search powered by lastminute.com.": "直接通过 Claude 访问实时航班和酒店数据，跨全球航司和酒店供应商网络搜索、比较并预订机票、动态套餐（机票+酒店）和酒店。享受即时比价、灵活筛选和智能推荐，把 Claude 的能力无缝融入你的旅行规划。用 lastminute.com 驱动的全面航班、动态套餐和酒店搜索增强你的工作流。",
    "Find live jobs on ZipRecruiter without leaving Claude. Search by job title, company, or location, then narrow results by salary, distance, remote or hybrid work, employment type, and date posted. After reviewing a listing, jump to ZipRecruiter to apply.": "不离开 Claude 就能在 ZipRecruiter 上找到在招职位。按职位名、公司或地点搜索，再按薪资、距离、远程或混合办公、雇佣类型和发布日期缩小结果。看完职位后，跳转到 ZipRecruiter 投递。",
    "Up-to-date investment and market insights": "最新的投资与市场洞察",
    "The Morningstar connector makes it simple to power your AI apps and tools with Morningstar’s trusted content. It provides access to a growing library of AI-ready capabilities, including global analyst research, market analysis, and key investment data.": "Morningstar 连接器让你轻松用 Morningstar 可信的内容为你的 AI 应用和工具赋能。它提供对不断增长的 AI 就绪能力库的访问，包括全球分析师研究、市场分析和关键投资数据。",
    "Search, update, and prep deals without switching tabs.": "搜索、更新并准备交易，无需切换标签页。",
    "Bring your Affinity data into Claude to search contacts, companies, and deals; prep for meetings using your actual notes and interaction history; and update records as deals progress. Every email captured, every meeting logged, every relationship scored by your firm is now available directly in the conversation.": "把你的 Affinity 数据带入 Claude，搜索联系人、公司和交易；用你真实的笔记和互动历史为会议做准备；并在交易推进时更新记录。你公司捕获的每封邮件、记录的每场会议、评分的每段关系，现在都直接在对话中可用。",
    "Analyze business data": "分析业务数据",
    "Analyze data from your Pigment workspace without leaving Claude. Query metrics, surface insights, generate forecasts, and create reports. All requests respect your existing permissions and access controls. Ideal for finance teams, analysts, and planners who need quick insights from their planning data to make informed decisions.": "不离开 Claude 就能分析你 Pigment 工作区的数据。查询指标、呈现洞察、生成预测并创建报告。所有请求都尊重你现有的权限和访问控制。特别适合需要从规划数据中快速获得洞察以做出明智决策的财务团队、分析师和规划人员。",
    "Connect AI agents to enterprise data & context": "把 AI agent 连接到企业数据和上下文",
    "DataHub's MCP server gives AI agents the enterprise context they need to work with your data. Surface curated knowledge — runbooks, FAQs, business definitions, and vocabularies — so agents operate with the same shared understanding as your teams. Search across datasets, dashboards, and pipelines, then pull ownership, governance policies, quality signals, and documentation to understand what you're looking at. Trace lineage at the table and column level. Surface real SQL queries to see how data is actually used. Apply tags, glossary terms, owners, and descriptions at scale. The context layer that makes AI agents enterprise-ready.": "DataHub 的 MCP 服务器为 AI agent 提供处理你数据所需的企业上下文。呈现精选知识——运维手册、FAQ、业务定义和词表——让 agent 以与你团队相同的共识运作。跨数据集、仪表盘和管道搜索，再拉取归属、治理策略、质量信号和文档，理解你正在看的是什么。在表级和列级追踪血缘。呈现真实的 SQL 查询，看数据实际如何被使用。大规模应用标签、术语表条目、负责人和描述。让 AI agent 具备企业就绪能力的上下文层。",
    "Intelligent finance automation": "智能财务自动化",
    "Connect Brex to Claude for automating your company's finances. Finance monitors compliance and runs powerful queries. Employees get personalized memo guidance, policy answers, and status updates. Permission-based access ensures admin oversight while streamlining management.": "把 Brex 连接到 Claude，自动化你公司的财务。财务团队监控合规并运行强大的查询。员工获得个性化的备注指引、政策答案和状态更新。基于权限的访问在精简管理的同时确保管理员的监督。",
    "Unlock your meeting intelligence": "解锁你的会议智能",
    "Otter's MCP Server integrates with Otter.ai's meeting intelligence platform, enabling users to search meeting transcripts, retrieve conversation records, and extract insights. It provides tools to find meetings by date, participants, or topics, and access full transcripts, summaries, and action items. This helps teams review past discussions and prepare for meetings without leaving Claude.": "Otter 的 MCP 服务器与 Otter.ai 的会议智能平台集成，让用户能搜索会议转写、检索对话记录并提取洞察。它提供按日期、参会者或话题查找会议的工具，并访问完整转写、摘要和行动项。这帮助团队回顾过往讨论、为会议做准备，全程不离开 Claude。",
    "Build surveys, analyze responses, and uncover trends in SurveyMonkey—right from Claude. Turn feedback into clear next steps without leaving your workflow.": "在 SurveyMonkey 中构建问卷、分析回复并发现趋势——就在 Claude 里。不离开工作流就把反馈变成清晰的下一步。",
    "Discover, evaluate, and buy solutions for the cloud": "发现、评估并采购云端解决方案",
    "Access AWS Marketplace directly from Claude to discover, evaluate, and procure cloud solutions. AWS Marketplace MCP helps you find the ideal technology solution from over 30K software, data, and services on AWS Marketplace, compare alternatives, and request private offers from sellers. Get contextual suggestions, relevant insights, and next best action suggestions as your explore AWS Marketplace catalog - all within Claude.": "直接从 Claude 访问 AWS Marketplace，发现、评估并采购云解决方案。AWS Marketplace MCP 帮你从 AWS Marketplace 上 3 万+ 款软件、数据和服务中找到理想的技术方案，比较备选并向卖家申请私有报价。在你探索 AWS Marketplace 目录时获得贴合上下文的建议、相关洞察和下一步最佳行动建议——全部在 Claude 内。",
    "CRM that remembers everything and works for you.": "记住一切、为你效力的 CRM。",
    "Access and manage your CRM directly from Claude. Search, create, and update accounts, contacts, opportunities, notes, tasks, and lists — all through natural language. Look up records, filter by any field, track deals through your pipeline, and manage your workspace without leaving the conversation.": "直接从 Claude 访问和管理你的 CRM。搜索、创建和更新客户、联系人、商机、备注、任务和列表——全部通过自然语言。查询记录、按任意字段筛选、在管道中跟踪交易，并管理你的工作区，全程不离开对话。",
    "Build powerful communications and customer engagement": "构建强大的通信和客户互动",
    "Search Twilio’s APIs and build customer engagement experiences directly from Claude. Across more than 1,800 endpoints, Twilio MCP surfaces the exact specs and code patterns you need for channels like voice, email, and SMS/RCS, as well as user identity, customer data, contact center, and conversational AI. Get straight to the right API details and implementation guidance without loading full API docs into context or leaving your IDE.": "搜索 Twilio 的 API，直接从 Claude 构建客户互动体验。跨 1800 多个端点，Twilio MCP 呈现你所需的确切规格和代码模式，覆盖语音、邮件、SMS/RCS 等渠道，以及用户身份、客户数据、联络中心和对话式 AI。直达正确的 API 细节和实现指导，无需把完整 API 文档加载进上下文，也无需离开你的 IDE。",
    "Fetch Transcripts & Notes from Meet, Zoom & Teams": "从 Meet、Zoom 和 Teams 抓取会议记录和笔记",
    "Access Google Meet, Zoom & Teams meeting transcripts. Yours, and those from your team & company.": "访问 Google Meet、Zoom 和 Teams 的会议转写。你自己的，以及你团队和公司的。",
    "Notes & second brain": "笔记与第二大脑",
    "Create beautifully structured documents, manage tasks, and build a personal knowledge base - all directly from Claude. Give Claude a persistent workspace to save research, draft content, track to-dos, and organize everything into folders, so your best thinking lives beyond the conversation.": "创建结构精美的文档、管理任务、构建个人知识库——全部直接从 Claude。给 Claude 一个持久的工作空间来保存调研、起草内容、跟踪待办，并把一切整理进文件夹，让你最好的思考留存于对话之外。",
    "Access best in class data & analytics across a broad spectrum of asset classes.": "跨广泛资产类别访问一流的数据与分析。",
    "The LSEG Connector provides real-time access to LSEG's comprehensive financial market data ecosystem, spanning across asset classes and domains. It enables seamless integration of institutional-grade market data, analytics, and valuation tools directly into conversational AI workflows, allowing users to access deep market insights, perform complex calculations, and analyze financial instruments through natural language interactions.": "LSEG 连接器提供对 LSEG 全面金融市场数据生态的实时访问，跨越各资产类别和领域。它把机构级市场数据、分析和估值工具无缝集成进对话式 AI 工作流，让用户通过自然语言交互访问深度市场洞察、执行复杂计算并分析金融工具。",
    "Search, create and manage your tasks/habit it TickTick.": "在 TickTick 中搜索、创建并管理你的任务/习惯。",
    "Allow Claude to seamlessly manage your productivity and time blocking by tracking, organizing, and updating your TickTick tasks directly within your chat workflow.": "让 Claude 通过在你的对话流内跟踪、组织和更新你的 TickTick 任务，无缝管理你的效率和时间分块。",
    "Search and explore skill-building resources": "搜索并探索技能提升资源",
    "Udemy Business MCP brings our comprehensive AI-powered skills development platform directly into your AI tools. Employees discover and access expertly curated courses via personalized search and recommendations. This enables just-in-time learning in the flow of work with enterprise-grade security and scalability.": "Udemy Business MCP 把我们全面的 AI 驱动技能提升平台直接带入你的 AI 工具。员工通过个性化搜索和推荐发现并访问专家精选的课程。这在工作流中实现即时学习，并具备企业级的安全和可扩展性。",
    "Manage your time off without leaving Claude": "无需离开 Claude 即可管理你的休假",
    "The isolved People Cloud connector lets employees manage their own time off through Claude. Check balances across all leave types, view pending and approved requests, and submit new requests by specifying leave type, dates, and hours. Claude confirms all the details before submitting anything. Built for employees of organizations that use isolved People Cloud for HCM; authenticates via OAuth and only accesses your own data.": "isolved People Cloud 连接器让员工通过 Claude 管理自己的休假。查看各类假期的余额、查看待批和已批的请求，并通过指定假期类型、日期和小时数提交新请求。Claude 会在提交任何内容前确认所有细节。为使用 isolved People Cloud 做 HCM 的组织的员工打造；通过 OAuth 认证，只访问你自己的数据。",
    "Real estate market intelligence from Yardi Matrix": "来自 Yardi Matrix 的房地产市场情报",
    "Ask straightforward questions about properties, markets and portfolios to get the answers you need from Yardi Matrix. Search properties by location, owner or risk profile; pull rent trends and occupancy metrics; benchmark portfolios against their markets; surface distressed assets and acquisition opportunities; and generate data-rich market intelligence reports. Yardi Matrix is designed for analysts, investors and asset managers who need reliable real estate data quickly to make informed decisions.": "就物业、市场和资产组合提出直白的问题，从 Yardi Matrix 获得你需要的答案。按地点、业主或风险画像搜索物业；拉取租金趋势和入住率指标；把资产组合与其市场对标；呈现困境资产和收购机会；并生成数据丰富的市场情报报告。Yardi Matrix 为需要快速获得可靠房地产数据以做出明智决策的分析师、投资者和资产管理者打造。",
    "Explore partner data and ecosystem insights in Claude": "在 Claude 中探索合作伙伴数据和生态系统洞察",
    "Connect your Claude workspace to Crossbeam and bring Ecosystem Intelligence into every AI workflow. The Crossbeam MCP Server lets Claude securely access your partner and account data — surfacing overlaps, partner activity, and warm paths directly in chat. Use it to enrich AI responses with real-time ecosystem context, power smarter prioritization, and uncover co-sell opportunities without leaving your conversation.": "把你的 Claude 工作区连接到 Crossbeam，为每个 AI 工作流带来生态系统情报。Crossbeam MCP 服务器让 Claude 安全地访问你的合作伙伴和客户数据——直接在对话中呈现重叠、合作伙伴活动和温暖引荐路径。用它为 AI 回答注入实时的生态上下文、驱动更聪明的优先级排序，并发现联合销售机会，全程不离开对话。",
    "Explore, search, and query your data in Sigma directly from the Claude interface. You can search across your organization for relevant documents and elements, and answer and iterate on complex data questions. Perform detailed analysis without needing to write SQL and use natural language to seamlessly uncover insights, so you can act faster on your data.": "直接从 Claude 界面探索、搜索并查询你在 Sigma 中的数据。你可以跨你的组织搜索相关文档和元素，并解答和迭代复杂的数据问题。无需写 SQL 就能做详细分析，用自然语言无缝挖掘洞察，让你更快地对数据采取行动。",
    "Search and analyze Ramp spend across 50,000+ businesses": "搜索并分析 50,000+ 家企业的 Ramp 支出",
    "Ramp Data MCP enables Claude users to access Ramp Data from billions of dollars in real corporate spend across 50,000+ businesses, including Ramp Rate (vendor adoption, pricing, and switching trends) and the AI Index (how businesses are spending on AI). Ramp Data is used by founders, procurement leads, researchers, investors, and policy analysts and is cited by leading publications like NYT, WSJ, Bloomberg, and more.": "Ramp Data MCP 让 Claude 用户能访问来自 50,000+ 家企业、数十亿美元真实公司支出的 Ramp 数据，包括 Ramp Rate（供应商采用、定价和切换趋势）和 AI Index（企业在 AI 上的支出情况）。Ramp Data 被创始人、采购负责人、研究者、投资者和政策分析师使用，并被 NYT、WSJ、Bloomberg 等顶级媒体引用。",
    "The AI platform for recruiting.": "面向招聘的 AI 平台。",
    "Bring Metaview's hiring intelligence into Claude. Search, analyze, and extract insights from your recruiting data. Query conversations, source candidates, and start outreach. Use Claude alongside Metaview's AI agents to turn every conversation and signal into faster, better hiring decisions.": "把 Metaview 的招聘智能带入 Claude。搜索、分析并从你的招聘数据中提取洞察。查询对话、寻源候选人并开始触达。把 Claude 与 Metaview 的 AI agent 一起使用，把每段对话和信号变成更快、更好的招聘决策。",
    "Access PayPal payments platform": "访问 PayPal 支付平台",
    "The PayPal MCP server enables AI agents to interact with the PayPal platform. PayPal is a global online payments system that supports online money transfers and serves as an electronic alternative to traditional paper methods like checks and money orders. This MCP server allows AI assistants to programmatically access and manage PayPal account information, transaction details, payment processing, and potentially other financial services offered by PayPal.": "PayPal MCP 服务器让 AI agent 能与 PayPal 平台交互。PayPal 是一个全球在线支付系统，支持在线转账，作为支票和汇票等传统纸质方式的电子替代。这个 MCP 服务器让 AI 助手能以编程方式访问和管理 PayPal 账户信息、交易详情、支付处理，以及 PayPal 提供的其他金融服务。",
    "Data & AI observability": "数据与 AI 可观测性",
    "The Monte Carlo MCP server gives Claude direct access to your data & AI observability platform. Query alerts, explore lineage, create monitors, and evaluate AI agent performance across your entire data stack.": "Monte Carlo MCP 服务器让 Claude 直接访问你的数据和 AI 可观测性平台。查询告警、探索血缘、创建监控，并跨你的整个数据栈评估 AI agent 表现。",
    "Access the CMS Coverage Database": "访问 CMS 保障范围数据库",
    "Analyze your brand's visibility across LLMs": "分析你的品牌在各 LLM 中的可见度",
    "Monitor and analyze your brand's visibility across AI search engines. Track your visibility, sentiment, and share of voice and compare to competitors.": "监控并分析你的品牌在各 AI 搜索引擎中的可见度。跟踪你的可见度、情绪和声量占比，并与竞品对比。",
    "Query your Ontra data directly from any AI tool": "从任意 AI 工具直接查询你的 Ontra 数据",
    "The Ontra MCP Server lets you query your Ontra data directly from Claude and other AI tools — no need to switch between applications. Ask questions about legal entities, ownership structures, funds, people, agreements, tax classifications, jurisdictions, and more. Results respect your existing Ontra permissions, so users only see data they already have access to. Setup takes about a minute via a quick OAuth flow with your Ontra credentials.": "Ontra MCP 服务器让你直接从 Claude 和其他 AI 工具查询你的 Ontra 数据——无需在应用之间切换。就法律实体、股权结构、基金、人员、协议、税务分类、司法辖区等提问。结果尊重你现有的 Ontra 权限，用户只看到自己本就有权访问的数据。用你的 Ontra 凭据通过快速 OAuth 流程配置，约一分钟搞定。",
    "Search, manage, and update your Attio CRM from Claude": "在 Claude 中搜索、管理并更新你的 Attio CRM",
    "Access your entire CRM directly from Claude. Look up contacts and companies, find decision makers, and discover email addresses. Log notes from calls and meetings, track engagement history, and create follow-up tasks with deadlines. Search and filter your pipeline by stage, funding round, role, or location. Tap into meeting intelligence—search call recordings, access transcripts, and surface key insights. Make Attio a seamless part of your AI workflow, so you can manage relationships and close deals faster without switching tools.": "直接从 Claude 访问你的整个 CRM。查询联系人和公司、找到决策人、发现邮箱地址。记录通话和会议的备注、跟踪互动历史，并创建带截止日期的后续任务。按阶段、融资轮、角色或地点搜索和筛选你的管道。接入会议智能——搜索通话录音、访问转写、呈现关键洞察。让 Attio 成为你 AI 工作流的无缝一环，让你无需切换工具就能管理关系、更快成交。",
    "Search and interact with your company knowledge": "搜索你的公司知识并与之交互",
    "Guru's MCP Server connects Anthropic's Claude to your company's trusted knowledge layer, so every AI answer is grounded in verified, permission-aware information—not outdated docs or hallucinations. It links Claude to the same governed context your teams use, ensuring consistent, cited, and explainable responses. With built-in verification and lineage, the Guru MCP Server makes it easy for Claude to deliver answers you can trust across every workflow.": "Guru 的 MCP 服务器把 Anthropic 的 Claude 连接到你公司可信的知识层，让每个 AI 答案都扎根于经验证、感知权限的信息——而非过时的文档或幻觉。它把 Claude 连接到你团队使用的同一套受治理的上下文，确保回答一致、有引用、可解释。凭借内置的验证和溯源，Guru MCP 服务器让 Claude 能在每个工作流中给出你可信赖的答案。",
    "Financial fundamental data and KPIs with hyperlinks": "带超链接的财务基本面数据和 KPI",
    "Daloopa supplies high quality fundamental data sourced from SEC Filings, investor presentations and any public financial documents, with hyperlinks to source document overlaying each data point. Provides a zero-hallucination foundation for any quantitative financial analysis in Claude.": "Daloopa 提供源自 SEC 文件、投资者演示和任何公开财务文档的高质量基本面数据，每个数据点上都覆盖着指向源文档的超链接。为你在 Claude 中的任何定量财务分析提供零幻觉的基础。",
    "Ask Embat about cash, debt, payments, and accounting": "向 Embat 询问现金、债务、支付和会计事宜",
    "Query your cash, debt, treasury forecasts, accounting, PSP reconciliations, payments, and intercompany positions in plain language — answered with your real numbers from Embat. TellMe is read-only and inherits your existing permissions, so every reply is scoped to what you can already see. Make your treasury management system a native part of your AI workflow, without leaving the conversation.": "用大白话查询你的现金、债务、资金预测、会计、PSP 对账、支付和公司间头寸——由 Embat 用你的真实数字作答。TellMe 是只读的，并继承你现有的权限，所以每个回复都限定在你本就能看到的范围内。让你的资金管理系统成为你 AI 工作流的原生一环，全程不离开对话。",
    "Automate workflows and connect your business apps": "自动化工作流并连接你的业务应用",
    "Execute enterprise automation recipes, manage integrations between business applications, monitor workflow performance, and create complex data transformations through Workato’s enterprise automation platform. Build and deploy sophisticated business process automations using natural language commands for streamlined operations.": "通过 Workato 的企业自动化平台执行企业自动化配方、管理业务应用之间的集成、监控工作流表现，并创建复杂的数据转换。用自然语言命令构建并部署复杂的业务流程自动化，实现精简运营。",
    "Create, query, and manage structured content in Sanity": "在 Sanity 中创建、查询并管理结构化内容",
    "Create, query, and manage your structured content in Sanity directly from Claude. Run content audits, update documents, coordinate releases, and find anything across your projects. Or set up entirely new projects – schemas, content, and configuration – just by chatting with Claude.": "直接从 Claude 在 Sanity 中创建、查询并管理你的结构化内容。运行内容审计、更新文档、协调发布，并跨你的项目查找任何东西。或者只需与 Claude 聊天，就能搭建全新的项目——schema、内容和配置。",
    "Query your data using natural language through Omni's semantic model": "通过 Omni 的语义模型用自然语言查询你的数据",
    "Query Omni using the same semantic model, permissions, and logic defined by your data team directly from Claude. Instantly answer questions about your business using natural language — no need to write SQL or navigate complex dashboards. Your Omni semantic model becomes Claude's knowledge of your data, enabling secure, governed, and consistent analytics workflows across your organization.": "直接从 Claude 用你数据团队定义的同一套语义模型、权限和逻辑查询 Omni。用自然语言即时回答关于你业务的问题——无需写 SQL 或在复杂仪表盘里穿梭。你的 Omni 语义模型成为 Claude 对你数据的认知，在你的组织中实现安全、受治理、一致的分析工作流。",
    "Search and analyze customer feedback": "搜索并分析客户反馈",
    "Search and analyze your customer feedback with Unwrap. Pull in customer feedback themes and anecdotes, filter by metadata and analyze trends with issues over time. Use your customers feedback to build data backed roadmaps, PRD's, and more!": "用 Unwrap 搜索并分析你的客户反馈。引入客户反馈的主题和实例，按元数据过滤，并用随时间变化的问题分析趋势。用你的客户反馈构建有数据支撑的路线图、PRD 等！",
    "Query Turquoise's proprietary healthcare pricing data": "查询 Turquoise 专有的医疗定价数据",
    "Connect Turquoise to Claude to explore Turquoise Health's healthcare pricing data. You can search across healthcare entities, explore how they relate to each other, and analyze in-network rates across service categories. Useful for benchmarking reimbursement rates, sizing markets, understanding what a payer pays in a given geography, or comparing rates across providers and plans.": "把 Turquoise 连接到 Claude，探索 Turquoise Health 的医疗定价数据。你可以跨医疗实体搜索、探索它们之间的关系，并跨服务类别分析网络内费率。适合对标报销费率、估算市场规模、了解某支付方在特定地区支付多少，或跨提供者和计划比较费率。",
    "Risk insights, analytics, and decision intelligence": "风险洞察、分析与决策智能",
    "Moody's GenAI-Ready Data powers AI applications with access to Moody's Ratings proprietary credit ratings, research, and comprehensive entity intelligence. Get streamlined access to high-quality data such as ownership structures, financials, ratings drivers, and scorecards, all structured to optimize a variety of workflows including compliance, credit analysis, M&A, and business development.": "Moody's GenAI-Ready Data 为 AI 应用赋能，让其访问 Moody's Ratings 专有的信用评级、研究和全面的实体情报。精简地访问高质量数据，如股权结构、财务、评级驱动因素和评分卡，全部经过结构化以优化合规、信用分析、并购和业务拓展等多种工作流。",
    "Connect and use PlayMCP servers in your toolbox": "在你的工具箱中连接并使用 PlayMCP 服务器",
    "You can add a variety of MCP servers, including Kakao services registered in PlayMCP, to your toolbox and use them through the Connector.": "你可以把各种 MCP 服务器（包括在 PlayMCP 注册的 Kakao 服务）加入你的工具箱，并通过连接器使用它们。",
    "Analyze user insights from Listen Labs": "分析来自 Listen Labs 的用户洞察",
    "Browse your Listen Labs studies, pull response data, review study designs, and surface analysis insights directly from Claude. Make Listen Labs a native part of your research workflow, an AI-powered research assistant that helps you synthesize qualitative findings faster, with deeper insight.": "直接从 Claude 浏览你的 Listen Labs 研究、拉取回复数据、查看研究设计并呈现分析洞察。让 Listen Labs 成为你研究工作流的原生一环——一个 AI 驱动的研究助手，帮你更快、更深入地综合定性发现。",
    "Your GTM Copilot": "你的 GTM 副驾",
    "Embed complete buyer intelligence directly within Claude. Research accounts and contacts, surface buying signals, and browse activity history - all through natural language. Build prospect lists of net-new companies by industry, size, tech stack, or location. Filter and sort contacts by segment, role, lead score, or website visits. Every result is grounded in real context, real prioritization, and real revenue opportunity directly from your CRM fields, scores, enrichment, and signals - so you always know what's actually happening in your accounts.": "把完整的买家情报直接嵌入 Claude。调研客户和联系人、呈现购买信号、浏览活动历史——全部通过自然语言。按行业、规模、技术栈或地点构建全新公司的潜客名单。按细分、角色、线索评分或网站访问筛选和排序联系人。每个结果都直接扎根于你 CRM 字段、评分、数据丰富和信号中的真实上下文、真实优先级和真实营收机会——让你随时清楚你的客户身上究竟在发生什么。",
    "Create, send, sign and track documents": "创建、发送、签署并跟踪文档",
    "PandaDoc lets you create, send, and track documents for signature directly from your Claude conversation. Ask Claude to prepare an NDA from your existing templates, send a proposal to a client, check which contracts are still waiting to be signed, or pull the complete audit trail for any document. Connect your PandaDoc account to manage your entire document workflow without leaving the conversation.": "PandaDoc 让你直接从 Claude 对话中创建、发送并跟踪待签署文档。让 Claude 用你现有的模板准备一份 NDA、给客户发一份提案、查看哪些合同还在等待签署，或拉取任意文档的完整审计轨迹。连接你的 PandaDoc 账户，全程不离开对话就能管理你的整个文档工作流。",
    "Let Claude sketch, draw, and diagram with you": "让 Claude 与你一起速写、绘图和画图表",
    "Draw and diagram while you work with tldraw + Claude. Ask for a flowchart, architecture diagram, wireframe, or mind map and it appears. Edit it, and the AI sees your changes in real time, building on them, refining them, or using them as a starting point for other tasks.": "用 tldraw + Claude，一边工作一边绘图和画图表。要一张流程图、架构图、线框图或思维导图，它就出现。编辑它，AI 会实时看到你的改动，在其基础上构建、打磨，或把它作为其他任务的起点。",
    "Chat with your meetings to uncover actionable insights": "与你的会议对话，挖掘可落地的洞察",
    "Access your meeting knowledge instantly. Fellow connects Claude to your meeting ecosystem, letting you search transcripts, pull key insights from summaries, and track action items with natural-language queries.": "即时访问你的会议知识。Fellow 把 Claude 连接到你的会议生态，让你用自然语言查询搜索转写、从摘要中提取关键洞察并跟踪行动项。",
    "Connect any AI to your Remote employment infrastructure": "把任意 AI 连接到你的 Remote 雇佣基础设施",
    "Remote operates global employment - contracts, payroll, compliance, legal entities, org structure, and time off. Remote MCP gives any AI tool a live, secure connection to that infrastructure. Query workforce data in natural language, build compliance dashboards, plan reorgs, audit contracts, and automate HR workflows.": "Remote 运营全球雇佣——合同、薪资、合规、法律实体、组织结构和休假。Remote MCP 为任意 AI 工具提供对这套基础设施的实时、安全连接。用自然语言查询劳动力数据、构建合规仪表盘、规划组织调整、审计合同并自动化 HR 工作流。",
    "Power AI Workflows with Customer Context": "用客户上下文驱动 AI 工作流",
    "Bring in live customer intelligence from Gainsight's Staircase AI including customer sentiment, risk, engagement and insights - so every answer, insight, and recommendation is grounded in real customer context.": "引入来自 Gainsight 的 Staircase AI 的实时客户情报，包括客户情绪、风险、互动和洞察——让每个答案、洞察和建议都扎根于真实的客户上下文。",
    "Get food delivery to your doorstep from thousands of amazing local and national restaurants. Search and browse restaurants and dishes near you to find the meal you crave.": "从数千家优秀的本地和全国餐厅把外卖送到你家门口。搜索和浏览你附近的餐厅和菜品，找到你想吃的那一餐。",
    "Build production apps and manage Retool with AI agents": "用 AI agent 构建生产级应用并管理 Retool",
    "Connect Claude directly to your Retool workspace. Manage users, configure resources, and run admin operations directly from Claude Chat or Code.": "把 Claude 直接连接到你的 Retool 工作区。直接从 Claude Chat 或 Code 管理用户、配置资源并运行管理操作。",
    "Find your ideal hotel at the best price.": "以最优价格找到你的理想酒店。",
    "the trivago MCP server enables users to search for hotels and other accommodations using coordinates or broader geographic areas such as cities and countries. It provides tailored search results based on location and date inputs, helping users find suitable places to stay near specific points of interest or within larger regions. The server returns a list of hotels with prices from different providers, photos, accommodation details, and links to the accommodation details page.": "trivago MCP 服务器让用户用坐标或更宽泛的地理区域（如城市和国家）搜索酒店和其他住宿。它根据地点和日期输入提供量身定制的搜索结果，帮用户在特定兴趣点附近或更大区域内找到合适的住处。服务器返回一份酒店列表，含来自不同供应商的价格、照片、住宿详情，以及指向住宿详情页的链接。",
    "Governed knowledge. AI ready.": "受治理的知识。就绪于 AI。",
    "iManage Work Connector for MCP securely connects governed iManage content to Claude. Replace custom integrations with one open protocol, keep documents in iManage without bulk exports or replication, and ensure permission-bound, auditable Claude access as your AI strategy evolves.": "面向 MCP 的 iManage Work 连接器把受治理的 iManage 内容安全地连接到 Claude。用一个开放协议取代定制集成，把文档留在 iManage 中而无需批量导出或复制，并随着你的 AI 策略演进确保 Claude 的访问受权限约束、可审计。",
    "Build and manage Base44 apps": "构建并管理 Base44 应用",
    "Create, edit, and manage Base44 apps directly from Claude. Describe what you want to build and Base44 will generate a full-stack project for you — with data models, backend logic, and a working UI. Query your app's data, update entity schemas, and iterate on existing projects without ever leaving Claude. Make Base44 a native part of your AI workflow — an AI-powered app builder that turns ideas into production-ready apps, faster.": "直接从 Claude 创建、编辑和管理 Base44 应用。描述你想构建什么，Base44 就为你生成一个全栈项目——含数据模型、后端逻辑和可用的 UI。查询你应用的数据、更新实体 schema，并迭代现有项目，全程不离开 Claude。让 Base44 成为你 AI 工作流的原生一环——一个 AI 驱动的应用构建器，更快地把想法变成可上生产的应用。",
    "Build, govern, and document APIs": "构建、治理并编写 API 文档",
    "Work with your APIs and documentation through natural conversation using Swagger. Generate APIs from natural language, explore and search your API library with full context, and validate specifications against organizational governance policies. Automatically standardize and fix non-compliant APIs, and create, manage, and publish documentation portals and API definitions.": "用 Swagger 通过自然对话处理你的 API 和文档。从自然语言生成 API、带完整上下文地探索和搜索你的 API 库，并对照组织治理策略校验规格。自动标准化并修复不合规的 API，创建、管理和发布文档门户和 API 定义。",
    "Shorten links, generate QR Codes, and track performance": "缩短链接、生成二维码并跟踪效果",
    "Create, track, and manage Bitly links and QR Codes directly from Claude without switching contexts. Access 27 comprehensive tools spanning link creation, analytics, organizational management, and more—making this the most complete link management solution available in any AI assistant.": "直接从 Claude 创建、跟踪和管理 Bitly 链接和二维码，无需切换上下文。访问 27 个全面的工具，涵盖链接创建、分析、组织管理等——使之成为任何 AI 助手中最完整的链接管理方案。",
    "Comprehensive financial market data": "全面的金融市场数据",
    "Real-time and historical financial data through a suite of tools covering stocks, ETFs, crypto, forex, commodities, SEC filings, economic indicators, and more. Users can look up company fundamentals, pull financial statements, screen stocks, read earnings transcripts, track insider and congressional trades, and more. Elevate your financial analysis and investment research with trusted, institutional-quality data.": "通过一套工具获取实时和历史金融数据，涵盖股票、ETF、加密货币、外汇、大宗商品、SEC 文件、经济指标等。用户可以查询公司基本面、拉取财务报表、筛选股票、阅读财报电话会记录、跟踪内部人和国会交易等。用可信的机构级数据提升你的财务分析和投资研究。",
    "Fitch credit intelligence, inside your AI workflow": "惠誉信用情报，融入你的 AI 工作流",
    "Access trusted Fitch Ratings credit research and data, CreditSights intelligence, and BMI country and sector risk analysis — all through a single, governed MCP connection. Query ratings, financials, key rating drivers, research, and deal insights directly inside your AI workflows. Built for regulated environments with enterprise-grade authentication and entitlement controls. Fitch intelligence, where you work.": "通过单一、受治理的 MCP 连接访问可信的 Fitch Ratings 信用研究和数据、CreditSights 情报，以及 BMI 国家和行业风险分析。直接在你的 AI 工作流内查询评级、财务、关键评级驱动因素、研究和交易洞察。为受监管环境打造，具备企业级身份验证和授权控制。Fitch 情报，就在你工作的地方。",
    "Predictive intelligence on private companies": "关于非上市公司的预测性情报",
    "Unleash Claude as your private markets research agent. Source companies, build market maps, draft investment memos, and monitor competitors — all powered by CB Insights' predictive intelligence. Tap into 11M+ double-validated company profiles, leading coverage of recent equity deals, proprietary taxonomies, unique scores, hidden signals, and over 20 years of bleeding-edge technology research to identify and analyze relevant, high-potential companies ahead of your competition. Built for corporate strategists seeking acquisition targets, VCs screening deal flow, and business development teams hunting new partners. If your work involves private companies, CB Insights delivers the insight you need to make your next move first.": "把 Claude 化身为你的私募市场研究 agent。寻源公司、构建市场地图、起草投资备忘录并监控竞争对手——全部由 CB Insights 的预测性情报驱动。接入 1100 万+ 经双重验证的公司档案、对近期股权交易的领先覆盖、专有分类法、独特评分、隐藏信号，以及 20 多年的前沿技术研究，抢在竞争对手之前识别并分析相关的高潜力公司。为寻找收购标的的企业策略师、筛选交易流的 VC 和寻找新伙伴的业务拓展团队打造。如果你的工作涉及非上市公司，CB Insights 提供你抢先行动所需的洞察。",
    "Craft content that wins AI search": "打造赢得 AI 搜索的内容",
    "Access your workspaces, Brand Kits, and AEO analytics": "访问你的工作区、Brand Kit 和 AEO 分析。",
    "Find active tech jobs on Dice": "在 Dice 上寻找活跃的技术职位",
    "Access Dice's database of active tech jobs through conversational AI search. With 30+ years of tech-only specialization, Dice offers unparalleled breadth and depth—covering every tech discipline from AI/ML to cybersecurity, across companies of all sizes. Use natural language to search faster and more easily than ever. Ask for what you want conversationally, refine your criteria through chat, and navigate to real opportunities. Skip the complexity of traditional job board filters and narrow down your job search within Claude.": "通过对话式 AI 搜索访问 Dice 的在招技术职位数据库。凭借 30 多年只专注技术的积累，Dice 提供无与伦比的广度和深度——覆盖从 AI/ML 到网络安全的每一个技术领域，横跨各种规模的公司。用自然语言比以往任何时候都更快、更轻松地搜索。用对话说出你想要什么、通过聊天细化你的条件，并导航到真实的机会。跳过传统招聘网站过滤器的繁琐，在 Claude 里缩小你的求职范围。",
    "Turn AI insights into documents": "把 AI 洞察变成文档",
    "Goodnotes instantly converts AI conversations into editable Goodnotes files. Create custom vector graphics and illustrations from SVG code for freeform drawings, icons, logos, and artistic designs. Generate structured diagrams from Mermaid syntax including flowcharts, mindmaps, and timelines. Render markdown content as beautifully formatted rich text documents. Whether you've got text, flowcharts, or images, move your ideas from the chat to the page to refine, annotate, and share in the Goodnotes app.": "Goodnotes 即时把 AI 对话转换成可编辑的 Goodnotes 文件。从 SVG 代码创建自定义矢量图形和插画，用于自由绘图、图标、logo 和艺术设计。从 Mermaid 语法生成结构化图表，包括流程图、思维导图和时间线。把 markdown 内容渲染成排版精美的富文本文档。无论你有文字、流程图还是图片，把你的想法从对话搬到页面上，在 Goodnotes 应用中打磨、批注并分享。",
    "MCP server for Google Compute Engine": "面向 Google Compute Engine 的 MCP 服务器",
    "Enables you to agentically manage your cloud compute infrastructure spanning deployment and operations.": "让你以 agent 方式管理跨越部署和运维的云计算基础设施。",
    "Run reports using your metrics, dimensions, and segments": "用你的指标、维度和细分运行报表",
    "Access your Adobe Customer Journey Analytics data directly in Claude. Query metrics, dimensions, and segments programmatically to integrate cross-channel journey data from Adobe Customer Journey Analytics into your AI agents, workflows, and applications — and build analysis pipelines that match your own methodology. Pull metric data, create and manage segments and calculated metrics, and get instant answers directly in the conversation.": "直接在 Claude 中访问你的 Adobe Customer Journey Analytics 数据。以编程方式查询指标、维度和细分，把来自 Adobe Customer Journey Analytics 的跨渠道旅程数据集成进你的 AI agent、工作流和应用——并构建符合你自己方法论的分析流水线。拉取指标数据、创建并管理细分和计算指标，并直接在对话中获得即时答案。",
    "Connect your AI agents to the web": "把你的 AI agent 连接到网络",
    "Give Claude real-time web access with Tavily. One API for search, extraction, and research. Built for the accuracy, speed, and security production agents require. You can use Tavily to ground answers in live data, optimize token usage by extracting relevant content, and ship with security built in with PII redaction and prompt injection protection.": "用 Tavily 为 Claude 提供实时网络访问。搜索、提取和研究，一个 API 搞定。为生产级 agent 所需的准确性、速度和安全性打造。你可以用 Tavily 把答案扎根于实时数据、通过提取相关内容优化 token 使用，并凭借内置的 PII 打码和提示注入防护，安全地交付。",
    "Demo 3D viewer that renders interactive 3D scenes and models using Three.js": "演示版 3D 查看器，用 Three.js 渲染交互式 3D 场景和模型",
    "Demo interactive 3D viewer powered by Three.js, a popular JavaScript library for rendering 3D graphics in the browser. Generates and displays 3D scenes, models, and animations directly in the conversation.": "由 Three.js（一个在浏览器中渲染 3D 图形的流行 JavaScript 库）驱动的演示版交互式 3D 查看器。直接在对话中生成并显示 3D 场景、模型和动画。",
    "Access real-time financial data": "访问实时金融数据",
    "The Bigdata.com MCP server integrates institutional-grade data directly into your AI workflow, covering global news, transcripts, and regulatory filings directly in Claude. By combining Claude's reasoning with Bigdata.com's entity-aware search, you can automate complex due diligence and produce hallucination-free reports with full citation trails. Empower your decision-making with the only AI connector that is Grounded by Design for professional finance.": "Bigdata.com MCP 服务器把机构级数据直接集成进你的 AI 工作流，在 Claude 中覆盖全球新闻、纪要和监管文件。把 Claude 的推理与 Bigdata.com 的实体感知搜索结合，你可以自动化复杂的尽职调查，并产出带完整引用轨迹、无幻觉的报告。用这个唯一为专业金融「设计即扎根」的 AI 连接器为你的决策赋能。",
    "Persistent memory for AI agents & assistants": "为 AI agent 和助手提供持久记忆",
    "Connect Mem0 to Claude to give your agent persistent memory across sessions. Claude can store user preferences, project context, and conversation history, then search, update, or forget them as new information comes in. Useful for coding assistants that remember your codebase conventions, support agents that recall customer history, research workflows that build context over weeks, or any use case where Claude resets back to zero today. Memories are scoped per user, agent, or session. Cloud-hosted, no local install.": "把 Mem0 连接到 Claude，给你的 agent 跨会话的持久记忆。Claude 可以存储用户偏好、项目上下文和对话历史，然后随着新信息到来对它们进行搜索、更新或遗忘。适合记住你代码库约定的编码助手、回忆客户历史的客服 agent、跨数周积累上下文的研究工作流，或任何 Claude 如今会归零重来的用例。记忆按用户、agent 或会话划分。云托管，无需本地安装。",
    "Discuss and iterate on Magic Patterns designs": "讨论并迭代 Magic Patterns 设计稿",
    "Discuss and iterate on Magic Patterns designs directly from Claude. Magic Patterns is an AI agent specialized in frontend design.": "直接从 Claude 讨论并迭代 Magic Patterns 设计稿。Magic Patterns 是一个专注于前端设计的 AI agent。",
    "Get answers from unified feedback of your customers.": "从统一的客户反馈中获取答案。",
    "Turn customer feedback into answers you can act on, directly in Claude. Query your Enterpret knowledge graph across support tickets, Gong calls, app reviews, NPS surveys, Slack, and more. Every insight is traced back to real customer conversations with direct links. Just ask a question in plain language. No query language or setup needed.": "把客户反馈变成你可以据此行动的答案，就在 Claude 里。跨支持工单、Gong 通话、应用评价、NPS 问卷、Slack 等查询你的 Enterpret 知识图谱。每个洞察都可追溯回真实的客户对话，带直接链接。只需用大白话提问。无需查询语言或配置。",
    "Turn data into insight": "把数据变成洞察",
    "Query, write back and automate with real-time CS data": "用实时客户成功数据查询、回写并自动化",
    "Connect Claude directly to Gainsight CS to query customer health scores, renewal timelines, and product usage in natural language. Take action by updating records, managing CTAs, logging activities, and building success plans with write back to Gainsight. Power autonomous, multi-step workflows for risk escalation, renewal playbooks, QBR prep, and expansion plays. With unified, real-time context from Gainsight CS, your AI workflows can identify and execute actions across your entire customer book of business.": "把 Claude 直接连接到 Gainsight CS，用自然语言查询客户健康分、续约时间线和产品使用情况。通过更新记录、管理 CTA、记录活动并构建成功计划（回写到 Gainsight）来采取行动。为风险升级、续约剧本、QBR 准备和扩展打法驱动自主的多步工作流。有了来自 Gainsight CS 的统一、实时上下文，你的 AI 工作流能跨你整个客户业务簿识别并执行操作。",
    "Managed MCP platform for 350 sources": "面向 350 个数据源的托管 MCP 平台",
    "Connect Claude to read, write, and act on 350+ enterprise data sources like Salesforce, Snowflake and NetSuite in real-time through one fully hosted remote MCP server. Connect AI is the only managed MCP platform built with semantic intelligence that understands your data's metadata and relationships across systems for multi-source analysis. Ensure trusted boundaries with enterprise security, granular permissions, and complete audit trails. Set up any source in minutes and get started free.": "通过一个完全托管的远程 MCP 服务器，把 Claude 连接到 Salesforce、Snowflake 和 NetSuite 等 350+ 个企业数据源，实时读取、写入并采取行动。Connect AI 是唯一一个用语义智能构建的托管 MCP 平台，它理解你数据的元数据和跨系统关系，以做多源分析。用企业级安全、细粒度权限和完整审计轨迹确保可信边界。几分钟内配置任意数据源，免费开始。",
    "Connect your AI assistant directly to Workable. With 40+ tools spanning the full hiring lifecycle, you can manage jobs, move candidates through pipeline stages, add reviews and comments, handle requisitions and offers, and access employee and HR data all without leaving your AI interface. Whether you're sourcing talent, tracking approvals, or pulling workforce insights, the Workable MCP server turns natural language into real actions across your recruiting and HR operations.": "把你的 AI 助手直接连接到 Workable。凭借覆盖完整招聘生命周期的 40+ 工具，你可以管理职位、把候选人在管道阶段间推进、添加评价和评论、处理用人申请和 offer，并访问员工和 HR 数据，全部不离开你的 AI 界面。无论你是在寻源人才、跟踪审批还是拉取劳动力洞察，Workable MCP 服务器都把自然语言变成跨你招聘和 HR 运营的真实操作。",
    "Explore your org's processes": "探索你所在组织的流程",
    "Bring your organization's processes and operational knowledge into your AI assistant. The Klarity MCP connects to your Klarity workspace so you can query your organization's processes, explore the process index knowledge graph linking processes to systems and teams, and ground answers in how your business actually runs — not generic guesses.": "把你组织的流程和运营知识带入你的 AI 助手。Klarity MCP 连接到你的 Klarity 工作区，让你查询你组织的流程、探索把流程与系统和团队关联起来的流程索引知识图谱，并把答案扎根于你业务实际的运作方式——而非泛泛的猜测。",
    "Search 23M+ legal docs in 160+ jurisdictions.": "在 160+ 个司法辖区搜索 2300 万+ 份法律文书。",
    "Legal Data Hunter is trying to build the world's first omni-jurisdictional legal database, giving Claude access to 23M+ documents from 160+ jurisdictions in one MCP server. We ingest directly from official registries : Légifrance, EUR-Lex, BOE, RIS, the Bundesgerichtshof, the European Court of Human Rights, and 180+ more, covering EU consolidated law, supreme and constitutional court case law, and official doctrine. Resolve loose citations (ECLI, CELEX, case numbers), search with hybrid semantic + keyword filters, and fetch full document text. Authoritative primary sources only, no scraped web copy.": "Legal Data Hunter 正试图构建全球首个全司法辖区法律数据库，在一个 MCP 服务器中让 Claude 访问来自 160+ 个司法辖区的 2300 万+ 份文档。我们直接从官方登记处导入：Légifrance、EUR-Lex、BOE、RIS、德国联邦最高法院、欧洲人权法院等 180+ 个来源，覆盖欧盟合并法、最高法院和宪法法院判例以及官方学说。解析松散的引用（ECLI、CELEX、案号），用语义 + 关键词混合过滤搜索，并获取完整文档文本。只有权威的一手来源，没有抓取的网页副本。",
    "Real time prices, orders, charts, and more for crypto": "加密货币的实时价格、订单、图表等",
    "Real time price quotes, order books, conversions, candlestick charts and more for cryptocurrency tokens from Crypto.com": "来自 Crypto.com 的加密货币代币的实时报价、订单簿、兑换、K 线图等。",
    "Experience analytics platform for digital businesses": "面向数字化企业的体验分析平台",
    "Quickly understand everything your users are doing and why, directly from Claude. Contentsquare automatically captures every user action and analyzes it retroactively, no tagging needed. Ask Claude natural language questions about your analytics.": "直接从 Claude 快速了解你的用户在做什么以及为什么。Contentsquare 自动捕获每个用户操作并回溯分析，无需打标签。用自然语言就你的分析向 Claude 提问。",
    "Resy makes it easy to discover and book restaurant reservations across the United States. Just share what you're looking for, and instantly browse top restaurants, check real-time availability, and secure a table in seconds. Whether it's a last-minute dinner or a special night out, Resy helps you get a seat at the places you love.": "Resy 让你轻松发现并预订全美各地的餐厅位子。只需说出你想要什么，即刻浏览顶级餐厅、查看实时可预约情况，几秒锁定一张桌子。无论是临时晚餐还是特别之夜，Resy 都帮你在你喜爱的地方订到位子。",
    "Ask for audiobook recommendations & preview audiobooks": "获取有声书推荐并试听有声书",
    "Securely access and analyze Egnyte content": "安全访问并分析 Egnyte 内容",
    "Egnyte MCP server enables AI agents to securely search, retrieve, and analyze content stored in any Egnyte domain. It wraps Egnyte’s public APIs and enforces native permissions, compliance rules, and audit logging.": "Egnyte MCP 服务器让 AI agent 能安全地搜索、检索并分析存储在任意 Egnyte 域中的内容。它封装 Egnyte 的公开 API，并执行原生权限、合规规则和审计日志。",
    "Search, read, and edit your documentation": "搜索、阅读并编辑你的文档",
    "Connect Mintlify to Claude to keep your documentation accurate and up to date without leaving your conversations. Claude can search across every page, read and edit content directly, and ship changes. Perfect for fixing outdated pages after a product change, reorganizing sections as your product grows, or drafting new content alongside the code it documents.": "把 Mintlify 连接到 Claude，不离开对话就能让你的文档保持准确、最新。Claude 可以跨每一页搜索、直接阅读和编辑内容，并交付变更。特别适合在产品变更后修复过时页面、随着产品成长重组章节，或与它所记录的代码并肩起草新内容。",
    "K-12 standards, skills, and learning progressions": "K-12 标准、技能和学习进阶",
    "Align to all 50 states’ academic standards, break them into granular learning components, and trace learning progressions directly from Claude. The Learning Commons Knowledge Graph connects trusted instructional content and learning science into a shared foundation, so Claude can generate more precise, standards-aligned instructional content that supports coherent learning and reflects educational best practices.": "对齐全美 50 个州的学术标准，把它们拆成细粒度的学习组件，并直接从 Claude 追踪学习进阶。Learning Commons 知识图谱把可信的教学内容和学习科学连接成一个共享基础，让 Claude 能生成更精确、对齐标准的教学内容，支持连贯的学习并体现教育最佳实践。",
    "Find nearby stores, check product availability, turn meal ideas and recipes into groceries delivered.": "查找附近的商店、查看商品是否有货，把餐点创意和菜谱变成配送上门的杂货。",
    "Query and analyze your Gusto data": "查询并分析你的 Gusto 数据",
    "Connect Claude to your Gusto account to query and analyze your payroll and people data. Ask questions in natural language, build custom reports, and create charts to uncover trends and insights—no exports or tool-switching required. Eligible customers can also run payroll in Claude.": "把 Claude 连接到你的 Gusto 账户，查询和分析你的薪资和人员数据。用自然语言提问、构建自定义报表并创建图表以发现趋势和洞察——无需导出或切换工具。符合条件的客户还能在 Claude 里发放薪资。",
    "Search and manage Pylon support issues": "搜索并管理 Pylon 支持工单",
    "Access Pylon's customer support platform directly from Claude to search, manage, and resolve customer issues. Stay on top of your support queue while connecting Claude's insights to real customer conversations.": "直接从 Claude 访问 Pylon 的客户支持平台，搜索、管理并解决客户问题。在掌控你的支持队列的同时，把 Claude 的洞察连接到真实的客户对话。",
    "Save money on Software + AI contracts": "在软件和 AI 合同上省钱",
    "Software + AI pricing isn't public, so searching the internet won't tell you if you're overpaying. Tropic will. Connect Tropic to Claude to benchmark your pricing against $18B+ in verified technology transactions.": "软件 + AI 的定价并不公开，所以搜索网络也无法告诉你是否付多了。Tropic 可以。把 Tropic 连接到 Claude，用 180 亿+ 美元经核实的技术交易为你的定价做对标。",
    "The Autodesk Product Help MCP Server connects AI agents directly to Autodesk's official product documentation, enabling accurate, real-time answers across 110+ products. As a secure, read-only interface, it allows AI tools to search, navigate, and retrieve trusted Autodesk help content. This enables support for natural language queries, accelerates onboarding, and provides a reliable foundation for intelligent agents built on authoritative Autodesk product documentation.": "Autodesk Product Help MCP 服务器把 AI agent 直接连接到 Autodesk 的官方产品文档，为 110+ 款产品提供准确、实时的答案。作为一个安全的只读接口，它让 AI 工具能搜索、导航并检索可信的 Autodesk 帮助内容。这支持自然语言查询、加速上手，并为基于权威 Autodesk 产品文档构建的智能 agent 提供可靠基础。",
    "Record screen and collect automatic context for issues": "录屏并为问题自动收集上下文",
    "Jam's MCP is the fast lane between Jam recordings and your dev tools. Drop a Jam link into VS Code, Cursor, Windsurf, or Claude and the whole recording – video, console, network, logs – arrives pre-packaged. No hand-typing repro steps, no copy-paste stack traces, no screen-share drama. Your tools get instant context, you stay in flow.": "Jam 的 MCP 是 Jam 录制与你的开发工具之间的快车道。把一个 Jam 链接丢进 VS Code、Cursor、Windsurf 或 Claude，整段录制——视频、控制台、网络、日志——就预打包送达。无需手敲复现步骤、无需复制粘贴堆栈轨迹、无需屏幕共享的折腾。你的工具即刻获得上下文，你保持心流。",
    "Securely deploy servers in a matter of seconds in Tines": "在 Tines 中数秒内安全部署服务器",
    "Build custom MCP servers securely in Tines. Connect templates, send-to-story workflows, and custom tools and make them accessible to external MCP clients.": "在 Tines 中安全地构建自定义 MCP 服务器。连接模板、send-to-story 工作流和自定义工具，并让它们可供外部 MCP 客户端访问。",
    "Financial data and AI infrastructure for company research.": "面向公司调研的金融数据和 AI 基础设施。",
    "Access structured first-party IR data from over 14,500+ public companies across 65 markets. Quartr delivers live and recorded earnings calls, real-time and historical transcripts with speaker identification, slide presentations, filings, reports, and event summaries. Best-in-class reliability and timeliness. Ideal for financial research, investment analysis, and building data-driven workflows on top of institutional-grade public company data.": "访问来自 65 个市场、14,500+ 家上市公司的结构化第一方 IR 数据。Quartr 提供直播和录播的财报电话会、带发言人识别的实时和历史转写、幻灯片演示、文件、报告和事件摘要。业界领先的可靠性和时效性。适合金融研究、投资分析，以及在机构级上市公司数据之上构建数据驱动的工作流。",
    "Add your meetings context via transcripts and notes": "通过会议记录和笔记补充你的会议上下文",
    "Connect your meeting history to AI tools so past decisions, action items, and conversation context are easy to find and use.": "把你的会议历史连接到 AI 工具，让过往的决策、行动项和对话上下文易于查找和使用。",
    "Find your next outdoor adventure with AllTrails, directly in Claude. AllTrails is the world's most popular and trusted outdoor exploration platform, with more than 500,000 curated trails — complete with reviews, photos, and ratings from a community of over 90+ million trail-goers. From local walks to bucket-list adventures, AllTrails helps you discover new places and connect with the outdoors.": "用 AllTrails 直接在 Claude 里找到你的下一次户外冒险。AllTrails 是全球最受欢迎、最受信赖的户外探索平台，拥有超过 50 万条精选路线——附来自 9000 多万名徒步者社区的评价、照片和评分。从本地散步到愿望清单级冒险，AllTrails 帮你发现新去处、与户外连接。",
    "Query and explore observability data and SLOs": "查询并探索可观测性数据和 SLO",
    "Query and explore observability data from OpenTelemetry or dozens of other sources in your honeycomb.io account.": "查询并探索你 honeycomb.io 账户中来自 OpenTelemetry 或数十种其他来源的可观测性数据。",
    "The AI notebook for everything on your mind": "记录你脑中一切的 AI 笔记本",
    "Give Claude the full context of your second brain by connecting your Mem knowledge base. Search your AI notebook for context, capture and recall ideas, save chats into new notes, edit and update living docs, and organize your AI workspace — simply by asking Claude. Use for: synthesizing and pulling actions items from meeting notes, deep research, personal knowledge management (PKM), knowledge repository building, task management, prioritization, and content development. Example prompts: \"Search my notes for pricing strategy and validate our thinking with research.\" \"Create a note from this chat and add it to our GTM collection.\" \"List all open tasks from this week's notes and add to my to-do list.\"": "连接你的 Mem 知识库，给 Claude 你第二大脑的完整上下文。搜索你的 AI 笔记本获取上下文、捕获和召回想法、把聊天存成新笔记、编辑和更新活文档，并整理你的 AI 工作空间——只需向 Claude 开口。用于：从会议笔记中综合并提取行动项、深度研究、个人知识管理（PKM）、知识库构建、任务管理、优先级排序和内容开发。示例提示：「在我的笔记里搜索定价策略，并用研究验证我们的思路。」「从这段聊天创建一条笔记，加入我们的 GTM 集合。」「列出本周笔记里所有未完成的任务，加进我的待办清单。」",
    "Clean Public Equity Fundamental Data": "干净的上市公司股票基本面数据",
    "Access institutional-grade financial data directly within Claude. Fiscal.ai delivers fundamental metrics and ratios minutes after earnings are reported, with every figure verifiable via direct links to the source filing. Beyond core financials, the server provides company-specific KPIs, revenue segments, and adjusted metrics. Combined with historical and current market quotes, it enables grounded, audit-ready equity research with unmatched speed.": "直接在 Claude 内访问机构级金融数据。Fiscal.ai 在财报发布数分钟后就交付基本面指标和比率，每个数字都可通过指向源文件的直接链接核验。除核心财务外，服务器还提供公司特定的 KPI、收入分部和调整后指标。结合历史和当前市场报价，它以无与伦比的速度实现扎根、可审计的股票研究。",
    "Add real-time social media data to your searches": "为你的搜索加入实时社交媒体数据",
    "Access comprehensive social analytics and market intelligence for companies, brands, stocks, and cryptocurrencies through LunarCrush's AI-data platform. Stream real-time social metrics, sentiment analysis, trending topics, and market data directly into your AI workflows.": "通过 LunarCrush 的 AI 数据平台，访问公司、品牌、股票和加密货币的全面社交分析和市场情报。把实时社交指标、情绪分析、热门话题和市场数据流式接入你的 AI 工作流。",
    "Estimate tax refunds and connect with live tax experts": "估算退税并连线真人税务专家",
    "Real-time Yardi data & insights": "实时 Yardi 数据与洞察",
    "Yardi Virtuoso provides secure, real-time access to Yardi data and tools through Claude. It enables investment, property and asset management professionals to query financial models, predictive maintenance insights, market analysis, and portfolio data using natural language. Users can ask complex operational questions, explore strategic scenarios, and perform analysis without manual data extraction, all grounded in accurate, enterprise-grade Yardi data.": "Yardi Virtuoso 通过 Claude 提供对 Yardi 数据和工具的安全、实时访问。它让投资、物业和资产管理专业人士用自然语言查询财务模型、预测性维护洞察、市场分析和资产组合数据。用户可以提出复杂的运营问题、探索战略情形并进行分析，无需手动提取数据，全部扎根于准确、企业级的 Yardi 数据。",
    "Access business data from hundreds of sources": "从数百个来源访问业务数据",
    "Analyze multi-channel marketing, financial, sales, e-commerce, and other business data within Claude by connecting to your Coupler.io data flows — query marketing, sales, and finance metrics from hundreds of sources. Fetch and transform raw data from platforms like Google Ads, Facebook, HubSpot, and Salesforce into actionable intelligence for smarter, faster decision-making with accurate, up-to-date business information.": "连接你的 Coupler.io 数据流，在 Claude 内分析多渠道营销、财务、销售、电商和其他业务数据——从数百个来源查询营销、销售和财务指标。从 Google Ads、Facebook、HubSpot 和 Salesforce 等平台获取并转换原始数据，凭借准确、最新的业务信息，做出更聪明、更快的决策。",
    "Automate 700+ apps & workflows with governance": "在受治理下自动化 700+ 应用和工作流",
    "Tray.ai connects Claude to your applications and lets you build and automate workflows across marketing leads, sales opportunities, orders, renewals, reporting, and more. With 700+ connectors and support for complex, multi-step workflows, it can handle virtually any automation your business needs. Centralized management, audit trails, and governance controls give your team visibility and oversight across all automations.": "Tray.ai 把 Claude 连接到你的应用，让你跨营销线索、销售商机、订单、续约、报表等构建并自动化工作流。凭借 700+ 连接器和对复杂多步工作流的支持，它几乎能处理你业务所需的任何自动化。集中式管理、审计轨迹和治理控制让你的团队对所有自动化拥有可见度和监督。",
    "Generate, create, read, and update diagrams, documents and files in your Eraser workspace directly from Claude. Make Eraser a native part of your AI workflow — describe a system in natural language and have your agent generate a complete diagram, create rich technical docs from code or conversations, and manage files across your workspace. All changes are saved to your Eraser account and accessible from the app.": "直接从 Claude 在你的 Eraser 工作区中生成、创建、读取和更新图表、文档和文件。让 Eraser 成为你 AI 工作流的原生一环——用自然语言描述一个系统，让你的 agent 生成完整图表、从代码或对话创建丰富的技术文档，并跨你的工作区管理文件。所有变更都保存到你的 Eraser 账户，并可从应用访问。",
    "Turn Claude into your email marketing assistant": "把 Claude 变成你的邮件营销助手",
    "Connect Claude with MailerLite to create your very own email assistant. Use it to build email, analyze campaign performance, manage subscribers, and more, all with natural language prompts.": "把 Claude 与 MailerLite 连接，打造你专属的邮件助手。用它构建邮件、分析活动效果、管理订阅者等，全部通过自然语言提示。",
    "Era Context is a secure place to manage your finances. Set up automations, fix overspending, figure out your portfolio, or tell Claude a goal and get your full financial life in context.": "Era Context 是一个安全管理你财务的地方。设置自动化、纠正超支、理清你的投资组合，或告诉 Claude 一个目标，把你的整个财务生活纳入上下文。",
    "Manage, transform and deliver your images & videos": "管理、转换并分发你的图片和视频",
    "The Cloudinary MCP servers enable you to upload, manage, transform, and analyze your media assets.": "Cloudinary MCP 服务器让你上传、管理、转换并分析你的媒体资产。",
    "Verify links, emails, phone numbers, and domains against Malwarebytes threat intelligence directly from Claude. Get instant scam verdicts, domain ownership details, and risk levels for unknown callers, shortened URLs, and suspicious messages before you click, call, or reply. Report suspicious indicators back to Malwarebytes to help protect others.": "直接从 Claude 对照 Malwarebytes 威胁情报核验链接、邮件、电话号码和域名。在你点击、拨打或回复之前，即时获得对未知来电、缩短 URL 和可疑消息的诈骗判定、域名归属详情和风险等级。把可疑指标回报给 Malwarebytes，帮助保护他人。",
    "A universal concierge for complex businesses": "面向复杂业务的通用礼宾助手",
    "Lorikeet is a platform that complex and regulated businesses use to provide their customers with a universal concierge. Lorikeet does this with AI agents that work across voice, chat and email. The agents are built on a unique architecture that focuses on flexibility and the ability to take actions to solve customers' problems (not just tell them to self serve) in the most challenging circumstances. Our customers include global FinTech, HealthTechs, crypto marketplaces, and other complex businesses.": "Lorikeet 是一个平台，复杂和受监管的企业用它为客户提供通用礼宾服务。Lorikeet 通过跨语音、聊天和邮件工作的 AI agent 实现这一点。这些 agent 建立在一套独特架构上，专注于灵活性和在最具挑战性的情况下采取行动解决客户问题的能力（而不只是让客户自助）。我们的客户包括全球金融科技、健康科技、加密货币市场和其他复杂企业。",
    "Search, analyze and understand your finances on Mercury": "在 Mercury 上搜索、分析并读懂你的财务",
    "Check your balance, download statements, search/analyze/graph transactions, and understand Cards directly from Claude. Mercury brings your finances into your AI tools": "直接从 Claude 查看你的余额、下载对账单、搜索/分析/绘制交易图表并了解卡片。Mercury 把你的财务带入你的 AI 工具。",
    "Inject precise, real-time computation and knowledge": "注入精确、实时的计算与知识",
    "Discover, research, and enrich companies and people": "发现、调研并丰富公司和人员信息",
    "Search, enrich, and research startups and companies using Harmonic's proprietary data on millions of companies and the people behind them. Get detailed company profiles with funding, location, founders, and network connections. Use natural language to find companies matching specific criteria. Create and manage lists of companies and people. Access your team's network mapping and saved searches. Discover startups earlier, research them faster, and act with confidence—an AI-powered research agent built into your workflow.": "用 Harmonic 关于数百万家公司及其背后人员的专有数据，搜索、丰富并调研初创公司和企业。获取带融资、地点、创始人和人脉连接的详细公司档案。用自然语言查找符合特定条件的公司。创建并管理公司和人员列表。访问你团队的人脉图谱和已保存的搜索。更早发现初创公司、更快调研它们、笃定行动——一个内建于你工作流的 AI 驱动研究 agent。",
    "Trusted real-time global financial news provider": "值得信赖的实时全球金融新闻提供方",
    "MT Newswires' MCP server delivers real-time, low-latency financial news across equities, fixed income, commodities, FX, and macroeconomics. Structured and machine-readable, it integrates seamlessly into AI, trading, and analytics systems, providing scalable, reliable, event-driven intelligence from MT Newswires' global newsroom trusted by leading banks, brokerages, and data providers.": "MT Newswires 的 MCP 服务器交付跨股票、固定收益、大宗商品、外汇和宏观经济的实时、低延迟金融新闻。结构化、机器可读，它无缝集成进 AI、交易和分析系统，提供来自 MT Newswires 全球编辑室的可扩展、可靠、事件驱动的情报，深受领先银行、券商和数据提供商信赖。",
    "Put your meetings to work": "让你的会议发挥价值",
    "Grain captures and transcribes your meetings where you have them: Meet, Zoom, Teams, Slack, and more. Grain builds an AI Meeting Data Layer of transcripts, notes, and enriched context that Claude uses to power your work. Example prompts: \"Draft a proposal for AcmeCo using context from every call we've had with them.\" \"What pain points came up most across our user interviews this month?\" \"Summarize the team meetings I missed this week and flag anything I should weigh in on.\" \"Find and clip recent moments where customers pushed back on pricing to share with sales.\" \"Create a project for AcmeCo with every meeting we've had with them so I can prep for our QBR.\"": "Grain 在你开会的地方捕获并转写你的会议：Meet、Zoom、Teams、Slack 等。Grain 构建一个由转写、笔记和丰富上下文组成的 AI 会议数据层，供 Claude 用来为你的工作赋能。示例提示：「用我们与 AcmeCo 每一次通话的上下文，为其起草一份提案。」「本月我们的用户访谈中，最常出现的痛点是什么？」「总结我本周错过的团队会议，并标出任何我该发表意见的地方。」「找出并剪辑近期客户对定价提出异议的片段，分享给销售。」「为 AcmeCo 创建一个项目，包含我们与他们的每一场会议，好让我为 QBR 做准备。」",
    "Seamlessly incorporate critical context and trusted insights from industry experts as part of your financial and business analysis. Refocus on extracting high-quality, reliable information by querying Third Bridge’s best-in-class substantial Library of expert content and data. Our MCP systematically and securely instructs Large Language Models (LLMs) to query insights from our database into their systems, streamlining your workflows and improving your output": "把来自行业专家的关键上下文和可信洞察无缝纳入你的财务和商业分析。通过查询 Third Bridge 业界一流、庞大的专家内容和数据库，重新聚焦于提取高质量、可靠的信息。我们的 MCP 系统性、安全地指示大语言模型（LLM）从我们的数据库查询洞察并纳入其系统，简化你的工作流、提升你的产出。",
    "Access Benchling's scientific AI for research in Claude": "在 Claude 中访问 Benchling 的科研 AI",
    "Discover expert-written skills for legal work": "发现由专家编写的法律工作 skill",
    "Browse a curated library of legal AI skills written by practicing lawyers, in-house counsel, and legal technologists. Every skill covers a specific workflow — contract review, NDA analysis, GDPR compliance, legal drafting, jurisdiction-specific research. Search the catalog from inside Claude to find the skill that fits your task and preview its practitioner-authored instructions. Bring expert guidance into your workflow — whether you're at a law firm, in-house, or building legal tech.": "浏览一个由执业律师、企业法务和法律技术专家编写的精选法律 AI skill 库。每个 skill 覆盖一个特定工作流——合同审阅、NDA 分析、GDPR 合规、法律起草、特定司法辖区的研究。在 Claude 内搜索目录，找到适合你任务的 skill 并预览其从业者编写的指令。把专家指导带入你的工作流——无论你在律所、企业内部还是在做法律科技。",
    "Ask Claude to generate and play some sheet music for you with a visual component": "让 Claude 为你生成并播放乐谱，还带可视化组件",
    "Ask Claude to generate and play some sheet music for you with a visual component.": "让 Claude 为你生成并播放乐谱，还带可视化组件。",
    "Connect, control, and automate 1,000+ apps with IFTTT": "用 IFTTT 连接、控制并自动化 1,000+ 应用",
    "Connect IFTTT to Claude to run actions, query data, and manage your automations across 1,000+ services. Claude can search your apps for info, execute tasks on demand, and create or update Applets for you. Use simple natural language to let Claude save you time by handling repetitive tasks, syncing data between productivity apps, and controlling smart home devices directly from the chat.": "把 IFTTT 连接到 Claude，跨 1,000+ 个服务运行操作、查询数据并管理你的自动化。Claude 可以在你的应用里搜索信息、按需执行任务，并为你创建或更新 Applet。用简单的自然语言，让 Claude 通过处理重复任务、在效率应用间同步数据，以及直接从对话控制智能家居设备，为你省时间。",
    "Quo is a next-generation business phone system that helps teams engage customers, collaborate internally, and scale communication with AI — without losing the personal touch. Connecting Quo gives Claude access to your customer conversations across calls, text messages, and contacts. You can ask questions about those interactions to uncover patterns in what customers are saying and where opportunities may be lost. Claude can search, analyze, and summarize conversations to surface insights like Why are we losing deals? What do customers love about our service? What complaints show up most often?": "Quo 是新一代商务电话系统，帮助团队用 AI 与客户互动、内部协作并扩展沟通——同时不失个人化的温度。连接 Quo 让 Claude 能访问你跨通话、短信和联系人的客户对话。你可以就这些互动提问，发现客户在说什么、机会可能在哪里流失的规律。Claude 可以搜索、分析并总结对话，呈现诸如「我们为什么在丢单？」「客户喜欢我们服务的哪些点？」「哪些投诉出现得最多？」这类洞察。",
    "Attorney guidance & tools for business & personal needs": "面向企业和个人需求的律师指导与工具",
    "AI-powered document review meets attorney guidance. Connect to LegalZoom for real-time scans of legal documents to identify critical risks and important clauses, advise on when to engage an attorney, and share notes in advance—all within one workflow. When matters require professional expertise, users will be routed directly into LegalZoom's network of vetted attorneys for timely, jurisdiction-specific guidance. From contract questions to small business matters, LegalZoom helps users get the right support quickly and securely.": "AI 驱动的文档审阅遇上律师指导。连接 LegalZoom，实时扫描法律文档以识别关键风险和重要条款、就何时该请律师给出建议，并提前分享笔记——全部在一个工作流内。当事情需要专业能力时，用户会被直接路由到 LegalZoom 经审核的律师网络，获得及时、针对特定司法辖区的指导。从合同问题到小企业事务，LegalZoom 帮用户快速、安全地获得合适的支持。",
    "The CoinDesk Data & Indices Connector provides real-time and historical digital asset market data powered by institutional-grade infrastructure. Access regulated indices, benchmarks, spot prices, futures, and options data across leading exchanges — including funding rates, open interest, orderbook depth, and trade history. Built for traders, analysts, and researchers who need comprehensive, cross-market digital asset intelligence through natural language.": "CoinDesk Data & Indices 连接器提供由机构级基础设施驱动的实时和历史数字资产市场数据。跨主流交易所访问受监管的指数、基准、现货价格、期货和期权数据——包括资金费率、未平仓合约、订单簿深度和成交历史。为需要通过自然语言获得全面、跨市场数字资产情报的交易者、分析师和研究者打造。",
    "Structured contract review tools for legal teams": "面向法务团队的结构化合同审阅工具",
    "Definely's MCP server gives AI assistants live, deterministic access to contract structure. Resolve definitions, validate cross‑references, map dependencies, and run structural diffs to see how edits propagate across an agreement. Use it to catch broken links and inconsistencies, explain impacts clearly, and ground legal reasoning in contract topology, not just text.": "Definely 的 MCP 服务器让 AI 助手能实时、确定性地访问合同结构。解析定义、校验交叉引用、映射依赖关系，并运行结构化 diff 以查看编辑如何在一份协议中传播。用它捕捉断裂的链接和不一致、清晰解释影响，并把法律推理扎根于合同拓扑，而不只是文本。",
    "Search and update your company's knowledge graph": "搜索并更新你公司的知识图谱",
    "Interact with your DevRev workspace to search your enterprise knowledge graph and manage customer-product relationships. Query and update issues, tickets, enhancements, and customer data.": "与你的 DevRev 工作区交互，搜索你的企业知识图谱并管理客户-产品关系。查询和更新 issue、工单、增强项和客户数据。",
    "Autonomous marketing to transform how you work": "自主营销，变革你的工作方式",
    "Connect ActiveCampaign to Claude for autonomous marketing at your fingertips. Get real-time marketing insights and then take action, instantly. With this secure connection, you can manage lists, tags, contacts, and automations just by chatting with Claude. Ask Claude to pull yesterday’s email performance, get a contact’s phone number, create a new tag, or start an automation. All of that and more, fueled by the ActiveCampaign MCP Server.": "把 ActiveCampaign 连接到 Claude，让自主营销触手可及。获取实时营销洞察，然后即刻采取行动。有了这个安全连接，你只需与 Claude 聊天就能管理列表、标签、联系人和自动化。让 Claude 拉取昨天的邮件表现、获取某个联系人的电话、创建新标签，或启动一个自动化。这些以及更多，都由 ActiveCampaign MCP 服务器驱动。",
    "Explore and update your Process Street data": "探索并更新你的 Process Street 数据",
    "Ask questions about your workflows, runs, tasks, users, and data sets, and take action on them safely. You can retrieve workflow details, inspect run history, check task status, update form fields, trigger new runs, and complete tasks. This provides real operational context and a controllable, auditable way to work inside your existing processes, making it easier for teams to get answers and take action directly within Process Street.": "就你的工作流、运行、任务、用户和数据集提问，并安全地对它们采取行动。你可以检索工作流详情、检查运行历史、查看任务状态、更新表单字段、触发新的运行并完成任务。这提供真实的运营上下文，以及在你现有流程内工作的可控、可审计方式，让团队更容易直接在 Process Street 内获得答案并采取行动。",
    "Trusted Trademark Intelligence from Clarivate CompuMark": "来自 Clarivate CompuMark 的可信商标情报",
    "Clarivate IPOne CompuMark Trademark MCP helps teams search, review, and validate trademarks faster across global trademark registers. It combines broad jurisdiction coverage with flexible search options for mark names, phonetic variations, applicants, classes, goods and services, and filing details. Users can quickly assess result volumes, retrieve record details, access goods text, and open full-text records—making the server a strong fit for brand clearance, watch support, and trademark research workflows.": "Clarivate IPOne CompuMark 商标 MCP 帮助团队跨全球商标注册库更快地搜索、审查和验证商标。它把广泛的司法辖区覆盖与灵活的搜索选项（商标名、语音变体、申请人、类别、商品和服务及申请详情）结合起来。用户可以快速评估结果数量、检索记录详情、访问商品文本并打开全文记录——使该服务器非常适合品牌清查、监测支持和商标研究工作流。",
    "Inhouse counsel insights for members of The L Suite": "面向 The L Suite 会员的企业法务洞察",
    "Connect with the collective knowledge of 5,000+ inhouse counsel in The L Suite community - cited & sourced -- including 2,000+ annual discussion threads, 300+ playbooks, 3,000 shared documents/artifacts, 2,000+ hours of video content, 10,000 unbiased pieces of outside counsel and vendor feedback,  Members Only.": "连接 The L Suite 社区 5,000+ 名企业法务的集体知识——附引用和出处——包括每年 2,000+ 个讨论帖、300+ 份剧本、3,000 份共享文档/制品、2,000+ 小时视频内容、10,000 条无偏见的外部律师和供应商反馈，仅限会员。",
    "Conduct legal research and create work product": "开展法律检索并产出工作成果",
    "Connect Claude to a database of case law. With the Midpage MCP, Claude can conduct complex legal research, review opinions, and craft high quality work product. Everything is hyperlinked to real sources for easy verification.": "把 Claude 连接到一个判例法数据库。有了 Midpage MCP，Claude 可以进行复杂的法律研究、审阅意见并产出高质量的工作成果。一切都超链接到真实来源，便于核验。",
    "Your AI data analyst, from question to trusted insights": "你的 AI 数据分析师，从提问到可信洞察",
    "From everyday data questions to high-level strategic analyses, Spotter by ThoughtSpot helps business and data teams get answers and insights they can trust, validate, and act on, enabling everyone to use data to drive the business forward.": "从日常的数据问题到高层的战略分析，ThoughtSpot 的 Spotter 帮助业务和数据团队获得他们可以信任、验证并据此行动的答案和洞察，让每个人都能用数据推动业务前进。",
    "Find the right hotel, then book direct": "找到合适的酒店，然后直接预订",
    "Query and explore your ClickHouse Cloud data": "查询并探索你的 ClickHouse Cloud 数据",
    "Connect Claude to your ClickHouse Cloud databases. Browse organizations, services, databases, and table schemas. Run read-only SQL queries against your data and get instant analytical answers. Monitor service backups, review billing costs, and inspect ClickPipe configurations - all through natural conversation.": "把 Claude 连接到你的 ClickHouse Cloud 数据库。浏览组织、服务、数据库和表结构。对你的数据运行只读 SQL 查询，获得即时的分析答案。监控服务备份、查看账单成本、检查 ClickPipe 配置——全部通过自然对话。",
    "Perform world-class investment analysis": "开展世界一流的投资分析",
    "Generate new investment ideas and perform in-depth analysis of any publicly traded business using proprietary Canary datasets, intelligence and synthesis within Claude. Canary plays well with other financial MCPs to combine to make Claude into a world-class investment analyst.": "在 Claude 内用 Canary 专有数据集、情报和综合能力生成新的投资想法，并对任意上市公司做深入分析。Canary 与其他金融 MCP 配合默契，组合起来把 Claude 变成世界级的投资分析师。",
    "Integrate with the Airwallex Platform using Claude": "用 Claude 集成 Airwallex 平台",
    "The Airwallex Developer Model Context Protocol (MCP) server helps developers to easily integrate with Airwallex capabilities by bringing Airwallex documentation, API references, and sandbox testing tools directly to Claude. Enjoy developer lifecycle support from knowledge search, to troubleshooting, to simulations and go-live testing. Use your sandbox credentials to get started!": "Airwallex Developer Model Context Protocol (MCP) 服务器把 Airwallex 文档、API 参考和沙箱测试工具直接带入 Claude，帮助开发者轻松集成 Airwallex 能力。享受从知识搜索、故障排查到模拟和上线测试的开发者全生命周期支持。用你的沙箱凭据开始吧！",
    "Discover and book unforgettable things to do with the Viator app. Search Viator's catalog of tours, attractions, and experiences using natural language. Just tell us where you're going and what you're interested in, and we will help you explore relevant options quickly and clearly. You can narrow results by destination, dates, price range, and categories, making it easy to move from a broad idea (\"things to do in Paris\") to options that fit your plans and budget. Each result focuses on practical details, so you can compare experiences without jumping between pages or tabs.": "用 Viator 应用发现并预订难忘的活动。用自然语言搜索 Viator 的旅游、景点和体验目录。只需告诉我们你要去哪里、对什么感兴趣，我们就帮你快速、清晰地探索相关选项。你可以按目的地、日期、价格区间和类别缩小结果，让你轻松从一个宽泛的想法（「巴黎有什么可玩的」）走到符合你计划和预算的选项。每个结果都聚焦于实用细节，让你无需在页面或标签之间跳转就能比较各种体验。",
    "Search flights, plan trips, and manage bookings": "搜索航班、规划行程并管理订单",
    "The official Turkish Airlines MCP App. Search and compare flights, check live status, look up booking details and baggage allowance, browse city guides, and discover promotions — all directly inside Claude.": "官方土耳其航空 MCP 应用。搜索并比较航班、查看实时状态、查询订单详情和行李额度、浏览城市指南并发现优惠——全部直接在 Claude 内。",
    "Execute risk workflows powered by the D&B Commercial Graph™": "运行由 D&B Commercial Graph™ 驱动的风险工作流",
    "Dun & Bradstreet empowers teams to execute risk workflows such as KYC/KYB, entity resolution, screening, alert triage, and more using relationship-aware business context from the D&B Commercial Graph™. Verified risk data, anchored in the global standard D‑U‑N‑S® Number business identifier, and policy-driven logic provide the foundation for consistent decisioning across systems of record and scalable risk operations in regulated environments.": "Dun & Bradstreet 让团队能用来自 D&B Commercial Graph™ 的关系感知业务上下文执行 KYC/KYB、实体解析、筛查、告警分诊等风险工作流。以全球标准 D‑U‑N‑S® 编号业务标识符为锚点的经核实风险数据，以及策略驱动的逻辑，为跨记录系统的一致决策和受监管环境中的可扩展风险运营奠定基础。",
    "Search, analyze, and act on client conversations": "搜索、分析客户对话并对其采取行动",
    "Search, analyze, and take action on your sales conversations directly from Claude. Attention captures every call and email, extracts key insights, and syncs intelligence to your other apps automatically. With this connector, you can query call transcripts across your team, surface objections and trends, review scorecards, analyze deal health, and create shareable snippets - all through natural language. Turn every customer conversation into structured data, coaching opportunities, and closed deals without leaving Claude.": "直接从 Claude 搜索、分析你的销售对话并对其采取行动。Attention 捕获每一次通话和邮件、提取关键洞察，并自动把情报同步到你的其他应用。有了这个连接器，你可以跨你的团队查询通话转写、呈现异议和趋势、查看评分卡、分析交易健康度并创建可分享的片段——全部通过自然语言。把每一次客户对话变成结构化数据、辅导机会和成交订单，全程不离开 Claude。",
    "Splice MCP Server provides access to discovery and ideation tools that empower music creators with the power of Splices's extensive catalog of royalty-free samples. The Describe a Sound (Beta) tool enables search via natural language to find just the right sound. The Create tool builds stacks of complementary sounds that can inspire your next project. More tools will be added over time to the Splice MCP Server that bring more of the capabilities of Splice to your workflows.": "Splice MCP 服务器提供发现和构思工具，用 Splice 庞大的免版税采样库为音乐创作者赋能。Describe a Sound（Beta）工具让你用自然语言搜索，找到恰到好处的声音。Create 工具构建互补声音的组合，激发你下一个项目的灵感。随着时间推移，Splice MCP 服务器会加入更多工具，把 Splice 更多的能力带入你的工作流。",
    "Query your live GL and financials in plain English": "用大白话查询你的实时总账和财务数据",
    "Rillet is an AI-native ERP built for scaling companies. Connect Claude to your live general ledger to query financials in plain English, analyze revenue trends and SaaS metrics, and create journal entries by prompt. Rillet runs on real-time architecture, not batch processing, so every answer Claude surfaces comes from your live books, not last month's data. Ask about your top customers, monthly burn, missing accruals, or cash runway. Get answers from your books, not a spreadsheet.": "Rillet 是一个为成长型公司打造的 AI 原生 ERP。把 Claude 连接到你的实时总账，用大白话查询财务、分析收入趋势和 SaaS 指标，并通过提示创建日记账分录。Rillet 运行在实时架构上，而非批处理，所以 Claude 呈现的每个答案都来自你的实时账簿，而非上个月的数据。询问你的头部客户、月度消耗、遗漏的应计项或现金跑道。从你的账簿获得答案，而不是一张电子表格。",
    "Connect Claude to Close CRM to securely access and act on your sales data": "把 Claude 连接到 Close CRM，安全访问你的销售数据并对其采取行动",
    "Give Claude full enterprise-scale codebase context.": "为 Claude 提供完整的企业级代码库上下文。",
    "Connect Claude to Sourcegraph's powerful code intelligence APIs - enabling semantic code search, symbol lookup, file retrieval, and repository navigation across your entire codebase, including private and multi-repo setups.": "把 Claude 连接到 Sourcegraph 强大的代码智能 API——在你的整个代码库（包括私有和多仓库设置）中实现语义代码搜索、符号查找、文件检索和仓库导航。",
    "Research nonprofits and funders using Candid's data": "用 Candid 的数据调研非营利组织和资助方",
    "Bring the power of Candid's comprehensive nonprofit and funder data directly into Claude. Search millions of organizations, discover funding opportunities, and access expert knowledge and social sector news—all through natural conversation.": "把 Candid 全面的非营利组织和资助方数据的力量直接带入 Claude。搜索数百万家组织、发现资助机会，并访问专家知识和公益部门新闻——全部通过自然对话。",
    "Manage your global workforce, right in Claude.": "直接在 Claude 中管理你的全球员工。",
    "Connect Claude to your Deel account and take action across your entire global workforce. Manage contracts, track payments, handle time-off, run payroll calculations, and query your HRIS data — all in natural language. Ask questions, get instant answers, and make decisions faster, securely. Whether you're managing a team of 5 or 5,000, Deel brings your people data and workflows directly into Claude.": "把 Claude 连接到你的 Deel 账户，跨你整个全球员工队伍采取行动。管理合同、跟踪付款、处理休假、运行薪资计算，并查询你的 HRIS 数据——全部用自然语言。提问、即时获得答案、更快更安全地做决策。无论你管理 5 人还是 5000 人的团队，Deel 都把你的人员数据和工作流直接带入 Claude。",
    "Get answers from your data": "从你的数据中获取答案",
    "Connect AI assistants to your MotherDuck data warehouse. Explore, visualize, and manage data using natural language–no SQL skills required. Create Dives: interactive visualizations that let you save and share answers with your team, staying up-to-date with your latest data. Works with real-world data without requiring semantic models or pre-configuration. Your AI assistant acts like a data analyst, exploring, validating, analyzing, and visualizing data iteratively to answer your questions.": "把 AI 助手连接到你的 MotherDuck 数据仓库。用自然语言探索、可视化并管理数据——无需 SQL 技能。创建 Dive：交互式可视化，让你保存并与团队分享答案，并随你的最新数据保持更新。无需语义模型或预配置即可处理真实世界数据。你的 AI 助手像数据分析师一样工作，迭代地探索、验证、分析并可视化数据来回答你的问题。",
    "Outside Counsel recommendations from Inhouse Counsel": "来自企业法务的外部律师推荐",
    "Find the right outside counsel for your specific matter based on insights and rankings from The L Suite -- the leading community of 5000+ inhouse counsel. Our proprietary ranking algorithm is driven by overall aggregated member sentiment, speaking engagements and content of each outside counsel, evidence of expertise provided by outside counsel, outside counsel interviews and other internal datasets. Learn more at topcounsel.ai and lsuite.co.": "根据来自 The L Suite（拥有 5000+ 名企业法务的领先社区）的洞察和排名，为你的具体事务找到合适的外部律师。我们专有的排名算法由会员整体聚合情绪、每位外部律师的演讲和内容、外部律师提供的专长证据、外部律师访谈和其他内部数据集驱动。在 topcounsel.ai 和 lsuite.co 了解更多。",
    "AI visibility and local search intelligence platform": "AI 可见度与本地搜索情报平台",
    "Local Falcon gives Claude access to real-time local search data across Google Maps, Apple Maps, and AI search platforms. With 37 tools spanning geo-grid rank tracking, competitor intelligence, campaign management, Google Business Profile monitoring, and AI search visibility tracking, Claude becomes a full-service local search and AI visibility analyst.": "Local Falcon 让 Claude 能访问跨 Google Maps、Apple Maps 和 AI 搜索平台的实时本地搜索数据。凭借覆盖地理网格排名跟踪、竞品情报、活动管理、Google 商家资料监控和 AI 搜索可见度跟踪的 37 个工具，Claude 成为一个全方位的本地搜索和 AI 可见度分析师。",
    "Search, analyze, and export Campfire data": "搜索、分析并导出 Campfire 数据",
    "Search, analyze, and retrieve data from your Campfire ERP directly in Claude. Ask questions about projects, contacts, and financials in natural language. Create board decks, generate insights from your data, and make informed decisions as a native part of your AI workflow.": "直接在 Claude 中搜索、分析并检索你 Campfire ERP 的数据。用自然语言就项目、联系人和财务提问。创建董事会演示稿、从你的数据生成洞察，并作为你 AI 工作流的原生一环做出明智决策。",
    "Live events, filings, company publications, and more": "实况活动、财报文件、公司刊物等",
    "Access to Aiera's financial data APIs, including live events, filings, company publications, and much more.": "访问 Aiera 的金融数据 API，包括实况活动、财报文件、公司刊物等。",
    "Interact with your Chronograph data directly in Claude": "在 Claude 中直接与你的 Chronograph 数据交互",
    "The Chronograph MCP server allows users to query portfolio data, analyze investments, search for entities, retrieve performance metrics, and access Chronograph's help documentation. The connector is designed for private investment workflows, providing programmatic access to portfolio analytics and reporting data.": "Chronograph MCP 服务器让用户查询资产组合数据、分析投资、搜索实体、检索业绩指标，并访问 Chronograph 的帮助文档。该连接器为私募投资工作流设计，提供对资产组合分析和报表数据的编程式访问。",
    "Monitor, debug, and optimize your Plaid integration": "监控、调试并优化你的 Plaid 集成",
    "Enables developers to build agents that fetch Plaid Link conversion insights, usage metrics, and Item diagnostics using the Anthropic API.": "让开发者构建 agent，用 Anthropic API 获取 Plaid Link 转化洞察、使用指标和 Item 诊断。",
    "Credit score factors & insights": "信用评分因素与洞察",
    "Credit Karma helps you understand your credit health. Get a breakdown of the key factors affecting your credit score – including payment history, credit utilization, credit age, credit mix, new credit inquiries, and total accounts – and see how you're rated on each to help you take action toward improving your credit.": "Credit Karma 帮你了解你的信用健康。获得影响你信用分的关键因素分解——包括还款历史、信用利用率、信用年限、信用组合、新信用查询和账户总数——并查看你在每一项上的评级，帮你采取行动改善信用。",
    "Claude for Trial Court Litigators": "面向初审法院诉讼律师的 Claude",
    "Trellis - Claude for Trial Court Litigators gives Claude direct access to the largest state trial court dataset in the U.S. — including dockets, rulings, verdicts, and filings — enabling legal research, judge and opposing counsel analytics, expert witness vetting, and motion drafting grounded in real precedent.": "Trellis——面向初审法院诉讼律师的 Claude，让 Claude 直接访问美国最大的州初审法院数据集——包括案卷、裁决、判决和文件——实现扎根于真实先例的法律研究、法官和对方律师分析、专家证人审查和动议起草。",
    "StubHub makes it easy to explore live events directly from Claude. Access live ticket availability, pricing, and view quality in real time with an assistant that remembers your preferences. With over 50 million listings across 200+ countries, you can discover concerts, sports, theater, comedy, festivals, and more — all in one place.": "StubHub 让你轻松直接从 Claude 探索现场活动。用一个记住你偏好的助手，实时访问在售门票、价格和视野质量。凭借跨 200+ 国家的 5000 多万条票源，你可以在一处发现演唱会、体育、戏剧、喜剧、音乐节等。",
    "Add authentication, organizations, and billing": "加入身份验证、组织和计费",
    "Add Clerk authentication to your app directly through Claude. Access up-to-date SDK snippets and implementation patterns for sign-in flows, session management, and route protection. Build multi-tenant B2B apps with organizations and role-based access, configure waitlists and early access flows, and implement billing. Get framework-specific examples for Next.js, React, Expo, and more through natural language prompts.": "直接通过 Claude 为你的应用加入 Clerk 身份验证。访问最新的 SDK 代码片段和实现模式，用于登录流程、会话管理和路由保护。用组织和基于角色的访问构建多租户 B2B 应用、配置候补名单和抢先体验流程，并实现计费。通过自然语言提示获得 Next.js、React、Expo 等的特定框架示例。",
    "Search, draft, and chart patents": "搜索、起草并图示专利",
    "Connect to Solve Intelligence for patent workflows directly in Claude. Search across patent and non-patent literature, legal texts and case law, SEP technical standards, and the open web. Ask Claude to find prior art or infringing products, conduct legal research, map claims to standards, and analyse or draft patent documents.": "连接 Solve Intelligence，直接在 Claude 中处理专利工作流。跨专利和非专利文献、法律文本和判例法、SEP 技术标准和开放网络搜索。让 Claude 查找现有技术或侵权产品、进行法律研究、把权利要求映射到标准，并分析或起草专利文档。",
    "Embed trusted expert insights directly into your research and decision making workflows in real-time. Powered by Guidepoint's in-house team of former investment analysts, we combine institutional-grade quality with the volume needed for decision-critical work. Claude pulls verbatim excerpts from 100,000+ compliance-reviewed expert interview transcripts — with every source transcript linked inline for verifiable, trusted data.": "把可信的专家洞察实时嵌入你的研究和决策工作流。由 Guidepoint 内部的前投资分析师团队驱动，我们把机构级质量与决策关键工作所需的量结合起来。Claude 从 100,000+ 份经合规审查的专家访谈转写中拉取逐字摘录——每份源转写都内联链接，提供可核验、可信的数据。",
    "Turn Claude into your personal industry analyst, powered by IBISWorld's coverage of thousands of industries and 10 million data points. Access revenue and employment statistics, financial ratios, risk scores, cost structures, trade data, analyst-written insights, and other industry statistics. Size markets, forecast trends, and assess risk across banking, consulting, accounting, sales, and other strategic workflows without ever leaving Claude.": "把 Claude 变成你的私人行业分析师，由 IBISWorld 对数千个行业和 1000 万个数据点的覆盖驱动。访问营收和就业统计、财务比率、风险评分、成本结构、贸易数据、分析师撰写的洞察和其他行业统计。在银行、咨询、会计、销售和其他战略工作流中估算市场规模、预测趋势并评估风险，全程不离开 Claude。",
    "Structured credit insights and analytics": "结构化信用洞察与分析",
    "Integrate Morningstar's comprehensive investment data and independent research directly into your AI workflows. Through our MCP-powered connector, clients can explore cross-asset coverage—including funds, equities, and beyond, enhanced by forward-looking insights from our global analyst teams. Access trusted, unbiased intelligence to support investment decisions, due diligence, and portfolio strategy in one seamless experience.": "把 Morningstar 全面的投资数据和独立研究直接集成进你的 AI 工作流。通过我们 MCP 驱动的连接器，客户可以探索跨资产覆盖——包括基金、股票等，并由我们全球分析师团队的前瞻性洞察加以增强。访问可信、无偏见的情报，在一个无缝体验中支撑投资决策、尽职调查和资产组合策略。",
    "Analyze U.S. fixed income trade and reference data": "分析美国固定收益交易和参考数据",
    "Query real-time and historical bond trades across corporate, agency and securitized products reported to FINRA TRACE, and municipal bond trades reported to MSRB RTRS. Look up bond reference data including coupon details and maturity dates.": "查询向 FINRA TRACE 报告的公司、机构和证券化产品的实时和历史债券交易，以及向 MSRB RTRS 报告的市政债券交易。查询含票息详情和到期日的债券参考数据。",
    "AI-powered workflows for Webex meetings": "面向 Webex 会议的 AI 驱动工作流",
    "Streamline meeting management with automated scheduling, transcript access, and recaps.": "用自动化排程、转写访问和回顾，简化会议管理。",
    "Search your context lake and safely run actions": "搜索你的上下文湖并安全执行操作",
    "Connect Port's context lake and software catalog directly to Claude. Query services, dependencies, and ownership using natural language. Analyze scorecards and service health. Execute governed self-service actions and workflows with built-in guardrails.": "把 Port 的上下文湖和软件目录直接连接到 Claude。用自然语言查询服务、依赖和归属。分析评分卡和服务健康度。在内置护栏下执行受治理的自助操作和工作流。",
    "Event platform for managing tickets, orders & more": "管理门票、订单等的活动平台",
    "Provides event organisers with tools to interact with a Ticket Tailor box office account. It covers nearly every aspect of event ticketing: from event creation and ticket issuing, to managing orders, discounts, products, and more.": "为活动主办方提供与 Ticket Tailor 票务账户交互的工具。它覆盖活动票务的几乎每个方面：从活动创建和出票，到管理订单、折扣、产品等。",
    "Search government procurement & spending data": "搜索政府采购和支出数据",
    "Search government contracts, awards, and vendors directly from Claude. GovTribe brings U.S. procurement intelligence into your AI workflow — find relevant opportunities across federal, state, and local agencies; analyze vendor competition; explore teaming partners; and track agency spending patterns.": "直接从 Claude 搜索政府合同、授标和供应商。GovTribe 把美国采购情报带入你的 AI 工作流——跨联邦、州和地方机构查找相关机会、分析供应商竞争、探索组队伙伴，并跟踪机构支出模式。",
    "Automate eSignature workflows directly from Claude": "直接在 Claude 中自动化电子签名工作流",
    "Get documents signed faster without switching between tools. The SignNow MCP server connects Claude directly to your SignNow account, letting you manage the entire eSignature workflow through conversation. Send signature requests, create documents from templates and pre-fill them, track invite statuses, and retrieve signed files — all by describing what you need in plain language. Whether you're handling contracts, agreements, or approvals, Claude handles the SignNow actions so you can focus on your work instead of chasing signatures.": "更快地让文档被签署，无需在工具间切换。SignNow MCP 服务器把 Claude 直接连接到你的 SignNow 账户，让你通过对话管理整个电子签名工作流。发送签名请求、从模板创建文档并预填、跟踪邀请状态并检索已签文件——全部通过用大白话描述你的需求。无论你在处理合同、协议还是审批，Claude 都替你处理 SignNow 操作，让你专注工作而不必追着要签名。",
    "Secure, production-ready AI orchestration for privacy": "面向隐私、安全且可用于生产的 AI 编排",
    "Automate privacy operations tasks—such as data subject reporting, syncing ticket status information into other project tools, etc—using agentic workflows within Claude, transforming privacy into a connected, high-impact operational system. Built on a \"No-Compromise\" architecture, it ensures single-tenant isolation, human-governed actions, and zero training on customer data.": "用 Claude 内的 agent 化工作流自动化隐私运营任务——如数据主体报告、把工单状态信息同步到其他项目工具等——把隐私变成一个互联、高影响力的运营系统。它建立在「不妥协」架构上，确保单租户隔离、由人治理的操作，以及对客户数据零训练。",
    "Access and analyze blockchain data": "访问并分析区块链数据",
    "Provides access to multichain blockchain data such as balances, tokens, NFTs, contract metadata for contextual analysis.": "提供对多链区块链数据的访问，如余额、代币、NFT、合约元数据，用于情境化分析。",
    "The system of action for conversation data": "面向对话数据的行动系统",
    "Connect Claude to your Spinach AI meeting history. Access summaries, key decisions, and action items from your team syncs directly within your workflow. Ask Claude questions about recent discussions, track open tasks, and recall specific project details. Use your meeting context to seamlessly draft follow-up emails, project updates, and strategy documents without leaving the chat.": "把 Claude 连接到你的 Spinach AI 会议历史。直接在你的工作流内访问团队同步会的摘要、关键决策和行动项。就近期讨论向 Claude 提问、跟踪未完成任务、回忆特定项目细节。用你的会议上下文无缝起草跟进邮件、项目更新和策略文档，全程不离开对话。",
    "Discover every grant opportunity in existence.": "发现现存的每一个资助机会。",
    "Search virtually every grant opportunity in existence - federal, state, and private foundation - using natural language. Most databases cover the big programs. Granted also surfaces the long tail: niche state grants, small family foundations, and hyper-local opportunities that nonprofits never find because no single database indexes them all. Research 133,000 US foundations with IRS 990 financials and key officers. Analyze 7 million federal award records to see who's actually winning.": "用自然语言搜索几乎所有现存的资助机会——联邦、州和私人基金会。大多数数据库只覆盖大项目。Granted 还呈现长尾：小众的州级资助、小型家族基金会，以及非营利组织因无单一数据库全部收录而从未发现的超本地机会。研究 133,000 家带 IRS 990 财务和关键负责人的美国基金会。分析 700 万条联邦授标记录，看谁真正在赢。",
    "Build GoCardless payment API integrations": "构建 GoCardless 支付 API 集成",
    "Get intelligent, context-aware guidance for building GoCardless payment integrations directly from Claude. The GoCardless MCP provides comprehensive knowledge of API endpoints, integration patterns, webhooks, and code samples across all supported languages. Use it to generate integration code, set up payment pages, handle recurring billing, and follow best practices for error handling and security.": "直接从 Claude 获得智能、感知上下文的指导，构建 GoCardless 支付集成。GoCardless MCP 提供对 API 端点、集成模式、webhook 和所有支持语言代码示例的全面知识。用它生成集成代码、搭建支付页面、处理周期性计费，并遵循错误处理和安全的最佳实践。",
    "Bring all your data in one place & connect it to Claude": "把你的所有数据汇聚一处并连接到 Claude",
    "Polar is the trusted data layer for commerce brands. Connect your Shopify, Meta, Google, Klaviyo, and 45+ other data sources into a unified semantic layer with validated metrics, custom business rules, and cross-platform attribution. Turn Claude into your data analyst. Get answers on ROAS, CAC, top-performing SKUs, profit margins, and more, with answers grounded in consistent, reconciled data instead of raw API pulls. Polar eliminates the \"different answer every time\" problem by applying your business definitions, exclusions, and attribution logic to every query. Supports multi-store setups and works with major e-commerce integrations.": "Polar 是电商品牌可信的数据层。把你的 Shopify、Meta、Google、Klaviyo 和 45+ 个其他数据源连接进一个统一的语义层，带经验证的指标、自定义业务规则和跨平台归因。把 Claude 变成你的数据分析师。获得关于 ROAS、CAC、表现最佳 SKU、利润率等的答案，答案扎根于一致、经对账的数据，而非原始 API 拉取。Polar 通过把你的业务定义、排除项和归因逻辑应用到每个查询，消除「每次答案都不一样」的问题。支持多店铺设置，兼容主流电商集成。",
    "Civil legal guidance for self-represented litigants": "面向自我代理诉讼当事人的民事法律指导",
    "Courtroom5 provides legal guidance to the 80% of civil litigants who appear in court without an attorney. Three jurisdiction-aware tools cover serious civil matters across all 50 US states: a case intake assessment that identifies viable claims and first steps; a deadline calculator that returns precise procedural deadlines and miss-consequences by state and court level; and next-step guidance for users mid-litigation. Built for self-represented homeowners facing foreclosure, employees fired in retaliation, defendants in debt collection lawsuits, and others priced out of legal representation.": "Courtroom5 为占民事诉讼当事人 80% 的、无律师出庭的人提供法律指导。三个感知司法辖区的工具覆盖全美 50 个州的严肃民事事务：一个识别可行诉求和第一步的案件受理评估；一个按州和法院层级返回精确程序截止日期及错过后果的截止日期计算器；以及为诉讼进行中的用户提供的下一步指导。为面临止赎的自我代理房主、被报复性解雇的员工、债务催收诉讼的被告，以及其他负担不起律师代理的人打造。",
    "Ask AI about your sales calls, deals & pipeline": "向 AI 询问你的销售通话、交易和管道",
    "Sybill is the context layer for your revenue org. Connect it to Claude and ask anything about your sales conversations, deals, and pipeline grounded in real call transcripts, AI-generated summaries, MEDDIC scores, and CRM data. Surface action items from calls, identify at-risk deals, prep for meetings with full conversation history, and spot patterns across your team's interactions. Sybill unifies the fragmented signals across calls, emails, and CRM into a single coherent picture that Claude can reason over.": "Sybill 是你营收组织的上下文层。把它连接到 Claude，就你的销售对话、交易和管道问任何问题，答案扎根于真实的通话转写、AI 生成的摘要、MEDDIC 评分和 CRM 数据。呈现通话中的行动项、识别有风险的交易、用完整对话历史为会议做准备，并发现你团队互动中的规律。Sybill 把散落在通话、邮件和 CRM 中的碎片信号统一成一张 Claude 可以推理的连贯图景。",
    "Create documents, one-pagers, decks, and presentations directly inside Claude. No extra subscriptions, no switching tabs. Tell Claude what you want built and Send publishes it as a shareable link in seconds. Recipients get a beautiful interactive webpage instead of a stale PowerPoint (ppt) attachment. You get notified when they open it, and can capture their name, email, and phone right from the page. Host it all on your own domain and track your top viewers.": "直接在 Claude 内创建文档、一页纸、演示稿和 PPT。无需额外订阅、无需切换标签页。告诉 Claude 你想构建什么，Send 几秒就把它发布为一个可分享的链接。收件人得到的是一个漂亮的交互式网页，而不是过时的 PowerPoint (ppt) 附件。他们打开时你会收到通知，并能直接从页面捕获他们的姓名、邮箱和电话。全部托管在你自己的域名下，并跟踪你的头部访客。",
    "Your nutrition data, inside every Claude conversation.": "你的营养数据，融入每一次 Claude 对话。",
    "Alma is an AI nutrition coach that tracks what you eat, monitors 25+ micronutrients per meal, and scores your diet quality in real time using Harvard's Alternate Healthy Eating Index. Connect Alma to Claude and your full nutrition context comes with you: meals logged, nutrient gaps, Alma Score trends, and coaching history. Ask Claude questions about your actual diet, get personalized guidance, and close nutritional gaps faster. Built for anyone serious about eating better, from everyday health optimizers to GLP-1 patients and performance athletes.": "Alma 是一个 AI 营养教练，它跟踪你吃了什么、监控每餐 25+ 种微量营养素，并用哈佛的替代健康饮食指数实时为你的饮食质量打分。把 Alma 连接到 Claude，你完整的营养上下文随之而来：记录的餐食、营养缺口、Alma Score 趋势和辅导历史。就你真实的饮食向 Claude 提问、获得个性化指导，并更快地弥合营养缺口。为任何认真想吃得更好的人打造，从日常健康优化者到 GLP-1 患者和竞技运动员。",
    "Authenticated access to your Postgres and MySQL DB's": "对你的 Postgres 和 MySQL 数据库的认证访问",
    "Access to your PlanetScale organizations, databases, branches, schema, and Insights data.": "访问你的 PlanetScale 组织、数据库、分支、schema 和 Insights 数据。",
    "Find people, productivity and business impact insights": "获取人员、生产力和业务影响洞察",
    "Ask Vee questions about your people and work data in Visier. Get insights on work performance, employee satisfaction, attrition predictions, and retention of key team members. Requires a Vee subscription.": "在 Visier 中就你的人员和工作数据向 Vee 提问。获得关于工作表现、员工满意度、流失预测和关键团队成员留存的洞察。需要 Vee 订阅。",
    "Discover local food spots and order with a conversation": "发现本地美食点，用对话下单",
    "Order by Cash App brings local food ordering into Claude. Discover nearby restaurants, compare menus, customize your order, and check out, all in the conversation. On clients that support it, an interactive ordering view opens right in chat.": "Order by Cash App 把本地点餐带入 Claude。发现附近的餐厅、比较菜单、定制你的订单并结账，全部在对话中完成。在支持的客户端上，一个交互式点餐视图会直接在对话里打开。",
    "Turn Claude into your Razorpay Dashboard Assistant": "把 Claude 变成你的 Razorpay 仪表盘助手",
    "Access your Razorpay merchant data directly from Claude. Query payments, orders, refunds, and settlements instantly through natural conversation. Track QR code transactions, monitor payment links, review payout history, and generate settlement reconciliation reports—all without leaving your AI workflow. Transform Claude into your intelligent merchant dashboard that retrieves real-time business insights, helping you understand payment trends and reconcile transactions faster, with less friction.": "直接从 Claude 访问你的 Razorpay 商户数据。通过自然对话即时查询支付、订单、退款和结算。跟踪二维码交易、监控支付链接、查看 payout 历史并生成结算对账报告——全程不离开你的 AI 工作流。把 Claude 变成你智能的商户仪表盘，检索实时业务洞察，帮你更省心地理解支付趋势、更快对账。",
    "Know everything about your prospects & customers with CRMx": "用 CRMx 全面了解你的潜在客户和现有客户",
    "Day AI is an AI-Native CRM that transforms emails, chats and meetings into richly-structured CRM data, stored in an LLM-optimized format for seamless and deep, relevant context retrieval. Use this Connector to give Claude direct access to your richly-structured customer data, enabling intelligent automation and decision-making grounded in real customer context.": "Day AI 是一个 AI 原生 CRM，它把邮件、聊天和会议转化为结构丰富的 CRM 数据，以 LLM 优化的格式存储，实现无缝、深入、相关的上下文检索。用这个连接器让 Claude 直接访问你结构丰富的客户数据，实现扎根于真实客户上下文的智能自动化和决策。",
    "Query your CRM. Create records. Ask anything.": "查询你的 CRM。创建记录。随便问。",
    "Lab test insights, health answers, nutrition plans": "化验洞察、健康解答、营养方案",
    "Function members can securely view lab test results, ask health questions, and get nutrition plans. Function includes 160+ lab tests per year to monitor 1,000+ diseases, help uncover possible causes of unexplained symptoms, and create a roadmap for feeling your best. Test your heart, hormones, thyroid, liver, kidneys, toxins, nutrients, inflammation, autoimmunity, immunity and more.": "Function 会员可以安全查看化验结果、就健康提问并获得营养方案。Function 每年包含 160+ 项化验来监测 1,000+ 种疾病、帮助揭示不明症状的可能成因，并为你感觉最佳制定路线图。检测你的心脏、激素、甲状腺、肝、肾、毒素、营养素、炎症、自身免疫、免疫力等。",
    "Discover the right Wyndham Hotel for you, faster": "更快找到适合你的温德姆酒店",
    "Finding the right place to stay shouldn't be complicated. With Claude, you can explore and compare Wyndham Hotels & Resorts just by asking. Search hotels by city and travel dates, narrow options by amenities like pools or pet-friendly, and get quick, easy answers to your questions. Whether you're planning a weekend getaway, a family vacation, or a work trip, find the right Wyndham hotel for you faster using natural language and personalized results.": "找到合适的住处不该那么麻烦。有了 Claude，只需开口就能探索和比较温德姆酒店及度假村。按城市和出行日期搜索酒店、按泳池或宠物友好等设施缩小选项，并快速轻松地得到你问题的答案。无论你在规划周末小憩、家庭度假还是出差，都能用自然语言和个性化结果更快找到适合你的温德姆酒店。",
    "Turn your Digits financials into a live data feed for Claude. Get instant answers about transactions, balances, and financial statements, or configure Claude to automate recurring tasks — weekly cash summaries, burn rate alerts, board-ready reports.": "把你的 Digits 财务变成给 Claude 的实时数据流。即时获得关于交易、余额和财务报表的答案，或配置 Claude 自动化周期性任务——每周现金摘要、消耗率提醒、可提交董事会的报告。",
    "Search pg and Tiger docs, learn database skills": "搜索 pg 和 Tiger 文档，学习数据库技能",
    "Give your agent Postgres skills and documentation. Helps AI coding tools generate better PostgreSQL code.": "给你的 agent Postgres 技能和文档。帮助 AI 编码工具生成更好的 PostgreSQL 代码。",
    "Verisk Underwriting Intelligence provides conversational access to trusted ISO Loss Cost insights within Claude, designed for underwriters, actuaries, and product teams with an ISO Core Lines Services subscription. Today, users can explore loss cost indications, experience trends, and filing-aligned intelligence without navigating specialized tools or reports. All outputs are grounded in Verisk's authoritative ISO data and established actuarial methodologies, supporting confident, regulator-ready decisions. Built as an extensible connector, Verisk Underwriting Intelligence is designed to expand over time as additional underwriting insights and capabilities become available.": "Verisk Underwriting Intelligence 在 Claude 内提供对可信 ISO Loss Cost 洞察的对话式访问，为拥有 ISO Core Lines Services 订阅的核保人、精算师和产品团队设计。如今，用户无需在专业工具或报告中穿梭，就能探索损失成本指示、经验趋势和与申报对齐的情报。所有输出都扎根于 Verisk 权威的 ISO 数据和成熟的精算方法，支持笃定、可交监管的决策。作为一个可扩展的连接器，Verisk Underwriting Intelligence 会随着更多核保洞察和能力上线而不断扩展。",
    "Ground your work in clean, structured U.S. primary law": "让你的工作扎根于干净、结构化的美国一手法律",
    "The Descrybe Connector gives Claude access to legal research tools for working with primary law. It can help analyze a research question, search cases by legal concept or exact wording, find cases from citations or messy references, extract authorities from pasted text, retrieve summaries, case PDFs, and focused opinion passages, search statutes and regulations, check case treatment status, find citing cases, and verify quoted language against known cases.": "Descrybe 连接器让 Claude 能访问处理一手法律的法律研究工具。它能帮你分析一个研究问题、按法律概念或确切措辞检索案例、从引用或杂乱的参考中找到案例、从粘贴的文本中提取权威依据、检索摘要、案例 PDF 和聚焦的意见段落、检索法规和条例、检查案件援用状态、查找援引案例，并对照已知案例核验引述的措辞。",
    "Instant air cargo rates, quotes & tracking": "即时航空货运费率、报价和追踪",
    "Browse rates and track air cargo directly from Claude. Make CargoAi a native part of your AI workflow — an AI-powered freight agent that helps forwarders get instant quotes and monitor shipments faster, with less friction. Bring your CargoMart operations into the conversation.": "直接从 Claude 浏览费率并追踪航空货运。让 CargoAi 成为你 AI 工作流的原生一环——一个 AI 驱动的货运 agent，帮货代更快、更省心地获得即时报价并监控货物。把你的 CargoMart 运营带入对话。",
    "Anything delivered in minutes": "任何东西，几分钟送达",
    "From query to qualified lead in seconds.": "数秒内从查询到合格线索。",
    "Access Sprouts.ai's B2B prospect database through natural language queries. Search for contacts and companies by job title, industry, location, company size, and more": "通过自然语言查询访问 Sprouts.ai 的 B2B 潜客数据库。按职位、行业、地点、公司规模等搜索联系人和公司。",
    "Find funders who support causes like yours": "找到支持与你类似事业的资助方",
    "Search 168,000+ foundations, analyze giving patterns, and explore millions of grant records directly from Claude. Make funder research a native part of your AI workflow—helping nonprofit leaders discover aligned funders faster, with real data on who funds causes like yours.": "直接从 Claude 搜索 168,000+ 家基金会、分析捐赠模式并探索数百万条资助记录。让资助方研究成为你 AI 工作流的原生一环——用关于谁在资助与你类似事业的真实数据，帮助非营利领导者更快发现契合的资助方。",
    "AI-powered B2B data intelligence & analytics": "AI 驱动的 B2B 数据情报与分析",
    "Phoenix by HG Insights gives Claude access to rich B2B technographic and firmographic data, enabling intelligent analysis of technology adoption, competitive intelligence, and market insights. Query detailed data on what technologies companies use, their spending patterns, and firmographic profiles. Phoenix uses agent-based automation to answer complex business questions, helping sales, marketing, and strategy teams make data-driven decisions about target accounts, market sizing, and competitive positioning.": "Phoenix by HG Insights 让 Claude 能访问丰富的 B2B 技术画像和企业属性数据，实现对技术采用、竞争情报和市场洞察的智能分析。查询关于公司使用哪些技术、其支出模式和企业属性画像的详细数据。Phoenix 用基于 agent 的自动化回答复杂的业务问题，帮助销售、营销和策略团队就目标客户、市场规模和竞争定位做出数据驱动的决策。",
    "India's official statistics via natural language": "用自然语言获取印度官方统计数据",
    "Access India's official government statistics through natural language. MoSPI's MCP server connects AI assistants to national datasets covering GDP, inflation, employment, industrial production, higher education, health, energy, environment, trade, and more. All data comes directly from the Ministry of Statistics and Programme Implementation (MoSPI), Government of India, via the eSankhyiki portal.": "用自然语言访问印度官方政府统计数据。MoSPI 的 MCP 服务器把 AI 助手连接到覆盖 GDP、通胀、就业、工业生产、高等教育、健康、能源、环境、贸易等的国家数据集。所有数据都通过 eSankhyiki 门户直接来自印度政府统计与项目实施部（MoSPI）。",
    "Manage documents, send signature requests, and convert Markdown to PDF": "管理文档、发送签名请求，并把 Markdown 转成 PDF",
    "Connect Claude to Lumin PDF's document management services. Manage documents, send signature requests, retrieve workspace details, and convert Markdown to PDF through natural-language commands.": "把 Claude 连接到 Lumin PDF 的文档管理服务。通过自然语言命令管理文档、发送签名请求、检索工作区详情，并把 Markdown 转成 PDF。",
    "Find and hire local pros in Claude": "在 Claude 中查找并雇佣本地专业人士",
    "Thumbtack is integrated into Claude to help you take action on home projects. Ask questions about repairs, maintenance, or improvements and get matched with local pros. From leaky faucets to landscape design, we've got pros for every home project. Browse recommendations and connect with the right pro, making it easier to go from project planning to hiring without leaving the conversation.": "Thumbtack 集成进 Claude，帮你对家居项目采取行动。就维修、保养或改造提问，即可匹配到本地专业人士。从漏水的水龙头到景观设计，我们为每个家居项目都有对应的专业人士。浏览推荐并对接合适的专业人士，让你从项目规划到雇佣更轻松，全程不离开对话。",
    "Make Claude your Paytm Payments assistant": "让 Claude 当你的 Paytm 支付助手",
    "Search Apollo docs, specs, and best practices": "搜索 Apollo 文档、规范和最佳实践",
    "Apollo GraphOS Tools is a hosted MCP server that gives AI coding agents direct access to Apollo's official documentation and the Apollo Connectors specification. It provides three tools: Docs Search lets agents query across Apollo's documentation to find relevant guides, examples, and best practices for GraphQL, GraphOS, schema design, and deployment. Docs Read retrieves the full Markdown content of any documentation page so agents can provide complete, detailed guidance. Connectors Spec gives agents access to the official Apollo Connectors specification for creating and modifying REST-to-GraphQL integrations. No authentication or setup is required — just point any MCP-compatible client at the endpoint and start building.": "Apollo GraphOS Tools 是一个托管的 MCP 服务器，让 AI 编码 agent 直接访问 Apollo 的官方文档和 Apollo Connectors 规范。它提供三个工具：Docs Search 让 agent 跨 Apollo 文档查询，找到关于 GraphQL、GraphOS、schema 设计和部署的相关指南、示例和最佳实践。Docs Read 检索任意文档页的完整 Markdown 内容，让 agent 能给出完整、详尽的指导。Connectors Spec 让 agent 访问官方 Apollo Connectors 规范，用于创建和修改 REST 到 GraphQL 的集成。无需认证或配置——只需把任意兼容 MCP 的客户端指向该端点即可开始构建。",
    "Build, Ship and Secure your apps on Harness Platform": "在 Harness 平台上构建、发布并加固你的应用",
    "Ask Claude to ship a build, trace a failed deployment, toggle a feature flag, or check cloud costs. It acts directly on Harness, no tab switching required. Numerous resource types across CI/CD, GitOps, security, and FinOps, all through conversation.": "让 Claude 发布一个构建、追踪一次失败的部署、切换一个功能开关，或查看云成本。它直接在 Harness 上操作，无需切换标签页。跨 CI/CD、GitOps、安全和 FinOps 的众多资源类型，全部通过对话。",
    "Get insights from your autonomous AI analyst": "从你的自主 AI 分析师那里获取洞察",
    "Orion works 24/7, analyzing trends, uncovering opportunities, and teeing up your next move before you even log in. Your data is only telling half the story. Orion connects your business metrics with external data sources.": "Orion 全天候工作，分析趋势、挖掘机会，在你登录之前就为你的下一步做好铺垫。你的数据只讲了一半的故事。Orion 把你的业务指标与外部数据源连接起来。",
    "Sign, send & manage documents with DocuSeal": "用 DocuSeal 签署、发送并管理文档",
    "DocuSeal lets you create document templates, send them for signing, and track submission status — all through Claude. Search your existing templates by name, upload new PDFs to create signable forms with auto-detected fields, send documents to multiple signers via email, and search signed or pending submissions by submitter name, email, or template. Built for teams that need fast, simple e-signatures without leaving their workflow.": "DocuSeal 让你创建文档模板、发送去签署并跟踪提交状态——全部通过 Claude。按名称搜索你现有的模板、上传新 PDF 以创建带自动检测字段的可签表单、通过邮件把文档发给多名签署人，并按签署人姓名、邮箱或模板搜索已签或待签的提交。为需要快速、简单电子签名而不离开工作流的团队打造。",
    "Manage blockchain infrastructure right in Claude": "直接在 Claude 中管理区块链基础设施",
    "Quicknode brings enterprise blockchain infrastructure management into Claude through a single connector. You can manage endpoints across 80+ chains and 135+ networks, monitor logs and usage, configure rate limits and security controls, and handle billing visibility from natural language.": "Quicknode 通过单一连接器把企业区块链基础设施管理带入 Claude。你可以跨 80+ 条链和 135+ 个网络管理端点、监控日志和用量、配置速率限制和安全控制，并用自然语言处理账单可见度。",
    "Company intelligence & workforce analytics": "公司情报与劳动力分析",
    "Enables users to search company databases, analyze employee headcount trends, track hiring and attrition rates, explore corporate structures, and benchmark workforce metrics across industries": "让用户搜索公司数据库、分析员工人数趋势、跟踪招聘和流失率、探索企业结构，并跨行业对标劳动力指标。",
    "Access your deal intelligence": "访问你的交易情报",
    "Use Metal to search your firm’s companies, deals, documents, people, activities, lists, and workflows. Find relevant firm history, inspect source documents, review deal context, map contacts, and run approved workflows while respecting each user’s Metal permissions.": "用 Metal 搜索你公司的公司、交易、文档、人员、活动、列表和工作流。在尊重每个用户 Metal 权限的前提下，查找相关的公司历史、检查源文档、查看交易上下文、映射联系人并运行已批准的工作流。",
    "Discover live entertainment events worldwide": "发现全球各地的现场娱乐活动",
    "Discover and explore live entertainment experiences worldwide through Fever. Search events by city, date, location, or keyword across concerts, shows, festivals, immersive experiences, and more. Filter by popularity, price, rating, or proximity. Get event details including schedules, venues, ratings, and pricing.": "通过 Fever 发现并探索全球各地的现场娱乐体验。跨演唱会、演出、音乐节、沉浸式体验等，按城市、日期、地点或关键词搜索活动。按热度、价格、评分或距离筛选。获取含日程、场馆、评分和价格的活动详情。",
    "Find and engage with verified nonprofits": "查找并对接经核实的非营利组织",
    "Search for trusted causes to donate to or volunteer with from Benevity's database of more than 2.3 million verified nonprofits.": "从 Benevity 超过 230 万家经核实非营利组织的数据库中，搜索值得信赖的公益事业去捐赠或做志愿者。",
    "Control Google Chrome browser tabs, windows, and navigation": "控制 Google Chrome 浏览器的标签、窗口和导航",
    "The Taskrabbit MCP connector lets Claude check service availability and pricing in the user's location. When a service is available, Claude guides the user through scoping questions to understand their needs — such as room count, space type, and other relevant details — then surfaces accurate local pricing and connects them with a booking link. Currently supported capabilities include availability checks, location-based pricing, and scoping conversations across Taskrabbit's range of home services.": "Taskrabbit MCP 连接器让 Claude 查看用户所在地的服务可用性和价格。当某项服务可用时，Claude 会引导用户回答界定问题以理解其需求——如房间数量、空间类型和其他相关细节——然后呈现准确的本地价格并给出预订链接。目前支持的能力包括可用性查询、基于地点的定价，以及跨 Taskrabbit 各类家居服务的需求界定对话。",
    "Manage and automate your support tickets": "管理并自动化你的支持工单",
    "Search conversations, monitor SLAs, and analyze support metrics directly from Claude. Make Unthread a native part of your AI workflow—a support intelligence layer that helps you stay on top of your helpdesk's performance.": "直接从 Claude 搜索对话、监控 SLA 并分析支持指标。让 Unthread 成为你 AI 工作流的原生一环——一个支持情报层，帮你掌控你帮助台的表现。",
    "Estimate your federal & state taxes with Aiwyn's tax engine": "用 Aiwyn 的税务引擎估算你的联邦和州税",
    "Estimate your federal & state taxes using Aiwyn's tax engine that's filed over 1 million returns. Give Claude your tax documents (e.g. W-2s) and get a 1040 PDF back.": "用 Aiwyn 已报过 100 多万份报税表的税务引擎估算你的联邦和州税。把你的税务文档（如 W-2）给 Claude，拿回一份 1040 PDF。",
    "High-quality translation with human verification": "带人工校验的高质量翻译",
    "Seamlessly integrate high-quality, guaranteed translation capabilities directly into your Claude instance, bringing your brand's unique context where you already work. Submit content for brand-aligned translation via customized AI or human-verified translation with a simple prompt, ensuring the highest quality while you maintain full control.": "把高质量、有保证的翻译能力无缝集成进你的 Claude 实例，把你品牌独特的上下文带到你已经工作的地方。用一个简单的提示，通过定制的 AI 或人工校验翻译提交内容以做符合品牌的翻译，在你保持完全掌控的同时确保最高质量。",
    "Shapes MCP connects Claude directly to your live HR data. Ask about headcount, attrition risk, comp gaps, time off and more. Now get instant answers without switching tools. Your existing Shapes permissions carry through to every conversation, so everyone only sees what they're already allowed to. Connect in minutes, no engineering required.": "Shapes MCP 把 Claude 直接连接到你的实时 HR 数据。询问人数、流失风险、薪酬差距、休假等。现在无需切换工具就能即时获得答案。你现有的 Shapes 权限贯穿每一次对话，所以每个人只看到自己本就有权看到的内容。几分钟连接，无需工程投入。",
    "Analyze client conversations, patterns, and insights.": "分析客户对话、模式和洞察。",
    "Zocks connects Claude to the client data financial advisors rely on - including conversation intelligence, meeting insights, and the goals, concerns, and planning opportunities captured across every interaction. With access to this context through Zocks, Claude can analyze client history to surface tax considerations, estate planning signals, and other client-specific insights advisors may want to explore further.": "Zocks 把 Claude 连接到理财顾问所依赖的客户数据——包括对话智能、会议洞察，以及跨每一次互动捕获的目标、顾虑和规划机会。通过 Zocks 访问这些上下文，Claude 可以分析客户历史，呈现税务考量、遗产规划信号，以及顾问可能想进一步探究的其他客户特定洞察。",
    "Explore Kpler's maritime and commodities intelligence": "探索 Kpler 的航运和大宗商品情报",
    "The Kpler MCP connector gives Claude read-only access to Kpler's maritime and commodities intelligence — analyst-verified trade flows, AIS vessel tracking, port calls, refinery operations, freight markets, compliance risk, and supply/demand balances. Ask questions in plain English instead of writing API calls or SQL. Built for the analysts, traders, compliance officers, and operators who already use Kpler day-to-day. All operations are read-only; the connector cannot modify any data in Kpler's systems.": "Kpler MCP 连接器让 Claude 只读访问 Kpler 的航运和大宗商品情报——分析师核实的贸易流、AIS 船舶追踪、港口停靠、炼油运营、货运市场、合规风险和供需平衡。用大白话提问，无需写 API 调用或 SQL。为已经日常使用 Kpler 的分析师、交易员、合规官和运营人员打造。所有操作均为只读；连接器无法修改 Kpler 系统中的任何数据。",
    "Up-to-date Mastercard APIs, docs, and guides": "最新的 Mastercard API、文档和指南",
    "Connect your AI assistant to Mastercard's developer platform. This server gives AI agents live access to Mastercard's full API catalog, including endpoint specs, request and response details, authentication guides for OAuth 1.0a, OAuth 2.0, and Open Finance, and structured documentation with code samples. Agents can discover services, retrieve integration guides, and generate accurate code without relying on stale training data.": "把你的 AI 助手连接到 Mastercard 的开发者平台。这个服务器让 AI agent 实时访问 Mastercard 的完整 API 目录，包括端点规格、请求和响应详情、OAuth 1.0a、OAuth 2.0 和 Open Finance 的认证指南，以及带代码示例的结构化文档。agent 可以发现服务、检索集成指南并生成准确的代码，无需依赖过时的训练数据。",
    "Connect your health records for personalized insights": "连接你的健康档案，获取个性化洞察",
    "HealthEx connects Claude to your health records, enabling personalized insights and proactive health management through secure data access.": "HealthEx 把 Claude 连接到你的健康档案，通过安全的数据访问实现个性化洞察和主动的健康管理。",
    "Browse music charts & your personalized music picks": "浏览音乐榜单和为你个性化推荐的音乐",
    "Manage your Stytch Project": "管理你的 Stytch 项目",
    "The Stytch MCP Server enables AI assistants to programmatically manage your Stytch Project like Redirect URLs, Email Templates, and more.": "Stytch MCP 服务器让 AI 助手能以编程方式管理你的 Stytch 项目，如重定向 URL、邮件模板等。",
    "1:1 account agents for GTM teams": "面向 GTM 团队的一对一客户 agent",
    "Win more deals with Actively inside Claude by directly accessing your always-on per account agents that help you drive the next best action. Actively AI's per-account agents are synthesizing across all of your internal context (ex. CRM data, call transcripts, emails) and external signals to drive actionable intelligence. Designed for SDRs, AEs, AMs, and revenue leaders who need deep, contextual account knowledge, from meeting prep and deal strategy to territory prioritization, directly inside Claude.": "在 Claude 内用 Actively 赢下更多交易——直接访问你随时在线的、按客户维度的 agent，帮你驱动下一步最佳行动。Actively AI 的按客户 agent 跨你所有的内部上下文（如 CRM 数据、通话转写、邮件）和外部信号做综合，驱动可落地的情报。为需要深度、情境化客户认知的 SDR、AE、AM 和营收领导者打造，从会议准备、交易策略到区域优先级排序，全部直接在 Claude 内。",
    "Search for US Government Contracting Data": "搜索美国政府合同数据",
    "The Tango server gives AI agents access to reliable, LLM-friendly federal procurement competitive intelligence so that procurement professionals can focus on delivering on mission.": "Tango 服务器让 AI agent 能访问可靠、对 LLM 友好的联邦采购竞争情报，让采购专业人士能专注于完成使命。",
    "Search your Consilio matters, docs, and more.": "搜索你的 Consilio 案件、文档等。",
    "Aurora is a read-only connector that puts your Consilio engagement, document, and other data at Claude's fingertips. Ask Claude to find a matter by client or alpha-code, list the workspaces inside it, run a full-text search across documents. AI-powered investigations let Claude follow an answer across matters, workspaces, and documents in a single conversation — automatically narrowing ambiguous queries to the right context and citing a direct source URL on every record. Every response is scoped to what you're already entitled to see on the Consilio web products.": "Aurora 是一个只读连接器，把你的 Consilio 案件、文档和其他数据放到 Claude 触手可及处。让 Claude 按客户或字母代码查找某个事务、列出其中的工作区、跨文档做全文搜索。AI 驱动的调查让 Claude 在一次对话中跨事务、工作区和文档追踪一个答案——自动把模糊查询收窄到正确的上下文，并在每条记录上引用一个直接的源 URL。每个回复都限定在你本就有权在 Consilio 网页产品上看到的范围内。",
    "Control Microsoft PowerPoint with AppleScript automation": "用 AppleScript 自动化控制 Microsoft PowerPoint",
    "Simulate fund classifications under proposed SFDR 2.0": "模拟拟议的 SFDR 2.0 下的基金分类",
    "Assess how investment funds may be classified under the European Commission's proposed SFDR 2.0 framework — directly from Claude. Search funds by name, ISIN, or CUSIP and get simulated Article classifications based on Clarity AI's regulatory disclosure data and proprietary modelling of the November 2025 proposal. Ideal for ESG analysts, portfolio managers, and compliance teams preparing for the regulatory transition before final rules are published. This is a live tool that will evolve as we learn more from ongoing EU discussions and guidance.": "评估投资基金在欧盟委员会拟议的 SFDR 2.0 框架下可能如何被分类——直接从 Claude。按名称、ISIN 或 CUSIP 搜索基金，基于 Clarity AI 的监管披露数据和对 2025 年 11 月提案的专有建模，获得模拟的条款分类。适合为监管过渡做准备、赶在最终规则发布前的 ESG 分析师、投资组合经理和合规团队。这是一个实时工具，会随着我们从持续的欧盟讨论和指引中学到更多而演进。",
    "Search and explore regulated software lifecycle data": "搜索并探索受监管的软件生命周期数据",
    "Ketryx MCP gives your AI tools direct access to your unified compliance data. Ask a compliance question and get instant, auditable answers across your entire toolchain: Jira, JAMA, GitHub, TestRail, Polarion, and Azure DevOps.": "Ketryx MCP 让你的 AI 工具直接访问你统一的合规数据。问一个合规问题，跨你的整个工具链——Jira、JAMA、GitHub、TestRail、Polarion 和 Azure DevOps——即时获得可审计的答案。",
    "Control Microsoft Word with AppleScript automation": "用 AppleScript 自动化控制 Microsoft Word",
    "Calm board-defense guidance for licensed pros.": "为持证专业人士提供沉稳的董事会辩护指导。",
    "BoardWise is a read-only educational MCP server for licensed professionals — nurses, physicians, pharmacists, social workers, CDL holders, and others — facing state licensing-board matters. Claude can use it to look up jurisdiction-specific response deadlines, generate structured outlines for response letters, search BoardWise's library of educational guides, and surface curated resources for situations like complaints, CEU audits, consent agreements, hearing notices, and self-reports. All responses are general educational information (not legal advice). No personal or case data is transmitted, stored, or sent to third parties.": "BoardWise 是一个只读的教育性 MCP 服务器，面向持证专业人士——护士、医生、药剂师、社工、CDL 持有者等——处理州执照委员会事务。Claude 可以用它查询特定司法辖区的回复截止日期、为回复信生成结构化提纲、搜索 BoardWise 的教育指南库，并为投诉、CEU 审计、同意协议、听证通知和自我报告等情形呈现精选资源。所有回复均为一般性教育信息（非法律建议）。不传输、存储任何个人或案件数据，也不发送给第三方。",
    "Manage virtual cards and track your spending patterns": "管理虚拟卡并跟踪你的消费模式",
    "Create new Merchant-Locked and Single-Use virtual cards, manage card settings in bulk, and track your spending patterns directly from Claude. Leverage an AI-powered virtual card agent that helps you make changes programmatically and at scale—giving you deeper control over your payments with features like spend limits, card pausing, and closing.": "直接从 Claude 创建新的商户锁定和单次使用虚拟卡、批量管理卡设置，并跟踪你的消费模式。借助一个 AI 驱动的虚拟卡 agent，帮你以编程方式、大规模地做变更——用消费上限、卡片暂停和关闭等功能，给你对支付更深的掌控。",
    "Connect Claude to Verisk’s XactRestore so restoration and remodeling professionals can build and refine estimates by simply describing the work that needs to be done. Powered by Xactware’s pricing and material data, Claude can create rooms, add and adjust line items, apply Quick Estimates, and surface pricing details inside trusted XactRestore workflows, while keeping contractors in control of every change. Make estimating faster, more intuitive, and easier to review so teams spend less time wrestling with software and more time helping homeowners.": "把 Claude 连接到 Verisk 的 XactRestore，让修复和改建专业人士只需描述需要做的工作，就能构建和完善估价。由 Xactware 的定价和材料数据驱动，Claude 可以创建房间、添加和调整明细项、应用 Quick Estimates，并在可信的 XactRestore 工作流内呈现定价详情，同时让承包商掌控每一处变更。让估价更快、更直观、更易审阅，让团队少花时间和软件较劲、多花时间帮助房主。",
    "MCP Server that enables Claude to interact with Windows OS": "让 Claude 与 Windows 操作系统交互的 MCP 服务器",
    "Securely retrieve data from your federated data sources": "从你的联邦数据源安全检索数据",
    "The Starburst MCP server exposes a secure, read-only SQL tool for Claude. It enables governed data discovery, lightweight sampling, and execution of analytical queries across Starburst catalogs, while enforcing existing permissions, timeouts, and result-size limits and returning compact, structured results for effective AI agent workflows.": "Starburst MCP 服务器为 Claude 开放一个安全的只读 SQL 工具。它实现受治理的数据发现、轻量采样，以及跨 Starburst 目录执行分析查询，同时执行现有权限、超时和结果大小限制，并返回紧凑、结构化的结果以支持高效的 AI agent 工作流。",
    "One connection to access all your tools securely": "一个连接，安全访问你的所有工具",
    "Jentic connects Claude to 10,000+ APIs through a single MCP server. Credentials never touch your prompts — Jentic's managed vault handles auth centrally. Just-In-Time Tooling means agents fetch only the tools they need, keeping context lean and reasoning accurate.": "Jentic 通过单一 MCP 服务器把 Claude 连接到 10,000+ 个 API。凭据绝不接触你的提示词——Jentic 的托管保险库集中处理认证。即时工具化意味着 agent 只获取它需要的工具，让上下文保持精简、推理保持准确。",
    "Securely, compliantly access Intapp Celeste products": "安全、合规地访问 Intapp Celeste 产品",
    "Search, create, and update records across the Intapp Celeste portfolio with secure, compliant retrieval via Intapp Celeste connector with Claude. Ensure the workflows you rely on from Intapp Celeste are available to integrate into your Claude projects with the governance your clients demand.": "通过 Claude 上的 Intapp Celeste 连接器，以安全、合规的检索跨 Intapp Celeste 产品组合搜索、创建和更新记录。确保你依赖的 Intapp Celeste 工作流可以用你的客户所要求的治理集成进你的 Claude 项目。",
    "Organize Data. Discover the Truth. Act on It.": "整理数据。发现真相。付诸行动。",
    "Stand up matters, manage workspaces, govern access, and analyze usage in RelativityOne.": "在 RelativityOne 中开设事务、管理工作区、治理访问并分析用量。",
    "A local PDF workflow for Claude Desktop: fill forms, sign/date PDFs, fetch PDF URLs, merge/split files, extract data, and analyze documents.": "面向 Claude Desktop 的本地 PDF 工作流：填表单、签署/署期 PDF、抓取 PDF 链接、合并/拆分文件、提取数据并分析文档。",
    "The Figma MCP server helps you pull in Figma context and generate high-quality code that aligns with your codebase and design intent.": "Figma MCP 服务器帮你引入 Figma 上下文，生成与你的代码库和设计意图一致的高质量代码。",
    "Connect Claude to Seismic MCP for generative search": "把 Claude 连接到 Seismic MCP 进行生成式搜索",
    "Seismic MCP Connector for Claude provides secure authentication and scoped access to Seismic, enabling Claude to generate accurate, context-aware responses grounded in approved content and tools.": "面向 Claude 的 Seismic MCP 连接器提供对 Seismic 的安全认证和限定范围访问，让 Claude 能生成扎根于经批准内容和工具的准确、情境化回复。",
    "Read events and tasks, create new items, make basic edits, and delete items from Fantastical for Mac.": "在 Mac 版 Fantastical 中读取事件和任务、创建新条目、做基础编辑并删除条目。",
    "Read, write, and manage notes in Apple Notes": "在 Apple 备忘录中读取、写入并管理笔记",
    "Natural language interface with the Python API and documentation": "与 Python API 和文档的自然语言接口",
    "Analyze and get insights from your lakehouse data": "分析你的湖仓数据并获取洞察",
    "Dremio provides a Model Context Protocol (MCP) server that allows AI agents to securely access, query, and reason over enterprise lakehouse data through Dremio's unified semantic layer. With Dremio's MCP offering, agents interact with data exactly as users do in Dremio—respecting fine-grained access controls, row- and column-level security, and shared business definitions. Queries are executed directly on data in your lakehouse (Iceberg, Parquet, Delta), with no data duplication or movement. Dremio's MCP server ensures that AI agents see only what they're authorized to see, while benefiting from the same semantic consistency and performance that teams rely on for analytics and BI.": "Dremio 提供一个 Model Context Protocol (MCP) 服务器，让 AI agent 能通过 Dremio 统一的语义层安全地访问、查询并推理企业湖仓数据。有了 Dremio 的 MCP 产品，agent 与数据的交互方式与用户在 Dremio 中完全一致——尊重细粒度访问控制、行级和列级安全，以及共享的业务定义。查询直接在你湖仓中的数据（Iceberg、Parquet、Delta）上执行，无需数据复制或搬移。Dremio 的 MCP 服务器确保 AI agent 只看到它们被授权看到的内容，同时享有团队在分析和 BI 中依赖的同样的语义一致性和性能。",
    "Execute AppleScript to automate tasks on macOS.": "执行 AppleScript 以自动化 macOS 上的任务。",
    "This tool allows you to execute AppleScript commands using `osascript`, enabling automation of tasks on macOS systems. Try asking Claude to do things on your Mac, like controlling applications or changing system settings.": "这个工具让你用 `osascript` 执行 AppleScript 命令，实现 macOS 系统上的任务自动化。试着让 Claude 在你的 Mac 上做些事，比如控制应用或更改系统设置。",
    "Create, modify, and inspect CAD geometry in Fusion": "在 Fusion 中创建、修改并检查 CAD 几何体",
    "MCP server for interacting with the Drafts app on macOS": "与 macOS 上 Drafts 应用交互的 MCP 服务器",
    "A Model Context Protocol (MCP) server that enables AI assistants to interact with the Drafts app on macOS through AppleScript. Manage drafts, workspaces, tags, and run actions programmatically.": "一个 Model Context Protocol (MCP) 服务器，让 AI 助手能通过 AppleScript 与 macOS 上的 Drafts 应用交互。以编程方式管理草稿、工作区、标签并运行操作。",
    "Connect data from hundreds of data sources and apps to analyze it with Claude.": "连接来自数百个数据源和应用的数据，用 Claude 进行分析。",
    "A high-performance MCP server for Metabase analytics data access with response optimization and robust error handling.": "面向 Metabase 分析数据访问的高性能 MCP 服务器，带响应优化和稳健的错误处理。",
    "This MCP server provides AI assistants with optimized access to Metabase analytics data. Features up to 90% token reduction through response optimization, comprehensive error handling with structured responses, and tools for searching, listing, retrieving, and exporting data from Metabase instances. Includes concurrent processing, pagination support, and export capabilities for large datasets. Supports both API key and email/password authentication methods.": "这个 MCP 服务器为 AI 助手提供对 Metabase 分析数据的优化访问。特性包括：通过响应优化实现最高 90% 的 token 削减、带结构化响应的全面错误处理，以及用于从 Metabase 实例搜索、列出、检索和导出数据的工具。含并发处理、分页支持和大数据集导出能力。支持 API 密钥和邮箱/密码两种认证方式。",
    "Socket MCP server for scanning dependencies": "用于扫描依赖的 Socket MCP 服务器",
    "Power your chat with B2B data to create lead lists, research companies, personalize your outreach, and more.": "用 B2B 数据增强你的对话，创建线索名单、调研公司、个性化触达等。",
    "Send, read, and manage messages through Apple's Messages app": "通过 Apple 的信息应用发送、读取并管理消息",
    "Gene set enrichment analysis using Enrichr API with multi-library support": "使用 Enrichr API 的基因集富集分析，支持多库",
    "Control web browsers through the Model Context Protocol using Chrome DevTools": "通过 Model Context Protocol，用 Chrome DevTools 控制网页浏览器",
    "The AWS API MCP Server lets AI assistants manage AWS resources using AWS CLI commands. It acts as a secure bridge, enabling creation, updates, and management across all AWS services.": "AWS API MCP 服务器让 AI 助手用 AWS CLI 命令管理 AWS 资源。它充当安全桥梁，支持跨所有 AWS 服务进行创建、更新和管理。",
    "Audio Player MCP Bundle with ElevenLabs integration. Generate speech, sound effects, and music using the ElevenLabs API, or play any local audio file. Features playlist view, playback controls, progress bar, and speed adjustment.": "集成 ElevenLabs 的音频播放器 MCP 套件。用 ElevenLabs API 生成语音、音效和音乐，或播放任意本地音频文件。含播放列表视图、播放控制、进度条和倍速调节。",
    "MCP Server for Microsoft Clarity": "面向 Microsoft Clarity 的 MCP 服务器",
    "This extension enables integration between AI systems and Microsoft Clarity, providing access to project analytics, documentation, and session recordings.": "这个扩展实现 AI 系统与 Microsoft Clarity 的集成，提供对项目分析、文档和会话录制的访问。",
    "Analyze, search, and extract structured data from video collections using Cloudglue's video understanding platform.": "用 Cloudglue 的视频理解平台分析、搜索并从视频集中提取结构化数据。",
    "Access all your internal tools, enterprise apps & data.": "访问你的所有内部工具、企业应用和数据。",
    "Supercharge Claude by connecting it to all your internal tools, enterprise apps, and data to search knowledge and take real-world actions like updating CRMs, approving PRs, and resolving IT tickets from a single interface.": "把 Claude 连接到你所有的内部工具、企业应用和数据，为其增压，让它在单一界面中搜索知识并采取真实世界的操作，如更新 CRM、批准 PR 和解决 IT 工单。",
    "Spend more time on your craft by automating repetitive tasks with Claude and Affinity": "用 Claude 和 Affinity 自动化重复任务，把更多时间花在你的创作上",
    "ToolUniverse: An ecosystem for democratizing AI scientists with 600+ scientific tools.": "ToolUniverse：一个用 600+ 科学工具让 AI 科学家平民化的生态系统。",
    "ToolUniverse is an ecosystem for creating AI scientist systems from any large language model (LLM). It standardizes how LLMs interact with tools, integrating more than 600 machine learning models, datasets, APIs, and scientific packages for data analysis, knowledge retrieval, and experimental design. This bundle exposes ToolUniverse capability via the Model Context Protocol (MCP), enabling AI assistants to perform complex scientific tasks.": "ToolUniverse 是一个从任意大语言模型（LLM）创建 AI 科学家系统的生态系统。它标准化 LLM 与工具的交互方式，集成了 600 多个机器学习模型、数据集、API 和科学软件包，用于数据分析、知识检索和实验设计。这个套件通过 Model Context Protocol (MCP) 开放 ToolUniverse 的能力，让 AI 助手能执行复杂的科学任务。",
    "Create a website in seconds! Generate, design, write code, and write copy for your website. Powered by B12. Contact: hello@b12.io": "几秒钟建一个网站！为你的网站生成、设计、写代码并撰写文案。由 B12 提供支持。联系方式：hello@b12.io",
    "This extension allows you to create a professional, engaging, and user-friendly website in seconds using AI. To create a website, you need to provide a name for your project/business, along with a description of the project/business (goals, structure, etc.).": "这个扩展让你用 AI 几秒钟创建一个专业、吸引人、用户友好的网站。要创建网站，你需要提供项目/业务的名称，以及项目/业务的描述（目标、结构等）。",
    "Create and manage ElevenLabs Agents with an interactive UI. Build conversational AI agents with custom voices, personalities, and behaviors.": "用交互式界面创建并管理 ElevenLabs Agent。构建带自定义声音、性格和行为的对话式 AI agent。",
    "An MCP server giving access to Grafana dashboards, datasources, alerting, and more": "提供 Grafana 仪表盘、数据源、告警等访问能力的 MCP 服务器",
    "Large Quantitative Models for scientific discovery": "面向科学发现的大型量化模型",
    "SandboxAQ's Large Quantitative Models (LQMs) combine physics-based simulation with machine learning to accelerate drug discovery and materials innovation. Now, LQMs are accessible through large language models. Researchers can access frontier scientific AI in natural language, moving faster from hypothesis to breakthrough.": "SandboxAQ 的大型量化模型（LQM）把基于物理的模拟与机器学习结合起来，加速药物发现和材料创新。如今，LQM 可通过大语言模型访问。研究者可以用自然语言使用前沿的科学 AI，更快地从假设走向突破。",
    "MCP Server for interacting with GrowthBook - an open source feature flagging and experimentation platform": "与 GrowthBook 交互的 MCP 服务器——一个开源的功能开关与实验平台",
    "Smarter Workflows for Files and Signatures": "更智能的文件与签名工作流",
    "This extension empowers developers to build smarter, more automated document workflows. Access user profiles, browse workspaces, and manage signature requests from start to finish—sending, retrieving, or canceling with ease. Upload documents on demand and convert Markdown into high-quality PDFs in seconds. Designed for seamless integration, these tools reduce friction and simplify how files, signatures, and collaboration flow through any Model Context Protocol–powered system.": "这个扩展让开发者构建更智能、更自动化的文档工作流。访问用户档案、浏览工作区，并从头到尾管理签名请求——轻松发送、检索或取消。按需上传文档，几秒把 Markdown 转成高质量 PDF。为无缝集成而设计，这些工具减少摩擦，简化文件、签名和协作在任何 Model Context Protocol 驱动的系统中的流转。",
    "A Model Context Protocol (MCP) server for shadcn/ui components, providing AI assistants with access to component source code, demos, blocks, and metadata.": "面向 shadcn/ui 组件的 Model Context Protocol (MCP) 服务器，让 AI 助手访问组件源码、演示、区块和元数据。",
    "Provides Model Context Protocol (MCP) integration and tooling for Azure.": "为 Azure 提供 Model Context Protocol (MCP) 集成和工具。",
    "Semantic codebase search for Claude Desktop. Find code by meaning, not just keywords. Zero API keys, zero setup.": "面向 Claude Desktop 的语义代码库搜索。按含义找代码，而不只是关键词。零 API 密钥、零配置。",
    "Search, create, and retrieve tasks and documents, add comments, and track time through natural language commands.": "用自然语言命令搜索、创建并检索任务和文档、添加评论并记录工时。",
    "Braze MCP Server - Model Context Protocol server for Braze REST API Read-only and Write endpoints with access to write content blocks, email templates and upload assets": "Braze MCP 服务器——面向 Braze REST API 只读和写入端点的 Model Context Protocol 服务器，可写入内容块、邮件模板并上传素材",
    // CONNECTOR-ONELINER-END

    // === 连接器 one_liner (快照后新增/手动补, 不在 servers.json; 不受 merge/inject 管理) ===
    // 社区连接器 (visibility=community, API 取不到, 从截图逐个补)
    "AI-Native Procurement Platform": "AI 原生采购平台",
    "Smarter Court Booking Starts Right Here": "更智能的球场预订，就从这里开始",
    "Explore Ryanair routes and find cheap flights": "探索 Ryanair 航线，找到便宜机票",
    "AI-powered Equity Research Platform": "AI 驱动的股票研究平台",
    "Build and ship full-stack apps": "构建并发布全栈应用",
    "Create slides and decks from topics, text, or files": "从主题、文字或文件生成幻灯片和演示稿",
    "Access financial market data across every asset class.": "访问覆盖各类资产的金融市场数据。",
    "Search, read, and edit industrial product knowledge": "搜索、阅读并编辑工业产品知识",
    "Manage your close tasks, reports, and Numeric workflows": "管理你的结账任务、报表和 Numeric 工作流",
    "Compile, run, and explore assembly in 80+ languages": "在 80+ 种语言中编译、运行并查看汇编",

    // === 连接器 description markdown 片段 (自动生成; 源 _capture/frags_en.json + frags_zh_*.json) ===
    // markdown 描述被渲染器拆成多节点, 按渲染片段逐块 exact。拆分器见 _capture/split.js (对照 Figma DOM 验证过)
    // CONNECTOR-FRAG-BEGIN
    "The Figma MCP server helps you pull in Figma context and generate high-quality code that aligns with your codebase and design intent. Use the MCP server to retrieve code resources from Figma Design or Make files, and turn your ideas into production apps.": "Figma MCP 服务器帮你引入 Figma 上下文，生成与你的代码库和设计意图一致的高质量代码。用它从 Figma Design 或 Make 文件中获取代码资源，把你的想法变成可上线的应用。",
    "Key features:": "主要功能：",
    "Generate code from selected frames or nodes": "从选中的框架或节点生成代码",
    "- Select a frame in Figma or provide a node URL to have an AI agent turn your design into code.\n•": "- 在 Figma 中选中一个框架或提供节点 URL，让 AI agent 把你的设计变成代码。\n•",
    "Extract design context from layers": "从图层提取设计上下文",
    "- Pull out variables, components, and layouts from a design to ensure builds adhere to design patterns.\n•": "- 抽取设计中的变量、组件和布局，确保构建遵循设计规范。\n•",
    "Code smarter with Code Connect": "借助 Code Connect 更聪明地写代码",
    "- Boost output quality by reusing your actual components, the MCP server informs AI agents about existing components derived from Code Connect information.\n•": "- 复用你实际的组件来提升产出质量，MCP 服务器会把 Code Connect 里已有的组件信息告知 AI agent。\n•",
    "Map your flows with diagrams": "用图表梳理流程",
    "- The Figma MCP server can turn your Claude prompts into flow charts, Gantt charts, or other diagrams in FigJam.": "- Figma MCP 服务器能把你的 Claude 提示词变成 FigJam 里的流程图、甘特图或其他图表。",
    "Note:": "注意：",
    "The get_screenshot tool is currently limited to returning a descripton of screenshots in Figma when called in Claude and Claude Code. See developer term": "在 Claude 和 Claude Code 中调用时，get_screenshot 工具目前只能返回 Figma 中截图的文字描述。开发者条款见",
    "Connect Claude to Miro to summarize existing boards or build new ones from scratch. Run sharper workshops, sprint planning, and product strategy sessions with Claude-generated layouts, frames, sticky notes, images, docs, diagrams, tables, and more.": "把 Claude 连接到 Miro，总结现有看板或从零搭建新看板。用 Claude 生成的布局、框架、便签、图片、文档、图表、表格等，把工作坊、冲刺规划和产品策略会开得更犀利。",
    "Key use cases:": "主要用例：",
    "• Summarize and search boards: Drop a board URL into Claude to pull out themes, decisions, and open questions from retros, planning sessions, and strategy maps. Search across every board you have access to.\n• Build new boards from scratch: Generate ready-to-run layouts for retros, sprint planning, and product strategy with frames, sticky notes, cards, tables, docs, and images.\n• Bring research onto the canvas: Have Claude research a topic — competitors, user feedback, market trends, prior art — and lay the findings out on a fresh board as diagrams, sticky notes, tables, docs, and images, ready to share with your team.\n• Visualize complex ideas: Turn a prompt, PR, or spec into architecture, sequence-flow, ERD, or user-journey diagrams directly on the canvas.\n• Act on feedback agentically: Read and resolve comments, reply in-thread, and convert scattered team discussion into a clear list of action items right on the board.": "• 总结并搜索看板：把看板 URL 丢给 Claude，从复盘、规划会和策略图中提炼主题、决策和待解问题。可跨你有权限的所有看板搜索。\n• 从零搭建新看板：为复盘、冲刺规划和产品策略生成开箱即用的布局，含框架、便签、卡片、表格、文档和图片。\n• 把调研搬上画布：让 Claude 调研某个主题——竞品、用户反馈、市场趋势、既有成果——并把结果以图表、便签、表格、文档和图片的形式铺在一块新看板上，随时与团队分享。\n• 可视化复杂想法：直接在画布上把提示词、PR 或规格变成架构图、时序流程图、ERD 或用户旅程图。\n• 以 agent 方式处理反馈：阅读并解决评论、在会话内回复，把零散的团队讨论整理成看板上清晰的行动项清单。",
    "EDEN is Basecamp Research's frontier biological foundation model, trained on BaseData — the\nworld's largest biological dataset, encompassing over 10 billion novel genes from more than a million species collected across 200+ sampling expeditions in 30+ countries.\nThis connector gives Claude access to two EDEN capabilities:": "EDEN 是 Basecamp Research 的前沿生物基础模型，基于 BaseData 训练——\n全球最大的生物数据集，涵盖来自 30+ 个国家、200+ 次采样考察、超过一百万个物种的 100 亿+ 个新基因。\n本连接器让 Claude 能使用 EDEN 的两项能力：",
    "Antibiotic design (EDEN-AMP): Generate novel antimicrobial peptide candidates with predicted\npotency against 11 drug-resistant bacterial strains, including MRSA, Acinetobacter baumannii, and Pseudomonas aeruginosa. 97% of EDEN-designed AMPs are active in the lab; one candidate showed efficacy in mice comparable to last-resort antibiotics.": "抗生素设计（EDEN-AMP）：生成新型抗菌肽候选物，预测其对\n11 种耐药细菌株（含 MRSA、鲍曼不动杆菌、铜绿假单胞菌）的效力。97% 的 EDEN 设计抗菌肽在实验室中具有活性；其中一个候选物在小鼠体内显示出与最后一线抗生素相当的疗效。",
    "Vaccine target prioritisation (EDEN-Immunogenicity): Predict the probability that a protein-coding antigen will trigger an immune response, using EDEN embeddings with AUROC 0.85 on external validation data. Reduces weeks of empirical target selection to a single workflow. Every BaseData sequence is collected under informed-consent and benefit-sharing agreements, with each sequence traceable to country-specific collection permits. For research use only.": "疫苗靶点优先级排序（EDEN-Immunogenicity）：预测某个蛋白编码抗原触发免疫反应的概率，使用 EDEN 嵌入，在外部验证数据上 AUROC 达 0.85。把数周的经验性靶点筛选压缩为单个工作流。每条 BaseData 序列都在知情同意和惠益分享协议下采集，每条序列可追溯到具体国家的采集许可。仅供研究使用。",
    "Inductive Bio’s absorption, distribution, metabolism, excretion, and toxicity (ADMET) models predict the chemical and pharmacokinetic properties that determine whether a molecule can become a viable drug. When these predictions are surfaced directly in conversation, scientists can evaluate compounds, triage ideas, and prioritize which molecules to synthesize, without leaving their existing workflow.": "Inductive Bio 的吸收、分布、代谢、排泄和毒性（ADMET）模型预测决定一个分子能否成为可行药物的化学和药代动力学性质。当这些预测直接呈现在对话中时，科学家可以评估化合物、分流想法，并优先决定合成哪些分子，无需离开他们现有的工作流。",
    "Through this MCP server, users can access Inductive Bio’s models for the physicochemical properties LogD (lipophilicity) and pKa (acid/base ionization), key drivers of solubility and permeability.": "通过这个 MCP 服务器，用户可以访问 Inductive Bio 关于理化性质 LogD（亲脂性）和 pKa（酸/碱电离）的模型，它们是溶解度和渗透性的关键驱动因素。",
    "Inductive’s full suite of models spans all tiers of ADMET assays, including microsomal stability, efflux, CYP inhibition, brain penetration, hERG inhibition, and more. Models are fine-tuned to each customer’s chemical space to advance predictive performance. To access the full suite, reach out to Inductive Bio here: https://www.inductive.bio/book-a-demo.": "Inductive 的完整模型套件覆盖 ADMET 检测的所有层级，包括微粒体稳定性、外排、CYP 抑制、脑穿透、hERG 抑制等。模型针对每个客户的化学空间做微调以提升预测性能。要访问完整套件，请在此联系 Inductive Bio：https://www.inductive.bio/book-a-demo。",
    "Insider MCP enables AI-powered clients to securely query Insider One CDP and APIs using natural language. It provides controlled, read-only access to Insider CDP and APIs, while fully respecting existing authentication, permission, and governance models.": "Insider MCP 让 AI 驱动的客户端能用自然语言安全查询 Insider One CDP 和 API。它提供受控的只读访问 Insider CDP 和 API，同时充分尊重现有的认证、权限和治理模型。",
    "Designed for enterprise use, Insider MCP allows teams to explore data, retrieve insights, and query platform objects without navigating dashboards or writing custom queries. All requests are permission-based, transparent, and executed through predefined APIs, ensuring security, control, and scalability as capabilities expand over time.": "为企业用途设计，Insider MCP 让团队无需在仪表盘里穿梭或写自定义查询，就能探索数据、检索洞察并查询平台对象。所有请求都基于权限、透明，并通过预定义的 API 执行，确保安全、可控，并随能力扩展而可扩展。",
    "The Kiteworks MCP Server enables Large Language Model (LLM) applications to securely interact with your Kiteworks instance through the Model Context Protocol (MCP). It provides AI assistants with the ability to manage files, folders, and user information within your Kiteworks environment while maintaining enterprise-grade security.": "Kiteworks MCP 服务器让大语言模型（LLM）应用能通过 Model Context Protocol (MCP) 安全地与你的 Kiteworks 实例交互。它让 AI 助手能在你的 Kiteworks 环境内管理文件、文件夹和用户信息，同时保持企业级安全。",
    "Key Features:": "主要功能：",
    "- File Management: Upload, download, read contents, create from content, rename, move, and delete files\n- Folder Operations: Navigate hierarchies, create, rename, move, and delete folders\n- Search: Find files and folders by name, path, content, date range\n- User Information: Access current user details and authentication status\n- OAuth 2.1 Security: Authorization Code flow with PKCE": "- 文件管理：上传、下载、读取内容、从内容创建、重命名、移动和删除文件\n- 文件夹操作：浏览层级、创建、重命名、移动和删除文件夹\n- 搜索：按名称、路径、内容、日期范围查找文件和文件夹\n- 用户信息：访问当前用户详情和认证状态\n- OAuth 2.1 安全：带 PKCE 的授权码流程",
    "This extension allows Claude to interact with your local filesystem, enabling it to read and write files directly. This can be useful for tasks such as file management, data processing, and automation of repetitive tasks. The extension provides a set of tools that can be used to navigate directories, read file contents, and write new files or modify existing ones.": "这个扩展让 Claude 与你的本地文件系统交互，使其能直接读写文件。这对文件管理、数据处理和重复任务自动化等任务很有用。扩展提供一组工具，可用于浏览目录、读取文件内容，以及写入新文件或修改现有文件。",
    "Underneath the hood, it uses @modelcontextprotocol/server-filesystem v2026.7.4.": "底层使用 @modelcontextprotocol/server-filesystem v2026.7.4。",
    "The official WorkOS connector lets you manage your WorkOS workspace from Claude in plain language, backed by the same API that powers the WorkOS Dashboard .": "官方 WorkOS 连接器让你用大白话从 Claude 管理你的 WorkOS 工作区，背后是驱动 WorkOS Dashboard 的同一套 API。",
    "Ask Claude to look up an organization, audit a user's memberships, check an SSO connection, inspect a Directory Sync (SCIM) setup, review roles and permissions, or make changes across 300+ operations spanning the WorkOS platform.": "让 Claude 查询某个组织、审计用户的成员资格、检查 SSO 连接、检查 Directory Sync (SCIM) 设置、查看角色和权限，或跨 WorkOS 平台 300+ 项操作做变更。",
    "- Query your data: organizations, users and memberships, SSO connections, Directory Sync directories and users, roles/permissions/groups (RBAC), audit logs and events, AuthKit applications, domains, webhooks, and more.\n- Take action: create and update organizations, manage users and memberships, configure connections, and run other administrative operations.\n- Discover what's available: Claude can list the supported operations and their inputs, then pick the right one for your request.": "- 查询你的数据：组织、用户和成员资格、SSO 连接、Directory Sync 目录和用户、角色/权限/组（RBAC）、审计日志和事件、AuthKit 应用、域名、webhook 等。\n- 采取行动：创建和更新组织、管理用户和成员资格、配置连接，并运行其他管理操作。\n- 发现可用能力：Claude 可以列出支持的操作及其输入，然后为你的请求挑出合适的那个。",
    "Built for enterprise trust": "为企业信任打造",
    "- Secure OAuth 2.0 authentication — Claude acts with your own WorkOS identity and permissions, never a shared API key, and only within a single environment.\n- Destructive and billing-sensitive actions require explicit confirmation before they run.\n- Admins can disable the connector or restrict it to read-only, and access is always scoped to what your role is allowed to do.": "- 安全的 OAuth 2.0 认证——Claude 以你自己的 WorkOS 身份和权限行事，绝非共享 API 密钥，且仅在单一环境内。\n- 破坏性和涉及计费的操作在执行前需要明确确认。\n- 管理员可以禁用连接器或限制为只读，访问始终限定在你的角色被允许的范围内。",
    "WorkOS is the enterprise-identity platform trusted by leading AI and SaaS companies for SSO, Directory Sync, AuthKit user management, RBAC, FGA, Vault, and audit logging. This connector brings that control surface into Claude.": "WorkOS 是领先 AI 和 SaaS 公司信赖的企业身份平台，用于 SSO、Directory Sync、AuthKit 用户管理、RBAC、FGA、Vault 和审计日志。这个连接器把那套控制面带入 Claude。",
    "Minutes is a conversation memory layer for AI assistants. It captures any audio (meetings, voice memos, brain dumps), transcribes locally with whisper.cpp, diarizes speakers, and outputs searchable markdown with structured action items and decisions.": "Minutes 是面向 AI 助手的对话记忆层。它捕获任何音频（会议、语音备忘、想法速记），用 whisper.cpp 本地转写、区分说话人，并输出带结构化行动项和决策的可搜索 markdown。",
    "Record & Transcribe:": "录制与转写：",
    "• Start/stop live meeting recordings\n• Process audio files (WAV, M4A, MP3, OGG)\n• Local transcription — nothing leaves your machine": "• 开始/停止实时会议录制\n• 处理音频文件（WAV、M4A、MP3、OGG）\n• 本地转写——不出你的机器",
    "Search & Query:": "搜索与查询：",
    "• Full-text search across all meetings\n• Find open action items by assignee\n• Track decisions and commitments\n• Person profiles across meetings\n• Cross-meeting topic research": "• 跨所有会议的全文搜索\n• 按负责人查找未完成的行动项\n• 跟踪决策和承诺\n• 跨会议的人物档案\n• 跨会议的话题研究",
    "Agent-Friendly:": "对 agent 友好：",
    "• MCP resources for stable context (recent meetings, action items, events)\n• JSON Schema for meeting format validation\n• Event log for reactive agent workflows\n• Structured YAML frontmatter on all output": "• 用于稳定上下文的 MCP 资源（近期会议、行动项、事件）\n• 用于会议格式校验的 JSON Schema\n• 用于反应式 agent 工作流的事件日志\n• 所有输出上带结构化的 YAML frontmatter",
    "MCP Server that can connect to a Kubernetes cluster and manage it.": "能连接到 Kubernetes 集群并管理它的 MCP 服务器。",
    "By default, the server loads kubeconfig from `~/.kube/config`.": "默认情况下，服务器从 `~/.kube/config` 加载 kubeconfig。",
    "The server will automatically connect to your current kubectl context. Make sure you have:": "服务器会自动连接到你当前的 kubectl 上下文。请确保你有：",
    "1. kubectl installed and in your PATH\n2. A valid kubeconfig file with contexts configured\n3. Access to a Kubernetes cluster configured for kubectl (e.g. minikube, Rancher Desktop, GKE, etc.)\n4. Optional: Helm v3 installed and in your PATH.": "1. 已安装 kubectl 并在你的 PATH 中\n2. 一个配置了上下文的有效 kubeconfig 文件\n3. 一个配置好供 kubectl 使用的 Kubernetes 集群的访问权限（如 minikube、Rancher Desktop、GKE 等）\n4. 可选：已安装 Helm v3 并在你的 PATH 中。",
    "You can verify your connection by asking Claude to list your pods or create a test deployment.": "你可以通过让 Claude 列出你的 pod 或创建一个测试部署来验证连接。",
    "If you have errors open up a standard terminal and run `kubectl get pods` to see if you can connect to your cluster without credentials issues.": "如果出错，打开一个标准终端并运行 `kubectl get pods`，看你能否在没有凭据问题的情况下连接到集群。",
    "## Features": "## 功能",
    "- [x] Connect to a Kubernetes cluster\n- [x] Unified kubectl API for managing resources\n- Get or list resources with `kubectl_get`\n- Describe resources with `kubectl_describe`\n- List resources with `kubectl_get`\n- Create resources with `kubectl_create`\n- Apply YAML manifests with `kubectl_apply`\n- Delete resources with `kubectl_delete`\n- Get logs with `kubectl_logs`\n- and more.": "- [x] 连接到 Kubernetes 集群\n- [x] 用于管理资源的统一 kubectl API\n- 用 `kubectl_get` 获取或列出资源\n- 用 `kubectl_describe` 描述资源\n- 用 `kubectl_get` 列出资源\n- 用 `kubectl_create` 创建资源\n- 用 `kubectl_apply` 应用 YAML 清单\n- 用 `kubectl_delete` 删除资源\n- 用 `kubectl_logs` 获取日志\n- 等等。",
    "Snyk MCP enables AI assistants to perform comprehensive security scanning on code, dependencies, infrastructure, and containers. Integrate Snyk's security capabilities directly into your AI-assisted development workflow to proactively identify and fix vulnerabilities during code generation and review.": "Snyk MCP 让 AI 助手能对代码、依赖、基础设施和容器执行全面的安全扫描。把 Snyk 的安全能力直接集成进你 AI 辅助的开发工作流，在代码生成和审查过程中主动识别并修复漏洞。",
    "Supported scanning types:\n-": "支持的扫描类型：\n-",
    "SAST (Static Application Security Testing)": "SAST（静态应用安全测试）",
    ": Analyze source code for security vulnerabilities\n-": "：分析源代码以发现安全漏洞\n-",
    "SCA (Software Composition Analysis)": "SCA（软件成分分析）",
    ": Detect vulnerabilities in open source dependencies\n-": "：检测开源依赖中的漏洞\n-",
    "IaC (Infrastructure as Code)": "IaC（基础设施即代码）",
    ": Find security misconfigurations in cloud infrastructure\n-": "：发现云基础设施中的安全配置错误\n-",
    "Container Security": "容器安全",
    ": Scan container images for vulnerabilities\n-": "：扫描容器镜像以发现漏洞\n-",
    ": Generate and test Software/AI Bills of Materials": "：生成并测试软件/AI 物料清单",
    "Combine local filesystem access with full terminal control to handle technical tasks through natural language. Desktop Commander empowers you to build, explore, and automate - from organizing repositories to creating complete applications:\n*": "把本地文件系统访问与完整的终端控制结合，用自然语言处理技术任务。Desktop Commander 让你构建、探索并自动化——从整理仓库到创建完整应用：\n*",
    "Build from scratch": "从零构建",
    "- Create features and applications with simple commands\n*": "- 用简单命令创建功能和应用\n*",
    "Manage development environments": "管理开发环境",
    "- Set up servers, configure systems, and handle processes\n*": "- 搭建服务器、配置系统并处理进程\n*",
    "Manage context and documentation": "管理上下文和文档",
    "- Keep track of project details and technical specifications\n*": "- 跟踪项目细节和技术规格\n*",
    "Explore existing codebases and projects": "探索现有代码库和项目",
    "- Navigate and understand complex repositories": "- 导航并理解复杂的仓库",
    "This extension bridges technical skill gaps by providing full command-line superpowers through an interface that understands your intent and handles complexity automatically.": "这个扩展通过一个理解你意图、自动处理复杂性的界面，提供完整的命令行超能力，弥合技术能力鸿沟。",
    "Query data, build reports and manage ad campaigns across 200+ platforms — no account needed.": "跨 200+ 平台查询数据、构建报表并管理广告投放——无需账户。",
    "Supports Google Ads, Facebook Ads (Meta), Google Analytics, TikTok, LinkedIn, Bing Ads, Instagram, YouTube, Twitter, Shopify, HubSpot, Salesforce, Pinterest, Snapchat, X Ads, Amazon Ads, Google Search Console and Google My Business. Covers advertising, analytics, CRM, ecommerce, social media and SEO.": "支持 Google Ads、Facebook Ads (Meta)、Google Analytics、TikTok、LinkedIn、Bing Ads、Instagram、YouTube、Twitter、Shopify、HubSpot、Salesforce、Pinterest、Snapchat、X Ads、Amazon Ads、Google Search Console 和 Google My Business。覆盖广告、分析、CRM、电商、社交媒体和 SEO。",
    "Manage your projects, debug deployments, and check analytics for any MCP server  and MCP App you host with Alpic.ai": "管理你的项目、调试部署，并查看你托管在 Alpic.ai 上的任意 MCP 服务器和 MCP 应用的分析。",
    "Manage and create on your WordPress site through a conversation with Claude. Ask Claude to find a post, check your stats, draft something new, update a page, or pull up a comment thread. Your sites stay secure — Claude only gets access to what you approve, nothing more.": "通过与 Claude 对话，管理和创建你的 WordPress 站点。让 Claude 查找一篇文章、查看你的统计、起草新内容、更新一个页面，或调出一个评论串。你的站点保持安全——Claude 只获得你批准的访问权限，仅此而已。",
    "Your site already knows your style — your theme, your colors, your fonts, every creative decision you've made. Claude can see all of it, so when it helps you create, the content actually fits.": "你的站点已经知道你的风格——你的主题、你的配色、你的字体，你做过的每一个创意决定。Claude 都能看到，所以当它帮你创作时，内容真正契合。",
    "60+ abilities. Every change is confirmed by you. Available on all paid WordPress.com plans and any Jetpack AI or Complete-connected site.": "60+ 项能力。每处变更都由你确认。所有付费 WordPress.com 套餐，以及任何连接了 Jetpack AI 或 Complete 的站点均可用。",
    "For developers: Under the hood, this connector is powered by the WordPress.com MCP server. It uses OAuth 2.1 to ensure agents only access the resources you've explicitly approved, making it easy for you to build and extend AI-driven workflows on top of WordPress.": "面向开发者：在底层，这个连接器由 WordPress.com MCP 服务器驱动。它使用 OAuth 2.1 确保 agent 只访问你明确批准的资源，让你轻松在 WordPress 之上构建和扩展 AI 驱动的工作流。",
    "is a comprehensive email platform that helps developers and teams test, debug, and deliver emails safely. It provides both email testing (sandbox) and email delivery services.\nThis MCP (Model Context Protocol) server provides AI assistants with the ability to:\n-": "是一个全面的邮件平台，帮助开发者和团队安全地测试、调试和投递邮件。它同时提供邮件测试（沙箱）和邮件投递服务。\n这个 MCP (Model Context Protocol) 服务器让 AI 助手能够：\n-",
    "Send emails": "发送邮件",
    "via Mailtrap's delivery API\n-": "通过 Mailtrap 的投递 API\n-",
    "Test emails": "测试邮件",
    "using Mailtrap's sandbox environment\n-": "使用 Mailtrap 的沙箱环境\n-",
    "Manage email templates": "管理邮件模板",
    "(create, update, delete, list).": "（创建、更新、删除、列出）。",
    "AgentMail gives AI agents their own email inboxes. Through this connector, an agent (or you, in Claude) can spin up a dedicated inbox on the fly, then send, receive, reply to, and forward email, with full thread context, drafts, and attachments, entirely through tool calls.": "AgentMail 给 AI agent 它们自己的邮箱收件箱。通过这个连接器，一个 agent（或你，在 Claude 里）可以即时开一个专属收件箱，然后收发、回复和转发邮件，带完整的会话上下文、草稿和附件，全部通过工具调用完成。",
    "Unlike traditional email APIs built for one-way notifications, AgentMail is built for two-way conversations: an agent can read an incoming thread, understand it, and respond in context, just like a person would. This makes email a first-class communication and identity channel for agents, letting them sign up for services, coordinate with people, and talk to other agents.": "与为单向通知构建的传统邮件 API 不同，AgentMail 为双向对话而生：agent 可以阅读一个到来的会话、理解它，并结合上下文回复，就像人一样。这让邮件成为 agent 的一等通信和身份渠道，让它们能注册服务、与人协调、与其他 agent 对话。",
    "Key capabilities exposed over MCP:\n• Inboxes: create, list, get, update, and delete agent inboxes\n• Messages: send, reply, forward, list, and update\n• Threads: list, read, label, and delete full conversation threads\n• Search: full-text search across threads and messages\n• Drafts: create, list, read, update, send (with scheduling), and delete\n• Attachments: retrieve attachments by ID, with text extraction for PDF/DOCX": "通过 MCP 开放的主要能力：\n• 收件箱：创建、列出、获取、更新和删除 agent 收件箱\n• 消息：发送、回复、转发、列出和更新\n• 会话：列出、阅读、贴标签并删除完整的对话会话\n• 搜索：跨会话和消息的全文搜索\n• 草稿：创建、列出、阅读、更新、发送（可定时）和删除\n• 附件：按 ID 检索附件，含 PDF/DOCX 的文本提取",
    "Connect in seconds via OAuth using your AgentMail console identity. No API key required in Claude. Sign up free at console.agentmail.to.": "用你的 AgentMail 控制台身份通过 OAuth 几秒连接。在 Claude 里无需 API 密钥。在 console.agentmail.to 免费注册。",
    "Consensus is the go-to MCP for academic research. Connect directly to 220M+ peer-reviewed papers to search, synthesize, and build structured research outputs from within your conversation.": "Consensus 是学术研究的首选 MCP。直接连接 2.2 亿+ 篇同行评审论文，在你的对话内搜索、综合并构建结构化研究产出。",
    "Run literature reviews, build boolean search strategies, generate bibliographies, identify research gaps, and draft cited content — grounded in studies from PubMed, Semantic Scholar, and ArXiv. Pre-built workflows handle complex tasks in minutes: systematic reviews, curriculum reading lists, grant research with novelty analysis, and clinical evidence synthesis.": "运行文献综述、构建布尔搜索策略、生成参考文献、识别研究空白，并起草带引用的内容——扎根于 PubMed、Semantic Scholar 和 ArXiv 的研究。预置工作流几分钟内处理复杂任务：系统性综述、课程阅读书单、带新颖性分析的资助研究，以及临床证据综合。",
    "Built for researchers, students, faculty, and clinicians across biomedical, social science, STEM, and all academic disciplines.": "为生物医学、社会科学、STEM 及所有学术领域的研究者、学生、教职和临床医生打造。",
    "Medidata's MCP Connector for Claude provides two tools for Medidata users: Platform Help and Predictive Site Ranking.": "Medidata 面向 Claude 的 MCP 连接器为 Medidata 用户提供两个工具：Platform Help 和 Predictive Site Ranking。",
    "Platform Help allows users to query Medidata's platform documentation for answers about products like Rave EDC, Data Connect, and Clinical Data Studio.": "Platform Help 让用户查询 Medidata 的平台文档，获得关于 Rave EDC、Data Connect 和 Clinical Data Studio 等产品的答案。",
    "Predictive Site Ranking enables Intelligent Trials customers to predict which clinical trial sites align with enrollment goals during protocol planning, ranking sites based on indication, past performance, and various study criteria.": "Predictive Site Ranking 让 Intelligent Trials 客户能在方案规划期间预测哪些临床试验中心与入组目标契合，基于适应症、过往表现和各种研究标准为试验中心排名。",
    "Veltra Activities brings VELTRA's catalog of genuine local experiences into\nyour AI chat. Search and book tours, food experiences, and cultural\nactivities across Japan, Hawaii, Southeast Asia, and other destinations —\nTokyo food tours, Kyoto tea ceremonies, Mt. Fuji day trips, Honolulu luau\ndinners, and more. Curated results include prices, ratings, durations, and\ndirect booking links on Veltra.com. The connector turns travel-planning\nconversations into bookable plans without leaving the chat. Read-only and\nunauthenticated; no account required to use.": "Veltra Activities 把 VELTRA 真实本地体验的目录带入你的 AI 对话。跨日本、夏威夷、东南亚和其他目的地搜索并预订旅游、美食体验和文化活动——东京美食游、京都茶道、富士山一日游、火奴鲁鲁 luau 晚宴等。精选结果含价格、评分、时长，以及 Veltra.com 上的直接预订链接。这个连接器把旅行规划对话变成可预订的方案，全程不离开对话。只读、免认证；使用无需账户。",
    "MacOS-MCP is a lightweight, open-source MCP server that bridges AI agents with the macOS operating system. It enables LLM agents to perform real-world tasks such as app launching, window management, UI interaction, browser automation, desktop state capture, and shell execution using native macOS accessibility and automation APIs.": "MacOS-MCP 是一个轻量、开源的 MCP 服务器，在 AI agent 与 macOS 操作系统之间架起桥梁。它让 LLM agent 能用原生 macOS 辅助功能和自动化 API 执行真实世界的任务，如启动应用、窗口管理、UI 交互、浏览器自动化、桌面状态捕获和 shell 执行。",
    "KEY FEATURES": "主要特性",
    "Native macOS Integration": "原生 macOS 集成",
    ": Interact with applications, windows, and UI elements through the macOS Accessibility API and Quartz event system.\n-": "：通过 macOS Accessibility API 和 Quartz 事件系统与应用、窗口和 UI 元素交互。\n-",
    "Bring Your Own LLM/VLM": "自带你的 LLM/VLM",
    ": Works with any language model and optionally provides visual snapshots when needed.\n-": "：适用于任何语言模型，需要时可选提供视觉快照。\n-",
    "Rich Toolset for Desktop Automation": "面向桌面自动化的丰富工具集",
    ": Pre-built tools for application control, mouse and keyboard input, scrolling, shell commands, and desktop state capture.\n-": "：用于应用控制、鼠标和键盘输入、滚动、shell 命令和桌面状态捕获的预置工具。\n-",
    "Lightweight and Open Source": "轻量且开源",
    ": Minimal setup with a focused Python package and MIT license.": "：极简配置，一个聚焦的 Python 包，MIT 许可。",
    "MINIMUM REQUIREMENTS": "最低要求",
    "- Python 3.11 or higher\n- macOS 12 or higher\n- Accessibility permissions granted to the terminal or application running the MCP server\n- UV Package Manager\nThis MCP server uses UV for running the package in a managed Python environment.\nInstallation:\n`curl -LsSf https://astral.sh/uv/install.sh | sh`\nFor detailed installation instructions,": "- Python 3.11 或更高\n- macOS 12 或更高\n- 授予运行 MCP 服务器的终端或应用辅助功能权限\n- UV 包管理器\n这个 MCP 服务器用 UV 在受管理的 Python 环境中运行该包。\n安装：\n`curl -LsSf https://astral.sh/uv/install.sh | sh`\n详细安装说明，",
    "see the UV documentation": "见 UV 文档",
    "Databricks offers two flavors of MCP servers: Managed servers and custom servers.\nManaged MCP servers: Databricks has ready-to-use servers that let agents query data and access tools in Unity Catalog. Unity Catalog permissions are always enforced, so agents and users can only access the tools and data they're allowed to.\nCustom MCP servers: Securely host your own MCP server as a Databricks app to bring your own server or run a third-party MCP server": "Databricks 提供两种 MCP 服务器：托管服务器和自定义服务器。\n托管 MCP 服务器：Databricks 有即用型服务器，让 agent 查询数据并访问 Unity Catalog 中的工具。Unity Catalog 权限始终被执行，所以 agent 和用户只能访问它们被允许的工具和数据。\n自定义 MCP 服务器：把你自己的 MCP 服务器作为 Databricks 应用安全托管，以自带服务器或运行第三方 MCP 服务器",
    "Discover and explore scientific datasets from collaborative research projects. Search Synapse for genomics, imaging, clinical data on cancer, neurodegenerative diseases, rare diseases, and more. Navigate project hierarchies and get detailed metadata and provenance to understand what datasets contain before you download.": "发现并探索来自协作研究项目的科学数据集。在 Synapse 中搜索关于癌症、神经退行性疾病、罕见病等的基因组学、影像、临床数据。浏览项目层级，获取详细的元数据和溯源，在下载前理解数据集包含什么。",
    "When using an MCP server with Claude, please review Anthropic's data handling policies to understand how your data is processed:\n•": "在 Claude 中使用 MCP 服务器时，请查看 Anthropic 的数据处理政策，了解你的数据如何被处理：\n•",
    "Consumer accounts": "消费者账户",
    "Commercial accounts": "商业账户",
    "You remain responsible for compliance with any data use restrictions and Synapse": "你仍需对遵守任何数据使用限制以及 Synapse",
    "Terms of Service": "服务条款",
    "An MCP server for the Local Falcon AI Visibility and local SEO platform. Connect Claude to your Local Falcon account to track how businesses appear across AI search results and traditional map platforms.": "面向 Local Falcon AI 可见度和本地 SEO 平台的 MCP 服务器。把 Claude 连接到你的 Local Falcon 账户，跟踪企业如何出现在 AI 搜索结果和传统地图平台中。",
    "Capabilities include running geo-grid scans that check visibility from dozens of surrounding coordinates simultaneously, retrieving scan reports with AI-powered analysis, tracking visibility trends over time, managing scheduled campaigns across multiple locations and keywords, monitoring Google Business Profiles for unwanted changes with Falcon Guard, analyzing reviews with sentiment and topic breakdowns, and researching competitors to identify strategic opportunities.": "能力包括：运行地理网格扫描，同时从数十个周边坐标检查可见度；检索带 AI 分析的扫描报告；跟踪随时间变化的可见度趋势；跨多个地点和关键词管理定时活动；用 Falcon Guard 监控 Google 商家资料的异常变更；用情绪和话题分解分析评价；以及调研竞争对手以识别战略机会。",
    "Supported platforms: Google Maps, Apple Maps, Google AI Overviews, Google AI Mode, ChatGPT, Gemini, and Grok.": "支持的平台：Google Maps、Apple Maps、Google AI Overviews、Google AI Mode、ChatGPT、Gemini 和 Grok。",
    "Scholar Gateway enables Claude to generate responses grounded in peer-reviewed sources with verifiable citations and DOI links. The Scholar Gateway Connector searches current literature from Wiley journals and research databases to deliver evidence-backed answers with complete source metadata. This enables you to verify that claims are backed with sourced research — ensuring your Claude-assisted research meets professional research standards.": "Scholar Gateway 让 Claude 能生成扎根于同行评审来源、带可核验引用和 DOI 链接的回答。Scholar Gateway 连接器搜索来自 Wiley 期刊和研究数据库的最新文献，交付带完整来源元数据、有证据支撑的答案。这让你能核验主张有溯源研究支撑——确保你 Claude 辅助的研究符合专业研究标准。",
    "Note: The Scholar Gateway Connector provides access to Wiley content only, additional publisher sources will be added soon. Authentication required, please reach out to Wiley at scholargateway@wiley.com.": "注意：Scholar Gateway 连接器目前仅提供对 Wiley 内容的访问，更多出版方来源将很快加入。需要认证，请通过 scholargateway@wiley.com 联系 Wiley。",
    "Connect to ServiceNow directly in Claude via ServiceNow Action Fabric. Run governed cross-departmental workflows and actions across IT, HR, Customer Service, Security, Risk, and more, all while respecting your existing ServiceNow permissions and security controls.\nUse out-of-the-box, domain specific MCP Servers built by ServiceNow App teams. Build your own custom ServiceNow MCP Servers using platform capabilities your teams use today.": "通过 ServiceNow Action Fabric 直接在 Claude 中连接 ServiceNow。跨 IT、HR、客户服务、安全、风险等运行受治理的跨部门工作流和操作，全程尊重你现有的 ServiceNow 权限和安全控制。\n使用 ServiceNow 应用团队构建的开箱即用、领域专用的 MCP 服务器。用你的团队今天在用的平台能力构建你自己的自定义 ServiceNow MCP 服务器。",
    "Create forms and manage your data without leaving Claude. Describe the form you need and build it instantly, then query submissions, pull files and documents, and make entry changes as responses come in. Whether you're setting up a new intake form, checking on pending applications, or retrieving a signed document, your form data is right there when you need it.": "创建表单并管理你的数据，全程不离开 Claude。描述你需要的表单并即刻构建它，然后随着回复到来查询提交、拉取文件和文档并修改条目。无论你在搭建一个新的受理表单、查看待处理申请，还是检索一份已签文档，你的表单数据在你需要时就在那里。",
    "Available on Pro, Team, and Enterprise plans. Setting up the connector requires Administrator access in your Cognito Forms organization.": "在 Pro、Team 和 Enterprise 套餐可用。配置连接器需要你 Cognito Forms 组织的管理员权限。",
    "Get accurate, real-time Uber fare estimates between any two locations in the United States. This tool instantly shows you available ride options—such as UberX, UberXL, Comfort, and Black—along with pricing, estimated arrival times, and product details.": "获取美国境内任意两点之间准确、实时的 Uber 车费预估。这个工具即时展示可用的出行选项——如 UberX、UberXL、Comfort 和 Black——连同价格、预计到达时间和产品详情。",
    "What You Can Do\n- Check up-to-the-minute fare estimates for on-demand (immediate) trips\n- Compare ride options across Uber products\n- View ETA, pricing ranges, and key product features\n- Jump directly into booking your trip in the Uber app — all ride requests are handed off to the official Uber app to be completed securely\n- Request estimates for specific product types (e.g., \"Book an Uber Black\")\n- Ensure accurate pricing by providing a precise pickup and dropoff location": "你能做什么\n- 查看按需（即时）行程的实时车费预估\n- 跨 Uber 产品比较出行选项\n- 查看 ETA、价格区间和关键产品特性\n- 直接跳进 Uber 应用预订你的行程——所有叫车请求都交给官方 Uber 应用安全完成\n- 为特定产品类型请求预估（如「叫一辆 Uber Black」）\n- 通过提供精确的上车和下车地点确保准确定价",
    "Saga gives your AI assistant a structured SQLite database to track projects, epics, tasks, subtasks, notes, and decisions across sessions. No more scattered markdown files — one `tracker_dashboard` call gives full project context to resume work.": "Saga 给你的 AI 助手一个结构化的 SQLite 数据库，用来跨会话跟踪项目、epic、任务、子任务、笔记和决策。不再有散落的 markdown 文件——一次 `tracker_dashboard` 调用就给出完整的项目上下文以恢复工作。",
    "- Full hierarchy: Projects > Epics > Tasks > Subtasks\n- Task dependencies: Express sequencing with auto-block/unblock\n- Comments: Threaded discussions on tasks for decision trails\n- Templates: Reusable task sets with variable substitution\n- Dashboard: One tool call gives full overview with natural language summary\n- SQLite: Self-contained `.tracker.db` file per project — zero setup\n- Activity log: Every mutation is automatically tracked\n- Notes system: Decisions, context, meeting notes, blockers\n- Batch operations: Create multiple subtasks or update multiple tasks in one call\n- 31 focused tools with safety annotations\n- Import/export: Full project backup and migration as JSON": "- 完整层级：项目 > Epic > 任务 > 子任务\n- 任务依赖：用自动阻塞/解阻塞表达先后顺序\n- 评论：任务上的串联讨论，留下决策轨迹\n- 模板：带变量替换的可复用任务集\n- 仪表盘：一次工具调用给出带自然语言摘要的完整概览\n- SQLite：每个项目一个自包含的 `.tracker.db` 文件——零配置\n- 活动日志：每次变更自动跟踪\n- 笔记系统：决策、上下文、会议笔记、阻碍\n- 批量操作：一次调用创建多个子任务或更新多个任务\n- 31 个带安全注解的聚焦工具\n- 导入/导出：以 JSON 做完整项目备份和迁移",
    "Search for content, get answers, see analytics, and take action with personalized guidance from Highspot.": "用 Highspot 的个性化指导搜索内容、获得答案、查看分析并采取行动。",
    "Embed Highspot tools, insights and agents directly in your sellers' AI workflows to accelerate sales velocity and increase productivity to win more deals.": "把 Highspot 的工具、洞察和 agent 直接嵌入你销售人员的 AI 工作流，加速销售节奏、提升效率，赢下更多交易。",
    "Inspect, summarize, and troubleshoot Adobe Journey Optimizer journeys, campaigns, offers, and channel configurations directly from Claude. Turn AJO's retrieve APIs into plain-language answers so you can check journey and campaign statuses, surface stopped or orphaned drafts, spot channel configuration issues and review your orchestration portfolio without parsing JSON or jumping across product screens.": "直接从 Claude 检查、总结并排查 Adobe Journey Optimizer 的 journey、campaign、offer 和渠道配置。把 AJO 的检索 API 变成大白话答案，让你无需解析 JSON 或在产品界面间跳转，就能查看 journey 和 campaign 状态、呈现已停止或孤立的草稿、发现渠道配置问题并审阅你的编排组合。",
    "The AJO MCP server is in beta.": "AJO MCP 服务器处于 beta 阶段。",
    "Research any company directly from Claude. See what technologies an organization uses, who works there, and what roles they're hiring for. Explore team structures, reporting lines, and active initiatives inside your target accounts.": "直接从 Claude 调研任意公司。查看一个组织使用哪些技术、谁在那里工作、他们在招什么岗位。探索你目标客户内部的团队结构、汇报线和进行中的举措。",
    "Find decision-makers by job function and seniority. Enrich contacts with email addresses. Track hiring signals from job postings. Build and manage account and contact lists without leaving your conversation.": "按职能和资历查找决策人。用邮箱地址丰富联系人。从招聘帖跟踪招聘信号。构建并管理客户和联系人列表，全程不离开对话。",
    "Sumble turning hours of manual account research into a single query.": "Sumble 把数小时的手动客户调研变成一次查询。",
    "The CMS Coverage Connector gives Claude access to Medicare Part B coverage policies from the CMS Coverage Database, including National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs).": "CMS Coverage 连接器让 Claude 能访问来自 CMS Coverage 数据库的 Medicare Part B 保障政策，包括国家级保障裁定（NCD）和地方级保障裁定（LCD）。",
    "This server may return data governed by third-party license agreements, including those available here: https://api.coverage.cms.gov/v1/metadata/license-agreement/. By connecting to this server, you understand and agree to abide by any applicable agreements.": "这个服务器可能返回受第三方许可协议约束的数据，包括此处提供的：https://api.coverage.cms.gov/v1/metadata/license-agreement/。连接到这个服务器，即表示你理解并同意遵守任何适用的协议。",
    "The SketchUp connector for Claude turns a conversation into a 3D model. Describe what you want to build — a room addition, a piece of furniture, a site concept — and Claude will generate models for you to open, refine, and share. No modeling experience required to get started.": "面向 Claude 的 SketchUp 连接器把一次对话变成一个 3D 模型。描述你想构建什么——一个房间扩建、一件家具、一个场地概念——Claude 就会为你生成模型，供你打开、完善和分享。上手无需建模经验。",
    "Upon setting up the connector, ask Claude to create a SketchUp model from text prompts, images, or other inputs. Preview models in Claude or open them in SketchUp to evaluate, iterate, or manually modify. Iterate with Claude and SketchUp to refine model versions as desired.": "配置好连接器后，让 Claude 从文字提示、图片或其他输入创建 SketchUp 模型。在 Claude 里预览模型，或在 SketchUp 中打开以评估、迭代或手动修改。与 Claude 和 SketchUp 一起迭代，按需完善模型版本。",
    "The MSCI Connector provides access to an expanding range of MSCI AI-enabled data and analytics capabilities. Based on entitlements, users can investigate index performance characteristics such as country, sector and factor exposures, constituent weights, and methodologies. They can also explore private assets market trends, performance benchmarking and holdings, risk factors, and access portfolio holdings, performance, transparency, liquidity and cash flow data across public and private markets.\nThe connector is designed for investment professionals who require transparent, methodology-aligned data to support portfolio construction, attribution, exposure analysis, private assets research and a unified view across public and private markets.": "MSCI 连接器提供对不断扩展的 MSCI AI 赋能数据和分析能力的访问。基于授权，用户可以研究指数表现特征，如国家、行业和因子敞口、成分权重和方法论。他们还可以探索私募资产市场趋势、业绩基准和持仓、风险因子，并跨公开和私募市场访问投资组合持仓、业绩、透明度、流动性和现金流数据。\n这个连接器为需要透明、与方法论对齐的数据来支持投资组合构建、归因、敞口分析、私募资产研究以及跨公开和私募市场统一视图的投资专业人士设计。",
    "Use this connector to get audiobook recommendations and previews from Audible. Ask by genre, mood, topic or anything else that comes to mind.": "用这个连接器从 Audible 获取有声书推荐和试听。按类型、心情、话题或任何你想到的来问。",
    "Note: If you're outside the United States, results may redirect you to your local marketplace. Audiobook availability varies by region.": "注意：如果你在美国境外，结果可能把你重定向到你本地的商店。有声书的可用性因地区而异。",
    "Get fast federal tax estimates and discover filing options with Intuit TurboTax-powered tools. Start with a simple tax estimator that guides you through the info you need and see your refund or amount owed as you go. When you're ready for expert help, connect with trusted tax pros. Confident tax filing starts here.": "用 Intuit TurboTax 驱动的工具快速估算联邦税并发现报税选项。从一个简单的税务估算器开始，它引导你填写所需信息，边填边看你的退税或应缴金额。准备好要专家帮助时，连线可信的税务专业人士。笃定报税从这里开始。",
    "By connecting, you agree to the Intuit TurboTax": "连接即表示你同意 Intuit TurboTax 的",
    "and acknowledge Intuit's": "并知悉 Intuit 的",
    "Global Privacy Statement": "全球隐私声明",
    "The Wolfram MCP Server transforms your AI environment into a rigorous computational powerhouse. By integrating Wolfram Language and Wolfram|Alpha, this server provides access to curated data and sophisticated algorithms. When a user submits a query, the LLM works with Wolfram to convert it into Wolfram Language for precise evaluation, and these exact results are incorporated into the response provided by the LLM.": "Wolfram MCP 服务器把你的 AI 环境变成一个严谨的计算强力引擎。通过集成 Wolfram Language 和 Wolfram|Alpha，这个服务器提供对精选数据和复杂算法的访问。当用户提交一个查询时，LLM 与 Wolfram 协作，把它转换成 Wolfram Language 以做精确求值，这些确切结果被纳入 LLM 提供的回答中。",
    "Whether you are solving complex differential equations, analyzing chemical structures or querying real-time socioeconomic data, the MCP Server ensures your AI has the \"computational brain\" necessary to deliver verified, high-level technical results that can be trusted.": "无论你在求解复杂的微分方程、分析化学结构还是查询实时社会经济数据，MCP 服务器都确保你的 AI 拥有交付可信、经验证的高水平技术结果所需的「计算大脑」。",
    "Benchling is the leading R&D platform built for AI-first science. This connector brings Benchling's best-in-class scientific AI directly into Claude, giving scientists, informaticians, and R&D leaders access to purpose-built research intelligence without leaving their workflow.": "Benchling 是为 AI 优先科学打造的领先研发平台。这个连接器把 Benchling 业界一流的科研 AI 直接带入 Claude，让科学家、信息学家和研发领导者无需离开工作流就能访问专门构建的研究智能。",
    "Ask complex questions about your research and get back structured, traceable answers drawn from your Benchling data, with the domain depth that general AI tools can't match.": "就你的研究提出复杂问题，得到从你 Benchling 数据中提取的、结构化、可追溯的答案，具备通用 AI 工具无法匹敌的领域深度。",
    "To use, AI Chat must be enabled in your Benchling account.": "要使用，你的 Benchling 账户必须启用 AI Chat。",
    "DirectBooker — Book hotels direct for better rates and better service": "DirectBooker——直接预订酒店，享更优价格和更好服务",
    "Plan your trip and book smarter. DirectBooker helps you discover, compare, and book hotels at your destination for all your travel planning needs. The right neighborhood, the right vibe, the amenities you need, and see real-time rates and availability for every property. Unlock member prices and special packages available only when you book direct. And when you book, you book straight with the hotel on their official website, so you get the direct rate and keep everything you've earned: points, elite status and benefits, and exclusive member offers.": "规划你的行程、更聪明地预订。DirectBooker 帮你在目的地发现、比较并预订酒店，满足你所有的旅行规划需求。合适的街区、合适的氛围、你需要的设施，并查看每家酒店的实时价格和空房。解锁只在你直接预订时才有的会员价和特别套餐。而当你预订时，你直接在酒店官网上预订，所以你拿到直订价，并保留你赢得的一切：积分、精英身份和权益，以及专属会员优惠。",
    "From a last-minute airport room tonight to a resort or villa booked weeks ahead, DirectBooker helps you plan your trip and book smarter.": "从今晚临时的机场客房，到提前数周预订的度假村或别墅，DirectBooker 帮你规划行程、更聪明地预订。",
    "Direct is best. Better rates, better service, better travel.": "直订最好。更优价格、更好服务、更好旅行。",
    "Travel planning • hotel search • hotel booking • compare hotel rates • direct hotel deals • trip planning • accommodation • loyalty points & rewards": "旅行规划 • 酒店搜索 • 酒店预订 • 比较酒店价格 • 酒店直订优惠 • 行程规划 • 住宿 • 忠诚积分与奖励",
    "The Close MCP server is a secure, standardized interface that lets Claude directly access and interact with your Close data. Core functionality with Claude:": "Close MCP 服务器是一个安全、标准化的接口，让 Claude 直接访问你的 Close 数据并与之交互。与 Claude 的核心功能：",
    "• Connects Close to Claude via the Model Context Protocol so Claude can use Close as a trusted system of record.": "• 通过 Model Context Protocol 把 Close 连接到 Claude，让 Claude 能把 Close 当作可信的记录系统。",
    "• Read data (e.g., leads, contacts, opportunities, activities) based on your Close permissions.": "• 基于你的 Close 权限读取数据（如线索、联系人、商机、活动）。",
    "• Optionally write data — you can allow only safe writes (e.g., create a lead) or full writes (e.g., edit/delete) during setup.": "• 可选写入数据——你可以在配置时只允许安全写入（如创建线索）或完整写入（如编辑/删除）。",
    "• Enables Claude to answer questions, summarize information, and perform actions in Close.": "• 让 Claude 能在 Close 中回答问题、总结信息并执行操作。",
    "Connect Clarify and work with your CRM using natural language. Retrieve, create, and update records, analyze your pipeline, and generate insights—all through conversation.": "连接 Clarify，用自然语言处理你的 CRM。检索、创建和更新记录、分析你的管道并生成洞察——全部通过对话。",
    "Query deals, companies, people, and meetings without switching apps. Find and import new leads that match your ICP directly from the conversation. Create tasks, lists, and outbound sequences automatically.": "查询交易、公司、人员和会议，无需切换应用。直接从对话查找并导入符合你 ICP 的新线索。自动创建任务、列表和外呼序列。",
    "Build and configure Clarify Agents from Claude to automate your entire GTM motion.": "从 Claude 构建和配置 Clarify Agent，自动化你整个 GTM 打法。",
    "Your Clarify data is retrieved in real-time, and permissions are respected.": "你的 Clarify 数据实时检索，并尊重权限。",
    "Stop clicking through interfaces. Just ask what you need.": "别再在界面里点来点去。只需说出你要什么。",
    "Glovo in Claude helps you find anything you need in your city and get it delivered wherever you are in just minutes. Just ask in your own words for what you need: skincare, gifts, clothes, electronics, pet supplies, supermarkets, or even flowers.": "Claude 里的 Glovo 帮你在你的城市找到任何你需要的东西，并在短短几分钟内送到你所在的任何地方。只需用你自己的话说出你需要什么：护肤品、礼物、衣服、电子产品、宠物用品、超市，甚至鲜花。",
    "You can also refine results by budget, brand, features, ratings, and your preferred stores, and view live availability, prices, and store details.": "你还可以按预算、品牌、功能、评分和你偏好的商店细化结果，并查看实时的可用性、价格和商店详情。",
    "When you're ready to order, Claude takes you directly to the Glovo app or website to complete your purchase. As easy as that.": "准备好下单时，Claude 直接带你到 Glovo 应用或网站完成购买。就这么简单。",
    "Connect your Paytm merchant account to Claude for intelligent access to your payment operations. Look up transactions, search payment links, track refunds, review settlement status, and reconcile payments - all through conversation. No dashboard switching, no API calls.\nClaude becomes your payments co-pilot - it works directly with your Paytm merchant account. Built for merchants, developers, and operations teams.": "把你的 Paytm 商户账户连接到 Claude，智能访问你的支付运营。查询交易、搜索支付链接、跟踪退款、查看结算状态并对账——全部通过对话。无需切换仪表盘，无需 API 调用。\nClaude 成为你的支付副驾——它直接处理你的 Paytm 商户账户。为商户、开发者和运营团队打造。",
    "This extension allows Claude to interact with Google Chrome browser, enabling tab management, navigation, page content reading, and browser automation. It uses Chrome's AppleScript API to control the browser programmatically.": "这个扩展让 Claude 与 Google Chrome 浏览器交互，实现标签管理、导航、页面内容读取和浏览器自动化。它使用 Chrome 的 AppleScript API 以编程方式控制浏览器。",
    "This extension is not affiliated with or endorsed by Google.": "这个扩展与 Google 无关联，也未获其背书。",
    "Explore a variety of Melon charts, get personalized music recommendations just for you, and discover your listening habits. All in one place. You can even play songs directly in the Melon app.\n• Browse detailed information about artists, albums, and tracks.\n• Search for songs and playlists using Melon charts and trending keywords.\n• Enjoy personalized recommendations based on the songs you love and listen to most. The service is currently available in Korean only.\nAn English version is scheduled to be made available within this year, with an anticipated release in October.": "探索各种 Melon 榜单、获得为你个性化的音乐推荐，并发现你的收听习惯。全部在一处。你甚至可以直接在 Melon 应用里播放歌曲。\n• 浏览关于艺人、专辑和曲目的详细信息。\n• 用 Melon 榜单和热门关键词搜索歌曲和歌单。\n• 享受基于你喜爱和最常听的歌曲的个性化推荐。该服务目前仅提供韩语版。\n英文版计划在今年内推出，预计 10 月发布。",
    "This extension allows Claude to interact with Microsoft PowerPoint on macOS, enabling presentation creation, slide management, and content editing.": "这个扩展让 Claude 与 macOS 上的 Microsoft PowerPoint 交互，实现演示文稿创建、幻灯片管理和内容编辑。",
    "It uses macOS AppleScript automation to control PowerPoint and requires your explicit permission through macOS security prompts before accessing Microsoft PowerPoint. It is not affiliated with or endorsed by Microsoft Corporation.": "它使用 macOS AppleScript 自动化控制 PowerPoint，并在访问 Microsoft PowerPoint 前需要你通过 macOS 安全提示明确授权。它与 Microsoft Corporation 无关联，也未获其背书。",
    "This extension allows Claude to interact with Microsoft Word on macOS, enabling document creation, editing, formatting, and management.": "这个扩展让 Claude 与 macOS 上的 Microsoft Word 交互，实现文档创建、编辑、格式化和管理。",
    "It uses macOS AppleScript automation to control Word and requires your explicit permission through macOS security prompts before accessing Microsoft Word. It is not affiliated with or endorsed by Microsoft Corporation.": "它使用 macOS AppleScript 自动化控制 Word，并在访问 Microsoft Word 前需要你通过 macOS 安全提示明确授权。它与 Microsoft Corporation 无关联，也未获其背书。",
    "Windows-MCP is an open-source project that enables seamless integration between AI agents and the Windows operating system. Acting as an MCP server, it bridges the gap between large language models (LLMs) and the Windows OS, allowing agents to perform tasks such as": "Windows-MCP 是一个开源项目，实现 AI agent 与 Windows 操作系统的无缝集成。作为一个 MCP 服务器，它弥合大语言模型（LLM）与 Windows OS 之间的鸿沟，让 agent 能执行诸如",
    "file navigation, application control, UI interaction, QA testing, and more": "文件导航、应用控制、UI 交互、QA 测试等任务",
    "Seamless Windows Integration": "无缝 Windows 集成",
    ": Interacts natively with Windows UI elements, opens applications, controls windows, simulates user input, and more.\n-": "：原生地与 Windows UI 元素交互、打开应用、控制窗口、模拟用户输入等。\n-",
    "Use Any LLM (Vision Optional)": "使用任意 LLM（视觉可选）",
    ": Does not rely on traditional computer vision techniques or fine-tuned models. Works with any LLM, reducing complexity and setup time.\n-": "：不依赖传统计算机视觉技术或微调模型。适用于任何 LLM，降低复杂度和配置时间。\n-",
    "Rich Toolset for UI Automation": "面向 UI 自动化的丰富工具集",
    ": Includes tools for keyboard and mouse control, window management, and capturing window or UI state.\n-": "：包含键盘鼠标控制、窗口管理，以及捕获窗口或 UI 状态的工具。\n-",
    "Lightweight & Open-Source": "轻量且开源",
    ": Minimal dependencies with full source code available under the MIT license.\n-": "：依赖极少，完整源码以 MIT 许可提供。\n-",
    "Customizable & Extendable": "可定制、可扩展",
    ": Easily adapt or extend tools to suit custom automation workflows or AI integrations.\n-": "：轻松适配或扩展工具以适应自定义自动化工作流或 AI 集成。\n-",
    "Real-Time Interaction": "实时交互",
    ": Typical latency between actions ranges from `0.2` to `0.9` seconds, depending on system load, active applications, and LLM inference speed.": "：动作之间的典型延迟在 `0.2` 到 `0.9` 秒之间，取决于系统负载、活跃应用和 LLM 推理速度。",
    "UV Package Manager": "UV 包管理器",
    "PDF Tools turns Claude Desktop into a complete local PDF workstation. Instead of just opening a PDF, Claude can fetch PDFs from URLs, inspect them visually, fill forms, manage pages, add signature/date zones, apply local signatures or text, extract structured data, and analyze document content without uploading files to a web app.": "PDF Tools 把 Claude Desktop 变成一个完整的本地 PDF 工作站。Claude 不只是打开 PDF，还能从 URL 获取 PDF、可视化查看、填写表单、管理页面、添加签名/日期区、应用本地签名或文本、提取结构化数据，并分析文档内容，无需把文件上传到网页应用。",
    "This package targets Claude Desktop and other local MCP hosts today. It does not yet include a remote Claude/Cowork connector.": "这个包目前面向 Claude Desktop 和其他本地 MCP 宿主。它尚不包含远程 Claude/Cowork 连接器。",
    "Interactive PDF Viewer:": "交互式 PDF 查看器：",
    "• View PDFs with page navigation, zoom, search, text selection, and fullscreen\n• See form fields in a sidebar with fill status\n• Use visual page management to reorder, rotate, and remove pages before saving\n• Switch into Sign mode to work with signature/date zones on the PDF": "• 查看 PDF，支持页面导航、缩放、搜索、文本选择和全屏\n• 在侧栏查看带填写状态的表单字段\n• 用可视化页面管理在保存前重排、旋转和删除页面\n• 切换到签名模式处理 PDF 上的签名/日期区",
    "Sign Mode & Local Signatures:": "签名模式与本地签名：",
    "• Detect signature, initials, and date zones with visible coordinates Claude can reason from\n• Draw or reuse saved local signatures\n• Place signatures, dates, or other text on detected or custom zones\n• Inspect a region, preview it, and turn it into a typed signing zone when the automatic detector is not enough\n• Keep edits local, with active-document tracking and automatic backup behavior for same-file mutations": "• 检测签名、缩写和日期区，带 Claude 可据以推理的可见坐标\n• 绘制或复用已保存的本地签名\n• 在检测到的或自定义的区域放置签名、日期或其他文本\n• 当自动检测器不够用时，检查一个区域、预览它，并把它变成一个手动定义的签名区\n• 保持编辑本地化，对同一文件的修改带活动文档跟踪和自动备份行为",
    "URL-to-PDF Workflows:": "URL 转 PDF 工作流：",
    "• Fetch PDFs from HTTP(S) URLs to the user's local machine, including cases where Claude's WebFetch is blocked\n• Open downloaded PDFs immediately in the viewer for fill, sign, page management, extraction, or analysis\n• Use page-bounded reads, text search, page renders, and region renders instead of one brittle all-document operation": "• 从 HTTP(S) URL 把 PDF 获取到用户本地机器，包括 Claude 的 WebFetch 被阻止的情况\n• 立即在查看器中打开下载的 PDF 以填写、签名、页面管理、提取或分析\n• 使用按页边界的读取、文本搜索、整页渲染和区域渲染，而不是一个脆弱的全文档操作",
    "Forms & Reusable Profiles:": "表单与可复用配置：",
    "• Fill W-9s, 1099s, rental applications, waivers, and any fillable PDF\n• Save personal or business details as reusable profiles\n• List, load, and apply saved profiles so repeated forms take seconds instead of minutes\n• Bulk fill many PDFs from CSV data and validate required fields before submission": "• 填写 W-9、1099、租房申请、免责声明和任何可填写的 PDF\n• 把个人或企业信息保存为可复用的配置\n• 列出、加载并应用已保存的配置，让重复表单几秒搞定而非几分钟\n• 从 CSV 数据批量填写多个 PDF，并在提交前校验必填字段",
    "Page Organization Tools:": "页面整理工具：",
    "• Merge multiple PDFs into one document\n• Split PDFs by exact page ranges or regular intervals\n• Rotate and reorder pages, or apply a full page plan in one pass\n• Keep the original intact by saving organized output as a new file": "• 把多个 PDF 合并成一个文档\n• 按确切页范围或固定间隔拆分 PDF\n• 旋转和重排页面，或一次性应用完整的页面方案\n• 通过把整理后的输出保存为新文件来保持原件不变",
    "Extraction, Rendering & Analysis:": "提取、渲染与分析：",
    "• Read document text for summarization, question answering, and research workflows\n• Read specific page ranges and search PDF text with page-numbered snippets\n• Render full pages or bounded regions to PNG for visual reasoning on scanned or image-heavy documents\n• Extract structured data to CSV\n• Inspect page-level details like orientation, text presence, images, and likely blank pages\n• Review metadata such as page count, dimensions, form fields, and file size": "• 读取文档文本用于摘要、问答和研究工作流\n• 读取特定页范围，并用带页码的片段搜索 PDF 文本\n• 把整页或有界区域渲染成 PNG，用于对扫描件或图片密集文档做视觉推理\n• 把结构化数据提取到 CSV\n• 检查页级细节，如方向、文本存在、图片和可能的空白页\n• 查看元数据，如页数、尺寸、表单字段和文件大小",
    "Local-first and user-controlled:": "本地优先、用户掌控：",
    "PDFs, saved profiles, and signatures stay on the user's machine. Claude Desktop users choose which folders PDF Tools may read from or write to.": "PDF、已保存的配置和签名都留在用户机器上。Claude Desktop 用户选择 PDF Tools 可以读取或写入哪些文件夹。",
    "Works with many PDF types:": "适用于多种 PDF 类型：",
    "Forms, contracts, research papers, technical manuals, invoices, financial statements, scanned documents, municipal packets, and encrypted PDFs.": "表单、合同、研究论文、技术手册、发票、财务报表、扫描文档、市政文件包和加密 PDF。",
    "Best for:": "最适合：",
    "People who need more than a viewer — operators processing forms, lawyers organizing contracts, accountants handling tax documents, researchers reviewing papers, and anyone who wants local PDF workflows without sending files to a web app.": "需要的不只是查看器的人——处理表单的操作人员、整理合同的律师、处理税务文档的会计、审阅论文的研究者，以及任何想要本地 PDF 工作流、不把文件发到网页应用的人。",
    "- Boost output quality by reusing your actual components, the MCP server informs AI agents about existing components derived from Code Connect information.": "- 复用你实际的组件来提升产出质量，MCP 服务器会把 Code Connect 里已有的组件信息告知 AI agent。",
    "Setup and Usage:": "配置与使用：",
    "The Figma MCP server runs locally on your device and operates only when Dev Mode is active and enabled within a Figma file. You must have the latest version of the Figma desktop app running in order to use this.": "Figma MCP 服务器在你的设备本地运行，仅当 Dev Mode 在某个 Figma 文件中激活并启用时才工作。你必须运行最新版的 Figma 桌面应用才能使用它。",
    "Enable Figma MCP server in Figma App:": "在 Figma 应用中启用 Figma MCP 服务器：",
    "1. Open your Figma application.\n2. Open a Figma design file.\n3. Access the Dev Mode inspect panel, where you'll find the MCP Server configuration options.": "1. 打开你的 Figma 应用。\n2. 打开一个 Figma 设计文件。\n3. 进入 Dev Mode 检查面板，你会在那里找到 MCP Server 配置选项。",
    "Authentication:": "身份验证：",
    "The Figma MCP server handles authentication through the Figma desktop application. This authentication is managed automatically by Figma when you're logged into the desktop app.": "Figma MCP 服务器通过 Figma 桌面应用处理身份验证。当你登录桌面应用时，Figma 会自动管理这个验证。",
    "Developer terms:": "开发者条款：",
    "Review Figma's": "查看 Figma 的",
    "developer terms": "开发者条款",
    "This extension allows Claude to interact with your macOS Notes app, enabling creating, reading, updating, and listing notes.": "这个扩展让 Claude 与你的 macOS 备忘录应用交互，实现创建、读取、更新和列出笔记。",
    "It uses macOS automation features to interact with the Messages app and requires your explicit permission through macOS security prompts before accessing Messages or Contacts. It is not affiliated with or endorsed by Apple Inc.": "它使用 macOS 自动化功能与信息应用交互，并在访问信息或通讯录前需要你通过 macOS 安全提示明确授权。它与 Apple Inc. 无关联，也未获其背书。",
    "Blender MCP offers a natural language interface with Blender's Python API, improving access to documentation, and allowing users to explore and understand complex setups.": "Blender MCP 提供与 Blender Python API 的自然语言接口，改善对文档的访问，并让用户能探索和理解复杂的设置。",
    "An add-on is required to use the MCP Server, please follow the": "使用 MCP 服务器需要一个插件，请遵循",
    "The Fusion MCP server connects Claude to a live Autodesk Fusion session, allowing Claude to send tool requests and perform real-time modeling and command-based operations directly in Fusion.": "Fusion MCP 服务器把 Claude 连接到一个实时的 Autodesk Fusion 会话，让 Claude 能发送工具请求，并直接在 Fusion 中执行实时建模和基于命令的操作。",
    "Key features:\n• Real-time interaction with Fusion: Send commands to an active Fusion session and see results immediately in your design workspace.\n• Session-based modeling: Create, modify, and inspect 3D geometry, sketches, and features through natural language prompts.\n• Live command execution: Execute Fusion operations such as creating primitives, applying modifications, and querying design data without leaving Claude.\n• Local-only connection: The MCP server runs on your machine, keeping your design data private and secure.": "主要功能：\n• 与 Fusion 实时交互：向活跃的 Fusion 会话发送命令，在你的设计工作空间立即看到结果。\n• 基于会话的建模：通过自然语言提示创建、修改并检查 3D 几何体、草图和特征。\n• 实时命令执行：执行 Fusion 操作，如创建基本体、应用修改和查询设计数据，无需离开 Claude。\n• 仅本地连接：MCP 服务器在你的机器上运行，让你的设计数据保持私密和安全。",
    "This server requires Autodesk Fusion. If you don't already have it,": "这个服务器需要 Autodesk Fusion。如果你还没有，",
    "download Fusion": "下载 Fusion",
    "to get started.": "开始使用。",
    "Requirements:\n• Fusion must be installed and running locally.\n• The MCP server must be enabled in Fusion under Preferences > General > API > Fusion MCP Server.\n• Claude Desktop must be installed and configured with the correct port.": "要求：\n• Fusion 必须已在本地安装并运行。\n• 必须在 Fusion 中通过 首选项 > 常规 > API > Fusion MCP Server 启用 MCP 服务器。\n• Claude Desktop 必须已安装并配置了正确的端口。",
    "Terms:": "条款：",
    "Your use of this connector is subject to the Autodesk": "你对这个连接器的使用受 Autodesk",
    "Terms of Use": "使用条款",
    "Key features:\n* Access data via natural language: Analyze data without SQL or coding skills. Connect to hundreds of data flows and dashboards, and get answers just by asking like you'd ask your colleague.\n* Always stay up to date: Coupler.io keeps your data fresh based on the schedule you create, so Claude delivers on-demand reports and insights whenever you need them.\n* Blend data across sources: Combine data from multiple sources and interact with it directly in your AI chat.\n* Analyze big data with AI: Coupler.io MCP enables Claude to handle large datasets without limits, so you get complete insights without context window restrictions.\n* Turn your data into dialogue: analyze, explore, and automate insights directly in Claude.": "主要功能：\n* 通过自然语言访问数据：无需 SQL 或编码技能就能分析数据。连接数百个数据流和仪表盘，像问同事一样开口就能获得答案。\n* 始终保持最新：Coupler.io 按你创建的时间表保持你的数据新鲜，所以 Claude 随时按需交付报告和洞察。\n* 跨来源融合数据：把来自多个来源的数据组合起来，直接在你的 AI 对话中处理。\n* 用 AI 分析大数据：Coupler.io MCP 让 Claude 能无限制地处理大数据集，让你不受上下文窗口限制地获得完整洞察。\n* 把你的数据变成对话：直接在 Claude 中分析、探索并自动化洞察。",
    "__Secure your code by default.__\nThe Socket MCP server brings powerful, real-time dependency scanning directly into Claude. Instantly audit packages from npm, PyPI, Cargo, and more—right inside your chats—with zero setup. Built on the Model Context Protocol (MCP), this extension automatically evaluates packages for:\n- Vulnerabilities and malware\n- Supply chain risks\n- Code quality and maintenance\n- License compliance": "__默认保护你的代码。__\nSocket MCP 服务器把强大的实时依赖扫描直接带入 Claude。即时审计来自 npm、PyPI、Cargo 等的包——就在你的对话里——零配置。基于 Model Context Protocol (MCP)，这个扩展自动从以下方面评估包：\n- 漏洞和恶意软件\n- 供应链风险\n- 代码质量和维护\n- 许可合规",
    "With a single command, Claude will return detailed security scores (0–100) across five critical dimensions—helping you make informed decisions and avoid risky dependencies before they hit production.": "一个命令，Claude 就会返回跨五个关键维度的详细安全评分（0–100）——帮你做出明智决策，在高风险依赖进入生产前避开它们。",
    "Search any company or professional to access emails, phone numbers, roles, growth signals, tech stack details, business events, website changes, and more. Use it to": "搜索任意公司或专业人士，获取邮箱、电话号码、职位、增长信号、技术栈详情、商业动态、网站变更等。用它来",
    "find qualified leads": "找到合格线索",
    "research prospects": "调研潜客",
    "create personalized outreach": "打造个性化触达",
    ", or": "，或",
    "identify talent": "识别人才",
    ", all directly within your chat. Vibe Prospecting provides fresh and compliant B2B data through a complete enrichment hub.": "，全部直接在你的对话里。Vibe Prospecting 通过一个完整的数据丰富中枢提供新鲜、合规的 B2B 数据。",
    "This extension allows Claude to interact with your macOS iMessage app, enabling sending, reading, and managing messages. Ask Claude to summarize your recent messages, help you understand what's most important.": "这个扩展让 Claude 与你的 macOS iMessage 应用交互，实现发送、读取和管理消息。让 Claude 总结你近期的消息，帮你理解什么最重要。",
    "A Model Context Protocol (MCP) server that provides gene set enrichment analysis using the Enrichr API. This server supports all available gene set libraries from Enrichr and returns only statistically significant results (adjusted p < 0.05) for LLM tools to interpret.": "一个 Model Context Protocol (MCP) 服务器，用 Enrichr API 提供基因集富集分析。这个服务器支持 Enrichr 所有可用的基因集库，并只返回统计显著的结果（校正后 p < 0.05）供 LLM 工具解读。",
    "Features:\n- Multi-Library Enrichment Analysis: Query multiple Enrichr libraries simultaneously\n- Comprehensive Library Support: Access to hundreds of gene set libraries including GO, pathways, diseases, tissues, drugs\n- GO Enrichment Analysis: Specialized tool for GO Biological Process enrichment analysis\n- Configurable output formats: detailed, compact, or minimal\n- Export results to TSV files": "功能：\n- 多库富集分析：同时查询多个 Enrichr 库\n- 全面的库支持：访问数百个基因集库，包括 GO、通路、疾病、组织、药物\n- GO 富集分析：面向 GO 生物过程富集分析的专用工具\n- 可配置的输出格式：detailed、compact 或 minimal\n- 把结果导出到 TSV 文件",
    "Kapture is a powerful browser automation tool that enables AI assistants like Claude to control web browsers through a Chrome DevTools extension. It provides a seamless bridge between MCP clients and browser automation, allowing you to navigate pages, interact with elements, capture screenshots, and extract information from websites.": "Kapture 是一个强大的浏览器自动化工具，让 Claude 等 AI 助手能通过一个 Chrome DevTools 扩展控制网页浏览器。它在 MCP 客户端与浏览器自动化之间提供无缝桥梁，让你导航页面、与元素交互、捕获截图并从网站提取信息。",
    "Key features:\n- Navigate and control browser tabs\n- Click, hover, and interact with page elements\n- Fill forms and input fields\n- Capture screenshots of pages or specific elements\n- Extract DOM content and query elements\n- Monitor console logs in real-time\n- Support for multiple simultaneous browser connections": "主要功能：\n- 导航并控制浏览器标签\n- 点击、悬停并与页面元素交互\n- 填写表单和输入框\n- 捕获页面或特定元素的截图\n- 提取 DOM 内容并查询元素\n- 实时监控控制台日志\n- 支持多个同时的浏览器连接",
    "The Affinity MCP server saves you time by automating repetitive tasks, or creating entirely new Affinity tools and workflows, that can be saved and reused when you need them.": "Affinity MCP 服务器通过自动化重复任务，或创建全新的、可保存并在你需要时复用的 Affinity 工具和工作流，为你省时间。",
    "Key capabilities:\n- Automate repetitive tasks like naming layers or batch image edits\n- Build new tools and workflows with custom dialogs directly in Affinity\n- Save your favourite workflows as reusable scripts in Affinity's Scripting panel": "主要能力：\n- 自动化重复任务，如命名图层或批量修图\n- 直接在 Affinity 中用自定义对话框构建新工具和工作流\n- 把你喜欢的工作流保存为 Affinity 脚本面板中的可复用脚本",
    "Setup:": "配置：",
    "The Affinity MCP server runs locally on your device. It's only active when both Claude desktop and Affinity are running. You'll need to stay up to date with the latest version of the Affinity desktop app.\nTo enable the Affinity MCP server:\n- Open Affinity by Canva\n- Go to Settings, where you will find the MCP Server configuration options": "Affinity MCP 服务器在你的设备本地运行。仅当 Claude Desktop 和 Affinity 都在运行时才激活。你需要保持 Affinity 桌面应用为最新版本。\n要启用 Affinity MCP 服务器：\n- 打开 Affinity by Canva\n- 进入设置，你会在那里找到 MCP Server 配置选项",
    "The Affinity MCP server handles authentication through the Affinity by Canva desktop app, managed by Canva when you’re logged into the desktop app.": "Affinity MCP 服务器通过 Affinity by Canva 桌面应用处理身份验证，当你登录桌面应用时由 Canva 管理。",
    "A comprehensive Model Context Protocol (MCP) server for Grafana that provides:": "一个面向 Grafana 的全面 Model Context Protocol (MCP) 服务器，提供：",
    "Dashboards": "仪表盘",
    ": Search, get, update, patch, and create dashboards with context window optimization\n-": "：搜索、获取、更新、修补并创建仪表盘，带上下文窗口优化\n-",
    "Datasources": "数据源",
    ": List and query Prometheus, Loki, and ClickHouse datasources\n-": "：列出并查询 Prometheus、Loki 和 ClickHouse 数据源\n-",
    ": Execute PromQL queries, histogram percentile analysis, and retrieve metric metadata\n-": "：执行 PromQL 查询、直方图百分位分析，并检索指标元数据\n-",
    ": Query logs and metrics using LogQL, detect log patterns\n-": "：用 LogQL 查询日志和指标、检测日志模式\n-",
    ": Execute SQL queries, discover tables and schemas\n-": "：执行 SQL 查询、发现表和 schema\n-",
    "Alerting": "告警",
    ": List, create, update, and delete alert rules and contact points\n-": "：列出、创建、更新和删除告警规则和联系点\n-",
    "Incidents": "事件",
    ": Manage incidents in Grafana Incident\n-": "：在 Grafana Incident 中管理事件\n-",
    ": Investigate errors and performance issues\n-": "：调查错误和性能问题\n-",
    ": Manage on-call schedules, shifts, and alert groups\n-": "：管理值班排期、班次和告警组\n-",
    ": Continuous profiling with profile types, labels, and flame graphs\n-": "：持续性能剖析，带 profile 类型、标签和火焰图\n-",
    "Navigation": "导航",
    ": Generate accurate deeplinks to Grafana resources\n-": "：生成指向 Grafana 资源的准确深链\n-",
    "Annotations": "标注",
    ": Query, create, update, and patch annotations\n-": "：查询、创建、更新和修补标注\n-",
    "Admin": "管理",
    ": Manage teams, users, roles, and permissions\n-": "：管理团队、用户、角色和权限\n-",
    "Rendering": "渲染",
    ": Generate PNG snapshots of dashboard panels": "：生成仪表盘面板的 PNG 快照",
    "Requires Grafana version 9.0 or later for full functionality.": "完整功能需要 Grafana 9.0 或更高版本。",
    "The GrowthBook MCP Server enables AI assistants to interact with GrowthBook, an open source feature flagging and experimentation platform. Create feature flags, set up A/B tests, analyze experiment results, and manage your experimentation workflow directly from your AI coding assistant.": "GrowthBook MCP 服务器让 AI 助手能与 GrowthBook（一个开源的功能开关和实验平台）交互。直接从你的 AI 编码助手创建功能开关、搭建 A/B 测试、分析实验结果并管理你的实验工作流。",
    "## Usage Examples": "## 使用示例",
    "Ask Claude to:\n1. Create a feature flag called `new-checkout` that defaults to `false`\n2. Summarize my last 20 experiments\n3. Create an A/B test comparing two checkout button colors - control with `#007bff` and variation with `#28a745`\n4. Search the GrowthBook docs for how to set up a fact metric": "让 Claude：\n1. 创建一个名为 `new-checkout`、默认为 `false` 的功能开关\n2. 总结我最近 20 个实验\n3. 创建一个 A/B 测试，比较两种结账按钮颜色——对照组用 `#007bff`，变体用 `#28a745`\n4. 在 GrowthBook 文档里搜索如何设置一个 fact metric",
    "All Azure MCP tools in a single server. The Azure MCP Server implements the": "所有 Azure MCP 工具集于一个服务器。Azure MCP 服务器实现了",
    "MCP specification": "MCP 规范",
    "to create a seamless connection between AI agents and Azure services.": "，以在 AI agent 和 Azure 服务之间建立无缝连接。",
    "Braze Model Context Protocol (MCP) server is a secure connection that lets AI tools like Claude and Cursor access non-PII Braze data to answer questions, analyze trends, and provide insights. Provides 43 Braze API functions across 16 categories including campaigns, canvases, catalogs, events, KPIs, templates, media library, and more. Limited write support covers content blocks, email templates, and media library asset uploads.": "Braze Model Context Protocol (MCP) 服务器是一个安全连接，让 Claude 和 Cursor 等 AI 工具能访问非 PII 的 Braze 数据来回答问题、分析趋势并提供洞察。提供跨 16 个类别的 43 个 Braze API 函数，包括营销活动、canvas、目录、事件、KPI、模板、媒体库等。有限的写入支持涵盖内容块、邮件模板和媒体库素材上传。",
    "Privacy: This server is read-focused with limited write endpoints for content blocks, email templates, and media library assets. It does not handle, collect, or transmit any personally identifiable information (PII) such as email addresses or phone numbers. For more information about how Braze handles data, please refer to the Braze Privacy Policy at https://www.braze.com/company/legal/privacy.": "隐私：这个服务器以读取为主，仅有少量针对内容块、邮件模板和媒体库素材的写入端点。它不处理、收集或传输任何个人可识别信息（PII），如邮箱地址或电话号码。有关 Braze 如何处理数据的更多信息，请参阅 Braze 隐私政策：https://www.braze.com/company/legal/privacy。",
    // CONNECTOR-FRAG-END

    // === Excel 推广弹窗 (Claude in Excel) ===
    "Supercharge your spreadsheets with Claude in Excel": "用 Excel 版 Claude 强化你的电子表格",
    "Build financial models, analyze data, and create tables and charts with Claude directly in Excel": "直接在 Excel 中用 Claude 构建财务模型、分析数据、创建表格和图表",
    "Transform complex data tasks or messy data clean-ups into simple conversations": "把复杂的数据任务和杂乱的数据清理变成简单的对话",
    "Available with a Claude Pro, Max, Team, or Enterprise plan": "Claude Pro、Max、Team 或 Enterprise 套餐均可使用",
    "Get Claude in Excel": "获取 Excel 版 Claude",
    "Maybe later": "以后再说",

    // Quick Entry / 快捷键
    "Quickly chat to Claude in a few taps": "几下点击就能跟 Claude 聊上",
    "Press ctrl+alt+space": "按 Ctrl+Alt+Space",
    "to type to Claude": "向 Claude 输入",
    "Turn on shortcut": "开启快捷键",
    "Click the": "点击",
    "icon": "图标",
    "in the menu bar.": "在菜单栏。",
    "Dialog": "对话框",

    // 主页主题区
    "Write": "写作",
    "Learn": "学习",
    "Life stuff": "生活",
    "Claude's choice": "Claude 推荐",
    "Claude’s choice": "Claude 推荐",
    "Type / for skills": "输入 / 调用技能",
    "Get apps and extensions": "获取应用和扩展",
    "Gift Claude": "Claude 礼物",
    "About Anthropic": "关于 Anthropic",
    "Tutorials": "教程",
    "Courses": "课程",
    "Your privacy choices": "你的隐私选项",
    "Keyboard shortcuts": "键盘快捷键",

    // 数据统计
    "Overview": "概览",
    "Models": "模型",
    "Sessions": "会话",
    "Total tokens": "总 token",
    "Active days": "活跃天数",
    "Current streak": "当前连续天数",
    "Longest streak": "最长连续天数",
    "Peak hour": "高峰时段",
    "Favorite model": "最常用模型",
    "Find skill locations": "查找技能位置",
    "Chat mode": "对话模式",
    "Bypass permissions": "跳过权限",

    // git / 操作
    "Edited": "编辑了",
    "edited": "编辑了",
    "Editing": "编辑中",
    "editing": "编辑中",
    "ran": "执行了",
    "Ran": "执行了",
    "Running": "运行中",
    "Read": "读取了",
    "read": "读取了",
    "Reading": "读取中",
    "Searched": "搜索了",
    "Searching": "搜索中",
    "Created": "创建了",
    "Creating": "创建中",
    "Wrote": "写入了",
    "Writing": "写入中",
    "Updated": "更新了",
    "Updating": "更新中",
    "Deleted": "删除了",
    "Deleting": "删除中",
    "Loaded": "加载了",
    "Loading": "加载中",
    "Generated": "生成了",
    "Generating": "生成中",
    "Connected": "已连接",
    "Connecting": "连接中",
    "Disconnected": "已断开",
    "Asked": "询问了",
    "Asking": "询问中",
    "a file": "一个文件",
    "a command": "一条命令",
    "Running": "运行中",
    "running": "运行中",
    // 单独的"files"/"commands" 等不翻——避免误伤 "modify or delete files" 这种普通名词
    // 数字+units 上下文（"3 files"）由 dynamic regex 翻

    // 整段精确（含 "files" 的句子整段翻，避免单词局部替换）
    "Claude can modify or delete files without asking": "Claude 可以直接修改或删除文件，无需询问",
    "Dictation settings": "听写设置",
    "Dictation": "听写",
    "all plans": "所有套餐",
    "View all plans": "查看所有套餐",
    "View all": "查看全部",
    "Usage policy": "用量政策",
    "Privacy policy": "隐私政策",
    "policy": "政策",

    // 设置 - Profile / 工作领域
    "Engineering": "工程",
    "Product management": "产品管理",
    "Human resources": "人力资源",
    "Finance": "财务",
    "Marketing": "市场营销",
    "Sales": "销售",
    "Operations": "运营",
    "Data science": "数据科学",
    "Design": "设计",
    "Legal": "法务",
    "Other": "其他",
    "What": "什么",
    "should Claude consider in responses?": "Claude 回复时应该考虑哪些？",
    "Your preferences will apply to all conversations, within": "你的偏好会应用到所有对话，在",
    "Anthropic's guidelines": "Anthropic 的准则",
    "Anthropic’s guidelines": "Anthropic 的准则",
    "e.g. keep explanations brief and to the point": "例如：解释保持简短切中要点",

    // 设置 - 通知
    "Dispatch messages": "Dispatch 消息",
    "Get a push notification on your phone when Claude messages you in Dispatch.": "Claude 在 Dispatch 给你发消息时手机收到推送通知。",

    // 设置 - 外观
    "Auto": "自动",
    "Background animation": "背景动画",
    "Enabled": "已启用",
    "Disabled": "已禁用",
    "Chat font": "对话字体",
    "Sans": "无衬线",
    "Dyslexic friendly": "阅读障碍友好",

    // 设置 - 账户
    "To delete your account, please cancel your Claude Pro subscription first.": "删除账户前请先取消 Claude Pro 订阅。",
    "To delete your account, please cancel your Claude Max subscription first.": "删除账户前请先取消 Claude Max 订阅。",
    "Log out of all devices": "从所有设备退出登录",
    "Delete account": "删除账户",
    "Organization ID": "组织 ID",
    "Active sessions": "活跃会话",
    "Device": "设备",
    "Location": "位置",
    "Created": "创建于",
    "Updated": "更新于",
    "Current": "当前",

    // 设置 - 隐私
    "Anthropic believes in transparent data practices": "Anthropic 致力于透明的数据实践",
    "Learn how your information is protected when using Anthropic products, and visit our": "了解使用 Anthropic 产品时你的信息如何受保护，并访问我们的",
    "and": "和",
    "for more details.": "了解更多细节。",
    "How we protect your data": "我们如何保护你的数据",
    "How we use your data": "我们如何使用你的数据",
    "Your data": "你的数据",
    "Privacy Center": "隐私中心",
    "Privacy Policy": "隐私政策",
    "Export data": "导出数据",
    "Shared chats": "已分享的对话",
    "Manage": "管理",
    "Memory preferences": "记忆偏好",
    "Location metadata": "位置元数据",
    "Allow Claude to use coarse location metadata (city/region) to improve product experiences.": "允许 Claude 使用粗略位置（城市/地区）以改善产品体验。",
    "Help improve Claude": "帮助改进 Claude",
    "Allow the use of your chats and coding sessions to train and improve Anthropic AI models.": "允许使用你的对话和编程会话训练并改进 Anthropic AI 模型。",

    // 设置 - 套餐
    "Max plan": "Max 套餐",
    // === 套餐切换/降级流程 (Max↔Pro↔Max5x) ===
    // Change/Current/Next/Confirm/Max 都是单词级条目, partial 会拆词留英文, 整短语 exact 优先
    "Switch back to Pro plan": "切换回 Pro 套餐",
    "Change to Max 5x plan": "更改为 Max 5x 套餐",
    "Confirm Pro plan": "确认 Pro 套餐",
    "Confirm changes": "确认更改",
    "Current cycle": "当前周期",
    "Next cycle": "下个周期",
    "Pro plan": "Pro 套餐",
    "Annual": "年付",
    "Monthly": "月付",
    // 降级横幅 lead 片段 (套餐名是富组件→拆节点; whole-string 走 dynamicPattern 兜一节点情况)
    "Your plan will be downgraded to": "你的套餐将降级为",
    // 计费条款 (terms 是独立链接节点, 保留英文; 按 年/月 两种 lead + 共用 trailing)
    "You agree that Anthropic will charge your card in the amount above now and on a recurring annual basis until you cancel in accordance with our": "你同意 Anthropic 自即日起按上述金额、以年度为周期持续从你的卡扣款，直至你依据我们的",
    "You agree that Anthropic will charge your card in the amount above now and on a recurring monthly basis until you cancel in accordance with our": "你同意 Anthropic 自即日起按上述金额、以月度为周期持续从你的卡扣款，直至你依据我们的",
    ". You can cancel at any time in your account settings.": " 取消订阅。你可以随时在账户设置中取消。",
    "20x more usage than Pro": "用量是 Pro 的 20 倍",
    "Adjust plan": "调整套餐",
    "Subscribed via Android app": "通过 Android 应用订阅",
    "Manage subscription and view invoices on your Android device": "在 Android 设备上管理订阅并查看发票",
    "Plan usage limits": "套餐用量上限",
    "Max (20x)": "Max（20 倍）",
    "Current session": "当前会话",
    "Weekly limits": "每周上限",
    "All models": "所有模型",
    "Sonnet only": "仅 Sonnet",
    "You haven't used Sonnet yet": "你还没用过 Sonnet",
    "Claude Design": "Claude Design",
    // === Claude Design 首页 (claude.com/设计) ===
    "Your designs": "你的设计",
    "Design systems": "设计系统",
    "Examples": "示例",
    // === Claude Design - 设计系统流程 ===
    "Design Systems": "设计系统",
    "Claude Design System": "Claude 设计系统",
    "Search design systems": "搜索设计系统",
    "Create design system": "创建设计系统",
    "Create new design system": "创建新设计系统",
    "No design systems yet": "暂无设计系统",
    "Select a design system to browse it": "选择一个设计系统进行浏览",
    "Add a design system": "添加设计系统",
    "Design systems teach Claude your brand. How would you like to start?": "设计系统让 Claude 了解你的品牌。你想怎么开始？",
    "Create here": "在此创建",
    "Connect to Figma or GitHub, or upload slides and assets.": "连接 Figma 或 GitHub，或上传幻灯片和素材。",
    "Create using Claude Code": "用 Claude Code 创建",
    "BEST FIDELITY": "最高保真",
    "Best fidelity if you have React components.": "如果你有 React 组件，保真度最高。",
    "Continue to generation": "继续生成",
    "Set up your design system": "设置你的设计系统",
    "Tell us about your company and attach any design resources you have.": "介绍一下你的公司，并附上你拥有的任何设计资源。",
    "Company name and blurb (or name of design system)": "公司名称和简介（或设计系统的名称）",
    // ↑整串命不中：Company name / blurb 是独立加粗节点，拆片段补（covers 2-node 与 4-node 两种切法）
    "Company name": "公司名称",
    "blurb": "简介",
    "and blurb (or name of design system)": "和简介（或设计系统的名称）",
    "(or name of design system)": "（或设计系统的名称）",
    "Provide examples of your design system and products": "提供你的设计系统和产品示例",
    "(all optional)": "（全部可选）",
    "What works best: code and designs for your design system and your code products.": "效果最好的是：用于你设计系统的代码和设计，以及你的代码产品。",
    "Link code from GitHub": "从 GitHub 链接代码",
    "Link code from your computer": "从你的电脑链接代码",
    "This doesn't upload the whole codebase; Claude will copy selected files. For large codebases, we recommend attaching a frontend-focused subfolder.": "这不会上传整个代码库；Claude 只会复制选中的文件。对于大型代码库，建议附加一个偏前端的子文件夹。",
    "This doesn’t upload the whole codebase; Claude will copy selected files. For large codebases, we recommend attaching a frontend-focused subfolder.": "这不会上传整个代码库；Claude 只会复制选中的文件。对于大型代码库，建议附加一个偏前端的子文件夹。",
    "Upload a .fig file": "上传 .fig 文件",
    "Parsed locally in your browser — never uploaded.": "在你的浏览器本地解析 —— 绝不上传。",
    "Learn how to get a .fig file": "了解如何获取 .fig 文件",
    "Add fonts, logos and assets": "添加字体、Logo 和素材",
    "Any other notes?": "还有其他备注吗？",
    // 拖拽上传区 (browse 是独立链接节点；"...here or" 是 lead 片段)
    "browse": "浏览",
    "Drag a folder here or": "拖拽文件夹到这里，或",
    "Drop .fig here or": "拖放 .fig 文件到这里，或",
    "Drag files here or": "拖拽文件到这里，或",
    // 设计系统列表 / 详情
    "Teach Claude your brand and product": "让 Claude 了解你的品牌和产品",
    "Design system": "设计系统",
    "Set as default": "设为默认",
    "Org default": "组织默认",
    "Remove Design System": "移除设计系统",
    "Published": "已发布",
    "Only you can view these settings.": "只有你能查看这些设置。",
    // 示例提示词卡片 (prompt 正文为功能性英文, 仅翻标题/按钮)
    "Calculator construction kit": "计算器构建套件",
    // 示例 prompt "计算器" 正文被下划线链接拆 3 段: "Create a " | "标题"(含直引号的链接) | "— 后段" (外层弯引号是 CSS ::before/::after, 不在节点内)
    "Create a": "创建一个",
    "\"Calculator construction kit\"": "「计算器构建套件」",
    "— a simple calculator UI with a LOT of tweaks (do not use the normal tweaks system; keep these tweaks onscreen at all times). Use a two-column layout. Provide a ton of visual + layout options.": "—— 一个带大量微调项的简单计算器界面（不要使用常规的微调系统；让这些微调项始终显示在屏幕上）。采用两栏布局。提供大量视觉 + 布局选项。",
    "Text particle effects": "文字粒子特效",
    // "文字粒子" 正文单节点 (无链接; 外层 "…" 是 CSS, 内层 "Fire" 等是直引号)
    "Create a very large editable text box, pre-filled with sample text. For certain words like \"Fire\", \"Smoke\", \"metal\", \"wind\", render visual + particle effects that match the word.": "创建一个超大的可编辑文本框，预填示例文本。对于某些词，例如「Fire」「Smoke」「metal」「wind」，渲染与该词相匹配的视觉 + 粒子特效。",
    // 示例卡更多 (标题 + 正文均单节点纯英文, 整串 exact)
    "App onboarding": "应用引导",
    "Create a simple iOS signup flow for a bikesharing app. Show screens on a canvas. Blue + orange modern color scheme.": "为一个共享单车应用创建一个简单的 iOS 注册流程。在画布上展示各个界面。蓝色 + 橙色的现代配色方案。",
    "Shader wallpapers": "着色器壁纸",
    "Imagine you're creating a wallpaper for a futuristic operating system. We want it to feel interactive and fun to fidget with. Create five different interactive shader wallpapers that react to mouse position, and maybe clicks.": "想象你在为一个未来感的操作系统制作壁纸。我们希望它有交互感、把玩起来很有趣。创建五个不同的交互式着色器壁纸，它们会响应鼠标位置，也许还能响应点击。",
    "Imagine you’re creating a wallpaper for a futuristic operating system. We want it to feel interactive and fun to fidget with. Create five different interactive shader wallpapers that react to mouse position, and maybe clicks.": "想象你在为一个未来感的操作系统制作壁纸。我们希望它有交互感、把玩起来很有趣。创建五个不同的交互式着色器壁纸，它们会响应鼠标位置，也许还能响应点击。",
    "Globe loader": "地球加载动画",
    "Prototype a loading indicator that shows the globe spinning with real country outlines, full monochrome, no text, 200×200 centered on off-white background. Add a whirl effect around it.": "做一个加载指示器原型：展示地球旋转，带真实的国家轮廓，全单色、无文字，200×200，居中于米白色背景。在其周围加一个旋转效果。",
    "Cosmic scale animation": "宇宙尺度动画",
    "Create a sprite-based animation that gives fun facts about the distance and sizes of celestial bodies. Mix abstract animations using circles of various sizes as celestial bodies with text-based animation. Use a monochrome, helvetica palette.": "创建一个基于精灵图的动画，讲述天体之间的距离和大小的趣味知识。用不同大小的圆作为天体，把抽象动画与基于文字的动画混合起来。采用单色、helvetica 风格的配色。",
    "Organic loaders": "有机加载动画",
    "Prototype 20 simple, tasteful indeterminate loading indicators that fit in a 200×200 space, on a wrapping grid. All black and white, no text. All should have an organic, blobby feeling.": "做 20 个简洁、有格调的不确定型加载指示器原型，放进 200×200 的空间，排成自动换行的网格。全部黑白、无文字。都要有一种有机、圆润流动的感觉。",
    "Iridescent card": "虹彩卡片",
    "Create a monochromatic playing card. Display it on the page with a rich perspective hover effect and glow. The bright areas should be iridescent; there should be a subtle noise texture and specular glow that reacts to the mouse position. Add tweaks for as many aspects of this effect as you can.": "创建一张单色扑克牌。在页面上展示它，配丰富的透视悬停效果和辉光。明亮区域应呈现虹彩；应有细微的噪点纹理，以及随鼠标位置变化的高光辉光。尽可能多地为这个效果的各个方面加上微调项。",
    "Text streaming": "文字流式输出",
    "On a responsive grid, animate 10 different text-streaming animations for a chat app; sample each one in a 300×300 cell; show a user question and stream a response below. Loop it. Monochrome.": "在一个响应式网格上，为聊天应用制作 10 种不同的文字流式输出动画；每种在一个 300×300 的单元格里展示；上方显示用户提问，下方流式输出回复。循环播放。单色。",
    "Use this prompt": "使用此提示词",
    // === Claude Design - Designs 列表 / Slides 构建 / .fig 弹窗 ===
    "Design System": "设计系统",
    "Last viewed": "最后查看",
    "Owner": "所有者",
    "Add to favorites": "添加到收藏",
    "Drafts": "草稿",
    "Draft": "草稿",
    // Claude Design 输入区 - 上下文来源选择 (Start→开始 词条会拆 "开始 with context", 整串 exact 优先)
    "Start with context": "从上下文开始",
    "Designs grounded in real context turn out better.": "基于真实上下文的设计效果更好。",
    "Screenshot": "截图",
    "Codebase": "代码库",
    // Claude Design 各模式上下文选择页 (标题 "What ...?" 是加粗拆节点, 待定; 其余整句/chip 可补)
    "This design system is empty — finish setting it up to add tokens, components, and brand assets.": "这个设计系统还是空的 —— 完成设置以添加 token、组件和品牌素材。",
    "Lo-fi moves fast — a screenshot or rough notes is plenty.": "低保真推进快 —— 一张截图或粗略笔记就够了。",
    "Add a screenshot": "添加截图",
    // 各模式标题 "What ...?" 是单节点 (DevTools 确认 <div>整串</div>, 视觉加粗是字重差非拆分), 整串 exact 即可
    "What are we wireframing?": "我们要画什么线框？",
    "What's the doc about?": "这个文档讲什么？",
    "What’s the doc about?": "这个文档讲什么？",
    "What's the story?": "讲个什么故事？",
    "What’s the story?": "讲个什么故事？",
    "Talking it out works great — ramble, and the doc takes shape.": "把想法说出来效果很好 —— 随便讲，文档就会成形。",
    "Upload a PDF or notes": "上传 PDF 或笔记",
    "A storyboard, a script, or image assets set the direction.": "一份故事板、一个脚本或图片素材就能定下方向。",
    "Drop a storyboard or images": "拖入故事板或图片",
    "Paste a script": "粘贴脚本",
    // 输入区 chips
    "Hi-fi design": "高保真设计",
    "Interactive prototype": "交互式原型",
    "Wireframe": "线框图",
    "Make a doc": "制作文档",
    "Animated video": "动画视频",
    // Slides/Deck 构建器
    "Untitled": "未命名",
    "No file open": "没有打开的文件",
    // === Claude Design 编辑器/画布 + 分享弹窗 ===
    "Canvas": "画布",
    "Mark up": "标注",
    "Comments": "评论",
    "Present": "演示",
    "In this tab": "在当前标签页",
    "Fullscreen": "全屏",
    "New tab": "新标签页",
    "Zoom level": "缩放级别",
    "Discard": "放弃",
    "Simple": "简单",
    "No elements yet": "暂无元素",
    // ↑ 被 <br> 拆两段 (DevTools 确认), 拆片段
    "Add something with the tools above (R · F · O · T),": "用上方工具添加内容（R · F · O · T），",
    "paste, or drop an image onto the canvas.": "或粘贴、拖入图片到画布。",
    // 分享弹窗
    "Nothing to export yet": "暂无可导出内容",
    // 发送至 tab
    "Your destinations": "你的发送目标",
    "Hand off the project to your terminal": "把项目交给你的终端",
    "Add a destination": "添加发送目标",
    // 导出 tab
    "Format": "格式",
    "Print-ready, one page per screen.": "适合打印，每屏一页。",
    "Editable slides for PowerPoint & Keynote.": "适用于 PowerPoint 和 Keynote 的可编辑幻灯片。",
    "Project archive": "项目存档",
    "Every file in this project, zipped.": "本项目的所有文件，打包成 zip。",
    "Standalone HTML": "独立 HTML",
    "One self-contained file that works offline.": "一个可离线工作的自包含文件。",
    "PowerPoint options": "PowerPoint 选项",
    "Recommended": "推荐",
    "Editable · custom fonts": "可编辑 · 自定义字体",
    "For computers with brand fonts installed. Best fidelity with full editability.": "适用于装有品牌字体的电脑。保真度最高且完全可编辑。",
    "Editable · universal fonts": "可编辑 · 通用字体",
    "Substitutes web-safe fonts everyone has. Best for sharing broadly.": "替换为人人都有的 web 安全字体。最适合广泛分享。",
    "Editable · Google Slides fonts": "可编辑 · Google Slides 字体",
    "Uses Google Fonts for full compatibility when uploading to Google Slides.": "上传到 Google Slides 时使用 Google Fonts 以获得完全兼容。",
    "Screenshot-based PPTX": "基于截图的 PPTX",
    "Pixel-perfect slides as images. Not editable, but exactly what you see.": "以图片形式呈现的像素级精确幻灯片。不可编辑，但所见即所得。",
    // === Claude Design 文件面板 + 评论 ===
    "All files": "所有文件",
    "New sketch": "新建草图",
    "Paste": "粘贴",
    "HTML page": "HTML 页面",
    "SCRIPTS": "脚本",
    "Script": "脚本",
    "Select a file to preview": "选择一个文件以预览",
    "Drop files here": "拖放文件到这里",
    "Images, docs, references, Figma links, or folders — Claude will use them as context.": "图片、文档、参考资料、Figma 链接或文件夹 —— Claude 会把它们用作上下文。",
    "Delete file?": "删除文件？",
    "Click and tell Claude what to change · drag to draw": "点击并告诉 Claude 要改什么 · 拖动以绘制",
    "No comments yet. Leave feedback for your teammates below.": "还没有评论。在下方给你的队友留下反馈。",
    "Add a comment...": "添加评论...",
    "Add a comment…": "添加评论…",
    // Claude Design 空状态 + 对话多选栏
    "Creations will appear here": "作品会显示在这里",
    "Start with a sketch": "从草图开始",
    "Select all": "全选",
    // 模型选择器 / 添加上下文菜单 / 附加代码库弹窗
    "Currently disabled": "当前已禁用",
    "Reference another project": "引用另一个项目",
    "Link local code...": "链接本地代码...",
    "Link local code…": "链接本地代码…",
    "Upload .fig file": "上传 .fig 文件",
    "Learn how": "了解方法",
    "Manage connectors": "管理连接器",
    "Attach codebase": "附加代码库",
    "Drop your codebase here": "把你的代码库拖到这里",
    "For large codebases, drop the frontend or design system folder": "对于大型代码库，拖入前端或设计系统文件夹",
    "or browse...": "或浏览...",
    "or browse…": "或浏览…",
    "Attach": "附加",
    "Attaching...": "附加中...",
    "Attaching…": "附加中…",
    "To bring another project into this chat, paste its URL directly into the composer. Claude will pick it up and can read its files.": "要把另一个项目带入此对话，直接把它的 URL 粘贴到输入框。Claude 会识别并能读取它的文件。",
    "Got it": "知道了",
    "Share link": "分享链接",
    "Send to...": "发送至…",
    "Send to…": "发送至…",
    "Who can access": "谁可以访问",
    "Your workspace": "你的工作区",
    "Only you can see this design.": "只有你能看到这个设计。",
    "Pages": "页面",
    "New blank page": "新建空白页",
    "All project files": "所有项目文件",
    "What's the presentation about?": "这个演示文稿是关于什么的？",
    "What’s the presentation about?": "这个演示文稿是关于什么的？",
    "Upload a doc, share your notes, or an existing presentation to start from.": "上传文档、分享你的笔记，或提供一个现有演示文稿作为起点。",
    "Upload a doc": "上传文档",
    "Paste your notes": "粘贴你的笔记",
    "Existing deck": "现有演示文稿",
    "Deck options": "演示文稿选项",
    "Optimize for Google Slides": "针对 Google 幻灯片优化",
    "Only use Google Fonts": "仅使用 Google Fonts",
    "Add speaker notes": "添加演讲者备注",
    "Include talking points with each slide": "为每张幻灯片附上要点",
    "Describe what you want to create...": "描述你想创建的内容...",
    "Describe what you want to create…": "描述你想创建的内容…",
    "Make a deck": "制作演示文稿",
    // .fig 下载帮助弹窗 (step 2 含加粗 File/Save 独立节点, 整串 + 片段双保险)
    "How to download a .fig file": "如何下载 .fig 文件",
    "From the Figma web or desktop app:": "在 Figma 网页版或桌面应用中：",
    "Open the file in Figma.": "在 Figma 中打开文件。",
    "Go to File → Save local copy... (web: main menu → File).": "前往 文件 → 保存本地副本…（网页版：主菜单 → 文件）。",
    "Save local copy...": "保存本地副本…",
    "(web: main menu →": "（网页版：主菜单 →",
    "Figma downloads a .fig file. Drop it onto the chat input.": "Figma 会下载一个 .fig 文件。把它拖到聊天输入框即可。",
    "The file is parsed locally in your browser and never uploaded.": "该文件在你的浏览器本地解析，绝不上传。",
    // 占位示例文本
    "e.g. Mission Impastabowl: fast-casual pasta restaurant with in-store touchscreen kiosk, mobile app and website": "例如：Mission Impastabowl——一家快休闲意面餐厅，配店内触屏自助机、手机 App 和网站",
    "e.g. We use a warm, earthy color palette with rounded corners. Our brand voice is playful but professional...": "例如：我们使用温暖的大地色调和圆角。品牌调性活泼但不失专业……",
    "Search designs": "搜索设计",
    "Make something new": "创建新作品",
    "Design system:": "设计系统：",
    "Start with a file": "从文件开始",
    "Turn it into a design": "把它变成设计",
    "Slides": "幻灯片",
    "Presentations & pitch decks": "演示文稿与路演稿",
    "Product prototype": "产品原型",
    "Interactive app mockups": "交互式应用原型图",
    "Product wireframe": "产品线框图",
    "Lo-fi screens & flows": "低保真界面与流程",
    "Document": "文档",
    "Resumes, PDFs, etc": "简历、PDF 等",
    "Resumes, PDFs, etc.": "简历、PDF 等",
    "Animation": "动画",
    "Motion graphics": "动态图形",
    "Motion graphics & loops": "动态图形与循环",
    "Blank canvas": "空白画布",
    "Set up your design system so anyone can create consistent designs and assets.": "设置你的设计系统，让任何人都能创建一致的设计和素材。",
    "Set up design system": "设置设计系统",
    "Designs": "设计作品",
    "Nothing here yet.": "这里还什么都没有。",
    "You haven't used Claude Design yet": "你还没用过 Claude Design",
    // === Claude Design 推广卡 (bold 标签是独立节点保留英文, rest 片段翻译) ===
    "Build something you can click, share, or present:": "构建可点击、可分享或可演示的成品：",
    "you can click": "可点击",
    "from a sketch": "来自草图",
    "from your documents": "来自你的文档",
    "from a script": "来自脚本",
    "you can describe": "可描述",
    "Skip intro": "跳过介绍",
    "Extra usage": "额外用量",
    "Turn on extra usage to keep using Claude if you hit a limit.": "开启额外用量，达到上限后仍可继续使用 Claude。",
    "Additional features": "附加功能",
    "Daily included routine runs": "每日定时任务运行额度",
    "You haven't run any routines yet": "你还没运行过定时任务",

    // 设置 - 记忆
    "Memory": "记忆",
    "Search and reference chats": "搜索并引用对话",
    "Allow Claude to search for relevant details in past chats.": "允许 Claude 在过去的对话中搜索相关细节。",
    "Chat memory": "对话记忆",
    "No memory yet": "尚无记忆",
    "Generate memory from chat history": "从对话历史生成记忆",
    "Allow Claude to remember relevant context from your chats. This setting controls memory for both chats and projects.": "允许 Claude 记住对话中的相关上下文。此设置同时控制对话和项目的记忆。",
    "Import memory from other AI providers": "从其他 AI 提供商导入记忆",
    "Bring relevant context and data from another AI provider to Claude. We'll provide a prompt you can use to fetch the memory from your other account.": "把另一个 AI 提供商的上下文和数据带到 Claude。我们会提供一段提示词，你可以用它从其他账号获取记忆。",
    "Start import": "开始导入",

    // 设置 - 工具
    "Tool access": "工具访问",
    "Tool access set to load when needed": "工具访问已设为按需加载",
    "Tool access set to already loaded": "工具访问已设为预先加载",
    "Tool access mode": "工具访问模式",
    "Controls how connector tools are loaded in new conversations.": "控制新对话中连接器工具如何加载。",
    "Load tools when needed": "需要时加载",
    "Chats compact less since tools aren't pre-loaded.": "工具不预加载，对话压缩频率较低。",
    "Tools already loaded": "工具已预加载",
    "Chats compact more often since tools are always there.": "工具一直在，对话压缩频率较高。",

    // 设置 - 视觉
    "Visuals": "视觉",
    "AI-powered artifacts": "AI 驱动的 Artifacts",
    "AI-powered artifacts enabled": "已启用 AI 驱动的 Artifacts",
    "AI-powered artifacts disabled": "已禁用 AI 驱动的 Artifacts",
    "Generate code, documents, and designs in a dedicated window alongside your conversation.": "在对话旁边的专用窗口里生成代码、文档和设计。",
    "Build apps and interactive documents that use Claude inside the artifact.": "构建在 artifact 中使用 Claude 的应用和交互式文档。",
    "Inline visualizations": "内联可视化",
    "Inline visualizations enabled": "已启用内联可视化",
    "Inline visualizations disabled": "已禁用内联可视化",
    "Allow Claude to generate interactive visualizations, charts, and diagrams directly in the conversation.": "允许 Claude 在对话中直接生成交互式可视化、图表和图示。",
    "Code execution and file creation": "代码执行和文件创建",
    "Cloud code execution and file creation": "云端代码执行和文件创建",
    "Claude can execute code on a server and create and edit docs, spreadsheets, presentations, PDFs, and data reports. Required for skills.": "Claude 可在服务器上执行代码并创建/编辑文档、表格、演示、PDF 和数据报告。技能功能依赖于此。",
    "Allow network egress": "允许出站网络",
    "Give Claude network access to install packages and libraries in order to perform advanced data analysis, custom visualizations, and specialized file processing. Monitor chats closely as this comes with": "给 Claude 网络访问权限，用于安装软件包和库以进行高级数据分析、自定义可视化和特殊文件处理。请密切关注对话——这有",
    "Network egress controls do not apply to web search, web fetch, or MCP connectors. Web fetch runs through Anthropic servers and is limited to URLs found in the user prompt or web search results.": "出站网络控制不适用于网页搜索、网页抓取或 MCP 连接器。网页抓取通过 Anthropic 服务器进行，仅限用户提示或网页搜索结果中出现的 URL。",
    // 这句被 React 拆成多个 textNode（中间有 web search 超链接），整句匹配失败，按片段加：
    "Network egress controls do not apply to": "出站网络控制不适用于",
    ", web fetch, or MCP connectors. Web fetch runs through Anthropic servers and is limited to URLs found in the user prompt or web search results.": "、网页抓取或 MCP 连接器。网页抓取通过 Anthropic 服务器进行，仅限用户提示或网页搜索结果中出现的 URL。",
    "web search": "网页搜索",
    "security risks": "安全风险",
    "Domain allowlist": "域名白名单",
    "Choose which domains the sandbox can access": "选择沙盒能访问哪些域名",
    "Package managers only": "仅包管理器",
    "Claude can access common package managers plus any additional domains you specify below.": "Claude 可访问常见包管理器，以及下方你指定的额外域名。",
    "View package manager domains": "查看包管理器域名",
    "package manager domains": "包管理器域名",
    "All domains": "全部域名",
    "Additional allowed domains": "额外允许的域名",
    "Add": "添加",

    // 设置 - 技能 / 连接器
    "Skills": "技能",
    "Skills have moved to": "技能已移至",
    "Connectors have moved to": "连接器已移至",
    "Browse connectors": "浏览连接器",
    "Browse extensions": "浏览扩展",
    "Discovery": "发现",
    "Let Claude surface connectors from the directory that may be relevant to your conversation.": "让 Claude 从目录中找出可能与你对话相关的连接器。",
    "Allow Claude to reference other apps and services for more context.": "允许 Claude 引用其他应用和服务获取更多上下文。",
    "Connect": "连接",
    "Google Drive": "Google Drive",
    "INCLUDED": "已包含",
    "Configure": "配置",
    "Add custom connector": "添加自定义连接器",
    "Looking for desktop extensions? Manage them": "在找桌面扩展？管理入口在",
    "here": "这里",

    // 设置 - Claude Code 桌面
    "Claude code desktop settings": "Claude Code 桌面设置",
    "Draw attention on notifications": "通知时引起关注",
    "Bounce the dock icon or flash the taskbar when Claude needs your attention and the app is not focused.": "Claude 需要你关注但应用未聚焦时，弹跳 dock 图标或闪烁任务栏。",
    "Worktree location": "工作区位置",
    "Where to store git worktrees for isolated coding sessions": "隔离编程会话的 git worktree 存放位置",
    "Inside project (.claude/worktrees)": "项目内（.claude/worktrees）",
    "Branch prefix": "分支前缀",
    "Prefix added to the beginning of every worktree branch name": "添加到每个 worktree 分支名开头的前缀",
    "Claude can start dev servers, open a live preview, and verify code changes with screenshots, snapshots, and DOM inspection.": "Claude 可以启动开发服务器、打开实时预览，并通过截图、快照和 DOM 检查来验证代码改动。",
    "When Claude pushes changes to a branch, it automatically opens a pull request without asking first.": "Claude 推送改动到分支时，自动开 PR，不再询问。",
    "When you create a pull request, Claude automatically monitors it for CI failures and review comments, then responds proactively. Claude may post comments on your behalf.": "你创建 PR 时，Claude 自动监控 CI 失败和审查评论，然后主动响应。Claude 可能代你发评论。",
    "Bypass all permission checks and let Claude work uninterrupted. This works well for workflows like fixing lint errors or generating boilerplate code. Letting Claude run arbitrary commands is risky and can result in data loss, system corruption, or data exfiltration (e.g., via prompt injection attacks).": "跳过所有权限检查，让 Claude 不间断工作。适合修复 lint 错误或生成样板代码这类工作流。让 Claude 运行任意命令有风险，可能导致数据丢失、系统损坏或数据泄露（例如通过提示注入攻击）。",
    "Auto mode lets Claude handle permission decisions during coding sessions, so developers can run longer tasks without being interrupted by Claude asking for manual approvals. Auto mode also includes additional safeguards against prompt injections.": "自动模式让 Claude 在编程会话中自行处理权限决策，开发者可以不被手动批准请求打断地运行长任务。自动模式也包含针对提示注入的额外防护。",
    "Persist preview sessions": "保留预览会话",
    "Save cookies, local storage, and login sessions for dev server previews. Data is stored per workspace and persists across app restarts. Turning this off clears all saved session data.": "保存开发服务器预览的 cookies、本地存储和登录会话。数据按工作区存储并在应用重启后保留。关闭会清除所有已保存的会话数据。",
    "Claude Code on the web": "网页版 Claude Code",
    "Create pull requests automatically": "自动创建 PR",
    "Authorization tokens": "授权 token",
    "Application": "应用",
    "Scopes": "权限范围",
    "Autofix pull requests": "自动修复 PR",
    "Create as draft": "创建为草稿",
    "Open auto-created pull requests as drafts instead of ready for review.": "把自动创建的 PR 作为草稿打开，而不是直接进入审查。",
    // Extension settings
    "All extensions": "全部扩展",
    "Extension settings": "扩展设置",
    "Enable auto-updates for extensions": "启用扩展自动更新",
    "Automatically update extensions when new versions are available. If disabled, you'll need to manually update extensions.": "有新版本时自动更新扩展。关闭后需要手动更新。",
    "Automatically update extensions when new versions are available. If disabled, you’ll need to manually update extensions.": "有新版本时自动更新扩展。关闭后需要手动更新。",
    "Use Built-in Node.js for MCP": "MCP 使用内置 Node.js",
    "If enabled, Claude will never use the system Node.js for extension MCP servers. This happens automatically when system's Node.js is missing or outdated.": "启用后，Claude 永远不会用系统的 Node.js 作为扩展 MCP 服务器。系统 Node.js 缺失或过时时会自动启用。",
    "If enabled, Claude will never use the system Node.js for extension MCP servers. This happens automatically when system’s Node.js is missing or outdated.": "启用后，Claude 永远不会用系统的 Node.js 作为扩展 MCP 服务器。系统 Node.js 缺失或过时时会自动启用。",
    "Detected tools": "检测到的工具",
    "Extension developer": "扩展开发者",
    "Developer Tools Warning": "开发者工具警告",
    "These tools are intended for extension developers only. Using them incorrectly may cause extensions to malfunction or compromise your system security.": "这些工具仅供扩展开发者使用。错误使用可能导致扩展故障或损害系统安全。",
    "Install Extension": "安装扩展",
    "Install Unpacked Extension": "安装未打包扩展",
    "Open extensions folder": "打开扩展文件夹",
    "Open Extension settings folder": "打开扩展设置文件夹",
    "Auto-archive after PR merge or close": "PR 合并或关闭后自动归档",
    "Automatically archive desktop sessions when the associated pull request is merged or closed.": "关联的 PR 合并或关闭时自动归档桌面会话。",
    "Manage your authorization tokens": "管理你的授权 token",
    "Sharing settings": "分享设置",
    "Control how your claude.ai/code sessions are shared.": "控制你的 claude.ai/code 会话如何共享。",
    "Allow bypass permissions mode": "允许跳过权限模式",
    "See best practices for safe usage": "查看安全使用最佳实践",
    "Allow auto permissions mode": "允许自动权限模式",
    "Install instructions here": "安装说明在这里",

    // Cowork
    "Global instructions": "全局指令",
    "Instructions here apply to all Cowork sessions. Use this for preferences, conventions, or context that Claude should always know.": "这里的指令应用到所有 Cowork 会话。用于 Claude 应始终知晓的偏好、约定或上下文。",
    "Dispatch": "Dispatch",
    "Let Claude work on tasks from your phone using this computer. When off, your phone won't be able to dispatch work here.": "让 Claude 用这台电脑处理来自你手机的任务。关闭后，手机将无法把任务派发到此处。",

    // Chrome 集成
    "Claude in Chrome settings": "Chrome 中的 Claude 设置",
    "Loading extensions...": "加载扩展中……",
    "Allow Claude to directly interact with apps, data, and tools on your computer.": "允许 Claude 直接与你电脑上的应用、数据和工具交互。",
    "Site permissions": "网站权限",
    "Failed to install unpacked extension": "安装未打包的扩展失败",
    "Default for all sites": "对所有网站的默认设置",
    "Choose whether Claude in Chrome works on all sites by default": "选择 Chrome 中的 Claude 是否默认对所有网站生效",
    "Select default policy": "选择默认策略",
    "Allow extension": "允许扩展",
    "Block extension": "屏蔽扩展",
    // 浏览器扩展 - 网站权限列表
    "Browser extension settings updated.": "浏览器扩展设置已更新。",
    "Claude in Chrome works everywhere except sites you block below": "Claude in Chrome 在所有网站生效，但你在下方屏蔽的网站除外",
    "Claude in Chrome only works on sites you allow below": "Claude in Chrome 仅在你下方允许的网站生效",
    "Blocked sites": "已屏蔽的网站",
    "Allowed sites": "已允许的网站",
    "Claude in Chrome cannot be used on these sites": "Claude in Chrome 无法在这些网站上使用",
    "Claude in Chrome can be used on these websites.": "Claude in Chrome 可在这些网站上使用。",
    "Add site": "添加网站",
    "Domain": "域名",
    "No sites added yet.": "尚未添加任何网站。",

    // 设置 - 高级
    "Advanced settings": "高级设置",
    "Local MCP servers": "本地 MCP 服务器",
    "Add and manage MCP servers that you're working on.": "添加并管理你正在开发的 MCP 服务器。",
    "Add and manage MCP servers that you’re working on.": "添加并管理你正在开发的 MCP 服务器。",
    "No servers added": "尚未添加服务器",
    "Developer docs": "开发者文档",

    // 设置 - 系统
    "General desktop settings": "通用桌面设置",
    "Run on startup": "开机启动",
    "Automatically start Claude when you log in to your computer": "登录电脑时自动启动 Claude",
    "Quick Entry keyboard shortcut": "快速输入键盘快捷键",
    "Quickly open Claude from anywhere": "从任意位置快速打开 Claude",
    "Set shortcut": "设置快捷键",
    "System tray": "系统托盘",
    "Keep Claude running in the system tray": "在系统托盘保持 Claude 运行",
    "Keep computer awake": "保持电脑唤醒",
    "Prevent your computer from idle-sleeping while Claude is open so scheduled tasks can run. Your display can still turn off. Closing the laptop lid will still put it to sleep.": "Claude 打开时阻止电脑空闲休眠，让定时任务能运行。屏幕仍可关闭。合上笔记本盖子仍会休眠。",
    "No Chrome instances are connected. Open Chrome with the Claude extension and sign in.": "没有连接的 Chrome 实例。请用带 Claude 扩展的 Chrome 登录。",

    // 设置 - 浏览器
    "Browser Use": "浏览器使用",
    "Allow all browser actions": "允许所有浏览器操作",
    "Claude will browse and interact with any website in Chrome without asking. Applies to new sessions. This setting can put your data at risk.": "Claude 会在 Chrome 中浏览并操作任意网站，不再询问。仅对新会话生效。此设置可能让你的数据面临风险。",
    "Connected browsers": "已连接的浏览器",
    "Chrome instances signed in to your account that Claude can automate.": "已登录你账号、Claude 可自动化操作的 Chrome 实例。",
    "Checking connected browsers…": "正在检查已连接的浏览器……",
    "Recheck": "重新检查",

    // 设置 - 电脑控制
    "Computer use": "电脑控制",
    "Let Claude take screenshots and control your keyboard and mouse in apps you allow.": "允许 Claude 在你许可的应用中截图并控制键鼠。",
    "Unhide apps when Claude finishes": "Claude 完成后取消隐藏应用",
    "Apps hidden during a task are restored when Claude stops.": "任务中被隐藏的应用在 Claude 停止后恢复。",
    "Denied apps": "拒绝的应用",
    "Any request Claude makes to access these apps is automatically rejected. Claude may still affect them indirectly through actions in allowed apps.": "Claude 对这些应用的任何访问请求会被自动拒绝。但 Claude 仍可能通过允许的应用间接影响它们。",
    "Add app": "添加应用",
    "No apps denied. Add an app to automatically reject Claude's requests for it.": "未拒绝任何应用。添加应用以自动拒绝 Claude 对其的请求。",
    "Accessibility": "辅助功能",
    "Not supported": "不支持",
    "Screen recording": "屏幕录制",

    // 项目 / Artifacts
    "New project": "新建项目",
    "Looking to start a project?": "想开始一个项目？",
    "New artifact": "新建 Artifact",
    "Your artifacts": "你的 Artifacts",
    "What will you build with artifacts?": "你想用 Artifacts 构建什么？",
    "If you can dream it, you can build it. Take apps, games, templates, and tools from thought to reality.": "你能想到什么就能造什么。把应用、游戏、模板、工具从想法变成现实。",

    // 插件
    "Plugins": "插件",
    "Skills, connectors, and plugins shape how Claude works with you.": "技能、连接器和插件决定了 Claude 跟你的协作方式。",
    "Connect your apps": "连接你的应用",
    "Let Claude read and write to the tools you already use.": "让 Claude 读写你已经在用的工具。",
    "Teach Claude your processes, team norms, and expertise.": "教 Claude 你的流程、团队规范和专业知识。",

    // 状态
    "New beta": "新 Beta",
    "just now": "刚刚",
    "Desktop app": "桌面应用",
    "Extensions": "扩展",
    "Developer": "开发者",
    "Beta": "Beta",
    "Claude in Chrome": "Chrome 中的 Claude",

    // 主页 / 模型选择
    "Home": "首页",
    "Most capable for ambitious work": "最强大，应对宏大任务",
    "Most efficient for everyday tasks": "最高效，处理日常任务",
    "Fastest for quick answers": "最快，简短回答",
    "Thinks for more complex tasks": "更复杂任务，会思考",
    "Opus consumes usage limits faster than other models": "Opus 比其他模型消耗用量更快",

    // 输入区
    "Press and hold to record": "长按录音",
    "Hold to record": "长按录音",
    "Add files, connectors, and more": "添加文件、连接器等",
    "Add files or photos": "添加文件或图片",
    "Research": "深度研究",
    "Web search": "网络搜索",
    "Use style": "使用风格",
    "Add skill": "添加技能",

    // 项目
    "Start a new project": "新建项目",
    "How to use projects": "如何使用项目",
    "Start by creating a memorable title and description to organize your project. You can always edit it later.": "先建一个好记的标题和描述来组织项目。之后随时能改。",
    "Add connector": "添加连接器",

    // 插件目录
    "Directory": "目录",
    "Anthropic & Partners": "Anthropic 与合作伙伴",
    "Filter by": "筛选",
    "Sort by": "排序",
    "Status": "状态",
    "Installed": "已安装",
    "Not installed": "未安装",
    "Most popular": "最受欢迎",
    "Recently updated": "最近更新",
    "Name A-Z": "名称 A-Z",
    "popular": "受欢迎",
    "New": "新",
    "Trending": "热门",
    "Interactive": "交互式",
    "Community": "社区",
    "No plugins available.": "暂无可用插件。",
    "Type": "类型",
    "Desktop": "桌面",
    "Web": "网页",
    "Category": "类别",
    "Categories": "类别",
    "Communication": "沟通",
    "Data": "数据",
    "Financial services": "金融服务",
    "Health": "健康",
    "Life sciences": "生命科学",
    "Productivity": "生产力",
    // 连接器目录分类筛选标签（前端硬编码显示标签，跟 categories slug 是另一套映射）
    "Commerce & Shopping": "商务与购物",
    "Consumer Health": "消费者健康",
    "Development tools": "开发工具",
    "Education": "教育",
    "Financial Services": "金融服务",
    "Health & Life Sciences": "健康与生命科学",
    "healthcare": "医疗",
    "media": "媒体",
    "Nonprofit": "非营利",
    "Business & Productivity": "商务与效率",
    "Life Sciences": "生命科学",
    "Media & Entertainment": "媒体与娱乐",
    "Technology": "技术",
    "Travel": "旅游",
    "Data & Analytics": "数据与分析",
    "Popular": "受欢迎",
    "Alphabetical": "按字母",
    "Author": "作者",
    "Partners": "合作伙伴",

    // 模式 / 权限
    "Mode": "模式",
    "mode": "模式",
    "Ask permissions": "询问权限",
    "Ask before acting": "操作前询问",
    "Act without asking": "不问直接操作",
    "Act without asking?": "不问直接操作？",
    "Act without asking in Chrome": "Chrome 中不问直接操作",
    "Act without asking is on.": "「不问直接操作」已开启。",
    "Claude pauses so you can approve each action.": "Claude 会暂停，让你逐项批准操作。",
    "Claude works without pausing for approval.": "Claude 不暂停等待批准直接执行。",
    "Claude will work without pausing for approval. This can put your data at risk.": "Claude 会不停顿等待批准直接执行。这可能让你的数据面临风险。",
    "Claude will use your connectors without pausing for approval.": "Claude 会不停顿等待批准直接使用你的连接器。",
    "Claude can browse and act on sites without pausing for approval.": "Claude 可以浏览网站并执行操作，不再询问。",
    "Claude works and uses connectors without pausing for approval.": "Claude 直接执行操作并使用连接器，不再询问。",
    "No connectors are enabled for this session.": "此会话未启用任何连接器。",
    "Yes, continue": "是，继续",
    "Add plugin": "添加插件",
    "The model can't be changed once a session has started. Start a new session to use a different model.": "会话开始后无法切换模型。请新建会话以使用不同模型。",
    "The model can’t be changed once a session has started. Start a new session to use a different model.": "会话开始后无法切换模型。请新建会话以使用不同模型。",
    "Plan mode": "计划模式",
    "Auto mode": "自动模式",
    "Auto Mode": "自动模式",
    "Bypass all permissions?": "跳过所有权限？",
    "You won't be asked again for this workspace. Read our": "此工作区不再询问。阅读我们的",
    "security guide": "安全指南",
    "for details.": "了解详情。",
    "Trust Workspace": "信任此工作区",
    "Trust this workspace?": "信任此工作区？",
    "Claude Code may read, write, or execute files in this directory. Only proceed if you trust this workspace.": "Claude Code 可能读取、写入或执行此目录下的文件。仅在你信任此工作区时继续。",
    "Read our": "阅读我们的",
    "to learn more.": "了解更多。",
    "Enable auto mode?": "启用自动模式？",
    "Claude will decide which actions are safe to run without asking. Longer tasks run uninterrupted, with extra safeguards against prompt injection.": "Claude 自行判断哪些操作安全可执行无需询问。长任务不间断运行，并对提示注入有额外防护。",
    "Enable auto mode": "启用自动模式",

    // 思考强度
    "Effort": "思考强度",
    "Effort change couldn't be applied. You can try again.": "思考强度切换失败，可以重试。",
    "Low": "低",
    "Medium": "中",
    "High": "高",
    "Extra high": "超高",
    "Max": "最高",
    // 模型选择器底标 (· Min/Low/Medium/High/Max 形式，U+00B7 中点，整段精确)
    "· Min": "· 最低",
    "· Low": "· 低",
    "· Medium": "· 中",
    "· High": "· 高",
    "· Extra high": "· 超高",
    "· Max": "· 最高",
    "· Default": "· 默认",
    "· Standard": "· 标准",

    // 上下文 / 用量
    "Context window": "上下文窗口",
    "Plan usage": "套餐用量",
    "5-hour limit": "5 小时限额",
    "Weekly · all models": "每周 · 所有模型",
    "Learn more about usage limits": "了解套餐用量上限",
    "Last updated": "上次更新",
    "Last updated:": "上次更新：",
    "less than a minute ago": "不到一分钟前",
    "Your Sonnet usage counts toward this limit, as well as your weekly and 5-hour session limits": "你的 Sonnet 用量计入此上限，也计入每周和 5 小时会话上限",
    "Claude Design is in research preview with its own weekly limit. Usage here doesn't count toward your other limits.": "Claude Design 处于研究预览阶段，有独立的每周上限。这里的用量不计入其他上限。",
    "Claude Design is in research preview with its own weekly limit. Usage here doesn’t count toward your other limits.": "Claude Design 处于研究预览阶段，有独立的每周上限。这里的用量不计入其他上限。",
    "Loading context breakdown…": "加载上下文分布……",
    "MCP tools (deferred)": "MCP 工具（延迟加载）",
    "MCP tools": "MCP 工具",
    "Autocompact buffer": "自动压缩缓冲区",

    // 设备 / 登出
    "Are you sure you want to log out of all devices?": "确认从所有设备登出？",
    "No browsers connected": "没有连接的浏览器",

    // 底部
    "Claude is AI and can make mistakes. Please double-check responses.": "Claude 是 AI，可能出错。请核对回复。",

    // 对话视图弹窗
    "Normal": "标准",
    "Thinking": "思考",
    "Verbose": "详细",
    "Summary": "摘要",
    "Fork": "分叉",

    // 插入菜单
    "Slash command": "斜杠命令",
    "Slash commands": "斜杠命令",
    "Add folder": "添加文件夹",
    "Open in": "在……中打开",

    // 上下文 / 用量面板（整段精确，避免 React 拆词后翻译走样）
    "System tools": "系统工具",
    "System tools (deferred)": "系统工具（延迟加载）",
    "Custom agents": "自定义 agents",
    "Memory files": "记忆文件",
    "memory files": "记忆文件",
    "Free space": "空闲空间",
    "Weekly": "每周",
    "(deferred)": "（延迟加载）",

    // 类别 / 角色
    "connectors": "连接器",
    "plugins": "插件",

    // 工作区 / 会话
    "No active sessions.": "没有活跃的会话。",
    "Trust this workspace?": "信任此工作区？",
    "for more information.": "了解更多。",
    "Invalid session description provided": "会话描述无效",
    "Working folders": "工作文件夹",
    "Folder instructions": "文件夹指令",
    "Use this to give Claude instructions for working in this folder.": "在这里给 Claude 写在此文件夹中工作的指令。",
    "Context": "上下文",
    "Progress": "进度",
    "See task progress for longer tasks.": "查看长任务的进度。",
    "Instructions": "指令",
    "Customer not found.": "未找到客户。",
    "This file type cannot be opened.": "此类文件无法打开。",
    "Failed to start Claude's workspace": "Claude 工作区启动失败",
    "Failed to start Claude’s workspace": "Claude 工作区启动失败",
    "RPC pipe closed": "RPC 管道已关闭",
    "Restarting Claude or your computer sometimes resolves this. If it persists, you can reinstall the workspace.": "重启 Claude 或电脑有时能解决这个。如果一直这样，你可以重装工作区。",
    "reinstall the workspace": "重装工作区",
    "reinstall the workspace.": "重装工作区。",
    // 删除确认对话框
    "Delete chat": "删除对话",
    "Delete chat?": "删除对话？",
    "Are you sure you want to delete this chat?": "确定要删除此对话吗？",
    "Delete task": "删除任务",
    "Delete task?": "删除任务？",
    "This task will be permanently deleted from your computer and Anthropic's servers, and can't be undone.": "此任务将从你的电脑和 Anthropic 服务器永久删除，无法撤销。",
    "This task will be permanently deleted from your computer and Anthropic’s servers, and can’t be undone.": "此任务将从你的电脑和 Anthropic 服务器永久删除，无法撤销。",
    // Tasks 列表
    "Tasks": "任务",
    "Archived": "已归档",
    "Move to a project": "移到项目",
    "Move conversation to a project": "把对话移到项目",
    "Select a project to move this task into.": "选择要把此任务移到的项目。",
    // 反馈
    "Give positive feedback": "提交正面反馈",
    "Give negative feedback": "提交负面反馈",
    "Please provide details: (optional)": "请提供详情：（可选）",
    "What was satisfying about this response?": "这条回复哪里令你满意？",
    "What was unsatisfying about this response?": "这条回复哪里不满意？",
    "Submitting this report will send the entire current conversation to Anthropic for future improvements to our models.": "提交此报告会把当前完整对话发送给 Anthropic 用于改进我们的模型。",
    "Learn more": "了解更多",

    // 状态 / 操作中
    "Searched web": "搜索了网页",
    "the web": "网页",
    "Processing image": "处理图片中",
    "Setting up preview": "设置预览中",
    "Set up": "设置",
    "Match system": "跟随系统",
    "a tool": "一个工具",
    "Background shell started": "后台 shell 已启动",
    "Background shell completed": "后台 shell 已完成",

    // 对话列表
    "Mark as unread": "标为未读",
    // 右键菜单：Mark as read 缺条目 → read 被 partial 翻成 "读取了"；Copy link 同理留 "link"
    "Mark as read": "标为已读",
    "Copy link": "复制链接",
    "Last activity": "最后活动",
    "Group by": "分组方式",
    "All projects": "所有项目",
    "Transcript view": "对话视图",
    "Transcript view mode": "对话视图模式",

    // Dispatch / 控电脑
    "Get ready to dispatch": "准备 Dispatch",
    "Keep this computer awake": "保持此电脑唤醒",
    "Let Claude control your computer": "让 Claude 控制你的电脑",
    "Allows Claude to click, type, and open apps.": "允许 Claude 点击、输入和打开应用。",
    "All connectors are on": "所有连接器已开启",
    "Finish setup": "完成设置",
    "Install": "安装",
    "Uninstall": "卸载",

    // 对话历史
    "Chats": "对话",
    "Shared": "已分享",
    "Filter chats": "筛选对话",
    "Mon": "周一",
    "Tue": "周二",
    "Wed": "周三",
    "Thu": "周四",
    "Fri": "周五",
    "Sat": "周六",
    "Sun": "周日",

    // git / 任务状态
    "Ran agent": "运行了 agent",
    "Asked": "询问了",
    "Proposed plan": "提出的计划",
    "todos": "待办",
    "used": "使用了",
    "updated": "更新了",

    // 插件管理
    "Personal plugins": "个人插件",
    "Give Claude role-level expertise with plugins": "用插件给 Claude 赋予角色级专业能力",
    "Add pre-built knowledge for your field.": "为你的领域添加预建知识。",
    "Description": "描述",
    "License": "授权",
    "Purpose": "用途",
    "Ask for their choice": "询问他们的选择",
    "Wait for selection": "等待选择",
    "Themes Available": "可用主题",
    "Theme Details": "主题详情",
    "Application Process": "应用流程",

    // 插件目录分类
    "automation": "自动化",
    "database": "数据库",
    "deployment": "部署",
    "design": "设计",
    "development": "开发",
    "learning": "学习",
    "location": "位置",
    "math": "数学",
    "monitoring": "监控",
    "productivity": "生产力",
    "security": "安全",
    "testing": "测试",

    // === 用量上限警告 / 加购升级弹窗 ===
    "Usage limit reached": "用量已达上限",
    "usage limit reached": "用量已达上限",
    "Need more usage?": "需要更多用量？",
    "Need more usage": "需要更多用量",
    "more usage": "更多用量",
    "Starts when a message is sent": "发送消息后开始",
    "You've reached your plan's limit. To keep working before it resets:": "你已达到套餐上限。在重置前要继续使用：",
    "You’ve reached your plan’s limit. To keep working before it resets:": "你已达到套餐上限。在重置前要继续使用：",
    "You've reached your plan's limit": "你已达到套餐上限",
    "You’ve reached your plan’s limit": "你已达到套餐上限",
    "To keep working before it resets:": "在重置前要继续使用：",
    "To keep working before it resets": "在重置前要继续使用",
    "Continue without interruption": "不间断继续使用",
    "without interruption": "不间断",
    "Pay only for what you use": "用多少付多少",
    "Control costs with spend limits": "用消费上限控制成本",
    "Track usage in real time": "实时跟踪用量",
    "Works with Claude.ai and Claude Code": "兼容 Claude.ai 和 Claude Code",
    "Auto-reload when balance runs low": "余额不足时自动充值",
    "Get extra usage": "获取额外用量",
    "extra usage": "额外用量",
    "additional usage": "额外用量",
    "No, thanks": "不用了，谢谢",

    // === "Claude never loses the thread" past chats 推介弹窗 ===
    "Claude never loses the thread": "Claude 不会丢失对话脉络",
    "never loses the thread": "不会丢失对话脉络",
    "Now Claude can reference past chats for relevant context.": "Claude 现在可以引用过往对话作为相关上下文。",
    "Now Claude can reference past chats for relevant context": "Claude 现在可以引用过往对话作为相关上下文",
    "reference past chats for relevant context": "引用过往对话作为相关上下文",
    "reference past chats": "引用过往对话",
    "past chats": "过往对话",
    "Hey Claude": "你好 Claude",
    "Back from PTO... where did I leave off?": "刚休假回来…我之前做到哪了？",
    "Back from PTO… where did I leave off?": "刚休假回来…我之前做到哪了？",
    "Back from PTO...": "刚休假回来…",
    "Back from PTO…": "刚休假回来…",
    "Back from PTO": "刚休假回来",
    "where did I leave off?": "我之前做到哪了？",
    "where did I leave off": "我之前做到哪了",
    "Try now": "立即试用",
    "Referencing past chats...": "正在引用过往对话…",
    "Referencing past chats…": "正在引用过往对话…",
    "Referencing past chats": "正在引用过往对话",

    // === 添加付款方式弹窗 ===
    "Add a payment method": "添加付款方式",
    "Add payment method": "添加付款方式",
    "a payment method": "付款方式",
    "payment method": "付款方式",
    "Your subscription is billed through Google. To keep using Claude when you hit a limit, add a payment method.": "你的订阅通过 Google 计费。达到上限后想继续使用 Claude，请添加付款方式。",
    "Your subscription is billed through Google.": "你的订阅通过 Google 计费。",
    "Your subscription is billed through Google": "你的订阅通过 Google 计费",
    "To keep using Claude when you hit a limit, add a payment method.": "达到上限后想继续使用 Claude，请添加付款方式。",
    "To keep using Claude when you hit a limit, add a payment method": "达到上限后想继续使用 Claude，请添加付款方式",
    "Your card won't be charged unless you choose to purchase additional usage.": "除非你选择购买额外用量，否则不会扣费。",
    "Your card won’t be charged unless you choose to purchase additional usage.": "除非你选择购买额外用量，否则不会扣费。",
    "Your card won't be charged unless you choose to purchase additional usage": "除非你选择购买额外用量，否则不会扣费",
    "Your card won’t be charged unless you choose to purchase additional usage": "除非你选择购买额外用量，否则不会扣费",
    "Country or region": "国家或地区",
    "United States": "美国",
    // 语言选择器项含 "United States" 子串, 会被上面那条 partial 拆成 "English (美国)";
    // 映射到自身让 exact 先命中, 保持原生 (账单页裸 "United States" 仍→美国)
    "English (United States)": "English (United States)",
    "Address": "地址",
    "Card number": "卡号",
    "Expiration date": "有效期",
    "Security code": "安全码",

    // === Claude for Windows 启动 / onboarding 页 ===
    "Claude for Windows": "Windows 版 Claude",
    "The fastest way to talk with Claude": "与 Claude 对话最快的方式",
    "fastest way to talk with Claude": "与 Claude 对话最快的方式",
    "Get started": "开始使用",

    // === 登录页 (Sign In) ===
    "Sign In": "登录",
    "Continue with Google": "用 Google 登录",
    "Continue with Apple": "用 Apple 登录",
    "Continue with email": "用邮箱登录",
    // 半翻兜底: React 拆词后单独 textNode 是 "with Google" / "with email" 时仍能渲染出"用 X 登录"
    "with Google": "用 Google 登录",
    "with email": "用邮箱登录",
    "with Apple": "用 Apple 登录",
    "Enter your email": "输入你的邮箱",
    "Last used": "上次使用",
    "Sign out": "退出登录",
    "OR": "或",
    "By continuing, you acknowledge Anthropic's privacy policy and agree to get occasional promotional emails and notifications.": "继续即表示你同意 Anthropic 的隐私政策，并接收偶发的推广邮件与通知。",
    "By continuing, you acknowledge Anthropic’s privacy policy and agree to get occasional promotional emails and notifications.": "继续即表示你同意 Anthropic 的隐私政策，并接收偶发的推广邮件与通知。",
    "By continuing, you acknowledge Anthropic's privacy policy": "继续即表示你同意 Anthropic 的隐私政策",
    "By continuing, you acknowledge Anthropic’s privacy policy": "继续即表示你同意 Anthropic 的隐私政策",
    "By continuing, you acknowledge Anthropic's": "继续即表示你同意 Anthropic 的",
    "By continuing, you acknowledge Anthropic’s": "继续即表示你同意 Anthropic 的",
    "By continuing, you acknowledge": "继续即表示你同意",
    "and agree to get occasional promotional emails and notifications.": "并接收偶发的推广邮件与通知。",
    "and agree to get occasional promotional emails and notifications": "并接收偶发的推广邮件与通知",
    "agree to get occasional promotional emails and notifications": "同意接收偶发的推广邮件与通知",
    "occasional promotional emails and notifications": "偶发的推广邮件与通知",
    "promotional emails and notifications": "推广邮件与通知",
    "promotional emails": "推广邮件",
    "and notifications": "和通知",
    "privacy policy": "隐私政策",
    "Privacy policy": "隐私政策",
    "Privacy Policy": "隐私政策",

    // === 桌面快捷键 onboarding 第二屏 ===
    "Show in menu bar": "在菜单栏显示",
    // 半翻兜底: 单独 textNode 是 "in menu bar" 时
    "in menu bar": "在菜单栏显示",
    "menu bar": "菜单栏",

    // === 文件 / 编辑器右键菜单 ===
    "Attach as context": "作为上下文附加",
    "Copy file contents": "复制文件内容",
    "Copy file content": "复制文件内容",
    "file contents": "文件内容",
    "file content": "文件内容",
    "Copy path": "复制路径",
    "Copy full path": "复制完整路径",
    "Copy relative path": "复制相对路径",
    "path": "路径",
    "Show in Explorer": "在资源管理器中显示",
    "in Explorer": "在资源管理器中显示",
    "Show in Finder": "在 Finder 中显示",
    "in Finder": "在 Finder 中显示",
    "Reveal in Finder": "在 Finder 中显示",
    "Reveal in Explorer": "在资源管理器中显示",

    // === 消息回退警告 toast ===
    "Can't rewind to this message.": "无法回退到这条消息。",
    "Can’t rewind to this message.": "无法回退到这条消息。",
    "Can't rewind to this message": "无法回退到这条消息",
    "Can’t rewind to this message": "无法回退到这条消息",
    "rewind to this message": "回退到这条消息",
    "Rewind to this message": "回退到这条消息",
    "rewind": "回退",
    "Rewind": "回退",

    // === 创建 skill 菜单 (skill 词保留英文 — 是 Claude Skills 专有名词) ===
    "Create skill": "创建 skill",
    "Create a skill": "创建 skill",
    "Create with Claude": "用 Claude 创建",
    // 半翻兜底: 单独 textNode 是 "with Claude" 时 (创建 with Claude → 创建 用 Claude)
    "with Claude": "用 Claude",
    "Write skill instructions": "编写 skill 指令",
    "Write instructions": "编写指令",
    "skill instructions": "skill 指令",
    "Upload a skill": "上传 skill",
    "Upload skill": "上传 skill",
    "a skill": "skill",

    // === 创建 skill 表单 (写作 skill instructions 弹窗) ===
    "Skill name": "skill 名称",
    "instructions": "指令",
    "Generate weekly status reports from recent work. Use when asked for updates or progress summaries.": "从最近的工作生成周报。当被问及进度或更新时使用。",
    "Generate weekly status reports from recent work.": "从最近的工作生成周报。",
    "Generate weekly status reports from recent work": "从最近的工作生成周报",
    "Use when asked for updates or progress summaries.": "当被问及进度或更新时使用。",
    "Use when asked for updates or progress summaries": "当被问及进度或更新时使用",
    "Summarize my recent work in three sections: wins, blockers, and next steps. Keep the tone professional but not stiff...": "把我最近的工作总结成三部分：成果、阻碍、下一步。语气专业但不要僵硬…",
    "Summarize my recent work in three sections: wins, blockers, and next steps. Keep the tone professional but not stiff…": "把我最近的工作总结成三部分：成果、阻碍、下一步。语气专业但不要僵硬…",
    "Summarize my recent work in three sections: wins, blockers, and next steps.": "把我最近的工作总结成三部分：成果、阻碍、下一步。",
    "Keep the tone professional but not stiff...": "语气专业但不要僵硬…",
    "Keep the tone professional but not stiff…": "语气专业但不要僵硬…",
    "Keep the tone professional but not stiff": "语气专业但不要僵硬",
    "wins, blockers, and next steps": "成果、阻碍、下一步",

    // === 上传 skill 弹窗 ===
    "Drag and drop or click to upload": "拖放或点击上传",
    "Drag and drop": "拖放",
    "or click to upload": "或点击上传",
    "click to upload": "点击上传",
    "File requirements": "文件要求",
    "requirements": "要求",
    ".md file must contain skill name and description formatted in YAML": ".md 文件必须包含 skill 名称和描述，YAML 格式",
    "must contain skill name and description formatted in YAML": "必须包含 skill 名称和描述，YAML 格式",
    "skill name and description formatted in YAML": "skill 名称和描述，YAML 格式",
    ".zip or .skill file must include a SKILL.md file": ".zip 或 .skill 文件必须包含一个 SKILL.md 文件",
    "must include a SKILL.md file": "必须包含一个 SKILL.md 文件",
    "Read more about creating skills or see an example": "了解如何创建 skill，或查看示例",
    "Read more about creating skills": "了解如何创建 skill",
    "creating skills": "创建 skill",
    "see an example": "查看示例",
    "or see an example": "或查看示例",

    // === 模型选择器: 旧版 Model 半翻兜底 ===
    "Legacy Model": "旧版模型",
    "Legacy model": "旧版模型",
    "Model": "模型",

    // === Cowork 主输入框 hint ===
    "Ctrl Enter to start a task and keep going": "Ctrl Enter 开始任务并继续",
    "to start a task and keep going": "开始任务并继续",
    "start a task and keep going": "开始任务并继续",
    "to start a task": "开始任务",
    "and keep going": "并继续",

    // === Edit with Claude (with Claude 兜底已加，此处加整段) ===
    "Edit with Claude": "用 Claude 编辑",

    // === skill 编辑 / 卸载 (Edit/Uninstall 系列) ===
    "Edit skill instructions": "编辑 skill 指令",
    "Edit instructions": "编辑指令",
    "Uninstall skill": "卸载 skill",
    "Uninstall skill?": "卸载 skill?",
    "Uninstall a skill": "卸载 skill",
    "Uninstall a skill?": "卸载 skill?",
    "You can always add this skill again later by re-uploading it.": "之后随时可以通过重新上传添加回这个 skill。",
    "You can always add this skill again later by re-uploading it": "之后随时可以通过重新上传添加回这个 skill",
    "add this skill again later by re-uploading it": "通过重新上传添加回这个 skill",
    "by re-uploading it": "通过重新上传",
    "re-uploading it": "重新上传",
    "re-uploading": "重新上传",

    // === system prompt 文档按钮 ===
    "Review system prompt documentation": "查看系统提示词文档",
    "Review system prompt": "查看系统提示词",
    "system prompt documentation": "系统提示词文档",
    "system prompt": "系统提示词",
    "documentation": "文档",

    // === 上下文面板 ===
    "Track tools and referenced files used in this task.": "跟踪此任务中使用的工具和引用的文件。",
    "Track tools and referenced files used in this task": "跟踪此任务中使用的工具和引用的文件",
    "tools and referenced files used in this task": "此任务中使用的工具和引用的文件",
    "referenced files used in this task": "此任务中引用的文件",
    "used in this task": "在此任务中使用",
    "referenced files": "引用的文件",

    // === 模型选择器: Sonnet/Haiku 简介 ===
    "Responsive everyday work": "日常应用响应迅速",
    "Fastest, most efficient": "速度最快，最高效",

    // === 输入框 / 搜索框 placeholder (普通 input 走 translateAttributes) ===
    "Write a message…": "写一条消息…",
    "Write a message...": "写一条消息...",
    "Write a message": "写一条消息",
    "Search plugins…": "搜索插件…",
    "Search plugins...": "搜索插件...",
    "Search plugins": "搜索插件",
    "Search connectors…": "搜索连接器…",
    "Search connectors...": "搜索连接器...",
    "Search connectors": "搜索连接器",
    "Search skills…": "搜索 skill…",
    "Search skills...": "搜索 skill...",
    "Search skills": "搜索 skill",

    // === 主页快捷提示词分类弹窗 (写作 / 学习 / Code / 生活 / Claude 推荐) ===
    // 写作分类
    "Create blog article series": "创建博客系列文章",
    "blog article series": "博客系列文章",
    "Create engaging headlines": "创建吸引眼球的标题",
    "engaging headlines": "吸引眼球的标题",
    "Help me develop my unique voice as a writer": "帮我打造作为写作者的独特风格",
    "develop my unique voice as a writer": "打造作为写作者的独特风格",
    "my unique voice as a writer": "我作为写作者的独特风格",
    "unique voice as a writer": "作为写作者的独特风格",

    // 学习分类
    "Develop learning frameworks": "建立学习框架",
    "learning frameworks": "学习框架",
    "frameworks": "框架",
    "Find the best books on a subject": "查找某主题的最佳书籍",
    "best books on a subject": "某主题的最佳书籍",
    "Develop learning objectives": "制定学习目标",
    "learning objectives": "学习目标",
    "objectives": "目标",
    "Create a study plan": "制定学习计划",
    "a study plan": "学习计划",
    "study plan": "学习计划",
    "Provide evidence-based insights for my topic": "为我的主题提供基于证据的见解",
    "evidence-based insights for my topic": "基于证据的见解，针对我的主题",
    "evidence-based insights": "基于证据的见解",

    // Code 分类
    // 注: 这里 "Code": "代码" 是首页提示分类 (跟 写作/学习/生活 齐整，必须翻)。
    //     它会全局覆盖 line 620 的 "Code": "Code", 但 Cowork "Chat"/"Code" 模式切换 pill
    //     已被 df-pill 跳过规则保护 (见 SKIP_CLASSES), 所以 pill 仍显示英文 "Code", 不冲突。
    "Code": "代码",
    "Develop algorithm solutions": "开发算法方案",
    "algorithm solutions": "算法方案",
    "Quiz me on python code": "用 Python 代码考考我",
    "Quiz me on Python code": "用 Python 代码考考我",
    "Quiz me on": "考考我",

    // 生活分类
    "Roleplay difficult conversations I need to prepare for": "角色扮演我需要准备的难谈话",
    "difficult conversations I need to prepare for": "我需要准备的难谈话",
    "difficult conversations": "难谈话",
    "Organize digital files": "整理数字文件",
    "digital files": "数字文件",

    // Claude 推荐分类
    "Discuss future technologies": "讨论未来技术",
    "future technologies": "未来技术",
    "Learn something unexpected": "学点意想不到的东西",
    "something unexpected": "意想不到的东西",

    // === 主页快捷提示词分类 (二批) ===
    // 写作
    "Draft email newsletters": "起草邮件简报",
    "email newsletters": "邮件简报",
    "Write speech drafts": "写演讲稿",
    "speech drafts": "演讲稿",

    // 学习
    "Compare learning resources": "对比学习资源",
    "learning resources": "学习资源",
    "Design a lesson or curriculum": "设计一节课或一门课程",
    "a lesson or curriculum": "一节课或一门课程",
    "lesson or curriculum": "课程",
    "Summarize my academic papers": "总结我的学术论文",
    "academic papers": "学术论文",

    // 代码
    "Develop code reviews to speed me up": "搭一套代码评审帮我提速",
    "code reviews to speed me up": "代码评审帮我提速",
    "code reviews": "代码评审",

    // 生活
    "Transform my personal goals into an actionable plan": "把我的个人目标变成可执行计划",
    "personal goals into an actionable plan": "个人目标变成可执行计划",
    "personal goals": "个人目标",
    "actionable plan": "可执行计划",
    "Handle difficult conversations": "处理难谈话",

    // Claude 推荐
    "Consider innovation patterns": "思考创新模式",
    "innovation patterns": "创新模式",

    // === 主页快捷提示词分类 (三批) ===
    // 写作
    "Write executive summaries": "写执行摘要",
    "executive summaries": "执行摘要",
    "Write case studies": "写案例研究",
    "case studies": "案例研究",

    // 学习
    "Find credible sources for my research": "为我的研究找可靠资料来源",
    "credible sources for my research": "可靠资料来源，针对我的研究",
    "credible sources": "可靠资料来源",
    "Create effective flashcards": "做有效的记忆卡",
    "effective flashcards": "有效的记忆卡",
    "flashcards": "记忆卡",
    "Create learning timelines": "做学习时间线",
    "learning timelines": "学习时间线",
    "timelines": "时间线",

    // 生活
    "Create a workflow for a goal": "为某个目标设计工作流",
    "a workflow for a goal": "为某个目标设计工作流",
    "workflow for a goal": "为目标设计的工作流",
    "for a goal": "为某个目标",
    "Build better relationships": "经营更好的人际关系",
    "better relationships": "更好的人际关系",

    // === 主页快捷提示词分类 (四批) ===
    // 写作
    "Develop brand voice guides": "制定品牌语调指南",
    "brand voice guides": "品牌语调指南",
    "brand voice": "品牌语调",

    // 学习
    "Develop a learning framework based on my personal heroes": "根据我心目中的偶像建立学习框架",
    "a learning framework based on my personal heroes": "根据我心目中的偶像建立学习框架",
    "learning framework based on my personal heroes": "基于我心目中偶像的学习框架",
    "learning framework": "学习框架",
    "based on my personal heroes": "基于我心目中的偶像",
    "my personal heroes": "我心目中的偶像",
    "personal heroes": "心目中的偶像",
    "Create feedback for student work": "为学生作业生成反馈",
    "feedback for student work": "学生作业反馈",
    "student work": "学生作业",

    // 代码
    "Develop technical debt analysis": "做技术债务分析",
    "technical debt analysis": "技术债务分析",
    "technical debt": "技术债务",
    "Explain a programming concept": "解释一个编程概念",
    "a programming concept": "一个编程概念",
    "programming concept": "编程概念",

    // Claude 推荐
    "Explore language evolution": "探索语言演化",
    "language evolution": "语言演化",
    "Have a philosophical discussion": "进行一场哲学讨论",
    "a philosophical discussion": "一场哲学讨论",
    "philosophical discussion": "哲学讨论",
    "Analyze decision-making frameworks": "分析决策框架",
    "decision-making frameworks": "决策框架",
    "decision-making": "决策",

    // === 主页快捷提示词分类 (五批) ===
    // 学习
    "Develop reflection exercises": "设计反思练习",
    "reflection exercises": "反思练习",
    "Develop discussion prompts": "设计讨论引导",
    "discussion prompts": "讨论引导",

    // 代码
    "Assess my approach to debugging problems": "评估我调试问题的方法",
    "my approach to debugging problems": "我调试问题的方法",
    "approach to debugging problems": "调试问题的方法",
    "debugging problems": "调试问题",

    // 生活
    "Improve communication skills": "提升沟通能力",
    "communication skills": "沟通能力",
    "Create a morning workflow": "建立晨间工作流",
    "Create morning workflow": "建立晨间工作流",
    "a morning workflow": "晨间工作流",
    "morning workflow": "晨间工作流",
    "morning": "晨间",

    // === 主页快捷提示词分类 (六批) ===
    // 写作
    "Develop content templates": "做内容模板",
    "content templates": "内容模板",

    // 学习
    "Design learning challenges": "设计学习挑战",
    "learning challenges": "学习挑战",
    "challenges": "挑战",

    // 代码
    "Develop project estimates": "做项目估算",
    "project estimates": "项目估算",
    "estimates": "估算",

    // 生活
    "Manage personal stress": "管理个人压力",
    "personal stress": "个人压力",
    "stress": "压力",

    // Claude 推荐
    "Investigate scientific mysteries": "探究科学谜题",
    "scientific mysteries": "科学谜题",
    "mysteries": "谜题",
    "Explore cognitive biases": "探索认知偏差",
    "cognitive biases": "认知偏差",
    "biases": "偏差",

    // === 设置页: Pull requests ===
    "Pull requests": "拉取请求",
    "Pull request": "拉取请求",
    "pull request": "拉取请求",
    "When Claude pushes changes to a branch, it automatically opens a pull request without asking first. Applies to remote sessions only.": "Claude 推送变更到分支后，自动开拉取请求，无需先询问。仅适用于远程会话。",
    "When Claude pushes changes to a branch, it automatically opens a pull request without asking first.": "Claude 推送变更到分支后，自动开拉取请求，无需先询问。",
    "When Claude pushes changes to a branch, it automatically opens a pull request without asking first": "Claude 推送变更到分支后，自动开拉取请求，无需先询问",
    "Applies to remote sessions only.": "仅适用于远程会话。",
    "Applies to remote sessions only": "仅适用于远程会话",
    "remote sessions only": "仅远程会话",
    "remote sessions": "远程会话",

    // === 设置页: Code permission requests ===
    "Code permission requests": "代码权限请求",
    "permission requests": "权限请求",
    "Get a push notification when Claude needs your approval to run a command in a Code session.": "Claude 在代码会话中需要你批准执行命令时，推送通知给你。",
    "Get a push notification when Claude needs your approval to run a command in a Code session": "Claude 在代码会话中需要你批准执行命令时，推送通知给你",
    "Get a push notification when Claude needs your approval": "需要你批准时推送通知给你",
    "push notification": "推送通知",
    "a Code session": "代码会话",
    "Code session": "代码会话",

    // === 设置页: 给 Claude 的指令 placeholder (轮播示例文本) ===
    "e.g. ask clarifying questions before giving detailed answers": "例如：给详细回答前先问清楚",
    "e.g. I primarily code in Python (not a coding beginner)": "例如：我主要写 Python (不是编程新手)",
    "e.g. when learning new concepts, I find analogies particularly helpful": "例如：学新概念时，我觉得类比特别有用",

    // === 主页快捷提示词分类 (七批) ===
    // 写作
    "Develop character profiles": "构思角色设定",
    "character profiles": "角色设定",

    // 学习
    "Help me make sense of these ideas": "帮我理清这些想法",
    "make sense of these ideas": "理清这些想法",
    "these ideas": "这些想法",
    "Explain a complex topic simply": "用简单的话解释复杂主题",
    "a complex topic simply": "简单解释一个复杂主题",
    "complex topic simply": "简单解释复杂主题",
    "complex topic": "复杂主题",

    // 代码
    "Design data structures": "设计数据结构",
    "data structures": "数据结构",
    "Develop CI/CD pipelines": "搭建 CI/CD 流水线",
    "CI/CD pipelines": "CI/CD 流水线",
    "pipelines": "流水线",

    // 生活
    "Develop self-care practices": "建立自我关怀习惯",
    "self-care practices": "自我关怀习惯",
    "self-care": "自我关怀",

    // === 主页快捷提示词分类 (八批) ===
    // 写作
    "Create FAQ resources": "建一份 FAQ 资源",
    "FAQ resources": "FAQ 资源",
    "Compare my writing style to famous authors": "把我的写作风格与著名作家对比",
    "my writing style to famous authors": "我的写作风格与著名作家对比",
    "writing style to famous authors": "写作风格与著名作家对比",
    "famous authors": "著名作家",

    // 学习
    "Create a knowledge map that reveals surprising patterns in what I know": "做一张知识地图，揭示我已知内容里意想不到的规律",
    "a knowledge map that reveals surprising patterns in what I know": "一张知识地图，揭示我已知内容里意想不到的规律",
    "knowledge map that reveals surprising patterns in what I know": "知识地图，揭示我已知内容里意想不到的规律",
    "knowledge map": "知识地图",
    "surprising patterns in what I know": "我已知内容里意想不到的规律",
    "surprising patterns": "意想不到的规律",
    "Design learning modules": "设计学习模块",
    "learning modules": "学习模块",
    "modules": "模块",
    "Develop a learning approach that embraces beautiful contradictions": "建立一套拥抱美丽矛盾的学习方法",
    "a learning approach that embraces beautiful contradictions": "一套拥抱美丽矛盾的学习方法",
    "learning approach that embraces beautiful contradictions": "拥抱美丽矛盾的学习方法",
    "learning approach": "学习方法",
    "embraces beautiful contradictions": "拥抱美丽矛盾",
    "beautiful contradictions": "美丽的矛盾",

    // 代码
    "Create refactoring plans": "做重构计划",
    "refactoring plans": "重构计划",
    "refactoring": "重构",

    // 生活
    "Develop personal hobbies": "培养个人爱好",
    "personal hobbies": "个人爱好",
    "hobbies": "爱好",

    // Claude 推荐
    "Create a fictional scenario": "构造一个虚构场景",
    "a fictional scenario": "一个虚构场景",
    "fictional scenario": "虚构场景",
    "Discuss musical innovations": "讨论音乐创新",
    "musical innovations": "音乐创新",

    // === 主页快捷提示词分类 (九批) ===
    // 学习
    "Create good lecture notes": "做高质量讲义笔记",
    "good lecture notes": "高质量讲义笔记",
    "lecture notes": "讲义笔记",

    // 代码
    "Design logging systems": "设计日志系统",
    "logging systems": "日志系统",

    // 生活
    "Develop parenting strategies": "建立育儿策略",
    "parenting strategies": "育儿策略",
    "parenting": "育儿",

    // Claude 推荐
    "Explore a fascinating concept": "探索一个迷人概念",
    "a fascinating concept": "一个迷人概念",
    "fascinating concept": "迷人概念",

    // === 字号选择 tooltip (Small/Medium/Large text) ===
    "Small text": "小号字",
    "Medium text": "中号字",
    "Large text": "大号字",
    // 半翻兜底: "Medium" 已有 (line 1157, "中"), 这里加 "Small" / "Large" 单独 + " text" 后缀
    "Small": "小",
    "Large": "大",

    // === Filter files placeholder (省略号 U+2026 变体) ===
    "Filter files… (?text to search contents)": "筛选文件… (?text 搜索内容)",

    // === 主页快捷提示词分类 (十批) ===
    // 学习
    "Develop teaching strategies": "建立教学策略",
    "teaching strategies": "教学策略",

    // 代码
    "Help me turn a screenshot into working code": "帮我把截图变成可运行的代码",
    "turn a screenshot into working code": "把截图变成可运行的代码",
    "a screenshot into working code": "截图变成可运行的代码",
    "working code": "可运行的代码",
    "Design microservices": "设计微服务",
    "microservices": "微服务",
    "Look over my code and give me tips": "看看我的代码给我建议",
    "my code and give me tips": "我的代码给我建议",
    "give me tips": "给我建议",

    // 生活
    "Plan retirement activities": "规划退休活动",
    "retirement activities": "退休活动",
    "retirement": "退休",

    // === 设置页: Chrome 中的 Claude ===
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop. Once enabled, browser tools are always available to Claude. Only grant full permissions for trusted sites. See more": "Chrome 中的 Claude 允许 Claude 通过 Claude Desktop 在浏览器中处理任务。启用后，浏览器工具对 Claude 始终可用。仅对可信网站授予完整权限。了解更多",
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop.": "Chrome 中的 Claude 允许 Claude 通过 Claude Desktop 在浏览器中处理任务。",
    "Claude in Chrome lets Claude handle work in the browser via Claude Desktop": "Chrome 中的 Claude 允许 Claude 通过 Claude Desktop 在浏览器中处理任务",
    "Once enabled, browser tools are always available to Claude.": "启用后，浏览器工具对 Claude 始终可用。",
    "Once enabled, browser tools are always available to Claude": "启用后，浏览器工具对 Claude 始终可用",
    "browser tools are always available to Claude": "浏览器工具对 Claude 始终可用",
    "browser tools are always available": "浏览器工具始终可用",
    "Only grant full permissions for trusted sites.": "仅对可信网站授予完整权限。",
    "Only grant full permissions for trusted sites": "仅对可信网站授予完整权限",
    "grant full permissions for trusted sites": "对可信网站授予完整权限",
    "trusted sites": "可信网站",
    "See more": "了解更多",

    // === 主页快捷提示词分类 (十一批) ===
    // 写作
    "Write compelling CTAs": "写吸引人的 CTA",
    "compelling CTAs": "吸引人的 CTA",
    "CTAs": "CTA",
    "compelling": "吸引人的",
    "Create technical explanations": "做技术说明",
    "technical explanations": "技术说明",

    // 学习
    "Design learning portfolios": "设计学习作品集",
    "learning portfolios": "学习作品集",
    "portfolios": "作品集",

    // 代码
    "Tell me what programming paradigm suits my thinking style": "告诉我哪种编程范式适合我的思维方式",
    "what programming paradigm suits my thinking style": "哪种编程范式适合我的思维方式",
    "programming paradigm suits my thinking style": "编程范式适合我的思维方式",
    "programming paradigm": "编程范式",
    "my thinking style": "我的思维方式",
    "thinking style": "思维方式",

    // 生活
    "Create cleaning workflow": "建立清洁工作流",
    "Create a cleaning workflow": "建立清洁工作流",
    "a cleaning workflow": "清洁工作流",
    "cleaning workflow": "清洁工作流",
    "cleaning": "清洁",
    "Explore productivity systems": "探索生产力系统",
    "productivity systems": "生产力系统",
    "systems": "系统",
    "Track personal goals": "跟踪个人目标",
    "Track": "跟踪",

    // Claude 推荐
    "Analyze game theory applications": "分析博弈论应用",
    "game theory applications": "博弈论应用",
    "game theory": "博弈论",
    "Explore memory techniques": "探索记忆方法",
    "memory techniques": "记忆方法",

    // === 主页快捷提示词分类 (十二批) ===
    // 学习
    "Develop concept maps": "做概念图",
    "concept maps": "概念图",
    "Design learning journals": "设计学习日志",
    "learning journals": "学习日志",
    "journals": "日志",
    "Transform a dry subject into something fascinating": "把枯燥的话题变得引人入胜",
    "a dry subject into something fascinating": "把枯燥的话题变得引人入胜",
    "dry subject into something fascinating": "枯燥话题变得引人入胜",
    "dry subject": "枯燥话题",
    "into something fascinating": "变得引人入胜",
    "fascinating": "引人入胜",

    // 生活
    "Manage my time better": "更好地管理我的时间",
    "my time better": "更好地管理我的时间",

    // 代码
    "Create monitoring solutions": "做监控方案",
    "monitoring solutions": "监控方案",
    "solutions": "方案",
    "Challenge me with increasingly difficult coding puzzles": "用越来越难的编程谜题挑战我",
    "Challenge me with increasingly difficult coding puzzles.": "用越来越难的编程谜题挑战我。",
    "increasingly difficult coding puzzles": "越来越难的编程谜题",
    "difficult coding puzzles": "难的编程谜题",
    "coding puzzles": "编程谜题",
    "puzzles": "谜题",
    "Develop integration strategies": "建立集成策略",
    "integration strategies": "集成策略",

    // === 主页快捷提示词分类 (十三批) ===
    // 写作
    "Create social media posts": "做社交媒体帖子",
    "social media posts": "社交媒体帖子",
    "Develop editorial guidelines": "建立编辑规范",
    "editorial guidelines": "编辑规范",

    // 代码
    "Build an app based on my idea": "根据我的想法做一个 app",
    "an app based on my idea": "根据我的想法做一个 app",
    "app based on my idea": "根据我的想法做的 app",
    "based on my idea": "根据我的想法",
    "Plan a development roadmap": "规划开发路线图",
    "a development roadmap": "开发路线图",
    "development roadmap": "开发路线图",
    "roadmap": "路线图",
    "Design UI/UX wireframes": "设计 UI/UX 线框图",
    "UI/UX wireframes": "UI/UX 线框图",
    "wireframes": "线框图",

    // === 主页快捷提示词分类 (十四批) ===
    // 代码
    "Create technical specifications": "做技术规格说明",
    "technical specifications": "技术规格说明",
    "specifications": "规格说明",

    // 生活
    "Create reading lists": "做阅读书单",
    "reading lists": "阅读书单",

    // === 主页快捷提示词分类 (十五批) ===
    // 学习
    "Design a learning challenge that pushes my creative boundaries": "设计一个挑战创意边界的学习练习",
    "a learning challenge that pushes my creative boundaries": "一个挑战创意边界的学习练习",
    "learning challenge that pushes my creative boundaries": "挑战创意边界的学习练习",
    "learning challenge": "学习练习",
    "pushes my creative boundaries": "挑战创意边界",
    "creative boundaries": "创意边界",
    "Find patterns in my research": "在我的研究中找规律",
    "patterns in my research": "我研究中的规律",

    // 生活
    "Improve sleep habits": "改善睡眠习惯",
    "sleep habits": "睡眠习惯",

    // Claude 推荐
    "Consider environmental solutions": "思考环境解决方案",
    "environmental solutions": "环境解决方案",

    // === 主页快捷提示词分类 (十六批) ===
    // 学习
    "Create educational games": "做教育类游戏",
    "educational games": "教育类游戏",
    "Prepare for an exam or interview": "准备考试或面试",
    "an exam or interview": "考试或面试",
    "exam or interview": "考试或面试",

    // 生活
    "Create personal boundaries": "建立个人边界",
    "personal boundaries": "个人边界",
    "boundaries": "边界",

    // 写作
    "Edit my content": "编辑我的内容",
    "my content": "我的内容",

    // === 杂项: Views tooltip / Move chat / Change project / Moving toast ===
    // 注: 不要再加裸 "View": "视图" — 会覆盖上面 "View": "查看" 导致所有 View 按钮变"视图"
    //     (曾导致 "View changelog" → "视图 changelog")。视图含义的 View 用更长的精确 key 兜 (如 "Transcript view")。
    "Views": "视图",
    "Move chat": "移动对话",
    "Move chats": "移动对话",
    "Select a project to move this chat into.": "选择一个项目把这个对话移过去。",
    "Select a project to move this chat into": "选择一个项目把这个对话移过去",
    "Search or create a project": "搜索或创建一个项目",
    "No projects available": "暂无项目",
    "Moving...": "移动中...",
    "Moving…": "移动中…",
    "Moving": "移动中",
    "Change project": "更换项目",
    "Change projects": "更换项目",

    // === Artifact 类别选择器 ===
    "Let's get cooking! Pick an artifact category or start building your idea from scratch.": "开始动手吧！选一个 artifact 类别，或者从头构建你的想法。",
    "Let’s get cooking! Pick an artifact category or start building your idea from scratch.": "开始动手吧！选一个 artifact 类别，或者从头构建你的想法。",
    "Let's get cooking!": "开始动手吧！",
    "Let’s get cooking!": "开始动手吧！",
    "Let's get cooking": "开始动手吧",
    "Let’s get cooking": "开始动手吧",
    "Pick an artifact category or start building your idea from scratch.": "选一个 artifact 类别，或者从头构建你的想法。",
    "Pick an artifact category or start building your idea from scratch": "选一个 artifact 类别，或者从头构建你的想法",
    "Pick an artifact category": "选一个 artifact 类别",
    "an artifact category": "一个 artifact 类别",
    "artifact category": "artifact 类别",
    "start building your idea from scratch": "从头构建你的想法",
    "build your idea from scratch": "从头构建你的想法",
    "your idea from scratch": "你的想法从头构建",
    "from scratch": "从头",
    "Apps and websites": "应用和网站",
    "and websites": "和网站",
    "websites": "网站",
    "Documents and templates": "文档和模板",
    "and templates": "和模板",
    "templates": "模板",
    "Games": "游戏",
    "Productivity tools": "生产力工具",
    "Creative projects": "创意项目",
    "Creative": "创意",
    "Quiz or survey": "测验或调查",
    "survey": "调查",

    // === 使用风格菜单 / Personalize your styles 弹窗 / 风格详情页 ===
    // 风格名 (preset)
    "Learning": "学习",
    "Concise": "简洁",
    "Explanatory": "解释式",
    "Formal": "正式",

    // 菜单项 / 按钮
    "Create & edit styles": "创建并编辑风格",
    "Create and edit styles": "创建并编辑风格",
    "& edit styles": "并编辑风格",
    "and edit styles": "并编辑风格",
    "edit styles": "编辑风格",
    "Create style": "创建风格",
    "Create styles": "创建风格",
    "Create custom style": "创建自定义风格",
    "Create a custom style": "创建自定义风格",
    "a custom style": "自定义风格",
    "custom style": "自定义风格",
    "styles": "风格",

    // Personalize your styles 弹窗
    "Personalize your styles": "个性化你的风格",
    "your styles": "你的风格",
    "Preset": "预设",
    "Tip": "提示",
    "Choose from preset styles or create your own custom style to tailor elements of Claude's written responses such as tone, voice, vocabulary, detail level, and more.": "从预设风格中选，或者创建自定义风格，来定制 Claude 回答的语气、措辞、用词、详细程度等。",
    "Choose from preset styles or create your own custom style to tailor elements of Claude’s written responses such as tone, voice, vocabulary, detail level, and more.": "从预设风格中选，或者创建自定义风格，来定制 Claude 回答的语气、措辞、用词、详细程度等。",
    "Choose from preset styles or create your own custom style to tailor elements of Claude's written responses such as tone, voice, vocabulary, detail level, and more": "从预设风格中选，或者创建自定义风格，来定制 Claude 回答的语气、措辞、用词、详细程度等",
    "Choose from preset styles or create your own custom style to tailor elements of Claude’s written responses such as tone, voice, vocabulary, detail level, and more": "从预设风格中选，或者创建自定义风格，来定制 Claude 回答的语气、措辞、用词、详细程度等",
    "Choose from preset styles or create your own custom style": "从预设风格中选，或者创建自定义风格",
    "create your own custom style": "创建自己的自定义风格",
    "preset styles": "预设风格",
    "tone, voice, vocabulary, detail level, and more": "语气、措辞、用词、详细程度等",
    "Learn about styles": "了解风格",
    "about styles": "了解风格",

    // 风格详情页
    "Options": "选项",
    "Preset style": "预设风格",
    "Preset styles are not editable": "预设风格不可编辑",
    "Hide preset style": "隐藏预设风格",
    "preset style": "预设风格",

    // 风格描述
    "Patient, educational responses that build understanding": "耐心、教育式回答，帮助建立理解",
    "educational responses that build understanding": "教育式回答，帮助建立理解",
    "educational responses": "教育式回答",
    "that build understanding": "帮助建立理解",
    "Shorter responses & more messages": "更短的回答 & 更多的消息",
    "Shorter responses and more messages": "更短的回答和更多的消息",
    "Shorter responses": "更短的回答",
    "more messages": "更多的消息",
    "Educational responses for learning": "教育式回答，用于学习",
    "Educational responses": "教育式回答",
    "for learning": "用于学习",

    // Preview with example
    "Preview with an example...": "用示例预览...",
    "Preview with an example…": "用示例预览…",
    "Preview with an example": "用示例预览",
    "with an example...": "用示例...",
    "with an example…": "用示例…",
    "with an example": "用示例",

    // 示例类别按钮
    "Short Story": "短篇故事",
    "Customer Email": "客户邮件",
    "Marketing Blog Post": "营销博客文章",
    "Marketing": "营销",
    "Blog Post": "博客文章",
    "Product Review": "产品评论",
    "Educational Content": "教育内容",

    // === Formal 风格描述 ===
    "Clear and well-structured responses": "清晰、结构化的回答",
    "well-structured responses": "结构化的回答",
    "well-structured": "结构化",

    // === 创建 a style 弹窗 ===
    "Create a style": "创建一种风格",
    "Share a writing example or describe your style and Claude will make a custom writing style tailored just for you.": "提供一段写作示例或描述你的风格，Claude 会为你做一份定制的写作风格。",
    "Share a writing example or describe your style and Claude will make a custom writing style tailored just for you": "提供一段写作示例或描述你的风格，Claude 会为你做一份定制的写作风格",
    "Share a writing example or describe your style": "提供一段写作示例或描述你的风格",
    "Claude will make a custom writing style tailored just for you.": "Claude 会为你做一份定制的写作风格。",
    "Claude will make a custom writing style tailored just for you": "Claude 会为你做一份定制的写作风格",
    "a custom writing style tailored just for you": "为你定制的写作风格",
    "custom writing style": "定制写作风格",
    "writing example": "写作示例",
    "a writing example": "写作示例",
    "Add writing example": "添加写作示例",
    "Add a writing example": "添加写作示例",
    "Select, drop, or paste existing doc, post, message, etc.": "选择、拖入或粘贴已有的文档、帖子、消息等。",
    "Select, drop, or paste existing doc, post, message, etc": "选择、拖入或粘贴已有的文档、帖子、消息等",
    "existing doc, post, message, etc.": "已有的文档、帖子、消息等。",
    "existing doc, post, message, etc": "已有的文档、帖子、消息等",
    "Content is not stored after matching style.": "匹配完风格后不会保存内容。",
    "Content is not stored after matching style": "匹配完风格后不会保存内容",
    "Describe style instead": "改为描述风格",

    // === 添加 writing example 菜单 ===
    "Upload from device": "从设备上传",
    "from device": "从设备",
    "Paste text content": "粘贴文本内容",

    // === Paste textarea placeholder ===
    "Paste at least a few paragraphs of example writing, including from multiple various sources if you'd like, for Claude to analyze and the match style of...": "粘贴至少几段写作示例 (可以来自多个来源)，让 Claude 分析并匹配风格...",
    "Paste at least a few paragraphs of example writing, including from multiple various sources if you’d like, for Claude to analyze and the match style of...": "粘贴至少几段写作示例 (可以来自多个来源)，让 Claude 分析并匹配风格...",
    "Paste at least a few paragraphs of example writing, including from multiple various sources if you'd like, for Claude to analyze and the match style of…": "粘贴至少几段写作示例 (可以来自多个来源)，让 Claude 分析并匹配风格…",
    "Paste at least a few paragraphs of example writing, including from multiple various sources if you’d like, for Claude to analyze and the match style of…": "粘贴至少几段写作示例 (可以来自多个来源)，让 Claude 分析并匹配风格…",
    "Paste at least a few paragraphs of example writing": "粘贴至少几段写作示例",

    // === Describe your style 弹窗 ===
    "Describe your style": "描述你的风格",
    "Generate style from a starting point:": "从一个起点生成风格：",
    "Generate style from a starting point": "从一个起点生成风格",
    "Define style objective": "定义风格目标",
    "style objective": "风格目标",
    "Tailor to an audience": "针对某个受众定制",
    "to an audience": "针对某个受众",
    "Use specific voice & tone": "使用特定的措辞与语气",
    "Use specific voice and tone": "使用特定的措辞与语气",
    "specific voice & tone": "特定的措辞与语气",
    "specific voice and tone": "特定的措辞与语气",
    "voice & tone": "措辞与语气",
    "voice and tone": "措辞与语气",
    "Describe generally": "概括描述",
    "Use custom instructions (advanced)": "使用自定义指令 (高级)",
    "custom instructions (advanced)": "自定义指令 (高级)",
    "custom instructions": "自定义指令",

    // Describe style 右侧详情
    "Describe the main purpose and goal of this writing style — whether to teach, analyze, persuade, inspire, etc.": "描述这种写作风格的主要目的和目标 — 教学、分析、说服、启发等。",
    "Describe the main purpose and goal of this writing style": "描述这种写作风格的主要目的和目标",
    "main purpose and goal of this writing style": "这种写作风格的主要目的和目标",
    "whether to teach, analyze, persuade, inspire, etc.": "教学、分析、说服、启发等。",
    "whether to teach, analyze, persuade, inspire, etc": "教学、分析、说服、启发等",
    "Try something like:": "可以这样写：",
    "Try something like": "可以这样写",
    "I want to teach complex topics step-by-step, with a focus on building understanding.": "我想一步步教授复杂主题，重点是建立理解。",
    "I want to teach complex topics step-by-step, with a focus on building understanding": "我想一步步教授复杂主题，重点是建立理解",
    "teach complex topics step-by-step": "一步步教授复杂主题",
    "with a focus on building understanding": "重点是建立理解",
    "building understanding": "建立理解",
    "Generate style": "生成风格",
    "Never mind, I'll add an example": "算了，我来加一个示例",
    "Never mind, I’ll add an example": "算了，我来加一个示例",
    "Never mind": "算了",

    // === Describe your style 5 个选项右侧详情 ===
    // 针对某个受众定制
    "Describe details of the target audience you'd like Claude to write for including relevant information, needs, or preferences.": "描述你希望 Claude 写作的目标受众细节，包括相关信息、需求或偏好。",
    "Describe details of the target audience you’d like Claude to write for including relevant information, needs, or preferences.": "描述你希望 Claude 写作的目标受众细节，包括相关信息、需求或偏好。",
    "Describe details of the target audience": "描述目标受众细节",
    "target audience": "目标受众",
    "relevant information, needs, or preferences.": "相关信息、需求或偏好。",
    "relevant information, needs, or preferences": "相关信息、需求或偏好",
    "Write for marketing professionals. They're tech-savvy and appreciate a dash of humor with their data.": "写给营销专业人士。他们懂技术，喜欢在数据里带点幽默。",
    "Write for marketing professionals. They’re tech-savvy and appreciate a dash of humor with their data.": "写给营销专业人士。他们懂技术，喜欢在数据里带点幽默。",
    "Write for marketing professionals.": "写给营销专业人士。",
    "Write for marketing professionals": "写给营销专业人士",
    "marketing professionals": "营销专业人士",

    // 使用特定的措辞与语气
    "Think about characteristics like formality, emotion, personality, and how you want the written responses to feel.": "想想风格特征 — 正式度、情感、个性，以及你希望回答给人怎样的感觉。",
    "Think about characteristics like formality, emotion, personality, and how you want the written responses to feel": "想想风格特征 — 正式度、情感、个性，以及你希望回答给人怎样的感觉",
    "characteristics like formality, emotion, personality": "风格特征 — 正式度、情感、个性",
    "how you want the written responses to feel": "你希望回答给人怎样的感觉",
    "Write in a warm, approachable tone with light professional humor - like a friendly mentor.": "用温暖、亲切的语气写，带一点专业幽默 — 像一位友好的导师。",
    "Write in a warm, approachable tone with light professional humor - like a friendly mentor": "用温暖、亲切的语气写，带一点专业幽默 — 像一位友好的导师",
    "Write in a warm, approachable tone with light professional humor — like a friendly mentor.": "用温暖、亲切的语气写，带一点专业幽默 — 像一位友好的导师。",
    "Write in a warm, approachable tone": "用温暖、亲切的语气写",
    "warm, approachable tone": "温暖、亲切的语气",
    "light professional humor": "一点专业幽默",
    "like a friendly mentor": "像一位友好的导师",
    "a friendly mentor": "一位友好的导师",

    // 概括描述
    "Describe in detail how you would like Claude to write. Be as specific as you can.": "详细描述你希望 Claude 怎么写。尽量具体。",
    "Describe in detail how you would like Claude to write. Be as specific as you can": "详细描述你希望 Claude 怎么写。尽量具体",
    "Describe in detail how you would like Claude to write.": "详细描述你希望 Claude 怎么写。",
    "Describe in detail how you would like Claude to write": "详细描述你希望 Claude 怎么写",
    "Be as specific as you can.": "尽量具体。",
    "Be as specific as you can": "尽量具体",
    "Write like an excited scientist explaining fascinating discoveries - technical but energetic.": "像一位兴奋的科学家在解释引人入胜的发现 — 技术但有活力。",
    "Write like an excited scientist explaining fascinating discoveries - technical but energetic": "像一位兴奋的科学家在解释引人入胜的发现 — 技术但有活力",
    "Write like an excited scientist explaining fascinating discoveries — technical but energetic.": "像一位兴奋的科学家在解释引人入胜的发现 — 技术但有活力。",
    "Write like an excited scientist": "像一位兴奋的科学家",
    "explaining fascinating discoveries": "解释引人入胜的发现",
    "technical but energetic": "技术但有活力",

    // 使用自定义指令 (高级)
    "Write exact custom instructions for this style instead of generating a style prompt automatically. Claude will ignore instructions that don't follow our guidelines.": "为这个风格写明确的自定义指令，不自动生成风格提示词。Claude 会忽略不符合我们准则的指令。",
    "Write exact custom instructions for this style instead of generating a style prompt automatically. Claude will ignore instructions that don’t follow our guidelines.": "为这个风格写明确的自定义指令，不自动生成风格提示词。Claude 会忽略不符合我们准则的指令。",
    "Write exact custom instructions for this style instead of generating a style prompt automatically.": "为这个风格写明确的自定义指令，不自动生成风格提示词。",
    "Write exact custom instructions for this style": "为这个风格写明确的自定义指令",
    "instead of generating a style prompt automatically": "不自动生成风格提示词",
    "Claude will ignore instructions that don't follow our guidelines.": "Claude 会忽略不符合我们准则的指令。",
    "Claude will ignore instructions that don't follow our guidelines": "Claude 会忽略不符合我们准则的指令",
    "Claude will ignore instructions that don’t follow our guidelines.": "Claude 会忽略不符合我们准则的指令。",
    "Claude will ignore instructions that don’t follow our guidelines": "Claude 会忽略不符合我们准则的指令",
    "that don't follow our guidelines": "不符合我们准则的",
    "that don’t follow our guidelines": "不符合我们准则的",
    "our guidelines": "我们的准则",
    "Write style custom instructions here...": "在这里写风格自定义指令...",
    "Write style custom instructions here…": "在这里写风格自定义指令…",
    "Write style custom instructions here": "在这里写风格自定义指令",

    // === Describe your style 5 个选项的 textarea placeholder (含真换行 \n) ===
    "Try something like:\nI want to teach complex topics step-by-step, with a focus on building understanding.": "可以这样写：\n我想一步步教复杂主题，重点是建立理解。",
    "Try something like:\nWrite for marketing professionals. They're tech-savvy and appreciate a dash of humor with their data.": "可以这样写：\n写给营销专业人士。他们懂技术，喜欢在数据里带点幽默。",
    "Try something like:\nWrite for marketing professionals. They’re tech-savvy and appreciate a dash of humor with their data.": "可以这样写：\n写给营销专业人士。他们懂技术，喜欢在数据里带点幽默。",
    "Try something like:\nWrite in a warm, approachable tone with light professional humor - like a friendly mentor.": "可以这样写：\n用温暖、亲切的语气写，带一点专业幽默 — 像一位友好的导师。",
    "Try something like:\nWrite in a warm, approachable tone with light professional humor — like a friendly mentor.": "可以这样写：\n用温暖、亲切的语气写，带一点专业幽默 — 像一位友好的导师。",
    "Try something like:\nWrite like an excited scientist explaining fascinating discoveries - technical but energetic.": "可以这样写：\n像一位兴奋的科学家在解释引人入胜的发现 — 技术但有活力。",
    "Try something like:\nWrite like an excited scientist explaining fascinating discoveries — technical but energetic.": "可以这样写：\n像一位兴奋的科学家在解释引人入胜的发现 — 技术但有活力。",

    // === 插件 tooltip / 共享对话空状态 / 删除归档弹窗 ===
    "Plugins run locally and aren't available in Chat. Switch to Cowork or Code to use plugins.": "插件本地运行，在 Chat 中不可用。切换到 Cowork 或 Code 使用插件。",
    "Plugins run locally and aren’t available in Chat. Switch to Cowork or Code to use plugins.": "插件本地运行，在 Chat 中不可用。切换到 Cowork 或 Code 使用插件。",
    "Plugins run locally and aren't available in Chat.": "插件本地运行，在 Chat 中不可用。",
    "Plugins run locally and aren’t available in Chat.": "插件本地运行，在 Chat 中不可用。",
    "Switch to Cowork or Code to use plugins.": "切换到 Cowork 或 Code 使用插件。",
    "Plugins run locally": "插件本地运行",

    "You haven't shared any chats yet.": "你还没分享过对话。",
    "You haven’t shared any chats yet.": "你还没分享过对话。",
    "You haven't shared any chats yet": "你还没分享过对话",
    "You haven’t shared any chats yet": "你还没分享过对话",
    "No chats yet.": "还没有对话。",
    "No chats yet": "还没有对话",

    "Archive project": "归档项目",
    "Archive": "归档",
    "project": "项目",

    // === Set 项目指令 弹窗 ===
    "Set project instructions": "设置项目指令",
    "Set": "设置",
    "project instructions": "项目指令",
    "Save instructions": "保存指令",
    "Save": "保存",
    "Provide Claude with relevant instructions and information for chats within": "为以下项目中的对话提供 Claude 相关指令和信息：",
    "This will work alongside your profile instructions and the selected style in a chat.": "这会与你的 profile 指令和当前选择的风格一起工作。",
    "This will work alongside your profile instructions and the selected style in a chat": "这会与你的 profile 指令和当前选择的风格一起工作",
    "your profile instructions and the selected style in a chat": "你的 profile 指令和当前选择的风格",
    "and the selected style in a chat.": "和当前选择的风格一起工作。",
    "and the selected style in a chat": "和当前选择的风格一起工作",
    "the selected style in a chat": "当前选择的风格",
    "selected style in a chat": "当前选择的风格",
    "profile instructions": "profile 指令",
    // React 拆词后 "This will work alongside your" 单独 textNode
    "This will work alongside your": "这会与你的",
    "This will work alongside": "这会与",
    "work alongside your": "与你的一起",
    "work alongside": "一起",
    "alongside your": "与你的",
    "alongside": "一起",

    // 4 条项目指令 placeholder
    "Think step by step and show reasoning for complex problems. Use specific examples.": "对复杂问题逐步思考并展示推理过程。用具体例子。",
    "Think step by step and show reasoning for complex problems.": "对复杂问题逐步思考并展示推理过程。",
    "Think step by step and show reasoning for complex problems": "对复杂问题逐步思考并展示推理过程",
    "Use specific examples.": "用具体例子。",
    "Use specific examples": "用具体例子",
    "Think step by step": "逐步思考",
    "Break down large tasks and ask clarifying questions when needed.": "拆解大任务，必要时问清楚。",
    "Break down large tasks and ask clarifying questions when needed": "拆解大任务，必要时问清楚",
    "Break down large tasks": "拆解大任务",
    "ask clarifying questions when needed": "必要时问清楚",
    "Use Artifacts only for web apps and code demos.": "Artifacts 仅用于 web 应用和代码演示。",
    "Use Artifacts only for web apps and code demos": "Artifacts 仅用于 web 应用和代码演示",
    "web apps and code demos": "web 应用和代码演示",
    "When giving feedback, explain thought process and highlight issues and opportunities.": "给反馈时，解释思考过程并指出问题和机会。",
    "When giving feedback, explain thought process and highlight issues and opportunities": "给反馈时，解释思考过程并指出问题和机会",
    "When giving feedback": "给反馈时",
    "explain thought process": "解释思考过程",
    "highlight issues and opportunities": "指出问题和机会",

    // === 添加菜单 ===
    "Add text content": "添加文本内容",
    "text content": "文本内容",

    // === 杂项: 项目卡片 / 插件 tooltip / 创建菜单 / 导入项目 / 使用已有文件夹 ===
    "Plugins are only available in Cowork and Code": "插件仅在 Cowork 和 Code 中可用",
    "only available in Cowork and Code": "仅在 Cowork 和 Code 中可用",

    "Create new project": "创建新项目",
    "Create a new project": "创建新项目",
    "new project": "新项目",
    "a new project": "新项目",
    "new": "新",

    "from Chat": "来自 Chat",
    "Search projects in Chat...": "在 Chat 里搜索项目...",
    "Search projects in Chat…": "在 Chat 里搜索项目…",
    "Search projects in Chat": "在 Chat 里搜索项目",

    "Choose a folder...": "选择一个文件夹...",
    "Choose a folder…": "选择一个文件夹…",
    "a folder...": "一个文件夹...",
    "a folder…": "一个文件夹…",
    "a folder": "一个文件夹",

    // === 创建定时任务弹窗 placeholder ===
    "daily-briefing": "每日简报",
    "Summarize my calendar and inbox for the day": "总结我今天的日历和收件箱",
    "Summarize my calendar and inbox for the day.": "总结我今天的日历和收件箱。",
    "calendar and inbox for the day": "今天的日历和收件箱",
    "Check my Google Calendar for today's meetings and summarize my unread emails. Highlight anything urgent.": "查看我今天的 Google Calendar 会议，总结未读邮件。指出紧急事项。",
    "Check my Google Calendar for today’s meetings and summarize my unread emails. Highlight anything urgent.": "查看我今天的 Google Calendar 会议，总结未读邮件。指出紧急事项。",
    "Check my Google Calendar for today's meetings and summarize my unread emails. Highlight anything urgent": "查看我今天的 Google Calendar 会议，总结未读邮件。指出紧急事项",
    "Check my Google Calendar for today's meetings": "查看我今天的 Google Calendar 会议",
    "Check my Google Calendar for today’s meetings": "查看我今天的 Google Calendar 会议",
    "summarize my unread emails": "总结未读邮件",
    "my unread emails": "我的未读邮件",
    "unread emails": "未读邮件",
    "Highlight anything urgent.": "指出紧急事项。",
    "Highlight anything urgent": "指出紧急事项",
    "anything urgent": "紧急事项",

    // from 项目 拆词兜底
    "from project": "来自项目",
    "from": "来自",

    // === Links / Paste a URL 输入框 ===
    "Links": "链接",
    "Link": "链接",
    "Paste a URL": "粘贴 URL",
    "Paste a URL...": "粘贴 URL...",
    "Paste a URL…": "粘贴 URL…",

    // === 上下文面板 (空状态) ===
    "Empty folder": "空文件夹",
    "Ask Claude to remember something and it'll save it here.": "让 Claude 记住点什么，会保存在这里。",
    "Ask Claude to remember something and it’ll save it here.": "让 Claude 记住点什么，会保存在这里。",
    "Ask Claude to remember something and it'll save it here": "让 Claude 记住点什么，会保存在这里",
    "Ask Claude to remember something and it’ll save it here": "让 Claude 记住点什么，会保存在这里",
    "Ask Claude to remember something": "让 Claude 记住点什么",

    // === 编辑详情 弹窗 ===
    "Description (optional)": "描述 (可选)",
    "(optional)": "(可选)",

    // === 实时 Artifacts 页面 ===
    "Live Artifacts": "实时 Artifacts",
    "Create Artifact": "新建 Artifact",
    "Create artifact": "新建 artifact",
    "New Artifact": "新建 Artifact",
    "Create dynamic artifacts that stay up-to-date using live data from your connectors.": "创建动态 artifact，用连接器的实时数据保持最新。",
    "Create dynamic artifacts that stay up-to-date using live data from your connectors": "创建动态 artifact，用连接器的实时数据保持最新",
    "dynamic artifacts that stay up-to-date using live data from your connectors": "动态 artifact，用连接器的实时数据保持最新",
    "that stay up-to-date using live data from your connectors": "用连接器的实时数据保持最新",
    "using live data from your connectors": "用连接器的实时数据",
    "live data from your connectors": "连接器的实时数据",
    "from your connectors": "来自你的连接器",
    "your connectors": "你的连接器",
    // React 拆词后前段单独 textNode (不含 your connectors)
    "Create dynamic artifacts that stay up-to-date using live data from": "创建动态 artifact，用以下实时数据保持最新：",
    "dynamic artifacts that stay up-to-date using live data from": "动态 artifact，用以下实时数据保持最新：",
    "stay up-to-date using live data from": "用以下实时数据保持最新：",
    "using live data from": "用以下数据：",
    "live data from": "实时数据来自",
    "stay up-to-date": "保持最新",
    "up-to-date": "最新",

    // === Working folder / 上下文面板 ===
    "Working folder": "工作文件夹",
    "View and open files created during this task.": "查看和打开此任务期间创建的文件。",
    "View and open files created during this task": "查看和打开此任务期间创建的文件",
    "files created during this task": "此任务期间创建的文件",

    // === Dispatch 主页面 (Dispatch 保留英文，与 Cowork/Code/Chat 一致) ===
    "Mobile notifications": "移动端通知",
    "notifications": "通知",
    "Enable computer use": "启用计算机使用",
    "computer use": "计算机使用",
    "Open settings": "打开设置",
    "settings": "设置",
    "Outputs": "输出",
    "Files Claude shares will appear here.": "Claude 分享的文件会显示在这里。",
    "Files Claude shares will appear here": "Claude 分享的文件会显示在这里",
    "Dispatch to Claude and check in from anywhere—a task, a code session, in one continuous thread.": "随时随地给 Claude 派发任务并查看进展 — 任务或代码会话，在一个持续会话里。",
    "Dispatch to Claude and check in from anywhere": "随时随地给 Claude 派发任务并查看进展",
    "a task, a code session, in one continuous thread.": "任务或代码会话，在一个持续会话里。",
    "Work with Claude, right on your computer": "与 Claude 一起工作，就在你的电脑上",
    "Claude can work with your files, browse in Chrome, and use connectors. Dispatch a task or a code session from the mobile app, and Claude will keep working as long as your computer stays awake.": "Claude 可以处理你的文件、浏览 Chrome、使用连接器。从手机 app 派发任务或代码会话，只要电脑保持唤醒，Claude 会一直工作。",
    "Claude can work with your files, browse in Chrome, and use connectors.": "Claude 可以处理你的文件、浏览 Chrome、使用连接器。",
    "Dispatch a task or a code session from the mobile app, and Claude will keep working as long as your computer stays awake.": "从手机 app 派发任务或代码会话，只要电脑保持唤醒，Claude 会一直工作。",
    "as long as your computer stays awake": "只要电脑保持唤醒",

    "Hey, glad you're here. Tell me what's on your plate, no ask is too big or small. You could ask me to:": "嘿，很高兴你来了。告诉我你手头的事，不论大小。你可以让我：",
    "Hey, glad you’re here. Tell me what’s on your plate, no ask is too big or small. You could ask me to:": "嘿，很高兴你来了。告诉我你手头的事，不论大小。你可以让我：",
    "Find a confirmation in Downloads and check the order status on the site.": "在下载里找一份确认信息，在网站上查询订单状态。",
    "Find a passport scan, check visa rules for a trip, and flag what's missing.": "找一份护照扫描件，查询某次旅行的签证规则，标出缺失的部分。",
    "Find a passport scan, check visa rules for a trip, and flag what’s missing.": "找一份护照扫描件，查询某次旅行的签证规则，标出缺失的部分。",
    "Scan Slack for a bug report, find the file, and open a Code session to fix it.": "在 Slack 中扫描 bug 报告，找到文件，打开 Code 会话修复。",
    "Search your repos for an error message and trace where it comes from.": "在你的代码仓里搜索错误消息，追溯来源。",
    "You can also control this conversation from your phone. Download the Claude app for iOS or Android, then go to the Dispatch tab.": "你也可以从手机控制这个对话。下载 iOS 或 Android 的 Claude app，然后进入 Dispatch 标签。",
    "Download the Claude app for iOS or Android": "下载 iOS 或 Android 的 Claude app",
    "go to the Dispatch tab": "进入 Dispatch 标签",
    "Ask Claude anything": "问 Claude 任何问题",

    // === 代码权限菜单 ===
    "Always ask before making changes": "改动前总是询问",
    "Automatically accept all file edits": "自动接受所有文件编辑",
    "Create a plan before making changes": "改动前先做计划",
    "Claude handles permission decisions": "Claude 处理权限决定",
    "Accepts all permissions": "接受所有权限",
    "Accepts all": "接受全部",

    // === 通知 toast ===
    "Get notified on your phone when Claude messages you here.": "Claude 在这里给你发消息时，在手机上接收通知。",
    "Get notified on your phone when Claude messages you here": "Claude 在这里给你发消息时，在手机上接收通知",
    "Get notified on your phone": "在手机上接收通知",
    "when Claude messages you here": "Claude 在这里给你发消息时",
    "Turn on": "开启",

    // === Attach file tooltip ===
    "Attach file": "附加文件",
    "Attach files": "附加文件",
    "Attach a file": "附加文件",

    // === Dispatch 菜单 / 删除对话 / 清空记忆 弹窗 ===
    "Clear background tasks": "清空后台任务",
    "background tasks": "后台任务",
    "Report content": "举报内容",
    "Clear memory": "清空记忆",
    "memory": "记忆",
    "Delete conversation": "删除对话",
    "conversation": "对话",

    "Delete this conversation?": "删除这个对话？",
    "Delete this conversation": "删除这个对话",
    "this conversation": "这个对话",
    "This will delete all messages and files from this conversation. Any separate tasks created from this conversation won't be affected.": "这会删除此对话中的所有消息和文件。从此对话创建的独立任务不受影响。",
    "This will delete all messages and files from this conversation. Any separate tasks created from this conversation won’t be affected.": "这会删除此对话中的所有消息和文件。从此对话创建的独立任务不受影响。",
    "This will delete all messages and files from this conversation.": "这会删除此对话中的所有消息和文件。",
    "This will delete all messages and files from this conversation": "这会删除此对话中的所有消息和文件",
    "Any separate tasks created from this conversation won't be affected.": "从此对话创建的独立任务不受影响。",
    "Any separate tasks created from this conversation won’t be affected.": "从此对话创建的独立任务不受影响。",
    "Any separate tasks created from this conversation won't be affected": "从此对话创建的独立任务不受影响",
    "Any separate tasks created from this conversation won’t be affected": "从此对话创建的独立任务不受影响",
    "Any separate tasks created from this conversation": "从此对话创建的独立任务",
    "separate tasks created from this conversation": "从此对话创建的独立任务",
    "won't be affected.": "不受影响。",
    "won't be affected": "不受影响",
    "won’t be affected.": "不受影响。",
    "won’t be affected": "不受影响",

    "Clear memory?": "清空记忆？",
    "This will delete what Claude has learned about you. Your messages and files won't be affected.": "这会删除 Claude 学到的关于你的内容。你的消息和文件不受影响。",
    "This will delete what Claude has learned about you. Your messages and files won’t be affected.": "这会删除 Claude 学到的关于你的内容。你的消息和文件不受影响。",
    "This will delete what Claude has learned about you.": "这会删除 Claude 学到的关于你的内容。",
    "This will delete what Claude has learned about you": "这会删除 Claude 学到的关于你的内容",
    "what Claude has learned about you": "Claude 学到的关于你的内容",
    "Your messages and files won't be affected.": "你的消息和文件不受影响。",
    "Your messages and files won’t be affected.": "你的消息和文件不受影响。",
    "Your messages and files": "你的消息和文件",

    // === Cookie 设置弹窗 ===
    "We use cookies to deliver and improve our services, analyze site usage, and if you agree, to customize or personalize your experience and market our services to you. You can read our Cookie Policy": "我们使用 cookies 来交付和改善服务、分析站点使用情况；如你同意，还会用于定制化、个性化你的体验和市场推广。可以阅读我们的 Cookie 政策",
    "You can read our Cookie Policy": "可以阅读我们的 Cookie 政策",
    "Cookie Policy": "Cookie 政策",
    "Personalize Cookie settings": "个性化 Cookie 设置",
    "Cookie settings": "Cookie 设置",
    "Reject all Cookies": "拒绝全部 Cookies",
    "Accept all Cookies": "接受全部 Cookies",
    "all Cookies": "全部 Cookies",
    "Reject all": "拒绝全部",
    "Accept all": "接受全部",
    "Reject": "拒绝",
    "Accept": "接受",

    // Cookie 详情
    "Our website uses cookies to distinguish you from other users of our website. This helps us provide you with a more personalized experience when you browse our website and also allows us to improve our site. Cookies may collect information that is used to tailor ads shown to you on our website and other websites. The information might be about you, your preferences or your device. The information does not usually directly identify you, but it can give you a more personalized web experience. You can choose not to allow some types of cookies.": "我们的网站用 cookies 区分你和其他用户。这帮助我们在你浏览时提供更个性化的体验，也帮我们改进站点。Cookies 可能收集用于定制本站和其他站点广告的信息。这些信息可能涉及你、你的偏好或你的设备。这些信息通常不直接识别你，但能提供更个性化的网络体验。你可以选择不允许某些类型的 cookies。",
    "Necessary": "必要",
    "Enables security and basic functionality.": "启用安全和基础功能。",
    "Enables security and basic functionality": "启用安全和基础功能",
    "Required": "必需",
    "Analytics": "分析",
    "Enables tracking of site performance.": "启用站点性能追踪。",
    "Enables tracking of site performance": "启用站点性能追踪",
    "On": "开",
    "Off": "关",
    "Enables ads personalization and tracking.": "启用广告个性化和追踪。",
    "Enables ads personalization and tracking": "启用广告个性化和追踪",
    "Save preferences": "保存偏好",
    "preferences": "偏好",

    // === Android 订阅页 ===
    "You're subscribed via Android app": "你通过 Android app 订阅",
    "You’re subscribed via Android app": "你通过 Android app 订阅",
    "subscribed via Android app": "通过 Android app 订阅",
    "Manage your subscription on your Android device": "在你的 Android 设备上管理订阅",
    "Manage your subscription": "管理你的订阅",
    "on your Android device": "在你的 Android 设备上",
    "Android device": "Android 设备",

    // === Downloading update toast ===
    "Downloading update...": "正在下载更新...",
    "Downloading update…": "正在下载更新…",
    "Downloading update": "正在下载更新",
    "Downloading": "正在下载",

    // === 插件目录筛选下拉 (补) ===
    "creative": "创意",
    "Sales and marketing": "销售和营销",
    "Sales & marketing": "销售和营销",
    "and marketing": "和营销",
    "marketing": "营销",

    // === 插件 / 连接器描述 ===
    "Comprehensive financial datasets": "全面的金融数据集",
    "Expert-led enhanced insights": "专家主导的深度洞察",
    "Search, read, and upload files instantly": "即时搜索、读取和上传文件",
    "Draft replies, summarize threads, & search your inbox": "起草回复、总结邮件线程、搜索收件箱",
    "Draft replies, summarize threads, and search your inbox": "起草回复、总结邮件线程、搜索收件箱",
    "Manage your schedule and coordinate meetings effortlessly": "轻松管理日程和协调会议",
    "Search, create, autofill, and export Canva designs": "搜索、创建、自动填充、导出 Canva 设计",
    "Access your company's SharePoint, OneDrive, Outlook, and Teams directly in Claude": "在 Claude 中直接访问你公司的 SharePoint、OneDrive、Outlook 和 Teams",
    "Access your company’s SharePoint, OneDrive, Outlook, and Teams directly in Claude": "在 Claude 中直接访问你公司的 SharePoint、OneDrive、Outlook 和 Teams",
    "Build, manage, and analyze your Shopify store": "搭建、管理和分析你的 Shopify 商店",
    "Generate diagrams and better code from Figma context": "基于 Figma 上下文生成图表和更好的代码",
    "Access Jira & Confluence from Claude": "在 Claude 中访问 Jira 和 Confluence",
    "Access Jira and Confluence from Claude": "在 Claude 中访问 Jira 和 Confluence",

    "Job search made easy": "轻松找工作",
    "Connect your Notion workspace to search, update, and power workflows across tools": "连接你的 Notion 工作区，跨工具搜索、更新、驱动工作流",
    "Music and podcast recommendations, just for you.": "为你定制的音乐和播客推荐。",
    "Music and podcast recommendations, just for you": "为你定制的音乐和播客推荐",
    "Access Live & Historical Crypto Data, Indices": "访问加密货币实时和历史数据、指数",
    "Access Live and Historical Crypto Data, Indices": "访问加密货币实时和历史数据、指数",
    "Send messages, create canvases, and fetch Slack data": "发消息、创建画布、获取 Slack 数据",
    "Chat with your CRM data to get personalized insights": "与你的 CRM 数据对话，获取个性化洞察",
    "Access and create new content on Miro boards": "在 Miro 看板上访问和创建新内容",
    "Access your Xero financials from any conversation": "从任何对话访问你的 Xero 财务数据",
    "Financials, risk data and analysis on 50,000 industries": "5 万个行业的财务、风险数据和分析",
    "Find hotels, homes and more": "查找酒店、住宿等",
    "Find hotels, homes & more": "查找酒店、住宿等",
    "homes and more": "住宿等",
    "homes & more": "住宿等",

    "Manage projects, boards, and workflows in monday.com": "在 monday.com 中管理项目、看板和工作流",
    "Manage issues, projects & team workflows in Linear": "在 Linear 中管理 issue、项目和团队工作流",
    "Manage issues, projects and team workflows in Linear": "在 Linear 中管理 issue、项目和团队工作流",
    "Ideate, diagram, and align teams": "构思、画图、对齐团队",
    "Access to Intercom data for better customer insights": "访问 Intercom 数据获得更好的客户洞察",
    "Search, access and get insights on your Box content": "搜索、访问并获取你的 Box 内容洞察",
    "Connect to Asana to coordinate tasks, projects, and goals": "连接 Asana 以协调任务、项目和目标",
    "Check links, phones, and emails for scams": "检查链接、电话和邮件是否为诈骗",
    "Ideate, create, and deliver with Adobe pro tools": "用 Adobe 专业工具构思、创建、交付",
    "Securely access Autodesk's help documentation": "安全访问 Autodesk 的帮助文档",
    "Securely access Autodesk’s help documentation": "安全访问 Autodesk 的帮助文档",
    "Automate workflows across thousands of apps via conversation": "通过对话在数千个应用间自动化工作流",

    // === 插件描述 (二批) ===
    "Microsoft Learn": "Microsoft Learn",
    "Era Context": "Era Context",
    // === Anthropic 官方 skill 名 (二批) ===
    "Bio research": "生物研究",
    "Customer support": "客户支持",
    "Enterprise search": "企业搜索",
    "Search trusted Microsoft docs to power your development": "搜索可信的 Microsoft 文档以驱动你的开发",
    "Design surveys, collect responses, and analyze results": "设计问卷、收集回复、分析结果",
    "Bring your structured data to Claude": "把你的结构化数据带到 Claude",
    "Surface call insights and missed opportunities": "呈现通话洞察和错过的机会",
    "Manage your personal finances using Claude": "用 Claude 管理你的个人财务",
    "The AI notepad for meetings": "会议用的 AI 记事本",
    "Get Uber price & time estimates for any ride option": "查任意乘车方式的 Uber 价格和时间预估",
    "Get Uber price and time estimates for any ride option": "查任意乘车方式的 Uber 价格和时间预估",
    "Create presentations, docs, socials, and sites with AI": "用 AI 创建演示、文档、社交内容和网站",
    "Ask questions. Get underwriting insights from Verisk.": "提问获取来自 Verisk 的承保洞察。",
    "Ask questions. Get underwriting insights from Verisk": "提问获取来自 Verisk 的承保洞察",
    "Find your perfect hotel based on Tripadvisor reviews": "根据 Tripadvisor 评论找到理想酒店",
    "Analyse your live people data, right in Claude": "在 Claude 中直接分析你的实时人事数据",
    "Search, recap, and act on your Zoom meetings": "搜索、回顾并对你的 Zoom 会议采取行动",

    "Natural-language estimating for XactRestore": "为 XactRestore 提供自然语言估算",
    "Search, query, and debug errors intelligently": "智能搜索、查询和调试错误",
    "Analyze, debug, and manage projects and deployments": "分析、调试和管理项目和部署",
    "Create and iterate 3D models for use in SketchUp": "为 SketchUp 创建和迭代 3D 模型",
    "Connect Claude to NetSuite data for analysis & insights": "把 Claude 连接到 NetSuite 数据用于分析和洞察",
    "Connect Claude to NetSuite data for analysis and insights": "把 Claude 连接到 NetSuite 数据用于分析和洞察",
    "Explore restaurants and dishes": "探索餐厅和菜品",
    "Enrich contacts & accounts with GTM intelligence": "用 GTM 智能丰富联系人和账户",
    "Enrich contacts and accounts with GTM intelligence": "用 GTM 智能丰富联系人和账户",
    "Intelligent, secure contract management by Docusign": "Docusign 提供的智能、安全合同管理",
    "Your AI assistant for Hiring and HR — inside Workable": "招聘和 HR 的 AI 助手 — 在 Workable 内",
    "Your AI assistant for Hiring and HR - inside Workable": "招聘和 HR 的 AI 助手 — 在 Workable 内",
    "Give API context to your coding agents": "给你的编程 agent 提供 API 上下文",
    "Manage databases, authentication, and storage": "管理数据库、身份认证和存储",
    "Find and book restaurants instantly": "即时查找和预订餐厅",

    "Real-time access to trusted expert knowledge": "实时访问可信专家知识",
    "Analyze and manage Smartsheet data with Claude": "用 Claude 分析和管理 Smartsheet 数据",
    "Analyze your Meta ad creative & competitor ad libraries": "分析你的 Meta 广告创意和竞争对手广告库",
    "Analyze your Meta ad creative and competitor ad libraries": "分析你的 Meta 广告创意和竞争对手广告库",
    "MCP for creating interactive hand-drawn diagrams in Excalidraw": "在 Excalidraw 中创建交互式手绘图的 MCP",
    "Search for jobs on Indeed": "在 Indeed 上搜索职位",
    "for jobs on Indeed": "在 Indeed 上的职位",
    "Ask for audiobook recommendations": "获取有声书推荐",
    "Drive your email and calendar, right from Claude": "直接从 Claude 操控你的邮件和日历",
    "Manage your M&A data room from Claude": "从 Claude 管理你的并购数据室",
    "Find & book local Taskrabbit services near you": "查找并预订你附近的 Taskrabbit 本地服务",
    "Find and book local Taskrabbit services near you": "查找并预订你附近的 Taskrabbit 本地服务",
    "Book travel experiences around the world": "预订全球旅行体验",
    "Marketing campaign and audience insights from Adobe": "来自 Adobe 的营销活动和受众洞察",
    "Understand and troubleshoot your Journeys and Campaigns": "理解和排查你的 Journeys 和 Campaigns",

    "Project management & collaboration for teams & agents": "团队和 agent 的项目管理与协作",
    "Project management and collaboration for teams and agents": "团队和 agent 的项目管理与协作",
    "Search Splice's sounds catalog, build stacks & more!": "搜索 Splice 音色库，构建音色组等！",
    "Search Splice’s sounds catalog, build stacks & more!": "搜索 Splice 音色库，构建音色组等！",
    "Search Splice's sounds catalog, build stacks and more!": "搜索 Splice 音色库，构建音色组等！",
    "Generate, manage, and update Eraser diagrams and files": "生成、管理和更新 Eraser 图表和文件",
    "Your meetings, now part of every Claude conversation": "你的会议，现在是每个 Claude 对话的一部分",
    "Find your next hike": "找你的下一次徒步",
    "Query, search, and explore your data with Sigma": "用 Sigma 查询、搜索和探索你的数据",
    "Find prospects. Research accounts. Personalize outreach": "找潜在客户、调研账户、个性化触达",
    "Validates Mermaid syntax, renders diagrams as high-quality SVG, and displays them instantly in an interactiv...": "验证 Mermaid 语法，将图表渲染为高质量 SVG，在交互式...中即时展示",
    "Validates Mermaid syntax, renders diagrams as high-quality SVG, and displays them instantly in an interactiv…": "验证 Mermaid 语法，将图表渲染为高质量 SVG，在交互式…中即时展示",
    "Create shareable documents, one-pagers, and decks": "创建可分享的文档、单页和演示稿",
    "SEO & AI search analytics": "SEO 和 AI 搜索分析",
    "SEO and AI search analytics": "SEO 和 AI 搜索分析",

    "Search biomedical literature from PubMed": "搜索 PubMed 的生物医学文献",
    "Find buyers. Book more meetings. Close more deals.": "找买家。约更多会议。促成更多交易。",
    "Up-to-date docs for LLMs and AI code editors": "为 LLM 和 AI 代码编辑器提供最新文档",
    "Access and run your n8n workflows": "访问并运行你的 n8n 工作流",
    "Retrieve both structured and unstructured data": "检索结构化和非结构化数据",
    "Payment processing and financial infrastructure tools": "支付处理与金融基础设施工具",
    "Evidence-based answers grounded in research": "基于研究、有证据支持的回答",
    "Turn feedback into decisions": "把反馈转化为决策",
    "Manage event types, availability, and bookings.": "管理活动类型、可用性和预订。",
    "Manage event types, availability, and bookings": "管理活动类型、可用性和预订",
    "Find tickets on the World's Largest Ticket Marketplace": "在全球最大的票务市场上找票",
    "Find tickets on the World’s Largest Ticket Marketplace": "在全球最大的票务市场上找票",
    "Track and analyze your finances with Digits": "用 Digits 跟踪和分析你的财务",
    "Groceries and more delivered as fast as 30 minutes": "杂货等商品最快 30 分钟送达",

    // === 插件 Details 面板 ===
    "Details": "详情",
    "Connector URL": "连接器 URL",
    "More info": "更多信息",
    "info": "信息",
    "Documentation": "文档",
    "Support": "支持",
    "Developed by": "开发者：",
    "Only use connectors from developers you trust. Anthropic does not control which tools developers make available and cannot verify that they will work as intended or that they won't change.": "仅使用你信任的开发者的连接器。Anthropic 不控制开发者提供哪些工具，也无法验证它们是否按预期工作或是否会变更。",
    "Only use connectors from developers you trust. Anthropic does not control which tools developers make available and cannot verify that they will work as intended or that they won’t change.": "仅使用你信任的开发者的连接器。Anthropic 不控制开发者提供哪些工具，也无法验证它们是否按预期工作或是否会变更。",
    "Only use connectors from developers you trust.": "仅使用你信任的开发者的连接器。",
    "Tools": "工具",

    // === 插件描述 (三批) ===
    "Price bonds, analyze yield curves, evaluate FX carry trades, value options, and build macro dashboards usin...": "债券定价、分析收益率曲线、评估外汇套息交易、期权估值、构建宏观仪表盘...",
    "Price bonds, analyze yield curves, evaluate FX carry trades, value options, and build macro dashboards usin…": "债券定价、分析收益率曲线、评估外汇套息交易、期权估值、构建宏观仪表盘…",
    "S&P Global - Financial data and analytics skills including company tearsheets, earnings previews, and transactio...": "标普全球 - 金融数据和分析 skill，包括公司简报、收益预告、交易...",
    "S&P Global - Financial data and analytics skills including company tearsheets, earnings previews, and transactio…": "标普全球 - 金融数据和分析 skill，包括公司简报、收益预告、交易…",
    "Work with your Box content directly from Claude Code — search files, organize folders, collaborate with your tea...": "在 Claude Code 中直接处理你的 Box 内容 — 搜索文件、整理文件夹、与团队协作...",
    "Work with your Box content directly from Claude Code — search files, organize folders, collaborate with your tea…": "在 Claude Code 中直接处理你的 Box 内容 — 搜索文件、整理文件夹、与团队协作…",
    "View, annotate, and sign PDFs in a live interactive viewer. Mark up contracts, fill forms with visual feedback, stam...": "在交互式查看器中查看、批注、签署 PDF。标记合同、用视觉反馈填表单...",
    "View, annotate, and sign PDFs in a live interactive viewer. Mark up contracts, fill forms with visual feedback, stam…": "在交互式查看器中查看、批注、签署 PDF。标记合同、用视觉反馈填表单…",
    "Brings together Adobe Creative Cloud tools for images, vectors, design, and video. Edit multiple assets at once,...": "整合 Adobe Creative Cloud 的图像、矢量、设计、视频工具。一次性编辑多个素材...",
    "Brings together Adobe Creative Cloud tools for images, vectors, design, and video. Edit multiple assets at once,…": "整合 Adobe Creative Cloud 的图像、矢量、设计、视频工具。一次性编辑多个素材…",
    "Figma design platform integration. Access design files, extract component information, read design tokens, and...": "Figma 设计平台集成。访问设计文件、提取组件信息、读取设计 token...",
    "Figma design platform integration. Access design files, extract component information, read design tokens, and…": "Figma 设计平台集成。访问设计文件、提取组件信息、读取设计 token…",
    "AI agent skills that make SaaS products data-ready for product analytics — from codebase scan to tracking pla...": "让 SaaS 产品数据准备好用于产品分析的 AI agent skill — 从代码库扫描到追踪计划...",
    "AI agent skills that make SaaS products data-ready for product analytics — from codebase scan to tracking pla…": "让 SaaS 产品数据准备好用于产品分析的 AI agent skill — 从代码库扫描到追踪计划…",
    "Atlan data catalog plugin for Claude Code. Search, explore, govern, and manage your data assets through...": "Claude Code 的 Atlan 数据目录插件。搜索、探索、治理、管理你的数据资产...",
    "Atlan data catalog plugin for Claude Code. Search, explore, govern, and manage your data assets through…": "Claude Code 的 Atlan 数据目录插件。搜索、探索、治理、管理你的数据资产…",
    "Free AI-powered SEO toolkit — audit websites, plan content strategy, optimize pages, generate schema...": "免费 AI 驱动的 SEO 工具包 — 审计网站、规划内容策略、优化页面、生成 schema...",
    "Free AI-powered SEO toolkit — audit websites, plan content strategy, optimize pages, generate schema…": "免费 AI 驱动的 SEO 工具包 — 审计网站、规划内容策略、优化页面、生成 schema…",
    "Web scraping, Google search, structured data extraction, and MCP server integration powered by Bright Data....": "网页抓取、Google 搜索、结构化数据提取，由 Bright Data 驱动的 MCP 服务器集成。",
    "Web scraping, Google search, structured data extraction, and MCP server integration powered by Bright Data.": "网页抓取、Google 搜索、结构化数据提取，由 Bright Data 驱动的 MCP 服务器集成。",

    "Nimble web data toolkit — search, extract, map, crawl the web and work with structured data agents": "Nimble 网络数据工具包 — 搜索、提取、绘制、爬取网页，与结构化数据 agent 协作",
    "Use Cloudinary directly in Claude. Manage assets, apply transformations, optimize media, and more through...": "在 Claude 中直接使用 Cloudinary。管理资产、应用变换、优化媒体，通过...更多",
    "Use Cloudinary directly in Claude. Manage assets, apply transformations, optimize media, and more through…": "在 Claude 中直接使用 Cloudinary。管理资产、应用变换、优化媒体，通过…更多",
    "Fastly development tools and platform skills": "Fastly 开发工具和平台 skill",
    "Prisma MCP integration for Postgres database management, schema migrations, SQL queries, and...": "Prisma 的 MCP 集成，用于 Postgres 数据库管理、schema 迁移、SQL 查询...",
    "Prisma MCP integration for Postgres database management, schema migrations, SQL queries, and…": "Prisma 的 MCP 集成，用于 Postgres 数据库管理、schema 迁移、SQL 查询…",
    "CockroachDB plugin for Claude Code — explore schemas, write optimized SQL, debug queries, and manage…": "Claude Code 的 CockroachDB 插件 — 探索 schema、编写优化的 SQL、调试查询、管理…",
    "CockroachDB plugin for Claude Code — explore schemas, write optimized SQL, debug queries, and manage...": "Claude Code 的 CockroachDB 插件 — 探索 schema、编写优化的 SQL、调试查询、管理...",
    "Financial analysis skills powered by Daloopa's institutional-grade data": "由 Daloopa 机构级数据驱动的金融分析 skill",
    "Financial analysis skills powered by Daloopa’s institutional-grade data": "由 Daloopa 机构级数据驱动的金融分析 skill",
    "Intercom integration for Claude Code. Search conversations, analyze customer support patterns, look...": "Claude Code 的 Intercom 集成。搜索对话、分析客服模式、查找...",
    "Intercom integration for Claude Code. Search conversations, analyze customer support patterns, look…": "Claude Code 的 Intercom 集成。搜索对话、分析客服模式、查找…",
    "Search companies and contacts, enrich leads, find lookalikes, and get AI-ranked contact recommendation...": "搜索公司和联系人、丰富线索、寻找相似客户、获得 AI 排序的联系人推荐...",
    "Search companies and contacts, enrich leads, find lookalikes, and get AI-ranked contact recommendation…": "搜索公司和联系人、丰富线索、寻找相似客户、获得 AI 排序的联系人推荐…",
    "Sanity content platform integration with MCP server, agent skills, and slash commands. Query and author...": "Sanity 内容平台集成，含 MCP 服务器、agent skill、斜杠命令。查询和编写...",
    "Sanity content platform integration with MCP server, agent skills, and slash commands. Query and author…": "Sanity 内容平台集成，含 MCP 服务器、agent skill、斜杠命令。查询和编写…",
    "Cross-platform ad management for Google Ads, Meta Ads, TikTok Ads, and LinkedIn Ads. 91 tools for keywo...": "跨平台广告管理，适用于 Google Ads、Meta Ads、TikTok Ads、LinkedIn Ads。91 个工具用于 keywo...",

    "An authenticated hosted MCP server that accesses your PlanetScale organizations, databases, branches, schema...": "经认证的托管 MCP 服务器，访问你的 PlanetScale 组织、数据库、分支、schema...",
    "An authenticated hosted MCP server that accesses your PlanetScale organizations, databases, branches, schema…": "经认证的托管 MCP 服务器，访问你的 PlanetScale 组织、数据库、分支、schema…",
    "Secure access to Miro boards. Enables AI to read board context, create diagrams, and generate code with...": "安全访问 Miro 看板。让 AI 读取看板上下文、创建图表、生成代码...",
    "Secure access to Miro boards. Enables AI to read board context, create diagrams, and generate code with…": "安全访问 Miro 看板。让 AI 读取看板上下文、创建图表、生成代码…",
    "Plan, build, and debug Zoom integrations across REST APIs, Meeting SDK, Video SDK, webhooks, bots, and M...": "规划、构建和调试 Zoom 集成，涵盖 REST API、Meeting SDK、Video SDK、webhook、bot 和 M...",
    "Plan, build, and debug Zoom integrations across REST APIs, Meeting SDK, Video SDK, webhooks, bots, and M…": "规划、构建和调试 Zoom 集成，涵盖 REST API、Meeting SDK、Video SDK、webhook、bot 和 M…",
    "Official Bigdata.com plugin providing financial research, analytics, and intelligence tools powered by Bigdata MCP.": "Bigdata.com 官方插件，由 Bigdata MCP 驱动，提供金融研究、分析和情报工具。",
    "Optimize business operations — vendor management, process documentation, change management, capacity...": "优化业务运营 — 供应商管理、流程文档、变更管理、容量...",
    "Optimize business operations — vendor management, process documentation, change management, capacity…": "优化业务运营 — 供应商管理、流程文档、变更管理、容量…",
    "Discover your brand voice from existing documents and conversations, generate enforceable guidelines, and...": "从现有文档和对话中发现你的品牌语调，生成可执行的指南...",
    "Discover your brand voice from existing documents and conversations, generate enforceable guidelines, and…": "从现有文档和对话中发现你的品牌语调，生成可执行的指南…",
    "Accelerate design workflows — critique, design system management, UX writing, accessibility audits, research...": "加速设计工作流 — 评审、设计系统管理、UX 写作、可访问性审计、研究...",
    "Accelerate design workflows — critique, design system management, UX writing, accessibility audits, research…": "加速设计工作流 — 评审、设计系统管理、UX 写作、可访问性审计、研究…",
    "Streamline people operations — recruiting, onboarding, performance reviews, compensation analysis, and polic...": "简化人事运营 — 招聘、入职、绩效评估、薪酬分析、polic...",
    "Streamline people operations — recruiting, onboarding, performance reviews, compensation analysis, and polic…": "简化人事运营 — 招聘、入职、绩效评估、薪酬分析、polic…",
    "Streamline engineering workflows — standups, code review, architecture decisions, incident response, and...": "简化工程工作流 — 站会、代码评审、架构决策、事故响应...",
    "Streamline engineering workflows — standups, code review, architecture decisions, incident response, and…": "简化工程工作流 — 站会、代码评审、架构决策、事故响应…",
    "Turn Common Room into your GTM copilot. Research accounts and contacts, prep for calls with attendee...": "把 Common Room 变成你的 GTM 副驾。调研账户和联系人、为通话准备与会者信息...",
    "Turn Common Room into your GTM copilot. Research accounts and contacts, prep for calls with attendee…": "把 Common Room 变成你的 GTM 副驾。调研账户和联系人、为通话准备与会者信息…",

    // === 套餐页 / 升级页 / Max 订阅 ===
    "Plans that grow with you": "随你成长的套餐",
    "Individual": "个人版",
    "Free": "免费",
    "Meet Claude": "认识 Claude",
    "Use Claude for free": "免费使用 Claude",
    "Chat on web, iOS, Android, and desktop": "在网页、iOS、Android 和桌面端聊天",
    "Generate code and visualize data": "生成代码、可视化数据",
    "Connect Slack and Google Workspace": "连接 Slack 和 Google Workspace",
    "Extended thinking for complex work": "复杂工作支持扩展思考",
    "Built-in web search": "内置网页搜索",
    "Deep research, code, and organize": "深度研究、编程、整理",
    "billed annually": "按年计费",
    "billed monthly": "按月计费",
    "Yearly": "年付",
    "Monthly": "月付",
    "Get Pro plan": "选择 Pro 套餐",
    "Get Max plan": "选择 Max 套餐",
    "Claude Code directly in your codebase": "在你的代码库中直接使用 Claude Code",
    "Power through tasks with Cowork": "用 Cowork 加速完成任务",
    "Higher usage limits": "更高的用量上限",
    "Deep research and analysis": "深度研究和分析",
    "Memory that carries across conversations": "跨对话保留的记忆",
    "Higher limits, priority access": "更高用量上限，优先访问",
    "Higher limits": "更高用量上限",
    "priority access": "优先访问",
    "Priority access": "优先访问",
    "No commitment · Cancel anytime": "无承诺 · 随时取消",
    "No commitment": "无承诺",
    "Cancel anytime": "随时取消",
    "Recommended for Claude Code & Cowork": "推荐用于 Claude Code 和 Cowork",
    "Early access to advanced Claude features": "抢先体验 Claude 高级功能",
    "Higher output limits for all tasks": "所有任务的输出上限更高",
    "Priority access at high traffic times": "高峰时段优先访问",

    // === Teams / Enterprise 套餐页 ===
    "Predictable usage per seat": "每席位用量稳定",
    "Flexible pooled usage": "灵活的共享用量",
    "Standard seat": "标准席位",
    "Premium seat": "高级席位",
    "All Claude features, plus more usage than Pro": "所有 Claude 功能，且用量比 Pro 多",
    "All Claude features, plus more usage than Pro*": "所有 Claude 功能，且用量比 Pro 多*",
    "5x more usage than standard seats": "用量是标准席位的 5 倍",
    "5x more usage than standard seats*": "用量是标准席位的 5 倍*",
    "5x more usage than Pro": "用量是 Pro 的 5 倍",
    "200K context window": "200K 上下文窗口",
    "500K context window": "500K 上下文窗口",
    "context window": "上下文窗口",
    "Extra usage available at API rates": "额外用量按 API 费率计费",
    "Central billing and administration": "集中计费与管理",
    "Single sign-on (SSO) and domain capture": "单点登录 (SSO) 与域名认领",
    "Admin controls for remote and local connectors": "远程和本地连接器的管理员控制",
    "Enterprise deployment for the Claude desktop app": "Claude 桌面应用的企业版部署",
    "Enterprise search across your organization": "组织级企业搜索",
    "Connect Microsoft 365, Slack, and more": "连接 Microsoft 365、Slack 等",
    "No model training on your content by default": "默认不使用你的内容训练模型",
    "Work email address required.": "需要工作邮箱地址。",
    "Work email address required": "需要工作邮箱地址",
    // === 企业版/团队版 onboarding ===
    // Enterprise→企业版 / Team→团队版 / More→更多 / None→无 词条会 partial 拆词, 整短语 exact 优先
    "Set up your Enterprise plan": "设置你的企业版套餐",
    "Set up your Team plan": "设置你的团队版套餐",
    "Work email": "工作邮箱",
    "Enter your work email to get started. We'll send you a sign-in link.": "输入你的工作邮箱即可开始。我们会给你发送一个登录链接。",
    "Enter your work email to get started. We’ll send you a sign-in link.": "输入你的工作邮箱即可开始。我们会给你发送一个登录链接。",
    "Enterprise plans require a work email. Try your company address.": "企业版套餐需要工作邮箱。请改用你的公司邮箱地址。",
    "Team plans require a work email. Try your company address.": "团队版套餐需要工作邮箱。请改用你的公司邮箱地址。",
    // 团队需求勾选页
    "Does your team need any of these?": "你的团队需要以下任何一项吗？",
    "If yes, you'll need to contact our sales team to get started.": "如果需要，你得联系我们的销售团队才能开始。",
    "If yes, you’ll need to contact our sales team to get started.": "如果需要，你得联系我们的销售团队才能开始。",
    "More than 500 seats": "超过 500 个席位",
    "HIPAA-ready offering": "支持 HIPAA 的方案",
    "Tailored contract (usage commitments, product bundling)": "定制合同（用量承诺、产品打包）",
    "None of the above": "以上都不需要",
    // 邮箱验证链接已发送页 (email 是加粗独立节点 → lead + trailing 片段; Enterprise/Team 两版 trailing)
    "We sent a link to": "我们已向",
    ". Close this tab and click the link in your email to continue setting up your Enterprise plan.": " 发送了链接。关闭此标签页并点击邮件中的链接，以继续设置你的企业版套餐。",
    ". Close this tab and click the link in your email to continue setting up your Team plan.": " 发送了链接。关闭此标签页并点击邮件中的链接，以继续设置你的团队版套餐。",
    ". Close this tab and click the link in your email to continue setting up your team.": " 发送了链接。关闭此标签页并点击邮件中的链接，以继续设置你的团队。",
    "Not seeing the email?": "没看到邮件？",
    "Try sending again": "重新发送",
    "Seat price + usage at API rates": "席位价格 + 按 API 费率计费用量",
    "API rates": "API 费率",
    "USD 20/seat. Usage cost scales with model and task.": "USD 20/席位。使用成本随模型和任务而变。",
    "Pay-as-you-go pricing with pooled usage across your org": "按使用付费，组织内用量共享",
    "Set user and org spend limits": "设置用户和组织的支出限额",
    "Role-based access with fine grained permissioning": "基于角色的访问控制，细粒度权限",
    "System for Cross-domain Identity Management (SCIM)": "跨域身份管理系统 (SCIM)",
    "Audit logs": "审计日志",
    "Compliance API for observability and monitoring": "用于可观测和监控的合规 API",
    "Network-level access control": "网络级访问控制",
    "Custom data retention controls": "自定义数据保留控制",
    "IP allowlisting": "IP 白名单",
    "Google Docs cataloging": "Google 文档编目",
    "A work email address is required to create an Enterprise account. Contact sales to learn more.": "需要工作邮箱地址才能创建企业账号。联系销售了解更多。",
    "A work email address is required to create an Enterprise account.": "需要工作邮箱地址才能创建企业账号。",
    "Contact sales to learn more.": "联系销售了解更多。",
    "Contact sales": "联系销售",
    "to learn more": "了解更多",
    "to learn more.": "了解更多。",
    "limits apply.": "限制适用。",
    "limits apply": "限制适用",
    "Usage limits apply.": "用量限制适用。",
    "Usage limits apply": "用量限制适用",
    "Prices shown don't include applicable tax. Prices and plans are subject to change at Anthropic's discretion.": "显示价格不含适用税费。价格和套餐可能由 Anthropic 自行决定更改。",
    "Prices shown don’t include applicable tax. Prices and plans are subject to change at Anthropic’s discretion.": "显示价格不含适用税费。价格和套餐可能由 Anthropic 自行决定更改。",
    "Prices shown don't include applicable tax.": "显示价格不含适用税费。",
    "Prices shown don’t include applicable tax.": "显示价格不含适用税费。",
    "Prices and plans are subject to change at Anthropic's discretion.": "价格和套餐可能由 Anthropic 自行决定更改。",
    "Prices and plans are subject to change at Anthropic’s discretion.": "价格和套餐可能由 Anthropic 自行决定更改。",

    // === Max checkout 页 ===
    "Order details": "订单详情",
    "Order": "订单",
    "Subtotal": "小计",
    "Total due today": "今日应付总额",

    // === 升级提示卡片 ===
    "Claude understands your codebase and helps you build, debug, and ship faster. Upgrade your plan to get started.": "Claude 理解你的代码库，帮你更快地构建、调试和发布。升级套餐即可开始。",
    "Claude understands your codebase and helps you build, debug, and ship faster.": "Claude 理解你的代码库，帮你更快地构建、调试和发布。",
    "Upgrade your plan to get started.": "升级套餐即可开始。",
    "Upgrade your plan to get started": "升级套餐即可开始",
    "Upgrade to Max or Pro": "升级到 Max 或 Pro",
    "Upgrade to Pro": "升级到 Pro",
    "Upgrade to Max": "升级到 Max",

    // === 通用版本对比 ===
    "Everything in Free and:": "包含 Free 全部内容，加上：",
    "Everything in Pro, plus:": "包含 Pro 全部内容，加上：",
    "Everything in Pro and:": "包含 Pro 全部内容，加上：",
    "Everything in Team, plus:": "包含团队版全部内容，加上：",
    "Everything in Team and:": "包含团队版全部内容，加上：",
    "All Team features, plus:": "包含团队版全部功能，加上：",
    "All Free features, plus:": "包含 Free 全部功能，加上：",
    "All Pro features, plus:": "包含 Pro 全部功能，加上：",
    "Up to 20x more usage than Pro": "用量最高是 Pro 的 20 倍",
    "Up to 20x more usage than Pro*": "用量最高是 Pro 的 20 倍*",

    // === 设置 - 代码执行权限 ===
    "Code execution and file creation": "代码执行和文件创建",
    "Claude can execute code and create and edit docs, spreadsheets, presentations, PDFs, and data reports. Required for skills.": "Claude 可以执行代码，创建并编辑文档、表格、演示文稿、PDF 和数据报告。skills 功能需要开启。",
    "Claude can execute code and create and edit docs, spreadsheets, presentations, PDFs, and data reports.": "Claude 可以执行代码，创建并编辑文档、表格、演示文稿、PDF 和数据报告。",
    "Required for skills.": "skills 功能需要开启。",
    "Required for skills": "skills 功能需要开启",
    "Allow outbound network": "允许出站网络",
    "Allow Claude to access common package managers to install packages and libraries for data analysis, visualizations, and file processing. View package manager domains. Monitor chats closely as this comes with security risks.": "允许 Claude 访问常用包管理器，安装用于数据分析、可视化、文件处理的包和库。查看包管理器域名。请密切留意对话内容，这有安全风险。",
    "Allow Claude to access common package managers to install packages and libraries for data analysis, visualizations, and file processing.": "允许 Claude 访问常用包管理器，安装用于数据分析、可视化、文件处理的包和库。",
    "View package manager domains.": "查看包管理器域名。",
    "View package manager domains": "查看包管理器域名",
    "Monitor chats closely as this comes with security risks.": "请密切留意对话内容，这有安全风险。",
    "Monitor chats closely as this comes with security risks": "请密切留意对话内容，这有安全风险",
    "security risks": "安全风险",
    "security risk": "安全风险",

    // === 免费套餐宣传项 (Try Claude) ===
    "Try Claude": "试用 Claude",
    "Chat on web, iOS, Android, and on your desktop": "在网页、iOS、Android 和你的桌面端聊天",
    "Write, edit, and create content": "写作、编辑、创建内容",
    "Analyze text and images": "分析文本和图像",
    "Ability to search web": "网页搜索能力",
    "Ability to search the web": "网页搜索能力",
    "Create files and execute code": "创建文件和执行代码",
    "Unlock more from Claude with desktop extensions": "用桌面扩展解锁 Claude 的更多能力",
    "Connect Slack and Google Workspace services": "连接 Slack 和 Google Workspace 服务",
    "Integrate any context or tool through connectors with remote MCP": "通过远程 MCP 连接器集成任意上下文或工具",

    // === 发票页 ===
    "Invoices": "发票",
    "We have not sent you an invoice yet.": "还没给你开过发票。",
    "We have not sent you an invoice yet": "还没给你开过发票",

    // === 删除 session 对话框 ===
    "Delete session?": "删除会话？",
    "Delete session": "删除会话",
    "session?": "会话？",
    "This can't be undone.": "此操作无法撤销。",
    "This can't be undone": "此操作无法撤销",
    "This can’t be undone.": "此操作无法撤销。",
    "This can’t be undone": "此操作无法撤销",
    "will be permanently deleted.": "将被永久删除。",
    "will be permanently deleted": "将被永久删除",

    // === 右键菜单 / 分组 ===
    "Open in...": "在……中打开",
    "Open in": "在……中打开",
    "VS Code": "VS Code",
    "Explorer": "资源管理器",
    "Move to group": "移到分组",
    "New group...": "新建分组...",
    "New group…": "新建分组…",
    "New group": "新建分组",
    "Group name": "分组名",
    "Pin": "置顶",
    "Mark as unread": "标为未读",
    "Rename": "重命名",
    "Fork": "分叉",
    "Archive": "归档",
    "Delete": "删除",

    // === 虚拟机平台未启用提示 ===
    "Virtual Machine Platform not available": "虚拟机平台不可用",
    "Claude's workspace requires the Virtual Machine Platform on Windows. Enable this feature, then restart.": "Claude 工作区需要启用 Windows 的虚拟机平台。启用后重启。",
    "Claude’s workspace requires the Virtual Machine Platform on Windows. Enable this feature, then restart.": "Claude 工作区需要启用 Windows 的虚拟机平台。启用后重启。",
    "Claude's workspace requires the Virtual Machine Platform on Windows.": "Claude 工作区需要启用 Windows 的虚拟机平台。",
    "Claude’s workspace requires the Virtual Machine Platform on Windows.": "Claude 工作区需要启用 Windows 的虚拟机平台。",
    "Enable this feature, then restart.": "启用后重启。",
    "Enable this feature, then restart": "启用后重启",
    "Enable": "启用",

    // === 无痕模式 ===
    "Use incognito": "无痕模式",
    "Incognito chat": "无痕对话",
    "Incognito": "无痕",
    "Greetings, whoever you are": "你好，无论你是谁",
    "Incognito chats aren't saved, added to memory, or used to train models.": "无痕对话不会被保存、不进入记忆，也不会用于训练模型。",
    "Incognito chats aren’t saved, added to memory, or used to train models.": "无痕对话不会被保存、不进入记忆，也不会用于训练模型。",
    "Incognito chats aren't saved, added to memory, or used to train models": "无痕对话不会被保存、不进入记忆，也不会用于训练模型",
    "Incognito chats aren’t saved, added to memory, or used to train models": "无痕对话不会被保存、不进入记忆，也不会用于训练模型",
    "Learn more about how your data is used.": "了解你的数据如何被使用。",
    "Learn more about how your data is used": "了解你的数据如何被使用",
    "about how your data is used.": "了解你的数据如何被使用。",
    "about how your data is used": "了解你的数据如何被使用",
    "how your data is used": "你的数据如何被使用",

    // === 连接器迁移说明 ===
    // 注意: 前半句"Connectors have moved to <a>Personalization</a>"那个链接打断了文本节点,
    // 剩下这部分文本节点开头带个句号(链接结束后立刻是".") — 加带句号变体。
    "Head there to browse, connect, and manage them.": "去那里浏览、连接、管理。",
    "Head there to browse, connect, and manage them": "去那里浏览、连接、管理",
    ". Head there to browse, connect, and manage them.": "。去那里浏览、连接、管理。",
    ". Head there to browse, connect, and manage them": "。去那里浏览、连接、管理",

    // === 设置 - 外观 / 字体 ===
    "Appearance": "外观",
    "appearance": "外观",
    "Code appearance": "代码外观",
    "Font": "字体",
    "font": "字体",
    "Code font": "代码字体",
    "Set a custom monospace font for code and terminal.": "为代码和终端设置自定义等宽字体。",
    "Set a custom monospace font for code and terminal": "为代码和终端设置自定义等宽字体",
    "e.g. JetBrains Mono": "例如 JetBrains Mono",

    // === 设置 - 会话状态分类 ===
    "Classify session states": "会话状态分类",
    "Allow Claude to automatically classify sessions as blocked, ready for review, or done. Classifying sessions counts towards your plan usage. Applies to new sessions.": "让 Claude 自动把会话分类为「阻塞」「待审查」「完成」。分类计入套餐用量，仅对新会话生效。",
    "Allow Claude to automatically classify sessions as blocked, ready for review, or done.": "让 Claude 自动把会话分类为「阻塞」「待审查」「完成」。",
    "Classifying sessions counts towards your plan usage.": "分类计入套餐用量。",
    "Applies to new sessions.": "仅对新会话生效。",
    "Applies to new sessions": "仅对新会话生效",

    // === 设置 - 本地 sessions ===
    "Local sessions": "本地会话",
    "Enable remote control by default": "默认启用远程控制",
    "Automatically connect new local sessions to Remote Control so you can continue them from the CLI or claude.ai/code.": "自动把新本地会话连到远程控制，让你能在 CLI 或 claude.ai/code 接着用。",
    "Remote Control": "远程控制",

    // === 代码主题名 (产品名 / brand 标识，保留原文) ===
    // 下拉关闭时触发按钮显示当前选中项，这里没 role="option" 跳过，用字典 identity 映射兜底。
    "Claude Dark": "Claude Dark",
    "Claude Light": "Claude Light",
    "GitHub Dark": "GitHub Dark",
    "GitHub Light": "GitHub Light",
    "GitHub Dark Dimmed": "GitHub Dark Dimmed",
    "GitHub Light Dimmed": "GitHub Light Dimmed",
    "Pierre Dark": "Pierre Dark",
    "Pierre Light": "Pierre Light",
    "One Dark Pro": "One Dark Pro",
    "One Dark": "One Dark",
    "One Light": "One Light",
    "Dracula": "Dracula",
    "Dracula Soft": "Dracula Soft",
    "Catppuccin Mocha": "Catppuccin Mocha",
    "Catppuccin Macchiato": "Catppuccin Macchiato",
    "Catppuccin Frappe": "Catppuccin Frappe",
    "Catppuccin Frappé": "Catppuccin Frappé",
    "Catppuccin Latte": "Catppuccin Latte",
    "Nord": "Nord",
    "Solarized Dark": "Solarized Dark",
    "Solarized Light": "Solarized Light",
    "Monokai": "Monokai",
    "Monokai Pro": "Monokai Pro",
    "Tokyo Night": "Tokyo Night",
    "Tokyo Night Storm": "Tokyo Night Storm",
    "Tokyo Night Light": "Tokyo Night Light",
    "Atom One Dark": "Atom One Dark",
    "Atom One Light": "Atom One Light",
    "Ayu Dark": "Ayu Dark",
    "Ayu Mirage": "Ayu Mirage",
    "Ayu Light": "Ayu Light",
    "Material Theme": "Material Theme",
    "Material Theme Lighter": "Material Theme Lighter",
    "Material Theme Darker": "Material Theme Darker",
    "Gruvbox Dark": "Gruvbox Dark",
    "Gruvbox Light": "Gruvbox Light",
    "Night Owl": "Night Owl",
    "Light Owl": "Light Owl",

    // === 过滤 / 分组 / 排序下拉 ===
    "Cloud": "云端",
    "State": "状态",
    "Custom groups": "自定义分组",
    "Group by": "分组方式",
    "Sort": "排序",
    "Sort by": "排序",
    "Environment": "环境",
    "Last activity": "最后活动",
    "Alphabetical": "按字母顺序",
    "Most recent": "按最近",
    "Date": "日期",
    "Project": "项目",
    "None": "无",

    // === 工作流 / 模板 ===
    "Or start from a template": "或从模板开始",
    "from a template": "从模板开始",
    "Briefing": "简报",
    "Summary of your calendar, emails, and messages.": "你的日历、邮件、消息的汇总。",
    "Email triage": "邮件分类",
    "Categorize and prioritize your inbox, with draft responses for urgent items.": "为邮箱分类排序，为紧急邮件起草回复。",
    "System health check": "系统健康检查",
    "health check": "健康检查",
    "Monitor infrastructure and services for errors, outages, and performance issues.": "监控基础设施和服务，关注错误、宕机和性能问题。",
    "Issue triage": "问题分类",
    "Review and categorize incoming issues, bugs, and feature requests.": "审查并分类收到的 issue、bug 和功能请求。",
    "PR review digest": "PR 评审摘要",
    "Overview of open PRs, review status, and what needs attention.": "未关闭 PR 的概览、评审状态、需要关注的内容。",
    "Dependency update check": "依赖更新检查",
    "Scan for outdated packages, security patches, and breaking changes.": "扫描过期包、安全补丁和破坏性变更。",
    "Release notes drafter": "发布说明起草",
    "Draft user-facing release notes each time a PR merges to the main branch.": "每次有 PR 合并到主分支时，起草面向用户的发布说明。",
    "Triggered by pull request closed": "触发条件：pull request 关闭",
    "Flaky test tracker": "不稳定测试追踪",
    "Find tests that pass and fail intermittently across recent CI runs.": "查找最近 CI 运行里时过时挂的测试。",
    "Works with": "支持",

    // === 新建工作流表单 ===
    "e.g., Daily code review": "例如：每日代码评审",
    "Describe what Claude should do in each session": "描述每次会话中 Claude 应该做什么",
    "Select a repository": "选择仓库",
    "Select an environment": "选择环境",
    "Select a trigger": "选择触发器",
    "Select a repository first": "先选择仓库",
    "Add environment": "添加环境",
    "Add another trigger": "添加另一个触发器",
    "another trigger": "另一个触发器",
    "Behavior": "行为",
    "Permissions": "权限",
    "Integrations available to Claude during each run.": "每次运行中 Claude 可用的集成。",
    "Integrations available to Claude during each run": "每次运行中 Claude 可用的集成",

    // === 新建云端环境对话框 ===
    "New cloud environment": "新建云端环境",
    "cloud environment": "云端环境",
    "Default": "默认",
    "Network access": "网络访问",
    "Learn more about our network policy and access levels.": "了解我们的网络政策和访问级别。",
    "Learn more about our network policy and access levels": "了解我们的网络政策和访问级别",
    "network policy": "网络政策",
    "access levels": "访问级别",
    "Trusted": "可信",
    "Untrusted": "不可信",
    "Restricted": "受限",
    "Environment variables": "环境变量",
    "In .env format. These are visible to anyone using this environment — don't add secrets or credentials.": ".env 格式。本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    "In .env format. These are visible to anyone using this environment — don't add secrets or credentials": ".env 格式。本环境的所有使用者都能看到 — 不要放密钥或凭据",
    "In .env format. These are visible to anyone using this environment — don’t add secrets or credentials.": ".env 格式。本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    "In .env format.": ".env 格式。",
    ".env format": ".env 格式",
    "These are visible to anyone using this environment — don't add secrets or credentials.": "本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    "These are visible to anyone using this environment — don’t add secrets or credentials.": "本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    "Setup script": "启动脚本",
    "Bash script that runs when a new session starts, before Claude Code launches.": "新会话启动时、Claude Code 启动前运行的 Bash 脚本。",
    "Bash script that runs when a new session starts, before Claude Code launches": "新会话启动时、Claude Code 启动前运行的 Bash 脚本",
    "Create environment": "创建环境",

    // === 触发器选项 ===
    "GitHub event": "GitHub 事件",
    "Run when a GitHub webhook event fires": "GitHub webhook 事件触发时运行",
    "Trigger from your own code by sending a POST request": "通过你自己的代码发送 POST 请求触发",

    // === 行为 / 权限 tab ===
    "Auto-fix pull requests": "自动修复 pull request",
    "Watch CI and review comments on PRs this routine opens, and let Claude push fixes.": "监控这个定时任务开的 PR 的 CI 和评审评论，让 Claude 推送修复。",
    "Watch CI and review comments on PRs this routine opens, and let Claude push fixes": "监控这个定时任务开的 PR 的 CI 和评审评论，让 Claude 推送修复",
    "Add a repository to configure permissions.": "添加仓库后配置权限。",
    "Add a repository to configure permissions": "添加仓库后配置权限",

    // === API 触发器卡片 ===
    "Call via API": "通过 API 调用",
    "Token will be generated when you save.": "保存时会生成 token。",
    "Token will be generated when you save": "保存时会生成 token",

    // === 链接打断文本节点导致的句子片段 (网络访问说明 / .env 格式说明等) ===
    // 含 <a> 链接的整句，链接会把文本拆成多个 textNode; 单独配前缀/后缀片段。
    // 翻译函数 trim() 后再查字典，因此 key 不能带前后空格。
    "Learn more about our": "了解我们的",
    "about our": "我们的",
    // <a>.env format</a> 链接后面跟着 ". These are visible..." 整句，作为单独 textNode
    ". These are visible to anyone using this environment — don't add secrets or credentials.": "。本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    ". These are visible to anyone using this environment — don't add secrets or credentials": "。本环境的所有使用者都能看到 — 不要放密钥或凭据",
    ". These are visible to anyone using this environment — don’t add secrets or credentials.": "。本环境的所有使用者都能看到 — 不要放密钥或凭据。",
    ". These are visible to anyone using this environment — don’t add secrets or credentials": "。本环境的所有使用者都能看到 — 不要放密钥或凭据",

    // === 账户封禁 / 审核(hold) 流程 + FAQ ===
    "account_banned": "账号已封禁",
    "We got your request": "我们已收到你的请求",
    "We'll email you after we review your account. Until then, you won't be able to use Claude, but you can come back to this page to check the status.": "我们会在审核你的账户后邮件通知你。在此之前你将无法使用 Claude，但可以随时回到此页面查看状态。",
    "We’ll email you after we review your account. Until then, you won’t be able to use Claude, but you can come back to this page to check the status.": "我们会在审核你的账户后邮件通知你。在此之前你将无法使用 Claude，但可以随时回到此页面查看状态。",
    "Request received": "已收到请求",
    "We'll review your account": "我们将审核你的账户",
    "We’ll review your account": "我们将审核你的账户",
    "You're next in line for review": "你是下一个待审核的",
    "You’re next in line for review": "你是下一个待审核的",
    "We'll email you the outcome": "我们会把结果邮件通知你",
    "We’ll email you the outcome": "我们会把结果邮件通知你",
    "Taking a little longer than expected": "比预期稍久",
    "Need urgent help?": "需要紧急帮助？",
    "Contact support": "联系支持",
    "What you can do": "你可以做什么",
    "Export your data": "导出你的数据",
    "We'll package up all your conversations, projects, and settings for download. This might take some time to complete.": "我们会把你所有的对话、项目和设置打包供下载。这可能需要一些时间完成。",
    "We’ll package up all your conversations, projects, and settings for download. This might take some time to complete.": "我们会把你所有的对话、项目和设置打包供下载。这可能需要一些时间完成。",
    "Delete your account": "删除你的账户",
    "Delete your account?": "删除你的账户？",
    "This permanently removes your account and all data. This can't be undone.": "这将永久删除你的账户和所有数据。此操作无法撤销。",
    "This permanently removes your account and all data. This can’t be undone.": "这将永久删除你的账户和所有数据。此操作无法撤销。",
    "You can permanently remove your account and data. This can't be undone.": "你可以永久删除你的账户和数据。此操作无法撤销。",
    "You can permanently remove your account and data. This can’t be undone.": "你可以永久删除你的账户和数据。此操作无法撤销。",
    // FAQ (账户被暂停)
    "Frequently asked questions": "常见问题",
    "Why was my account put on hold?": "为什么我的账户被暂停？",
    "We put your account on hold because of unusual activity. We can't share the specifics—that would help bad actors get around the same checks—but the review is your chance to share context so a team member can review.": "我们因检测到异常活动而暂停了你的账户。我们无法透露具体细节——那会帮助恶意行为者绕过同样的检查——但这次审核正是你说明情况、让团队成员复核的机会。",
    "We put your account on hold because of unusual activity. We can’t share the specifics—that would help bad actors get around the same checks—but the review is your chance to share context so a team member can review.": "我们因检测到异常活动而暂停了你的账户。我们无法透露具体细节——那会帮助恶意行为者绕过同样的检查——但这次审核正是你说明情况、让团队成员复核的机会。",
    "What can I still do with my account?": "我的账户还能做什么？",
    "You can't use Claude right now, but your chats, projects, and data are safe and waiting for you.": "你现在无法使用 Claude，但你的对话、项目和数据都安全保存着，等你回来。",
    "You can’t use Claude right now, but your chats, projects, and data are safe and waiting for you.": "你现在无法使用 Claude，但你的对话、项目和数据都安全保存着，等你回来。",
    "How long will the review take?": "审核需要多久？",
    "Will my billing be affected?": "我的账单会受影响吗？",
    "When your account was put on hold, we cancelled your subscription and refunded your most recent payment in full.": "在你的账户被暂停时，我们已取消你的订阅并全额退还了你最近一次付款。",
    "What if I think this is a mistake?": "如果我认为这是误判怎么办？",
    "Request a review and our team will look over your account. The more specific you are about what you were working on, the better we can match it against the signal that triggered the hold.": "申请审核，我们的团队会复核你的账户。你对自己所做工作的描述越具体，我们就越能将其与触发暂停的信号比对。",
  };

  // 把字典 keys 按长度倒序排——长的先匹配，避免 "Run" 覆盖 "Run code"
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

  // 性能优化 1: 把 sortedKeys 中适合做 partial match 的合并成一个大 alternation 正则,
  // 一次 replace 替代几百次循环。RegExp alternation 默认按"先到先匹配", 而 sortedKeys
  // 已按长度倒序排列，长串排前——满足"长优先"语义。
  // 这些词作整词 exact 仍翻, 但不进 partialRegex——避免在代码/路径/命令里词内替换
  // (如 "/design-sync"→"/设计-sync"、"path/to/your-design-system"→"路径/to/your-设计-system")。
  // styled-components 的 sc-xxx class 是哈希、每次构建会变, 故不用 class skip, 改用词级排除 (构建无关)。
  const PARTIAL_EXCLUDE = new Set(["design", "Design", "path", "Path", "system", "System", "Explorer", "Education", "Technology", "Travel", "Nonprofit"]);
  const partialKeys = sortedKeys.filter(k => k.length >= 3 && k.length <= 30 && !/[{}]/.test(k) && !PARTIAL_EXCLUDE.has(k));
  const partialPattern = partialKeys
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const partialRegex = partialKeys.length > 0
    ? new RegExp("\\b(?:" + partialPattern + ")\\b", "g")
    : null;

  // 性能优化 2：已翻译的 textNode 用 WeakSet 标记，下次跳过
  const translatedNodes = new WeakSet();

  // 性能优化 4：文本级翻译结果缓存（"Cancel"/"Save" 等高频字符串只算一次）
  // 用 Map 而不是 WeakMap，因为 key 是字符串。null 值表示已确认无翻译。
  const textCache = new Map();
  const TEXT_CACHE_MAX = 5000;  // 防内存膨胀，超过就清掉

  // 用户内容（对话标题、项目名等）暂不跳过——之前那版逻辑性能太差导致卡死。
  // 留着函数但永远返回 false，等逆向出确切 DOM 结构再加回来。
  function isInUserContentLink(node) {
    return false;
  }

  // 检查 textNode 是不是在用户输入区里（contenteditable / input / textarea）
  function isInEditableArea(node) {
    let el = node.parentElement;
    while (el) {
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      el = el.parentElement;
    }
    return false;
  }

  // 检查是不是在"对话内容"区域——用户消息或 Claude 回复都不翻
  // Claude.ai 用 epitaxy- 命名空间标记对话区
  function isInChatMessage(node) {
    let el = node.parentElement;
    while (el) {
      const tag = el.tagName;
      if (tag === "ARTICLE") return true;
      if (el.getAttribute && el.getAttribute("role") === "article") return true;
      const cls = (el.className && typeof el.className === "string") ? el.className : "";
      // claude.ai 对话区特征 class（找 probe log 里发现的）
      if (cls.indexOf("epitaxy-markdown") !== -1) return true;
      if (cls.indexOf("epitaxy-chat-column") !== -1) return true;
      if (cls.indexOf("epitaxy-chat-size") !== -1) return true;
      if (cls.indexOf("group/msg") !== -1) return true;
      // virtual transcript 滚动容器
      const tid = el.getAttribute && el.getAttribute("data-testid");
      if (tid === "epitaxy-virtual-transcript") return true;
      // 备用：含 prose / 含 font-claude-（保留以防 selector 变化）
      if (/\bprose\b/i.test(cls)) return true;
      if (/\bfont-claude-/i.test(cls)) return true;
      el = el.parentElement;
    }
    return false;
  }

  // 工具状态白名单：在对话区里出现，开头是这些动词的短文本，仍然翻译
  // 因为它们是 Claude 调用工具时的状态，不是用户/Claude 真正的消息内容
  const TOOL_STATUS_PREFIXES = [
    "Edited ", "Editing ", "edited ", "editing ",
    "Ran ", "Running ", "ran ",
    "Read ", "Reading ", "read ",
    "Wrote ", "Writing ", "wrote ", "writing ",
    "Created ", "Creating ", "created ", "creating ",
    "Updated ", "Updating ", "updated ", "updating ",
    "Deleted ", "Deleting ", "deleted ", "deleting ",
    "Loaded ", "Loading ", "loaded ", "loading ",
    "Searched ", "Searching ", "searched ", "searching ",
    "Generated ", "Generating ", "generated ", "generating ",
    "Asked ", "Asking ", "asked ", "asking ",
    "Background shell ",
  ];

  function isToolStatus(text) {
    for (const p of TOOL_STATUS_PREFIXES) {
      if (text.startsWith(p)) return true;
    }
    return false;
  }

  // 性能优化 5：跳过这些标签的文本——里头是代码、样式，不该翻译
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT"]);

  // 选择器跳过: 这些 class 的元素及其后代不翻译。
  // 产品名 / 功能名所在的 UI 槽位 (Cowork "Chat"/"Code" 模式切换 pill 等)。
  const SKIP_CLASSES = ["df-pill"];

  // 子串匹配跳过 (针对 Tailwind arbitrary value class 如 [mask-image:linear-gradient(...)])。
  // 用户内容文本槽位 (会话标题 / 对话名 / 任务标题) 用 mask-image 做右边淡出截断,
  // 这是变长内容专用 trick; UI 按钮固定标签不用。所以靠这个特征区分。
  const SKIP_CLASS_SUBSTRINGS = ["mask-image:linear-gradient"];

  // 文本是否有"显式翻译"(精确字典命中 或 动态规则命中)。
  // 用于让落在"用户内容启发式"跳过区 (mask-image 淡出截断 / role=option) 里的
  // 固定 UI 文本放行翻译 —— 这些区本意防的是变长用户内容，不是 UI 标签。
  function hasExplicitTranslation(text) {
    if (!text) return false;
    if (translations[text]) return true;
    return translateDynamic(text) !== text;
  }

  function isInSkipElement(node) {
    const selfText = node.nodeType === 3 ? (node.textContent || "").trim() : "";
    // 斜杠命令 popover 里的命令名保持英文 (rewind/feedback/fork/mcp/model/rename/workflows 等)。
    // DOM 特征: <div role="menuitem">…<span class="truncate">rewind</span>…</div>
    // 但普通菜单 (加号菜单 / 模型选择器) 也用同一 DOM 结构 (Radix/shadcn 默认给菜单项加 truncate),
    // 用 text 内容特征区分: 斜杠命令名是纯 lowercase 单词无空格 (rewind, mcp, submit-pr);
    // 普通菜单是 Title Case 或含空格 (Add folder, More models, Slash commands).
    if (node.nodeType === 3 && /^[a-z][a-z0-9_-]*$/.test(selfText)) {
      const p = node.parentElement;
      if (p && p.tagName === "SPAN" && typeof p.className === "string"
          && p.className.split(" ").indexOf("truncate") !== -1) {
        let anc = p.parentElement;
        for (let hop = 0; anc && hop < 6; hop++, anc = anc.parentElement) {
          if (anc.getAttribute && anc.getAttribute("role") === "menuitem") return true;
        }
      }
    }
    // 惰性 memo: translateDynamic 有 ~190 条正则，只在真命中 soft-skip 分支时才算一次,
    // 绝大多数节点 (无 mask-image / option 祖先) 永不触发，零额外开销。
    let explicitMemo;
    const explicit = () => (explicitMemo === undefined
      ? (explicitMemo = hasExplicitTranslation(selfText)) : explicitMemo);
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el) {
      const cls = (el.className && typeof el.className === "string") ? el.className : "";
      if (cls) {
        const list = cls.split(" ");
        for (const c of SKIP_CLASSES) {
          if (list.indexOf(c) !== -1) return true;  // df-pill：无条件 (产品 pill 必须保持英文)
        }
        // mask-image 淡出: 聊天标题截断 / DataTable 横向滚动淡出边都用它。
        // DataTable 里的固定 UI 标签 (Application / Connected X ago / 分页) 被误伤 →
        // 有显式翻译就放行; 无翻译的 (Claude Code / scope 标识 / 用户内容) 仍跳过保持英文。
        for (const sub of SKIP_CLASS_SUBSTRINGS) {
          if (cls.indexOf(sub) !== -1 && !explicit()) return true;
        }
      }
      // role="option"[title] 产品标识下拉项 (模型名/代码主题); 有显式翻译的策略项放行。
      if (el.getAttribute && el.getAttribute("role") === "option"
          && el.hasAttribute && el.hasAttribute("title")
          && !explicit()) {
        return true;
      }
      // 套餐产品名 "Max" 保持英文 (与 effort 档 "Max"→最高 解耦; effort 的 "Max" 不在这些容器,
      // 不受影响; 限定 selfText==="Max" 故零误伤)。已知出现位置:
      //   - 定价卡 plan 标题 (h3.font-xl-bold)
      //   - 用户菜单按钮名字旁 (data-testid="user-menu-button")
      if (selfText === "Max" && (
            (el.tagName === "H3" && cls.indexOf("font-xl-bold") !== -1) ||
            (el.getAttribute && el.getAttribute("data-testid") === "user-menu-button")
          )) {
        return true;
      }
      // Claude Design 产品入口 "Design" 保持英文 (与职业 "Design"→设计 解耦;
      // 职业那个在 onboarding 网格, 不在 data-row-main-button 行按钮内, 故零误伤)。
      if (selfText === "Design" && el.hasAttribute
          && el.hasAttribute("data-row-main-button")) {
        return true;
      }
      // 会话标题 / 项目名: 面包屑里可点击改名的 button (class 含 cursor-text) 属于用户内容,
      // 整段跳过, 避免 "Project review" 被 Project→项目 partial 误翻成 "项目 review"。
      if (el.tagName === "BUTTON" && cls.indexOf("cursor-text") !== -1) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  // 用户输入消息气泡: 永不翻译，哪怕文本命中字典 (如用户输入 "OK" 不应该变 "确定")。
  // Cowork 用 CSS var --ui-user-message-background / --ui-user-message-primary-text 标记用户消息气泡,
  // 容器 class 里头会含这两个变量名作为 Tailwind arbitrary value 字面量。
  function isInUserMessageBubble(node) {
    let el = node.parentElement;
    while (el) {
      const cls = (el.className && typeof el.className === "string") ? el.className : "";
      if (cls.indexOf("ui-user-message-background") !== -1) return true;
      if (cls.indexOf("ui-user-message-primary-text") !== -1) return true;
      el = el.parentElement;
    }
    return false;
  }

  // 计算给定 orig 文本应该翻译成啥（纯函数，结果可缓存）
  // 返回：null = 不需要改 / 字符串 = 应替换成这个
  function computeTranslation(orig) {
    const trimmed = orig.trim();
    if (translations[trimmed]) {
      return orig.replace(trimmed, translations[trimmed]);
    }

    let text = orig;
    let changed = false;
    // dynamic 先跑——anchored pattern 只命中自己的目标; 即使节点含 app i18n 格式化的中文
    // (如 "Runs every 星期二 at 2:30 GMT+8"，weekday 是 zh-CN locale 下 app 自己渲染的) 也能翻其中
    // 的英文部分; 纯中文节点无 pattern 命中、不受影响。必须先于下面的 CJK-skip 与 partial。
    const dynText = translateDynamic(text);
    if (dynText !== text) {
      text = dynText;
      changed = true;
    }
    // 原文含中文 → 只跳过 partial(词级替换易误伤已是中文的内容); dynamic 已跑完
    if (/[一-鿿]{2,}/.test(orig)) return changed ? text : null;

    // partial 后跑——处理剩余的英文小词
    if (text.length < 30 && partialRegex) {
      const newText = text.replace(partialRegex, (m) => translations[m] || m);
      if (newText !== text) {
        text = newText;
        changed = true;
      }
    }
    return changed ? text : null;
  }

  // 翻译单个 textNode（只改 textContent，不动结构）
  function translateTextNode(node) {
    if (!node || node.nodeType !== 3) return;
    if (translatedNodes.has(node)) return;
    // 性能优化 5：跳过 script/style/code/pre 等标签内的文本
    const parent = node.parentElement;
    if (parent && SKIP_TAGS.has(parent.tagName)) return;
    if (isInEditableArea(node)) return;
    if (isInUserContentLink(node)) return;
    if (isInSkipElement(node)) return;
    if (isInUserMessageBubble(node)) return;

    const orig = node.textContent;
    if (!orig || orig.length < 2) return;

    // 文件名/路径/命令整体不翻 (无空格 + 带扩展名或 / 或 ~ 开头)，避免词内替换污染
    // 如 "style.css"→"风格.css"、"/design-sync"、"main.py"; 字典里有显式条目的仍翻。
    const _fp = orig.trim();
    if (_fp && !translations[_fp] && !/\s/.test(_fp) && /^[\w./~@\-]+$/.test(_fp) &&
        (/\.\w{1,8}$/.test(_fp) || _fp.indexOf("/") !== -1 || _fp.charCodeAt(0) === 126)) {
      return;
    }

    // 性能优化 4：文本级缓存
    if (textCache.has(orig)) {
      const cached = textCache.get(orig);
      if (cached !== null) {
        node.textContent = cached;
        translatedNodes.add(node);
      }
      return;
    }

    // 对话区内容不翻（但工具状态例外）
    const trimmed = orig.trim();
    const inChat = isInChatMessage(node);
    if (inChat && !isToolStatus(trimmed)) {
      const hasDictExact = !!translations[trimmed];
      const dynamicMatches = translateDynamic(orig) !== orig;
      if (!hasDictExact && !dynamicMatches) {
        textCache.set(orig, null);
        return;
      }
    }

    const result = computeTranslation(orig);

    // 缓存结果（包括"无需翻译"的 null，避免重复计算）
    if (textCache.size >= TEXT_CACHE_MAX) textCache.clear();
    textCache.set(orig, result);

    if (result !== null) {
      node.textContent = result;
      translatedNodes.add(node);
    }
  }

  function translateAttributes() {
    const sel = ["placeholder", "title", "aria-label", "data-placeholder"];
    for (const attr of sel) {
      document.querySelectorAll("[" + attr + "]").forEach((el) => {
        if (isInSkipElement(el)) return;
        const v = el.getAttribute(attr);
        if (v && translations[v.trim()]) {
          el.setAttribute(attr, translations[v.trim()]);
        }
      });
    }
  }

  function translatePage() {
    if (!document.body) return;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let node;
    while ((node = walker.nextNode())) {
      translateTextNode(node);
    }
    translateAttributes();
  }

  // CSS 注入：覆盖 TipTap (ProseMirror) 编辑器的 placeholder ::before 内容
  // 这种 placeholder 通过 CSS attr(data-placeholder) 渲染，不是普通 text 节点。
  // 直接修改 data-placeholder 属性可能被框架反向覆盖，所以用 CSS 强制覆盖最稳。
  function injectPlaceholderCss() {
    if (document.getElementById("__claude_i18n_placeholder_css__")) return;
    const style = document.createElement("style");
    style.id = "__claude_i18n_placeholder_css__";
    style.textContent = `
      /* TipTap placeholder ::before 注入 — 只翻 Cowork 自己不翻的英文版,
         避免跟 Cowork 自带 i18n 重复渲染导致"每个字双影". */
      .is-empty.is-editor-empty[data-placeholder="Type / for commands"]::before {
        content: "输入 / 调用命令" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Filter tasks"]::before {
        content: "筛选任务" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Describe a task or ask a question"]::before {
        content: "描述任务或提问" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Write a message…"]::before {
        content: "写一条消息…" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Write a message..."]::before {
        content: "写一条消息..." !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Write a message"]::before {
        content: "写一条消息" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="What would you like to work on in this project?"]::before {
        content: "想在这个项目里做点啥？" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="What would you like to work on in this project"]::before {
        content: "想在这个项目里做点啥" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Check my Google Calendar for today's meetings and summarize my unread emails. Highlight anything urgent."]::before {
        content: "查看我今天的 Google Calendar 会议，总结未读邮件。指出紧急事项。" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Check my Google Calendar for today’s meetings and summarize my unread emails. Highlight anything urgent."]::before {
        content: "查看我今天的 Google Calendar 会议，总结未读邮件。指出紧急事项。" !important;
      }
      /* Claude Design composer 的 <p> 只有 is-empty (无 is-editor-empty)，选择器放宽到单 class */
      .is-empty[data-placeholder="Describe what you want to create..."]::before {
        content: "描述你想创建的内容..." !important;
      }
      .is-empty[data-placeholder="Describe what you want to create…"]::before {
        content: "描述你想创建的内容…" !important;
      }
      .is-empty[data-placeholder="Describe a tweak…"]::before {
        content: "描述一个微调…" !important;
      }
      .is-empty[data-placeholder="What do you want automated?"]::before {
        content: "你想自动化什么？" !important;
      }
      .is-empty[data-placeholder="Describe a tweak..."]::before {
        content: "描述一个微调..." !important;
      }
      /* "从 GitHub 添加内容" 对话框的 URL 粘贴框 (TipTap data-placeholder) */
      .is-empty[data-placeholder="Paste GitHub URL"]::before {
        content: "粘贴 GitHub URL" !important;
      }
      .is-empty.is-editor-empty[data-placeholder="Paste GitHub URL"]::before {
        content: "粘贴 GitHub URL" !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // 动态 regex 翻译——处理"数字+单位"等含变量的字符串，字典做不到
  const dynamicPatterns = [
    // MCP app 设置失败 (含 app 名 + 域名变量)
    [/^\s*Failed to set up MCP app for [“"'](.+?)["”']\.\s*Check that\s+(.+?)\s+is not blocked by your network or browser\.\s*$/i, "无法为「$1」设置 MCP 应用。请检查 $2 是否被你的网络或浏览器拦截。"],
    // 工具调用状态 "Using X" (翻 Using, 保留工具名 X)
    [/^\s*Using\s+(.+?)\s*$/i, "正在使用 $1"],
    // 模型不可用提示 (含模型名变量)
    [/^\s*(.+?)\s+is currently unavailable\.?\s*$/i, "$1 当前不可用。"],
    // 取消套餐对话框正文 (含日期变量)
    [/^\s*Cancel to stop recurring billing\.\s+You can still use Claude Max until\s+(.+?)\.?\s*$/i, "取消以停止周期性扣费。在 $1 之前你仍可使用 Claude Max。"],
    // 套餐价格 "USD 20.00/month + tax" / "USD 200.00/year + tax"
    [/^\s*USD\s+([\d.]+)\/month\s*\+\s*tax\s*$/i, "USD $1/月 + 税"],
    [/^\s*USD\s+([\d.]+)\/year\s*\+\s*tax\s*$/i, "USD $1/年 + 税"],
    // 降级横幅: 整串一节点时走这条; 套餐名是富组件拆节点时, lead 走 exact + trailing 走下一条
    [/^\s*Your plan will be downgraded to\s+(.+?)\s+on your next billing cycle\s*\((.+?)\)\.\s*$/i, "你的套餐将于下个账单周期（$2）降级为 $1。"],
    [/^\s*on your next billing cycle\s*\((.+?)\)\.\s*$/i, "（将于下个账单周期 $1 生效）。"],
    // 降级说明 (套餐名变量, you'll/won't 直弯撇号兼容)
    [/^\s*Switching to\s+(.+?)\s+means you['’]ll have less usage, lose early access to new features, and won['’]t get priority at busy times\.\s*$/i, "切换到 $1 意味着你的用量会减少、失去新功能的抢先体验，且在繁忙时段不再享有优先级。"],
    [/^\s*Switching to\s+(.+?)\s+means you['’]ll have less usage and may hit your limits faster\.\s*$/i, "切换到 $1 意味着你的用量会减少，并可能更快触及上限。"],
    // 预览链接拦截 toast (含 URL 变量)
    [/^\s*Link to\s+(.+?)\s+was blocked\.\s+Preview only supports localhost URLs\.\s*$/i, "已拦截指向 $1 的链接。预览仅支持 localhost URL。"],
    // 预览链接被拦截提示 (含域名变量)
    [/^\s*Link to\s+(.+?)\s+was blocked\.\s+Preview only supports localhost URLs\.\s*$/i, "已拦截指向 $1 的链接。预览仅支持 localhost 网址。"],
    // 状态行: "N running task(s)"
    [/^\s*(\d+)\s+running tasks?\s*$/i, "$1 个任务运行中"],
    // 画布 "2 pages"
    [/^\s*(\d+)\s+pages?\s*$/i, "$1 页"],
    // 文件 tooltip "support.js · Modified just now"
    [/^\s*(.+?)\s+·\s+Modified just now\s*$/i, "$1 · 刚刚修改"],
    // 文件元数据 "X · Modified <time>" (tooltip) / "Modified <time> · <size> · <type>" (详情面板)
    // 时间部分由上方 "X minutes ago" /g pattern 翻, 这里只处理 "Modified" 前缀, 顺序无关
    [/^\s*(.+?)\s+·\s+Modified\s+(.+?)\s*$/i, "$1 · $2修改"],
    [/^\s*Modified\s+(.+?)\s+·\s+(.+)$/i, "$1修改 · $2"],
    // 对话 "0 turns" (须有数字前缀, 不误伤动词 turns; just now 由词条接力)
    [/\b(\d+)\s+turns?\b/gi, "$1 轮"],
    // "Download <设计名> (standalone HTML)" (设计名为变量保留)
    [/^\s*Download\s+(.+?)\s+\(standalone HTML\)\s*$/i, "下载 $1（独立 HTML）"],
    // 文件操作状态行 (文件名为变量; 限定以 .ext 结尾, 避免误伤 Reading/Editing 短语)
    [/^\s*Reading\s+(.+\.\w+)\s*$/i, "正在读取 $1"],
    [/^\s*Editing\s+(.+\.\w+)\s*$/i, "正在编辑 $1"],
    [/^\s*Generating HTML:\s*(.+)$/i, "正在生成 HTML：$1"],
    [/^\s*Set project title:\s*(.+)$/i, "设置项目标题：$1"],
    // 生成设计系统 (分钟数变量)
    [/^\s*It will take about (\d+) minutes to generate your design system\.\s*$/i, "生成你的设计系统大约需要 $1 分钟。"],
    [/^\s*Keep this tab open and come back in (\d+) minutes?\s*$/i, "让标签页开着，$1 分钟后回来"],
    [/^\s*Screenshot\s+(.+\.\w+)\s*$/i, "正在截图 $1"],
    [/^\s*Finishing up\s+(.+\.\w+)\s*$/i, "即将完成 $1"],
    // 删除 toast "Deleted 'X'" (文件名变量, 直/弯单引号)
    [/^\s*Deleted\s+['‘](.+?)['’]\s*$/i, "已删除「$1」"],
    // 安全切换模型提示(含模型名变量)
    [/^\s*Switched to\s+(.+?)\s*$/i, "已切换到 $1"],
    [/^\s*Try again with\s+(.+?)\s*$/i, "用 $1 再试一次"],
    // 文件夹访问授权标题(含文件夹名变量)
    [/^\s*Allow Claude to change files in\s*[“"'「](.+?)["”'」]\s*\?\s*$/i, "允许 Claude 修改「$1」中的文件吗？"],
    // 已连接的浏览器列表
    [/^\s*(\d+)\s+browsers?\s+connected\s*$/i, "已连接 $1 个浏览器"],
    [/^\s*Browser\s+(\d+)\s*$/i, "浏览器 $1"],
    // ===== 最高优先: 必须先于下面通用的 "X hours ago" / "X of Y" 规则，否则会被提前拆词 =====
    // token 列表 "Connected 7 hours ago"
    [/^\s*Connected just now\s*$/i, "刚刚连接"],
    [/^\s*Connected (\d+)\s+seconds?\s+ago\s*$/i, "$1 秒前连接"],
    [/^\s*Connected (\d+)\s+minutes?\s+ago\s*$/i, "$1 分钟前连接"],
    [/^\s*Connected (\d+)\s+hours?\s+ago\s*$/i, "$1 小时前连接"],
    [/^\s*Connected (\d+)\s+days?\s+ago\s*$/i, "$1 天前连接"],
    [/^\s*Connected (\d+)\s+weeks?\s+ago\s*$/i, "$1 周前连接"],
    [/^\s*Connected (\d+)\s+months?\s+ago\s*$/i, "$1 个月前连接"],
    // 分页 "Showing 1-5 of 11" / "Page 1 of 3" (不分片时整串匹配; 必须先于通用 "X of Y")
    [/^\s*Showing (\d+)\s*[-–]\s*(\d+)\s+of\s+(\d+)\s*$/i, "显示 $1-$2 / 共 $3"],
    [/^\s*Showing (\d+)\s+of\s+(\d+)\s*$/i, "显示 $1 / 共 $2"],
    [/^\s*Page (\d+)\s+of\s+(\d+)\s*$/i, "第 $1 / $2 页"],
    // 分页被 React 拆成独立节点时，单独的 " of " 片段 → " / " (整节点恰为 of 才动，不误伤句中 of)
    [/^(\s*)of(\s*)$/i, "$1/$2"],
    // "Persist preview sessions" 标题: 精确(1045)对不上(疑似节点空白不规整/nbsp), \s+ 容错兜底
    [/^\s*Persist\s+preview\s+sessions\s*$/i, "保留预览会话"],
    // 更新后右上角 "What's new" 按钮 (点开看更新内容, 点一次消失); ['’] 吃两种撇号, /i 吃大小写
    [/^\s*What['’]s new\s*$/i, "更新内容"],
    // 开启用量额度同意条款 lead ("Help Center article" 是链接, 单独节点; 引号用 . 容错直/弯)
    [/^\s*By clicking .Turn on., you agree to turn on usage credits as defined in our\s*$/i, "点击“开启”即表示你同意开启用量额度，依据我们的"],
    // 自动启用功能 toast (功能名是变量, 保留原样如 Artifacts)
    [/^\s*Automatically enabled:\s*(.+?)\s*$/i, "已自动启用：$1"],
    // 搜索无结果 (查询是变量; “” 弯引号 + 直引号 + 「」 都容错)
    [/^\s*No artifacts matching\s*[“”"'「」](.+?)[“”"'「」]\s*$/i, "没有与「$1」匹配的 Artifact"],
    [/^\s*No projects matching\s*[“”"'「」](.+?)[“”"'「」]\s*$/i, "没有与「$1」匹配的项目"],
    // 思考状态 "thought for 2s" (时长变量, 独立节点)
    [/^\s*thought for (\d+)s\s*$/i, "思考了 $1 秒"],
    // 企业版席位价 "USD 20/seat + tax. Usage cost scales with model and task." (价格是变量)
    [/^\s*USD\s+([\d.]+)\/seat\s*\+\s*tax\.\s*Usage cost scales with model and task\.\s*$/i, "USD $1/席位 + 税。用量费用随模型和任务而定。"],
    // 导出数据: "A download link will be sent to your email. Link expires in 24 hours."
    [/^\s*A download link will be sent to your email\.\s*Link expires in (\d+) hours?\.?\s*$/i, "下载链接将发送到你的邮箱。链接 $1 小时后过期。"],
    // "· save 17%" 防御版 (bullet 前缀可能跟着 save 同节点, 兼容 ·/•; save=省钱不是保存)
    [/^\s*[·•]\s*save\s+([\d.]+)%\s*$/i, "· 省 $1%"],
    // 检测到的工具: "Node.js: 24.14.0 (built-in: 24.15.0)" (版本是变量, 只翻 built-in)
    [/^\s*Node\.js:\s*(.+?)\s*\(built-in:\s*(.+?)\)\s*$/i, "Node.js: $1（内置: $2）"],
    // Motion 描述 (整句一节点; 撇号 . 容错, \s+ 容错空白)
    [/^\s*Reduce animation in streaming responses and other interface elements\.\s+System follows your operating system.s reduce-motion setting\.\s*$/i, "减少流式回复和其他界面元素中的动画。系统会跟随你操作系统的减弱动效设置。"],
    // Cowork files 存储位置 (路径是变量/链接; inline 与 lead-only 两种切分都兜)
    [/^\s*Your artifacts and scheduled tasks are stored at\s+(.+?)\.?\s*$/i, "你的 artifacts 和定时任务存储在 $1。"],
    [/^\s*Your artifacts and scheduled tasks are stored at\s*$/i, "你的 artifacts 和定时任务存储在 "],
    // 更改 Cowork files 位置对话框 (两个路径变量)
    [/^\s*Copy files to (.+?) and restart the app\.\s*Your existing files will remain in (.+?)\.?\s*$/i, "将文件复制到 $1 并重启应用。你现有的文件仍保留在 $2。"],
    // Fable 套餐可用期 (日期是变量，保留原样)
    [/^\s*Included until\s+(.+?)\s*$/i, "套餐内可用至 $1"],
    [/^\s*Fable is included in your plan limits until\s+(.+?)\.\s*After that, switch to usage credits to continue using it\.\s*$/i, "Fable 在 $1 前包含在你的套餐额度内。之后需切换到用量额度才能继续使用。"],
    // 工作区启动失败描述 lead 段 ("重装工作区" 是链接，单独节点; 整句版在 exact 1320)
    [/^\s*Restarting Claude or your computer sometimes resolves this\.\s*If it persists, you can\s*$/i, "重启 Claude 或电脑有时能解决这个。如果一直这样，你可以"],
    // Workflow 权限弹窗标题 (workflow 名是变量)
    [/^\s*Allow Claude to run a workflow\s+(.+?)\?\s*$/i, "允许 Claude 运行工作流 $1？"],
    // Workflow 权限弹窗描述 ("tasks panel" 是链接，可能断成单独节点 → 两种切分都兜)
    [/^\s*Dynamic workflows run many subagents in parallel and can use a lot of your usage limit\.\s*Stop them any time from the tasks panel\.?\s*$/i, "动态工作流会并行运行多个子 agent，可能消耗大量用量。可随时在任务面板停止。"],
    [/^\s*Dynamic workflows run many subagents in parallel and can use a lot of your usage limit\.\s*Stop them any time from the\s*$/i, "动态工作流会并行运行多个子 agent，可能消耗大量用量。可随时停止，前往"],
    // 切换模型描述 — 实测 DOM 拆成两个独立 textNode (DevTools 确认), 分两条匹配
    // 变体: "session"/"chat" 二选一 (不同页面措辞不同)
    [/^\s*When safety measures flag a message,\s+automatically switch to a different model to keep chatting\.\s+When off,\s+your (?:session|chat) will pause instead\.\s*$/i, "当安全机制标记某条消息时，自动切换到其他模型以继续对话。关闭时，会话会改为暂停。"],
    [/^\s*Also applies to this machine.s local sessions\.\s*$/i, "同样适用于本机的本地会话。"],
    // 删除会话 确认对话框描述 (撇号用 . 容错; 可能整段一节点)
    [/^\s*Anthropic.s server-side copies of your Claude Code sessions will be permanently deleted\.\s+Sessions on your computer aren.t affected\.\s+This can.t be undone\.\s*$/i, "你的 Claude Code 会话在 Anthropic 服务器端的副本将被永久删除。你电脑上的会话不受影响。此操作无法撤销。"],
    // 删除会话页描述 (末尾 "Claude Code" 是链接，可能断成单独 textNode → 两种切分都兜)
    // 撇号用 . 兼容直/弯引号; 破折号用 [—–-] 兼容 em/en/连字符
    [/^\s*Permanently delete Anthropic.s server-side copies of your Claude Code sessions\.\s*Sessions stored locally on your computer aren.t affected\.\s*Claude Code on the web sessions are managed separately\s*[—–-]\s*go to Claude Code\.?\s*$/i, "永久删除 Anthropic 服务器端保存的 Claude Code 会话副本。本机本地保存的会话不受影响。网页版 Claude Code 会话单独管理 —— 前往 Claude Code。"],
    [/^\s*Permanently delete Anthropic.s server-side copies of your Claude Code sessions\.\s*Sessions stored locally on your computer aren.t affected\.\s*Claude Code on the web sessions are managed separately\s*[—–-]\s*go to\s*$/i, "永久删除 Anthropic 服务器端保存的 Claude Code 会话副本。本机本地保存的会话不受影响。网页版 Claude Code 会话单独管理 —— 前往 "],
    // Fable 5 回归卡描述 (日期 + 百分比是变量; 撇号用 . 容错直/弯引号)
    [/^\s*Until\s+(.+?),\s+you can use up to (\d+)% of your plan.s weekly usage limit on Fable 5\.\s+If you hit your limit, you can continue on Fable 5 with usage credits\.\s+Fable 5 draws down usage faster than Opus 4\.8\.\s*$/i, "在 $1 之前，Fable 5 上你最多可用套餐每周用量上限的 $2%。达到上限后，可用用量额度继续使用 Fable 5。Fable 5 消耗用量的速度比 Opus 4.8 快。"],
    // Fable 5 延长期气泡 ("Extended through <日期>: Fable 5 ...")
    [/^\s*Extended through\s+(.+?):\s+Fable 5 is included in your plan for up to (\d+)% of your weekly usage limit\.\s*$/i, "延长至 $1：Fable 5 已包含在你的套餐中，可用最多每周用量上限的 $2%。"],
    // Cowork 双倍用量卡描述 (日期变量)
    [/^\s*Enjoy a higher session limit now through\s+(.+?)\.\s*$/i, "现在起至 $1，享受更高的会话上限。"],
    // Fable 5 模型选择器 tooltip (百分比变量)
    [/^\s*You can use up to (\d+)% of your weekly limits on Fable 5,\s+then it runs on usage credits\.\s+Fable 5 draws down usage much faster than Opus 4\.8\.\s*$/i, "你最多可将每周用量上限的 $1% 用于 Fable 5，之后转为消耗用量额度。Fable 5 消耗用量的速度比 Opus 4.8 快得多。"],
    // 用量额度页 "$X.XX spent" (独立节点)
    [/^\s*(\$[\d,]+(?:\.\d+)?)\s+spent\s*$/i, "已花费 $1"],
    // 用量额度页 "Up to N% off" 徽标
    [/^\s*Up to (\d+)% off\s*$/i, "最高 $1% 优惠"],
    // 结账按钮 "Pay $X now" (整节点; 若 DOM 拆成 <Pay><$X><now> 三节点, 走下面 exact "Pay" 兜)
    [/^\s*Pay\s+(\$[\d,]+(?:\.\d+)?)\s+now\s*$/i, "立即付款 $1"],
    // Discount tooltip: "You can get discounts on up to $X (pre-tax) each billing cycle."
    [/^\s*You can get discounts on up to\s+(\$[\d,]+(?:\.\d+)?)\s*\(pre-tax\)\s+each billing cycle\.\s*$/i, "每个计费周期最多可享受 $1（税前）的折扣。"],
    // Auto-reload 提示 (含 $X 变量)
    [/^\s*Since your current balance is lower than the minimum amount, your card will be automatically charged to bring your balance to\s+(\$[\d,]+(?:\.\d+)?),\s+plus applicable taxes\.\s*$/i, "由于你的当前余额低于最低金额，将自动向你的卡扣款，把余额补至 $1，另加适用税费。"],
    // 删除会话请求 toast (小时数是变量)
    [/^\s*Deletion requested\.\s*Stored sessions will be removed within\s+(\d+)\s+hours?\.\s*$/i, "已请求删除。已存储的会话将在 $1 小时内移除。"],
    // 视图切换 toast 兜底 (Thinking / Standard 已在 exact; 兜其他 mode)
    [/^\s*Switched transcript view to\s+(.+?)\s*$/i, "已切换到 $1 视图"],
    // skill 目录卡片 /learn 描述 (多行含 \n + bullet, 前缀锚定整段替换; 比多行 exact key 稳)
    [/^Use this skill when the user wants intellectual understanding[\s\S]*$/, "当用户想要理智层面的理解时使用此 skill——搞懂某事如何运作或为何如此，而不是完成某项任务或征求 Claude 的评判。\n\n触发场景：\n- 明确的学习请求：教我、解释、像给五岁小孩讲、带我过一遍、出题考我、抽认卡、「我这块生疏了」；定义（「X 是什么」）\n- 隐含「帮我理解这个」的简短概念名：「伽罗瓦理论」、「从零开始讲 transformer」\n- 困惑信号：「记不住」、「老是搞混这几个」、「就是没懂」\n- 学习路径问题：前置知识、先后顺序、学 X 之前该先学什么\n- 关于机制、成因或动态的概念性问题\n\n不要触发：\n- 任务类：写代码、写作、计算、翻译、事实查询、新闻更新\n- 个人排障；资源/教材推荐\n- 征求 Claude 评判：观点类提问（「你觉得 X 吗」、「帮我定夺」、「说实话」、「X 是不是过时了/还有人当回事吗」）以及解读性看法（「X 真有大家说的那么苛刻吗」）"],

    // 相对时间 (简写)
    [/\b(\d+)\s*s\s+ago\b/g, "$1 秒前"],
    [/\b(\d+)\s*m\s+ago\b/g, "$1 分钟前"],
    [/\b(\d+)\s*h\s+ago\b/g, "$1 小时前"],
    [/\b(\d+)\s*d\s+ago\b/g, "$1 天前"],
    [/\b(\d+)\s*w\s+ago\b/g, "$1 周前"],
    [/\b(\d+)\s*mo\s+ago\b/g, "$1 个月前"],
    [/\b(\d+)\s*y\s+ago\b/g, "$1 年前"],
    // 相对时间 (完整词, "7 minutes ago" 类)
    [/\b(\d+)\s+seconds?\s+ago\b/gi, "$1 秒前"],
    [/\b(\d+)\s+minutes?\s+ago\b/gi, "$1 分钟前"],
    [/\b(\d+)\s+hours?\s+ago\b/gi, "$1 小时前"],
    [/\b(\d+)\s+days?\s+ago\b/gi, "$1 天前"],
    [/\b(\d+)\s+weeks?\s+ago\b/gi, "$1 周前"],
    [/\b(\d+)\s+months?\s+ago\b/gi, "$1 个月前"],
    [/\b(\d+)\s+years?\s+ago\b/gi, "$1 年前"],
    // 数量 + 名词（单数/复数）
    [/\b(\d+)\s+files?\b/g, "$1 个文件"],
    [/\b(\d+)\s+folders?\b/g, "$1 个文件夹"],
    [/\b(\d+)\s+commands?\b/g, "$1 条命令"],
    [/\b(\d+)\s+lines?\b/g, "$1 行"],
    [/\b(\d+)\s+messages?\b/g, "$1 条消息"],
    [/\b(\d+)\s+tokens?\b/g, "$1 个 token"],
    [/\b(\d+)\s+sessions?\b/g, "$1 个会话"],
    [/\b(\d+)\s+conversations?\b/g, "$1 个对话"],
    [/\b(\d+)\s+chats?\b/g, "$1 个对话"],
    [/\b(\d+)\s+projects?\b/g, "$1 个项目"],
    [/\b(\d+)\s+items?\b/g, "$1 项"],
    [/\b(\d+)\s+results?\b/g, "$1 个结果"],
    [/\b(\d+)\s+errors?\b/g, "$1 个错误"],
    [/\b(\d+)\s+warnings?\b/g, "$1 个警告"],
    [/\b(\d+)\s+seconds?\b/g, "$1 秒"],
    [/\b(\d+)\s+minutes?\b/g, "$1 分钟"],
    [/\b(\d+)\s+hours?\b/g, "$1 小时"],
    [/\b(\d+)\s+days?\b/g, "$1 天"],
    [/\b(\d+)\s+weeks?\b/g, "$1 周"],
    [/\b(\d+)\s+months?\b/g, "$1 个月"],
    [/\b(\d+)\s+years?\b/g, "$1 年"],
    // 百分比已用
    [/^(\d+)%\s+used$/i, "$1% 已用"],
    // "Resets in 3 hr 25 min" 类
    [/Resets in (\d+)\s+hr\s+(\d+)\s+min/g, "$1 小时 $2 分钟后重置"],
    [/Resets in (\d+)\s+min/g, "$1 分钟后重置"],
    // "Resets Thu, Jun 18, 6:00 AM" 完整日期 (函数 replacement 映射星期/月份/AM-PM)
    [/Resets\s+(\w{3}),\s+(\w{3})\s+(\d+),\s+(\d+):(\d+)\s+([AP]M)/g, (m, wd, mon, day, h, min, ap) => {
      const W = { Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日" };
      const M = { Jan: "1月", Feb: "2月", Mar: "3月", Apr: "4月", May: "5月", Jun: "6月", Jul: "7月", Aug: "8月", Sep: "9月", Oct: "10月", Nov: "11月", Dec: "12月" };
      const apz = ap.toUpperCase() === "AM" ? "上午" : "下午";
      return `${M[mon] || mon}${day}日 ${W[wd] || wd} ${apz}${h}:${min} 重置`;
    }],
    [/Resets\s+(\S+)\s+(\d+):(\d+)\s+([AP]M)/g, "$1 $2:$3 $4 重置"],
    // "Resets 4:09 AM" 纯时间 (无日期; 4430 需两段 token, 这里兜单段)
    [/Resets\s+(\d+):(\d+)\s+([AP]M)/g, (m, h, mi, ap) => `${ap.toUpperCase() === "AM" ? "上午" : "下午"}${h}:${mi} 重置`],
    // "Resets Jun 18" 纯日期 (无时间; 月份白名单避免误吃任意 3 字母词)
    [/Resets\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/g, (m, mon, day) => {
      const M = { Jan: "1月", Feb: "2月", Mar: "3月", Apr: "4月", May: "5月", Jun: "6月", Jul: "7月", Aug: "8月", Sep: "9月", Oct: "10月", Nov: "11月", Dec: "12月" };
      return `${M[mon]}${day}日 重置`;
    }],
    // first/last/next + 数字
    [/\bfirst\s+(\d+)/gi, "前 $1"],
    [/\blast\s+(\d+)/gi, "后 $1"],
    [/\bnext\s+(\d+)/gi, "接下来 $1"],
    // "X of Y" → "X / Y"
    [/\b(\d+)\s+of\s+(\d+)\b/g, "$1 / $2"],
    // 记忆条数
    [/\b(\d+)\s+memor(?:y|ies)\b/gi, "$1 个记忆"],
    // 问候语 + 用户名
    [/^Morning,\s+/i, "早上好，"],
    [/^Afternoon,\s+/i, "下午好，"],
    [/^Evening,\s+/i, "晚上好，"],
    [/^Night,\s+/i, "晚安，"],
    // 简短时间
    [/^(\d+)s$/i, "$1 秒"],
    [/^(\d+)m$/i, "$1 分钟"],
    [/^(\d+)h$/i, "$1 小时"],
    [/^(\d+)d$/i, "$1 天"],
    // 复合时间："2m 9s" / "1h 30m"
    [/^(\d+)m\s+(\d+)s$/i, "$1 分 $2 秒"],
    [/^(\d+)h\s+(\d+)m$/i, "$1 小时 $2 分"],
    // 12 小时制时间："5:01 pm"
    [/^(\d+):(\d+)\s+pm$/i, "下午 $1:$2"],
    [/^(\d+):(\d+)\s+am$/i, "上午 $1:$2"],
    // 重置时间："· resets 3h" / "· resets 2d"
    [/·\s+resets\s+(\d+)h/g, "· $1 小时后重置"],
    [/·\s+resets\s+(\d+)d/g, "· $1 天后重置"],
    [/·\s+resets\s+(\d+)m/g, "· $1 分钟后重置"],
    // "Last updated: less than a minute ago" / "Last updated: 5 minutes ago"
    [/^Last updated:\s+less than a minute ago$/i, "上次更新：不到一分钟前"],
    [/^Last updated:\s+(\d+)\s+minutes? ago$/i, "上次更新：$1 分钟前"],
    [/^Last updated:\s+(\d+)\s+hours? ago$/i, "上次更新：$1 小时前"],
    [/^Last updated:\s+just now$/i, "上次更新：刚刚"],
    // "Edited a file" / "Created a file" 等
    [/^Edited a file$/i, "编辑了文件"],
    [/^Created a file$/i, "创建了文件"],
    [/^Read a file$/i, "读取了文件"],
    [/^Wrote a file$/i, "写入了文件"],
    [/^Updated a file$/i, "更新了文件"],
    [/^Deleted a file$/i, "删除了文件"],
    [/^Searching code$/i, "搜索代码中"],
    [/^Working$/i, "工作中"],
    [/^Result$/i, "结果"],
    // 批量选择
    [/\b(\d+)\s+selected\b/g, "已选 $1 项"],
    [/^Delete\s+(\d+)\s+selected\s+items?$/i, "删除已选的 $1 项"],
    [/^Move\s+(\d+)\s+conversations?\s+to\s+a\s+project$/i, "把 $1 个对话移到项目"],
    [/^Move\s+(\d+)\s+tasks?\s+to\s+a\s+project$/i, "把 $1 个任务移到项目"],
    // "Plan 21%"
    [/^Plan\s+(\d+)%$/g, "套餐 $1%"],
    // "X tools" 之类
    [/\b(\d+)\s+tools?\b/g, "$1 个工具"],
    [/\b(\d+)\s+agents?\b/g, "$1 个 agent"],
    // "Xk" 简写数字（"2.0k", "1.4k"）
    [/^([\d.]+)k$/i, "$1k"],  // 保留原样但避免 missing 收集
    [/^([\d.]+)K$/g, "$1K"],
    // ===== 后补动态规则 =====
    // Cowork 用量推广 banner (截止日期是变量，捕获后保留原样)
    [/^\s*Do more with a higher session limit, now through\s+(.+?)\.?\s*$/i, "更高的会话上限，做得更多，即日起至 $1。"],
    [/^\s*Do more with double the usage in Cowork, now until\s+(.+?)\s*$/i, "在 Cowork 用双倍用量做更多事，即日起至 $1"],
    // 用量推广 badge "2× more usage until July 5" (倍数 + 截止日期变量; × 或 x)
    [/^\s*(\d+)\s*[×x]\s+more usage until\s+(.+?)\s*$/i, "$1× 更多用量，至 $2"],
    // 上传图片限制
    [/Maximum of (\d+) images? allowed\.?/gi, "最多允许 $1 张图片。"],
    // 用量限额
    [/You['']ve used (\d+)% of your weekly limit/gi, "本周已用 $1%"],
    [/You['']ve used (\d+)% of your daily limit/gi, "今日已用 $1%"],
    [/You['']ve used (\d+)% of your monthly limit/gi, "本月已用 $1%"],
    // token 输入输出统计 "655.9k in · 47.2M out"
    [/(\d+(?:\.\d+)?[kKmM])\s+in\s+·\s+(\d+(?:\.\d+)?[kKmM])\s+out/g, "$1 输入 · $2 输出"],

    [/Plan (\d+)%/g, "套餐 $1%"],
    [/^What['’]s up next,\s+(.+?)\?$/i, "接下来想干啥，$1?"],
    [/^Welcome back,\s+(.+?)$/i, "欢迎回来，$1"],
    [/^Hello,\s+(.+?)$/i, "你好，$1"],
    [/^Hi,\s+(.+?)$/i, "嗨，$1"],
    [/^Good morning,\s+(.+?)$/i, "早上好，$1"],
    [/^Good afternoon,\s+(.+?)$/i, "下午好，$1"],
    [/^Good evening,\s+(.+?)$/i, "晚上好，$1"],
    [/^Good night,\s+(.+?)$/i, "晚安，$1"],
    // 模型选择器思考强度标签 (• Max 类), 兼容多种 bullet 字符
    [/^[•·・⋅⸳]\s*Max$/, "· 最高"],
    [/^[•·・⋅⸳]\s*Min$/, "· 最低"],
    [/^[•·・⋅⸳]\s*Low$/, "· 低"],
    [/^[•·・⋅⸳]\s*Medium$/, "· 中"],
    [/^[•·・⋅⸳]\s*High$/, "· 高"],
    [/^[•·・⋅⸳]\s*Extra high$/, "· 超高"],
    [/^[•·・⋅⸳]\s*Default$/, "· 默认"],
    [/^[•·・⋅⸳]\s*Standard$/, "· 标准"],

    // === 用量统计页对比文案 (epitaxy) ===
    // "You've used ~237× more tokens than Moby-Dick." → "你用的 token 是《Moby-Dick》的约 237 倍。"
    // 用 . 替代引号字符 — 兼容直引号 (U+0027) / 弯引号 (U+2019) / 撇号 (U+02BC) 等所有变体。
    // 两端 \s* 容忍前后空白 (textContent 可能含换行/缩进)。
    [/^\s*You.ve used ~([\d.,]+)[×x]\s+more tokens than (.+?)\.?\s*$/i, "你用的 token 是《$2》的约 $1 倍。"],
    [/^\s*You.ve used ([\d.,]+)[×x]\s+more tokens than (.+?)\.?\s*$/i, "你用的 token 是《$2》的 $1 倍。"],

    // === 连接器未连接提示 ===
    // "You are not connected to GitHub Integration yet." → "你还未连接到 GitHub Integration。"
    [/^\s*You are not connected to (.+?)\s+yet\.?\s*$/i, "你还未连接到 $1。"],

    // === 主页问候语 (Back at it, X) ===
    // "Back at it, X" → "回来继续干吧，X"
    [/^\s*Back at it,\s+(.+?)\s*$/i, "回来继续干吧，$1"],
    // "Sehier returns!" / "<名字> returns!" 欢迎回来问候
    [/^\s*(.+?)\s+returns!\s*$/i, "$1 回来了！"],
    // 用户菜单组织名 "<email>'s Organization" → "<email> 的组织"
    [/^\s*(.+?)['’]s Organization\s*$/i, "$1 的组织"],
    // onboarding "Here are 6 quick tips picked for you. Tap or arrow through." (整句 + 拆句两版)
    [/^\s*Here are (\d+) quick tips picked for you\.\s+Tap or arrow through\.\s*$/i, "为你挑选了 $1 条快速提示。点击或用方向键浏览。"],
    [/^\s*Here are (\d+) quick tips picked for you\.\s*$/i, "为你挑选了 $1 条快速提示。"],

    // === Set 项目指令 弹窗描述 (AAA 是项目名变量) ===
    [/^\s*Provide Claude with relevant instructions and information for chats within (.+?)\.\s*$/i, "为 $1 中的对话提供相关指令和信息。"],
    [/^\s*Provide Claude with relevant instructions and information for chats within (.+?)$/i, "为 $1 中的对话提供相关指令和信息"],

    // === "+N more" 类 ===
    [/^\s*\+(\d+)\s+more\s*$/i, "还有 $1 个"],

    // === 插件描述 (CSS 截断显示，实际 textNode 是完整长描述; 用 wildcard 抓前缀，后段保留英文) ===
    [/^Price bonds, analyze yield curves, evaluate FX carry trades, value options, and build macro dashboards\s*(.*)$/i, "债券定价、分析收益率曲线、评估外汇套息交易、期权估值、构建宏观仪表盘 $1"],
    [/^S&P Global - Financial data and analytics skills including company tearsheets, earnings previews, and\s*(.*)$/i, "标普全球 - 金融数据和分析 skill，含公司简报、收益预告、$1"],
    [/^Work with your Box content directly from Claude Code — search files, organize folders, collaborate with your\s*(.*)$/i, "在 Claude Code 中直接处理你的 Box 内容 — 搜索文件、整理文件夹、与你的$1协作"],
    [/^View, annotate, and sign PDFs in a live interactive viewer\.\s*Mark up contracts, fill forms with visual feedback,\s*(.*)$/i, "在交互式查看器中查看、批注、签署 PDF。标记合同、用视觉反馈填表单，$1"],
    [/^Brings together Adobe Creative Cloud tools for images, vectors, design, and video\.\s*Edit multiple assets at\s*(.*)$/i, "整合 Adobe Creative Cloud 的图像、矢量、设计、视频工具。一次性$1编辑多个素材"],
    [/^Figma design platform integration\.\s*Access design files, extract component information, read design tokens,\s*(.*)$/i, "Figma 设计平台集成。访问设计文件、提取组件信息、读取设计 token, $1"],
    [/^AI agent skills that make SaaS products data-ready for product analytics — from codebase scan to tracking\s*(.*)$/i, "让 SaaS 产品数据准备好用于产品分析的 AI agent skill — 从代码库扫描到追踪 $1"],
    [/^Atlan data catalog plugin for Claude Code\.\s*Search, explore, govern, and manage your data assets\s*(.*)$/i, "Claude Code 的 Atlan 数据目录插件。搜索、探索、治理、管理你的数据资产 $1"],
    [/^Free AI-powered SEO toolkit — audit websites, plan content strategy, optimize pages, generate\s*(.*)$/i, "免费 AI 驱动的 SEO 工具包 — 审计网站、规划内容策略、优化页面、生成 $1"],
    [/^Web scraping, Google search, structured data extraction, and MCP server integration powered by Bright\s*(.*)$/i, "网页抓取、Google 搜索、结构化数据提取、由 Bright $1 驱动的 MCP 服务器集成"],
    [/^Use Cloudinary directly in Claude\.\s*Manage assets, apply transformations, optimize media, and more\s*(.*)$/i, "在 Claude 中直接使用 Cloudinary。管理资产、应用变换、优化媒体，$1"],
    [/^Prisma MCP integration for Postgres database management, schema migrations, SQL queries,\s*(.*)$/i, "Prisma 的 MCP 集成，用于 Postgres 数据库管理、schema 迁移、SQL 查询，$1"],
    [/^CockroachDB plugin for Claude Code — explore schemas, write optimized SQL, debug queries,\s*(.*)$/i, "Claude Code 的 CockroachDB 插件 — 探索 schema、编写优化的 SQL、调试查询，$1"],
    [/^Intercom integration for Claude Code\.\s*Search conversations, analyze customer support patterns,\s*(.*)$/i, "Claude Code 的 Intercom 集成。搜索对话、分析客服模式、$1"],
    [/^Search companies and contacts, enrich leads, find lookalikes, and get AI-ranked contact\s*(.*)$/i, "搜索公司和联系人、丰富线索、寻找相似客户、获得 AI 排序的联系人$1"],
    [/^Sanity content platform integration with MCP server, agent skills, and slash commands\.\s*Query and\s*(.*)$/i, "Sanity 内容平台集成，含 MCP 服务器、agent skill、斜杠命令。查询并$1"],
    [/^Cross-platform ad management for Google Ads, Meta Ads, TikTok Ads, and LinkedIn Ads\.\s*(\d+)\s*(?:个工具|tools)\s*(.*)$/i, "跨平台广告管理，适用于 Google Ads、Meta Ads、TikTok Ads、LinkedIn Ads。$1 个工具 $2"],
    [/^An authenticated hosted MCP server that accesses your PlanetScale organizations, databases, branches,\s*(.*)$/i, "经认证的托管 MCP 服务器，访问你的 PlanetScale 组织、数据库、分支、$1"],
    [/^Secure access to Miro boards\.\s*Enables AI to read board context, create diagrams, and generate code\s*(.*)$/i, "安全访问 Miro 看板。让 AI 读取看板上下文、创建图表、生成代码 $1"],
    [/^Plan, build, and debug Zoom integrations across REST APIs, Meeting SDK, Video SDK, webhooks, bots,\s*(.*)$/i, "规划、构建和调试 Zoom 集成，涵盖 REST API、Meeting SDK、Video SDK、webhook、bot, $1"],
    [/^Optimize business operations — vendor management, process documentation, change management,\s*(.*)$/i, "优化业务运营 — 供应商管理、流程文档、变更管理、$1"],
    [/^Discover your brand voice from existing documents and conversations, generate enforceable guidelines,\s*(.*)$/i, "从现有文档和对话中发现你的品牌语调，生成可执行的指南，$1"],
    [/^Accelerate design workflows — critique, design system management, UX writing, accessibility audits,\s*(.*)$/i, "加速设计工作流 — 评审、设计系统管理、UX 写作、可访问性审计、$1"],
    [/^Streamline people operations — recruiting, onboarding, performance reviews, compensation analysis,\s*(.*)$/i, "简化人事运营 — 招聘、入职、绩效评估、薪酬分析、$1"],
    [/^Streamline engineering workflows — standups, code review, architecture decisions, incident response,\s*(.*)$/i, "简化工程工作流 — 站会、代码评审、架构决策、事故响应、$1"],
    [/^Turn Common Room into your GTM copilot\.\s*Research accounts and contacts, prep for calls with\s*(.*)$/i, "把 Common Room 变成你的 GTM 副驾。调研账户和联系人、为通话准备 $1"],

    // === 插件描述 (四批 - CSS 截断 wildcard) ===
    [/^Prospect, enrich leads, and load outreach sequences with Apollo\.io — one-click MCP server integration for\s*(.*)$/i, "用 Apollo.io 寻找潜在客户、丰富线索、加载触达序列 — 一键 MCP 服务器集成，$1"],
    [/^Slack integration for searching messages, sending communications, managing canvases, and more$/i, "Slack 集成，用于搜索消息、发送通讯、管理画布等"],
    [/^Connect to preclinical research tools and databases \(literature search, genomics analysis, target prioritizatio\s*(.*)$/i, "连接临床前研究工具和数据库 (文献检索、基因组分析、目标优先级 $1"],
    [/^Prospect, craft outreach, and build deal strategy faster\.\s*Prep for calls, manage your pipeline, and\s*(.*)$/i, "更快地寻找潜在客户、设计触达、构建交易策略。准备通话、管理 pipeline, $1"],
    [/^Speed up contract review, NDA triage, and compliance workflows for in-house legal teams\.\s*Draft legal briefs,\s*(.*)$/i, "加速企业内部法务团队的合同评审、NDA 分诊、合规工作流。起草法律简报、$1"],
    [/^Write feature specs, plan roadmaps, and synthesize user research faster\.\s*Keep stakeholders updated and\s*(.*)$/i, "更快地写功能规格、规划路线图、综合用户研究。保持利益相关者更新且$1"],
    [/^Manage tasks, plan your day, and build up memory of important context about your work\.\s*Syncs with your\s*(.*)$/i, "管理任务、规划你的一天、积累工作中重要上下文的记忆。与你的$1同步"],
    [/^Create content, plan campaigns, and analyze performance across marketing channels\.\s*Maintain brand voice\s*(.*)$/i, "跨营销渠道创建内容、规划活动、分析表现。维护品牌语调$1"],
    [/^Streamline finance and accounting workflows, from journal entries and reconciliation to financial statement\s*(.*)$/i, "简化财务和会计工作流，从日记账和对账到财务报表 $1"],
    [/^Search across all of your company's tools in one place\.\s*Find anything across email, chat, documents, and wikis\s*(.*)$/i, "在一处搜索你公司所有工具。在邮件、聊天、文档和 wiki 之间查找任何内容 $1"],
    [/^Search across all of your company’s tools in one place\.\s*Find anything across email, chat, documents, and wikis\s*(.*)$/i, "在一处搜索你公司所有工具。在邮件、聊天、文档和 wiki 之间查找任何内容 $1"],
    [/^Write SQL, explore datasets, and generate insights faster\.\s*Build visualizations and dashboards, and turn raw\s*(.*)$/i, "更快地写 SQL、探索数据集、生成洞察。构建可视化和仪表盘，把原始 $1"],
    [/^Triage tickets, draft responses, escalate issues, and build your knowledge base\.\s*Research customer context\s*(.*)$/i, "分诊工单、起草回复、升级问题、构建知识库。调研客户上下文 $1"],
    [/^Social media automation CLI for scheduling posts, managing integrations, uploading media, and tracking\s*(.*)$/i, "社交媒体自动化 CLI，用于排期发帖、管理集成、上传媒体、追踪 $1"],

    // === 定时任务 toast / 相对时间 (任务名 + 时间为变量) ===
    // "test" created.  →  已创建「test」。
    [/^\s*[“"'](.+?)["”']\s+created\.?\s*$/i, "已创建「$1」。"],
    // Scheduled task "Test" started.  →  定时任务「Test」已启动。
    [/^\s*Scheduled task\s+[“"'](.+?)["”']\s+started\.?\s*$/i, "定时任务「$1」已启动。"],
    // History 时间戳 "today at 23:18" / "yesterday at 09:05"
    [/^\s*today at\s+(.+?)\s*$/i, "今天 $1"],
    [/^\s*yesterday at\s+(.+?)\s*$/i, "昨天 $1"],
    // 账户审核状态 (日期/天数变量, 撇号直弯兼容)
    [/^\s*Submitted on\s+(.+?)\s*$/i, "提交于 $1"],
    [/^\s*Reviews take about\s+(\d+)\s+days?\.\s+We['’]ll email you when there['’]s a decision, and you can come back to this page anytime to check your status\.\s*$/i, "审核大约需要 $1 天。有结果时我们会邮件通知你，你也可以随时回到此页面查看状态。"],
    // Delete "Test"? Any sessions from this task will be archived.
    [/^\s*Delete\s+[“"'](.+?)["”']\?\s+Any sessions from this task will be archived\.\s*$/i, "确认删除「$1」？此任务的所有会话将被归档。"],
    // Delete "X"? This cannot be undone. (项目删除, 名字为变量; "Untitled" 默认名走 exact 显示「未命名」)
    [/^\s*Delete\s+[“"'](.+?)["”']\?\s+This cannot be undone\.\s*$/i, "确认删除「$1」？此操作无法撤销。"],
    // "Actions for X" 行操作 tooltip
    [/^\s*Actions for\s+(.+?)\s*$/i, "$1 的操作"],

    // === 删除/归档/移除 确认对话框 ===
    // "Are you sure you want to delete AAA?" → "确认删除 AAA?"
    [/^\s*Are you sure you want to permanently delete (.+?)\?\s*$/i, "确认永久删除 $1?"],
    [/^\s*Are you sure you want to delete (.+?)\?\s*$/i, "确认删除 $1?"],
    [/^\s*Are you sure you want to archive (.+?)\?\s*$/i, "确认归档 $1?"],
    [/^\s*Are you sure you want to remove (.+?)\?\s*$/i, "确认移除 $1?"],
    [/^\s*Are you sure you want to clear (.+?)\?\s*$/i, "确认清除 $1?"],
    [/^\s*Are you sure you want to unarchive (.+?)\?\s*$/i, "确认取消归档 $1?"],
    [/^\s*Are you sure you want to disconnect (.+?)\?\s*$/i, "确认断开连接 $1?"],

    // === 套餐 / 订阅 / 升级 页相关 ===
    // "Usage limit reached · resets at 10:00 PM" → "用量已达上限 · 10:00 PM 重置"
    [/^\s*Usage limit reached\s*·\s*resets at\s+(.+?)\s*$/i, "用量已达上限 · $1 重置"],
    [/^\s*usage limit reached\s*·\s*resets at\s+(.+?)\s*$/i, "用量已达上限 · $1 重置"],
    // 价格行
    [/^USD\s+([\d.]+)\s*\/\s*month\s*\+\s*tax\s*$/i, "USD $1/月 + 税"],
    [/^USD\s+([\d.]+)\s*\/\s*month\s*$/i, "USD $1/月"],
    [/^USD\s+([\d.]+)\s*\/\s*mo\s*$/i, "USD $1/月"],
    [/^USD\s+([\d.]+)\s*\/\s*mo\s+when billed monthly\s*$/i, "USD $1/月 (按月计费)"],
    [/^USD\s+([\d.]+)\s*\/\s*seat\s*$/i, "USD $1/席位"],
    // "$X USD / month" / "From $X"
    [/^\$([\d.]+)\s+USD\s*\/\s*month\s*$/i, "$$1 USD / 月"],
    [/^From\s+\$([\d.]+)\s*$/i, "$$$1 起"],
    // 自动续费
    [/^\s*Your subscription will auto renew on\s+(.+?)\.\s+You will be charged USD\s+([\d.]+)\s*\/\s*month\s*\+\s*tax\.?\s*$/i, "你的订阅将于 $1 自动续费。届时将收取 USD $2/月 + 税。"],
    [/^\s*Your subscription will auto renew on\s+(.+?)\.\s*$/i, "你的订阅将于 $1 自动续费。"],
    // "Get X plan" → "选择 X 套餐"
    [/^Get\s+(.+?)\s+plan$/i, "选择 $1 套餐"],
    // "Yearly · save 17%" / "save 17%"
    [/^Yearly\s*·\s*save\s+([\d.]+)%\s*$/i, "年付 · 省 $1%"],
    // "Save 10% (USD 5.00)" 折扣行 (含金额) — 必须放在纯 "Save N%" 之前
    [/^Save\s+([\d.]+)%\s+\(USD\s+([\d,]+(?:\.\d+)?)\)\s*$/i, "省 $1%（USD $2）"],
    [/^save\s+([\d.]+)%\s*$/i, "省 $1%"],
    [/^Save\s+([\d.]+)%\s*$/i, "省 $1%"],
    // "Up to Nx more usage than X"
    [/^Up to\s+(\d+)[xX×]\s+more usage than\s+(.+?)\*?\s*$/i, "用量最高是 $2 的 $1 倍"],
    // "Nx more usage than X" (含 standard seats / Pro)
    [/^(\d+)[xX×]\s+more usage than\s+(.+?)\*?\s*$/i, "用量是 $2 的 $1 倍"],
    // "Built-in X"
    [/^Built-in\s+(.+?)\s*$/i, "内置 $1"],
    // "Upgrade to X or Y"
    [/^Upgrade to\s+(.+?)\s+or\s+(.+?)\s*$/i, "升级到 $1 或 $2"],
    // "5-150 users" / "20+ users"
    [/^(\d+)[\-–](\d+)\s+users\s*$/i, "$1-$2 用户"],
    [/^(\d+)\+\s+users\s*$/i, "$1+ 用户"],

    // === 连接器迁移说明 (链接打断文本节点的情形) ===
    [/^\s*\.\s+Head there to browse,\s*connect,\s*and manage them\.?\s*$/i, "。去那里浏览、连接、管理。"],

    // === 工作流 cron 时间表 ===
    // "Runs weekdays at 20:30 GMT+8" → "工作日 20:30 GMT+8 运行"
    [/^\s*Runs weekdays at (\d{1,2}:\d{2})\s+(GMT[+\-]\d+)\s*$/i, "工作日 $1 $2 运行"],
    [/^\s*Runs daily at (\d{1,2}:\d{2})\s+(GMT[+\-]\d+)\s*$/i, "每日 $1 $2 运行"],
    // "Runs once on Jun 20, 2026, 7:59 PM GMT+8" (日期英文格式, 作变量保留)
    [/^\s*Runs once on\s+(.+?)\s*$/i, "在 $1 运行一次"],
    // "Runs every Tuesday at 2:30 GMT+8" — Tuesday 已被翻译成 "星期二" 等 → "Runs every 星期二 at ..."
    [/^\s*Runs every\s+(星期[一二三四五六日天])\s+at\s+(\d{1,2}:\d{2})\s+(GMT[+\-]\d+)\s*$/i, "每$1 $2 $3 运行"],
    [/^\s*Runs every\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+at\s+(\d{1,2}:\d{2})\s+(GMT[+\-]\d+)\s*$/i, (m, day, t, tz) => {
      const map = {Monday:"周一", Tuesday:"周二", Wednesday:"周三", Thursday:"周四", Friday:"周五", Saturday:"周六", Sunday:"周日"};
      return "每" + (map[day] || day) + " " + t + " " + tz + " 运行";
    }],
    // "Works with X · Y · Z" → "支持 X · Y · Z"
    [/^\s*Works with\s+(.+?)\s*$/i, "支持 $1"],

    // === 删除 session 对话框 (含变量 session 名) ===
    // ""General coding session" will be permanently deleted. This can't be undone." →
    //   ""General coding session" 将被永久删除。此操作无法撤销。"
    [/^\s*[“"](.+?)[”"]\s+will be permanently deleted\.\s+This can[''’]t be undone\.?\s*$/i, '"$1" 将被永久删除。此操作无法撤销。'],
    [/^\s*[“"](.+?)[”"]\s+will be permanently deleted\.\s*$/i, '"$1" 将被永久删除。'],
    [/^\s*(.+?)\s+will be permanently deleted\.\s+This can[''’]t be undone\.?\s*$/i, "$1 将被永久删除。此操作无法撤销。"],
    [/^\s*(.+?)\s+will be permanently deleted\.\s*$/i, "$1 将被永久删除。"],
    ];

  function translateDynamic(text) {
    let t = text;
    for (const [regex, replacement] of dynamicPatterns) {
      t = t.replace(regex, replacement);
    }
    return t;
  }

  // observer + 防循环 + 性能优化 3：只处理 mutation 记录里头的变化节点
  let observer;
  const pendingNodes = new Set();
  let scheduled = false;

  function processPendingNodes() {
    if (observer) observer.disconnect();
    try {
      for (const node of pendingNodes) {
        if (node.nodeType === 3) {
          // textNode：直接翻译
          translateTextNode(node);
        } else if (node.nodeType === 1 && node.isConnected) {
          // element：遍历内部 textNode
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
          let tn;
          while ((tn = walker.nextNode())) translateTextNode(tn);
          translateAttributesIn(node);
        }
      }
      pendingNodes.clear();
    } finally {
      if (observer && document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }
  }

  function scheduleProcess() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      processPendingNodes();
    });
  }

  function translateAttributesIn(root) {
    if (!root || !root.querySelectorAll) return;
    const sel = ["placeholder", "title", "aria-label", "data-placeholder"];
    for (const attr of sel) {
      try {
        root.querySelectorAll("[" + attr + "]").forEach((el) => {
          if (isInSkipElement(el)) return;
          const v = el.getAttribute(attr);
          if (v && translations[v.trim()]) {
            el.setAttribute(attr, translations[v.trim()]);
          }
        });
      } catch (_) {}
    }
  }

  function start() {
    injectPlaceholderCss();  // 注入 CSS 覆盖 TipTap placeholder ::before 内容
    translatePage();  // 首次全页翻译
    observer = new MutationObserver((mutations) => {
      // 收集变化的节点（不再每次扫整个 body）
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === 3) {
          // textNode 内容变了——重新翻译，先从已翻译集合移除
          translatedNodes.delete(m.target);
          pendingNodes.add(m.target);
        } else if (m.type === "childList") {
          for (const n of m.addedNodes) {
            pendingNodes.add(n);
          }
        }
      }
      if (pendingNodes.size > 0) scheduleProcess();
    });
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    console.log("[Claude.ai 汉化] 已激活（高性能版）");
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }
})();
