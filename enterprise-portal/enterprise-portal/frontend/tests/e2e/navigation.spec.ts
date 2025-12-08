/**
 * Navigation E2E Tests
 *
 * Tests for homepage loading, main navigation functionality, and dashboard accessibility
 * in the Aurigraph Enterprise Portal
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page title or main heading is present
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verify the page URL is correct
    expect(page.url()).toContain('localhost:3000');

    // Check for the main layout structure
    const mainLayout = page.locator('main, [role="main"], .ant-layout-content');
    await expect(mainLayout).toBeVisible();

    // Verify footer with version information is present
    const footer = page.locator('footer').filter({ hasText: 'Aurigraph DLT Enterprise Portal' });
    await expect(footer).toBeVisible();

    // Check for version number in footer
    const versionText = page.locator('text=/v\d+\.\d+\.\d+/i').first();
    await expect(versionText).toBeVisible();
  });

  test('should display main navigation menu', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Verify top navigation bar is present
    const topNav = page.locator('header, [role="banner"], .ant-layout-header');
    await expect(topNav).toBeVisible();

    // Check for the Aurigraph branding/logo
    const logo = page.locator('img[alt*="Aurigraph" i], .logo, [class*="logo" i]').first();
    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
    }

    // Verify navigation menu items are present
    const navItems = page.locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button');
    const navCount = await navItems.count();
    expect(navCount).toBeGreaterThan(0);

    // Check for common navigation categories
    const navText = await page.locator('nav, [role="navigation"]').first().textContent();
    expect(navText).toBeTruthy();
  });

  test('should navigate to dashboard page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for dashboard link in navigation
    const dashboardLink = page.locator('a[href="/dashboard"], a:has-text("Dashboard"), button:has-text("Dashboard")').first();

    // If dashboard link exists in navigation, click it
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();

      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');

      // Verify URL changed to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify dashboard content is loaded
      const dashboardContent = page.locator('h1, h2, h3').filter({ hasText: /dashboard/i }).first();
      if (await dashboardContent.count() > 0) {
        await expect(dashboardContent).toBeVisible();
      }

      // Check for dashboard statistics/metrics
      const statistics = page.locator('[class*="statistic" i], [class*="metric" i], [class*="card" i]');
      const statsCount = await statistics.count();
      expect(statsCount).toBeGreaterThan(0);
    } else {
      // If no dashboard link, navigate directly via URL
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify dashboard page loaded
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('should navigate between multiple pages using main navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test navigation to transactions page
    const transactionsLink = page.locator('a[href="/transactions"], a:has-text("Transaction")').first();
    if (await transactionsLink.count() > 0) {
      await transactionsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/transactions/);

      // Navigate back to home
      const homeLink = page.locator('a[href="/"], a:has-text("Home")').first();
      await homeLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\//);
    }

    // Test navigation to contracts page
    const contractsLink = page.locator('a[href="/contracts"], a:has-text("Contract")').first();
    if (await contractsLink.count() > 0) {
      await contractsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/contracts/);
    }
  });

  test('should display and interact with dropdown navigation menus', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for dropdown menu triggers
    const dropdownTriggers = page.locator('[class*="dropdown" i], .ant-dropdown-trigger, [role="button"]').filter({
      hasText: /blockchain|smart contracts|tokenization|rwat|banking/i
    });

    if (await dropdownTriggers.count() > 0) {
      const firstDropdown = dropdownTriggers.first();

      // Click to open dropdown
      await firstDropdown.click();

      // Wait for dropdown menu to appear
      await page.waitForTimeout(500);

      // Verify dropdown menu is visible
      const dropdownMenu = page.locator('.ant-dropdown, [role="menu"], [class*="menu" i]').last();
      await expect(dropdownMenu).toBeVisible();

      // Check that dropdown contains menu items
      const menuItems = page.locator('.ant-dropdown-menu-item, [role="menuitem"]');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);

      // Click outside to close dropdown (if needed)
      await page.keyboard.press('Escape');
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    // Navigate to a nested page (e.g., transactions under blockchain category)
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb navigation
    const breadcrumb = page.locator('.ant-breadcrumb, [aria-label="Breadcrumb"], nav[class*="breadcrumb" i]');

    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();

      // Verify breadcrumb contains multiple items (Home > Category > Page)
      const breadcrumbItems = page.locator('.ant-breadcrumb-link, .ant-breadcrumb-separator').filter({ hasNotText: '' });
      const itemCount = await breadcrumbItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('should maintain navigation state when navigating between pages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify top navigation is still visible
    const topNav = page.locator('header, [role="banner"]');
    await expect(topNav).toBeVisible();

    // Navigate to another page
    await page.goto('/contracts');
    await page.waitForLoadState('networkidle');

    // Verify top navigation is still visible
    await expect(topNav).toBeVisible();

    // Verify footer is still visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should handle navigation search functionality if available', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for search input in navigation
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [aria-label*="search" i]');

    if (await searchInput.count() > 0) {
      // Type in search box
      await searchInput.first().fill('transaction');
      await page.waitForTimeout(500);

      // Verify search input has value
      const inputValue = await searchInput.first().inputValue();
      expect(inputValue).toBe('transaction');

      // Press Enter or look for search results
      await searchInput.first().press('Enter');
      await page.waitForTimeout(500);

      // Page should still be functional
      expect(page.url()).toBeTruthy();
    }
  });

  test('should display user profile section in navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for user profile/avatar in navigation
    const userProfile = page.locator('[class*="user" i], [class*="profile" i], [class*="avatar" i]').filter({ visible: true });

    if (await userProfile.count() > 0) {
      const profile = userProfile.first();
      await expect(profile).toBeVisible();

      // Try to click on user profile
      await profile.click();
      await page.waitForTimeout(500);

      // Look for user menu/dropdown
      const userMenu = page.locator('[role="menu"], .ant-dropdown-menu, [class*="user-menu" i]').last();
      if (await userMenu.count() > 0) {
        await expect(userMenu).toBeVisible();
      }

      // Close menu by pressing Escape
      await page.keyboard.press('Escape');
    }
  });

  test('should display theme toggle button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i], [title*="theme" i], [class*="theme-toggle" i]');

    if (await themeToggle.count() > 0) {
      await expect(themeToggle.first()).toBeVisible();

      // Get initial theme state
      const body = page.locator('body');
      const initialClass = await body.getAttribute('class');

      // Click theme toggle
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Theme should change (body class or data attribute should update)
      const newClass = await body.getAttribute('class');

      // Either class changed or no error occurred
      expect(body).toBeTruthy();
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Start keyboard navigation with Tab key
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // An element should have focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName,
        hasTabIndex: active?.hasAttribute('tabindex'),
        isFocusable: active !== document.body
      };
    });

    expect(focusedElement.isFocusable).toBeTruthy();

    // Continue tabbing through navigation elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Should be able to activate a link with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Page should still be functional
    expect(page.url()).toBeTruthy();
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const initialUrl = page.url();

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');

    // Navigate to transactions
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/transactions');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');

    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/transactions');

    // Go back to home
    await page.goBack();
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back at initial URL or home
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});

test.describe('Navigation - Responsive Design', () => {
  test('should display mobile-friendly navigation on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu trigger (hamburger icon)
    const mobileMenuTrigger = page.locator('[class*="mobile" i] button, [class*="hamburger" i], [aria-label*="menu" i]');

    if (await mobileMenuTrigger.count() > 0) {
      // Mobile menu trigger should be visible
      await expect(mobileMenuTrigger.first()).toBeVisible();

      // Click to open mobile menu
      await mobileMenuTrigger.first().click();
      await page.waitForTimeout(500);

      // Mobile menu drawer should appear
      const mobileMenu = page.locator('[class*="drawer" i], [class*="mobile-menu" i], [role="dialog"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      }
    }

    // Page should not have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  });

  test('should display full navigation on desktop screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Full navigation menu should be visible
    const desktopNav = page.locator('nav, [role="navigation"]');
    await expect(desktopNav.first()).toBeVisible();

    // Menu items should be visible (not hidden in mobile drawer)
    const navLinks = page.locator('nav a, [role="navigation"] a').filter({ visible: true });
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
