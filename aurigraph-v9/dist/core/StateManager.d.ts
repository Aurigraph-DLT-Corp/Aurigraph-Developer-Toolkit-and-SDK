import { ConfigManager } from './ConfigManager';
export declare class StateManager {
    private logger;
    constructor(configManager: ConfigManager);
    initialize(): Promise<void>;
    getHealth(): Promise<any>;
    getChainInfo(): Promise<any>;
    applyStateTransition(transition: any): Promise<void>;
    commitBlock(block: any): Promise<void>;
}
//# sourceMappingURL=StateManager.d.ts.map