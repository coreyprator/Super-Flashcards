// P018 — POST /api/bookmarks → Bookmark toggle
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P018 — Bookmark create: returns id and kind', () => {
  test('POST /api/bookmarks creates bookmark with id', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/bookmarks`, {
      data: { kind: 'flashcard', resource_id: KNOWN.cardWithPieRoot },
    });
    expect([200, 201, 409].includes(resp.status())).toBe(true);
    if ([200, 201].includes(resp.status())) {
      const data = await resp.json();
      expect(data.id).toBeTruthy();
      expect(data.kind).toBe('flashcard');
    }
  });
});
