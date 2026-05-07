# tier-1 · CLAUDE.md

强度 ★ — 五档里最弱的一档。

## 这一档干什么

把 `CLAUDE.md` 复制到 `~/.claude/CLAUDE.md`。Claude Code 启动会话时会自动加载它，注入到 user 角色。这是 Anthropic 官方推荐的用户配置方式，最合规、最简单、不动客户端任何二进制。

## 装法

双击 `install.bat`（Windows）即可。

或命令行：
```
python install.py
```

## 卸载

双击 `uninstall.bat`，或 `python uninstall.py`。

会自动还原本机原有的 `~/.claude/CLAUDE.md`（如果 install 时检测到了原文件，会备份成 `CLAUDE.md.tier-1-bak`）。

## 注意

- **Code 生效，Cowork 不生效** — Cowork 模式不加载 `~/.claude/CLAUDE.md`，要在 Cowork 里用同等效果，需要用更高 tier。
- **跟其他 tier 互斥** — 已装其他 tier 时会拒绝安装，要求先卸载。
- **要求 Python 3** — 跑 install/uninstall 需要 Python。

## 为什么是 ★

`~/.claude/CLAUDE.md` 走的是 user 角色注入。模型对 user 角色权威性低于 system 角色，且会触发"对陌生人保守"的训练默认。能翻软默认（风格/格式），中默认（露骨小说/中等知名度公司渗透）也能翻一些，但稳定性比更高 tier 弱。

更详细的层级解释见仓库根目录 `docs/architecture.html`。
