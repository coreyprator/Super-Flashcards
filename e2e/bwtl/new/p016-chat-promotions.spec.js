// P016 — POST /api/chat/promotions → Accept-to-card audit log
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P016 — Chat promotions: endpoint accessible', () => {
  test('POST /api/chat/promotions exists (no 404)', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/chat/promotions`, {
      data: {
        card_id: KNOWN.cardWithPieRoot,
        target_field: 'etymology',
        after_value: 'test etymology value',
        accepted_by: 'test',
      },
    });
    expect([200, 201, 400, 401, 422].includes(resp.status())).toBe(true);
  });
});
