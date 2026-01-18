import { test, expect } from '@playwright/test';

/**
 * Tender Management Page E2E Tests
 * Tests for the bid/tender management page (/dashboard/tender)
 */
test.describe('Tender Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tender');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the tender page successfully', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /입찰 관리/i, level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    const description = page.locator('p').filter({ hasText: '글로벌 입찰 공고 수집 및 분석' }).first();
    await expect(description).toBeVisible();
  });

  test('should display collect button', async ({ page }) => {
    const collectButton = page.getByRole('button', { name: /수집/i }).first();
    await expect(collectButton).toBeVisible();
  });

  test('should display generate document button', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /문서 생성/i }).first();
    await expect(generateButton).toBeVisible();
  });

  test('should display source filter tabs', async ({ page }) => {
    const allFilter = page.getByRole('button', { name: /전체/i }).first();
    await expect(allFilter).toBeVisible();

    const g2bFilter = page.getByRole('button', { name: /나라장터/i }).first();
    await expect(g2bFilter).toBeVisible();
  });

  test('should display bid cards or empty state', async ({ page }) => {
    // Either bid cards exist or empty state message is shown
    const bidCards = page.locator('[class*="rounded-xl"][class*="shadow"]');
    const emptyState = page.locator('text=해당 소스의 입찰 공고가 없습니다');

    const hasBidCards = await bidCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasBidCards || hasEmptyState).toBeTruthy();
  });

  test('should display brand footer', async ({ page }) => {
    const brandTagline = page.locator('text=in·ev·it·able — Data Flows. Evidence Follows.');
    await expect(brandTagline).toBeVisible();
  });
});
