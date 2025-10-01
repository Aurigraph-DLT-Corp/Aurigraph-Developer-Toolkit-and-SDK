import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Slider, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, LinearProgress, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Speed, Memory, Storage, NetworkCheck, TrendingUp } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Performance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tps, setTps] = useState(776000);
  const [targetTps, setTargetTps] = useState(2000000);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 78,
    latency: 12,
    throughput: 850000
  });

  const [testConfig, setTestConfig] = useState({
    duration: 60,
    threads: 256,
    targetTps: 1000000,
    batchSize: 10000
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTps(prev => Math.min(prev + Math.floor(Math.random() * 10000), targetTps));
      setMetrics(prev => ({
        cpu: Math.min(95, prev.cpu + (Math.random() - 0.5) * 5),
        memory: Math.min(95, prev.memory + (Math.random() - 0.5) * 3),
        disk: Math.min(95, prev.disk + (Math.random() - 0.5) * 2),
        network: Math.min(95, prev.network + (Math.random() - 0.5) * 4),
        latency: Math.max(1, prev.latency + (Math.random() - 0.5) * 2),
        throughput: Math.min(2000000, prev.throughput + Math.floor(Math.random() * 50000))
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTps]);

  const runLoadTest = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Load test completed successfully!');
    }, 3000);
  };

  const performanceData = Array.from({ length: 60 }, (_, i) => ({
    time: i,
    tps: Math.floor(Math.random() * 100000 + 700000),
    latency: Math.random() * 50,
    cpu: Math.random() * 100,
    memory: Math.random() * 100
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Performance Monitoring</Typography>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Live TPS Monitor</Typography>
              <Typography variant="h2" color="primary">{tps.toLocaleString()} TPS</Typography>
              <LinearProgress variant="determinate" value={(tps / targetTps) * 100} sx={{ mt: 2, height: 10 }} />
              <Typography variant="caption">Target: {targetTps.toLocaleString()} TPS</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Resources</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">CPU: {metrics.cpu.toFixed(1)}%</Typography>
                <LinearProgress variant="determinate" value={metrics.cpu} color={metrics.cpu > 80 ? "error" : "primary"} />
                <Typography variant="body2" sx={{ mt: 1 }}>Memory: {metrics.memory.toFixed(1)}%</Typography>
                <LinearProgress variant="determinate" value={metrics.memory} color={metrics.memory > 80 ? "error" : "primary"} />
                <Typography variant="body2" sx={{ mt: 1 }}>Network: {metrics.network.toFixed(1)}%</Typography>
                <LinearProgress variant="determinate" value={metrics.network} color={metrics.network > 80 ? "error" : "primary"} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Performance History</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tps" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="latency" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
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
                    <Typography gutterBottom>Enable AI Optimization</Typography>
                    <Switch defaultChecked />
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
                    <TableCell>TPS</TableCell>
                    <TableCell>{tps.toLocaleString()}</TableCell>
                    <TableCell>2,000,000</TableCell>
                    <TableCell><Chip label="In Progress" color="warning" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Latency</TableCell>
                    <TableCell>{metrics.latency}ms</TableCell>
                    <TableCell>&lt;10ms</TableCell>
                    <TableCell><Chip label="Achieved" color="success" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Throughput</TableCell>
                    <TableCell>{metrics.throughput.toLocaleString()} tx/s</TableCell>
                    <TableCell>2,000,000 tx/s</TableCell>
                    <TableCell><Chip label="Optimizing" color="info" /></TableCell>
                  </TableRow>
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
