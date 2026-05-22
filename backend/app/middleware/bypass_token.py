import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

REQUIRED_TOKEN = os.getenv("SF_BYPASS_TOKEN", "")


class BypassTokenMiddleware(BaseHTTPMiddleware):
    """Gate write methods with X-Test-Bypass-Token; reads stay open."""

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            # Exempt health checks
            if request.url.path in ("/health", "/api/health"):
                return await call_next(request)
            token = request.headers.get("X-Test-Bypass-Token", "")
            if not REQUIRED_TOKEN:
                env = os.getenv("ENVIRONMENT", "").lower()
                if env in ("production", "prod", "beta"):
                    return JSONResponse(
                        status_code=500,
                        content={"detail": "SF_BYPASS_TOKEN not configured."},
                    )
            elif token != REQUIRED_TOKEN:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Bypass token required for write operations."},
                )
        return await call_next(request)
