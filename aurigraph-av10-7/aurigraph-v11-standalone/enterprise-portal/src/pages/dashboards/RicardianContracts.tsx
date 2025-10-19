import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import { Description, CheckCircle, Pending, Error as ErrorIcon, Upload, Visibility, Download, Refresh } from '@mui/icons-material';
import axios from 'axios';

// Type definitions for Ricardian contracts
interface RicardianContract {
  id: string;
  title: string;
  type: 'sale' | 'lease' | 'service' | 'partnership' | 'other';
  parties: string[];
  status: 'draft' | 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  signatures: number;
  requiredSignatures: number;
  verificationStatus: 'verified' | 'pending' | 'failed';
  hash: string;
  blockchainTxId?: string;
  legalJurisdiction: string;
  value?: number;
  currency?: string;
}

interface ContractsResponse {
  contracts: RicardianContract[];
  total: number;
  pending: number;
  active: number;
  completed: number;
}

interface ContractUploadData {
  title: string;
  type: string;
  parties: string[];
  legalJurisdiction: string;
  value?: number;
  currency?: string;
  documentHash: string;
}

const RicardianContracts: React.FC = () => {
  const [contractsData, setContractsData] = useState<ContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RicardianContract | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [uploadForm, setUploadForm] = useState<ContractUploadData>({
    title: '',
    type: 'sale',
    parties: [''],
    legalJurisdiction: 'US',
    documentHash: ''
  });

  useEffect(() => {
    fetchContracts();
    const interval = setInterval(fetchContracts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchContracts = async () => {
    try {
      setError(null);
      const response = await axios.get<ContractsResponse>('http://localhost:9003/api/v11/contracts/ricardian');
      setContractsData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch Ricardian contracts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Ricardian contracts data');
      setLoading(false);
    }
  };

  const handleUploadContract = async () => {
    try {
      await axios.post('http://localhost:9003/api/v11/contracts/ricardian/upload', uploadForm);

      // Reset form and close dialog
      setUploadForm({
        title: '',
        type: 'sale',
        parties: [''],
        legalJurisdiction: 'US',
        documentHash: ''
      });
      setUploadDialogOpen(false);

      // Refresh contracts list
      await fetchContracts();
    } catch (err) {
      console.error('Failed to upload contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload contract');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle color="success" />;
      case 'pending':
      case 'draft':
        return <Pending color="warning" />;
      case 'disputed':
      case 'cancelled':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'disputed':
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getVerificationColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ricardian Contracts Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !contractsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ricardian Contracts Dashboard
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchContracts}>
          Retry
        </Button>
      </Box>
    );
  }

  const contracts = contractsData?.contracts || [];
  const stats = {
    total: contractsData?.total || contracts.length,
    active: contractsData?.active || contracts.filter(c => c.status === 'active').length,
    pending: contractsData?.pending || contracts.filter(c => c.status === 'pending').length,
    completed: contractsData?.completed || contracts.filter(c => c.status === 'completed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ricardian Contracts Dashboard</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchContracts}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Upload />} onClick={() => setUploadDialogOpen(true)}>
            Upload Contract
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Contracts
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Contracts
              </Typography>
              <Typography variant="h4" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Pending Signatures
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h4">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Contracts
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Contract ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Parties</TableCell>
                      <TableCell>Signatures</TableCell>
                      <TableCell>Verification</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No contracts found. Upload a contract to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(contract.status)}
                              <Chip label={contract.status.toUpperCase()} size="small" color={getStatusColor(contract.status)} />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {contract.id.substring(0, 12)}...
                          </TableCell>
                          <TableCell>{contract.title}</TableCell>
                          <TableCell>
                            <Chip label={contract.type.toUpperCase()} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{contract.parties.length} parties</TableCell>
                          <TableCell>
                            <Chip
                              label={`${contract.signatures}/${contract.requiredSignatures}`}
                              size="small"
                              color={contract.signatures === contract.requiredSignatures ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contract.verificationStatus.toUpperCase()}
                              size="small"
                              color={getVerificationColor(contract.verificationStatus)}
                            />
                          </TableCell>
                          <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedContract(contract);
                                setViewDialogOpen(true);
                              }}
                              title="View Details"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton size="small" title="Download">
                              <Download />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Contract Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Ricardian Contract</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contract Title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Contract Type</InputLabel>
                <Select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  label="Contract Type"
                >
                  <MenuItem value="sale">Sale Agreement</MenuItem>
                  <MenuItem value="lease">Lease Agreement</MenuItem>
                  <MenuItem value="service">Service Agreement</MenuItem>
                  <MenuItem value="partnership">Partnership Agreement</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Legal Jurisdiction"
                value={uploadForm.legalJurisdiction}
                onChange={(e) => setUploadForm({ ...uploadForm, legalJurisdiction: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Document Hash (SHA-256)"
                value={uploadForm.documentHash}
                onChange={(e) => setUploadForm({ ...uploadForm, documentHash: e.target.value })}
                helperText="SHA-256 hash of the contract document for verification"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Contract Value (optional)"
                value={uploadForm.value || ''}
                onChange={(e) => setUploadForm({ ...uploadForm, value: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Currency (optional)"
                value={uploadForm.currency || ''}
                onChange={(e) => setUploadForm({ ...uploadForm, currency: e.target.value })}
                placeholder="USD"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                After uploading, all parties will need to sign the contract using their private keys.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadContract}
            disabled={!uploadForm.title || !uploadForm.documentHash}
          >
            Upload Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Contract Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedContract.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedContract.id}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={selectedContract.status.toUpperCase()} color={getStatusColor(selectedContract.status)} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Verification</Typography>
                  <Chip label={selectedContract.verificationStatus.toUpperCase()} color={getVerificationColor(selectedContract.verificationStatus)} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{selectedContract.type}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Jurisdiction</Typography>
                  <Typography variant="body1">{selectedContract.legalJurisdiction}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Parties ({selectedContract.parties.length})</Typography>
                  {selectedContract.parties.map((party, idx) => (
                    <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                      {party}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Signatures</Typography>
                  <Typography variant="body1">
                    {selectedContract.signatures} of {selectedContract.requiredSignatures} required signatures
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedContract.signatures / selectedContract.requiredSignatures) * 100}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Document Hash</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedContract.hash}
                  </Typography>
                </Paper>
              </Grid>
              {selectedContract.blockchainTxId && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Blockchain Transaction</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedContract.blockchainTxId}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{new Date(selectedContract.createdAt).toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2">{new Date(selectedContract.updatedAt).toLocaleString()}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download Contract
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RicardianContracts;
