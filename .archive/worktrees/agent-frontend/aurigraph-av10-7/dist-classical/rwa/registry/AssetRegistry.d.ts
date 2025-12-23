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
export declare enum AssetType {
    REAL_ESTATE = "REAL_ESTATE",
    CARBON_CREDITS = "CARBON_CREDITS",
    COMMODITIES = "COMMODITIES",
    INTELLECTUAL_PROPERTY = "IP",
    ART_COLLECTIBLES = "ART",
    INFRASTRUCTURE = "INFRASTRUCTURE"
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
export declare class AssetRegistry extends EventEmitter {
    private assets;
    private assetsByType;
    private assetsByOwner;
    private cryptoManager;
    private consensus;
    private verificationQueue;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    private initializeAssetTypes;
    registerAsset(assetData: Partial<Asset>, ownerId: string): Promise<string>;
    getAsset(assetId: string): Promise<Asset | null>;
    getAssetsByType(type: AssetType): Promise<Asset[]>;
    getAssetsByOwner(ownerId: string): Promise<Asset[]>;
    updateAssetVerification(assetId: string, verification: Partial<VerificationRecord>): Promise<boolean>;
    updateAssetValuation(assetId: string, valuation: ValuationRecord): Promise<boolean>;
    transferOwnership(assetId: string, newOwnerId: string, percentage?: number): Promise<boolean>;
    searchAssets(query: {
        type?: AssetType;
        owner?: string;
        minValue?: number;
        maxValue?: number;
        verificationStatus?: string;
        location?: string;
        keywords?: string[];
    }): Promise<Asset[]>;
    getRegistryStats(): Promise<{
        totalAssets: number;
        assetsByType: Record<AssetType, number>;
        totalValue: number;
        verificationStats: Record<string, number>;
        pendingVerifications: number;
    }>;
    private generateAssetId;
    private encryptAssetData;
    startVerificationProcess(assetId: string): Promise<boolean>;
    addVerificationReport(assetId: string, report: VerificationReport): Promise<boolean>;
    getVerificationQueue(): string[];
    processVerificationQueue(): Promise<void>;
}
//# sourceMappingURL=AssetRegistry.d.ts.map