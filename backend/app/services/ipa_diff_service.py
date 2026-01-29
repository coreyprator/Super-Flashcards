"""
IPA Phoneme Comparison Service
Highlights differences between target and spoken pronunciation
"""
import re
from typing import List, Dict, Tuple, Optional
from difflib import SequenceMatcher


# Common IPA phonemes (simplified set for major languages)
IPA_PHONEMES = {
    # Vowels
    'a', 'e', 'i', 'o', 'u', 'ə', 'ɛ', 'ɔ', 'æ', 'ʌ', 'ɪ', 'ʊ', 'ɑ',
    # Nasal vowels (French)
    'ɛ̃', 'ɑ̃', 'ɔ̃', 'œ̃',
    # Consonants
    'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 
    'm', 'n', 'ŋ', 'ɲ', 'l', 'r', 'ʁ', 'w', 'j', 'h',
    # Special
    'θ', 'ð', 'tʃ', 'dʒ', 'ɣ', 'x', 'χ'
}

# Phonemes that are commonly confused (for better feedback)
CONFUSION_PAIRS = {
    ('ɛ̃', 'ɛn'): "Nasal vowel [ɛ̃] should resonate in nose, not end with [n]",
    ('ɛ̃', 'ɛ'): "Nasal vowel [ɛ̃] needs nasalization - you said [ɛ]",
    ('ɑ̃', 'ɑn'): "Nasal vowel [ɑ̃] is nasalized, not followed by [n]",
    ('ɑ̃', 'ɑ'): "Nasal vowel [ɑ̃] needs nasalization - you said [ɑ]",
    ('ʁ', 'r'): "French [ʁ] is uvular (throat), not alveolar (tongue tip)",
    ('y', 'u'): "French [y] requires rounded lips while saying [i]",
    ('ø', 'o'): "French [ø] is between [e] and [o], lips rounded",
    ('θ', 's'): "English [θ] (th) requires tongue between teeth",
    ('ð', 'd'): "English [ð] (th) is voiced with tongue between teeth",
}


def tokenize_ipa(ipa_string: str) -> List[str]:
    """
    Split IPA string into individual phonemes.
    Handles multi-character phonemes like 'tʃ', 'ɛ̃', etc.
    
    Examples:
        "pɛ̃s" → ["p", "ɛ̃", "s"]
        "pɑ̃sə" → ["p", "ɑ̃", "s", "ə"]
        "θɪŋk" → ["θ", "ɪ", "ŋ", "k"]
    """
    if not ipa_string:
        return []
    
    phonemes = []
    i = 0
    ipa = ipa_string.strip()
    
    while i < len(ipa):
        # Skip spaces and delimiters
        if ipa[i] in ' .ˈˌ':
            i += 1
            continue
        
        # Check for multi-character phonemes (longest match first)
        matched = False
        
        # Check for 3-char combinations (e.g., vowel + combining tilde + modifier)
        if i + 3 <= len(ipa):
            chunk3 = ipa[i:i+3]
            if chunk3 in ['tʃ', 'dʒ', 'ts', 'dz'] or (len(chunk3) >= 2 and chunk3[1] == '̃'):
                phonemes.append(chunk3)
                i += 3
                matched = True
        
        if not matched and i + 2 <= len(ipa):
            chunk2 = ipa[i:i+2]
            # Check for combining diacritics (nasal marker ̃)
            if len(chunk2) >= 2 and chunk2[1] in ['̃', '̀', '́', '̂', '̌', '̆', '̇', '̈', '̋']:
                phonemes.append(chunk2)
                i += 2
                matched = True
            # Check for known 2-char phonemes
            elif chunk2 in ['tʃ', 'dʒ', 'ts', 'dz', 'ŋ', 'ɲ', 'ʃ', 'ʒ', 'θ', 'ð', 'ʁ', 'ɣ']:
                phonemes.append(chunk2)
                i += 2
                matched = True
        
        if not matched:
            phonemes.append(ipa[i])
            i += 1
    
    return phonemes


