/**
 * Demo App Redux Slice
 *
 * Manages state for the demo app including:
 * - Nodes (Channel, Validator, Business, Slim)
 * - System metrics (performance, consensus, transactions)
 * - Chart data (TPS, latency, consensus, transactions)
 * - WebSocket connection state
 * - UI state (active dashboard, selected node)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  DemoAppState,
  UpdateNodePayload,
  UpdateNodeMetricsPayload,
  UpdateNodeStatusPayload,
  UpdateSystemMetricsPayload,
  AppendChartDataPayload,
} from '../types/state';
import type { NodeConfig } from '../types/nodes';
import { DEFAULT_DEMO_APP_STATE } from '../types/state';

const initialState: DemoAppState = DEFAULT_DEMO_APP_STATE;

export const demoAppSlice = createSlice({
  name: 'demoApp',
  initialState,
  reducers: {
    // ========================================================================
    // Node Management Actions
    // ========================================================================

    /**
     * Add a new node to the network
     */
    addNode: (state, action: PayloadAction<NodeConfig>) => {
      state.nodes[action.payload.id] = action.payload;
    },

    /**
     * Update an existing node's configuration
     */
    updateNode: (state, action: PayloadAction<UpdateNodePayload>) => {
      const { nodeId, updates } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId] = {
          ...state.nodes[nodeId],
          ...updates,
          updatedAt: new Date().toISOString(),
        } as NodeConfig;
      }
    },

    /**
     * Delete a node from the network
     */
    deleteNode: (state, action: PayloadAction<string>) => {
      delete state.nodes[action.payload];
      if (state.selectedNodeId === action.payload) {
        state.selectedNodeId = null;
      }
    },

    /**
     * Update node metrics (e.g., throughput, latency)
     */
    updateNodeMetrics: (state, action: PayloadAction<UpdateNodeMetricsPayload>) => {
      const { nodeId, metrics } = action.payload;
      if (state.nodes[nodeId]) {
        const node = state.nodes[nodeId];
        // Use type assertion due to Immer limitations with discriminated unions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (node as any).metrics = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(node as any).metrics,
          ...metrics,
        };
        node.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Update node status (active, inactive, error)
     */
    updateNodeStatus: (state, action: PayloadAction<UpdateNodeStatusPayload>) => {
      const { nodeId, status } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId] = {
          ...state.nodes[nodeId],
          status,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    /**
     * Set the selected node for the node panel
     */
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },

    /**
     * Clear all nodes
     */
    clearNodes: (state) => {
      state.nodes = {};
      state.selectedNodeId = null;
    },

    // ========================================================================
    // System Metrics Actions
    // ========================================================================

    /**
     * Update system metrics (performance, consensus, transactions, etc.)
     */
    updateSystemMetrics: (state, action: PayloadAction<UpdateSystemMetricsPayload>) => {
      const { performance, consensus, transactions, channels, network } = action.payload;

      if (performance) {
        state.systemMetrics.performance = performance;
      }
      if (consensus) {
        state.systemMetrics.consensus = consensus;
      }
      if (transactions) {
        state.systemMetrics.transactions = transactions;
      }
      if (channels) {
        state.systemMetrics.channels = channels;
      }
      if (network) {
        state.systemMetrics.network = network;
      }

      state.systemMetrics.lastUpdated = new Date().toISOString();
    },

    /**
     * Clear system metrics
     */
    clearSystemMetrics: (state) => {
      state.systemMetrics = {
        performance: null,
        consensus: null,
        transactions: null,
        channels: null,
        network: null,
        lastUpdated: new Date().toISOString(),
      };
    },

    // ========================================================================
    // Chart Data Actions
    // ========================================================================

    /**
     * Append a new data point to a chart (with sliding window)
     */
    appendChartData: (state, action: PayloadAction<AppendChartDataPayload>) => {
      const { type, dataPoint } = action.payload;
      const maxDataPoints = 60; // 60-point sliding window

      // Add new data point
      state.chartData[type].push(dataPoint);

      // Remove oldest data point if exceeds max
      if (state.chartData[type].length > maxDataPoints) {
        state.chartData[type].shift();
      }
    },

    /**
     * Clear all chart data
     */
    clearChartData: (state) => {
      state.chartData = {
        tps: [],
        latency: [],
        consensus: [],
        transactions: [],
      };
    },

    /**
     * Clear a specific chart's data
     */
    clearChartDataByType: (
      state,
      action: PayloadAction<'tps' | 'latency' | 'consensus' | 'transactions'>
    ) => {
      state.chartData[action.payload] = [];
    },

    // ========================================================================
    // Dashboard State Actions
    // ========================================================================

    /**
     * Set the active dashboard (config, spatial or vizor)
     */
    setActiveDashboard: (state, action: PayloadAction<'config' | 'spatial' | 'vizor'>) => {
      state.activeDashboard = action.payload;
    },

    /**
     * Set the spatial view mode (2D or 3D)
     */
    setSpatialViewMode: (state, action: PayloadAction<'2d' | '3d'>) => {
      state.spatialViewMode = action.payload;
    },

    // ========================================================================
    // Loading State Actions
    // ========================================================================

    /**
     * Set loading state for nodes
     */
    setLoadingNodes: (state, action: PayloadAction<boolean>) => {
      state.isLoadingNodes = action.payload;
    },

    /**
     * Set loading state for metrics
     */
    setLoadingMetrics: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMetrics = action.payload;
    },

    // ========================================================================
    // Error State Actions
    // ========================================================================

    /**
     * Set error for nodes
     */
    setNodesError: (state, action: PayloadAction<string | null>) => {
      state.nodesError = action.payload;
    },

    /**
     * Set error for metrics
     */
    setMetricsError: (state, action: PayloadAction<string | null>) => {
      state.metricsError = action.payload;
    },

    /**
     * Clear all errors
     */
    clearErrors: (state) => {
      state.nodesError = null;
      state.metricsError = null;
    },

    // ========================================================================
    // WebSocket State Actions
    // ========================================================================

    /**
     * Set WebSocket connection status
     */
    setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
      if (action.payload) {
        // Reset reconnect attempts on successful connection
        state.wsReconnecting = false;
        state.wsReconnectAttempts = 0;
      }
    },

    /**
     * Set WebSocket reconnecting status
     */
    setWebSocketReconnecting: (state, action: PayloadAction<boolean>) => {
      state.wsReconnecting = action.payload;
    },

    /**
     * Increment WebSocket reconnect attempts
     */
    incrementReconnectAttempts: (state) => {
      state.wsReconnectAttempts += 1;
    },

    /**
     * Reset WebSocket reconnect attempts
     */
    resetReconnectAttempts: (state) => {
      state.wsReconnectAttempts = 0;
    },

    // ========================================================================
    // Network Configuration Actions
    // ========================================================================

    /**
     * Update network configuration
     */
    updateNetworkConfig: (state, action: PayloadAction<Partial<import('../types/dataSources').NetworkConfig>>) => {
      if (state.networkConfig) {
        state.networkConfig = {
          ...state.networkConfig,
          ...action.payload,
        };
      } else {
        state.networkConfig = action.payload as import('../types/dataSources').NetworkConfig;
      }
    },

    /**
     * Add data source to network configuration
     */
    addDataSource: (state, action: PayloadAction<import('../types/dataSources').AnyDataSource>) => {
      if (state.networkConfig) {
        state.networkConfig.dataSources.push(action.payload);
      }
    },

    /**
     * Remove data source from network configuration
     */
    removeDataSource: (state, action: PayloadAction<string>) => {
      if (state.networkConfig) {
        state.networkConfig.dataSources = state.networkConfig.dataSources.filter(
          (ds) => ds.id !== action.payload
        );
      }
    },

    /**
     * Update data source in network configuration
     */
    updateDataSource: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<import('../types/dataSources').AnyDataSource> }>
    ) => {
      if (state.networkConfig) {
        const index = state.networkConfig.dataSources.findIndex((ds) => ds.id === action.payload.id);
        if (index !== -1) {
          state.networkConfig.dataSources[index] = {
            ...state.networkConfig.dataSources[index],
            ...action.payload.updates,
          } as import('../types/dataSources').AnyDataSource;
        }
      }
    },

    // ========================================================================
    // Demo Mode Actions
    // ========================================================================

    /**
     * Toggle demo mode
     */
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
    },

    /**
     * Set demo mode
     */
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    },

    // ========================================================================
    // Reset Actions
    // ========================================================================

    /**
     * Reset entire demo app state to initial state
     */
    resetDemoApp: () => initialState,
  },
});

// Export actions
export const {
  // Node management
  addNode,
  updateNode,
  deleteNode,
  updateNodeMetrics,
  updateNodeStatus,
  setSelectedNode,
  clearNodes,

  // Network configuration
  updateNetworkConfig,
  addDataSource,
  removeDataSource,
  updateDataSource,

  // System metrics
  updateSystemMetrics,
  clearSystemMetrics,

  // Chart data
  appendChartData,
  clearChartData,
  clearChartDataByType,

  // Dashboard state
  setActiveDashboard,
  setSpatialViewMode,

  // Loading state
  setLoadingNodes,
  setLoadingMetrics,

  // Error state
  setNodesError,
  setMetricsError,
  clearErrors,

  // WebSocket state
  setWebSocketConnected,
  setWebSocketReconnecting,
  incrementReconnectAttempts,
  resetReconnectAttempts,

  // Demo mode
  toggleDemoMode,
  setDemoMode,

  // Reset
  resetDemoApp,
} = demoAppSlice.actions;

// Export reducer
export default demoAppSlice.reducer;
