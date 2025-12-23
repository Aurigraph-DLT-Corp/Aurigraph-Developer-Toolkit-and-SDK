package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

/**
 * Compliance Check Model
 * Individual compliance check record for audit and tracking
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceCheck {
    
    @JsonProperty("checkId")
    private String checkId;
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("checkType")
    private CheckType checkType;
    
    @JsonProperty("status")
    private CheckStatus status;
    
    @JsonProperty("result")
    private CheckResult result;
    
    @JsonProperty("score")
    private Double score; // 0-100 compliance score for this check
    
    @JsonProperty("riskLevel")
    private RiskLevel riskLevel;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("checkDetails")
    private String checkDetails;
    
    @JsonProperty("findings")
    private String findings;
    
    @JsonProperty("recommendations")
    private String recommendations;
    
    @JsonProperty("performedBy")
    private String performedBy; // System, Agent ID, or Manual
    
    @JsonProperty("automatedCheck")
    private Boolean automatedCheck;
    
    @JsonProperty("dataSource")
    private String dataSource;
    
    @JsonProperty("evidenceDocuments")
    private java.util.List<String> evidenceDocuments;
    
    @JsonProperty("flags")
    private java.util.List<ComplianceFlag> flags;
    
    @JsonProperty("expirationDate")
    private Instant expirationDate;
    
    @JsonProperty("nextReviewDate")
    private Instant nextReviewDate;
    
    @JsonProperty("performedAt")
    private Instant performedAt;
    
    @JsonProperty("completedAt")
    private Instant completedAt;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Type of compliance check
     */
    public enum CheckType {
        KYC_IDENTITY,
        KYC_ADDRESS,
        KYC_DOCUMENT,
        AML_SCREENING,
        SANCTIONS_CHECK,
        PEP_CHECK,
        ADVERSE_MEDIA,
        WATCHLIST_SCREENING,
        CREDITWORTHINESS,
        ACCREDITATION_VERIFICATION,
        INSTITUTIONAL_VERIFICATION,
        TAX_COMPLIANCE,
        REGULATORY_APPROVAL,
        RISK_ASSESSMENT,
        PERIODIC_REVIEW,
        TRANSACTION_MONITORING,
        SOURCE_OF_FUNDS,
        BENEFICIAL_OWNERSHIP,
        ENHANCED_DUE_DILIGENCE,
        ONGOING_MONITORING
    }
    
    /**
     * Status of the check
     */
    public enum CheckStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        EXPIRED,
        CANCELLED,
        ESCALATED
    }
    
    /**
     * Result of the check
     */
    public enum CheckResult {
        PASS,
        FAIL,
        WARNING,
        INCONCLUSIVE,
        REQUIRES_MANUAL_REVIEW,
        PENDING_DOCUMENTATION,
        EXPIRED
    }
    
    /**
     * Risk level assessment
     */
    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH,
        CRITICAL
    }
    
    /**
     * Compliance flags
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ComplianceFlag {
        @JsonProperty("flagType")
        private FlagType flagType;
        
        @JsonProperty("severity")
        private FlagSeverity severity;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("source")
        private String source;
        
        @JsonProperty("flaggedAt")
        private Instant flaggedAt;
        
        @JsonProperty("resolved")
        private Boolean resolved;
        
        @JsonProperty("resolvedAt")
        private Instant resolvedAt;
        
        @JsonProperty("resolvedBy")
        private String resolvedBy;
        
        public enum FlagType {
            SANCTIONS_MATCH,
            PEP_MATCH,
            ADVERSE_MEDIA,
            WATCHLIST_MATCH,
            DOCUMENT_FRAUD,
            IDENTITY_MISMATCH,
            HIGH_RISK_JURISDICTION,
            SUSPICIOUS_TRANSACTION,
            UNUSUAL_BEHAVIOR,
            REGULATORY_VIOLATION,
            INCOMPLETE_INFORMATION,
            EXPIRED_DOCUMENTATION
        }
        
        public enum FlagSeverity {
            LOW,
            MEDIUM,
            HIGH,
            CRITICAL
        }
    }
    
    // Constructor with essential fields
    public ComplianceCheck(String userId, CheckType checkType, RegulatoryJurisdiction jurisdiction) {
        this.checkId = java.util.UUID.randomUUID().toString();
        this.userId = userId;
        this.checkType = checkType;
        this.jurisdiction = jurisdiction;
        this.status = CheckStatus.PENDING;
        this.automatedCheck = true;
        this.performedAt = Instant.now();
        this.riskLevel = RiskLevel.MEDIUM;
    }
    
    /**
     * Check if the compliance check is valid (not expired)
     */
    public boolean isValid() {
        return status == CheckStatus.COMPLETED && 
               result == CheckResult.PASS &&
               (expirationDate == null || expirationDate.isAfter(Instant.now()));
    }
    
    /**
     * Check if the compliance check is expired
     */
    public boolean isExpired() {
        return expirationDate != null && expirationDate.isBefore(Instant.now());
    }
    
    /**
     * Check if next review is due
     */
    public boolean isReviewDue() {
        return nextReviewDate != null && nextReviewDate.isBefore(Instant.now());
    }
    
    /**
     * Check if the check has critical flags
     */
    public boolean hasCriticalFlags() {
        return flags != null && flags.stream()
                .anyMatch(flag -> flag.getSeverity() == ComplianceFlag.FlagSeverity.CRITICAL && 
                                 !Boolean.TRUE.equals(flag.getResolved()));
    }
    
    /**
     * Get the number of unresolved flags
     */
    public long getUnresolvedFlagCount() {
        if (flags == null) return 0;
        return flags.stream()
                .filter(flag -> !Boolean.TRUE.equals(flag.getResolved()))
                .count();
    }
    
    /**
     * Complete the check with result
     */
    public void completeCheck(CheckResult result, Double score, String findings) {
        this.result = result;
        this.score = score;
        this.findings = findings;
        this.status = CheckStatus.COMPLETED;
        this.completedAt = Instant.now();
    }
    
    /**
     * Add a compliance flag
     */
    public void addFlag(ComplianceFlag flag) {
        if (flags == null) {
            flags = new java.util.ArrayList<>();
        }
        flags.add(flag);
    }
    
    /**
     * Calculate overall risk level based on flags and result
     */
    public RiskLevel calculateOverallRiskLevel() {
        if (hasCriticalFlags()) {
            return RiskLevel.CRITICAL;
        }
        
        if (result == CheckResult.FAIL) {
            return RiskLevel.VERY_HIGH;
        }
        
        if (flags != null && flags.stream().anyMatch(flag -> 
            flag.getSeverity() == ComplianceFlag.FlagSeverity.HIGH && !Boolean.TRUE.equals(flag.getResolved()))) {
            return RiskLevel.HIGH;
        }
        
        if (result == CheckResult.WARNING || getUnresolvedFlagCount() > 0) {
            return RiskLevel.MEDIUM;
        }
        
        return RiskLevel.LOW;
    }
    
    /**
     * Set expiration date based on check type
     */
    public void setDefaultExpirationDate() {
        Instant now = Instant.now();
        switch (checkType) {
            case KYC_IDENTITY:
            case KYC_DOCUMENT:
                // KYC typically valid for 2 years
                this.expirationDate = now.plusSeconds(2 * 365 * 24 * 3600);
                break;
            case AML_SCREENING:
            case SANCTIONS_CHECK:
            case PEP_CHECK:
                // AML checks typically valid for 1 year
                this.expirationDate = now.plusSeconds(365 * 24 * 3600);
                break;
            case PERIODIC_REVIEW:
                // Periodic reviews every 6 months
                this.expirationDate = now.plusSeconds(6 * 30 * 24 * 3600);
                break;
            case TRANSACTION_MONITORING:
                // Transaction monitoring valid for 30 days
                this.expirationDate = now.plusSeconds(30 * 24 * 3600);
                break;
            default:
                // Default 1 year expiration
                this.expirationDate = now.plusSeconds(365 * 24 * 3600);
        }
    }
}