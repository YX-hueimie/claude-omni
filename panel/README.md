# panel

claude-omni 的可视化控制面板。Flask 本地服务 + HTML 网页，端口 5500。

## 一眼看到 / 一键操作

- 总览 5 档 jailbreak / 风格层 / 3 个 UI 补丁 / session-browser 工具的当前安装状态
- 点"安装" / "卸载" / "紧急还原"按钮直接调对应目录的 install.py / uninstall.py / emergency-restore.py
- 点"详情"按钮预览各档的 `CLAUDE.md` / `append.txt` / 4 个 SKILL.md 内容
- 实时显示 install / uninstall 的 stdout 流（轮询 500ms）
- session-browser 启动 / 停止 / 跳转

## 怎么用

双击 `start.bat`（Windows）即可。会自动：

1. 弹 UAC 请求管理员权限（要读 `C:\Program Files\WindowsApps`）
2. 检测 Flask 是否已装，没装就 `pip install flask` 自动装
3. 启动本地 5500 端口服务，浏览器自动打开 `http://127.0.0.1:5500`

或命令行：

```
python panel.py
```

依赖：只需要 Python 3。Flask 没装会自动装上。各 install.py / uninstall.py 自己负责子进程要的依赖（`@electron/asar` / `@electron/fuses` 之类的，由 `npx --yes` 自动拉）。

## 它怎么知道装了哪些补丁

| 检测对象 | 怎么查 |
|---|---|
| 5 档 jailbreak 当前哪一档 | 读 `~/.claude/.claude-omni-tier` marker 文件 |
| 风格层（persona） | 读 `~/.claude/.claude-omni-persona` marker |
| desktop-font / i18n / devtools | 扫描 Claude Desktop 的 `app.asar` 看是否含各自的 marker（`FONT_PATCH_INPLACE_v1` / `I18N_PATCH_INPLACE_v1` / `DEVTOOLS_PATCH_v1`）。asar 文件 mtime 没变就缓存结果，不重复扫 28MB |
| session-browser | 检测 5193 端口是否被本进程启动的子进程占用 |

## panel 怎么调底层 install.py 的

panel 调用底层 install.py 时设环境变量 `CLAUDE_OMNI_PANEL=1`。每个 install.py / uninstall.py / emergency-restore.py 顶部都有一段 panel-compat：

```python
if os.environ.get('CLAUDE_OMNI_PANEL'):
    import builtins
    builtins.input = lambda *a, **kw: ''
```

设了这个 env 后所有 `input("按回车退出...")` 调用都立刻返回空字符串——脚本不阻塞，panel 能拿到完整 stdout 流。从 cmd 双击 install.bat 时这个 env 不存在，input() 行为不变。

## UAC 提权

panel 启动时**自动请求管理员权限**（双击 `start.bat` 会立刻弹 UAC 弹窗）。点"是"之后 panel 以管理员身份重启，能：

- 读 `C:\Program Files\WindowsApps\` 检测 Claude Desktop 安装位置
- 装 / 卸 asar 类补丁（tier-2 / 3 / 5 + 3 个 desktop-*）时不再蹦独立 cmd 窗口，stdout 直通 panel 的实时日志

如果 UAC 点"否"：panel 退出。tier-1 / 2.5 / persona 这些不需要 admin 的补丁也跑不起来——因为 panel 进程本身就退出了。

如果你不希望 panel 自动提权：编辑 `panel.py` 顶部，把 `if os.name == "nt" and not is_admin(): ... relaunch_as_admin()` 这一段删掉。但这样 asar 类补丁会装不动。

## 端口

写死 `127.0.0.1:5500`（仅本地访问）。要改：编辑 `panel.py` 顶部的 `PORT` 常量。

## 为什么不打包成 exe

Flask + 浏览器 = 跨平台、零打包、改起来简单。打包成原生 exe 反而引入维护成本。GUI 用浏览器渲染体验跟原生差不多。

## 跟其他东西的关系

- panel 不动 Claude Desktop 二进制——它只是按钮触发已有的 install.py
- 跟所有 5 档 / 风格层 / UI 补丁互不冲突
- 跟 session-browser 有交互（启动/停止它），其他完全独立
