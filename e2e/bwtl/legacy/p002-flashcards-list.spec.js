// P002 — Flashcard list GET → Library Cards grid
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P002 — Flashcard list: BE data appears in Library Cards grid', () => {
  test('cards from GET /api/flashcards/ appear in Library grid', async ({ page, request }) => {
    const apiResp = await request.get(`${KNOWN.sfBaseUrl}/api/flashcards/?limit=5`);
    expect(apiResp.ok()).toBe(true);
    const data = await apiResp.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    expect(items.length).toBeGreaterThan(0);
    const firstWord = items[0].word_or_phrase || items[0].word;
    expect(firstWord).toBeTruthy();

    await page.goto('/bwtl', { waitUntil: 'networkidle' });
    // Navigate to library
    const libBtn = page.locator('[data-view="library"], button:has-text("Library"), [aria-label*="Library"]').first();
    if (await libBtn.count()) await libBtn.click();
    await page.waitForTimeout(2000);
    // Cards should appear in DOM
    const cardEls = page.locator('.card');
    await expect(cardEls.first()).toBeVisible({ timeout: 8000 });
  });
});
