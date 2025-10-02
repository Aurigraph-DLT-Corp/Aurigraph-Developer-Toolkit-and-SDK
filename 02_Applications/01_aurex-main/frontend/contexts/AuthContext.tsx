/**
 * Authentication Context Provider for Aurex Platform
 *
 * Provides DB-based authentication context throughout the React application
 * with user state management, role-based access control, and authentication utilities.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useDBAuth, User } from '../hooks/useAuth';

// Authentication context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
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

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dbAuth = useDBAuth();

  // Role-based access control functions
  const hasRole = (role: string): boolean => {
    if (!dbAuth.user) return false;

    // For now, implement basic role checking
    // In a full implementation, roles would be stored in the database
    const userRoles = getUserRoles(dbAuth.user);
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!dbAuth.user) return false;

    const userRoles = getUserRoles(dbAuth.user);
    return roles.some(role => userRoles.includes(role));
  };

  const getToken = (): string | undefined => {
    return localStorage.getItem('aurex_auth_token') || undefined;
  };

  // Helper function to get user roles based on email domain or other criteria
  const getUserRoles = (user: User): string[] => {
    const roles: string[] = ['user']; // Default role

    // Add admin role for specific email domains
    if (user.email.endsWith('@aurigraph.io') || user.email.endsWith('@aurigraph.com')) {
      roles.push('admin', 'aurex-internal');
    }


    // Add more role logic as needed
    return roles;
  };

  const contextValue: AuthContextType = {
    user: dbAuth.user,
    token: getToken() || null,
    isAuthenticated: dbAuth.isAuthenticated,
    isLoading: dbAuth.isLoading,
    login: dbAuth.login,
    logout: dbAuth.logout,
    register: dbAuth.register,
    hasRole,
    hasAnyRole,
    getToken,
    error: dbAuth.error,
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

// Export for backward compatibility with existing Keycloak imports
export default AuthProvider;

// Type exports
export type { User, AuthContextType };
