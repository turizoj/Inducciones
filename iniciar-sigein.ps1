# Enciende MySQL, el backend y el frontend de SIGEIN.
# Uso: clic derecho sobre este archivo > "Ejecutar con PowerShell"

$raiz = $PSScriptRoot

# 1. MySQL (si no está encendido)
if (-not (Get-Process mysqld -ErrorAction SilentlyContinue)) {
    Write-Host "Encendiendo MySQL..." -ForegroundColor Cyan
    Start-Process "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" `
        -ArgumentList "--defaults-file=`"$env:USERPROFILE\mysql\my.ini`"" -WindowStyle Hidden
    Start-Sleep -Seconds 5
} else {
    Write-Host "MySQL ya estaba encendido." -ForegroundColor Green
}

# 2. Backend (API) en http://localhost:4000
Write-Host "Encendiendo el backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$raiz\sigein-backend'; npm.cmd run dev"

# 3. Frontend en http://localhost:5173
Write-Host "Encendiendo el frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$raiz\sigein-frontend'; npm.cmd run dev"

Start-Sleep -Seconds 6
Start-Process "http://localhost:5173"
Write-Host "Listo. Para apagar, cierre las ventanas del backend y del frontend." -ForegroundColor Green

