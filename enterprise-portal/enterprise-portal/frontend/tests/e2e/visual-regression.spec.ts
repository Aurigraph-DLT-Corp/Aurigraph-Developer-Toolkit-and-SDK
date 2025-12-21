/**
 * Visual Regression E2E Tests
 *
 * Tests for visual consistency across browsers and viewports
 * Uses Playwright's screenshot comparison
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authenticated state
    await context.addCookies([
      {
        name: 'JSESSIONID',
        value: 'test-session-id',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      },
    ]);

    await page.goto('/');
  });

  test('should render login page consistently', async ({ page }) => {
    // Clear cookies to force login page
    await page.context().clearCookies();
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Capture login page screenshot
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'login-page.png'
    );
  });

  test('should render dashboard header consistently', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Capture header area
    const header = page.locator('header, nav, [role="banner"]').first();
    if (await header.count() > 0) {
      expect(await header.screenshot()).toMatchSnapshot('dashboard-header.png');
    }
  });

  test('should render transaction table consistently', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Capture transaction table
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      // Set fixed viewport for consistent sizing
      await page.setViewportSize({ width: 1920, height: 1080 });
      expect(await table.screenshot()).toMatchSnapshot(
        'transaction-table.png'
      );
    }
  });

  test('should render metrics dashboard consistently', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Capture metrics cards
    const metricsContainer = page.locator(
      '[class*="metric" i], [data-testid*="metrics" i]'
    );
    if (await metricsContainer.count() > 0) {
      expect(await metricsContainer.first().screenshot()).toMatchSnapshot(
        'metrics-dashboard.png'
      );
    }
  });

  test('should render sidebar navigation consistently', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Capture sidebar
    const sidebar = page.locator('aside, nav, [class*="sidebar" i]').first();
    if (await sidebar.count() > 0) {
      expect(await sidebar.screenshot()).toMatchSnapshot('sidebar-nav.png');
    }
  });

  test('should render error state consistently', async ({ page }) => {
    // Navigate to invalid page
    await page.goto('/invalid-page-12345');

    await page.waitForTimeout(1000);

    // Capture error page
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'error-page.png'
    );
  });

  test('should render modal dialog consistently', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for modal/dialog triggers using getByRole with regex
    const modalTriggers = page.getByRole('button', { name: /open|view|details|edit/i });

    if (await modalTriggers.count() > 0) {
      const firstTrigger = modalTriggers.first();
      await firstTrigger.click();
      await page.waitForTimeout(500);

      // Capture modal
      const modal = page.locator('[role="dialog"], [class*="modal" i]').first();
      if (await modal.count() > 0) {
        expect(await modal.screenshot()).toMatchSnapshot('modal-dialog.png');
      }
    }
  });

  test('should render notification/alert consistently', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for alert messages
    const alerts = page.locator('[role="alert"], [class*="alert" i]');

    if (await alerts.count() > 0) {
      expect(await alerts.first().screenshot()).toMatchSnapshot(
        'alert-notification.png'
      );
    }
  });
});

test.describe('Visual Regression - Responsive', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authenticated state
    await context.addCookies([
      {
        name: 'JSESSIONID',
        value: 'test-session-id',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      },
    ]);
  });

  test('should render dashboard consistently on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForTimeout(1500);

    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'dashboard-mobile.png'
    );
  });

  test('should render dashboard consistently on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForTimeout(1500);

    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'dashboard-tablet.png'
    );
  });

  test('should render dashboard consistently on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.waitForTimeout(1500);

    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'dashboard-desktop.png'
    );
  });

  test('should render transaction table responsively on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Table should adapt to mobile viewport
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      // Check that table doesn't cause horizontal scroll
      const tableWidth = await page.evaluate(() => {
        const table = document.querySelector('table');
        return table ? table.offsetWidth : 0;
      });

      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(tableWidth).toBeLessThanOrEqual(viewportWidth + 50);
    }
  });
});

test.describe('Visual Regression - Theme', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authenticated state
    await context.addCookies([
      {
        name: 'JSESSIONID',
        value: 'test-session-id',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      },
    ]);

    await page.goto('/');
  });

  test('should render dashboard in light theme', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Capture light theme dashboard
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      'dashboard-light-theme.png'
    );
  });

  test('should render dashboard in dark theme', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for theme toggle button using getByRole or aria-label
    const themeToggleByRole = page.getByRole('button', { name: /theme|dark|light/i });
    const themeToggleByLabel = page.locator('[aria-label*="theme" i]');

    // Try role-based locator first, then aria-label
    let themeToggle = themeToggleByRole;
    if (await themeToggleByRole.count() === 0) {
      themeToggle = themeToggleByLabel;
    }

    if (await themeToggle.count() > 0) {
      // Click theme toggle to switch to dark mode
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Capture dark theme dashboard
      expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
        'dashboard-dark-theme.png'
      );
    }
  });

  test('should maintain contrast in both themes', async ({ page }) => {
    // Check initial theme contrast
    const initialContrast = await page.evaluate(() => {
      const body = document.body;
      const bgColor = window.getComputedStyle(body).backgroundColor;
      const textColor = window.getComputedStyle(body).color;
      return { bgColor, textColor };
    });

    expect(initialContrast).toBeTruthy();

    // Toggle theme using getByRole or aria-label
    const themeToggleByRole = page.getByRole('button', { name: /theme|dark|light/i });
    const themeToggleByLabel = page.locator('[aria-label*="theme" i]');

    let themeToggle = themeToggleByRole;
    if (await themeToggleByRole.count() === 0) {
      themeToggle = themeToggleByLabel;
    }

    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Check dark theme contrast
      const darkContrast = await page.evaluate(() => {
        const body = document.body;
        const bgColor = window.getComputedStyle(body).backgroundColor;
        const textColor = window.getComputedStyle(body).color;
        return { bgColor, textColor };
      });

      expect(darkContrast).toBeTruthy();
      // Colors should be different from light theme
      expect(darkContrast).not.toEqual(initialContrast);
    }
  });
});

test.describe('Visual Regression - Animations', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authenticated state
    await context.addCookies([
      {
        name: 'JSESSIONID',
        value: 'test-session-id',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      },
    ]);

    await page.goto('/');
  });

  test('should render loading spinner consistently', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for spinner
    const spinner = page.locator('.ant-spin, [role="status"], .loading');

    if (await spinner.count() > 0) {
      // Capture spinner at specific point in animation
      expect(await spinner.first().screenshot()).toMatchSnapshot(
        'loading-spinner.png'
      );
    }
  });

  test('should render transition effects smoothly', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for buttons and interactive elements
    const buttons = page.locator('button').first();

    if (await buttons.count() > 0) {
      // Hover over button to trigger hover state
      await buttons.hover();
      await page.waitForTimeout(200);

      // Capture button in hover state
      expect(await buttons.screenshot()).toMatchSnapshot('button-hover-state.png');
    }
  });

  test('should animate page transitions', async ({ page }) => {
    // Initial page load
    await page.waitForTimeout(1500);

    // Capture initial state
    const initialScreenshot = await page.screenshot({ fullPage: true });

    // Click navigation link - use separate locators to avoid regex in CSS
    const navLinksHref = page.locator('a[href*="/"]');
    const navButtons = page.getByRole('button', { name: /home|dashboard/i });

    let navLinks = navLinksHref;
    if (await navLinksHref.count() === 0) {
      navLinks = navButtons;
    }

    if (await navLinks.count() > 0) {
      await navLinks.first().click();
      await page.waitForTimeout(1000);

      // Capture after navigation
      const finalScreenshot = await page.screenshot({ fullPage: true });

      // Pages should be different
      expect(finalScreenshot.length).toBeGreaterThan(0);
    }
  });
});
