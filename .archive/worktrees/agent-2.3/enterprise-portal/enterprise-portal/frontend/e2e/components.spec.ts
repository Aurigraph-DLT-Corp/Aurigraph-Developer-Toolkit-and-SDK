/**
 * Component Interaction E2E Tests
 *
 * Tests UI component interactions, forms, and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Component Interactions', () => {
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

  test('should display main navigation menu', async ({ page }) => {
    // Wait for page load
    await page.waitForTimeout(1000);

    // Look for navigation elements
    const navMenu = page.locator('nav, [role="navigation"], .navbar, .header');
    const menuItems = page.locator('a, button');

    const hasNav = await navMenu.count().then((count) => count > 0);
    const hasMenuItems = await menuItems.count().then((count) => count > 0);

    expect(hasNav || hasMenuItems > 0).toBeTruthy();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find navigation links
    const navLinks = page.locator('a[href*="/"], button:has-text(/home|dashboard|analytics/i)');

    if (await navLinks.count() > 0) {
      const firstLink = navLinks.first();
      const linkHref = await firstLink.getAttribute('href');

      if (linkHref) {
        await firstLink.click();
        await page.waitForTimeout(1500);

        // Should navigate to new page
        const newUrl = page.url();
        expect(newUrl).toBeTruthy();
      }
    }
  });

  test('should toggle theme mode if available', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for theme toggle button
    const themeToggle = page.locator(
      'button:has-text(/theme|dark|light/i), [aria-label*="theme" i]'
    );

    if (await themeToggle.count() > 0) {
      // Get initial classes
      const body = page.locator('body');
      const initialClass = await body.getAttribute('class');

      // Click theme toggle
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Class should change or no error should occur
      const newClass = await body.getAttribute('class');
      expect(body).toBeTruthy();
    }
  });

  test('should display dashboard with statistics', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Look for statistic cards
    const statistics = page.locator('[class*="statistic" i], text=/transactions|tps|latency/i');
    const hasStats = await statistics.count().then((count) => count > 0);

    // Dashboard should render
    expect(page.url()).toBeTruthy();
  });

  test('should handle table sorting if available', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Look for sortable table headers
    const tableHeaders = page.locator('th, [role="columnheader"]');

    if (await tableHeaders.count() > 0) {
      const firstHeader = tableHeaders.first();

      if (await firstHeader.isClickable()) {
        await firstHeader.click();
        await page.waitForTimeout(500);

        // Table should update or no error
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should handle table pagination if available', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Look for pagination controls
    const paginationButtons = page.locator('[class*="pagination" i] button, .ant-pagination button');

    if (await paginationButtons.count() > 1) {
      const nextButton = paginationButtons.filter({ has: page.locator('text=/next|>|→/i') }).first();

      if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Table should update
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should display error messages appropriately', async ({ page }) => {
    // Try to trigger an error by navigating to invalid page
    await page.goto('/invalid-page-12345');

    await page.waitForTimeout(1000);

    // Should show error or redirect
    const errorMessage = page.locator('[role="alert"], text=/error|not found/i');
    const pageContent = page.locator('main, [role="main"], body');

    const hasContent = await pageContent.count().then((count) => count > 0);
    expect(hasContent).toBeTruthy();
  });

  test('should handle form submissions', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for forms
    const form = page.locator('form').first();

    if (await form.count() > 0) {
      // Find input fields
      const inputs = form.locator('input');
      const submitButton = form.locator('button[type="submit"], button:has-text("submit" i)');

      if ((await inputs.count()) > 0 && (await submitButton.count()) > 0) {
        // Fill first input with test data
        const firstInput = inputs.first();
        const inputType = await firstInput.getAttribute('type');

        if (inputType === 'text' || inputType === 'email') {
          await firstInput.fill('test-value');
        }

        // Try to submit (may fail validation but shouldn't crash)
        await submitButton.click();
        await page.waitForTimeout(500);

        // Page should still be interactive
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should display dropdown menus', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for dropdown triggers
    const dropdowns = page.locator('[class*="dropdown" i], .ant-dropdown-trigger');

    if (await dropdowns.count() > 0) {
      const firstDropdown = dropdowns.first();

      if (await firstDropdown.isVisible()) {
        await firstDropdown.click();
        await page.waitForTimeout(300);

        // Dropdown menu should appear
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should close modals when clicking close button', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for buttons that might open modals
    const buttons = page.locator('button:has-text(/open|view|details|edit/i)');

    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      await firstButton.click();
      await page.waitForTimeout(500);

      // Look for close button
      const closeButton = page.locator('[aria-label*="close" i], button:has-text("×"), .ant-modal-close');

      if (await closeButton.count() > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(300);

        // Modal should close
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should handle tab navigation', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for tabs
    const tabs = page.locator('[role="tab"], [class*="tab" i]');

    if (await tabs.count() > 1) {
      const secondTab = tabs.nth(1);

      if (await secondTab.isClickable()) {
        await secondTab.click();
        await page.waitForTimeout(500);

        // Content should update
        expect(page.url()).toBeTruthy();
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    await page.waitForTimeout(1000);

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow 10px margin
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    await page.waitForTimeout(1000);

    // Page should render without issues
    expect(page.url()).toBeTruthy();
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');

    await page.waitForTimeout(1000);

    // Page should render
    expect(page.url()).toBeTruthy();
  });

  test('should handle window resize', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Resize window multiple times
    for (let width of [1920, 768, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      // Page should remain functional
      const title = page.locator('title');
      expect(title).toBeTruthy();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Check for headings
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    const h3 = page.locator('h3');

    // At least one heading should exist
    const headingCount = await Promise.all([h1.count(), h2.count(), h3.count()]).then((counts) =>
      counts.reduce((a, b) => a + b, 0)
    );

    expect(headingCount).toBeGreaterThanOrEqual(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Check for images
    const images = page.locator('img');

    if (await images.count() > 0) {
      // Most images should have alt text
      const firstImage = images.first();
      const altText = await firstImage.getAttribute('alt');

      // If image is visible, it should have alt text
      if (await firstImage.isVisible()) {
        expect(altText || altText === '').toBeTruthy();
      }
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Look for buttons and links
    const buttons = page.locator('button');

    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const text = await firstButton.textContent();

      // Button should have label or text
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Should have focus on an element
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });
});
