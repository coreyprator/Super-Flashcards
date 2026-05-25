// P024 — EM Figures cross-app: BE figure name appears in Library Figures tab
// BE path: GET https://etymython.rentyourcio.com/api/v1/figures?limit=20
// FE path: Library › Figures grid (Figures tab)
//
// Flow:
//   1. Fetch https://etymython.rentyourcio.com/api/v1/figures?limit=3 via request context
//   2. Assert 200, extract english_name of first figure ("Aphrodite")
//   3. Navigate to /bwtl
//   4. Navigate to Library section and Figures tab
//   5. Assert "Aphrodite" appears in the Figures grid
//
// Expected result at Checkpoint 1: FAIL on step 5
//   library.jsx reads Object.values(window.BWTL.FIGURES) — always empty {}.
//   bwtl-api.js defines FIGURES = {} static stub; no fetchFigures() auto-call.
//   The Figures grid renders empty → "Aphrodite" never in DOM.
//   This test is the E2E proof of the cross-app FIGURES wiring gap.

const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P024 — EM Figures cross-app: figure name appears in Library Figures grid', () => {
  test('Aphrodite from EM API appears in Library Figures tab', async ({ page, request }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    // Step 1: Verify the EM figures endpoint returns data
    const apiResp = await request.get(
      `${KNOWN.emBaseUrl}/api/v1/figures?limit=3`
    );
    expect(apiResp.ok(), 'EM /api/v1/figures should return 200').toBe(true);

    const figures = await apiResp.json();
    expect(Array.isArray(figures), 'EM figures response should be an array').toBe(true);
    expect(figures.length, 'EM figures array should have at least 1 item').toBeGreaterThan(0);

    const firstFigure = figures[0];
    expect(firstFigure.english_name, 'First figure english_name should be "Aphrodite"')
      .toBe(KNOWN.emFigureEnglishName);

    // Step 2: Navigate to the SPA
    await page.goto('/bwtl', { waitUntil: 'networkidle' });

    // Step 3: Assert no JS errors
    expect(consoleErrors, 'No JS console errors on page load').toEqual([]);
    expect(pageErrors, 'No uncaught JS page errors').toEqual([]);

    // Step 4: Navigate to Library section
    // Look for a "Library" nav item/button and click it
    const libraryNav = page.locator('button, a, [role="tab"]').filter({ hasText: /library/i }).first();
    await expect(libraryNav).toBeVisible({ timeout: 5000 });
    await libraryNav.click();

    // Step 5: Navigate to Figures tab within Library
    const figuresTab = page.locator('button, [role="tab"]').filter({ hasText: /figures/i }).first();
    await expect(figuresTab).toBeVisible({ timeout: 3000 });
    await figuresTab.click();

    // Step 6: Assert EM figure name appears in the Figures grid
    // After fix: BWTL.FIGURES must be populated from EM API on mount.
    // Until fix: grid is empty → "Aphrodite" not in DOM → FAIL.
    const figureInDom = page.locator('text=Aphrodite').first();
    await expect(figureInDom).toBeVisible({ timeout: 5000 });
  });
});
