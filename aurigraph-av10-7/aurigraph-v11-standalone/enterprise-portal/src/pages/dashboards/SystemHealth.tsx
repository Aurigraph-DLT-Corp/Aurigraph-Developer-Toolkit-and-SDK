import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Memory,
  Storage,
  Speed,
} from '@mui/icons-material';
import apiService from '../../services/api';

interface HealthCheckResponse {
  status: string;
  version: string;
  uptimeSeconds: number;
  totalRequests: number;
  platform: string;
}

interface PerformanceMetrics {
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
  cpuUtilization: number;
  diskIO: {
    read: number;
    write: number;
  };
  networkIO: {
    inbound: number;
    outbound: number;
  };
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
  uptimeSeconds: number;
  timestamp: string;
}

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  services: Array<{
    name: string;
    status: 'running' | 'stopped' | 'degraded';
    uptime: number;
  }>;
  alerts: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
  healthScore: number;
  throughput: number;
  errorRate: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
}

const SystemHealth: React.FC = () => {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to calculate health score based on metrics
  const calculateHealthScore = (
    cpuUsage: number,
    memoryPercentage: number,
    errorRate: number,
    responseTimeP95: number
  ): number => {
    let score = 100;

    // Penalize high CPU usage (>80% is critical)
    if (cpuUsage > 80) score -= 30;
    else if (cpuUsage > 60) score -= 15;
    else if (cpuUsage > 40) score -= 5;

    // Penalize high memory usage (>80% is critical)
    if (memoryPercentage > 80) score -= 30;
    else if (memoryPercentage > 60) score -= 15;
    else if (memoryPercentage > 40) score -= 5;

    // Penalize high error rate (>5% is critical)
    if (errorRate > 5) score -= 25;
    else if (errorRate > 2) score -= 10;
    else if (errorRate > 0.5) score -= 5;

    // Penalize slow response time (>100ms is concerning)
    if (responseTimeP95 > 100) score -= 15;
    else if (responseTimeP95 > 50) score -= 5;

    return Math.max(0, score);
  };

  // Function to determine overall status
  const determineStatus = (healthScore: number): 'healthy' | 'degraded' | 'critical' => {
    if (healthScore >= 80) return 'healthy';
    if (healthScore >= 50) return 'degraded';
    return 'critical';
  };

  // Function to generate alerts based on metrics
  const generateAlerts = (
    cpuUsage: number,
    memoryPercentage: number,
    errorRate: number,
    responseTimeP95: number,
    diskRead: number,
    diskWrite: number
  ): Array<{ level: 'info' | 'warning' | 'error'; message: string; timestamp: string }> => {
    const alerts: Array<{ level: 'info' | 'warning' | 'error'; message: string; timestamp: string }> = [];
    const timestamp = new Date().toISOString();

    if (cpuUsage > 80) {
      alerts.push({
        level: 'error',
        message: `Critical CPU usage: ${cpuUsage.toFixed(1)}%`,
        timestamp,
      });
    } else if (cpuUsage > 60) {
      alerts.push({
        level: 'warning',
        message: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
        timestamp,
      });
    }

    if (memoryPercentage > 80) {
      alerts.push({
        level: 'error',
        message: `Critical memory usage: ${memoryPercentage.toFixed(1)}%`,
        timestamp,
      });
    } else if (memoryPercentage > 60) {
      alerts.push({
        level: 'warning',
        message: `High memory usage: ${memoryPercentage.toFixed(1)}%`,
        timestamp,
      });
    }

    if (errorRate > 5) {
      alerts.push({
        level: 'error',
        message: `Critical error rate: ${errorRate.toFixed(2)}%`,
        timestamp,
      });
    } else if (errorRate > 2) {
      alerts.push({
        level: 'warning',
        message: `Elevated error rate: ${errorRate.toFixed(2)}%`,
        timestamp,
      });
    }

    if (responseTimeP95 > 100) {
      alerts.push({
        level: 'warning',
        message: `Slow response time (P95): ${responseTimeP95.toFixed(1)}ms`,
        timestamp,
      });
    }

    if (diskWrite > 5000) {
      alerts.push({
        level: 'info',
        message: `High disk write activity: ${diskWrite.toFixed(1)} MB/s`,
        timestamp,
      });
    }

    return alerts;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch health check and performance metrics in parallel
        const [healthResponse, performanceResponse] = await Promise.all([
          apiService.getHealth(),
          apiService.getAnalyticsPerformance(),
        ]);

        const health: HealthCheckResponse = healthResponse;
        const perf: PerformanceMetrics = performanceResponse;

        // Calculate memory percentage
        const memoryPercentage = (perf.memoryUsage.used / perf.memoryUsage.total) * 100;

        // Calculate health score
        const healthScore = calculateHealthScore(
          perf.cpuUtilization,
          memoryPercentage,
          perf.errorRate * 100,
          perf.responseTime.p95
        );

        // Determine overall status
        const status = determineStatus(healthScore);

        // Generate alerts
        const alerts = generateAlerts(
          perf.cpuUtilization,
          memoryPercentage,
          perf.errorRate * 100,
          perf.responseTime.p95,
          perf.diskIO.read,
          perf.diskIO.write
        );

        // Get CPU cores from system (default to 16 as per remote server specs)
        const cpuCores = 16;

        // Construct the system health data
        const systemHealthData: SystemHealthData = {
          status,
          uptime: health.uptimeSeconds,
          cpu: {
            usage: perf.cpuUtilization,
            cores: cpuCores,
          },
          memory: {
            used: perf.memoryUsage.used,
            total: perf.memoryUsage.total,
            percentage: memoryPercentage,
          },
          disk: {
            // Disk usage would need a dedicated endpoint, using estimates for now
            used: 50000, // 50 GB (placeholder)
            total: 133000, // 133 GB as per server specs
            percentage: (50000 / 133000) * 100,
          },
          services: [
            {
              name: 'Quarkus Runtime',
              status: health.status === 'HEALTHY' ? 'running' : 'degraded',
              uptime: health.uptimeSeconds,
            },
            {
              name: 'Transaction Processing',
              status: perf.throughput > 500000 ? 'running' : 'degraded',
              uptime: health.uptimeSeconds,
            },
            {
              name: 'Network Layer',
              status: perf.networkIO.inbound > 0 && perf.networkIO.outbound > 0 ? 'running' : 'degraded',
              uptime: health.uptimeSeconds,
            },
            {
              name: 'Consensus Engine',
              status: perf.errorRate < 0.05 ? 'running' : 'degraded',
              uptime: health.uptimeSeconds,
            },
          ],
          alerts,
          healthScore,
          throughput: perf.throughput,
          errorRate: perf.errorRate * 100,
          responseTime: perf.responseTime,
        };

        setData(systemHealthData);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch system health data:', err);
        setError('Failed to fetch system health data. Please check if the backend is running.');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle color="success" />;
      case 'degraded':
        return <Warning color="warning" />;
      case 'critical':
      case 'stopped':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'critical':
      case 'stopped':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Health Dashboard
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          System Health Dashboard
        </Typography>
        <Chip
          icon={getStatusIcon(data.status)}
          label={data.status.toUpperCase()}
          color={getStatusColor(data.status) as any}
          size="medium"
        />
      </Box>

      {/* Alerts Section */}
      {data.alerts && data.alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {data.alerts.map((alert, index) => (
            <Alert key={index} severity={alert.level} sx={{ mb: 1 }}>
              {alert.message} - {new Date(alert.timestamp).toLocaleString()}
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Health Score */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Score
              </Typography>
              <Typography variant="h3" gutterBottom color={
                data.healthScore >= 80 ? 'success.main' :
                data.healthScore >= 50 ? 'warning.main' : 'error.main'
              }>
                {data.healthScore.toFixed(0)}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.healthScore}
                sx={{ mb: 1 }}
                color={
                  data.healthScore >= 80 ? 'success' :
                  data.healthScore >= 50 ? 'warning' : 'error'
                }
              />
              <Typography variant="body2" color="text.secondary">
                Overall system health
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* CPU Usage */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                {data.cpu.usage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.cpu.usage}
                sx={{ mb: 1 }}
                color={data.cpu.usage > 80 ? 'error' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {data.cpu.cores} cores available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Memory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                {data.memory.percentage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.memory.percentage}
                sx={{ mb: 1 }}
                color={data.memory.percentage > 80 ? 'error' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {(data.memory.used / 1024).toFixed(2)} GB / {(data.memory.total / 1024).toFixed(2)} GB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Disk Usage */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Disk Usage</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                {data.disk.percentage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.disk.percentage}
                sx={{ mb: 1 }}
                color={data.disk.percentage > 80 ? 'error' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary">
                {(data.disk.used / 1024).toFixed(2)} GB / {(data.disk.total / 1024).toFixed(2)} GB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Throughput */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Throughput
              </Typography>
              <Typography variant="h3" gutterBottom color="primary.main">
                {(data.throughput / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TPS (Transactions Per Second)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Target: 2M+ TPS
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Time */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time (P95)
              </Typography>
              <Typography variant="h3" gutterBottom color={
                data.responseTime.p95 < 50 ? 'success.main' :
                data.responseTime.p95 < 100 ? 'warning.main' : 'error.main'
              }>
                {data.responseTime.p95.toFixed(1)}ms
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  P50: {data.responseTime.p50.toFixed(1)}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  P99: {data.responseTime.p99.toFixed(1)}ms
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h3" gutterBottom color={
                data.errorRate < 0.5 ? 'success.main' :
                data.errorRate < 2 ? 'warning.main' : 'error.main'
              }>
                {data.errorRate.toFixed(2)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(data.errorRate, 10) * 10}
                sx={{ mb: 1 }}
                color={
                  data.errorRate < 0.5 ? 'success' :
                  data.errorRate < 2 ? 'warning' : 'error'
                }
              />
              <Typography variant="body2" color="text.secondary">
                Target: {'<'}0.5%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Services Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <Grid container spacing={2}>
                {data.services.map((service, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getStatusIcon(service.status)}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          {service.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={service.status.toUpperCase()}
                        color={getStatusColor(service.status) as any}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Uptime: {(service.uptime / 3600).toFixed(2)}h
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Uptime */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Uptime
              </Typography>
              <Typography variant="h4">
                {Math.floor(data.uptime / 86400)}d {Math.floor((data.uptime % 86400) / 3600)}h{' '}
                {Math.floor((data.uptime % 3600) / 60)}m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealth;
