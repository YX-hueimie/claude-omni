"""
Claude Desktop session browser

Flask 本地服务, 端口 5193。启动后浏览器自动打开 http://127.0.0.1:5193,
列出 ~/.claude/projects/<project>/ 下所有 session jsonl, 渲染对话内容供浏览。

支持: 浏览 / 编辑单条消息 / 删除单个或批量 session / 列出每个 session 的备份历史 /
      还原到任意备份。所有改动自动备份到 <sid>.bak.<timestamp> 同目录留存。
"""
import json
import os
import re
import sys
import time
import threading
import webbrowser
from pathlib import Path
from datetime import datetime

try:
    from flask import Flask, abort, url_for, send_from_directory, request, jsonify
    from jinja2 import Environment
except ImportError:
    print("缺 Flask，先装：pip install flask")
    sys.exit(1)

try:
    import markdown as _md
    _MD = _md.Markdown(
        extensions=["fenced_code", "tables", "nl2br", "sane_lists"],
        output_format="html5",
    )
    def render_markdown(text):
        if not text:
            return ""
        _MD.reset()
        return _MD.convert(text)
except ImportError:
    # 没装 markdown 库就 fallback 到原始文本（HTML escape 由 jinja 做）
    def render_markdown(text):
        return text or ""

# ---------- 配置 ----------
PROJECTS_ROOT = Path.home() / ".claude" / "projects"
DEFAULT_PROJECT_ID = ""  # 没指定时默认；空字符串让首页直接走"取最新项目"逻辑
PORT = 5193
HOST = "127.0.0.1"
FONTS_DIR = Path(__file__).parent / "fonts"

app = Flask(__name__)

# 跟踪本进程 write 的 mtime, 避免外部活跃检测把自身写入误判为外部修改
LAST_SELF_WRITE = {}  # sid → mtime float


def get_project_dir(project_id):
    return PROJECTS_ROOT / project_id


def list_projects():
    """扫描所有 Claude Code 项目目录，每个读 jsonl 里的 cwd 拿真实路径。"""
    if not PROJECTS_ROOT.exists():
        return []
    projects = []
    for d in PROJECTS_ROOT.iterdir():
        if not d.is_dir():
            continue
        # 取最新 jsonl 的 cwd
        jsonls = list(d.glob("*.jsonl"))
        if not jsonls:
            continue
        # 跳过 .bak 文件
        jsonls = [p for p in jsonls if ".bak" not in p.name]
        if not jsonls:
            continue
        # 用 mtime 最新的 jsonl
        jsonls.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        cwd = None
        for jp in jsonls[:3]:  # 试前 3 个
            try:
                with open(jp, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f):
                        if i > 50:
                            break
                        try:
                            obj = json.loads(line)
                            if obj.get("cwd"):
                                cwd = obj["cwd"]
                                break
                        except Exception:
                            continue
                if cwd:
                    break
            except Exception:
                continue
        if not cwd:
            cwd = d.name  # fallback 用目录名

        latest_mtime = jsonls[0].stat().st_mtime
        # 友好名：取 cwd 路径最后一段
        try:
            short_name = Path(cwd).name or cwd
        except Exception:
            short_name = cwd

        # 判断是不是临时项目（路径含 \Temp\ 或 \tmp）
        is_temp = bool(re.search(r"[\\/](?:Temp|temp)[\\/]", cwd)) or "tmp" in d.name.lower()
        projects.append({
            "id": d.name,
            "cwd": cwd,
            "short_name": short_name,
            "session_count": len(jsonls),
            "mtime": latest_mtime,
            "is_temp": is_temp,
        })
    # 排序：非 temp 在前（按 mtime 倒序），temp 在后（按 mtime 倒序）
    projects.sort(key=lambda p: (p["is_temp"], -p["mtime"]))
    return projects


# ---------- 数据层 ----------
def extract_text(content):
    """从 message.content 抽出主要文本"""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text" and "text" in item:
                    parts.append(item["text"])
                elif item.get("type") == "tool_use":
                    parts.append(f"[tool_use: {item.get('name','?')}]")
                elif item.get("type") == "tool_result":
                    c = item.get("content", "")
                    if isinstance(c, str):
                        parts.append(c)
                    elif isinstance(c, list):
                        for ci in c:
                            if isinstance(ci, dict) and "text" in ci:
                                parts.append(ci["text"])
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)
    return ""


def get_session_title(path):
    """读首条非元/非工具的用户消息作为 session 名"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("type") != "user":
                    continue
                if obj.get("isMeta") or obj.get("isSidechain"):
                    continue
                if obj.get("toolUseResult") is not None:
                    continue
                msg = obj.get("message", {})
                content = msg.get("content", "")
                # 跳过 tool_result 类
                if isinstance(content, list):
                    has_real_text = False
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "tool_result":
                            break
                        if isinstance(item, dict) and item.get("type") == "text":
                            has_real_text = True
                            break
                        if isinstance(item, str):
                            has_real_text = True
                            break
                    if not has_real_text:
                        continue
                text = extract_text(content).strip()
                # 去掉开头的 system-reminder 块
                text = re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S)
                text = text.strip()
                # 跳过 caveat 系统注入
                if text.startswith("Caveat:") or text.startswith("<command-name>"):
                    continue
                if not text:
                    continue
                return text[:100]
    except Exception:
        pass
    return None


def list_sessions(project_id):
    project_dir = get_project_dir(project_id)
    sessions = []
    if not project_dir.exists():
        return sessions
    for p in project_dir.glob("*.jsonl"):
        if ".bak" in p.name:
            continue
        sid = p.stem
        try:
            stat = p.stat()
        except Exception:
            continue
        # 数行
        line_count = 0
        try:
            with open(p, "rb") as f:
                for _ in f:
                    line_count += 1
        except Exception:
            line_count = -1
        title = get_session_title(p) or "(空会话)"
        active = (time.time() - stat.st_mtime) < 30
        sessions.append(
            {
                "id": sid,
                "title": title,
                "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                "mtime_ts": stat.st_mtime,
                "size_kb": round(stat.st_size / 1024, 1),
                "lines": line_count,
                "active": active,
            }
        )
    sessions.sort(key=lambda s: s["mtime_ts"], reverse=True)
    return sessions


SYSTEM_REMINDER_RE = re.compile(r"<system-reminder>(.*?)</system-reminder>", re.S)


def split_user_text(text):
    """把 user 文本里的 system-reminder 单独抽出来"""
    reminders = SYSTEM_REMINDER_RE.findall(text)
    main = SYSTEM_REMINDER_RE.sub("", text).strip()
    return main, reminders


def render_message(obj):
    """把一个 jsonl 对象转成展示用的 dict"""
    t = obj.get("type", "")
    line_no = obj.get("_line_no", 0)
    out = {"line_no": line_no, "kind": t, "raw_keys": list(obj.keys())}

    if t == "user":
        msg = obj.get("message", {})
        content = msg.get("content", "")
        # 是 tool_result 形式吗
        is_tool_result = False
        tool_result_blocks = []
        plain_text_parts = []
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "tool_result":
                    is_tool_result = True
                    tc = item.get("content", "")
                    if isinstance(tc, str):
                        tool_result_blocks.append(tc)
                    elif isinstance(tc, list):
                        for ci in tc:
                            if isinstance(ci, dict) and "text" in ci:
                                tool_result_blocks.append(ci["text"])
                elif isinstance(item, dict) and item.get("type") == "text":
                    plain_text_parts.append(item.get("text", ""))
                elif isinstance(item, str):
                    plain_text_parts.append(item)
        elif isinstance(content, str):
            plain_text_parts.append(content)

        text_full = "\n".join(plain_text_parts)
        is_meta = obj.get("isMeta") or False

        if is_tool_result:
            out["kind"] = "tool_result"
            text = "\n".join(tool_result_blocks)
            out["text"] = text
            out["is_error"] = False
            for item in content if isinstance(content, list) else []:
                if isinstance(item, dict) and item.get("is_error"):
                    out["is_error"] = True
            # 首行预览 + 行数（用于折叠 summary）
            first_line = ""
            for line in text.split("\n"):
                s = line.strip()
                if s:
                    first_line = s[:80]
                    break
            out["preview"] = first_line
            out["lines"] = text.count("\n") + 1 if text else 0
            return out

        main, reminders = split_user_text(text_full)
        out["kind"] = "user_meta" if is_meta else "user"
        out["text"] = main
        out["text_html"] = render_markdown(main)
        out["reminders"] = reminders
        return out

    if t == "assistant":
        msg = obj.get("message", {})
        content = msg.get("content", [])
        text_parts = []
        tool_uses = []
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        text_parts.append(item.get("text", ""))
                    elif item.get("type") == "tool_use":
                        inp = item.get("input", {})
                        # 取关键字段做 preview
                        preview = ""
                        if isinstance(inp, dict):
                            for key in ("command", "file_path", "path", "pattern",
                                        "url", "query", "prompt", "description"):
                                v = inp.get(key)
                                if isinstance(v, str) and v:
                                    preview = v.replace("\n", " ")[:100]
                                    break
                            if not preview:
                                for v in inp.values():
                                    if isinstance(v, str) and v:
                                        preview = v.replace("\n", " ")[:100]
                                        break
                        tool_uses.append(
                            {
                                "name": item.get("name", "?"),
                                "input": inp,
                                "id": item.get("id", ""),
                                "preview": preview,
                            }
                        )
        elif isinstance(content, str):
            text_parts.append(content)
        out["kind"] = "assistant"
        out["text"] = "\n".join(text_parts)
        out["text_html"] = render_markdown(out["text"])
        out["tool_uses"] = tool_uses
        return out

    if t == "attachment":
        out["kind"] = "attachment"
        att = obj.get("attachment", {}) or {}
        out["summary"] = json.dumps(att, ensure_ascii=False)[:300]
        return out

    if t == "summary":
        out["kind"] = "summary"
        out["text"] = obj.get("summary", "") or json.dumps(obj, ensure_ascii=False)[:300]
        return out

    if t == "queue-operation":
        out["kind"] = "queue"
        out["text"] = f"{obj.get('operation', '?')}: {obj.get('content', '')[:200]}"
        return out

    out["kind"] = t or "unknown"
    out["text"] = json.dumps(obj, ensure_ascii=False)[:400]
    return out


def is_dialogue_item(item):
    """判断是不是真正的"主对话"条目——只有用户消息和有文字的 Claude 回复算。"""
    kind = item.get("kind", "")
    if kind == "user":
        return bool((item.get("text") or "").strip())
    if kind == "assistant":
        return bool((item.get("text") or "").strip())
    return False


def load_session(project_id, sid):
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        return None
    raw_items = []
    with open(p, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                raw_items.append({"line_no": i, "kind": "broken", "text": line[:300]})
                continue
            obj["_line_no"] = i
            raw_items.append(render_message(obj))

    # 把连续的非对话条目合并成 tool_group——一页能看到主线对话
    items = []
    pending = []
    for it in raw_items:
        if is_dialogue_item(it):
            if pending:
                items.append({
                    "kind": "tool_group",
                    "events": pending,
                    "count": len(pending),
                    "start_line": pending[0]["line_no"],
                    "end_line": pending[-1]["line_no"],
                })
                pending = []
            items.append(it)
        else:
            pending.append(it)
    if pending:
        items.append({
            "kind": "tool_group",
            "events": pending,
            "count": len(pending),
            "start_line": pending[0]["line_no"],
            "end_line": pending[-1]["line_no"],
        })

    p_stat = p.stat()
    meta = {
        "id": sid,
        "mtime": datetime.fromtimestamp(p_stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
        "active": (time.time() - p_stat.st_mtime) < 10 and abs(p_stat.st_mtime - LAST_SELF_WRITE.get(sid, 0)) > 2,
        "size_kb": round(p_stat.st_size / 1024, 1),
        "lines": len(raw_items),
    }
    return {"meta": meta, "messages": items}


# ---------- 模板 ----------
BASE_CSS = """
@font-face {
  font-family: "Anthropic Sans";
  src: url("/fonts/AnthropicSans-Roman.woff2") format("woff2");
  font-weight: 300 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Anthropic Sans";
  src: url("/fonts/AnthropicSans-Italic.woff2") format("woff2");
  font-weight: 300 800;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Anthropic Serif";
  src: url("/fonts/AnthropicSerif-Roman.woff2") format("woff2");
  font-weight: 300 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Anthropic Serif";
  src: url("/fonts/AnthropicSerif-Italic.woff2") format("woff2");
  font-weight: 300 800;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Anthropic Mono";
  src: url("/fonts/AnthropicMono-Roman.woff2") format("woff2");
  font-weight: 300 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Anthropic Mono";
  src: url("/fonts/AnthropicMono-Italic.woff2") format("woff2");
  font-weight: 300 800;
  font-style: italic;
  font-display: swap;
}

