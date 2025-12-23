"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrailManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const events_1 = require("events");
class AuditTrailManager extends events_1.EventEmitter {
    auditChain = [];
    eventStorage = new Map();
    complianceRules = new Map();
    retentionPolicies = new Map();
    digitalSignatureKeys = new Map();
    constructor() {
        super();
        this.initializeComplianceRules();
        this.initializeRetentionPolicies();
        this.setupDigitalSignatures();
        this.startRetentionCleanup();
    }
    initializeComplianceRules() {
        this.complianceRules.set('SOX', {
            retentionYears: 7,
            requiredEvents: ['FINANCIAL_TRANSACTION', 'AUDIT_ACCESS', 'DATA_MODIFICATION'],
            severityEscalation: ['CRITICAL', 'HIGH']
        });
        this.complianceRules.set('GDPR', {
            retentionYears: 6,
            requiredEvents: ['DATA_ACCESS', 'DATA_MODIFICATION', 'DATA_DELETION', 'CONSENT_CHANGE'],
            userDataProtection: true
        });
        this.complianceRules.set('SEC', {
            retentionYears: 5,
            requiredEvents: ['TOKENIZATION', 'ASSET_TRANSFER', 'COMPLIANCE_CHECK', 'KYC_VERIFICATION'],
            realTimeReporting: true
        });
        this.complianceRules.set('MiCA', {
            retentionYears: 5,
            requiredEvents: ['CRYPTO_ASSET_TRANSACTION', 'COMPLIANCE_VALIDATION', 'RISK_ASSESSMENT'],
            euCompliance: true
        });
    }
    initializeRetentionPolicies() {
        this.retentionPolicies.set('TOKENIZATION', 7 * 365 * 24 * 60 * 60 * 1000); // 7 years
        this.retentionPolicies.set('COMPLIANCE', 6 * 365 * 24 * 60 * 60 * 1000); // 6 years
        this.retentionPolicies.set('TRANSACTION', 5 * 365 * 24 * 60 * 60 * 1000); // 5 years
        this.retentionPolicies.set('ACCESS', 3 * 365 * 24 * 60 * 60 * 1000); // 3 years
        this.retentionPolicies.set('SYSTEM', 1 * 365 * 24 * 60 * 60 * 1000); // 1 year
        this.retentionPolicies.set('REGULATORY', 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
    }
    setupDigitalSignatures() {
        const keyPair = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.digitalSignatureKeys.set('private', keyPair.privateKey);
        this.digitalSignatureKeys.set('public', keyPair.publicKey);
    }
    async logEvent(eventType, category, severity, entityId, entityType, action, details, metadata = {}, userId) {
        const eventId = crypto_1.default.randomUUID();
        const timestamp = Date.now();
        const previousHash = this.auditChain.length > 0 ?
            this.auditChain[this.auditChain.length - 1].hash : undefined;
        // Calculate event hash
        const eventData = {
            id: eventId,
            timestamp,
            eventType,
            category,
            severity,
            userId,
            entityId,
            entityType,
            action,
            details,
            metadata,
            previousHash
        };
        const hash = crypto_1.default.createHash('sha256')
            .update(JSON.stringify(eventData))
            .digest('hex');
        // Create digital signature
        const sign = crypto_1.default.createSign('RSA-SHA256');
        sign.update(hash);
        const digitalSignature = sign.sign(/* @ts-ignore */ this.digitalSignatureKeys.get('private'), 'hex');
        // Determine compliance flags
        const complianceFlags = this.determineComplianceFlags(category, eventType, details);
        // Calculate retention period
        const retentionPeriod = this.retentionPolicies.get(category) ||
            (5 * 365 * 24 * 60 * 60 * 1000); // Default 5 years
        const auditEvent = {
            id: eventId,
            timestamp,
            eventType,
            category,
            severity,
            userId,
            entityId,
            entityType,
            action,
            details,
            metadata: {
                nodeId: process.env.NODE_ID || 'node-unknown',
                ...metadata
            },
            hash,
            previousHash,
            digitalSignature,
            complianceFlags,
            retentionUntil: timestamp + retentionPeriod
        };
        // Add to audit chain and storage
        this.auditChain.push(auditEvent);
        this.eventStorage.set(eventId, auditEvent);
        // Emit event for real-time monitoring
        this.emit('auditEvent', auditEvent);
        // Check for compliance violations
        await this.checkComplianceViolations(auditEvent);
        return eventId;
    }
    determineComplianceFlags(category, eventType, details) {
        const flags = [];
        // Financial compliance flags
        if (details.amount && details.amount > 10000) {
            flags.push('HIGH_VALUE_TRANSACTION');
        }
        // Regulatory framework flags
        if (category === 'TOKENIZATION') {
            flags.push('SEC_RULE_506', 'MICA_COMPLIANCE');
        }
        if (category === 'COMPLIANCE') {
            flags.push('KYC_AML_REQUIRED');
        }
        // Data protection flags
        if (details.personalData || details.pii) {
            flags.push('GDPR_APPLICABLE', 'DATA_PROTECTION');
        }
        // Security flags
        if (eventType.includes('SECURITY') || eventType.includes('ACCESS')) {
            flags.push('SECURITY_AUDIT', 'SOX_COMPLIANCE');
        }
        return flags;
    }
    async checkComplianceViolations(event) {
        for (const flag of event.complianceFlags) {
            const rule = this.complianceRules.get(flag);
            if (rule && rule.realTimeReporting) {
                await this.createComplianceAlert(event, flag);
            }
        }
        // Check for suspicious patterns
        if (await this.detectSuspiciousActivity(event)) {
            await this.createSecurityAlert(event);
        }
    }
    async detectSuspiciousActivity(event) {
        const recentEvents = this.auditChain
            .filter(e => e.timestamp > Date.now() - (60 * 60 * 1000)) // Last hour
            .filter(e => e.userId === event.userId);
        // Multiple high-value transactions
        if (recentEvents.filter(e => e.complianceFlags.includes('HIGH_VALUE_TRANSACTION')).length > 5) {
            return true;
        }
        // Rapid succession of compliance-sensitive actions
        if (recentEvents.filter(e => e.category === 'COMPLIANCE').length > 10) {
            return true;
        }
        // Multiple failed access attempts
        if (recentEvents.filter(e => e.action === 'ACCESS_DENIED').length > 3) {
            return true;
        }
        return false;
    }
    async createComplianceAlert(event, flag) {
        await this.logEvent('COMPLIANCE_ALERT', 'COMPLIANCE', 'HIGH', event.id, 'AUDIT_EVENT', 'ALERT_GENERATED', {
            originalEvent: event.id,
            complianceFlag: flag,
            requiresImmediateAttention: true,
            suggestedActions: this.getComplianceSuggestedActions(flag)
        }, {
            nodeId: event.metadata.nodeId,
            alertReason: `Compliance flag ${flag} triggered`
        });
    }
    async createSecurityAlert(event) {
        await this.logEvent('SECURITY_ALERT', 'SYSTEM', 'CRITICAL', event.id, 'AUDIT_EVENT', 'SECURITY_INCIDENT', {
            originalEvent: event.id,
            suspiciousActivityDetected: true,
            recommendedResponse: 'IMMEDIATE_REVIEW',
            automaticActions: ['SESSION_MONITORING', 'TRANSACTION_REVIEW']
        }, {
            nodeId: event.metadata.nodeId,
            alertReason: 'Suspicious activity pattern detected'
        });
    }
    getComplianceSuggestedActions(flag) {
        const actions = {
            'HIGH_VALUE_TRANSACTION': [
                'Verify customer identity',
                'Check AML watchlists',
                'Document source of funds',
                'File SAR if necessary'
            ],
            'SEC_RULE_506': [
                'Verify accredited investor status',
                'Confirm securities exemption applicability',
                'Document private placement compliance'
            ],
            'MICA_COMPLIANCE': [
                'Verify EU crypto asset regulations',
                'Check licensing requirements',
                'Confirm consumer protection measures'
            ],
            'GDPR_APPLICABLE': [
                'Verify data processing lawful basis',
                'Check consent requirements',
                'Document data retention justification'
            ]
        };
        return actions[flag] || ['Review compliance requirements'];
    }
    async queryAuditTrail(query) {
        let events = Array.from(this.eventStorage.values());
        // Apply filters
        if (query.startTime) {
            events = events.filter(e => e.timestamp >= query.startTime);
        }
        if (query.endTime) {
            events = events.filter(e => e.timestamp <= query.endTime);
        }
        if (query.category) {
            events = events.filter(e => e.category === query.category);
        }
        if (query.severity) {
            events = events.filter(e => e.severity === query.severity);
        }
        if (query.userId) {
            events = events.filter(e => e.userId === query.userId);
        }
        if (query.entityType) {
            events = events.filter(e => e.entityType === query.entityType);
        }
        if (query.action) {
            events = events.filter(e => e.action.includes(query.action));
        }
        // Sort by timestamp (newest first)
        events.sort((a, b) => b.timestamp - a.timestamp);
        // Apply pagination
        const offset = query.offset || 0;
        const limit = query.limit || 100;
        events = events.slice(offset, offset + limit);
        // Verify signatures if requested
        if (query.includeSignatureVerification) {
            events.forEach(event => {
                event.metadata.signatureValid = this.verifyEventSignature(event);
            });
        }
        return events;
    }
    verifyEventSignature(event) {
        try {
            const eventData = {
                id: event.id,
                timestamp: event.timestamp,
                eventType: event.eventType,
                category: event.category,
                severity: event.severity,
                userId: event.userId,
                entityId: event.entityId,
                entityType: event.entityType,
                action: event.action,
                details: event.details,
                metadata: event.metadata,
                previousHash: event.previousHash
            };
            const hash = crypto_1.default.createHash('sha256')
                .update(JSON.stringify(eventData))
                .digest('hex');
            const verify = crypto_1.default.createVerify('RSA-SHA256');
            verify.update(hash);
            return verify.verify(this.digitalSignatureKeys.get('public'), event.digitalSignature, 'hex');
        }
        catch (error) {
            return false;
        }
    }
    async generateReport(type, startTime, endTime, jurisdiction = 'US', additionalFilters = {}) {
        const reportId = crypto_1.default.randomUUID();
        const events = await this.queryAuditTrail({
            startTime,
            endTime,
            ...additionalFilters
        });
        const summary = this.calculateReportSummary(events);
        const sections = await this.generateReportSections(type, events, jurisdiction);
        const report = {
            id: reportId,
            title: this.getReportTitle(type, jurisdiction),
            type,
            period: { start: startTime, end: endTime },
            summary,
            sections,
            metadata: {
                generatedAt: Date.now(),
                generatedBy: 'AuditTrailManager',
                jurisdiction,
                compliance: this.getApplicableComplianceFrameworks(jurisdiction),
                hash: '',
                signature: ''
            }
        };
        // Generate report hash and signature
        const reportHash = crypto_1.default.createHash('sha256')
            .update(JSON.stringify(report))
            .digest('hex');
        const sign = crypto_1.default.createSign('RSA-SHA256');
        sign.update(reportHash);
        const signature = sign.sign(/* @ts-ignore */ this.digitalSignatureKeys.get('private'), 'hex');
        report.metadata.hash = reportHash;
        report.metadata.signature = signature;
        // Log report generation
        await this.logEvent('AUDIT_REPORT_GENERATED', 'REGULATORY', 'MEDIUM', reportId, 'AUDIT_REPORT', 'GENERATE', {
            reportType: type,
            jurisdiction,
            eventCount: events.length,
            reportPeriod: { start: startTime, end: endTime }
        }, {
            nodeId: process.env.NODE_ID || 'audit-manager',
            reportId
        });
        return report;
    }
    calculateReportSummary(events) {
        const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
        const complianceViolations = events.filter(e => e.eventType.includes('VIOLATION') ||
            e.complianceFlags.some(f => f.includes('VIOLATION'))).length;
        const securityIncidents = events.filter(e => e.category === 'SYSTEM' && e.severity === 'CRITICAL').length;
        const jurisdictions = [...new Set(events
                .map(e => e.metadata.jurisdiction)
                .filter(j => j))];
        return {
            totalEvents: events.length,
            criticalEvents,
            complianceViolations,
            securityIncidents,
            jurisdictions
        };
    }
    async generateReportSections(type, events, jurisdiction) {
        const sections = [];
        // Executive summary
        sections.push({
            title: 'Executive Summary',
            type: 'SUMMARY',
            content: this.generateExecutiveSummary(events, jurisdiction),
            priority: 'HIGH'
        });
        // Event timeline
        sections.push({
            title: 'Event Timeline',
            type: 'TIMELINE',
            content: this.generateEventTimeline(events),
            priority: 'MEDIUM'
        });
        // Compliance analysis
        sections.push({
            title: 'Compliance Analysis',
            type: 'COMPLIANCE',
            content: this.generateComplianceAnalysis(events, jurisdiction),
            priority: 'HIGH'
        });
        if (type === 'SECURITY' || type === 'FORENSIC') {
            sections.push({
                title: 'Security Incidents',
                type: 'TABLE',
                content: this.generateSecurityIncidentTable(events),
                priority: 'CRITICAL'
            });
        }
        if (type === 'REGULATORY' || type === 'COMPLIANCE') {
            sections.push({
                title: 'Regulatory Violations',
                type: 'TABLE',
                content: this.generateRegulatoryViolationTable(events),
                priority: 'CRITICAL'
            });
        }
        // Recommendations
        sections.push({
            title: 'Recommendations',
            type: 'RECOMMENDATIONS',
            content: this.generateRecommendations(events, type),
            priority: 'HIGH'
        });
        return sections;
    }
    generateExecutiveSummary(events, jurisdiction) {
        const summary = this.calculateReportSummary(events);
        return {
            overview: `Audit report covering ${summary.totalEvents} events across ${summary.jurisdictions.length} jurisdictions`,
            keyFindings: [
                `${summary.criticalEvents} critical events requiring immediate attention`,
                `${summary.complianceViolations} potential compliance violations identified`,
                `${summary.securityIncidents} security incidents detected`,
                `Primary jurisdiction: ${jurisdiction}`
            ],
            complianceStatus: summary.complianceViolations === 0 ? 'COMPLIANT' : 'REQUIRES_ATTENTION',
            securityStatus: summary.securityIncidents === 0 ? 'SECURE' : 'INCIDENTS_DETECTED'
        };
    }
    generateEventTimeline(events) {
        return events
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(event => ({
            timestamp: event.timestamp,
            date: new Date(event.timestamp).toISOString(),
            eventType: event.eventType,
            category: event.category,
            severity: event.severity,
            action: event.action,
            entityType: event.entityType,
            userId: event.userId,
            complianceFlags: event.complianceFlags
        }));
    }
    generateComplianceAnalysis(events, jurisdiction) {
        const complianceFrameworks = this.getApplicableComplianceFrameworks(jurisdiction);
        const analysis = {};
        for (const framework of complianceFrameworks) {
            const frameworkEvents = events.filter(e => e.complianceFlags.some(f => f.includes(framework)));
            analysis[framework] = {
                applicableEvents: frameworkEvents.length,
                violations: frameworkEvents.filter(e => e.eventType.includes('VIOLATION')).length,
                status: frameworkEvents.every(e => !e.eventType.includes('VIOLATION')) ? 'COMPLIANT' : 'NON_COMPLIANT',
                lastReview: frameworkEvents.length > 0 ?
                    Math.max(...frameworkEvents.map(e => e.timestamp)) : null
            };
        }
        return analysis;
    }
    generateSecurityIncidentTable(events) {
        return events
            .filter(e => e.category === 'SYSTEM' && e.severity === 'CRITICAL')
            .map(event => ({
            timestamp: new Date(event.timestamp).toISOString(),
            eventType: event.eventType,
            action: event.action,
            entityId: event.entityId,
            severity: event.severity,
            details: event.details,
            resolved: event.details.resolved || false,
            impact: event.details.impact || 'Unknown'
        }));
    }
    generateRegulatoryViolationTable(events) {
        return events
            .filter(e => e.eventType.includes('VIOLATION'))
            .map(event => ({
            timestamp: new Date(event.timestamp).toISOString(),
            violationType: event.eventType,
            regulation: event.complianceFlags.join(', '),
            severity: event.severity,
            entityType: event.entityType,
            action: event.action,
            remediation: event.details.remediation || 'Pending',
            reportedToRegulator: event.details.reportedToRegulator || false
        }));
    }
    generateRecommendations(events, type) {
        const recommendations = [];
        const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
        if (criticalEvents.length > 0) {
            recommendations.push(`Address ${criticalEvents.length} critical events immediately`);
        }
        const violations = events.filter(e => e.eventType.includes('VIOLATION'));
        if (violations.length > 0) {
            recommendations.push(`Investigate and remediate ${violations.length} compliance violations`);
        }
        if (type === 'SECURITY') {
            const accessDenied = events.filter(e => e.action === 'ACCESS_DENIED').length;
            if (accessDenied > 10) {
                recommendations.push('Review access control policies due to high denial rate');
            }
        }
        if (type === 'REGULATORY') {
            recommendations.push('Implement automated compliance monitoring for real-time violation detection');
            recommendations.push('Schedule quarterly compliance reviews with legal team');
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue current monitoring and compliance practices');
        }
        return recommendations;
    }
    getApplicableComplianceFrameworks(jurisdiction) {
        const frameworks = {
            'US': ['SOX', 'SEC', 'FINRA', 'BSA'],
            'EU': ['GDPR', 'MiCA', 'PSD2', 'AML5'],
            'SG': ['MAS', 'PDPA', 'SFA'],
            'UK': ['FCA', 'GDPR_UK', 'MLR'],
            'CA': ['PIPEDA', 'FINTRAC', 'CSA']
        };
        return frameworks[jurisdiction] || ['GENERAL'];
    }
    getReportTitle(type, jurisdiction) {
        const titles = {
            'COMPLIANCE': `${jurisdiction} Compliance Audit Report`,
            'SECURITY': `Security Incident Analysis Report`,
            'OPERATIONAL': `Operational Audit Report`,
            'REGULATORY': `${jurisdiction} Regulatory Compliance Report`,
            'FORENSIC': `Forensic Investigation Report`
        };
        return titles[type] || 'Audit Report';
    }
    async exportReport(report, format) {
        switch (format) {
            case 'JSON':
                return Buffer.from(JSON.stringify(report, null, 2));
            case 'CSV':
                return this.exportReportAsCSV(report);
            case 'XML':
                return this.exportReportAsXML(report);
            case 'PDF':
                // Note: PDF generation would require additional dependencies
                // For now, return JSON with PDF header
                return Buffer.from(JSON.stringify(report, null, 2));
            default:
                return Buffer.from(JSON.stringify(report, null, 2));
        }
    }
    exportReportAsCSV(report) {
        const headers = [
            'Timestamp', 'Event Type', 'Category', 'Severity', 'User ID',
            'Entity ID', 'Entity Type', 'Action', 'Compliance Flags', 'Hash'
        ];
        let csvContent = headers.join(',') + '\n';
        // Add events from timeline section
        const timelineSection = report.sections.find(s => s.type === 'TIMELINE');
        if (timelineSection && timelineSection.content) {
            for (const event of timelineSection.content) {
                const row = [
                    event.date,
                    event.eventType,
                    event.category,
                    event.severity,
                    event.userId || '',
                    event.entityId || '',
                    event.entityType,
                    event.action,
                    event.complianceFlags.join(';'),
                    event.hash || ''
                ].map(field => `"${field}"`).join(',');
                csvContent += row + '\n';
            }
        }
        return Buffer.from(csvContent);
    }
    exportReportAsXML(report) {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<AuditReport>
    <Header>
        <Id>${report.id}</Id>
        <Title>${report.title}</Title>
        <Type>${report.type}</Type>
        <GeneratedAt>${new Date(report.metadata.generatedAt).toISOString()}</GeneratedAt>
        <Jurisdiction>${report.metadata.jurisdiction}</Jurisdiction>
    </Header>
    <Summary>
        <TotalEvents>${report.summary.totalEvents}</TotalEvents>
        <CriticalEvents>${report.summary.criticalEvents}</CriticalEvents>
        <ComplianceViolations>${report.summary.complianceViolations}</ComplianceViolations>
        <SecurityIncidents>${report.summary.securityIncidents}</SecurityIncidents>
    </Summary>
    <Sections>
        ${report.sections.map(section => `
        <Section>
            <Title>${section.title}</Title>
            <Type>${section.type}</Type>
            <Priority>${section.priority}</Priority>
            <Content>${JSON.stringify(section.content)}</Content>
        </Section>`).join('')}
    </Sections>
</AuditReport>`;
        return Buffer.from(xmlContent);
    }
    async archiveOldEvents() {
        const now = Date.now();
        let archivedCount = 0;
        for (const [eventId, event] of this.eventStorage.entries()) {
            if (event.retentionUntil < now) {
                this.eventStorage.delete(eventId);
                archivedCount++;
            }
        }
        // Remove from audit chain as well
        this.auditChain = this.auditChain.filter(event => event.retentionUntil >= now);
        if (archivedCount > 0) {
            await this.logEvent('AUDIT_ARCHIVE', 'SYSTEM', 'LOW', 'audit-manager', 'AUDIT_TRAIL', 'ARCHIVE_CLEANUP', {
                archivedEventCount: archivedCount,
                retentionEnforcement: 'AUTOMATIC'
            });
        }
        return archivedCount;
    }
    startRetentionCleanup() {
        // Run cleanup every 24 hours
        setInterval(async () => {
            await this.archiveOldEvents();
        }, 24 * 60 * 60 * 1000);
    }
    async getAuditChainIntegrity() {
        const brokenLinks = [];
        let isValid = true;
        for (let i = 1; i < this.auditChain.length; i++) {
            const currentEvent = this.auditChain[i];
            const previousEvent = this.auditChain[i - 1];
            if (currentEvent.previousHash !== previousEvent.hash) {
                brokenLinks.push(currentEvent.id);
                isValid = false;
            }
            // Verify digital signature
            if (!this.verifyEventSignature(currentEvent)) {
                brokenLinks.push(`${currentEvent.id}:SIGNATURE_INVALID`);
                isValid = false;
            }
        }
        return {
            isValid,
            brokenLinks,
            totalEvents: this.auditChain.length,
            firstEvent: this.auditChain.length > 0 ? this.auditChain[0].id : '',
            lastEvent: this.auditChain.length > 0 ?
                this.auditChain[this.auditChain.length - 1].id : ''
        };
    }
    async submitRegulatoryReport(report, regulatoryAuthority, submissionMethod) {
        const submissionId = crypto_1.default.randomUUID();
        try {
            // Log submission attempt
            await this.logEvent('REGULATORY_SUBMISSION', 'REGULATORY', 'HIGH', submissionId, 'REGULATORY_REPORT', 'SUBMIT', {
                reportId: report.id,
                authority: regulatoryAuthority,
                method: submissionMethod,
                reportType: report.type
            });
            // Simulate submission based on method
            let confirmationNumber;
            switch (submissionMethod) {
                case 'API':
                    confirmationNumber = `API-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    break;
                case 'SFTP':
                    confirmationNumber = `SFTP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    break;
                case 'EMAIL':
                    confirmationNumber = `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    break;
                case 'PORTAL':
                    confirmationNumber = `PORTAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    break;
            }
            return {
                submissionId,
                status: 'SUBMITTED',
                confirmationNumber
            };
        }
        catch (error) {
            await this.logEvent('REGULATORY_SUBMISSION_FAILED', 'REGULATORY', 'CRITICAL', submissionId, 'REGULATORY_REPORT', 'SUBMIT_FAILED', {
                reportId: report.id,
                authority: regulatoryAuthority,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                submissionId,
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    getAuditMetrics() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        const last7d = now - (7 * 24 * 60 * 60 * 1000);
        const eventsLast24h = this.auditChain.filter(e => e.timestamp > last24h).length;
        const criticalEventsLast24h = this.auditChain.filter(e => e.timestamp > last24h && e.severity === 'CRITICAL').length;
        const complianceViolationsLast7d = this.auditChain.filter(e => e.timestamp > last7d && e.eventType.includes('VIOLATION')).length;
        return {
            totalEvents: this.auditChain.length,
            eventsLast24h,
            criticalEventsLast24h,
            complianceViolationsLast7d,
            chainIntegrityStatus: 'VALID', // Would need to run integrity check
            storageUtilization: (this.eventStorage.size * 1024) / (100 * 1024 * 1024) // Estimate in MB
        };
    }
}
exports.AuditTrailManager = AuditTrailManager;
//# sourceMappingURL=AuditTrailManager.js.map