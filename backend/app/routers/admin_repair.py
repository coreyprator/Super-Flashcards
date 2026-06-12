# backend/app/routers/admin_repair.py — BWTLGO5: admin role required (require_admin)
# SF18 REQ-022 — Standard PIE Relationship Repair Process
# 7-layer atomic write: flashcards + junction + EFG node + EFG edges + state invalidation + audio + audit log
import json
import logging
import re
import unicodedata
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text as _text

from app.database import get_db
from app import models
from app.routers.efg import _get_efg_connection
from app.default_user import get_default_user_email
from app.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin-repair"], dependencies=[Depends(require_admin)])


# ── Request/Response schemas ─────────────────────────────────────────────────

class RepairPieRequest(BaseModel):
    card_id: str
    pie_root: str
    pie_meaning: Optional[str] = None
    pie_ipa: Optional[str] = None
    efg_node_id_override: Optional[str] = None  # None = auto-resolve
    regenerate_audio: bool = True
    triggered_by: str = "admin_api"


class RepairPieResponse(BaseModel):
    log_id: int
    card_id: str
    word_or_phrase: Optional[str]
    layers_written: List[str]
    before: dict
    after: dict


class RepairPieBatchRequest(BaseModel):
    repairs: List[RepairPieRequest]


class RepairPieBatchResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    results: List[dict]


# ── EFG slug helper (mirrors flashcards.py BUG-035 logic) ───────────────────

def _make_efg_slug(label: str, cursor) -> str:
    """Derive a stable pie_ slug from a PIE root label, unique in EFG nodes."""
    s = label.replace('*', '').replace('\u02b7', 'w').replace('\u02b0', 'h')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if unicodedata.category(c) not in ('Mn', 'Mc'))
    for old, new in [('\u2081', '1'), ('\u2082', '2'), ('\u2083', '3'), ('\u2084', '4')]:
        s = s.replace(old, new)
    s = re.sub(r'[^a-z0-9\-]', '_', s.lower())
    s = s.replace('-', '_')
    s = re.sub(r'_+', '_', s).strip('_')
    slug = 'pie_' + s
    if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (slug,)).fetchone():
        return slug
    for i in range(2, 20):
        candidate = f"{slug}_{i}"
        if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (candidate,)).fetchone():
            return candidate
    return slug + '_x'


# ── Core repair function ─────────────────────────────────────────────────────

