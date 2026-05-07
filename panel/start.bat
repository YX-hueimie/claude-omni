@echo off
title claude-omni · panel
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python panel.py
