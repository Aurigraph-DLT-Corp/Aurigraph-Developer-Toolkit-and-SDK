import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TransactionOverview {
  totalTransactions24h: number;
  avgTransactionValue: number;
  currentTPS: number;
  successRate: number;
  failureRate: number;
  totalVolume24h: number;
  peakTPS: number;
  avgConfirmationTime: number;
}

export interface TransactionTypeData {
  type: string;
  count: number;
  volume: number;
  avgGas: number;
  successRate: number;
  percentage: number;
}

export interface GasAnalytics {
  avgGasPrice: number;
  minGasPrice: number;
  maxGasPrice: number;
  totalGasUsed: number;
  estimatedSavings: number;
  gasPriceTrend: Array<{ time: string; price: number }>;
  expensiveTransactions: Array<{
    id: string;
    gasUsed: number;
    gasPrice: number;
    totalCost: number;
    timestamp: string;
  }>;
}

export interface TransactionPattern {
  hourlyDistribution: Array<{ hour: number; count: number; avgGas: number }>;
  topSenders: Array<{ address: string; count: number; volume: number }>;
  topReceivers: Array<{ address: string; count: number; volume: number }>;
  congestionLevel: 'low' | 'medium' | 'high';
  recommendedTimes: string[];
  peakHours: number[];
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorRate: number;
  errorsByType: Array<{ type: string; count: number; percentage: number }>;
  errorTrend: Array<{ time: string; count: number }>;
  topErrorCauses: Array<{ cause: string; count: number; recommendation: string }>;
}

export interface TransactionAnalyticsState {
  // Data
  overview: TransactionOverview | null;
  typeBreakdown: TransactionTypeData[];
  gasAnalytics: GasAnalytics | null;
  patterns: TransactionPattern | null;
  errorAnalysis: ErrorAnalysis | null;

  // Filters & Settings
  timeRange: '1h' | '24h' | '7d' | '30d';
  selectedType: string;

