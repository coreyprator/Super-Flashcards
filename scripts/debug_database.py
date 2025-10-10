#!/usr/bin/env python3
import requests

# Check languages
print("=== CHECKING LANGUAGES ===")
response = requests.get("http://localhost:8000/api/languages/")
if response.status_code == 200:
    languages = response.json()
    print(f"Found {len(languages)} languages:")
    for lang in languages:
        print(f"  - Name: {lang['name']}, Code: {lang['code']}, ID: {lang['id']}")
        
        # Check flashcards for this language
        fc_response = requests.get(f"http://localhost:8000/api/flashcards/?language_id={lang['id']}")
        if fc_response.status_code == 200:
            flashcards = fc_response.json()
            print(f"    Flashcards: {len(flashcards)}")
            
            # Show recent flashcards
            for i, card in enumerate(flashcards[:3]):
                print(f"      {i+1}. {card['word_or_phrase']} - {card.get('definition', 'N/A')[:30]}...")
        print()
else:
    print(f"Error getting languages: {response.status_code}")