import { EventEmitter } from 'events';
import { Asset } from '../registry/AssetRegistry';
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
export declare class FractionalTokenizer extends EventEmitter {
    private tokens;
    private tokensByAsset;
    private yieldDistributions;
    private cryptoManager;
    private consensus;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    tokenizeAsset(asset: Asset, request: TokenizationRequest): Promise<string>;
    purchaseShares(tokenId: string, buyerId: string, shareCount: number, totalPayment: number): Promise<string>;
    transferShares(tokenId: string, fromId: string, toId: string, shareCount: number): Promise<string>;
    distributeYield(tokenId: string, totalYield: number, yieldType: string): Promise<string>;
    getTokenDetails(tokenId: string): Promise<FractionalToken | null>;
    getTokensByAsset(assetId: string): Promise<FractionalToken[]>;
    getHolderBalance(tokenId: string, holderId: string): Promise<number>;
    getTokenizationStats(): Promise<{
        totalTokens: number;
        totalValue: number;
        totalHolders: number;
        averageHoldingSize: number;
        yieldDistributed: number;
    }>;
    private generateTokenId;
    private deploySmartContract;
    private generateContractCode;
    private generateTransactionHash;
    private generateTransferId;
}
//# sourceMappingURL=FractionalTokenizer.d.ts.map