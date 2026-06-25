@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"

start "ResumeBuilder Server" cmd /k "cd /d ""%ROOT%server"" && npm.cmd run dev"

timeout /t 3 /nobreak >nul

start "ResumeBuilder Client" cmd /k "cd /d ""%ROOT%client"" && npm.cmd run dev"

timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

endlocal