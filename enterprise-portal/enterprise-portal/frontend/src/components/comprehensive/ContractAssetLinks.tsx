import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Delete,
  Visibility,
} from '@mui/icons-material';

interface ContractAssetLink {
  id: string;
  contractId: string;
  contractName: string;
  assetId: string;
  assetName: string;
  linkType: 'OWNS' | 'REFERENCES' | 'CONTROLS' | 'MONITORS';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
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

export const ContractAssetLinks: React.FC = () => {
  const [links, setLinks] = useState<ContractAssetLink[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ContractAssetLink | null>(null);

  // Form state
  const [contractId, setContractId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [linkType, setLinkType] = useState<'OWNS' | 'REFERENCES' | 'CONTROLS' | 'MONITORS'>('OWNS');

  // Sample data
  const contracts = [
    { id: 'contract_001', name: 'Purchase Agreement 2025' },
    { id: 'contract_002', name: 'Service Contract Q1' },
    { id: 'contract_003', name: 'Tokenization Agreement' },
  ];

  const assets = [
    { id: 'asset_001', name: 'Property at 123 Main St' },
    { id: 'asset_002', name: 'Commodity Shipment #2025-001' },
    { id: 'asset_003', name: 'Art Collection - Renaissance' },
  ];

  // Create link
  const handleCreateLink = useCallback(() => {
    if (!contractId || !assetId) {
      alert('Please select both contract and asset');
      return;
    }

    const contract = contracts.find((c) => c.id === contractId);
    const asset = assets.find((a) => a.id === assetId);

    if (!contract || !asset) {
      alert('Invalid contract or asset selected');
      return;
    }

    const newLink: ContractAssetLink = {
      id: `link_${Date.now()}`,
      contractId,
      contractName: contract.name,
      assetId,
      assetName: asset.name,
      linkType,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLinks([...links, newLink]);
    setContractId('');
    setAssetId('');
    setLinkType('OWNS');
    setCreateDialogOpen(false);
  }, [contractId, assetId, linkType, links]);

  // Delete link
  const handleDeleteLink = (linkId: string) => {
    if (confirm('Are you sure you want to remove this link?')) {
      setLinks(links.filter((l) => l.id !== linkId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'PENDING':
        return 'warning';
      case 'RESOLVED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (linkType: string) => {
    switch (linkType) {
      case 'OWNS':
        return '📋';
      case 'REFERENCES':
        return '🔗';
      case 'CONTROLS':
        return '⚙️';
      case 'MONITORS':
        return '👁️';
      default:
        return '📌';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Contract-Asset Links
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage relationships between contracts and assets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          New Link
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`Links (${links.length})`} id="tab-0" aria-controls="tabpanel-0" />
          <Tab label={`By Contract`} id="tab-1" aria-controls="tabpanel-1" />
          <Tab label={`By Asset`} id="tab-2" aria-controls="tabpanel-2" />
          <Tab label={`Statistics`} id="tab-3" aria-controls="tabpanel-3" />
        </Tabs>
      </Box>

      {/* Links Tab */}
      <TabPanel value={tabValue} index={0}>
        {links.length === 0 ? (
          <Alert severity="info">
            No contract-asset links yet. Click "New Link" to create one.
          </Alert>
        ) : (
          <>
            {/* Stats */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Links
                    </Typography>
                    <Typography variant="h4">{links.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Active
                    </Typography>
                    <Typography variant="h4">
                      {links.filter((l) => l.status === 'ACTIVE').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Unique Contracts
                    </Typography>
                    <Typography variant="h4">
                      {new Set(links.map((l) => l.contractId)).size}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Links Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Type</TableCell>
                    <TableCell>Contract</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id} hover>
                      <TableCell>
                        <Chip
                          label={link.linkType}
                          size="small"
                          variant="outlined"
                          avatar={<span>{getTypeIcon(link.linkType)}</span>}
                        />
                      </TableCell>
                      <TableCell>{link.contractName}</TableCell>
                      <TableCell>{link.assetName}</TableCell>
                      <TableCell>
                        <Chip
                          label={link.status}
                          size="small"
                          color={getStatusColor(link.status)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{link.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLink(link);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLink(link.id)}
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

      {/* By Contract Tab */}
      <TabPanel value={tabValue} index={1}>
        {links.length === 0 ? (
          <Alert severity="info">No links to display</Alert>
        ) : (
          <Box>
            {Array.from(new Set(links.map((l) => l.contractId))).map((cId) => {
              const contractLinks = links.filter((l) => l.contractId === cId);
              const contract = contracts.find((c) => c.id === cId);
              return (
                <Card key={cId} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {contract?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {contractLinks.length} asset link(s)
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                      {contractLinks.map((link) => (
                        <Chip
                          key={link.id}
                          label={`${link.assetName} (${link.linkType})`}
                          size="small"
                          onDelete={() => handleDeleteLink(link.id)}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </TabPanel>

      {/* By Asset Tab */}
      <TabPanel value={tabValue} index={2}>
        {links.length === 0 ? (
          <Alert severity="info">No links to display</Alert>
        ) : (
          <Box>
            {Array.from(new Set(links.map((l) => l.assetId))).map((aId) => {
              const assetLinks = links.filter((l) => l.assetId === aId);
              const asset = assets.find((a) => a.id === aId);
              return (
                <Card key={aId} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {asset?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Referenced in {assetLinks.length} contract(s)
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                      {assetLinks.map((link) => (
                        <Chip
                          key={link.id}
                          label={`${link.contractName} (${link.linkType})`}
                          size="small"
                          onDelete={() => handleDeleteLink(link.id)}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Link Types Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {(['OWNS', 'REFERENCES', 'CONTROLS', 'MONITORS'] as const).map((type) => {
                    const count = links.filter((l) => l.linkType === type).length;
                    const percentage = links.length > 0 ? (count / links.length) * 100 : 0;
                    return (
                      <Box key={type} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{type}</Typography>
                          <Typography variant="caption">{count}</Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${percentage}%`,
                              backgroundColor: '#1976d2',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {(['ACTIVE', 'INACTIVE', 'PENDING', 'RESOLVED'] as const).map((status) => {
                    const count = links.filter((l) => l.status === status).length;
                    const percentage = links.length > 0 ? (count / links.length) * 100 : 0;
                    return (
                      <Box key={status} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{status}</Typography>
                          <Typography variant="caption">{count}</Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${percentage}%`,
                              backgroundColor:
                                status === 'ACTIVE'
                                  ? '#4caf50'
                                  : status === 'PENDING'
                                    ? '#ff9800'
                                    : status === 'RESOLVED'
                                      ? '#2196f3'
                                      : '#bdbdbd',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Link Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Contract-Asset Link</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Contract</InputLabel>
            <Select
              value={contractId}
              label="Contract"
              onChange={(e) => setContractId(e.target.value)}
            >
              {contracts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Asset</InputLabel>
            <Select value={assetId} label="Asset" onChange={(e) => setAssetId(e.target.value)}>
              {assets.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Link Type</InputLabel>
            <Select
              value={linkType}
              label="Link Type"
              onChange={(e) => setLinkType(e.target.value as ContractAssetLink['linkType'])}
            >
              <MenuItem value="OWNS">Owns</MenuItem>
              <MenuItem value="REFERENCES">References</MenuItem>
              <MenuItem value="CONTROLS">Controls</MenuItem>
              <MenuItem value="MONITORS">Monitors</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLink}>
            Create Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Link Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedLink && (
          <>
            <DialogTitle>Link Details</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Contract
                  </Typography>
                  <Typography variant="body2">{selectedLink.contractName}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Asset
                  </Typography>
                  <Typography variant="body2">{selectedLink.assetName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Link Type
                  </Typography>
                  <Chip label={selectedLink.linkType} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedLink.status}
                    size="small"
                    color={getStatusColor(selectedLink.status)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {selectedLink.createdAt.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Updated
                  </Typography>
                  <Typography variant="body2">
                    {selectedLink.updatedAt.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ContractAssetLinks;
