import { RegisteredAsset } from './types';
export declare class AssetRegistry {
    private logger;
    private assets;
    constructor();
    initialize(): Promise<void>;
    registerAsset(asset: RegisteredAsset): Promise<void>;
    updateAsset(asset: RegisteredAsset): Promise<void>;
    getAsset(assetId: string): Promise<RegisteredAsset>;
    getTokensForAsset(assetId: string): Promise<any[]>;
}
//# sourceMappingURL=AssetRegistry.d.ts.map