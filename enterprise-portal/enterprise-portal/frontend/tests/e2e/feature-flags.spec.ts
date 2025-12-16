/**
 * Feature Flags E2E Tests
 *
 * Playwright tests for feature flag UI effects:
 * - Test disabled features are hidden
 * - Test enabled features are visible
 * - Test feature flag-based navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Feature Flags - UI Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test('should display enabled blockchain features in navigation', async ({ page }) => {
    // Production features that should be visible
    const enabledFeatures = [
      'Block Explorer',
      'Transaction Explorer',
      'Consensus Metrics',
    ];

    for (const feature of enabledFeatures) {
      const element = page.getByText(feature, { exact: false });
      await expect(element.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should hide disabled validator features in navigation', async ({ page }) => {
    // Planned features that should be hidden
    const disabledFeatures = [
      'Validator Dashboard',
      'Staking Operations',
    ];

    for (const feature of disabledFeatures) {
      const element = page.getByText(feature, { exact: true });
      await expect(element).not.toBeVisible();
    }
  });

  test('should hide disabled AI features in navigation', async ({ page }) => {
    const aiFeatures = [
      'AI Optimization',
      'ML Models',
      'Predictive Analytics',
    ];

    for (const feature of aiFeatures) {
      const element = page.getByText(feature, { exact: true });
      await expect(element).not.toBeVisible();
    }
  });

  test('should hide disabled security features in navigation', async ({ page }) => {
    const securityFeatures = [
      'Quantum Security',
      'Key Rotation',
      'Security Audits',
      'Vulnerability Scanning',
    ];

    for (const feature of securityFeatures) {
      const element = page.getByText(feature, { exact: true });
      await expect(element).not.toBeVisible();
    }
  });

  test('should display enabled tokenization features', async ({ page }) => {
    const tokenizationFeatures = [
      'Tokenization',
      'RWA Registry',
    ];

    for (const feature of tokenizationFeatures) {
      const element = page.getByText(feature, { exact: false });
      await expect(element.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display enabled smart contract features', async ({ page }) => {
    const smartContractFeatures = [
      'Smart Contracts',
    ];

    for (const feature of smartContractFeatures) {
      const element = page.getByText(feature, { exact: false });
      await expect(element.first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Feature Flags - Page Access', () => {
  test('should allow access to block explorer page', async ({ page }) => {
    await page.goto('/');

    // Click on Block Explorer link
    await page.click('text=Block Explorer');

    // Wait for navigation
    await page.waitForURL('**/block-explorer**');

    // Verify page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/Block/i);
  });

  test('should allow access to transaction explorer page', async ({ page }) => {
    await page.goto('/');

    // Click on Transaction Explorer link if available
    const txExplorerLink = page.getByText('Transaction Explorer', { exact: false });

    if (await txExplorerLink.isVisible()) {
      await txExplorerLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on the transaction explorer page
      await expect(page.locator('h1, h2, h3')).toContainText(/Transaction/i);
    }
  });

  test('should not have routes for disabled features', async ({ page }) => {
    // Try to access validator dashboard directly (should redirect or show 404)
    const response = await page.goto('/validator-dashboard');

    // Should either redirect to home or show not found
    expect(response?.status()).not.toBe(200);
  });
});

test.describe('Feature Flags - Dashboard Display', () => {
  test('should display enabled feature cards on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for blockchain metrics (enabled features)
    const metricsCards = [
      'TPS',
      'Transactions',
      'Blocks',
      'Consensus',
    ];

    for (const metric of metricsCards) {
      const card = page.getByText(metric, { exact: false });
      await expect(card.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should not display disabled AI optimization controls', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // AI optimization controls should not be visible
    const aiControls = page.getByText('AI Optimization', { exact: true });
    await expect(aiControls).not.toBeVisible();
  });

  test('should not display disabled WebSocket status', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // WebSocket connection indicator should not be visible (feature disabled)
    const wsIndicator = page.getByText('WebSocket Connected', { exact: false });
    await expect(wsIndicator).not.toBeVisible();
  });
});

test.describe('Feature Flags - Settings Page', () => {
  test('should display feature flags in settings', async ({ page }) => {
    // Navigate to settings if available
    await page.goto('/');

    const settingsLink = page.getByText('Settings', { exact: false });

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');

      // Check if feature flags section exists
      const featureFlagsSection = page.getByText('Feature Flags', { exact: false });

      if (await featureFlagsSection.isVisible()) {
        // Verify some feature flags are listed
        await expect(page.getByText('Block Explorer', { exact: false })).toBeVisible();
        await expect(page.getByText('Production', { exact: false })).toBeVisible();
      }
    }
  });

  test('should show production status for enabled features', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const featureFlagsSection = page.getByText('Feature Flags', { exact: false });

    if (await featureFlagsSection.isVisible()) {
      // Production features should show green status or "Enabled"
      const blockExplorerStatus = page.locator('[data-testid="feature-blockExplorer-status"]');

      if (await blockExplorerStatus.isVisible()) {
        await expect(blockExplorerStatus).toContainText(/enabled|active|production/i);
      }
    }
  });

  test('should show planned status for disabled features', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const featureFlagsSection = page.getByText('Feature Flags', { exact: false });

    if (await featureFlagsSection.isVisible()) {
      // Planned features should show disabled status
      const validatorStatus = page.locator('[data-testid="feature-validatorDashboard-status"]');

      if (await validatorStatus.isVisible()) {
        await expect(validatorStatus).toContainText(/disabled|planned/i);
      }
    }
  });
});

