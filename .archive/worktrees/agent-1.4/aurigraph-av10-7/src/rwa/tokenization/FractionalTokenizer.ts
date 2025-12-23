import { EventEmitter } from 'events';
import { Asset, TokenizationRecord } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';

export interface FractionalToken {
  tokenId: string;
  assetId: string;
  totalSupply: number;
  fractionalShares: number;
  shareValue: number;
  currency: string;
  holders: Map<string, number>;
  transferHistory: TransferRecord[];
  created: Date;
}

export interface TransferRecord {
  id: string;
  from: string;
  to: string;
  amount: number;
  price: number;
  timestamp: Date;
  txHash: string;
}

export interface TokenizationRequest {
  assetId: string;
  totalShares: number;
  minInvestment: number;
  maxInvestment?: number;
  distributionMethod: 'AUCTION' | 'FIXED_PRICE' | 'DUTCH_AUCTION';
  vestingPeriod?: number;
  lockupPeriod?: number;
}

export interface YieldDistribution {
  tokenId: string;
  totalYield: number;
  yieldType: 'RENTAL' | 'DIVIDEND' | 'INTEREST' | 'CAPITAL_GAINS';
  distributionDate: Date;
  recipients: Map<string, number>;
  processed: boolean;
}

export class FractionalTokenizer extends EventEmitter {
  private tokens: Map<string, FractionalToken> = new Map();
  private tokensByAsset: Map<string, string> = new Map();
  private yieldDistributions: Map<string, YieldDistribution[]> = new Map();
  private cryptoManager: QuantumCryptoManagerV2;
  private consensus: HyperRAFTPlusPlusV2;

  constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2) {
    super();
    this.cryptoManager = cryptoManager;
    this.consensus = consensus;
  }

  async tokenizeAsset(asset: Asset, request: TokenizationRequest): Promise<string> {
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

    const tokenId = await this.generateTokenId(asset);
    const shareValue = asset.valuation.currentValue / request.totalShares;

    const token: FractionalToken = {
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
    const tokenizationRecord: TokenizationRecord = {
      tokenId,
      tokenStandard: 'AV11-RWA-FRACTIONAL',
      totalSupply: request.totalShares,
      fractionalParts: request.totalShares,
      tokenizationType: 'FRACTIONAL',
      smartContractAddress: await this.deploySmartContract(token),
      blockchain: 'AURIGRAPH-AV11-18',
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

  async purchaseShares(tokenId: string, buyerId: string, shareCount: number, totalPayment: number): Promise<string> {
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
    const transfer: TransferRecord = {
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

  async transferShares(tokenId: string, fromId: string, toId: string, shareCount: number): Promise<string> {
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
    const transfer: TransferRecord = {
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

  async distributeYield(tokenId: string, totalYield: number, yieldType: string): Promise<string> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const distribution: YieldDistribution = {
      tokenId,
      totalYield,
      yieldType: yieldType as any,
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
    this.yieldDistributions.get(tokenId)!.push(distribution);

    this.emit('yieldDistributed', { tokenId, totalYield, recipientCount: distribution.recipients.size });
    
    return `YIELD-${Date.now()}`;
  }

  async getTokenDetails(tokenId: string): Promise<FractionalToken | null> {
    return this.tokens.get(tokenId) || null;
  }

  async getTokensByAsset(assetId: string): Promise<FractionalToken[]> {
    const tokenId = this.tokensByAsset.get(assetId);
    if (!tokenId) return [];
    
    const token = this.tokens.get(tokenId);
    return token ? [token] : [];
  }

  async getHolderBalance(tokenId: string, holderId: string): Promise<number> {
    const token = this.tokens.get(tokenId);
    if (!token) return 0;
    
    return token.holders.get(holderId) || 0;
  }

  async getTokenizationStats(): Promise<{
    totalTokens: number;
    totalValue: number;
    totalHolders: number;
    averageHoldingSize: number;
    yieldDistributed: number;
  }> {
    const stats = {
      totalTokens: this.tokens.size,
      totalValue: 0,
      totalHolders: new Set<string>(),
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

  private async generateTokenId(asset: Asset): Promise<string> {
    const typePrefix = asset.type.substring(0, 3);
    const timestamp = Date.now();
    const hash = await this.cryptoManager.hashData(asset.id);
    return `FT-${typePrefix}-${timestamp}-${hash.substring(0, 8)}`;
  }

  private async deploySmartContract(token: FractionalToken): Promise<string> {
    // Simulate smart contract deployment
    const contractCode = this.generateContractCode(token);
    const hash = await this.cryptoManager.hashData(contractCode);
    return `0xAV11${hash.substring(0, 32)}`;
  }

  private generateContractCode(token: FractionalToken): string {
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

  private async generateTransactionHash(transferId: string): Promise<string> {
    const data = `${transferId}-${Date.now()}`;
    return this.cryptoManager.hashData(data);
  }

  private generateTransferId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}