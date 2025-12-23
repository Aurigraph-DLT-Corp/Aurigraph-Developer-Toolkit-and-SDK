/**
 * AV10-21 Asset Registration Service
 * Comprehensive Asset Registration and Verification System
 *
 * Features:
 * - Enterprise-grade asset registration infrastructure
 * - High-availability architecture with load balancing
 * - 10,000+ concurrent registration support
 * - 99.9% system availability with <24hr processing
 * - Integration with government registries
 * - Automated verification workflows
 * - Real-time processing and monitoring
 */
import { EventEmitter } from 'events';
import { Asset } from './AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface RegistrationRequest {
    id: string;
    submitterId: string;
    assetData: Partial<Asset>;
    documents: UploadedDocument[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    processingType: 'STANDARD' | 'EXPRESS' | 'INSTANT';
    verificationRequirements: VerificationRequirement[];
    jurisdiction: string;
    complianceLevel: 'BASIC' | 'ENHANCED' | 'PREMIUM';
    expectedValue: number;
    deadline?: Date;
    customRequirements?: Record<string, any>;
    created: Date;
    updated: Date;
}
export interface UploadedDocument {
    id: string;
    filename: string;
    type: string;
    size: number;
    hash: string;
    encryptedPath: string;
    mimetype: string;
    uploadedAt: Date;
    verified: boolean;
    digitalSignature?: string;
    metadata: Record<string, any>;
}
export interface VerificationRequirement {
    type: 'APPRAISAL' | 'LEGAL' | 'PHYSICAL' | 'IOT' | 'SATELLITE' | 'ENVIRONMENTAL' | 'REGULATORY';
    provider?: string;
    mandatory: boolean;
    deadline?: Date;
    cost?: number;
    customSpecs?: Record<string, any>;
}
export interface ProcessingSlot {
    id: string;
    workerId: string;
    requestId: string;
    startTime: Date;
    estimatedCompletion: Date;
    status: 'QUEUED' | 'PROCESSING' | 'VERIFICATION' | 'REVIEW' | 'COMPLETED' | 'FAILED';
    stage: string;
    progress: number;
    performance: ProcessingMetrics;
}
export interface ProcessingMetrics {
    processingTime: number;
    verificationTime: number;
    documentProcessingTime: number;
    externalAPITime: number;
    consensusTime: number;
    totalTime: number;
    errorCount: number;
    retryCount: number;
    qualityScore: number;
}
export interface RegistrationResult {
    assetId: string;
    requestId: string;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    processingTime: number;
    verificationResults: VerificationResult[];
    documentResults: DocumentProcessingResult[];
    complianceStatus: ComplianceResult;
    estimatedValue: number;
    confidenceScore: number;
    nextSteps: string[];
    warnings: string[];
    errors: string[];
}
export interface VerificationResult {
    type: string;
    provider: string;
    status: 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'PENDING';
    score: number;
    details: Record<string, any>;
    cost: number;
    duration: number;
    timestamp: Date;
}
export interface DocumentProcessingResult {
    documentId: string;
    status: 'PROCESSED' | 'FAILED' | 'PENDING';
    extractedMetadata: Record<string, any>;
    ocrResult?: string;
    digitalSignatureValid: boolean;
    integrityVerified: boolean;
    complianceChecks: ComplianceCheck[];
}
export interface ComplianceResult {
    jurisdiction: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL';
    requirements: ComplianceRequirement[];
    score: number;
    issues: ComplianceIssue[];
    recommendations: string[];
}
export interface ComplianceRequirement {
    id: string;
    name: string;
    status: 'MET' | 'NOT_MET' | 'PARTIAL';
    mandatory: boolean;
    details: string;
}
export interface ComplianceCheck {
    type: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    details: string;
}
export interface ComplianceIssue {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    resolution: string;
    deadline?: Date;
}
export interface SystemMetrics {
    activeRequests: number;
    completedRequests: number;
    failedRequests: number;
    averageProcessingTime: number;
    throughput: number;
    systemHealth: number;
    workerUtilization: Record<string, number>;
    queueLength: number;
    errorRate: number;
    uptime: number;
    resourceUsage: ResourceUsage;
}
export interface ResourceUsage {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    database: number;
}
export interface LoadBalancingConfig {
    maxConcurrentRequests: number;
    maxWorkersPerType: number;
    autoScaling: boolean;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    healthCheckInterval: number;
    failoverEnabled: boolean;
}
export interface PerformanceConfig {
    processingTimeoutMs: number;
    verificationTimeoutMs: number;
    documentTimeoutMs: number;
    maxRetries: number;
    retryDelayMs: number;
    batchSize: number;
    cacheExpirationMs: number;
}
export interface QualityAssuranceConfig {
    minVerificationScore: number;
    minDocumentQuality: number;
    minComplianceScore: number;
    requireHumanReview: boolean;
    humanReviewThreshold: number;
    auditTrailLevel: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
}
export declare class AssetRegistrationService extends EventEmitter {
    private requests;
    private processingSlots;
    private workers;
    private cryptoManager;
    private consensus;
    private priorityQueues;
    private metrics;
    private performanceHistory;
    private startTime;
    private loadBalancingConfig;
    private performanceConfig;
    private qualityConfig;
    private verificationCache;
    private documentCache;
    private complianceCache;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2, config?: {
        loadBalancing?: Partial<LoadBalancingConfig>;
        performance?: Partial<PerformanceConfig>;
        quality?: Partial<QualityAssuranceConfig>;
    });
    private initializeConfiguration;
    private initializeMetrics;
    private initializeWorkers;
    private createWorker;
    private startBackgroundProcesses;
    submitRegistrationRequest(submitterId: string, assetData: Partial<Asset>, documents?: UploadedDocument[], options?: {
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        processingType?: 'STANDARD' | 'EXPRESS' | 'INSTANT';
        verificationRequirements?: VerificationRequirement[];
        jurisdiction?: string;
        complianceLevel?: 'BASIC' | 'ENHANCED' | 'PREMIUM';
        expectedValue?: number;
        deadline?: Date;
        customRequirements?: Record<string, any>;
    }): Promise<{
        requestId: string;
        estimatedCompletion: Date;
        cost: number;
    }>;
    private validateRegistrationRequest;
    private generateDefaultVerificationRequirements;
    private calculateEstimatedCompletion;
    private calculateQueueDelay;
    private calculateRegistrationCost;
    private processQueues;
    private canProcessRequest;
    private processRequest;
    private executeRegistrationProcess;
    private processDocuments;
    private extractDocumentMetadata;
    private classifyDocument;
    private extractKeywords;
    private performOCR;
    private verifyDigitalSignature;
    private verifyDocumentIntegrity;
    private performDocumentComplianceChecks;
    private processVerifications;
    private performVerification;
    private selectVerificationProvider;
    private calculateVerificationCost;
    private generateVerificationDetails;
    private processCompliance;
    private getComplianceRequirements;
    private checkComplianceRequirement;
    private registerAssetInConsensus;
    private determineResultStatus;
    private calculateEstimatedValue;
    private calculateConfidenceScore;
    private generateNextSteps;
    private generateWarnings;
    private generateErrors;
    private findAvailableWorker;
    private handleProcessingError;
    private recordCompletion;
    private updatePerformanceMetrics;
    private updateMetrics;
    private updateSystemHealth;
    private performHealthChecks;
    private checkResourceUsage;
    private cleanExpiredCache;
    private optimizePerformance;
    private scaleUpWorkers;
    private scaleDownWorkers;
    private terminateWorker;
    private handleWorkerMessage;
    private handleProcessingUpdate;
    private handleWorkerError;
    private handleWorkerExit;
    private generateRequestId;
    private generateSlotId;
    private generateAssetId;
    getRegistrationStatus(requestId: string): Promise<{
        request: RegistrationRequest;
        slot?: ProcessingSlot;
        estimatedCompletion: Date;
    } | null>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getConfiguration(): Promise<{
        loadBalancing: LoadBalancingConfig;
        performance: PerformanceConfig;
        quality: QualityAssuranceConfig;
    }>;
    updateConfiguration(config: {
        loadBalancing?: Partial<LoadBalancingConfig>;
        performance?: Partial<PerformanceConfig>;
        quality?: Partial<QualityAssuranceConfig>;
    }): Promise<void>;
    getActiveRequests(): Promise<RegistrationRequest[]>;
    cancelRegistrationRequest(requestId: string, reason: string): Promise<boolean>;
    shutdown(): Promise<void>;
    getSystemStatus(): {
        status: string;
        uptime: number;
        activeRequests: number;
        queueSize: number;
    };
    submitRegistration(request: any): Promise<string>;
    updateVerificationStatus(entityId: string, status: any): Promise<void>;
    getEstimatedProcessingTime(processingType: string): string;
    getRegistrations(options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    updateRegistrationPriority(requestId: string, priority: string): Promise<void>;
    getPerformanceMetrics(): any;
}
//# sourceMappingURL=AssetRegistrationService.d.ts.map