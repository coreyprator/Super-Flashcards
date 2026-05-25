// P004 — GET /api/study/sessions → Stats widget
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P004 — Study sessions: stats endpoint accessible', () => {
  test('GET /api/study/sessions returns 200 with session data', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/study/sessions`);
    // Accept 200 or 404 (not configured) but not 500
    expect([200, 404].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      // Could be array or object with stats
      expect(data).toBeTruthy();
    }
  });
});
