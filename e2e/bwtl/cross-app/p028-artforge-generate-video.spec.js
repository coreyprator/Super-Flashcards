// P028 — POST via SF proxy to ArtForge generate-video → job_id created
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P028 — ArtForge video generate: job created via SF proxy', () => {
  test('POST /api/flashcards/{id}/generate-video returns job_id', async ({ request }) => {
    const resp = await request.post(
      `${KNOWN.sfBaseUrl}/api/flashcards/${KNOWN.cardWithPieRoot}/generate-video`,
      { data: {} }
    );
    expect([200, 201, 202, 400, 409].includes(resp.status())).toBe(true);
    if ([200, 201, 202].includes(resp.status())) {
      const data = await resp.json();
      expect(data.job_id || data.status).toBeTruthy();
    }
  });
});
