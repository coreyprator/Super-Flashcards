// P025 — GET EM /api/v1/cognates/lookup → Card cognates strip
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P025 — EM cognates lookup: returns cognates or null', () => {
  test('GET etymython.rentyourcio.com/api/v1/cognates/lookup?word=born', async ({ request }) => {
    const resp = await request.get(
      `${KNOWN.emBaseUrl}/api/v1/cognates/lookup?word=born`
    );
    expect([200, 404].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      // May be null or {cognates:[...]}
      expect(data === null || typeof data === 'object').toBe(true);
    }
  });
});
