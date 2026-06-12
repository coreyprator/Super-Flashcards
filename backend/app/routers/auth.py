# backend/app/routers/auth.py
"""
Authentication router — email/password login and registration.
Google OAuth removed in BWTL08. get_current_user removed in BWTL08.
"""

import os
import secrets as _secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
    get_password_hash,
    validate_email,
    validate_password_strength,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class BwtlPassphraseRequest(BaseModel):
    passphrase: str


@router.post("/bwtl-passphrase")
async def bwtl_passphrase_login(
    body: BwtlPassphraseRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Single-user passphrase login for BWTL frontend (BUG-128 / write-auth-standard).
    Checks passphrase against APP_PASSPHRASE env var (populated from GCP Secret Manager
    app-passphrase at Cloud Run deploy time).  Returns a short-lived JWT access token
    and sets a refresh cookie identical to the regular login flow."""
    stored = os.getenv("APP_PASSPHRASE", "")
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Passphrase not configured — contact admin",
        )
    if not _secrets.compare_digest(body.passphrase.encode(), stored.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect passphrase")

    # Reuse the cached PL user (cprator@cbsware.com)
    admin_email = os.getenv("ADMIN_EMAIL", "cprator@cbsware.com")
    user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="PL user not found")

    token_data = {"user_id": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


def _set_refresh_cookie(response: Response, refresh_token: str):
    """Set refresh token as HTTP-only cookie with iOS-compatible settings."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",
    )


@router.post("/refresh")
async def refresh_access_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Exchange a refresh token (from cookie) for a new access token."""
    refresh_tok = request.cookies.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    payload = decode_refresh_token(refresh_tok)
    user_id = payload.get("user_id")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    token_data = {"user_id": str(user.id), "email": user.email}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": new_access, "token_type": "bearer", "expires_in": 900}


@router.post("/register", response_model=schemas.Token)
async def register(user_data: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    if not validate_email(user_data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")

    existing_user = db.query(models.User).filter(
        (models.User.email == user_data.email) | (models.User.username == user_data.username)
    ).first()

    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    hashed_password = get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        auth_provider="email",
        preferred_instruction_language=user_data.preferred_instruction_language,
        is_active=True,
        is_verified=False,
        last_login=datetime.utcnow(),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {"user_id": str(new_user.id), "email": new_user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return schemas.Token(access_token=access_token, token_type="bearer", user=schemas.User.model_validate(new_user))


@router.post("/login", response_model=schemas.Token)
async def login(login_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(models.User).filter(models.User.email == login_data.email).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    user.last_login = datetime.utcnow()
    db.commit()

    token_data = {"user_id": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return schemas.Token(access_token=access_token, token_type="bearer", user=schemas.User.model_validate(user))


@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing auth cookies."""
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"message": "Successfully logged out"}
