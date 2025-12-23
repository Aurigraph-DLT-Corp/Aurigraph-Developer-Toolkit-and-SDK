/**
 * Phase 1 Component Type Definitions
 * Enterprise Portal - Backend Integration Types
 */

// ============================================================================
// Network Topology Types
// ============================================================================

export interface NetworkNode {
  id: string
  name: string
  type: 'validator' | 'observer' | 'seed' | 'relay'
  status: 'active' | 'inactive' | 'syncing' | 'error'
  ipAddress: string
  port: number
  region: string
  uptime: number
  connections: number
  lastSeen: string
  version: string
  stake?: number
  performance?: {
    tps: number
    latency: number
    errorRate: number
  }
}

export interface NetworkEdge {
  source: string
  target: string
  bandwidth: number
  latency: number
  status: 'healthy' | 'degraded' | 'failed'
}

export interface NetworkTopologyData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  stats: {
    totalNodes: number
    activeNodes: number
    totalConnections: number
    averageLatency: number
    networkHealth: number
  }
}

// ============================================================================
// Block Search Types
// ============================================================================

export interface BlockInfo {
  height: number
  hash: string
  timestamp: string
  transactionCount: number
  size: number
  validator: string
  parentHash: string
  stateRoot: string
  receiptsRoot: string
  gasUsed: number
  gasLimit: number
  difficulty?: number
  extraData?: string
}

export interface BlockSearchResult {
  blocks: BlockInfo[]
  totalCount: number
  pageSize: number
  currentPage: number
}

export interface BlockSearchFilters {
  heightFrom?: number
  heightTo?: number
  dateFrom?: string
  dateTo?: string
  validator?: string
  minTransactions?: number
  maxTransactions?: number
}

// ============================================================================
// Validator Performance Types
// ============================================================================

export interface ValidatorInfo {
  id: string
  address: string
  name: string
  status: 'active' | 'inactive' | 'jailed' | 'unbonding'
  stake: number
  commission: number
  uptime: number
  blocksProduced: number
  missedBlocks: number
  slashingEvents: number
  votingPower: number
  delegators: number
  rewards: number
  joinedAt: string
  lastActiveAt: string
}

export interface SlashingEvent {
  id: string
  validatorId: string
  validatorName: string
  type: 'downtime' | 'double_sign' | 'byzantine'
  amount: number
  blockHeight: number
  timestamp: string
  reason: string
  status: 'pending' | 'executed' | 'reverted'
}

export interface ValidatorMetrics {
  averageBlockTime: number
  averageUptime: number
  totalSlashingEvents: number
  totalStake: number
  activeValidators: number
  jailedValidators: number
}

// ============================================================================
// AI Model Metrics Types
// ============================================================================

export interface MLModelInfo {
  id: string
  name: string
  type: 'consensus_optimizer' | 'transaction_predictor' | 'anomaly_detector' | 'load_balancer'
  version: string
  status: 'active' | 'training' | 'inactive' | 'error'
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latency: number
  throughput: number
  lastTrainedAt: string
  trainingDataSize: number
  inferenceCount: number
}

export interface ModelPrediction {
  timestamp: string
  predicted: number
  actual: number
  confidence: number
  error: number
}

export interface AIMetrics {
  models: MLModelInfo[]
  overallAccuracy: number
  totalInferences: number
  averageLatency: number
  performanceGain: number
  predictions: ModelPrediction[]
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLogEntry {
  id: string
  timestamp: string
  eventType: 'access' | 'modification' | 'deletion' | 'creation' | 'security' | 'admin'
  severity: 'info' | 'warning' | 'error' | 'critical'
  userId: string
  username: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure' | 'pending'
  details: Record<string, any>
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
}

export interface AuditLogFilters {
  dateFrom?: string
  dateTo?: string
  eventType?: string[]
  severity?: string[]
  userId?: string
  resource?: string
  status?: string
  searchQuery?: string
}

export interface AuditLogSummary {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  failedAttempts: number
  suspiciousActivity: number
  topUsers: Array<{ userId: string; username: string; eventCount: number }>
}

// ============================================================================
// Cross-Chain Bridge Types
// ============================================================================

export interface BridgeChain {
  id: string
  name: string
  type: 'evm' | 'cosmos' | 'substrate' | 'bitcoin' | 'other'
  status: 'active' | 'inactive' | 'maintenance'
  rpcEndpoint: string
  contractAddress?: string
  blockHeight: number
  lastSync: string
}

export interface BridgeTransfer {
  id: string
  sourceChain: string
  targetChain: string
  sourceAddress: string
  targetAddress: string
  amount: number
  token: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  initiatedAt: string
  completedAt?: string
  confirmations: number
  requiredConfirmations: number
  txHash: string
  fee: number
}

export interface BridgeStatistics {
  totalTransfers: number
  totalVolume: number
  activeChains: number
  successRate: number
  averageProcessingTime: number
  totalFees: number
  transfersByChain: Record<string, number>
  volumeByToken: Record<string, number>
  recentTransfers: BridgeTransfer[]
}

export interface BridgeHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  chains: Array<{
    chainId: string
    chainName: string
    status: string
    latency: number
    errorRate: number
  }>
  liquidity: Record<string, number>
  alerts: Array<{
    severity: string
    message: string
    timestamp: string
  }>
}

// ============================================================================
// RWA Asset Management Types
// ============================================================================

export interface RWAAsset {
  id: string
  tokenId: string
  assetType: 'real_estate' | 'commodity' | 'art' | 'bond' | 'equity' | 'other'
  name: string
  description: string
  owner: string
  totalValue: number
  tokenizedValue: number
  totalSupply: number
  circulatingSupply: number
  pricePerToken: number
  currency: string
  status: 'active' | 'pending' | 'frozen' | 'liquidated'
  createdAt: string
  updatedAt: string
  verificationStatus: 'verified' | 'pending' | 'rejected'
  documents: Array<{
    type: string
    hash: string
    url: string
  }>
  compliance: {
    jurisdiction: string
    regulatoryApproval: boolean
    kycRequired: boolean
    accreditedOnly: boolean
  }
  valuation: {
    lastValuationDate: string
    nextValuationDate: string
    valuationMethod: string
    appraiser: string
  }
}

export interface RWATransaction {
  id: string
  assetId: string
  type: 'mint' | 'burn' | 'transfer' | 'dividend' | 'valuation_update'
  from: string
  to: string
  amount: number
  price: number
  timestamp: string
  txHash: string
  status: 'completed' | 'pending' | 'failed'
}

export interface RWAPortfolio {
  totalValue: number
  totalAssets: number
  assetsByType: Record<string, number>
  recentTransactions: RWATransaction[]
  performance: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
  }
}

export interface RWACompliance {
  assetId: string
  status: 'compliant' | 'non_compliant' | 'under_review'
  checks: Array<{
    type: string
    status: boolean
    lastChecked: string
    details: string
  }>
  documents: Array<{
    name: string
    type: string
    status: 'approved' | 'pending' | 'rejected'
    uploadedAt: string
  }>
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageSize: number
  currentPage: number
  totalPages: number
}

export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }>
}
