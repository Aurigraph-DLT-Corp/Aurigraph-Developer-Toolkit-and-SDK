/**
 * Asset-Backed Stablecoin Management Component
 *
 * Comprehensive stablecoin platform featuring:
 * - Multi-collateral asset backing (fiat, crypto, RWA, commodities)
 * - Proof of Reserve (PoR) with real-time transparency
 * - Collateralization ratio monitoring and liquidation
 * - Minting/Burning operations with fee management
 * - Stability mechanism controls and circuit breakers
 * - Third-party attestations and audits
 *
 * Based on industry standards: Chainlink PoR, MakerDAO, USDC architecture
 */

import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  Slider,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Warning,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Search,
  Visibility,
  VerifiedUser,
  Security,
  SwapHoriz,
  LocalAtm,
  Gavel,
  Shield,
  PieChart,
  AccountBalanceWallet,
  Receipt,
  Speed,
} from '@mui/icons-material';

// Types for Asset-Backed Stablecoin
export type CollateralType = 'fiat' | 'crypto' | 'commodity' | 'rwa' | 'treasury' | 'mixed';
export type PegCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'SGD' | 'AUD';
export type StablecoinStatus = 'active' | 'paused' | 'deprecated' | 'emergency';

export interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  pegCurrency: PegCurrency;
  pegRatio: number; // 1:1 = 1.0
  currentPeg: number; // actual market price
  pegDeviation: number; // % deviation from peg
  collateralType: CollateralType;
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  collateralizationRatio: number; // 100% = fully backed, >100% = overcollateralized
  minCollateralRatio: number; // liquidation threshold
  targetCollateralRatio: number;
  status: StablecoinStatus;
  issuer: string;
  contractAddress: string;
  deployedAt: string;
  lastAuditAt: string;
  auditor: string;
  holders: number;
  dailyVolume: number;
  reserves: ReserveAsset[];
  attestations: Attestation[];
  fees: FeeStructure;
  stabilityMechanism: StabilityMechanism;
}

export interface ReserveAsset {
  id: string;
  assetType: CollateralType;
  assetName: string;
  assetSymbol: string;
  quantity: number;
  valueUSD: number;
  percentage: number;
  custodian: string;
  lastVerified: string;
  verificationProof: string;
  location: string;
}

export interface Attestation {
  id: string;
  auditor: string;
  date: string;
  type: 'full_audit' | 'proof_of_reserve' | 'smart_contract' | 'compliance';
  result: 'passed' | 'passed_with_observations' | 'failed';
  totalReserves: number;
  totalSupply: number;
  collateralRatio: number;
  reportUrl: string;
  onChainProof: string;
}

export interface FeeStructure {
  mintFee: number; // basis points
  burnFee: number;
  transferFee: number;
  stabilityFee: number; // annual %
  liquidationPenalty: number;
}

export interface StabilityMechanism {
  type: 'collateral' | 'algorithmic' | 'hybrid';
  autoRebalance: boolean;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number; // % deviation to trigger
  emergencyShutdown: boolean;
  lastRebalance: string;
  rebalanceFrequency: string;
}

export interface MintBurnOperation {
  id: string;
  type: 'mint' | 'burn';
  stablecoinId: string;
  amount: number;
  collateralAsset: string;
  collateralAmount: number;
  fee: number;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  operator: string;
}

