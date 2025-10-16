import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface ConsensusMetrics {
  consensusType: string;
  leaderNode: string;
  term: number;
  commitIndex: number;
  lastApplied: number;
  consensusLatency: number;
  successRate: number;
  validators: Array<{
    id: string;
    role: 'leader' | 'follower' | 'candidate';
    lastHeartbeat: number;
    votesReceived: number;
    commitIndex: number;
  }>;
  latencyHistory: Array<{
    timestamp: string;
    latency: number;
  }>;
  consensusRounds: Array<{
    round: number;
    duration: number;
    result: 'success' | 'failed';
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ConsensusMonitoring: React.FC = () => {
  const [data, setData] = useState<ConsensusMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/consensus/metrics');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch consensus monitoring data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresh every 3s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Consensus Monitoring Dashboard
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

  const roleDistribution = [
    { name: 'Leader', value: data.validators.filter(v => v.role === 'leader').length },
    { name: 'Follower', value: data.validators.filter(v => v.role === 'follower').length },
    { name: 'Candidate', value: data.validators.filter(v => v.role === 'candidate').length },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Consensus Monitoring Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Consensus Type
              </Typography>
              <Typography variant="h5">{data.consensusType}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Current Term
              </Typography>
              <Typography variant="h5">{data.term}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Consensus Latency
              </Typography>
              <Typography variant="h5">{data.consensusLatency.toFixed(2)}ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Success Rate
              </Typography>
              <Typography variant="h5">{data.successRate.toFixed(2)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={data.successRate}
                color={data.successRate > 99 ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Leader Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Leader Node
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
                {data.leaderNode}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Commit Index
                  </Typography>
                  <Typography variant="h6">{data.commitIndex}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Applied
                  </Typography>
                  <Typography variant="h6">{data.lastApplied}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Validator Role Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Validator Role Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Consensus Latency Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consensus Latency (Last Hour)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#8884d8" name="Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Validators Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Validator Status
              </Typography>
              <Grid container spacing={2}>
                {data.validators.map((validator) => (
                  <Grid item xs={12} sm={6} md={4} key={validator.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        {validator.id.substring(0, 16)}...
                      </Typography>
                      <Chip
                        label={validator.role.toUpperCase()}
                        color={validator.role === 'leader' ? 'primary' : 'default'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Commit Index: {validator.commitIndex}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Heartbeat: {validator.lastHeartbeat}ms ago
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConsensusMonitoring;
