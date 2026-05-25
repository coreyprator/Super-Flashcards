// P006 — GET /api/users/me → Settings identity panel
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P006 — Users me: identity endpoint accessible', () => {
  test('GET /api/users/me returns user data or auth challenge', async ({ request }) => {
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/users/me`);
    // Unauthenticated will 401; that is fine — endpoint must exist
    expect([200, 401, 403].includes(resp.status())).toBe(true);
  });
});
