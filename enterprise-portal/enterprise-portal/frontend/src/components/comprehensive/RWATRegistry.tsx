/**
 * Real-World Asset Tokenization (RWAT) Registry Component
 *
 * Comprehensive interface for tokenizing and managing real-world assets
 * including real estate, commodities, art, carbon credits, and more.
 */

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, MenuItem, Select, FormControl, InputLabel,
  LinearProgress, IconButton, Tooltip, Divider, List, ListItem,
  ListItemText
} from '@mui/material';
import {
  Add, AccountBalance, Gavel, Palette, EmojiNature, Diamond,
  TrendingUp, Assessment, VerifiedUser, Warning,
  AttachMoney, Share, Visibility,
  CheckCircle, Info, Description
} from '@mui/icons-material';
import {
  RealWorldAsset, AssetCategory, AssetTokenizeRequest, RWATStats
} from '../../types/rwat';

// Category icons mapping
const categoryIcons: Record<AssetCategory, React.ReactElement> = {
  real_estate: <AccountBalance />,
  commodities: <TrendingUp />,
  art: <Palette />,
  digital_art: <Palette />,
  carbon_credits: <EmojiNature />,
  bonds: <Assessment />,
  equities: <Share />,
  precious_metals: <Diamond />,
  collectibles: <Gavel />,
  intellectual_property: <Description />,
  patent: <Description />,
  trademark: <VerifiedUser />,
  copyright: <Description />,
  nft: <Palette />,
  other: <Info />
};

// Mock service for demonstration (replace with actual API calls)
const mockAssets: RealWorldAsset[] = [
  {
    id: 'rwa_1',
    name: 'Manhattan Office Building',
    category: 'real_estate',
    description: 'Class A office building in Manhattan financial district',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    custodian: 'JP Morgan Trust',
    value: 25000000,
    valueCurrency: 'USD',
    tokenId: 'RWAT_RE_001',
    tokenSymbol: 'MHTN-OFF',
    totalShares: 1000000,
    availableShares: 450000,
    pricePerShare: 25,
    tokenizedAt: '2025-10-01T10:00:00Z',
    lastValuationDate: '2025-09-15T00:00:00Z',
    nextValuationDate: '2025-12-15T00:00:00Z',
    status: 'active',
    verified: true,
    verifiedBy: 'Deloitte Real Estate Services',
    verifiedAt: '2025-10-01T09:00:00Z',
    compliance: {
      kycRequired: true,
      amlVerified: true,
      accreditedInvestorsOnly: true,
      jurisdictions: ['US', 'EU'],
      regulatoryFramework: 'SEC Regulation D',
      complianceDocuments: ['doc1', 'doc2'],
      restrictions: ['US residents only', 'Minimum investment $10,000']
    },
    metadata: {
      location: 'Manhattan, NY, USA',
      legalDescription: 'Block 123, Lot 456, Manhattan Borough',
      yearBuilt: 2005,
      condition: 'Excellent',
      certifications: ['LEED Platinum', 'Energy Star'],
      images: [],
      externalLinks: []
    },
    documents: []
  },
  {
    id: 'rwa_2',
    name: 'Gold Reserves',
    category: 'precious_metals',
    description: '1000 oz physical gold stored in Swiss vault',
    owner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    custodian: 'Swiss Vault Services AG',
    value: 2000000,
    valueCurrency: 'USD',
    tokenId: 'RWAT_PM_002',
    tokenSymbol: 'GOLD-V1',
    totalShares: 1000,
    availableShares: 350,
    pricePerShare: 2000,
    tokenizedAt: '2025-09-20T10:00:00Z',
    lastValuationDate: '2025-10-14T00:00:00Z',
    status: 'active',
    verified: true,
    verifiedBy: 'Bureau Veritas',
    verifiedAt: '2025-09-19T00:00:00Z',
    compliance: {
      kycRequired: true,
      amlVerified: true,
      accreditedInvestorsOnly: false,
      jurisdictions: ['US', 'EU', 'APAC'],
      regulatoryFramework: 'LBMA Good Delivery',
      complianceDocuments: ['doc3', 'doc4'],
      restrictions: []
    },
    metadata: {
      location: 'Zurich, Switzerland',
      serialNumber: 'GOLD-1000OZ-2025-001',
      condition: 'New',
      certifications: ['LBMA Good Delivery', 'ISO 9001'],
      images: [],
      externalLinks: []
    },
    documents: []
  }
];

