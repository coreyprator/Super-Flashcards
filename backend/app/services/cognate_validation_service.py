# backend/app/services/cognate_validation_service.py
# SF04C — Cognate PIE root validation service
import json
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def validate_cognate(cognate_word: str, card_pie_root: str, card_word: str) -> dict:
    """Validate a single cognate word against the card's PIE root.
    Returns {word, proposed_pie_root, is_true_cognate, citation, kept, validated_at}"""
    import httpx

    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    base_result = {
        "word": cognate_word,
        "proposed_pie_root": None,
        "is_true_cognate": None,
        "citation": None,
        "kept": True,
        "validated_at": now,
    }

    # Step 1 — Portfolio RAG lookup
    rag_url = "https://portfolio-rag-57478301787.us-central1.run.app/semantic"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(rag_url, json={
                "q": f"{cognate_word} PIE root etymology",
                "collection": "etymology",
                "n": 3,
            })
            resp.raise_for_status()
            chunks = resp.json().get("results", [])
    except Exception as e:
        logger.warning(f"[cognate] RAG lookup failed for '{cognate_word}': {e}")
        chunks = []

    # Step 2 — No chunks → rag_miss, keep the word
    if not chunks:
        logger.info(f"[cognate] rag_miss for '{cognate_word}' — kept (inconclusive)")
        return base_result

    # Step 3 — Call GPT-4o-mini with RAG context
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.error("[cognate] OPENAI_API_KEY not set — keeping word")
        return base_result

    rag_context = "\n\n".join([c.get("text", c.get("document", "")) for c in chunks[:3]])

    prompt = f"""You are an etymologist. Using ONLY the dictionary references below, determine:

1. What is the PIE root of the English word "{cognate_word}"?
2. Does "{cognate_word}" share the SAME PIE root as "{card_word}" (PIE root: "{card_pie_root}")?
   SAME ROOT means the words descend from the same Proto-Indo-European ancestor.
   DIFFERENT ROOT means they are synonyms, not cognates — they share meaning but not ancestry.

Dictionary references (Beekes / de Vaan):
{rag_context}

Respond ONLY with valid JSON:
{{
  "proposed_pie_root": "<the PIE root of {cognate_word}, or null if not in references>",
  "is_true_cognate": <true if same PIE root | false if different root | null if references don't answer>,
  "citation": "<exact dictionary entry supporting your answer, or null>"
}}

STRICT RULES:
- Use ONLY the references above — not your training knowledge
- If references don't mention "{cognate_word}" at all: set all fields to null, is_true_cognate to null
- is_true_cognate: null means "cannot determine" — NOT "probably not"
- is_true_cognate: false REQUIRES a positive citation showing a different root
- Never infer false without evidence"""

    try:
        import httpx as _httpx
        http_client = _httpx.Client(timeout=_httpx.Timeout(30.0, connect=10.0))
        oai = OpenAI(api_key=api_key, http_client=http_client)
        completion = oai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=200,
            temperature=0,
        )
        result = json.loads(completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"[cognate] GPT call failed for '{cognate_word}': {e}")
        return base_result

    # Step 4 — Determine kept
    kept = result.get("is_true_cognate") is not False
    return {
        "word": cognate_word,
        "proposed_pie_root": result.get("proposed_pie_root"),
        "is_true_cognate": result.get("is_true_cognate"),
        "citation": result.get("citation"),
        "kept": kept,
        "validated_at": now,
    }


async def process_card_cognates(
    english_cognates: str,
    card_pie_root: str,
    card_word: str,
) -> tuple:
    """Validate ALL cognates for a card.
    Returns: (cleaned_english_cognates, cognate_pie_roots_list, rag_miss_count)"""
    if not english_cognates or not english_cognates.strip():
        return english_cognates, [], 0

    words = [w.strip() for w in english_cognates.split(",") if w.strip()]
    audit = []
    rag_miss_count = 0

    for word in words:
        result = await validate_cognate(word, card_pie_root, card_word)
        if result["is_true_cognate"] is None and result["proposed_pie_root"] is None:
            rag_miss_count += 1
        audit.append(result)

    survivors = [r["word"] for r in audit if r["kept"]]
    cleaned = ", ".join(survivors)
    return cleaned, audit, rag_miss_count
