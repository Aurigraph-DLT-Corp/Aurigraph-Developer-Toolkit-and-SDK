package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

/**
 * Compliance Report Model
 * Comprehensive compliance report for regulatory reporting and audit purposes
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceReport {
    
    @JsonProperty("reportId")
    private String reportId;
    
    @JsonProperty("reportType")
    private ReportType reportType;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("reportPeriod")
    private ReportPeriod reportPeriod;
    
    @JsonProperty("startDate")
    private Instant startDate;
    
    @JsonProperty("endDate")
    private Instant endDate;
    
    @JsonProperty("generatedAt")
    private Instant generatedAt;
    
    @JsonProperty("generatedBy")
    private String generatedBy;
    
    @JsonProperty("status")
    private ReportStatus status;
    
    @JsonProperty("overallComplianceScore")
    private Double overallComplianceScore; // 0-100
    
    @JsonProperty("summary")
    private ComplianceSummary summary;
    
    @JsonProperty("userMetrics")
    private UserMetrics userMetrics;
    
    @JsonProperty("transactionMetrics")
    private TransactionMetrics transactionMetrics;
    
    @JsonProperty("riskMetrics")
    private RiskMetrics riskMetrics;
    
    @JsonProperty("violationSummary")
    private ViolationSummary violationSummary;
    
    @JsonProperty("kycAmlMetrics")
    private KYCAMLMetrics kycAmlMetrics;
    
    @JsonProperty("sanctionsScreening")
    private SanctionsScreeningMetrics sanctionsScreening;
    
    @JsonProperty("regulatoryActions")
    private List<RegulatoryAction> regulatoryActions;
    
    @JsonProperty("recommendations")
    private List<String> recommendations;
    
    @JsonProperty("nextActions")
    private List<String> nextActions;
    
    @JsonProperty("attachments")
    private List<String> attachments;
    
    @JsonProperty("confidentialityLevel")
    private ConfidentialityLevel confidentialityLevel;
    
    @JsonProperty("distributionList")
    private List<String> distributionList;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Types of compliance reports
     */
    public enum ReportType {
        REGULATORY_FILING,
        INTERNAL_AUDIT,
        RISK_ASSESSMENT,
        KYC_AML_SUMMARY,
        TRANSACTION_MONITORING,
        SANCTIONS_COMPLIANCE,
        PERIODIC_REVIEW,
        INCIDENT_REPORT,
        VIOLATION_SUMMARY,
        REMEDIATION_STATUS,
        EXECUTIVE_SUMMARY,
        DETAILED_ANALYSIS
    }
    
    /**
     * Report periods
     */
    public enum ReportPeriod {
        DAILY,
        WEEKLY,
        MONTHLY,
        QUARTERLY,
        SEMI_ANNUAL,
        ANNUAL,
        AD_HOC,
        REAL_TIME
    }
    
    /**
     * Report status
     */
    public enum ReportStatus {
        DRAFT,
        PENDING_REVIEW,
        APPROVED,
        SUBMITTED,
        REJECTED,
        AMENDED,
        ARCHIVED
    }
    
    /**
     * Confidentiality levels
     */
    public enum ConfidentialityLevel {
        PUBLIC,
        INTERNAL,
        CONFIDENTIAL,
        RESTRICTED,
        TOP_SECRET
    }
    
    /**
     * Overall compliance summary
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ComplianceSummary {
        @JsonProperty("totalChecksPerformed")
        private Long totalChecksPerformed;
        
        @JsonProperty("passedChecks")
        private Long passedChecks;
        
        @JsonProperty("failedChecks")
        private Long failedChecks;
        
        @JsonProperty("pendingChecks")
        private Long pendingChecks;
        
        @JsonProperty("averageComplianceScore")
        private Double averageComplianceScore;
        
        @JsonProperty("complianceRate")
        private Double complianceRate; // Percentage
        
        @JsonProperty("improvementFromPrevious")
        private Double improvementFromPrevious;
        
        @JsonProperty("riskDistribution")
        private Map<String, Long> riskDistribution; // Risk level -> count
    }
    
    /**
     * User-related metrics
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserMetrics {
        @JsonProperty("totalUsers")
        private Long totalUsers;
        
        @JsonProperty("newUsers")
        private Long newUsers;
        
        @JsonProperty("verifiedUsers")
        private Long verifiedUsers;
        
        @JsonProperty("suspendedUsers")
        private Long suspendedUsers;
        
        @JsonProperty("highRiskUsers")
        private Long highRiskUsers;
        
        @JsonProperty("pepUsers")
        private Long pepUsers;
        
        @JsonProperty("institutionalUsers")
        private Long institutionalUsers;
        
        @JsonProperty("accreditedUsers")
        private Long accreditedUsers;
        
        @JsonProperty("averageVerificationTime")
        private Double averageVerificationTime; // in hours
        
        @JsonProperty("verificationSuccessRate")
        private Double verificationSuccessRate;
        
        @JsonProperty("usersByJurisdiction")
        private Map<String, Long> usersByJurisdiction;
    }
    
    /**
     * Transaction-related metrics
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransactionMetrics {
        @JsonProperty("totalTransactions")
        private Long totalTransactions;
        
        @JsonProperty("totalVolume")
        private BigDecimal totalVolume;
        
        @JsonProperty("averageTransactionSize")
        private BigDecimal averageTransactionSize;
        
        @JsonProperty("largeTransactions")
        private Long largeTransactions; // Above reporting threshold
        
        @JsonProperty("suspiciousTransactions")
        private Long suspiciousTransactions;
        
        @JsonProperty("blockedTransactions")
        private Long blockedTransactions;
        
        @JsonProperty("crossBorderTransactions")
        private Long crossBorderTransactions;
        
        @JsonProperty("cashTransactions")
        private Long cashTransactions;
        
        @JsonProperty("monitoredTransactions")
        private Long monitoredTransactions;
        
        @JsonProperty("averageProcessingTime")
        private Double averageProcessingTime; // in seconds
        
        @JsonProperty("transactionsByType")
        private Map<String, Long> transactionsByType;
        
        @JsonProperty("volumeByJurisdiction")
        private Map<String, BigDecimal> volumeByJurisdiction;
    }
    
    /**
     * Risk-related metrics
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RiskMetrics {
        @JsonProperty("averageRiskScore")
        private Double averageRiskScore;
        
        @JsonProperty("highRiskTransactions")
        private Long highRiskTransactions;
        
        @JsonProperty("riskDistribution")
        private Map<String, Long> riskDistribution;
        
        @JsonProperty("falsePositives")
        private Long falsePositives;
        
        @JsonProperty("falseNegatives")
        private Long falseNegatives;
        
        @JsonProperty("modelAccuracy")
        private Double modelAccuracy;
        
        @JsonProperty("alertsGenerated")
        private Long alertsGenerated;
        
        @JsonProperty("alertsInvestigated")
        private Long alertsInvestigated;
        
        @JsonProperty("alertsResolved")
        private Long alertsResolved;
        
        @JsonProperty("averageInvestigationTime")
        private Double averageInvestigationTime; // in hours
    }
    
    /**
     * Violations summary
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ViolationSummary {
        @JsonProperty("totalViolations")
        private Long totalViolations;
        
        @JsonProperty("resolvedViolations")
        private Long resolvedViolations;
        
        @JsonProperty("pendingViolations")
        private Long pendingViolations;
        
        @JsonProperty("criticalViolations")
        private Long criticalViolations;
        
        @JsonProperty("regulatoryViolations")
        private Long regulatoryViolations;
        
        @JsonProperty("totalFines")
        private BigDecimal totalFines;
        
        @JsonProperty("averageResolutionTime")
        private Double averageResolutionTime; // in days
        
        @JsonProperty("violationsByType")
        private Map<String, Long> violationsByType;
        
        @JsonProperty("violationTrends")
        private Map<String, Long> violationTrends; // Month -> count
    }
    
    /**
     * KYC/AML metrics
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KYCAMLMetrics {
        @JsonProperty("kycChecksPerformed")
        private Long kycChecksPerformed;
        
        @JsonProperty("kycSuccessRate")
        private Double kycSuccessRate;
        
        @JsonProperty("averageKycTime")
        private Double averageKycTime; // in hours
        
        @JsonProperty("amlScreeningsPerformed")
        private Long amlScreeningsPerformed;
        
        @JsonProperty("amlPositiveHits")
        private Long amlPositiveHits;
        
        @JsonProperty("amlFalsePositives")
        private Long amlFalsePositives;
        
        @JsonProperty("enhancedDueDiligence")
        private Long enhancedDueDiligence;
        
        @JsonProperty("documentVerifications")
        private Long documentVerifications;
        
        @JsonProperty("documentFailures")
        private Long documentFailures;
        
        @JsonProperty("manualReviews")
        private Long manualReviews;
    }
    
    /**
     * Sanctions screening metrics
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SanctionsScreeningMetrics {
        @JsonProperty("screeningsPerformed")
        private Long screeningsPerformed;
        
        @JsonProperty("sanctionsHits")
        private Long sanctionsHits;
        
        @JsonProperty("falsePositives")
        private Long falsePositives;
        
        @JsonProperty("watchlistMatches")
        private Long watchlistMatches;
        
        @JsonProperty("pepMatches")
        private Long pepMatches;
        
        @JsonProperty("adverseMediaHits")
        private Long adverseMediaHits;
        
        @JsonProperty("averageScreeningTime")
        private Double averageScreeningTime; // in seconds
        
        @JsonProperty("screeningAccuracy")
        private Double screeningAccuracy;
    }
    
    /**
     * Regulatory actions taken
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RegulatoryAction {
        @JsonProperty("actionId")
        private String actionId;
        
        @JsonProperty("actionType")
        private ActionType actionType;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("takenAt")
        private Instant takenAt;
        
        @JsonProperty("jurisdiction")
        private RegulatoryJurisdiction jurisdiction;
        
        @JsonProperty("outcome")
        private String outcome;
        
        public enum ActionType {
            WARNING_ISSUED,
            ACCOUNT_SUSPENDED,
            TRANSACTION_BLOCKED,
            FINE_IMPOSED,
            LICENSE_REVOKED,
            ENHANCED_MONITORING,
            REPORTING_REQUIRED,
            REMEDIATION_ORDER,
            INVESTIGATION_INITIATED,
            SANCTIONS_APPLIED
        }
    }
    
    // Constructor with essential fields
    public ComplianceReport(ReportType reportType, RegulatoryJurisdiction jurisdiction, ReportPeriod reportPeriod) {
        this.reportId = java.util.UUID.randomUUID().toString();
        this.reportType = reportType;
        this.jurisdiction = jurisdiction;
        this.reportPeriod = reportPeriod;
        this.generatedAt = Instant.now();
        this.status = ReportStatus.DRAFT;
        this.confidentialityLevel = ConfidentialityLevel.INTERNAL;
        this.regulatoryActions = new java.util.ArrayList<>();
        this.recommendations = new java.util.ArrayList<>();
        this.nextActions = new java.util.ArrayList<>();
        this.attachments = new java.util.ArrayList<>();
        this.distributionList = new java.util.ArrayList<>();
    }
    
    /**
     * Calculate overall compliance health
     */
    public String getComplianceHealth() {
        if (overallComplianceScore == null) {
            return "Unknown";
        }
        
        if (overallComplianceScore >= 95) return "Excellent";
        else if (overallComplianceScore >= 85) return "Good";
        else if (overallComplianceScore >= 75) return "Fair";
        else if (overallComplianceScore >= 60) return "Poor";
        else return "Critical";
    }
    
    /**
     * Check if report requires immediate attention
     */
    public boolean requiresImmediateAttention() {
        return (overallComplianceScore != null && overallComplianceScore < 70) ||
               (violationSummary != null && violationSummary.getCriticalViolations() != null && 
                violationSummary.getCriticalViolations() > 0) ||
               (summary != null && summary.getComplianceRate() != null && 
                summary.getComplianceRate() < 80);
    }
    
    /**
     * Get risk trend direction
     */
    public String getRiskTrend() {
        if (summary != null && summary.getImprovementFromPrevious() != null) {
            if (summary.getImprovementFromPrevious() > 5) return "Improving";
            else if (summary.getImprovementFromPrevious() < -5) return "Deteriorating";
            else return "Stable";
        }
        return "Unknown";
    }
    
    /**
     * Add recommendation
     */
    public void addRecommendation(String recommendation) {
        if (recommendations == null) {
            recommendations = new java.util.ArrayList<>();
        }
        recommendations.add(recommendation);
    }
    
    /**
     * Add next action
     */
    public void addNextAction(String action) {
        if (nextActions == null) {
            nextActions = new java.util.ArrayList<>();
        }
        nextActions.add(action);
    }
    
    /**
     * Add regulatory action
     */
    public void addRegulatoryAction(RegulatoryAction action) {
        if (regulatoryActions == null) {
            regulatoryActions = new java.util.ArrayList<>();
        }
        regulatoryActions.add(action);
    }
    
    /**
     * Generate executive summary
     */
    public String generateExecutiveSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Compliance Report Summary for ").append(reportPeriod).append(" period:\n\n");
        
        if (overallComplianceScore != null) {
            summary.append("Overall Compliance Score: ").append(String.format("%.1f", overallComplianceScore))
                   .append(" (").append(getComplianceHealth()).append(")\n");
        }
        
        if (this.summary != null && this.summary.getComplianceRate() != null) {
            summary.append("Compliance Rate: ").append(String.format("%.1f%%", this.summary.getComplianceRate())).append("\n");
        }
        
        if (violationSummary != null) {
            summary.append("Total Violations: ").append(violationSummary.getTotalViolations()).append("\n");
            if (violationSummary.getCriticalViolations() != null && violationSummary.getCriticalViolations() > 0) {
                summary.append("Critical Violations: ").append(violationSummary.getCriticalViolations()).append("\n");
            }
        }
        
        summary.append("Risk Trend: ").append(getRiskTrend()).append("\n");
        
        if (requiresImmediateAttention()) {
            summary.append("\n⚠️ ATTENTION REQUIRED: This report indicates compliance issues that need immediate attention.");
        }
        
        return summary.toString();
    }
}