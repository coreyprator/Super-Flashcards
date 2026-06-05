# backend/app/routers/figures.py
# SF-RAG-NUKE Phase 2 (M06): /api/figures endpoint.
# Queries learning.dbo.mythological_figures (migrated from Etymython DB).
# Replaces cross-origin calls to etymython.rentyourcio.com/api/v1/figures.
# Uses main SQLAlchemy get_db session (flashcards_user / LanguageLearning).
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["figures"])


@router.get("/figures")
def get_figures(
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    SF-RAG-NUKE Phase 2 (M06): Return mythological figures from learning DB.
    Replaces external calls to etymython.rentyourcio.com/api/v1/figures.
    Returns a plain JSON array compatible with window.BWTL.fetchFigures().
    """
    try:
        result = db.execute(
            text(
                """
                SELECT TOP (:limit) id, greek_name, latin_name, english_name, figure_type,
                               domain, image_url, role, description, symbols,
                               ipa_transcription, pronunciation_guide, mythology_source,
                               equivalent_figure_id
                FROM mythological_figures
                ORDER BY english_name
                """
            ),
            {"limit": limit},
        )
        rows = result.fetchall()
    except Exception as exc:
        logger.error("[figures] query failed: %s", exc)
        raise HTTPException(status_code=500, detail="Figures query failed")

    figures = [
        {
            "id": r.id,
            "greek_name": r.greek_name,
            "latin_name": r.latin_name,
            "english_name": r.english_name,
            "name": r.english_name or r.greek_name or r.latin_name,
            "figure_type": r.figure_type,
            "domain": r.domain,
            "image_url": r.image_url,
            "role": r.role,
            "description": r.description,
            "symbols": r.symbols,
            "ipa_transcription": r.ipa_transcription,
            "pronunciation_guide": r.pronunciation_guide,
            "mythology_source": r.mythology_source,
            "equivalent_figure_id": r.equivalent_figure_id,
        }
        for r in rows
    ]
    return figures
