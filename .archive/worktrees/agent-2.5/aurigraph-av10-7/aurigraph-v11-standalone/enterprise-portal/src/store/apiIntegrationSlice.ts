import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  APIIntegrationState,
  OracleFeed,
  ExternalAPIConfig,
  SmartContractAPIMapping,
  ContractOracleBinding,
} from '../types/apiIntegration';
import apiIntegrationService from '../services/APIIntegrationService';

const initialState: APIIntegrationState = {
  // Oracle Management
  oracleSources: [],
  priceFeedPairs: [],
  oracleFeeds: [],
  priceConsensus: [],
  selectedOracleSource: undefined,

  // API Keys
  apiKeys: [],
  keyRotationLogs: [],
  selectedApiKey: undefined,

  // External APIs
  externalAPIs: [],
  selectedAPI: undefined,

  // Usage Analytics
  usageMetrics: undefined,
  apiQuotas: [],
  callLogs: [],

  // Health Monitoring
  healthChecks: [],
  uptimeStats: [],
  priceFeedAlerts: [],

  // Contract Bridges
  contractMappings: [],
  apiExecutions: [],
  contractBindings: [],

  // UI State
  loading: false,
  error: undefined,
  lastUpdated: undefined,
};

// ========================================
// Async Thunks - Oracle Management
// ========================================

export const fetchOracleSources = createAsyncThunk(
  'apiIntegration/fetchOracleSources',
  async () => {
    const response = await apiIntegrationService.getOracleSources();
    return response;
  }
);

export const fetchPriceFeedPairs = createAsyncThunk(
  'apiIntegration/fetchPriceFeedPairs',
  async () => {
    const response = await apiIntegrationService.getPriceFeedPairs();
    return response;
  }
);

export const fetchOraclePrice = createAsyncThunk(
  'apiIntegration/fetchOraclePrice',
  async ({ assetId, source }: { assetId: string; source: OracleSourceType }) => {
    const response = await apiIntegrationService.getOraclePrice(assetId, source);
    return response;
  }
);

export const fetchPriceConsensus = createAsyncThunk(
  'apiIntegration/fetchPriceConsensus',
  async (assetId: string) => {
    const response = await apiIntegrationService.getPriceConsensus(assetId);
    return response;
  }
);

export const updateOracleConfig = createAsyncThunk(
  'apiIntegration/updateOracleConfig',
  async (config: any) => {
    const response = await apiIntegrationService.updateOracleConfig(config);
    return response;
  }
);

export const subscribeToOracleFeed = createAsyncThunk(
  'apiIntegration/subscribeToOracleFeed',
  async ({ assetId, callbackUrl }: { assetId: string; callbackUrl: string }) => {
    const response = await apiIntegrationService.subscribeToOracleFeed(assetId, callbackUrl);
    return response;
  }
);

// ========================================
// Async Thunks - API Key Management
// ========================================

export const fetchAPIKeys = createAsyncThunk(
  'apiIntegration/fetchAPIKeys',
  async () => {
    const response = await apiIntegrationService.getAPIKeys();
    return response;
  }
);

export const createAPIKey = createAsyncThunk(
  'apiIntegration/createAPIKey',
  async (keyData: any) => {
    const response = await apiIntegrationService.createAPIKey(keyData);
    return response;
  }
);

export const rotateAPIKey = createAsyncThunk(
  'apiIntegration/rotateAPIKey',
  async (keyId: string) => {
    const response = await apiIntegrationService.rotateAPIKey(keyId);
    return response;
  }
);

export const revokeAPIKey = createAsyncThunk(
  'apiIntegration/revokeAPIKey',
  async (keyId: string) => {
    const response = await apiIntegrationService.revokeAPIKey(keyId);
    return response;
  }
);

export const fetchKeyRotationLogs = createAsyncThunk(
  'apiIntegration/fetchKeyRotationLogs',
  async (keyId: string) => {
    const response = await apiIntegrationService.getKeyRotationLogs(keyId);
    return response;
  }
);

// ========================================
// Async Thunks - External API Config
// ========================================

export const fetchExternalAPIs = createAsyncThunk(
  'apiIntegration/fetchExternalAPIs',
  async () => {
    const response = await apiIntegrationService.getExternalAPIs();
    return response;
  }
);

export const createExternalAPI = createAsyncThunk(
  'apiIntegration/createExternalAPI',
  async (apiConfig: Partial<ExternalAPIConfig>) => {
    const response = await apiIntegrationService.createExternalAPI(apiConfig);
    return response;
  }
);

