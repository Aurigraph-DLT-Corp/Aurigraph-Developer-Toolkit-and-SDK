/**
 * API Client with JWT Token Interceptor
 *
 * Automatically includes JWT token in all API requests
 * Handles token refresh and 401 unauthorized responses
 */

import { authService } from './authService';
import { API_BASE_URL } from '../utils/constants';

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  baseURL?: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(
    path: string,
    options: FetchOptions = {}
  ): Promise<{ data: T; status: number }> {
    const { skipAuth = false, baseURL = this.baseUrl, ...fetchOptions } = options;

    const url = `${baseURL}${path}`;
    const headers = new Headers(fetchOptions.headers || {});

    // Add JWT token if available and not skipped
    if (!skipAuth) {
      const token = authService.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Ensure content-type
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Include cookies for session-based auth fallback
      });

      // Handle 401 - token might be expired
      if (response.status === 401 && !skipAuth) {
        console.warn('Received 401 - attempting token refresh');

        // Try to refresh token
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${baseURL}/api/v11/login/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${refreshToken}`,
              },
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const { token: newToken, refreshToken: newRefreshToken, user, expiresIn } = await refreshResponse.json();

              // Store new token
              if (newToken && user) {
                localStorage.setItem('auth_token', newToken);
                if (newRefreshToken) {
                  localStorage.setItem('auth_refresh_token', newRefreshToken);
                }
                localStorage.setItem('auth_user', JSON.stringify(user));
                if (expiresIn) {
                  const expiry = Date.now() + expiresIn * 1000;
                  localStorage.setItem('auth_expiry', expiry.toString());
                }

                // Retry original request with new token
                headers.set('Authorization', `Bearer ${newToken}`);
                const retryResponse = await fetch(url, {
                  ...fetchOptions,
                  headers,
                  credentials: 'include',
                });

                const data = await this.parseResponse<T>(retryResponse);
                return { data, status: retryResponse.status };
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }

        // Refresh failed or no refresh token - dispatch logout
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        // Clear auth state
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_expiry');

        throw new Error('Unauthorized - session expired');
      }

      const data = await this.parseResponse<T>(response);
      return { data, status: response.status };
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(path: string, body?: any, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(path: string, body?: any, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.text()) as any;
  }
}

export const apiClient = new APIClient();
export default APIClient;
