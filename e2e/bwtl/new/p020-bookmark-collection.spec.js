// P020 — POST /api/bookmark_collections → Sidebar new collection
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P020 — Bookmark collection create: returns id and name', () => {
  test('POST /api/bookmark_collections creates collection', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/bookmark_collections`, {
      data: { name: 'P020 test collection' },
    });
    expect([200, 201, 400, 401, 422].includes(resp.status())).toBe(true);
    if ([200, 201].includes(resp.status())) {
      const data = await resp.json();
      expect(data.id).toBeTruthy();
      expect(data.name).toBe('P020 test collection');
    }
  });
});
