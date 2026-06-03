# backend/app/routers/dcc_search.py
# SF-ETL-DICT: DCC vocabulary fulltext search endpoint
#
# Route:
#   GET /api/dcc/search?q=<query>[&limit=<n>]
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
router = APIRouter(prefix="/dcc", tags=["dcc-search"])

_MAX_LIMIT = 50


class DccResult(BaseModel):
    id: int
    greek_word: str
    gloss: Optional[str]
    frequency_rank: Optional[int]
    pos: Optional[str]
    semantic_group: Optional[str]


class DccSearchResponse(BaseModel):
    query: str
    results: List[DccResult]
    total: int


@router.get("/search", response_model=DccSearchResponse)
def dcc_search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=_MAX_LIMIT),
    db: Session = Depends(get_db),
):
    """
    Full-text search over dcc_vocabulary (Greek Core List words).

    Uses SQL Server CONTAINS for full-text matching with parameterized
    queries only. Falls back to LIKE if FT index is not yet populated.
    Results ordered by frequency_rank (most common first).
    """
    ft_term = f'"{q}"'

    try:
        rows = db.execute(
            text(
                "SELECT TOP (:limit) [id], [greek_word], [gloss], [frequency_rank], [pos], [semantic_group] "
                "FROM [dbo].[dcc_vocabulary] "
                "WHERE CONTAINS(([greek_word], [gloss]), :ft_term) "
                "ORDER BY COALESCE([frequency_rank], 99999) ASC"
            ),
            {"ft_term": ft_term, "limit": limit},
        ).fetchall()
    except Exception:
        # Fallback: FT index may still be building — use LIKE
        like_term = f"%{q}%"
        rows = db.execute(
            text(
                "SELECT TOP (:limit) [id], [greek_word], [gloss], [frequency_rank], [pos], [semantic_group] "
                "FROM [dbo].[dcc_vocabulary] "
                "WHERE [greek_word] LIKE :like_term OR [gloss] LIKE :like_term "
                "ORDER BY COALESCE([frequency_rank], 99999) ASC"
            ),
            {"like_term": like_term, "limit": limit},
        ).fetchall()

    results = [
        DccResult(
            id=row[0],
            greek_word=row[1],
            gloss=row[2],
            frequency_rank=row[3],
            pos=row[4],
            semantic_group=row[5],
        )
        for row in rows
    ]

    return DccSearchResponse(query=q, results=results, total=len(results))
