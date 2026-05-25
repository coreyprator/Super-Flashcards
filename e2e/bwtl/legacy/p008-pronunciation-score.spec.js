// P008 — POST /api/v1/pronunciation/score → Score panel
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P008 — Pronunciation score: endpoint accessible', () => {
  test('POST /api/v1/pronunciation/score exists (not 404)', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/v1/pronunciation/score`, {
      data: { word: 'born', audio_data: 'placeholder' },
    });
    // 400 = exists but invalid input; 404 = missing; 500 = broken
    expect([200, 400, 401, 422].includes(resp.status())).toBe(true);
  });
});
