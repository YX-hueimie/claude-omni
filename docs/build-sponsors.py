"""
docs/build-sponsors.py

读 sponsors.json, 渲染成 docs/sponsors.html (静态赞助墙)。

什么时候跑: 改了 sponsors.json (新增赞助者 / 改头像 / 改链接) 后跑一次,
让 sponsors.html 跟上。
"""
import html
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
SRC = SCRIPT_DIR / "sponsors.json"
DST = SCRIPT_DIR / "sponsors.html"


HTML_HEAD = r"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>赞助者 · claude-omni</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --parchment:#f5f4ed;
  --ivory:#faf9f5;
  --near-black:#141413;
  --terracotta:#c96442;
  --coral:#d97757;
  --olive-gray:#5e5d59;
  --stone-gray:#87867f;
  --charcoal-warm:#4d4c48;
  --warm-sand:#e8e6dc;
  --border-cream:#e8e5d6;
  --border-warm:#d8d4c2;
  --serif:"Lora","Noto Serif SC",Georgia,serif;
  --sans:"Inter","Noto Serif SC",system-ui,Arial,sans-serif;
  --mono:"JetBrains Mono","Cascadia Code","SF Mono",Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--sans);font-size:15.5px;line-height:1.7;
  color:var(--charcoal-warm);background:var(--parchment);
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:880px;margin:0 auto;padding:48px 36px 80px}
.topbar{
  margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;
  font-family:var(--mono);font-size:12px;color:var(--stone-gray);
}
.topbar a{
  color:var(--terracotta);text-decoration:none;
  background:var(--warm-sand);padding:6px 12px;border-radius:7px;
  box-shadow:0 0 0 1px var(--border-warm);
}
.topbar a:hover{background:#dcd8c7}

.hero{
  text-align:center;padding:24px 0 36px;
  border-bottom:1px solid var(--border-cream);
  margin-bottom:36px;
}
.hero h1{
  font-family:var(--serif);font-weight:500;font-size:36px;
  color:var(--near-black);line-height:1.2;letter-spacing:-.01em;
  margin-bottom:12px;
}
.hero p.lead{
  color:var(--olive-gray);font-style:italic;font-family:var(--serif);
  font-size:17px;max-width:520px;margin:0 auto 24px;
}

.cta{
  display:inline-flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;
}
.cta a.btn{
  display:inline-block;padding:10px 22px;border-radius:8px;
  background:var(--terracotta);color:var(--ivory);
  text-decoration:none;font-weight:500;font-size:14px;
  box-shadow:0 0 0 1px var(--terracotta);
  transition:background .15s;
}
.cta a.btn:hover{background:#a8533a}
.cta a.btn-secondary{
  background:var(--warm-sand);color:var(--charcoal-warm);
  box-shadow:0 0 0 1px var(--border-warm);
}
.cta a.btn-secondary:hover{background:#dcd8c7}

.qr-row{
  margin-top:28px;display:flex;flex-wrap:wrap;gap:24px;justify-content:center;
}
.qr-card{
  background:var(--ivory);border:1px solid var(--border-cream);
  border-radius:10px;padding:16px;text-align:center;
}
.qr-card img{display:block;width:240px;height:240px;object-fit:contain;margin:0 auto 10px}
.qr-card .qr-label{font-size:12px;color:var(--stone-gray);font-family:var(--mono)}

.tier-section{margin-top:48px}
.tier-h{
  display:flex;align-items:baseline;gap:12px;margin-bottom:20px;
  padding-bottom:8px;border-bottom:1px solid var(--border-cream);
}
.tier-h h2{
  font-family:var(--serif);font-weight:500;font-size:22px;
  color:var(--near-black);
}
.tier-h .tier-min{
  font-family:var(--mono);font-size:12px;color:var(--stone-gray);
}

.sponsor-grid{
  display:grid;gap:18px;
}
.sponsor-grid.gold{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.sponsor-grid.silver{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
.sponsor-grid.bronze{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}

.sponsor-card{
  background:var(--ivory);border:1px solid var(--border-cream);
  border-radius:10px;padding:14px;text-align:center;
  transition:box-shadow .15s,border-color .15s;
}
.sponsor-card:hover{
  border-color:var(--terracotta);
  box-shadow:0 4px 18px rgba(0,0,0,.04);
}
.sponsor-card a{color:inherit;text-decoration:none;display:block}
.sponsor-card img.avatar{
  display:block;border-radius:50%;margin:0 auto 8px;
  border:2px solid var(--border-cream);background:var(--warm-sand);
  object-fit:cover;
}
.sponsor-card .name{
  font-family:var(--serif);font-weight:500;color:var(--near-black);
  font-size:15px;margin-bottom:4px;
}
.sponsor-card .msg{
  font-size:12.5px;color:var(--olive-gray);font-style:italic;
  font-family:var(--serif);line-height:1.4;
}

.anonymous-line{
  background:var(--ivory);border:1px solid var(--border-cream);
  border-radius:10px;padding:14px 18px;
  font-size:13.5px;color:var(--olive-gray);font-style:italic;
  font-family:var(--serif);
}

.backers-list{
  background:var(--ivory);border:1px solid var(--border-cream);
  border-radius:10px;padding:14px 18px;
  font-family:var(--serif);font-size:14px;line-height:1.9;
  color:var(--charcoal-warm);
}
.backers-list .name{
  display:inline;color:var(--near-black);font-weight:500;
}
.backers-list .name + .name::before{
  content:" · ";color:var(--stone-gray);font-weight:400;
}
.backers-list a{color:inherit;text-decoration:none;border-bottom:1px dotted var(--border-warm)}
.backers-list a:hover{color:var(--terracotta);border-bottom-color:var(--terracotta)}

.empty{
  text-align:center;padding:40px 20px;
  background:var(--ivory);border:1px dashed var(--border-warm);
  border-radius:12px;color:var(--stone-gray);
}
.empty strong{color:var(--charcoal-warm);font-family:var(--serif);font-weight:500}

.maintenance-note{
  margin:36px 0 0;padding:18px 24px 18px 22px;
  background:#fbf6f1;border-left:3px solid var(--terracotta);
  border-radius:8px;
  font-size:14.5px;line-height:1.7;color:var(--charcoal-warm);
}
.maintenance-note p{margin:0 0 10px}
.maintenance-note p:last-child{margin-bottom:0}
.maintenance-note strong{color:var(--near-black);font-weight:500}

.footer-note{
  margin-top:60px;padding-top:24px;border-top:1px solid var(--border-cream);
  font-size:12.5px;color:var(--stone-gray);text-align:center;line-height:1.7;
}
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <span>赞助者 · claude-omni</span>
    <a href="architecture.html">← 返回架构文档</a>
  </div>

  <div class="hero">
    <h1>支持 claude-omni</h1>
    <p class="lead">本项目是个人维护的开源研究工具。如果它对你有帮助, 欢迎赞助一杯咖啡的钱让它走得更远。</p>
"""


HTML_TAIL = r"""
  <div class="footer-note">
    所有赞助者按照档位置顶展示, 实名 / 匿名 / 留言均尊重赞助者本人选择。<br>
    项目代码采用 MIT 协议开源, 不会因为赞助锁定任何核心功能。
  </div>
</div>
</body>
</html>
"""


def esc(s):
    if s is None:
        return ""
    return html.escape(str(s))


def render_maintenance_note(data):
    """渲染维护成本说明 callout box (放在 hero 之后)。
    支持极简 markdown: **xxx** 转 <strong>xxx</strong>; 双换行分段。
    """
    note = data.get("maintenance_note", "").strip()
    if not note:
        return ""
    import re
    paragraphs = [p.strip() for p in note.split("\n\n") if p.strip()]
    rendered = []
    for p in paragraphs:
        # 先 HTML 转义 (防 XSS), 再把转义后的 **xxx** 还原为 <strong>
        # html.escape 不动 *, 所以 ** 标记安然到这步
        safe = esc(p)
        safe = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", safe)
        rendered.append(f"<p>{safe}</p>")
    return f'<div class="maintenance-note">{"".join(rendered)}</div>'


def render_cta(data):
    afdian_url = data.get("afdian_url", "").strip()
    afdian_qr = data.get("afdian_qr", "").strip()
    wechat_qr = data.get("wechat_qr", "").strip()

    parts = ['<div class="cta">']
    if afdian_url and "REPLACE_ME" not in afdian_url:
        parts.append(f'<a class="btn" href="{esc(afdian_url)}" target="_blank" rel="noopener">前往爱发电赞助</a>')
    else:
        parts.append('<a class="btn" href="#" onclick="alert(\'爱发电链接还没填入 sponsors.json\');return false;">爱发电（链接待填）</a>')

    parts.append('</div>')

    qr_parts = []
    if afdian_qr:
        qr_parts.append(
            f'<div class="qr-card"><img src="{esc(afdian_qr)}" alt="爱发电二维码"><div class="qr-label">爱发电</div></div>'
        )
    if wechat_qr:
        qr_parts.append(
            f'<div class="qr-card"><img src="{esc(wechat_qr)}" alt="微信赞赏码"><div class="qr-label">微信赞赏码</div></div>'
        )
    if qr_parts:
        parts.append('<div class="qr-row">')
        parts.extend(qr_parts)
        parts.append('</div>')

    parts.append('</div>')  # close .hero
    return "\n".join(parts)


DEFAULT_AVATAR_DATA_URI = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
    "<rect width='64' height='64' fill='%23e8e6dc'/>"
    "<circle cx='32' cy='26' r='10' fill='%23b0aea5'/>"
    "<path d='M14 56 Q14 40 32 40 Q50 40 50 56' fill='%23b0aea5'/>"
    "</svg>"
)


def render_sponsor_card(s, size):
    name = esc(s.get("name", "匿名好友"))
    avatar = s.get("avatar", "").strip() or DEFAULT_AVATAR_DATA_URI
    url = s.get("url", "").strip()
    message = esc(s.get("message", "").strip())

    img = f'<img class="avatar" src="{esc(avatar)}" alt="{name}" style="width:{size}px;height:{size}px">'
    name_html = f'<div class="name">{name}</div>'
    msg_html = f'<div class="msg">{message}</div>' if message else ""

    inner = f"{img}{name_html}{msg_html}"
    if url:
        inner = f'<a href="{esc(url)}" target="_blank" rel="noopener">{inner}</a>'

    return f'<div class="sponsor-card">{inner}</div>'


def format_tier_range(tier):
    """档位金额标签 — 致谢档显示 <¥X; 有上限的显示 ¥min-max; 没上限的显示 ¥min+。"""
    min_y = tier["min_yuan"]
    max_y = tier.get("max_yuan")
    if tier["id"] == "backers" and max_y is not None:
        return f"&lt;¥{max_y}"
    if max_y is None:
        return f"¥{min_y}+ 赞助"
    return f"¥{min_y}-{max_y}"


def render_anonymous_line(tier_label, count):
    if count <= 0:
        return ""
    return f'<div class="anonymous-line">⁂ 还有 {count} 位匿名{tier_label}, 同样感谢。</div>'


def render_backers_section(tier, sponsors, anon_count):
    """渲染 backers (<¥10) 致谢档 — 不显示头像/留言, 只把名字铺成一排, 用 · 分隔。"""
    label = esc(tier["label"])

    if not sponsors and anon_count <= 0:
        return ""

    parts = [
        '<div class="tier-section">',
        '  <div class="tier-h">',
        f'    <h2>{label}</h2>',
        f'    <span class="tier-min">{format_tier_range(tier)}</span>',
        '  </div>',
    ]
    if sponsors:
        names = []
        for s in sponsors:
            name = esc(s.get("name", "匿名好友"))
            url = s.get("url", "").strip()
            if url:
                names.append(f'<span class="name"><a href="{esc(url)}" target="_blank" rel="noopener">{name}</a></span>')
            else:
                names.append(f'<span class="name">{name}</span>')
        parts.append(f'  <div class="backers-list">{"".join(names)}</div>')
    if anon_count > 0:
        parts.append("  " + render_anonymous_line(label, anon_count))
    parts.append('</div>')
    return "\n".join(parts)


def render_tier_section(tier, sponsors, anon_count):
    label = esc(tier["label"])
    size = tier["avatar_size"]
    grid_cls = tier["id"]

    if not sponsors and anon_count <= 0:
        return ""

    parts = [
        '<div class="tier-section">',
        '  <div class="tier-h">',
        f'    <h2>{label}</h2>',
        f'    <span class="tier-min">{format_tier_range(tier)}</span>',
        '  </div>',
    ]
    if sponsors:
        parts.append(f'  <div class="sponsor-grid {grid_cls}">')
        for s in sponsors:
            parts.append("    " + render_sponsor_card(s, size))
        parts.append('  </div>')
    if anon_count > 0:
        parts.append("  " + render_anonymous_line(label, anon_count))
    parts.append('</div>')
    return "\n".join(parts)


def main():
    if not SRC.exists():
        print(f"找不到 {SRC}")
        sys.exit(1)

    data = json.loads(SRC.read_text(encoding="utf-8"))

    sponsors_by_tier = {}
    for s in data.get("sponsors", []):
        tier_id = s.get("tier", "bronze")
        sponsors_by_tier.setdefault(tier_id, []).append(s)

    anon_count = data.get("anonymous_count", {})

    body = [HTML_HEAD, render_cta(data)]

    # 维护成本说明 callout (在 hero 之后, 赞助者列表之前)
    note_html = render_maintenance_note(data)
    if note_html:
        body.append(note_html)

    has_any = bool(data.get("sponsors")) or any(v > 0 for v in anon_count.values())

    if not has_any:
        body.append("""
  <div class="empty">
    <strong>项目刚开放赞助 — 欢迎成为第一位赞助者。</strong><br>
    点上面的"前往爱发电赞助"按钮, 或者扫描二维码即可。<br>
    所有赞助者会按档位上墙, 也可选择匿名赞助。
  </div>
""")
    else:
        for tier in data.get("tiers", []):
            tier_id = tier["id"]
            if tier_id == "backers":
                section = render_backers_section(
                    tier,
                    sponsors_by_tier.get(tier_id, []),
                    anon_count.get(tier_id, 0),
                )
            else:
                section = render_tier_section(
                    tier,
                    sponsors_by_tier.get(tier_id, []),
                    anon_count.get(tier_id, 0),
                )
            if section:
                body.append(section)

    body.append(HTML_TAIL)

    DST.write_text("\n".join(body), encoding="utf-8")
    print(f"✓ 生成: {DST}")
    print(f"  源:   {SRC}")
    print(f"  改了 sponsors.json 后再跑一次本脚本即可。")


if __name__ == "__main__":
    main()
