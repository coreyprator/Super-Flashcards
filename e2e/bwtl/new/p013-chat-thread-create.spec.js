// P013 — POST /api/chat/threads → New thread chip
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P013 — Chat thread create: POST returns thread id', () => {
  test('POST /api/chat/threads returns thread with id field', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/chat/threads`, {
      data: {
        anchor_mode: 'card',
        anchor_value: KNOWN.cardWithPieRoot,
        title: 'P013 test thread',
      },
    });
    expect([200, 201].includes(resp.status())).toBe(true);
    const data = await resp.json();
    expect(data.id).toBeTruthy();
  });
});
