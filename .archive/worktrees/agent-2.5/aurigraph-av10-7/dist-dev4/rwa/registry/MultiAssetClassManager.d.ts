import { EventEmitter } from 'events';
import { Asset, AssetType, AssetRegistry } from './AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
export interface AssetClassConfiguration {
    assetType: AssetType;
    validationRules: ValidationRule[];
    metadataSchema: MetadataSchema;
    complianceRequirements: ComplianceRequirement[];
    valuationMethods: ValuationMethod[];
    tokenizationSupport: TokenizationSupport;
    riskFactors: RiskProfile;
}
export interface ValidationRule {
    ruleId: string;
    name: string;
    field: string;
    condition: string;
    errorMessage: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    mandatory: boolean;
}
export interface MetadataSchema {
    requiredFields: SchemaField[];
    optionalFields: SchemaField[];
    customFields: SchemaField[];
    validationRules: Record<string, any>;
}
export interface SchemaField {
    fieldName: string;
    fieldType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
    description: string;
    constraints?: FieldConstraints;
}
export interface FieldConstraints {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enumValues?: string[];
    minValue?: number;
    maxValue?: number;
}
export interface ComplianceRequirement {
    requirementId: string;
    jurisdiction: string;
    regulation: string;
    description: string;
    mandatory: boolean;
    validationMethod: string;
    documentation: string[];
}
export interface ValuationMethod {
    methodId: string;
    name: string;
    description: string;
    applicability: string[];
    accuracy: number;
    cost: number;
    timeRequired: number;
    providers: string[];
}
export interface TokenizationSupport {
    fractionalSupported: boolean;
    digitalTwinSupported: boolean;
    compoundSupported: boolean;
    yieldBearingSupported: boolean;
    minimumValue: number;
    fractionalMinimum: number;
    restrictions: string[];
}
export interface RiskProfile {
    liquidityRisk: number;
    volatilityRisk: number;
    regulatoryRisk: number;
    operationalRisk: number;
    marketRisk: number;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigationStrategies: string[];
}
export interface AssetClassMetrics {
    assetType: AssetType;
    totalAssets: number;
    totalValue: number;
    averageValue: number;
    verificationRate: number;
    tokenizationRate: number;
    performanceMetrics: ClassPerformanceMetrics;
    riskMetrics: ClassRiskMetrics;
}
export interface ClassPerformanceMetrics {
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    lastUpdated: Date;
}
export interface ClassRiskMetrics {
    defaultRate: number;
    fraudAttempts: number;
    complianceViolations: number;
    riskScore: number;
    lastAssessment: Date;
}
export declare class MultiAssetClassManager extends EventEmitter {
    private assetClassConfigs;
    private assetClassMetrics;
    private assetRegistry;
    private cryptoManager;
    constructor(assetRegistry: AssetRegistry, cryptoManager: QuantumCryptoManagerV2);
    private initializeAssetClassConfigurations;
    private initializeCommoditiesConfig;
    private initializeIPConfig;
    private initializeArtConfig;
    private initializeInfrastructureConfig;
    validateAssetForClass(asset: Asset): Promise<ValidationResult>;
    private evaluateValidationRule;
    private getFieldValue;
    private validateMetadataSchema;
    private validateFieldType;
    getAssetClassConfiguration(assetType: AssetType): Promise<AssetClassConfiguration | null>;
    getSupportedAssetClasses(): Promise<AssetType[]>;
    generateClassMetrics(assetType: AssetType): Promise<AssetClassMetrics>;
    getRecommendedTokenizationModel(asset: Asset): Promise<{
        recommended: string[];
        supported: string[];
        restrictions: string[];
        reasoning: string;
    }>;
    private generateTokenizationReasoning;
    getAssetClassReport(): Promise<{
        summary: AssetClassSummary;
        metrics: AssetClassMetrics[];
        recommendations: string[];
        riskAssessment: OverallRiskAssessment;
    }>;
    private generatePortfolioRecommendations;
    private assessOverallRisk;
    private calculateRiskScore;
    private calculateDiversificationScore;
    private generateRiskMitigationRecommendations;
}
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
}
interface AssetClassSummary {
    totalAssetClasses: number;
    totalAssets: number;
    totalValue: number;
    averageVerificationRate: number;
    lastUpdated: Date;
}
interface OverallRiskAssessment {
    overallRiskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    diversificationScore: number;
    recommendations: string[];
}
export {};
//# sourceMappingURL=MultiAssetClassManager.d.ts.map