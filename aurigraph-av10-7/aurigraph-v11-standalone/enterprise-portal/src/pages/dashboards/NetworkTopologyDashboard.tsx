/**
 * NetworkTopologyDashboard.tsx
 * AV11-319: Network Topology Dashboard
 *
 * Interactive network topology visualization showing:
 * - Node connections and status
 * - Real-time network health
 * - Latency between nodes
 * - Geographic distribution
 * - Network performance metrics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tab,
  Tabs,
  Stack,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Badge,
  Divider,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Hub,
  Dns,
  Cloud,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  NetworkCheck,
  Speed,
  Storage,
  Timeline,
  Visibility,
  VisibilityOff,
  AccountTree,
  Language,
  SignalCellularAlt
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import { apiService, safeNum, safeArr } from '../../services/api'
import { fetchNetworkTopology, getNetworkStats, Node, Edge, NetworkTopologyData } from '../../services/NetworkTopologyService'

// ============================================================================
// TYPES
// ============================================================================

interface NetworkMetrics {
  totalNodes: number
  activeNodes: number
  validators: number
  businessNodes: number
  eiNodes: number
  avgLatency: number
  minLatency: number
  maxLatency: number
  throughput: number
  connectionHealth: number
  uptimePercentage: number
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// STYLES
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  height: '100%'
}

const TOPOLOGY_CARD = {
  background: 'linear-gradient(135deg, #0D2137 0%, #1A3A5C 100%)',
  border: '1px solid rgba(59,130,246,0.3)',
  borderRadius: 3
}

const NODE_COLORS = {
  validator: '#00BFA5',
  business: '#4ECDC4',
  ei: '#9B59B6',
  active: '#00BFA5',
  inactive: '#FF6B6B',
  syncing: '#FFD93D'
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
)

const NodeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'active' ? 'success' : status === 'syncing' ? 'warning' : 'error'
  return (
    <Chip
      size="small"
      label={status.toUpperCase()}
      color={color}
      sx={{ fontSize: '0.65rem', height: 20 }}
    />
  )
}

const MetricCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: string
  status?: 'good' | 'warning' | 'error'
}> = ({ title, value, subtitle, icon, color = '#00BFA5', status }) => (
  <Card sx={CARD_STYLE}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color, fontWeight: 700, my: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Badge
          variant="dot"
          color={status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'success'}
          sx={{ '& .MuiBadge-dot': { width: 10, height: 10 } }}
        >
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Badge>
      </Box>
    </CardContent>
  </Card>
)

// Simple Network Visualization Component
const NetworkVisualization: React.FC<{
  nodes: Node[]
  edges: Edge[]
  selectedNode: string | null
  onNodeClick: (nodeId: string) => void
}> = ({ nodes, edges, selectedNode, onNodeClick }) => {
  // Create positions for nodes in a circular layout
  const nodePositions = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length
    const radius = 150
    return {
      ...node,
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle)
    }
  })

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 400, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        {/* Edges */}
        {edges.map((edge, idx) => {
          const source = nodePositions.find(n => n.id === edge.source)
          const target = nodePositions.find(n => n.id === edge.target)
          if (!source || !target) return null
          const color = edge.status === 'healthy' ? '#00BFA5' : edge.status === 'degraded' ? '#FFD93D' : '#FF6B6B'
          return (
            <line
              key={`edge-${idx}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.5}
            />
          )
        })}

        {/* Nodes */}
        {nodePositions.map((node) => {
          const color = NODE_COLORS[node.type] || '#4ECDC4'
          const statusColor = NODE_COLORS[node.status] || '#00BFA5'
          const isSelected = selectedNode === node.id
          return (
            <g
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer ring for selected */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={28}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${node.x} ${node.y}`}
                    to={`360 ${node.x} ${node.y}`}
                    dur="10s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Status ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={24}
                fill="none"
                stroke={statusColor}
                strokeWidth={3}
              />
              {/* Main node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={20}
                fill={color}
                fillOpacity={0.9}
              />
              {/* Node type icon placeholder */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize={10}
                fontWeight="bold"
              >
                {node.type.charAt(0).toUpperCase()}
              </text>
              {/* Node label */}
              <text
                x={node.x}
                y={node.y + 40}
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize={9}
              >
                {node.name || node.id.slice(0, 8)}
              </text>
            </g>
          )
        })}

        {/* Center legend */}
        <text x={200} y={190} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>
          Network Topology
        </text>
        <text x={200} y={205} textAnchor="middle" fill="#00BFA5" fontSize={12} fontWeight="bold">
          {nodes.length} Nodes
        </text>
        <text x={200} y={220} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>
          {edges.length} Connections
        </text>
      </svg>
    </Box>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NetworkTopologyDashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    totalNodes: 0,
    activeNodes: 0,
    validators: 0,
    businessNodes: 0,
    eiNodes: 0,
    avgLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    throughput: 0,
    connectionHealth: 0,
    uptimePercentage: 0
  })
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; latency: number; throughput: number }>>([])

  // Fetch network topology
  const fetchTopology = useCallback(async () => {
    try {
      // Try to get real data from API
      let topologyData: NetworkTopologyData | null = null
      try {
        topologyData = await fetchNetworkTopology()
      } catch (e) {
        console.warn('[NetworkTopologyDashboard] API unavailable, using mock data')
      }

      // Also fetch from main API service
      const [networkHealth, networkStats] = await Promise.all([
        apiService.getNetworkHealth(),
        apiService.getNetworkStats()
      ])

      // Use API data or generate mock data
      const nodeList: Node[] = topologyData?.nodes || [
        { id: 'validator-1', type: 'validator', name: 'Validator Node 1', ip: '10.0.1.1', port: 9003, status: 'active', uptime: 99.9, peersConnected: 8, lastUpdate: new Date().toISOString() },
        { id: 'validator-2', type: 'validator', name: 'Validator Node 2', ip: '10.0.1.2', port: 9003, status: 'active', uptime: 99.8, peersConnected: 7, lastUpdate: new Date().toISOString() },
        { id: 'validator-3', type: 'validator', name: 'Validator Node 3', ip: '10.0.1.3', port: 9003, status: 'active', uptime: 99.7, peersConnected: 8, lastUpdate: new Date().toISOString() },
        { id: 'business-1', type: 'business', name: 'Business Node 1', ip: '10.0.2.1', port: 9003, status: 'active', uptime: 99.5, peersConnected: 5, lastUpdate: new Date().toISOString() },
        { id: 'business-2', type: 'business', name: 'Business Node 2', ip: '10.0.2.2', port: 9003, status: 'syncing', uptime: 95.0, peersConnected: 4, lastUpdate: new Date().toISOString() },
        { id: 'ei-1', type: 'ei', name: 'EI Node 1', ip: '10.0.3.1', port: 9003, status: 'active', uptime: 99.9, peersConnected: 6, lastUpdate: new Date().toISOString() },
        { id: 'ei-2', type: 'ei', name: 'EI Node 2', ip: '10.0.3.2', port: 9003, status: 'active', uptime: 99.8, peersConnected: 5, lastUpdate: new Date().toISOString() }
      ]

      const edgeList: Edge[] = topologyData?.edges || [
        { source: 'validator-1', target: 'validator-2', latency: 5, bandwidth: 1000, status: 'healthy' },
        { source: 'validator-1', target: 'validator-3', latency: 7, bandwidth: 1000, status: 'healthy' },
        { source: 'validator-2', target: 'validator-3', latency: 6, bandwidth: 1000, status: 'healthy' },
        { source: 'validator-1', target: 'business-1', latency: 12, bandwidth: 500, status: 'healthy' },
        { source: 'validator-2', target: 'business-2', latency: 15, bandwidth: 500, status: 'degraded' },
        { source: 'validator-3', target: 'ei-1', latency: 10, bandwidth: 800, status: 'healthy' },
        { source: 'business-1', target: 'ei-2', latency: 18, bandwidth: 400, status: 'healthy' },
        { source: 'ei-1', target: 'ei-2', latency: 8, bandwidth: 600, status: 'healthy' }
      ]

      setNodes(nodeList)
      setEdges(edgeList)

      // Calculate metrics
      const activeNodes = nodeList.filter(n => n.status === 'active').length
      const validators = nodeList.filter(n => n.type === 'validator').length
      const businessNodes = nodeList.filter(n => n.type === 'business').length
      const eiNodes = nodeList.filter(n => n.type === 'ei').length
      const latencies = edgeList.map(e => e.latency)
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0
      const healthyConnections = edgeList.filter(e => e.status === 'healthy').length

      setMetrics({
        totalNodes: nodeList.length,
        activeNodes,
        validators,
        businessNodes,
        eiNodes,
        avgLatency: safeNum(networkStats.avgLatency, avgLatency),
        minLatency: Math.min(...latencies) || 0,
        maxLatency: Math.max(...latencies) || 0,
        throughput: safeNum(networkStats.throughput, 850000),
        connectionHealth: (healthyConnections / edgeList.length) * 100 || 100,
        uptimePercentage: safeNum(networkHealth.uptime, 99.95)
      })

      // Update latency history
      setLatencyHistory(prev => [
        ...prev.slice(-29),
        {
          time: new Date().toLocaleTimeString(),
          latency: avgLatency,
          throughput: Math.random() * 200000 + 700000
        }
      ])

      setIsLoading(false)
    } catch (error) {
      console.error('[NetworkTopologyDashboard] Error fetching topology:', error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTopology()
    if (autoRefresh) {
      const interval = setInterval(fetchTopology, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchTopology, autoRefresh])

  // Get selected node details
  const selectedNodeDetails = selectedNode ? nodes.find(n => n.id === selectedNode) : null
  const selectedNodeEdges = selectedNode ? edges.filter(e => e.source === selectedNode || e.target === selectedNode) : []

  // Node distribution for pie chart
  const nodeDistribution = [
    { name: 'Validators', value: metrics.validators, color: NODE_COLORS.validator },
    { name: 'Business', value: metrics.businessNodes, color: NODE_COLORS.business },
    { name: 'EI Nodes', value: metrics.eiNodes, color: NODE_COLORS.ei }
  ]

  // Node health radar data
  const healthRadarData = nodes.slice(0, 6).map(node => ({
    node: node.name || node.id.slice(0, 8),
    uptime: node.uptime,
    peers: node.peersConnected * 10,
    status: node.status === 'active' ? 100 : node.status === 'syncing' ? 60 : 20
  }))

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Network Topology Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Real-time network visualization, node health, and connectivity metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="success"
              />
            }
            label="Auto Refresh"
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchTopology} sx={{ color: '#00BFA5' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Total Nodes"
            value={metrics.totalNodes}
            subtitle={`${metrics.activeNodes} active`}
            icon={<Hub />}
            color="#00BFA5"
            status={metrics.activeNodes === metrics.totalNodes ? 'good' : 'warning'}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Validators"
            value={metrics.validators}
            subtitle="Consensus nodes"
            icon={<Dns />}
            color="#4ECDC4"
            status="good"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Avg Latency"
            value={`${metrics.avgLatency.toFixed(1)}ms`}
            subtitle={`Max: ${metrics.maxLatency}ms`}
            icon={<Speed />}
            color={metrics.avgLatency < 50 ? '#00BFA5' : '#FFD93D'}
            status={metrics.avgLatency < 50 ? 'good' : 'warning'}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Throughput"
            value={`${(metrics.throughput / 1000).toFixed(0)}K TPS`}
            subtitle="Network capacity"
            icon={<SignalCellularAlt />}
            color="#9B59B6"
            status="good"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Connection Health"
            value={`${metrics.connectionHealth.toFixed(1)}%`}
            subtitle="Healthy links"
            icon={<NetworkCheck />}
            color={metrics.connectionHealth > 95 ? '#00BFA5' : '#FFD93D'}
            status={metrics.connectionHealth > 95 ? 'good' : 'warning'}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <MetricCard
            title="Uptime"
            value={`${metrics.uptimePercentage.toFixed(2)}%`}
            subtitle="Network availability"
            icon={<Timeline />}
            color="#00BFA5"
            status="good"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Topology" icon={<AccountTree />} iconPosition="start" />
          <Tab label="Nodes" icon={<Dns />} iconPosition="start" />
          <Tab label="Performance" icon={<Speed />} iconPosition="start" />
          <Tab label="Health" icon={<NetworkCheck />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Topology Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={TOPOLOGY_CARD}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    Network Graph
                  </Typography>
                  <Box>
                    <Tooltip title="Toggle labels">
                      <IconButton onClick={() => setShowLabels(!showLabels)} sx={{ color: '#4ECDC4' }}>
                        {showLabels ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Center view">
                      <IconButton sx={{ color: '#4ECDC4' }}>
                        <CenterFocusStrong />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <NetworkVisualization
                  nodes={nodes}
                  edges={edges}
                  selectedNode={selectedNode}
                  onNodeClick={setSelectedNode}
                />
                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: NODE_COLORS.validator }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Validator</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: NODE_COLORS.business }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Business</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: NODE_COLORS.ei }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>EI Node</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  {selectedNodeDetails ? 'Node Details' : 'Select a Node'}
                </Typography>
                {selectedNodeDetails ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Name</Typography>
                      <Typography variant="h6" sx={{ color: '#00BFA5' }}>{selectedNodeDetails.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Type</Typography>
                        <Typography sx={{ color: '#fff' }}>{selectedNodeDetails.type}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <NodeStatusBadge status={selectedNodeDetails.status} />
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>IP Address</Typography>
                        <Typography sx={{ color: '#fff' }}>{selectedNodeDetails.ip}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Port</Typography>
                        <Typography sx={{ color: '#fff' }}>{selectedNodeDetails.port}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Uptime</Typography>
                        <Typography sx={{ color: '#00BFA5' }}>{selectedNodeDetails.uptime}%</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Peers</Typography>
                        <Typography sx={{ color: '#4ECDC4' }}>{selectedNodeDetails.peersConnected}</Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Connections ({selectedNodeEdges.length})
                    </Typography>
                    {selectedNodeEdges.map((edge, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {edge.source === selectedNode ? edge.target : edge.source}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#4ECDC4' }}>{edge.latency}ms</Typography>
                          <Chip
                            size="small"
                            label={edge.status}
                            color={edge.status === 'healthy' ? 'success' : edge.status === 'degraded' ? 'warning' : 'error'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(0,176,255,0.1)' }}>
                    Click on a node in the topology graph to view its details
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Nodes Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              All Network Nodes ({nodes.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Name</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Type</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>IP Address</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Uptime</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Peers</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Last Update</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow
                    key={node.id}
                    hover
                    onClick={() => setSelectedNode(node.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: selectedNode === node.id ? 'rgba(0,191,165,0.1)' : 'transparent'
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{node.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={node.type}
                        size="small"
                        sx={{
                          bgcolor: `${NODE_COLORS[node.type]}20`,
                          color: NODE_COLORS[node.type],
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <NodeStatusBadge status={node.status} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{node.ip}:{node.port}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={node.uptime}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                          color={node.uptime > 99 ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" sx={{ color: '#00BFA5' }}>{node.uptime}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#4ECDC4' }}>{node.peersConnected}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(node.lastUpdate).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Network Latency Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={latencyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" unit="ms" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1A1F3A', border: 'none', borderRadius: 8 }}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} name="Latency" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Connection Quality
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {edges.slice(0, 5).map((edge, idx) => (
                    <Box key={idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {edge.source} - {edge.target}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#4ECDC4' }}>{edge.latency}ms</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, 100 - edge.latency * 2)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(78,205,196,0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: edge.status === 'healthy' ? '#00BFA5' : '#FFD93D',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Health Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Node Health Radar
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={healthRadarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="node" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#666' }} />
                    <Radar name="Uptime" dataKey="uptime" stroke="#00BFA5" fill="#00BFA5" fillOpacity={0.3} />
                    <Radar name="Peers" dataKey="peers" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Network Summary
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(0,191,165,0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>{metrics.activeNodes}/{metrics.totalNodes}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Active Nodes</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(78,205,196,0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>{edges.length}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Connections</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(155,89,182,0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#9B59B6', fontWeight: 700 }}>{metrics.avgLatency.toFixed(0)}ms</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Avg Latency</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,217,61,0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>{metrics.uptimePercentage.toFixed(2)}%</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Network Uptime</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
}
