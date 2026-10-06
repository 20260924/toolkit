@echo off
rem Double-click to build toolkit, start it in the background and open it in the browser.
rem toolkit-stop.cmd (or "toolkit.cmd stop") stops it.
title toolkit
cd /d "%~dp0"
set task=launch
if /i "%~1"=="stop" set task=stop
rem A double-clicked window skips the shell profile, so activate fnm when pnpm is not on PATH.
where pnpm >NUL 2>NUL || call :use_fnm || goto :fail
set TURBO_UI=false
call pnpm %task% || goto :fail
exit /b 0

:use_fnm
where fnm >NUL 2>NUL || (echo pnpm not found. Install Node 24 and enable corepack. & exit /b 1)
for /f "tokens=*" %%z in ('fnm env --shell cmd') do call %%z
fnm use --silent-if-unchanged
exit /b

:fail
pause
exit /b 1
