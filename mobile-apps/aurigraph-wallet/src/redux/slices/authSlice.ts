/**
 * Auth Redux Slice
 * Manages authentication state (login, user info, etc.)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    name: string
  } | null
  token: string | null
  isLoading: boolean
  error: string | null
  biometricEnabled: boolean
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  biometricEnabled: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login user
    login: (
      state,
      action: PayloadAction<{
        user: { id: string; email: string; name: string }
        token: string
      }>
    ) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.isLoading = false
      state.error = null
    },

    // Logout user
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.biometricEnabled = false
      state.error = null
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Enable biometric
    enableBiometric: (state) => {
      state.biometricEnabled = true
    },

    // Disable biometric
    disableBiometric: (state) => {
      state.biometricEnabled = false
    },

    // Update user
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },

    // Restore auth state (from storage)
    restoreAuth: (
      state,
      action: PayloadAction<{
        isAuthenticated: boolean
        user: AuthState['user']
        token: string | null
        biometricEnabled: boolean
      }>
    ) => {
      state.isAuthenticated = action.payload.isAuthenticated
      state.user = action.payload.user
      state.token = action.payload.token
      state.biometricEnabled = action.payload.biometricEnabled
    },
  },
})

export const {
  login,
  logout,
  setLoading,
  setError,
  enableBiometric,
  disableBiometric,
  updateUser,
  clearError,
  restoreAuth,
} = authSlice.actions

export default authSlice.reducer
