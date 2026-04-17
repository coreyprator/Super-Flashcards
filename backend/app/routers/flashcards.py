# backend/app/routers/flashcards.py
from fastapi import APIRouter, Depends, HTTPException, Query
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
    """Create a new flashcard"""
    return crud.create_flashcard(db=db, flashcard=flashcard)

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


# SF10 REQ-010: On-demand IPA audio generation
@router.post("/generate-ipa-audio")
async def generate_ipa_audio_on_demand(ipa: str, label: Optional[str] = None):
    """
    Generate ElevenLabs audio for an arbitrary IPA string.
    Caches to GCS at pie-audio/adhoc/{hash}.mp3.
    """
    import hashlib
    from app.services.pie_audio_service import generate_pie_audio_from_ipa

    if not ipa or not ipa.strip():
        return {"error": "IPA string is required"}

    cache_key = hashlib.md5(ipa.encode()).hexdigest()[:12]
    gcs_path = f"pie-audio/adhoc/{cache_key}.mp3"

    url, ssml_failed = await generate_pie_audio_from_ipa(ipa.strip(), gcs_path)
    if url:
        return {"url": url, "cached": not ssml_failed, "ipa": ipa}
    return {"error": "Audio generation failed", "ipa": ipa}


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