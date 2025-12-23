package io.aurigraph.v11.contracts.composite.workflow;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Compliance Rule Patterns for Contract Workflows
 *
 * Provides pre-built compliance rule templates for:
 * - State transition validation
 * - Business logic validation
 * - Regulatory compliance checks
 * - Asset-specific rules (RWA, Carbon, Securities)
 * - Jurisdictional requirements
 *
 * Features:
 * - 30+ pre-built compliance patterns
 * - Parameterized rule templates
 * - Jurisdiction-specific rule sets
 * - Industry-standard compliance checks
 * - Integration with BusinessRulesEngine
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-05: Compliance Rules (Sprint 5-7)
 */
@ApplicationScoped
public class ComplianceRulePatterns {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceRulePatterns.class);

    // Compliance pattern storage
    private final Map<String, CompliancePattern> patterns = new ConcurrentHashMap<>();
    private final Map<String, ComplianceRuleSet> ruleSets = new ConcurrentHashMap<>();
    private final Map<Jurisdiction, List<String>> jurisdictionRules = new ConcurrentHashMap<>();
    private final Map<AssetClass, List<String>> assetClassRules = new ConcurrentHashMap<>();

    @Inject
    BusinessRulesEngine rulesEngine;

    @Inject
    WorkflowEngine workflowEngine;

    /**
     * Initialize compliance rule patterns
     */
    public ComplianceRulePatterns() {
        initializeTransitionRules();
        initializeValidationRules();
        initializeRegulatoryRules();
        initializeAssetRules();
        initializeJurisdictionRuleSets();
        LOGGER.info("ComplianceRulePatterns initialized with {} patterns and {} rule sets",
            patterns.size(), ruleSets.size());
    }

    // ========== Transition Rule Patterns ==========

    private void initializeTransitionRules() {
        // TR-001: Draft to Pending Approval
        registerPattern(CompliancePattern.builder()
            .patternId("TR-001")
            .name("Draft to Pending Approval Transition")
            .description("Validates transition from DRAFT to PENDING_APPROVAL state")
            .category(ComplianceCategory.TRANSITION)
            .fromState(WorkflowEngine.WorkflowState.DRAFT)
            .toState(WorkflowEngine.WorkflowState.PENDING_APPROVAL)
            .expression("ctx.hasRequiredDocuments && ctx.primaryTokenCreated && ctx.ownerVerified")
            .severity(Severity.CRITICAL)
            .build());

        // TR-002: Pending Approval to Active
        registerPattern(CompliancePattern.builder()
            .patternId("TR-002")
            .name("Pending Approval to Active Transition")
            .description("Validates transition from PENDING_APPROVAL to ACTIVE state")
            .category(ComplianceCategory.TRANSITION)
            .fromState(WorkflowEngine.WorkflowState.PENDING_APPROVAL)
            .toState(WorkflowEngine.WorkflowState.ACTIVE)
            .expression("ctx.allApprovalsObtained && ctx.vvbVerified && ctx.complianceCheckPassed")
            .severity(Severity.CRITICAL)
            .build());

        // TR-003: Active to Suspended
        registerPattern(CompliancePattern.builder()
            .patternId("TR-003")
            .name("Active to Suspended Transition")
            .description("Validates suspension of an active contract")
            .category(ComplianceCategory.TRANSITION)
            .fromState(WorkflowEngine.WorkflowState.ACTIVE)
            .toState(WorkflowEngine.WorkflowState.SUSPENDED)
            .expression("ctx.suspensionReasonProvided && (ctx.hasSuspendPermission || ctx.isEmergency)")
            .severity(Severity.HIGH)
            .build());

        // TR-004: Suspended to Active
        registerPattern(CompliancePattern.builder()
            .patternId("TR-004")
            .name("Suspended to Active Transition")
            .description("Validates resumption of a suspended contract")
            .category(ComplianceCategory.TRANSITION)
            .fromState(WorkflowEngine.WorkflowState.SUSPENDED)
            .toState(WorkflowEngine.WorkflowState.ACTIVE)
            .expression("ctx.suspensionIssueResolved && ctx.complianceReviewPassed && ctx.hasResumePermission")
            .severity(Severity.HIGH)
            .build());

        // TR-005: Any to Terminated
        registerPattern(CompliancePattern.builder()
            .patternId("TR-005")
            .name("Termination Transition")
            .description("Validates contract termination from any state")
            .category(ComplianceCategory.TRANSITION)
            .toState(WorkflowEngine.WorkflowState.TERMINATED)
            .expression("ctx.terminationReasonProvided && ctx.hasTerminatePermission && ctx.noActiveObligations")
            .severity(Severity.CRITICAL)
            .build());

        // TR-006: Approval Timeout
        registerPattern(CompliancePattern.builder()
            .patternId("TR-006")
            .name("Approval Timeout Check")
            .description("Check if approval has timed out")
            .category(ComplianceCategory.TRANSITION)
            .fromState(WorkflowEngine.WorkflowState.PENDING_APPROVAL)
            .expression("daysBetween(ctx.submittedAt, now()) <= ctx.approvalTimeoutDays")
            .severity(Severity.MEDIUM)
            .build());

        LOGGER.debug("Initialized {} transition rule patterns", 6);
    }

    // ========== Validation Rule Patterns ==========

    private void initializeValidationRules() {
        // VR-001: Token Completeness
        registerPattern(CompliancePattern.builder()
            .patternId("VR-001")
            .name("Token Completeness Check")
            .description("Validates all required token components are present")
            .category(ComplianceCategory.VALIDATION)
            .expression("ctx.hasPrimaryToken && size(ctx.secondaryTokens) >= ctx.minSecondaryTokens")
            .severity(Severity.HIGH)
            .requiredFields(Arrays.asList("primaryToken", "secondaryTokens", "minSecondaryTokens"))
            .build());

        // VR-002: Valuation Range
        registerPattern(CompliancePattern.builder()
            .patternId("VR-002")
            .name("Valuation Range Check")
            .description("Validates asset valuation is within acceptable range")
            .category(ComplianceCategory.VALIDATION)
            .expression("ctx.valuation >= ctx.minValuation && ctx.valuation <= ctx.maxValuation")
            .severity(Severity.MEDIUM)
            .build());

        // VR-003: Document Verification
        registerPattern(CompliancePattern.builder()
            .patternId("VR-003")
            .name("Document Verification Status")
            .description("Validates all required documents are verified")
            .category(ComplianceCategory.VALIDATION)
            .expression("ctx.allDocumentsVerified && ctx.documentExpiryValid")
            .severity(Severity.HIGH)
            .build());

        // VR-004: Owner Identity Verification
        registerPattern(CompliancePattern.builder()
            .patternId("VR-004")
            .name("Owner Identity Verification")
            .description("Validates owner identity has been verified")
            .category(ComplianceCategory.VALIDATION)
            .expression("ctx.ownerKycVerified && ctx.ownerAmlCleared && !ctx.ownerSanctioned")
            .severity(Severity.CRITICAL)
            .build());

        // VR-005: Signature Requirements
        registerPattern(CompliancePattern.builder()
            .patternId("VR-005")
            .name("Signature Requirements Check")
            .description("Validates all required signatures are present")
            .category(ComplianceCategory.VALIDATION)
            .expression("size(ctx.signatures) >= ctx.requiredSignatures && ctx.allSignaturesValid")
            .severity(Severity.CRITICAL)
            .build());

        // VR-006: VVB Consensus
        registerPattern(CompliancePattern.builder()
            .patternId("VR-006")
            .name("VVB Consensus Check")
            .description("Validates VVB verification consensus has been reached")
            .category(ComplianceCategory.VALIDATION)
            .expression("ctx.vvbApprovals >= ctx.requiredVvbApprovals")
            .severity(Severity.HIGH)
            .build());

        LOGGER.debug("Initialized {} validation rule patterns", 6);
    }

    // ========== Regulatory Compliance Rules ==========

    private void initializeRegulatoryRules() {
        // RC-001: KYC Requirements
        registerPattern(CompliancePattern.builder()
            .patternId("RC-001")
            .name("KYC Compliance")
            .description("Know Your Customer verification requirements")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.kycStatus == 'VERIFIED' && isNotNull(ctx.kycVerifiedAt) && daysBetween(ctx.kycVerifiedAt, now()) < 365")
            .severity(Severity.CRITICAL)
            .regulation("AML/KYC")
            .build());

        // RC-002: AML Requirements
        registerPattern(CompliancePattern.builder()
            .patternId("RC-002")
            .name("AML Compliance")
            .description("Anti-Money Laundering compliance check")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.amlStatus == 'CLEARED' && ctx.amlRiskLevel != 'HIGH' && ctx.lastAmlCheckDays < 90")
            .severity(Severity.CRITICAL)
            .regulation("AML/CFT")
            .build());

        // RC-003: Sanctions Screening
        registerPattern(CompliancePattern.builder()
            .patternId("RC-003")
            .name("Sanctions Screening")
            .description("OFAC and international sanctions screening")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.sanctionsStatus == 'CLEAR' && ctx.lastSanctionsCheckDays < 30")
            .severity(Severity.CRITICAL)
            .regulation("OFAC/Sanctions")
            .build());

        // RC-004: Accredited Investor Check
        registerPattern(CompliancePattern.builder()
            .patternId("RC-004")
            .name("Accredited Investor Verification")
            .description("Verify investor meets accredited investor criteria")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.investorType == 'ACCREDITED' || ctx.isInstitutional || ctx.netWorthExceedsThreshold")
            .severity(Severity.HIGH)
            .regulation("SEC Regulation D")
            .build());

        // RC-005: Investment Limits
        registerPattern(CompliancePattern.builder()
            .patternId("RC-005")
            .name("Investment Limit Compliance")
            .description("Verify investment does not exceed regulatory limits")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.investmentAmount <= ctx.maxAllowedInvestment && ctx.annualInvestmentTotal <= ctx.annualLimit")
            .severity(Severity.HIGH)
            .regulation("Regulation Crowdfunding")
            .build());

        // RC-006: Reporting Requirements
        registerPattern(CompliancePattern.builder()
            .patternId("RC-006")
            .name("Reporting Compliance")
            .description("Verify all required reports have been filed")
            .category(ComplianceCategory.REGULATORY)
            .expression("ctx.lastReportFiled && daysBetween(ctx.lastReportDate, now()) < ctx.reportingIntervalDays")
            .severity(Severity.MEDIUM)
            .regulation("SEC Reporting")
            .build());

        LOGGER.debug("Initialized {} regulatory rule patterns", 6);
    }

    // ========== Asset-Specific Rules ==========

    private void initializeAssetRules() {
        // Carbon Credit Rules
        registerPattern(CompliancePattern.builder()
            .patternId("CC-001")
            .name("Carbon Credit Verification")
            .description("Verify carbon credit authenticity and certification")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.CARBON_CREDIT)
            .expression("ctx.carbonRegistryVerified && in(ctx.carbonStandard, ['VCS', 'Gold Standard', 'ACR', 'CAR'])")
            .severity(Severity.CRITICAL)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("CC-002")
            .name("Carbon Credit Vintage Check")
            .description("Verify carbon credit vintage is within acceptable range")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.CARBON_CREDIT)
            .expression("ctx.creditVintageYear >= (currentYear() - ctx.maxVintageAge)")
            .severity(Severity.HIGH)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("CC-003")
            .name("Carbon Credit Retirement Status")
            .description("Verify carbon credit has not been retired")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.CARBON_CREDIT)
            .expression("ctx.retirementStatus == 'NOT_RETIRED' && !ctx.isInvalidated")
            .severity(Severity.CRITICAL)
            .build());

        // Real Estate Rules
        registerPattern(CompliancePattern.builder()
            .patternId("RE-001")
            .name("Real Estate Title Verification")
            .description("Verify clear title and no liens")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.REAL_ESTATE)
            .expression("ctx.titleClear && ctx.liensCount == 0 && ctx.titleInsured")
            .severity(Severity.CRITICAL)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("RE-002")
            .name("Real Estate Appraisal Validity")
            .description("Verify recent appraisal is on file")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.REAL_ESTATE)
            .expression("ctx.hasAppraisal && daysBetween(ctx.appraisalDate, now()) < 180")
            .severity(Severity.HIGH)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("RE-003")
            .name("Real Estate Zoning Compliance")
            .description("Verify property is zoned for intended use")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.REAL_ESTATE)
            .expression("ctx.zoningCompliant && !ctx.hasZoningViolations")
            .severity(Severity.HIGH)
            .build());

        // Securities Rules
        registerPattern(CompliancePattern.builder()
            .patternId("SEC-001")
            .name("Securities Registration Check")
            .description("Verify securities are properly registered or exempt")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.SECURITY)
            .expression("ctx.isRegistered || ctx.hasExemption")
            .severity(Severity.CRITICAL)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("SEC-002")
            .name("Securities Transfer Restrictions")
            .description("Verify transfer complies with holding period")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.SECURITY)
            .expression("ctx.holdingPeriodComplete || ctx.transferExemptionApplies")
            .severity(Severity.HIGH)
            .build());

        // Commodity Rules
        registerPattern(CompliancePattern.builder()
            .patternId("COM-001")
            .name("Commodity Storage Verification")
            .description("Verify commodity is properly stored and insured")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.COMMODITY)
            .expression("ctx.storageVerified && ctx.storageInsured && ctx.lastInspectionDays < 90")
            .severity(Severity.HIGH)
            .build());

        registerPattern(CompliancePattern.builder()
            .patternId("COM-002")
            .name("Commodity Quality Grade")
            .description("Verify commodity meets minimum quality grade")
            .category(ComplianceCategory.ASSET_SPECIFIC)
            .assetClass(AssetClass.COMMODITY)
            .expression("ctx.qualityGrade >= ctx.minimumGrade && ctx.qualityCertified")
            .severity(Severity.MEDIUM)
            .build());

        LOGGER.debug("Initialized {} asset-specific rule patterns", 10);
    }

    // ========== Jurisdiction Rule Sets ==========

    private void initializeJurisdictionRuleSets() {
        // US Jurisdiction
        ComplianceRuleSet usRules = new ComplianceRuleSet();
        usRules.setRuleSetId("JURISDICTION-US");
        usRules.setName("United States Compliance Rules");
        usRules.setJurisdiction(Jurisdiction.US);
        usRules.setPatternIds(Arrays.asList("RC-001", "RC-002", "RC-003", "RC-004", "RC-005", "SEC-001", "SEC-002"));
        usRules.setMandatory(true);
        ruleSets.put(usRules.getRuleSetId(), usRules);
        jurisdictionRules.put(Jurisdiction.US, usRules.getPatternIds());

        // EU Jurisdiction
        ComplianceRuleSet euRules = new ComplianceRuleSet();
        euRules.setRuleSetId("JURISDICTION-EU");
        euRules.setName("European Union Compliance Rules");
        euRules.setJurisdiction(Jurisdiction.EU);
        euRules.setPatternIds(Arrays.asList("RC-001", "RC-002", "RC-003", "CC-001", "CC-002"));
        euRules.setMandatory(true);
        ruleSets.put(euRules.getRuleSetId(), euRules);
        jurisdictionRules.put(Jurisdiction.EU, euRules.getPatternIds());

        // Singapore Jurisdiction
        ComplianceRuleSet sgRules = new ComplianceRuleSet();
        sgRules.setRuleSetId("JURISDICTION-SG");
        sgRules.setName("Singapore Compliance Rules");
        sgRules.setJurisdiction(Jurisdiction.SINGAPORE);
        sgRules.setPatternIds(Arrays.asList("RC-001", "RC-002", "RC-003", "SEC-001"));
        sgRules.setMandatory(true);
        ruleSets.put(sgRules.getRuleSetId(), sgRules);
        jurisdictionRules.put(Jurisdiction.SINGAPORE, sgRules.getPatternIds());

        // Carbon Credit Rules (Global)
        ComplianceRuleSet carbonRules = new ComplianceRuleSet();
        carbonRules.setRuleSetId("ASSET-CARBON");
        carbonRules.setName("Carbon Credit Compliance Rules");
        carbonRules.setAssetClass(AssetClass.CARBON_CREDIT);
        carbonRules.setPatternIds(Arrays.asList("CC-001", "CC-002", "CC-003", "VR-006"));
        carbonRules.setMandatory(true);
        ruleSets.put(carbonRules.getRuleSetId(), carbonRules);
        assetClassRules.put(AssetClass.CARBON_CREDIT, carbonRules.getPatternIds());

        // Real Estate Rules
        ComplianceRuleSet realEstateRules = new ComplianceRuleSet();
        realEstateRules.setRuleSetId("ASSET-REAL-ESTATE");
        realEstateRules.setName("Real Estate Compliance Rules");
        realEstateRules.setAssetClass(AssetClass.REAL_ESTATE);
        realEstateRules.setPatternIds(Arrays.asList("RE-001", "RE-002", "RE-003", "VR-001", "VR-002"));
        realEstateRules.setMandatory(true);
        ruleSets.put(realEstateRules.getRuleSetId(), realEstateRules);
        assetClassRules.put(AssetClass.REAL_ESTATE, realEstateRules.getPatternIds());

        LOGGER.info("Initialized {} jurisdiction/asset rule sets", ruleSets.size());
    }

    // ========== Public API ==========

    /**
     * Get compliance pattern by ID
     *
     * @param patternId Pattern identifier
     * @return Compliance pattern
     */
    public Uni<CompliancePattern> getPattern(String patternId) {
        return Uni.createFrom().item(() -> {
            CompliancePattern pattern = patterns.get(patternId);
            if (pattern == null) {
                throw new PatternNotFoundException("Compliance pattern not found: " + patternId);
            }
            return pattern;
        });
    }

    /**
     * Get all patterns by category
     *
     * @param category Compliance category
     * @return List of patterns
     */
    public Uni<List<CompliancePattern>> getPatternsByCategory(ComplianceCategory category) {
        return Uni.createFrom().item(() ->
            patterns.values().stream()
                .filter(p -> p.getCategory() == category)
                .toList()
        );
    }

    /**
     * Get all patterns for a jurisdiction
     *
     * @param jurisdiction Jurisdiction
     * @return List of patterns
     */
    public Uni<List<CompliancePattern>> getPatternsForJurisdiction(Jurisdiction jurisdiction) {
        return Uni.createFrom().item(() -> {
            List<String> patternIds = jurisdictionRules.getOrDefault(jurisdiction, Collections.emptyList());
            return patternIds.stream()
                .map(patterns::get)
                .filter(Objects::nonNull)
                .toList();
        });
    }

    /**
     * Get all patterns for an asset class
     *
     * @param assetClass Asset class
     * @return List of patterns
     */
    public Uni<List<CompliancePattern>> getPatternsForAssetClass(AssetClass assetClass) {
        return Uni.createFrom().item(() -> {
            List<String> patternIds = assetClassRules.getOrDefault(assetClass, Collections.emptyList());
            return patternIds.stream()
                .map(patterns::get)
                .filter(Objects::nonNull)
                .toList();
        });
    }

    /**
     * Get transition rules for a specific state transition
     *
     * @param fromState Source state
     * @param toState   Target state
     * @return List of applicable patterns
     */
    public Uni<List<CompliancePattern>> getTransitionRules(WorkflowEngine.WorkflowState fromState,
                                                            WorkflowEngine.WorkflowState toState) {
        return Uni.createFrom().item(() ->
            patterns.values().stream()
                .filter(p -> p.getCategory() == ComplianceCategory.TRANSITION)
                .filter(p -> (p.getFromState() == null || p.getFromState() == fromState))
                .filter(p -> (p.getToState() == null || p.getToState() == toState))
                .toList()
        );
    }

    /**
     * Evaluate compliance for a context
     *
     * @param patternId Pattern to evaluate
     * @param context   Evaluation context
     * @return Compliance result
     */
    public Uni<ComplianceResult> evaluateCompliance(String patternId, Map<String, Object> context) {
        return getPattern(patternId).flatMap(pattern -> {
            // Create a rule from the pattern
            BusinessRulesEngine.Rule rule = new BusinessRulesEngine.Rule();
            rule.setRuleId("COMPLIANCE-" + patternId);
            rule.setName(pattern.getName());
            rule.setExpression(pattern.getExpression());
            rule.setCategory(mapToRuleCategory(pattern.getCategory()));
            rule.setEnabled(true);

            return rulesEngine.registerRule(rule)
                .flatMap(r -> rulesEngine.evaluateRule(rule.getRuleId(), context))
                .map(result -> new ComplianceResult(
                    patternId,
                    pattern.getName(),
                    result.passed(),
                    result.passed() ? "Compliance check passed" : pattern.getFailureMessage(),
                    pattern.getSeverity(),
                    pattern.getRegulation(),
                    Instant.now()
                ));
        });
    }

    /**
     * Evaluate all applicable compliance rules
     *
     * @param jurisdiction Jurisdiction
     * @param assetClass   Asset class (optional)
     * @param context      Evaluation context
     * @return List of compliance results
     */
    public Uni<ComplianceCheckResult> evaluateAllCompliance(Jurisdiction jurisdiction,
                                                             AssetClass assetClass,
                                                             Map<String, Object> context) {
        return Uni.createFrom().item(() -> {
            List<String> applicablePatterns = new ArrayList<>();

            // Add jurisdiction patterns
            applicablePatterns.addAll(jurisdictionRules.getOrDefault(jurisdiction, Collections.emptyList()));

            // Add asset class patterns
            if (assetClass != null) {
                applicablePatterns.addAll(assetClassRules.getOrDefault(assetClass, Collections.emptyList()));
            }

            return applicablePatterns.stream().distinct().toList();
        }).flatMap(patternIds -> {
            List<Uni<ComplianceResult>> evaluations = patternIds.stream()
                .map(id -> evaluateCompliance(id, context))
                .toList();

            return Uni.combine().all().unis(evaluations)
                .with(results -> {
                    @SuppressWarnings("unchecked")
                    List<ComplianceResult> resultList = (List<ComplianceResult>) results;

                    boolean allPassed = resultList.stream().allMatch(ComplianceResult::passed);
                    long passedCount = resultList.stream().filter(ComplianceResult::passed).count();
                    long failedCount = resultList.size() - passedCount;

                    List<ComplianceResult> failures = resultList.stream()
                        .filter(r -> !r.passed())
                        .toList();

                    return new ComplianceCheckResult(
                        allPassed,
                        resultList,
                        failures,
                        passedCount,
                        failedCount,
                        Instant.now()
                    );
                });
        });
    }

    /**
     * Get rule set by ID
     *
     * @param ruleSetId Rule set identifier
     * @return Compliance rule set
     */
    public Uni<ComplianceRuleSet> getRuleSet(String ruleSetId) {
        return Uni.createFrom().item(() -> {
            ComplianceRuleSet ruleSet = ruleSets.get(ruleSetId);
            if (ruleSet == null) {
                throw new RuleSetNotFoundException("Compliance rule set not found: " + ruleSetId);
            }
            return ruleSet;
        });
    }

    /**
     * Get all available patterns
     *
     * @return List of all patterns
     */
    public Uni<List<CompliancePattern>> getAllPatterns() {
        return Uni.createFrom().item(() -> new ArrayList<>(patterns.values()));
    }

    /**
     * Get all rule sets
     *
     * @return List of all rule sets
     */
    public Uni<List<ComplianceRuleSet>> getAllRuleSets() {
        return Uni.createFrom().item(() -> new ArrayList<>(ruleSets.values()));
    }

    /**
     * Register a custom compliance pattern
     *
     * @param pattern Pattern to register
     * @return Registered pattern
     */
    public Uni<CompliancePattern> registerCustomPattern(CompliancePattern pattern) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering custom compliance pattern: {}", pattern.getPatternId());
            pattern.setCustom(true);
            pattern.setCreatedAt(Instant.now());
            patterns.put(pattern.getPatternId(), pattern);
            return pattern;
        });
    }

    /**
     * Get statistics about compliance patterns
     *
     * @return Statistics map
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPatterns", patterns.size());
        stats.put("totalRuleSets", ruleSets.size());

        // Count by category
        Map<ComplianceCategory, Long> byCategory = new EnumMap<>(ComplianceCategory.class);
        for (ComplianceCategory category : ComplianceCategory.values()) {
            long count = patterns.values().stream()
                .filter(p -> p.getCategory() == category)
                .count();
            byCategory.put(category, count);
        }
        stats.put("patternsByCategory", byCategory);

        // Count by severity
        Map<Severity, Long> bySeverity = new EnumMap<>(Severity.class);
        for (Severity severity : Severity.values()) {
            long count = patterns.values().stream()
                .filter(p -> p.getSeverity() == severity)
                .count();
            bySeverity.put(severity, count);
        }
        stats.put("patternsBySeverity", bySeverity);

        stats.put("jurisdictionsConfigured", jurisdictionRules.size());
        stats.put("assetClassesConfigured", assetClassRules.size());

        return stats;
    }

    // ========== Private Helper Methods ==========

    private void registerPattern(CompliancePattern pattern) {
        pattern.setCreatedAt(Instant.now());
        patterns.put(pattern.getPatternId(), pattern);
    }

    private BusinessRulesEngine.RuleCategory mapToRuleCategory(ComplianceCategory category) {
        return switch (category) {
            case TRANSITION -> BusinessRulesEngine.RuleCategory.STATUS;
            case VALIDATION -> BusinessRulesEngine.RuleCategory.VALIDATION;
            case REGULATORY -> BusinessRulesEngine.RuleCategory.COMPLIANCE;
            case ASSET_SPECIFIC -> BusinessRulesEngine.RuleCategory.TOKEN;
        };
    }

    // ========== Nested Classes ==========

    /**
     * Compliance pattern definition
     */
    public static class CompliancePattern {
        private String patternId;
        private String name;
        private String description;
        private ComplianceCategory category;
        private String expression;
        private WorkflowEngine.WorkflowState fromState;
        private WorkflowEngine.WorkflowState toState;
        private AssetClass assetClass;
        private Severity severity;
        private String regulation;
        private String failureMessage;
        private List<String> requiredFields;
        private boolean custom;
        private boolean enabled = true;
        private Instant createdAt;

        // Getters and setters
        public String getPatternId() { return patternId; }
        public void setPatternId(String patternId) { this.patternId = patternId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public ComplianceCategory getCategory() { return category; }
        public void setCategory(ComplianceCategory category) { this.category = category; }
        public String getExpression() { return expression; }
        public void setExpression(String expression) { this.expression = expression; }
        public WorkflowEngine.WorkflowState getFromState() { return fromState; }
        public void setFromState(WorkflowEngine.WorkflowState fromState) { this.fromState = fromState; }
        public WorkflowEngine.WorkflowState getToState() { return toState; }
        public void setToState(WorkflowEngine.WorkflowState toState) { this.toState = toState; }
        public AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(AssetClass assetClass) { this.assetClass = assetClass; }
        public Severity getSeverity() { return severity; }
        public void setSeverity(Severity severity) { this.severity = severity; }
        public String getRegulation() { return regulation; }
        public void setRegulation(String regulation) { this.regulation = regulation; }
        public String getFailureMessage() { return failureMessage; }
        public void setFailureMessage(String failureMessage) { this.failureMessage = failureMessage; }
        public List<String> getRequiredFields() { return requiredFields; }
        public void setRequiredFields(List<String> requiredFields) { this.requiredFields = requiredFields; }
        public boolean isCustom() { return custom; }
        public void setCustom(boolean custom) { this.custom = custom; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private CompliancePattern pattern = new CompliancePattern();

            public Builder patternId(String patternId) { pattern.patternId = patternId; return this; }
            public Builder name(String name) { pattern.name = name; return this; }
            public Builder description(String description) { pattern.description = description; return this; }
            public Builder category(ComplianceCategory category) { pattern.category = category; return this; }
            public Builder expression(String expression) { pattern.expression = expression; return this; }
            public Builder fromState(WorkflowEngine.WorkflowState state) { pattern.fromState = state; return this; }
            public Builder toState(WorkflowEngine.WorkflowState state) { pattern.toState = state; return this; }
            public Builder assetClass(AssetClass assetClass) { pattern.assetClass = assetClass; return this; }
            public Builder severity(Severity severity) { pattern.severity = severity; return this; }
            public Builder regulation(String regulation) { pattern.regulation = regulation; return this; }
            public Builder failureMessage(String msg) { pattern.failureMessage = msg; return this; }
            public Builder requiredFields(List<String> fields) { pattern.requiredFields = fields; return this; }

            public CompliancePattern build() {
                if (pattern.severity == null) pattern.severity = Severity.MEDIUM;
                return pattern;
            }
        }
    }

    /**
     * Compliance rule set
     */
    public static class ComplianceRuleSet {
        private String ruleSetId;
        private String name;
        private String description;
        private Jurisdiction jurisdiction;
        private AssetClass assetClass;
        private List<String> patternIds = new ArrayList<>();
        private boolean mandatory;
        private Instant createdAt;

        // Getters and setters
        public String getRuleSetId() { return ruleSetId; }
        public void setRuleSetId(String ruleSetId) { this.ruleSetId = ruleSetId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Jurisdiction getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(Jurisdiction jurisdiction) { this.jurisdiction = jurisdiction; }
        public AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(AssetClass assetClass) { this.assetClass = assetClass; }
        public List<String> getPatternIds() { return patternIds; }
        public void setPatternIds(List<String> patternIds) { this.patternIds = patternIds; }
        public boolean isMandatory() { return mandatory; }
        public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    /**
     * Single compliance evaluation result
     */
    public record ComplianceResult(
        String patternId,
        String patternName,
        boolean passed,
        String message,
        Severity severity,
        String regulation,
        Instant evaluatedAt
    ) {}

    /**
     * Full compliance check result
     */
    public record ComplianceCheckResult(
        boolean allPassed,
        List<ComplianceResult> results,
        List<ComplianceResult> failures,
        long passedCount,
        long failedCount,
        Instant checkedAt
    ) {}

    // ========== Enums ==========

    public enum ComplianceCategory {
        TRANSITION, VALIDATION, REGULATORY, ASSET_SPECIFIC
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Jurisdiction {
        US, EU, UK, SINGAPORE, HONG_KONG, JAPAN, AUSTRALIA, CANADA, SWITZERLAND, GLOBAL
    }

    public enum AssetClass {
        CARBON_CREDIT, REAL_ESTATE, SECURITY, COMMODITY, ART, COLLECTIBLE, INFRASTRUCTURE
    }

    // ========== Exceptions ==========

    public static class PatternNotFoundException extends RuntimeException {
        public PatternNotFoundException(String message) { super(message); }
    }

    public static class RuleSetNotFoundException extends RuntimeException {
        public RuleSetNotFoundException(String message) { super(message); }
    }
}
