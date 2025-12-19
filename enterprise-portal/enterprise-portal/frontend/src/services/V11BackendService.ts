/**
 * V11 Backend Service
 *
 * REST API client for Aurigraph V11 backend with retry logic and demo mode
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  HealthCheckResponse,
  SystemInfoResponse,
  PerformanceMetrics,
  ConsensusStats,
  TransactionStats,
  StatsResponse,
} from '../types/api';
import { API_BASE_URL } from '../utils/constants';

// Additional types for pagination and filters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface TransactionFilters extends PaginationParams {
  status?: 'pending' | 'confirmed' | 'failed';
  type?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface BlockFilters extends PaginationParams {
  startHeight?: number;
  endHeight?: number;
  validatorId?: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  blockHeight?: number;
  from: string;
  to: string;
  amount: number;
  fee: number;
  data?: Record<string, any>;
}

export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  validatorId: string;
  transactionCount: number;
  transactions: string[]; // Transaction IDs
  stateRoot: string;
  size: number;
}

export interface Validator {
  id: string;
  address: string;
  publicKey: string;
  stake: number;
  status: 'active' | 'inactive' | 'jailed';
  commission: number;
  uptime: number;
  blocksProposed: number;
  lastBlockTime?: string;
}

export interface SubmitTransactionRequest {
  type: string;
  from: string;
  to: string;
  amount: number;
  data?: Record<string, any>;
  signature: string;
}

export interface SubmitTransactionResponse {
  transactionId: string;
  hash: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  timestamp: string;
}

class V11BackendService {
  private baseUrl: string;
  private demoMode: boolean;
  private client: AxiosInstance;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // CRITICAL: Demo mode is ALWAYS disabled - only use real backend API
    this.demoMode = false;

    // Create axios client with interceptors
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('V11 Backend API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Enable or disable demo mode
   * DISABLED: Demo mode is permanently disabled - only real API data allowed
   */
  setDemoMode(_enabled: boolean) {
    // Demo mode is permanently disabled
    this.demoMode = false;
    console.warn('Demo mode is permanently disabled. Only real backend API data is used.');
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
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Get health check status
   */
  async getHealth(): Promise<HealthCheckResponse> {
    if (this.demoMode) {
      return this.generateMockHealth();
    }
    return this.fetchWithRetry<HealthCheckResponse>('/api/v11/health');
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    if (this.demoMode) {
      return this.generateMockSystemInfo();
    }
    return this.fetchWithRetry<SystemInfoResponse>('/api/v11/info');
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (this.demoMode) {
      return this.generateMockPerformanceMetrics();
    }
    return this.fetchWithRetry<PerformanceMetrics>('/api/v11/performance');
  }

  /**
   * Get all statistics
   */
  async getStats(): Promise<StatsResponse> {
    if (this.demoMode) {
      return {
        timestamp: new Date().toISOString(),
        performance: this.generateMockPerformanceMetrics(),
        consensus: this.generateMockConsensusStats(),
        transactions: this.generateMockTransactionStats(),
        channels: {
          totalChannels: 10,
          activeChannels: 8,
          totalConnections: 32,
          activeConnections: 28,
          totalPacketsTransferred: 1500000,
          totalBytesTransferred: 75000000,
          avgLatencyMs: 12.5,
          channelsByAlgorithm: {
            'round-robin': 4,
            'least-connections': 3,
            random: 2,
            'hash-based': 1,
          },
        },
        network: {
          totalNodes: 25,
          activeNodes: 22,
          nodesByType: {
            channel: 8,
            validator: 10,
            business: 5,
            slim: 2,
          },
          totalConnections: 100,
          networkLatencyMs: 15.2,
          bandwidthUtilization: 0.65,
        },
      };
    }
    return this.fetchWithRetry<StatsResponse>('/api/v11/stats');
  }

  /**
   * Get transactions with pagination and filtering
   *
   * @param filters - Transaction filter parameters
   * @returns Paginated list of transactions
   */
  async getTransactions(filters?: TransactionFilters): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    if (this.demoMode) {
      return this.generateMockTransactions(filters);
    }

    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());

    return this.fetchWithRetry(`/api/v11/transactions?${params.toString()}`);
  }

  /**
   * Get blocks with pagination and filtering
   *
   * @param filters - Block filter parameters
   * @returns Paginated list of blocks
   */
  async getBlocks(filters?: BlockFilters): Promise<{
    data: Block[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    if (this.demoMode) {
      return this.generateMockBlocks(filters);
    }

    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.startHeight !== undefined) params.append('startHeight', filters.startHeight.toString());
    if (filters?.endHeight !== undefined) params.append('endHeight', filters.endHeight.toString());
    if (filters?.validatorId) params.append('validatorId', filters.validatorId);

    return this.fetchWithRetry(`/api/v11/blocks?${params.toString()}`);
  }

  /**
   * Get validators
   *
   * @returns List of validators
   */
  async getValidators(): Promise<Validator[]> {
    if (this.demoMode) {
      return this.generateMockValidators();
    }
    return this.fetchWithRetry('/api/v11/validators');
  }

  /**
   * Submit a transaction
   *
   * @param transaction - Transaction data to submit
   * @returns Transaction submission response
   */
  async submitTransaction(transaction: SubmitTransactionRequest): Promise<SubmitTransactionResponse> {
    if (this.demoMode) {
      return this.generateMockSubmitResponse(transaction);
    }

    try {
      const response = await this.client.post<SubmitTransactionResponse>(
        '/api/v11/transactions',
        transaction
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to submit transaction: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  // ==========================================================================
  // Mock Data Generators (Demo Mode)
  // ==========================================================================

  private generateMockHealth(): HealthCheckResponse {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: '11.0.0',
      uptime: Math.floor(Math.random() * 86400) + 3600,
      checks: {
        database: 'UP',
        consensus: 'UP',
        network: 'UP',
      },
    };
  }

  private generateMockSystemInfo(): SystemInfoResponse {
    return {
      version: '11.0.0',
      buildTime: '2025-10-09T12:00:00Z',
      javaVersion: '21.0.1',
      quarkusVersion: '3.26.2',
      graalvmVersion: '21.0.1',
      nativeImage: true,
      platform: 'Linux',
      architecture: 'x86_64',
      availableProcessors: 16,
      totalMemory: 16777216000,
      freeMemory: 8388608000,
      maxMemory: 16777216000,
    };
  }

  private generateMockPerformanceMetrics(): PerformanceMetrics {
    const baseTps = 2000000 + Math.random() * 500000;
    return {
      timestamp: new Date().toISOString(),
      tps: baseTps + (Math.random() - 0.5) * 100000,
      avgTps: baseTps,
      peakTps: baseTps * 1.2,
      totalTransactions: Math.floor(Math.random() * 10000000) + 5000000,
      activeTransactions: Math.floor(Math.random() * 1000) + 500,
      pendingTransactions: Math.floor(Math.random() * 500),
      confirmedTransactions: Math.floor(Math.random() * 9000000) + 4500000,
      failedTransactions: Math.floor(Math.random() * 1000),
      avgLatencyMs: 10 + Math.random() * 5,
      p50LatencyMs: 8 + Math.random() * 3,
      p95LatencyMs: 15 + Math.random() * 5,
      p99LatencyMs: 20 + Math.random() * 10,
      memoryUsageMb: 256 + Math.random() * 256,
      cpuUsagePercent: 40 + Math.random() * 30,
    };
  }

  private generateMockConsensusStats(): ConsensusStats {
    return {
      currentTerm: Math.floor(Math.random() * 1000) + 100,
      blockHeight: Math.floor(Math.random() * 100000) + 50000,
      commitIndex: Math.floor(Math.random() * 100000) + 49900,
      lastApplied: Math.floor(Math.random() * 100000) + 49900,
      leaderNodeId: `validator-${Math.floor(Math.random() * 10) + 1}`,
      validatorCount: 10,
      activeValidators: 9 + Math.floor(Math.random() * 2),
      totalLeaderChanges: Math.floor(Math.random() * 50) + 10,
      avgFinalityLatencyMs: 50 + Math.random() * 20,
      consensusState: Math.random() > 0.9 ? 'PROPOSING' : 'IDLE',
    };
  }

  private generateMockTransactionStats(): TransactionStats {
    const total = Math.floor(Math.random() * 10000000) + 5000000;
    const confirmed = Math.floor(total * 0.95);
    const pending = Math.floor(total * 0.03);
    const failed = total - confirmed - pending;

    return {
      totalTransactions: total,
      confirmedTransactions: confirmed,
      pendingTransactions: pending,
      failedTransactions: failed,
      avgTxPerSecond: 2000000 + Math.random() * 500000,
      avgTxSizeBytes: 512 + Math.random() * 256,
      totalVolumeProcessed: total * 600,
      transactionsByType: {
        transfer: Math.floor(total * 0.6),
        mint: Math.floor(total * 0.1),
        burn: Math.floor(total * 0.05),
        stake: Math.floor(total * 0.15),
        unstake: Math.floor(total * 0.05),
        contract: Math.floor(total * 0.05),
      },
    };
  }

  private generateMockTransactions(filters?: TransactionFilters): {
    data: Transaction[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;
    const total = 1000;

    const transactions: Transaction[] = [];
    for (let i = 0; i < pageSize; i++) {
      const statuses = ['confirmed', 'pending', 'failed'] as const;
      const types = ['transfer', 'mint', 'burn', 'stake'] as const;
      const status = filters?.status ?? statuses[Math.floor(Math.random() * 3)];
      const type = filters?.type ?? types[Math.floor(Math.random() * 4)];
      transactions.push({
        id: `tx-${(page - 1) * pageSize + i}`,
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        type: type as string,
        status: status as 'pending' | 'confirmed' | 'failed',
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        blockHeight: status === 'confirmed' ? Math.floor(Math.random() * 100000) : undefined,
        from: `0x${Math.random().toString(16).substring(2, 42)}`,
        to: `0x${Math.random().toString(16).substring(2, 42)}`,
        amount: Math.random() * 1000,
        fee: Math.random() * 0.01,
      });
    }

    return { data: transactions, total, page, pageSize };
  }

  private generateMockBlocks(filters?: BlockFilters): {
    data: Block[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;
    const total = 10000;

    const blocks: Block[] = [];
    for (let i = 0; i < pageSize; i++) {
      const height = total - ((page - 1) * pageSize + i);
      blocks.push({
        height,
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        previousHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        timestamp: new Date(Date.now() - (total - height) * 5000).toISOString(),
        validatorId: filters?.validatorId || `validator-${Math.floor(Math.random() * 10) + 1}`,
        transactionCount: Math.floor(Math.random() * 100),
        transactions: Array.from({ length: 5 }, () => `tx-${Math.random().toString(16).substring(2, 10)}`),
        stateRoot: `0x${Math.random().toString(16).substring(2, 66)}`,
        size: Math.floor(Math.random() * 100000) + 10000,
      });
    }

    return { data: blocks, total, page, pageSize };
  }

  private generateMockValidators(): Validator[] {
    const validators: Validator[] = [];
    for (let i = 1; i <= 10; i++) {
      validators.push({
        id: `validator-${i}`,
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        publicKey: `0x${Math.random().toString(16).substring(2, 130)}`,
        stake: Math.floor(Math.random() * 1000000) + 100000,
        status: i <= 9 ? 'active' : 'inactive',
        commission: Math.random() * 0.1,
        uptime: 0.95 + Math.random() * 0.05,
        blocksProposed: Math.floor(Math.random() * 10000),
        lastBlockTime: new Date(Date.now() - Math.random() * 60000).toISOString(),
      });
    }
    return validators;
  }

  private generateMockSubmitResponse(_transaction: SubmitTransactionRequest): SubmitTransactionResponse {
    return {
      transactionId: `tx-${Math.random().toString(16).substring(2, 18)}`,
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      status: Math.random() > 0.9 ? 'rejected' : 'accepted',
      message: Math.random() > 0.9 ? 'Insufficient funds' : 'Transaction accepted',
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const v11BackendService = new V11BackendService();
export default V11BackendService;
