// API utilities for backend integration

// Type definitions for browser APIs
type RequestInitType = globalThis.RequestInit;
type HeadersInitType = globalThis.HeadersInit;

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ContactFormSubmission {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  interests: string[];
  consent: boolean;
}

export interface DemoRequestSubmission {
  name: string;
  email: string;
  company: string;
  role: string;
  phone?: string;
  employees: string;
  timeline: string;
  interests: string[];
  message?: string;
}

export interface NewsletterSubscription {
  email: string;
  interests?: string[];
  source?: string;
}

class APIClient {
  private baseURL: string;
  private apiKey?: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/api/platform' : 'http://localhost:8000');
    this.apiKey = import.meta.env.VITE_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInitType = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInitType = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInitType = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Contact form submission
  async submitContactForm(formData: ContactFormSubmission): Promise<APIResponse> {
    return this.request('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        source: 'landing_page',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Demo request submission
  async submitDemoRequest(formData: DemoRequestSubmission): Promise<APIResponse> {
    return this.request('/api/v1/demo-request', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        source: 'landing_page',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Newsletter subscription
  async subscribeNewsletter(formData: NewsletterSubscription): Promise<APIResponse> {
    return this.request('/api/v1/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        source: formData.source || 'landing_page',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Download resource (e.g., ESG guide)
  async requestResourceDownload(resourceId: string, email: string): Promise<APIResponse> {
    return this.request('/api/v1/resources/download', {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        email,
        source: 'landing_page',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Track user interaction
  async trackInteraction(eventData: {
    event: string;
    properties: Record<string, unknown>;
    user_id?: string;
    session_id?: string;
  }): Promise<APIResponse> {
    return this.request('/api/v1/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        ...eventData,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      }),
    });
  }

  // Get platform authentication URL
  getPlatformAuthURL(returnTo?: string): string {
    const baseURL = import.meta.env.VITE_PLATFORM_AUTH_URL || `${this.baseURL}/auth`;
    const params = new URLSearchParams();
    
    if (returnTo) {
      params.set('return_to', returnTo);
    }
    
    params.set('source', 'landing_page');
    
    return `${baseURL}/login?${params.toString()}`;
  }

  // Get platform signup URL
  getPlatformSignupURL(planType?: string, source?: string): string {
    const baseURL = import.meta.env.VITE_PLATFORM_AUTH_URL || `${this.baseURL}/auth`;
    const params = new URLSearchParams();
    
    if (planType) {
      params.set('plan', planType);
    }
    
    params.set('source', source || 'landing_page');
    
    return `${baseURL}/register?${params.toString()}`;
  }

  // Health check
  async healthCheck(): Promise<APIResponse> {
    return this.request('/api/v1/health');
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Convenience functions
export const submitContactForm = (formData: ContactFormSubmission) => 
  apiClient.submitContactForm(formData);

export const submitDemoRequest = (formData: DemoRequestSubmission) => 
  apiClient.submitDemoRequest(formData);

export const subscribeNewsletter = (formData: NewsletterSubscription) => 
  apiClient.subscribeNewsletter(formData);

export const requestResourceDownload = (resourceId: string, email: string) => 
  apiClient.requestResourceDownload(resourceId, email);

export const trackInteraction = (eventData: {
  event: string;
  properties: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
}) => apiClient.trackInteraction(eventData);

export const getPlatformAuthURL = (returnTo?: string) => 
  apiClient.getPlatformAuthURL(returnTo);

export const getPlatformSignupURL = (planType?: string, source?: string) => 
  apiClient.getPlatformSignupURL(planType, source);

// Error handling helper
export const handleAPIError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Retry mechanism for failed requests
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

export default apiClient;