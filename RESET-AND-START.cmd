@echo off
setlocal
cd /d "%~dp0"
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
call npm.cmd cache verify
call npm.cmd ci
if errorlevel 1 pause & exit /b 1
start "" http://localhost:3000
call npm.cmd run dev
pause