export const updateExternalAPI = createAsyncThunk(
  'apiIntegration/updateExternalAPI',
  async ({ configId, updates }: { configId: string; updates: Partial<ExternalAPIConfig> }) => {
    const response = await apiIntegrationService.updateExternalAPI(configId, updates);
    return response;
  }
);

export const testExternalAPI = createAsyncThunk(
  'apiIntegration/testExternalAPI',
  async (configId: string) => {
    const response = await apiIntegrationService.testExternalAPI(configId);
    return response;
  }
);

// ========================================
// Async Thunks - Usage Analytics
// ========================================

export const fetchUsageMetrics = createAsyncThunk(
  'apiIntegration/fetchUsageMetrics',
  async (period: string = '24h') => {
    const response = await apiIntegrationService.getUsageMetrics(period);
    return response;
  }
);

export const fetchAPIQuotas = createAsyncThunk(
  'apiIntegration/fetchAPIQuotas',
  async () => {
    const response = await apiIntegrationService.getAPIQuotas();
    return response;
  }
);

export const fetchAPICallLogs = createAsyncThunk(
  'apiIntegration/fetchAPICallLogs',
  async (params?: { limit?: number; offset?: number }) => {
    const response = await apiIntegrationService.getAPICallLogs(params);
    return response;
  }
);

// ========================================
// Async Thunks - Health Monitoring
// ========================================

export const fetchOracleHealth = createAsyncThunk(
  'apiIntegration/fetchOracleHealth',
  async () => {
    const response = await apiIntegrationService.getOracleHealth();
    return response;
  }
);

export const fetchUptimeStats = createAsyncThunk(
  'apiIntegration/fetchUptimeStats',
  async (source: OracleSourceType) => {
    const response = await apiIntegrationService.getUptimeStats(source);
    return response;
  }
);

