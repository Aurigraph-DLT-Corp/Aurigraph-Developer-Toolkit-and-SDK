/**
 * ValidatorPerformance.tsx
 * Validator metrics and slashing interface component
 * Displays validator performance, uptime, and slashing events
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tab,
  Tabs,
} from '@mui/material'
import {
  Gavel as SlashIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { validatorApi } from '../services/phase1Api'
import type { ValidatorInfo, ValidatorMetrics, SlashingEvent } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const STATUS_COLORS = {
  active: '#00BFA5',
  inactive: '#6c757d',
  jailed: '#FF6B6B',
  unbonding: '#FFD93D',
}

export const ValidatorPerformance: React.FC = () => {
  const [validators, setValidators] = useState<ValidatorInfo[]>([])
  const [metrics, setMetrics] = useState<ValidatorMetrics | null>(null)
  const [slashingEvents, setSlashingEvents] = useState<SlashingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null)
  const [slashDialogOpen, setSlashDialogOpen] = useState(false)
  const [slashReason, setSlashReason] = useState('')
  const [slashAmount, setSlashAmount] = useState('')
  const [tabValue, setTabValue] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch all validators
      const validatorsData = await validatorApi.getAllValidators()
      setValidators(validatorsData)

      // Construct metrics from validators data
      if (validatorsData && validatorsData.length > 0) {
        const activeValidators = validatorsData.filter(v => v.status === 'ACTIVE').length
        const totalStake = validatorsData.reduce((sum, v) => sum + (v.stake || 0), 0)
        const averageUptime = validatorsData.length > 0
          ? validatorsData.reduce((sum, v) => sum + (v.uptime || 0), 0) / validatorsData.length
          : 0
        const totalSlashingEvents = validatorsData.reduce((sum, v) => sum + (v.slashingEvents || 0), 0)

        setMetrics({
          activeValidators,
          totalValidators: validatorsData.length,
          totalStake,
          averageUptime,
          totalSlashingEvents,
          averageCommission: 0,
          totalDelegators: 0,
        } as ValidatorMetrics)
      }

      // Fetch slashing events with retry fallback
      try {
        const slashingData = await validatorApi.getSlashingEvents(1, 20)
        setSlashingEvents(slashingData.items || [])
      } catch (err) {
        // Fallback: empty slashing events if endpoint fails
        setSlashingEvents([])
      }

      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch validator data'
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleSlashValidator = useCallback(async () => {
    if (!selectedValidator || !slashReason || !slashAmount) return

    try {
      await validatorApi.slashValidator(selectedValidator.id, slashReason, parseFloat(slashAmount))
      setSlashDialogOpen(false)
      setSlashReason('')
      setSlashAmount('')
      fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to slash validator'
      setError(errorMessage)
    }
  }, [selectedValidator, slashReason, slashAmount, fetchData])

  const handleUnjailValidator = useCallback(async (validatorId: string) => {
    try {
      await validatorApi.unjailValidator(validatorId)
      fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unjail validator'
      setError(errorMessage)
    }
  }, [fetchData])

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Validator Performance
      </Typography>

      {/* Metrics Summary */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                  {metrics.activeValidators}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Active Validators
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                  {(metrics.totalStake / 1000000).toFixed(2)}M
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Total Stake
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                  {metrics.averageUptime.toFixed(2)}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Avg Uptime
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                  {metrics.totalSlashingEvents}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Slashing Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card sx={CARD_STYLE}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Validators" />
          <Tab label="Slashing Events" />
        </Tabs>

        {/* Validators Tab */}
        {tabValue === 0 && (
          <CardContent>
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Validator</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Stake</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Blocks</TableCell>
                    <TableCell>Voting Power</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validators.map((validator) => (
                    <TableRow key={validator.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {validator.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>
                            {formatAddress(validator.address)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={validator.status}
                          size="small"
                          sx={{
                            bgcolor: `${STATUS_COLORS[validator.status.toLowerCase()] || STATUS_COLORS.inactive}20`,
                            color: STATUS_COLORS[validator.status.toLowerCase()] || STATUS_COLORS.inactive,
                          }}
                          icon={validator.status === 'ACTIVE' ? <ActiveIcon /> : <InactiveIcon />}
                        />
                      </TableCell>
                      <TableCell>{(validator.stake / 1000000).toFixed(2)}M</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{validator.uptime.toFixed(2)}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(validator.uptime, 100)}
                            sx={{
                              mt: 0.5,
                              height: 4,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: validator.uptime > 95 ? '#00BFA5' : validator.uptime > 90 ? '#FFD93D' : '#FF6B6B',
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {validator.blocksProduced} blocks
                      </TableCell>
                      <TableCell>{((validator.votingPower || 0) / 1000000).toFixed(4)}</TableCell>
                      <TableCell>
                        {validator.status === 'JAILED' ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleUnjailValidator(validator.id)}
                          >
                            Unjail
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<SlashIcon />}
                            onClick={() => {
                              setSelectedValidator(validator)
                              setSlashDialogOpen(true)
                            }}
                          >
                            Slash
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Slashing Events Tab */}
        {tabValue === 1 && (
          <CardContent>
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Validator</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Block Height</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slashingEvents.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="body2">{event.validatorName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={event.type} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#FF6B6B' }}>
                        -{(event.amount / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell>{event.blockHeight}</TableCell>
                      <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          size="small"
                          color={
                            event.status === 'executed' ? 'error' : event.status === 'pending' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {event.reason}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
      </Card>

      {/* Slash Validator Dialog */}
      <Dialog open={slashDialogOpen} onClose={() => setSlashDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Slash Validator</DialogTitle>
        <DialogContent>
          {selectedValidator && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Validator: <strong>{selectedValidator.name}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Reason"
                value={slashReason}
                onChange={(e) => setSlashReason(e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Slash Amount"
                type="number"
                value={slashAmount}
                onChange={(e) => setSlashAmount(e.target.value)}
                helperText="Amount in tokens"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlashDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSlashValidator}
            color="error"
            variant="contained"
            disabled={!slashReason || !slashAmount}
          >
            Slash Validator
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ValidatorPerformance
