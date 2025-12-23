import axios, { AxiosError } from 'axios'

const API_BASE_URL = (import.meta as any).env?.PROD
  ? 'https://dlt.aurigraph.io/api/v11'
  : 'http://localhost:9003/api/v11'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add API key - IMPORTANT: Vite exposes as VITE_REACT_APP_API_KEY
  const apiKey = import.meta.env.VITE_REACT_APP_API_KEY
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
    console.debug(`[API] Sending X-API-Key header`)
  } else {
    console.warn('[API] No API key found in environment variables. Check .env file for VITE_REACT_APP_API_KEY')
  }

  return config
})

// Handle response errors including 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    // Log rate limit headers if present
    const remaining = response.headers['x-ratelimit-remaining']
    const reset = response.headers['x-ratelimit-reset']
    if (remaining !== undefined) {
      console.debug(`Rate limit: ${remaining} remaining, resets at ${reset}`)
    }
    return response
  },
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url || 'unknown'

    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        console.error(`401 Unauthorized on ${url}`)
        localStorage.removeItem('auth_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(new Error('Authentication failed. Please log in again.'))

      case 403:
        // Forbidden
        console.error(`403 Forbidden on ${url}`)
        return Promise.reject(new Error('Access forbidden'))

      case 404:
        // Not found
        console.error(`404 Not Found on ${url}`)
        return Promise.reject(new Error(`Resource not found: ${url}`))

      case 429:
        // Rate limited
        console.warn(`429 Rate Limited on ${url}`)
        const retryAfter = error.response?.headers['retry-after'] || 60
        return Promise.reject(new Error(`Rate limited. Please retry after ${retryAfter} seconds`))

      case 500:
      case 502:
      case 503:
      case 504:
        // Server error
        console.error(`${status} Server error on ${url}`)
        return Promise.reject(new Error(`Server error (${status})`))

      default:
        console.error(`API Error on ${url}:`, error.message)
        return Promise.reject(error)
    }
  }
)

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= (opts.maxRetries || 0); attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx)
      if (error instanceof AxiosError && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        throw error
      }

      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        (opts.initialDelay || 1000) * Math.pow(opts.backoffFactor || 2, attempt),
        opts.maxDelay || 10000
      )

      console.warn(`Request failed (attempt ${attempt + 1}/${(opts.maxRetries || 0) + 1}). Retrying in ${delay}ms...`, error)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Gracefully handle API calls with fallback values
 */
async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  options: RetryOptions = {}
): Promise<{ data: T; error: Error | null; success: boolean }> {
  try {
    const data = await retryWithBackoff(apiCall, options)
    return { data, error: null, success: true }
  } catch (error) {
    const err = error as Error
    console.error('API call failed after retries:', err)
    return { data: fallbackValue, error: err, success: false }
  }
}

// Default fallback data for failed requests
const FALLBACK_DATA = {
  metrics: {
    tps: 0,
    blockHeight: 0,
    activeNodes: 0,
    transactionVolume: 0,
    networkStatus: 'offline',
  },
  performance: {
    avgLatency: 0,
    p99Latency: 0,
    throughput: 0,
    errorRate: 0,
  },
  health: {
    status: 'unknown',
    timestamp: new Date().toISOString(),
  },
}

