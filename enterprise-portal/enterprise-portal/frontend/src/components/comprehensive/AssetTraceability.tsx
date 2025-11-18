import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Paper,
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
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Alert,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Link,
  QrCode2,
  LocalShipping,
  VerifiedUser,
  Warning,
  CheckCircle,
  Info,
  Download,
  Share,
} from '@mui/icons-material';

interface TraceabilityEvent {
  id: string;
  timestamp: Date;
  eventType: 'CREATED' | 'TRANSFERRED' | 'VERIFIED' | 'CERTIFIED' | 'TOKENIZED' | 'LINKED_CONTRACT';
  actor: string;
  description: string;
  location?: string;
  metadata?: Record<string, any>;
}

interface RealWorldAsset {
  id: string;
  name: string;
  category: string;
  owner: string;
  currentValue: number;
  previousValue?: number;
  tokenId?: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'TOKENIZED' | 'ARCHIVED';
  compliance: {
    kyc: boolean;
    aml: boolean;
    verified: boolean;
    verifiedBy?: string;
  };
  linkedContracts: string[];
  traceabilityScore: number;
  createdAt: Date;
  lastModified: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AssetTraceability: React.FC = () => {
  const [assets, setAssets] = useState<RealWorldAsset[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<RealWorldAsset | null>(null);
  const [events, setEvents] = useState<TraceabilityEvent[]>([]);

  // Form state
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('real_estate');
  const [assetValue, setAssetValue] = useState('0');
  const [ownerName, setOwnerName] = useState('');
  const [contractToLink, setContractToLink] = useState('');

  const assetCategories = [
    'real_estate',
    'commodities',
    'art_collectibles',
    'vehicles',
    'intellectual_property',
    'diamonds_gems',
    'fine_wine',
    'sports_memorabilia',
    'carbon_credits',
    'water_rights',
  ];

  // Create new asset
  const handleCreateAsset = useCallback(() => {
    if (!assetName || !ownerName || !assetValue) {
      alert('Please fill in all required fields');
      return;
    }

    const newAsset: RealWorldAsset = {
      id: `asset_${Date.now()}`,
      name: assetName,
      category: assetCategory,
      owner: ownerName,
      currentValue: parseFloat(assetValue),
      status: 'ACTIVE',
      compliance: {
        kyc: true,
        aml: true,
        verified: false,
      },
      linkedContracts: [],
      traceabilityScore: 75,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    setAssets([...assets, newAsset]);

    // Add creation event
    setEvents([
      {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        eventType: 'CREATED',
        actor: 'Current User',
        description: `Asset "${assetName}" created and registered`,
      },
      ...events,
    ]);

    // Reset form
    setAssetName('');
    setAssetCategory('real_estate');
    setAssetValue('0');
    setOwnerName('');
    setCreateDialogOpen(false);
  }, [assetName, assetCategory, assetValue, ownerName, assets, events]);

  // Link contract to asset
  const handleLinkContract = useCallback(() => {
    if (!selectedAsset || !contractToLink) {
      alert('Please select a contract');
      return;
    }

    const updatedAsset = {
      ...selectedAsset,
      linkedContracts: [...selectedAsset.linkedContracts, contractToLink],
      lastModified: new Date(),
    };

    setAssets(assets.map((a) => (a.id === selectedAsset.id ? updatedAsset : a)));
    setSelectedAsset(updatedAsset);

    // Add linking event
    setEvents([
      {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        eventType: 'LINKED_CONTRACT',
        actor: 'Current User',
        description: `Contract ${contractToLink} linked to asset`,
        metadata: { contractId: contractToLink },
      },
      ...events,
    ]);

    setContractToLink('');
    setLinkDialogOpen(false);
  }, [selectedAsset, contractToLink, assets, events]);

  // Delete asset
  const handleDeleteAsset = (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(assets.filter((a) => a.id !== assetId));
    }
  };

  // Verify asset
  const handleVerifyAsset = (assetId: string) => {
    setAssets(
      assets.map((a) => {
        if (a.id === assetId) {
          const updated = {
            ...a,
            compliance: { ...a.compliance, verified: true, verifiedBy: 'Admin' },
            traceabilityScore: Math.min(100, a.traceabilityScore + 15),
            lastModified: new Date(),
          };

          // Add verification event
          setEvents([
            {
              id: `event_${Date.now()}`,
              timestamp: new Date(),
              eventType: 'VERIFIED',
              actor: 'System Admin',
              description: `Asset verified and compliance certified`,
            },
            ...events,
          ]);

          return updated;
        }
        return a;
      })
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'TRANSFERRED':
        return 'info';
      case 'TOKENIZED':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get event icon
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return <CheckCircle color="success" />;
      case 'TRANSFERRED':
        return <LocalShipping color="info" />;
      case 'VERIFIED':
        return <VerifiedUser color="success" />;
      case 'CERTIFIED':
        return <CheckCircle color="success" />;
      case 'TOKENIZED':
        return <QrCode2 color="warning" />;
      case 'LINKED_CONTRACT':
        return <Link color="primary" />;
      default:
        return <Info />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Asset Traceability Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage real-world assets with full compliance and tokenization support
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          Register Asset
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Assets (${assets.length})`} id="tab-0" aria-controls="tabpanel-0" />
          <Tab label={`Compliance`} id="tab-1" aria-controls="tabpanel-1" />
          <Tab label={`Traceability Events`} id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>
      </Box>

      {/* Assets Tab */}
      <TabPanel value={tabValue} index={0}>
        {assets.length === 0 ? (
          <Alert severity="info">
            No assets registered yet. Click "Register Asset" to begin.
          </Alert>
        ) : (
          <>
            {/* Asset Stats */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Assets
                    </Typography>
                    <Typography variant="h4">{assets.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Verified
                    </Typography>
                    <Typography variant="h4">
                      {assets.filter((a) => a.compliance.verified).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Tokenized
                    </Typography>
                    <Typography variant="h4">
                      {assets.filter((a) => a.status === 'TOKENIZED').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Value
                    </Typography>
                    <Typography variant="h4">
                      ${assets.reduce((sum, a) => sum + a.currentValue, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Assets Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Asset Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Compliance</TableCell>
                    <TableCell>Traceability</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <QrCode2 />
                          {asset.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={asset.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{asset.owner}</TableCell>
                      <TableCell>${asset.currentValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status}
                          size="small"
                          color={getStatusColor(asset.status)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          {asset.compliance.kyc && (
                            <Tooltip title="KYC Verified">
                              <CheckCircle fontSize="small" color="success" />
                            </Tooltip>
                          )}
                          {asset.compliance.aml && (
                            <Tooltip title="AML Verified">
                              <CheckCircle fontSize="small" color="success" />
                            </Tooltip>
                          )}
                          {!asset.compliance.verified && (
                            <Tooltip title="Pending Verification">
                              <Warning fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={asset.traceabilityScore}
                            sx={{ width: 80 }}
                          />
                          <Typography variant="caption">{asset.traceabilityScore}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Link Contract">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setLinkDialogOpen(true);
                            }}
                          >
                            <Link />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAsset(asset.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Compliance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Status
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    KYC Compliance
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      assets.length > 0
                        ? (assets.filter((a) => a.compliance.kyc).length / assets.length) * 100
                        : 0
                    }
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" gutterBottom>
                    AML Compliance
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      assets.length > 0
                        ? (assets.filter((a) => a.compliance.aml).length / assets.length) * 100
                        : 0
                    }
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" gutterBottom>
                    Verification Status
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      assets.length > 0
                        ? (assets.filter((a) => a.compliance.verified).length / assets.length) *
                          100
                        : 0
                    }
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unverified Assets
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {assets.filter((a) => !a.compliance.verified).map((asset) => (
                    <Box key={asset.id} sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2">{asset.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {asset.category}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleVerifyAsset(asset.id)}
                        >
                          Verify
                        </Button>
                      </Box>
                    </Box>
                  ))}
                  {assets.filter((a) => !a.compliance.verified).length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      All assets are verified.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Traceability Events Tab */}
      <TabPanel value={tabValue} index={2}>
        {events.length === 0 ? (
          <Alert severity="info">No traceability events yet.</Alert>
        ) : (
          <Timeline position="alternate">
            {events.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineSeparator>
                  <TimelineDot color={index === 0 ? 'primary' : 'grey'}>
                    {getEventIcon(event.eventType)}
                  </TimelineDot>
                  {index < events.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" component="span">
                      {event.eventType.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {event.timestamp.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {event.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      By: {event.actor}
                    </Typography>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TabPanel>

      {/* Create Asset Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Real-World Asset</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Asset Name"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            margin="normal"
            placeholder="e.g., Property at 123 Main St"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select value={assetCategory} label="Category" onChange={(e) => setAssetCategory(e.target.value)}>
              {assetCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Current Value (USD)"
            type="number"
            value={assetValue}
            onChange={(e) => setAssetValue(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Owner Name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAsset}>
            Register Asset
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Asset Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedAsset && (
          <>
            <DialogTitle>Asset Details: {selectedAsset.name}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Asset ID
                  </Typography>
                  <Typography variant="body2">{selectedAsset.id}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body2">{selectedAsset.category}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Owner
                  </Typography>
                  <Typography variant="body2">{selectedAsset.owner}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Current Value
                  </Typography>
                  <Typography variant="body2">${selectedAsset.currentValue.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Linked Contracts ({selectedAsset.linkedContracts.length})
                  </Typography>
                  {selectedAsset.linkedContracts.length > 0 ? (
                    selectedAsset.linkedContracts.map((contractId) => (
                      <Chip key={contractId} label={contractId} size="small" sx={{ mr: 1, mt: 1 }} />
                    ))
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No contracts linked yet
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Link Contract Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Contract to Asset</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a Ricardian contract to link with this asset
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Contract</InputLabel>
            <Select
              value={contractToLink}
              label="Contract"
              onChange={(e) => setContractToLink(e.target.value)}
            >
              <MenuItem value="contract_001">Purchase Agreement - 2025</MenuItem>
              <MenuItem value="contract_002">Service Contract - Q1 2025</MenuItem>
              <MenuItem value="contract_003">Tokenization Agreement</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLinkContract}>
            Link Contract
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetTraceability;
