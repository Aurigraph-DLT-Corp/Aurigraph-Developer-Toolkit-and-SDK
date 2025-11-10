/**
 * Redux State Type Definitions for Aurigraph Enterprise Portal
 *
 * Defines the complete Redux state shape and action types
 */

import type { NodeConfig, NodesMap, NodeType, NodeStatus, NodePosition } from './nodes';
import type {
  PerformanceMetrics,
  ConsensusStats,
  TransactionStats,
  ChannelStats,
  NetworkStats,
} from './api';
import type { NetworkConfig } from './dataSources';

// ============================================================================
// Demo App State (demoAppSlice)
// ============================================================================

export interface ChartDataPoint {
  timestamp: string;
  value: number;
}

export interface ChartData {
  tps: ChartDataPoint[];
  latency: ChartDataPoint[];
  consensus: ChartDataPoint[];
  transactions: ChartDataPoint[];
}

export interface SystemMetrics {
  performance: PerformanceMetrics | null;
  consensus: ConsensusStats | null;
  transactions: TransactionStats | null;
  channels: ChannelStats | null;
  network: NetworkStats | null;
  lastUpdated: string;
}

export interface DemoAppState {
  // Nodes
  nodes: NodesMap;
  selectedNodeId: string | null;

  // Network Configuration
  networkConfig: NetworkConfig | null;

  // System Metrics
  systemMetrics: SystemMetrics;

  // Chart Data (60-point sliding window)
  chartData: ChartData;

  // Dashboard State
  activeDashboard: 'config' | 'spatial' | 'vizor';
  spatialViewMode: '2d' | '3d';

  // Loading States
  isLoadingNodes: boolean;
  isLoadingMetrics: boolean;

  // Error States
  nodesError: string | null;
  metricsError: string | null;

  // WebSocket Connection
  wsConnected: boolean;
  wsReconnecting: boolean;
  wsReconnectAttempts: number;

  // Demo Mode
  demoMode: boolean;
}

// ============================================================================
// Settings State (settingsSlice)
// ============================================================================

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  duration: number;
}

export interface PerformanceConfig {
  chartUpdateInterval: number; // ms
  metricsUpdateInterval: number; // ms
  maxChartDataPoints: number;
  enableAnimations: boolean;
  enableParticleEffects: boolean;
}

export interface ExternalFeedConfig {
  alpaca: {
    enabled: boolean;
    symbols: string[];
    updateInterval: number;
  };
  weather: {
    enabled: boolean;
    locations: string[];
    updateInterval: number;
  };
  twitter: {
    enabled: boolean;
    keywords: string[];
    updateInterval: number;
  };
}

export interface SettingsState {
  theme: ThemeConfig;
  notifications: NotificationConfig;
  performance: PerformanceConfig;
  externalFeeds: ExternalFeedConfig;
  apiBaseUrl: string;
  wsUrl: string;
  demoMode: boolean;
}

// ============================================================================
// Auth State (authSlice)
// ============================================================================

export interface User {
  id: string;
  username: string;
  email?: string;
  roles?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  expiresIn: number | null;
  lastCheckTime: number | null;
}

// ============================================================================
// Live Data State (liveDataSlice)
// ============================================================================

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  hash: string;
  blockHeight: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  fee: number;
  gasUsed?: number;
}

export interface Validator {
  nodeId: string;
  address: string;
  status: 'active' | 'inactive' | 'syncing';
  stake: number;
  rewards: number;
  uptime: number;
  lastHeartbeat: string;
}

export interface ConsensusStateData {
  term: number;
  blockHeight: number;
  leader: string;
  state: 'leader' | 'follower' | 'candidate';
  isHealthy: boolean;
  activeValidators: number;
  totalValidators: number;
}

export interface NetworkMetrics {
  totalNodes: number;
  activeNodes: number;
  networkLatencyMs: number;
  bandwidthUtilization: number;
  totalConnections: number;
  nodesByType: Record<string, number>;
}

export interface PerformanceMetricsData {
  tps: number;
  avgTps: number;
  peakTps: number;
  totalTransactions: number;
  activeTransactions: number;
  pendingTransactions: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  timestamp: string;
}

export interface ChannelMetrics {
  totalChannels: number;
  activeChannels: number;
  totalConnections: number;
  activeConnections: number;
  totalPacketsTransferred: number;
  totalBytesTransferred: number;
  avgLatencyMs: number;
}

export interface LiveDataState {
  transactions: Transaction[];
  validators: Validator[];
  consensusState: ConsensusStateData | null;
  networkMetrics: NetworkMetrics | null;
  performanceMetrics: PerformanceMetricsData | null;
  channelMetrics: ChannelMetrics | null;
  connectionStates: {
    transactions: boolean;
    validators: boolean;
    consensus: boolean;
    network: boolean;
    metrics: boolean;
    channels: boolean;
    liveStream: boolean;
  };
  errors: {
    transactions: string | null;
    validators: string | null;
    consensus: string | null;
    network: string | null;
    metrics: string | null;
    channels: string | null;
  };
  lastUpdate: string;
}

