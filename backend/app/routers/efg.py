# backend/app/routers/efg.py — SF05/SF11: EFG PIE IPA + audio backfill
from fastapi import APIRouter, Query
import asyncio
import logging
import os
import pyodbc

logger = logging.getLogger(__name__)

router = APIRouter()

_efg_password_cache = None


def _get_efg_password():
    """Get EFG DB password from env var or Secret Manager."""
    global _efg_password_cache
    if _efg_password_cache:
        return _efg_password_cache

    password = os.getenv("EFG_DB_PASSWORD", "")
    if password:
        _efg_password_cache = password
        return password

    # Fallback: fetch from Secret Manager
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = "projects/super-flashcards-475210/secrets/efg-db-password/versions/latest"
        response = client.access_secret_version(request={"name": name})
        password = response.payload.data.decode("UTF-8").strip()
        _efg_password_cache = password
        logger.info("[efg] Password fetched from Secret Manager")
        return password
    except Exception as e:
        logger.error(f"[efg] Failed to fetch password from Secret Manager: {e}")
        # Last resort fallback
        return os.getenv("SQL_PASSWORD", "")


def _get_efg_connection():
    """Connect to EtymologyGraph DB using efg_user via pyodbc."""
    password = _get_efg_password()
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;"
        "DATABASE=EtymologyGraph;"
        "UID=efg_user;"
        f"PWD={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


@router.post("/backfill-pie-ipa")
async def backfill_efg_pie_ipa(
    batch_size: int = Query(default=50, ge=1, le=200),
):
    """Batch-convert PIE root nodes in EtymologyGraph to IPA."""
    from app.services.pie_ipa_service import convert_pie_to_ipa

    conn = _get_efg_connection()
    cursor = conn.cursor()

    cursor.execute(f"""
        SELECT TOP {batch_size} id, label
        FROM nodes
        WHERE node_type = 'pie_root'
          AND pie_ipa IS NULL
        ORDER BY id
    """)
    rows = cursor.fetchall()

    processed = 0
    skipped = 0
    ipa_error_count = 0

    for row in rows:
        node_id, label = row[0], row[1]
        pie_root = label if label.startswith('*') else f'*{label}'
        try:
            ipa = await convert_pie_to_ipa(pie_root)
            if ipa:
                cursor.execute(
                    "UPDATE nodes SET pie_ipa = ? WHERE id = ?",
                    (ipa, node_id),
                )
                conn.commit()
                processed += 1
            else:
                skipped += 1
        except Exception as e:
            logger.error(f"[efg-backfill] Error on node {node_id}: {e}")
            ipa_error_count += 1
        await asyncio.sleep(0.3)

    cursor.execute("""
        SELECT COUNT(*) FROM nodes
        WHERE node_type = 'pie_root' AND pie_ipa IS NULL
    """)
    remaining = cursor.fetchone()[0]

    conn.close()

    return {
        "processed": processed,
        "skipped": skipped,
        "ipa_error_count": ipa_error_count,
        "remaining_estimate": remaining,
    }


@router.post("/backfill-pie-audio")
async def backfill_efg_pie_audio(
    batch_size: int = Query(default=25, ge=1, le=100),
):
    """Generate ElevenLabs audio for EFG PIE_ROOT nodes that have pie_ipa but no pie_audio_url.
    Uses same pie_audio_service.py pipeline as SF flashcards.
    GCS path: pie-audio/efg/{slug}.mp3"""
    from app.services.pie_audio_service import generate_pie_audio_from_ipa
    import re

    conn = _get_efg_connection()
    cursor = conn.cursor()

    cursor.execute(f"""
        SELECT TOP {batch_size} id, label, pie_ipa
        FROM nodes
        WHERE node_type = 'pie_root'
          AND pie_ipa IS NOT NULL
          AND (pie_audio_url IS NULL OR pie_audio_url = '')
        ORDER BY id
    """)
    rows = cursor.fetchall()

    processed = 0
    errors = []

    for row in rows:
        node_id, label, pie_ipa = row[0], row[1], row[2]
        # Create a slug from the label for GCS path
        clean = label.lstrip('*').lower()
        slug = re.sub(r'[^a-z0-9]', '_', clean).strip('_') or str(node_id)
        gcs_path = f"pie-audio/efg/{slug}.mp3"

        try:
            audio_url, ssml_failed = await generate_pie_audio_from_ipa(pie_ipa, gcs_path)
            if audio_url:
                cursor.execute(
                    "UPDATE nodes SET pie_audio_url = ? WHERE id = ?",
                    (audio_url, node_id),
                )
                conn.commit()
                processed += 1
            else:
                errors.append(f"node {node_id}: generate returned None")
        except Exception as e:
            logger.error(f"[efg-audio-backfill] Error on node {node_id}: {e}")
            errors.append(f"node {node_id}: {str(e)[:80]}")
        await asyncio.sleep(1.0)

    cursor.execute("""
        SELECT COUNT(*) FROM nodes
        WHERE node_type = 'pie_root'
          AND pie_ipa IS NOT NULL
          AND (pie_audio_url IS NULL OR pie_audio_url = '')
    """)
    remaining = cursor.fetchone()[0]

    conn.close()

    return {
        "processed": processed,
        "errors": errors[:10],
        "remaining_estimate": remaining,
    }