// Mock data for stablecoins
const mockStablecoins: Stablecoin[] = [
  {
    id: 'sc_1',
    name: 'Aurigraph USD',
    symbol: 'aUSD',
    pegCurrency: 'USD',
    pegRatio: 1.0,
    currentPeg: 0.9998,
    pegDeviation: -0.02,
    collateralType: 'mixed',
    totalSupply: 50000000,
    circulatingSupply: 48500000,
    marketCap: 48485300,
    collateralizationRatio: 105.5,
    minCollateralRatio: 100,
    targetCollateralRatio: 105,
    status: 'active',
    issuer: 'Aurigraph Foundation',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    deployedAt: '2025-01-15T00:00:00Z',
    lastAuditAt: '2025-11-01T00:00:00Z',
    auditor: 'Deloitte',
    holders: 12500,
    dailyVolume: 5200000,
    reserves: [
      {
        id: 'res_1',
        assetType: 'fiat',
        assetName: 'US Dollar Cash',
        assetSymbol: 'USD',
        quantity: 25000000,
        valueUSD: 25000000,
        percentage: 48.8,
        custodian: 'JP Morgan Chase',
        lastVerified: '2025-12-01T00:00:00Z',
        verificationProof: '0xproof1...',
        location: 'New York, USA',
      },
      {
        id: 'res_2',
        assetType: 'treasury',
        assetName: 'US Treasury Bills',
        assetSymbol: 'T-BILL',
        quantity: 20000000,
        valueUSD: 20250000,
        percentage: 39.5,
        custodian: 'BNY Mellon',
        lastVerified: '2025-12-01T00:00:00Z',
        verificationProof: '0xproof2...',
        location: 'New York, USA',
      },
      {
        id: 'res_3',
        assetType: 'crypto',
        assetName: 'USD Coin',
        assetSymbol: 'USDC',
        quantity: 6000000,
        valueUSD: 6000000,
        percentage: 11.7,
        custodian: 'Coinbase Custody',
        lastVerified: '2025-12-07T10:00:00Z',
        verificationProof: '0xproof3...',
        location: 'On-chain (Ethereum)',
      },
    ],
    attestations: [
      {
        id: 'att_1',
        auditor: 'Deloitte',
        date: '2025-11-01T00:00:00Z',
        type: 'full_audit',
        result: 'passed',
        totalReserves: 51250000,
        totalSupply: 48500000,
        collateralRatio: 105.67,
        reportUrl: 'https://aurigraph.io/audits/2025-11.pdf',
        onChainProof: '0xattestation1...',
      },
      {
        id: 'att_2',
        auditor: 'Chainlink PoR',
        date: '2025-12-07T10:00:00Z',
        type: 'proof_of_reserve',
        result: 'passed',
        totalReserves: 51250000,
        totalSupply: 48500000,
        collateralRatio: 105.67,
        reportUrl: '',
        onChainProof: '0xchainlink_proof...',
      },
    ],
    fees: {
      mintFee: 10, // 0.1%
      burnFee: 10,
      transferFee: 0,
      stabilityFee: 0,
      liquidationPenalty: 500, // 5%
    },
    stabilityMechanism: {
      type: 'collateral',
      autoRebalance: true,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 2.0,
      emergencyShutdown: false,
      lastRebalance: '2025-12-06T18:00:00Z',
      rebalanceFrequency: 'daily',
    },
  },
  {
    id: 'sc_2',
    name: 'Gold-Backed Token',
    symbol: 'aGOLD',
    pegCurrency: 'USD',
    pegRatio: 2650, // 1 token = 1 oz gold
    currentPeg: 2648.5,
    pegDeviation: -0.06,
    collateralType: 'commodity',
    totalSupply: 100000,
    circulatingSupply: 85000,
    marketCap: 225122500,
    collateralizationRatio: 100.2,
    minCollateralRatio: 100,
    targetCollateralRatio: 100,
    status: 'active',
    issuer: 'Aurigraph Commodities',
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    deployedAt: '2025-03-01T00:00:00Z',
    lastAuditAt: '2025-10-15T00:00:00Z',
    auditor: 'Bureau Veritas',
    holders: 3200,
    dailyVolume: 1500000,
    reserves: [
      {
        id: 'res_4',
        assetType: 'commodity',
        assetName: 'Physical Gold (LBMA)',
        assetSymbol: 'XAU',
        quantity: 100200,
        valueUSD: 265530000,
        percentage: 100,
        custodian: 'Swiss Vault Services AG',
        lastVerified: '2025-11-15T00:00:00Z',
        verificationProof: '0xgold_proof...',
        location: 'Zurich, Switzerland',
      },
    ],
    attestations: [
      {
        id: 'att_3',
        auditor: 'Bureau Veritas',
        date: '2025-10-15T00:00:00Z',
        type: 'full_audit',
        result: 'passed',
        totalReserves: 265530000,
        totalSupply: 265000000,
        collateralRatio: 100.2,
        reportUrl: 'https://aurigraph.io/audits/gold-2025-10.pdf',
        onChainProof: '0xgold_attestation...',
      },
    ],
    fees: {
      mintFee: 25,
      burnFee: 25,
      transferFee: 5,
      stabilityFee: 0.25,
      liquidationPenalty: 0,
    },
    stabilityMechanism: {
      type: 'collateral',
      autoRebalance: false,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 5.0,
      emergencyShutdown: false,
      lastRebalance: '',
      rebalanceFrequency: 'manual',
    },
  },
  {
    id: 'sc_3',
    name: 'RWA-Backed USD',
    symbol: 'rUSD',
    pegCurrency: 'USD',
    pegRatio: 1.0,
    currentPeg: 1.001,
    pegDeviation: 0.1,
    collateralType: 'rwa',
    totalSupply: 25000000,
    circulatingSupply: 24000000,
    marketCap: 24024000,
    collateralizationRatio: 112.5,
    minCollateralRatio: 110,
    targetCollateralRatio: 115,
    status: 'active',
    issuer: 'Aurigraph RWA',
    contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
    deployedAt: '2025-06-01T00:00:00Z',
    lastAuditAt: '2025-11-15T00:00:00Z',
    auditor: 'KPMG',
    holders: 5800,
    dailyVolume: 2800000,
    reserves: [
      {
        id: 'res_5',
        assetType: 'rwa',
        assetName: 'Commercial Real Estate Portfolio',
        assetSymbol: 'CRE',
        quantity: 1,
        valueUSD: 18000000,
        percentage: 66.7,
        custodian: 'Deloitte Real Estate Services',
        lastVerified: '2025-11-01T00:00:00Z',
        verificationProof: '0xrwa_proof1...',
        location: 'Multiple US Cities',
      },
      {
        id: 'res_6',
        assetType: 'treasury',
        assetName: 'US Treasury Notes',
        assetSymbol: 'T-NOTE',
        quantity: 9000000,
        valueUSD: 9000000,
        percentage: 33.3,
        custodian: 'State Street',
        lastVerified: '2025-12-01T00:00:00Z',
        verificationProof: '0xrwa_proof2...',
        location: 'Boston, USA',
      },
    ],
    attestations: [],
    fees: {
      mintFee: 15,
      burnFee: 15,
      transferFee: 0,
      stabilityFee: 0.5,
      liquidationPenalty: 1000,
    },
    stabilityMechanism: {
      type: 'hybrid',
      autoRebalance: true,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 3.0,
      emergencyShutdown: false,
      lastRebalance: '2025-12-05T12:00:00Z',
      rebalanceFrequency: 'weekly',
    },
  },
];

