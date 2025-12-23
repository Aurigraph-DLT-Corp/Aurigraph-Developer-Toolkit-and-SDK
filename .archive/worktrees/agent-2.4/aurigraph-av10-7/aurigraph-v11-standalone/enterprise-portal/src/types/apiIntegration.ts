/**
 * API Integration Type Definitions
 * Comprehensive types for Oracle management, API keys, price feeds, and external integrations
 */

// ========================================
// Oracle Management Types
// ========================================

export type OracleSourceType =
  | 'CHAINLINK'
  | 'BAND_PROTOCOL'
  | 'API3'
  | 'TELLOR'
  | 'INTERNAL';

export type OracleStatus = 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'OFFLINE';

export interface OracleSource {
  sourceId: string;
  name: string;
  type: OracleSourceType;
  status: OracleStatus;
  description: string;
  endpoint: string;
  apiKeyRequired: boolean;
  updateInterval: number; // in seconds
  validFeeds: number;
  totalFeeds: number;
  healthPercentage: number;
  lastUpdate: string;
  createdAt: string;
}

export interface PriceFeedPair {
  pairId: string;
  baseAsset: string;
  quoteAsset: string;
  symbol: string; // e.g., "BTC/USD"
  enabled: boolean;
  sources: OracleSourceType[];
  updateInterval: number;
  deviationThreshold: number; // percentage
  lastPrice: number;
  lastUpdate: string;
}

export interface OracleFeed {
  feedId: string;
  assetId: string;
  source: OracleSourceType;
  price: number;
  timestamp: string;
  confidence: number; // 0-100
  blockHeight?: number;
}

export interface OracleConfig {
  configId: string;
  pairId: string;
  sources: OracleSourceType[];
  consensusMethod: 'MEDIAN' | 'MEAN' | 'WEIGHTED_AVERAGE' | 'FIRST_VALID';
  minSources: number;
  maxPriceAge: number; // in seconds
  deviationThreshold: number;
  enableFallback: boolean;
  fallbackSource?: OracleSourceType;
  createdAt: string;
  updatedAt: string;
}

export interface PriceConsensus {
  assetId: string;
  consensusPrice: number;
  sourcePrices: Array<{
    source: OracleSourceType;
    price: number;
    weight: number;
    timestamp: string;
  }>;
  deviation: number;
  timestamp: string;
  validSources: number;
  totalSources: number;
}

// ========================================
// API Key Management Types
// ========================================

export type APIKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ROTATING';

export type APIServiceType =
  | 'CHAINLINK'
  | 'BAND_PROTOCOL'
  | 'API3'
  | 'TELLOR'
  | 'WEATHER_API'
  | 'ALPACA'
  | 'NEWS_API'
  | 'TWITTER'
  | 'CRYPTO_COMPARE'
  | 'COINGECKO'
  | 'CUSTOM';

export interface APIKey {
  keyId: string;
  serviceName: string;
  serviceType: APIServiceType;
  keyName: string;
  keyPrefix: string; // First 4 chars for display
  status: APIKeyStatus;
  encrypted: boolean;
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  rotationSchedule?: 'NEVER' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextRotation?: string;
  permissions: string[];
  rateLimit?: number; // requests per hour
  owner: string;
}

export interface APIKeyCreateRequest {
  serviceName: string;
  serviceType: APIServiceType;
  keyName: string;
  apiKey: string;
  apiSecret?: string;
  expiresAt?: string;
  rotationSchedule?: string;
  permissions: string[];
  rateLimit?: number;
}

export interface APIKeyRotationLog {
  logId: string;
  keyId: string;
  rotatedAt: string;
  rotatedBy: string;
  oldKeyPrefix: string;
  newKeyPrefix: string;
  reason: string;
  success: boolean;
}

// ========================================
// External API Configuration Types
// ========================================

export type ExternalAPICategory =
  | 'WEATHER'
  | 'FINANCIAL'
  | 'NEWS'
  | 'SOCIAL'
  | 'BLOCKCHAIN'
  | 'ORACLE'
  | 'CUSTOM';

