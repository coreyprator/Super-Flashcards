"""
Batch generate images for all bootstrap flashcards that don't have images yet.
Uses the existing /api/ai/image endpoint.
"""
import pyodbc
import requests
import time
from datetime import datetime
import urllib.parse

# Connect to database
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=localhost\SQLEXPRESS;'
    r'DATABASE=LanguageLearning;'
    r'Trusted_Connection=yes;'
)
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Get all cards without images
cursor.execute("""
    SELECT f.id, f.word_or_phrase, f.language_id, l.name as language
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    WHERE f.image_url IS NULL OR f.image_url = ''
    ORDER BY f.created_at DESC
""")

cards_to_process = cursor.fetchall()
total_cards = len(cards_to_process)

print("=" * 80)
print(f"BATCH IMAGE GENERATION FOR {total_cards} CARDS")
print("=" * 80)
print(f"Started at: {datetime.now().strftime('%H:%M:%S')}\n")

success_count = 0
error_count = 0
api_url = "http://localhost:8000/api/ai/image"

for idx, (card_id, word, language_id, language) in enumerate(cards_to_process, 1):
    print(f"[{idx}/{total_cards}] {word[:40]:<40} ({language:<10})", end=" ... ")
    
    try:
        # Prepare query parameters
        params = {
            'word_or_phrase': word,
            'language_id': str(language_id)
        }
        
        response = requests.post(api_url, params=params, timeout=180)
        
        if response.status_code == 200:
            data = response.json()
            image_url = data.get('image_url')
            image_description = data.get('image_description')
            
            if image_url:
                # Update database
                update_cursor = conn.cursor()
                update_cursor.execute("""
                    UPDATE flashcards 
                    SET image_url = ?, image_description = ?
                    WHERE id = ?
                """, (image_url, image_description, card_id))
                conn.commit()
                
                print("✅ SUCCESS")
                success_count += 1
            else:
                print("❌ FAILED: No image URL returned")
                error_count += 1
        else:
            print(f"❌ HTTP {response.status_code}")
            error_count += 1
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT (3 minutes)")
        error_count += 1
    except Exception as e:
        print(f"❌ ERROR: {str(e)[:50]}")
        error_count += 1
    
    # Small delay to avoid overwhelming the API (image generation is slower)
    time.sleep(1)

conn.close()

print("\n" + "=" * 80)
print("BATCH IMAGE GENERATION COMPLETE")
print("=" * 80)
print(f"Finished at: {datetime.now().strftime('%H:%M:%S')}")
print(f"✅ Successful: {success_count}")
print(f"❌ Failed: {error_count}")
print(f"📊 Total processed: {total_cards}")
print(f"\n💡 To retry failed cards, just run this script again!")
