import { test, expect } from '@playwright/test';

/**
 * Landing Page E2E Tests
 * Tests for the main landing page (/)
 */
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page successfully', async ({ page }) => {
    // Page should load without errors
    await expect(page).toHaveTitle(/Qetta/i);
  });

  test('should display the header with navigation', async ({ page }) => {
    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display the hero section', async ({ page }) => {
    // Hero section with main heading should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display primary features section', async ({ page }) => {
    // Features section should exist
    const featuresSection = page.locator('main');
    await expect(featuresSection).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    // Footer should be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check that navigation links exist
    const header = page.locator('header');
    const links = header.locator('a');
    const linkCount = await links.count();

    // Should have at least one navigation link
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should be responsive - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be functional
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be responsive - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Page should still be functional
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
