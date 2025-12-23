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
 * Compliance Profile Model
 * Comprehensive user compliance profile with KYC/AML status
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceProfile {
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("address")
    private String address;
    
    @JsonProperty("kycStatus")
    private KYCStatus kycStatus;
    
    @JsonProperty("amlStatus")
    private AMLStatus amlStatus;
    
    @JsonProperty("overallStatus")
    private ComplianceStatus overallStatus;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    @JsonProperty("investorType")
    private InvestorType investorType;
    
    @JsonProperty("riskLevel")
    private RiskLevel riskLevel;
    
    @JsonProperty("verificationLevel")
    private VerificationLevel verificationLevel;
    
    @JsonProperty("accreditedInvestor")
    private Boolean accreditedInvestor;
    
    @JsonProperty("institutionalInvestor")
    private Boolean institutionalInvestor;
    
    @JsonProperty("pep")
    private Boolean pep; // Politically Exposed Person
    
    @JsonProperty("sanctioned")
    private Boolean sanctioned;
    
    @JsonProperty("maxInvestmentLimit")
    private BigDecimal maxInvestmentLimit;
    
    @JsonProperty("currentInvestmentValue")
    private BigDecimal currentInvestmentValue;
    
    @JsonProperty("complianceChecks")
    private List<ComplianceCheck> complianceChecks;
    
    @JsonProperty("violations")
    private List<ComplianceViolation> violations;
    
    @JsonProperty("exemptions")
    private List<String> exemptions;
    
    @JsonProperty("restrictedAssets")
    private List<String> restrictedAssets;
    
    @JsonProperty("allowedAssetTypes")
    private List<String> allowedAssetTypes;
    
    @JsonProperty("documentStatus")
    private Map<String, DocumentStatus> documentStatus;
    
    @JsonProperty("lastKYCUpdate")
    private Instant lastKYCUpdate;
    
    @JsonProperty("lastAMLCheck")
    private Instant lastAMLCheck;
    
    @JsonProperty("kycExpirationDate")
    private Instant kycExpirationDate;
    
    @JsonProperty("amlNextReview")
    private Instant amlNextReview;
    
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @JsonProperty("updatedAt")
    private Instant updatedAt;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    /**
     * KYC Status enumeration
     */
    public enum KYCStatus {
        PENDING,
        VERIFIED,
        FAILED,
        EXPIRED,
        UNDER_REVIEW,
        ADDITIONAL_INFO_REQUIRED
    }
    
    /**
     * AML Status enumeration
     */
    public enum AMLStatus {
        CLEAR,
        FLAGGED,
        UNDER_REVIEW,
        BLOCKED,
        PENDING_VERIFICATION
    }
    
    /**
     * Overall Compliance Status
     */
    public enum ComplianceStatus {
        COMPLIANT,
        NON_COMPLIANT,
        PENDING,
        CONDITIONAL,
        SUSPENDED
    }
    
    /**
     * Investor Type enumeration
     */
    public enum InvestorType {
        RETAIL,
        ACCREDITED,
        INSTITUTIONAL,
        PROFESSIONAL,
        QUALIFIED_PURCHASER,
        FAMILY_OFFICE,
        PENSION_FUND,
        SOVEREIGN_WEALTH_FUND,
        ENDOWMENT,
        FOUNDATION
    }
    
    /**
     * Risk Level enumeration
     */
    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH
    }
    
    /**
     * Verification Level enumeration
     */
    public enum VerificationLevel {
        BASIC,
        ENHANCED,
        PREMIUM,
        INSTITUTIONAL
    }
    
    /**
     * Document Status enumeration
     */
    public enum DocumentStatus {
        PENDING,
        SUBMITTED,
        VERIFIED,
        REJECTED,
        EXPIRED,
        NOT_REQUIRED
    }
    
    // Constructor with essential fields
    public ComplianceProfile(String userId, String address, RegulatoryJurisdiction jurisdiction) {
        this.userId = userId;
        this.address = address;
        this.jurisdiction = jurisdiction;
        this.kycStatus = KYCStatus.PENDING;
        this.amlStatus = AMLStatus.PENDING_VERIFICATION;
        this.overallStatus = ComplianceStatus.PENDING;
        this.riskLevel = RiskLevel.MEDIUM;
        this.verificationLevel = VerificationLevel.BASIC;
        this.accreditedInvestor = false;
        this.institutionalInvestor = false;
        this.pep = false;
        this.sanctioned = false;
        this.currentInvestmentValue = BigDecimal.ZERO;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
    
    /**
     * Check if profile is fully compliant
     */
    public boolean isCompliant() {
        return overallStatus == ComplianceStatus.COMPLIANT &&
               kycStatus == KYCStatus.VERIFIED &&
               amlStatus == AMLStatus.CLEAR &&
               !sanctioned &&
               (kycExpirationDate == null || kycExpirationDate.isAfter(Instant.now()));
    }
    
    /**
     * Check if KYC is expired
     */
    public boolean isKYCExpired() {
        return kycExpirationDate != null && kycExpirationDate.isBefore(Instant.now());
    }
    
    /**
     * Check if AML review is due
     */
    public boolean isAMLReviewDue() {
        return amlNextReview != null && amlNextReview.isBefore(Instant.now());
    }
    
    /**
     * Check if user can invest in specific asset
     */
    public boolean canInvestInAsset(String assetType) {
        if (restrictedAssets != null && restrictedAssets.contains(assetType)) {
            return false;
        }
        
        if (allowedAssetTypes != null && !allowedAssetTypes.isEmpty()) {
            return allowedAssetTypes.contains(assetType);
        }
        
        return isCompliant();
    }
    
    /**
     * Check if investment amount is within limits
     */
    public boolean canInvestAmount(BigDecimal amount) {
        if (!isCompliant()) return false;
        
        if (maxInvestmentLimit != null) {
            BigDecimal totalAfterInvestment = currentInvestmentValue.add(amount);
            return totalAfterInvestment.compareTo(maxInvestmentLimit) <= 0;
        }
        
        return true;
    }
    
    /**
     * Get compliance score (0-100)
     */
    public double getComplianceScore() {
        double score = 0.0;
        
        // KYC status contribution (40%)
        switch (kycStatus) {
            case VERIFIED: score += 40; break;
            case UNDER_REVIEW: score += 20; break;
            case PENDING: score += 10; break;
            default: score += 0;
        }
        
        // AML status contribution (30%)
        switch (amlStatus) {
            case CLEAR: score += 30; break;
            case PENDING_VERIFICATION: score += 15; break;
            case UNDER_REVIEW: score += 5; break;
            default: score += 0;
        }
        
        // Risk factors (20%)
        if (!sanctioned) score += 10;
        if (!pep) score += 5;
        switch (riskLevel) {
            case LOW: score += 5; break;
            case MEDIUM: score += 3; break;
            case HIGH: score += 1; break;
            default: score += 0;
        }
        
        // Additional factors (10%)
        if (!isKYCExpired()) score += 5;
        if (violations == null || violations.isEmpty()) score += 5;
        
        return Math.max(0.0, Math.min(100.0, score));
    }
    
    /**
     * Update compliance status based on current checks
     */
    public void updateOverallStatus() {
        if (sanctioned || (violations != null && !violations.isEmpty())) {
            this.overallStatus = ComplianceStatus.NON_COMPLIANT;
        } else if (kycStatus == KYCStatus.VERIFIED && amlStatus == AMLStatus.CLEAR) {
            this.overallStatus = ComplianceStatus.COMPLIANT;
        } else if (kycStatus == KYCStatus.PENDING || amlStatus == AMLStatus.PENDING_VERIFICATION) {
            this.overallStatus = ComplianceStatus.PENDING;
        } else if (kycStatus == KYCStatus.UNDER_REVIEW || amlStatus == AMLStatus.UNDER_REVIEW) {
            this.overallStatus = ComplianceStatus.CONDITIONAL;
        } else {
            this.overallStatus = ComplianceStatus.NON_COMPLIANT;
        }
        
        this.updatedAt = Instant.now();
    }
    
    /**
     * Add compliance check
     */
    public void addComplianceCheck(ComplianceCheck check) {
        if (complianceChecks == null) {
            complianceChecks = new java.util.ArrayList<>();
        }
        complianceChecks.add(check);
        updateOverallStatus();
    }
    
    /**
     * Add compliance violation
     */
    public void addViolation(ComplianceViolation violation) {
        if (violations == null) {
            violations = new java.util.ArrayList<>();
        }
        violations.add(violation);
        updateOverallStatus();
    }
}