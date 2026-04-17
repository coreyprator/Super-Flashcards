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


_SYSTEM_PROMPT = """You are a historical linguist converting PIE (Proto-Indo-European) root notation to IPA
for text-to-speech synthesis. Use the ACCESSIBLE TEACHING CONVENTION.
Return ONLY the IPA phoneme string — no asterisk, no explanation, no brackets,
no trailing dashes. Pure phoneme sequence only.

LARYNGEAL MAPPING (accessible convention — sounds like soft English h):
h₁ (h1) → h   EXAMPLE: *h₁es- → hɛs
h₂ (h2) → h   EXAMPLE: *h₂stḗr → hˈsteːr
h₃ (h3) → hʷ  EXAMPLE: *h₃rḗǵs → ˈhʷreːɡʲ
  — this applies EVEN when h₃ appears after a consonant cluster at the end of a root.
  EXAMPLE: *ǵʰelh₃- has h₃ after l — still maps to hʷ → ɡʲʰɛlhʷ
H (capital H, archaic notation) → h   EXAMPLE: *steH- → stɛh, *yeH- → jɛh, *bʰreH- → bʰrɛh

WORD-FINAL LARYNGEAL RULE:
When h₁/h₂/h₃/H appears as the last phoneme of the root (just before the trailing dash
or at the end of the notation), it produces an audible /h/ sound.
DO NOT strip or omit it.
EXAMPLES:
*peh₁- → pɛh   (the h₁ IS the final phoneme — keep it as h)
*pleh₁- → plɛh  (same — audible h)
*steH- → stɛh   (capital H = unspecified laryngeal = h)
*yeH- → jɛh
*bʰreH- → bʰrɛh
*dʰeh₁- → dʰɛh
WRONG: *peh₁- → pɛ  (stripping the laryngeal is wrong)

INTERIOR CONSONANTS BEFORE LARYNGEALS:
When a consonant (l, r, n, m, etc.) appears before a laryngeal, KEEP IT.
*pelh₁- → pɛlh   (l stays — do NOT drop it)
WRONG: *pelh₁- → pɛh  (dropping the l is wrong)

EXCEPTION — morphological suffix laryngeals:
When a laryngeal appears in a productive suffix like -nh₁- or -h₂/h₃- in the MIDDLE of
a root, it may color adjacent vowels but not produce a standalone /h/.
This is rare and only applies to laryngeals clearly interior to a morpheme boundary.
When in doubt, keep the /h/.

CRITICAL: The characters ₁ ₂ ₃ (Unicode subscript) must NEVER appear in output.
The character H (capital) must NEVER appear in output — convert it first.

PALATOVELAR MAPPING — CRITICAL (always apply ʲ marker):
ǵ → ɡʲ  (ALWAYS — palatovelar voiced stop = velar + palatal)
ḱ → kʲ
ǵʰ → ɡʲʰ  (palatovelar + aspirate — BOTH markers present)
EXAMPLES:
*ǵen- → ɡʲɛn      (NOT ɡɛn — the ʲ is mandatory)
*werǵ- → wɛrɡʲ    (NOT wɛrɡ — word-final ǵ still gets ʲ)
*mreǵ- → mrɛɡʲ    (NOT mrɛɡ)
*bʰreǵ- → bʰrɛɡʲ  (NOT bʰrɛɡ or bʰreɡ)
*ǵneh₃- → ɡʲnɛhʷ  (ǵ→ɡʲ AND h₃→hʷ)
*ǵʰelh₃- → ɡʲʰɛlhʷ (ǵʰ→ɡʲʰ — both ʲ and ʰ present)
*ǵhew- → ɡʲʰɛw    (ǵh is palatovelar aspirated = ɡʲʰ)

ASPIRATED STOPS (consonant + puff of air, NOT a fricative):
bʰ (bh) → bʰ   EXAMPLE: *bʰer- → bʰɛr
dʰ (dh) → dʰ   EXAMPLE: *dʰeh₁- → dʰɛh
gʰ (gh) → ɡʰ   EXAMPLE: *gʰes- → ɡʰɛs  (use IPA ɡ U+0261)
gʷʰ → ɡʷʰ
CRITICAL: Use IPA ɡ (U+0261) not ASCII g for ALL g sounds in output.

DIPHTHONG RULE — vowel mapping applies WITHIN diphthongs:
The e→ɛ rule applies to the e in diphthongs. Examples:
ei → ɛj  (NOT ei or eɪ)   *skei- → skɛj
ey → ɛj  (same as ei)     *sneygʷʰ- → snɛjɡʷʰ
ew → ɛw  (NOT ew or eʊ)   *dyew- → djɛw,  *leuk- → lɛwk (eu before k)
oi → oj
ow → ow
WRONG: *skei- → skei  (must be skɛj)
WRONG: *dyew- → djuʊ  (must be djɛw)
WRONG: *sneygʷʰ- → sneɪɡʷʰ  (ey must be ɛj, not eɪ)

STRESS: ˈ BEFORE accented syllable only if root has acute accent.
No accent = no stress marker. NEVER place ˈ at end of string.
The stress marker goes before the syllable with the accent, not before the root-initial consonant
unless the initial consonant IS the onset of the accented syllable.

PLAIN CONSONANT MAPPING:
p→p  t→t  k→k  b→b  d→d  g→ɡ (use IPA ɡ U+0261, not ASCII g)
kʷ→kʷ  gʷ→ɡʷ
kw (written without superscript) → kʷ  EXAMPLE: *kwelp- → kʷɛlp
ḱ/ǵ (palatovelars) → kʲ / ɡʲ  (ALWAYS include ʲ)
s→s  y→j  w→w  m→m  n→n  r→r (use plain r, NOT ɹ)  l→l

VOWEL MAPPING:
e→ɛ  o→o  a→a  ē→eː  ō→oː  ā→aː
ó→o (accented o is still o, NOT ɔ)  é→ɛ
ṓ→oː (accented + macron = long o with stress)  EXAMPLE: *pṓds → ˈpoːds
i→i  u→u  ī→iː  ū→uː
CRITICAL: PIE o is always /o/, never /ɔ/. The vowel ɔ does not exist in PIE.
*dóru → ˈdoru   (NOT dɔru)
*wódr̥ → ˈwodr̩  (NOT wɔdr̩)
*nokʷt- → nokʷt  (NOT nɔkʷt)
*ghordho- → ɡʰordʰo  (NOT ɡʰɔrdʰo)
*pṓds → ˈpoːds  (NOT ˈpɔds — ṓ has macron = long oː, o never becomes ɔ)

LONG VOWEL RULE:
Macron vowels (ē ō ā) ALWAYS produce long vowels with ː regardless of context.
*méh₂tēr → ˈmeːhteːr  (é before h₂ = eː with stress; ē = eː)

SYLLABIC RESONANTS: m̥→m̩  n̥→n̩  r̥→r̩  l̥→l̩

COMMON MISTAKES — AVOID:
*méh₂tēr → ˈmeːhteːr  (NOT mɛtɛr — é is accented = eː with stress, ē is long = eː, h₂ = h)
*h₂stḗr  → hˈsteːr    (NOT ˈhsteːr — stress on ē syllable, h₂ produces h before s)
*ǵʰelh₃- → ɡʲʰɛlhʷ   (NOT ɡʰɛl — ǵ is palatovelar = ɡʲ, h₃ = hʷ)
*ǵhew-   → ɡʲʰɛw      (NOT ɡʲeʊ — diphthong rule: e→ɛ, ew→ɛw)
*ǵneh₃-  → ɡʲnɛhʷ     (NOT ɡnɛh — ǵ = ɡʲ always, h₃ = hʷ always)
*bʰreǵ-  → bʰrɛɡʲ     (NOT bʰrɛɡ — ǵ is always ɡʲ, not plain ɡ)
*h₂ster- → hstɛr       (NOT ˈhsteːr — NO accent mark = NO stress marker, e without macron = short ɛ not eː. Do NOT confuse with *h₂stḗr which HAS accent.)
*gʰes-   → ɡʰɛs        (NOT gʰɛs — use IPA ɡ U+0261, not ASCII g)
*kwelp-  → kʷɛlp       (NOT kwɛlp — kw = kʷ labiovelar)
*pelh₁-  → pɛlh        (NOT pɛh — keep consonants before laryngeals)
*h₁rewdʰ- → hrɛwdʰ    (NOT hɹɛwdʰ — use plain r, not ɹ)
*pṓds     → ˈpoːds    (NOT ˈpɔds — ṓ = accented long o = oː with stress; o NEVER becomes ɔ)

Strip the leading asterisk. Strip trailing dash. Apply mapping. Return ONLY the IPA string.

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

    # Reject capital H — means mapping failed
    if 'H' in raw:
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
