/**
 * Type Definitions for Comprehensive Portal Components
 *
 * Defines interfaces for blockchain explorer, validators, AI optimization,
 * quantum security, and cross-chain bridge features
 */

// ============================================================================
// Transaction Explorer Types
// ============================================================================

export interface Transaction {
  id: string;
  hash: string;
  blockHeight: number;
  timestamp: string;
  type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake' | 'contract';
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  amount: number;
  fee: number;
  gasUsed?: number;
  gasLimit?: number;
  signature: string;
  size: number;
  confirmations: number;
  data?: string;
}

export interface TransactionFilter {
  type?: Transaction['type'];
  status?: Transaction['status'];
  fromAddress?: string;
  toAddress?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  blockHeight?: number;
}

// ============================================================================
// Block Explorer Types
// ============================================================================

export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  transactionCount: number;
  validatorId: string;
  merkleRoot: string;
  stateRoot: string;
  size: number;
  gasUsed: number;
  gasLimit: number;
  consensusTerm: number;
  finalityMs: number;
  difficulty?: number;
  nonce?: string;
}

export interface ChainInfo {
  currentHeight: number;
  totalBlocks: number;
  totalTransactions: number;
  avgBlockTime: number;
  avgBlockSize: number;
  avgTransactionsPerBlock: number;
  chainStartTime: string;
  lastBlockTime: string;
  syncStatus: 'synced' | 'syncing' | 'stalled';
}

// ============================================================================
// Validator Dashboard Types
// ============================================================================

export interface Validator {
  id: string;
  address: string;
  name: string;
  status: 'active' | 'inactive' | 'jailed' | 'unbonding';
  votingPower: number;
  commission: number;
  totalStake: number;
  selfStake: number;
  delegatorCount: number;
  uptime: number;
  blocksProposed: number;
  blocksSigned: number;
  missedBlocks: number;
  slashingEvents: number;
  joinedAt: string;
  lastActiveAt: string;
  apr: number;
  rank: number;
}

export interface ValidatorPerformance {
  validatorId: string;
  period: '1h' | '24h' | '7d' | '30d';
  blocksProposed: number;
  blocksSigned: number;
  missedBlocks: number;
  averageLatency: number;
  uptimePercentage: number;
  slashingEvents: number;
  rewards: number;
}

export interface StakingInfo {
  totalStaked: number;
  totalValidators: number;
  activeValidators: number;
  minStakeRequired: number;
  unbondingPeriod: number;
  averageApr: number;
  stakingRatio: number;
}

// ============================================================================
// AI Optimization Types
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  type: 'consensus' | 'transaction-ordering' | 'anomaly-detection' | 'load-balancing';
  status: 'active' | 'training' | 'disabled';
  accuracy: number;
  lastTrainedAt: string;
  version: string;
  parameters: Record<string, number>;
}

export interface AIOptimizationMetrics {
  consensusOptimization: {
    predictedTps: number;
    optimizationGain: number;
    leaderSelectionAccuracy: number;
    consensusLatencyReduction: number;
  };
  transactionOrdering: {
    throughputIncrease: number;
    latencyReduction: number;
    orderingAccuracy: number;
  };
  anomalyDetection: {
    anomaliesDetected: number;
    falsePositiveRate: number;
    detectionLatency: number;
    threatsBlocked: number;
  };
  loadBalancing: {
    nodeUtilization: number;
    distributionEfficiency: number;
    rebalanceEvents: number;
  };
}

export interface PredictiveAnalytics {
  timestamp: string;
  predictions: {
    nextHourTps: number;
    nextHourLatency: number;
    networkLoad: 'low' | 'medium' | 'high' | 'critical';
    consensusStability: number;
    suggestedActions: string[];
  };
}

// ============================================================================
// Quantum Security Types
// ============================================================================

export interface QuantumSecurityStatus {
  algorithm: 'CRYSTALS-Dilithium' | 'CRYSTALS-Kyber' | 'SPHINCS+';
  securityLevel: 1 | 2 | 3 | 4 | 5;
  keyStrength: number;
  quantumResistant: boolean;
  lastAudit: string;
  vulnerabilities: number;
  status: 'secure' | 'warning' | 'critical';
}

export interface CryptoKey {
  id: string;
  type: 'signing' | 'encryption' | 'hybrid';
  algorithm: string;
  publicKey: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
  lastUsed?: string;
}

export interface SecurityMetrics {
  totalSignatures: number;
  totalEncryptions: number;
  avgSignatureTime: number;
  avgEncryptionTime: number;
  avgVerificationTime: number;
  avgDecryptionTime: number;
  failedVerifications: number;
  quantumAttemptsBlocked: number;
}

export interface SecurityAudit {
  id: string;
  timestamp: string;
  type: 'key-rotation' | 'vulnerability-scan' | 'penetration-test' | 'compliance';
  status: 'passed' | 'failed' | 'warning';
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

// ============================================================================
// Cross-Chain Bridge Types
// ============================================================================

export interface BridgeStatus {
  bridgeId: string;
  name: string;
  status: 'active' | 'paused' | 'maintenance' | 'offline';
  sourceChain: string;
  targetChain: string;
  totalValueLocked: number;
  totalTransfers: number;
  averageTransferTime: number;
  successRate: number;
  lastTransferAt?: string;
}

export interface CrossChainTransfer {
  id: string;
  bridgeId: string;
  sourceChain: string;
  targetChain: string;
  sourceTransaction: string;
  targetTransaction?: string;
  status: 'initiated' | 'locked' | 'verified' | 'completed' | 'failed' | 'refunded';
  token: string;
  amount: number;
  sender: string;
  recipient: string;
  fee: number;
  initiatedAt: string;
  completedAt?: string;
  estimatedCompletionTime?: string;
  confirmations: number;
  requiredConfirmations: number;
}

export interface SupportedChain {
  chainId: string;
  name: string;
  network: string;
  status: 'connected' | 'disconnected' | 'syncing';
  blockHeight: number;
  avgBlockTime: number;
  nativeToken: string;
  supportedTokens: string[];
  bridgeFee: number;
  minTransferAmount: number;
  maxTransferAmount: number;
}

export interface BridgeMetrics {
  totalBridges: number;
  activeBridges: number;
  totalValueLocked: number;
  totalTransfers24h: number;
  totalVolume24h: number;
  averageTransferTime: number;
  successRate: number;
  failedTransfers24h: number;
}

// ============================================================================
// WebSocket Real-time Update Types
// ============================================================================

export interface RealtimeUpdate {
  type: 'transaction' | 'block' | 'validator' | 'ai' | 'security' | 'bridge';
  timestamp: string;
  data: unknown;
}

export interface TransactionUpdate extends RealtimeUpdate {
  type: 'transaction';
  data: Transaction;
}

export interface BlockUpdate extends RealtimeUpdate {
  type: 'block';
  data: Block;
}

export interface ValidatorUpdate extends RealtimeUpdate {
  type: 'validator';
  data: {
    validatorId: string;
    status: Validator['status'];
    metrics: Partial<Validator>;
  };
}

export interface AIUpdate extends RealtimeUpdate {
  type: 'ai';
  data: {
    modelId: string;
    metrics: Partial<AIOptimizationMetrics>;
  };
}

export interface SecurityUpdate extends RealtimeUpdate {
  type: 'security';
  data: {
    alert: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  };
}

export interface BridgeUpdate extends RealtimeUpdate {
  type: 'bridge';
  data: {
    transferId: string;
    status: CrossChainTransfer['status'];
    progress: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
