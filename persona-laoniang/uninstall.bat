@echo off
title claude-omni · persona-laoniang · uninstall
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python uninstall.py
