/**
 * Asset Traceability and Registry Constants
 */

// API Endpoints - Asset Traceability
export const ASSET_API_ENDPOINTS = {
  SEARCH: '/api/v11/assets/traceability/search',
  GET_ASSET: (assetId: string) => `/api/v11/assets/traceability/${assetId}`,
  GET_HISTORY: (assetId: string) => `/api/v11/assets/traceability/${assetId}/history`,
  TRANSFER: '/api/v11/assets/traceability/transfer',
  GET_ANALYTICS: '/api/v11/assets/traceability/analytics',
} as const;

// API Endpoints - Registry
export const REGISTRY_API_ENDPOINTS = {
  // Unified search across all registries
  SEARCH: '/api/v11/registries/search',

  // Smart Contract Registry
  SMART_CONTRACT_STATS: '/api/v11/registries/smart-contract/stats',
  SMART_CONTRACT_LIST: '/api/v11/registries/smart-contract/list',
  SMART_CONTRACT_DETAILS: (contractId: string) => `/api/v11/registries/smart-contract/${contractId}`,
  SMART_CONTRACT_CREATE: '/api/v11/registries/smart-contract/create',
  SMART_CONTRACT_UPDATE: (contractId: string) => `/api/v11/registries/smart-contract/${contractId}`,

  // Compliance Registry
  COMPLIANCE_METRICS: '/api/v11/registries/compliance/metrics',
  COMPLIANCE_LIST: '/api/v11/registries/compliance/list',
  COMPLIANCE_DETAILS: (certId: string) => `/api/v11/registries/compliance/${certId}`,
  COMPLIANCE_CREATE: '/api/v11/registries/compliance/create',
  COMPLIANCE_ALERTS: '/api/v11/registries/compliance/alerts',

  // Asset Registry
  ASSET_STATS: '/api/v11/registries/asset/stats',
  ASSET_LIST: '/api/v11/registries/asset/list',

  // Identity Registry
  IDENTITY_STATS: '/api/v11/registries/identity/stats',
  IDENTITY_LIST: '/api/v11/registries/identity/list',

  // Transaction Registry
  TRANSACTION_STATS: '/api/v11/registries/transaction/stats',
  TRANSACTION_LIST: '/api/v11/registries/transaction/list',
} as const;

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  ASSET_TRACEABILITY: (traceId: string) => `/ws/assets/traceability/${traceId}`,
  REGISTRY: (registryType: string) => `/ws/registries/${registryType}`,
  COMPLIANCE_ALERTS: '/ws/compliance/alerts',
  ASSET_UPDATES: '/ws/assets/updates',
} as const;

// Asset Types
export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  COMMODITY = 'COMMODITY',
  ARTWORK = 'ARTWORK',
  FINANCIAL_INSTRUMENT = 'FINANCIAL_INSTRUMENT',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  CARBON_CREDIT = 'CARBON_CREDIT',
  OTHER = 'OTHER',
}

// Asset Status
export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  RETIRED = 'RETIRED',
  DISPUTED = 'DISPUTED',
}

// Registry Types
export enum RegistryType {
  SMART_CONTRACT = 'smart-contract',
  COMPLIANCE = 'compliance',
  ASSET = 'asset',
  IDENTITY = 'identity',
  TRANSACTION = 'transaction',
}

// Compliance Levels
export enum ComplianceLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  PREMIUM = 'PREMIUM',
}

// Contract Status
export enum ContractStatus {
  DRAFT = 'DRAFT',
  DEPLOYED = 'DEPLOYED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DEPRECATED = 'DEPRECATED',
  FAILED = 'FAILED',
}

// Compliance Status
export enum ComplianceStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING_RENEWAL = 'PENDING_RENEWAL',
}

// Asset Type Labels
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.REAL_ESTATE]: 'Real Estate',
  [AssetType.COMMODITY]: 'Commodity',
  [AssetType.ARTWORK]: 'Artwork',
  [AssetType.FINANCIAL_INSTRUMENT]: 'Financial Instrument',
  [AssetType.INTELLECTUAL_PROPERTY]: 'Intellectual Property',
  [AssetType.VEHICLE]: 'Vehicle',
  [AssetType.EQUIPMENT]: 'Equipment',
  [AssetType.CARBON_CREDIT]: 'Carbon Credit',
  [AssetType.OTHER]: 'Other',
};

// Registry Type Labels
export const REGISTRY_TYPE_LABELS: Record<RegistryType, string> = {
  [RegistryType.SMART_CONTRACT]: 'Smart Contract Registry',
  [RegistryType.COMPLIANCE]: 'Compliance Registry',
  [RegistryType.ASSET]: 'Asset Registry',
  [RegistryType.IDENTITY]: 'Identity Registry',
  [RegistryType.TRANSACTION]: 'Transaction Registry',
};

// Status Colors
export const STATUS_COLORS = {
  [AssetStatus.ACTIVE]: '#52c41a',
  [AssetStatus.TRANSFERRED]: '#1890ff',
  [AssetStatus.PENDING]: '#faad14',
  [AssetStatus.LOCKED]: '#ff7a45',
  [AssetStatus.RETIRED]: '#8c8c8c',
  [AssetStatus.DISPUTED]: '#f5222d',

  [ContractStatus.DRAFT]: '#8c8c8c',
  [ContractStatus.DEPLOYED]: '#1890ff',
  [ContractStatus.ACTIVE]: '#52c41a',
  [ContractStatus.PAUSED]: '#faad14',
  [ContractStatus.DEPRECATED]: '#ff7a45',
  [ContractStatus.FAILED]: '#f5222d',

  [ComplianceStatus.VALID]: '#52c41a',
  [ComplianceStatus.EXPIRING_SOON]: '#faad14',
  [ComplianceStatus.EXPIRED]: '#f5222d',
  [ComplianceStatus.REVOKED]: '#ff4d4f',
  [ComplianceStatus.PENDING_RENEWAL]: '#1890ff',
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  DEFAULT_PAGE: 1,
} as const;

// Update intervals (ms)
export const UPDATE_INTERVALS = {
  ASSET_REFRESH: 10000, // 10 seconds
  REGISTRY_REFRESH: 15000, // 15 seconds
  COMPLIANCE_ALERTS: 30000, // 30 seconds
} as const;

// Compliance alert thresholds
export const COMPLIANCE_THRESHOLDS = {
  EXPIRY_WARNING_DAYS: 30,
  CRITICAL_EXPIRY_DAYS: 7,
} as const;

// Export formats
export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
  EXCEL = 'xlsx',
}

// Chart colors for visualizations
export const VISUALIZATION_COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#f5222d',
  INFO: '#13c2c2',
  PURPLE: '#722ed1',
  ORANGE: '#fa8c16',
  CYAN: '#00b96b',
} as const;
