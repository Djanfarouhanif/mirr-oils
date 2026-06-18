@echo off
chcp 65001 >nul
title Mirr Oils - Gestion boutique
cd /d "%~dp0"

rem ============================================================
rem  Lanceur Mirr Oils (portable - aucune installation requise)
rem  Cherche un node.exe inclus dans le dossier "node\",
rem  sinon utilise le Node installe sur le PC s'il existe.
rem ============================================================

set "NODE_EXE=%~dp0node\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

rem --- Premier lancement : cree le raccourci sur le Bureau (une seule fois) ---
if not exist "%~dp0.raccourci-cree" (
  echo Premier lancement : creation du raccourci "Mirr Oils" sur le Bureau...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$lnk = $ws.CreateShortcut([System.IO.Path]::Combine($ws.SpecialFolders('Desktop'),'Mirr Oils.lnk'));" ^
    "$lnk.TargetPath = '%~dp0Lancer.bat';" ^
    "$lnk.WorkingDirectory = '%~dp0';" ^
    "if (Test-Path '%~dp0icon.ico') { $lnk.IconLocation = '%~dp0icon.ico' };" ^
    "$lnk.Description = 'Lancer l''application Mirr Oils';" ^
    "$lnk.Save()"
  echo terminé > "%~dp0.raccourci-cree"
  echo Raccourci cree. La prochaine fois, lancez l'app depuis l'icone du Bureau.
  echo.
)

echo ============================================
echo   Mirr Oils demarre...
echo.
echo   Le navigateur va s'ouvrir tout seul sur
echo   http://localhost:3000
echo.
echo   /!\ NE FERMEZ PAS cette fenetre noire
echo       tant que vous utilisez l'application.
echo       (Fermez-la a la fin de la journee.)
echo ============================================
echo.

rem Ouvre le navigateur apres 2 secondes (le temps que le serveur demarre)
start "" /b cmd /c "timeout /t 2 >nul & start http://localhost:3000"

"%NODE_EXE%" server.js

echo.
echo Le serveur s'est arrete.
echo Appuyez sur une touche pour fermer cette fenetre.
pause >nul
