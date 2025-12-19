/**
 * Contracts API Service
 * Handles all Smart Contracts Registry API interactions
 */

// Use environment variable for API URL - ensures HTTPS in production
const getApiBaseUrl = (): string => {
  const env = (import.meta as any).env || {};
  if (env.VITE_API_URL) return env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return 'http://localhost:9003';
};
const API_BASE_URL = getApiBaseUrl()
const API_TIMEOUT = Number((import.meta as any).env?.VITE_API_TIMEOUT) || 30000

// ============================================================================
// TYPES
// ============================================================================

export interface Contract {
  id: string
  name: string
  templateId: string
  channelId: string
  status: 'deployed' | 'pending' | 'failed' | 'auditing'
  address?: string
  deployedBy: string
  deployedAt: string
  verified: boolean
  audited: boolean
  auditReport?: any
  code?: string
  parameters?: Record<string, any>
  metrics?: {
    transactions?: number
    holders?: number
    totalValue?: number
    gasUsed?: number
  }
}

export interface ContractTemplate {
  id: string
  name: string
  category: string
  description: string
  language: string
  code: string
  parameters: string[]
}

export interface ContractStatistics {
  totalContracts: number
  totalDeployed: number
  totalVerified: number
  totalAudited: number
  byTemplate?: Record<string, number>
  templates?: number
}

export interface DeployContractRequest {
  templateId: string
  name: string
  channelId: string
  deployedBy: string
  parameters?: Record<string, any>
}

export interface DeployContractResponse {
  success: boolean
  contractId: string
  address: string
  contract: Contract
}

export interface ContractsListResponse {
  contracts: Contract[]
  count: number
  totalDeployed: number
}

export interface ContractFilters {
  channelId?: string
  status?: string
}

// ============================================================================
// API CLIENT
// ============================================================================

class ContractsApiClient {
  private baseUrl: string
  private abortControllers: Map<string, AbortController>

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.abortControllers = new Map()
  }

  /**
   * Create AbortController for request cancellation
   */
  private createAbortController(key: string): AbortSignal {
    // Cancel previous request with same key
    this.abortControllers.get(key)?.abort()

    const controller = new AbortController()
    this.abortControllers.set(key, controller)
    return controller.signal
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    abortKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const signal = abortKey ? this.createAbortController(abortKey) : undefined

    try {
      const response = await fetch(url, {
        ...options,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request cancelled: ${endpoint}`)
        throw new Error('Request cancelled')
      }
      throw error
    } finally {
      if (abortKey) {
        this.abortControllers.delete(abortKey)
      }
    }
  }

  /**
   * Get all contracts with optional filters
   */
  async getContracts(filters?: ContractFilters): Promise<ContractsListResponse> {
    const params = new URLSearchParams()
    if (filters?.channelId) params.append('channelId', filters.channelId)
    if (filters?.status) params.append('status', filters.status)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.fetch<ContractsListResponse>(
      `/api/v12/contracts${query}`,
      {},
      'getContracts'
    )
  }

  /**
   * Get single contract by ID
   */
  async getContract(contractId: string): Promise<Contract> {
    return this.fetch<Contract>(`/api/v12/contracts/${contractId}`)
  }

  /**
   * Get contract statistics
   */
  async getStatistics(): Promise<ContractStatistics> {
    return this.fetch<ContractStatistics>(
      '/api/v12/contracts/statistics',
      {},
      'getStatistics'
    )
  }

  /**
   * Get all contract templates
   */
  async getTemplates(): Promise<{ templates: ContractTemplate[]; count: number }> {
    return this.fetch('/api/v12/contracts/templates')
  }

  /**
   * Get single template by ID
   */
  async getTemplate(templateId: string): Promise<ContractTemplate> {
    return this.fetch<ContractTemplate>(`/api/v12/contracts/templates/${templateId}`)
  }

  /**
   * Deploy new contract
   */
  async deployContract(request: DeployContractRequest): Promise<DeployContractResponse> {
    return this.fetch<DeployContractResponse>('/api/v12/contracts/deploy', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Verify contract
   */
  async verifyContract(contractId: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/v12/contracts/${contractId}/verify`, {
      method: 'POST',
    })
  }

  /**
   * Audit contract
   */
  async auditContract(
    contractId: string,
    auditData: Record<string, any>
  ): Promise<{ success: boolean }> {
    return this.fetch(`/api/v12/contracts/${contractId}/audit`, {
      method: 'POST',
      body: JSON.stringify(auditData),
    })
  }

  /**
   * Execute contract method
   */
  async executeContract(
    contractId: string,
    executionData: Record<string, any>
  ): Promise<{ success: boolean; transactionHash: string }> {
    return this.fetch(`/api/v12/contracts/${contractId}/execute`, {
      method: 'POST',
      body: JSON.stringify(executionData),
    })
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const contractsApi = new ContractsApiClient(API_BASE_URL)

// ============================================================================
// HOOKS-COMPATIBLE WRAPPER
// ============================================================================

/**
 * Get contracts with automatic cleanup
 */
export const useContractsApi = () => {
  return {
    getContracts: (filters?: ContractFilters) => contractsApi.getContracts(filters),
    getContract: (contractId: string) => contractsApi.getContract(contractId),
    getStatistics: () => contractsApi.getStatistics(),
    getTemplates: () => contractsApi.getTemplates(),
    getTemplate: (templateId: string) => contractsApi.getTemplate(templateId),
    deployContract: (request: DeployContractRequest) => contractsApi.deployContract(request),
    verifyContract: (contractId: string) => contractsApi.verifyContract(contractId),
    auditContract: (contractId: string, auditData: Record<string, any>) =>
      contractsApi.auditContract(contractId, auditData),
    executeContract: (contractId: string, executionData: Record<string, any>) =>
      contractsApi.executeContract(contractId, executionData),
    cancelAll: () => contractsApi.cancelAll(),
  }
}

export default contractsApi
