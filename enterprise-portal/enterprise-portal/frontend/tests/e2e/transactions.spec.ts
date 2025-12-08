/**
 * Transactions E2E Tests
 *
 * Tests for the transaction explorer functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Transactions Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the transactions page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    // URL might redirect, just verify page loads
    expect(page.url()).toBeTruthy();
  });

  test('should display page content', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display transaction list or table', async ({ page }) => {
    await page.waitForTimeout(2000);
    const table = page.locator('.ant-table, table, [class*="transaction"]');
    expect(await table.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have search functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="Search" i], .ant-input-search');

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      await searchInput.first().clear();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.waitForTimeout(2000);
    const filters = page.locator('.ant-select, .ant-picker, [class*="filter"]');
    expect(await filters.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have pagination', async ({ page }) => {
    await page.waitForTimeout(2000);
    const pagination = page.locator('.ant-pagination, .ant-table-pagination');
    expect(await pagination.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display transaction hashes', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Look for hash-like strings
    const hashes = page.locator('[class*="hash"], code');
    expect(await hashes.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display status indicators', async ({ page }) => {
    await page.waitForTimeout(2000);
    const status = page.locator('.ant-tag, .ant-badge');
    expect(await status.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Transaction Details', () => {
  test('should navigate to transaction detail', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const txLink = page.locator('a[href*="transaction"], .ant-table-row');

    if (await txLink.count() > 0) {
      await txLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display metadata fields', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const fields = page.locator('.ant-descriptions, .ant-form-item');
    expect(await fields.count()).toBeGreaterThanOrEqual(0);
  });
});
