import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fastApiService } from '../services/fastApiService';

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AssessmentAuthContext = createContext<AuthContextType | undefined>(undefined);

interface AssessmentAuthProviderProps {
  children: ReactNode;
}

export const AssessmentAuthProvider: React.FC<AssessmentAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('assessment_auth_token');
        if (token) {
          // Validate token with FastAPI backend
          try {
            const userData = await fastApiService.getCurrentUser(token);
            setUser({
              id: userData.id.toString(),
              email: userData.email,
              name: userData.name,
              provider: userData.provider,
              createdAt: userData.created_at
            });
          } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('assessment_auth_token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('assessment_auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use FastAPI exclusively
      const response = await fastApiService.login(email, password);
      setUser({
        id: response.user.id.toString(),
        email: response.user.email,
        name: response.user.name,
        provider: response.user.provider,
        createdAt: response.user.created_at
      });

      // Store token for future requests
      localStorage.setItem('assessment_auth_token', response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use FastAPI exclusively
      const response = await fastApiService.register(name, email, password);
      setUser({
        id: response.user.id.toString(),
        email: response.user.email,
        name: response.user.name,
        provider: response.user.provider,
        createdAt: response.user.created_at
      });

      // Store token for future requests
      localStorage.setItem('assessment_auth_token', response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem('assessment_auth_token');
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AssessmentAuthContext.Provider value={value}>
      {children}
    </AssessmentAuthContext.Provider>
  );
};

export const useAssessmentAuth = (): AuthContextType => {
  const context = useContext(AssessmentAuthContext);
  if (context === undefined) {
    throw new Error('useAssessmentAuth must be used within an AssessmentAuthProvider');
  }
  return context;
};