def compare_ipa(target_ipa: str, spoken_ipa: str) -> Dict:
    """
    Compare target and spoken IPA, returning detailed diff with color-coding info.
    
    Args:
        target_ipa: Target pronunciation (e.g., "pɛ̃s")
        spoken_ipa: User's pronunciation (e.g., "pɑ̃sə")
    
    Returns:
        {
            "target_phonemes": ["p", "ɛ̃", "s"],
            "spoken_phonemes": ["p", "ɑ̃", "s", "ə"],
            "alignment": [
                {
                    "target": "p",
                    "spoken": "p",
                    "match": True,
                    "color": "green",
                    "tip": None
                },
                {
                    "target": "ɛ̃",
                    "spoken": "ɑ̃",
                    "match": False,
                    "color": "red",
                    "tip": "Nasal vowel..."
                },
                ...
            ],
            "match_ratio": 0.67,
            "is_perfect": False
        }
    """
    target_phonemes = tokenize_ipa(target_ipa)
    spoken_phonemes = tokenize_ipa(spoken_ipa)
    
    # Use sequence matcher for alignment
    matcher = SequenceMatcher(None, target_phonemes, spoken_phonemes)
    
    alignment = []
    matches = 0
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Perfect matches
            for k in range(i2 - i1):
                phoneme = target_phonemes[i1 + k]
                alignment.append({
                    "target": phoneme,
                    "spoken": phoneme,
                    "match": True,
                    "color": "green",
                    "tip": None
                })
                matches += 1
        
        elif tag == 'replace':
            # Substitutions (target phoneme replaced with different spoken phoneme)
            for k in range(max(i2 - i1, j2 - j1)):
                t_phoneme = target_phonemes[i1 + k] if i1 + k < i2 else None
                s_phoneme = spoken_phonemes[j1 + k] if j1 + k < j2 else None
                
                tip = _get_confusion_tip(t_phoneme, s_phoneme)
                
                alignment.append({
                    "target": t_phoneme,
                    "spoken": s_phoneme,
                    "match": False,
                    "color": "red",
                    "tip": tip
                })
        
        elif tag == 'delete':
            # Missing phonemes (target had phoneme, user didn't say it)
            for k in range(i2 - i1):
                phoneme = target_phonemes[i1 + k]
                alignment.append({
                    "target": phoneme,
                    "spoken": None,
                    "match": False,
                    "color": "red",
                    "tip": f"Missing [{phoneme}]"
                })
        
        elif tag == 'insert':
            # Extra phonemes (user said phoneme not in target)
            for k in range(j2 - j1):
                phoneme = spoken_phonemes[j1 + k]
                alignment.append({
                    "target": None,
                    "spoken": phoneme,
                    "match": False,
                    "color": "red",
                    "tip": f"Extra [{phoneme}] not in target"
                })
    
    total = max(len(target_phonemes), len(spoken_phonemes), 1)
    
    return {
        "target_phonemes": target_phonemes,
        "spoken_phonemes": spoken_phonemes,
        "alignment": alignment,
        "match_ratio": matches / total,
        "is_perfect": len([a for a in alignment if not a["match"]]) == 0,
        "num_matches": matches,
        "num_total": total
    }


def _get_confusion_tip(target: Optional[str], spoken: Optional[str]) -> Optional[str]:
    """Get specific tip for common phoneme confusions."""
    if not target or not spoken:
        return None
    
    # Check known confusion pairs (both directions)
    for (p1, p2), tip in CONFUSION_PAIRS.items():
        if (target == p1 and spoken == p2) or (target == p2 and spoken == p1):
            return tip
    
    return None


def format_ipa_with_colors(alignment: List[Dict]) -> str:
    """
    Format IPA alignment as HTML with color coding.
    
    Example:
        <span class="ipa-phoneme ipa-green">p</span>
        <span class="ipa-phoneme ipa-red" title="tip">ɛ̃→ɑ̃</span>
    """
    html_parts = []
    
    for item in alignment:
        color_class = f"ipa-{item['color']}"
        
        if item['match']:
            # Green match - just show target
            html_parts.append(
                f'<span class="ipa-phoneme {color_class}">{item["target"]}</span>'
            )
        else:
            # Red mismatch - show both with tooltip
            target_text = item['target'] or '∅'
            spoken_text = item['spoken'] or '∅'
            comparison = f"{target_text}→{spoken_text}"
            
            tip_attr = f' title="{item["tip"]}"' if item['tip'] else ''
            html_parts.append(
                f'<span class="ipa-phoneme {color_class}"{tip_attr}>{comparison}</span>'
            )
    
    return ' '.join(html_parts)
