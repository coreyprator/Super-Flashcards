#!/usr/bin/env python3
import requests
import json

# Get flashcards from API
response = requests.get("http://localhost:8000/api/flashcards/?language_id=362b8846-c4ca-49b0-92c0-c8d207cf8d56")
if response.status_code == 200:
    flashcards = response.json()
    print(f"Total flashcards: {len(flashcards)}")
    print("\nRecent flashcards:")
    for i, card in enumerate(flashcards[:10]):
        print(f"{i+1}. Word: {card['word_or_phrase']}")
        print(f"   Definition: {card.get('definition', 'N/A')}")
        print(f"   Etymology: {card.get('etymology', 'N/A')}")
        print(f"   ID: {card['id']}")
        print()
else:
    print(f"Error: {response.status_code}")