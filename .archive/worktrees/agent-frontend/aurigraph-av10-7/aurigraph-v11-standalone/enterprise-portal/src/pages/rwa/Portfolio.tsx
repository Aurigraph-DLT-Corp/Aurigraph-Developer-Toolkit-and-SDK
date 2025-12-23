import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  AccountBalance,
  Palette,
  LocalShipping,
  Assessment,
  TrendingUp,
  TrendingDown,
  Refresh,
  Visibility,
  AccountBalanceWallet,
} from '@mui/icons-material'
import { useState } from 'react'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  success: '#00BFA5',
  error: '#FF6B6B',
  warning: '#FFD93D',
}

interface Asset {
  id: string
  name: string
  type: string
  icon: JSX.Element
  value: number
  tokensOwned: number
  totalTokens: number
  purchasePrice: number
  currentPrice: number
  change: number
  changePercent: number
}

// Sample data - will be replaced with API data
const SAMPLE_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Manhattan Office Building',
    type: 'Real Estate',
    icon: <AccountBalance />,
    value: 250000,
    tokensOwned: 100,
    totalTokens: 1000,
    purchasePrice: 240000,
    currentPrice: 250000,
    change: 10000,
    changePercent: 4.17,
  },
  {
    id: '2',
    name: 'Picasso Art Collection',
    type: 'Art',
    icon: <Palette />,
    value: 150000,
    tokensOwned: 50,
    totalTokens: 200,
    purchasePrice: 160000,
    currentPrice: 150000,
    change: -10000,
    changePercent: -6.25,
  },
  {
    id: '3',
    name: 'Gold Reserves',
    type: 'Commodities',
    icon: <LocalShipping />,
    value: 75000,
    tokensOwned: 300,
    totalTokens: 500,
    purchasePrice: 70000,
    currentPrice: 75000,
    change: 5000,
    changePercent: 7.14,
  },
]

export default function Portfolio() {
  const [assets] = useState<Asset[]>(SAMPLE_ASSETS)
  const [loading, setLoading] = useState(false)
  const [walletConnected] = useState(true) // TODO: Connect to wallet provider

  const handleRefresh = () => {
    setLoading(true)
    // TODO: Fetch from API
    setTimeout(() => setLoading(false), 1000)
  }

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalGainLoss = assets.reduce((sum, asset) => sum + asset.change, 0)
  const totalGainLossPercent = (totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100

  if (!walletConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Card sx={{ ...CARD_STYLE, p: 4, textAlign: 'center' }}>
          <AccountBalanceWallet sx={{ fontSize: 80, color: THEME_COLORS.primary, mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Connect Wallet to View Portfolio
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Please connect your Web3 wallet to access your RWA portfolio
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ bgcolor: THEME_COLORS.primary, '&:hover': { bgcolor: '#00A88E' } }}
          >
            Connect Wallet
          </Button>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            My RWA Portfolio
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Track your tokenized real-world assets
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          sx={{
            bgcolor: 'rgba(0, 191, 165, 0.1)',
            '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.2)' },
          }}
        >
          <Refresh sx={{ color: THEME_COLORS.primary }} />
        </IconButton>
      </Box>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                ${totalPortfolioValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Total Gain/Loss
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: totalGainLoss >= 0 ? THEME_COLORS.success : THEME_COLORS.error,
                  }}
                >
                  {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
                </Typography>
                {totalGainLoss >= 0 ? (
                  <TrendingUp sx={{ color: THEME_COLORS.success }} />
                ) : (
                  <TrendingDown sx={{ color: THEME_COLORS.error }} />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: totalGainLoss >= 0 ? THEME_COLORS.success : THEME_COLORS.error,
                  mt: 0.5,
                }}
              >
                {totalGainLoss >= 0 ? '+' : ''}
                {totalGainLossPercent.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Assets Owned
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                {assets.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                Across {new Set(assets.map((a) => a.type)).size} categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Asset Cards */}
      <Grid container spacing={3}>
        {assets.map((asset) => (
          <Grid item xs={12} md={6} lg={4} key={asset.id}>
            <Card sx={{ ...CARD_STYLE, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(0, 191, 165, 0.1)',
                      color: THEME_COLORS.primary,
                    }}
                  >
                    {asset.icon}
                  </Box>
                  <Chip
                    label={asset.type}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  />
                </Box>

                {/* Asset Name */}
                <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                  {asset.name}
                </Typography>

                {/* Current Value */}
                <Typography variant="h4" sx={{ color: THEME_COLORS.primary, mb: 2, fontWeight: 700 }}>
                  ${asset.value.toLocaleString()}
                </Typography>

                {/* Ownership Info */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Tokens Owned
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {asset.tokensOwned} / {asset.totalTokens}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(asset.tokensOwned / asset.totalTokens) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: THEME_COLORS.primary,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                    {((asset.tokensOwned / asset.totalTokens) * 100).toFixed(1)}% ownership
                  </Typography>
                </Box>

                {/* Performance */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      asset.change >= 0
                        ? 'rgba(0, 191, 165, 0.1)'
                        : 'rgba(255, 107, 107, 0.1)',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Purchase Price
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      ${asset.purchasePrice.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Gain/Loss
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: asset.change >= 0 ? THEME_COLORS.success : THEME_COLORS.error,
                          fontWeight: 600,
                        }}
                      >
                        {asset.change >= 0 ? '+' : ''}${asset.change.toLocaleString()}
                      </Typography>
                      {asset.change >= 0 ? (
                        <TrendingUp sx={{ fontSize: 16, color: THEME_COLORS.success }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: THEME_COLORS.error }} />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: asset.change >= 0 ? THEME_COLORS.success : THEME_COLORS.error,
                      }}
                    >
                      {asset.change >= 0 ? '+' : ''}
                      {asset.changePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>

                {/* Action Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Visibility />}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    '&:hover': {
                      borderColor: THEME_COLORS.primary,
                      bgcolor: 'rgba(0, 191, 165, 0.1)',
                    },
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State (for when no assets) */}
      {assets.length === 0 && (
        <Card sx={{ ...CARD_STYLE, p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Assets Yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Start building your portfolio by tokenizing your first asset
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: THEME_COLORS.primary, '&:hover': { bgcolor: '#00A88E' } }}
          >
            Tokenize Asset
          </Button>
        </Card>
      )}
    </Box>
  )
}
