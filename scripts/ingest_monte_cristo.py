"""
SF-SENT-001: Ingest Count of Monte Cristo (French) as sentence flashcards.
Downloads from Project Gutenberg, splits into sentences by chapter (Ch 1-5),
translates via GPT-4o-mini, generates IPA, and inserts into Cloud SQL.

Usage:
    python scripts/ingest_monte_cristo.py --db-password <pw>
    python scripts/ingest_monte_cristo.py --db-password <pw> --dry-run
    python scripts/ingest_monte_cristo.py --db-password <pw> --chapter 1
"""

import re
import os
import sys
import json
import time
import uuid
import hashlib
import argparse
import logging
import pyodbc
from typing import List, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────────
FRENCH_LANGUAGE_ID = "9E4D5CA8-FFEC-47B9-9943-5F2DD1093593"
SOURCE_BOOK = "Le Comte de Monte-Cristo"
SQL_SERVER = "35.224.242.223"
SQL_DATABASE = "LanguageLearning"
SQL_USER = "flashcards_user"

GUTENBERG_URL = "https://www.gutenberg.org/cache/epub/17989/pg17989.txt"
CHAPTER_TITLES = {
    1: "Marseille.--L'arrivée.",
    2: "Le père et le fils.",
    3: "Les Catalans.",
    4: "Complot.",
    5: "Le repas des fiançailles.",
}

# ── French IPA (basic phonetic rules) ──────────────────────────────────────
# We generate approximate French IPA using rule-based conversion.
# This is sufficient for shadowing feedback; production could use espeak-ng.

FRENCH_IPA_MAP = [
    # Digraphs/trigraphs first
    (r"eau", "o"), (r"eaux", "o"), (r"aux", "o"),
    (r"ou", "u"), (r"oi", "wa"), (r"ai", "ɛ"), (r"ei", "ɛ"),
    (r"au", "o"), (r"eu", "ø"), (r"oeu", "œ"),
    (r"an", "ɑ̃"), (r"am", "ɑ̃"), (r"en", "ɑ̃"), (r"em", "ɑ̃"),
    (r"in", "ɛ̃"), (r"im", "ɛ̃"), (r"ain", "ɛ̃"), (r"ein", "ɛ̃"),
    (r"on", "ɔ̃"), (r"om", "ɔ̃"), (r"un", "œ̃"),
    (r"ch", "ʃ"), (r"ph", "f"), (r"gn", "ɲ"), (r"qu", "k"),
    (r"th", "t"), (r"ll", "l"), (r"ss", "s"), (r"tt", "t"),
    (r"mm", "m"), (r"nn", "n"), (r"pp", "p"), (r"rr", "ʁ"),
    # Single letters
    (r"é", "e"), (r"è", "ɛ"), (r"ê", "ɛ"), (r"ë", "ɛ"),
    (r"à", "a"), (r"â", "ɑ"), (r"ù", "y"), (r"û", "y"),
    (r"ô", "o"), (r"î", "i"), (r"ï", "i"), (r"ç", "s"),
    (r"c", "k"), (r"g", "ɡ"), (r"j", "ʒ"),
    (r"r", "ʁ"), (r"u", "y"), (r"y", "i"),
    (r"x", "ks"), (r"w", "v"),
]


def basic_french_ipa(text: str) -> str:
    """Generate approximate French IPA transcription."""
    result = text.lower().strip()
    # Remove trailing silent e in many words
    result = re.sub(r"e\b", "", result)
    for pattern, replacement in FRENCH_IPA_MAP:
        result = result.replace(pattern, replacement)
    # Clean up: keep IPA chars + spaces + punctuation
    return f"/{result}/"


# ── Text parsing ───────────────────────────────────────────────────────────

