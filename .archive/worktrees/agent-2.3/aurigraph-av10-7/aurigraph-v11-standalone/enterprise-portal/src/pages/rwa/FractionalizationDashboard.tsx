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
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Stack,
  CircularProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Visibility,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  AccountTree,
  Timeline as TimelineIcon,
  Info,
  PieChart,
  MonetizationOn,
  Share,
  Assessment,
  ExpandMore,
  Refresh,
  Add,
  CompareArrows,
  VerifiedUser,
  History,
  Update,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { apiService } from '../../services/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PrimaryToken {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  totalSupply: number;
  owner: string;
  createdAt: string;
  assetType: 'REAL_ESTATE' | 'COMMODITY' | 'EQUITY' | 'DEBT' | 'ART' | 'OTHER';
  assetValue: number;
  verified: boolean;
  inMerkleTree: boolean;
}

interface FractionalToken {
  id: string;
  primaryTokenId: string;
  name: string;
  symbol: string;
  contractAddress: string;
  totalSupply: number;
  issuedSupply: number;
  pricePerFraction: number;
  holders: number;
  createdAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED';
}

interface BreakingChange {
  id: string;
  fractionalTokenId: string;
  changeType: 'SUPPLY_SPLIT' | 'REVERSE_SPLIT' | 'ASSET_REVALUATION' | 'OWNERSHIP_TRANSFER';
  previousValue: number;
  newValue: number;
  ratio: number;
  reason: string;
  executedAt: string;
  executedBy: string;
  affectedHolders: number;
  merkleProofGenerated: boolean;
}

interface RevaluationEvent {
  id: string;
  tokenId: string;
  previousValuation: number;
  newValuation: number;
  valuationChange: number;
  valuationChangePercent: number;
  reason: string;
  approvedBy: string;
  executedAt: string;
  merkleRoot: string;
}

interface MerkleProof {
  tokenId: string;
  leafHash: string;
  proof: string[];
  rootHash: string;
  verified: boolean;
  generatedAt: string;
}

