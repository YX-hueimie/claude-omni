# session-browser

本地起一个 Flask 服务，浏览 / 编辑 / 删除 / 恢复 Claude Code 的历史会话（`~/.claude/projects/<project>/*.jsonl`）。

## 装什么

```
pip install flask markdown
```

`flask` 是必需的，没装 `markdown` 也能跑——只是消息内容会显示原始文本，不渲染 markdown。

## 怎么用

双击 `start.bat`（Windows），浏览器自动打开 `http://127.0.0.1:5193`。

或命令行：

```
python session_browser.py
```

启动后默认列出最近活跃的项目；点项目进去看里面所有 session（按时间倒序），点单个 session 看完整对话。

## 它能做什么

| 操作 | 说明 |
|---|---|
| 浏览 | 列项目 → 列 session → 看消息（user / assistant / tool 调用结果，分类显示） |
| 编辑 | 改单条消息内容（直接改 jsonl 那一行） |
| 删除 | 删单个 session 或批量删 |
| 备份 | 编辑 / 删除前自动备份成 `<sid>.bak.<timestamp>` 同目录留存 |
| 恢复 | 列出某个 session 的所有备份，可一键还原到任何一个版本 |

所有改动只动 `~/.claude/projects/<project>/<sid>.jsonl` 这一份文件——不动 Claude Code 客户端本身、不动其他 patch、不动 asar。

## 端口 / 主机

写死 `127.0.0.1:5193`（本地访问）。要改：编辑 `session_browser.py` 顶部的 `PORT` / `HOST` 常量。

## 为什么有这个工具

调试 jailbreak 配置时经常要回看历史会话——比如看模型在 tier-2 vs tier-5 下对同一题的输出差异、找出某次拒答时的具体上下文。Claude Code 自带的会话查看体验在长 session 上不够顺，这工具把所有 session 摊平给浏览器看。

跟 5 档 jailbreak 没有依赖——独立工具，装不装、用不用都不影响 tier 安装。

## 跟其他东西的关系

- 不动 Claude Desktop 二进制
- 不修改任何 jailbreak / persona / UI 补丁的 marker
- 跟 5 档 / 风格层 / UI 补丁 完全独立，可以同时跑
