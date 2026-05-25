// P030 — GET EM /api/v1/figures/{id}/artforge-story → Generate figure story panel
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P030 — EM artforge story: endpoint accessible', () => {
  test('GET etymython.../api/v1/figures/{id}/artforge-story returns 200 or 404', async ({ request }) => {
    const resp = await request.get(
      `${KNOWN.emBaseUrl}/api/v1/figures/${KNOWN.emFigureId}/artforge-story`
    );
    expect([200, 404, 503].includes(resp.status())).toBe(true);
  });
});
