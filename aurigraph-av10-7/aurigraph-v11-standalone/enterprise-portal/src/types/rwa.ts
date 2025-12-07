/**
 * Real-World Asset (RWA) Tokenization Type Definitions
 * Aurigraph V11 Enterprise Portal
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum AssetType {
  CARBON_CREDIT = 'CARBON_CREDIT',
  REAL_ESTATE = 'REAL_ESTATE',
  FINANCIAL = 'FINANCIAL',
  ARTWORK = 'ARTWORK',
  DIGITAL_ART = 'DIGITAL_ART',
  PATENT = 'PATENT',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  COMMODITY = 'COMMODITY',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  ENERGY = 'ENERGY',
  INSURANCE = 'INSURANCE',
  HEALTHCARE = 'HEALTHCARE',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  IDENTITY = 'IDENTITY',
  OTHER = 'OTHER'
}

export enum TokenStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BURNED = 'BURNED'
}

export enum VerificationLevel {
  NONE = 'NONE',
  BASIC = 'BASIC',
  ENHANCED = 'ENHANCED',
  CERTIFIED = 'CERTIFIED',
  AUDITED = 'AUDITED'
}

export enum AssetStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BURNED = 'BURNED',
  EXPIRED = 'EXPIRED'
}

export enum DividendType {
  REGULAR = 'REGULAR',
  SPECIAL = 'SPECIAL',
  BONUS = 'BONUS',
  LIQUIDATION = 'LIQUIDATION'
}

export enum DistributionFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

export enum ComplianceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum OracleSource {
  CHAINLINK = 'CHAINLINK',
  BAND_PROTOCOL = 'BAND_PROTOCOL',
  API3 = 'API3',
  TELLOR = 'TELLOR',
  INTERNAL = 'INTERNAL'
}

// ============================================================================
// RWA TOKEN
// ============================================================================

export interface RWAToken {
  tokenId: string
  assetId: string
  assetType: AssetType
  assetValue: string
  tokenSupply: string
  ownerAddress: string
  digitalTwinId: string
  createdAt: string
  lastTransferAt?: string
  lastValuationUpdate?: string
  burnedAt?: string
  status: TokenStatus
  metadata: Record<string, any>
  quantumSafe: boolean
  fractionSize?: string
  totalFractions: number
  availableFractions: number
  currentYield?: string
  riskScore: number
  liquidityScore: number
  verificationLevel: VerificationLevel
  regulatoryCompliance: string[]
  transferHistory: TokenTransfer[]
}

export interface TokenTransfer {
  fromAddress: string
  toAddress: string
  amount: string
  timestamp: string
  transactionHash: string
}

// ============================================================================
// DIGITAL TWIN
// ============================================================================

export interface AssetDigitalTwin {
  twinId: string
  assetId: string
  assetType: AssetType
  currentOwner: string
  currentValue: string
  createdAt: string
  lastUpdated: string
  metadata: Record<string, any>
  ownershipHistory: OwnershipRecord[]
  valuationHistory: ValuationRecord[]
  verificationHistory: VerificationRecord[]
  iotData: IoTDataPoint[]
  status: AssetStatus
  certifications: string[]
  quantumHash: string
  version: number
}

export interface OwnershipRecord {
  fromOwner: string
  toOwner: string
  amount: string
  timestamp: string
  transactionHash: string
}

export interface ValuationRecord {
  oldValue: string
  newValue: string
  source: string
  timestamp: string
  changePercent: string
}

export interface VerificationRecord {
  verificationId: string
  verifierAddress: string
  result: string
  details: Record<string, any>
  timestamp: string
}

export interface IoTDataPoint {
  sensorId: string
  dataType: string
  value: any
  unit: string
  additionalData: Record<string, any>
  timestamp: string
}

export interface AssetAnalytics {
  ownershipDurations: Record<string, number>
  averageValue: string
  maxValue: string
  minValue: string
  verificationScore: number
  iotDataPoints: number
  certifications: number
}

// ============================================================================
// FRACTIONAL OWNERSHIP
// ============================================================================

export interface FractionalShare {
  tokenId: string
  holderAddress: string
  shareCount: number
  totalShares: number
  ownershipPercentage: string
  shareValue: string
  totalValue: string
  votingPower: number
  dividendsReceived: string
  acquiredAt: string
}

export interface ShareHolder {
  address: string
  shareCount: number
  totalValue: string
  ownershipPercentage: string
  votingPower: number
  joinedAt: string
  dividendsReceived: string
}

export interface ShareHolderInfo {
  holderAddress: string
  shareCount: number
  totalValue: string
  ownershipPercentage: string
  votingPower: number
}

export interface ShareTransaction {
  transactionId: string
  tokenId: string
  fromAddress: string
  toAddress: string
  shareCount: number
  pricePerShare: string
  timestamp: string
}

export interface AssetShareRegistry {
  tokenId: string
  assetId: string
  totalShares: number
  shareValue: string
  currentSharePrice: string
  originalOwner: string
  shareHolders: ShareHolder[]
}

export interface FractionalOwnershipStats {
  tokenId: string
  totalShares: number
  totalHolders: number
  shareValue: string
  totalDividendsDistributed: string
  transactions: ShareTransaction[]
}

// ============================================================================
// DIVIDEND DISTRIBUTION
// ============================================================================

export interface DividendPayment {
  recipientAddress: string
  shareCount: number
  netAmount: string
  timestamp: string
  taxWithheld?: string
  reinvestmentSelected?: boolean
  reinvestedShares?: string
}

export interface EnhancedDividendPayment extends DividendPayment {
  grossAmount: string
  taxWithheld: string
  reinvestmentSelected: boolean
  reinvestedShares?: string
}

export interface DividendEvent {
  eventId: string
  tokenId: string
  grossAmount: string
  netAmount: string
  source: string
  dividendType: DividendType
  distributionDate: string
  configuration: DividendConfiguration
  payments: DividendPayment[]
}

export interface DividendConfiguration {
  withholdTax: boolean
  taxRate: string
  allowReinvestment: boolean
  minimumPayment: string
  paymentCurrency: string
}

export interface DividendSchedule {
  tokenId: string
  distributionFrequency: DistributionFrequency
  minimumDividendAmount: string
  nextDistributionDate: string
  autoDistribute: boolean
}

export interface DividendProjection {
  tokenId: string
  averageMonthlyDividend: string
  projectedTotal: string
  annualizedYield: string
  projectionMonths: number
}

export interface DividendHistory {
  tokenId: string
  events: DividendEvent[]
  totalDistributed: string
  totalNet: string
  fromDate: string
  toDate: string
}

export interface DividendPool {
  tokenId: string
  totalPoolAmount: string
  availableAmount: string
  distributedAmount: string
  distributions: DividendDistribution[]
}

export interface DividendDistribution {
  distributionId: string
  tokenId: string
  totalAmount: string
  dividendPerShare: string
  source: string
  distributionDate: string
  payments: DividendPayment[]
}

// ============================================================================
// COMPLIANCE
// ============================================================================

export interface ComplianceProfile {
  userAddress: string
  status: ComplianceStatus
  verificationLevel: VerificationLevel
  jurisdiction: string
  kycVerified: boolean
  amlVerified: boolean
  accreditedInvestor: boolean
  verifiedAt?: string
  expiresAt?: string
  documents: ComplianceDocument[]
  history: ComplianceAuditRecord[]
}

export interface ComplianceDocument {
  documentId: string
  documentType: string
  documentUrl: string
  uploadedAt: string
  verifiedAt?: string
  expiresAt?: string
  status: ComplianceStatus
}

export interface ComplianceAuditRecord {
  recordId: string
  timestamp: string
  action: string
  result: string
  verifierAddress?: string
  details: Record<string, any>
}

export interface ComplianceCheck {
  userAddress: string
  checkType: string
  jurisdiction: string
  passed: boolean
  timestamp: string
  details: Record<string, any>
}

// ============================================================================
// ASSET VALUATION
// ============================================================================

export interface AssetValuation {
  assetId: string
  assetType: AssetType
  currentValue: string
  previousValue?: string
  changePercent?: string
  valuationSource: OracleSource
  valuationDate: string
  confidence: number
  metadata: Record<string, any>
}

export interface OracleFeed {
  assetId: string
  source: OracleSource
  price: string
  timestamp: string
  confidence: number
}

export interface OracleHealth {
  source: OracleSource
  totalFeeds: number
  validFeeds: number
  healthPercentage: number
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE'
}

export interface PriceHistory {
  assetId: string
  dataPoints: PriceDataPoint[]
}

export interface PriceDataPoint {
  timestamp: string
  price: string
  source: OracleSource
  volume?: string
}

// ============================================================================
// TOKENIZATION REQUEST/RESPONSE
// ============================================================================

export interface RWATokenizationRequest {
  assetId: string
  assetType: AssetType
  ownerAddress: string
  fractionSize?: string
  metadata: Record<string, any>
  certifications?: string[]
  oracleSource?: OracleSource
}

export interface RWATokenizationResult {
  success: boolean
  message: string
  token: RWAToken
  digitalTwin: AssetDigitalTwin
  processingTime: number
}

export interface TokenizerStats {
  totalTokens: number
  totalValue: string
  typeDistribution: Record<string, number>
  digitalTwins: number
  totalTokensCreated: number
  totalValueTokenized: number
}

// ============================================================================
// UI STATE
// ============================================================================

export interface RWAPortfolio {
  ownerAddress: string
  totalValue: string
  tokens: RWAToken[]
  fractionalShares: FractionalShare[]
  totalDividendsReceived: string
  assetDistribution: Record<AssetType, number>
}

export interface RWADashboardMetrics {
  totalAssets: number
  totalValue: string
  activeTokens: number
  totalHolders: number
  averageYield: string
  totalDividendsPaid: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================================
// FILTER & SEARCH
// ============================================================================

export interface RWAFilter {
  assetTypes?: AssetType[]
  statuses?: TokenStatus[]
  minValue?: string
  maxValue?: string
  verificationLevels?: VerificationLevel[]
  ownerAddress?: string
  searchQuery?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}
