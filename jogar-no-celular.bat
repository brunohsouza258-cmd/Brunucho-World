@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  python servidor.py
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    py servidor.py
  ) else (
    echo Nao achei o Python neste computador. Instale em https://www.python.org/downloads/ e tente de novo.
  )
)
pause
