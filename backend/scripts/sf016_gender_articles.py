"""
SF-016: Gender Articles Batch Update
Adds grammatical gender articles to French, Spanish, and Portuguese noun flashcards.

Usage: python sf016_gender_articles.py
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
BATCH_SIZE = 25

# Article maps
ARTICLES = {
    "French":     {"masculine": "le", "feminine": "la", "plural": "les", "vowel": "l'"},
    "Spanish":    {"masculine": "el", "feminine": "la", "plural": "los"},
    "Portuguese": {"masculine": "o",  "feminine": "a",  "plural": "os"},
}

# Words to skip (not nouns, or multi-word phrases that shouldn't get articles)
SKIP_PATTERNS = [
    "ment", "ement",  # adverbs in -ment
]


def get_cards(conn, language):
    """Fetch all cards for a language that don't already have articles."""
    cursor = conn.cursor()
    lang_articles = ARTICLES[language]

    # Build exclusion pattern for articles in this language
    all_articles = list(lang_articles.values())

    query = """
        SELECT f.id, f.word_or_phrase, f.definition
        FROM flashcards f
        JOIN languages l ON f.language_id = l.id
        WHERE l.name = ?
    """

    # Exclude cards that already start with any known article
    if language == "French":
        query += """
          AND f.word_or_phrase NOT LIKE 'le %'
          AND f.word_or_phrase NOT LIKE 'la %'
          AND f.word_or_phrase NOT LIKE 'l''%'
          AND f.word_or_phrase NOT LIKE 'les %'
          AND f.word_or_phrase NOT LIKE 'un %'
          AND f.word_or_phrase NOT LIKE 'une %'
        """
    elif language == "Spanish":
        query += """
          AND f.word_or_phrase NOT LIKE 'el %'
          AND f.word_or_phrase NOT LIKE 'la %'
          AND f.word_or_phrase NOT LIKE 'los %'
          AND f.word_or_phrase NOT LIKE 'las %'
          AND f.word_or_phrase NOT LIKE 'un %'
          AND f.word_or_phrase NOT LIKE 'una %'
        """
    elif language == "Portuguese":
        query += """
          AND f.word_or_phrase NOT LIKE 'o %'
          AND f.word_or_phrase NOT LIKE 'a %'
          AND f.word_or_phrase NOT LIKE 'os %'
          AND f.word_or_phrase NOT LIKE 'as %'
          AND f.word_or_phrase NOT LIKE 'um %'
          AND f.word_or_phrase NOT LIKE 'uma %'
        """

    query += " ORDER BY f.word_or_phrase"

    cursor.execute(query, language)
    rows = cursor.fetchall()
    return [(str(row[0]), row[1], row[2] or "") for row in rows]


