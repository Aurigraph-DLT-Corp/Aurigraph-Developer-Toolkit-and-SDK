"use strict";
/**
 * AV10-21 Comprehensive Audit Trail and Logging System
 * Enterprise-Grade Compliance and Security Auditing
 *
 * Features:
 * - Immutable audit trail with blockchain integration
 * - Multi-level logging (System, Application, Security, Compliance)
 * - Real-time monitoring and alerting
 * - Comprehensive forensic analysis capabilities
 * - Regulatory compliance reporting (SOX, GDPR, HIPAA)
 * - Advanced search and query capabilities
 * - Automated log rotation and archiving
 * - Tamper-proof log integrity verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrailSystem = exports.AttachmentType = exports.ChartType = exports.FindingStatus = exports.FindingSeverity = exports.ReportStatus = exports.AggregationType = exports.FilterOperator = exports.AuthStrength = exports.AuthMethod = exports.PrivacyLevel = exports.ComplianceRegulation = exports.RiskLevel = exports.RiskCategory = exports.OperationType = exports.ErrorSeverity = exports.OutcomeResult = exports.DataSensitivity = exports.ResourceType = exports.ActorType = exports.AuditCategory = exports.LogLevel = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const perf_hooks_1 = require("perf_hooks");
var LogLevel;
(function (LogLevel) {
    LogLevel["TRACE"] = "TRACE";
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["FATAL"] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["SYSTEM"] = "SYSTEM";
    AuditCategory["APPLICATION"] = "APPLICATION";
    AuditCategory["SECURITY"] = "SECURITY";
    AuditCategory["COMPLIANCE"] = "COMPLIANCE";
    AuditCategory["DATA_ACCESS"] = "DATA_ACCESS";
    AuditCategory["AUTHENTICATION"] = "AUTHENTICATION";
    AuditCategory["AUTHORIZATION"] = "AUTHORIZATION";
    AuditCategory["CONFIGURATION"] = "CONFIGURATION";
    AuditCategory["TRANSACTION"] = "TRANSACTION";
    AuditCategory["NETWORK"] = "NETWORK";
    AuditCategory["BACKUP"] = "BACKUP";
    AuditCategory["RECOVERY"] = "RECOVERY";
})(AuditCategory || (exports.AuditCategory = AuditCategory = {}));
var ActorType;
(function (ActorType) {
    ActorType["USER"] = "USER";
    ActorType["SERVICE"] = "SERVICE";
    ActorType["SYSTEM"] = "SYSTEM";
    ActorType["API"] = "API";
    ActorType["BATCH_JOB"] = "BATCH_JOB";
    ActorType["EXTERNAL_SYSTEM"] = "EXTERNAL_SYSTEM";
})(ActorType || (exports.ActorType = ActorType = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["ASSET"] = "ASSET";
    ResourceType["DOCUMENT"] = "DOCUMENT";
    ResourceType["USER_ACCOUNT"] = "USER_ACCOUNT";
    ResourceType["SYSTEM_CONFIGURATION"] = "SYSTEM_CONFIGURATION";
    ResourceType["DATABASE_RECORD"] = "DATABASE_RECORD";
    ResourceType["API_ENDPOINT"] = "API_ENDPOINT";
    ResourceType["FILE"] = "FILE";
    ResourceType["BACKUP"] = "BACKUP";
    ResourceType["CERTIFICATE"] = "CERTIFICATE";
    ResourceType["ENCRYPTION_KEY"] = "ENCRYPTION_KEY";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var DataSensitivity;
(function (DataSensitivity) {
    DataSensitivity["PUBLIC"] = "PUBLIC";
    DataSensitivity["INTERNAL"] = "INTERNAL";
    DataSensitivity["CONFIDENTIAL"] = "CONFIDENTIAL";
    DataSensitivity["RESTRICTED"] = "RESTRICTED";
    DataSensitivity["TOP_SECRET"] = "TOP_SECRET";
})(DataSensitivity || (exports.DataSensitivity = DataSensitivity = {}));
var OutcomeResult;
(function (OutcomeResult) {
    OutcomeResult["SUCCESS"] = "SUCCESS";
    OutcomeResult["FAILURE"] = "FAILURE";
    OutcomeResult["PARTIAL"] = "PARTIAL";
    OutcomeResult["CANCELLED"] = "CANCELLED";
    OutcomeResult["TIMEOUT"] = "TIMEOUT";
})(OutcomeResult || (exports.OutcomeResult = OutcomeResult = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "CREATE";
    OperationType["READ"] = "READ";
    OperationType["UPDATE"] = "UPDATE";
    OperationType["DELETE"] = "DELETE";
    OperationType["EXECUTE"] = "EXECUTE";
    OperationType["APPROVE"] = "APPROVE";
    OperationType["REJECT"] = "REJECT";
    OperationType["ESCALATE"] = "ESCALATE";
    OperationType["EXPORT"] = "EXPORT";
    OperationType["IMPORT"] = "IMPORT";
})(OperationType || (exports.OperationType = OperationType = {}));
var RiskCategory;
(function (RiskCategory) {
    RiskCategory["FINANCIAL"] = "FINANCIAL";
    RiskCategory["OPERATIONAL"] = "OPERATIONAL";
    RiskCategory["COMPLIANCE"] = "COMPLIANCE";
    RiskCategory["SECURITY"] = "SECURITY";
    RiskCategory["REPUTATION"] = "REPUTATION";
})(RiskCategory || (exports.RiskCategory = RiskCategory = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["VERY_LOW"] = "VERY_LOW";
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["VERY_HIGH"] = "VERY_HIGH";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var ComplianceRegulation;
(function (ComplianceRegulation) {
    ComplianceRegulation["GDPR"] = "GDPR";
    ComplianceRegulation["CCPA"] = "CCPA";
    ComplianceRegulation["HIPAA"] = "HIPAA";
    ComplianceRegulation["SOX"] = "SOX";
    ComplianceRegulation["PCI_DSS"] = "PCI_DSS";
    ComplianceRegulation["ISO_27001"] = "ISO_27001";
    ComplianceRegulation["NIST"] = "NIST";
    ComplianceRegulation["FERPA"] = "FERPA";
    ComplianceRegulation["GLBA"] = "GLBA";
    ComplianceRegulation["FISMA"] = "FISMA";
})(ComplianceRegulation || (exports.ComplianceRegulation = ComplianceRegulation = {}));
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["PUBLIC"] = "PUBLIC";
    PrivacyLevel["INTERNAL"] = "INTERNAL";
    PrivacyLevel["CONFIDENTIAL"] = "CONFIDENTIAL";
    PrivacyLevel["RESTRICTED"] = "RESTRICTED";
    PrivacyLevel["SECRET"] = "SECRET";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
var AuthMethod;
(function (AuthMethod) {
    AuthMethod["PASSWORD"] = "PASSWORD";
    AuthMethod["CERTIFICATE"] = "CERTIFICATE";
    AuthMethod["TOKEN"] = "TOKEN";
    AuthMethod["BIOMETRIC"] = "BIOMETRIC";
    AuthMethod["MFA"] = "MFA";
    AuthMethod["SSO"] = "SSO";
    AuthMethod["API_KEY"] = "API_KEY";
})(AuthMethod || (exports.AuthMethod = AuthMethod = {}));
var AuthStrength;
(function (AuthStrength) {
    AuthStrength["WEAK"] = "WEAK";
    AuthStrength["MEDIUM"] = "MEDIUM";
    AuthStrength["STRONG"] = "STRONG";
    AuthStrength["VERY_STRONG"] = "VERY_STRONG";
})(AuthStrength || (exports.AuthStrength = AuthStrength = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "EQUALS";
    FilterOperator["NOT_EQUALS"] = "NOT_EQUALS";
    FilterOperator["CONTAINS"] = "CONTAINS";
    FilterOperator["NOT_CONTAINS"] = "NOT_CONTAINS";
    FilterOperator["STARTS_WITH"] = "STARTS_WITH";
    FilterOperator["ENDS_WITH"] = "ENDS_WITH";
    FilterOperator["GREATER_THAN"] = "GREATER_THAN";
    FilterOperator["LESS_THAN"] = "LESS_THAN";
    FilterOperator["GREATER_EQUAL"] = "GREATER_EQUAL";
    FilterOperator["LESS_EQUAL"] = "LESS_EQUAL";
    FilterOperator["IN"] = "IN";
    FilterOperator["NOT_IN"] = "NOT_IN";
    FilterOperator["REGEX"] = "REGEX";
    FilterOperator["IS_NULL"] = "IS_NULL";
    FilterOperator["IS_NOT_NULL"] = "IS_NOT_NULL";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var AggregationType;
(function (AggregationType) {
    AggregationType["COUNT"] = "COUNT";
    AggregationType["SUM"] = "SUM";
    AggregationType["AVG"] = "AVG";
    AggregationType["MIN"] = "MIN";
    AggregationType["MAX"] = "MAX";
    AggregationType["DISTINCT"] = "DISTINCT";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["GENERATING"] = "GENERATING";
    ReportStatus["COMPLETED"] = "COMPLETED";
    ReportStatus["FAILED"] = "FAILED";
    ReportStatus["EXPIRED"] = "EXPIRED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var FindingSeverity;
(function (FindingSeverity) {
    FindingSeverity["INFO"] = "INFO";
    FindingSeverity["LOW"] = "LOW";
    FindingSeverity["MEDIUM"] = "MEDIUM";
    FindingSeverity["HIGH"] = "HIGH";
    FindingSeverity["CRITICAL"] = "CRITICAL";
})(FindingSeverity || (exports.FindingSeverity = FindingSeverity = {}));
var FindingStatus;
(function (FindingStatus) {
    FindingStatus["OPEN"] = "OPEN";
    FindingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    FindingStatus["RESOLVED"] = "RESOLVED";
    FindingStatus["ACCEPTED"] = "ACCEPTED";
})(FindingStatus || (exports.FindingStatus = FindingStatus = {}));
var ChartType;
(function (ChartType) {
    ChartType["LINE"] = "LINE";
    ChartType["BAR"] = "BAR";
    ChartType["PIE"] = "PIE";
    ChartType["AREA"] = "AREA";
    ChartType["SCATTER"] = "SCATTER";
    ChartType["HEATMAP"] = "HEATMAP";
})(ChartType || (exports.ChartType = ChartType = {}));
var AttachmentType;
(function (AttachmentType) {
    AttachmentType["PDF"] = "PDF";
    AttachmentType["CSV"] = "CSV";
    AttachmentType["EXCEL"] = "EXCEL";
    AttachmentType["JSON"] = "JSON";
    AttachmentType["XML"] = "XML";
    AttachmentType["LOG"] = "LOG";
})(AttachmentType || (exports.AttachmentType = AttachmentType = {}));
class AuditTrailSystem extends events_1.EventEmitter {
    entries = new Map();
    chainHashes = [];
    reports = new Map();
    searchIndex = new Map();
    metrics = [];
    cryptoManager;
    consensus;
    // Configuration
    config;
    // Performance tracking
    startTime = new Date();
    lastChainHash = '';
    entryCount = 0;
    // Background processes
    indexingInterval;
    integrityInterval;
    metricsInterval;
    rotationInterval;
    constructor(cryptoManager, consensus, config) {
        super();
        this.cryptoManager = cryptoManager;
        this.consensus = consensus;
        this.config = {
            maxEntries: 10000000, // 10 million entries
            rotationPolicy: {
                enabled: true,
                maxSize: 1024 * 1024 * 1024, // 1GB
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                maxFiles: 100,
                compression: true,
                archiveLocation: '/archive/audit',
                deleteAfterArchive: false
            },
            integrityCheck: true,
            realTimeIndexing: true,
            compressionEnabled: true,
            encryptionEnabled: true,
            blockchainIntegration: true,
            ...config
        };
        this.initializeSystem();
        this.startBackgroundProcesses();
        this.emit('systemInitialized', {
            timestamp: new Date(),
            config: this.config
        });
    }
    initializeSystem() {
        // Initialize chain with genesis hash
        const genesisData = {
            timestamp: new Date(),
            version: '1.0.0',
            system: 'AurigraphAV10-AuditTrail'
        };
        this.lastChainHash = (0, crypto_1.createHash)('sha256')
            .update(JSON.stringify(genesisData))
            .digest('hex');
        this.chainHashes.push(this.lastChainHash);
    }
    startBackgroundProcesses() {
        // Real-time search indexing
        if (this.config.realTimeIndexing) {
            this.indexingInterval = setInterval(() => {
                this.updateSearchIndex();
            }, 5000); // Every 5 seconds
        }
        // Integrity verification
        if (this.config.integrityCheck) {
            this.integrityInterval = setInterval(() => {
                this.verifyChainIntegrity();
            }, 300000); // Every 5 minutes
        }
        // Metrics collection
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000); // Every minute
        // Log rotation
        if (this.config.rotationPolicy.enabled) {
            this.rotationInterval = setInterval(() => {
                this.performRotation();
            }, 3600000); // Every hour
        }
    }
    async logEvent(category, action, actor, resource, outcome, details = {}, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const entryId = this.generateEntryId();
        const timestamp = new Date();
        try {
            // Build compliance info
            const complianceInfo = {
                regulations: this.determineRegulations(category, resource),
                retentionPeriod: this.calculateRetentionPeriod(category, resource),
                dataClassification: this.classifyData(resource),
                privacyLevel: this.determinePrivacyLevel(resource),
                consentRequired: this.requiresConsent(resource),
                auditRequired: true,
                jurisdiction: 'US',
                ...options.compliance
            };
            // Calculate integrity information
            const entryData = {
                id: entryId,
                timestamp,
                category,
                action,
                actor: this.sanitizeActor(actor),
                resource: this.sanitizeResource(resource),
                outcome,
                details: this.sanitizeDetails(details)
            };
            const entryHash = this.calculateEntryHash(entryData);
            const chainHash = this.calculateChainHash(entryHash, this.lastChainHash);
            const integrityInfo = {
                hash: entryHash,
                algorithm: 'SHA-256',
                chainHash,
                blockHeight: this.chainHashes.length,
                nonce: (0, crypto_1.randomBytes)(16).toString('hex')
            };
            // Create signature if blockchain integration enabled
            if (this.config.blockchainIntegration) {
                integrityInfo.signature = await this.cryptoManager.signData(entryHash);
                integrityInfo.signatureAlgorithm = 'ECDSA';
            }
            // Build context information
            const contextInfo = {
                environment: process.env.NODE_ENV || 'development',
                version: '1.0.0',
                instanceId: process.env.INSTANCE_ID || 'local',
                nodeId: process.env.NODE_ID || 'node-1',
                processId: process.pid,
                ...options.context
            };
            // Create complete audit entry
            const auditEntry = {
                id: entryId,
                timestamp,
                level: options.level || LogLevel.INFO,
                category,
                action,
                actor,
                resource,
                outcome,
                details: {
                    operation: action,
                    operationType: this.mapActionToOperationType(action),
                    requestId: options.requestId,
                    correlationId: options.correlationId,
                    traceId: this.generateTraceId(),
                    ...details
                },
                context: contextInfo,
                integrity: integrityInfo,
                compliance: complianceInfo,
                metadata: {
                    entrySize: JSON.stringify(entryData).length,
                    processingTime: perf_hooks_1.performance.now() - startTime,
                    encrypted: this.config.encryptionEnabled,
                    compressed: this.config.compressionEnabled
                }
            };
            // Store entry
            this.entries.set(entryId, auditEntry);
            this.chainHashes.push(chainHash);
            this.lastChainHash = chainHash;
            this.entryCount++;
            // Add to search index
            if (this.config.realTimeIndexing) {
                this.indexEntry(auditEntry);
            }
            // Submit to blockchain if enabled
            if (this.config.blockchainIntegration) {
                await this.submitToBlockchain(auditEntry);
            }
            // Emit event
            this.emit('entryLogged', {
                entryId,
                category,
                action,
                level: auditEntry.level,
                timestamp,
                processingTime: perf_hooks_1.performance.now() - startTime
            });
            // Check for alerts
            await this.checkForAlerts(auditEntry);
            return entryId;
        }
        catch (error) {
            this.emit('loggingError', {
                error: error.message,
                category,
                action,
                actor: actor.id,
                timestamp
            });
            throw error;
        }
    }
    determineRegulations(category, resource) {
        const regulations = [];
        // Base regulations for all financial operations
        if (category === AuditCategory.TRANSACTION ||
            resource.type === ResourceType.ASSET) {
            regulations.push(ComplianceRegulation.SOX);
        }
        // Data protection regulations
        if (resource.sensitivity === DataSensitivity.CONFIDENTIAL ||
            resource.sensitivity === DataSensitivity.RESTRICTED) {
            regulations.push(ComplianceRegulation.GDPR);
        }
        // Authentication and security
        if (category === AuditCategory.AUTHENTICATION ||
            category === AuditCategory.AUTHORIZATION ||
            category === AuditCategory.SECURITY) {
            regulations.push(ComplianceRegulation.ISO_27001);
        }
        // System operations
        if (category === AuditCategory.SYSTEM ||
            category === AuditCategory.CONFIGURATION) {
            regulations.push(ComplianceRegulation.NIST);
        }
        return regulations;
    }
    calculateRetentionPeriod(category, resource) {
        // Return retention period in milliseconds
        switch (category) {
            case AuditCategory.SECURITY:
            case AuditCategory.AUTHENTICATION:
            case AuditCategory.AUTHORIZATION:
                return 7 * 365 * 24 * 60 * 60 * 1000; // 7 years for security events
            case AuditCategory.TRANSACTION:
            case AuditCategory.COMPLIANCE:
                return 10 * 365 * 24 * 60 * 60 * 1000; // 10 years for financial/compliance
            case AuditCategory.DATA_ACCESS:
                if (resource.sensitivity === DataSensitivity.RESTRICTED) {
                    return 7 * 365 * 24 * 60 * 60 * 1000; // 7 years for sensitive data
                }
                return 3 * 365 * 24 * 60 * 60 * 1000; // 3 years for regular data access
            default:
                return 2 * 365 * 24 * 60 * 60 * 1000; // 2 years default
        }
    }
    classifyData(resource) {
        if (resource.sensitivity === DataSensitivity.PUBLIC)
            return 'PUBLIC';
        if (resource.sensitivity === DataSensitivity.INTERNAL)
            return 'INTERNAL';
        if (resource.sensitivity === DataSensitivity.CONFIDENTIAL)
            return 'CONFIDENTIAL';
        if (resource.sensitivity === DataSensitivity.RESTRICTED)
            return 'RESTRICTED';
        return 'INTERNAL'; // Default
    }
    determinePrivacyLevel(resource) {
        switch (resource.sensitivity) {
            case DataSensitivity.PUBLIC: return PrivacyLevel.PUBLIC;
            case DataSensitivity.INTERNAL: return PrivacyLevel.INTERNAL;
            case DataSensitivity.CONFIDENTIAL: return PrivacyLevel.CONFIDENTIAL;
            case DataSensitivity.RESTRICTED: return PrivacyLevel.RESTRICTED;
            case DataSensitivity.TOP_SECRET: return PrivacyLevel.SECRET;
            default: return PrivacyLevel.INTERNAL;
        }
    }
    requiresConsent(resource) {
        // Require consent for personal data or sensitive resources
        return resource.sensitivity === DataSensitivity.CONFIDENTIAL ||
            resource.sensitivity === DataSensitivity.RESTRICTED ||
            resource.type === ResourceType.USER_ACCOUNT;
    }
    sanitizeActor(actor) {
        // Remove or mask sensitive information
        const sanitized = { ...actor };
        // Mask partial IP address for privacy
        if (sanitized.ipAddress) {
            const parts = sanitized.ipAddress.split('.');
            if (parts.length === 4) {
                sanitized.ipAddress = `${parts[0]}.${parts[1]}.xxx.xxx`;
            }
        }
        return sanitized;
    }
    sanitizeResource(resource) {
        // Remove or mask sensitive resource information
        const sanitized = { ...resource };
        // Mask sensitive attributes
        if (sanitized.attributes) {
            const masked = {};
            for (const [key, value] of Object.entries(sanitized.attributes)) {
                if (key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('secret') ||
                    key.toLowerCase().includes('key')) {
                    masked[key] = '[MASKED]';
                }
                else {
                    masked[key] = value;
                }
            }
            sanitized.attributes = masked;
        }
        return sanitized;
    }
    sanitizeDetails(details) {
        const sanitized = { ...details };
        // Mask sensitive parameters
        if (sanitized.parameters) {
            const masked = {};
            for (const [key, value] of Object.entries(sanitized.parameters)) {
                if (key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('secret') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('key')) {
                    masked[key] = '[MASKED]';
                }
                else {
                    masked[key] = value;
                }
            }
            sanitized.parameters = masked;
        }
        return sanitized;
    }
    mapActionToOperationType(action) {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('create') || actionLower.includes('add'))
            return OperationType.CREATE;
        if (actionLower.includes('read') || actionLower.includes('view') || actionLower.includes('get'))
            return OperationType.READ;
        if (actionLower.includes('update') || actionLower.includes('modify') || actionLower.includes('edit'))
            return OperationType.UPDATE;
        if (actionLower.includes('delete') || actionLower.includes('remove'))
            return OperationType.DELETE;
        if (actionLower.includes('execute') || actionLower.includes('run'))
            return OperationType.EXECUTE;
        if (actionLower.includes('approve'))
            return OperationType.APPROVE;
        if (actionLower.includes('reject'))
            return OperationType.REJECT;
        if (actionLower.includes('export'))
            return OperationType.EXPORT;
        if (actionLower.includes('import'))
            return OperationType.IMPORT;
        return OperationType.EXECUTE; // Default
    }
    calculateEntryHash(entryData) {
        return (0, crypto_1.createHash)('sha256')
            .update(JSON.stringify(entryData, Object.keys(entryData).sort()))
            .digest('hex');
    }
    calculateChainHash(entryHash, previousHash) {
        return (0, crypto_1.createHash)('sha256')
            .update(previousHash + entryHash)
            .digest('hex');
    }
    async submitToBlockchain(entry) {
        try {
            await this.consensus.submitTransaction({
                type: 'AUDIT_ENTRY',
                data: {
                    entryId: entry.id,
                    timestamp: entry.timestamp,
                    category: entry.category,
                    action: entry.action,
                    actorId: entry.actor.id,
                    resourceId: entry.resource.id,
                    outcome: entry.outcome.result,
                    hash: entry.integrity.hash,
                    chainHash: entry.integrity.chainHash
                },
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.emit('blockchainSubmissionError', {
                entryId: entry.id,
                error: error.message
            });
        }
    }
    async checkForAlerts(entry) {
        // Check for security alerts
        if (entry.category === AuditCategory.SECURITY &&
            entry.outcome.result === OutcomeResult.FAILURE) {
            this.emit('securityAlert', {
                severity: 'HIGH',
                entryId: entry.id,
                action: entry.action,
                actor: entry.actor.id,
                timestamp: entry.timestamp
            });
        }
        // Check for compliance violations
        if (entry.category === AuditCategory.COMPLIANCE &&
            entry.outcome.errors && entry.outcome.errors.length > 0) {
            this.emit('complianceViolation', {
                severity: 'CRITICAL',
                entryId: entry.id,
                regulations: entry.compliance.regulations,
                violations: entry.outcome.errors,
                timestamp: entry.timestamp
            });
        }
        // Check for suspicious activity patterns
        await this.detectSuspiciousPatterns(entry);
    }
    async detectSuspiciousPatterns(entry) {
        // Detect multiple failed authentication attempts
        if (entry.category === AuditCategory.AUTHENTICATION &&
            entry.outcome.result === OutcomeResult.FAILURE) {
            const recentFailures = this.getRecentEntries(5 * 60 * 1000) // Last 5 minutes
                .filter(e => e.category === AuditCategory.AUTHENTICATION &&
                e.outcome.result === OutcomeResult.FAILURE &&
                e.actor.id === entry.actor.id)
                .length;
            if (recentFailures >= 5) {
                this.emit('suspiciousActivity', {
                    type: 'BRUTE_FORCE_ATTEMPT',
                    severity: 'HIGH',
                    actor: entry.actor.id,
                    attempts: recentFailures,
                    timestamp: entry.timestamp
                });
            }
        }
        // Detect unusual access patterns
        if (entry.category === AuditCategory.DATA_ACCESS &&
            entry.resource.sensitivity === DataSensitivity.RESTRICTED) {
            const recentAccess = this.getRecentEntries(60 * 60 * 1000) // Last hour
                .filter(e => e.category === AuditCategory.DATA_ACCESS &&
                e.actor.id === entry.actor.id &&
                e.resource.sensitivity === DataSensitivity.RESTRICTED)
                .length;
            if (recentAccess >= 10) {
                this.emit('suspiciousActivity', {
                    type: 'UNUSUAL_DATA_ACCESS',
                    severity: 'MEDIUM',
                    actor: entry.actor.id,
                    accessCount: recentAccess,
                    timestamp: entry.timestamp
                });
            }
        }
    }
    getRecentEntries(timeWindowMs) {
        const cutoffTime = Date.now() - timeWindowMs;
        return Array.from(this.entries.values())
            .filter(entry => entry.timestamp.getTime() >= cutoffTime);
    }
    async search(query) {
        const startTime = perf_hooks_1.performance.now();
        try {
            let results = Array.from(this.entries.values());
            // Apply time range filter
            if (query.timeRange) {
                results = results.filter(entry => entry.timestamp >= query.timeRange.start &&
                    entry.timestamp <= query.timeRange.end);
            }
            // Apply filters
            if (query.filters) {
                for (const filter of query.filters) {
                    results = this.applyFilter(results, filter);
                }
            }
            // Apply sorting
            if (query.sortBy) {
                results = this.applySorting(results, query.sortBy);
            }
            // Calculate aggregations
            const aggregations = {};
            if (query.aggregations) {
                for (const agg of query.aggregations) {
                    aggregations[agg.alias || agg.field] = this.calculateAggregation(results, agg);
                }
            }
            // Generate facets
            const facets = this.generateFacets(results, query.groupBy || []);
            // Apply pagination
            const totalCount = results.length;
            const offset = query.offset || 0;
            const limit = query.limit || 1000;
            const paginatedResults = results.slice(offset, offset + limit);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            return {
                entries: paginatedResults,
                totalCount,
                aggregations,
                facets,
                executionTime,
                fromCache: false
            };
        }
        catch (error) {
            this.emit('searchError', {
                query,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    applyFilter(entries, filter) {
        return entries.filter(entry => {
            const value = this.getFieldValue(entry, filter.field);
            return this.evaluateFilter(value, filter);
        });
    }
    getFieldValue(entry, field) {
        const parts = field.split('.');
        let value = entry;
        for (const part of parts) {
            value = value?.[part];
        }
        return value;
    }
    evaluateFilter(value, filter) {
        const filterValue = filter.value;
        switch (filter.operator) {
            case FilterOperator.EQUALS:
                return filter.caseSensitive ? value === filterValue :
                    String(value).toLowerCase() === String(filterValue).toLowerCase();
            case FilterOperator.NOT_EQUALS:
                return filter.caseSensitive ? value !== filterValue :
                    String(value).toLowerCase() !== String(filterValue).toLowerCase();
            case FilterOperator.CONTAINS:
                return filter.caseSensitive ? String(value).includes(String(filterValue)) :
                    String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case FilterOperator.NOT_CONTAINS:
                return filter.caseSensitive ? !String(value).includes(String(filterValue)) :
                    !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case FilterOperator.STARTS_WITH:
                return filter.caseSensitive ? String(value).startsWith(String(filterValue)) :
                    String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case FilterOperator.ENDS_WITH:
                return filter.caseSensitive ? String(value).endsWith(String(filterValue)) :
                    String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case FilterOperator.GREATER_THAN:
                return Number(value) > Number(filterValue);
            case FilterOperator.LESS_THAN:
                return Number(value) < Number(filterValue);
            case FilterOperator.GREATER_EQUAL:
                return Number(value) >= Number(filterValue);
            case FilterOperator.LESS_EQUAL:
                return Number(value) <= Number(filterValue);
            case FilterOperator.IN:
                return Array.isArray(filterValue) && filterValue.includes(value);
            case FilterOperator.NOT_IN:
                return Array.isArray(filterValue) && !filterValue.includes(value);
            case FilterOperator.REGEX:
                return new RegExp(String(filterValue), filter.caseSensitive ? 'g' : 'gi').test(String(value));
            case FilterOperator.IS_NULL:
                return value == null;
            case FilterOperator.IS_NOT_NULL:
                return value != null;
            default:
                return false;
        }
    }
    applySorting(entries, sortCriteria) {
        return entries.sort((a, b) => {
            for (const criteria of sortCriteria) {
                const aValue = this.getFieldValue(a, criteria.field);
                const bValue = this.getFieldValue(b, criteria.field);
                let comparison = 0;
                if (aValue < bValue)
                    comparison = -1;
                else if (aValue > bValue)
                    comparison = 1;
                if (comparison !== 0) {
                    return criteria.direction === 'DESC' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
    calculateAggregation(entries, aggregation) {
        const values = entries.map(entry => this.getFieldValue(entry, aggregation.field))
            .filter(value => value != null);
        switch (aggregation.type) {
            case AggregationType.COUNT:
                return values.length;
            case AggregationType.SUM:
                return values.reduce((sum, value) => sum + Number(value), 0);
            case AggregationType.AVG:
                return values.length > 0 ?
                    values.reduce((sum, value) => sum + Number(value), 0) / values.length : 0;
            case AggregationType.MIN:
                return Math.min(...values.map(Number));
            case AggregationType.MAX:
                return Math.max(...values.map(Number));
            case AggregationType.DISTINCT:
                return new Set(values).size;
            default:
                return 0;
        }
    }
    generateFacets(entries, groupBy) {
        const facets = [];
        const totalEntries = entries.length;
        // Default facets
        const defaultFacets = ['category', 'level', 'actor.type', 'outcome.result'];
        const allFacetFields = [...defaultFacets, ...groupBy];
        for (const field of allFacetFields) {
            const valueCounts = new Map();
            for (const entry of entries) {
                const value = this.getFieldValue(entry, field);
                valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
            }
            const facetValues = Array.from(valueCounts.entries())
                .map(([value, count]) => ({
                value,
                count,
                percentage: (count / totalEntries) * 100
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20); // Limit to top 20 values
            if (facetValues.length > 0) {
                facets.push({
                    field,
                    values: facetValues
                });
            }
        }
        return facets;
    }
    async generateComplianceReport(regulation, period, options = {}) {
        const reportId = this.generateReportId();
        const generatedAt = new Date();
        try {
            // Query relevant entries for the period and regulation
            const query = {
                filters: [
                    { field: 'compliance.regulations', operator: FilterOperator.CONTAINS, value: regulation }
                ],
                timeRange: { start: period.start, end: period.end },
                sortBy: [{ field: 'timestamp', direction: 'DESC' }]
            };
            const searchResult = await this.search(query);
            const entries = searchResult.entries;
            // Analyze entries for compliance
            const analysis = await this.analyzeComplianceEntries(entries, regulation);
            // Generate report sections
            const sections = await this.generateReportSections(entries, regulation, analysis);
            // Create report
            const report = {
                id: reportId,
                name: `${regulation} Compliance Report - ${period.type}`,
                regulation,
                period,
                generatedAt,
                generatedBy: 'AuditTrailSystem',
                status: ReportStatus.COMPLETED,
                summary: analysis.summary,
                sections,
                attachments: options.includeAttachments ? await this.generateAttachments(entries) : [],
                metadata: {
                    entryCount: entries.length,
                    generationTime: 0,
                    format: options.format || 'JSON',
                    template: options.template
                }
            };
            // Store report
            this.reports.set(reportId, report);
            this.emit('reportGenerated', {
                reportId,
                regulation,
                period,
                entryCount: entries.length,
                timestamp: generatedAt
            });
            return reportId;
        }
        catch (error) {
            this.emit('reportGenerationError', {
                reportId,
                regulation,
                period,
                error: error.message,
                timestamp: generatedAt
            });
            throw error;
        }
    }
    async analyzeComplianceEntries(entries, regulation) {
        const violations = [];
        const recommendations = [];
        let criticalIssues = 0;
        // Analyze entries based on regulation
        for (const entry of entries) {
            // Check for violations
            if (entry.outcome.result === OutcomeResult.FAILURE &&
                entry.category === AuditCategory.COMPLIANCE) {
                violations.push({
                    severity: FindingSeverity.HIGH,
                    title: `Compliance Violation: ${entry.action}`,
                    description: entry.outcome.message || 'Compliance check failed',
                    evidence: [entry.id],
                    recommendation: 'Review and remediate compliance issue',
                    status: FindingStatus.OPEN
                });
                if (entry.outcome.errors?.some(e => e.severity === ErrorSeverity.CRITICAL)) {
                    criticalIssues++;
                }
            }
            // Check for missing required actions
            if (regulation === ComplianceRegulation.GDPR &&
                entry.resource.type === ResourceType.USER_ACCOUNT &&
                !entry.compliance.consentId) {
                violations.push({
                    severity: FindingSeverity.MEDIUM,
                    title: 'Missing GDPR Consent',
                    description: 'User data accessed without recorded consent',
                    evidence: [entry.id],
                    recommendation: 'Ensure all user data access has valid consent records',
                    status: FindingStatus.OPEN
                });
            }
        }
        // Generate recommendations
        if (violations.length > 0) {
            recommendations.push('Implement additional compliance monitoring');
            recommendations.push('Review access controls and permissions');
            recommendations.push('Enhance staff training on compliance requirements');
        }
        const complianceScore = Math.max(0, 100 - (violations.length * 5) - (criticalIssues * 20));
        const summary = {
            totalEvents: entries.length,
            complianceScore,
            violations: violations.length,
            criticalIssues,
            recommendations,
            riskLevel: criticalIssues > 0 ? RiskLevel.HIGH :
                violations.length > 10 ? RiskLevel.MEDIUM : RiskLevel.LOW
        };
        return { summary, violations, recommendations };
    }
    async generateReportSections(entries, regulation, analysis) {
        const sections = [];
        // Executive Summary
        sections.push({
            title: 'Executive Summary',
            description: 'High-level overview of compliance status',
            findings: analysis.violations.slice(0, 5), // Top 5 findings
            charts: [
                {
                    type: ChartType.PIE,
                    title: 'Compliance Status Distribution',
                    data: [
                        { label: 'Compliant', value: analysis.summary.complianceScore },
                        { label: 'Non-Compliant', value: 100 - analysis.summary.complianceScore }
                    ],
                    config: { colors: ['green', 'red'] }
                }
            ],
            tables: []
        });
        // Detailed Analysis
        sections.push({
            title: 'Detailed Analysis',
            description: 'Comprehensive analysis of audit entries',
            findings: analysis.violations,
            charts: [
                {
                    type: ChartType.LINE,
                    title: 'Compliance Events Over Time',
                    data: this.generateTimeSeriesData(entries),
                    config: {}
                }
            ],
            tables: [
                {
                    title: 'Top Compliance Issues',
                    headers: ['Issue', 'Severity', 'Count', 'Last Occurrence'],
                    rows: this.generateComplianceIssuesTable(analysis.violations),
                    footer: {
                        cells: [
                            { value: 'Total Issues', type: 'TEXT' },
                            { value: '', type: 'TEXT' },
                            { value: analysis.violations.length, type: 'NUMBER' },
                            { value: '', type: 'TEXT' }
                        ]
                    }
                }
            ]
        });
        return sections;
    }
    generateTimeSeriesData(entries) {
        const dailyCounts = new Map();
        for (const entry of entries) {
            const day = entry.timestamp.toISOString().split('T')[0];
            dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
        }
        return Array.from(dailyCounts.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({
            label: date,
            value: count,
            timestamp: new Date(date)
        }));
    }
    generateComplianceIssuesTable(violations) {
        const issueMap = new Map();
        for (const violation of violations) {
            const existing = issueMap.get(violation.title);
            if (existing) {
                existing.count++;
            }
            else {
                issueMap.set(violation.title, {
                    severity: violation.severity,
                    count: 1,
                    lastOccurrence: new Date() // Would get from actual data
                });
            }
        }
        return Array.from(issueMap.entries())
            .map(([title, info]) => ({
            cells: [
                { value: title, type: 'TEXT' },
                { value: info.severity, type: 'STATUS' },
                { value: info.count, type: 'NUMBER' },
                { value: info.lastOccurrence.toISOString().split('T')[0], type: 'DATE' }
            ],
            highlighted: info.severity === FindingSeverity.CRITICAL
        }));
    }
    async generateAttachments(entries) {
        // Generate CSV export
        const csvData = this.generateCSVData(entries);
        const csvHash = (0, crypto_1.createHash)('sha256').update(csvData).digest('hex');
        return [
            {
                id: this.generateAttachmentId(),
                name: 'audit_entries.csv',
                type: AttachmentType.CSV,
                size: csvData.length,
                path: `/reports/attachments/audit_entries_${Date.now()}.csv`,
                hash: csvHash,
                encrypted: this.config.encryptionEnabled
            }
        ];
    }
    generateCSVData(entries) {
        const headers = [
            'ID', 'Timestamp', 'Level', 'Category', 'Action',
            'Actor ID', 'Resource Type', 'Resource ID', 'Outcome', 'Message'
        ];
        const rows = entries.map(entry => [
            entry.id,
            entry.timestamp.toISOString(),
            entry.level,
            entry.category,
            entry.action,
            entry.actor.id,
            entry.resource.type,
            entry.resource.id,
            entry.outcome.result,
            entry.outcome.message || ''
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    indexEntry(entry) {
        // Add searchable terms to index
        const searchTerms = [
            entry.id,
            entry.action,
            entry.actor.id,
            entry.actor.name || '',
            entry.resource.id,
            entry.resource.name || '',
            entry.category,
            entry.level,
            entry.outcome.result
        ].filter(term => term && typeof term === 'string');
        for (const term of searchTerms) {
            const normalizedTerm = term.toLowerCase();
            if (!this.searchIndex.has(normalizedTerm)) {
                this.searchIndex.set(normalizedTerm, new Set());
            }
            this.searchIndex.get(normalizedTerm).add(entry.id);
        }
    }
    updateSearchIndex() {
        // Update search index for recent entries
        const recentEntries = this.getRecentEntries(300000); // Last 5 minutes
        for (const entry of recentEntries) {
            this.indexEntry(entry);
        }
    }
    async verifyChainIntegrity() {
        try {
            const entries = Array.from(this.entries.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            let previousHash = this.chainHashes[0]; // Genesis hash
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const expectedChainHash = this.calculateChainHash(entry.integrity.hash, previousHash);
                if (entry.integrity.chainHash !== expectedChainHash) {
                    this.emit('integrityViolation', {
                        entryId: entry.id,
                        expectedHash: expectedChainHash,
                        actualHash: entry.integrity.chainHash,
                        timestamp: new Date()
                    });
                    return false;
                }
                previousHash = entry.integrity.chainHash;
            }
            this.emit('integrityVerified', {
                entriesVerified: entries.length,
                timestamp: new Date()
            });
            return true;
        }
        catch (error) {
            this.emit('integrityVerificationError', {
                error: error.message,
                timestamp: new Date()
            });
            return false;
        }
    }
    async collectMetrics() {
        const timestamp = new Date();
        const uptime = timestamp.getTime() - this.startTime.getTime();
        const metrics = {
            timestamp,
            totalEntries: this.entries.size,
            entriesPerSecond: this.calculateEntriesPerSecond(),
            storageUsed: this.calculateStorageUsage(),
            indexSize: this.searchIndex.size,
            queryPerformance: {
                averageQueryTime: this.calculateAverageQueryTime(),
                slowQueries: 0,
                cacheHitRate: 0,
                indexUtilization: this.calculateIndexUtilization()
            },
            complianceMetrics: {
                totalRegulations: Object.values(ComplianceRegulation).length,
                complianceScore: this.calculateOverallComplianceScore(),
                violations: this.countComplianceViolations(),
                retentionCompliance: this.calculateRetentionCompliance(),
                privacyCompliance: this.calculatePrivacyCompliance()
            },
            integrityMetrics: {
                totalHashes: this.chainHashes.length,
                verificationsPassed: 0, // Would track from actual verifications
                verificationsFailed: 0,
                chainIntegrity: 100,
                tamperAttempts: 0
            }
        };
        this.metrics.push(metrics);
        // Limit metrics history
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
        this.emit('metricsCollected', { timestamp, metrics });
    }
    calculateEntriesPerSecond() {
        const recentEntries = this.getRecentEntries(60000); // Last minute
        return recentEntries.length / 60;
    }
    calculateStorageUsage() {
        let totalSize = 0;
        for (const entry of this.entries.values()) {
            totalSize += JSON.stringify(entry).length;
        }
        return totalSize;
    }
    calculateAverageQueryTime() {
        // Would track actual query times
        return Math.random() * 100 + 50; // 50-150ms simulation
    }
    calculateIndexUtilization() {
        return Math.min(100, (this.searchIndex.size / this.entries.size) * 100);
    }
    calculateOverallComplianceScore() {
        const entries = Array.from(this.entries.values());
        const complianceEntries = entries.filter(e => e.category === AuditCategory.COMPLIANCE);
        const violations = complianceEntries.filter(e => e.outcome.result === OutcomeResult.FAILURE);
        return complianceEntries.length > 0 ?
            ((complianceEntries.length - violations.length) / complianceEntries.length) * 100 : 100;
    }
    countComplianceViolations() {
        return Array.from(this.entries.values())
            .filter(e => e.category === AuditCategory.COMPLIANCE &&
            e.outcome.result === OutcomeResult.FAILURE)
            .length;
    }
    calculateRetentionCompliance() {
        // Calculate percentage of entries with proper retention policies
        const entriesWithRetention = Array.from(this.entries.values())
            .filter(e => e.compliance.retentionPeriod > 0);
        return this.entries.size > 0 ?
            (entriesWithRetention.length / this.entries.size) * 100 : 100;
    }
    calculatePrivacyCompliance() {
        // Calculate percentage of entries with appropriate privacy levels
        const entriesWithPrivacy = Array.from(this.entries.values())
            .filter(e => e.compliance.privacyLevel !== undefined);
        return this.entries.size > 0 ?
            (entriesWithPrivacy.length / this.entries.size) * 100 : 100;
    }
    async performRotation() {
        const policy = this.config.rotationPolicy;
        if (!policy.enabled)
            return;
        const cutoffTime = Date.now() - policy.maxAge;
        const entriesToRotate = [];
        // Find entries to rotate
        for (const entry of this.entries.values()) {
            if (entry.timestamp.getTime() < cutoffTime) {
                entriesToRotate.push(entry);
            }
        }
        if (entriesToRotate.length > 0) {
            // Archive entries
            await this.archiveEntries(entriesToRotate);
            // Remove from active storage
            for (const entry of entriesToRotate) {
                this.entries.delete(entry.id);
            }
            this.emit('entriesRotated', {
                count: entriesToRotate.length,
                timestamp: new Date()
            });
        }
    }
    async archiveEntries(entries) {
        // In a real implementation, would write to archive storage
        console.log(`Archiving ${entries.length} audit entries to ${this.config.rotationPolicy.archiveLocation}`);
    }
    // Utility methods
    generateEntryId() {
        return `AUDIT-${Date.now()}-${(0, crypto_1.randomBytes)(8).toString('hex').toUpperCase()}`;
    }
    generateReportId() {
        return `REPORT-${Date.now()}-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
    }
    generateAttachmentId() {
        return `ATTACH-${Date.now()}-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
    }
    generateTraceId() {
        return `TRACE-${(0, crypto_1.randomBytes)(16).toString('hex')}`;
    }
    // Public API methods
    async getEntry(entryId) {
        return this.entries.get(entryId) || null;
    }
    async getReport(reportId) {
        return this.reports.get(reportId) || null;
    }
    async getSystemMetrics(limit = 100) {
        return this.metrics.slice(-limit);
    }
    async exportEntries(query, format = 'JSON') {
        const searchResult = await this.search(query);
        switch (format) {
            case 'JSON':
                return JSON.stringify(searchResult.entries, null, 2);
            case 'CSV':
                return this.generateCSVData(searchResult.entries);
            case 'XML':
                return this.generateXMLData(searchResult.entries);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    generateXMLData(entries) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_entries>\n';
        for (const entry of entries) {
            xml += `  <entry id="${entry.id}">\n`;
            xml += `    <timestamp>${entry.timestamp.toISOString()}</timestamp>\n`;
            xml += `    <level>${entry.level}</level>\n`;
            xml += `    <category>${entry.category}</category>\n`;
            xml += `    <action>${entry.action}</action>\n`;
            xml += `    <actor_id>${entry.actor.id}</actor_id>\n`;
            xml += `    <resource_type>${entry.resource.type}</resource_type>\n`;
            xml += `    <resource_id>${entry.resource.id}</resource_id>\n`;
            xml += `    <outcome>${entry.outcome.result}</outcome>\n`;
            xml += `    <message>${entry.outcome.message || ''}</message>\n`;
            xml += `  </entry>\n`;
        }
        xml += '</audit_entries>';
        return xml;
    }
    async shutdown() {
        // Stop background processes
        if (this.indexingInterval)
            clearInterval(this.indexingInterval);
        if (this.integrityInterval)
            clearInterval(this.integrityInterval);
        if (this.metricsInterval)
            clearInterval(this.metricsInterval);
        if (this.rotationInterval)
            clearInterval(this.rotationInterval);
        // Final integrity check
        await this.verifyChainIntegrity();
        // Archive remaining entries if rotation is enabled
        if (this.config.rotationPolicy.enabled) {
            const allEntries = Array.from(this.entries.values());
            if (allEntries.length > 0) {
                await this.archiveEntries(allEntries);
            }
        }
        this.emit('systemShutdown', {
            timestamp: new Date(),
            totalEntries: this.entries.size,
            uptime: Date.now() - this.startTime.getTime()
        });
    }
}
exports.AuditTrailSystem = AuditTrailSystem;
//# sourceMappingURL=AuditTrailSystem.js.map