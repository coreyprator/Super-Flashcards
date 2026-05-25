// P011 — POST /api/document/parse → Import preview
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P011 — Document parse: endpoint accessible', () => {
  test('POST /api/document/parse exists (not 404)', async ({ request }) => {
    const resp = await request.post(`${KNOWN.sfBaseUrl}/api/document/parse`, {
      data: { content: 'born: to be born', format: 'text' },
    });
    expect([200, 201, 400, 401, 422].includes(resp.status())).toBe(true);
  });
});
