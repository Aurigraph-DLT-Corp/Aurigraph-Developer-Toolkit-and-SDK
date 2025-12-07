/**
 * Real-World Asset Tokenization (RWAT) Type Definitions
 *
 * Types for tokenizing and managing real-world assets
 */

export type AssetCategory =
  | 'real_estate'
  | 'commodities'
  | 'art'
  | 'digital_art'           // NFTs, digital art, digital collectibles
  | 'carbon_credits'
  | 'bonds'
  | 'equities'
  | 'precious_metals'
  | 'collectibles'
  | 'intellectual_property' // Patents, trademarks, copyrights
  | 'patent'                // Patents and registered inventions
  | 'trademark'             // Trademarks and service marks
  | 'copyright'             // Copyrights and literary works
  | 'nft'                   // Non-fungible tokens
  | 'other';

export interface RealWorldAsset {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  owner: string;
  custodian?: string;
  value: number;
  valueCurrency: string;
  tokenId: string;
  tokenSymbol: string;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  tokenizedAt: string;
  lastValuationDate: string;
  nextValuationDate?: string;
  status: 'active' | 'pending_verification' | 'suspended' | 'delisted';
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  compliance: ComplianceInfo;
  metadata: AssetMetadata;
  documents: AssetDocument[];
}

export interface AssetMetadata {
  location?: string;
  legalDescription?: string;
  serialNumber?: string;
  manufacturer?: string;
  yearBuilt?: number;
  condition?: string;
  certifications?: string[];
  images?: string[];
  videos?: string[];
  externalLinks?: string[];
  customFields?: Record<string, any>;
}

export interface ComplianceInfo {
  kycRequired: boolean;
  amlVerified: boolean;
  accreditedInvestorsOnly: boolean;
  jurisdictions: string[];
  regulatoryFramework?: string;
  complianceDocuments: string[];
  restrictions?: string[];
}

export interface AssetDocument {
  id: string;
  type: 'ownership' | 'appraisal' | 'legal' | 'compliance' | 'other';
  name: string;
  description?: string;
  url: string;
  hash: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface AssetTokenizeRequest {
  name: string;
  category: AssetCategory;
  description: string;
  owner: string;
  custodian?: string;
  value: number;
  valueCurrency: string;
  totalShares: number;
  tokenSymbol: string;
  compliance: ComplianceInfo;
  metadata: AssetMetadata;
  documents?: {
    type: string;
    name: string;
    url: string;
  }[];
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  from: string;
  to: string;
  shares: number;
  price: number;
  timestamp: string;
  transactionHash: string;
  status: 'completed' | 'pending' | 'failed';
  complianceChecked: boolean;
}

export interface AssetValuation {
  id: string;
  assetId: string;
  value: number;
  valueCurrency: string;
  valuationDate: string;
  valuatedBy: string;
  methodology?: string;
  notes?: string;
  documents: string[];
}

export interface RWATStats {
  totalAssets: number;
  totalValueLocked: number;
  totalValueLockedUSD: number;
  assetsByCategory: Record<AssetCategory, number>;
  totalHolders: number;
  totalTransfers: number;
  verifiedAssets: number;
  avgAssetValue: number;
}

export interface RWATFilter {
  category?: AssetCategory;
  status?: string;
  minValue?: number;
  maxValue?: number;
  verified?: boolean;
  searchTerm?: string;
}
