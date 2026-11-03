@echo off
cd /d "%~dp0"
title Geovisor Omasuyos - CELULARES (red Wi-Fi)
echo Cerrando el geovisor que quedo abierto (puerto 5000)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /PID %%p /F
timeout /t 2 /nobreak >nul
".venv\Scripts\python.exe" iniciar_red_local.py
pause
