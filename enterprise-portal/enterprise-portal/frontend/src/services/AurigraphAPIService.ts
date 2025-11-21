/**
 * Aurigraph V11 API Service Layer
 *
 * Comprehensive client-side service for all Aurigraph V11 backend API integrations
 * Provides type-safe, reactive access to all blockchain operations
 *
 * Base URL: https://dlt.aurigraph.io/api/v11 (Production)
 *           http://localhost:9003/api/v11 (Development)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Health Status Response
 */
export interface HealthStatus {
  status: 'UP' | 'DOWN';
  checks: {
    consensus: 'UP' | 'DOWN';
    database: 'UP' | 'DOWN';
    network: 'UP' | 'DOWN';
  };
  version: string;
  timestamp: string;
  uptime: number;
}

/**
 * System Information
 */
export interface SystemInfo {
  platform: string;
  version: string;
  javaVersion: string;
  quarkusVersion: string;
  buildTime: string;
  commitHash: string;
  features: string[];
}

/**
 * Blockchain Metrics
 */
export interface BlockchainMetrics {
  tps: number; // Transactions per second
  totalTransactions: number;
  totalBlocks: number;
  activationValidators: number;
  networkHealth: number; // 0-100
  averageBlockTime: number; // milliseconds
  averageLatency: number; // milliseconds
  finality: number; // milliseconds
  uptime: number; // percentage
}

/**
 * Block Data
 */
export interface Block {
  hash: string;
  height: number;
  timestamp: string;
  proposer: string;
  transactionCount: number;
  gasUsed: number;
  gasLimit: number;
  stateRoot: string;
  previousHash: string;
  consensusRound: number;
}

/**
 * Transaction Data
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  gasPrice: string;
  gasUsed: number;
  nonce: number;
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockHeight: number;
  contractAddress?: string;
  data?: string;
}

/**
 * Validator Data
 */
export interface Validator {
  id: string;
  address: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'JAILED';
  stake: string;
  votingPower: number; // percentage
  consensusRounds: number;
  proposedBlocks: number;
  operatorAddress: string;
  commissionRate: number;
  uptime: number; // percentage
}

/**
 * Consensus Status
 */
export interface ConsensusStatus {
  algorithm: 'HyperRAFT++';
  currentTerm: number;
  leader: string;
  totalValidators: number;
  activeValidators: number;
  blockHeight: number;
  finality: string;
  consensusRound: number;
  timeUntilNextRound: number; // milliseconds
  faultToleranceLevel: number;
}

/**
 * Token Data
 */
export interface Token {
  id: string;
  symbol: string;
  name: string;
  totalSupply: string;
  decimals: number;
  contractAddress: string;
  createdAt: string;
  creator: string;
  holders: number;
  transfers: number;
}

/**
 * RWA (Real-World Asset) Data
 */
export interface RealWorldAsset {
  id: string;
  name: string;
  type: string;
  value: string;
  currency: string;
  tokenAddress: string;
  status: 'ACTIVE' | 'RETIRED' | 'UNDER_REVIEW';
  createdAt: string;
  issuer: string;
  custodian: string;
  kycRequired: boolean;
  holders: number;
}

/**
 * Smart Contract Data
 */
export interface SmartContract {
  id: string;
  name: string;
  address: string;
  creator: string;
  status: 'ACTIVE' | 'PAUSED' | 'TERMINATED';
  bytecode: string;
  abi: any[];
  createdAt: string;
  lastUpdated: string;
  executions: number;
  balance: string;
}

/**
 * Network Health Status
 */
export interface NetworkHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  activeNodes: number;
  totalNodes: number;
  averageLatency: number;
  packetLoss: number; // percentage
  bandwidth: string;
  peersConnected: number;
}

/**
 * Analytics Dashboard Data
 */
export interface AnalyticsDashboard {
  timestamp: string;
  tps: number;
  totalTransactions: number;
  totalBlocks: number;
  activeUsers: number;
  networkHealth: number;
  topAccounts: Array<{ address: string; balance: string }>;
  recentBlocks: Block[];
  recentTransactions: Transaction[];
}

/**
 * Staking Information
 */
export interface StakingInfo {
  totalStaked: string;
  totalValidators: number;
  minimumStake: string;
  maximumStake: string;
  averageCommission: number;
  annualRewardRate: number;
  circulatingSupply: string;
}

/**
 * AI Optimization Metrics
 */
