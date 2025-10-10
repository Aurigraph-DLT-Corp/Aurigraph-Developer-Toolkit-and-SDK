/**
 * RWA Portfolio Component
 * Displays user's Real-World Asset token portfolio with analytics
 */

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Divider, IconButton, Tooltip
} from '@mui/material'
import {
  AccountBalance, TrendingUp, TrendingDown, Refresh, Download,
  Visibility, SwapHoriz
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { fetchPortfolio, selectPortfolio } from '../../store/rwaSlice'
import { AssetType } from '../../types/rwa'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)'
}

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  [AssetType.CARBON_CREDIT]: '#4CAF50',
  [AssetType.REAL_ESTATE]: '#2196F3',
  [AssetType.FINANCIAL]: '#FF9800',
  [AssetType.ARTWORK]: '#9C27B0',
  [AssetType.COMMODITY]: '#FFEB3B',
  [AssetType.VEHICLE]: '#00BCD4',
  [AssetType.EQUIPMENT]: '#795548',
  [AssetType.OTHER]: '#9E9E9E'
}

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  [AssetType.CARBON_CREDIT]: '🌱',
  [AssetType.REAL_ESTATE]: '🏢',
  [AssetType.FINANCIAL]: '💰',
  [AssetType.ARTWORK]: '🎨',
  [AssetType.COMMODITY]: '⚡',
  [AssetType.VEHICLE]: '🚗',
  [AssetType.EQUIPMENT]: '🔧',
  [AssetType.OTHER]: '📦'
}

export default function RWAPortfolio() {
  const dispatch = useAppDispatch()
  const portfolio = useAppSelector(selectPortfolio)
  const [loading, setLoading] = useState(false)
  const [ownerAddress] = useState('0x1234567890abcdef1234567890abcdef12345678') // From auth context

  useEffect(() => {
    loadPortfolio()
  }, [ownerAddress])

  const loadPortfolio = async () => {
    setLoading(true)
    try {
      await dispatch(fetchPortfolio(ownerAddress)).unwrap()
    } catch (error) {
      console.error('Failed to load portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const assetDistributionData = useMemo(() => {
    if (!portfolio?.assetDistribution) return []
    return Object.entries(portfolio.assetDistribution).map(([type, count]) => ({
      name: type,
      value: count,
      icon: ASSET_TYPE_ICONS[type as AssetType]
    }))
  }, [portfolio])

  const portfolioMetrics = useMemo(() => {
    if (!portfolio) return { totalValue: '0', totalAssets: 0, avgValue: '0' }
    const avgValue = portfolio.tokens.length > 0
      ? (parseFloat(portfolio.totalValue) / portfolio.tokens.length).toFixed(2)
      : '0'
    return {
      totalValue: portfolio.totalValue,
      totalAssets: portfolio.tokens.length,
      avgValue
    }
  }, [portfolio])

  if (loading && !portfolio) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>
          My RWA Portfolio
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPortfolio}
            sx={{ color: '#00BFA5', borderColor: '#00BFA5' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00A890' } }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', width: 60, height: 60 }}>
                  <AccountBalance sx={{ fontSize: 32, color: '#00BFA5' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    ${parseFloat(portfolioMetrics.totalValue).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total Portfolio Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', width: 60, height: 60 }}>
                  <TrendingUp sx={{ fontSize: 32, color: '#2196F3' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    {portfolioMetrics.totalAssets}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total Assets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', width: 60, height: 60 }}>
                  <SwapHoriz sx={{ fontSize: 32, color: '#FF9800' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    ${parseFloat(portfolio?.totalDividendsReceived || '0').toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total Dividends
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
                Asset Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_TYPE_COLORS[entry.name as AssetType]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
                Asset Values by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#00BFA5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Token Table */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Asset Holdings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Asset</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Type</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Token ID</TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Value</TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)' }}>Yield</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio?.tokens.map((token) => (
                  <TableRow key={token.tokenId}>
                    <TableCell sx={{ color: '#fff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{ASSET_TYPE_ICONS[token.assetType]}</span>
                        <span>{token.metadata?.name || token.assetId}</span>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={token.assetType}
                        size="small"
                        sx={{
                          bgcolor: `${ASSET_TYPE_COLORS[token.assetType]}20`,
                          color: ASSET_TYPE_COLORS[token.assetType]
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                      {token.tokenId.substring(0, 16)}...
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>
                      ${parseFloat(token.assetValue).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#4CAF50' }}>
                      {token.currentYield ? `${parseFloat(token.currentYield).toFixed(2)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={token.status}
                        size="small"
                        color={token.status === 'ACTIVE' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" sx={{ color: '#00BFA5' }}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