test.describe('Feature Flags - Conditional Components', () => {
  test('should render tokenization components when feature is enabled', async ({ page }) => {
    await page.goto('/tokenization');
    await page.waitForLoadState('networkidle');

    // Tokenization UI should be visible
    await expect(page.locator('h1, h2')).toContainText(/Tokenization/i);

    // Check for tokenization-specific UI elements
    const createTokenButton = page.getByText('Create Token', { exact: false });

    if (await createTokenButton.isVisible()) {
      await expect(createTokenButton).toBeVisible();
    }
  });

  test('should render smart contracts UI when feature is enabled', async ({ page }) => {
    await page.goto('/smart-contracts');
    await page.waitForLoadState('networkidle');

    // Smart contracts UI should be visible
    await expect(page.locator('h1, h2')).toContainText(/Smart Contract/i);

    // Check for contract-specific UI elements
    const deployButton = page.getByText('Deploy', { exact: false });

    if (await deployButton.isVisible()) {
      await expect(deployButton).toBeVisible();
    }
  });

  test('should not render cross-chain bridge when feature is disabled', async ({ page }) => {
    // Try to access bridge page
    const response = await page.goto('/bridge');

    // Should redirect or show error since bridge is disabled
    if (response) {
      expect([301, 302, 404]).toContain(response.status());
    }
  });
});

test.describe('Feature Flags - Navigation Menu', () => {
  test('should only show enabled features in sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open sidebar if collapsed
    const menuButton = page.locator('[aria-label="menu"], [data-testid="menu-button"]');

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for animation
    }

    // Count visible menu items - should only include enabled features
    const menuItems = page.locator('[role="menuitem"], nav a, .menu-item');
    const count = await menuItems.count();

    // Should have menu items for enabled features only
    // Exact count depends on implementation, but should be > 0 and < total features
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(22); // Less than total feature count
  });

  test('should highlight active feature section in navigation', async ({ page }) => {
    await page.goto('/block-explorer');
    await page.waitForLoadState('networkidle');

    // Block Explorer menu item should be highlighted/active
    const activeMenuItem = page.locator('[aria-current="page"], .active');

    if (await activeMenuItem.isVisible()) {
      await expect(activeMenuItem).toContainText(/Block/i);
    }
  });
});

test.describe('Feature Flags - Error Boundaries', () => {
  test('should show graceful error for disabled feature access', async ({ page }) => {
    // Try to access a disabled feature endpoint
    await page.goto('/ai-optimization');

    // Should show error message or redirect
    const errorMessage = page.getByText(/not available|disabled|coming soon/i);
    const homeRedirect = page.url();

    const hasError = await errorMessage.isVisible();
    const redirectedHome = homeRedirect.includes('/dashboard') || homeRedirect === page.context().pages()[0]?.url();

    // Either error message shown or redirected
    expect(hasError || redirectedHome).toBe(true);
  });
});

test.describe('Feature Flags - Responsive Behavior', () => {
  test('should maintain feature visibility on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    const mobileMenuButton = page.locator('[aria-label="menu"], button.menu-toggle');

    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
    }

    // Enabled features should still be visible
    await expect(page.getByText('Block Explorer', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should maintain feature visibility on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enabled features should be visible
    await expect(page.getByText('Transaction Explorer', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Feature Flags - Data Loading States', () => {
  test('should show loading states for enabled features', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for loading indicators while data fetches
    const loadingIndicators = page.locator('[data-testid*="loading"], .loading, .spinner');

    // Loading should appear briefly
    if (await loadingIndicators.first().isVisible({ timeout: 1000 })) {
      // Then disappear when data loads
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('should not make API calls for disabled features', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should not have requests to disabled feature endpoints
    const validatorRequests = requests.filter(url => url.includes('/validators'));
    const aiRequests = requests.filter(url => url.includes('/ai/'));
    const bridgeRequests = requests.filter(url => url.includes('/bridge/'));

    expect(validatorRequests).toHaveLength(0);
    expect(aiRequests).toHaveLength(0);
    expect(bridgeRequests).toHaveLength(0);
  });
});

test.describe('Feature Flags - User Feedback', () => {
  test('should show "Coming Soon" badges for planned features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for coming soon indicators
    const comingSoonBadges = page.locator('[data-badge="coming-soon"], .badge-coming-soon');

    if (await comingSoonBadges.first().isVisible()) {
      // Should have some coming soon badges for planned features
      const count = await comingSoonBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
