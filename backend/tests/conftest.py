# backend/tests/conftest.py
"""
Pytest configuration and fixtures for backend unit and integration tests
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import sys
import os

# Add backend directory to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.database import Base, get_db
from app import models


# Test Database Configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override the get_db dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create a fresh test database for each test"""
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    yield db_session
    db_session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session):
    """Create a test client with mocked database"""
    app.dependency_overrides[get_db] = lambda: db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_flashcard():
    """Create a mock flashcard"""
    return models.Flashcard(
        id="card-123",
        language_id="lang-fr",
        word_or_phrase="Bonjour",
        definition="A greeting meaning 'hello' or 'good day'",
        etymology="From French, literally 'good day'",
        english_cognates="Good day",
        audio_url="gs://bucket/audio.webm",
        image_url="gs://bucket/image.jpg",
        ipa_pronunciation="/bɔ̃.ʒuʁ/",
        source="manual"
    )


@pytest.fixture
def mock_user():
    """Create a mock user"""
    return models.User(
        id="user-123",
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        auth_provider="email",
        is_active=True,
        is_verified=True
    )


@pytest.fixture
def mock_pronunciation_attempt(mock_flashcard, mock_user):
    """Create a mock pronunciation attempt"""
    return models.PronunciationAttempt(
        id="attempt-123",
        flashcard_id=mock_flashcard.id,
        user_id=mock_user.id,
        audio_url="gs://bucket/pronunciation.webm",
        target_text="Bonjour",
        transcribed_text="Bonjour",
        overall_confidence=0.95,
        word_scores='[{"word": "Bonjour", "confidence": 0.95, "status": "good"}]',
        ipa_target="/bɔ̃.ʒuʁ/"
    )


@pytest.fixture
def mock_speech_client():
    """Mock Google Cloud Speech-to-Text client"""
    mock_client = Mock()
    
    # Create mock word info objects
    word_info = Mock()
    word_info.word = "Bonjour"
    word_info.confidence = 0.95
    
    # Create mock alternative
    alternative = Mock()
    alternative.transcript = "Bonjour"
    alternative.words = [word_info]
    
    # Create mock result
    result = Mock()
    result.alternatives = [alternative]
    
    # Create mock response
    response = Mock()
    response.results = [result]
    
    mock_client.recognize.return_value = response
    
    return mock_client


@pytest.fixture
def mock_storage_client():
    """Mock Google Cloud Storage client"""
    mock_client = Mock()
    mock_bucket = Mock()
    mock_blob = Mock()
    
    mock_bucket.blob.return_value = mock_blob
    mock_client.bucket.return_value = mock_bucket
    
    return mock_client


@pytest.fixture
def mock_epitran():
    """Mock epitran for IPA conversion"""
    mock_epi = Mock()
    mock_epi.transliterate.return_value = "/bɔ̃.ʒuʁ/"
    return mock_epi


# Async test support
@pytest.fixture
def event_loop():
    """Create an event loop for async tests"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Markers for test organization
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "asyncio: mark test as async (requires pytest-asyncio)"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
