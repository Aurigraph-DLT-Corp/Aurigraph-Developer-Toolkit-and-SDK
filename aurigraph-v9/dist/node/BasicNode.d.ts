import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { NodeHealth, NodeInfo } from './types';
export declare class BasicNode extends EventEmitter {
    private logger;
    constructor(configManager: ConfigManager, networkManager: NetworkManager, monitoringService: MonitoringService);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getHealth(): Promise<NodeHealth>;
    getNodeInfo(): Promise<NodeInfo>;
}
//# sourceMappingURL=BasicNode.d.ts.map