"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetRegistry = exports.AssetType = void 0;
const events_1 = require("events");
var AssetType;
(function (AssetType) {
    AssetType["REAL_ESTATE"] = "REAL_ESTATE";
    AssetType["CARBON_CREDITS"] = "CARBON_CREDITS";
    AssetType["COMMODITIES"] = "COMMODITIES";
    AssetType["INTELLECTUAL_PROPERTY"] = "IP";
    AssetType["ART_COLLECTIBLES"] = "ART";
    AssetType["INFRASTRUCTURE"] = "INFRASTRUCTURE";
})(AssetType || (exports.AssetType = AssetType = {}));
class AssetRegistry extends events_1.EventEmitter {
    constructor(cryptoManager, consensus) {
        super();
        this.assets = new Map();
        this.assetsByType = new Map();
        this.assetsByOwner = new Map();
        this.verificationQueue = [];
        this.cryptoManager = cryptoManager;
        this.consensus = consensus;
        this.initializeAssetTypes();
    }
    initializeAssetTypes() {
        Object.values(AssetType).forEach(type => {
            this.assetsByType.set(type, new Set());
        });
    }
    async registerAsset(assetData, ownerId) {
        const assetId = this.generateAssetId(assetData.type, assetData.metadata);
        const asset = {
            id: assetId,
            type: assetData.type,
            metadata: assetData.metadata,
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
        this.assetsByType.get(asset.type).add(assetId);
        if (!this.assetsByOwner.has(ownerId)) {
            this.assetsByOwner.set(ownerId, new Set());
        }
        this.assetsByOwner.get(ownerId).add(assetId);
        this.verificationQueue.push(assetId);
        this.emit('assetRegistered', { assetId, asset });
        return assetId;
    }
    async getAsset(assetId) {
        return this.assets.get(assetId) || null;
    }
    async getAssetsByType(type) {
        const assetIds = this.assetsByType.get(type) || new Set();
        return Array.from(assetIds).map(id => this.assets.get(id)).filter(Boolean);
    }
    async getAssetsByOwner(ownerId) {
        const assetIds = this.assetsByOwner.get(ownerId) || new Set();
        return Array.from(assetIds).map(id => this.assets.get(id)).filter(Boolean);
    }
    async updateAssetVerification(assetId, verification) {
        const asset = this.assets.get(assetId);
        if (!asset)
            return false;
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
    async updateAssetValuation(assetId, valuation) {
        const asset = this.assets.get(assetId);
        if (!asset)
            return false;
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
    async transferOwnership(assetId, newOwnerId, percentage = 100) {
        const asset = this.assets.get(assetId);
        if (!asset)
            return false;
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
        this.assetsByOwner.get(newOwnerId).add(assetId);
        // Record transfer in consensus
        await this.consensus.submitTransaction({
            type: 'ASSET_OWNERSHIP_TRANSFER',
            data: { assetId, from: currentOwnerId, to: newOwnerId, percentage },
            timestamp: Date.now()
        });
        this.emit('ownershipTransferred', { assetId, from: currentOwnerId, to: newOwnerId });
        return true;
    }
    async searchAssets(query) {
        let results = Array.from(this.assets.values());
        if (query.type) {
            const typeAssets = this.assetsByType.get(query.type) || new Set();
            results = results.filter(asset => typeAssets.has(asset.id));
        }
        if (query.owner) {
            const ownerAssets = this.assetsByOwner.get(query.owner) || new Set();
            results = results.filter(asset => ownerAssets.has(asset.id));
        }
        if (query.minValue !== undefined) {
            results = results.filter(asset => asset.valuation.currentValue >= query.minValue);
        }
        if (query.maxValue !== undefined) {
            results = results.filter(asset => asset.valuation.currentValue <= query.maxValue);
        }
        if (query.verificationStatus) {
            results = results.filter(asset => asset.verification.status === query.verificationStatus);
        }
        if (query.location) {
            results = results.filter(asset => asset.metadata.location?.toLowerCase().includes(query.location.toLowerCase()));
        }
        if (query.keywords && query.keywords.length > 0) {
            results = results.filter(asset => {
                const searchText = `${asset.metadata.name} ${asset.metadata.description}`.toLowerCase();
                return query.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            });
        }
        return results;
    }
    async getRegistryStats() {
        const stats = {
            totalAssets: this.assets.size,
            assetsByType: {},
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
    generateAssetId(type, metadata) {
        const timestamp = Date.now();
        const typePrefix = type.substring(0, 3).toUpperCase();
        const hash = this.cryptoManager.hashData(JSON.stringify(metadata));
        return `${typePrefix}-${timestamp}-${hash.substring(0, 8)}`;
    }
    async encryptAssetData(asset) {
        const sensitiveData = {
            ownership: asset.ownership,
            verification: asset.verification,
            valuation: asset.valuation
        };
        return await this.cryptoManager.encryptData(JSON.stringify(sensitiveData));
    }
    async startVerificationProcess(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset)
            return false;
        asset.verification.status = 'IN_PROGRESS';
        asset.updated = new Date();
        this.emit('verificationStarted', { assetId });
        return true;
    }
    async addVerificationReport(assetId, report) {
        const asset = this.assets.get(assetId);
        if (!asset)
            return false;
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
    getVerificationQueue() {
        return [...this.verificationQueue];
    }
    async processVerificationQueue() {
        while (this.verificationQueue.length > 0) {
            const assetId = this.verificationQueue.shift();
            await this.startVerificationProcess(assetId);
        }
    }
}
exports.AssetRegistry = AssetRegistry;
