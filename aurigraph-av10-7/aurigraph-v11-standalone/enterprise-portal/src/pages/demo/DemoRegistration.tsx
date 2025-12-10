/**
 * Demo Registration Page
 *
 * User registration for Demo Token Experience with privacy consent.
 * User data is persisted and shared with Aurigraph Hermes for follow-up.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  Divider,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Chip,
} from '@mui/material'
import {
  Person,
  Email,
  Business,
  Phone,
  CheckCircle,
  Info,
  Security,
  PlayArrow,
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

// Demo User Storage Key
const DEMO_USER_STORAGE_KEY = 'aurigraph_demo_user'

export interface DemoUser {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  jobTitle: string
  phone: string
  country: string
  interests: string[]
  consents: {
    termsAccepted: boolean
    privacyAccepted: boolean
    cookiesAccepted: boolean
    marketingConsent: boolean
    dataShareConsent: boolean
  }
  registeredAt: Date
  lastActiveAt: Date
}

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Canada',
  'Australia', 'Japan', 'Singapore', 'India', 'United Arab Emirates',
  'Switzerland', 'Netherlands', 'Sweden', 'Ireland', 'Other'
]

const INTERESTS = [
  'Real Estate Tokenization',
  'Digital Art & NFTs',
  'Trade Finance',
  'Carbon Credits',
  'Securities & Bonds',
  'Supply Chain Finance',
  'Intellectual Property',
  'DeFi Integration',
]

export default function DemoRegistration() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [existingUser, setExistingUser] = useState<DemoUser | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    country: '',
    interests: [] as string[],
  })

  const [consents, setConsents] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    cookiesAccepted: false,
    marketingConsent: false,
    dataShareConsent: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check for existing registration
    const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY)
    if (stored) {
      try {
        const user = JSON.parse(stored) as DemoUser
        setExistingUser(user)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
  }, [])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format'
      }
      if (!formData.company.trim()) newErrors.company = 'Company is required'
    }

    if (step === 1) {
      if (!consents.termsAccepted) newErrors.terms = 'You must accept the Terms and Conditions'
      if (!consents.privacyAccepted) newErrors.privacy = 'You must accept the Privacy Policy'
      if (!consents.dataShareConsent) newErrors.dataShare = 'You must consent to data sharing to use the demo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) return

    setLoading(true)

    const user: DemoUser = {
      id: `demo_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
      consents,
      registeredAt: new Date(),
      lastActiveAt: new Date(),
    }

    // Store locally
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user))

    // Send to backend (Aurigraph Hermes integration)
    try {
      await fetch('/api/v11/demo/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
    } catch (e) {
      console.log('Backend registration (demo mode):', e)
    }

    setLoading(false)
    navigate('/demo/token-experience')
  }

  const handleContinueExisting = () => {
    if (existingUser) {
      // Update last active
      existingUser.lastActiveAt = new Date()
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(existingUser))
      navigate('/demo/token-experience')
    }
  }

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  // Show existing user option
  if (existingUser) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Card sx={CARD_STYLE}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: THEME_COLORS.primary, mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>
                Welcome Back!
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                You're already registered for the Demo Experience
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Registered as:
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                {existingUser.firstName} {existingUser.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {existingUser.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {existingUser.company}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleContinueExisting}
              sx={{ bgcolor: THEME_COLORS.primary, mb: 2 }}
            >
              Continue to Demo Experience
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setExistingUser(null)}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}
            >
              Register with Different Account
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card sx={CARD_STYLE}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ color: '#fff', mb: 1, textAlign: 'center' }}>
            Register for Demo Experience
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, textAlign: 'center' }}>
            Experience the complete tokenization workflow with our interactive demo
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {['Your Details', 'Consent & Privacy'].map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      color: index <= activeStep ? THEME_COLORS.primary : 'rgba(255,255,255,0.3)',
                    },
                  }}
                  sx={{ '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' } }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    InputProps={{ startAdornment: <Person sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{ startAdornment: <Email sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    value={formData.company}
                    onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    error={!!errors.company}
                    helperText={errors.company}
                    InputProps={{ startAdornment: <Business sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={e => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone (Optional)"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    InputProps={{ startAdornment: <Phone sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Country"
                    value={formData.country}
                    onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                  >
                    {COUNTRIES.map(country => (
                      <MenuItem key={country} value={country}>{country}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Areas of Interest (Optional)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {INTERESTS.map(interest => (
                      <Chip
                        key={interest}
                        label={interest}
                        onClick={() => handleInterestToggle(interest)}
                        sx={{
                          bgcolor: formData.interests.includes(interest)
                            ? THEME_COLORS.primary
                            : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          '&:hover': { bgcolor: formData.interests.includes(interest) ? THEME_COLORS.secondary : 'rgba(255,255,255,0.2)' },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ bgcolor: THEME_COLORS.primary }}
                >
                  Next: Consent & Privacy
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(52, 152, 219, 0.1)', color: '#fff' }}>
                <Typography variant="body2">
                  By registering, your information will be shared with <strong>Aurigraph DLT Corp</strong> and its
                  subsidiary <strong>Aurigraph Hermes</strong> for the purpose of providing the demo experience
                  and potential follow-up communications.
                </Typography>
              </Alert>

              <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 2, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.termsAccepted}
                      onChange={e => setConsents(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      I accept the{' '}
                      <Link component={RouterLink} to="/legal/terms" target="_blank" sx={{ color: THEME_COLORS.primary }}>
                        Terms and Conditions
                      </Link>
                      {' '}*
                    </Typography>
                  }
                />
                {errors.terms && <Typography variant="caption" sx={{ color: THEME_COLORS.error, display: 'block', ml: 4 }}>{errors.terms}</Typography>}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.privacyAccepted}
                      onChange={e => setConsents(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      I accept the{' '}
                      <Link component={RouterLink} to="/legal/privacy" target="_blank" sx={{ color: THEME_COLORS.primary }}>
                        Privacy Policy
                      </Link>
                      {' '}*
                    </Typography>
                  }
                />
                {errors.privacy && <Typography variant="caption" sx={{ color: THEME_COLORS.error, display: 'block', ml: 4 }}>{errors.privacy}</Typography>}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.cookiesAccepted}
                      onChange={e => setConsents(prev => ({ ...prev, cookiesAccepted: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      I accept the{' '}
                      <Link component={RouterLink} to="/legal/cookies" target="_blank" sx={{ color: THEME_COLORS.primary }}>
                        Cookie Policy
                      </Link>
                    </Typography>
                  }
                />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.dataShareConsent}
                      onChange={e => setConsents(prev => ({ ...prev, dataShareConsent: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      I consent to my data being shared with <strong>Aurigraph DLT Corp</strong> and <strong>Aurigraph Hermes</strong>
                      for demo purposes and business communications *
                    </Typography>
                  }
                />
                {errors.dataShare && <Typography variant="caption" sx={{ color: THEME_COLORS.error, display: 'block', ml: 4 }}>{errors.dataShare}</Typography>}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.marketingConsent}
                      onChange={e => setConsents(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      I would like to receive product updates, news, and marketing communications (optional)
                    </Typography>
                  }
                />
              </Box>

              <Alert severity="warning" icon={<Security />} sx={{ mb: 3, bgcolor: 'rgba(255, 217, 61, 0.1)', color: '#fff' }}>
                <Typography variant="body2">
                  <strong>Data Protection Notice:</strong> Your data is processed in accordance with GDPR, CCPA,
                  and other applicable privacy laws. You can request data deletion at any time by contacting
                  privacy@aurigraph.io
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                  sx={{ bgcolor: THEME_COLORS.primary }}
                >
                  {loading ? 'Registering...' : 'Start Demo Experience'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

// Export user service functions
export const DemoUserService = {
  getUser: (): DemoUser | null => {
    const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as DemoUser
      } catch {
        return null
      }
    }
    return null
  },

  updateLastActive: () => {
    const user = DemoUserService.getUser()
    if (user) {
      user.lastActiveAt = new Date()
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user))
    }
  },

  clearUser: () => {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY)
  },

  isRegistered: (): boolean => {
    return DemoUserService.getUser() !== null
  },
}
