package io.aurigraph.v11.compliance.mica;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MiCA Compliance Module - EU Markets in Crypto-Assets Regulation
 *
 * Implements compliance checks for the Markets in Crypto-Assets (MiCA) Regulation
 * (EU) 2023/1114, which provides a comprehensive regulatory framework for
 * crypto-assets in the European Union.
 *
 * Key regulatory areas covered:
 * - Whitepaper requirements (Article 6-12)
 * - Reserve disclosure requirements (Article 36)
 * - Redemption rights enforcement (Article 39)
 * - Operating conditions validation (Article 59)
 * - Governance and capital requirements (Article 60-65)
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class MiCAComplianceModule {

    @Inject
    MiCAAssetClassification assetClassification;

    // Compliance records storage
    private final Map<String, MiCAComplianceRecord> complianceRecords = new ConcurrentHashMap<>();
    private final Map<String, WhitepaperRecord> whitepaperRegistry = new ConcurrentHashMap<>();
    private final Map<String, ReserveRecord> reserveRecords = new ConcurrentHashMap<>();
    private final List<ComplianceAuditEntry> auditTrail = Collections.synchronizedList(new ArrayList<>());

    // Regulatory thresholds per MiCA
    private static final BigDecimal SIGNIFICANT_ART_THRESHOLD = new BigDecimal("5000000000"); // 5 billion EUR
    private static final BigDecimal SIGNIFICANT_EMT_THRESHOLD = new BigDecimal("5000000000"); // 5 billion EUR
    private static final int MIN_RESERVE_RATIO_PERCENT = 100; // 100% reserve backing required
    private static final int GOVERNANCE_MEMBER_MIN = 3; // Minimum management body members
    private static final BigDecimal MIN_OWN_FUNDS_ART = new BigDecimal("350000"); // 350,000 EUR for ART
    private static final BigDecimal MIN_OWN_FUNDS_EMT = new BigDecimal("350000"); // 350,000 EUR for EMT

    /**
     * Perform comprehensive MiCA compliance check for a token
     *
     * @param tokenId Unique token identifier
     * @param issuerInfo Issuer information for compliance validation
     * @return ComplianceCheckResult with detailed compliance status
     */
    public ComplianceCheckResult performComplianceCheck(String tokenId, IssuerInfo issuerInfo) {
        Log.infof("Performing MiCA compliance check for token: %s", tokenId);

        ComplianceCheckResult result = new ComplianceCheckResult(tokenId);
        result.setCheckTimestamp(Instant.now());

        // Step 1: Determine asset classification
        MiCAAssetClassification.AssetClass assetClass =
            assetClassification.classifyAsset(tokenId, issuerInfo);
        result.setAssetClass(assetClass);

        // Step 2: Check whitepaper requirements
        WhitepaperComplianceResult wpResult = checkWhitepaperCompliance(tokenId, assetClass);
        result.setWhitepaperCompliance(wpResult);

        // Step 3: Check reserve requirements (for EMT and ART)
        if (assetClass == MiCAAssetClassification.AssetClass.E_MONEY_TOKEN ||
            assetClass == MiCAAssetClassification.AssetClass.ASSET_REFERENCED_TOKEN) {
            ReserveComplianceResult reserveResult = checkReserveCompliance(tokenId, assetClass);
            result.setReserveCompliance(reserveResult);
        }

        // Step 4: Check redemption rights
        RedemptionRightsResult redemptionResult = checkRedemptionRights(tokenId, assetClass);
        result.setRedemptionRights(redemptionResult);

        // Step 5: Check operating conditions
        OperatingConditionsResult opResult = checkOperatingConditions(tokenId, issuerInfo);
        result.setOperatingConditions(opResult);

        // Step 6: Check governance requirements
        GovernanceResult govResult = checkGovernanceRequirements(issuerInfo);
        result.setGovernanceCompliance(govResult);

        // Step 7: Check capital requirements
        CapitalRequirementsResult capResult = checkCapitalRequirements(issuerInfo, assetClass);
        result.setCapitalRequirements(capResult);

        // Calculate overall compliance score
        result.calculateOverallCompliance();

        // Store record and create audit entry
        MiCAComplianceRecord record = new MiCAComplianceRecord(tokenId, result);
        complianceRecords.put(tokenId, record);

        auditTrail.add(new ComplianceAuditEntry(
            "COMPLIANCE_CHECK",
            tokenId,
            result.isCompliant() ? "PASSED" : "FAILED",
            "MiCA compliance check completed with score: " + result.getComplianceScore(),
            Instant.now()
        ));

        Log.infof("MiCA compliance check completed for token %s: %s (Score: %.2f%%)",
            tokenId, result.isCompliant() ? "COMPLIANT" : "NON-COMPLIANT", result.getComplianceScore());

        return result;
    }

    /**
     * Check whitepaper compliance per MiCA Articles 6-12
     */
    public WhitepaperComplianceResult checkWhitepaperCompliance(String tokenId,
            MiCAAssetClassification.AssetClass assetClass) {

        WhitepaperComplianceResult result = new WhitepaperComplianceResult();
        WhitepaperRecord whitepaper = whitepaperRegistry.get(tokenId);

        if (whitepaper == null) {
            result.setCompliant(false);
            result.addViolation("No whitepaper registered for token");
            return result;
        }

        List<String> violations = new ArrayList<>();
        List<String> requirements = new ArrayList<>();

        // Required content per Article 6
        requirements.add("Issuer identity and contact information");
        requirements.add("Description of the project and crypto-asset");
        requirements.add("Rights and obligations attached to the crypto-asset");
        requirements.add("Information about the underlying technology");
        requirements.add("Risks relating to the crypto-asset");
        requirements.add("Information about the offer to the public");

        // Check required fields
        if (!whitepaper.hasIssuerInfo()) {
            violations.add("Missing issuer identity and contact information (Article 6.1)");
        }
        if (!whitepaper.hasProjectDescription()) {
            violations.add("Missing project description (Article 6.2)");
        }
        if (!whitepaper.hasRightsAndObligations()) {
            violations.add("Missing rights and obligations disclosure (Article 6.3)");
        }
        if (!whitepaper.hasTechnologyDescription()) {
            violations.add("Missing technology description (Article 6.4)");
        }
        if (!whitepaper.hasRiskDisclosure()) {
            violations.add("Missing risk disclosure (Article 6.5)");
        }
        if (!whitepaper.hasOfferInfo()) {
            violations.add("Missing offer information (Article 6.6)");
        }

        // Additional requirements for ART (Article 19)
        if (assetClass == MiCAAssetClassification.AssetClass.ASSET_REFERENCED_TOKEN) {
            requirements.add("Reserve asset composition");
            requirements.add("Custody arrangements for reserve");
            requirements.add("Investment policy for reserve");

            if (!whitepaper.hasReserveAssetComposition()) {
                violations.add("Missing reserve asset composition (Article 19.1)");
            }
            if (!whitepaper.hasCustodyArrangements()) {
                violations.add("Missing custody arrangements disclosure (Article 19.2)");
            }
        }

        // Additional requirements for EMT (Article 48)
        if (assetClass == MiCAAssetClassification.AssetClass.E_MONEY_TOKEN) {
            requirements.add("E-money institution authorization");
            requirements.add("Redemption conditions at par value");

            if (!whitepaper.hasEMoneyAuthorization()) {
                violations.add("Missing e-money institution authorization (Article 48)");
            }
            if (!whitepaper.hasRedemptionConditions()) {
                violations.add("Missing redemption conditions disclosure (Article 49)");
            }
        }

        result.setRequirements(requirements);
        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());
        result.setPublicationDate(whitepaper.getPublicationDate());
        result.setLastUpdated(whitepaper.getLastUpdated());

        return result;
    }

    /**
     * Check reserve requirements per MiCA Articles 36-38
     */
    public ReserveComplianceResult checkReserveCompliance(String tokenId,
            MiCAAssetClassification.AssetClass assetClass) {

        ReserveComplianceResult result = new ReserveComplianceResult();
        ReserveRecord reserve = reserveRecords.get(tokenId);

        if (reserve == null) {
            result.setCompliant(false);
            result.addViolation("No reserve record found for token");
            return result;
        }

        List<String> violations = new ArrayList<>();

        // Check reserve ratio (Article 36)
        BigDecimal reserveRatio = reserve.getReserveRatio();
        if (reserveRatio.compareTo(BigDecimal.valueOf(MIN_RESERVE_RATIO_PERCENT)) < 0) {
            violations.add(String.format(
                "Reserve ratio %.2f%% below minimum 100%% requirement (Article 36)",
                reserveRatio.doubleValue()));
        }

        // Check reserve asset composition (Article 36.4)
        if (!reserve.hasQualifiedAssets()) {
            violations.add("Reserve assets must be highly liquid with minimal market, " +
                "credit and concentration risk (Article 36.4)");
        }

        // Check custody arrangements (Article 37)
        if (!reserve.hasCustodialArrangement()) {
            violations.add("Reserve assets must be held by authorized custodian (Article 37)");
        }

        // Check segregation of reserve (Article 37.2)
        if (!reserve.isSegregated()) {
            violations.add("Reserve assets must be segregated from issuer's assets (Article 37.2)");
        }

        // Check quarterly disclosure (Article 38)
        if (!reserve.hasQuarterlyDisclosure()) {
            violations.add("Missing quarterly reserve disclosure (Article 38)");
        }

        // Check significant token threshold (Article 43)
        if (reserve.getCirculatingValue().compareTo(SIGNIFICANT_ART_THRESHOLD) >= 0) {
            result.setSignificantToken(true);
            // Additional requirements for significant ARTs
            if (!reserve.hasEnhancedLiquidity()) {
                violations.add("Significant ART requires enhanced liquidity management (Article 43)");
            }
            if (!reserve.hasRecoveryPlan()) {
                violations.add("Significant ART requires recovery plan (Article 46)");
            }
        }

        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());
        result.setReserveRatio(reserveRatio);
        result.setCirculatingValue(reserve.getCirculatingValue());
        result.setLastAuditDate(reserve.getLastAuditDate());

        return result;
    }

    /**
     * Check redemption rights per MiCA Article 39
     */
    public RedemptionRightsResult checkRedemptionRights(String tokenId,
            MiCAAssetClassification.AssetClass assetClass) {

        RedemptionRightsResult result = new RedemptionRightsResult();
        List<String> violations = new ArrayList<>();

        MiCAComplianceRecord record = complianceRecords.get(tokenId);

        if (assetClass == MiCAAssetClassification.AssetClass.E_MONEY_TOKEN) {
            // EMT must be redeemable at par value at any time (Article 49)
            if (record == null || !record.hasParValueRedemption()) {
                violations.add("E-money token must be redeemable at par value at any time (Article 49)");
            }
            if (record == null || !record.hasFreeRedemption()) {
                violations.add("Redemption must be free of charge (Article 49.2)");
            }
        }

        if (assetClass == MiCAAssetClassification.AssetClass.ASSET_REFERENCED_TOKEN) {
            // ART redemption rights (Article 39)
            if (record == null || !record.hasRedemptionRights()) {
                violations.add("ART must provide permanent redemption rights (Article 39)");
            }
            if (record == null || !record.hasMinimumRedemptionValue()) {
                violations.add("ART must specify minimum redemption value (Article 39.3)");
            }
            // Maximum redemption timeframe
            if (record != null && record.getRedemptionTimeframeDays() > 30) {
                violations.add("Redemption must be completed within 30 days (Article 39.4)");
            }
        }

        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());
        result.setAssetClass(assetClass);

        return result;
    }

    /**
     * Check operating conditions per MiCA Article 59
     */
    public OperatingConditionsResult checkOperatingConditions(String tokenId, IssuerInfo issuerInfo) {
        OperatingConditionsResult result = new OperatingConditionsResult();
        List<String> violations = new ArrayList<>();

        // Check authorization status (Article 59)
        if (!issuerInfo.isAuthorized()) {
            violations.add("Issuer must be authorized by competent authority (Article 59)");
        }

        // Check registered office in EU (Article 59.2)
        if (!issuerInfo.hasEURegisteredOffice()) {
            violations.add("Issuer must have registered office in EU Member State (Article 59.2)");
        }

        // Check business continuity arrangements (Article 59.3)
        if (!issuerInfo.hasBusinessContinuityPlan()) {
            violations.add("Must have robust business continuity arrangements (Article 59.3)");
        }

        // Check internal control mechanisms (Article 59.4)
        if (!issuerInfo.hasInternalControls()) {
            violations.add("Must have sound internal control mechanisms (Article 59.4)");
        }

        // Check systems and procedures for safeguarding information (Article 59.5)
        if (!issuerInfo.hasInformationSecurity()) {
            violations.add("Must have systems to safeguard information (Article 59.5)");
        }

        // Check complaint handling procedures (Article 71)
        if (!issuerInfo.hasComplaintHandling()) {
            violations.add("Must have complaint handling procedures (Article 71)");
        }

        // Check conflict of interest policy (Article 72)
        if (!issuerInfo.hasConflictOfInterestPolicy()) {
            violations.add("Must have conflict of interest policy (Article 72)");
        }

        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());
        result.setAuthorizationNumber(issuerInfo.getAuthorizationNumber());
        result.setAuthorizedDate(issuerInfo.getAuthorizedDate());

        return result;
    }

    /**
     * Check governance requirements per MiCA Articles 60-65
     */
    public GovernanceResult checkGovernanceRequirements(IssuerInfo issuerInfo) {
        GovernanceResult result = new GovernanceResult();
        List<String> violations = new ArrayList<>();

        // Check management body size (Article 60)
        if (issuerInfo.getManagementBodySize() < GOVERNANCE_MEMBER_MIN) {
            violations.add(String.format(
                "Management body must have at least %d members (Article 60)",
                GOVERNANCE_MEMBER_MIN));
        }

        // Check fit and proper requirements (Article 61)
        if (!issuerInfo.hasGoodReputeRequirements()) {
            violations.add("Members must be of good repute (Article 61.1)");
        }
        if (!issuerInfo.hasKnowledgeAndExperience()) {
            violations.add("Members must have adequate knowledge and experience (Article 61.2)");
        }

        // Check diversity requirements (Article 62)
        if (!issuerInfo.hasDiversityPolicy()) {
            violations.add("Must have gender diversity policy for management body (Article 62)");
        }

        // Check audit committee (Article 63)
        if (!issuerInfo.hasAuditCommittee()) {
            violations.add("Must have audit committee (Article 63)");
        }

        // Check risk management function (Article 64)
        if (!issuerInfo.hasRiskManagementFunction()) {
            violations.add("Must have independent risk management function (Article 64)");
        }

        // Check compliance function (Article 65)
        if (!issuerInfo.hasComplianceFunction()) {
            violations.add("Must have compliance function (Article 65)");
        }

        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());
        result.setManagementBodySize(issuerInfo.getManagementBodySize());

        return result;
    }

    /**
     * Check capital requirements per MiCA Articles 32-33
     */
    public CapitalRequirementsResult checkCapitalRequirements(IssuerInfo issuerInfo,
            MiCAAssetClassification.AssetClass assetClass) {

        CapitalRequirementsResult result = new CapitalRequirementsResult();
        List<String> violations = new ArrayList<>();

        BigDecimal requiredCapital;

        switch (assetClass) {
            case ASSET_REFERENCED_TOKEN:
                requiredCapital = MIN_OWN_FUNDS_ART;
                // Higher of 350,000 EUR or 2% of average reserve
                BigDecimal percentReserve = issuerInfo.getAverageReserveValue()
                    .multiply(BigDecimal.valueOf(0.02));
                if (percentReserve.compareTo(requiredCapital) > 0) {
                    requiredCapital = percentReserve;
                }
                break;
            case E_MONEY_TOKEN:
                requiredCapital = MIN_OWN_FUNDS_EMT;
                break;
            default:
                requiredCapital = BigDecimal.ZERO;
        }

        result.setRequiredCapital(requiredCapital);
        result.setActualCapital(issuerInfo.getOwnFunds());

        if (issuerInfo.getOwnFunds().compareTo(requiredCapital) < 0) {
            violations.add(String.format(
                "Own funds %.2f EUR below required %.2f EUR (Article 32)",
                issuerInfo.getOwnFunds().doubleValue(),
                requiredCapital.doubleValue()));
        }

        // Check capital quality (Article 33)
        if (!issuerInfo.hasQualifyingCapital()) {
            violations.add("Capital must meet quality requirements (Article 33)");
        }

        // Check insurance requirements (Article 34)
        if (!issuerInfo.hasProfessionalLiabilityInsurance()) {
            violations.add("Must have professional liability insurance (Article 34)");
        }

        result.setViolations(violations);
        result.setCompliant(violations.isEmpty());

        return result;
    }

    /**
     * Register whitepaper for a token
     */
    public void registerWhitepaper(String tokenId, WhitepaperRecord whitepaper) {
        Log.infof("Registering whitepaper for token: %s", tokenId);
        whitepaperRegistry.put(tokenId, whitepaper);

        auditTrail.add(new ComplianceAuditEntry(
            "WHITEPAPER_REGISTERED",
            tokenId,
            "REGISTERED",
            "Whitepaper registered with publication date: " + whitepaper.getPublicationDate(),
            Instant.now()
        ));
    }

    /**
     * Register reserve record for a token
     */
    public void registerReserve(String tokenId, ReserveRecord reserve) {
        Log.infof("Registering reserve record for token: %s", tokenId);
        reserveRecords.put(tokenId, reserve);

        auditTrail.add(new ComplianceAuditEntry(
            "RESERVE_REGISTERED",
            tokenId,
            "REGISTERED",
            String.format("Reserve registered with ratio: %.2f%%, value: %.2f EUR",
                reserve.getReserveRatio().doubleValue(),
                reserve.getCirculatingValue().doubleValue()),
            Instant.now()
        ));
    }

    /**
     * Get compliance record for a token
     */
    public Optional<MiCAComplianceRecord> getComplianceRecord(String tokenId) {
        return Optional.ofNullable(complianceRecords.get(tokenId));
    }

    /**
     * Get all compliance records
     */
    public List<MiCAComplianceRecord> getAllComplianceRecords() {
        return new ArrayList<>(complianceRecords.values());
    }

    /**
     * Get compliance statistics
     */
    public MiCAComplianceStats getStats() {
        MiCAComplianceStats stats = new MiCAComplianceStats();

        long totalRecords = complianceRecords.size();
        long compliantRecords = complianceRecords.values().stream()
            .filter(r -> r.getResult().isCompliant())
            .count();

        stats.setTotalTokens(totalRecords);
        stats.setCompliantTokens(compliantRecords);
        stats.setNonCompliantTokens(totalRecords - compliantRecords);

        if (totalRecords > 0) {
            stats.setComplianceRate(compliantRecords * 100.0 / totalRecords);
        }

        // Count by asset class
        Map<MiCAAssetClassification.AssetClass, Long> byClass = new HashMap<>();
        for (MiCAComplianceRecord record : complianceRecords.values()) {
            MiCAAssetClassification.AssetClass assetClass =
                record.getResult().getAssetClass();
            byClass.merge(assetClass, 1L, Long::sum);
        }
        stats.setByAssetClass(byClass);

        stats.setTotalWhitepapers(whitepaperRegistry.size());
        stats.setTotalReserveRecords(reserveRecords.size());
        stats.setAuditTrailSize(auditTrail.size());

        return stats;
    }

    /**
     * Get audit trail entries
     */
    public List<ComplianceAuditEntry> getAuditTrail() {
        return new ArrayList<>(auditTrail);
    }

    /**
     * Get audit trail entries for specific token
     */
    public List<ComplianceAuditEntry> getAuditTrail(String tokenId) {
        return auditTrail.stream()
            .filter(e -> tokenId.equals(e.getTokenId()))
            .toList();
    }

    // ============ Inner Classes ============

    public static class MiCAComplianceRecord {
        private final String tokenId;
        private final ComplianceCheckResult result;
        private final Instant createdAt;
        private boolean hasParValueRedemption;
        private boolean hasFreeRedemption;
        private boolean hasRedemptionRights;
        private boolean hasMinimumRedemptionValue;
        private int redemptionTimeframeDays = 30;

        public MiCAComplianceRecord(String tokenId, ComplianceCheckResult result) {
            this.tokenId = tokenId;
            this.result = result;
            this.createdAt = Instant.now();
        }

        public String getTokenId() { return tokenId; }
        public ComplianceCheckResult getResult() { return result; }
        public Instant getCreatedAt() { return createdAt; }
        public boolean hasParValueRedemption() { return hasParValueRedemption; }
        public void setHasParValueRedemption(boolean has) { this.hasParValueRedemption = has; }
        public boolean hasFreeRedemption() { return hasFreeRedemption; }
        public void setHasFreeRedemption(boolean has) { this.hasFreeRedemption = has; }
        public boolean hasRedemptionRights() { return hasRedemptionRights; }
        public void setHasRedemptionRights(boolean has) { this.hasRedemptionRights = has; }
        public boolean hasMinimumRedemptionValue() { return hasMinimumRedemptionValue; }
        public void setHasMinimumRedemptionValue(boolean has) { this.hasMinimumRedemptionValue = has; }
        public int getRedemptionTimeframeDays() { return redemptionTimeframeDays; }
        public void setRedemptionTimeframeDays(int days) { this.redemptionTimeframeDays = days; }
    }

    public static class ComplianceCheckResult {
        private final String tokenId;
        private Instant checkTimestamp;
        private MiCAAssetClassification.AssetClass assetClass;
        private WhitepaperComplianceResult whitepaperCompliance;
        private ReserveComplianceResult reserveCompliance;
        private RedemptionRightsResult redemptionRights;
        private OperatingConditionsResult operatingConditions;
        private GovernanceResult governanceCompliance;
        private CapitalRequirementsResult capitalRequirements;
        private boolean compliant;
        private double complianceScore;
        private List<String> allViolations = new ArrayList<>();

        public ComplianceCheckResult(String tokenId) {
            this.tokenId = tokenId;
        }

        public void calculateOverallCompliance() {
            List<Boolean> checks = new ArrayList<>();

            if (whitepaperCompliance != null) {
                checks.add(whitepaperCompliance.isCompliant());
                allViolations.addAll(whitepaperCompliance.getViolations());
            }
            if (reserveCompliance != null) {
                checks.add(reserveCompliance.isCompliant());
                allViolations.addAll(reserveCompliance.getViolations());
            }
            if (redemptionRights != null) {
                checks.add(redemptionRights.isCompliant());
                allViolations.addAll(redemptionRights.getViolations());
            }
            if (operatingConditions != null) {
                checks.add(operatingConditions.isCompliant());
                allViolations.addAll(operatingConditions.getViolations());
            }
            if (governanceCompliance != null) {
                checks.add(governanceCompliance.isCompliant());
                allViolations.addAll(governanceCompliance.getViolations());
            }
            if (capitalRequirements != null) {
                checks.add(capitalRequirements.isCompliant());
                allViolations.addAll(capitalRequirements.getViolations());
            }

            long passedChecks = checks.stream().filter(b -> b).count();
            this.complianceScore = checks.isEmpty() ? 0.0 : (passedChecks * 100.0 / checks.size());
            this.compliant = allViolations.isEmpty();
        }

        // Getters and setters
        public String getTokenId() { return tokenId; }
        public Instant getCheckTimestamp() { return checkTimestamp; }
        public void setCheckTimestamp(Instant checkTimestamp) { this.checkTimestamp = checkTimestamp; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass assetClass) { this.assetClass = assetClass; }
        public WhitepaperComplianceResult getWhitepaperCompliance() { return whitepaperCompliance; }
        public void setWhitepaperCompliance(WhitepaperComplianceResult r) { this.whitepaperCompliance = r; }
        public ReserveComplianceResult getReserveCompliance() { return reserveCompliance; }
        public void setReserveCompliance(ReserveComplianceResult r) { this.reserveCompliance = r; }
        public RedemptionRightsResult getRedemptionRights() { return redemptionRights; }
        public void setRedemptionRights(RedemptionRightsResult r) { this.redemptionRights = r; }
        public OperatingConditionsResult getOperatingConditions() { return operatingConditions; }
        public void setOperatingConditions(OperatingConditionsResult r) { this.operatingConditions = r; }
        public GovernanceResult getGovernanceCompliance() { return governanceCompliance; }
        public void setGovernanceCompliance(GovernanceResult r) { this.governanceCompliance = r; }
        public CapitalRequirementsResult getCapitalRequirements() { return capitalRequirements; }
        public void setCapitalRequirements(CapitalRequirementsResult r) { this.capitalRequirements = r; }
        public boolean isCompliant() { return compliant; }
        public double getComplianceScore() { return complianceScore; }
        public List<String> getAllViolations() { return allViolations; }
    }

    public static class WhitepaperComplianceResult {
        private boolean compliant;
        private List<String> requirements = new ArrayList<>();
        private List<String> violations = new ArrayList<>();
        private LocalDate publicationDate;
        private Instant lastUpdated;

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public List<String> getRequirements() { return requirements; }
        public void setRequirements(List<String> requirements) { this.requirements = requirements; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
        public LocalDate getPublicationDate() { return publicationDate; }
        public void setPublicationDate(LocalDate publicationDate) { this.publicationDate = publicationDate; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    }

    public static class ReserveComplianceResult {
        private boolean compliant;
        private boolean significantToken;
        private BigDecimal reserveRatio;
        private BigDecimal circulatingValue;
        private LocalDate lastAuditDate;
        private List<String> violations = new ArrayList<>();

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public boolean isSignificantToken() { return significantToken; }
        public void setSignificantToken(boolean significant) { this.significantToken = significant; }
        public BigDecimal getReserveRatio() { return reserveRatio; }
        public void setReserveRatio(BigDecimal ratio) { this.reserveRatio = ratio; }
        public BigDecimal getCirculatingValue() { return circulatingValue; }
        public void setCirculatingValue(BigDecimal value) { this.circulatingValue = value; }
        public LocalDate getLastAuditDate() { return lastAuditDate; }
        public void setLastAuditDate(LocalDate date) { this.lastAuditDate = date; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
    }

    public static class RedemptionRightsResult {
        private boolean compliant;
        private MiCAAssetClassification.AssetClass assetClass;
        private List<String> violations = new ArrayList<>();

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass ac) { this.assetClass = ac; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
    }

    public static class OperatingConditionsResult {
        private boolean compliant;
        private String authorizationNumber;
        private LocalDate authorizedDate;
        private List<String> violations = new ArrayList<>();

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public String getAuthorizationNumber() { return authorizationNumber; }
        public void setAuthorizationNumber(String num) { this.authorizationNumber = num; }
        public LocalDate getAuthorizedDate() { return authorizedDate; }
        public void setAuthorizedDate(LocalDate date) { this.authorizedDate = date; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
    }

    public static class GovernanceResult {
        private boolean compliant;
        private int managementBodySize;
        private List<String> violations = new ArrayList<>();

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public int getManagementBodySize() { return managementBodySize; }
        public void setManagementBodySize(int size) { this.managementBodySize = size; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
    }

    public static class CapitalRequirementsResult {
        private boolean compliant;
        private BigDecimal requiredCapital;
        private BigDecimal actualCapital;
        private List<String> violations = new ArrayList<>();

        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public BigDecimal getRequiredCapital() { return requiredCapital; }
        public void setRequiredCapital(BigDecimal cap) { this.requiredCapital = cap; }
        public BigDecimal getActualCapital() { return actualCapital; }
        public void setActualCapital(BigDecimal cap) { this.actualCapital = cap; }
        public List<String> getViolations() { return violations; }
        public void setViolations(List<String> violations) { this.violations = violations; }
        public void addViolation(String violation) { this.violations.add(violation); }
    }

    public static class MiCAComplianceStats {
        private long totalTokens;
        private long compliantTokens;
        private long nonCompliantTokens;
        private double complianceRate;
        private Map<MiCAAssetClassification.AssetClass, Long> byAssetClass = new HashMap<>();
        private long totalWhitepapers;
        private long totalReserveRecords;
        private long auditTrailSize;

        public long getTotalTokens() { return totalTokens; }
        public void setTotalTokens(long total) { this.totalTokens = total; }
        public long getCompliantTokens() { return compliantTokens; }
        public void setCompliantTokens(long count) { this.compliantTokens = count; }
        public long getNonCompliantTokens() { return nonCompliantTokens; }
        public void setNonCompliantTokens(long count) { this.nonCompliantTokens = count; }
        public double getComplianceRate() { return complianceRate; }
        public void setComplianceRate(double rate) { this.complianceRate = rate; }
        public Map<MiCAAssetClassification.AssetClass, Long> getByAssetClass() { return byAssetClass; }
        public void setByAssetClass(Map<MiCAAssetClassification.AssetClass, Long> map) { this.byAssetClass = map; }
        public long getTotalWhitepapers() { return totalWhitepapers; }
        public void setTotalWhitepapers(long count) { this.totalWhitepapers = count; }
        public long getTotalReserveRecords() { return totalReserveRecords; }
        public void setTotalReserveRecords(long count) { this.totalReserveRecords = count; }
        public long getAuditTrailSize() { return auditTrailSize; }
        public void setAuditTrailSize(long size) { this.auditTrailSize = size; }
    }

    public static class ComplianceAuditEntry {
        private final String eventType;
        private final String tokenId;
        private final String status;
        private final String details;
        private final Instant timestamp;

        public ComplianceAuditEntry(String eventType, String tokenId, String status,
                String details, Instant timestamp) {
            this.eventType = eventType;
            this.tokenId = tokenId;
            this.status = status;
            this.details = details;
            this.timestamp = timestamp;
        }

        public String getEventType() { return eventType; }
        public String getTokenId() { return tokenId; }
        public String getStatus() { return status; }
        public String getDetails() { return details; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class WhitepaperRecord {
        private LocalDate publicationDate;
        private Instant lastUpdated;
        private boolean hasIssuerInfo;
        private boolean hasProjectDescription;
        private boolean hasRightsAndObligations;
        private boolean hasTechnologyDescription;
        private boolean hasRiskDisclosure;
        private boolean hasOfferInfo;
        private boolean hasReserveAssetComposition;
        private boolean hasCustodyArrangements;
        private boolean hasEMoneyAuthorization;
        private boolean hasRedemptionConditions;

        // Getters and setters
        public LocalDate getPublicationDate() { return publicationDate; }
        public void setPublicationDate(LocalDate date) { this.publicationDate = date; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant updated) { this.lastUpdated = updated; }
        public boolean hasIssuerInfo() { return hasIssuerInfo; }
        public void setHasIssuerInfo(boolean has) { this.hasIssuerInfo = has; }
        public boolean hasProjectDescription() { return hasProjectDescription; }
        public void setHasProjectDescription(boolean has) { this.hasProjectDescription = has; }
        public boolean hasRightsAndObligations() { return hasRightsAndObligations; }
        public void setHasRightsAndObligations(boolean has) { this.hasRightsAndObligations = has; }
        public boolean hasTechnologyDescription() { return hasTechnologyDescription; }
        public void setHasTechnologyDescription(boolean has) { this.hasTechnologyDescription = has; }
        public boolean hasRiskDisclosure() { return hasRiskDisclosure; }
        public void setHasRiskDisclosure(boolean has) { this.hasRiskDisclosure = has; }
        public boolean hasOfferInfo() { return hasOfferInfo; }
        public void setHasOfferInfo(boolean has) { this.hasOfferInfo = has; }
        public boolean hasReserveAssetComposition() { return hasReserveAssetComposition; }
        public void setHasReserveAssetComposition(boolean has) { this.hasReserveAssetComposition = has; }
        public boolean hasCustodyArrangements() { return hasCustodyArrangements; }
        public void setHasCustodyArrangements(boolean has) { this.hasCustodyArrangements = has; }
        public boolean hasEMoneyAuthorization() { return hasEMoneyAuthorization; }
        public void setHasEMoneyAuthorization(boolean has) { this.hasEMoneyAuthorization = has; }
        public boolean hasRedemptionConditions() { return hasRedemptionConditions; }
        public void setHasRedemptionConditions(boolean has) { this.hasRedemptionConditions = has; }
    }

    public static class ReserveRecord {
        private BigDecimal reserveRatio = BigDecimal.valueOf(100);
        private BigDecimal circulatingValue = BigDecimal.ZERO;
        private LocalDate lastAuditDate;
        private boolean hasQualifiedAssets;
        private boolean hasCustodialArrangement;
        private boolean isSegregated;
        private boolean hasQuarterlyDisclosure;
        private boolean hasEnhancedLiquidity;
        private boolean hasRecoveryPlan;

        // Getters and setters
        public BigDecimal getReserveRatio() { return reserveRatio; }
        public void setReserveRatio(BigDecimal ratio) { this.reserveRatio = ratio; }
        public BigDecimal getCirculatingValue() { return circulatingValue; }
        public void setCirculatingValue(BigDecimal value) { this.circulatingValue = value; }
        public LocalDate getLastAuditDate() { return lastAuditDate; }
        public void setLastAuditDate(LocalDate date) { this.lastAuditDate = date; }
        public boolean hasQualifiedAssets() { return hasQualifiedAssets; }
        public void setHasQualifiedAssets(boolean has) { this.hasQualifiedAssets = has; }
        public boolean hasCustodialArrangement() { return hasCustodialArrangement; }
        public void setHasCustodialArrangement(boolean has) { this.hasCustodialArrangement = has; }
        public boolean isSegregated() { return isSegregated; }
        public void setIsSegregated(boolean segregated) { this.isSegregated = segregated; }
        public boolean hasQuarterlyDisclosure() { return hasQuarterlyDisclosure; }
        public void setHasQuarterlyDisclosure(boolean has) { this.hasQuarterlyDisclosure = has; }
        public boolean hasEnhancedLiquidity() { return hasEnhancedLiquidity; }
        public void setHasEnhancedLiquidity(boolean has) { this.hasEnhancedLiquidity = has; }
        public boolean hasRecoveryPlan() { return hasRecoveryPlan; }
        public void setHasRecoveryPlan(boolean has) { this.hasRecoveryPlan = has; }
    }

    public static class IssuerInfo {
        private String issuerId;
        private String issuerName;
        private boolean authorized;
        private String authorizationNumber;
        private LocalDate authorizedDate;
        private boolean hasEURegisteredOffice;
        private boolean hasBusinessContinuityPlan;
        private boolean hasInternalControls;
        private boolean hasInformationSecurity;
        private boolean hasComplaintHandling;
        private boolean hasConflictOfInterestPolicy;
        private int managementBodySize;
        private boolean hasGoodReputeRequirements;
        private boolean hasKnowledgeAndExperience;
        private boolean hasDiversityPolicy;
        private boolean hasAuditCommittee;
        private boolean hasRiskManagementFunction;
        private boolean hasComplianceFunction;
        private BigDecimal ownFunds = BigDecimal.ZERO;
        private BigDecimal averageReserveValue = BigDecimal.ZERO;
        private boolean hasQualifyingCapital;
        private boolean hasProfessionalLiabilityInsurance;
        private String tokenName;
        private String tokenSymbol;
        private String tokenType;
        private boolean hasReferencedAssets;
        private boolean isFiatCurrencyReferenced;
        private String referencedFiatCurrency;
        private boolean isEMoneyInstitution;
        private boolean offerToPublic;
        private boolean tradingRequested;

        // Getters and setters
        public String getIssuerId() { return issuerId; }
        public void setIssuerId(String id) { this.issuerId = id; }
        public String getIssuerName() { return issuerName; }
        public void setIssuerName(String name) { this.issuerName = name; }
        public boolean isAuthorized() { return authorized; }
        public void setAuthorized(boolean auth) { this.authorized = auth; }
        public String getAuthorizationNumber() { return authorizationNumber; }
        public void setAuthorizationNumber(String num) { this.authorizationNumber = num; }
        public LocalDate getAuthorizedDate() { return authorizedDate; }
        public void setAuthorizedDate(LocalDate date) { this.authorizedDate = date; }
        public boolean hasEURegisteredOffice() { return hasEURegisteredOffice; }
        public void setHasEURegisteredOffice(boolean has) { this.hasEURegisteredOffice = has; }
        public boolean hasBusinessContinuityPlan() { return hasBusinessContinuityPlan; }
        public void setHasBusinessContinuityPlan(boolean has) { this.hasBusinessContinuityPlan = has; }
        public boolean hasInternalControls() { return hasInternalControls; }
        public void setHasInternalControls(boolean has) { this.hasInternalControls = has; }
        public boolean hasInformationSecurity() { return hasInformationSecurity; }
        public void setHasInformationSecurity(boolean has) { this.hasInformationSecurity = has; }
        public boolean hasComplaintHandling() { return hasComplaintHandling; }
        public void setHasComplaintHandling(boolean has) { this.hasComplaintHandling = has; }
        public boolean hasConflictOfInterestPolicy() { return hasConflictOfInterestPolicy; }
        public void setHasConflictOfInterestPolicy(boolean has) { this.hasConflictOfInterestPolicy = has; }
        public int getManagementBodySize() { return managementBodySize; }
        public void setManagementBodySize(int size) { this.managementBodySize = size; }
        public boolean hasGoodReputeRequirements() { return hasGoodReputeRequirements; }
        public void setHasGoodReputeRequirements(boolean has) { this.hasGoodReputeRequirements = has; }
        public boolean hasKnowledgeAndExperience() { return hasKnowledgeAndExperience; }
        public void setHasKnowledgeAndExperience(boolean has) { this.hasKnowledgeAndExperience = has; }
        public boolean hasDiversityPolicy() { return hasDiversityPolicy; }
        public void setHasDiversityPolicy(boolean has) { this.hasDiversityPolicy = has; }
        public boolean hasAuditCommittee() { return hasAuditCommittee; }
        public void setHasAuditCommittee(boolean has) { this.hasAuditCommittee = has; }
        public boolean hasRiskManagementFunction() { return hasRiskManagementFunction; }
        public void setHasRiskManagementFunction(boolean has) { this.hasRiskManagementFunction = has; }
        public boolean hasComplianceFunction() { return hasComplianceFunction; }
        public void setHasComplianceFunction(boolean has) { this.hasComplianceFunction = has; }
        public BigDecimal getOwnFunds() { return ownFunds; }
        public void setOwnFunds(BigDecimal funds) { this.ownFunds = funds; }
        public BigDecimal getAverageReserveValue() { return averageReserveValue; }
        public void setAverageReserveValue(BigDecimal value) { this.averageReserveValue = value; }
        public boolean hasQualifyingCapital() { return hasQualifyingCapital; }
        public void setHasQualifyingCapital(boolean has) { this.hasQualifyingCapital = has; }
        public boolean hasProfessionalLiabilityInsurance() { return hasProfessionalLiabilityInsurance; }
        public void setHasProfessionalLiabilityInsurance(boolean has) { this.hasProfessionalLiabilityInsurance = has; }
        public String getTokenName() { return tokenName; }
        public void setTokenName(String name) { this.tokenName = name; }
        public String getTokenSymbol() { return tokenSymbol; }
        public void setTokenSymbol(String symbol) { this.tokenSymbol = symbol; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String type) { this.tokenType = type; }
        public boolean hasReferencedAssets() { return hasReferencedAssets; }
        public void setHasReferencedAssets(boolean has) { this.hasReferencedAssets = has; }
        public boolean isFiatCurrencyReferenced() { return isFiatCurrencyReferenced; }
        public void setFiatCurrencyReferenced(boolean fiat) { this.isFiatCurrencyReferenced = fiat; }
        public String getReferencedFiatCurrency() { return referencedFiatCurrency; }
        public void setReferencedFiatCurrency(String currency) { this.referencedFiatCurrency = currency; }
        public boolean isEMoneyInstitution() { return isEMoneyInstitution; }
        public void setEMoneyInstitution(boolean eMoney) { this.isEMoneyInstitution = eMoney; }
        public boolean isOfferToPublic() { return offerToPublic; }
        public void setOfferToPublic(boolean offer) { this.offerToPublic = offer; }
        public boolean isTradingRequested() { return tradingRequested; }
        public void setTradingRequested(boolean trading) { this.tradingRequested = trading; }
    }
}
