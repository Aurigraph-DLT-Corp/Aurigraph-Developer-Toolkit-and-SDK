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
import axios from 'axios';

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
}

const SystemHealth: React.FC = () => {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/health');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch system health data');
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
        {/* CPU Usage */}
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
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
