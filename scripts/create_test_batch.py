#!/usr/bin/env python3
import csv

selected_words = []
with open(r'Output/vocabulary_Copy_of_Cours_Corey_ending_1_de_Février_2025 Selected.csv', 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('X', '').lower() == 'x':
            selected_words.append(row)
            if len(selected_words) >= 5:
                break

print('Found selected words:')
for word in selected_words:
    print(f'- {word["french_text"]} (frequency: {word.get("frequency", 0)})')

# Create test file for import
with open('Output/test_5_words.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['word_or_phrase', 'definition', 'etymology', 'english_cognates', 'related_words', 'language'])
    for word in selected_words:
        writer.writerow([word['french_text'], '[To be translated]', f'Found {word.get("frequency", 0)} times in text', '', '', 'french'])

print(f'Created test file with {len(selected_words)} words: Output/test_5_words.csv')