#!/usr/bin/env python3
"""
Multi-Document Vocabulary Processor for Super-Flashcards
Extracts vocabulary from multiple documents and deduplicates against existing flashcards.
"""

import re
import json
import csv
import requests
from collections import Counter
from pathlib import Path
import unicodedata
from typing import Set, Dict, List, Tuple
import glob

class MultiDocumentProcessor:
    """Process multiple documents and deduplicate vocabulary."""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url
        
        # Common French words to exclude (same as before)
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
    
    def get_existing_flashcards(self) -> Set[str]:
        """Get all existing French flashcard words from the database."""
        try:
            # Get French language ID
            response = requests.get(f"{self.server_url}/api/languages/")
            if response.status_code != 200:
                print(f"❌ Could not fetch languages: {response.status_code}")
                return set()
            
            languages = response.json()
            french_lang = next((lang for lang in languages if lang['code'] == 'fr'), None)
            
            if not french_lang:
                print("❌ French language not found in database")
                return set()
            
            # Get existing flashcards
            response = requests.get(f"{self.server_url}/api/flashcards/?language_id={french_lang['id']}")
            if response.status_code != 200:
                print(f"❌ Could not fetch flashcards: {response.status_code}")
                return set()
            
            flashcards = response.json()
            existing_words = {card['word_or_phrase'].lower() for card in flashcards}
            
            print(f"📚 Found {len(existing_words)} existing flashcards in database")
            return existing_words
            
        except Exception as e:
            print(f"❌ Error fetching existing flashcards: {e}")
            return set()
    
    def process_multiple_documents(self, input_dir: str, output_file: str, min_frequency: int = 2):
        """Process multiple text files and create deduplicated vocabulary."""
        
        print("🚀 Starting Multi-Document Vocabulary Processing...")
        print(f"📁 Input directory: {input_dir}")
        print(f"📄 Output file: {output_file}")
        print()
        
        # Find all text files
        text_files = glob.glob(f"{input_dir}/*.txt")
        if not text_files:
            print(f"❌ No .txt files found in {input_dir}")
            return
        
        print(f"📝 Found {len(text_files)} text files:")
        for file_path in text_files:
            print(f"  - {Path(file_path).name}")
        print()
        
        # Extract words from all files
        all_words = []
        for file_path in text_files:
            print(f"🔄 Processing: {Path(file_path).name}")
            words = self.extract_words_from_file(file_path)
            all_words.extend(words)
        
        print(f"\n📊 Extracted {len(all_words)} total words from all files")
        
        # Count word frequencies
        word_counts = Counter(all_words)
        
        # Filter by minimum frequency
        filtered_vocab = {
            word: count for word, count in word_counts.items() 
            if count >= min_frequency
        }
        
        print(f"📊 {len(filtered_vocab)} unique words after frequency filtering (min: {min_frequency})")
        
        # Get existing flashcards for deduplication
        print("\n🔍 Checking existing flashcards for deduplication...")
        existing_words = self.get_existing_flashcards()
        
        # Remove words that already exist
        new_vocabulary = {
            word: count for word, count in filtered_vocab.items()
            if word not in existing_words
        }
        
        duplicate_count = len(filtered_vocab) - len(new_vocabulary)
        print(f"🔄 Removed {duplicate_count} duplicate words already in database")
        print(f"✨ {len(new_vocabulary)} new words ready for processing")
        
        # Sort by frequency (descending)
        sorted_vocab = sorted(new_vocabulary.items(), key=lambda x: x[1], reverse=True)
        
        # Export to CSV
        try:
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['word_or_phrase', 'definition', 'etymology', 'english_cognates', 'related_words', 'language'])
                
                for word, frequency in sorted_vocab:
                    writer.writerow([word, '[To be translated]', f'Found {frequency} times across documents', '', '', 'french'])
            
            print(f"\n✅ Exported {len(new_vocabulary)} new words to {output_file}")
            
            # Generate summary
            summary = self.generate_summary(new_vocabulary, sorted_vocab[:10])
            print(summary)
            
        except Exception as e:
            print(f"❌ Error exporting to CSV: {e}")
    
    def generate_summary(self, vocabulary: Dict[str, int], top_words: List[Tuple[str, int]]) -> str:
        """Generate a summary of the processed vocabulary."""
        if not vocabulary:
            return "No new vocabulary found."
        
        total_words = len(vocabulary)
        total_occurrences = sum(vocabulary.values())
        
        summary = f"""
📊 Multi-Document Processing Summary
═══════════════════════════════════════
📚 New unique words: {total_words:,}
🔢 Total word occurrences: {total_occurrences:,}
📈 Average frequency: {total_occurrences/total_words:.1f}

🏆 Top 10 Most Frequent New Words:
"""
        for i, (word, freq) in enumerate(top_words, 1):
            summary += f"{i:2d}. {word:<20} ({freq:,} times)\n"
        
        return summary

def main():
    """Main function to process multiple documents."""
    
    input_directory = r"G:\My Drive\Code\Python\Super-Flashcards\Input"
    output_file = r"G:\My Drive\Code\Python\Super-Flashcards\Output\multi_document_vocabulary.csv"
    
    processor = MultiDocumentProcessor()
    processor.process_multiple_documents(
        input_dir=input_directory,
        output_file=output_file,
        min_frequency=2
    )
    
    print(f"\n💡 Next steps:")
    print(f"1. Review the vocabulary in: {output_file}")
    print(f"2. Mark words you want to study with 'X' in column A")
    print(f"3. Use the batch processing script to create flashcards")

if __name__ == "__main__":
    main()