export interface PhysicalAsset {
    name: string;
    category: AssetCategory;
    description: string;
    physicalCharacteristics: any;
    location: string;
    owner: string;
    value: bigint;
    currency: string;
    jurisdiction: string;
    certifications?: string[];
    images?: string[];
    documents?: string[];
}
export interface RegisteredAsset extends PhysicalAsset {
    assetId: string;
    registrationDate: Date;
    status: string;
    digitalTwinId: string;
    symbol: string;
    ownershipVerified?: boolean;
    dueDiligenceCompleted?: boolean;
    dueDiligenceReport?: any;
    lastValuationDate?: Date;
}
export declare enum AssetCategory {
    REAL_ESTATE = "real_estate",
    CARBON_CREDIT = "carbon_credit",
    COMMODITY = "commodity",
    INFRASTRUCTURE = "infrastructure"
}
export interface TokenizationParameters {
    totalSupply: number;
    decimals?: number;
    denomination: string;
    includePrimaryTokens: boolean;
    includeSecondaryTokens: boolean;
    includeCompoundTokens: boolean;
    allowFractional: boolean;
    ownershipRights: any;
    votingRights: any;
    profitSharing: any;
    liquidationRights: any;
    assetAccess?: any;
    governance: any;
    burnable?: boolean;
    mintable?: boolean;
}
export interface TokenizationResult {
    assetId: string;
    digitalTwinId: string;
    tokens: any[];
    contracts: any[];
    governanceFramework: any;
    complianceConfiguration: any;
    timestamp: Date;
}
export interface TokenStructure {
    primaryTokens: TokenInfo[];
    secondaryTokens: TokenInfo[];
    compoundTokens: TokenInfo[];
    totalSupply: number;
    denomination: string;
}
export declare enum TokenType {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    COMPOUND = "compound"
}
export interface TokenInfo {
    tokenId: string;
    tokenType: TokenType;
    symbol: string;
    name: string;
    totalSupply: number;
    decimals: number;
    metadata: any;
    transferable: boolean;
    burnable: boolean;
    mintable: boolean;
    fractionable?: boolean;
}
export interface DigitalTwin {
    twinId: string;
    assetId: string;
    assetCategory: AssetCategory;
    realTimeState: Map<string, any>;
    historicalData: TimeSeriesData[];
    predictiveModels: any[];
    iotConnections: IoTConnection[];
    alertSystem: any;
    metadata: {
        createdAt: Date;
        lastUpdated: Date;
        syncFrequency: number;
        dataRetentionDays: number;
    };
}
export interface IoTConnection {
    connectionId: string;
    sensorType: string;
    sensorId: string;
    protocol: string;
    endpoint: string;
    topic: string;
    active: boolean;
}
export interface SensorReading {
    sensorId: string;
    sensorType: string;
    value: any;
    timestamp: Date;
    metadata?: any;
}
export interface TimeSeriesData {
    timestamp: Date;
    sensorType: string;
    value: any;
    metadata?: any;
}
//# sourceMappingURL=types.d.ts.map