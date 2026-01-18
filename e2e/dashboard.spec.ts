import { test, expect } from '@playwright/test';

/**
 * Dashboard Page E2E Tests
 * Tests for the main dashboard page (/dashboard)
 */
test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the dashboard page successfully', async ({ page }) => {
    // Dashboard heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('대시보드');
  });

  test('should display stats cards', async ({ page }) => {
    // Stats cards should be visible (증빙 패키지, 입찰 공고, AI 예측, 최근 활동)
    const statsSection = page.locator('.grid');
    await expect(statsSection.first()).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    // Recent activity heading (h2) should be visible
    const activityHeading = page.getByRole('heading', { name: '최근 활동' });
    await expect(activityHeading).toBeVisible();
  });

  test('should display 3-Tier Intelligence summary', async ({ page }) => {
    // Intelligence summary should be visible
    const intelligenceHeading = page.getByRole('heading', { name: '3-Tier Intelligence' });
    await expect(intelligenceHeading).toBeVisible();
  });

  test('should display quick actions section', async ({ page }) => {
    // Quick actions section should be visible
    const quickActionsHeading = page.getByRole('heading', { name: '빠른 작업' });
    await expect(quickActionsHeading).toBeVisible();
  });

  test('should have navigation links to other dashboard pages', async ({ page }) => {
    // Check for links to evidence page
    const evidenceLink = page.locator('a[href="/dashboard/evidence"]');
    await expect(evidenceLink.first()).toBeVisible();

    // Check for links to tender page
    const tenderLink = page.locator('a[href="/dashboard/tender"]');
    await expect(tenderLink.first()).toBeVisible();
  });

  test('should display brand footer', async ({ page }) => {
    // Brand footer tagline should be visible
    const brandTagline = page.locator('text=in·ev·it·able — Data Flows. Evidence Follows.');
    await expect(brandTagline).toBeVisible();
  });
});
