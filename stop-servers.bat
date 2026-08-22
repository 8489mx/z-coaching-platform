@echo off
echo Stopping Frontend Server on port 5173...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5173') DO (
  taskkill /F /PID %%T
)

echo Stopping Backend Server on port 3000 (Change if different)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3000') DO (
  taskkill /F /PID %%T
)

echo All servers stopped!
pause
