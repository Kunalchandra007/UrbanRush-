@echo off
REM QuickCart AI - Quick Server Launcher
REM This script starts both backend and frontend servers

echo ====================================
echo QuickCart AI - Starting Servers
echo ====================================
echo.

REM Check if .env file has been configured
findstr /C:"your_aws_access_key_here" backend\.env > nul
if %errorlevel%==0 (
    echo [WARNING] AWS credentials not configured!
    echo.
    echo Please edit backend\.env and add your:
    echo   - AWS_ACCESS_KEY_ID
    echo   - AWS_SECRET_ACCESS_KEY
    echo.
    echo Press any key to continue anyway, or Ctrl+C to exit...
    pause > nul
)

echo [1/2] Starting Backend Server...
start "QuickCart Backend" cmd /k "cd backend && .\venv\Scripts\Activate.ps1 && uvicorn main:app --reload --port 8000"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "QuickCart Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo Servers Starting!
echo ====================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this launcher...
pause > nul