// Mock operations
const mockOperations: MintBurnOperation[] = [
  {
    id: 'op_1',
    type: 'mint',
    stablecoinId: 'sc_1',
    amount: 1000000,
    collateralAsset: 'USDC',
    collateralAmount: 1001000,
    fee: 1000,
    txHash: '0x1234...abcd',
    status: 'completed',
    timestamp: '2025-12-07T09:30:00Z',
    operator: 'Treasury Ops',
  },
  {
    id: 'op_2',
    type: 'burn',
    stablecoinId: 'sc_1',
    amount: 500000,
    collateralAsset: 'USD',
    collateralAmount: 499500,
    fee: 500,
    txHash: '0x5678...efgh',
    status: 'completed',
    timestamp: '2025-12-07T08:15:00Z',
    operator: 'Treasury Ops',
  },
];

const AssetBackedStablecoin: React.FC = () => {
  const [stablecoins, setStablecoins] = useState<Stablecoin[]>(mockStablecoins);
  const [operations] = useState<MintBurnOperation[]>(mockOperations);
  const [selectedStablecoin, setSelectedStablecoin] = useState<Stablecoin | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mintBurnDialogOpen, setMintBurnDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [mintBurnType, setMintBurnType] = useState<'mint' | 'burn'>('mint');
  const [searchTerm, setSearchTerm] = useState('');

  // Create stablecoin form
  const [createForm, setCreateForm] = useState({
    name: '',
    symbol: '',
    pegCurrency: 'USD' as PegCurrency,
    collateralType: 'mixed' as CollateralType,
    initialSupply: 0,
    targetCollateralRatio: 100,
    minCollateralRatio: 100,
  });

  // Mint/Burn form
  const [mintBurnForm, setMintBurnForm] = useState({
    amount: 0,
    collateralAsset: 'USD',
  });

  // Stats calculations
  const stats = {
    totalMarketCap: stablecoins.reduce((sum, s) => sum + s.marketCap, 0),
    totalSupply: stablecoins.reduce((sum, s) => sum + s.circulatingSupply, 0),
    avgCollateralRatio:
      stablecoins.reduce((sum, s) => sum + s.collateralizationRatio, 0) / stablecoins.length,
    totalHolders: stablecoins.reduce((sum, s) => sum + s.holders, 0),
    dailyVolume: stablecoins.reduce((sum, s) => sum + s.dailyVolume, 0),
    activeStablecoins: stablecoins.filter((s) => s.status === 'active').length,
  };

  const formatCurrency = (value: number, compact = true) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(value);

  const getStatusColor = (status: StablecoinStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'deprecated':
        return 'default';
      case 'emergency':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPegStatusColor = (deviation: number) => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation <= 0.1) return 'success';
    if (absDeviation <= 0.5) return 'warning';
    return 'error';
  };

  const getCollateralStatusColor = (ratio: number, minRatio: number) => {
    if (ratio >= minRatio + 10) return 'success';
    if (ratio >= minRatio) return 'warning';
    return 'error';
  };

  const filteredStablecoins = stablecoins.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStablecoin = () => {
    const newStablecoin: Stablecoin = {
      id: `sc_${Date.now()}`,
      name: createForm.name,
      symbol: createForm.symbol,
      pegCurrency: createForm.pegCurrency,
      pegRatio: 1.0,
      currentPeg: 1.0,
      pegDeviation: 0,
      collateralType: createForm.collateralType,
      totalSupply: createForm.initialSupply,
      circulatingSupply: createForm.initialSupply,
      marketCap: createForm.initialSupply,
      collateralizationRatio: createForm.targetCollateralRatio,
      minCollateralRatio: createForm.minCollateralRatio,
      targetCollateralRatio: createForm.targetCollateralRatio,
      status: 'active',
      issuer: 'Current User',
      contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      deployedAt: new Date().toISOString(),
      lastAuditAt: '',
      auditor: '',
      holders: 0,
      dailyVolume: 0,
      reserves: [],
      attestations: [],
      fees: {
        mintFee: 10,
        burnFee: 10,
        transferFee: 0,
        stabilityFee: 0,
        liquidationPenalty: 500,
      },
      stabilityMechanism: {
        type: 'collateral',
        autoRebalance: true,
        circuitBreakerEnabled: true,
        circuitBreakerThreshold: 2.0,
        emergencyShutdown: false,
        lastRebalance: '',
        rebalanceFrequency: 'daily',
      },
    };
    setStablecoins([newStablecoin, ...stablecoins]);
    setCreateDialogOpen(false);
  };

  const renderOverviewTab = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AccountBalance sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5">{formatCurrency(stats.totalMarketCap)}</Typography>
              <Typography variant="caption" color="textSecondary">
                Total Market Cap
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <LocalAtm sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5">{formatCurrency(stats.totalSupply)}</Typography>
              <Typography variant="caption" color="textSecondary">
                Total Supply
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Shield sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5">{stats.avgCollateralRatio.toFixed(1)}%</Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Collateral Ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AccountBalanceWallet sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5">{stats.totalHolders.toLocaleString()}</Typography>
              <Typography variant="caption" color="textSecondary">
                Total Holders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <SwapHoriz sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h5">{formatCurrency(stats.dailyVolume)}</Typography>
              <Typography variant="caption" color="textSecondary">
                24h Volume
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5">{stats.activeStablecoins}</Typography>
              <Typography variant="caption" color="textSecondary">
                Active Stablecoins
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stablecoins Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Stablecoin</TableCell>
              <TableCell>Peg</TableCell>
              <TableCell>Collateral</TableCell>
              <TableCell align="right">Supply</TableCell>
              <TableCell align="right">Market Cap</TableCell>
              <TableCell>Collateral Ratio</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStablecoins.map((sc) => (
              <TableRow key={sc.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {sc.symbol[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {sc.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {sc.symbol}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      ${sc.currentPeg.toFixed(4)} / {sc.pegCurrency}
                    </Typography>
                    <Chip
                      label={`${sc.pegDeviation >= 0 ? '+' : ''}${sc.pegDeviation.toFixed(2)}%`}
                      size="small"
                      color={getPegStatusColor(sc.pegDeviation) as any}
                      icon={sc.pegDeviation >= 0 ? <TrendingUp /> : <TrendingDown />}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={sc.collateralType} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {sc.circulatingSupply.toLocaleString()} {sc.symbol}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(sc.marketCap)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(sc.collateralizationRatio, 120)}
                      sx={{ width: 60, height: 8, borderRadius: 4 }}
                      color={
                        getCollateralStatusColor(
                          sc.collateralizationRatio,
                          sc.minCollateralRatio
                        ) as any
                      }
                    />
                    <Typography variant="body2">{sc.collateralizationRatio.toFixed(1)}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={sc.status}
                    size="small"
                    color={getStatusColor(sc.status) as any}
                    icon={sc.status === 'active' ? <CheckCircle /> : <Warning />}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedStablecoin(sc);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Mint">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {
                        setSelectedStablecoin(sc);
                        setMintBurnType('mint');
                        setMintBurnDialogOpen(true);
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Burn">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedStablecoin(sc);
                        setMintBurnType('burn');
                        setMintBurnDialogOpen(true);
                      }}
                    >
                      <LocalAtm />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderProofOfReserveTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }} icon={<VerifiedUser />}>
        Proof of Reserve (PoR) provides real-time verification that all stablecoins are fully backed
        by their stated collateral assets.
      </Alert>

      <Grid container spacing={3}>
        {stablecoins.map((sc) => (
          <Grid item xs={12} key={sc.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{sc.symbol[0]}</Avatar>
                    <Box>
                      <Typography variant="h6">{sc.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last verified: {new Date(sc.lastAuditAt || sc.deployedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<VerifiedUser />}
                    label={`${sc.collateralizationRatio.toFixed(1)}% Backed`}
                    color={
                      getCollateralStatusColor(sc.collateralizationRatio, sc.minCollateralRatio) as any
                    }
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Reserve Composition
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Custodian</TableCell>
                        <TableCell align="right">Value (USD)</TableCell>
                        <TableCell align="right">%</TableCell>
                        <TableCell>Last Verified</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sc.reserves.map((reserve) => (
                        <TableRow key={reserve.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {reserve.assetName}
                              </Typography>
                              <Chip label={reserve.assetSymbol} size="small" variant="outlined" />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={reserve.assetType} size="small" />
                          </TableCell>
                          <TableCell>{reserve.custodian}</TableCell>
                          <TableCell align="right">{formatCurrency(reserve.valueUSD, false)}</TableCell>
                          <TableCell align="right">{reserve.percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Chip
                              icon={<CheckCircle />}
                              label={new Date(reserve.lastVerified).toLocaleDateString()}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" fontWeight="bold">
                            Total Reserves
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(sc.reserves.reduce((sum, r) => sum + r.valueUSD, 0), false)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">100%</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<Receipt />}>
                    View Full Report
                  </Button>
                  <Button size="small" startIcon={<Security />}>
                    On-Chain Proof
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAttestationsTab = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }} icon={<Gavel />}>
        Third-party attestations and audits ensure transparency and trust in our stablecoin reserves.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Stablecoin</TableCell>
              <TableCell>Auditor</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="right">Total Reserves</TableCell>
              <TableCell align="right">Collateral Ratio</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stablecoins.flatMap((sc) =>
              sc.attestations.map((att) => (
                <TableRow key={att.id}>
                  <TableCell>
                    <Chip label={sc.symbol} size="small" />
                  </TableCell>
                  <TableCell>{att.auditor}</TableCell>
                  <TableCell>
                    <Chip
                      label={att.type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      color={att.type === 'full_audit' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(att.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      icon={att.result === 'passed' ? <CheckCircle /> : <Warning />}
                      label={att.result.replace('_', ' ')}
                      size="small"
                      color={att.result === 'passed' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(att.totalReserves)}</TableCell>
                  <TableCell align="right">{att.collateralRatio.toFixed(2)}%</TableCell>
                  <TableCell>
                    {att.reportUrl && (
                      <Button size="small" startIcon={<Receipt />}>
                        Report
                      </Button>
                    )}
                    <Button size="small" startIcon={<Security />}>
                      Proof
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderOperationsTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Operations
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Collateral</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          <Chip
                            label={op.type}
                            size="small"
                            color={op.type === 'mint' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{op.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {op.collateralAmount.toLocaleString()} {op.collateralAsset}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={op.status}
                            size="small"
                            color={op.status === 'completed' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{new Date(op.timestamp).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stability Mechanisms
              </Typography>
              <List>
                {stablecoins.map((sc) => (
                  <ListItem key={sc.id}>
                    <ListItemIcon>
                      {sc.stabilityMechanism.circuitBreakerEnabled ? (
                        <Shield color="success" />
                      ) : (
                        <Shield color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={sc.symbol}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Type: {sc.stabilityMechanism.type}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Circuit Breaker: {sc.stabilityMechanism.circuitBreakerThreshold}% threshold
                          </Typography>
                          <Typography variant="caption" display="block">
                            Auto-rebalance: {sc.stabilityMechanism.autoRebalance ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={sc.stabilityMechanism.emergencyShutdown ? 'Emergency' : 'Normal'}
                      size="small"
                      color={sc.stabilityMechanism.emergencyShutdown ? 'error' : 'success'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Asset-Backed Stablecoins</Typography>
          <Typography variant="body2" color="textSecondary">
            Fully collateralized stablecoins with real-time Proof of Reserve
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search stablecoins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Create Stablecoin
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<PieChart />} label="Overview" />
            <Tab icon={<VerifiedUser />} label="Proof of Reserve" />
            <Tab icon={<Gavel />} label="Attestations" />
            <Tab icon={<Speed />} label="Operations" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderProofOfReserveTab()}
          {activeTab === 2 && renderAttestationsTab()}
          {activeTab === 3 && renderOperationsTab()}
        </CardContent>
      </Card>

      {/* Create Stablecoin Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Asset-Backed Stablecoin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stablecoin Name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={createForm.symbol}
                onChange={(e) => setCreateForm({ ...createForm, symbol: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Peg Currency</InputLabel>
                <Select
                  value={createForm.pegCurrency}
                  label="Peg Currency"
                  onChange={(e) => setCreateForm({ ...createForm, pegCurrency: e.target.value as PegCurrency })}
                >
                  <MenuItem value="USD">US Dollar (USD)</MenuItem>
                  <MenuItem value="EUR">Euro (EUR)</MenuItem>
                  <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                  <MenuItem value="JPY">Japanese Yen (JPY)</MenuItem>
                  <MenuItem value="CHF">Swiss Franc (CHF)</MenuItem>
                  <MenuItem value="SGD">Singapore Dollar (SGD)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Collateral Type</InputLabel>
                <Select
                  value={createForm.collateralType}
                  label="Collateral Type"
                  onChange={(e) => setCreateForm({ ...createForm, collateralType: e.target.value as CollateralType })}
                >
                  <MenuItem value="fiat">Fiat Currency</MenuItem>
                  <MenuItem value="crypto">Cryptocurrency</MenuItem>
                  <MenuItem value="commodity">Commodity (Gold, Silver)</MenuItem>
                  <MenuItem value="rwa">Real World Assets</MenuItem>
                  <MenuItem value="treasury">Treasury Securities</MenuItem>
                  <MenuItem value="mixed">Mixed Collateral</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Initial Supply"
                value={createForm.initialSupply}
                onChange={(e) => setCreateForm({ ...createForm, initialSupply: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Target Collateral Ratio: {createForm.targetCollateralRatio}%
              </Typography>
              <Slider
                value={createForm.targetCollateralRatio}
                onChange={(_, v) => setCreateForm({ ...createForm, targetCollateralRatio: v as number })}
                min={100}
                max={200}
                marks={[
                  { value: 100, label: '100%' },
                  { value: 150, label: '150%' },
                  { value: 200, label: '200%' },
                ]}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Minimum Collateral Ratio (Liquidation): {createForm.minCollateralRatio}%
              </Typography>
              <Slider
                value={createForm.minCollateralRatio}
                onChange={(_, v) => setCreateForm({ ...createForm, minCollateralRatio: v as number })}
                min={100}
                max={150}
                marks={[
                  { value: 100, label: '100%' },
                  { value: 110, label: '110%' },
                  { value: 150, label: '150%' },
                ]}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateStablecoin}
            disabled={!createForm.name || !createForm.symbol}
          >
            Create Stablecoin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mint/Burn Dialog */}
      <Dialog open={mintBurnDialogOpen} onClose={() => setMintBurnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mintBurnType === 'mint' ? 'Mint' : 'Burn'} {selectedStablecoin?.symbol}
        </DialogTitle>
        <DialogContent>
          {selectedStablecoin && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={mintBurnType === 'mint' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {mintBurnType === 'mint'
                  ? 'Deposit collateral to mint new stablecoins'
                  : 'Burn stablecoins to withdraw collateral'}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Amount to ${mintBurnType}`}
                    value={mintBurnForm.amount}
                    onChange={(e) => setMintBurnForm({ ...mintBurnForm, amount: parseInt(e.target.value) })}
                    InputProps={{
                      endAdornment: <Typography>{selectedStablecoin.symbol}</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Collateral Asset</InputLabel>
                    <Select
                      value={mintBurnForm.collateralAsset}
                      label="Collateral Asset"
                      onChange={(e) => setMintBurnForm({ ...mintBurnForm, collateralAsset: e.target.value })}
                    >
                      <MenuItem value="USD">US Dollar (USD)</MenuItem>
                      <MenuItem value="USDC">USD Coin (USDC)</MenuItem>
                      <MenuItem value="USDT">Tether (USDT)</MenuItem>
                      <MenuItem value="T-BILL">Treasury Bills</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Transaction Summary
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          {mintBurnType === 'mint' ? 'You deposit:' : 'You receive:'}
                        </Typography>
                        <Typography variant="body2">
                          {(mintBurnForm.amount * (selectedStablecoin.collateralizationRatio / 100)).toFixed(2)}{' '}
                          {mintBurnForm.collateralAsset}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Fee ({selectedStablecoin.fees.mintFee / 100}%):
                        </Typography>
                        <Typography variant="body2">
                          {(mintBurnForm.amount * (selectedStablecoin.fees.mintFee / 10000)).toFixed(2)}{' '}
                          {selectedStablecoin.symbol}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {mintBurnType === 'mint' ? 'You receive:' : 'You burn:'}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {mintBurnForm.amount.toLocaleString()} {selectedStablecoin.symbol}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMintBurnDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={mintBurnType === 'mint' ? 'success' : 'error'}
            disabled={mintBurnForm.amount <= 0}
          >
            {mintBurnType === 'mint' ? 'Mint Tokens' : 'Burn Tokens'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedStablecoin && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{selectedStablecoin.symbol[0]}</Avatar>
                {selectedStablecoin.name} ({selectedStablecoin.symbol})
                <Chip
                  label={selectedStablecoin.status}
                  color={getStatusColor(selectedStablecoin.status) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Peg Status
                      </Typography>
                      <Typography variant="h4">
                        ${selectedStablecoin.currentPeg.toFixed(4)}
                      </Typography>
                      <Chip
                        label={`${selectedStablecoin.pegDeviation >= 0 ? '+' : ''}${selectedStablecoin.pegDeviation.toFixed(2)}% deviation`}
                        color={getPegStatusColor(selectedStablecoin.pegDeviation) as any}
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Collateralization
                      </Typography>
                      <Typography variant="h4">
                        {selectedStablecoin.collateralizationRatio.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Min: {selectedStablecoin.minCollateralRatio}% | Target:{' '}
                        {selectedStablecoin.targetCollateralRatio}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Token Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Contract Address" secondary={selectedStablecoin.contractAddress} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Issuer" secondary={selectedStablecoin.issuer} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Deployed"
                        secondary={new Date(selectedStablecoin.deployedAt).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Audit"
                        secondary={
                          selectedStablecoin.lastAuditAt
                            ? `${new Date(selectedStablecoin.lastAuditAt).toLocaleDateString()} by ${selectedStablecoin.auditor}`
                            : 'Not audited'
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fee Structure
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Mint: ${selectedStablecoin.fees.mintFee / 100}%`} size="small" />
                    <Chip label={`Burn: ${selectedStablecoin.fees.burnFee / 100}%`} size="small" />
                    <Chip label={`Transfer: ${selectedStablecoin.fees.transferFee / 100}%`} size="small" />
                    <Chip
                      label={`Stability: ${selectedStablecoin.fees.stabilityFee}% APR`}
                      size="small"
                    />
                    <Chip
                      label={`Liquidation Penalty: ${selectedStablecoin.fees.liquidationPenalty / 100}%`}
                      size="small"
                      color="warning"
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AssetBackedStablecoin;
