@echo off
cd /d "%~dp0"
title Geovisor Omasuyos - CON POSTGRESQL
echo ============================================================
echo   GEOVISOR OMASUYOS - MODO CON BASE DE DATOS (PostgreSQL)
echo ============================================================
echo.
echo Requisito: la PC del companero encendida, con PostgreSQL y Tailscale activos.
echo.
echo Cerrando el geovisor sin conexion que esta en el puerto 5000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
timeout /t 2 /nobreak >nul
call "%~dp0INICIAR_GEOVISOR_BRAYAN.bat"
