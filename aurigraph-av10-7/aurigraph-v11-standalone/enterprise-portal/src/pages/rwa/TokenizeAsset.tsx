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
  { value: 'real-estate', label: 'Real Estate', icon: <AccountBalance /> },
  { value: 'art', label: 'Art & Collectibles', icon: <Palette /> },
  { value: 'commodities', label: 'Commodities', icon: <LocalShipping /> },
  { value: 'securities', label: 'Securities', icon: <Assessment /> },
  { value: 'other', label: 'Other Assets', icon: <Description /> },
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
                    >
                      {ASSET_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            {type.label}
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

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!isFormValid || loading}
                    onClick={handleSubmit}
                    sx={{
                      bgcolor: THEME_COLORS.primary,
                      py: 2,
                      fontSize: '1.1rem',
                      '&:hover': { bgcolor: '#00A88E' },
                      '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    {loading ? 'Processing...' : 'Tokenize Asset'}
                  </Button>
                  {loading && <LinearProgress sx={{ mt: 2 }} />}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  How It Works
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 0.5 }}>
                    1. Asset Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Provide details about your real-world asset including type, value, and location.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 0.5 }}>
                    2. Documentation
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Upload proof of ownership, valuation reports, and legal documents.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 0.5 }}>
                    3. Verification
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Our team verifies asset authenticity and compliance requirements.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 0.5 }}>
                    4. Tokenization
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Asset is converted into blockchain tokens with smart contract protection.
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'rgba(0, 191, 165, 0.1)',
                  borderRadius: 2,
                  border: `1px solid ${THEME_COLORS.primary}`,
                }}
              >
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                  Benefits:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2, color: 'rgba(255,255,255,0.7)' }}>
                  <li>Fractional ownership</li>
                  <li>Enhanced liquidity</li>
                  <li>24/7 trading capability</li>
                  <li>Transparent ownership records</li>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
