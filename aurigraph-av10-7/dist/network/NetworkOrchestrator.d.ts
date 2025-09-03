import { EventEmitter } from 'events';
export declare class NetworkOrchestrator extends EventEmitter {
    private logger;
    private peers;
    private pendingTransactions;
    constructor();
    initialize(): Promise<void>;
    private setupP2PNetwork;
    private connectToBootstrapNodes;
    getPendingTransactions(limit: number): Promise<any[]>;
    submitTransaction(transaction: any): Promise<void>;
    broadcastBlock(block: any): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=NetworkOrchestrator.d.ts.map