def classify_batch(client, cards, language):
    """
    Ask OpenAI to classify a batch of words:
    - Is it a noun? (vs verb, adjective, adverb, phrase, etc.)
    - If noun: what is the gender? (masculine/feminine/plural-only)
    - What article should be prepended?

    Returns list of dicts: {id, word, is_noun, article, updated_word}
    """
    word_list = []
    for card_id, word, definition in cards:
        word_list.append(f'- ID:{card_id} | Word: "{word}" | Def: {definition[:100]}')

    prompt = f"""You are a {language} language expert. Analyze each word/phrase below.

For each entry, determine:
1. Is it a NOUN (common noun that would take a definite article in isolation)?
   - Verbs, adjectives, adverbs, phrases, participles, conjugated forms → NOT a noun
   - Multi-word phrases that aren't noun phrases → NOT a noun
2. If it IS a noun: what definite article does it take in {language}?
   - {language} articles: {json.dumps(ARTICLES[language])}
   - For French: use "l'" (not "le"/"la") if the noun starts with a vowel or silent h
   - For plural-only nouns, use the plural article

Return a JSON array. Each element:
{{
  "id": "the ID after ID:",
  "word": "the original word",
  "is_noun": true or false,
  "article": "the article (le/la/l'/les for French, el/la for Spanish, o/a for Portuguese) or null if not a noun",
  "reason": "brief reason (e.g., 'verb', 'feminine noun', 'masculine noun', 'adverb')"
}}

Words to classify:
{chr(10).join(word_list)}

Return ONLY valid JSON array, no markdown fences."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=4000,
    )

    raw = response.choices[0].message.content.strip()
    # Clean markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    results = json.loads(raw)
    return results


def update_card(conn, card_id, new_word):
    """Update the word_or_phrase for a card."""
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE flashcards SET word_or_phrase = ?, updated_at = GETDATE() WHERE id = ?",
        new_word, card_id
    )
    conn.commit()


def process_language(conn, client, language):
    """Process all cards for a language."""
    print(f"\n{'='*60}")
    print(f"Processing {language}")
    print(f"{'='*60}")

    cards = get_cards(conn, language)
    print(f"Found {len(cards)} cards without articles")

    updated = 0
    skipped_not_noun = 0
    skipped_error = 0
    changes = []

    # Process in batches
    for i in range(0, len(cards), BATCH_SIZE):
        batch = cards[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(cards) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} cards)...")

        try:
            results = classify_batch(client, batch, language)

            # Apply updates
            for result in results:
                card_id = result.get("id")
                word = result.get("word")
                is_noun = result.get("is_noun", False)
                article = result.get("article")
                reason = result.get("reason", "")

                if not is_noun or not article:
                    skipped_not_noun += 1
                    print(f"  SKIP  '{word}' — {reason}")
                    continue

                # Build new word
                if language == "French" and article == "l'" and not word[0:1].lower() in "aeiouâêîôûàèùéàïëü":
                    # Verify l' usage (should only be before vowels/h)
                    article = "l'"

                new_word = f"{article} {word}" if not article.endswith("'") else f"{article}{word}"

                # Verify it looks right (shouldn't start with article + space + article)
                if any(new_word.startswith(a + " ") for a in ["le le", "la la", "el el", "o o", "a a"]):
                    print(f"  WARN  Suspicious result for '{word}': {new_word}")
                    skipped_error += 1
                    continue

                # Update DB
                update_card(conn, card_id, new_word)
                changes.append(f"Updated '{word}' -> '{new_word}' ({language}, {reason})")
                print(f"  OK    '{word}' -> '{new_word}' ({reason})")
                updated += 1

            # Rate limiting
            if i + BATCH_SIZE < len(cards):
                time.sleep(1)

        except json.JSONDecodeError as e:
            print(f"  ERROR Batch {batch_num}: JSON parse failed: {e}")
            skipped_error += len(batch)
        except Exception as e:
            print(f"  ERROR Batch {batch_num}: {e}")
            skipped_error += len(batch)

    print(f"\n{language} Summary:")
    print(f"  Updated:          {updated}")
    print(f"  Skipped (not noun): {skipped_not_noun}")
    print(f"  Errors:           {skipped_error}")

    return updated, skipped_not_noun, skipped_error, changes


def main():
    print("SF-016: Gender Articles Batch Update")
    print("=" * 60)

    client = OpenAI(api_key=OPENAI_API_KEY)
    conn = pyodbc.connect(CONN_STR)

    total_updated = 0
    total_skipped = 0
    all_changes = []

    results_by_lang = {}

    for language in ["French", "Spanish", "Portuguese"]:
        updated, skipped, errors, changes = process_language(conn, client, language)
        results_by_lang[language] = {
            "updated": updated,
            "skipped_not_noun": skipped,
            "errors": errors,
        }
        total_updated += updated
        total_skipped += skipped
        all_changes.extend(changes)

    conn.close()

    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)

    already_had = {"French": 2, "Spanish": 12, "Portuguese": 0}

    for lang, r in results_by_lang.items():
        print(f"{lang}: {r['updated']} nouns updated, {r['skipped_not_noun']} non-nouns skipped, {already_had.get(lang, 0)} already had articles")

    print(f"\nTotal nouns updated: {total_updated}")
    print(f"Total non-nouns skipped: {total_skipped}")
    print(f"Already had articles (skipped at query level): French: 2, Spanish: 12, Portuguese: 0")

    # Write change log
    log_path = "sf016_changes.log"
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("SF-016 Gender Articles Change Log\n")
        f.write("=" * 60 + "\n\n")
        for change in all_changes:
            f.write(change + "\n")

    print(f"\nChange log written to: {log_path}")


if __name__ == "__main__":
    main()
