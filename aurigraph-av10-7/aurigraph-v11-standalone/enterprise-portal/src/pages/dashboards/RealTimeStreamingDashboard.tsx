/**
 * RealTimeStreamingDashboard.tsx
 * Real-time dashboard powered by gRPC-Web streaming
 *
 * Demonstrates the use of new gRPC hooks for live data updates:
 * - useMetricsGrpc: System performance metrics
 * - useConsensusGrpc: HyperRAFT++ consensus state
 * - useValidatorGrpc: Validator status and health
 * - useNetworkGrpc: Network topology and peer connections
 * - useTransactionGrpc: Live transaction feed
 */

import React, { useState } from 'react'
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
  Divider,
  Alert,
  Tab,
  Tabs,
  Badge,
  Stack
} from '@mui/material'
import {
  Speed,
  Memory,
  People,
  AccountTree,
  Receipt,
  CheckCircle,
  Error,
  Warning,
  TrendingUp,
  NetworkCheck
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Import gRPC streaming hooks
import { useMetricsGrpc } from '../../grpc/hooks/useMetricsGrpc'
import { useConsensusGrpc } from '../../grpc/hooks/useConsensusGrpc'
import { useValidatorGrpc } from '../../grpc/hooks/useValidatorGrpc'
import { useNetworkGrpc } from '../../grpc/hooks/useNetworkGrpc'
import { useTransactionGrpc } from '../../grpc/hooks/useTransactionGrpc'
import StreamingStatusPanel from '../../components/StreamingStatusPanel'

// ============================================================================
// TYPES
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
)

const MetricCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'stable'
}> = ({ title, value, subtitle, icon, color = '#00BFA5', trend }) => (
  <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color, fontWeight: 700, my: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
      </Box>
      {trend && (
        <Box sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}
            color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
)

const ConnectionStatus: React.FC<{ connected: boolean; reconnecting: boolean; name: string }> = ({
  connected,
  reconnecting,
  name
}) => (
  <Chip
    size="small"
    label={name}
    icon={reconnecting ? <Warning fontSize="small" /> : connected ? <CheckCircle fontSize="small" /> : <Error fontSize="small" />}
    color={reconnecting ? 'warning' : connected ? 'success' : 'error'}
    variant="outlined"
    sx={{ mr: 0.5, mb: 0.5 }}
  />
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RealTimeStreamingDashboard() {
  const [activeTab, setActiveTab] = useState(0)

  // Connect to all gRPC streams
  const metrics = useMetricsGrpc({ updateIntervalMs: 1000 })
  const consensus = useConsensusGrpc({ updateIntervalMs: 500 })
  const validators = useValidatorGrpc({ updateIntervalMs: 2000 })
  const network = useNetworkGrpc({ updateIntervalMs: 3000 })
  const transactions = useTransactionGrpc({ updateIntervalMs: 1000, maxTransactions: 50 })

  // Format helpers
  const formatNumber = (n: number | undefined | null) => {
    if (n === undefined || n === null) return '0'
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toFixed(0)
  }

  const formatPercent = (n: number | undefined | null) => {
    if (n === undefined || n === null) return '0%'
    return `${n.toFixed(1)}%`
  }

  const formatLatency = (ms: number | undefined | null) => {
    if (ms === undefined || ms === null) return '0ms'
    return `${ms.toFixed(0)}ms`
  }

  // Build TPS history for chart
  const tpsHistory = metrics.metricsHistory.slice(-30).map((m, i) => ({
    time: i,
    tps: m.currentTPS,
    cpu: m.cpuUsage,
    memory: m.memoryUsage
  }))

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Real-Time Streaming Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Live data powered by gRPC-Web streaming (HTTP/2 + Protobuf)
        </Typography>

        {/* Connection Status Bar */}
        <Box sx={{ mt: 2 }}>
          <ConnectionStatus connected={metrics.isConnected} reconnecting={metrics.isReconnecting} name="Metrics" />
          <ConnectionStatus connected={consensus.isConnected} reconnecting={consensus.isReconnecting} name="Consensus" />
          <ConnectionStatus connected={validators.isConnected} reconnecting={validators.isReconnecting} name="Validators" />
          <ConnectionStatus connected={network.isConnected} reconnecting={network.isReconnecting} name="Network" />
          <ConnectionStatus connected={transactions.isConnected} reconnecting={transactions.isReconnecting} name="Transactions" />
        </Box>
      </Box>

      {/* Streaming Status Panel */}
      <StreamingStatusPanel compact={false} showControls={true} />

      {/* Key Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Current TPS"
            value={formatNumber(metrics.metrics?.currentTPS)}
            subtitle="Transactions per second"
            icon={<Speed fontSize="large" />}
            color="#00BFA5"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Validators"
            value={`${validators.activeCount}/${validators.totalCount}`}
            subtitle="Participating in consensus"
            icon={<People fontSize="large" />}
            color="#7C4DFF"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Connected Peers"
            value={formatNumber(network.connectedPeers.length)}
            subtitle={`Avg latency: ${formatLatency(network.metrics?.averageLatency)}`}
            icon={<AccountTree fontSize="large" />}
            color="#FF6D00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Transactions"
            value={transactions.pendingTransactions.length}
            subtitle={`Total: ${transactions.transactionCount}`}
            icon={<Receipt fontSize="large" />}
            color="#00B0FF"
          />
        </Grid>
      </Grid>

      {/* Tabs for detailed views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Performance" icon={<TrendingUp />} iconPosition="start" />
          <Tab
            label={
              <Badge badgeContent={consensus.recentEvents.length} color="primary" max={99}>
                Consensus
              </Badge>
            }
            icon={<NetworkCheck />}
            iconPosition="start"
          />
          <Tab label="Validators" icon={<People />} iconPosition="start" />
          <Tab label="Network" icon={<AccountTree />} iconPosition="start" />
          <Tab
            label={
              <Badge badgeContent={transactions.newTransactions.length} color="success" max={99}>
                Transactions
              </Badge>
            }
            icon={<Receipt />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Performance Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  TPS Over Time (Live)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tpsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1F3A', border: 'none' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="tps" stroke="#00BFA5" fill="#00BFA5" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Resources
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2">{formatPercent(metrics.metrics?.cpuUsage)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.metrics?.cpuUsage || 0}
                      color={metrics.metrics?.cpuUsage && metrics.metrics.cpuUsage > 80 ? 'error' : 'primary'}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Memory Usage</Typography>
                      <Typography variant="body2">{formatPercent(metrics.metrics?.memoryUsage)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.metrics?.memoryUsage || 0}
                      color={metrics.metrics?.memoryUsage && metrics.metrics.memoryUsage > 80 ? 'error' : 'secondary'}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Error Rate</Typography>
                      <Typography variant="body2">{formatPercent(metrics.metrics?.errorRate)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.metrics?.errorRate || 0}
                      color={metrics.metrics?.errorRate && metrics.metrics.errorRate > 1 ? 'error' : 'success'}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Consensus Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Consensus State
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Role:</Typography>
                    <Chip
                      label={consensus.consensusState?.state || 'Unknown'}
                      color={consensus.consensusState?.state === 'LEADER' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Current Leader:</Typography>
                    <Typography>{consensus.consensusState?.currentLeader || 'None'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Term:</Typography>
                    <Typography>{consensus.consensusState?.term || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Health:</Typography>
                    <Chip
                      label={consensus.consensusState?.consensusHealth || 'Unknown'}
                      color={consensus.consensusState?.consensusHealth === 'OPTIMAL' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Active Validators:</Typography>
                    <Typography>
                      {consensus.consensusState?.activeValidators}/{consensus.consensusState?.totalValidators}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Consensus Events
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consensus.recentEvents.slice(0, 10).map((event, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={event.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{event.description}</TableCell>
                        <TableCell>{new Date(event.timestamp).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                    {consensus.recentEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No recent events
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Validators Tab */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Validator Status ({validators.activeCount} active / {validators.totalCount} total)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Voting Power</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validators.validators.slice(0, 15).map((validator) => (
                  <TableRow key={validator.id}>
                    <TableCell>{validator.name || validator.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip
                        label={validator.status}
                        color={validator.status === 'ACTIVE' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{validator.votingPower.toFixed(2)}%</TableCell>
                    <TableCell>{validator.uptime.toFixed(1)}%</TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={validator.performanceScore || 0}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {validators.validators.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Waiting for validator data...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Network Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Metrics
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Total Peers:</Typography>
                    <Typography>{network.metrics?.totalPeers || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Connected:</Typography>
                    <Typography color="success.main">{network.metrics?.connectedPeers || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Disconnected:</Typography>
                    <Typography color="error.main">{network.metrics?.disconnectedPeers || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Avg Latency:</Typography>
                    <Typography>{formatLatency(network.metrics?.averageLatency)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Network Health:</Typography>
                    <Chip
                      label={network.metrics?.networkHealth || 'Unknown'}
                      color={network.metrics?.networkHealth === 'HEALTHY' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connected Peers ({network.connectedPeers.length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Peer ID</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Latency</TableCell>
                      <TableCell>Quality</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {network.connectedPeers.slice(0, 10).map((peer) => (
                      <TableRow key={peer.id}>
                        <TableCell>{peer.id.slice(0, 12)}...</TableCell>
                        <TableCell>{peer.address}</TableCell>
                        <TableCell>{peer.latency}ms</TableCell>
                        <TableCell>
                          <Chip
                            label={peer.connectionQuality}
                            size="small"
                            color={peer.connectionQuality === 'EXCELLENT' ? 'success' : peer.connectionQuality === 'GOOD' ? 'primary' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {network.connectedPeers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Waiting for peer data...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Transactions Tab */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Live Transaction Feed
              </Typography>
              <Box>
                <Chip label={`Pending: ${transactions.pendingTransactions.length}`} color="warning" size="small" sx={{ mr: 1 }} />
                <Chip label={`Success: ${transactions.successfulTransactions.length}`} color="success" size="small" sx={{ mr: 1 }} />
                <Chip label={`Failed: ${transactions.failedTransactions.length}`} color="error" size="small" />
              </Box>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hash</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.transactions.slice(0, 20).map((tx) => (
                  <TableRow key={tx.hash} sx={{ bgcolor: tx.isNew ? 'action.hover' : 'transparent' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {tx.isNew && <Chip label="NEW" size="small" color="success" sx={{ fontSize: '0.6rem', height: 16 }} />}
                        {tx.hash.slice(0, 10)}...
                      </Box>
                    </TableCell>
                    <TableCell>{tx.from.slice(0, 8)}...</TableCell>
                    <TableCell>{tx.to.slice(0, 8)}...</TableCell>
                    <TableCell>{tx.value}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        size="small"
                        color={tx.status === 'SUCCESS' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
                {transactions.transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Waiting for transactions...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  )
}
