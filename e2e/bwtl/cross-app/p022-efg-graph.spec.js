// P022 — GET EFG /api/graph → EFG Graph panel nodes
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P022 — EFG graph: BE returns nodes', () => {
  test('GET efg.rentyourcio.com/api/graph returns nodes array', async ({ request }) => {
    const resp = await request.get('https://efg.rentyourcio.com/api/graph');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const nodes = data.nodes || data;
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
    const first = nodes[0];
    expect(first.id || first.label).toBeTruthy();
  });
});
