# backend/app/routers/auth.py
"""
Authentication router for Google OAuth and email/password login.
Handles user registration, login, logout, and session management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from datetime import datetime
import json
import os

from app.database import get_db
from app import models, schemas, crud
from app.services.auth_service import (
    create_access_token,
    decode_access_token,
    verify_password,
    get_password_hash,
    validate_email,
    validate_password_strength,
    generate_username_from_email,
    sanitize_oauth_data
)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Load Google OAuth configuration
GOOGLE_CLIENT_ID = None
GOOGLE_CLIENT_SECRET = None
REDIRECT_URI = None

try:
    # Try loading from JSON file first
    oauth_config_path = os.path.join(os.path.dirname(__file__), '..', 'google_oauth_client.json')
    print(f"🔍 Looking for OAuth config at: {oauth_config_path}")
    if os.path.exists(oauth_config_path):
        with open(oauth_config_path, 'r') as f:
            config = json.load(f)
            GOOGLE_CLIENT_ID = config['web']['client_id']
            GOOGLE_CLIENT_SECRET = config['web']['client_secret']
            print(f"✅ Loaded OAuth config from JSON file")
            print(f"   Client ID: {GOOGLE_CLIENT_ID[:20]}...")
    else:
        # Fallback to environment variables
        GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
        GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
        if GOOGLE_CLIENT_ID:
            print(f"✅ Loaded OAuth config from environment variables")
        else:
            print(f"❌ No OAuth config found!")
except Exception as e:
    print(f"❌ Warning: Could not load Google OAuth config: {e}")

# Initialize OAuth client
# Note: OAuth delays are a Windows development environment issue (SSL cert validation)
# In production (Cloud Run), this works fine. For local dev, add Windows Defender exclusions.
oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    print(f"🔧 Registering OAuth client with Google...")
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile',
        }
    )
    print(f"✅ Google OAuth client registered!")
    print(f"   Note: If OAuth is slow (2+ min), add Windows Defender exclusions for Python")
else:
    print(f"⚠️  Google OAuth NOT configured - Client ID or Secret missing!")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """
    Dependency to get the current authenticated user from JWT token.
    Checks both Authorization header and cookies.
    """
    token = None
    
    # Try Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    
    # Fallback to cookie
    if not token:
        token = request.cookies.get('access_token')
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except HTTPException:
        raise
    
    # Get user from database
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return user


# Optional auth dependency - returns None if not authenticated
async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> models.User | None:
    """Optional authentication - returns None if not authenticated instead of raising error"""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


@router.post("/register", response_model=schemas.Token)
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with email and password.
    """
    # Validate email
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address"
        )
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == user_data.email) | (models.User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        auth_provider='email',
        preferred_instruction_language=user_data.preferred_instruction_language,
        is_active=True,
        is_verified=False,  # TODO: Implement email verification
        last_login=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JWT token
    token_data = {
        'user_id': str(new_user.id),
        'email': new_user.email
    }
    access_token = create_access_token(token_data)
    
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.User.model_validate(new_user)
    )


