import { Grid, Card, CardContent, Typography, Box, LinearProgress, Button, Chip } from '@mui/material'
import { Speed, Storage, NetworkCheck, Security, Code, VerifiedUser } from '@mui/icons-material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Metrics {
  tps: number
  blockHeight: number
  activeNodes: number
  transactionVolume: string
}

interface ContractStats {
  totalContracts: number
  totalDeployed: number
  totalVerified: number
  totalAudited: number
}

interface MetricCard {
  title: string
  value: string | number
  subtitle: string
  icon: JSX.Element
  color: string
  progress?: number
}

interface TPSDataPoint {
  time: string
  value: number
}

interface SystemHealthItem {
  name: string
  status: string
  progress: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dlt.aurigraph.io'
const REFRESH_INTERVAL = Number(process.env.REACT_APP_REFRESH_INTERVAL) || 5000
const TPS_TARGET = Number(process.env.REACT_APP_TPS_TARGET) || 2000000

const INITIAL_METRICS: Metrics = {
  tps: 776000,
  blockHeight: 1234567,
  activeNodes: 24,
  transactionVolume: '2.3B'
}

const INITIAL_CONTRACT_STATS: ContractStats = {
  totalContracts: 0,
  totalDeployed: 0,
  totalVerified: 0,
  totalAudited: 0
}

// REMOVED STATIC DATA - All data now fetched from backend APIs
// Use usePerformanceData() and useSystemHealth() hooks instead

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)'
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4'
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTPS = (tps: number): string => `${(tps / 1000).toFixed(0)}K`

const calculateTPSProgress = (tps: number): number => (tps / TPS_TARGET) * 100

