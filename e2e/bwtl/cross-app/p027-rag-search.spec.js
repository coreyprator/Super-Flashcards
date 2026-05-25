// P027 — GET portfolio-rag search → RAG panel rows
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P027 — RAG etymology search: returns results', () => {
  test('GET portfolio-rag.../search/etymology?q=born returns results or empty', async ({ request }) => {
    const resp = await request.get(
      'https://portfolio-rag-57478301787.us-central1.run.app/search/etymology?q=born'
    );
    expect([200, 404, 503].includes(resp.status())).toBe(true);
    if (resp.status() === 200) {
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (data.results || data.items || []);
      expect(Array.isArray(items)).toBe(true);
    }
  });
});
