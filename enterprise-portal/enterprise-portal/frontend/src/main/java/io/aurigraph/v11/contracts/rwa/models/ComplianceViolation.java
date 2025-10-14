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
 * Compliance Violation Model
 * Details of compliance violations for audit and remediation tracking
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceViolation {
    
    @JsonProperty("violationId")
    private String violationId;
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("transactionId")
    private String transactionId;
    
    @JsonProperty("violationType")
    private ViolationType violationType;
    
    @JsonProperty("severity")
    private ViolationSeverity severity;
    
    @JsonProperty("status")
    private ViolationStatus status;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("regulatoryRule")
    private String regulatoryRule;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("details")
    private String details;
    
    @JsonProperty("impact")
    private String impact;
    
    @JsonProperty("detectionMethod")
    private DetectionMethod detectionMethod;
    
    @JsonProperty("detectedBy")
    private String detectedBy;
    
    @JsonProperty("detectedAt")
    private Instant detectedAt;
    
    @JsonProperty("reportedAt")
    private Instant reportedAt;
    
    @JsonProperty("reportedBy")
    private String reportedBy;
    
    @JsonProperty("investigationStarted")
    private Instant investigationStarted;
    
    @JsonProperty("resolutionDeadline")
    private Instant resolutionDeadline;
    
    @JsonProperty("resolvedAt")
    private Instant resolvedAt;
    
    @JsonProperty("resolvedBy")
    private String resolvedBy;
    
    @JsonProperty("resolutionDetails")
    private String resolutionDetails;
    
    @JsonProperty("remedialActions")
    private List<RemedialAction> remedialActions;
    
    @JsonProperty("relatedViolations")
    private List<String> relatedViolations;
    
    @JsonProperty("evidence")
    private List<String> evidence;
    
    @JsonProperty("regulatoryNotification")
    private Boolean regulatoryNotification;
    
    @JsonProperty("notificationSent")
    private Instant notificationSent;
    
    @JsonProperty("fineAmount")
    private BigDecimal fineAmount;
    
    @JsonProperty("fineCurrency")
    private String fineCurrency;
    
    @JsonProperty("finePaid")
    private Boolean finePaid;
    
    @JsonProperty("finePaidAt")
    private Instant finePaidAt;
    
    @JsonProperty("riskScore")
    private Double riskScore; // 0-100
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Types of compliance violations
     */
    public enum ViolationType {
        KYC_FAILURE,
        AML_VIOLATION,
        SANCTIONS_BREACH,
        MONEY_LAUNDERING,
        TERRORIST_FINANCING,
        FRAUD,
        MARKET_MANIPULATION,
        INSIDER_TRADING,
        UNAUTHORIZED_TRADING,
        EXCEEDING_LIMITS,
        PROHIBITED_JURISDICTION,
        INSUFFICIENT_DOCUMENTATION,
        FALSE_INFORMATION,
        SUSPICIOUS_ACTIVITY,
        REGULATORY_REPORTING_FAILURE,
        OPERATIONAL_BREACH,
        DATA_PROTECTION_VIOLATION,
        SYSTEMIC_RISK,
        LIQUIDITY_VIOLATION,
        CAPITAL_REQUIREMENT_BREACH,
        OTHER
    }
    
    /**
     * Severity levels for violations
     */
    public enum ViolationSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL,
        REGULATORY_REPORTABLE
    }
    
    /**
     * Status of violation handling
     */
    public enum ViolationStatus {
        DETECTED,
        INVESTIGATING,
        CONFIRMED,
        RESOLVED,
        CLOSED,
        ESCALATED,
        PENDING_APPROVAL,
        DISPUTED
    }
    
    /**
     * Method by which violation was detected
     */
    public enum DetectionMethod {
        AUTOMATED_MONITORING,
        MANUAL_REVIEW,
        EXTERNAL_REPORT,
        REGULATORY_INQUIRY,
        INTERNAL_AUDIT,
        CUSTOMER_COMPLAINT,
        WHISTLEBLOWER,
        PERIODIC_REVIEW,
        TRANSACTION_ANALYSIS,
        SYSTEM_ALERT
    }
    
    /**
     * Remedial actions taken
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RemedialAction {
        @JsonProperty("actionId")
        private String actionId;
        
        @JsonProperty("actionType")
        private ActionType actionType;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("assignedTo")
        private String assignedTo;
        
        @JsonProperty("dueDate")
        private Instant dueDate;
        
        @JsonProperty("completedAt")
        private Instant completedAt;
        
        @JsonProperty("status")
        private ActionStatus status;
        
        @JsonProperty("outcome")
        private String outcome;
        
        public enum ActionType {
            ACCOUNT_SUSPENSION,
            TRANSACTION_REVERSAL,
            ADDITIONAL_DOCUMENTATION,
            ENHANCED_MONITORING,
            TRAINING_REQUIRED,
            POLICY_UPDATE,
            SYSTEM_ENHANCEMENT,
            REGULATORY_REPORTING,
            FINE_PAYMENT,
            PROCESS_IMPROVEMENT,
            STAFF_DISCIPLINARY_ACTION,
            THIRD_PARTY_REVIEW
        }
        
        public enum ActionStatus {
            PENDING,
            IN_PROGRESS,
            COMPLETED,
            CANCELLED,
            OVERDUE
        }
    }
    
    // Constructor with essential fields
    public ComplianceViolation(String userId, ViolationType violationType, ViolationSeverity severity, RegulatoryJurisdiction jurisdiction) {
        this.violationId = java.util.UUID.randomUUID().toString();
        this.userId = userId;
        this.violationType = violationType;
        this.severity = severity;
        this.jurisdiction = jurisdiction;
        this.status = ViolationStatus.DETECTED;
        this.detectionMethod = DetectionMethod.AUTOMATED_MONITORING;
        this.detectedAt = Instant.now();
        this.regulatoryNotification = determineRegulatoryNotificationRequired();
        this.riskScore = calculateInitialRiskScore();
    }
    
    /**
     * Check if violation is resolved
     */
    public boolean isResolved() {
        return status == ViolationStatus.RESOLVED || status == ViolationStatus.CLOSED;
    }
    
    /**
     * Check if violation is overdue for resolution
     */
    public boolean isOverdue() {
        return resolutionDeadline != null && 
               resolutionDeadline.isBefore(Instant.now()) && 
               !isResolved();
    }
    
    /**
     * Check if regulatory notification is required
     */
    public boolean requiresRegulatoryNotification() {
        return severity == ViolationSeverity.REGULATORY_REPORTABLE ||
               severity == ViolationSeverity.CRITICAL ||
               violationType == ViolationType.MONEY_LAUNDERING ||
               violationType == ViolationType.TERRORIST_FINANCING ||
               violationType == ViolationType.SANCTIONS_BREACH;
    }
    
    /**
     * Calculate days since detection
     */
    public long getDaysSinceDetection() {
        return java.time.Duration.between(detectedAt, Instant.now()).toDays();
    }
    
    /**
     * Calculate initial risk score based on violation type and severity
     */
    private Double calculateInitialRiskScore() {
        double baseScore = 0.0;
        
        // Base score by violation type
        switch (violationType) {
            case MONEY_LAUNDERING:
            case TERRORIST_FINANCING:
            case SANCTIONS_BREACH:
                baseScore = 90.0;
                break;
            case FRAUD:
            case MARKET_MANIPULATION:
                baseScore = 80.0;
                break;
            case KYC_FAILURE:
            case AML_VIOLATION:
                baseScore = 70.0;
                break;
            case EXCEEDING_LIMITS:
            case UNAUTHORIZED_TRADING:
                baseScore = 60.0;
                break;
            case INSUFFICIENT_DOCUMENTATION:
                baseScore = 40.0;
                break;
            default:
                baseScore = 50.0;
        }
        
        // Adjust by severity
        switch (severity) {
            case CRITICAL:
            case REGULATORY_REPORTABLE:
                baseScore = Math.min(100.0, baseScore * 1.2);
                break;
            case HIGH:
                baseScore = Math.min(100.0, baseScore * 1.1);
                break;
            case MEDIUM:
                // No adjustment
                break;
            case LOW:
                baseScore = baseScore * 0.8;
                break;
        }
        
        return Math.max(0.0, Math.min(100.0, baseScore));
    }
    
    /**
     * Determine if regulatory notification is required
     */
    private Boolean determineRegulatoryNotificationRequired() {
        return requiresRegulatoryNotification();
    }
    
    /**
     * Set default resolution deadline based on severity
     */
    public void setDefaultResolutionDeadline() {
        Instant now = Instant.now();
        switch (severity) {
            case CRITICAL:
            case REGULATORY_REPORTABLE:
                // 24 hours for critical violations
                this.resolutionDeadline = now.plusSeconds(24 * 3600);
                break;
            case HIGH:
                // 3 days for high severity
                this.resolutionDeadline = now.plusSeconds(3 * 24 * 3600);
                break;
            case MEDIUM:
                // 7 days for medium severity
                this.resolutionDeadline = now.plusSeconds(7 * 24 * 3600);
                break;
            case LOW:
                // 30 days for low severity
                this.resolutionDeadline = now.plusSeconds(30 * 24 * 3600);
                break;
        }
    }
    
    /**
     * Add remedial action
     */
    public void addRemedialAction(RemedialAction action) {
        if (remedialActions == null) {
            remedialActions = new java.util.ArrayList<>();
        }
        remedialActions.add(action);
    }
    
    /**
     * Mark violation as resolved
     */
    public void markResolved(String resolvedBy, String resolutionDetails) {
        this.status = ViolationStatus.RESOLVED;
        this.resolvedBy = resolvedBy;
        this.resolutionDetails = resolutionDetails;
        this.resolvedAt = Instant.now();
    }
    
    /**
     * Get completion percentage of remedial actions
     */
    public Double getRemedialActionCompletionPercentage() {
        if (remedialActions == null || remedialActions.isEmpty()) {
            return 0.0;
        }
        
        long completedActions = remedialActions.stream()
                .filter(action -> action.getStatus() == RemedialAction.ActionStatus.COMPLETED)
                .count();
        
        return (double) completedActions / remedialActions.size() * 100.0;
    }
}