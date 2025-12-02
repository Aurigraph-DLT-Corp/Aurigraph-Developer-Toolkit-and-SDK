import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, List,
  ListItem, ListItemText, ListItemIcon, Switch, FormControlLabel,
  CircularProgress, Alert, Checkbox, Accordion, AccordionSummary,
  AccordionDetails, Tabs, Tab, Divider, Tooltip, Badge, Stepper,
  Step, StepLabel, StepContent, LinearProgress, Avatar
} from '@mui/material';
import {
  Add, Delete, Edit, Group, Lock, Settings, Hub, ExpandMore,
  Computer, Apps, CheckCircle, Warning, Error as ErrorIcon,
  PlayArrow, Stop, Refresh, Search, FilterList, CloudQueue,
  Storage, Security, Code, Speed, Dns, Memory, NetworkCheck
} from '@mui/icons-material';
import { apiService } from '../services/api';

// Color theme
const COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  success: '#00D084',
  purple: '#A855F7',
  blue: '#3B82F6',
  orange: '#F59E0B',
};

// Types
interface NodeInfo {
  nodeId: string;
  nodeType: 'VALIDATOR' | 'PEER' | 'ORDERER';
  status: 'ACTIVE' | 'INACTIVE' | 'SYNCING';
  version: string;
  uptimeSeconds: number;
  resourceUsage: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    networkPercent: number;
  };
  location: {
    country: string;
    region: string;
    city: string;
  };
  ipAddress: string;
  port: number;
  stakeAmount?: string;
  reliability: number;
}

interface Application {
  id: string;
  name: string;
  type: 'chaincode' | 'smart-contract' | 'dapp' | 'service';
  version: string;
  status: 'deployed' | 'pending' | 'stopped' | 'error';
  language: string;
  description: string;
}

interface ChannelNode {
  nodeId: string;
  role: 'anchor' | 'endorser' | 'committer';
  joinedAt: string;
  apps: string[]; // App IDs deployed on this node
}

interface ChannelData {
  id: string;
  name: string;
  description: string;
  nodes: ChannelNode[];
  policies: string[];
  privacy: 'public' | 'private' | 'consortium';
  status: 'active' | 'inactive' | 'creating';
  createdAt: string;
  transactionCount: number;
  blockHeight: number;
}

// Available applications/chaincodes
const AVAILABLE_APPS: Application[] = [
  { id: 'app-rwa-tokenizer', name: 'RWA Tokenizer', type: 'chaincode', version: '2.1.0', status: 'deployed', language: 'Go', description: 'Real-world asset tokenization chaincode' },
  { id: 'app-kyc-verifier', name: 'KYC Verifier', type: 'chaincode', version: '1.5.0', status: 'deployed', language: 'Go', description: 'KYC/AML verification service' },
  { id: 'app-payment-gateway', name: 'Payment Gateway', type: 'smart-contract', version: '3.0.0', status: 'deployed', language: 'Solidity', description: 'Cross-chain payment processing' },
  { id: 'app-document-vault', name: 'Document Vault', type: 'chaincode', version: '1.2.0', status: 'deployed', language: 'Go', description: 'Encrypted document storage' },
  { id: 'app-supply-chain', name: 'Supply Chain Tracker', type: 'chaincode', version: '2.0.0', status: 'deployed', language: 'Java', description: 'Supply chain provenance tracking' },
  { id: 'app-voting', name: 'Voting System', type: 'smart-contract', version: '1.0.0', status: 'deployed', language: 'Solidity', description: 'Decentralized voting mechanism' },
  { id: 'app-carbon-credits', name: 'Carbon Credits', type: 'chaincode', version: '1.3.0', status: 'deployed', language: 'Go', description: 'Carbon credit trading and verification' },
  { id: 'app-nft-marketplace', name: 'NFT Marketplace', type: 'smart-contract', version: '2.2.0', status: 'deployed', language: 'Solidity', description: 'NFT minting and trading' },
];

