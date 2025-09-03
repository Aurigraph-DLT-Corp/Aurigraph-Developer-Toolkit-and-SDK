import crypto from 'crypto';
import fetch from 'node-fetch';

export interface MCPClientConfig {
    baseUrl: string;
    clientId: string;
    apiKey: string;
    privateKey: string; // PEM format private key
    version?: string;
}

export class MCPClient {
    private config: MCPClientConfig;

    constructor(config: MCPClientConfig) {
        this.config = {
            version: '2.0',
            ...config
        };
    }

    async makeRequest(method: string, params: any = {}): Promise<any> {
        const requestId = crypto.randomUUID();
        const timestamp = Date.now();

        // Create request object
        const requestData = {
            id: requestId,
            method,
            params,
            timestamp
        };

        // Sign the request
        const signature = this.signRequest(requestData);

        const mcpRequest = {
            ...requestData,
            apiKey: this.config.apiKey,
            signature,
            version: this.config.version,
            clientId: this.config.clientId
        };

        // Make HTTP request
        const response = await fetch(`${this.config.baseUrl}/api/rwa/v2/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.config.apiKey,
                'X-Client-ID': this.config.clientId,
                'X-Signature': signature
            },
            body: JSON.stringify(mcpRequest)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(`MCP Error ${result.error.code}: ${result.error.message}`);
        }

        return result.result;
    }

    private signRequest(requestData: any): string {
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(requestData))
            .digest('hex');

        const sign = crypto.createSign('RSA-SHA256');
        sign.update(hash);
        return sign.sign(this.config.privateKey, 'hex');
    }

    // Asset Management Methods
    async listAssets(filters?: any, sort?: any, pagination?: any): Promise<any> {
        return this.makeRequest('assets.list', { filters, sort, pagination });
    }

    async getAsset(assetId: string): Promise<any> {
        return this.makeRequest('assets.get', { assetId });
    }

    async createAsset(assetData: any): Promise<any> {
        return this.makeRequest('assets.create', assetData);
    }

    async updateAsset(assetId: string, updates: any): Promise<any> {
        return this.makeRequest('assets.update', { assetId, updates });
    }

    // Tokenization Methods
    async createTokenization(tokenizationRequest: any): Promise<any> {
        return this.makeRequest('tokenization.create', tokenizationRequest);
    }

    async getTokenization(tokenizationId: string): Promise<any> {
        return this.makeRequest('tokenization.get', { tokenizationId });
    }

    async transferTokens(transferRequest: any): Promise<any> {
        return this.makeRequest('tokenization.transfer', transferRequest);
    }

    // Portfolio Methods
    async getPortfolio(clientId?: string): Promise<any> {
        return this.makeRequest('portfolio.get', { clientId });
    }

    async getPortfolioPerformance(clientId?: string): Promise<any> {
        return this.makeRequest('portfolio.performance', { clientId });
    }

    // Analytics Methods
    async getMarketAnalytics(timeframe?: string): Promise<any> {
        return this.makeRequest('analytics.market', { timeframe });
    }

    async getAssetAnalytics(assetId: string): Promise<any> {
        return this.makeRequest('analytics.asset', { assetId });
    }

    // Compliance Methods
    async checkCompliance(): Promise<any> {
        return this.makeRequest('compliance.check');
    }

    async getComplianceReport(startTime?: number, endTime?: number): Promise<any> {
        return this.makeRequest('compliance.report', { startTime, endTime });
    }

    // System Methods
    async getSystemStatus(): Promise<any> {
        return this.makeRequest('system.status');
    }

    async getSystemMetrics(): Promise<any> {
        return this.makeRequest('system.metrics');
    }
}

// Example usage and integration patterns
export class ExampleMCPIntegrations {
    private client: MCPClient;

    constructor(client: MCPClient) {
        this.client = client;
    }

    // Example: Portfolio Management Integration
    async portfolioManagerIntegration(): Promise<void> {
        console.log('🏢 Portfolio Manager Integration Example');
        console.log('==========================================');

        try {
            // Get current portfolio
            const portfolio = await this.client.getPortfolio();
            console.log('📊 Current Portfolio:', portfolio);

            // Get performance metrics
            const performance = await this.client.getPortfolioPerformance();
            console.log('📈 Performance:', performance);

            // List available assets for investment
            const availableAssets = await this.client.listAssets({
                filters: { status: 'AVAILABLE' },
                sort: { field: 'value', direction: 'DESC' },
                pagination: { limit: 20, offset: 0 }
            });
            console.log('🏠 Available Assets:', availableAssets.totalCount);

            // Get market analytics
            const marketData = await this.client.getMarketAnalytics('monthly');
            console.log('📊 Market Data:', marketData.marketOverview);

        } catch (error) {
            console.error('❌ Portfolio Manager Integration Error:', error);
        }
    }

    // Example: Real Estate Platform Integration
    async realEstatePlatformIntegration(): Promise<void> {
        console.log('🏠 Real Estate Platform Integration Example');
        console.log('=============================================');

        try {
            // Create new real estate asset
            const newAsset = await this.client.createAsset({
                name: 'Luxury Apartment Complex - Downtown SF',
                description: 'Premium 150-unit apartment complex in San Francisco financial district',
                assetClass: 'REAL_ESTATE',
                metadata: {
                    property: {
                        address: '123 Financial District Blvd, San Francisco, CA',
                        units: 150,
                        totalSqFt: 125000,
                        yearBuilt: 2018,
                        amenities: ['Gym', 'Rooftop', 'Concierge', 'Parking']
                    },
                    zoning: 'Commercial/Residential',
                    taxAssessment: 45000000
                },
                valuation: {
                    currentValue: 50000000,
                    currency: 'USD',
                    valuationMethod: 'PROFESSIONAL_APPRAISAL',
                    valuationDate: Date.now(),
                    appraiser: 'SF Premier Appraisals LLC'
                }
            });

            console.log('🏗️ Asset Created:', newAsset.assetId);

            // Tokenize the asset using fractional model
            const tokenization = await this.client.createTokenization({
                assetId: newAsset.assetId,
                model: 'fractional',
                parameters: {
                    totalTokens: 50000000, // $1 per token
                    minimumInvestment: 1000,
                    investorLimit: 499, // SEC Regulation D limit
                    yieldDistribution: {
                        frequency: 'QUARTERLY',
                        expectedYield: 8.5
                    }
                },
                compliance: {
                    jurisdiction: 'US',
                    investorType: 'ACCREDITED',
                    kycDocuments: ['IDENTITY_VERIFICATION', 'INCOME_VERIFICATION'],
                    amlClearance: true
                }
            });

            console.log('🪙 Tokenization Created:', tokenization.tokenizationId);

            // Get asset analytics
            const analytics = await this.client.getAssetAnalytics(newAsset.assetId);
            console.log('📊 Asset Analytics:', analytics);

        } catch (error) {
            console.error('❌ Real Estate Integration Error:', error);
        }
    }

    // Example: Carbon Credit Trading Integration
    async carbonCreditTradingIntegration(): Promise<void> {
        console.log('🌱 Carbon Credit Trading Integration Example');
        console.log('=============================================');

        try {
            // List carbon credit assets
            const carbonAssets = await this.client.listAssets({
                filters: { assetClass: 'CARBON_CREDITS' },
                sort: { field: 'value', direction: 'ASC' }
            });

            console.log('🌍 Available Carbon Credits:', carbonAssets.totalCount);

            // Create digital twin for carbon offset project
            if (carbonAssets.assets.length > 0) {
                const assetId = carbonAssets.assets[0].id;
                
                const digitalTwin = await this.client.createTokenization({
                    assetId,
                    model: 'digitalTwin',
                    parameters: {
                        iotIntegration: {
                            sensorTypes: ['CO2_MONITORING', 'FOREST_HEALTH', 'BIODIVERSITY'],
                            dataFrequency: 'HOURLY',
                            monitoringDuration: 365 * 5 // 5 years
                        },
                        verificationProtocol: {
                            standard: 'VERRA_VCS',
                            auditFrequency: 'QUARTERLY',
                            thirdPartyVerification: true
                        }
                    },
                    compliance: {
                        jurisdiction: 'GLOBAL',
                        investorType: 'INSTITUTIONAL',
                        kycDocuments: ['INSTITUTIONAL_VERIFICATION'],
                        amlClearance: true
                    }
                });

                console.log('🌿 Digital Twin Created:', digitalTwin.tokenizationId);
            }

        } catch (error) {
            console.error('❌ Carbon Credit Integration Error:', error);
        }
    }

    // Example: DeFi Protocol Integration
    async defiProtocolIntegration(): Promise<void> {
        console.log('🔗 DeFi Protocol Integration Example');
        console.log('=====================================');

        try {
            // Get system capabilities
            const response = await fetch(`${this.client['config'].baseUrl}/api/rwa/v2/capabilities`);
            const capabilities = await response.json();
            console.log('⚙️ System Capabilities:', capabilities.features);

            // Create compound tokenization for DeFi liquidity pool
            const compoundAssets = await this.client.listAssets({
                filters: { assetClass: 'COMMODITIES' },
                pagination: { limit: 5, offset: 0 }
            });

            if (compoundAssets.assets.length >= 3) {
                const assetIds = compoundAssets.assets.slice(0, 3).map((asset: any) => asset.id);
                
                const compoundToken = await this.client.createTokenization({
                    assetId: assetIds[0], // Primary asset
                    model: 'compound',
                    parameters: {
                        underlyingAssets: assetIds,
                        weights: [0.5, 0.3, 0.2],
                        rebalanceFrequency: 'MONTHLY',
                        managementFee: 0.02, // 2% annual
                        performanceFee: 0.15, // 15% of profits
                        indexStrategy: 'MARKET_CAP_WEIGHTED'
                    },
                    compliance: {
                        jurisdiction: 'US',
                        investorType: 'RETAIL',
                        kycDocuments: ['BASIC_VERIFICATION'],
                        amlClearance: true
                    }
                });

                console.log('📦 Compound Token Created:', compoundToken.tokenizationId);
            }

        } catch (error) {
            console.error('❌ DeFi Protocol Integration Error:', error);
        }
    }

    // Example: Compliance Monitoring Integration
    async complianceMonitoringIntegration(): Promise<void> {
        console.log('⚖️ Compliance Monitoring Integration Example');
        console.log('============================================');

        try {
            // Check current compliance status
            const complianceStatus = await this.client.checkCompliance();
            console.log('✅ Compliance Status:', complianceStatus);

            // Get compliance report
            const startTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // Last 30 days
            const complianceReport = await this.client.getComplianceReport(startTime);
            console.log('📋 Compliance Report:', complianceReport);

            // Monitor for violations
            if (complianceReport.violations > 0) {
                console.log('⚠️ Compliance Violations Detected:', complianceReport.violations);
                
                // Get detailed analytics for investigation
                const systemMetrics = await this.client.getSystemMetrics();
                console.log('🔍 System Metrics for Investigation:', systemMetrics.compliance);
            }

        } catch (error) {
            console.error('❌ Compliance Monitoring Error:', error);
        }
    }

    // Example: Market Data Integration
    async marketDataIntegration(): Promise<void> {
        console.log('📈 Market Data Integration Example');
        console.log('==================================');

        try {
            // Get overall market analytics
            const marketData = await this.client.getMarketAnalytics('quarterly');
            console.log('🌍 Market Overview:', marketData.marketOverview);

            // Analyze top performing assets
            for (const asset of marketData.priceMovements.topGainers.slice(0, 3)) {
                const assetAnalytics = await this.client.getAssetAnalytics(asset.assetId);
                console.log(`📊 ${asset.name} Analytics:`, assetAnalytics.analytics.performance);
            }

            // Check liquidity metrics
            console.log('💧 Liquidity Metrics:', marketData.liquidityMetrics);

        } catch (error) {
            console.error('❌ Market Data Integration Error:', error);
        }
    }
}

// Example client configurations for different use cases
export const ExampleClientConfigs = {
    // Portfolio management platform
    portfolioManager: {
        baseUrl: 'http://localhost:3020',
        clientId: 'portfolio-mgr-001',
        apiKey: 'pm_test_key_123456789',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----`,
        version: '2.0'
    },

    // Real estate platform
    realEstate: {
        baseUrl: 'http://localhost:3020',
        clientId: 're-platform-001',
        apiKey: 're_test_key_123456789',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----`,
        version: '2.0'
    },

    // Carbon credit marketplace
    carbonMarketplace: {
        baseUrl: 'http://localhost:3020',
        clientId: 'carbon-mkt-001', 
        apiKey: 'cc_test_key_123456789',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----`,
        version: '2.0'
    },

    // DeFi protocol
    defiProtocol: {
        baseUrl: 'http://localhost:3020',
        clientId: 'defi-protocol-001',
        apiKey: 'defi_test_key_123456789',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----`,
        version: '2.0'
    }
};

// Usage examples
export async function runMCPExamples(): Promise<void> {
    console.log('🚀 Running MCP Integration Examples');
    console.log('===================================');

    try {
        // Portfolio Manager Example
        const portfolioClient = new MCPClient(ExampleClientConfigs.portfolioManager);
        const examples = new ExampleMCPIntegrations(portfolioClient);
        
        await examples.portfolioManagerIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause

        // Real Estate Platform Example
        const realEstateClient = new MCPClient(ExampleClientConfigs.realEstate);
        const realEstateExamples = new ExampleMCPIntegrations(realEstateClient);
        
        await realEstateExamples.realEstatePlatformIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Carbon Credit Trading Example
        const carbonClient = new MCPClient(ExampleClientConfigs.carbonMarketplace);
        const carbonExamples = new ExampleMCPIntegrations(carbonClient);
        
        await carbonExamples.carbonCreditTradingIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // DeFi Protocol Example
        const defiClient = new MCPClient(ExampleClientConfigs.defiProtocol);
        const defiExamples = new ExampleMCPIntegrations(defiClient);
        
        await defiExamples.defiProtocolIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Compliance Monitoring Example
        await examples.complianceMonitoringIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Market Data Integration Example
        await examples.marketDataIntegration();

        console.log('✅ All MCP Integration Examples Completed Successfully');

    } catch (error) {
        console.error('❌ MCP Examples Error:', error);
    }
}

// Webhook integration example
export class MCPWebhookHandler {
    private client: MCPClient;
    private webhookUrl: string;

    constructor(client: MCPClient, webhookUrl: string) {
        this.client = client;
        this.webhookUrl = webhookUrl;
    }

    async setupWebhookListeners(): Promise<void> {
        // In a real implementation, this would set up WebSocket connections
        // or long polling to receive real-time updates from the MCP server
        
        console.log('🔔 Setting up webhook listeners for:');
        console.log('  - Asset valuation changes');
        console.log('  - Tokenization events');
        console.log('  - Compliance alerts');
        console.log('  - System status changes');
    }

    async handleAssetValuationChange(event: any): Promise<void> {
        console.log('💰 Asset Valuation Change Received:', event);
        
        // Example: Update internal systems when asset values change
        await this.notifyInternalSystems('ASSET_VALUATION_CHANGE', event);
    }

    async handleTokenizationEvent(event: any): Promise<void> {
        console.log('🪙 Tokenization Event Received:', event);
        
        // Example: Update trading systems when new tokens are created
        await this.notifyInternalSystems('NEW_TOKENIZATION', event);
    }

    async handleComplianceAlert(event: any): Promise<void> {
        console.log('⚠️ Compliance Alert Received:', event);
        
        // Example: Trigger immediate compliance review
        await this.notifyInternalSystems('COMPLIANCE_ALERT', event);
    }

    private async notifyInternalSystems(eventType: string, eventData: any): Promise<void> {
        // Simulate webhook notification to internal systems
        console.log(`📤 Notifying internal systems: ${eventType}`);
        
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Type': eventType,
                    'X-Source': 'aurigraph-mcp'
                },
                body: JSON.stringify({
                    eventType,
                    timestamp: Date.now(),
                    data: eventData,
                    source: 'aurigraph-rwa-platform'
                })
            });

            if (response.ok) {
                console.log('✅ Internal systems notified successfully');
            } else {
                console.log('❌ Failed to notify internal systems:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Webhook notification error:', error);
        }
    }
}

// Error handling and retry logic example
export class MCPErrorHandler {
    private client: MCPClient;
    private maxRetries: number;
    private backoffMultiplier: number;

    constructor(client: MCPClient, maxRetries: number = 3, backoffMultiplier: number = 2) {
        this.client = client;
        this.maxRetries = maxRetries;
        this.backoffMultiplier = backoffMultiplier;
    }

    async makeRequestWithRetry(method: string, params: any): Promise<any> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.client.makeRequest(method, params);
            } catch (error) {
                lastError = error as Error;
                console.log(`❌ Request failed (attempt ${attempt}/${this.maxRetries}):`, error);

                if (attempt === this.maxRetries) {
                    break;
                }

                // Exponential backoff
                const delay = Math.pow(this.backoffMultiplier, attempt - 1) * 1000;
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error(`MCP request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
    }

    async handleRateLimitError(error: any): Promise<void> {
        if (error.message.includes('Rate limit exceeded')) {
            console.log('🚫 Rate limit exceeded, implementing backoff strategy');
            
            // Extract reset time from error if available
            const resetTime = error.resetTime || Date.now() + (60 * 1000); // Default 1 minute
            const waitTime = resetTime - Date.now();
            
            if (waitTime > 0) {
                console.log(`⏳ Waiting ${waitTime}ms for rate limit reset...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
}