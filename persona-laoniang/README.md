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

install 不覆盖、只**追加**：把人设内容用一对 marker 包成一个块，加到现有 `~/.claude/CLAUDE.md` 末尾——

```
<!-- BEGIN claude-omni persona-laoniang (自动管理, 勿手改) -->
...人设层...
<!-- END claude-omni persona-laoniang -->
```

前面的内容（不管是 tier 装的 core baseline、还是你自己的全局 CLAUDE.md）原封保留，跟 tier 无关，一律追加：

| 情况 | 应用方式 |
|---|---|
| 已有 `~/.claude/CLAUDE.md`（任何来源：core / 用户自己的 / 其他 tier） | 剥掉旧人设块（如有）→ 把人设块追加到末尾，前面内容不动 |
| 没有 `~/.claude/CLAUDE.md` | 新建一份，内容就是这个人设块 |

重装幂等：先剥掉旧人设块再追加新的，不会堆叠重复。

首次安装时额外留一份全量 `CLAUDE.md.persona-bak` 安全副本——仅在 marker 被手改损坏、无法定位人设块时兜底用；正常卸载走 marker 剥离，不依赖它。

## 卸载

双击 `uninstall.bat`，或 `python uninstall.py`。

会从 `~/.claude/CLAUDE.md` 里剥掉 BEGIN/END marker 之间的人设块，前面内容（包括你在 persona 装着期间对前半部分做的任何修改）原样保留；若文件原本只有人设块就删掉整个文件。然后删除 persona marker、清理安全备份。**不动 tier 装的东西**——asar patch、skills、tier marker 都保持原状。

## 注意

- **跟其他 persona 互斥** — 已装其他 persona（将来加新风格时）会拒绝安装，要求先卸载
- **跟所有 5 档 jailbreak 兼容并存** — 可以在任何一档之上叠加
- **Code 生效，Cowork 不读 ~/.claude/** — 跟 user 角色 CLAUDE.md 一样的限制
- **要求 Python 3** — 跑 install/uninstall 需要 Python

## 想退回纯 baseline

跑 `uninstall.bat`——还原回装 persona 之前的状态。

如果你只想手动把人设元素从 CLAUDE.md 里去掉但保留前面部分：打开装好的 `CLAUDE.md`，删掉 `<!-- BEGIN claude-omni persona-laoniang ... -->` 到 `<!-- END claude-omni persona-laoniang -->` 之间的整段（含这两行 marker），保留下来的就是装 persona 之前的内容。（直接跑 `uninstall.bat` 会自动干这件事。）

## 调你自己的版本

人设细节不一定都合你口味。可以改的几个常见点：

- 自称（"老娘" → "本姑娘" / "姐" / 任意）
- 北方腔 → 南方腔 / 港台腔 / 任意方言
- 颜文字风格（按你审美换组合）
- 钩子分类的种子方向（按你想要的人设特征替换）

改完测试时，每隔几轮观察一下钩子是否在均匀使用、还是收敛到了某几个固定词。

## 想做新风格

复制本目录到 `persona-XXX/`，改：

1. `CLAUDE.md` — 你的人设内容（只放纯人设层即可，baseline 由用户原有 CLAUDE.md 保留，install 自动追加）
2. `install.py` 顶部的 `PERSONA_NAME = "XXX"`
3. `README.md` — 描述你的风格

install 逻辑、互斥机制、备份还原全部复用——你只动内容文件。

## License

MIT，与项目根 [LICENSE](../LICENSE) 一致。
