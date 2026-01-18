import { test, expect } from '@playwright/test';

/**
 * Evidence Management Page E2E Tests
 * Tests for the evidence/Gov ZIP management page (/dashboard/evidence)
 */
test.describe('Evidence Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/evidence');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the evidence page successfully', async ({ page }) => {
    // Page heading should be visible (증빙 레지스트리)
    const heading = page.getByRole('heading', { name: /증빙 레지스트리/i, level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    // Description about Gov ZIP should be visible (in info banner)
    const description = page.locator('text=변조 탐지 가능').first();
    await expect(description).toBeVisible();
  });

  test('should display create snapshot button', async ({ page }) => {
    // Create snapshot button should be visible
    const createButton = page.getByRole('button', { name: /새 스냅샷 생성/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should display MANIFEST info banner', async ({ page }) => {
    // MANIFEST v1.2 info banner should be visible
    const manifestInfo = page.locator('text=MANIFEST v1.2').first();
    await expect(manifestInfo).toBeVisible();
  });

  test('should display evidence list heading', async ({ page }) => {
    // Evidence list heading should be visible
    const listHeading = page.getByRole('heading', { name: /증빙 기록 목록/i, level: 2 });
    await expect(listHeading).toBeVisible();
  });

  test('should display table or empty state', async ({ page }) => {
    // Either table with data exists or empty state message is shown
    const table = page.locator('table').first();
    const emptyState = page.locator('text=아직 증빙 기록이 없습니다');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should display brand footer', async ({ page }) => {
    // Brand footer tagline should be visible
    const brandTagline = page.locator('text=in·ev·it·able — Data Flows. Evidence Follows.');
    await expect(brandTagline).toBeVisible();
  });
});