// ============================================================================
// Root State
// ============================================================================

export interface RootState {
  auth: AuthState;
  demoApp: DemoAppState;
  settings: SettingsState;
  liveData: LiveDataState;
}

// ============================================================================
// Action Payload Types (for demoAppSlice)
// ============================================================================

export interface AddNodePayload {
  nodeType: NodeType;
  position: NodePosition;
  config?: Partial<NodeConfig>;
}

export interface UpdateNodePayload {
  nodeId: string;
  updates: Partial<NodeConfig>;
}

export interface UpdateNodeMetricsPayload {
  nodeId: string;
  metrics: Record<string, number | string>;
}

export interface UpdateNodeStatusPayload {
  nodeId: string;
  status: NodeStatus;
}

export interface UpdateSystemMetricsPayload {
  performance?: PerformanceMetrics;
  consensus?: ConsensusStats;
  transactions?: TransactionStats;
  channels?: ChannelStats;
  network?: NetworkStats;
}

export interface AppendChartDataPayload {
  type: 'tps' | 'latency' | 'consensus' | 'transactions';
  dataPoint: ChartDataPoint;
}

// ============================================================================
// Configuration State (Persisted)
// ============================================================================

export interface SavedConfiguration {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: NodesMap;
  settings: Partial<SettingsState>;
}

export interface ConfigurationState {
  savedConfigurations: SavedConfiguration[];
  currentConfigurationId: string | null;
  isModified: boolean;
}

// ============================================================================
// UI State (Not persisted)
// ============================================================================

export interface UIState {
  sidebarCollapsed: boolean;
  activeMenuItem: string;
  modals: {
    addNode: boolean;
    editNode: boolean;
    settings: boolean;
    about: boolean;
  };
  drawers: {
    nodePanel: boolean;
    metricsPanel: boolean;
  };
  loading: {
    global: boolean;
    nodes: boolean;
    metrics: boolean;
  };
}

// ============================================================================
// Selector Return Types
// ============================================================================

export interface NodesByTypeSelector {
  channel: NodeConfig[];
  validator: NodeConfig[];
  business: NodeConfig[];
  slim: NodeConfig[];
}

export interface SystemHealthSelector {
  overall: 'healthy' | 'degraded' | 'critical';
  database: boolean;
  consensus: boolean;
  network: boolean;
  websocket: boolean;
}

export interface PerformanceSummarySelector {
  currentTps: number;
  avgTps: number;
  peakTps: number;
  totalTransactions: number;
  avgLatency: number;
  cpuUsage: number;
  memoryUsage: number;
}

// ============================================================================
// Thunk Return Types
// ============================================================================

export interface FetchMetricsThunkResult {
  performance: PerformanceMetrics;
  consensus: ConsensusStats;
  transactions: TransactionStats;
  channels: ChannelStats;
  network: NetworkStats;
}

export interface CreateNodeThunkResult {
  node: NodeConfig;
  success: boolean;
  error?: string;
}

export interface UpdateNodeThunkResult {
  nodeId: string;
  success: boolean;
  error?: string;
}

export interface DeleteNodeThunkResult {
  nodeId: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Default State Values
// ============================================================================

export const DEFAULT_DEMO_APP_STATE: DemoAppState = {
  nodes: {},
  selectedNodeId: null,
  networkConfig: {
    channels: 1,
    validators: 4,
    businessNodes: 2,
    slimNodes: 3,
    dataSources: [],
  },
  systemMetrics: {
    performance: null,
    consensus: null,
    transactions: null,
    channels: null,
    network: null,
    lastUpdated: new Date().toISOString(),
  },
  chartData: {
    tps: [],
    latency: [],
    consensus: [],
    transactions: [],
  },
  activeDashboard: 'config',
  spatialViewMode: '2d',
  isLoadingNodes: false,
  isLoadingMetrics: false,
  nodesError: null,
  metricsError: null,
  wsConnected: false,
  wsReconnecting: false,
  wsReconnectAttempts: 0,
  demoMode: true,
};

export const DEFAULT_SETTINGS_STATE: SettingsState = {
  theme: {
    mode: 'dark',
    primaryColor: '#1890ff',
    fontSize: 'medium',
  },
  notifications: {
    enabled: true,
    sound: false,
    position: 'topRight',
    duration: 3000,
  },
  performance: {
    chartUpdateInterval: 1000,
    metricsUpdateInterval: 2000,
    maxChartDataPoints: 60,
    enableAnimations: true,
    enableParticleEffects: false,
  },
  externalFeeds: {
    alpaca: {
      enabled: false,
      symbols: ['AAPL', 'GOOGL', 'TSLA'],
      updateInterval: 5000,
    },
    weather: {
      enabled: false,
      locations: ['New York', 'London', 'Tokyo'],
      updateInterval: 60000,
    },
    twitter: {
      enabled: false,
      keywords: ['blockchain', 'DLT', 'crypto'],
      updateInterval: 30000,
    },
  },
  apiBaseUrl: 'http://localhost:9003',
  wsUrl: 'ws://localhost:9003',
  demoMode: true,
};
