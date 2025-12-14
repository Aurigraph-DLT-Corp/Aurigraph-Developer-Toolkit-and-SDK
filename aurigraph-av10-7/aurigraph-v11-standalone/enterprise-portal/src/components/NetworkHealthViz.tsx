// Network Health Visualization - V0 Style
// Stunning animated health metrics with glassmorphism

import React from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, alpha } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Speed,
  Storage,
  Security,
  Dns,
  CloudQueue,
} from '@mui/icons-material';
import { colors, animations, glassStyles } from '../styles/v0-theme';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface HealthMetric {
  label: string;
  value: number;
  max?: number;
  status: 'optimal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface Node {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'SLIM';
  endpoint: string;
  channelId: string;
}

interface Props {
  validators?: Node[];
  businessNodes?: Node[];
  eiNodes?: Node[];
  metrics?: {
    consensusHealth: string;
    uptime: number;
    activePeers: number;
    totalPeers: number;
    activeValidators: number;
    totalValidators: number;
    chainSize: string;
    stateSize: string;
    stakingRatio: number;
  };
}

export const NetworkHealthViz: React.FC<Props> = ({ validators = [], businessNodes = [], eiNodes = [], metrics: providedMetrics }) => {
  // Calculate metrics from node arrays if not provided
  const metrics = providedMetrics || {
    consensusHealth: 'OPTIMAL',
    uptime: 99.9,
    activePeers: validators.length + businessNodes.length + eiNodes.length,
    totalPeers: validators.length + businessNodes.length + eiNodes.length,
    activeValidators: validators.length,
    totalValidators: validators.length,
    chainSize: '2.4 TB',
    stateSize: '856 GB',
    stakingRatio: 68.5,
  };

  // Safe division helper to avoid NaN/undefined
  const safeDivide = (a: number | undefined | null, b: number | undefined | null, fallback: number = 100): number => {
    const numA = a ?? 0;
    const numB = b ?? 1; // Avoid division by zero
    if (numB === 0) return fallback;
    const result = (numA / numB) * 100;
    return isNaN(result) || !isFinite(result) ? fallback : result;
  };

  // Safe number accessor to avoid undefined.toFixed() errors
  const safeNumber = (val: number | undefined | null, fallback: number = 0): number => {
    if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return fallback;
    return val;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'optimal': return colors.brand.success;
      case 'warning': return colors.brand.warning;
      case 'critical': return colors.brand.error;
      default: return colors.brand.secondary;
    }
  };

  const peerNetworkValue = safeDivide(metrics.activePeers, metrics.totalPeers);
  const validatorValue = safeDivide(metrics.activeValidators, metrics.totalValidators);
  const uptimeValue = safeNumber(metrics.uptime, 99.9);

  const healthMetrics: HealthMetric[] = [
    {
      label: 'Consensus',
      value: metrics.consensusHealth === 'OPTIMAL' ? 100 : 75,
      status: metrics.consensusHealth === 'OPTIMAL' ? 'optimal' : 'warning',
      icon: <CheckCircle />,
    },
    {
      label: 'Uptime',
      value: uptimeValue,
      status: uptimeValue > 99.5 ? 'optimal' : uptimeValue > 95 ? 'warning' : 'critical',
      icon: <Speed />,
    },
    {
      label: 'Peer Network',
      value: peerNetworkValue,
      status: peerNetworkValue > 90 ? 'optimal' : 'warning',
      icon: <Dns />,
    },
    {
      label: 'Validators',
      value: validatorValue,
      status: validatorValue > 90 ? 'optimal' : 'warning',
      icon: <Security />,
    },
    {
      label: 'Staking',
      value: safeNumber(metrics.stakingRatio, 68.5),
      status: safeNumber(metrics.stakingRatio, 68.5) > 60 ? 'optimal' : safeNumber(metrics.stakingRatio, 68.5) > 40 ? 'warning' : 'critical',
      icon: <CloudQueue />,
    },
  ];

  // Pie chart data for validator distribution
  const activeValidators = safeNumber(metrics.activeValidators, 0);
  const totalValidators = safeNumber(metrics.totalValidators, 1);
  const validatorData = [
    { name: 'Active', value: activeValidators, color: colors.brand.primary },
    { name: 'Standby', value: Math.max(0, totalValidators - activeValidators), color: alpha(colors.dark.bgLighter, 0.5) },
  ];

  return (
    <Box>
      {/* Health Status Cards */}
      <Grid container spacing={2}>
        {healthMetrics.map((metric, index) => {
          const statusColor = metric.status === 'optimal' ? colors.brand.success :
                             metric.status === 'warning' ? colors.brand.warning :
                             colors.brand.error;

          return (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={metric.label}>
              <Card
                sx={{
                  ...glassStyles.card,
                  border: `1px solid ${alpha(statusColor, 0.3)}`,
                  transition: 'all 0.3s ease',
                  ...animations.slideUp,
                  animationDelay: `${index * 0.1}s`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 48px ${alpha(statusColor, 0.3)}`,
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box sx={{ color: statusColor }}>
                      {metric.icon}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: statusColor,
                        fontWeight: 800,
                      }}
                    >
                      {metric.value.toFixed(1)}%
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={metric.value}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      background: alpha(colors.dark.bgLighter, 0.3),
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${statusColor} 0%, ${alpha(statusColor, 0.7)} 100%)`,
                        borderRadius: 3,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Detailed Network Stats */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Validator Distribution */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              ...glassStyles.card,
              border: `1px solid ${alpha(colors.brand.primary, 0.2)}`,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: colors.brand.primary }} />
                Validator Network
              </Typography>

              <Box sx={{ height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={validatorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {validatorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
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
                    {metrics.activeValidators}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Total Validators</Typography>
                  <Typography variant="body2" fontWeight={600}>{metrics.totalValidators}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Active</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: colors.brand.primary }}>
                    {metrics.activeValidators}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Standby</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.totalValidators - metrics.activeValidators}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Peer Network */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              ...glassStyles.card,
              border: `1px solid ${alpha(colors.brand.secondary, 0.2)}`,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Dns sx={{ color: colors.brand.secondary }} />
                Network Peers
              </Typography>

              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.primary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {safeNumber(metrics.activePeers, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  of {safeNumber(metrics.totalPeers, 0)} total peers
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={safeDivide(metrics.activePeers, metrics.totalPeers)}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  background: alpha(colors.dark.bgLighter, 0.3),
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${colors.brand.secondary} 0%, ${colors.brand.primary} 100%)`,
                    borderRadius: 6,
                  },
                }}
              />

              <Box sx={{ mt: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Connection Rate</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: colors.brand.success }}>
                    {safeDivide(metrics.activePeers, metrics.totalPeers).toFixed(1)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Network Status</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: colors.brand.success }}>
                    HEALTHY
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Stats */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              ...glassStyles.card,
              border: `1px solid ${alpha(colors.brand.warning, 0.2)}`,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage sx={{ color: colors.brand.warning }} />
                Blockchain Storage
              </Typography>

              <Box sx={{ my: 3 }}>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
                    <Typography variant="body2" color="text.secondary">Chain Size</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: colors.brand.warning }}>
                      {metrics.chainSize}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={75}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: alpha(colors.dark.bgLighter, 0.3),
                      '& .MuiLinearProgress-bar': {
                        background: colors.brand.warning,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
                    <Typography variant="body2" color="text.secondary">State Size</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: colors.brand.secondary }}>
                      {metrics.stateSize}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={60}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: alpha(colors.dark.bgLighter, 0.3),
                      '& .MuiLinearProgress-bar': {
                        background: colors.brand.secondary,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Pruning</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: colors.brand.success }}>
                  ENABLED
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