@router.post("/login", response_model=schemas.Token)
async def login(login_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password.
    """
    # Find user by email
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create JWT token
    token_data = {
        'user_id': str(user.id),
        'email': user.email
    }
    access_token = create_access_token(token_data)
    
    # Set HTTP-only cookie (secure in production)
    is_production = os.getenv('ENVIRONMENT', 'development') == 'production'
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,  # HTTPS only in production
        samesite="lax",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.User.model_validate(user)
    )


@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth login flow.
    Redirects user to Google's consent screen.
    """
    import time
    start_time = time.time()
    start_iso = datetime.now().isoformat()
    
    print(f"\n{'='*80}")
    print(f"🚀 GOOGLE LOGIN ENDPOINT HIT")
    print(f"{'='*80}")
    print(f"⏱️  Start time: {start_iso}")
    print(f"   Request method: {request.method}")
    print(f"   Request URL: {request.url}")
    
    # DEBUG: Show the actual client_id being used
    print(f"🔑 Using Client ID: {GOOGLE_CLIENT_ID[:30] if GOOGLE_CLIENT_ID else 'None'}...")
    
    if not GOOGLE_CLIENT_ID:
        elapsed = (time.time() - start_time) * 1000
        print(f"❌ Google OAuth not configured! (after {elapsed:.2f}ms)")
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    # Determine redirect URI based on request origin
    redirect_start = time.time()
    origin = request.headers.get('origin', 'http://localhost:8000')
    redirect_uri = f"{origin}/api/auth/google/callback"
    redirect_time = (time.time() - redirect_start) * 1000
    
    print(f"📍 Redirect URI: {redirect_uri} (determined in {redirect_time:.2f}ms)")
    print(f"🔄 Calling oauth.google.authorize_redirect...")
    
    oauth_start = time.time()
    try:
        result = await oauth.google.authorize_redirect(request, redirect_uri)
        oauth_time = (time.time() - oauth_start) * 1000
        total_time = (time.time() - start_time) * 1000
        
        print(f"✅ OAuth redirect created successfully in {oauth_time:.2f}ms!")
        print(f"📤 Redirect URL: {result.headers.get('location', 'N/A')[:100]}...")
        print(f"⏱️  TOTAL TIME: {total_time:.2f}ms ({total_time/1000:.3f}s)")
        print(f"{'='*80}\n")
        
        return result
    except Exception as e:
        error_time = (time.time() - oauth_start) * 1000
        total_time = (time.time() - start_time) * 1000
        
        print(f"❌ Error in OAuth redirect after {error_time:.2f}ms: {e}")
        print(f"⏱️  TOTAL TIME (with error): {total_time:.2f}ms")
        print(f"{'='*80}\n")
        
        import traceback
        traceback.print_exc()
        raise


@router.get("/callback")
async def auth_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Handle OAuth callback from Google.
    Creates or updates user and returns JWT token.
    """
    import time
    start_time = time.time()
    start_iso = datetime.now().isoformat()
    
    print(f"\n{'='*80}")
    print(f"🎯 OAUTH CALLBACK ENDPOINT HIT")
    print(f"{'='*80}")
    print(f"⏱️  Start time: {start_iso}")
    print(f"   Request URL: {request.url}")
    print(f"   Query params: {dict(request.query_params)}")
    
    if not GOOGLE_CLIENT_ID:
        elapsed = (time.time() - start_time) * 1000
        print(f"❌ Google OAuth not configured! (after {elapsed:.2f}ms)")
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    try:
        # Get OAuth token from Google
        print(f"🔄 Step 1/5: Getting token from Google...")
        token_start = time.time()
        
        token = await oauth.google.authorize_access_token(request)
        
        token_time = (time.time() - token_start) * 1000
        print(f"✅ Got token from Google in {token_time:.2f}ms")
        
        # Get user info from Google
        print(f"🔄 Step 2/5: Extracting user info from token...")
        userinfo_start = time.time()
        
        user_info = token.get('userinfo')
        
        userinfo_time = (time.time() - userinfo_start) * 1000
        print(f"👤 User info extracted in {userinfo_time:.2f}ms: {user_info.get('email') if user_info else 'None'}")
        
        if not user_info:
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ Failed to get user info (after {elapsed:.2f}ms)")
            print(f"{'='*80}\n")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        print(f"🔄 Step 3/5: Sanitizing OAuth data...")
        sanitize_start = time.time()
        
        oauth_data = sanitize_oauth_data(user_info)
        
        sanitize_time = (time.time() - sanitize_start) * 1000
        print(f"✅ Data sanitized in {sanitize_time:.2f}ms")
        
        # Check if user exists by Google ID
        print(f"🔄 Step 4/5: Checking if user exists in database...")
        db_start = time.time()
        
        user = db.query(models.User).filter(
            models.User.google_id == oauth_data['google_id']
        ).first()
        
        if not user:
            # Check if user exists by email
            user = db.query(models.User).filter(
                models.User.email == oauth_data['email']
            ).first()
            
            if user:
                # Link Google account to existing email user
                print(f"🔗 Linking Google account to existing email user...")
                user.google_id = oauth_data['google_id']
                user.auth_provider = 'google'
                if not user.name:
                    user.name = oauth_data['name']
                if not user.picture:
                    user.picture = oauth_data['picture']
            else:
                # Create new user
                print(f"➕ Creating new user account...")
                username = generate_username_from_email(oauth_data['email'])
                user = models.User(
                    username=username,
                    email=oauth_data['email'],
                    google_id=oauth_data['google_id'],
                    name=oauth_data['name'],
                    picture=oauth_data['picture'],
                    auth_provider='google',
                    is_active=True,
                    is_verified=True,  # Google accounts are pre-verified
                )
                db.add(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        db_time = (time.time() - db_start) * 1000
        print(f"✅ User created/updated in {db_time:.2f}ms: {user.email}")
        
        # Create JWT token
        print(f"🔄 Step 5/5: Creating JWT token...")
        jwt_start = time.time()
        
        token_data = {
            'user_id': str(user.id),
            'email': user.email
        }
        access_token = create_access_token(token_data)
        
        jwt_time = (time.time() - jwt_start) * 1000
        print(f"🎫 JWT token created in {jwt_time:.2f}ms")
        
        # Set HTTP-only cookie
        cookie_start = time.time()
        is_production = os.getenv('ENVIRONMENT', 'development') == 'production'
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=30 * 24 * 60 * 60  # 30 days
        )
        
        cookie_time = (time.time() - cookie_start) * 1000
        print(f"🍪 Cookie set in {cookie_time:.2f}ms")
        
        # Redirect to frontend login page with token (will be picked up by frontend)
        redirect_start = time.time()
        origin = request.headers.get('origin', 'http://localhost:8000')
        redirect_url = f"{origin}/login?auth=success&token={access_token}"
        redirect_time = (time.time() - redirect_start) * 1000
        
        total_time = (time.time() - start_time) * 1000
        
        print(f"🚀 Redirecting to: {redirect_url} (prepared in {redirect_time:.2f}ms)")
        print(f"")
        print(f"⏱️  CALLBACK TIMING BREAKDOWN:")
        print(f"   1. Token from Google:  {token_time:>8.2f}ms")
        print(f"   2. Extract user info:  {userinfo_time:>8.2f}ms")
        print(f"   3. Sanitize data:      {sanitize_time:>8.2f}ms")
        print(f"   4. Database ops:       {db_time:>8.2f}ms")
        print(f"   5. Create JWT:         {jwt_time:>8.2f}ms")
        print(f"   6. Set cookie:         {cookie_time:>8.2f}ms")
        print(f"   7. Prepare redirect:   {redirect_time:>8.2f}ms")
        print(f"   ----------------------------------------")
        print(f"   TOTAL TIME:            {total_time:>8.2f}ms ({total_time/1000:.3f}s)")
        print(f"{'='*80}\n")
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        print(f"❌ OAuth callback error after {elapsed:.2f}ms: {e}")
        print(f"{'='*80}\n")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me", response_model=schemas.User)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    return schemas.User.model_validate(current_user)


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing the auth cookie.
    """
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.put("/me", response_model=schemas.User)
async def update_profile(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    if update_data.username:
        # Check if username is already taken
        existing = db.query(models.User).filter(
            models.User.username == update_data.username,
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = update_data.username
    
    if update_data.preferred_instruction_language:
        current_user.preferred_instruction_language = update_data.preferred_instruction_language
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return schemas.User.model_validate(current_user)
