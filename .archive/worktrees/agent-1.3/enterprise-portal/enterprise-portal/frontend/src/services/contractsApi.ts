/**
 * Smart Contracts API Service
 *
 * REST API client for smart contract operations
 */

import { API_BASE_URL } from '../utils/constants';

export interface Contract {
  id: string;
  name: string;
  channelId: string;
  address?: string;
  deployedBy: string;
  deployedAt: string;
  status: 'deployed' | 'pending' | 'failed' | 'auditing';
  code?: string;
  abi?: any[];
  bytecode?: string;
  verified?: boolean;
  audited?: boolean;
  auditReport?: {
    status: 'passed' | 'failed' | 'pending';
    issues: number;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    details?: string;
  };
  metrics?: {
    transactions?: number;
    gasUsed?: number;
    holders?: number;
    totalValue?: number;
  };
}

export interface DeployContractRequest {
  templateId: string;
  name: string;
  channelId: string;
  deployedBy: string;
  parameters: Record<string, any>;
  sourceCode?: string;
  language?: 'solidity' | 'vyper' | 'rust' | 'go' | 'javascript';
}

export interface ContractResponse {
  success: boolean;
  contract?: Contract;
  error?: string;
}

export interface ContractsListResponse {
  contracts: Contract[];
  total: number;
}

class ContractsApiService {
  private baseUrl: string;
  private demoMode: boolean;
  private abortControllers: AbortController[] = [];

  constructor(baseUrl: string = API_BASE_URL, demoMode: boolean = false) {
    this.baseUrl = baseUrl;
    this.demoMode = demoMode;
  }

