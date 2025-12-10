import axios, { AxiosError, AxiosResponse } from 'axios'

// Use environment variable if available, otherwise use production URL
const API_BASE_URL = (import.meta as any).env?.VITE_REACT_APP_API_URL || 'https://dlt.aurigraph.io/api/v11'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const apiKey = import.meta.env.VITE_REACT_APP_API_KEY
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url || 'unknown'
    const currentToken = localStorage.getItem('auth_token')

    // Demo mode - don't redirect on 401
    if (status === 401 && currentToken?.startsWith('demo-token-')) {
      console.debug(`[API] 401 on ${url} - demo mode`)
      return Promise.reject(new Error('Demo mode'))
    }

    // Real 401 - redirect to login
    if (status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    console.error(`[API] ${status || 'Network'} error on ${url}`)
    return Promise.reject(error)
  }
)

// ============================================================================
// SAFE HELPERS - Use these throughout the app
// ============================================================================

/**
 * Safe number helper - prevents undefined.toFixed() crashes
 */
export function safeNum(val: number | undefined | null, fallback: number = 0): number {
  if (val === undefined || val === null || typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return fallback
  }
  return val
}

/**
 * Safe string helper
 */
export function safeStr(val: string | undefined | null, fallback: string = ''): string {
  if (val === undefined || val === null || typeof val !== 'string') {
    return fallback
  }
  return val
}

/**
 * Safe array helper
 */
export function safeArr<T>(val: T[] | undefined | null, fallback: T[] = []): T[] {
  if (!Array.isArray(val)) return fallback
  return val
}

/**
 * Safe object helper
 */
export function safeObj<T extends object>(val: T | undefined | null, fallback: T): T {
  if (val === undefined || val === null || typeof val !== 'object') {
    return fallback
  }
  return val
}

/**
 * Normalize API response - handles {status, data} wrapper or raw data
 */
function normalizeResponse<T>(response: AxiosResponse, fallback: T): T {
  const data = response?.data
  if (!data) return fallback

  // Handle wrapped responses: {status: 200, data: {...}}
  if (typeof data === 'object' && 'data' in data && data.status !== undefined) {
    return data.data ?? fallback
  }

  // Handle direct data responses
  return data ?? fallback
}

/**
 * Safe API call wrapper - ALL API calls should use this
 */
async function safeCall<T>(
  apiCall: () => Promise<AxiosResponse>,
  fallback: T,
  logContext: string = 'API'
): Promise<T> {
  try {
    const response = await apiCall()
    return normalizeResponse(response, fallback)
  } catch (error) {
    console.warn(`[${logContext}] Failed, using fallback:`, error instanceof Error ? error.message : error)
    return fallback
  }
}

