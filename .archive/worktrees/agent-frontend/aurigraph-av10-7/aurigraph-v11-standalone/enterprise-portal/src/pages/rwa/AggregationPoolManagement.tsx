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
  Stepper,
  Step,
  StepLabel,
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
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Autocomplete,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  AccountBalance,
  TrendingUp,
  PieChart,
  Schedule,
  Settings,
  Save,
  Cancel,
  Info,
  Warning,
  CheckCircle,
  AttachMoney,
  AccountTree,
  Timeline,
  Refresh,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: 'REAL_ESTATE' | 'COMMODITY' | 'EQUITY' | 'DEBT' | 'ART' | 'OTHER';
  totalValue: number;
  totalSupply: number;
  pricePerToken: number;
  verified: boolean;
  inMerkleTree: boolean;
}

interface PoolAsset {
  assetId: string;
  weight: number; // Percentage 0-100
  targetValue: number;
  currentValue: number;
}

interface DistributionSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  autoDistribute: boolean;
  minThreshold: number;
}

interface AggregationPool {
  id: string;
  name: string;
  description: string;
  poolType: 'DIVERSIFIED' | 'SECTOR_SPECIFIC' | 'GEOGRAPHY_BASED' | 'RISK_BASED';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CLOSED';
  totalValue: number;
  totalShares: number;
  sharePrice: number;
  assets: PoolAsset[];
  distributionSchedule: DistributionSchedule;
  performance: {
    returns1D: number;
    returns7D: number;
    returns30D: number;
    returns1Y: number;
    volatility: number;
  };
  holders: number;
  createdAt: string;
  lastRebalance: string;
  merkleRootHash?: string;
}

