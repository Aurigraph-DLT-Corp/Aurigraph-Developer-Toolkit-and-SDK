import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  HowToVote,
  Timeline,
  AccountTree,
  Speed,
  Refresh,
  TrendingUp,
  AssignmentTurnedIn,
  Schedule,
  Verified,
  CallSplit,
  Shield,
  SignalCellularAlt,
  Psychology
} from '@mui/icons-material'
import { apiService, safeApiCall } from '../../services/api'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ConsensusState {
  state: 'LEADER' | 'FOLLOWER' | 'CANDIDATE'
  currentLeaderId: string
  currentTerm: number
  currentEpoch: number
  currentRound: number
  votedFor: string | null
  lastBlockHash: string
  lastBlockHeight: number
  consensusHealth: number
  finalizedBlocks: number
  pendingBlocks: number
}

interface LeaderInfo {
  nodeId: string
  nodeName: string
  term: number
  electedAt: string
  votingPower: number
  stability: number
  contributions: number
  uptime: number
}

interface ValidatorVotingPower {
  nodeId: string
  nodeName: string
  votingPower: number
  stake: number
  performance: number
  reliability: number
}

interface LeadershipChange {
  timestamp: string
  fromLeader: string
  toLeader: string
  term: number
  reason: string
  votesReceived: number
  totalVotes: number
}

interface BlockFinalityMetrics {
  totalBlocks: number
  finalizedBlocks: number
  pendingBlocks: number
  orphanedBlocks: number
  finalityRate: number
  avgConfirmationTimeMs: number
  confidenceScore: number
  currentFinalityProgress: number
}

interface FinalityTrend {
  timestamp: string
  confirmationTimeMs: number
  blocksFinalized: number
}

interface ConsensusMetrics {
  validatorParticipationRate: number
  averageBlockTimeMs: number
  blockDifficulty: number
  consensusLatencyMs: number
  networkSyncStatus: number
  byzantineFaultTolerance: number
  activeValidators: number
  totalValidators: number
  missedBlockCount: number
}

interface LatencyDistribution {
  range: string
  count: number
  percentage: number
}

interface Fork {
  forkId: string
  detectedAt: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'DETECTING' | 'RESOLVING' | 'RESOLVED' | 'UNRESOLVED'
  baseBlockHeight: number
  fork1Height: number
  fork2Height: number
  fork1Leader: string
  fork2Leader: string
  resolutionStrategy: string
  resolutionTime: number | null
  impactedTransactions: number
}

interface ForkResolution {
  timestamp: string
  forkId: string
  strategy: string
  durationMs: number
  blocksRolledBack: number
  consensusReached: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4'
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2
}

const REFRESH_INTERVAL = 5000 // 5 seconds

const FORK_SEVERITY_COLORS = {
  LOW: '#00BFA5',
  MEDIUM: '#FFD93D',
  HIGH: '#FF9800',
  CRITICAL: '#FF6B6B'
}

const FORK_STATUS_COLORS = {
  DETECTING: '#4ECDC4',
  RESOLVING: '#FFD93D',
  RESOLVED: '#00BFA5',
  UNRESOLVED: '#FF6B6B'
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString()
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

const getStateColor = (state: string): string => {
  switch (state) {
    case 'LEADER': return THEME_COLORS.success
    case 'FOLLOWER': return THEME_COLORS.info
    case 'CANDIDATE': return THEME_COLORS.warning
    default: return THEME_COLORS.secondary
  }
}

const getHealthColor = (health: number): string => {
  if (health >= 90) return THEME_COLORS.success
  if (health >= 70) return THEME_COLORS.warning
  return THEME_COLORS.error
}

const calculateTimeRemaining = (nextElectionTime: string): string => {
  const now = new Date().getTime()
  const target = new Date(nextElectionTime).getTime()
  const diff = target - now

  if (diff <= 0) return 'Election in progress'

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useConsensusState = () => {
  const [consensusState, setConsensusState] = useState<ConsensusState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConsensusState = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/status')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      null
    )

    if (result.success && result.data) {
      setConsensusState(result.data)
    } else {
      setError(result.error?.message || 'Failed to fetch consensus state')
    }

    setLoading(false)
  }, [])

  return { consensusState, loading, error, fetchConsensusState }
}

