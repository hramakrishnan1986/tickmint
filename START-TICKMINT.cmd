@echo off
setlocal
cd /d "%~dp0"
echo.
echo =========================================
echo TickMint V1 - All Milestones
 echo =========================================
echo.
where node >nul 2>nul || (
  echo Node.js is not installed or not in PATH.
  echo Install the current Node.js LTS, restart VS Code, then run this file again.
  pause
  exit /b 1
)
echo Node version:
node -v
echo npm version:
call npm.cmd -v
if not exist node_modules\next\package.json (
  echo.
  echo Installing verified dependencies with npm ci...
  call npm.cmd ci
  if errorlevel 1 (
    echo.
    echo Installation failed. Run this file again from a normal Command Prompt,
    echo or delete node_modules and run: npm.cmd ci
    pause
    exit /b 1
  )
)
echo.
echo Starting TickMint at http://localhost:3000
echo Keep this window open while testing.
start "" http://localhost:3000
call npm.cmd run dev
pause
