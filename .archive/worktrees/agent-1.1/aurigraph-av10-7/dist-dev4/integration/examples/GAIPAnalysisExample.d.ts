/**
 * GAIP Analysis Example
 *
 * Demonstrates how GAIP analyses are captured and recorded on Aurigraph blockchain.
 * This example simulates a multi-agent AI analysis with various datapoints.
 */
export declare class GAIPAnalysisExample {
    private logger;
    private apiUrl;
    private apiKey;
    private agents;
    private dataSources;
    constructor(apiUrl?: string, apiKey?: string);
    /**
     * Run a complete GAIP analysis example
     */
    runCompleteAnalysis(): Promise<void>;
    /**
     * Start a new analysis
     */
    private startAnalysis;
    /**
     * Collect input data from various sources
     */
    private collectInputData;
    /**
     * Process data through various agents
     */
    private processWithAgents;
    /**
     * Generate predictions
     */
    private generatePredictions;
    /**
     * Make decisions based on analysis
     */
    private makeDecisions;
    /**
     * Validate results
     */
    private validateResults;
    /**
     * Complete the analysis
     */
    private completeAnalysis;
    /**
     * Verify analysis on blockchain
     */
    private verifyOnBlockchain;
    /**
     * Generate and display final report
     */
    private generateReport;
    /**
     * Helper: Capture a datapoint
     */
    private captureDatapoint;
    /**
     * Helper: Generate hash
     */
    private generateHash;
    /**
     * Run a simple test
     */
    runSimpleTest(): Promise<void>;
}
//# sourceMappingURL=GAIPAnalysisExample.d.ts.map