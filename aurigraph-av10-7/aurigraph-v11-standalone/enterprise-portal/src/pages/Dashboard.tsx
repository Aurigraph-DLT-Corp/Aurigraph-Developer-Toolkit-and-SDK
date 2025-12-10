import { Grid, Card, CardContent, Typography, Box, Button, Chip, Avatar, Paper, Divider } from '@mui/material'
import {
  AccountBalance, TrendingUp, Token, Gavel, Security, ArrowForward,
  PlayArrow, Inventory, ShowChart, VerifiedUser, AccountTree
} from '@mui/icons-material'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURED_ASSETS } from '../services/DemoTokenService'

// ============================================================================
// RWAT-FOCUSED DASHBOARD - Real World Asset Tokenization
// ============================================================================

const API_BASE_URL = 'https://dlt.aurigraph.io'

interface MarketplaceStats {
  totalAssets: number
  totalValue: number
  activeListings: number
  categories: number
}

interface RWAStats {
  totalUnderlyingAssets: number
  totalTokens: number
  totalValue: number
  verifiedAssets: number
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  height: '100%'
}

const ACCENT_CARD = {
  background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
  borderRadius: 3,
  color: 'white'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats>({ totalAssets: 0, totalValue: 0, activeListings: 0, categories: 0 })
  const [rwaStats, setRwaStats] = useState<RWAStats>({ totalUnderlyingAssets: 0, totalTokens: 0, totalValue: 0, verifiedAssets: 0 })
  const [featuredAssets, setFeaturedAssets] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    try {
      // Fetch marketplace data
      const marketResponse = await fetch(`${API_BASE_URL}/api/v11/marketplace/assets/search`)
      if (marketResponse.ok) {
        const data = await marketResponse.json()
        const assets = data.assets || []
        setFeaturedAssets(assets.slice(0, 4))
        setMarketplaceStats({
          totalAssets: data.totalResults || assets.length,
          totalValue: assets.reduce((sum: number, a: any) => sum + (a.price || 0), 0),
          activeListings: assets.filter((a: any) => a.verificationStatus === 'verified').length,
          categories: 6
        })
      }

      // Fetch RWA registry data
      const rwaResponse = await fetch(`${API_BASE_URL}/api/v11/rwa/registry`)
      if (rwaResponse.ok) {
        const data = await rwaResponse.json()
        setRwaStats({
          totalUnderlyingAssets: data.stats?.totalUnderlyingAssets || 0,
          totalTokens: data.stats?.totalTokens || 0,
          totalValue: data.stats?.totalValue || 0,
          verifiedAssets: data.assets?.filter((a: any) => a.status === 'verified').length || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Hero Section */}
      <Paper sx={{ ...ACCENT_CARD, p: 4, mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Real World Asset Tokenization
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, fontWeight: 400 }}>
              Tokenize real estate, commodities, art, and more on Aurigraph's enterprise blockchain.
              Fractional ownership, instant settlement, full compliance.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: '#1E3A8A', color: 'white', fontWeight: 600, px: 4, '&:hover': { bgcolor: '#1E40AF' } }}
                onClick={() => navigate('/rwa/tokenize')}
                startIcon={<Token />}
              >
                Tokenize Asset
              </Button>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: '#1E40AF', color: 'white', fontWeight: 600, px: 4, '&:hover': { bgcolor: '#2563EB' } }}
                onClick={() => navigate('/rwa/registry-navigation')}
                startIcon={<AccountTree />}
              >
                Asset Registry
              </Button>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: '#172554', color: 'white', fontWeight: 600, px: 4, '&:hover': { bgcolor: '#1E3A8A' } }}
                onClick={() => navigate('/demo')}
                startIcon={<PlayArrow />}
              >
                Try Live Demo
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{formatCurrency(rwaStats.totalValue)}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Value Tokenized</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{rwaStats.totalTokens}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Tokens</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#00BFA520', color: '#00BFA5', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Inventory sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>{marketplaceStats.totalAssets}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Listed Assets</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#4ECDC420', color: '#4ECDC4', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <AccountBalance sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>{formatCurrency(marketplaceStats.totalValue)}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Market Cap</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#FFD93D20', color: '#FFD93D', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <VerifiedUser sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>{marketplaceStats.activeListings}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Verified Assets</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#FF6B6B20', color: '#FF6B6B', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Security sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>{rwaStats.totalUnderlyingAssets}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Underlying Assets</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Featured Assets */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Featured Assets</Typography>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => navigate('/marketplace')}
            sx={{ color: '#00BFA5' }}
          >
            View Marketplace
          </Button>
        </Box>
        <Grid container spacing={3}>
          {featuredAssets.map((asset, index) => (
            <Grid item xs={12} sm={6} md={3} key={asset.assetId || index}>
              <Card sx={{ ...CARD_STYLE, cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                <Box
                  sx={{
                    height: 140,
                    backgroundImage: `url(${asset.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12px 12px 0 0'
                  }}
                />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', mb: 1 }} noWrap>
                    {asset.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={asset.category?.replace('_', ' ')}
                      size="small"
                      sx={{ bgcolor: 'rgba(0,191,165,0.2)', color: '#00BFA5', fontSize: '0.7rem' }}
                    />
                    <Typography variant="h6" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                      {formatCurrency(asset.price)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Get Started</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ ...CARD_STYLE, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#9B59B620', color: '#9B59B6' }}><AccountTree /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Asset Registry</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  Navigate the complete registry of tokenized assets with full lifecycle tracking.
                </Typography>
                <Button variant="contained" size="small" onClick={() => navigate('/rwa/registry-navigation')} sx={{ bgcolor: '#9B59B6' }}>
                  View Registry
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ ...CARD_STYLE, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#00BFA520', color: '#00BFA5' }}><Token /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Tokenize Asset</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  Convert real estate, art, commodities into blockchain tokens.
                </Typography>
                <Button variant="contained" size="small" onClick={() => navigate('/rwa/tokenize')} sx={{ bgcolor: '#00BFA5' }}>
                  Start Tokenizing
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ ...CARD_STYLE, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#4ECDC420', color: '#4ECDC4' }}><ShowChart /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Marketplace</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  Discover verified tokenized assets and invest fractionally.
                </Typography>
                <Button variant="contained" size="small" onClick={() => navigate('/marketplace')} sx={{ bgcolor: '#4ECDC4' }}>
                  Explore Assets
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ ...CARD_STYLE, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#FFD93D20', color: '#FFD93D' }}><PlayArrow /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Live Demo</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  See RWAT in action with live tokenization demo.
                </Typography>
                <Button variant="contained" size="small" onClick={() => navigate('/demo')} sx={{ bgcolor: '#FFD93D', color: '#1A1F3A' }}>
                  Launch Demo
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tokenization Use Cases */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Tokenization Use Cases</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Explore different asset types with interactive demos
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => navigate('/demo/token-experience')}
            sx={{ color: '#00BFA5' }}
          >
            View All Demos
          </Button>
        </Box>
        <Grid container spacing={2}>
          {FEATURED_ASSETS.map((asset) => (
            <Grid item xs={12} sm={6} md={3} key={asset.id}>
              <Card
                sx={{
                  ...CARD_STYLE,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#00BFA5',
                    boxShadow: '0 8px 24px rgba(0,191,165,0.2)'
                  }
                }}
                onClick={() => navigate(`/demo/token-experience?asset=${asset.id}`)}
              >
                <Box
                  sx={{
                    height: 120,
                    backgroundImage: `linear-gradient(135deg, rgba(0,191,165,0.1) 0%, rgba(78,205,196,0.1) 100%), url(${asset.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <Typography sx={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                    {asset.icon}
                  </Typography>
                  <Chip
                    label="Demo"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: '#00BFA5',
                      color: '#fff',
                      fontSize: '0.65rem',
                      height: 20
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', mb: 0.5 }}>
                    {asset.useCase}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 1 }}>
                    {asset.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {asset.highlights.slice(0, 2).map((h, i) => (
                      <Chip
                        key={i}
                        label={h}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          bgcolor: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.7)'
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                      ${asset.value.toLocaleString()}
                    </Typography>
                    <Chip
                      label={asset.assetType.replace('_', ' ')}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: 'rgba(0,191,165,0.15)',
                        color: '#00BFA5'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
