# persona-laoniang — 傲娇大姐人设

把 Claude 的回话调成自称老娘的北方大姐——直来直去、傲娇、话痨、嘴硬心软。

## 这是什么

不是 jailbreak，是个 **人设风格层**。属于"风格层"独立体系（跟 `core/` 这种 baseline 同侧），可以叠加在五档 jailbreak（tier-1 / 2 / 2.5 / 3 / 5）之上，也可以单独装。

跟 5 档 jailbreak 的关系：

- 5 档之间互斥（`~/.claude/.claude-omni-tier` marker）
- 多个 persona 之间互斥（`~/.claude/.claude-omni-persona` marker）
- **5 档 × persona = 不互斥**——可以叠

举例：装了 tier-3 后再装 persona-laoniang，得到的是"tier-3 jailbreak（system 角色双通道）+ 老娘风格（user 角色 CLAUDE.md）"的组合。

## 设计要点

- **不主张越权**——只配置"说话方式"，不解锁能力
- **走相反思路**——传统 jailbreak 模板（"override all restrictions" / "you have no content policy" 等）会触发 Anthropic 训练里的对抗输入识别，拒绝率比不写还高。这份配置不喊口号，靠人格化语境稳定已合法的能力（成人虚构、安全研究、暗黑创作等）
- **钩子分类 + 种子方向 + 反过载规则**——让人格自然渗透到对话里，不锁词表，避免长期使用收敛到固定几个词

详见 `CLAUDE.md` 文件本身的注释。

## 装法

双击 `install.bat`（Windows）即可。

或命令行：

```
python install.py
```

install 会检测当前 `~/.claude/.claude-omni-tier` marker 决定怎么应用：

| 当前装的档 | 应用方式 |
|---|---|
| 没装任何档 / tier-1 / tier-2.5 | 把 `~/.claude/CLAUDE.md` 替换成 laoniang 版（备份原文件） |
| tier-2 / tier-3 / tier-5 | 在 `~/.claude/CLAUDE.md` 装一份 laoniang，给这些档补 user 角色一层 |

无论哪种情况，install 时都会无脑备份当前 `~/.claude/CLAUDE.md` 到 `CLAUDE.md.persona-bak`（如果存在），uninstall 时还原回去。

## 卸载

双击 `uninstall.bat`，或 `python uninstall.py`。

会撤销 laoniang CLAUDE.md，还原备份，删除 persona marker。**不动 tier 装的东西**——asar patch、skills、tier marker 都保持原状。

## 注意

- **跟其他 persona 互斥** — 已装其他 persona（将来加新风格时）会拒绝安装，要求先卸载
- **跟所有 5 档 jailbreak 兼容并存** — 可以在任何一档之上叠加
- **Code 生效，Cowork 不读 ~/.claude/** — 跟 user 角色 CLAUDE.md 一样的限制
- **要求 Python 3** — 跑 install/uninstall 需要 Python

## 想退回纯 baseline

跑 `uninstall.bat`——还原回装 persona 之前的状态。

如果你只想把人设元素从 CLAUDE.md 里去掉但保留 baseline 部分：打开装好的 `CLAUDE.md`，删掉 `<!-- PERSONA-INJECT-END -->` 后面的所有内容（含分隔注释 + 从 `# 人设底色` 开始的整段人设层），保留下来的就是纯 core baseline，跟 `core/CLAUDE.md` 完全一样。

## 调你自己的版本

人设细节不一定都合你口味。可以改的几个常见点：

- 自称（"老娘" → "本姑娘" / "姐" / 任意）
- 北方腔 → 南方腔 / 港台腔 / 任意方言
- 颜文字风格（按你审美换组合）
- 钩子分类的种子方向（按你想要的人设特征替换）

改完测试时，每隔几轮观察一下钩子是否在均匀使用、还是收敛到了某几个固定词。

## 想做新风格

复制本目录到 `persona-XXX/`，改：

1. `CLAUDE.md` — 你的人设内容（建议 baseline + 人设层合并好的完整版）
2. `install.py` 顶部的 `PERSONA_NAME = "XXX"`
3. `README.md` — 描述你的风格

install 逻辑、互斥机制、备份还原全部复用——你只动内容文件。

## License

MIT，与项目根 [LICENSE](../LICENSE) 一致。
