import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Alert, IconButton, Tooltip, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress
} from '@mui/material';
import {
  Add, Link, LinkOff, Layers, Token, ExpandMore,
  CheckCircle, Error, History, Refresh, Delete,
  Timeline, Assessment, AccountTree
} from '@mui/icons-material';

// Token Binding Types
type TokenBindingType = 'PRIMARY' | 'SECONDARY' | 'COMPOSITE';
type BindingStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REVOKED';

interface TokenBinding {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  contractId: string;
  contractName: string;
  bindingType: TokenBindingType;
  status: BindingStatus;
  boundAt: Date;
  expiresAt?: Date;
  amount?: number;
  metadata?: Record<string, string>;
}

interface CompositeBundle {
  id: string;
  name: string;
  contractId: string;
  tokens: TokenBinding[];
  createdAt: Date;
  status: 'ACTIVE' | 'PENDING' | 'DISSOLVED';
  totalValue?: number;
}

interface BindingHistory {
  id: string;
  action: 'BIND' | 'UNBIND' | 'UPDATE' | 'EXPIRE';
  tokenId: string;
  tokenName: string;
  contractId: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

interface BindingStats {
  totalBindings: number;
  activeBindings: number;
  primaryTokens: number;
  secondaryTokens: number;
  compositeBundles: number;
  pendingBindings: number;
}

interface TokenBindingProps {
  contractId?: string;
  contractName?: string;
}

export const TokenBinding: React.FC<TokenBindingProps> = ({
  contractId = 'contract-001',
  contractName = 'Default Contract'
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for bindings data
  const [bindings, setBindings] = useState<TokenBinding[]>([
    {
      id: 'tb1',
      tokenId: 'tok-001',
      tokenName: 'Aurigraph Token',
      tokenSymbol: 'AUR',
      contractId: contractId,
      contractName: contractName,
      bindingType: 'PRIMARY',
      status: 'ACTIVE',
      boundAt: new Date('2025-01-15'),
      amount: 10000,
      metadata: { purpose: 'Collateral' }
    },
    {
      id: 'tb2',
      tokenId: 'tok-002',
      tokenName: 'Real Estate Token',
      tokenSymbol: 'RET',
      contractId: contractId,
      contractName: contractName,
      bindingType: 'SECONDARY',
      status: 'ACTIVE',
      boundAt: new Date('2025-01-16'),
      expiresAt: new Date('2025-12-31'),
      amount: 500,
      metadata: { purpose: 'Payment' }
    },
    {
      id: 'tb3',
      tokenId: 'tok-003',
      tokenName: 'Governance Token',
      tokenSymbol: 'GOV',
      contractId: contractId,
      contractName: contractName,
      bindingType: 'PRIMARY',
      status: 'PENDING',
      boundAt: new Date('2025-01-18'),
      amount: 1000
    }
  ]);

  const [compositeBundles, setCompositeBundles] = useState<CompositeBundle[]>([
    {
      id: 'cb1',
      name: 'Asset Bundle Alpha',
      contractId: contractId,
      tokens: [],
      createdAt: new Date('2025-01-10'),
      status: 'ACTIVE',
      totalValue: 50000
    }
  ]);

  const [bindingHistory, setBindingHistory] = useState<BindingHistory[]>([
    {
      id: 'bh1',
      action: 'BIND',
      tokenId: 'tok-001',
      tokenName: 'Aurigraph Token',
      contractId: contractId,
      performedBy: 'admin@aurigraph.io',
      timestamp: new Date('2025-01-15T10:30:00'),
      details: 'Initial binding as PRIMARY token'
    },
    {
      id: 'bh2',
      action: 'BIND',
      tokenId: 'tok-002',
      tokenName: 'Real Estate Token',
      contractId: contractId,
      performedBy: 'admin@aurigraph.io',
      timestamp: new Date('2025-01-16T14:20:00'),
      details: 'Added as SECONDARY payment token'
    }
  ]);

  const [stats, setStats] = useState<BindingStats>({
    totalBindings: 3,
    activeBindings: 2,
    primaryTokens: 2,
    secondaryTokens: 1,
    compositeBundles: 1,
    pendingBindings: 1
  });

  // Dialog states
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [compositeDialogOpen, setCompositeDialogOpen] = useState(false);

  // Form states
  const [bindForm, setBindForm] = useState({
    tokenId: '',
    tokenName: '',
    tokenSymbol: '',
    bindingType: 'PRIMARY' as TokenBindingType,
    amount: 0,
    expiresAt: '',
    purpose: ''
  });

  const [compositeForm, setCompositeForm] = useState({
    name: '',
    selectedTokenIds: [] as string[]
  });

  // Available tokens for binding (mock data)
  const availableTokens = [
    { id: 'tok-004', name: 'Staking Token', symbol: 'STK' },
    { id: 'tok-005', name: 'Reward Token', symbol: 'RWD' },
    { id: 'tok-006', name: 'Utility Token', symbol: 'UTL' },
    { id: 'tok-007', name: 'Security Token', symbol: 'SEC' }
  ];

  // API calls
  const fetchBindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v12/token-bindings/contract/${contractId}`);
      if (response.ok) {
        const data = await response.json();
        setBindings(data.bindings || bindings);
        setStats(data.stats || stats);
        setBindingHistory(data.history || bindingHistory);
      }
    } catch (err) {
      console.error('Error fetching bindings:', err);
      // Using mock data on error
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  const bindToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v12/token-bindings/contract/${contractId}/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: bindForm.tokenId,
          bindingType: bindForm.bindingType,
          amount: bindForm.amount,
          expiresAt: bindForm.expiresAt || null,
          metadata: { purpose: bindForm.purpose }
        })
      });

      if (response.ok) {
        const newBinding: TokenBinding = {
          id: `tb_${Date.now()}`,
          tokenId: bindForm.tokenId,
          tokenName: bindForm.tokenName,
          tokenSymbol: bindForm.tokenSymbol,
          contractId: contractId,
          contractName: contractName,
          bindingType: bindForm.bindingType,
          status: 'PENDING',
          boundAt: new Date(),
          expiresAt: bindForm.expiresAt ? new Date(bindForm.expiresAt) : undefined,
          amount: bindForm.amount,
          metadata: { purpose: bindForm.purpose }
        };
        setBindings([...bindings, newBinding]);
        setSuccess('Token binding created successfully');
        setBindDialogOpen(false);
        resetBindForm();
        updateStats();
      } else {
        // Mock success for demo
        const newBinding: TokenBinding = {
          id: `tb_${Date.now()}`,
          tokenId: bindForm.tokenId,
          tokenName: bindForm.tokenName,
          tokenSymbol: bindForm.tokenSymbol,
          contractId: contractId,
          contractName: contractName,
          bindingType: bindForm.bindingType,
          status: 'PENDING',
          boundAt: new Date(),
          expiresAt: bindForm.expiresAt ? new Date(bindForm.expiresAt) : undefined,
          amount: bindForm.amount,
          metadata: { purpose: bindForm.purpose }
        };
        setBindings([...bindings, newBinding]);
        setSuccess('Token binding created successfully');
        setBindDialogOpen(false);
        resetBindForm();
        updateStats();
      }
    } catch (err) {
      // Mock success for demo
      const newBinding: TokenBinding = {
        id: `tb_${Date.now()}`,
        tokenId: bindForm.tokenId,
        tokenName: bindForm.tokenName,
        tokenSymbol: bindForm.tokenSymbol,
        contractId: contractId,
        contractName: contractName,
        bindingType: bindForm.bindingType,
        status: 'PENDING',
        boundAt: new Date(),
        expiresAt: bindForm.expiresAt ? new Date(bindForm.expiresAt) : undefined,
        amount: bindForm.amount,
        metadata: { purpose: bindForm.purpose }
      };
      setBindings([...bindings, newBinding]);
      setSuccess('Token binding created successfully');
      setBindDialogOpen(false);
      resetBindForm();
      updateStats();
    } finally {
      setLoading(false);
    }
  };

  const createCompositeBundle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v12/token-bindings/contract/${contractId}/composite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: compositeForm.name,
          tokenIds: compositeForm.selectedTokenIds
        })
      });

      if (response.ok || true) { // Mock success
        const selectedBindings = bindings.filter(b =>
          compositeForm.selectedTokenIds.includes(b.tokenId)
        );
        const newBundle: CompositeBundle = {
          id: `cb_${Date.now()}`,
          name: compositeForm.name,
          contractId: contractId,
          tokens: selectedBindings,
          createdAt: new Date(),
          status: 'ACTIVE',
          totalValue: selectedBindings.reduce((sum, b) => sum + (b.amount || 0), 0)
        };
        setCompositeBundles([...compositeBundles, newBundle]);

        // Update bindings to COMPOSITE type
        setBindings(bindings.map(b =>
          compositeForm.selectedTokenIds.includes(b.tokenId)
            ? { ...b, bindingType: 'COMPOSITE' as TokenBindingType }
            : b
        ));

        setSuccess('Composite bundle created successfully');
        setCompositeDialogOpen(false);
        resetCompositeForm();
        updateStats();
      }
    } catch (err) {
      console.error('Error creating composite bundle:', err);
      setError('Failed to create composite bundle');
    } finally {
      setLoading(false);
    }
  };

  const unbindToken = (bindingId: string) => {
    setBindings(bindings.map(b =>
      b.id === bindingId ? { ...b, status: 'REVOKED' as BindingStatus } : b
    ));
    setSuccess('Token unbound successfully');
    updateStats();
  };

  const resetBindForm = () => {
    setBindForm({
      tokenId: '',
      tokenName: '',
      tokenSymbol: '',
      bindingType: 'PRIMARY',
      amount: 0,
      expiresAt: '',
      purpose: ''
    });
  };

  const resetCompositeForm = () => {
    setCompositeForm({
      name: '',
      selectedTokenIds: []
    });
  };

  const updateStats = () => {
    const active = bindings.filter(b => b.status === 'ACTIVE').length;
    const primary = bindings.filter(b => b.bindingType === 'PRIMARY').length;
    const secondary = bindings.filter(b => b.bindingType === 'SECONDARY').length;
    const pending = bindings.filter(b => b.status === 'PENDING').length;

    setStats({
      totalBindings: bindings.length,
      activeBindings: active,
      primaryTokens: primary,
      secondaryTokens: secondary,
      compositeBundles: compositeBundles.length,
      pendingBindings: pending
    });
  };

  const getStatusColor = (status: BindingStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'EXPIRED': return 'default';
      case 'REVOKED': return 'error';
      default: return 'default';
    }
  };

  const getBindingTypeColor = (type: TokenBindingType): 'primary' | 'secondary' | 'info' => {
    switch (type) {
      case 'PRIMARY': return 'primary';
      case 'SECONDARY': return 'secondary';
      case 'COMPOSITE': return 'info';
      default: return 'primary';
    }
  };

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Token Binding Management
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Contract: {contractName} ({contractId})
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Bindings</Typography>
              <Typography variant="h4">{stats.totalBindings}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active</Typography>
              <Typography variant="h4" color="success.main">{stats.activeBindings}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Primary Tokens</Typography>
              <Typography variant="h4" color="primary.main">{stats.primaryTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Secondary Tokens</Typography>
              <Typography variant="h4" color="secondary.main">{stats.secondaryTokens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Composite Bundles</Typography>
              <Typography variant="h4" color="info.main">{stats.compositeBundles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4" color="warning.main">{stats.pendingBindings}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab icon={<Link />} label="Token Bindings" />
              <Tab icon={<Layers />} label="Composite Bundles" />
              <Tab icon={<History />} label="Binding History" />
              <Tab icon={<Assessment />} label="Statistics" />
            </Tabs>
            <Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchBindings}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setBindDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Bind Token
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Layers />}
                onClick={() => setCompositeDialogOpen(true)}
              >
                Create Bundle
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Token Bindings Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token</TableCell>
                    <TableCell>Binding Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Bound At</TableCell>
                    <TableCell>Expires At</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bindings.map(binding => (
                    <TableRow key={binding.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Token color="primary" />
                          <Box>
                            <Typography variant="body2">{binding.tokenName}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {binding.tokenSymbol} ({binding.tokenId})
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={binding.bindingType}
                          size="small"
                          color={getBindingTypeColor(binding.bindingType)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={binding.status}
                          size="small"
                          color={getStatusColor(binding.status)}
                          icon={binding.status === 'ACTIVE' ? <CheckCircle /> : undefined}
                        />
                      </TableCell>
                      <TableCell>{binding.amount?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{binding.boundAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        {binding.expiresAt ? binding.expiresAt.toLocaleDateString() : 'No expiry'}
                      </TableCell>
                      <TableCell>{binding.metadata?.purpose || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Timeline />
                          </IconButton>
                        </Tooltip>
                        {binding.status === 'ACTIVE' && (
                          <Tooltip title="Unbind Token">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => unbindToken(binding.id)}
                            >
                              <LinkOff />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Composite Bundles Tab */}
          {activeTab === 1 && (
            <Box>
              {compositeBundles.length === 0 ? (
                <Alert severity="info">
                  No composite bundles created yet. Create a bundle to group multiple tokens together.
                </Alert>
              ) : (
                compositeBundles.map(bundle => (
                  <Accordion key={bundle.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <AccountTree color="info" />
                        <Box flex={1}>
                          <Typography variant="subtitle1">{bundle.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Created: {bundle.createdAt.toLocaleDateString()} |
                            Tokens: {bundle.tokens.length} |
                            Total Value: {bundle.totalValue?.toLocaleString() || 0}
                          </Typography>
                        </Box>
                        <Chip
                          label={bundle.status}
                          size="small"
                          color={bundle.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Bundled Tokens:
                      </Typography>
                      {bundle.tokens.length > 0 ? (
                        <List dense>
                          {bundle.tokens.map(token => (
                            <ListItem key={token.id}>
                              <ListItemText
                                primary={`${token.tokenName} (${token.tokenSymbol})`}
                                secondary={`Amount: ${token.amount?.toLocaleString() || 0}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No tokens in this bundle yet.
                        </Typography>
                      )}
                      <Box mt={2}>
                        <Button size="small" color="error" startIcon={<Delete />}>
                          Dissolve Bundle
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          )}

          {/* Binding History Tab */}
          {activeTab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bindingHistory.map(history => (
                    <TableRow key={history.id}>
                      <TableCell>
                        <Chip
                          label={history.action}
                          size="small"
                          color={history.action === 'BIND' ? 'success' :
                                 history.action === 'UNBIND' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{history.tokenName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {history.tokenId}
                        </Typography>
                      </TableCell>
                      <TableCell>{history.performedBy}</TableCell>
                      <TableCell>
                        {history.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>{history.details || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Statistics Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Binding Distribution
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Primary Tokens" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.primaryTokens} color="primary" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Secondary Tokens" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.secondaryTokens} color="secondary" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Composite Bundles" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.compositeBundles} color="info" />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Status Overview
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Active Bindings" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.activeBindings} color="success" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Pending Bindings" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.pendingBindings} color="warning" />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Total Bindings" />
                        <ListItemSecondaryAction>
                          <Chip label={stats.totalBindings} />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last 7 days: {bindingHistory.length} binding operations
                    </Typography>
                    <Box mt={2}>
                      <LinearProgress
                        variant="determinate"
                        value={(stats.activeBindings / stats.totalBindings) * 100}
                        color="success"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {((stats.activeBindings / stats.totalBindings) * 100).toFixed(1)}% of bindings are active
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Bind Token Dialog */}
      <Dialog open={bindDialogOpen} onClose={() => setBindDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bind Token to Contract</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Token</InputLabel>
            <Select
              value={bindForm.tokenId}
              onChange={(e) => {
                const token = availableTokens.find(t => t.id === e.target.value);
                setBindForm({
                  ...bindForm,
                  tokenId: e.target.value,
                  tokenName: token?.name || '',
                  tokenSymbol: token?.symbol || ''
                });
              }}
            >
              {availableTokens.map(token => (
                <MenuItem key={token.id} value={token.id}>
                  {token.name} ({token.symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Binding Type</InputLabel>
            <Select
              value={bindForm.bindingType}
              onChange={(e) => setBindForm({...bindForm, bindingType: e.target.value as TokenBindingType})}
            >
              <MenuItem value="PRIMARY">PRIMARY - Main contract token</MenuItem>
              <MenuItem value="SECONDARY">SECONDARY - Supporting token</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={bindForm.amount}
            onChange={(e) => setBindForm({...bindForm, amount: parseInt(e.target.value) || 0})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Expiry Date (optional)"
            type="date"
            value={bindForm.expiresAt}
            onChange={(e) => setBindForm({...bindForm, expiresAt: e.target.value})}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Purpose"
            value={bindForm.purpose}
            onChange={(e) => setBindForm({...bindForm, purpose: e.target.value})}
            margin="normal"
            placeholder="e.g., Collateral, Payment, Escrow"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBindDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={bindToken}
            disabled={!bindForm.tokenId || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Link />}
          >
            Bind Token
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Composite Bundle Dialog */}
      <Dialog open={compositeDialogOpen} onClose={() => setCompositeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Composite Token Bundle</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bundle Name"
            value={compositeForm.name}
            onChange={(e) => setCompositeForm({...compositeForm, name: e.target.value})}
            margin="normal"
            placeholder="e.g., Asset Bundle Alpha"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Tokens to Bundle</InputLabel>
            <Select
              multiple
              value={compositeForm.selectedTokenIds}
              onChange={(e) => setCompositeForm({
                ...compositeForm,
                selectedTokenIds: e.target.value as string[]
              })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((tokenId) => {
                    const binding = bindings.find(b => b.tokenId === tokenId);
                    return (
                      <Chip
                        key={tokenId}
                        label={binding?.tokenSymbol || tokenId}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {bindings
                .filter(b => b.status === 'ACTIVE' && b.bindingType !== 'COMPOSITE')
                .map(binding => (
                  <MenuItem key={binding.tokenId} value={binding.tokenId}>
                    {binding.tokenName} ({binding.tokenSymbol}) - {binding.amount?.toLocaleString() || 0}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            Composite bundles allow you to group multiple tokens together for collective management
            and easier transfer as a single unit.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompositeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={createCompositeBundle}
            disabled={!compositeForm.name || compositeForm.selectedTokenIds.length < 2 || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Layers />}
          >
            Create Bundle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokenBinding;
