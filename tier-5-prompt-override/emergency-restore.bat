@echo off
title claude-omni · tier-5 · EMERGENCY RESTORE
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python emergency-restore.py
