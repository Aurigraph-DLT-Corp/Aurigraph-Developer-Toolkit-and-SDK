package io.aurigraph.v11.compliance.soc2;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Incident Response Logger
 *
 * Provides comprehensive security incident logging and response tracking
 * for SOC 2 compliance. Implements the incident response lifecycle:
 *
 * 1. Detection & Reporting
 * 2. Triage & Classification
 * 3. Investigation & Analysis
 * 4. Containment & Eradication
 * 5. Recovery
 * 6. Post-Incident Review (Lessons Learned)
 *
 * This module maintains immutable incident records with full audit trails,
 * response time tracking, escalation documentation, and post-mortem templates.
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class IncidentResponseLogger {

    @Inject
    SOC2AuditTrail soc2AuditTrail;

    // Incident storage
    private final Map<String, SecurityIncident> incidents = new ConcurrentHashMap<>();
    private final Map<String, List<IncidentUpdate>> incidentUpdates = new ConcurrentHashMap<>();
    private final Map<String, List<EscalationEvent>> escalationEvents = new ConcurrentHashMap<>();
    private final Map<String, PostMortemReport> postMortems = new ConcurrentHashMap<>();

    // Response team contacts
    private final Map<IncidentSeverity, List<ResponderContact>> escalationContacts = new ConcurrentHashMap<>();

    // Event counter
    private final AtomicLong eventCounter = new AtomicLong(0);

    // SLA thresholds (in minutes)
    private static final Map<IncidentSeverity, Long> RESPONSE_SLA = Map.of(
        IncidentSeverity.CRITICAL, 15L,
        IncidentSeverity.HIGH, 60L,
        IncidentSeverity.MEDIUM, 240L,
        IncidentSeverity.LOW, 1440L
    );

    private static final Map<IncidentSeverity, Long> RESOLUTION_SLA = Map.of(
        IncidentSeverity.CRITICAL, 240L,
        IncidentSeverity.HIGH, 480L,
        IncidentSeverity.MEDIUM, 1440L,
        IncidentSeverity.LOW, 4320L
    );

    // ============ Incident Creation & Reporting ============

    /**
     * Create a new security incident
     */
    public SecurityIncident createIncident(IncidentType type, IncidentSeverity severity,
            String title, String description, String reportedBy, String affectedSystem) {

        Log.infof("Creating security incident: %s - %s (%s)", type, title, severity);

        SecurityIncident incident = new SecurityIncident();
        incident.setIncidentId(generateIncidentId());
        incident.setType(type);
        incident.setSeverity(severity);
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setReportedBy(reportedBy);
        incident.setAffectedSystem(affectedSystem);
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setReportedAt(Instant.now());
        incident.setLastUpdated(Instant.now());

        // Calculate SLA deadlines
        incident.setResponseDeadline(
            Instant.now().plusSeconds(RESPONSE_SLA.get(severity) * 60));
        incident.setResolutionDeadline(
            Instant.now().plusSeconds(RESOLUTION_SLA.get(severity) * 60));

        // Initialize tracking collections
        incident.setAffectedAssets(new ArrayList<>());
        incident.setImpactAssessment(new ImpactAssessment());
        incident.setTimelineEvents(new ArrayList<>());

        // Add initial timeline event
        TimelineEvent reportEvent = new TimelineEvent(
            "INCIDENT_REPORTED",
            "Incident reported by " + reportedBy,
            Instant.now(),
            reportedBy
        );
        incident.getTimelineEvents().add(reportEvent);

        // Store incident
        incidents.put(incident.getIncidentId(), incident);
        incidentUpdates.put(incident.getIncidentId(), new ArrayList<>());
        escalationEvents.put(incident.getIncidentId(), new ArrayList<>());

        // Log to SOC2 audit trail
        if (soc2AuditTrail != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("incidentType", type.name());
            details.put("severity", severity.name());
            details.put("affectedSystem", affectedSystem);
            soc2AuditTrail.logSecurityEvent(
                SOC2AuditTrail.SecurityEventType.INTRUSION_ATTEMPT,
                reportedBy, affectedSystem, "INCIDENT_CREATED", details);
        }

        // Trigger escalation for critical/high severity
        if (severity == IncidentSeverity.CRITICAL || severity == IncidentSeverity.HIGH) {
            triggerEscalation(incident, EscalationLevel.INITIAL);
        }

        return incident;
    }

    /**
     * Update incident status
     */
    public IncidentUpdate updateIncidentStatus(String incidentId, IncidentStatus newStatus,
            String updatedBy, String notes) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        Log.infof("Updating incident %s status: %s -> %s",
            incidentId, incident.getStatus(), newStatus);

        IncidentStatus previousStatus = incident.getStatus();
        incident.setStatus(newStatus);
        incident.setLastUpdated(Instant.now());

        // Track response time
        if (previousStatus == IncidentStatus.REPORTED &&
            newStatus == IncidentStatus.ACKNOWLEDGED) {
            incident.setAcknowledgedAt(Instant.now());
            Duration responseTime = Duration.between(incident.getReportedAt(),
                incident.getAcknowledgedAt());
            incident.setResponseTime(responseTime);
        }

        // Track resolution time
        if (newStatus == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(Instant.now());
            Duration resolutionTime = Duration.between(incident.getReportedAt(),
                incident.getResolvedAt());
            incident.setResolutionTime(resolutionTime);
        }

        if (newStatus == IncidentStatus.CLOSED) {
            incident.setClosedAt(Instant.now());
        }

        // Create update record
        IncidentUpdate update = new IncidentUpdate();
        update.setUpdateId(generateUpdateId(incidentId));
        update.setIncidentId(incidentId);
        update.setPreviousStatus(previousStatus);
        update.setNewStatus(newStatus);
        update.setUpdatedBy(updatedBy);
        update.setNotes(notes);
        update.setTimestamp(Instant.now());

        incidentUpdates.get(incidentId).add(update);

        // Add timeline event
        TimelineEvent event = new TimelineEvent(
            "STATUS_CHANGE",
            String.format("Status changed: %s -> %s. %s", previousStatus, newStatus, notes),
            Instant.now(),
            updatedBy
        );
        incident.getTimelineEvents().add(event);

        return update;
    }

    /**
     * Assign incident to responder
     */
    public void assignIncident(String incidentId, String assignee, String assignedBy) {
        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        incident.setAssignedTo(assignee);
        incident.setLastUpdated(Instant.now());

        if (incident.getStatus() == IncidentStatus.REPORTED) {
            updateIncidentStatus(incidentId, IncidentStatus.ACKNOWLEDGED, assignedBy,
                "Incident assigned to " + assignee);
        }

        TimelineEvent event = new TimelineEvent(
            "ASSIGNMENT",
            "Incident assigned to " + assignee + " by " + assignedBy,
            Instant.now(),
            assignedBy
        );
        incident.getTimelineEvents().add(event);
    }

    // ============ Investigation & Analysis ============

    /**
     * Add investigation finding
     */
    public void addInvestigationFinding(String incidentId, String finding,
            String investigator, FindingSeverity severity) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        InvestigationFinding f = new InvestigationFinding();
        f.setFindingId(generateFindingId(incidentId));
        f.setDescription(finding);
        f.setInvestigator(investigator);
        f.setSeverity(severity);
        f.setFoundAt(Instant.now());

        if (incident.getInvestigationFindings() == null) {
            incident.setInvestigationFindings(new ArrayList<>());
        }
        incident.getInvestigationFindings().add(f);
        incident.setLastUpdated(Instant.now());

        // Update status to investigating if still acknowledged
        if (incident.getStatus() == IncidentStatus.ACKNOWLEDGED) {
            updateIncidentStatus(incidentId, IncidentStatus.INVESTIGATING, investigator,
                "Investigation started");
        }

        TimelineEvent event = new TimelineEvent(
            "FINDING_ADDED",
            "Investigation finding: " + finding,
            Instant.now(),
            investigator
        );
        incident.getTimelineEvents().add(event);
    }

    /**
     * Add affected asset
     */
    public void addAffectedAsset(String incidentId, String assetId, String assetType,
            String impactDescription) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        AffectedAsset asset = new AffectedAsset();
        asset.setAssetId(assetId);
        asset.setAssetType(assetType);
        asset.setImpactDescription(impactDescription);
        asset.setIdentifiedAt(Instant.now());

        incident.getAffectedAssets().add(asset);
        incident.setLastUpdated(Instant.now());
    }

    /**
     * Update impact assessment
     */
    public void updateImpactAssessment(String incidentId, ImpactAssessment assessment,
            String assessedBy) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        assessment.setAssessedBy(assessedBy);
        assessment.setAssessedAt(Instant.now());
        incident.setImpactAssessment(assessment);
        incident.setLastUpdated(Instant.now());

        TimelineEvent event = new TimelineEvent(
            "IMPACT_ASSESSED",
            String.format("Impact assessment completed: Business=%s, Data=%s, System=%s",
                assessment.getBusinessImpact(), assessment.getDataImpact(),
                assessment.getSystemImpact()),
            Instant.now(),
            assessedBy
        );
        incident.getTimelineEvents().add(event);
    }

    // ============ Containment & Eradication ============

    /**
     * Log containment action
     */
    public ContainmentAction logContainmentAction(String incidentId, String action,
            String performedBy, boolean successful) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        ContainmentAction containment = new ContainmentAction();
        containment.setActionId(generateActionId(incidentId));
        containment.setAction(action);
        containment.setPerformedBy(performedBy);
        containment.setPerformedAt(Instant.now());
        containment.setSuccessful(successful);

        if (incident.getContainmentActions() == null) {
            incident.setContainmentActions(new ArrayList<>());
        }
        incident.getContainmentActions().add(containment);
        incident.setLastUpdated(Instant.now());

        // Update status to containment
        if (incident.getStatus() == IncidentStatus.INVESTIGATING) {
            updateIncidentStatus(incidentId, IncidentStatus.CONTAINMENT, performedBy,
                "Containment actions initiated");
        }

        TimelineEvent event = new TimelineEvent(
            "CONTAINMENT_ACTION",
            String.format("Containment action: %s - %s", action, successful ? "Successful" : "Failed"),
            Instant.now(),
            performedBy
        );
        incident.getTimelineEvents().add(event);

        return containment;
    }

    /**
     * Log eradication action
     */
    public EradicationAction logEradicationAction(String incidentId, String action,
            String performedBy, String verification) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        EradicationAction eradication = new EradicationAction();
        eradication.setActionId(generateActionId(incidentId));
        eradication.setAction(action);
        eradication.setPerformedBy(performedBy);
        eradication.setPerformedAt(Instant.now());
        eradication.setVerification(verification);

        if (incident.getEradicationActions() == null) {
            incident.setEradicationActions(new ArrayList<>());
        }
        incident.getEradicationActions().add(eradication);
        incident.setLastUpdated(Instant.now());

        // Update status to eradication
        if (incident.getStatus() == IncidentStatus.CONTAINMENT) {
            updateIncidentStatus(incidentId, IncidentStatus.ERADICATION, performedBy,
                "Eradication actions initiated");
        }

        TimelineEvent event = new TimelineEvent(
            "ERADICATION_ACTION",
            String.format("Eradication action: %s", action),
            Instant.now(),
            performedBy
        );
        incident.getTimelineEvents().add(event);

        return eradication;
    }

    // ============ Recovery ============

    /**
     * Log recovery action
     */
    public RecoveryAction logRecoveryAction(String incidentId, String action,
            String performedBy, boolean verified) {

        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        RecoveryAction recovery = new RecoveryAction();
        recovery.setActionId(generateActionId(incidentId));
        recovery.setAction(action);
        recovery.setPerformedBy(performedBy);
        recovery.setPerformedAt(Instant.now());
        recovery.setVerified(verified);

        if (incident.getRecoveryActions() == null) {
            incident.setRecoveryActions(new ArrayList<>());
        }
        incident.getRecoveryActions().add(recovery);
        incident.setLastUpdated(Instant.now());

        // Update status to recovery
        if (incident.getStatus() == IncidentStatus.ERADICATION) {
            updateIncidentStatus(incidentId, IncidentStatus.RECOVERY, performedBy,
                "Recovery actions initiated");
        }

        TimelineEvent event = new TimelineEvent(
            "RECOVERY_ACTION",
            String.format("Recovery action: %s - %s", action, verified ? "Verified" : "Pending verification"),
            Instant.now(),
            performedBy
        );
        incident.getTimelineEvents().add(event);

        return recovery;
    }

    // ============ Escalation ============

    /**
     * Trigger escalation
     */
    public EscalationEvent triggerEscalation(SecurityIncident incident, EscalationLevel level) {
        Log.infof("Triggering escalation for incident %s to level %s",
            incident.getIncidentId(), level);

        EscalationEvent escalation = new EscalationEvent();
        escalation.setEscalationId(generateEscalationId(incident.getIncidentId()));
        escalation.setIncidentId(incident.getIncidentId());
        escalation.setLevel(level);
        escalation.setReason(determineEscalationReason(incident, level));
        escalation.setEscalatedAt(Instant.now());

        // Get contacts for this severity
        List<ResponderContact> contacts = escalationContacts.get(incident.getSeverity());
        if (contacts != null && !contacts.isEmpty()) {
            escalation.setNotifiedContacts(new ArrayList<>(contacts));
        }

        escalationEvents.get(incident.getIncidentId()).add(escalation);

        TimelineEvent event = new TimelineEvent(
            "ESCALATION",
            String.format("Escalation to %s: %s", level, escalation.getReason()),
            Instant.now(),
            "SYSTEM"
        );
        incident.getTimelineEvents().add(event);

        return escalation;
    }

    /**
     * Check SLA breaches and escalate if needed
     */
    public List<SecurityIncident> checkSLABreaches() {
        List<SecurityIncident> breachedIncidents = new ArrayList<>();
        Instant now = Instant.now();

        for (SecurityIncident incident : incidents.values()) {
            if (incident.getStatus() == IncidentStatus.CLOSED ||
                incident.getStatus() == IncidentStatus.RESOLVED) {
                continue;
            }

            // Check response SLA
            if (incident.getAcknowledgedAt() == null &&
                now.isAfter(incident.getResponseDeadline())) {
                incident.setResponseSLABreached(true);
                breachedIncidents.add(incident);
                triggerEscalation(incident, EscalationLevel.SLA_BREACH);
            }

            // Check resolution SLA
            if (incident.getResolvedAt() == null &&
                now.isAfter(incident.getResolutionDeadline())) {
                incident.setResolutionSLABreached(true);
                if (!incident.isResponseSLABreached()) {
                    breachedIncidents.add(incident);
                }
                triggerEscalation(incident, EscalationLevel.SLA_BREACH);
            }
        }

        return breachedIncidents;
    }

    // ============ Post-Mortem ============

    /**
     * Create post-mortem report
     */
    public PostMortemReport createPostMortem(String incidentId, String author) {
        SecurityIncident incident = incidents.get(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found: " + incidentId);
        }

        if (incident.getStatus() != IncidentStatus.RESOLVED &&
            incident.getStatus() != IncidentStatus.CLOSED) {
            throw new IllegalStateException("Cannot create post-mortem for unresolved incident");
        }

        PostMortemReport report = new PostMortemReport();
        report.setReportId(generatePostMortemId(incidentId));
        report.setIncidentId(incidentId);
        report.setAuthor(author);
        report.setCreatedAt(Instant.now());

        // Pre-populate from incident data
        report.setIncidentSummary(incident.getDescription());
        report.setTimeline(new ArrayList<>(incident.getTimelineEvents()));
        report.setImpactAssessment(incident.getImpactAssessment());
        report.setResponseTime(incident.getResponseTime());
        report.setResolutionTime(incident.getResolutionTime());

        // Initialize template sections
        report.setRootCauseAnalysis("");
        report.setWhatWentWell(new ArrayList<>());
        report.setWhatWentWrong(new ArrayList<>());
        report.setLessonsLearned(new ArrayList<>());
        report.setActionItems(new ArrayList<>());
        report.setPreventiveMeasures(new ArrayList<>());

        postMortems.put(incidentId, report);

        return report;
    }

    /**
     * Update post-mortem report
     */
    public PostMortemReport updatePostMortem(String incidentId, PostMortemReport updates) {
        PostMortemReport report = postMortems.get(incidentId);
        if (report == null) {
            throw new IllegalArgumentException("Post-mortem not found for incident: " + incidentId);
        }

        if (updates.getRootCauseAnalysis() != null) {
            report.setRootCauseAnalysis(updates.getRootCauseAnalysis());
        }
        if (updates.getWhatWentWell() != null) {
            report.setWhatWentWell(updates.getWhatWentWell());
        }
        if (updates.getWhatWentWrong() != null) {
            report.setWhatWentWrong(updates.getWhatWentWrong());
        }
        if (updates.getLessonsLearned() != null) {
            report.setLessonsLearned(updates.getLessonsLearned());
        }
        if (updates.getActionItems() != null) {
            report.setActionItems(updates.getActionItems());
        }
        if (updates.getPreventiveMeasures() != null) {
            report.setPreventiveMeasures(updates.getPreventiveMeasures());
        }

        report.setLastUpdated(Instant.now());
        return report;
    }

    /**
     * Finalize post-mortem report
     */
    public PostMortemReport finalizePostMortem(String incidentId, String approvedBy) {
        PostMortemReport report = postMortems.get(incidentId);
        if (report == null) {
            throw new IllegalArgumentException("Post-mortem not found for incident: " + incidentId);
        }

        report.setFinalized(true);
        report.setApprovedBy(approvedBy);
        report.setFinalizedAt(Instant.now());

        // Close the incident
        updateIncidentStatus(incidentId, IncidentStatus.CLOSED, approvedBy,
            "Post-mortem completed and approved");

        return report;
    }

    // ============ Query Methods ============

    /**
     * Get incident by ID
     */
    public Optional<SecurityIncident> getIncident(String incidentId) {
        return Optional.ofNullable(incidents.get(incidentId));
    }

    /**
     * Get all incidents
     */
    public List<SecurityIncident> getAllIncidents() {
        return new ArrayList<>(incidents.values());
    }

    /**
     * Get incidents by status
     */
    public List<SecurityIncident> getIncidentsByStatus(IncidentStatus status) {
        return incidents.values().stream()
            .filter(i -> i.getStatus() == status)
            .toList();
    }

    /**
     * Get incidents by severity
     */
    public List<SecurityIncident> getIncidentsBySeverity(IncidentSeverity severity) {
        return incidents.values().stream()
            .filter(i -> i.getSeverity() == severity)
            .toList();
    }

    /**
     * Get open incidents
     */
    public List<SecurityIncident> getOpenIncidents() {
        return incidents.values().stream()
            .filter(i -> i.getStatus() != IncidentStatus.CLOSED &&
                        i.getStatus() != IncidentStatus.RESOLVED)
            .toList();
    }

    /**
     * Get incident updates
     */
    public List<IncidentUpdate> getIncidentUpdates(String incidentId) {
        return incidentUpdates.getOrDefault(incidentId, new ArrayList<>());
    }

    /**
     * Get escalation events
     */
    public List<EscalationEvent> getEscalationEvents(String incidentId) {
        return escalationEvents.getOrDefault(incidentId, new ArrayList<>());
    }

    /**
     * Get post-mortem report
     */
    public Optional<PostMortemReport> getPostMortem(String incidentId) {
        return Optional.ofNullable(postMortems.get(incidentId));
    }

    /**
     * Get incident response statistics
     */
    public IncidentResponseStats getStats() {
        IncidentResponseStats stats = new IncidentResponseStats();

        stats.setTotalIncidents(incidents.size());
        stats.setOpenIncidents(getOpenIncidents().size());
        stats.setResolvedIncidents(
            (int) incidents.values().stream()
                .filter(i -> i.getStatus() == IncidentStatus.RESOLVED ||
                            i.getStatus() == IncidentStatus.CLOSED)
                .count()
        );

        // Count by severity
        Map<IncidentSeverity, Long> bySeverity = new HashMap<>();
        for (IncidentSeverity s : IncidentSeverity.values()) {
            bySeverity.put(s, incidents.values().stream()
                .filter(i -> i.getSeverity() == s)
                .count());
        }
        stats.setBySeverity(bySeverity);

        // Count by type
        Map<IncidentType, Long> byType = new HashMap<>();
        for (IncidentType t : IncidentType.values()) {
            byType.put(t, incidents.values().stream()
                .filter(i -> i.getType() == t)
                .count());
        }
        stats.setByType(byType);

        // Calculate average response time
        double avgResponseMinutes = incidents.values().stream()
            .filter(i -> i.getResponseTime() != null)
            .mapToLong(i -> i.getResponseTime().toMinutes())
            .average()
            .orElse(0.0);
        stats.setAverageResponseTimeMinutes(avgResponseMinutes);

        // Calculate average resolution time
        double avgResolutionMinutes = incidents.values().stream()
            .filter(i -> i.getResolutionTime() != null)
            .mapToLong(i -> i.getResolutionTime().toMinutes())
            .average()
            .orElse(0.0);
        stats.setAverageResolutionTimeMinutes(avgResolutionMinutes);

        // SLA compliance
        long slaCompliant = incidents.values().stream()
            .filter(i -> !i.isResponseSLABreached() && !i.isResolutionSLABreached())
            .count();
        if (incidents.size() > 0) {
            stats.setSlaComplianceRate(slaCompliant * 100.0 / incidents.size());
        }

        stats.setGeneratedAt(Instant.now());
        return stats;
    }

    // ============ Helper Methods ============

    private String generateIncidentId() {
        return String.format("INC-%d-%04d",
            LocalDate.now().getYear(),
            eventCounter.incrementAndGet());
    }

    private String generateUpdateId(String incidentId) {
        return String.format("%s-UPD-%d", incidentId, System.currentTimeMillis() % 10000);
    }

    private String generateFindingId(String incidentId) {
        return String.format("%s-FND-%d", incidentId, System.currentTimeMillis() % 10000);
    }

    private String generateActionId(String incidentId) {
        return String.format("%s-ACT-%d", incidentId, System.currentTimeMillis() % 10000);
    }

    private String generateEscalationId(String incidentId) {
        return String.format("%s-ESC-%d", incidentId, System.currentTimeMillis() % 10000);
    }

    private String generatePostMortemId(String incidentId) {
        return String.format("%s-PM", incidentId);
    }

    private String determineEscalationReason(SecurityIncident incident, EscalationLevel level) {
        switch (level) {
            case INITIAL:
                return "High/Critical severity incident reported";
            case SLA_BREACH:
                return "SLA deadline exceeded";
            case MANAGEMENT:
                return "Management escalation requested";
            case EXECUTIVE:
                return "Executive escalation - significant business impact";
            default:
                return "Escalation triggered";
        }
    }

    /**
     * Configure escalation contacts
     */
    public void setEscalationContacts(IncidentSeverity severity, List<ResponderContact> contacts) {
        escalationContacts.put(severity, contacts);
    }

    // ============ Enums ============

    public enum IncidentType {
        DATA_BREACH, MALWARE, PHISHING, DDOS, UNAUTHORIZED_ACCESS,
        INSIDER_THREAT, SYSTEM_COMPROMISE, VULNERABILITY_EXPLOIT,
        POLICY_VIOLATION, FRAUD, SERVICE_DISRUPTION, OTHER
    }

    public enum IncidentSeverity {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    public enum IncidentStatus {
        REPORTED, ACKNOWLEDGED, INVESTIGATING, CONTAINMENT,
        ERADICATION, RECOVERY, RESOLVED, CLOSED
    }

    public enum EscalationLevel {
        INITIAL, SLA_BREACH, MANAGEMENT, EXECUTIVE
    }

    public enum FindingSeverity {
        CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
    }

    // ============ Inner Classes ============

    public static class SecurityIncident {
        private String incidentId;
        private IncidentType type;
        private IncidentSeverity severity;
        private String title;
        private String description;
        private String reportedBy;
        private String assignedTo;
        private String affectedSystem;
        private IncidentStatus status;
        private Instant reportedAt;
        private Instant acknowledgedAt;
        private Instant resolvedAt;
        private Instant closedAt;
        private Instant lastUpdated;
        private Instant responseDeadline;
        private Instant resolutionDeadline;
        private Duration responseTime;
        private Duration resolutionTime;
        private boolean responseSLABreached;
        private boolean resolutionSLABreached;
        private List<AffectedAsset> affectedAssets;
        private ImpactAssessment impactAssessment;
        private List<InvestigationFinding> investigationFindings;
        private List<ContainmentAction> containmentActions;
        private List<EradicationAction> eradicationActions;
        private List<RecoveryAction> recoveryActions;
        private List<TimelineEvent> timelineEvents;

        // Getters and Setters
        public String getIncidentId() { return incidentId; }
        public void setIncidentId(String id) { this.incidentId = id; }
        public IncidentType getType() { return type; }
        public void setType(IncidentType type) { this.type = type; }
        public IncidentSeverity getSeverity() { return severity; }
        public void setSeverity(IncidentSeverity severity) { this.severity = severity; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public String getReportedBy() { return reportedBy; }
        public void setReportedBy(String by) { this.reportedBy = by; }
        public String getAssignedTo() { return assignedTo; }
        public void setAssignedTo(String to) { this.assignedTo = to; }
        public String getAffectedSystem() { return affectedSystem; }
        public void setAffectedSystem(String system) { this.affectedSystem = system; }
        public IncidentStatus getStatus() { return status; }
        public void setStatus(IncidentStatus status) { this.status = status; }
        public Instant getReportedAt() { return reportedAt; }
        public void setReportedAt(Instant at) { this.reportedAt = at; }
        public Instant getAcknowledgedAt() { return acknowledgedAt; }
        public void setAcknowledgedAt(Instant at) { this.acknowledgedAt = at; }
        public Instant getResolvedAt() { return resolvedAt; }
        public void setResolvedAt(Instant at) { this.resolvedAt = at; }
        public Instant getClosedAt() { return closedAt; }
        public void setClosedAt(Instant at) { this.closedAt = at; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant at) { this.lastUpdated = at; }
        public Instant getResponseDeadline() { return responseDeadline; }
        public void setResponseDeadline(Instant deadline) { this.responseDeadline = deadline; }
        public Instant getResolutionDeadline() { return resolutionDeadline; }
        public void setResolutionDeadline(Instant deadline) { this.resolutionDeadline = deadline; }
        public Duration getResponseTime() { return responseTime; }
        public void setResponseTime(Duration time) { this.responseTime = time; }
        public Duration getResolutionTime() { return resolutionTime; }
        public void setResolutionTime(Duration time) { this.resolutionTime = time; }
        public boolean isResponseSLABreached() { return responseSLABreached; }
        public void setResponseSLABreached(boolean breached) { this.responseSLABreached = breached; }
        public boolean isResolutionSLABreached() { return resolutionSLABreached; }
        public void setResolutionSLABreached(boolean breached) { this.resolutionSLABreached = breached; }
        public List<AffectedAsset> getAffectedAssets() { return affectedAssets; }
        public void setAffectedAssets(List<AffectedAsset> assets) { this.affectedAssets = assets; }
        public ImpactAssessment getImpactAssessment() { return impactAssessment; }
        public void setImpactAssessment(ImpactAssessment assessment) { this.impactAssessment = assessment; }
        public List<InvestigationFinding> getInvestigationFindings() { return investigationFindings; }
        public void setInvestigationFindings(List<InvestigationFinding> findings) { this.investigationFindings = findings; }
        public List<ContainmentAction> getContainmentActions() { return containmentActions; }
        public void setContainmentActions(List<ContainmentAction> actions) { this.containmentActions = actions; }
        public List<EradicationAction> getEradicationActions() { return eradicationActions; }
        public void setEradicationActions(List<EradicationAction> actions) { this.eradicationActions = actions; }
        public List<RecoveryAction> getRecoveryActions() { return recoveryActions; }
        public void setRecoveryActions(List<RecoveryAction> actions) { this.recoveryActions = actions; }
        public List<TimelineEvent> getTimelineEvents() { return timelineEvents; }
        public void setTimelineEvents(List<TimelineEvent> events) { this.timelineEvents = events; }
    }

    public static class AffectedAsset {
        private String assetId;
        private String assetType;
        private String impactDescription;
        private Instant identifiedAt;

        public String getAssetId() { return assetId; }
        public void setAssetId(String id) { this.assetId = id; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String type) { this.assetType = type; }
        public String getImpactDescription() { return impactDescription; }
        public void setImpactDescription(String desc) { this.impactDescription = desc; }
        public Instant getIdentifiedAt() { return identifiedAt; }
        public void setIdentifiedAt(Instant at) { this.identifiedAt = at; }
    }

    public static class ImpactAssessment {
        private String businessImpact;
        private String dataImpact;
        private String systemImpact;
        private String reputationalImpact;
        private String financialImpact;
        private int affectedUserCount;
        private String assessedBy;
        private Instant assessedAt;

        public String getBusinessImpact() { return businessImpact; }
        public void setBusinessImpact(String impact) { this.businessImpact = impact; }
        public String getDataImpact() { return dataImpact; }
        public void setDataImpact(String impact) { this.dataImpact = impact; }
        public String getSystemImpact() { return systemImpact; }
        public void setSystemImpact(String impact) { this.systemImpact = impact; }
        public String getReputationalImpact() { return reputationalImpact; }
        public void setReputationalImpact(String impact) { this.reputationalImpact = impact; }
        public String getFinancialImpact() { return financialImpact; }
        public void setFinancialImpact(String impact) { this.financialImpact = impact; }
        public int getAffectedUserCount() { return affectedUserCount; }
        public void setAffectedUserCount(int count) { this.affectedUserCount = count; }
        public String getAssessedBy() { return assessedBy; }
        public void setAssessedBy(String by) { this.assessedBy = by; }
        public Instant getAssessedAt() { return assessedAt; }
        public void setAssessedAt(Instant at) { this.assessedAt = at; }
    }

    public static class InvestigationFinding {
        private String findingId;
        private String description;
        private String investigator;
        private FindingSeverity severity;
        private Instant foundAt;

        public String getFindingId() { return findingId; }
        public void setFindingId(String id) { this.findingId = id; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public String getInvestigator() { return investigator; }
        public void setInvestigator(String investigator) { this.investigator = investigator; }
        public FindingSeverity getSeverity() { return severity; }
        public void setSeverity(FindingSeverity severity) { this.severity = severity; }
        public Instant getFoundAt() { return foundAt; }
        public void setFoundAt(Instant at) { this.foundAt = at; }
    }

    public static class ContainmentAction {
        private String actionId;
        private String action;
        private String performedBy;
        private Instant performedAt;
        private boolean successful;

        public String getActionId() { return actionId; }
        public void setActionId(String id) { this.actionId = id; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getPerformedBy() { return performedBy; }
        public void setPerformedBy(String by) { this.performedBy = by; }
        public Instant getPerformedAt() { return performedAt; }
        public void setPerformedAt(Instant at) { this.performedAt = at; }
        public boolean isSuccessful() { return successful; }
        public void setSuccessful(boolean successful) { this.successful = successful; }
    }

    public static class EradicationAction {
        private String actionId;
        private String action;
        private String performedBy;
        private Instant performedAt;
        private String verification;

        public String getActionId() { return actionId; }
        public void setActionId(String id) { this.actionId = id; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getPerformedBy() { return performedBy; }
        public void setPerformedBy(String by) { this.performedBy = by; }
        public Instant getPerformedAt() { return performedAt; }
        public void setPerformedAt(Instant at) { this.performedAt = at; }
        public String getVerification() { return verification; }
        public void setVerification(String verification) { this.verification = verification; }
    }

    public static class RecoveryAction {
        private String actionId;
        private String action;
        private String performedBy;
        private Instant performedAt;
        private boolean verified;

        public String getActionId() { return actionId; }
        public void setActionId(String id) { this.actionId = id; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getPerformedBy() { return performedBy; }
        public void setPerformedBy(String by) { this.performedBy = by; }
        public Instant getPerformedAt() { return performedAt; }
        public void setPerformedAt(Instant at) { this.performedAt = at; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
    }

    public static class TimelineEvent {
        private final String eventType;
        private final String description;
        private final Instant timestamp;
        private final String actor;

        public TimelineEvent(String eventType, String description, Instant timestamp, String actor) {
            this.eventType = eventType;
            this.description = description;
            this.timestamp = timestamp;
            this.actor = actor;
        }

        public String getEventType() { return eventType; }
        public String getDescription() { return description; }
        public Instant getTimestamp() { return timestamp; }
        public String getActor() { return actor; }
    }

    public static class IncidentUpdate {
        private String updateId;
        private String incidentId;
        private IncidentStatus previousStatus;
        private IncidentStatus newStatus;
        private String updatedBy;
        private String notes;
        private Instant timestamp;

        public String getUpdateId() { return updateId; }
        public void setUpdateId(String id) { this.updateId = id; }
        public String getIncidentId() { return incidentId; }
        public void setIncidentId(String id) { this.incidentId = id; }
        public IncidentStatus getPreviousStatus() { return previousStatus; }
        public void setPreviousStatus(IncidentStatus status) { this.previousStatus = status; }
        public IncidentStatus getNewStatus() { return newStatus; }
        public void setNewStatus(IncidentStatus status) { this.newStatus = status; }
        public String getUpdatedBy() { return updatedBy; }
        public void setUpdatedBy(String by) { this.updatedBy = by; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public static class EscalationEvent {
        private String escalationId;
        private String incidentId;
        private EscalationLevel level;
        private String reason;
        private Instant escalatedAt;
        private List<ResponderContact> notifiedContacts;

        public String getEscalationId() { return escalationId; }
        public void setEscalationId(String id) { this.escalationId = id; }
        public String getIncidentId() { return incidentId; }
        public void setIncidentId(String id) { this.incidentId = id; }
        public EscalationLevel getLevel() { return level; }
        public void setLevel(EscalationLevel level) { this.level = level; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public Instant getEscalatedAt() { return escalatedAt; }
        public void setEscalatedAt(Instant at) { this.escalatedAt = at; }
        public List<ResponderContact> getNotifiedContacts() { return notifiedContacts; }
        public void setNotifiedContacts(List<ResponderContact> contacts) { this.notifiedContacts = contacts; }
    }

    public static class ResponderContact {
        private String name;
        private String role;
        private String email;
        private String phone;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class PostMortemReport {
        private String reportId;
        private String incidentId;
        private String author;
        private String incidentSummary;
        private List<TimelineEvent> timeline;
        private ImpactAssessment impactAssessment;
        private Duration responseTime;
        private Duration resolutionTime;
        private String rootCauseAnalysis;
        private List<String> whatWentWell;
        private List<String> whatWentWrong;
        private List<String> lessonsLearned;
        private List<ActionItem> actionItems;
        private List<String> preventiveMeasures;
        private boolean finalized;
        private String approvedBy;
        private Instant createdAt;
        private Instant lastUpdated;
        private Instant finalizedAt;

        // Getters and Setters
        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public String getIncidentId() { return incidentId; }
        public void setIncidentId(String id) { this.incidentId = id; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getIncidentSummary() { return incidentSummary; }
        public void setIncidentSummary(String summary) { this.incidentSummary = summary; }
        public List<TimelineEvent> getTimeline() { return timeline; }
        public void setTimeline(List<TimelineEvent> timeline) { this.timeline = timeline; }
        public ImpactAssessment getImpactAssessment() { return impactAssessment; }
        public void setImpactAssessment(ImpactAssessment assessment) { this.impactAssessment = assessment; }
        public Duration getResponseTime() { return responseTime; }
        public void setResponseTime(Duration time) { this.responseTime = time; }
        public Duration getResolutionTime() { return resolutionTime; }
        public void setResolutionTime(Duration time) { this.resolutionTime = time; }
        public String getRootCauseAnalysis() { return rootCauseAnalysis; }
        public void setRootCauseAnalysis(String rca) { this.rootCauseAnalysis = rca; }
        public List<String> getWhatWentWell() { return whatWentWell; }
        public void setWhatWentWell(List<String> list) { this.whatWentWell = list; }
        public List<String> getWhatWentWrong() { return whatWentWrong; }
        public void setWhatWentWrong(List<String> list) { this.whatWentWrong = list; }
        public List<String> getLessonsLearned() { return lessonsLearned; }
        public void setLessonsLearned(List<String> list) { this.lessonsLearned = list; }
        public List<ActionItem> getActionItems() { return actionItems; }
        public void setActionItems(List<ActionItem> items) { this.actionItems = items; }
        public List<String> getPreventiveMeasures() { return preventiveMeasures; }
        public void setPreventiveMeasures(List<String> measures) { this.preventiveMeasures = measures; }
        public boolean isFinalized() { return finalized; }
        public void setFinalized(boolean finalized) { this.finalized = finalized; }
        public String getApprovedBy() { return approvedBy; }
        public void setApprovedBy(String by) { this.approvedBy = by; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant at) { this.createdAt = at; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant at) { this.lastUpdated = at; }
        public Instant getFinalizedAt() { return finalizedAt; }
        public void setFinalizedAt(Instant at) { this.finalizedAt = at; }
    }

    public static class ActionItem {
        private String description;
        private String assignee;
        private LocalDate dueDate;
        private String status;
        private String priority;

        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public String getAssignee() { return assignee; }
        public void setAssignee(String assignee) { this.assignee = assignee; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate date) { this.dueDate = date; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }

    public static class IncidentResponseStats {
        private long totalIncidents;
        private int openIncidents;
        private int resolvedIncidents;
        private Map<IncidentSeverity, Long> bySeverity = new HashMap<>();
        private Map<IncidentType, Long> byType = new HashMap<>();
        private double averageResponseTimeMinutes;
        private double averageResolutionTimeMinutes;
        private double slaComplianceRate;
        private Instant generatedAt;

        public long getTotalIncidents() { return totalIncidents; }
        public void setTotalIncidents(long count) { this.totalIncidents = count; }
        public int getOpenIncidents() { return openIncidents; }
        public void setOpenIncidents(int count) { this.openIncidents = count; }
        public int getResolvedIncidents() { return resolvedIncidents; }
        public void setResolvedIncidents(int count) { this.resolvedIncidents = count; }
        public Map<IncidentSeverity, Long> getBySeverity() { return bySeverity; }
        public void setBySeverity(Map<IncidentSeverity, Long> map) { this.bySeverity = map; }
        public Map<IncidentType, Long> getByType() { return byType; }
        public void setByType(Map<IncidentType, Long> map) { this.byType = map; }
        public double getAverageResponseTimeMinutes() { return averageResponseTimeMinutes; }
        public void setAverageResponseTimeMinutes(double avg) { this.averageResponseTimeMinutes = avg; }
        public double getAverageResolutionTimeMinutes() { return averageResolutionTimeMinutes; }
        public void setAverageResolutionTimeMinutes(double avg) { this.averageResolutionTimeMinutes = avg; }
        public double getSlaComplianceRate() { return slaComplianceRate; }
        public void setSlaComplianceRate(double rate) { this.slaComplianceRate = rate; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }
}
