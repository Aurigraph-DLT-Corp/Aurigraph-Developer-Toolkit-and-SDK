/**
 * Phase 1 API Service Extensions
 * Backend Integration for Phase 1 Components
 */

import axios from 'axios'
import type {
  NetworkTopologyData,
  BlockSearchResult,
  BlockSearchFilters,
  ValidatorInfo,
  ValidatorMetrics,
  SlashingEvent,
  AIMetrics,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSummary,
  BridgeStatistics,
  BridgeHealth,
  BridgeTransfer,
  RWAAsset,
  RWAPortfolio,
  RWATransaction,
  RWACompliance,
  PaginatedResponse,
  ApiResponse,
} from '../types/phase1'

const API_BASE_URL = (import.meta as any).env?.PROD
  ? 'https://dlt.aurigraph.io/api/v11'
  : 'http://localhost:9003/api/v11'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
// Network Topology API
// ============================================================================

export const networkTopologyApi = {
  async getTopology(): Promise<NetworkTopologyData> {
    const response = await apiClient.get<ApiResponse<NetworkTopologyData>>(
      '/network/topology'
    )
    return response.data.data
  },

  async getNodeDetails(nodeId: string) {
    const response = await apiClient.get(`/network/nodes/${nodeId}`)
    return response.data.data
  },

  async getNodeConnections(nodeId: string) {
    const response = await apiClient.get(`/network/nodes/${nodeId}/connections`)
    return response.data.data
  },

  async refreshTopology() {
    const response = await apiClient.post('/network/topology/refresh')
    return response.data.data
  },
}

// ============================================================================
// Block Search API
// ============================================================================

