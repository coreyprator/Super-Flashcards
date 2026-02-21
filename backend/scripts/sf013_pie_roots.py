"""
SF-013: PIE Root Batch Extraction
Extracts Proto-Indo-European (PIE) root data from flashcard etymology text.

Usage: python sf013_pie_roots.py
"""

import os
import pyodbc
import json
import time
from openai import OpenAI

# DB connection
CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;"
    "DATABASE=LanguageLearning;"
    "UID=flashcards_user;"
    f"PWD={os.environ['DB_PASSWORD']};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
BATCH_SIZE = 50


def get_cards_needing_pie(conn, offset=0, limit=None):
    """Fetch cards with etymology data that don't have PIE roots yet."""
    cursor = conn.cursor()
    query = """
        SELECT f.id, f.word_or_phrase, f.etymology, l.name as language
        FROM flashcards f
        JOIN languages l ON f.language_id = l.id
        WHERE f.etymology IS NOT NULL
          AND LEN(f.etymology) > 20
          AND f.pie_root IS NULL
        ORDER BY l.name, f.word_or_phrase
    """
    if limit:
        query = f"""
            SELECT TOP {limit} f.id, f.word_or_phrase, f.etymology, l.name as language
            FROM flashcards f
            JOIN languages l ON f.language_id = l.id
            WHERE f.etymology IS NOT NULL
              AND LEN(f.etymology) > 20
              AND f.pie_root IS NULL
            ORDER BY l.name, f.word_or_phrase
            OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY
        """
    cursor.execute(query)
    rows = cursor.fetchall()
    return [(str(row[0]), row[1], row[2] or "", row[3]) for row in rows]


def extract_pie_batch(client, cards):
    """
    Ask OpenAI to extract PIE root from etymology text.

    For each card, returns:
    - has_pie_root: bool (many words don't have traceable PIE roots)
    - pie_root: e.g. "*bher-" or null
    - pie_meaning: e.g. "to carry" or null

    PIE roots apply to:
    - Indo-European language family words (English, French, Spanish, Portuguese, German, Italian, Greek)
    - NOT: proper nouns, loanwords from non-IE languages, invented terms

    PIE roots do NOT apply to:
    - Most Greek proper nouns (Achilles, etc.)
    - Arabic loanwords
    - Japanese/Chinese loanwords
    - Words with no clear IE etymology
    """
    entries = []
    for card_id, word, etymology, language in cards:
        entries.append(
            f'ID:{card_id} | Word: "{word}" ({language}) | Etymology: {etymology[:300]}'
        )

    prompt = f"""You are a historical linguistics expert specializing in Proto-Indo-European (PIE) etymology.

For each word below, analyze its etymology text and determine:
1. Does this word have a traceable Proto-Indo-European root?
2. If yes, what is the PIE root (with asterisk notation) and its meaning?

Guidelines:
- PIE roots use asterisk notation: *bher- "to carry", *peh2- "to protect", *h2eg- "to drive"
- Only assign PIE roots for genuine IE roots, not for:
  * Proper nouns from mythology (Achilles, Zeus, etc.)
  * Words from non-IE families (Arabic, Hebrew, Chinese, Japanese loan words)
  * Modern coinages/acronyms
  * Words whose etymology is uncertain or unknown
- Greek words DO have PIE roots when they're common nouns/verbs from IE roots
- For words with multiple possible PIE roots, give the most direct/primary one
- Keep pie_meaning concise: 2-6 words max

Return a JSON array. Each element:
{{
  "id": "the ID after 'ID:'",
  "word": "the word",
  "has_pie_root": true or false,
  "pie_root": "*root-" or null,
  "pie_meaning": "brief meaning" or null
}}

Words to analyze:
{chr(10).join(entries)}

Return ONLY valid JSON array, no markdown fences."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=6000,
    )

    raw = response.choices[0].message.content.strip()
    # Clean markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


def update_pie_root(conn, card_id, pie_root, pie_meaning):
    """Update pie_root and pie_meaning for a card."""
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE flashcards SET pie_root = ?, pie_meaning = ?, updated_at = GETDATE() WHERE id = ?",
        pie_root, pie_meaning, card_id
    )
    conn.commit()


def mark_no_pie(conn, card_id):
    """Mark a card as having no PIE root (set to 'N/A' to avoid re-processing)."""
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE flashcards SET pie_root = 'N/A', pie_meaning = NULL, updated_at = GETDATE() WHERE id = ?",
        card_id
    )
    conn.commit()


def main():
    print("SF-013: PIE Root Batch Extraction")
    print("=" * 60)

    client = OpenAI(api_key=OPENAI_API_KEY)
    conn = pyodbc.connect(CONN_STR)

    # Get all cards needing PIE roots
    print("Querying cards with etymology...")
    all_cards = get_cards_needing_pie(conn)
    total = len(all_cards)
    print(f"Found {total} cards needing PIE root extraction")

    updated_with_pie = 0
    marked_no_pie = 0
    errors = 0
    processed = 0

    # Process in batches
    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num, i in enumerate(range(0, total, BATCH_SIZE), 1):
        batch = all_cards[i:i + BATCH_SIZE]
        print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} cards, {processed}/{total} done)...")

        try:
            results = extract_pie_batch(client, batch)

            for result in results:
                card_id = result.get("id")
                word = result.get("word", "?")
                has_pie = result.get("has_pie_root", False)
                pie_root = result.get("pie_root")
                pie_meaning = result.get("pie_meaning")

                if has_pie and pie_root:
                    update_pie_root(conn, card_id, pie_root, pie_meaning)
                    print(f"  PIE   '{word}': {pie_root} = {pie_meaning}")
                    updated_with_pie += 1
                else:
                    mark_no_pie(conn, card_id)
                    marked_no_pie += 1

                processed += 1

        except json.JSONDecodeError as e:
            print(f"  ERROR Batch {batch_num}: JSON parse failed: {e}")
            errors += len(batch)
            processed += len(batch)
        except Exception as e:
            print(f"  ERROR Batch {batch_num}: {e}")
            errors += len(batch)
            processed += len(batch)

        # Progress summary every 5 batches
        if batch_num % 5 == 0:
            print(f"\n  -- Progress: {processed}/{total} cards, {updated_with_pie} with PIE roots, {marked_no_pie} without --\n")

        # Rate limiting between batches
        if i + BATCH_SIZE < total:
            time.sleep(1)

    conn.close()

    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    print(f"Total processed:          {processed}")
    print(f"Cards with PIE root:      {updated_with_pie}")
    print(f"Cards without PIE root:   {marked_no_pie}")
    print(f"Errors:                   {errors}")
    print(f"Coverage: {round(updated_with_pie / max(processed, 1) * 100, 1)}% of processed cards have PIE roots")


if __name__ == "__main__":
    main()
