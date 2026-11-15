@echo off
cd /d "%~dp0"
title Geovisor Omasuyos - GENERAR VISOR DE CAMPO
echo Generando el visor de campo (un solo archivo, sin servidor ni internet)...
if exist ".venv\Scripts\python.exe" (".venv\Scripts\python.exe" generar_visor_campo.py) else (python generar_visor_campo.py)
echo.
echo El archivo quedo en la carpeta CAMPO.
pause
