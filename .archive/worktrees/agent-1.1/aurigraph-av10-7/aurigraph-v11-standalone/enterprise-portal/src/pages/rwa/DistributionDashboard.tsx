import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Stack,
  Tabs,
  Tab,
  Badge,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Visibility,
  Download,
  Send,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Info,
  Assessment,
  Schedule,
  MonetizationOn,
  PieChart,
  History,
  Refresh,
  AttachMoney,
  People,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DistributionPool {
  id: string;
  name: string;
  totalValue: number;
  totalShares: number;
  sharePrice: number;
  holders: number;
  distributionSchedule: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    nextDistribution: string;
    lastDistribution: string;
    autoDistribute: boolean;
  };
}

interface Distribution {
  id: string;
  poolId: string;
  poolName: string;
  totalAmount: number;
  perShareAmount: number;
  recipients: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  scheduledDate: string;
  executedDate?: string;
  transactionHash?: string;
  failureReason?: string;
  distributionModel: 'PRO_RATA' | 'TIERED' | 'CUSTOM';
}

interface PaymentRecord {
  id: string;
  distributionId: string;
  holderAddress: string;
  holderShares: number;
  amount: number;
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';
  transactionHash?: string;
  timestamp: string;
}

interface HolderStatistics {
  address: string;
  shares: number;
  sharePercentage: number;
  totalReceived: number;
  lastDistributionAmount: number;
  lastDistributionDate: string;
  distributionCount: number;
}

interface DistributionModel {
  type: 'PRO_RATA' | 'TIERED' | 'CUSTOM';
  description: string;
  tiers?: {
    minShares: number;
    maxShares: number;
    multiplier: number;
  }[];
}

interface DistributionStats {
  totalDistributions: number;
  completedDistributions: number;
  totalDistributed: number;
  averageDistribution: number;
  pendingDistributions: number;
  failedDistributions: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DISTRIBUTION_MODELS: DistributionModel[] = [
  {
    type: 'PRO_RATA',
    description: 'Equal distribution based on share ownership percentage',
  },
  {
    type: 'TIERED',
    description: 'Tiered distribution with multipliers for different share levels',
    tiers: [
      { minShares: 0, maxShares: 100, multiplier: 1.0 },
      { minShares: 101, maxShares: 500, multiplier: 1.2 },
      { minShares: 501, maxShares: 1000, multiplier: 1.5 },
      { minShares: 1001, maxShares: 999999, multiplier: 2.0 },
    ],
  },
  {
    type: 'CUSTOM',
    description: 'Custom distribution rules defined by pool administrator',
  },
];

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DistributionDashboard: React.FC = () => {
  // State Management
  const [pools, setPools] = useState<DistributionPool[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [holderStats, setHolderStats] = useState<HolderStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<DistributionPool | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<'PRO_RATA' | 'TIERED' | 'CUSTOM'>('PRO_RATA');

  // Form State
  const [executionForm, setExecutionForm] = useState({
    distributionAmount: 0,
    distributionModel: 'PRO_RATA' as 'PRO_RATA' | 'TIERED' | 'CUSTOM',
    executeNow: true,
    scheduledDate: '',
  });

  // ============================================================================
  // LIFECYCLE & DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch distribution pools (placeholder endpoint)
      // In production: await apiService.getDistributionPools();
      setPools(generateMockPools());

      // Fetch distributions
      setDistributions(generateMockDistributions());

      // Fetch payment history
      setPaymentHistory(generateMockPaymentHistory());

      // Fetch holder statistics
      setHolderStats(generateMockHolderStats());

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch distribution data:', err);
      setError('Unable to load distribution data. Using fallback.');
      setPools(generateMockPools());
      setDistributions(generateMockDistributions());
      setPaymentHistory(generateMockPaymentHistory());
      setHolderStats(generateMockHolderStats());
      setLoading(false);
    }
  };

  // ============================================================================
  // MOCK DATA GENERATORS
  // ============================================================================

  const generateMockPools = (): DistributionPool[] => {
    return [
      {
        id: 'pool-001',
        name: 'Global Real Estate Fund',
        totalValue: 15000000,
        totalShares: 15000,
        sharePrice: 1000,
        holders: 247,
        distributionSchedule: {
          frequency: 'QUARTERLY',
          nextDistribution: '2026-01-01T00:00:00Z',
          lastDistribution: '2025-10-01T00:00:00Z',
          autoDistribute: true,
        },
      },
      {
        id: 'pool-002',
        name: 'Tech Sector Growth Fund',
        totalValue: 8500000,
        totalShares: 8500,
        sharePrice: 1000,
        holders: 158,
        distributionSchedule: {
          frequency: 'MONTHLY',
          nextDistribution: '2025-11-15T00:00:00Z',
          lastDistribution: '2025-10-15T00:00:00Z',
          autoDistribute: true,
        },
      },
      {
        id: 'pool-003',
        name: 'Conservative Bond Portfolio',
        totalValue: 5200000,
        totalShares: 5200,
        sharePrice: 1000,
        holders: 412,
        distributionSchedule: {
          frequency: 'MONTHLY',
          nextDistribution: '2025-11-01T00:00:00Z',
          lastDistribution: '2025-10-01T00:00:00Z',
          autoDistribute: true,
        },
      },
    ];
  };

