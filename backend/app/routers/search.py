# backend/app/routers/search.py
from fastapi import APIRouter, Depends, HTTPException, Query
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
    """Search flashcards using full-text search"""
    import time
    start_time = time.time()
    
    try:
        clean_query = q.replace("'", "''")
        
        if search_type == "ranked":
            sql_query = text(f"""
                SELECT f.id, f.word_or_phrase as word, f.definition as translation, f.etymology,
                       f.language_id, l.name as language_name, ft.[RANK] as rank
                FROM flashcards f
                INNER JOIN FREETEXTTABLE(flashcards, (word_or_phrase, definition, etymology), '{clean_query}') ft
                    ON f.id = ft.[KEY]
                LEFT JOIN languages l ON f.language_id = l.id
                WHERE 1=1 {f"AND f.language_id = '{language_id}'" if language_id else ""}
                ORDER BY ft.[RANK] DESC
                OFFSET 0 ROWS FETCH NEXT {limit} ROWS ONLY
            """)
        else:
            if search_type == "phrase":
                search_cond = f'CONTAINS((word_or_phrase, definition, etymology), \'"{clean_query}"\')'
            elif search_type == "fuzzy":
                search_cond = f'CONTAINS((word_or_phrase, definition, etymology), \'"{clean_query}*"\')'
            else:
                search_cond = f'CONTAINS((word_or_phrase, definition, etymology), \'{clean_query}\')'
            
            sql_query = text(f"""
                SELECT f.id, f.word_or_phrase as word, f.definition as translation, f.etymology,
                       f.language_id, l.name as language_name
                FROM flashcards f
                LEFT JOIN languages l ON f.language_id = l.id
                WHERE {search_cond} {f"AND f.language_id = '{language_id}'" if language_id else ""}
                ORDER BY f.created_at DESC
                OFFSET 0 ROWS FETCH NEXT {limit} ROWS ONLY
            """)
        
        results = db.execute(sql_query).fetchall()
        search_time = (time.time() - start_time) * 1000
        
        return {
            "results": [dict(row._mapping) for row in results],
            "stats": {
                "query": q,
                "total_results": len(results),
                "search_time_ms": round(search_time, 2),
                "search_type": search_type
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggest")
async def search_suggestions(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get search suggestions (autocomplete)"""
    clean_query = q.replace("'", "''")
    sql_query = text(f"""
        SELECT DISTINCT TOP {limit} word_or_phrase as word, definition as translation, language_id
        FROM flashcards
        WHERE CONTAINS((word_or_phrase, definition), '"{clean_query}*"')
        ORDER BY word_or_phrase
    """)
    results = db.execute(sql_query).fetchall()
    return {"suggestions": [dict(row._mapping) for row in results]}


@router.get("")
async def search_unified(
    q: str = Query(..., min_length=1),
    language_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    REV2-BUILD-001: 3-kind unified full-text search across cards, figures, pie_roots.
    All data served from the learning DB (no cross-service calls).
    """
    import time
    start_time = time.time()

    clean_q = q.replace("'", "''")
    lang_filter = f"AND language_id = '{language_id}'" if language_id else ""

    # --- Kind: cards ---
    try:
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
            WHERE CONTAINS((word_or_phrase, definition, etymology), :search_term)
              {lang_filter}
            ORDER BY f.word_or_phrase
        """)
        card_rows = db.execute(cards_sql, {"search_term": f'"{clean_q}*" OR "{clean_q}"'}).fetchall()
        cards_results = [dict(r._mapping) for r in card_rows]
    except Exception:
        # FTS index may not be ready; fall back to LIKE
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
              {lang_filter}
            ORDER BY f.word_or_phrase
        """)
        card_rows = db.execute(cards_sql, {"like_term": f"%{clean_q}%"}).fetchall()
        cards_results = [dict(r._mapping) for r in card_rows]

    # --- Kind: figures ---
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
        fig_rows = db.execute(figs_sql, {"search_term": f'"{clean_q}*" OR "{clean_q}"'}).fetchall()
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
        fig_rows = db.execute(figs_sql, {"like_term": f"%{clean_q}%"}).fetchall()
        figs_results = [dict(r._mapping) for r in fig_rows]

    # --- Kind: pie_roots ---
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
    pie_rows = db.execute(pie_sql, {"like_term": f"%{clean_q}%"}).fetchall()
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
        }
    }
