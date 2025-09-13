/**
 * AV10-21 External API Integration System
 * Government Registry and Third-Party Verification Sources Integration
 *
 * Features:
 * - Government registry integrations (SEC, FHA, Land Records, etc.)
 * - Third-party verification providers (KYC, AML, Credit bureaus)
 * - Rate limiting and failover management
 * - Real-time data synchronization
 * - Compliance and audit trail integration
 * - High-availability external service orchestration
 * - Automated retry and recovery mechanisms
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface ExternalAPIProvider {
    id: string;
    name: string;
    category: APICategory;
    type: APIType;
    baseUrl: string;
    authentication: AuthenticationConfig;
    rateLimit: RateLimitConfig;
    reliability: ReliabilityConfig;
    compliance: ComplianceConfig;
    endpoints: APIEndpoint[];
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEPRECATED';
    healthScore: number;
    lastHealthCheck: Date;
    configuration: Record<string, any>;
}
export declare enum APICategory {
    GOVERNMENT_REGISTRY = "GOVERNMENT_REGISTRY",
    VERIFICATION_PROVIDER = "VERIFICATION_PROVIDER",
    FINANCIAL_INSTITUTION = "FINANCIAL_INSTITUTION",
    REGULATORY_BODY = "REGULATORY_BODY",
    DATA_PROVIDER = "DATA_PROVIDER",
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION",
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION",
    ASSET_VALUATION = "ASSET_VALUATION"
}
export declare enum APIType {
    REST = "REST",
    SOAP = "SOAP",
    GRAPHQL = "GRAPHQL",
    WEBSOCKET = "WEBSOCKET",
    FTP = "FTP",
    SFTP = "SFTP",
    EDI = "EDI",
    XML_RPC = "XML_RPC"
}
export interface AuthenticationConfig {
    type: 'API_KEY' | 'OAUTH2' | 'JWT' | 'BASIC' | 'CERTIFICATE' | 'CUSTOM';
    credentials: Record<string, string>;
    refreshInterval?: number;
    tokenEndpoint?: string;
    scope?: string[];
}
export interface RateLimitConfig {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
    backoffStrategy: 'LINEAR' | 'EXPONENTIAL' | 'FIBONACCI';
    maxRetries: number;
    retryDelay: number;
}
export interface ReliabilityConfig {
    timeout: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
    healthCheckInterval: number;
    failoverProviders: string[];
    cacheEnabled: boolean;
    cacheTTL: number;
}
export interface ComplianceConfig {
    dataResidency: string[];
    encryptionRequired: boolean;
    auditLevel: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    soxCompliant: boolean;
    pciCompliant: boolean;
    regulations: string[];
}
export interface APIEndpoint {
    id: string;
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
    parameters: APIParameter[];
    responses: APIResponse[];
    rateLimit?: RateLimitConfig;
    cacheSettings?: CacheSettings;
    transformations?: DataTransformation[];
}
export interface APIParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    location: 'query' | 'path' | 'header' | 'body';
    validation?: ValidationRule[];
    description: string;
    example?: any;
}
export interface APIResponse {
    statusCode: number;
    description: string;
    schema?: any;
    examples?: Record<string, any>;
}
export interface ValidationRule {
    type: 'MIN_LENGTH' | 'MAX_LENGTH' | 'PATTERN' | 'MIN_VALUE' | 'MAX_VALUE' | 'ENUM';
    value: any;
    message?: string;
}
export interface CacheSettings {
    enabled: boolean;
    ttl: number;
    invalidateOn: string[];
    keyStrategy: 'SIMPLE' | 'HASHED' | 'CUSTOM';
}
export interface DataTransformation {
    type: 'MAP' | 'FILTER' | 'AGGREGATE' | 'FORMAT' | 'VALIDATE' | 'NORMALIZE';
    configuration: Record<string, any>;
    order: number;
}
export interface APIRequest {
    id: string;
    providerId: string;
    endpointId: string;
    parameters: Record<string, any>;
    headers?: Record<string, string>;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    retryCount: number;
    maxRetries: number;
    timeout?: number;
    callback?: (result: APIResponse) => void;
    created: Date;
    started?: Date;
    completed?: Date;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
}
export interface APICallResult {
    requestId: string;
    providerId: string;
    endpointId: string;
    success: boolean;
    statusCode: number;
    data: any;
    error?: string;
    duration: number;
    timestamp: Date;
    cached: boolean;
    rateLimited: boolean;
    fromFailover: boolean;
    metadata: CallMetadata;
}
export interface CallMetadata {
    attempt: number;
    totalAttempts: number;
    networkLatency: number;
    processingTime: number;
    responseSize: number;
    cacheHit?: boolean;
    circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    transformations?: string[];
}
export interface GovernmentRegistryQuery {
    registryType: 'SEC' | 'USPTO' | 'LAND_RECORDS' | 'BUSINESS_REGISTRY' | 'TAX_REGISTRY' | 'COURT_RECORDS';
    jurisdiction: string;
    queryType: 'ENTITY_LOOKUP' | 'DOCUMENT_SEARCH' | 'FILING_STATUS' | 'OWNERSHIP_VERIFICATION';
    parameters: Record<string, any>;
    urgency: 'STANDARD' | 'EXPEDITED' | 'RUSH';
}
export interface GovernmentRegistryResponse {
    registryType: string;
    jurisdiction: string;
    queryId: string;
    status: 'SUCCESS' | 'NOT_FOUND' | 'PARTIAL' | 'ERROR' | 'PENDING';
    data: any;
    confidence: number;
    lastUpdated: Date;
    sources: string[];
    verificationLevel: 'BASIC' | 'ENHANCED' | 'PREMIUM';
    complianceCertifications: string[];
}
export interface VerificationRequest {
    type: 'KYC' | 'AML' | 'CREDIT_CHECK' | 'IDENTITY_VERIFICATION' | 'DOCUMENT_AUTHENTICATION';
    subjectId: string;
    documentIds?: string[];
    parameters: Record<string, any>;
    complianceLevel: 'BASIC' | 'ENHANCED' | 'PREMIUM';
    urgency: 'STANDARD' | 'EXPEDITED' | 'INSTANT';
}
export interface VerificationResponse {
    verificationId: string;
    type: string;
    subjectId: string;
    status: 'VERIFIED' | 'REJECTED' | 'CONDITIONAL' | 'PENDING' | 'EXPIRED';
    score: number;
    confidence: number;
    details: Record<string, any>;
    flags: VerificationFlag[];
    recommendations: string[];
    expiryDate?: Date;
    compliance: ComplianceResult;
}
export interface VerificationFlag {
    type: 'WARNING' | 'ERROR' | 'INFO';
    code: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    resolution?: string;
}
export interface ComplianceResult {
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    kycCompliant: boolean;
    amlCompliant: boolean;
    sanctions: SanctionsResult;
    pep: PEPResult;
    adverseMedia: AdverseMediaResult;
}
export interface SanctionsResult {
    listed: boolean;
    lists: string[];
    matchConfidence: number;
    details?: string;
}
export interface PEPResult {
    isPEP: boolean;
    category: string;
    country: string;
    position?: string;
    matchConfidence: number;
}
export interface AdverseMediaResult {
    found: boolean;
    count: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    categories: string[];
    summary?: string;
}
export interface CircuitBreaker {
    providerId: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailure?: Date;
    nextAttempt?: Date;
    threshold: number;
    timeout: number;
}
export interface RateLimiter {
    providerId: string;
    tokens: number;
    lastRefill: Date;
    requestQueue: string[];
    backoffUntil?: Date;
}
export interface APICache {
    key: string;
    data: any;
    created: Date;
    ttl: number;
    hits: number;
    size: number;
}
export interface SystemMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    cacheHitRate: number;
    providerHealth: Record<string, number>;
    rateLimitViolations: number;
    circuitBreakerTrips: number;
    uptime: number;
}
export declare class ExternalAPIIntegration extends EventEmitter {
    private providers;
    private requests;
    private circuitBreakers;
    private rateLimiters;
    private cache;
    private httpClients;
    private cryptoManager;
    private consensus;
    private metrics;
    private startTime;
    private requestQueues;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    private initializeMetrics;
    private initializeProviders;
    private initializeHTTPClients;
    private startBackgroundProcesses;
    makeAPICall(providerId: string, endpointId: string, parameters: Record<string, any>, options?: {
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        timeout?: number;
        retries?: number;
        useCache?: boolean;
        headers?: Record<string, string>;
    }): Promise<APICallResult>;
    queryGovernmentRegistry(query: GovernmentRegistryQuery): Promise<GovernmentRegistryResponse>;
    performVerification(request: VerificationRequest): Promise<VerificationResponse>;
    private processVerificationResult;
    private generateVerificationRecommendations;
    private executeRequest;
    private buildRequest;
    private buildAuthHeaders;
    private processResponse;
    private applyTransformation;
    private mapFields;
    private getNestedValue;
    private filterData;
    private matchesCriteria;
    private formatData;
    private normalizeData;
    private shouldRetry;
    private calculateRetryDelay;
    private fibonacci;
    private calculateConfidence;
    private tryFailoverProvider;
    private checkRateLimit;
    private refillRateLimitTokens;
    private manageCircuitBreakers;
    private handleCircuitBreakerFailure;
    private performHealthChecks;
    private checkProviderHealth;
    private processRequestQueues;
    private generateCacheKey;
    private getCachedResult;
    private cacheResult;
    private cleanupCache;
    private updateMetrics;
    private handleRequestInterceptor;
    private handleResponseInterceptor;
    private handleErrorInterceptor;
    private registerProvider;
    private generateRequestId;
    getProvider(providerId: string): Promise<ExternalAPIProvider | null>;
    getProviders(category?: APICategory): Promise<ExternalAPIProvider[]>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getCircuitBreakerStatus(): Promise<Map<string, CircuitBreaker>>;
    getRateLimitStatus(): Promise<Map<string, RateLimiter>>;
    getCacheStatus(): Promise<{
        size: number;
        totalHits: number;
        totalSize: number;
        entries: APICache[];
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ExternalAPIIntegration.d.ts.map