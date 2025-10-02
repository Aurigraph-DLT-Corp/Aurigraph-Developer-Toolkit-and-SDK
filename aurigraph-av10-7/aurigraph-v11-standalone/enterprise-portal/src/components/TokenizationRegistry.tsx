import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, CardMedia, Typography, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Paper, Stepper, Step,
  StepLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, FormControl, InputLabel, Select, MenuItem, Badge, Tooltip, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, LinearProgress,
  Switch, FormControlLabel, Slider, InputAdornment, CircularProgress, Divider,
  ToggleButton, ToggleButtonGroup, Stack, AvatarGroup, Rating
} from '@mui/material';
import {
  Token, AccountBalance, Inventory, LocalOffer, TrendingUp, ShowChart, AttachMoney,
  Diamond, Home, DirectionsCar, Agriculture, Palette, MusicNote, Sports, HealthAndSafety,
  Business, Gavel, VerifiedUser, Lock, Public, Speed, Analytics, SwapHoriz, Store,
  Savings, Receipt, QrCode2, Share, Download, Upload, FilterList, Search, Add
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import ChannelService from '../services/ChannelService';

// Token Types and Interfaces
interface Token {
  id: string;
  name: string;
  symbol: string;
  type: 'fungible' | 'non-fungible' | 'semi-fungible' | 'rwa';
  standard: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'AURIGRAPH-RWA' | 'CUSTOM';
  channelId: string;
  contractAddress?: string;
  totalSupply: number;
  decimals?: number;
  price?: number;
  marketCap?: number;
  holders: number;
  transfers24h: number;
  volume24h: number;
  priceChange24h?: number;
  metadata: TokenMetadata;
  features: TokenFeatures;
  compliance?: ComplianceInfo;
  assetBacking?: AssetBacking;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'paused' | 'pending' | 'deprecated';
}

interface TokenMetadata {
  description: string;
  image?: string;
  website?: string;
  whitepaper?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tags: string[];
  category: string;
}

interface TokenFeatures {
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  upgradeable: boolean;
  governance: boolean;
  staking: boolean;
  dividends: boolean;
  voting: boolean;
  wrapped: boolean;
  collateralized: boolean;
}

interface ComplianceInfo {
  kycRequired: boolean;
  amlCompliant: boolean;
  accreditedOnly: boolean;
  jurisdictions: string[];
  licenses: string[];
}

interface AssetBacking {
  type: 'real-estate' | 'commodity' | 'equity' | 'debt' | 'art' | 'intellectual-property' | 'carbon-credits';
  description: string;
  valuation: number;
  verifier: string;
  documents: string[];
  lastAudit: Date;
}

// Real World Asset Categories
const rwaCategories = [
  { id: 'real-estate', name: 'Real Estate', icon: Home, color: '#4CAF50' },
  { id: 'commodity', name: 'Commodities', icon: Agriculture, color: '#FF9800' },
  { id: 'equity', name: 'Equity', icon: Business, color: '#2196F3' },
  { id: 'art', name: 'Art & Collectibles', icon: Palette, color: '#9C27B0' },
  { id: 'carbon', name: 'Carbon Credits', icon: HealthAndSafety, color: '#00BCD4' },
  { id: 'ip', name: 'Intellectual Property', icon: Gavel, color: '#FF5722' },
  { id: 'vehicle', name: 'Vehicles', icon: DirectionsCar, color: '#795548' },
  { id: 'music', name: 'Music Rights', icon: MusicNote, color: '#E91E63' }
];

// Token Creation Wizard Steps
const wizardSteps = ['Basic Info', 'Token Economics', 'Features', 'Compliance', 'Review & Deploy'];

const TokenizationRegistry: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [isDeploying, setIsDeploying] = useState(false);

  // Token creation form
  const [newToken, setNewToken] = useState({
    name: '',
    symbol: '',
    type: 'fungible' as const,
    standard: 'ERC-20' as const,
    channelId: '',
    totalSupply: 1000000,
    decimals: 18,
    price: 1,
    description: '',
    category: '',
    features: {
      mintable: false,
      burnable: true,
      pausable: false,
      upgradeable: false,
      governance: false,
      staking: false,
      dividends: false,
      voting: false,
      wrapped: false,
      collateralized: false
    },
    compliance: {
      kycRequired: false,
      amlCompliant: true,
      accreditedOnly: false,
      jurisdictions: [],
      licenses: []
    },
    assetBacking: null as AssetBacking | null
  });

  // Market statistics
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    total24hVolume: 0,
    totalTokens: 0,
    activeTokens: 0,
    totalHolders: 0,
    totalTransfers: 0
  });

  useEffect(() => {
    loadSampleTokens();
    calculateMarketStats();
  }, []);

  const loadSampleTokens = () => {
    const sampleTokens: Token[] = [
      {
        id: 'token_001',
        name: 'Aurigraph Token',
        symbol: 'AUR',
        type: 'fungible',
        standard: 'ERC-20',
        channelId: 'main',
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        totalSupply: 100000000,
        decimals: 18,
        price: 2.45,
        marketCap: 245000000,
        holders: 15234,
        transfers24h: 8921,
        volume24h: 5234567,
        priceChange24h: 5.67,
        metadata: {
          description: 'The native utility token of Aurigraph DLT platform',
          image: '/aurigraph-token.png',
          website: 'https://aurigraph.io',
          tags: ['utility', 'governance', 'staking'],
          category: 'Platform'
        },
        features: {
          mintable: false,
          burnable: true,
          pausable: false,
          upgradeable: false,
          governance: true,
          staking: true,
          dividends: false,
          voting: true,
          wrapped: false,
          collateralized: false
        },
        createdAt: new Date('2024-01-01'),
        createdBy: '0xFounder...',
        status: 'active'
      },
      {
        id: 'token_002',
        name: 'Manhattan Tower REIT',
        symbol: 'MTR',
        type: 'rwa',
        standard: 'AURIGRAPH-RWA',
        channelId: 'private-1',
        contractAddress: '0x8f3Cf7ad124309F4e9B8d12D8B5C70E7Cf58fC14',
        totalSupply: 10000,
        decimals: 0,
        price: 1000,
        marketCap: 10000000,
        holders: 234,
        transfers24h: 12,
        volume24h: 125000,
        priceChange24h: 0.25,
        metadata: {
          description: 'Tokenized commercial real estate in Manhattan',
          image: '/manhattan-tower.jpg',
          tags: ['real-estate', 'commercial', 'reit'],
          category: 'Real Estate'
        },
        features: {
          mintable: false,
          burnable: false,
          pausable: true,
          upgradeable: false,
          governance: true,
          staking: false,
          dividends: true,
          voting: true,
          wrapped: false,
          collateralized: true
        },
        compliance: {
          kycRequired: true,
          amlCompliant: true,
          accreditedOnly: true,
          jurisdictions: ['US', 'EU'],
          licenses: ['SEC-REG-D']
        },
        assetBacking: {
          type: 'real-estate',
          description: '50,000 sq ft Grade A office building in Manhattan Financial District',
          valuation: 10000000,
          verifier: 'KPMG Real Estate Valuations',
          documents: ['deed.pdf', 'valuation-report.pdf', 'insurance.pdf'],
          lastAudit: new Date('2024-03-01')
        },
        createdAt: new Date('2024-02-15'),
        createdBy: '0xRealEstate...',
        status: 'active'
      },
      {
        id: 'token_003',
        name: 'Gold Vault Token',
        symbol: 'GVT',
        type: 'rwa',
        standard: 'AURIGRAPH-RWA',
        channelId: 'main',
        contractAddress: '0x123abc...',
        totalSupply: 100000,
        decimals: 6,
        price: 65.43,
        marketCap: 6543000,
        holders: 892,
        transfers24h: 234,
        volume24h: 523400,
        priceChange24h: -0.89,
        metadata: {
          description: 'Each token represents 1 gram of 99.99% pure gold stored in Swiss vaults',
          image: '/gold-token.png',
          tags: ['commodity', 'gold', 'precious-metals'],
          category: 'Commodities'
        },
        features: {
          mintable: true,
          burnable: true,
          pausable: false,
          upgradeable: false,
          governance: false,
          staking: false,
          dividends: false,
          voting: false,
          wrapped: false,
          collateralized: true
        },
        compliance: {
          kycRequired: true,
          amlCompliant: true,
          accreditedOnly: false,
          jurisdictions: ['Global'],
          licenses: ['LBMA-CERTIFIED']
        },
        assetBacking: {
          type: 'commodity',
          description: '100kg gold bars stored in Zurich Free Port',
          valuation: 6543000,
          verifier: 'SGS Inspection Services',
          documents: ['storage-cert.pdf', 'insurance.pdf', 'audit.pdf'],
          lastAudit: new Date('2024-03-15')
        },
        createdAt: new Date('2024-01-20'),
        createdBy: '0xGoldVault...',
        status: 'active'
      },
      {
        id: 'token_004',
        name: 'Digital Art Gallery',
        symbol: 'DAG',
        type: 'non-fungible',
        standard: 'ERC-721',
        channelId: 'main',
        totalSupply: 500,
        price: 250,
        marketCap: 125000,
        holders: 423,
        transfers24h: 67,
        volume24h: 23450,
        priceChange24h: 12.34,
        metadata: {
          description: 'Curated collection of digital artworks by renowned artists',
          image: '/art-gallery.png',
          tags: ['nft', 'art', 'collectibles'],
          category: 'Art'
        },
        features: {
          mintable: true,
          burnable: false,
          pausable: false,
          upgradeable: false,
          governance: false,
          staking: false,
          dividends: false,
          voting: false,
          wrapped: false,
          collateralized: false
        },
        createdAt: new Date('2024-03-01'),
        createdBy: '0xArtist...',
        status: 'active'
      },
      {
        id: 'token_005',
        name: 'Carbon Offset Credits',
        symbol: 'COC',
        type: 'semi-fungible',
        standard: 'ERC-1155',
        channelId: 'consortium-1',
        totalSupply: 1000000,
        decimals: 2,
        price: 15.75,
        marketCap: 15750000,
        holders: 3421,
        transfers24h: 1234,
        volume24h: 234567,
        priceChange24h: 3.21,
        metadata: {
          description: 'Verified carbon offset credits from renewable energy projects',
          image: '/carbon-credits.png',
          tags: ['carbon', 'sustainability', 'green'],
          category: 'Carbon Credits'
        },
        features: {
          mintable: true,
          burnable: true,
          pausable: false,
          upgradeable: false,
          governance: false,
          staking: false,
          dividends: false,
          voting: false,
          wrapped: false,
          collateralized: false
        },
        compliance: {
          kycRequired: false,
          amlCompliant: true,
          accreditedOnly: false,
          jurisdictions: ['Global'],
          licenses: ['VERRA-VERIFIED']
        },
        assetBacking: {
          type: 'carbon-credits',
          description: 'Verified Carbon Units from wind farm projects',
          valuation: 15750000,
          verifier: 'Verra Registry',
          documents: ['vcu-certificate.pdf', 'project-report.pdf'],
          lastAudit: new Date('2024-02-28')
        },
        createdAt: new Date('2024-02-01'),
        createdBy: '0xGreenEnergy...',
        status: 'active'
      }
    ];
    setTokens(sampleTokens);
  };

  const calculateMarketStats = () => {
    const stats = tokens.reduce((acc, token) => ({
      totalMarketCap: acc.totalMarketCap + (token.marketCap || 0),
      total24hVolume: acc.total24hVolume + (token.volume24h || 0),
      totalTokens: acc.totalTokens + 1,
      activeTokens: acc.activeTokens + (token.status === 'active' ? 1 : 0),
      totalHolders: acc.totalHolders + token.holders,
      totalTransfers: acc.totalTransfers + token.transfers24h
    }), {
      totalMarketCap: 0,
      total24hVolume: 0,
      totalTokens: 0,
      activeTokens: 0,
      totalHolders: 0,
      totalTransfers: 0
    });
    setMarketStats(stats);
  };

  const handleCreateToken = async () => {
    setIsDeploying(true);

    // Simulate token deployment
    setTimeout(() => {
      const token: Token = {
        id: `token_${Date.now()}`,
        name: newToken.name,
        symbol: newToken.symbol,
        type: newToken.type,
        standard: newToken.standard,
        channelId: newToken.channelId,
        contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        totalSupply: newToken.totalSupply,
        decimals: newToken.decimals,
        price: newToken.price,
        marketCap: newToken.totalSupply * newToken.price,
        holders: 0,
        transfers24h: 0,
        volume24h: 0,
        priceChange24h: 0,
        metadata: {
          description: newToken.description,
          tags: [],
          category: newToken.category
        },
        features: newToken.features,
        compliance: newToken.compliance,
        assetBacking: newToken.assetBacking,
        createdAt: new Date(),
        createdBy: '0xCurrentUser...',
        status: 'pending'
      };

      setTokens(prev => [token, ...prev]);
      setIsDeploying(false);
      setCreateDialogOpen(false);
      setWizardStep(0);

      // Simulate activation
      setTimeout(() => {
        setTokens(prev => prev.map(t =>
          t.id === token.id ? { ...t, status: 'active' } : t
        ));
      }, 3000);
    }, 2000);
  };

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || token.type === filterType;
    return matchesSearch && matchesType;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    switch (sortBy) {
      case 'marketCap':
        return (b.marketCap || 0) - (a.marketCap || 0);
      case 'volume':
        return (b.volume24h || 0) - (a.volume24h || 0);
      case 'holders':
        return b.holders - a.holders;
      case 'price':
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  const channels = ChannelService.getAllChannels();

  const chartData = tokens.map(t => ({
    name: t.symbol,
    value: t.marketCap || 0,
    holders: t.holders,
    volume: t.volume24h || 0
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Tokenization Registry
          <Chip label="Release 3.1" color="primary" size="small" sx={{ ml: 2 }} />
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Create Token
        </Button>
      </Box>

      {/* Market Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">Total Market Cap</Typography>
              <Typography variant="h6">${(marketStats.totalMarketCap / 1000000).toFixed(2)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">24h Volume</Typography>
              <Typography variant="h6">${(marketStats.total24hVolume / 1000000).toFixed(2)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">Total Tokens</Typography>
              <Typography variant="h6">{marketStats.totalTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">Active Tokens</Typography>
              <Typography variant="h6">{marketStats.activeTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">Total Holders</Typography>
              <Typography variant="h6">{marketStats.totalHolders.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">24h Transfers</Typography>
              <Typography variant="h6">{marketStats.totalTransfers.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="fungible">Fungible</MenuItem>
              <MenuItem value="non-fungible">Non-Fungible</MenuItem>
              <MenuItem value="semi-fungible">Semi-Fungible</MenuItem>
              <MenuItem value="rwa">Real World Assets</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="marketCap">Market Cap</MenuItem>
              <MenuItem value="volume">24h Volume</MenuItem>
              <MenuItem value="holders">Holders</MenuItem>
              <MenuItem value="price">Price</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
            <ToggleButton value="grid">Grid</ToggleButton>
            <ToggleButton value="list">List</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="All Tokens" />
        <Tab label="Real World Assets" />
        <Tab label="Market Analysis" />
        <Tab label="Categories" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {sortedTokens.map(token => (
              <Grid item xs={12} md={4} key={token.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {token.type === 'rwa' ? <Home /> : <Token />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{token.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{token.symbol}</Typography>
                      </Box>
                      <Chip
                        label={token.status}
                        size="small"
                        color={token.status === 'active' ? 'success' : 'warning'}
                      />
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Price</Typography>
                        <Typography variant="body2">${token.price?.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">24h Change</Typography>
                        <Typography
                          variant="body2"
                          color={(token.priceChange24h || 0) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {(token.priceChange24h || 0) >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Market Cap</Typography>
                        <Typography variant="body2">${((token.marketCap || 0) / 1000000).toFixed(2)}M</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Holders</Typography>
                        <Typography variant="body2">{token.holders.toLocaleString()}</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip label={token.type} size="small" variant="outlined" />
                      <Chip label={token.standard} size="small" variant="outlined" />
                      {token.features.governance && <Chip label="Governance" size="small" />}
                      {token.features.staking && <Chip label="Staking" size="small" />}
                      {token.compliance?.kycRequired && <Chip label="KYC" size="small" color="warning" />}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => setSelectedToken(token)}>Details</Button>
                      <Button size="small" startIcon={<SwapHoriz />}>Trade</Button>
                      <Button size="small" startIcon={<Analytics />}>Analytics</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>24h Change</TableCell>
                  <TableCell>Market Cap</TableCell>
                  <TableCell>Volume (24h)</TableCell>
                  <TableCell>Holders</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTokens.map(token => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {token.type === 'rwa' ? <Home /> : <Token />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{token.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{token.symbol}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={token.type} size="small" />
                    </TableCell>
                    <TableCell>${token.price?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography color={(token.priceChange24h || 0) >= 0 ? 'success.main' : 'error.main'}>
                        {(token.priceChange24h || 0) >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell>${((token.marketCap || 0) / 1000000).toFixed(2)}M</TableCell>
                    <TableCell>${((token.volume24h || 0) / 1000).toFixed(0)}K</TableCell>
                    <TableCell>{token.holders.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={token.status}
                        size="small"
                        color={token.status === 'active' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => setSelectedToken(token)}>
                        <Analytics />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {sortedTokens.filter(t => t.type === 'rwa').map(token => (
            <Grid item xs={12} md={6} key={token.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 56, height: 56 }}>
                      {rwaCategories.find(c => c.id === token.assetBacking?.type)?.icon &&
                        React.createElement(rwaCategories.find(c => c.id === token.assetBacking?.type)!.icon)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{token.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{token.symbol}</Typography>
                    </Box>
                    {token.compliance?.kycRequired && (
                      <Chip label="KYC Required" color="warning" size="small" />
                    )}
                  </Box>

                  {token.assetBacking && (
                    <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Asset Backing</Typography>
                      <Typography variant="body2">{token.assetBacking.description}</Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        <Typography variant="caption">
                          Valuation: ${(token.assetBacking.valuation / 1000000).toFixed(2)}M
                        </Typography>
                        <Typography variant="caption">
                          Verifier: {token.assetBacking.verifier}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Last Audit: {token.assetBacking.lastAudit.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Total Supply</Typography>
                      <Typography variant="body2">{token.totalSupply.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Price per Token</Typography>
                      <Typography variant="body2">${token.price?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Market Cap</Typography>
                      <Typography variant="body2">${((token.marketCap || 0) / 1000000).toFixed(2)}M</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Holders</Typography>
                      <Typography variant="body2">{token.holders}</Typography>
                    </Grid>
                  </Grid>

                  {token.features.dividends && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This token pays dividends to holders
                    </Alert>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small">Invest</Button>
                    <Button variant="outlined" size="small">View Documents</Button>
                    <Button variant="outlined" size="small">Audit Report</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Market Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Performers (24h)</Typography>
                <List>
                  {sortedTokens
                    .sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
                    .slice(0, 5)
                    .map(token => (
                      <ListItem key={token.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <TrendingUp />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={token.symbol}
                          secondary={token.name}
                        />
                        <Typography color="success.main">
                          +{token.priceChange24h?.toFixed(2)}%
                        </Typography>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Volume Trends</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="volume" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {rwaCategories.map(category => {
            const categoryTokens = tokens.filter(t =>
              t.assetBacking?.type === category.id ||
              t.metadata.category === category.name
            );
            return (
              <Grid item xs={12} md={3} key={category.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: category.color, mr: 2 }}>
                        {React.createElement(category.icon)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {categoryTokens.length} tokens
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h5">
                      ${(categoryTokens.reduce((sum, t) => sum + (t.marketCap || 0), 0) / 1000000).toFixed(2)}M
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Total Market Cap</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(categoryTokens.length / tokens.length) * 100}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Token Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Token</DialogTitle>
        <DialogContent>
          <Stepper activeStep={wizardStep} sx={{ mb: 3 }}>
            {wizardSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {wizardStep === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Token Name"
                value={newToken.name}
                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Token Symbol"
                value={newToken.symbol}
                onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value.toUpperCase() })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Token Type</InputLabel>
                <Select
                  value={newToken.type}
                  onChange={(e) => setNewToken({ ...newToken, type: e.target.value as any })}
                >
                  <MenuItem value="fungible">Fungible (ERC-20)</MenuItem>
                  <MenuItem value="non-fungible">Non-Fungible (ERC-721)</MenuItem>
                  <MenuItem value="semi-fungible">Semi-Fungible (ERC-1155)</MenuItem>
                  <MenuItem value="rwa">Real World Asset</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Channel</InputLabel>
                <Select
                  value={newToken.channelId}
                  onChange={(e) => setNewToken({ ...newToken, channelId: e.target.value })}
                >
                  {channels.map(ch => (
                    <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newToken.description}
                onChange={(e) => setNewToken({ ...newToken, description: e.target.value })}
                margin="normal"
              />
            </Box>
          )}

          {wizardStep === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={newToken.totalSupply}
                onChange={(e) => setNewToken({ ...newToken, totalSupply: parseInt(e.target.value) })}
                margin="normal"
              />
              {newToken.type === 'fungible' && (
                <TextField
                  fullWidth
                  label="Decimals"
                  type="number"
                  value={newToken.decimals}
                  onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                  margin="normal"
                />
              )}
              <TextField
                fullWidth
                label="Initial Price (USD)"
                type="number"
                value={newToken.price}
                onChange={(e) => setNewToken({ ...newToken, price: parseFloat(e.target.value) })}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Estimated Market Cap: ${(newToken.totalSupply * newToken.price).toLocaleString()}
              </Typography>
            </Box>
          )}

          {wizardStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Token Features</Typography>
              <Grid container spacing={2}>
                {Object.entries(newToken.features).map(([key, value]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={value}
                          onChange={(e) => setNewToken({
                            ...newToken,
                            features: { ...newToken.features, [key]: e.target.checked }
                          })}
                        />
                      }
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {wizardStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Compliance Settings</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={newToken.compliance.kycRequired}
                    onChange={(e) => setNewToken({
                      ...newToken,
                      compliance: { ...newToken.compliance, kycRequired: e.target.checked }
                    })}
                  />
                }
                label="KYC Required"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newToken.compliance.accreditedOnly}
                    onChange={(e) => setNewToken({
                      ...newToken,
                      compliance: { ...newToken.compliance, accreditedOnly: e.target.checked }
                    })}
                  />
                }
                label="Accredited Investors Only"
              />
              {newToken.type === 'rwa' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Real World Asset tokens require additional verification and documentation
                </Alert>
              )}
            </Box>
          )}

          {wizardStep === 4 && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Review your token configuration before deployment
              </Alert>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>{newToken.name} ({newToken.symbol})</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Typography>{newToken.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Supply</Typography>
                    <Typography>{newToken.totalSupply.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Initial Price</Typography>
                    <Typography>${newToken.price}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Market Cap</Typography>
                    <Typography>${(newToken.totalSupply * newToken.price).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          {wizardStep > 0 && (
            <Button onClick={() => setWizardStep(prev => prev - 1)}>Back</Button>
          )}
          {wizardStep < wizardSteps.length - 1 ? (
            <Button variant="contained" onClick={() => setWizardStep(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateToken}
              disabled={isDeploying}
              startIcon={isDeploying ? <CircularProgress size={20} /> : <Upload />}
            >
              {isDeploying ? 'Deploying...' : 'Deploy Token'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Token Details Dialog */}
      {selectedToken && (
        <Dialog
          open={Boolean(selectedToken)}
          onClose={() => setSelectedToken(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {selectedToken.type === 'rwa' ? <Home /> : <Token />}
              </Avatar>
              {selectedToken.name} ({selectedToken.symbol})
              <Box sx={{ flexGrow: 1 }} />
              <Chip label={selectedToken.type} sx={{ mr: 1 }} />
              <Chip label={selectedToken.standard} />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Token Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Contract Address</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedToken.contractAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Created By</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedToken.createdBy}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Created At</Typography>
                    <Typography variant="body2">
                      {selectedToken.createdAt.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Channel</Typography>
                    <Typography variant="body2">
                      {channels.find(c => c.id === selectedToken.channelId)?.name}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedToken.assetBacking && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Asset Backing</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2">{selectedToken.assetBacking.description}</Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Type</Typography>
                          <Typography>{selectedToken.assetBacking.type}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Valuation</Typography>
                          <Typography>${selectedToken.assetBacking.valuation.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Verifier</Typography>
                          <Typography>{selectedToken.assetBacking.verifier}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Market Data</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Price" secondary={`$${selectedToken.price?.toFixed(2)}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Market Cap" secondary={`$${selectedToken.marketCap?.toLocaleString()}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="24h Volume" secondary={`$${selectedToken.volume24h?.toLocaleString()}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Holders" secondary={selectedToken.holders.toLocaleString()} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedToken(null)}>Close</Button>
            <Button variant="contained" startIcon={<SwapHoriz />}>Trade</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default TokenizationRegistry;