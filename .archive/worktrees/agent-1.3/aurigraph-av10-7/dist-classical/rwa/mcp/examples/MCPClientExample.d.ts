export interface MCPClientConfig {
    baseUrl: string;
    clientId: string;
    apiKey: string;
    privateKey: string;
    version?: string;
}
export declare class MCPClient {
    private config;
    constructor(config: MCPClientConfig);
    makeRequest(method: string, params?: any): Promise<any>;
    private signRequest;
    listAssets(filters?: any, sort?: any, pagination?: any): Promise<any>;
    getAsset(assetId: string): Promise<any>;
    createAsset(assetData: any): Promise<any>;
    updateAsset(assetId: string, updates: any): Promise<any>;
    createTokenization(tokenizationRequest: any): Promise<any>;
    getTokenization(tokenizationId: string): Promise<any>;
    transferTokens(transferRequest: any): Promise<any>;
    getPortfolio(clientId?: string): Promise<any>;
    getPortfolioPerformance(clientId?: string): Promise<any>;
    getMarketAnalytics(timeframe?: string): Promise<any>;
    getAssetAnalytics(assetId: string): Promise<any>;
    checkCompliance(): Promise<any>;
    getComplianceReport(startTime?: number, endTime?: number): Promise<any>;
    getSystemStatus(): Promise<any>;
    getSystemMetrics(): Promise<any>;
}
export declare class ExampleMCPIntegrations {
    private client;
    constructor(client: MCPClient);
    portfolioManagerIntegration(): Promise<void>;
    realEstatePlatformIntegration(): Promise<void>;
    carbonCreditTradingIntegration(): Promise<void>;
    defiProtocolIntegration(): Promise<void>;
    complianceMonitoringIntegration(): Promise<void>;
    marketDataIntegration(): Promise<void>;
}
export declare const ExampleClientConfigs: {
    portfolioManager: {
        baseUrl: string;
        clientId: string;
        apiKey: string;
        privateKey: string;
        version: string;
    };
    realEstate: {
        baseUrl: string;
        clientId: string;
        apiKey: string;
        privateKey: string;
        version: string;
    };
    carbonMarketplace: {
        baseUrl: string;
        clientId: string;
        apiKey: string;
        privateKey: string;
        version: string;
    };
    defiProtocol: {
        baseUrl: string;
        clientId: string;
        apiKey: string;
        privateKey: string;
        version: string;
    };
};
export declare function runMCPExamples(): Promise<void>;
export declare class MCPWebhookHandler {
    private client;
    private webhookUrl;
    constructor(client: MCPClient, webhookUrl: string);
    setupWebhookListeners(): Promise<void>;
    handleAssetValuationChange(event: any): Promise<void>;
    handleTokenizationEvent(event: any): Promise<void>;
    handleComplianceAlert(event: any): Promise<void>;
    private notifyInternalSystems;
}
export declare class MCPErrorHandler {
    private client;
    private maxRetries;
    private backoffMultiplier;
    constructor(client: MCPClient, maxRetries?: number, backoffMultiplier?: number);
    makeRequestWithRetry(method: string, params: any): Promise<any>;
    handleRateLimitError(error: any): Promise<void>;
}
//# sourceMappingURL=MCPClientExample.d.ts.map