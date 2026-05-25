// P010 — GET /api/v1/cards/{id}/dcc → DCC row
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P010 — DCC lookup: endpoint accessible', () => {
  test('GET /api/v1/cards/{id}/dcc returns 200 or 404 (no 500)', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/v1/cards/${KNOWN.cardWithPieRoot}/dcc`);
    expect(resp.status()).toBeLessThan(500);
  });
});
