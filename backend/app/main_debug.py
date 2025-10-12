# backend/app/main_debug.py
"""
Debug version to isolate the startup issue
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

print("1. Starting app creation...")

app = FastAPI(
    title="Language Learning Flashcards - Debug",
    description="Debug version",
    version="1.0.0"
)

print("2. Adding CORS middleware...")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("3. Importing database...")
try:
    from app.database import engine
    print("3a. Database imported successfully")
except Exception as e:
    print(f"3a. Database import failed: {e}")

print("4. Importing models...")
try:
    from app import models
    print("4a. Models imported successfully")
except Exception as e:
    print(f"4a. Models import failed: {e}")

print("5. Creating database tables...")
try:
    models.Base.metadata.create_all(bind=engine)
    print("5a. Database tables created successfully")
except Exception as e:
    print(f"5a. Database table creation failed: {e}")

print("6. Setting up static files...")
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    print("6a. Static files mounted successfully")

@app.get("/")
async def read_root():
    return {"message": "Debug server is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

print("7. App setup complete - ready to serve requests")