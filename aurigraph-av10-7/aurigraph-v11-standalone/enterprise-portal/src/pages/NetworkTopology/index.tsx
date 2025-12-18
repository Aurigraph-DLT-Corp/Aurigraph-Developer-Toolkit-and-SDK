import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { getNetworkTopology, NetworkTopologyData } from '../../services/NetworkTopologyService';

/**
 * NetworkTopology Component
 *
 * Displays the network topology including:
 * - Node visualization
 * - Node types and status
 * - Network connections
 * - Real-time updates
 *
 * API Endpoint: /api/v12/blockchain/network/topology
 */
export const NetworkTopology: React.FC = () => {
  const [topology, setTopology] = useState<NetworkTopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch topology data from API
  const fetchTopology = async () => {
    try {
      setLoading(true);
      const data = await getNetworkTopology();
      setTopology(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTopology(null);
    } finally {
      setLoading(false);
    }
  };

  // Setup effect for initial fetch and auto-refresh
  useEffect(() => {
    fetchTopology();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchTopology, 5000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Get status color for chip
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'syncing':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get node type color
  const getNodeTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'validator':
        return '#1976d2';
      case 'business':
        return '#388e3c';
      case 'ei':
        return '#f57c00';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <strong>Error Loading Network Topology</strong>
          <br />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!topology) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No network topology data available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Network Topology
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Real-time visualization of network nodes and connections
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Nodes
              </Typography>
              <Typography variant="h4">
                {topology.nodes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Nodes
              </Typography>
              <Typography variant="h4">
                {topology.nodes.filter((n) => n.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Connections
              </Typography>
              <Typography variant="h4">
                {topology.connections.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date(topology.timestamp).toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Nodes Table */}
      <Paper sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          Network Nodes ({topology.nodes.length})
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Node ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Connections</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topology.nodes.map((node) => {
                const nodeConnections = topology.connections.filter(
                  (conn) => conn.source === node.id || conn.target === node.id
                ).length;
                return (
                  <TableRow key={node.id}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {node.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{node.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={node.type}
                        size="small"
                        sx={{ backgroundColor: getNodeTypeColor(node.type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={node.status}
                        size="small"
                        color={getStatusColor(node.status)}
                      />
                    </TableCell>
                    <TableCell>{nodeConnections}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Connections Summary */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Network Connections ({topology.connections.length})
        </Typography>
        <Typography variant="body2" color="textSecondary">
          The network topology shows {topology.connections.length} active connections between {topology.nodes.length} nodes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default NetworkTopology;
