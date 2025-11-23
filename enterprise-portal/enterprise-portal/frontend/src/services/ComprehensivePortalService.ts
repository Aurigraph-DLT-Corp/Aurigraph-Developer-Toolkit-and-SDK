/**
 * Comprehensive Portal Service
 *
 * API client for blockchain explorer, validators, AI optimization,
 * quantum security, and cross-chain bridge endpoints
 */

import { API_BASE_URL } from '../utils/constants';
import type {
  Transaction,
  Block,
  Validator,
  AIModel,
  AIOptimizationMetrics,
  QuantumSecurityStatus,
  CryptoKey,
  SecurityMetrics,
  BridgeStatus,
  CrossChainTransfer,
  SupportedChain,
  PaginatedResponse,
  ApiResponse,
} from '../types/comprehensive';

class ComprehensivePortalService {
  private baseUrl: string;
  private demoMode: boolean;

  constructor(baseUrl: string = API_BASE_URL, demoMode: boolean = false) {
    this.baseUrl = baseUrl;
    this.demoMode = demoMode;
  }

  /**
   * Enable or disable demo mode
   */
  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          return await response.json();
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  // ==========================================================================
  // Transaction Explorer API
  // ==========================================================================

  /**
   * Get transactions with pagination and filters
   * Connects to Phase2BlockchainResource.java
   */
  async getTransactions(
    page: number = 1,
    pageSize: number = 20,
    filters?: any
  ): Promise<PaginatedResponse<Transaction>> {
    if (this.demoMode) {
      // Return mock data in demo mode
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });

    return this.fetchWithRetry<PaginatedResponse<Transaction>>(
      `/api/v11/blockchain/transactions?${queryParams}`
    );
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<ApiResponse<Transaction>> {
    if (this.demoMode) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    return this.fetchWithRetry<ApiResponse<Transaction>>(
      `/api/v11/blockchain/transactions/${hash}`
    );
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/blockchain/transactions/stats`);
  }

  // ==========================================================================
  // Block Explorer API
  // ==========================================================================

  /**
   * Get recent blocks
   */
  async getBlocks(limit: number = 20): Promise<Block[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<Block[]>(`/api/v11/blockchain/blocks?limit=${limit}`);
  }

  /**
   * Get block by height
   */
  async getBlock(height: number): Promise<ApiResponse<Block>> {
    if (this.demoMode) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    return this.fetchWithRetry<ApiResponse<Block>>(`/api/v11/blockchain/blocks/${height}`);
  }

  /**
   * Get chain information
   */
  async getChainInfo(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/blockchain/chain/info`);
  }

  /**
   * Get consensus metrics
   */
  async getConsensusMetrics(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/consensus/metrics`);
  }

  // ==========================================================================
  // Validator API
  // ==========================================================================

  /**
   * Get all validators
   * Connects to Phase2ValidatorResource.java
   */
  async getValidators(): Promise<Validator[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<Validator[]>(`/api/v11/validators`);
  }

  /**
   * Get validator by ID
   */
  async getValidator(id: string): Promise<ApiResponse<Validator>> {
    if (this.demoMode) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    return this.fetchWithRetry<ApiResponse<Validator>>(`/api/v11/validators/${id}`);
  }

  /**
   * Get staking information
   */
  async getStakingInfo(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/validators/staking/info`);
  }

  /**
   * Stake tokens to a validator
   */
  async stakeTokens(validatorId: string, amount: number, lockPeriod?: string): Promise<any> {
    if (this.demoMode) {
      return { success: true };
    }

    return this.fetchWithRetry(`/api/v11/validators/${validatorId}/stake`, {
      method: 'POST',
      body: JSON.stringify({ amount, lockPeriod }),
    });
  }

  // ==========================================================================
  // AI Optimization API
  // ==========================================================================

  /**
   * Get AI models
   * Connects to ai/AIOptimizationService.java
   */
  async getAIModels(): Promise<AIModel[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<AIModel[]>(`/api/v11/ai/models`);
  }

  /**
   * Get AI optimization metrics
   */
  async getAIMetrics(): Promise<AIOptimizationMetrics> {
    if (this.demoMode) {
      return {} as AIOptimizationMetrics;
    }

    return this.fetchWithRetry<AIOptimizationMetrics>(`/api/v11/ai/metrics`);
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/ai/predictions`);
  }

  /**
   * Retrain AI model
   */
  async retrainModel(modelId: string): Promise<any> {
    if (this.demoMode) {
      return { success: true };
    }

    return this.fetchWithRetry(`/api/v11/ai/models/${modelId}/retrain`, {
      method: 'POST',
    });
  }

  // ==========================================================================
  // Quantum Security API
  // ==========================================================================

  /**
   * Get security status
   * Connects to crypto/QuantumCryptoService.java
   */
  async getSecurityStatus(): Promise<QuantumSecurityStatus> {
    if (this.demoMode) {
      return {} as QuantumSecurityStatus;
    }

    return this.fetchWithRetry<QuantumSecurityStatus>(`/api/v11/security/status`);
  }

  /**
   * Get cryptographic keys
   */
  async getCryptoKeys(): Promise<CryptoKey[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<CryptoKey[]>(`/api/v11/security/keys`);
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    if (this.demoMode) {
      return {} as SecurityMetrics;
    }

    return this.fetchWithRetry<SecurityMetrics>(`/api/v11/security/metrics`);
  }

  /**
   * Get security audits
   */
  async getSecurityAudits(): Promise<any[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<any[]>(`/api/v11/security/audits`);
  }

  /**
   * Rotate cryptographic keys
   */
  async rotateKeys(): Promise<any> {
    if (this.demoMode) {
      return { success: true };
    }

    return this.fetchWithRetry(`/api/v11/security/keys/rotate`, {
      method: 'POST',
    });
  }

  // ==========================================================================
  // Cross-Chain Bridge API
  // ==========================================================================

  /**
   * Get bridge statuses
   * Connects to bridge/CrossChainBridgeService.java
   */
  async getBridges(): Promise<BridgeStatus[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<BridgeStatus[]>(`/api/v11/bridge/bridges`);
  }

  /**
   * Get cross-chain transfers
   */
  async getTransfers(page: number = 1, pageSize: number = 20): Promise<CrossChainTransfer[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<CrossChainTransfer[]>(
      `/api/v11/bridge/transfers?page=${page}&pageSize=${pageSize}`
    );
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<SupportedChain[]> {
    if (this.demoMode) {
      return [];
    }

    return this.fetchWithRetry<SupportedChain[]>(`/api/v11/bridge/chains`);
  }

  /**
   * Get bridge metrics
   */
  async getBridgeMetrics(): Promise<any> {
    if (this.demoMode) {
      return {};
    }

    return this.fetchWithRetry(`/api/v11/bridge/metrics`);
  }

  /**
   * Create cross-chain transfer
   */
  async createTransfer(transfer: {
    sourceChain: string;
    targetChain: string;
    token: string;
    amount: number;
    recipient: string;
  }): Promise<any> {
    if (this.demoMode) {
      return { success: true, transferId: `mock-${Date.now()}` };
    }

    return this.fetchWithRetry(`/api/v11/bridge/transfers`, {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(id: string): Promise<ApiResponse<CrossChainTransfer>> {
    if (this.demoMode) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    return this.fetchWithRetry<ApiResponse<CrossChainTransfer>>(`/api/v11/bridge/transfers/${id}`);
  }
}

// Export singleton instance
export const comprehensivePortalService = new ComprehensivePortalService();
export default ComprehensivePortalService;