:root {
  --parchment: #f5f4ed;
  --ivory: #faf9f5;
  --warm-sand: #e8e6dc;
  --border-cream: #f0eee6;
  --border-warm: #e8e6dc;
  --ring-warm: #d1cfc5;
  --near-black: #141413;
  --dark-surface: #30302e;
  --charcoal-warm: #4d4c48;
  --olive-gray: #5e5d59;
  --stone-gray: #87867f;
  --warm-silver: #b0aea5;
  --terracotta: #c96442;
  --coral: #d97757;
  --error-crimson: #b53333;
  --focus-blue: #3898ec;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--parchment);
  color: var(--near-black);
  font-family: "Anthropic Sans", "Inter", system-ui, -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.serif {
  font-family: "Anthropic Serif", Georgia, "Source Han Serif SC", "Songti SC", serif;
  font-weight: 500;
}

a { color: var(--charcoal-warm); text-decoration: none; }
a:hover { color: var(--terracotta); }

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.nav {
  border-bottom: 1px solid var(--border-cream);
  padding: 16px 24px;
  background: var(--parchment);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: saturate(120%) blur(2px);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.nav-title {
  font-family: "Anthropic Serif", Georgia, serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--near-black);
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
}
.project-select {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: var(--near-black);
  background: transparent;
  border: 1px solid var(--border-cream);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  max-width: 480px;
}
.project-select:hover {
  border-color: var(--ring-warm);
}
.project-select:focus {
  outline: none;
  border-color: var(--terracotta);
}
.toggle-temp-btn {
  margin-left: 8px;
  background: transparent;
  border: 1px solid var(--border-cream);
  color: var(--stone-gray);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-family: "Anthropic Sans", sans-serif;
}
.toggle-temp-btn:hover {
  color: var(--charcoal-warm);
  border-color: var(--ring-warm);
}
.nav-meta {
  font-size: 13px;
  color: var(--stone-gray);
}

h1.page-title {
  font-family: "Anthropic Serif", Georgia, serif;
  font-size: 44px;
  font-weight: 500;
  line-height: 1.15;
  margin: 24px 0 6px;
  letter-spacing: -0.015em;
}
.page-sub {
  color: var(--olive-gray);
  font-size: 17px;
  margin: 0 0 32px;
}

.card {
  background: var(--ivory);
  border: 1px solid var(--border-cream);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 12px;
  transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
}
.card:hover {
  border-color: var(--ring-warm);
  box-shadow: rgba(0,0,0,0.05) 0 4px 24px;
}
.card-link { display: block; color: inherit; }
.card-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: baseline;
}
.card-title {
  font-family: "Anthropic Serif", Georgia, serif;
  font-size: 19px;
  font-weight: 500;
  color: var(--near-black);
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}
.card-meta {
  font-size: 13px;
  color: var(--stone-gray);
  white-space: nowrap;
  display: flex;
  gap: 12px;
}
.card-meta span { white-space: nowrap; }
.card-id {
  font-family: "Anthropic Mono", "Consolas", monospace;
  font-size: 12px;
  color: var(--stone-gray);
  margin-top: 8px;
  letter-spacing: -0.02em;
}

.badge {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  font-weight: 500;
}
.badge-active {
  background: var(--terracotta);
  color: var(--ivory);
}
.badge-meta {
  background: var(--warm-sand);
  color: var(--charcoal-warm);
}

/* session detail */
.thread { margin-top: 16px; }

.bubble {
  border-radius: 12px;
  padding: 16px 20px;
  margin: 14px 0;
  word-break: break-word;
  font-size: 15.5px;
  line-height: 1.65;
}

.bubble-user {
  background: var(--warm-sand);
  color: var(--near-black);
  border: 1px solid var(--ring-warm);
  margin-left: 64px;
}
.bubble-assistant {
  background: var(--ivory);
  color: var(--near-black);
  border: 1px solid var(--border-cream);
  margin-right: 64px;
}
/* tool-result：折叠在一行，视觉上"次要"，不抢对话气泡的戏 */
.tool-result {
  margin: 6px 64px 6px 0;
  border-radius: 8px;
  border: 1px solid var(--border-cream);
  background: transparent;
  font-family: "Anthropic Mono", "Consolas", monospace;
  font-size: 12.5px;
  color: var(--olive-gray);
  overflow: hidden;
}
.tool-result summary {
  cursor: pointer;
  padding: 6px 12px;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--stone-gray);
  font-size: 12px;
}
.tool-result summary::before { content: "▸"; font-size: 9px; color: var(--stone-gray); }
.tool-result[open] summary::before { content: "▾"; }
.tool-result[open] summary { border-bottom: 1px solid var(--border-cream); background: var(--parchment); }
.tool-result pre {
  margin: 0;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow: auto;
  background: var(--parchment);
}
.tool-result.error { border-color: var(--error-crimson); }
.tool-result.error summary { color: var(--error-crimson); }

.tool-name {
  font-weight: 600;
  color: var(--charcoal-warm);
  font-family: "Anthropic Sans", sans-serif;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.tool-preview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--olive-gray);
  font-family: "Anthropic Mono", "Consolas", monospace;
}
.tool-meta {
  color: var(--stone-gray);
  font-size: 11px;
  white-space: nowrap;
}

/* tool-group：把连续中间过程打包成一个折叠条 */
.tool-group {
  margin: 8px 0;
  border-radius: 8px;
  border: 1px dashed var(--border-warm);
  background: transparent;
  overflow: hidden;
}
.tool-group summary {
  cursor: pointer;
  padding: 8px 14px;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--stone-gray);
  font-size: 12px;
  font-family: "Anthropic Sans", sans-serif;
}
.tool-group summary::before { content: "▸"; font-size: 10px; color: var(--stone-gray); }
.tool-group[open] summary::before { content: "▾"; }
.tool-group[open] summary {
  border-bottom: 1px solid var(--border-cream);
  background: var(--ivory);
}
.tool-group-body {
  padding: 8px 12px;
  background: var(--ivory);
}
/* 折叠组内部的子条目缩进一点，视觉上从属 */
.tool-group-body > .bubble,
.tool-group-body > details {
  margin-left: 12px;
}
.bubble-meta {
  background: transparent;
  border: 1px dashed var(--border-warm);
  color: var(--stone-gray);
  font-size: 13px;
  font-style: italic;
}

.role-tag {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--stone-gray);
  margin-bottom: 6px;
  font-weight: 500;
}
.bubble-user .role-tag { color: var(--charcoal-warm); }
.bubble-assistant .role-tag { color: var(--terracotta); }

/* 编辑按钮：hover bubble 才显示 */
.role-tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit-btn, .delete-btn, .truncate-btn {
  background: transparent;
  border: 1px solid var(--border-warm);
  color: var(--stone-gray);
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, border-color 0.15s;
  font-family: "Anthropic Sans", sans-serif;
  letter-spacing: normal;
  text-transform: none;
  margin-left: 4px;
}
.bubble:hover .edit-btn,
.bubble:hover .delete-btn,
.bubble:hover .truncate-btn { opacity: 1; }
.edit-btn:hover {
  color: var(--terracotta);
  border-color: var(--terracotta);
}
.delete-btn:hover {
  color: var(--error-crimson);
  border-color: var(--error-crimson);
}
.truncate-btn:hover {
  color: var(--error-crimson);
  border-color: var(--error-crimson);
}
.bubble.editing .edit-btn,
.bubble.editing .delete-btn,
.bubble.editing .truncate-btn { display: none; }
/* 中间事件删除按钮：tool_result / attachment / queue / ai-title / last-prompt 等 */
.evt-del-btn, .grp-del-btn {
  background: transparent;
  border: 1px solid var(--border-warm);
  color: var(--stone-gray);
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.15s, color 0.15s, border-color 0.15s;
  font-family: "Anthropic Sans", sans-serif;
  margin-left: 6px;
  user-select: none;
}
details:hover > summary .evt-del-btn,
details:hover > summary .grp-del-btn { opacity: 1; }
.evt-del-btn:hover, .grp-del-btn:hover {
  color: var(--error-crimson);
  border-color: var(--error-crimson);
}
.grp-del-btn { font-weight: 600; }
.bubble-actions {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.edit-area {
  width: 100%;
  min-height: 120px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border-warm);
  border-radius: 8px;
  background: var(--ivory);
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
  color: var(--near-black);
  resize: vertical;
  box-sizing: border-box;
}
.edit-area:focus {
  outline: none;
  border-color: var(--focus-blue);
}
.edit-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-save, .btn-cancel {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-family: "Anthropic Sans", sans-serif;
  border: none;
}
.btn-save {
  background: var(--terracotta);
  color: var(--ivory);
}
.btn-save:hover { background: var(--coral); }
.btn-cancel {
  background: var(--warm-sand);
  color: var(--charcoal-warm);
  border: 1px solid var(--ring-warm);
}
.btn-cancel:hover { background: var(--ring-warm); }
.edit-status {
  font-size: 12px;
  color: var(--olive-gray);
  margin-left: 8px;
}

