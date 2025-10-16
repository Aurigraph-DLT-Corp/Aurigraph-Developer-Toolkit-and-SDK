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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface OracleData {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'degraded' | 'down';
  uptime: number;
  dataFeeds: number;
  responseTime: number;
  errorRate: number;
  lastUpdate: string;
}

interface OracleMetrics {
  totalOracles: number;
  activeOracles: number;
  healthScore: number;
  averageUptime: number;
  oracles: OracleData[];
  priceUpdateHistory: Array<{
    timestamp: string;
    updates: number;
  }>;
}

const OracleService: React.FC = () => {
  const [data, setData] = useState<OracleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/oracles/status');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch oracle service data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Oracle Service Dashboard
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
        Oracle Service Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Oracles
              </Typography>
              <Typography variant="h4">{data.totalOracles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Oracles
              </Typography>
              <Typography variant="h4">{data.activeOracles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Health Score
              </Typography>
              <Typography variant="h4">{data.healthScore.toFixed(2)}/100</Typography>
              <LinearProgress
                variant="determinate"
                value={data.healthScore}
                color={data.healthScore > 90 ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Average Uptime
              </Typography>
              <Typography variant="h4">{data.averageUptime.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Update Frequency (Last Hour)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.priceUpdateHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="updates" stroke="#8884d8" name="Updates" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Oracle Services
              </Typography>
              <Grid container spacing={2}>
                {data.oracles.map((oracle) => (
                  <Grid item xs={12} sm={6} md={4} key={oracle.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {oracle.name}
                      </Typography>
                      <Chip
                        label={oracle.status.toUpperCase()}
                        color={oracle.status === 'active' ? 'success' : 'warning'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Provider: {oracle.provider}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data Feeds: {oracle.dataFeeds}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Uptime: {oracle.uptime.toFixed(2)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Response Time: {oracle.responseTime}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Error Rate: {oracle.errorRate.toFixed(2)}%
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

export default OracleService;
