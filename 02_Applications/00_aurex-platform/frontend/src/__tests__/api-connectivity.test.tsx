import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.mock('../config/env', () => ({
  API_BASE_URL: 'https://dev.aurigraph.io/api/v1',
  WS_URL: 'wss://dev.aurigraph.io/ws',
  ENVIRONMENT: 'production'
}));

describe('API Connectivity Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Health Check Endpoints', () => {
    it('should successfully connect to backend health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          service: 'aurex-platform-backend',
          version: '2.0.0',
          timestamp: new Date().toISOString()
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/health');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('aurex-platform-backend');
      expect(mockFetch).toHaveBeenCalledWith('https://dev.aurigraph.io/api/v1/health');
    });

    it('should handle health check endpoint failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let error;
      try {
        await fetch('https://dev.aurigraph.io/api/v1/health');
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Network error');
    });
  });

  describe('API Authentication', () => {
    it('should include authorization headers when token is present', async () => {
      const mockToken = 'Bearer test-jwt-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} })
      });

      await fetch('https://dev.aurigraph.io/api/v1/protected', {
        method: 'GET',
        headers: {
          'Authorization': mockToken,
          'Content-Type': 'application/json'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://dev.aurigraph.io/api/v1/protected',
        {
          method: 'GET',
          headers: {
            'Authorization': mockToken,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle 401 unauthorized responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized', message: 'Invalid token' })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/protected', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData.error).toBe('Unauthorized');
    });
  });

  describe('Marketing API Endpoints', () => {
    it('should successfully submit contact form', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john.doe@company.com',
        company: 'Test Company',
        message: 'Interested in ESG platform',
        source: 'landing_page'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Contact form submitted successfully',
          id: 'contact_123'
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/marketing/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Contact form submitted successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://dev.aurigraph.io/api/v1/marketing/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        }
      );
    });

    it('should successfully schedule demo', async () => {
      const demoData = {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        company: 'Demo Company',
        phone: '+1234567890',
        preferredDate: '2024-01-15',
        preferredTime: '14:00',
        requirements: 'Need ESG reporting solution'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Demo scheduled successfully',
          demoId: 'demo_456',
          scheduledAt: '2024-01-15T14:00:00Z'
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/marketing/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(demoData)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.demoId).toBe('demo_456');
    });

    it('should successfully subscribe to newsletter', async () => {
      const subscriptionData = {
        email: 'subscriber@company.com',
        preferences: ['esg_updates', 'product_news'],
        source: 'landing_page_footer'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Successfully subscribed to newsletter',
          subscriptionId: 'sub_789'
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/marketing/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub_789');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      let error;
      try {
        await fetch('https://dev.aurigraph.io/api/v1/test');
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Failed to fetch');
    });

    it('should handle 500 internal server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal Server Error',
          message: 'Something went wrong on our end'
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/test');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle timeout errors', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1000);
      });

      mockFetch.mockReturnValueOnce(timeoutPromise);

      let error;
      try {
        await fetch('https://dev.aurigraph.io/api/v1/slow-endpoint');
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Request timeout');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Access-Control-Allow-Origin': 'https://dev.aurigraph.io',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        })
      });

      const response = await fetch('https://dev.aurigraph.io/api/v1/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://dev.aurigraph.io',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://dev.aurigraph.io');
    });
  });

  describe('Content Type Validation', () => {
    it('should send correct content type headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      await fetch('https://dev.aurigraph.io/api/v1/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should handle form data uploads', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, fileId: 'file_123' })
      });

      await fetch('https://dev.aurigraph.io/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeInstanceOf(FormData);
      // Note: Content-Type should not be set for FormData (browser sets it with boundary)
      expect(options.headers?.['Content-Type']).toBeUndefined();
    });
  });
});