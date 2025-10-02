import config from '../config/env.jsx';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Base API client class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || data?.detail || `HTTP error! status: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse<T>(response);
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

// Create API client instances
export const apiClient = new ApiClient(config.API_BASE_URL);
export const apiClientV1 = new ApiClient(config.API_URL);

// Custom error class
class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export { ApiError };

// Utility functions for common API operations
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  defaultValue?: T
): Promise<T | undefined> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    
    if (config.IS_DEV) {
      console.error('Error details:', error);
    }
    
    return defaultValue;
  }
};

export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError;
};

// Request interceptor (for future use)
export const addRequestInterceptor = (interceptor: (config: any) => any) => {
  // Implementation would go here for request intercepting
  console.log('Request interceptor added:', interceptor);
};

// Response interceptor (for future use)
export const addResponseInterceptor = (interceptor: (response: any) => any) => {
  // Implementation would go here for response intercepting
  console.log('Response interceptor added:', interceptor);
};

export default apiClient;