export const blockSearchApi = {
  async searchBlocks(
    filters: BlockSearchFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<BlockSearchResult> {
    const response = await apiClient.post<ApiResponse<BlockSearchResult>>(
      '/blockchain/blocks/search',
      { filters, page, pageSize }
    )
    return response.data.data
  },

  async getBlockByHeight(height: number) {
    const response = await apiClient.get(`/blockchain/blocks/${height}`)
    return response.data.data
  },

  async getBlockByHash(hash: string) {
    const response = await apiClient.get(`/blockchain/blocks/hash/${hash}`)
    return response.data.data
  },

  async getLatestBlocks(limit: number = 10) {
    const response = await apiClient.get(`/blockchain/blocks/latest`, {
      params: { limit },
    })
    return response.data.data
  },

  async getBlockTransactions(height: number) {
    const response = await apiClient.get(
      `/blockchain/blocks/${height}/transactions`
    )
    return response.data.data
  },
}

// ============================================================================
// Validator Performance API
// ============================================================================

export const validatorApi = {
  async getAllValidators(): Promise<ValidatorInfo[]> {
    const response = await apiClient.get<ApiResponse<ValidatorInfo[]>>(
      '/validators'
    )
    return response.data.data
  },

  async getValidator(id: string): Promise<ValidatorInfo> {
    const response = await apiClient.get<ApiResponse<ValidatorInfo>>(
      `/validators/${id}`
    )
    return response.data.data
  },

  async getValidatorMetrics(): Promise<ValidatorMetrics> {
    const response = await apiClient.get<ApiResponse<ValidatorMetrics>>(
      '/validators/metrics'
    )
    return response.data.data
  },

  async getSlashingEvents(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<SlashingEvent>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<SlashingEvent>>
    >('/validators/slashing-events', {
      params: { page, pageSize },
    })
    return response.data.data
  },

  async getValidatorSlashingEvents(validatorId: string) {
    const response = await apiClient.get(
      `/validators/${validatorId}/slashing-events`
    )
    return response.data.data
  },

  async slashValidator(validatorId: string, reason: string, amount: number) {
    const response = await apiClient.post(`/validators/${validatorId}/slash`, {
      reason,
      amount,
    })
    return response.data.data
  },

  async unjailValidator(validatorId: string) {
    const response = await apiClient.post(`/validators/${validatorId}/unjail`)
    return response.data.data
  },
}

// ============================================================================
// AI Model Metrics API
// ============================================================================

export const aiMetricsApi = {
  async getAIMetrics(): Promise<AIMetrics> {
    const response = await apiClient.get<ApiResponse<AIMetrics>>('/ai/metrics')
    return response.data.data
  },

  async getModelDetails(modelId: string) {
    const response = await apiClient.get(`/ai/models/${modelId}`)
    return response.data.data
  },

  async getModelPredictions(modelId: string, limit: number = 100) {
    const response = await apiClient.get(`/ai/models/${modelId}/predictions`, {
      params: { limit },
    })
    return response.data.data
  },

  async getModelPerformance(modelId: string, timeRange: string = '24h') {
    const response = await apiClient.get(`/ai/models/${modelId}/performance`, {
      params: { timeRange },
    })
    return response.data.data
  },

  async retrainModel(modelId: string) {
    const response = await apiClient.post(`/ai/models/${modelId}/retrain`)
    return response.data.data
  },

  async toggleModel(modelId: string, enabled: boolean) {
    const response = await apiClient.put(`/ai/models/${modelId}/status`, {
      enabled,
    })
    return response.data.data
  },
}

// ============================================================================
// Audit Log API
// ============================================================================

export const auditLogApi = {
  async getAuditLogs(
    filters: AuditLogFilters,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    const response = await apiClient.post<
      ApiResponse<PaginatedResponse<AuditLogEntry>>
    >('/audit/logs', {
      filters,
      page,
      pageSize,
    })
    return response.data.data
  },

  async getAuditLogSummary(
    dateFrom?: string,
    dateTo?: string
  ): Promise<AuditLogSummary> {
    const response = await apiClient.get<ApiResponse<AuditLogSummary>>(
      '/audit/summary',
      {
        params: { dateFrom, dateTo },
      }
    )
    return response.data.data
  },

  async getAuditLogEntry(id: string): Promise<AuditLogEntry> {
    const response = await apiClient.get<ApiResponse<AuditLogEntry>>(
      `/audit/logs/${id}`
    )
    return response.data.data
  },

  async exportAuditLogs(filters: AuditLogFilters, format: 'csv' | 'json') {
    const response = await apiClient.post(
      '/audit/logs/export',
      { filters, format },
      { responseType: 'blob' }
    )
    return response.data
  },
}

// ============================================================================
// Bridge Status API
// ============================================================================

export const bridgeApi = {
  async getBridgeStatistics(): Promise<BridgeStatistics> {
    const response = await apiClient.get<ApiResponse<BridgeStatistics>>(
      '/bridge/statistics'
    )
    return response.data.data
  },

  async getBridgeHealth(): Promise<BridgeHealth> {
    const response = await apiClient.get<ApiResponse<BridgeHealth>>(
      '/bridge/health'
    )
    return response.data.data
  },

  async getChains() {
    const response = await apiClient.get('/bridge/chains')
    return response.data.data
  },

  async getChainStatus(chainId: string) {
    const response = await apiClient.get(`/bridge/chains/${chainId}/status`)
    return response.data.data
  },

  async getTransfers(
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<PaginatedResponse<BridgeTransfer>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<BridgeTransfer>>
    >('/bridge/transfers', {
      params: { page, pageSize, status },
    })
    return response.data.data
  },

  async getTransfer(id: string): Promise<BridgeTransfer> {
    const response = await apiClient.get<ApiResponse<BridgeTransfer>>(
      `/bridge/transfers/${id}`
    )
    return response.data.data
  },

  async retryTransfer(id: string) {
    const response = await apiClient.post(`/bridge/transfers/${id}/retry`)
    return response.data.data
  },

  async getLiquidity() {
    const response = await apiClient.get('/bridge/liquidity')
    return response.data.data
  },
}

// ============================================================================
// RWA Asset Manager API
// ============================================================================

export const rwaApi = {
  async getAssets(
    page: number = 1,
    pageSize: number = 20,
    assetType?: string,
    status?: string
  ): Promise<PaginatedResponse<RWAAsset>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<RWAAsset>>
    >('/rwa/assets', {
      params: { page, pageSize, assetType, status },
    })
    return response.data.data
  },

  async getAsset(id: string): Promise<RWAAsset> {
    const response = await apiClient.get<ApiResponse<RWAAsset>>(
      `/rwa/assets/${id}`
    )
    return response.data.data
  },

  async createAsset(assetData: Partial<RWAAsset>) {
    const response = await apiClient.post('/rwa/assets', assetData)
    return response.data.data
  },

  async updateAsset(id: string, assetData: Partial<RWAAsset>) {
    const response = await apiClient.put(`/rwa/assets/${id}`, assetData)
    return response.data.data
  },

  async getPortfolio(): Promise<RWAPortfolio> {
    const response = await apiClient.get<ApiResponse<RWAPortfolio>>(
      '/rwa/portfolio'
    )
    return response.data.data
  },

  async getAssetTransactions(
    assetId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<RWATransaction>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<RWATransaction>>
    >(`/rwa/assets/${assetId}/transactions`, {
      params: { page, pageSize },
    })
    return response.data.data
  },

  async mintTokens(assetId: string, amount: number, recipient: string) {
    const response = await apiClient.post(`/rwa/assets/${assetId}/mint`, {
      amount,
      recipient,
    })
    return response.data.data
  },

  async burnTokens(assetId: string, amount: number) {
    const response = await apiClient.post(`/rwa/assets/${assetId}/burn`, {
      amount,
    })
    return response.data.data
  },

  async getCompliance(assetId: string): Promise<RWACompliance> {
    const response = await apiClient.get<ApiResponse<RWACompliance>>(
      `/rwa/assets/${assetId}/compliance`
    )
    return response.data.data
  },

  async updateValuation(assetId: string, newValue: number, method: string) {
    const response = await apiClient.post(
      `/rwa/assets/${assetId}/valuation`,
      {
        value: newValue,
        method,
      }
    )
    return response.data.data
  },

  async freezeAsset(assetId: string, reason: string) {
    const response = await apiClient.post(`/rwa/assets/${assetId}/freeze`, {
      reason,
    })
    return response.data.data
  },

  async unfreezeAsset(assetId: string) {
    const response = await apiClient.post(`/rwa/assets/${assetId}/unfreeze`)
    return response.data.data
  },
}

export default {
  networkTopologyApi,
  blockSearchApi,
  validatorApi,
  aiMetricsApi,
  auditLogApi,
  bridgeApi,
  rwaApi,
}
