"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FractionalTokenizer = void 0;
const events_1 = require("events");
class FractionalTokenizer extends events_1.EventEmitter {
    constructor(cryptoManager, consensus) {
        super();
        this.tokens = new Map();
        this.tokensByAsset = new Map();
        this.yieldDistributions = new Map();
        this.cryptoManager = cryptoManager;
        this.consensus = consensus;
    }
    async tokenizeAsset(asset, request) {
        // Validate asset is verified and valued
        if (asset.verification.status !== 'VERIFIED') {
            throw new Error('Asset must be verified before tokenization');
        }
        if (asset.valuation.currentValue <= 0) {
            throw new Error('Asset must have valid valuation before tokenization');
        }
        // Check if asset is already tokenized
        if (this.tokensByAsset.has(asset.id)) {
            throw new Error('Asset is already tokenized');
        }
        const tokenId = this.generateTokenId(asset);
        const shareValue = asset.valuation.currentValue / request.totalShares;
        const token = {
            tokenId,
            assetId: asset.id,
            totalSupply: request.totalShares,
            fractionalShares: request.totalShares,
            shareValue,
            currency: asset.valuation.currency,
            holders: new Map(),
            transferHistory: [],
            created: new Date()
        };
        // Create tokenization record for asset
        const tokenizationRecord = {
            tokenId,
            tokenStandard: 'AV10-RWA-FRACTIONAL',
            totalSupply: request.totalShares,
            fractionalParts: request.totalShares,
            tokenizationType: 'FRACTIONAL',
            smartContractAddress: await this.deploySmartContract(token),
            blockchain: 'AURIGRAPH-AV10-18',
            created: new Date()
        };
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'ASSET_TOKENIZATION',
            data: { assetId: asset.id, tokenization: tokenizationRecord },
            timestamp: Date.now()
        });
        this.tokens.set(tokenId, token);
        this.tokensByAsset.set(asset.id, tokenId);
        this.yieldDistributions.set(tokenId, []);
        this.emit('assetTokenized', { tokenId, assetId: asset.id, totalShares: request.totalShares });
        return tokenId;
    }
    async purchaseShares(tokenId, buyerId, shareCount, totalPayment) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }
        // Check available shares
        const totalHoldings = Array.from(token.holders.values()).reduce((sum, shares) => sum + shares, 0);
        const availableShares = token.totalSupply - totalHoldings;
        if (shareCount > availableShares) {
            throw new Error(`Insufficient shares available. Requested: ${shareCount}, Available: ${availableShares}`);
        }
        // Validate payment amount
        const expectedPayment = shareCount * token.shareValue;
        if (Math.abs(totalPayment - expectedPayment) > expectedPayment * 0.01) { // 1% tolerance
            throw new Error(`Payment mismatch. Expected: ${expectedPayment}, Received: ${totalPayment}`);
        }
        // Update holdings
        const currentHoldings = token.holders.get(buyerId) || 0;
        token.holders.set(buyerId, currentHoldings + shareCount);
        // Record transfer
        const transferId = this.generateTransferId();
        const transfer = {
            id: transferId,
            from: 'TREASURY',
            to: buyerId,
            amount: shareCount,
            price: token.shareValue,
            timestamp: new Date(),
            txHash: await this.generateTransactionHash(transferId)
        };
        token.transferHistory.push(transfer);
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'FRACTIONAL_TOKEN_PURCHASE',
            data: { tokenId, buyerId, shareCount, payment: totalPayment },
            timestamp: Date.now()
        });
        this.emit('sharesPurchased', { tokenId, buyerId, shareCount, totalPayment });
        return transferId;
    }
    async transferShares(tokenId, fromId, toId, shareCount) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }
        const fromHoldings = token.holders.get(fromId) || 0;
        if (fromHoldings < shareCount) {
            throw new Error(`Insufficient shares. Available: ${fromHoldings}, Requested: ${shareCount}`);
        }
        // Update holdings
        token.holders.set(fromId, fromHoldings - shareCount);
        const toHoldings = token.holders.get(toId) || 0;
        token.holders.set(toId, toHoldings + shareCount);
        // Record transfer
        const transferId = this.generateTransferId();
        const transfer = {
            id: transferId,
            from: fromId,
            to: toId,
            amount: shareCount,
            price: token.shareValue,
            timestamp: new Date(),
            txHash: await this.generateTransactionHash(transferId)
        };
        token.transferHistory.push(transfer);
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'FRACTIONAL_TOKEN_TRANSFER',
            data: { tokenId, fromId, toId, shareCount },
            timestamp: Date.now()
        });
        this.emit('sharesTransferred', { tokenId, fromId, toId, shareCount });
        return transferId;
    }
    async distributeYield(tokenId, totalYield, yieldType) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }
        const distribution = {
            tokenId,
            totalYield,
            yieldType: yieldType,
            distributionDate: new Date(),
            recipients: new Map(),
            processed: false
        };
        // Calculate yield per share
        const yieldPerShare = totalYield / token.totalSupply;
        // Distribute to all holders proportionally
        for (const [holderId, shareCount] of token.holders.entries()) {
            const holderYield = shareCount * yieldPerShare;
            distribution.recipients.set(holderId, holderYield);
        }
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'YIELD_DISTRIBUTION',
            data: { tokenId, totalYield, recipients: Array.from(distribution.recipients.entries()) },
            timestamp: Date.now()
        });
        distribution.processed = true;
        if (!this.yieldDistributions.has(tokenId)) {
            this.yieldDistributions.set(tokenId, []);
        }
        this.yieldDistributions.get(tokenId).push(distribution);
        this.emit('yieldDistributed', { tokenId, totalYield, recipientCount: distribution.recipients.size });
        return `YIELD-${Date.now()}`;
    }
    async getTokenDetails(tokenId) {
        return this.tokens.get(tokenId) || null;
    }
    async getTokensByAsset(assetId) {
        const tokenId = this.tokensByAsset.get(assetId);
        if (!tokenId)
            return [];
        const token = this.tokens.get(tokenId);
        return token ? [token] : [];
    }
    async getHolderBalance(tokenId, holderId) {
        const token = this.tokens.get(tokenId);
        if (!token)
            return 0;
        return token.holders.get(holderId) || 0;
    }
    async getTokenizationStats() {
        const stats = {
            totalTokens: this.tokens.size,
            totalValue: 0,
            totalHolders: new Set(),
            averageHoldingSize: 0,
            yieldDistributed: 0
        };
        let totalHoldings = 0;
        let holdingCount = 0;
        this.tokens.forEach(token => {
            stats.totalValue += token.totalSupply * token.shareValue;
            token.holders.forEach((shares, holderId) => {
                stats.totalHolders.add(holderId);
                totalHoldings += shares;
                holdingCount++;
            });
        });
        this.yieldDistributions.forEach(distributions => {
            distributions.forEach(dist => {
                if (dist.processed) {
                    stats.yieldDistributed += dist.totalYield;
                }
            });
        });
        stats.averageHoldingSize = holdingCount > 0 ? totalHoldings / holdingCount : 0;
        return {
            ...stats,
            totalHolders: stats.totalHolders.size
        };
    }
    generateTokenId(asset) {
        const typePrefix = asset.type.substring(0, 3);
        const timestamp = Date.now();
        const hash = this.cryptoManager.hashData(asset.id);
        return `FT-${typePrefix}-${timestamp}-${hash.substring(0, 8)}`;
    }
    async deploySmartContract(token) {
        // Simulate smart contract deployment
        const contractCode = this.generateContractCode(token);
        const hash = this.cryptoManager.hashData(contractCode);
        return `0xAV10${hash.substring(0, 32)}`;
    }
    generateContractCode(token) {
        return `
pragma solidity ^0.8.19;

contract FractionalAssetToken {
    string public name = "Fractional Asset Token ${token.assetId}";
    string public symbol = "FAT${token.assetId.substring(0, 6)}";
    uint256 public totalSupply = ${token.totalSupply};
    uint256 public shareValue = ${token.shareValue};
    
    mapping(address => uint256) public balances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event YieldDistribution(uint256 totalYield, uint256 timestamp);
}`;
    }
    async generateTransactionHash(transferId) {
        const data = `${transferId}-${Date.now()}`;
        return this.cryptoManager.hashData(data);
    }
    generateTransferId() {
        return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
}
exports.FractionalTokenizer = FractionalTokenizer;
