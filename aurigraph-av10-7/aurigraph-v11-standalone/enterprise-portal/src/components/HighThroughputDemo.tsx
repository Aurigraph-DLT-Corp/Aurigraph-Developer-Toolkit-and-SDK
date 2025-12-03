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

// Peacock Blue theme colors
const PEACOCK = {
  primary: '#00A6A6',
  secondary: '#007C91',
  accent: '#4ECDC4',
  warning: '#E8AA42',
  bg: '#0D1B2A',
  bgLight: '#1B2838',
};

const SUBTLE_GLOW = {
  boxShadow: `0 0 20px ${alpha(PEACOCK.primary, 0.3)}, 0 0 40px ${alpha(PEACOCK.primary, 0.15)}`,
};

const GLASS_CARD = {
  background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(27, 40, 56, 0.95) 100%)',
  backdropFilter: 'blur(16px)',
  border: `1px solid ${alpha(PEACOCK.primary, 0.15)}`,
  borderRadius: 3,
};

const METRIC_CARD = {
  ...GLASS_CARD,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 40px rgba(0, 0, 0, 0.35), 0 0 20px ${alpha(PEACOCK.primary, 0.2)}`,
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
            background: `linear-gradient(135deg, ${PEACOCK.bg} 0%, ${PEACOCK.bgLight} 50%, ${alpha(PEACOCK.primary, 0.08)} 100%)`,
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
            background: `radial-gradient(circle, ${alpha(PEACOCK.primary, 0.1)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  bgcolor: PEACOCK.primary,
                  color: PEACOCK.bg,
                  width: 56,
                  height: 56,
                  ...SUBTLE_GLOW,
                }}>
                  <BoltOutlined sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${PEACOCK.primary} 0%, ${PEACOCK.accent} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    High Throughput Demo
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#8BA4B4' }}>
                    Real-time performance demonstration - 2M+ TPS capable
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
                      background: `linear-gradient(135deg, ${PEACOCK.primary} 0%, ${PEACOCK.secondary} 100%)`,
                      color: PEACOCK.bg,
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      ...SUBTLE_GLOW,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 0 30px ${alpha(PEACOCK.primary, 0.5)}, 0 0 60px ${alpha(PEACOCK.primary, 0.25)}`,
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
                      background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
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
                    bgcolor: isRunning ? alpha(PEACOCK.primary, 0.2) : alpha('#8BA4B4', 0.2),
                    color: isRunning ? PEACOCK.primary : '#8BA4B4',
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
                    color: PEACOCK.primary,
                    textShadow: `0 0 20px ${alpha(PEACOCK.primary, 0.4)}`,
                  }}>
                    {formatNumber(currentTPS)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Current TPS</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{
                    fontWeight: 800,
                    color: PEACOCK.accent,
                    textShadow: `0 0 20px ${alpha(PEACOCK.accent, 0.4)}`,
                  }}>
                    {formatNumber(peakTPS)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Peak TPS</Typography>
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
                bgcolor: alpha(PEACOCK.primary, 0.15),
                color: PEACOCK.primary,
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Speed sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: PEACOCK.primary, fontWeight: 700 }}>
                {formatNumber(avgTPS)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Average TPS</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha(PEACOCK.secondary, 0.15),
                color: PEACOCK.secondary,
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Timer sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: PEACOCK.secondary, fontWeight: 700 }}>
                {latency.toFixed(1)}ms
              </Typography>
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Latency</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha(PEACOCK.warning, 0.15),
                color: PEACOCK.warning,
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUp sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: PEACOCK.warning, fontWeight: 700 }}>
                {successRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Success Rate</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={METRIC_CARD}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{
                bgcolor: alpha(PEACOCK.accent, 0.15),
                color: PEACOCK.accent,
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <BarChart sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: PEACOCK.accent, fontWeight: 700 }}>
                {formatNumber(totalTransactions)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Total Transactions</Typography>
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
                sx={{ bgcolor: alpha(PEACOCK.primary, 0.15), color: PEACOCK.primary }}
              />
              <Chip
                label={`Memory: ${memoryUsage.toFixed(0)}%`}
                size="small"
                sx={{ bgcolor: alpha(PEACOCK.secondary, 0.15), color: PEACOCK.secondary }}
              />
            </Box>
          </Box>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tpsData}>
              <defs>
                <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PEACOCK.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PEACOCK.primary} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PEACOCK.secondary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PEACOCK.secondary} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 166, 166, 0.1)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                stroke="#5A7A8A"
                tick={{ fill: '#5A7A8A', fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => formatNumber(v)}
                stroke={PEACOCK.primary}
                tick={{ fill: PEACOCK.primary, fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke={PEACOCK.secondary}
                tick={{ fill: PEACOCK.secondary, fontSize: 11 }}
              />
              <RechartsTooltip
                contentStyle={{
                  background: 'rgba(13, 27, 42, 0.95)',
                  border: `1px solid ${alpha(PEACOCK.primary, 0.2)}`,
                  borderRadius: 8,
                }}
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tps"
                stroke={PEACOCK.primary}
                strokeWidth={2}
                fill="url(#tpsGradient)"
                name="TPS"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="latency"
                stroke={PEACOCK.accent}
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
            <Settings sx={{ color: PEACOCK.primary }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Demo Configuration
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#8BA4B4', mb: 2 }}>
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
                  color: PEACOCK.primary,
                  '& .MuiSlider-thumb': {
                    boxShadow: `0 0 8px ${alpha(PEACOCK.primary, 0.4)}`,
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
                        '& .Mui-checked': { color: PEACOCK.primary },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: PEACOCK.primary },
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
                        '& .Mui-checked': { color: PEACOCK.warning },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: PEACOCK.warning },
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
                        '& .Mui-checked': { color: PEACOCK.secondary },
                        '& .Mui-checked + .MuiSwitch-track': { bgcolor: PEACOCK.secondary },
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
          { icon: <BoltOutlined />, title: '2M+ TPS', desc: 'Ultra-high throughput blockchain processing', color: PEACOCK.primary },
          { icon: <Timer />, title: '<100ms Finality', desc: 'Near-instant transaction confirmation', color: PEACOCK.accent },
          { icon: <Memory />, title: '<256MB Memory', desc: 'Efficient native GraalVM compilation', color: PEACOCK.warning },
          { icon: <CloudQueue />, title: 'Multi-Cloud', desc: 'Deploy across AWS, Azure, and GCP', color: PEACOCK.secondary },
        ].map((feature) => (
          <Grid item xs={6} md={3} key={feature.title}>
            <Paper
              sx={{
                ...GLASS_CARD,
                p: 3,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 36px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(feature.color, 0.25)}`,
                },
              }}
            >
              <Avatar sx={{
                bgcolor: alpha(feature.color, 0.15),
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
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>
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
