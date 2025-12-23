import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    username: string
    role: string
  } | null
  token: string | null
}

// Check if user was previously authenticated (with fallback for incognito mode)
let savedToken = null
let savedUser = null

try {
  savedToken = localStorage.getItem('auth_token')
  savedUser = localStorage.getItem('auth_user')
} catch (e) {
  // localStorage may be unavailable in incognito mode or private browsing
  console.warn('⚠️ localStorage unavailable (incognito mode?), using session-only auth')
}

// Safely parse saved user data
let parsedUser = null
if (savedUser) {
  try {
    parsedUser = JSON.parse(savedUser)
  } catch (e) {
    console.warn('⚠️ Failed to parse saved user data, clearing auth state')
    // Clear invalid data
    try {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
    } catch (err) {
      // Ignore localStorage errors (incognito mode)
    }
  }
}

const initialState: AuthState = {
  isAuthenticated: !!savedToken && !!parsedUser, // Only authenticated if BOTH token and user exist
  isLoading: false, // Auth initialization complete immediately for demo
  user: parsedUser,
  token: savedToken,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      // Persist to localStorage for session continuity (with fallback for incognito mode)
      try {
        localStorage.setItem('auth_token', action.payload.token)
        localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
      } catch (e) {
        // localStorage unavailable in incognito mode - auth will work for this session only
        console.warn('⚠️ Unable to persist auth to localStorage (incognito mode?)')
      }
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      // Clear all auth data from localStorage (with fallback for incognito mode)
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } catch (e) {
        // localStorage unavailable - no action needed
        console.warn('⚠️ Unable to clear localStorage (incognito mode?)')
      }
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer