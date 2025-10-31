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

// Check if user was previously authenticated
const savedToken = localStorage.getItem('auth_token')
const savedUser = localStorage.getItem('auth_user')

const initialState: AuthState = {
  isAuthenticated: !!savedToken, // Set to true if token exists
  isLoading: false, // Auth initialization complete immediately for demo
  user: savedUser ? JSON.parse(savedUser) : null,
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
      // Persist to localStorage for session continuity
      localStorage.setItem('auth_token', action.payload.token)
      localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      // Clear all auth data from localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer