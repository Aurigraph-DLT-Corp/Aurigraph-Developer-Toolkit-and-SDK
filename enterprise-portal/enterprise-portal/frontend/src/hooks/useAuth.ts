/**
 * useAuth Hook
 *
 * Custom hook for authentication state and actions
 * Simplifies auth management in components
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { loginAsync, logoutAsync, verifySessionAsync, clearError } from '../store/authSlice';
import type { RootState } from '../types/state';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);

  // Login handler
  const login = useCallback(
    async (username: string, password: string) => {
      return dispatch(loginAsync({ username, password }));
    },
    [dispatch]
  );

  // Logout handler
  const logout = useCallback(async () => {
    return dispatch(logoutAsync());
  }, [dispatch]);

  // Verify session on component mount
  const verifySession = useCallback(async () => {
    return dispatch(verifySessionAsync());
  }, [dispatch]);

  // Clear error messages
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Auto-verify session on mount
  useEffect(() => {
    verifySession();
  }, []);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    sessionId: auth.sessionId,
    expiresIn: auth.expiresIn,
    login,
    logout,
    verifySession,
    clearError: handleClearError,
  };
};

export default useAuth;
