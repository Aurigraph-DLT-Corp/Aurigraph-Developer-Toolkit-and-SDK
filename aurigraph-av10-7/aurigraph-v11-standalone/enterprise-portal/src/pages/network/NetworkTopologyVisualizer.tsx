/**
 * NetworkTopologyVisualizer.tsx
 *
 * Interactive network topology visualization and peer monitoring
 * Features:
 * - Interactive network graph with React Flow
 * - Real-time peer connection monitoring
 * - Network statistics and health metrics
 * - Geographic distribution mapping
 * - Network events log
 * - Performance optimized for 1000+ nodes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Public as PublicIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkCheckIcon,
  Storage as StorageIcon,
  Router as RouterIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneAndroidIcon,
} from '@mui/icons-material';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  NodeProps,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';

// ==================== Types & Interfaces ====================

interface NetworkPeer {
  id: string;
  address: string;
  type: 'validator' | 'full' | 'light';
  status: 'connected' | 'disconnected' | 'syncing';
  latency: number;
  uptime: number;
  version: string;
  location: {
    country: string;
    region: string;
    lat: number;
    lon: number;
  };
  stake?: number;
  capacity: number;
  connections: string[];
  lastSeen: string;
  bandwidthIn: number;
  bandwidthOut: number;
}

interface NetworkTopology {
  nodes: NetworkPeer[];
  edges: Array<{
    source: string;
    target: string;
    latency: number;
    bandwidth: number;
  }>;
  timestamp: string;
}

interface NetworkHealth {
  score: number;
  totalPeers: number;
  activePeers: number;
  avgLatency: number;
  throughput: number;
  blockPropagationTime: number;
  networkEfficiency: number;
  centralizationScore: number;
}

interface NetworkEvent {
  id: string;
  type: 'connection' | 'disconnection' | 'sync' | 'error' | 'warning';
  peerId: string;
  peerAddress: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

interface NetworkMetrics {
  timestamp: string;
  connectedPeers: number;
  avgLatency: number;
  throughput: number;
  bandwidthIn: number;
  bandwidthOut: number;
}

interface RegionStats {
  region: string;
  peerCount: number;
  avgLatency: number;
  totalBandwidth: number;
}

// ==================== Custom Node Components ====================

const ValidatorNode: React.FC<NodeProps> = ({ data }) => (
  <Box
    sx={{
      padding: 2,
      borderRadius: 2,
      backgroundColor: data.status === 'connected' ? '#1976d2' : '#757575',
      color: 'white',
      border: '2px solid',
      borderColor: data.selected ? '#fff' : 'transparent',
      minWidth: 100,
      textAlign: 'center',
      boxShadow: data.selected ? '0 0 20px rgba(25, 118, 210, 0.5)' : 'none',
      opacity: data.uptime > 90 ? 1 : 0.7,
    }}
  >
    <StorageIcon sx={{ fontSize: 32 }} />
    <Typography variant="caption" display="block">{data.label}</Typography>
    <Typography variant="caption" display="block">
      {data.stake ? `${(data.stake / 1000000).toFixed(1)}M` : 'N/A'}
    </Typography>
  </Box>
);

const FullNode: React.FC<NodeProps> = ({ data }) => (
  <Box
    sx={{
      padding: 1.5,
      borderRadius: 2,
      backgroundColor: data.status === 'connected' ? '#2e7d32' : '#757575',
      color: 'white',
      border: '2px solid',
      borderColor: data.selected ? '#fff' : 'transparent',
      minWidth: 80,
      textAlign: 'center',
      boxShadow: data.selected ? '0 0 15px rgba(46, 125, 50, 0.5)' : 'none',
      opacity: data.uptime > 90 ? 1 : 0.7,
    }}
  >
    <ComputerIcon sx={{ fontSize: 28 }} />
    <Typography variant="caption" display="block">{data.label}</Typography>
  </Box>
);

const LightNode: React.FC<NodeProps> = ({ data }) => (
  <Box
    sx={{
      padding: 1,
      borderRadius: 2,
      backgroundColor: data.status === 'connected' ? '#ed6c02' : '#757575',
      color: 'white',
      border: '2px solid',
      borderColor: data.selected ? '#fff' : 'transparent',
      minWidth: 60,
      textAlign: 'center',
      boxShadow: data.selected ? '0 0 10px rgba(237, 108, 2, 0.5)' : 'none',
      opacity: data.uptime > 90 ? 1 : 0.7,
    }}
  >
    <PhoneAndroidIcon sx={{ fontSize: 24 }} />
    <Typography variant="caption" display="block">{data.label}</Typography>
  </Box>
);

const nodeTypes = {
  validator: ValidatorNode,
  full: FullNode,
  light: LightNode,
};

// ==================== Main Component ====================

const NetworkTopologyVisualizer: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [filterNodeType, setFilterNodeType] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<NetworkPeer | null>(null);

  // Network data
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<NetworkMetrics[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ==================== Data Fetching ====================

  const fetchNetworkTopology = useCallback(async () => {
    try {
      const response = await axios.get('/api/v12/network/topology');
      setTopology(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch network topology:', err);
      setError('Failed to load network topology');
    }
  }, []);

  const fetchNetworkHealth = useCallback(async () => {
    try {
      const response = await axios.get('/api/v12/network/health');
      setHealth(response.data);
    } catch (err) {
      console.error('Failed to fetch network health:', err);
    }
  }, []);

  const fetchNetworkEvents = useCallback(async () => {
    try {
      const response = await axios.get('/api/v12/network/events?limit=50');
      setEvents(response.data.events || []);
    } catch (err) {
      console.error('Failed to fetch network events:', err);
    }
  }, []);

  const fetchLiveMetrics = useCallback(async () => {
    try {
      const response = await axios.get('/api/v12/live/network');
      const newMetric: NetworkMetrics = {
        timestamp: new Date().toISOString(),
        connectedPeers: response.data.connectedPeers || 0,
        avgLatency: response.data.avgLatency || 0,
        throughput: response.data.throughput || 0,
        bandwidthIn: response.data.bandwidthIn || 0,
        bandwidthOut: response.data.bandwidthOut || 0,
      };
      setMetricsHistory(prev => [...prev.slice(-29), newMetric]);
    } catch (err) {
      console.error('Failed to fetch live metrics:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchNetworkTopology(),
      fetchNetworkHealth(),
      fetchNetworkEvents(),
      fetchLiveMetrics(),
    ]);
    setLoading(false);
  }, [fetchNetworkTopology, fetchNetworkHealth, fetchNetworkEvents, fetchLiveMetrics]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLiveMetrics();
      fetchNetworkHealth();
    }, refreshInterval * 1000);

    const topologyInterval = setInterval(() => {
      fetchNetworkTopology();
      fetchNetworkEvents();
    }, 30000); // Refresh topology every 30 seconds

    return () => {
      clearInterval(interval);
      clearInterval(topologyInterval);
    };
  }, [autoRefresh, refreshInterval, fetchLiveMetrics, fetchNetworkHealth, fetchNetworkTopology, fetchNetworkEvents]);

  // ==================== Graph Construction ====================

  useEffect(() => {
    if (!topology) return;

    const filteredNodes = topology.nodes.filter(
      node => filterNodeType === 'all' || node.type === filterNodeType
    );

    // Create React Flow nodes
    const flowNodes: Node[] = filteredNodes.map((peer, index) => {
      const angle = (index / filteredNodes.length) * 2 * Math.PI;
      const radius = 300;
      const x = 500 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);

      return {
        id: peer.id,
        type: peer.type,
        position: { x, y },
        data: {
          label: peer.address.substring(0, 8),
          status: peer.status,
          uptime: peer.uptime,
          stake: peer.stake,
          selected: selectedNode?.id === peer.id,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    // Create React Flow edges
    const flowEdges: Edge[] = topology.edges
      .filter(edge => {
        const sourceExists = filteredNodes.some(n => n.id === edge.source);
        const targetExists = filteredNodes.some(n => n.id === edge.target);
        return sourceExists && targetExists;
      })
      .map((edge, index) => ({
        id: `e${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        animated: edge.latency < 50,
        style: {
          stroke: edge.latency < 50 ? '#4caf50' : edge.latency < 100 ? '#ff9800' : '#f44336',
          strokeWidth: Math.max(1, Math.min(5, edge.bandwidth / 100)),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.latency < 50 ? '#4caf50' : edge.latency < 100 ? '#ff9800' : '#f44336',
        },
      }));

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Calculate region statistics
    const regionMap = new Map<string, RegionStats>();
    filteredNodes.forEach(peer => {
      const region = peer.location.region;
      if (!regionMap.has(region)) {
        regionMap.set(region, {
          region,
          peerCount: 0,
          avgLatency: 0,
          totalBandwidth: 0,
        });
      }
      const stats = regionMap.get(region)!;
      stats.peerCount++;
      stats.avgLatency += peer.latency;
      stats.totalBandwidth += peer.bandwidthIn + peer.bandwidthOut;
    });

    const regions = Array.from(regionMap.values()).map(stats => ({
      ...stats,
      avgLatency: stats.avgLatency / stats.peerCount,
    }));
    setRegionStats(regions);
  }, [topology, filterNodeType, selectedNode, setNodes, setEdges]);

  // ==================== Event Handlers ====================

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const peer = topology?.nodes.find(n => n.id === node.id);
    setSelectedNode(peer || null);
  }, [topology]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleExportEvents = useCallback(() => {
    const csv = [
      ['Timestamp', 'Type', 'Peer ID', 'Peer Address', 'Message', 'Severity'].join(','),
      ...events.map(e => [
        e.timestamp,
        e.type,
        e.peerId,
        e.peerAddress,
        `"${e.message}"`,
        e.severity,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-events-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  const handleExportTopology = useCallback(() => {
    const data = JSON.stringify(topology, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-topology-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [topology]);

  // ==================== Computed Values ====================

  const nodeTypeDistribution = useMemo(() => {
    if (!topology) return [];
    const counts = topology.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));
  }, [topology]);

  const versionDistribution = useMemo(() => {
    if (!topology) return [];
    const counts = topology.nodes.reduce((acc, node) => {
      acc[node.version] = (acc[node.version] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([version, count]) => ({
      version,
      count,
    })).slice(0, 10); // Top 10 versions
  }, [topology]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // ==================== Render Functions ====================

  const renderNetworkGraph = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Network Topology</Typography>
          <Box>
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterNodeType}
                label="Filter"
                onChange={(e) => setFilterNodeType(e.target.value)}
              >
                <MenuItem value="all">All Nodes</MenuItem>
                <MenuItem value="validator">Validators</MenuItem>
                <MenuItem value="full">Full Nodes</MenuItem>
                <MenuItem value="light">Light Nodes</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Export Topology">
              <IconButton onClick={handleExportTopology}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ height: 600, border: '1px solid #ddd', borderRadius: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            onMove={(_, viewport) => setZoomLevel(viewport.zoom)}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'validator': return '#1976d2';
                  case 'full': return '#2e7d32';
                  case 'light': return '#ed6c02';
                  default: return '#757575';
                }
              }}
            />
            <Panel position="top-left">
              <Paper sx={{ p: 1 }}>
                <Typography variant="caption">
                  Zoom: {(zoomLevel * 100).toFixed(0)}%
                </Typography>
              </Paper>
            </Panel>
            <Panel position="top-right">
              <Paper sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#1976d2', borderRadius: 1 }} />
                  <Typography variant="caption">Validator</Typography>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#2e7d32', borderRadius: 1, ml: 2 }} />
                  <Typography variant="caption">Full</Typography>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ed6c02', borderRadius: 1, ml: 2 }} />
                  <Typography variant="caption">Light</Typography>
                </Box>
              </Paper>
            </Panel>
          </ReactFlow>
        </Box>

        {selectedNode && (
          <Paper sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle1" gutterBottom>
              Node Details: {selectedNode.address}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Chip label={selectedNode.type} size="small" color="primary" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedNode.status}
                  size="small"
                  color={selectedNode.status === 'connected' ? 'success' : 'default'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Latency</Typography>
                <Typography variant="body1">{selectedNode.latency}ms</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Uptime</Typography>
                <Typography variant="body1">{selectedNode.uptime.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Version</Typography>
                <Typography variant="body1">{selectedNode.version}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{selectedNode.location.country}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Bandwidth In</Typography>
                <Typography variant="body1">{(selectedNode.bandwidthIn / 1024).toFixed(2)} KB/s</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Bandwidth Out</Typography>
                <Typography variant="body1">{(selectedNode.bandwidthOut / 1024).toFixed(2)} KB/s</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </CardContent>
    </Card>
  );

  const renderPeerMonitoring = () => (
    <Grid container spacing={3}>
      {/* Connection Statistics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Connection Statistics</Typography>
            {health && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <NetworkCheckIcon sx={{ fontSize: 48, color: '#1976d2' }} />
                    <Typography variant="h4">{health.activePeers}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Peers</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <SpeedIcon sx={{ fontSize: 48, color: '#2e7d32' }} />
                    <Typography variant="h4">{health.avgLatency.toFixed(0)}ms</Typography>
                    <Typography variant="body2" color="text.secondary">Avg Latency</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <RouterIcon sx={{ fontSize: 48, color: '#ed6c02' }} />
                    <Typography variant="h4">{(health.throughput / 1000).toFixed(1)}K</Typography>
                    <Typography variant="body2" color="text.secondary">TPS</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50' }} />
                    <Typography variant="h4">{health.score}</Typography>
                    <Typography variant="body2" color="text.secondary">Health Score</Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Bandwidth Usage */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bandwidth Usage</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="bandwidthIn"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="In (KB/s)"
                />
                <Area
                  type="monotone"
                  dataKey="bandwidthOut"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Out (KB/s)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Peer Version Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Peer Version Distribution</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={versionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="version" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Node Type Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Node Type Distribution</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={nodeTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nodeTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderNetworkStatistics = () => (
    <Grid container spacing={3}>
      {/* Network Health Metrics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Network Health Metrics</Typography>
            {health && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h4" color="primary">{health.totalPeers}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Peers</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                    <Typography variant="h4" color="secondary">{health.blockPropagationTime.toFixed(0)}ms</Typography>
                    <Typography variant="body2" color="text.secondary">Block Propagation</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                    <Typography variant="h4" sx={{ color: '#2e7d32' }}>{health.networkEfficiency.toFixed(1)}%</Typography>
                    <Typography variant="body2" color="text.secondary">Network Efficiency</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                    <Typography variant="h4" sx={{ color: '#e65100' }}>{health.centralizationScore.toFixed(2)}</Typography>
                    <Typography variant="body2" color="text.secondary">Centralization Score</Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Performance Trends</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="connectedPeers"
                  stroke="#8884d8"
                  name="Connected Peers"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgLatency"
                  stroke="#82ca9d"
                  name="Avg Latency (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#ffc658"
                  name="Throughput (TPS)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderGeographicDistribution = () => (
    <Grid container spacing={3}>
      {/* Regional Statistics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Regional Distribution</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Peer Count</TableCell>
                    <TableCell align="right">Avg Latency (ms)</TableCell>
                    <TableCell align="right">Total Bandwidth (KB/s)</TableCell>
                    <TableCell align="right">Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regionStats.map((region) => (
                    <TableRow key={region.region}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PublicIcon fontSize="small" />
                          {region.region}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{region.peerCount}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={region.avgLatency.toFixed(0)}
                          size="small"
                          color={region.avgLatency < 50 ? 'success' : region.avgLatency < 100 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">{(region.totalBandwidth / 1024).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {topology && ((region.peerCount / topology.nodes.length) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Regional Peer Distribution Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Peer Distribution by Region</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="peerCount" fill="#8884d8" name="Peer Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Map Placeholder */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Geographic Network Map</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Interactive world map showing peer locations and connections will be displayed here.
              This requires additional mapping libraries (Leaflet/Mapbox).
            </Alert>
            <Box
              sx={{
                height: 400,
                bgcolor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
              }}
            >
              <PublicIcon sx={{ fontSize: 100, color: '#bdbdbd' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderNetworkEvents = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Network Events Log</Typography>
          <Box>
            <Chip
              label={`${events.length} events`}
              size="small"
              color="primary"
              sx={{ mr: 2 }}
            />
            <Tooltip title="Export to CSV">
              <IconButton onClick={handleExportEvents}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Peer Address</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(event.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        event.type === 'connection' ? <CheckCircleIcon /> :
                        event.type === 'disconnection' ? <ErrorIcon /> :
                        event.type === 'sync' ? <RefreshIcon /> :
                        event.type === 'error' ? <ErrorIcon /> :
                        <WarningIcon />
                      }
                      label={event.type}
                      size="small"
                      color={
                        event.type === 'connection' ? 'success' :
                        event.type === 'disconnection' ? 'error' :
                        event.type === 'sync' ? 'info' :
                        event.type === 'error' ? 'error' :
                        'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {event.peerAddress}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{event.message}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.severity}
                      size="small"
                      color={
                        event.severity === 'high' ? 'error' :
                        event.severity === 'medium' ? 'warning' :
                        'default'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // ==================== Main Render ====================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
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
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Network Topology Visualizer</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto-refresh"
          />
          {autoRefresh && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Interval</InputLabel>
              <Select
                value={refreshInterval}
                label="Interval"
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <MenuItem value={5}>5 seconds</MenuItem>
                <MenuItem value={10}>10 seconds</MenuItem>
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>1 minute</MenuItem>
              </Select>
            </FormControl>
          )}
          <Tooltip title="Refresh Now">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Network Graph" />
          <Tab label="Peer Monitoring" />
          <Tab label="Statistics" />
          <Tab label="Geographic" />
          <Tab label="Events Log" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && renderNetworkGraph()}
      {activeTab === 1 && renderPeerMonitoring()}
      {activeTab === 2 && renderNetworkStatistics()}
      {activeTab === 3 && renderGeographicDistribution()}
      {activeTab === 4 && renderNetworkEvents()}
    </Box>
  );
};

export default NetworkTopologyVisualizer;
