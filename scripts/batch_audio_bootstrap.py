"""
Batch generate audio for all bootstrap flashcards that don't have audio yet.
Uses the existing /api/audio/generate/{card_id} endpoint.
"""
import pyodbc
import requests
import time
from datetime import datetime

# Connect to database
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=localhost\SQLEXPRESS;'
    r'DATABASE=LanguageLearning;'
    r'Trusted_Connection=yes;'
)
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Get all cards without audio
cursor.execute("""
    SELECT f.id, f.word_or_phrase, l.name as language
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    WHERE f.audio_url IS NULL OR f.audio_url = ''
    ORDER BY f.created_at DESC
""")

cards_to_process = cursor.fetchall()
total_cards = len(cards_to_process)

print("=" * 80)
print(f"BATCH AUDIO GENERATION FOR {total_cards} CARDS")
print("=" * 80)
print(f"Started at: {datetime.now().strftime('%H:%M:%S')}\n")

success_count = 0
error_count = 0
api_url = "http://localhost:8000/api/audio/generate"

for idx, (card_id, word, language) in enumerate(cards_to_process, 1):
    print(f"[{idx}/{total_cards}] {word[:40]:<40} ({language:<10})", end=" ... ")
    
    try:
        response = requests.post(f"{api_url}/{card_id}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ SUCCESS")
                success_count += 1
            else:
                print(f"❌ FAILED: {data.get('error', 'Unknown error')}")
                error_count += 1
        else:
            print(f"❌ HTTP {response.status_code}")
            error_count += 1
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT")
        error_count += 1
    except Exception as e:
        print(f"❌ ERROR: {str(e)[:50]}")
        error_count += 1
    
    # Small delay to avoid overwhelming the API
    time.sleep(0.5)

conn.close()

print("\n" + "=" * 80)
print("BATCH AUDIO GENERATION COMPLETE")
print("=" * 80)
print(f"Finished at: {datetime.now().strftime('%H:%M:%S')}")
print(f"✅ Successful: {success_count}")
print(f"❌ Failed: {error_count}")
print(f"📊 Total processed: {total_cards}")
