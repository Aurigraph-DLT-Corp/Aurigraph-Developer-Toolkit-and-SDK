/**
 * RWAT Interest Wizard
 *
 * Multi-step wizard to capture user interest in Real World Asset Tokenization use cases.
 * Requires authentication and records interests for follow-up.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  TextField,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Alert,
  Fade,
  Paper,
  Divider,
  IconButton,
} from '@mui/material'
import {
  Business,
  Home,
  AccountBalance,
  LocalShipping,
  Agriculture,
  Eco,
  Diamond,
  Palette,
  LocalGasStation,
  Water,
  Memory,
  Sailing,
  ArrowBack,
  ArrowForward,
  Check,
  Close,
  Star,
} from '@mui/icons-material'
import { useAppSelector } from '../hooks'

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  cardBg: 'rgba(26, 31, 58, 0.95)',
}

// RWAT Use Case Categories
const RWAT_CATEGORIES = [
  {
    id: 'REAL_ESTATE',
    name: 'Real Estate',
    icon: Home,
    description: 'Commercial and residential property tokenization',
    useCases: [
      { id: 'commercial_property', name: 'Commercial Property', description: 'Office buildings, retail spaces, warehouses' },
      { id: 'residential_property', name: 'Residential Property', description: 'Apartments, houses, condos' },
      { id: 'reit_tokens', name: 'REIT Tokens', description: 'Real Estate Investment Trust tokenization' },
      { id: 'fractional_ownership', name: 'Fractional Ownership', description: 'Shared ownership of high-value properties' },
    ],
  },
  {
    id: 'COMMODITIES',
    name: 'Commodities',
    icon: LocalShipping,
    description: 'Physical commodity tokenization',
    useCases: [
      { id: 'precious_metals', name: 'Precious Metals', description: 'Gold, silver, platinum tokens' },
      { id: 'agricultural', name: 'Agricultural Products', description: 'Grain, coffee, cocoa tokens' },
      { id: 'energy', name: 'Energy Resources', description: 'Oil, natural gas tokens' },
      { id: 'industrial_metals', name: 'Industrial Metals', description: 'Copper, aluminum, steel tokens' },
    ],
  },
  {
    id: 'CARBON_CREDITS',
    name: 'Carbon Credits',
    icon: Eco,
    description: 'Environmental asset tokenization',
    useCases: [
      { id: 'verified_credits', name: 'Verified Carbon Credits', description: 'VCU tokens from certified projects' },
      { id: 'renewable_energy', name: 'Renewable Energy Certificates', description: 'RECs and green energy tokens' },
      { id: 'biodiversity', name: 'Biodiversity Credits', description: 'Conservation and restoration tokens' },
      { id: 'water_credits', name: 'Water Credits', description: 'Water usage and conservation tokens' },
    ],
  },
  {
    id: 'FINANCIAL_INSTRUMENTS',
    name: 'Financial Instruments',
    icon: AccountBalance,
    description: 'Traditional finance asset tokenization',
    useCases: [
      { id: 'bonds', name: 'Bonds', description: 'Government and corporate bond tokens' },
      { id: 'equities', name: 'Equities', description: 'Stock and share tokenization' },
      { id: 'fund_shares', name: 'Fund Shares', description: 'ETF and mutual fund tokens' },
      { id: 'invoices', name: 'Invoice Financing', description: 'Trade receivables tokenization' },
    ],
  },
  {
    id: 'COLLECTIBLES',
    name: 'Art & Collectibles',
    icon: Palette,
    description: 'High-value collectible tokenization',
    useCases: [
      { id: 'fine_art', name: 'Fine Art', description: 'Paintings, sculptures, digital art' },
      { id: 'luxury_goods', name: 'Luxury Goods', description: 'Watches, jewelry, designer items' },
      { id: 'classic_cars', name: 'Classic Cars', description: 'Vintage and collector vehicles' },
      { id: 'wine_spirits', name: 'Wine & Spirits', description: 'Fine wine and rare spirits' },
    ],
  },
  {
    id: 'INFRASTRUCTURE',
    name: 'Infrastructure',
    icon: Business,
    description: 'Infrastructure project tokenization',
    useCases: [
      { id: 'renewable_projects', name: 'Renewable Energy Projects', description: 'Solar, wind, hydro installations' },
      { id: 'transportation', name: 'Transportation', description: 'Roads, bridges, ports' },
      { id: 'utilities', name: 'Utilities', description: 'Power plants, water treatment' },
      { id: 'telecom', name: 'Telecommunications', description: 'Cell towers, data centers' },
    ],
  },
]

const STEPS = ['Select Categories', 'Choose Use Cases', 'Additional Details', 'Confirm & Submit']

interface SelectedInterests {
  categories: string[]
  useCases: string[]
  investmentRange: string
  timeline: string
  additionalNotes: string
  wantDemo: boolean
  wantContact: boolean
}

interface RWATInterestWizardProps {
  onComplete?: (interests: SelectedInterests) => void
  onClose?: () => void
}

export default function RWATInterestWizard({ onComplete, onClose }: RWATInterestWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const token = useAppSelector(state => state.auth.token)

  const [interests, setInterests] = useState<SelectedInterests>({
    categories: [],
    useCases: [],
    investmentRange: '',
    timeline: '',
    additionalNotes: '',
    wantDemo: false,
    wantContact: false,
  })

  const handleCategoryToggle = (categoryId: string) => {
    setInterests(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId],
    }))
  }

  const handleUseCaseToggle = (useCaseId: string) => {
    setInterests(prev => ({
      ...prev,
      useCases: prev.useCases.includes(useCaseId)
        ? prev.useCases.filter(u => u !== useCaseId)
        : [...prev.useCases, useCaseId],
    }))
  }

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      handleSubmit()
    } else {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Submit each selected use case as an interest
      for (const useCase of interests.useCases) {
        const category = RWAT_CATEGORIES.find(c =>
          c.useCases.some(u => u.id === useCase)
        )

        const actionType = interests.wantContact
          ? 'CONTACT_REQUEST'
          : interests.wantDemo
            ? 'DEMO_START'
            : 'INQUIRY'

        await fetch('/api/v12/interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: category?.id || 'REAL_WORLD_ASSETS',
            useCase: useCase,
            actionType: actionType,
            source: 'rwat_wizard',
            metadata: JSON.stringify({
              investmentRange: interests.investmentRange,
              timeline: interests.timeline,
              notes: interests.additionalNotes,
              wantDemo: interests.wantDemo,
              wantContact: interests.wantContact,
            }),
          }),
        })
      }

      setSuccess(true)
      if (onComplete) {
        onComplete(interests)
      }
    } catch (err) {
      setError('Failed to submit your interests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return interests.categories.length > 0
      case 1:
        return interests.useCases.length > 0
      case 2:
        return true // Details are optional
      case 3:
        return true
      default:
        return false
    }
  }

  const getSelectedUseCases = () => {
    return RWAT_CATEGORIES
      .filter(c => interests.categories.includes(c.id))
      .flatMap(c => c.useCases)
  }

  if (!isAuthenticated) {
    return (
      <Card sx={{ background: THEME_COLORS.cardBg, p: 4 }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          Sign In Required
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          Please sign in to explore our RWA Tokenization use cases and register your interest.
        </Typography>
        <Button
          variant="contained"
          href="/login"
          sx={{ bgcolor: THEME_COLORS.primary }}
        >
          Sign In
        </Button>
      </Card>
    )
  }

  if (success) {
    return (
      <Fade in>
        <Card sx={{ background: THEME_COLORS.cardBg, p: 4, textAlign: 'center' }}>
          <Check sx={{ fontSize: 64, color: THEME_COLORS.primary, mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
            Thank You for Your Interest!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            We've recorded your interests in our RWA Tokenization solutions.
            {interests.wantContact && ' Our team will contact you shortly.'}
            {interests.wantDemo && ' We\'ll reach out to schedule a demo.'}
          </Typography>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ color: THEME_COLORS.primary, borderColor: THEME_COLORS.primary }}
          >
            Close
          </Button>
        </Card>
      </Fade>
    )
  }

  return (
    <Card sx={{ background: THEME_COLORS.cardBg, maxWidth: 900, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#fff' }}>
            Explore RWAT Use Cases
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              <Close />
            </IconButton>
          )}
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiStepLabel-label.Mui-active': { color: THEME_COLORS.primary },
                  '& .MuiStepLabel-label.Mui-completed': { color: THEME_COLORS.secondary },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Progress */}
        <LinearProgress
          variant="determinate"
          value={(activeStep / (STEPS.length - 1)) * 100}
          sx={{
            mb: 4,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { bgcolor: THEME_COLORS.primary },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {/* Step 0: Select Categories */}
          {activeStep === 0 && (
            <Fade in>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  Select the asset categories you're interested in tokenizing:
                </Typography>
                <Grid container spacing={2}>
                  {RWAT_CATEGORIES.map(category => {
                    const Icon = category.icon
                    const isSelected = interests.categories.includes(category.id)
                    return (
                      <Grid item xs={12} sm={6} md={4} key={category.id}>
                        <Paper
                          onClick={() => handleCategoryToggle(category.id)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'rgba(0, 191, 165, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: isSelected ? `2px solid ${THEME_COLORS.primary}` : '2px solid transparent',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'rgba(0, 191, 165, 0.1)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Icon sx={{ color: isSelected ? THEME_COLORS.primary : 'rgba(255,255,255,0.5)', mr: 1 }} />
                            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                              {category.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {category.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            </Fade>
          )}

          {/* Step 1: Choose Use Cases */}
          {activeStep === 1 && (
            <Fade in>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  Select specific use cases that match your needs:
                </Typography>
                {RWAT_CATEGORIES
                  .filter(c => interests.categories.includes(c.id))
                  .map(category => (
                    <Box key={category.id} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ color: THEME_COLORS.primary, mb: 2 }}>
                        {category.name}
                      </Typography>
                      <Grid container spacing={2}>
                        {category.useCases.map(useCase => {
                          const isSelected = interests.useCases.includes(useCase.id)
                          return (
                            <Grid item xs={12} sm={6} key={useCase.id}>
                              <Paper
                                onClick={() => handleUseCaseToggle(useCase.id)}
                                sx={{
                                  p: 2,
                                  cursor: 'pointer',
                                  bgcolor: isSelected ? 'rgba(0, 191, 165, 0.2)' : 'rgba(255,255,255,0.05)',
                                  border: isSelected ? `2px solid ${THEME_COLORS.primary}` : '2px solid transparent',
                                  borderRadius: 2,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 191, 165, 0.1)',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                                    {useCase.name}
                                  </Typography>
                                  {isSelected && <Check sx={{ color: THEME_COLORS.primary }} />}
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {useCase.description}
                                </Typography>
                              </Paper>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Box>
                  ))}
              </Box>
            </Fade>
          )}

          {/* Step 2: Additional Details */}
          {activeStep === 2 && (
            <Fade in>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  Help us understand your requirements better (optional):
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="Investment Range"
                  value={interests.investmentRange}
                  onChange={(e) => setInterests(prev => ({ ...prev, investmentRange: e.target.value }))}
                  SelectProps={{ native: true }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <option value="">Select...</option>
                  <option value="under_100k">Under $100,000</option>
                  <option value="100k_500k">$100,000 - $500,000</option>
                  <option value="500k_1m">$500,000 - $1,000,000</option>
                  <option value="1m_5m">$1,000,000 - $5,000,000</option>
                  <option value="5m_plus">$5,000,000+</option>
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Project Timeline"
                  value={interests.timeline}
                  onChange={(e) => setInterests(prev => ({ ...prev, timeline: e.target.value }))}
                  SelectProps={{ native: true }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <option value="">Select...</option>
                  <option value="immediate">Immediate (within 1 month)</option>
                  <option value="short_term">Short-term (1-3 months)</option>
                  <option value="medium_term">Medium-term (3-6 months)</option>
                  <option value="long_term">Long-term (6+ months)</option>
                  <option value="exploring">Just exploring</option>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Additional Notes or Requirements"
                  value={interests.additionalNotes}
                  onChange={(e) => setInterests(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  }}
                />

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={interests.wantDemo}
                      onChange={(e) => setInterests(prev => ({ ...prev, wantDemo: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={<Typography sx={{ color: '#fff' }}>I'd like to schedule a demo</Typography>}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={interests.wantContact}
                      onChange={(e) => setInterests(prev => ({ ...prev, wantContact: e.target.checked }))}
                      sx={{ color: THEME_COLORS.primary, '&.Mui-checked': { color: THEME_COLORS.primary } }}
                    />
                  }
                  label={<Typography sx={{ color: '#fff' }}>Please contact me to discuss further</Typography>}
                />
              </Box>
            </Fade>
          )}

          {/* Step 3: Confirm & Submit */}
          {activeStep === 3 && (
            <Fade in>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  Review your selections before submitting:
                </Typography>

                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: THEME_COLORS.primary, mb: 2 }}>
                    Selected Categories
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {interests.categories.map(catId => {
                      const category = RWAT_CATEGORIES.find(c => c.id === catId)
                      return (
                        <Chip
                          key={catId}
                          label={category?.name}
                          sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.primary }}
                        />
                      )
                    })}
                  </Box>

                  <Typography variant="h6" sx={{ color: THEME_COLORS.primary, mb: 2 }}>
                    Selected Use Cases ({interests.useCases.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {interests.useCases.map(ucId => {
                      const useCase = RWAT_CATEGORIES
                        .flatMap(c => c.useCases)
                        .find(u => u.id === ucId)
                      return (
                        <Chip
                          key={ucId}
                          label={useCase?.name}
                          size="small"
                          sx={{ bgcolor: 'rgba(78, 205, 196, 0.2)', color: THEME_COLORS.secondary }}
                        />
                      )
                    })}
                  </Box>

                  {(interests.investmentRange || interests.timeline) && (
                    <>
                      <Typography variant="h6" sx={{ color: THEME_COLORS.primary, mb: 2 }}>
                        Project Details
                      </Typography>
                      {interests.investmentRange && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          Investment Range: {interests.investmentRange.replace(/_/g, ' ')}
                        </Typography>
                      )}
                      {interests.timeline && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          Timeline: {interests.timeline.replace(/_/g, ' ')}
                        </Typography>
                      )}
                    </>
                  )}

                  {interests.additionalNotes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
                        Additional Notes
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {interests.additionalNotes}
                      </Typography>
                    </Box>
                  )}

                  {(interests.wantDemo || interests.wantContact) && (
                    <Box sx={{ mt: 2 }}>
                      {interests.wantDemo && (
                        <Chip
                          icon={<Star sx={{ color: '#FFD93D !important' }} />}
                          label="Demo Requested"
                          sx={{ mr: 1, bgcolor: 'rgba(255, 217, 61, 0.2)', color: '#FFD93D' }}
                        />
                      )}
                      {interests.wantContact && (
                        <Chip
                          icon={<Star sx={{ color: '#FFD93D !important' }} />}
                          label="Contact Requested"
                          sx={{ bgcolor: 'rgba(255, 217, 61, 0.2)', color: '#FFD93D' }}
                        />
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
            </Fade>
          )}
        </Box>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Back
          </Button>
          <Button
            endIcon={activeStep === STEPS.length - 1 ? <Check /> : <ArrowForward />}
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed() || loading}
            sx={{ bgcolor: THEME_COLORS.primary, '&:hover': { bgcolor: THEME_COLORS.secondary } }}
          >
            {loading ? 'Submitting...' : activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
