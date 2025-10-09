@echo off
REM Language Learning Flashcards - Start UI Server
REM Usage: runui

echo 🚀 Starting Language Learning Flashcards...
echo 📁 Project: Super-Flashcards
echo 🌐 URL: http://localhost:8000
echo ⏹️  Stop with: Ctrl+C
echo.

REM Get the directory where this script is located (project root)
set "PROJECT_ROOT=%~dp0"
set "BACKEND_PATH=%PROJECT_ROOT%backend"

REM Check if backend directory exists
if not exist "%BACKEND_PATH%" (
    echo ❌ Error: Backend directory not found at %BACKEND_PATH%
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%BACKEND_PATH%"

REM Check if main.py exists
if not exist "app\main.py" (
    echo ❌ Error: app\main.py not found
    pause
    exit /b 1
)

REM Activate virtual environment if it exists
if exist "%PROJECT_ROOT%.venv\Scripts\activate.bat" (
    echo 🔄 Activating virtual environment...
    call "%PROJECT_ROOT%.venv\Scripts\activate.bat"
)

REM Start the FastAPI server using python module
echo 🔄 Starting FastAPI server...
python -m uvicorn app.main:app --reload --host localhost --port 8000