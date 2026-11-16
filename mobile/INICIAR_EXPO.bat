@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where npm >nul 2>&1
if not errorlevel 1 goto sistema
if exist ".tools\node\node.exe" goto portatil
echo Instale o Node.js LTS em https://nodejs.org/ e abra este arquivo novamente.
pause
exit /b 1
:sistema
if exist "node_modules\.package-lock.json" goto iniciar_sistema
call npm ci --no-audit --no-fund
if errorlevel 1 goto erro
:iniciar_sistema
echo Abra o Expo Go no celular e leia o QR Code abaixo.
echo A API Django deve estar aberta em INICIAR_API_MOBILE.bat.
call npm start
goto fim
:portatil
set "PATH=%CD%\.tools\node;%PATH%"
if exist "node_modules\.package-lock.json" goto iniciar_portatil
".tools\node\node.exe" ".tools\node\node_modules\npm\bin\npm-cli.js" ci --no-audit --no-fund
if errorlevel 1 goto erro
:iniciar_portatil
echo Abra o Expo Go no celular e leia o QR Code abaixo.
echo A API Django deve estar aberta em INICIAR_API_MOBILE.bat.
".tools\node\node.exe" "node_modules\expo\bin\cli" start --go --lan
goto fim
:erro
echo Confira a mensagem de erro acima.
:fim
pause
