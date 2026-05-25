// P031 — Flashcard audio_url field → <audio> element in DOM
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P031 — Flashcard audio_url: non-null audio_url present for known card', () => {
  test('card with audio has audio_url field set', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/flashcards/${KNOWN.cardWithAudio}`);
    expect(resp.ok()).toBe(true);
    const card = await resp.json();
    // Card "Aorist" is known to have audio_url
    expect(card.audio_url).toBeTruthy();
  });
});
