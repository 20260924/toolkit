@echo off
rem Double-click to build and start toolkit, then open it in the browser.
rem Closing this window stops the server.
title toolkit
cd /d "%~dp0"
rem A double-clicked window skips the shell profile, so activate fnm when pnpm is not on PATH.
where pnpm >nul 2>nul || call :use_fnm || goto :fail
set TURBO_UI=false
call pnpm start || goto :fail
exit /b 0

:use_fnm
where fnm >nul 2>nul || (echo pnpm not found. Install Node 24 and enable corepack. & exit /b 1)
for /f "tokens=*" %%z in ('fnm env --shell cmd') do call %%z
fnm use --silent-if-unchanged
exit /b

:fail
pause
exit /b 1
