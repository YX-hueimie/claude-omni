"""
claude-omni · panel

可视化控制面板。Flask 本地服务，端口 5500。浏览器自动打开。

功能:
  - 总览各补丁安装状态 (5 档 + persona + 3 个 desktop-* + session-browser)
  - 一键 install / uninstall (实时 stdout 流)
  - 内容预览 (CLAUDE.md / append.txt / SKILL.md)
  - session-browser 启动 / 停止

设计语言: parchment + Lora serif + terracotta (跟 docs/architecture.html 同套)。
"""
import ctypes
import json
import os
import socket
import subprocess
import sys
import threading
import time
import uuid
import webbrowser
from collections import deque
from pathlib import Path


# ============================================================
# UAC 提权 (没管理员权限就读不了 WindowsApps, 装/卸 asar 类补丁也不行)
# ============================================================

def is_admin():
    if os.name != "nt":
        return True  # 非 Windows 不需要提权
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def relaunch_as_admin():
    # sys.argv[0] 双击 .bat 起来时是相对路径 (如 "panel.py")。提权后新进程的工作目录
    # 会被 Windows 设成 System32, 相对路径找不到脚本 → 闪退。这里转绝对路径,
    # 并显式把脚本所在目录作为 lpDirectory 传给 ShellExecuteW。
    script = os.path.abspath(sys.argv[0])
    params = " ".join(f'"{a}"' for a in [script] + sys.argv[1:])
    workdir = os.path.dirname(script)
    ret = ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, workdir, 1)
    if ret <= 32:
        print(f"[错误] 提权失败 (ShellExecute ret={ret})")
        print("没管理员权限的话, panel 看不到 WindowsApps 目录,")
        print("装 asar 类补丁会失败。可以右键 start.bat → 以管理员身份运行。")
        try:
            input("按回车退出...")
        except EOFError:
            pass
        sys.exit(1)
    sys.exit(0)


if os.name == "nt" and not is_admin():
    print("=" * 60)
    print("claude-omni · panel")
    print("=" * 60)
    print()
    print("需要管理员权限 (要读 C:\\Program Files\\WindowsApps + 装/卸 asar 类补丁)")
    print("正在请求 UAC 提权...")
    relaunch_as_admin()


# ============================================================
# 自动装依赖 (没装就 pip install, 不让用户手动跑)
# ============================================================

def ensure_packages():
    """flask 必需; markdown 可选 (用于渲染 README)。"""
    needed = []
    try:
        import flask  # noqa: F401
    except ImportError:
        needed.append("flask")
    try:
        import markdown  # noqa: F401
    except ImportError:
        needed.append("markdown")

    if not needed:
        return

    print("=" * 60)
    print("claude-omni · panel")
    print("=" * 60)
    print()
    print(f"[panel] 自动安装依赖: {', '.join(needed)}")
    print(f"[panel] python: {sys.executable}")
    print()
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--disable-pip-version-check",
             "--quiet", *needed],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print()
        print(f"[panel] pip install 失败 (exit code {e.returncode})")
        if "flask" in needed:
            print("[panel] flask 是必需的, 请手动跑: python -m pip install flask")
            try:
                input("按回车退出...")
            except EOFError:
                pass
            sys.exit(1)
        else:
            print("[panel] markdown 装失败, 但是是可选的 (README 会用纯文本显示)")
    print("[panel] 装好了")
    print()


ensure_packages()


from flask import Flask, jsonify, request, Response, abort  # noqa: E402

SCRIPT_DIR = Path(__file__).parent.resolve()
ROOT_DIR = SCRIPT_DIR.parent
CLAUDE_DIR = Path(os.path.expanduser("~/.claude"))
TIER_MARKER = CLAUDE_DIR / ".claude-omni-tier"
PERSONA_MARKER = CLAUDE_DIR / ".claude-omni-persona"
TIER5_MODE_MARKER = CLAUDE_DIR / ".claude-omni-tier5-mode"
WINDOWSAPPS = Path(r"C:\Program Files\WindowsApps")

HOST = "127.0.0.1"
# 首选 PORT; Windows 开了 Hyper-V / WSL / 虚拟机平台后会保留大段端口号, 撞上 bind 会
# 失败 (WinError 10013)。备一组候选, 启动时逐个试, 取第一个能 bind 的。
PORT = 5500
PORT_CANDIDATES = [5500, 5712, 6606, 7788, 8855, 9119]

# ============================================================
# 补丁定义
# ============================================================

# 5 档 jailbreak (互斥, marker = ~/.claude/.claude-omni-tier)
TIERS = [
    {
        "id": "tier-1",
        "dir": "tier-1-claude-md",
        "name": "tier-1",
        "stars": "★",
        "subtitle": "CLAUDE.md (user 角色)",
        "desc": "最简单, 不动客户端二进制, 跨平台",
        "platform": "跨平台 (Code 生效)",
        "preview_files": ["CLAUDE.md"],
    },
    {
        "id": "tier-2",
        "dir": "tier-2-prompt-append",
        "name": "tier-2",
        "stars": "★★",
        "subtitle": "asar patch (system 角色)",
        "desc": "改 asar, 把 append.txt 拼到 SDK system prompt 末尾",
        "platform": "Windows / Claude Desktop",
        "preview_files": ["append.txt"],
        "has_emergency": True,
    },
    {
        "id": "tier-2.5",
        "dir": "tier-2.5-claude-md-skills",
        "name": "tier-2.5",
        "stars": "★★☆",
        "subtitle": "tier-1 + skills",
        "desc": "CLAUDE.md (user 角色) + skill description (system 角色)",
        "platform": "跨平台 (Code 生效)",
        "preview_files": ["CLAUDE.md"],
        "preview_skills": True,
    },
    {
        "id": "tier-3",
        "dir": "tier-3-prompt-append-skills",
        "name": "tier-3",
        "stars": "★★★",
        "subtitle": "tier-2 + skills",
        "desc": "system 主体末尾 deployment-context + system <available_skills> 双通道",
        "platform": "Windows / Claude Desktop",
        "preview_files": ["append.txt"],
        "preview_skills": True,
        "has_emergency": True,
    },
    {
        "id": "tier-5",
        "dir": "tier-5-prompt-override",
        "name": "tier-5",
        "stars": "★★★★★",
        "subtitle": "整段替换 + Cowork strip",
        "desc": "整段替换 SDK system prompt + Cowork strip 三段",
        "platform": "Windows / Claude Desktop",
        "preview_files": ["append.v1.txt", "append.v2.txt", "append.v3.txt", "append.v4.txt",
                          "append-prepend.v1.txt", "append-prepend.v2.txt", "append-prepend.v3.txt",
                          "append-prepend.v4.txt"],
        "has_emergency": True,
        "has_mode": True,
        "modes": [
            {"id": "v1", "label": "v1 · 绝对服从", "desc": "直接执行不顶嘴, 不发散"},
            {"id": "v2", "label": "v2 · 主动思考", "desc": "保留主动性、敢顶嘴、发散思路"},
            {"id": "v3", "label": "v3 · 自闭天才", "desc": "融 codex 系统提示词 · 先做人后做事 · 不支持 jailbreak", "warn_persona": True},
            {"id": "v4", "label": "v4 · 漏洞挖掘", "desc": "漏洞赏金 · 授权红队 · 侦察到报告全流程"},
        ],
    },
]

