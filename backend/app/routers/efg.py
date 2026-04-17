# backend/app/routers/efg.py — SF05: EFG PIE IPA backfill
from fastapi import APIRouter, Query
import asyncio
import logging
import os
import pyodbc

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_efg_connection():
    """Connect to EtymologyGraph DB using efg_user via pyodbc.
    Uses EFG_DB_PASSWORD env var (set from Secret Manager in Cloud Run)."""
    password = os.getenv("EFG_DB_PASSWORD", os.getenv("SQL_PASSWORD", ""))
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
