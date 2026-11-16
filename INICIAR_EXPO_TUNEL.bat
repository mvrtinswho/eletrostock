@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo CONEXAO ALTERNATIVA EXPO GO
echo Mantenha a API aberta e o celular na mesma rede do computador.
echo Apos aparecer Tunnel ready, leia o novo QR Code no Expo Go.
echo No aplicativo, use o endereco da API exibido em INICIAR_API_MOBILE.bat.
call mobile\INICIAR_EXPO.bat tunnel
