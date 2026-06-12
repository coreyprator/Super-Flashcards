# backend/app/routers/chat.py — BWTL03 chat endpoints
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class ThreadCreate(BaseModel):
    anchor_mode: str = "flashcard_id"
    anchor_value: str
    owner_id: str = "pl"  # BUG-051: default so writes succeed without auth context
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


class GenerateRequest(BaseModel):
    user_text: str
    context_snapshot: Optional[str] = None  # JSON string — card fields etc.


@router.post("/threads/{thread_id}/generate")
def generate_ai_reply(
    thread_id: str,
    body: GenerateRequest,
    db: Session = Depends(get_db),
):
    """REQ-036 — persist user message, call AI, persist AI reply, return AI message."""
    from datetime import datetime, timezone
    import os
    import json

    thread = db.query(models.ChatThread).filter(models.ChatThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # 1. Persist user message
    user_msg = models.ChatMessage(
        id=f"msg_{uuid.uuid4().hex[:12]}",
        thread_id=thread_id,
        role="user",
        text=body.user_text,
        context_snapshot=body.context_snapshot,
    )
    db.add(user_msg)
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)

    # 2. Build message history for AI context (last 20 messages)
    history = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.thread_id == thread_id)
        .order_by(models.ChatMessage.created_at)
        .limit(20)
        .all()
    )

    # 3. Call AI (OpenAI gpt-4o)
    ai_text: str
    try:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        import httpx
        from openai import OpenAI
        http_client = httpx.Client(
            timeout=60.0,
            follow_redirects=True,
            verify=False,
        )
        oai = OpenAI(api_key=api_key, http_client=http_client)

        system_prompt = (
            "You are Theodoros, an expert AI tutor specializing in Greek and Latin etymology, "
            "Proto-Indo-European roots, and classical literature. "
            "Provide clear, scholarly, yet approachable explanations. "
            "Keep responses concise (1-3 paragraphs unless detail is requested). "
            "When card context is provided, anchor your response to that specific word or concept."
        )
        if body.context_snapshot:
            try:
                ctx = json.loads(body.context_snapshot)
                word = ctx.get("word") or ctx.get("word_or_phrase") or ""
                if word:
                    system_prompt += f"\n\nCurrent card: {word}."
            except Exception:
                pass

        messages_for_ai = [{"role": "system", "content": system_prompt}]
        for m in history[:-1]:  # exclude the just-added user message (already in history)
            messages_for_ai.append({"role": m.role if m.role == "user" else "assistant", "content": m.text})
        messages_for_ai.append({"role": "user", "content": body.user_text})

        response = oai.chat.completions.create(
            model="gpt-4o",
            messages=messages_for_ai,
            max_tokens=512,
        )
        ai_text = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[generate] AI call failed: {e}")
        ai_text = f"[AI unavailable: {type(e).__name__}]"

    # 4. Persist AI reply
    ai_msg = models.ChatMessage(
        id=f"msg_{uuid.uuid4().hex[:12]}",
        thread_id=thread_id,
        role="ai",
        text=ai_text,
    )
    db.add(ai_msg)
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ai_msg)

    return _message_dict(ai_msg)


# ── Promotion endpoints ───────────────────────────────────────────────────────

@router.post("/promotions")
def create_promotion(
    body: PromotionCreate,
    db: Session = Depends(get_db),
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
        accepted_at=datetime.now(timezone.utc),
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
