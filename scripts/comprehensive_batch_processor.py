#!/usr/bin/env python3
"""
Comprehensive Batch Processor for Super-Flashcards
Merges selected words from multiple documents, excludes already processed s                    # Call the AI generation endpoint directly
            response = requests.post(
                f"{self.server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": "9e4d5ca8-ffec-47b9-9943-5f2dd1093593",  # French language ID
                    "include_image": True
                },
                timeout=180  # 3 minute timeout per word (AI + image generation takes time)
            )l the AI generation endpoint directly
            response = requests.post(
                f"{self.server_url}/api/ai/generate",
                json={
                    "word_or_phrase": word,
                    "language_id": "9e4d5ca8-ffec-47b9-9943-5f2dd1093593",  # French language ID
                    "include_image": True
                },
                timeout=180  # 3 minute timeout per word (AI + image generation takes time)
            )and processes them through AI generation with progress tracking and ETA.
"""

import csv
import json
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Set
import sys

class ComprehensiveBatchProcessor:
    """Process all selected vocabulary with progress tracking and ETA."""
    
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
        
        # Already processed sample words (to exclude)
        self.sample_words = {
            'ailleurs', 'davantage', 'démonstratifs', 'éloges', 'parfois'
        }
    
    def load_selected_words_from_csv(self, csv_file: str, word_column: str = 'word_or_phrase') -> List[str]:
        """Load selected words from CSV file (marked with X or x)."""
        selected_words = []
        
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Check if first column (marker) starts with X or x
                        marker = list(row.values())[0].strip().lower()
                        if marker in ['x']:
                            word = row[word_column].strip()
                            if word and word != word_column:  # Avoid header
                                selected_words.append(word)
                
                print(f"✅ Loaded {len(selected_words)} selected words from {Path(csv_file).name} using {encoding}")
                return selected_words
                
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"❌ Error loading words from {csv_file} with {encoding}: {e}")
                continue
        
        print(f"❌ Could not read {csv_file} with any supported encoding")
        return []
    
    def get_existing_flashcards(self) -> Set[str]:
        """Get all existing flashcard words to avoid duplicates."""
        existing_words = set()
        
        try:
            response = requests.get(f"{self.server_url}/api/flashcards/?language_id={self.french_lang_id}")
            if response.status_code == 200:
                flashcards = response.json()
                existing_words = {card['word_or_phrase'].lower() for card in flashcards}
                print(f"📚 Found {len(existing_words)} existing flashcards in database")
            else:
                print(f"⚠️ Could not fetch existing flashcards: {response.status_code}")
        except Exception as e:
            print(f"❌ Error fetching existing flashcards: {e}")
        
        return existing_words
    
    def merge_and_deduplicate_words(self, word_lists: List[List[str]]) -> List[str]:
        """Merge multiple word lists and remove duplicates."""
        all_words = set()
        
        for words in word_lists:
            all_words.update(word.lower() for word in words)
        
        # Remove sample words and existing flashcards
        existing_words = self.get_existing_flashcards()
        
        # Filter out samples and existing words
        filtered_words = []
        duplicates_removed = 0
        samples_removed = 0
        existing_removed = 0
        
        for word in all_words:
            if word in self.sample_words:
                samples_removed += 1
            elif word in existing_words:
                existing_removed += 1
            else:
                filtered_words.append(word)
        
        print(f"🔍 Deduplication Summary:")
        print(f"  • Total unique words collected: {len(all_words)}")
        print(f"  • Sample words removed: {samples_removed}")
        print(f"  • Existing flashcards removed: {existing_removed}")
        print(f"  • Final words to process: {len(filtered_words)}")
        
        return sorted(filtered_words)
    
    def display_progress_bar(self, current: int, total: int, eta_str: str = "", width: int = 50):
        """Display a progress bar with ETA."""
        if total == 0:
            return
            
        percent = (current / total) * 100
        filled = int(width * current // total)
        bar = '█' * filled + '░' * (width - filled)
        
        # Clear line and print progress
        print(f'\r🚀 Progress: |{bar}| {current}/{total} ({percent:.1f}%) {eta_str}', end='', flush=True)
    
    def calculate_eta(self) -> str:
        """Calculate ETA based on recent processing times."""
        if len(self.processing_times) < 2:
            return "Calculating ETA..."
        
        # Use last 5 processing times for more accurate ETA
        recent_times = self.processing_times[-5:]
        avg_time = sum(recent_times) / len(recent_times)
        
        remaining_words = self.total_words - self.processed_words
        estimated_seconds = remaining_words * avg_time
        
        eta_time = datetime.now() + timedelta(seconds=estimated_seconds)
        
        if estimated_seconds < 60:
            return f"ETA: {estimated_seconds:.0f}s"
        elif estimated_seconds < 3600:
            minutes = estimated_seconds / 60
            return f"ETA: {minutes:.1f}m ({eta_time.strftime('%H:%M')})"
        else:
            hours = estimated_seconds / 3600
            return f"ETA: {hours:.1f}h ({eta_time.strftime('%H:%M')})"
    
    def generate_flashcard(self, word: str) -> Dict:
        """Generate a single flashcard through AI generation."""
        word_start_time = time.time()
        
        try:
            # Call the AI generation endpoint directly
            response = requests.post(
                f"{self.server_url}/api/ai-generate/flashcard",
                json={
                    "word_or_phrase": word,
                    "language_code": "fr"
                },
                timeout=120  # 2 minute timeout per word
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
                'error': 'Request timed out after 2 minutes'
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
    
    def save_results_log(self, results: List[Dict], output_file: str):
        """Save detailed processing results to a log file."""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'timestamp': datetime.now().isoformat(),
                    'total_words': self.total_words,
                    'successful_words': self.successful_words,
                    'failed_words': self.failed_words,
                    'processing_times': {
                        'total_time_seconds': time.time() - self.start_time,
                        'average_per_word': sum(self.processing_times) / len(self.processing_times) if self.processing_times else 0,
                        'fastest_word': min(self.processing_times) if self.processing_times else 0,
                        'slowest_word': max(self.processing_times) if self.processing_times else 0
                    },
                    'results': results
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n📋 Detailed results saved to {output_file}")
        except Exception as e:
            print(f"\n❌ Error saving results log: {e}")
    
    def process_comprehensive_batch(self, csv_files: List[str], output_log: str):
        """Process all selected words from multiple CSV files."""
        
        print("🚀 Starting Comprehensive Batch Processing...")
        print(f"📄 Processing selected words from {len(csv_files)} files")
        print()
        
        # Load selected words from all CSV files
        all_word_lists = []
        for csv_file in csv_files:
            if 'new_documents' in csv_file:
                words = self.load_selected_words_from_csv(csv_file, 'word_or_phrase')
            else:
                words = self.load_selected_words_from_csv(csv_file, 'french_text')
            all_word_lists.append(words)
        
        # Merge and deduplicate
        words_to_process = self.merge_and_deduplicate_words(all_word_lists)
        
        if not words_to_process:
            print("❌ No words to process after deduplication!")
            return
        
        # Initialize tracking
        self.total_words = len(words_to_process)
        self.start_time = time.time()
        
        print(f"\n🎯 Processing {self.total_words} words through AI generation...")
        print(f"📊 Estimated time based on previous samples: ~{self.total_words * 15:.0f} seconds")
        print("="*70)
        
        # Process each word
        results = []
        
        for i, word in enumerate(words_to_process, 1):
            self.processed_words = i
            
            # Update progress bar with ETA
            eta_str = self.calculate_eta()
            self.display_progress_bar(i-1, self.total_words, eta_str)
            
            # Process the word
            result = self.generate_flashcard(word)
            results.append(result)
            
            # Update progress bar after processing
            self.display_progress_bar(i, self.total_words, eta_str)
            
            # Brief pause to avoid overwhelming the server
            time.sleep(0.5)
        
        # Final results
        print(f"\n\n✅ Comprehensive Batch Processing Complete!")
        print("="*70)
        
        total_time = time.time() - self.start_time
        avg_time = total_time / self.total_words if self.total_words > 0 else 0
        
        print(f"📊 FINAL RESULTS:")
        print(f"  • Total words processed: {self.total_words}")
        print(f"  • Successful: {self.successful_words} ({self.successful_words/self.total_words*100:.1f}%)")
        print(f"  • Failed: {self.failed_words} ({self.failed_words/self.total_words*100:.1f}%)")
        print(f"  • Total time: {total_time/60:.1f} minutes")
        print(f"  • Average per word: {avg_time:.1f} seconds")
        print(f"  • Processing rate: {3600/avg_time:.0f} words/hour")
        
        # Save detailed log
        self.save_results_log(results, output_log)
        
        # Show failed words if any
        failed_results = [r for r in results if r['status'] != 'success']
        if failed_results:
            print(f"\n⚠️ Failed Words ({len(failed_results)}):")
            for result in failed_results[:10]:  # Show first 10
                print(f"  • {result['word']}: {result['error'][:50]}...")
            if len(failed_results) > 10:
                print(f"  ... and {len(failed_results) - 10} more (see log file)")

def main():
    """Main function to process all selected vocabulary."""
    
    # Input files with selected words
    csv_files = [
        # Original document selections (211 words)
        r"G:\My Drive\Code\Python\Super-Flashcards\Output\vocabulary_Copy_of_Cours_Corey_ending_1_de_Février_2025 Selected.csv",
        # New documents selections (89 words)
        r"G:\My Drive\Code\Python\Super-Flashcards\Output\new_documents_vocabulary selected.csv"
    ]
    
    output_log = r"G:\My Drive\Code\Python\Super-Flashcards\Output\comprehensive_batch_processing_log.json"
    
    # Verify files exist
    missing_files = [f for f in csv_files if not Path(f).exists()]
    if missing_files:
        print("❌ Missing files:")
        for f in missing_files:
            print(f"  - {f}")
        return
    
    processor = ComprehensiveBatchProcessor()
    processor.process_comprehensive_batch(csv_files, output_log)

if __name__ == "__main__":
    main()