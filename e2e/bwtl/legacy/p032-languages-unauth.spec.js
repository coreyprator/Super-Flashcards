// P032 — GET /api/languages unauthenticated → filter chips
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P032 — Languages unauthenticated: returns 200 without auth', () => {
  test('GET /api/languages without auth token returns language list', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/languages`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    expect(items.length).toBeGreaterThan(0);
    // Verify items have name field
    expect(items[0].name).toBeTruthy();
  });
});
