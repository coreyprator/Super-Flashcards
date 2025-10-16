# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
import logging
import time
from datetime import datetime

from app.database import engine
from app import models
from app.routers import flashcards, ai_generate, languages, users, import_flashcards, batch_processing, audio
# Removed unused routes for faster startup: ipa, batch_ipa, tts_testing (development-only)
# Kept: audio (production TTS functionality)

logger = logging.getLogger(__name__)

# Get startup time from environment (set by runui script) or use current time as fallback
startup_start_env = os.getenv('STARTUP_TIME_UNIX')
if startup_start_env:
    try:
        startup_start = float(startup_start_env)
        logger.info(f"🚀 Starting Super-Flashcards server (full startup timing enabled)...")
    except ValueError:
        startup_start = time.time()
        logger.info(f"🚀 Starting Super-Flashcards server (partial timing - env var invalid)...")
else:
    startup_start = time.time()
    logger.info(f"🚀 Starting Super-Flashcards server (partial timing - no env var)...")

# Create database tables
models.Base.metadata.create_all(bind=engine)
logger.info("✅ Database tables created/verified")



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
app.include_router(ai_generate.router, prefix="/api/ai", tags=["ai-generate"])  # Sprint 2
app.include_router(languages.router, prefix="/api/languages", tags=["languages"])  # Sprint 3
app.include_router(users.router, prefix="/api/users", tags=["users"])  # User management
app.include_router(import_flashcards.router, prefix="/api", tags=["import"])  # Import functionality
app.include_router(batch_processing.router, prefix="/api", tags=["batch_processing"])  # Batch processing functionality
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])  # Sprint 4 - TTS functionality
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

# IPA audio mount removed - no longer needed after TTS optimization

@app.on_event("startup")
async def startup_event():
    """Log when the application is fully ready to serve requests"""
    startup_end = time.time()
    elapsed_seconds = round(startup_end - startup_start, 3)
    completion_time = datetime.now().strftime('%H:%M:%S.%f')[:-3]
    
    if startup_start_env:
        logger.info(f"🎉 Server startup complete at {completion_time}! (Total elapsed: {elapsed_seconds}s)")
    else:
        logger.info(f"🎉 Server startup complete at {completion_time}! (App init: {elapsed_seconds}s)")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    html_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Language Learning App</h1><p>Frontend not found. Please add frontend/index.html</p>"

@app.get("/app.js")
async def serve_app_js():
    """Serve app.js directly"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "app.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/audio-player.js")
async def serve_audio_player_js():
    """Serve audio-player.js directly"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "audio-player.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/styles.css")
async def serve_styles_css():
    """Serve styles.css directly"""
    from fastapi.responses import FileResponse
    css_file = os.path.join(frontend_path, "styles.css")
    if os.path.exists(css_file):
        return FileResponse(css_file, media_type="text/css")
    return {"error": "File not found"}

# Removed development/testing HTML endpoints to optimize startup

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