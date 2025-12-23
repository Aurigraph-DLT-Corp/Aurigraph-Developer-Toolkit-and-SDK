/**
 * RWA (Real-World Asset) Redux Slice
 * State management for RWA tokenization features
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  RWAToken,
  AssetDigitalTwin,
  RWAPortfolio,
  TokenizerStats,
  FractionalOwnershipStats,
  DividendHistory,
  ComplianceProfile,
  AssetValuation,
  OracleHealth,
  RWAFilter,
  SortOptions,
  AssetType
} from '../types/rwa'
import * as RWAService from '../services/RWAService'

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface RWAState {
  // Tokens
  tokens: RWAToken[]
  selectedToken: RWAToken | null
  tokenLoading: boolean
  tokenError: string | null

  // Digital Twins
  digitalTwins: Record<string, AssetDigitalTwin>
  digitalTwinLoading: boolean

  // Portfolio
  portfolio: RWAPortfolio | null
  portfolioLoading: boolean
  portfolioError: string | null

  // Statistics
  stats: TokenizerStats | null
  statsLoading: boolean

  // Fractional Ownership
  fractionalStats: Record<string, FractionalOwnershipStats>
  fractionalLoading: boolean

  // Dividends
  dividendHistory: Record<string, DividendHistory>
  dividendLoading: boolean

  // Compliance
  complianceProfiles: Record<string, ComplianceProfile>
  complianceLoading: boolean

  // Valuation
  valuations: Record<string, AssetValuation>
  oracleHealth: Record<string, OracleHealth> | null
  valuationLoading: boolean

  // Filters & Pagination
  currentFilter: RWAFilter
  currentSort: SortOptions
  currentPage: number
  pageSize: number
  totalItems: number
  hasMore: boolean
}

const initialState: RWAState = {
  tokens: [],
  selectedToken: null,
  tokenLoading: false,
  tokenError: null,

  digitalTwins: {},
  digitalTwinLoading: false,

  portfolio: null,
  portfolioLoading: false,
  portfolioError: null,

  stats: null,
  statsLoading: false,

  fractionalStats: {},
  fractionalLoading: false,

  dividendHistory: {},
  dividendLoading: false,

  complianceProfiles: {},
  complianceLoading: false,

  valuations: {},
  oracleHealth: null,
  valuationLoading: false,

  currentFilter: {},
  currentSort: { field: 'createdAt', direction: 'desc' },
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  hasMore: false
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// Tokenization
export const fetchTokens = createAsyncThunk(
  'rwa/fetchTokens',
  async ({ filter, sort, page, pageSize }: {
    filter?: RWAFilter
    sort?: SortOptions
    page?: number
    pageSize?: number
  }) => {
    const response = await RWAService.getTokens(filter, sort, page, pageSize)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch tokens')
    }
    return response.data
  }
)

export const fetchToken = createAsyncThunk(
  'rwa/fetchToken',
  async (tokenId: string) => {
    const response = await RWAService.getToken(tokenId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch token')
    }
    return response.data
  }
)

export const tokenizeAsset = createAsyncThunk(
  'rwa/tokenizeAsset',
  async (request: any) => {
    const response = await RWAService.tokenizeAsset(request)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to tokenize asset')
    }
    return response.data
  }
)

export const fetchTokenizerStats = createAsyncThunk(
  'rwa/fetchTokenizerStats',
  async () => {
    const response = await RWAService.getTokenizerStats()
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch stats')
    }
    return response.data
  }
)

// Digital Twin
export const fetchDigitalTwin = createAsyncThunk(
  'rwa/fetchDigitalTwin',
  async (tokenId: string) => {
    const response = await RWAService.getDigitalTwin(tokenId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch digital twin')
    }
    return response.data
  }
)

// Portfolio
export const fetchPortfolio = createAsyncThunk(
  'rwa/fetchPortfolio',
  async (ownerAddress: string) => {
    const response = await RWAService.getPortfolio(ownerAddress)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch portfolio')
    }
    return response.data
  }
)

// Fractional Ownership
export const fetchFractionalStats = createAsyncThunk(
  'rwa/fetchFractionalStats',
  async (tokenId: string) => {
    const response = await RWAService.getFractionalStats(tokenId)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch fractional stats')
    }
    return { tokenId, data: response.data }
  }
)

export const splitTokenAction = createAsyncThunk(
  'rwa/splitToken',
  async ({ tokenId, numberOfShares, minSharePrice }: {
    tokenId: string
    numberOfShares: number
    minSharePrice: string
  }) => {
    const response = await RWAService.splitToken(tokenId, numberOfShares, minSharePrice)
    if (!response.success) {
      throw new Error(response.error || 'Failed to split token')
    }
    return { tokenId, numberOfShares }
  }
)

// Dividends
export const fetchDividendHistory = createAsyncThunk(
  'rwa/fetchDividendHistory',
  async ({ tokenId, fromDate, toDate }: {
    tokenId: string
    fromDate?: string
    toDate?: string
  }) => {
    const response = await RWAService.getDividendHistory(tokenId, fromDate, toDate)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch dividend history')
    }
    return { tokenId, data: response.data }
  }
)

export const distributeDividendsAction = createAsyncThunk(
  'rwa/distributeDividends',
  async ({ tokenId, totalAmount, source, dividendType }: any) => {
    const response = await RWAService.distributeDividends(tokenId, totalAmount, source, dividendType)
    if (!response.success) {
      throw new Error(response.error || 'Failed to distribute dividends')
    }
    return { tokenId, totalAmount }
  }
)

// Compliance
export const fetchComplianceProfile = createAsyncThunk(
  'rwa/fetchComplianceProfile',
  async (userAddress: string) => {
    const response = await RWAService.getComplianceProfile(userAddress)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch compliance profile')
    }
    return { userAddress, data: response.data }
  }
)

// Valuation & Oracle
export const fetchAssetValuation = createAsyncThunk(
  'rwa/fetchAssetValuation',
  async ({ assetId, assetType }: { assetId: string, assetType: AssetType }) => {
    const response = await RWAService.getAssetValuation(assetId, assetType)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch valuation')
    }
    return { assetId, data: response.data }
  }
)

export const fetchOracleHealth = createAsyncThunk(
  'rwa/fetchOracleHealth',
  async () => {
    const response = await RWAService.getOracleHealth()
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch oracle health')
    }
    return response.data
  }
)

// ============================================================================
// SLICE
// ============================================================================

const rwaSlice = createSlice({
  name: 'rwa',
  initialState,
  reducers: {
    // Token actions
    setSelectedToken: (state, action: PayloadAction<RWAToken | null>) => {
      state.selectedToken = action.payload
    },
    clearTokenError: (state) => {
      state.tokenError = null
    },

    // Filter actions
    setFilter: (state, action: PayloadAction<RWAFilter>) => {
      state.currentFilter = action.payload
      state.currentPage = 1 // Reset to first page on filter change
    },
    clearFilter: (state) => {
      state.currentFilter = {}
      state.currentPage = 1
    },

    // Sort actions
    setSort: (state, action: PayloadAction<SortOptions>) => {
      state.currentSort = action.payload
      state.currentPage = 1
    },

    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
      state.currentPage = 1
    },

    // Clear portfolio
    clearPortfolio: (state) => {
      state.portfolio = null
      state.portfolioError = null
    },

    // Reset state
    resetRWAState: () => initialState
  },
  extraReducers: (builder) => {
    // Fetch Tokens
    builder
      .addCase(fetchTokens.pending, (state) => {
        state.tokenLoading = true
        state.tokenError = null
      })
      .addCase(fetchTokens.fulfilled, (state, action) => {
        state.tokenLoading = false
        state.tokens = action.payload.items
        state.totalItems = action.payload.total
        state.hasMore = action.payload.hasMore
        state.currentPage = action.payload.page
      })
      .addCase(fetchTokens.rejected, (state, action) => {
        state.tokenLoading = false
        state.tokenError = action.error.message || 'Failed to fetch tokens'
      })

    // Fetch Token
    builder
      .addCase(fetchToken.pending, (state) => {
        state.tokenLoading = true
        state.tokenError = null
      })
      .addCase(fetchToken.fulfilled, (state, action) => {
        state.tokenLoading = false
        state.selectedToken = action.payload
        // Update in tokens array if exists
        const index = state.tokens.findIndex(t => t.tokenId === action.payload.tokenId)
        if (index !== -1) {
          state.tokens[index] = action.payload
        }
      })
      .addCase(fetchToken.rejected, (state, action) => {
        state.tokenLoading = false
        state.tokenError = action.error.message || 'Failed to fetch token'
      })

    // Tokenize Asset
    builder
      .addCase(tokenizeAsset.pending, (state) => {
        state.tokenLoading = true
        state.tokenError = null
      })
      .addCase(tokenizeAsset.fulfilled, (state, action) => {
        state.tokenLoading = false
        state.tokens.unshift(action.payload.token)
        state.selectedToken = action.payload.token
        if (action.payload.digitalTwin) {
          state.digitalTwins[action.payload.token.tokenId] = action.payload.digitalTwin
        }
      })
      .addCase(tokenizeAsset.rejected, (state, action) => {
        state.tokenLoading = false
        state.tokenError = action.error.message || 'Failed to tokenize asset'
      })

    // Fetch Stats
    builder
      .addCase(fetchTokenizerStats.pending, (state) => {
        state.statsLoading = true
      })
      .addCase(fetchTokenizerStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchTokenizerStats.rejected, (state) => {
        state.statsLoading = false
      })

    // Fetch Digital Twin
    builder
      .addCase(fetchDigitalTwin.pending, (state) => {
        state.digitalTwinLoading = true
      })
      .addCase(fetchDigitalTwin.fulfilled, (state, action) => {
        state.digitalTwinLoading = false
        state.digitalTwins[action.payload.twinId] = action.payload
      })
      .addCase(fetchDigitalTwin.rejected, (state) => {
        state.digitalTwinLoading = false
      })

    // Fetch Portfolio
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.portfolioLoading = true
        state.portfolioError = null
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.portfolioLoading = false
        state.portfolio = action.payload
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.portfolioLoading = false
        state.portfolioError = action.error.message || 'Failed to fetch portfolio'
      })

    // Fetch Fractional Stats
    builder
      .addCase(fetchFractionalStats.pending, (state) => {
        state.fractionalLoading = true
      })
      .addCase(fetchFractionalStats.fulfilled, (state, action) => {
        state.fractionalLoading = false
        state.fractionalStats[action.payload.tokenId] = action.payload.data
      })
      .addCase(fetchFractionalStats.rejected, (state) => {
        state.fractionalLoading = false
      })

    // Fetch Dividend History
    builder
      .addCase(fetchDividendHistory.pending, (state) => {
        state.dividendLoading = true
      })
      .addCase(fetchDividendHistory.fulfilled, (state, action) => {
        state.dividendLoading = false
        state.dividendHistory[action.payload.tokenId] = action.payload.data
      })
      .addCase(fetchDividendHistory.rejected, (state) => {
        state.dividendLoading = false
      })

    // Fetch Compliance Profile
    builder
      .addCase(fetchComplianceProfile.pending, (state) => {
        state.complianceLoading = true
      })
      .addCase(fetchComplianceProfile.fulfilled, (state, action) => {
        state.complianceLoading = false
        state.complianceProfiles[action.payload.userAddress] = action.payload.data
      })
      .addCase(fetchComplianceProfile.rejected, (state) => {
        state.complianceLoading = false
      })

    // Fetch Asset Valuation
    builder
      .addCase(fetchAssetValuation.pending, (state) => {
        state.valuationLoading = true
      })
      .addCase(fetchAssetValuation.fulfilled, (state, action) => {
        state.valuationLoading = false
        state.valuations[action.payload.assetId] = action.payload.data
      })
      .addCase(fetchAssetValuation.rejected, (state) => {
        state.valuationLoading = false
      })

    // Fetch Oracle Health
    builder
      .addCase(fetchOracleHealth.fulfilled, (state, action) => {
        state.oracleHealth = action.payload
      })
  }
})

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setSelectedToken,
  clearTokenError,
  setFilter,
  clearFilter,
  setSort,
  setPage,
  setPageSize,
  clearPortfolio,
  resetRWAState
} = rwaSlice.actions

export default rwaSlice.reducer

// Selectors
export const selectAllTokens = (state: { rwa: RWAState }) => state.rwa.tokens
export const selectSelectedToken = (state: { rwa: RWAState }) => state.rwa.selectedToken
export const selectTokenLoading = (state: { rwa: RWAState }) => state.rwa.tokenLoading
export const selectTokenError = (state: { rwa: RWAState }) => state.rwa.tokenError
export const selectPortfolio = (state: { rwa: RWAState }) => state.rwa.portfolio
export const selectStats = (state: { rwa: RWAState }) => state.rwa.stats
export const selectDigitalTwin = (tokenId: string) => (state: { rwa: RWAState }) =>
  state.rwa.digitalTwins[tokenId]
export const selectFractionalStats = (tokenId: string) => (state: { rwa: RWAState }) =>
  state.rwa.fractionalStats[tokenId]
export const selectDividendHistory = (tokenId: string) => (state: { rwa: RWAState }) =>
  state.rwa.dividendHistory[tokenId]
export const selectOracleHealth = (state: { rwa: RWAState }) => state.rwa.oracleHealth
