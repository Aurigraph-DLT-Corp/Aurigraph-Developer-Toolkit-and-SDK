/**
 * StakingDashboard.tsx
 * Display staking information, validators, and rewards
 * AV11-287, AV11-288, AV11-289, AV11-290: Staking Dashboard
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Tooltip,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  AccountBalance as StakeIcon,
  TrendingUp as RewardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { stakingApi } from '../services/phase2Api'
import type { StakingInfo, StakingValidator, StakingReward } from '../types/phase2'

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 2,
}

// ============================================================================
// TYPES
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

type SortField = 'rank' | 'stake' | 'apy' | 'uptime' | 'delegators'
type SortOrder = 'asc' | 'desc'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatTokenAmount = (amount: string): string => {
  try {
    const num = parseFloat(amount)
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
  } catch {
    return amount
  }
}

const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`
}

const shortenAddress = (address: string, chars: number = 6): string => {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// ============================================================================
// TAB PANEL COMPONENT
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StakingDashboard: React.FC = () => {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [validators, setValidators] = useState<StakingValidator[]>([])
  const [rewards, setRewards] = useState<StakingReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // User address (mock for demo)
  const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchStakingData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [info, validatorsData] = await Promise.all([
        stakingApi.getStakingInfo(),
        stakingApi.getValidators(undefined, sortField, sortOrder),
      ])

      setStakingInfo(info)
      setValidators(validatorsData)

      // Fetch user rewards if user info exists
      if (info.userStaking) {
        try {
          const rewardsData = await stakingApi.getStakingRewards(userAddress, 1, 10)
          setRewards(rewardsData.items)
        } catch (err) {
          console.warn('Failed to fetch rewards:', err)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staking data'
      setError(errorMessage)
      console.error('Failed to fetch staking data:', err)
    } finally {
      setLoading(false)
    }
  }, [sortField, sortOrder, userAddress])

  useEffect(() => {
    fetchStakingData()
  }, [fetchStakingData])

  // ============================================================================
  // SORTING
  // ============================================================================

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderOverview = () => {
    if (!stakingInfo) return null

    return (
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196F3' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Staked
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatTokenAmount(stakingInfo.totalStaked)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stakingInfo.totalStakers.toLocaleString()} stakers
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Average APY
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatPercent(stakingInfo.averageAPY)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reward rate: {formatPercent(stakingInfo.rewardRate)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #FF9800' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Min Stake
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatTokenAmount(stakingInfo.minStakeAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unbonding: {stakingInfo.unbondingPeriod} days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(156, 39, 176, 0.1)', border: '1px solid #9C27B0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Active Validators
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {validators.filter((v) => v.status === 'active').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              of {validators.length} total
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    )
  }

  const renderUserStaking = () => {
    if (!stakingInfo?.userStaking) {
      return (
        <Alert severity="info">
          No active stakes. Connect wallet to view your staking positions.
        </Alert>
      )
    }

    const { userStaking } = stakingInfo

    return (
      <Box>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                Your Total Staked
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatTokenAmount(userStaking.totalStaked)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                Total Rewards
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatTokenAmount(userStaking.totalRewards)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, background: 'rgba(255, 152, 0, 0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                Claimable Rewards
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatTokenAmount(userStaking.claimableRewards)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {userStaking.activeStakes.length > 0 && (
          <TableContainer component={Paper} sx={{ background: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Validator</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>APY</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rewards</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Staked Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userStaking.activeStakes.map((stake, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{stake.validatorName || shortenAddress(stake.validator)}</TableCell>
                    <TableCell>{formatTokenAmount(stake.amount)}</TableCell>
                    <TableCell>{formatPercent(stake.apy)}</TableCell>
                    <TableCell>{formatTokenAmount(stake.rewards)}</TableCell>
                    <TableCell>{new Date(stake.stakedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    )
  }

  const renderValidatorsTable = () => (
    <TableContainer component={Paper} sx={{ background: 'transparent' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>
              <TableSortLabel
                active={sortField === 'rank'}
                direction={sortField === 'rank' ? sortOrder : 'asc'}
                onClick={() => handleSort('rank')}
              >
                Rank
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Validator</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <TableSortLabel
                active={sortField === 'stake'}
                direction={sortField === 'stake' ? sortOrder : 'asc'}
                onClick={() => handleSort('stake')}
              >
                Stake
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <TableSortLabel
                active={sortField === 'apy'}
                direction={sortField === 'apy' ? sortOrder : 'asc'}
                onClick={() => handleSort('apy')}
              >
                APY
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Commission</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <TableSortLabel
                active={sortField === 'uptime'}
                direction={sortField === 'uptime' ? sortOrder : 'asc'}
                onClick={() => handleSort('uptime')}
              >
                Uptime
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <TableSortLabel
                active={sortField === 'delegators'}
                direction={sortField === 'delegators' ? sortOrder : 'asc'}
                onClick={() => handleSort('delegators')}
              >
                Delegators
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {validators.map((validator) => (
            <TableRow key={validator.address} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  #{validator.rank}
                  {validator.rank <= 3 && <StarIcon sx={{ color: '#FFD700', fontSize: 18 }} />}
                </Box>
              </TableCell>
              <TableCell>
                <Tooltip title={validator.address}>
                  <Typography variant="body2" fontWeight={500}>
                    {validator.name}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  label={validator.status}
                  color={validator.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatTokenAmount(validator.stake)}</TableCell>
              <TableCell>
                <Typography color="success.main" fontWeight={600}>
                  {formatPercent(validator.apy)}
                </Typography>
              </TableCell>
              <TableCell>{formatPercent(validator.commission)}</TableCell>
              <TableCell>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={validator.uptime}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mb: 0.5,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: validator.uptime >= 99 ? '#4CAF50' : '#FF9800',
                      },
                    }}
                  />
                  <Typography variant="caption">{formatPercent(validator.uptime)}</Typography>
                </Box>
              </TableCell>
              <TableCell>{validator.delegators.toLocaleString()}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  disabled
                  startIcon={<StakeIcon />}
                >
                  Delegate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderRewards = () => {
    if (rewards.length === 0) {
      return <Alert severity="info">No reward history available</Alert>
    }

    return (
      <TableContainer component={Paper} sx={{ background: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Validator</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rewards.map((reward, idx) => (
              <TableRow key={idx}>
                <TableCell>{new Date(reward.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>{reward.validatorName || shortenAddress(reward.validator)}</TableCell>
                <TableCell>{formatTokenAmount(reward.amount)}</TableCell>
                <TableCell>
                  <Chip label={reward.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={reward.claimed ? 'Claimed' : 'Pending'}
                    color={reward.claimed ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
          <Button variant="outlined" onClick={fetchStakingData} startIcon={<RefreshIcon />}>
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600} display="flex" alignItems="center" gap={1}>
              <SecurityIcon /> Staking Dashboard
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchStakingData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {renderOverview()}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Validators" />
            <Tab label="My Stakes" />
            <Tab label="Reward History" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {renderValidatorsTable()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderUserStaking()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderRewards()}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  )
}

export default StakingDashboard
