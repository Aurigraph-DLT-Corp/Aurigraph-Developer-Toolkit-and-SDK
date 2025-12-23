import { EventEmitter } from 'events';
import { AssetRegistry } from '../registry/AssetRegistry';
import { AuditTrailManager } from '../audit/AuditTrailManager';
export interface MCPRequest {
    id: string;
    method: string;
    params: any;
    apiKey: string;
    timestamp: number;
    signature: string;
    version: string;
    clientId: string;
}
export interface MCPResponse {
    id: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    timestamp: number;
    signature: string;
}
export interface MCPClient {
    id: string;
    name: string;
    apiKey: string;
    publicKey: string;
    permissions: MCPPermission[];
    status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
    createdAt: number;
    lastActivity: number;
    requestCount: number;
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    compliance: {
        jurisdiction: string;
        kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
        amlStatus: 'CLEARED' | 'UNDER_REVIEW' | 'FLAGGED';
        accreditedInvestor: boolean;
    };
}
export interface MCPPermission {
    resource: string;
    actions: string[];
    restrictions?: {
        assetClasses?: string[];
        maxValue?: number;
        dailyLimit?: number;
        requiresApproval?: boolean;
    };
}
export interface TokenizationRequest {
    assetId: string;
    model: 'fractional' | 'digitalTwin' | 'compound' | 'yieldBearing';
    parameters: any;
    clientId: string;
    compliance: {
        jurisdiction: string;
        investorType: 'ACCREDITED' | 'RETAIL' | 'INSTITUTIONAL';
        kycDocuments: string[];
        amlClearance: boolean;
    };
}
export interface AssetQueryRequest {
    filters?: {
        assetClass?: string;
        minValue?: number;
        maxValue?: number;
        status?: string;
        jurisdiction?: string;
    };
    sort?: {
        field: string;
        direction: 'ASC' | 'DESC';
    };
    pagination?: {
        limit: number;
        offset: number;
    };
}
export declare class MCPInterface extends EventEmitter {
    private clients;
    private requestLog;
    private rateLimitTracker;
    private assetRegistry;
    private fractionalTokenizer;
    private digitalTwinTokenizer;
    private compoundTokenizer;
    private yieldTokenizer;
    private auditManager;
    private encryptionKey;
    constructor(assetRegistry: AssetRegistry, auditManager: AuditTrailManager);
    private initializeDefaultClients;
    registerClient(config: {
        name: string;
        permissions: MCPPermission[];
        compliance: MCPClient['compliance'];
    }): Promise<{
        clientId: string;
        apiKey: string;
        publicKey: string;
    }>;
    processRequest(request: MCPRequest): Promise<MCPResponse>;
    private validateRequest;
    private isSupportedVersion;
    private verifyRequestSignature;
    private checkRateLimit;
    private routeRequest;
    private checkPermissions;
    private handleAssetsList;
    private getAssetSortValue;
    private sanitizeAssetForClient;
    private hasAssetPermission;
    private handleAssetsGet;
    private handleAssetsCreate;
    private handleAssetsUpdate;
    private handleTokenizationCreate;
    private validateTokenizationCompliance;
    private handleTokenizationGet;
    private handleTokenizationTransfer;
    private handlePortfolioGet;
    private calculateAssetBreakdown;
    private calculateTokenizationBreakdown;
    private calculatePortfolioPerformance;
    private handlePortfolioPerformance;
    private calculateRiskMetrics;
    private calculateDiversificationScore;
    private calculateConcentrationRisk;
    private compareToBenchmarks;
    private generatePortfolioRecommendations;
    private handleComplianceCheck;
    private getEligibleAssetClasses;
    private getClientRestrictions;
    private calculateComplianceScore;
    private handleComplianceReport;
    private handleAnalyticsMarket;
    private calculateMarketDistribution;
    private calculateTokenizationTrends;
    private calculatePriceMovements;
    private calculateLiquidityMetrics;
    private calculateTradingVolume;
    private handleAnalyticsAsset;
    private calculateAssetValuationAnalytics;
    private calculateVolatility;
    private calculateAssetPerformance;
    private calculateAssetTokenizationAnalytics;
    private calculateAssetRiskProfile;
    private calculateAssetLiquidity;
    private handleSystemStatus;
    private handleSystemMetrics;
    private createSuccessResponse;
    private createErrorResponse;
    private signResponse;
    getClientStatistics(clientId?: string): Promise<any>;
    private getMostUsedMethods;
    revokeClient(clientId: string, reason: string): Promise<void>;
    updateClientPermissions(clientId: string, permissions: MCPPermission[]): Promise<void>;
    getAPIDocumentation(): any;
}
//# sourceMappingURL=MCPInterface.d.ts.map