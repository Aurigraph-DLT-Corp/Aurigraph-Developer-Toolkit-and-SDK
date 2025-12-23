import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Tabs, Tab, Button, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl, InputLabel,
  Chip, Avatar, Paper, List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Switch, Divider, Badge, Alert, Tooltip, CircularProgress, LinearProgress
} from '@mui/material';
import {
  Dashboard, Add, Settings, MoreVert, Public, Lock, Group, Speed, Storage,
  Memory, NetworkCheck, Security, Code, People, TrendingUp, Warning, CheckCircle,
  Refresh, FilterList, Download, Upload, Share, Visibility, Edit, Delete
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import ChannelService, { Channel, ChannelConfig, Participant } from '../services/ChannelService';

interface ChannelDashboardProps {
  channel: Channel;
  onConfigUpdate: (config: Partial<ChannelConfig>) => void;
  onParticipantAdd: (participant: Participant) => void;
  onDemoStart: () => void;
}

const ChannelDashboard: React.FC<ChannelDashboardProps> = ({ channel, onConfigUpdate, onParticipantAdd, onDemoStart }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    // Generate performance data for chart
    const data = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}s`,
      tps: channel.metrics.tps + Math.floor((Math.random() - 0.5) * 10000),
      latency: channel.metrics.latency + Math.floor((Math.random() - 0.5) * 5)
    }));
    setPerformanceData(data);

    // Listen for channel updates
    const handleMetricsUpdate = (event: any) => {
      if (event.channelId === channel.id) {
        // Update performance data with new metrics
        setPerformanceData(prev => [...prev.slice(1), {
          time: 'now',
          tps: event.metrics.tps,
          latency: event.metrics.latency
        }]);
      }
    };

    const handleTransaction = (event: any) => {
      if (event.channelId === channel.id) {
        setRecentTransactions(prev => [event.transaction, ...prev.slice(0, 9)]);
      }
    };

    ChannelService.on('metrics_updated', handleMetricsUpdate);
    ChannelService.on('transaction', handleTransaction);

    return () => {
      ChannelService.off('metrics_updated', handleMetricsUpdate);
      ChannelService.off('transaction', handleTransaction);
    };
  }, [channel]);

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'public': return <Public />;
      case 'private': return <Lock />;
      case 'consortium': return <Group />;
      default: return <Dashboard />;
    }
  };

  const getStatusColor = () => {
    switch (channel.status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Channel Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {getChannelIcon()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{channel.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={channel.type} size="small" color="primary" />
              <Chip label={channel.status} size="small" color={getStatusColor()} />
              <Chip label={`${channel.metrics.nodeCount} nodes`} size="small" />
            </Box>
          </Box>
          <Button variant="contained" onClick={onDemoStart} sx={{ mr: 1 }}>
            Start Demo
          </Button>
          <IconButton>
            <Settings />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Participants" />
          <Tab label="Configuration" />
        </Tabs>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <Grid container spacing={2}>
            {/* Key Metrics */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary">
                      {(channel.metrics.tps / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="caption">TPS</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="secondary">
                      {channel.metrics.latency}ms
                    </Typography>
                    <Typography variant="caption">Latency</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4">
                      {channel.metrics.blockHeight.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">Block Height</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4">
                      {channel.metrics.activeContracts}
                    </Typography>
                    <Typography variant="caption">Active Contracts</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>Recent Transactions</Typography>
                <List dense>
                  {recentTransactions.slice(0, 3).map((tx, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={`${tx.from?.substring(0, 10)}... → ${tx.to?.substring(0, 10)}...`}
                        secondary={`${tx.value} tokens • ${new Date(tx.timestamp).toLocaleTimeString()}`}
                      />
                    </ListItem>
                  ))}
                  {recentTransactions.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No recent transactions
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Performance Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>Live Performance</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip />
                    <Line yAxisId="left" type="monotone" dataKey="tps" stroke="#8884d8" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {selectedTab === 1 && (
          <Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip />
                <Area type="monotone" dataKey="tps" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Speed fontSize="large" color="primary" />
                  <Typography variant="h6">{(channel.metrics.throughput / 1000).toFixed(0)}K tx/s</Typography>
                  <Typography variant="caption">Throughput</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Storage fontSize="large" color="secondary" />
                  <Typography variant="h6">{(channel.metrics.storageUsed / (1024 * 1024)).toFixed(0)} MB</Typography>
                  <Typography variant="caption">Storage Used</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Memory fontSize="large" color="success" />
                  <Typography variant="h6">{channel.metrics.totalTransactions.toLocaleString()}</Typography>
                  <Typography variant="caption">Total Transactions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <NetworkCheck fontSize="large" color="info" />
                  <Typography variant="h6">{channel.metrics.nodeCount}</Typography>
                  <Typography variant="caption">Active Nodes</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            <Button variant="outlined" startIcon={<Add />} sx={{ mb: 2 }}>
              Add Participant
            </Button>
            <List>
              {channel.participants.map((participant, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar>
                      <People />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name}
                    secondary={`${participant.role} • ${participant.status}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={participant.status}
                      size="small"
                      color={participant.status === 'online' ? 'success' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {channel.participants.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No participants configured yet
                </Typography>
              )}
            </List>
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Consensus Type"
                  value={channel.config.consensusType}
                  select
                  margin="normal"
                >
                  <MenuItem value="hyperraft">HyperRAFT++</MenuItem>
                  <MenuItem value="pbft">PBFT</MenuItem>
                  <MenuItem value="raft">Standard RAFT</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target TPS"
                  value={channel.config.targetTps}
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Block Size"
                  value={channel.config.blockSize}
                  type="number"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Privacy Level"
                  value={channel.config.privacyLevel}
                  select
                  margin="normal"
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="confidential">Confidential</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Channel configuration affects performance and privacy. Changes require consensus from all participants.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" sx={{ mr: 2 }}>
                  Apply Changes
                </Button>
                <Button variant="outlined">
                  Reset to Default
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MultiChannelDashboard: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'public' as const,
    consensusType: 'hyperraft' as const,
    targetTps: 100000,
    privacyLevel: 'public' as const
  });

  useEffect(() => {
    // Load channels
    const allChannels = ChannelService.getAllChannels();
    setChannels(allChannels);
    if (allChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(allChannels[0].id);
    }

    // Listen for channel events
    const handleChannelCreated = (channel: Channel) => {
      setChannels(prev => [...prev, channel]);
    };

    const handleChannelUpdate = () => {
      setChannels(ChannelService.getAllChannels());
    };

    ChannelService.on('channel_created', handleChannelCreated);
    ChannelService.on('channel_config_updated', handleChannelUpdate);
    ChannelService.on('metrics_updated', handleChannelUpdate);

    return () => {
      ChannelService.off('channel_created', handleChannelCreated);
      ChannelService.off('channel_config_updated', handleChannelUpdate);
      ChannelService.off('metrics_updated', handleChannelUpdate);
    };
  }, [selectedChannel]);

  const handleCreateChannel = () => {
    const channel: Channel = {
      id: `channel-${Date.now()}`,
      name: newChannel.name,
      type: newChannel.type,
      status: 'pending',
      config: {
        consensusType: newChannel.consensusType,
        blockSize: 1000,
        blockTimeout: 2,
        maxMessageCount: 100,
        batchTimeout: 1,
        maxChannels: 10,
        targetTps: newChannel.targetTps,
        privacyLevel: newChannel.privacyLevel,
        endorsementPolicy: 'ANY',
        cryptoConfig: {
          algorithm: 'CRYSTALS-Dilithium',
          keySize: 256,
          quantumResistant: true
        }
      },
      metrics: {
        tps: 0,
        totalTransactions: 0,
        blockHeight: 0,
        latency: 0,
        throughput: 0,
        nodeCount: 0,
        activeContracts: 0,
        storageUsed: 0
      },
      participants: [],
      smartContracts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ChannelService.createChannel(channel);
    setCreateDialogOpen(false);
    setSelectedChannel(channel.id);

    // Simulate channel activation
    setTimeout(() => {
      channel.status = 'active';
      ChannelService.emit('channel_config_updated', { channelId: channel.id });
    }, 2000);
  };

  const handleStartDemo = (channelId: string) => {
    setDemoDialogOpen(true);
    // Start demo simulation for the specific channel
    const channel = ChannelService.getChannel(channelId);
    if (channel) {
      // Simulate high transaction volume
      let txCount = 0;
      const demoInterval = setInterval(() => {
        txCount++;
        ChannelService.emit('transaction', {
          channelId,
          transaction: {
            id: `demo_tx_${txCount}`,
            from: `0xDemo${Math.random().toString(16).substr(2, 8)}`,
            to: `0xDemo${Math.random().toString(16).substr(2, 8)}`,
            value: Math.floor(Math.random() * 1000),
            timestamp: new Date()
          }
        });

        // Update metrics
        channel.metrics.tps = Math.floor(50000 + Math.random() * 50000);
        channel.metrics.totalTransactions += 100;
        channel.metrics.throughput = channel.metrics.tps * 1.1;
        ChannelService.emit('metrics_updated', { channelId, metrics: channel.metrics });

        if (txCount >= 100) {
          clearInterval(demoInterval);
        }
      }, 100);
    }
  };

  const currentChannel = selectedChannel ? channels.find(c => c.id === selectedChannel) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Multi-Channel Dashboard</Typography>

      {/* Channel Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Active Channels</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Create Channel
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {channels.map(channel => (
            <Chip
              key={channel.id}
              label={channel.name}
              onClick={() => setSelectedChannel(channel.id)}
              color={selectedChannel === channel.id ? 'primary' : 'default'}
              variant={selectedChannel === channel.id ? 'filled' : 'outlined'}
              icon={channel.type === 'private' ? <Lock /> : channel.type === 'consortium' ? <Group /> : <Public />}
              deleteIcon={<Badge badgeContent={channel.metrics.nodeCount} color="secondary"><People /></Badge>}
              onDelete={() => {}}
            />
          ))}
        </Box>
      </Paper>

      {/* Selected Channel Dashboard */}
      {currentChannel ? (
        <ChannelDashboard
          channel={currentChannel}
          onConfigUpdate={(config) => ChannelService.updateChannelConfig(currentChannel.id, config)}
          onParticipantAdd={(participant) => ChannelService.addParticipant(currentChannel.id, participant)}
          onDemoStart={() => handleStartDemo(currentChannel.id)}
        />
      ) : (
        <Alert severity="info">
          No channel selected. Create a new channel or select an existing one to view its dashboard.
        </Alert>
      )}

      {/* Create Channel Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Channel Name"
            value={newChannel.name}
            onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Channel Type</InputLabel>
            <Select
              value={newChannel.type}
              onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as any })}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="consortium">Consortium</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Consensus Algorithm</InputLabel>
            <Select
              value={newChannel.consensusType}
              onChange={(e) => setNewChannel({ ...newChannel, consensusType: e.target.value as any })}
            >
              <MenuItem value="hyperraft">HyperRAFT++</MenuItem>
              <MenuItem value="pbft">PBFT</MenuItem>
              <MenuItem value="raft">Standard RAFT</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Target TPS"
            type="number"
            value={newChannel.targetTps}
            onChange={(e) => setNewChannel({ ...newChannel, targetTps: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Privacy Level</InputLabel>
            <Select
              value={newChannel.privacyLevel}
              onChange={(e) => setNewChannel({ ...newChannel, privacyLevel: e.target.value as any })}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="confidential">Confidential</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateChannel} disabled={!newChannel.name}>
            Create Channel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Demo Running Dialog */}
      <Dialog open={demoDialogOpen} onClose={() => setDemoDialogOpen(false)}>
        <DialogTitle>Demo Running</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Simulating transactions on {currentChannel?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Generating sample transactions and smart contract deployments...
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiChannelDashboard;