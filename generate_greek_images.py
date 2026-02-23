"""
Pass 2: Generate DALL-E images for Greek cards that have no image.

Run this AFTER import_greek_vocab.py --no-images has completed.

Usage:
    python generate_greek_images.py
    python generate_greek_images.py --dry-run     # show count, no API calls
    python generate_greek_images.py --limit 50    # process only first N cards

Rate: ~12s pause between images to stay within DALL-E tier limits.
Est. time: (no-image card count) × ~20s
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import time
import argparse
import requests

BASE_URL = "https://learn.rentyourcio.com"
GREEK_LANGUAGE_ID = "21d23a9e-4ef7-4d53-ad17-371d164d0f0f"
IMAGE_PAUSE_SECONDS = 12  # ~5/min sustained; DALL-E tier allows 15/min
REQUEST_TIMEOUT = 90       # image gen is ~15-30s; allow margin


def get_greek_cards_without_images():
    """Fetch all Greek flashcards that have no image_url."""
    cards = []
    offset = 0
    limit = 1000
    while True:
        r = requests.get(
            f"{BASE_URL}/api/flashcards/",
            params={"language_id": GREEK_LANGUAGE_ID, "limit": limit, "offset": offset},
            timeout=30,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        cards.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return [c for c in cards if not c.get("image_url")]


def generate_image_for_card(card):
    """
    Call POST /api/ai/image to generate a DALL-E image.
    Returns image_url string or None on failure.
    """
    r = requests.post(
        f"{BASE_URL}/api/ai/image",
        params={
            "word_or_phrase": card["word_or_phrase"],
            "language_id": GREEK_LANGUAGE_ID,
            "flashcard_id": card["id"],  # passed for definition fallback
        },
        timeout=REQUEST_TIMEOUT,
    )
    if r.status_code in (200, 201):
        return r.json().get("image_url")
    return None


def update_card_image(card_id, image_url):
    """PATCH the flashcard's image_url via PUT /api/flashcards/{id}."""
    r = requests.put(
        f"{BASE_URL}/api/flashcards/{card_id}",
        json={"image_url": image_url},
        timeout=30,
    )
    return r.status_code in (200, 201)


def main():
    parser = argparse.ArgumentParser(description="Generate DALL-E images for no-image Greek cards")
    parser.add_argument("--dry-run", action="store_true", help="Show count, no API calls")
    parser.add_argument("--limit", type=int, default=0, help="Max cards to process (0 = all)")
    args = parser.parse_args()

    print("=" * 60)
    print("Super Flashcards — Greek Image Generation (Pass 2)")
    print(f"Target: {BASE_URL}")
    print("=" * 60)

    print("\n[Step 1] Fetching Greek cards without images ...")
    cards = get_greek_cards_without_images()
    total = len(cards)
    if args.limit:
        cards = cards[:args.limit]
    print(f"  Greek cards missing images: {total}")
    if args.limit:
        print(f"  Processing: {len(cards)} (--limit {args.limit})")

    if not cards:
        print("\nAll Greek cards already have images. Nothing to do.")
        return

    if args.dry_run:
        print(f"\n[DRY RUN — no API calls]")
        print(f"  Would generate ~{len(cards)} images")
        est_min = len(cards) * (20 + IMAGE_PAUSE_SECONDS) / 60
        print(f"  Estimated time: ~{est_min:.0f} min")
        return

    print(f"\n[Step 2] Generating images (~{IMAGE_PAUSE_SECONDS}s pause between each) ...")
    succeeded = 0
    failed = []
    start = time.time()

    for i, card in enumerate(cards, start=1):
        word = card["word_or_phrase"]
        card_id = card["id"]

        try:
            image_url = generate_image_for_card(card)
            if image_url:
                updated = update_card_image(card_id, image_url)
                if updated:
                    succeeded += 1
                    print(f"  [{i}/{len(cards)}] OK: {word}")
                else:
                    failed.append((word, card_id, "PUT update failed"))
                    print(f"  [{i}/{len(cards)}] FAIL (PUT): {word}")
            else:
                failed.append((word, card_id, "image_url not returned"))
                print(f"  [{i}/{len(cards)}] FAIL (no URL): {word}")
        except requests.Timeout:
            failed.append((word, card_id, "timeout"))
            print(f"  [{i}/{len(cards)}] FAIL (timeout): {word}")
        except requests.HTTPError as e:
            failed.append((word, card_id, f"HTTP {e.response.status_code}"))
            print(f"  [{i}/{len(cards)}] FAIL (HTTP {e.response.status_code}): {word}")
        except Exception as e:
            failed.append((word, card_id, str(e)[:80]))
            print(f"  [{i}/{len(cards)}] FAIL ({type(e).__name__}): {word}")

        # Pause between images (skip after last)
        if i < len(cards):
            time.sleep(IMAGE_PAUSE_SECONDS)

    elapsed = int(time.time() - start)
    print(f"\n{'='*60}")
    print("IMAGE GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"  Generated: {succeeded}/{len(cards)}")
    print(f"  Failed: {len(failed)}")
    print(f"  Elapsed: {elapsed // 60}m {elapsed % 60}s")

    if failed:
        print(f"\nFailed cards ({len(failed)}):")
        for word, cid, err in failed:
            print(f"  {word} ({cid[:8]}...): {err}")

        retry_file = "greek_images_failed.txt"
        with open(retry_file, "w", encoding="utf-8") as f:
            for word, cid, err in failed:
                f.write(f"{word}\t{cid}\t{err}\n")
        print(f"\nFailed list saved to: {retry_file}")

    print(f"\n[Step 3] Verification SQL:")
    print(f"""
  SELECT COUNT(*) AS with_image, SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) AS missing_image
  FROM flashcards f
  JOIN languages l ON f.language_id = l.id
  WHERE l.code = 'el';
""")


if __name__ == "__main__":
    main()
