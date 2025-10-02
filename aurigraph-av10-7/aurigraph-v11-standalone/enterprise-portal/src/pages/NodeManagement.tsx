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

interface Node {
  id: string;
  name: string;
  type: 'validator' | 'business' | 'observer';
  status: 'online' | 'offline' | 'syncing';
  ip: string;
  port: number;
  stake?: number;
  uptime: number;
  lastSeen: number;
  version: string;
}

const NodeManagement: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nodeForm, setNodeForm] = useState({
    name: '',
    type: 'validator',
    ip: '',
    port: 9003,
    stake: 1000
  });

  useEffect(() => {
    // Generate sample nodes
    const sampleNodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
      id: `node_${i}`,
      name: `Node-${i + 1}`,
      type: ['validator', 'business', 'observer'][Math.floor(Math.random() * 3)] as any,
      status: ['online', 'offline', 'syncing'][Math.floor(Math.random() * 3)] as any,
      ip: `192.168.1.${100 + i}`,
      port: 9003 + i,
      stake: Math.floor(Math.random() * 10000),
      uptime: Math.floor(Math.random() * 100),
      lastSeen: Date.now() - Math.floor(Math.random() * 3600000),
      version: '11.0.0'
    }));
    setNodes(sampleNodes);
  }, []);

  const addNode = async () => {
    setLoading(true);
    setTimeout(() => {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        name: nodeForm.name,
        type: nodeForm.type as any,
        status: 'syncing',
        ip: nodeForm.ip,
        port: nodeForm.port,
        stake: nodeForm.stake,
        uptime: 0,
        lastSeen: Date.now(),
        version: '11.0.0'
      };
      setNodes([...nodes, newNode]);
      setDialogOpen(false);
      setLoading(false);
    }, 1000);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const toggleNodeStatus = (id: string) => {
    setNodes(nodes.map(n =>
      n.id === id
        ? { ...n, status: n.status === 'online' ? 'offline' : 'online' }
        : n
    ));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'online': return <CheckCircle color="success" />;
      case 'offline': return <Error color="error" />;
      case 'syncing': return <Warning color="warning" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Node Management</Typography>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Nodes</Typography>
              <Typography variant="h4">{nodes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Online</Typography>
              <Typography variant="h4" color="success.main">
                {nodes.filter(n => n.status === 'online').length}
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
                {nodes.reduce((sum, n) => sum + (n.stake || 0), 0).toLocaleString()} AUR
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
              <Tab label="Configuration" />
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
                  <TableCell>IP:Port</TableCell>
                  <TableCell>Stake</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodes
                  .filter(n => activeTab === 0 || (activeTab === 1 && n.type === 'validator') || (activeTab === 2 && n.type === 'business'))
                  .map(node => (
                    <TableRow key={node.id}>
                      <TableCell>{node.name}</TableCell>
                      <TableCell>
                        <Chip label={node.type} size="small" color={node.type === 'validator' ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(node.status)}
                          {node.status}
                        </Box>
                      </TableCell>
                      <TableCell>{node.ip}:{node.port}</TableCell>
                      <TableCell>{node.stake?.toLocaleString() || '-'} AUR</TableCell>
                      <TableCell>{node.uptime}%</TableCell>
                      <TableCell>{node.version}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleNodeStatus(node.id)}>
                          {node.status === 'online' ? <Stop /> : <PlayArrow />}
                        </IconButton>
                        <IconButton size="small" onClick={() => setSelectedNode(node)}>
                          <Settings />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteNode(node.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
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
          <TextField fullWidth label="Node Name" value={nodeForm.name} onChange={(e) => setNodeForm({...nodeForm, name: e.target.value})} margin="normal" />
          <TextField fullWidth label="IP Address" value={nodeForm.ip} onChange={(e) => setNodeForm({...nodeForm, ip: e.target.value})} margin="normal" />
          <TextField fullWidth label="Port" type="number" value={nodeForm.port} onChange={(e) => setNodeForm({...nodeForm, port: parseInt(e.target.value)})} margin="normal" />
          {nodeForm.type === 'validator' && (
            <TextField fullWidth label="Stake Amount (AUR)" type="number" value={nodeForm.stake} onChange={(e) => setNodeForm({...nodeForm, stake: parseInt(e.target.value)})} margin="normal" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addNode} disabled={loading}>
            {loading ? 'Adding...' : 'Add Node'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NodeManagement;
