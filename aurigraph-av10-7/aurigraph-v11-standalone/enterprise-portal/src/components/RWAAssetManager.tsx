/**
 * RWAAssetManager.tsx - Real-world asset token manager component
 * Manages RWA tokenization, valuation, and compliance
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Pagination,
} from '@mui/material'
import {
  Add, Edit, Freeze, Lock, Visibility, TrendingUp,
} from '@mui/icons-material'
import { rwaApi } from '../services/phase1Api'
import type { RWAAsset, RWAPortfolio } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const STATUS_COLORS = {
  active: '#00BFA5',
  pending: '#FFD93D',
  frozen: '#6c757d',
  liquidated: '#FF6B6B',
}

export const RWAAssetManager: React.FC = () => {
  const [assets, setAssets] = useState<RWAAsset[]>([])
  const [portfolio, setPortfolio] = useState<RWAPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'mint' | 'burn' | 'freeze' | 'update_valuation' | null
    assetId: string | null
  }>({
    open: false,
    type: null,
    assetId: null,
  })
  const [actionAmount, setActionAmount] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [assetsData, portfolioData] = await Promise.all([
        rwaApi.getAssets(page, pageSize, filterType || undefined, filterStatus || undefined),
        rwaApi.getPortfolio(),
      ])
      setAssets(assetsData.items)
      setTotalCount(assetsData.totalCount)
      setPortfolio(portfolioData)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RWA data')
      setLoading(false)
    }
  }, [page, pageSize, filterType, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = useCallback(async () => {
    if (!actionDialog.assetId || !actionAmount) return

    try {
      switch (actionDialog.type) {
        case 'mint':
          await rwaApi.mintTokens(actionDialog.assetId, parseFloat(actionAmount), 'recipient-address')
          break
        case 'burn':
          await rwaApi.burnTokens(actionDialog.assetId, parseFloat(actionAmount))
          break
        case 'freeze':
          await rwaApi.freezeAsset(actionDialog.assetId, actionAmount)
          break
        case 'update_valuation':
          await rwaApi.updateValuation(actionDialog.assetId, parseFloat(actionAmount), 'manual')
          break
      }
      setActionDialog({ open: false, type: null, assetId: null })
      setActionAmount('')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }, [actionDialog, actionAmount, fetchData])

  if (loading && !portfolio) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}<Button onClick={fetchData} sx={{ ml: 2 }}>Retry</Button></Alert>
  }

  if (!portfolio) return null

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>RWA Asset Manager</Typography>
        <Button variant="contained" startIcon={<Add />}>Create Asset</Button>
      </Box>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                ${(portfolio.totalValue / 1000000).toFixed(2)}M
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Portfolio Value</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                {portfolio.totalAssets}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Assets</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                  {portfolio.performance.monthly > 0 ? '+' : ''}{portfolio.performance.monthly.toFixed(2)}%
                </Typography>
                <TrendingUp sx={{ color: '#FFD93D' }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Performance</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Asset Type</InputLabel>
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                  <MenuItem value="commodity">Commodity</MenuItem>
                  <MenuItem value="art">Art</MenuItem>
                  <MenuItem value="bond">Bond</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="frozen">Frozen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Tokenized</TableCell>
                  <TableCell>Supply</TableCell>
                  <TableCell>Price/Token</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{asset.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{asset.tokenId}</Typography>
                    </TableCell>
                    <TableCell><Chip label={asset.assetType} size="small" /></TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        size="small"
                        sx={{ bgcolor: `${STATUS_COLORS[asset.status]}20`, color: STATUS_COLORS[asset.status] }}
                      />
                    </TableCell>
                    <TableCell>${asset.totalValue.toLocaleString()}</TableCell>
                    <TableCell>${asset.tokenizedValue.toLocaleString()}</TableCell>
                    <TableCell>{asset.circulatingSupply.toLocaleString()} / {asset.totalSupply.toLocaleString()}</TableCell>
                    <TableCell>${asset.pricePerToken.toFixed(2)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedAsset(asset); setDetailsOpen(true); }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setActionDialog({ open: true, type: 'mint', assetId: asset.id })}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setActionDialog({ open: true, type: 'freeze', assetId: asset.id })}
                        >
                          <Freeze fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Asset Details</DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Name:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedAsset.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Type:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedAsset.assetType}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Owner:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedAsset.owner}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: null, assetId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'mint' && 'Mint Tokens'}
          {actionDialog.type === 'burn' && 'Burn Tokens'}
          {actionDialog.type === 'freeze' && 'Freeze Asset'}
          {actionDialog.type === 'update_valuation' && 'Update Valuation'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={actionDialog.type === 'freeze' ? 'Reason' : 'Amount'}
            value={actionAmount}
            onChange={(e) => setActionAmount(e.target.value)}
            type={actionDialog.type === 'freeze' ? 'text' : 'number'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: null, assetId: null })}>Cancel</Button>
          <Button onClick={handleAction} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RWAAssetManager
