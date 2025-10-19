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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// Backend API response interfaces matching Java records
interface MemoryUsage {
  total: number;
  used: number;
  free: number;
}

interface DiskIO {
  read: number;
  write: number;
}

interface NetworkIO {
  inbound: number;
  outbound: number;
}

interface ResponseTime {
  p50: number;
  p95: number;
  p99: number;
}

interface PerformanceMetricsAPI {
  memoryUsage: MemoryUsage;
  cpuUtilization: number;
  diskIO: DiskIO;
  networkIO: NetworkIO;
  responseTime: ResponseTime;
  throughput: number;
  errorRate: number;
  uptimeSeconds: number;
  timestamp: string;
}

interface TPSOverTime {
  timestamp: string;
  tps: number;
}

interface DashboardAPI {
  tpsOverTime: TPSOverTime[];
  totalTransactions: number;
  avgTPS: number;
  timestamp: string;
}

// UI state interface
interface PerformanceData {
  currentTPS: number;
  peakTPS: number;
  averageTPS: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  cpuPercent: number;
  diskReadMBps: number;
  diskWriteMBps: number;
  networkInboundMBps: number;
  networkOutboundMBps: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  uptimeSeconds: number;
  throughputHistory: Array<{
    time: string;
    tps: number;
  }>;
  latencyPercentiles: Array<{
    percentile: string;
    latency: number;
  }>;
}

const PerformanceMetrics: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch performance metrics and dashboard data in parallel
        const [performanceResponse, dashboardResponse] = await Promise.all([
          axios.get<PerformanceMetricsAPI>('/api/v11/analytics/performance'),
          axios.get<DashboardAPI>('/api/v11/analytics/dashboard')
        ]);

        const perfMetrics = performanceResponse.data;
        const dashboardData = dashboardResponse.data;

        // Calculate peak TPS from history
        const peakTPS = Math.max(
          ...dashboardData.tpsOverTime.map(point => point.tps),
          perfMetrics.throughput
        );

        // Transform TPS history for chart (last 24 data points)
        const throughputHistory = dashboardData.tpsOverTime
          .slice(-24)
          .map(point => ({
            time: new Date(point.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            tps: Math.round(point.tps)
          }));

        // Create latency percentiles data for chart
        const latencyPercentiles = [
          { percentile: 'P50', latency: perfMetrics.responseTime.p50 },
          { percentile: 'P95', latency: perfMetrics.responseTime.p95 },
          { percentile: 'P99', latency: perfMetrics.responseTime.p99 }
        ];

        // Combine all data into UI state
        const combinedData: PerformanceData = {
          currentTPS: Math.round(perfMetrics.throughput),
          peakTPS: Math.round(peakTPS),
          averageTPS: Math.round(dashboardData.avgTPS),
          memoryUsedMB: perfMetrics.memoryUsage.used,
          memoryTotalMB: perfMetrics.memoryUsage.total,
          cpuPercent: perfMetrics.cpuUtilization,
          diskReadMBps: perfMetrics.diskIO.read,
          diskWriteMBps: perfMetrics.diskIO.write,
          networkInboundMBps: perfMetrics.networkIO.inbound,
          networkOutboundMBps: perfMetrics.networkIO.outbound,
          latencyP50: perfMetrics.responseTime.p50,
          latencyP95: perfMetrics.responseTime.p95,
          latencyP99: perfMetrics.responseTime.p99,
          errorRate: perfMetrics.errorRate,
          uptimeSeconds: perfMetrics.uptimeSeconds,
          throughputHistory,
          latencyPercentiles
        };

        setData(combinedData);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch performance metrics:', err);
        setError('Failed to fetch performance metrics from backend');
        setLoading(false);
      }
    };

    fetchData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Performance Metrics Dashboard
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

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Performance Metrics Dashboard
        </Typography>
        {lastUpdate && (
          <Chip
            label={`Last Updated: ${lastUpdate}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* TPS Metrics Row */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Current TPS
              </Typography>
              <Typography variant="h4">{data.currentTPS.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Peak TPS
              </Typography>
              <Typography variant="h4">{data.peakTPS.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Average TPS (24h)
              </Typography>
              <Typography variant="h4">{data.averageTPS.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Error Rate
              </Typography>
              <Typography variant="h4">{(data.errorRate * 100).toFixed(3)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Resource Metrics Row */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                CPU Utilization
              </Typography>
              <Typography variant="h4">{data.cpuPercent.toFixed(1)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={data.cpuPercent}
                sx={{ mt: 1 }}
                color={data.cpuPercent > 80 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Memory Usage
              </Typography>
              <Typography variant="h4">
                {data.memoryUsedMB.toLocaleString()} MB
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {data.memoryTotalMB.toLocaleString()} MB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(data.memoryUsedMB / data.memoryTotalMB) * 100}
                sx={{ mt: 1 }}
                color={(data.memoryUsedMB / data.memoryTotalMB) > 0.8 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Disk I/O
              </Typography>
              <Typography variant="body2">
                Read: {data.diskReadMBps.toFixed(1)} MB/s
              </Typography>
              <Typography variant="body2">
                Write: {data.diskWriteMBps.toFixed(1)} MB/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Network I/O
              </Typography>
              <Typography variant="body2">
                In: {data.networkInboundMBps.toFixed(1)} MB/s
              </Typography>
              <Typography variant="body2">
                Out: {data.networkOutboundMBps.toFixed(1)} MB/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Latency Metrics Row */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Latency P50 (Median)
              </Typography>
              <Typography variant="h4">{data.latencyP50.toFixed(2)} ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Latency P95
              </Typography>
              <Typography variant="h4">{data.latencyP95.toFixed(2)} ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Latency P99
              </Typography>
              <Typography variant="h4">{data.latencyP99.toFixed(2)} ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                System Uptime
              </Typography>
              <Typography variant="h6">{formatUptime(data.uptimeSeconds)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Throughput History Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Throughput History (Last 24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.throughputHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    label={{ value: 'TPS', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'TPS']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tps"
                    stroke="#00897b"
                    strokeWidth={2}
                    name="Transactions Per Second"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Latency Percentiles Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Percentiles
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.latencyPercentiles}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="percentile" />
                  <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)} ms`, 'Latency']} />
                  <Legend />
                  <Bar dataKey="latency" fill="#00897b" name="Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time System Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Memory
                    </Typography>
                    <Typography variant="h6">
                      {data.memoryTotalMB.toLocaleString()} MB
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Free Memory
                    </Typography>
                    <Typography variant="h6">
                      {(data.memoryTotalMB - data.memoryUsedMB).toLocaleString()} MB
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Memory Utilization
                    </Typography>
                    <Typography variant="h6">
                      {((data.memoryUsedMB / data.memoryTotalMB) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      CPU Load
                    </Typography>
                    <Typography variant="h6">
                      {data.cpuPercent.toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics;
