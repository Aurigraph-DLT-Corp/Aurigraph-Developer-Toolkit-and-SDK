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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';

// Backend API response interfaces
interface BackendOracleData {
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

interface BackendOracleStatus {
  timestamp: string;
  oracles: BackendOracleData[];
  summary: {
    total_oracles: number;
    active_oracles: number;
    degraded_oracles: number;
    offline_oracles: number;
    total_requests_24h: number;
    total_errors_24h: number;
    average_uptime_percent: number;
    average_response_time_ms: number;
    oracle_types: Record<string, number>;
  };
  health_score: number;
}

interface PriceData {
  asset_symbol: string;
  asset_name: string;
  price_usd: number;
  price_change_24h: number;
  volume_24h_usd: number;
  market_cap_usd: number;
  confidence_score: number;
  source_count: number;
  last_updated: string;
}

interface PriceSource {
  source_name: string;
  source_type: string;
  status: string;
  reliability_score: number;
  last_update: string;
  update_count_24h: number;
  supported_assets: number;
}

interface BackendPriceFeedData {
  timestamp: string;
  prices: PriceData[];
  sources: PriceSource[];
  aggregation_method: string;
  update_frequency_ms: number;
}

// UI state interfaces
interface OracleData {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'active' | 'degraded' | 'offline';
  uptime: number;
  dataFeeds: number;
  responseTime: number;
  errorRate: number;
  lastUpdate: string;
  version: string;
  location: string;
  requests24h: number;
}

interface OracleMetrics {
  totalOracles: number;
  activeOracles: number;
  degradedOracles: number;
  offlineOracles: number;
  healthScore: number;
  averageUptime: number;
  averageResponseTime: number;
  totalRequests24h: number;
  oracles: OracleData[];
  priceFeeds: PriceData[];
  priceSources: PriceSource[];
}

const OracleService: React.FC = () => {
  const [data, setData] = useState<OracleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real blockchain stats to generate oracle data
        const stats = await apiService.getMetrics();

        // Generate sample oracle services based on blockchain activity
        const sampleOracles: OracleData[] = [
          {
            id: 'oracle_chainlink_01',
            name: 'Chainlink Node 1',
            provider: 'Chainlink',
            type: 'Price Feed',
            status: 'active',
            uptime: 99.95,
            dataFeeds: 150,
            responseTime: 45,
            errorRate: 0.05,
            lastUpdate: new Date().toISOString(),
            version: '1.7.0',
            location: 'US-East',
            requests24h: Math.floor((stats.transactionStats?.last24h || 0) / 100)
          },
          {
            id: 'oracle_band_01',
            name: 'Band Protocol Node',
            provider: 'Band Protocol',
            type: 'Multi-Feed',
            status: 'active',
            uptime: 99.8,
            dataFeeds: 200,
            responseTime: 52,
            errorRate: 0.2,
            lastUpdate: new Date().toISOString(),
            version: '2.5.0',
            location: 'EU-West',
            requests24h: Math.floor((stats.transactionStats?.last24h || 0) / 150)
          },
          {
            id: 'oracle_pyth_01',
            name: 'Pyth Network Oracle',
            provider: 'Pyth',
            type: 'High-Frequency',
            status: 'active',
            uptime: 99.9,
            dataFeeds: 300,
            responseTime: 30,
            errorRate: 0.1,
            lastUpdate: new Date().toISOString(),
            version: '1.2.0',
            location: 'Asia-Pacific',
            requests24h: Math.floor((stats.transactionStats?.last24h || 0) / 80)
          }
        ];

        // Generate sample price feeds
        const samplePriceFeeds: PriceFeed[] = [
          { symbol: 'BTC/USD', price: 43250.50, change: 2.5, source: 'Chainlink', lastUpdate: new Date().toISOString() },
          { symbol: 'ETH/USD', price: 2280.75, change: 1.8, source: 'Band', lastUpdate: new Date().toISOString() },
          { symbol: 'AUR/USD', price: 0.85, change: 5.2, source: 'Pyth', lastUpdate: new Date().toISOString() },
          { symbol: 'SOL/USD', price: 98.30, change: -0.5, source: 'Chainlink', lastUpdate: new Date().toISOString() }
        ];

        const transformedData: OracleMetrics = {
          totalOracles: sampleOracles.length,
          activeOracles: sampleOracles.filter(o => o.status === 'active').length,
          degradedOracles: sampleOracles.filter(o => o.status === 'degraded').length,
          offlineOracles: sampleOracles.filter(o => o.status === 'offline').length,
          healthScore: 98.5,
          averageUptime: 99.88,
          averageResponseTime: 42.3,
          totalRequests24h: stats.transactionStats?.last24h || 0,
          oracles: sampleOracles,
          priceFeeds: samplePriceFeeds,
          priceSources: ['Chainlink', 'Band Protocol', 'Pyth Network']
        };

        setData(transformedData);
        setLoading(false);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to fetch oracle service data: ${errorMessage}`);
        setLoading(false);
        console.error('Oracle service data fetch error:', err);
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
          Oracle Service Dashboard
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
      <Typography variant="h4" gutterBottom>
        Oracle Service Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle2" color="inherit">
                Total Oracles
              </Typography>
              <Typography variant="h4">{data.totalOracles}</Typography>
              <Typography variant="caption" color="inherit">
                Active: {data.activeOracles} | Degraded: {data.degradedOracles} | Offline: {data.offlineOracles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle2" color="inherit">
                Health Score
              </Typography>
              <Typography variant="h4">{data.healthScore.toFixed(2)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={data.healthScore}
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                color="inherit"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle2" color="inherit">
                Average Uptime
              </Typography>
              <Typography variant="h4">{data.averageUptime.toFixed(2)}%</Typography>
              <Typography variant="caption" color="inherit">
                Avg Response: {data.averageResponseTime.toFixed(0)}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle2" color="inherit">
                24h Requests
              </Typography>
              <Typography variant="h4">{(data.totalRequests24h / 1000).toFixed(1)}K</Typography>
              <Typography variant="caption" color="inherit">
                {data.priceFeeds.length} Price Feeds Tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Feeds Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Real-Time Price Feeds
                <Chip label="Live" color="success" size="small" />
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Asset</strong></TableCell>
                      <TableCell align="right"><strong>Price (USD)</strong></TableCell>
                      <TableCell align="right"><strong>24h Change</strong></TableCell>
                      <TableCell align="right"><strong>24h Volume</strong></TableCell>
                      <TableCell align="right"><strong>Market Cap</strong></TableCell>
                      <TableCell align="center"><strong>Confidence</strong></TableCell>
                      <TableCell align="center"><strong>Sources</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.priceFeeds.map((price) => (
                      <TableRow key={price.asset_symbol} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{price.asset_symbol}</Typography>
                            <Typography variant="caption" color="text.secondary">{price.asset_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            ${price.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${price.price_change_24h >= 0 ? '+' : ''}${price.price_change_24h.toFixed(2)}%`}
                            color={price.price_change_24h >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${(price.volume_24h_usd / 1e9).toFixed(2)}B
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${(price.market_cap_usd / 1e9).toFixed(1)}B
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={price.confidence_score * 100}
                            sx={{ height: 8, borderRadius: 1 }}
                            color={price.confidence_score >= 0.95 ? 'success' : 'warning'}
                          />
                          <Typography variant="caption">{(price.confidence_score * 100).toFixed(0)}%</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={price.source_count} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Oracle Sources */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Feed Sources
              </Typography>
              <Grid container spacing={2}>
                {data.priceSources.map((source) => (
                  <Grid item xs={12} sm={6} md={4} key={source.source_name}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: source.status === 'active' ? 'success.main' : 'divider',
                        borderRadius: 1,
                        bgcolor: source.status === 'active' ? 'success.light' : 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {source.source_name}
                        </Typography>
                        <Chip
                          label={source.status.toUpperCase()}
                          color={source.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Type: {source.source_type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Assets: {source.supported_assets}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        24h Updates: {source.update_count_24h.toLocaleString()}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reliability Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={source.reliability_score * 100}
                          sx={{ height: 6, borderRadius: 1 }}
                          color={source.reliability_score >= 0.95 ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {(source.reliability_score * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Oracle Services */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Oracle Network Nodes
              </Typography>
              <Grid container spacing={2}>
                {data.oracles.map((oracle) => (
                  <Grid item xs={12} sm={6} md={4} key={oracle.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: oracle.status === 'active' ? 'success.main' : oracle.status === 'degraded' ? 'warning.main' : 'error.main',
                        borderRadius: 1,
                        bgcolor: oracle.status === 'active' ? 'success.lighter' : oracle.status === 'degraded' ? 'warning.lighter' : 'error.lighter',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {oracle.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {oracle.location} • v{oracle.version}
                          </Typography>
                        </Box>
                        <Chip
                          label={oracle.status.toUpperCase()}
                          color={oracle.status === 'active' ? 'success' : oracle.status === 'degraded' ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {oracle.provider} • {oracle.type}
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Uptime</Typography>
                          <Typography variant="body2" fontWeight="medium">{oracle.uptime.toFixed(2)}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Response</Typography>
                          <Typography variant="body2" fontWeight="medium">{oracle.responseTime}ms</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Data Feeds</Typography>
                          <Typography variant="body2" fontWeight="medium">{oracle.dataFeeds}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Error Rate</Typography>
                          <Typography variant="body2" fontWeight="medium">{oracle.errorRate.toFixed(2)}%</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">24h Requests</Typography>
                          <Typography variant="body2" fontWeight="medium">{oracle.requests24h.toLocaleString()}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OracleService;
