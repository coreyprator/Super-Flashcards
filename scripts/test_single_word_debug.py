#!/usr/bin/env python3
"""
Test single word AI generation to debug the issue
"""

import requests
import time
import json

def test_single_word():
    """Test processing a single word."""
    
    server_url = "http://localhost:8000"
    french_lang_id = "9e4d5ca8-ffec-47b9-9943-5f2dd1093593"
    test_word = "aborder"  # A word from our list
    
    print(f"Testing AI generation for word: '{test_word}'")
    print("="*50)
    
    start_time = time.time()
    
    try:
        # Make the AI generation request
        response = requests.post(
            f"{server_url}/api/ai/generate",
            json={
                "word_or_phrase": test_word,
                "language_id": french_lang_id,
                "include_image": True
            },
            timeout=300  # 5 minute timeout
        )
        
        processing_time = time.time() - start_time
        
        print(f"Response status: {response.status_code}")
        print(f"Processing time: {processing_time:.1f} seconds")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"Flashcard ID: {result.get('id')}")
            print(f"Definition: {result.get('definition', '')[:100]}...")
            print(f"Etymology: {result.get('etymology', '')[:100]}...")
            print(f"Image URL: {result.get('image_url', '')}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"Response text: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 5 minutes")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_single_word()