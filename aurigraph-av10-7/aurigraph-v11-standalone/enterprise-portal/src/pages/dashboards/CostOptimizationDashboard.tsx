/**
 * CostOptimizationDashboard.tsx
 * AV11-320: Cost & Resource Optimization Dashboard
 *
 * Enterprise resource management and cost optimization including:
 * - Resource utilization tracking
 * - Cost analysis and projections
 * - Infrastructure efficiency metrics
 * - Optimization recommendations
 * - Carbon footprint monitoring
 */

import React, { useState, useEffect, useCallback } from 'react'
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
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Memory,
  Storage,
  Cloud,
  AttachMoney,
  Speed,
  BatteryChargingFull,
  EmojiObjects,
  CheckCircle,
  Warning,
  Refresh,
  Download,
  Park,
  Eco,
  WaterDrop,
  ElectricBolt,
  Savings,
  Timeline,
  Assessment,
  Lightbulb,
  PriorityHigh,
  ArrowUpward,
  ArrowDownward
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
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { apiService, safeNum, safeArr } from '../../services/api'

// ============================================================================
// TYPES
// ============================================================================

interface ResourceMetrics {
  cpu: {
    usage: number
    allocated: number
    cost: number
    trend: number
  }
  memory: {
    usage: number
    allocated: number
    cost: number
    trend: number
  }
  storage: {
    usage: number
    allocated: number
    cost: number
    trend: number
  }
  network: {
    usage: number
    allocated: number
    cost: number
    trend: number
  }
}

interface CostMetrics {
  totalMonthlyCost: number
  projectedAnnualCost: number
  costSavings: number
  potentialSavings: number
  costTrend: number
  costBreakdown: {
    compute: number
    storage: number
    network: number
    validators: number
    other: number
  }
}

interface CarbonMetrics {
  totalEmissions: number
  netEmissions: number
  offsetCredits: number
  carbonPerTx: number
  sustainabilityScore: number
  meetsTarget: boolean
}

interface OptimizationRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  estimatedSavings: number
  effort: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
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

const SAVINGS_CARD = {
  background: 'linear-gradient(135deg, #0D4A3F 0%, #1A7A5A 100%)',
  border: '1px solid rgba(0,191,165,0.3)',
  borderRadius: 3
}

const COST_CARD = {
  background: 'linear-gradient(135deg, #4A1D3F 0%, #7A3A5A 100%)',
  border: '1px solid rgba(255,107,107,0.3)',
  borderRadius: 3
}

const PRIORITY_COLORS = {
  high: '#FF6B6B',
  medium: '#FFD93D',
  low: '#4ECDC4'
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
)