export const fetchPriceFeedAlerts = createAsyncThunk(
  'apiIntegration/fetchPriceFeedAlerts',
  async () => {
    const response = await apiIntegrationService.getPriceFeedAlerts();
    return response;
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'apiIntegration/acknowledgeAlert',
  async (alertId: string) => {
    const response = await apiIntegrationService.acknowledgeAlert(alertId);
    return response;
  }
);

// ========================================
// Async Thunks - Contract API Bridge
// ========================================

export const fetchContractMappings = createAsyncThunk(
  'apiIntegration/fetchContractMappings',
  async () => {
    const response = await apiIntegrationService.getContractMappings();
    return response;
  }
);

export const createContractMapping = createAsyncThunk(
  'apiIntegration/createContractMapping',
  async (mapping: Partial<SmartContractAPIMapping>) => {
    const response = await apiIntegrationService.createContractMapping(mapping);
    return response;
  }
);

export const executeContractAPI = createAsyncThunk(
  'apiIntegration/executeContractAPI',
  async (mappingId: string) => {
    const response = await apiIntegrationService.executeContractAPI(mappingId);
    return response;
  }
);

export const fetchAPIExecutions = createAsyncThunk(
  'apiIntegration/fetchAPIExecutions',
  async (mappingId: string) => {
    const response = await apiIntegrationService.getAPIExecutions(mappingId);
    return response;
  }
);

export const fetchContractBindings = createAsyncThunk(
  'apiIntegration/fetchContractBindings',
  async () => {
    const response = await apiIntegrationService.getContractBindings();
    return response;
  }
);

export const createContractBinding = createAsyncThunk(
  'apiIntegration/createContractBinding',
  async (binding: Partial<ContractOracleBinding>) => {
    const response = await apiIntegrationService.createContractBinding(binding);
    return response;
  }
);

// ========================================
// Slice Definition
// ========================================

const apiIntegrationSlice = createSlice({
  name: 'apiIntegration',
  initialState,
  reducers: {
    // Oracle Management
    selectOracleSource: (state, action: PayloadAction<OracleSourceType | undefined>) => {
      state.selectedOracleSource = action.payload;
    },
    addOracleFeed: (state, action: PayloadAction<OracleFeed>) => {
      state.oracleFeeds.push(action.payload);
    },
    updateOracleFeed: (state, action: PayloadAction<OracleFeed>) => {
      const index = state.oracleFeeds.findIndex(f => f.feedId === action.payload.feedId);
      if (index !== -1) {
        state.oracleFeeds[index] = action.payload;
      }
    },

    // API Keys
    selectAPIKey: (state, action: PayloadAction<string | undefined>) => {
      state.selectedApiKey = action.payload;
    },
    updateAPIKeyStatus: (state, action: PayloadAction<{ keyId: string; status: string }>) => {
      const key = state.apiKeys.find(k => k.keyId === action.payload.keyId);
      if (key) {
        key.status = action.payload.status as any;
      }
    },

    // External APIs
    selectExternalAPI: (state, action: PayloadAction<string | undefined>) => {
      state.selectedAPI = action.payload;
    },
    toggleExternalAPI: (state, action: PayloadAction<string>) => {
      const api = state.externalAPIs.find(a => a.configId === action.payload);
      if (api) {
        api.enabled = !api.enabled;
      }
    },

    // Alerts
    dismissAlert: (state, action: PayloadAction<string>) => {
      state.priceFeedAlerts = state.priceFeedAlerts.filter(a => a.alertId !== action.payload);
    },

    // UI State
    clearError: (state) => {
      state.error = undefined;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Oracle Sources
    builder
      .addCase(fetchOracleSources.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchOracleSources.fulfilled, (state, action) => {
        state.loading = false;
        state.oracleSources = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchOracleSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Price Feed Pairs
    builder
      .addCase(fetchPriceFeedPairs.fulfilled, (state, action) => {
        state.priceFeedPairs = action.payload;
      });

    // Oracle Price
    builder
      .addCase(fetchOraclePrice.fulfilled, (state, action) => {
        state.oracleFeeds.push(action.payload);
      });

    // Price Consensus
    builder
      .addCase(fetchPriceConsensus.fulfilled, (state, action) => {
        const index = state.priceConsensus.findIndex(
          pc => pc.assetId === action.payload.assetId
        );
        if (index !== -1) {
          state.priceConsensus[index] = action.payload;
        } else {
          state.priceConsensus.push(action.payload);
        }
      });

    // API Keys
    builder
      .addCase(fetchAPIKeys.fulfilled, (state, action) => {
        state.apiKeys = action.payload;
      })
      .addCase(createAPIKey.fulfilled, (state, action) => {
        state.apiKeys.push(action.payload);
      })
      .addCase(rotateAPIKey.fulfilled, (state, action) => {
        const index = state.apiKeys.findIndex(k => k.keyId === action.payload.keyId);
        if (index !== -1) {
          state.apiKeys[index] = action.payload;
        }
      })
      .addCase(fetchKeyRotationLogs.fulfilled, (state, action) => {
        state.keyRotationLogs = action.payload;
      });

    // External APIs
    builder
      .addCase(fetchExternalAPIs.fulfilled, (state, action) => {
        state.externalAPIs = action.payload;
      })
      .addCase(createExternalAPI.fulfilled, (state, action) => {
        state.externalAPIs.push(action.payload);
      })
      .addCase(updateExternalAPI.fulfilled, (state, action) => {
        const index = state.externalAPIs.findIndex(
          api => api.configId === action.payload.configId
        );
        if (index !== -1) {
          state.externalAPIs[index] = action.payload;
        }
      });

    // Usage Analytics
    builder
      .addCase(fetchUsageMetrics.fulfilled, (state, action) => {
        state.usageMetrics = action.payload;
      })
      .addCase(fetchAPIQuotas.fulfilled, (state, action) => {
        state.apiQuotas = action.payload;
      })
      .addCase(fetchAPICallLogs.fulfilled, (state, action) => {
        state.callLogs = action.payload;
      });

    // Health Monitoring
    builder
      .addCase(fetchOracleHealth.fulfilled, (state, action) => {
        state.healthChecks = action.payload;
      })
      .addCase(fetchUptimeStats.fulfilled, (state, action) => {
        const index = state.uptimeStats.findIndex(
          stats => stats.source === action.payload.source
        );
        if (index !== -1) {
          state.uptimeStats[index] = action.payload;
        } else {
          state.uptimeStats.push(action.payload);
        }
      })
      .addCase(fetchPriceFeedAlerts.fulfilled, (state, action) => {
        state.priceFeedAlerts = action.payload;
      });

    // Contract Bridges
    builder
      .addCase(fetchContractMappings.fulfilled, (state, action) => {
        state.contractMappings = action.payload;
      })
      .addCase(createContractMapping.fulfilled, (state, action) => {
        state.contractMappings.push(action.payload);
      })
      .addCase(fetchAPIExecutions.fulfilled, (state, action) => {
        state.apiExecutions = action.payload;
      })
      .addCase(fetchContractBindings.fulfilled, (state, action) => {
        state.contractBindings = action.payload;
      })
      .addCase(createContractBinding.fulfilled, (state, action) => {
        state.contractBindings.push(action.payload);
      });
  },
});

export const {
  selectOracleSource,
  addOracleFeed,
  updateOracleFeed,
  selectAPIKey,
  updateAPIKeyStatus,
  selectExternalAPI,
  toggleExternalAPI,
  dismissAlert,
  clearError,
  setLoading,
} = apiIntegrationSlice.actions;

export default apiIntegrationSlice.reducer;