  /**
   * Enable or disable demo mode
   */
  setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
  }

  /**
   * Fetch with retry logic and abort support
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    const controller = new AbortController();
    this.abortControllers.push(controller);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          const result = await response.json();
          // Remove controller after successful fetch
          this.abortControllers = this.abortControllers.filter((c) => c !== controller);
          return result;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error;
        }
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          // Remove controller after all retries failed
          this.abortControllers = this.abortControllers.filter((c) => c !== controller);
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers = [];
  }

  /**
   * Get all contracts
   */
  async getContracts(channelId?: string): Promise<ContractsListResponse> {
    if (this.demoMode) {
      return {
        contracts: this.generateMockContracts(),
        total: 12,
      };
    }

    try {
      const endpoint = channelId
        ? `/api/v11/contracts?channelId=${channelId}`
        : '/api/v11/contracts';
      return await this.fetchWithRetry<ContractsListResponse>(endpoint);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      // Return empty list on error - NO FALLBACK DATA in production
      return { contracts: [], total: 0 };
    }
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    if (this.demoMode) {
      const contracts = this.generateMockContracts();
      return contracts.find((c) => c.id === contractId) || null;
    }

    try {
      return await this.fetchWithRetry<Contract>(`/api/v11/contracts/${contractId}`);
    } catch (error) {
      console.error(`Failed to fetch contract ${contractId}:`, error);
      return null;
    }
  }

  /**
   * Deploy a new smart contract
   */
  async deployContract(request: DeployContractRequest): Promise<ContractResponse> {
    if (this.demoMode) {
      const mockContract = this.generateMockContract(request.name, request.channelId);
      return {
        success: true,
        contract: mockContract,
      };
    }

    try {
      const response = await this.fetchWithRetry<ContractResponse>('/api/v11/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error: any) {
      console.error('Failed to deploy contract:', error);
      return {
        success: false,
        error: error.message || 'Deployment failed',
      };
    }
  }

  /**
   * Verify contract source code
   */
  async verifyContract(
    contractId: string,
    sourceCode: string
  ): Promise<{ success: boolean; verified?: boolean }> {
    if (this.demoMode) {
      return { success: true, verified: true };
    }

    try {
      return await this.fetchWithRetry<{ success: boolean; verified: boolean }>(
        `/api/v11/contracts/${contractId}/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ sourceCode }),
        }
      );
    } catch (error) {
      console.error(`Failed to verify contract ${contractId}:`, error);
      return { success: false };
    }
  }

  /**
   * Run security audit on contract
   */
  async auditContract(contractId: string): Promise<{ success: boolean; auditReport?: any }> {
    if (this.demoMode) {
      return {
        success: true,
        auditReport: {
          status: 'passed',
          issues: Math.floor(Math.random() * 3),
          severity: 'low',
          details: 'No critical vulnerabilities found',
        },
      };
    }

    try {
      return await this.fetchWithRetry<{ success: boolean; auditReport: any }>(
        `/api/v11/contracts/${contractId}/audit`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      console.error(`Failed to audit contract ${contractId}:`, error);
      return { success: false };
    }
  }

  /**
   * Get contract metrics
   */
  async getContractMetrics(contractId: string): Promise<any> {
    if (this.demoMode) {
      return {
        transactions: Math.floor(Math.random() * 10000) + 1000,
        gasUsed: Math.floor(Math.random() * 1000000) + 100000,
        holders: Math.floor(Math.random() * 500) + 50,
        totalValue: Math.floor(Math.random() * 10000000) + 100000,
      };
    }

    try {
      return await this.fetchWithRetry<any>(`/api/v11/contracts/${contractId}/metrics`);
    } catch (error) {
      console.error(`Failed to fetch metrics for contract ${contractId}:`, error);
      return null;
    }
  }

  // ==========================================================================
  // Mock Data Generators (Demo Mode)
  // ==========================================================================

  private generateMockContracts(): Contract[] {
    const names = [
      'AuriToken ERC-20',
      'NFT Marketplace',
      'Multi-Sig Wallet',
      'Lending Protocol',
      'Governance DAO',
      'Staking Pool',
      'DEX Router',
      'Oracle Price Feed',
      'Insurance Pool',
      'Asset Bridge',
      'Voting System',
      'Payment Gateway',
    ];

    const channels = ['main', 'finance', 'supply-chain', 'iot', 'governance'];
    const statuses: ('deployed' | 'pending' | 'failed' | 'auditing')[] = [
      'deployed',
      'deployed',
      'deployed',
      'pending',
      'auditing',
    ];

    return names.map((name, i) => ({
      id: `contract-${i + 1}`,
      name,
      channelId: channels[i % channels.length] ?? 'main',
      address: i < 10 ? '0x' + Math.random().toString(16).substring(2, 42) : undefined,
      deployedBy: '0x' + Math.random().toString(16).substring(2, 42),
      deployedAt: new Date(Date.now() - i * 3600000 * 24).toISOString(),
      status: statuses[i % statuses.length] ?? 'deployed',
      code: `pragma solidity ^0.8.0;\n\ncontract ${name.replace(/\s+/g, '')} {\n    // Contract implementation\n}`,
      verified: i % 2 === 0,
      audited: i % 3 === 0,
      auditReport:
        i % 3 === 0
          ? {
              status: 'passed' as const,
              issues: Math.floor(Math.random() * 3),
              severity: 'low' as const,
              details: 'Security audit completed successfully',
            }
          : undefined,
      metrics: {
        transactions: Math.floor(Math.random() * 10000) + 500,
        gasUsed: Math.floor(Math.random() * 1000000) + 50000,
        holders: Math.floor(Math.random() * 500) + 10,
        totalValue: Math.floor(Math.random() * 10000000) + 100000,
      },
    }));
  }

  private generateMockContract(name: string, channelId: string): Contract {
    return {
      id: `contract-${Date.now()}`,
      name,
      channelId,
      address: '0x' + Math.random().toString(16).substring(2, 42),
      deployedBy: '0xCurrentUser',
      deployedAt: new Date().toISOString(),
      status: 'deployed',
      code: `pragma solidity ^0.8.0;\n\ncontract ${name.replace(/\s+/g, '')} {\n    // Contract implementation\n}`,
      verified: false,
      audited: false,
      metrics: {
        transactions: 0,
        gasUsed: 0,
        holders: 0,
        totalValue: 0,
      },
    };
  }
}

// Export singleton instance
export const contractsApi = new ContractsApiService();
export default ContractsApiService;
