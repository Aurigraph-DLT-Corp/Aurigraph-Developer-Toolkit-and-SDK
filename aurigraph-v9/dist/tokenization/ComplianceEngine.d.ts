import { RegisteredAsset } from './types';
export declare class ComplianceEngine {
    private logger;
    constructor();
    initialize(): Promise<void>;
    verifyOwnership(owner: string, documents: string[]): Promise<any>;
    performDueDiligence(asset: RegisteredAsset): Promise<any>;
    getConfiguration(asset: RegisteredAsset): Promise<any>;
    getRulesForJurisdiction(jurisdiction: string): Promise<any[]>;
}
//# sourceMappingURL=ComplianceEngine.d.ts.map