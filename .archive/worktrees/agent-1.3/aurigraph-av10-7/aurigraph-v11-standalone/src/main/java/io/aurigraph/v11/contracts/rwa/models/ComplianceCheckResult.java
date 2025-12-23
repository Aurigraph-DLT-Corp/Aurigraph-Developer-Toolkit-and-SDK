package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

/**
 * Compliance Check Result Model
 * Result of an individual compliance check within a validation
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceCheckResult {
    
    @JsonProperty("checkId")
    private String checkId;
    
    @JsonProperty("checkType")
    private CheckType checkType;
    
    @JsonProperty("status")
    private CheckStatus status;
    
    @JsonProperty("result")
    private CheckResult result;
    
    @JsonProperty("score")
    private Double score; // 0-100
    
    @JsonProperty("weight")
    private Double weight; // Weight in overall validation score
    
    @JsonProperty("riskLevel")
    private RiskLevel riskLevel;
    
    @JsonProperty("confidence")
    private Double confidence; // Confidence in result (0-100)
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("details")
    private String details;
    
    @JsonProperty("reasoning")
    private String reasoning;
    
    @JsonProperty("dataSource")
    private String dataSource;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("ruleName")
    private String ruleName;
    
    @JsonProperty("ruleVersion")
    private String ruleVersion;
    
    @JsonProperty("threshold")
    private Double threshold;
    
    @JsonProperty("actualValue")
    private Double actualValue;
    
    @JsonProperty("errorMessage")
    private String errorMessage;
    
    @JsonProperty("requiresManualReview")
    private Boolean requiresManualReview;
    
    @JsonProperty("canBeAutomated")
    private Boolean canBeAutomated;
    
    @JsonProperty("processingTimeMs")
    private Long processingTimeMs;
    
    @JsonProperty("checkedAt")
    private Instant checkedAt;
    
    @JsonProperty("expiresAt")
    private Instant expiresAt;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Types of compliance checks
     */
    public enum CheckType {
        IDENTITY_VERIFICATION,
        ADDRESS_VERIFICATION,
        DOCUMENT_VERIFICATION,
        SANCTIONS_SCREENING,
        PEP_SCREENING,
        AML_MONITORING,
        WATCHLIST_CHECK,
        CREDIT_CHECK,
        ACCREDITATION_CHECK,
        INVESTMENT_LIMIT_CHECK,
        JURISDICTION_CHECK,
        AGE_VERIFICATION,
        BENEFICIAL_OWNERSHIP_CHECK,
        SOURCE_OF_FUNDS_CHECK,
        TAX_COMPLIANCE_CHECK,
        REGULATORY_APPROVAL_CHECK,
        RISK_ASSESSMENT,
        TRANSACTION_PATTERN_ANALYSIS,
        VELOCITY_CHECK,
        GEOGRAPHIC_RESTRICTION_CHECK
    }
    
    /**
     * Status of the check execution
     */
    public enum CheckStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        ERROR,
        TIMEOUT,
        CANCELLED
    }
    
    /**
     * Result of the check
     */
    public enum CheckResult {
        PASS,
        FAIL,
        WARNING,
        INCONCLUSIVE,
        REQUIRES_REVIEW,
        NOT_APPLICABLE,
        EXPIRED,
        ERROR
    }
    
    /**
     * Risk level assessment
     */
    public enum RiskLevel {
        VERY_LOW,
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH,
        CRITICAL
    }
    
    // Constructor with essential fields
    public ComplianceCheckResult(CheckType checkType, RegulatoryJurisdiction jurisdiction) {
        this.checkId = java.util.UUID.randomUUID().toString();
        this.checkType = checkType;
        this.jurisdiction = jurisdiction;
        this.status = CheckStatus.PENDING;
        this.canBeAutomated = true;
        this.requiresManualReview = false;
        this.checkedAt = Instant.now();
        this.weight = getDefaultWeight(checkType);
    }
    
    /**
     * Check if result is valid (passed and not expired)
     */
    public boolean isValid() {
        return status == CheckStatus.COMPLETED &&
               (result == CheckResult.PASS || result == CheckResult.WARNING) &&
               (expiresAt == null || expiresAt.isAfter(Instant.now()));
    }
    
    /**
     * Check if result is expired
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(Instant.now());
    }
    
    /**
     * Check if this is a critical failure
     */
    public boolean isCriticalFailure() {
        return result == CheckResult.FAIL && 
               (riskLevel == RiskLevel.CRITICAL || riskLevel == RiskLevel.VERY_HIGH);
    }
    
    /**
     * Check if manual review is needed
     */
    public boolean needsManualReview() {
        return Boolean.TRUE.equals(requiresManualReview) ||
               result == CheckResult.REQUIRES_REVIEW ||
               result == CheckResult.INCONCLUSIVE ||
               (confidence != null && confidence < 80.0);
    }
    
    /**
     * Get default weight based on check type
     */
    private Double getDefaultWeight(CheckType checkType) {
        switch (checkType) {
            case IDENTITY_VERIFICATION:
            case SANCTIONS_SCREENING:
                return 10.0; // High importance
            case ADDRESS_VERIFICATION:
            case DOCUMENT_VERIFICATION:
            case PEP_SCREENING:
                return 8.0;  // Important
            case AML_MONITORING:
            case WATCHLIST_CHECK:
                return 9.0;  // Very important
            case ACCREDITATION_CHECK:
            case INVESTMENT_LIMIT_CHECK:
                return 7.0;  // Moderate-high importance
            case JURISDICTION_CHECK:
            case AGE_VERIFICATION:
                return 6.0;  // Moderate importance
            case RISK_ASSESSMENT:
                return 8.0;  // Important
            case TRANSACTION_PATTERN_ANALYSIS:
            case VELOCITY_CHECK:
                return 5.0;  // Moderate importance
            default:
                return 5.0;  // Default moderate importance
        }
    }
    
    /**
     * Set default expiration based on check type
     */
    public void setDefaultExpiration() {
        Instant now = Instant.now();
        switch (checkType) {
            case IDENTITY_VERIFICATION:
            case DOCUMENT_VERIFICATION:
                // Identity checks valid for 2 years
                this.expiresAt = now.plusSeconds(2 * 365 * 24 * 3600);
                break;
            case ADDRESS_VERIFICATION:
                // Address checks valid for 1 year
                this.expiresAt = now.plusSeconds(365 * 24 * 3600);
                break;
            case SANCTIONS_SCREENING:
            case PEP_SCREENING:
            case AML_MONITORING:
            case WATCHLIST_CHECK:
                // Screening checks valid for 6 months
                this.expiresAt = now.plusSeconds(6 * 30 * 24 * 3600);
                break;
            case TRANSACTION_PATTERN_ANALYSIS:
            case VELOCITY_CHECK:
                // Transaction checks valid for 30 days
                this.expiresAt = now.plusSeconds(30 * 24 * 3600);
                break;
            case RISK_ASSESSMENT:
                // Risk assessments valid for 3 months
                this.expiresAt = now.plusSeconds(3 * 30 * 24 * 3600);
                break;
            default:
                // Default 1 year expiration
                this.expiresAt = now.plusSeconds(365 * 24 * 3600);
        }
    }
    
    /**
     * Complete the check with result
     */
    public void completeCheck(CheckResult result, Double score, String details) {
        this.result = result;
        this.score = score;
        this.details = details;
        this.status = CheckStatus.COMPLETED;
        
        // Set risk level based on result and score
        this.riskLevel = calculateRiskLevel(result, score);
        
        // Set default expiration if not already set
        if (this.expiresAt == null) {
            setDefaultExpiration();
        }
    }
    
    /**
     * Fail the check with error
     */
    public void failCheck(String errorMessage) {
        this.result = CheckResult.ERROR;
        this.status = CheckStatus.ERROR;
        this.errorMessage = errorMessage;
        this.score = 0.0;
        this.riskLevel = RiskLevel.HIGH;
        this.requiresManualReview = true;
    }
    
    /**
     * Calculate risk level based on result and score
     */
    private RiskLevel calculateRiskLevel(CheckResult result, Double score) {
        switch (result) {
            case FAIL:
                return RiskLevel.VERY_HIGH;
            case WARNING:
                return score != null && score < 50 ? RiskLevel.HIGH : RiskLevel.MEDIUM;
            case REQUIRES_REVIEW:
            case INCONCLUSIVE:
                return RiskLevel.MEDIUM;
            case PASS:
                if (score != null) {
                    if (score >= 90) return RiskLevel.VERY_LOW;
                    else if (score >= 80) return RiskLevel.LOW;
                    else if (score >= 60) return RiskLevel.MEDIUM;
                    else return RiskLevel.HIGH;
                }
                return RiskLevel.LOW;
            default:
                return RiskLevel.MEDIUM;
        }
    }
    
    /**
     * Check if the check should be retried
     */
    public boolean shouldRetry() {
        return (status == CheckStatus.ERROR || status == CheckStatus.TIMEOUT) &&
               canBeAutomated &&
               !Boolean.TRUE.equals(requiresManualReview);
    }
    
    /**
     * Get human-readable status description
     */
    public String getStatusDescription() {
        switch (status) {
            case PENDING:
                return "Waiting to be processed";
            case IN_PROGRESS:
                return "Currently being checked";
            case COMPLETED:
                return getResultDescription();
            case FAILED:
                return "Check execution failed";
            case ERROR:
                return "Error during check: " + (errorMessage != null ? errorMessage : "Unknown error");
            case TIMEOUT:
                return "Check timed out";
            case CANCELLED:
                return "Check was cancelled";
            default:
                return "Unknown status";
        }
    }
    
    /**
     * Get human-readable result description
     */
    public String getResultDescription() {
        switch (result) {
            case PASS:
                return "Check passed successfully";
            case FAIL:
                return "Check failed - compliance issue detected";
            case WARNING:
                return "Check passed with warnings";
            case INCONCLUSIVE:
                return "Check results were inconclusive";
            case REQUIRES_REVIEW:
                return "Manual review required";
            case NOT_APPLICABLE:
                return "Check not applicable for this case";
            case EXPIRED:
                return "Check result has expired";
            case ERROR:
                return "Error occurred during check";
            default:
                return "Unknown result";
        }
    }
}