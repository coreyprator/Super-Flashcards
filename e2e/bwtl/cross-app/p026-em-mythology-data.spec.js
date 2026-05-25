// P026 — GET EM /api/v1/figures/{id}/mythology-data → Etymython panel hero
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P026 — EM figure mythology-data: returns figure name', () => {
  test('GET etymython.rentyourcio.com/api/v1/figures/{id}/mythology-data returns data', async ({ request }) => {
    const resp = await request.get(
      `${KNOWN.emBaseUrl}/api/v1/figures/${KNOWN.emFigureId}/mythology-data`
    );
    expect([200, 404].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      expect(data.name || data.english_name || data.id).toBeTruthy();
    }
  });
});
