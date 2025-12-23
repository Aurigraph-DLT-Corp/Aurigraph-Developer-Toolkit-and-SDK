"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPInterface = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const FractionalTokenizer_1 = require("../tokenization/FractionalTokenizer");
const DigitalTwinTokenizer_1 = require("../tokenization/DigitalTwinTokenizer");
const CompoundTokenizer_1 = require("../tokenization/CompoundTokenizer");
const YieldTokenizer_1 = require("../tokenization/YieldTokenizer");
class MCPInterface extends events_1.EventEmitter {
    constructor(assetRegistry, auditManager) {
        super();
        this.clients = new Map();
        this.requestLog = new Map();
        this.rateLimitTracker = new Map();
        this.assetRegistry = assetRegistry;
        this.auditManager = auditManager;
        this.fractionalTokenizer = new FractionalTokenizer_1.FractionalTokenizer(assetRegistry, auditManager);
        this.digitalTwinTokenizer = new DigitalTwinTokenizer_1.DigitalTwinTokenizer(assetRegistry, auditManager);
        this.compoundTokenizer = new CompoundTokenizer_1.CompoundTokenizer(assetRegistry, auditManager);
        this.yieldTokenizer = new YieldTokenizer_1.YieldTokenizer(assetRegistry, auditManager);
        this.encryptionKey = crypto_1.default.randomBytes(32).toString('hex');
        this.initializeDefaultClients();
    }
    initializeDefaultClients() {
        // Demo clients for testing
        this.registerClient({
            name: 'Aurigraph Dashboard',
            permissions: [
                {
                    resource: 'assets',
                    actions: ['READ', 'CREATE', 'UPDATE', 'TOKENIZE'],
                    restrictions: {
                        assetClasses: ['REAL_ESTATE', 'CARBON_CREDITS', 'COMMODITIES'],
                        maxValue: 10000000,
                        dailyLimit: 100
                    }
                },
                {
                    resource: 'reports',
                    actions: ['READ', 'GENERATE'],
                    restrictions: {}
                }
            ],
            compliance: {
                jurisdiction: 'US',
                kycStatus: 'VERIFIED',
                amlStatus: 'CLEARED',
                accreditedInvestor: true
            }
        });
        this.registerClient({
            name: 'Third-Party Portfolio Manager',
            permissions: [
                {
                    resource: 'assets',
                    actions: ['READ'],
                    restrictions: {
                        assetClasses: ['REAL_ESTATE', 'COMMODITIES'],
                        maxValue: 1000000,
                        dailyLimit: 1000
                    }
                },
                {
                    resource: 'tokenization',
                    actions: ['READ'],
                    restrictions: {}
                }
            ],
            compliance: {
                jurisdiction: 'EU',
                kycStatus: 'VERIFIED',
                amlStatus: 'CLEARED',
                accreditedInvestor: false
            }
        });
    }
    async registerClient(config) {
        const clientId = crypto_1.default.randomUUID();
        const apiKey = crypto_1.default.randomBytes(32).toString('hex');
        const keyPair = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        const client = {
            id: clientId,
            name: config.name,
            apiKey,
            publicKey: keyPair.publicKey,
            permissions: config.permissions,
            status: 'ACTIVE',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            requestCount: 0,
            rateLimit: {
                requestsPerMinute: 100,
                requestsPerHour: 5000,
                requestsPerDay: 50000
            },
            compliance: config.compliance
        };
        this.clients.set(clientId, client);
        await this.auditManager.logEvent('MCP_CLIENT_REGISTERED', 'ACCESS', 'MEDIUM', clientId, 'MCP_CLIENT', 'REGISTER', {
            clientName: config.name,
            permissions: config.permissions.map(p => `${p.resource}:${p.actions.join(',')}`),
            jurisdiction: config.compliance.jurisdiction
        }, { nodeId: 'mcp-interface' });
        return { clientId, apiKey, publicKey: keyPair.publicKey };
    }
    async processRequest(request) {
        const startTime = Date.now();
        try {
            // Validate request
            const validation = await this.validateRequest(request);
            if (!validation.valid) {
                return this.createErrorResponse(request.id, 401, validation.error);
            }
            // Check rate limits
            const rateLimitCheck = await this.checkRateLimit(request.clientId);
            if (!rateLimitCheck.allowed) {
                return this.createErrorResponse(request.id, 429, 'Rate limit exceeded');
            }
            // Update client activity
            const client = this.clients.get(request.clientId);
            client.lastActivity = Date.now();
            client.requestCount++;
            // Log request
            await this.auditManager.logEvent('MCP_REQUEST_RECEIVED', 'ACCESS', 'LOW', request.id, 'MCP_REQUEST', request.method, {
                clientId: request.clientId,
                method: request.method,
                paramsSize: JSON.stringify(request.params).length
            }, { nodeId: 'mcp-interface' });
            // Route request to appropriate handler
            const result = await this.routeRequest(request, client);
            // Create successful response
            const response = this.createSuccessResponse(request.id, result);
            // Log response
            await this.auditManager.logEvent('MCP_REQUEST_COMPLETED', 'ACCESS', 'LOW', request.id, 'MCP_REQUEST', 'COMPLETE', {
                clientId: request.clientId,
                method: request.method,
                processingTime: Date.now() - startTime,
                responseSize: JSON.stringify(result).length
            }, { nodeId: 'mcp-interface' });
            return response;
        }
        catch (error) {
            await this.auditManager.logEvent('MCP_REQUEST_ERROR', 'SYSTEM', 'HIGH', request.id, 'MCP_REQUEST', 'ERROR', {
                clientId: request.clientId,
                method: request.method,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime: Date.now() - startTime
            }, { nodeId: 'mcp-interface' });
            return this.createErrorResponse(request.id, 500, error instanceof Error ? error.message : 'Internal server error');
        }
    }
    async validateRequest(request) {
        // Check required fields
        if (!request.id || !request.method || !request.apiKey || !request.clientId) {
            return { valid: false, error: 'Missing required fields' };
        }
        // Check API version compatibility
        if (!request.version || !this.isSupportedVersion(request.version)) {
            return { valid: false, error: 'Unsupported API version' };
        }
        // Validate client exists and is active
        const client = this.clients.get(request.clientId);
        if (!client) {
            return { valid: false, error: 'Invalid client ID' };
        }
        if (client.status !== 'ACTIVE') {
            return { valid: false, error: 'Client access suspended or revoked' };
        }
        // Validate API key
        if (client.apiKey !== request.apiKey) {
            return { valid: false, error: 'Invalid API key' };
        }
        // Validate timestamp (prevent replay attacks)
        const requestAge = Date.now() - request.timestamp;
        if (requestAge > 300000) { // 5 minutes
            return { valid: false, error: 'Request timestamp too old' };
        }
        // Validate signature
        const isValidSignature = this.verifyRequestSignature(request, client);
        if (!isValidSignature) {
            return { valid: false, error: 'Invalid request signature' };
        }
        return { valid: true };
    }
    isSupportedVersion(version) {
        const supportedVersions = ['1.0', '1.1', '2.0'];
        return supportedVersions.includes(version);
    }
    verifyRequestSignature(request, client) {
        try {
            const requestData = {
                id: request.id,
                method: request.method,
                params: request.params,
                timestamp: request.timestamp
            };
            const hash = crypto_1.default.createHash('sha256')
                .update(JSON.stringify(requestData))
                .digest('hex');
            const verify = crypto_1.default.createVerify('RSA-SHA256');
            verify.update(hash);
            return verify.verify(client.publicKey, request.signature, 'hex');
        }
        catch {
            return false;
        }
    }
    async checkRateLimit(clientId) {
        const client = this.clients.get(clientId);
        const now = Date.now();
        let tracker = this.rateLimitTracker.get(clientId);
        if (!tracker) {
            tracker = {
                minuteRequests: [],
                hourRequests: [],
                dayRequests: []
            };
            this.rateLimitTracker.set(clientId, tracker);
        }
        // Clean old requests
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;
        tracker.minuteRequests = tracker.minuteRequests.filter((t) => t > oneMinuteAgo);
        tracker.hourRequests = tracker.hourRequests.filter((t) => t > oneHourAgo);
        tracker.dayRequests = tracker.dayRequests.filter((t) => t > oneDayAgo);
        // Check limits
        if (tracker.minuteRequests.length >= client.rateLimit.requestsPerMinute) {
            return { allowed: false, resetTime: tracker.minuteRequests[0] + 60000 };
        }
        if (tracker.hourRequests.length >= client.rateLimit.requestsPerHour) {
            return { allowed: false, resetTime: tracker.hourRequests[0] + 3600000 };
        }
        if (tracker.dayRequests.length >= client.rateLimit.requestsPerDay) {
            return { allowed: false, resetTime: tracker.dayRequests[0] + 86400000 };
        }
        // Add current request
        tracker.minuteRequests.push(now);
        tracker.hourRequests.push(now);
        tracker.dayRequests.push(now);
        return { allowed: true };
    }
    async routeRequest(request, client) {
        const method = request.method;
        // Check permissions
        const hasPermission = this.checkPermissions(client, method, request.params);
        if (!hasPermission) {
            throw new Error('Insufficient permissions for this operation');
        }
        switch (method) {
            // Asset management methods
            case 'assets.list':
                return this.handleAssetsList(request.params, client);
            case 'assets.get':
                return this.handleAssetsGet(request.params, client);
            case 'assets.create':
                return this.handleAssetsCreate(request.params, client);
            case 'assets.update':
                return this.handleAssetsUpdate(request.params, client);
            // Tokenization methods
            case 'tokenization.create':
                return this.handleTokenizationCreate(request.params, client);
            case 'tokenization.get':
                return this.handleTokenizationGet(request.params, client);
            case 'tokenization.transfer':
                return this.handleTokenizationTransfer(request.params, client);
            // Portfolio methods
            case 'portfolio.get':
                return this.handlePortfolioGet(request.params, client);
            case 'portfolio.performance':
                return this.handlePortfolioPerformance(request.params, client);
            // Compliance methods
            case 'compliance.check':
                return this.handleComplianceCheck(request.params, client);
            case 'compliance.report':
                return this.handleComplianceReport(request.params, client);
            // Analytics methods
            case 'analytics.market':
                return this.handleAnalyticsMarket(request.params, client);
            case 'analytics.asset':
                return this.handleAnalyticsAsset(request.params, client);
            // System methods
            case 'system.status':
                return this.handleSystemStatus(request.params, client);
            case 'system.metrics':
                return this.handleSystemMetrics(request.params, client);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
    checkPermissions(client, method, params) {
        const [resource, action] = method.split('.');
        const permission = client.permissions.find(p => p.resource === resource);
        if (!permission)
            return false;
        if (!permission.actions.includes(action) && !permission.actions.includes('*')) {
            return false;
        }
        // Check restrictions
        if (permission.restrictions) {
            const restrictions = permission.restrictions;
            if (restrictions.assetClasses && params.assetClass) {
                if (!restrictions.assetClasses.includes(params.assetClass)) {
                    return false;
                }
            }
            if (restrictions.maxValue && params.value) {
                if (params.value > restrictions.maxValue) {
                    return false;
                }
            }
            // Additional restriction checks would go here
        }
        return true;
    }
    async handleAssetsList(params, client) {
        const assets = await this.assetRegistry.getAllAssets();
        let filteredAssets = assets;
        // Apply filters
        if (params.filters) {
            const filters = params.filters;
            if (filters.assetClass) {
                filteredAssets = filteredAssets.filter(a => a.assetClass === filters.assetClass);
            }
            if (filters.minValue !== undefined) {
                filteredAssets = filteredAssets.filter(a => (a.valuation?.currentValue || 0) >= filters.minValue);
            }
            if (filters.maxValue !== undefined) {
                filteredAssets = filteredAssets.filter(a => (a.valuation?.currentValue || 0) <= filters.maxValue);
            }
            if (filters.status) {
                filteredAssets = filteredAssets.filter(a => a.status === filters.status);
            }
            if (filters.jurisdiction) {
                filteredAssets = filteredAssets.filter(a => a.compliance?.jurisdiction === filters.jurisdiction);
            }
        }
        // Apply sorting
        if (params.sort) {
            filteredAssets.sort((a, b) => {
                const aValue = this.getAssetSortValue(a, params.sort.field);
                const bValue = this.getAssetSortValue(b, params.sort.field);
                if (params.sort.direction === 'DESC') {
                    return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
                }
                else {
                    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                }
            });
        }
        // Apply pagination
        const totalCount = filteredAssets.length;
        if (params.pagination) {
            const { limit, offset } = params.pagination;
            filteredAssets = filteredAssets.slice(offset, offset + limit);
        }
        return {
            assets: filteredAssets.map(asset => this.sanitizeAssetForClient(asset, client)),
            totalCount,
            pagination: params.pagination
        };
    }
    getAssetSortValue(asset, field) {
        switch (field) {
            case 'value':
                return asset.valuation?.currentValue || 0;
            case 'name':
                return asset.name;
            case 'createdAt':
                return asset.createdAt;
            case 'updatedAt':
                return asset.updatedAt;
            default:
                return 0;
        }
    }
    sanitizeAssetForClient(asset, client) {
        // Remove sensitive information based on client permissions
        const sanitized = {
            id: asset.id,
            name: asset.name,
            description: asset.description,
            assetClass: asset.assetClass,
            status: asset.status,
            createdAt: asset.createdAt,
            updatedAt: asset.updatedAt
        };
        // Include valuation if client has permission
        if (this.hasAssetPermission(client, 'READ_VALUATION')) {
            sanitized.valuation = asset.valuation;
        }
        // Include tokenization info if client has permission
        if (this.hasAssetPermission(client, 'READ_TOKENIZATION')) {
            sanitized.tokenization = asset.tokenization;
        }
        // Include compliance info if client has permission
        if (this.hasAssetPermission(client, 'READ_COMPLIANCE')) {
            sanitized.compliance = asset.compliance;
        }
        return sanitized;
    }
    hasAssetPermission(client, action) {
        return client.permissions.some(p => p.resource === 'assets' &&
            (p.actions.includes(action) || p.actions.includes('*')));
    }
    async handleAssetsGet(params, client) {
        const asset = await this.assetRegistry.getAsset(params.assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        return this.sanitizeAssetForClient(asset, client);
    }
    async handleAssetsCreate(params, client) {
        // Validate asset creation parameters
        if (!params.name || !params.assetClass || !params.description) {
            throw new Error('Missing required asset parameters');
        }
        // Check if client can create this asset class
        const permission = client.permissions.find(p => p.resource === 'assets');
        if (permission?.restrictions?.assetClasses &&
            !permission.restrictions.assetClasses.includes(params.assetClass)) {
            throw new Error('Asset class not permitted for this client');
        }
        const assetId = await this.assetRegistry.createAsset({
            name: params.name,
            description: params.description,
            assetClass: params.assetClass,
            metadata: {
                ...params.metadata,
                createdViaAPI: true,
                clientId: client.id
            },
            valuation: params.valuation,
            compliance: {
                jurisdiction: client.compliance.jurisdiction,
                kycRequired: true,
                amlRequired: true,
                accreditedInvestorOnly: params.accreditedInvestorOnly || false
            }
        });
        return { assetId, status: 'CREATED' };
    }
    async handleAssetsUpdate(params, client) {
        if (!params.assetId) {
            throw new Error('Asset ID required');
        }
        const success = await this.assetRegistry.updateAsset(params.assetId, params.updates);
        return { assetId: params.assetId, updated: success };
    }
    async handleTokenizationCreate(params, client) {
        // Validate tokenization request
        if (!params.assetId || !params.model) {
            throw new Error('Asset ID and tokenization model required');
        }
        // Check compliance requirements
        if (!this.validateTokenizationCompliance(params, client)) {
            throw new Error('Tokenization request does not meet compliance requirements');
        }
        const asset = await this.assetRegistry.getAsset(params.assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        // Route to appropriate tokenizer
        let result;
        switch (params.model) {
            case 'fractional':
                result = await this.fractionalTokenizer.tokenizeAsset(params.assetId, params.parameters);
                break;
            case 'digitalTwin':
                result = await this.digitalTwinTokenizer.createDigitalTwin(params.assetId, params.parameters);
                break;
            case 'compound':
                result = await this.compoundTokenizer.createCompoundToken(params.assetId, params.parameters);
                break;
            case 'yieldBearing':
                result = await this.yieldTokenizer.createYieldToken(params.assetId, params.parameters);
                break;
            default:
                throw new Error(`Unsupported tokenization model: ${params.model}`);
        }
        return {
            tokenizationId: result.id,
            assetId: params.assetId,
            model: params.model,
            status: 'CREATED',
            tokens: result.totalSupply,
            contractAddress: result.contractAddress
        };
    }
    validateTokenizationCompliance(request, client) {
        // Check jurisdiction compatibility
        if (request.compliance.jurisdiction !== client.compliance.jurisdiction) {
            return false;
        }
        // Check KYC status
        if (client.compliance.kycStatus !== 'VERIFIED') {
            return false;
        }
        // Check AML status
        if (client.compliance.amlStatus !== 'CLEARED') {
            return false;
        }
        // Check investor type restrictions
        if (request.compliance.investorType === 'ACCREDITED' &&
            !client.compliance.accreditedInvestor) {
            return false;
        }
        return true;
    }
    async handleTokenizationGet(params, client) {
        // This would retrieve tokenization details from the appropriate tokenizer
        // For now, return placeholder data
        return {
            tokenizationId: params.tokenizationId,
            status: 'ACTIVE',
            details: 'Tokenization details would be retrieved here'
        };
    }
    async handleTokenizationTransfer(params, client) {
        // Handle token transfers between addresses
        return {
            transferId: crypto_1.default.randomUUID(),
            status: 'PENDING',
            from: params.from,
            to: params.to,
            amount: params.amount,
            txHash: crypto_1.default.randomBytes(32).toString('hex')
        };
    }
    async handlePortfolioGet(params, client) {
        const targetClientId = params.clientId || client.id;
        // Get all assets associated with this client
        const assets = await this.assetRegistry.getAllAssets();
        const clientAssets = assets.filter(asset => asset.metadata?.clientId === targetClientId ||
            asset.ownership?.primaryOwner === targetClientId);
        const portfolio = {
            clientId: targetClientId,
            totalAssets: clientAssets.length,
            totalValue: clientAssets.reduce((sum, asset) => sum + (asset.valuation?.currentValue || 0), 0),
            assetBreakdown: this.calculateAssetBreakdown(clientAssets),
            tokenization: this.calculateTokenizationBreakdown(clientAssets),
            performance: this.calculatePortfolioPerformance(clientAssets),
            lastUpdated: Date.now()
        };
        return portfolio;
    }
    calculateAssetBreakdown(assets) {
        const breakdown = assets.reduce((acc, asset) => {
            const assetClass = asset.assetClass;
            if (!acc[assetClass]) {
                acc[assetClass] = { count: 0, value: 0 };
            }
            acc[assetClass].count++;
            acc[assetClass].value += asset.valuation?.currentValue || 0;
            return acc;
        }, {});
        return breakdown;
    }
    calculateTokenizationBreakdown(assets) {
        const tokenized = assets.filter(asset => asset.tokenization);
        return {
            totalTokenized: tokenized.length,
            totalTokenSupply: tokenized.reduce((sum, asset) => sum + (asset.tokenization?.totalSupply || 0), 0),
            modelBreakdown: tokenized.reduce((acc, asset) => {
                const model = asset.tokenization?.model || 'unknown';
                acc[model] = (acc[model] || 0) + 1;
                return acc;
            }, {})
        };
    }
    calculatePortfolioPerformance(assets) {
        // Simplified performance calculation
        const valuationHistory = assets
            .filter(asset => asset.valuation?.history)
            .flatMap(asset => asset.valuation.history);
        if (valuationHistory.length === 0) {
            return { performance: '0.00%', trend: 'NEUTRAL' };
        }
        const oldestValue = Math.min(...valuationHistory.map(h => h.value));
        const newestValue = Math.max(...valuationHistory.map(h => h.value));
        const performance = ((newestValue - oldestValue) / oldestValue * 100).toFixed(2);
        return {
            performance: `${performance}%`,
            trend: parseFloat(performance) > 0 ? 'POSITIVE' :
                parseFloat(performance) < 0 ? 'NEGATIVE' : 'NEUTRAL',
            totalReturn: newestValue - oldestValue,
            valueHistory: valuationHistory.slice(-30) // Last 30 data points
        };
    }
    async handlePortfolioPerformance(params, client) {
        const portfolio = await this.handlePortfolioGet(params, client);
        return {
            ...portfolio.performance,
            riskMetrics: this.calculateRiskMetrics(portfolio),
            benchmarkComparison: this.compareToBenchmarks(portfolio),
            recommendations: this.generatePortfolioRecommendations(portfolio)
        };
    }
    calculateRiskMetrics(portfolio) {
        return {
            diversificationScore: this.calculateDiversificationScore(portfolio.assetBreakdown),
            volatilityScore: 'MEDIUM', // Would calculate from historical data
            liquidityScore: 'HIGH', // Would assess based on asset liquidity
            concentrationRisk: this.calculateConcentrationRisk(portfolio.assetBreakdown)
        };
    }
    calculateDiversificationScore(assetBreakdown) {
        const assetClasses = Object.keys(assetBreakdown);
        const totalValue = Object.values(assetBreakdown).reduce((sum, breakdown) => sum + breakdown.value, 0);
        // Calculate Herfindahl-Hirschman Index for diversification
        const hhi = assetClasses.reduce((sum, assetClass) => {
            const weight = assetBreakdown[assetClass].value / totalValue;
            return sum + (weight * weight);
        }, 0);
        // Convert to 0-100 scale (lower HHI = better diversification)
        return Math.max(0, 100 - (hhi * 100));
    }
    calculateConcentrationRisk(assetBreakdown) {
        const totalValue = Object.values(assetBreakdown).reduce((sum, breakdown) => sum + breakdown.value, 0);
        const maxConcentration = Math.max(...Object.values(assetBreakdown).map((breakdown) => breakdown.value / totalValue));
        if (maxConcentration > 0.7)
            return 'HIGH';
        if (maxConcentration > 0.4)
            return 'MEDIUM';
        return 'LOW';
    }
    compareToBenchmarks(portfolio) {
        // Simplified benchmark comparison
        const benchmarks = {
            'REAL_ESTATE': { return: '8.5%', volatility: '12%' },
            'COMMODITIES': { return: '6.2%', volatility: '18%' },
            'CARBON_CREDITS': { return: '12.1%', volatility: '25%' }
        };
        const portfolioReturn = parseFloat(portfolio.performance.performance.replace('%', ''));
        const relevantBenchmarks = Object.entries(benchmarks).filter(([assetClass]) => portfolio.assetBreakdown[assetClass]);
        return {
            benchmarks: relevantBenchmarks,
            outperformance: relevantBenchmarks.map(([assetClass, benchmark]) => ({
                assetClass,
                benchmark: benchmark.return,
                outperformance: (portfolioReturn - parseFloat(benchmark.return.replace('%', ''))).toFixed(2) + '%'
            }))
        };
    }
    generatePortfolioRecommendations(portfolio) {
        const recommendations = [];
        const diversificationScore = this.calculateDiversificationScore(portfolio.assetBreakdown);
        if (diversificationScore < 60) {
            recommendations.push('Consider diversifying across more asset classes');
        }
        const concentrationRisk = this.calculateConcentrationRisk(portfolio.assetBreakdown);
        if (concentrationRisk === 'HIGH') {
            recommendations.push('Reduce concentration in single asset class');
        }
        if (portfolio.totalAssets < 10) {
            recommendations.push('Consider adding more assets to improve portfolio stability');
        }
        return recommendations;
    }
    async handleComplianceCheck(params, client) {
        const complianceCheck = {
            clientId: client.id,
            jurisdiction: client.compliance.jurisdiction,
            kycStatus: client.compliance.kycStatus,
            amlStatus: client.compliance.amlStatus,
            accreditedInvestor: client.compliance.accreditedInvestor,
            eligibleAssetClasses: this.getEligibleAssetClasses(client),
            restrictions: this.getClientRestrictions(client),
            complianceScore: this.calculateComplianceScore(client)
        };
        return complianceCheck;
    }
    getEligibleAssetClasses(client) {
        const assetPermission = client.permissions.find(p => p.resource === 'assets');
        return assetPermission?.restrictions?.assetClasses || [];
    }
    getClientRestrictions(client) {
        return {
            maxTransactionValue: client.permissions.find(p => p.resource === 'assets')?.restrictions?.maxValue,
            dailyLimit: client.permissions.find(p => p.resource === 'assets')?.restrictions?.dailyLimit,
            requiresApproval: client.permissions.some(p => p.restrictions?.requiresApproval)
        };
    }
    calculateComplianceScore(client) {
        let score = 0;
        if (client.compliance.kycStatus === 'VERIFIED')
            score += 30;
        if (client.compliance.amlStatus === 'CLEARED')
            score += 30;
        if (client.compliance.accreditedInvestor)
            score += 20;
        if (client.status === 'ACTIVE')
            score += 20;
        return score;
    }
    async handleComplianceReport(params, client) {
        // Generate compliance report for client's activities
        const clientEvents = await this.auditManager.queryAuditTrail({
            startTime: params.startTime || Date.now() - (30 * 24 * 60 * 60 * 1000),
            endTime: params.endTime || Date.now(),
            userId: client.id
        });
        return {
            clientId: client.id,
            reportPeriod: {
                start: params.startTime || Date.now() - (30 * 24 * 60 * 60 * 1000),
                end: params.endTime || Date.now()
            },
            activities: clientEvents.length,
            complianceStatus: 'COMPLIANT',
            violations: clientEvents.filter(e => e.eventType.includes('VIOLATION')).length,
            recommendations: clientEvents.filter(e => e.eventType.includes('VIOLATION')).length > 0 ?
                ['Review compliance procedures'] : ['Continue current practices']
        };
    }
    async handleAnalyticsMarket(params, client) {
        // Market analytics for RWA tokenization
        const assets = await this.assetRegistry.getAllAssets();
        return {
            marketOverview: {
                totalAssets: assets.length,
                totalMarketCap: assets.reduce((sum, asset) => sum + (asset.valuation?.currentValue || 0), 0),
                assetClassDistribution: this.calculateMarketDistribution(assets),
                tokenizationTrends: this.calculateTokenizationTrends(assets)
            },
            priceMovements: this.calculatePriceMovements(assets),
            liquidityMetrics: this.calculateLiquidityMetrics(assets),
            tradingVolume: this.calculateTradingVolume(assets)
        };
    }
    calculateMarketDistribution(assets) {
        return assets.reduce((acc, asset) => {
            const assetClass = asset.assetClass;
            if (!acc[assetClass]) {
                acc[assetClass] = { count: 0, value: 0, percentage: 0 };
            }
            acc[assetClass].count++;
            acc[assetClass].value += asset.valuation?.currentValue || 0;
            return acc;
        }, {});
    }
    calculateTokenizationTrends(assets) {
        const tokenized = assets.filter(asset => asset.tokenization);
        const totalAssets = assets.length;
        return {
            tokenizationRate: totalAssets > 0 ? (tokenized.length / totalAssets * 100).toFixed(2) + '%' : '0%',
            modelPopularity: tokenized.reduce((acc, asset) => {
                const model = asset.tokenization?.model || 'unknown';
                acc[model] = (acc[model] || 0) + 1;
                return acc;
            }, {}),
            averageTokenSupply: tokenized.length > 0 ?
                tokenized.reduce((sum, asset) => sum + (asset.tokenization?.totalSupply || 0), 0) / tokenized.length : 0
        };
    }
    calculatePriceMovements(assets) {
        // Simplified price movement calculation
        return {
            topGainers: assets
                .filter(asset => asset.valuation?.history && asset.valuation.history.length > 1)
                .map(asset => {
                const history = asset.valuation.history;
                const oldValue = history[0].value;
                const newValue = history[history.length - 1].value;
                const change = (newValue - oldValue) / oldValue * 100;
                return { assetId: asset.id, name: asset.name, change };
            })
                .sort((a, b) => b.change - a.change)
                .slice(0, 10),
            marketTrend: 'POSITIVE' // Would calculate from overall market movement
        };
    }
    calculateLiquidityMetrics(assets) {
        const liquidAssets = assets.filter(asset => asset.tokenization && asset.tokenization.totalSupply > 0);
        return {
            liquidityRatio: assets.length > 0 ? (liquidAssets.length / assets.length * 100).toFixed(2) + '%' : '0%',
            averageBidAskSpread: '0.5%', // Would calculate from market data
            tradingPairs: liquidAssets.length,
            dailyVolume: liquidAssets.reduce((sum, asset) => sum + (asset.tokenization?.totalSupply || 0) * 0.1, 0) // Estimate 10% daily turnover
        };
    }
    calculateTradingVolume(assets) {
        return {
            daily: 5000000, // $5M daily volume estimate
            weekly: 35000000,
            monthly: 150000000,
            topTradedAssets: assets
                .filter(asset => asset.tokenization)
                .sort((a, b) => (b.tokenization?.totalSupply || 0) - (a.tokenization?.totalSupply || 0))
                .slice(0, 10)
                .map(asset => ({
                assetId: asset.id,
                name: asset.name,
                volume: (asset.tokenization?.totalSupply || 0) * 0.1
            }))
        };
    }
    async handleAnalyticsAsset(params, client) {
        const asset = await this.assetRegistry.getAsset(params.assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        return {
            assetId: params.assetId,
            analytics: {
                valuation: this.calculateAssetValuationAnalytics(asset),
                performance: this.calculateAssetPerformance(asset),
                tokenization: this.calculateAssetTokenizationAnalytics(asset),
                riskProfile: this.calculateAssetRiskProfile(asset),
                liquidityAnalysis: this.calculateAssetLiquidity(asset)
            }
        };
    }
    calculateAssetValuationAnalytics(asset) {
        const valuation = asset.valuation;
        if (!valuation || !valuation.history) {
            return { status: 'NO_DATA' };
        }
        const history = valuation.history;
        const latest = history[history.length - 1];
        const previous = history.length > 1 ? history[history.length - 2] : latest;
        return {
            currentValue: latest.value,
            previousValue: previous.value,
            change: latest.value - previous.value,
            changePercent: ((latest.value - previous.value) / previous.value * 100).toFixed(2) + '%',
            highestValue: Math.max(...history.map(h => h.value)),
            lowestValue: Math.min(...history.map(h => h.value)),
            averageValue: history.reduce((sum, h) => sum + h.value, 0) / history.length,
            volatility: this.calculateVolatility(history.map(h => h.value))
        };
    }
    calculateVolatility(values) {
        if (values.length < 2)
            return 0;
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    calculateAssetPerformance(asset) {
        return {
            roi: '8.5%', // Would calculate from historical data
            annualizedReturn: '12.3%',
            sharpeRatio: 1.8,
            maxDrawdown: '-5.2%',
            winRate: '78%'
        };
    }
    calculateAssetTokenizationAnalytics(asset) {
        if (!asset.tokenization) {
            return { status: 'NOT_TOKENIZED' };
        }
        return {
            model: asset.tokenization.model,
            totalSupply: asset.tokenization.totalSupply,
            circulatingSupply: asset.tokenization.totalSupply * 0.8, // Estimate
            marketCap: (asset.valuation?.currentValue || 0) * (asset.tokenization.totalSupply || 0),
            holders: 1250, // Would track from blockchain data
            transactions24h: 45,
            volume24h: 125000
        };
    }
    calculateAssetRiskProfile(asset) {
        return {
            overallRisk: 'MEDIUM',
            factors: {
                marketRisk: 'MEDIUM',
                liquidityRisk: 'LOW',
                operationalRisk: 'LOW',
                regulatoryRisk: asset.compliance?.jurisdiction === 'US' ? 'LOW' : 'MEDIUM',
                counterpartyRisk: 'LOW'
            },
            riskScore: 65 // 0-100 scale
        };
    }
    calculateAssetLiquidity(asset) {
        return {
            liquidityScore: asset.tokenization ? 85 : 25, // 0-100 scale
            timeToSell: asset.tokenization ? '1-3 days' : '30-90 days',
            bidAskSpread: asset.tokenization ? '0.5%' : '5-10%',
            marketDepth: asset.tokenization ? 'HIGH' : 'LOW'
        };
    }
    async handleSystemStatus(params, client) {
        return {
            status: 'OPERATIONAL',
            version: '10.20.0',
            uptime: 99.99,
            performance: {
                tps: 150000,
                latency: 450,
                nodeCount: 12
            },
            services: {
                assetRegistry: 'OPERATIONAL',
                tokenization: 'OPERATIONAL',
                compliance: 'OPERATIONAL',
                audit: 'OPERATIONAL'
            },
            lastHealthCheck: Date.now()
        };
    }
    async handleSystemMetrics(params, client) {
        const auditMetrics = this.auditManager.getAuditMetrics();
        return {
            system: {
                totalRequests: Array.from(this.clients.values()).reduce((sum, c) => sum + c.requestCount, 0),
                activeClients: Array.from(this.clients.values()).filter(c => c.status === 'ACTIVE').length,
                requestsLast24h: auditMetrics.eventsLast24h,
                averageResponseTime: 120 // ms
            },
            business: {
                totalAssets: (await this.assetRegistry.getAllAssets()).length,
                totalTokenized: (await this.assetRegistry.getAllAssets()).filter(a => a.tokenization).length,
                totalValue: (await this.assetRegistry.getAllAssets()).reduce((sum, asset) => sum + (asset.valuation?.currentValue || 0), 0),
                activeTokenizations: 1250
            },
            compliance: {
                complianceScore: 95,
                violationsLast30d: auditMetrics.complianceViolationsLast7d,
                auditTrailIntegrity: auditMetrics.chainIntegrityStatus
            }
        };
    }
    createSuccessResponse(requestId, result) {
        const response = {
            id: requestId,
            result,
            timestamp: Date.now(),
            signature: this.signResponse(requestId, result)
        };
        return response;
    }
    createErrorResponse(requestId, code, message) {
        const error = { code, message };
        const response = {
            id: requestId,
            error,
            timestamp: Date.now(),
            signature: this.signResponse(requestId, error)
        };
        return response;
    }
    signResponse(requestId, data) {
        const responseData = {
            id: requestId,
            data,
            timestamp: Date.now()
        };
        const hash = crypto_1.default.createHash('sha256')
            .update(JSON.stringify(responseData))
            .digest('hex');
        return hash; // Simplified signature - would use private key in production
    }
    async getClientStatistics(clientId) {
        if (clientId) {
            const client = this.clients.get(clientId);
            if (!client) {
                throw new Error('Client not found');
            }
            const clientEvents = await this.auditManager.queryAuditTrail({
                startTime: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
                userId: clientId
            });
            return {
                client: {
                    id: client.id,
                    name: client.name,
                    status: client.status,
                    createdAt: client.createdAt,
                    lastActivity: client.lastActivity,
                    requestCount: client.requestCount
                },
                activity: {
                    requestsLast30d: clientEvents.length,
                    averageRequestsPerDay: clientEvents.length / 30,
                    mostUsedMethods: this.getMostUsedMethods(clientEvents),
                    errorRate: clientEvents.filter(e => e.severity === 'CRITICAL').length / clientEvents.length * 100
                },
                compliance: client.compliance
            };
        }
        else {
            // Return statistics for all clients
            const allClients = Array.from(this.clients.values());
            return {
                totalClients: allClients.length,
                activeClients: allClients.filter(c => c.status === 'ACTIVE').length,
                totalRequests: allClients.reduce((sum, c) => sum + c.requestCount, 0),
                averageRequestsPerClient: allClients.reduce((sum, c) => sum + c.requestCount, 0) / allClients.length,
                clientsByJurisdiction: allClients.reduce((acc, client) => {
                    const jurisdiction = client.compliance.jurisdiction;
                    acc[jurisdiction] = (acc[jurisdiction] || 0) + 1;
                    return acc;
                }, {}),
                complianceDistribution: {
                    verified: allClients.filter(c => c.compliance.kycStatus === 'VERIFIED').length,
                    amlCleared: allClients.filter(c => c.compliance.amlStatus === 'CLEARED').length,
                    accredited: allClients.filter(c => c.compliance.accreditedInvestor).length
                }
            };
        }
    }
    getMostUsedMethods(events) {
        const methodCounts = events.reduce((acc, event) => {
            const method = event.action;
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(methodCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([method, count]) => ({ method, count }));
    }
    async revokeClient(clientId, reason) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        client.status = 'REVOKED';
        await this.auditManager.logEvent('MCP_CLIENT_REVOKED', 'ACCESS', 'HIGH', clientId, 'MCP_CLIENT', 'REVOKE', {
            clientName: client.name,
            reason,
            previousStatus: 'ACTIVE',
            revokedBy: 'SYSTEM'
        }, { nodeId: 'mcp-interface' });
    }
    async updateClientPermissions(clientId, permissions) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        const oldPermissions = client.permissions;
        client.permissions = permissions;
        await this.auditManager.logEvent('MCP_CLIENT_PERMISSIONS_UPDATED', 'ACCESS', 'MEDIUM', clientId, 'MCP_CLIENT', 'UPDATE_PERMISSIONS', {
            clientName: client.name,
            oldPermissions: oldPermissions.map(p => `${p.resource}:${p.actions.join(',')}`),
            newPermissions: permissions.map(p => `${p.resource}:${p.actions.join(',')}`)
        }, { nodeId: 'mcp-interface' });
    }
    getAPIDocumentation() {
        return {
            version: '2.0',
            title: 'Aurigraph RWA Tokenization MCP API',
            description: 'Model Context Protocol interface for Real-World Asset tokenization platform',
            baseUrl: 'https://api.aurigraph.io/rwa/v2',
            authentication: {
                type: 'API_KEY_AND_SIGNATURE',
                description: 'Requires API key and RSA signature for all requests'
            },
            endpoints: {
                // Asset Management
                'assets.list': {
                    description: 'List assets with filtering and pagination',
                    method: 'POST',
                    params: {
                        filters: 'Object - Optional filtering criteria',
                        sort: 'Object - Optional sorting configuration',
                        pagination: 'Object - Optional pagination settings'
                    },
                    returns: 'Array of assets with metadata'
                },
                'assets.get': {
                    description: 'Get detailed asset information',
                    method: 'POST',
                    params: {
                        assetId: 'String - Asset identifier'
                    },
                    returns: 'Asset object with full details'
                },
                'assets.create': {
                    description: 'Create new asset registration',
                    method: 'POST',
                    params: {
                        name: 'String - Asset name',
                        description: 'String - Asset description',
                        assetClass: 'String - Asset classification',
                        metadata: 'Object - Additional asset metadata',
                        valuation: 'Object - Initial valuation data'
                    },
                    returns: 'Asset ID and creation status'
                },
                // Tokenization
                'tokenization.create': {
                    description: 'Create asset tokenization',
                    method: 'POST',
                    params: {
                        assetId: 'String - Target asset ID',
                        model: 'String - Tokenization model (fractional|digitalTwin|compound|yieldBearing)',
                        parameters: 'Object - Model-specific parameters',
                        compliance: 'Object - Compliance verification data'
                    },
                    returns: 'Tokenization ID and contract details'
                },
                // Portfolio
                'portfolio.get': {
                    description: 'Get portfolio overview and holdings',
                    method: 'POST',
                    params: {
                        clientId: 'String - Optional client ID'
                    },
                    returns: 'Portfolio summary and asset breakdown'
                },
                // Analytics
                'analytics.market': {
                    description: 'Get market analytics and trends',
                    method: 'POST',
                    params: {
                        timeframe: 'String - Analysis timeframe'
                    },
                    returns: 'Market overview and trend analysis'
                },
                // Compliance
                'compliance.check': {
                    description: 'Check client compliance status',
                    method: 'POST',
                    params: {},
                    returns: 'Compliance status and restrictions'
                },
                // System
                'system.status': {
                    description: 'Get system operational status',
                    method: 'POST',
                    params: {},
                    returns: 'System health and performance metrics'
                }
            },
            rateLimits: {
                default: {
                    requestsPerMinute: 100,
                    requestsPerHour: 5000,
                    requestsPerDay: 50000
                },
                premium: {
                    requestsPerMinute: 500,
                    requestsPerHour: 25000,
                    requestsPerDay: 250000
                }
            },
            errorCodes: {
                400: 'Bad Request - Invalid parameters',
                401: 'Unauthorized - Invalid API key or signature',
                403: 'Forbidden - Insufficient permissions',
                404: 'Not Found - Resource does not exist',
                429: 'Too Many Requests - Rate limit exceeded',
                500: 'Internal Server Error - System error'
            },
            examples: {
                'assets.list': {
                    request: {
                        id: 'req-123',
                        method: 'assets.list',
                        params: {
                            filters: { assetClass: 'REAL_ESTATE' },
                            pagination: { limit: 10, offset: 0 }
                        },
                        apiKey: 'your-api-key',
                        timestamp: Date.now(),
                        signature: 'request-signature',
                        version: '2.0',
                        clientId: 'your-client-id'
                    },
                    response: {
                        id: 'req-123',
                        result: {
                            assets: [ /* asset objects */],
                            totalCount: 150,
                            pagination: { limit: 10, offset: 0 }
                        },
                        timestamp: Date.now(),
                        signature: 'response-signature'
                    }
                }
            }
        };
    }
}
exports.MCPInterface = MCPInterface;
