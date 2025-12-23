/**
 * GAIP-Aurigraph DLT Integration Module
 *
 * This module integrates GAIP (Global AI Platform) with Aurigraph DLT to capture,
 * record, and audit all datapoints used in AI analyses. It provides immutable
 * blockchain-based tracking of AI decision-making processes, data sources,
 * and analytical outcomes.
 *
 * Key Features:
 * - Real-time datapoint capture from GAIP analyses
 * - Blockchain-based immutable audit trail
 * - Zero-knowledge proof support for sensitive data
 * - Quantum-secure encryption for data transmission
 * - Cross-chain verification capabilities
 */
import { EventEmitter } from 'events';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { ZKProofSystem } from '../zk/ZKProofSystem';
import { CollectiveIntelligenceNetwork } from '../ai/CollectiveIntelligenceNetwork';
import { CrossChainBridge } from '../crosschain/CrossChainBridge';
export interface GAIPDatapoint {
    id: string;
    timestamp: number;
    analysisId: string;
    agentId: string;
    dataType: 'INPUT' | 'PROCESSING' | 'OUTPUT' | 'INTERMEDIATE' | 'REFERENCE';
    category: string;
    source: {
        type: 'DATABASE' | 'API' | 'FILE' | 'STREAM' | 'COMPUTATION' | 'MODEL';
        identifier: string;
        version?: string;
        hash?: string;
    };
    value: any;
    metadata: {
        confidence?: number;
        accuracy?: number;
        processingTime?: number;
        transformations?: string[];
        dependencies?: string[];
        validations?: string[];
    };
    privacy: {
        level: 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL' | 'SECRET';
        zkProof?: boolean;
        encrypted?: boolean;
        redacted?: boolean;
    };
    blockchain: {
        transactionId?: string;
        blockNumber?: number;
        chainId?: string;
        confirmations?: number;
    };
}
export interface GAIPAnalysis {
    id: string;
    name: string;
    description: string;
    startTime: number;
    endTime?: number;
    status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    agents: {
        id: string;
        type: string;
        role: string;
        version: string;
    }[];
    datapoints: GAIPDatapoint[];
    results?: {
        primary: any;
        secondary: any[];
        confidence: number;
        validation: string;
    };
    audit: {
        hash: string;
        signature: string;
        verifications: number;
        attestations: string[];
    };
}
export interface IntegrationConfig {
    gaipEndpoint: string;
    gaipApiKey?: string;
    aurigraphNodeUrl: string;
    aurigraphChainId: string;
    captureMode: 'FULL' | 'SUMMARY' | 'CRITICAL' | 'CUSTOM';
    encryptionEnabled: boolean;
    zkProofsEnabled: boolean;
    crossChainVerification: boolean;
    retentionDays: number;
    batchSize: number;
    realTimeStreaming: boolean;
}
export declare class GAIPIntegrationModule extends EventEmitter {
    private logger;
    private auditManager;
    private cryptoManager;
    private zkProofSystem;
    private collectiveIntelligence;
    private crossChainBridge?;
    private config;
    private activeAnalyses;
    private datapointBuffer;
    private blockchainQueue;
    private isProcessing;
    private metricsCollector;
    constructor(config: IntegrationConfig, auditManager: AuditTrailManager, cryptoManager: QuantumCryptoManagerV2, zkProofSystem: ZKProofSystem, collectiveIntelligence: CollectiveIntelligenceNetwork, crossChainBridge?: CrossChainBridge);
    private initialize;
    /**
     * Start capturing datapoints for a new GAIP analysis
     */
    startAnalysisCapture(analysisId: string, name: string, description: string, agents: any[]): Promise<void>;
    /**
     * Capture a datapoint from GAIP analysis
     */
    captureDatapoint(datapoint: GAIPDatapoint): Promise<void>;
    /**
     * Complete an analysis and finalize blockchain recording
     */
    completeAnalysis(analysisId: string, results: any): Promise<string>;
    /**
     * Query captured datapoints from blockchain
     */
    queryDatapoints(filter: {
        analysisId?: string;
        agentId?: string;
        dataType?: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): Promise<GAIPDatapoint[]>;
    /**
     * Verify integrity of recorded datapoints
     */
    verifyDatapointIntegrity(datapointId: string): Promise<{
        valid: boolean;
        hash: string;
        blockNumber?: number;
        verifications: number;
    }>;
    /**
     * Generate comprehensive analysis report
     */
    generateAnalysisReport(analysisId: string): Promise<{
        summary: any;
        datapoints: GAIPDatapoint[];
        audit: any;
        verification: any;
    }>;
    private setupGAIPListeners;
    private initializeBlockchainPipeline;
    private setupRealTimeStreaming;
    private initializeMetrics;
    private validateDatapoint;
    private applyPrivacyControls;
    private processDatapointImmediate;
    private processBatch;
    private processBlockchainQueue;
    private recordDatapointOnBlockchain;
    private recordAnalysisEvent;
    private generateAuditHash;
    private computeDatapointHash;
    private generateAnalysisZKProof;
    private recordZKProof;
    private performCrossChainVerification;
    private createAuditEvent;
    private calculateProcessingTime;
    private calculateAverageConfidence;
    private updateMetrics;
    /**
     * Get current metrics
     */
    getMetrics(): Map<string, any>;
    /**
     * Export analysis data for external systems
     */
    exportAnalysisData(analysisId: string, format: 'JSON' | 'CSV' | 'BLOCKCHAIN'): Promise<string | Buffer>;
    private convertToCSV;
}
//# sourceMappingURL=GAIPIntegrationModule.d.ts.map