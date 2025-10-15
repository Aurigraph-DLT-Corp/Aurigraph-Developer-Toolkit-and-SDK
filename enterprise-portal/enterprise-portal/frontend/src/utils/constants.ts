/**
 * Application Constants
 */

// API Configuration
// NOTE: Integrated with Aurigraph DLT V11.3.0 backend (HTTPS)
// Production: https://dlt.aurigraph.io:9443
// Development: https://localhost:9443
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:9443';
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:9443';

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
