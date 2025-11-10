/**
 * Authentication Service
 *
 * Handles all authentication-related API calls including:
 * - User login/logout
 * - Session verification
 * - JWT token management
 * - CSRF protection
 */

import { API_BASE_URL } from '../utils/constants';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
  sessionId?: string;
  expiresIn?: number;
  message?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
  sessionId?: string;
  expiresIn?: number;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const EXPIRY_KEY = 'auth_expiry';

class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get stored user data
   */
  getStoredUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    try {
      const expiryStr = localStorage.getItem(EXPIRY_KEY);
      if (!expiryStr) return true;
      const expiry = parseInt(expiryStr, 10);
      return Date.now() >= expiry;
    } catch {
      return true;
    }
  }

  /**
   * Store JWT token and user data
   */
  private storeToken(token: string, refreshToken?: string, expiresIn?: number, user?: any) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      if (expiresIn) {
        const expiry = Date.now() + expiresIn * 1000;
        localStorage.setItem(EXPIRY_KEY, expiry.toString());
      }
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Clear all stored authentication data
   */
  private clearStorage() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Login with username and password
   * Returns JWT token for stateless authentication
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v11/login/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Login failed: ${response.statusText}`);
      }

      const data: LoginResponse = await response.json();

      // Store JWT token for subsequent requests
      if (data.token) {
        this.storeToken(data.token, data.refreshToken, data.expiresIn, data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify if user has an active session
   * Called on app initialization to restore session
   */
  async verifySession(): Promise<SessionResponse> {
    try {
      const token = this.getToken();
      const storedUser = this.getStoredUser();

      // If token exists and not expired, return stored session
      if (token && !this.isTokenExpired()) {
        return {
          authenticated: true,
          token,
          user: storedUser,
        };
      }

      // Try to refresh token if we have refresh token
      const refreshToken = this.getRefreshToken();
      if (refreshToken && !this.isTokenExpired()) {
        try {
          const refreshed = await this.refreshTokenAsync(refreshToken);
          if (refreshed.token) {
            this.storeToken(refreshed.token, refreshed.refreshToken, refreshed.expiresIn, refreshed.user);
            return {
              authenticated: true,
              token: refreshed.token,
              user: refreshed.user,
            };
          }
        } catch (err) {
          console.warn('Token refresh failed:', err);
        }
      }

      // Fall back to server verification
      const response = await fetch(`${this.baseUrl}/api/v11/login/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // 401 indicates no valid session
        if (response.status === 401) {
          this.clearStorage();
          return { authenticated: false };
        }
        throw new Error(`Session verification failed: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();

      // Store token if returned
      if (data.token && data.user) {
        this.storeToken(data.token, undefined, data.expiresIn, data.user);
      }

      return data;
    } catch (error) {
      console.error('Session verification error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Refresh JWT token
   */
  private async refreshTokenAsync(refreshToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v11/login/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.baseUrl}/api/v11/login/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      const data: LogoutResponse = await response.json();

      // Clear tokens regardless of server response
      this.clearStorage();

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local storage and return success for logout
      this.clearStorage();
      return { success: true, message: 'Logged out' };
    }
  }

  /**
   * Create HTTP interceptor for authenticated requests
   * Automatically includes credentials with all API calls
   */
  createAuthInterceptor() {
    return {
      request: (config: any) => {
        // Include credentials with all requests
        config.credentials = 'include';
        return config;
      },
      response: (response: any) => {
        return response;
      },
      error: (error: any) => {
        // Handle 401 errors - session expired
        if (error.response?.status === 401) {
          // Dispatch logout action to clear state
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
      },
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default AuthService;
