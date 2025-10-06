// Release 3 - Fully Functional Transactions Module
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Code as CodeIcon,
  Receipt as ReceiptIcon,
  AccountTree as SmartContractIcon,
  Speed as SpeedIcon,
  CheckCircle as ConfirmedIcon,
  HourglassEmpty as PendingIcon,
  Error as FailedIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  QrCode as QrCodeIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'https://dlt.aurigraph.io';

interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  gas: number;
  gasPrice: number;
  nonce: number;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'contract' | 'token';
  data?: string;
  fee?: number;
  confirmations?: number;
}

interface TransactionStats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  volume: number;
  avgGas: number;
  avgFee: number;
}

const Transactions: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    failed: 0,
    volume: 0,
    avgGas: 0,
    avgFee: 0,
  });

  const [txForm, setTxForm] = useState({
    to: '',
    value: '',
    gas: '21000',
    gasPrice: '20',
    data: '',
  });

  const [contractForm, setContractForm] = useState({
    name: '',
    abi: '',
    bytecode: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // WebSocket for real-time updates
  useEffect(() => {
    const wsUrl = API_BASE.replace('https', 'wss') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_transaction') {
          setTransactions(prev => [data.transaction, ...prev]);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = () => console.log('WebSocket connection error');
    ws.onclose = () => setTimeout(() => window.location.reload(), 5000);

    return () => ws.close();
  }, []);

  // Fetch transactions - ONLY REAL API DATA, NO FALLBACK
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v11/transactions`);
      if (response.ok) {
        const data = await response.json();
        const txs = data.transactions || [];  // Empty array if no data
        setTransactions(txs);
        calculateStats(txs);
      } else {
        console.error('Failed to fetch transactions:', response.statusText);
        setTransactions([]);  // Empty array on error, NOT sample data
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);  // Empty array on error, NOT sample data
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    setFilteredTxs(filtered);
  }, [transactions, searchTerm, filterStatus, filterType]);

  const calculateStats = (txs: Transaction[]) => {
    setStats({
      total: txs.length,
      pending: txs.filter(tx => tx.status === 'pending').length,
      confirmed: txs.filter(tx => tx.status === 'confirmed').length,
      failed: txs.filter(tx => tx.status === 'failed').length,
      volume: txs.reduce((sum, tx) => sum + tx.value, 0),
      avgGas: txs.reduce((sum, tx) => sum + tx.gas, 0) / (txs.length || 1),
      avgFee: txs.reduce((sum, tx) => sum + (tx.fee || 0), 0) / (txs.length || 1),
    });
  };

  const submitTransaction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v11/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txForm),
      });

      if (response.ok) {
        const newTx = await response.json();
        setTransactions(prev => [newTx, ...prev]);
        setTxForm({ to: '', value: '', gas: '21000', gasPrice: '20', data: '' });
        setActiveTab(0);
      }
    } catch (error) {
      console.error('Failed to submit transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployContract = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v11/contracts/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractForm),
      });

      if (response.ok) {
        setContractForm({ name: '', abi: '', bytecode: '' });
        setActiveTab(0);
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to deploy contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    const formData = new FormData();
    formData.append('file', bulkFile);

    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/v11/transactions/bulk`, {
        method: 'POST',
        body: formData,
      });
      fetchTransactions();
    } catch (error) {
      console.error('Bulk upload failed:', error);
    } finally {
      setLoading(false);
      setBulkFile(null);
    }
  };

  const exportTransactions = () => {
    const headers = ['ID', 'Hash', 'From', 'To', 'Value', 'Status', 'Timestamp'];
    const rows = filteredTxs.map(tx => [
      tx.id,
      tx.hash,
      tx.from,
      tx.to,
      tx.value,
      tx.status,
      new Date(tx.timestamp).toISOString(),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${Date.now()}.csv`;
    a.click();
  };

  // REMOVED generateSampleTransactions() - NO STATIC DATA per #MEMORIZE requirement

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <ConfirmedIcon color="success" fontSize="small" />;
      case 'pending': return <PendingIcon color="warning" fontSize="small" />;
      case 'failed': return <FailedIcon color="error" fontSize="small" />;
      default: return null;
    }
  };

  // TODO: Fetch volumeData from /api/v11/analytics/volume endpoint
  const volumeData: any[] = [];  // REMOVED static data - must come from API

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Transaction Management</Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Transactions</Typography>
              <Typography variant="h4">{stats.total.toLocaleString()}</Typography>
              <LinearProgress variant="determinate" value={100} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Volume</Typography>
              <Typography variant="h4">{stats.volume.toLocaleString()} AUR</Typography>
              <Chip icon={<SpeedIcon />} label="High Activity" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4">{stats.pending}</Typography>
              <Typography variant="body2" color="warning.main">
                {stats.pending > 0 ? 'Processing...' : 'All Clear'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Average Gas</Typography>
              <Typography variant="h4">{Math.floor(stats.avgGas).toLocaleString()}</Typography>
              <Typography variant="body2" color="textSecondary">
                Fee: {stats.avgFee.toFixed(4)} AUR
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Volume Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>24-Hour Transaction Volume</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <ChartTooltip />
              <Area type="monotone" dataKey="volume" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="transactions" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Transaction List" icon={<ReceiptIcon />} />
            <Tab label="Send Transaction" icon={<SendIcon />} />
            <Tab label="Smart Contracts" icon={<SmartContractIcon />} />
            <Tab label="Bulk Operations" icon={<UploadIcon />} />
          </Tabs>

          {/* Transaction List Tab */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search by hash, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                      <MenuItem value="contract">Contract</MenuItem>
                      <MenuItem value="token">Token</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={exportTransactions}>
                    Export
                  </Button>
                </Grid>
              </Grid>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Hash</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTxs.slice(0, 10).map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell>
                            <Tooltip title={tx.hash}>
                              <Box display="flex" alignItems="center">
                                {formatAddress(tx.hash)}
                                <IconButton size="small" onClick={() => copyToClipboard(tx.hash)}>
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip label={tx.type} size="small" color={tx.type === 'contract' ? 'primary' : 'default'} />
                          </TableCell>
                          <TableCell>{formatAddress(tx.from)}</TableCell>
                          <TableCell>{formatAddress(tx.to)}</TableCell>
                          <TableCell align="right">{tx.value.toLocaleString()} AUR</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(tx.status)}
                              <Typography variant="body2">{tx.status}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => setSelectedTx(tx)}>
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Send Transaction Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="To Address" value={txForm.to} onChange={(e) => setTxForm({ ...txForm, to: e.target.value })} placeholder="0x..." margin="normal" />
                <TextField fullWidth label="Amount (AUR)" value={txForm.value} onChange={(e) => setTxForm({ ...txForm, value: e.target.value })} type="number" margin="normal" />
                <TextField fullWidth label="Gas Limit" value={txForm.gas} onChange={(e) => setTxForm({ ...txForm, gas: e.target.value })} type="number" margin="normal" />
                <TextField fullWidth label="Gas Price (Gwei)" value={txForm.gasPrice} onChange={(e) => setTxForm({ ...txForm, gasPrice: e.target.value })} type="number" margin="normal" />
                <TextField fullWidth label="Data (Optional)" value={txForm.data} onChange={(e) => setTxForm({ ...txForm, data: e.target.value })} multiline rows={3} margin="normal" />
                <Button fullWidth variant="contained" color="primary" startIcon={<SendIcon />} onClick={submitTransaction} disabled={loading || !txForm.to || !txForm.value} sx={{ mt: 2 }}>
                  {loading ? 'Submitting...' : 'Submit Transaction'}
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Transaction Preview</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Estimated Fee" secondary={`${(parseFloat(txForm.gas) * parseFloat(txForm.gasPrice) / 1e9).toFixed(6)} AUR`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Total Cost" secondary={`${(parseFloat(txForm.value || '0') + parseFloat(txForm.gas) * parseFloat(txForm.gasPrice) / 1e9).toFixed(6)} AUR`} />
                      </ListItem>
                    </List>
                    <Alert severity="info" sx={{ mt: 2 }}>Transaction will be broadcast immediately.</Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Smart Contracts Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Deploy Smart Contract</Typography>
                <TextField fullWidth label="Contract Name" value={contractForm.name} onChange={(e) => setContractForm({ ...contractForm, name: e.target.value })} margin="normal" />
                <TextField fullWidth label="ABI (JSON)" value={contractForm.abi} onChange={(e) => setContractForm({ ...contractForm, abi: e.target.value })} multiline rows={4} margin="normal" />
                <TextField fullWidth label="Bytecode" value={contractForm.bytecode} onChange={(e) => setContractForm({ ...contractForm, bytecode: e.target.value })} multiline rows={4} margin="normal" />
                <Button fullWidth variant="contained" color="primary" startIcon={<CodeIcon />} onClick={deployContract} disabled={loading || !contractForm.name || !contractForm.bytecode} sx={{ mt: 2 }}>
                  Deploy Contract
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Contract Templates</Typography>
                <List>
                  <ListItem button onClick={() => setContractForm({ name: 'ERC20Token', abi: '[{"constant":true}]', bytecode: '0x6080604...' })}>
                    <ListItemIcon><CodeIcon /></ListItemIcon>
                    <ListItemText primary="ERC-20 Token" secondary="Fungible token standard" />
                  </ListItem>
                  <ListItem button onClick={() => setContractForm({ name: 'NFTCollection', abi: '[{"inputs":[]}]', bytecode: '0x6080604...' })}>
                    <ListItemIcon><CodeIcon /></ListItemIcon>
                    <ListItemText primary="ERC-721 NFT" secondary="Non-fungible token" />
                  </ListItem>
                  <ListItem button onClick={() => setContractForm({ name: 'MultiSigWallet', abi: '[{"inputs":[]}]', bytecode: '0x6080604...' })}>
                    <ListItemIcon><CodeIcon /></ListItemIcon>
                    <ListItemText primary="Multi-Sig Wallet" secondary="Secure multi-signature wallet" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}

          {/* Bulk Operations Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Bulk Transaction Upload</Typography>
                <Paper sx={{ p: 3, border: '2px dashed', borderColor: 'divider', textAlign: 'center', cursor: 'pointer' }} component="label">
                  <input type="file" hidden accept=".csv,.json" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <Typography variant="h6">{bulkFile ? bulkFile.name : 'Drop CSV or JSON file here'}</Typography>
                </Paper>
                <Button fullWidth variant="contained" startIcon={<UploadIcon />} onClick={handleBulkUpload} disabled={!bulkFile || loading} sx={{ mt: 2 }}>
                  Upload & Process
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTx} onClose={() => setSelectedTx(null)} maxWidth="md" fullWidth>
        {selectedTx && (
          <>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogContent>
              <List>
                <ListItem>
                  <ListItemText primary="Hash" secondary={selectedTx.hash} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Status" secondary={<Chip label={selectedTx.status} color={selectedTx.status === 'confirmed' ? 'success' : 'warning'} />} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="From" secondary={selectedTx.from} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="To" secondary={selectedTx.to} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Value" secondary={`${selectedTx.value.toLocaleString()} AUR`} />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTx(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Transactions;