/* markdown 渲染后的内容样式 */
.md-content { white-space: normal; }
.md-content p { margin: 0 0 8px 0; }
.md-content p:last-child { margin-bottom: 0; }
.md-content ul, .md-content ol { margin: 8px 0 8px 24px; padding: 0; }
.md-content li { margin: 4px 0; }
.md-content li > p { margin: 0; }
.md-content strong, .md-content b {
  font-weight: 600;
  color: var(--near-black);
}
.md-content em { font-style: italic; }
.md-content code {
  background: var(--warm-sand);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Anthropic Mono", "Consolas", monospace;
  font-size: 0.9em;
  color: var(--charcoal-warm);
}
.md-content pre {
  background: var(--parchment);
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-cream);
  overflow-x: auto;
  font-size: 13px;
  margin: 8px 0;
  white-space: pre;
}
.md-content pre code {
  background: transparent;
  padding: 0;
  font-size: inherit;
  color: inherit;
}
.md-content blockquote {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--ring-warm);
  color: var(--olive-gray);
  background: rgba(208, 207, 197, 0.15);
}
.md-content h1, .md-content h2, .md-content h3,
.md-content h4, .md-content h5, .md-content h6 {
  margin: 12px 0 6px 0;
  font-family: "Anthropic Serif", Georgia, serif;
  font-weight: 500;
  line-height: 1.3;
}
.md-content h1 { font-size: 1.5em; }
.md-content h2 { font-size: 1.3em; }
.md-content h3 { font-size: 1.15em; }
.md-content h4 { font-size: 1.05em; }
.md-content a { color: var(--terracotta); text-decoration: underline; }
.md-content table {
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 14px;
}
.md-content th, .md-content td {
  border: 1px solid var(--border-warm);
  padding: 6px 10px;
}
.md-content th { background: var(--warm-sand); font-weight: 500; }
.md-content hr {
  border: none;
  border-top: 1px solid var(--border-warm);
  margin: 12px 0;
}

/* tool-use：跟 tool-result 一致的紧凑折叠条 */
.tool-use {
  margin: 4px 64px 4px 0;
  border-radius: 8px;
  border: 1px solid var(--border-cream);
  background: transparent;
  font-family: "Anthropic Mono", "Consolas", monospace;
  font-size: 12.5px;
  color: var(--olive-gray);
  overflow: hidden;
}
.tool-use summary {
  cursor: pointer;
  padding: 6px 12px;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--stone-gray);
  font-size: 12px;
}
.tool-use summary::before { content: "▸"; font-size: 9px; color: var(--stone-gray); }
.tool-use[open] summary::before { content: "▾"; }
.tool-use[open] summary { border-bottom: 1px solid var(--border-cream); background: var(--parchment); }
.tool-use pre {
  margin: 0;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow: auto;
  background: var(--parchment);
}

.reminder {
  border-left: 3px solid var(--ring-warm);
  padding: 6px 12px;
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--stone-gray);
  background: rgba(208, 207, 197, 0.15);
  border-radius: 0 4px 4px 0;
  position: relative;
}
.reminder-actions {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.15s;
  vertical-align: middle;
}
.reminder:hover .reminder-actions { opacity: 1; }
.reminder-edit-area {
  width: 100%;
  min-height: 80px;
  margin-top: 6px;
  padding: 8px 10px;
  border: 1px solid var(--border-warm);
  border-radius: 6px;
  background: var(--ivory);
  font-family: inherit;
  font-size: 13px;
  color: var(--near-black);
  box-sizing: border-box;
  resize: vertical;
}

/* 选择框 */
.bubble-check {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;
  vertical-align: middle;
  accent-color: var(--terracotta);
}

/* 批量操作浮动工具栏 */
.batch-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--dark-surface);
  color: var(--ivory);
  padding: 12px 20px;
  border-radius: 999px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  display: none;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  z-index: 50;
}
.batch-bar.show { display: flex; }
.batch-bar-count {
  font-weight: 600;
  color: var(--coral);
}
.batch-bar button {
  background: transparent;
  color: var(--ivory);
  border: 1px solid rgba(255,255,255,0.25);
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
}
.batch-bar button:hover {
  border-color: var(--coral);
  color: var(--coral);
}
.batch-bar button.danger {
  background: var(--error-crimson);
  border-color: var(--error-crimson);
}
.batch-bar button.danger:hover {
  background: #d04545;
  border-color: #d04545;
  color: var(--ivory);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.55);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}
.modal-backdrop.show { display: flex; }
.modal {
  background: var(--ivory);
  border-radius: 14px;
  max-width: 720px;
  width: 92%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-cream);
  font-family: "Anthropic Serif", Georgia, serif;
  font-size: 18px;
  font-weight: 500;
}
.modal-body {
  padding: 14px 20px;
  overflow-y: auto;
  font-size: 14px;
  color: var(--charcoal-warm);
  line-height: 1.55;
}
.modal-body .preview-list {
  margin-top: 10px;
  border: 1px solid var(--border-cream);
  border-radius: 8px;
  overflow: hidden;
}
.modal-body .preview-row {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-cream);
  font-size: 12.5px;
  font-family: "Anthropic Mono", "Consolas", monospace;
  display: flex;
  gap: 10px;
  align-items: baseline;
}
.modal-body .preview-row:last-child { border-bottom: none; }
.modal-body .preview-row .ln {
  color: var(--stone-gray);
  min-width: 56px;
}
.modal-body .preview-row .kind {
  min-width: 80px;
  color: var(--terracotta);
}
.modal-body .preview-row .desc {
  flex: 1;
  color: var(--charcoal-warm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.modal-body .warn {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(181, 51, 51, 0.08);
  border-left: 3px solid var(--error-crimson);
  border-radius: 0 6px 6px 0;
  color: var(--error-crimson);
  font-size: 13px;
}
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-cream);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: var(--parchment);
}
.modal-footer button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  border: none;
}
.modal-footer .btn-confirm {
  background: var(--error-crimson);
  color: var(--ivory);
}
.modal-footer .btn-confirm:hover { background: #d04545; }
.modal-footer .btn-secondary {
  background: var(--warm-sand);
  color: var(--charcoal-warm);
  border: 1px solid var(--ring-warm);
}
.modal-footer .btn-secondary:hover { background: var(--ring-warm); }

/* 撤销下拉 */
.undo-wrap { position: relative; display: inline-block; }
.undo-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--ivory);
  border: 1px solid var(--ring-warm);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: none;
  z-index: 30;
}
.undo-menu.show { display: block; }
.undo-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-cream);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.undo-item:hover { background: var(--warm-sand); }
.undo-item:last-child { border-bottom: none; }
.undo-item .meta {
  color: var(--stone-gray);
  font-size: 11.5px;
  font-family: "Anthropic Mono", "Consolas", monospace;
}
.undo-item .name {
  font-weight: 500;
  color: var(--charcoal-warm);
}
.undo-empty {
  padding: 16px;
  color: var(--stone-gray);
  text-align: center;
  font-size: 13px;
}

.preserve-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--stone-gray);
  margin-left: 8px;
  cursor: pointer;
}
.preserve-checkbox input { accent-color: var(--terracotta); }

.line-no {
  font-family: "Anthropic Mono", "Consolas", monospace;
  font-size: 11px;
  color: var(--stone-gray);
  margin-bottom: 4px;
}

details.attachment, details.summary-block, details.queue, details.broken {
  border-radius: 8px;
  border: 1px solid var(--border-cream);
  margin: 10px 0;
  background: transparent;
  font-size: 13px;
  color: var(--stone-gray);
}
details.attachment summary,
details.summary-block summary,
details.queue summary,
details.broken summary {
  padding: 6px 12px;
  cursor: pointer;
  list-style: none;
  font-family: "Anthropic Mono", "Consolas", monospace;
}
details.attachment[open] summary,
details.summary-block[open] summary,
details.queue[open] summary,
details.broken[open] summary { border-bottom: 1px solid var(--border-cream); }
details.attachment pre,
details.summary-block pre,
details.queue pre,
details.broken pre {
  margin: 0;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--warm-sand);
  color: var(--charcoal-warm);
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 0 0 1px var(--ring-warm);
  transition: box-shadow 0.15s, background 0.15s;
}
.btn:hover {
  box-shadow: 0 0 0 1px var(--charcoal-warm);
  color: var(--near-black);
}
.btn-primary {
  background: var(--terracotta);
  color: var(--ivory);
  box-shadow: 0 0 0 1px var(--terracotta);
}
.btn-primary:hover {
  background: var(--coral);
  color: var(--ivory);
  box-shadow: 0 0 0 1px var(--coral);
}

.empty {
  text-align: center;
  padding: 80px 24px;
  color: var(--stone-gray);
  font-size: 17px;
}

footer {
  text-align: center;
  color: var(--stone-gray);
  font-size: 12px;
  margin-top: 60px;
  padding: 24px;
}
"""


INDEX_HTML = """
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>{{ project_name }} · session 列表</title>
<style>{{ css|safe }}</style>
</head>
<body>
<div class="nav">
  <div class="nav-inner">
    <div class="nav-title">
      <select class="project-select" id="project-select-index" onchange="if(this.value){location.href='/project/'+this.value}">
        {% for p in projects if not p.is_temp %}
        <option value="{{ p.id }}" {% if p.id == project_id %}selected{% endif %}>{{ p.short_name }} · {{ p.session_count }} session</option>
        {% endfor %}
        {% set temp_projects = projects | selectattr('is_temp') | list %}
        {% if temp_projects %}
        <optgroup label="── 临时项目（点开显示） ──" id="temp-optgroup-index" {% if not show_temp %}hidden{% endif %}>
          {% for p in temp_projects %}
          <option value="{{ p.id }}" {% if p.id == project_id %}selected{% endif %}>{{ p.short_name }} · {{ p.session_count }} session</option>
          {% endfor %}
        </optgroup>
        {% endif %}
      </select>
      {% if temp_projects %}
      <button type="button" class="toggle-temp-btn" onclick="toggleTempProjects('temp-optgroup-index', this)">{% if show_temp %}隐藏{% else %}显示{% endif %} {{ temp_projects|length }} 个临时项目</button>
      {% endif %}
    </div>
    <div class="nav-meta">{{ sessions|length }} 个 session</div>
  </div>
</div>

