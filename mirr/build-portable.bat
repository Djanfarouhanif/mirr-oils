@echo off
chcp 65001 >nul
title Construction du dossier portable Mirr Oils
cd /d "%~dp0"

rem ============================================================
rem  Construit le dossier "MirrOils-Portable" pret a donner au
rem  boutiquier (copie node.exe + tous les fichiers de l'app).
rem  A LANCER PAR VOUS (le developpeur), pas par le boutiquier.
rem ============================================================

set "OUT=%~dp0..\MirrOils-Portable"

echo Nettoyage de l'ancien dossier...
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
mkdir "%OUT%\node"

echo Copie de node.exe (portable)...
rem Trouve l'emplacement de node.exe automatiquement
for /f "delims=" %%i in ('where node 2^>nul') do (
  copy /y "%%i" "%OUT%\node\node.exe" >nul
  goto :nodecopied
)
echo [ERREUR] node.exe introuvable. Installez Node.js d'abord.
pause
exit /b 1
:nodecopied

echo Copie des fichiers de l'application...
copy /y "%~dp0index.html"      "%OUT%\" >nul
copy /y "%~dp0script.js"       "%OUT%\" >nul
copy /y "%~dp0style.css"       "%OUT%\" >nul
copy /y "%~dp0data.js"         "%OUT%\" >nul
copy /y "%~dp0storage.js"      "%OUT%\" >nul
copy /y "%~dp0server.js"       "%OUT%\" >nul
copy /y "%~dp0data.json"       "%OUT%\" >nul
copy /y "%~dp0package.json"    "%OUT%\" >nul
copy /y "%~dp0logo.png"        "%OUT%\" >nul 2>nul
copy /y "%~dp0simple-logo.png" "%OUT%\" >nul 2>nul
copy /y "%~dp0Lancer.bat"      "%OUT%\" >nul
copy /y "%~dp0LISEZ-MOI.txt"   "%OUT%\" >nul
copy /y "%~dp0icon.ico"        "%OUT%\" >nul 2>nul
copy /y "%~dp0Creer-un-raccourci-bureau.bat" "%OUT%\" >nul

echo.
echo ============================================
echo   TERMINE !
echo   Dossier cree : %OUT%
echo.
echo   Donnez ce dossier complet au boutiquier
echo   (cle USB ou .zip). Il double-clique sur
echo   Lancer.bat - rien a installer.
echo ============================================
echo.
pause
