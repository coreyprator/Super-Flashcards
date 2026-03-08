"""
SF-027: Word Family Graph endpoint.
GET /api/cards/{card_id}/word-family
Returns the card's cognates from the Etymython database cognate tables.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import os

from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_etymython_connection_string() -> str:
    """Build connection string for Etymython database (same SQL Server instance)."""
    server = os.getenv("SQL_SERVER", "35.224.242.223")
    password = os.getenv("SQL_PASSWORD", "")
    return (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server},1433;"
        f"DATABASE=Etymython;"
        f"UID=sqlserver;"
        f"PWD={password};"
        f"TrustServerCertificate=yes;"
    )


@router.get("/cards/{card_id}/word-family")
async def get_word_family(card_id: str, db: Session = Depends(get_db)):
    """
    Get cognate words linked to this flashcard from the Etymython database.
    Uses cross-database query since both DBs are on the same SQL Server instance.
    """
    # Query Etymython DB for cognates linked to this SF card
    # english_cognates.sf_card_id links back to this flashcard
    # etymology_cognates links cognate_id -> etymology_id (figure)
    # Other cognates share the same etymology_id
    query = text("""
        SELECT
            ec.word,
            ec.definition,
            ec.part_of_speech,
            etc.derivation_path,
            mf.english_name AS figure_name,
            mf.domain AS figure_domain,
            -- Get sibling cognates (other words from the same etymology/figure)
            sibling.word AS sibling_word,
            sibling.definition AS sibling_definition
        FROM Etymython.dbo.english_cognates ec
        JOIN Etymython.dbo.etymology_cognates etc ON ec.id = etc.cognate_id
        JOIN Etymython.dbo.mythological_figures mf ON etc.etymology_id = mf.id
        LEFT JOIN Etymython.dbo.etymology_cognates sibling_etc
            ON sibling_etc.etymology_id = etc.etymology_id
            AND sibling_etc.cognate_id != etc.cognate_id
        LEFT JOIN Etymython.dbo.english_cognates sibling
            ON sibling.id = sibling_etc.cognate_id
        WHERE ec.sf_card_id = :card_id
        ORDER BY ec.word, sibling.word
    """)

    try:
        result = db.execute(query, {"card_id": card_id})
        rows = result.fetchall()
    except Exception as e:
        logger.error(f"Word family query failed for card {card_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    if not rows:
        return {"card_id": card_id, "cognates": [], "figures": []}

    # Build response: group by figure, collect siblings
    figures = {}
    root_word = None
    root_definition = None

    for row in rows:
        word, definition, pos, derivation, fig_name, fig_domain, sib_word, sib_def = row

        if root_word is None:
            root_word = word
            root_definition = definition

        if fig_name not in figures:
            figures[fig_name] = {
                "figure": fig_name,
                "domain": fig_domain,
                "derivation_path": derivation,
                "siblings": []
            }

        if sib_word and sib_word not in [s["word"] for s in figures[fig_name]["siblings"]]:
            figures[fig_name]["siblings"].append({
                "word": sib_word,
                "definition": sib_def
            })

    # Build flat cognate list for the graph
    cognates = []
    seen = set()
    for fig in figures.values():
        for sib in fig["siblings"]:
            if sib["word"] not in seen:
                cognates.append({
                    "word": sib["word"],
                    "meaning": sib["definition"],
                    "language": "English",
                    "figure": fig["figure"]
                })
                seen.add(sib["word"])

    return {
        "card_id": card_id,
        "root_word": root_word,
        "root_definition": root_definition,
        "cognates": cognates,
        "figures": list(figures.values())
    }
