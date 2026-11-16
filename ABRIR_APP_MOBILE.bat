@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 1. Abra INICIAR_API_MOBILE.bat e mantenha a janela aberta.
echo 2. Esta janela vai abrir o Expo.
echo 3. Leia o QR Code usando o Expo Go no celular.
echo 4. Entre com o mesmo usuario e senha do EletroStock.
echo.
call mobile\INICIAR_EXPO.bat
