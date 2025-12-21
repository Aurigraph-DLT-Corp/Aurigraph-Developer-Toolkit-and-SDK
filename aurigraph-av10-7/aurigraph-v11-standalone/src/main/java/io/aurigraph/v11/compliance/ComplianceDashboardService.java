package io.aurigraph.v11.compliance;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.aurigraph.v11.compliance.mica.MiCAComplianceModule;
import io.aurigraph.v11.compliance.mica.MiCAAssetClassification;
import io.aurigraph.v11.compliance.mica.MiCAReportingService;
import io.aurigraph.v11.compliance.soc2.SOC2AuditTrail;
import io.aurigraph.v11.compliance.soc2.AccessControlAudit;
import io.aurigraph.v11.compliance.soc2.IncidentResponseLogger;
import java.time.*;
import java.util.*;

/**
 * Compliance Dashboard Service
 *
 * Aggregates compliance metrics from all compliance modules:
 * - MiCA compliance status and scoring
 * - SOC 2 readiness assessment
 * - Audit trail statistics
 * - Regulatory deadline tracking
 * - Incident response metrics
 *
 * Provides a unified view of the organization's compliance posture
 * for regulatory reporting and executive dashboards.
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class ComplianceDashboardService {

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

    /**
     * Get comprehensive compliance dashboard metrics
     */
    public ComplianceDashboardMetrics getDashboardMetrics() {
        Log.info("Generating compliance dashboard metrics");

        ComplianceDashboardMetrics metrics = new ComplianceDashboardMetrics();
        metrics.setGeneratedAt(Instant.now());

        // MiCA Compliance Metrics
        metrics.setMicaMetrics(getMiCAMetrics());

        // SOC 2 Readiness Metrics
        metrics.setSoc2Metrics(getSOC2Metrics());

        // Audit Trail Statistics
        metrics.setAuditTrailStats(getAuditTrailStats());

        // Incident Response Metrics
        metrics.setIncidentMetrics(getIncidentMetrics());

        // Regulatory Deadlines
        metrics.setUpcomingDeadlines(getUpcomingDeadlines());

        // Calculate overall compliance score
        metrics.setOverallComplianceScore(calculateOverallScore(metrics));
        metrics.setOverallComplianceStatus(determineOverallStatus(metrics.getOverallComplianceScore()));

        return metrics;
    }

    /**
     * Get MiCA compliance metrics
     */
    public MiCADashboardMetrics getMiCAMetrics() {
        MiCADashboardMetrics metrics = new MiCADashboardMetrics();

        if (micaComplianceModule != null) {
            var stats = micaComplianceModule.getStats();
            metrics.setTotalTokens(stats.getTotalTokens());
            metrics.setCompliantTokens(stats.getCompliantTokens());
            metrics.setNonCompliantTokens(stats.getNonCompliantTokens());
            metrics.setComplianceRate(stats.getComplianceRate());

            // Asset classification breakdown
            metrics.setAssetClassBreakdown(stats.getByAssetClass());
        }

        if (micaAssetClassification != null) {
            var classStats = micaAssetClassification.getStats();
            metrics.setTotalClassified(classStats.getTotalClassified());
            metrics.setEMoneyTokens(classStats.getEMoneyTokens());
            metrics.setAssetReferencedTokens(classStats.getAssetReferencedTokens());
            metrics.setUtilityTokens(classStats.getUtilityTokens());
        }

        if (micaReportingService != null) {
            var reportStats = micaReportingService.getStats();
            metrics.setTotalQuarterlyReports(reportStats.getTotalQuarterlyReports());
            metrics.setPendingSubmissions(reportStats.getPendingSubmissions());
            metrics.setUpcomingReportingDeadlines(reportStats.getUpcomingDeadlines());
        }

        // Calculate MiCA compliance score (0-100)
        metrics.setMicaComplianceScore(calculateMiCAScore(metrics));

        return metrics;
    }

    /**
     * Get SOC 2 readiness metrics
     */
    public SOC2DashboardMetrics getSOC2Metrics() {
        SOC2DashboardMetrics metrics = new SOC2DashboardMetrics();

        if (soc2AuditTrail != null) {
            var stats = soc2AuditTrail.getStats();
            metrics.setSecurityEventCount(stats.getSecurityEventCount());
            metrics.setAvailabilityEventCount(stats.getAvailabilityEventCount());
            metrics.setProcessingIntegrityEventCount(stats.getProcessingIntegrityEventCount());
            metrics.setConfidentialityEventCount(stats.getConfidentialityEventCount());
            metrics.setPrivacyEventCount(stats.getPrivacyEventCount());
            metrics.setTotalEventCount(stats.getTotalEventCount());
            metrics.setControlEvidenceCount(stats.getControlEvidenceCount());
        }

        if (accessControlAudit != null) {
            var accessStats = accessControlAudit.getStats();
            metrics.setTotalAccessEvents(accessStats.getTotalAccessEvents());
            metrics.setAuthenticationSuccessRate(accessStats.getAuthenticationSuccessRate());
            metrics.setActiveSessionCount(accessStats.getActiveSessionCount());
            metrics.setPrivilegedAccessCount(accessStats.getTotalPrivilegedAccessEvents());
        }

        // SOC 2 Control Categories Readiness
        metrics.setSecurityReadiness(calculateCategoryReadiness(
            SOC2AuditTrail.TrustServiceCategory.SECURITY));
        metrics.setAvailabilityReadiness(calculateCategoryReadiness(
            SOC2AuditTrail.TrustServiceCategory.AVAILABILITY));
        metrics.setProcessingIntegrityReadiness(calculateCategoryReadiness(
            SOC2AuditTrail.TrustServiceCategory.PROCESSING_INTEGRITY));
        metrics.setConfidentialityReadiness(calculateCategoryReadiness(
            SOC2AuditTrail.TrustServiceCategory.CONFIDENTIALITY));
        metrics.setPrivacyReadiness(calculateCategoryReadiness(
            SOC2AuditTrail.TrustServiceCategory.PRIVACY));

        // Calculate overall SOC 2 readiness (0-100)
        metrics.setOverallReadinessScore(calculateSOC2ReadinessScore(metrics));

        return metrics;
    }

    /**
     * Get audit trail statistics
     */
    public AuditTrailStatistics getAuditTrailStats() {
        AuditTrailStatistics stats = new AuditTrailStatistics();

        long totalEvents = 0;
        long totalMiCAEvents = 0;
        long totalSOC2Events = 0;

        if (micaComplianceModule != null) {
            totalMiCAEvents = micaComplianceModule.getAuditTrail().size();
        }

        if (soc2AuditTrail != null) {
            var soc2Stats = soc2AuditTrail.getStats();
            totalSOC2Events = soc2Stats.getTotalEventCount();
        }

        totalEvents = totalMiCAEvents + totalSOC2Events;

        stats.setTotalAuditEvents(totalEvents);
        stats.setMicaAuditEvents(totalMiCAEvents);
        stats.setSoc2AuditEvents(totalSOC2Events);

        // Events by time period
        Instant now = Instant.now();
        Instant last24h = now.minus(Duration.ofHours(24));
        Instant last7d = now.minus(Duration.ofDays(7));
        Instant last30d = now.minus(Duration.ofDays(30));

        if (soc2AuditTrail != null) {
            stats.setEventsLast24Hours(countEventsSince(last24h));
            stats.setEventsLast7Days(countEventsSince(last7d));
            stats.setEventsLast30Days(countEventsSince(last30d));
        }

        // Audit coverage metrics
        stats.setAuditCoverageScore(calculateAuditCoverageScore());

        return stats;
    }

    /**
     * Get incident response metrics
     */
    public IncidentDashboardMetrics getIncidentMetrics() {
        IncidentDashboardMetrics metrics = new IncidentDashboardMetrics();

        if (incidentResponseLogger != null) {
            var stats = incidentResponseLogger.getStats();
            metrics.setTotalIncidents(stats.getTotalIncidents());
            metrics.setOpenIncidents(stats.getOpenIncidents());
            metrics.setResolvedIncidents(stats.getResolvedIncidents());
            metrics.setAverageResponseTimeMinutes(stats.getAverageResponseTimeMinutes());
            metrics.setAverageResolutionTimeMinutes(stats.getAverageResolutionTimeMinutes());
            metrics.setSlaComplianceRate(stats.getSlaComplianceRate());
            metrics.setIncidentsBySeverity(stats.getBySeverity());
            metrics.setIncidentsByType(stats.getByType());
        }

        // Calculate incident response score
        metrics.setIncidentResponseScore(calculateIncidentResponseScore(metrics));

        return metrics;
    }

    /**
     * Get upcoming regulatory deadlines
     */
    public List<RegulatoryDeadline> getUpcomingDeadlines() {
        List<RegulatoryDeadline> deadlines = new ArrayList<>();

        // Add MiCA reporting deadlines
        if (micaReportingService != null) {
            for (var submission : micaReportingService.getPendingSubmissions()) {
                RegulatoryDeadline deadline = new RegulatoryDeadline();
                deadline.setDeadlineId(submission.getSubmissionId());
                deadline.setType("MICA_SUBMISSION");
                deadline.setDescription(submission.getSubmissionType().name() + " for " +
                    submission.getTokenId());
                deadline.setDeadlineDate(submission.getDeadline());
                deadline.setStatus(determineDeadlineStatus(submission.getDeadline()));
                deadline.setPriority(determinePriority(submission.getDeadline()));
                deadlines.add(deadline);
            }
        }

        // Add quarterly reserve report deadlines
        LocalDate today = LocalDate.now();
        int currentQuarter = (today.getMonthValue() - 1) / 3 + 1;
        LocalDate quarterEnd = getQuarterEndDate(today.getYear(), currentQuarter);
        LocalDate reportDeadline = quarterEnd.plusDays(15);

        if (reportDeadline.isAfter(today)) {
            RegulatoryDeadline qrrDeadline = new RegulatoryDeadline();
            qrrDeadline.setDeadlineId("QRR-Q" + currentQuarter + "-" + today.getYear());
            qrrDeadline.setType("QUARTERLY_RESERVE_REPORT");
            qrrDeadline.setDescription("Q" + currentQuarter + " " + today.getYear() +
                " Reserve Report Deadline");
            qrrDeadline.setDeadlineDate(reportDeadline);
            qrrDeadline.setStatus(determineDeadlineStatus(reportDeadline));
            qrrDeadline.setPriority(determinePriority(reportDeadline));
            deadlines.add(qrrDeadline);
        }

        // Sort by deadline date
        deadlines.sort(Comparator.comparing(RegulatoryDeadline::getDeadlineDate));

        return deadlines;
    }

    /**
     * Get compliance trends over time
     */
    public ComplianceTrends getComplianceTrends(int days) {
        ComplianceTrends trends = new ComplianceTrends();
        trends.setPeriodDays(days);

        List<DailyComplianceSnapshot> snapshots = new ArrayList<>();

        // Generate daily snapshots (in production, would be from historical data)
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyComplianceSnapshot snapshot = new DailyComplianceSnapshot();
            snapshot.setDate(date);
            // In production, these would come from stored historical data
            snapshot.setMicaScore(calculateMiCAScore(getMiCAMetrics()));
            snapshot.setSoc2Score(calculateSOC2ReadinessScore(getSOC2Metrics()));
            snapshot.setOverallScore(calculateOverallScore(getDashboardMetrics()));
            snapshots.add(snapshot);
        }

        trends.setDailySnapshots(snapshots);

        // Calculate trend direction
        if (snapshots.size() >= 2) {
            double firstScore = snapshots.get(0).getOverallScore();
            double lastScore = snapshots.get(snapshots.size() - 1).getOverallScore();
            trends.setTrendDirection(lastScore > firstScore ? "IMPROVING" :
                lastScore < firstScore ? "DECLINING" : "STABLE");
            trends.setTrendPercentage(lastScore - firstScore);
        }

        return trends;
    }

    /**
     * Get compliance alerts
     */
    public List<ComplianceAlert> getComplianceAlerts() {
        List<ComplianceAlert> alerts = new ArrayList<>();

        // Check for MiCA compliance issues
        if (micaComplianceModule != null) {
            var stats = micaComplianceModule.getStats();
            if (stats.getNonCompliantTokens() > 0) {
                alerts.add(new ComplianceAlert(
                    "MICA_NON_COMPLIANT",
                    "WARNING",
                    stats.getNonCompliantTokens() + " tokens are non-compliant with MiCA",
                    "Review and remediate non-compliant tokens"
                ));
            }
        }

        // Check for incident response issues
        if (incidentResponseLogger != null) {
            var stats = incidentResponseLogger.getStats();
            if (stats.getOpenIncidents() > 0) {
                var criticalIncidents = incidentResponseLogger.getIncidentsBySeverity(
                    IncidentResponseLogger.IncidentSeverity.CRITICAL);
                if (!criticalIncidents.isEmpty()) {
                    alerts.add(new ComplianceAlert(
                        "CRITICAL_INCIDENTS_OPEN",
                        "CRITICAL",
                        criticalIncidents.size() + " critical incidents remain open",
                        "Immediately address critical security incidents"
                    ));
                }
            }

            if (stats.getSlaComplianceRate() < 95.0) {
                alerts.add(new ComplianceAlert(
                    "SLA_COMPLIANCE_LOW",
                    "WARNING",
                    String.format("SLA compliance rate is %.1f%% (target: 95%%)",
                        stats.getSlaComplianceRate()),
                    "Review incident response procedures"
                ));
            }
        }

        // Check for upcoming deadlines
        List<RegulatoryDeadline> deadlines = getUpcomingDeadlines();
        for (RegulatoryDeadline deadline : deadlines) {
            if ("CRITICAL".equals(deadline.getStatus()) || "OVERDUE".equals(deadline.getStatus())) {
                alerts.add(new ComplianceAlert(
                    "DEADLINE_" + deadline.getStatus(),
                    deadline.getStatus(),
                    "Regulatory deadline approaching: " + deadline.getDescription(),
                    "Complete and submit required documentation"
                ));
            }
        }

        // Check SOC 2 readiness
        SOC2DashboardMetrics soc2Metrics = getSOC2Metrics();
        if (soc2Metrics.getOverallReadinessScore() < 80.0) {
            alerts.add(new ComplianceAlert(
                "SOC2_READINESS_LOW",
                "WARNING",
                String.format("SOC 2 readiness score is %.1f%% (target: 80%%)",
                    soc2Metrics.getOverallReadinessScore()),
                "Increase control evidence documentation"
            ));
        }

        // Sort by severity
        alerts.sort((a, b) -> {
            Map<String, Integer> severityOrder = Map.of(
                "CRITICAL", 0, "WARNING", 1, "INFO", 2
            );
            return Integer.compare(
                severityOrder.getOrDefault(a.getSeverity(), 3),
                severityOrder.getOrDefault(b.getSeverity(), 3)
            );
        });

        return alerts;
    }

    // ============ Helper Methods ============

    private double calculateMiCAScore(MiCADashboardMetrics metrics) {
        if (metrics.getTotalTokens() == 0) {
            return 100.0; // No tokens = fully compliant by default
        }
        return metrics.getComplianceRate();
    }

    private double calculateSOC2ReadinessScore(SOC2DashboardMetrics metrics) {
        // Average of all category readiness scores
        double total = metrics.getSecurityReadiness() +
                      metrics.getAvailabilityReadiness() +
                      metrics.getProcessingIntegrityReadiness() +
                      metrics.getConfidentialityReadiness() +
                      metrics.getPrivacyReadiness();
        return total / 5.0;
    }

    private double calculateCategoryReadiness(SOC2AuditTrail.TrustServiceCategory category) {
        // In production, would calculate based on control evidence completeness
        // For now, return a baseline based on event count
        if (soc2AuditTrail != null) {
            var events = soc2AuditTrail.getEvents(category);
            var evidence = soc2AuditTrail.getControlEvidence(category);

            // Simple formula: more evidence = higher readiness
            double eventScore = Math.min(events.size() / 100.0 * 50, 50);
            double evidenceScore = Math.min(evidence.size() / 10.0 * 50, 50);
            return eventScore + evidenceScore;
        }
        return 0.0;
    }

    private double calculateIncidentResponseScore(IncidentDashboardMetrics metrics) {
        double score = 100.0;

        // Deduct for open incidents
        score -= metrics.getOpenIncidents() * 5;

        // Deduct for poor SLA compliance
        if (metrics.getSlaComplianceRate() < 100) {
            score -= (100 - metrics.getSlaComplianceRate()) * 0.5;
        }

        // Deduct for slow response times (target: 60 minutes)
        if (metrics.getAverageResponseTimeMinutes() > 60) {
            score -= (metrics.getAverageResponseTimeMinutes() - 60) / 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    private double calculateAuditCoverageScore() {
        // In production, would calculate based on covered vs required controls
        // For now, return based on event distribution
        if (soc2AuditTrail != null) {
            var stats = soc2AuditTrail.getStats();
            int categoriesWithEvents = 0;

            if (stats.getSecurityEventCount() > 0) categoriesWithEvents++;
            if (stats.getAvailabilityEventCount() > 0) categoriesWithEvents++;
            if (stats.getProcessingIntegrityEventCount() > 0) categoriesWithEvents++;
            if (stats.getConfidentialityEventCount() > 0) categoriesWithEvents++;
            if (stats.getPrivacyEventCount() > 0) categoriesWithEvents++;

            return categoriesWithEvents * 20.0;
        }
        return 0.0;
    }

    private double calculateOverallScore(ComplianceDashboardMetrics metrics) {
        // Weighted average of all compliance scores
        double micaWeight = 0.35;
        double soc2Weight = 0.35;
        double incidentWeight = 0.20;
        double auditWeight = 0.10;

        double micaScore = metrics.getMicaMetrics() != null ?
            metrics.getMicaMetrics().getMicaComplianceScore() : 0;
        double soc2Score = metrics.getSoc2Metrics() != null ?
            metrics.getSoc2Metrics().getOverallReadinessScore() : 0;
        double incidentScore = metrics.getIncidentMetrics() != null ?
            metrics.getIncidentMetrics().getIncidentResponseScore() : 0;
        double auditScore = metrics.getAuditTrailStats() != null ?
            metrics.getAuditTrailStats().getAuditCoverageScore() : 0;

        return (micaScore * micaWeight) +
               (soc2Score * soc2Weight) +
               (incidentScore * incidentWeight) +
               (auditScore * auditWeight);
    }

    private String determineOverallStatus(double score) {
        if (score >= 90) return "EXCELLENT";
        if (score >= 80) return "GOOD";
        if (score >= 70) return "FAIR";
        if (score >= 60) return "NEEDS_IMPROVEMENT";
        return "CRITICAL";
    }

    private String determineDeadlineStatus(LocalDate deadline) {
        LocalDate today = LocalDate.now();
        long daysUntil = Duration.between(today.atStartOfDay(), deadline.atStartOfDay()).toDays();

        if (daysUntil < 0) return "OVERDUE";
        if (daysUntil <= 3) return "CRITICAL";
        if (daysUntil <= 7) return "URGENT";
        if (daysUntil <= 14) return "UPCOMING";
        return "SCHEDULED";
    }

    private String determinePriority(LocalDate deadline) {
        String status = determineDeadlineStatus(deadline);
        switch (status) {
            case "OVERDUE":
            case "CRITICAL": return "P1";
            case "URGENT": return "P2";
            case "UPCOMING": return "P3";
            default: return "P4";
        }
    }

    private long countEventsSince(Instant since) {
        if (soc2AuditTrail != null) {
            long count = 0;
            for (SOC2AuditTrail.TrustServiceCategory category :
                    SOC2AuditTrail.TrustServiceCategory.values()) {
                count += soc2AuditTrail.getEvents(category, since, Instant.now()).size();
            }
            return count;
        }
        return 0;
    }

    private LocalDate getQuarterEndDate(int year, int quarter) {
        int endMonth = quarter * 3;
        LocalDate startOfNextMonth = LocalDate.of(year, endMonth, 1).plusMonths(1);
        return startOfNextMonth.minusDays(1);
    }

    // ============ Inner Classes ============

    public static class ComplianceDashboardMetrics {
        private Instant generatedAt;
        private double overallComplianceScore;
        private String overallComplianceStatus;
        private MiCADashboardMetrics micaMetrics;
        private SOC2DashboardMetrics soc2Metrics;
        private AuditTrailStatistics auditTrailStats;
        private IncidentDashboardMetrics incidentMetrics;
        private List<RegulatoryDeadline> upcomingDeadlines;

        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
        public double getOverallComplianceScore() { return overallComplianceScore; }
        public void setOverallComplianceScore(double score) { this.overallComplianceScore = score; }
        public String getOverallComplianceStatus() { return overallComplianceStatus; }
        public void setOverallComplianceStatus(String status) { this.overallComplianceStatus = status; }
        public MiCADashboardMetrics getMicaMetrics() { return micaMetrics; }
        public void setMicaMetrics(MiCADashboardMetrics metrics) { this.micaMetrics = metrics; }
        public SOC2DashboardMetrics getSoc2Metrics() { return soc2Metrics; }
        public void setSoc2Metrics(SOC2DashboardMetrics metrics) { this.soc2Metrics = metrics; }
        public AuditTrailStatistics getAuditTrailStats() { return auditTrailStats; }
        public void setAuditTrailStats(AuditTrailStatistics stats) { this.auditTrailStats = stats; }
        public IncidentDashboardMetrics getIncidentMetrics() { return incidentMetrics; }
        public void setIncidentMetrics(IncidentDashboardMetrics metrics) { this.incidentMetrics = metrics; }
        public List<RegulatoryDeadline> getUpcomingDeadlines() { return upcomingDeadlines; }
        public void setUpcomingDeadlines(List<RegulatoryDeadline> deadlines) { this.upcomingDeadlines = deadlines; }
    }

    public static class MiCADashboardMetrics {
        private long totalTokens;
        private long compliantTokens;
        private long nonCompliantTokens;
        private double complianceRate;
        private double micaComplianceScore;
        private long totalClassified;
        private long eMoneyTokens;
        private long assetReferencedTokens;
        private long utilityTokens;
        private long totalQuarterlyReports;
        private long pendingSubmissions;
        private long upcomingReportingDeadlines;
        private Map<MiCAAssetClassification.AssetClass, Long> assetClassBreakdown;

        public long getTotalTokens() { return totalTokens; }
        public void setTotalTokens(long count) { this.totalTokens = count; }
        public long getCompliantTokens() { return compliantTokens; }
        public void setCompliantTokens(long count) { this.compliantTokens = count; }
        public long getNonCompliantTokens() { return nonCompliantTokens; }
        public void setNonCompliantTokens(long count) { this.nonCompliantTokens = count; }
        public double getComplianceRate() { return complianceRate; }
        public void setComplianceRate(double rate) { this.complianceRate = rate; }
        public double getMicaComplianceScore() { return micaComplianceScore; }
        public void setMicaComplianceScore(double score) { this.micaComplianceScore = score; }
        public long getTotalClassified() { return totalClassified; }
        public void setTotalClassified(long count) { this.totalClassified = count; }
        public long getEMoneyTokens() { return eMoneyTokens; }
        public void setEMoneyTokens(long count) { this.eMoneyTokens = count; }
        public long getAssetReferencedTokens() { return assetReferencedTokens; }
        public void setAssetReferencedTokens(long count) { this.assetReferencedTokens = count; }
        public long getUtilityTokens() { return utilityTokens; }
        public void setUtilityTokens(long count) { this.utilityTokens = count; }
        public long getTotalQuarterlyReports() { return totalQuarterlyReports; }
        public void setTotalQuarterlyReports(long count) { this.totalQuarterlyReports = count; }
        public long getPendingSubmissions() { return pendingSubmissions; }
        public void setPendingSubmissions(long count) { this.pendingSubmissions = count; }
        public long getUpcomingReportingDeadlines() { return upcomingReportingDeadlines; }
        public void setUpcomingReportingDeadlines(long count) { this.upcomingReportingDeadlines = count; }
        public Map<MiCAAssetClassification.AssetClass, Long> getAssetClassBreakdown() { return assetClassBreakdown; }
        public void setAssetClassBreakdown(Map<MiCAAssetClassification.AssetClass, Long> map) { this.assetClassBreakdown = map; }
    }

    public static class SOC2DashboardMetrics {
        private long securityEventCount;
        private long availabilityEventCount;
        private long processingIntegrityEventCount;
        private long confidentialityEventCount;
        private long privacyEventCount;
        private long totalEventCount;
        private long controlEvidenceCount;
        private long totalAccessEvents;
        private double authenticationSuccessRate;
        private long activeSessionCount;
        private long privilegedAccessCount;
        private double securityReadiness;
        private double availabilityReadiness;
        private double processingIntegrityReadiness;
        private double confidentialityReadiness;
        private double privacyReadiness;
        private double overallReadinessScore;

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
        public long getTotalAccessEvents() { return totalAccessEvents; }
        public void setTotalAccessEvents(long count) { this.totalAccessEvents = count; }
        public double getAuthenticationSuccessRate() { return authenticationSuccessRate; }
        public void setAuthenticationSuccessRate(double rate) { this.authenticationSuccessRate = rate; }
        public long getActiveSessionCount() { return activeSessionCount; }
        public void setActiveSessionCount(long count) { this.activeSessionCount = count; }
        public long getPrivilegedAccessCount() { return privilegedAccessCount; }
        public void setPrivilegedAccessCount(long count) { this.privilegedAccessCount = count; }
        public double getSecurityReadiness() { return securityReadiness; }
        public void setSecurityReadiness(double score) { this.securityReadiness = score; }
        public double getAvailabilityReadiness() { return availabilityReadiness; }
        public void setAvailabilityReadiness(double score) { this.availabilityReadiness = score; }
        public double getProcessingIntegrityReadiness() { return processingIntegrityReadiness; }
        public void setProcessingIntegrityReadiness(double score) { this.processingIntegrityReadiness = score; }
        public double getConfidentialityReadiness() { return confidentialityReadiness; }
        public void setConfidentialityReadiness(double score) { this.confidentialityReadiness = score; }
        public double getPrivacyReadiness() { return privacyReadiness; }
        public void setPrivacyReadiness(double score) { this.privacyReadiness = score; }
        public double getOverallReadinessScore() { return overallReadinessScore; }
        public void setOverallReadinessScore(double score) { this.overallReadinessScore = score; }
    }

    public static class AuditTrailStatistics {
        private long totalAuditEvents;
        private long micaAuditEvents;
        private long soc2AuditEvents;
        private long eventsLast24Hours;
        private long eventsLast7Days;
        private long eventsLast30Days;
        private double auditCoverageScore;

        public long getTotalAuditEvents() { return totalAuditEvents; }
        public void setTotalAuditEvents(long count) { this.totalAuditEvents = count; }
        public long getMicaAuditEvents() { return micaAuditEvents; }
        public void setMicaAuditEvents(long count) { this.micaAuditEvents = count; }
        public long getSoc2AuditEvents() { return soc2AuditEvents; }
        public void setSoc2AuditEvents(long count) { this.soc2AuditEvents = count; }
        public long getEventsLast24Hours() { return eventsLast24Hours; }
        public void setEventsLast24Hours(long count) { this.eventsLast24Hours = count; }
        public long getEventsLast7Days() { return eventsLast7Days; }
        public void setEventsLast7Days(long count) { this.eventsLast7Days = count; }
        public long getEventsLast30Days() { return eventsLast30Days; }
        public void setEventsLast30Days(long count) { this.eventsLast30Days = count; }
        public double getAuditCoverageScore() { return auditCoverageScore; }
        public void setAuditCoverageScore(double score) { this.auditCoverageScore = score; }
    }

    public static class IncidentDashboardMetrics {
        private long totalIncidents;
        private int openIncidents;
        private int resolvedIncidents;
        private double averageResponseTimeMinutes;
        private double averageResolutionTimeMinutes;
        private double slaComplianceRate;
        private double incidentResponseScore;
        private Map<IncidentResponseLogger.IncidentSeverity, Long> incidentsBySeverity;
        private Map<IncidentResponseLogger.IncidentType, Long> incidentsByType;

        public long getTotalIncidents() { return totalIncidents; }
        public void setTotalIncidents(long count) { this.totalIncidents = count; }
        public int getOpenIncidents() { return openIncidents; }
        public void setOpenIncidents(int count) { this.openIncidents = count; }
        public int getResolvedIncidents() { return resolvedIncidents; }
        public void setResolvedIncidents(int count) { this.resolvedIncidents = count; }
        public double getAverageResponseTimeMinutes() { return averageResponseTimeMinutes; }
        public void setAverageResponseTimeMinutes(double avg) { this.averageResponseTimeMinutes = avg; }
        public double getAverageResolutionTimeMinutes() { return averageResolutionTimeMinutes; }
        public void setAverageResolutionTimeMinutes(double avg) { this.averageResolutionTimeMinutes = avg; }
        public double getSlaComplianceRate() { return slaComplianceRate; }
        public void setSlaComplianceRate(double rate) { this.slaComplianceRate = rate; }
        public double getIncidentResponseScore() { return incidentResponseScore; }
        public void setIncidentResponseScore(double score) { this.incidentResponseScore = score; }
        public Map<IncidentResponseLogger.IncidentSeverity, Long> getIncidentsBySeverity() { return incidentsBySeverity; }
        public void setIncidentsBySeverity(Map<IncidentResponseLogger.IncidentSeverity, Long> map) { this.incidentsBySeverity = map; }
        public Map<IncidentResponseLogger.IncidentType, Long> getIncidentsByType() { return incidentsByType; }
        public void setIncidentsByType(Map<IncidentResponseLogger.IncidentType, Long> map) { this.incidentsByType = map; }
    }

    public static class RegulatoryDeadline {
        private String deadlineId;
        private String type;
        private String description;
        private LocalDate deadlineDate;
        private String status;
        private String priority;

        public String getDeadlineId() { return deadlineId; }
        public void setDeadlineId(String id) { this.deadlineId = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public LocalDate getDeadlineDate() { return deadlineDate; }
        public void setDeadlineDate(LocalDate date) { this.deadlineDate = date; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }

    public static class ComplianceTrends {
        private int periodDays;
        private List<DailyComplianceSnapshot> dailySnapshots;
        private String trendDirection;
        private double trendPercentage;

        public int getPeriodDays() { return periodDays; }
        public void setPeriodDays(int days) { this.periodDays = days; }
        public List<DailyComplianceSnapshot> getDailySnapshots() { return dailySnapshots; }
        public void setDailySnapshots(List<DailyComplianceSnapshot> snapshots) { this.dailySnapshots = snapshots; }
        public String getTrendDirection() { return trendDirection; }
        public void setTrendDirection(String direction) { this.trendDirection = direction; }
        public double getTrendPercentage() { return trendPercentage; }
        public void setTrendPercentage(double pct) { this.trendPercentage = pct; }
    }

    public static class DailyComplianceSnapshot {
        private LocalDate date;
        private double micaScore;
        private double soc2Score;
        private double overallScore;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public double getMicaScore() { return micaScore; }
        public void setMicaScore(double score) { this.micaScore = score; }
        public double getSoc2Score() { return soc2Score; }
        public void setSoc2Score(double score) { this.soc2Score = score; }
        public double getOverallScore() { return overallScore; }
        public void setOverallScore(double score) { this.overallScore = score; }
    }

    public static class ComplianceAlert {
        private final String alertType;
        private final String severity;
        private final String message;
        private final String recommendation;
        private final Instant timestamp;

        public ComplianceAlert(String alertType, String severity, String message, String recommendation) {
            this.alertType = alertType;
            this.severity = severity;
            this.message = message;
            this.recommendation = recommendation;
            this.timestamp = Instant.now();
        }

        public String getAlertType() { return alertType; }
        public String getSeverity() { return severity; }
        public String getMessage() { return message; }
        public String getRecommendation() { return recommendation; }
        public Instant getTimestamp() { return timestamp; }
    }
}
