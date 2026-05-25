// P001 — Flashcard GET → DOM assertion
// BE path: GET /api/flashcards/{id}
// FE path: Study › Word card center
//
// Flow:
//   1. Fetch /api/flashcards/KNOWN.cardWithPieRoot directly via request context
//   2. Assert the response is 200 and word_or_phrase === "born"
//   3. Navigate to /bwtl (SPA entry point)
//   4. Wait for page load (networkidle)
//   5. Assert word_or_phrase ("born") appears somewhere in the DOM
//
// Expected result at Checkpoint 1: FAIL on step 5
//   The app defaults to cardId='fc_souvenir' (not in DB).
//   workspace.jsx returns null → nothing renders → "born" never in DOM.
//   This test is the E2E proof of the wiring gap.

const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P001 — Flashcard GET wiring: BE data appears in FE DOM', () => {
  test('word_or_phrase from BE appears in word card center', async ({ page, request }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    // Step 1: Verify the BE endpoint returns the expected data
    const apiResp = await request.get(
      `${KNOWN.sfBaseUrl}/api/flashcards/${KNOWN.cardWithPieRoot}`
    );
    expect(apiResp.ok(), `BE /api/flashcards/${KNOWN.cardWithPieRoot} should return 200`).toBe(true);

    const card = await apiResp.json();
    expect(card.word_or_phrase, 'BE response word_or_phrase should be "born"').toBe('born');
    expect(card.pie_root, 'BE response pie_root should be "*bher-"').toBe('*bher-');

    // Step 2: Navigate to the SPA
    await page.goto('/bwtl', { waitUntil: 'networkidle' });

    // Step 3: Assert no JS errors during page load
    expect(consoleErrors, 'No JS console errors on page load').toEqual([]);
    expect(pageErrors, 'No uncaught JS page errors').toEqual([]);

    // Step 4: Assert BE word appears in the DOM
    // This is the wiring assertion — will FAIL until fix is applied.
    // After fix: fetchCard(KNOWN.cardWithPieRoot) must be auto-called on mount
    // and workspace must display the card.
    const wordInDom = page.locator('text=born').first();
    await expect(wordInDom).toBeVisible({ timeout: 5000 });
  });
});
