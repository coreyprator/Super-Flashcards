# backend/app/routers/flashcards.py
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
import json
import asyncio
import logging

from app import crud, schemas, models
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.Flashcard)
def create_flashcard(
    flashcard: schemas.FlashcardCreate,
    db: Session = Depends(get_db)
):
    """Create a new flashcard. SF18: if pie_root is set, writes all 7 EFG layers."""
    db_card = crud.create_flashcard(db=db, flashcard=flashcard)

    # SF18 Fix 3: when pie_root provided, do full 7-layer EFG write on new cards
    if flashcard.pie_root and flashcard.pie_root.strip() not in ('', 'N/A'):
        try:
            import unicodedata as _unicodedata
            import re as _re
            from app.routers.efg import _get_efg_connection

            def _make_efg_slug_create(label, cursor):
                s = label.replace('*', '').replace('\u02b7', 'w').replace('\u02b0', 'h')
                s = _unicodedata.normalize('NFKD', s)
                s = ''.join(c for c in s if _unicodedata.category(c) not in ('Mn', 'Mc'))
                for old, new in [('\u2081', '1'), ('\u2082', '2'), ('\u2083', '3'), ('\u2084', '4')]:
                    s = s.replace(old, new)
                s = _re.sub(r'[^a-z0-9\-]', '_', s.lower())
                s = s.replace('-', '_')
                s = _re.sub(r'_+', '_', s).strip('_')
                slug = 'pie_' + s
                if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (slug,)).fetchone():
                    return slug
                for i in range(2, 20):
                    candidate = f"{slug}_{i}"
                    if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (candidate,)).fetchone():
                        return candidate
                return slug + '_x'

            conn_efg = _get_efg_connection()
            cursor = conn_efg.cursor()
            new_root = flashcard.pie_root.strip()

            # Look up or create PIE node
            row = cursor.execute("SELECT id FROM nodes WHERE label = ?", (new_root,)).fetchone()
            if row:
                efg_node_id = row[0]
            else:
                efg_node_id = _make_efg_slug_create(new_root, cursor)
                gloss = (flashcard.pie_meaning or '').strip() if hasattr(flashcard, 'pie_meaning') else ''
                cursor.execute(
                    "INSERT INTO nodes (id, label, gloss, pie_root, language, node_type, source) VALUES (?, ?, ?, ?, 'PIE', 'pie_root', 'sf18-add-card')",
                    (efg_node_id, new_root, gloss, new_root)
                )
                logger.info(f"[SF18-add-card] EFG PIE node created: {efg_node_id}")

            # Look up word node by label; create if missing
            word_node_row = cursor.execute(
                "SELECT id FROM nodes WHERE label = ?", (db_card.word_or_phrase,)
            ).fetchone()
            if word_node_row:
                word_node_id = word_node_row[0]
            else:
                card_id_short = str(db_card.id).replace('-', '').lower()[:12]
                word_node_id = f"sf_{card_id_short}"
                lang = getattr(db_card, 'language_id', None) or 'Unknown'
                cursor.execute(
                    "INSERT INTO nodes (id, label, node_type, language, source) VALUES (?, ?, 'word', ?, 'sf18-add-card')",
                    (word_node_id, db_card.word_or_phrase, lang)
                )
                logger.info(f"[SF18-add-card] EFG word node created: {word_node_id}")

            # Write edge
            cursor.execute(
                "DELETE FROM edges WHERE target_node = ? AND edge_type = 'pie_to_word'",
                (word_node_id,)
            )
            new_edge_id = f"e_{efg_node_id}_{word_node_id}"
            cursor.execute(
                "INSERT INTO edges (id, source_node, target_node, edge_type, weight) VALUES (?, ?, ?, 'pie_to_word', 1.0)",
                (new_edge_id, efg_node_id, word_node_id)
            )
            conn_efg.commit()
            conn_efg.close()
            logger.info(f"[SF18-add-card] EFG edge written: {new_edge_id}")

            # Update flashcards.efg_node_id
            from sqlalchemy import text as _text
            db.execute(_text(
                "UPDATE flashcards SET efg_node_id = :nid, efg_node_id_updated_at = GETDATE() WHERE id = :cid"
            ), {"nid": efg_node_id, "cid": str(db_card.id)})

            # Write flashcard_pie_roots junction row
            pie_ipa = getattr(flashcard, 'pie_ipa', None) or None
            pie_meaning = getattr(flashcard, 'pie_meaning', None) or None
            db.execute(_text("""
                INSERT INTO flashcard_pie_roots
                    (flashcard_id, pie_root, pie_ipa, pie_meaning, pie_audio_url, efg_node_id, role, display_order)
                VALUES (:cid, :pie_root, :pie_ipa, :pie_meaning, NULL, :efg_node_id, 'root', 0)
            """), {
                "cid": str(db_card.id),
                "pie_root": new_root,
                "pie_ipa": pie_ipa,
                "pie_meaning": pie_meaning,
                "efg_node_id": efg_node_id,
            })
            db.commit()
            db.refresh(db_card)
            logger.info(f"[SF18-add-card] 7-layer write complete for card {db_card.id}")
        except Exception as efg_err:
            logger.warning(f"[SF18-add-card] EFG 7-layer write failed (non-fatal) for card {db_card.id}: {efg_err}")

    return db_card