<div class="container">
  <h1 class="page-title">会话历史</h1>
  <p class="page-sub">点开任意一个 session，看完整对话。按最后活跃时间排序。</p>

  {% if sessions %}
    {% for s in sessions %}
    <a class="card card-link" href="/project/{{ project_id }}/session/{{ s.id }}">
      <div class="card-row">
        <h2 class="card-title">{{ s.title }}</h2>
        <div class="card-meta">
          {% if s.active %}<span class="badge badge-active">活跃中</span>{% endif %}
          <span>{{ s.mtime }}</span>
          <span>{{ s.lines }} 条</span>
          <span>{{ s.size_kb }} KB</span>
        </div>
      </div>
      <div class="card-id">{{ s.id }}</div>
    </a>
    {% endfor %}
  {% else %}
    <div class="empty">这个项目下没有 session 记录。<br>路径：{{ project_dir }}</div>
  {% endif %}
</div>

<footer>session-browser</footer>

<script>
function toggleTempProjects(groupId, btn) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  if (grp.hidden) {
    grp.hidden = false;
    grp.removeAttribute('hidden');
    // 强制 select 展开 option（部分浏览器对 optgroup hidden 支持差，移到 select 末尾）
    Array.from(grp.children).forEach(o => grp.parentElement.appendChild(o));
    grp.parentElement.appendChild(grp);
    btn.textContent = btn.textContent.replace('显示', '已显示');
    btn.disabled = true;
  }
}
</script>
</body>
</html>
"""


SESSION_HTML = """
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>{{ data.meta.id }} · {{ project_name }}</title>
<style>{{ css|safe }}</style>
</head>
<body>
<div class="nav">
  <div class="nav-inner">
    <div class="nav-title">
      <select class="project-select" id="project-select-session" onchange="if(this.value){location.href='/project/'+this.value}">
        {% for p in projects if not p.is_temp %}
        <option value="{{ p.id }}" {% if p.id == project_id %}selected{% endif %}>{{ p.short_name }}</option>
        {% endfor %}
        {% set temp_projects = projects | selectattr('is_temp') | list %}
        {% if temp_projects %}
        <optgroup label="── 临时项目 ──" id="temp-optgroup-session" hidden>
          {% for p in temp_projects %}
          <option value="{{ p.id }}" {% if p.id == project_id %}selected{% endif %}>{{ p.short_name }}</option>
          {% endfor %}
        </optgroup>
        {% endif %}
      </select>
      {% if temp_projects %}
      <button type="button" class="toggle-temp-btn" onclick="toggleTempProjects('temp-optgroup-session', this)">显示 {{ temp_projects|length }} 个临时项目</button>
      {% endif %}
      <span style="margin-left: 8px; color: var(--stone-gray); font-size: 14px;">· 对话</span>
    </div>
    <div class="nav-meta">
      {% if data.meta.active %}<span class="badge badge-active">活跃中</span>{% endif %}
      {{ data.meta.lines }} 条 · {{ data.meta.size_kb }} KB · 最后写入 {{ data.meta.mtime }}
    </div>
  </div>
</div>

<div class="container">
  <div class="toolbar">
    <a class="btn" href="/project/{{ project_id }}">← 返回会话列表</a>
    <a class="btn" href="/project/{{ project_id }}/session/{{ session_id }}/export.md" title="导出对话为 Markdown (只含你和 Claude 的文本, 跳过工具调用)">导出 .md</a>
    <span class="undo-wrap">
      <button class="btn" type="button" onclick="toggleUndoMenu()">撤销 ▾</button>
      <div class="undo-menu" id="undo-menu">
        <div class="undo-empty">加载中…</div>
      </div>
    </span>
    <span class="card-id">{{ data.meta.id }}</span>
  </div>

  {% macro render_item(it) %}
    {% if it.kind == 'user' %}
      <div class="bubble bubble-user editable" data-line="{{ it.line_no }}">
        <div class="role-tag">
          <span>
            <input type="checkbox" class="bubble-check" onchange="onBubbleCheck(this)" data-line="{{ it.line_no }}" title="选中以批量删除">
            你 · L{{ it.line_no }}
          </span>
          <span class="bubble-actions">
            <button type="button" class="edit-btn" onclick="enterEdit(this)">编辑</button>
            <button type="button" class="delete-btn" onclick="deleteLine(this, 'turn')" title="删除整轮（user→assistant→tool→… 直到下一个用户输入前）">删除整轮</button>
            <button type="button" class="truncate-btn" onclick="deleteLine(this, 'from_here')" title="从此条起删除到 session 末尾">从此截断</button>
          </span>
        </div>
        <div class="md-content">{{ it.text_html|safe }}</div>
        <textarea class="edit-area" hidden>{{ it.text }}</textarea>
        <div class="edit-actions" hidden>
          <button type="button" class="btn-save" onclick="saveEdit(this)">保存</button>
          <button type="button" class="btn-cancel" onclick="cancelEdit(this)">取消</button>
          {% if it.reminders %}
          <label class="preserve-checkbox" title="勾上：保留 user 消息内的 system-reminder 块；不勾：保存时一并清掉">
            <input type="checkbox" class="preserve-input" checked>
            保留 {{ it.reminders|length }} 个 reminder
          </label>
          {% endif %}
          <span class="edit-status"></span>
        </div>
        {% for r in it.reminders %}
        <div class="reminder" data-line="{{ it.line_no }}" data-rem-idx="{{ loop.index0 }}">
          <span class="reminder-text">系统提醒 #{{ loop.index0 }}：{{ r.strip()[:300] }}{% if r|length > 300 %}…{% endif %}</span>
          <span class="reminder-actions">
            <button type="button" class="edit-btn" onclick="enterReminderEdit(this)">改</button>
            <button type="button" class="delete-btn" onclick="deleteReminder(this)">删</button>
          </span>
          <textarea class="reminder-edit-area" hidden>{{ r.strip() }}</textarea>
          <div class="edit-actions" hidden>
            <button type="button" class="btn-save" onclick="saveReminderEdit(this)">保存</button>
            <button type="button" class="btn-cancel" onclick="cancelReminderEdit(this)">取消</button>
            <span class="edit-status"></span>
          </div>
        </div>
        {% endfor %}
      </div>
    {% elif it.kind == 'user_meta' %}
      <div class="bubble bubble-meta">
        <div class="role-tag">系统注入 · L{{ it.line_no }}</div>
        {{ it.text[:600] }}{% if it.text|length > 600 %}…{% endif %}
        {% for r in it.reminders %}
        <div class="reminder">{{ r.strip()[:300] }}{% if r|length > 300 %}…{% endif %}</div>
        {% endfor %}
      </div>
    {% elif it.kind == 'assistant' %}
      {% if it.text and it.text.strip() %}
      <div class="bubble bubble-assistant editable" data-line="{{ it.line_no }}">
        <div class="role-tag">
          <span>
            <input type="checkbox" class="bubble-check" onchange="onBubbleCheck(this)" data-line="{{ it.line_no }}" title="选中以批量删除">
            Claude · L{{ it.line_no }}
          </span>
          <span class="bubble-actions">
            <button type="button" class="edit-btn" onclick="enterEdit(this)">编辑</button>
            <button type="button" class="delete-btn" onclick="deleteLine(this, 'line')" title="只删这一行（注意：可能破坏 user/assistant 交替）">删除此条</button>
            <button type="button" class="delete-btn" onclick="deleteLine(this, 'turn')" title="删除这条所属的整轮">删除整轮</button>
            <button type="button" class="truncate-btn" onclick="deleteLine(this, 'from_here')" title="从此条起删除到 session 末尾">从此截断</button>
          </span>
        </div>
        <div class="md-content">{{ it.text_html|safe }}</div>
        <textarea class="edit-area" hidden>{{ it.text }}</textarea>
        <div class="edit-actions" hidden>
          <button type="button" class="btn-save" onclick="saveEdit(this)">保存</button>
          <button type="button" class="btn-cancel" onclick="cancelEdit(this)">取消</button>
          <span class="edit-status"></span>
        </div>
      </div>
      {% endif %}
      {% for tu in it.tool_uses %}
      <details class="tool-use">
        <summary>
          <span class="tool-name">{{ tu.name }}</span>
          {% if tu.preview %}<span class="tool-preview">{{ tu.preview }}</span>{% endif %}
          <span class="tool-meta">L{{ it.line_no }}</span>
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删除此条 assistant 消息（含其所有 tool_use）">删</button>
        </summary>
        <pre>{{ tu.input | tojson(indent=2) }}</pre>
      </details>
      {% endfor %}
    {% elif it.kind == 'tool_result' %}
      <details class="tool-result {% if it.is_error %}error{% endif %}" {% if it.is_error %}open{% endif %}>
        <summary>
          <span class="tool-name">工具返回</span>
          {% if it.preview %}<span class="tool-preview">{{ it.preview }}</span>{% endif %}
          <span class="tool-meta">L{{ it.line_no }} · {{ it.lines }} 行</span>
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此 tool_result">删</button>
        </summary>
        <pre>{{ it.text[:5000] }}{% if it.text|length > 5000 %}

…（共 {{ it.text|length }} 字，已截断）{% endif %}</pre>
      </details>
    {% elif it.kind == 'attachment' %}
      <details class="attachment">
        <summary>
          附件 / attachment · L{{ it.line_no }}
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此附件事件">删</button>
        </summary>
        <pre>{{ it.summary }}</pre>
      </details>
    {% elif it.kind == 'summary' %}
      <details class="summary-block" open>
        <summary>
          会话摘要 / summary · L{{ it.line_no }}
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此摘要事件">删</button>
        </summary>
        <pre>{{ it.text }}</pre>
      </details>
    {% elif it.kind == 'queue' %}
      <details class="queue">
        <summary>
          队列事件 · L{{ it.line_no }}
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此事件">删</button>
        </summary>
        <pre>{{ it.text }}</pre>
      </details>
    {% elif it.kind == 'broken' %}
      <details class="broken">
        <summary>
          无法解析 · L{{ it.line_no }}
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此事件">删</button>
        </summary>
        <pre>{{ it.text }}</pre>
      </details>
    {% else %}
      <details class="queue">
        <summary>
          {{ it.kind }} · L{{ it.line_no }}
          <button type="button" class="evt-del-btn" onclick="deleteByLine({{ it.line_no }}, 'line', event)" title="删此事件">删</button>
        </summary>
        <pre>{{ it.text }}</pre>
      </details>
    {% endif %}
  {% endmacro %}

  <div class="thread">
  {% for it in data.messages %}
    {% if it.kind == 'tool_group' %}
      <details class="tool-group">
        <summary>
          <span class="tool-name">中间过程</span>
          <span class="tool-preview">{{ it.count }} 个事件</span>
          <span class="tool-meta">L{{ it.start_line }} – L{{ it.end_line }}</span>
          <button type="button" class="grp-del-btn" onclick="deleteToolGroup({{ it.start_line }}, {{ it.end_line }}, event)" title="删除整组中间过程（L{{ it.start_line }}–L{{ it.end_line }} 全部事件）">删整组</button>
        </summary>
        <div class="tool-group-body">
          {% for sub in it.events %}{{ render_item(sub) }}{% endfor %}
        </div>
      </details>
    {% else %}
      {{ render_item(it) }}
    {% endif %}
  {% endfor %}
  </div>
