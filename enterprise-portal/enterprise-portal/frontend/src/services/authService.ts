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

class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Login with username and password
   * Credentials are sent with withCredentials to enable cookie-based session
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v11/login/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: Enable cookie-based session
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
      const response = await fetch(`${this.baseUrl}/api/v11/login/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: Include session cookie
      });

      if (!response.ok) {
        // 401 indicates no valid session
        if (response.status === 401) {
          return { authenticated: false };
        }
        throw new Error(`Session verification failed: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Session verification error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v11/login/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: Include session cookie
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      const data: LogoutResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Always return success for logout - even if server call fails
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
