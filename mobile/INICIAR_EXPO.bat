@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "EXPO_FLAGS=--lan --clear --port 8081"
if /i "%~1"=="tunnel" set "EXPO_FLAGS=--tunnel ngrok --clear --port 8082"
if exist ".tools\node\node.exe" goto portatil
where npm >nul 2>&1
if errorlevel 1 (
 echo Instale Node.js LTS em https://nodejs.org/ e tente novamente.
 pause
 exit /b 1
)
if exist "node_modules\.package-lock.json" goto sistema
call npm ci --no-audit --no-fund
if errorlevel 1 goto erro
:sistema
call npx expo start --go %EXPO_FLAGS%
goto fim
:portatil
set "PATH=%CD%\.tools\node;%PATH%"
if exist "node_modules\.package-lock.json" goto iniciar_portatil
".tools\node\node.exe" ".tools\node\node_modules\npm\bin\npm-cli.js" ci --no-audit --no-fund
if errorlevel 1 goto erro
:iniciar_portatil
echo Deixe INICIAR_API_MOBILE.bat aberto.
echo Feche o projeto antigo no Expo Go e leia este NOVO QR Code.
".tools\node\node.exe" "node_modules\expo\bin\cli" start --go %EXPO_FLAGS%
goto fim
:erro
echo Confira a mensagem de erro acima.
:fim
pause
