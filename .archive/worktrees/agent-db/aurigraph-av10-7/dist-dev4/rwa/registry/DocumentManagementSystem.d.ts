/**
 * AV10-21 Document Management System
 * Secure Document Storage and Retrieval Infrastructure
 *
 * Features:
 * - Encrypted document storage with multiple storage backends
 * - Advanced document processing and OCR capabilities
 * - Digital signature verification and integrity checking
 * - Automated backup and versioning system
 * - High-performance document search and retrieval
 * - Compliance and audit trail management
 * - Real-time document synchronization
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface StoredDocument {
    id: string;
    originalFilename: string;
    contentType: string;
    size: number;
    hash: string;
    encryptionKey: string;
    storageLocation: string;
    backupLocations: string[];
    metadata: DocumentMetadata;
    versions: DocumentVersion[];
    digitalSignature?: DigitalSignature;
    accessControls: AccessControl[];
    auditTrail: AuditEntry[];
    created: Date;
    updated: Date;
    lastAccessed: Date;
}
export interface DocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords: string[];
    language: string;
    pages?: number;
    format: string;
    compression: string;
    quality: number;
    extractedText?: string;
    ocrData?: OCRResult;
    classification: DocumentClassification;
    retention: RetentionPolicy;
    compliance: ComplianceMetadata;
    customProperties: Record<string, any>;
}
export interface DocumentVersion {
    version: string;
    hash: string;
    size: number;
    storageLocation: string;
    changes: string;
    created: Date;
    createdBy: string;
}
export interface DigitalSignature {
    algorithm: string;
    signature: string;
    publicKey: string;
    certificate?: string;
    timestamp: Date;
    valid: boolean;
    verifiedAt?: Date;
}
export interface AccessControl {
    userId: string;
    permissions: Permission[];
    granted: Date;
    grantedBy: string;
    expires?: Date;
    conditions?: AccessCondition[];
}
export interface Permission {
    action: 'READ' | 'WRITE' | 'DELETE' | 'SHARE' | 'PRINT' | 'DOWNLOAD';
    granted: boolean;
    restrictions?: string[];
}
export interface AccessCondition {
    type: 'TIME_BASED' | 'LOCATION_BASED' | 'IP_BASED' | 'DEVICE_BASED';
    parameters: Record<string, any>;
}
export interface AuditEntry {
    id: string;
    action: string;
    userId: string;
    timestamp: Date;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    result: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
}
export interface OCRResult {
    text: string;
    confidence: number;
    language: string;
    processedPages: OCRPage[];
    processingTime: number;
    engine: string;
}
export interface OCRPage {
    pageNumber: number;
    text: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
}
export interface DocumentClassification {
    type: string;
    category: string;
    subcategory?: string;
    confidence: number;
    tags: string[];
    sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}
export interface RetentionPolicy {
    retentionPeriod: number;
    deleteAfter?: Date;
    archiveAfter?: Date;
    legalHold: boolean;
    reason: string;
}
export interface ComplianceMetadata {
    regulations: string[];
    classification: string;
    handling: string[];
    retention: string;
    disposal: string;
    reviewed: boolean;
    reviewDate?: Date;
    approver?: string;
}
export interface StorageBackend {
    id: string;
    name: string;
    type: 'LOCAL' | 'S3' | 'AZURE' | 'GCP' | 'IPFS' | 'ARWEAVE';
    config: Record<string, any>;
    priority: number;
    available: boolean;
    healthScore: number;
    lastHealthCheck: Date;
}
export interface BackupJob {
    id: string;
    documentId: string;
    sourceLocation: string;
    targetLocations: string[];
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    progress: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
}
export interface SearchQuery {
    text?: string;
    filters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    offset?: number;
    limit?: number;
    includeContent?: boolean;
}
export interface SearchFilter {
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'RANGE' | 'IN';
    value: any;
}
export interface SearchResult {
    documents: DocumentSearchHit[];
    totalCount: number;
    took: number;
    facets?: SearchFacet[];
}
export interface DocumentSearchHit {
    document: StoredDocument;
    score: number;
    highlights?: string[];
}
export interface SearchFacet {
    field: string;
    values: FacetValue[];
}
export interface FacetValue {
    value: string;
    count: number;
}
export interface SystemMetrics {
    totalDocuments: number;
    totalSize: number;
    storageUtilization: Record<string, number>;
    backupStatus: Record<string, BackupStatus>;
    searchIndexSize: number;
    averageProcessingTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
}
export interface BackupStatus {
    lastBackup: Date;
    backupCount: number;
    failedBackups: number;
    nextBackup: Date;
}
export declare class DocumentManagementSystem extends EventEmitter {
    private documents;
    private storageBackends;
    private backupJobs;
    private searchIndex;
    private accessLog;
    private cryptoManager;
    private consensus;
    private ocrWorkers;
    private backupWorkers;
    private searchWorkers;
    private config;
    private metrics;
    private startTime;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2, config?: Partial<typeof DocumentManagementSystem.prototype.config>);
    private initializeMetrics;
    private initializeStorageBackends;
    private initializeWorkers;
    private createOCRWorker;
    private createBackupWorker;
    private createSearchWorker;
    private startBackgroundProcesses;
    storeDocument(buffer: Buffer, filename: string, contentType: string, metadata: Partial<DocumentMetadata> | undefined, userId: string, options?: {
        encrypt?: boolean;
        compress?: boolean;
        performOCR?: boolean;
        generateThumbnail?: boolean;
        digitalSignature?: DigitalSignature;
        accessControls?: AccessControl[];
        retention?: RetentionPolicy;
    }): Promise<string>;
    retrieveDocument(documentId: string, userId: string, options?: {
        version?: string;
        decrypt?: boolean;
        decompress?: boolean;
        thumbnail?: boolean;
    }): Promise<{
        buffer: Buffer;
        document: StoredDocument;
    }>;
    updateDocument(documentId: string, buffer: Buffer, userId: string, changes: string, options?: {
        createVersion?: boolean;
        encrypt?: boolean;
        compress?: boolean;
    }): Promise<string>;
    deleteDocument(documentId: string, userId: string, secure?: boolean): Promise<void>;
    searchDocuments(query: SearchQuery, userId: string): Promise<SearchResult>;
    private applySearchFilter;
    private getDocumentFieldValue;
    private sortSearchResults;
    private calculateRelevanceScore;
    private generateHighlights;
    private generateSearchFacets;
    grantAccess(documentId: string, targetUserId: string, permissions: Permission[], grantorId: string, options?: {
        expires?: Date;
        conditions?: AccessCondition[];
    }): Promise<void>;
    revokeAccess(documentId: string, targetUserId: string, revokerUserId: string): Promise<void>;
    private hasPermission;
    private scheduleBackup;
    private scheduleOCR;
    private isOCRSupported;
    private updateSearchIndex;
    private removeFromSearchIndex;
    private optimizeSearchIndex;
    private compressBuffer;
    private decompressBuffer;
    private encryptBuffer;
    private decryptBuffer;
    private getPrimaryStorageBackend;
    private storeInBackend;
    private storeInLocalBackend;
    private storeInS3Backend;
    private storeInIPFSBackend;
    private retrieveFromStorage;
    private deleteFromStorage;
    private performAutomaticBackups;
    private performHealthChecks;
    private checkBackendHealth;
    private performCleanup;
    private updateMetrics;
    private handleWorkerMessage;
    private handleOCRCompleted;
    private handleBackupCompleted;
    private handleSearchCompleted;
    private logAccess;
    private generateDocumentId;
    private generateBackupJobId;
    private generateAuditId;
    getDocument(documentId: string): Promise<StoredDocument | null>;
    getDocumentMetadata(documentId: string): Promise<DocumentMetadata | null>;
    listDocuments(userId: string, options?: {
        offset?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<{
        documents: StoredDocument[];
        totalCount: number;
    }>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getAuditTrail(documentId?: string, userId?: string, limit?: number): Promise<AuditEntry[]>;
    getBackupStatus(): Promise<Map<string, BackupJob>>;
    performManualBackup(documentId: string): Promise<string>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=DocumentManagementSystem.d.ts.map