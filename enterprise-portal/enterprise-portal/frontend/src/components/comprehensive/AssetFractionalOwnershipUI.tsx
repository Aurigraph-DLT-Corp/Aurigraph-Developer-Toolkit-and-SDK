/**
 * Asset Fractional Ownership UI Component (AV11-455)
 *
 * Enables users to view, manage, and trade fractional ownership shares
 * of tokenized real-world assets.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, LinearProgress, Tooltip, IconButton, Divider, Alert,
  Tab, Tabs, Slider, InputAdornment, List, ListItem, ListItemText,
  ListItemAvatar, CircularProgress, Stepper, Step, StepLabel,
  FormControlLabel, Checkbox
} from '@mui/material';
import {
  PieChart as PieChartIcon, ShoppingCart, TrendingUp, TrendingDown,
  AccountBalance, AttachMoney, Share, Visibility, SwapHoriz,
  History, VerifiedUser, Warning, Check, LocalOffer, Gavel,
  AccessTime, Person, Business, Receipt, Info
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { API_BASE_URL } from '../../config/api';

// Types
interface FractionalAsset {
  id: string;
  name: string;
  symbol: string;
  category: string;
  totalValue: number;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  yourShares: number;
  yourValue: number;
  yourPercentage: number;
  change24h: number;
  yield: number;
  verified: boolean;
  custodian: string;
  minInvestment: number;
  lockupPeriod: number;
  dividendFrequency: string;
  nextDividendDate: string;
  status: 'active' | 'pending' | 'locked';
}

interface ShareOrder {
  id: string;
  assetId: string;
  assetName: string;
  type: 'buy' | 'sell';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

interface OwnershipDistribution {
  name: string;
  value: number;
  shares: number;
  color: string;
}

// Colors
const OWNERSHIP_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

export const AssetFractionalOwnershipUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<FractionalAsset | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [shareAmount, setShareAmount] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Mock data
  const [assets, setAssets] = useState<FractionalAsset[]>([
    {
      id: '1',
      name: 'Manhattan Office Tower',
      symbol: 'MHTN-OFF',
      category: 'real_estate',
      totalValue: 25000000,
      totalShares: 1000000,
      availableShares: 450000,
      pricePerShare: 25,
      yourShares: 5000,
      yourValue: 125000,
      yourPercentage: 0.5,
      change24h: 2.5,
      yield: 6.2,
      verified: true,
      custodian: 'JP Morgan Trust',
      minInvestment: 100,
      lockupPeriod: 12,
      dividendFrequency: 'Quarterly',
      nextDividendDate: '2025-03-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Gold Reserves Fund',
      symbol: 'GOLD-V1',
      category: 'precious_metals',
      totalValue: 15000000,
      totalShares: 7500,
      availableShares: 2500,
      pricePerShare: 2000,
      yourShares: 10,
      yourValue: 20000,
      yourPercentage: 0.13,
      change24h: 1.8,
      yield: 0,
      verified: true,
      custodian: 'Swiss Vault Services AG',
      minInvestment: 2000,
      lockupPeriod: 6,
      dividendFrequency: 'None',
      nextDividendDate: '-',
      status: 'active'
    },
    {
      id: '3',
      name: 'Carbon Credit Pool',
      symbol: 'CCR-001',
      category: 'carbon_credits',
      totalValue: 8500000,
      totalShares: 85000,
      availableShares: 35000,
      pricePerShare: 100,
      yourShares: 250,
      yourValue: 25000,
      yourPercentage: 0.29,
      change24h: 5.2,
      yield: 12.4,
      verified: true,
      custodian: 'Verra Carbon Registry',
      minInvestment: 100,
      lockupPeriod: 0,
      dividendFrequency: 'Annual',
      nextDividendDate: '2025-12-31',
      status: 'active'
    }
  ]);

  const [orders, setOrders] = useState<ShareOrder[]>([
    { id: 'o1', assetId: '1', assetName: 'Manhattan Office Tower', type: 'buy', shares: 100, pricePerShare: 25, totalAmount: 2500, status: 'completed', createdAt: '2025-12-07T10:00:00Z' },
    { id: 'o2', assetId: '3', assetName: 'Carbon Credit Pool', type: 'buy', shares: 50, pricePerShare: 100, totalAmount: 5000, status: 'completed', createdAt: '2025-12-06T14:30:00Z' },
    { id: 'o3', assetId: '2', assetName: 'Gold Reserves Fund', type: 'buy', shares: 5, pricePerShare: 2000, totalAmount: 10000, status: 'pending', createdAt: '2025-12-08T09:15:00Z' }
  ]);

  // Portfolio distribution
  const portfolioDistribution: OwnershipDistribution[] = assets.map((asset, idx) => ({
    name: asset.symbol,
    value: asset.yourValue,
    shares: asset.yourShares,
    color: OWNERSHIP_COLORS[idx % OWNERSHIP_COLORS.length]
  }));

  const totalPortfolioValue = assets.reduce((sum, a) => sum + a.yourValue, 0);
  const totalShares = assets.reduce((sum, a) => sum + a.yourShares, 0);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/assets`);
      if (response.ok) {
        const data = await response.json();
        if (data.assets?.length > 0) {
          const mappedAssets: FractionalAsset[] = data.assets.slice(0, 5).map((a: any, idx: number) => ({
            id: a.id,
            name: a.name,
            symbol: a.tokenSymbol || a.symbol || `TKN-${idx}`,
            category: a.category,
            totalValue: a.value,
            totalShares: a.totalShares || 100000,
            availableShares: a.availableShares || 50000,
            pricePerShare: a.pricePerShare || (a.value / (a.totalShares || 100000)),
            yourShares: Math.floor(Math.random() * 1000),
            yourValue: 0,
            yourPercentage: 0,
            change24h: Math.random() * 10 - 2,
            yield: Math.random() * 15,
            verified: a.verified || false,
            custodian: a.custodian || 'Aurigraph Trust',
            minInvestment: 100,
            lockupPeriod: 0,
            dividendFrequency: 'Quarterly',
            nextDividendDate: '2025-03-15',
            status: 'active'
          }));
          // Calculate derived values
          mappedAssets.forEach(a => {
            a.yourValue = a.yourShares * a.pricePerShare;
            a.yourPercentage = (a.yourShares / a.totalShares) * 100;
          });
          setAssets(mappedAssets);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const handleBuyShares = () => {
    if (!selectedAsset || !termsAccepted) return;

    const newOrder: ShareOrder = {
      id: `o_${Date.now()}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      type: 'buy',
      shares: shareAmount,
      pricePerShare: selectedAsset.pricePerShare,
      totalAmount: shareAmount * selectedAsset.pricePerShare,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setOrders([newOrder, ...orders]);

    // Update asset holdings (simulated)
    setAssets(assets.map(a => {
      if (a.id === selectedAsset.id) {
        const newShares = a.yourShares + shareAmount;
        return {
          ...a,
          yourShares: newShares,
          yourValue: newShares * a.pricePerShare,
          yourPercentage: (newShares / a.totalShares) * 100,
          availableShares: a.availableShares - shareAmount
        };
      }
      return a;
    }));

    setBuyDialogOpen(false);
    setActiveStep(0);
    setTermsAccepted(false);
    setShareAmount(1);
  };

  const handleSellShares = () => {
    if (!selectedAsset) return;

    const newOrder: ShareOrder = {
      id: `o_${Date.now()}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      type: 'sell',
      shares: shareAmount,
      pricePerShare: selectedAsset.pricePerShare,
      totalAmount: shareAmount * selectedAsset.pricePerShare,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setOrders([newOrder, ...orders]);

    // Update asset holdings (simulated)
    setAssets(assets.map(a => {
      if (a.id === selectedAsset.id) {
        const newShares = Math.max(0, a.yourShares - shareAmount);
        return {
          ...a,
          yourShares: newShares,
          yourValue: newShares * a.pricePerShare,
          yourPercentage: (newShares / a.totalShares) * 100,
          availableShares: a.availableShares + shareAmount
        };
      }
      return a;
    }));

    setSellDialogOpen(false);
    setShareAmount(1);
  };

  const buySteps = ['Select Shares', 'Review Terms', 'Confirm Purchase'];

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Fractional Ownership
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your fractional shares in tokenized real-world assets
        </Typography>
      </Box>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoney color="primary" />
                <Typography color="textSecondary" variant="body2">
                  Total Portfolio Value
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalPortfolioValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                <TrendingUp fontSize="small" />
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  +12.5% all time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Share color="primary" />
                <Typography color="textSecondary" variant="body2">
                  Total Shares Owned
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {totalShares.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across {assets.length} assets
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Receipt color="primary" />
                <Typography color="textSecondary" variant="body2">
                  Pending Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {orders.filter(o => o.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {orders.filter(o => o.status === 'completed').length} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUp color="success" />
                <Typography color="textSecondary" variant="body2">
                  Avg. Yield
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {(assets.reduce((sum, a) => sum + a.yield * a.yourValue, 0) / totalPortfolioValue || 0).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Weighted average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Portfolio Distribution Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {portfolioDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {portfolioDistribution.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={`${item.name}: ${((item.value / totalPortfolioValue) * 100).toFixed(1)}%`}
                    size="small"
                    sx={{ bgcolor: item.color, color: 'white' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Your Holdings
              </Typography>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Shares</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">% Owned</TableCell>
                      <TableCell align="right">24h</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.filter(a => a.yourShares > 0).map((asset) => (
                      <TableRow key={asset.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {asset.symbol}
                            </Typography>
                            {asset.verified && (
                              <VerifiedUser fontSize="small" color="success" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {asset.yourShares.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {formatCurrency(asset.yourValue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {asset.yourPercentage.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: asset.change24h >= 0 ? 'success.main' : 'error.main' }}>
                            {asset.change24h >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                            <Typography variant="body2">
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShareAmount(1);
                              setSellDialogOpen(true);
                            }}
                            disabled={asset.yourShares === 0}
                          >
                            Sell
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Available Assets" icon={<LocalOffer />} iconPosition="start" />
            <Tab label="Order History" icon={<History />} iconPosition="start" />
          </Tabs>

          {/* Available Assets Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell align="right">Price/Share</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="right">Yield</TableCell>
                    <TableCell>Min Investment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {asset.symbol.substring(0, 2)}
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
                            <Tooltip title="Verified Asset">
                              <VerifiedUser fontSize="small" color="success" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(asset.totalValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          ${asset.pricePerShare.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">
                            {asset.availableShares.toLocaleString()} / {asset.totalShares.toLocaleString()}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(asset.availableShares / asset.totalShares) * 100}
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {asset.yield > 0 ? (
                          <Chip
                            label={`${asset.yield.toFixed(1)}% APY`}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${asset.minInvestment.toLocaleString()}
                        </Typography>
                        {asset.lockupPeriod > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            {asset.lockupPeriod}mo lockup
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status}
                          size="small"
                          color={asset.status === 'active' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<ShoppingCart />}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShareAmount(Math.max(1, Math.ceil(asset.minInvestment / asset.pricePerShare)));
                              setBuyDialogOpen(true);
                            }}
                            disabled={asset.availableShares === 0}
                          >
                            Buy
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Order History Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {order.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.assetName}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.type.toUpperCase()}
                          size="small"
                          color={order.type === 'buy' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {order.shares.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${order.pricePerShare.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={
                            order.status === 'completed' ? 'success' :
                            order.status === 'pending' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Buy Shares Dialog */}
      <Dialog open={buyDialogOpen} onClose={() => setBuyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Purchase Fractional Shares
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box>
              <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
                {buySteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    You are purchasing shares of <strong>{selectedAsset.name}</strong> ({selectedAsset.symbol})
                  </Alert>

                  <Typography gutterBottom>Number of Shares</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    InputProps={{
                      inputProps: { min: 1, max: selectedAsset.availableShares },
                      endAdornment: <InputAdornment position="end">shares</InputAdornment>
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Slider
                    value={shareAmount}
                    onChange={(_, v) => setShareAmount(v as number)}
                    min={1}
                    max={Math.min(1000, selectedAsset.availableShares)}
                    marks={[
                      { value: 1, label: '1' },
                      { value: Math.min(1000, selectedAsset.availableShares), label: Math.min(1000, selectedAsset.availableShares).toString() }
                    ]}
                    sx={{ mb: 3 }}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Price per Share</Typography>
                      <Typography variant="h6">${selectedAsset.pricePerShare.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Total Cost</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(shareAmount * selectedAsset.pricePerShare)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Please review the terms before proceeding
                  </Alert>

                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <AccessTime />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Lock-up Period"
                        secondary={selectedAsset.lockupPeriod > 0 ? `${selectedAsset.lockupPeriod} months` : 'No lock-up'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.light' }}>
                          <TrendingUp />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Expected Yield"
                        secondary={selectedAsset.yield > 0 ? `${selectedAsset.yield.toFixed(1)}% APY` : 'No yield (appreciation only)'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Custodian"
                        secondary={selectedAsset.custodian}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <Gavel />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Dividend Frequency"
                        secondary={selectedAsset.dividendFrequency}
                      />
                    </ListItem>
                  </List>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                    }
                    label="I have read and agree to the terms and conditions"
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Alert severity="success" icon={<Check />} sx={{ mb: 2 }}>
                    Ready to complete your purchase
                  </Alert>

                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography color="textSecondary" gutterBottom>Asset</Typography>
                        <Typography fontWeight="bold">{selectedAsset.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="textSecondary" gutterBottom>Symbol</Typography>
                        <Typography fontWeight="bold">{selectedAsset.symbol}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="textSecondary" gutterBottom>Shares</Typography>
                        <Typography fontWeight="bold">{shareAmount.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="textSecondary" gutterBottom>Total</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatCurrency(shareAmount * selectedAsset.pricePerShare)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
          )}
          {activeStep < 2 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={activeStep === 1 && !termsAccepted}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<Check />}
              onClick={handleBuyShares}
            >
              Confirm Purchase
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Sell Shares Dialog */}
      <Dialog open={sellDialogOpen} onClose={() => setSellDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sell Fractional Shares</DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Selling shares of <strong>{selectedAsset.name}</strong>
              </Alert>

              <Typography gutterBottom>
                You own: <strong>{selectedAsset.yourShares.toLocaleString()}</strong> shares
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Shares to Sell"
                value={shareAmount}
                onChange={(e) => setShareAmount(Math.min(selectedAsset.yourShares, Math.max(1, parseInt(e.target.value) || 1)))}
                InputProps={{
                  inputProps: { min: 1, max: selectedAsset.yourShares }
                }}
                sx={{ mb: 2, mt: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Price per Share</Typography>
                  <Typography variant="h6">${selectedAsset.pricePerShare.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">You Will Receive</Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(shareAmount * selectedAsset.pricePerShare)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSellDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSellShares}>
            Confirm Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedAsset && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedAsset.symbol.substring(0, 2)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedAsset.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedAsset.symbol}
                  </Typography>
                </Box>
                {selectedAsset.verified && (
                  <Chip label="Verified" color="success" size="small" icon={<VerifiedUser />} />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Asset Value</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(selectedAsset.totalValue)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Price per Share</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ${selectedAsset.pricePerShare.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Shares</Typography>
                  <Typography variant="body1">{selectedAsset.totalShares.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Available Shares</Typography>
                  <Typography variant="body1">{selectedAsset.availableShares.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Custodian</Typography>
                  <Typography variant="body1">{selectedAsset.custodian}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Minimum Investment</Typography>
                  <Typography variant="body1">${selectedAsset.minInvestment.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Lock-up Period</Typography>
                  <Typography variant="body1">
                    {selectedAsset.lockupPeriod > 0 ? `${selectedAsset.lockupPeriod} months` : 'No lock-up'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Expected Yield</Typography>
                  <Typography variant="body1" color="success.main" fontWeight="bold">
                    {selectedAsset.yield > 0 ? `${selectedAsset.yield.toFixed(1)}% APY` : 'Capital appreciation only'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Dividend Frequency</Typography>
                  <Typography variant="body1">{selectedAsset.dividendFrequency}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Next Dividend Date</Typography>
                  <Typography variant="body1">{selectedAsset.nextDividendDate}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCart />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  setBuyDialogOpen(true);
                }}
              >
                Buy Shares
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AssetFractionalOwnershipUI;
