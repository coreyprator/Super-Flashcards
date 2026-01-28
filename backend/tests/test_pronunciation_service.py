# backend/tests/test_pronunciation_service.py
"""
Unit tests for PronunciationService
Tests IPA generation, score calculation, and feedback
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.pronunciation_service import PronunciationService
from app import models
from sqlalchemy.orm import Session
import json
from datetime import datetime


@pytest.fixture
def pronunciation_service():
    """Create a PronunciationService instance for testing"""
    with patch('app.services.pronunciation_service.speech.SpeechClient'), \
         patch('app.services.pronunciation_service.storage.Client'), \
         patch('app.services.pronunciation_service.epitran.Epitran'):
        service = PronunciationService()
        return service


class TestScoreToStatus:
    """Test the score_to_status conversion"""
    
    def test_good_score(self, pronunciation_service):
        """Score >= 0.85 should return 'good'"""
        assert pronunciation_service._score_to_status(0.95) == "good"
        assert pronunciation_service._score_to_status(0.85) == "good"
    
    def test_acceptable_score(self, pronunciation_service):
        """Score 0.70-0.84 should return 'acceptable'"""
        assert pronunciation_service._score_to_status(0.84) == "acceptable"
        assert pronunciation_service._score_to_status(0.70) == "acceptable"
        assert pronunciation_service._score_to_status(0.77) == "acceptable"
    
    def test_needs_work_score(self, pronunciation_service):
        """Score < 0.70 should return 'needs_work'"""
        assert pronunciation_service._score_to_status(0.69) == "needs_work"
        assert pronunciation_service._score_to_status(0.50) == "needs_work"
        assert pronunciation_service._score_to_status(0.0) == "needs_work"


class TestIpaConversion:
    """Test IPA conversion"""
    
    def test_text_to_ipa_simple(self, pronunciation_service):
        """Test converting simple French text to IPA"""
        # Mock epitran
        pronunciation_service.epi.transliterate = Mock(return_value="/bɔ̃.ʒuʁ/")
        
        result = pronunciation_service._text_to_ipa("Bonjour")
        
        assert result == "/bɔ̃.ʒuʁ/"
        pronunciation_service.epi.transliterate.assert_called_once_with("Bonjour")
    
    def test_text_to_ipa_empty_string(self, pronunciation_service):
        """Test IPA conversion with empty string"""
        pronunciation_service.epi.transliterate = Mock(return_value="")
        
        result = pronunciation_service._text_to_ipa("")
        
        assert result == ""


class TestFeedbackGeneration:
    """Test feedback generation"""
    
    def test_perfect_match_feedback(self, pronunciation_service):
        """Test feedback when transcription matches target perfectly"""
        feedback = pronunciation_service._generate_feedback(
            target="Bonjour",
            transcribed="Bonjour",
            word_scores=[],
            ipa="/bɔ̃.ʒuʁ/"
        )
        
        assert "Excellent" in feedback or "All words" in feedback
    
    def test_problem_words_feedback(self, pronunciation_service):
        """Test feedback with problem words"""
        word_scores = [
            {"word": "Bonjour", "confidence": 0.97, "status": "good"},
            {"word": "comment", "confidence": 0.65, "status": "needs_work"},
            {"word": "allez", "confidence": 0.60, "status": "needs_work"}
        ]
        
        feedback = pronunciation_service._generate_feedback(
            target="Bonjour comment allez",
            transcribed="Bonjour comment allez",
            word_scores=word_scores,
            ipa="/bɔ̃.ʒuʁ/"
        )
        
        assert "comment" in feedback.lower() or "allez" in feedback.lower()
        assert "needs_work" not in feedback  # Feedback should be human-readable
    
    def test_no_problem_words_feedback(self, pronunciation_service):
        """Test feedback when all words are good"""
        word_scores = [
            {"word": "Bonjour", "confidence": 0.97, "status": "good"},
            {"word": "comment", "confidence": 0.92, "status": "good"}
        ]
        
        feedback = pronunciation_service._generate_feedback(
            target="Bonjour comment",
            transcribed="Bonjour comment",
            word_scores=word_scores,
            ipa="/bɔ̃.ʒuʁ/"
        )
        
        assert "Good" in feedback or "transcription matches" in feedback.lower()


class TestTranscription:
    """Test transcription handling"""
    
    @pytest.mark.asyncio
    async def test_transcribe_audio_success(self, pronunciation_service):
        """Test successful audio transcription"""
        # Mock Google STT response
        word_info_1 = Mock()
        word_info_1.word = "Bonjour"
        word_info_1.confidence = 0.95
        
        word_info_2 = Mock()
        word_info_2.word = "comment"
        word_info_2.confidence = 0.88
        
        alternative = Mock()
        alternative.transcript = "Bonjour comment"
        alternative.words = [word_info_1, word_info_2]
        
        result = Mock()
        result.results = [Mock(alternatives=[alternative])]
        
        pronunciation_service.speech_client.recognize = Mock(return_value=result)
        
        transcription = await pronunciation_service._transcribe_audio(b"audio_content")
        
        assert transcription['transcript'] == "Bonjour comment"
        assert len(transcription['word_scores']) == 2
        assert transcription['word_scores'][0]['word'] == "Bonjour"
        assert transcription['word_scores'][0]['confidence'] == 0.95
        assert transcription['overall_confidence'] == pytest.approx(0.915, rel=0.01)
    
    @pytest.mark.asyncio
    async def test_transcribe_audio_empty(self, pronunciation_service):
        """Test transcription with empty result"""
        result = Mock()
        result.results = []
        
        pronunciation_service.speech_client.recognize = Mock(return_value=result)
        
        transcription = await pronunciation_service._transcribe_audio(b"audio_content")
        
        assert transcription['transcript'] == ""
        assert transcription['word_scores'] == []
        assert transcription['overall_confidence'] == 0.0


class TestAudioUpload:
    """Test audio file upload to GCS"""
    
    @pytest.mark.asyncio
    async def test_upload_audio_success(self, pronunciation_service):
        """Test successful audio upload to GCS"""
        # Mock GCS
        mock_blob = Mock()
        mock_bucket = Mock()
        mock_bucket.blob = Mock(return_value=mock_blob)
        pronunciation_service.storage_client.bucket = Mock(return_value=mock_bucket)
        
        audio_content = b"fake audio data"
        user_id = "user-123"
        flashcard_id = "card-456"
        
        url = await pronunciation_service._upload_audio(audio_content, user_id, flashcard_id)
        
        # Verify blob was created
        mock_bucket.blob.assert_called_once()
        assert url.startswith("gs://")
        assert "pronunciation" in url
        assert user_id in url
        assert flashcard_id in url


class TestDatabaseStorage:
    """Test storing attempts in database"""
    
    @pytest.mark.asyncio
    async def test_store_attempt_success(self, pronunciation_service):
        """Test successful attempt storage"""
        mock_db = Mock(spec=Session)
        
        # Mock the database commit/refresh
        mock_attempt = Mock()
        mock_attempt.id = "attempt-123"
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Need to patch the models.PronunciationAttempt
        with patch('app.services.pronunciation_service.models.PronunciationAttempt') as MockAttempt:
            MockAttempt.return_value = mock_attempt
            
            attempt_id = await pronunciation_service._store_attempt(
                db=mock_db,
                flashcard_id="card-123",
                user_id="user-456",
                audio_url="gs://bucket/audio.webm",
                target_text="Bonjour",
                transcribed_text="Bonjour",
                overall_confidence=0.95,
                word_scores=[{"word": "Bonjour", "confidence": 0.95}],
                ipa_target="/bɔ̃.ʒuʁ/"
            )
            
            # Verify database calls
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()
            assert attempt_id == "attempt-123"


class TestProgressCalculation:
    """Test pronunciation progress statistics"""
    
    @pytest.mark.asyncio
    async def test_get_user_progress_no_attempts(self, pronunciation_service):
        """Test progress with no attempts"""
        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = []
        mock_db.query.return_value = mock_query
        
        progress = await pronunciation_service.get_user_progress("user-123", mock_db)
        
        assert progress['total_attempts'] == 0
        assert progress['avg_confidence'] == 0.0
        assert progress['problem_words'] == []
    
    @pytest.mark.asyncio
    async def test_get_user_progress_with_attempts(self, pronunciation_service):
        """Test progress calculation with multiple attempts"""
        # Create mock attempts
        attempt1 = Mock()
        attempt1.overall_confidence = 0.95
        attempt1.word_scores = json.dumps([
            {"word": "Bonjour", "confidence": 0.97, "status": "good"},
            {"word": "comment", "confidence": 0.93, "status": "good"}
        ])
        
        attempt2 = Mock()
        attempt2.overall_confidence = 0.80
        attempt2.word_scores = json.dumps([
            {"word": "Bonjour", "confidence": 0.85, "status": "good"},
            {"word": "comment", "confidence": 0.75, "status": "acceptable"}
        ])
        
        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [attempt1, attempt2]
        mock_db.query.return_value = mock_query
        
        progress = await pronunciation_service.get_user_progress("user-123", mock_db)
        
        assert progress['total_attempts'] == 2
        assert progress['avg_confidence'] == pytest.approx(0.875, rel=0.01)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
