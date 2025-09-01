"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetRegistry = void 0;
const Logger_1 = require("../utils/Logger");
class AssetRegistry {
    logger;
    assets = new Map();
    constructor() {
        this.logger = new Logger_1.Logger('AssetRegistry');
    }
    async initialize() {
        this.logger.info('Initializing Asset Registry...');
    }
    async registerAsset(asset) {
        this.assets.set(asset.assetId, asset);
        this.logger.info(`Asset registered: ${asset.assetId}`);
    }
    async updateAsset(asset) {
        this.assets.set(asset.assetId, asset);
        this.logger.info(`Asset updated: ${asset.assetId}`);
    }
    async getAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        return asset;
    }
    async getTokensForAsset(assetId) {
        // Mock tokens for asset
        return [
            {
                tokenId: `${assetId}-PRIMARY`,
                tokenType: 'PRIMARY',
                symbol: 'ASSET',
                totalSupply: 1
            }
        ];
    }
}
exports.AssetRegistry = AssetRegistry;
//# sourceMappingURL=AssetRegistry.js.map