/**
 * Safe API call wrapper - returns { success, data, error } for compatibility with existing code
 * Use this when you need to handle errors gracefully in components
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallback: T
): Promise<{ success: boolean; data: T; error: Error | null }> {
  try {
    const data = await apiCall()
    return { success: true, data: data ?? fallback, error: null }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.warn('[safeApiCall] Failed, using fallback:', errorObj.message)
    return { success: false, data: fallback, error: errorObj }
  }
}

// ============================================================================
// COMPREHENSIVE FALLBACK DATA - Safe defaults for ALL API responses
// ============================================================================

const FALLBACKS = {
  // Health & Status
  health: { status: 'unknown', checks: {}, version: '12.0.0', timestamp: new Date().toISOString() },
  info: { status: 'unavailable', version: '12.0.0' },

  // Metrics & Performance
  metrics: { tps: 0, blockHeight: 0, activeNodes: 0, transactionVolume: 0, networkStatus: 'offline' },
  performance: { avgLatency: 0, p99Latency: 0, throughput: 0, errorRate: 0 },
  blockchainStats: { currentTPS: 0, tps: 0, targetTPS: 2000000, peakTPS: 0, averageTPS: 0, blockHeight: 0, latency: 0, throughput: 0 },

  // Lists
  emptyList: [],
  emptyPaginatedList: { data: [], total: 0, page: 0, pageSize: 20 },

  // Transactions & Blocks
  transactions: { transactions: [], total: 0 },
  blocks: { blocks: [], total: 0 },

  // Nodes & Network
  nodes: { nodes: [], total: 0 },
  nodeDetails: { id: '', status: 'unknown', type: 'unknown' },
  networkHealth: { status: 'unknown', activePeers: 0, totalPeers: 0, consensusHealth: 'UNKNOWN', uptime: 0, activeValidators: 0, totalValidators: 0, stakingRatio: 0 },
  networkTopology: { nodes: [], links: [], regions: [] },
  networkStats: { totalNodes: 0, activeNodes: 0, avgLatency: 0, throughput: 0 },

  // Channels
  channels: { channels: [], total: 0 },
  channelDetails: { id: '', name: '', status: 'unknown' },
  channelMetrics: { tps: 0, latency: 0, throughput: 0 },

  // ML & AI
  mlMetrics: { optimization: 0, efficiency: 0, predictions: 0 },
  mlPredictions: { predictions: [] },
  mlPerformance: { optimization: 0, efficiency: 0, accuracy: 0, performanceGainPercent: 0, lastOptimization: new Date().toISOString() },
  mlConfidence: { confidence: 0, accuracy: 0 },

  // Contracts
  contracts: { contracts: [], total: 0 },
  contractDetails: { id: '', status: 'unknown' },
  contractTemplates: { templates: [] },
  contractStatistics: { total: 0, active: 0, deployed: 0, verified: 0 },
  ricardianContracts: { contracts: [] },

  // Tokens
  tokens: { tokens: [], total: 0 },
  tokenDetails: { id: '', symbol: '', status: 'unknown' },
  tokenTemplates: { templates: [] },
  tokenStatistics: { total: 0, active: 0, locked: 0, totalSupply: 0, marketCap: 0 },
  rwaTokens: { tokens: [] },

  // Active Contracts
  activeContracts: { contracts: [] },
  activeContractDetails: { id: '', status: 'unknown' },
  activeContractTemplates: { templates: [] },

  // Validators & Staking
  validators: { validators: [], total: 0 },
  validatorDetails: { address: '', status: 'unknown', stake: 0, uptime: 0 },
  stakingInfo: { totalStaked: 0, stakingRatio: 0, validators: 0, apy: 0 },
  validatorSlashing: { events: [] },

  // RWA
  rwaPortfolio: { tokens: [], totalValue: '0' },
  rwaTokenization: { status: 'unknown', total: 0 },
  rwaFractionalization: { status: 'unknown' },
  rwaDistribution: { distributions: [] },
  rwaValuation: { total: 0, assets: [] },
  rwaPools: { pools: [] },

  // Gas & Fees
  gasTrends: { current: 0, average: 0, trends: [] },
  gasHistory: { history: [] },

  // Consensus & Bridge
  consensusState: { status: 'unknown', leader: '', term: 0, commitIndex: 0 },
  bridgeStatistics: { transfers: 0, volume: 0, chains: [] },
  bridgeHealth: { status: 'unknown', connectedChains: 0 },
  bridgeTransfers: { transfers: [] },

  // Enterprise & Governance
  enterpriseSettings: { settings: {} },
  governanceProposals: { proposals: [] },

  // Security
  securityAuditLog: { events: [] },
  securityMetrics: { score: 0, vulnerabilities: 0, lastAudit: '' },

  // Analytics
  analytics: { summary: {}, trends: [] },
  analyticsNetworkUsage: { usage: 0, peak: 0 },
  analyticsValidatorEarnings: { earnings: [] },
  analyticsPerformance: { latency: 0, throughput: 0, errorRate: 0 },

  // Carbon
  carbonMetrics: { emissions: 0, offsets: 0, netCarbon: 0 },
  carbonReport: { report: {} },

  // Demos
  demos: { demos: [] },
  demoDetails: { id: '', name: '', status: 'unknown' },

  // Live Data
  liveMetrics: { tps: 0, latency: 0, activeNodes: 0 },
  liveNetwork: { status: 'unknown', nodes: 0 },
  liveTransactions: { transactions: [] },

  // System
  systemStatus: { status: 'unknown', uptime: 0 },
  systemConfig: { config: {} },

  // Merkle Tree
  merkleRoot: { hash: '', timestamp: '' },
  merkleProof: { proof: [], valid: false },
  merkleStats: { height: 0, leaves: 0, root: '' },

  // Crypto & Quantum
  cryptoStatus: { algorithms: [], status: 'unknown' },
  quantumReadiness: { ready: false, score: 0 },

  // Advanced & Config
  advancedFeatures: { features: [] },
  configStatus: { configured: false },

  // Mobile
  mobileStatus: { status: 'unknown' },
  mobileMetrics: { activeUsers: 0, sessions: 0 },

  // QuantConnect
  quantConnectStats: { totalEquities: 0, totalTransactions: 0, merkleRoot: '', treeHeight: 0, lastUpdate: new Date().toISOString(), registeredSymbols: 0 },
  quantConnectNavigation: { totalEntries: 0, merkleRoot: '', treeHeight: 0, categories: {}, recentTokenizations: [] },
  quantConnectSlimNode: { slimNodeId: 'slim-node-1', running: false, messagesProcessed: 0, tokenizationsCompleted: 0, totalEquities: 0, totalTransactions: 0, merkleRoot: '', uptimeSeconds: 0, pollIntervalSeconds: 60, trackedSymbols: 0, timestamp: new Date().toISOString() },
  quantConnectEquities: { equities: [] },
  quantConnectTransactions: { transactions: [] },
}

// ============================================================================
// API SERVICE - All methods with safe error handling
// ============================================================================

export const apiService = {
  // ==================== HEALTH & INFO ====================
  async getHealth() {
    return safeCall(() => apiClient.get('/health'), FALLBACKS.health, 'getHealth')
  },

  async getInfo() {
    return safeCall(() => apiClient.get('/info'), FALLBACKS.info, 'getInfo')
  },

  // ==================== METRICS & PERFORMANCE ====================
  async getMetrics() {
    return safeCall(() => apiClient.get('/blockchain/stats'), FALLBACKS.metrics, 'getMetrics')
  },

  async getPerformance() {
    return safeCall(() => apiClient.get('/performance'), FALLBACKS.performance, 'getPerformance')
  },

  async getAnalyticsPerformance() {
    return safeCall(() => apiClient.get('/analytics/performance'), FALLBACKS.analyticsPerformance, 'getAnalyticsPerformance')
  },

  async getBlockchainStats() {
    return safeCall(() => apiClient.get('/blockchain/stats'), FALLBACKS.blockchainStats, 'getBlockchainStats')
  },

  async getBlockchainHealth() {
    return safeCall(() => apiClient.get('/blockchain/health'), FALLBACKS.health, 'getBlockchainHealth')
  },

  async getTransactionStats() {
    return safeCall(() => apiClient.get('/blockchain/transactions/stats'), { total: 0, pending: 0, confirmed: 0 }, 'getTransactionStats')
  },

  async getBlockStats() {
    return safeCall(() => apiClient.get('/blockchain/blocks/stats'), { total: 0, avgTime: 0 }, 'getBlockStats')
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/blockchain/transactions', { params }), FALLBACKS.transactions, 'getTransactions')
  },

  async getTransaction(id: string) {
    return safeCall(() => apiClient.get(`/blockchain/transactions/${id}`), { id, status: 'unknown' }, 'getTransaction')
  },

  // ==================== BLOCKS ====================
  async getBlocks(params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/blockchain/blocks', { params }), FALLBACKS.blocks, 'getBlocks')
  },

  async getBlock(height: number) {
    return safeCall(() => apiClient.get(`/blockchain/blocks/${height}`), { height, status: 'unknown' }, 'getBlock')
  },

  // ==================== NODES ====================
  async getNodes() {
    return safeCall(() => apiClient.get('/nodes'), FALLBACKS.nodes, 'getNodes')
  },

  async getNode(id: string) {
    return safeCall(() => apiClient.get(`/nodes/${id}`), FALLBACKS.nodeDetails, 'getNode')
  },

  // ==================== CHANNELS ====================
  async getChannels() {
    return safeCall(() => apiClient.get('/channels'), FALLBACKS.channels, 'getChannels')
  },

  async getChannel(id: string) {
    return safeCall(() => apiClient.get(`/channels/${id}`), FALLBACKS.channelDetails, 'getChannel')
  },

  async createChannel(channel: any) {
    return safeCall(() => apiClient.post('/channels', channel), { success: false }, 'createChannel')
  },

  async updateChannelConfig(id: string, config: any) {
    return safeCall(() => apiClient.put(`/channels/${id}/config`, config), { success: false }, 'updateChannelConfig')
  },

  async getChannelMetrics(id: string) {
    return safeCall(() => apiClient.get(`/channels/${id}/metrics`), FALLBACKS.channelMetrics, 'getChannelMetrics')
  },

  async getChannelTransactions(id: string, params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get(`/channels/${id}/transactions`, { params }), FALLBACKS.transactions, 'getChannelTransactions')
  },

  // ==================== ML & AI ====================
  async getMLMetrics() {
    return safeCall(() => apiClient.get('/ml/metrics'), FALLBACKS.mlMetrics, 'getMLMetrics')
  },

  async getMLPredictions() {
    return safeCall(() => apiClient.get('/ml/predictions'), FALLBACKS.mlPredictions, 'getMLPredictions')
  },

  async getMLPerformance() {
    return safeCall(() => apiClient.get('/ml/performance'), FALLBACKS.mlPerformance, 'getMLPerformance')
  },

  async getMLConfidence() {
    return safeCall(() => apiClient.get('/ml/confidence'), FALLBACKS.mlConfidence, 'getMLConfidence')
  },

  // ==================== SMART CONTRACTS ====================
  async getContracts(params?: { channelId?: string; status?: string }) {
    return safeCall(() => apiClient.get('/contracts', { params }), FALLBACKS.contracts, 'getContracts')
  },

  async getContract(id: string) {
    return safeCall(() => apiClient.get(`/contracts/${id}`), FALLBACKS.contractDetails, 'getContract')
  },

  async getContractTemplates() {
    return safeCall(() => apiClient.get('/contracts/templates'), FALLBACKS.contractTemplates, 'getContractTemplates')
  },

  async getRicardianContracts(params?: { limit?: number; status?: string }) {
    return safeCall(() => apiClient.get('/contracts/ricardian', { params }), FALLBACKS.ricardianContracts, 'getRicardianContracts')
  },

  async deployContract(request: any) {
    return safeCall(() => apiClient.post('/contracts/deploy', request), { success: false }, 'deployContract')
  },

  async verifyContract(id: string) {
    return safeCall(() => apiClient.post(`/contracts/${id}/verify`), { success: false }, 'verifyContract')
  },

  async auditContract(id: string, auditData: any) {
    return safeCall(() => apiClient.post(`/contracts/${id}/audit`, auditData), { success: false }, 'auditContract')
  },

  async executeContract(id: string, data: any) {
    return safeCall(() => apiClient.post(`/contracts/${id}/execute`, data), { success: false }, 'executeContract')
  },

  async getContractStatistics() {
    return safeCall(() => apiClient.get('/contracts/statistics'), FALLBACKS.contractStatistics, 'getContractStatistics')
  },

  // ==================== TOKENS ====================
  async getTokens(params?: { type?: string; channelId?: string; verified?: boolean }) {
    return safeCall(() => apiClient.get('/tokens', { params }), FALLBACKS.tokens, 'getTokens')
  },

  async getToken(id: string) {
    return safeCall(() => apiClient.get(`/tokens/${id}`), FALLBACKS.tokenDetails, 'getToken')
  },

  async getTokenTemplates() {
    return safeCall(() => apiClient.get('/tokens/templates'), FALLBACKS.tokenTemplates, 'getTokenTemplates')
  },

  async createToken(request: any) {
    return safeCall(() => apiClient.post('/tokens/create', request), { success: false }, 'createToken')
  },

  async mintTokens(id: string, amount: number) {
    return safeCall(() => apiClient.post(`/tokens/${id}/mint`, { amount }), { success: false }, 'mintTokens')
  },

  async burnTokens(id: string, amount: number) {
    return safeCall(() => apiClient.post(`/tokens/${id}/burn`, { amount }), { success: false }, 'burnTokens')
  },

  async verifyToken(id: string) {
    return safeCall(() => apiClient.post(`/tokens/${id}/verify`), { success: false }, 'verifyToken')
  },

  async getTokenStatistics() {
    return safeCall(() => apiClient.get('/tokens/statistics'), FALLBACKS.tokenStatistics, 'getTokenStatistics')
  },

  async getRWATokens() {
    return safeCall(() => apiClient.get('/tokens/rwa'), FALLBACKS.rwaTokens, 'getRWATokens')
  },

  // ==================== ACTIVE CONTRACTS ====================
  async getActiveContracts() {
    return safeCall(() => apiClient.get('/activecontracts/contracts'), FALLBACKS.activeContracts, 'getActiveContracts')
  },

  async getActiveContract(id: string) {
    return safeCall(() => apiClient.get(`/activecontracts/contracts/${id}`), FALLBACKS.activeContractDetails, 'getActiveContract')
  },

  async createActiveContract(request: any) {
    return safeCall(() => apiClient.post('/activecontracts/create', request), { success: false }, 'createActiveContract')
  },

  async executeContractAction(contractId: string, actionId: string, parameters: any) {
    return safeCall(() => apiClient.post(`/activecontracts/${contractId}/execute/${actionId}`, parameters), { success: false }, 'executeContractAction')
  },

  async getActiveContractTemplates() {
    return safeCall(() => apiClient.get('/activecontracts/templates'), FALLBACKS.activeContractTemplates, 'getActiveContractTemplates')
  },

  async createFromTemplate(templateId: string, parameters: any) {
    return safeCall(() => apiClient.post(`/activecontracts/templates/${templateId}/instantiate`, parameters), { success: false }, 'createFromTemplate')
  },

  // ==================== AUTH ====================
  async login(credentials: { username: string; password: string }) {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  },

  async logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    return { success: true }
  },

  // ==================== ANALYTICS ====================
  async getAnalytics(period: '24h' | '7d' | '30d' = '24h') {
    return safeCall(() => apiClient.get(`/analytics/${period}`), FALLBACKS.analytics, 'getAnalytics')
  },

  async getAnalyticsPeriod(period: '24h' | '7d' | '30d' | '90d' = '24h') {
    return safeCall(() => apiClient.get(`/analytics/${period}`), FALLBACKS.analytics, 'getAnalyticsPeriod')
  },

  async getAnalyticsNetworkUsage() {
    return safeCall(() => apiClient.get('/analytics/network-usage'), FALLBACKS.analyticsNetworkUsage, 'getAnalyticsNetworkUsage')
  },

  async getAnalyticsValidatorEarnings() {
    return safeCall(() => apiClient.get('/analytics/validator-earnings'), FALLBACKS.analyticsValidatorEarnings, 'getAnalyticsValidatorEarnings')
  },

  // ==================== SYSTEM ====================
  async getSystemStatus() {
    return safeCall(() => apiClient.get('/system/status'), FALLBACKS.systemStatus, 'getSystemStatus')
  },

  async getSystemConfig() {
    return safeCall(() => apiClient.get('/system/config'), FALLBACKS.systemConfig, 'getSystemConfig')
  },

  // ==================== MERKLE TREE ====================
  async getMerkleRootHash() {
    return safeCall(() => apiClient.get('/registry/rwat/merkle/root'), FALLBACKS.merkleRoot, 'getMerkleRootHash')
  },

  async generateMerkleProof(rwatId: string) {
    return safeCall(() => apiClient.get(`/registry/rwat/${rwatId}/merkle/proof`), FALLBACKS.merkleProof, 'generateMerkleProof')
  },

  async verifyMerkleProof(proofData: any) {
    return safeCall(() => apiClient.post('/registry/rwat/merkle/verify', proofData), { valid: false }, 'verifyMerkleProof')
  },

  async getMerkleTreeStats() {
    return safeCall(() => apiClient.get('/registry/rwat/merkle/stats'), FALLBACKS.merkleStats, 'getMerkleTreeStats')
  },

  // ==================== DEMOS ====================
  async getDemos(params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/demos', { params }), FALLBACKS.demos, 'getDemos')
  },

  async getDemoById(id: string) {
    return safeCall(() => apiClient.get(`/demos/${id}`), FALLBACKS.demoDetails, 'getDemoById')
  },

  async startDemo(id: string) {
    return safeCall(() => apiClient.post(`/demos/${id}/start`), { success: false }, 'startDemo')
  },

  async stopDemo(id: string) {
    return safeCall(() => apiClient.post(`/demos/${id}/stop`), { success: false }, 'stopDemo')
  },

  // ==================== VALIDATORS & STAKING ====================
  async getValidators(params?: { status?: string; limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/blockchain/validators', { params }), FALLBACKS.validators, 'getValidators')
  },

  async getValidatorDetails(address: string) {
    return safeCall(() => apiClient.get(`/blockchain/validators/${address}`), FALLBACKS.validatorDetails, 'getValidatorDetails')
  },

  async getStakingInfo() {
    return safeCall(() => apiClient.get('/staking/info'), FALLBACKS.stakingInfo, 'getStakingInfo')
  },

  async getNetworkHealth() {
    return safeCall(() => apiClient.get('/blockchain/network/health'), FALLBACKS.networkHealth, 'getNetworkHealth')
  },

  async claimRewards(validatorAddress: string) {
    return safeCall(() => apiClient.post(`/staking/validators/${validatorAddress}/claim-rewards`), { success: false }, 'claimRewards')
  },

  async getValidatorMetrics(validatorId: string) {
    return safeCall(() => apiClient.get(`/validators/${validatorId}/metrics`), { uptime: 0, blocksProduced: 0 }, 'getValidatorMetrics')
  },

  async getValidatorSlashing() {
    return safeCall(() => apiClient.get('/validators/slashing'), FALLBACKS.validatorSlashing, 'getValidatorSlashing')
  },

  // ==================== RWA ====================
  async getRWAPortfolio(params?: { userId?: string }) {
    return safeCall(() => apiClient.get('/rwa/portfolio', { params }), FALLBACKS.rwaPortfolio, 'getRWAPortfolio')
  },

  async getRWATokenization() {
    return safeCall(() => apiClient.get('/rwa/tokenization'), FALLBACKS.rwaTokenization, 'getRWATokenization')
  },

  async getRWAFractionalization() {
    return safeCall(() => apiClient.get('/rwa/fractionalization'), FALLBACKS.rwaFractionalization, 'getRWAFractionalization')
  },

  async getRWADistribution() {
    return safeCall(() => apiClient.get('/rwa/distribution'), FALLBACKS.rwaDistribution, 'getRWADistribution')
  },

  async getRWAValuation() {
    return safeCall(() => apiClient.get('/rwa/valuation'), FALLBACKS.rwaValuation, 'getRWAValuation')
  },

  async getRWAPools() {
    return safeCall(() => apiClient.get('/rwa/pools'), FALLBACKS.rwaPools, 'getRWAPools')
  },

  async getRWARegistry() {
    return safeCall(() => apiClient.get('/rwa/registry'), { assets: [], stats: {} }, 'getRWARegistry')
  },

  async getRWADividends() {
    return safeCall(() => apiClient.get('/rwa/dividends'), { totalDividends: 0, pendingDividends: 0, history: [] }, 'getRWADividends')
  },

  async getRWACompliance() {
    return safeCall(() => apiClient.get('/rwa/compliance'), { overallStatus: 'UNKNOWN', complianceScore: 0, regulations: [] }, 'getRWACompliance')
  },

  // ==================== GAS & FEES ====================
  async getGasTrends(params?: { period?: '1h' | '24h' | '7d' }) {
    return safeCall(() => apiClient.get('/gas/trends', { params }), FALLBACKS.gasTrends, 'getGasTrends')
  },

  async getGasHistory(params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/gas/history', { params }), FALLBACKS.gasHistory, 'getGasHistory')
  },

  // ==================== NETWORK ====================
  async getNetworkTopology() {
    return safeCall(() => apiClient.get('/network/topology'), FALLBACKS.networkTopology, 'getNetworkTopology')
  },

  async getNetworkStats() {
    return safeCall(() => apiClient.get('/network/stats'), FALLBACKS.networkStats, 'getNetworkStats')
  },

  // ==================== CONSENSUS & BRIDGE ====================
  async getConsensusState() {
    return safeCall(() => apiClient.get('/consensus/state'), FALLBACKS.consensusState, 'getConsensusState')
  },

  async getBridgeStatistics() {
    return safeCall(() => apiClient.get('/bridge/statistics'), FALLBACKS.bridgeStatistics, 'getBridgeStatistics')
  },

  async getBridgeHealth() {
    return safeCall(() => apiClient.get('/bridge/health'), FALLBACKS.bridgeHealth, 'getBridgeHealth')
  },

  async getBridgeTransfers(params?: { limit?: number; offset?: number }) {
    return safeCall(() => apiClient.get('/bridge/transfers', { params }), FALLBACKS.bridgeTransfers, 'getBridgeTransfers')
  },

  // ==================== ENTERPRISE & GOVERNANCE ====================
  async getEnterpriseSettings() {
    return safeCall(() => apiClient.get('/enterprise/settings'), FALLBACKS.enterpriseSettings, 'getEnterpriseSettings')
  },

  async updateEnterpriseSettings(settings: any) {
    return safeCall(() => apiClient.put('/enterprise/settings', settings), { success: false }, 'updateEnterpriseSettings')
  },

  async getGovernanceProposals(params?: { status?: string; limit?: number }) {
    return safeCall(() => apiClient.get('/governance/proposals', { params }), FALLBACKS.governanceProposals, 'getGovernanceProposals')
  },

  async voteOnProposal(proposalId: string, vote: 'yes' | 'no' | 'abstain') {
    return safeCall(() => apiClient.post(`/governance/proposals/${proposalId}/vote`, { vote }), { success: false }, 'voteOnProposal')
  },

  // ==================== SECURITY ====================
  async getSecurityAuditLog(params?: { limit?: number; offset?: number; severity?: string }) {
    return safeCall(() => apiClient.get('/security/audit-log', { params }), FALLBACKS.securityAuditLog, 'getSecurityAuditLog')
  },

  async getSecurityMetrics() {
    return safeCall(() => apiClient.get('/security/metrics'), FALLBACKS.securityMetrics, 'getSecurityMetrics')
  },

  // ==================== CARBON ====================
  async getCarbonMetrics() {
    return safeCall(() => apiClient.get('/carbon/metrics'), FALLBACKS.carbonMetrics, 'getCarbonMetrics')
  },

  async getCarbonReport(params?: { startDate?: string; endDate?: string }) {
    return safeCall(() => apiClient.get('/carbon/report', { params }), FALLBACKS.carbonReport, 'getCarbonReport')
  },

  // ==================== LIVE DATA ====================
  async getLiveMetrics() {
    return safeCall(() => apiClient.get('/live/metrics'), FALLBACKS.liveMetrics, 'getLiveMetrics')
  },

  async getLiveNetworkStatus() {
    return safeCall(() => apiClient.get('/live/network'), FALLBACKS.liveNetwork, 'getLiveNetworkStatus')
  },

  async getLiveTransactions(params?: { limit?: number }) {
    return safeCall(() => apiClient.get('/live/transactions', { params }), FALLBACKS.liveTransactions, 'getLiveTransactions')
  },

  // ==================== CRYPTO & QUANTUM ====================
  async getCryptoStatus() {
    return safeCall(() => apiClient.get('/crypto/status'), FALLBACKS.cryptoStatus, 'getCryptoStatus')
  },

  async getQuantumReadiness() {
    return safeCall(() => apiClient.get('/security/quantum-readiness'), FALLBACKS.quantumReadiness, 'getQuantumReadiness')
  },

  // ==================== ADVANCED & CONFIG ====================
  async getAdvancedFeatures() {
    return safeCall(() => apiClient.get('/advanced/features'), FALLBACKS.advancedFeatures, 'getAdvancedFeatures')
  },

  async getConfigStatus() {
    return safeCall(() => apiClient.get('/config/status'), FALLBACKS.configStatus, 'getConfigStatus')
  },

  // ==================== MOBILE ====================
  async getMobileStatus() {
    return safeCall(() => apiClient.get('/mobile/status'), FALLBACKS.mobileStatus, 'getMobileStatus')
  },

  async getMobileMetrics() {
    return safeCall(() => apiClient.get('/mobile/metrics'), FALLBACKS.mobileMetrics, 'getMobileMetrics')
  },

  // ==================== FILE ATTACHMENTS ====================
  async uploadAttachment(file: File, transactionId?: string, category?: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (category) formData.append('category', category)
    if (description) formData.append('description', description)

    const url = transactionId ? `/attachments/${transactionId}` : '/attachments'
    return safeCall(
      () => apiClient.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s timeout for uploads
      }),
      { success: false },
      'uploadAttachment'
    )
  },

  async getAttachmentsByTransaction(transactionId: string) {
    return safeCall(
      () => apiClient.get(`/attachments/transaction/${transactionId}`),
      { transactionId, count: 0, attachments: [] },
      'getAttachmentsByTransaction'
    )
  },

  async getAttachment(fileId: string) {
    return safeCall(
      () => apiClient.get(`/attachments/${fileId}`),
      { fileId, error: 'Not found' },
      'getAttachment'
    )
  },

  async verifyAttachmentHash(fileId: string) {
    return safeCall(
      () => apiClient.post(`/attachments/${fileId}/verify`),
      { fileId, verified: false },
      'verifyAttachmentHash'
    )
  },

  async downloadAttachment(fileId: string) {
    return safeCall(
      () => apiClient.get(`/attachments/${fileId}/download`, { responseType: 'blob' }),
      null,
      'downloadAttachment'
    )
  },

  async linkAttachmentToTransaction(fileId: string, transactionId: string) {
    return safeCall(
      () => apiClient.post(`/attachments/${fileId}/link/${transactionId}`),
      { success: false },
      'linkAttachmentToTransaction'
    )
  },

  async deleteAttachment(fileId: string) {
    return safeCall(
      () => apiClient.delete(`/attachments/${fileId}`),
      { success: false },
      'deleteAttachment'
    )
  },

  // ==================== QUANTCONNECT ====================
  async getQuantConnectRegistryStats() {
    return safeCall(() => apiClient.get('/quantconnect/registry/stats'), FALLBACKS.quantConnectStats, 'getQuantConnectRegistryStats')
  },

  async getQuantConnectNavigation() {
    return safeCall(() => apiClient.get('/quantconnect/registry/navigation'), FALLBACKS.quantConnectNavigation, 'getQuantConnectNavigation')
  },

  async getQuantConnectSlimNodeStatus() {
    return safeCall(() => apiClient.get('/quantconnect/slimnode/status'), FALLBACKS.quantConnectSlimNode, 'getQuantConnectSlimNodeStatus')
  },

  async getQuantConnectEquities() {
    return safeCall(() => apiClient.get('/quantconnect/registry/equities'), FALLBACKS.quantConnectEquities, 'getQuantConnectEquities')
  },

  async getQuantConnectTransactions() {
    return safeCall(() => apiClient.get('/quantconnect/registry/transactions'), FALLBACKS.quantConnectTransactions, 'getQuantConnectTransactions')
  },

  async getQuantConnectBySymbol(symbol: string) {
    return safeCall(() => apiClient.get(`/quantconnect/registry/symbol/${symbol}`), { symbol, data: null }, 'getQuantConnectBySymbol')
  },

  async verifyQuantConnectToken(tokenId: string) {
    return safeCall(() => apiClient.get(`/quantconnect/registry/verify/${tokenId}`), { valid: false }, 'verifyQuantConnectToken')
  },

  async getQuantConnectToken(tokenId: string) {
    return safeCall(() => apiClient.get(`/quantconnect/registry/token/${tokenId}`), { tokenId, data: null }, 'getQuantConnectToken')
  },

  async startQuantConnectSlimNode() {
    return safeCall(() => apiClient.post('/quantconnect/slimnode/start'), { success: false }, 'startQuantConnectSlimNode')
  },

  async stopQuantConnectSlimNode() {
    return safeCall(() => apiClient.post('/quantconnect/slimnode/stop'), { success: false }, 'stopQuantConnectSlimNode')
  },

  async processQuantConnectEquities(symbols?: string[]) {
    return safeCall(() => apiClient.post('/quantconnect/slimnode/process/equities', { symbols }), { success: false }, 'processQuantConnectEquities')
  },

  async processQuantConnectTransactions(symbol?: string, limit?: number) {
    return safeCall(() => apiClient.post('/quantconnect/slimnode/process/transactions', { symbol, limit }), { success: false }, 'processQuantConnectTransactions')
  },

  async fetchQuantConnectEquities(symbols?: string[]) {
    return safeCall(() => apiClient.post('/quantconnect/fetch', { symbols }), { equities: [] }, 'fetchQuantConnectEquities')
  },

  async tokenizeQuantConnectEquity(equity: any) {
    return safeCall(() => apiClient.post('/quantconnect/tokenize', equity), { success: false }, 'tokenizeQuantConnectEquity')
  },

  async searchQuantConnectRegistry(query: string, type?: string) {
    return safeCall(() => apiClient.get('/quantconnect/registry/search', { params: { query, type } }), { results: [] }, 'searchQuantConnectRegistry')
  },
}

// Export helpers and types
export { safeCall, normalizeResponse, FALLBACKS }
export default apiService
