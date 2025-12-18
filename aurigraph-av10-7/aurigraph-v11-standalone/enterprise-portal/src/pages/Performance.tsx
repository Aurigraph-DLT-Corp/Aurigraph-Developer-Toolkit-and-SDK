import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Slider, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, LinearProgress, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Speed, Memory, Storage, NetworkCheck, TrendingUp } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { apiService } from '../services/api';

// Real-time data interfaces
interface PerformanceMetrics {
  cpuUtilization: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
  diskIO: {
    readMBps: number;
    writeMBps: number;
  };
  networkIO: {
    inboundMBps: number;
    outboundMBps: number;
  };
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
  uptimeSeconds: number;
}

interface NetworkStats {
  totalNodes: number;
  activeValidators: number;
  currentTPS: number;
  peakTPS: number;
  avgBlockTime: number;
  totalBlocks: number;
  totalTransactions: number;
  networkLatency: number;
  networkStatus: string;
  timestamp: number;
}

interface MLPerformance {
  baselineTPS: number;
  mlOptimizedTPS: number;
  performanceGainPercent: number;
  mlShardSuccessRate: number;
  mlOrderingSuccessRate: number;
  avgShardConfidence: number;
  avgShardLatencyMs: number;
  avgOrderingLatencyMs: number;
}

