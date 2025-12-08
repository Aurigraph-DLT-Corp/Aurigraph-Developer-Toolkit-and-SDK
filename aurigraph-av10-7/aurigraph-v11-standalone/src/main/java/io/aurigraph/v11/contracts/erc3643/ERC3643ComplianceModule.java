package io.aurigraph.v11.contracts.erc3643;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ERC-3643 Compliance Module
 *
 * Central compliance engine for security token transfers.
 * Implements the canTransfer() hook required by ERC-3643 standard.
 *
 * This module is the SINGLE POINT OF COMPLIANCE CHECK for all token transfers.
 * It integrates:
 * - Identity Registry (ONCHAINID)
 * - Claim Topics Registry
 * - Trusted Issuers Registry
 * - Custom compliance rules per token
 *
 * @version 1.0.0
 * @since 2025-12-08
 */
@ApplicationScoped
public class ERC3643ComplianceModule {

    private static final Logger LOG = LoggerFactory.getLogger(ERC3643ComplianceModule.class);

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ERC3643TokenRegistry tokenRegistry;

    // Trusted issuers: claimTopic -> Set<issuerId>
    private final Map<IdentityRegistry.ClaimTopic, Set<String>> trustedIssuers = new ConcurrentHashMap<>();

    // Global compliance rules
    private final Map<String, ComplianceRule> globalRules = new ConcurrentHashMap<>();

    // Token-specific rules: tokenId -> List<ComplianceRule>
    private final Map<String, List<ComplianceRule>> tokenRules = new ConcurrentHashMap<>();

    // Compliance events log
    private final List<ComplianceEvent> eventLog = Collections.synchronizedList(new ArrayList<>());

    // ========== Core canTransfer Hook ==========

    /**
     * MAIN ERC-3643 COMPLIANCE CHECK
     *
     * This is the canTransfer() hook that must be called before any transfer.
     * Returns true only if ALL compliance checks pass.
     */
    public Uni<TransferValidation> canTransfer(TransferRequest request) {
        LOG.debug("Compliance check for transfer: {} -> {} ({} of {})",
            request.from(), request.to(), request.amount(), request.tokenId());

        long startTime = System.nanoTime();
        List<String> failedChecks = new ArrayList<>();
        List<String> passedChecks = new ArrayList<>();

        return executeComplianceChecks(request, failedChecks, passedChecks)
            .map(allowed -> {
                long durationNs = System.nanoTime() - startTime;
                double durationMs = durationNs / 1_000_000.0;

                TransferValidation result = new TransferValidation(
                    allowed,
                    allowed ? "Transfer allowed" : "Transfer blocked: " + String.join(", ", failedChecks),
                    passedChecks,
                    failedChecks,
                    durationMs,
                    Instant.now()
                );

                // Log compliance event
                ComplianceEvent event = new ComplianceEvent(
                    UUID.randomUUID().toString(),
                    request.tokenId(),
                    request.from(),
                    request.to(),
                    request.amount(),
                    allowed ? "ALLOWED" : "BLOCKED",
                    failedChecks,
                    Instant.now()
                );
                eventLog.add(event);

                if (!allowed) {
                    LOG.warn("Transfer BLOCKED: {} -> {} - Reasons: {}",
                        request.from(), request.to(), failedChecks);
                } else {
                    LOG.debug("Transfer ALLOWED: {} -> {} in {}ms",
                        request.from(), request.to(), durationMs);
                }

                return result;
            });
    }

