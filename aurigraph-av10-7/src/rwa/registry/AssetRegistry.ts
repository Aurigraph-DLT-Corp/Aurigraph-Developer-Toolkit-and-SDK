import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';

export interface Asset {
  id: string;
  type: AssetType;
  metadata: AssetMetadata;
  ownership: OwnershipRecord;
  verification: VerificationRecord;
  valuation: ValuationRecord;
  tokenization?: TokenizationRecord;
  digitalTwin?: DigitalTwinRecord;
  created: Date;
  updated: Date;
}

export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  CARBON_CREDITS = 'CARBON_CREDITS', 
  COMMODITIES = 'COMMODITIES',
  INTELLECTUAL_PROPERTY = 'IP',
  ART_COLLECTIBLES = 'ART',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

export interface AssetMetadata {
  name: string;
  description: string;
  location?: string;
  category: string;
  subcategory: string;
  specifications: Record<string, any>;
  certifications: string[];
  documents: DocumentRecord[];
}

export interface OwnershipRecord {
  currentOwner: string;
  ownershipType: 'FULL' | 'PARTIAL' | 'CUSTODIAL';
  ownershipPercentage: number;
  legalDocuments: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  lastVerified: Date;
}

export interface VerificationRecord {
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  verificationMethods: VerificationMethod[];
  verifiedBy: string[];
  verificationDate?: Date;
  expiryDate?: Date;
  score: number;
  reports: VerificationReport[];
}

export interface VerificationMethod {
  type: 'APPRAISAL' | 'PHYSICAL_INSPECTION' | 'DOCUMENT_REVIEW' | 'IOT_SENSOR' | 'SATELLITE' | 'AUDIT';
  provider: string;
  completed: boolean;
  result?: any;
  timestamp: Date;
}

export interface VerificationReport {
  id: string;
  method: string;
  verifier: string;
  result: 'PASS' | 'FAIL' | 'CONDITIONAL';
  details: string;
  confidence: number;
  timestamp: Date;
}

export interface ValuationRecord {
  currentValue: number;
  currency: string;
  valuationMethod: string;
  appraiser: string;
  valuationDate: Date;
  confidenceLevel: number;
  historicalValues: ValuationPoint[];
}

export interface ValuationPoint {
  value: number;
  date: Date;
  source: string;
}

export interface TokenizationRecord {
  tokenId: string;
  tokenStandard: string;
  totalSupply: number;
  fractionalParts: number;
  tokenizationType: 'FRACTIONAL' | 'DIGITAL_TWIN' | 'COMPOUND' | 'YIELD_BEARING';
  smartContractAddress: string;
  blockchain: string;
  created: Date;
}

export interface DigitalTwinRecord {
  twinId: string;
  iotDevices: string[];
  sensors: SensorData[];
  lastSync: Date;
  syncFrequency: number;
  healthScore: number;
}

export interface SensorData {
  deviceId: string;
  type: string;
  value: any;
  unit: string;
  timestamp: Date;
  quality: number;
}

export interface DocumentRecord {
  id: string;
  type: string;
  filename: string;
  hash: string;
  size: number;
  uploadDate: Date;
  verified: boolean;
}

export class AssetRegistry extends EventEmitter {
  private assets: Map<string, Asset> = new Map();
  private assetsByType: Map<AssetType, Set<string>> = new Map();
  private assetsByOwner: Map<string, Set<string>> = new Map();
  private cryptoManager: QuantumCryptoManagerV2;
  private consensus: HyperRAFTPlusPlusV2;
  private verificationQueue: string[] = [];

  constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2) {
    super();
    this.cryptoManager = cryptoManager;
    this.consensus = consensus;
    this.initializeAssetTypes();
  }

  private initializeAssetTypes(): void {
    Object.values(AssetType).forEach(type => {
      this.assetsByType.set(type, new Set());
    });
  }

  async registerAsset(assetData: Partial<Asset>, ownerId: string): Promise<string> {
    const assetId = this.generateAssetId(assetData.type!, assetData.metadata!);
    
    const asset: Asset = {
      id: assetId,
      type: assetData.type!,
      metadata: assetData.metadata!,
      ownership: {
        currentOwner: ownerId,
        ownershipType: 'FULL',
        ownershipPercentage: 100,
        legalDocuments: assetData.ownership?.legalDocuments || [],
        verificationStatus: 'PENDING',
        lastVerified: new Date()
      },
      verification: {
        status: 'PENDING',
        verificationMethods: [],
        verifiedBy: [],
        score: 0,
        reports: []
      },
      valuation: assetData.valuation || {
        currentValue: 0,
        currency: 'USD',
        valuationMethod: 'PENDING',
        appraiser: '',
        valuationDate: new Date(),
        confidenceLevel: 0,
        historicalValues: []
      },
      created: new Date(),
      updated: new Date()
    };

    // Encrypt sensitive data
    const encryptedAsset = await this.encryptAssetData(asset);
    
    // Store in consensus
    await this.consensus.submitTransaction({
      type: 'ASSET_REGISTRATION',
      data: encryptedAsset,
      timestamp: Date.now()
    });

    this.assets.set(assetId, asset);
    this.assetsByType.get(asset.type)!.add(assetId);
    
    if (!this.assetsByOwner.has(ownerId)) {
      this.assetsByOwner.set(ownerId, new Set());
    }
    this.assetsByOwner.get(ownerId)!.add(assetId);

    this.verificationQueue.push(assetId);
    
    this.emit('assetRegistered', { assetId, asset });
    
    return assetId;
  }

  async getAsset(assetId: string): Promise<Asset | null> {
    return this.assets.get(assetId) || null;
  }

  async getAssetsByType(type: AssetType): Promise<Asset[]> {
    const assetIds = this.assetsByType.get(type) || new Set();
    return Array.from(assetIds).map(id => this.assets.get(id)!).filter(Boolean);
  }

  async getAssetsByOwner(ownerId: string): Promise<Asset[]> {
    const assetIds = this.assetsByOwner.get(ownerId) || new Set();
    return Array.from(assetIds).map(id => this.assets.get(id)!).filter(Boolean);
  }

  async updateAssetVerification(assetId: string, verification: Partial<VerificationRecord>): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.verification = { ...asset.verification, ...verification };
    asset.updated = new Date();

    // Record verification in consensus
    await this.consensus.submitTransaction({
      type: 'ASSET_VERIFICATION_UPDATE',
      data: { assetId, verification },
      timestamp: Date.now()
    });

    this.emit('assetVerificationUpdated', { assetId, verification });
    return true;
  }

  async updateAssetValuation(assetId: string, valuation: ValuationRecord): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.valuation.historicalValues.push({
      value: asset.valuation.currentValue,
      date: asset.valuation.valuationDate,
      source: asset.valuation.appraiser
    });

    asset.valuation = valuation;
    asset.updated = new Date();

    await this.consensus.submitTransaction({
      type: 'ASSET_VALUATION_UPDATE',
      data: { assetId, valuation },
      timestamp: Date.now()
    });

    this.emit('assetValuationUpdated', { assetId, valuation });
    return true;
  }

  async transferOwnership(assetId: string, newOwnerId: string, percentage: number = 100): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    const currentOwnerId = asset.ownership.currentOwner;
    
    // Update ownership records
    asset.ownership.currentOwner = newOwnerId;
    asset.ownership.ownershipPercentage = percentage;
    asset.ownership.verificationStatus = 'PENDING';
    asset.updated = new Date();

    // Update indexing
    this.assetsByOwner.get(currentOwnerId)?.delete(assetId);
    if (!this.assetsByOwner.has(newOwnerId)) {
      this.assetsByOwner.set(newOwnerId, new Set());
    }
    this.assetsByOwner.get(newOwnerId)!.add(assetId);

    // Record transfer in consensus
    await this.consensus.submitTransaction({
      type: 'ASSET_OWNERSHIP_TRANSFER',
      data: { assetId, from: currentOwnerId, to: newOwnerId, percentage },
      timestamp: Date.now()
    });

    this.emit('ownershipTransferred', { assetId, from: currentOwnerId, to: newOwnerId });
    return true;
  }

  async searchAssets(query: {
    type?: AssetType;
    owner?: string;
    minValue?: number;
    maxValue?: number;
    verificationStatus?: string;
    location?: string;
    keywords?: string[];
  }): Promise<Asset[]> {
    let results: Asset[] = Array.from(this.assets.values());

    if (query.type) {
      const typeAssets = this.assetsByType.get(query.type) || new Set();
      results = results.filter(asset => typeAssets.has(asset.id));
    }

    if (query.owner) {
      const ownerAssets = this.assetsByOwner.get(query.owner) || new Set();
      results = results.filter(asset => ownerAssets.has(asset.id));
    }

    if (query.minValue !== undefined) {
      results = results.filter(asset => asset.valuation.currentValue >= query.minValue!);
    }

    if (query.maxValue !== undefined) {
      results = results.filter(asset => asset.valuation.currentValue <= query.maxValue!);
    }

    if (query.verificationStatus) {
      results = results.filter(asset => asset.verification.status === query.verificationStatus);
    }

    if (query.location) {
      results = results.filter(asset => 
        asset.metadata.location?.toLowerCase().includes(query.location!.toLowerCase())
      );
    }

    if (query.keywords && query.keywords.length > 0) {
      results = results.filter(asset => {
        const searchText = `${asset.metadata.name} ${asset.metadata.description}`.toLowerCase();
        return query.keywords!.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    }

    return results;
  }

  async getRegistryStats(): Promise<{
    totalAssets: number;
    assetsByType: Record<AssetType, number>;
    totalValue: number;
    verificationStats: Record<string, number>;
    pendingVerifications: number;
  }> {
    const stats = {
      totalAssets: this.assets.size,
      assetsByType: {} as Record<AssetType, number>,
      totalValue: 0,
      verificationStats: {
        PENDING: 0,
        IN_PROGRESS: 0,
        VERIFIED: 0,
        REJECTED: 0
      },
      pendingVerifications: this.verificationQueue.length
    };

    Object.values(AssetType).forEach(type => {
      stats.assetsByType[type] = this.assetsByType.get(type)?.size || 0;
    });

    this.assets.forEach(asset => {
      stats.totalValue += asset.valuation.currentValue;
      stats.verificationStats[asset.verification.status]++;
    });

    return stats;
  }

  private generateAssetId(type: AssetType, metadata: AssetMetadata): string {
    const timestamp = Date.now();
    const typePrefix = type.substring(0, 3).toUpperCase();
    const hash = this.cryptoManager.hashData(JSON.stringify(metadata));
    return `${typePrefix}-${timestamp}-${hash.substring(0, 8)}`;
  }

  private async encryptAssetData(asset: Asset): Promise<string> {
    const sensitiveData = {
      ownership: asset.ownership,
      verification: asset.verification,
      valuation: asset.valuation
    };
    return await this.cryptoManager.encryptData(JSON.stringify(sensitiveData));
  }

  async startVerificationProcess(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.verification.status = 'IN_PROGRESS';
    asset.updated = new Date();

    this.emit('verificationStarted', { assetId });
    return true;
  }

  async addVerificationReport(assetId: string, report: VerificationReport): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.verification.reports.push(report);
    
    // Calculate verification score based on reports
    const totalConfidence = asset.verification.reports.reduce((sum, r) => sum + r.confidence, 0);
    asset.verification.score = totalConfidence / asset.verification.reports.length;

    // Auto-verify if score is high enough
    if (asset.verification.score >= 85 && asset.verification.reports.length >= 3) {
      asset.verification.status = 'VERIFIED';
      asset.verification.verificationDate = new Date();
      this.emit('assetVerified', { assetId, score: asset.verification.score });
    }

    asset.updated = new Date();
    return true;
  }

  getVerificationQueue(): string[] {
    return [...this.verificationQueue];
  }

  async processVerificationQueue(): Promise<void> {
    while (this.verificationQueue.length > 0) {
      const assetId = this.verificationQueue.shift()!;
      await this.startVerificationProcess(assetId);
    }
  }
}