const mockStats: RWATStats = {
  totalAssets: 147,
  totalValueLocked: 623000000,
  totalValueLockedUSD: 623000000,
  assetsByCategory: {
    real_estate: 45,
    commodities: 23,
    art: 12,
    digital_art: 8,
    carbon_credits: 8,
    bonds: 15,
    equities: 10,
    precious_metals: 7,
    collectibles: 4,
    intellectual_property: 5,
    patent: 3,
    trademark: 2,
    copyright: 1,
    nft: 3,
    other: 1
  },
  totalHolders: 14253,
  totalTransfers: 4156,
  verifiedAssets: 132,
  avgAssetValue: 4238095
};

export const RWATRegistry: React.FC = () => {
  const [assets] = useState<RealWorldAsset[]>(mockAssets);
  const [stats] = useState<RWATStats>(mockStats);
  const [selectedAsset, setSelectedAsset] = useState<RealWorldAsset | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');

  // Tokenization form state
  const [tokenizeForm, setTokenizeForm] = useState<Partial<AssetTokenizeRequest>>({
    name: '',
    category: 'real_estate',
    description: '',
    owner: '',
    custodian: '',
    value: 0,
    valueCurrency: 'USD',
    totalShares: 1000,
    tokenSymbol: '',
    compliance: {
      kycRequired: true,
      amlVerified: false,
      accreditedInvestorsOnly: false,
      jurisdictions: [],
      complianceDocuments: [],
      restrictions: []
    },
    metadata: {
      customFields: {}
    },
    documents: []
  });

  const handleTokenizeAsset = () => {
    console.log('Tokenizing asset:', tokenizeForm);
    // TODO: Call backend API to tokenize asset
    setDialogOpen(false);
    // Reset form
    setTokenizeForm({
      name: '',
      category: 'real_estate',
      description: '',
      owner: '',
      value: 0,
      valueCurrency: 'USD',
      totalShares: 1000,
      tokenSymbol: '',
      compliance: {
        kycRequired: true,
        amlVerified: false,
        accreditedInvestorsOnly: false,
        jurisdictions: [],
        complianceDocuments: [],
        restrictions: []
      },
      metadata: {},
      documents: []
    });
  };

  const filteredAssets = categoryFilter === 'all'
    ? assets
    : assets.filter(a => a.category === categoryFilter);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const getStatusColor = (status: RealWorldAsset['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending_verification': return 'warning';
      case 'suspended': return 'error';
      case 'delisted': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Real-World Asset Tokenization</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Tokenize Asset
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assets
                  </Typography>
                  <Typography variant="h4">{stats.totalAssets}</Typography>
                  <Typography variant="body2" color="success.main">
                    {stats.verifiedAssets} verified
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value Locked
                  </Typography>
                  <Typography variant="h4">{formatCurrency(stats.totalValueLocked)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Across all assets
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Holders
                  </Typography>
                  <Typography variant="h4">{stats.totalHolders.toLocaleString()}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Unique token holders
                  </Typography>
                </Box>
                <Share sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Asset Value
                  </Typography>
                  <Typography variant="h4">{formatCurrency(stats.avgAssetValue)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Per tokenized asset
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Filter by Category"
              onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | 'all')}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="real_estate">Real Estate</MenuItem>
              <MenuItem value="commodities">Commodities</MenuItem>
              <MenuItem value="art">Art & Collectibles</MenuItem>
              <MenuItem value="carbon_credits">Carbon Credits</MenuItem>
              <MenuItem value="bonds">Bonds</MenuItem>
              <MenuItem value="equities">Equities</MenuItem>
              <MenuItem value="precious_metals">Precious Metals</MenuItem>
              <MenuItem value="collectibles">Collectibles</MenuItem>
              <MenuItem value="intellectual_property">Intellectual Property</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tokenized Assets ({filteredAssets.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Shares</TableCell>
                  <TableCell align="right">Price/Share</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {categoryIcons[asset.category]}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {asset.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {asset.metadata.location || 'Location unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.category.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {asset.tokenSymbol}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {asset.tokenId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(asset.value)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {asset.valueCurrency}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {asset.availableShares.toLocaleString()} / {asset.totalShares.toLocaleString()}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(asset.availableShares / asset.totalShares) * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ${asset.pricePerShare.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status.replace('_', ' ')}
                        color={getStatusColor(asset.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {asset.verified ? (
                        <Tooltip title={`Verified by ${asset.verifiedBy}`}>
                          <CheckCircle color="success" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Pending verification">
                          <Warning color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tokenize Asset Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tokenize Real-World Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Asset Name"
                value={tokenizeForm.name || ''}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={tokenizeForm.category || 'real_estate'}
                  label="Category"
                  onChange={(e) => setTokenizeForm({ ...tokenizeForm, category: e.target.value as AssetCategory })}
                >
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                  <MenuItem value="commodities">Commodities</MenuItem>
                  <MenuItem value="art">Art</MenuItem>
                  <MenuItem value="carbon_credits">Carbon Credits</MenuItem>
                  <MenuItem value="bonds">Bonds</MenuItem>
                  <MenuItem value="equities">Equities</MenuItem>
                  <MenuItem value="precious_metals">Precious Metals</MenuItem>
                  <MenuItem value="collectibles">Collectibles</MenuItem>
                  <MenuItem value="intellectual_property">Intellectual Property</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={tokenizeForm.description || ''}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Address"
                value={tokenizeForm.owner || ''}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, owner: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custodian (Optional)"
                value={tokenizeForm.custodian || ''}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, custodian: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Asset Value"
                value={tokenizeForm.value || 0}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, value: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Total Shares"
                value={tokenizeForm.totalShares || 1000}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, totalShares: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Token Symbol"
                value={tokenizeForm.tokenSymbol || ''}
                onChange={(e) => setTokenizeForm({ ...tokenizeForm, tokenSymbol: e.target.value.toUpperCase() })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTokenizeAsset} variant="contained" color="primary">
            Tokenize Asset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedAsset && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {categoryIcons[selectedAsset.category]}
                {selectedAsset.name}
                {selectedAsset.verified && (
                  <Chip label="Verified" color="success" size="small" icon={<VerifiedUser />} />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" color="textSecondary" paragraph>
                    {selectedAsset.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Token Symbol</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedAsset.tokenSymbol}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Token ID</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedAsset.tokenId}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Value</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(selectedAsset.value)} {selectedAsset.valueCurrency}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Price per Share</Typography>
                  <Typography variant="body1" fontWeight="bold">
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
                  <Typography variant="h6" gutterBottom>Compliance Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="KYC Required"
                        secondary={selectedAsset.compliance.kycRequired ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="AML Verified"
                        secondary={selectedAsset.compliance.amlVerified ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Accredited Investors Only"
                        secondary={selectedAsset.compliance.accreditedInvestorsOnly ? 'Yes' : 'No'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Jurisdictions"
                        secondary={selectedAsset.compliance.jurisdictions.join(', ')}
                      />
                    </ListItem>
                    {selectedAsset.compliance.regulatoryFramework && (
                      <ListItem>
                        <ListItemText
                          primary="Regulatory Framework"
                          secondary={selectedAsset.compliance.regulatoryFramework}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                {selectedAsset.metadata.location && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                    <Typography variant="body1">{selectedAsset.metadata.location}</Typography>
                  </Grid>
                )}
                {selectedAsset.verifiedBy && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<VerifiedUser />}>
                      Verified by {selectedAsset.verifiedBy} on {new Date(selectedAsset.verifiedAt!).toLocaleDateString()}
                    </Alert>
                  </Grid>
                )}
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

export default RWATRegistry;
