# backend/app/routers/etymology_search.py
# SF-ETL-DICT: Etymology fulltext search endpoint
#
# Route:
#   GET /api/etymology/search?q=<query>[&source=<source>][&limit=<n>]
#
# Hard gates:
#   - Parameterized SQL only (zero f-string interpolation in queries)
#   - learning DB only
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/etymology", tags=["etymology-search"])

_VALID_SOURCES = {"beekes", "kroonen", "watkins", "de-vaan", "wiktionary", "__no_match__"}
_MAX_LIMIT = 50


class EtymologyResult(BaseModel):
    id: int
    headword: str
    language: Optional[str]
    source: Optional[str]
    excerpt: Optional[str]
    confidence: Optional[float]


class EtymologySearchResponse(BaseModel):
    query: str
    source: Optional[str]
    results: List[EtymologyResult]
    total: int


@router.get("/search", response_model=EtymologySearchResponse)
def etymology_search(
    q: str = Query(..., min_length=1, max_length=200),
    source: Optional[str] = Query(None, max_length=50),
    limit: int = Query(20, ge=1, le=_MAX_LIMIT),
    db: Session = Depends(get_db),
):
    """
    Full-text search over etymology_entries.

    Uses SQL Server CONTAINS for full-text matching with parameterized
    queries only — no f-string interpolation.
    Falls back to LIKE-based search if CONTAINS returns no results
    (e.g. FT index not yet populated).
    """
    if source is not None and source not in _VALID_SOURCES:
        raise HTTPException(status_code=400, detail=f"Invalid source. Must be one of: {sorted(_VALID_SOURCES)}")

    # Build parameterized WHERE clause
    # CONTAINS requires the search term in double-quotes for a phrase search
    ft_term = f'"{q}"'

    source_filter = ""
    params: dict = {"ft_term": ft_term, "limit": limit, "q_lower": q.lower()}
    if source:
        source_filter = " AND [source] = :source"
        params["source"] = source

    try:
        rows = db.execute(
            text(
                "SELECT TOP (:limit) [id], [headword], [language], [source], [excerpt], [confidence] "
                "FROM [dbo].[etymology_entries] "
                "WHERE CONTAINS(([headword], [excerpt], [full_text], [headword_latin], [headword_ascii]), :ft_term)"
                + source_filter +
                " AND [source] != '__no_match__'"
                " ORDER BY CASE WHEN LOWER([headword]) = :q_lower THEN 0 ELSE 1 END, [confidence] DESC"
            ),
            params,
        ).fetchall()
    except Exception:
        # Fallback: FT index may still be building — use LIKE
        like_term = f"%{q}%"
        params_like: dict = {"like_term": like_term, "limit": limit, "q_lower": q.lower()}
        if source:
            params_like["source"] = source
        rows = db.execute(
            text(
                "SELECT TOP (:limit) [id], [headword], [language], [source], [excerpt], [confidence] "
                "FROM [dbo].[etymology_entries] "
                "WHERE ([headword] LIKE :like_term OR [excerpt] LIKE :like_term"
                " OR [headword_latin] LIKE :like_term OR [headword_ascii] LIKE :like_term)"
                + (" AND [source] = :source" if source else "") +
                " AND [source] != '__no_match__'"
                " ORDER BY CASE WHEN LOWER([headword]) = :q_lower THEN 0 ELSE 1 END, [confidence] DESC"
            ),
            params_like,
        ).fetchall()

    results = [
        EtymologyResult(
            id=row[0],
            headword=row[1],
            language=row[2],
            source=row[3],
            excerpt=row[4],
            confidence=row[5],
        )
        for row in rows
    ]

    return EtymologySearchResponse(
        query=q,
        source=source,
        results=results,
        total=len(results),
    )
