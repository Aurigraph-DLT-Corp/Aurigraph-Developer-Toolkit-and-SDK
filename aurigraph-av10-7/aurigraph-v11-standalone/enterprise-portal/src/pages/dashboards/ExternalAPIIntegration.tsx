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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import axios from 'axios';

interface APIIntegration {
  name: string;
  endpoint: string;
  status: 'active' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  requestsPerMinute: number;
  successRate: number;
  lastError?: string;
}

const ExternalAPIIntegration: React.FC = () => {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/external-api/status');
        setIntegrations(response.data.integrations || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch external API integration data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'degraded':
        return <Warning color="warning" />;
      case 'down':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          External API Integration Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        External API Integration Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Requests/Min</TableCell>
                  <TableCell>Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.map((integration, index) => (
                  <TableRow key={index}>
                    <TableCell>{getStatusIcon(integration.status)}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{integration.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {integration.endpoint}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${integration.uptime.toFixed(2)}%`}
                        color={integration.uptime > 99 ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{integration.responseTime}ms</TableCell>
                    <TableCell>{integration.requestsPerMinute}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${integration.successRate.toFixed(2)}%`}
                        color={integration.successRate > 95 ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExternalAPIIntegration;
