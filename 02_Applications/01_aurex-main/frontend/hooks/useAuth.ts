import { useState, useEffect } from 'react';

// Types for authentication
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  applications: string[];
  isActive: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_BASE_URL = 'http://localhost:8000';

// Authentication service
class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const token = localStorage.getItem('access_token');
      if (token) {
        await this.validateToken(token);
      } else {
        this.updateState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.updateState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.updateState({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('aurex_auth_token');
      this.updateState({ isLoading: false });
      return false;
    }
  }

  private updateState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return this.authState;
  }


  // Email/password registration
  async register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      if (response.ok) {
        const data = await response.json();

        // Store the tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (profileResponse.ok) {
          const user = await profileResponse.json();
          this.updateState({
            user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  // Email/password login
  async login(email: string, password: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();

        // Store the tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (profileResponse.ok) {
          const user = await profileResponse.json();
          this.updateState({
            user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Notify backend about logout
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.updateState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }

  // Get current token
  getToken(): string | undefined {
    return localStorage.getItem('access_token') || undefined;
  }
}

// React hook for using authentication
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() =>
    AuthService.getInstance().getState()
  );

  useEffect(() => {
    const authService = AuthService.getInstance();
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const authService = AuthService.getInstance();

  return {
    ...authState,
    register: (email: string, password: string, firstName: string, lastName: string) =>
      authService.register(email, password, firstName, lastName),
    login: (email: string, password: string) =>
      authService.login(email, password),
    logout: () => authService.logout(),
    getToken: () => authService.getToken()
  };
};


export type { User, AuthState };
