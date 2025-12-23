/**
 * API Type Definitions for Aurigraph V11 Backend Integration
 *
 * Defines TypeScript interfaces for all V11 REST API endpoints and WebSocket messages
 */

// ============================================================================
// V11 Backend REST API Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'UP' | 'DOWN';
    consensus: 'UP' | 'DOWN';
    network: 'UP' | 'DOWN';
  };
}

export interface SystemInfoResponse {
  version: string;
  buildTime: string;
  javaVersion: string;
  quarkusVersion: string;
  graalvmVersion?: string;
  nativeImage: boolean;
  platform: string;
  architecture: string;
  availableProcessors: number;
  totalMemory: number;
  freeMemory: number;
  maxMemory: number;
}

export interface PerformanceMetrics {
  timestamp: string;
  tps: number;
  avgTps: number;
  peakTps: number;
  totalTransactions: number;
  activeTransactions: number;
  pendingTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
}

export interface ConsensusStats {
  currentTerm: number;
  blockHeight: number;
  commitIndex: number;
  lastApplied: number;
  leaderNodeId: string | null;
  validatorCount: number;
  activeValidators: number;
  totalLeaderChanges: number;
  avgFinalityLatencyMs: number;
  consensusState: 'IDLE' | 'PROPOSING' | 'VOTING' | 'COMMITTING';
}

export interface TransactionStats {
  totalTransactions: number;
  confirmedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  avgTxPerSecond: number;
  avgTxSizeBytes: number;
  totalVolumeProcessed: number;
  transactionsByType: Record<string, number>;
}

export interface ChannelStats {
  totalChannels: number;
  activeChannels: number;
  totalConnections: number;
  activeConnections: number;
  totalPacketsTransferred: number;
  totalBytesTransferred: number;
  avgLatencyMs: number;
  channelsByAlgorithm: Record<string, number>;
}

export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  nodesByType: Record<string, number>;
  totalConnections: number;
  networkLatencyMs: number;
  bandwidthUtilization: number;
}

export interface StatsResponse {
  timestamp: string;
  performance: PerformanceMetrics;
  consensus: ConsensusStats;
  transactions: TransactionStats;
  channels: ChannelStats;
  network: NetworkStats;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type WebSocketMessageType =
  | 'METRICS_UPDATE'
  | 'CONSENSUS_UPDATE'
  | 'TRANSACTION_UPDATE'
  | 'NODE_UPDATE'
  | 'ALERT'
  | 'HEARTBEAT'
  | 'SUBSCRIBE'
  | 'UNSUBSCRIBE'
  | 'ERROR';

export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
}

export interface MetricsUpdateMessage extends BaseWebSocketMessage {
  type: 'METRICS_UPDATE';
  data: PerformanceMetrics;
}

export interface ConsensusUpdateMessage extends BaseWebSocketMessage {
  type: 'CONSENSUS_UPDATE';
  data: ConsensusStats;
}

export interface TransactionUpdateMessage extends BaseWebSocketMessage {
  type: 'TRANSACTION_UPDATE';
  data: {
    transactionId: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockHeight?: number;
    timestamp: string;
  };
}

export interface NodeUpdateMessage extends BaseWebSocketMessage {
  type: 'NODE_UPDATE';
  data: {
    nodeId: string;
    status: 'online' | 'offline' | 'degraded';
    timestamp: string;
  };
}

export interface AlertMessage extends BaseWebSocketMessage {
  type: 'ALERT';
  data: {
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    code?: string;
  };
}

export interface HeartbeatMessage extends BaseWebSocketMessage {
  type: 'HEARTBEAT';
  data: {
    serverId: string;
    uptime: number;
  };
}

export interface SubscribeMessage extends BaseWebSocketMessage {
  type: 'SUBSCRIBE';
  data: {
    channels: string[];
  };
}

export interface UnsubscribeMessage extends BaseWebSocketMessage {
  type: 'UNSUBSCRIBE';
  data: {
    channels: string[];
  };
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'ERROR';
  data: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type WebSocketMessage =
  | MetricsUpdateMessage
  | ConsensusUpdateMessage
  | TransactionUpdateMessage
  | NodeUpdateMessage
  | AlertMessage
  | HeartbeatMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | ErrorMessage;

// ============================================================================
// External API Types (Alpaca, Weather, X)
// ============================================================================

export interface AlpacaStockQuote {
  symbol: string;
  ask: number;
  askSize: number;
  bid: number;
  bidSize: number;
  timestamp: string;
}

export interface AlpacaStockBar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface WeatherApiResponse {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    clouds: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  };
  timestamp: string;
}

export interface TwitterApiTweet {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
    verified: boolean;
  };
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  created_at: string;
}

export interface TwitterApiResponse {
  data: TwitterApiTweet[];
  meta: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
  };
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

// ============================================================================
// API Configuration Types
// ============================================================================

export interface V11ApiConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ExternalApiConfig {
  alpaca: {
    baseUrl: string;
    apiKey: string;
    secretKey: string;
    rateLimit: number; // requests per minute
  };
  weather: {
    baseUrl: string;
    apiKey: string;
    rateLimit: number; // requests per minute
  };
  twitter: {
    baseUrl: string;
    bearerToken: string;
    rateLimit: number; // requests per 15 minutes
  };
}

// ============================================================================
// Demo Mode Types
// ============================================================================

export interface DemoModeConfig {
  enabled: boolean;
  targetTps: number;
  nodeCount: number;
  transactionInterval: number;
  metricsUpdateInterval: number;
  consensusUpdateInterval: number;
}

export interface MockDataGenerator {
  generatePerformanceMetrics: () => PerformanceMetrics;
  generateConsensusStats: () => ConsensusStats;
  generateTransactionStats: () => TransactionStats;
  generateAlpacaData: () => AlpacaStockBar;
  generateWeatherData: () => WeatherApiResponse;
  generateTwitterData: () => TwitterApiTweet;
}
