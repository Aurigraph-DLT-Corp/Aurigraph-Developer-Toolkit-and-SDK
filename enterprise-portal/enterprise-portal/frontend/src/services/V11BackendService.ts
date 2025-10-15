/**
 * V11 Backend Service
 *
 * REST API client for Aurigraph V11 backend with retry logic and demo mode
 */

import type {
  HealthCheckResponse,
  SystemInfoResponse,
  PerformanceMetrics,
  ConsensusStats,
  TransactionStats,
  StatsResponse,
} from '../types/api';
import { API_BASE_URL } from '../utils/constants';

class V11BackendService {
  private baseUrl: string;
  private demoMode: boolean;

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
}

// Export singleton instance
export const v11BackendService = new V11BackendService();
export default V11BackendService;
