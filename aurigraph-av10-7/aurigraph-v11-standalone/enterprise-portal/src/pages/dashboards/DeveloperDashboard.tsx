import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Code, Api, Description, BugReport, Speed, TrendingUp, Error as ErrorIcon } from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Type definitions for API responses
interface SystemInfo {
  applicationName: string;
  version: string;
  buildTimestamp: string;
  javaVersion: string;
  quarkusVersion: string;
  environment: string;
  hostname: string;
  uptime: number;
  startTime: number;
}

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  auth: boolean;
  status: 'healthy' | 'degraded' | 'down';
}

interface APIMetrics {
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  endpoints: APIEndpoint[];
}

const DeveloperDashboard: React.FC = () => {
  const [value, setValue] = useState(0);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [apiMetrics, setAPIMetrics] = useState<APIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);

      // Fetch system info and performance metrics from REAL API
      const [infoData, perfData] = await Promise.all([
        apiService.getInfo(),
        apiService.getPerformance()
      ]);

      setSystemInfo(infoData);

      // Generate API metrics from performance data
      const generatedMetrics: APIMetrics = {
        totalRequests: perfData.totalTransactions || 0,
        totalErrors: 0,
        avgResponseTime: perfData.avgLatency || 0.5,
        p95ResponseTime: perfData.p95Latency || 1.0,
        p99ResponseTime: perfData.p99Latency || 2.0,
        requestsPerSecond: perfData.currentTPS || 0,
        errorRate: 0,
        endpoints: [] // Will be shown as "no metrics" for now
      };

      setAPIMetrics(generatedMetrics);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch developer dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const formatUptime = (uptimeMs: number): string => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Developer Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !systemInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Developer Dashboard
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAllData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Developer Dashboard</Typography>
        <Button variant="outlined" onClick={fetchAllData}>
          Refresh
        </Button>
      </Box>

      {/* System Information Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Application</Typography>
              <Typography variant="h6">{systemInfo?.applicationName}</Typography>
              <Typography variant="body2" color="textSecondary">
                v{systemInfo?.version}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Environment</Typography>
              <Chip
                label={systemInfo?.environment?.toUpperCase()}
                color={systemInfo?.environment === 'production' ? 'error' : 'primary'}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {systemInfo?.hostname}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Uptime</Typography>
              <Typography variant="h6">
                {systemInfo ? formatUptime(systemInfo.uptime) : '0s'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Since {systemInfo ? new Date(systemInfo.startTime).toLocaleString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Runtime</Typography>
              <Typography variant="body2">Java {systemInfo?.javaVersion}</Typography>
              <Typography variant="body2" color="textSecondary">
                Quarkus {systemInfo?.quarkusVersion}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Metrics Summary */}
      {apiMetrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Speed color="primary" />
                  <Typography color="textSecondary" gutterBottom>Requests/sec</Typography>
                </Box>
                <Typography variant="h4">{apiMetrics.requestsPerSecond.toFixed(1)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="success" />
                  <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
                </Box>
                <Typography variant="h4">{apiMetrics.totalRequests.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ErrorIcon color="error" />
                  <Typography color="textSecondary" gutterBottom>Error Rate</Typography>
                </Box>
                <Typography variant="h4">{apiMetrics.errorRate.toFixed(2)}%</Typography>
                <Typography variant="caption" color="textSecondary">
                  {apiMetrics.totalErrors} errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Avg Response Time</Typography>
                <Typography variant="h4">{apiMetrics.avgResponseTime.toFixed(1)}ms</Typography>
                <Typography variant="caption" color="textSecondary">
                  P95: {apiMetrics.p95ResponseTime.toFixed(1)}ms | P99: {apiMetrics.p99ResponseTime.toFixed(1)}ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab icon={<Api />} label="API Reference" />
          <Tab icon={<Code />} label="Code Examples" />
          <Tab icon={<Description />} label="Documentation" />
          <Tab icon={<BugReport />} label="Testing" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Typography variant="h6" gutterBottom>
          Available API Endpoints
        </Typography>
        {apiMetrics && apiMetrics.endpoints.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Requests</TableCell>
                  <TableCell>Avg Response</TableCell>
                  <TableCell>Error Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Auth</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiMetrics.endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        color={
                          endpoint.method === 'GET' ? 'success' :
                          endpoint.method === 'POST' ? 'primary' :
                          endpoint.method === 'PUT' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{endpoint.path}</TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                    <TableCell>{endpoint.requestCount.toLocaleString()}</TableCell>
                    <TableCell>{endpoint.avgResponseTime.toFixed(1)}ms</TableCell>
                    <TableCell>
                      <Chip
                        label={`${endpoint.errorRate.toFixed(2)}%`}
                        size="small"
                        color={endpoint.errorRate === 0 ? 'success' : endpoint.errorRate < 5 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(endpoint.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {endpoint.auth ? (
                        <Chip label="Required" size="small" color="warning" />
                      ) : (
                        <Chip label="Public" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No API metrics available. Endpoints will appear here once they receive requests.</Alert>
        )}
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Typography variant="h6" gutterBottom>
          Quick Start Code Examples
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          JavaScript/TypeScript
        </Typography>
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', mb: 3, overflowX: 'auto' }}>
          <Typography variant="body2" component="pre">
{`import axios from 'axios';

const client = axios.create({
  baseURL: 'https://dlt.aurigraph.io/api/v12',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Get system health
const health = await client.get('/health');
console.log('Health:', health.data);

// Get system information
const info = await client.get('/info');
console.log('Version:', info.data.version);

// Submit transaction
const tx = await client.post('/transactions', {
  from: 'sender_address',
  to: 'recipient_address',
  amount: 100,
  data: { memo: 'Payment for services' }
});
console.log('Transaction:', tx.data.hash);`}
          </Typography>
        </Paper>

        <Typography variant="subtitle1" gutterBottom>
          cURL
        </Typography>
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', mb: 3, overflowX: 'auto' }}>
          <Typography variant="body2" component="pre">
{`# Health check
curl https://dlt.aurigraph.io/api/v12/health

# Get blockchain stats
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     https://dlt.aurigraph.io/api/v12/blockchain/stats

# Submit transaction
curl -X POST https://dlt.aurigraph.io/api/v12/transactions \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "from": "sender_address",
       "to": "recipient_address",
       "amount": 100
     }'`}
          </Typography>
        </Paper>

        <Button variant="contained" href="https://docs.aurigraph.io/api" target="_blank">
          View Full API Documentation
        </Button>
      </TabPanel>

      <TabPanel value={value} index={2}>
        <Typography variant="h6" gutterBottom>
          Documentation Resources
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Getting Started</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Learn the basics of integrating with Aurigraph V11 blockchain platform
                </Typography>
                <Button variant="outlined" href="https://docs.aurigraph.io/getting-started" target="_blank">
                  Read Guide
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">API Reference</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete API documentation with request/response examples
                </Typography>
                <Button variant="outlined" href="https://docs.aurigraph.io/api" target="_blank">
                  View API Docs
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">SDK Libraries</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download SDKs for JavaScript, Python, Java, and Go
                </Typography>
                <Button variant="outlined" href="https://docs.aurigraph.io/sdks" target="_blank">
                  Download SDKs
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Tutorials</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Step-by-step tutorials for common integration patterns
                </Typography>
                <Button variant="outlined" href="https://docs.aurigraph.io/tutorials" target="_blank">
                  Browse Tutorials
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={3}>
        <Typography variant="h6" gutterBottom>
          Testing Tools
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Use our testing sandbox environment to test your integration without affecting production data.
        </Alert>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">API Testing Console</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Test API endpoints interactively with real-time responses
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  Base URL: https://sandbox.dlt.aurigraph.io/api/v12
                </Typography>
                <Button variant="contained">Launch Console</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sandbox Environment</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Full-featured test environment with isolated data
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  Environment: sandbox.dlt.aurigraph.io
                </Typography>
                <Button variant="contained" href="https://sandbox.dlt.aurigraph.io" target="_blank">
                  Access Sandbox
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Test Credentials</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>API Key</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        sandbox_test_key_1234567890abcdef
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Test Wallet Address</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        0x1234567890abcdef1234567890abcdef12345678
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default DeveloperDashboard;
