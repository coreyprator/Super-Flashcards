#!/usr/bin/env python3
"""
Test the robust processor with just 3 words to verify it works
"""

import csv
import json
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Set
import sys
import os

class RobustBatchProcessor:
    """Robust batch processor with crash recovery and accurate progress tracking."""
    
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
        
        # Resume functionality
        self.progress_file = "Output/test_batch_progress.json"
        self.results_file = "Output/test_batch_results.json"
        
        # Sample words to exclude
        self.sample_words = {
            'ailleurs', 'davantage', 'démonstratifs', 'éloges', 'parfois'
        }
    
    def load_progress(self) -> Dict:
        """Load previous progress if exists."""
        try:
            if os.path.exists(self.progress_file):
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"⚠️ Could not load progress: {e}")
        return {}
    
    def save_progress(self, processed_words: List[str], results: List[Dict]):
        """Save current progress."""
        try:
            progress = {
                'timestamp': datetime.now().isoformat(),
                'processed_words': processed_words,
                'total_processed': len(processed_words),
                'successful': len([r for r in results if r['status'] == 'success']),
                'failed': len([r for r in results if r['status'] != 'success'])
            }
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, indent=2)
            
            # Also save full results
            with open(self.results_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"⚠️ Could not save progress: {e}")
    
    def check_server_health(self) -> bool:
        """Check if server is responding."""
        try:
            response = requests.get(f"{self.server_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_existing_flashcards(self) -> Set[str]:
        """Get existing flashcard words."""
        try:
            response = requests.get(f"{self.server_url}/api/flashcards/?language_id={self.french_lang_id}")
            if response.status_code == 200:
                flashcards = response.json()
                return {card['word_or_phrase'].lower() for card in flashcards}
        except Exception as e:
            print(f"❌ Error fetching existing flashcards: {e}")
        return set()
    
    def generate_flashcard(self, word: str) -> Dict:
        """Generate a single flashcard with comprehensive error handling."""
        word_start_time = time.time()
        
        try:
            print(f"🔄 Processing '{word}'...")
            
            # Check server health first
            if not self.check_server_health():
                return {
                    'word': word,
                    'status': 'server_down',
                    'processing_time': time.time() - word_start_time,
                    'error': 'Server is not responding'
                }
            
            # Make the AI generation request
            response = requests.post(
                f"{self.server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": self.french_lang_id,
                    "include_image": True
                },
                timeout=300  # 5 minute timeout
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
                    'flashcard_id': result.get('id'),
                    'definition': result.get('definition', ''),
                    'etymology': result.get('etymology', ''),
                    'image_url': result.get('image_url', '')
                }
            else:
                self.failed_words += 1
                error_text = response.text[:200] if response.text else 'Unknown error'
                return {
                    'word': word,
                    'status': 'failed',
                    'processing_time': processing_time,
                    'error': f"HTTP {response.status_code}: {error_text}"
                }
                
        except requests.exceptions.Timeout:
            processing_time = time.time() - word_start_time
            self.processing_times.append(processing_time)
            self.failed_words += 1
            return {
                'word': word,
                'status': 'timeout',
                'processing_time': processing_time,
                'error': 'Request timed out after 5 minutes'
            }
        except requests.exceptions.ConnectionError:
            processing_time = time.time() - word_start_time
            self.failed_words += 1
            return {
                'word': word,
                'status': 'connection_error',
                'processing_time': processing_time,
                'error': 'Connection lost to server'
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
    
    def calculate_eta(self) -> str:
        """Calculate ETA based on recent processing times."""
        if len(self.processing_times) < 2:
            return "Calculating ETA..."
        
        recent_times = self.processing_times[-5:]
        avg_time = sum(recent_times) / len(recent_times)
        remaining_words = self.total_words - self.processed_words
        estimated_seconds = remaining_words * avg_time
        
        if estimated_seconds < 60:
            return f"ETA: {estimated_seconds:.0f}s"
        elif estimated_seconds < 3600:
            minutes = estimated_seconds / 60
            return f"ETA: {minutes:.1f}m"
        else:
            hours = estimated_seconds / 3600
            return f"ETA: {hours:.1f}h"
    
    def display_progress(self, current: int, total: int):
        """Display progress with ETA."""
        if total == 0:
            return
            
        percent = (current / total) * 100
        filled = int(50 * current // total)
        bar = '█' * filled + '░' * (50 - filled)
        eta_str = self.calculate_eta()
        
        print(f'\r🚀 Progress: |{bar}| {current}/{total} ({percent:.1f}%) {eta_str}', end='', flush=True)
    
    def test_3_words(self):
        """Test with just 3 words to verify the system works."""
        
        print("🧪 Testing Robust Batch Processing with 3 words...")
        print("="*60)
        
        # Test with 3 specific words
        test_words = ['aborder', 'aboutir', 'accorder']
        
        # Get existing flashcards
        existing_flashcards = self.get_existing_flashcards()
        print(f"📚 Found {len(existing_flashcards)} existing flashcards")
        
        # Filter words to process
        words_to_process = []
        for word in test_words:
            if word not in existing_flashcards:
                words_to_process.append(word)
        
        self.total_words = len(words_to_process)
        
        print(f"🎯 Test words to process: {self.total_words}")
        print(f"📋 Words: {', '.join(words_to_process)}")
        print()
        
        if self.total_words == 0:
            print("✅ All test words have already been processed!")
            return
        
        # Start processing
        self.start_time = time.time()
        results = []
        processed_in_session = []
        
        for i, word in enumerate(words_to_process):
            self.processed_words = i + 1
            
            # Process the word
            result = self.generate_flashcard(word)
            results.append(result)
            processed_in_session.append(word)
            
            # Show result
            if result['status'] == 'success':
                print(f"✅ {word}: Success ({result['processing_time']:.0f}s)")
            else:
                print(f"❌ {word}: {result['status']} ({result['processing_time']:.0f}s)")
            
            # Display progress
            self.display_progress(self.processed_words, self.total_words)
            print()  # New line after progress bar
        
        # Save final results
        self.save_progress(processed_in_session, results)
        
        # Summary
        total_time = time.time() - self.start_time
        print(f"\n🎯 TEST RESULTS:")
        print(f"⏰ Total time: {total_time/60:.1f} minutes")
        print(f"✅ Successful: {self.successful_words}")
        print(f"❌ Failed: {self.failed_words}")
        print(f"📄 Results saved to: {self.results_file}")

def main():
    processor = RobustBatchProcessor()
    processor.test_3_words()

if __name__ == "__main__":
    main()