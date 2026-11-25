@echo off
chcp 65001 >nul
title Publicar a Orbita no GitHub
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 goto semgit

if not exist .git git init
git config user.name >nul 2>nul || git config user.name "Camilo Fernando Bomfim"
git config user.email >nul 2>nul || git config user.email "camilofernando21@users.noreply.github.com"

echo Preparando os arquivos...
git add .
git commit -m "Órbita: projeto da avaliação bimestral"
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/camilofernando21/orbita.git

echo.
echo Enviando para o GitHub. Se abrir uma janela pedindo login, entre na sua conta e autorize.
echo.
git push -u origin main
if errorlevel 1 goto erro

echo.
echo Pronto! O projeto esta em https://github.com/camilofernando21/orbita
echo.
pause
goto fim

:semgit
echo.
echo O Git nao esta instalado neste computador.
echo Baixe em https://git-scm.com/download/win, instale com as opcoes padrao e rode este arquivo de novo.
echo.
pause
goto fim

:erro
echo.
echo Deu erro no envio. Veja a mensagem acima e me mande uma foto dela.
pause

:fim
