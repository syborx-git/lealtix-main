@echo off
title Lealtix MAIN - http://localhost:4200
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo =====================================================
echo  LEALTIX MAIN - http://localhost:4200
echo  Compilando componentes Angular...
echo =====================================================
echo.
call npm start
