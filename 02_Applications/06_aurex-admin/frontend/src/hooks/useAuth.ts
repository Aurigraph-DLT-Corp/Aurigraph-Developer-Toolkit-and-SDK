import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return
        }

        // Validate token with backend (mock for now)
        // const response = await fetch('/api/auth/validate', {
        //   headers: { Authorization: `Bearer ${token}` }
        // })
        
        // Mock validation - in production, validate with backend
        const mockUser: User = {
          id: '1',
          email: 'admin@aurigraph.io',
          name: 'Admin User',
          role: 'admin',
        }

        setAuthState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('token')
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Mock login - in production, authenticate with backend
      if (email === 'admin@aurigraph.io' && password === 'admin123') {
        const mockToken = 'mock-jwt-token-' + Date.now()
        const mockUser: User = {
          id: '1',
          email: 'admin@aurigraph.io',
          name: 'Admin User',
          role: 'admin',
        }

        localStorage.setItem('token', mockToken)
        setAuthState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }

      throw new Error('Invalid credentials')
    } catch (error) {
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Clear token and user data
      localStorage.removeItem('token')
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
  }
}