import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Alert,
  LinearProgress,
  Badge,
  Divider,
  Menu,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  FilterList,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  Lock,
  Speed,
  AccountBalance,
  EmojiEvents,
  Timeline,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { apiService } from '../../services/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Validator {
  address: string;
  name: string;
  stake: number;
  uptime: number;
  tps: number;
  rewards: number;
  status: 'active' | 'inactive' | 'jailed';
  commission: number;
  votingPower: number;
  blocksProposed: number;
  consensusParticipation: number;
  performanceScore: number;
  lastActiveTime: number;
}

interface ValidatorDetails {
  validator: Validator;
  uptimeHistory: { time: string; uptime: number }[];
  blockProposalHistory: { time: string; blocks: number }[];
  rewardHistory: { time: string; amount: number }[];
  stakeGrowth: { time: string; stake: number }[];
  performanceTrend: { time: string; score: number }[];
}

interface NetworkHealth {
  activeValidatorCount: number;
  totalValidators: number;
  networkSecurityStatus: string;
  decentralizationIndex: number;
  averageUptime: number;
  totalStaked: number;
  validatorDistribution: { region: string; count: number }[];
}

interface RewardTracking {
  totalEarned: number;
  pendingRewards: number;
  commissionEarned: number;
  nextPayoutDate: string;
  projectedNextPeriod: number;
  comparedToNetwork: number;
}

interface PerformanceMetrics {
  proposedBlocksDaily: { date: string; count: number }[];
  consensusParticipationRate: number;
  avgBlockValidationTime: number;
  votingPowerPercent: number;
  performanceScore: number;
  networkAverage: number;
}

type SortField = 'name' | 'stake' | 'uptime' | 'tps' | 'rewards' | 'performanceScore';
type SortOrder = 'asc' | 'desc';
type ValidatorStatus = 'all' | 'active' | 'inactive' | 'jailed';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  active: '#4CAF50',
  inactive: '#9E9E9E',
  jailed: '#F44336',
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
};

