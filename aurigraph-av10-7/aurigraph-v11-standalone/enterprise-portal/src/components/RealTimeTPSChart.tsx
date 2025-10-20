// Real-Time TPS Visualization - Vizor Style
// Animated, responsive, stunning visual display of blockchain performance

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Card, CardContent, Grid, alpha } from '@mui/material';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, Speed, Bolt } from '@mui/icons-material';
import { colors, animations } from '../styles/v0-theme';

interface TPSDataPoint {
  timestamp: number;
  time: string;
  tps: number;
  latency: number;
  throughput: number;
}

interface Props {
  currentTPS: number;
  targetTPS: number;
  peakTPS: number;
  averageTPS: number;
}

export const RealTimeTPSChart: React.FC<Props> = ({
  currentTPS,
  targetTPS,
  peakTPS,
  averageTPS,
}) => {
  const [tpsHistory, setTPSHistory] = useState<TPSDataPoint[]>([]);
  const [isLive, setIsLive] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  // Simulate real-time data updates (replace with WebSocket in production)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLive) return;

      const now = Date.now();
      const newDataPoint: TPSDataPoint = {
        timestamp: now,
        time: new Date(now).toLocaleTimeString(),
        tps: currentTPS + (Math.random() - 0.5) * 50000, // Small variation
        latency: 40 + Math.random() * 20,
        throughput: currentTPS * 0.85,
      };

      setTPSHistory(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-60); // Keep last 60 data points (1 minute at 1s interval)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTPS, isLive]);

  const tpsPercentage = Math.min((currentTPS / targetTPS) * 100, 100);
  const radialData = [{ name: 'TPS', value: tpsPercentage, fill: colors.brand.primary }];

  // Format large numbers
  const formatTPS = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const formatLatency = (value: number) => `${value.toFixed(1)}ms`;

  return (
    <Box>
      {/* Main TPS Display - Vizor Style */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(colors.brand.primary, 0.1)} 0%, ${alpha(colors.brand.secondary, 0.05)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${alpha(colors.brand.primary, 0.3)}`,
          boxShadow: `0 8px 32px ${alpha(colors.brand.primary, 0.2)}, 0 0 60px ${alpha(colors.brand.primary, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 50%, ${alpha(colors.brand.primary, 0.15)}, transparent 50%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Live TPS Counter */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <Bolt sx={{ color: colors.brand.primary, mr: 1, ...animations.pulse }} />
                <Typography variant="overline" sx={{ color: colors.brand.primary, fontWeight: 700 }}>
                  LIVE TRANSACTIONS PER SECOND
                </Typography>
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontSize: '4rem',
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  ...animations.fadeIn,
                }}
              >
                {formatTPS(currentTPS)}
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">PEAK</Typography>
                  <Typography variant="h6" sx={{ color: colors.brand.warning }}>
                    {formatTPS(peakTPS)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">AVG</Typography>
                  <Typography variant="h6" sx={{ color: colors.brand.secondary }}>
                    {formatTPS(averageTPS)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">TARGET</Typography>
                  <Typography variant="h6" sx={{ color: colors.dark.textSecondary }}>
                    {formatTPS(targetTPS)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Radial Progress */}
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      minAngle={15}
                      background={{ fill: alpha(colors.dark.bgLighter, 0.3) }}
                      clockWise
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h3" sx={{ color: colors.brand.primary, fontWeight: 800 }}>
                    {tpsPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of target
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Real-Time Charts */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* TPS Area Chart */}
        <Grid item xs={12} lg={8}>
          <Card
            ref={chartRef}
            sx={{
              background: colors.gradients.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(colors.brand.primary, 0.2)}`,
              ...animations.slideUp,
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed sx={{ color: colors.brand.primary }} />
                  Real-Time TPS Monitor
                </Typography>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: colors.brand.primary,
                    ...animations.pulse,
                  }}
                />
              </Box>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tpsHistory}>
                  <defs>
                    <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.brand.primary} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={colors.brand.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.dark.border, 0.3)} />
                  <XAxis
                    dataKey="time"
                    stroke={colors.dark.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split(':').slice(1).join(':')}
                  />
                  <YAxis
                    stroke={colors.dark.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatTPS}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.dark.bgLight,
                      border: `1px solid ${colors.dark.border}`,
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    }}
                    labelStyle={{ color: colors.dark.text }}
                    formatter={(value: any) => [formatTPS(value), 'TPS']}
                  />
                  <Area
                    type="monotone"
                    dataKey="tps"
                    stroke={colors.brand.primary}
                    strokeWidth={3}
                    fill="url(#tpsGradient)"
                    animationDuration={300}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Latency Line Chart */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              background: colors.gradients.glass,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(colors.brand.secondary, 0.2)}`,
              height: '100%',
              ...animations.slideUp,
              animationDelay: '0.1s',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: colors.brand.secondary }} />
                Network Latency
              </Typography>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tpsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.dark.border, 0.3)} />
                  <XAxis
                    dataKey="time"
                    stroke={colors.dark.textSecondary}
                    tick={{ fontSize: 10 }}
                    hide
                  />
                  <YAxis
                    stroke={colors.dark.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatLatency}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.dark.bgLight,
                      border: `1px solid ${colors.dark.border}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [formatLatency(value), 'Latency']}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke={colors.brand.secondary}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: colors.brand.secondary, fontWeight: 700 }}>
                  {tpsHistory.length > 0 ? formatLatency(tpsHistory[tpsHistory.length - 1].latency) : '0ms'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Current Latency
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
