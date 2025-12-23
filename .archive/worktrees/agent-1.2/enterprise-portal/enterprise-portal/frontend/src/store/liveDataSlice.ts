/**
 * Live Data Redux Slice
 *
 * Manages real-time data from WebSocket connections:
 * - Transactions
 * - Validators
 * - Consensus state
 * - Network topology
 * - Performance metrics
 * - Channel updates
 * - Connection states
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface ConsensusState {
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

export interface PerformanceMetrics {
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
  // Real-time data
  transactions: Transaction[];
  validators: Validator[];
  consensusState: ConsensusState | null;
  networkMetrics: NetworkMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  channelMetrics: ChannelMetrics | null;

  // Connection states
  connectionStates: {
    transactions: boolean;
    validators: boolean;
    consensus: boolean;
    network: boolean;
    metrics: boolean;
    channels: boolean;
    liveStream: boolean;
  };

  // Errors
  errors: Record<string, string | null>;

  // Configuration
  maxTransactionsHistory: number;
  maxValidatorsHistory: number;
}

const initialState: LiveDataState = {
  transactions: [],
  validators: [],
  consensusState: null,
  networkMetrics: null,
  performanceMetrics: null,
  channelMetrics: null,

  connectionStates: {
    transactions: false,
    validators: false,
    consensus: false,
    network: false,
    metrics: false,
    channels: false,
    liveStream: false,
  },

  errors: {
    transactions: null,
    validators: null,
    consensus: null,
    network: null,
    metrics: null,
    channels: null,
  },

  maxTransactionsHistory: 100,
  maxValidatorsHistory: 50,
};

const liveDataSlice = createSlice({
  name: 'liveData',
  initialState,
  reducers: {
    // Transaction updates
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex((t) => t.id === action.payload.id);
      if (index >= 0) {
        state.transactions[index] = action.payload;
      } else {
        state.transactions.unshift(action.payload);
        // Keep only maxTransactionsHistory entries
        if (state.transactions.length > state.maxTransactionsHistory) {
          state.transactions.pop();
        }
      }
    },

    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (state.transactions.length > state.maxTransactionsHistory) {
        state.transactions.pop();
      }
    },

    clearTransactions: (state) => {
      state.transactions = [];
    },

    // Validator updates
    updateValidator: (state, action: PayloadAction<Validator>) => {
      const index = state.validators.findIndex((v) => v.nodeId === action.payload.nodeId);
      if (index >= 0) {
        state.validators[index] = action.payload;
      } else {
        state.validators.push(action.payload);
        if (state.validators.length > state.maxValidatorsHistory) {
          state.validators.shift();
        }
      }
    },

    setValidators: (state, action: PayloadAction<Validator[]>) => {
      state.validators = action.payload.slice(0, state.maxValidatorsHistory);
    },

    // Consensus updates
    updateConsensusState: (state, action: PayloadAction<ConsensusState>) => {
      state.consensusState = action.payload;
    },

    // Network metrics updates
    updateNetworkMetrics: (state, action: PayloadAction<NetworkMetrics>) => {
      state.networkMetrics = action.payload;
    },

    // Performance metrics updates
    updatePerformanceMetrics: (state, action: PayloadAction<PerformanceMetrics>) => {
      state.performanceMetrics = action.payload;
    },

    // Channel metrics updates
    updateChannelMetrics: (state, action: PayloadAction<ChannelMetrics>) => {
      state.channelMetrics = action.payload;
    },

    // Connection state updates
    setConnectionState: (
      state,
      action: PayloadAction<{
        channel: keyof LiveDataState['connectionStates'];
        connected: boolean;
      }>
    ) => {
      state.connectionStates[action.payload.channel] = action.payload.connected;
    },

    // Error updates
    setError: (
      state,
      action: PayloadAction<{
        channel: keyof LiveDataState['errors'];
        error: string | null;
      }>
    ) => {
      state.errors[action.payload.channel] = action.payload.error;
    },

    // Clear all live data
    clearAllLiveData: (state) => {
      state.transactions = [];
      state.validators = [];
      state.consensusState = null;
      state.networkMetrics = null;
      state.performanceMetrics = null;
      state.channelMetrics = null;
      Object.keys(state.errors).forEach((key) => {
        state.errors[key as keyof LiveDataState['errors']] = null;
      });
    },

    // Reset connection states
    resetConnectionStates: (state) => {
      Object.keys(state.connectionStates).forEach((key) => {
        state.connectionStates[key as keyof LiveDataState['connectionStates']] = false;
      });
    },
  },
});

export const {
  updateTransaction,
  addTransaction,
  clearTransactions,
  updateValidator,
  setValidators,
  updateConsensusState,
  updateNetworkMetrics,
  updatePerformanceMetrics,
  updateChannelMetrics,
  setConnectionState,
  setError,
  clearAllLiveData,
  resetConnectionStates,
} = liveDataSlice.actions;

export default liveDataSlice.reducer;