const Performance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tps, setTps] = useState(0);
  const [targetTps, setTargetTps] = useState(2000000);
  const [loading, setLoading] = useState(false);
  const [mlPerformance, setMLPerformance] = useState<MLPerformance | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Derived metrics from real data
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    latency: 0,
    throughput: 0
  });

  // Fetch ML Performance
  const fetchMLPerformance = async () => {
    try {
      const performance = await apiService.getMLPerformance();
      setMLPerformance(performance);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch ML performance:', error);
      setError('Failed to fetch ML performance data');
    }
  };

  // Fetch Analytics Performance Metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const metrics = await apiService.getPerformance();
      setPerformanceMetrics(metrics);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      // Don't set error here as this might be expected to fail
    }
  };

  // Fetch Network Statistics (Real-time TPS)
  const fetchNetworkStats = async () => {
    try {
      const response = await fetch('https://dlt.aurigraph.io/api/v12/blockchain/network/stats');
      if (!response.ok) throw new Error('Network stats unavailable');
      const stats = await response.json();
      setNetworkStats(stats);
      setTps(stats.currentTPS || 0);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
      // Fallback to performance endpoint
      try {
        const perfData = await apiService.getPerformance();
        if (perfData && perfData.throughput) {
          setTps(perfData.throughput);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    }
  };

  // Fetch Live Network Metrics
  const fetchLiveNetworkMetrics = async () => {
    try {
      const response = await fetch('https://dlt.aurigraph.io/api/v12/live/network');
      if (!response.ok) throw new Error('Live network metrics unavailable');
      const liveData = await response.json();

      // Update metrics from live data
      if (liveData.messageRates) {
        setTps(liveData.messageRates.transactionsPerSecond || tps);
      }

      setError(null);
    } catch (error) {
      console.error('Failed to fetch live network metrics:', error);
    }
  };

  // Build performance history from real data
  useEffect(() => {
    const updatePerformanceHistory = () => {
      if (performanceMetrics && networkStats) {
        const timestamp = Date.now();
        const newDataPoint = {
          time: new Date(timestamp).toLocaleTimeString(),
          timestamp,
          tps: networkStats.currentTPS || tps,
          latency: performanceMetrics.responseTimePercentiles?.p50 || 0,
          cpu: performanceMetrics.cpuUtilization || 0,
          memory: performanceMetrics.memoryUsage ?
            (performanceMetrics.memoryUsage.used / performanceMetrics.memoryUsage.total) * 100 : 0,
          throughput: performanceMetrics.throughput || 0
        };

        setPerformanceHistory(prev => {
          const updated = [...prev, newDataPoint];
          // Keep last 60 data points (last hour if updating every minute)
          return updated.slice(-60);
        });

        // Update derived metrics
        setMetrics({
          cpu: performanceMetrics.cpuUtilization || 0,
          memory: performanceMetrics.memoryUsage ?
            (performanceMetrics.memoryUsage.used / performanceMetrics.memoryUsage.total) * 100 : 0,
          disk: performanceMetrics.diskIO ?
            ((performanceMetrics.diskIO.readMBps + performanceMetrics.diskIO.writeMBps) / 200) * 100 : 0,
          network: performanceMetrics.networkIO ?
            ((performanceMetrics.networkIO.inboundMBps + performanceMetrics.networkIO.outboundMBps) / 200) * 100 : 0,
          latency: performanceMetrics.responseTimePercentiles?.p50 || 0,
          throughput: performanceMetrics.throughput || tps
        });
      }
    };

    updatePerformanceHistory();
  }, [performanceMetrics, networkStats, tps]);

  // Initial data load
  useEffect(() => {
    fetchMLPerformance();
    fetchPerformanceMetrics();
    fetchNetworkStats();
    fetchLiveNetworkMetrics();
  }, []);

  // Real-time polling (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMLPerformance();
      fetchPerformanceMetrics();
      fetchNetworkStats();
      fetchLiveNetworkMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [testConfig, setTestConfig] = useState({
    duration: 60,
    threads: 256,
    targetTps: 1000000,
    batchSize: 10000
  });

  const runLoadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      // Real API call to performance test endpoint
      const response = await fetch('https://dlt.aurigraph.io/api/v12/performance?iterations=100000&threads=' + testConfig.threads, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Load test failed');

      const result = await response.json();
      alert(`Load test completed!\nTPS: ${Math.round(result.transactionsPerSecond).toLocaleString()}\nDuration: ${result.durationMs.toFixed(2)}ms`);

      // Refresh metrics after test
      await fetchNetworkStats();
      await fetchPerformanceMetrics();
    } catch (error: any) {
      console.error('Load test error:', error);
      setError('Load test failed: ' + error.message);
      alert('Load test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Performance Monitoring</Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live TPS Monitor
                {networkStats && (
                  <Chip
                    label={networkStats.networkStatus || 'ACTIVE'}
                    color={networkStats.networkStatus === 'HEALTHY' ? 'success' : 'warning'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Typography variant="h2" color="primary">
                {tps > 0 ? tps.toLocaleString() : 'Loading...'} TPS
              </Typography>
              <LinearProgress
                variant="determinate"
                value={tps > 0 ? Math.min((tps / targetTps) * 100, 100) : 0}
                sx={{ mt: 2, height: 10 }}
                color={tps >= targetTps ? 'success' : 'primary'}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption">Target: {targetTps.toLocaleString()} TPS</Typography>
                {networkStats?.peakTPS && (
                  <Typography variant="caption" color="text.secondary">
                    Peak: {networkStats.peakTPS.toLocaleString()} TPS
                  </Typography>
                )}
              </Box>
              {mlPerformance && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  AI Optimization Active: +{mlPerformance.performanceGainPercent.toFixed(1)}% performance gain
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Resources</Typography>
              {performanceMetrics ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">CPU: {metrics.cpu.toFixed(1)}%</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.cpu}
                    color={metrics.cpu > 80 ? 'error' : metrics.cpu > 60 ? 'warning' : 'success'}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memory: {metrics.memory.toFixed(1)}%
                    {performanceMetrics.memoryUsage && (
                      <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                        ({(performanceMetrics.memoryUsage.used / 1024).toFixed(1)}GB / {(performanceMetrics.memoryUsage.total / 1024).toFixed(1)}GB)
                      </Typography>
                    )}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.memory}
                    color={metrics.memory > 80 ? 'error' : metrics.memory > 60 ? 'warning' : 'success'}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Network: {metrics.network.toFixed(1)}%
                    {performanceMetrics.networkIO && (
                      <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                        (↓{performanceMetrics.networkIO.inboundMBps.toFixed(1)} ↑{performanceMetrics.networkIO.outboundMBps.toFixed(1)} MB/s)
                      </Typography>
                    )}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.network}
                    color={metrics.network > 80 ? 'error' : metrics.network > 60 ? 'warning' : 'success'}
                  />
                  {performanceMetrics.uptimeSeconds > 0 && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Uptime: {Math.floor(performanceMetrics.uptimeSeconds / 3600)}h {Math.floor((performanceMetrics.uptimeSeconds % 3600) / 60)}m
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Latency (p50)</Typography>
              <Typography variant="h5">
                {metrics.latency > 0 ? metrics.latency.toFixed(1) : '--'}ms
              </Typography>
              {performanceMetrics?.responseTimePercentiles && (
                <Typography variant="caption">
                  p95: {performanceMetrics.responseTimePercentiles.p95.toFixed(1)}ms |
                  p99: {performanceMetrics.responseTimePercentiles.p99.toFixed(1)}ms
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Blocks</Typography>
              <Typography variant="h5">
                {networkStats?.totalBlocks ? networkStats.totalBlocks.toLocaleString() : '--'}
              </Typography>
              {networkStats?.avgBlockTime && (
                <Typography variant="caption">
                  Avg: {networkStats.avgBlockTime.toFixed(2)}s/block
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
              <Typography variant="h5">
                {networkStats?.totalTransactions ? networkStats.totalTransactions.toLocaleString() : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active Validators</Typography>
              <Typography variant="h5">
                {networkStats?.activeValidators || '--'}
              </Typography>
              {networkStats?.totalNodes && (
                <Typography variant="caption">
                  Total Nodes: {networkStats.totalNodes}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance History (Real-time)
            <Chip
              label={`${performanceHistory.length} data points`}
              size="small"
              sx={{ ml: 2 }}
            />
          </Typography>
          {performanceHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tps"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="TPS"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Latency (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading performance data...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Load Testing" />
            <Tab label="Optimization" />
            <Tab label="Benchmarks" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Configure Load Test</Typography>
                <TextField fullWidth label="Duration (seconds)" type="number" value={testConfig.duration} onChange={(e) => setTestConfig({...testConfig, duration: parseInt(e.target.value)})} margin="normal" />
                <TextField fullWidth label="Threads" type="number" value={testConfig.threads} onChange={(e) => setTestConfig({...testConfig, threads: parseInt(e.target.value)})} margin="normal" />
                <TextField fullWidth label="Target TPS" type="number" value={testConfig.targetTps} onChange={(e) => setTestConfig({...testConfig, targetTps: parseInt(e.target.value)})} margin="normal" />
                <TextField fullWidth label="Batch Size" type="number" value={testConfig.batchSize} onChange={(e) => setTestConfig({...testConfig, batchSize: parseInt(e.target.value)})} margin="normal" />
                <Button fullWidth variant="contained" onClick={runLoadTest} disabled={loading} sx={{ mt: 2 }}>
                  {loading ? 'Running Test...' : 'Start Load Test'}
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="info">
                  Load testing will simulate {testConfig.targetTps.toLocaleString()} transactions per second for {testConfig.duration} seconds using {testConfig.threads} threads.
                </Alert>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Performance Optimization</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Consensus Algorithm</InputLabel>
                    <Select defaultValue="hyperraft">
                      <MenuItem value="hyperraft">HyperRAFT++</MenuItem>
                      <MenuItem value="pbft">PBFT</MenuItem>
                      <MenuItem value="raft">Standard RAFT</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Thread Pool Size</Typography>
                  <Slider defaultValue={256} min={1} max={1024} valueLabelDisplay="auto" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Cache Size (MB)</Typography>
                  <Slider defaultValue={512} min={128} max={4096} valueLabelDisplay="auto" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset">
                    <Typography gutterBottom>AI Optimization Status</Typography>
                    <Switch checked={mlPerformance?.mlOptimizedTPS > mlPerformance?.baselineTPS} disabled />
                    {mlPerformance && (
                      <Typography variant="caption" color="success.main">
                        Active: +{mlPerformance.performanceGainPercent.toFixed(1)}% gain
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Benchmark</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>TPS (Transactions Per Second)</TableCell>
                    <TableCell>{tps > 0 ? tps.toLocaleString() : 'Loading...'}</TableCell>
                    <TableCell>2,000,000</TableCell>
                    <TableCell>
                      <Chip
                        label={tps >= 2000000 ? 'Achieved' : tps >= 1000000 ? 'In Progress' : 'Optimizing'}
                        color={tps >= 2000000 ? 'success' : tps >= 1000000 ? 'warning' : 'info'}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Latency (p50)</TableCell>
                    <TableCell>
                      {performanceMetrics?.responseTimePercentiles?.p50
                        ? performanceMetrics.responseTimePercentiles.p50.toFixed(1) + 'ms'
                        : metrics.latency > 0
                        ? metrics.latency.toFixed(1) + 'ms'
                        : 'Loading...'}
                    </TableCell>
                    <TableCell>&lt;10ms</TableCell>
                    <TableCell>
                      <Chip
                        label={metrics.latency > 0 && metrics.latency < 10 ? 'Achieved' : metrics.latency < 50 ? 'Good' : 'Optimizing'}
                        color={metrics.latency > 0 && metrics.latency < 10 ? 'success' : metrics.latency < 50 ? 'info' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Throughput</TableCell>
                    <TableCell>
                      {performanceMetrics?.throughput
                        ? performanceMetrics.throughput.toLocaleString() + ' tx/s'
                        : metrics.throughput > 0
                        ? metrics.throughput.toLocaleString() + ' tx/s'
                        : 'Loading...'}
                    </TableCell>
                    <TableCell>2,000,000 tx/s</TableCell>
                    <TableCell>
                      <Chip
                        label={metrics.throughput >= 2000000 ? 'Achieved' : 'Optimizing'}
                        color={metrics.throughput >= 2000000 ? 'success' : 'info'}
                      />
                    </TableCell>
                  </TableRow>
                  {networkStats && (
                    <>
                      <TableRow>
                        <TableCell>Average Block Time</TableCell>
                        <TableCell>{networkStats.avgBlockTime?.toFixed(2)}s</TableCell>
                        <TableCell>&lt;3s</TableCell>
                        <TableCell>
                          <Chip
                            label={networkStats.avgBlockTime < 3 ? 'Achieved' : 'Good'}
                            color={networkStats.avgBlockTime < 3 ? 'success' : 'info'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Network Latency</TableCell>
                        <TableCell>{networkStats.networkLatency?.toFixed(1)}ms</TableCell>
                        <TableCell>&lt;100ms</TableCell>
                        <TableCell>
                          <Chip
                            label={networkStats.networkLatency < 100 ? 'Achieved' : 'Good'}
                            color={networkStats.networkLatency < 100 ? 'success' : 'info'}
                          />
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  {mlPerformance && (
                    <TableRow>
                      <TableCell>ML Performance Gain</TableCell>
                      <TableCell>+{mlPerformance.performanceGainPercent.toFixed(1)}%</TableCell>
                      <TableCell>+50%</TableCell>
                      <TableCell>
                        <Chip
                          label={mlPerformance.performanceGainPercent >= 50 ? 'Excellent' : mlPerformance.performanceGainPercent >= 25 ? 'Good' : 'Active'}
                          color={mlPerformance.performanceGainPercent >= 50 ? 'success' : mlPerformance.performanceGainPercent >= 25 ? 'info' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Performance;
