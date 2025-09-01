import { EventEmitter } from 'events';
export interface ChainConfig {
    chainId: string;
    name: string;
    type: 'EVM' | 'Substrate' | 'Cosmos' | 'Solana' | 'Near' | 'Algorand' | 'Bitcoin';
    rpcUrl: string;
    confirmations: number;
    gasLimit?: number;
}
export interface CrossChainTransaction {
    id: string;
    sourceChain: string;
    targetChain: string;
    asset: string;
    amount: string;
    sender: string;
    recipient: string;
    status: 'pending' | 'locked' | 'minted' | 'completed' | 'failed';
    proof?: any;
    timestamp: number;
}
export interface LiquidityPool {
    id: string;
    chains: string[];
    assets: Map<string, bigint>;
    totalValueLocked: bigint;
    apr: number;
}
export declare class CrossChainBridge extends EventEmitter {
    private logger;
    private chains;
    private pendingTransactions;
    private liquidityPools;
    private quantumCrypto;
    private zkProofSystem;
    private metrics;
    constructor();
    initialize(): Promise<void>;
    private initializeSupportedChains;
    private addChain;
    private setupLiquidityPools;
    private startBridgeValidators;
    private initializeChainListeners;
    bridgeAsset(sourceChain: string, targetChain: string, asset: string, amount: string, recipient: string, sender: string): Promise<CrossChainTransaction>;
    private lockAssets;
    private processBridgeTransaction;
    private waitForConfirmations;
    private mintAssets;
    private validatePendingTransactions;
    performAtomicSwap(chainA: string, chainB: string, assetA: string, assetB: string, amountA: string, amountB: string, partyA: string, partyB: string): Promise<any>;
    private deployHTLC;
    aggregateLiquidity(chains: string[]): Promise<any>;
    private generateTransactionId;
    private updateMetrics;
    getSupportedChains(): ChainConfig[];
    getLiquidityPools(): LiquidityPool[];
    getMetrics(): any;
    stop(): Promise<void>;
}
//# sourceMappingURL=CrossChainBridge.d.ts.map