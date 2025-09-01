import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
export declare class MonitoringService extends EventEmitter {
    private logger;
    private config;
    constructor(configManager: ConfigManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    recordTransaction(tx: any): void;
    recordBlock(block: any): void;
    recordConsensusEvent(event: any): void;
    recordError(error: Error): void;
    recordHealthCheck(health: any): void;
}
//# sourceMappingURL=MonitoringService.d.ts.map