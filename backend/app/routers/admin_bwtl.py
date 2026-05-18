# backend/app/routers/admin_bwtl.py — BWTL03 admin coverage + BWTL04 af-jobs proxy
import logging
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.dependencies import require_pl

logger = logging.getLogger(__name__)
router = APIRouter()


# 16 healable fields from BWTL01 cross-cutting table
_COVERAGE_FIELDS = [
    {"field": "definition",         "table": "flashcards"},
    {"field": "etymology",          "table": "flashcards"},
    {"field": "english_cognates",   "table": "flashcards"},
    {"field": "related_words",      "table": "flashcards"},
    {"field": "pie_root",           "table": "flashcards"},
    {"field": "pie_meaning",        "table": "flashcards"},
    {"field": "pie_ipa",            "table": "flashcards"},
    {"field": "ipa_pronunciation",  "table": "flashcards"},
    {"field": "gender",             "table": "flashcards"},
    {"field": "preposition_usage",  "table": "flashcards"},
    {"field": "compound_parts",     "table": "flashcards"},
    {"field": "source_book",        "table": "flashcards"},
    {"field": "image_description",  "table": "flashcards"},
    {"field": "translation",        "table": "flashcards"},
    {"field": "cognate_pie_roots",  "table": "flashcards"},
    {"field": "non_pie_reason",     "table": "flashcards"},
]


@router.get("/admin/coverage")
def get_coverage(
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_pl),
):
    """
    BWTL03 BV-014: PL-only endpoint returning live 16-field coverage map.
    Each entry: {field, total_rows, missing_rows, fill_pct}.
    """
    from sqlalchemy import text

    total_sql = "SELECT COUNT(*) FROM flashcards"
    total_rows = db.execute(text(total_sql)).scalar() or 0

    results = []
    for spec in _COVERAGE_FIELDS:
        field = spec["field"]
        missing_sql = text(
            f"SELECT COUNT(*) FROM flashcards WHERE [{field}] IS NULL OR LTRIM(RTRIM(CAST([{field}] AS NVARCHAR(MAX)))) = ''"
        )
        missing = db.execute(missing_sql).scalar() or 0
        fill_pct = round((total_rows - missing) / total_rows * 100, 1) if total_rows else 0.0
        results.append({
            "field": field,
            "total_rows": total_rows,
            "missing_rows": missing,
            "fill_pct": fill_pct,
        })

    return {
        "total_flashcards": total_rows,
        "coverage": results,
    }


# ── ArtForge jobs proxy ────────────────────────────────────────────────────

_AF_BASE = "https://artforge.rentyourcio.com/api/external"


@router.get("/bwtl/af-jobs")
async def list_af_jobs(_user: models.User = Depends(require_pl)):
    """Stub: ArtForge jobs list. No list endpoint at ArtForge yet — returns empty."""
    return {"items": [], "total": 0}


@router.get("/bwtl/af-jobs/{job_id}")
async def get_af_job_status(job_id: str, _user: models.User = Depends(require_pl)):
    """Proxy ArtForge job status check."""
    api_key = os.environ.get("ARTFORGE_EXTERNAL_API_KEY", "")
    url = f"{_AF_BASE}/jobs/{job_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(url, headers={"X-API-Key": api_key})
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"ArtForge error: {e}")
