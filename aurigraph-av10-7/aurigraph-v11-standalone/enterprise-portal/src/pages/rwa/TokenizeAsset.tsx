import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Rating,
} from '@mui/material'
import {
  CloudUpload,
  Description,
  AccountBalance,
  Palette,
  LocalShipping,
  Assessment,
  Info,
  AttachMoney,
  Hub,
  Park as EcoIcon,
  FlashOn as BoltIcon,
  Grass as AgricultureIcon,
  EmojiObjects as LightbulbIcon,
  Business,
  WaterDrop as WaterIcon,
  Diamond,
  VerifiedUser,
  CheckCircle,
  Schedule,
  Assignment,
  Security,
  Gavel,
  Person,
  Star,
} from '@mui/icons-material'
import { useState } from 'react'
import { apiService, safeApiCall } from '../../services/api'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
}

interface AssetForm {
  assetType: string
  assetName: string
  description: string
  value: string
  location: string
  documents: File[]
}

const ASSET_TYPES = [
  { value: 'real-estate', label: 'Real Estate', icon: <AccountBalance />, description: 'Commercial & residential properties' },
  { value: 'art', label: 'Art & Collectibles', icon: <Palette />, description: 'Fine art, antiques, rare items' },
  { value: 'commodities', label: 'Commodities', icon: <LocalShipping />, description: 'Precious metals, raw materials' },
  { value: 'securities', label: 'Securities', icon: <Assessment />, description: 'Stocks, bonds, financial instruments' },
  { value: 'carbon-credits', label: 'Carbon Credits', icon: <EcoIcon />, description: 'Verified emission reduction certificates' },
  { value: 'energy', label: 'Energy Assets', icon: <BoltIcon />, description: 'Renewable energy, power generation' },
  { value: 'agriculture', label: 'Agriculture', icon: <AgricultureIcon />, description: 'Farmland, crops, livestock' },
  { value: 'infrastructure', label: 'Infrastructure', icon: <Business />, description: 'Bridges, roads, utilities' },
  { value: 'intellectual-property', label: 'Intellectual Property', icon: <LightbulbIcon />, description: 'Patents, trademarks, copyrights' },
  { value: 'water-rights', label: 'Water Rights', icon: <WaterIcon />, description: 'Water usage & extraction rights' },
  { value: 'precious-metals', label: 'Precious Metals', icon: <Diamond />, description: 'Gold, silver, platinum reserves' },
  { value: 'aggregation', label: 'Aggregation Pool', icon: <Hub />, description: 'Bundle multiple assets into a single token' },
  { value: 'other', label: 'Other Assets', icon: <Description />, description: 'Custom asset types' },
]

// VVB (Verification & Validation Body) providers
const VVB_PROVIDERS = [
  { id: 'verra', name: 'Verra', rating: 4.8, specialization: 'Carbon Credits, Environmental', logo: '🌍', verified: 156 },
  { id: 'gold-standard', name: 'Gold Standard', rating: 4.9, specialization: 'Carbon, Sustainability', logo: '⭐', verified: 89 },
  { id: 'dnv', name: 'DNV GL', rating: 4.7, specialization: 'Energy, Infrastructure', logo: '🔬', verified: 234 },
  { id: 'sgx', name: 'SGX TAS', rating: 4.6, specialization: 'Securities, Real Estate', logo: '📊', verified: 178 },
  { id: 'deloitte', name: 'Deloitte Valuation', rating: 4.8, specialization: 'Art, IP, General', logo: '💼', verified: 312 },
  { id: 'cushman', name: 'Cushman & Wakefield', rating: 4.5, specialization: 'Real Estate', logo: '🏢', verified: 445 },
  { id: 'sothebys', name: "Sotheby's Appraisals", rating: 4.9, specialization: 'Art, Collectibles', logo: '🎨', verified: 67 },
]

// VVB Workflow steps
const VVB_STEPS = [
  { label: 'Asset Submission', description: 'Submit asset details and documentation' },
  { label: 'VVB Selection', description: 'Choose a certified Verification & Validation Body' },
  { label: 'Document Review', description: 'VVB reviews ownership and valuation documents' },
  { label: 'Physical Inspection', description: 'On-site verification (if applicable)' },
  { label: 'Valuation Report', description: 'Independent third-party valuation' },
  { label: 'Compliance Check', description: 'Regulatory and legal compliance verification' },
  { label: 'Certification', description: 'VVB issues verification certificate' },
  { label: 'Tokenization', description: 'Asset converted to blockchain tokens' },
]

