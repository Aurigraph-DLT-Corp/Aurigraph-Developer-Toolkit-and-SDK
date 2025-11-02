import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import { useAppDispatch } from '../hooks'
import { loginSuccess } from '../store/authSlice'

// API base URL - supports both development and production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9003/api/v11'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear previous errors
    setIsLoading(true)

    // Validate inputs
    if (!username.trim()) {
      setError('Username is required')
      setIsLoading(false)
      return
    }
    if (!password.trim()) {
      setError('Password is required')
      setIsLoading(false)
      return
    }

    try {
      console.log('🔐 Sending authentication request to backend...')

      // Call the backend authentication endpoint
      const response = await fetch(`${API_BASE_URL}/users/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      })

      console.log('📡 Backend response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }))
        const errorMessage = errorData.message || 'Invalid username or password'
        console.error('❌ Authentication failed:', errorMessage)
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      // Parse the response - expect: { user: {...}, token: "..." }
      const authResponse = await response.json()
      console.log('✅ Authentication successful for user:', authResponse.user.username)

      // Extract user and token from response
      const { user, token } = authResponse

      if (!token) {
        setError('No authentication token received from server')
        setIsLoading(false)
        return
      }

      // Dispatch login action to update Redux state
      dispatch(loginSuccess({
        user: {
          id: user.id,
          username: user.username,
          role: user.roleName
        },
        token: token
      }))

      console.log('✅ Login dispatched, navigating to dashboard...')

      // Navigate to dashboard
      navigate('/')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error. Please check if the backend is running.'
      console.error('❌ Login error:', errorMsg)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
      }}
    >
      <Card sx={{ p: 4, minWidth: 400, bgcolor: '#1A1F3A' }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', color: '#00BFA5' }}>
          Aurigraph V11 Portal
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          Release 2.0.0
        </Typography>

        <form onSubmit={handleLogin}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00A693' },
              '&:disabled': { bgcolor: 'rgba(0,191,165,0.5)' }
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: '#00BFA5' }} />
                Authenticating...
              </Box>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Test credentials: admin / AdminPassword123!
        </Typography>
      </Card>
    </Box>
  )
}