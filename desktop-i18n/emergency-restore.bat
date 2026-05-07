@echo off
title claude-omni · desktop-i18n · EMERGENCY RESTORE
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python emergency-restore.py