export interface AIOptimization {
  enabled: boolean;
  tpsImprovement: number; // percentage
  orderingOptimization: number; // percentage
  predictiveAccuracy: number; // percentage
  anomalyDetectionScore: number; // 0-100
  lastOptimizationTime: string;
  optimizationsApplied: number;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

export class AurigraphAPIService {
  private client: AxiosInstance;
  private baseURL: string;
  private jwtToken: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || this.getBaseURL();
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to request headers if available
    this.client.interceptors.request.use((config) => {
      if (this.jwtToken) {
        config.headers.Authorization = `Bearer ${this.jwtToken}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Get the appropriate base URL based on environment
   */
  private getBaseURL(): string {
    const isProduction = window.location.hostname === 'dlt.aurigraph.io';
    return isProduction
      ? 'https://dlt.aurigraph.io/api/v11'
      : 'http://localhost:9003/api/v11';
  }

  /**
   * Set JWT token for authenticated requests
   */
  setJWTToken(token: string): void {
    this.jwtToken = token;
  }

  /**
   * Clear JWT token
   */
  clearJWTToken(): void {
    this.jwtToken = null;
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Promise<never> {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }

  // ========================================================================
  // HEALTH & SYSTEM ENDPOINTS
  // ========================================================================

  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await this.client.get<HealthStatus>('/health');
    return response.data;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const response = await this.client.get<SystemInfo>('/info');
    return response.data;
  }

  // ========================================================================
  // BLOCKCHAIN ENDPOINTS
  // ========================================================================

  /**
   * Get real-time blockchain metrics
   */
  async getBlockchainMetrics(): Promise<BlockchainMetrics> {
    const response = await this.client.get<BlockchainMetrics>('/blockchain/metrics');
    return response.data;
  }

  /**
   * Get detailed blockchain statistics
   */
  async getBlockchainStats(): Promise<any> {
    const response = await this.client.get('/blockchain/stats');
    return response.data;
  }

  /**
   * Get list of recent blocks
   */
  async getBlocks(limit: number = 20, offset: number = 0): Promise<Block[]> {
    const response = await this.client.get<Block[]>('/blocks', {
      params: { limit, offset },
    });
    return response.data;
  }

  /**
   * Get specific block by hash or height
   */
  async getBlock(hashOrHeight: string | number): Promise<Block> {
    const response = await this.client.get<Block>(`/blocks/${hashOrHeight}`);
    return response.data;
  }

  /**
   * Get list of recent transactions
   */
  async getTransactions(limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const response = await this.client.get<Transaction[]>('/transactions', {
      params: { limit, offset },
    });
    return response.data;
  }

  /**
   * Get specific transaction by hash
   */
  async getTransaction(hash: string): Promise<Transaction> {
    const response = await this.client.get<Transaction>(`/transactions/${hash}`);
    return response.data;
  }

  /**
   * Submit a new transaction
   */
  async submitTransaction(tx: Omit<Transaction, 'hash' | 'timestamp' | 'status' | 'blockHeight'>): Promise<{ txHash: string; status: string }> {
    const response = await this.client.post('/transactions/submit', tx);
    return response.data;
  }

  /**
   * Submit batch transactions
   */
  async submitBatchTransactions(transactions: any[]): Promise<{ acceptedCount: number; rejectedCount: number; batchId: string }> {
    const response = await this.client.post('/transactions/batch', { transactions });
    return response.data;
  }

  // ========================================================================
  // VALIDATOR ENDPOINTS
  // ========================================================================

  /**
   * Get list of all validators
   */
  async getValidators(): Promise<Validator[]> {
    const response = await this.client.get<Validator[]>('/validators');
    return response.data;
  }

  /**
   * Get specific validator details
   */
  async getValidator(id: string): Promise<Validator> {
    const response = await this.client.get<Validator>(`/validators/${id}`);
    return response.data;
  }

  // ========================================================================
  // CONSENSUS ENDPOINTS
  // ========================================================================

  /**
   * Get HyperRAFT++ consensus status
   */
  async getConsensusStatus(): Promise<ConsensusStatus> {
    const response = await this.client.get<ConsensusStatus>('/consensus/status');
    return response.data;
  }

  /**
   * Get consensus performance metrics
   */
  async getConsensusMetrics(): Promise<any> {
    const response = await this.client.get('/consensus/metrics');
    return response.data;
  }

  /**
   * Get cluster node information
   */
  async getConsensusNodes(): Promise<any[]> {
    const response = await this.client.get('/consensus/nodes');
    return response.data;
  }

  // ========================================================================
  // TOKEN ENDPOINTS
  // ========================================================================

  /**
   * Get list of all tokens
   */
  async getTokens(): Promise<Token[]> {
    const response = await this.client.get<Token[]>('/tokens');
    return response.data;
  }

  /**
   * Get specific token details
   */
  async getToken(id: string): Promise<Token> {
    const response = await this.client.get<Token>(`/tokens/${id}`);
    return response.data;
  }

  /**
   * Create a new token
   */
  async createToken(token: Omit<Token, 'id' | 'createdAt'>): Promise<Token> {
    const response = await this.client.post<Token>('/tokens', token);
    return response.data;
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenId: string, address: string): Promise<{ balance: string; decimals: number }> {
    const response = await this.client.get(`/tokens/${tokenId}/balance/${address}`);
    return response.data;
  }

  // ========================================================================
  // RWA (REAL-WORLD ASSET) ENDPOINTS
  // ========================================================================

  /**
   * Get RWA system status
   */
  async getRWAStatus(): Promise<any> {
    const response = await this.client.get('/rwa/status');
    return response.data;
  }

  /**
   * Get list of tokenized assets
   */
  async getRWAAssets(): Promise<RealWorldAsset[]> {
    const response = await this.client.get<RealWorldAsset[]>('/rwa/assets');
    return response.data;
  }

  /**
   * Tokenize a real-world asset
   */
  async tokenizeRWA(asset: Omit<RealWorldAsset, 'id' | 'tokenAddress' | 'createdAt'>): Promise<RealWorldAsset> {
    const response = await this.client.post<RealWorldAsset>('/rwa/tokenize', asset);
    return response.data;
  }

  /**
   * Get RWA portfolio
   */
  async getRWAPortfolio(): Promise<{ totalValue: string; assets: RealWorldAsset[] }> {
    const response = await this.client.get('/rwa/portfolio');
    return response.data;
  }

  // ========================================================================
  // SMART CONTRACT ENDPOINTS
  // ========================================================================

  /**
   * Get list of smart contracts
   */
  async getContracts(): Promise<SmartContract[]> {
    const response = await this.client.get<SmartContract[]>('/contracts');
    return response.data;
  }

  /**
   * Get specific smart contract details
   */
  async getContract(id: string): Promise<SmartContract> {
    const response = await this.client.get<SmartContract>(`/contracts/${id}`);
    return response.data;
  }

  /**
   * Deploy a new smart contract
   */
  async deployContract(contract: Omit<SmartContract, 'id' | 'address' | 'createdAt' | 'lastUpdated' | 'executions' | 'balance'>): Promise<SmartContract> {
    const response = await this.client.post<SmartContract>('/contracts/deploy', contract);
    return response.data;
  }

  /**
   * Execute a smart contract function
   */
  async executeContract(id: string, functionName: string, parameters: any[]): Promise<any> {
    const response = await this.client.post(`/contracts/${id}/execute`, {
      functionName,
      parameters,
    });
    return response.data;
  }

  // ========================================================================
  // NETWORK ENDPOINTS
  // ========================================================================

  /**
   * Get network health status
   */
  async getNetworkHealth(): Promise<NetworkHealth> {
    const response = await this.client.get<NetworkHealth>('/network/health');
    return response.data;
  }

  /**
   * Get network topology
   */
  async getNetworkNodes(): Promise<any[]> {
    const response = await this.client.get('/network/nodes');
    return response.data;
  }

  /**
   * Get network latency metrics
   */
  async getNetworkLatency(): Promise<{ averageLatency: number; maxLatency: number; minLatency: number }> {
    const response = await this.client.get('/network/latency');
    return response.data;
  }

  // ========================================================================
  // ANALYTICS ENDPOINTS
  // ========================================================================

  /**
   * Get dashboard analytics data
   */
  async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const response = await this.client.get<AnalyticsDashboard>('/analytics/dashboard');
    return response.data;
  }

  /**
   * Get performance metrics
   */
  async getAnalyticsMetrics(): Promise<any> {
    const response = await this.client.get('/analytics/metrics');
    return response.data;
  }

  /**
   * Get historical trends
   */
  async getAnalyticsTrends(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const response = await this.client.get('/analytics/trends', {
      params: { period },
    });
    return response.data;
  }

  // ========================================================================
  // STAKING ENDPOINTS
  // ========================================================================

  /**
   * Get staking information
   */
  async getStakingInfo(): Promise<StakingInfo> {
    const response = await this.client.get<StakingInfo>('/staking/info');
    return response.data;
  }

  /**
   * Stake tokens
   */
  async stakeTokens(amount: string, validatorId: string): Promise<{ transactionHash: string; status: string }> {
    const response = await this.client.post('/staking/stake', { amount, validatorId });
    return response.data;
  }

  /**
   * Unstake tokens
   */
  async unstakeTokens(amount: string, validatorId: string): Promise<{ transactionHash: string; status: string }> {
    const response = await this.client.post('/staking/unstake', { amount, validatorId });
    return response.data;
  }

  /**
   * Get staking rewards
   */
  async getStakingRewards(validatorId: string): Promise<{ rewards: string; claimableRewards: string }> {
    const response = await this.client.get(`/staking/rewards`, {
      params: { validatorId },
    });
    return response.data;
  }

  // ========================================================================
  // AI OPTIMIZATION ENDPOINTS
  // ========================================================================

  /**
   * Get AI optimization metrics
   */
  async getAIOptimization(): Promise<AIOptimization> {
    const response = await this.client.get<AIOptimization>('/ai/optimization');
    return response.data;
  }

  /**
   * Enable AI optimization
   */
  async enableAIOptimization(): Promise<{ status: string }> {
    const response = await this.client.post('/ai/optimization/enable', {});
    return response.data;
  }

  /**
   * Disable AI optimization
   */
  async disableAIOptimization(): Promise<{ status: string }> {
    const response = await this.client.post('/ai/optimization/disable', {});
    return response.data;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aurigraphAPI = new AurigraphAPIService();

export default AurigraphAPIService;
