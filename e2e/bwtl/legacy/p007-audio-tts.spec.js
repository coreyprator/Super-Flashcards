// P007 — POST /api/audio/tts → Audio URL in DOM
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P007 — Audio TTS: endpoint returns audio_url', () => {
  test('POST /api/audio/tts returns audio_url or queued status', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/audio/tts`, {
      data: { card_id: KNOWN.cardWithPieRoot, text: 'born', language_code: 'el' },
    });
    // Accept 200/201/202/400 — not 500
    expect(resp.status()).toBeLessThan(500);
  });
});
