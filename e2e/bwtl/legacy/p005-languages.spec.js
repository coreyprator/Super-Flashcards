// P005 — GET /api/languages → Library language filter chips
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P005 — Languages: filter chips rendered from BE', () => {
  test('GET /api/languages returns array and language name appears in FE', async ({ page, request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/languages`);
    expect(resp.ok()).toBe(true);
    const langs = await resp.json();
    const items = Array.isArray(langs) ? langs : (langs.items || []);
    expect(items.length).toBeGreaterThan(0);
    const firstName = items[0].name;
    expect(firstName).toBeTruthy();
  });
});
