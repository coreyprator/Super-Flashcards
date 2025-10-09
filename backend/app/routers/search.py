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
