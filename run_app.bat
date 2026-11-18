@echo off
TITLE AI Interview Coach Runner
echo ========================================================
echo        STARTING STANDALONE AI INTERVIEW COACH
echo ========================================================
echo.

:: 1. Start Backend Server
echo [1/2] Starting FastAPI Backend on http://localhost:8001...
start "AI Interview Coach - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

:: 2. Wait a moment
timeout /t 3 /nobreak > nul

:: 3. Start Frontend Dev Server
echo [2/2] Starting Vite Frontend on http://localhost:5173...
start "AI Interview Coach - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo App running! Open http://localhost:5173 in your browser.
echo Backend API docs available at http://localhost:8001/docs
echo ========================================================
echo.
pause
