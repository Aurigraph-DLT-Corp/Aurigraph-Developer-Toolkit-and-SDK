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
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
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
  ListSubheader,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Collapse,
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
  Park,
  FlashOn,
  Gavel,
  HealthAndSafety,
  Badge,
  Shield,
  Diamond,
  Image,
  Token,
  VerifiedUser,
  CheckCircle,
  Receipt,
  CreditCard,
  Inventory,
  BusinessCenter,
  AccountTree,
  Person,
  Security,
  PhotoLibrary,
  TaskAlt,
  PriceCheck,
  GppGood,
  ExpandMore,
  ExpandLess,
  Link as LinkIcon,
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

// Asset types matching AssetType.java enum
const ASSET_CATEGORIES = [
  {
    category: 'Banking & Trade Finance',
    types: [
      { value: 'TRADE_FINANCE', label: 'Trade Finance', icon: <Receipt />, description: 'Letters of credit, trade receivables' },
      { value: 'DEPOSITS', label: 'Deposits', icon: <AccountBalance />, description: 'Bank deposits, certificates of deposit' },
      { value: 'LOANS', label: 'Loans', icon: <CreditCard />, description: 'Commercial loans, mortgages, syndicated loans' },
      { value: 'INVOICE_FACTORING', label: 'Invoice Factoring', icon: <Description />, description: 'Invoice financing, factoring' },
      { value: 'SUPPLY_CHAIN_FINANCE', label: 'Supply Chain Finance', icon: <Inventory />, description: 'Supply chain financing' },
      { value: 'TREASURY', label: 'Treasury', icon: <BusinessCenter />, description: 'Treasury instruments' },
    ]
  },
  {
    category: 'Environmental & Energy',
    types: [
      { value: 'CARBON_CREDIT', label: 'Carbon Credits', icon: <Park />, description: 'Carbon credits and environmental assets' },
      { value: 'ENERGY', label: 'Energy', icon: <FlashOn />, description: 'Energy certificates and renewable energy' },
    ]
  },
  {
    category: 'Real Estate & Property',
    types: [
      { value: 'REAL_ESTATE', label: 'Real Estate', icon: <AccountBalance />, description: 'Real estate properties and REITs' },
    ]
  },
  {
    category: 'Financial Instruments',
    types: [
      { value: 'FINANCIAL_ASSET', label: 'Financial Assets', icon: <Assessment />, description: 'Stocks, bonds, derivatives' },
      { value: 'BONDS', label: 'Bonds', icon: <Assessment />, description: 'Government and corporate bonds' },
      { value: 'EQUITIES', label: 'Equities', icon: <Assessment />, description: 'Stocks and equity instruments' },
    ]
  },
  {
    category: 'Intellectual Property',
    types: [
      { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property', icon: <Gavel />, description: 'Patents, trademarks, copyrights (general)' },
      { value: 'PATENT', label: 'Patents', icon: <Gavel />, description: 'Patents and registered inventions' },
      { value: 'TRADEMARK', label: 'Trademarks', icon: <Badge />, description: 'Trademarks and service marks' },
      { value: 'COPYRIGHT', label: 'Copyrights', icon: <Description />, description: 'Copyrights and literary works' },
    ]
  },
  {
    category: 'Physical Assets',
    types: [
      { value: 'COMMODITIES', label: 'Commodities', icon: <LocalShipping />, description: 'Physical commodities (gold, oil, etc.)' },
      { value: 'PRECIOUS_METALS', label: 'Precious Metals', icon: <Diamond />, description: 'Gold, silver, platinum' },
      { value: 'ARTWORK', label: 'Artwork', icon: <Palette />, description: 'Physical art and collectibles' },
      { value: 'COLLECTIBLES', label: 'Collectibles', icon: <Palette />, description: 'Physical and digital collectibles' },
    ]
  },
  {
    category: 'Digital Assets',
    types: [
      { value: 'DIGITAL_ART', label: 'Digital Art', icon: <Image />, description: 'Digital art and digital collectibles' },
      { value: 'NFT', label: 'NFT', icon: <Token />, description: 'Non-fungible tokens' },
    ]
  },
  {
    category: 'Other',
    types: [
      { value: 'HEALTHCARE', label: 'Healthcare', icon: <HealthAndSafety />, description: 'Healthcare data and medical records' },
      { value: 'INSURANCE', label: 'Insurance', icon: <Shield />, description: 'Insurance policies and claims' },
      { value: 'IDENTITY', label: 'Identity', icon: <Badge />, description: 'Digital identity and credentials' },
      { value: 'SUPPLY_CHAIN', label: 'Supply Chain', icon: <LocalShipping />, description: 'Supply chain tracking and logistics' },
      { value: 'OTHER', label: 'Other', icon: <Description />, description: 'Other asset types' },
    ]
  },
]

// Flatten for backward compatibility
const ASSET_TYPES = ASSET_CATEGORIES.flatMap(cat => cat.types)

// VVB Organizations (from VVBApprovalWorkflow.tsx)
const VVB_ORGANIZATIONS = [
  {
    id: 'vvb_1',
    name: 'Bureau Veritas',
    accreditations: ['ISO 14064', 'CDM', 'VCS', 'Gold Standard'],
    specializations: ['CARBON_CREDIT', 'ENERGY'],
    rating: 4.8,
    completedVerifications: 1250,
    averageProcessingDays: 45,
    country: 'France',
  },
  {
    id: 'vvb_2',
    name: 'DNV GL',
    accreditations: ['ISO 14064', 'CDM', 'VCS', 'GCC'],
    specializations: ['CARBON_CREDIT', 'ENERGY'],
    rating: 4.9,
    completedVerifications: 980,
    averageProcessingDays: 38,
    country: 'Norway',
  },
  {
    id: 'vvb_3',
    name: 'SGS SA',
    accreditations: ['ISO 14064', 'VCS', 'Plan Vivo'],
    specializations: ['CARBON_CREDIT', 'COMMODITIES'],
    rating: 4.7,
    completedVerifications: 870,
    averageProcessingDays: 42,
    country: 'Switzerland',
  },
  {
    id: 'vvb_4',
    name: 'Deloitte Real Estate Services',
    accreditations: ['RICS', 'IVSC', 'SOC 2'],
    specializations: ['REAL_ESTATE', 'COMMODITIES'],
    rating: 4.6,
    completedVerifications: 650,
    averageProcessingDays: 30,
    country: 'USA',
  },
  {
    id: 'vvb_5',
    name: 'Verisart Digital Authentication',
    accreditations: ['ISO 27001', 'WIPO', 'Blockchain Certification'],
    specializations: ['DIGITAL_ART', 'NFT', 'COPYRIGHT'],
    rating: 4.7,
    completedVerifications: 3200,
    averageProcessingDays: 14,
    country: 'UK',
  },
  {
    id: 'vvb_6',
    name: 'WIPO IP Verification Services',
    accreditations: ['WIPO', 'USPTO', 'EPO', 'PCT'],
    specializations: ['INTELLECTUAL_PROPERTY', 'PATENT', 'TRADEMARK'],
    rating: 4.9,
    completedVerifications: 5600,
    averageProcessingDays: 21,
    country: 'Switzerland',
  },
  {
    id: 'vvb_7',
    name: "Christie's Art Authentication",
    accreditations: ['RICS', 'AAA', 'IFAR', 'Provenance Standards'],
    specializations: ['ARTWORK', 'COLLECTIBLES', 'DIGITAL_ART'],
    rating: 4.8,
    completedVerifications: 890,
    averageProcessingDays: 28,
    country: 'UK',
  },
  {
    id: 'vvb_8',
    name: 'KPMG Trade Finance Advisory',
    accreditations: ['ICC', 'Basel III', 'SWIFT', 'LMA'],
    specializations: ['TRADE_FINANCE', 'LOANS', 'SUPPLY_CHAIN_FINANCE'],
    rating: 4.9,
    completedVerifications: 4200,
    averageProcessingDays: 18,
    country: 'UK',
  },
  {
    id: 'vvb_9',
    name: 'PwC Banking & Capital Markets',
    accreditations: ['Basel III', 'ISDA', 'SOC 2', 'ISO 27001'],
    specializations: ['DEPOSITS', 'TREASURY', 'LOANS'],
    rating: 4.8,
    completedVerifications: 3800,
    averageProcessingDays: 21,
    country: 'USA',
  },
  {
    id: 'vvb_10',
    name: 'Euler Hermes Credit Verification',
    accreditations: ['ICC', 'Berne Union', 'ICISA'],
    specializations: ['INVOICE_FACTORING', 'TRADE_FINANCE'],
    rating: 4.7,
    completedVerifications: 5100,
    averageProcessingDays: 14,
    country: 'Germany',
  },
]

// VVB Workflow stages
const VVB_STAGES = [
  { status: 'draft', label: 'Draft', description: 'Initial submission preparation' },
  { status: 'submitted', label: 'Submitted', description: 'Awaiting VVB assignment' },
  { status: 'under_review', label: 'Under Review', description: 'VVB reviewing documentation' },
  { status: 'site_inspection', label: 'Site Inspection', description: 'On-site verification (if required)' },
  { status: 'verification_report', label: 'Verification Report', description: 'Final report preparation' },
  { status: 'approved', label: 'Approved', description: 'Verification complete, tokens issued' },
]

// Composite Token Secondary Token Types (from SecondaryTokenType.java)
const SECONDARY_TOKEN_TYPES = [
  {
    type: 'OWNER',
    label: 'Owner Token',
    standard: 'ERC-721',
    icon: <Person />,
    description: 'Ownership record and title documentation',
    color: '#4ECDC4',
    data: ['Owner Name', 'Legal Entity', 'Ownership History', 'Transfer Rights'],
  },
  {
    type: 'COLLATERAL',
    label: 'Collateral Token',
    standard: 'ERC-1155',
    icon: <Security />,
    description: 'Collateral and security backing the asset',
    color: '#FFD93D',
    data: ['Collateral Value', 'Lien Position', 'Security Agreement', 'Release Conditions'],
  },
  {
    type: 'MEDIA',
    label: 'Media Token',
    standard: 'ERC-1155',
    icon: <PhotoLibrary />,
    description: 'Images, documents, and media assets',
    color: '#9B59B6',
    data: ['Images', 'Videos', 'Documents', 'IPFS Hashes'],
  },
  {
    type: 'VERIFICATION',
    label: 'Verification Token',
    standard: 'ERC-721',
    icon: <TaskAlt />,
    description: 'VVB verification and validation records',
    color: '#3498DB',
    data: ['VVB Provider', 'Verification Date', 'Audit Report', 'Compliance Status'],
  },
  {
    type: 'VALUATION',
    label: 'Valuation Token',
    standard: 'ERC-20',
    icon: <PriceCheck />,
    description: 'Asset valuation and appraisal data',
    color: '#E74C3C',
    data: ['Market Value', 'Appraisal Date', 'Appraiser', 'Methodology'],
  },
  {
    type: 'COMPLIANCE',
    label: 'Compliance Token',
    standard: 'ERC-721',
    icon: <GppGood />,
    description: 'Regulatory compliance and certifications',
    color: '#27AE60',
    data: ['Jurisdiction', 'Regulations', 'Certifications', 'Expiry Date'],
  },
]

// Token Topology Component
interface TokenTopologyProps {
  assetName: string
  assetType: string
  expanded: boolean
  onToggle: () => void
}

const TokenTopology: React.FC<TokenTopologyProps> = ({ assetName, assetType, expanded, onToggle }) => {
  const [selectedToken, setSelectedToken] = useState<string | null>(null)

  return (
    <Card sx={{ ...CARD_STYLE, mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={onToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountTree sx={{ color: THEME_COLORS.primary, mr: 1 }} />
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
              Token Topology
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {/* Primary Token at Center */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 3,
              }}
            >
              {/* Primary Token */}
              <Box
                sx={{
                  bgcolor: THEME_COLORS.primary,
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 0 30px ${THEME_COLORS.primary}40`,
                  border: `3px solid ${THEME_COLORS.primary}`,
                  position: 'relative',
                  zIndex: 10,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 40px ${THEME_COLORS.primary}60`,
                  },
                }}
                onClick={() => setSelectedToken('PRIMARY')}
              >
                <Token sx={{ color: '#fff', fontSize: 32 }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
                  PRIMARY
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.6rem' }}>
                  ERC-721
                </Typography>
              </Box>

              {/* Asset Label */}
              <Typography
                variant="body2"
                sx={{ color: '#fff', fontWeight: 500, mt: 1, textAlign: 'center' }}
              >
                {assetName || 'Asset Token'}
              </Typography>
              <Chip
                label={assetType || 'Select Asset Type'}
                size="small"
                sx={{ mt: 0.5, bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.primary }}
              />

              {/* Connection Lines & Secondary Tokens */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 2,
                  mt: 3,
                  position: 'relative',
                }}
              >
                {SECONDARY_TOKEN_TYPES.map((token, index) => (
                  <Tooltip
                    key={token.type}
                    title={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {token.label}
                        </Typography>
                        <Typography variant="caption">{token.description}</Typography>
                        <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
                        <Typography variant="caption" sx={{ color: token.color }}>
                          Standard: {token.standard}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-3px)' },
                      }}
                      onClick={() => setSelectedToken(token.type)}
                    >
                      {/* Connection Line */}
                      <Box
                        sx={{
                          width: 2,
                          height: 20,
                          bgcolor: selectedToken === token.type ? token.color : 'rgba(255,255,255,0.2)',
                          transition: 'all 0.2s',
                        }}
                      />
                      {/* Secondary Token Circle */}
                      <Box
                        sx={{
                          bgcolor: selectedToken === token.type ? token.color : 'rgba(255,255,255,0.1)',
                          borderRadius: '50%',
                          width: 56,
                          height: 56,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${token.color}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: `${token.color}30`,
                            boxShadow: `0 0 15px ${token.color}40`,
                          },
                        }}
                      >
                        <Box sx={{ color: selectedToken === token.type ? '#fff' : token.color }}>
                          {token.icon}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          mt: 0.5,
                          fontSize: '0.6rem',
                          textAlign: 'center',
                          maxWidth: 70,
                        }}
                      >
                        {token.label}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {/* Selected Token Details */}
            {selectedToken && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderRadius: 2,
                  border: `1px solid ${
                    selectedToken === 'PRIMARY'
                      ? THEME_COLORS.primary
                      : SECONDARY_TOKEN_TYPES.find((t) => t.type === selectedToken)?.color ||
                        'rgba(255,255,255,0.1)'
                  }`,
                }}
              >
                {selectedToken === 'PRIMARY' ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Token sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                        Primary Token (ERC-721)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                      The main asset token representing ownership of the real-world asset.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {['Asset ID', 'Legal Title', 'Jurisdiction', 'Coordinates', 'Fractionalizable'].map(
                        (field) => (
                          <Chip
                            key={field}
                            label={field}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(0, 191, 165, 0.2)',
                              color: THEME_COLORS.primary,
                              fontSize: '0.65rem',
                            }}
                          />
                        )
                      )}
                    </Box>
                  </Box>
                ) : (
                  (() => {
                    const token = SECONDARY_TOKEN_TYPES.find((t) => t.type === selectedToken)
                    return token ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ color: token.color, mr: 1 }}>{token.icon}</Box>
                          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {token.label} ({token.standard})
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          {token.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {token.data.map((field) => (
                            <Chip
                              key={field}
                              label={field}
                              size="small"
                              sx={{
                                bgcolor: `${token.color}20`,
                                color: token.color,
                                fontSize: '0.65rem',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : null
                  })()
                )}
              </Box>
            )}

            {/* Legend */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Composite Token Structure: Primary asset token linked to secondary data tokens
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip
                  icon={<LinkIcon sx={{ fontSize: 14 }} />}
                  label="Linked"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}
                />
                <Chip
                  label="ERC-721: Non-Fungible"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}
                />
                <Chip
                  label="ERC-1155: Multi"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}
                />
                <Chip
                  label="ERC-20: Fungible"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}
                />
              </Box>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

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
  const [useCompositeToken, setUseCompositeToken] = useState(true)
  const [showTokenTopology, setShowTokenTopology] = useState(true)

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

  // Calculate GNN-based data completeness score
  const calculateCompletenessScore = () => {
    let score = 0
    const weights = {
      assetType: 20,
      assetName: 15,
      value: 20,
      location: 10,
      description: 15,
      documents: 20,
    }
    if (formData.assetType) score += weights.assetType
    if (formData.assetName) score += weights.assetName
    if (formData.value) score += weights.value
    if (formData.location) score += weights.location
    if (formData.description && formData.description.length > 50) score += weights.description
    if (formData.documents.length > 0) score += Math.min(formData.documents.length * 5, weights.documents)
    return score
  }

  const completenessScore = calculateCompletenessScore()

  const getScoreColor = (score: number) => {
    if (score >= 80) return THEME_COLORS.primary
    if (score >= 50) return THEME_COLORS.warning
    return '#FF6B6B'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Incomplete'
  }

  // Get recommended VVBs based on asset type
  const getRecommendedVVBs = () => {
    if (!formData.assetType) return VVB_ORGANIZATIONS
    return VVB_ORGANIZATIONS.filter(vvb =>
      vvb.specializations.includes(formData.assetType)
    ).concat(
      VVB_ORGANIZATIONS.filter(vvb =>
        !vvb.specializations.includes(formData.assetType)
      )
    )
  }

  const handleStartVVBWorkflow = () => {
    if (completenessScore >= 60) {
      setActiveStep(1)
      setShowVVBDialog(true)
    }
  }

  const handleSelectVVB = (vvbId: string) => {
    setSelectedVVB(vvbId)
    setShowVVBDialog(false)
    setActiveStep(2)
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
                          sx: { bgcolor: '#1A1F3A', maxHeight: 400 }
                        }
                      }}
                    >
                      {ASSET_CATEGORIES.map((cat) => [
                        <ListSubheader
                          key={cat.category}
                          sx={{
                            bgcolor: '#0D1117',
                            color: THEME_COLORS.secondary,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          }}
                        >
                          {cat.category}
                        </ListSubheader>,
                        ...cat.types.map((type) => (
                          <MenuItem key={type.value} value={type.value} sx={{ pl: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                              <Box sx={{ color: THEME_COLORS.primary }}>{type.icon}</Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{type.label}</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {type.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))
                      ])}
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

        {/* VVB Workflow & Rating Panel */}
        <Grid item xs={12} md={4}>
          {/* Composite Token Toggle */}
          <Card sx={{ ...CARD_STYLE, mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountTree sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                    Composite Token
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useCompositeToken}
                      onChange={(e) => setUseCompositeToken(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: THEME_COLORS.primary,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          bgcolor: THEME_COLORS.primary,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                Primary asset token + linked secondary data tokens
              </Typography>
            </CardContent>
          </Card>

          {/* Token Topology Visualization */}
          {useCompositeToken && (
            <TokenTopology
              assetName={formData.assetName}
              assetType={formData.assetType}
              expanded={showTokenTopology}
              onToggle={() => setShowTokenTopology(!showTokenTopology)}
            />
          )}

          {/* GNN Data Completeness Score */}
          <Card sx={{ ...CARD_STYLE, mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                  Tokenization Readiness (GNN)
                </Typography>
                <Chip
                  label={getScoreLabel(completenessScore)}
                  size="small"
                  sx={{
                    bgcolor: `${getScoreColor(completenessScore)}20`,
                    color: getScoreColor(completenessScore),
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <LinearProgress
                    variant="determinate"
                    value={completenessScore}
                    sx={{
                      width: 200,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getScoreColor(completenessScore),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ color: getScoreColor(completenessScore), fontWeight: 700 }}>
                  {completenessScore}%
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>
                Based on GNN analysis of data completeness
              </Typography>
            </CardContent>
          </Card>

          {/* VVB Workflow */}
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUser sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  VVB Verification Workflow
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
                {VVB_STAGES.map((stage, index) => (
                  <Step key={stage.status}>
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
                      {stage.label}
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
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                    {VVB_ORGANIZATIONS.find(v => v.id === selectedVVB)?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Rating
                      value={VVB_ORGANIZATIONS.find(v => v.id === selectedVVB)?.rating || 0}
                      precision={0.1}
                      size="small"
                      readOnly
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>
                      ({VVB_ORGANIZATIONS.find(v => v.id === selectedVVB)?.completedVerifications} verified)
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                fullWidth
                variant="outlined"
                startIcon={<VerifiedUser />}
                disabled={completenessScore < 60 || activeStep > 0}
                onClick={handleStartVVBWorkflow}
                sx={{
                  borderColor: THEME_COLORS.primary,
                  color: THEME_COLORS.primary,
                  '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.1)' },
                  '&:disabled': { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                }}
              >
                {activeStep > 0 ? 'VVB Workflow Started' : 'Start VVB Verification'}
              </Button>
              {completenessScore < 60 && (
                <Typography variant="caption" sx={{ color: '#FF6B6B', mt: 1, display: 'block', textAlign: 'center' }}>
                  Complete at least 60% of asset data to start VVB workflow
                </Typography>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                  Asset Categories:
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Banking & Trade Finance, Environmental, Real Estate, Financial Instruments, IP, Physical Assets, Digital Assets
                </Typography>
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
          sx: { bgcolor: '#1A1F3A', border: '1px solid rgba(255,255,255,0.1)' }
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
            Choose a certified VVB to verify your asset. Recommended providers are shown first based on your asset type.
          </Typography>
          <Grid container spacing={2}>
            {getRecommendedVVBs().slice(0, 6).map((vvb) => (
              <Grid item xs={12} md={6} key={vvb.id}>
                <Card
                  sx={{
                    ...CARD_STYLE,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: THEME_COLORS.primary, transform: 'translateY(-2px)' },
                    ...(selectedVVB === vvb.id && { borderColor: THEME_COLORS.primary, bgcolor: 'rgba(0, 191, 165, 0.1)' }),
                  }}
                  onClick={() => handleSelectVVB(vvb.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', mr: 1.5, width: 40, height: 40 }}>
                        <VerifiedUser sx={{ color: THEME_COLORS.primary }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                          {vvb.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={vvb.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', ml: 0.5 }}>
                            ({vvb.rating})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {vvb.accreditations.slice(0, 3).join(', ')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                      <Chip
                        size="small"
                        label={`${vvb.completedVerifications} verified`}
                        sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.primary, fontSize: '0.65rem' }}
                      />
                      <Chip
                        size="small"
                        label={`~${vvb.averageProcessingDays} days`}
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}
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
