import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Paper,
  Select, MenuItem, FormControl, InputLabel, Chip, Button
} from '@mui/material';
import { TrendingUp, TrendingDown, Assessment, PieChart } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { apiService } from '../services/api';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchMLPredictions();
    const interval = setInterval(fetchMLPredictions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMLPredictions = async () => {
    try {
      const mlPredictions = await apiService.getMLPredictions();
      setPredictions(mlPredictions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ML predictions:', error);
      setLoading(false);
    }
  };

  const blockchainData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    blocks: Math.floor(Math.random() * 10000 + 5000),
    transactions: Math.floor(Math.random() * 100000 + 50000),
    volume: Math.floor(Math.random() * 1000000 + 500000)
  }));

  const tokenDistribution = [
    { name: 'Staking', value: 35, color: '#8884d8' },
    { name: 'Liquidity', value: 25, color: '#82ca9d' },
    { name: 'Treasury', value: 20, color: '#ffc658' },
    { name: 'Circulation', value: 20, color: '#ff7c7c' }
  ];

  if (loading || !predictions) {
    return <Box sx={{ p: 3 }}><Typography>Loading ML predictions...</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Blocks</Typography>
              <Typography variant="h4">1,234,567</Typography>
              <Chip icon={<TrendingUp />} label="+12%" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Transactions</Typography>
              <Typography variant="h4">45.6M</Typography>
              <Chip icon={<TrendingUp />} label="+8%" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Volume</Typography>
              <Typography variant="h4">$125M</Typography>
              <Chip icon={<TrendingDown />} label="-3%" color="error" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Users</Typography>
              <Typography variant="h4">15,432</Typography>
              <Chip icon={<TrendingUp />} label="+25%" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Blockchain Activity</Typography>
                <FormControl size="small">
                  <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <MenuItem value="24h">24 Hours</MenuItem>
                    <MenuItem value="7d">7 Days</MenuItem>
                    <MenuItem value="30d">30 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={blockchainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="transactions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="blocks" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Token Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={tokenDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {tokenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Predictions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>AI Predictions & Insights</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="subtitle2">Next Day TPS Forecast</Typography>
                <Typography variant="h4">{predictions.nextDayTpsForecast.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle2">Weekly Growth Rate</Typography>
                <Typography variant="h4">+{predictions.weeklyGrowthRate.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white' }}>
                <Typography variant="subtitle2">Monthly Volume Prediction</Typography>
                <Typography variant="h4">{(predictions.monthlyVolumePrediction / 1e9).toFixed(1)}B</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, bgcolor: predictions.anomalyScore > 0.5 ? 'error.light' : 'success.light', color: 'white' }}>
                <Typography variant="subtitle2">Anomaly Score</Typography>
                <Typography variant="h4">{predictions.anomalyScore.toFixed(2)}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
