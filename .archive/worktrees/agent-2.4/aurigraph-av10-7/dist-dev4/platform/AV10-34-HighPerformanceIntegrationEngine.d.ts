/**
 * AV10-34: High-Performance Integration Engine
 * Ultra-fast integration platform for real-time system interoperability and data synchronization
 */
import { EventEmitter } from 'events';
export interface IntegrationEndpoint {
    id: string;
    name: string;
    type: EndpointType;
    protocol: IntegrationProtocol;
    configuration: EndpointConfiguration;
    authentication: AuthenticationConfig;
    capabilities: EndpointCapabilities;
    performance: EndpointPerformance;
    health: EndpointHealth;
    transforms: DataTransform[];
}
export interface EndpointConfiguration {
    url: string;
    port?: number;
    timeout: number;
    retryPolicy: RetryPolicy;
    rateLimiting: RateLimitConfig;
    caching: CacheConfig;
    compression: CompressionConfig;
    encryption: EncryptionConfig;
}
export interface AuthenticationConfig {
    type: AuthenticationType;
    credentials: Record<string, any>;
    tokenRefresh?: TokenRefreshConfig;
    mTLS?: MTLSConfig;
    oauth?: OAuthConfig;
}
export interface EndpointCapabilities {
    maxThroughput: number;
    supportedOperations: OperationType[];
    dataFormats: DataFormat[];
    realTimeSupport: boolean;
    batchProcessing: boolean;
    streamProcessing: boolean;
    transactionSupport: boolean;
}
export interface EndpointPerformance {
    currentThroughput: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
    errorRate: number;
    uptime: number;
}
export interface EndpointHealth {
    status: EndpointStatus;
    lastHealthCheck: Date;
    consecutiveFailures: number;
    responseTime: number;
    alerts: HealthAlert[];
    metrics: HealthMetrics;
}
export interface DataTransform {
    id: string;
    name: string;
    type: TransformType;
    inputFormat: DataFormat;
    outputFormat: DataFormat;
    script: string;
    validation: ValidationRule[];
    performance: TransformPerformance;
}
export interface IntegrationFlow {
    id: string;
    name: string;
    description: string;
    source: FlowEndpoint;
    destination: FlowEndpoint;
    transformations: FlowTransformation[];
    filters: FlowFilter[];
    routing: RoutingConfig;
    performance: FlowPerformance;
    monitoring: FlowMonitoring;
    errorHandling: ErrorHandlingConfig;
}
export interface FlowEndpoint {
    endpointId: string;
    operation: OperationType;
    parameters: Record<string, any>;
    mapping: FieldMapping[];
}
export interface FlowTransformation {
    transformId: string;
    order: number;
    condition?: string;
    parameters: Record<string, any>;
}
export interface FlowFilter {
    id: string;
    condition: string;
    action: FilterAction;
}
export interface RoutingConfig {
    strategy: RoutingStrategy;
    rules: RoutingRule[];
    loadBalancing: LoadBalancingConfig;
    fallback: FallbackConfig;
}
export interface FlowPerformance {
    throughput: number;
    latency: number;
    processedCount: number;
    errorCount: number;
    lastProcessed: Date;
}
export interface FlowMonitoring {
    enabled: boolean;
    metrics: string[];
    alerts: AlertConfig[];
    logging: LoggingConfig;
}
export interface BatchJob {
    id: string;
    name: string;
    schedule: ScheduleConfig;
    source: BatchSource;
    destination: BatchDestination;
    processing: BatchProcessingConfig;
    validation: BatchValidationConfig;
    status: BatchJobStatus;
    statistics: BatchStatistics;
}
export interface StreamProcessor {
    id: string;
    name: string;
    inputStream: StreamConfig;
    outputStream: StreamConfig;
    processing: StreamProcessingConfig;
    windowing: WindowingConfig;
    aggregation: AggregationConfig;
    performance: StreamPerformance;
}
export interface APIGateway {
    id: string;
    name: string;
    endpoints: GatewayEndpoint[];
    authentication: GatewayAuthentication;
    rateLimiting: GatewayRateLimiting;
    caching: GatewayCaching;
    transformation: GatewayTransformation;
    monitoring: GatewayMonitoring;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: BackoffStrategy;
    retryableErrors: string[];
}
export interface RateLimitConfig {
    requestsPerSecond: number;
    burstSize: number;
    strategy: RateLimitStrategy;
}
export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: CacheStrategy;
}
export interface CompressionConfig {
    enabled: boolean;
    algorithm: CompressionAlgorithm;
    level: number;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm: EncryptionAlgorithm;
    keyId: string;
}
export interface TokenRefreshConfig {
    refreshUrl: string;
    refreshInterval: number;
    refreshBuffer: number;
}
export interface MTLSConfig {
    clientCert: string;
    clientKey: string;
    serverCert: string;
}
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope: string[];
}
export interface ValidationRule {
    field: string;
    type: ValidationType;
    rule: string;
    message: string;
}
export interface TransformPerformance {
    avgProcessingTime: number;
    throughput: number;
    errorRate: number;
}
export interface FieldMapping {
    sourceField: string;
    targetField: string;
    transformation?: string;
}
export interface RoutingRule {
    condition: string;
    target: string;
    priority: number;
}
export interface LoadBalancingConfig {
    algorithm: LoadBalancingAlgorithm;
    healthChecks: boolean;
    weights: Record<string, number>;
}
export interface FallbackConfig {
    enabled: boolean;
    targets: string[];
    timeout: number;
}
export interface AlertConfig {
    condition: string;
    threshold: number;
    notification: NotificationConfig;
}
export interface LoggingConfig {
    level: LogLevel;
    destination: LogDestination[];
    format: LogFormat;
}
export interface ScheduleConfig {
    type: ScheduleType;
    expression: string;
    timezone: string;
}
export interface BatchSource {
    type: SourceType;
    configuration: Record<string, any>;
    format: DataFormat;
}
export interface BatchDestination {
    type: DestinationType;
    configuration: Record<string, any>;
    format: DataFormat;
}
export interface BatchProcessingConfig {
    batchSize: number;
    parallelism: number;
    timeout: number;
    errorThreshold: number;
}
export interface BatchValidationConfig {
    enabled: boolean;
    rules: ValidationRule[];
    failureAction: FailureAction;
}
export interface BatchJobStatus {
    state: JobState;
    startTime?: Date;
    endTime?: Date;
    progress: number;
    message: string;
}
export interface BatchStatistics {
    totalRecords: number;
    processedRecords: number;
    errorRecords: number;
    processingTime: number;
    throughput: number;
}
export interface StreamConfig {
    type: StreamType;
    topic: string;
    partition?: number;
    configuration: Record<string, any>;
}
export interface StreamProcessingConfig {
    functions: ProcessingFunction[];
    parallelism: number;
    checkpointInterval: number;
}
export interface WindowingConfig {
    type: WindowType;
    size: number;
    slide?: number;
}
export interface AggregationConfig {
    functions: AggregationFunction[];
    groupBy: string[];
    outputInterval: number;
}
export interface StreamPerformance {
    throughput: number;
    latency: number;
    backpressure: number;
    watermark: Date;
}
export declare enum EndpointType {
    REST_API = "REST_API",
    SOAP_API = "SOAP_API",
    GRAPHQL_API = "GRAPHQL_API",
    DATABASE = "DATABASE",
    MESSAGE_QUEUE = "MESSAGE_QUEUE",
    FILE_SYSTEM = "FILE_SYSTEM",
    SFTP = "SFTP",
    EMAIL = "EMAIL",
    WEBHOOK = "WEBHOOK",
    BLOCKCHAIN = "BLOCKCHAIN"
}
export declare enum IntegrationProtocol {
    HTTP = "HTTP",
    HTTPS = "HTTPS",
    TCP = "TCP",
    UDP = "UDP",
    MQTT = "MQTT",
    AMQP = "AMQP",
    KAFKA = "KAFKA",
    WEBSOCKET = "WEBSOCKET",
    GRPC = "GRPC"
}
export declare enum AuthenticationType {
    NONE = "NONE",
    BASIC = "BASIC",
    BEARER = "BEARER",
    API_KEY = "API_KEY",
    OAUTH2 = "OAUTH2",
    JWT = "JWT",
    MTLS = "MTLS",
    CUSTOM = "CUSTOM"
}
export declare enum OperationType {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LIST = "LIST",
    SEARCH = "SEARCH",
    EXECUTE = "EXECUTE",
    SUBSCRIBE = "SUBSCRIBE"
}
export declare enum DataFormat {
    JSON = "JSON",
    XML = "XML",
    CSV = "CSV",
    AVRO = "AVRO",
    PROTOBUF = "PROTOBUF",
    PARQUET = "PARQUET",
    BINARY = "BINARY",
    TEXT = "TEXT"
}
export declare enum EndpointStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DEGRADED = "DEGRADED",
    FAILED = "FAILED",
    MAINTENANCE = "MAINTENANCE"
}
export declare enum TransformType {
    FIELD_MAPPING = "FIELD_MAPPING",
    DATA_CONVERSION = "DATA_CONVERSION",
    VALIDATION = "VALIDATION",
    ENRICHMENT = "ENRICHMENT",
    FILTERING = "FILTERING",
    AGGREGATION = "AGGREGATION",
    CUSTOM = "CUSTOM"
}
export declare enum FilterAction {
    INCLUDE = "INCLUDE",
    EXCLUDE = "EXCLUDE",
    TRANSFORM = "TRANSFORM",
    ROUTE = "ROUTE"
}
export declare enum RoutingStrategy {
    DIRECT = "DIRECT",
    LOAD_BALANCED = "LOAD_BALANCED",
    CONDITIONAL = "CONDITIONAL",
    BROADCAST = "BROADCAST"
}
export declare enum BackoffStrategy {
    FIXED = "FIXED",
    LINEAR = "LINEAR",
    EXPONENTIAL = "EXPONENTIAL",
    CUSTOM = "CUSTOM"
}
export declare enum RateLimitStrategy {
    TOKEN_BUCKET = "TOKEN_BUCKET",
    SLIDING_WINDOW = "SLIDING_WINDOW",
    FIXED_WINDOW = "FIXED_WINDOW"
}
export declare enum CacheStrategy {
    LRU = "LRU",
    LFU = "LFU",
    FIFO = "FIFO",
    TTL = "TTL"
}
export declare enum CompressionAlgorithm {
    GZIP = "GZIP",
    DEFLATE = "DEFLATE",
    BROTLI = "BROTLI",
    LZ4 = "LZ4"
}
export declare enum EncryptionAlgorithm {
    AES_256 = "AES_256",
    AES_128 = "AES_128",
    RSA = "RSA",
    CHACHA20 = "CHACHA20"
}
export declare enum ValidationType {
    REQUIRED = "REQUIRED",
    TYPE = "TYPE",
    FORMAT = "FORMAT",
    RANGE = "RANGE",
    PATTERN = "PATTERN",
    CUSTOM = "CUSTOM"
}
export declare enum LoadBalancingAlgorithm {
    ROUND_ROBIN = "ROUND_ROBIN",
    WEIGHTED = "WEIGHTED",
    LEAST_CONNECTIONS = "LEAST_CONNECTIONS",
    RESPONSE_TIME = "RESPONSE_TIME"
}
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare enum LogDestination {
    CONSOLE = "CONSOLE",
    FILE = "FILE",
    DATABASE = "DATABASE",
    REMOTE = "REMOTE"
}
export declare enum LogFormat {
    JSON = "JSON",
    TEXT = "TEXT",
    STRUCTURED = "STRUCTURED"
}
export declare enum ScheduleType {
    CRON = "CRON",
    INTERVAL = "INTERVAL",
    ONE_TIME = "ONE_TIME"
}
export declare enum SourceType {
    DATABASE = "DATABASE",
    FILE = "FILE",
    API = "API",
    QUEUE = "QUEUE"
}
export declare enum DestinationType {
    DATABASE = "DATABASE",
    FILE = "FILE",
    API = "API",
    QUEUE = "QUEUE"
}
export declare enum FailureAction {
    CONTINUE = "CONTINUE",
    STOP = "STOP",
    RETRY = "RETRY",
    QUARANTINE = "QUARANTINE"
}
export declare enum JobState {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum StreamType {
    KAFKA = "KAFKA",
    KINESIS = "KINESIS",
    PUBSUB = "PUBSUB",
    RABBITMQ = "RABBITMQ"
}
export declare enum WindowType {
    TUMBLING = "TUMBLING",
    SLIDING = "SLIDING",
    SESSION = "SESSION"
}
export interface ProcessingFunction {
    name: string;
    code: string;
    parameters: Record<string, any>;
}
export interface AggregationFunction {
    type: AggregationType;
    field: string;
    alias: string;
}
export declare enum AggregationType {
    COUNT = "COUNT",
    SUM = "SUM",
    AVG = "AVG",
    MIN = "MIN",
    MAX = "MAX",
    FIRST = "FIRST",
    LAST = "LAST"
}
export interface HealthAlert {
    id: string;
    level: AlertLevel;
    message: string;
    timestamp: Date;
}
export interface HealthMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
}
export interface NotificationConfig {
    channels: string[];
    recipients: string[];
    template: string;
}
export declare enum AlertLevel {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export interface GatewayEndpoint {
    path: string;
    method: string;
    target: string;
    authentication: boolean;
    rateLimiting: boolean;
}
export interface GatewayAuthentication {
    enabled: boolean;
    methods: AuthenticationType[];
    providers: AuthProvider[];
}
export interface AuthProvider {
    name: string;
    type: AuthenticationType;
    configuration: Record<string, any>;
}
export interface GatewayRateLimiting {
    enabled: boolean;
    global: RateLimitConfig;
    perEndpoint: Record<string, RateLimitConfig>;
}
export interface GatewayCaching {
    enabled: boolean;
    strategy: CacheStrategy;
    ttl: number;
    size: number;
}
export interface GatewayTransformation {
    request: TransformationRule[];
    response: TransformationRule[];
}
export interface TransformationRule {
    condition: string;
    transformation: string;
}
export interface GatewayMonitoring {
    metrics: boolean;
    logging: boolean;
    tracing: boolean;
    alerts: AlertConfig[];
}
/**
 * High-Performance Integration Engine
 * Manages ultra-fast system integration and data synchronization
 */
export declare class HighPerformanceIntegrationEngine extends EventEmitter {
    private logger;
    private endpoints;
    private flows;
    private batchJobs;
    private streamProcessors;
    private apiGateways;
    private connectionPool;
    private cacheManager;
    private transformationEngine;
    private routingEngine;
    private monitoringEngine;
    private securityEngine;
    private readonly CONFIG;
    constructor();
    private initializeEngine;
    private initializeDefaultEndpoints;
    addEndpoint(endpoint: IntegrationEndpoint): void;
    removeEndpoint(endpointId: string): boolean;
    createIntegrationFlow(flow: IntegrationFlow): void;
    private validateFlow;
    private optimizeFlow;
    executeFlow(flowId: string, data: any): Promise<any>;
    private applyFilters;
    private evaluateCondition;
    private getNestedValue;
    private executeEndpointOperation;
    private applyRateLimit;
    private executeRestOperation;
    private getHttpMethod;
    private executeDatabaseOperation;
    private executeQueueOperation;
    private executeBlockchainOperation;
    private updateEndpointPerformance;
    private updateFlowPerformance;
    private handleFlowError;
    private shouldTriggerAlert;
    private sendAlert;
    createBatchJob(job: BatchJob): void;
    executeBatchJob(jobId: string): Promise<BatchStatistics>;
    private loadBatchSource;
    private processBatch;
    private validateRecord;
    private validateField;
    private writeBatchDestination;
    createStreamProcessor(processor: StreamProcessor): void;
    private startStreamProcessing;
    private processStreamBatch;
    private applyProcessingFunction;
    private applyStreamAggregation;
    private sendToOutputStream;
    createAPIGateway(gateway: APIGateway): void;
    private startHealthMonitoring;
    private performHealthChecks;
    private checkEndpointHealth;
    private startPerformanceMonitoring;
    private collectPerformanceMetrics;
    private setupPerformanceOptimization;
    /**
     * Public API methods
     */
    getEndpoint(endpointId: string): IntegrationEndpoint | null;
    getFlow(flowId: string): IntegrationFlow | null;
    getBatchJob(jobId: string): BatchJob | null;
    getStreamProcessor(processorId: string): StreamProcessor | null;
    getAPIGateway(gatewayId: string): APIGateway | null;
    testEndpoint(endpointId: string): Promise<boolean>;
    getPerformanceMetrics(): any;
    /**
     * Stop the integration engine
     */
    stop(): void;
}
export declare const highPerformanceIntegrationEngine: HighPerformanceIntegrationEngine;
//# sourceMappingURL=AV10-34-HighPerformanceIntegrationEngine.d.ts.map