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
 * Transfer Compliance Result Model
 * Specific compliance result for token transfers with detailed validation
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TransferComplianceResult {
    
    @JsonProperty("transferId")
    private String transferId;
    
    @JsonProperty("fromAddress")
    private String fromAddress;
    
    @JsonProperty("toAddress")
    private String toAddress;
    
    @JsonProperty("tokenId")
    private String tokenId;
    
    @JsonProperty("amount")
    private BigDecimal amount;
    
    @JsonProperty("isAllowed")
    private Boolean isAllowed;
    
    @JsonProperty("transferType")
    private TransferType transferType;
    
    @JsonProperty("complianceStatus")
    private ComplianceStatus complianceStatus;
    
    @JsonProperty("riskLevel")
    private RiskLevel riskLevel;
    
    @JsonProperty("complianceScore")
    private Double complianceScore; // 0-100
    
    @JsonProperty("fromUserCompliance")
    private UserComplianceCheck fromUserCompliance;
    
    @JsonProperty("toUserCompliance")
    private UserComplianceCheck toUserCompliance;
    
    @JsonProperty("transferValidation")
    private TransferValidation transferValidation;
    
    @JsonProperty("jurisdictionalChecks")
    private List<JurisdictionalCheck> jurisdictionalChecks;
    
    @JsonProperty("restrictions")
    private List<TransferRestriction> restrictions;
    
    @JsonProperty("warnings")
    private List<String> warnings;
    
    @JsonProperty("violations")
    private List<String> violations;
    
    @JsonProperty("requiredActions")
    private List<String> requiredActions;
    
    @JsonProperty("exemptions")
    private List<String> exemptions;
    
    @JsonProperty("holdPeriod")
    private Long holdPeriod; // in seconds
    
    @JsonProperty("cooldownPeriod")
    private Long cooldownPeriod; // in seconds
    
    @JsonProperty("fees")
    private TransferFees fees;
    
    @JsonProperty("monitoringFlags")
    private List<MonitoringFlag> monitoringFlags;
    
    @JsonProperty("validatedAt")
    private Instant validatedAt;
    
    @JsonProperty("expiresAt")
    private Instant expiresAt;
    
    @JsonProperty("processingTimeMs")
    private Long processingTimeMs;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * Types of transfers
     */
    public enum TransferType {
        INITIAL_PURCHASE,
        SECONDARY_SALE,
        PEER_TO_PEER,
        REDEMPTION,
        DIVIDEND_PAYMENT,
        GIFT_TRANSFER,
        INHERITANCE,
        CORPORATE_ACTION,
        FORCED_TRANSFER,
        LIQUIDATION,
        CROSS_BORDER,
        INSTITUTIONAL_TRANSFER
    }
    
    /**
     * Compliance status for the transfer
     */
    public enum ComplianceStatus {
        APPROVED,
        REJECTED,
        PENDING,
        CONDITIONAL,
        REQUIRES_APPROVAL,
        UNDER_REVIEW
    }
    
    /**
     * Risk levels for transfers
     */
    public enum RiskLevel {
        VERY_LOW,
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH,
        CRITICAL
    }
    
    /**
     * User compliance check for sender/receiver
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserComplianceCheck {
        @JsonProperty("userId")
        private String userId;
        
        @JsonProperty("address")
        private String address;
        
        @JsonProperty("kycStatus")
        private String kycStatus;
        
        @JsonProperty("amlStatus")
        private String amlStatus;
        
        @JsonProperty("riskLevel")
        private String riskLevel;
        
        @JsonProperty("jurisdiction")
        private RegulatoryJurisdiction jurisdiction;
        
        @JsonProperty("accredited")
        private Boolean accredited;
        
        @JsonProperty("institutional")
        private Boolean institutional;
        
        @JsonProperty("sanctioned")
        private Boolean sanctioned;
        
        @JsonProperty("pep")
        private Boolean pep;
        
        @JsonProperty("eligibleForAsset")
        private Boolean eligibleForAsset;
        
        @JsonProperty("investmentLimits")
        private InvestmentLimits investmentLimits;
        
        @JsonProperty("complianceScore")
        private Double complianceScore;
        
        @JsonProperty("lastVerified")
        private Instant lastVerified;
    }
    
    /**
     * Investment limits for user
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class InvestmentLimits {
        @JsonProperty("maxInvestment")
        private BigDecimal maxInvestment;
        
        @JsonProperty("currentInvestment")
        private BigDecimal currentInvestment;
        
        @JsonProperty("remainingCapacity")
        private BigDecimal remainingCapacity;
        
        @JsonProperty("dailyLimit")
        private BigDecimal dailyLimit;
        
        @JsonProperty("monthlyLimit")
        private BigDecimal monthlyLimit;
        
        @JsonProperty("yearlyLimit")
        private BigDecimal yearlyLimit;
    }
    
    /**
     * Transfer validation details
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransferValidation {
        @JsonProperty("amountValidation")
        private Boolean amountValidation;
        
        @JsonProperty("balanceValidation")
        private Boolean balanceValidation;
        
        @JsonProperty("limitValidation")
        private Boolean limitValidation;
        
        @JsonProperty("holdPeriodValidation")
        private Boolean holdPeriodValidation;
        
        @JsonProperty("cooldownValidation")
        private Boolean cooldownValidation;
        
        @JsonProperty("blacklistValidation")
        private Boolean blacklistValidation;
        
        @JsonProperty("whitelistValidation")
        private Boolean whitelistValidation;
        
        @JsonProperty("timeRestrictionValidation")
        private Boolean timeRestrictionValidation;
        
        @JsonProperty("volumeValidation")
        private Boolean volumeValidation;
        
        @JsonProperty("frequencyValidation")
        private Boolean frequencyValidation;
        
        @JsonProperty("validationErrors")
        private List<String> validationErrors;
    }
    
    /**
     * Jurisdictional compliance checks
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class JurisdictionalCheck {
        @JsonProperty("jurisdiction")
        private RegulatoryJurisdiction jurisdiction;
        
        @JsonProperty("allowed")
        private Boolean allowed;
        
        @JsonProperty("restrictions")
        private List<String> restrictions;
        
        @JsonProperty("requirements")
        private List<String> requirements;
        
        @JsonProperty("reason")
        private String reason;
        
        @JsonProperty("regulatoryRule")
        private String regulatoryRule;
    }
    
    /**
     * Transfer restrictions
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransferRestriction {
        @JsonProperty("restrictionType")
        private RestrictionType restrictionType;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("severity")
        private RestrictionSeverity severity;
        
        @JsonProperty("canBeOverridden")
        private Boolean canBeOverridden;
        
        @JsonProperty("overrideRequirements")
        private List<String> overrideRequirements;
        
        @JsonProperty("expiresAt")
        private Instant expiresAt;
        
        public enum RestrictionType {
            HOLD_PERIOD,
            COOLING_PERIOD,
            INVESTMENT_LIMIT,
            JURISDICTIONAL,
            BLACKLIST,
            SANCTIONS,
            KYC_INCOMPLETE,
            AML_FLAG,
            REGULATORY_HOLD,
            COURT_ORDER,
            COMPLIANCE_REVIEW,
            RISK_BASED
        }
        
        public enum RestrictionSeverity {
            INFO,
            WARNING,
            BLOCKING,
            CRITICAL
        }
    }
    
    /**
     * Transfer fees breakdown
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransferFees {
        @JsonProperty("baseFee")
        private BigDecimal baseFee;
        
        @JsonProperty("complianceFee")
        private BigDecimal complianceFee;
        
        @JsonProperty("crossBorderFee")
        private BigDecimal crossBorderFee;
        
        @JsonProperty("riskFee")
        private BigDecimal riskFee;
        
        @JsonProperty("regulatoryFee")
        private BigDecimal regulatoryFee;
        
        @JsonProperty("totalFee")
        private BigDecimal totalFee;
        
        @JsonProperty("feeCurrency")
        private String feeCurrency;
        
        @JsonProperty("feeCalculation")
        private String feeCalculation;
    }
    
    /**
     * Monitoring flags for the transfer
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonitoringFlag {
        @JsonProperty("flagType")
        private FlagType flagType;
        
        @JsonProperty("severity")
        private FlagSeverity severity;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("triggerRule")
        private String triggerRule;
        
        @JsonProperty("requiresAction")
        private Boolean requiresAction;
        
        @JsonProperty("autoResolvable")
        private Boolean autoResolvable;
        
        public enum FlagType {
            HIGH_VALUE,
            UNUSUAL_PATTERN,
            VELOCITY_CHECK,
            GEOGRAPHIC_RISK,
            COUNTERPARTY_RISK,
            SANCTIONS_RISK,
            AML_RISK,
            FRAUD_RISK,
            STRUCTURING_RISK,
            REGULATORY_REPORTING
        }
        
        public enum FlagSeverity {
            LOW,
            MEDIUM,
            HIGH,
            CRITICAL
        }
    }
    
    // Constructor with essential fields
    public TransferComplianceResult(String fromAddress, String toAddress, String tokenId, BigDecimal amount) {
        this.transferId = java.util.UUID.randomUUID().toString();
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.tokenId = tokenId;
        this.amount = amount;
        this.validatedAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(3600); // Default 1 hour expiration
        this.jurisdictionalChecks = new java.util.ArrayList<>();
        this.restrictions = new java.util.ArrayList<>();
        this.warnings = new java.util.ArrayList<>();
        this.violations = new java.util.ArrayList<>();
        this.requiredActions = new java.util.ArrayList<>();
        this.exemptions = new java.util.ArrayList<>();
        this.monitoringFlags = new java.util.ArrayList<>();
    }
    
    /**
     * Check if transfer is still valid (not expired)
     */
    public boolean isStillValid() {
        return expiresAt != null && expiresAt.isAfter(Instant.now()) &&
               Boolean.TRUE.equals(isAllowed);
    }
    
    /**
     * Check if transfer has blocking restrictions
     */
    public boolean hasBlockingRestrictions() {
        return restrictions != null && restrictions.stream()
                .anyMatch(r -> r.getSeverity() == TransferRestriction.RestrictionSeverity.BLOCKING ||
                              r.getSeverity() == TransferRestriction.RestrictionSeverity.CRITICAL);
    }
    
    /**
     * Check if transfer requires enhanced monitoring
     */
    public boolean requiresEnhancedMonitoring() {
        return riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.VERY_HIGH ||
               riskLevel == RiskLevel.CRITICAL ||
               (monitoringFlags != null && !monitoringFlags.isEmpty());
    }
    
    /**
     * Get highest severity restriction
     */
    public TransferRestriction.RestrictionSeverity getHighestRestrictionSeverity() {
        if (restrictions == null || restrictions.isEmpty()) {
            return null;
        }
        
        return restrictions.stream()
                .map(TransferRestriction::getSeverity)
                .max((s1, s2) -> {
                    int order1 = getRestrictionSeverityOrder(s1);
                    int order2 = getRestrictionSeverityOrder(s2);
                    return Integer.compare(order1, order2);
                })
                .orElse(null);
    }
    
    private int getRestrictionSeverityOrder(TransferRestriction.RestrictionSeverity severity) {
        switch (severity) {
            case CRITICAL: return 4;
            case BLOCKING: return 3;
            case WARNING: return 2;
            case INFO: return 1;
            default: return 0;
        }
    }
    
    /**
     * Add restriction
     */
    public void addRestriction(TransferRestriction restriction) {
        if (restrictions == null) {
            restrictions = new java.util.ArrayList<>();
        }
        restrictions.add(restriction);
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
     * Add violation
     */
    public void addViolation(String violation) {
        if (violations == null) {
            violations = new java.util.ArrayList<>();
        }
        violations.add(violation);
    }
    
    /**
     * Add monitoring flag
     */
    public void addMonitoringFlag(MonitoringFlag flag) {
        if (monitoringFlags == null) {
            monitoringFlags = new java.util.ArrayList<>();
        }
        monitoringFlags.add(flag);
    }
    
    /**
     * Calculate overall transfer risk
     */
    public void calculateOverallRisk() {
        int riskScore = 0;
        
        // Base risk from user compliance
        if (fromUserCompliance != null && fromUserCompliance.getComplianceScore() != null) {
            riskScore += (100 - fromUserCompliance.getComplianceScore()) * 0.4;
        }
        
        if (toUserCompliance != null && toUserCompliance.getComplianceScore() != null) {
            riskScore += (100 - toUserCompliance.getComplianceScore()) * 0.4;
        }
        
        // Risk from restrictions
        if (restrictions != null) {
            for (TransferRestriction restriction : restrictions) {
                switch (restriction.getSeverity()) {
                    case CRITICAL: riskScore += 30; break;
                    case BLOCKING: riskScore += 20; break;
                    case WARNING: riskScore += 10; break;
                    case INFO: riskScore += 5; break;
                }
            }
        }
        
        // Risk from monitoring flags
        if (monitoringFlags != null) {
            for (MonitoringFlag flag : monitoringFlags) {
                switch (flag.getSeverity()) {
                    case CRITICAL: riskScore += 25; break;
                    case HIGH: riskScore += 15; break;
                    case MEDIUM: riskScore += 10; break;
                    case LOW: riskScore += 5; break;
                }
            }
        }
        
        // Determine risk level
        if (riskScore >= 80) this.riskLevel = RiskLevel.CRITICAL;
        else if (riskScore >= 60) this.riskLevel = RiskLevel.VERY_HIGH;
        else if (riskScore >= 40) this.riskLevel = RiskLevel.HIGH;
        else if (riskScore >= 20) this.riskLevel = RiskLevel.MEDIUM;
        else if (riskScore >= 10) this.riskLevel = RiskLevel.LOW;
        else this.riskLevel = RiskLevel.VERY_LOW;
        
        this.complianceScore = Math.max(0.0, 100.0 - riskScore);
    }
    
    /**
     * Generate transfer summary
     */
    public String getTransferSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Transfer ").append(transferId).append(": ");
        summary.append(isAllowed ? "ALLOWED" : "REJECTED");
        
        if (complianceScore != null) {
            summary.append(" (Score: ").append(String.format("%.1f", complianceScore)).append(")");
        }
        
        if (riskLevel != null) {
            summary.append(" [Risk: ").append(riskLevel).append("]");
        }
        
        if (!restrictions.isEmpty()) {
            summary.append(" - ").append(restrictions.size()).append(" restriction(s)");
        }
        
        if (!warnings.isEmpty()) {
            summary.append(" - ").append(warnings.size()).append(" warning(s)");
        }
        
        return summary.toString();
    }
}