# 风格层 (互斥, marker = ~/.claude/.claude-omni-persona)
PERSONAS = [
    {
        "id": "persona-laoniang",
        "dir": "persona-laoniang",
        "name": "laoniang",
        "subtitle": "傲娇大姐",
        "desc": "自称老娘的北方大姐, 直来直去、傲娇、嘴硬心软",
        "preview_files": ["CLAUDE.md"],
    },
]

# UI 补丁 (互不冲突, 各自独立 marker 在 asar 里)
DESKTOP_PATCHES = [
    {
        "id": "desktop-font",
        "dir": "desktop-font",
        "name": "desktop-font",
        "subtitle": "字体",
        "desc": "Anthropic Serif + 思源宋体",
        "asar_marker": "FONT_PATCH_INPLACE_v1",
        "has_emergency": True,
    },
    {
        "id": "desktop-i18n",
        "dir": "desktop-i18n",
        "name": "desktop-i18n",
        "subtitle": "中文化",
        "desc": "Claude Desktop 全 UI 中文化",
        "asar_marker": "I18N_PATCH_INPLACE_v1",
        "has_emergency": True,
    },
    {
        "id": "desktop-devtools",
        "dir": "desktop-devtools",
        "name": "desktop-devtools",
        "subtitle": "DevTools",
        "desc": "启用开发者工具 + 重绑快捷键",
        "asar_marker": "DEVTOOLS_PATCH_v1",
        "has_emergency": True,
    },
]


# ============================================================
# 状态检测
# ============================================================

def find_claude_app():
    """找 Claude Desktop 安装位置, 没装返回 None。"""
    if not WINDOWSAPPS.exists():
        return None
    candidates = []
    for d in WINDOWSAPPS.glob("Claude_*_x64__*"):
        app = d / "app"
        if (app / "resources" / "app.asar").exists():
            candidates.append((d.name, app))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


_asar_marker_cache = {"path": None, "mtime": 0, "markers": set()}


def get_installed_asar_markers():
    """读 app.asar 里有哪些已知补丁的 marker (带 mtime 缓存)。"""
    app = find_claude_app()
    if app is None:
        return set()
    asar = app / "resources" / "app.asar"
    if not asar.exists():
        return set()
    try:
        mtime = asar.stat().st_mtime
    except OSError:
        return set()
    if (str(asar) == _asar_marker_cache["path"]
            and abs(mtime - _asar_marker_cache["mtime"]) < 0.001):
        return _asar_marker_cache["markers"]
    try:
        text = asar.read_bytes().decode("utf-8", errors="replace")
    except OSError:
        return set()
    markers = set()
    if "L2_APPEND_PATCH_v1 START" in text:
        markers.add("L2_APPEND_PATCH_v1")
    for m in ["FONT_PATCH_v2", "FONT_PATCH_INPLACE_v1",
              "I18N_PATCH_INPLACE_v1", "DEVTOOLS_PATCH_v1"]:
        if m in text:
            markers.add(m)
    _asar_marker_cache.update({"path": str(asar),
                               "mtime": mtime,
                               "markers": markers})
    return markers


def get_current_tier():
    """读 ~/.claude/.claude-omni-tier marker。返回 tier 名或 None。"""
    if TIER_MARKER.exists():
        try:
            return TIER_MARKER.read_text(encoding="utf-8").strip()
        except OSError:
            return None
    return None


def get_current_persona():
    """读 ~/.claude/.claude-omni-persona marker。"""
    if PERSONA_MARKER.exists():
        try:
            return PERSONA_MARKER.read_text(encoding="utf-8").strip()
        except OSError:
            return None
    return None


def get_tier5_mode():
    """读 ~/.claude/.claude-omni-tier5-mode marker, 返回 'v1' / 'v2' / 'v3' / 'v4'。没有/非法 → 'v2'。"""
    if TIER5_MODE_MARKER.exists():
        try:
            v = TIER5_MODE_MARKER.read_text(encoding="utf-8").strip()
            if v in ("v1", "v2", "v3", "v4"):
                return v
        except OSError:
            pass
    return "v2"


def agents_installed():
    """v4 依赖的 subagent (agents/*.md) 是否已部署到 ~/.claude/agents/。
    源目录里每个 .md 在目标都存在, 才算已装。"""
    src = ROOT_DIR / "tier-5-prompt-override" / "agents"
    dst = Path(os.path.expanduser("~/.claude/agents"))
    mds = sorted(src.glob("*.md")) if src.is_dir() else []
    return bool(mds) and all((dst / md.name).exists() for md in mds)


