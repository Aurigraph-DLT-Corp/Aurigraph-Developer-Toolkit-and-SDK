package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Compliance Validation Result Model
 * Result of comprehensive compliance validation for transactions or operations
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceValidationResult {
    
    @JsonProperty("validationId")
    private String validationId;
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("transactionId")
    private String transactionId;
    
    @JsonProperty("assetId")
    private String assetId;
    
    @JsonProperty("operationType")
    private OperationType operationType;
    
    @JsonProperty("isValid")
    private Boolean isValid;
    
    @JsonProperty("overallStatus")
    private ValidationStatus overallStatus;
    
    @JsonProperty("complianceScore")
    private Double complianceScore; // 0-100
    
    @JsonProperty("riskLevel")
    private RiskLevel riskLevel;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("checkResults")
    private List<ComplianceCheckResult> checkResults;
    
    @JsonProperty("violations")
    private List<String> violations; // List of violation descriptions
    
    @JsonProperty("warnings")
    private List<String> warnings;
    
    @JsonProperty("recommendations")
    private List<String> recommendations;
    
    @JsonProperty("requiredActions")
    private List<RequiredAction> requiredActions;
    
    @JsonProperty("exemptions")
    private List<String> exemptions;
    
    @JsonProperty("validationRules")
    private List<ValidationRule> validationRules;
    
    @JsonProperty("performedBy")
    private String performedBy;
    
    @JsonProperty("automatedValidation")
    private Boolean automatedValidation;
    
    @JsonProperty("validatedAt")
    private Instant validatedAt;
    
    @JsonProperty("expiresAt")
    private Instant expiresAt;
    
    @JsonProperty("processingTimeMs")
    private Long processingTimeMs;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Types of operations being validated
     */
    public enum OperationType {
        TOKEN_PURCHASE,
        TOKEN_SALE,
        TOKEN_TRANSFER,
        TOKEN_REDEMPTION,
        ACCOUNT_OPENING,
        PROFILE_UPDATE,
        WITHDRAWAL,
        DEPOSIT,
        STAKING,
        LENDING,
        BORROWING,
        TRADING,
        CROSS_BORDER_TRANSFER,
        BULK_OPERATION,
        ADMINISTRATIVE_ACTION
    }
    
    /**
     * Overall validation status
     */
    public enum ValidationStatus {
        PASSED,
        FAILED,
        CONDITIONAL, // Passed with conditions
        PENDING,     // Requires manual review
        EXPIRED,
        ERROR
    }
    
    /**
     * Risk levels for the operation
     */
    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH,
        CRITICAL
    }
    
    /**
     * Required actions to achieve compliance
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RequiredAction {
        @JsonProperty("actionType")
        private ActionType actionType;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("priority")
        private ActionPriority priority;
        
        @JsonProperty("deadline")
        private Instant deadline;
        
        @JsonProperty("blocking")
        private Boolean blocking; // Whether this blocks the operation
        
        @JsonProperty("automated")
        private Boolean automated; // Whether this can be automated
        
        public enum ActionType {
            COMPLETE_KYC,
            UPDATE_PROFILE,
            PROVIDE_DOCUMENTATION,
            CONFIRM_IDENTITY,
            VERIFY_ADDRESS,
            COMPLETE_AML_CHECK,
            OBTAIN_APPROVAL,
            REDUCE_TRANSACTION_AMOUNT,
            WAIT_COOLING_PERIOD,
            CONTACT_SUPPORT,
            REGULATORY_APPROVAL,
            ENHANCED_MONITORING,
            ADDITIONAL_VERIFICATION
        }
        
        public enum ActionPriority {
            LOW,
            MEDIUM,
            HIGH,
            URGENT,
            CRITICAL
        }
    }
    
    /**
     * Validation rules applied
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ValidationRule {
        @JsonProperty("ruleId")
        private String ruleId;
        
        @JsonProperty("ruleName")
        private String ruleName;
        
        @JsonProperty("ruleType")
        private RuleType ruleType;
        
        @JsonProperty("jurisdiction")
        private RegulatoryJurisdiction jurisdiction;
        
        @JsonProperty("passed")
        private Boolean passed;
        
        @JsonProperty("score")
        private Double score;
        
        @JsonProperty("details")
        private String details;
        
        @JsonProperty("weight")
        private Double weight; // Weight in overall score calculation
        
        public enum RuleType {
            KYC_RULE,
            AML_RULE,
            SANCTIONS_RULE,
            JURISDICTIONAL_RULE,
            INVESTMENT_LIMIT_RULE,
            ACCREDITATION_RULE,
            TAX_RULE,
            OPERATIONAL_RULE,
            RISK_RULE,
            REGULATORY_RULE
        }
    }
    
    // Constructor with essential fields
    public ComplianceValidationResult(String userId, OperationType operationType, RegulatoryJurisdiction jurisdiction) {
        this.validationId = java.util.UUID.randomUUID().toString();
        this.userId = userId;
        this.operationType = operationType;
        this.jurisdiction = jurisdiction;
        this.automatedValidation = true;
        this.validatedAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(24 * 3600); // Default 24 hour expiration
        this.checkResults = new java.util.ArrayList<>();
        this.violations = new java.util.ArrayList<>();
        this.warnings = new java.util.ArrayList<>();
        this.recommendations = new java.util.ArrayList<>();
        this.requiredActions = new java.util.ArrayList<>();
        this.exemptions = new java.util.ArrayList<>();
        this.validationRules = new java.util.ArrayList<>();
    }
    
    /**
     * Check if validation result is still valid (not expired)
     */
    public boolean isStillValid() {
        return expiresAt != null && expiresAt.isAfter(Instant.now()) &&
               overallStatus == ValidationStatus.PASSED;
    }
    
    /**
     * Check if there are blocking issues
     */
    public boolean hasBlockingIssues() {
        return overallStatus == ValidationStatus.FAILED ||
               (requiredActions != null && requiredActions.stream()
                   .anyMatch(action -> Boolean.TRUE.equals(action.getBlocking())));
    }
    
    /**
     * Get highest priority required action
     */
    public RequiredAction.ActionPriority getHighestActionPriority() {
        if (requiredActions == null || requiredActions.isEmpty()) {
            return null;
        }
        
        return requiredActions.stream()
                .map(RequiredAction::getPriority)
                .max((p1, p2) -> {
                    // Define priority order
                    int order1 = getPriorityOrder(p1);
                    int order2 = getPriorityOrder(p2);
                    return Integer.compare(order1, order2);
                })
                .orElse(RequiredAction.ActionPriority.LOW);
    }
    
    private int getPriorityOrder(RequiredAction.ActionPriority priority) {
        switch (priority) {
            case CRITICAL: return 5;
            case URGENT: return 4;
            case HIGH: return 3;
            case MEDIUM: return 2;
            case LOW: return 1;
            default: return 0;
        }
    }
    
    /**
     * Calculate overall compliance score based on check results
     */
    public void calculateOverallScore() {
        if (checkResults == null || checkResults.isEmpty()) {
            this.complianceScore = 0.0;
            return;
        }
        
        double totalScore = 0.0;
        double totalWeight = 0.0;
        
        for (ComplianceCheckResult result : checkResults) {
            if (result.getScore() != null) {
                double weight = result.getWeight() != null ? result.getWeight() : 1.0;
                totalScore += result.getScore() * weight;
                totalWeight += weight;
            }
        }
        
        this.complianceScore = totalWeight > 0 ? totalScore / totalWeight : 0.0;
    }
    
    /**
     * Determine overall status based on individual check results
     */
    public void determineOverallStatus() {
        if (checkResults == null || checkResults.isEmpty()) {
            this.overallStatus = ValidationStatus.ERROR;
            return;
        }
        
        boolean hasFailures = checkResults.stream()
                .anyMatch(result -> result.getStatus() == ComplianceCheckResult.CheckStatus.FAILED);
        
        boolean hasPending = checkResults.stream()
                .anyMatch(result -> result.getStatus() == ComplianceCheckResult.CheckStatus.PENDING);
        
        if (hasFailures || !violations.isEmpty()) {
            this.overallStatus = ValidationStatus.FAILED;
        } else if (hasPending) {
            this.overallStatus = ValidationStatus.PENDING;
        } else if (!warnings.isEmpty() || !requiredActions.isEmpty()) {
            this.overallStatus = ValidationStatus.CONDITIONAL;
        } else {
            this.overallStatus = ValidationStatus.PASSED;
        }
        
        this.isValid = (overallStatus == ValidationStatus.PASSED || 
                       overallStatus == ValidationStatus.CONDITIONAL);
    }
    
    /**
     * Add check result
     */
    public void addCheckResult(ComplianceCheckResult result) {
        if (checkResults == null) {
            checkResults = new java.util.ArrayList<>();
        }
        checkResults.add(result);
    }
    
    /**
     * Add violation
     */
    public void addViolation(String violation) {
        if (violations == null) {
            violations = new java.util.ArrayList<>();
        }
        violations.add(violation);
    }
    
    /**
     * Add warning
     */
    public void addWarning(String warning) {
        if (warnings == null) {
            warnings = new java.util.ArrayList<>();
        }
        warnings.add(warning);
    }
    
    /**
     * Add required action
     */
    public void addRequiredAction(RequiredAction action) {
        if (requiredActions == null) {
            requiredActions = new java.util.ArrayList<>();
        }
        requiredActions.add(action);
    }
    
    /**
     * Get summary string
     */
    public String getSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Compliance Validation: ").append(overallStatus);
        
        if (complianceScore != null) {
            summary.append(" (Score: ").append(String.format("%.1f", complianceScore)).append(")");
        }
        
        if (!violations.isEmpty()) {
            summary.append(" - ").append(violations.size()).append(" violation(s)");
        }
        
        if (!warnings.isEmpty()) {
            summary.append(" - ").append(warnings.size()).append(" warning(s)");
        }
        
        if (!requiredActions.isEmpty()) {
            summary.append(" - ").append(requiredActions.size()).append(" required action(s)");
        }
        
        return summary.toString();
    }
}