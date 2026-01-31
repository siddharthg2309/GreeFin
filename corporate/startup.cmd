@echo off
setlocal

set APP_DIR=%~dp0
call "%APP_DIR%setup.cmd"
if errorlevel 1 exit /b 1

cd /d "%APP_DIR%"

if "%PORT%"=="" set PORT=3002
npm run dev -- -p %PORT%

endlocal

