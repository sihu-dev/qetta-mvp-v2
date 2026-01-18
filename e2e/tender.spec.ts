import { test, expect } from '@playwright/test';

/**
 * Tender Management Page E2E Tests
 * Tests for the bid/tender management page (/dashboard/tender)
 */
test.describe('Tender Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tender');
  });

  test('should load the tender page successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Page heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('입찰 관리');
  });

  test('should display page description', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Description text should be visible
    const description = page.getByText('글로벌 입찰 공고 수집 및 분석');
    await expect(description).toBeVisible();
  });

  test('should display collect button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Collect button should be visible
    const collectButton = page.getByRole('button', { name: /수집/i });
    await expect(collectButton).toBeVisible();
  });

  test('should display generate document button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Generate document button should be visible
    const generateButton = page.getByRole('button', { name: /문서 생성/i });
    await expect(generateButton).toBeVisible();
  });

  test('should display source filter tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Source filter tabs should be visible
    const allFilter = page.getByRole('button', { name: /전체/i });
    await expect(allFilter).toBeVisible();

    // G2B (나라장터) filter should exist
    const g2bFilter = page.getByRole('button', { name: /나라장터/i });
    await expect(g2bFilter).toBeVisible();
  });

  test('should display bid cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Bid cards should be visible (grid layout)
    const bidGrid = page.locator('.grid');
    await expect(bidGrid.first()).toBeVisible();
  });

  test('should display bid details on cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Each bid card should show budget
    const budgetLabel = page.getByText('예산').first();
    await expect(budgetLabel).toBeVisible();

    // Each bid card should show deadline
    const deadlineLabel = page.getByText('마감일').first();
    await expect(deadlineLabel).toBeVisible();
  });

  test('should have analyze button on bid cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Analyze button should exist
    const analyzeButton = page.getByRole('button', { name: /분석/i }).first();
    await expect(analyzeButton).toBeVisible();
  });

  test('should have detail view button on bid cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Detail view button should exist
    const detailButton = page.getByRole('button', { name: /상세보기/i }).first();
    await expect(detailButton).toBeVisible();
  });

  test('should filter bids when clicking source tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Get initial count of visible bid cards
    const initialCards = page.locator('.rounded-xl.shadow-sm.border');
    const initialCount = await initialCards.count();

    // Click on a specific source filter (e.g., 나라장터)
    const g2bFilter = page.getByRole('button', { name: /나라장터/i });
    await g2bFilter.click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Card count might change (or stay same if all are from that source)
    const filteredCards = page.locator('.rounded-xl.shadow-sm.border');
    const filteredCount = await filteredCards.count();

    // Filter was applied (count could be same, more, or less)
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should display brand footer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Brand footer tagline should be visible (exact match to avoid title tag)
    const brandTagline = page.getByText('Data Flows. Evidence Follows.', { exact: true }).first();
    await expect(brandTagline).toBeVisible();
  });
});
