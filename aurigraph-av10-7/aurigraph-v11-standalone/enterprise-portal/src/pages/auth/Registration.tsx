/**
 * User Registration Page
 *
 * Allows new users to create an account on the Aurigraph V12 platform.
 * Includes form validation, password strength indicator, and legal compliance.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Divider,
} from '@mui/material'
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  error: '#E74C3C',
}

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
  server?: string
}

// Password strength calculator
const calculatePasswordStrength = (password: string): number => {
  let strength = 0
  if (password.length >= 6) strength += 20
  if (password.length >= 10) strength += 20
  if (/[A-Z]/.test(password)) strength += 20
  if (/[a-z]/.test(password)) strength += 10
  if (/[0-9]/.test(password)) strength += 15
  if (/[^A-Za-z0-9]/.test(password)) strength += 15
  return Math.min(strength, 100)
}

const getStrengthColor = (strength: number): string => {
  if (strength < 30) return THEME_COLORS.error
  if (strength < 60) return THEME_COLORS.warning
  return THEME_COLORS.primary
}

const getStrengthLabel = (strength: number): string => {
  if (strength < 30) return 'Weak'
  if (strength < 60) return 'Medium'
  if (strength < 80) return 'Strong'
  return 'Very Strong'
}

export default function Registration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const passwordStrength = calculatePasswordStrength(formData.password)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be at most 50 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Terms validation
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the Terms of Service'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/v12/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        const data = await response.json()
        setErrors({
          server: data.message || 'Registration failed. Please try again.'
        })
      }
    } catch (error) {
      setErrors({
        server: 'Unable to connect to server. Please try again later.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)'
      }}>
        <Card sx={{ ...CARD_STYLE, p: 4, textAlign: 'center', maxWidth: 400 }}>
          <CheckCircle sx={{ fontSize: 64, color: THEME_COLORS.primary, mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
            Registration Successful!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Your account has been created. Redirecting to login...
          </Typography>
          <CircularProgress size={24} sx={{ color: THEME_COLORS.primary }} />
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)'
    }}>
      <Card sx={{ ...CARD_STYLE, width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
              Create Account
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Join Aurigraph V12 Platform
            </Typography>
          </Box>

          {errors.server && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.server}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              }}
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              }}
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              }}
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Password Strength
                  </Typography>
                  <Typography variant="caption" sx={{ color: getStrengthColor(passwordStrength) }}>
                    {getStrengthLabel(passwordStrength)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStrengthColor(passwordStrength),
                    },
                  }}
                />
              </Box>
            )}

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              }}
            />

            {/* Terms Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  sx={{
                    color: THEME_COLORS.primary,
                    '&.Mui-checked': { color: THEME_COLORS.primary },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  I agree to the{' '}
                  <Link
                    component={RouterLink}
                    to="/legal/terms"
                    target="_blank"
                    sx={{ color: THEME_COLORS.primary }}
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link
                    component={RouterLink}
                    to="/legal/privacy"
                    target="_blank"
                    sx={{ color: THEME_COLORS.primary }}
                  >
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mb: 1 }}
            />
            {errors.terms && (
              <Typography variant="caption" sx={{ color: THEME_COLORS.error, display: 'block', mb: 2 }}>
                {errors.terms}
              </Typography>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                bgcolor: THEME_COLORS.primary,
                '&:hover': { bgcolor: THEME_COLORS.secondary },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Login Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ color: THEME_COLORS.primary }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mt: 2, color: 'rgba(255,255,255,0.5)' }}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
