@echo off
title claude-omni · tier-1 · install
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python install.py