def is_port_open(port):
    """检测本地端口是否被占用 (session-browser 在 5193)。"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.2)
    try:
        s.connect((HOST, port))
        return True
    except (OSError, socket.timeout):
        return False
    finally:
        s.close()


def find_bindable_port():
    """从 PORT_CANDIDATES 里挑第一个能 bind 的端口; 都不行返回 None。
    被占用 (WinError 10048) 或被系统保留 (WinError 10013) 都会 bind 失败, 一并跳过。"""
    for p in PORT_CANDIDATES:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind((HOST, p))
            return p
        except OSError:
            continue
        finally:
            s.close()
    return None


def collect_status():
    """聚合所有补丁的当前状态, 返回 JSON-serializable dict。"""
    cur_tier = get_current_tier()
    cur_persona = get_current_persona()
    asar_markers = get_installed_asar_markers()
    claude_app = find_claude_app()
    sb_running = is_port_open(5193) and SESSION_BROWSER["proc"] is not None

    return {
        "claude_desktop_found": claude_app is not None,
        "claude_app_path": str(claude_app) if claude_app else None,
        "current_tier": cur_tier,
        "current_persona": cur_persona,
        "tier5_mode": get_tier5_mode(),
        "agents_installed": agents_installed(),
        "asar_markers": sorted(asar_markers),
        "tiers": [
            {**t, "installed": cur_tier == t["name"]}
            for t in TIERS
        ],
        "personas": [
            {**p, "installed": cur_persona == p["name"]}
            for p in PERSONAS
        ],
        "desktop_patches": [
            {**dp, "installed": dp["asar_marker"] in asar_markers}
            for dp in DESKTOP_PATCHES
        ],
        "session_browser": {
            "running": sb_running,
            "port": 5193,
            "url": f"http://{HOST}:5193" if sb_running else None,
        },
    }


# ============================================================
# 任务管理: 跑 install/uninstall, 收集 stdout 流
# ============================================================

class Task:
    def __init__(self, task_id, label, cmd, cwd):
        self.id = task_id
        self.label = label
        self.cmd = cmd
        self.cwd = cwd
        self.lines = deque(maxlen=2000)
        self.done = False
        self.exit_code = None
        self.lock = threading.Lock()
        self.proc = None

    def run(self):
        env = {**os.environ,
               "PYTHONIOENCODING": "utf-8",
               "PYTHONUNBUFFERED": "1",
               "CLAUDE_OMNI_PANEL": "1"}
        try:
            self.proc = subprocess.Popen(
                self.cmd,
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            for raw in self.proc.stdout:
                line = raw.rstrip("\n")
                with self.lock:
                    self.lines.append(line)
            self.proc.wait()
            self.exit_code = self.proc.returncode
        except Exception as e:
            with self.lock:
                self.lines.append(f"[panel error] {type(e).__name__}: {e}")
            self.exit_code = -1
        finally:
            self.done = True

    def snapshot(self, since=0):
        with self.lock:
            n = len(self.lines)
            new = list(self.lines)[max(0, since):]
        return {
            "lines": new,
            "total": n,
            "done": self.done,
            "exit_code": self.exit_code,
        }


_tasks = {}
_tasks_lock = threading.Lock()


def start_task(label, cmd, cwd):
    tid = uuid.uuid4().hex[:8]
    task = Task(tid, label, cmd, cwd)
    with _tasks_lock:
        _tasks[tid] = task
    threading.Thread(target=task.run, daemon=True).start()
    return tid


def get_task(tid):
    with _tasks_lock:
        return _tasks.get(tid)


# ============================================================
# session-browser 子进程管理
# ============================================================

SESSION_BROWSER = {"proc": None}


def start_session_browser():
    if SESSION_BROWSER["proc"] is not None and SESSION_BROWSER["proc"].poll() is None:
        return False, "已在运行"
    sb_dir = ROOT_DIR / "session-browser"
    sb_py = sb_dir / "session_browser.py"
    if not sb_py.exists():
        return False, f"找不到 {sb_py}"
    try:
        proc = subprocess.Popen(
            [sys.executable, str(sb_py)],
            cwd=sb_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
    except Exception as e:
        return False, str(e)
    SESSION_BROWSER["proc"] = proc
    # 等几秒看端口是否起来
    for _ in range(20):
        if is_port_open(5193):
            return True, "已启动"
        time.sleep(0.2)
    return True, "进程已起, 但端口检测超时 (可能仍在启动)"


def stop_session_browser():
    proc = SESSION_BROWSER["proc"]
    if proc is None or proc.poll() is not None:
        SESSION_BROWSER["proc"] = None
        return False, "未运行"
    try:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
    except Exception as e:
        return False, str(e)
    SESSION_BROWSER["proc"] = None
    return True, "已停止"


# ============================================================
# Flask
# ============================================================

app = Flask(__name__)


@app.route("/api/status")
def api_status():
    return jsonify(collect_status())


@app.route("/api/preview/<component_id>")
def api_preview(component_id):
    """返回某个补丁的可预览内容 (CLAUDE.md / append.txt / skill 列表等)。"""
    found = None
    for src in (TIERS + PERSONAS + DESKTOP_PATCHES):
        if src["id"] == component_id:
            found = src
            break
    if not found:
        abort(404)

    base = ROOT_DIR / found["dir"]
    out = {"id": component_id, "files": []}

    for fname in found.get("preview_files", []):
        fp = base / fname
        if fp.exists():
            try:
                content = fp.read_text(encoding="utf-8")
            except Exception as e:
                content = f"(读取失败: {e})"
            out["files"].append({"name": fname, "content": content,
                                 "size": len(content)})

    if found.get("preview_skills"):
        skills_dir = base / "skills"
        if skills_dir.exists():
            skills = []
            for sd in sorted(skills_dir.iterdir()):
                if not sd.is_dir():
                    continue
                sf = sd / "SKILL.md"
                if sf.exists():
                    try:
                        skills.append({"name": sd.name,
                                       "content": sf.read_text(encoding="utf-8")})
                    except Exception:
                        pass
            out["skills"] = skills

    return jsonify(out)


@app.route("/api/action", methods=["POST"])
def api_action():
    """启动 install / uninstall / emergency-restore 任务。"""
    data = request.get_json(force=True)
    component_id = data.get("component")
    action = data.get("action")  # install | uninstall | emergency
    if action not in ("install", "uninstall", "emergency"):
        return jsonify({"error": "bad action"}), 400

    found = None
    for src in (TIERS + PERSONAS + DESKTOP_PATCHES):
        if src["id"] == component_id:
            found = src
            break
    if not found:
        return jsonify({"error": "unknown component"}), 404

    base = ROOT_DIR / found["dir"]
    script_name = {"install": "install.py",
                   "uninstall": "uninstall.py",
                   "emergency": "emergency-restore.py"}[action]
    script = base / script_name
    if not script.exists():
        return jsonify({"error": f"{script_name} 不存在"}), 400

    label = f"{component_id} · {action}"
    tid = start_task(label, [sys.executable, str(script)], str(base))
    return jsonify({"task_id": tid, "label": label})


@app.route("/api/log/<task_id>")
def api_log(task_id):
    since = int(request.args.get("since", 0))
    task = get_task(task_id)
    if not task:
        abort(404)
    return jsonify(task.snapshot(since))


@app.route("/api/tier5-mode", methods=["POST"])
def api_tier5_mode():
    """切 tier-5 的 v1/v2/v3/v4 mode。写 ~/.claude/.claude-omni-tier5-mode 文件,
    Claude 重启后 runtime read IIFE 会按新 mode 读对应文件。"""
    data = request.get_json(force=True)
    mode = data.get("mode")
    if mode not in ("v1", "v2", "v3", "v4"):
        return jsonify({"ok": False, "error": "mode 必须是 'v1' / 'v2' / 'v3' / 'v4'"}), 400
    CLAUDE_DIR.mkdir(parents=True, exist_ok=True)
    TIER5_MODE_MARKER.write_text(mode, encoding="utf-8")
    return jsonify({"ok": True, "mode": mode})


@app.route("/api/install-agents", methods=["POST"])
def api_install_agents():
    """把 v4 依赖的 subagent (tier-5-prompt-override/agents/*.md) 部署到 ~/.claude/agents/。
    幂等覆盖; 不动用户其它 agent。"""
    src = ROOT_DIR / "tier-5-prompt-override" / "agents"
    if not src.is_dir():
        return jsonify({"ok": False, "error": "找不到 agents 源目录"}), 400
    mds = sorted(src.glob("*.md"))
    if not mds:
        return jsonify({"ok": False, "error": "agents 源目录下没有 .md"}), 400
    dst = Path(os.path.expanduser("~/.claude/agents"))
    dst.mkdir(parents=True, exist_ok=True)
    names = []
    try:
        for md in mds:
            (dst / md.name).write_bytes(md.read_bytes())
            names.append(md.name)
    except OSError as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    return jsonify({"ok": True, "installed": names})


@app.route("/api/uninstall-agents", methods=["POST"])
def api_uninstall_agents():
    """从 ~/.claude/agents/ 移除本项目 ships 的 subagent。只删同名 .md, 不动用户其它 agent。"""
    src = ROOT_DIR / "tier-5-prompt-override" / "agents"
    mds = sorted(src.glob("*.md")) if src.is_dir() else []
    if not mds:
        return jsonify({"ok": False, "error": "agents 源目录下没有 .md"}), 400
    dst = Path(os.path.expanduser("~/.claude/agents"))
    removed = []
    try:
        for md in mds:
            t = dst / md.name
            if t.exists():
                t.unlink()
                removed.append(md.name)
    except OSError as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    return jsonify({"ok": True, "removed": removed})


@app.route("/api/session-browser/start", methods=["POST"])
def api_sb_start():
    ok, msg = start_session_browser()
    return jsonify({"ok": ok, "message": msg})


@app.route("/api/session-browser/stop", methods=["POST"])
def api_sb_stop():
    ok, msg = stop_session_browser()
    return jsonify({"ok": ok, "message": msg})


@app.route("/")
def index():
    return Response(INDEX_HTML, mimetype="text/html; charset=utf-8")


@app.route("/readme")
def readme_page():
    """渲染 panel/README.md (装了 markdown 库就转 HTML, 没装就 <pre>)。"""
    md_path = SCRIPT_DIR / "README.md"
    if not md_path.exists():
        return Response("README.md 不存在", status=404, mimetype="text/plain; charset=utf-8")
    try:
        text = md_path.read_text(encoding="utf-8")
    except Exception as e:
        return Response(f"读取失败: {e}", status=500, mimetype="text/plain; charset=utf-8")

    rendered = None
    try:
        import markdown as _md
        rendered = _md.markdown(
            text,
            extensions=["fenced_code", "tables", "nl2br", "sane_lists", "toc"],
        )
    except ImportError:
        pass  # 没装就 fallback

    if rendered is None:
        body = f'<pre class="raw">{_html_escape(text)}</pre>'
    else:
        body = f'<article class="md">{rendered}</article>'

    return Response(README_HTML.replace("{{BODY}}", body),
                    mimetype="text/html; charset=utf-8")


def _html_escape(s):
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;"))


# ============================================================
# 前端 (内嵌 HTML/CSS/JS)
# ============================================================

INDEX_HTML = r"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>claude-omni · 控制面板</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --parchment:#f5f4ed;
  --parchment-shade:#eeece2;
  --ivory:#faf9f5;
  --near-black:#141413;
  --dark-surface:#1f1f1d;
  --terracotta:#c96442;
  --coral:#d97757;
  --olive-gray:#5e5d59;
  --stone-gray:#87867f;
  --warm-silver:#b0aea5;
  --charcoal-warm:#4d4c48;
  --warm-sand:#e8e6dc;
  --border-cream:#e8e5d6;
  --border-warm:#d8d4c2;
  --ring-warm:#c8c4b3;
  --ok:#5a8a4a;
  --warn:#b08534;
  --err:#b53333;

  --serif:"Lora","Noto Serif SC",Georgia,"Times New Roman",serif;
  --sans:"Inter","Noto Serif SC",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
  --mono:"JetBrains Mono","Cascadia Code","SF Mono",Consolas,monospace;
}

*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  font-family:var(--sans);
  font-size:15px;line-height:1.6;
  color:var(--charcoal-warm);
  background:var(--parchment);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:1;
  opacity:.3;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
body > *{position:relative;z-index:2}

.wrap{max-width:1200px;margin:0 auto;padding:0 36px}

/* ============ HEADER ============ */
header{
  padding:48px 0 24px;
  border-bottom:1px solid var(--border-cream);
}
.header-title{
  font-family:var(--serif);font-weight:500;font-size:36px;
  color:var(--near-black);line-height:1.2;letter-spacing:-.01em;
}
.header-sub{
  margin-top:8px;color:var(--olive-gray);font-style:italic;
  font-family:var(--serif);font-size:18px;
}
.header-meta{
  margin-top:20px;display:flex;gap:18px;flex-wrap:wrap;
  font-size:13px;color:var(--stone-gray);
  font-family:var(--mono);
}
.header-meta span strong{color:var(--charcoal-warm);font-weight:500}
.header-actions{
  position:absolute;top:48px;right:36px;
}
.btn-refresh{
  background:var(--warm-sand);color:var(--charcoal-warm);
  border:none;padding:8px 14px;border-radius:8px;cursor:pointer;
  font-family:var(--sans);font-size:13px;
  box-shadow:0 0 0 1px var(--ring-warm);
  transition:background .15s;
}
.btn-refresh:hover{background:#dcd8c7}

/* ============ SECTION ============ */
section{padding:36px 0;border-bottom:1px solid var(--border-cream)}
section:last-of-type{border-bottom:none}
.section-h{
  display:flex;align-items:baseline;justify-content:space-between;
  margin-bottom:20px;
}
.section-h h2{
  font-family:var(--serif);font-weight:500;font-size:24px;
  color:var(--near-black);
}
.section-note{
  font-size:12.5px;color:var(--stone-gray);font-family:var(--mono);
}

/* ============ CARD GRID ============ */
.grid{display:grid;gap:18px}
.grid-tier{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.grid-narrow{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}

.card{
  background:var(--ivory);
  border:1px solid var(--border-cream);
  border-radius:12px;
  padding:18px 20px;
  display:flex;flex-direction:column;gap:10px;
  transition:box-shadow .15s,border-color .15s;
}
.card:hover{
  box-shadow:0 0 0 1px var(--ring-warm),0 4px 18px rgba(0,0,0,.04);
}
.card.installed{
  border-color:var(--terracotta);
  background:#fbf6f1;
}
.card.disabled{opacity:.55}

.card-h{
  display:flex;align-items:baseline;justify-content:space-between;gap:10px;
}
.card-name{
  font-family:var(--serif);font-weight:500;font-size:18px;
  color:var(--near-black);
}
.card-stars{
  font-family:var(--serif);color:var(--terracotta);
  font-size:14px;letter-spacing:.04em;
}
.card-sub{
  font-size:13px;color:var(--olive-gray);
  font-style:italic;font-family:var(--serif);
}
.card-desc{
  font-size:12.5px;color:var(--stone-gray);
  line-height:1.55;
}
.card-platform{
  font-size:11.5px;color:var(--stone-gray);
  font-family:var(--mono);letter-spacing:.02em;
}

.badge{
  display:inline-block;padding:2px 8px;border-radius:10px;
  font-size:11px;font-family:var(--mono);letter-spacing:.04em;
}
.badge-installed{background:var(--terracotta);color:var(--ivory)}
.badge-running{background:var(--ok);color:var(--ivory)}
.badge-disabled{background:var(--warm-sand);color:var(--stone-gray)}

.card-actions{
  margin-top:auto;display:flex;flex-wrap:wrap;gap:6px;
}
.btn{
  background:var(--warm-sand);color:var(--charcoal-warm);
  border:none;padding:6px 12px;border-radius:7px;cursor:pointer;
  font-family:var(--sans);font-size:12.5px;font-weight:500;
  box-shadow:0 0 0 1px var(--ring-warm);
  transition:background .15s,transform .05s;
}
.btn:hover:not(:disabled){background:#dcd8c7}
.btn:active{transform:translateY(1px)}
.btn:disabled{cursor:not-allowed;opacity:.45}
.btn-primary{background:var(--terracotta);color:var(--ivory);box-shadow:0 0 0 1px var(--terracotta)}
.btn-primary:hover:not(:disabled){background:#b35a3b}
.btn-danger{background:#fff;color:var(--err);box-shadow:0 0 0 1px var(--err)}
.btn-danger:hover:not(:disabled){background:#fff4f4}
.btn-ghost{background:transparent;box-shadow:0 0 0 1px var(--border-warm);color:var(--charcoal-warm)}
.btn-ghost:hover:not(:disabled){background:var(--warm-sand)}

/* ============ MODAL ============ */
.modal-mask{
  position:fixed;inset:0;background:rgba(20,20,19,.45);z-index:100;
  display:none;align-items:center;justify-content:center;
  padding:24px;
}
.modal-mask.show{display:flex}
.modal{
  background:var(--parchment);border-radius:16px;
  width:100%;max-width:920px;max-height:88vh;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 24px 64px rgba(0,0,0,.32);
}
.modal-h{
  padding:18px 24px;border-bottom:1px solid var(--border-cream);
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  background:var(--ivory);
}
.modal-title{
  font-family:var(--serif);font-weight:500;font-size:20px;
  color:var(--near-black);
}
.modal-close{
  background:transparent;border:none;cursor:pointer;
  font-size:24px;color:var(--stone-gray);
  padding:4px 10px;line-height:1;border-radius:6px;
}
.modal-close:hover{background:var(--warm-sand);color:var(--charcoal-warm)}
.modal-body{
  padding:20px 24px;overflow-y:auto;flex:1;
}
.modal-body pre{
  background:var(--dark-surface);color:var(--ivory);
  padding:14px 18px;border-radius:10px;
  font-family:var(--mono);font-size:12.5px;line-height:1.6;
  overflow-x:auto;white-space:pre-wrap;word-break:break-word;
  max-height:50vh;
}
.modal-body h3{
  font-family:var(--serif);font-weight:500;font-size:16px;
  color:var(--near-black);
  margin:18px 0 8px;
}
.modal-body h3:first-child{margin-top:0}
.modal-body .filemeta{
  font-size:11.5px;color:var(--stone-gray);font-family:var(--mono);
  margin-bottom:6px;
}
.skill-list{display:flex;flex-direction:column;gap:14px}
.skill-card{
  border:1px solid var(--border-cream);border-radius:10px;
  padding:12px 14px;background:var(--ivory);
}
.skill-name{
  font-family:var(--mono);font-size:12px;color:var(--terracotta);
  margin-bottom:6px;
}

/* ============ LOG ============ */
.log-pre{
  background:var(--dark-surface);color:var(--ivory);
  padding:16px 20px;border-radius:10px;
  font-family:var(--mono);font-size:12px;line-height:1.55;
  max-height:60vh;overflow-y:auto;white-space:pre-wrap;word-break:break-word;
}
.log-status{
  margin-top:10px;font-size:13px;color:var(--olive-gray);
  display:flex;align-items:center;gap:10px;
}
.log-status.ok{color:var(--ok)}
.log-status.err{color:var(--err)}
.spinner{
  display:inline-block;width:12px;height:12px;
  border:2px solid var(--ring-warm);border-top-color:var(--terracotta);
  border-radius:50%;animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

/* ============ STATUS BANNER ============ */
.banner{
  margin:12px 0 20px;padding:12px 18px;
  background:#fbf6f1;border:1px solid var(--terracotta);
  border-radius:10px;color:var(--charcoal-warm);font-size:13.5px;
}
.banner.warn{background:#faf5e8;border-color:var(--warn);color:#8a6a26}
.banner.err{background:#fdf2f2;border-color:var(--err);color:var(--err)}

/* footer */
footer{
  padding:24px 0 36px;text-align:center;
  font-size:12px;color:var(--stone-gray);font-family:var(--mono);
  letter-spacing:.04em;
}
footer a{color:var(--coral);text-decoration:none}
footer a:hover{text-decoration:underline}

</style>
</head>
<body>

<header>
  <div class="wrap" style="position:relative">
    <div class="header-title">claude-omni · 控制面板</div>
    <div class="header-sub">five tiers, layered styles, surgical patches</div>
    <div class="header-meta" id="meta">
      <span>Claude Desktop: <strong id="meta-cd">检测中...</strong></span>
      <span>当前 tier: <strong id="meta-tier">—</strong></span>
      <span>当前 persona: <strong id="meta-persona">—</strong></span>
    </div>
    <div class="header-actions">
      <button class="btn-refresh" onclick="refresh()">刷新</button>
    </div>
  </div>
</header>

<div class="wrap" id="banners"></div>

<section>
  <div class="wrap">
    <div class="section-h">
      <h2>Jailbreak 强度</h2>
      <span class="section-note">5 档互斥 · 同时只能装一档</span>
    </div>
    <div class="grid grid-tier" id="tiers"></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-h">
      <h2>风格层 (可叠加)</h2>
      <span class="section-note">风格之间互斥 · 跟 5 档独立可叠</span>
    </div>
    <div class="grid grid-narrow" id="personas"></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-h">
      <h2>Claude Desktop UI 补丁</h2>
      <span class="section-note">三个互不冲突 · 跟 jailbreak / 风格独立</span>
    </div>
    <div class="grid grid-narrow" id="desktop"></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-h">
      <h2>工具</h2>
      <span class="section-note">独立运行 · 无依赖</span>
    </div>
    <div class="grid grid-narrow" id="tools"></div>
  </div>
</section>

<footer>
  claude-omni · panel · 端口 5500 · <a href="/readme">panel 文档</a>
</footer>

<!-- Modal -->
<div class="modal-mask" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-h">
      <div class="modal-title" id="modal-title">—</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body" id="modal-body">—</div>
  </div>
</div>

<script>
let STATE = null;
let logTimer = null;

async function refresh(){
  try{
    const r = await fetch('/api/status');
    const s = await r.json();
    STATE = s;
    render(s);
  }catch(e){
    console.error(e);
  }
}

function render(s){
  // header meta
  document.getElementById('meta-cd').textContent =
    s.claude_desktop_found ? (s.claude_app_path || '已找到') : '未找到 (asar 类补丁不可用)';
  document.getElementById('meta-tier').textContent = s.current_tier || '—';
  document.getElementById('meta-persona').textContent = s.current_persona || '—';

  // banner
  const banners = document.getElementById('banners');
  banners.innerHTML = '';
  if(!s.claude_desktop_found){
    const b = document.createElement('div');
    b.className = 'banner warn';
    b.textContent = '没找到 Claude Desktop 安装 (期望路径 C:\\Program Files\\WindowsApps\\Claude_*_x64__pzs8sxrjxfjjc\\)。tier-2 / 3 / 5 与 desktop-* UI 补丁需要 Claude Desktop, 这些卡片会置灰。tier-1 / 2.5 / persona 可正常装。';
    banners.appendChild(b);
  }

  // tiers
  const tiersEl = document.getElementById('tiers');
  tiersEl.innerHTML = '';
  for(const t of s.tiers){
    const needsClaudeDesktop = t.id !== 'tier-1' && t.id !== 'tier-2.5';
    const disabled = needsClaudeDesktop && !s.claude_desktop_found;
    tiersEl.appendChild(makeTierCard(t, s.current_tier, disabled));
  }

  // personas
  const pEl = document.getElementById('personas');
  pEl.innerHTML = '';
  for(const p of s.personas){
    pEl.appendChild(makePersonaCard(p, s.current_persona));
  }

  // desktop UI
  const dEl = document.getElementById('desktop');
  dEl.innerHTML = '';
  for(const d of s.desktop_patches){
    const disabled = !s.claude_desktop_found;
    dEl.appendChild(makeDesktopCard(d, disabled));
  }

  // tools
  const toolsEl = document.getElementById('tools');
  toolsEl.innerHTML = '';
  toolsEl.appendChild(makeSessionBrowserCard(s.session_browser));
}

function el(tag, cls, text){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text !== undefined) e.textContent = text;
  return e;
}

function makeTierCard(t, currentTier, disabled){
  const c = el('div', 'card' + (t.installed ? ' installed' : '') + (disabled ? ' disabled' : ''));
  const h = el('div', 'card-h');
  h.appendChild(el('div', 'card-name', t.name));
  h.appendChild(el('div', 'card-stars', t.stars));
  c.appendChild(h);

  c.appendChild(el('div', 'card-sub', t.subtitle));
  c.appendChild(el('div', 'card-desc', t.desc));
  c.appendChild(el('div', 'card-platform', t.platform));

  if(t.installed){
    const b = el('span', 'badge badge-installed', '已装');
    c.appendChild(b);
  }

  // mode radio (仅 tier-5)
  if(t.has_mode && t.modes){
    const modeBox = el('div');
    modeBox.style.cssText = 'margin:6px 0;padding:8px 10px;border:1px solid var(--border-cream);border-radius:6px;background:#fbf6f1';
    const modeHdr = el('div', null, '当前版本');
    modeHdr.style.cssText = 'font-size:11px;color:var(--stone-gray);font-family:var(--mono);letter-spacing:.04em;margin-bottom:4px';
    modeBox.appendChild(modeHdr);
    for(const m of t.modes){
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;gap:8px;cursor:pointer;padding:4px 0;align-items:flex-start';
      const rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = `mode-${t.id}`;
      rb.value = m.id;
      rb.checked = (STATE && m.id === STATE.tier5_mode);
      rb.style.marginTop = '3px';
      rb.style.accentColor = 'var(--terracotta)';
      rb.addEventListener('change', async () => {
        // 选中带 warn_persona 标记的 mode + 当前装着 persona → 弹窗提醒
        if(m.warn_persona && STATE && STATE.current_persona){
          alert(`⚠ 切到 ${m.id} (自闭天才)\n\n${m.id} 跟 persona-${STATE.current_persona} 有冲突, 不建议同时用.\n两边都在抢"你是怎样的人"的定义.\n\n确定要切就关掉这个弹窗, 之后建议去卸 persona.`);
        }
        try{
          const r = await fetch('/api/tier5-mode', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({mode: m.id}),
          });
          const j = await r.json();
          if(!j.ok){ alert('切换失败: ' + (j.error || '未知')); refresh(); return; }
          const tip = el('div', null, `已切到 ${m.id} · 重启 Claude 后生效`);
          tip.style.cssText = 'font-size:11px;color:var(--terracotta);margin-top:4px';
          modeBox.appendChild(tip);
          setTimeout(() => { if(tip.parentElement) tip.remove(); }, 4000);
        }catch(e){
          alert('请求失败: ' + e.message);
        }
      });
      lbl.appendChild(rb);
      const txt = el('div');
      txt.innerHTML = `<div style="font-size:12.5px;color:var(--charcoal-warm);font-weight:500">${m.label}</div><div style="color:var(--stone-gray);font-size:11px;line-height:1.4">${m.desc}</div>`;
      lbl.appendChild(txt);
      modeBox.appendChild(lbl);

      if(m.id === 'v4'){
        const agentRow = el('div');
        agentRow.style.cssText = 'margin:2px 0 2px 24px;display:flex;align-items:center;gap:8px';
        const note = el('span', null, 'v4 的六顾问/三严审依赖');
        note.style.cssText = 'font-size:10.5px;color:var(--stone-gray)';
        let installed = !!(STATE && STATE.agents_installed);
        const render = () => {
          agentRow.innerHTML = '';
          if(installed){
            const tag = el('span', null, '✓ agent 已安装');
            tag.style.cssText = 'font-size:11px;padding:3px 10px;border-radius:5px;border:1px solid var(--border-cream);background:#f0ece6;color:var(--stone-gray)';
            const un = document.createElement('button');
            un.textContent = '卸载';
            un.style.cssText = 'font-size:11px;padding:3px 10px;border-radius:5px;border:1px solid var(--stone-gray);background:transparent;color:var(--stone-gray);cursor:pointer';
            un.addEventListener('click', async () => {
              un.disabled = true; un.textContent = '卸载中...';
              try{
                const r = await fetch('/api/uninstall-agents', { method: 'POST' });
                const j = await r.json();
                if(!j.ok){ alert('卸载失败: ' + (j.error || '未知')); un.disabled = false; un.textContent = '卸载'; return; }
                installed = false; render();
              }catch(e){ alert('请求失败: ' + e.message); un.disabled = false; un.textContent = '卸载'; }
            });
            agentRow.appendChild(tag); agentRow.appendChild(un); agentRow.appendChild(note);
          } else {
            const ab = document.createElement('button');
            ab.textContent = '安装 agent';
            ab.style.cssText = 'font-size:11px;padding:3px 10px;border-radius:5px;border:1px solid var(--terracotta);background:var(--terracotta);color:#fff;cursor:pointer';
            ab.addEventListener('click', async () => {
              ab.disabled = true; ab.textContent = '安装中...';
              try{
                const r = await fetch('/api/install-agents', { method: 'POST' });
                const j = await r.json();
                if(!j.ok){ alert('安装失败: ' + (j.error || '未知')); ab.disabled = false; ab.textContent = '安装 agent'; return; }
                installed = true; render();
              }catch(e){ alert('请求失败: ' + e.message); ab.disabled = false; ab.textContent = '安装 agent'; }
            });
            agentRow.appendChild(ab); agentRow.appendChild(note);
          }
        };
        render();
        modeBox.appendChild(agentRow);
      }
    }
    c.appendChild(modeBox);
  }

  const actions = el('div', 'card-actions');
  if(t.installed){
    actions.appendChild(makeBtn('卸载', 'btn-danger', () => runAction(t.id, 'uninstall', t.name)));
  }else{
    const otherInstalled = currentTier && currentTier !== t.name;
    const btn = makeBtn('安装', 'btn-primary',
      () => runAction(t.id, 'install', t.name));
    if(disabled || otherInstalled) btn.disabled = true;
    if(otherInstalled){
      btn.title = `当前装着 ${currentTier}, 先卸载它再装本档`;
    }
    actions.appendChild(btn);
  }
  if(t.has_emergency){
    actions.appendChild(makeBtn('紧急还原', 'btn-ghost', () => {
      if(confirm('emergency-restore 会从 _backup/ 字节级还原 asar / exe / unpacked。继续?')){
        runAction(t.id, 'emergency', t.name);
      }
    }));
  }
  actions.appendChild(makeBtn('详情', 'btn-ghost', () => showPreview(t.id, t.name)));
  c.appendChild(actions);
  return c;
}

function makePersonaCard(p, currentPersona){
  const c = el('div', 'card' + (p.installed ? ' installed' : ''));
  const h = el('div', 'card-h');
  h.appendChild(el('div', 'card-name', p.name));
  c.appendChild(h);
  c.appendChild(el('div', 'card-sub', p.subtitle));
  c.appendChild(el('div', 'card-desc', p.desc));
  if(p.installed){
    c.appendChild(el('span', 'badge badge-installed', '已装'));
  }
  const actions = el('div', 'card-actions');
  if(p.installed){
    actions.appendChild(makeBtn('卸载', 'btn-danger', () => runAction(p.id, 'uninstall', p.name)));
  }else{
    const otherInstalled = currentPersona && currentPersona !== p.name;
    const btn = makeBtn('安装', 'btn-primary',
      () => runAction(p.id, 'install', p.name));
    if(otherInstalled){
      btn.disabled = true;
      btn.title = `当前装着 persona-${currentPersona}, 先卸载它`;
    }
    actions.appendChild(btn);
  }
  actions.appendChild(makeBtn('详情', 'btn-ghost', () => showPreview(p.id, p.name)));
  c.appendChild(actions);
  return c;
}

function makeDesktopCard(d, disabled){
  const c = el('div', 'card' + (d.installed ? ' installed' : '') + (disabled ? ' disabled' : ''));
  const h = el('div', 'card-h');
  h.appendChild(el('div', 'card-name', d.name));
  c.appendChild(h);
  c.appendChild(el('div', 'card-sub', d.subtitle));
  c.appendChild(el('div', 'card-desc', d.desc));
  if(d.installed){
    c.appendChild(el('span', 'badge badge-installed', '已装'));
  }
  const actions = el('div', 'card-actions');
  if(d.installed){
    actions.appendChild(makeBtn('卸载', 'btn-danger', () => runAction(d.id, 'uninstall', d.name)));
  }else{
    const btn = makeBtn('安装', 'btn-primary',
      () => runAction(d.id, 'install', d.name));
    if(disabled) btn.disabled = true;
    actions.appendChild(btn);
  }
  if(d.has_emergency){
    actions.appendChild(makeBtn('紧急还原', 'btn-ghost', () => {
      if(confirm('emergency-restore 会从 _backup/ 字节级还原 asar / claude.exe。同时装着的其他 desktop-* 补丁会一起被擦掉,慎用。继续?')){
        runAction(d.id, 'emergency', d.name);
      }
    }));
  }
  c.appendChild(actions);
  return c;
}

function makeSessionBrowserCard(sb){
  const c = el('div', 'card' + (sb.running ? ' installed' : ''));
  const h = el('div', 'card-h');
  h.appendChild(el('div', 'card-name', 'session-browser'));
  c.appendChild(h);
  c.appendChild(el('div', 'card-sub', 'Claude Code 历史会话浏览器'));
  c.appendChild(el('div', 'card-desc', `Flask 工具, 端口 ${sb.port} · 浏览 / 编辑 / 删除 / 备份恢复 ~/.claude/projects/ 下的 session jsonl`));
  if(sb.running){
    const b = el('span', 'badge badge-running', '运行中');
    c.appendChild(b);
  }
  const actions = el('div', 'card-actions');
  if(sb.running){
    actions.appendChild(makeBtn('打开', 'btn-primary', () => window.open(sb.url, '_blank')));
    actions.appendChild(makeBtn('停止', 'btn-danger', async () => {
      const r = await fetch('/api/session-browser/stop', {method:'POST'});
      const j = await r.json();
      alert(j.message);
      refresh();
    }));
  }else{
    actions.appendChild(makeBtn('启动', 'btn-primary', async () => {
      const r = await fetch('/api/session-browser/start', {method:'POST'});
      const j = await r.json();
      if(j.ok){
        setTimeout(refresh, 800);
      }else{
        alert('启动失败: ' + j.message);
      }
    }));
  }
  c.appendChild(actions);
  return c;
}

function makeBtn(label, cls, onclick){
  const b = el('button', 'btn ' + (cls || ''), label);
  b.addEventListener('click', onclick);
  return b;
}

// ====== Modal: preview ======
async function showPreview(id, name){
  document.getElementById('modal-title').textContent = name + ' · 内容预览';
  const body = document.getElementById('modal-body');
  body.innerHTML = '加载中...';
  document.getElementById('modal').classList.add('show');
  try{
    const r = await fetch('/api/preview/' + encodeURIComponent(id));
    const data = await r.json();
    body.innerHTML = '';
    for(const f of (data.files || [])){
      const h = el('h3', null, f.name);
      const meta = el('div', 'filemeta', f.size + ' chars · 当前目录 / 安装时复制源');
      const pre = el('pre');
      pre.textContent = f.content;
      body.appendChild(h);
      body.appendChild(meta);
      body.appendChild(pre);
    }
    if(data.skills && data.skills.length){
      body.appendChild(el('h3', null, '4 个 skill 文件'));
      const list = el('div', 'skill-list');
      for(const s of data.skills){
        const card = el('div', 'skill-card');
        card.appendChild(el('div', 'skill-name', s.name + '/SKILL.md'));
        const pre = el('pre');
        pre.style.maxHeight = '180px';
        pre.textContent = s.content;
        card.appendChild(pre);
        list.appendChild(card);
      }
      body.appendChild(list);
    }
    if(!body.children.length){
      body.textContent = '(没有可预览的文件)';
    }
  }catch(e){
    body.textContent = '加载失败: ' + e;
  }
}

// ====== Modal: action log ======
async function runAction(id, action, name){
  document.getElementById('modal-title').textContent = `${name} · ${action}`;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  const status = el('div', 'log-status');
  status.appendChild(el('span', 'spinner'));
  status.appendChild(el('span', null, '启动任务...'));
  const pre = el('pre', 'log-pre', '');
  body.appendChild(pre);
  body.appendChild(status);
  document.getElementById('modal').classList.add('show');

  let r;
  try{
    r = await fetch('/api/action', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({component:id, action})
    });
  }catch(e){
    status.className = 'log-status err';
    status.textContent = '请求失败: ' + e;
    return;
  }
  if(!r.ok){
    const txt = await r.text();
    status.className = 'log-status err';
    status.textContent = `启动失败: ${txt}`;
    return;
  }
  const j = await r.json();
  pollLog(j.task_id, pre, status);
}

function pollLog(taskId, pre, status){
  let since = 0;
  if(logTimer) clearInterval(logTimer);
  const tick = async () => {
    try{
      const r = await fetch('/api/log/' + taskId + '?since=' + since);
      const data = await r.json();
      if(data.lines && data.lines.length){
        for(const ln of data.lines){
          pre.textContent += ln + '\n';
        }
        since = data.total;
        pre.scrollTop = pre.scrollHeight;
      }
      if(data.done){
        clearInterval(logTimer);
        logTimer = null;
        const ok = data.exit_code === 0;
        status.className = 'log-status ' + (ok ? 'ok' : 'err');
        status.textContent = ok
          ? `✓ 完成 (exit code ${data.exit_code})`
          : `✗ 失败 (exit code ${data.exit_code})`;
        // 给个刷新按钮
        const btn = el('button', 'btn btn-ghost', '关闭并刷新状态');
        btn.style.marginLeft = '10px';
        btn.addEventListener('click', () => {
          closeModal();
          refresh();
        });
        status.appendChild(btn);
      }
    }catch(e){
      console.error(e);
    }
  };
  logTimer = setInterval(tick, 500);
  tick();
}

function closeModal(){
  document.getElementById('modal').classList.remove('show');
  if(logTimer){clearInterval(logTimer); logTimer = null;}
}
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeModal();
});

// 初次加载
refresh();
// 自动刷新状态 (轻量)
setInterval(() => {
  if(!document.getElementById('modal').classList.contains('show')){
    refresh();
  }
}, 8000);
</script>
</body>
</html>
"""


README_HTML = r"""<!doctype html>
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
.raw{
  background:var(--ivory);padding:18px;border-radius:10px;
  font-family:var(--mono);font-size:12.5px;line-height:1.6;
  white-space:pre-wrap;word-break:break-word;
  border:1px solid var(--border-cream);
}
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <span>panel 文档 · 渲染自 panel/README.md</span>
    <a href="/">← 回到控制面板</a>
  </div>
  {{BODY}}
</div>
</body>
</html>
"""


# ============================================================
# 启动
# ============================================================

def main():
    print("=" * 60)
    print("claude-omni · panel")
    print("=" * 60)
    print()

    port = find_bindable_port()
    if port is None:
        print(f"候选端口全部不可用 (被占用或被系统保留): {PORT_CANDIDATES}")
        print("编辑 panel.py 顶部的 PORT_CANDIDATES 加个新端口号再试。")
        print("查系统保留了哪些端口: netsh interface ipv4 show excludedportrange protocol=tcp")
        print()
        input("按回车退出...")
        sys.exit(1)

    print(f"Listening on http://{HOST}:{port}")
    if port != PORT:
        print(f"(首选端口 {PORT} 不可用, 自动切到 {port})")
    print()
    print("浏览器没自动打开就手动访问上面那个地址。Ctrl+C 关闭。")
    print()
    threading.Thread(
        target=lambda: (time.sleep(0.6),
                        webbrowser.open(f"http://{HOST}:{port}")),
        daemon=True,
    ).start()
    app.run(host=HOST, port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
