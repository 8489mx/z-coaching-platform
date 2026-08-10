@echo off
echo Starting Frontend (Vite) on port 5173...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Starting Backend...
:: If you have a specific backend start command, replace the next line.
start "Backend Server" cmd /k "node src/api/server.js"

echo Servers started in new windows.