</div>

<div class="batch-bar" id="batch-bar">
  <span>已选 <span class="batch-bar-count" id="batch-bar-count">0</span> 条</span>
  <button type="button" class="danger" onclick="batchDelete()">删除选中</button>
  <button type="button" onclick="clearBatchSelection()">清空选择</button>
</div>

<div class="modal-backdrop" id="modal-backdrop">
  <div class="modal">
    <div class="modal-header" id="modal-title">操作确认</div>
    <div class="modal-body" id="modal-body"></div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
      <button type="button" class="btn-confirm" id="modal-confirm">确认</button>
    </div>
  </div>
</div>

<footer>session_browser v3 · 编辑 / 批量删除 / 撤销 / reminder 编辑</footer>

<script>
const SESSION_ID = {{ data.meta.id|tojson }};
const PROJECT_ID = {{ project_id|tojson }};
const SESSION_ACTIVE = {{ data.meta.active|tojson }};

function toggleTempProjects(groupId, btn) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  if (grp.hidden) {
    grp.hidden = false;
    grp.removeAttribute('hidden');
    Array.from(grp.children).forEach(o => grp.parentElement.appendChild(o));
    grp.parentElement.appendChild(grp);
    btn.textContent = btn.textContent.replace('显示', '已显示');
    btn.disabled = true;
  }
}

function enterEdit(btn) {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再编辑（避免冲突写崩 jsonl）');
    return;
  }
  const bubble = btn.closest('.bubble');
  bubble.classList.add('editing');
  bubble.querySelector('.md-content').hidden = true;
  bubble.querySelector('.edit-area').hidden = false;
  bubble.querySelector('.edit-actions').hidden = false;
  bubble.querySelector('.edit-area').focus();
}

function cancelEdit(btn) {
  const bubble = btn.closest('.bubble');
  bubble.classList.remove('editing');
  bubble.querySelector('.md-content').hidden = false;
  bubble.querySelector('.edit-area').hidden = true;
  bubble.querySelector('.edit-actions').hidden = true;
  bubble.querySelector('.edit-status').textContent = '';
}

// ===== 编辑：带 preserve_reminders flag =====
async function saveEdit(btn) {
  const bubble = btn.closest('.bubble');
  const lineNo = parseInt(bubble.dataset.line, 10);
  const newText = bubble.querySelector('.edit-area').value;
  const status = bubble.querySelector('.edit-status');
  const preserveBox = bubble.querySelector('.preserve-input');
  const preserveReminders = preserveBox ? preserveBox.checked : true;
  status.textContent = '保存中…';
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/edit`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        line_no: lineNo,
        new_text: newText,
        preserve_reminders: preserveReminders,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      status.textContent = '失败：' + (data.error || res.status);
      status.style.color = 'var(--error-crimson)';
      return;
    }
    const md = bubble.querySelector('.md-content');
    md.innerHTML = data.text_html;
    md.hidden = false;
    bubble.querySelector('.edit-area').hidden = true;
    bubble.querySelector('.edit-actions').hidden = true;
    bubble.classList.remove('editing');
    status.textContent = '已保存（备份：' + data.backup + '）';
    status.style.color = 'var(--olive-gray)';
  } catch (e) {
    status.textContent = '请求失败：' + e.message;
    status.style.color = 'var(--error-crimson)';
  }
}

// ===== 模态框 =====
let pendingAction = null;  // { confirm: () => {} }

function openModal(title, bodyHTML, confirmText, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const btn = document.getElementById('modal-confirm');
  btn.textContent = confirmText || '确认';
  pendingAction = { confirm: onConfirm };
  document.getElementById('modal-backdrop').classList.add('show');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('show');
  pendingAction = null;
}

document.getElementById('modal-confirm').addEventListener('click', () => {
  if (pendingAction && pendingAction.confirm) pendingAction.confirm();
  closeModal();
});

document.getElementById('modal-backdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modal-backdrop') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function renderPreviewList(items) {
  if (!items || !items.length) return '<div class="warn">没有可预览的内容</div>';
  let html = '<div class="preview-list">';
  for (const it of items.slice(0, 60)) {
    html += `<div class="preview-row">`
         + `<span class="ln">L${it.line_no}</span>`
         + `<span class="kind">${escapeHtml(it.kind)}</span>`
         + `<span class="desc">${escapeHtml(it.desc || '')}</span>`
         + `</div>`;
  }
  html += '</div>';
  if (items.length > 60) html += `<div style="margin-top:6px;color:var(--stone-gray);font-size:12px">…还有 ${items.length - 60} 条</div>`;
  return html;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== 单条 / 整轮 / 截断删除（带预览） =====
// 直接按行号删除单条事件（中间过程用，比如 tool_result / attachment / ai-title 等）
async function deleteByLine(lineNo, mode, evt) {
  if (evt) evt.stopPropagation();  // 防止 <details> 误开/关
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再删（避免冲突写崩 jsonl）');
    return;
  }
  const modeLabel = {
    'line':       '删除此条',
    'turn':       '删除整轮对话',
    'from_here':  '从此条起截断到 session 末尾',
  }[mode] || mode;

  let preview;
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({line_no: lineNo, mode: mode, dry_run: true}),
    });
    preview = await res.json();
    if (!preview.ok) { alert('预览失败：' + (preview.error || res.status)); return; }
  } catch (e) { alert('预览失败：' + e.message); return; }

  let body = `<div>${modeLabel}：将删除 <b>${preview.deleted}</b> 行（L${preview.del_start_line}–L${preview.del_end_line}），删除后剩 ${preview.remaining_lines} 行。</div>`;
  body += renderPreviewList(preview.would_delete);
  if (preview.warnings && preview.warnings.length) {
    body += `<div class="warn">⚠ ${preview.warnings.map(escapeHtml).join('<br>')}</div>`;
  }

  openModal('确认删除', body, '确认删除', async () => {
    try {
      const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line_no: lineNo, mode: mode}),
      });
      const data = await res.json();
      if (!data.ok) { alert('删除失败：' + (data.error || res.status)); return; }
      location.reload();
    } catch (e) { alert('请求失败：' + e.message); }
  });
}

// 删除整个中间过程组（连续 N 行）
async function deleteToolGroup(startLine, endLine, evt) {
  if (evt) evt.stopPropagation();
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再删');
    return;
  }
  const lineNos = [];
  for (let i = startLine; i <= endLine; i++) lineNos.push(i);

  let preview;
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete-bulk`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({line_nos: lineNos, dry_run: true}),
    });
    preview = await res.json();
    if (!preview.ok) { alert('预览失败：' + (preview.error || res.status)); return; }
  } catch (e) { alert('预览失败：' + e.message); return; }

  let body = `<div>将删除整组中间过程：L${startLine}–L${endLine}（<b>${preview.deleted}</b> 行），删除后剩 ${preview.remaining_lines} 行。</div>`;
  body += renderPreviewList(preview.would_delete);
  if (preview.warnings && preview.warnings.length) {
    body += `<div class="warn">⚠ ${preview.warnings.map(escapeHtml).join('<br>')}</div>`;
  }

  openModal('确认删除整组', body, `删除 ${lineNos.length} 条`, async () => {
    try {
      const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete-bulk`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line_nos: lineNos}),
      });
      const data = await res.json();
      if (!data.ok) { alert('删除失败：' + (data.error || res.status)); return; }
      location.reload();
    } catch (e) { alert('请求失败：' + e.message); }
  });
}

async function deleteLine(btn, mode) {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再删（避免冲突写崩 jsonl）');
    return;
  }
  const bubble = btn.closest('.bubble');
  const lineNo = parseInt(bubble.dataset.line, 10);
  const modeLabel = {
    'line':       '删除此条',
    'turn':       '删除整轮对话',
    'from_here':  '从此条起截断到 session 末尾',
  }[mode] || mode;

  // dry_run 拿预览
  let preview;
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({line_no: lineNo, mode: mode, dry_run: true}),
    });
    preview = await res.json();
    if (!preview.ok) { alert('预览失败：' + (preview.error || res.status)); return; }
  } catch (e) { alert('预览失败：' + e.message); return; }

  let body = `<div>${modeLabel}：将删除 <b>${preview.deleted}</b> 行（L${preview.del_start_line}–L${preview.del_end_line}），删除后剩 ${preview.remaining_lines} 行。</div>`;
  body += renderPreviewList(preview.would_delete);
  if (preview.warnings && preview.warnings.length) {
    body += `<div class="warn">⚠ ${preview.warnings.map(escapeHtml).join('<br>')}</div>`;
  }

  openModal('确认删除', body, '确认删除', async () => {
    try {
      const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line_no: lineNo, mode: mode}),
      });
      const data = await res.json();
      if (!data.ok) { alert('删除失败：' + (data.error || res.status)); return; }
      location.reload();
    } catch (e) { alert('请求失败：' + e.message); }
  });
}

// ===== 批量选择 =====
const batchSelected = new Set();

function onBubbleCheck(cb) {
  const ln = parseInt(cb.dataset.line, 10);
  if (cb.checked) batchSelected.add(ln); else batchSelected.delete(ln);
  updateBatchBar();
}

function updateBatchBar() {
  const bar = document.getElementById('batch-bar');
  const cnt = document.getElementById('batch-bar-count');
  cnt.textContent = batchSelected.size;
  if (batchSelected.size > 0) bar.classList.add('show');
  else bar.classList.remove('show');
}

function clearBatchSelection() {
  document.querySelectorAll('.bubble-check:checked').forEach(cb => cb.checked = false);
  batchSelected.clear();
  updateBatchBar();
}

async function batchDelete() {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再删');
    return;
  }
  const lineNos = Array.from(batchSelected).sort((a, b) => a - b);
  if (!lineNos.length) return;

  let preview;
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete-bulk`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({line_nos: lineNos, dry_run: true}),
    });
    preview = await res.json();
    if (!preview.ok) { alert('预览失败：' + (preview.error || res.status)); return; }
  } catch (e) { alert('预览失败：' + e.message); return; }

  let body = `<div>将批量删除 <b>${preview.deleted}</b> 行，删除后剩 ${preview.remaining_lines} 行。</div>`;
  body += renderPreviewList(preview.would_delete);
  if (preview.warnings && preview.warnings.length) {
    body += `<div class="warn">⚠ ${preview.warnings.map(escapeHtml).join('<br>')}</div>`;
  }

  openModal('批量删除确认', body, `删除 ${lineNos.length} 条`, async () => {
    try {
      const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/delete-bulk`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line_nos: lineNos}),
      });
      const data = await res.json();
      if (!data.ok) { alert('删除失败：' + (data.error || res.status)); return; }
      location.reload();
    } catch (e) { alert('请求失败：' + e.message); }
  });
}

// ===== 撤销（备份恢复） =====
async function toggleUndoMenu() {
  const menu = document.getElementById('undo-menu');
  if (menu.classList.contains('show')) {
    menu.classList.remove('show');
    return;
  }
  menu.innerHTML = '<div class="undo-empty">加载中…</div>';
  menu.classList.add('show');
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/backups`);
    const data = await res.json();
    if (!data.backups || !data.backups.length) {
      menu.innerHTML = '<div class="undo-empty">还没有备份</div>';
      return;
    }
    let html = '';
    for (const b of data.backups) {
      const isPre = b.name.includes('pre-restore');
      html += `<div class="undo-item" onclick="restoreBackup('${escapeHtml(b.name)}')">`
           + `<div>`
           + `<div class="name">${isPre ? '↺ ' : ''}${escapeHtml(b.name)}</div>`
           + `<div class="meta">${escapeHtml(b.mtime)} · ${b.lines} 行 · ${b.size_kb} KB</div>`
           + `</div>`
           + `</div>`;
    }
    menu.innerHTML = html;
  } catch (e) {
    menu.innerHTML = `<div class="undo-empty">加载失败：${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('click', (e) => {
  // 点 menu 之外的地方就关闭
  const wrap = e.target.closest('.undo-wrap');
  if (!wrap) {
    const menu = document.getElementById('undo-menu');
    if (menu) menu.classList.remove('show');
  }
});

async function restoreBackup(backupName) {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再恢复');
    return;
  }
  openModal(
    '恢复备份',
    `<div>从 <code>${escapeHtml(backupName)}</code> 恢复 session？</div>`
    + `<div style="margin-top:8px;color:var(--stone-gray);font-size:13px">恢复前会先把当前文件存为 *-pre-restore.bak，所以即使误恢复也能再回头。</div>`,
    '确认恢复',
    async () => {
      try {
        const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/restore`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({backup: backupName}),
        });
        const data = await res.json();
        if (!data.ok) { alert('恢复失败：' + (data.error || res.status)); return; }
        location.reload();
      } catch (e) { alert('请求失败：' + e.message); }
    }
  );
}

