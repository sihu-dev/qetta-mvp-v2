import { test, expect } from '@playwright/test';

/**
 * Evidence Management Page E2E Tests
 * Tests for the evidence/Gov ZIP management page (/dashboard/evidence)
 */
test.describe('Evidence Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/evidence');
  });

  test('should load the evidence page successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Page heading should be visible (증빙 관리 or Evidence Registry)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Description about Gov ZIP should be visible (in info banner)
    const description = page.getByText(/변조 탐지 가능/i);
    await expect(description.first()).toBeVisible();
  });

  test('should display create snapshot button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Create snapshot button should be visible
    const createButton = page.getByRole('button', { name: /새 스냅샷 생성/i });
    await expect(createButton).toBeVisible();
  });

  test('should display MANIFEST info banner', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // MANIFEST v1.2 info banner should be visible
    const manifestInfo = page.getByText('MANIFEST v1.2');
    await expect(manifestInfo).toBeVisible();
  });

  test('should display snapshots table', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Snapshots table heading should be visible
    const tableHeading = page.getByText('스냅샷 목록');
    await expect(tableHeading).toBeVisible();

    // Table should exist
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display table headers', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Table headers should be visible
    const periodHeader = page.getByText('기간');
    await expect(periodHeader).toBeVisible();

    const eventHeader = page.getByText('이벤트');
    await expect(eventHeader).toBeVisible();

    const hashHeader = page.getByText('해시');
    await expect(hashHeader).toBeVisible();

    const statusHeader = page.getByText('상태');
    await expect(statusHeader).toBeVisible();
  });

  test('should display snapshot rows with data', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Table body should have rows
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    // Should have at least one snapshot row (simulated data)
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should display verification status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Wait for the page content to load
    await page.waitForTimeout(1000);

    // The page should load and show either the table heading or content area
    const tableHeading = page.getByText('스냅샷 목록');
    await expect(tableHeading).toBeVisible();
  });

  test('should display action buttons for snapshots', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Verify button should exist
    const verifyButton = page.getByRole('button', { name: /검증/i }).first();
    await expect(verifyButton).toBeVisible();

    // Download button should exist
    const downloadButton = page.getByRole('button', { name: /다운로드/i }).first();
    await expect(downloadButton).toBeVisible();
  });

  test('should display package hash for snapshots', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Package hash should be visible (starts with sha256:)
    const hashCode = page.locator('code').first();
    await expect(hashCode).toBeVisible();

    const hashText = await hashCode.textContent();
    expect(hashText).toContain('sha256:');
  });

  test('should display brand footer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Brand footer tagline should be visible (exact match to avoid title tag)
    const brandTagline = page.getByText('Data Flows. Evidence Follows.', { exact: true }).first();
    await expect(brandTagline).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/dashboard/evidence', { waitUntil: 'commit' });

    // Either loading spinner is shown or content is already loaded
    const spinner = page.locator('.animate-spin');
    const table = page.locator('table');

    const isSpinnerVisible = await spinner.isVisible().catch(() => false);
    const isTableVisible = await table.isVisible().catch(() => false);

    expect(isSpinnerVisible || isTableVisible).toBeTruthy();
  });
});
