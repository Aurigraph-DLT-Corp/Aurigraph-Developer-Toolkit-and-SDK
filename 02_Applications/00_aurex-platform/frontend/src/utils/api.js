// API utilities for backend integration
class APIClient {
    constructor() {
        Object.defineProperty(this, "baseURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/api/platform' : 'http://localhost:8000');
        this.apiKey = import.meta.env.VITE_API_KEY;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const config = {
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
        }
        catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Contact form submission
    async submitContactForm(formData) {
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
    async submitDemoRequest(formData) {
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
    async subscribeNewsletter(formData) {
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
    async requestResourceDownload(resourceId, email) {
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
    async trackInteraction(eventData) {
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
    getPlatformAuthURL(returnTo) {
        const baseURL = import.meta.env.VITE_PLATFORM_AUTH_URL || `${this.baseURL}/auth`;
        const params = new URLSearchParams();
        if (returnTo) {
            params.set('return_to', returnTo);
        }
        params.set('source', 'landing_page');
        return `${baseURL}/login?${params.toString()}`;
    }
    // Get platform signup URL
    getPlatformSignupURL(planType, source) {
        const baseURL = import.meta.env.VITE_PLATFORM_AUTH_URL || `${this.baseURL}/auth`;
        const params = new URLSearchParams();
        if (planType) {
            params.set('plan', planType);
        }
        params.set('source', source || 'landing_page');
        return `${baseURL}/register?${params.toString()}`;
    }
    // Health check
    async healthCheck() {
        return this.request('/api/v1/health');
    }
}
// Create singleton instance
export const apiClient = new APIClient();
// Convenience functions
export const submitContactForm = (formData) => apiClient.submitContactForm(formData);
export const submitDemoRequest = (formData) => apiClient.submitDemoRequest(formData);
export const subscribeNewsletter = (formData) => apiClient.subscribeNewsletter(formData);
export const requestResourceDownload = (resourceId, email) => apiClient.requestResourceDownload(resourceId, email);
export const trackInteraction = (eventData) => apiClient.trackInteraction(eventData);
export const getPlatformAuthURL = (returnTo) => apiClient.getPlatformAuthURL(returnTo);
export const getPlatformSignupURL = (planType, source) => apiClient.getPlatformSignupURL(planType, source);
// Error handling helper
export const handleAPIError = (error) => {
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
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
};
export default apiClient;
