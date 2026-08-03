@echo off
cd /d %~dp0
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)
echo Starting TickMint Milestone 3A...
call npm run dev
exit /b
:error
echo.
echo Installation failed. Please review the error above.
pause
