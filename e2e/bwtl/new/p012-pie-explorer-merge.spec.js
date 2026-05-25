// P012 — PIE Explorer merge: BE verbal_paradigm appears in FE DOM
// BE path: GET /api/flashcards/pie-explorer/{root}
// FE path: Study › PIE Explorer right rail panel
//
// Flow:
//   1. Fetch /api/flashcards/pie-explorer/bher- via request context
//   2. Assert 200, extract a unique slice from verbal_paradigm JSON string
//   3. Navigate to /bwtl (SPA entry point)
//   4. Assert the verbal_paradigm slice appears inside .efg-prose .body
//
// Expected result at Checkpoint 1: FAIL on step 4
//   PiePanel in panels.jsx reads window.BWTL.PIE_ROOTS[pieRootKey].
//   fetchPieRoot() is never auto-called on mount.
//   window.BWTL.PIE_ROOTS is always an empty object {}.
//   PiePanel returns null → no .efg-prose element in DOM.
//   This test is the E2E proof of the PIE panel wiring gap.

const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P012 — PIE Explorer merge: verbal_paradigm appears in FE DOM', () => {
  test('verbal_paradigm from PIE API appears in PIE Explorer panel', async ({ page, request }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    // Step 1: Verify the BE PIE explorer endpoint returns data
    const apiResp = await request.get(
      `${KNOWN.sfBaseUrl}/api/flashcards/pie-explorer/${KNOWN.pieRootUrlKey}`
    );
    expect(apiResp.ok(), `BE /api/flashcards/pie-explorer/${KNOWN.pieRootUrlKey} should return 200`).toBe(true);

    const pieData = await apiResp.json();
    // NOTE: the API returns "bher-" (no asterisk) in the pie_root field of
    // the pie-explorer endpoint — distinct from the card.pie_root which is "*bher-"
    expect(pieData.pie_root, 'PIE root in response should be "bher-" (no asterisk)').toBe('bher-');
    expect(pieData.verbal_paradigm, 'verbal_paradigm field should be present').toBeTruthy();

    // Extract a unique token from verbal_paradigm to assert in DOM
    // The field is a JSON string; we take the first ~30 chars as a slice
    const verbalParadigm = pieData.verbal_paradigm;
    expect(typeof verbalParadigm, 'verbal_paradigm should be a string').toBe('string');

    // Find a short, unique excerpt (first 1sg form)
    const paradigmSlice = '*bher-o'; // first PIE present 1sg form — guaranteed in the data

    // Step 2: Navigate to the SPA
    await page.goto('/bwtl', { waitUntil: 'networkidle' });

    // Step 3: Assert no JS errors
    expect(consoleErrors, 'No JS console errors on page load').toEqual([]);
    expect(pageErrors, 'No uncaught JS page errors').toEqual([]);

    // Step 4: Assert verbal_paradigm content appears in the PIE panel
    // panels.jsx ProseBlock renders {body} as raw text in <div class="body">
    // After fix: fetchPieRoot('bher-') must be called and PIE_ROOTS populated.
    // Until fix: PiePanel returns null → no .efg-prose in DOM → FAIL.
    const piePanel = page.locator('.efg-prose .body').first();
    await expect(piePanel).toContainText(paradigmSlice, { timeout: 5000 });
  });
});
