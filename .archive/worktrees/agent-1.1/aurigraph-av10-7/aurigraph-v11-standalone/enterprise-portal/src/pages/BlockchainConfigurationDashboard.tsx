import { useState, useEffect, useCallback } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  Settings,
  Save,
  Refresh,
  Info,
  Warning,
  CheckCircle,
  Edit,
  Delete,
  Add,
  Security,
  Speed,
  Storage,
  NetworkCheck,
  RestartAlt,
  ContentCopy,
  CloudSync,
} from '@mui/icons-material'
import { apiService, safeApiCall } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface NetworkConfig {
  networkId: string
  networkName: string
  consensusType: string
  blockTime: number
  maxBlockSize: number
  maxTransactionsPerBlock: number
  genesisTimestamp: number
  chainId: string
}

interface NodeConfig {
  nodeId: string
  nodeType: 'validator' | 'full' | 'light'
  p2pPort: number
  rpcPort: number
  grpcPort: number
  maxConnections: number
  enableMetrics: boolean
  enableDebugLogging: boolean
}

interface ConsensusConfig {
  consensusAlgorithm: string
  targetTPS: number
  batchSize: number
  parallelThreads: number
  leaderElectionTimeout: number
  heartbeatInterval: number
  minValidators: number
  maxValidators: number
  aiOptimizationEnabled: boolean
}

interface SecurityConfig {
  tlsEnabled: boolean
  quantumResistantCrypto: boolean
  encryptionAlgorithm: string
  signatureAlgorithm: string
  keyRotationInterval: number
  maxFailedAttempts: number
  sessionTimeout: number
}

interface PerformanceConfig {
  memoryLimit: number
  cpuLimit: number
  diskIOLimit: number
  networkBandwidthLimit: number
  cacheSize: number
  threadPoolSize: number
  connectionPoolSize: number
}

interface ConfigurationHistory {
  id: string
  timestamp: number
  configType: string
  changes: Record<string, any>
  appliedBy: string
  status: 'applied' | 'pending' | 'failed'
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4',
}

const PIE_COLORS = ['#00BFA5', '#4ECDC4', '#FFD93D', '#FF6B6B', '#9C27B0', '#FF9800']

const CONSENSUS_ALGORITHMS = [
  'HyperRAFT++',
  'PBFT',
  'Tendermint',
  'HotStuff',
  'Streamlet',
]

const ENCRYPTION_ALGORITHMS = [
  'CRYSTALS-Kyber',
  'AES-256-GCM',
  'ChaCha20-Poly1305',
]

const SIGNATURE_ALGORITHMS = [
  'CRYSTALS-Dilithium',
  'ECDSA',
  'EdDSA',
  'RSA-PSS',
]