const useLeaderInfo = () => {
  const [leaderInfo, setLeaderInfo] = useState<LeaderInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchLeaderInfo = useCallback(async () => {
    setLoading(true)

    const result = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/leader')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      null
    )

    if (result.success && result.data) {
      setLeaderInfo(result.data)
    }

    setLoading(false)
  }, [])

  return { leaderInfo, loading, fetchLeaderInfo }
}

const useValidatorVotingPower = () => {
  const [validators, setValidators] = useState<ValidatorVotingPower[]>([])
  const [loading, setLoading] = useState(false)

  const fetchValidators = useCallback(async () => {
    setLoading(true)

    const result = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/validators/voting-power')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (result.success && result.data) {
      setValidators(result.data)
    }

    setLoading(false)
  }, [])

  return { validators, loading, fetchValidators }
}

const useLeadershipHistory = () => {
  const [leadershipChanges, setLeadershipChanges] = useState<LeadershipChange[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLeadershipHistory = useCallback(async () => {
    setLoading(true)

    const result = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/leadership/history')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (result.success && result.data) {
      setLeadershipChanges(result.data)
    }

    setLoading(false)
  }, [])

  return { leadershipChanges, loading, fetchLeadershipHistory }
}

const useBlockFinality = () => {
  const [finalityMetrics, setFinalityMetrics] = useState<BlockFinalityMetrics | null>(null)
  const [finalityTrends, setFinalityTrends] = useState<FinalityTrend[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBlockFinality = useCallback(async () => {
    setLoading(true)

    const metricsResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/finality/metrics')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      null
    )

    const trendsResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/finality/trends')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (metricsResult.success && metricsResult.data) {
      setFinalityMetrics(metricsResult.data)
    }

    if (trendsResult.success && trendsResult.data) {
      setFinalityTrends(trendsResult.data)
    }

    setLoading(false)
  }, [])

  return { finalityMetrics, finalityTrends, loading, fetchBlockFinality }
}

const useConsensusMetrics = () => {
  const [metrics, setMetrics] = useState<ConsensusMetrics | null>(null)
  const [latencyDistribution, setLatencyDistribution] = useState<LatencyDistribution[]>([])
  const [loading, setLoading] = useState(false)

  const fetchConsensusMetrics = useCallback(async () => {
    setLoading(true)

    const metricsResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/metrics')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      null
    )

    const latencyResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/latency/distribution')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (metricsResult.success && metricsResult.data) {
      setMetrics(metricsResult.data)
    }

    if (latencyResult.success && latencyResult.data) {
      setLatencyDistribution(latencyResult.data)
    }

    setLoading(false)
  }, [])

  return { metrics, latencyDistribution, loading, fetchConsensusMetrics }
}

