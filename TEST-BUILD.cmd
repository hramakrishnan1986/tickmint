@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\next\package.json call npm.cmd ci
call npm.cmd run check
if errorlevel 1 pause & exit /b 1
call npm.cmd run build
pause
