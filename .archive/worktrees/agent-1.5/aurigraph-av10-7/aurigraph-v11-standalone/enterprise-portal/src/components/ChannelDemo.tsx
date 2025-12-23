import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Paper, IconButton,
  List, ListItem, ListItemText, Slider, Switch, FormControlLabel, Select, MenuItem,
  InputLabel, FormControl, Chip, Alert, LinearProgress, Tabs, Tab, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Avatar, Divider
} from '@mui/material';
import {
  PlayArrow, Pause, Stop, Settings, Speed, Storage, Memory, TrendingUp,
  Send, AccountBalance, SwapHoriz, Code, Security, Group, CheckCircle, Error
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import ChannelService, { Channel } from '../services/ChannelService';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  tpsTarget: number;
  transactionTypes: string[];
}

const scenarios: DemoScenario[] = [
  {
    id: 'high-volume',
    name: 'High Volume Trading',
    description: 'Simulate high-frequency trading with thousands of transactions per second',
    duration: 60,
    tpsTarget: 100000,
    transactionTypes: ['trade', 'order', 'settlement']
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Tracking',
    description: 'Track products through multiple stages of supply chain',
    duration: 120,
    tpsTarget: 10000,
    transactionTypes: ['create', 'update', 'transfer', 'verify']
  },
  {
    id: 'defi',
    name: 'DeFi Operations',
    description: 'Decentralized finance operations including swaps, lending, and staking',
    duration: 90,
    tpsTarget: 50000,
    transactionTypes: ['swap', 'stake', 'lend', 'borrow', 'liquidate']
  },
  {
    id: 'nft',
    name: 'NFT Marketplace',
    description: 'NFT minting, trading, and auction activities',
    duration: 60,
    tpsTarget: 5000,
    transactionTypes: ['mint', 'list', 'bid', 'buy', 'transfer']
  },
  {
    id: 'iot',
    name: 'IoT Data Stream',
    description: 'Process continuous streams of IoT sensor data',
    duration: 180,
    tpsTarget: 200000,
    transactionTypes: ['sensor', 'telemetry', 'alert', 'aggregate']
  }
];

interface ChannelDemoProps {
  channelId: string;
}

