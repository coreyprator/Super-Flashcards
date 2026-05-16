# backend/app/routers/chat.py — BWTL03 chat endpoints
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_user, require_write_access

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class ThreadCreate(BaseModel):
    anchor_mode: str = "flashcard_id"
    anchor_value: str
    owner_id: str
    title: Optional[str] = None


class MessageCreate(BaseModel):
    role: str                               # 'user' | 'ai'
    text: str
    context_snapshot: Optional[str] = None  # JSON string
    promotable_json: Optional[str] = None   # JSON string


class PromotionCreate(BaseModel):
    chat_message_id: str
    card_id: str
    target_field: str
    before_value: Optional[str] = None
    after_value: Optional[str] = None
    accepted_by: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _thread_dict(t: models.ChatThread) -> dict:
    return {
        "id": t.id,
        "anchor_mode": t.anchor_mode,
        "anchor_value": t.anchor_value,
        "owner_id": t.owner_id,
        "title": t.title,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }


def _message_dict(m: models.ChatMessage) -> dict:
    return {
        "id": m.id,
        "thread_id": m.thread_id,
        "role": m.role,
        "text": m.text,
        "context_snapshot": m.context_snapshot,
        "promotable_json": m.promotable_json,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def _promotion_dict(p: models.ChatPromotion) -> dict:
    return {
        "id": p.id,
        "chat_message_id": p.chat_message_id,
        "card_id": p.card_id,
        "target_field": p.target_field,
        "before_value": p.before_value,
        "after_value": p.after_value,
        "accepted_by": p.accepted_by,
        "accepted_at": p.accepted_at.isoformat() if p.accepted_at else None,
    }


# ── Thread endpoints ──────────────────────────────────────────────────────────

@router.post("/threads")
def create_thread(
    body: ThreadCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    thread = models.ChatThread(
        id=f"thr_{uuid.uuid4().hex[:12]}",
        anchor_mode=body.anchor_mode,
        anchor_value=body.anchor_value,
        owner_id=body.owner_id,
        title=body.title,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _thread_dict(thread)


@router.get("/threads")
def list_threads(
    anchor_mode: Optional[str] = Query(None),
    anchor_value: Optional[str] = Query(None),
    owner_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.ChatThread)
    if anchor_mode:
        q = q.filter(models.ChatThread.anchor_mode == anchor_mode)
    if anchor_value:
        q = q.filter(models.ChatThread.anchor_value == anchor_value)
    if owner_id:
        q = q.filter(models.ChatThread.owner_id == owner_id)
    threads = q.order_by(models.ChatThread.updated_at.desc()).all()
    return [_thread_dict(t) for t in threads]


# ── Message endpoints ─────────────────────────────────────────────────────────

@router.post("/threads/{thread_id}/messages")
def append_message(
    thread_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    thread = db.query(models.ChatThread).filter(models.ChatThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    msg = models.ChatMessage(
        id=f"msg_{uuid.uuid4().hex[:12]}",
        thread_id=thread_id,
        role=body.role,
        text=body.text,
        context_snapshot=body.context_snapshot,
        promotable_json=body.promotable_json,
    )
    db.add(msg)

    # Update thread.updated_at
    from datetime import datetime, timezone
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return _message_dict(msg)


@router.get("/threads/{thread_id}/messages")
def list_messages(thread_id: str, db: Session = Depends(get_db)):
    thread = db.query(models.ChatThread).filter(models.ChatThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.thread_id == thread_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    return [_message_dict(m) for m in msgs]


# ── Promotion endpoints ───────────────────────────────────────────────────────

@router.post("/promotions")
def create_promotion(
    body: PromotionCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == body.chat_message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Chat message not found")

    # Validate target_field against allowed list
    ALLOWED_FIELDS = {
        "definition", "etymology", "english_cognates", "related_words",
        "pie_root", "pie_meaning", "pie_ipa", "ipa_pronunciation",
        "gender", "preposition_usage", "compound_parts", "source_book",
        "image_description", "translation", "cognate_pie_roots", "non_pie_reason",
    }
    if body.target_field not in ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid target_field: {body.target_field}")

    promo = models.ChatPromotion(
        id=f"prm_{uuid.uuid4().hex[:12]}",
        chat_message_id=body.chat_message_id,
        card_id=body.card_id,
        target_field=body.target_field,
        before_value=body.before_value,
        after_value=body.after_value,
        accepted_by=body.accepted_by,
    )
    db.add(promo)

    # Apply the accepted value to the flashcard
    from sqlalchemy import text as _text
    if body.after_value is not None:
        db.execute(
            _text(f"UPDATE flashcards SET [{body.target_field}] = :val WHERE id = :cid"),
            {"val": body.after_value, "cid": body.card_id},
        )

    db.commit()
    db.refresh(promo)
    return _promotion_dict(promo)
