import { RicardianContract } from './SmartContractPlatform';
export interface VerificationResult {
    contractId: string;
    verified: boolean;
    proofs: VerificationProof[];
    errors: VerificationError[];
    score: number;
    timestamp: Date;
}
export interface VerificationProof {
    id: string;
    type: 'MATHEMATICAL' | 'LOGICAL' | 'TEMPORAL' | 'SECURITY';
    description: string;
    proof: string;
    verified: boolean;
}
export interface VerificationError {
    id: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    location: string;
    suggestion: string;
}
export declare class FormalVerification {
    private logger;
    private verificationResults;
    constructor();
    verifyContract(contract: RicardianContract): Promise<VerificationResult>;
    private verifyMathematical;
    private verifyLogical;
    private verifyTemporal;
    private verifySecurity;
    private detectErrors;
    private calculateVerificationScore;
    private findConflictingTerms;
    private checkTemporalConflicts;
    private checkCodeVulnerabilities;
    getVerificationResult(contractId: string): VerificationResult | undefined;
    getAllVerificationResults(): VerificationResult[];
    batchVerify(contractIds: string[]): Promise<Map<string, VerificationResult>>;
}
//# sourceMappingURL=FormalVerification.d.ts.map