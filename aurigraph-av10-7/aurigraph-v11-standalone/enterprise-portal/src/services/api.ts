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
  return config
})

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

export const apiService = {
  // Health & Info
  async getHealth() {
    const response = await apiClient.get('/health')
    return response.data
  },

  async getInfo() {
    const response = await apiClient.get('/info')
    return response.data
  },

  // Metrics
  async getMetrics() {
    const response = await apiClient.get('/blockchain/stats')
    return response.data
  },

  async getPerformance() {
    const response = await apiClient.get('/performance')
    return response.data
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
    const response = await apiClient.get('/ai/performance')
    return response.data
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
    const response = await apiClient.get('/tokens/statistics')
    return response.data
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
}

// Export helper functions for use in components
export { retryWithBackoff, safeApiCall }
export type { RetryOptions }

export default apiService