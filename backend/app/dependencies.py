# backend/app/dependencies.py — BWTL03 role-tier permission dependencies
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Re-export from auth to avoid circular imports."""
    from app.routers.auth import get_current_user as _auth_get_current_user
    return _auth_get_current_user(request, db)


def require_role(*allowed_tiers: str):
    """
    FastAPI dependency factory.  Usage:
        Depends(require_role('pl', 'theo'))
    Returns the current user if their role_tier is in allowed_tiers.
    """
    def _check(user: models.User = Depends(get_current_user)):
        tier = getattr(user, 'role_tier', 'learner') or 'learner'
        if tier not in allowed_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{tier}' is not permitted. Required: {list(allowed_tiers)}",
            )
        return user
    return _check


def require_write_access(user: models.User = Depends(get_current_user)) -> models.User:
    """Deny learners from write operations."""
    tier = getattr(user, 'role_tier', 'learner') or 'learner'
    if tier == 'learner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have read-only access.",
        )
    return user


def require_pl(user: models.User = Depends(get_current_user)) -> models.User:
    """Restrict endpoint to PL only."""
    tier = getattr(user, 'role_tier', 'learner') or 'learner'
    if tier != 'pl':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires PL role.",
        )
    return user
