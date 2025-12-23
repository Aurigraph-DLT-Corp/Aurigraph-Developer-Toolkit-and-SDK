/**
 * Node Type Definitions for Aurigraph Enterprise Portal Demo App
 *
 * Defines TypeScript interfaces for all node types:
 * - Channel Node: Routing and connection management
 * - Validator Node: HyperRAFT++ consensus
 * - Business Node: Transaction processing
 * - Slim Node: External API integration
 */

// ============================================================================
// Core Node Types
// ============================================================================

export type NodeType = 'channel' | 'validator' | 'business' | 'slim';
export type NodeStatus = 'active' | 'inactive' | 'error';

export interface NodePosition {
  x: number;
  y: number;
  z?: number; // For 3D spatial view
}

export interface BaseNodeConfig {
  id: string;
  type: NodeType;
  name: string;
  status: NodeStatus;
  position: NodePosition;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Channel Node
// ============================================================================

export type RoutingAlgorithm = 'round-robin' | 'least-connections' | 'random' | 'hash-based';

export interface ChannelConnection {
  targetNodeId: string;
  weight: number;
  latency: number;
  bandwidth: number;
  packetsTransferred: number;
  lastHeartbeat: string;
}

export interface ChannelNodeConfig extends BaseNodeConfig {
  type: 'channel';
  routingAlgorithm: RoutingAlgorithm;
  connections: ChannelConnection[];
  maxConnections: number;
  heartbeatInterval: number;
  metrics: {
    totalPackets: number;
    totalBytes: number;
    activeConnections: number;
    avgLatency: number;
    uptime: number;
  };
}

// ============================================================================
// Validator Node
// ============================================================================

export type ConsensusRole = 'LEADER' | 'FOLLOWER' | 'CANDIDATE';
export type ConsensusState = 'IDLE' | 'PROPOSING' | 'VOTING' | 'COMMITTING';

export interface ConsensusMetrics {
  currentTerm: number;
  role: ConsensusRole;
  state: ConsensusState;
  votesReceived: number;
  votesRequired: number;
  lastLeaderHeartbeat: string;
  blockHeight: number;
  commitIndex: number;
  finalityLatencyMs: number;
}

export interface ValidatorNodeConfig extends BaseNodeConfig {
  type: 'validator';
  consensus: ConsensusMetrics;
  validatorAddress: string;
  votingPower: number;
  metrics: {
    blocksProposed: number;
    blocksVoted: number;
    blocksCommitted: number;
    leaderChanges: number;
    avgFinalityLatency: number;
    uptime: number;
  };
}

// ============================================================================
// Business Node
// ============================================================================

export type TransactionType = 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake' | 'contract';
export type TransactionStatus = 'pending' | 'processing' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: string;
  blockHeight?: number;
}

export interface BusinessNodeConfig extends BaseNodeConfig {
  type: 'business';
  walletAddress: string;
  balance: number;
  transactions: Transaction[];
  metrics: {
    totalTransactions: number;
    pendingTransactions: number;
    confirmedTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    avgTxTime: number;
    uptime: number;
  };
}

// ============================================================================
// Slim Node (External API Integration)
// ============================================================================

export type ExternalFeedType = 'alpaca' | 'weather' | 'twitter';
export type FeedStatus = 'connected' | 'disconnected' | 'error' | 'rate-limited';

export interface AlpacaData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  conditions: string;
  timestamp: string;
}

export interface TwitterData {
  username: string;
  tweet: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  likes: number;
  retweets: number;
  timestamp: string;
}

export type ExternalFeedData = AlpacaData | WeatherData | TwitterData;

export interface SlimNodeConfig extends BaseNodeConfig {
  type: 'slim';
  feedType: ExternalFeedType;
  feedStatus: FeedStatus;
  apiEndpoint: string;
  updateInterval: number;
  lastUpdate: string;
  data: ExternalFeedData | null;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    avgResponseTime: number;
    uptime: number;
  };
}

// ============================================================================
// Union Types
// ============================================================================

export type NodeConfig =
  | ChannelNodeConfig
  | ValidatorNodeConfig
  | BusinessNodeConfig
  | SlimNodeConfig;

export interface NodesMap {
  [nodeId: string]: NodeConfig;
}

// ============================================================================
// Node Configuration Presets
// ============================================================================

export interface NodePreset {
  id: string;
  name: string;
  description: string;
  nodeType: NodeType;
  config: Partial<NodeConfig>;
}

export const DEFAULT_PRESETS: Record<NodeType, NodePreset> = {
  channel: {
    id: 'default-channel',
    name: 'Default Channel Node',
    description: 'Round-robin routing with 4 connections',
    nodeType: 'channel',
    config: {
      routingAlgorithm: 'round-robin',
      maxConnections: 4,
      heartbeatInterval: 5000,
    },
  },
  validator: {
    id: 'default-validator',
    name: 'Default Validator Node',
    description: 'HyperRAFT++ consensus validator',
    nodeType: 'validator',
    config: {
      votingPower: 1,
    },
  },
  business: {
    id: 'default-business',
    name: 'Default Business Node',
    description: 'Transaction processing node',
    nodeType: 'business',
    config: {
      balance: 1000000,
    },
  },
  slim: {
    id: 'default-slim-alpaca',
    name: 'Default Slim Node (Alpaca)',
    description: 'Stock market data feed',
    nodeType: 'slim',
    config: {
      feedType: 'alpaca',
      updateInterval: 5000,
    },
  },
};
