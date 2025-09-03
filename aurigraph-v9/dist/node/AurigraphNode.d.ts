import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { NodeStatus } from './types';
export declare class AurigraphNode extends EventEmitter {
    private logger;
    private configManager;
    private networkManager;
    private monitoringService;
    private nodeImplementation?;
    private status;
    constructor(configManager: ConfigManager, networkManager: NetworkManager, monitoringService: MonitoringService);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupEventHandlers;
    private startHealthCheck;
    getStatus(): NodeStatus;
    getNodeInfo(): Promise<any>;
}
//# sourceMappingURL=AurigraphNode.d.ts.map