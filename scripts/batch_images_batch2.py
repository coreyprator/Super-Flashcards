"""
Batch Image Generation Script for Bootstrap Vocabulary (Batch 2)
Generates AI images for flashcards without image_url
"""

import pyodbc
import requests
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=LanguageLearning;"
    "Trusted_Connection=yes;"
)

def get_cards_without_images():
    """Get all flashcards that don't have images"""
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT f.id, f.word_or_phrase, l.id as language_id, l.name as language_name
        FROM flashcards f
        JOIN languages l ON f.language_id = l.id
        WHERE f.image_url IS NULL
        ORDER BY l.name, f.word_or_phrase
    """)
    
    cards = []
    for row in cursor.fetchall():
        cards.append({
            'id': str(row.id),
            'word': row.word_or_phrase,
            'language_id': str(row.language_id),
            'language_name': row.language_name
        })
    
    conn.close()
    return cards

def generate_image(word, language_id):
    """Call the API to generate an image"""
    url = f"{API_BASE_URL}/api/ai/image"
    params = {
        'word_or_phrase': word,
        'language_id': language_id
    }
    
    try:
        response = requests.post(url, params=params, timeout=180)  # 3 minute timeout
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        return {'error': 'Request timed out after 180 seconds'}
    except requests.exceptions.RequestException as e:
        return {'error': str(e)}

def update_card_image(card_id, image_url):
    """Update flashcard with generated image URL"""
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE flashcards 
        SET image_url = ?, updated_at = GETDATE()
        WHERE id = ?
    """, (image_url, card_id))
    
    conn.commit()
    conn.close()

def main():
    print("=" * 80)
    cards = get_cards_without_images()
    print(f"BATCH IMAGE GENERATION FOR {len(cards)} CARDS")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print(f"Estimated time: {len(cards) * 3} minutes (3 min per image)")
    print("=" * 80)
    print()
    
    stats = {
        'total': len(cards),
        'success': 0,
        'failed': 0,
        'skipped': 0
    }
    
    for i, card in enumerate(cards, 1):
        print(f"\n[{i}/{len(cards)}] {card['language_name']}: {card['word']}")
        print(f"  Language ID: {card['language_id']}")
        
        # Generate image
        result = generate_image(card['word'], card['language_id'])
        
        if 'error' in result:
            print(f"  ❌ ERROR: {result['error']}")
            stats['failed'] += 1
        elif 'image_url' in result:
            # Update database
            update_card_image(card['id'], result['image_url'])
            print(f"  ✅ SUCCESS: {result['image_url'][:80]}...")
            stats['success'] += 1
        else:
            print(f"  ⚠️  UNEXPECTED RESPONSE: {result}")
            stats['failed'] += 1
        
        # Progress update every 10 cards
        if i % 10 == 0:
            elapsed = i * 3  # rough estimate
            remaining = (len(cards) - i) * 3
            print(f"\n  📊 Progress: {i}/{len(cards)} ({i*100//len(cards)}%)")
            print(f"  ⏱️  Estimated remaining: ~{remaining} minutes")
        
        # Small delay between requests
        if i < len(cards):
            time.sleep(1)
    
    # Final summary
    print("\n" + "=" * 80)
    print("BATCH IMAGE GENERATION COMPLETE")
    print("=" * 80)
    print(f"Total cards:     {stats['total']}")
    print(f"✅ Successful:   {stats['success']}")
    print(f"❌ Failed:       {stats['failed']}")
    print(f"Success rate:    {stats['success']*100//stats['total'] if stats['total'] > 0 else 0}%")
    print("=" * 80)
    print(f"Finished at: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 80)

if __name__ == '__main__':
    main()
