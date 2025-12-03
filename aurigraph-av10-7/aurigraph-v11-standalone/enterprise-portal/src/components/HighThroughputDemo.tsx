// High Throughput Demo - Real-time TPS Performance Demonstration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Paper, Chip,
  LinearProgress, Avatar, CircularProgress, IconButton, Slider, Switch,
  FormControlLabel, Tooltip, Fade
} from '@mui/material';
import {
  Speed, PlayArrow, Pause, Refresh, TrendingUp, Memory,
  Timer, BoltOutlined, NetworkCheck, CloudQueue, BarChart,
  Settings, Fullscreen, FullscreenExit
} from '@mui/icons-material';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Bar
} from 'recharts';
import { alpha } from '@mui/material/styles';
import { colors, glassStyles, animations } from '../styles/v0-theme';

const API_BASE = 'https://dlt.aurigraph.io';

interface TPSDataPoint {
  timestamp: number;
  tps: number;
  latency: number;
  successRate: number;
  memoryUsage: number;
}

interface DemoConfig {
  targetTPS: number;
  burstMode: boolean;
  quantumSecurity: boolean;
  aiOptimization: boolean;
}

const NEON_GLOW = {
  boxShadow: `0 0 30px ${alpha('#00FFA3', 0.4)}, 0 0 60px ${alpha('#00FFA3', 0.2)}`,
};

const GLASS_CARD = {
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 3,
};

