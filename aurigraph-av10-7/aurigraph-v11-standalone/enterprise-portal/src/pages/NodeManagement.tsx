import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tabs, Tab, Alert, Switch, FormControl, InputLabel,
  Select, MenuItem, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  Add, Delete, Edit, PlayArrow, Stop, Refresh, Settings,
  CheckCircle, Error, Warning, Storage, Security, Speed
} from '@mui/icons-material';
import axios from 'axios';

// Type definitions matching backend API
interface ValidatorNode {
  id: string;
  name: string;
  type: 'validator' | 'business' | 'observer';
  status: 'online' | 'offline' | 'syncing';
  address: string;
  port: number;
  publicKey: string;
  stake: number;
  votingPower: number;
  uptime: number;
  lastBlockProposed: number;
  lastSeen: number;
  version: string;
  isActive: boolean;
}

interface ValidatorsResponse {
  validators: ValidatorNode[];
  totalValidators: number;
  activeValidators: number;
  totalStake: number;
  averageUptime: number;
}

interface LiveValidatorStats {
  validatorId: string;
  currentTPS: number;
  proposedBlocks: number;
  votedBlocks: number;
  missedBlocks: number;
  performance: number;
}

const NodeManagement: React.FC = () => {
  const [nodes, setNodes] = useState<ValidatorNode[]>([]);
  const [stats, setStats] = useState<ValidatorsResponse | null>(null);
  const [liveStats, setLiveStats] = useState<Map<string, LiveValidatorStats>>(new Map());
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<ValidatorNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodeForm, setNodeForm] = useState({
    name: '',
    type: 'validator',
    address: '',
    port: 9003,
    stake: 1000
  });

  useEffect(() => {
    fetchValidators();
    const interval = setInterval(fetchValidators, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchValidators = async () => {
    try {
      setError(null);

      // Parallel API calls for validators and live stats
      const [validatorsRes, liveValidatorsRes] = await Promise.all([
        axios.get<ValidatorsResponse>('http://localhost:9003/api/v11/blockchain/validators'),
        axios.get<{ validators: LiveValidatorStats[] }>('http://localhost:9003/api/v11/live/validators')
      ]);

      setStats(validatorsRes.data);
      setNodes(validatorsRes.data.validators);

      // Create map of live stats for quick lookup
      const liveStatsMap = new Map<string, LiveValidatorStats>();
      liveValidatorsRes.data.validators.forEach(stat => {
        liveStatsMap.set(stat.validatorId, stat);
      });
      setLiveStats(liveStatsMap);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch validators:', err);
      setError(err instanceof Error ? err.message : 'Failed to load validators');
      setLoading(false);
    }
  };

  const addNode = async () => {
    setLoading(true);
    try {
      // POST request to add new validator
      await axios.post('http://localhost:9003/api/v11/blockchain/validators', {
        name: nodeForm.name,
        type: nodeForm.type,
        address: nodeForm.address,
        port: nodeForm.port,
        stake: nodeForm.stake
      });

      // Refresh validator list after adding
      await fetchValidators();
      setDialogOpen(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to add node:', err);
      setError(err instanceof Error ? err.message : 'Failed to add node');
      setLoading(false);
    }
  };

  const deleteNode = async (id: string) => {
    try {
      await axios.delete(`http://localhost:9003/api/v11/blockchain/validators/${id}`);
      await fetchValidators();
    } catch (err) {
      console.error('Failed to delete node:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete node');
    }
  };

  const toggleNodeStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'online' ? 'offline' : 'online';
      await axios.patch(`http://localhost:9003/api/v11/blockchain/validators/${id}/status`, {
        status: newStatus
      });
      await fetchValidators();
    } catch (err) {
      console.error('Failed to toggle node status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update node status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'online': return <CheckCircle color="success" />;
      case 'offline': return <Error color="error" />;
      case 'syncing': return <Warning color="warning" />;
      default: return null;
    }
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (loading && nodes.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading validators...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Node Management</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchValidators}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats - Real Data */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Nodes</Typography>
              <Typography variant="h4">{stats?.totalValidators || nodes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Online</Typography>
              <Typography variant="h4" color="success.main">
                {stats?.activeValidators || nodes.filter(n => n.status === 'online').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Validators</Typography>
              <Typography variant="h4">
                {nodes.filter(n => n.type === 'validator').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Stake</Typography>
              <Typography variant="h4">
                {(stats?.totalStake || nodes.reduce((sum, n) => sum + (n.stake || 0), 0)).toLocaleString()} AUR
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Average Uptime</Typography>
              <Typography variant="h5">
                {stats?.averageUptime ? formatUptime(stats.averageUptime) : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Voting Power</Typography>
              <Typography variant="h5">
                {nodes.reduce((sum, n) => sum + (n.votingPower || 0), 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Business Nodes</Typography>
              <Typography variant="h5">
                {nodes.filter(n => n.type === 'business').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="All Nodes" />
              <Tab label="Validators" />
              <Tab label="Business Nodes" />
              <Tab label="Performance" />
            </Tabs>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
              Add Node
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Address:Port</TableCell>
                  <TableCell>Stake</TableCell>
                  <TableCell>Voting Power</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Last Seen</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodes
                  .filter(n => {
                    if (activeTab === 0) return true;
                    if (activeTab === 1) return n.type === 'validator';
                    if (activeTab === 2) return n.type === 'business';
                    if (activeTab === 3) return n.type === 'validator'; // Performance tab shows validators
                    return false;
                  })
                  .map(node => {
                    const liveStat = liveStats.get(node.id);
                    return (
                      <TableRow key={node.id}>
                        <TableCell>{node.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={node.type}
                            size="small"
                            color={node.type === 'validator' ? 'primary' : node.type === 'business' ? 'secondary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(node.status)}
                            {node.status}
                          </Box>
                        </TableCell>
                        <TableCell>{node.address}:{node.port}</TableCell>
                        <TableCell>{node.stake?.toLocaleString() || '-'} AUR</TableCell>
                        <TableCell>{node.votingPower?.toLocaleString() || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatUptime(node.uptime)}
                            size="small"
                            color={node.uptime >= 99 ? 'success' : node.uptime >= 95 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{formatTimestamp(node.lastSeen)}</TableCell>
                        <TableCell>
                          <Chip label={node.version} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleNodeStatus(node.id, node.status)} title="Toggle status">
                            {node.status === 'online' ? <Stop /> : <PlayArrow />}
                          </IconButton>
                          <IconButton size="small" onClick={() => setSelectedNode(node)} title="Settings">
                            <Settings />
                          </IconButton>
                          <IconButton size="small" onClick={() => deleteNode(node.id)} title="Delete">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {activeTab === 3 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Validator Performance Metrics</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Validator</TableCell>
                      <TableCell>Current TPS</TableCell>
                      <TableCell>Proposed Blocks</TableCell>
                      <TableCell>Voted Blocks</TableCell>
                      <TableCell>Missed Blocks</TableCell>
                      <TableCell>Performance Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nodes
                      .filter(n => n.type === 'validator')
                      .map(node => {
                        const liveStat = liveStats.get(node.id);
                        return (
                          <TableRow key={node.id}>
                            <TableCell>{node.name}</TableCell>
                            <TableCell>{liveStat ? `${liveStat.currentTPS.toLocaleString()} TPS` : '-'}</TableCell>
                            <TableCell>{liveStat ? liveStat.proposedBlocks.toLocaleString() : '-'}</TableCell>
                            <TableCell>{liveStat ? liveStat.votedBlocks.toLocaleString() : '-'}</TableCell>
                            <TableCell>
                              {liveStat && liveStat.missedBlocks > 0 ? (
                                <Chip label={liveStat.missedBlocks} size="small" color="error" />
                              ) : (
                                <Chip label="0" size="small" color="success" />
                              )}
                            </TableCell>
                            <TableCell>
                              {liveStat ? (
                                <Chip
                                  label={`${liveStat.performance.toFixed(1)}%`}
                                  size="small"
                                  color={liveStat.performance >= 95 ? 'success' : liveStat.performance >= 80 ? 'warning' : 'error'}
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Node Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Node</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Node Type</InputLabel>
            <Select value={nodeForm.type} onChange={(e) => setNodeForm({...nodeForm, type: e.target.value})}>
              <MenuItem value="validator">Validator</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="observer">Observer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Node Name"
            value={nodeForm.name}
            onChange={(e) => setNodeForm({...nodeForm, name: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address (IP or hostname)"
            value={nodeForm.address}
            onChange={(e) => setNodeForm({...nodeForm, address: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Port"
            type="number"
            value={nodeForm.port}
            onChange={(e) => setNodeForm({...nodeForm, port: parseInt(e.target.value)})}
            margin="normal"
          />
          {nodeForm.type === 'validator' && (
            <TextField
              fullWidth
              label="Stake Amount (AUR)"
              type="number"
              value={nodeForm.stake}
              onChange={(e) => setNodeForm({...nodeForm, stake: parseInt(e.target.value)})}
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addNode} disabled={loading}>
            {loading ? 'Adding...' : 'Add Node'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Node Details Dialog */}
      <Dialog open={!!selectedNode} onClose={() => setSelectedNode(null)} maxWidth="md" fullWidth>
        <DialogTitle>Node Details: {selectedNode?.name}</DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Node ID</Typography>
                <Typography variant="body1">{selectedNode.id}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Public Key</Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {selectedNode.publicKey}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                <Typography variant="body1">{selectedNode.address}:{selectedNode.port}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip label={selectedNode.status} color={selectedNode.status === 'online' ? 'success' : 'error'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Stake</Typography>
                <Typography variant="body1">{selectedNode.stake?.toLocaleString()} AUR</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Voting Power</Typography>
                <Typography variant="body1">{selectedNode.votingPower?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Last Block Proposed</Typography>
                <Typography variant="body1">#{selectedNode.lastBlockProposed?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Version</Typography>
                <Typography variant="body1">{selectedNode.version}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNode(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NodeManagement;
