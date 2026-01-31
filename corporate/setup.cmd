@echo off
setlocal

set APP_DIR=%~dp0
cd /d "%APP_DIR%"

where node >nul 2>&1
if errorlevel 1 (
  echo Error: Node.js is not installed (node not found in PATH).
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Error: npm is not installed (npm not found in PATH).
  exit /b 1
)

if not exist "package.json" (
  echo Error: package.json not found in %APP_DIR%
  exit /b 1
)

if not exist ".env.local" if exist ".env.example" (
  copy ".env.example" ".env.local" >nul
  echo Created corporate\.env.local from .env.example (fill DATABASE_URL).
)

if exist "package-lock.json" (
  npm ci
) else (
  npm install
)

echo Setup complete.
endlocal

