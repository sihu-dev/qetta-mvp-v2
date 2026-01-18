import { test, expect } from '@playwright/test';

/**
 * AGI Insights Page E2E Tests
 * Tests for the 3-Tier Intelligence page (/dashboard/agi)
 */
test.describe('AGI Insights Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/agi');
  });

  test('should load the AGI page successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Page heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('3-Tier Intelligence');
  });

  test('should display page description', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Description text should be visible
    const description = page.getByText('AGI 인사이트 분석 결과');
    await expect(description).toBeVisible();
  });

  test('should display analyze button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Analyze button should be visible
    const analyzeButton = page.getByRole('button', { name: /새 분석 실행/i });
    await expect(analyzeButton).toBeVisible();
  });

  test('should display tier summary cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Tier 1: Rule-based card should be visible
    const tier1 = page.getByText('Tier 1:', { exact: false });
    await expect(tier1).toBeVisible();

    // Tier 2: ML card should be visible
    const tier2 = page.getByText('Tier 2:', { exact: false });
    await expect(tier2).toBeVisible();

    // Tier 3: Claude API card should be visible
    const tier3 = page.getByText('Tier 3:', { exact: false });
    await expect(tier3).toBeVisible();
  });

  test('should display tier percentages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 95% for rule-based should be visible
    const rulePercent = page.getByText('95%').first();
    await expect(rulePercent).toBeVisible();

    // 4% for ML should be visible
    const mlPercent = page.getByText('4%').first();
    await expect(mlPercent).toBeVisible();

    // 1% for Claude should be visible
    const claudePercent = page.getByText('1%').first();
    await expect(claudePercent).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Filter tabs should be visible
    const allTab = page.getByRole('button', { name: /전체/i });
    await expect(allTab).toBeVisible();

    const anomalyTab = page.getByRole('button', { name: /이상 탐지/i });
    await expect(anomalyTab).toBeVisible();

    const predictionTab = page.getByRole('button', { name: /예측/i });
    await expect(predictionTab).toBeVisible();

    const recommendationTab = page.getByRole('button', { name: /추천/i });
    await expect(recommendationTab).toBeVisible();
  });

  test('should display insight cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Insight cards should be visible
    const insightCards = page.locator('.rounded-xl.shadow-sm.border');
    const cardCount = await insightCards.count();

    // Should have at least one insight card
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should display confidence scores on insight cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Confidence label should be visible
    const confidenceLabel = page.getByText('신뢰도:').first();
    await expect(confidenceLabel).toBeVisible();
  });

  test('should display tier badges on insight cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Tier badges (Rule, ML, Claude) should be visible
    const ruleBadge = page.getByText('Rule', { exact: true });
    const mlBadge = page.getByText('ML', { exact: true });
    const claudeBadge = page.getByText('Claude', { exact: true });

    // At least one tier badge should be visible
    const isRuleVisible = await ruleBadge.first().isVisible().catch(() => false);
    const isMLVisible = await mlBadge.first().isVisible().catch(() => false);
    const isClaudeVisible = await claudeBadge.first().isVisible().catch(() => false);

    expect(isRuleVisible || isMLVisible || isClaudeVisible).toBeTruthy();
  });

  test('should filter insights when clicking tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on anomaly tab
    const anomalyTab = page.getByRole('button', { name: /이상 탐지/i });
    await anomalyTab.click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Tab should be active (has different styling)
    await expect(anomalyTab).toHaveClass(/text-purple-600/);
  });

  test('should handle analyze button click', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click analyze button
    const analyzeButton = page.getByRole('button', { name: /새 분석 실행/i });
    await analyzeButton.click();

    // Button should show loading state
    const loadingButton = page.getByRole('button', { name: /분석 중/i });
    await expect(loadingButton).toBeVisible();
  });

  test('should display brand footer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Brand footer tagline should be visible (exact match to avoid title tag)
    const brandTagline = page.getByText('Data Flows. Evidence Follows.', { exact: true }).first();
    await expect(brandTagline).toBeVisible();
  });

  test('should display circular progress indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // SVG circles for confidence visualization should exist
    const svgCircles = page.locator('svg circle');
    const circleCount = await svgCircles.count();

    // Should have circles for confidence indicators
    expect(circleCount).toBeGreaterThan(0);
  });
});
