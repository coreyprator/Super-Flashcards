# backend/app/routers/figures.py
# SF-RAG-NUKE Phase 2 (M06): /api/figures endpoint.
# Queries learning.dbo.mythological_figures (migrated from Etymython DB).
# Replaces cross-origin calls to etymython.rentyourcio.com/api/v1/figures.
import logging
import os
import pyodbc
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["figures"])

_figures_pw_cache = None


def _get_figures_password():
    """Get efg_user password from env var or Secret Manager (same secret as efg_native)."""
    global _figures_pw_cache
    if _figures_pw_cache:
        return _figures_pw_cache
    password = os.getenv("EFG_DB_PASSWORD", "")
    if password:
        _figures_pw_cache = password
        return password
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = "projects/super-flashcards-475210/secrets/efg-db-password/versions/latest"
        response = client.access_secret_version(request={"name": name})
        password = response.payload.data.decode("UTF-8").strip()
        _figures_pw_cache = password
        return password
    except Exception as exc:
        logger.error("[figures] failed to fetch DB password: %s", exc)
        return ""


def _get_learning_connection():
    """Open a pyodbc connection to learning DB using efg_user credentials."""
    password = _get_figures_password()
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;"
        "DATABASE=learning;"
        "UID=efg_user;"
        f"PWD={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


@router.get("/figures")
def get_figures(
    limit: int = Query(500, ge=1, le=1000),
):
    """
    SF-RAG-NUKE Phase 2 (M06): Return mythological figures from learning DB.
    Replaces external calls to etymython.rentyourcio.com/api/v1/figures.
    Returns a plain JSON array compatible with window.BWTL.fetchFigures().
    """
    try:
        conn = _get_learning_connection()
        cursor = conn.cursor()
    except Exception as exc:
        logger.error("[figures] DB connection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Figures query failed")

    try:
        cursor.execute(
            """
            SELECT TOP (?) id, greek_name, latin_name, english_name, figure_type,
                           domain, image_url, role, description, symbols,
                           ipa_transcription, pronunciation_guide, mythology_source,
                           equivalent_figure_id
            FROM mythological_figures
            ORDER BY english_name
            """,
            (limit,),
        )
        rows = cursor.fetchall()
    except Exception as exc:
        logger.error("[figures] query failed: %s", exc)
        conn.close()
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
    conn.close()
    return figures
