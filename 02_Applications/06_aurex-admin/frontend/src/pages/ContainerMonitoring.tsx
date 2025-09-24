import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Visibility,
  Storage,
  Memory,
  NetworkCheck,
  Security,
  Timeline,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { containerService } from '../services/containerService';

interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  created: string;
  ports: string[];
  networks: string[];
  mounts: string[];
  cpu_percent: number;
  memory_percent: number;
  memory_usage: string;
  memory_limit: string;
  network_io: {
    rx_bytes: number;
    tx_bytes: number;
  };
  disk_io: {
    read_bytes: number;
    write_bytes: number;
  };
  uptime: string;
  labels: Record<string, string>;
}

interface InfrastructureStats {
  total_containers: number;
  running_containers: number;
  stopped_containers: number;
  healthy_containers: number;
  unhealthy_containers: number;
  total_cpu_usage: number;
  total_memory_usage: number;
  total_memory_limit: number;
  total_disk_usage: number;
  network_usage: {
    total_rx: number;
    total_tx: number;
  };
}

const ContainerMonitoring: React.FC = () => {
  const [selectedContainer, setSelectedContainer] = useState<ContainerStatus | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  // Fetch containers data
  const { data: containers = [], isLoading: containersLoading } = useQuery<ContainerStatus[]>({
    queryKey: ['containers'],
    queryFn: containerService.getAllContainers,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch infrastructure stats
  const { data: stats, isLoading: statsLoading } = useQuery<InfrastructureStats>({
    queryKey: ['infrastructure-stats'],
    queryFn: containerService.getInfrastructureStats,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'starting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      case 'starting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleContainerAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      await containerService.controlContainer(containerId, action);
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const aurexContainers = containers.filter(container => 
    container.labels['com.aurex.platform'] === 'true'
  );

  const coreServices = aurexContainers.filter(container => 
    ['aurex-platform-backend', 'aurex-launchpad-backend', 'aurex-postgres-container', 'aurex-redis-master'].some(service => 
      container.name.includes(service)
    )
  );

  const monitoringServices = aurexContainers.filter(container =>
    ['prometheus', 'grafana', 'alertmanager'].some(service => 
      container.name.includes(service)
    )
  );

  const securityServices = aurexContainers.filter(container =>
    container.labels['com.aurex.security'] === 'enabled'
  );

  const TabPanel = ({ children, value, index, ...other }: any) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (containersLoading || statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Storage sx={{ mr: 2 }} />
        Docker Container Monitoring
        <IconButton 
          onClick={() => queryClient.invalidateQueries()} 
          sx={{ ml: 2 }}
          title="Refresh Data"
        >
          <Refresh />
        </IconButton>
      </Typography>

      {/* Infrastructure Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h3" component="div">
                {stats?.total_containers || 0}
              </Typography>
              <Typography variant="body2">Total Containers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h3" component="div">
                {stats?.running_containers || 0}
              </Typography>
              <Typography variant="body2">Running</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h3" component="div">
                {stats?.healthy_containers || 0}
              </Typography>
              <Typography variant="body2">Healthy</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h3" component="div">
                {stats?.total_cpu_usage?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2">CPU Usage</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resource Usage Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Memory sx={{ mr: 1, verticalAlign: 'middle' }} />
              Memory Usage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats?.total_memory_usage / stats?.total_memory_limit * 100) || 0}
                  sx={{ height: 10, borderRadius: 1 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {((stats?.total_memory_usage / stats?.total_memory_limit * 100) || 0).toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatBytes(stats?.total_memory_usage || 0)} / {formatBytes(stats?.total_memory_limit || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <NetworkCheck sx={{ mr: 1, verticalAlign: 'middle' }} />
              Network I/O
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>RX:</strong> {formatBytes(stats?.network_usage?.total_rx || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>TX:</strong> {formatBytes(stats?.network_usage?.total_tx || 0)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Container Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`All Containers (${aurexContainers.length})`} />
          <Tab label={`Core Services (${coreServices.length})`} />
          <Tab label={`Monitoring (${monitoringServices.length})`} />
          <Tab label={`Security (${securityServices.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ContainerTable containers={aurexContainers} onContainerSelect={setSelectedContainer} onContainerAction={handleContainerAction} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ContainerTable containers={coreServices} onContainerSelect={setSelectedContainer} onContainerAction={handleContainerAction} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ContainerTable containers={monitoringServices} onContainerSelect={setSelectedContainer} onContainerAction={handleContainerAction} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ContainerTable containers={securityServices} onContainerSelect={setSelectedContainer} onContainerAction={handleContainerAction} />
        </TabPanel>
      </Paper>

      {/* Container Details Dialog */}
      <Dialog open={!!selectedContainer} onClose={() => setSelectedContainer(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Container Details: {selectedContainer?.name}
        </DialogTitle>
        <DialogContent>
          {selectedContainer && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Status Information</Typography>
                <Typography variant="body2"><strong>ID:</strong> {selectedContainer.id.substring(0, 12)}</Typography>
                <Typography variant="body2"><strong>Image:</strong> {selectedContainer.image}</Typography>
                <Typography variant="body2"><strong>Created:</strong> {selectedContainer.created}</Typography>
                <Typography variant="body2"><strong>Uptime:</strong> {selectedContainer.uptime}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Resource Usage</Typography>
                <Typography variant="body2"><strong>CPU:</strong> {selectedContainer.cpu_percent.toFixed(1)}%</Typography>
                <Typography variant="body2"><strong>Memory:</strong> {selectedContainer.memory_usage} / {selectedContainer.memory_limit} ({selectedContainer.memory_percent.toFixed(1)}%)</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Network & Storage</Typography>
                <Typography variant="body2"><strong>Ports:</strong> {selectedContainer.ports.join(', ') || 'None'}</Typography>
                <Typography variant="body2"><strong>Networks:</strong> {selectedContainer.networks.join(', ')}</Typography>
                <Typography variant="body2"><strong>Network RX:</strong> {formatBytes(selectedContainer.network_io.rx_bytes)}</Typography>
                <Typography variant="body2"><strong>Network TX:</strong> {formatBytes(selectedContainer.network_io.tx_bytes)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

interface ContainerTableProps {
  containers: ContainerStatus[];
  onContainerSelect: (container: ContainerStatus) => void;
  onContainerAction: (containerId: string, action: 'start' | 'stop' | 'restart') => Promise<void>;
}

const ContainerTable: React.FC<ContainerTableProps> = ({ containers, onContainerSelect, onContainerAction }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Container</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Health</TableCell>
            <TableCell>CPU</TableCell>
            <TableCell>Memory</TableCell>
            <TableCell>Network I/O</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {containers.map((container) => (
            <TableRow key={container.id} hover>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">
                    {container.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {container.image}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={container.status} 
                  color={getStatusColor(container.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={container.health} 
                  color={getHealthColor(container.health) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>{container.cpu_percent.toFixed(1)}%</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {container.memory_percent.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {container.memory_usage}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ↓ {formatBytes(container.network_io.rx_bytes)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    ↑ {formatBytes(container.network_io.tx_bytes)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => onContainerSelect(container)}
                    title="View Details"
                  >
                    <Visibility />
                  </IconButton>
                  {container.status === 'running' ? (
                    <IconButton 
                      size="small" 
                      onClick={() => onContainerAction(container.id, 'stop')}
                      title="Stop Container"
                    >
                      <Stop />
                    </IconButton>
                  ) : (
                    <IconButton 
                      size="small" 
                      onClick={() => onContainerAction(container.id, 'start')}
                      title="Start Container"
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'running': return 'success';
    case 'stopped': return 'error';
    case 'starting': return 'warning';
    default: return 'default';
  }
};

const getHealthColor = (health: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (health) {
    case 'healthy': return 'success';
    case 'unhealthy': return 'error';
    case 'starting': return 'warning';
    default: return 'default';
  }
};

export default ContainerMonitoring;