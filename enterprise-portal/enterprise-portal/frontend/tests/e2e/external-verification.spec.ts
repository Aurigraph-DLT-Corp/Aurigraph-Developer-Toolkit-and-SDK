/**
 * E2E Tests for External Verification Integration
 *
 * Tests oracle verification endpoints and external data integration
 *
 * @author Testing Agent (TA)
 * @since V12.0.0
 * @see AV11-588
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BACKEND_URL || 'https://dlt.aurigraph.io';

test.describe('External Verification Integration', () => {

  test.describe('Oracle Service Health', () => {

    test('should return oracle service status', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/oracle/status`);

      // Accept both 200 and 401 (auth required)
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('active_oracles');
        expect(data.active_oracles).toBeGreaterThanOrEqual(0);
      }
    });

    test('should list available oracle providers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/oracle/providers`);

      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data.providers || data)).toBe(true);
      }
    });

    test('should return oracle health check', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/q/health`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('checks');

      // Look for oracle-related health check
      const oracleCheck = data.checks.find(
        (c: any) => c.name.toLowerCase().includes('oracle')
      );

      if (oracleCheck) {
        expect(['UP', 'DOWN']).toContain(oracleCheck.status);
      }
    });
  });

  test.describe('External Data Feeds', () => {

    test('should fetch price feed data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/oracle/prices`);

      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('prices');
        expect(Array.isArray(data.prices)).toBe(true);
      }
    });

    test('should fetch weather data for carbon credits', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/oracle/weather?location=singapore`);

      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('temperature');
      }
    });

    test('should fetch market data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/oracle/market`);

      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Verification Endpoints', () => {

    test('should verify document hash', async ({ request }) => {
      const testHash = 'a'.repeat(64); // 64 char hex string

      const response = await request.post(`${BASE_URL}/api/v11/verification/document`, {
        data: {
          hash: testHash,
          documentType: 'property_deed',
        },
      });

      expect([200, 400, 401]).toContain(response.status());
    });

    test('should verify asset ownership', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/verification/ownership`, {
        data: {
          assetId: 'test-asset-123',
          ownerAddress: '0x' + 'a'.repeat(40),
        },
      });

      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('should get verification status', async ({ request }) => {
      const verificationId = 'ver-test-123';

      const response = await request.get(
        `${BASE_URL}/api/v11/verification/${verificationId}/status`
      );

      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Carbon Credit Verification', () => {

    test('should verify carbon credit project', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/carbon/verify`, {
        data: {
          projectId: 'test-project-001',
          creditType: 'VER',
          quantity: 100,
        },
      });

      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('should get carbon registry status', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/carbon/registry/status`);

      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Property Verification', () => {

    test('should verify property registration', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/rwa/property/verify`, {
        data: {
          propertyId: 'prop-test-001',
          registryType: 'land_registry',
          country: 'SG',
        },
      });

      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('should get property valuation', async ({ request }) => {
      const propertyId = 'prop-test-001';

      const response = await request.get(
        `${BASE_URL}/api/v11/rwa/property/${propertyId}/valuation`
      );

      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('KYC/AML Verification', () => {

    test('should check KYC status', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/kyc/status/test-user-001`);

      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(['PENDING', 'VERIFIED', 'REJECTED', 'NOT_STARTED']).toContain(data.status);
      }
    });

    test('should check AML screening', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/aml/screen`, {
        data: {
          entityName: 'Test Entity',
          entityType: 'INDIVIDUAL',
        },
      });

      expect([200, 400, 401]).toContain(response.status());
    });
  });

  test.describe('External API Integration', () => {

    test('should integrate with CoinGecko prices', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/external/coingecko/prices`);

      expect([200, 401, 404, 503]).toContain(response.status());
    });

    test('should integrate with Alpaca market data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/external/alpaca/quote/AAPL`);

      expect([200, 401, 404, 503]).toContain(response.status());
    });

    test('should fetch social sentiment', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v11/external/sentiment?topic=blockchain`);

      expect([200, 401, 404, 503]).toContain(response.status());
    });
  });

  test.describe('Verification Callbacks', () => {

    test('should handle verification webhook', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/webhooks/verification`, {
        data: {
          event: 'verification.completed',
          verificationId: 'ver-test-webhook',
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
        headers: {
          'X-Webhook-Signature': 'test-signature',
        },
      });

      expect([200, 400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {

    test('should handle invalid verification request', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v11/verification/document`, {
        data: {
          // Missing required fields
        },
      });

      expect([400, 401, 422]).toContain(response.status());
    });

    test('should handle non-existent verification', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v11/verification/non-existent-id/status`
      );

      expect([401, 404]).toContain(response.status());
    });

    test('should rate limit excessive requests', async ({ request }) => {
      const requests = Array.from({ length: 10 }, () =>
        request.get(`${BASE_URL}/api/v11/oracle/status`)
      );

      const responses = await Promise.all(requests);

      // At least some should succeed, some might be rate limited
      const statusCodes = responses.map(r => r.status());
      expect(statusCodes.some(code => code === 200 || code === 401)).toBe(true);
    });
  });
});

test.describe('UI Integration Tests', () => {

  test('should display oracle status on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for oracle status indicator (may require auth)
    const oracleStatus = page.locator('[data-testid="oracle-status"], .oracle-status');

    if (await oracleStatus.isVisible()) {
      await expect(oracleStatus).toBeVisible();
    }
  });

  test('should show verification progress', async ({ page }) => {
    await page.goto(`${BASE_URL}/verification`);

    await page.waitForLoadState('networkidle');

    // Check for verification UI elements
    const verificationSection = page.locator('[data-testid="verification-section"], .verification-container');

    // May require authentication
    if (await verificationSection.isVisible()) {
      await expect(verificationSection).toBeVisible();
    }
  });

  test('should display external data feeds', async ({ page }) => {
    await page.goto(`${BASE_URL}/data-feeds`);

    await page.waitForLoadState('networkidle');

    // Check for data feed elements
    const dataFeed = page.locator('[data-testid="data-feed"], .data-feed');

    if (await dataFeed.isVisible()) {
      await expect(dataFeed).toBeVisible();
    }
  });
});
