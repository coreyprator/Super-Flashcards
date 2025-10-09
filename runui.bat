@echo off
REM Language Learning Flashcards - Start UI Server
REM Usage: runui.bat

echo 🚀 Starting Language Learning Flashcards...
echo 📁 Project: Super-Flashcards
echo 🌐 URL: http://localhost:8000
echo ⏹️  Stop with: Ctrl+C
echo.

REM Get the batch file directory (project root)
cd /d "%~dp0"

REM Navigate to backend directory
if not exist "backend" (
    echo ❌ Error: Backend directory not found
    pause
    exit /b 1
)

cd backend

REM Check if main.py exists
if not exist "app\main.py" (
    echo ❌ Error: app\main.py not found
    pause
    exit /b 1
)

REM Activate virtual environment if it exists
if exist "..\\.venv\\Scripts\\activate.bat" (
    echo 🔄 Activating virtual environment...
    call "..\\.venv\\Scripts\\activate.bat"
)

REM Start the FastAPI server using python module
echo 🔄 Starting FastAPI server...
python -m uvicorn app.main:app --reload --host localhost --port 8000