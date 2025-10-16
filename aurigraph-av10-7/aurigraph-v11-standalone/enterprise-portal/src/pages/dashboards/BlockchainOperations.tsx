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
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface BlockchainMetrics {
  blockHeight: number;
  tps: number;
  blockTime: number;
  totalTransactions: number;
  pendingTransactions: number;
  validators: number;
  networkHash: string;
  difficulty: number;
  recentBlocks: Array<{
    height: number;
    hash: string;
    timestamp: number;
    transactions: number;
    validator: string;
  }>;
  tpsHistory: Array<{
    timestamp: string;
    tps: number;
  }>;
}

const BlockchainOperations: React.FC = () => {
  const [data, setData] = useState<BlockchainMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/blockchain/stats');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch blockchain operations data');
        setLoading(false);
      }
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

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Blockchain Operations Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Block Height
              </Typography>
              <Typography variant="h4">{data.blockHeight.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Current TPS
              </Typography>
              <Typography variant="h4">{data.tps.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Block Time (avg)
              </Typography>
              <Typography variant="h4">{data.blockTime.toFixed(2)}s</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Validators
              </Typography>
              <Typography variant="h4">{data.validators}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions
                </Typography>
                <Typography variant="h5">{data.totalTransactions.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Transactions
                </Typography>
                <Typography variant="h5">{data.pendingTransactions.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Network Hash
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {data.networkHash}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Difficulty
                </Typography>
                <Typography variant="h5">{data.difficulty.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* TPS Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transactions Per Second (Last Hour)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.tpsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tps" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Blocks */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Blocks
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Height</TableCell>
                      <TableCell>Hash</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Transactions</TableCell>
                      <TableCell>Validator</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentBlocks.map((block) => (
                      <TableRow key={block.height}>
                        <TableCell>{block.height}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {block.hash.substring(0, 16)}...
                        </TableCell>
                        <TableCell>{new Date(block.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{block.transactions}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {block.validator.substring(0, 10)}...
                        </TableCell>
                      </TableRow>
                    ))}
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
