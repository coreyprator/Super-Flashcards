#!/usr/bin/env python3
"""
French Vocabulary Extractor for Super-Flashcards
Extracts French vocabulary from text files exported from Google Docs.
Handles character encoding issues and filters common words.
"""

import re
import json
import csv
from collections import Counter
from pathlib import Path
import unicodedata
from typing import Set, Dict, List, Tuple

class FrenchVocabularyExtractor:
    """Extract and process French vocabulary from text files."""
    
    def __init__(self):
        # Common French words to exclude (articles, prepositions, conjunctions, etc.)
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
        
        # Words too short to be meaningful
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
        
        # Apply character replacements
        for correct_char, wrong_chars in self.char_replacements.items():
            for wrong_char in wrong_chars:
                fixed_text = fixed_text.replace(wrong_char, correct_char)
        
        # Normalize unicode characters
        fixed_text = unicodedata.normalize('NFC', fixed_text)
        
        return fixed_text
    
    def extract_words(self, text: str) -> List[str]:
        """Extract individual French words from text."""
        # Fix encoding issues first
        text = self.fix_encoding_issues(text)
        
        # Convert to lowercase
        text = text.lower()
        
        # Extract words using regex (French letters + hyphens for compound words)
        words = re.findall(r'\b[a-zàâäéèêëïîôùûüÿçœæ]+(?:-[a-zàâäéèêëïîôùûüÿçœæ]+)*\b', text)
        
        # Filter out common words and short words
        filtered_words = [
            word for word in words 
            if len(word) >= self.min_word_length 
            and word not in self.common_words
            and not word.isdigit()
        ]
        
        return filtered_words
    
    def process_file(self, file_path: str, min_frequency: int = 2) -> Dict[str, int]:
        """Process a text file and extract vocabulary with frequency counts."""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            text = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                    print(f"✅ Successfully read file with {encoding} encoding")
                    break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                raise ValueError("Could not read file with any supported encoding")
            
            # Extract words
            words = self.extract_words(text)
            
            # Count word frequencies
            word_counts = Counter(words)
            
            # Filter by minimum frequency
            filtered_vocab = {
                word: count for word, count in word_counts.items() 
                if count >= min_frequency
            }
            
            return filtered_vocab
            
        except Exception as e:
            print(f"❌ Error processing file: {e}")
            return {}
    
    def export_to_csv(self, vocabulary: Dict[str, int], output_path: str):
        """Export vocabulary to CSV format for flashcard import."""
        try:
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Header for Super-Flashcards import
                writer.writerow(['french_text', 'frequency', 'english_translation', 'context'])
                
                # Sort by frequency (descending)
                sorted_vocab = sorted(vocabulary.items(), key=lambda x: x[1], reverse=True)
                
                for word, frequency in sorted_vocab:
                    # Leave translation and context empty for batch processing
                    writer.writerow([word, frequency, '', ''])
            
            print(f"✅ Exported {len(vocabulary)} words to {output_path}")
            
        except Exception as e:
            print(f"❌ Error exporting to CSV: {e}")
    
    def export_to_json(self, vocabulary: Dict[str, int], output_path: str):
        """Export vocabulary to JSON format."""
        try:
            # Prepare data for JSON export
            vocab_list = [
                {
                    'french_text': word,
                    'frequency': frequency,
                    'english_translation': '',
                    'context': ''
                }
                for word, frequency in sorted(vocabulary.items(), key=lambda x: x[1], reverse=True)
            ]
            
            with open(output_path, 'w', encoding='utf-8') as jsonfile:
                json.dump(vocab_list, jsonfile, ensure_ascii=False, indent=2)
            
            print(f"✅ Exported {len(vocabulary)} words to {output_path}")
            
        except Exception as e:
            print(f"❌ Error exporting to JSON: {e}")
    
    def generate_summary(self, vocabulary: Dict[str, int]) -> str:
        """Generate a summary of the extracted vocabulary."""
        if not vocabulary:
            return "No vocabulary extracted."
        
        total_words = len(vocabulary)
        total_occurrences = sum(vocabulary.values())
        most_common = sorted(vocabulary.items(), key=lambda x: x[1], reverse=True)[:10]
        
        summary = f"""
📊 Vocabulary Extraction Summary
═══════════════════════════════════
📚 Total unique words: {total_words:,}
🔢 Total word occurrences: {total_occurrences:,}
📈 Average frequency: {total_occurrences/total_words:.1f}

🏆 Top 10 Most Frequent Words:
"""
        for i, (word, freq) in enumerate(most_common, 1):
            summary += f"{i:2d}. {word:<20} ({freq:,} times)\n"
        
        return summary


def main():
    """Main function to process the exported text file."""
    # File paths
    input_file = r"G:\My Drive\Code\Python\Super-Flashcards\Input\Copy of Cours Corey ending 1 de Février 2025.txt"
    output_dir = Path(r"G:\My Drive\Code\Python\Super-Flashcards\Output")
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)
    
    # Initialize extractor
    extractor = FrenchVocabularyExtractor()
    
    print("🚀 Starting French vocabulary extraction...")
    print(f"📁 Input file: {input_file}")
    print(f"📁 Output directory: {output_dir}")
    print()
    
    # Process the file
    vocabulary = extractor.process_file(input_file, min_frequency=2)
    
    if vocabulary:
        # Generate and display summary
        summary = extractor.generate_summary(vocabulary)
        print(summary)
        
        # Export to both CSV and JSON
        timestamp = Path(input_file).stem.replace(' ', '_')
        csv_output = output_dir / f"vocabulary_{timestamp}.csv"
        json_output = output_dir / f"vocabulary_{timestamp}.json"
        
        extractor.export_to_csv(vocabulary, str(csv_output))
        extractor.export_to_json(vocabulary, str(json_output))
        
        print(f"\n✅ Processing complete!")
        print(f"📄 CSV file: {csv_output}")
        print(f"📄 JSON file: {json_output}")
        print(f"\n💡 Next step: Use the CSV file for batch flashcard generation with OpenAI API")
        
    else:
        print("❌ No vocabulary was extracted. Please check the input file.")


if __name__ == "__main__":
    main()