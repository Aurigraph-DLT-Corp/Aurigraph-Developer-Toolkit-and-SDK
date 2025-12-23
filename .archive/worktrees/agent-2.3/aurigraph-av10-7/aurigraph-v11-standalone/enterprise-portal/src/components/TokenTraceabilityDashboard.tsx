import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TokenTrace {
  trace_id: string;
  token_id: string;
  asset_id: string;
  asset_type: string;
  verification_status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  proof_valid: boolean;
  asset_verified: boolean;
  owner_address: string;
  fractional_ownership: number;
  token_value_usd: number;
  last_verified_timestamp?: string;
  ownership_history: Array<{
    transfer_id: string;
    from_address: string;
    to_address: string;
    timestamp: string;
    ownership_percentage: number;
  }>;
  audit_trail: Array<{
    entry_id: string;
    timestamp: string;
    action: string;
    actor: string;
    status: string;
  }>;
}

interface TraceStatistics {
  total_traces: number;
  verified_traces: number;
  pending_verification: number;
  verified_assets: number;
  total_ownership_transfers: number;
  total_audit_entries: number;
}

/**
 * TokenTraceabilityDashboard - Main dashboard component for token traceability
 * Displays token traces, verification status, merkle proofs, and ownership history
 *
 * @component
 */
const TokenTraceabilityDashboard: React.FC = () => {
  const [traces, setTraces] = useState<TokenTrace[]>([]);
  const [statistics, setStatistics] = useState<TraceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTokenId, setSearchTokenId] = useState('');
  const [filterAssetType, setFilterAssetType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTrace, setSelectedTrace] = useState<TokenTrace | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const API_BASE = 'http://localhost:9003/api/v11/traceability';

  // Fetch all token traces
  const fetchAllTraces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/tokens`);
      if (!response.ok) throw new Error('Failed to fetch traces');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/statistics`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  // Fetch specific token trace
  const fetchTokenTrace = async (tokenId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/tokens/${tokenId}`);
      if (!response.ok) throw new Error('Token trace not found');
      const data = await response.json();
      setSelectedTrace(data);
      setOpenDetailsDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token trace');
    } finally {
      setLoading(false);
    }
  };

  // Filter traces by asset type
  const fetchByAssetType = async (assetType: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/tokens/type/${assetType}`);
      if (!response.ok) throw new Error('Failed to fetch traces by asset type');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter traces by verification status
  const fetchByStatus = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/tokens/status/${status}`);
      if (!response.ok) throw new Error('Failed to fetch traces by status');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    fetchAllTraces();
    fetchStatistics();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTokenId.trim()) {
      fetchTokenTrace(searchTokenId);
    }
  };

  // Handle filter change
  const handleAssetTypeChange = (e: any) => {
    const value = e.target.value;
    setFilterAssetType(value);
    if (value) {
      fetchByAssetType(value);
    } else {
      fetchAllTraces();
    }
  };

  // Handle status filter change
  const handleStatusChange = (e: any) => {
    const value = e.target.value;
    setFilterStatus(value);
    if (value) {
      fetchByStatus(value);
    } else {
      fetchAllTraces();
    }
  };

  // Get status color and icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <VerifiedIcon sx={{ color: '#4caf50' }} />;
      case 'REJECTED':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'PENDING':
      case 'IN_REVIEW':
        return <PendingIcon sx={{ color: '#ff9800' }} />;
      default:
        return <InfoIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      case 'IN_REVIEW':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Prepare chart data
  const chartData = traces.slice(0, 10).map((trace) => ({
    tokenId: trace.token_id.substring(0, 8),
    ownership: trace.fractional_ownership,
    verified: trace.asset_verified ? 100 : 0,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Token Traceability Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor and manage token-to-asset linkage with merkle tree verification
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {statistics.total_traces}
              </Typography>
              <Typography variant="caption">Total Token Traces</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {statistics.verified_traces}
              </Typography>
              <Typography variant="caption">Verified Assets</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {statistics.pending_verification}
              </Typography>
              <Typography variant="caption">Pending Verification</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {statistics.total_ownership_transfers}
              </Typography>
              <Typography variant="caption">Total Transfers</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} component="form" onSubmit={handleSearch}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Token ID"
              value={searchTokenId}
              onChange={(e) => setSearchTokenId(e.target.value)}
              placeholder="TOKEN-RE-001"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={filterAssetType}
                onChange={handleAssetTypeChange}
                label="Asset Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="REAL_ESTATE">Real Estate</MenuItem>
                <MenuItem value="CARBON_CREDIT">Carbon Credit</MenuItem>
                <MenuItem value="ART_COLLECTIBLE">Art Collectible</MenuItem>
                <MenuItem value="COMMODITY">Commodity</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_REVIEW">In Review</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mr: 1 }}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTokenId('');
                setFilterAssetType('');
                setFilterStatus('');
                fetchAllTraces();
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts */}
      {chartData.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Ownership Distribution (Top 10)" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tokenId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ownership" fill="#8884d8" name="Ownership %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Verification Status (Top 10)" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tokenId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="verified" fill="#82ca9d" name="Verified %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Token Traces Table */}
      <Card>
        <CardHeader
          title="Token Traces"
          action={
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                fetchAllTraces();
                fetchStatistics();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          {loading && <CircularProgress />}
          {!loading && traces.length === 0 && (
            <Typography color="textSecondary">No token traces found</Typography>
          )}
          {!loading && traces.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Token ID</TableCell>
                    <TableCell>Asset Type</TableCell>
                    <TableCell>Verification Status</TableCell>
                    <TableCell>Owner Address</TableCell>
                    <TableCell>Ownership %</TableCell>
                    <TableCell>Value (USD)</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {traces.map((trace) => (
                    <TableRow key={trace.trace_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                        {trace.token_id}
                      </TableCell>
                      <TableCell>{trace.asset_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={trace.verification_status}
                          color={getStatusColor(trace.verification_status)}
                          size="small"
                          icon={getStatusIcon(trace.verification_status)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75em' }}>
                        {trace.owner_address.substring(0, 10)}...
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {trace.fractional_ownership.toFixed(2)}%
                          <LinearProgress
                            variant="determinate"
                            value={trace.fractional_ownership}
                            sx={{ width: 50 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>${trace.token_value_usd?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => fetchTokenTrace(trace.token_id)}
                        >
                          View
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

      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Token Trace Details - {selectedTrace?.token_id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTrace && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Basic Info */}
              <Card>
                <CardHeader title="Basic Information" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">
                        Token ID
                      </Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                        {selectedTrace.token_id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">
                        Asset ID
                      </Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                        {selectedTrace.asset_id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">
                        Asset Type
                      </Typography>
                      <Typography>{selectedTrace.asset_type}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">
                        Verification Status
                      </Typography>
                      <Chip
                        label={selectedTrace.verification_status}
                        color={getStatusColor(selectedTrace.verification_status)}
                        size="small"
                        icon={getStatusIcon(selectedTrace.verification_status)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Ownership History */}
              {selectedTrace.ownership_history && selectedTrace.ownership_history.length > 0 && (
                <Card>
                  <CardHeader title="Ownership History" />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Ownership %</TableCell>
                            <TableCell>Timestamp</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTrace.ownership_history.map((transfer) => (
                            <TableRow key={transfer.transfer_id}>
                              <TableCell sx={{ fontSize: '0.8em' }}>
                                {transfer.from_address.substring(0, 8)}...
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8em' }}>
                                {transfer.to_address.substring(0, 8)}...
                              </TableCell>
                              <TableCell>{transfer.ownership_percentage.toFixed(2)}%</TableCell>
                              <TableCell sx={{ fontSize: '0.75em' }}>
                                {new Date(transfer.timestamp).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Audit Trail */}
              {selectedTrace.audit_trail && selectedTrace.audit_trail.length > 0 && (
                <Card>
                  <CardHeader title="Audit Trail" />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Actor</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Timestamp</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTrace.audit_trail.map((entry) => (
                            <TableRow key={entry.entry_id}>
                              <TableCell>{entry.action}</TableCell>
                              <TableCell sx={{ fontSize: '0.8em' }}>{entry.actor}</TableCell>
                              <TableCell>
                                <Chip
                                  label={entry.status}
                                  size="small"
                                  color={entry.status === 'SUCCESS' ? 'success' : 'error'}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75em' }}>
                                {new Date(entry.timestamp).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TokenTraceabilityDashboard;