interface FractionalizationStats {
  totalPrimaryTokens: number;
  totalFractionalTokens: number;
  totalFractionHolders: number;
  totalAssetValue: number;
  totalBreakingChanges: number;
  totalRevaluations: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BREAKING_CHANGE_TYPES = [
  { value: 'SUPPLY_SPLIT', label: 'Supply Split', icon: <Share />, description: 'Increase fractional supply (e.g., 1:2 split)' },
  { value: 'REVERSE_SPLIT', label: 'Reverse Split', icon: <CompareArrows />, description: 'Decrease fractional supply (e.g., 2:1 reverse split)' },
  { value: 'ASSET_REVALUATION', label: 'Asset Revaluation', icon: <TrendingUp />, description: 'Update underlying asset value' },
  { value: 'OWNERSHIP_TRANSFER', label: 'Ownership Transfer', icon: <AccountBalance />, description: 'Transfer primary token ownership' },
];

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FractionalizationDashboard: React.FC = () => {
  // State Management
  const [primaryTokens, setPrimaryTokens] = useState<PrimaryToken[]>([]);
  const [fractionalTokens, setFractionalTokens] = useState<FractionalToken[]>([]);
  const [breakingChanges, setBreakingChanges] = useState<BreakingChange[]>([]);
  const [revaluationHistory, setRevaluationHistory] = useState<RevaluationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<PrimaryToken | null>(null);
  const [selectedFractionalToken, setSelectedFractionalToken] = useState<FractionalToken | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [fractionalizeDialogOpen, setFractionalizeDialogOpen] = useState(false);
  const [revaluationDialogOpen, setRevaluationDialogOpen] = useState(false);
  const [merkleProofDialogOpen, setMerkleProofDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null);

  // Form State
  const [fractionalizeForm, setFractionalizeForm] = useState({
    totalFractions: 1000,
    pricePerFraction: 100,
    symbol: '',
    name: '',
  });

  const [revaluationForm, setRevaluationForm] = useState({
    newValuation: 0,
    reason: '',
    approver: '',
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

      // Fetch primary tokens (RWA tokens)
      try {
        const tokensData = await apiService.getRWATokens();
        const formattedPrimaryTokens: PrimaryToken[] = tokensData.map((t: any) => ({
          id: t.id || `primary-${Math.random()}`,
          name: t.name || 'Unknown Token',
          symbol: t.symbol || 'UNK',
          contractAddress: t.contractAddress || '0x0',
          totalSupply: t.totalSupply || 0,
          owner: t.owner || '0x0',
          createdAt: t.createdAt || new Date().toISOString(),
          assetType: t.assetType || 'OTHER',
          assetValue: t.totalValue || 0,
          verified: t.verified || false,
          inMerkleTree: t.inMerkleTree || false,
        }));
        setPrimaryTokens(formattedPrimaryTokens);
      } catch (err) {
        console.warn('Failed to fetch RWA tokens, using mock data:', err);
        setPrimaryTokens(generateMockPrimaryTokens());
      }

      // Fetch fractional tokens (placeholder endpoint)
      // In production: await apiService.getFractionalTokens();
      setFractionalTokens(generateMockFractionalTokens());

      // Fetch breaking changes history
      setBreakingChanges(generateMockBreakingChanges());

      // Fetch revaluation history
      setRevaluationHistory(generateMockRevaluationHistory());

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch fractionalization data:', err);
      setError('Unable to load fractionalization data. Using fallback.');
      setPrimaryTokens(generateMockPrimaryTokens());
      setFractionalTokens(generateMockFractionalTokens());
      setBreakingChanges(generateMockBreakingChanges());
      setRevaluationHistory(generateMockRevaluationHistory());
      setLoading(false);
    }
  };

  // ============================================================================
  // MOCK DATA GENERATORS
  // ============================================================================

  const generateMockPrimaryTokens = (): PrimaryToken[] => {
    return [
      {
        id: 'primary-001',
        name: 'Manhattan Commercial Tower',
        symbol: 'MCT',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        totalSupply: 1,
        owner: '0xowner1234567890abcdef1234567890abcdef',
        createdAt: '2024-01-15T10:00:00Z',
        assetType: 'REAL_ESTATE',
        assetValue: 25000000,
        verified: true,
        inMerkleTree: true,
      },
      {
        id: 'primary-002',
        name: 'Gold Reserve Vault',
        symbol: 'GRV',
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        totalSupply: 1,
        owner: '0xowner2abcdef1234567890abcdef1234567890',
        createdAt: '2024-02-20T14:30:00Z',
        assetType: 'COMMODITY',
        assetValue: 15000000,
        verified: true,
        inMerkleTree: true,
      },
      {
        id: 'primary-003',
        name: 'Renaissance Art Collection',
        symbol: 'RAC',
        contractAddress: '0x567890abcdef1234567890abcdef1234567890ab',
        totalSupply: 1,
        owner: '0xowner3567890abcdef1234567890abcdef',
        createdAt: '2024-03-10T09:00:00Z',
        assetType: 'ART',
        assetValue: 8500000,
        verified: true,
        inMerkleTree: true,
      },
    ];
  };

  const generateMockFractionalTokens = (): FractionalToken[] => {
    return [
      {
        id: 'frac-001',
        primaryTokenId: 'primary-001',
        name: 'MCT Fractions',
        symbol: 'FMCT',
        contractAddress: '0xfrac1234567890abcdef1234567890abcdef12',
        totalSupply: 25000,
        issuedSupply: 18500,
        pricePerFraction: 1000,
        holders: 247,
        createdAt: '2024-01-20T10:00:00Z',
        status: 'ACTIVE',
      },
      {
        id: 'frac-002',
        primaryTokenId: 'primary-002',
        name: 'GRV Fractions',
        symbol: 'FGRV',
        contractAddress: '0xfrac2abcdef1234567890abcdef1234567890ab',
        totalSupply: 15000,
        issuedSupply: 12300,
        pricePerFraction: 1000,
        holders: 156,
        createdAt: '2024-02-25T14:30:00Z',
        status: 'ACTIVE',
      },
      {
        id: 'frac-003',
        primaryTokenId: 'primary-003',
        name: 'RAC Fractions',
        symbol: 'FRAC',
        contractAddress: '0xfrac3567890abcdef1234567890abcdef123456',
        totalSupply: 8500,
        issuedSupply: 7200,
        pricePerFraction: 1000,
        holders: 89,
        createdAt: '2024-03-15T09:00:00Z',
        status: 'ACTIVE',
      },
    ];
  };

  const generateMockBreakingChanges = (): BreakingChange[] => {
    return [
      {
        id: 'break-001',
        fractionalTokenId: 'frac-001',
        changeType: 'SUPPLY_SPLIT',
        previousValue: 25000,
        newValue: 50000,
        ratio: 2,
        reason: 'Increased demand and liquidity requirements',
        executedAt: '2025-06-15T10:00:00Z',
        executedBy: '0xadmin1234567890abcdef',
        affectedHolders: 247,
        merkleProofGenerated: true,
      },
      {
        id: 'break-002',
        fractionalTokenId: 'frac-002',
        changeType: 'ASSET_REVALUATION',
        previousValue: 15000000,
        newValue: 18000000,
        ratio: 1.2,
        reason: 'Gold price increase - 20% appreciation',
        executedAt: '2025-08-10T14:30:00Z',
        executedBy: '0xadmin2abcdef1234567890',
        affectedHolders: 156,
        merkleProofGenerated: true,
      },
      {
        id: 'break-003',
        fractionalTokenId: 'frac-003',
        changeType: 'REVERSE_SPLIT',
        previousValue: 8500,
        newValue: 4250,
        ratio: 0.5,
        reason: 'Consolidation to increase per-fraction value',
        executedAt: '2025-09-20T09:00:00Z',
        executedBy: '0xadmin3567890abcdef',
        affectedHolders: 89,
        merkleProofGenerated: true,
      },
    ];
  };

  const generateMockRevaluationHistory = (): RevaluationEvent[] => {
    return [
      {
        id: 'reval-001',
        tokenId: 'primary-001',
        previousValuation: 25000000,
        newValuation: 27500000,
        valuationChange: 2500000,
        valuationChangePercent: 10,
        reason: 'Market appreciation and rental income increase',
        approvedBy: 'John Appraiser, Chief Valuation Officer',
        executedAt: '2025-10-01T10:00:00Z',
        merkleRoot: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
      {
        id: 'reval-002',
        tokenId: 'primary-002',
        previousValuation: 15000000,
        newValuation: 18000000,
        valuationChange: 3000000,
        valuationChangePercent: 20,
        reason: 'Gold spot price increase - market conditions',
        approvedBy: 'Sarah Gold, Commodities Director',
        executedAt: '2025-08-10T14:30:00Z',
        merkleRoot: '0x3b8cafe1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
      {
        id: 'reval-003',
        tokenId: 'primary-003',
        previousValuation: 8500000,
        newValuation: 8100000,
        valuationChange: -400000,
        valuationChangePercent: -4.7,
        reason: 'Art market correction - conservative revaluation',
        approvedBy: 'Michael Arts, Fine Arts Curator',
        executedAt: '2025-07-15T09:00:00Z',
        merkleRoot: '0x5c9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      },
    ];
  };

  // ============================================================================
  // FRACTIONALIZATION ACTIONS
  // ============================================================================

  const handleFractionalize = async () => {
    if (!selectedToken) return;

    try {
      // Validate form
      if (!fractionalizeForm.name || !fractionalizeForm.symbol || fractionalizeForm.totalFractions <= 0) {
        setError('Please complete all required fields');
        return;
      }

      // Create fractional tokens via API (placeholder)
      // In production: await apiService.fractionalizeToken({
      //   primaryTokenId: selectedToken.id,
      //   totalFractions: fractionalizeForm.totalFractions,
      //   pricePerFraction: fractionalizeForm.pricePerFraction,
      //   name: fractionalizeForm.name,
      //   symbol: fractionalizeForm.symbol,
      // });

      console.log('Fractionalizing token:', selectedToken.id, fractionalizeForm);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh data
      await fetchData();

      // Reset form and close dialog
      setFractionalizeForm({
        totalFractions: 1000,
        pricePerFraction: 100,
        symbol: '',
        name: '',
      });
      setFractionalizeDialogOpen(false);
      setSelectedToken(null);
    } catch (err) {
      console.error('Failed to fractionalize token:', err);
      setError('Failed to create fractional tokens. Please try again.');
    }
  };

  const handleRevaluation = async () => {
    if (!selectedToken) return;

    try {
      // Validate form
      if (!revaluationForm.newValuation || !revaluationForm.reason || !revaluationForm.approver) {
        setError('Please complete all required fields');
        return;
      }

      // Execute revaluation via API (placeholder)
      // In production: await apiService.revaluateAsset({
      //   tokenId: selectedToken.id,
      //   newValuation: revaluationForm.newValuation,
      //   reason: revaluationForm.reason,
      //   approver: revaluationForm.approver,
      // });

      console.log('Revaluating asset:', selectedToken.id, revaluationForm);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh data
      await fetchData();

      // Reset form and close dialog
      setRevaluationForm({
        newValuation: 0,
        reason: '',
        approver: '',
      });
      setRevaluationDialogOpen(false);
      setSelectedToken(null);
    } catch (err) {
      console.error('Failed to revalue asset:', err);
      setError('Failed to execute revaluation. Please try again.');
    }
  };

  const handleGenerateMerkleProof = async (tokenId: string) => {
    try {
      // Generate Merkle proof via API (placeholder)
      // In production: const proof = await apiService.generateMerkleProof(tokenId);

      // Simulate Merkle proof generation
      const mockProof: MerkleProof = {
        tokenId,
        leafHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        proof: [
          '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        ],
        rootHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
        verified: true,
        generatedAt: new Date().toISOString(),
      };

      setMerkleProof(mockProof);
      setMerkleProofDialogOpen(true);
    } catch (err) {
      console.error('Failed to generate Merkle proof:', err);
      setError('Failed to generate Merkle proof');
    }
  };

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const stats: FractionalizationStats = {
    totalPrimaryTokens: primaryTokens.length,
    totalFractionalTokens: fractionalTokens.length,
    totalFractionHolders: fractionalTokens.reduce((sum, ft) => sum + ft.holders, 0),
    totalAssetValue: primaryTokens.reduce((sum, pt) => sum + pt.assetValue, 0),
    totalBreakingChanges: breakingChanges.length,
    totalRevaluations: revaluationHistory.length,
  };

  // ============================================================================
  // RENDER: MAIN COMPONENT
  // ============================================================================

  if (loading && primaryTokens.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>Fractionalization Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Fractionalization Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">
            Phase 1 Implementation - Primary Token Display & Fractionalization
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
              <Typography variant="subtitle2" color="text.secondary">Primary Tokens</Typography>
              <Typography variant="h4">{stats.totalPrimaryTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Fractional Tokens</Typography>
              <Typography variant="h4" color="primary.main">{stats.totalFractionalTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Asset Value</Typography>
              <Typography variant="h4">${(stats.totalAssetValue / 1000000).toFixed(1)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Fraction Holders</Typography>
              <Typography variant="h4">{stats.totalFractionHolders.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Breaking Changes</Typography>
              <Typography variant="h4" color="warning.main">{stats.totalBreakingChanges}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Revaluations</Typography>
              <Typography variant="h4">{stats.totalRevaluations}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="Primary Tokens" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Fractional Tokens" icon={<Share />} iconPosition="start" />
          <Tab label="Breaking Changes" icon={<Warning />} iconPosition="start" />
          <Tab label="Revaluation History" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content: Primary Tokens */}
      {selectedTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Primary Token Registry</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token Name</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Asset Type</TableCell>
                    <TableCell align="right">Asset Value</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Merkle Tree</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {primaryTokens.map((token) => {
                    const fractions = fractionalTokens.filter(ft => ft.primaryTokenId === token.id);
                    return (
                      <TableRow key={token.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{token.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fractions.length > 0 ? `${fractions.length} fractional token(s)` : 'Not fractionalized'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={token.symbol} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={token.assetType} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          ${token.assetValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {token.verified ? (
                            <Chip icon={<VerifiedUser />} label="Verified" size="small" color="success" />
                          ) : (
                            <Chip label="Unverified" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {token.inMerkleTree ? (
                            <Tooltip title="View Merkle Proof">
                              <IconButton size="small" onClick={() => handleGenerateMerkleProof(token.id)}>
                                <Badge badgeContent={<CheckCircle fontSize="small" />} color="success">
                                  <AccountTree />
                                </Badge>
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Chip label="Pending" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => {
                                setSelectedToken(token);
                                setDetailsDialogOpen(true);
                              }}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Fractionalize">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setFractionalizeForm({
                                    ...fractionalizeForm,
                                    name: `${token.name} Fractions`,
                                    symbol: `F${token.symbol}`,
                                    pricePerFraction: Math.floor(token.assetValue / 10000),
                                  });
                                  setFractionalizeDialogOpen(true);
                                }}
                              >
                                <Share />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Revalue Asset">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setRevaluationForm({
                                    ...revaluationForm,
                                    newValuation: token.assetValue,
                                  });
                                  setRevaluationDialogOpen(true);
                                }}
                              >
                                <TrendingUp />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Fractional Tokens */}
      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Fractional Token Registry</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fractional Token</TableCell>
                    <TableCell>Primary Token</TableCell>
                    <TableCell align="right">Total Supply</TableCell>
                    <TableCell align="right">Issued Supply</TableCell>
                    <TableCell align="right">Price per Fraction</TableCell>
                    <TableCell align="right">Holders</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fractionalTokens.map((fToken) => {
                    const primaryToken = primaryTokens.find(pt => pt.id === fToken.primaryTokenId);
                    const utilization = (fToken.issuedSupply / fToken.totalSupply) * 100;

                    return (
                      <TableRow key={fToken.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{fToken.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fToken.symbol} • {utilization.toFixed(1)}% utilized
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={primaryToken?.name || 'Unknown'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          {fToken.totalSupply.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {fToken.issuedSupply.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${fToken.pricePerFraction.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {fToken.holders.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={fToken.status}
                            size="small"
                            color={fToken.status === 'ACTIVE' ? 'success' : fToken.status === 'PAUSED' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => {
                                setSelectedFractionalToken(fToken);
                                setDetailsDialogOpen(true);
                              }}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Merkle Proof">
                              <IconButton size="small" onClick={() => handleGenerateMerkleProof(fToken.id)}>
                                <AccountTree />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Breaking Changes */}
      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Breaking Change History</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Breaking changes affect token holders and require Merkle proof generation for verification.
            </Alert>

            <Timeline position="alternate">
              {breakingChanges.map((change, index) => {
                const changeTypeInfo = BREAKING_CHANGE_TYPES.find(t => t.value === change.changeType);
                const fToken = fractionalTokens.find(ft => ft.id === change.fractionalTokenId);

                return (
                  <TimelineItem key={change.id}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(change.executedAt).toLocaleDateString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={change.merkleProofGenerated ? 'success' : 'warning'}>
                        {changeTypeInfo?.icon || <Update />}
                      </TimelineDot>
                      {index < breakingChanges.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {changeTypeInfo?.label || change.changeType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {fToken?.name || 'Unknown Token'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {change.reason}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={`Ratio: ${change.ratio}x`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${change.affectedHolders} holders`}
                            size="small"
                            variant="outlined"
                          />
                          {change.merkleProofGenerated && (
                            <Chip
                              icon={<CheckCircle />}
                              label="Merkle Verified"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>

            {breakingChanges.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No breaking changes recorded yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Revaluation History */}
      {selectedTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Asset Revaluation History</Typography>

            <Grid container spacing={2}>
              {revaluationHistory.map((reval) => {
                const token = primaryTokens.find(pt => pt.id === reval.tokenId);

                return (
                  <Grid item xs={12} md={6} lg={4} key={reval.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {token?.name || 'Unknown Token'}
                          </Typography>
                          <Chip
                            label={token?.symbol || 'UNK'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Previous Value</Typography>
                            <Typography variant="body2">
                              ${(reval.previousValuation / 1000000).toFixed(2)}M
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">New Value</Typography>
                            <Typography variant="body2">
                              ${(reval.newValuation / 1000000).toFixed(2)}M
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              {reval.valuationChangePercent >= 0 ? (
                                <TrendingUp color="success" fontSize="small" />
                              ) : (
                                <TrendingDown color="error" fontSize="small" />
                              )}
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={reval.valuationChangePercent >= 0 ? 'success.main' : 'error.main'}
                              >
                                {reval.valuationChangePercent >= 0 ? '+' : ''}{reval.valuationChangePercent.toFixed(2)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (${(Math.abs(reval.valuationChange) / 1000000).toFixed(2)}M)
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="caption" color="text.secondary" display="block">
                          Reason
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {reval.reason}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" display="block">
                          Approved By
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {reval.approvedBy}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" display="block">
                          Executed
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {new Date(reval.executedAt).toLocaleString()}
                        </Typography>

                        {reval.merkleRoot && (
                          <Alert severity="success" icon={<AccountTree />} sx={{ mt: 1 }}>
                            <Typography variant="caption">Merkle Root</Typography>
                            <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}>
                              {reval.merkleRoot.substring(0, 20)}...
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {revaluationHistory.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No revaluation events recorded yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fractionalize Dialog */}
      <Dialog
        open={fractionalizeDialogOpen}
        onClose={() => setFractionalizeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fractionalize Token</DialogTitle>
        <DialogContent>
          {selectedToken && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Creating fractional tokens for: <strong>{selectedToken.name}</strong>
              </Alert>

              <TextField
                fullWidth
                label="Fractional Token Name"
                value={fractionalizeForm.name}
                onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, name: e.target.value })}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Symbol"
                value={fractionalizeForm.symbol}
                onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, symbol: e.target.value })}
                margin="normal"
                required
                inputProps={{ maxLength: 10 }}
              />

              <TextField
                fullWidth
                type="number"
                label="Total Fractions"
                value={fractionalizeForm.totalFractions}
                onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, totalFractions: parseInt(e.target.value) })}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                type="number"
                label="Price per Fraction (USD)"
                value={fractionalizeForm.pricePerFraction}
                onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, pricePerFraction: parseFloat(e.target.value) })}
                margin="normal"
                required
                InputProps={{ startAdornment: '$' }}
              />

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Total Value: ${(fractionalizeForm.totalFractions * fractionalizeForm.pricePerFraction).toLocaleString()}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFractionalizeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFractionalize} startIcon={<Share />}>
            Create Fractional Tokens
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revaluation Dialog */}
      <Dialog
        open={revaluationDialogOpen}
        onClose={() => setRevaluationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Asset Revaluation</DialogTitle>
        <DialogContent>
          {selectedToken && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Revaluing: <strong>{selectedToken.name}</strong><br />
                Current Valuation: ${selectedToken.assetValue.toLocaleString()}
              </Alert>

              <TextField
                fullWidth
                type="number"
                label="New Valuation (USD)"
                value={revaluationForm.newValuation}
                onChange={(e) => setRevaluationForm({ ...revaluationForm, newValuation: parseFloat(e.target.value) })}
                margin="normal"
                required
                InputProps={{ startAdornment: '$' }}
              />

              {revaluationForm.newValuation > 0 && (
                <Alert severity={revaluationForm.newValuation >= selectedToken.assetValue ? 'success' : 'warning'} sx={{ mt: 1 }}>
                  Change: {((revaluationForm.newValuation - selectedToken.assetValue) / selectedToken.assetValue * 100).toFixed(2)}%
                  ({revaluationForm.newValuation >= selectedToken.assetValue ? '+' : ''}${(revaluationForm.newValuation - selectedToken.assetValue).toLocaleString()})
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Revaluation"
                value={revaluationForm.reason}
                onChange={(e) => setRevaluationForm({ ...revaluationForm, reason: e.target.value })}
                margin="normal"
                required
                placeholder="Describe the reason for the revaluation (e.g., market conditions, appraisal update...)"
              />

              <TextField
                fullWidth
                label="Approver Name & Title"
                value={revaluationForm.approver}
                onChange={(e) => setRevaluationForm({ ...revaluationForm, approver: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., John Smith, Chief Valuation Officer"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevaluationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRevaluation} startIcon={<TrendingUp />}>
            Execute Revaluation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merkle Proof Dialog */}
      <Dialog
        open={merkleProofDialogOpen}
        onClose={() => setMerkleProofDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTree />
            <span>Merkle Proof Verification</span>
            {merkleProof?.verified && <CheckCircle color="success" />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {merkleProof && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Merkle proof successfully generated and verified!
              </Alert>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>Token ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {merkleProof.tokenId}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>Leaf Hash</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {merkleProof.leafHash}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>Merkle Root</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'success.main', fontWeight: 'bold' }}>
                  {merkleProof.rootHash}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>Proof Path</Typography>
              <List dense>
                {merkleProof.proof.map((hash, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip label={`Step ${index + 1}`} size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {hash}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Generated: {new Date(merkleProof.generatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMerkleProofDialogOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Info />}>
            Download Proof
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FractionalizationDashboard;
