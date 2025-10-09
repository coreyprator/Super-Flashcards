# Development Setup Guide

## Starting the Development Server

Use the standard `runui` command from the project root directory.

### Quick Start (Recommended)

From the project root directory:

**Windows:**
```powershell
.\runui.ps1
```
or
```bat
runui.bat
```

**Linux/Mac:**
```bash
./runui.ps1   # PowerShell Core
```

### Method 2: Manual startup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment (if not already activated):
```bash
# Windows
..\\.venv\\Scripts\\Activate.ps1

# Linux/Mac
source ../.venv/bin/activate
```

3. Start the server:
```bash
python -m uvicorn app.main:app --reload --host localhost --port 8000
```

## Common Issues

### "No module named 'app'" Error
This happens when you run uvicorn from the wrong directory. Make sure you're in the `backend` directory, not the project root.

**Wrong (from project root):**
```bash
uvicorn app.main:app --reload  # This will fail
```

**Correct (from backend directory):**
```bash
cd backend
python -m uvicorn app.main:app --reload --host localhost --port 8000
```

### Virtual Environment Issues
Make sure the virtual environment is activated before starting the server:
- You should see `(.venv)` in your terminal prompt
- If not, activate it with the commands shown above

## Accessing the Application

Once the server is running, you can access:
- **Frontend:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Development Tips

- The `--reload` flag automatically restarts the server when you make code changes
- Use `--host localhost` instead of `--host 0.0.0.0` for local development
- Check the terminal output for any error messages during startup