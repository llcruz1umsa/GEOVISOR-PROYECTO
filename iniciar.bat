@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
 echo No se encontro el entorno virtual en esta carpeta.
 echo Extrae este paquete dentro de C:\Users\CRUZ\GeovisorOmasuyos
 pause
 exit /b 1
)
".venv\Scripts\python.exe" servidor.py
pause
