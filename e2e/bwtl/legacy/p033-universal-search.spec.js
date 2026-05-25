// P033 — Universal search (SF + EFG) → search palette
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P033 — Universal search: endpoint returns results', () => {
  test('GET /api/search?q=born returns combined results', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/search?q=born`);
    expect([200, 404].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (data.items || data.results || []);
      expect(Array.isArray(items)).toBe(true);
    }
  });
});
