/**
 * ProposalVotingUI.tsx
 * Display governance proposals with vote visualization
 * AV11-285, AV11-286: Proposal Voting Interface
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  HowToVote as VoteIcon,
  CheckCircle as PassedIcon,
  Cancel as RejectedIcon,
  Schedule as ActiveIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { governanceApi } from '../services/phase2Api'
import type { GovernanceProposal, VotingStats } from '../types/phase2'

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 2,
}

const STATUS_CONFIG = {
  active: { color: 'primary' as const, icon: ActiveIcon, label: 'Active' },
  passed: { color: 'success' as const, icon: PassedIcon, label: 'Passed' },
  rejected: { color: 'error' as const, icon: RejectedIcon, label: 'Rejected' },
  expired: { color: 'default' as const, icon: InfoIcon, label: 'Expired' },
  executed: { color: 'success' as const, icon: CheckCircle, label: 'Executed' },
}

const VOTE_COLORS = {
  yes: '#4CAF50',
  no: '#F44336',
  abstain: '#9E9E9E',
  noWithVeto: '#FF9800',
}

// ============================================================================
// TYPES
// ============================================================================

interface VoteData {
  name: string
  value: number
  color: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateTimeRemaining = (endTime: string): string => {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diff = end - now

  if (diff <= 0) return 'Voting ended'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

const calculateQuorumProgress = (currentVotes: number, totalVotingPower: number, quorum: number): number => {
  const turnout = (currentVotes / totalVotingPower) * 100
  return (turnout / quorum) * 100
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProposalVotingUI: React.FC = () => {
  const [proposals, setProposals] = useState<GovernanceProposal[]>([])
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [proposalsData, stats] = await Promise.all([
        governanceApi.getProposals(filterStatus || undefined, 1, 20),
        governanceApi.getVotingStats(),
      ])

      setProposals(proposalsData.items)
      setVotingStats(stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals'
      setError(errorMessage)
      console.error('Failed to fetch proposals:', err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // ============================================================================
  // DIALOG
  // ============================================================================

  const openProposalDetails = (proposal: GovernanceProposal) => {
    setSelectedProposal(proposal)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedProposal(null)
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active
    const StatusIcon = config.icon

    return (
      <Chip icon={<StatusIcon />} label={config.label} color={config.color} size="small" />
    )
  }

  const renderVotePieChart = (proposal: GovernanceProposal) => {
    const data: VoteData[] = [
      { name: 'Yes', value: proposal.currentResults.yes, color: VOTE_COLORS.yes },
      { name: 'No', value: proposal.currentResults.no, color: VOTE_COLORS.no },
      { name: 'Abstain', value: proposal.currentResults.abstain, color: VOTE_COLORS.abstain },
      { name: 'No with Veto', value: proposal.currentResults.noWithVeto, color: VOTE_COLORS.noWithVeto },
    ].filter((item) => item.value > 0)

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderVoteProgress = (proposal: GovernanceProposal) => {
    const total = Object.values(proposal.currentResults).reduce((a, b) => a + b, 0)
    const yesPercent = total > 0 ? (proposal.currentResults.yes / total) * 100 : 0

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">Yes: {yesPercent.toFixed(1)}%</Typography>
          <Typography variant="body2">
            {proposal.currentResults.yes.toLocaleString()} /{' '}
            {total.toLocaleString()} votes
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={yesPercent}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: VOTE_COLORS.yes,
            },
          }}
        />
      </Box>
    )
  }

  const renderQuorumProgress = (proposal: GovernanceProposal) => {
    const totalVotes = Object.values(proposal.currentResults).reduce((a, b) => a + b, 0)
    const quorumProgress = calculateQuorumProgress(
      totalVotes,
      proposal.totalVotingPower,
      proposal.quorum
    )

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">Quorum Progress</Typography>
          <Typography variant="body2">{quorumProgress.toFixed(1)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(quorumProgress, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: quorumProgress >= 100 ? VOTE_COLORS.yes : VOTE_COLORS.abstain,
            },
          }}
        />
      </Box>
    )
  }

  const renderProposalCard = (proposal: GovernanceProposal) => (
    <Card key={proposal.id} sx={CARD_STYLE}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6" fontWeight={600}>
                {proposal.title}
              </Typography>
              {renderStatusBadge(proposal.status)}
              <Chip label={proposal.type} size="small" variant="outlined" />
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2} noWrap>
              {proposal.description}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {renderVoteProgress(proposal)}
              </Grid>
              <Grid item xs={12} sm={6}>
                {renderQuorumProgress(proposal)}
              </Grid>
            </Grid>

            <Box mt={2} display="flex" gap={2} alignItems="center">
              <Tooltip title="Voting deadline">
                <Chip
                  icon={<Schedule />}
                  label={calculateTimeRemaining(proposal.votingEndTime)}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                Proposer: {proposal.proposerName || proposal.proposer.slice(0, 10)}...
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            {renderVotePieChart(proposal)}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => openProposalDetails(proposal)}
              sx={{ mt: 2 }}
            >
              View Details
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderStatsOverview = () => {
    if (!votingStats) return null

    return (
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(33, 150, 243, 0.1)' }}>
            <Typography variant="body2" color="text.secondary">
              Total Proposals
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {votingStats.totalProposals}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {votingStats.activeProposals}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="body2" color="text.secondary">
              Passed
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {votingStats.passedProposals}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, background: 'rgba(255, 152, 0, 0.1)' }}>
            <Typography variant="body2" color="text.secondary">
              Avg Turnout
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {votingStats.averageTurnout.toFixed(1)}%
            </Typography>
          </Paper>
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
          <Button variant="outlined" onClick={fetchProposals} startIcon={<RefreshIcon />}>
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
              <VoteIcon /> Governance Proposals
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchProposals}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {renderStatsOverview()}
        </CardContent>
      </Card>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Alert severity="info">No proposals found</Alert>
      ) : (
        proposals.map((proposal) => renderProposalCard(proposal))
      )}

      {/* Proposal Details Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        {selectedProposal && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedProposal.title}
                </Typography>
                {renderStatusBadge(selectedProposal.status)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedProposal.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell>{selectedProposal.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Proposer</TableCell>
                      <TableCell>{selectedProposal.proposerName || selectedProposal.proposer}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Voting Period</TableCell>
                      <TableCell>
                        {new Date(selectedProposal.votingStartTime).toLocaleDateString()} -{' '}
                        {new Date(selectedProposal.votingEndTime).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Quorum</TableCell>
                      <TableCell>{selectedProposal.quorum}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Pass Threshold</TableCell>
                      <TableCell>{selectedProposal.threshold}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Vote Distribution
                </Typography>
                {renderVotePieChart(selectedProposal)}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
              <Button variant="contained" disabled startIcon={<VoteIcon />}>
                Vote (View Mode)
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default ProposalVotingUI
