#!/usr/bin/env python3
"""
Fix Greek encoding corruption in flashcards table.

The data was inserted with UTF-8 bytes interpreted as Latin-1/Windows-1252.
This script deletes the corrupted records and re-inserts with correct Unicode.
"""

import os
import sys
import pyodbc
import uuid
from datetime import datetime

# Connection parameters
SERVER = os.getenv("SQL_SERVER", "35.224.242.223")
DATABASE = os.getenv("SQL_DATABASE", "LanguageLearning")
USERNAME = os.getenv("SQL_USER", "flashcards_user")
PASSWORD = os.getenv("SQL_PASSWORD", "")

GREEK_LANG_ID = "21D23A9E-4EF7-4D53-AD17-371D164D0F0F"

# The correct Greek flashcard data
GREEK_CARDS = [
    {
        "word_or_phrase": "αι",
        "definition": "[e] as in 'bed' - Example: και (ke) = 'and'",
        "ipa_pronunciation": "/e/",
        "etymology": "Greek diphthong - always pronounced as single 'e' sound",
        "english_cognates": "Similar to 'e' in 'bet'",
        "related_words": '["και", "αίμα", "παιδί"]',
    },
    {
        "word_or_phrase": "ει",
        "definition": "[i] as in 'see' - Example: είναι (ine) = 'is/are'",
        "ipa_pronunciation": "/i/",
        "etymology": "Greek diphthong - pronounced as long 'ee' sound",
        "english_cognates": "Similar to 'ee' in 'see'",
        "related_words": '["είναι", "είδα", "είκοσι"]',
    },
    {
        "word_or_phrase": "οι",
        "definition": "[i] as in 'see' - Example: οι (i) = 'the' (plural)",
        "ipa_pronunciation": "/i/",
        "etymology": "Greek diphthong - also pronounced as long 'ee' sound (same as ει)",
        "english_cognates": "Similar to 'ee' in 'see'",
        "related_words": '["οι", "ποιος", "οικογένεια"]',
    },
    {
        "word_or_phrase": "υι",
        "definition": "[i] as in 'see' - Example: υιός (ios) = 'son'",
        "ipa_pronunciation": "/i/",
        "etymology": "Greek diphthong - less common, also 'ee' sound",
        "english_cognates": "Similar to 'ee' in 'see'",
        "related_words": '["υιός", "υιοθεσία"]',
    },
    {
        "word_or_phrase": "αυ",
        "definition": "[av] before vowels/voiced consonants, [af] before voiceless - Example: αυτός (aftos) = 'he'",
        "ipa_pronunciation": "/av/ or /af/",
        "etymology": "CONTEXT-DEPENDENT: [af] before κ,π,τ,χ,φ,θ,σ,ξ,ψ; [av] elsewhere",
        "english_cognates": "Like 'av' in 'have' or 'af' in 'after'",
        "related_words": '["αυτός", "αύριο", "αυγό"]',
    },
    {
        "word_or_phrase": "ευ",
        "definition": "[ev] before vowels/voiced consonants, [ef] before voiceless - Example: ευχαριστώ (efcharisto) = 'thank you'",
        "ipa_pronunciation": "/ev/ or /ef/",
        "etymology": "CONTEXT-DEPENDENT: [ef] before κ,π,τ,χ,φ,θ,σ,ξ,ψ; [ev] elsewhere",
        "english_cognates": "Like 'ev' in 'ever' or 'ef' in 'effort'",
        "related_words": '["ευχαριστώ", "Ευρώπη", "ευτυχία"]',
    },
    {
        "word_or_phrase": "ου",
        "definition": "[u] as in 'food' - Example: που (pu) = 'where/that'",
        "ipa_pronunciation": "/u/",
        "etymology": "Greek diphthong - always 'oo' sound",
        "english_cognates": "Similar to 'oo' in 'food'",
        "related_words": '["που", "ούτε", "μου"]',
    },
    {
        "word_or_phrase": "ντ",
        "definition": "[d] at start of word, [nd] in middle - Example: ντομάτα (domata) = 'tomato'",
        "ipa_pronunciation": "/d/ or /nd/",
        "etymology": "POSITION-DEPENDENT: [d] word-initially, [nd] word-medially",
        "english_cognates": "Like 'd' in 'dog' or 'nd' in 'and'",
        "related_words": '["ντομάτα", "κόντρα", "πέντε"]',
    },
    {
        "word_or_phrase": "μπ",
        "definition": "[b] at start of word, [mb] in middle - Example: μπάλα (bala) = 'ball'",
        "ipa_pronunciation": "/b/ or /mb/",
        "etymology": "POSITION-DEPENDENT: [b] word-initially, [mb] word-medially",
        "english_cognates": "Like 'b' in 'ball' or 'mb' in 'number'",
        "related_words": '["μπάλα", "μπαμπάς", "κόμπος"]',
    },
    {
        "word_or_phrase": "γγ",
        "definition": "[ng] as in 'finger' - Example: αγγελία (angelia) = 'announcement'",
        "ipa_pronunciation": "/ŋg/",
        "etymology": "Double gamma - nasal 'ng' followed by hard 'g'",
        "english_cognates": "Like 'ng' in 'finger' (not 'singer')",
        "related_words": '["αγγελία", "άγγελος", "Αγγλία"]',
    },
    {
        "word_or_phrase": "γκ",
        "definition": "[g] at start of word, [ng] in middle - Example: γκαράζ (garaz) = 'garage'",
        "ipa_pronunciation": "/g/ or /ŋg/",
        "etymology": "POSITION-DEPENDENT: [g] word-initially, [ng] word-medially",
        "english_cognates": "Like 'g' in 'go' or 'ng' in 'finger'",
        "related_words": '["γκαράζ", "αγκαλιά", "έλεγχος"]',
    },
    {
        "word_or_phrase": "τσ",
        "definition": "[ts] as in 'cats' - Example: τσάι (tsai) = 'tea'",
        "ipa_pronunciation": "/ts/",
        "etymology": "Greek consonant cluster - always 'ts' sound",
        "english_cognates": "Like 'ts' in 'cats' or 'pizza'",
        "related_words": '["τσάι", "τσάντα", "πίτσα"]',
    },
    {
        "word_or_phrase": "τζ",
        "definition": "[dz] as in 'adze' - Example: τζάμι (dzami) = 'window/glass'",
        "ipa_pronunciation": "/dz/",
        "etymology": "Greek consonant cluster - voiced 'dz' sound",
        "english_cognates": "Like 'ds' in 'beds' or Italian 'z' in 'pizza'",
        "related_words": '["τζάμι", "τζατζίκι", "τζάκι"]',
    },
    {
        "word_or_phrase": "ντζ",
        "definition": "[ndz] as in 'hands' - Example: πορτζιά (portza) = 'orange (tree)'",
        "ipa_pronunciation": "/ndz/",
        "etymology": "Greek consonant cluster - nasal plus 'dz'",
        "english_cognates": "Like 'nds' in 'hands'",
        "related_words": '["πορτοκάλι", "τζιτζίκι"]',
    },
    {
        "word_or_phrase": "ξ",
        "definition": "[ks] as in 'box' - Example: ξένος (ksenos) = 'foreign/stranger'",
        "ipa_pronunciation": "/ks/",
        "etymology": "Single letter representing 'ks' cluster",
        "english_cognates": "Like 'x' in 'box' or 'ks' in 'thanks'",
        "related_words": '["ξένος", "ξέρω", "ξύλο"]',
    },
    {
        "word_or_phrase": "ψ",
        "definition": "[ps] as in 'lips' - Example: ψωμί (psomi) = 'bread'",
        "ipa_pronunciation": "/ps/",
        "etymology": "Single letter representing 'ps' cluster",
        "english_cognates": "Like 'ps' in 'lips' or 'lapse'",
        "related_words": '["ψωμί", "ψάρι", "ψυχή"]',
    },
    {
        "word_or_phrase": "γχ",
        "definition": "[ŋx] as in 'synchro' - Example: σύγχρονος (sinchronos) = 'contemporary'",
        "ipa_pronunciation": "/ŋx/",
        "etymology": "Greek consonant cluster - nasal 'ng' plus 'ch' sound",
        "english_cognates": "Like 'nch' in German 'München'",
        "related_words": '["σύγχρονος", "έλεγχος", "άγχος"]',
    },
]


