#!/usr/bin/env python3
"""
Test Fixed Batch Processor - Test 3 words to verify the fix works
"""

import csv
import json
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Set
import sys

class TestFixedProcessor:
    """Test the fixed batch processor with 3 words."""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url
        self.french_lang_id = "9e4d5ca8-ffec-47b9-9943-5f2dd1093593"
        
        # Progress tracking
        self.total_words = 0
        self.processed_words = 0
        self.successful_words = 0
        self.failed_words = 0
        self.start_time = None
        self.processing_times = []
    
    def generate_flashcard(self, word: str) -> Dict:
        """Generate a single flashcard through AI generation."""
        word_start_time = time.time()
        
        try:
            # Call the AI generation endpoint directly
            response = requests.post(
                f"{self.server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": self.french_lang_id,
                    "include_image": True
                },
                timeout=180  # 3 minute timeout per word
            )
            
            processing_time = time.time() - word_start_time
            self.processing_times.append(processing_time)
            
            if response.status_code == 200:
                result = response.json()
                self.successful_words += 1
                return {
                    'word': word,
                    'status': 'success',
                    'processing_time': processing_time,
                    'result': result,
                    'flashcard_id': result.get('id'),
                    'definition': result.get('definition', ''),
                    'etymology': result.get('etymology', ''),
                    'image_url': result.get('image_url', '')
                }
            else:
                self.failed_words += 1
                return {
                    'word': word,
                    'status': 'failed',
                    'processing_time': processing_time,
                    'error': f"HTTP {response.status_code}: {response.text[:200]}"
                }
                
        except requests.exceptions.Timeout:
            processing_time = time.time() - word_start_time
            self.processing_times.append(processing_time)
            self.failed_words += 1
            return {
                'word': word,
                'status': 'timeout',
                'processing_time': processing_time,
                'error': 'Request timed out after 3 minutes'
            }
        except Exception as e:
            processing_time = time.time() - word_start_time
            self.processing_times.append(processing_time)
            self.failed_words += 1
            return {
                'word': word,
                'status': 'error',
                'processing_time': processing_time,
                'error': str(e)
            }
    
    def test_fixed_processing(self, test_words: List[str]):
        """Test the fixed processing with a few words."""
        
        print("🔧 Testing Fixed Batch Processor")
        print("="*50)
        print(f"📝 Test words: {', '.join(test_words)}")
        print(f"⏰ Start time: {datetime.now().strftime('%H:%M:%S')}")
        print()
        
        self.total_words = len(test_words)
        self.start_time = time.time()
        
        results = []
        
        for i, word in enumerate(test_words, 1):
            print(f"🔄 Processing {i}/{len(test_words)}: {word}")
            
            result = self.generate_flashcard(word)
            results.append(result)
            
            if result['status'] == 'success':
                print(f"✅ SUCCESS ({result['processing_time']:.0f}s)")
                print(f"   📄 Definition: {len(result['definition'])} chars")
                print(f"   🖼️ Image: {'Yes' if result['image_url'] else 'No'}")
                print(f"   🆔 ID: {result['flashcard_id']}")
            else:
                print(f"❌ FAILED ({result['processing_time']:.0f}s)")
                print(f"   ⚠️ Error: {result['error'][:100]}")
            print()
        
        # Summary
        total_time = time.time() - self.start_time
        print("🎯 TEST RESULTS:")
        print(f"⏰ Total time: {total_time/60:.1f} minutes")
        print(f"✅ Successful: {self.successful_words}/{self.total_words}")
        print(f"❌ Failed: {self.failed_words}/{self.total_words}")
        print(f"⏱️ Average per word: {total_time/self.total_words:.0f} seconds")
        
        if self.successful_words == self.total_words:
            print("\n🚀 ALL TESTS PASSED! Ready for full batch processing.")
        else:
            print(f"\n⚠️ {self.failed_words} failures detected. Need to investigate.")

def main():
    # Test with 3 words from the failed batch
    test_words = ["accueil", "astuce", "contemplation"]
    
    processor = TestFixedProcessor()
    processor.test_fixed_processing(test_words)

if __name__ == "__main__":
    main()