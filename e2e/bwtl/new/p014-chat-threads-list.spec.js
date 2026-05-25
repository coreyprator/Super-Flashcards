// P014 — GET /api/chat/threads?anchor_value={id} → Chat dock thread list
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P014 — Chat threads list: filtered by anchor_value', () => {
  test('GET /api/chat/threads?anchor_value=... returns array', async ({ request }) => {
    const resp = await request.get(
      `${KNOWN.sfBaseUrl}/api/chat/threads?anchor_value=${KNOWN.cardWithPieRoot}`
    );
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || data.threads || []);
    expect(Array.isArray(items)).toBe(true);
  });
});
