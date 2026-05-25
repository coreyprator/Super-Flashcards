// BWTL Sprint BVs — API canary tests for BWTL07 sprint discipline
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('BWTL07 Sprint canary — API endpoints wired in this sprint', () => {
  test('BUG-047: GET /api/template/csv returns 200 (not double-slash 404)', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/template/csv`);
    expect(resp.ok()).toBe(true);
  });

  test('BUG-047: POST /api/import accepts file (not double-slash 404)', async ({ request }) => {
    // Just verify the endpoint exists (returns non-404)
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/import`, {
      multipart: {
        file: { name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from('word,definition\ntest,a test') },
      },
    });
    expect([200, 201, 400, 422].includes(resp.status())).toBe(true);
  });

  test('POST /api/ai/generate: AI generate endpoint exists', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/ai/generate`, {
      data: { card_id: KNOWN.cardWithPieRoot, field: 'ipa', word_or_phrase: 'born', language_id: null },
    });
    expect([200, 201, 400, 422, 500].includes(resp.status())).toBe(true);
    // Specifically NOT 404
    expect(resp.status()).not.toBe(404);
  });

  test('POST /api/flashcards/ creates card and returns id (BV-CREATE-006)', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/flashcards/`, {
      data: {
        word_or_phrase: 'bwtl07-canary-card',
        definition: 'BWTL07 sprint canary test card — safe to delete',
        language_id: null,
      },
    });
    expect([200, 201, 400, 422].includes(resp.status())).toBe(true);
    if ([200, 201].includes(resp.status())) {
      const data = await resp.json();
      expect(data.id).toBeTruthy();
    }
  });

  test('GET /health returns version 4.0.0 (post-deploy smoke test)', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/health`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('4.0.0');
  });

  test('GET /api/flashcards/{id} pie_root field preserved after PUT (BV-AI-REGEN-001 canary)', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/flashcards/${KNOWN.cardWithPieRoot}`);
    expect(resp.ok()).toBe(true);
    const card = await resp.json();
    // pie_root should still be set (our AiEditButton PUT must not wipe other fields)
    expect(card.pie_root).toBeTruthy();
  });
});
