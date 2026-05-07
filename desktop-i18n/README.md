# Claude Desktop 汉化补丁

把 Claude Desktop 的菜单/对话框/聊天 UI 全部翻成中文。

跟 [desktop-font](../desktop-font/) 完全独立——可以单独装、可以一起装,互不影响。

## 它干啥

两层翻译同时上:

**第一层: 改 main process 的 i18n 加载函数**

解开 app.asar,在 `.vite/build/index.js` 里找到 i18n 加载函数(`jyt(locale)` 类型),patch 它的函数体强制 `locale = "zh-CN"`,让外壳所有 i18n 调用都加载 `resources/zh-CN.json`。这一层处理走 i18n key 系统的 UI(老模块的菜单、对话框、设置面板等)——这部分 React 直接渲染中文,**没有英文闪现**。

**第二层: 注入 webview JS 做 DOM 文本替换**

在 main process 末尾追加 `web-contents-created` 钩子,对每个 `claude.ai` webview 注入 `zh-CN-webview.js`——里面是 MutationObserver,实时把 DOM 里出现的英文文本节点替换成中文。这一层处理硬编码英文(新模块、Beta 功能、不走 i18n 的字符串)——这部分会有约 1 帧(<16ms)的"先英文后中文"延迟,但人眼几乎察觉不到。

为了让 main process 能写入修改过的 asar(原版 ASAR 完整性校验会拒绝启动),先用 `@electron/fuses` 关掉 `EnableEmbeddedAsarIntegrityValidation` fuse。

## 怎么用

### 第一次装

1. 先确认装好 **Python 3** 和 **Node.js**(`python --version` 和 `node --version` 都能输出版本号)
2. 双击 `install.bat`,UAC 弹出来点"是"
3. 等 30~60 秒(中间在解包/重打 28MB 的 asar)
4. 看到"全部完成"
5. 启动 Claude Desktop——UI 几乎全中文

第一次启动 SmartScreen 可能会弹"未知发布者"警告(因为改了 claude.exe 的 fuse 字节,签名失效),点"仍要运行"即可。后续不会再弹。

### Claude 升级后

MS Store 自动更新 Claude 后,补丁会被覆盖,UI 又回英文。**再跑一次 `install.bat`** 即可——脚本自动找最新版本,重做整套流程。

### 卸载

双击 `uninstall.bat`,自动从 `_backup/<版本号>/` 还原原版 `claude.exe` 和 `app.asar`,删掉 `resources/zh-CN.json`。

## 要求

- Windows 10 / 11
- MS Store 装的 Claude Desktop(不支持其他装法)
- **Python 3** ([python.org](https://www.python.org/downloads/) 下,装时勾"Add to PATH")
- **Node.js** ([nodejs.org](https://nodejs.org/) 下,自动加 PATH)

## 文件清单

```
desktop-i18n/
├── install.bat              ← 双击安装/更新
├── uninstall.bat            ← 双击卸载
├── install.py               ← 主脚本
├── uninstall.py             ← 卸载脚本
├── zh-CN.json               ← 外壳翻译(主进程读,Claude i18n key 哈希 → 中文)
├── zh-CN-webview.js         ← webview 注入脚本(MutationObserver + 翻译字典)
├── README.md                ← 你正在看的
└── _backup/                 ← 原版备份(自动生成,别删!卸载用)
    └── Claude_x.x.x.x_x64__pzs8sxrjxfjjc/
        ├── claude.exe       ← fuse 关掉前的原版
        └── app.asar         ← 改写前的原版
```

## 已知坑

- **每次 Claude 升级都要重跑** —— MS Store 自动更新会覆盖咱们的修改,补丁失效
- **数字签名失效** —— 改了 `claude.exe` 的 fuse 字节,Anthropic 的签名对不上。SmartScreen 第一次启动可能弹"未知发布者"警告,点"仍要运行"就行,后续不会弹
- **杀软可能误报** —— Windows Defender 一般不报,第三方杀软(火绒/360)可能误报改 asar 的行为,加白名单或临时关掉再装
- **Cowork 不受影响** —— 动的是原版 Claude 安装目录(不是复制副本),native messaging 注册没变,Cowork 正常用
- **新模块可能有 1 帧英文闪现** —— 不走 i18n key 的硬编码字符串靠 webview DOM 替换接住,React 渲染英文 textNode 后被 MutationObserver 检测到再改中文,延迟约 1 帧(<16ms),人眼几乎感知不到

## 自己补翻译

发现还有英文没翻？编辑 `zh-CN-webview.js` 里的翻译表,加完重跑 `install.bat` 即可:

```js
const translations = {
  "Hello": "你好",
  "Settings": "设置",
  ...
};
```

带变量的短语(如 `"You've used 75% of your weekly limit"`)加到 `dynamicPatterns` 数组用 regex 处理:

```js
const dynamicPatterns = [
  [/You['']ve used (\d+)% of your weekly limit/g, "本周已用 $1%"],
  ...
];
```

## License

MIT。
