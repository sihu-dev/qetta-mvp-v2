import { test, expect } from '@playwright/test';

/**
 * AGI Insights Page E2E Tests
 * Tests for the 3-Tier Intelligence page (/dashboard/agi)
 */
test.describe('AGI Insights Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/agi');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the AGI page successfully', async ({ page }) => {
    // Page heading should be visible
    const heading = page.getByRole('heading', { name: /3-Tier Intelligence/i, level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    // Description text should be visible
    const description = page.locator('p').filter({ hasText: 'AGI 인사이트 분석 결과' }).first();
    await expect(description).toBeVisible();
  });

  test('should display tier summary cards', async ({ page }) => {
    // Tier 1: Rule-based card should be visible
    const tier1 = page.locator('text=Tier 1:').first();
    await expect(tier1).toBeVisible();

    // Tier 2: ML card should be visible
    const tier2 = page.locator('text=Tier 2:').first();
    await expect(tier2).toBeVisible();

    // Tier 3: Claude API card should be visible
    const tier3 = page.locator('text=Tier 3:').first();
    await expect(tier3).toBeVisible();
  });

  test('should display tier percentages', async ({ page }) => {
    // 95% for rule-based should be visible
    const rulePercent = page.locator('text=95%').first();
    await expect(rulePercent).toBeVisible();

    // 4% for ML should be visible
    const mlPercent = page.locator('text=4%').first();
    await expect(mlPercent).toBeVisible();

    // 1% for Claude should be visible
    const claudePercent = page.locator('text=1%').first();
    await expect(claudePercent).toBeVisible();
  });

  test('should display quick prediction buttons', async ({ page }) => {
    // Quick prediction buttons should be visible
    const qualityButton = page.getByRole('button', { name: /품질 예측/i }).first();
    await expect(qualityButton).toBeVisible();

    const maintenanceButton = page.getByRole('button', { name: /정비 예측/i }).first();
    await expect(maintenanceButton).toBeVisible();

    const anomalyButton = page.getByRole('button', { name: /이상 탐지/i }).first();
    await expect(anomalyButton).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    // Filter tabs should be visible (use exact match to avoid partial matches)
    const allTab = page.getByRole('button', { name: '전체', exact: true });
    await expect(allTab).toBeVisible();

    const qualityTab = page.getByRole('button', { name: '품질', exact: true });
    await expect(qualityTab).toBeVisible();

    const maintenanceTab = page.getByRole('button', { name: '정비', exact: true });
    await expect(maintenanceTab).toBeVisible();
  });

  test('should display AI inference section', async ({ page }) => {
    // AI inference heading should be visible
    const inferenceHeading = page.getByRole('heading', { name: /AI 추론/i, level: 3 });
    await expect(inferenceHeading).toBeVisible();

    // Text input should be visible
    const textInput = page.getByPlaceholder(/질문을 입력하세요/i);
    await expect(textInput).toBeVisible();

    // Inference button should be visible
    const inferenceButton = page.getByRole('button', { name: /추론/i });
    await expect(inferenceButton).toBeVisible();
  });

  test('should display prediction results or empty state', async ({ page }) => {
    // Either prediction cards exist or empty state message is shown
    const predictionCards = page.locator('[class*="rounded-xl"][class*="shadow"]');
    const emptyState = page.locator('text=아직 예측 결과가 없습니다');

    const hasCards = await predictionCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test('should display brand footer', async ({ page }) => {
    // Brand footer tagline should be visible
    const brandTagline = page.locator('text=in·ev·it·able — Data Flows. Evidence Follows.');
    await expect(brandTagline).toBeVisible();
  });
});
