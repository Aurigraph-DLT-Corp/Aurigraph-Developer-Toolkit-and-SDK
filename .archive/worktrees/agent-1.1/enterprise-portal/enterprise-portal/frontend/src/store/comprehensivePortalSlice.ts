/**
 * Comprehensive Portal Redux Slice
 *
 * State management for blockchain explorer, validators, AI optimization,
 * quantum security, and cross-chain bridge features
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  Transaction,
  Block,
  Validator,
  AIModel,
  AIOptimizationMetrics,
  QuantumSecurityStatus,
  CryptoKey,
  SecurityMetrics,
  BridgeStatus,
  CrossChainTransfer,
  SupportedChain,
} from '../types/comprehensive';

// ============================================================================
// State Interface
// ============================================================================

export interface ComprehensivePortalState {
  // Transaction Explorer
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  transactionStats: {
    totalTransactions: number;
    confirmedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    currentTps: number;
    avgConfirmationTime: number;
  };

  // Block Explorer
  blocks: Block[];
  blocksLoading: boolean;
  blocksError: string | null;
  chainInfo: {
    currentHeight: number;
    totalBlocks: number;
    totalTransactions: number;
    avgBlockTime: number;
    syncStatus: 'synced' | 'syncing' | 'stalled';
  };

  // Validators
  validators: Validator[];
  validatorsLoading: boolean;
  validatorsError: string | null;
  stakingInfo: {
    totalStaked: number;
    totalValidators: number;
    activeValidators: number;
    averageApr: number;
  };

  // AI Optimization
  aiModels: AIModel[];
  aiMetrics: AIOptimizationMetrics | null;
  aiLoading: boolean;
  aiError: string | null;

  // Quantum Security
  securityStatus: QuantumSecurityStatus | null;
  cryptoKeys: CryptoKey[];
  securityMetrics: SecurityMetrics | null;
  securityLoading: boolean;
  securityError: string | null;

  // Cross-Chain Bridge
  bridges: BridgeStatus[];
  transfers: CrossChainTransfer[];
  supportedChains: SupportedChain[];
  bridgeMetrics: {
    totalValueLocked: number;
    totalTransfers24h: number;
    successRate: number;
  } | null;
  bridgeLoading: boolean;
  bridgeError: string | null;

  // WebSocket connection status
  wsConnected: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ComprehensivePortalState = {
  // Transactions
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  transactionStats: {
    totalTransactions: 0,
    confirmedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    currentTps: 0,
    avgConfirmationTime: 0,
  },

  // Blocks
  blocks: [],
  blocksLoading: false,
  blocksError: null,
  chainInfo: {
    currentHeight: 0,
    totalBlocks: 0,
    totalTransactions: 0,
    avgBlockTime: 0,
    syncStatus: 'synced',
  },

  // Validators
  validators: [],
  validatorsLoading: false,
  validatorsError: null,
  stakingInfo: {
    totalStaked: 0,
    totalValidators: 0,
    activeValidators: 0,
    averageApr: 0,
  },

  // AI Optimization
  aiModels: [],
  aiMetrics: null,
  aiLoading: false,
  aiError: null,

  // Quantum Security
  securityStatus: null,
  cryptoKeys: [],
  securityMetrics: null,
  securityLoading: false,
  securityError: null,

  // Cross-Chain Bridge
  bridges: [],
  transfers: [],
  supportedChains: [],
  bridgeMetrics: null,
  bridgeLoading: false,
  bridgeError: null,

  // WebSocket
  wsConnected: false,
};

// ============================================================================
// Slice Definition
// ============================================================================

export const comprehensivePortalSlice = createSlice({
  name: 'comprehensivePortal',
  initialState,
  reducers: {
    // ========================================================================
    // Transaction Explorer Actions
    // ========================================================================

    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },

    setTransactionsLoading: (state, action: PayloadAction<boolean>) => {
      state.transactionsLoading = action.payload;
    },

    setTransactionsError: (state, action: PayloadAction<string | null>) => {
      state.transactionsError = action.payload;
    },

    setTransactionStats: (
      state,
      action: PayloadAction<ComprehensivePortalState['transactionStats']>
    ) => {
      state.transactionStats = action.payload;
    },

    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (state.transactions.length > 100) {
        state.transactions.pop();
      }
    },

    // ========================================================================
    // Block Explorer Actions
    // ========================================================================

    setBlocks: (state, action: PayloadAction<Block[]>) => {
      state.blocks = action.payload;
    },

    setBlocksLoading: (state, action: PayloadAction<boolean>) => {
      state.blocksLoading = action.payload;
    },

    setBlocksError: (state, action: PayloadAction<string | null>) => {
      state.blocksError = action.payload;
    },

    setChainInfo: (state, action: PayloadAction<ComprehensivePortalState['chainInfo']>) => {
      state.chainInfo = action.payload;
    },

    addBlock: (state, action: PayloadAction<Block>) => {
      state.blocks.unshift(action.payload);
      if (state.blocks.length > 50) {
        state.blocks.pop();
      }
      state.chainInfo.currentHeight = action.payload.height;
    },

    // ========================================================================
    // Validator Actions
    // ========================================================================

    setValidators: (state, action: PayloadAction<Validator[]>) => {
      state.validators = action.payload;
    },

    setValidatorsLoading: (state, action: PayloadAction<boolean>) => {
      state.validatorsLoading = action.payload;
    },

    setValidatorsError: (state, action: PayloadAction<string | null>) => {
      state.validatorsError = action.payload;
    },

    setStakingInfo: (state, action: PayloadAction<ComprehensivePortalState['stakingInfo']>) => {
      state.stakingInfo = action.payload;
    },

    updateValidator: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Validator> }>
    ) => {
      const { id, updates } = action.payload;
      const index = state.validators.findIndex((v) => v.id === id);
      if (index !== -1 && state.validators[index]) {
        state.validators[index] = { ...state.validators[index], ...updates };
      }
    },

    // ========================================================================
    // AI Optimization Actions
    // ========================================================================

    setAIModels: (state, action: PayloadAction<AIModel[]>) => {
      state.aiModels = action.payload;
    },

    setAIMetrics: (state, action: PayloadAction<AIOptimizationMetrics | null>) => {
      state.aiMetrics = action.payload;
    },

    setAILoading: (state, action: PayloadAction<boolean>) => {
      state.aiLoading = action.payload;
    },

    setAIError: (state, action: PayloadAction<string | null>) => {
      state.aiError = action.payload;
    },

    updateAIModel: (state, action: PayloadAction<{ id: string; updates: Partial<AIModel> }>) => {
      const { id, updates } = action.payload;
      const index = state.aiModels.findIndex((m) => m.id === id);
      if (index !== -1 && state.aiModels[index]) {
        state.aiModels[index] = { ...state.aiModels[index], ...updates };
      }
    },

    // ========================================================================
    // Quantum Security Actions
    // ========================================================================

    setSecurityStatus: (state, action: PayloadAction<QuantumSecurityStatus | null>) => {
      state.securityStatus = action.payload;
    },

    setCryptoKeys: (state, action: PayloadAction<CryptoKey[]>) => {
      state.cryptoKeys = action.payload;
    },

    setSecurityMetrics: (state, action: PayloadAction<SecurityMetrics | null>) => {
      state.securityMetrics = action.payload;
    },

    setSecurityLoading: (state, action: PayloadAction<boolean>) => {
      state.securityLoading = action.payload;
    },

    setSecurityError: (state, action: PayloadAction<string | null>) => {
      state.securityError = action.payload;
    },

    // ========================================================================
    // Cross-Chain Bridge Actions
    // ========================================================================

    setBridges: (state, action: PayloadAction<BridgeStatus[]>) => {
      state.bridges = action.payload;
    },

    setTransfers: (state, action: PayloadAction<CrossChainTransfer[]>) => {
      state.transfers = action.payload;
    },

    setSupportedChains: (state, action: PayloadAction<SupportedChain[]>) => {
      state.supportedChains = action.payload;
    },

    setBridgeMetrics: (state, action: PayloadAction<ComprehensivePortalState['bridgeMetrics']>) => {
      state.bridgeMetrics = action.payload;
    },

    setBridgeLoading: (state, action: PayloadAction<boolean>) => {
      state.bridgeLoading = action.payload;
    },

    setBridgeError: (state, action: PayloadAction<string | null>) => {
      state.bridgeError = action.payload;
    },

    addTransfer: (state, action: PayloadAction<CrossChainTransfer>) => {
      state.transfers.unshift(action.payload);
      if (state.transfers.length > 50) {
        state.transfers.pop();
      }
    },

    updateTransfer: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<CrossChainTransfer> }>
    ) => {
      const { id, updates } = action.payload;
      const index = state.transfers.findIndex((t) => t.id === id);
      if (index !== -1 && state.transfers[index]) {
        state.transfers[index] = { ...state.transfers[index], ...updates };
      }
    },

    // ========================================================================
    // WebSocket Actions
    // ========================================================================

    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },

    // ========================================================================
    // Reset Actions
    // ========================================================================

    resetComprehensivePortal: () => initialState,
  },
});

// ============================================================================
// Export Actions
// ============================================================================

export const {
  // Transactions
  setTransactions,
  setTransactionsLoading,
  setTransactionsError,
  setTransactionStats,
  addTransaction,

  // Blocks
  setBlocks,
  setBlocksLoading,
  setBlocksError,
  setChainInfo,
  addBlock,

  // Validators
  setValidators,
  setValidatorsLoading,
  setValidatorsError,
  setStakingInfo,
  updateValidator,

  // AI Optimization
  setAIModels,
  setAIMetrics,
  setAILoading,
  setAIError,
  updateAIModel,

  // Quantum Security
  setSecurityStatus,
  setCryptoKeys,
  setSecurityMetrics,
  setSecurityLoading,
  setSecurityError,

  // Cross-Chain Bridge
  setBridges,
  setTransfers,
  setSupportedChains,
  setBridgeMetrics,
  setBridgeLoading,
  setBridgeError,
  addTransfer,
  updateTransfer,

  // WebSocket
  setWsConnected,

  // Reset
  resetComprehensivePortal,
} = comprehensivePortalSlice.actions;

// Export reducer
export default comprehensivePortalSlice.reducer;
