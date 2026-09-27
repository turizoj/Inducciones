@echo off
title SIGEIN
rem Enciende MySQL, el backend y el frontend de SIGEIN. Uso: doble clic sobre este archivo.

rem 1. MySQL (si no está encendido)
tasklist /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" >nul
if errorlevel 1 (
    echo Encendiendo MySQL...
    start "" /min "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="%USERPROFILE%\mysql\my.ini"
    timeout /t 5 /nobreak >nul
) else (
    echo MySQL ya estaba encendido.
)

rem 2. Backend (API) en http://localhost:4000
echo Encendiendo el backend...
start "SIGEIN - Backend (no cerrar)" /d "%~dp0sigein-backend" cmd /k npm.cmd run dev

rem 3. Frontend en http://localhost:5173
echo Encendiendo el frontend...
start "SIGEIN - Frontend (no cerrar)" /d "%~dp0sigein-frontend" cmd /k npm.cmd run dev

rem 4. Esperar a que la web responda y abrir el navegador
echo Esperando a que la web este lista...
:esperar
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:5173 || goto esperar
start "" http://localhost:5173

echo.
echo Listo. Para apagar SIGEIN cierre las ventanas "Backend" y "Frontend".
timeout /t 5 >nul
