// Demo List View Component - Display all registered demos
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Badge,
  LinearProgress, Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon, Stop as StopIcon, Visibility as ViewIcon,
  Delete as DeleteIcon, Edit as EditIcon, Assessment as StatsIcon,
  People as PeopleIcon, Storage as StorageIcon, Security as SecurityIcon
} from '@mui/icons-material';

export interface DemoInstance {
  id: string;
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  status: 'RUNNING' | 'STOPPED' | 'PENDING' | 'ERROR';
  channels: Array<{
    id: string;
    name: string;
    type: 'PUBLIC' | 'PRIVATE' | 'CONSORTIUM';
  }>;
  validators: number;
  businessNodes: number;
  eiNodes: number;
  createdAt: Date;
  lastActivity: Date;
  transactionCount: number;
  merkleRoot: string;
}

interface Props {
  demos: DemoInstance[];
  onStart: (demoId: string) => void;
  onStop: (demoId: string) => void;
  onView: (demoId: string) => void;
  onDelete: (demoId: string) => void;
}

export const DemoListView: React.FC<Props> = ({ demos, onStart, onStop, onView, onDelete }) => {
  const [selectedDemo, setSelectedDemo] = useState<DemoInstance | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const getStatusColor = (status: DemoInstance['status']) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'STOPPED': return 'default';
      case 'PENDING': return 'warning';
      case 'ERROR': return 'error';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const handleViewDetails = (demo: DemoInstance) => {
    setSelectedDemo(demo);
    setDetailsOpen(true);
  };

  const runningDemos = demos.filter(d => d.status === 'RUNNING').length;
  const totalNodes = demos.reduce((sum, d) => sum + d.validators + d.businessNodes + d.eiNodes, 0);
  const totalTransactions = demos.reduce((sum, d) => sum + d.transactionCount, 0);

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Demos</Typography>
                  <Typography variant="h4">{demos.length}</Typography>
                </Box>
                <StorageIcon color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">Running Demos</Typography>
                  <Typography variant="h4">{runningDemos}</Typography>
                </Box>
                <PlayIcon color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Nodes</Typography>
                  <Typography variant="h4">{totalNodes}</Typography>
                </Box>
                <PeopleIcon color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">Transactions</Typography>
                  <Typography variant="h4">{totalTransactions.toLocaleString()}</Typography>
                </Box>
                <StatsIcon color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demos Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Demo Name</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Channels</strong></TableCell>
              <TableCell><strong>Nodes</strong></TableCell>
              <TableCell><strong>Transactions</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    No demos registered yet. Click "Register New Demo" to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              demos.map((demo) => (
                <TableRow key={demo.id} hover>
                  <TableCell>
                    <Link
                      to={`/demo/${demo.id}`}
                      style={{
                        textDecoration: 'none',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'bold',
                          color: 'primary.main',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          '&:hover': {
                            color: 'primary.dark',
                            textDecoration: 'underline',
                            textShadow: '0 0 8px rgba(25, 118, 210, 0.3)'
                          }
                        }}
                      >
                        {demo.demoName} →
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="textSecondary">{demo.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{demo.userName}</Typography>
                    <Typography variant="caption" color="textSecondary">{demo.userEmail}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={demo.status} color={getStatusColor(demo.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={demo.channels.length} color="primary">
                      <StorageIcon />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`${demo.validators} Validators, ${demo.businessNodes} Business, ${demo.eiNodes} Slim`}>
                      <Typography variant="body2">
                        {demo.validators + demo.businessNodes + demo.eiNodes} nodes
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{demo.transactionCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(demo.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetails(demo)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {demo.status === 'RUNNING' ? (
                      <Tooltip title="Stop Demo">
                        <IconButton size="small" onClick={() => onStop(demo.id)} color="warning">
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Start Demo">
                        <IconButton size="small" onClick={() => onStart(demo.id)} color="success">
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Demo">
                      <IconButton size="small" onClick={() => onDelete(demo.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Demo Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Demo Details: {selectedDemo?.demoName}
          <Chip label={selectedDemo?.status} color={getStatusColor(selectedDemo?.status || 'STOPPED')} size="small" sx={{ ml: 2 }} />
        </DialogTitle>
        <DialogContent>
          {selectedDemo && (
            <Box>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Channels" />
                <Tab label="Nodes" />
                <Tab label="Merkle Tree" />
              </Tabs>

              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Overview</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">User</Typography>
                      <Typography>{selectedDemo.userName} ({selectedDemo.userEmail})</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Created</Typography>
                      <Typography>{formatDate(selectedDemo.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Last Activity</Typography>
                      <Typography>{formatDate(selectedDemo.lastActivity)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary">Transactions</Typography>
                      <Typography>{selectedDemo.transactionCount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography color="textSecondary">Description</Typography>
                      <Typography>{selectedDemo.description}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Channels ({selectedDemo.channels.length})</Typography>
                  {selectedDemo.channels.map((channel) => (
                    <Paper key={channel.id} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1"><strong>{channel.name}</strong></Typography>
                      <Chip label={channel.type} size="small" color="primary" />
                    </Paper>
                  ))}
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Node Distribution</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">{selectedDemo.validators}</Typography>
                        <Typography color="textSecondary">Validators</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">{selectedDemo.businessNodes}</Typography>
                        <Typography color="textSecondary">Business Nodes</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">{selectedDemo.eiNodes}</Typography>
                        <Typography color="textSecondary">External Integration (EI) Nodes</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Merkle Tree Registry</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <SecurityIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1"><strong>Merkle Root Hash</strong></Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                      {selectedDemo.merkleRoot}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      This Merkle root cryptographically verifies all demo transactions and state changes.
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedDemo && selectedDemo.status === 'RUNNING' && (
            <Button variant="contained" onClick={() => {
              setDetailsOpen(false);
              onView(selectedDemo.id);
            }}>
              View Live Demo
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
