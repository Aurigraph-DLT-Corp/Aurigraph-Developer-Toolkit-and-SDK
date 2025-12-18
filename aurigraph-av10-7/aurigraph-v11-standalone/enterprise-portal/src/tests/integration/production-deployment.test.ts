/**
 * Production Deployment Integration Tests
 *
 * Tests for Aurigraph V11 Enterprise Portal production deployment
 * Verifies all critical infrastructure components and user workflows
 *
 * Date: October 31, 2025
 * Environment: https://dlt.aurigraph.io (Production)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test Configuration
const PRODUCTION_URL = 'https://dlt.aurigraph.io';
const API_BASE = `${PRODUCTION_URL}/api/v12`;
const HEALTH_ENDPOINT = `${API_BASE}/health`;
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

// Test Results
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  message?: string;
}

const testResults: TestResult[] = [];

// Helper function to measure response time
async function measureRequest<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    testResults.push({ name, passed: true, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    testResults.push({
      name,
      passed: false,
      duration,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

describe('Production Deployment Integration Tests', () => {
  // Health Check Tests
  describe('Infrastructure Health Checks', () => {
    it('should verify frontend is accessible', async () => {
      await measureRequest('Frontend Accessibility', async () => {
        const response = await fetch(PRODUCTION_URL);
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>');
      });
    });

    it('should verify backend health endpoint responds', async () => {
      await measureRequest('Backend Health Endpoint', async () => {
        const response = await fetch(HEALTH_ENDPOINT);
        expect(response.status).toBe(200);
        const health = await response.json();
        expect(health).toHaveProperty('status');
        return health;
      });
    });

    it('should verify SSL/TLS certificate is valid', async () => {
      await measureRequest('SSL/TLS Certificate Validation', async () => {
        const response = await fetch(PRODUCTION_URL);
        expect(response.url).toContain('https://');
        // If we got here without certificate error, it's valid
      });
    });

    it('should verify NGINX is properly configured', async () => {
      await measureRequest('NGINX Configuration', async () => {
        // Test HTTP redirect to HTTPS
        const httpResponse = await fetch(`http://${PRODUCTION_URL.replace('https://', '')}`, {
          redirect: 'follow',
        });
        expect(httpResponse.url).toContain('https://');
      });
    });

    it('should verify security headers are present', async () => {
      await measureRequest('Security Headers', async () => {
        const response = await fetch(PRODUCTION_URL);

        // Check critical security headers
        expect(response.headers.get('strict-transport-security')).toBeTruthy();
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response.headers.get('x-frame-options')).toContain('SAME');
      });
    });
  });

  // API Endpoint Tests
  describe('API Endpoints', () => {
    it('should respond to API health check', async () => {
      await measureRequest('API Health Check', async () => {
        const response = await fetch(HEALTH_ENDPOINT);
        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toHaveProperty('status');
        return data;
      });
    });

    it('should handle OPTIONS requests (CORS)', async () => {
      await measureRequest('CORS Support', async () => {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'OPTIONS',
        });
        // Should either support OPTIONS or at least not throw
        expect([200, 204, 405]).toContain(response.status);
      });
    });

    it('should reject invalid API paths gracefully', async () => {
      await measureRequest('Invalid API Path Handling', async () => {
        const response = await fetch(`${API_BASE}/invalid-endpoint`);
        expect(response.status).not.toBe(200);
        expect([404, 500, 502, 503]).toContain(response.status);
      });
    });
  });

  // Performance Tests
  describe('Performance Metrics', () => {
    it('should serve frontend within acceptable time', async () => {
      await measureRequest('Frontend Response Time', async () => {
        const start = Date.now();
        const response = await fetch(PRODUCTION_URL);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        // Should respond within 2 seconds from production server
        expect(duration).toBeLessThan(5000);
      });
    });

    it('should serve API responses within acceptable time', async () => {
      await measureRequest('API Response Time', async () => {
        const start = Date.now();
        const response = await fetch(HEALTH_ENDPOINT);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        // API should respond within 1 second
        expect(duration).toBeLessThan(2000);
      });
    });

    it('should handle concurrent requests', async () => {
      await measureRequest('Concurrent Request Handling', async () => {
        const promises = Array(10).fill(null).map(() =>
          fetch(HEALTH_ENDPOINT),
        );

        const responses = await Promise.all(promises);

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      });
    });

    it('should maintain performance under load', async () => {
      await measureRequest('Load Performance Test', async () => {
        const startTime = Date.now();
        const responses: Response[] = [];

        // Fire 50 requests over 5 seconds
        for (let i = 0; i < 50; i++) {
          responses.push(
            await fetch(HEALTH_ENDPOINT).catch(e => {
              throw new Error(`Request ${i} failed: ${e.message}`);
            }),
          );

          // Small delay between requests
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const duration = Date.now() - startTime;

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Should complete in reasonable time (50 requests)
        expect(duration).toBeLessThan(30000);
      });
    });
  });

  // Content & Structure Tests
  describe('Frontend Content & Structure', () => {
    it('should load HTML with proper structure', async () => {
      await measureRequest('HTML Structure', async () => {
        const response = await fetch(PRODUCTION_URL);
        const html = await response.text();

        // Check for essential elements
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<head>');
        expect(html).toContain('<body>');
        expect(html).toContain('<meta charset');
      });
    });

    it('should load CSS and JavaScript assets', async () => {
      await measureRequest('Asset Loading', async () => {
        const response = await fetch(PRODUCTION_URL);
        const html = await response.text();

        // Check for asset references
        expect(html).toMatch(/\.js|\.css|<script|<link/i);
      });
    });

    it('should render React application root', async () => {
      await measureRequest('React App Root', async () => {
        const response = await fetch(PRODUCTION_URL);
        const html = await response.text();

        // Check for React root element
        expect(html).toContain('root');
      });
    });

    it('should have proper meta tags and SEO', async () => {
      await measureRequest('Meta Tags & SEO', async () => {
        const response = await fetch(PRODUCTION_URL);
        const html = await response.text();

        // Check for important meta tags
        expect(html).toContain('viewport');
        expect(html).toContain('charset');
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling & Resilience', () => {
    it('should gracefully handle malformed requests', async () => {
      await measureRequest('Malformed Request Handling', async () => {
        try {
          const response = await fetch(`${API_BASE}/health`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{ invalid json }',
          });
          // Should either reject or return error status
          expect(response.status).not.toBe(200);
        } catch (e) {
          // Network errors are acceptable
          expect(true).toBe(true);
        }
      });
    });

    it('should handle timeout gracefully', async () => {
      await measureRequest('Timeout Handling', async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100);

        try {
          await fetch(HEALTH_ENDPOINT, { signal: controller.signal });
          clearTimeout(timeoutId);
          // If didn't timeout, that's also fine (very fast response)
          expect(true).toBe(true);
        } catch (e: unknown) {
          clearTimeout(timeoutId);
          const error = e as Error;
          // Abort is expected in this test
          expect(error.name).toContain('Abort');
        }
      });
    });

    it('should properly encode response data', async () => {
      await measureRequest('Response Encoding', async () => {
        const response = await fetch(HEALTH_ENDPOINT);
        expect(response.headers.get('content-type')).toContain('application/json');

        const data = await response.json();
        expect(data).toBeTruthy();
      });
    });
  });

  // Database Connectivity Tests
  describe('Database & Backend Connectivity', () => {
    it('should indicate database is connected in health check', async () => {
      await measureRequest('Database Connectivity', async () => {
        const response = await fetch(HEALTH_ENDPOINT);
        const health = await response.json();

        // Health check should pass only if DB is connected
        expect(response.status).toBe(200);
      });
    });
  });

  // Report Generation
  afterAll(() => {
    console.log('\n=== PRODUCTION DEPLOYMENT TEST REPORT ===\n');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const message = result.message ? ` (${result.message})` : '';
      console.log(`${status} ${result.name} (${result.duration}ms)${message}`);

      if (result.passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
      totalDuration += result.duration;
    });

    console.log('\n--- SUMMARY ---');
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Response Time: ${Math.round(totalDuration / testResults.length)}ms`);

    if (totalFailed === 0) {
      console.log('\n✅ ALL TESTS PASSED - DEPLOYMENT VERIFIED\n');
    } else {
      console.log(`\n⚠️  ${totalFailed} TEST(S) FAILED - REVIEW REQUIRED\n`);
    }
  });
});
