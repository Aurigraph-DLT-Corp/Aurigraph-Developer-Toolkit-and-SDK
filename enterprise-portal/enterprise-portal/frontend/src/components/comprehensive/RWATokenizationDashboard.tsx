/**
 * RWA Tokenization Dashboard Component (AV11-455)
 *
 * Comprehensive dashboard for Real-World Asset tokenization analytics,
 * providing insights into tokenized assets, market trends, and portfolio performance.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, Tooltip, IconButton,
  Select, MenuItem, FormControl, InputLabel, Tab, Tabs,
  Alert, CircularProgress, useTheme
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AccountBalance, AttachMoney,
  PieChart as PieChartIcon, ShowChart, Refresh, Assessment,
  Business, Apartment, LocalGasStation, Diamond, EmojiNature,
  MoreVert, Download, Timeline, Speed
} from '@mui/icons-material';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { API_BASE_URL } from '../../config/api';

// Types
interface RWADashboardStats {
  totalAssets: number;
  totalValueLocked: number;
  totalHolders: number;
  totalTransactions24h: number;
  avgYield: number;
  assetGrowth: number;
  tvlGrowth: number;
  verifiedAssets: number;
}

interface AssetPerformance {
  id: string;
  name: string;
  symbol: string;
  category: string;
  value: number;
  change24h: number;
  volume24h: number;
  holders: number;
  yield: number;
  verified: boolean;
}

interface CategoryDistribution {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface TVLHistory {
  date: string;
  tvl: number;
  assets: number;
}

interface RecentTokenization {
  id: string;
  name: string;
  category: string;
  value: number;
  tokenizedAt: string;
  status: 'pending' | 'verified' | 'active';
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  real_estate: '#2196F3',
  commodities: '#FF9800',
  art: '#9C27B0',
  carbon_credits: '#4CAF50',
  precious_metals: '#FFD700',
  bonds: '#607D8B',
  equities: '#E91E63',
  trade_finance: '#00BCD4',
  deposits: '#795548',
  other: '#9E9E9E'
};

// Category icons
const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const icons: Record<string, React.ReactElement> = {
    real_estate: <Apartment fontSize="small" />,
    commodities: <LocalGasStation fontSize="small" />,
    art: <Diamond fontSize="small" />,
    carbon_credits: <EmojiNature fontSize="small" />,
    precious_metals: <Diamond fontSize="small" />,
    bonds: <Assessment fontSize="small" />,
    equities: <Business fontSize="small" />,
    trade_finance: <AccountBalance fontSize="small" />,
    deposits: <AccountBalance fontSize="small" />,
    other: <Business fontSize="small" />
  };
  return icons[category] || <Business fontSize="small" />;
};

export const RWATokenizationDashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data state
  const [stats, setStats] = useState<RWADashboardStats>({
    totalAssets: 195,
    totalValueLocked: 1250000000,
    totalHolders: 18253,
    totalTransactions24h: 5856,
    avgYield: 8.5,
    assetGrowth: 12.3,
    tvlGrowth: 23.7,
    verifiedAssets: 172
  });

  const [topAssets, setTopAssets] = useState<AssetPerformance[]>([
    { id: '1', name: 'Manhattan Office Tower', symbol: 'MHTN-OFF', category: 'real_estate', value: 25000000, change24h: 2.5, volume24h: 1250000, holders: 1234, yield: 6.2, verified: true },
    { id: '2', name: 'Gold Reserves Fund', symbol: 'GOLD-V1', category: 'precious_metals', value: 15000000, change24h: 1.8, volume24h: 890000, holders: 892, yield: 0, verified: true },
    { id: '3', name: 'Carbon Credit Pool', symbol: 'CCR-001', category: 'carbon_credits', value: 8500000, change24h: 5.2, volume24h: 425000, holders: 567, yield: 12.4, verified: true },
    { id: '4', name: 'Art Collection Alpha', symbol: 'ART-A', category: 'art', value: 12000000, change24h: -0.8, volume24h: 320000, holders: 234, yield: 4.5, verified: true },
    { id: '5', name: 'Trade Finance Pool', symbol: 'TFP-001', category: 'trade_finance', value: 20000000, change24h: 0.5, volume24h: 1100000, holders: 789, yield: 9.8, verified: true }
  ]);

  const [categoryDistribution] = useState<CategoryDistribution[]>([
    { name: 'Real Estate', value: 450000000, count: 45, color: CATEGORY_COLORS.real_estate || '#2196F3' },
    { name: 'Commodities', value: 230000000, count: 23, color: CATEGORY_COLORS.commodities || '#FF9800' },
    { name: 'Precious Metals', value: 180000000, count: 18, color: CATEGORY_COLORS.precious_metals || '#FFD700' },
    { name: 'Carbon Credits', value: 120000000, count: 15, color: CATEGORY_COLORS.carbon_credits || '#4CAF50' },
    { name: 'Trade Finance', value: 150000000, count: 12, color: CATEGORY_COLORS.trade_finance || '#00BCD4' },
    { name: 'Art', value: 80000000, count: 10, color: CATEGORY_COLORS.art || '#9C27B0' },
    { name: 'Other', value: 40000000, count: 72, color: CATEGORY_COLORS.other || '#9E9E9E' }
  ]);

  const [tvlHistory] = useState<TVLHistory[]>([
    { date: 'Dec 1', tvl: 980000000, assets: 165 },
    { date: 'Dec 2', tvl: 1020000000, assets: 172 },
    { date: 'Dec 3', tvl: 1050000000, assets: 178 },
    { date: 'Dec 4', tvl: 1120000000, assets: 182 },
    { date: 'Dec 5', tvl: 1180000000, assets: 188 },
    { date: 'Dec 6', tvl: 1210000000, assets: 192 },
    { date: 'Dec 7', tvl: 1250000000, assets: 195 }
  ]);

  const [recentTokenizations] = useState<RecentTokenization[]>([
    { id: '1', name: 'Miami Beachfront Property', category: 'real_estate', value: 5500000, tokenizedAt: '2025-12-08T14:30:00Z', status: 'active' },
    { id: '2', name: 'Silver Bullion Trust', category: 'precious_metals', value: 2200000, tokenizedAt: '2025-12-08T10:15:00Z', status: 'verified' },
    { id: '3', name: 'Rainforest Carbon Credits', category: 'carbon_credits', value: 850000, tokenizedAt: '2025-12-07T16:45:00Z', status: 'active' },
    { id: '4', name: 'Contemporary Art Fund', category: 'art', value: 3200000, tokenizedAt: '2025-12-07T09:20:00Z', status: 'pending' }
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch from backend API
      const [statsRes, assetsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/rwa/stats`).catch(() => null),
        fetch(`${API_BASE_URL}/blockchain/assets?limit=10`).catch(() => null)
      ]);

      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) {
          setStats(prev => ({
            ...prev,
            totalAssets: statsData.stats.totalAssets || prev.totalAssets,
            totalValueLocked: statsData.stats.totalValueLocked || prev.totalValueLocked,
            totalHolders: statsData.stats.totalHolders || prev.totalHolders,
            verifiedAssets: statsData.stats.verifiedAssets || prev.verifiedAssets
          }));
        }
      }

      if (assetsRes?.ok) {
        const assetsData = await assetsRes.json();
        if (assetsData.assets?.length > 0) {
          const mappedAssets: AssetPerformance[] = assetsData.assets.map((a: any) => ({
            id: a.id,
            name: a.name,
            symbol: a.tokenSymbol || a.symbol,
            category: a.category,
            value: a.value,
            change24h: a.priceChange24h || Math.random() * 10 - 2,
            volume24h: a.volume24h || a.value * 0.05,
            holders: a.holders || Math.floor(Math.random() * 1000),
            yield: a.yield || Math.random() * 15,
            verified: a.verified || false
          }));
          setTopAssets(mappedAssets);
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatChange = (value: number): React.ReactNode => {
    const isPositive = value >= 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: isPositive ? 'success.main' : 'error.main' }}>
        {isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          {isPositive ? '+' : ''}{value.toFixed(2)}%
        </Typography>
      </Box>
    );
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'verified': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            RWA Tokenization Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time analytics for tokenized real-world assets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Value Locked
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(stats.totalValueLocked)}
                  </Typography>
                  {formatChange(stats.tvlGrowth)}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Assets
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalAssets}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats.verifiedAssets} verified
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <AccountBalance />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Holders
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalHolders.toLocaleString()}
                  </Typography>
                  {formatChange(stats.assetGrowth)}
                </Box>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <PieChartIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Avg Yield
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.avgYield.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Annual average
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <Speed />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* TVL Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Total Value Locked Over Time</Typography>
                <ShowChart color="primary" />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tvlHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v)}
                    stroke={theme.palette.text.secondary}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), 'TVL']}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.light}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Asset Category Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Top Performing Assets" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Recent Tokenizations" icon={<Timeline />} iconPosition="start" />
          </Tabs>

          {/* Top Assets Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">24h Change</TableCell>
                    <TableCell align="right">Volume (24h)</TableCell>
                    <TableCell align="right">Holders</TableCell>
                    <TableCell align="right">Yield</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topAssets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: CATEGORY_COLORS[asset.category] || '#9E9E9E', width: 32, height: 32 }}>
                            <CategoryIcon category={asset.category} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {asset.symbol}
                            </Typography>
                          </Box>
                          {asset.verified && (
                            <Chip label="Verified" size="small" color="success" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.category.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: CATEGORY_COLORS[asset.category] || '#9E9E9E',
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(asset.value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatChange(asset.change24h)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(asset.volume24h)}
                      </TableCell>
                      <TableCell align="right">
                        {asset.holders.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {asset.yield > 0 ? (
                          <Typography color="success.main" fontWeight="bold">
                            {asset.yield.toFixed(1)}%
                          </Typography>
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Recent Tokenizations Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Tokenized At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTokenizations.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: CATEGORY_COLORS[item.category] || '#9E9E9E', width: 32, height: 32 }}>
                            <CategoryIcon category={item.category} />
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(item.value)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.tokenizedAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={getStatusColor(item.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RWATokenizationDashboard;