  const generateMockDistributions = (): Distribution[] => {
    return [
      {
        id: 'dist-001',
        poolId: 'pool-001',
        poolName: 'Global Real Estate Fund',
        totalAmount: 125000,
        perShareAmount: 8.33,
        recipients: 247,
        status: 'COMPLETED',
        scheduledDate: '2025-10-01T00:00:00Z',
        executedDate: '2025-10-01T02:00:00Z',
        transactionHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
        distributionModel: 'PRO_RATA',
      },
      {
        id: 'dist-002',
        poolId: 'pool-002',
        poolName: 'Tech Sector Growth Fund',
        totalAmount: 68000,
        perShareAmount: 8.00,
        recipients: 158,
        status: 'COMPLETED',
        scheduledDate: '2025-10-15T00:00:00Z',
        executedDate: '2025-10-15T01:30:00Z',
        transactionHash: '0x3b8cafe1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
        distributionModel: 'PRO_RATA',
      },
      {
        id: 'dist-003',
        poolId: 'pool-003',
        poolName: 'Conservative Bond Portfolio',
        totalAmount: 31200,
        perShareAmount: 6.00,
        recipients: 412,
        status: 'COMPLETED',
        scheduledDate: '2025-10-01T00:00:00Z',
        executedDate: '2025-10-01T00:30:00Z',
        transactionHash: '0x5c9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
        distributionModel: 'TIERED',
      },
      {
        id: 'dist-004',
        poolId: 'pool-001',
        poolName: 'Global Real Estate Fund',
        totalAmount: 135000,
        perShareAmount: 9.00,
        recipients: 247,
        status: 'PENDING',
        scheduledDate: '2026-01-01T00:00:00Z',
        distributionModel: 'PRO_RATA',
      },
      {
        id: 'dist-005',
        poolId: 'pool-002',
        poolName: 'Tech Sector Growth Fund',
        totalAmount: 72000,
        perShareAmount: 8.47,
        recipients: 158,
        status: 'PENDING',
        scheduledDate: '2025-11-15T00:00:00Z',
        distributionModel: 'PRO_RATA',
      },
    ];
  };

  const generateMockPaymentHistory = (): PaymentRecord[] => {
    const records: PaymentRecord[] = [];
    const distributions = generateMockDistributions().filter(d => d.status === 'COMPLETED');

    distributions.forEach(dist => {
      for (let i = 0; i < Math.min(10, dist.recipients); i++) {
        records.push({
          id: `payment-${dist.id}-${i}`,
          distributionId: dist.id,
          holderAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
          holderShares: Math.floor(Math.random() * 100) + 10,
          amount: Math.floor(Math.random() * 1000) + 100,
          status: 'CONFIRMED',
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          timestamp: dist.executedDate || new Date().toISOString(),
        });
      }
    });

    return records;
  };

  const generateMockHolderStats = (): HolderStatistics[] => {
    const stats: HolderStatistics[] = [];
    const totalShares = 1000;

    for (let i = 0; i < 20; i++) {
      const shares = Math.floor(Math.random() * 200) + 10;
      stats.push({
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        shares,
        sharePercentage: (shares / totalShares) * 100,
        totalReceived: Math.floor(Math.random() * 50000) + 1000,
        lastDistributionAmount: Math.floor(Math.random() * 1000) + 100,
        lastDistributionDate: '2025-10-01T00:00:00Z',
        distributionCount: Math.floor(Math.random() * 12) + 1,
      });
    }

    return stats.sort((a, b) => b.shares - a.shares);
  };

  // ============================================================================
  // DISTRIBUTION ACTIONS
  // ============================================================================

