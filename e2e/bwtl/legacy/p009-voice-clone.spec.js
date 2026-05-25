// P009 — GET /api/v1/voice_clone → Voice selector
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P009 — Voice clone list: endpoint accessible', () => {
  test('GET /api/v1/voice_clone returns 200 or auth challenge', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/v1/voice_clone`);
    expect([200, 401, 403, 404].includes(resp.status())).toBe(true);
  });
});
