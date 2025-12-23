export interface ZKProof {
    proof: string;
    publicInputs: string[];
    verificationKey: string;
    proofType: 'SNARK' | 'STARK' | 'PLONK' | 'Bulletproof';
    timestamp: number;
}
export interface ZKCircuit {
    id: string;
    name: string;
    constraints: number;
    publicSignals: number;
    privateSignals: number;
}
export interface RecursiveProof {
    aggregatedProof: string;
    individualProofs: ZKProof[];
    verificationKey: string;
    depth: number;
}
export declare class ZKProofSystem {
    private logger;
    private circuits;
    private proofCache;
    private recursiveAggregation;
    private metrics;
    constructor();
    initialize(): Promise<void>;
    private initializeCircuits;
    private performTrustedSetup;
    private initializeAggregation;
    generateProof(transaction: any, proofType?: string): Promise<ZKProof>;
    private generateSNARK;
    private generateSTARK;
    private generatePLONK;
    private generateBulletproof;
    private generateWitness;
    verifyProof(proof: ZKProof): Promise<boolean>;
    private verifySNARK;
    private verifySTARK;
    private verifyPLONK;
    private verifyBulletproof;
    aggregateProofs(proofs: ZKProof[]): Promise<RecursiveProof>;
    verifyAggregatedProof(recursiveProof: RecursiveProof): Promise<boolean>;
    enableRecursiveAggregation(): void;
    generatePrivateSmartContractProof(contract: any, inputs: any, outputs: any): Promise<ZKProof>;
    generateSelectiveDisclosureProof(data: any, disclosedFields: string[]): Promise<ZKProof>;
    private getCacheKey;
    private updateMetrics;
    getMetrics(): any;
    benchmark(): Promise<any>;
}
//# sourceMappingURL=ZKProofSystem.d.ts.map