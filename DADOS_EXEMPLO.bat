@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
 echo Execute INICIAR.bat primeiro para preparar o projeto.
 pause
 exit /b 1
)
".venv\Scripts\python.exe" manage.py migrate
if errorlevel 1 goto fim
".venv\Scripts\python.exe" manage.py dados_exemplo
:fim
pause
