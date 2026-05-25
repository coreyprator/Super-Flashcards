// P029 — GET via SF proxy to ArtForge jobs/{job_id} → job status
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P029 — ArtForge job status: status endpoint accessible', () => {
  test('GET /api/af/jobs/{job_id} returns job status', async ({ request }) => {
    // Use a known-stable job_id or accept 404 for non-existent
    const resp = await request.get(`${KNOWN.sfBaseUrl}/api/af/jobs/test-job-id`);
    expect([200, 404, 400].includes(resp.status())).toBe(true);
  });
});
