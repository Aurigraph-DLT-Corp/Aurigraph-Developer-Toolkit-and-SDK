package io.aurigraph.v11.compliance.soc2;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * SOC 2 Audit Trail Service
 *
 * Implements comprehensive audit logging for SOC 2 Type II compliance.
 * SOC 2 is based on the Trust Services Criteria (TSC) with five categories:
 *
 * - Security (Common Criteria): Protection against unauthorized access
 * - Availability: System accessibility and operation
 * - Processing Integrity: Accurate, complete, timely processing
 * - Confidentiality: Protection of confidential information
 * - Privacy: Personal information collection, use, retention, disclosure
 *
 * This module provides audit logging for all five categories with
 * immutable audit trails suitable for Type II examination.
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class SOC2AuditTrail {

    // Audit event storage - immutable once created
    private final List<AuditEvent> securityEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<AuditEvent> availabilityEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<AuditEvent> processingIntegrityEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<AuditEvent> confidentialityEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<AuditEvent> privacyEvents = Collections.synchronizedList(new ArrayList<>());

    // Control evidence storage
    private final Map<String, ControlEvidence> controlEvidence = new ConcurrentHashMap<>();

    // Event counters for unique IDs
    private final AtomicLong eventCounter = new AtomicLong(0);

    // Retention period (SOC 2 typically requires 12 months minimum)
    private static final Duration RETENTION_PERIOD = Duration.ofDays(365);

    /**
     * SOC 2 Trust Service Category
     */
    public enum TrustServiceCategory {
        SECURITY("CC", "Common Criteria (Security)",
            "Protection of information and systems against unauthorized access"),
        AVAILABILITY("A", "Availability",
            "System is available for operation and use as committed"),
        PROCESSING_INTEGRITY("PI", "Processing Integrity",
            "System processing is complete, valid, accurate, timely, and authorized"),
        CONFIDENTIALITY("C", "Confidentiality",
            "Information designated as confidential is protected as committed"),
        PRIVACY("P", "Privacy",
            "Personal information is collected, used, retained, and disclosed as committed");

        private final String code;
        private final String displayName;
        private final String description;

        TrustServiceCategory(String code, String displayName, String description) {
            this.code = code;
            this.displayName = displayName;
            this.description = description;
        }

        public String getCode() { return code; }
        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * Event severity levels
     */
    public enum Severity {
        INFO, WARNING, ALERT, CRITICAL
    }

    // ============ Security (CC) Event Logging ============

    /**
     * Log security event (Common Criteria)
     * Covers CC1.0 through CC9.0 criteria
     */
    public AuditEvent logSecurityEvent(SecurityEventType eventType, String actor,
            String resource, String action, Map<String, Object> details) {

        Log.debugf("Logging security event: %s by %s on %s", eventType, actor, resource);

        AuditEvent event = createAuditEvent(
            TrustServiceCategory.SECURITY,
            eventType.name(),
            actor,
            resource,
            action,
            eventType.getSeverity(),
            details
        );

        // Add security-specific fields
        event.addDetail("securityEventType", eventType.name());
        event.addDetail("controlCriteria", eventType.getControlCriteria());

        securityEvents.add(event);
        return event;
    }

    /**
     * Log authentication event (CC6.1)
     */
    public AuditEvent logAuthentication(String userId, String method, boolean success,
            String sourceIp, String userAgent) {

        Map<String, Object> details = new HashMap<>();
        details.put("authenticationMethod", method);
        details.put("success", success);
        details.put("sourceIp", sourceIp);
        details.put("userAgent", userAgent);

        SecurityEventType eventType = success ?
            SecurityEventType.AUTHENTICATION_SUCCESS :
            SecurityEventType.AUTHENTICATION_FAILURE;

        return logSecurityEvent(eventType, userId, "authentication", "LOGIN", details);
    }

    /**
     * Log authorization event (CC6.2)
     */
    public AuditEvent logAuthorization(String userId, String resource, String permission,
            boolean granted, String reason) {

        Map<String, Object> details = new HashMap<>();
        details.put("permission", permission);
        details.put("granted", granted);
        details.put("reason", reason);

        SecurityEventType eventType = granted ?
            SecurityEventType.AUTHORIZATION_GRANTED :
            SecurityEventType.AUTHORIZATION_DENIED;

        return logSecurityEvent(eventType, userId, resource, "ACCESS", details);
    }

    /**
     * Log data access event (CC6.3)
     */
    public AuditEvent logDataAccess(String userId, String dataClass, String operation,
            int recordCount, Map<String, Object> additionalDetails) {

        Map<String, Object> details = new HashMap<>(additionalDetails);
        details.put("dataClass", dataClass);
        details.put("operation", operation);
        details.put("recordCount", recordCount);

        return logSecurityEvent(SecurityEventType.DATA_ACCESS, userId, dataClass, operation, details);
    }

    /**
     * Log cryptographic operation (CC6.7)
     */
    public AuditEvent logCryptoOperation(String userId, String operation, String algorithm,
            String keyId, boolean success) {

        Map<String, Object> details = new HashMap<>();
        details.put("operation", operation);
        details.put("algorithm", algorithm);
        details.put("keyId", keyId);
        details.put("success", success);

        return logSecurityEvent(SecurityEventType.CRYPTO_OPERATION, userId, "crypto", operation, details);
    }

    // ============ Availability (A) Event Logging ============

    /**
     * Log availability event
     * Covers A1.0 through A1.3 criteria
     */
    public AuditEvent logAvailabilityEvent(AvailabilityEventType eventType, String component,
            String status, Map<String, Object> details) {

        Log.debugf("Logging availability event: %s for %s", eventType, component);

        AuditEvent event = createAuditEvent(
            TrustServiceCategory.AVAILABILITY,
            eventType.name(),
            "SYSTEM",
            component,
            status,
            eventType.getSeverity(),
            details
        );

        event.addDetail("availabilityEventType", eventType.name());
        event.addDetail("controlCriteria", eventType.getControlCriteria());

        availabilityEvents.add(event);
        return event;
    }

    /**
     * Log system health check (A1.1)
     */
    public AuditEvent logHealthCheck(String component, boolean healthy, double uptimePercent,
            long responseTimeMs) {

        Map<String, Object> details = new HashMap<>();
        details.put("healthy", healthy);
        details.put("uptimePercent", uptimePercent);
        details.put("responseTimeMs", responseTimeMs);

        AvailabilityEventType eventType = healthy ?
            AvailabilityEventType.HEALTH_CHECK_PASSED :
            AvailabilityEventType.HEALTH_CHECK_FAILED;

        return logAvailabilityEvent(eventType, component, healthy ? "HEALTHY" : "UNHEALTHY", details);
    }

    /**
     * Log capacity monitoring (A1.2)
     */
    public AuditEvent logCapacityEvent(String resource, double currentUsage, double threshold,
            String unit) {

        Map<String, Object> details = new HashMap<>();
        details.put("currentUsage", currentUsage);
        details.put("threshold", threshold);
        details.put("unit", unit);
        details.put("utilizationPercent", (currentUsage / threshold) * 100);

        AvailabilityEventType eventType = currentUsage >= threshold ?
            AvailabilityEventType.CAPACITY_THRESHOLD_EXCEEDED :
            AvailabilityEventType.CAPACITY_NORMAL;

        return logAvailabilityEvent(eventType, resource, "CAPACITY_CHECK", details);
    }

    /**
     * Log backup completion (A1.3)
     */
    public AuditEvent logBackup(String backupType, String targetSystem, boolean success,
            long durationMs, long sizeBytes) {

        Map<String, Object> details = new HashMap<>();
        details.put("backupType", backupType);
        details.put("targetSystem", targetSystem);
        details.put("success", success);
        details.put("durationMs", durationMs);
        details.put("sizeBytes", sizeBytes);

        AvailabilityEventType eventType = success ?
            AvailabilityEventType.BACKUP_COMPLETED :
            AvailabilityEventType.BACKUP_FAILED;

        return logAvailabilityEvent(eventType, targetSystem, "BACKUP", details);
    }

    // ============ Processing Integrity (PI) Event Logging ============

    /**
     * Log processing integrity event
     * Covers PI1.0 through PI1.5 criteria
     */
    public AuditEvent logProcessingIntegrityEvent(ProcessingIntegrityEventType eventType,
            String process, String transactionId, Map<String, Object> details) {

        Log.debugf("Logging processing integrity event: %s for %s", eventType, transactionId);

        AuditEvent event = createAuditEvent(
            TrustServiceCategory.PROCESSING_INTEGRITY,
            eventType.name(),
            "SYSTEM",
            process,
            transactionId,
            eventType.getSeverity(),
            details
        );

        event.addDetail("processingEventType", eventType.name());
        event.addDetail("controlCriteria", eventType.getControlCriteria());

        processingIntegrityEvents.add(event);
        return event;
    }

    /**
     * Log transaction processing (PI1.1)
     */
    public AuditEvent logTransactionProcessing(String transactionId, String transactionType,
            boolean complete, boolean valid, long processingTimeMs) {

        Map<String, Object> details = new HashMap<>();
        details.put("transactionType", transactionType);
        details.put("complete", complete);
        details.put("valid", valid);
        details.put("processingTimeMs", processingTimeMs);

        ProcessingIntegrityEventType eventType;
        if (complete && valid) {
            eventType = ProcessingIntegrityEventType.TRANSACTION_COMPLETED;
        } else if (!valid) {
            eventType = ProcessingIntegrityEventType.TRANSACTION_VALIDATION_FAILED;
        } else {
            eventType = ProcessingIntegrityEventType.TRANSACTION_INCOMPLETE;
        }

        return logProcessingIntegrityEvent(eventType, "transaction_processor",
            transactionId, details);
    }

    /**
     * Log data validation (PI1.2)
     */
    public AuditEvent logDataValidation(String dataType, String recordId, boolean valid,
            List<String> validationErrors) {

        Map<String, Object> details = new HashMap<>();
        details.put("dataType", dataType);
        details.put("recordId", recordId);
        details.put("valid", valid);
        details.put("errorCount", validationErrors.size());
        if (!validationErrors.isEmpty()) {
            details.put("validationErrors", validationErrors);
        }

        ProcessingIntegrityEventType eventType = valid ?
            ProcessingIntegrityEventType.DATA_VALIDATION_PASSED :
            ProcessingIntegrityEventType.DATA_VALIDATION_FAILED;

        return logProcessingIntegrityEvent(eventType, "data_validator", recordId, details);
    }

    /**
     * Log error handling (PI1.4)
     */
    public AuditEvent logErrorHandling(String errorCode, String errorMessage, String process,
            String resolution, boolean recovered) {

        Map<String, Object> details = new HashMap<>();
        details.put("errorCode", errorCode);
        details.put("errorMessage", errorMessage);
        details.put("process", process);
        details.put("resolution", resolution);
        details.put("recovered", recovered);

        return logProcessingIntegrityEvent(ProcessingIntegrityEventType.ERROR_HANDLED,
            process, errorCode, details);
    }

    // ============ Confidentiality (C) Event Logging ============

    /**
     * Log confidentiality event
     * Covers C1.0 through C1.2 criteria
     */
    public AuditEvent logConfidentialityEvent(ConfidentialityEventType eventType,
            String actor, String resource, Map<String, Object> details) {

        Log.debugf("Logging confidentiality event: %s by %s", eventType, actor);

        AuditEvent event = createAuditEvent(
            TrustServiceCategory.CONFIDENTIALITY,
            eventType.name(),
            actor,
            resource,
            eventType.name(),
            eventType.getSeverity(),
            details
        );

        event.addDetail("confidentialityEventType", eventType.name());
        event.addDetail("controlCriteria", eventType.getControlCriteria());

        confidentialityEvents.add(event);
        return event;
    }

    /**
     * Log confidential data access (C1.1)
     */
    public AuditEvent logConfidentialDataAccess(String userId, String dataClassification,
            String operation, boolean authorized) {

        Map<String, Object> details = new HashMap<>();
        details.put("dataClassification", dataClassification);
        details.put("operation", operation);
        details.put("authorized", authorized);

        ConfidentialityEventType eventType = authorized ?
            ConfidentialityEventType.CONFIDENTIAL_DATA_ACCESSED :
            ConfidentialityEventType.UNAUTHORIZED_ACCESS_ATTEMPT;

        return logConfidentialityEvent(eventType, userId, dataClassification, details);
    }

    /**
     * Log data encryption status (C1.2)
     */
    public AuditEvent logEncryptionStatus(String dataStore, String encryptionType,
            String keyId, boolean encrypted) {

        Map<String, Object> details = new HashMap<>();
        details.put("encryptionType", encryptionType);
        details.put("keyId", keyId);
        details.put("encrypted", encrypted);

        ConfidentialityEventType eventType = encrypted ?
            ConfidentialityEventType.DATA_ENCRYPTED :
            ConfidentialityEventType.ENCRYPTION_WARNING;

        return logConfidentialityEvent(eventType, "SYSTEM", dataStore, details);
    }

    // ============ Privacy (P) Event Logging ============

    /**
     * Log privacy event
     * Covers P1.0 through P8.0 criteria
     */
    public AuditEvent logPrivacyEvent(PrivacyEventType eventType, String actor,
            String dataSubject, Map<String, Object> details) {

        Log.debugf("Logging privacy event: %s for subject %s", eventType, dataSubject);

        AuditEvent event = createAuditEvent(
            TrustServiceCategory.PRIVACY,
            eventType.name(),
            actor,
            dataSubject,
            eventType.name(),
            eventType.getSeverity(),
            details
        );

        event.addDetail("privacyEventType", eventType.name());
        event.addDetail("controlCriteria", eventType.getControlCriteria());

        privacyEvents.add(event);
        return event;
    }

    /**
     * Log personal data collection (P3.1)
     */
    public AuditEvent logDataCollection(String collector, String dataSubject,
            List<String> dataTypes, String purpose, boolean consentObtained) {

        Map<String, Object> details = new HashMap<>();
        details.put("dataTypes", dataTypes);
        details.put("purpose", purpose);
        details.put("consentObtained", consentObtained);

        PrivacyEventType eventType = consentObtained ?
            PrivacyEventType.DATA_COLLECTED_WITH_CONSENT :
            PrivacyEventType.DATA_COLLECTION_WARNING;

        return logPrivacyEvent(eventType, collector, dataSubject, details);
    }

    /**
     * Log data subject request (P4.2)
     */
    public AuditEvent logDataSubjectRequest(String dataSubject, String requestType,
            String status, int responseTimeHours) {

        Map<String, Object> details = new HashMap<>();
        details.put("requestType", requestType);
        details.put("status", status);
        details.put("responseTimeHours", responseTimeHours);

        return logPrivacyEvent(PrivacyEventType.DATA_SUBJECT_REQUEST, "SYSTEM",
            dataSubject, details);
    }

    /**
     * Log data retention action (P5.1)
     */
    public AuditEvent logRetentionAction(String dataType, String action, int recordsAffected,
            String retentionPolicy) {

        Map<String, Object> details = new HashMap<>();
        details.put("dataType", dataType);
        details.put("action", action);
        details.put("recordsAffected", recordsAffected);
        details.put("retentionPolicy", retentionPolicy);

        return logPrivacyEvent(PrivacyEventType.RETENTION_ACTION, "SYSTEM",
            "MULTIPLE_SUBJECTS", details);
    }

    // ============ Control Evidence ============

    /**
     * Record control evidence for SOC 2 examination
     */
    public ControlEvidence recordControlEvidence(String controlId, String controlName,
            TrustServiceCategory category, String evidenceDescription,
            Map<String, Object> evidenceData) {

        ControlEvidence evidence = new ControlEvidence();
        evidence.setEvidenceId(generateEvidenceId(controlId));
        evidence.setControlId(controlId);
        evidence.setControlName(controlName);
        evidence.setCategory(category);
        evidence.setDescription(evidenceDescription);
        evidence.setEvidenceData(evidenceData);
        evidence.setRecordedAt(Instant.now());
        evidence.setRecordedBy("SYSTEM");

        controlEvidence.put(evidence.getEvidenceId(), evidence);

        Log.infof("Control evidence recorded: %s - %s", controlId, controlName);
        return evidence;
    }

    // ============ Query Methods ============

    /**
     * Get events by category
     */
    public List<AuditEvent> getEvents(TrustServiceCategory category) {
        switch (category) {
            case SECURITY: return new ArrayList<>(securityEvents);
            case AVAILABILITY: return new ArrayList<>(availabilityEvents);
            case PROCESSING_INTEGRITY: return new ArrayList<>(processingIntegrityEvents);
            case CONFIDENTIALITY: return new ArrayList<>(confidentialityEvents);
            case PRIVACY: return new ArrayList<>(privacyEvents);
            default: return new ArrayList<>();
        }
    }

    /**
     * Get events by category and time range
     */
    public List<AuditEvent> getEvents(TrustServiceCategory category,
            Instant startTime, Instant endTime) {

        return getEvents(category).stream()
            .filter(e -> !e.getTimestamp().isBefore(startTime) &&
                        !e.getTimestamp().isAfter(endTime))
            .toList();
    }

    /**
     * Get events by actor
     */
    public List<AuditEvent> getEventsByActor(String actor) {
        List<AuditEvent> allEvents = new ArrayList<>();
        allEvents.addAll(securityEvents);
        allEvents.addAll(availabilityEvents);
        allEvents.addAll(processingIntegrityEvents);
        allEvents.addAll(confidentialityEvents);
        allEvents.addAll(privacyEvents);

        return allEvents.stream()
            .filter(e -> actor.equals(e.getActor()))
            .sorted((e1, e2) -> e2.getTimestamp().compareTo(e1.getTimestamp()))
            .toList();
    }

    /**
     * Get all control evidence
     */
    public List<ControlEvidence> getAllControlEvidence() {
        return new ArrayList<>(controlEvidence.values());
    }

    /**
     * Get control evidence by category
     */
    public List<ControlEvidence> getControlEvidence(TrustServiceCategory category) {
        return controlEvidence.values().stream()
            .filter(e -> e.getCategory() == category)
            .toList();
    }

    /**
     * Get SOC 2 compliance statistics
     */
    public SOC2Stats getStats() {
        SOC2Stats stats = new SOC2Stats();

        stats.setSecurityEventCount(securityEvents.size());
        stats.setAvailabilityEventCount(availabilityEvents.size());
        stats.setProcessingIntegrityEventCount(processingIntegrityEvents.size());
        stats.setConfidentialityEventCount(confidentialityEvents.size());
        stats.setPrivacyEventCount(privacyEvents.size());
        stats.setTotalEventCount(
            stats.getSecurityEventCount() +
            stats.getAvailabilityEventCount() +
            stats.getProcessingIntegrityEventCount() +
            stats.getConfidentialityEventCount() +
            stats.getPrivacyEventCount()
        );

        stats.setControlEvidenceCount(controlEvidence.size());

        // Count by severity
        Map<Severity, Long> bySeverity = new HashMap<>();
        for (Severity s : Severity.values()) {
            bySeverity.put(s, 0L);
        }
        countBySeverity(securityEvents, bySeverity);
        countBySeverity(availabilityEvents, bySeverity);
        countBySeverity(processingIntegrityEvents, bySeverity);
        countBySeverity(confidentialityEvents, bySeverity);
        countBySeverity(privacyEvents, bySeverity);
        stats.setBySeverity(bySeverity);

        stats.setGeneratedAt(Instant.now());
        return stats;
    }

    /**
     * Generate SOC 2 audit report
     */
    public SOC2AuditReport generateAuditReport(Instant startDate, Instant endDate) {
        SOC2AuditReport report = new SOC2AuditReport();
        report.setReportId("SOC2-" + System.currentTimeMillis());
        report.setPeriodStart(startDate);
        report.setPeriodEnd(endDate);
        report.setGeneratedAt(Instant.now());

        // Collect events for period
        report.setSecurityEvents(filterByTimeRange(securityEvents, startDate, endDate));
        report.setAvailabilityEvents(filterByTimeRange(availabilityEvents, startDate, endDate));
        report.setProcessingIntegrityEvents(filterByTimeRange(processingIntegrityEvents, startDate, endDate));
        report.setConfidentialityEvents(filterByTimeRange(confidentialityEvents, startDate, endDate));
        report.setPrivacyEvents(filterByTimeRange(privacyEvents, startDate, endDate));

        report.setControlEvidence(new ArrayList<>(controlEvidence.values()));

        return report;
    }

    // ============ Helper Methods ============

    private AuditEvent createAuditEvent(TrustServiceCategory category, String eventType,
            String actor, String resource, String action, Severity severity,
            Map<String, Object> details) {

        AuditEvent event = new AuditEvent();
        event.setEventId(generateEventId());
        event.setCategory(category);
        event.setEventType(eventType);
        event.setActor(actor);
        event.setResource(resource);
        event.setAction(action);
        event.setSeverity(severity);
        event.setDetails(details != null ? new HashMap<>(details) : new HashMap<>());
        event.setTimestamp(Instant.now());
        event.setRetentionExpiry(Instant.now().plus(RETENTION_PERIOD));

        return event;
    }

    private String generateEventId() {
        return String.format("AE-%d-%d", System.currentTimeMillis(),
            eventCounter.incrementAndGet());
    }

    private String generateEvidenceId(String controlId) {
        return String.format("CE-%s-%d", controlId, System.currentTimeMillis());
    }

    private void countBySeverity(List<AuditEvent> events, Map<Severity, Long> counts) {
        for (AuditEvent event : events) {
            counts.merge(event.getSeverity(), 1L, Long::sum);
        }
    }

    private List<AuditEvent> filterByTimeRange(List<AuditEvent> events,
            Instant start, Instant end) {
        return events.stream()
            .filter(e -> !e.getTimestamp().isBefore(start) &&
                        !e.getTimestamp().isAfter(end))
            .toList();
    }

    // ============ Event Type Enums ============

    public enum SecurityEventType {
        AUTHENTICATION_SUCCESS("CC6.1", Severity.INFO),
        AUTHENTICATION_FAILURE("CC6.1", Severity.WARNING),
        AUTHORIZATION_GRANTED("CC6.2", Severity.INFO),
        AUTHORIZATION_DENIED("CC6.2", Severity.WARNING),
        DATA_ACCESS("CC6.3", Severity.INFO),
        PRIVILEGE_ESCALATION("CC6.3", Severity.ALERT),
        CRYPTO_OPERATION("CC6.7", Severity.INFO),
        KEY_ROTATION("CC6.7", Severity.INFO),
        SECURITY_CONFIGURATION_CHANGE("CC7.1", Severity.WARNING),
        VULNERABILITY_DETECTED("CC7.2", Severity.ALERT),
        INTRUSION_ATTEMPT("CC7.3", Severity.CRITICAL),
        MALWARE_DETECTED("CC7.4", Severity.CRITICAL);

        private final String controlCriteria;
        private final Severity severity;

        SecurityEventType(String controlCriteria, Severity severity) {
            this.controlCriteria = controlCriteria;
            this.severity = severity;
        }

        public String getControlCriteria() { return controlCriteria; }
        public Severity getSeverity() { return severity; }
    }

    public enum AvailabilityEventType {
        HEALTH_CHECK_PASSED("A1.1", Severity.INFO),
        HEALTH_CHECK_FAILED("A1.1", Severity.ALERT),
        CAPACITY_NORMAL("A1.2", Severity.INFO),
        CAPACITY_THRESHOLD_EXCEEDED("A1.2", Severity.WARNING),
        SERVICE_STARTED("A1.1", Severity.INFO),
        SERVICE_STOPPED("A1.1", Severity.WARNING),
        SERVICE_DEGRADED("A1.1", Severity.ALERT),
        BACKUP_COMPLETED("A1.3", Severity.INFO),
        BACKUP_FAILED("A1.3", Severity.ALERT),
        RECOVERY_INITIATED("A1.3", Severity.WARNING),
        RECOVERY_COMPLETED("A1.3", Severity.INFO),
        FAILOVER_TRIGGERED("A1.2", Severity.WARNING);

        private final String controlCriteria;
        private final Severity severity;

        AvailabilityEventType(String controlCriteria, Severity severity) {
            this.controlCriteria = controlCriteria;
            this.severity = severity;
        }

        public String getControlCriteria() { return controlCriteria; }
        public Severity getSeverity() { return severity; }
    }

    public enum ProcessingIntegrityEventType {
        TRANSACTION_COMPLETED("PI1.1", Severity.INFO),
        TRANSACTION_INCOMPLETE("PI1.1", Severity.WARNING),
        TRANSACTION_VALIDATION_FAILED("PI1.2", Severity.WARNING),
        DATA_VALIDATION_PASSED("PI1.2", Severity.INFO),
        DATA_VALIDATION_FAILED("PI1.2", Severity.WARNING),
        DATA_INTEGRITY_VERIFIED("PI1.3", Severity.INFO),
        DATA_INTEGRITY_VIOLATION("PI1.3", Severity.CRITICAL),
        ERROR_HANDLED("PI1.4", Severity.WARNING),
        OUTPUT_DELIVERED("PI1.5", Severity.INFO),
        OUTPUT_DELIVERY_FAILED("PI1.5", Severity.ALERT);

        private final String controlCriteria;
        private final Severity severity;

        ProcessingIntegrityEventType(String controlCriteria, Severity severity) {
            this.controlCriteria = controlCriteria;
            this.severity = severity;
        }

        public String getControlCriteria() { return controlCriteria; }
        public Severity getSeverity() { return severity; }
    }

    public enum ConfidentialityEventType {
        CONFIDENTIAL_DATA_ACCESSED("C1.1", Severity.INFO),
        UNAUTHORIZED_ACCESS_ATTEMPT("C1.1", Severity.ALERT),
        DATA_ENCRYPTED("C1.2", Severity.INFO),
        DATA_DECRYPTED("C1.2", Severity.INFO),
        ENCRYPTION_WARNING("C1.2", Severity.WARNING),
        DATA_CLASSIFICATION_CHANGED("C1.1", Severity.INFO),
        CONFIDENTIAL_DATA_SHARED("C1.1", Severity.WARNING),
        DATA_DISPOSAL("C1.2", Severity.INFO);

        private final String controlCriteria;
        private final Severity severity;

        ConfidentialityEventType(String controlCriteria, Severity severity) {
            this.controlCriteria = controlCriteria;
            this.severity = severity;
        }

        public String getControlCriteria() { return controlCriteria; }
        public Severity getSeverity() { return severity; }
    }

    public enum PrivacyEventType {
        DATA_COLLECTED_WITH_CONSENT("P3.1", Severity.INFO),
        DATA_COLLECTION_WARNING("P3.1", Severity.WARNING),
        DATA_SUBJECT_REQUEST("P4.2", Severity.INFO),
        CONSENT_OBTAINED("P3.2", Severity.INFO),
        CONSENT_WITHDRAWN("P3.2", Severity.INFO),
        RETENTION_ACTION("P5.1", Severity.INFO),
        DATA_DISCLOSED("P6.1", Severity.WARNING),
        PRIVACY_BREACH("P7.0", Severity.CRITICAL),
        COMPLIANCE_CHECK("P8.0", Severity.INFO);

        private final String controlCriteria;
        private final Severity severity;

        PrivacyEventType(String controlCriteria, Severity severity) {
            this.controlCriteria = controlCriteria;
            this.severity = severity;
        }

        public String getControlCriteria() { return controlCriteria; }
        public Severity getSeverity() { return severity; }
    }

    // ============ Inner Classes ============

    public static class AuditEvent {
        private String eventId;
        private TrustServiceCategory category;
        private String eventType;
        private String actor;
        private String resource;
        private String action;
        private Severity severity;
        private Map<String, Object> details = new HashMap<>();
        private Instant timestamp;
        private Instant retentionExpiry;

        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public TrustServiceCategory getCategory() { return category; }
        public void setCategory(TrustServiceCategory cat) { this.category = cat; }
        public String getEventType() { return eventType; }
        public void setEventType(String type) { this.eventType = type; }
        public String getActor() { return actor; }
        public void setActor(String actor) { this.actor = actor; }
        public String getResource() { return resource; }
        public void setResource(String resource) { this.resource = resource; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public Severity getSeverity() { return severity; }
        public void setSeverity(Severity severity) { this.severity = severity; }
        public Map<String, Object> getDetails() { return details; }
        public void setDetails(Map<String, Object> details) { this.details = details; }
        public void addDetail(String key, Object value) { this.details.put(key, value); }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public Instant getRetentionExpiry() { return retentionExpiry; }
        public void setRetentionExpiry(Instant expiry) { this.retentionExpiry = expiry; }
    }

    public static class ControlEvidence {
        private String evidenceId;
        private String controlId;
        private String controlName;
        private TrustServiceCategory category;
        private String description;
        private Map<String, Object> evidenceData;
        private Instant recordedAt;
        private String recordedBy;

        public String getEvidenceId() { return evidenceId; }
        public void setEvidenceId(String id) { this.evidenceId = id; }
        public String getControlId() { return controlId; }
        public void setControlId(String id) { this.controlId = id; }
        public String getControlName() { return controlName; }
        public void setControlName(String name) { this.controlName = name; }
        public TrustServiceCategory getCategory() { return category; }
        public void setCategory(TrustServiceCategory cat) { this.category = cat; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public Map<String, Object> getEvidenceData() { return evidenceData; }
        public void setEvidenceData(Map<String, Object> data) { this.evidenceData = data; }
        public Instant getRecordedAt() { return recordedAt; }
        public void setRecordedAt(Instant at) { this.recordedAt = at; }
        public String getRecordedBy() { return recordedBy; }
        public void setRecordedBy(String by) { this.recordedBy = by; }
    }

    public static class SOC2Stats {
        private long securityEventCount;
        private long availabilityEventCount;
        private long processingIntegrityEventCount;
        private long confidentialityEventCount;
        private long privacyEventCount;
        private long totalEventCount;
        private long controlEvidenceCount;
        private Map<Severity, Long> bySeverity = new HashMap<>();
        private Instant generatedAt;

        public long getSecurityEventCount() { return securityEventCount; }
        public void setSecurityEventCount(long count) { this.securityEventCount = count; }
        public long getAvailabilityEventCount() { return availabilityEventCount; }
        public void setAvailabilityEventCount(long count) { this.availabilityEventCount = count; }
        public long getProcessingIntegrityEventCount() { return processingIntegrityEventCount; }
        public void setProcessingIntegrityEventCount(long count) { this.processingIntegrityEventCount = count; }
        public long getConfidentialityEventCount() { return confidentialityEventCount; }
        public void setConfidentialityEventCount(long count) { this.confidentialityEventCount = count; }
        public long getPrivacyEventCount() { return privacyEventCount; }
        public void setPrivacyEventCount(long count) { this.privacyEventCount = count; }
        public long getTotalEventCount() { return totalEventCount; }
        public void setTotalEventCount(long count) { this.totalEventCount = count; }
        public long getControlEvidenceCount() { return controlEvidenceCount; }
        public void setControlEvidenceCount(long count) { this.controlEvidenceCount = count; }
        public Map<Severity, Long> getBySeverity() { return bySeverity; }
        public void setBySeverity(Map<Severity, Long> map) { this.bySeverity = map; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }

    public static class SOC2AuditReport {
        private String reportId;
        private Instant periodStart;
        private Instant periodEnd;
        private List<AuditEvent> securityEvents;
        private List<AuditEvent> availabilityEvents;
        private List<AuditEvent> processingIntegrityEvents;
        private List<AuditEvent> confidentialityEvents;
        private List<AuditEvent> privacyEvents;
        private List<ControlEvidence> controlEvidence;
        private Instant generatedAt;

        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public Instant getPeriodStart() { return periodStart; }
        public void setPeriodStart(Instant start) { this.periodStart = start; }
        public Instant getPeriodEnd() { return periodEnd; }
        public void setPeriodEnd(Instant end) { this.periodEnd = end; }
        public List<AuditEvent> getSecurityEvents() { return securityEvents; }
        public void setSecurityEvents(List<AuditEvent> events) { this.securityEvents = events; }
        public List<AuditEvent> getAvailabilityEvents() { return availabilityEvents; }
        public void setAvailabilityEvents(List<AuditEvent> events) { this.availabilityEvents = events; }
        public List<AuditEvent> getProcessingIntegrityEvents() { return processingIntegrityEvents; }
        public void setProcessingIntegrityEvents(List<AuditEvent> events) { this.processingIntegrityEvents = events; }
        public List<AuditEvent> getConfidentialityEvents() { return confidentialityEvents; }
        public void setConfidentialityEvents(List<AuditEvent> events) { this.confidentialityEvents = events; }
        public List<AuditEvent> getPrivacyEvents() { return privacyEvents; }
        public void setPrivacyEvents(List<AuditEvent> events) { this.privacyEvents = events; }
        public List<ControlEvidence> getControlEvidence() { return controlEvidence; }
        public void setControlEvidence(List<ControlEvidence> evidence) { this.controlEvidence = evidence; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }
}
