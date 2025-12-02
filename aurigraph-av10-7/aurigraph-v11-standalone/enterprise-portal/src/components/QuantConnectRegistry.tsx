import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Paper, Chip, Alert, CircularProgress, Tabs, Tab, List, ListItem,
  ListItemText, Divider, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Badge, Switch, FormControlLabel
} from '@mui/material';
import {
  AccountTree, VerifiedUser, CheckCircle, Error, ContentCopy,
  Security, Info, TrendingUp, TrendingDown,
  PlayArrow, Stop, Refresh, ShowChart, AccountBalance, Receipt,
  Search, Visibility
} from '@mui/icons-material';
import { apiService, safeApiCall } from '../services/api';

// Type definitions
interface RegistryStats {
  totalEquities: number;
  totalTransactions: number;
  merkleRoot: string;
  treeHeight: number;
  lastUpdate: string;
  registeredSymbols: number;
}

interface TokenizedEquity {
  tokenId: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  merkleProof: string;
  registeredAt: string;
  blockNumber: number;
  verified: boolean;
}

interface TokenizedTransaction {
  tokenId: string;
  transactionId: string;
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  value: number;
  merkleProof: string;
  registeredAt: string;
  blockNumber: number;
}

interface SlimNodeStatus {
  slimNodeId: string;
  running: boolean;
  messagesProcessed: number;
  tokenizationsCompleted: number;
  totalEquities: number;
  totalTransactions: number;
  merkleRoot: string;
  uptimeSeconds: number;
  pollIntervalSeconds: number;
  trackedSymbols: number;
  timestamp: string;
}

interface NavigationData {
  totalEntries: number;
  merkleRoot: string;
  treeHeight: number;
  categories: {
    [key: string]: number;
  };
  recentTokenizations: Array<{
    tokenId: string;
    type: string;
    symbol: string;
    registeredAt: string;
  }>;
}

