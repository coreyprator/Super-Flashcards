// P021 — GET /api/admin/coverage → Admin data health table
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P021 — Admin coverage: endpoint exists', () => {
  test('GET /api/admin/coverage returns 200 or auth challenge (no 404/500)', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/admin/coverage`);
    expect([200, 401, 403].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      expect(data.fields || data).toBeTruthy();
    }
  });
});
