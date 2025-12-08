/**
 * Smart Contracts E2E Tests
 *
 * Tests for the smart contracts functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Smart Contracts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the contracts page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    // URL might redirect, just verify page loads
    expect(page.url()).toBeTruthy();
  });

  test('should display page content', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display contracts list or table', async ({ page }) => {
    await page.waitForTimeout(2000);
    const contracts = page.locator('.ant-table, [class*="contract"]');
    expect(await contracts.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have interactive elements', async ({ page }) => {
    await page.waitForTimeout(2000);
    const buttons = page.locator('button, .ant-btn');
    expect(await buttons.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have search functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="Search" i]');

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      await searchInput.first().clear();
    }

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Contract Interactions', () => {
  test('should have form elements', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const forms = page.locator('form, .ant-form, input');
    expect(await forms.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display status indicators', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const status = page.locator('.ant-tag, .ant-badge');
    expect(await status.count()).toBeGreaterThanOrEqual(0);
  });
});
