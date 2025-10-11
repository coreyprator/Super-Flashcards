#!/usr/bin/env python3
"""
Test AI Integration - Process 3 words to verify AI generation is working
"""

import requests
import time
from datetime import datetime

def test_ai_generation():
    """Test AI generation with 3 words to ensure it's working properly."""
    
    server_url = "http://localhost:8000"
    test_words = ["orgueil", "reflexive", "proposer"]
    
    print("🧪 Testing AI Generation Integration")
    print("="*50)
    
    for i, word in enumerate(test_words, 1):
        print(f"\n🔄 Testing word {i}/{len(test_words)}: {word}")
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": "9e4d5ca8-ffec-47b9-9943-5f2dd1093593",  # French language ID
                    "include_image": True
                },
                timeout=60
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ SUCCESS ({processing_time:.1f}s)")
                print(f"  📝 Definition: {result.get('generated_content', {}).get('definition', 'N/A')[:100]}...")
                print(f"  📚 Etymology: {result.get('generated_content', {}).get('etymology', 'N/A')[:100]}...")
                print(f"  🖼️ Image: {'Yes' if result.get('image_url') else 'No'}")
                print(f"  🆔 Flashcard ID: {result.get('flashcard_id', 'N/A')}")
            else:
                print(f"❌ FAILED ({processing_time:.1f}s)")
                print(f"  HTTP {response.status_code}: {response.text[:200]}")
        
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"❌ ERROR ({processing_time:.1f}s)")
            print(f"  {str(e)}")
        
        # Brief pause between requests
        if i < len(test_words):
            time.sleep(2)
    
    print(f"\n✅ AI Generation Test Complete!")
    print("If all 3 words processed successfully, the comprehensive batch processor should work.")

if __name__ == "__main__":
    test_ai_generation()