import json

# Load the bootstrap vocabulary JSON
with open('Input/bootstrap_vocabulary.json', encoding='utf-8') as f:
    data = json.load(f)

# Count by language
lang_counts = {}
for card in data['flashcards']:
    lang = card['language_code']
    lang_counts[lang] = lang_counts.get(lang, 0) + 1

# Display results
print(f"📊 Bootstrap Vocabulary Analysis")
print(f"=" * 50)
print(f"Total cards: {len(data['flashcards'])}")
print(f"\nBy language:")
for lang in sorted(lang_counts.keys()):
    print(f"  {lang}: {lang_counts[lang]} cards")

print(f"\n✅ Ready for import!")
