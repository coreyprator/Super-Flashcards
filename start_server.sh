#!/bin/bash
# Bash script to start the Super Flashcards server
# Run this from the project root directory

echo "Starting Super Flashcards Development Server..."

# Activate virtual environment if not already activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "Activating virtual environment..."
    source ./.venv/bin/activate
fi

# Change to backend directory
cd backend

# Start the FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
python -m uvicorn app.main:app --reload --host localhost --port 8000