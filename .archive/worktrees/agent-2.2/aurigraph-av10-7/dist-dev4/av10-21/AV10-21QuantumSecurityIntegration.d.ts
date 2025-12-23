import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
import { VerificationEngine } from '../verification/VerificationEngine';
import { LegalComplianceModule } from '../compliance/LegalComplianceModule';
import { DueDiligenceAutomation } from '../compliance/DueDiligenceAutomation';
export interface QuantumSecurityConfiguration {
    enabled: boolean;
    securityLevel: 1 | 2 | 3 | 4 | 5 | 6;
    algorithms: {
        signing: 'CRYSTALS-Dilithium' | 'Falcon' | 'SPHINCS+';
        encryption: 'CRYSTALS-Kyber' | 'NTRU' | 'Classic_McEliece';
        hashing: 'SHA3-512' | 'BLAKE3' | 'Quantum-SHA';
        keyDerivation: 'HKDF-SHA3' | 'Argon2id' | 'PBKDF2-SHA3';
    };
    keyManagement: {
        rotationInterval: number;
        escrowRequired: boolean;
        multiPartyCompute: boolean;
        hardwareSecurityModule: boolean;
    };
    quantumKeyDistribution: {
        enabled: boolean;
        protocol: 'BB84' | 'E91' | 'SARG04' | 'DPS-QKD';
        networkTopology: 'POINT_TO_POINT' | 'STAR' | 'MESH';
        maxDistance: number;
    };
    postQuantumTransition: {
        hybridMode: boolean;
        classicFallback: boolean;
        migrationPhase: 'PREPARATION' | 'TRANSITION' | 'POST_QUANTUM';
        compatibilityMode: boolean;
    };
}
export interface QuantumSecurityContext {
    id: string;
    entity: string;
    operation: 'VERIFICATION' | 'COMPLIANCE' | 'DUE_DILIGENCE' | 'AUDIT' | 'REPORTING';
    securityLevel: number;
    quantumKeys: Map<string, QuantumKeyContext>;
    encryptionState: QuantumEncryptionState;
    signingState: QuantumSigningState;
    auditContext: QuantumAuditContext;
    created: Date;
    expires: Date;
    active: boolean;
}
export interface QuantumKeyContext {
    keyId: string;
    keyType: 'SIGNING' | 'ENCRYPTION' | 'DERIVATION' | 'EXCHANGE';
    algorithm: string;
    publicKey: string;
    privateKeyRef: string;
    quantumSafe: boolean;
    distributed: boolean;
    shares?: QuantumKeyShare[];
    usage: {
        created: Date;
        used: number;
        maxUsage: number;
        expires: Date;
    };
    metadata: {
        strength: number;
        entropy: number;
        quantumResistance: number;
        compliance: string[];
    };
}
export interface QuantumKeyShare {
    shareId: string;
    nodeId: string;
    threshold: number;
    share: string;
    verified: boolean;
}
export interface QuantumEncryptionState {
    sessionKeys: Map<string, SessionKeyContext>;
    encryptedData: Map<string, QuantumEncryptedData>;
    decryptionHistory: DecryptionRecord[];
    keyRotationSchedule: Date[];
}
export interface SessionKeyContext {
    sessionId: string;
    algorithm: string;
    keyMaterial: string;
    iv: string;
    authTag?: string;
    created: Date;
    expires: Date;
    usage: number;
}
export interface QuantumEncryptedData {
    dataId: string;
    algorithm: string;
    encryptedContent: string;
    keyId: string;
    iv: string;
    authTag: string;
    quantumProof: QuantumProofOfEncryption;
    integrity: {
        hash: string;
        timestamp: Date;
        verified: boolean;
    };
}
export interface QuantumProofOfEncryption {
    proofId: string;
    algorithm: string;
    commitment: string;
    challenge: string;
    response: string;
    verificationData: string;
    timestamp: Date;
    verified: boolean;
}
export interface DecryptionRecord {
    requestId: string;
    dataId: string;
    requestor: string;
    authorized: boolean;
    timestamp: Date;
    success: boolean;
    auditTrail: string;
}
export interface QuantumSigningState {
    activeSignatures: Map<string, QuantumSignatureContext>;
    verificationCache: Map<string, VerificationResult>;
    multiSignatures: Map<string, MultiSignatureContext>;
    timestampService: QuantumTimestampService;
}
export interface QuantumSignatureContext {
    signatureId: string;
    data: string;
    signature: string;
    keyId: string;
    algorithm: string;
    timestamp: Date;
    quantumProof: QuantumProofOfSignature;
    witnesses?: SignatureWitness[];
    valid: boolean;
    expires: Date;
}
export interface QuantumProofOfSignature {
    proofId: string;
    signatureCommitment: string;
    nonceCommitment: string;
    challenge: string;
    response: string;
    publicKey: string;
    timestamp: Date;
    verified: boolean;
}
export interface SignatureWitness {
    witnessId: string;
    nodeId: string;
    witnessSignature: string;
    timestamp: Date;
    blockHeight?: number;
}
export interface VerificationResult {
    signatureId: string;
    valid: boolean;
    confidence: number;
    reasons: string[];
    verifiedAt: Date;
    verifier: string;
}
export interface MultiSignatureContext {
    multiSigId: string;
    requiredSignatures: number;
    signatures: Map<string, QuantumSignatureContext>;
    threshold: number;
    complete: boolean;
    valid: boolean;
    expires: Date;
}
export interface QuantumTimestampService {
    enabled: boolean;
    provider: string;
    certificates: Map<string, TimestampCertificate>;
    requests: Map<string, TimestampRequest>;
}
export interface TimestampCertificate {
    certId: string;
    issuer: string;
    validFrom: Date;
    validUntil: Date;
    publicKey: string;
    algorithm: string;
    trusted: boolean;
}
export interface TimestampRequest {
    requestId: string;
    data: string;
    timestamp: Date;
    certificate: string;
    signature: string;
    verified: boolean;
}
export interface QuantumAuditContext {
    auditId: string;
    operations: QuantumOperationLog[];
    keyEvents: QuantumKeyEvent[];
    securityEvents: QuantumSecurityEvent[];
    complianceEvents: QuantumComplianceEvent[];
    integrityChecks: IntegrityCheck[];
}
export interface QuantumOperationLog {
    operationId: string;
    operation: string;
    input: string;
    output: string;
    keyUsed: string;
    algorithm: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    quantumProof: string;
}
export interface QuantumKeyEvent {
    eventId: string;
    keyId: string;
    eventType: 'CREATED' | 'USED' | 'ROTATED' | 'REVOKED' | 'EXPIRED' | 'COMPROMISED';
    details: any;
    timestamp: Date;
    auditSignature: string;
}
export interface QuantumSecurityEvent {
    eventId: string;
    eventType: 'INTRUSION_ATTEMPT' | 'KEY_COMPROMISE' | 'ALGORITHM_WEAKNESS' | 'QUANTUM_ATTACK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    mitigation: string[];
    timestamp: Date;
    resolved: boolean;
}
export interface QuantumComplianceEvent {
    eventId: string;
    regulation: string;
    requirement: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
    evidence: string[];
    timestamp: Date;
    reviewDate: Date;
}
export interface IntegrityCheck {
    checkId: string;
    scope: 'SYSTEM' | 'KEYS' | 'DATA' | 'OPERATIONS';
    result: 'PASS' | 'FAIL' | 'WARNING';
    findings: string[];
    timestamp: Date;
    nextCheck: Date;
}
export interface QuantumSecurityMetrics {
    operationalMetrics: {
        totalOperations: number;
        successfulOperations: number;
        failedOperations: number;
        averageOperationTime: number;
        quantumOperationsPerSecond: number;
    };
    securityMetrics: {
        keyRotations: number;
        securityEvents: number;
        intrusionAttempts: number;
        compromisedKeys: number;
        quantumReadiness: number;
    };
    complianceMetrics: {
        complianceRate: number;
        auditEvents: number;
        violationEvents: number;
        remediated: number;
        pendingRemediation: number;
    };
    performanceMetrics: {
        encryptionThroughput: number;
        decryptionThroughput: number;
        signingThroughput: number;
        verificationThroughput: number;
        keyGenerationTime: number;
    };
}
export declare class AV10_21_QuantumSecurityIntegration extends EventEmitter {
    private logger;
    private cryptoManager;
    private auditTrail;
    private verificationEngine;
    private complianceModule;
    private dueDiligenceAutomation;
    private securityContexts;
    private globalSecurityConfig;
    private keyManagementService;
    private quantumKeyDistribution;
    private intrusionDetectionSystem;
    private securityMetrics;
    constructor(cryptoManager: QuantumCryptoManagerV2, auditTrail: AuditTrailManager, verificationEngine: VerificationEngine, complianceModule: LegalComplianceModule, dueDiligenceAutomation: DueDiligenceAutomation);
    initialize(): Promise<void>;
    private getDefaultSecurityConfiguration;
    private initializeQuantumKeyDistribution;
    private initializeQKDNodes;
    private setupQKDChannels;
    private initializeKeyManagementService;
    private initializeHSMModules;
    private setupKeyLifecycleManagement;
    private initializeIntrusionDetection;
    private initializeDetectionSensors;
    private setupDetectionRules;
    private configurePostQuantumAlgorithms;
    private validateAlgorithmConfigurations;
    private validateAlgorithm;
    private setupHybridCryptography;
    private startSecurityMonitoring;
    private startIntrusionMonitoring;
    private integrateAV10_21Components;
    createSecurityContext(entity: string, operation: 'VERIFICATION' | 'COMPLIANCE' | 'DUE_DILIGENCE' | 'AUDIT' | 'REPORTING', securityLevel?: number): Promise<string>;
    private generateQuantumKeysForContext;
    private generateQuantumKey;
    private storePrivateKeySecurely;
    private getMaxKeyUsage;
    private getKeyLifetime;
    private calculateKeyStrength;
    private calculateQuantumResistance;
    private getComplianceFrameworks;
    private generateKeyShares;
    private handleVerificationSecurity;
    private handleComplianceSecurity;
    private handleDueDiligenceSecurity;
    private handleComplianceSecurityEvent;
    private applyQuantumSecurity;
    private quantumEncryptSensitiveData;
    private generateQuantumProofOfEncryption;
    private generateQuantumSignatures;
    private generateQuantumProofOfSignature;
    private distributeQuantumKeys;
    private distributeKeyShare;
    private monitorOperationSecurity;
    private checkOperationThreats;
    private verifyKeyIntegrity;
    private checkQuantumChannelSecurity;
    private handleQuantumEavesdropping;
    private rotateKey;
    private handleSecurityThreat;
    private activateEnhancedSecurity;
    private updateSecurityMetrics;
    private calculateEncryptionThroughput;
    private calculateSigningThroughput;
    private calculateQuantumReadiness;
    private monitorSecurityEvents;
    private checkContextSecurity;
    private checkQKDSecurity;
    private checkKeyManagementSecurity;
    private monitorCompliance;
    private isContextCompliant;
    private processIntrusionDetection;
    private processThreatDetection;
    private handleDetectedThreat;
    private getThreatMitigation;
    private applyThreatResponse;
    private analyzeThreatLandscape;
    private updateThreatIntelligence;
    private adjustSecurityPosture;
    private enhanceQuantumDetection;
    private performKeyRotation;
    private shouldRotateKey;
    private performEmergencyKeyRotation;
    private revokeCompromisedKeys;
    private revokeChannelKeys;
    private generateEmergencyKeys;
    private activatePostQuantumMode;
    private isolateSystem;
    private scheduleKeyRotation;
    private monitorKeyHealth;
    private checkKeyHealth;
    private logQuantumOperationSecurity;
    private logQuantumSecurityEvent;
    private logQuantumKeyEvent;
    getSecurityContext(contextId: string): Promise<QuantumSecurityContext | null>;
    getSecurityMetrics(): Promise<QuantumSecurityMetrics>;
    getQuantumReadiness(): Promise<number>;
    validateQuantumSecurity(contextId: string): Promise<boolean>;
    getSecurityConfiguration(): Promise<QuantumSecurityConfiguration>;
    updateSecurityConfiguration(config: Partial<QuantumSecurityConfiguration>): Promise<void>;
}
//# sourceMappingURL=AV10-21QuantumSecurityIntegration.d.ts.map