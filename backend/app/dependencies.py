# dependencies.py — RBAC removed in BWTL08 (OAuth+RBAC nuke).
# Write-gate enforcement via bypass token middleware removed in BWTL09 (SF-16).
# Write-auth re-added SERVICE-WIDE in BWTLGO5 (BUG-128).

import os
from fastapi import HTTPException, Request

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "cprator@cbsware.com")


async def require_admin(request: Request):
    """Dependency: requires a valid session AND admin e-mail.
    Apply to admin_bwtl, admin_etl, admin_repair router declarations."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:].strip()
    try:
        from app.services.auth_service import decode_access_token
        payload = decode_access_token(token)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if payload.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")