export interface ExternalAPIConfig {
  configId: string;
  apiName: string;
  category: ExternalAPICategory;
  baseUrl: string;
  enabled: boolean;
  apiKeyId?: string;
  authType: 'NONE' | 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH2' | 'BASIC_AUTH';
  headers?: Record<string, string>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  timeout: number; // in milliseconds
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  endpoints: ExternalAPIEndpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface ExternalAPIEndpoint {
  endpointId: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: Array<{
    name: string;
    type: 'query' | 'path' | 'header' | 'body';
    required: boolean;
    defaultValue?: string;
  }>;
  responseSchema?: Record<string, any>;
  cacheEnabled: boolean;
  cacheTTL?: number; // in seconds
}

// ========================================
// API Usage Analytics Types
// ========================================

export interface APIUsageMetrics {
  period: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number; // in ms
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalCost: number;
  costByService: Array<{
    serviceName: string;
    calls: number;
    cost: number;
  }>;
  callsByHour: Array<{
    hour: string;
    calls: number;
  }>;
  errorsByType: Array<{
    errorType: string;
    count: number;
  }>;
}

export interface APIQuota {
  serviceType: APIServiceType;
  quotaType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  costPerCall: number;
  totalCost: number;
}

export interface APICallLog {
  logId: string;
  timestamp: string;
  serviceName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  success: boolean;
  errorMessage?: string;
  cost: number;
}

// ========================================
// Oracle Health Check Types
// ========================================

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface OracleHealthCheck {
  checkId: string;
  source: OracleSourceType;
  status: HealthStatus;
  uptime: number; // percentage
  avgResponseTime: number;
  p99ResponseTime: number;
  errorRate: number; // percentage
  lastCheckAt: string;
  nextCheckAt: string;
  issues: HealthIssue[];
}

export interface HealthIssue {
  issueId: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  affectedFeeds: string[];
}

export interface OracleUptimeStats {
  source: OracleSourceType;
  period: '24h' | '7d' | '30d';
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTime: number;
  incidents: Array<{
    timestamp: string;
    duration: number; // in seconds
    reason: string;
  }>;
}

export interface PriceFeedAlert {
  alertId: string;
  pairId: string;
  alertType: 'PRICE_DEVIATION' | 'ORACLE_FAILURE' | 'STALE_DATA' | 'CONSENSUS_FAILURE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  autoResolved: boolean;
  resolvedAt?: string;
}

// ========================================
// Smart Contract API Bridge Types
// ========================================

export interface SmartContractAPIMapping {
  mappingId: string;
  contractId: string;
  contractName: string;
  contractFunction: string;
  apiConfigId: string;
  apiEndpoint: string;
  triggerType: 'ON_CALL' | 'SCHEDULED' | 'EVENT_DRIVEN';
  schedule?: string; // cron expression if SCHEDULED
  eventName?: string; // if EVENT_DRIVEN
  parameterMapping: Array<{
    contractParam: string;
    apiParam: string;
    transformation?: string; // JavaScript expression
  }>;
  responseMapping: Array<{
    apiField: string;
    contractField: string;
    transformation?: string;
  }>;
  enabled: boolean;
  lastExecution?: string;
  executionCount: number;
  successRate: number;
  createdAt: string;
}

export interface APICallExecution {
  executionId: string;
  mappingId: string;
  triggeredBy: 'MANUAL' | 'SCHEDULED' | 'EVENT' | 'CONTRACT';
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  request: {
    endpoint: string;
    method: string;
    parameters: Record<string, any>;
  };
  response?: {
    statusCode: number;
    data: any;
    headers: Record<string, string>;
  };
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  duration: number; // in ms
  cost: number;
}

export interface ContractOracleBinding {
  bindingId: string;
  contractId: string;
  contractAddress: string;
  oracleFeedId: string;
  pairId: string;
  updateStrategy: 'PUSH' | 'PULL' | 'HYBRID';
  updateInterval?: number; // for PUSH/HYBRID
  priceDeviationTrigger?: number; // percentage for PUSH
  enabled: boolean;
  lastUpdate: string;
  updateCount: number;
  createdAt: string;
}

// ========================================
// Dashboard State Types
// ========================================

export interface APIIntegrationState {
  // Oracle Management
  oracleSources: OracleSource[];
  priceFeedPairs: PriceFeedPair[];
  oracleFeeds: OracleFeed[];
  priceConsensus: PriceConsensus[];
  selectedOracleSource?: OracleSourceType;

  // API Keys
  apiKeys: APIKey[];
  keyRotationLogs: APIKeyRotationLog[];
  selectedApiKey?: string;

  // External APIs
  externalAPIs: ExternalAPIConfig[];
  selectedAPI?: string;

  // Usage Analytics
  usageMetrics?: APIUsageMetrics;
  apiQuotas: APIQuota[];
  callLogs: APICallLog[];

  // Health Monitoring
  healthChecks: OracleHealthCheck[];
  uptimeStats: OracleUptimeStats[];
  priceFeedAlerts: PriceFeedAlert[];

  // Contract Bridges
  contractMappings: SmartContractAPIMapping[];
  apiExecutions: APICallExecution[];
  contractBindings: ContractOracleBinding[];

  // UI State
  loading: boolean;
  error?: string;
  lastUpdated?: string;
}

// ========================================
// Filter and Pagination Types
// ========================================

export interface APIIntegrationFilters {
  oracleStatus?: OracleStatus[];
  apiServiceType?: APIServiceType[];
  healthStatus?: HealthStatus[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// Action Response Types
// ========================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface BulkActionResponse {
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    itemId: string;
    success: boolean;
    error?: string;
  }>;
}
