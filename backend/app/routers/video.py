"""
SF-VID-001: Word Video generation via ArtForge external API.
POST /api/flashcards/{card_id}/generate-video  → trigger ArtForge pipeline
GET  /api/flashcards/{card_id}/video-status    → poll for video_url
"""

import asyncio
import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app import models

logger = logging.getLogger("sf.video")

router = APIRouter()

ARTFORGE_URL = "https://artforge.rentyourcio.com/api/external"
ARTFORGE_KEY = os.environ.get("ARTFORGE_EXTERNAL_API_KEY", "")


def _build_narrative(card) -> str:
    """Build etymology narrative from flashcard fields."""
    parts = [f"The word '{card.word_or_phrase}' means: {card.definition or 'unknown'}."]
    if card.etymology:
        parts.append(f"Its etymology: {card.etymology}")
    if card.pie_root and card.pie_root != "N/A":
        parts.append(
            f"It descends from the Proto-Indo-European root {card.pie_root}"
            + (f", meaning '{card.pie_meaning}'" if card.pie_meaning else "")
            + "."
        )
    if card.english_cognates:
        parts.append(
            f"Related words in other languages include: {card.english_cognates}. "
            f"These words all share the same ancient ancestor."
        )
    parts.append(
        "Visualize this word's journey through time — from ancient PIE speakers "
        "across thousands of years into modern language."
    )
    return " ".join(parts)


def _get_language_code(card, db: Session) -> str:
    """Resolve language code from card's language_id."""
    lang = db.query(models.Language).filter(models.Language.id == card.language_id).first()
    return lang.code if lang else "en"


async def _poll_and_store(card_id: str, job_id: str) -> None:
    """Background: poll ArtForge until video ready, then store URL."""
    for attempt in range(36):  # up to 6 minutes
        await asyncio.sleep(10)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{ARTFORGE_URL}/jobs/{job_id}",
                    headers={"x-api-key": ARTFORGE_KEY},
                )
            data = resp.json()
            status = data.get("status", "")

            if status == "complete" and data.get("video_url"):
                db = SessionLocal()
                try:
                    db.execute(
                        text("UPDATE flashcards SET video_url = :url, video_job_id = NULL WHERE id = :cid"),
                        {"url": data["video_url"], "cid": card_id},
                    )
                    db.commit()
                    logger.info("[SFVID] Card %s video ready: %s", card_id, data["video_url"])
                finally:
                    db.close()
                return

            if status == "failed":
                logger.error("[SFVID] ArtForge job %s failed: %s", job_id, data.get("error"))
                db = SessionLocal()
                try:
                    db.execute(
                        text("UPDATE flashcards SET video_job_id = NULL WHERE id = :cid"),
                        {"cid": card_id},
                    )
                    db.commit()
                finally:
                    db.close()
                return

        except Exception as e:
            logger.warning("[SFVID] Poll attempt %d for %s: %s", attempt, job_id, e)

    logger.error("[SFVID] Timeout polling job %s for card %s", job_id, card_id)


@router.post("/flashcards/{card_id}/generate-video")
async def generate_card_video(
    card_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Trigger ArtForge video generation for a flashcard."""
    card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if card.video_url:
        return {"status": "already_exists", "video_url": card.video_url}

    if card.video_job_id:
        return {"status": "in_progress", "job_id": card.video_job_id}

    if not ARTFORGE_KEY:
        raise HTTPException(status_code=500, detail="ARTFORGE_EXTERNAL_API_KEY not configured")

    narrative = _build_narrative(card)
    lang_code = _get_language_code(card, db)

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{ARTFORGE_URL}/generate-video",
            headers={"x-api-key": ARTFORGE_KEY, "Content-Type": "application/json"},
            json={
                "title": card.word_or_phrase,
                "narrative": narrative,
                "language": lang_code,
                "style": "cinematic symbolic etymology",
                "duration_seconds": 25,
                "caller_app": "super-flashcards",
            },
        )

    if resp.status_code not in (200, 201, 202):
        logger.error("[SFVID] ArtForge error %d: %s", resp.status_code, resp.text[:300])
        raise HTTPException(status_code=502, detail="ArtForge API error")

    data = resp.json()
    job_id = data["job_id"]

    db.execute(
        text("UPDATE flashcards SET video_job_id = :jid WHERE id = :cid"),
        {"jid": job_id, "cid": card_id},
    )
    db.commit()

    background_tasks.add_task(_poll_and_store, card_id, job_id)

    logger.info("[SFVID] Job %s queued for card %s (%s)", job_id, card_id, card.word_or_phrase)
    return {"status": "queued", "job_id": job_id}


@router.get("/flashcards/{card_id}/video-status")
async def get_video_status(card_id: str, db: Session = Depends(get_db)):
    """Poll video generation status for a card."""
    card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if card.video_url:
        return {"status": "complete", "video_url": card.video_url}
    if card.video_job_id:
        return {"status": "processing", "job_id": card.video_job_id}
    return {"status": "none"}
