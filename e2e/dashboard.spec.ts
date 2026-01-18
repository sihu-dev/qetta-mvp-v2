import { test, expect } from '@playwright/test';

/**
 * Dashboard Page E2E Tests
 * Tests for the main dashboard page (/dashboard)
 */
test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should load the dashboard page successfully', async ({ page }) => {
    // Wait for the page to be ready (loading state to finish)
    await page.waitForLoadState('networkidle');

    // Dashboard heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('대시보드');
  });

  test('should display stats cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Stats cards should be visible (총 이벤트, 조치 사항, 증빙 스냅샷, 입찰 공고)
    const statsSection = page.locator('.grid');
    await expect(statsSection.first()).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Recent activity heading should be visible
    const activityHeading = page.getByText('최근 활동');
    await expect(activityHeading).toBeVisible();
  });

  test('should display 3-Tier Intelligence summary', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Intelligence summary should be visible
    const intelligenceHeading = page.getByText('3-Tier Intelligence').first();
    await expect(intelligenceHeading).toBeVisible();
  });

  test('should display quick actions section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Quick actions section should be visible
    const quickActionsHeading = page.getByText('빠른 작업');
    await expect(quickActionsHeading).toBeVisible();
  });

  test('should have navigation links to other dashboard pages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for links to evidence page
    const evidenceLink = page.locator('a[href="/dashboard/evidence"]');
    await expect(evidenceLink.first()).toBeVisible();

    // Check for links to tender page
    const tenderLink = page.locator('a[href="/dashboard/tender"]');
    await expect(tenderLink.first()).toBeVisible();
  });

  test('should display brand footer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Brand footer tagline should be visible (exact match to avoid title tag)
    const brandTagline = page.getByText('Data Flows. Evidence Follows.', { exact: true }).first();
    await expect(brandTagline).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/dashboard', { waitUntil: 'commit' });

    // Either loading spinner is shown or content is already loaded
    const spinner = page.locator('.animate-spin');
    const heading = page.locator('h1');

    // One of these should be visible
    const isSpinnerVisible = await spinner.isVisible().catch(() => false);
    const isHeadingVisible = await heading.isVisible().catch(() => false);

    expect(isSpinnerVisible || isHeadingVisible).toBeTruthy();
  });
});
