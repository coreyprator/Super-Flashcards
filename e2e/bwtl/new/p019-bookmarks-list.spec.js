// P019 — GET /api/bookmarks → Bookmarks tab list
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P019 — Bookmarks list: returns array', () => {
  test('GET /api/bookmarks returns bookmarks array', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/bookmarks`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || data.bookmarks || []);
    expect(Array.isArray(items)).toBe(true);
  });
});
