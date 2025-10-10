/**
 * RWA (Real-World Asset) Tokenization API Service
 * Connects to Aurigraph V11 Backend Services
 */

import {
  RWAToken,
  AssetDigitalTwin,
  RWATokenizationRequest,
  RWATokenizationResult,
  TokenizerStats,
  FractionalOwnershipStats,
  ShareHolderInfo,
  DividendEvent,
  DividendHistory,
  DividendProjection,
  ComplianceProfile,
  AssetValuation,
  OracleFeed,
  OracleHealth,
  PriceHistory,
  RWAPortfolio,
  ApiResponse,
  PaginatedResponse,
  RWAFilter,
  SortOptions,
  AssetType,
  OracleSource,
  DividendType,
  DistributionFrequency
} from '../types/rwa'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9003'
const API_PREFIX = '/api/v11'

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// ============================================================================
// RWA TOKENIZATION SERVICES
// ============================================================================

/**
 * Tokenize a real-world asset
 */
export async function tokenizeAsset(
  request: RWATokenizationRequest
): Promise<ApiResponse<RWATokenizationResult>> {
  return apiRequest<RWATokenizationResult>('/rwa/tokenize', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

/**
 * Get RWA token by ID
 */
export async function getToken(tokenId: string): Promise<ApiResponse<RWAToken>> {
  return apiRequest<RWAToken>(`/rwa/tokens/${tokenId}`)
}

/**
 * Get all tokens (with optional filters)
 */
export async function getTokens(
  filter?: RWAFilter,
  sort?: SortOptions,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<RWAToken>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  if (filter) {
    if (filter.assetTypes) params.append('assetTypes', filter.assetTypes.join(','))
    if (filter.statuses) params.append('statuses', filter.statuses.join(','))
    if (filter.minValue) params.append('minValue', filter.minValue)
    if (filter.maxValue) params.append('maxValue', filter.maxValue)
    if (filter.ownerAddress) params.append('ownerAddress', filter.ownerAddress)
    if (filter.searchQuery) params.append('search', filter.searchQuery)
  }

  if (sort) {
    params.append('sortBy', sort.field)
    params.append('sortOrder', sort.direction)
  }

  return apiRequest<PaginatedResponse<RWAToken>>(`/rwa/tokens?${params}`)
}

/**
 * Get tokens by owner address
 */
export async function getTokensByOwner(ownerAddress: string): Promise<ApiResponse<RWAToken[]>> {
  return apiRequest<RWAToken[]>(`/rwa/tokens/owner/${ownerAddress}`)
}

/**
 * Get tokens by asset type
 */
export async function getTokensByType(assetType: AssetType): Promise<ApiResponse<RWAToken[]>> {
  return apiRequest<RWAToken[]>(`/rwa/tokens/type/${assetType}`)
}

/**
 * Transfer token ownership
 */
export async function transferToken(
  tokenId: string,
  fromAddress: string,
  toAddress: string,
  amount: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/transfer', {
    method: 'POST',
    body: JSON.stringify({ tokenId, fromAddress, toAddress, amount })
  })
}

/**
 * Burn token
 */
export async function burnToken(
  tokenId: string,
  ownerAddress: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/burn', {
    method: 'POST',
    body: JSON.stringify({ tokenId, ownerAddress })
  })
}

/**
 * Get tokenizer statistics
 */
export async function getTokenizerStats(): Promise<ApiResponse<TokenizerStats>> {
  return apiRequest<TokenizerStats>('/rwa/stats')
}

// ============================================================================
// DIGITAL TWIN SERVICES
// ============================================================================

/**
 * Get digital twin for a token
 */
export async function getDigitalTwin(tokenId: string): Promise<ApiResponse<AssetDigitalTwin>> {
  return apiRequest<AssetDigitalTwin>(`/rwa/digitaltwin/${tokenId}`)
}

/**
 * Get digital twin analytics
 */