def download_text(url: str = GUTENBERG_URL) -> str:
    """Download Monte Cristo text from Gutenberg (or use cached file)."""
    import tempfile
    cache_path = os.path.join(tempfile.gettempdir(), "monte_cristo_fr.txt")
    if os.path.exists(cache_path):
        logger.info(f"Using cached text from {cache_path}")
        with open(cache_path, "r", encoding="utf-8") as f:
            return f.read()

    import urllib.request
    logger.info(f"Downloading from {url}...")
    with urllib.request.urlopen(url) as resp:
        text = resp.read().decode("utf-8")
    with open(cache_path, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def extract_chapters(text: str, max_chapters: int = 5) -> List[Tuple[int, str, str]]:
    """
    Extract chapters from Monte Cristo text.
    Returns list of (chapter_num, title, chapter_text).
    """
    lines = text.split("\n")

    # Find chapter start lines: standalone Roman numerals on their own line
    chapter_starts = []
    roman_to_int = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
                    "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped in roman_to_int:
            num = roman_to_int[stripped]
            if num <= max_chapters:
                chapter_starts.append((num, i))

    chapters = []
    for idx, (num, start_line) in enumerate(chapter_starts):
        # Chapter text runs from start_line to next chapter or end
        if idx + 1 < len(chapter_starts):
            end_line = chapter_starts[idx + 1][1]
        else:
            # For the last chapter we want, find the next chapter marker or go 1000 lines
            # Look for chapter VI marker
            end_line = start_line + 2000
            for j in range(start_line + 1, min(len(lines), start_line + 3000)):
                if lines[j].strip() in roman_to_int and roman_to_int.get(lines[j].strip(), 0) == num + 1:
                    end_line = j
                    break

        chapter_text = "\n".join(lines[start_line:end_line])
        title = CHAPTER_TITLES.get(num, f"Chapter {num}")
        chapters.append((num, title, chapter_text))

    return chapters


def split_sentences(chapter_text: str, max_per_chapter: int = 50) -> List[str]:
    """
    Split French text into sentences.
    Handles dialogue (« »), abbreviations, and French punctuation.
    """
    # Remove chapter number header (first few lines)
    lines = chapter_text.split("\n")
    # Skip empty lines and chapter title at start
    text_lines = []
    started = False
    for line in lines[2:]:  # skip roman numeral + title
        stripped = line.strip()
        if not started and not stripped:
            continue
        if stripped:
            started = True
        text_lines.append(stripped)

    text = " ".join(text_lines)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Split on sentence-ending punctuation followed by space + uppercase or quote
    sentences = re.split(r'(?<=[.!?»])\s+(?=[A-ZÀ-ÜÉ«\-])', text)

    # Filter: reasonable length (15-500 chars), not just whitespace
    filtered = []
    for s in sentences:
        s = s.strip()
        if 15 <= len(s) <= 500:
            filtered.append(s)
        elif len(s) > 500:
            # Try to split long sentences at semicolons or commas
            parts = re.split(r'(?<=[;])\s+', s)
            for p in parts:
                p = p.strip()
                if 15 <= len(p) <= 500:
                    filtered.append(p)

    return filtered[:max_per_chapter]


# ── Translation via GPT-4o-mini ────────────────────────────────────────────

def batch_translate(sentences: List[str], openai_key: str, batch_size: int = 10) -> List[str]:
    """Translate French sentences to English using GPT-4o-mini in batches."""
    import openai
    client = openai.OpenAI(api_key=openai_key)
    translations = []

    for i in range(0, len(sentences), batch_size):
        batch = sentences[i:i + batch_size]
        numbered = "\n".join(f"{j+1}. {s}" for j, s in enumerate(batch))

        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a literary translator. Translate French to English. "
                     "Maintain the literary style of Alexandre Dumas. "
                     "Return ONLY the numbered translations, one per line, matching the input numbering. "
                     "Format: 1. <translation>"},
                    {"role": "user", "content": f"Translate these French sentences:\n{numbered}"}
                ],
                temperature=0.3,
                max_tokens=4000,
            )
            result = resp.choices[0].message.content.strip()

            # Parse numbered translations
            batch_translations = []
            for line in result.split("\n"):
                line = line.strip()
                match = re.match(r"^\d+\.\s*(.+)$", line)
                if match:
                    batch_translations.append(match.group(1))

            # Pad if we didn't get enough back
            while len(batch_translations) < len(batch):
                batch_translations.append("[translation pending]")

            translations.extend(batch_translations[:len(batch)])
            logger.info(f"  Translated batch {i//batch_size + 1}: {len(batch)} sentences")

        except Exception as e:
            logger.error(f"  Translation error: {e}")
            translations.extend(["[translation error]"] * len(batch))

        # Rate limiting
        if i + batch_size < len(sentences):
            time.sleep(1)

    return translations


# ── DB insertion ───────────────────────────────────────────────────────────

def get_db_connection(password: str):
    """Connect to Cloud SQL."""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SQL_SERVER};"
        f"DATABASE={SQL_DATABASE};"
        f"UID={SQL_USER};"
        f"PWD={password};"
    )
    return pyodbc.connect(conn_str)


