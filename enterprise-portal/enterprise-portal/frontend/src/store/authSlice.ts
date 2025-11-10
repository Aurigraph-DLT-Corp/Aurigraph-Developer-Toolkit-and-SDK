/**
 * Authentication Redux Slice
 *
 * Manages authentication state including:
 * - User information
 * - Session status
 * - Loading states
 * - Error messages
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  expiresIn: number | null;
  lastCheckTime: number | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionId: null,
  expiresIn: null,
  lastCheckTime: null,
};

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(username, password);
      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const verifySessionAsync = createAsyncThunk(
  'auth/verifySession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.verifySession();
      if (!response.authenticated) {
        return rejectWithValue('No active session');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Session verification failed');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.logout();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionId = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        state.sessionId = action.payload.sessionId || null;
        state.expiresIn = action.payload.expiresIn || null;
        state.lastCheckTime = Date.now();
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Verify Session
    builder
      .addCase(verifySessionAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifySessionAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        state.sessionId = action.payload.sessionId || null;
        state.expiresIn = action.payload.expiresIn || null;
        state.lastCheckTime = Date.now();
        state.error = null;
      })
      .addCase(verifySessionAsync.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        state.error = null; // Don't show error for initial session check
      });

    // Logout
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        state.expiresIn = null;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        // Still consider logout successful even if API call fails
        state.error = null;
      });
  },
});

export const { clearError, clearUser } = authSlice.actions;
export default authSlice.reducer;
