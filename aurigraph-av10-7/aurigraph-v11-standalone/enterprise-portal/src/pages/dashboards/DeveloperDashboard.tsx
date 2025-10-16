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
} from '@mui/material';
import { Code, Api, Description, BugReport } from '@mui/icons-material';
import axios from 'axios';

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

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
}

const DeveloperDashboard: React.FC = () => {
  const [value, setValue] = useState(0);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/info');
        // Mock endpoints for now
        setEndpoints([
          { path: '/api/v11/health', method: 'GET', description: 'Health check', auth: false },
          { path: '/api/v11/info', method: 'GET', description: 'System information', auth: false },
          { path: '/api/v11/performance', method: 'GET', description: 'Performance metrics', auth: true },
          { path: '/api/v11/blockchain/stats', method: 'GET', description: 'Blockchain statistics', auth: true },
          { path: '/api/v11/transactions', method: 'POST', description: 'Submit transaction', auth: true },
        ]);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Developer Dashboard
      </Typography>

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
        <Grid container spacing={2}>
          {endpoints.map((endpoint, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        bgcolor: endpoint.method === 'GET' ? 'success.main' : 'primary.main',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        mr: 2,
                        minWidth: 60,
                        textAlign: 'center',
                      }}
                    >
                      {endpoint.method}
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                      {endpoint.path}
                    </Typography>
                    {endpoint.auth && (
                      <Typography variant="caption" color="text.secondary">
                        Requires Auth
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {endpoint.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Typography variant="h6" gutterBottom>
          Quick Start Code Examples
        </Typography>
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', mb: 2 }}>
          <Typography variant="body2">
            {`// JavaScript/TypeScript Example
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://dlt.aurigraph.io/api/v11',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Get system health
const health = await client.get('/health');
console.log(health.data);

// Submit transaction
const tx = await client.post('/transactions', {
  from: 'address1',
  to: 'address2',
  amount: 100
});
console.log(tx.data);`}
          </Typography>
        </Paper>
        <Button variant="contained" href="https://docs.aurigraph.io" target="_blank">
          View Full Documentation
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
                  Learn the basics of integrating with Aurigraph V11
                </Typography>
                <Button variant="outlined">Read Guide</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">API Reference</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete API documentation with examples
                </Typography>
                <Button variant="outlined">View API Docs</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">SDK Libraries</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download SDKs for various programming languages
                </Typography>
                <Button variant="outlined">Download SDKs</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Tutorials</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Step-by-step tutorials for common use cases
                </Typography>
                <Button variant="outlined">Browse Tutorials</Button>
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
                  Test API endpoints interactively
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
                  Test environment URL: https://sandbox.dlt.aurigraph.io
                </Typography>
                <Button variant="contained">Access Sandbox</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default DeveloperDashboard;
