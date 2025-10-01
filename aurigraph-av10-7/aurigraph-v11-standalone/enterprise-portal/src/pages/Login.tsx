import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, TextField, Button, Typography, Alert } from '@mui/material'
import { useAppDispatch } from '../hooks'
import { loginSuccess } from '../store/authSlice'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Demo login - in production, this would call the API
    if (username === 'admin' && password === 'admin') {
      dispatch(loginSuccess({
        user: { id: '1', username: 'admin', role: 'admin' },
        token: 'demo-token-' + Date.now()
      }))
      navigate('/')
    } else {
      setError('Invalid credentials. Use admin/admin for demo.')
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
            sx={{
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00A693' }
            }}
          >
            Login
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Demo: Use admin/admin to login
        </Typography>
      </Card>
    </Box>
  )
}