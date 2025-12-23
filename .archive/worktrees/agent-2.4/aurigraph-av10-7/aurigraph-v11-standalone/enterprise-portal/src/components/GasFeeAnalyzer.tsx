/**
 * GasFeeAnalyzer.tsx
 * Display gas price trends and fee estimation calculator
 * AV11-284: Gas Fee Analyzer
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  LocalGasStation as GasIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { gasFeeApi } from '../services/phase2Api'
import type { GasFeeData, GasFeeHistory, GasFeeEstimate, GasTrend } from '../types/phase2'

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 2,
}

const REFRESH_INTERVAL = 15000 // 15 seconds

const TRANSACTION_TYPES = [
  { value: 'transfer', label: 'Simple Transfer', estimatedGas: 21000 },
  { value: 'contract_call', label: 'Contract Call', estimatedGas: 50000 },
  { value: 'contract_deploy', label: 'Contract Deploy', estimatedGas: 300000 },
  { value: 'swap', label: 'Token Swap', estimatedGas: 150000 },
]

// ============================================================================
// TYPES
// ============================================================================

interface ChartDataPoint {
  timestamp: string
  baseFee: number
  priorityFee: number
  gasPrice: number
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatGwei = (value: number): string => {
  return value.toFixed(2)
}

const formatEth = (value: string): string => {
  try {
    const num = parseFloat(value)
    return num.toFixed(6)
  } catch {
    return value
  }
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GasFeeAnalyzer: React.FC = () => {
  const [currentGasFees, setCurrentGasFees] = useState<GasFeeData | null>(null)
  const [gasFeeHistory, setGasFeeHistory] = useState<GasFeeHistory | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [gasTrend, setGasTrend] = useState<GasTrend | null>(null)
  const [estimate, setEstimate] = useState<GasFeeEstimate | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Calculator state
  const [selectedTxType, setSelectedTxType] = useState('transfer')
  const [customGasLimit, setCustomGasLimit] = useState<number>(21000)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchGasFeeData = useCallback(async () => {
    try {
      setError(null)

      // Fetch current gas fees
      const current = await gasFeeApi.getCurrentGasFees()
      setCurrentGasFees(current)

      // Fetch gas fee history
      const history = await gasFeeApi.getGasFeeHistory(period)
      setGasFeeHistory(history)

      // Transform history data for chart
      const data: ChartDataPoint[] = history.timestamps.map((timestamp, idx) => ({
        timestamp,
        baseFee: history.baseFees[idx],
        priorityFee: history.priorityFees[idx],
        gasPrice: history.gasPrices[idx],
      }))
      setChartData(data)

      // Fetch trend data
      const trend = await gasFeeApi.getGasTrends(period)
      setGasTrend(trend)

      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gas fee data'
      setError(errorMessage)
      setLoading(false)
      console.error('Failed to fetch gas fee data:', err)
    }
  }, [period])

  useEffect(() => {
    fetchGasFeeData()
    const interval = setInterval(fetchGasFeeData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchGasFeeData])

  // ============================================================================
  // CALCULATOR
  // ============================================================================

  const calculateGasFee = async () => {
    try {
      const txType = TRANSACTION_TYPES.find((t) => t.value === selectedTxType)
      const gasLimit = txType?.estimatedGas || customGasLimit

      const est = await gasFeeApi.estimateGasFee(selectedTxType, { gasLimit })
      setEstimate(est)
    } catch (err) {
      console.error('Failed to estimate gas fee:', err)
    }
  }

  useEffect(() => {
    if (currentGasFees) {
      calculateGasFee()
    }
  }, [selectedTxType, customGasLimit, currentGasFees])

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderTrendIcon = () => {
    if (!gasTrend) return null

    const icons = {
      increasing: <TrendingUpIcon color="error" />,
      decreasing: <TrendingDownIcon color="success" />,
      stable: <TrendingFlatIcon color="info" />,
    }

    return (
      <Tooltip title={`${gasTrend.trend} (${gasTrend.percentageChange.toFixed(1)}%)`}>
        {icons[gasTrend.trend]}
      </Tooltip>
    )
  }

  const renderCurrentGasFees = () => {
    if (!currentGasFees) return null

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Slow (30+ min)
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatGwei(currentGasFees.slow)} Gwei
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196F3' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Standard (3-5 min)
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatGwei(currentGasFees.standard)} Gwei
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #FF9800' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fast (&lt;1 min)
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatGwei(currentGasFees.fast)} Gwei
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(156, 39, 176, 0.1)', border: '1px solid #9C27B0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Base Fee
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatGwei(currentGasFees.baseFee)} Gwei
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    )
  }

  const renderGasChart = () => {
    if (chartData.length === 0) return null

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="rgba(255,255,255,0.5)"
          />
          <YAxis stroke="rgba(255,255,255,0.5)" label={{ value: 'Gwei', angle: -90 }} />
          <RechartsTooltip
            contentStyle={{
              background: 'rgba(26, 31, 58, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            labelFormatter={(value) => new Date(value).toLocaleString()}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="gasPrice"
            stackId="1"
            stroke="#8884d8"
            fill="#8884d8"
            name="Gas Price"
          />
          <Area
            type="monotone"
            dataKey="baseFee"
            stackId="2"
            stroke="#82ca9d"
            fill="#82ca9d"
            name="Base Fee"
          />
          <Area
            type="monotone"
            dataKey="priorityFee"
            stackId="3"
            stroke="#ffc658"
            fill="#ffc658"
            name="Priority Fee"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  const renderCalculator = () => {
    if (!estimate) return null

    return (
      <Box>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={selectedTxType}
                onChange={(e) => setSelectedTxType(e.target.value)}
                label="Transaction Type"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Custom Gas Limit"
              type="number"
              value={customGasLimit}
              onChange={(e) => setCustomGasLimit(parseInt(e.target.value) || 21000)}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ background: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Speed</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Gas Cost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>USD Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Est. Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Chip label="Slow" color="success" size="small" />
                </TableCell>
                <TableCell>{formatEth(estimate.totalCost.slow)} ETH</TableCell>
                <TableCell>${estimate.fiatValue.slow}</TableCell>
                <TableCell>{estimate.estimatedTime.slow}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Chip label="Standard" color="primary" size="small" />
                </TableCell>
                <TableCell>{formatEth(estimate.totalCost.standard)} ETH</TableCell>
                <TableCell>${estimate.fiatValue.standard}</TableCell>
                <TableCell>{estimate.estimatedTime.standard}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Chip label="Fast" color="warning" size="small" />
                </TableCell>
                <TableCell>{formatEth(estimate.totalCost.fast)} ETH</TableCell>
                <TableCell>${estimate.fiatValue.fast}</TableCell>
                <TableCell>{estimate.estimatedTime.fast}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  const renderTrendStats = () => {
    if (!gasTrend) return null

    return (
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Average
          </Typography>
          <Typography variant="h6">{formatGwei(gasTrend.average)} Gwei</Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Median
          </Typography>
          <Typography variant="h6">{formatGwei(gasTrend.median)} Gwei</Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Min / Max
          </Typography>
          <Typography variant="h6">
            {formatGwei(gasTrend.min)} / {formatGwei(gasTrend.max)}
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Trend
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{gasTrend.percentageChange.toFixed(1)}%</Typography>
            {renderTrendIcon()}
          </Box>
        </Grid>
      </Grid>
    )
  }

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={fetchGasFeeData} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box>
      {/* Header */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600} display="flex" alignItems="center" gap={1}>
              <GasIcon /> Gas Fee Analyzer
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24h</MenuItem>
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchGasFeeData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {renderCurrentGasFees()}
        </CardContent>
      </Card>

      {/* Gas Price Chart */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Gas Price History
          </Typography>
          {renderGasChart()}
        </CardContent>
      </Card>

      {/* Trend Statistics */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Trend Statistics ({period})
          </Typography>
          {renderTrendStats()}
        </CardContent>
      </Card>

      {/* Fee Calculator */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600} display="flex" alignItems="center" gap={1}>
            <CalculateIcon /> Fee Estimator
          </Typography>
          {renderCalculator()}
        </CardContent>
      </Card>
    </Box>
  )
}

export default GasFeeAnalyzer