const METRIC_CARD = {
  ...GLASS_CARD,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 48px rgba(0, 0, 0, 0.4), 0 0 30px ${alpha('#00FFA3', 0.3)}`,
  },
};

export const HighThroughputDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tpsData, setTpsData] = useState<TPSDataPoint[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);
  const [peakTPS, setPeakTPS] = useState(0);
  const [avgTPS, setAvgTPS] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [latency, setLatency] = useState(0);
  const [successRate, setSuccessRate] = useState(99.99);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState<DemoConfig>({
    targetTPS: 1000000,
    burstMode: false,
    quantumSecurity: true,
    aiOptimization: true,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Simulate high-throughput metrics
  const generateMetrics = useCallback(() => {
    const baseMultiplier = config.aiOptimization ? 1.3 : 1;
    const burstMultiplier = config.burstMode ? 1.5 : 1;
    const securityOverhead = config.quantumSecurity ? 0.95 : 1;

    const targetBase = config.targetTPS * baseMultiplier * burstMultiplier * securityOverhead;
    const variance = (Math.random() - 0.5) * 0.2; // +/- 10%
    const newTPS = Math.round(targetBase * (1 + variance));

    const newLatency = config.aiOptimization
      ? 20 + Math.random() * 30
      : 40 + Math.random() * 60;

    const newSuccessRate = 99.9 + Math.random() * 0.09;
    const newMemory = 40 + Math.random() * 30;

    setCurrentTPS(newTPS);
    setPeakTPS(prev => Math.max(prev, newTPS));
    setLatency(newLatency);
    setSuccessRate(newSuccessRate);
    setMemoryUsage(newMemory);

    setTotalTransactions(prev => prev + Math.round(newTPS / 10));

    setTpsData(prev => {
      const newData = [...prev.slice(-59), {
        timestamp: Date.now(),
        tps: newTPS,
        latency: newLatency,
        successRate: newSuccessRate,
        memoryUsage: newMemory,
      }];

      // Calculate average
      const avg = newData.reduce((sum, d) => sum + d.tps, 0) / newData.length;
      setAvgTPS(Math.round(avg));

      return newData;
    });
  }, [config]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        generateMetrics();
        setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, generateMetrics]);

  const handleStart = () => {
    setTpsData([]);
    setTotalTransactions(0);
    setPeakTPS(0);
    setAvgTPS(0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Hero Header */}
      <Fade in timeout={600}>
        <Paper
          sx={{
            ...GLASS_CARD,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, rgba(0, 255, 163, 0.1) 100%)',
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${alpha('#00FFA3', 0.15)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  bgcolor: '#00FFA3',
                  color: '#0F172A',
                  width: 56,
                  height: 56,
                  ...NEON_GLOW,
                }}>
                  <BoltOutlined sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00FFA3 0%, #0A84FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    High Throughput Demo
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                    Real-time performance demonstration • 2M+ TPS capable
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                {!isRunning ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStart}
                    startIcon={<PlayArrow />}
                    sx={{
                      background: 'linear-gradient(135deg, #00FFA3 0%, #0A84FF 100%)',
                      color: '#0F172A',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      ...NEON_GLOW,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 0 40px ${alpha('#00FFA3', 0.6)}, 0 0 80px ${alpha('#00FFA3', 0.3)}`,
                      },
                    }}
                  >
                    Start Demo
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStop}
                    startIcon={<Pause />}
                    sx={{
                      background: 'linear-gradient(135deg, #FF375F 0%, #FF6B9D 100%)',
                      color: 'white',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                    }}
                  >
                    Stop Demo
                  </Button>
                )}

                <Chip
                  icon={<NetworkCheck />}
                  label={isRunning ? 'LIVE' : 'READY'}
                  sx={{
                    bgcolor: isRunning ? alpha('#00FFA3', 0.2) : alpha('#94A3B8', 0.2),
                    color: isRunning ? '#00FFA3' : '#94A3B8',
                    fontWeight: 600,
                    animation: isRunning ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{
                    fontWeight: 800,
                    color: '#00FFA3',
                    textShadow: `0 0 30px ${alpha('#00FFA3', 0.5)}`,
                  }}>
                    {formatNumber(currentTPS)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>Current TPS</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{
                    fontWeight: 800,
                    color: '#0A84FF',
                    textShadow: `0 0 30px ${alpha('#0A84FF', 0.5)}`,
                  }}>
                    {formatNumber(peakTPS)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>Peak TPS</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Real-time Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha('#00FFA3', 0.2),
                color: '#00FFA3',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Speed sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#00FFA3', fontWeight: 700 }}>
                {formatNumber(avgTPS)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Average TPS</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha('#0A84FF', 0.2),
                color: '#0A84FF',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Timer sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#0A84FF', fontWeight: 700 }}>
                {latency.toFixed(1)}ms
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Latency</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha('#FFB800', 0.2),
                color: '#FFB800',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUp sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#FFB800', fontWeight: 700 }}>
                {successRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Success Rate</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha('#FF375F', 0.2),
                color: '#FF375F',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <BarChart sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#FF375F', fontWeight: 700 }}>
                {formatNumber(totalTransactions)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Total Transactions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TPS Chart */}
      <Card sx={{ ...GLASS_CARD, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Real-time TPS Performance
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Uptime: ${formatTime(uptime)}`}
                size="small"
                sx={{ bgcolor: alpha('#00FFA3', 0.2), color: '#00FFA3' }}
              />
              <Chip
                label={`Memory: ${memoryUsage.toFixed(0)}%`}
                size="small"
                sx={{ bgcolor: alpha('#0A84FF', 0.2), color: '#0A84FF' }}
              />
            </Box>
          </Box>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tpsData}>
              <defs>
                <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FFA3" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00FFA3" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0A84FF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                stroke="#64748B"
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => formatNumber(v)}
                stroke="#00FFA3"
                tick={{ fill: '#00FFA3', fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke="#0A84FF"
                tick={{ fill: '#0A84FF', fontSize: 11 }}
              />
              <RechartsTooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tps"
                stroke="#00FFA3"
                strokeWidth={2}
                fill="url(#tpsGradient)"
                name="TPS"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="latency"
                stroke="#0A84FF"
                strokeWidth={2}
                dot={false}
                name="Latency (ms)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <Card sx={GLASS_CARD}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Settings sx={{ color: '#00FFA3' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Demo Configuration
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                Target TPS: {formatNumber(config.targetTPS)}
              </Typography>
              <Slider
                value={config.targetTPS}
                min={100000}
                max={2000000}
                step={100000}
                onChange={(_, value) => setConfig(prev => ({ ...prev, targetTPS: value as number }))}
                disabled={isRunning}
                sx={{
                  color: '#00FFA3',
                  '& .MuiSlider-thumb': {
                    boxShadow: `0 0 10px ${alpha('#00FFA3', 0.5)}`,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.aiOptimization}
                      onChange={(e) => setConfig(prev => ({ ...prev, aiOptimization: e.target.checked }))}
                      disabled={isRunning}
                      sx={{
                        '& .Mui-checked': { color: '#00FFA3' },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00FFA3' },
                      }}
                    />
                  }
                  label={<Typography variant="body2">AI Optimization (+30% TPS)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.burstMode}
                      onChange={(e) => setConfig(prev => ({ ...prev, burstMode: e.target.checked }))}
                      disabled={isRunning}
                      sx={{
                        '& .Mui-checked': { color: '#FFB800' },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#FFB800' },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Burst Mode (+50% peak capacity)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.quantumSecurity}
                      onChange={(e) => setConfig(prev => ({ ...prev, quantumSecurity: e.target.checked }))}
                      disabled={isRunning}
                      sx={{
                        '& .Mui-checked': { color: '#0A84FF' },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#0A84FF' },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Quantum-Resistant Security (NIST Level 5)</Typography>}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {[
          { icon: <BoltOutlined />, title: '2M+ TPS', desc: 'Ultra-high throughput blockchain processing', color: '#00FFA3' },
          { icon: <Timer />, title: '<100ms Finality', desc: 'Near-instant transaction confirmation', color: '#0A84FF' },
          { icon: <Memory />, title: '<256MB Memory', desc: 'Efficient native GraalVM compilation', color: '#FFB800' },
          { icon: <CloudQueue />, title: 'Multi-Cloud', desc: 'Deploy across AWS, Azure, and GCP', color: '#FF375F' },
        ].map((feature) => (
          <Grid item xs={6} md={3} key={feature.title}>
            <Paper
              sx={{
                ...GLASS_CARD,
                p: 3,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px rgba(0, 0, 0, 0.3), 0 0 20px ${alpha(feature.color, 0.3)}`,
                },
              }}
            >
              <Avatar sx={{
                bgcolor: alpha(feature.color, 0.2),
                color: feature.color,
                width: 48,
                height: 48,
                mx: 'auto',
                mb: 2
              }}>
                {feature.icon}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: feature.color }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                {feature.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HighThroughputDemo;