  const handleExecuteDistribution = async () => {
    if (!selectedPool) return;

    try {
      // Validate form
      if (executionForm.distributionAmount <= 0) {
        setError('Distribution amount must be greater than 0');
        return;
      }

      // Execute distribution via API (placeholder)
      // In production: await apiService.executeDistribution({
      //   poolId: selectedPool.id,
      //   amount: executionForm.distributionAmount,
      //   model: executionForm.distributionModel,
      //   executeNow: executionForm.executeNow,
      //   scheduledDate: executionForm.scheduledDate,
      // });

      console.log('Executing distribution:', selectedPool.id, executionForm);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh data
      await fetchData();

      // Reset form and close dialog
      setExecutionForm({
        distributionAmount: 0,
        distributionModel: 'PRO_RATA',
        executeNow: true,
        scheduledDate: '',
      });
      setExecuteDialogOpen(false);
      setSelectedPool(null);
    } catch (err) {
      console.error('Failed to execute distribution:', err);
      setError('Failed to execute distribution. Please try again.');
    }
  };

  const handleViewDistributionDetails = (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    setDetailsDialogOpen(true);
  };

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const stats: DistributionStats = {
    totalDistributions: distributions.length,
    completedDistributions: distributions.filter(d => d.status === 'COMPLETED').length,
    totalDistributed: distributions.filter(d => d.status === 'COMPLETED').reduce((sum, d) => sum + d.totalAmount, 0),
    averageDistribution: distributions.length > 0
      ? distributions.filter(d => d.status === 'COMPLETED').reduce((sum, d) => sum + d.totalAmount, 0) / distributions.filter(d => d.status === 'COMPLETED').length
      : 0,
    pendingDistributions: distributions.filter(d => d.status === 'PENDING').length,
    failedDistributions: distributions.filter(d => d.status === 'FAILED').length,
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredDistributions = distributions.filter(dist => {
    if (filterStatus === 'all') return true;
    return dist.status === filterStatus;
  });

  // ============================================================================
  // RENDER: MAIN COMPONENT
  // ============================================================================

  if (loading && distributions.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>Distribution Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Distribution Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">
            Phase 1 Implementation - Real-time Distribution Tracking
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Distributions</Typography>
              <Typography variant="h4">{stats.totalDistributions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
              <Typography variant="h4" color="success.main">{stats.completedDistributions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Distributed</Typography>
              <Typography variant="h4">${(stats.totalDistributed / 1000000).toFixed(2)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Avg Distribution</Typography>
              <Typography variant="h4">${(stats.averageDistribution / 1000).toFixed(1)}K</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
              <Typography variant="h4" color="warning.main">{stats.pendingDistributions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Failed</Typography>
              <Typography variant="h4" color="error.main">{stats.failedDistributions}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="Active Pools" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Distribution History" icon={<History />} iconPosition="start" />
          <Tab label="Payment Ledger" icon={<MonetizationOn />} iconPosition="start" />
          <Tab label="Holder Statistics" icon={<People />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content: Active Pools */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {pools.map((pool) => {
            const daysUntilNext = Math.ceil(
              (new Date(pool.distributionSchedule.nextDistribution).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Grid item xs={12} md={6} lg={4} key={pool.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{pool.name}</Typography>
                      <Chip
                        icon={<Schedule />}
                        label={pool.distributionSchedule.frequency}
                        size="small"
                        color="primary"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Total Value</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${(pool.totalValue / 1000000).toFixed(2)}M
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Total Shares</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {pool.totalShares.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Share Price</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${pool.sharePrice.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Holders</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {pool.holders.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Next Distribution
                      </Typography>
                      <Typography variant="body2">
                        {new Date(pool.distributionSchedule.nextDistribution).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {daysUntilNext > 0 ? `In ${daysUntilNext} days` : 'Today'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last Distribution
                      </Typography>
                      <Typography variant="body2">
                        {new Date(pool.distributionSchedule.lastDistribution).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => {
                        setSelectedPool(pool);
                        setExecuteDialogOpen(true);
                      }}
                    >
                      Execute Distribution
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Tab Content: Distribution History */}
      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Distribution History</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pool</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Per Share</TableCell>
                    <TableCell align="right">Recipients</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDistributions.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{dist.poolName}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${dist.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${dist.perShareAmount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {dist.recipients}
                      </TableCell>
                      <TableCell>
                        <Chip label={dist.distributionModel} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {new Date(dist.scheduledDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            dist.status === 'COMPLETED' ? <CheckCircle /> :
                            dist.status === 'PENDING' ? <Pending /> :
                            dist.status === 'PROCESSING' ? <Schedule /> :
                            <ErrorIcon />
                          }
                          label={dist.status}
                          size="small"
                          color={
                            dist.status === 'COMPLETED' ? 'success' :
                            dist.status === 'PENDING' ? 'warning' :
                            dist.status === 'PROCESSING' ? 'info' :
                            'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDistributionDetails(dist)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {dist.transactionHash && (
                            <Tooltip title="View on Explorer">
                              <IconButton size="small">
                                <Info />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredDistributions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No distributions found.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Payment Ledger */}
      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Payment Ledger</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Showing recent payments from completed distributions
            </Alert>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Holder Address</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Transaction Hash</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.slice(0, 50).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {payment.holderAddress.substring(0, 10)}...{payment.holderAddress.substring(38)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {payment.holderShares}
                      </TableCell>
                      <TableCell align="right">
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payment.transactionHash && (
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {payment.transactionHash.substring(0, 10)}...{payment.transactionHash.substring(62)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircle />}
                          label={payment.status}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Holder Statistics */}
      {selectedTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Holders by Share Ownership</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell align="right">Shares</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Total Received</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holderStats.slice(0, 10).map((holder, index) => (
                        <TableRow key={holder.address}>
                          <TableCell>#{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {holder.address.substring(0, 10)}...
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {holder.shares.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {holder.sharePercentage.toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">
                            ${holder.totalReceived.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Share Distribution Breakdown</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: '0-100 shares', value: holderStats.filter(h => h.shares <= 100).length },
                        { name: '101-500 shares', value: holderStats.filter(h => h.shares > 100 && h.shares <= 500).length },
                        { name: '501-1000 shares', value: holderStats.filter(h => h.shares > 500 && h.shares <= 1000).length },
                        { name: '1000+ shares', value: holderStats.filter(h => h.shares > 1000).length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {holderStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Distribution Received by Holder</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={holderStats.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="address"
                      tickFormatter={(addr) => `${addr.substring(0, 6)}...`}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="totalReceived" fill="#8884d8" name="Total Received ($)" />
                    <Bar dataKey="lastDistributionAmount" fill="#82ca9d" name="Last Distribution ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Execute Distribution Dialog */}
      <Dialog
        open={executeDialogOpen}
        onClose={() => setExecuteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Execute Distribution</DialogTitle>
        <DialogContent>
          {selectedPool && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Executing distribution for: <strong>{selectedPool.name}</strong><br />
                Total Holders: {selectedPool.holders}
              </Alert>

              <TextField
                fullWidth
                type="number"
                label="Distribution Amount (USD)"
                value={executionForm.distributionAmount}
                onChange={(e) => setExecutionForm({ ...executionForm, distributionAmount: parseFloat(e.target.value) })}
                margin="normal"
                required
                InputProps={{ startAdornment: '$' }}
              />

              {executionForm.distributionAmount > 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Per Share Amount: ${(executionForm.distributionAmount / selectedPool.totalShares).toFixed(2)}
                </Alert>
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Distribution Model</InputLabel>
                <Select
                  value={executionForm.distributionModel}
                  onChange={(e) => setExecutionForm({ ...executionForm, distributionModel: e.target.value as any })}
                >
                  {DISTRIBUTION_MODELS.map(model => (
                    <MenuItem key={model.type} value={model.type}>
                      <Box>
                        <Typography variant="body2">{model.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl component="fieldset" margin="normal">
                <RadioGroup
                  value={executionForm.executeNow ? 'now' : 'scheduled'}
                  onChange={(e) => setExecutionForm({ ...executionForm, executeNow: e.target.value === 'now' })}
                >
                  <FormControlLabel value="now" control={<Radio />} label="Execute Now" />
                  <FormControlLabel value="scheduled" control={<Radio />} label="Schedule for Later" />
                </RadioGroup>
              </FormControl>

              {!executionForm.executeNow && (
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Scheduled Date"
                  value={executionForm.scheduledDate}
                  onChange={(e) => setExecutionForm({ ...executionForm, scheduledDate: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecuteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExecuteDistribution} startIcon={<Send />}>
            {executionForm.executeNow ? 'Execute Now' : 'Schedule Distribution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Distribution Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDistribution && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Distribution Details</span>
                <Chip
                  label={selectedDistribution.status}
                  color={selectedDistribution.status === 'COMPLETED' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Pool Name</Typography>
                  <Typography variant="body2" paragraph>{selectedDistribution.poolName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Distribution Model</Typography>
                  <Typography variant="body2" paragraph>{selectedDistribution.distributionModel}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="body2" paragraph>
                    ${selectedDistribution.totalAmount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Per Share Amount</Typography>
                  <Typography variant="body2" paragraph>
                    ${selectedDistribution.perShareAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Recipients</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedDistribution.recipients} holders
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Scheduled Date</Typography>
                  <Typography variant="body2" paragraph>
                    {new Date(selectedDistribution.scheduledDate).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedDistribution.executedDate && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Executed Date</Typography>
                    <Typography variant="body2" paragraph>
                      {new Date(selectedDistribution.executedDate).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {selectedDistribution.transactionHash && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Transaction Hash</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedDistribution.transactionHash}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              <Button variant="outlined" startIcon={<Download />}>
                Export Report
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DistributionDashboard;
