# backend/app/routers/bookmarks.py — BWTL03 bookmark endpoints
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import require_write_access

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_KINDS = {"word", "root", "figure", "thread", "collection"}


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class BookmarkCreate(BaseModel):
    kind: str
    ref_id: str
    ref_label: Optional[str] = None
    owner_id: str
    collection_id: Optional[str] = None


class CollectionCreate(BaseModel):
    name: str
    owner_id: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bm_dict(b: models.Bookmark) -> dict:
    return {
        "id": b.id,
        "kind": b.kind,
        "ref_id": b.ref_id,
        "ref_label": b.ref_label,
        "owner_id": b.owner_id,
        "collection_id": b.collection_id,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


def _col_dict(c: models.BookmarkCollection) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "owner_id": c.owner_id,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


# ── Bookmark endpoints ─────────────────────────────────────────────────────────

@router.post("/bookmarks")
def create_bookmark(
    body: BookmarkCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    if body.kind not in VALID_KINDS:
        raise HTTPException(status_code=400, detail=f"Invalid kind: {body.kind}")

    if body.collection_id:
        col = db.query(models.BookmarkCollection).filter(
            models.BookmarkCollection.id == body.collection_id
        ).first()
        if not col:
            raise HTTPException(status_code=404, detail="Collection not found")

    bm = models.Bookmark(
        id=f"bm_{uuid.uuid4().hex[:12]}",
        kind=body.kind,
        ref_id=body.ref_id,
        ref_label=body.ref_label,
        owner_id=body.owner_id,
        collection_id=body.collection_id,
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)
    return _bm_dict(bm)


@router.get("/bookmarks")
def list_bookmarks(
    owner_id: str = Query(...),
    kind: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Bookmark).filter(models.Bookmark.owner_id == owner_id)
    if kind:
        q = q.filter(models.Bookmark.kind == kind)
    bookmarks = q.order_by(models.Bookmark.created_at.desc()).all()
    return [_bm_dict(b) for b in bookmarks]


@router.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(
    bookmark_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    bm = db.query(models.Bookmark).filter(models.Bookmark.id == bookmark_id).first()
    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bm)
    db.commit()
    return {"deleted": bookmark_id}


# ── Collection endpoints ───────────────────────────────────────────────────────

@router.post("/bookmark_collections")
def create_collection(
    body: CollectionCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_write_access),
):
    col = models.BookmarkCollection(
        id=f"col_{uuid.uuid4().hex[:12]}",
        name=body.name,
        owner_id=body.owner_id,
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return _col_dict(col)


@router.get("/bookmark_collections")
def list_collections(
    owner_id: str = Query(...),
    db: Session = Depends(get_db),
):
    cols = (
        db.query(models.BookmarkCollection)
        .filter(models.BookmarkCollection.owner_id == owner_id)
        .order_by(models.BookmarkCollection.created_at)
        .all()
    )
    return [_col_dict(c) for c in cols]
