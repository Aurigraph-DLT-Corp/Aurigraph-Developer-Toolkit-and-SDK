"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAssetClassManager = void 0;
const events_1 = require("events");
const AssetRegistry_1 = require("./AssetRegistry");
class MultiAssetClassManager extends events_1.EventEmitter {
    assetClassConfigs = new Map();
    assetClassMetrics = new Map();
    assetRegistry;
    cryptoManager;
    constructor(assetRegistry, cryptoManager) {
        super();
        this.assetRegistry = assetRegistry;
        this.cryptoManager = cryptoManager;
        this.initializeAssetClassConfigurations();
    }
    initializeAssetClassConfigurations() {
        // Real Estate Configuration
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.REAL_ESTATE, {
            assetType: AssetRegistry_1.AssetType.REAL_ESTATE,
            validationRules: [
                {
                    ruleId: 'RE001',
                    name: 'Property Address Required',
                    field: 'metadata.location',
                    condition: 'required',
                    errorMessage: 'Property address is mandatory',
                    severity: 'ERROR',
                    mandatory: true
                },
                {
                    ruleId: 'RE002',
                    name: 'Minimum Value Check',
                    field: 'valuation.currentValue',
                    condition: 'min:50000',
                    errorMessage: 'Minimum property value is $50,000',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'propertyType', fieldType: 'STRING', description: 'Type of property (residential/commercial/industrial)' },
                    { fieldName: 'squareFootage', fieldType: 'NUMBER', description: 'Total square footage' },
                    { fieldName: 'yearBuilt', fieldType: 'NUMBER', description: 'Year of construction' },
                    { fieldName: 'address', fieldType: 'STRING', description: 'Full property address' }
                ],
                optionalFields: [
                    { fieldName: 'parking', fieldType: 'NUMBER', description: 'Number of parking spaces' },
                    { fieldName: 'amenities', fieldType: 'ARRAY', description: 'Property amenities' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'RE_US_001',
                    jurisdiction: 'US',
                    regulation: 'Securities Act 1933',
                    description: 'Real estate securities compliance',
                    mandatory: true,
                    validationMethod: 'LEGAL_REVIEW',
                    documentation: ['Title deed', 'Property survey', 'Environmental assessment']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'CMA',
                    name: 'Comparative Market Analysis',
                    description: 'Market-based valuation using comparable sales',
                    applicability: ['residential', 'commercial'],
                    accuracy: 92,
                    cost: 1500,
                    timeRequired: 4,
                    providers: ['Knight Frank', 'CBRE', 'JLL']
                },
                {
                    methodId: 'INCOME_APPROACH',
                    name: 'Income Approach',
                    description: 'Valuation based on income generation potential',
                    applicability: ['commercial', 'rental'],
                    accuracy: 88,
                    cost: 2000,
                    timeRequired: 6,
                    providers: ['Cushman & Wakefield', 'Colliers']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: true,
                compoundSupported: true,
                yieldBearingSupported: true,
                minimumValue: 50000,
                fractionalMinimum: 1000,
                restrictions: ['Accredited investors only for values >$1M']
            },
            riskFactors: {
                liquidityRisk: 65,
                volatilityRisk: 40,
                regulatoryRisk: 30,
                operationalRisk: 25,
                marketRisk: 50,
                overallRisk: 'MEDIUM',
                mitigationStrategies: ['Diversification', 'Professional management', 'Insurance coverage']
            }
        });
        // Carbon Credits Configuration
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.CARBON_CREDITS, {
            assetType: AssetRegistry_1.AssetType.CARBON_CREDITS,
            validationRules: [
                {
                    ruleId: 'CC001',
                    name: 'Certification Required',
                    field: 'metadata.certifications',
                    condition: 'contains:VCS,CDM,CAR',
                    errorMessage: 'Valid carbon credit certification required',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'creditType', fieldType: 'STRING', description: 'Type of carbon credit (VER, CER, etc.)' },
                    { fieldName: 'vintageYear', fieldType: 'NUMBER', description: 'Year credits were generated' },
                    { fieldName: 'methodology', fieldType: 'STRING', description: 'Methodology used for credit generation' },
                    { fieldName: 'verifier', fieldType: 'STRING', description: 'Third-party verifier' }
                ],
                optionalFields: [
                    { fieldName: 'cobenefits', fieldType: 'ARRAY', description: 'Additional environmental benefits' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'CC_GLOBAL_001',
                    jurisdiction: 'GLOBAL',
                    regulation: 'Paris Agreement Article 6',
                    description: 'International carbon credit standards',
                    mandatory: true,
                    validationMethod: 'REGISTRY_VERIFICATION',
                    documentation: ['Registry certificate', 'Methodology document']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'MARKET_PRICE',
                    name: 'Carbon Market Price',
                    description: 'Current market price from verified exchanges',
                    applicability: ['all'],
                    accuracy: 95,
                    cost: 50,
                    timeRequired: 0.5,
                    providers: ['ICE', 'EEX', 'Xpansiv']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: false,
                compoundSupported: true,
                yieldBearingSupported: false,
                minimumValue: 100,
                fractionalMinimum: 1,
                restrictions: ['Retirement tracking required']
            },
            riskFactors: {
                liquidityRisk: 45,
                volatilityRisk: 70,
                regulatoryRisk: 80,
                operationalRisk: 20,
                marketRisk: 75,
                overallRisk: 'HIGH',
                mitigationStrategies: ['Registry verification', 'Insurance', 'Diversification']
            }
        });
        // Continue with other asset types...
        this.initializeCommoditiesConfig();
        this.initializeIPConfig();
        this.initializeArtConfig();
        this.initializeInfrastructureConfig();
    }
    initializeCommoditiesConfig() {
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.COMMODITIES, {
            assetType: AssetRegistry_1.AssetType.COMMODITIES,
            validationRules: [
                {
                    ruleId: 'COM001',
                    name: 'Grade Specification',
                    field: 'metadata.specifications.grade',
                    condition: 'required',
                    errorMessage: 'Commodity grade specification required',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'commodityType', fieldType: 'STRING', description: 'Type of commodity' },
                    { fieldName: 'grade', fieldType: 'STRING', description: 'Quality/purity grade' },
                    { fieldName: 'quantity', fieldType: 'NUMBER', description: 'Quantity available' },
                    { fieldName: 'unit', fieldType: 'STRING', description: 'Unit of measurement' },
                    { fieldName: 'storageLocation', fieldType: 'STRING', description: 'Storage facility location' }
                ],
                optionalFields: [
                    { fieldName: 'origin', fieldType: 'STRING', description: 'Country/region of origin' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'COM_US_001',
                    jurisdiction: 'US',
                    regulation: 'CFTC Regulations',
                    description: 'Commodity trading compliance',
                    mandatory: true,
                    validationMethod: 'REGULATORY_FILING',
                    documentation: ['Warehouse receipt', 'Quality certificate']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'SPOT_PRICE',
                    name: 'Spot Market Price',
                    description: 'Current spot market pricing',
                    applicability: ['all'],
                    accuracy: 98,
                    cost: 25,
                    timeRequired: 0.1,
                    providers: ['Bloomberg', 'Reuters', 'CME']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: true,
                compoundSupported: true,
                yieldBearingSupported: false,
                minimumValue: 1000,
                fractionalMinimum: 100,
                restrictions: ['Physical delivery requirements']
            },
            riskFactors: {
                liquidityRisk: 30,
                volatilityRisk: 85,
                regulatoryRisk: 40,
                operationalRisk: 50,
                marketRisk: 80,
                overallRisk: 'HIGH',
                mitigationStrategies: ['Hedging', 'Storage insurance', 'Quality guarantees']
            }
        });
    }
    initializeIPConfig() {
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.INTELLECTUAL_PROPERTY, {
            assetType: AssetRegistry_1.AssetType.INTELLECTUAL_PROPERTY,
            validationRules: [
                {
                    ruleId: 'IP001',
                    name: 'Patent Number Required',
                    field: 'metadata.specifications.patentNumber',
                    condition: 'required_if:type=patent',
                    errorMessage: 'Patent number required for patent assets',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'ipType', fieldType: 'STRING', description: 'Type of IP (patent/trademark/copyright)' },
                    { fieldName: 'registrationNumber', fieldType: 'STRING', description: 'Official registration number' },
                    { fieldName: 'jurisdiction', fieldType: 'STRING', description: 'Jurisdiction of registration' },
                    { fieldName: 'expiryDate', fieldType: 'DATE', description: 'Expiry date of protection' }
                ],
                optionalFields: [
                    { fieldName: 'licensees', fieldType: 'ARRAY', description: 'Current licensees' },
                    { fieldName: 'royaltyRate', fieldType: 'NUMBER', description: 'Current royalty rate' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'IP_US_001',
                    jurisdiction: 'US',
                    regulation: 'USPTO Regulations',
                    description: 'US Patent and Trademark Office compliance',
                    mandatory: true,
                    validationMethod: 'REGISTRY_CHECK',
                    documentation: ['Registration certificate', 'Maintenance fee receipts']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'INCOME_METHOD',
                    name: 'Income Method',
                    description: 'Valuation based on future income streams',
                    applicability: ['patent', 'trademark'],
                    accuracy: 85,
                    cost: 5000,
                    timeRequired: 20,
                    providers: ['Ocean Tomo', 'KPMG', 'PwC']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: false,
                compoundSupported: true,
                yieldBearingSupported: true,
                minimumValue: 25000,
                fractionalMinimum: 1000,
                restrictions: ['Licensing agreements required', 'Royalty distribution complexity']
            },
            riskFactors: {
                liquidityRisk: 80,
                volatilityRisk: 60,
                regulatoryRisk: 70,
                operationalRisk: 40,
                marketRisk: 65,
                overallRisk: 'HIGH',
                mitigationStrategies: ['Patent insurance', 'Diversification', 'Professional management']
            }
        });
    }
    initializeArtConfig() {
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.ART_COLLECTIBLES, {
            assetType: AssetRegistry_1.AssetType.ART_COLLECTIBLES,
            validationRules: [
                {
                    ruleId: 'ART001',
                    name: 'Provenance Documentation',
                    field: 'metadata.documents',
                    condition: 'contains:provenance',
                    errorMessage: 'Provenance documentation required',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'artist', fieldType: 'STRING', description: 'Artist name' },
                    { fieldName: 'title', fieldType: 'STRING', description: 'Artwork title' },
                    { fieldName: 'medium', fieldType: 'STRING', description: 'Artistic medium' },
                    { fieldName: 'dimensions', fieldType: 'STRING', description: 'Physical dimensions' },
                    { fieldName: 'year', fieldType: 'NUMBER', description: 'Year created' }
                ],
                optionalFields: [
                    { fieldName: 'exhibitions', fieldType: 'ARRAY', description: 'Exhibition history' },
                    { fieldName: 'publications', fieldType: 'ARRAY', description: 'Publication references' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'ART_GLOBAL_001',
                    jurisdiction: 'GLOBAL',
                    regulation: 'UNESCO Cultural Property Protection',
                    description: 'Cultural heritage protection compliance',
                    mandatory: true,
                    validationMethod: 'EXPERT_AUTHENTICATION',
                    documentation: ['Authentication certificate', 'Provenance chain']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'EXPERT_APPRAISAL',
                    name: 'Expert Appraisal',
                    description: 'Professional art expert valuation',
                    applicability: ['all'],
                    accuracy: 90,
                    cost: 3000,
                    timeRequired: 8,
                    providers: ['Sothebys', 'Christies', 'Phillips']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: false,
                compoundSupported: true,
                yieldBearingSupported: false,
                minimumValue: 10000,
                fractionalMinimum: 500,
                restrictions: ['Storage and insurance requirements', 'Authentication mandatory']
            },
            riskFactors: {
                liquidityRisk: 75,
                volatilityRisk: 85,
                regulatoryRisk: 60,
                operationalRisk: 70,
                marketRisk: 80,
                overallRisk: 'HIGH',
                mitigationStrategies: ['Authentication', 'Insurance', 'Professional storage']
            }
        });
    }
    initializeInfrastructureConfig() {
        this.assetClassConfigs.set(AssetRegistry_1.AssetType.INFRASTRUCTURE, {
            assetType: AssetRegistry_1.AssetType.INFRASTRUCTURE,
            validationRules: [
                {
                    ruleId: 'INF001',
                    name: 'Engineering Assessment',
                    field: 'metadata.certifications',
                    condition: 'contains:engineering_report',
                    errorMessage: 'Professional engineering assessment required',
                    severity: 'ERROR',
                    mandatory: true
                }
            ],
            metadataSchema: {
                requiredFields: [
                    { fieldName: 'infrastructureType', fieldType: 'STRING', description: 'Type of infrastructure' },
                    { fieldName: 'capacity', fieldType: 'NUMBER', description: 'Operational capacity' },
                    { fieldName: 'operationalStatus', fieldType: 'STRING', description: 'Current operational status' },
                    { fieldName: 'constructionDate', fieldType: 'DATE', description: 'Date of construction completion' }
                ],
                optionalFields: [
                    { fieldName: 'maintenanceHistory', fieldType: 'ARRAY', description: 'Historical maintenance records' }
                ],
                customFields: [],
                validationRules: {}
            },
            complianceRequirements: [
                {
                    requirementId: 'INF_US_001',
                    jurisdiction: 'US',
                    regulation: 'Federal Infrastructure Standards',
                    description: 'Federal infrastructure compliance',
                    mandatory: true,
                    validationMethod: 'ENGINEERING_REVIEW',
                    documentation: ['Engineering report', 'Safety certificates', 'Environmental clearance']
                }
            ],
            valuationMethods: [
                {
                    methodId: 'DCF_INFRASTRUCTURE',
                    name: 'Discounted Cash Flow',
                    description: 'DCF valuation for infrastructure assets',
                    applicability: ['revenue-generating'],
                    accuracy: 87,
                    cost: 10000,
                    timeRequired: 40,
                    providers: ['McKinsey', 'BCG', 'EY Infrastructure']
                }
            ],
            tokenizationSupport: {
                fractionalSupported: true,
                digitalTwinSupported: true,
                compoundSupported: true,
                yieldBearingSupported: true,
                minimumValue: 1000000,
                fractionalMinimum: 10000,
                restrictions: ['Institutional investors only', 'Regulatory approval required']
            },
            riskFactors: {
                liquidityRisk: 85,
                volatilityRisk: 35,
                regulatoryRisk: 75,
                operationalRisk: 60,
                marketRisk: 45,
                overallRisk: 'HIGH',
                mitigationStrategies: ['Government backing', 'Long-term contracts', 'Diversification']
            }
        });
    }
    async validateAssetForClass(asset) {
        const config = this.assetClassConfigs.get(asset.type);
        if (!config) {
            return {
                valid: false,
                errors: ['Unsupported asset class'],
                warnings: [],
                score: 0
            };
        }
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            score: 100
        };
        // Validate against rules
        for (const rule of config.validationRules) {
            const ruleResult = this.evaluateValidationRule(asset, rule);
            if (!ruleResult.passed) {
                if (rule.severity === 'ERROR') {
                    result.errors.push(rule.errorMessage);
                    result.valid = false;
                    result.score -= 20;
                }
                else if (rule.severity === 'WARNING') {
                    result.warnings.push(rule.errorMessage);
                    result.score -= 5;
                }
            }
        }
        // Validate metadata schema
        const schemaResult = this.validateMetadataSchema(asset, config.metadataSchema);
        result.errors.push(...schemaResult.errors);
        result.warnings.push(...schemaResult.warnings);
        result.score = Math.max(0, result.score - schemaResult.penalty);
        if (result.errors.length > 0) {
            result.valid = false;
        }
        return result;
    }
    evaluateValidationRule(asset, rule) {
        try {
            const fieldValue = this.getFieldValue(asset, rule.field);
            switch (rule.condition) {
                case 'required':
                    return { passed: fieldValue !== undefined && fieldValue !== null && fieldValue !== '' };
                case rule.condition.match(/^min:(\d+)$/)?.[0]:
                    const minValue = parseInt(rule.condition.split(':')[1]);
                    return { passed: Number(fieldValue) >= minValue };
                case rule.condition.match(/^contains:(.+)$/)?.[0]:
                    const requiredValues = rule.condition.split(':')[1].split(',');
                    const arrayValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
                    return { passed: requiredValues.some(val => arrayValue.includes(val)) };
                default:
                    return { passed: true, details: 'Rule condition not implemented' };
            }
        }
        catch (error) {
            return { passed: false, details: `Validation error: ${error.message}` };
        }
    }
    getFieldValue(asset, fieldPath) {
        const path = fieldPath.split('.');
        let value = asset;
        for (const key of path) {
            value = value?.[key];
        }
        return value;
    }
    validateMetadataSchema(asset, schema) {
        const result = { errors: [], warnings: [], penalty: 0 };
        // Check required fields
        for (const field of schema.requiredFields) {
            const value = asset.metadata.specifications[field.fieldName];
            if (value === undefined || value === null) {
                result.errors.push(`Required field missing: ${field.fieldName}`);
                result.penalty += 15;
            }
            else if (!this.validateFieldType(value, field.fieldType)) {
                result.errors.push(`Invalid type for field ${field.fieldName}: expected ${field.fieldType}`);
                result.penalty += 10;
            }
        }
        return result;
    }
    validateFieldType(value, expectedType) {
        switch (expectedType) {
            case 'STRING': return typeof value === 'string';
            case 'NUMBER': return typeof value === 'number';
            case 'DATE': return value instanceof Date || !isNaN(Date.parse(value));
            case 'BOOLEAN': return typeof value === 'boolean';
            case 'ARRAY': return Array.isArray(value);
            case 'OBJECT': return typeof value === 'object' && value !== null;
            default: return true;
        }
    }
    async getAssetClassConfiguration(assetType) {
        return this.assetClassConfigs.get(assetType) || null;
    }
    async getSupportedAssetClasses() {
        return Array.from(this.assetClassConfigs.keys());
    }
    async generateClassMetrics(assetType) {
        const assets = await this.assetRegistry.getAssetsByType(assetType);
        const metrics = {
            assetType,
            totalAssets: assets.length,
            totalValue: assets.reduce((sum, a) => sum + a.valuation.currentValue, 0),
            averageValue: 0,
            verificationRate: 0,
            tokenizationRate: 0,
            performanceMetrics: {
                averageProcessingTime: 0,
                successRate: 0,
                errorRate: 0,
                throughput: 0,
                lastUpdated: new Date()
            },
            riskMetrics: {
                defaultRate: 0,
                fraudAttempts: 0,
                complianceViolations: 0,
                riskScore: 0,
                lastAssessment: new Date()
            }
        };
        if (assets.length > 0) {
            metrics.averageValue = metrics.totalValue / assets.length;
            const verifiedAssets = assets.filter(a => a.verification.status === 'VERIFIED');
            metrics.verificationRate = (verifiedAssets.length / assets.length) * 100;
            const tokenizedAssets = assets.filter(a => a.tokenization !== undefined);
            metrics.tokenizationRate = (tokenizedAssets.length / assets.length) * 100;
        }
        this.assetClassMetrics.set(assetType, metrics);
        return metrics;
    }
    async getRecommendedTokenizationModel(asset) {
        const config = this.assetClassConfigs.get(asset.type);
        if (!config) {
            return {
                recommended: [],
                supported: [],
                restrictions: ['Unsupported asset class'],
                reasoning: 'Asset class not configured'
            };
        }
        const supported = [];
        const recommended = [];
        if (config.tokenizationSupport.fractionalSupported) {
            supported.push('FRACTIONAL');
            if (asset.valuation.currentValue >= config.tokenizationSupport.minimumValue) {
                recommended.push('FRACTIONAL');
            }
        }
        if (config.tokenizationSupport.digitalTwinSupported) {
            supported.push('DIGITAL_TWIN');
            // Recommend digital twin for assets with IoT potential
            if (['REAL_ESTATE', 'INFRASTRUCTURE', 'COMMODITIES'].includes(asset.type)) {
                recommended.push('DIGITAL_TWIN');
            }
        }
        if (config.tokenizationSupport.compoundSupported) {
            supported.push('COMPOUND');
        }
        if (config.tokenizationSupport.yieldBearingSupported) {
            supported.push('YIELD_BEARING');
            // Recommend yield-bearing for income-generating assets
            if (['REAL_ESTATE', 'INFRASTRUCTURE', 'INTELLECTUAL_PROPERTY'].includes(asset.type)) {
                recommended.push('YIELD_BEARING');
            }
        }
        return {
            recommended,
            supported,
            restrictions: config.tokenizationSupport.restrictions,
            reasoning: this.generateTokenizationReasoning(asset, config, recommended)
        };
    }
    generateTokenizationReasoning(asset, config, recommended) {
        let reasoning = `Based on ${asset.type} asset class analysis: `;
        if (recommended.includes('FRACTIONAL')) {
            reasoning += 'High liquidity potential makes fractional tokenization suitable. ';
        }
        if (recommended.includes('DIGITAL_TWIN')) {
            reasoning += 'Physical asset with monitoring potential supports digital twin integration. ';
        }
        if (recommended.includes('YIELD_BEARING')) {
            reasoning += 'Income-generating asset suitable for yield distribution model. ';
        }
        if (config.riskFactors.overallRisk === 'HIGH') {
            reasoning += 'High-risk asset class requires additional due diligence and investor protection. ';
        }
        return reasoning.trim();
    }
    async getAssetClassReport() {
        const allMetrics = [];
        // Generate metrics for all supported asset classes
        for (const assetType of this.assetClassConfigs.keys()) {
            const metrics = await this.generateClassMetrics(assetType);
            allMetrics.push(metrics);
        }
        const summary = {
            totalAssetClasses: this.assetClassConfigs.size,
            totalAssets: allMetrics.reduce((sum, m) => sum + m.totalAssets, 0),
            totalValue: allMetrics.reduce((sum, m) => sum + m.totalValue, 0),
            averageVerificationRate: allMetrics.reduce((sum, m) => sum + m.verificationRate, 0) / allMetrics.length,
            lastUpdated: new Date()
        };
        return {
            summary,
            metrics: allMetrics,
            recommendations: this.generatePortfolioRecommendations(allMetrics),
            riskAssessment: this.assessOverallRisk(allMetrics)
        };
    }
    generatePortfolioRecommendations(metrics) {
        const recommendations = [];
        const highPerformingClasses = metrics.filter(m => m.verificationRate > 90);
        if (highPerformingClasses.length > 0) {
            recommendations.push(`Focus on high-performing asset classes: ${highPerformingClasses.map(c => c.assetType).join(', ')}`);
        }
        const lowTokenizationClasses = metrics.filter(m => m.tokenizationRate < 30);
        if (lowTokenizationClasses.length > 0) {
            recommendations.push(`Increase tokenization efforts for: ${lowTokenizationClasses.map(c => c.assetType).join(', ')}`);
        }
        return recommendations;
    }
    assessOverallRisk(metrics) {
        const totalValue = metrics.reduce((sum, m) => sum + m.totalValue, 0);
        let weightedRiskScore = 0;
        for (const metric of metrics) {
            const config = this.assetClassConfigs.get(metric.assetType);
            if (config && totalValue > 0) {
                const weight = metric.totalValue / totalValue;
                const riskScore = this.calculateRiskScore(config.riskFactors);
                weightedRiskScore += riskScore * weight;
            }
        }
        return {
            overallRiskScore: weightedRiskScore,
            riskLevel: weightedRiskScore > 70 ? 'HIGH' : weightedRiskScore > 40 ? 'MEDIUM' : 'LOW',
            diversificationScore: this.calculateDiversificationScore(metrics),
            recommendations: this.generateRiskMitigationRecommendations(weightedRiskScore)
        };
    }
    calculateRiskScore(riskFactors) {
        return (riskFactors.liquidityRisk + riskFactors.volatilityRisk + riskFactors.regulatoryRisk +
            riskFactors.operationalRisk + riskFactors.marketRisk) / 5;
    }
    calculateDiversificationScore(metrics) {
        const totalValue = metrics.reduce((sum, m) => sum + m.totalValue, 0);
        if (totalValue === 0)
            return 0;
        // Calculate concentration using Herfindahl-Hirschman Index
        const hhi = metrics.reduce((sum, m) => {
            const weight = m.totalValue / totalValue;
            return sum + (weight * weight);
        }, 0);
        // Convert to diversification score (inverse of concentration)
        return Math.max(0, (1 - hhi) * 100);
    }
    generateRiskMitigationRecommendations(riskScore) {
        const recommendations = [];
        if (riskScore > 70) {
            recommendations.push('Implement enhanced due diligence for high-risk assets');
            recommendations.push('Consider insurance coverage for major positions');
            recommendations.push('Increase diversification across asset classes');
        }
        else if (riskScore > 40) {
            recommendations.push('Monitor risk metrics closely');
            recommendations.push('Consider portfolio rebalancing');
        }
        else {
            recommendations.push('Maintain current risk management practices');
        }
        return recommendations;
    }
}
exports.MultiAssetClassManager = MultiAssetClassManager;
//# sourceMappingURL=MultiAssetClassManager.js.map