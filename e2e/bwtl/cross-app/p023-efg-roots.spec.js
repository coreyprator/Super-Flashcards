// P023 — GET EFG /api/roots → Library PIE roots grid
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P023 — EFG roots: BE returns roots array', () => {
  test('GET efg.rentyourcio.com/api/roots returns roots', async ({ request }) => {
    const resp = await request.get('https://efg.rentyourcio.com/api/roots');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || data.roots || []);
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect(first.id || first.label || first.pie_root).toBeTruthy();
  });
});
