export declare class SmartContractEngine {
    private logger;
    constructor();
    initialize(): Promise<void>;
    deployTokenContract(token: any): Promise<any>;
    deployCompoundTokenContract(token: any): Promise<any>;
    deployGovernanceContract(params: any): Promise<any>;
    linkGovernance(tokenAddress: string, governanceAddress: string): Promise<void>;
    setComplianceRules(tokenAddress: string, rules: any[]): Promise<void>;
}
//# sourceMappingURL=SmartContractEngine.d.ts.map