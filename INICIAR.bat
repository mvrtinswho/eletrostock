@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if not exist "manage.py" (
 echo ERRO: extraia todos os arquivos do ZIP antes de iniciar.
 pause
 exit /b 1
)
if exist ".venv\Scripts\python.exe" goto preparar
py -3 --version >nul 2>&1
if not errorlevel 1 (
 py -3 -m venv .venv
) else (
 python --version >nul 2>&1
 if errorlevel 1 (
  echo Python nao encontrado. Instale Python 3.12 ou superior e marque Add python.exe to PATH.
  echo Feche esta janela e tente novamente apos instalar.
  pause
  exit /b 1
 )
 python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" goto erro
:preparar
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto erro
".venv\Scripts\python.exe" manage.py preparar
if errorlevel 1 goto erro
echo.
echo Para carregar materiais ficticios, execute DADOS_EXEMPLO.bat depois.
echo Acesse http://127.0.0.1:8000
echo Painel Admin: http://127.0.0.1:8000/admin/
echo Para parar o servidor: Ctrl+C.
".venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
if errorlevel 1 goto erro
exit /b 0
:erro
echo.
echo Nao foi possivel iniciar. Confira a mensagem de erro acima.
pause
exit /b 1
