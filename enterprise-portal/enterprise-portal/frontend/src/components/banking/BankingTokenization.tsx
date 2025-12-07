/**
 * Banking Tokenization Component
 *
 * Comprehensive interface for tokenizing banking and trade finance assets
 * including trade finance, deposits, loans, and invoice factoring.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  AccountBalance,
  Receipt,
  CreditCard,
  Assessment,
  VerifiedUser,
  Warning,
  CheckCircle,
  Add,
  Visibility,
  Edit,
  LocalShipping,
  AttachMoney,
  Description,
  Security,
  Timeline,
  PieChart,
} from '@mui/icons-material';

// Types for Banking Tokenization
export type BankingAssetType =
  | 'trade_finance'
  | 'deposits'
  | 'loans'
  | 'invoice_factoring'
  | 'supply_chain_finance'
  | 'treasury';

export type BankingAssetStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'matured'
  | 'defaulted'
  | 'liquidated';

export interface BankingAsset {
  id: string;
  name: string;
  type: BankingAssetType;
  description: string;
  issuer: string;
  counterparty?: string;
  principalAmount: number;
  currency: string;
  interestRate?: number;
  maturityDate?: string;
  tokenId: string;
  tokenSymbol: string;
  totalTokens: number;
  availableTokens: number;
  pricePerToken: number;
  status: BankingAssetStatus;
  createdAt: string;
  lastUpdated: string;
  verified: boolean;
  verifiedBy?: string;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
  collateral?: CollateralInfo;
  compliance: BankingComplianceInfo;
  metadata: BankingMetadata;
}

export interface CollateralInfo {
  type: string;
  value: number;
  description: string;
  ltv: number; // Loan-to-Value ratio
  verified: boolean;
}

export interface BankingComplianceInfo {
  kycVerified: boolean;
  amlVerified: boolean;
  baselCompliant: boolean;
  jurisdictions: string[];
  regulatoryFramework: string;
  riskWeighting: number;
}

export interface BankingMetadata {
  originatingBank?: string;
  counterpartyBank?: string;
  tradeRoute?: string;
  invoiceNumbers?: string[];
  shipmentDetails?: string;
  guaranteeType?: string;
  customFields?: Record<string, unknown>;
}

// Asset type configurations
const assetTypeConfig: Record<BankingAssetType, { label: string; icon: React.ReactElement; color: string }> = {
  trade_finance: { label: 'Trade Finance', icon: <LocalShipping />, color: '#2196f3' },
  deposits: { label: 'Deposits', icon: <AccountBalance />, color: '#4caf50' },
  loans: { label: 'Loans', icon: <CreditCard />, color: '#ff9800' },
  invoice_factoring: { label: 'Invoice Factoring', icon: <Receipt />, color: '#9c27b0' },
  supply_chain_finance: { label: 'Supply Chain Finance', icon: <Timeline />, color: '#00bcd4' },
  treasury: { label: 'Treasury', icon: <Assessment />, color: '#795548' },
};

const statusConfig: Record<BankingAssetStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', color: 'default' },
  pending_approval: { label: 'Pending Approval', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  matured: { label: 'Matured', color: 'info' },
  defaulted: { label: 'Defaulted', color: 'error' },
  liquidated: { label: 'Liquidated', color: 'secondary' },
};

// Mock data
const mockBankingAssets: BankingAsset[] = [
  {
    id: 'ba_1',
    name: 'LC-IMPORT-2025-001',
    type: 'trade_finance',
    description: 'Letter of Credit for electronics import from Singapore to USA',
    issuer: 'JP Morgan Chase',
    counterparty: 'DBS Bank Singapore',
    principalAmount: 5000000,
    currency: 'USD',
    maturityDate: '2025-06-15',
    tokenId: 'TF-LC-001',
    tokenSymbol: 'TFLC001',
    totalTokens: 500000,
    availableTokens: 320000,
    pricePerToken: 10,
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
    lastUpdated: '2025-12-01T14:30:00Z',
    verified: true,
    verifiedBy: 'Bureau Veritas Financial',
    riskRating: 'AA',
    collateral: {
      type: 'Goods in Transit',
      value: 5500000,
      description: 'Electronic components shipment',
      ltv: 90.9,
      verified: true,
    },
    compliance: {
      kycVerified: true,
      amlVerified: true,
      baselCompliant: true,
      jurisdictions: ['US', 'SG'],
      regulatoryFramework: 'UCP 600',
      riskWeighting: 20,
    },
    metadata: {
      originatingBank: 'JP Morgan Chase',
      counterpartyBank: 'DBS Bank Singapore',
      tradeRoute: 'Singapore → Los Angeles',
      shipmentDetails: 'Container SGLA-2025-0142',
    },
  },
  {
    id: 'ba_2',
    name: 'CD-CORP-2025-Q1',
    type: 'deposits',
    description: 'Corporate Certificate of Deposit - 12 month term',
    issuer: 'Goldman Sachs',
    principalAmount: 10000000,
    currency: 'USD',
    interestRate: 5.25,
    maturityDate: '2026-01-15',
    tokenId: 'DEP-CD-001',
    tokenSymbol: 'GSCD25',
    totalTokens: 1000000,
    availableTokens: 750000,
    pricePerToken: 10,
    status: 'active',
    createdAt: '2025-01-15T09:00:00Z',
    lastUpdated: '2025-12-01T10:00:00Z',
    verified: true,
    verifiedBy: 'Deloitte Financial Services',
    riskRating: 'AAA',
    compliance: {
      kycVerified: true,
      amlVerified: true,
      baselCompliant: true,
      jurisdictions: ['US', 'EU', 'UK'],
      regulatoryFramework: 'FDIC Insured',
      riskWeighting: 0,
    },
    metadata: {
      originatingBank: 'Goldman Sachs',
      guaranteeType: 'FDIC Insured up to $250,000',
    },
  },
  {
    id: 'ba_3',
    name: 'SYND-LOAN-2025-001',
    type: 'loans',
    description: 'Syndicated corporate loan - Technology sector expansion',
    issuer: 'Bank of America (Lead)',
    counterparty: 'TechCorp Global Inc.',
    principalAmount: 50000000,
    currency: 'USD',
    interestRate: 6.75,
    maturityDate: '2030-01-15',
    tokenId: 'LOAN-SYN-001',
    tokenSymbol: 'BASYN25',
    totalTokens: 5000000,
    availableTokens: 2000000,
    pricePerToken: 10,
    status: 'active',
    createdAt: '2025-01-10T11:00:00Z',
    lastUpdated: '2025-12-05T16:00:00Z',
    verified: true,
    verifiedBy: 'KPMG Advisory',
    riskRating: 'A',
    collateral: {
      type: 'Corporate Assets',
      value: 75000000,
      description: 'Fixed assets and intellectual property',
      ltv: 66.7,
      verified: true,
    },
    compliance: {
      kycVerified: true,
      amlVerified: true,
      baselCompliant: true,
      jurisdictions: ['US'],
      regulatoryFramework: 'LMA Standards',
      riskWeighting: 100,
    },
    metadata: {
      originatingBank: 'Bank of America',
      customFields: {
        syndicateMembers: ['Citi', 'Wells Fargo', 'HSBC'],
        covenants: 'Debt/EBITDA < 4.0x',
      },
    },
  },
  {
    id: 'ba_4',
    name: 'INV-FACT-2025-DEC',
    type: 'invoice_factoring',
    description: 'Invoice factoring pool - Manufacturing receivables',
    issuer: 'Trade Finance Corp',
    counterparty: 'Multiple Debtors',
    principalAmount: 8500000,
    currency: 'USD',
    maturityDate: '2026-03-15',
    tokenId: 'INV-FCT-001',
    tokenSymbol: 'TFFACT',
    totalTokens: 850000,
    availableTokens: 600000,
    pricePerToken: 10,
    status: 'active',
    createdAt: '2025-12-01T08:00:00Z',
    lastUpdated: '2025-12-07T09:00:00Z',
    verified: true,
    verifiedBy: 'EY Trade Finance',
    riskRating: 'BBB',
    collateral: {
      type: 'Accounts Receivable',
      value: 10000000,
      description: 'Diversified invoice pool from 25 debtors',
      ltv: 85,
      verified: true,
    },
    compliance: {
      kycVerified: true,
      amlVerified: true,
      baselCompliant: true,
      jurisdictions: ['US', 'EU'],
      regulatoryFramework: 'Asset-Based Lending',
      riskWeighting: 75,
    },
    metadata: {
      invoiceNumbers: ['INV-2025-001', 'INV-2025-002', '...25 total'],
    },
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const BankingTokenization: React.FC = () => {
  const [assets] = useState<BankingAsset[]>(mockBankingAssets);
  const [selectedAsset, setSelectedAsset] = useState<BankingAsset | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<BankingAssetType | 'all'>('all');

  const filteredAssets = typeFilter === 'all'
    ? assets
    : assets.filter(a => a.type === typeFilter);

  const totalValue = assets.reduce((sum, a) => sum + a.principalAmount, 0);
  const activeAssets = assets.filter(a => a.status === 'active').length;
  const totalTokensIssued = assets.reduce((sum, a) => sum + a.totalTokens, 0);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDetails = (asset: BankingAsset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            Banking & Trade Finance Tokenization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tokenize and manage trade finance, deposits, loans, and invoice factoring assets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Banking Asset
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h5">{formatCurrency(totalValue)}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Value Tokenized</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5">{activeAssets}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Assets</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PieChart />
                </Avatar>
                <Box>
                  <Typography variant="h5">{totalTokensIssued.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Tokens Issued</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h5">100%</Typography>
                  <Typography variant="body2" color="text.secondary">Basel Compliant</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="All Assets" icon={<Assessment />} iconPosition="start" />
            <Tab label="Trade Finance" icon={<LocalShipping />} iconPosition="start" />
            <Tab label="Deposits & Loans" icon={<AccountBalance />} iconPosition="start" />
            <Tab label="Active Contracts" icon={<Description />} iconPosition="start" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {/* Filter */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Asset Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Asset Type"
                  onChange={(e) => setTypeFilter(e.target.value as BankingAssetType | 'all')}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {Object.entries(assetTypeConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.icon}
                        {config.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Assets Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Principal</TableCell>
                    <TableCell>Risk Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Maturity</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{asset.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.tokenSymbol}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={assetTypeConfig[asset.type].icon}
                          label={assetTypeConfig[asset.type].label}
                          sx={{ bgcolor: `${assetTypeConfig[asset.type].color}20`, color: assetTypeConfig[asset.type].color }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(asset.principalAmount, asset.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={asset.riskRating}
                          color={
                            ['AAA', 'AA', 'A'].includes(asset.riskRating) ? 'success' :
                            ['BBB', 'BB'].includes(asset.riskRating) ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusConfig[asset.status].label}
                          color={statusConfig[asset.status].color}
                        />
                      </TableCell>
                      <TableCell>
                        {asset.maturityDate ? formatDate(asset.maturityDate) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(asset)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              {assets.filter(a => ['trade_finance', 'supply_chain_finance'].includes(a.type)).map((asset) => (
                <Grid item xs={12} md={6} key={asset.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{asset.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{asset.description}</Typography>
                        </Box>
                        <Chip
                          label={asset.riskRating}
                          color={['AAA', 'AA', 'A'].includes(asset.riskRating) ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Principal</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatCurrency(asset.principalAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Maturity</Typography>
                          <Typography variant="body1">
                            {asset.maturityDate ? formatDate(asset.maturityDate) : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Issuer</Typography>
                          <Typography variant="body1">{asset.issuer}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Counterparty</Typography>
                          <Typography variant="body1">{asset.counterparty || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                      {asset.metadata.tradeRoute && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Trade Route</Typography>
                          <Typography variant="body2">{asset.metadata.tradeRoute}</Typography>
                        </Box>
                      )}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => handleViewDetails(asset)}>
                          View Details
                        </Button>
                        <Button size="small" variant="contained">
                          Trade Tokens
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              {assets.filter(a => ['deposits', 'loans'].includes(a.type)).map((asset) => (
                <Grid item xs={12} md={6} key={asset.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {assetTypeConfig[asset.type].icon}
                          <Box>
                            <Typography variant="h6">{asset.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{asset.description}</Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={statusConfig[asset.status].label}
                          color={statusConfig[asset.status].color}
                          size="small"
                        />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Principal Amount</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(asset.principalAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Interest Rate</Typography>
                          <Typography variant="h6" color="success.main">
                            {asset.interestRate ? `${asset.interestRate}%` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Risk Rating</Typography>
                          <Chip
                            label={asset.riskRating}
                            color={['AAA', 'AA', 'A'].includes(asset.riskRating) ? 'success' : 'warning'}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Maturity Date</Typography>
                          <Typography variant="body1">
                            {asset.maturityDate ? formatDate(asset.maturityDate) : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                      {asset.collateral && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1, opacity: 0.9 }}>
                          <Typography variant="caption" fontWeight="bold">Collateral</Typography>
                          <Typography variant="body2">
                            {asset.collateral.type}: {formatCurrency(asset.collateral.value)} (LTV: {asset.collateral.ltv}%)
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">Token Progress</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={((asset.totalTokens - asset.availableTokens) / asset.totalTokens) * 100}
                          sx={{ mt: 0.5, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {asset.totalTokens - asset.availableTokens} / {asset.totalTokens} tokens sold
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => handleViewDetails(asset)}>
                          View Details
                        </Button>
                        <Button size="small" variant="contained">
                          Invest
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Active contracts show all tokenized banking assets with ongoing obligations and smart contract enforcement.
            </Alert>
            <List>
              {assets.filter(a => a.status === 'active').map((asset) => (
                <ListItem
                  key={asset.id}
                  sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {asset.verified && (
                        <Chip icon={<VerifiedUser />} label="Verified" color="success" size="small" />
                      )}
                      <Button size="small" variant="outlined" onClick={() => handleViewDetails(asset)}>
                        View Contract
                      </Button>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {assetTypeConfig[asset.type].icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={asset.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption">
                          Principal: {formatCurrency(asset.principalAmount)}
                        </Typography>
                        <Typography variant="caption">
                          Token: {asset.tokenSymbol}
                        </Typography>
                        <Typography variant="caption">
                          Maturity: {asset.maturityDate ? formatDate(asset.maturityDate) : 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAsset && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {assetTypeConfig[selectedAsset.type].icon}
                {selectedAsset.name}
                <Chip
                  label={statusConfig[selectedAsset.status].label}
                  color={statusConfig[selectedAsset.status].color}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Asset Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Type" secondary={assetTypeConfig[selectedAsset.type].label} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Description" secondary={selectedAsset.description} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Issuer" secondary={selectedAsset.issuer} />
                    </ListItem>
                    {selectedAsset.counterparty && (
                      <ListItem>
                        <ListItemText primary="Counterparty" secondary={selectedAsset.counterparty} />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText
                        primary="Principal Amount"
                        secondary={formatCurrency(selectedAsset.principalAmount, selectedAsset.currency)}
                      />
                    </ListItem>
                    {selectedAsset.interestRate && (
                      <ListItem>
                        <ListItemText primary="Interest Rate" secondary={`${selectedAsset.interestRate}%`} />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText
                        primary="Risk Rating"
                        secondary={<Chip label={selectedAsset.riskRating} size="small" color="primary" />}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Token Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Token ID" secondary={selectedAsset.tokenId} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Symbol" secondary={selectedAsset.tokenSymbol} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Total Tokens" secondary={selectedAsset.totalTokens.toLocaleString()} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Available Tokens" secondary={selectedAsset.availableTokens.toLocaleString()} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Price per Token"
                        secondary={formatCurrency(selectedAsset.pricePerToken)}
                      />
                    </ListItem>
                  </List>
                </Grid>
                {selectedAsset.collateral && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Collateral Information</Typography>
                    <Card variant="outlined" sx={{ mt: 1 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">Type</Typography>
                            <Typography>{selectedAsset.collateral.type}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">Value</Typography>
                            <Typography>{formatCurrency(selectedAsset.collateral.value)}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">LTV Ratio</Typography>
                            <Typography>{selectedAsset.collateral.ltv}%</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">Verified</Typography>
                            <Chip
                              label={selectedAsset.collateral.verified ? 'Yes' : 'No'}
                              color={selectedAsset.collateral.verified ? 'success' : 'default'}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Compliance & Regulatory</Typography>
                  <Card variant="outlined" sx={{ mt: 1 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Chip
                            icon={selectedAsset.compliance.kycVerified ? <CheckCircle /> : <Warning />}
                            label="KYC"
                            color={selectedAsset.compliance.kycVerified ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Chip
                            icon={selectedAsset.compliance.amlVerified ? <CheckCircle /> : <Warning />}
                            label="AML"
                            color={selectedAsset.compliance.amlVerified ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Chip
                            icon={selectedAsset.compliance.baselCompliant ? <CheckCircle /> : <Warning />}
                            label="Basel III"
                            color={selectedAsset.compliance.baselCompliant ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary">Risk Weight</Typography>
                          <Typography>{selectedAsset.compliance.riskWeighting}%</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Regulatory Framework</Typography>
                          <Typography>{selectedAsset.compliance.regulatoryFramework}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Jurisdictions</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {selectedAsset.compliance.jurisdictions.map((j) => (
                              <Chip key={j} label={j} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button variant="contained">Trade Tokens</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Dialog (placeholder) */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Banking Asset</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            Banking asset creation form will be implemented here. This includes:
            <ul>
              <li>Trade Finance (Letters of Credit, Trade Receivables)</li>
              <li>Deposits (CDs, Term Deposits)</li>
              <li>Loans (Commercial, Syndicated, Mortgages)</li>
              <li>Invoice Factoring</li>
              <li>Supply Chain Finance</li>
              <li>Treasury Instruments</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled>Create Asset</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankingTokenization;
