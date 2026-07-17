$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\\backend'; & .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
Set-Location "$root\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