interface PoolFormData {
  name: string;
  description: string;
  poolType: 'DIVERSIFIED' | 'SECTOR_SPECIFIC' | 'GEOGRAPHY_BASED' | 'RISK_BASED';
  selectedAssets: PoolAsset[];
  distributionSchedule: DistributionSchedule;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POOL_TYPES = [
  { value: 'DIVERSIFIED', label: 'Diversified Portfolio', icon: '📊' },
  { value: 'SECTOR_SPECIFIC', label: 'Sector Specific', icon: '🏭' },
  { value: 'GEOGRAPHY_BASED', label: 'Geography Based', icon: '🌍' },
  { value: 'RISK_BASED', label: 'Risk Based', icon: '⚖️' },
];

const DISTRIBUTION_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
];

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AggregationPoolManagement: React.FC = () => {
  // State Management
  const [pools, setPools] = useState<AggregationPool[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<AggregationPool | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState<PoolFormData>({
    name: '',
    description: '',
    poolType: 'DIVERSIFIED',
    selectedAssets: [],
    distributionSchedule: {
      frequency: 'MONTHLY',
      autoDistribute: true,
      minThreshold: 1000,
    },
  });

  // Wizard Steps
  const steps = ['Pool Information', 'Asset Selection', 'Distribution Schedule', 'Review & Create'];

  // ============================================================================
  // LIFECYCLE & DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchPoolsAndAssets();
    const interval = setInterval(fetchPoolsAndAssets, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchPoolsAndAssets = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch pools (placeholder endpoint)
      // In production: await apiService.getAggregationPools();
      const poolsData = generateMockPools();
      setPools(poolsData);

      // Fetch available assets from existing tokens endpoint
      try {
        const assetsData = await apiService.getRWATokens();
        const formattedAssets: Asset[] = assetsData.map((a: any) => ({
          id: a.id || `asset-${Math.random()}`,
          name: a.name || 'Unknown Asset',
          symbol: a.symbol || 'UNK',
          type: a.assetType || 'OTHER',
          totalValue: a.totalValue || 0,
          totalSupply: a.totalSupply || 0,
          pricePerToken: a.totalValue && a.totalSupply ? a.totalValue / a.totalSupply : 0,
          verified: a.verified || false,
          inMerkleTree: a.inMerkleTree || false,
        }));
        setAvailableAssets(formattedAssets);
      } catch (assetErr) {
        console.warn('Failed to fetch RWA tokens, using fallback:', assetErr);
        setAvailableAssets(generateMockAssets());
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch pools and assets:', err);
      setError('Unable to load aggregation pools. Using fallback data.');
      setPools(generateMockPools());
      setAvailableAssets(generateMockAssets());
      setLoading(false);
    }
  };

  // ============================================================================
  // MOCK DATA GENERATORS
  // ============================================================================

  const generateMockPools = (): AggregationPool[] => {
    return [
      {
        id: 'pool-001',
        name: 'Global Real Estate Fund',
        description: 'Diversified portfolio of commercial and residential properties across major markets',
        poolType: 'GEOGRAPHY_BASED',
        status: 'ACTIVE',
        totalValue: 15000000,
        totalShares: 15000,
        sharePrice: 1000,
        assets: [
          { assetId: 'asset-001', weight: 40, targetValue: 6000000, currentValue: 6100000 },
          { assetId: 'asset-002', weight: 35, targetValue: 5250000, currentValue: 5200000 },
          { assetId: 'asset-003', weight: 25, targetValue: 3750000, currentValue: 3700000 },
        ],
        distributionSchedule: {
          frequency: 'QUARTERLY',
          dayOfMonth: 1,
          autoDistribute: true,
          minThreshold: 50000,
        },
        performance: {
          returns1D: 0.12,
          returns7D: 1.45,
          returns30D: 4.2,
          returns1Y: 12.8,
          volatility: 8.5,
        },
        holders: 247,
        createdAt: '2024-01-15T10:00:00Z',
        lastRebalance: '2025-10-01T00:00:00Z',
        merkleRootHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
      {
        id: 'pool-002',
        name: 'Tech Sector Growth Fund',
        description: 'High-growth technology company equity pool with quarterly rebalancing',
        poolType: 'SECTOR_SPECIFIC',
        status: 'ACTIVE',
        totalValue: 8500000,
        totalShares: 8500,
        sharePrice: 1000,
        assets: [
          { assetId: 'asset-004', weight: 50, targetValue: 4250000, currentValue: 4300000 },
          { assetId: 'asset-005', weight: 30, targetValue: 2550000, currentValue: 2500000 },
          { assetId: 'asset-006', weight: 20, targetValue: 1700000, currentValue: 1700000 },
        ],
        distributionSchedule: {
          frequency: 'MONTHLY',
          dayOfMonth: 15,
          autoDistribute: true,
          minThreshold: 25000,
        },
        performance: {
          returns1D: 0.35,
          returns7D: 2.8,
          returns30D: 8.5,
          returns1Y: 24.3,
          volatility: 15.2,
        },
        holders: 158,
        createdAt: '2024-03-20T14:30:00Z',
        lastRebalance: '2025-10-15T00:00:00Z',
        merkleRootHash: '0x3b8cafe1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
      {
        id: 'pool-003',
        name: 'Conservative Bond Portfolio',
        description: 'Low-risk fixed income securities with stable monthly distributions',
        poolType: 'RISK_BASED',
        status: 'ACTIVE',
        totalValue: 5200000,
        totalShares: 5200,
        sharePrice: 1000,
        assets: [
          { assetId: 'asset-007', weight: 60, targetValue: 3120000, currentValue: 3150000 },
          { assetId: 'asset-008', weight: 40, targetValue: 2080000, currentValue: 2050000 },
        ],
        distributionSchedule: {
          frequency: 'MONTHLY',
          dayOfMonth: 1,
          autoDistribute: true,
          minThreshold: 10000,
        },
        performance: {
          returns1D: 0.02,
          returns7D: 0.15,
          returns30D: 0.6,
          returns1Y: 4.5,
          volatility: 2.1,
        },
        holders: 412,
        createdAt: '2024-02-10T09:00:00Z',
        lastRebalance: '2025-10-01T00:00:00Z',
        merkleRootHash: '0x5c9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
    ];
  };

  const generateMockAssets = (): Asset[] => {
    return [
      { id: 'asset-001', name: 'Manhattan Office Building', symbol: 'MNHB', type: 'REAL_ESTATE', totalValue: 6100000, totalSupply: 6100, pricePerToken: 1000, verified: true, inMerkleTree: true },
      { id: 'asset-002', name: 'London Retail Complex', symbol: 'LDRC', type: 'REAL_ESTATE', totalValue: 5200000, totalSupply: 5200, pricePerToken: 1000, verified: true, inMerkleTree: true },
      { id: 'asset-003', name: 'Tokyo Residential Tower', symbol: 'TKRT', type: 'REAL_ESTATE', totalValue: 3700000, totalSupply: 3700, pricePerToken: 1000, verified: true, inMerkleTree: true },
      { id: 'asset-004', name: 'AI Startup Equity', symbol: 'AIST', type: 'EQUITY', totalValue: 4300000, totalSupply: 43000, pricePerToken: 100, verified: true, inMerkleTree: true },
      { id: 'asset-005', name: 'SaaS Company Shares', symbol: 'SAAS', type: 'EQUITY', totalValue: 2500000, totalSupply: 25000, pricePerToken: 100, verified: true, inMerkleTree: true },
      { id: 'asset-006', name: 'Fintech Growth Stock', symbol: 'FNGR', type: 'EQUITY', totalValue: 1700000, totalSupply: 17000, pricePerToken: 100, verified: true, inMerkleTree: true },
      { id: 'asset-007', name: 'Corporate Bond AAA', symbol: 'CBAA', type: 'DEBT', totalValue: 3150000, totalSupply: 31500, pricePerToken: 100, verified: true, inMerkleTree: true },
      { id: 'asset-008', name: 'Municipal Bonds', symbol: 'MUNI', type: 'DEBT', totalValue: 2050000, totalSupply: 20500, pricePerToken: 100, verified: true, inMerkleTree: true },
    ];
  };

  // ============================================================================
  // POOL CREATION WIZARD HANDLERS
  // ============================================================================

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreatePool = async () => {
    try {
      // Validate form data
      if (!formData.name || formData.selectedAssets.length === 0) {
        setError('Please complete all required fields');
        return;
      }

      // Calculate total weight
      const totalWeight = formData.selectedAssets.reduce((sum, a) => sum + a.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        setError('Asset weights must sum to 100%');
        return;
      }

      // Create pool via API (placeholder)
      // In production: await apiService.createAggregationPool(formData);

      console.log('Creating pool with data:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh pools
      await fetchPoolsAndAssets();

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        poolType: 'DIVERSIFIED',
        selectedAssets: [],
        distributionSchedule: {
          frequency: 'MONTHLY',
          autoDistribute: true,
          minThreshold: 1000,
        },
      });
      setActiveStep(0);
      setCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create pool:', err);
      setError('Failed to create aggregation pool. Please try again.');
    }
  };

  const handleAddAssetToPool = (asset: Asset) => {
    const existingIndex = formData.selectedAssets.findIndex(a => a.assetId === asset.id);
    if (existingIndex >= 0) {
      setError('Asset already added to pool');
      return;
    }

    const newAsset: PoolAsset = {
      assetId: asset.id,
      weight: 0,
      targetValue: 0,
      currentValue: asset.totalValue,
    };

    setFormData({
      ...formData,
      selectedAssets: [...formData.selectedAssets, newAsset],
    });
  };

  const handleRemoveAssetFromPool = (assetId: string) => {
    setFormData({
      ...formData,
      selectedAssets: formData.selectedAssets.filter(a => a.assetId !== assetId),
    });
  };

  const handleUpdateAssetWeight = (assetId: string, weight: number) => {
    setFormData({
      ...formData,
      selectedAssets: formData.selectedAssets.map(a =>
        a.assetId === assetId ? { ...a, weight } : a
      ),
    });
  };

  const normalizeWeights = () => {
    const currentTotal = formData.selectedAssets.reduce((sum, a) => sum + a.weight, 0);
    if (currentTotal === 0) return;

    setFormData({
      ...formData,
      selectedAssets: formData.selectedAssets.map(a => ({
        ...a,
        weight: (a.weight / currentTotal) * 100,
      })),
    });
  };

  // ============================================================================
  // POOL ACTIONS
  // ============================================================================

  const handleViewPool = (pool: AggregationPool) => {
    setSelectedPool(pool);
    setDetailsDialogOpen(true);
  };

  const handleEditPool = (pool: AggregationPool) => {
    setSelectedPool(pool);
    setEditDialogOpen(true);
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool?')) return;

    try {
      // In production: await apiService.deleteAggregationPool(poolId);
      await fetchPoolsAndAssets();
    } catch (err) {
      setError('Failed to delete pool');
    }
  };

  const handleRebalancePool = async (poolId: string) => {
    try {
      // In production: await apiService.rebalancePool(poolId);
      console.log('Rebalancing pool:', poolId);
      await fetchPoolsAndAssets();
    } catch (err) {
      setError('Failed to rebalance pool');
    }
  };

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pool.status === filterStatus;
    const matchesType = filterType === 'all' || pool.poolType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // ============================================================================
  // STATISTICS CALCULATIONS
  // ============================================================================

  const statistics = {
    totalPools: pools.length,
    activePools: pools.filter(p => p.status === 'ACTIVE').length,
    totalValue: pools.reduce((sum, p) => sum + p.totalValue, 0),
    totalHolders: pools.reduce((sum, p) => sum + p.holders, 0),
    avgReturn30D: pools.length > 0
      ? pools.reduce((sum, p) => sum + p.performance.returns30D, 0) / pools.length
      : 0,
  };

  // ============================================================================
  // RENDER: WIZARD STEPS
  // ============================================================================

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Pool Information
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Pool Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              placeholder="e.g., Global Real Estate Fund"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              placeholder="Describe the pool's investment strategy and objectives..."
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Pool Type</InputLabel>
              <Select
                value={formData.poolType}
                onChange={(e) => setFormData({ ...formData, poolType: e.target.value as any })}
              >
                {POOL_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1: // Asset Selection
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select assets and configure their weights. Total weight must equal 100%.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                options={availableAssets.filter(a =>
                  !formData.selectedAssets.some(sa => sa.assetId === a.id)
                )}
                getOptionLabel={(option) => `${option.name} (${option.symbol})`}
                renderInput={(params) => (
                  <TextField {...params} label="Add Asset to Pool" placeholder="Search assets..." />
                )}
                onChange={(_, value) => {
                  if (value) handleAddAssetToPool(value);
                }}
              />
            </Box>

            {formData.selectedAssets.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Total Weight: {formData.selectedAssets.reduce((sum, a) => sum + a.weight, 0).toFixed(2)}%
                  </Typography>
                  <Button size="small" onClick={normalizeWeights}>
                    Normalize Weights
                  </Button>
                </Box>

                <List>
                  {formData.selectedAssets.map((poolAsset) => {
                    const asset = availableAssets.find(a => a.id === poolAsset.assetId);
                    if (!asset) return null;

                    return (
                      <ListItem key={poolAsset.assetId} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2">{asset.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.symbol} • {asset.type}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveAssetFromPool(poolAsset.assetId)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        <Box sx={{ px: 2 }}>
                          <Typography variant="caption" gutterBottom>
                            Weight: {poolAsset.weight.toFixed(2)}%
                          </Typography>
                          <Slider
                            value={poolAsset.weight}
                            onChange={(_, value) => handleUpdateAssetWeight(poolAsset.assetId, value as number)}
                            min={0}
                            max={100}
                            step={0.1}
                            marks={[
                              { value: 0, label: '0%' },
                              { value: 25, label: '25%' },
                              { value: 50, label: '50%' },
                              { value: 75, label: '75%' },
                              { value: 100, label: '100%' },
                            ]}
                          />
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}

            {formData.selectedAssets.length === 0 && (
              <Alert severity="warning">
                No assets selected. Please add at least one asset to the pool.
              </Alert>
            )}
          </Box>
        );

      case 2: // Distribution Schedule
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure how and when distributions are made to pool holders.
            </Alert>

            <FormControl fullWidth margin="normal">
              <InputLabel>Distribution Frequency</InputLabel>
              <Select
                value={formData.distributionSchedule.frequency}
                onChange={(e) => setFormData({
                  ...formData,
                  distributionSchedule: {
                    ...formData.distributionSchedule,
                    frequency: e.target.value as any,
                  },
                })}
              >
                {DISTRIBUTION_FREQUENCIES.map(freq => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(formData.distributionSchedule.frequency === 'WEEKLY' ||
              formData.distributionSchedule.frequency === 'MONTHLY' ||
              formData.distributionSchedule.frequency === 'QUARTERLY') && (
              <TextField
                fullWidth
                type="number"
                label="Day of Month"
                value={formData.distributionSchedule.dayOfMonth || 1}
                onChange={(e) => setFormData({
                  ...formData,
                  distributionSchedule: {
                    ...formData.distributionSchedule,
                    dayOfMonth: parseInt(e.target.value),
                  },
                })}
                margin="normal"
                inputProps={{ min: 1, max: 28 }}
              />
            )}

            <TextField
              fullWidth
              type="number"
              label="Minimum Distribution Threshold (USD)"
              value={formData.distributionSchedule.minThreshold}
              onChange={(e) => setFormData({
                ...formData,
                distributionSchedule: {
                  ...formData.distributionSchedule,
                  minThreshold: parseFloat(e.target.value),
                },
              })}
              margin="normal"
              InputProps={{ startAdornment: '$' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.distributionSchedule.autoDistribute}
                  onChange={(e) => setFormData({
                    ...formData,
                    distributionSchedule: {
                      ...formData.distributionSchedule,
                      autoDistribute: e.target.checked,
                    },
                  })}
                />
              }
              label="Enable Automatic Distribution"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 3: // Review & Create
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Review your pool configuration before creating.
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Pool Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body2">{formData.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2">
                    {POOL_TYPES.find(t => t.value === formData.poolType)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{formData.description || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Asset Allocation</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Weight</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.selectedAssets.map((poolAsset) => {
                      const asset = availableAssets.find(a => a.id === poolAsset.assetId);
                      return (
                        <TableRow key={poolAsset.assetId}>
                          <TableCell>{asset?.name || 'Unknown'}</TableCell>
                          <TableCell align="right">{poolAsset.weight.toFixed(2)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Distribution Schedule</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Frequency</Typography>
                  <Typography variant="body2">
                    {DISTRIBUTION_FREQUENCIES.find(f => f.value === formData.distributionSchedule.frequency)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min Threshold</Typography>
                  <Typography variant="body2">
                    ${formData.distributionSchedule.minThreshold.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Auto Distribution</Typography>
                  <Typography variant="body2">
                    {formData.distributionSchedule.autoDistribute ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER: MAIN COMPONENT
  // ============================================================================

  if (loading && pools.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>Aggregation Pool Management</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Aggregation Pool Management</Typography>
          <Typography variant="caption" color="text.secondary">
            Phase 1 Implementation - Pool Creation & Management
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPoolsAndAssets}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Create Pool
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Pools</Typography>
              <Typography variant="h4">{statistics.totalPools}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Active Pools</Typography>
              <Typography variant="h4" color="success.main">{statistics.activePools}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
              <Typography variant="h4">${(statistics.totalValue / 1000000).toFixed(1)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Holders</Typography>
              <Typography variant="h4">{statistics.totalHolders.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Avg 30D Return</Typography>
              <Typography variant="h4" color={statistics.avgReturn30D >= 0 ? 'success.main' : 'error.main'}>
                {statistics.avgReturn30D.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search pools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <MenuItem value="all">All Types</MenuItem>
                  {POOL_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pools Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pool Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Share Price</TableCell>
                  <TableCell align="right">Holders</TableCell>
                  <TableCell align="right">30D Return</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPools.map((pool) => (
                  <TableRow key={pool.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{pool.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pool.assets.length} assets
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={POOL_TYPES.find(t => t.value === pool.poolType)?.label || pool.poolType}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pool.status}
                        size="small"
                        color={pool.status === 'ACTIVE' ? 'success' : pool.status === 'PENDING' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${(pool.totalValue / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell align="right">
                      ${pool.sharePrice.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {pool.holders}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={pool.performance.returns30D >= 0 ? 'success.main' : 'error.main'}
                      >
                        {pool.performance.returns30D.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewPool(pool)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Pool">
                          <IconButton size="small" onClick={() => handleEditPool(pool)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rebalance">
                          <IconButton size="small" onClick={() => handleRebalancePool(pool.id)}>
                            <AccountBalance />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeletePool(pool.id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredPools.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No pools found. Create a pool to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Pool Wizard Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setActiveStep(0);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Aggregation Pool</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setActiveStep(0);
          }}>
            Cancel
          </Button>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleCreatePool} startIcon={<Save />}>
              Create Pool
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Pool Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedPool && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selectedPool.name}</span>
                <Chip
                  label={selectedPool.status}
                  color={selectedPool.status === 'ACTIVE' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Assets" />
                <Tab label="Performance" />
                <Tab label="Distribution" />
              </Tabs>

              {selectedTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body2" paragraph>{selectedPool.description}</Typography>

                    <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
                    <Typography variant="body2" paragraph>
                      ${selectedPool.totalValue.toLocaleString()}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">Share Price</Typography>
                    <Typography variant="body2" paragraph>
                      ${selectedPool.sharePrice.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Shares</Typography>
                    <Typography variant="body2" paragraph>
                      {selectedPool.totalShares.toLocaleString()}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">Holders</Typography>
                    <Typography variant="body2" paragraph>
                      {selectedPool.holders.toLocaleString()}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                    <Typography variant="body2" paragraph>
                      {new Date(selectedPool.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedPool.merkleRootHash && (
                    <Grid item xs={12}>
                      <Alert severity="success" icon={<AccountTree />}>
                        <Typography variant="caption">Merkle Root Hash (Phase 2 Integration)</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {selectedPool.merkleRootHash}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              )}

              {selectedTab === 1 && (
                <Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell align="right">Weight</TableCell>
                          <TableCell align="right">Target Value</TableCell>
                          <TableCell align="right">Current Value</TableCell>
                          <TableCell align="right">Variance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPool.assets.map((poolAsset) => {
                          const asset = availableAssets.find(a => a.id === poolAsset.assetId);
                          const variance = ((poolAsset.currentValue - poolAsset.targetValue) / poolAsset.targetValue) * 100;

                          return (
                            <TableRow key={poolAsset.assetId}>
                              <TableCell>{asset?.name || 'Unknown Asset'}</TableCell>
                              <TableCell align="right">{poolAsset.weight.toFixed(2)}%</TableCell>
                              <TableCell align="right">${poolAsset.targetValue.toLocaleString()}</TableCell>
                              <TableCell align="right">${poolAsset.currentValue.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  color={Math.abs(variance) < 5 ? 'success.main' : 'warning.main'}
                                >
                                  {variance >= 0 ? '+' : ''}{variance.toFixed(2)}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Asset Allocation</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={selectedPool.assets.map((a, idx) => {
                            const asset = availableAssets.find(aa => aa.id === a.assetId);
                            return {
                              name: asset?.name || 'Unknown',
                              value: a.weight,
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {selectedPool.assets.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {selectedTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Performance Metrics
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="1 Day Return" />
                            <Typography color={selectedPool.performance.returns1D >= 0 ? 'success.main' : 'error.main'}>
                              {selectedPool.performance.returns1D >= 0 ? '+' : ''}{selectedPool.performance.returns1D.toFixed(2)}%
                            </Typography>
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="7 Day Return" />
                            <Typography color={selectedPool.performance.returns7D >= 0 ? 'success.main' : 'error.main'}>
                              {selectedPool.performance.returns7D >= 0 ? '+' : ''}{selectedPool.performance.returns7D.toFixed(2)}%
                            </Typography>
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="30 Day Return" />
                            <Typography color={selectedPool.performance.returns30D >= 0 ? 'success.main' : 'error.main'}>
                              {selectedPool.performance.returns30D >= 0 ? '+' : ''}{selectedPool.performance.returns30D.toFixed(2)}%
                            </Typography>
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="1 Year Return" />
                            <Typography color={selectedPool.performance.returns1Y >= 0 ? 'success.main' : 'error.main'}>
                              {selectedPool.performance.returns1Y >= 0 ? '+' : ''}{selectedPool.performance.returns1Y.toFixed(2)}%
                            </Typography>
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Volatility" />
                            <Typography>
                              {selectedPool.performance.volatility.toFixed(2)}%
                            </Typography>
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Historical Performance (Mock Data)
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart
                            data={[
                              { month: 'Jan', value: 100 },
                              { month: 'Feb', value: 102 },
                              { month: 'Mar', value: 105 },
                              { month: 'Apr', value: 108 },
                              { month: 'May', value: 112 },
                              { month: 'Jun', value: 115 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {selectedTab === 3 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                      <Typography variant="body2" paragraph>
                        {DISTRIBUTION_FREQUENCIES.find(f => f.value === selectedPool.distributionSchedule.frequency)?.label}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Minimum Threshold</Typography>
                      <Typography variant="body2" paragraph>
                        ${selectedPool.distributionSchedule.minThreshold.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Auto Distribution</Typography>
                      <Typography variant="body2" paragraph>
                        {selectedPool.distributionSchedule.autoDistribute ? 'Enabled' : 'Disabled'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Last Distribution</Typography>
                      <Typography variant="body2" paragraph>
                        {new Date(selectedPool.lastRebalance).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Distribution History (Mock Data)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Per Share</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>2025-10-01</TableCell>
                          <TableCell align="right">$125,000</TableCell>
                          <TableCell align="right">$8.33</TableCell>
                          <TableCell>
                            <Chip label="Completed" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>2025-09-01</TableCell>
                          <TableCell align="right">$118,500</TableCell>
                          <TableCell align="right">$7.90</TableCell>
                          <TableCell>
                            <Chip label="Completed" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>2025-08-01</TableCell>
                          <TableCell align="right">$112,300</TableCell>
                          <TableCell align="right">$7.49</TableCell>
                          <TableCell>
                            <Chip label="Completed" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AggregationPoolManagement;
