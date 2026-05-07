@echo off
title claude-omni · session-browser
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python session_browser.py
