/**
 * BridgeStatusMonitor.tsx - Cross-chain bridge status UI component
 * Monitors bridge health, transfers, and chain connectivity
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material'
import { Refresh, Link as LinkIcon, Warning, CheckCircle, Cancel } from '@mui/icons-material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { bridgeApi } from '../services/phase1Api'
import type { BridgeStatistics, BridgeHealth, BridgeTransfer } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const STATUS_COLORS = {
  pending: '#FFD93D',
  processing: '#4ECDC4',
  completed: '#00BFA5',
  failed: '#FF6B6B',
  refunded: '#6c757d',
}

const HEALTH_COLORS = {
  healthy: '#00BFA5',
  degraded: '#FFD93D',
  critical: '#FF6B6B',
}

export const BridgeStatusMonitor: React.FC = () => {
  const [statistics, setStatistics] = useState<BridgeStatistics | null>(null)
  const [health, setHealth] = useState<BridgeHealth | null>(null)
  const [transfers, setTransfers] = useState<BridgeTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<BridgeTransfer | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [statsData, healthData, transfersData] = await Promise.all([
        bridgeApi.getBridgeStatistics(),
        bridgeApi.getBridgeHealth(),
        bridgeApi.getTransfers(1, 20),
      ])
      setStatistics(statsData)
      setHealth(healthData)
      setTransfers(transfersData.items)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bridge data')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRetryTransfer = useCallback(async (transferId: string) => {
    try {
      await bridgeApi.retryTransfer(transferId)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry transfer')
    }
  }, [fetchData])

  if (loading && !statistics) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}<Button onClick={fetchData} sx={{ ml: 2 }}>Retry</Button></Alert>
  }

  if (!statistics || !health) return null

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Bridge Status Monitor</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      {/* Health Status */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Overall Bridge Health</Typography>
            <Chip
              label={health.overall}
              sx={{ bgcolor: `${HEALTH_COLORS[health.overall]}20`, color: HEALTH_COLORS[health.overall] }}
            />
          </Box>
          <Grid container spacing={2}>
            {health.chains.map((chain) => (
              <Grid item xs={12} sm={6} md={4} key={chain.chainId}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" fontWeight={600}>{chain.chainName}</Typography>
                    <Chip
                      size="small"
                      label={chain.status}
                      color={chain.status === 'active' ? 'success' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">Latency: {chain.latency}ms</Typography>
                  <Typography variant="body2" color="textSecondary">Error Rate: {chain.errorRate.toFixed(2)}%</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                {statistics.totalTransfers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Transfers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                ${(statistics.totalVolume / 1000000).toFixed(2)}M
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Volume</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                {statistics.successRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Success Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                {statistics.averageProcessingTime.toFixed(0)}s
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Avg Processing</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transfers */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Transfers</Typography>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {transfer.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{transfer.sourceChain}</TableCell>
                    <TableCell>{transfer.targetChain}</TableCell>
                    <TableCell>{transfer.amount.toLocaleString()}</TableCell>
                    <TableCell>{transfer.token}</TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        size="small"
                        sx={{
                          bgcolor: `${STATUS_COLORS[transfer.status]}20`,
                          color: STATUS_COLORS[transfer.status],
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption">
                          {transfer.confirmations}/{transfer.requiredConfirmations}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(transfer.confirmations / transfer.requiredConfirmations) * 100}
                          sx={{ mt: 0.5, height: 4, bgcolor: 'rgba(255,255,255,0.1)' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {transfer.status === 'failed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleRetryTransfer(transfer.id)}
                        >
                          Retry
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTransfer(transfer)
                          setDetailsOpen(true)
                        }}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Transfer Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Transfer Details</DialogTitle>
        <DialogContent>
          {selectedTransfer && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">ID:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedTransfer.id}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Source Chain:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedTransfer.sourceChain}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Target Chain:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedTransfer.targetChain}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Amount:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedTransfer.amount} {selectedTransfer.token}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Status:</Typography></Grid>
                <Grid item xs={6}>
                  <Chip
                    label={selectedTransfer.status}
                    size="small"
                    sx={{
                      bgcolor: `${STATUS_COLORS[selectedTransfer.status]}20`,
                      color: STATUS_COLORS[selectedTransfer.status],
                    }}
                  />
                </Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">TX Hash:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedTransfer.txHash}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BridgeStatusMonitor
