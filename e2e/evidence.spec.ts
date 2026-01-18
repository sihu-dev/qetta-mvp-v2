import { test, expect } from '@playwright/test';

/**
 * Evidence Management Page E2E Tests
 * Tests for the evidence/Gov ZIP management page (/dashboard/evidence)
 */
test.describe('Evidence Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/evidence');
    await page.waitForLoadState('networkidle');
    // Wait for the page heading to appear (indicates page is fully loaded)
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('should load the evidence page successfully', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /증빙 레지스트리/i, level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    // Description about Gov ZIP should be visible (in info banner)
    const infoBanner = page.locator('text=tamper-evident');
    await expect(infoBanner).toBeVisible();
  });

  test('should display create snapshot button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /새 스냅샷 생성/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should display MANIFEST info banner', async ({ page }) => {
    const manifestText = page.locator('text=MANIFEST v1.2');
    await expect(manifestText).toBeVisible();
  });

  test('should display evidence list heading', async ({ page }) => {
    const listHeading = page.getByRole('heading', { name: /증빙 기록 목록/i, level: 2 });
    await expect(listHeading).toBeVisible();
  });

  test('should display table or empty state', async ({ page }) => {
    const table = page.locator('table').first();
    const emptyState = page.locator('text=아직 증빙 기록이 없습니다');

    // Either table or empty state should be visible
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('should display brand footer', async ({ page }) => {
    // Match brand tagline in footer (not in title)
    const brandFooter = page.locator('div.text-center p', { hasText: 'Data Flows. Evidence Follows.' });
    await expect(brandFooter).toBeVisible();
  });
});