def insert_sentence_cards(
    conn,
    sentences: List[str],
    translations: List[str],
    chapter_num: int,
    chapter_title: str,
    dry_run: bool = False,
) -> int:
    """Insert sentence flashcards for one chapter."""
    cursor = conn.cursor()
    inserted = 0

    for i, (sentence, translation) in enumerate(zip(sentences, translations), 1):
        card_id = str(uuid.uuid4())
        ipa = basic_french_ipa(sentence)

        if dry_run:
            logger.info(f"  [DRY RUN] Ch{chapter_num} #{i}: {sentence[:60]}...")
            continue

        try:
            cursor.execute("""
                INSERT INTO flashcards
                (id, language_id, word_or_phrase, definition, translation,
                 ipa_pronunciation, card_type, source_book, chapter_number,
                 sentence_order, source)
                VALUES (?, ?, ?, ?, ?, ?, 'sentence', ?, ?, ?, 'imported')
            """,
                card_id,
                FRENCH_LANGUAGE_ID,
                sentence,             # word_or_phrase = the French sentence
                f"Ch. {chapter_num}: {chapter_title}",  # definition = chapter context
                translation,          # English translation
                ipa,                  # IPA transcription
                SOURCE_BOOK,
                chapter_num,
                i,                    # sentence_order within chapter
            )
            inserted += 1
        except Exception as e:
            logger.error(f"  Insert error for Ch{chapter_num} #{i}: {e}")

    if not dry_run:
        conn.commit()

    return inserted


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ingest Monte Cristo sentences into Super Flashcards")
    parser.add_argument("--db-password", required=True, help="SQL Server password")
    parser.add_argument("--openai-key", default=None, help="OpenAI API key (or set OPENAI_API_KEY env)")
    parser.add_argument("--dry-run", action="store_true", help="Parse and translate but don't insert")
    parser.add_argument("--chapter", type=int, default=None, help="Ingest only this chapter (1-5)")
    parser.add_argument("--max-sentences", type=int, default=50, help="Max sentences per chapter")
    parser.add_argument("--skip-translate", action="store_true", help="Skip translation (insert placeholder)")
    args = parser.parse_args()

    openai_key = args.openai_key or os.getenv("OPENAI_API_KEY")
    if not openai_key and not args.skip_translate:
        logger.error("OpenAI API key required. Use --openai-key or set OPENAI_API_KEY env.")
        sys.exit(1)

    # 1. Download and parse text
    text = download_text()
    chapters = extract_chapters(text)
    logger.info(f"Found {len(chapters)} chapters")

    if args.chapter:
        chapters = [(n, t, txt) for n, t, txt in chapters if n == args.chapter]
        if not chapters:
            logger.error(f"Chapter {args.chapter} not found")
            sys.exit(1)

    # 2. Connect to DB
    conn = None
    if not args.dry_run:
        conn = get_db_connection(args.db_password)
        # Check for existing sentence cards from this book
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM flashcards WHERE card_type='sentence' AND source_book=?",
            SOURCE_BOOK,
        )
        existing = cursor.fetchone()[0]
        if existing > 0:
            logger.warning(f"Found {existing} existing sentence cards from '{SOURCE_BOOK}'. Skipping duplicates.")
            # Get existing chapter+order combos
            cursor.execute(
                "SELECT chapter_number, sentence_order FROM flashcards WHERE card_type='sentence' AND source_book=?",
                SOURCE_BOOK,
            )
            existing_keys = set((row[0], row[1]) for row in cursor.fetchall())
        else:
            existing_keys = set()
    else:
        existing_keys = set()

    total_inserted = 0

    for chapter_num, title, chapter_text in chapters:
        logger.info(f"\n{'='*60}")
        logger.info(f"Chapter {chapter_num}: {title}")
        logger.info(f"{'='*60}")

        # 3. Split into sentences
        sentences = split_sentences(chapter_text, max_per_chapter=args.max_sentences)
        logger.info(f"  Extracted {len(sentences)} sentences")

        if not sentences:
            continue

        # Filter out already-ingested sentences
        if existing_keys:
            filtered = []
            filtered_translations_needed = []
            for i, s in enumerate(sentences, 1):
                if (chapter_num, i) not in existing_keys:
                    filtered.append(s)
                    filtered_translations_needed.append(i)
            if len(filtered) < len(sentences):
                logger.info(f"  Skipping {len(sentences) - len(filtered)} already-ingested sentences")
            sentences = filtered

        if not sentences:
            logger.info(f"  All sentences already ingested for Chapter {chapter_num}")
            continue

        # 4. Translate
        if args.skip_translate:
            translations = ["[translation pending]"] * len(sentences)
        else:
            logger.info(f"  Translating {len(sentences)} sentences...")
            translations = batch_translate(sentences, openai_key)

        # 5. Insert
        if args.dry_run:
            for i, (s, t) in enumerate(zip(sentences, translations), 1):
                ipa = basic_french_ipa(s)
                logger.info(f"  [{i}] FR: {s[:80]}...")
                logger.info(f"       EN: {t[:80]}...")
                logger.info(f"       IPA: {ipa[:60]}...")
            total_inserted += len(sentences)
        else:
            count = insert_sentence_cards(conn, sentences, translations, chapter_num, title)
            total_inserted += count
            logger.info(f"  Inserted {count} sentence cards for Chapter {chapter_num}")

    if conn:
        conn.close()

    logger.info(f"\n{'='*60}")
    logger.info(f"TOTAL: {'Would insert' if args.dry_run else 'Inserted'} {total_inserted} sentence cards")
    logger.info(f"Book: {SOURCE_BOOK}")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
