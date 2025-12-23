import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  InputAdornment,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Badge,
  Avatar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  AttachMoney,
  Home,
  Palette,
  LocalShipping,
  AccountBalance,
  Verified,
  ExpandMore,
  Close,
  Warning,
  CheckCircle,
  Info,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  AccountTree,
  Gavel,
  Share,
  GetApp,
  Visibility,
  Edit,
  Delete,
  Timeline,
  BarChart,
  PieChart as PieChartIcon,
  ShowChart,
  Assignment,
  Security,
  Receipt,
  CloudDownload,
  FileCopy,
  People,
  MonetizationOn,
  SwapHoriz,
  Assessment,
  Refresh
} from '@mui/icons-material'
import { apiService, safeApiCall } from '../../services/api'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart } from 'recharts'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RWAAsset {
  id: string
  name: string
  category: 'REAL_ESTATE' | 'ART' | 'COMMODITIES' | 'SECURITIES' | 'INTELLECTUAL_PROPERTY'
  valuation: number
  currency: string
  location: string
  owner: string
  registeredAt: string
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED'
  tokenized: boolean
  tokenId?: string
  totalShares?: number
  availableShares?: number
  sharePrice?: number
  description: string
  legalDocuments: string[]
  images: string[]
}

interface Token {
  tokenId: string
  assetId: string
  assetName: string
  symbol: string
  totalSupply: number
  decimals: number
  standardType: 'ERC20' | 'ERC721' | 'ERC1155'
  createdAt: string
  createdBy: string
  verified: boolean
  contractAddress: string
  currentValuation: number
  marketCap: number
}

interface FractionalOwnership {
  shareId: string
  tokenId: string
  owner: string
  ownerName: string
  shares: number
  percentage: number
  votingRights: boolean
  dividendEligible: boolean
  purchasedAt: string
  purchasePrice: number
  currentValue: number
  gainLoss: number
  gainLossPercentage: number
}

interface ShareTransferRequest {
  transferId: string
  fromOwner: string
  toOwner: string
  shares: number
  price: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  requestedAt: string
  processedAt?: string
}

interface DividendDistribution {
  distributionId: string
  tokenId: string
  totalAmount: number
  perShareAmount: number
  distributedAt: string
  recipients: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

interface MerkleProof {
  assetId: string
  merkleRoot: string
  proof: string[]
  leafHash: string
  verified: boolean
  verifiedAt: string
  blockHeight: number
  transactionHash: string
}

interface AssetValuationHistory {
  timestamp: string
  valuation: number
  method: string
  verifier: string
}

interface TokenHolderDistribution {
  holderAddress: string
  holderName: string
  shares: number
  percentage: number
  value: number
}

interface TradingVolume {
  date: string
  volume: number
  trades: number
  avgPrice: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4'
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2
}

const ASSET_CATEGORIES = [
  { value: 'REAL_ESTATE', label: 'Real Estate', icon: <Home />, color: THEME_COLORS.primary },
  { value: 'ART', label: 'Art & Collectibles', icon: <Palette />, color: THEME_COLORS.tertiary },
  { value: 'COMMODITIES', label: 'Commodities', icon: <LocalShipping />, color: THEME_COLORS.quaternary },
  { value: 'SECURITIES', label: 'Securities', icon: <AccountBalance />, color: THEME_COLORS.error },
  { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property', icon: <Assignment />, color: THEME_COLORS.info }
]

const REFRESH_INTERVAL = 10000 // 10 seconds

const CHART_COLORS = ['#00BFA5', '#4ECDC4', '#FFD93D', '#FF6B6B', '#9B59B6', '#3498DB']

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString()
}

const getCategoryIcon = (category: string) => {
  const cat = ASSET_CATEGORIES.find(c => c.value === category)
  return cat?.icon || <Assignment />
}

const getCategoryColor = (category: string) => {
  const cat = ASSET_CATEGORIES.find(c => c.value === category)
  return cat?.color || THEME_COLORS.primary
}

const getVerificationStatusChip = (status: string) => {
  const configs = {
    VERIFIED: { color: THEME_COLORS.success, label: 'Verified', icon: <Verified sx={{ fontSize: 16 }} /> },
    PENDING: { color: THEME_COLORS.warning, label: 'Pending', icon: <Info sx={{ fontSize: 16 }} /> },
    REJECTED: { color: THEME_COLORS.error, label: 'Rejected', icon: <ErrorIcon sx={{ fontSize: 16 }} /> }
  }
  const config = configs[status as keyof typeof configs] || configs.PENDING
  return (
    <Chip
      label={config.label}
      icon={config.icon}
      size="small"
      sx={{
        bgcolor: `${config.color}20`,
        color: config.color,
        fontWeight: 600
      }}
    />
  )
}

const calculateGasEstimate = (totalSupply: number, decimals: number): number => {
  // Mock gas estimation logic
  const baseGas = 100000
  const supplyMultiplier = Math.log10(totalSupply + 1) * 10000
  const decimalMultiplier = decimals * 1000
  return Math.floor(baseGas + supplyMultiplier + decimalMultiplier)
}

const estimateGasCost = (gasUnits: number, gasPrice: number = 50): number => {
  // gasPrice in Gwei, returns cost in ETH
  return (gasUnits * gasPrice) / 1e9
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useAssetRegistry = () => {
  const [assets, setAssets] = useState<RWAAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/rwa/assets')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (result.success && result.data) {
      setAssets(result.data)
    } else {
      setError(result.error?.message || 'Failed to fetch assets')
    }

    setLoading(false)
  }, [])

  return { assets, loading, error, fetchAssets }
}

