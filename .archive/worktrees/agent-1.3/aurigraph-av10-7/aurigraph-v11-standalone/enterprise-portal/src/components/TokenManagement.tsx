/**
 * TokenManagement.tsx
 * Token transfer and management UI component
 * Handles token operations, transfers, and wallet management
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
  Send as SendIcon,
  SwapHoriz as SwapIcon,
  Wallet as WalletIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#00BFA5',
  pending: '#FFD93D',
  failed: '#FF6B6B',
  confirmed: '#4ECDC4',
}

interface TokenBalance {
  token_id: string
  token_name: string
  balance: number
  decimals: number
  value_usd: number
}

interface TokenTransaction {
  tx_id: string
  from: string
  to: string
  amount: number
  token: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed' | 'confirmed'
  tx_hash: string
}

export const TokenManagement: React.FC = () => {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  // Mock data for demonstration
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Mock token balances
      const mockBalances: TokenBalance[] = [
        {
          token_id: 'AURI',
          token_name: 'Aurigraph Token',
          balance: 50000000,
          decimals: 18,
          value_usd: 1250000,
        },
        {
          token_id: 'ETH',
          token_name: 'Ethereum',
          balance: 25.5,
          decimals: 18,
          value_usd: 95875,
        },
        {
          token_id: 'USDC',
          token_name: 'USD Coin',
          balance: 500000,
          decimals: 6,
          value_usd: 500000,
        },
      ]

      // Mock transactions
      const mockTransactions: TokenTransaction[] = [
        {
          tx_id: 'tx-0001',
          from: '0x1234...5678',
          to: '0xabcd...efgh',
          amount: 1000,
          token: 'AURI',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
          tx_hash: '0x2d68d10b3e0c4ff2b28c4b0845db1a9f',
        },
        {
          tx_id: 'tx-0002',
          from: '0x9999...8888',
          to: '0x1234...5678',
          amount: 5,
          token: 'ETH',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: 'pending',
          tx_hash: '0xf07f2a5c40b14eeca790618e9506977d',
        },
        {
          tx_id: 'tx-0003',
          from: '0x1234...5678',
          to: '0x7777...6666',
          amount: 50000,
          token: 'USDC',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          status: 'confirmed',
          tx_hash: '0xabcdef123456789abcdef123456789abc',
        },
      ]

      setBalances(mockBalances)
      setTransactions(mockTransactions)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token data'
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTransfer = useCallback(async () => {
    if (!selectedToken || !recipientAddress || !transferAmount) {
      setError('Please fill all fields')
      return
    }

    try {
      setLoading(true)
      // Simulate transfer
      const newTransaction: TokenTransaction = {
        tx_id: `tx-${Date.now()}`,
        from: '0x1234...5678',
        to: recipientAddress,
        amount: parseFloat(transferAmount),
        token: selectedToken.token_id,
        timestamp: new Date().toISOString(),
        status: 'pending',
        tx_hash: `0x${Math.random().toString(16).substring(2)}`,
      }

      setTransactions([newTransaction, ...transactions])
      setTransferDialogOpen(false)
      setRecipientAddress('')
      setTransferAmount('')
      setLoading(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
      setLoading(false)
    }
  }, [selectedToken, recipientAddress, transferAmount, transactions])

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`
  }

  const formatNumber = (num: number, decimals: number = 2) => {
    return (num / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
  }

  if (loading && balances.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && balances.length === 0) {
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
        Token Management
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Balances Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {balances.map((balance) => (
          <Grid item xs={12} sm={6} md={4} key={balance.token_id}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {balance.token_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {balance.token_id}
                    </Typography>
                  </Box>
                  <WalletIcon sx={{ color: '#00BFA5', fontSize: 28 }} />
                </Box>

                <Typography variant="h5" sx={{ color: '#00BFA5', fontWeight: 700, mb: 1 }}>
                  {formatNumber(balance.balance, balance.decimals)}
                </Typography>

                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  ≈ ${balance.value_usd.toLocaleString('en-US')}
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SendIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setSelectedToken(balance)
                    setTransferDialogOpen(true)
                  }}
                >
                  Transfer
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={CARD_STYLE}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Recent Transactions" />
          <Tab label="Statistics" />
        </Tabs>

        {/* Transactions Tab */}
        {tabValue === 0 && (
          <CardContent>
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.tx_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {tx.tx_id}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {formatAddress(tx.from)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {formatAddress(tx.to)}
                      </TableCell>
                      <TableCell>{tx.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={tx.token} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            tx.status === 'completed'
                              ? CompleteIcon
                              : tx.status === 'pending'
                              ? PendingIcon
                              : ErrorIcon
                          }
                          label={tx.status}
                          size="small"
                          sx={{
                            bgcolor: `${STATUS_COLORS[tx.status]}20`,
                            color: STATUS_COLORS[tx.status],
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Statistics Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Total Transactions
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                    {transactions.length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Completed
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                    {transactions.filter((tx) => tx.status === 'completed').length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                    {transactions.filter((tx) => tx.status === 'pending').length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Total Value
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                    ${balances.reduce((sum, b) => sum + b.value_usd, 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer {selectedToken?.token_name}</DialogTitle>
        <DialogContent>
          {selectedToken && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                helperText={`Available: ${formatNumber(selectedToken.balance, selectedToken.decimals)} ${selectedToken.token_id}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained" disabled={loading}>
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TokenManagement
