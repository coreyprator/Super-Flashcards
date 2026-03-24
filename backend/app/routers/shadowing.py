"""
SF-SENT-001: Shadowing mode endpoint.
POST /api/flashcards/{card_id}/shadow — accepts transcribed text from Web Speech API,
compares IPA against expected, returns phoneme-level feedback.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging
import json

from app.database import get_db
from app import models
from app.services.ipa_diff_service import tokenize_ipa, compare_ipa

logger = logging.getLogger(__name__)
router = APIRouter()


class ShadowRequest(BaseModel):
    """Client sends the transcribed text from Web Speech API."""
    transcribed_text: str
    transcribed_ipa: Optional[str] = None  # optional: client-side IPA if available


class PhonemeResult(BaseModel):
    phoneme: str
    expected: str
    got: str
    correct: bool
    feedback: Optional[str] = None


class ShadowResponse(BaseModel):
    accuracy_pct: float
    phoneme_results: List[dict]
    expected_text: str
    expected_ipa: str
    transcribed_text: str
    transcribed_ipa: str
    overall_feedback: str
    chapter_number: Optional[int] = None
    sentence_order: Optional[int] = None


def basic_french_ipa(text: str) -> str:
    """Generate approximate French IPA (same as ingestion script)."""
    import re
    result = text.lower().strip()
    replacements = [
        ("eau", "o"), ("aux", "o"), ("ou", "u"), ("oi", "wa"),
        ("ai", "ɛ"), ("ei", "ɛ"), ("au", "o"), ("eu", "ø"),
        ("an", "ɑ̃"), ("am", "ɑ̃"), ("en", "ɑ̃"), ("em", "ɑ̃"),
        ("in", "ɛ̃"), ("im", "ɛ̃"), ("ain", "ɛ̃"), ("on", "ɔ̃"),
        ("om", "ɔ̃"), ("un", "œ̃"), ("ch", "ʃ"), ("ph", "f"),
        ("gn", "ɲ"), ("qu", "k"), ("th", "t"),
        ("é", "e"), ("è", "ɛ"), ("ê", "ɛ"), ("à", "a"),
        ("â", "ɑ"), ("ç", "s"), ("c", "k"), ("g", "ɡ"),
        ("j", "ʒ"), ("r", "ʁ"), ("u", "y"), ("y", "i"),
    ]
    result = re.sub(r"e\b", "", result)
    for pattern, replacement in replacements:
        result = result.replace(pattern, replacement)
    return result


@router.post("/flashcards/{card_id}/shadow", response_model=ShadowResponse)
async def shadow_sentence(
    card_id: str,
    payload: ShadowRequest,
    db: Session = Depends(get_db),
):
    """
    Compare user's spoken text against the expected sentence.
    Uses IPA diff to produce phoneme-level feedback.
    """
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    expected_text = flashcard.word_or_phrase
    expected_ipa = flashcard.ipa_pronunciation or ""

    # Clean IPA strings (remove slashes, brackets)
    clean_expected = expected_ipa.strip("/[]")

    # Generate IPA for the transcribed text
    transcribed_ipa = payload.transcribed_ipa or basic_french_ipa(payload.transcribed_text)
    clean_transcribed = transcribed_ipa.strip("/[]")

    # Use the existing IPA diff service
    comparison = compare_ipa(clean_expected, clean_transcribed)

    # Build phoneme results from alignment
    phoneme_results = []
    for item in comparison.get("alignment", []):
        phoneme_results.append({
            "phoneme": item.get("target", ""),
            "expected": item.get("target", ""),
            "got": item.get("spoken", item.get("target", "")),
            "correct": item.get("match", False),
            "feedback": item.get("tip", ""),
            "color": item.get("color", "red"),
        })

    accuracy = comparison.get("match_ratio", 0) * 100

    # Generate overall feedback
    if accuracy >= 90:
        feedback = "Excellent! Your pronunciation is very close to the original."
    elif accuracy >= 70:
        feedback = "Good effort! Focus on the highlighted phonemes for improvement."
    elif accuracy >= 50:
        feedback = "Keep practicing! Pay attention to the French nasal vowels and the uvular R."
    else:
        feedback = "Try listening to the sentence again and shadow it more slowly."

    # Save to shadowing_sessions
    try:
        session = models.ShadowingSession(
            card_id=card_id,
            accuracy_pct=accuracy,
            phoneme_results=json.dumps(phoneme_results),
        )
        db.add(session)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save shadowing session: {e}")
        db.rollback()

    return ShadowResponse(
        accuracy_pct=round(accuracy, 1),
        phoneme_results=phoneme_results,
        expected_text=expected_text,
        expected_ipa=expected_ipa,
        transcribed_text=payload.transcribed_text,
        transcribed_ipa=transcribed_ipa,
        overall_feedback=feedback,
        chapter_number=flashcard.chapter_number,
        sentence_order=flashcard.sentence_order,
    )
