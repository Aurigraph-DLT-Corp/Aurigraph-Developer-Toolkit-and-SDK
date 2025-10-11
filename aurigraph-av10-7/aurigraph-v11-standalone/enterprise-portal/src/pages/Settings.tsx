import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Divider, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { Save, Add, Delete, Edit, Security, Backup, Speed, AccountCircle } from '@mui/icons-material';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');

  const [systemSettings, setSystemSettings] = useState({
    consensusAlgorithm: 'hyperraft',
    targetTps: 2000000,
    blockTime: 1,
    maxBlockSize: 10,
    enableAiOptimization: true,
    enableQuantumSecurity: true,
    backupSchedule: 'daily',
    retentionDays: 30
  });

  const [apiSettings, setApiSettings] = useState({
    alpaca: {
      enabled: true,
      apiKey: '',
      apiSecret: '',
      baseUrl: 'https://api.alpaca.markets',
      rateLimit: 200,
      enablePaperTrading: true
    },
    twitter: {
      enabled: true,
      apiKey: '',
      apiSecret: '',
      bearerToken: '',
      rateLimit: 300
    },
    weather: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://api.weather.com',
      rateLimit: 100
    },
    newsapi: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://newsapi.org',
      rateLimit: 100
    },
    streaming: {
      enableSlimNodes: true,
      maxConcurrentConnections: 1000,
      dataBufferSize: '10MB',
      streamingInterval: 1000,
      enableCompression: true
    },
    oracle: {
      enableOracleService: true,
      verificationMode: 'multi_source',
      cacheTTL: 300,
      cacheSize: '5GB'
    }
  });

  const [users, setUsers] = useState([
    { id: 1, name: 'Admin', email: 'admin@aurigraph.io', role: 'admin' },
    { id: 2, name: 'Developer', email: 'dev@aurigraph.io', role: 'developer' },
    { id: 3, name: 'Viewer', email: 'viewer@aurigraph.io', role: 'viewer' }
  ]);

  const saveSettings = () => {
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
            <Tab label="System Configuration" />
            <Tab label="User Management" />
            <Tab label="Security" />
            <Tab label="Backup & Recovery" />
            <Tab label="External API Integrations" />
          </Tabs>

          {/* System Configuration */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Consensus Algorithm</InputLabel>
                  <Select value={systemSettings.consensusAlgorithm} onChange={(e) => setSystemSettings({...systemSettings, consensusAlgorithm: e.target.value})}>
                    <MenuItem value="hyperraft">HyperRAFT++</MenuItem>
                    <MenuItem value="pbft">PBFT</MenuItem>
                    <MenuItem value="poa">Proof of Authority</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Target TPS" type="number" value={systemSettings.targetTps} onChange={(e) => setSystemSettings({...systemSettings, targetTps: parseInt(e.target.value)})} margin="normal" />
                <TextField fullWidth label="Block Time (seconds)" type="number" value={systemSettings.blockTime} onChange={(e) => setSystemSettings({...systemSettings, blockTime: parseInt(e.target.value)})} margin="normal" />
                <TextField fullWidth label="Max Block Size (MB)" type="number" value={systemSettings.maxBlockSize} onChange={(e) => setSystemSettings({...systemSettings, maxBlockSize: parseInt(e.target.value)})} margin="normal" />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel control={<Switch checked={systemSettings.enableAiOptimization} onChange={(e) => setSystemSettings({...systemSettings, enableAiOptimization: e.target.checked})} />} label="Enable AI Optimization" />
                <FormControlLabel control={<Switch checked={systemSettings.enableQuantumSecurity} onChange={(e) => setSystemSettings({...systemSettings, enableQuantumSecurity: e.target.checked})} />} label="Enable Quantum Security" />
                <Alert severity="info" sx={{ mt: 2 }}>
                  These settings will affect the entire blockchain network. Changes require consensus from validator nodes.
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* User Management */}
          {activeTab === 1 && (
            <Box>
              <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }}>Add User</Button>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <IconButton size="small"><Edit /></IconButton>
                          <IconButton size="small"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Security */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Security Settings</Typography>
                <FormControlLabel control={<Switch defaultChecked />} label="Two-Factor Authentication" />
                <FormControlLabel control={<Switch defaultChecked />} label="Encrypt Data at Rest" />
                <FormControlLabel control={<Switch defaultChecked />} label="Enable Audit Logging" />
                <FormControlLabel control={<Switch />} label="IP Whitelist" />
                <TextField fullWidth label="Session Timeout (minutes)" type="number" defaultValue={30} margin="normal" />
                <TextField fullWidth label="Max Login Attempts" type="number" defaultValue={5} margin="normal" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>API Security</Typography>
                <TextField fullWidth label="API Rate Limit (req/min)" type="number" defaultValue={100} margin="normal" />
                <FormControlLabel control={<Switch defaultChecked />} label="Require API Key" />
                <FormControlLabel control={<Switch defaultChecked />} label="Enable CORS" />
                <TextField fullWidth label="Allowed Origins" defaultValue="https://dlt.aurigraph.io" multiline rows={3} margin="normal" />
              </Grid>
            </Grid>
          )}

          {/* Backup & Recovery */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Backup Configuration</Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Backup Schedule</InputLabel>
                  <Select value={systemSettings.backupSchedule} onChange={(e) => setSystemSettings({...systemSettings, backupSchedule: e.target.value})}>
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Retention Days" type="number" value={systemSettings.retentionDays} onChange={(e) => setSystemSettings({...systemSettings, retentionDays: parseInt(e.target.value)})} margin="normal" />
                <Button variant="contained" startIcon={<Backup />} sx={{ mt: 2 }}>Backup Now</Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Recent Backups</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Backup /></ListItemIcon>
                    <ListItemText primary="backup_2025_01_27_12_00.tar.gz" secondary="Size: 2.5 GB | Created: 2 hours ago" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Backup /></ListItemIcon>
                    <ListItemText primary="backup_2025_01_26_12_00.tar.gz" secondary="Size: 2.4 GB | Created: 1 day ago" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}

          {/* External API Integrations */}
          {activeTab === 4 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Configure external API integrations for real-time data feeds. All API keys are encrypted and stored securely.
              </Alert>

              {/* Alpaca Markets */}
              <Box sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6">Alpaca Markets (Stock Trading)</Typography>
                  <FormControlLabel
                    control={<Switch checked={apiSettings.alpaca.enabled} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, enabled: e.target.checked}})} />}
                    label={apiSettings.alpaca.enabled ? "Enabled" : "Disabled"}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Key" type="password" value={apiSettings.alpaca.apiKey} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, apiKey: e.target.value}})} margin="normal" disabled={!apiSettings.alpaca.enabled} />
                    <TextField fullWidth label="API Secret" type="password" value={apiSettings.alpaca.apiSecret} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, apiSecret: e.target.value}})} margin="normal" disabled={!apiSettings.alpaca.enabled} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Base URL" value={apiSettings.alpaca.baseUrl} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, baseUrl: e.target.value}})} margin="normal" disabled={!apiSettings.alpaca.enabled} />
                    <TextField fullWidth label="Rate Limit (req/min)" type="number" value={apiSettings.alpaca.rateLimit} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, rateLimit: parseInt(e.target.value)}})} margin="normal" disabled={!apiSettings.alpaca.enabled} />
                    <FormControlLabel control={<Switch checked={apiSettings.alpaca.enablePaperTrading} onChange={(e) => setApiSettings({...apiSettings, alpaca: {...apiSettings.alpaca, enablePaperTrading: e.target.checked}})} disabled={!apiSettings.alpaca.enabled} />} label="Enable Paper Trading" />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 3 }} />

              {/* X (Twitter) */}
              <Box sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6">X (Twitter) Social Feed</Typography>
                  <FormControlLabel
                    control={<Switch checked={apiSettings.twitter.enabled} onChange={(e) => setApiSettings({...apiSettings, twitter: {...apiSettings.twitter, enabled: e.target.checked}})} />}
                    label={apiSettings.twitter.enabled ? "Enabled" : "Disabled"}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Key" type="password" value={apiSettings.twitter.apiKey} onChange={(e) => setApiSettings({...apiSettings, twitter: {...apiSettings.twitter, apiKey: e.target.value}})} margin="normal" disabled={!apiSettings.twitter.enabled} />
                    <TextField fullWidth label="API Secret" type="password" value={apiSettings.twitter.apiSecret} onChange={(e) => setApiSettings({...apiSettings, twitter: {...apiSettings.twitter, apiSecret: e.target.value}})} margin="normal" disabled={!apiSettings.twitter.enabled} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Bearer Token" type="password" value={apiSettings.twitter.bearerToken} onChange={(e) => setApiSettings({...apiSettings, twitter: {...apiSettings.twitter, bearerToken: e.target.value}})} margin="normal" disabled={!apiSettings.twitter.enabled} />
                    <TextField fullWidth label="Rate Limit (req/min)" type="number" value={apiSettings.twitter.rateLimit} onChange={(e) => setApiSettings({...apiSettings, twitter: {...apiSettings.twitter, rateLimit: parseInt(e.target.value)}})} margin="normal" disabled={!apiSettings.twitter.enabled} />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 3 }} />

              {/* Weather.com */}
              <Box sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6">Weather.com</Typography>
                  <FormControlLabel
                    control={<Switch checked={apiSettings.weather.enabled} onChange={(e) => setApiSettings({...apiSettings, weather: {...apiSettings.weather, enabled: e.target.checked}})} />}
                    label={apiSettings.weather.enabled ? "Enabled" : "Disabled"}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Key" type="password" value={apiSettings.weather.apiKey} onChange={(e) => setApiSettings({...apiSettings, weather: {...apiSettings.weather, apiKey: e.target.value}})} margin="normal" disabled={!apiSettings.weather.enabled} />
                    <TextField fullWidth label="Base URL" value={apiSettings.weather.baseUrl} onChange={(e) => setApiSettings({...apiSettings, weather: {...apiSettings.weather, baseUrl: e.target.value}})} margin="normal" disabled={!apiSettings.weather.enabled} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Rate Limit (req/min)" type="number" value={apiSettings.weather.rateLimit} onChange={(e) => setApiSettings({...apiSettings, weather: {...apiSettings.weather, rateLimit: parseInt(e.target.value)}})} margin="normal" disabled={!apiSettings.weather.enabled} />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 3 }} />

              {/* NewsAPI.com */}
              <Box sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6">NewsAPI.com</Typography>
                  <FormControlLabel
                    control={<Switch checked={apiSettings.newsapi.enabled} onChange={(e) => setApiSettings({...apiSettings, newsapi: {...apiSettings.newsapi, enabled: e.target.checked}})} />}
                    label={apiSettings.newsapi.enabled ? "Enabled" : "Disabled"}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Key" type="password" value={apiSettings.newsapi.apiKey} onChange={(e) => setApiSettings({...apiSettings, newsapi: {...apiSettings.newsapi, apiKey: e.target.value}})} margin="normal" disabled={!apiSettings.newsapi.enabled} />
                    <TextField fullWidth label="Base URL" value={apiSettings.newsapi.baseUrl} onChange={(e) => setApiSettings({...apiSettings, newsapi: {...apiSettings.newsapi, baseUrl: e.target.value}})} margin="normal" disabled={!apiSettings.newsapi.enabled} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Rate Limit (req/min)" type="number" value={apiSettings.newsapi.rateLimit} onChange={(e) => setApiSettings({...apiSettings, newsapi: {...apiSettings.newsapi, rateLimit: parseInt(e.target.value)}})} margin="normal" disabled={!apiSettings.newsapi.enabled} />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 3 }} />

              {/* Streaming Data Configuration */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>Streaming Data via Slim Nodes</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Slim nodes enable high-throughput real-time data streaming from external APIs to the blockchain network.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel control={<Switch checked={apiSettings.streaming.enableSlimNodes} onChange={(e) => setApiSettings({...apiSettings, streaming: {...apiSettings.streaming, enableSlimNodes: e.target.checked}})} />} label="Enable Slim Node Streaming" />
                    <TextField fullWidth label="Max Concurrent Connections" type="number" value={apiSettings.streaming.maxConcurrentConnections} onChange={(e) => setApiSettings({...apiSettings, streaming: {...apiSettings.streaming, maxConcurrentConnections: parseInt(e.target.value)}})} margin="normal" />
                    <TextField fullWidth label="Data Buffer Size" value={apiSettings.streaming.dataBufferSize} onChange={(e) => setApiSettings({...apiSettings, streaming: {...apiSettings.streaming, dataBufferSize: e.target.value}})} margin="normal" helperText="Format: 10MB, 1GB, etc." />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Streaming Interval (ms)" type="number" value={apiSettings.streaming.streamingInterval} onChange={(e) => setApiSettings({...apiSettings, streaming: {...apiSettings.streaming, streamingInterval: parseInt(e.target.value)}})} margin="normal" helperText="How often to push data updates" />
                    <FormControlLabel control={<Switch checked={apiSettings.streaming.enableCompression} onChange={(e) => setApiSettings({...apiSettings, streaming: {...apiSettings.streaming, enableCompression: e.target.checked}})} />} label="Enable Data Compression" sx={{ mt: 2 }} />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 3 }} />

              {/* Oracle Configuration */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>Oracle Service Configuration</Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Oracle services provide verified external data to smart contracts. Use multi-source verification for maximum security.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel control={<Switch checked={apiSettings.oracle.enableOracleService} onChange={(e) => setApiSettings({...apiSettings, oracle: {...apiSettings.oracle, enableOracleService: e.target.checked}})} />} label="Enable Oracle Service" />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Verification Mode</InputLabel>
                      <Select value={apiSettings.oracle.verificationMode} onChange={(e) => setApiSettings({...apiSettings, oracle: {...apiSettings.oracle, verificationMode: e.target.value}})}>
                        <MenuItem value="single_source">Single Source</MenuItem>
                        <MenuItem value="multi_source">Multi-Source (Recommended)</MenuItem>
                        <MenuItem value="consensus">Consensus-Based</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Cache TTL (seconds)" type="number" value={apiSettings.oracle.cacheTTL} onChange={(e) => setApiSettings({...apiSettings, oracle: {...apiSettings.oracle, cacheTTL: parseInt(e.target.value)}})} margin="normal" helperText="How long to cache oracle data" />
                    <TextField fullWidth label="Cache Size" value={apiSettings.oracle.cacheSize} onChange={(e) => setApiSettings({...apiSettings, oracle: {...apiSettings.oracle, cacheSize: e.target.value}})} margin="normal" helperText="Format: 5GB, 10GB, etc." />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button variant="contained" startIcon={<Save />} onClick={saveSettings}>Save Settings</Button>
            {saveStatus && <Alert severity="success">{saveStatus}</Alert>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