    /**
     * Execute all compliance checks in sequence
     */
    private Uni<Boolean> executeComplianceChecks(TransferRequest request,
            List<String> failedChecks, List<String> passedChecks) {

        // Check 1: Token exists and is active
        return checkTokenStatus(request.tokenId(), failedChecks, passedChecks)
            // Check 2: Sender is verified
            .flatMap(ok -> ok ? checkSenderVerified(request.from(), failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 3: Recipient is verified
            .flatMap(ok -> ok ? checkRecipientVerified(request.to(), failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 4: Sender has required claims
            .flatMap(ok -> ok ? checkSenderClaims(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 5: Recipient has required claims
            .flatMap(ok -> ok ? checkRecipientClaims(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 6: Claims from trusted issuers
            .flatMap(ok -> ok ? checkTrustedIssuers(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 7: Country restrictions
            .flatMap(ok -> ok ? checkCountryRestrictions(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 8: Investor type restrictions
            .flatMap(ok -> ok ? checkInvestorTypeRestrictions(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 9: Transfer limits
            .flatMap(ok -> ok ? checkTransferLimits(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false))
            // Check 10: Custom rules
            .flatMap(ok -> ok ? checkCustomRules(request, failedChecks, passedChecks) :
                Uni.createFrom().item(false));
    }

    // ========== Individual Compliance Checks ==========

    private Uni<Boolean> checkTokenStatus(String tokenId, List<String> failed, List<String> passed) {
        return tokenRegistry.getToken(tokenId)
            .map(token -> {
                if (token == null) {
                    failed.add("TOKEN_NOT_FOUND");
                    return false;
                }
                if (token.getStatus() != ERC3643TokenRegistry.TokenStatus.ACTIVE) {
                    failed.add("TOKEN_NOT_ACTIVE");
                    return false;
                }
                passed.add("TOKEN_ACTIVE");
                return true;
            });
    }

    private Uni<Boolean> checkSenderVerified(String wallet, List<String> failed, List<String> passed) {
        return identityRegistry.isVerified(wallet)
            .map(verified -> {
                if (!verified) {
                    failed.add("SENDER_NOT_VERIFIED");
                    return false;
                }
                passed.add("SENDER_VERIFIED");
                return true;
            });
    }

    private Uni<Boolean> checkRecipientVerified(String wallet, List<String> failed, List<String> passed) {
        return identityRegistry.isVerified(wallet)
            .map(verified -> {
                if (!verified) {
                    failed.add("RECIPIENT_NOT_VERIFIED");
                    return false;
                }
                passed.add("RECIPIENT_VERIFIED");
                return true;
            });
    }

    private Uni<Boolean> checkSenderClaims(TransferRequest request, List<String> failed, List<String> passed) {
        return tokenRegistry.getComplianceConfig(request.tokenId())
            .flatMap((ERC3643TokenRegistry.ComplianceConfig config) -> {
                if (config == null || config.requiredClaimTopics() == null || config.requiredClaimTopics().isEmpty()) {
                    passed.add("NO_CLAIMS_REQUIRED");
                    return Uni.createFrom().item(true);
                }

                return identityRegistry.getValidClaims(request.from())
                    .map(claims -> {
                        Set<IdentityRegistry.ClaimTopic> haveClaims = new HashSet<>();
                        for (IdentityRegistry.Claim claim : claims) {
                            haveClaims.add(claim.topic());
                        }

                        for (IdentityRegistry.ClaimTopic required : config.requiredClaimTopics()) {
                            if (!haveClaims.contains(required)) {
                                failed.add("SENDER_MISSING_" + required.name());
                                return false;
                            }
                        }
                        passed.add("SENDER_CLAIMS_VALID");
                        return true;
                    });
            });
    }

    private Uni<Boolean> checkRecipientClaims(TransferRequest request, List<String> failed, List<String> passed) {
        return tokenRegistry.getComplianceConfig(request.tokenId())
            .flatMap((ERC3643TokenRegistry.ComplianceConfig config) -> {
                if (config == null || config.requiredClaimTopics() == null || config.requiredClaimTopics().isEmpty()) {
                    return Uni.createFrom().item(true);
                }

                return identityRegistry.getValidClaims(request.to())
                    .map(claims -> {
                        Set<IdentityRegistry.ClaimTopic> haveClaims = new HashSet<>();
                        for (IdentityRegistry.Claim claim : claims) {
                            haveClaims.add(claim.topic());
                        }

                        for (IdentityRegistry.ClaimTopic required : config.requiredClaimTopics()) {
                            if (!haveClaims.contains(required)) {
                                failed.add("RECIPIENT_MISSING_" + required.name());
                                return false;
                            }
                        }
                        passed.add("RECIPIENT_CLAIMS_VALID");
                        return true;
                    });
            });
    }

    private Uni<Boolean> checkTrustedIssuers(TransferRequest request, List<String> failed, List<String> passed) {
        // If no trusted issuers configured, skip this check
        if (trustedIssuers.isEmpty()) {
            passed.add("NO_ISSUER_RESTRICTIONS");
            return Uni.createFrom().item(true);
        }

        return identityRegistry.getValidClaims(request.to())
            .map(claims -> {
                for (IdentityRegistry.Claim claim : claims) {
                    Set<String> trusted = trustedIssuers.get(claim.topic());
                    if (trusted != null && !trusted.isEmpty()) {
                        if (!trusted.contains(claim.issuerId())) {
                            failed.add("UNTRUSTED_ISSUER_FOR_" + claim.topic().name());
                            return false;
                        }
                    }
                }
                passed.add("ISSUERS_TRUSTED");
                return true;
            });
    }

    private Uni<Boolean> checkCountryRestrictions(TransferRequest request, List<String> failed, List<String> passed) {
        return tokenRegistry.getComplianceConfig(request.tokenId())
            .flatMap((ERC3643TokenRegistry.ComplianceConfig config) -> {
                if (config == null || config.restrictedCountries() == null || config.restrictedCountries().isEmpty()) {
                    passed.add("NO_COUNTRY_RESTRICTIONS");
                    return Uni.createFrom().item(true);
                }

                return identityRegistry.getCountry(request.to())
                    .map(country -> {
                        if (country != null && config.restrictedCountries().contains(country)) {
                            failed.add("RECIPIENT_COUNTRY_RESTRICTED_" + country);
                            return false;
                        }
                        passed.add("COUNTRY_ALLOWED");
                        return true;
                    });
            });
    }

    private Uni<Boolean> checkInvestorTypeRestrictions(TransferRequest request, List<String> failed, List<String> passed) {
        return tokenRegistry.getComplianceConfig(request.tokenId())
            .flatMap((ERC3643TokenRegistry.ComplianceConfig config) -> {
                if (config == null || config.transferRestrictions() == null) {
                    passed.add("NO_INVESTOR_RESTRICTIONS");
                    return Uni.createFrom().item(true);
                }

                ERC3643TokenRegistry.TransferRestrictions restrictions = config.transferRestrictions();

                return identityRegistry.getInvestorType(request.to())
                    .map(investorType -> {
                        if (restrictions.accreditedOnly()) {
                            if (investorType != IdentityRegistry.InvestorType.ACCREDITED &&
                                investorType != IdentityRegistry.InvestorType.QUALIFIED &&
                                investorType != IdentityRegistry.InvestorType.INSTITUTIONAL &&
                                investorType != IdentityRegistry.InvestorType.PROFESSIONAL) {
                                failed.add("RECIPIENT_NOT_ACCREDITED");
                                return false;
                            }
                        }

                        if (restrictions.institutionalOnly()) {
                            if (investorType != IdentityRegistry.InvestorType.INSTITUTIONAL) {
                                failed.add("RECIPIENT_NOT_INSTITUTIONAL");
                                return false;
                            }
                        }

                        passed.add("INVESTOR_TYPE_ALLOWED");
                        return true;
                    });
            });
    }

    private Uni<Boolean> checkTransferLimits(TransferRequest request, List<String> failed, List<String> passed) {
        return tokenRegistry.getComplianceConfig(request.tokenId())
            .map((ERC3643TokenRegistry.ComplianceConfig config) -> {
                if (config == null || config.transferRestrictions() == null) {
                    passed.add("NO_TRANSFER_LIMITS");
                    return true;
                }

                ERC3643TokenRegistry.TransferRestrictions restrictions = config.transferRestrictions();

                // Check min transfer amount
                if (restrictions.minTransferAmount() != null &&
                    request.amount().compareTo(restrictions.minTransferAmount()) < 0) {
                    failed.add("BELOW_MIN_TRANSFER_AMOUNT");
                    return false;
                }

                // Check max transfer amount
                if (restrictions.maxTransferAmount() != null &&
                    request.amount().compareTo(restrictions.maxTransferAmount()) > 0) {
                    failed.add("ABOVE_MAX_TRANSFER_AMOUNT");
                    return false;
                }

                // Check lockup period
                if (restrictions.lockupEnforced() && restrictions.lockupEndDate() != null) {
                    if (Instant.now().isBefore(restrictions.lockupEndDate())) {
                        failed.add("LOCKUP_PERIOD_ACTIVE");
                        return false;
                    }
                }

                passed.add("TRANSFER_LIMITS_OK");
                return true;
            });
    }

    private Uni<Boolean> checkCustomRules(TransferRequest request, List<String> failed, List<String> passed) {
        return Uni.createFrom().item(() -> {
            // Check global rules
            for (ComplianceRule rule : globalRules.values()) {
                if (!rule.enabled()) continue;

                boolean ruleResult = evaluateRule(rule, request);
                if (!ruleResult) {
                    failed.add("GLOBAL_RULE_" + rule.ruleId());
                    return false;
                }
            }

            // Check token-specific rules
            List<ComplianceRule> specificRules = tokenRules.get(request.tokenId());
            if (specificRules != null) {
                for (ComplianceRule rule : specificRules) {
                    if (!rule.enabled()) continue;

                    boolean ruleResult = evaluateRule(rule, request);
                    if (!ruleResult) {
                        failed.add("TOKEN_RULE_" + rule.ruleId());
                        return false;
                    }
                }
            }

            passed.add("CUSTOM_RULES_OK");
            return true;
        });
    }

    private boolean evaluateRule(ComplianceRule rule, TransferRequest request) {
        // Simple rule evaluation - can be extended for complex rules
        switch (rule.ruleType()) {
            case WHITELIST_ONLY:
                Set<String> whitelist = rule.allowedAddresses();
                return whitelist != null && whitelist.contains(request.to());

            case BLACKLIST:
                Set<String> blacklist = rule.blockedAddresses();
                return blacklist == null || !blacklist.contains(request.to());

            case MAX_HOLDING:
                // Would need to check balance + incoming amount
                return true;

            case TIME_RESTRICTED:
                // Check if transfer is within allowed time window
                return true;

            default:
                return true;
        }
    }

    // ========== Trusted Issuers Management ==========

    /**
     * Add a trusted issuer for a claim topic
     */
    public Uni<Boolean> addTrustedIssuer(IdentityRegistry.ClaimTopic topic, String issuerId, String issuerName) {
        return Uni.createFrom().item(() -> {
            trustedIssuers.computeIfAbsent(topic, k -> ConcurrentHashMap.newKeySet()).add(issuerId);
            LOG.info("Added trusted issuer {} ({}) for claim topic {}", issuerId, issuerName, topic);
            return true;
        });
    }

    /**
     * Remove a trusted issuer
     */
    public Uni<Boolean> removeTrustedIssuer(IdentityRegistry.ClaimTopic topic, String issuerId) {
        return Uni.createFrom().item(() -> {
            Set<String> issuers = trustedIssuers.get(topic);
            if (issuers != null) {
                issuers.remove(issuerId);
                LOG.info("Removed trusted issuer {} for claim topic {}", issuerId, topic);
                return true;
            }
            return false;
        });
    }

    /**
     * Get trusted issuers for a claim topic
     */
    public Uni<Set<String>> getTrustedIssuers(IdentityRegistry.ClaimTopic topic) {
        return Uni.createFrom().item(() ->
            trustedIssuers.getOrDefault(topic, Set.of())
        );
    }

    // ========== Custom Rules Management ==========

    /**
     * Add a global compliance rule
     */
    public Uni<Boolean> addGlobalRule(ComplianceRule rule) {
        return Uni.createFrom().item(() -> {
            globalRules.put(rule.ruleId(), rule);
            LOG.info("Added global compliance rule: {}", rule.ruleId());
            return true;
        });
    }

    /**
     * Add a token-specific compliance rule
     */
    public Uni<Boolean> addTokenRule(String tokenId, ComplianceRule rule) {
        return Uni.createFrom().item(() -> {
            tokenRules.computeIfAbsent(tokenId, k -> Collections.synchronizedList(new ArrayList<>())).add(rule);
            LOG.info("Added compliance rule {} for token {}", rule.ruleId(), tokenId);
            return true;
        });
    }

    /**
     * Remove a compliance rule
     */
    public Uni<Boolean> removeRule(String ruleId) {
        return Uni.createFrom().item(() -> {
            ComplianceRule removed = globalRules.remove(ruleId);
            if (removed != null) {
                LOG.info("Removed global compliance rule: {}", ruleId);
                return true;
            }

            // Try to remove from token-specific rules
            for (List<ComplianceRule> rules : tokenRules.values()) {
                if (rules.removeIf(r -> r.ruleId().equals(ruleId))) {
                    LOG.info("Removed token-specific compliance rule: {}", ruleId);
                    return true;
                }
            }

            return false;
        });
    }

    // ========== Reporting ==========

    /**
     * Get compliance events for a token
     */
    public Uni<List<ComplianceEvent>> getComplianceEvents(String tokenId, int limit) {
        return Uni.createFrom().item(() ->
            eventLog.stream()
                .filter(e -> e.tokenId().equals(tokenId))
                .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
                .limit(limit)
                .toList()
        );
    }

    /**
     * Get compliance events for a wallet
     */
    public Uni<List<ComplianceEvent>> getWalletEvents(String wallet, int limit) {
        return Uni.createFrom().item(() ->
            eventLog.stream()
                .filter(e -> e.from().equals(wallet) || e.to().equals(wallet))
                .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
                .limit(limit)
                .toList()
        );
    }

    /**
     * Get blocked transfer statistics
     */
    public Uni<ComplianceStats> getComplianceStats() {
        return Uni.createFrom().item(() -> {
            long total = eventLog.size();
            long allowed = eventLog.stream().filter(e -> "ALLOWED".equals(e.result())).count();
            long blocked = total - allowed;

            Map<String, Long> blockReasons = new HashMap<>();
            for (ComplianceEvent event : eventLog) {
                if (!"ALLOWED".equals(event.result())) {
                    for (String reason : event.failedChecks()) {
                        blockReasons.merge(reason, 1L, Long::sum);
                    }
                }
            }

            return new ComplianceStats(total, allowed, blocked, blockReasons);
        });
    }

    // ========== Inner Classes ==========

    /**
     * Transfer Request
     */
    public record TransferRequest(
        String tokenId,
        String from,
        String to,
        BigDecimal amount,
        Map<String, Object> metadata
    ) {}

    /**
     * Transfer Validation Result
     */
    public record TransferValidation(
        boolean allowed,
        String message,
        List<String> passedChecks,
        List<String> failedChecks,
        double checkDurationMs,
        Instant timestamp
    ) {}

    /**
     * Compliance Rule
     */
    public record ComplianceRule(
        String ruleId,
        String name,
        String description,
        RuleType ruleType,
        boolean enabled,
        Set<String> allowedAddresses,
        Set<String> blockedAddresses,
        Map<String, Object> parameters
    ) {}

    /**
     * Rule Types
     */
    public enum RuleType {
        WHITELIST_ONLY,
        BLACKLIST,
        MAX_HOLDING,
        TIME_RESTRICTED,
        VOLUME_LIMIT,
        CUSTOM
    }

    /**
     * Compliance Event
     */
    public record ComplianceEvent(
        String eventId,
        String tokenId,
        String from,
        String to,
        BigDecimal amount,
        String result,
        List<String> failedChecks,
        Instant timestamp
    ) {}

    /**
     * Compliance Statistics
     */
    public record ComplianceStats(
        long totalTransfers,
        long allowedTransfers,
        long blockedTransfers,
        Map<String, Long> blockReasonCounts
    ) {}
}
