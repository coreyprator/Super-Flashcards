# backend/tests/test_pronunciation_api.py
"""
Integration tests for pronunciation API endpoints
Tests audio upload, progress tracking, and history retrieval
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import json
import io

# Note: These tests assume the app can be imported and configured
# Adjust imports based on your actual app structure


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock()


@pytest.fixture
def audio_file():
    """Create a fake audio file"""
    audio_content = b"fake webm opus audio data"
    return io.BytesIO(audio_content), "recording.webm"


class TestRecordingEndpoint:
    """Test the pronunciation/record endpoint"""
    
    def test_record_pronunciation_success(self, client, audio_file, mock_db):
        """Test successful recording upload and analysis"""
        audio_bytes, filename = audio_file
        
        # Mock the service
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.analyze_pronunciation.return_value = {
                "attempt_id": "attempt-123",
                "target_text": "Bonjour",
                "transcribed_text": "Bonjour",
                "overall_score": 0.95,
                "word_scores": [
                    {"word": "Bonjour", "confidence": 0.95, "status": "good"}
                ],
                "ipa_target": "/bɔ̃.ʒuʁ/",
                "feedback": "Excellent pronunciation!"
            }
            
            response = client.post(
                "/api/v1/pronunciation/record",
                data={
                    "flashcard_id": "card-123",
                    "user_id": "user-456"
                },
                files={"audio_file": (filename, audio_bytes, "audio/webm")}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["attempt_id"] == "attempt-123"
            assert data["overall_score"] == 0.95
            assert data["word_scores"][0]["status"] == "good"
    
    def test_record_pronunciation_no_audio(self, client):
        """Test upload with no audio file"""
        with patch('app.routers.pronunciation.pronunciation_service'):
            response = client.post(
                "/api/v1/pronunciation/record",
                data={
                    "flashcard_id": "card-123",
                    "user_id": "user-456"
                }
            )
            
            assert response.status_code == 422  # FastAPI validation error
    
    def test_record_pronunciation_flashcard_not_found(self, client, audio_file):
        """Test recording for non-existent flashcard"""
        audio_bytes, filename = audio_file
        
        with patch('app.routers.pronunciation.pronunciation_service'):
            with patch('app.routers.pronunciation.get_db') as mock_get_db:
                # Mock database to return no flashcard
                mock_session = Mock()
                mock_session.query.return_value.filter.return_value.first.return_value = None
                mock_get_db.return_value = mock_session
                
                response = client.post(
                    "/api/v1/pronunciation/record",
                    data={
                        "flashcard_id": "nonexistent",
                        "user_id": "user-456"
                    },
                    files={"audio_file": (filename, audio_bytes, "audio/webm")}
                )
                
                assert response.status_code == 404


class TestProgressEndpoint:
    """Test the pronunciation/progress endpoint"""
    
    def test_get_progress_success(self, client):
        """Test retrieving user pronunciation progress"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.get_user_progress.return_value = {
                "total_attempts": 15,
                "avg_confidence": 0.82,
                "problem_words": [
                    {"word": "rue", "avg_confidence": 0.61, "attempts": 5},
                    {"word": "rouge", "avg_confidence": 0.67, "attempts": 4}
                ],
                "improvement_trend": "+12%"
            }
            
            response = client.get("/api/v1/pronunciation/progress/user-123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_attempts"] == 15
            assert data["avg_confidence"] == 0.82
            assert len(data["problem_words"]) == 2
    
    def test_get_progress_no_attempts(self, client):
        """Test progress endpoint with no attempts"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.get_user_progress.return_value = {
                "total_attempts": 0,
                "avg_confidence": 0.0,
                "problem_words": [],
                "improvement_trend": "No attempts yet"
            }
            
            response = client.get("/api/v1/pronunciation/progress/user-789")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_attempts"] == 0


class TestHistoryEndpoint:
    """Test the pronunciation/history endpoint"""
    
    def test_get_history_success(self, client):
        """Test retrieving attempt history for a flashcard"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.get_flashcard_history.return_value = {
                "flashcard_id": "card-123",
                "total_attempts": 5,
                "avg_confidence": 0.88,
                "attempts": [
                    {
                        "id": "attempt-1",
                        "user_id": "user-123",
                        "target_text": "Bonjour",
                        "transcribed_text": "Bonjour",
                        "overall_confidence": 0.95,
                        "word_scores": [{"word": "Bonjour", "confidence": 0.95}],
                        "created_at": "2024-01-28T10:00:00"
                    }
                ],
                "pagination": {
                    "skip": 0,
                    "limit": 20,
                    "total": 5,
                    "pages": 1
                }
            }
            
            response = client.get("/api/v1/pronunciation/history/card-123?skip=0&limit=20")
            
            assert response.status_code == 200
            data = response.json()
            assert data["flashcard_id"] == "card-123"
            assert data["total_attempts"] == 5
            assert len(data["attempts"]) == 1
    
    def test_get_history_pagination(self, client):
        """Test history pagination"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.get_flashcard_history.return_value = {
                "flashcard_id": "card-123",
                "total_attempts": 50,
                "avg_confidence": 0.85,
                "attempts": [],
                "pagination": {
                    "skip": 20,
                    "limit": 20,
                    "total": 50,
                    "pages": 3
                }
            }
            
            response = client.get("/api/v1/pronunciation/history/card-123?skip=20&limit=20")
            
            assert response.status_code == 200
            data = response.json()
            assert data["pagination"]["skip"] == 20
            assert data["pagination"]["pages"] == 3
    
    def test_get_history_limit_max(self, client):
        """Test that limit is capped at 100"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            response = client.get("/api/v1/pronunciation/history/card-123?skip=0&limit=1000")
            
            # Service should be called with limit=100
            call_args = mock_service.get_flashcard_history.call_args
            assert call_args[1]['limit'] == 100


class TestGenerateIPAEndpoint:
    """Test the generate-ipa endpoint"""
    
    def test_generate_ipa_success(self, client):
        """Test successful IPA generation"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.generate_ipa_for_flashcard.return_value = {
                "flashcard_id": "card-123",
                "word_or_phrase": "Bonjour",
                "ipa": "/bɔ̃.ʒuʁ/",
                "success": True
            }
            
            response = client.post("/api/v1/pronunciation/generate-ipa/card-123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["ipa"] == "/bɔ̃.ʒuʁ/"
    
    def test_generate_ipa_not_found(self, client):
        """Test IPA generation for non-existent flashcard"""
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.generate_ipa_for_flashcard.side_effect = ValueError("Flashcard not found")
            
            response = client.post("/api/v1/pronunciation/generate-ipa/nonexistent")
            
            assert response.status_code == 500


class TestErrorHandling:
    """Test error handling in pronunciation endpoints"""
    
    def test_api_error_handling(self, client, audio_file):
        """Test that API errors are properly returned"""
        audio_bytes, filename = audio_file
        
        with patch('app.routers.pronunciation.pronunciation_service') as mock_service:
            mock_service.analyze_pronunciation.side_effect = Exception("API Error")
            
            response = client.post(
                "/api/v1/pronunciation/record",
                data={
                    "flashcard_id": "card-123",
                    "user_id": "user-456"
                },
                files={"audio_file": (filename, audio_bytes, "audio/webm")}
            )
            
            assert response.status_code == 500
            assert "Error" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
