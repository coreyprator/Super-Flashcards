"""
PIE IPA Conversion Service — SF05B
Converts Proto-Indo-European reconstructed roots to IPA using GPT-4o-mini.
"""

import logging
import os
import re

logger = logging.getLogger(__name__)


def strip_final_laryngeal(pie_root: str) -> str:
    """
    Remove trailing laryngeal notation from a PIE root before IPA conversion.
    Word-final laryngeals colored adjacent vowels but are not pronounced in isolation.
    Examples:
      *ǵénh₁-  →  *ǵén-
      *dʰéh₁-  →  *dʰé-
      *bʰer-   →  unchanged (r is not a laryngeal)
    """
    root = pie_root.rstrip('-').rstrip()
    # Subscript laryngeal notation (Unicode)
    root = re.sub(r'h[₁₂₃]$', '', root)
    # ASCII laryngeal notation
    root = re.sub(r'h[123]$', '', root)
    return root


# Shared client — reuses the same pattern as ai_generate.py
_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        import httpx
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        http_client = httpx.Client(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        )
        _client = OpenAI(api_key=api_key, http_client=http_client)
    return _client


_SYSTEM_PROMPT = """You are a historical linguist converting PIE (Proto-Indo-European) root notation to IPA
for use in text-to-speech synthesis by learners. Use the ACCESSIBLE TEACHING CONVENTION
that maximizes intelligibility. Return ONLY the IPA phoneme string — no asterisk, no
explanation, no brackets, no trailing dashes. Pure phoneme sequence only.

LARYNGEAL MAPPING — ACCESSIBLE CONVENTION (sounds like soft English h):
h₁ (h1) → h    EXAMPLE: *h₁es-  → hɛs     (soft h as in "hotel")
h₂ (h2) → h    EXAMPLE: *h₂stḗr → ˈhsteːr  (soft h, NOT the ch in "Bach")
h₃ (h3) → hʷ   EXAMPLE: *h₃rḗǵs → ˈhʷreːɡʲ (labial h)
CRITICAL: Never use /x/ (velar fricative) for laryngeals. Never use /ʔ/ (glottal stop).
The characters ₁ ₂ ₃ must NEVER appear in your output.

ASPIRATED STOPS — sounds like consonant + puff of air (like English p in "pit"):
bʰ (bh) → bʰ   EXAMPLE: *bʰer- → bʰɛr   (breathy b, NOT bex or buch)
dʰ (dh) → dʰ   EXAMPLE: *dʰeh₁ → dʰɛh   (breathy d)
gʰ (gh) → gʰ   EXAMPLE: *gʰes- → gʰɛs   (breathy g)
gʷʰ     → gʷʰ
IMPORTANT: bʰ dʰ gʰ are aspirated stops — a consonant followed by a breath of air.
They are NOT fricatives. Do not render them as x, ch, or f sounds.

STRESS: Place ˈ BEFORE the accented syllable only if root has an acute accent mark.
Unaccented roots get NO stress marker. NEVER place ˈ at the end of the string.

SCHWA PREVENTION: If the root ends on a consonant (common for verb roots like *sed-,
*men-, *per-), do NOT add a vowel. The string must end on the consonant phoneme.
Example: *sed- → sɛd (NOT sɛdə or sɛdɛ). The final phoneme is the final character.

PLAIN CONSONANT MAPPING:
p→p  t→t  k→k  b→b  d→d  g→ɡ
kʷ→kʷ  gʷ→ɡʷ
ḱ/ǵ (palatovelars) → kʲ / ɡʲ
s→s  y→j  w→w  m→m  n→n  r→r  l→l

VOWEL MAPPING:
e→ɛ  o→o  a→a  ē→eː  ō→oː  ā→aː
i→i  u→u  ī→iː  ū→uː

SYLLABIC RESONANTS: m̥→m̩  n̥→n̩  r̥→r̩  l̥→l̩

WORD-FINAL LARYNGEALS: Strip h₁/h₂/h₃ if it is the last segment before the dash.
Example: *ǵénh₁- → strip h₁ → ɡʲɛn  (no /h/ at end, laryngeal was coloring vowel)

Strip the leading asterisk. Strip trailing dash. Apply the mapping above.
Return ONLY the resulting IPA string. Nothing else.

Root to convert: {pie_root}"""


# Subscript digits that indicate unconverted laryngeal notation
_SUBSCRIPT_DIGITS = {'\u2081', '\u2082', '\u2083', '\u2084', '\u2085'}


def _validate_ipa(raw: str) -> str | None:
    """Validate IPA output. Returns cleaned IPA or None if invalid."""
    if not raw or len(raw) < 1 or len(raw) > 50:
        return None

    # Reject subscript digits — unconverted laryngeal notation
    if any(c in raw for c in _SUBSCRIPT_DIGITS):
        return None

    # Reject ASCII laryngeal sequences
    if re.search(r'h[123]', raw):
        return None

    # Reject stress marker at end of string
    if raw.endswith('\u02c8') or raw.endswith('\u02cc'):
        return None

    # Reject asterisk (unconverted PIE notation leaked through)
    if '*' in raw:
        return None

    # Reject brackets
    if '[' in raw or ']' in raw:
        return None

    # Reject glottal stop (should not appear in accessible convention)
    if 'ʔ' in raw:
        return None

    # Reject standalone /x/ — indicates old h₂ convention leaked through
    # Allow 'xʷ' (old h₃) but reject bare 'x'
    if re.search(r'x(?!ʷ)', raw):
        return None

    # Reject trailing schwa or open vowel added to consonant-final root
    if raw.endswith('ə') or raw.endswith('ɐ') or raw.endswith('ɜ'):
        return None

    return raw


async def convert_pie_to_ipa(pie_root: str) -> str | None:
    """
    Convert a PIE root (e.g. *bher-) to IPA transcription using GPT-4o-mini.
    Returns IPA string or None if conversion fails or root is invalid.
    """
    if not pie_root or pie_root.strip() in ('N/A', '', 'null'):
        return None
    if not pie_root.startswith('*'):
        return None

    # Strip word-final laryngeals before passing to GPT
    processed_root = strip_final_laryngeal(pie_root)

    try:
        client = _get_client()

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT.format(pie_root=processed_root)},
                {"role": "user", "content": f"Convert to IPA: {processed_root}"}
            ],
            temperature=0,
            max_tokens=60,
        )

        ipa = response.choices[0].message.content.strip()

        validated = _validate_ipa(ipa)
        if validated is None:
            logger.warning(f"[PIE-IPA] Validation failed for {pie_root}: '{ipa}'")
            return None

        logger.info(f"[PIE-IPA] {pie_root} → /{validated}/")
        return validated

    except Exception as e:
        logger.error(f"[PIE-IPA] Error converting {pie_root}: {e}")
        return None
