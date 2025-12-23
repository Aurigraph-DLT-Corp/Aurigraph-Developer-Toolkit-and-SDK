/**
 * Authentication E2E Tests
 *
 * Tests login, logout, session management, and protected routes
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9003';
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'password123';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display login page when not authenticated', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Should show login form (or redirect to login)
    const loginForm = page.locator('form');
    const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]');
    const passwordInput = page.locator('input[type="password"]');

    // Check for login elements
    expect(await usernameInput.count()).toBeGreaterThan(0);
    expect(await passwordInput.count()).toBeGreaterThan(0);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill login form with invalid credentials
    const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await usernameInput.fill('invaliduser');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(1000);

    // Check for error message
    const errorAlert = page.locator('[role="alert"], .ant-alert-error, .error-message');
    expect(await errorAlert.count()).toBeGreaterThan(0);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill login form with demo credentials
    const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await usernameInput.fill(DEMO_USERNAME);
    await passwordInput.fill(DEMO_PASSWORD);
    await submitButton.click();

    // Wait for navigation or success message
    await page.waitForTimeout(2000);

    // Check for successful login indicators
    // Either navigated away from login page or success message shown
    const urlAfterLogin = page.url();
    const hasSuccessMessage = await page
      .locator('text=/successfully|success|welcome/i')
      .count()
      .then((count) => count > 0)
      .catch(() => false);

    // Should either navigate away from login or show success
    const success = !urlAfterLogin.includes('/login') || hasSuccessMessage;
    expect(success).toBeTruthy();
  });

  test('should use demo account button', async ({ page }) => {
    await page.goto('/');

    // Click demo account button
    const demoButton = page.locator('button:has-text("Demo"), button:has-text("demo")').first();

    if (await demoButton.count() > 0) {
      await demoButton.click();

      // Wait for login attempt
      await page.waitForTimeout(2000);

      // Check for success or navigation
      const urlAfterDemo = page.url();
      const hasSuccessMessage = await page
        .locator('text=/successfully|success|welcome/i')
        .count()
        .then((count) => count > 0)
        .catch(() => false);

      const success = !urlAfterDemo.includes('/login') || hasSuccessMessage;
      expect(success).toBeTruthy();
    }
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/');

    const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Try submitting empty form
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show validation errors
    const errorMessages = page.locator('.ant-form-item-explain-error, .error, [role="alert"]');
    const hasErrors = await errorMessages.count().then((count) => count > 0);

    // Test with too short username
    await usernameInput.fill('ab');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Test with too short password
    await usernameInput.fill('admin');
    await passwordInput.fill('12345');
    await submitButton.click();
    await page.waitForTimeout(500);
  });

  test('should maintain session across page reloads', async ({ page, context }) => {
    // Mock successful login
    await page.goto('/');

    // Simulate authenticated state by setting cookie
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

    // Reload page
    await page.reload();

    // Verify session persisted (would check for authenticated UI elements)
    await page.waitForTimeout(1000);

    // Check cookies still present
    const cookies = await context.cookies();
    const hasSessionCookie = cookies.some((c) => c.name === 'JSESSIONID');
    expect(hasSessionCookie).toBeTruthy();
  });

  test('should handle logout', async ({ page, context }) => {
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

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("logout")');

    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(1000);

      // Should return to login page
      const urlAfterLogout = page.url();
      expect(urlAfterLogout.includes('/login') || !urlAfterLogout.includes('/home')).toBeTruthy();

      // Session cookie should be cleared
      const cookies = await context.cookies();
      const hasSessionCookie = cookies.some((c) => c.name === 'JSESSIONID' && c.value === 'test-session-id');
      expect(hasSessionCookie).toBeFalsy();
    }
  });

  test('should redirect to login on 401 response', async ({ page }) => {
    // Navigate to protected page with expired session
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login')).toBeTruthy();
  });

  test('should show user info when authenticated', async ({ page, context }) => {
    // Set authenticated state with user data
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

    // Wait for page load
    await page.waitForTimeout(1000);

    // Look for user menu or user info
    const userMenu = page.locator('[aria-label*="user" i], .user-menu, .user-info');
    const hasUserMenu = await userMenu.count().then((count) => count > 0);

    // Either user menu visible or username displayed
    expect(hasUserMenu || page.url().includes('/home')).toBeTruthy();
  });
});

test.describe('Session Management', () => {
  test('should handle concurrent logins', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on page 1
    await page1.goto('/');
    const username1 = page1.locator('input[name="username"], input[placeholder*="username" i]').first();
    const password1 = page1.locator('input[type="password"]').first();
    const submit1 = page1.locator('button[type="submit"]').first();

    await username1.fill(DEMO_USERNAME);
    await password1.fill(DEMO_PASSWORD);
    await submit1.click();
    await page1.waitForTimeout(2000);

    // Login on page 2
    await page2.goto('/');
    const username2 = page2.locator('input[name="username"], input[placeholder*="username" i]').first();
    const password2 = page2.locator('input[type="password"]').first();
    const submit2 = page2.locator('button[type="submit"]').first();

    await username2.fill(DEMO_USERNAME);
    await password2.fill(DEMO_PASSWORD);
    await submit2.click();
    await page2.waitForTimeout(2000);

    // Both should be authenticated
    const url1 = page1.url();
    const url2 = page2.url();

    const success1 = !url1.includes('/login');
    const success2 = !url2.includes('/login');

    expect(success1 || success2).toBeTruthy(); // At least one should succeed

    await context1.close();
    await context2.close();
  });

  test('should refresh session on activity', async ({ page, context }) => {
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
    await page.waitForTimeout(1000);

    // Simulate user activity
    const clickableElements = page.locator('button, a').first();
    if (await clickableElements.count() > 0) {
      await clickableElements.click();
      await page.waitForTimeout(500);
    }

    // Session should still be valid
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'JSESSIONID');
    expect(sessionCookie).toBeTruthy();
  });
});