export const apiService = {
  // Health & Info
  async getHealth() {
    try {
      const response = await apiClient.get('/health')
      return response.data
    } catch (error) {
      console.error('Failed to fetch health:', error)
      return FALLBACK_DATA.health
    }
  },

  async getInfo() {
    try {
      const response = await apiClient.get('/info')
      return response.data
    } catch (error) {
      console.error('Failed to fetch info:', error)
      return { status: 'unavailable' }
    }
  },

  // Metrics
  async getMetrics() {
    try {
      const response = await apiClient.get('/blockchain/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      return FALLBACK_DATA.metrics
    }
  },

  async getPerformance() {
    try {
      const response = await apiClient.get('/performance')
      return response.data
    } catch (error) {
      console.error('Failed to fetch performance:', error)
      return FALLBACK_DATA.performance
    }
  },

  async getAnalyticsPerformance() {
    const response = await apiClient.get('/analytics/performance')
    return response.data
  },

  // Transactions
  async getTransactions(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/blockchain/transactions', { params })
    return response.data
  },

  async getTransaction(id: string) {
    const response = await apiClient.get(`/blockchain/transactions/${id}`)
    return response.data
  },

  // Blocks
  async getBlocks(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/blockchain/blocks', { params })
    return response.data
  },

  async getBlock(height: number) {
    const response = await apiClient.get(`/blockchain/blocks/${height}`)
    return response.data
  },

  // Nodes
  async getNodes() {
    const response = await apiClient.get('/nodes')
    return response.data
  },

  async getNode(id: string) {
    const response = await apiClient.get(`/nodes/${id}`)
    return response.data
  },

  // Channels
  async getChannels() {
    const response = await apiClient.get('/channels')
    return response.data
  },

  async getChannel(id: string) {
    const response = await apiClient.get(`/channels/${id}`)
    return response.data
  },

  async createChannel(channel: any) {
    const response = await apiClient.post('/channels', channel)
    return response.data
  },

  async updateChannelConfig(id: string, config: any) {
    const response = await apiClient.put(`/channels/${id}/config`, config)
    return response.data
  },

  // ML & AI Optimization
  async getMLMetrics() {
    const response = await apiClient.get('/ai/metrics')
    return response.data
  },

  async getMLPredictions() {
    const response = await apiClient.get('/ai/predictions')
    return response.data
  },

  async getMLPerformance() {
    try {
      const response = await apiClient.get('/ai/performance')
      return response.data
    } catch (error) {
      console.error('Failed to fetch ML performance:', error)
      return { optimization: 0, efficiency: 0, accuracy: 0 }
    }
  },

  async getMLConfidence() {
    const response = await apiClient.get('/ai/confidence')
    return response.data
  },

  async getChannelMetrics(id: string) {
    const response = await apiClient.get(`/channels/${id}/metrics`)
    return response.data
  },

  async getChannelTransactions(id: string, params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get(`/channels/${id}/transactions`, { params })
    return response.data
  },

  // Smart Contracts
  async getContracts(params?: { channelId?: string; status?: string }) {
    const response = await apiClient.get('/contracts', { params })
    return response.data
  },

  async getContract(id: string) {
    const response = await apiClient.get(`/contracts/${id}`)
    return response.data
  },

  async getContractTemplates() {
    const response = await apiClient.get('/contracts/templates')
    return response.data
  },

  // Ricardian Contracts
  async getRicardianContracts(params?: { limit?: number; status?: string }) {
    const response = await apiClient.get('/contracts/ricardian', { params })
    return response.data
  },

  async deployContract(request: any) {
    const response = await apiClient.post('/contracts/deploy', request)
    return response.data
  },

  async verifyContract(id: string) {
    const response = await apiClient.post(`/contracts/${id}/verify`)
    return response.data
  },

  async auditContract(id: string, auditData: any) {
    const response = await apiClient.post(`/contracts/${id}/audit`, auditData)
    return response.data
  },

  async executeContract(id: string, data: any) {
    const response = await apiClient.post(`/contracts/${id}/execute`, data)
    return response.data
  },

  async getContractStatistics() {
    const response = await apiClient.get('/contracts/statistics')
    return response.data
  },

  // Tokens
  async getTokens(params?: { type?: string; channelId?: string; verified?: boolean }) {
    const response = await apiClient.get('/tokens', { params })
    return response.data
  },

  async getToken(id: string) {
    const response = await apiClient.get(`/tokens/${id}`)
    return response.data
  },

  async getTokenTemplates() {
    const response = await apiClient.get('/tokens/templates')
    return response.data
  },

  async createToken(request: any) {
    const response = await apiClient.post('/tokens/create', request)
    return response.data
  },

  async mintTokens(id: string, amount: number) {
    const response = await apiClient.post(`/tokens/${id}/mint`, { amount })
    return response.data
  },

  async burnTokens(id: string, amount: number) {
    const response = await apiClient.post(`/tokens/${id}/burn`, { amount })
    return response.data
  },

  async verifyToken(id: string) {
    const response = await apiClient.post(`/tokens/${id}/verify`)
    return response.data
  },

  async getTokenStatistics() {
    try {
      const response = await apiClient.get('/tokens/statistics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch token statistics:', error)
      return { total: 0, active: 0, locked: 0 }
    }
  },

  async getRWATokens() {
    const response = await apiClient.get('/tokens/rwa')
    return response.data
  },

  // ActiveContracts
  async getActiveContracts() {
    const response = await apiClient.get('/activecontracts/contracts')
    return response.data
  },

  async getActiveContract(id: string) {
    const response = await apiClient.get(`/activecontracts/contracts/${id}`)
    return response.data
  },

  async createActiveContract(request: any) {
    const response = await apiClient.post('/activecontracts/create', request)
    return response.data
  },

  async executeContractAction(contractId: string, actionId: string, parameters: any) {
    const response = await apiClient.post(`/activecontracts/${contractId}/execute/${actionId}`, parameters)
    return response.data
  },

  async getActiveContractTemplates() {
    const response = await apiClient.get('/activecontracts/templates')
    return response.data
  },

  async createFromTemplate(templateId: string, parameters: any) {
    const response = await apiClient.post(`/activecontracts/templates/${templateId}/instantiate`, parameters)
    return response.data
  },

  // Auth
  async login(credentials: { username: string; password: string }) {
    const response = await apiClient.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token)
    }
    return response.data
  },

  async logout() {
    localStorage.removeItem('auth_token')
    return { success: true }
  },

  // Analytics
  async getAnalytics(period: '24h' | '7d' | '30d' = '24h') {
    const response = await apiClient.get(`/analytics/${period}`)
    return response.data
  },

  // System
  async getSystemStatus() {
    const response = await apiClient.get('/system/status')
    return response.data
  },

  async getSystemConfig() {
    const response = await apiClient.get('/system/config')
    return response.data
  },

  // Merkle Tree Registry
  async getMerkleRootHash() {
    const response = await apiClient.get('/registry/rwat/merkle/root')
    return response.data
  },

  async generateMerkleProof(rwatId: string) {
    const response = await apiClient.get(`/registry/rwat/${rwatId}/merkle/proof`)
    return response.data
  },

  async verifyMerkleProof(proofData: any) {
    const response = await apiClient.post('/registry/rwat/merkle/verify', proofData)
    return response.data
  },

  async getMerkleTreeStats() {
    const response = await apiClient.get('/registry/rwat/merkle/stats')
    return response.data
  },

  // Demo Contracts (using actual backend endpoint)
  async getDemos(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/demos', { params })
    return response.data
  },

  // Validators & Staking
  async getValidators(params?: { status?: string; limit?: number; offset?: number }) {
    const response = await apiClient.get('/blockchain/validators', { params })
    return response.data
  },

  async getValidatorDetails(address: string) {
    const response = await apiClient.get(`/blockchain/validators/${address}`)
    return response.data
  },

  async getStakingInfo() {
    const response = await apiClient.get('/staking/info')
    return response.data
  },

  async getNetworkHealth() {
    const response = await apiClient.get('/blockchain/network/health')
    return response.data
  },

  async claimRewards(validatorAddress: string) {
    const response = await apiClient.post(`/staking/validators/${validatorAddress}/claim-rewards`)
    return response.data
  },

  // ============================================================================
  // ENHANCED ENDPOINTS - PHASE 2 INTEGRATION ADDITIONS
  // ============================================================================

  // Real-World Assets (RWA)
  async getRWAPortfolio(params?: { userId?: string }) {
    const response = await apiClient.get('/rwa/portfolio', { params })
    return response.data
  },

  async getRWATokenization() {
    const response = await apiClient.get('/rwa/tokenization')
    return response.data
  },

  async getRWAFractionalization() {
    const response = await apiClient.get('/rwa/fractionalization')
    return response.data
  },

  async getRWADistribution() {
    const response = await apiClient.get('/rwa/distribution')
    return response.data
  },

  async getRWAValuation() {
    const response = await apiClient.get('/rwa/valuation')
    return response.data
  },

  async getRWAPools() {
    const response = await apiClient.get('/rwa/pools')
    return response.data
  },

  // Gas & Fee Tracking
  async getGasTrends(params?: { period?: '1h' | '24h' | '7d' }) {
    const response = await apiClient.get('/gas/trends', { params })
    return response.data
  },

  async getGasHistory(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/gas/history', { params })
    return response.data
  },

  // Network Topology & Health
  async getNetworkTopology() {
    const response = await apiClient.get('/network/topology')
    return response.data
  },

  async getNetworkStats() {
    const response = await apiClient.get('/network/stats')
    return response.data
  },

  // Consensus & Bridge Monitoring
  async getConsensusState() {
    const response = await apiClient.get('/consensus/state')
    return response.data
  },

  async getBridgeStatistics() {
    const response = await apiClient.get('/bridge/statistics')
    return response.data
  },

  async getBridgeHealth() {
    const response = await apiClient.get('/bridge/health')
    return response.data
  },

  async getBridgeTransfers(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/bridge/transfers', { params })
    return response.data
  },

  // Enterprise Settings & Governance
  async getEnterpriseSettings() {
    const response = await apiClient.get('/enterprise/settings')
    return response.data
  },

  async updateEnterpriseSettings(settings: any) {
    const response = await apiClient.put('/enterprise/settings', settings)
    return response.data
  },

  async getGovernanceProposals(params?: { status?: string; limit?: number }) {
    const response = await apiClient.get('/governance/proposals', { params })
    return response.data
  },

  async voteOnProposal(proposalId: string, vote: 'yes' | 'no' | 'abstain') {
    const response = await apiClient.post(`/governance/proposals/${proposalId}/vote`, { vote })
    return response.data
  },

  // Security & Audit
  async getSecurityAuditLog(params?: { limit?: number; offset?: number; severity?: string }) {
    const response = await apiClient.get('/security/audit-log', { params })
    return response.data
  },

  async getSecurityMetrics() {
    const response = await apiClient.get('/security/metrics')
    return response.data
  },

  // Analytics Dashboard
  async getAnalyticsPeriod(period: '24h' | '7d' | '30d' | '90d' = '24h') {
    const response = await apiClient.get(`/analytics/${period}`)
    return response.data
  },

  async getAnalyticsNetworkUsage() {
    const response = await apiClient.get('/analytics/network-usage')
    return response.data
  },

  async getAnalyticsValidatorEarnings() {
    const response = await apiClient.get('/analytics/validator-earnings')
    return response.data
  },

  // Carbon Tracking
  async getCarbonMetrics() {
    const response = await apiClient.get('/carbon/metrics')
    return response.data
  },

  async getCarbonReport(params?: { startDate?: string; endDate?: string }) {
    const response = await apiClient.get('/carbon/report', { params })
    return response.data
  },

  // Demo & Testing (for development)
  async getDemoById(id: string) {
    const response = await apiClient.get(`/demos/${id}`)
    return response.data
  },

  async startDemo(id: string) {
    const response = await apiClient.post(`/demos/${id}/start`)
    return response.data
  },

  async stopDemo(id: string) {
    const response = await apiClient.post(`/demos/${id}/stop`)
    return response.data
  },

  // Live Data Streaming Endpoints
  async getLiveMetrics() {
    const response = await apiClient.get('/live/metrics')
    return response.data
  },

  async getLiveNetworkStatus() {
    const response = await apiClient.get('/live/network')
    return response.data
  },

  async getLiveTransactions(params?: { limit?: number }) {
    const response = await apiClient.get('/live/transactions', { params })
    return response.data
  },

  // Validator Management
  async getValidatorMetrics(validatorId: string) {
    const response = await apiClient.get(`/validators/${validatorId}/metrics`)
    return response.data
  },

  async getValidatorSlashing() {
    const response = await apiClient.get('/validators/slashing')
    return response.data
  },

  // Blockchain Statistics (Enhanced)
  async getBlockchainStats() {
    const response = await apiClient.get('/blockchain/stats')
    return response.data
  },

  async getBlockchainHealth() {
    const response = await apiClient.get('/blockchain/health')
    return response.data
  },

  async getTransactionStats() {
    const response = await apiClient.get('/blockchain/transactions/stats')
    return response.data
  },

  async getBlockStats() {
    const response = await apiClient.get('/blockchain/blocks/stats')
    return response.data
  },

  // Cryptography & Security (Post-Quantum)
  async getCryptoStatus() {
    const response = await apiClient.get('/crypto/status')
    return response.data
  },

  async getQuantumReadiness() {
    const response = await apiClient.get('/security/quantum-readiness')
    return response.data
  },

  // Configuration & Advanced Features
  async getAdvancedFeatures() {
    const response = await apiClient.get('/advanced/features')
    return response.data
  },

  async getConfigStatus() {
    const response = await apiClient.get('/config/status')
    return response.data
  },

  // Mobile API Endpoints
  async getMobileStatus() {
    const response = await apiClient.get('/mobile/status')
    return response.data
  },

  async getMobileMetrics() {
    const response = await apiClient.get('/mobile/metrics')
    return response.data
  },
}

// ============================================================================
// WEBSOCKET SUPPORT FOR REAL-TIME DATA
// ============================================================================

/**
 * WebSocket connection manager for real-time data streaming
 */
export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private messageHandlers: Map<string, (data: any) => void> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  constructor() {
    const protocol = import.meta.env.PROD ? 'wss' : 'ws'
    const host = import.meta.env.PROD ? 'dlt.aurigraph.io' : 'localhost:9003'
    this.url = `${protocol}://${host}/api/v11/live/stream`
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const { type, payload } = data

            // Call registered handlers for this message type
            const handler = this.messageHandlers.get(type)
            if (handler) {
              handler(payload)
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Reconnect to WebSocket with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`Attempting WebSocket reconnect in ${delay}ms...`)
      setTimeout(() => this.connect(), delay)
    }
  }

  /**
   * Register a handler for a specific message type
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler)
  }

  /**
   * Send a message through WebSocket
   */
  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Export WebSocket manager singleton
export const webSocketManager = new WebSocketManager()

// Export helper functions for use in components
export { retryWithBackoff, safeApiCall }
export type { RetryOptions }

export default apiService