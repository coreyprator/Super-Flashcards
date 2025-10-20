# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette.middleware.base import BaseHTTPMiddleware
import os
import logging
import time
from datetime import datetime
import secrets

from app.database import engine
from app import models
from app.routers import flashcards, ai_generate, languages, users, import_flashcards, batch_processing, audio
# Removed unused routes for faster startup: ipa, batch_ipa, tts_testing (development-only)
# Kept: audio (production TTS functionality)

logger = logging.getLogger(__name__)

# Basic Auth configuration for Phase 1 (temporary protection)
BASIC_AUTH_ENABLED = os.getenv("BASIC_AUTH_ENABLED", "true").lower() == "true"
BASIC_AUTH_USERNAME = os.getenv("BASIC_AUTH_USERNAME", "beta")
BASIC_AUTH_PASSWORD = os.getenv("BASIC_AUTH_PASSWORD", "flashcards2025")
security = HTTPBasic()

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

# Create database tables - DISABLED for Cloud Run (tables already exist)
# models.Base.metadata.create_all(bind=engine)
logger.info("✅ Database connection configured")



app = FastAPI(
    title="Language Learning Flashcards",
    description="AI-powered flashcard app with offline support",
    version="1.0.0"
)

# Proxy header middleware for Cloud Run
# Cloud Run terminates HTTPS and forwards as HTTP, so we need to trust X-Forwarded-Proto
class ProxyHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Trust X-Forwarded-Proto header from Cloud Run's load balancer
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto:
            request.scope["scheme"] = forwarded_proto
        return await call_next(request)

app.add_middleware(ProxyHeaderMiddleware)

# CORS configuration for Cloud Run deployment
# CRITICAL: When allow_credentials=True, allow_origins cannot be ["*"]
# Must specify actual origins for credentials to work
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://super-flashcards-57478301787.us-central1.run.app",  # Cloud Run URL
        "https://learn.rentyourcio.com",  # Custom subdomain
        "http://localhost:8000",  # Local development
        "http://127.0.0.1:8000"  # Local development alt
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic Auth Middleware (Phase 1 protection)
@app.middleware("http")
async def basic_auth_middleware(request: Request, call_next):
    """
    Basic authentication middleware for temporary protection.
    Excludes health check and static files.
    """
    # Skip auth for health check and static assets
    if request.url.path in ["/health", "/api/sync", "/manifest.json", "/favicon.ico"] or \
       request.url.path.startswith("/static/") or \
       request.url.path.startswith("/images/") or \
       request.url.path.startswith("/audio/"):
        return await call_next(request)
    
    # Check if basic auth is enabled
    if not BASIC_AUTH_ENABLED:
        return await call_next(request)
    
    # Get credentials from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Basic "):
        return HTMLResponse(
            content="<h1>401 Unauthorized</h1><p>Please provide valid credentials.</p>",
            status_code=401,
            headers={"WWW-Authenticate": 'Basic realm="Super-Flashcards Beta"'}
        )
    
    # Decode and verify credentials
    import base64
    try:
        encoded_credentials = auth_header.split(" ")[1]
        decoded = base64.b64decode(encoded_credentials).decode("utf-8")
        username, password = decoded.split(":", 1)
        
        # Constant-time comparison to prevent timing attacks
        correct_username = secrets.compare_digest(username, BASIC_AUTH_USERNAME)
        correct_password = secrets.compare_digest(password, BASIC_AUTH_PASSWORD)
        
        if not (correct_username and correct_password):
            return HTMLResponse(
                content="<h1>401 Unauthorized</h1><p>Invalid credentials.</p>",
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="Super-Flashcards Beta"'}
            )
    except Exception:
        return HTMLResponse(
            content="<h1>401 Unauthorized</h1><p>Invalid authorization format.</p>",
            status_code=401,
            headers={"WWW-Authenticate": 'Basic realm="Super-Flashcards Beta"'}
        )
    
    return await call_next(request)

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
# For Cloud Run, serve from local directory if frontend is copied into image
if not os.path.exists(frontend_path):
    frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
    
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Cloud Storage configuration for media files
CLOUD_STORAGE_BUCKET = "super-flashcards-media"
CLOUD_STORAGE_BASE_URL = f"https://storage.googleapis.com/{CLOUD_STORAGE_BUCKET}"

# Redirect /images/* to Cloud Storage
@app.get("/images/{file_path:path}")
async def redirect_image(file_path: str):
    """Proxy image requests to Cloud Storage (preserves CORS for caching)"""
    from fastapi.responses import StreamingResponse
    import httpx
    
    cloud_url = f"{CLOUD_STORAGE_BASE_URL}/images/{file_path}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(cloud_url)
            response.raise_for_status()
            
            return StreamingResponse(
                iter([response.content]),
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
                    "Access-Control-Allow-Origin": "*",  # Allow caching
                }
            )
    except httpx.HTTPError as e:
        logger.error(f"❌ Failed to proxy image {file_path}: {e}")
        raise HTTPException(status_code=404, detail="Image file not found")

# Redirect /audio/* to Cloud Storage
@app.get("/audio/{file_path:path}")
async def redirect_audio(file_path: str):
    """Proxy audio requests to Cloud Storage (preserves CORS for caching)"""
    from fastapi.responses import StreamingResponse
    import httpx
    
    cloud_url = f"{CLOUD_STORAGE_BASE_URL}/audio/{file_path}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(cloud_url)
            response.raise_for_status()
            
            return StreamingResponse(
                iter([response.content]),
                media_type="audio/mpeg",
                headers={
                    "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
                    "Access-Control-Allow-Origin": "*",  # Allow caching
                }
            )
    except httpx.HTTPError as e:
        logger.error(f"❌ Failed to proxy audio {file_path}: {e}")
        raise HTTPException(status_code=404, detail="Audio file not found")

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

@app.get("/manifest.json")
async def get_manifest():
    """Serve the PWA manifest file"""
    from fastapi.responses import FileResponse
    manifest_file = os.path.join(frontend_path, "manifest.json")
    if os.path.exists(manifest_file):
        return FileResponse(manifest_file, media_type="application/json")
    raise HTTPException(status_code=404, detail="Manifest not found")

@app.get("/favicon.ico")
async def get_favicon():
    """Serve the favicon (supports both .ico and .png)"""
    from fastapi.responses import FileResponse
    
    # Try .ico first, then .png
    for ext, media_type in [("ico", "image/x-icon"), ("png", "image/png")]:
        favicon_file = os.path.join(frontend_path, f"favicon.{ext}")
        if os.path.exists(favicon_file):
            return FileResponse(favicon_file, media_type=media_type)
    
    raise HTTPException(status_code=404, detail="Favicon not found")

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

@app.get("/db.js")
async def serve_db_js():
    """Serve db.js (IndexedDB module)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "db.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/sync.js")
async def serve_sync_js():
    """Serve sync.js (offline sync module)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "sync.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/api-client.js")
async def serve_api_client_js():
    """Serve api-client.js (API wrapper)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "api-client.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
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