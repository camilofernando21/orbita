@echo off
chcp 65001 >nul
title Orbita
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto semnode

echo Versao do Node instalada:
node -v
echo.

if exist node_modules goto rodar
echo Instalando as dependencias. Isso acontece so na primeira vez e leva 1 a 2 minutos...
call npm install
if errorlevel 1 goto erro

:rodar
echo.
echo Abrindo a Orbita no navegador. Para parar o site, feche esta janela.
echo.
call npm run dev -- --open
goto fim

:semnode
echo.
echo O Node.js nao esta instalado neste computador.
echo Baixe a versao LTS em https://nodejs.org, instale e rode este arquivo de novo.
echo.
pause
goto fim

:erro
echo.
echo Deu erro na instalacao das dependencias. Veja a mensagem acima.
pause

:fim
