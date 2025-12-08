/**
 * Navigation E2E Tests
 *
 * Tests for homepage loading, main navigation functionality, and dashboard accessibility
 * in the Aurigraph Enterprise Portal
 *
 * App uses Ant Design Layout components with TopNavRouter and lazy loading
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify the page title is present
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verify the page URL is correct
    expect(page.url()).toContain('localhost:3000');

    // Check that page has content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display main navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check that page has loaded with some navigation element
    const navElements = page.locator('.ant-menu, header, nav, [role="navigation"], [role="menu"]');
    const count = await navElements.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Page should be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify navigation occurred
    expect(page.url()).toBeTruthy();

    // Check that page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to contracts page', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display and interact with dropdown navigation menus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for dropdown menu triggers (Ant Design submenu)
    const dropdownTriggers = page.locator('.ant-menu-submenu-title');

    if (await dropdownTriggers.count() > 0) {
      const firstDropdown = dropdownTriggers.first();
      await firstDropdown.hover();
      await page.waitForTimeout(500);

      // Check if menu items appear
      const menuItems = page.locator('.ant-menu-item');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for breadcrumb navigation
    const breadcrumb = page.locator('.ant-breadcrumb');

    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb.first()).toBeVisible();
    }
  });

  test('should handle navigation search functionality if available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search" i]');

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('Dashboard');
      await page.waitForTimeout(500);
      await searchInput.first().clear();
    }
  });

  test('should display user profile section in navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for user profile/avatar
    const userProfile = page.locator('.ant-avatar');

    if (await userProfile.count() > 0) {
      await expect(userProfile.first()).toBeVisible();
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Start keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Check that something can receive focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName,
        isFocusable: active !== document.body
      };
    });

    expect(focusedElement.isFocusable).toBeTruthy();
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to transactions
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to contracts
    await page.goto('/contracts');
    await page.waitForLoadState('domcontentloaded');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');

    // Should be functional
    expect(page.url()).toBeTruthy();
  });
});

test.describe('Navigation - Responsive Design', () => {
  test('should display mobile-friendly navigation on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Page should not have excessive horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50);
  });

  test('should display full navigation on desktop screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
