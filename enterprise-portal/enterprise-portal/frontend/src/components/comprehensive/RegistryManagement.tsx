import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  GetApp,
  Refresh,
  CheckCircle,
  Warning,
  Sync,
  MoreVert,
} from '@mui/icons-material';

interface Registry {
  id: string;
  name: string;
  type: 'SMART_CONTRACT' | 'TOKEN' | 'RWA' | 'MERKLE' | 'COMPLIANCE';
  itemCount: number;
  lastSync: Date;
  syncStatus: 'SYNCED' | 'SYNCING' | 'OUT_OF_SYNC';
  totalSize: number;
  health: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const RegistryManagement: React.FC = () => {
  const [registries] = useState<Registry[]>([
    {
      id: 'reg_001',
      name: 'Smart Contract Registry',
      type: 'SMART_CONTRACT',
      itemCount: 156,
      lastSync: new Date(),
      syncStatus: 'SYNCED',
      totalSize: 2450,
      health: 98,
    },
    {
      id: 'reg_002',
      name: 'Token Registry',
      type: 'TOKEN',
      itemCount: 892,
      lastSync: new Date(Date.now() - 300000),
      syncStatus: 'SYNCED',
      totalSize: 15680,
      health: 99,
    },
    {
      id: 'reg_003',
      name: 'RWA Registry',
      type: 'RWA',
      itemCount: 234,
      lastSync: new Date(Date.now() - 600000),
      syncStatus: 'OUT_OF_SYNC',
      totalSize: 5920,
      health: 85,
    },
    {
      id: 'reg_004',
      name: 'Merkle Tree Registry',
      type: 'MERKLE',
      itemCount: 1203,
      lastSync: new Date(),
      syncStatus: 'SYNCED',
      totalSize: 28450,
      health: 100,
    },
    {
      id: 'reg_005',
      name: 'Compliance Registry',
      type: 'COMPLIANCE',
      itemCount: 567,
      lastSync: new Date(Date.now() - 900000),
      syncStatus: 'SYNCING',
      totalSize: 8760,
      health: 92,
    },
  ]);
  const [tabValue, setTabValue] = useState(0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SMART_CONTRACT':
        return 'primary';
      case 'TOKEN':
        return 'success';
      case 'RWA':
        return 'warning';
      case 'MERKLE':
        return 'info';
      case 'COMPLIANCE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle color="success" />;
      case 'SYNCING':
        return <Sync color="warning" />;
      case 'OUT_OF_SYNC':
        return <Warning color="error" />;
      default:
        return <Warning />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return 'success';
      case 'SYNCING':
        return 'warning';
      case 'OUT_OF_SYNC':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalItems = registries.reduce((sum, r) => sum + r.itemCount, 0);
  const totalSize = registries.reduce((sum, r) => sum + r.totalSize, 0);
  const syncedCount = registries.filter((r) => r.syncStatus === 'SYNCED').length;
  const avgHealth = Math.round(registries.reduce((sum, r) => sum + r.health, 0) / registries.length);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Registry Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage all system registries
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <Button variant="outlined" startIcon={<Refresh />}>
              Refresh
            </Button>
          </Tooltip>
          <Tooltip title="Export">
            <Button variant="contained" startIcon={<GetApp />}>
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`All Registries (${registries.length})`} id="tab-0" aria-controls="tabpanel-0" />
          <Tab label={`Sync Status`} id="tab-1" aria-controls="tabpanel-1" />
          <Tab label={`Health & Performance`} id="tab-2" aria-controls="tabpanel-2" />
          <Tab label={`Details`} id="tab-3" aria-controls="tabpanel-3" />
        </Tabs>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Registries
              </Typography>
              <Typography variant="h4">{registries.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">{totalItems.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Synchronized
              </Typography>
              <Typography variant="h4">{syncedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Health
              </Typography>
              <Typography variant="h4">{avgHealth}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* All Registries Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Sync Status</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Size (MB)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registries.map((registry) => (
                <TableRow key={registry.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {registry.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={registry.type.replace(/_/g, ' ')} size="small" color={getTypeColor(registry.type)} />
                  </TableCell>
                  <TableCell>{registry.itemCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSyncStatusIcon(registry.syncStatus)}
                      <Chip
                        label={registry.syncStatus.replace(/_/g, ' ')}
                        size="small"
                        color={getSyncStatusColor(registry.syncStatus)}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress variant="determinate" value={registry.health} sx={{ width: 60 }} />
                      <Typography variant="caption">{registry.health}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{(registry.totalSize / 1024).toFixed(1)}</TableCell>
                  <TableCell>
                    <Tooltip title="More options">
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Sync Status Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {registries.map((registry) => (
            <Grid item xs={12} md={6} key={registry.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6">{registry.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {registry.itemCount} items
                      </Typography>
                    </Box>
                    {getSyncStatusIcon(registry.syncStatus)}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">Sync Progress</Typography>
                      <Typography variant="caption">
                        {Math.round((Math.random() * 100))}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.round((Math.random() * 100))}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Last sync: {registry.lastSync.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Health & Performance Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Registry Health Score
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {registries.map((registry) => (
                    <Box key={registry.id} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{registry.name}</Typography>
                        <Typography variant="caption">{registry.health}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={registry.health}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              registry.health >= 95
                                ? '#4caf50'
                                : registry.health >= 85
                                  ? '#ff9800'
                                  : '#f44336',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {registries.map((registry) => (
                    <Box key={registry.id} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{registry.name}</Typography>
                        <Typography variant="caption">
                          {(registry.totalSize / 1024).toFixed(1)} MB
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(registry.totalSize / totalSize) * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Total Storage: {(totalSize / 1024).toFixed(1)} MB
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Details Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {registries.map((registry) => (
            <Grid item xs={12} key={registry.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Registry Name
                      </Typography>
                      <Typography variant="body2">{registry.name}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Type
                      </Typography>
                      <Chip label={registry.type.replace(/_/g, ' ')} size="small" color={getTypeColor(registry.type)} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Item Count
                      </Typography>
                      <Typography variant="body2">{registry.itemCount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Sync Status
                      </Typography>
                      <Chip
                        label={registry.syncStatus.replace(/_/g, ' ')}
                        size="small"
                        color={getSyncStatusColor(registry.syncStatus)}
                        icon={getSyncStatusIcon(registry.syncStatus)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Health Score
                      </Typography>
                      <Typography variant="body2">{registry.health}%</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Last Synchronized
                      </Typography>
                      <Typography variant="body2">
                        {registry.lastSync.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default RegistryManagement;
