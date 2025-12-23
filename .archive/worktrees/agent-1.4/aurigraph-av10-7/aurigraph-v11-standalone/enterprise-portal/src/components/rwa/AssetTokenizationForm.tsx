/**
 * Asset Tokenization Form
 * Form to tokenize real-world assets into wAUR tokens
 */

import React, { useState, useCallback } from 'react'
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
  Alert,
  LinearProgress,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Upload, AttachMoney, Category, Person, Info, CheckCircle,
  Security, CloudUpload, Delete
} from '@mui/icons-material'
import { useAppDispatch } from '../../hooks'
import { tokenizeAsset } from '../../store/rwaSlice'
import { AssetType, RWATokenizationRequest, OracleSource } from '../../types/rwa'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)'
}

const assetTypeOptions = [
  { value: AssetType.CARBON_CREDIT, label: 'Carbon Credits', icon: '🌱' },
  { value: AssetType.REAL_ESTATE, label: 'Real Estate', icon: '🏢' },
  { value: AssetType.FINANCIAL, label: 'Financial Assets', icon: '💰' },
  { value: AssetType.ARTWORK, label: 'Artwork', icon: '🎨' },
  { value: AssetType.COMMODITY, label: 'Commodities', icon: '⚡' },
  { value: AssetType.VEHICLE, label: 'Vehicles', icon: '🚗' },
  { value: AssetType.EQUIPMENT, label: 'Equipment', icon: '🔧' },
  { value: AssetType.OTHER, label: 'Other', icon: '📦' }
]

const oracleSourceOptions = [
  { value: OracleSource.CHAINLINK, label: 'Chainlink' },
  { value: OracleSource.BAND_PROTOCOL, label: 'Band Protocol' },
  { value: OracleSource.API3, label: 'API3' },
  { value: OracleSource.TELLOR, label: 'Tellor' },
  { value: OracleSource.INTERNAL, label: 'Aurigraph Internal' }
]

export default function AssetTokenizationForm() {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    assetName: '',
    assetType: AssetType.REAL_ESTATE,
    ownerAddress: '',
    estimatedValue: '',
    fractionSize: '',
    description: '',
    location: '',
    certificationLevel: 'BASIC',
    oracleSource: OracleSource.CHAINLINK
  })

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.assetId || !formData.ownerAddress || !formData.estimatedValue) {
        throw new Error('Please fill in all required fields')
      }

      // Prepare tokenization request
      const request: RWATokenizationRequest = {
        assetId: formData.assetId,
        assetType: formData.assetType,
        ownerAddress: formData.ownerAddress,
        fractionSize: formData.fractionSize || undefined,
        metadata: {
          name: formData.assetName,
          description: formData.description,
          location: formData.location,
          estimatedValue: parseFloat(formData.estimatedValue),
          certificationLevel: formData.certificationLevel,
          uploadedDocuments: uploadedFiles.length
        },
        oracleSource: formData.oracleSource
      }

      await dispatch(tokenizeAsset(request)).unwrap()
      setSuccess(true)

      // Reset form
      setTimeout(() => {
        setFormData({
          assetId: '',
          assetName: '',
          assetType: AssetType.REAL_ESTATE,
          ownerAddress: '',
          estimatedValue: '',
          fractionSize: '',
          description: '',
          location: '',
          certificationLevel: 'BASIC',
          oracleSource: OracleSource.CHAINLINK
        })
        setUploadedFiles([])
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to tokenize asset')
    } finally {
      setLoading(false)
    }
  }, [formData, uploadedFiles, dispatch])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#fff' }}>
        Tokenize Real-World Asset
      </Typography>

      <Card sx={CARD_STYLE}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Asset Basic Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Info sx={{ color: '#00BFA5' }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    Asset Information
                  </Typography>
                </Box>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Asset ID"
                  value={formData.assetId}
                  onChange={(e) => handleInputChange('assetId', e.target.value)}
                  placeholder="e.g., PROP-2024-001"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Category sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Asset Name"
                  value={formData.assetName}
                  onChange={(e) => handleInputChange('assetName', e.target.value)}
                  placeholder="e.g., Manhattan Office Building"
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Asset Type</InputLabel>
                  <Select
                    value={formData.assetType}
                    onChange={(e) => handleInputChange('assetType', e.target.value)}
                    label="Asset Type"
                    sx={{ color: '#fff' }}
                  >
                    {assetTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Owner Address"
                  value={formData.ownerAddress}
                  onChange={(e) => handleInputChange('ownerAddress', e.target.value)}
                  placeholder="0x..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              {/* Valuation Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <AttachMoney sx={{ color: '#00BFA5' }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    Valuation & Ownership
                  </Typography>
                </Box>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Estimated Value (USD)"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  placeholder="1000000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fraction Size (Optional)"
                  value={formData.fractionSize}
                  onChange={(e) => handleInputChange('fractionSize', e.target.value)}
                  placeholder="Leave empty for single ownership"
                  helperText="Minimum investment per fraction"
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Oracle Source</InputLabel>
                  <Select
                    value={formData.oracleSource}
                    onChange={(e) => handleInputChange('oracleSource', e.target.value)}
                    label="Oracle Source"
                    sx={{ color: '#fff' }}
                  >
                    {oracleSourceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location (Optional)"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., New York, NY"
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Asset Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the asset, its condition, features, etc."
                  sx={{ '& .MuiInputBase-root': { color: '#fff' } }}
                />
              </Grid>

              {/* File Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Security sx={{ color: '#00BFA5' }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    Documentation & Certifications
                  </Typography>
                </Box>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ color: '#00BFA5', borderColor: '#00BFA5' }}
                >
                  Upload Documents
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </Button>
                <Typography variant="caption" sx={{ ml: 2, color: 'rgba(255,255,255,0.5)' }}>
                  Supported: PDF, JPG, PNG, DOC (Max 10MB each)
                </Typography>
              </Grid>

              {uploadedFiles.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {uploadedFiles.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => handleRemoveFile(index)}
                        deleteIcon={<Delete />}
                        sx={{
                          bgcolor: 'rgba(0, 191, 165, 0.2)',
                          color: '#00BFA5'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Status Messages */}
              {loading && (
                <Grid item xs={12}>
                  <LinearProgress sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)' }} />
                  <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                    Tokenizing asset... This may take a few moments.
                  </Typography>
                </Grid>
              )}

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              {success && (
                <Grid item xs={12}>
                  <Alert icon={<CheckCircle />} severity="success">
                    Asset successfully tokenized! wAUR token created.
                  </Alert>
                </Grid>
              )}

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setFormData({
                        assetId: '',
                        assetName: '',
                        assetType: AssetType.REAL_ESTATE,
                        ownerAddress: '',
                        estimatedValue: '',
                        fractionSize: '',
                        description: '',
                        location: '',
                        certificationLevel: 'BASIC',
                        oracleSource: OracleSource.CHAINLINK
                      })
                      setUploadedFiles([])
                    }}
                    disabled={loading}
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || success}
                    sx={{
                      bgcolor: '#00BFA5',
                      '&:hover': { bgcolor: '#00A890' }
                    }}
                  >
                    {loading ? 'Tokenizing...' : 'Tokenize Asset'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
