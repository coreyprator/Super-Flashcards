#!/usr/bin/env python3
"""
Small Test Batch - Process 5 words to verify system works before full batch
"""

import requests
import time
from datetime import datetime

def test_small_batch():
    """Test with 5 words to verify full AI generation works."""
    
    server_url = "http://localhost:8000"
    
    # 5 test words that likely don't exist yet
    test_words = ["salutation", "réjouissance", "contemplation", "éblouissement", "persévérance"]
    
    print("🧪 SMALL BATCH TEST (5 words)")
    print("="*50)
    print(f"⏰ Start time: {datetime.now().strftime('%H:%M:%S')}")
    print(f"📝 Words to process: {', '.join(test_words)}")
    print(f"⏱️ Expected time: ~{len(test_words) * 2.5:.0f} minutes")
    print()
    
    results = []
    total_start = time.time()
    
    for i, word in enumerate(test_words, 1):
        print(f"\n🔄 Processing {i}/{len(test_words)}: {word}")
        word_start = time.time()
        
        try:
            response = requests.post(
                f"{server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": "9e4d5ca8-ffec-47b9-9943-5f2dd1093593",
                    "include_image": True
                },
                timeout=300  # 5 minute timeout per word
            )
            
            word_time = time.time() - word_start
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ SUCCESS ({word_time:.0f}s)")
                print(f"   📄 Definition: {len(result.get('definition', ''))} chars")
                print(f"   🖼️ Image: {'Yes' if result.get('image_url') else 'No'}")
                results.append({'word': word, 'status': 'success', 'time': word_time})
            else:
                print(f"❌ FAILED ({word_time:.0f}s) - HTTP {response.status_code}")
                results.append({'word': word, 'status': 'failed', 'time': word_time})
        
        except requests.exceptions.Timeout:
            word_time = time.time() - word_start
            print(f"⏰ TIMEOUT ({word_time:.0f}s)")
            results.append({'word': word, 'status': 'timeout', 'time': word_time})
        
        except Exception as e:
            word_time = time.time() - word_start
            print(f"❌ ERROR ({word_time:.0f}s): {str(e)[:100]}")
            results.append({'word': word, 'status': 'error', 'time': word_time})
        
        # Show progress
        completed = i
        remaining = len(test_words) - i
        avg_time = sum([r['time'] for r in results]) / len(results)
        eta_minutes = (remaining * avg_time) / 60
        
        if remaining > 0:
            print(f"⏳ Progress: {completed}/{len(test_words)} | ETA: {eta_minutes:.1f} minutes")
    
    # Final summary
    total_time = time.time() - total_start
    successful = len([r for r in results if r['status'] == 'success'])
    
    print(f"\n🎯 FINAL RESULTS:")
    print(f"⏰ Total time: {total_time/60:.1f} minutes")
    print(f"✅ Successful: {successful}/{len(test_words)}")
    print(f"⏱️ Average per word: {total_time/len(test_words):.0f} seconds")
    
    if successful == len(test_words):
        print(f"\n🚀 SUCCESS! System is ready for full batch processing of 295 words")
        print(f"📊 Estimated time for full batch: {(295 * total_time/len(test_words))/3600:.1f} hours")
    else:
        print(f"\n⚠️ Some failures detected. Check issues before running full batch.")

if __name__ == "__main__":
    test_small_batch()