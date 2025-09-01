import { EventEmitter } from 'events';
import { PhysicalAsset, TokenizationParameters, TokenizationResult } from './types';
export declare class TokenizationEngine extends EventEmitter {
    private logger;
    private assetRegistry;
    private complianceEngine;
    private contractEngine;
    private digitalTwinManager;
    constructor();
    initialize(): Promise<void>;
    tokenizeAsset(asset: PhysicalAsset, tokenizationParams: TokenizationParameters): Promise<TokenizationResult>;
    private registerAsset;
    private verifyAssetOwnership;
    private performDueDiligence;
    private generateTokenStructure;
    private deployTokenContracts;
    private mintTokens;
    private setupGovernance;
    private configureCompliance;
    private generateAssetId;
    private generateAssetSymbol;
    getTokenizedAsset(assetId: string): Promise<any>;
    updateAssetValue(assetId: string, newValue: bigint): Promise<void>;
}
//# sourceMappingURL=TokenizationEngine.d.ts.map