/**
 * Application Constants
 */

// API Configuration - Always use HTTPS in production
// NOTE: Integrated with Aurigraph DLT V12 backend
const getApiBaseUrl = (): string => {
  // Check if we have an environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // In production (HTTPS or production hostname), use production API
  const isProduction = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'dlt.aurigraph.io');
  return isProduction ? 'https://dlt.aurigraph.io/api/v12' : '/api/v12';
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_URL = import.meta.env.VITE_WS_URL || `wss://${window.location.host}`;

// Performance Settings
export const CHART_UPDATE_INTERVAL = 1000; // ms
export const METRICS_UPDATE_INTERVAL = 2000; // ms
export const MAX_CHART_DATA_POINTS = 60;

// WebSocket Settings
export const WS_RECONNECT_INTERVAL = 5000; // ms
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

// External Feed Settings
export const ALPACA_UPDATE_INTERVAL = 5000; // ms
export const WEATHER_UPDATE_INTERVAL = 60000; // ms
export const TWITTER_UPDATE_INTERVAL = 30000; // ms

// Node Settings
export const DEFAULT_NODE_POSITION = { x: 0, y: 0, z: 0 };
export const MAX_NODES_PER_TYPE = 100;

// Chart Colors
export const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  tps: '#1890ff',
  latency: '#52c41a',
  consensus: '#722ed1',
  transactions: '#fa8c16',
};

// Application Version
export const APP_VERSION = '2.1.0';
export const APP_NAME = 'Aurigraph Enterprise Portal';

// ============================================================================
// Comprehensive API Endpoints
// All endpoints are relative to API_BASE_URL (e.g., /api/v11)
// ============================================================================

// Transaction Explorer Endpoints
export const ENDPOINTS = {
  // Blockchain & Transactions
  blockchain: {
    transactions: '/blockchain/transactions',
    transactionDetail: (hash: string) => `/blockchain/transactions/${hash}`,
    transactionStats: '/blockchain/transactions/stats',
    blocks: '/blockchain/blocks',
    blockDetail: (height: number) => `/blockchain/blocks/${height}`,
    chainInfo: '/blockchain/chain/info',
  },

  // Consensus & Network
  consensus: {
    metrics: '/consensus/metrics',
    status: '/consensus/status',
  },

  // Validators
  validators: {
    list: '/validators',
    detail: (id: string) => `/validators/${id}`,
    stakingInfo: '/validators/staking/info',
    stake: (validatorId: string) => `/validators/${validatorId}/stake`,
  },

  // AI Optimization
  ai: {
    models: '/ai/models',
    metrics: '/ai/metrics',
    predictions: '/ai/predictions',
    retrain: (modelId: string) => `/ai/models/${modelId}/retrain`,
  },

  // Quantum Security
  security: {
    status: '/security/status',
    keys: '/security/keys',
    metrics: '/security/metrics',
    audits: '/security/audits',
    scan: '/security/scan',
    rotateKeys: '/security/keys/rotate',
  },

  // Cross-Chain Bridge
  bridge: {
    bridges: '/bridge/bridges',
    transfers: '/bridge/transfers',
    transferDetail: (id: string) => `/bridge/transfers/${id}`,
    supportedChains: '/bridge/chains',
    metrics: '/bridge/metrics',
  },

  // Smart Contracts
  contracts: {
    deploy: '/contracts/deploy',
    ricardian: {
      upload: '/contracts/ricardian/upload',
      list: '/contracts/ricardian',
    },
  },

  // Tokenization (External APIs)
  tokenization: {
    sources: '/tokenization/sources',
    transactions: '/tokenization/transactions',
    channels: {
      stats: '/tokenization/channels/stats',
    },
  },

  // Real-World Asset Registry
  rwa: {
    tokenize: '/rwa/tokenize',
    list: '/rwa/tokens',
    detail: (id: string) => `/rwa/tokens/${id}`,
  },

  // Health & Status
  health: '/health',
  info: '/info',
  stats: '/stats',
  analytics: {
    dashboard: '/analytics/dashboard',
  },
};

// Timeout Settings (in milliseconds)
export const API_TIMEOUTS = {
  default: 10000,
  longOperation: 30000, // For uploads, batch operations
  streaming: 60000, // For websocket/streaming
};

// Retry Configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // ms
  maxDelay: 10000, // ms
  backoffMultiplier: 2,
};