const CHART_COLORS = ['#00BFA5', '#4ECDC4', '#FFD93D', '#FF6B6B', '#9575CD'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ValidatorPerformanceMonitor: React.FC = () => {
  // State management
  const [validators, setValidators] = useState<Validator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [validatorDetails, setValidatorDetails] = useState<ValidatorDetails | null>(null);
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ValidatorStatus>('all');
  const [sortField, setSortField] = useState<SortField>('stake');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // UI state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedValidatorAddress, setSelectedValidatorAddress] = useState<string>('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchValidators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getValidators();
      setValidators(response.validators || []);
    } catch (err) {
      setError('Failed to fetch validators');
      console.error('Error fetching validators:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchValidatorDetails = useCallback(async (address: string) => {
    try {
      const response = await apiService.getValidatorDetails(address);
      setValidatorDetails(response);
    } catch (err) {
      console.error('Error fetching validator details:', err);
    }
  }, []);

  const fetchNetworkHealth = useCallback(async () => {
    try {
      const response = await apiService.getNetworkHealth();
      setNetworkHealth(response);
    } catch (err) {
      console.error('Error fetching network health:', err);
    }
  }, []);

  const fetchStakingInfo = useCallback(async () => {
    try {
      const response = await apiService.getStakingInfo();
      return response;
    } catch (err) {
      console.error('Error fetching staking info:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchValidators();
    fetchNetworkHealth();

    const interval = setInterval(() => {
      fetchValidators();
      fetchNetworkHealth();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchValidators, fetchNetworkHealth]);

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  const filteredAndSortedValidators = useMemo(() => {
    let filtered = validators;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [validators, searchTerm, statusFilter, sortField, sortOrder]);

  // Pagination
  const paginatedValidators = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedValidators.slice(start, start + rowsPerPage);
  }, [filteredAndSortedValidators, page, rowsPerPage]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (validator: Validator) => {
    setSelectedValidator(validator);
    fetchValidatorDetails(validator.address);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedValidator(null);
    setValidatorDetails(null);
  };

  const handleClaimRewards = (validatorAddress: string) => {
    console.log('Claiming rewards for validator:', validatorAddress);
    // Implementation would call API to claim rewards
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, address: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedValidatorAddress(address);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedValidatorAddress('');
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusColor = (status: string) => {
    return COLORS[status as keyof typeof COLORS] || COLORS.inactive;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle sx={{ color: COLORS.active }} />;
      case 'inactive':
        return <Cancel sx={{ color: COLORS.inactive }} />;
      case 'jailed':
        return <Lock sx={{ color: COLORS.jailed }} />;
      default:
        return <Cancel sx={{ color: COLORS.inactive }} />;
    }
  };

  const formatStake = (stake: number) => {
    return `${(stake / 1000000).toFixed(2)}M`;
  };

  const formatRewards = (rewards: number) => {
    return `${rewards.toLocaleString()} AUR`;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatTPS = (tps: number) => {
    return tps >= 1000 ? `${(tps / 1000).toFixed(1)}K` : tps.toString();
  };

  // ============================================================================
  // RENDER: VALIDATOR LIST SECTION
  // ============================================================================

  const renderValidatorList = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Validator Network
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchValidators}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Search and Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ValidatorStatus)}
                label="Status Filter"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
                <MenuItem value="jailed">Jailed Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ height: '56px' }}
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <LinearProgress />
        ) : (
          <>
            {/* Validators Table */}
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => handleSort('name')}
                      >
                        Validator
                        {sortField === 'name' && (
                          sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onClick={() => handleSort('stake')}
                      >
                        Stake
                        {sortField === 'stake' && (
                          sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onClick={() => handleSort('uptime')}
                      >
                        Uptime
                        {sortField === 'uptime' && (
                          sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onClick={() => handleSort('tps')}
                      >
                        TPS
                        {sortField === 'tps' && (
                          sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onClick={() => handleSort('rewards')}
                      >
                        Rewards
                        {sortField === 'rewards' && (
                          sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedValidators.map((validator) => (
                    <TableRow key={validator.address} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: COLORS.primary }}>
                            {validator.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {validator.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {validator.address.substring(0, 12)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(validator.status)}
                          label={validator.status.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(validator.status)}20`,
                            color: getStatusColor(validator.status),
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatStake(validator.stake)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {formatUptime(validator.uptime)}
                          {validator.uptime >= 99 && (
                            <TrendingUp sx={{ ml: 0.5, color: COLORS.active, fontSize: 16 }} />
                          )}
                          {validator.uptime < 95 && (
                            <TrendingDown sx={{ ml: 0.5, color: COLORS.jailed, fontSize: 16 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatTPS(validator.tps)}</TableCell>
                      <TableCell align="right">{formatRewards(validator.rewards)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(validator)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, validator.address)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredAndSortedValidators.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );

  // ============================================================================
  // RENDER: NETWORK HEALTH INTEGRATION
  // ============================================================================

  const renderNetworkHealth = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Network Health Overview
        </Typography>

        <Grid container spacing={3}>
          {/* Active Validators */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: COLORS.active, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Active Validators
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {networkHealth?.activeValidatorCount || 0} / {networkHealth?.totalValidators || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    ((networkHealth?.activeValidatorCount || 0) /
                      (networkHealth?.totalValidators || 1)) *
                    100
                  }
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Network Security */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Lock sx={{ color: COLORS.primary, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Security Status
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {networkHealth?.networkSecurityStatus || 'SECURE'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Decentralization: {networkHealth?.decentralizationIndex?.toFixed(2) || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Average Uptime */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Timeline sx={{ color: COLORS.tertiary, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Average Uptime
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatUptime(networkHealth?.averageUptime || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={networkHealth?.averageUptime || 0}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Total Staked */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ color: COLORS.quaternary, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Staked
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatStake(networkHealth?.totalStaked || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AUR Tokens
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Validator Distribution Map */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Validator Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={networkHealth?.validatorDistribution || []}
                      dataKey="count"
                      nameKey="region"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(networkHealth?.validatorDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // RENDER: VALIDATOR DETAILS DIALOG
  // ============================================================================

  const renderValidatorDetailsDialog = () => (
    <Dialog
      open={detailsDialogOpen}
      onClose={handleCloseDetails}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {selectedValidator?.name} - Performance Details
          </Typography>
          <Chip
            icon={getStatusIcon(selectedValidator?.status || 'inactive')}
            label={selectedValidator?.status.toUpperCase()}
            sx={{
              bgcolor: `${getStatusColor(selectedValidator?.status || 'inactive')}20`,
              color: getStatusColor(selectedValidator?.status || 'inactive'),
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {validatorDetails ? (
          <Grid container spacing={3}>
            {/* Validator Info Card */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Validator Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedValidator?.address}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Stake
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatStake(selectedValidator?.stake || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Commission Rate
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedValidator?.commission}%
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Voting Power
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedValidator?.votingPower.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Performance Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {selectedValidator?.performanceScore}/100
                      </Typography>
                      <EmojiEvents sx={{ ml: 1, color: COLORS.quaternary }} />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedValidator?.performanceScore || 0}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Uptime Trend */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    30-Day Uptime Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={validatorDetails.uptimeHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[90, 100]} />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="uptime"
                        stroke={COLORS.primary}
                        fill={`${COLORS.primary}40`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Block Proposal History */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Block Proposal History
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={validatorDetails.blockProposalHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="blocks" fill={COLORS.tertiary} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Blocks Proposed
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedValidator?.blocksProposed.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Reward History */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reward History
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={validatorDetails.rewardHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke={COLORS.quaternary}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Earned
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatRewards(selectedValidator?.rewards || 0)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<EmojiEvents />}
                      onClick={() => handleClaimRewards(selectedValidator?.address || '')}
                    >
                      Claim Rewards
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Stake Growth */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stake Growth
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={validatorDetails.stakeGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="stake"
                        stroke={COLORS.primary}
                        fill={`${COLORS.primary}20`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Consensus Participation
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedValidator?.consensusParticipation.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedValidator?.consensusParticipation || 0}
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Block Validation Time
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      2.5ms
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Voting Power
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedValidator?.votingPower.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      vs Network Average
                    </Typography>
                    <Chip
                      label="+15%"
                      size="small"
                      color="success"
                      icon={<TrendingUp />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDetails}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============================================================================
  // RENDER: CONTEXT MENU
  // ============================================================================

  const renderContextMenu = () => (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
      <MenuItem
        onClick={() => {
          const validator = validators.find((v) => v.address === selectedValidatorAddress);
          if (validator) handleViewDetails(validator);
          handleMenuClose();
        }}
      >
        <Visibility sx={{ mr: 1 }} /> View Details
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleClaimRewards(selectedValidatorAddress);
          handleMenuClose();
        }}
      >
        <EmojiEvents sx={{ mr: 1 }} /> Claim Rewards
      </MenuItem>
    </Menu>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Validator Performance Monitor
      </Typography>

      {renderNetworkHealth()}
      {renderValidatorList()}
      {renderValidatorDetailsDialog()}
      {renderContextMenu()}
    </Box>
  );
};

export default ValidatorPerformanceMonitor;
