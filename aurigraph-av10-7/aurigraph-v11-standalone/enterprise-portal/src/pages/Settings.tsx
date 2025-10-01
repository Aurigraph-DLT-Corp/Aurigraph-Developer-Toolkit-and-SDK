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
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="System Configuration" />
            <Tab label="User Management" />
            <Tab label="Security" />
            <Tab label="Backup & Recovery" />
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
