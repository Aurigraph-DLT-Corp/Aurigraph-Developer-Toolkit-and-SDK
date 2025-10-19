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
  Tooltip,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Warning, CloudQueue, Speed, TrendingUp } from '@mui/icons-material';
import axios from 'axios';

// Oracle API interfaces
interface Oracle {
  oracle_id: string;
  oracle_name: string;
  oracle_type: string;
  status: 'active' | 'degraded' | 'offline';
  uptime_percent: number;
  response_time_ms: number;
  requests_24h: number;
  errors_24h: number;
  error_rate: number;
  data_feeds_count: number;
  last_update: string;
  version: string;
  location: string;
  provider: string;
}

interface OracleSummary {
  total_oracles: number;
  active_oracles: number;
  degraded_oracles: number;
  offline_oracles: number;
  total_requests_24h: number;
  total_errors_24h: number;
  average_uptime_percent: number;
  average_response_time_ms: number;
  oracle_types: Record<string, number>;
}

interface OracleStatusResponse {
  timestamp: string;
  oracles: Oracle[];
  summary: OracleSummary;
  health_score: number;
}

// Data Feed API interfaces
interface DataFeed {
  feedId: string;
  name: string;
  type: string;
  source: string;
  endpoint: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  updateFrequency: string;
  dataFormat: string;
  subscribedAgents: number;
  totalDataPoints: number;
  lastUpdate: string;
  createdAt: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latency: number;
}

interface DataFeedResponse {
  totalFeeds: number;
  activeFeeds: number;
  feeds: DataFeed[];
}

// Combined integration interface for display
interface APIIntegration {
  id: string;
  name: string;
  endpoint: string;
  status: 'active' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  requestsPerMinute: number;
  successRate: number;
  type: string;
  provider: string;
  lastUpdate: string;
}

const ExternalAPIIntegration: React.FC = () => {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oracleHealthScore, setOracleHealthScore] = useState<number>(0);
  const [totalDataPoints, setTotalDataPoints] = useState<number>(0);

  const fetchData = async () => {
    try {
      // Fetch both APIs in parallel
      const [oracleResponse, dataFeedResponse] = await Promise.all([
        axios.get<OracleStatusResponse>('http://localhost:9003/api/v11/oracles/status'),
        axios.get<DataFeedResponse>('http://localhost:9003/api/v11/datafeeds')
      ]);

      // Process oracle data
      const oracleIntegrations: APIIntegration[] = oracleResponse.data.oracles.map(oracle => ({
        id: oracle.oracle_id,
        name: oracle.oracle_name,
        endpoint: `Oracle Service - ${oracle.location}`,
        status: oracle.status,
        uptime: oracle.uptime_percent,
        responseTime: oracle.response_time_ms,
        requestsPerMinute: Math.round(oracle.requests_24h / (24 * 60)),
        successRate: 100 - (oracle.error_rate * 100),
        type: oracle.oracle_type,
        provider: oracle.provider,
        lastUpdate: oracle.last_update
      }));

      // Process data feed data
      const dataFeedIntegrations: APIIntegration[] = dataFeedResponse.data.feeds.map(feed => {
        // Convert status to lowercase for consistency
        let status: 'active' | 'degraded' | 'down' = 'active';
        if (feed.healthStatus === 'DEGRADED') status = 'degraded';
        else if (feed.status !== 'ACTIVE') status = 'down';

        // Calculate uptime based on health status
        const uptime = feed.healthStatus === 'HEALTHY' ? 99.9 : feed.healthStatus === 'DEGRADED' ? 95.0 : 85.0;

        return {
          id: feed.feedId,
          name: feed.name,
          endpoint: feed.endpoint,
          status: status,
          uptime: uptime,
          responseTime: feed.latency,
          requestsPerMinute: feed.subscribedAgents * 10, // Approximate based on subscriptions
          successRate: feed.healthStatus === 'HEALTHY' ? 99.5 : feed.healthStatus === 'DEGRADED' ? 95.0 : 85.0,
          type: feed.type,
          provider: feed.source,
          lastUpdate: feed.lastUpdate
        };
      });

      // Combine all integrations
      const allIntegrations = [...oracleIntegrations, ...dataFeedIntegrations];

      setIntegrations(allIntegrations);
      setOracleHealthScore(oracleResponse.data.health_score);
      setTotalDataPoints(dataFeedResponse.data.feeds.reduce((sum, feed) => sum + feed.totalDataPoints, 0));
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching API integration data:', err);
      setError(`Failed to fetch external API integration data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        External API Integration Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudQueue sx={{ color: '#fff', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Total Integrations
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {integrations.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                Active: {integrations.filter(i => i.status === 'active').length} |
                Degraded: {integrations.filter(i => i.status === 'degraded').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #14c9b8 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ color: '#fff', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Oracle Health Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {oracleHealthScore.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                System health across all oracle nodes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: '#fff', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Total Data Points
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {(totalDataPoints / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                Collected across all data feeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integration Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Service</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Provider</strong></TableCell>
                  <TableCell><strong>Endpoint</strong></TableCell>
                  <TableCell align="center"><strong>Uptime</strong></TableCell>
                  <TableCell align="center"><strong>Response Time</strong></TableCell>
                  <TableCell align="center"><strong>Req/Min</strong></TableCell>
                  <TableCell align="center"><strong>Success Rate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow
                    key={integration.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9f9f9' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Tooltip title={`Status: ${integration.status}`}>
                        {getStatusIcon(integration.status)}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {integration.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Updated: {new Date(integration.lastUpdate).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={integration.type}
                        size="small"
                        sx={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{integration.provider}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 300 }}>
                      <Tooltip title={integration.endpoint}>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {integration.endpoint}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${integration.uptime.toFixed(2)}%`}
                        color={integration.uptime > 99 ? 'success' : integration.uptime > 95 ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: integration.responseTime < 100 ? 'success.main' :
                                 integration.responseTime < 200 ? 'warning.main' : 'error.main',
                          fontWeight: 600
                        }}
                      >
                        {integration.responseTime}ms
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {integration.requestsPerMinute.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${integration.successRate.toFixed(2)}%`}
                        color={integration.successRate > 95 ? 'success' : integration.successRate > 90 ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Last Update Timestamp */}
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Last updated: {new Date().toLocaleString()} • Auto-refresh every 5 seconds
        </Typography>
      </Box>
    </Box>
  );
};

export default ExternalAPIIntegration;
