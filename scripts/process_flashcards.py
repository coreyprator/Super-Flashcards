#!/usr/bin/env python3
"""
Process Imported Flashcards through AI Generation
Takes incomplete flashcards and processes them through the AI API to add translations, definitions, and images.
"""

import requests
import json
import time
from typing import List, Dict

class FlashcardProcessor:
    """Process flashcards through AI generation API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.french_language_id = "9e4d5ca8-ffec-47b9-9943-5f2dd1093593"  # French language ID
    
    def get_incomplete_flashcards(self) -> List[Dict]:
        """Get flashcards that need AI processing (those with '[To be translated]' definition)."""
        try:
            response = requests.get(f"{self.base_url}/api/flashcards/?language_id={self.french_language_id}")
            response.raise_for_status()
            
            flashcards = response.json()
            
            # Filter for incomplete flashcards
            incomplete = [
                card for card in flashcards 
                if card.get('definition') == '[To be translated]'
            ]
            
            print(f"Found {len(incomplete)} incomplete flashcards to process")
            return incomplete
            
        except Exception as e:
            print(f"❌ Error fetching flashcards: {e}")
            return []
    
    def process_flashcard_with_ai(self, flashcard: Dict) -> bool:
        """Process a single flashcard through the AI generation API."""
        try:
            word = flashcard['word_or_phrase']
            flashcard_id = flashcard['id']
            
            print(f"🔄 Processing: {word}")
            
            # Call AI generation API
            ai_request = {
                "word_or_phrase": word,
                "language_id": self.french_language_id,
                "include_image": True
            }
            
            response = requests.post(
                f"{self.base_url}/api/ai/generate",
                json=ai_request,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                ai_result = response.json()
                print(f"✅ AI generated content for: {word}")
                print(f"   Definition: {ai_result.get('definition', 'N/A')[:50]}...")
                print(f"   Etymology: {ai_result.get('etymology', 'N/A')[:50]}...")
                print(f"   Image: {'Yes' if ai_result.get('image_url') else 'No'}")
                return True
            else:
                print(f"❌ AI generation failed for {word}: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error processing {flashcard.get('word_or_phrase', 'unknown')}: {e}")
            return False
    
    def process_all_incomplete_flashcards(self, max_cards: int = 5):
        """Process multiple incomplete flashcards."""
        incomplete_cards = self.get_incomplete_flashcards()
        
        if not incomplete_cards:
            print("✅ No incomplete flashcards found!")
            return
        
        # Limit to max_cards for testing
        cards_to_process = incomplete_cards[:max_cards]
        
        print(f"🚀 Processing {len(cards_to_process)} flashcards...")
        print("=" * 50)
        
        successful = 0
        failed = 0
        
        for i, card in enumerate(cards_to_process, 1):
            print(f"\n[{i}/{len(cards_to_process)}] Processing: {card['word_or_phrase']}")
            
            if self.process_flashcard_with_ai(card):
                successful += 1
            else:
                failed += 1
            
            # Small delay to avoid overwhelming the API
            if i < len(cards_to_process):
                print("⏳ Waiting 2 seconds...")
                time.sleep(2)
        
        print("\n" + "=" * 50)
        print(f"📊 Processing Summary:")
        print(f"   ✅ Successful: {successful}")
        print(f"   ❌ Failed: {failed}")
        print(f"   📚 Total processed: {successful + failed}")
        
        if successful > 0:
            print(f"\n🎉 {successful} flashcards have been enhanced with AI-generated content!")
            print("💡 Refresh your flashcards view to see the updates.")

def main():
    """Main function to process flashcards."""
    print("🚀 Starting Flashcard AI Processing...")
    print("📱 Make sure your Super-Flashcards server is running on localhost:8000")
    print()
    
    processor = FlashcardProcessor()
    
    # Test server connection first
    try:
        response = requests.get(f"{processor.base_url}/health")
        if response.status_code == 200:
            print("✅ Server connection successful")
        else:
            print("❌ Server not responding correctly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure to run: cd 'G:\\My Drive\\Code\\Python\\Super-Flashcards' && .\\runui.ps1")
        return
    
    # Process the flashcards
    processor.process_all_incomplete_flashcards(max_cards=5)

if __name__ == "__main__":
    main()