export async function getDigitalTwinAnalytics(twinId: string): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/rwa/digitaltwin/${twinId}/analytics`)
}

/**
 * Add IoT data to digital twin
 */
export async function addIoTData(
  twinId: string,
  sensorId: string,
  dataType: string,
  value: any,
  unit: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>(`/rwa/digitaltwin/${twinId}/iot`, {
    method: 'POST',
    body: JSON.stringify({ sensorId, dataType, value, unit })
  })
}

// ============================================================================
// FRACTIONAL OWNERSHIP SERVICES
// ============================================================================

/**
 * Split token into fractional shares
 */
export async function splitToken(
  tokenId: string,
  numberOfShares: number,
  minSharePrice: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>('/rwa/fractional/split', {
    method: 'POST',
    body: JSON.stringify({ tokenId, numberOfShares, minSharePrice })
  })
}

/**
 * Transfer fractional shares
 */
export async function transferShares(
  tokenId: string,
  fromAddress: string,
  toAddress: string,
  shareCount: number,
  pricePerShare: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/fractional/transfer', {
    method: 'POST',
    body: JSON.stringify({ tokenId, fromAddress, toAddress, shareCount, pricePerShare })
  })
}

/**
 * Get shareholder information
 */
export async function getShareHolderInfo(
  tokenId: string,
  holderAddress: string
): Promise<ApiResponse<ShareHolderInfo>> {
  return apiRequest<ShareHolderInfo>(`/rwa/fractional/${tokenId}/holder/${holderAddress}`)
}

/**
 * Get fractional ownership statistics
 */
export async function getFractionalStats(
  tokenId: string
): Promise<ApiResponse<FractionalOwnershipStats>> {
  return apiRequest<FractionalOwnershipStats>(`/rwa/fractional/${tokenId}/stats`)
}

// ============================================================================
// DIVIDEND DISTRIBUTION SERVICES
// ============================================================================

/**
 * Distribute dividends to token holders
 */
export async function distributeDividends(
  tokenId: string,
  totalAmount: string,
  source: string,
  dividendType: DividendType = DividendType.REGULAR
): Promise<ApiResponse<any>> {
  return apiRequest<any>('/rwa/dividends/distribute', {
    method: 'POST',
    body: JSON.stringify({ tokenId, totalAmount, source, dividendType })
  })
}

/**
 * Setup dividend schedule
 */
export async function setupDividendSchedule(
  tokenId: string,
  frequency: DistributionFrequency,
  minimumAmount: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/dividends/schedule', {
    method: 'POST',
    body: JSON.stringify({ tokenId, frequency, minimumAmount })
  })
}

/**
 * Get dividend history
 */
export async function getDividendHistory(
  tokenId: string,
  fromDate?: string,
  toDate?: string
): Promise<ApiResponse<DividendHistory>> {
  const params = new URLSearchParams()
  if (fromDate) params.append('fromDate', fromDate)
  if (toDate) params.append('toDate', toDate)

  return apiRequest<DividendHistory>(`/rwa/dividends/${tokenId}/history?${params}`)
}

/**
 * Get dividend projection
 */
export async function getDividendProjection(
  tokenId: string,
  monthsAhead: number = 12
): Promise<ApiResponse<DividendProjection>> {
  return apiRequest<DividendProjection>(`/rwa/dividends/${tokenId}/projection?months=${monthsAhead}`)
}

/**
 * Get pending dividends for address
 */
export async function getPendingDividends(
  holderAddress: string
): Promise<ApiResponse<DividendEvent[]>> {
  return apiRequest<DividendEvent[]>(`/rwa/dividends/pending/${holderAddress}`)
}

// ============================================================================
// COMPLIANCE SERVICES
// ============================================================================

/**
 * Validate user compliance
 */
export async function validateCompliance(
  userAddress: string,
  jurisdiction: string
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/compliance/validate', {
    method: 'POST',
    body: JSON.stringify({ userAddress, jurisdiction })
  })
}

/**
 * Get compliance profile
 */
export async function getComplianceProfile(
  userAddress: string
): Promise<ApiResponse<ComplianceProfile>> {
  return apiRequest<ComplianceProfile>(`/rwa/compliance/profile/${userAddress}`)
}

/**
 * Submit KYC documents
 */
export async function submitKYCDocuments(
  userAddress: string,
  documents: File[]
): Promise<ApiResponse<boolean>> {
  const formData = new FormData()
  formData.append('userAddress', userAddress)
  documents.forEach((doc, index) => {
    formData.append(`document${index}`, doc)
  })

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/rwa/compliance/kyc`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return {
    success: true,
    data: await response.json(),
    timestamp: new Date().toISOString()
  }
}

/**
 * Get supported jurisdictions
 */
export async function getSupportedJurisdictions(): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>('/rwa/compliance/jurisdictions')
}

// ============================================================================
// ASSET VALUATION & ORACLE SERVICES
// ============================================================================

/**
 * Get current asset valuation
 */
export async function getAssetValuation(
  assetId: string,
  assetType: AssetType
): Promise<ApiResponse<AssetValuation>> {
  return apiRequest<AssetValuation>(`/rwa/valuation/${assetType}/${assetId}`)
}

/**
 * Update asset valuation
 */
export async function updateAssetValuation(
  tokenId: string,
  newValue: string,
  oracleSource: OracleSource
): Promise<ApiResponse<boolean>> {
  return apiRequest<boolean>('/rwa/valuation/update', {
    method: 'POST',
    body: JSON.stringify({ tokenId, newValue, oracleSource })
  })
}

