# Claude Desktop 字体补丁（原地版本）

把 Claude Desktop 的 UI 字体（含中文）改成 **Anthropic Serif + 思源宋体**。

原地改 MS Store 装的 Claude，不复制副本——Cowork、native messaging、开始菜单/任务栏启动全部正常。
代价是改了 `claude.exe` 的 fuse 字节，数字签名失效（SmartScreen 第一次可能弹"未知发布者"，点"仍要运行"即可）。

## 怎么用

### 第一次装

1. 双击 `install.bat`
2. UAC 弹出来点“是”
3. 等 30~60 秒（中间在解包/重打 28MB 的 asar）
4. 看到“全部完成”
5. 启动 Claude Desktop（任务栏 / 开始菜单都行），中文该是思源宋体了

### Claude 升级后

MS Store 升级了 Claude，安装路径里版本号变了，**字体补丁会被新版本覆盖**。

再跑一遍 `install.bat`——脚本自动找最新版本，重做整套流程。

### 卸载

双击 `uninstall.bat`，自动从 `_backup/` 里取出对应版本的原版文件还原。

## 要求

- Windows 10/11
- MS Store 装的 Claude Desktop（不支持其他装法）
- **Python 3**（[python.org](https://www.python.org/downloads/) 下，装的时候勾“Add to PATH”）
- **Node.js**（[nodejs.org](https://nodejs.org/) 下，自动加 PATH）

cmd 里 `python --version` 和 `node --version` 都能输出版本号就 OK。

## 它干了啥

1. 装思源宋体（Source Han Serif CN）到 `%LOCALAPPDATA%\Microsoft\Windows\Fonts\`（用户级，不需要管理员）
2. 找 WindowsApps 里最新的 `Claude_x.x.x.x_x64__pzs8sxrjxfjjc\app\` 目录
3. takeown + icacls 拿文件权限
4. 备份原版 `claude.exe` 和 `app.asar` 到 `_backup/<版本目录名>/`
5. 用 `@electron/fuses` 把 `claude.exe` 的 `EnableEmbeddedAsarIntegrityValidation` 关掉（不关的话改 asar 启动时哈希校验失败会静默退出）
6. 用 `@electron/asar` 解开 `app.asar`
7. 在 `.vite/build/index.js` 末尾追加一段 `app.on('web-contents-created')` 钩子，对每个 webContents 在 `dom-ready` / `did-finish-load` / `did-frame-finish-load` / `did-stop-loading` 时调 `wc.insertCSS(CSS)`——
8. 注入的 CSS 用 `:not(svg):not([class*="icon" i])...` 等选择器排除图标元素，避免把图标也变成衬线
9. 字体回退顺序：`Anthropic Serif` → `CustomCJKSerif`（@font-face 别名，让中文用思源宋体的 Light/Bold 两档）→ `Source Han Serif SC/CN` → `Microsoft YaHei`（兜底）
10. 重新打包 `app.asar` 替换原文件

## 已知坑

- **每次 Claude 升级都要重跑** —— 没办法，MS Store 升级会覆盖我们的修改。
- **数字签名失效** —— 改了 `claude.exe` 的 fuse 字节，Anthropic 的签名肯定对不上。SmartScreen 第一次启动可能弹“未知发布者”警告，点“仍要运行”就行。后续不会弹。
- **杀软有一定概率报毒** —— Windows Defender 一般不报，第三方杀软（火绒/360）可能误报，加白名单或临时关掉再装。
- **如果 install.bat 一闪而过** —— 多半 Python 没装或没加 PATH。cmd 里输 `python --version` 试试。

## 文件清单

```
desktop-font/
├── install.bat              ← 双击这个安装/更新
├── uninstall.bat            ← 双击这个还原
├── install.py               ← 主脚本
├── uninstall.py             ← 卸载脚本
├── README.md                ← 你正在看的
├── _font_cache/             ← 思源宋体下载缓存（自动生成，不要删）
└── _backup/                 ← 原版 claude.exe / app.asar 备份（自动生成，不要删！卸载用）
    └── Claude_1.5354.0.0_x64__pzs8sxrjxfjjc/
        ├── claude.exe
        └── app.asar
```

## License

MIT。随便用、随便改、随便发。
