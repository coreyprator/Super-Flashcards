# backend/app/routers/admin_bwtl.py — BWTL03 admin coverage + BWTL04 af-jobs proxy
import logging
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(dependencies=[Depends(require_admin)])


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
async def list_af_jobs():
    """Stub: ArtForge jobs list. No list endpoint at ArtForge yet — returns empty."""
    return {"items": [], "total": 0}


@router.get("/bwtl/af-jobs/{job_id}")
async def get_af_job_status(job_id: str):
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


# ── REQ-049: From-figure storyboard proxy (BUG-124) ──────────────────────────
# Calls ArtForge POST /api/v1/stories/from-figure.
# figure_id must be a slug known to Etymython (e.g. "mnemosyne").

_AF_V1_STORIES = "https://artforge-beta-57478301787.us-central1.run.app/api/v1/stories"


@router.post("/bwtl/figures/{figure_id}/story")
async def create_figure_story(figure_id: str):
    """REQ-049: Proxy to ArtForge POST /api/v1/stories/from-figure.
    Creates a story + collection + 3 scenes for the given mythological figure."""
    api_key = os.environ.get("ARTFORGE_EXTERNAL_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="ArtForge API key not configured")
    payload = {"figure": figure_id}
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(
                f"{_AF_V1_STORIES}/from-figure",
                json=payload,
                headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            )
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found in ArtForge")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"ArtForge error: {e}")


# ── REQ-050: Generate imagery proxy (BUG-125) ─────────────────────────────────
# Calls ArtForge POST /api/v1/mythology/generate — DALL-E 3 still image.
# Request: {figure, style: classical|modern|watercolor|sketch}
# Returns: {image_url}

_AF_V1_MYTH = "https://artforge-beta-57478301787.us-central1.run.app/api/v1/mythology"
_VALID_STYLES = {"classical", "modern", "watercolor", "sketch"}


@router.post("/bwtl/figures/{figure_id}/image")
async def generate_figure_image(figure_id: str, style: str = "classical"):
    """REQ-050: Proxy to ArtForge POST /api/v1/mythology/generate (DALL-E 3 still image)."""
    api_key = os.environ.get("ARTFORGE_EXTERNAL_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="ArtForge API key not configured")
    if style not in _VALID_STYLES:
        raise HTTPException(status_code=422, detail=f"style must be one of {sorted(_VALID_STYLES)}")
    payload = {"figure": figure_id, "style": style}
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(
                f"{_AF_V1_MYTH}/generate",
                json=payload,
                headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            )
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Figure '{figure_id}' not found in ArtForge")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"ArtForge error: {e}")