const useForkManagement = () => {
  const [activeForks, setActiveForks] = useState<Fork[]>([])
  const [forkHistory, setForkHistory] = useState<ForkResolution[]>([])
  const [loading, setLoading] = useState(false)

  const fetchForkData = useCallback(async () => {
    setLoading(true)

    const forksResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/forks/active')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    const historyResult = await safeApiCall(
      async () => {
        const response = await fetch('/api/v11/consensus/forks/history')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
      []
    )

    if (forksResult.success && forksResult.data) {
      setActiveForks(forksResult.data)
    }

    if (historyResult.success && historyResult.data) {
      setForkHistory(historyResult.data)
    }

    setLoading(false)
  }, [])

  return { activeForks, forkHistory, loading, fetchForkData }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ConsensusOverviewProps {
  consensusState: ConsensusState | null
  leaderInfo: LeaderInfo | null
}

const ConsensusOverview: React.FC<ConsensusOverviewProps> = ({ consensusState, leaderInfo }) => {
  if (!consensusState) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Consensus Overview
          </Typography>
          <Alert severity="info">Loading consensus state...</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountTree sx={{ fontSize: 32, color: THEME_COLORS.primary }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Consensus Overview
            </Typography>
          </Box>
          <Chip
            label={consensusState.state}
            sx={{
              bgcolor: `${getStateColor(consensusState.state)}20`,
              color: getStateColor(consensusState.state),
              fontWeight: 700,
              fontSize: 14
            }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Current Leader
              </Typography>
              <Typography variant="h5" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                {consensusState.currentLeaderId || 'N/A'}
              </Typography>
              {leaderInfo && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Uptime: {leaderInfo.uptime.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Consensus Epoch / Round / Term
              </Typography>
              <Typography variant="h5" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700 }}>
                {consensusState.currentEpoch} / {consensusState.currentRound} / {consensusState.currentTerm}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Consensus Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ color: getHealthColor(consensusState.consensusHealth), fontWeight: 700 }}>
                  {consensusState.consensusHealth.toFixed(1)}%
                </Typography>
                {consensusState.consensusHealth >= 90 ? (
                  <CheckCircle sx={{ color: THEME_COLORS.success }} />
                ) : consensusState.consensusHealth >= 70 ? (
                  <Warning sx={{ color: THEME_COLORS.warning }} />
                ) : (
                  <ErrorIcon sx={{ color: THEME_COLORS.error }} />
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Block Finality Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Finalized: {consensusState.finalizedBlocks}
                </Typography>
                <Typography variant="body2" sx={{ color: THEME_COLORS.warning }}>
                  Pending: {consensusState.pendingBlocks}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(consensusState.finalizedBlocks / (consensusState.finalizedBlocks + consensusState.pendingBlocks)) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: THEME_COLORS.success
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Latest Finalized Block
              </Typography>
              <Typography variant="h5" sx={{ color: THEME_COLORS.info, fontWeight: 700 }}>
                #{consensusState.lastBlockHeight}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                Hash: {consensusState.lastBlockHash.substring(0, 16)}...
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

interface LeaderElectionTrackingProps {
  leaderInfo: LeaderInfo | null
  validators: ValidatorVotingPower[]
  leadershipChanges: LeadershipChange[]
}

const LeaderElectionTracking: React.FC<LeaderElectionTrackingProps> = ({ leaderInfo, validators, leadershipChanges }) => {
  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <HowToVote sx={{ fontSize: 32, color: THEME_COLORS.quaternary }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Leader Election Tracking
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Leader Information */}
          {leaderInfo && (
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: THEME_COLORS.quaternary, mb: 2 }}>
                  Current Leader Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Node ID
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {leaderInfo.nodeId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Elected At
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {formatTimestamp(leaderInfo.electedAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Voting Power
                    </Typography>
                    <Typography variant="body2" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                      {leaderInfo.votingPower.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Stability Score
                    </Typography>
                    <Typography variant="body2" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700 }}>
                      {leaderInfo.stability.toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* Validator Voting Power */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.tertiary, mb: 2 }}>
              Top Validators by Voting Power
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', maxHeight: 240 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Validator</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Power</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Reliability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validators.slice(0, 5).map((validator) => (
                    <TableRow key={validator.nodeId}>
                      <TableCell sx={{ color: '#fff' }}>{validator.nodeName || validator.nodeId.substring(0, 8)}</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.success }} align="right">{validator.votingPower.toFixed(1)}%</TableCell>
                      <TableCell sx={{ color: THEME_COLORS.tertiary }} align="right">{validator.reliability.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Leadership Changes Log */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.info, mb: 2 }}>
              Recent Leadership Changes
            </Typography>
            <List sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, maxHeight: 240, overflow: 'auto' }}>
              {leadershipChanges.slice(0, 5).map((change, idx) => (
                <ListItem key={idx} divider={idx < 4}>
                  <ListItemIcon>
                    <Timeline sx={{ color: THEME_COLORS.info }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {change.fromLeader} → {change.toLeader}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {formatTimestamp(change.timestamp)} • Term {change.term} • {change.reason} • Votes: {change.votesReceived}/{change.totalVotes}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

interface BlockFinalityMonitoringProps {
  finalityMetrics: BlockFinalityMetrics | null
  finalityTrends: FinalityTrend[]
}

const BlockFinalityMonitoring: React.FC<BlockFinalityMonitoringProps> = ({ finalityMetrics, finalityTrends }) => {
  if (!finalityMetrics) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Block Finality Monitoring
          </Typography>
          <Alert severity="info">Loading finality metrics...</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AssignmentTurnedIn sx={{ fontSize: 32, color: THEME_COLORS.success }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Block Finality Monitoring
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Finalization Progress */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.success, mb: 2 }}>
                Finalization Progress
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {finalityMetrics.finalizedBlocks} / {finalityMetrics.totalBlocks} blocks
                </Typography>
                <Typography variant="body2" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                  {finalityMetrics.finalityRate.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={finalityMetrics.currentFinalityProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: THEME_COLORS.success
                  }
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Chip
                  size="small"
                  label={`Pending: ${finalityMetrics.pendingBlocks}`}
                  sx={{ bgcolor: 'rgba(255,217,61,0.2)', color: THEME_COLORS.warning }}
                />
                <Chip
                  size="small"
                  label={`Orphaned: ${finalityMetrics.orphanedBlocks}`}
                  sx={{ bgcolor: 'rgba(255,107,107,0.2)', color: THEME_COLORS.error }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Confirmation Metrics */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: THEME_COLORS.tertiary, mb: 2 }}>
                Confirmation Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Avg Confirmation Time
                  </Typography>
                  <Typography variant="h5" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700 }}>
                    {finalityMetrics.avgConfirmationTimeMs}ms
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Confidence Score
                  </Typography>
                  <Typography variant="h5" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                    {finalityMetrics.confidenceScore.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Confirmation Time Trend */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.info, mb: 2 }}>
              Block Confirmation Time Trend (Last 24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={finalityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                />
                <Line type="monotone" dataKey="confirmationTimeMs" stroke={THEME_COLORS.tertiary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

interface ConsensusMetricsDisplayProps {
  metrics: ConsensusMetrics | null
  latencyDistribution: LatencyDistribution[]
}

const ConsensusMetricsDisplay: React.FC<ConsensusMetricsDisplayProps> = ({ metrics, latencyDistribution }) => {
  if (!metrics) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            Consensus Metrics
          </Typography>
          <Alert severity="info">Loading consensus metrics...</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Speed sx={{ fontSize: 32, color: THEME_COLORS.primary }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Consensus Metrics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Validator Participation
              </Typography>
              <Typography variant="h4" sx={{ color: THEME_COLORS.success, fontWeight: 700, my: 1 }}>
                {metrics.validatorParticipationRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {metrics.activeValidators} / {metrics.totalValidators} active
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Average Block Time
              </Typography>
              <Typography variant="h4" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700, my: 1 }}>
                {metrics.averageBlockTimeMs}ms
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Target: 100-500ms
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,107,107,0.1)', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Byzantine Fault Tolerance
              </Typography>
              <Typography variant="h4" sx={{ color: THEME_COLORS.error, fontWeight: 700, my: 1 }}>
                {metrics.byzantineFaultTolerance.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Margin
              </Typography>
            </Box>
          </Grid>

          {/* Additional Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.quaternary, mb: 2 }}>
              Performance Indicators
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Network Synchronization
                  </Typography>
                  <Typography variant="body2" sx={{ color: THEME_COLORS.success }}>
                    {metrics.networkSyncStatus.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={metrics.networkSyncStatus} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: THEME_COLORS.success } }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                  Consensus Latency: {metrics.consensusLatencyMs}ms
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Block Difficulty: {metrics.blockDifficulty.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Chip
                  label={`Missed Blocks: ${metrics.missedBlockCount}`}
                  size="small"
                  sx={{ bgcolor: metrics.missedBlockCount > 10 ? 'rgba(255,107,107,0.2)' : 'rgba(0,191,165,0.2)', color: metrics.missedBlockCount > 10 ? THEME_COLORS.error : THEME_COLORS.success }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Latency Distribution */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.info, mb: 2 }}>
              Consensus Latency Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={latencyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="percentage" fill={THEME_COLORS.info} />
              </BarChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

interface ForkResolutionDisplayProps {
  activeForks: Fork[]
  forkHistory: ForkResolution[]
}

const ForkResolutionDisplay: React.FC<ForkResolutionDisplayProps> = ({ activeForks, forkHistory }) => {
  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CallSplit sx={{ fontSize: 32, color: THEME_COLORS.error }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Fork Resolution & History
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Active Forks Alert */}
          {activeForks.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                <AlertTitle>Active Fork Detection</AlertTitle>
                {activeForks.length} active fork{activeForks.length > 1 ? 's' : ''} detected. Resolution in progress...
              </Alert>
            </Grid>
          )}

          {/* Active Forks Table */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.warning, mb: 2 }}>
              Active Forks
            </Typography>
            {activeForks.length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                No active forks detected. Blockchain is operating on a single canonical chain.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Fork ID</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Detected</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Severity</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Status</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Base Height</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>Strategy</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }} align="right">Impact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeForks.map((fork) => (
                      <TableRow key={fork.forkId}>
                        <TableCell sx={{ color: '#fff', fontFamily: 'monospace' }}>{fork.forkId.substring(0, 8)}</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{formatTimestamp(fork.detectedAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={fork.severity}
                            size="small"
                            sx={{
                              bgcolor: `${FORK_SEVERITY_COLORS[fork.severity]}20`,
                              color: FORK_SEVERITY_COLORS[fork.severity],
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={fork.status}
                            size="small"
                            sx={{
                              bgcolor: `${FORK_STATUS_COLORS[fork.status]}20`,
                              color: FORK_STATUS_COLORS[fork.status],
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: THEME_COLORS.info }}>#{fork.baseBlockHeight}</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{fork.resolutionStrategy}</TableCell>
                        <TableCell sx={{ color: THEME_COLORS.warning }} align="right">{fork.impactedTransactions} txs</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>

          {/* Fork Resolution History */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: THEME_COLORS.success, mb: 2 }}>
              Recent Fork Resolutions
            </Typography>
            {forkHistory.length === 0 ? (
              <Alert severity="info">No fork resolution history available.</Alert>
            ) : (
              <List sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                {forkHistory.slice(0, 10).map((resolution, idx) => (
                  <ListItem key={idx} divider={idx < forkHistory.length - 1}>
                    <ListItemIcon>
                      {resolution.consensusReached ? (
                        <CheckCircle sx={{ color: THEME_COLORS.success }} />
                      ) : (
                        <ErrorIcon sx={{ color: THEME_COLORS.error }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          Fork {resolution.forkId.substring(0, 8)} resolved via {resolution.strategy}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {formatTimestamp(resolution.timestamp)} • Duration: {formatDuration(resolution.durationMs)} • Rolled back {resolution.blocksRolledBack} blocks
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConsensusStateMonitor() {
  const { consensusState, loading: consensusLoading, error: consensusError, fetchConsensusState } = useConsensusState()
  const { leaderInfo, loading: leaderLoading, fetchLeaderInfo } = useLeaderInfo()
  const { validators, loading: validatorsLoading, fetchValidators } = useValidatorVotingPower()
  const { leadershipChanges, loading: leadershipLoading, fetchLeadershipHistory } = useLeadershipHistory()
  const { finalityMetrics, finalityTrends, loading: finalityLoading, fetchBlockFinality } = useBlockFinality()
  const { metrics, latencyDistribution, loading: metricsLoading, fetchConsensusMetrics } = useConsensusMetrics()
  const { activeForks, forkHistory, loading: forksLoading, fetchForkData } = useForkManagement()

  const fetchAllData = useCallback(() => {
    fetchConsensusState()
    fetchLeaderInfo()
    fetchValidators()
    fetchLeadershipHistory()
    fetchBlockFinality()
    fetchConsensusMetrics()
    fetchForkData()
  }, [fetchConsensusState, fetchLeaderInfo, fetchValidators, fetchLeadershipHistory, fetchBlockFinality, fetchConsensusMetrics, fetchForkData])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAllData])

  const isLoading = consensusLoading || leaderLoading || validatorsLoading || leadershipLoading || finalityLoading || metricsLoading || forksLoading

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Shield sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>
            HyperRAFT++ Consensus State Monitor
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isLoading && <CircularProgress size={24} sx={{ color: THEME_COLORS.primary }} />}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            disabled={isLoading}
            sx={{ borderColor: THEME_COLORS.primary, color: THEME_COLORS.primary }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {consensusError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {consensusError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Consensus Overview */}
        <Grid item xs={12}>
          <ConsensusOverview consensusState={consensusState} leaderInfo={leaderInfo} />
        </Grid>

        {/* Leader Election Tracking */}
        <Grid item xs={12}>
          <LeaderElectionTracking
            leaderInfo={leaderInfo}
            validators={validators}
            leadershipChanges={leadershipChanges}
          />
        </Grid>

        {/* Block Finality Monitoring */}
        <Grid item xs={12}>
          <BlockFinalityMonitoring
            finalityMetrics={finalityMetrics}
            finalityTrends={finalityTrends}
          />
        </Grid>

        {/* Consensus Metrics */}
        <Grid item xs={12}>
          <ConsensusMetricsDisplay
            metrics={metrics}
            latencyDistribution={latencyDistribution}
          />
        </Grid>

        {/* Fork Resolution */}
        <Grid item xs={12}>
          <ForkResolutionDisplay
            activeForks={activeForks}
            forkHistory={forkHistory}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
