@echo off
chcp 65001 >nul
title Creer un raccourci Mirr Oils sur le Bureau
cd /d "%~dp0"

rem ============================================================
rem  A lancer UNE SEULE FOIS par le boutiquier.
rem  Cree une icone "Mirr Oils" sur le Bureau qui lance l'app.
rem ============================================================

set "CIBLE=%~dp0Lancer.bat"
set "ICONE=%~dp0icon.ico"
set "DOSSIER=%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$lnk = $ws.CreateShortcut([System.IO.Path]::Combine($ws.SpecialFolders('Desktop'),'Mirr Oils.lnk'));" ^
  "$lnk.TargetPath = '%CIBLE%';" ^
  "$lnk.WorkingDirectory = '%DOSSIER%';" ^
  "if (Test-Path '%ICONE%') { $lnk.IconLocation = '%ICONE%' };" ^
  "$lnk.Description = 'Lancer l''application Mirr Oils';" ^
  "$lnk.Save()"

echo.
echo ============================================
echo   C'est fait !
echo   Une icone "Mirr Oils" est sur votre Bureau.
echo   Double-cliquez dessus pour lancer l'application.
echo ============================================
echo.
pause
