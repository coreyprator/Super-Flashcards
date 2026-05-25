// P003 — GET /api/study/next → Study queue
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P003 — Study next: queue endpoint returns items', () => {
  test('GET /api/study/next returns array with card_id fields', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/study/next`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect(first.card_id || first.id).toBeTruthy();
  });
});