@router.get("/", response_model=List[schemas.Flashcard])
def read_flashcards(
    language_id: Optional[str] = None,
    card_type: Optional[str] = None,
    source_book: Optional[str] = None,
    chapter_number: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """Get all flashcards, optionally filtered by language, card_type, source_book, chapter."""
    query = db.query(models.Flashcard)
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    if card_type:
        query = query.filter(models.Flashcard.card_type == card_type)
    if source_book:
        query = query.filter(models.Flashcard.source_book.ilike(f"%{source_book}%"))
    if chapter_number is not None:
        query = query.filter(models.Flashcard.chapter_number == chapter_number)
    # For sentence cards, order by chapter + sentence_order
    if card_type == "sentence":
        query = query.order_by(models.Flashcard.chapter_number, models.Flashcard.sentence_order)
    else:
        query = query.order_by(models.Flashcard.created_at.desc())
    flashcards = query.offset(skip).limit(limit).all()
    return flashcards

@router.get("/search", response_model=List[schemas.Flashcard])
def search_flashcards(
    q: str = Query(..., min_length=1, description="Search term"),
    language_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Search flashcards by word, definition, or etymology"""
    return crud.search_flashcards(db, search_term=q, language_id=language_id, limit=limit, offset=offset)


@router.post("/backfill-cognate-pie-roots")
async def backfill_cognate_pie_roots(
    batch_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Batch-validate english_cognates against PIE roots for cards missing cognate_pie_roots."""
    from app.services.cognate_validation_service import process_card_cognates

    rows = db.execute(text(f"""
        SELECT TOP ({batch_size}) id, word_or_phrase, english_cognates, pie_root
        FROM flashcards
        WHERE english_cognates IS NOT NULL
          AND english_cognates != ''
          AND english_cognates != 'N/A'
          AND pie_root IS NOT NULL
          AND pie_root != 'N/A'
          AND cognate_pie_roots IS NULL
        ORDER BY created_at ASC
    """)).fetchall()

    processed = 0
    removed_count = 0
    skipped = 0
    errors = 0
    rag_miss_total = 0

    for row in rows:
        card_id, word, cognates, pie_root = row[0], row[1], row[2], row[3]
        try:
            cleaned, audit, rag_miss = await process_card_cognates(cognates, pie_root, word)
            db.execute(text("""
                UPDATE flashcards
                SET english_cognates = :cleaned,
                    cognate_pie_roots = :audit
                WHERE id = :card_id
            """), {"cleaned": cleaned, "audit": json.dumps(audit), "card_id": card_id})
            db.commit()
            removed_count += len([r for r in audit if not r["kept"]])
            rag_miss_total += rag_miss
            processed += 1
        except Exception as e:
            logger.error(f"[backfill] Error on card {card_id}: {e}")
            errors += 1
        await asyncio.sleep(0.5)

    # Estimate remaining
    remaining = db.execute(text("""
        SELECT COUNT(*) FROM flashcards
        WHERE english_cognates IS NOT NULL
          AND english_cognates != ''
          AND english_cognates != 'N/A'
          AND pie_root IS NOT NULL
          AND pie_root != 'N/A'
          AND cognate_pie_roots IS NULL
    """)).scalar()

    return {
        "processed": processed,
        "removed_cognates_total": removed_count,
        "skipped": skipped,
        "errors": errors,
        "rag_miss_count": rag_miss_total,
        "remaining_estimate": remaining,
        "message": f"Run again to continue. {removed_count} synonyms removed from english_cognates across {processed} cards.",
    }


@router.get("/exists")
def check_card_exists(word: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Case-insensitive card existence check by exact word_or_phrase."""
    normalized = word.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="word is required")

    card = db.query(models.Flashcard).filter(
        func.lower(models.Flashcard.word_or_phrase) == normalized.lower()
    ).first()

    if not card:
        return {
            "word": normalized,
            "exists": False,
            "card_id": None,
            "url": None,
        }

    return {
        "word": normalized,
        "exists": True,
        "card_id": str(card.id),
        "url": f"/?cardId={card.id}",
    }

@router.get("/{flashcard_id}", response_model=schemas.Flashcard)
def read_flashcard(flashcard_id: str, db: Session = Depends(get_db)):
    """Get a specific flashcard by ID"""
    db_flashcard = crud.get_flashcard(db, flashcard_id=flashcard_id)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard

@router.put("/{flashcard_id}", response_model=schemas.Flashcard)
def update_flashcard(
    flashcard_id: str,
    flashcard: schemas.FlashcardUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing flashcard"""
    db_flashcard = crud.update_flashcard(db, flashcard_id=flashcard_id, flashcard=flashcard)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    # BUG-035: Re-link efg_node_id to the correct EFG node when pie_root changes.
    # Do NOT mutate the previously-linked node.
    update_data = flashcard.dict(exclude_unset=True)
    if 'pie_root' in update_data and update_data['pie_root']:
        try:
            import unicodedata as _unicodedata
            import re as _re
            from app.routers.efg import _get_efg_connection

            def _make_efg_slug(label, cursor):
                """Derive a stable pie_ slug from a PIE root label."""
                s = label.replace('*', '').replace('\u02b7', 'w').replace('\u02b0', 'h')
                s = _unicodedata.normalize('NFKD', s)
                s = ''.join(c for c in s if _unicodedata.category(c) not in ('Mn', 'Mc'))
                for old, new in [('\u2081','1'),('\u2082','2'),('\u2083','3'),('\u2084','4')]:
                    s = s.replace(old, new)
                s = _re.sub(r'[^a-z0-9\-]', '_', s.lower())
                s = s.replace('-', '_')
                s = _re.sub(r'_+', '_', s).strip('_')
                slug = 'pie_' + s
                if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (slug,)).fetchone():
                    return slug
                for i in range(2, 20):
                    candidate = f"{slug}_{i}"
                    if not cursor.execute("SELECT 1 FROM nodes WHERE id = ?", (candidate,)).fetchone():
                        return candidate
                return slug + '_x'

            conn_efg = _get_efg_connection()
            cursor = conn_efg.cursor()
            new_root = update_data['pie_root']
            row = cursor.execute("SELECT id FROM nodes WHERE label = ?", (new_root,)).fetchone()
            if row:
                new_efg_node_id = row[0]
                logger.info(f"[BUG-035] Found existing EFG node {new_efg_node_id} for root '{new_root}'")
            else:
                new_efg_node_id = _make_efg_slug(new_root, cursor)
                gloss = update_data.get('pie_meaning') or ''
                cursor.execute(
                    "INSERT INTO nodes (id, label, gloss, pie_root, language, node_type, source) VALUES (?, ?, ?, ?, 'PIE', 'pie_root', 'sf15-accept')",
                    (new_efg_node_id, new_root, gloss, new_root)
                )
                logger.info(f"[BUG-035] Created new EFG node {new_efg_node_id} for root '{new_root}'")
            conn_efg.commit()
            # SF18 7th layer: write EFG edges (pie_to_word)
            word_node_row = cursor.execute(
                "SELECT id FROM nodes WHERE label = ?", (db_flashcard.word_or_phrase,)
            ).fetchone()
            if word_node_row:
                word_node_id = word_node_row[0]
                cursor.execute(
                    "DELETE FROM edges WHERE target_node = ? AND edge_type = 'pie_to_word'",
                    (word_node_id,)
                )
                new_edge_id = f"e_{new_efg_node_id}_{word_node_id}"
                cursor.execute(
                    "INSERT INTO edges (id, source_node, target_node, edge_type, weight) VALUES (?, ?, ?, 'pie_to_word', 1.0)",
                    (new_edge_id, new_efg_node_id, word_node_id)
                )
                conn_efg.commit()
                logger.info(f"[BUG-035] EFG edge written: {new_edge_id}")
            else:
                logger.warning(f"[BUG-035] Word node not found for '{db_flashcard.word_or_phrase}' — edges skipped")
            conn_efg.close()
            from sqlalchemy import text as _text
            db.execute(_text(
                "UPDATE flashcards SET efg_node_id = :nid, efg_node_id_updated_at = GETDATE() WHERE id = :cid"
            ), {"nid": new_efg_node_id, "cid": str(flashcard_id)})
            db.commit()
            db.refresh(db_flashcard)
            logger.info(f"[BUG-035] efg_node_id re-linked to {new_efg_node_id} for card {flashcard_id}")
        except Exception as efg_err:
            logger.warning(f"[BUG-035] efg_node_id re-link failed for card {flashcard_id}: {efg_err}")

    # BUG-031: Sync pie_root/pie_ipa correction into flashcard_pie_roots junction table
    # (display_order=0 is the primary/canonical root row — the one shown on card load)
    # BUG-034: Also sync pie_meaning so gloss is not stale after accept
    # REQ-021: For compound roots, DELETE + multi-INSERT junction rows
    if update_data.get('is_compound') and update_data.get('compound_roots'):
        try:
            from sqlalchemy import text as _text
            compound_roots = update_data['compound_roots']
            db.execute(_text(
                "DELETE FROM flashcard_pie_roots WHERE flashcard_id = :card_id"
            ), {"card_id": str(flashcard_id)})
            for i, root in enumerate(compound_roots):
                if hasattr(root, 'pie_root'):
                    r_root, r_ipa, r_meaning = root.pie_root, root.pie_ipa, root.pie_meaning
                else:
                    r_root = root.get('pie_root')
                    r_ipa = root.get('pie_ipa')
                    r_meaning = root.get('pie_meaning')
                db.execute(_text("""
                    INSERT INTO flashcard_pie_roots
                        (flashcard_id, pie_root, pie_ipa, pie_meaning, pie_audio_url, display_order)
                    VALUES (:card_id, :pie_root, :pie_ipa, :pie_meaning, NULL, :order)
                """), {
                    "card_id": str(flashcard_id),
                    "pie_root": r_root,
                    "pie_ipa": r_ipa,
                    "pie_meaning": r_meaning,
                    "order": i
                })
            db.commit()
            logger.info(f"[REQ-021] Compound junction rows written for card {flashcard_id}: {len(compound_roots)} roots")
        except Exception as jt_err:
            logger.warning(f"[REQ-021] Compound junction update failed for card {flashcard_id}: {jt_err}")
    elif 'pie_root' in update_data and update_data['pie_root']:
        try:
            from sqlalchemy import text as _text
            set_parts = ["pie_root = :pie_root", "pie_audio_url = NULL"]
            jt_params = {
                "pie_root": update_data['pie_root'],
                "card_id":  str(flashcard_id),
            }
            if update_data.get('pie_ipa') is not None:
                set_parts.append("pie_ipa = :pie_ipa")
                jt_params["pie_ipa"] = update_data['pie_ipa']
            if update_data.get('pie_meaning') is not None:
                set_parts.append("pie_meaning = :pie_meaning")
                jt_params["pie_meaning"] = update_data['pie_meaning']
            jt_sql = f"""
                    UPDATE flashcard_pie_roots
                    SET {', '.join(set_parts)}
                    WHERE flashcard_id = :card_id
                      AND display_order = 0
                """
            db.execute(_text(jt_sql), jt_params)
            db.commit()
            logger.info(f"[BUG-031/BUG-034] flashcard_pie_roots row 0 updated for card {flashcard_id}")
        except Exception as jt_err:
            # Non-fatal: base flashcards.pie_root already updated
            logger.warning(f"[BUG-031/BUG-034] junction table update failed for card {flashcard_id}: {jt_err}")

    return db_flashcard

@router.delete("/{flashcard_id}")
def delete_flashcard(flashcard_id: str, db: Session = Depends(get_db)):
    """Delete a flashcard"""
    success = crud.delete_flashcard(db, flashcard_id=flashcard_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return {"detail": "Flashcard deleted successfully"}

@router.post("/{flashcard_id}/validate-cognates")
async def validate_card_cognates(flashcard_id: str, db: Session = Depends(get_db)):
    """Validate cognates for a single card against its PIE root. Overwrites existing audit."""
    from app.services.cognate_validation_service import process_card_cognates

    card = crud.get_flashcard(db, flashcard_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    if not card.english_cognates or not card.pie_root or card.pie_root == "N/A":
        raise HTTPException(status_code=400, detail="Card has no english_cognates or pie_root to validate")

    original = card.english_cognates
    cleaned, audit, rag_miss = await process_card_cognates(original, card.pie_root, card.word_or_phrase)

    # Persist
    db.execute(text("""
        UPDATE flashcards
        SET english_cognates = :cleaned,
            cognate_pie_roots = :audit
        WHERE id = :card_id
    """), {"cleaned": cleaned, "audit": json.dumps(audit), "card_id": flashcard_id})
    db.commit()

    removed = [{"word": r["word"], "reason": f"different PIE root {r['proposed_pie_root']}", "citation": r["citation"]}
               for r in audit if not r["kept"]]
    kept = [{"word": r["word"], "is_true_cognate": r["is_true_cognate"]} for r in audit if r["kept"]]

    return {
        "card_id": flashcard_id,
        "original_english_cognates": original,
        "cleaned_english_cognates": cleaned,
        "removed": removed,
        "kept": kept,
        "rag_miss_count": rag_miss,
    }


@router.post("/backfill-pie-ipa")
async def backfill_pie_ipa(
    batch_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Batch-convert PIE roots to IPA for cards missing pie_ipa."""
    from app.services.pie_ipa_service import convert_pie_to_ipa

    rows = db.execute(text(f"""
        SELECT TOP ({batch_size}) id, pie_root
        FROM flashcards
        WHERE pie_root IS NOT NULL
          AND pie_root != 'N/A'
          AND pie_root != ''
          AND pie_root LIKE '*%'
          AND pie_ipa IS NULL
        ORDER BY created_at ASC
    """)).fetchall()

    processed = 0
    skipped = 0
    ipa_error_count = 0

    for row in rows:
        card_id, pie_root = row[0], row[1]
        try:
            ipa = await convert_pie_to_ipa(pie_root)
            if ipa:
                db.execute(text("""
                    UPDATE flashcards SET pie_ipa = :ipa WHERE id = :card_id
                """), {"ipa": ipa, "card_id": card_id})
                db.commit()
                processed += 1
            else:
                skipped += 1
        except Exception as e:
            logger.error(f"[backfill-pie-ipa] Error on card {card_id}: {e}")
            ipa_error_count += 1
        await asyncio.sleep(0.3)

    remaining = db.execute(text("""
        SELECT COUNT(*) FROM flashcards
        WHERE pie_root IS NOT NULL AND pie_root != 'N/A' AND pie_root != ''
          AND pie_root LIKE '*%' AND pie_ipa IS NULL
    """)).scalar()

    return {
        "processed": processed,
        "skipped": skipped,
        "ipa_error_count": ipa_error_count,
        "remaining_estimate": remaining,
        "message": f"Converted {processed} PIE roots to IPA. {remaining} remaining.",
    }


@router.post("/backfill-pie-audio")
async def backfill_pie_audio(
    batch_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Batch-generate PIE audio for cards with pie_ipa but no pie_audio_url."""
    from app.services.pie_audio_service import generate_pie_audio

    rows = db.execute(text(f"""
        SELECT TOP ({batch_size}) id, pie_root, pie_ipa
        FROM flashcards
        WHERE pie_ipa IS NOT NULL
          AND pie_audio_url IS NULL
        ORDER BY created_at ASC
    """)).fetchall()

    processed = 0
    ssml_failed_count = 0
    errors = 0

    for row in rows:
        card_id, pie_root, pie_ipa = row[0], row[1], row[2]
        try:
            audio_url, ssml_failed = await generate_pie_audio(pie_root, pie_ipa)
            if audio_url:
                db.execute(text("""
                    UPDATE flashcards
                    SET pie_audio_url = :url, pie_audio_ssml_failed = :ssml_failed
                    WHERE id = :card_id
                """), {"url": audio_url, "ssml_failed": ssml_failed, "card_id": card_id})
                db.commit()
                processed += 1
                if ssml_failed:
                    ssml_failed_count += 1
            else:
                errors += 1
        except Exception as e:
            logger.error(f"[backfill-pie-audio] Error on card {card_id}: {e}")
            errors += 1
        await asyncio.sleep(1.0)

    remaining = db.execute(text("""
        SELECT COUNT(*) FROM flashcards
        WHERE pie_ipa IS NOT NULL AND pie_audio_url IS NULL
    """)).scalar()

    return {
        "processed": processed,
        "ssml_failed_count": ssml_failed_count,
        "errors": errors,
        "remaining_estimate": remaining,
    }


@router.post("/{flashcard_id}/review", response_model=schemas.Flashcard)
def mark_reviewed(flashcard_id: str, db: Session = Depends(get_db)):
    """Mark a flashcard as reviewed (increments counter, updates timestamp)"""
    db_flashcard = crud.increment_review_count(db, flashcard_id=flashcard_id)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard


# SF08 REQ-009: PIE IPA Regression Harness
@router.post("/test-pie-ipa")
async def test_pie_ipa():
    """Run 50-root PIE IPA test suite against convert_pie_to_ipa()."""
    import os as _os
    from app.services.pie_ipa_service import convert_pie_to_ipa

    data_path = _os.path.join(_os.path.dirname(__file__), '../data/pie_ipa_test_suite.json')
    with open(data_path) as f:
        suite = json.load(f)
    results = []
    passed = partial = failed = 0
    for item in suite:
        our_ipa = await convert_pie_to_ipa(item['root'])
        wiki = item['wiktionary_ipa']
        if our_ipa is None:
            status = 'failed'; failed += 1
        elif our_ipa == wiki:
            status = 'pass'; passed += 1
        else:
            common = sum(1 for c in our_ipa if c in wiki)
            ratio = common / max(len(our_ipa), len(wiki))
            if ratio >= 0.7:
                status = 'partial'; partial += 1
            else:
                status = 'failed'; failed += 1
        results.append({'root': item['root'], 'gloss': item['gloss'],
            'category': item['category'], 'wiktionary_ipa': wiki,
            'our_ipa': our_ipa, 'status': status})
    total = len(suite)
    return {'total': total, 'passed': passed, 'partial': partial, 'failed': failed,
            'pass_rate': round((passed + partial * 0.5) / total * 100, 1), 'results': results}


# SF12 BUG-014: PIE root -> IPA conversion endpoint (used by Etymython cognate backfill)
@router.post("/generate-ipa")
async def generate_ipa_from_pie_root(payload: dict):
    """Convert a PIE root (e.g. *weyd-) to IPA transcription via convert_pie_to_ipa()."""
    from app.services.pie_ipa_service import convert_pie_to_ipa

    pie_root = (payload or {}).get("pie_root", "").strip()
    if not pie_root:
        return {"ipa": None, "error": "pie_root required"}

    try:
        ipa = await convert_pie_to_ipa(pie_root)
        return {"ipa": ipa, "pie_root": pie_root}
    except Exception as e:
        logger.error(f"[generate-ipa] Error converting {pie_root}: {e}")
        return {"ipa": None, "error": str(e)[:120]}


# SF10 REQ-010 / SF12 BUG-014: On-demand IPA audio generation.
# Accepts BOTH query params (ipa=, label=) and a JSON body
# ({"ipa": "...", "gcs_path": "..."}) for backwards compat with the
# Etymython cognate backfill (which posts JSON with explicit gcs_path).
@router.post("/generate-ipa-audio")
async def generate_ipa_audio_on_demand(
    request: Request,
    ipa: Optional[str] = None,
    label: Optional[str] = None,
):
    import hashlib
    from app.services.pie_audio_service import generate_pie_audio_from_ipa

    body_ipa = None
    body_gcs_path = None
    try:
        body = await request.json()
        if isinstance(body, dict):
            body_ipa = body.get("ipa")
            body_gcs_path = body.get("gcs_path")
    except Exception:
        body = None

    effective_ipa = (body_ipa or ipa or "").strip()
    if not effective_ipa:
        return {"error": "IPA string is required", "url": None, "audio_url": None}

    if body_gcs_path:
        gcs_path = body_gcs_path
    else:
        cache_key = hashlib.md5(effective_ipa.encode()).hexdigest()[:12]
        gcs_path = f"pie-audio/adhoc/{cache_key}.mp3"

    url, ssml_failed = await generate_pie_audio_from_ipa(effective_ipa, gcs_path)
    if url:
        return {
            "url": url,
            "audio_url": url,
            "cached": not ssml_failed,
            "ssml_failed": ssml_failed,
            "ipa": effective_ipa,
            "gcs_path": gcs_path,
        }
    return {"error": "Audio generation failed", "ipa": effective_ipa, "url": None, "audio_url": None}


# SF10 REQ-010: IPA phoneme-level comparison
@router.post("/compare-ipa")
async def compare_ipa_strings(expected: str, actual: str):
    """Compare two IPA strings and return phoneme-level diff."""
    from app.services.ipa_diff_service import tokenize_ipa
    from difflib import SequenceMatcher

    expected_tokens = tokenize_ipa(expected)
    actual_tokens = tokenize_ipa(actual)

    matcher = SequenceMatcher(None, expected_tokens, actual_tokens)
    diffs = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        diffs.append({
            "tag": tag,
            "expected": expected_tokens[i1:i2],
            "actual": actual_tokens[j1:j2]
        })

    return {
        "expected": expected,
        "actual": actual,
        "match_pct": round(matcher.ratio() * 100),
        "diffs": diffs
    }


@router.get("/pie-explorer/{pie_root}")
async def get_pie_root_data(pie_root: str, db: Session = Depends(get_db)):
    """
    BWTL03 (extends ETY01 Phase 4 REQ-013): PIE Explorer merged endpoint.
    Returns SF flashcards PLUS EFG verbal_paradigm, nominal_derivatives,
    modern_cognates, efg_pie_ipa, efg_pie_audio_url, atomic_roots,
    and heuristic language_paradigm from EFG prose.
    """
    import re
    import json as _json

    # SF query: flashcards with this PIE root
    cards = db.query(models.Flashcard).filter(
        models.Flashcard.pie_root == pie_root
    ).all()

    # atomic_roots: collect all distinct pie_roots linked to any of these cards
    card_ids = [str(c.id) for c in cards]
    atomic_roots = [pie_root]
    if card_ids:
        id_params = {f"id_{i}": card_ids[i] for i in range(len(card_ids))}
        placeholders = ", ".join([f":id_{i}" for i in range(len(card_ids))])
        rows = db.execute(
            text(f"SELECT DISTINCT pie_root FROM flashcard_pie_roots WHERE flashcard_id IN ({placeholders})"),
            id_params
        ).fetchall()
        candidates = [r[0] for r in rows if r[0]]
        if len(candidates) > 1:
            atomic_roots = candidates

    # Build branches (SF cards)
    branches = []
    for card in cards:
        branches.append({
            "id": str(card.id),
            "word": card.word_or_phrase,
            "language": card.language_id,
            "definition": card.definition,
            "etymology": card.etymology,
            "pie_meaning": card.pie_meaning,
            "pie_ipa": card.pie_ipa,
            "pie_audio_url": card.pie_audio_url
        })

    # EFG query: merge verbal_paradigm, nominal_derivatives, modern_cognates,
    # efg_pie_ipa, efg_pie_audio_url, and heuristic language_paradigm.
    # REV2-BUILD-001: Data now served from learning DB — no cross-DB connection.
    verbal_paradigm = None
    nominal_derivatives = None
    modern_cognates = None
    efg_node_id = None
    efg_pie_ipa = None
    efg_pie_audio_url = None
    language_paradigm = {}
    scholarly_notes = []

    try:
        # Normalize: strip *, leading/trailing - and spaces for efg_pie_explorer_data lookup
        efg_key = re.sub(r'[*\-]', '', pie_root).strip()

        # Get EFG prose blocks from learning DB
        efg_row = db.execute(
            text("SELECT verbal_paradigm, nominal_derivatives, modern_cognates "
                 "FROM efg_pie_explorer_data WHERE pie_root = :key"),
            {"key": efg_key}
        ).fetchone()
        if efg_row:
            verbal_paradigm = efg_row[0]
            nominal_derivatives = efg_row[1]
            modern_cognates = efg_row[2]

            # Heuristic language_paradigm from modern_cognates JSON
            if modern_cognates:
                try:
                    mc = _json.loads(modern_cognates)
                    lang_map = {
                        "greek": "Greek",
                        "latin": "Latin",
                        "sanskrit": "Sanskrit",
                        "french": "French",
                    }
                    for efg_lang, disp_lang in lang_map.items():
                        if efg_lang in mc:
                            forms = [
                                {"form": f[0], "gloss": f[1] if len(f) > 1 else ""}
                                for f in mc[efg_lang] if isinstance(f, list) and f
                            ]
                            if forms:
                                language_paradigm[disp_lang] = {"forms": forms}
                except Exception:
                    pass

        # Get EFG node for IPA and audio from learning DB (nodes table ETL'd in Phase 0)
        node_row = db.execute(
            text("SELECT id, pie_ipa, pie_audio_url FROM nodes "
                 "WHERE node_type = 'pie_root' AND label = :label"),
            {"label": pie_root}
        ).fetchone()
        if node_row:
            efg_node_id = node_row[0]
            efg_pie_ipa = node_row[1]
            efg_pie_audio_url = node_row[2]

        # scholarly_notes: empty until ingestion sprint
        sn_rows = db.execute(
            text("SELECT id, content, source, page_ref, created_at FROM scholarly_notes "
                 "WHERE pie_root = :root ORDER BY created_at"),
            {"root": pie_root}
        ).fetchall()
        scholarly_notes = [
            {"id": r[0], "content": r[1], "source": r[2], "page_ref": r[3],
             "created_at": r[4].isoformat() if r[4] else None}
            for r in sn_rows
        ]
    except Exception as e:
        logger.warning(f"[pie-explorer] EFG/scholarly_notes query failed for '{pie_root}': {e}")

    return {
        "pie_root": pie_root,
        "card_count": len(cards),
        "pie_meaning": cards[0].pie_meaning if cards else None,
        "pie_ipa": cards[0].pie_ipa if cards else None,
        "pie_audio_url": cards[0].pie_audio_url if cards else None,
        "branches": branches,
        # EFG data now served from learning DB (REV2-BUILD-001 — no cross-DB calls)
        "verbal_paradigm": verbal_paradigm,
        "nominal_derivatives": nominal_derivatives,
        "modern_cognates": modern_cognates,
        "efg_node_id": efg_node_id,
        "efg_pie_ipa": efg_pie_ipa,
        "efg_pie_audio_url": efg_pie_audio_url,
        "atomic_roots": atomic_roots,
        "language_paradigm": language_paradigm,
        # scholarly_notes — empty until ingestion sprint; FE renders "no entries yet" placeholder
        "scholarly_notes": scholarly_notes,
    }