export default function TokenizeAsset() {
  const [formData, setFormData] = useState<AssetForm>({
    assetType: '',
    assetName: '',
    description: '',
    value: '',
    location: '',
    documents: [],
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedVVB, setSelectedVVB] = useState<string | null>(null)
  const [showVVBDialog, setShowVVBDialog] = useState(false)
  const [vvbWorkflowStarted, setVvbWorkflowStarted] = useState(false)

  const handleInputChange = (field: keyof AssetForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFormData({ ...formData, documents: Array.from(event.target.files) })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Prepare tokenization request
    const tokenizeRequest = {
      assetType: formData.assetType,
      name: formData.assetName,
      description: formData.description,
      value: parseFloat(formData.value),
      location: formData.location,
      // In a real implementation, documents would be uploaded separately
      // and their URLs/hashes would be included here
      documents: formData.documents.map(f => f.name),
    }

    const result = await safeApiCall(
      () => apiService.createToken(tokenizeRequest),
      { success: false }
    )

    if (result.success && result.data.success) {
      setSuccess(true)
      // Reset form on success
      setFormData({
        assetType: '',
        assetName: '',
        description: '',
        value: '',
        location: '',
        documents: [],
      })
      setTimeout(() => setSuccess(false), 5000)
    } else {
      setError(result.error?.message || 'Failed to tokenize asset. Please try again.')
      setTimeout(() => setError(null), 5000)
    }

    setLoading(false)
  }

  const isFormValid = formData.assetType && formData.assetName && formData.value

  const handleStartVVBWorkflow = () => {
    if (isFormValid) {
      setVvbWorkflowStarted(true)
      setActiveStep(1) // Move to VVB Selection
      setShowVVBDialog(true)
    }
  }

  const handleSelectVVB = (vvbId: string) => {
    setSelectedVVB(vvbId)
    setShowVVBDialog(false)
    setActiveStep(2) // Move to Document Review
  }

  const handleNextStep = () => {
    if (activeStep < VVB_STEPS.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const getRecommendedVVBs = () => {
    const assetType = formData.assetType
    return VVB_PROVIDERS.filter(vvb => {
      if (assetType === 'carbon-credits') return vvb.specialization.includes('Carbon')
      if (assetType === 'real-estate') return vvb.specialization.includes('Real Estate')
      if (assetType === 'art') return vvb.specialization.includes('Art')
      if (assetType === 'energy' || assetType === 'infrastructure') return vvb.specialization.includes('Energy') || vvb.specialization.includes('Infrastructure')
      if (assetType === 'securities') return vvb.specialization.includes('Securities')
      return true
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        Tokenize Real-World Asset
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
        Convert physical assets into digital tokens on the blockchain
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Asset tokenization submitted successfully! Processing in blockchain...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Asset Information
              </Typography>

              <Grid container spacing={3}>
                {/* Asset Type */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Asset Type</InputLabel>
                    <Select
                      value={formData.assetType}
                      onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                      sx={{
                        color: '#fff',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: THEME_COLORS.primary,
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: '#1A1F3A',
                            maxHeight: 400,
                          }
                        }
                      }}
                    >
                      {ASSET_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value} sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                            <Box sx={{ color: THEME_COLORS.primary }}>{type.icon}</Box>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>{type.label}</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                {type.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Asset Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Asset Name"
                    value={formData.assetName}
                    onChange={handleInputChange('assetName')}
                    placeholder="e.g., Downtown Commercial Property"
                    sx={{
                      input: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '.MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: THEME_COLORS.primary },
                      },
                    }}
                  />
                </Grid>

                {/* Asset Value */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Asset Value (USD)"
                    type="number"
                    value={formData.value}
                    onChange={handleInputChange('value')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney sx={{ color: THEME_COLORS.primary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      input: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '.MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: THEME_COLORS.primary },
                      },
                    }}
                  />
                </Grid>

                {/* Location */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={handleInputChange('location')}
                    placeholder="e.g., New York, USA"
                    sx={{
                      input: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '.MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: THEME_COLORS.primary },
                      },
                    }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    placeholder="Provide detailed information about the asset..."
                    sx={{
                      textarea: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '.MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: THEME_COLORS.primary },
                      },
                    }}
                  />
                </Grid>

                {/* File Upload */}
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      py: 2,
                      '&:hover': {
                        borderColor: THEME_COLORS.primary,
                        bgcolor: 'rgba(0, 191, 165, 0.1)',
                      },
                    }}
                  >
                    Upload Documents (Proof of Ownership, Valuation Reports)
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  {formData.documents.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.documents.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.primary }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      disabled={!isFormValid || loading || vvbWorkflowStarted}
                      onClick={handleStartVVBWorkflow}
                      startIcon={<VerifiedUser />}
                      sx={{
                        borderColor: THEME_COLORS.secondary,
                        color: THEME_COLORS.secondary,
                        py: 2,
                        fontSize: '1rem',
                        '&:hover': {
                          borderColor: THEME_COLORS.primary,
                          bgcolor: 'rgba(0, 191, 165, 0.1)'
                        },
                        '&:disabled': { borderColor: 'rgba(255,255,255,0.1)' },
                      }}
                    >
                      Start VVB Verification
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={!isFormValid || loading || !selectedVVB}
                      onClick={handleSubmit}
                      sx={{
                        bgcolor: THEME_COLORS.primary,
                        py: 2,
                        fontSize: '1rem',
                        '&:hover': { bgcolor: '#00A88E' },
                        '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)' },
                      }}
                    >
                      {loading ? 'Processing...' : 'Tokenize Asset'}
                    </Button>
                  </Box>
                  {loading && <LinearProgress sx={{ mt: 2 }} />}
                  {!selectedVVB && isFormValid && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>
                      VVB verification required before tokenization
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* VVB Workflow Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUser sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  VVB Verification Workflow
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
                {VVB_STEPS.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: index <= activeStep ? THEME_COLORS.primary : 'rgba(255,255,255,0.5)',
                          fontWeight: index === activeStep ? 600 : 400,
                        },
                        '& .MuiStepIcon-root': {
                          color: index < activeStep ? THEME_COLORS.primary : 'rgba(255,255,255,0.3)',
                          '&.Mui-active': { color: THEME_COLORS.secondary },
                        },
                      }}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {selectedVVB && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(0, 191, 165, 0.1)',
                    borderRadius: 2,
                    border: `1px solid ${THEME_COLORS.primary}`,
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Selected VVB
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Avatar sx={{ bgcolor: THEME_COLORS.primary, mr: 1, width: 32, height: 32 }}>
                      {VVB_PROVIDERS.find(v => v.id === selectedVVB)?.logo}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                        {VVB_PROVIDERS.find(v => v.id === selectedVVB)?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {VVB_PROVIDERS.find(v => v.id === selectedVVB)?.specialization}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {activeStep > 0 && activeStep < VVB_STEPS.length - 1 && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleNextStep}
                  sx={{
                    borderColor: THEME_COLORS.primary,
                    color: THEME_COLORS.primary,
                    '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.1)' },
                  }}
                >
                  Advance to Next Step
                </Button>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(78, 205, 196, 0.1)',
                  borderRadius: 2,
                  border: `1px solid ${THEME_COLORS.secondary}`,
                }}
              >
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                  Benefits of VVB Verification:
                </Typography>
                <List dense sx={{ p: 0 }}>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ color: THEME_COLORS.primary, fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Third-party validation"
                      primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ color: THEME_COLORS.primary, fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Regulatory compliance"
                      primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ color: THEME_COLORS.primary, fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Enhanced investor trust"
                      primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ color: THEME_COLORS.primary, fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Verified asset authenticity"
                      primaryTypographyProps={{ variant: 'caption', color: 'rgba(255,255,255,0.7)' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* VVB Selection Dialog */}
      <Dialog
        open={showVVBDialog}
        onClose={() => setShowVVBDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1F3A',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VerifiedUser sx={{ color: THEME_COLORS.primary, mr: 1 }} />
            Select Verification & Validation Body (VVB)
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Choose a certified VVB to verify and validate your asset. Recommended providers are highlighted based on your asset type.
          </Typography>
          <Grid container spacing={2}>
            {getRecommendedVVBs().map((vvb) => (
              <Grid item xs={12} md={6} key={vvb.id}>
                <Card
                  sx={{
                    ...CARD_STYLE,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: THEME_COLORS.primary,
                      transform: 'translateY(-2px)',
                    },
                    ...(selectedVVB === vvb.id && {
                      borderColor: THEME_COLORS.primary,
                      bgcolor: 'rgba(0, 191, 165, 0.1)',
                    }),
                  }}
                  onClick={() => handleSelectVVB(vvb.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', mr: 1.5, fontSize: '1.2rem' }}>
                        {vvb.logo}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                          {vvb.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={vvb.rating} precision={0.1} size="small" readOnly sx={{ mr: 0.5 }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            ({vvb.rating})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {vvb.specialization}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip
                        size="small"
                        icon={<CheckCircle sx={{ fontSize: 14 }} />}
                        label={`${vvb.verified} assets verified`}
                        sx={{
                          bgcolor: 'rgba(0, 191, 165, 0.2)',
                          color: THEME_COLORS.primary,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setShowVVBDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