/**
 * Get oracle price feed
 */
export async function getOraclePrice(
  assetId: string,
  source: OracleSource
): Promise<ApiResponse<OracleFeed>> {
  return apiRequest<OracleFeed>(`/rwa/oracle/price/${assetId}?source=${source}`)
}

/**
 * Get price with consensus from multiple oracles
 */
export async function getPriceWithConsensus(
  assetId: string
): Promise<ApiResponse<OracleFeed>> {
  return apiRequest<OracleFeed>(`/rwa/oracle/consensus/${assetId}`)
}

/**
 * Get historical price data
 */
export async function getPriceHistory(
  assetId: string,
  source: OracleSource,
  limit: number = 24
): Promise<ApiResponse<PriceHistory>> {
  return apiRequest<PriceHistory>(`/rwa/oracle/history/${assetId}?source=${source}&limit=${limit}`)
}

/**
 * Get oracle health status
 */
export async function getOracleHealth(): Promise<ApiResponse<Record<string, OracleHealth>>> {
  return apiRequest<Record<string, OracleHealth>>('/rwa/oracle/health')
}

// ============================================================================
// PORTFOLIO SERVICES
// ============================================================================

/**
 * Get RWA portfolio for an address
 */
export async function getPortfolio(ownerAddress: string): Promise<ApiResponse<RWAPortfolio>> {
  return apiRequest<RWAPortfolio>(`/rwa/portfolio/${ownerAddress}`)
}

/**
 * Get portfolio summary
 */
export async function getPortfolioSummary(ownerAddress: string): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/rwa/portfolio/${ownerAddress}/summary`)
}

/**
 * Get portfolio performance
 */
export async function getPortfolioPerformance(
  ownerAddress: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/rwa/portfolio/${ownerAddress}/performance?period=${period}`)
}

// ============================================================================
// MOCK DATA GENERATORS (for development/testing)
// ============================================================================

/**
 * Generate mock RWA token for testing
 */
export function generateMockToken(): RWAToken {
  const tokenId = `wAUR-${Math.random().toString(36).substring(2, 18).toUpperCase()}`
  const assetTypes = Object.values(AssetType)
  const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]

  return {
    tokenId,
    assetId: `ASSET-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    assetType,
    assetValue: (Math.random() * 1000000 + 100000).toFixed(2),
    tokenSupply: '1',
    ownerAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
    digitalTwinId: `DT-${Math.random().toString(36).substring(2, 18).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE' as any,
    metadata: {
      name: `Test Asset ${tokenId}`,
      description: 'Mock asset for testing'
    },
    quantumSafe: true,
    totalFractions: 1,
    availableFractions: 1,
    riskScore: Math.floor(Math.random() * 10) + 1,
    liquidityScore: Math.random() * 100,
    verificationLevel: 'BASIC' as any,
    regulatoryCompliance: ['US', 'EU'],
    transferHistory: []
  }
}

/**
 * Generate mock portfolio
 */
export function generateMockPortfolio(ownerAddress: string, count: number = 5): RWAPortfolio {
  const tokens = Array.from({ length: count }, () => generateMockToken())
  const totalValue = tokens.reduce((sum, token) => sum + parseFloat(token.assetValue), 0)

  return {
    ownerAddress,
    totalValue: totalValue.toFixed(2),
    tokens,
    fractionalShares: [],
    totalDividendsReceived: (Math.random() * 10000).toFixed(2),
    assetDistribution: tokens.reduce((dist, token) => {
      dist[token.assetType] = (dist[token.assetType] || 0) + 1
      return dist
    }, {} as Record<AssetType, number>)
  }
}

// Export all services as a single object
export const RWAService = {
  // Tokenization
  tokenizeAsset,
  getToken,
  getTokens,
  getTokensByOwner,
  getTokensByType,
  transferToken,
  burnToken,
  getTokenizerStats,

  // Digital Twin
  getDigitalTwin,
  getDigitalTwinAnalytics,
  addIoTData,

  // Fractional Ownership
  splitToken,
  transferShares,
  getShareHolderInfo,
  getFractionalStats,

  // Dividends
  distributeDividends,
  setupDividendSchedule,
  getDividendHistory,
  getDividendProjection,
  getPendingDividends,

  // Compliance
  validateCompliance,
  getComplianceProfile,
  submitKYCDocuments,
  getSupportedJurisdictions,

  // Valuation & Oracle
  getAssetValuation,
  updateAssetValuation,
  getOraclePrice,
  getPriceWithConsensus,
  getPriceHistory,
  getOracleHealth,

  // Portfolio
  getPortfolio,
  getPortfolioSummary,
  getPortfolioPerformance,

  // Mock data
  generateMockToken,
  generateMockPortfolio
}

export default RWAService
