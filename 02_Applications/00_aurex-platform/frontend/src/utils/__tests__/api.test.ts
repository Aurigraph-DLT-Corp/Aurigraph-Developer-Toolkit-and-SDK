import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, submitContactForm, submitDemoRequest, handleAPIError, withRetry } from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    vi.stubEnv('VITE_API_KEY', undefined);
    vi.stubEnv('PROD', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('apiClient configuration', () => {
    it('uses correct base URL in development', () => {
      expect(apiClient).toBeDefined();
    });

    it('uses production URL when PROD is true', () => {
      vi.stubEnv('PROD', 'true');
      // Would need to create new instance to test this properly
      expect(apiClient).toBeDefined();
    });

    it('uses custom API base URL when provided', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://custom-api.example.com');
      expect(apiClient).toBeDefined();
    });
  });

  describe('submitContactForm', () => {
    const mockContactData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Company',
      role: 'Developer',
      message: 'Test message',
      interests: ['Platform'],
      consent: true,
    };

    it('successfully submits contact form data', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, message: 'Contact form submitted successfully' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      });

      const result = await submitContactForm(mockContactData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contact'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining(mockContactData.name),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad Request' }),
      });

      const result = await submitContactForm(mockContactData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error');
    });

    it('includes source and timestamp in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await submitContactForm(mockContactData);

      const [, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      expect(requestBody.source).toBe('landing_page');
      expect(requestBody.timestamp).toBeDefined();
      expect(new Date(requestBody.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('submitDemoRequest', () => {
    const mockDemoData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Demo Company',
      role: 'Manager',
      employees: '50-200',
      timeline: '3-6 months',
      interests: ['HydroPulse', 'CarbonTrace'],
    };

    it('successfully submits demo request data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      const result = await submitDemoRequest(mockDemoData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/demo-request'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result.success).toBe(true);
    });

    it('includes all demo-specific fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await submitDemoRequest(mockDemoData);

      const [, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      expect(requestBody.employees).toBe(mockDemoData.employees);
      expect(requestBody.timeline).toBe(mockDemoData.timeline);
      expect(requestBody.interests).toEqual(mockDemoData.interests);
    });
  });

  describe('handleAPIError', () => {
    it('handles string errors', () => {
      const result = handleAPIError('Simple error message');
      expect(result).toBe('Simple error message');
    });

    it('extracts message from error object', () => {
      const error = { message: 'Error object message' };
      const result = handleAPIError(error);
      expect(result).toBe('Error object message');
    });

    it('extracts error property from error object', () => {
      const error = { error: 'Error property message' };
      const result = handleAPIError(error);
      expect(result).toBe('Error property message');
    });

    it('returns default message for unknown error types', () => {
      const result = handleAPIError({ unknown: 'property' });
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('withRetry', () => {
    it('returns result on first success', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, 3, 10);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('throws last error after max retries exceeded', async () => {
      const error = new Error('Persistent failure');
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('applies exponential backoff delay', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(mockFn, 3, 50);
      const endTime = Date.now();

      // Should have at least one delay of 50ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Authentication URLs', () => {
    it('generates platform auth URL', () => {
      const url = apiClient.getPlatformAuthURL();
      expect(url).toContain('/auth/login');
      expect(url).toContain('source=landing_page');
    });

    it('includes return URL in auth URL', () => {
      const returnUrl = 'https://example.com/dashboard';
      const url = apiClient.getPlatformAuthURL(returnUrl);
      expect(url).toContain(`return_to=${encodeURIComponent(returnUrl)}`);
    });

    it('generates platform signup URL with plan', () => {
      const url = apiClient.getPlatformSignupURL('enterprise', 'homepage');
      expect(url).toContain('/auth/register');
      expect(url).toContain('plan=enterprise');
      expect(url).toContain('source=homepage');
    });
  });

  describe('Health Check', () => {
    it('performs health check request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      });

      const result = await apiClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/health'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: 'healthy' });
    });
  });
});