const useTokenRegistry = () => {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTokens = useCallback(async () => {
    setLoading(true)

    const result = await safeApiCall(
      () => apiService.getRWATokens(),
      []
    )

    if (result.success && result.data) {
      setTokens(result.data)
    }

    setLoading(false)
  }, [])

  return { tokens, loading, fetchTokens }
}

const useFractionalOwnership = (tokenId: string | null) => {
  const [ownerships, setOwnerships] = useState<FractionalOwnership[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOwnerships = useCallback(async () => {
    if (!tokenId) return

    setLoading(true)

    const result = await safeApiCall(
      async () => {
        const response = await fetch(`/api/v11/rwa/tokens/${tokenId}/ownerships`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (result.success && result.data) {
      setOwnerships(result.data)
    }

    setLoading(false)
  }, [tokenId])

  return { ownerships, loading, fetchOwnerships }
}

const useMerkleProofs = () => {
  const [proofs, setProofs] = useState<Record<string, MerkleProof>>({})
  const [loading, setLoading] = useState(false)

  const fetchProof = useCallback(async (assetId: string) => {
    setLoading(true)

    const result = await safeApiCall(
      () => apiService.generateMerkleProof(assetId),
      null
    )

    if (result.success && result.data) {
      setProofs(prev => ({ ...prev, [assetId]: result.data }))
    }

    setLoading(false)
  }, [])

  return { proofs, loading, fetchProof }
}

const useAssetPerformance = (assetId: string | null) => {
  const [valuationHistory, setValuationHistory] = useState<AssetValuationHistory[]>([])
  const [dividendHistory, setDividendHistory] = useState<DividendDistribution[]>([])
  const [tradingVolume, setTradingVolume] = useState<TradingVolume[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPerformance = useCallback(async () => {
    if (!assetId) return

    setLoading(true)

    const valuationResult = await safeApiCall(
      async () => {
        const response = await fetch(`/api/v11/rwa/assets/${assetId}/valuation-history`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    const dividendResult = await safeApiCall(
      async () => {
        const response = await fetch(`/api/v11/rwa/assets/${assetId}/dividends`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    const volumeResult = await safeApiCall(
      async () => {
        const response = await fetch(`/api/v11/rwa/assets/${assetId}/trading-volume`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (valuationResult.success && valuationResult.data) {
      setValuationHistory(valuationResult.data)
    }

    if (dividendResult.success && dividendResult.data) {
      setDividendHistory(dividendResult.data)
    }

    if (volumeResult.success && volumeResult.data) {
      setTradingVolume(volumeResult.data)
    }

    setLoading(false)
  }, [assetId])

  return { valuationHistory, dividendHistory, tradingVolume, loading, fetchPerformance }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AssetRegistryTableProps {
  assets: RWAAsset[]
  onAssetClick: (asset: RWAAsset) => void
  onTokenize: (asset: RWAAsset) => void
}

const AssetRegistryTable: React.FC<AssetRegistryTableProps> = ({ assets, onAssetClick, onTokenize }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [assets, searchTerm, categoryFilter])

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment sx={{ fontSize: 32, color: THEME_COLORS.primary }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Asset Registry
            </Typography>
            <Chip
              label={`${filteredAssets.length} assets`}
              size="small"
              sx={{ bgcolor: `${THEME_COLORS.primary}20`, color: THEME_COLORS.primary }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {ASSET_CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Asset</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Category</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Valuation</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Location</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Status</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }}>Tokenized</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: '#1A1F3A' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow
                  key={asset.id}
                  hover
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                  onClick={() => onAssetClick(asset)}
                >
                  <TableCell sx={{ color: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCategoryIcon(asset.category)}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {asset.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ASSET_CATEGORIES.find(c => c.value === asset.category)?.label}
                      size="small"
                      sx={{
                        bgcolor: `${getCategoryColor(asset.category)}20`,
                        color: getCategoryColor(asset.category)
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                    {formatCurrency(asset.valuation, asset.currency)}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{asset.location}</TableCell>
                  <TableCell>{getVerificationStatusChip(asset.verificationStatus)}</TableCell>
                  <TableCell>
                    {asset.tokenized ? (
                      <Chip
                        label="Yes"
                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                        size="small"
                        sx={{ bgcolor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success }}
                      />
                    ) : (
                      <Chip
                        label="No"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" sx={{ color: THEME_COLORS.info }}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {!asset.tokenized && asset.verificationStatus === 'VERIFIED' && (
                        <Tooltip title="Tokenize Asset">
                          <IconButton
                            size="small"
                            sx={{ color: THEME_COLORS.primary }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onTokenize(asset)
                            }}
                          >
                            <MonetizationOn />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

interface TokenCreationWizardProps {
  open: boolean
  asset: RWAAsset | null
  onClose: () => void
  onComplete: () => void
}

const TokenCreationWizard: React.FC<TokenCreationWizardProps> = ({ open, asset, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [tokenParams, setTokenParams] = useState({
    symbol: '',
    totalSupply: 1000000,
    decimals: 18,
    standardType: 'ERC20' as 'ERC20' | 'ERC721' | 'ERC1155',
    sharePrice: 0,
    ownershipDistribution: [] as { address: string; shares: number; percentage: number }[]
  })
  const [gasEstimate, setGasEstimate] = useState(0)
  const [gasCost, setGasCost] = useState(0)
  const [minting, setMinting] = useState(false)

  useEffect(() => {
    if (asset) {
      setTokenParams(prev => ({
        ...prev,
        symbol: asset.name.substring(0, 4).toUpperCase(),
        sharePrice: asset.valuation / prev.totalSupply
      }))
    }
  }, [asset])

  useEffect(() => {
    const estimate = calculateGasEstimate(tokenParams.totalSupply, tokenParams.decimals)
    setGasEstimate(estimate)
    setGasCost(estimateGasCost(estimate))
  }, [tokenParams.totalSupply, tokenParams.decimals])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleMint = async () => {
    setMinting(true)
    // Mock minting process
    await new Promise(resolve => setTimeout(resolve, 3000))
    setMinting(false)
    onComplete()
    handleReset()
  }

  const handleReset = () => {
    setActiveStep(0)
    setTokenParams({
      symbol: '',
      totalSupply: 1000000,
      decimals: 18,
      standardType: 'ERC20',
      sharePrice: 0,
      ownershipDistribution: []
    })
  }

  const steps = [
    {
      label: 'Asset Selection & Valuation',
      content: (
        <Box sx={{ mt: 2 }}>
          {asset && (
            <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
                    Selected Asset
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {asset.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {ASSET_CATEGORIES.find(c => c.value === asset.category)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Current Valuation
                  </Typography>
                  <Typography variant="body2" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                    {formatCurrency(asset.valuation, asset.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {asset.location}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Verification Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {getVerificationStatusChip(asset.verificationStatus)}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Token Parameters',
      content: (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Token Symbol"
                value={tokenParams.symbol}
                onChange={(e) => setTokenParams({ ...tokenParams, symbol: e.target.value.toUpperCase() })}
                fullWidth
                helperText="3-5 characters recommended"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Token Standard</InputLabel>
                <Select
                  value={tokenParams.standardType}
                  label="Token Standard"
                  onChange={(e) => setTokenParams({ ...tokenParams, standardType: e.target.value as any })}
                >
                  <MenuItem value="ERC20">ERC-20 (Fungible)</MenuItem>
                  <MenuItem value="ERC721">ERC-721 (NFT)</MenuItem>
                  <MenuItem value="ERC1155">ERC-1155 (Multi-Token)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Total Supply"
                type="number"
                value={tokenParams.totalSupply}
                onChange={(e) => setTokenParams({ ...tokenParams, totalSupply: parseInt(e.target.value) || 0 })}
                fullWidth
                helperText="Total number of tokens to mint"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Decimals"
                type="number"
                value={tokenParams.decimals}
                onChange={(e) => setTokenParams({ ...tokenParams, decimals: parseInt(e.target.value) || 0 })}
                fullWidth
                helperText="Usually 18 for ERC-20"
                inputProps={{ min: 0, max: 18 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Share Price"
                type="number"
                value={tokenParams.sharePrice}
                onChange={(e) => setTokenParams({ ...tokenParams, sharePrice: parseFloat(e.target.value) || 0 })}
                fullWidth
                helperText={`Price per token (Asset valuation: ${formatCurrency(asset?.valuation || 0)})`}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Ownership Distribution',
      content: (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Define initial token distribution among stakeholders
          </Alert>
          <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              This feature will allow you to distribute tokens to multiple addresses upon minting.
              For this demo, all tokens will be minted to the creator's address.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      label: 'Review & Mint',
      content: (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.quaternary, mb: 2 }}>
                Token Summary
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Asset
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {asset?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Token Symbol
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {tokenParams.symbol}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Total Supply
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {formatNumber(tokenParams.totalSupply)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Token Standard
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {tokenParams.standardType}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.error, mb: 2 }}>
                Gas Estimation
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,107,107,0.1)', borderRadius: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Estimated Gas
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {formatNumber(gasEstimate)} units
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Estimated Cost
                    </Typography>
                    <Typography variant="body2" sx={{ color: THEME_COLORS.error, fontWeight: 700 }}>
                      ~{gasCost.toFixed(6)} ETH
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning">
                <AlertTitle>Confirm Transaction</AlertTitle>
                Once minted, the token cannot be un-minted. Please verify all parameters before proceeding.
              </Alert>
            </Grid>
          </Grid>
        </Box>
      )
    }
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Create RWA Token</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleMint}
                      disabled={minting}
                      sx={{ bgcolor: THEME_COLORS.primary }}
                    >
                      {minting ? <CircularProgress size={24} /> : 'Mint Token'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ bgcolor: THEME_COLORS.primary }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  )
}

interface FractionalOwnershipInterfaceProps {
  token: Token | null
  ownerships: FractionalOwnership[]
}

const FractionalOwnershipInterface: React.FC<FractionalOwnershipInterfaceProps> = ({ token, ownerships }) => {
  const [selectedOwnership, setSelectedOwnership] = useState<FractionalOwnership | null>(null)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  if (!token) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Fractional Ownership
          </Typography>
          <Alert severity="info">Select a token to view ownership details</Alert>
        </CardContent>
      </Card>
    )
  }

  const ownershipData = ownerships.map(o => ({
    name: o.ownerName,
    value: o.shares
  }))

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <People sx={{ fontSize: 32, color: THEME_COLORS.tertiary }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Fractional Ownership - {token.symbol}
          </Typography>
          <Chip
            label={`${ownerships.length} holders`}
            size="small"
            sx={{ bgcolor: `${THEME_COLORS.tertiary}20`, color: THEME_COLORS.tertiary }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.info, mb: 2 }}>
              Ownership Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ownershipData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {ownershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.success, mb: 2 }}>
              Top Holders
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Holder</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Shares</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">%</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ownerships.slice(0, 10).map((ownership) => (
                    <TableRow key={ownership.shareId}>
                      <TableCell sx={{ color: '#fff' }}>{ownership.ownerName}</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.tertiary }} align="right">{formatNumber(ownership.shares)}</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.quaternary }} align="right">{ownership.percentage.toFixed(2)}%</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.success }} align="right">{formatCurrency(ownership.currentValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.warning, mb: 2 }}>
              Voting Rights & Dividends
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Holders with Voting Rights
                  </Typography>
                  <Typography variant="h5" sx={{ color: THEME_COLORS.warning, fontWeight: 700 }}>
                    {ownerships.filter(o => o.votingRights).length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Dividend Eligible Holders
                  </Typography>
                  <Typography variant="h5" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                    {ownerships.filter(o => o.dividendEligible).length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

interface MerkleVerificationDisplayProps {
  asset: RWAAsset | null
  proof: MerkleProof | null
  onGenerateProof: () => void
  loading: boolean
}

const MerkleVerificationDisplay: React.FC<MerkleVerificationDisplayProps> = ({ asset, proof, onGenerateProof, loading }) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const handleExportProof = () => {
    if (proof) {
      const proofJson = JSON.stringify(proof, null, 2)
      const blob = new Blob([proofJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merkle-proof-${asset?.id}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportDialogOpen(false)
    }
  }

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Security sx={{ fontSize: 32, color: THEME_COLORS.error }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Merkle Verification
            </Typography>
          </Box>
          {asset && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onGenerateProof}
              disabled={loading}
              sx={{ borderColor: THEME_COLORS.primary, color: THEME_COLORS.primary }}
            >
              Generate Proof
            </Button>
          )}
        </Box>

        {!asset && (
          <Alert severity="info">Select an asset to generate Merkle proof</Alert>
        )}

        {asset && !proof && !loading && (
          <Alert severity="warning">
            <AlertTitle>No Proof Available</AlertTitle>
            Click "Generate Proof" to create a cryptographic verification proof for this asset
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: THEME_COLORS.primary }} />
          </Box>
        )}

        {proof && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: proof.verified ? 'rgba(0,191,165,0.1)' : 'rgba(255,107,107,0.1)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {proof.verified ? (
                    <CheckCircle sx={{ fontSize: 32, color: THEME_COLORS.success }} />
                  ) : (
                    <ErrorIcon sx={{ fontSize: 32, color: THEME_COLORS.error }} />
                  )}
                  <Typography variant="h6" sx={{ color: proof.verified ? THEME_COLORS.success : THEME_COLORS.error }}>
                    {proof.verified ? 'Proof Verified' : 'Verification Failed'}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Verified at block #{proof.blockHeight} on {formatTimestamp(proof.verifiedAt)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.tertiary, mb: 2 }}>
                Merkle Root
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {proof.merkleRoot}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.quaternary, mb: 2 }}>
                Leaf Hash
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {proof.leafHash}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.info, mb: 2 }}>
                Proof Chain ({proof.proof.length} levels)
              </Typography>
              <Accordion sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    View Proof Hashes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {proof.proof.map((hash, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all' }}>
                              Level {idx + 1}: {hash}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudDownload />}
                  onClick={() => setExportDialogOpen(true)}
                  sx={{ bgcolor: THEME_COLORS.tertiary }}
                >
                  Export Proof
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileCopy />}
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(proof, null, 2))}
                  sx={{ borderColor: THEME_COLORS.info, color: THEME_COLORS.info }}
                >
                  Copy to Clipboard
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Merkle Proof</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Export this proof to verify asset authenticity on external systems or for compliance purposes.
            </Typography>
            <Alert severity="info">
              The exported proof can be verified independently using the Merkle root stored on the blockchain.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExportProof} variant="contained" sx={{ bgcolor: THEME_COLORS.primary }}>
              Download JSON
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

interface AssetPerformanceAnalyticsProps {
  asset: RWAAsset | null
  valuationHistory: AssetValuationHistory[]
  dividendHistory: DividendDistribution[]
  tradingVolume: TradingVolume[]
}

const AssetPerformanceAnalytics: React.FC<AssetPerformanceAnalyticsProps> = ({
  asset,
  valuationHistory,
  dividendHistory,
  tradingVolume
}) => {
  if (!asset) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Asset Performance & Analytics
          </Typography>
          <Alert severity="info">Select an asset to view performance analytics</Alert>
        </CardContent>
      </Card>
    )
  }

  const totalDividends = dividendHistory.reduce((sum, d) => sum + d.totalAmount, 0)
  const avgValuationChange = valuationHistory.length > 1
    ? ((valuationHistory[valuationHistory.length - 1].valuation - valuationHistory[0].valuation) / valuationHistory[0].valuation) * 100
    : 0

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Assessment sx={{ fontSize: 32, color: THEME_COLORS.primary }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Asset Performance & Analytics - {asset.name}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Current Valuation
                  </Typography>
                  <Typography variant="h4" sx={{ color: THEME_COLORS.success, fontWeight: 700, my: 1 }}>
                    {formatCurrency(asset.valuation)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    {avgValuationChange >= 0 ? (
                      <TrendingUp sx={{ color: THEME_COLORS.success, fontSize: 20 }} />
                    ) : (
                      <TrendingDown sx={{ color: THEME_COLORS.error, fontSize: 20 }} />
                    )}
                    <Typography variant="body2" sx={{ color: avgValuationChange >= 0 ? THEME_COLORS.success : THEME_COLORS.error }}>
                      {formatPercentage(avgValuationChange)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total Dividends Paid
                  </Typography>
                  <Typography variant="h4" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700, my: 1 }}>
                    {formatCurrency(totalDividends)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {dividendHistory.length} distributions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Trading Volume (30d)
                  </Typography>
                  <Typography variant="h4" sx={{ color: THEME_COLORS.quaternary, fontWeight: 700, my: 1 }}>
                    {formatCurrency(tradingVolume.reduce((sum, v) => sum + v.volume, 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {tradingVolume.reduce((sum, v) => sum + v.trades, 0)} trades
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Valuation History Chart */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 2 }}>
              Valuation History
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={valuationHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="valuation"
                  stroke={THEME_COLORS.primary}
                  fill={`${THEME_COLORS.primary}40`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Grid>

          {/* Dividend History */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.tertiary, mb: 2 }}>
              Dividend Distribution History
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', maxHeight: 250 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Date</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Amount</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Recipients</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dividendHistory.map((div) => (
                    <TableRow key={div.distributionId}>
                      <TableCell sx={{ color: '#fff' }}>{formatTimestamp(div.distributedAt)}</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.success }} align="right">{formatCurrency(div.totalAmount)}</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.tertiary }} align="right">{div.recipients}</TableCell>
                      <TableCell>
                        <Chip
                          label={div.status}
                          size="small"
                          sx={{
                            bgcolor: div.status === 'COMPLETED' ? `${THEME_COLORS.success}20` : `${THEME_COLORS.warning}20`,
                            color: div.status === 'COMPLETED' ? THEME_COLORS.success : THEME_COLORS.warning
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Trading Volume Chart */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.quaternary, mb: 2 }}>
              Trading Volume (30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tradingVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="volume" fill={THEME_COLORS.quaternary} />
              </BarChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RWATokenizationDashboard() {
  const { assets, loading: assetsLoading, error: assetsError, fetchAssets } = useAssetRegistry()
  const { tokens, loading: tokensLoading, fetchTokens } = useTokenRegistry()
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [tokenizeDialogOpen, setTokenizeDialogOpen] = useState(false)
  const [assetToTokenize, setAssetToTokenize] = useState<RWAAsset | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const { ownerships, fetchOwnerships } = useFractionalOwnership(selectedToken?.tokenId || null)
  const { proofs, loading: proofLoading, fetchProof } = useMerkleProofs()
  const { valuationHistory, dividendHistory, tradingVolume, fetchPerformance } = useAssetPerformance(selectedAsset?.id || null)

  const fetchAllData = useCallback(() => {
    fetchAssets()
    fetchTokens()
  }, [fetchAssets, fetchTokens])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAllData])

  useEffect(() => {
    if (selectedToken) {
      fetchOwnerships()
    }
  }, [selectedToken, fetchOwnerships])

  useEffect(() => {
    if (selectedAsset) {
      fetchPerformance()
    }
  }, [selectedAsset, fetchPerformance])

  const handleAssetClick = (asset: RWAAsset) => {
    setSelectedAsset(asset)
    setActiveTab(3) // Switch to performance tab
  }

  const handleTokenize = (asset: RWAAsset) => {
    setAssetToTokenize(asset)
    setTokenizeDialogOpen(true)
  }

  const handleTokenizationComplete = () => {
    setTokenizeDialogOpen(false)
    setAssetToTokenize(null)
    fetchAllData()
  }

  const handleGenerateProof = () => {
    if (selectedAsset) {
      fetchProof(selectedAsset.id)
    }
  }

  const isLoading = assetsLoading || tokensLoading

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MonetizationOn sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>
            Real-World Asset Tokenization Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isLoading && <CircularProgress size={24} sx={{ color: THEME_COLORS.primary }} />}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            disabled={isLoading}
            sx={{ borderColor: THEME_COLORS.primary, color: THEME_COLORS.primary }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {assetsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {assetsError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card sx={CARD_STYLE}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Assignment sx={{ fontSize: 32, color: THEME_COLORS.primary }} />
                    <Box>
                      <Typography variant="h4" sx={{ color: THEME_COLORS.primary, fontWeight: 700 }}>
                        {assets.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Total Assets
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={CARD_STYLE}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MonetizationOn sx={{ fontSize: 32, color: THEME_COLORS.success }} />
                    <Box>
                      <Typography variant="h4" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                        {assets.filter(a => a.tokenized).length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Tokenized Assets
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={CARD_STYLE}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AttachMoney sx={{ fontSize: 32, color: THEME_COLORS.tertiary }} />
                    <Box>
                      <Typography variant="h4" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700 }}>
                        {formatCurrency(assets.reduce((sum, a) => sum + a.valuation, 0)).replace(/\.\d+/, '')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Total Value
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={CARD_STYLE}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Verified sx={{ fontSize: 32, color: THEME_COLORS.quaternary }} />
                    <Box>
                      <Typography variant="h4" sx={{ color: THEME_COLORS.quaternary, fontWeight: 700 }}>
                        {assets.filter(a => a.verificationStatus === 'VERIFIED').length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Verified Assets
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Grid item xs={12}>
          <Card sx={CARD_STYLE}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
                '& .Mui-selected': { color: THEME_COLORS.primary }
              }}
            >
              <Tab label="Asset Registry" />
              <Tab label="Token Management" />
              <Tab label="Fractional Ownership" />
              <Tab label="Merkle Verification" />
              <Tab label="Performance Analytics" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <AssetRegistryTable
                  assets={assets}
                  onAssetClick={handleAssetClick}
                  onTokenize={handleTokenize}
                />
              )}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Token Management
                  </Typography>
                  <Alert severity="info">
                    Token management interface - View and manage all tokenized assets
                  </Alert>
                </Box>
              )}
              {activeTab === 2 && (
                <FractionalOwnershipInterface
                  token={selectedToken}
                  ownerships={ownerships}
                />
              )}
              {activeTab === 3 && (
                <MerkleVerificationDisplay
                  asset={selectedAsset}
                  proof={selectedAsset ? proofs[selectedAsset.id] : null}
                  onGenerateProof={handleGenerateProof}
                  loading={proofLoading}
                />
              )}
              {activeTab === 4 && (
                <AssetPerformanceAnalytics
                  asset={selectedAsset}
                  valuationHistory={valuationHistory}
                  dividendHistory={dividendHistory}
                  tradingVolume={tradingVolume}
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Token Creation Wizard Dialog */}
      <TokenCreationWizard
        open={tokenizeDialogOpen}
        asset={assetToTokenize}
        onClose={() => {
          setTokenizeDialogOpen(false)
          setAssetToTokenize(null)
        }}
        onComplete={handleTokenizationComplete}
      />
    </Box>
  )
}
