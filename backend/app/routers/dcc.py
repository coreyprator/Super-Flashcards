"""
SF-DCC-001: DCC (Dickinson College Commentaries) Greek Core List lookup.
GET /api/v1/cards/{id}/dcc

Fetches DCC data for a card's Greek lemma from the PIE Network Graph API.
Results are cached in-memory (static data, rarely changes).
"""

import unicodedata
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()

PIE_API_URL = "https://efg.rentyourcio.com/api/words?include_dcc=true"
DCC_SITE_URL = "https://dcc.dickinson.edu/greek-core-list"

# In-memory cache: stripped_lemma -> dcc word dict
_dcc_cache: Optional[dict] = None


def _strip_accents(s: str) -> str:
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfkd if unicodedata.category(c) != "Mn").lower().strip()


async def _load_dcc_data() -> dict:
    """Fetch DCC word list from PIE API and return as dict keyed by stripped lemma."""
    global _dcc_cache
    if _dcc_cache is not None:
        return _dcc_cache

    logger.info("Loading DCC word list from PIE Network Graph API...")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(PIE_API_URL)
        response.raise_for_status()

    data = response.json()
    words = data if isinstance(data, list) else data.get("words", data.get("nodes", []))
    dcc_words = [w for w in words if w.get("frequency_rank")]

    _dcc_cache = {_strip_accents(w.get("label", "")): w for w in dcc_words if w.get("label")}
    logger.info(f"DCC cache loaded: {len(_dcc_cache)} words")
    return _dcc_cache


@router.get("/v1/cards/{card_id}/dcc")
async def get_card_dcc(card_id: str, db: Session = Depends(get_db)):
    """
    Look up DCC Greek Core List data for a flashcard's lemma.
    Returns DCC rank, definition, part of speech, and source link.
    Returns 404 if the card doesn't exist or has no DCC match.
    """
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    lemma = (flashcard.word_or_phrase or "").strip()
    if not lemma:
        return {"matched": False}

    try:
        dcc_data = await _load_dcc_data()
    except Exception as e:
        logger.error(f"Failed to load DCC data: {e}")
        raise HTTPException(status_code=502, detail="DCC data unavailable")

    stripped = _strip_accents(lemma)
    match = dcc_data.get(stripped)

    if not match:
        return {"matched": False}

    return {
        "matched": True,
        "dcc_rank": match.get("frequency_rank"),
        "lemma": match.get("label"),
        "definition": match.get("gloss"),
        "part_of_speech": match.get("pos"),
        "semantic_group": match.get("semantic_group"),
        "dcc_url": DCC_SITE_URL,
    }
