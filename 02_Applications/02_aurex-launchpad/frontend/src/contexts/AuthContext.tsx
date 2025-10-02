/**
 * Enhanced Authentication Context Provider for Aurex Launchpad
 *
 * Provides JWT-based authentication context throughout the React application
 * with user state management, role-based access control, and authentication utilities.
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Authentication context interface
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signup: (email: string, password: string, organizationName?: string, role?: string) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getToken: () => string | undefined;
  error: string | null;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider props
interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:8001';

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        await validateToken(storedToken);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Failed to initialize authentication');
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(token);
        setError(null);
        setIsLoading(false);
        return true;
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return false;
    }
  };

  // Email/password login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

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
          setUser(user);
          setToken(data.access_token);
          setError(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function (maps to backend register endpoint)
  const signup = async (email: string, password: string, organizationName?: string, role?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Extract first and last name from email if not provided separately
      const [firstName, lastName] = email.split('@')[0].split('.').length > 1 
        ? email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1))
        : [email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1), 'User'];

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password, 
          first_name: firstName,
          last_name: lastName,
          organization_name: organizationName
        })
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
          setUser(user);
          setToken(data.access_token);
          setError(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy register function for backward compatibility  
  const register = signup;

  // Logout
  const logout = async (): Promise<void> => {
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
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  // Role-based access control functions
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || getUserRoles(user).includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    const userRoles = getUserRoles(user);
    return roles.some(role => userRoles.includes(role));
  };

  const getToken = (): string | undefined => {
    return localStorage.getItem('access_token') || undefined;
  };

  // Helper function to get user roles based on email domain or other criteria
  const getUserRoles = (user: User): string[] => {
    const roles: string[] = ['user']; // Default role

    // Add admin role for specific email domains
    if (user.email.endsWith('@aurigraph.io') || user.email.endsWith('@aurigraph.com')) {
      roles.push('admin', 'aurex-internal');
    }

    // Add role from user object
    if (user.role && !roles.includes(user.role)) {
      roles.push(user.role);
    }

    return roles;
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    signup,
    hasRole,
    hasAnyRole,
    getToken,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for backward compatibility
export default AuthProvider;

// Type exports
export type { AuthContextType };