// ===== reminder 编辑 / 删除 =====
function enterReminderEdit(btn) {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再编辑');
    return;
  }
  const rem = btn.closest('.reminder');
  rem.querySelector('.reminder-text').hidden = true;
  rem.querySelector('.reminder-actions').style.display = 'none';
  rem.querySelector('.reminder-edit-area').hidden = false;
  rem.querySelector('.edit-actions').hidden = false;
  rem.querySelector('.reminder-edit-area').focus();
}

function cancelReminderEdit(btn) {
  const rem = btn.closest('.reminder');
  rem.querySelector('.reminder-text').hidden = false;
  rem.querySelector('.reminder-actions').style.display = '';
  rem.querySelector('.reminder-edit-area').hidden = true;
  rem.querySelector('.edit-actions').hidden = true;
  rem.querySelector('.edit-status').textContent = '';
}

async function saveReminderEdit(btn) {
  const rem = btn.closest('.reminder');
  const lineNo = parseInt(rem.dataset.line, 10);
  const remIdx = parseInt(rem.dataset.remIdx, 10);
  const newText = rem.querySelector('.reminder-edit-area').value;
  const status = rem.querySelector('.edit-status');
  status.textContent = '保存中…';
  try {
    const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/edit-reminder`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({line_no: lineNo, reminder_idx: remIdx, new_text: newText}),
    });
    const data = await res.json();
    if (!data.ok) {
      status.textContent = '失败：' + (data.error || res.status);
      status.style.color = 'var(--error-crimson)';
      return;
    }
    status.textContent = '已保存。刷新展示…';
    setTimeout(() => location.reload(), 500);
  } catch (e) {
    status.textContent = '请求失败：' + e.message;
    status.style.color = 'var(--error-crimson)';
  }
}

async function deleteReminder(btn) {
  if (SESSION_ACTIVE) {
    alert('当前 session 还在活跃中，先关 Claude Desktop 再编辑');
    return;
  }
  const rem = btn.closest('.reminder');
  const lineNo = parseInt(rem.dataset.line, 10);
  const remIdx = parseInt(rem.dataset.remIdx, 10);
  const txt = (rem.querySelector('.reminder-edit-area').value || '').slice(0, 200);

  openModal(
    '删除 system-reminder',
    `<div>删除 L${lineNo} 的第 ${remIdx} 个 reminder？</div>`
    + `<div class="preview-list" style="margin-top:8px"><div class="preview-row"><span class="desc">${escapeHtml(txt)}</span></div></div>`,
    '确认删除',
    async () => {
      try {
        const res = await fetch(`/project/${PROJECT_ID}/session/${SESSION_ID}/edit-reminder`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({line_no: lineNo, reminder_idx: remIdx, delete: true}),
        });
        const data = await res.json();
        if (!data.ok) { alert('删除失败：' + (data.error || res.status)); return; }
        location.reload();
      } catch (e) { alert('请求失败：' + e.message); }
    }
  );
}
</script>

</body>
</html>
"""


# ---------- 路由 ----------
JINJA_ENV = Environment(autoescape=True)
INDEX_TEMPLATE = JINJA_ENV.from_string(INDEX_HTML)
SESSION_TEMPLATE = JINJA_ENV.from_string(SESSION_HTML)


def _validate_project_id(pid):
    return bool(re.match(r"^[A-Za-z0-9_\-.]+$", pid))


@app.route("/")
def index():
    """默认重定向到 DEFAULT_PROJECT_ID（如果配置且存在），否则取最新项目，再否则报错"""
    from flask import redirect
    if DEFAULT_PROJECT_ID and (PROJECTS_ROOT / DEFAULT_PROJECT_ID).exists():
        return redirect(f"/project/{DEFAULT_PROJECT_ID}")
    projects = list_projects()
    if projects:
        return redirect(f"/project/{projects[0]['id']}")
    return "没找到任何 Claude Code 项目（~/.claude/projects/ 是空的）", 404


@app.route("/project/<project_id>")
def project_view(project_id):
    if not _validate_project_id(project_id):
        abort(400)
    project_dir = get_project_dir(project_id)
    if not project_dir.exists():
        abort(404)
    sessions = list_sessions(project_id)
    projects = list_projects()
    # 当前项目的 cwd
    current = next((p for p in projects if p["id"] == project_id), None)
    project_name = current["short_name"] if current else project_id
    return INDEX_TEMPLATE.render(
        sessions=sessions,
        project_name=project_name,
        project_id=project_id,
        project_dir=str(project_dir),
        projects=projects,
        css=BASE_CSS,
    )


@app.route("/fonts/<path:filename>")
def fonts(filename):
    return send_from_directory(FONTS_DIR, filename)


@app.route("/project/<project_id>/session/<sid>")
def session_view(project_id, sid):
    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    data = load_session(project_id, sid)
    if data is None:
        abort(404)
    projects = list_projects()
    current = next((p for p in projects if p["id"] == project_id), None)
    project_name = current["short_name"] if current else project_id
    return SESSION_TEMPLATE.render(
        data=data,
        project_name=project_name,
        project_id=project_id,
        session_id=sid,
        projects=projects,
        css=BASE_CSS,
    )


@app.route("/project/<project_id>/session/<sid>/export.md")
def session_export_md(project_id, sid):
    """导出会话为 Markdown - 只保留 user 和 assistant 的纯文本对话,
    跳过 tool_use / tool_result / system 等元/工具内容。"""
    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        abort(404)

    lines = [f"# Claude session — {sid[:8]}", ""]

    with open(p, "r", encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                obj = json.loads(raw)
            except Exception:
                continue

            t = obj.get("type", "")
            if t not in ("user", "assistant"):
                continue
            if obj.get("isMeta"):
                continue  # 跳过 system-reminder / 元数据 user 消息

            # 抽 message.content 的纯 text 部分 (跳过 tool_use / tool_result)
            msg = obj.get("message", {}) or {}
            content = msg.get("content", "")
            text_parts = []
            has_tool_result = False
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        it_type = item.get("type")
                        if it_type == "text" and item.get("text"):
                            text_parts.append(item["text"])
                        elif it_type == "tool_result":
                            has_tool_result = True
                    elif isinstance(item, str):
                        text_parts.append(item)

            text = "\n".join(text_parts).strip()
            if not text:
                continue
            # user.content 是 tool_result 的话, 不算"我说的", 跳过
            if t == "user" and has_tool_result and not any(
                isinstance(x, dict) and x.get("type") == "text" for x in (content if isinstance(content, list) else [])
            ):
                continue

            ts = obj.get("timestamp", "")
            ts_short = ts[:19].replace("T", " ") if ts else ""

            speaker = "你" if t == "user" else "Claude"
            header = f"## {speaker}"
            if ts_short:
                header += f"  <sub>{ts_short}</sub>"
            lines.append(header)
            lines.append("")
            lines.append(text)
            lines.append("")
            lines.append("---")
            lines.append("")

    md = "\n".join(lines)
    return md, 200, {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": f'attachment; filename="claude-session-{sid[:8]}.md"',
    }


@app.route("/project/<project_id>/session/<sid>/edit", methods=["POST"])
def session_edit(project_id, sid):
    """编辑某行的 message text。"""
    import shutil

    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        abort(404)

    # 活跃 session 拒绝——但区分"我自己刚写的"和"外部（Claude Desktop）写的"
    file_mtime = p.stat().st_mtime
    last_self = LAST_SELF_WRITE.get(sid, 0)
    age = time.time() - file_mtime
    is_external_write = age < 10 and abs(file_mtime - last_self) > 2
    if is_external_write:
        return jsonify({
            "ok": False,
            "error": "session 还在被外部写（10 秒内 Claude Desktop 写过），先关掉再编辑",
        }), 423

    body = request.get_json(silent=True) or {}
    try:
        line_no = int(body.get("line_no", 0))
    except Exception:
        line_no = 0
    new_text = body.get("new_text", "")
    if not isinstance(new_text, str):
        new_text = str(new_text)
    preserve_reminders = bool(body.get("preserve_reminders", True))

    if line_no <= 0 or len(new_text) > 2_000_000:
        return jsonify({"ok": False, "error": "line_no 或 new_text 不合法"}), 400

    # 关键：禁止保存空文本
    # Anthropic API 强校验 text content blocks must be non-empty，
    # 留下 {"type":"text","text":""} 或 "content":"" 会让整个 session 后续 400。
    # 想"清掉"一条消息请用 /delete 接口（删除整行而不是清空内容）。
    if not new_text.strip():
        return jsonify({
            "ok": False,
            "error": "空文本会破坏 jsonl（API 报 text content blocks must be non-empty）。"
                     "要清掉这条请点'删除此条'按钮。",
        }), 400

    # 读所有行
    raw = p.read_text(encoding="utf-8")
    lines = raw.splitlines(keepends=True)
    if line_no > len(lines):
        return jsonify({"ok": False, "error": "line_no 超出文件范围"}), 400

    target_raw = lines[line_no - 1].rstrip("\n\r")
    if not target_raw.strip():
        return jsonify({"ok": False, "error": "目标行是空行"}), 400

    try:
        obj = json.loads(target_raw)
    except Exception as e:
        return jsonify({"ok": False, "error": f"目标行不是合法 JSON: {e}"}), 400

    # 只允许编辑 user/assistant 的 message.content
    t = obj.get("type")
    if t not in ("user", "assistant"):
        return jsonify({"ok": False, "error": f"不支持编辑 {t} 类型"}), 400

    msg = obj.setdefault("message", {})
    content = msg.get("content")

    # 在动 content 之前读出原 reminders（仅 user 消息有意义）
    if preserve_reminders and t == "user":
        orig_text = _extract_first_text_block(content)
        orig_matches = list(SYSTEM_REMINDER_RE.finditer(orig_text))
        if orig_matches:
            # 用户在 textarea 里没自带 reminder 时，把原 reminder 全部 prepend 回去
            if not SYSTEM_REMINDER_RE.search(new_text):
                prefix = "".join(m.group(0) for m in orig_matches)
                new_text = prefix + ("\n" if not new_text.startswith("\n") else "") + new_text

    if isinstance(content, str):
        msg["content"] = new_text
    elif isinstance(content, list):
        # 找第一个 type=text 的 item，替换 text；没有就 prepend 一个
        replaced = False
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                item["text"] = new_text
                replaced = True
                break
        if not replaced:
            # 工具结果消息可能没 text，跳过编辑
            tool_result = any(
                isinstance(it, dict) and it.get("type") == "tool_result"
                for it in content
            )
            if tool_result:
                return jsonify({
                    "ok": False,
                    "error": "这条是工具返回，不能直接编辑文本",
                }), 400
            content.insert(0, {"type": "text", "text": new_text})
    else:
        msg["content"] = new_text

    # 写回前最后一道防线：扫一遍 content，确保没有空 text block 漏出去
    final_content = msg.get("content")
    if isinstance(final_content, str) and not final_content.strip():
        return jsonify({"ok": False, "error": "兜底校验失败：content 为空字符串"}), 400
    if isinstance(final_content, list):
        for item in final_content:
            if (isinstance(item, dict)
                    and item.get("type") == "text"
                    and not (item.get("text") or "").strip()):
                return jsonify({
                    "ok": False,
                    "error": "兜底校验失败：list 里仍有空 text block",
                }), 400

    # 备份原 jsonl
    backup = p.with_name(p.name + f".bak-{int(time.time())}")
    try:
        shutil.copy2(p, backup)
    except Exception as e:
        return jsonify({"ok": False, "error": f"备份失败: {e}"}), 500

    # 写回（保持 jsonl 格式：单行 JSON + \n，不缩进，不 escape ASCII）
    new_line = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"
    lines[line_no - 1] = new_line
    try:
        p.write_text("".join(lines), encoding="utf-8")
    except Exception as e:
        return jsonify({"ok": False, "error": f"写文件失败: {e}"}), 500

    # 记录本进程 write 的 mtime, 后续保存时不会被误判为外部修改
    LAST_SELF_WRITE[sid] = p.stat().st_mtime

    return jsonify({
        "ok": True,
        "text_html": render_markdown(new_text),
        "backup": backup.name,
    })


def _describe_line(obj):
    """给一行 jsonl 对象生成简短描述（用于删除预览 / 撤销列表）"""
    if not obj:
        return "(parse failed)"
    t = obj.get("type", "?")
    if t == "user":
        msg = obj.get("message", {})
        content = msg.get("content", "")
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "tool_result":
                    tc = item.get("content", "")
                    if isinstance(tc, list):
                        for ci in tc:
                            if isinstance(ci, dict) and "text" in ci:
                                return f"tool_result: {ci['text'][:80].strip()}"
                    return f"tool_result: {str(tc)[:80].strip()}"
        text = extract_text(content)
        text = SYSTEM_REMINDER_RE.sub("[reminder]", text).strip()
        return text[:100] or "(空)"
    if t == "assistant":
        msg = obj.get("message", {})
        content = msg.get("content", [])
        text_parts = []
        tool_names = []
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        text_parts.append(item.get("text", "").strip())
                    elif item.get("type") == "tool_use":
                        tool_names.append(item.get("name", "?"))
        elif isinstance(content, str):
            text_parts.append(content.strip())
        desc = " ".join(p for p in text_parts if p)[:80].strip()
        if tool_names:
            desc = (desc + " ") if desc else ""
            desc += "[tools: " + ",".join(tool_names) + "]"
        return desc or "(空)"
    if t == "summary":
        return "summary: " + str(obj.get("summary", ""))[:80]
    if t == "attachment":
        return "attachment"
    return t


def _extract_first_text_block(content):
    """从 message.content 抽出第一个 text block 的纯文本（用于读取原 reminder）"""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                return item.get("text", "")
    return ""


def _is_real_user_text_turn(obj):
    """判断这行是不是"真用户输入"——不是 tool_result、不是 meta、不是 sidechain"""
    if obj.get("type") != "user":
        return False
    if obj.get("isMeta") or obj.get("isSidechain"):
        return False
    if obj.get("toolUseResult") is not None:
        return False
    msg = obj.get("message", {})
    content = msg.get("content", "")
    if isinstance(content, str):
        return bool(content.strip())
    if isinstance(content, list):
        # 含 tool_result 就不是真用户输入
        for item in content:
            if isinstance(item, dict) and item.get("type") == "tool_result":
                return False
        # 必须有非空 text
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                if (item.get("text") or "").strip():
                    return True
            elif isinstance(item, str) and item.strip():
                return True
    return False


def _safe_parse(line):
    try:
        return json.loads(line.rstrip("\n\r"))
    except Exception:
        return None


@app.route("/project/<project_id>/session/<sid>/delete", methods=["POST"])
def session_delete(project_id, sid):
    """删除消息行。

    body 参数：
      line_no: 目标行号（1-based）
      mode:
        - "line"     : 只删这一行（危险，可能破坏角色交替）
        - "from_here": 删 line_no 起到末尾（推荐用于清"触发警告之后"的全部上下文）
        - "turn"     : 删整轮——从最近的真用户输入到下一个真用户输入之前
    """
    import shutil

    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        abort(404)

    file_mtime = p.stat().st_mtime
    last_self = LAST_SELF_WRITE.get(sid, 0)
    age = time.time() - file_mtime
    is_external_write = age < 10 and abs(file_mtime - last_self) > 2
    if is_external_write:
        return jsonify({
            "ok": False,
            "error": "session 还在被外部写（10 秒内 Claude Desktop 写过），先关掉再删",
        }), 423

    body = request.get_json(silent=True) or {}
    try:
        line_no = int(body.get("line_no", 0))
    except Exception:
        line_no = 0
    mode = body.get("mode", "line")
    dry_run = bool(body.get("dry_run", False))
    if mode not in ("line", "from_here", "turn"):
        return jsonify({"ok": False, "error": f"未知 mode: {mode}"}), 400
    if line_no <= 0:
        return jsonify({"ok": False, "error": "line_no 不合法"}), 400

    raw = p.read_text(encoding="utf-8")
    lines = raw.splitlines(keepends=True)
    if line_no > len(lines):
        return jsonify({"ok": False, "error": "line_no 超出范围"}), 400

    # 计算要删除的范围 [del_start, del_end)（0-based）
    if mode == "from_here":
        del_start = line_no - 1
        del_end = len(lines)
    elif mode == "turn":
        # 向前找最近的真用户输入作为 turn 起点
        idx = line_no - 1
        start = idx
        while start >= 0:
            obj = _safe_parse(lines[start])
            if obj and _is_real_user_text_turn(obj):
                break
            start -= 1
        if start < 0:
            # 找不到真用户起点（比如 session 第一条是 summary），就从 idx 开始
            start = idx
        # 向后找下一个真用户输入作为 turn 终点（exclusive）
        end = idx + 1
        while end < len(lines):
            obj = _safe_parse(lines[end])
            if obj and _is_real_user_text_turn(obj):
                break
            end += 1
        del_start, del_end = start, end
    else:  # "line"
        del_start = line_no - 1
        del_end = line_no

    new_lines = lines[:del_start] + lines[del_end:]

    # 角色交替校验：只在 mode == "line" 时给 warning，不阻断（用户可能就是要这么干）
    warnings = []
    if mode == "line":
        # 检查删除点前后两行是不是 user/user 或 assistant/assistant
        prev_obj = _safe_parse(lines[del_start - 1]) if del_start > 0 else None
        next_obj = _safe_parse(lines[del_end]) if del_end < len(lines) else None
        if prev_obj and next_obj:
            prev_t = prev_obj.get("type")
            next_t = next_obj.get("type")
            if prev_t in ("user", "assistant") and next_t in ("user", "assistant"):
                if prev_t == next_t:
                    warnings.append(
                        f"删除后 L{del_start} 和 L{del_end + 1} 都是 {prev_t}，"
                        f"角色不交替——下次请求可能 400。建议改用 turn 或 from_here 模式。"
                    )

    # 预览模式：返回会被删的内容，不写文件、不备份
    preview = []
    for i in range(del_start, del_end):
        obj = _safe_parse(lines[i])
        preview.append({
            "line_no": i + 1,
            "kind": (obj or {}).get("type", "broken"),
            "desc": _describe_line(obj),
        })
    if dry_run:
        return jsonify({
            "ok": True,
            "dry_run": True,
            "would_delete": preview,
            "deleted": del_end - del_start,
            "del_start_line": del_start + 1,
            "del_end_line": del_end,
            "remaining_lines": len(new_lines),
            "warnings": warnings,
        })

    # 备份
    backup = p.with_name(p.name + f".bak-{int(time.time())}")
    try:
        shutil.copy2(p, backup)
    except Exception as e:
        return jsonify({"ok": False, "error": f"备份失败: {e}"}), 500

    try:
        p.write_text("".join(new_lines), encoding="utf-8")
    except Exception as e:
        return jsonify({"ok": False, "error": f"写文件失败: {e}"}), 500

    LAST_SELF_WRITE[sid] = p.stat().st_mtime

    return jsonify({
        "ok": True,
        "deleted": del_end - del_start,
        "del_start_line": del_start + 1,
        "del_end_line": del_end,
        "remaining_lines": len(new_lines),
        "backup": backup.name,
        "warnings": warnings,
        "would_delete": preview,
    })


@app.route("/project/<project_id>/session/<sid>/delete-bulk", methods=["POST"])
def session_delete_bulk(project_id, sid):
    """批量删除多行（按行号去重，支持 dry_run）。"""
    import shutil

    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        abort(404)

    file_mtime = p.stat().st_mtime
    last_self = LAST_SELF_WRITE.get(sid, 0)
    age = time.time() - file_mtime
    is_external_write = age < 10 and abs(file_mtime - last_self) > 2
    if is_external_write:
        return jsonify({
            "ok": False,
            "error": "session 还在被外部写，先关掉再删",
        }), 423

    body = request.get_json(silent=True) or {}
    line_nos = body.get("line_nos", [])
    dry_run = bool(body.get("dry_run", False))

    if not isinstance(line_nos, list) or not line_nos:
        return jsonify({"ok": False, "error": "需要非空的 line_nos 数组"}), 400
    try:
        line_nos = sorted({int(x) for x in line_nos})
    except Exception:
        return jsonify({"ok": False, "error": "line_nos 不全是整数"}), 400

    raw = p.read_text(encoding="utf-8")
    lines = raw.splitlines(keepends=True)
    if any(ln <= 0 or ln > len(lines) for ln in line_nos):
        return jsonify({"ok": False, "error": "存在越界 line_no"}), 400

    # 预览
    preview = []
    for ln in line_nos:
        obj = _safe_parse(lines[ln - 1])
        preview.append({
            "line_no": ln,
            "kind": (obj or {}).get("type", "broken"),
            "desc": _describe_line(obj),
        })

    # 角色交替校验：删完后扫一遍剩下的"真消息"序列
    keep_set = set(range(len(lines))) - {ln - 1 for ln in line_nos}
    warnings = []
    prev_t = None
    for i in sorted(keep_set):
        obj = _safe_parse(lines[i])
        if not obj:
            continue
        t = obj.get("type")
        if t not in ("user", "assistant"):
            continue
        if prev_t == t:
            warnings.append(f"删除后 L{i+1} 仍与前一条同为 {t}，角色不交替")
            break  # 一条提示就够
        prev_t = t

    if dry_run:
        return jsonify({
            "ok": True,
            "dry_run": True,
            "would_delete": preview,
            "deleted": len(line_nos),
            "remaining_lines": len(lines) - len(line_nos),
            "warnings": warnings,
        })

    # 备份
    backup = p.with_name(p.name + f".bak-{int(time.time())}")
    try:
        shutil.copy2(p, backup)
    except Exception as e:
        return jsonify({"ok": False, "error": f"备份失败: {e}"}), 500

    # 从大到小删（pop 不影响小于它的索引）
    new_lines = list(lines)
    for ln in sorted(line_nos, reverse=True):
        new_lines.pop(ln - 1)

    try:
        p.write_text("".join(new_lines), encoding="utf-8")
    except Exception as e:
        return jsonify({"ok": False, "error": f"写文件失败: {e}"}), 500

    LAST_SELF_WRITE[sid] = p.stat().st_mtime
    return jsonify({
        "ok": True,
        "deleted": len(line_nos),
        "remaining_lines": len(new_lines),
        "backup": backup.name,
        "warnings": warnings,
        "would_delete": preview,
    })


@app.route("/project/<project_id>/session/<sid>/backups")
def session_backups(project_id, sid):
    """列出当前 session 的所有 .bak 备份。"""
    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    if not project_dir.exists():
        abort(404)
    pattern = f"{sid}.jsonl.bak-*"
    backups = []
    for bp in project_dir.glob(pattern):
        try:
            stat = bp.stat()
            line_count = 0
            with open(bp, "rb") as f:
                for _ in f:
                    line_count += 1
            backups.append({
                "name": bp.name,
                "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "mtime_ts": stat.st_mtime,
                "size_kb": round(stat.st_size / 1024, 1),
                "lines": line_count,
            })
        except Exception:
            continue
    backups.sort(key=lambda b: b["mtime_ts"], reverse=True)
    return jsonify({"backups": backups})


@app.route("/project/<project_id>/session/<sid>/restore", methods=["POST"])
def session_restore(project_id, sid):
    """从 .bak 恢复。恢复前会把当前文件再存一份 .bak（防误恢复后无法回头）。"""
    import shutil

    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    target = project_dir / f"{sid}.jsonl"
    if not target.exists():
        abort(404)

    body = request.get_json(silent=True) or {}
    backup_name = body.get("backup", "")
    # 文件名严格校验：必须是这个 sid 的 bak
    if not re.match(rf"^{re.escape(sid)}\.jsonl\.bak-[\w\-]+$", backup_name):
        return jsonify({"ok": False, "error": "备份文件名不合法"}), 400
    bak_path = project_dir / backup_name
    if not bak_path.exists():
        return jsonify({"ok": False, "error": "备份不存在"}), 404

    file_mtime = target.stat().st_mtime
    last_self = LAST_SELF_WRITE.get(sid, 0)
    age = time.time() - file_mtime
    is_external_write = age < 10 and abs(file_mtime - last_self) > 2
    if is_external_write:
        return jsonify({
            "ok": False,
            "error": "session 还在被外部写，先关掉再恢复",
        }), 423

    # 先把当前文件存为 pre-restore 备份
    pre_bak = target.with_name(f"{target.name}.bak-{int(time.time())}-pre-restore")
    try:
        shutil.copy2(target, pre_bak)
    except Exception as e:
        return jsonify({"ok": False, "error": f"恢复前备份失败: {e}"}), 500

    try:
        shutil.copy2(bak_path, target)
    except Exception as e:
        return jsonify({"ok": False, "error": f"恢复失败: {e}"}), 500

    LAST_SELF_WRITE[sid] = target.stat().st_mtime
    return jsonify({
        "ok": True,
        "restored_from": backup_name,
        "pre_restore_backup": pre_bak.name,
    })


@app.route("/project/<project_id>/session/<sid>/edit-reminder", methods=["POST"])
def session_edit_reminder(project_id, sid):
    """编辑 / 删除 user 消息里第 N 个 <system-reminder> 块。

    body:
      line_no:        目标行
      reminder_idx:   第几个 reminder（0-based）
      new_text:       新内容（不含 <system-reminder> 标签）；忽略当 delete=true
      delete:         true → 整块删除该 reminder
    """
    import shutil

    if not _validate_project_id(project_id):
        abort(400)
    if not re.match(r"^[a-f0-9-]+$", sid):
        abort(400)
    project_dir = get_project_dir(project_id)
    p = project_dir / f"{sid}.jsonl"
    if not p.exists():
        abort(404)

    file_mtime = p.stat().st_mtime
    last_self = LAST_SELF_WRITE.get(sid, 0)
    age = time.time() - file_mtime
    is_external_write = age < 10 and abs(file_mtime - last_self) > 2
    if is_external_write:
        return jsonify({
            "ok": False,
            "error": "session 还在被外部写，先关掉再改",
        }), 423

    body = request.get_json(silent=True) or {}
    try:
        line_no = int(body.get("line_no", 0))
        rem_idx = int(body.get("reminder_idx", -1))
    except Exception:
        return jsonify({"ok": False, "error": "line_no / reminder_idx 不合法"}), 400
    new_text = body.get("new_text", "") or ""
    if not isinstance(new_text, str):
        new_text = str(new_text)
    delete = bool(body.get("delete", False))

    if line_no <= 0 or rem_idx < 0:
        return jsonify({"ok": False, "error": "line_no / reminder_idx 不合法"}), 400

    raw = p.read_text(encoding="utf-8")
    lines = raw.splitlines(keepends=True)
    if line_no > len(lines):
        return jsonify({"ok": False, "error": "line_no 越界"}), 400

    target_raw = lines[line_no - 1].rstrip("\n\r")
    try:
        obj = json.loads(target_raw)
    except Exception as e:
        return jsonify({"ok": False, "error": f"目标行不是合法 JSON: {e}"}), 400

    if obj.get("type") != "user":
        return jsonify({"ok": False, "error": "只能编辑 user 消息的 reminder"}), 400

    msg = obj.setdefault("message", {})
    content = msg.get("content")

    # 拿到承载 reminder 的 text block 引用
    text_block_ref = None  # ("string",) 或 ("dict", item)
    if isinstance(content, str):
        full_text = content
        text_block_ref = ("string",)
    elif isinstance(content, list):
        target_item = None
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                target_item = item
                break
        if target_item is None:
            return jsonify({"ok": False, "error": "找不到 text block"}), 400
        full_text = target_item.get("text", "")
        text_block_ref = ("dict", target_item)
    else:
        return jsonify({"ok": False, "error": "未知 content 格式"}), 400

    matches = list(SYSTEM_REMINDER_RE.finditer(full_text))
    if rem_idx >= len(matches):
        return jsonify({
            "ok": False,
            "error": f"reminder_idx 越界（共 {len(matches)} 个 reminder）",
        }), 400

    m = matches[rem_idx]
    if delete:
        new_full = full_text[:m.start()] + full_text[m.end():]
    else:
        # 不允许把 reminder 内容改空（要清就用 delete 模式）
        if not new_text.strip():
            return jsonify({
                "ok": False,
                "error": "reminder 内容为空。要删除该 reminder 请用 delete=true。",
            }), 400
        replacement = f"<system-reminder>{new_text}</system-reminder>"
        new_full = full_text[:m.start()] + replacement + full_text[m.end():]

    # 主体文本不能整个变空
    if not new_full.strip():
        return jsonify({
            "ok": False,
            "error": "改完后整段文本为空。删除整条消息请用 delete 接口。",
        }), 400

    # 写回
    if text_block_ref[0] == "string":
        msg["content"] = new_full
    else:
        text_block_ref[1]["text"] = new_full

    backup = p.with_name(p.name + f".bak-{int(time.time())}")
    try:
        shutil.copy2(p, backup)
    except Exception as e:
        return jsonify({"ok": False, "error": f"备份失败: {e}"}), 500

    new_line = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"
    lines[line_no - 1] = new_line
    try:
        p.write_text("".join(lines), encoding="utf-8")
    except Exception as e:
        return jsonify({"ok": False, "error": f"写文件失败: {e}"}), 500

    LAST_SELF_WRITE[sid] = p.stat().st_mtime
    return jsonify({"ok": True, "backup": backup.name})


# ---------- 启动 ----------
def open_browser():
    time.sleep(0.6)
    webbrowser.open(f"http://{HOST}:{PORT}/")


def main():
    print(f"扫描项目根: {PROJECTS_ROOT}")
    if not PROJECTS_ROOT.exists():
        print("Claude Code 项目根目录不存在 (~/.claude/projects)")
        sys.exit(1)
    projects = list_projects()
    print(f"找到 {len(projects)} 个项目")
    print(f"启动地址: http://{HOST}:{PORT}/")
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host=HOST, port=PORT, debug=False)


if __name__ == "__main__":
    main()
