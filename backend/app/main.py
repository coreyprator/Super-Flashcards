# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

from app.database import engine
from app import models
from app.routers import flashcards, ai_generate, languages, users, import_flashcards, batch_processing, audio
# Removed: search, document_parser (replaced with batch processing approach)
# Added: audio (Sprint 4 - TTS functionality)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Language Learning Flashcards",
    description="AI-powered flashcard app with offline support",
    version="1.0.0"
)

# CORS configuration for development
# In production, restrict origins to your domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(ai_generate.router, prefix="/api/ai", tags=["ai"])
app.include_router(languages.router, prefix="/api/languages", tags=["languages"])
app.include_router(users.router)
app.include_router(import_flashcards.router, prefix="/api/import", tags=["import"])
app.include_router(batch_processing.router, prefix="/api/batch", tags=["batch_processing"])
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])  # Sprint 4: Audio/TTS
# Removed: search.router, document_parser.router (replaced with batch processing)

# Serve static files (frontend)
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Serve uploaded images
images_path = os.path.join(os.path.dirname(__file__), "../../images")
os.makedirs(images_path, exist_ok=True)
app.mount("/images", StaticFiles(directory=images_path), name="images")

# Serve audio files (Sprint 4: TTS)
audio_path = os.path.join(os.path.dirname(__file__), "../../audio")
os.makedirs(audio_path, exist_ok=True)
app.mount("/audio", StaticFiles(directory=audio_path), name="audio")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    html_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Language Learning App</h1><p>Frontend not found. Please add frontend/index.html</p>"

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"
    }

@app.get("/api/sync")
async def sync_status():
    """
    Endpoint for PWA to check sync status
    Returns timestamp and available updates
    """
    return {
        "server_time": "2025-10-03T12:00:00Z",
        "sync_available": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)