#!/usr/bin/env python3
"""
Debug AI Generation - Test one word with detailed timing and logging
"""

import requests
import time
from datetime import datetime

def debug_single_word():
    """Debug AI generation with detailed timing for one word."""
    
    server_url = "http://localhost:8000"
    test_word = "bonjour"  # Simple word for testing
    
    print("🔍 DEBUGGING AI GENERATION")
    print("="*50)
    print(f"⏰ Start time: {datetime.now().strftime('%H:%M:%S')}")
    print(f"🔤 Testing word: {test_word}")
    print(f"🌐 Server: {server_url}")
    print()
    
    # First check if word already exists
    print("1️⃣ Checking if flashcard already exists...")
    response = requests.get(f"{server_url}/api/flashcards/?language_id=9e4d5ca8-ffec-47b9-9943-5f2dd1093593")
    if response.status_code == 200:
        existing_words = [card['word_or_phrase'].lower() for card in response.json()]
        if test_word.lower() in existing_words:
            print(f"⚠️ Word '{test_word}' already exists in database - this might cause fast response!")
        else:
            print(f"✅ Word '{test_word}' is new - should trigger full AI generation")
    
    print("\n2️⃣ Making AI generation request...")
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{server_url}/api/ai/generate",
            json={
                "word_or_phrase": test_word,
                "language_id": "9e4d5ca8-ffec-47b9-9943-5f2dd1093593",
                "include_image": True
            },
            timeout=300  # 5 minute timeout
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"⏱️ Total processing time: {processing_time:.2f} seconds")
        print(f"📊 HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"📝 Definition length: {len(result.get('definition', ''))}")
            print(f"📚 Etymology length: {len(result.get('etymology', ''))}")
            print(f"🖼️ Image URL: {result.get('image_url', 'None')}")
            print(f"🆔 Flashcard ID: {result.get('id', 'None')}")
            
            # Show partial content
            definition = result.get('definition', '')
            if definition:
                print(f"📄 Definition preview: {definition[:150]}...")
        else:
            print(f"❌ FAILED")
            print(f"📄 Response: {response.text[:500]}")
    
    except requests.exceptions.Timeout:
        processing_time = time.time() - start_time
        print(f"⏱️ Request timed out after {processing_time:.2f} seconds")
        print("🔥 This indicates OpenAI is being called (good!)")
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"❌ Error after {processing_time:.2f} seconds: {str(e)}")
    
    print(f"\n⏰ End time: {datetime.now().strftime('%H:%M:%S')}")
    
    # Analysis
    print("\n🧐 ANALYSIS:")
    if processing_time < 5:
        print("🚨 TOO FAST! Likely not calling OpenAI API")
        print("   - May be using cached/mock data")
        print("   - Check server logs for OpenAI API calls")
    elif processing_time < 30:
        print("⚡ FAST - Possible text-only generation")
        print("   - May be skipping image generation")
    else:
        print("✅ PROPER TIMING - Likely calling OpenAI API with image generation")
    
if __name__ == "__main__":
    debug_single_word()