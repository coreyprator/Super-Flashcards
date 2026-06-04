# backend/app/routers/search.py
# BUG-071: Replaced FTS (CONTAINS/FREETEXTTABLE) with LIKE fallback for flashcards table.
# All SQL is fully parameterized — no f-string interpolation of user input.
import time
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/api/search", tags=["search"])

class SearchResult(BaseModel):
    id: str
    word: str
    translation: str
    pronunciation: Optional[str] = None
    etymology: Optional[str] = None
    language_id: str
    language_name: Optional[str] = None
    rank: Optional[int] = None


@router.get("/flashcards")
async def search_flashcards(
    q: str = Query(..., min_length=1),
    language_id: Optional[str] = None,
    search_type: str = Query("simple", regex="^(simple|phrase|ranked|fuzzy)$"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Search flashcards using LIKE (no FTS catalog dependency)."""
    start_time = time.time()

    like_term = f"%{q}%"
    params: dict = {"like_term": like_term}
    lang_clause = ""
    if language_id:
        lang_clause = "AND f.language_id = :language_id"
        params["language_id"] = language_id

    sql_query = text(f"""
        SELECT f.id, f.word_or_phrase AS word, f.definition AS translation, f.etymology,
               f.language_id, l.name AS language_name
        FROM flashcards f
        LEFT JOIN languages l ON f.language_id = l.id
        WHERE (f.word_or_phrase LIKE :like_term
               OR f.definition LIKE :like_term
               OR f.etymology LIKE :like_term)
          {lang_clause}
        ORDER BY f.word_or_phrase
        OFFSET 0 ROWS FETCH NEXT {limit} ROWS ONLY
    """)

    results = db.execute(sql_query, params).fetchall()
    search_time = (time.time() - start_time) * 1000

    return {
        "results": [dict(row._mapping) for row in results],
        "stats": {
            "query": q,
            "total_results": len(results),
            "search_time_ms": round(search_time, 2),
            "search_type": "like",
        },
    }


@router.get("/suggest")
async def search_suggestions(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get search suggestions (autocomplete) via LIKE."""
    sql_query = text(f"""
        SELECT DISTINCT TOP {limit} word_or_phrase AS word, definition AS translation, language_id
        FROM flashcards
        WHERE word_or_phrase LIKE :like_term OR definition LIKE :like_term
        ORDER BY word_or_phrase
    """)
    results = db.execute(sql_query, {"like_term": f"%{q}%"}).fetchall()
    return {"suggestions": [dict(row._mapping) for row in results]}


@router.get("")
async def search_unified(
    q: str = Query(..., min_length=1),
    language_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    REV2-BUILD-001: 3-kind unified search across cards, figures, pie_roots.
    BUG-071: Cards always use LIKE (no FTS). Figures try FTS with LIKE fallback.
    All user input bound via parameterized queries — no f-string interpolation.
    """
    start_time = time.time()

    like_term = f"%{q}%"
    cards_params: dict = {"like_term": like_term}
    cards_lang_clause = ""
    if language_id:
        cards_lang_clause = "AND f.language_id = :language_id"
        cards_params["language_id"] = language_id

    # --- Kind: cards (LIKE only — no FTS catalog dependency) ---
    cards_sql = text(f"""
        SELECT TOP {limit}
            CAST(f.id AS NVARCHAR(50)) AS id,
            f.word_or_phrase AS word,
            f.definition,
            f.etymology,
            f.language_id,
            l.name AS language_name,
            'card' AS kind
        FROM flashcards f
        LEFT JOIN languages l ON f.language_id = l.id
        WHERE (f.word_or_phrase LIKE :like_term OR f.definition LIKE :like_term)
          {cards_lang_clause}
        ORDER BY f.word_or_phrase
    """)
    card_rows = db.execute(cards_sql, cards_params).fetchall()
    cards_results = [dict(r._mapping) for r in card_rows]

    # --- Kind: figures (FTS with LIKE fallback) ---
    try:
        figs_sql = text(f"""
            SELECT TOP {limit}
                CAST(id AS NVARCHAR(50)) AS id,
                english_name AS word,
                description AS definition,
                NULL AS etymology,
                NULL AS language_id,
                NULL AS language_name,
                'figure' AS kind
            FROM mythological_figures
            WHERE CONTAINS((english_name, description), :search_term)
            ORDER BY english_name
        """)
        fig_rows = db.execute(figs_sql, {"search_term": f'"{q}*" OR "{q}"'}).fetchall()
        figs_results = [dict(r._mapping) for r in fig_rows]
    except Exception:
        figs_sql = text(f"""
            SELECT TOP {limit}
                CAST(id AS NVARCHAR(50)) AS id,
                english_name AS word,
                description AS definition,
                NULL AS etymology,
                NULL AS language_id,
                NULL AS language_name,
                'figure' AS kind
            FROM mythological_figures
            WHERE (english_name LIKE :like_term OR description LIKE :like_term)
            ORDER BY english_name
        """)
        fig_rows = db.execute(figs_sql, {"like_term": like_term}).fetchall()
        figs_results = [dict(r._mapping) for r in fig_rows]

    # --- Kind: pie_roots (LIKE) ---
    pie_sql = text(f"""
        SELECT TOP {limit}
            CAST(id AS NVARCHAR(50)) AS id,
            pie_root AS word,
            pie_meaning AS definition,
            NULL AS etymology,
            NULL AS language_id,
            NULL AS language_name,
            'pie_root' AS kind
        FROM flashcard_pie_roots
        WHERE pie_root LIKE :like_term
        GROUP BY id, pie_root, pie_meaning
        ORDER BY pie_root
    """)
    pie_rows = db.execute(pie_sql, {"like_term": like_term}).fetchall()
    pie_results = [dict(r._mapping) for r in pie_rows]

    search_time_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "results": cards_results + figs_results + pie_results,
        "by_kind": {
            "cards": cards_results,
            "figures": figs_results,
            "pie_roots": pie_results,
        },
        "stats": {
            "query": q,
            "language_id": language_id,
            "total": len(cards_results) + len(figs_results) + len(pie_results),
            "search_time_ms": search_time_ms,
        },
    }