// ============================================================================
// TAB PANEL COMPONENT
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BlockchainConfigurationDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [configSync, setConfigSync] = useState(true)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  // Configuration states
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    networkId: 'aurigraph-mainnet',
    networkName: 'Aurigraph V11 Mainnet',
    consensusType: 'HyperRAFT++',
    blockTime: 2000,
    maxBlockSize: 10485760,
    maxTransactionsPerBlock: 10000,
    genesisTimestamp: Date.now(),
    chainId: 'aurigraph-v11-1',
  })

  const [nodeConfig, setNodeConfig] = useState<NodeConfig>({
    nodeId: 'node-validator-01',
    nodeType: 'validator',
    p2pPort: 9001,
    rpcPort: 9003,
    grpcPort: 9004,
    maxConnections: 100,
    enableMetrics: true,
    enableDebugLogging: false,
  })

  const [consensusConfig, setConsensusConfig] = useState<ConsensusConfig>({
    consensusAlgorithm: 'HyperRAFT++',
    targetTPS: 2000000,
    batchSize: 10000,
    parallelThreads: 256,
    leaderElectionTimeout: 5000,
    heartbeatInterval: 1000,
    minValidators: 4,
    maxValidators: 100,
    aiOptimizationEnabled: true,
  })

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    tlsEnabled: true,
    quantumResistantCrypto: true,
    encryptionAlgorithm: 'CRYSTALS-Kyber',
    signatureAlgorithm: 'CRYSTALS-Dilithium',
    keyRotationInterval: 86400000,
    maxFailedAttempts: 5,
    sessionTimeout: 3600000,
  })

  const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig>({
    memoryLimit: 4096,
    cpuLimit: 8,
    diskIOLimit: 1000,
    networkBandwidthLimit: 10000,
    cacheSize: 1024,
    threadPoolSize: 256,
    connectionPoolSize: 100,
  })

  const [configHistory, setConfigHistory] = useState<ConfigurationHistory[]>([])

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchConfigurations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: systemConfig, success: configSuccess, error: configError } = await safeApiCall(
        () => apiService.getSystemConfig(),
        {
          network: networkConfig,
          node: nodeConfig,
          consensus: consensusConfig,
          security: securityConfig,
          performance: performanceConfig,
        }
      )

      if (configSuccess && systemConfig) {
        if (systemConfig.network) setNetworkConfig(systemConfig.network)
        if (systemConfig.node) setNodeConfig(systemConfig.node)
        if (systemConfig.consensus) setConsensusConfig(systemConfig.consensus)
        if (systemConfig.security) setSecurityConfig(systemConfig.security)
        if (systemConfig.performance) setPerformanceConfig(systemConfig.performance)
      } else if (configError) {
        console.warn('Using fallback configuration:', configError)
      }
    } catch (err) {
      console.error('Error fetching configurations:', err)
      setError('Failed to fetch configurations. Using default values.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchConfigHistory = useCallback(async () => {
    try {
      // In production, this would fetch from backend
      const mockHistory: ConfigurationHistory[] = [
        {
          id: 'history-1',
          timestamp: Date.now() - 3600000,
          configType: 'consensus',
          changes: { targetTPS: 2000000, parallelThreads: 256 },
          appliedBy: 'admin@aurigraph.io',
          status: 'applied',
        },
        {
          id: 'history-2',
          timestamp: Date.now() - 7200000,
          configType: 'security',
          changes: { quantumResistantCrypto: true },
          appliedBy: 'security@aurigraph.io',
          status: 'applied',
        },
        {
          id: 'history-3',
          timestamp: Date.now() - 10800000,
          configType: 'performance',
          changes: { memoryLimit: 4096, cpuLimit: 8 },
          appliedBy: 'devops@aurigraph.io',
          status: 'applied',
        },
      ]
      setConfigHistory(mockHistory)
    } catch (err) {
      console.error('Error fetching config history:', err)
    }
  }, [])

  useEffect(() => {
    fetchConfigurations()
    fetchConfigHistory()
  }, [fetchConfigurations, fetchConfigHistory])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (unsavedChanges) {
      setConfirmDialogOpen(true)
    } else {
      setActiveTab(newValue)
    }
  }

  const handleSaveConfiguration = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newHistoryEntry: ConfigurationHistory = {
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        configType: ['network', 'node', 'consensus', 'security', 'performance'][activeTab],
        changes: {},
        appliedBy: 'current-user@aurigraph.io',
        status: 'applied',
      }

      setConfigHistory(prev => [newHistoryEntry, ...prev])
      setUnsavedChanges(false)
      setSuccess('Configuration saved successfully!')
    } catch (err) {
      console.error('Error saving configuration:', err)
      setError('Failed to save configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetConfiguration = () => {
    fetchConfigurations()
    setUnsavedChanges(false)
    setSuccess('Configuration reset to server values')
  }

  const handleExportConfiguration = () => {
    const config = {
      network: networkConfig,
      node: nodeConfig,
      consensus: consensusConfig,
      security: securityConfig,
      performance: performanceConfig,
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blockchain-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ============================================================================
  // RENDER: NETWORK CONFIGURATION TAB
  // ============================================================================

  const renderNetworkConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <NetworkCheck sx={{ color: THEME_COLORS.primary }} />
              <Typography variant="h6">Network Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Network ID"
                  value={networkConfig.networkId}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, networkId: e.target.value })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Network Name"
                  value={networkConfig.networkName}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, networkName: e.target.value })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Consensus Type</InputLabel>
                  <Select
                    value={networkConfig.consensusType}
                    onChange={e => {
                      setNetworkConfig({ ...networkConfig, consensusType: e.target.value })
                      setUnsavedChanges(true)
                    }}
                    label="Consensus Type"
                  >
                    {CONSENSUS_ALGORITHMS.map(algo => (
                      <MenuItem key={algo} value={algo}>{algo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Block Time (ms)"
                  type="number"
                  value={networkConfig.blockTime}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, blockTime: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Block Size (bytes)"
                  type="number"
                  value={networkConfig.maxBlockSize}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, maxBlockSize: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Transactions per Block"
                  type="number"
                  value={networkConfig.maxTransactionsPerBlock}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, maxTransactionsPerBlock: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Chain ID"
                  value={networkConfig.chainId}
                  onChange={e => {
                    setNetworkConfig({ ...networkConfig, chainId: e.target.value })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Genesis Timestamp"
                  value={new Date(networkConfig.genesisTimestamp).toISOString()}
                  disabled
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Network Statistics</Typography>
            <Box mt={2}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active Nodes', value: 42 },
                      { name: 'Validators', value: 15 },
                      { name: 'Full Nodes', value: 18 },
                      { name: 'Light Clients', value: 9 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Configuration Status</Typography>
            <Box mt={2} display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>Auto-sync enabled</Typography>
                <Switch
                  checked={configSync}
                  onChange={e => setConfigSync(e.target.checked)}
                  color="primary"
                />
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {new Date().toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Chip
                  icon={<CheckCircle />}
                  label="Configuration Valid"
                  color="success"
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: NODE CONFIGURATION TAB
  // ============================================================================

  const renderNodeConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Storage sx={{ color: THEME_COLORS.tertiary }} />
              <Typography variant="h6">Node Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Node ID"
                  value={nodeConfig.nodeId}
                  onChange={e => {
                    setNodeConfig({ ...nodeConfig, nodeId: e.target.value })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Node Type</InputLabel>
                  <Select
                    value={nodeConfig.nodeType}
                    onChange={e => {
                      setNodeConfig({ ...nodeConfig, nodeType: e.target.value as 'validator' | 'full' | 'light' })
                      setUnsavedChanges(true)
                    }}
                    label="Node Type"
                  >
                    <MenuItem value="validator">Validator</MenuItem>
                    <MenuItem value="full">Full Node</MenuItem>
                    <MenuItem value="light">Light Client</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="P2P Port"
                  type="number"
                  value={nodeConfig.p2pPort}
                  onChange={e => {
                    setNodeConfig({ ...nodeConfig, p2pPort: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="RPC Port"
                  type="number"
                  value={nodeConfig.rpcPort}
                  onChange={e => {
                    setNodeConfig({ ...nodeConfig, rpcPort: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="gRPC Port"
                  type="number"
                  value={nodeConfig.grpcPort}
                  onChange={e => {
                    setNodeConfig({ ...nodeConfig, grpcPort: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Connections"
                  type="number"
                  value={nodeConfig.maxConnections}
                  onChange={e => {
                    setNodeConfig({ ...nodeConfig, maxConnections: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={nodeConfig.enableMetrics}
                        onChange={e => {
                          setNodeConfig({ ...nodeConfig, enableMetrics: e.target.checked })
                          setUnsavedChanges(true)
                        }}
                      />
                    }
                    label="Enable Metrics"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={nodeConfig.enableDebugLogging}
                        onChange={e => {
                          setNodeConfig({ ...nodeConfig, enableDebugLogging: e.target.checked })
                          setUnsavedChanges(true)
                        }}
                      />
                    }
                    label="Enable Debug Logging"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: CONSENSUS CONFIGURATION TAB
  // ============================================================================

  const renderConsensusConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Speed sx={{ color: THEME_COLORS.quaternary }} />
              <Typography variant="h6">Consensus Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Consensus Algorithm</InputLabel>
                  <Select
                    value={consensusConfig.consensusAlgorithm}
                    onChange={e => {
                      setConsensusConfig({ ...consensusConfig, consensusAlgorithm: e.target.value })
                      setUnsavedChanges(true)
                    }}
                    label="Consensus Algorithm"
                  >
                    {CONSENSUS_ALGORITHMS.map(algo => (
                      <MenuItem key={algo} value={algo}>{algo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target TPS"
                  type="number"
                  value={consensusConfig.targetTPS}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, targetTPS: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                  helperText="Target transactions per second"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Batch Size"
                  type="number"
                  value={consensusConfig.batchSize}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, batchSize: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parallel Threads"
                  type="number"
                  value={consensusConfig.parallelThreads}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, parallelThreads: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Leader Election Timeout (ms)"
                  type="number"
                  value={consensusConfig.leaderElectionTimeout}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, leaderElectionTimeout: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Heartbeat Interval (ms)"
                  type="number"
                  value={consensusConfig.heartbeatInterval}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, heartbeatInterval: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Min Validators"
                  type="number"
                  value={consensusConfig.minValidators}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, minValidators: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Validators"
                  type="number"
                  value={consensusConfig.maxValidators}
                  onChange={e => {
                    setConsensusConfig({ ...consensusConfig, maxValidators: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={consensusConfig.aiOptimizationEnabled}
                      onChange={e => {
                        setConsensusConfig({ ...consensusConfig, aiOptimizationEnabled: e.target.checked })
                        setUnsavedChanges(true)
                      }}
                    />
                  }
                  label="Enable AI-driven Consensus Optimization"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: SECURITY CONFIGURATION TAB
  // ============================================================================

  const renderSecurityConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Security sx={{ color: THEME_COLORS.secondary }} />
              <Typography variant="h6">Security Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securityConfig.tlsEnabled}
                      onChange={e => {
                        setSecurityConfig({ ...securityConfig, tlsEnabled: e.target.checked })
                        setUnsavedChanges(true)
                      }}
                    />
                  }
                  label="Enable TLS/SSL"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securityConfig.quantumResistantCrypto}
                      onChange={e => {
                        setSecurityConfig({ ...securityConfig, quantumResistantCrypto: e.target.checked })
                        setUnsavedChanges(true)
                      }}
                    />
                  }
                  label="Enable Quantum-Resistant Cryptography"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Encryption Algorithm</InputLabel>
                  <Select
                    value={securityConfig.encryptionAlgorithm}
                    onChange={e => {
                      setSecurityConfig({ ...securityConfig, encryptionAlgorithm: e.target.value })
                      setUnsavedChanges(true)
                    }}
                    label="Encryption Algorithm"
                  >
                    {ENCRYPTION_ALGORITHMS.map(algo => (
                      <MenuItem key={algo} value={algo}>{algo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Signature Algorithm</InputLabel>
                  <Select
                    value={securityConfig.signatureAlgorithm}
                    onChange={e => {
                      setSecurityConfig({ ...securityConfig, signatureAlgorithm: e.target.value })
                      setUnsavedChanges(true)
                    }}
                    label="Signature Algorithm"
                  >
                    {SIGNATURE_ALGORITHMS.map(algo => (
                      <MenuItem key={algo} value={algo}>{algo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Key Rotation Interval (ms)"
                  type="number"
                  value={securityConfig.keyRotationInterval}
                  onChange={e => {
                    setSecurityConfig({ ...securityConfig, keyRotationInterval: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                  helperText="24 hours = 86400000ms"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Failed Login Attempts"
                  type="number"
                  value={securityConfig.maxFailedAttempts}
                  onChange={e => {
                    setSecurityConfig({ ...securityConfig, maxFailedAttempts: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (ms)"
                  type="number"
                  value={securityConfig.sessionTimeout}
                  onChange={e => {
                    setSecurityConfig({ ...securityConfig, sessionTimeout: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                  helperText="1 hour = 3600000ms"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: PERFORMANCE CONFIGURATION TAB
  // ============================================================================

  const renderPerformanceConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Speed sx={{ color: THEME_COLORS.info }} />
              <Typography variant="h6">Performance Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Memory Limit (MB)"
                  type="number"
                  value={performanceConfig.memoryLimit}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, memoryLimit: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CPU Limit (cores)"
                  type="number"
                  value={performanceConfig.cpuLimit}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, cpuLimit: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Disk I/O Limit (MB/s)"
                  type="number"
                  value={performanceConfig.diskIOLimit}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, diskIOLimit: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Network Bandwidth Limit (Mbps)"
                  type="number"
                  value={performanceConfig.networkBandwidthLimit}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, networkBandwidthLimit: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cache Size (MB)"
                  type="number"
                  value={performanceConfig.cacheSize}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, cacheSize: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Thread Pool Size"
                  type="number"
                  value={performanceConfig.threadPoolSize}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, threadPoolSize: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Connection Pool Size"
                  type="number"
                  value={performanceConfig.connectionPoolSize}
                  onChange={e => {
                    setPerformanceConfig({ ...performanceConfig, connectionPoolSize: Number(e.target.value) })
                    setUnsavedChanges(true)
                  }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Settings sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
          <Box>
            <Typography variant="h4">Blockchain Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage network, node, consensus, security, and performance settings
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2}>
          <Tooltip title="View configuration history">
            <IconButton onClick={() => setHistoryDialogOpen(true)}>
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export configuration">
            <IconButton onClick={handleExportConfiguration}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh from server">
            <IconButton onClick={fetchConfigurations}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {unsavedChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Unsaved Changes</AlertTitle>
          You have unsaved configuration changes. Click Save to apply them.
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="configuration tabs"
          variant="fullWidth"
        >
          <Tab label="Network" />
          <Tab label="Node" />
          <Tab label="Consensus" />
          <Tab label="Security" />
          <Tab label="Performance" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        {renderNetworkConfigTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderNodeConfigTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderConsensusConfigTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {renderSecurityConfigTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {renderPerformanceConfigTab()}
      </TabPanel>

      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          variant="outlined"
          onClick={handleResetConfiguration}
          startIcon={<RestartAlt />}
          disabled={loading || !unsavedChanges}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveConfiguration}
          startIcon={<Save />}
          disabled={loading || !unsavedChanges}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {/* Configuration History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configuration History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Config Type</TableCell>
                  <TableCell>Applied By</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configHistory.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={item.configType} size="small" />
                    </TableCell>
                    <TableCell>{item.appliedBy}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'applied' ? 'success' : item.status === 'failed' ? 'error' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Tab Change Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Do you want to discard them and switch tabs?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setUnsavedChanges(false)
              setConfirmDialogOpen(false)
            }}
            color="error"
          >
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
