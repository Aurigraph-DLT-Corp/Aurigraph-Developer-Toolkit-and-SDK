package io.aurigraph.v11.compliance;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.logging.Log;
import io.aurigraph.v11.compliance.mica.*;
import io.aurigraph.v11.compliance.soc2.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Compliance REST API Resource
 *
 * Provides unified API endpoints for compliance operations:
 * - GET /api/v12/compliance/mica/status - MiCA compliance status
 * - GET /api/v12/compliance/soc2/readiness - SOC 2 readiness assessment
 * - GET /api/v12/compliance/audit-trail - Audit trail data
 * - POST /api/v12/compliance/incident - Report security incident
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@Path("/api/v12/compliance")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ComplianceResource {

    @Inject
    ComplianceDashboardService dashboardService;

    @Inject
    MiCAComplianceModule micaComplianceModule;

    @Inject
    MiCAAssetClassification micaAssetClassification;

    @Inject
    MiCAReportingService micaReportingService;

    @Inject
    SOC2AuditTrail soc2AuditTrail;

    @Inject
    AccessControlAudit accessControlAudit;

    @Inject
    IncidentResponseLogger incidentResponseLogger;

    // ============ Dashboard Endpoints ============

    /**
     * Get comprehensive compliance dashboard
     */
    @GET
    @Path("/dashboard")
    public Uni<Response> getDashboard() {
        Log.info("Getting compliance dashboard");

        try {
            var metrics = dashboardService.getDashboardMetrics();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "dashboard", metrics,
                    "generatedAt", Instant.now().toString()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error generating dashboard: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Get compliance alerts
     */
    @GET
    @Path("/alerts")
    public Uni<Response> getAlerts() {
        Log.info("Getting compliance alerts");

        try {
            var alerts = dashboardService.getComplianceAlerts();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "alerts", alerts,
                    "count", alerts.size()
                )).build()
            );
        } catch (Exception e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Get upcoming regulatory deadlines
     */
    @GET
    @Path("/deadlines")
    public Uni<Response> getDeadlines() {
        Log.info("Getting regulatory deadlines");

        try {
            var deadlines = dashboardService.getUpcomingDeadlines();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "deadlines", deadlines,
                    "count", deadlines.size()
                )).build()
            );
        } catch (Exception e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    // ============ MiCA Endpoints ============

    /**
     * Get MiCA compliance status
     */
    @GET
    @Path("/mica/status")
    public Uni<Response> getMiCAStatus() {
        Log.info("Getting MiCA compliance status");

        try {
            var metrics = dashboardService.getMiCAMetrics();
            var stats = micaComplianceModule.getStats();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "compliance", Map.of(
                        "overallScore", metrics.getMicaComplianceScore(),
                        "complianceRate", stats.getComplianceRate(),
                        "totalTokens", stats.getTotalTokens(),
                        "compliantTokens", stats.getCompliantTokens(),
                        "nonCompliantTokens", stats.getNonCompliantTokens()
                    ),
                    "classification", Map.of(
                        "totalClassified", metrics.getTotalClassified(),
                        "eMoneyTokens", metrics.getEMoneyTokens(),
                        "assetReferencedTokens", metrics.getAssetReferencedTokens(),
                        "utilityTokens", metrics.getUtilityTokens()
                    ),
                    "reporting", Map.of(
                        "totalQuarterlyReports", metrics.getTotalQuarterlyReports(),
                        "pendingSubmissions", metrics.getPendingSubmissions(),
                        "upcomingDeadlines", metrics.getUpcomingReportingDeadlines()
                    ),
                    "generatedAt", Instant.now().toString()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error getting MiCA status: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Perform MiCA compliance check for a token
     */
    @POST
    @Path("/mica/check/{tokenId}")
    public Uni<Response> checkMiCACompliance(
            @PathParam("tokenId") String tokenId,
            MiCAComplianceModule.IssuerInfo issuerInfo) {

        Log.infof("Checking MiCA compliance for token: %s", tokenId);

        try {
            var result = micaComplianceModule.performComplianceCheck(tokenId, issuerInfo);

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "tokenId", tokenId,
                    "compliant", result.isCompliant(),
                    "score", result.getComplianceScore(),
                    "assetClass", result.getAssetClass().getDisplayName(),
                    "violations", result.getAllViolations(),
                    "checkedAt", result.getCheckTimestamp().toString()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error checking MiCA compliance: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Classify a token per MiCA
     */
    @POST
    @Path("/mica/classify/{tokenId}")
    public Uni<Response> classifyToken(
            @PathParam("tokenId") String tokenId,
            MiCAComplianceModule.IssuerInfo issuerInfo) {

        Log.infof("Classifying token: %s", tokenId);

        try {
            var assetClass = micaAssetClassification.classifyAsset(tokenId, issuerInfo);
            var requirements = micaAssetClassification.getRequirements(assetClass);

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "tokenId", tokenId,
                    "assetClass", assetClass.name(),
                    "displayName", assetClass.getDisplayName(),
                    "description", assetClass.getDescription(),
                    "requirements", requirements.getRequirements(),
                    "minimumCapital", requirements.getMinimumCapital(),
                    "authorizationRequired", requirements.isAuthorizationRequired(),
                    "whitepaperRequired", requirements.isWhitepaperRequired(),
                    "reserveRequired", requirements.isReserveRequired()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error classifying token: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Generate quarterly reserve report
     */
    @POST
    @Path("/mica/reserve-report")
    public Uni<Response> generateQuarterlyReport(Map<String, Object> request) {
        String tokenId = (String) request.get("tokenId");
        Integer year = (Integer) request.get("year");
        Integer quarter = (Integer) request.get("quarter");

        Log.infof("Generating quarterly reserve report for token %s, Q%d %d",
            tokenId, quarter, year);

        try {
            var report = micaReportingService.generateQuarterlyReserveReport(
                tokenId, year, quarter);

            return Uni.createFrom().item(
                Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                        "success", true,
                        "reportId", report.getReportId(),
                        "tokenId", report.getTokenId(),
                        "quarter", report.getQuarter(),
                        "year", report.getYear(),
                        "reserveRatio", report.getReserveRatio(),
                        "compliant", report.isCompliant(),
                        "submissionDeadline", report.getSubmissionDeadline().toString()
                    ))
                    .build()
            );
        } catch (Exception e) {
            Log.errorf("Error generating reserve report: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Get MiCA compliance record for a token
     */
    @GET
    @Path("/mica/token/{tokenId}")
    public Uni<Response> getTokenCompliance(@PathParam("tokenId") String tokenId) {
        Log.infof("Getting MiCA compliance for token: %s", tokenId);

        var record = micaComplianceModule.getComplianceRecord(tokenId);

        if (record.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "No compliance record found for token"))
                    .build()
            );
        }

        var result = record.get().getResult();

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "tokenId", tokenId,
                "compliant", result.isCompliant(),
                "score", result.getComplianceScore(),
                "assetClass", result.getAssetClass().getDisplayName(),
                "violations", result.getAllViolations(),
                "checkedAt", result.getCheckTimestamp().toString()
            )).build()
        );
    }

    // ============ SOC 2 Endpoints ============

    /**
     * Get SOC 2 readiness assessment
     */
    @GET
    @Path("/soc2/readiness")
    public Uni<Response> getSOC2Readiness() {
        Log.info("Getting SOC 2 readiness");

        try {
            var metrics = dashboardService.getSOC2Metrics();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "readiness", Map.of(
                        "overallScore", metrics.getOverallReadinessScore(),
                        "security", metrics.getSecurityReadiness(),
                        "availability", metrics.getAvailabilityReadiness(),
                        "processingIntegrity", metrics.getProcessingIntegrityReadiness(),
                        "confidentiality", metrics.getConfidentialityReadiness(),
                        "privacy", metrics.getPrivacyReadiness()
                    ),
                    "events", Map.of(
                        "totalEvents", metrics.getTotalEventCount(),
                        "securityEvents", metrics.getSecurityEventCount(),
                        "availabilityEvents", metrics.getAvailabilityEventCount(),
                        "processingIntegrityEvents", metrics.getProcessingIntegrityEventCount(),
                        "confidentialityEvents", metrics.getConfidentialityEventCount(),
                        "privacyEvents", metrics.getPrivacyEventCount()
                    ),
                    "accessControl", Map.of(
                        "totalAccessEvents", metrics.getTotalAccessEvents(),
                        "authenticationSuccessRate", metrics.getAuthenticationSuccessRate(),
                        "activeSessions", metrics.getActiveSessionCount(),
                        "privilegedAccessCount", metrics.getPrivilegedAccessCount()
                    ),
                    "controlEvidence", metrics.getControlEvidenceCount(),
                    "generatedAt", Instant.now().toString()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error getting SOC 2 readiness: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Get SOC 2 audit trail events
     */
    @GET
    @Path("/soc2/events/{category}")
    public Uni<Response> getSOC2Events(
            @PathParam("category") String categoryName,
            @QueryParam("limit") @DefaultValue("100") int limit) {

        Log.infof("Getting SOC 2 events for category: %s", categoryName);

        try {
            SOC2AuditTrail.TrustServiceCategory category =
                SOC2AuditTrail.TrustServiceCategory.valueOf(categoryName.toUpperCase());

            var events = soc2AuditTrail.getEvents(category);
            var limitedEvents = events.stream()
                .sorted((e1, e2) -> e2.getTimestamp().compareTo(e1.getTimestamp()))
                .limit(limit)
                .toList();

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "category", category.getDisplayName(),
                    "events", limitedEvents.stream().map(this::eventToMap).toList(),
                    "count", limitedEvents.size(),
                    "totalCount", events.size()
                )).build()
            );
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid category: " + categoryName))
                    .build()
            );
        }
    }

    /**
     * Get SOC 2 statistics
     */
    @GET
    @Path("/soc2/stats")
    public Uni<Response> getSOC2Stats() {
        Log.info("Getting SOC 2 statistics");

        var stats = soc2AuditTrail.getStats();

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "stats", Map.of(
                    "securityEvents", stats.getSecurityEventCount(),
                    "availabilityEvents", stats.getAvailabilityEventCount(),
                    "processingIntegrityEvents", stats.getProcessingIntegrityEventCount(),
                    "confidentialityEvents", stats.getConfidentialityEventCount(),
                    "privacyEvents", stats.getPrivacyEventCount(),
                    "totalEvents", stats.getTotalEventCount(),
                    "controlEvidence", stats.getControlEvidenceCount()
                ),
                "generatedAt", stats.getGeneratedAt().toString()
            )).build()
        );
    }

    // ============ Audit Trail Endpoints ============

    /**
     * Get audit trail data
     */
    @GET
    @Path("/audit-trail")
    public Uni<Response> getAuditTrail(
            @QueryParam("source") String source,
            @QueryParam("limit") @DefaultValue("100") int limit) {

        Log.info("Getting audit trail");

        try {
            var stats = dashboardService.getAuditTrailStats();

            List<Object> events = new ArrayList<>();

            if (source == null || "mica".equalsIgnoreCase(source)) {
                var micaEvents = micaComplianceModule.getAuditTrail().stream()
                    .sorted((e1, e2) -> e2.getTimestamp().compareTo(e1.getTimestamp()))
                    .limit(limit / 2)
                    .map(this::micaAuditToMap)
                    .toList();
                events.addAll(micaEvents);
            }

            if (source == null || "soc2".equalsIgnoreCase(source)) {
                for (var category : SOC2AuditTrail.TrustServiceCategory.values()) {
                    var categoryEvents = soc2AuditTrail.getEvents(category).stream()
                        .sorted((e1, e2) -> e2.getTimestamp().compareTo(e1.getTimestamp()))
                        .limit(limit / 10)
                        .map(this::eventToMap)
                        .toList();
                    events.addAll(categoryEvents);
                }
            }

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "statistics", Map.of(
                        "totalEvents", stats.getTotalAuditEvents(),
                        "micaEvents", stats.getMicaAuditEvents(),
                        "soc2Events", stats.getSoc2AuditEvents(),
                        "last24Hours", stats.getEventsLast24Hours(),
                        "last7Days", stats.getEventsLast7Days(),
                        "last30Days", stats.getEventsLast30Days()
                    ),
                    "events", events,
                    "count", events.size()
                )).build()
            );
        } catch (Exception e) {
            Log.errorf("Error getting audit trail: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    // ============ Incident Endpoints ============

    /**
     * Report a security incident
     */
    @POST
    @Path("/incident")
    public Uni<Response> reportIncident(Map<String, Object> request) {
        Log.info("Reporting security incident");

        try {
            String typeStr = (String) request.get("type");
            String severityStr = (String) request.get("severity");
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String reportedBy = (String) request.get("reportedBy");
            String affectedSystem = (String) request.get("affectedSystem");

            IncidentResponseLogger.IncidentType type =
                IncidentResponseLogger.IncidentType.valueOf(typeStr);
            IncidentResponseLogger.IncidentSeverity severity =
                IncidentResponseLogger.IncidentSeverity.valueOf(severityStr);

            var incident = incidentResponseLogger.createIncident(
                type, severity, title, description, reportedBy, affectedSystem);

            return Uni.createFrom().item(
                Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                        "success", true,
                        "incident", Map.of(
                            "incidentId", incident.getIncidentId(),
                            "type", incident.getType().name(),
                            "severity", incident.getSeverity().name(),
                            "title", incident.getTitle(),
                            "status", incident.getStatus().name(),
                            "reportedAt", incident.getReportedAt().toString(),
                            "responseDeadline", incident.getResponseDeadline().toString(),
                            "resolutionDeadline", incident.getResolutionDeadline().toString()
                        )
                    ))
                    .build()
            );
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid incident type or severity"))
                    .build()
            );
        } catch (Exception e) {
            Log.errorf("Error reporting incident: %s", e.getMessage());
            return Uni.createFrom().item(
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build()
            );
        }
    }

    /**
     * Get incident by ID
     */
    @GET
    @Path("/incident/{incidentId}")
    public Uni<Response> getIncident(@PathParam("incidentId") String incidentId) {
        Log.infof("Getting incident: %s", incidentId);

        var incident = incidentResponseLogger.getIncident(incidentId);

        if (incident.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Incident not found"))
                    .build()
            );
        }

        var inc = incident.get();
        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "incident", incidentToMap(inc)
            )).build()
        );
    }

    /**
     * Update incident status
     */
    @PUT
    @Path("/incident/{incidentId}/status")
    public Uni<Response> updateIncidentStatus(
            @PathParam("incidentId") String incidentId,
            Map<String, String> request) {

        Log.infof("Updating incident status: %s", incidentId);

        try {
            String statusStr = request.get("status");
            String updatedBy = request.get("updatedBy");
            String notes = request.get("notes");

            IncidentResponseLogger.IncidentStatus status =
                IncidentResponseLogger.IncidentStatus.valueOf(statusStr);

            var update = incidentResponseLogger.updateIncidentStatus(
                incidentId, status, updatedBy, notes);

            return Uni.createFrom().item(
                Response.ok(Map.of(
                    "success", true,
                    "update", Map.of(
                        "updateId", update.getUpdateId(),
                        "previousStatus", update.getPreviousStatus().name(),
                        "newStatus", update.getNewStatus().name(),
                        "updatedBy", update.getUpdatedBy(),
                        "timestamp", update.getTimestamp().toString()
                    )
                )).build()
            );
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid status or incident not found"))
                    .build()
            );
        }
    }

    /**
     * Get all incidents
     */
    @GET
    @Path("/incidents")
    public Uni<Response> getAllIncidents(
            @QueryParam("status") String status,
            @QueryParam("severity") String severity) {

        Log.info("Getting all incidents");

        List<IncidentResponseLogger.SecurityIncident> incidents;

        if (status != null) {
            IncidentResponseLogger.IncidentStatus incidentStatus =
                IncidentResponseLogger.IncidentStatus.valueOf(status);
            incidents = incidentResponseLogger.getIncidentsByStatus(incidentStatus);
        } else if (severity != null) {
            IncidentResponseLogger.IncidentSeverity incidentSeverity =
                IncidentResponseLogger.IncidentSeverity.valueOf(severity);
            incidents = incidentResponseLogger.getIncidentsBySeverity(incidentSeverity);
        } else {
            incidents = incidentResponseLogger.getAllIncidents();
        }

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "incidents", incidents.stream().map(this::incidentToMap).toList(),
                "count", incidents.size()
            )).build()
        );
    }

    /**
     * Get incident response statistics
     */
    @GET
    @Path("/incidents/stats")
    public Uni<Response> getIncidentStats() {
        Log.info("Getting incident statistics");

        var stats = incidentResponseLogger.getStats();

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "stats", Map.of(
                    "totalIncidents", stats.getTotalIncidents(),
                    "openIncidents", stats.getOpenIncidents(),
                    "resolvedIncidents", stats.getResolvedIncidents(),
                    "averageResponseTimeMinutes", stats.getAverageResponseTimeMinutes(),
                    "averageResolutionTimeMinutes", stats.getAverageResolutionTimeMinutes(),
                    "slaComplianceRate", stats.getSlaComplianceRate()
                ),
                "generatedAt", stats.getGeneratedAt().toString()
            )).build()
        );
    }

    // ============ Access Control Endpoints ============

    /**
     * Get access control statistics
     */
    @GET
    @Path("/access-control/stats")
    public Uni<Response> getAccessControlStats() {
        Log.info("Getting access control statistics");

        var stats = accessControlAudit.getStats();

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "stats", Map.of(
                    "totalAccessEvents", stats.getTotalAccessEvents(),
                    "totalPermissionChanges", stats.getTotalPermissionChanges(),
                    "totalAuthenticationEvents", stats.getTotalAuthenticationEvents(),
                    "totalSessionEvents", stats.getTotalSessionEvents(),
                    "totalPrivilegedAccessEvents", stats.getTotalPrivilegedAccessEvents(),
                    "activeSessionCount", stats.getActiveSessionCount(),
                    "authenticationSuccessRate", stats.getAuthenticationSuccessRate()
                ),
                "generatedAt", stats.getGeneratedAt().toString()
            )).build()
        );
    }

    /**
     * Get active sessions
     */
    @GET
    @Path("/access-control/sessions")
    public Uni<Response> getActiveSessions() {
        Log.info("Getting active sessions");

        var sessions = accessControlAudit.getActiveSessions();

        return Uni.createFrom().item(
            Response.ok(Map.of(
                "success", true,
                "sessions", sessions.stream().map(s -> Map.of(
                    "sessionId", s.getSessionId(),
                    "userId", s.getUserId(),
                    "sessionType", s.getSessionType().name(),
                    "sourceIp", s.getSourceIp(),
                    "createdAt", s.getCreatedAt().toString(),
                    "lastActivity", s.getLastActivity().toString()
                )).toList(),
                "count", sessions.size()
            )).build()
        );
    }

    // ============ Health Endpoint ============

    /**
     * Compliance API health check
     */
    @GET
    @Path("/health")
    public Uni<Response> health() {
        return Uni.createFrom().item(
            Response.ok(Map.of(
                "status", "healthy",
                "service", "Compliance & Audit API",
                "version", "1.0.0",
                "modules", Map.of(
                    "mica", micaComplianceModule != null,
                    "soc2", soc2AuditTrail != null,
                    "accessControl", accessControlAudit != null,
                    "incidentResponse", incidentResponseLogger != null,
                    "dashboard", dashboardService != null
                ),
                "timestamp", Instant.now().toString()
            )).build()
        );
    }

    // ============ Helper Methods ============

    private Map<String, Object> eventToMap(SOC2AuditTrail.AuditEvent event) {
        return Map.of(
            "eventId", event.getEventId(),
            "category", event.getCategory().getDisplayName(),
            "eventType", event.getEventType(),
            "actor", event.getActor(),
            "resource", event.getResource(),
            "action", event.getAction(),
            "severity", event.getSeverity().name(),
            "timestamp", event.getTimestamp().toString()
        );
    }

    private Map<String, Object> micaAuditToMap(MiCAComplianceModule.ComplianceAuditEntry entry) {
        return Map.of(
            "eventType", entry.getEventType(),
            "tokenId", entry.getTokenId(),
            "status", entry.getStatus(),
            "details", entry.getDetails(),
            "timestamp", entry.getTimestamp().toString()
        );
    }

    private Map<String, Object> incidentToMap(IncidentResponseLogger.SecurityIncident inc) {
        Map<String, Object> map = new HashMap<>();
        map.put("incidentId", inc.getIncidentId());
        map.put("type", inc.getType().name());
        map.put("severity", inc.getSeverity().name());
        map.put("title", inc.getTitle());
        map.put("description", inc.getDescription());
        map.put("status", inc.getStatus().name());
        map.put("reportedBy", inc.getReportedBy());
        map.put("assignedTo", inc.getAssignedTo());
        map.put("affectedSystem", inc.getAffectedSystem());
        map.put("reportedAt", inc.getReportedAt().toString());
        map.put("lastUpdated", inc.getLastUpdated().toString());

        if (inc.getAcknowledgedAt() != null) {
            map.put("acknowledgedAt", inc.getAcknowledgedAt().toString());
        }
        if (inc.getResolvedAt() != null) {
            map.put("resolvedAt", inc.getResolvedAt().toString());
        }
        if (inc.getResponseTime() != null) {
            map.put("responseTimeMinutes", inc.getResponseTime().toMinutes());
        }
        if (inc.getResolutionTime() != null) {
            map.put("resolutionTimeMinutes", inc.getResolutionTime().toMinutes());
        }

        map.put("responseSLABreached", inc.isResponseSLABreached());
        map.put("resolutionSLABreached", inc.isResolutionSLABreached());

        return map;
    }
}
