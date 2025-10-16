# Minimal version of main.py to debug server startup issues
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import logging
import os

# Add database imports to test
from app.database import engine
from app import models

# Add basic router
from app.routers import flashcards

logger = logging.getLogger(__name__)

logger.info("🚀 Starting minimal Super-Flashcards server...")

# Add database initialization
models.Base.metadata.create_all(bind=engine)
logger.info("✅ Database tables created/verified")

app = FastAPI(
    title="Language Learning Flashcards - Minimal",
    description="Minimal version for debugging with database",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include basic router
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])

# Serve static files (frontend)
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Serve uploaded images
images_path = os.path.join(os.path.dirname(__file__), "../../images")
os.makedirs(images_path, exist_ok=True)
app.mount("/images", StaticFiles(directory=images_path), name="images")

# Serve IPA audio files
ipa_audio_path = os.path.join(os.path.dirname(__file__), "../../ipa_audio")
os.makedirs(ipa_audio_path, exist_ok=True)
app.mount("/ipa_audio", StaticFiles(directory=ipa_audio_path), name="ipa_audio")

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
    js_file = os.path.join(frontend_path, "app.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/audio-player.js")
async def serve_audio_player_js():
    """Serve audio-player.js directly"""
    js_file = os.path.join(frontend_path, "audio-player.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/styles.css")
async def serve_styles_css():
    """Serve styles.css directly"""
    css_file = os.path.join(frontend_path, "styles.css")
    if os.path.exists(css_file):
        return FileResponse(css_file, media_type="text/css")
    return {"error": "File not found"}

@app.get("/health")  
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "minimal"}

logger.info("🎉 Minimal server setup complete!")