const QuantConnectRegistry: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registry data state
  const [registryStats, setRegistryStats] = useState<RegistryStats | null>(null);
  const [equities, setEquities] = useState<TokenizedEquity[]>([]);
  const [transactions, setTransactions] = useState<TokenizedTransaction[]>([]);
  const [slimNodeStatus, setSlimNodeStatus] = useState<SlimNodeStatus | null>(null);
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);

  // Search & filter state
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchTokenId, setSearchTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [selectedEquity, setSelectedEquity] = useState<TokenizedEquity | null>(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch registry data
  const fetchRegistryData = useCallback(async () => {
    const [statsResult, navResult, nodeResult, equityResult, txResult] = await Promise.all([
      safeApiCall(() => apiService.getQuantConnectRegistryStats(), { totalEquities: 0, totalTransactions: 0, merkleRoot: '', treeHeight: 0, lastUpdate: new Date().toISOString(), registeredSymbols: 0 }),
      safeApiCall(() => apiService.getQuantConnectNavigation(), { totalEntries: 0, merkleRoot: '', treeHeight: 0, categories: {}, recentTokenizations: [] }),
      safeApiCall(() => apiService.getQuantConnectSlimNodeStatus(), { slimNodeId: 'slim-node-1', running: false, messagesProcessed: 0, tokenizationsCompleted: 0, totalEquities: 0, totalTransactions: 0, merkleRoot: '', uptimeSeconds: 0, pollIntervalSeconds: 60, trackedSymbols: 0, timestamp: new Date().toISOString() }),
      safeApiCall(() => apiService.getQuantConnectEquities(), { equities: [] }),
      safeApiCall(() => apiService.getQuantConnectTransactions(), { transactions: [] })
    ]);

    // Update state with successful results
    if (statsResult.success) setRegistryStats(statsResult.data);
    if (navResult.success) setNavigationData(navResult.data);
    if (nodeResult.success) setSlimNodeStatus(nodeResult.data);
    if (equityResult.success) setEquities(equityResult.data.equities || []);
    if (txResult.success) setTransactions(txResult.data.transactions || []);

    // Set error if any request failed
    const failedRequests = [statsResult, navResult, nodeResult, equityResult, txResult].filter(r => !r.success);
    if (failedRequests.length > 0) {
      setError(failedRequests[0].error?.message || 'Failed to load QuantConnect registry data');
    } else {
      setError(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRegistryData();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchRegistryData, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchRegistryData, autoRefresh]);

  // Handle search by symbol
  const handleSearchBySymbol = async () => {
    if (!searchSymbol.trim()) return;

    setLoading(true);
    const result = await safeApiCall(
      () => apiService.getQuantConnectBySymbol(searchSymbol.toUpperCase()),
      { symbol: searchSymbol, equities: [] }
    );

    if (result.success) {
      if (result.data.equities?.length > 0) {
        setSelectedEquity(result.data.equities[0]);
        setError(null);
      } else {
        setError(`No tokenized equity found for symbol: ${searchSymbol}`);
      }
    } else {
      setError(result.error?.message || 'Search failed');
    }
    setLoading(false);
  };

  // Handle token verification
  const handleVerifyToken = async () => {
    if (!searchTokenId.trim()) return;

    setLoading(true);
    const result = await safeApiCall(
      () => apiService.verifyQuantConnectToken(searchTokenId),
      { valid: false, message: 'Verification failed' }
    );

    if (result.success) {
      setVerificationResult(result.data);
      setError(null);
    } else {
      setError(result.error?.message || 'Verification failed');
      setVerificationResult(null);
    }
    setLoading(false);
  };

  // Handle Slim Node control
  const handleStartSlimNode = async () => {
    const result = await safeApiCall(
      () => apiService.startQuantConnectSlimNode(),
      { success: false }
    );

    if (result.success) {
      fetchRegistryData();
      setError(null);
    } else {
      setError(result.error?.message || 'Failed to start Slim Node');
    }
  };

  const handleStopSlimNode = async () => {
    const result = await safeApiCall(
      () => apiService.stopQuantConnectSlimNode(),
      { success: false }
    );

    if (result.success) {
      fetchRegistryData();
      setError(null);
    } else {
      setError(result.error?.message || 'Failed to stop Slim Node');
    }
  };

  // Handle manual equity processing
  const handleProcessEquities = async () => {
    setLoading(true);
    const result = await safeApiCall(
      () => apiService.processQuantConnectEquities(),
      { success: false }
    );

    if (result.success) {
      fetchRegistryData();
      setError(null);
    } else {
      setError(result.error?.message || 'Failed to process equities');
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string, length: number = 16) => {
    if (!hash) return 'N/A';
    return hash.length > length ? `${hash.substring(0, length)}...${hash.substring(hash.length - 8)}` : hash;
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  if (loading && !registryStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading QuantConnect Registry...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
          QuantConnect Equity Tokenization Registry
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          <IconButton onClick={fetchRegistryData} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.dark', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Equities</Typography>
              <Typography variant="h4">{registryStats?.totalEquities || 0}</Typography>
              <Chip
                icon={<AccountBalance sx={{ fontSize: 16 }} />}
                label="Tokenized"
                size="small"
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'secondary.dark', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Transactions</Typography>
              <Typography variant="h4">{registryStats?.totalTransactions || 0}</Typography>
              <Chip
                icon={<Receipt sx={{ fontSize: 16 }} />}
                label="Recorded"
                size="small"
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Merkle Tree Height</Typography>
              <Typography variant="h4">{registryStats?.treeHeight || 0}</Typography>
              <Chip
                icon={<AccountTree sx={{ fontSize: 16 }} />}
                label={`${registryStats?.registeredSymbols || 0} Symbols`}
                size="small"
                color="primary"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Slim Node</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge
                  color={slimNodeStatus?.running ? 'success' : 'error'}
                  variant="dot"
                />
                <Typography variant="h6">
                  {slimNodeStatus?.running ? 'Running' : 'Stopped'}
                </Typography>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleStartSlimNode}
                  disabled={slimNodeStatus?.running}
                >
                  Start
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopSlimNode}
                  disabled={!slimNodeStatus?.running}
                >
                  Stop
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Merkle Root Display */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
            Current Merkle Root
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', fontFamily: 'monospace' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', flex: 1 }}>
                {registryStats?.merkleRoot || 'No root computed yet'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(registryStats?.merkleRoot || '')}
                sx={{ color: 'white', ml: 1 }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Last updated: {registryStats?.lastUpdate ? new Date(registryStats.lastUpdate).toLocaleString() : 'N/A'}
          </Typography>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Tokenized Equities" icon={<ShowChart />} iconPosition="start" />
            <Tab label="Transaction Registry" icon={<Receipt />} iconPosition="start" />
            <Tab label="Search & Verify" icon={<Search />} iconPosition="start" />
            <Tab label="Slim Node Control" icon={<AccountTree />} iconPosition="start" />
          </Tabs>

          {/* Tab 0: Tokenized Equities */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Tokenized Equities on Merkle Tree</Typography>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={handleProcessEquities}
                  disabled={loading}
                >
                  Fetch & Tokenize Latest
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.dark' }}>
                      <TableCell sx={{ color: 'white' }}>Symbol</TableCell>
                      <TableCell sx={{ color: 'white' }}>Price</TableCell>
                      <TableCell sx={{ color: 'white' }}>Change</TableCell>
                      <TableCell sx={{ color: 'white' }}>Volume</TableCell>
                      <TableCell sx={{ color: 'white' }}>Market Cap</TableCell>
                      <TableCell sx={{ color: 'white' }}>Token ID</TableCell>
                      <TableCell sx={{ color: 'white' }}>Block #</TableCell>
                      <TableCell sx={{ color: 'white' }}>Verified</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {equities.length > 0 ? equities.map((equity) => (
                      <TableRow key={equity.tokenId} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography fontWeight="bold">{equity.symbol}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {equity.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>${equity.price?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {equity.change >= 0 ? (
                              <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                            ) : (
                              <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                            )}
                            <Typography color={equity.change >= 0 ? 'success.main' : 'error.main'}>
                              {equity.changePercent?.toFixed(2) || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{equity.volume?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>{formatNumber(equity.marketCap || 0)}</TableCell>
                        <TableCell>
                          <Tooltip title={equity.tokenId}>
                            <Typography variant="caption" fontFamily="monospace">
                              {truncateHash(equity.tokenId, 12)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{equity.blockNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {equity.verified ? (
                            <CheckCircle color="success" />
                          ) : (
                            <Error color="warning" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedEquity(equity)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(equity.tokenId)}
                          >
                            <ContentCopy />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography color="text.secondary">
                            No tokenized equities yet. Click "Fetch & Tokenize Latest" to start.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 1: Transaction Registry */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Tokenized Transaction Feed</Typography>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'secondary.dark' }}>
                      <TableCell sx={{ color: 'white' }}>Transaction ID</TableCell>
                      <TableCell sx={{ color: 'white' }}>Symbol</TableCell>
                      <TableCell sx={{ color: 'white' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white' }}>Price</TableCell>
                      <TableCell sx={{ color: 'white' }}>Quantity</TableCell>
                      <TableCell sx={{ color: 'white' }}>Value</TableCell>
                      <TableCell sx={{ color: 'white' }}>Token ID</TableCell>
                      <TableCell sx={{ color: 'white' }}>Block #</TableCell>
                      <TableCell sx={{ color: 'white' }}>Registered At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length > 0 ? transactions.map((tx) => (
                      <TableRow key={tx.tokenId} hover>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {truncateHash(tx.transactionId, 12)}
                          </Typography>
                        </TableCell>
                        <TableCell>{tx.symbol}</TableCell>
                        <TableCell>
                          <Chip
                            label={tx.type}
                            size="small"
                            color={tx.type === 'BUY' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>${tx.price?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>{tx.quantity?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>${tx.value?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          <Tooltip title={tx.tokenId}>
                            <Typography variant="caption" fontFamily="monospace">
                              {truncateHash(tx.tokenId, 12)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{tx.blockNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {tx.registeredAt ? new Date(tx.registeredAt).toLocaleString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography color="text.secondary">
                            No tokenized transactions yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: Search & Verify */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Search by Symbol
                    </Typography>
                    <TextField
                      fullWidth
                      label="Stock Symbol"
                      value={searchSymbol}
                      onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL, GOOGL, MSFT"
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearchBySymbol}
                      disabled={loading || !searchSymbol.trim()}
                      startIcon={<Search />}
                    >
                      Search
                    </Button>

                    {selectedEquity && (
                      <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {selectedEquity.symbol} - {selectedEquity.name}
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="Price" secondary={`$${selectedEquity.price?.toFixed(2)}`} />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Token ID" secondary={selectedEquity.tokenId} />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Merkle Proof"
                              secondary={truncateHash(selectedEquity.merkleProof, 32)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Verified"
                              secondary={selectedEquity.verified ? 'Yes' : 'No'}
                            />
                          </ListItem>
                        </List>
                      </Paper>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Verify Token
                    </Typography>
                    <TextField
                      fullWidth
                      label="Token ID"
                      value={searchTokenId}
                      onChange={(e) => setSearchTokenId(e.target.value)}
                      placeholder="Enter token ID to verify"
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleVerifyToken}
                      disabled={loading || !searchTokenId.trim()}
                      startIcon={<VerifiedUser />}
                    >
                      Verify
                    </Button>

                    {verificationResult && (
                      <Alert
                        severity={verificationResult.valid ? 'success' : 'error'}
                        sx={{ mt: 2 }}
                      >
                        <Typography variant="subtitle2">
                          {verificationResult.valid ? 'Token Verified!' : 'Verification Failed'}
                        </Typography>
                        <Typography variant="body2">
                          {verificationResult.message}
                        </Typography>
                        {verificationResult.merkleRoot && (
                          <Typography variant="caption" fontFamily="monospace" display="block">
                            Merkle Root: {truncateHash(verificationResult.merkleRoot, 24)}
                          </Typography>
                        )}
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 3: Slim Node Control */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <AccountTree sx={{ mr: 1, verticalAlign: 'middle' }} />
                Slim Node Data Feed Status
              </Typography>

              {slimNodeStatus && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Node Information</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Node ID"
                            secondary={slimNodeStatus.slimNodeId}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Status"
                            secondary={
                              <Chip
                                label={slimNodeStatus.running ? 'Running' : 'Stopped'}
                                color={slimNodeStatus.running ? 'success' : 'error'}
                                size="small"
                              />
                            }
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Uptime"
                            secondary={`${Math.floor(slimNodeStatus.uptimeSeconds / 3600)}h ${Math.floor((slimNodeStatus.uptimeSeconds % 3600) / 60)}m`}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Poll Interval"
                            secondary={`${slimNodeStatus.pollIntervalSeconds} seconds`}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Processing Statistics</Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Messages Processed"
                            secondary={slimNodeStatus.messagesProcessed.toLocaleString()}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Tokenizations Completed"
                            secondary={slimNodeStatus.tokenizationsCompleted.toLocaleString()}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Total Equities"
                            secondary={slimNodeStatus.totalEquities}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Total Transactions"
                            secondary={slimNodeStatus.totalTransactions}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Tracked Symbols"
                            secondary={slimNodeStatus.trackedSymbols}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Current Merkle Root</Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.900', fontFamily: 'monospace' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', color: 'success.light' }}>
                          {slimNodeStatus.merkleRoot || 'No root computed yet'}
                        </Typography>
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Last update: {new Date(slimNodeStatus.timestamp).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleStartSlimNode}
                  disabled={slimNodeStatus?.running}
                >
                  Start Data Feed
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopSlimNode}
                  disabled={!slimNodeStatus?.running}
                >
                  Stop Data Feed
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleProcessEquities}
                >
                  Manual Process
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation Panel */}
      {navigationData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
              Registry Navigation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Entries</Typography>
                  <Typography variant="h5">{navigationData.totalEntries}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Tree Height</Typography>
                  <Typography variant="h5">{navigationData.treeHeight}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Categories</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {navigationData.categories && Object.entries(navigationData.categories).map(([cat, count]) => (
                      <Chip key={cat} label={`${cat}: ${count}`} size="small" />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {navigationData.recentTokenizations?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recent Tokenizations
                </Typography>
                <List dense>
                  {navigationData.recentTokenizations.slice(0, 5).map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${item.symbol} (${item.type})`}
                        secondary={`Token: ${truncateHash(item.tokenId, 16)} - ${new Date(item.registeredAt).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default QuantConnectRegistry;
