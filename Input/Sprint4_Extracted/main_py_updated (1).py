# backend/app/main.py
"""
Main FastAPI application
Updated for Sprint 4 - Audio features added
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import logging

# Import routers
from app.routers import flashcards, languages, study
from app.routers import audio  # NEW: Audio router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Super-Flashcards API",
    description="Language learning flashcard application with AI-powered content generation",
    version="1.1.0"  # Updated for Sprint 4
)

# Register routers
app.include_router(flashcards.router)
app.include_router(languages.router)
app.include_router(study.router)
app.include_router(audio.router)  # NEW: Audio endpoints

# Get project root directory
project_root = Path(__file__).parent.parent.parent

# Mount static directories
images_dir = project_root / "images"
images_dir.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")

# NEW: Mount audio directory
audio_dir = project_root / "audio"
audio_dir.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Mount frontend
frontend_dir = project_root / "frontend"
app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

@app.get("/")
async def root():
    """Serve the main application page"""
    return FileResponse(frontend_dir / "index.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.1.0",
        "features": ["flashcards", "ai_generation", "study_mode", "audio_tts"]
    }

logger.info("Super-Flashcards API started with audio features")
logger.info(f"Images directory: {images_dir}")
logger.info(f"Audio directory: {audio_dir}")
logger.info(f"Frontend directory: {frontend_dir}")