def main():
    if not PASSWORD:
        print("ERROR: SQL_PASSWORD environment variable not set")
        print("Usage: SQL_PASSWORD='your-password' python fix_greek_encoding.py")
        sys.exit(1)

    # Build connection string
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SERVER},1433;"
        f"DATABASE={DATABASE};"
        f"UID={USERNAME};"
        f"PWD={PASSWORD};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=yes;"
    )

    print(f"Connecting to {SERVER}/{DATABASE}...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # Step 1: Count corrupted records
    print("\n=== Checking current records ===")
    cursor.execute(
        "SELECT COUNT(*) FROM flashcards WHERE source = 'Greek Pronunciation Import'"
    )
    count = cursor.fetchone()[0]
    print(f"Found {count} Greek pronunciation records to replace")

    # Step 2: Delete corrupted records
    print("\n=== Deleting corrupted records ===")
    cursor.execute("DELETE FROM flashcards WHERE source = 'Greek Pronunciation Import'")
    deleted = cursor.rowcount
    print(f"Deleted {deleted} records")

    # Step 3: Insert correct records
    print("\n=== Inserting correct Greek cards ===")
    insert_sql = """
        INSERT INTO flashcards (id, language_id, word_or_phrase, definition,
                                ipa_pronunciation, etymology, english_cognates,
                                related_words, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Greek Pronunciation Import', GETDATE(), GETDATE())
    """

    for card in GREEK_CARDS:
        card_id = str(uuid.uuid4())
        cursor.execute(
            insert_sql,
            (
                card_id,
                GREEK_LANG_ID,
                card["word_or_phrase"],
                card["definition"],
                card["ipa_pronunciation"],
                card["etymology"],
                card["english_cognates"],
                card["related_words"],
            ),
        )
        # Print ASCII-safe version
        print(f"  Inserted card {len(GREEK_CARDS) - GREEK_CARDS.index(card)}/{len(GREEK_CARDS)}")

    conn.commit()
    print(f"\nInserted {len(GREEK_CARDS)} correct Greek cards")

    # Step 4: Verify
    print("\n=== Verification ===")
    cursor.execute(
        "SELECT COUNT(*) FROM flashcards WHERE source = 'Greek Pronunciation Import'"
    )
    count = cursor.fetchone()[0]
    print(f"Total: {count} Greek cards now in database")

    cursor.close()
    conn.close()
    print("\n=== Fix complete! ===")


if __name__ == "__main__":
    main()
