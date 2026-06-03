# backend/app/routers/admin_etl.py
# SF-ETL-DICT: Admin ETL — apply migrations + dictionary ETL from Portfolio RAG
#
# Routes:
#   POST /admin/apply-migration   — one-shot SQL migration runner
#   POST /admin/etl-dictionary    — idempotent dictionary ETL from RAG/EFG API
#
# Hard gates:
#   - Parameterized SQL only (zero f-string interpolation in queries)
#   - learning DB only (enforced via get_db which reads SQL_DATABASE env)
#   - No FE wiring changes
import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db, engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin-etl"])

# External service URLs — no user-controlled input used in URL construction
_RAG_URL = "https://portfolio-rag-57478301787.us-central1.run.app"
_EFG_URL = "https://efg.rentyourcio.com/api/words"

# Path to migrations directory (relative to this file)
_MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"

# Batch size for etymology ETL: flashcards processed per call
_ETY_BATCH_SIZE = 50

# Number of RAG results requested per flashcard headword query
_RAG_N = 5

# Source normalisation map: partial filename → canonical short name
_SOURCE_MAP = {
    "beekes": "beekes",
    "proto-germani": "kroonen",
    "proto_germani": "kroonen",
    "watkins": "watkins",
    "de vaan": "de-vaan",
    "de_vaan": "de-vaan",
    "wiktionary": "wiktionary",
}

