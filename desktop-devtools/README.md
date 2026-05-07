# Claude Desktop DevTools 补丁

启用 Claude Desktop 的开发者工具——启动时自动开 DevTools, 并重绑 Ctrl+Shift+I / Ctrl+Shift+J 快捷键。

## 它干啥

在 main process 的 `web-contents-created` 钩子里加两件事:

1. **页面加载完自动开 DevTools** —— 启动 Claude 后, 主内容(claude.ai webview)加载完一秒内 DevTools 自动弹出 (detach 模式, 不挤主窗口)
2. **重绑快捷键**:
   - `Ctrl + Shift + I` 切换 DevTools 开/关
   - `Ctrl + Shift + J` 直接打开 (跟 Chrome 一致)

为了让 main process 能写入修改过的 asar (原版 ASAR 完整性校验会拒绝启动), 先用 `@electron/fuses` 关掉 `EnableEmbeddedAsarIntegrityValidation` fuse。

## 怎么用

### 第一次装

1. 先确认装好 **Python 3** 和 **Node.js**
2. 双击 `install.bat`, UAC 弹出来点"是"
3. 等 30~60 秒(中间在解包/重打 28MB 的 asar)
4. 看到"全部完成"
5. 启动 Claude Desktop —— DevTools 自动弹出

### Claude 升级后

MS Store 自动更新会覆盖修改, **再跑一次 `install.bat`** 即可。

### 卸载

跑 `desktop-i18n` 的 `uninstall.bat` 会还原 asar 同时把 DevTools 补丁也一起还原(因为是同一个 app.asar)。或者手动从 `_backup/<版本号>/app.asar` 拷回去。

## 跟其他补丁的关系

- ✓ 跟 `desktop-i18n` 兼容 —— 用不同的 START/END marker (`DEVTOOLS_PATCH_v1` vs `I18N_PATCH_INPLACE_v1`), 两个补丁可以共存
- ✓ 跟 `desktop-font` 兼容 —— 同上, 不冲突
- 顺序无所谓, 想装就装, 想卸就卸

## 已知坑

- **每次 Claude 升级都要重跑** —— MS Store 自动更新会覆盖咱们的修改
- **数字签名失效** —— 改了 `claude.exe` 的 fuse 字节, Anthropic 的签名对不上。SmartScreen 第一次启动可能弹"未知发布者"警告, 点"仍要运行"就行
- **每次启动都开 DevTools 可能烦** —— 如果不想要自动弹出, 编辑 `install.py` 里 `make_devtools_hook()` 函数, 把 `wc.openDevTools(...)` 那段注释掉, 只保留快捷键绑定, 然后重跑 `install.bat`
- **Cowork 不受影响** —— 动的是原版 Claude 安装目录, 不是复制副本, native messaging 注册没变

## License

MIT。