export const ChannelManagement: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Form states
  const [activeStep, setActiveStep] = useState(0);
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    privacy: 'private' as 'public' | 'private' | 'consortium',
    selectedNodes: [] as { nodeId: string; role: 'anchor' | 'endorser' | 'committer' }[],
    selectedApps: [] as string[],
  });

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Fetch data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch nodes
      const nodesResponse = await apiService.getNodes();
      if (nodesResponse.nodes) {
        setAvailableNodes(nodesResponse.nodes);
      }

      // Fetch channels - use mock data if API returns empty
      const channelsResponse = await apiService.getChannels();
      if (channelsResponse.channels && channelsResponse.channels.length > 0) {
        setChannels(channelsResponse.channels);
      } else {
        // Initialize with sample channels
        setChannels(generateSampleChannels());
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Using demo mode.');
      setAvailableNodes(generateMockNodes());
      setChannels(generateSampleChannels());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock nodes if API fails
  const generateMockNodes = (): NodeInfo[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      nodeId: `validator-${String(i).padStart(3, '0')}`,
      nodeType: 'VALIDATOR' as const,
      status: 'ACTIVE' as const,
      version: '12.0.0',
      uptimeSeconds: Math.floor(Math.random() * 2000000) + 500000,
      resourceUsage: {
        cpuPercent: Math.random() * 60 + 20,
        memoryPercent: Math.random() * 40 + 40,
        diskPercent: Math.random() * 30 + 30,
        networkPercent: Math.random() * 50 + 40,
      },
      location: {
        country: ['USA', 'Canada', 'Germany', 'UK', 'Japan', 'Singapore'][i % 6],
        region: ['North America', 'Europe', 'Asia Pacific'][i % 3],
        city: ['New York', 'Toronto', 'Berlin', 'London', 'Tokyo', 'Singapore'][i % 6],
      },
      ipAddress: `10.0.0.${i}`,
      port: 9000 + i,
      stakeAmount: `${1000000 + i * 10000} AUR`,
      reliability: 99.9 - (Math.random() * 0.1),
    }));
  };

  // Generate sample channels
  const generateSampleChannels = (): ChannelData[] => [
    {
      id: 'channel-main',
      name: 'Main Network',
      description: 'Primary production channel for all validators',
      nodes: [
        { nodeId: 'validator-000', role: 'anchor', joinedAt: new Date().toISOString(), apps: ['app-rwa-tokenizer', 'app-kyc-verifier'] },
        { nodeId: 'validator-001', role: 'endorser', joinedAt: new Date().toISOString(), apps: ['app-rwa-tokenizer'] },
        { nodeId: 'validator-002', role: 'committer', joinedAt: new Date().toISOString(), apps: ['app-payment-gateway'] },
      ],
      policies: ['Endorsement: 2-of-3', 'Admin: Majority'],
      privacy: 'consortium',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCount: 1250000,
      blockHeight: 89234,
    },
    {
      id: 'channel-rwa',
      name: 'RWA Private Channel',
      description: 'Private channel for real-world asset tokenization',
      nodes: [
        { nodeId: 'validator-003', role: 'anchor', joinedAt: new Date().toISOString(), apps: ['app-rwa-tokenizer', 'app-document-vault'] },
        { nodeId: 'validator-004', role: 'endorser', joinedAt: new Date().toISOString(), apps: ['app-rwa-tokenizer', 'app-kyc-verifier'] },
      ],
      policies: ['Endorsement: All', 'Admin: All'],
      privacy: 'private',
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      transactionCount: 45000,
      blockHeight: 12345,
    },
  ];

  // Create channel
  const handleCreateChannel = async () => {
    if (!channelForm.name || channelForm.selectedNodes.length === 0) {
      setError('Please provide channel name and select at least one node');
      return;
    }

    const newChannel: ChannelData = {
      id: `channel-${Date.now()}`,
      name: channelForm.name,
      description: channelForm.description,
      nodes: channelForm.selectedNodes.map(n => ({
        ...n,
        joinedAt: new Date().toISOString(),
        apps: channelForm.selectedApps,
      })),
      policies: ['Endorsement: Majority', 'Admin: Majority'],
      privacy: channelForm.privacy,
      status: 'active',
      createdAt: new Date().toISOString(),
      transactionCount: 0,
      blockHeight: 0,
    };

    setChannels([...channels, newChannel]);
    setSuccess(`Channel "${channelForm.name}" created successfully with ${channelForm.selectedNodes.length} nodes`);
    setCreateDialogOpen(false);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setChannelForm({
      name: '',
      description: '',
      privacy: 'private',
      selectedNodes: [],
      selectedApps: [],
    });
    setActiveStep(0);
  };

  // Add node to channel
  const handleAddNodeToChannel = (channel: ChannelData, nodeId: string, role: 'anchor' | 'endorser' | 'committer') => {
    const updatedChannels = channels.map(ch => {
      if (ch.id === channel.id) {
        const existingNode = ch.nodes.find(n => n.nodeId === nodeId);
        if (!existingNode) {
          return {
            ...ch,
            nodes: [...ch.nodes, { nodeId, role, joinedAt: new Date().toISOString(), apps: [] }],
          };
        }
      }
      return ch;
    });
    setChannels(updatedChannels);
    setSuccess(`Node ${nodeId} added to channel ${channel.name}`);
  };

  // Remove node from channel
  const handleRemoveNodeFromChannel = (channel: ChannelData, nodeId: string) => {
    const updatedChannels = channels.map(ch => {
      if (ch.id === channel.id) {
        return {
          ...ch,
          nodes: ch.nodes.filter(n => n.nodeId !== nodeId),
        };
      }
      return ch;
    });
    setChannels(updatedChannels);
    setSuccess(`Node ${nodeId} removed from channel ${channel.name}`);
  };

  // Add app to node in channel
  const handleAddAppToNode = (channel: ChannelData, nodeId: string, appId: string) => {
    const updatedChannels = channels.map(ch => {
      if (ch.id === channel.id) {
        return {
          ...ch,
          nodes: ch.nodes.map(n => {
            if (n.nodeId === nodeId && !n.apps.includes(appId)) {
              return { ...n, apps: [...n.apps, appId] };
            }
            return n;
          }),
        };
      }
      return ch;
    });
    setChannels(updatedChannels);
    const app = AVAILABLE_APPS.find(a => a.id === appId);
    setSuccess(`${app?.name} deployed to ${nodeId}`);
  };

  // Remove app from node
  const handleRemoveAppFromNode = (channel: ChannelData, nodeId: string, appId: string) => {
    const updatedChannels = channels.map(ch => {
      if (ch.id === channel.id) {
        return {
          ...ch,
          nodes: ch.nodes.map(n => {
            if (n.nodeId === nodeId) {
              return { ...n, apps: n.apps.filter(a => a !== appId) };
            }
            return n;
          }),
        };
      }
      return ch;
    });
    setChannels(updatedChannels);
  };

  // Get node info
  const getNodeInfo = (nodeId: string): NodeInfo | undefined => {
    return availableNodes.find(n => n.nodeId === nodeId);
  };

  // Get app info
  const getAppInfo = (appId: string): Application | undefined => {
    return AVAILABLE_APPS.find(a => a.id === appId);
  };

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  // Render node selection for channel creation
  const renderNodeSelection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
        Select nodes to add to this channel ({channelForm.selectedNodes.length} selected)
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ bgcolor: '#1A1F3A' }}>Select</TableCell>
              <TableCell sx={{ bgcolor: '#1A1F3A' }}>Node ID</TableCell>
              <TableCell sx={{ bgcolor: '#1A1F3A' }}>Status</TableCell>
              <TableCell sx={{ bgcolor: '#1A1F3A' }}>Location</TableCell>
              <TableCell sx={{ bgcolor: '#1A1F3A' }}>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableNodes.map((node) => {
              const isSelected = channelForm.selectedNodes.some(n => n.nodeId === node.nodeId);
              const selectedNode = channelForm.selectedNodes.find(n => n.nodeId === node.nodeId);

              return (
                <TableRow key={node.nodeId} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setChannelForm({
                            ...channelForm,
                            selectedNodes: [...channelForm.selectedNodes, { nodeId: node.nodeId, role: 'endorser' }],
                          });
                        } else {
                          setChannelForm({
                            ...channelForm,
                            selectedNodes: channelForm.selectedNodes.filter(n => n.nodeId !== node.nodeId),
                          });
                        }
                      }}
                      sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Dns sx={{ color: COLORS.primary, fontSize: 18 }} />
                      <Typography variant="body2">{node.nodeId}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={node.status}
                      size="small"
                      sx={{
                        bgcolor: node.status === 'ACTIVE' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                        color: node.status === 'ACTIVE' ? COLORS.success : COLORS.warning,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{node.location.city}, {node.location.country}</Typography>
                  </TableCell>
                  <TableCell>
                    {isSelected && (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={selectedNode?.role || 'endorser'}
                          onChange={(e) => {
                            setChannelForm({
                              ...channelForm,
                              selectedNodes: channelForm.selectedNodes.map(n =>
                                n.nodeId === node.nodeId ? { ...n, role: e.target.value as any } : n
                              ),
                            });
                          }}
                          sx={{ '& .MuiSelect-select': { py: 0.5 } }}
                        >
                          <MenuItem value="anchor">Anchor</MenuItem>
                          <MenuItem value="endorser">Endorser</MenuItem>
                          <MenuItem value="committer">Committer</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Render app selection for channel creation
  const renderAppSelection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
        Select applications to deploy on channel nodes ({channelForm.selectedApps.length} selected)
      </Typography>
      <Grid container spacing={2}>
        {AVAILABLE_APPS.map((app) => {
          const isSelected = channelForm.selectedApps.includes(app.id);
          return (
            <Grid item xs={12} md={6} key={app.id}>
              <Card
                sx={{
                  bgcolor: isSelected ? `${COLORS.primary}22` : 'rgba(26, 31, 58, 0.8)',
                  border: `1px solid ${isSelected ? COLORS.primary : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: COLORS.primary },
                }}
                onClick={() => {
                  if (isSelected) {
                    setChannelForm({
                      ...channelForm,
                      selectedApps: channelForm.selectedApps.filter(a => a !== app.id),
                    });
                  } else {
                    setChannelForm({
                      ...channelForm,
                      selectedApps: [...channelForm.selectedApps, app.id],
                    });
                  }
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={isSelected}
                        sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary }, p: 0 }}
                      />
                      <Code sx={{ color: COLORS.blue }} />
                      <Box>
                        <Typography variant="subtitle2">{app.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {app.type} • {app.language} • v{app.version}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label={app.status} size="small" sx={{ bgcolor: `${COLORS.success}22`, color: COLORS.success }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, fontSize: '0.75rem' }}>
                    {app.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // Render channel card with nodes
  const renderChannelCard = (channel: ChannelData) => (
    <Card
      key={channel.id}
      sx={{
        bgcolor: 'rgba(26, 31, 58, 0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        mb: 3,
      }}
    >
      <CardContent>
        {/* Channel Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Hub sx={{ color: COLORS.primary }} />
              <Typography variant="h6">{channel.name}</Typography>
              <Chip
                label={channel.privacy.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: channel.privacy === 'private' ? `${COLORS.error}22` : `${COLORS.primary}22`,
                  color: channel.privacy === 'private' ? COLORS.error : COLORS.primary,
                }}
              />
              <Chip
                label={channel.status.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: channel.status === 'active' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                  color: channel.status === 'active' ? COLORS.success : COLORS.warning,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {channel.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                setSelectedChannel(channel);
                setNodeDialogOpen(true);
              }}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Add Node
            </Button>
          </Box>
        </Box>

        {/* Channel Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: COLORS.primary }}>{channel.nodes.length}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nodes</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: COLORS.blue }}>
                {new Set(channel.nodes.flatMap(n => n.apps)).size}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Apps</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: COLORS.success }}>{channel.blockHeight.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Block Height</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: COLORS.orange }}>{(channel.transactionCount / 1000).toFixed(0)}K</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Transactions</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Nodes in Channel */}
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
          Nodes in Channel
        </Typography>
        <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Node</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Apps Deployed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {channel.nodes.map((channelNode) => {
                const nodeInfo = getNodeInfo(channelNode.nodeId);
                return (
                  <TableRow key={channelNode.nodeId}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${COLORS.primary}22` }}>
                          <Dns sx={{ fontSize: 18, color: COLORS.primary }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{channelNode.nodeId}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {nodeInfo?.location.city}, {nodeInfo?.location.country}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={channelNode.role.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: channelNode.role === 'anchor' ? `${COLORS.purple}22` : `${COLORS.blue}22`,
                          color: channelNode.role === 'anchor' ? COLORS.purple : COLORS.blue,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={nodeInfo?.status === 'ACTIVE' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Warning sx={{ fontSize: 14 }} />}
                        label={nodeInfo?.status || 'Unknown'}
                        size="small"
                        sx={{
                          bgcolor: nodeInfo?.status === 'ACTIVE' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                          color: nodeInfo?.status === 'ACTIVE' ? COLORS.success : COLORS.warning,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {channelNode.apps.map(appId => {
                          const app = getAppInfo(appId);
                          return (
                            <Tooltip key={appId} title={app?.description || appId}>
                              <Chip
                                label={app?.name || appId}
                                size="small"
                                onDelete={() => handleRemoveAppFromNode(channel, channelNode.nodeId, appId)}
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          );
                        })}
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setSelectedNode(channelNode.nodeId);
                            setAppDialogOpen(true);
                          }}
                          sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                        >
                          <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveNodeFromChannel(channel, channelNode.nodeId)}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (loading && channels.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hub sx={{ color: COLORS.primary }} />
            Channel Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Create and manage channels with nodes and applications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: COLORS.primary }}
          >
            Create Channel
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Total Channels</Typography>
              <Typography variant="h4" sx={{ color: COLORS.primary }}>{channels.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Available Nodes</Typography>
              <Typography variant="h4" sx={{ color: COLORS.blue }}>{availableNodes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Nodes in Channels</Typography>
              <Typography variant="h4" sx={{ color: COLORS.success }}>
                {channels.reduce((sum, ch) => sum + ch.nodes.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Available Apps</Typography>
              <Typography variant="h4" sx={{ color: COLORS.orange }}>{AVAILABLE_APPS.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Channels List */}
      {channels.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(26, 31, 58, 0.5)' }}>
          <Hub sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            No channels configured
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3 }}>
            Create your first channel to start adding nodes and applications
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: COLORS.primary }}
          >
            Create First Channel
          </Button>
        </Paper>
      ) : (
        channels.map(channel => renderChannelCard(channel))
      )}

      {/* Create Channel Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => { setCreateDialogOpen(false); resetForm(); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            <Step>
              <StepLabel>Channel Details</StepLabel>
              <StepContent>
                <TextField
                  fullWidth
                  label="Channel Name"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  margin="normal"
                  sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={channelForm.description}
                  onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                  sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Privacy Level</InputLabel>
                  <Select
                    value={channelForm.privacy}
                    onChange={(e) => setChannelForm({ ...channelForm, privacy: e.target.value as any })}
                    label="Privacy Level"
                  >
                    <MenuItem value="public">Public - Open to all participants</MenuItem>
                    <MenuItem value="private">Private - Invitation only</MenuItem>
                    <MenuItem value="consortium">Consortium - Selected organizations</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={() => setActiveStep(1)} disabled={!channelForm.name}>
                    Next: Select Nodes
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Select Nodes ({channelForm.selectedNodes.length} selected)</StepLabel>
              <StepContent>
                {renderNodeSelection()}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    disabled={channelForm.selectedNodes.length === 0}
                  >
                    Next: Select Apps
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Deploy Applications ({channelForm.selectedApps.length} selected)</StepLabel>
              <StepContent>
                {renderAppSelection()}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setActiveStep(1)}>Back</Button>
                  <Button variant="contained" onClick={handleCreateChannel} sx={{ bgcolor: COLORS.success }}>
                    Create Channel
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add Node to Channel Dialog */}
      <Dialog
        open={nodeDialogOpen}
        onClose={() => setNodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Add Node to {selectedChannel?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Select a node to add to this channel. Nodes already in the channel are not shown.
          </Typography>
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#1A1F3A' }}>Node ID</TableCell>
                  <TableCell sx={{ bgcolor: '#1A1F3A' }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: '#1A1F3A' }}>Location</TableCell>
                  <TableCell sx={{ bgcolor: '#1A1F3A' }}>Resources</TableCell>
                  <TableCell sx={{ bgcolor: '#1A1F3A' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableNodes
                  .filter(node => !selectedChannel?.nodes.some(n => n.nodeId === node.nodeId))
                  .map((node) => (
                    <TableRow key={node.nodeId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Dns sx={{ color: COLORS.primary, fontSize: 18 }} />
                          <Typography variant="body2">{node.nodeId}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={node.status}
                          size="small"
                          sx={{
                            bgcolor: node.status === 'ACTIVE' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                            color: node.status === 'ACTIVE' ? COLORS.success : COLORS.warning,
                          }}
                        />
                      </TableCell>
                      <TableCell>{node.location.city}, {node.location.country}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={`CPU: ${node.resourceUsage.cpuPercent.toFixed(1)}%`}>
                            <Chip label={`${node.resourceUsage.cpuPercent.toFixed(0)}%`} size="small" sx={{ fontSize: '0.65rem' }} />
                          </Tooltip>
                          <Tooltip title={`Memory: ${node.resourceUsage.memoryPercent.toFixed(1)}%`}>
                            <Chip label={`${node.resourceUsage.memoryPercent.toFixed(0)}%`} size="small" sx={{ fontSize: '0.65rem' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            if (selectedChannel) {
                              handleAddNodeToChannel(selectedChannel, node.nodeId, 'endorser');
                              setNodeDialogOpen(false);
                            }
                          }}
                          sx={{ bgcolor: COLORS.primary }}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add App to Node Dialog */}
      <Dialog
        open={appDialogOpen}
        onClose={() => setAppDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Deploy Application to {selectedNode}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            Select an application to deploy on this node.
          </Typography>
          <List>
            {AVAILABLE_APPS.filter(app => {
              const nodeInChannel = selectedChannel?.nodes.find(n => n.nodeId === selectedNode);
              return !nodeInChannel?.apps.includes(app.id);
            }).map((app) => (
              <ListItem
                key={app.id}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.03)',
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon>
                  <Code sx={{ color: COLORS.blue }} />
                </ListItemIcon>
                <ListItemText
                  primary={app.name}
                  secondary={`${app.type} • ${app.language} • v${app.version}`}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (selectedChannel && selectedNode) {
                      handleAddAppToNode(selectedChannel, selectedNode, app.id);
                      setAppDialogOpen(false);
                    }
                  }}
                  sx={{ bgcolor: COLORS.primary }}
                >
                  Deploy
                </Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChannelManagement;