const ChannelDemo: React.FC<ChannelDemoProps> = ({ channelId }) => {
  const [channel, setChannel] = useState<Channel | undefined>();
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(scenarios[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTps, setCurrentTps] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [successRate, setSuccessRate] = useState(100);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [transactionLog, setTransactionLog] = useState<any[]>([]);
  const [demoConfig, setDemoConfig] = useState({
    batchSize: 100,
    threadCount: 10,
    autoScale: true,
    simulateFailures: false,
    networkLatency: 10
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const ch = ChannelService.getChannel(channelId);
    setChannel(ch);

    const handleTransaction = (event: any) => {
      if (event.channelId === channelId) {
        setTransactionLog(prev => [{
          ...event.transaction,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 99)]);
      }
    };

    ChannelService.on('transaction', handleTransaction);
    return () => {
      ChannelService.off('transaction', handleTransaction);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [channelId]);

  const startDemo = () => {
    if (!channel) return;

    setIsRunning(true);
    setIsPaused(false);
    setProgress(0);
    setTotalTransactions(0);
    setTransactionLog([]);
    setPerformanceData([]);
    startTimeRef.current = Date.now();

    let txCount = 0;
    let dataPoints = 0;

    intervalRef.current = setInterval(() => {
      if (isPaused) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progressPercent = (elapsed / selectedScenario.duration) * 100;

      if (progressPercent >= 100) {
        stopDemo();
        return;
      }

      setProgress(progressPercent);

      // Calculate dynamic TPS based on scenario
      const targetTps = selectedScenario.tpsTarget;
      const variance = 0.2;
      const actualTps = Math.floor(targetTps * (1 + (Math.random() - 0.5) * variance));
      setCurrentTps(actualTps);

      // Generate batch transactions
      const batchSize = Math.floor(actualTps / 10); // Process in 100ms batches
      for (let i = 0; i < batchSize; i++) {
        const txType = selectedScenario.transactionTypes[
          Math.floor(Math.random() * selectedScenario.transactionTypes.length)
        ];

        const transaction = {
          id: `${channel.id}_tx_${++txCount}`,
          channelId: channel.id,
          type: txType,
          from: `0x${Math.random().toString(16).substr(2, 40)}`,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: Math.floor(Math.random() * 1000),
          gas: Math.floor(21000 + Math.random() * 10000),
          status: Math.random() > 0.02 ? 'success' : 'failed',
          timestamp: new Date()
        };

        ChannelService.emit('transaction', { channelId, transaction });
      }

      setTotalTransactions(prev => prev + batchSize);

      // Update performance metrics
      if (dataPoints++ % 5 === 0) { // Update chart every 500ms
        setPerformanceData(prev => [...prev.slice(-59), {
          time: elapsed.toFixed(1),
          tps: actualTps,
          latency: demoConfig.networkLatency + Math.random() * 5,
          cpu: Math.min(95, 20 + (actualTps / targetTps) * 60 + Math.random() * 10),
          memory: Math.min(95, 30 + (actualTps / targetTps) * 40 + Math.random() * 5)
        }]);
      }

      // Update channel metrics
      if (channel) {
        channel.metrics.tps = actualTps;
        channel.metrics.totalTransactions += batchSize;
        channel.metrics.blockHeight += Math.random() > 0.8 ? 1 : 0;
        ChannelService.emit('metrics_updated', { channelId, metrics: channel.metrics });
      }
    }, 100);
  };

  const pauseDemo = () => {
    setIsPaused(!isPaused);
  };

  const stopDemo = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTps(0);

    // Show summary
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const avgTps = Math.floor(totalTransactions / duration);

    alert(`Demo completed!
    Channel: ${channel?.name}
    Scenario: ${selectedScenario.name}
    Duration: ${duration.toFixed(1)}s
    Total Transactions: ${totalTransactions.toLocaleString()}
    Average TPS: ${avgTps.toLocaleString()}
    Success Rate: ${successRate.toFixed(1)}%`);
  };

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      trade: '#8884d8',
      order: '#82ca9d',
      settlement: '#ffc658',
      create: '#ff7c7c',
      update: '#8dd1e1',
      transfer: '#d084d0',
      verify: '#67b7dc',
      swap: '#a4de6c',
      stake: '#ffd93d',
      lend: '#ffb6c1',
      mint: '#e91e63',
      sensor: '#00bcd4'
    };
    return colors[type] || '#999';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Channel Demo: {channel?.name}
      </Typography>

      {/* Demo Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Demo Scenario</InputLabel>
                <Select
                  value={selectedScenario.id}
                  onChange={(e) => setSelectedScenario(scenarios.find(s => s.id === e.target.value) || scenarios[0])}
                  disabled={isRunning}
                >
                  {scenarios.map(scenario => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedScenario.description}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={startDemo}
                  disabled={isRunning && !isPaused}
                >
                  Start
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Pause />}
                  onClick={pauseDemo}
                  disabled={!isRunning}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Stop />}
                  onClick={stopDemo}
                  disabled={!isRunning}
                  color="error"
                >
                  Stop
                </Button>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
              <Typography variant="caption">
                Progress: {progress.toFixed(1)}% • Time: {Math.floor(progress * selectedScenario.duration / 100)}s / {selectedScenario.duration}s
              </Typography>
            </Grid>
          </Grid>

          {/* Demo Configuration */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Batch Size</Typography>
              <Slider
                value={demoConfig.batchSize}
                onChange={(_, v) => setDemoConfig({ ...demoConfig, batchSize: v as number })}
                min={10}
                max={1000}
                valueLabelDisplay="auto"
                disabled={isRunning}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Thread Count</Typography>
              <Slider
                value={demoConfig.threadCount}
                onChange={(_, v) => setDemoConfig({ ...demoConfig, threadCount: v as number })}
                min={1}
                max={100}
                valueLabelDisplay="auto"
                disabled={isRunning}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Network Latency (ms)</Typography>
              <Slider
                value={demoConfig.networkLatency}
                onChange={(_, v) => setDemoConfig({ ...demoConfig, networkLatency: v as number })}
                min={1}
                max={100}
                valueLabelDisplay="auto"
                disabled={isRunning}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={demoConfig.autoScale}
                    onChange={(e) => setDemoConfig({ ...demoConfig, autoScale: e.target.checked })}
                    disabled={isRunning}
                  />
                }
                label="Auto-scale"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={demoConfig.simulateFailures}
                    onChange={(e) => setDemoConfig({ ...demoConfig, simulateFailures: e.target.checked })}
                    disabled={isRunning}
                  />
                }
                label="Simulate Failures"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Live Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Current TPS</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {currentTps.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Target: {selectedScenario.tpsTarget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SwapHoriz color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Transactions</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {totalTransactions.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Channel: {channel?.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {successRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Failures: {Math.floor(totalTransactions * (1 - successRate / 100))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Storage color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Block Height</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {channel?.metrics.blockHeight.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Latency: {channel?.metrics.latency}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip />
              <Line yAxisId="left" type="monotone" dataKey="tps" stroke="#8884d8" strokeWidth={2} name="TPS" />
              <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#82ca9d" strokeWidth={2} name="Latency (ms)" />
              <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#ffc658" strokeWidth={1} name="CPU %" />
              <Line yAxisId="left" type="monotone" dataKey="memory" stroke="#ff7c7c" strokeWidth={1} name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction Log */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {transactionLog.slice(0, 20).map((tx, index) => (
              <ListItem key={index}>
                <Chip
                  label={tx.type}
                  size="small"
                  sx={{
                    mr: 1,
                    bgcolor: getTransactionColor(tx.type),
                    color: 'white'
                  }}
                />
                <ListItemText
                  primary={`${tx.from?.substring(0, 10)}... → ${tx.to?.substring(0, 10)}...`}
                  secondary={`Value: ${tx.value} • Gas: ${tx.gas} • ${new Date(tx.timestamp).toLocaleTimeString()}`}
                />
                {tx.status === 'success' ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Error color="error" fontSize="small" />
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChannelDemo;