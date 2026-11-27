@echo off
chcp 65001 >nul
title Tecendo Vozes
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\toggle-server.ps1"
if errorlevel 1 (
  if not "%TECENDO_VOZES_NO_PAUSE%"=="1" pause
  exit /b 1
)
exit /b 0
