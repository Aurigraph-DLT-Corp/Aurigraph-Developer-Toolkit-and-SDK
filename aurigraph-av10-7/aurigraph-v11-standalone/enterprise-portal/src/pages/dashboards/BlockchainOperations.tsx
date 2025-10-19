import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// Backend API response types
interface NetworkStats {
  totalNodes: number;
  activeValidators: number;
  currentTPS: number;
  networkHashRate: string;
  averageBlockTime: number;
  totalBlocks: number;
  totalTransactions: number;
  networkLatency: number;
  timestamp: number;
  healthScore?: number;
  networkStatus?: string;
}

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  transactions: number;
  validator: string;
  size: number;
  gasUsed: number;
}

interface BlocksResponse {
  blocks: BlockData[];
  total: number;
  limit: number;
  offset: number;
}

// TPS history for charting (generated from real data)
interface TPSHistoryPoint {
  timestamp: string;
  tps: number;
}

const BlockchainOperations: React.FC = () => {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([]);
  const [tpsHistory, setTPSHistory] = useState<TPSHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch network stats and recent blocks in parallel
        const [statsResponse, blocksResponse] = await Promise.all([
          axios.get<NetworkStats>('/api/v11/blockchain/network/stats'),
          axios.get<BlocksResponse>('/api/v11/blockchain/blocks?limit=10')
        ]);

        setNetworkStats(statsResponse.data);
        setRecentBlocks(blocksResponse.data.blocks);

        // Build TPS history from current TPS data
        // In production, this should come from a dedicated historical metrics endpoint
        updateTPSHistory(statsResponse.data.currentTPS);

        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch blockchain data:', err);
        setError('Failed to fetch blockchain operations data. Please ensure the backend is running on port 9003.');
        setLoading(false);
      }
    };

    // Update TPS history tracking
    const updateTPSHistory = (currentTPS: number) => {
      setTPSHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

        const newPoint: TPSHistoryPoint = {
          timestamp: timeStr,
          tps: Math.round(currentTPS)
        };

        // Keep last 20 data points (approx 2 minutes at 5s intervals)
        const updated = [...prev, newPoint];
        return updated.slice(-20);
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Blockchain Operations Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !networkStats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Box>
    );
  }

  // Calculate network status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'success';
      case 'FAIR': return 'warning';
      case 'DEGRADED': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Blockchain Operations Dashboard
        </Typography>
        {networkStats.networkStatus && (
          <Chip
            label={networkStats.networkStatus}
            color={getStatusColor(networkStats.networkStatus)}
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Block Height
              </Typography>
              <Typography variant="h4">{networkStats.totalBlocks.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Current TPS
              </Typography>
              <Typography variant="h4">{networkStats.currentTPS.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Block Time (avg)
              </Typography>
              <Typography variant="h4">{(networkStats.averageBlockTime / 1000).toFixed(2)}s</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Active Validators
              </Typography>
              <Typography variant="h4">{networkStats.activeValidators} / {networkStats.totalNodes}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Transaction Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions
                </Typography>
                <Typography variant="h5">{networkStats.totalTransactions.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Network Latency
                </Typography>
                <Typography variant="h5">{networkStats.networkLatency.toFixed(2)} ms</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Network Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Network Hash Rate
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>
                  {networkStats.networkHashRate}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Nodes
                </Typography>
                <Typography variant="h5">{networkStats.totalNodes}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* TPS Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Transactions Per Second (Live - Last 2 Minutes)
              </Typography>
              {tpsHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tpsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'TPS']}
                      labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tps"
                      stroke="#00bcd4"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      name="TPS"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">Collecting TPS data...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Blocks */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Recent Blocks (Live)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Height</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Hash</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Transactions</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Validator</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Size</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBlocks.length > 0 ? (
                      recentBlocks.map((block) => (
                        <TableRow
                          key={block.height}
                          sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                        >
                          <TableCell sx={{ fontWeight: 'bold' }}>{block.height.toLocaleString()}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {block.hash}
                          </TableCell>
                          <TableCell>{new Date(block.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{block.transactions.toLocaleString()}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {block.validator}
                          </TableCell>
                          <TableCell>{(block.size / 1024).toFixed(2)} KB</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No blocks available</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainOperations;
