@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" goto preparar
py -3 --version >nul 2>&1
if not errorlevel 1 (
 py -3 -m venv .venv
) else (
 python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" goto erro
:preparar
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto erro
".venv\Scripts\python.exe" manage.py preparar
if errorlevel 1 goto erro
".venv\Scripts\python.exe" manage.py iniciar_mobile
if errorlevel 1 goto erro
exit /b 0
:erro
echo.
echo Nao foi possivel iniciar. Confira o erro acima.
pause
exit /b 1
