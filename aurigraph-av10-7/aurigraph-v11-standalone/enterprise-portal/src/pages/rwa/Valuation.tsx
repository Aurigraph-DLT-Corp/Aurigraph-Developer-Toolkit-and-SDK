import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material'
import {
  TrendingUp,
  Assessment,
  Refresh,
  ShowChart,
  CompareArrows,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { apiService, safeApiCall } from '../../services/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
}

interface ValuationData {
  date: string
  value: number
}

interface MarketComparison {
  assetName: string
  yourValue: number
  marketAverage: number
  difference: number
  differencePercent: number
}

// Sample historical data
const SAMPLE_VALUATION_HISTORY: ValuationData[] = [
  { date: 'Jan', value: 420000 },
  { date: 'Feb', value: 430000 },
  { date: 'Mar', value: 425000 },
  { date: 'Apr', value: 445000 },
  { date: 'May', value: 455000 },
  { date: 'Jun', value: 475000 },
]

const SAMPLE_MARKET_COMPARISONS: MarketComparison[] = [
  {
    assetName: 'Manhattan Office Building',
    yourValue: 250000,
    marketAverage: 240000,
    difference: 10000,
    differencePercent: 4.17,
  },
  {
    assetName: 'Picasso Art Collection',
    yourValue: 150000,
    marketAverage: 155000,
    difference: -5000,
    differencePercent: -3.23,
  },
  {
    assetName: 'Gold Reserves',
    yourValue: 75000,
    marketAverage: 73000,
    difference: 2000,
    differencePercent: 2.74,
  },
]

export default function Valuation() {
  const [valuationHistory, setValuationHistory] = useState<ValuationData[]>(SAMPLE_VALUATION_HISTORY)
  const [marketComparisons, setMarketComparisons] = useState<MarketComparison[]>(SAMPLE_MARKET_COMPARISONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchValuationData = async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(
      () => apiService.getRWAValuation(),
      { total: 0, assets: [] }
    )

    if (result.success && result.data.assets && result.data.assets.length > 0) {
      // Transform API data to market comparisons
      const transformedComparisons: MarketComparison[] = result.data.assets.map((asset: any) => ({
        assetName: asset.name || asset.assetName || 'Unknown Asset',
        yourValue: parseFloat(asset.currentValue || asset.value || '0'),
        marketAverage: parseFloat(asset.marketAverage || asset.currentValue || '0'),
        difference: parseFloat(asset.difference || '0'),
        differencePercent: parseFloat(asset.differencePercent || '0'),
      }))
      setMarketComparisons(transformedComparisons)

      // Generate historical data if available
      if (asset.history && Array.isArray(asset.history)) {
        const transformedHistory: ValuationData[] = asset.history.map((h: any) => ({
          date: h.date || h.month || '',
          value: parseFloat(h.value || '0'),
        }))
        setValuationHistory(transformedHistory)
      }
    } else if (!result.success) {
      setError(result.error?.message || 'Failed to load valuation data')
      // Keep sample data on error
    }

    setLoading(false)
  }

  const handleRefresh = () => {
    fetchValuationData()
  }

  useEffect(() => {
    fetchValuationData()
  }, [])

  const currentValue = valuationHistory[valuationHistory.length - 1]?.value || 0
  const previousValue = valuationHistory[valuationHistory.length - 2]?.value || 0
  const valueChange = currentValue - previousValue
  const valueChangePercent = (valueChange / previousValue) * 100

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Asset Valuation Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Real-time asset valuations and market analysis
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

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Displaying sample data
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Current Portfolio Value
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                ${currentValue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp
                  sx={{
                    color: valueChange >= 0 ? THEME_COLORS.primary : THEME_COLORS.error,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: valueChange >= 0 ? THEME_COLORS.primary : THEME_COLORS.error,
                    fontWeight: 600,
                  }}
                >
                  {valueChange >= 0 ? '+' : ''}${valueChange.toLocaleString()} (
                  {valueChangePercent.toFixed(2)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShowChart sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Valuation Method
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                Market-Based Pricing
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Using comparative market analysis with AI-powered adjustments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CompareArrows sx={{ color: THEME_COLORS.warning, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Last Updated
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Next update: {new Date(Date.now() + 86400000).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Historical Valuation Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Historical Valuation (6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={valuationHistory}>
                  <defs>
                    <linearGradient id="valuationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1F3A',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={THEME_COLORS.primary}
                    fill="url(#valuationGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Comparison */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Market Comparison Analysis
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Asset
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Your Value
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Market Average
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Difference
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketComparisons.map((comparison, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {comparison.assetName}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          ${comparison.yourValue.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          ${comparison.marketAverage.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: comparison.difference >= 0 ? THEME_COLORS.primary : THEME_COLORS.error,
                            fontWeight: 600,
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {comparison.difference >= 0 ? '+' : ''}${comparison.difference.toLocaleString()}
                          <br />
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              color: comparison.difference >= 0 ? THEME_COLORS.primary : THEME_COLORS.error,
                            }}
                          >
                            ({comparison.difference >= 0 ? '+' : ''}
                            {comparison.differencePercent.toFixed(2)}%)
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip
                            label={comparison.difference >= 0 ? 'Above Market' : 'Below Market'}
                            size="small"
                            sx={{
                              bgcolor:
                                comparison.difference >= 0
                                  ? 'rgba(0, 191, 165, 0.2)'
                                  : 'rgba(255, 107, 107, 0.2)',
                              color: comparison.difference >= 0 ? THEME_COLORS.primary : THEME_COLORS.error,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Valuation Methodology Info */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Card sx={{ ...CARD_STYLE, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              Valuation Methodology
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 191, 165, 0.1)',
                    border: `1px solid ${THEME_COLORS.primary}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
                    Market Data Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Utilizes real-time market data from multiple sources including recent sales,
                    current listings, and historical trends.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(78, 205, 196, 0.1)',
                    border: `1px solid ${THEME_COLORS.secondary}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.secondary, mb: 1 }}>
                    AI-Powered Adjustments
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Machine learning algorithms adjust valuations based on asset-specific factors,
                    location, condition, and market conditions.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 217, 61, 0.1)',
                    border: `1px solid ${THEME_COLORS.warning}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: THEME_COLORS.warning, mb: 1 }}>
                    Expert Verification
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    All automated valuations are reviewed and verified by certified appraisers and
                    industry experts.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