# Language per canonical source
_SOURCE_LANGUAGE = {
    "beekes": "Greek",
    "kroonen": "Proto-Germanic",
    "watkins": "PIE",
    "de-vaan": "Latin",
    "wiktionary": "various",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalise_source(raw_source: str) -> str:
    """Map a raw RAG source filename to a canonical short name."""
    lower = raw_source.lower()
    for key, name in _SOURCE_MAP.items():
        if key in lower:
            return name
    return "unknown"


def _rag_source_id(source: str, full_text: str) -> str:
    """Stable 64-char SHA-256 hex of source + full_text for deduplication."""
    payload = f"{source}\x00{full_text}"
    return hashlib.sha256(payload.encode("utf-8", errors="replace")).hexdigest()


# ── POST /admin/apply-migration ───────────────────────────────────────────────

class ApplyMigrationRequest(BaseModel):
    migration: str  # e.g. "sf_etl_dict_001" (filename without .sql)


class ApplyMigrationResponse(BaseModel):
    migration: str
    statements_executed: int
    status: str
    detail: str


@router.post("/apply-migration", response_model=ApplyMigrationResponse)
def apply_migration(req: ApplyMigrationRequest, db: Session = Depends(get_db)):
    """
    Execute a named SQL migration file from backend/app/migrations/.
    Accepts only alphanumeric + underscore migration names to prevent path traversal.
    Idempotent — all statements are guarded with IF NOT EXISTS in the SQL file.
    """
    # Validate migration name: only alphanum + underscores (no path traversal)
    if not re.fullmatch(r"[a-zA-Z0-9_]+", req.migration):
        raise HTTPException(status_code=400, detail="Invalid migration name.")

    sql_path = _MIGRATIONS_DIR / f"{req.migration}.sql"
    if not sql_path.exists():
        raise HTTPException(status_code=404, detail=f"Migration file not found: {req.migration}.sql")

    try:
        sql_content = sql_path.read_text(encoding="utf-8")
    except OSError as exc:
        logger.error("Cannot read migration file %s: %s", sql_path, exc)
        raise HTTPException(status_code=500, detail="Cannot read migration file.")

    # Split on GO statements (SQL Server batch separator), filtering out
    # entirely blank/comment-only batches.
    raw_batches = re.split(r"(?im)^\s*GO\s*$", sql_content)
    # If no GO separators, treat the whole file as one batch
    if len(raw_batches) == 1:
        raw_batches = [sql_content]
    executed = 0
    for batch in raw_batches:
        batch = batch.strip()
        # Skip batches that are empty or contain only comment lines
        non_comment = "\n".join(
            line for line in batch.splitlines()
            if line.strip() and not line.strip().startswith("--")
        ).strip()
        if not non_comment:
            continue

        # SQL Server requires FULLTEXT DDL to run outside any transaction
        needs_autocommit = any(
            kw in non_comment.upper()
            for kw in ("FULLTEXT CATALOG", "FULLTEXT INDEX")
        )

        try:
            if needs_autocommit:
                with engine.execution_options(isolation_level="AUTOCOMMIT").connect() as conn:
                    conn.execute(text(batch))
            else:
                db.execute(text(batch))
                db.commit()
            executed += 1
        except Exception as exc:
            db.rollback()
            logger.error("Migration %s failed on batch: %s\nError: %s", req.migration, batch[:200], exc)
            raise HTTPException(
                status_code=500,
                detail=f"Migration '{req.migration}' failed: {exc}",
            )

    logger.info("Migration %s applied: %d batches executed.", req.migration, executed)
    return ApplyMigrationResponse(
        migration=req.migration,
        statements_executed=executed,
        status="ok",
        detail=f"Migration applied successfully ({executed} batch(es) executed).",
    )


# ── POST /admin/etl-dictionary ────────────────────────────────────────────────

class EtlDictionaryResponse(BaseModel):
    processed: int
    skipped: int
    errors: int
    total_remaining: int
    detail: str


@router.post("/etl-dictionary", response_model=EtlDictionaryResponse)
async def etl_dictionary(db: Session = Depends(get_db)):
    """
    Idempotent ETL that populates:
      - learning.dbo.dcc_vocabulary  (from EFG /api/words)
      - learning.dbo.etymology_entries (from Portfolio RAG semantic search)

    Processes one batch per call.  Repeat until total_remaining == 0.
    Returns: processed / skipped / errors / total_remaining.
    """
    processed = 0
    skipped = 0
    errors = 0

    # ── Step A: DCC vocabulary (all 519 in one pass) ─────────────────────────
    dcc_count: int = db.execute(text("SELECT COUNT(*) FROM [dbo].[dcc_vocabulary]")).scalar() or 0

    if dcc_count < 519:
        dcc_result = await _etl_dcc(db)
        processed += dcc_result["processed"]
        skipped += dcc_result["skipped"]
        errors += dcc_result["errors"]
        dcc_count = db.execute(text("SELECT COUNT(*) FROM [dbo].[dcc_vocabulary]")).scalar() or 0

    dcc_remaining = max(0, 519 - dcc_count)

    # ── Step B: Etymology entries (batch of SF flashcard words) ──────────────
    ety_result = await _etl_etymology_batch(db)
    processed += ety_result["processed"]
    skipped += ety_result["skipped"]
    errors += ety_result["errors"]
    ety_remaining = ety_result["remaining"]

    total_remaining = dcc_remaining + ety_remaining

    detail_parts = [
        f"DCC: {dcc_count}/519",
        f"Etymology batched: {ety_result['processed']} new, {ety_result['skipped']} skip",
        f"Remaining: {total_remaining}",
    ]

    return EtlDictionaryResponse(
        processed=processed,
        skipped=skipped,
        errors=errors,
        total_remaining=total_remaining,
        detail="; ".join(detail_parts),
    )


# ── DCC ETL helper ────────────────────────────────────────────────────────────

async def _etl_dcc(db: Session) -> dict:
    """Fetch all 519 DCC Greek Core List words from EFG API, insert new rows."""
    processed = 0
    skipped = 0
    errors = 0

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(_EFG_URL, params={"include_dcc": "true"})
        resp.raise_for_status()
    except Exception as exc:
        logger.error("EFG API fetch failed: %s", exc)
        return {"processed": 0, "skipped": 0, "errors": 1}

    data = resp.json()
    words = data if isinstance(data, list) else data.get("words", data.get("nodes", []))
    dcc_words = [w for w in words if w.get("frequency_rank")]

    for word in dcc_words:
        greek_word = (word.get("label") or "").strip()
        if not greek_word:
            errors += 1
            continue

        exists: int = db.execute(
            text("SELECT COUNT(*) FROM [dbo].[dcc_vocabulary] WHERE [greek_word] = :gw"),
            {"gw": greek_word},
        ).scalar() or 0

        if exists:
            skipped += 1
            continue

        try:
            db.execute(
                text(
                    "INSERT INTO [dbo].[dcc_vocabulary] "
                    "([greek_word], [lemma], [gloss], [frequency_rank], [pos], [semantic_group]) "
                    "VALUES (:greek_word, :lemma, :gloss, :frequency_rank, :pos, :semantic_group)"
                ),
                {
                    "greek_word": greek_word,
                    "lemma": greek_word,
                    "gloss": (word.get("gloss") or "")[:500],
                    "frequency_rank": word.get("frequency_rank"),
                    "pos": (word.get("pos") or "")[:200],
                    "semantic_group": (word.get("semantic_group") or "")[:100],
                },
            )
            db.commit()
            processed += 1
        except Exception as exc:
            db.rollback()
            logger.warning("DCC insert failed for '%s': %s", greek_word, exc)
            errors += 1

    logger.info("DCC ETL: processed=%d skipped=%d errors=%d", processed, skipped, errors)
    return {"processed": processed, "skipped": skipped, "errors": errors}


# ── Etymology ETL helper ──────────────────────────────────────────────────────

async def _etl_etymology_batch(db: Session) -> dict:
    """
    Fetch the next batch of SF flashcard headwords that have no etymology entries,
    query Portfolio RAG for each, insert new rows.  Returns remaining count.
    """
    processed = 0
    skipped = 0
    errors = 0

    # Flashcards whose word_or_phrase has no etymology entries yet
    batch_rows = db.execute(
        text(
            "SELECT TOP (:batch_size) [word_or_phrase] "
            "FROM [dbo].[flashcards] "
            "WHERE [word_or_phrase] IS NOT NULL "
            "  AND [word_or_phrase] != '' "
            "  AND [word_or_phrase] NOT IN ("
            "      SELECT [headword] FROM [dbo].[etymology_entries]"
            "  )"
        ),
        {"batch_size": _ETY_BATCH_SIZE},
    ).fetchall()

    for row in batch_rows:
        headword = (row[0] or "").strip()
        if not headword:
            continue

        try:
            rag_results = await _query_rag_etymology(headword)
        except Exception as exc:
            logger.warning("RAG query failed for '%s': %s", headword, exc)
            errors += 1
            continue

        if not rag_results:
            # Insert a sentinel so this word is not re-queried every batch
            _insert_etymology_sentinel(db, headword)
            skipped += 1
            continue

        for result in rag_results:
            raw_source = result.get("source", "")
            full_text = (result.get("full_text") or result.get("snippet") or "").strip()
            if not full_text:
                continue

            rag_id = _rag_source_id(raw_source, full_text)
            already: int = db.execute(
                text("SELECT COUNT(*) FROM [dbo].[etymology_entries] WHERE [rag_source_id] = :rid"),
                {"rid": rag_id},
            ).scalar() or 0

            if already:
                skipped += 1
                continue

            canonical_source = _normalise_source(raw_source)
            language = _SOURCE_LANGUAGE.get(canonical_source, "unknown")
            excerpt = full_text[:1000]

            try:
                db.execute(
                    text(
                        "INSERT INTO [dbo].[etymology_entries] "
                        "([headword], [language], [source], [excerpt], [full_text], "
                        " [page_ref], [confidence], [rag_source_id]) "
                        "VALUES (:headword, :language, :source, :excerpt, :full_text, "
                        "        :page_ref, :confidence, :rag_source_id)"
                    ),
                    {
                        "headword": headword[:200],
                        "language": language[:50],
                        "source": canonical_source[:100],
                        "excerpt": excerpt,
                        "full_text": full_text,
                        "page_ref": str(result.get("page") or "")[:50] or None,
                        "confidence": result.get("score"),
                        "rag_source_id": rag_id,
                    },
                )
                db.commit()
                processed += 1
            except Exception as exc:
                db.rollback()
                logger.warning("Etymology insert failed for '%s': %s", headword, exc)
                errors += 1

    # Remaining: flashcards still without any etymology entry
    remaining: int = db.execute(
        text(
            "SELECT COUNT(*) FROM [dbo].[flashcards] "
            "WHERE [word_or_phrase] IS NOT NULL "
            "  AND [word_or_phrase] != '' "
            "  AND [word_or_phrase] NOT IN ("
            "      SELECT [headword] FROM [dbo].[etymology_entries]"
            "  )"
        )
    ).scalar() or 0

    logger.info(
        "Etymology ETL batch: processed=%d skipped=%d errors=%d remaining=%d",
        processed, skipped, errors, remaining,
    )
    return {"processed": processed, "skipped": skipped, "errors": errors, "remaining": remaining}


async def _query_rag_etymology(headword: str) -> list:
    """Query Portfolio RAG etymology collection for a headword. Returns result list."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{_RAG_URL}/semantic",
            params={"q": headword, "collection": "etymology", "n": _RAG_N},
        )
    if resp.status_code != 200:
        return []
    data = resp.json()
    results = data.get("results", [])
    # Only keep results with meaningful confidence
    return [r for r in results if r.get("score", 0) >= 0.25]


def _insert_etymology_sentinel(db: Session, headword: str) -> None:
    """Insert a no-match sentinel so the headword is not re-queried on subsequent batches."""
    sentinel_id = _rag_source_id("__sentinel__", headword)
    exists: int = db.execute(
        text("SELECT COUNT(*) FROM [dbo].[etymology_entries] WHERE [rag_source_id] = :rid"),
        {"rid": sentinel_id},
    ).scalar() or 0
    if exists:
        return
    try:
        db.execute(
            text(
                "INSERT INTO [dbo].[etymology_entries] "
                "([headword], [language], [source], [excerpt], [full_text], "
                " [page_ref], [confidence], [rag_source_id]) "
                "VALUES (:headword, 'unknown', '__no_match__', NULL, NULL, "
                "        NULL, NULL, :rag_source_id)"
            ),
            {"headword": headword[:200], "rag_source_id": sentinel_id},
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.debug("Sentinel insert skipped for '%s': %s", headword, exc)
