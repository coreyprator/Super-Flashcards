#!/usr/bin/env python3
"""
Incremental Document Processor for Super-Flashcards
Processes new documents and excludes vocabulary already seen from previous documents and database.
"""

import re
import json
import csv
import requests
from collections import Counter
from pathlib import Path
import unicodedata
from typing import Set, Dict, List, Tuple

class IncrementalProcessor:
    """Process new documents and exclude already-seen vocabulary."""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url
        
        # Common French words to exclude
        self.common_words = {
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 
            'car', 'ni', 'or', 'ce', 'ces', 'cet', 'cette', 'mon', 'ma', 'mes', 'ton', 'ta', 
            'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
            'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 
            'lui', 'moi', 'toi', 'soi', 'que', 'qui', 'dont', 'où', 'quoi', 'quel', 'quelle',
            'quels', 'quelles', 'lequel', 'laquelle', 'lesquels', 'lesquelles',
            'à', 'au', 'aux', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par',
            'contre', 'vers', 'chez', 'depuis', 'pendant', 'avant', 'après', 'devant', 
            'derrière', 'entre', 'parmi', 'selon', 'malgré', 'grâce',
            'est', 'sont', 'était', 'étaient', 'sera', 'seront', 'avoir', 'être', 'faire',
            'aller', 'venir', 'voir', 'savoir', 'pouvoir', 'vouloir', 'devoir', 'falloir',
            'si', 'comme', 'quand', 'lorsque', 'puisque', 'bien', 'ainsi', 'alors', 'aussi',
            'encore', 'déjà', 'toujours', 'jamais', 'plus', 'moins', 'très', 'trop', 'assez',
            'beaucoup', 'peu', 'tant', 'autant', 'tout', 'tous', 'toute', 'toutes', 'même',
            'autre', 'autres', 'tel', 'telle', 'tels', 'telles', 'chaque', 'plusieurs',
            'quelque', 'quelques', 'certain', 'certaine', 'certains', 'certaines',
            'oui', 'non', 'ne', 'pas', 'point', 'rien', 'personne', 'aucun', 'aucune',
            'nul', 'nulle', 'guère', 'plus', 'jamais', 'ici', 'là', 'y', 'en'
        }
        
        self.min_word_length = 3
        
        # Character replacement mapping for encoding issues
        self.char_replacements = {
            'é': ['�', 'e�', 'Ã©'],
            'è': ['�', 'e�', 'Ã¨'],
            'ê': ['�', 'e�', 'Ãª'],
            'ë': ['�', 'e�', 'Ã«'],
            'à': ['�', 'a�', 'Ã '],
            'â': ['�', 'a�', 'Ã¢'],
            'ä': ['�', 'a�', 'Ã¤'],
            'ç': ['�', 'c�', 'Ã§'],
            'ï': ['�', 'i�', 'Ã¯'],
            'î': ['�', 'i�', 'Ã®'],
            'ô': ['�', 'o�', 'Ã´'],
            'ö': ['�', 'o�', 'Ã¶'],
            'ù': ['�', 'u�', 'Ã¹'],
            'û': ['�', 'u�', 'Ã»'],
            'ü': ['�', 'u�', 'Ã¼'],
            'ÿ': ['�', 'y�', 'Ã¿'],
            'œ': ['�', 'oe'],
            'æ': ['�', 'ae'],
            '«': ['�'],
            '»': ['�'],
            ''': ["'", '�'],
            ''': ["'", '�'],
            '"': ['"', '�'],
            '"': ['"', '�'],
            '–': ['�', '-'],
            '—': ['�', '--'],
            '…': ['�', '...']
        }
    
    def fix_encoding_issues(self, text: str) -> str:
        """Fix common character encoding issues in the text."""
        fixed_text = text
        for correct_char, wrong_chars in self.char_replacements.items():
            for wrong_char in wrong_chars:
                fixed_text = fixed_text.replace(wrong_char, correct_char)
        return unicodedata.normalize('NFC', fixed_text)
    
    def extract_words_from_file(self, file_path: str) -> List[str]:
        """Extract French words from a single text file."""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            text = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                    print(f"✅ Read {Path(file_path).name} with {encoding} encoding")
                    break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                raise ValueError(f"Could not read file {file_path} with any supported encoding")
            
            # Fix encoding issues
            text = self.fix_encoding_issues(text)
            text = text.lower()
            
            # Extract words using regex
            words = re.findall(r'\b[a-zàâäéèêëïîôùûüÿçœæ]+(?:-[a-zàâäéèêëïîôùûüÿçœæ]+)*\b', text)
            
            # Filter out common words and short words
            filtered_words = [
                word for word in words 
                if len(word) >= self.min_word_length 
                and word not in self.common_words
                and not word.isdigit()
            ]
            
            return filtered_words
            
        except Exception as e:
            print(f"❌ Error processing file {file_path}: {e}")
            return []
    
    def get_existing_vocabulary(self) -> Set[str]:
        """Get all existing vocabulary from database and previous extractions."""
        existing_words = set()
        
        try:
            # 1. Get existing flashcards from database
            response = requests.get(f"{self.server_url}/api/languages/")
            if response.status_code == 200:
                languages = response.json()
                french_lang = next((lang for lang in languages if lang['code'] == 'fr'), None)
                
                if french_lang:
                    response = requests.get(f"{self.server_url}/api/flashcards/?language_id={french_lang['id']}")
                    if response.status_code == 200:
                        flashcards = response.json()
                        db_words = {card['word_or_phrase'].lower() for card in flashcards}
                        existing_words.update(db_words)
                        print(f"📚 Found {len(db_words)} existing flashcards in database")
            
            # 2. Get words from original processed document (the 211-page document)
            original_csv = r"G:\My Drive\Code\Python\Super-Flashcards\Output\vocabulary_Copy_of_Cours_Corey_ending_1_de_Février_2025.csv"
            if Path(original_csv).exists():
                try:
                    with open(original_csv, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        original_words = {row['french_text'].lower() for row in reader}
                        existing_words.update(original_words)
                        print(f"📄 Found {len(original_words)} words from original document")
                except Exception as e:
                    print(f"⚠️ Could not read original CSV: {e}")
            
            print(f"🔍 Total existing vocabulary to exclude: {len(existing_words)} words")
            return existing_words
            
        except Exception as e:
            print(f"❌ Error fetching existing vocabulary: {e}")
            return set()
    
    def process_new_documents(self, new_files: List[str], output_file: str, min_frequency: int = 2):
        """Process new documents and exclude already-seen vocabulary."""
        
        print("🚀 Starting Incremental Document Processing...")
        print(f"📄 Processing {len(new_files)} new documents")
        print(f"📁 Output file: {output_file}")
        print()
        
        # Get existing vocabulary to exclude
        print("🔍 Loading existing vocabulary for deduplication...")
        existing_vocab = self.get_existing_vocabulary()
        print()
        
        # Process each new document separately
        all_new_words = []
        document_stats = {}
        
        for file_path in new_files:
            print(f"🔄 Processing: {Path(file_path).name}")
            words = self.extract_words_from_file(file_path)
            
            # Count frequencies for this document
            word_counts = Counter(words)
            
            # Filter by minimum frequency
            filtered_words = {
                word: count for word, count in word_counts.items() 
                if count >= min_frequency
            }
            
            # Remove already-seen vocabulary
            new_words_this_doc = {
                word: count for word, count in filtered_words.items()
                if word not in existing_vocab
            }
            
            # Update existing vocabulary to avoid duplicates between new documents
            existing_vocab.update(new_words_this_doc.keys())
            
            # Track stats
            document_stats[Path(file_path).name] = {
                'total_words': len(words),
                'unique_words': len(word_counts),
                'filtered_words': len(filtered_words),
                'new_words': len(new_words_this_doc),
                'top_words': sorted(new_words_this_doc.items(), key=lambda x: x[1], reverse=True)[:5]
            }
            
            # Add to overall collection
            for word, count in new_words_this_doc.items():
                all_new_words.append((word, count, Path(file_path).name))
            
            print(f"  📊 {len(words):,} total words")
            print(f"  📚 {len(word_counts):,} unique words")
            print(f"  ✨ {len(new_words_this_doc):,} new words (after deduplication)")
            print()
        
        # Combine and sort all new words by frequency
        combined_vocab = {}
        source_info = {}
        
        for word, count, source in all_new_words:
            if word in combined_vocab:
                combined_vocab[word] += count
                source_info[word] += f", {source}"
            else:
                combined_vocab[word] = count
                source_info[word] = source
        
        sorted_vocab = sorted(combined_vocab.items(), key=lambda x: x[1], reverse=True)
        
        # Export to CSV
        try:
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['word_or_phrase', 'definition', 'etymology', 'english_cognates', 'related_words', 'language', 'source_documents'])
                
                for word, frequency in sorted_vocab:
                    writer.writerow([
                        word, 
                        '[To be translated]', 
                        f'Found {frequency} times across new documents', 
                        '', 
                        '', 
                        'french',
                        source_info[word]
                    ])
            
            print(f"✅ Exported {len(combined_vocab)} NEW words to {output_file}")
            
            # Generate detailed summary
            self.generate_detailed_summary(document_stats, combined_vocab, sorted_vocab[:10])
            
        except Exception as e:
            print(f"❌ Error exporting to CSV: {e}")
    
    def generate_detailed_summary(self, document_stats: Dict, combined_vocab: Dict, top_words: List):
        """Generate a detailed summary of the processing results."""
        print("\n" + "="*60)
        print("📊 INCREMENTAL PROCESSING SUMMARY")
        print("="*60)
        
        # Per-document breakdown
        print("\n📄 Per-Document Analysis:")
        for doc_name, stats in document_stats.items():
            print(f"\n📋 {doc_name}:")
            print(f"  • Total words: {stats['total_words']:,}")
            print(f"  • Unique words: {stats['unique_words']:,}")
            print(f"  • After frequency filter: {stats['filtered_words']:,}")
            print(f"  • NEW words (unique): {stats['new_words']:,}")
            
            if stats['top_words']:
                print(f"  • Top new words: {', '.join([f'{w}({c})' for w, c in stats['top_words']])}")
        
        # Overall summary
        total_new_words = len(combined_vocab)
        total_occurrences = sum(combined_vocab.values())
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  • Total NEW unique words: {total_new_words:,}")
        print(f"  • Total occurrences: {total_occurrences:,}")
        print(f"  • Average frequency: {total_occurrences/total_new_words:.1f}")
        
        print(f"\n🏆 Top 10 Most Frequent NEW Words:")
        for i, (word, freq) in enumerate(top_words, 1):
            print(f"  {i:2d}. {word:<20} ({freq:,} times)")
        
        print(f"\n💡 Next Steps:")
        print(f"  1. Review the NEW vocabulary in the output file")
        print(f"  2. Mark words you want to study with 'X' in column A")
        print(f"  3. Use batch processing to create flashcards")
        print("="*60)

def main():
    """Main function to process the 2 new documents."""
    
    # The 2 new documents you mentioned
    new_documents = [
        r"G:\My Drive\Code\Python\Super-Flashcards\Input\Cours Corey (1).txt",
        r"G:\My Drive\Code\Python\Super-Flashcards\Input\Copy of Cours Corey 22-07-2025.txt"
    ]
    
    output_file = r"G:\My Drive\Code\Python\Super-Flashcards\Output\new_documents_vocabulary.csv"
    
    # Verify files exist
    missing_files = [f for f in new_documents if not Path(f).exists()]
    if missing_files:
        print("❌ Missing files:")
        for f in missing_files:
            print(f"  - {f}")
        return
    
    processor = IncrementalProcessor()
    processor.process_new_documents(
        new_files=new_documents,
        output_file=output_file,
        min_frequency=2
    )

if __name__ == "__main__":
    main()