const ResourceGauge: React.FC<{
  title: string
  usage: number
  allocated: number
  cost: number
  trend: number
  color: string
  icon: React.ReactNode
}> = ({ title, usage, allocated, cost, trend, color, icon }) => {
  const utilizationPercent = (usage / allocated) * 100
  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{title}</Typography>
            <Typography variant="h5" sx={{ color, fontWeight: 700 }}>
              {utilizationPercent.toFixed(1)}%
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 40, height: 40 }}>
            {icon}
          </Avatar>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(utilizationPercent, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.1)',
            mb: 2,
            '& .MuiLinearProgress-bar': {
              bgcolor: utilizationPercent > 80 ? '#FF6B6B' : utilizationPercent > 60 ? '#FFD93D' : color,
              borderRadius: 4
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {usage.toFixed(1)} / {allocated} units
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend >= 0 ? (
              <ArrowUpward sx={{ fontSize: 12, color: '#FF6B6B' }} />
            ) : (
              <ArrowDownward sx={{ fontSize: 12, color: '#00BFA5' }} />
            )}
            <Typography variant="caption" sx={{ color: trend >= 0 ? '#FF6B6B' : '#00BFA5' }}>
              {Math.abs(trend).toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Monthly Cost</Typography>
          <Typography variant="body2" sx={{ color: '#4ECDC4', fontWeight: 600 }}>${cost.toLocaleString()}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CostOptimizationDashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(true)

  const [resources, setResources] = useState<ResourceMetrics>({
    cpu: { usage: 45, allocated: 100, cost: 2400, trend: -5.2 },
    memory: { usage: 62, allocated: 128, cost: 1800, trend: 3.1 },
    storage: { usage: 2.4, allocated: 10, cost: 600, trend: 8.5 },
    network: { usage: 750, allocated: 1000, cost: 900, trend: -2.3 }
  })

  const [costs, setCosts] = useState<CostMetrics>({
    totalMonthlyCost: 5700,
    projectedAnnualCost: 68400,
    costSavings: 1250,
    potentialSavings: 2100,
    costTrend: -3.5,
    costBreakdown: {
      compute: 2400,
      storage: 600,
      network: 900,
      validators: 1200,
      other: 600
    }
  })

  const [carbon, setCarbon] = useState<CarbonMetrics>({
    totalEmissions: 45.68,
    netEmissions: 12.34,
    offsetCredits: 33.34,
    carbonPerTx: 0.015,
    sustainabilityScore: 92,
    meetsTarget: true
  })

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([
    {
      id: 'opt-1',
      priority: 'high',
      category: 'Compute',
      title: 'Right-size validator nodes',
      description: 'Current validator nodes are over-provisioned by 35%. Reducing instance size can save significant costs.',
      estimatedSavings: 840,
      effort: 'low',
      status: 'pending'
    },
    {
      id: 'opt-2',
      priority: 'high',
      category: 'Storage',
      title: 'Enable data compression',
      description: 'Implementing LZ4 compression for transaction data can reduce storage costs by up to 40%.',
      estimatedSavings: 240,
      effort: 'medium',
      status: 'in_progress'
    },
    {
      id: 'opt-3',
      priority: 'medium',
      category: 'Network',
      title: 'Optimize peer connections',
      description: 'Reduce redundant peer connections to decrease network bandwidth usage.',
      estimatedSavings: 180,
      effort: 'low',
      status: 'pending'
    },
    {
      id: 'opt-4',
      priority: 'medium',
      category: 'Compute',
      title: 'Implement auto-scaling',
      description: 'Dynamic scaling based on load can reduce costs during low-traffic periods.',
      estimatedSavings: 480,
      effort: 'high',
      status: 'pending'
    },
    {
      id: 'opt-5',
      priority: 'low',
      category: 'Infrastructure',
      title: 'Use reserved instances',
      description: 'Committing to 1-year reserved instances can provide 30% savings.',
      estimatedSavings: 360,
      effort: 'low',
      status: 'completed'
    }
  ])

  const [costHistory, setCostHistory] = useState<Array<{ date: string; cost: number; savings: number }>>([])

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [carbonData, performanceData] = await Promise.all([
        apiService.getCarbonMetrics(),
        apiService.getAnalyticsPerformance()
      ])

      // Update carbon metrics from API
      setCarbon(prev => ({
        ...prev,
        totalEmissions: safeNum(carbonData.emissions, prev.totalEmissions),
        offsetCredits: safeNum(carbonData.offsets, prev.offsetCredits),
        netEmissions: safeNum(carbonData.netCarbon, prev.netEmissions)
      }))

      // Generate cost history
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const history = []
      for (let i = days; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        history.push({
          date: timeRange === '7d' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${days - i + 1}`,
          cost: costs.totalMonthlyCost / 30 * (0.9 + Math.random() * 0.2),
          savings: costs.costSavings / 30 * (0.8 + Math.random() * 0.4)
        })
      }
      setCostHistory(history)
    } catch (error) {
      console.error('[CostOptimizationDashboard] Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, costs.totalMonthlyCost, costs.costSavings])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Format helpers
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
    return `$${n.toFixed(0)}`
  }

  // Cost breakdown data for pie chart
  const costBreakdownData = [
    { name: 'Compute', value: costs.costBreakdown.compute, color: '#00BFA5' },
    { name: 'Storage', value: costs.costBreakdown.storage, color: '#4ECDC4' },
    { name: 'Network', value: costs.costBreakdown.network, color: '#FFD93D' },
    { name: 'Validators', value: costs.costBreakdown.validators, color: '#9B59B6' },
    { name: 'Other', value: costs.costBreakdown.other, color: '#3498DB' }
  ]

  // Efficiency data for radial chart
  const efficiencyData = [
    { name: 'CPU Efficiency', value: 100 - resources.cpu.usage, fill: '#00BFA5' },
    { name: 'Memory Efficiency', value: 100 - (resources.memory.usage / resources.memory.allocated) * 100, fill: '#4ECDC4' },
    { name: 'Storage Efficiency', value: 100 - (resources.storage.usage / resources.storage.allocated) * 100, fill: '#FFD93D' },
    { name: 'Network Efficiency', value: 100 - (resources.network.usage / resources.network.allocated) * 100, fill: '#9B59B6' }
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Cost & Resource Optimization
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Monitor resource usage, analyze costs, and discover optimization opportunities
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Period</InputLabel>
            <Select
              value={timeRange}
              label="Period"
              onChange={(e) => setTimeRange(e.target.value as any)}
              sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchData} sx={{ color: '#00BFA5' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export report">
            <IconButton sx={{ color: '#4ECDC4' }}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={COST_CARD}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Monthly Cost</Typography>
                  <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700 }}>
                    {formatCurrency(costs.totalMonthlyCost)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    {costs.costTrend < 0 ? (
                      <TrendingDown sx={{ fontSize: 16, color: '#00BFA5' }} />
                    ) : (
                      <TrendingUp sx={{ fontSize: 16, color: '#FF6B6B' }} />
                    )}
                    <Typography variant="body2" sx={{ color: costs.costTrend < 0 ? '#00BFA5' : '#FF6B6B' }}>
                      {Math.abs(costs.costTrend).toFixed(1)}% vs last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', width: 64, height: 64 }}>
                  <AttachMoney sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={SAVINGS_CARD}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Savings Achieved</Typography>
                  <Typography variant="h3" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                    {formatCurrency(costs.costSavings)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                    This month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(0,191,165,0.2)', width: 64, height: 64 }}>
                  <Savings sx={{ fontSize: 32, color: '#00BFA5' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...CARD_STYLE, border: '1px solid rgba(255,217,61,0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Potential Savings</Typography>
                  <Typography variant="h3" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                    {formatCurrency(costs.potentialSavings)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                    {recommendations.filter(r => r.status === 'pending').length} recommendations
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,217,61,0.2)', width: 64, height: 64 }}>
                  <Lightbulb sx={{ fontSize: 32, color: '#FFD93D' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      {/* Resource Gauges */}
      <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Resource Utilization</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <ResourceGauge
            title="CPU"
            usage={resources.cpu.usage}
            allocated={resources.cpu.allocated}
            cost={resources.cpu.cost}
            trend={resources.cpu.trend}
            color="#00BFA5"
            icon={<Speed />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ResourceGauge
            title="Memory"
            usage={resources.memory.usage}
            allocated={resources.memory.allocated}
            cost={resources.memory.cost}
            trend={resources.memory.trend}
            color="#4ECDC4"
            icon={<Memory />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ResourceGauge
            title="Storage (TB)"
            usage={resources.storage.usage}
            allocated={resources.storage.allocated}
            cost={resources.storage.cost}
            trend={resources.storage.trend}
            color="#FFD93D"
            icon={<Storage />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ResourceGauge
            title="Network (Mbps)"
            usage={resources.network.usage}
            allocated={resources.network.allocated}
            cost={resources.network.cost}
            trend={resources.network.trend}
            color="#9B59B6"
            icon={<Cloud />}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Cost Analysis" icon={<AttachMoney />} iconPosition="start" />
          <Tab label="Recommendations" icon={<Lightbulb />} iconPosition="start" />
          <Tab label="Sustainability" icon={<Park />} iconPosition="start" />
          <Tab label="Efficiency" icon={<BatteryChargingFull />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Cost Analysis Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Cost Trend
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={costHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1A1F3A', border: 'none', borderRadius: 8 }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="cost" fill="#FF6B6B" fillOpacity={0.3} stroke="#FF6B6B" name="Cost" />
                    <Bar dataKey="savings" fill="#00BFA5" name="Savings" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Cost Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1A1F3A', border: 'none', borderRadius: 8 }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Stack spacing={1}>
                  {costBreakdownData.map((item) => (
                    <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(item.value)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Recommendations Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Optimization Recommendations
              </Typography>
              <Chip
                label={`Total Savings: ${formatCurrency(recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0))}`}
                sx={{ bgcolor: 'rgba(0,191,165,0.2)', color: '#00BFA5' }}
              />
            </Box>
            <List>
              {recommendations.map((rec) => (
                <ListItem
                  key={rec.id}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: `${PRIORITY_COLORS[rec.priority]}20`,
                        color: PRIORITY_COLORS[rec.priority],
                        width: 36,
                        height: 36
                      }}
                    >
                      {rec.priority === 'high' ? <PriorityHigh /> : rec.priority === 'medium' ? <Warning /> : <CheckCircle />}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>{rec.title}</Typography>
                        <Chip label={rec.category} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                        {rec.description}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                      {formatCurrency(rec.estimatedSavings)}/mo
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={`Effort: ${rec.effort}`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.1)' }}
                      />
                      <Chip
                        label={rec.status}
                        size="small"
                        color={rec.status === 'completed' ? 'success' : rec.status === 'in_progress' ? 'warning' : 'default'}
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Sustainability Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ ...SAVINGS_CARD }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(0,191,165,0.2)', width: 80, height: 80, mx: 'auto', mb: 2 }}>
                    <Park sx={{ fontSize: 40, color: '#00BFA5' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                    {carbon.carbonPerTx.toFixed(3)}g
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    CO2 per Transaction
                  </Typography>
                  <Chip
                    label={carbon.meetsTarget ? 'Below 0.17g Target' : 'Above Target'}
                    sx={{
                      mt: 2,
                      bgcolor: carbon.meetsTarget ? 'rgba(0,191,165,0.2)' : 'rgba(255,107,107,0.2)',
                      color: carbon.meetsTarget ? '#00BFA5' : '#FF6B6B'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Carbon Offset Progress</Typography>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress
                    variant="determinate"
                    value={(carbon.offsetCredits / carbon.totalEmissions) * 100}
                    size={120}
                    thickness={8}
                    sx={{ color: '#00BFA5' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                      {((carbon.offsetCredits / carbon.totalEmissions) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Offset</Typography>
                  </Box>
                </Box>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Emissions</Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>{carbon.totalEmissions.toFixed(2)} kg CO2</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Offset Credits</Typography>
                    <Typography variant="body2" sx={{ color: '#00BFA5' }}>{carbon.offsetCredits.toFixed(2)} kg CO2</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Net Emissions</Typography>
                    <Typography variant="body2" sx={{ color: carbon.netEmissions <= 0 ? '#00BFA5' : '#FFD93D' }}>
                      {carbon.netEmissions.toFixed(2)} kg CO2
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Sustainability Score</Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h2" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                    {carbon.sustainabilityScore}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>out of 100</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={carbon.sustainabilityScore}
                    sx={{
                      mt: 2,
                      height: 12,
                      borderRadius: 6,
                      bgcolor: 'rgba(0,191,165,0.2)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5', borderRadius: 6 }
                    }}
                  />
                </Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Alert severity="success" sx={{ bgcolor: 'rgba(0,191,165,0.1)' }}>
                  1750x more efficient than Bitcoin network
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Efficiency Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Resource Efficiency
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={efficiencyData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                      background
                      dataKey="value"
                    />
                    <Legend
                      iconSize={10}
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1A1F3A', border: 'none', borderRadius: 8 }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efficiency']}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Efficiency Metrics
                </Typography>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Overall Efficiency</Typography>
                      <Typography variant="body2" sx={{ color: '#00BFA5', fontWeight: 600 }}>
                        {((efficiencyData.reduce((sum, d) => sum + d.value, 0) / efficiencyData.length)).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={efficiencyData.reduce((sum, d) => sum + d.value, 0) / efficiencyData.length}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(0,191,165,0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5', borderRadius: 5 }
                      }}
                    />
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  {efficiencyData.map((item) => (
                    <Box key={item.name}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</Typography>
                        <Typography variant="body2" sx={{ color: item.fill, fontWeight: 600 }}>{item.value.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.value}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: item.fill, borderRadius: 3 }
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
    </Box>
  )
}