  // UI State
  loading: boolean;
  errors: Record<string, string>;
  lastRefresh: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: TransactionAnalyticsState = {
  overview: null,
  typeBreakdown: [],
  gasAnalytics: null,
  patterns: null,
  errorAnalysis: null,

  timeRange: '24h',
  selectedType: 'all',

  loading: false,
  errors: {},
  lastRefresh: null,
};

// ============================================================================
// SLICE
// ============================================================================

const transactionAnalyticsSlice = createSlice({
  name: 'transactionAnalytics',
  initialState,
  reducers: {
    // Data Actions
    setOverview: (state, action: PayloadAction<TransactionOverview>) => {
      state.overview = action.payload;
    },

    setTypeBreakdown: (state, action: PayloadAction<TransactionTypeData[]>) => {
      state.typeBreakdown = action.payload;
    },

    setGasAnalytics: (state, action: PayloadAction<GasAnalytics>) => {
      state.gasAnalytics = action.payload;
    },

    setPatterns: (state, action: PayloadAction<TransactionPattern>) => {
      state.patterns = action.payload;
    },

    setErrorAnalysis: (state, action: PayloadAction<ErrorAnalysis>) => {
      state.errorAnalysis = action.payload;
    },

    // Filter Actions
    setTimeRange: (state, action: PayloadAction<'1h' | '24h' | '7d' | '30d'>) => {
      state.timeRange = action.payload;
    },

    setSelectedType: (state, action: PayloadAction<string>) => {
      state.selectedType = action.payload;
    },

    // UI Actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.errors = action.payload;
    },

    addError: (state, action: PayloadAction<{ key: string; message: string }>) => {
      state.errors[action.payload.key] = action.payload.message;
    },

    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },

    clearAllErrors: (state) => {
      state.errors = {};
    },

    setLastRefresh: (state, action: PayloadAction<string>) => {
      state.lastRefresh = action.payload;
    },

    // Batch Update Action
    updateAnalytics: (
      state,
      action: PayloadAction<{
        overview?: TransactionOverview;
        typeBreakdown?: TransactionTypeData[];
        gasAnalytics?: GasAnalytics;
        patterns?: TransactionPattern;
        errorAnalysis?: ErrorAnalysis;
      }>
    ) => {
      if (action.payload.overview) state.overview = action.payload.overview;
      if (action.payload.typeBreakdown) state.typeBreakdown = action.payload.typeBreakdown;
      if (action.payload.gasAnalytics) state.gasAnalytics = action.payload.gasAnalytics;
      if (action.payload.patterns) state.patterns = action.payload.patterns;
      if (action.payload.errorAnalysis) state.errorAnalysis = action.payload.errorAnalysis;
      state.lastRefresh = new Date().toISOString();
    },

    // Reset Action
    resetAnalytics: () => initialState,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setOverview,
  setTypeBreakdown,
  setGasAnalytics,
  setPatterns,
  setErrorAnalysis,
  setTimeRange,
  setSelectedType,
  setLoading,
  setErrors,
  addError,
  clearError,
  clearAllErrors,
  setLastRefresh,
  updateAnalytics,
  resetAnalytics,
} = transactionAnalyticsSlice.actions;

// ============================================================================
// SELECTORS
// ============================================================================

export const selectTransactionAnalytics = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics;

export const selectOverview = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.overview;

export const selectTypeBreakdown = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.typeBreakdown;

export const selectFilteredTypeBreakdown = (state: { transactionAnalytics: TransactionAnalyticsState }) => {
  const { typeBreakdown, selectedType } = state.transactionAnalytics;
  if (selectedType === 'all') return typeBreakdown;
  return typeBreakdown.filter((item) => item.type === selectedType);
};

export const selectGasAnalytics = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.gasAnalytics;

export const selectPatterns = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.patterns;

export const selectErrorAnalysis = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.errorAnalysis;

export const selectTimeRange = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.timeRange;

export const selectSelectedType = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.selectedType;

export const selectLoading = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.loading;

export const selectErrors = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.errors;

export const selectHasErrors = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  Object.keys(state.transactionAnalytics.errors).length > 0;

export const selectLastRefresh = (state: { transactionAnalytics: TransactionAnalyticsState }) =>
  state.transactionAnalytics.lastRefresh;

// Computed Selectors
export const selectTransactionStats = (state: { transactionAnalytics: TransactionAnalyticsState }) => {
  const { overview, typeBreakdown } = state.transactionAnalytics;
  if (!overview) return null;

  const totalTypes = typeBreakdown.length;
  const avgTypeVolume = typeBreakdown.reduce((sum, type) => sum + type.volume, 0) / (totalTypes || 1);

  return {
    totalTransactions: overview.totalTransactions24h,
    totalVolume: overview.totalVolume24h,
    avgValue: overview.avgTransactionValue,
    tps: overview.currentTPS,
    totalTypes,
    avgTypeVolume,
  };
};

export const selectGasEfficiency = (state: { transactionAnalytics: TransactionAnalyticsState }) => {
  const { gasAnalytics } = state.transactionAnalytics;
  if (!gasAnalytics) return null;

  const efficiency = (gasAnalytics.avgGasPrice / gasAnalytics.maxGasPrice) * 100;
  const savingsPercentage = (gasAnalytics.estimatedSavings / (gasAnalytics.totalGasUsed / 1e9)) * 100;

  return {
    efficiency,
    savingsPercentage,
    avgPrice: gasAnalytics.avgGasPrice,
    potentialSavings: gasAnalytics.estimatedSavings,
  };
};

export const selectNetworkHealth = (state: { transactionAnalytics: TransactionAnalyticsState }) => {
  const { overview, patterns, errorAnalysis } = state.transactionAnalytics;
  if (!overview || !patterns || !errorAnalysis) return null;

  const loadPercentage = (overview.currentTPS / overview.peakTPS) * 100;
  const healthScore = overview.successRate - errorAnalysis.errorRate;

  return {
    congestion: patterns.congestionLevel,
    load: loadPercentage,
    healthScore,
    successRate: overview.successRate,
    errorRate: errorAnalysis.errorRate,
  };
};

export default transactionAnalyticsSlice.reducer;
