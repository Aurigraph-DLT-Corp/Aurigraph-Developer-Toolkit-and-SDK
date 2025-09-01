import { AssetCategory } from './types';
export declare class OracleConnector {
    private logger;
    constructor();
    initialize(): Promise<void>;
    getAvailableFeeds(category: AssetCategory): Promise<string[]>;
    subscribe(feed: string, callback: (data: any) => void): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=OracleConnector.d.ts.map