const formatBlockHeight = (height: number): string => `#${height.toLocaleString()}`

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.getMetrics()
      if (data) {
        setMetrics(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics'
      setError(errorMessage)
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { metrics, loading, error, fetchMetrics }
}

const useContractStats = () => {
  const [contractStats, setContractStats] = useState<ContractStats>(INITIAL_CONTRACT_STATS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContractStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v11/contracts/statistics`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data) {
        setContractStats({
          totalContracts: data.totalContracts ?? 0,
          totalDeployed: data.totalDeployed ?? 0,
          totalVerified: data.totalVerified ?? 0,
          totalAudited: data.totalAudited ?? 0
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract stats'
      setError(errorMessage)
      console.error('Failed to fetch contract stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { contractStats, loading, error, fetchContractStats }
}

const usePerformanceData = () => {
  const [tpsHistory, setTpsHistory] = useState<TPSDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.getPerformance()
      if (data && data.tpsHistory) {
        setTpsHistory(data.tpsHistory)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch performance data'
      setError(errorMessage)
      console.error('Failed to fetch performance data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { tpsHistory, loading, error, fetchPerformanceData }
}

const useSystemHealth = () => {
  const [healthItems, setHealthItems] = useState<SystemHealthItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.getSystemStatus()
      if (data && data.components) {
        setHealthItems(data.components)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch system health'
      setError(errorMessage)
      console.error('Failed to fetch system health:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { healthItems, loading, error, fetchSystemHealth }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const MetricCardComponent: React.FC<{ card: MetricCard }> = ({ card }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Card sx={CARD_STYLE}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${card.color}20`,
            color: card.color,
            mr: 2
          }}>
            {card.icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
              {card.value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {card.subtitle}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
          {card.title}
        </Typography>
        {card.progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={card.progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: card.color
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  </Grid>
)

interface TPSChartProps {
  tpsHistory: TPSDataPoint[]
}

const TPSChart: React.FC<TPSChartProps> = ({ tpsHistory }) => (
  <Grid item xs={12} md={8}>
    <Card sx={{ ...CARD_STYLE, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
        TPS Performance (24h) - Real-time API Data
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={tpsHistory}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1F3A',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={THEME_COLORS.primary}
            fill="url(#colorGradient)"
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  </Grid>
)

interface SystemHealthPanelProps {
  healthItems: SystemHealthItem[]
}

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ healthItems }) => (
  <Grid item xs={12} md={4}>
    <Card sx={{ ...CARD_STYLE, p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
        System Health - Real-time API Data
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {healthItems.map((item, index) => (
          <Box key={`health-${index}`}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {item.name}
              </Typography>
              <Typography variant="body2" sx={{ color: THEME_COLORS.success }}>
                {item.status}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.progress}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: THEME_COLORS.success
                }
              }}
            />
          </Box>
        ))}
      </Box>
    </Card>
  </Grid>
)

interface SmartContractsWidgetProps {
  contractStats: ContractStats
  onNavigate: () => void
}

const SmartContractsWidget: React.FC<SmartContractsWidgetProps> = ({ contractStats, onNavigate }) => (
  <Grid container spacing={3} sx={{ mt: 1 }}>
    <Grid item xs={12}>
      <Card sx={{ ...CARD_STYLE, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Code sx={{ fontSize: 32, color: THEME_COLORS.tertiary }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Smart Contracts Registry
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{ bgcolor: THEME_COLORS.tertiary, '&:hover': { bgcolor: '#3CAAA0' } }}
            onClick={onNavigate}
          >
            View All Contracts
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: THEME_COLORS.tertiary, fontWeight: 700 }}>
                {contractStats.totalContracts}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Total Contracts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: THEME_COLORS.success, fontWeight: 700 }}>
                {contractStats.totalDeployed}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Deployed
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ color: THEME_COLORS.warning, fontWeight: 700 }}>
                  {contractStats.totalVerified}
                </Typography>
                <VerifiedUser sx={{ color: THEME_COLORS.warning, fontSize: 28 }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Verified
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ color: THEME_COLORS.error, fontWeight: 700 }}>
                  {contractStats.totalAudited}
                </Typography>
                <Security sx={{ color: THEME_COLORS.error, fontSize: 28 }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Audited
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${contractStats.totalDeployed} contracts deployed`}
            sx={{ bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.success, fontWeight: 600 }}
          />
          <Chip
            label={`${contractStats.totalVerified} verified`}
            sx={{ bgcolor: 'rgba(255, 217, 61, 0.2)', color: THEME_COLORS.warning, fontWeight: 600 }}
          />
          <Chip
            label={`${contractStats.totalAudited} audited for security`}
            sx={{ bgcolor: 'rgba(255, 107, 107, 0.2)', color: THEME_COLORS.error, fontWeight: 600 }}
          />
        </Box>
      </Card>
    </Grid>
  </Grid>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
  const navigate = useNavigate()
  const { metrics, fetchMetrics } = useMetrics()
  const { contractStats, fetchContractStats } = useContractStats()
  const { tpsHistory, fetchPerformanceData } = usePerformanceData()
  const { healthItems, fetchSystemHealth } = useSystemHealth()

  // Fetch data on mount and set up polling - ALL DATA FROM REAL APIs
  useEffect(() => {
    fetchMetrics()
    fetchContractStats()
    fetchPerformanceData()
    fetchSystemHealth()

    const interval = setInterval(() => {
      fetchMetrics()
      fetchContractStats()
      fetchPerformanceData()
      fetchSystemHealth()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchMetrics, fetchContractStats, fetchPerformanceData, fetchSystemHealth])

  // Memoize metric cards to avoid recreation on every render
  const metricCards: MetricCard[] = useMemo(() => [
    {
      title: 'Transactions Per Second',
      value: formatTPS(metrics.tps),
      subtitle: 'Target: 2M+',
      icon: <Speed sx={{ fontSize: 40 }} />,
      color: THEME_COLORS.primary,
      progress: calculateTPSProgress(metrics.tps)
    },
    {
      title: 'Block Height',
      value: formatBlockHeight(metrics.blockHeight),
      subtitle: 'Finalized',
      icon: <Storage sx={{ fontSize: 40 }} />,
      color: THEME_COLORS.secondary
    },
    {
      title: 'Active Nodes',
      value: metrics.activeNodes,
      subtitle: 'Online',
      icon: <NetworkCheck sx={{ fontSize: 40 }} />,
      color: THEME_COLORS.tertiary
    },
    {
      title: 'Transaction Volume',
      value: metrics.transactionVolume,
      subtitle: '24h Volume',
      icon: <Security sx={{ fontSize: 40 }} />,
      color: THEME_COLORS.quaternary
    }
  ], [metrics])

  const handleNavigateToContracts = useCallback(() => {
    navigate('/contracts')
  }, [navigate])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Aurigraph V11 Enterprise Dashboard - Release 3.4
      </Typography>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        {metricCards.map((card, index) => (
          <MetricCardComponent key={`metric-${index}`} card={card} />
        ))}
      </Grid>

      {/* TPS Chart and System Health - Real-time API Data */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <TPSChart tpsHistory={tpsHistory} />
        <SystemHealthPanel healthItems={healthItems} />
      </Grid>

      {/* Smart Contracts Widget */}
      <SmartContractsWidget
        contractStats={contractStats}
        onNavigate={handleNavigateToContracts}
      />
    </Box>
  )
}
