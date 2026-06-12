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
    "Get a desktop notification when a routine run fails": "例程运行失败时收到桌面通知",
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
    "Set up Routines to run a prompt on a schedule — find them in the sidebar": "设置例程以按计划运行提示词——在侧边栏中找到它们",
    "See a one-line recap of Claude's thinking above each tool group in thinking view": "在思考视图中，每个工具组上方显示 Claude 思考的一行摘要",

    // === 头像 / 例程额度 / 用量额度对话框 ===
    "Clear avatar": "清空头像",
    "Included routine runs per rolling 24 hours. Additional runs use usage credits when turned on.": "每滚动 24 小时内含的例程运行额度。开启后，额外运行将消耗用量额度。",
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
    "Routine": "工作流",
    "routine": "工作流",
    "routines": "工作流",
    "New routine": "新建工作流",
    "New Routine": "新建工作流",
    "No routines yet.": "还没有工作流。",
    "No routines yet": "还没有工作流",
    "Create templated routines that can be kicked off on schedule, by API, or webhook.": "创建模板化的工作流，可按时间表、API 或 webhook 触发。",
    "Remote": "远程",
    "Remote Control": "远程控制",
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
    "Routines": "工作流",
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
    "More models": "更多模型",
    "Manage plugins": "管理插件",
    // Scheduled tasks 页
    "Scheduled tasks": "定时任务",
    "Run tasks on a schedule or whenever you need them. Type /schedule in any existing task to set one up.": "按时间表或随时运行任务。在任意已有任务里输入 /schedule 设置。",
    "Scheduled tasks only run while your computer is awake.": "定时任务只在电脑唤醒时运行。",
    "Keep awake": "保持唤醒",
    "When enabled, Claude will prevent your computer from going to sleep.": "启用后，Claude 将阻止你的电脑进入睡眠。",
    "No scheduled tasks yet.": "暂无定时任务。",
    "Next run": "下次运行",
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
    "You haven't used Claude Design yet": "你还没用过 Claude Design",
    "Extra usage": "额外用量",
    "Turn on extra usage to keep using Claude if you hit a limit.": "开启额外用量，达到上限后仍可继续使用 Claude。",
    "Additional features": "附加功能",
    "Daily included routine runs": "每日例程运行额度",
    "You haven't run any routines yet": "你还没运行过例程",

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
    "Tool access mode": "工具访问模式",
    "Controls how connector tools are loaded in new conversations.": "控制新对话中连接器工具如何加载。",
    "Load tools when needed": "需要时加载",
    "Chats compact less since tools aren't pre-loaded.": "工具不预加载，对话压缩频率较低。",
    "Tools already loaded": "工具已预加载",
    "Chats compact more often since tools are always there.": "工具一直在，对话压缩频率较高。",

    // 设置 - 视觉
    "Visuals": "视觉",
    "AI-powered artifacts": "AI 驱动的 Artifacts",
    "Generate code, documents, and designs in a dedicated window alongside your conversation.": "在对话旁边的专用窗口里生成代码、文档和设计。",
    "Build apps and interactive documents that use Claude inside the artifact.": "构建在 artifact 中使用 Claude 的应用和交互式文档。",
    "Inline visualizations": "内联可视化",
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
    "Default for all sites": "对所有网站的默认设置",
    "Choose whether Claude in Chrome works on all sites by default": "选择 Chrome 中的 Claude 是否默认对所有网站生效",
    "Select default policy": "选择默认策略",
    "Allow extension": "允许扩展",
    "Block extension": "屏蔽扩展",

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
    "No plugins available.": "暂无可用插件。",
    "Type": "类型",
    "Desktop": "桌面",
    "Web": "网页",
    "Category": "类别",
    "Communication": "沟通",
    "Data": "数据",
    "Financial services": "金融服务",
    "Health": "健康",
    "Life sciences": "生命科学",
    "Productivity": "生产力",
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
    "agents": "代理",

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
    "Recent": "按最近",
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
    "Watch CI and review comments on PRs this routine opens, and let Claude push fixes.": "监控这个例程开的 PR 的 CI 和评审评论，让 Claude 推送修复。",
    "Watch CI and review comments on PRs this routine opens, and let Claude push fixes": "监控这个例程开的 PR 的 CI 和评审评论，让 Claude 推送修复",
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
  };

  // 把字典 keys 按长度倒序排——长的先匹配，避免 "Run" 覆盖 "Run code"
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

  // 性能优化 1: 把 sortedKeys 中适合做 partial match 的合并成一个大 alternation 正则,
  // 一次 replace 替代几百次循环。RegExp alternation 默认按"先到先匹配", 而 sortedKeys
  // 已按长度倒序排列，长串排前——满足"长优先"语义。
  const partialKeys = sortedKeys.filter(k => k.length >= 3 && k.length <= 30 && !/[{}]/.test(k));
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
    if (/[一-鿿]{2,}/.test(orig)) return null;  // 已是中文

    let text = orig;
    let changed = false;
    // dynamic 先跑——动态模式(如 "What's up next, X?")比 partial 更具体,
    // 必须优先于 partial,否则 partial 会把模式开头的 "What" 提前替换成 "什么",
    // 让 dynamic regex 失效。
    const dynText = translateDynamic(text);
    if (dynText !== text) {
      text = dynText;
      changed = true;
    }
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
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // 动态 regex 翻译——处理"数字+单位"等含变量的字符串，字典做不到
  const dynamicPatterns = [
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
    [/Resets\s+(\S+)\s+(\d+):(\d+)\s+([AP]M)/g, "$1 $2:$3 $4 重置"],
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
