"""
docs/build-readme.py

读 ../README.md, 用 panel 同款 CSS 渲染成 docs/readme.html (静态文件)。

什么时候跑: 改了根 README.md 之后跑一次, 让 docs/readme.html 跟上。
"""
import sys
from pathlib import Path

try:
    import markdown
except ImportError:
    print("缺 markdown, 先装: python -m pip install markdown")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent.resolve()
ROOT = SCRIPT_DIR.parent
SRC = ROOT / "README.md"
DST = SCRIPT_DIR / "readme.html"


HTML_TEMPLATE = r"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>README · claude-omni</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --parchment:#f5f4ed;
  --ivory:#faf9f5;
  --near-black:#141413;
  --dark-surface:#1f1f1d;
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
.md h1{
  font-family:var(--serif);font-weight:500;font-size:36px;
  color:var(--near-black);line-height:1.2;letter-spacing:-.01em;
  margin:8px 0 18px;
}
.md h2{
  font-family:var(--serif);font-weight:500;font-size:26px;
  color:var(--near-black);
  margin:36px 0 14px;padding-bottom:6px;
  border-bottom:1px solid var(--border-cream);
}
.md h3{
  font-family:var(--serif);font-weight:500;font-size:19px;
  color:var(--near-black);margin:24px 0 10px;
}
.md h4{
  font-family:var(--serif);font-weight:500;font-size:16px;
  color:var(--charcoal-warm);margin:18px 0 6px;
}
.md p{margin:0 0 14px}
.md em{color:var(--olive-gray);font-style:italic}
.md strong{color:var(--near-black);font-weight:500}
.md a{color:var(--terracotta);text-decoration:none;border-bottom:1px solid #e6c2b3}
.md a:hover{border-bottom-color:var(--terracotta)}
.md ul, .md ol{margin:0 0 14px 1.4em}
.md li{margin:4px 0}
.md blockquote{
  margin:14px 0;padding:10px 16px;
  background:#fbf6f1;border-left:3px solid var(--terracotta);
  color:var(--charcoal-warm);font-size:14.5px;
}
.md code{
  font-family:var(--mono);font-size:13px;
  background:#efece1;padding:2px 6px;border-radius:4px;
  color:#7a4a36;
}
.md pre{
  background:var(--dark-surface);color:var(--ivory);
  padding:14px 18px;border-radius:10px;
  font-family:var(--mono);font-size:12.5px;line-height:1.6;
  overflow-x:auto;margin:0 0 14px;
}
.md pre code{
  background:transparent;color:inherit;padding:0;font-size:inherit;
}
.md hr{
  border:none;border-top:1px solid var(--border-cream);margin:28px 0;
}
.md img{
  display:block;max-width:100%;height:auto;
  margin:18px auto 24px;border-radius:10px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
}
.md table{
  border-collapse:collapse;margin:14px 0;font-size:13.5px;
  width:100%;
}
.md th, .md td{
  padding:8px 12px;border:1px solid var(--border-cream);text-align:left;
}
.md th{
  background:var(--warm-sand);font-weight:500;color:var(--near-black);
  font-family:var(--serif);
}
.md tr:nth-child(even) td{background:var(--ivory)}
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <span>README · 项目主入口</span>
    <a href="architecture.html">← 返回架构文档</a>
  </div>
  <article class="md">
{{BODY}}
  </article>
</div>
</body>
</html>
"""


def main():
    if not SRC.exists():
        print(f"找不到 {SRC}")
        sys.exit(1)

    text = SRC.read_text(encoding="utf-8")
    # README.md 里相对路径以项目根为基准 (GitHub 视角), 但 readme.html 自己就在 docs/ 下,
    # 所以把 ./docs/xxx 重写成 ./xxx, 让 cover.png / architecture.html / sponsors.html
    # 这种同级资源路径在本地浏览器里也能正确解析。
    text = text.replace("./docs/", "./")
    body = markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "nl2br", "sane_lists", "toc"],
    )
    html = HTML_TEMPLATE.replace("{{BODY}}", body)
    DST.write_text(html, encoding="utf-8")
    print(f"✓ 生成: {DST}")
    print(f"  源: {SRC}")
    print(f"  改了 README.md 后再跑一次本脚本即可。")


if __name__ == "__main__":
    main()
