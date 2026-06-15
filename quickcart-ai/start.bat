@echo off
REM QuickCart AI - Startup Script (Windows)

echo ====================================
echo QuickCart AI - Starting Application
echo ====================================
echo.

REM Check if backend directory exists
if not exist "backend\" (
    echo ERROR: backend directory not found!
    echo Please run this script from the quickcart-ai root directory.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend\" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the quickcart-ai root directory.
    pause
    exit /b 1
)

echo Starting Backend Server...
start "QuickCart Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "QuickCart Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo Servers are starting!
echo ====================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
