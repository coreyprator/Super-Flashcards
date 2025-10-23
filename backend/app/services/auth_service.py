# backend/app/services/auth_service.py
"""
Authentication service for JWT tokens, password hashing, and OAuth validation.
Supports both Google OAuth and email/password authentication.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
import os
import secrets

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))  # Generate random key if not set
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # 30-day session duration

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storage"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing user data (user_id, email, etc.)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing token data
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def validate_email(email: str) -> bool:
    """
    Basic email validation.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if email format is valid
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    return True, ""


def generate_username_from_email(email: str) -> str:
    """
    Generate a username from an email address.
    Used for OAuth users who don't provide a username.
    
    Args:
        email: Email address
    
    Returns:
        Generated username
    """
    # Take part before @ and add random suffix to ensure uniqueness
    base = email.split('@')[0]
    # Remove special characters
    base = ''.join(c for c in base if c.isalnum() or c in ['_', '-'])
    # Add random suffix
    suffix = secrets.token_hex(3)
    return f"{base}_{suffix}"


def sanitize_oauth_data(oauth_data: dict) -> dict:
    """
    Extract and sanitize user data from OAuth provider response.
    
    Args:
        oauth_data: Raw data from OAuth provider
    
    Returns:
        Dictionary with sanitized user data
    """
    return {
        'email': oauth_data.get('email'),
        'name': oauth_data.get('name'),
        'picture': oauth_data.get('picture'),
        'google_id': oauth_data.get('sub'),  # Google's unique user ID
    }
