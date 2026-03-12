"""
SF-DCC-001: DCC (Dickinson College Commentaries) Greek Core List lookup.
GET /api/v1/cards/{id}/dcc

Fetches DCC data for a card's Greek lemma from the PIE Network Graph API.
Results are cached in-memory (static data, rarely changes).
"""

import unicodedata
import logging
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()

PIE_API_URL = "https://efg.rentyourcio.com/api/words?include_dcc=true"
RAG_URL = "https://portfolio-rag-57478301787.us-central1.run.app"
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
async def get_card_dcc(card_id: UUID = Path(...), db: Session = Depends(get_db)):
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

    # Fetch rich content from Portfolio RAG dcc collection
    rich = await _fetch_rag_rich(match.get("label", ""), match.get("gloss", ""))

    return {
        "matched": True,
        "rank": match.get("frequency_rank"),
        "lemma": match.get("label"),
        "gloss": match.get("gloss"),
        "pos": rich.get("part_of_speech", match.get("pos")) if rich else match.get("pos"),
        "transliteration": match.get("transliteration"),
        "extended_def": rich.get("extended_def", match.get("gloss")) if rich else match.get("gloss"),
        "principal_parts": None,
        "cognates": rich.get("cognates", []) if rich else (
            [c.strip() for c in match.get("english_cognates", "").split(",")]
            if match.get("english_cognates") else []
        ),
        "usage_note": rich.get("usage_note") if rich else None,
        "frequency_context": rich.get("frequency_context") if rich else f"Rank {match.get('frequency_rank')} of 519",
        "semantic_group": rich.get("semantic_group", match.get("semantic_group")) if rich else match.get("semantic_group"),
        "pie_root": rich.get("pie_root") if rich else None,
        "dcc_url": DCC_SITE_URL,
    }


async def _fetch_rag_rich(lemma: str, gloss: str) -> dict | None:
    """Query Portfolio RAG dcc collection for rich content."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{RAG_URL}/semantic",
                params={"q": f"{lemma} {gloss}", "collection": "dcc", "n": 1},
            )
        if resp.status_code != 200:
            return None
        results = resp.json().get("results", [])
        if not results or results[0].get("score", 0) < 0.3:
            return None
        snippet = results[0].get("snippet", "")
        rich = {}
        for line in snippet.split("\n"):
            line = line.strip()
            if line.startswith("**Definition:**"):
                rich["extended_def"] = line.replace("**Definition:**", "").strip()
            elif line.startswith("**Part of speech:**"):
                rich["part_of_speech"] = line.replace("**Part of speech:**", "").strip()
            elif line.startswith("**PIE root:**"):
                rich["pie_root"] = line.replace("**PIE root:**", "").strip()
            elif line.startswith("**English cognates:**"):
                cognates_str = line.replace("**English cognates:**", "").strip()
                rich["cognates"] = [c.strip() for c in cognates_str.split(",")]
            elif line.startswith("**Frequency context:**"):
                rich["frequency_context"] = line.replace("**Frequency context:**", "").strip()
            elif line.startswith("**Usage note:**"):
                rich["usage_note"] = line.replace("**Usage note:**", "").strip()
            elif line.startswith("**Semantic group:**"):
                rich["semantic_group"] = line.replace("**Semantic group:**", "").strip()
        return rich if rich else None
    except Exception:
        return None
