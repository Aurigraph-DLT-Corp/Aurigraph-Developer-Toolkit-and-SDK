import { EventEmitter } from 'events';
import { ConfigManager } from './ConfigManager';
import { PeerInfo } from '../node/types';
export declare class NetworkManager extends EventEmitter {
    private logger;
    private config;
    private peers;
    constructor(configManager: ConfigManager);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    getAverageLatency(): Promise<number>;
    getPeerCount(): Promise<number>;
    getPeers(): Promise<PeerInfo[]>;
    broadcastBlock(block: any): Promise<void>;
}
//# sourceMappingURL=NetworkManager.d.ts.map