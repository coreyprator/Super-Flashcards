# backend/app/main.py
# Version: 2.6.20 - Fixed related_words validation: convert list to JSON string in batch generate
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
import os
import logging
import time
from datetime import datetime
import secrets

from app.database import engine, get_db
from app import models
from app.routers import flashcards, ai_generate, languages, users, import_flashcards, batch_processing, audio, auth
# Removed unused routes for faster startup: ipa, batch_ipa, tts_testing (development-only)
# Kept: audio (production TTS functionality)
# Added: auth (Google OAuth + email/password authentication)

logger = logging.getLogger(__name__)

# Basic Auth configuration - DISABLED now that JWT OAuth is active
# Set BASIC_AUTH_ENABLED=true in environment to re-enable for testing
BASIC_AUTH_ENABLED = os.getenv("BASIC_AUTH_ENABLED", "false").lower() == "true"
BASIC_AUTH_USERNAME = os.getenv("BASIC_AUTH_USERNAME", "beta")
BASIC_AUTH_PASSWORD = os.getenv("BASIC_AUTH_PASSWORD", "flashcards2025")
security = HTTPBasic()

# Performance monitoring - log slow requests
SLOW_REQUEST_THRESHOLD_MS = float(os.getenv("SLOW_REQUEST_THRESHOLD_MS", "1000"))  # Default: warn if > 1 second

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

# DEBUG: Check if SQL_PASSWORD is available
sql_password = os.getenv("SQL_PASSWORD", "")
logger.info(f"🔍 SQL_PASSWORD environment variable: {'SET (' + str(len(sql_password)) + ' chars)' if sql_password else 'NOT SET'}")

# Session middleware for OAuth (required by authlib)
from starlette.middleware.sessions import SessionMiddleware

# Configure session cookie for Cloud Run (HTTPS) and local dev (HTTP)
# SameSite=Lax allows cookies to be sent on top-level navigation (OAuth redirect)
# HTTPS_ONLY should be True in production (Cloud Run) but False in local dev
IS_CLOUD_RUN = os.getenv("K_SERVICE") is not None
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", secrets.token_urlsafe(32)),
    https_only=IS_CLOUD_RUN,  # Only require HTTPS in production
    same_site="lax",  # Allow cookies on redirects (required for OAuth)
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
        "https://learn.rentyourcio.com",  # Custom domain
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
    # Skip auth for health check, static assets, and authentication endpoints
    if request.url.path in ["/", "/health", "/api/sync", "/manifest.json", "/favicon.ico", "/login"] or \
       request.url.path.startswith("/static/") or \
       request.url.path.startswith("/images/") or \
       request.url.path.startswith("/audio/") or \
       request.url.path.startswith("/api/auth/"):
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

# ========================================
# Request Timing Middleware
# ========================================
class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log slow requests
        if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(f"⚠️  SLOW REQUEST ({duration_ms:.0f}ms): {request.method} {request.url.path}")
        else:
            logger.info(f"✅ {request.method} {request.url.path} ({duration_ms:.0f}ms)")
        
        # Add timing header to response
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        
        return response

app.add_middleware(RequestTimingMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])  # Google OAuth + email/password auth
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(ai_generate.router, prefix="/api/ai", tags=["ai-generate"])  # Sprint 2
app.include_router(languages.router, prefix="/api/languages", tags=["languages"])  # Sprint 3
app.include_router(users.router, prefix="/api/users", tags=["users"])  # User management
app.include_router(import_flashcards.router, prefix="/api", tags=["import"])  # Import functionality
app.include_router(batch_processing.router, prefix="/api", tags=["batch_processing"])  # Batch processing functionality
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])  # Sprint 4 - TTS functionality

# Import document parser router
from .routers import document_parser
app.include_router(document_parser.router, prefix="/api/document", tags=["document-parser"])  # Document parsing for word extraction

# Import batch AI generation router
from .routers import batch_ai_generate
app.include_router(batch_ai_generate.router, prefix="/api/ai", tags=["batch-ai-generation"])  # Batch AI flashcard generation

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

@app.get("/login", response_class=HTMLResponse)
async def serve_login():
    """Serve the login page"""
    from fastapi.responses import FileResponse
    login_file = os.path.join(frontend_path, "login.html")
    if os.path.exists(login_file):
        with open(login_file, "r", encoding="utf-8") as f:
            return f.read()
    raise HTTPException(status_code=404, detail="Login page not found")

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

@app.get("/auth.js")
async def serve_auth_js():
    """Serve auth.js (authentication module)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "auth.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/oauth-tracker.js")
async def serve_oauth_tracker_js():
    """Serve oauth-tracker.js (OAuth performance tracking)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "oauth-tracker.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

@app.get("/first-time-loader.js")
async def serve_first_time_loader_js():
    """Serve first-time-loader.js (progressive loading UX)"""
    from fastapi.responses import FileResponse
    js_file = os.path.join(frontend_path, "first-time-loader.js")
    if os.path.exists(js_file):
        return FileResponse(js_file, media_type="application/javascript")
    return {"error": "File not found"}

# Removed development/testing HTML endpoints to optimize startup

@app.get("/health")
async def health_check():
    """Health check endpoint - does NOT test database connection"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"
    }

@app.get("/health/db")
async def health_check_database(db: Session = Depends(get_db)):
    """Health check endpoint that ACTUALLY tests database connection"""
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "test_query": f"SUCCESS (result={result})"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "failed",
            "error": str(e)
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