async def _repair_one(req: RepairPieRequest, db: Session, admin_email: str) -> dict:
    """
    Execute a 7-layer atomic repair for a single card.

    Layers:
      1. Capture before_json
      2. Resolve / create EFG node (EtymologyGraph.nodes)
      3. UPDATE flashcards
      4. UPDATE flashcard_pie_roots (role='root', display_order=0)
      5. UPDATE EtymologyGraph.edges (DELETE stale + INSERT new pie_to_word edge)
      6. Regenerate PIE audio (if requested) → write pie_audio_url to both tables
      7. INSERT audit log row, return result
    """
    layers: List[str] = []

    # ── Layer 1: capture before state ──────────────────────────────────────
    fc_before = db.execute(
        _text("""
            SELECT id, word_or_phrase, pie_root, pie_ipa, pie_meaning,
                   efg_node_id, pie_audio_url
            FROM flashcards WHERE id = :cid
        """),
        {"cid": req.card_id}
    ).fetchone()

    if not fc_before:
        raise HTTPException(status_code=404, detail=f"Card not found: {req.card_id}")

    jt_before = db.execute(
        _text("""
            SELECT id, pie_root, pie_ipa, pie_meaning, pie_audio_url, efg_node_id
            FROM flashcard_pie_roots
            WHERE flashcard_id = :cid AND display_order = 0
        """),
        {"cid": req.card_id}
    ).fetchone()

    before_json = {
        "flashcard": {
            "pie_root": fc_before.pie_root,
            "pie_ipa": fc_before.pie_ipa,
            "pie_meaning": fc_before.pie_meaning,
            "efg_node_id": fc_before.efg_node_id,
            "pie_audio_url": fc_before.pie_audio_url,
        },
        "junction": {
            "pie_root": jt_before.pie_root if jt_before else None,
            "pie_ipa": jt_before.pie_ipa if jt_before else None,
            "pie_meaning": jt_before.pie_meaning if jt_before else None,
            "pie_audio_url": jt_before.pie_audio_url if jt_before else None,
            "efg_node_id": jt_before.efg_node_id if jt_before else None,
        } if jt_before else None,
    }
    layers.append("before_captured")

    # ── Layer 2: resolve EFG node ───────────────────────────────────────────
    efg_node_id = req.efg_node_id_override
    try:
        conn_efg = _get_efg_connection()
        cur_efg = conn_efg.cursor()
        if efg_node_id is None:
            row = cur_efg.execute(
                "SELECT id FROM nodes WHERE label = ?", (req.pie_root,)
            ).fetchone()
            if row:
                efg_node_id = row[0]
                logger.info(f"[REQ-022] EFG node found: {efg_node_id} for '{req.pie_root}'")
            else:
                efg_node_id = _make_efg_slug(req.pie_root, cur_efg)
                gloss = req.pie_meaning or ""
                cur_efg.execute(
                    """INSERT INTO nodes (id, label, gloss, pie_root, language, node_type, source)
                       VALUES (?, ?, ?, ?, 'PIE', 'pie_root', 'sf17-repair')""",
                    (efg_node_id, req.pie_root, gloss, req.pie_root)
                )
                conn_efg.commit()
                logger.info(f"[REQ-022] EFG node created: {efg_node_id} for '{req.pie_root}'")
        conn_efg.close()
        layers.append("efg_node_resolved")
    except Exception as efg_err:
        logger.warning(f"[REQ-022] EFG resolve failed for card {req.card_id}: {efg_err}")
        efg_node_id = efg_node_id or fc_before.efg_node_id  # fallback: keep existing

    # Begin transaction: layers 3–5 run together, rollback on failure
    try:
        # ── Layer 3: UPDATE flashcards ──────────────────────────────────────
        db.execute(
            _text("""
                UPDATE flashcards
                SET pie_root     = :pie_root,
                    pie_ipa      = :pie_ipa,
                    pie_meaning  = :pie_meaning,
                    efg_node_id  = :efg_node_id,
                    pie_audio_url = CASE WHEN :reset_audio = 1 THEN NULL ELSE pie_audio_url END,
                    updated_at   = GETDATE()
                WHERE id = :cid
            """),
            {
                "pie_root": req.pie_root,
                "pie_ipa": req.pie_ipa,
                "pie_meaning": req.pie_meaning,
                "efg_node_id": efg_node_id,
                "reset_audio": 1 if req.regenerate_audio else 0,
                "cid": req.card_id,
            }
        )
        layers.append("flashcards_updated")

        # ── Layer 4: UPDATE junction table ─────────────────────────────────
        if jt_before:
            db.execute(
                _text("""
                    UPDATE flashcard_pie_roots
                    SET pie_root    = :pie_root,
                        pie_ipa     = :pie_ipa,
                        pie_meaning = :pie_meaning,
                        pie_audio_url = NULL,
                        efg_node_id = :efg_node_id,
                        updated_at  = GETDATE()
                    WHERE flashcard_id = :cid AND display_order = 0
                """),
                {
                    "pie_root": req.pie_root,
                    "pie_ipa": req.pie_ipa,
                    "pie_meaning": req.pie_meaning,
                    "efg_node_id": efg_node_id,
                    "cid": req.card_id,
                }
            )
        else:
            # Junction row missing — create it
            db.execute(
                _text("""
                    INSERT INTO flashcard_pie_roots
                        (flashcard_id, pie_root, pie_ipa, pie_meaning, pie_audio_url, efg_node_id,
                         role, display_order)
                    VALUES (:cid, :pie_root, :pie_ipa, :pie_meaning, NULL, :efg_node_id, 'root', 0)
                """),
                {
                    "cid": req.card_id,
                    "pie_root": req.pie_root,
                    "pie_ipa": req.pie_ipa,
                    "pie_meaning": req.pie_meaning,
                    "efg_node_id": efg_node_id,
                }
            )
        layers.append("junction_updated")

        db.commit()

        # ── Layer 5: UPDATE EFG edges (7th write layer) ─────────────────────
        try:
            conn_efg_edges = _get_efg_connection()
            cur_e = conn_efg_edges.cursor()
            word_node = cur_e.execute(
                "SELECT id FROM nodes WHERE label = ?", (fc_before.word_or_phrase,)
            ).fetchone()
            if word_node:
                word_node_id = word_node[0]
                cur_e.execute(
                    "DELETE FROM edges WHERE target_node = ? AND edge_type = 'pie_to_word'",
                    (word_node_id,)
                )
                new_edge_id = f"e_{efg_node_id}_{word_node_id}"
                cur_e.execute(
                    "INSERT INTO edges (id, source_node, target_node, edge_type, weight) VALUES (?, ?, ?, 'pie_to_word', 1.0)",
                    (new_edge_id, efg_node_id, word_node_id)
                )
                conn_efg_edges.commit()
                layers.append("edges_updated")
                logger.info(f"[REQ-022] EFG edge written: {new_edge_id} ({efg_node_id} \u2192 {word_node_id})")
            else:
                layers.append("edges_skipped_no_word_node")
                logger.warning(f"[REQ-022] Word node not found for '{fc_before.word_or_phrase}' — edges layer skipped")
            conn_efg_edges.close()
        except Exception as edge_err:
            logger.warning(f"[REQ-022] EFG edges update failed (non-fatal) for card {req.card_id}: {edge_err}")
            layers.append("edges_failed")

        # ── Layer 6: regenerate audio (non-fatal) ───────────────────────────
        new_audio_url: Optional[str] = None
        if req.regenerate_audio and req.pie_ipa:
            try:
                from app.services.pie_audio_service import generate_pie_audio
                audio_url, _ = await generate_pie_audio(req.pie_root, req.pie_ipa)
                if audio_url:
                    new_audio_url = audio_url
                    db.execute(
                        _text("""
                            UPDATE flashcards
                            SET pie_audio_url = :url
                            WHERE id = :cid
                        """),
                        {"url": audio_url, "cid": req.card_id}
                    )
                    db.execute(
                        _text("""
                            UPDATE flashcard_pie_roots
                            SET pie_audio_url = :url
                            WHERE flashcard_id = :cid AND display_order = 0
                        """),
                        {"url": audio_url, "cid": req.card_id}
                    )
                    db.commit()
                    layers.append("audio_regenerated")
                    logger.info(f"[REQ-022] Audio generated for card {req.card_id}: {audio_url}")
            except Exception as aud_err:
                logger.warning(f"[REQ-022] Audio generation failed (non-fatal) for card {req.card_id}: {aud_err}")
                layers.append("audio_skipped")
        elif req.regenerate_audio and not req.pie_ipa:
            layers.append("audio_skipped_no_ipa")

    except Exception as tx_err:
        db.rollback()
        logger.error(f"[REQ-022] Transaction failed for card {req.card_id}: {tx_err}")
        raise HTTPException(status_code=500, detail=f"Repair transaction failed: {tx_err}")

    # ── Layer 6: audit log ──────────────────────────────────────────────────
    after_json = {
        "flashcard": {
            "pie_root": req.pie_root,
            "pie_ipa": req.pie_ipa,
            "pie_meaning": req.pie_meaning,
            "efg_node_id": efg_node_id,
            "pie_audio_url": new_audio_url,
        },
        "layers_written": layers,
    }
    log_row = db.execute(
        _text("""
            INSERT INTO flashcards_repair_log
                (flashcard_id, word_or_phrase, admin_user, before_json, after_json, triggered_by)
            OUTPUT INSERTED.id
            VALUES (:fid, :word, :admin, :before, :after, :trig)
        """),
        {
            "fid": req.card_id,
            "word": fc_before.word_or_phrase,
            "admin": admin_email,
            "before": json.dumps(before_json, ensure_ascii=False),
            "after": json.dumps(after_json, ensure_ascii=False),
            "trig": req.triggered_by,
        }
    ).fetchone()
    db.commit()
    log_id = log_row[0] if log_row else -1
    layers.append("audit_log_written")  # Layer 7

    return {
        "log_id": log_id,
        "card_id": req.card_id,
        "word_or_phrase": fc_before.word_or_phrase,
        "layers_written": layers,
        "before": before_json,
        "after": after_json,
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/repair-pie-relationship", response_model=RepairPieResponse)
async def repair_pie_relationship(
    req: RepairPieRequest,
    db: Session = Depends(get_db),
):
    """
    REQ-022: 7-layer atomic PIE relationship repair.
    Admin only. Rewrites flashcards + junction + EFG nodes + EFG edges + audio + audit log.
    """
    result = await _repair_one(req, db, get_default_user_email())
    return result


@router.post("/repair-pie-batch", response_model=RepairPieBatchResponse)
async def repair_pie_batch(
    req: RepairPieBatchRequest,
    db: Session = Depends(get_db),
):
    """
    REQ-022: Batch PIE repair. Each item runs in its own transaction.
    Partial success is returned — one failure does not abort the rest.
    """
    results = []
    succeeded = 0
    failed = 0

    for item in req.repairs:
        try:
            result = await _repair_one(item, db, get_default_user_email())
            results.append({"status": "ok", **result})
            succeeded += 1
        except HTTPException as e:
            results.append({"status": "error", "card_id": item.card_id, "detail": e.detail})
            failed += 1
        except Exception as e:
            results.append({"status": "error", "card_id": item.card_id, "detail": str(e)})
            failed += 1

    return {
        "total": len(req.repairs),
        "succeeded": succeeded,
        "failed": failed,
        "results": results,
    }
