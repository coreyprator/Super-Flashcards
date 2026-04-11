"""
PIE IPA Conversion Service — SF05B
Converts Proto-Indo-European reconstructed roots to IPA using GPT-4o-mini.
"""

import logging
import os
import re

logger = logging.getLogger(__name__)

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


_SYSTEM_PROMPT = """You are a historical linguist converting PIE (Proto-Indo-European) root notation to IPA.
Use the CONSERVATIVE convention. Return ONLY the IPA string — no asterisk, no explanation,
no brackets, no trailing dashes, no leading slash, no trailing slash. Pure phoneme sequence only.

LARYNGEAL CONVERSION — MANDATORY — these are the most common errors:
h₁ (also written h1) → ʔ   EXAMPLE: *h₁es- → ʔɛs
h₂ (also written h2) → x   EXAMPLE: *h₂stḗr → xˈsteːr
h₃ (also written h3) → xʷ  EXAMPLE: *h₃rḗǵs → xʷreːɡʲs
RULE: The characters ₁ ₂ ₃ (subscript numbers, Unicode U+2081 U+2082 U+2083) must NEVER
appear in your output. If you see h₁ h₂ h₃ in the input, replace the entire sequence
with ʔ x xʷ respectively. Do not pass subscript digits through.

STRESS MARKER RULES:
- If the root has an acute accent on a vowel (e.g. *bʰér-, *méh₂tēr), place ˈ BEFORE
  the accented syllable: *bʰér- → ˈbʱɛr, *méh₂tēr → ˈmeːxteːr
- If the root has NO acute accent (e.g. *per-, *sed-), use NO stress marker at all: *per- → pɛr
- NEVER place ˈ at the end of the string. It always precedes a vowel.

CONSONANT MAPPING:
p→p  t→t  k→k  b→b  d→d  g→ɡ
kʷ→kʷ  gʷ→ɡʷ
ḱ (k-acute)→kʲ  ǵ (g-acute)→ɡʲ
bʰ→bʱ  dʰ→dʱ  gʰ→ɡʱ  gʷʰ→ɡʷʱ
s→s  y→j  w→w  m→m  n→n  r→r  l→l

VOWEL MAPPING:
e→ɛ  o→o  a→a
ē→eː  ō→oː  ā→aː
i→i  u→u  ī→iː  ū→uː

SYLLABIC RESONANTS (underring):
m̥→m̩  n̥→n̩  r̥→r̩  l̥→l̩

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
        return None  # h₁/h₂/h₃ not converted

    # Reject ASCII laryngeal sequences
    if re.search(r'h[123]', raw):
        return None  # h1/h2/h3 not converted

    # Reject stress marker at end of string
    if raw.endswith('\u02c8') or raw.endswith('\u02cc'):
        return None  # Stress marker misplaced — must precede a vowel

    # Reject asterisk (unconverted PIE notation leaked through)
    if '*' in raw:
        return None

    # Reject brackets
    if '[' in raw or ']' in raw:
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

    try:
        client = _get_client()

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT.format(pie_root=pie_root)},
                {"role": "user", "content": f"Convert to IPA: {pie_root}"}
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
