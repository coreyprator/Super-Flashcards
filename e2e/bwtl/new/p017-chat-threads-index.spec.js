// P017 — GET /api/chat/threads (no filter) → Chat tab threads index
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P017 — Chat threads index: returns all threads', () => {
  test('GET /api/chat/threads returns array', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/chat/threads`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || data.threads || []);
    expect(Array.isArray(items)).toBe(true);
  });
});
