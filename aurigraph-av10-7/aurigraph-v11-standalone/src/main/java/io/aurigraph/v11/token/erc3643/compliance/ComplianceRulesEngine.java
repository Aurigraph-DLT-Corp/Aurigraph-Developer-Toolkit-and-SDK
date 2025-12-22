package io.aurigraph.v11.token.erc3643.compliance;

import io.aurigraph.v11.token.erc3643.identity.ClaimVerifier;
import io.aurigraph.v11.token.erc3643.identity.IdentityRegistry;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Compliance Rules Engine for ERC-3643 T-REX Security Tokens.
 *
 * Provides:
 * - Modular rule evaluation
 * - MaxTransferRule, CountryRestrictionRule, AccreditedInvestorRule
 * - Rule priority ordering
 * - Comprehensive audit logging
 *
 * @see <a href="https://eips.ethereum.org/EIPS/eip-3643">EIP-3643</a>
 */
@ApplicationScoped
public class ComplianceRulesEngine {

    // Active rules registry
    private final Map<String, ComplianceRule> rules = new ConcurrentHashMap<>();
    private final List<String> ruleExecutionOrder = new CopyOnWriteArrayList<>();

    // Audit log
    private final List<AuditLogEntry> auditLog = new CopyOnWriteArrayList<>();
    private final AtomicLong auditSequence = new AtomicLong(0);

    // Event listeners
    private final List<ComplianceEventListener> eventListeners = new CopyOnWriteArrayList<>();

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ClaimVerifier claimVerifier;

    // ==================== Records ====================

    /**
     * Individual rule evaluation result
     */
    public record RuleEvaluationResult(
            String ruleId,
            String ruleName,
            boolean passed,
            String message,
            long executionTimeMs) {
    }

    /**
     * Audit log entry
     */
    public record AuditLogEntry(
            long sequence,
            String transactionId,
            String from,
            String to,
            BigInteger amount,
            boolean approved,
            String reason,
            List<String> failedRules,
            Instant timestamp) {
    }

    /**
     * Rule configuration
     */
    public record RuleConfig(
            String ruleId,
            String ruleName,
            RuleType type,
            int priority,
            boolean enabled,
            Map<String, Object> parameters) {
    }

    /**
     * Transfer context for rule evaluation
     */
    public record TransferContext(
            String from,
            String to,
            BigInteger amount,
            boolean isForcedTransfer,
            Optional<String> fromCountry,
            Optional<String> toCountry,
            Optional<String> fromInvestorId,
            Optional<String> toInvestorId,
            Set<ClaimVerifier.ClaimTopic> fromClaims,
            Set<ClaimVerifier.ClaimTopic> toClaims) {
    }

    /**
     * Compliance event
     */
    public record ComplianceEvent(
            String transactionId,
            ComplianceEventType eventType,
            String details,
            Instant timestamp) {
    }

    // ==================== Enums ====================

    public enum RuleType {
        MAX_TRANSFER,
        COUNTRY_RESTRICTION,
        ACCREDITED_INVESTOR,
        HOLDING_PERIOD,
        MAX_HOLDERS,
        MAX_BALANCE,
        TRANSFER_FREQUENCY,
        BLACKLIST,
        WHITELIST,
        CUSTOM
    }

    public enum ComplianceEventType {
        RULE_ADDED,
        RULE_REMOVED,
        RULE_UPDATED,
        TRANSFER_APPROVED,
        TRANSFER_REJECTED,
        AUDIT_GENERATED
    }

    // ==================== Event Listener Interface ====================

    public interface ComplianceEventListener {
        void onComplianceEvent(ComplianceEvent event);
    }

    // ==================== Rule Interface ====================

    /**
     * Base interface for compliance rules
     */
    public interface ComplianceRule {
        String getRuleId();

        String getRuleName();

        RuleType getType();

        int getPriority();

        boolean isEnabled();

        Uni<RuleEvaluationResult> evaluate(TransferContext context);

        void updateParameters(Map<String, Object> parameters);
    }

    // ==================== Built-in Rule Implementations ====================

    /**
     * Maximum transfer amount rule
     */
    public static class MaxTransferRule implements ComplianceRule {
        private final String ruleId;
        private volatile BigInteger maxAmount;
        private volatile boolean enabled = true;
        private volatile int priority = 100;

        public MaxTransferRule(String ruleId, BigInteger maxAmount) {
            this.ruleId = ruleId;
            this.maxAmount = maxAmount;
        }

        @Override
        public String getRuleId() {
            return ruleId;
        }

        @Override
        public String getRuleName() {
            return "Maximum Transfer Amount";
        }

        @Override
        public RuleType getType() {
            return RuleType.MAX_TRANSFER;
        }

        @Override
        public int getPriority() {
            return priority;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        @Override
        public Uni<RuleEvaluationResult> evaluate(TransferContext context) {
            return Uni.createFrom().item(() -> {
                long startTime = System.currentTimeMillis();

                // Forced transfers bypass max transfer limit
                if (context.isForcedTransfer()) {
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), true,
                            "Forced transfer - max limit bypassed",
                            System.currentTimeMillis() - startTime);
                }

                boolean passed = context.amount().compareTo(maxAmount) <= 0;
                String message = passed
                        ? String.format("Transfer amount %s within limit %s", context.amount(), maxAmount)
                        : String.format("Transfer amount %s exceeds maximum %s", context.amount(), maxAmount);

                return new RuleEvaluationResult(
                        ruleId, getRuleName(), passed, message,
                        System.currentTimeMillis() - startTime);
            });
        }

        @Override
        public void updateParameters(Map<String, Object> parameters) {
            if (parameters.containsKey("maxAmount")) {
                this.maxAmount = new BigInteger(parameters.get("maxAmount").toString());
            }
            if (parameters.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(parameters.get("enabled").toString());
            }
            if (parameters.containsKey("priority")) {
                this.priority = Integer.parseInt(parameters.get("priority").toString());
            }
        }

        public BigInteger getMaxAmount() {
            return maxAmount;
        }
    }

    /**
     * Country restriction rule
     */
    public static class CountryRestrictionRule implements ComplianceRule {
        private final String ruleId;
        private volatile Set<String> blockedCountries;
        private volatile Set<String> allowedCountries; // If set, only these are allowed
        private volatile boolean enabled = true;
        private volatile int priority = 50;

        public CountryRestrictionRule(String ruleId, Set<String> blockedCountries) {
            this.ruleId = ruleId;
            this.blockedCountries = ConcurrentHashMap.newKeySet();
            this.blockedCountries.addAll(blockedCountries);
            this.allowedCountries = null;
        }

        @Override
        public String getRuleId() {
            return ruleId;
        }

        @Override
        public String getRuleName() {
            return "Country Restriction";
        }

        @Override
        public RuleType getType() {
            return RuleType.COUNTRY_RESTRICTION;
        }

        @Override
        public int getPriority() {
            return priority;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        @Override
        public Uni<RuleEvaluationResult> evaluate(TransferContext context) {
            return Uni.createFrom().item(() -> {
                long startTime = System.currentTimeMillis();

                // Check sender country
                if (context.fromCountry().isPresent()) {
                    String fromCountry = context.fromCountry().get().toUpperCase();
                    if (isCountryBlocked(fromCountry)) {
                        return new RuleEvaluationResult(
                                ruleId, getRuleName(), false,
                                String.format("Sender country %s is restricted", fromCountry),
                                System.currentTimeMillis() - startTime);
                    }
                }

                // Check recipient country
                if (context.toCountry().isPresent()) {
                    String toCountry = context.toCountry().get().toUpperCase();
                    if (isCountryBlocked(toCountry)) {
                        return new RuleEvaluationResult(
                                ruleId, getRuleName(), false,
                                String.format("Recipient country %s is restricted", toCountry),
                                System.currentTimeMillis() - startTime);
                    }
                }

                return new RuleEvaluationResult(
                        ruleId, getRuleName(), true,
                        "Country restrictions passed",
                        System.currentTimeMillis() - startTime);
            });
        }

        private boolean isCountryBlocked(String countryCode) {
            if (allowedCountries != null && !allowedCountries.isEmpty()) {
                return !allowedCountries.contains(countryCode);
            }
            return blockedCountries.contains(countryCode);
        }

        @Override
        @SuppressWarnings("unchecked")
        public void updateParameters(Map<String, Object> parameters) {
            if (parameters.containsKey("blockedCountries")) {
                this.blockedCountries = ConcurrentHashMap.newKeySet();
                this.blockedCountries.addAll((Set<String>) parameters.get("blockedCountries"));
            }
            if (parameters.containsKey("allowedCountries")) {
                Object allowed = parameters.get("allowedCountries");
                if (allowed != null) {
                    this.allowedCountries = ConcurrentHashMap.newKeySet();
                    this.allowedCountries.addAll((Set<String>) allowed);
                } else {
                    this.allowedCountries = null;
                }
            }
            if (parameters.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(parameters.get("enabled").toString());
            }
            if (parameters.containsKey("priority")) {
                this.priority = Integer.parseInt(parameters.get("priority").toString());
            }
        }

        public Set<String> getBlockedCountries() {
            return Set.copyOf(blockedCountries);
        }
    }

    /**
     * Accredited investor rule
     */
    public static class AccreditedInvestorRule implements ComplianceRule {
        private final String ruleId;
        private volatile BigInteger thresholdAmount; // Amount above which accreditation is required
        private volatile Set<ClaimVerifier.ClaimTopic> acceptedClaims;
        private volatile boolean enabled = true;
        private volatile int priority = 75;

        public AccreditedInvestorRule(String ruleId, BigInteger thresholdAmount) {
            this.ruleId = ruleId;
            this.thresholdAmount = thresholdAmount;
            this.acceptedClaims = Set.of(
                    ClaimVerifier.ClaimTopic.ACCREDITED_INVESTOR,
                    ClaimVerifier.ClaimTopic.QUALIFIED_PURCHASER,
                    ClaimVerifier.ClaimTopic.PROFESSIONAL_INVESTOR,
                    ClaimVerifier.ClaimTopic.INSTITUTIONAL_INVESTOR);
        }

        @Override
        public String getRuleId() {
            return ruleId;
        }

        @Override
        public String getRuleName() {
            return "Accredited Investor Requirement";
        }

        @Override
        public RuleType getType() {
            return RuleType.ACCREDITED_INVESTOR;
        }

        @Override
        public int getPriority() {
            return priority;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        @Override
        public Uni<RuleEvaluationResult> evaluate(TransferContext context) {
            return Uni.createFrom().item(() -> {
                long startTime = System.currentTimeMillis();

                // Check if amount is below threshold
                if (context.amount().compareTo(thresholdAmount) < 0) {
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), true,
                            String.format("Amount %s below accreditation threshold %s",
                                    context.amount(), thresholdAmount),
                            System.currentTimeMillis() - startTime);
                }

                // Check recipient has accredited investor claim
                boolean hasAccreditation = context.toClaims().stream()
                        .anyMatch(acceptedClaims::contains);

                if (!hasAccreditation) {
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), false,
                            String.format("Recipient lacks accredited investor status for amount %s (threshold: %s)",
                                    context.amount(), thresholdAmount),
                            System.currentTimeMillis() - startTime);
                }

                return new RuleEvaluationResult(
                        ruleId, getRuleName(), true,
                        "Recipient has valid accredited investor status",
                        System.currentTimeMillis() - startTime);
            });
        }

        @Override
        @SuppressWarnings("unchecked")
        public void updateParameters(Map<String, Object> parameters) {
            if (parameters.containsKey("thresholdAmount")) {
                this.thresholdAmount = new BigInteger(parameters.get("thresholdAmount").toString());
            }
            if (parameters.containsKey("acceptedClaims")) {
                this.acceptedClaims = (Set<ClaimVerifier.ClaimTopic>) parameters.get("acceptedClaims");
            }
            if (parameters.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(parameters.get("enabled").toString());
            }
            if (parameters.containsKey("priority")) {
                this.priority = Integer.parseInt(parameters.get("priority").toString());
            }
        }

        public BigInteger getThresholdAmount() {
            return thresholdAmount;
        }
    }

    /**
     * Holding period rule (lock-up period)
     */
    public static class HoldingPeriodRule implements ComplianceRule {
        private final String ruleId;
        private final Map<String, Instant> holdingStartTimes = new ConcurrentHashMap<>();
        private volatile int holdingPeriodDays;
        private volatile boolean enabled = true;
        private volatile int priority = 60;

        public HoldingPeriodRule(String ruleId, int holdingPeriodDays) {
            this.ruleId = ruleId;
            this.holdingPeriodDays = holdingPeriodDays;
        }

        @Override
        public String getRuleId() {
            return ruleId;
        }

        @Override
        public String getRuleName() {
            return "Holding Period";
        }

        @Override
        public RuleType getType() {
            return RuleType.HOLDING_PERIOD;
        }

        @Override
        public int getPriority() {
            return priority;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        public void setHoldingStart(String wallet, Instant startTime) {
            holdingStartTimes.put(wallet.toLowerCase(), startTime);
        }

        @Override
        public Uni<RuleEvaluationResult> evaluate(TransferContext context) {
            return Uni.createFrom().item(() -> {
                long startTime = System.currentTimeMillis();
                String fromLower = context.from().toLowerCase();

                Instant holdingStart = holdingStartTimes.get(fromLower);
                if (holdingStart == null) {
                    // No holding period set, allow transfer
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), true,
                            "No holding period restriction for sender",
                            System.currentTimeMillis() - startTime);
                }

                Instant releaseDate = holdingStart.plus(holdingPeriodDays, ChronoUnit.DAYS);
                if (Instant.now().isBefore(releaseDate)) {
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), false,
                            String.format("Tokens locked until %s (holding period: %d days)",
                                    releaseDate, holdingPeriodDays),
                            System.currentTimeMillis() - startTime);
                }

                return new RuleEvaluationResult(
                        ruleId, getRuleName(), true,
                        "Holding period completed",
                        System.currentTimeMillis() - startTime);
            });
        }

        @Override
        public void updateParameters(Map<String, Object> parameters) {
            if (parameters.containsKey("holdingPeriodDays")) {
                this.holdingPeriodDays = Integer.parseInt(parameters.get("holdingPeriodDays").toString());
            }
            if (parameters.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(parameters.get("enabled").toString());
            }
            if (parameters.containsKey("priority")) {
                this.priority = Integer.parseInt(parameters.get("priority").toString());
            }
        }

        public int getHoldingPeriodDays() {
            return holdingPeriodDays;
        }
    }

    /**
     * Maximum balance rule
     */
    public static class MaxBalanceRule implements ComplianceRule {
        private final String ruleId;
        private final Map<String, BigInteger> balances = new ConcurrentHashMap<>();
        private volatile BigInteger maxBalance;
        private volatile boolean enabled = true;
        private volatile int priority = 80;

        public MaxBalanceRule(String ruleId, BigInteger maxBalance) {
            this.ruleId = ruleId;
            this.maxBalance = maxBalance;
        }

        @Override
        public String getRuleId() {
            return ruleId;
        }

        @Override
        public String getRuleName() {
            return "Maximum Balance";
        }

        @Override
        public RuleType getType() {
            return RuleType.MAX_BALANCE;
        }

        @Override
        public int getPriority() {
            return priority;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        public void updateBalance(String wallet, BigInteger balance) {
            balances.put(wallet.toLowerCase(), balance);
        }

        @Override
        public Uni<RuleEvaluationResult> evaluate(TransferContext context) {
            return Uni.createFrom().item(() -> {
                long startTime = System.currentTimeMillis();
                String toLower = context.to().toLowerCase();

                BigInteger currentBalance = balances.getOrDefault(toLower, BigInteger.ZERO);
                BigInteger newBalance = currentBalance.add(context.amount());

                if (newBalance.compareTo(maxBalance) > 0) {
                    return new RuleEvaluationResult(
                            ruleId, getRuleName(), false,
                            String.format("Transfer would exceed max balance. Current: %s, After: %s, Max: %s",
                                    currentBalance, newBalance, maxBalance),
                            System.currentTimeMillis() - startTime);
                }

                return new RuleEvaluationResult(
                        ruleId, getRuleName(), true,
                        String.format("New balance %s within limit %s", newBalance, maxBalance),
                        System.currentTimeMillis() - startTime);
            });
        }

        @Override
        public void updateParameters(Map<String, Object> parameters) {
            if (parameters.containsKey("maxBalance")) {
                this.maxBalance = new BigInteger(parameters.get("maxBalance").toString());
            }
            if (parameters.containsKey("enabled")) {
                this.enabled = Boolean.parseBoolean(parameters.get("enabled").toString());
            }
            if (parameters.containsKey("priority")) {
                this.priority = Integer.parseInt(parameters.get("priority").toString());
            }
        }

        public BigInteger getMaxBalance() {
            return maxBalance;
        }
    }

    // ==================== Rule Management ====================

    /**
     * Add a compliance rule
     */
    public Uni<Boolean> addRule(ComplianceRule rule) {
        return Uni.createFrom().item(() -> {
            if (rules.containsKey(rule.getRuleId())) {
                Log.warnf("Rule already exists: %s", rule.getRuleId());
                return false;
            }

            rules.put(rule.getRuleId(), rule);
            updateExecutionOrder();

            emitEvent(new ComplianceEvent(
                    generateTransactionId(),
                    ComplianceEventType.RULE_ADDED,
                    String.format("Rule added: %s (%s), priority: %d",
                            rule.getRuleName(), rule.getRuleId(), rule.getPriority()),
                    Instant.now()));

            Log.infof("Compliance rule added: id=%s, name=%s, type=%s, priority=%d",
                    rule.getRuleId(), rule.getRuleName(), rule.getType(), rule.getPriority());
            return true;
        });
    }

    /**
     * Remove a compliance rule
     */
    public Uni<Boolean> removeRule(String ruleId) {
        return Uni.createFrom().item(() -> {
            ComplianceRule removed = rules.remove(ruleId);
            if (removed == null) {
                Log.warnf("Rule not found: %s", ruleId);
                return false;
            }

            updateExecutionOrder();

            emitEvent(new ComplianceEvent(
                    generateTransactionId(),
                    ComplianceEventType.RULE_REMOVED,
                    String.format("Rule removed: %s (%s)", removed.getRuleName(), ruleId),
                    Instant.now()));

            Log.infof("Compliance rule removed: id=%s, name=%s", ruleId, removed.getRuleName());
            return true;
        });
    }

    /**
     * Update rule parameters
     */
    public Uni<Boolean> updateRule(String ruleId, Map<String, Object> parameters) {
        return Uni.createFrom().item(() -> {
            ComplianceRule rule = rules.get(ruleId);
            if (rule == null) {
                Log.warnf("Rule not found: %s", ruleId);
                return false;
            }

            rule.updateParameters(parameters);
            updateExecutionOrder();

            emitEvent(new ComplianceEvent(
                    generateTransactionId(),
                    ComplianceEventType.RULE_UPDATED,
                    String.format("Rule updated: %s (%s)", rule.getRuleName(), ruleId),
                    Instant.now()));

            Log.infof("Compliance rule updated: id=%s, name=%s", ruleId, rule.getRuleName());
            return true;
        });
    }

    /**
     * Get a rule by ID
     */
    public Optional<ComplianceRule> getRule(String ruleId) {
        return Optional.ofNullable(rules.get(ruleId));
    }

    /**
     * Get all active rules
     */
    public List<ComplianceRule> getAllRules() {
        return rules.values().stream()
                .sorted(Comparator.comparingInt(ComplianceRule::getPriority))
                .toList();
    }

    /**
     * Get rules by type
     */
    public List<ComplianceRule> getRulesByType(RuleType type) {
        return rules.values().stream()
                .filter(r -> r.getType() == type)
                .sorted(Comparator.comparingInt(ComplianceRule::getPriority))
                .toList();
    }

    private void updateExecutionOrder() {
        List<String> newOrder = rules.values().stream()
                .filter(ComplianceRule::isEnabled)
                .sorted(Comparator.comparingInt(ComplianceRule::getPriority))
                .map(ComplianceRule::getRuleId)
                .toList();

        ruleExecutionOrder.clear();
        ruleExecutionOrder.addAll(newOrder);

        Log.debugf("Rule execution order updated: %s", ruleExecutionOrder);
    }

    // ==================== Transfer Evaluation ====================

    /**
     * Evaluate a transfer against all compliance rules
     */
    public Uni<ComplianceResult> evaluateTransfer(String from, String to, BigInteger amount, boolean isForcedTransfer) {
        String transactionId = generateTransactionId();

        return buildTransferContext(from, to, amount, isForcedTransfer)
                .flatMap(context -> evaluateRules(context, transactionId))
                .invoke(result -> logAudit(from, to, amount, result, transactionId));
    }

    private Uni<TransferContext> buildTransferContext(String from, String to, BigInteger amount,
            boolean isForcedTransfer) {
        return Uni.combine().all().unis(
                identityRegistry.getCountryCode(from),
                identityRegistry.getCountryCode(to),
                identityRegistry.getInvestorId(from),
                identityRegistry.getInvestorId(to),
                identityRegistry.getVerifiedClaims(from),
                identityRegistry.getVerifiedClaims(to)).asTuple().map(
                        tuple -> new TransferContext(
                                from,
                                to,
                                amount,
                                isForcedTransfer,
                                Optional.ofNullable(tuple.getItem1()),
                                Optional.ofNullable(tuple.getItem2()),
                                Optional.ofNullable(tuple.getItem3()),
                                Optional.ofNullable(tuple.getItem4()),
                                tuple.getItem5(),
                                tuple.getItem6()));
    }

    private Uni<ComplianceResult> evaluateRules(TransferContext context, String transactionId) {
        if (ruleExecutionOrder.isEmpty()) {
            Log.debugf("No compliance rules configured, allowing transfer");
            return Uni.createFrom().item(new ComplianceResult(
                    true,
                    "No compliance rules configured",
                    List.of(),
                    Instant.now(),
                    transactionId));
        }

        return Multi.createFrom().iterable(ruleExecutionOrder)
                .onItem().transformToUniAndMerge(ruleId -> {
                    ComplianceRule rule = rules.get(ruleId);
                    if (rule == null || !rule.isEnabled()) {
                        return Uni.createFrom().nullItem();
                    }
                    return rule.evaluate(context);
                })
                .filter(result -> result != null)
                .collect().asList()
                .map(results -> {
                    List<RuleEvaluationResult> failedRules = results.stream()
                            .filter(r -> !r.passed())
                            .toList();

                    boolean approved = failedRules.isEmpty();
                    String reason = approved ? "All compliance rules passed"
                            : "Failed rules: " + failedRules.stream()
                                    .map(r -> r.ruleName() + " - " + r.message())
                                    .toList();

                    if (approved) {
                        emitEvent(new ComplianceEvent(
                                transactionId,
                                ComplianceEventType.TRANSFER_APPROVED,
                                String.format("Transfer approved: %s -> %s, amount: %s",
                                        context.from(), context.to(), context.amount()),
                                Instant.now()));
                    } else {
                        emitEvent(new ComplianceEvent(
                                transactionId,
                                ComplianceEventType.TRANSFER_REJECTED,
                                String.format("Transfer rejected: %s -> %s, amount: %s, reason: %s",
                                        context.from(), context.to(), context.amount(), reason),
                                Instant.now()));
                    }

                    Log.infof("Compliance evaluation completed: approved=%s, rulesEvaluated=%d, rulesFailed=%d",
                            approved, results.size(), failedRules.size());

                    return new ComplianceResult(
                            approved,
                            reason,
                            results,
                            Instant.now(),
                            transactionId);
                });
    }

    // ==================== Audit Logging ====================

    private void logAudit(String from, String to, BigInteger amount, ComplianceResult result, String transactionId) {
        List<String> failedRules = result.ruleResults().stream()
                .filter(r -> !r.passed())
                .map(RuleEvaluationResult::ruleId)
                .toList();

        AuditLogEntry entry = new AuditLogEntry(
                auditSequence.incrementAndGet(),
                transactionId,
                from,
                to,
                amount,
                result.approved(),
                result.reason(),
                failedRules,
                Instant.now());

        auditLog.add(entry);

        // Keep audit log size manageable (last 10000 entries)
        while (auditLog.size() > 10000) {
            auditLog.remove(0);
        }

        emitEvent(new ComplianceEvent(
                transactionId,
                ComplianceEventType.AUDIT_GENERATED,
                String.format("Audit entry %d created", entry.sequence()),
                Instant.now()));

        Log.debugf("Audit log entry created: seq=%d, txId=%s, approved=%s",
                (Object) entry.sequence(), transactionId, (Object) result.approved());
    }

    /**
     * Get audit log entries
     */
    public List<AuditLogEntry> getAuditLog(int limit) {
        int startIndex = Math.max(0, auditLog.size() - limit);
        return new ArrayList<>(auditLog.subList(startIndex, auditLog.size()));
    }

    /**
     * Get audit log entries for a specific wallet
     */
    public List<AuditLogEntry> getAuditLogForWallet(String wallet, int limit) {
        String walletLower = wallet.toLowerCase();
        return auditLog.stream()
                .filter(e -> e.from().equalsIgnoreCase(walletLower) || e.to().equalsIgnoreCase(walletLower))
                .sorted((a, b) -> Long.compare(b.sequence(), a.sequence()))
                .limit(limit)
                .toList();
    }

    /**
     * Get failed transfers
     */
    public List<AuditLogEntry> getFailedTransfers(int limit) {
        return auditLog.stream()
                .filter(e -> !e.approved())
                .sorted((a, b) -> Long.compare(b.sequence(), a.sequence()))
                .limit(limit)
                .toList();
    }

    // ==================== Convenience Rule Factories ====================

    /**
     * Create and add a max transfer rule
     */
    public Uni<Boolean> addMaxTransferRule(String ruleId, BigInteger maxAmount) {
        return addRule(new MaxTransferRule(ruleId, maxAmount));
    }

    /**
     * Create and add a country restriction rule
     */
    public Uni<Boolean> addCountryRestrictionRule(String ruleId, Set<String> blockedCountries) {
        return addRule(new CountryRestrictionRule(ruleId, blockedCountries));
    }

    /**
     * Create and add an accredited investor rule
     */
    public Uni<Boolean> addAccreditedInvestorRule(String ruleId, BigInteger thresholdAmount) {
        return addRule(new AccreditedInvestorRule(ruleId, thresholdAmount));
    }

    /**
     * Create and add a holding period rule
     */
    public Uni<Boolean> addHoldingPeriodRule(String ruleId, int holdingPeriodDays) {
        return addRule(new HoldingPeriodRule(ruleId, holdingPeriodDays));
    }

    /**
     * Create and add a max balance rule
     */
    public Uni<Boolean> addMaxBalanceRule(String ruleId, BigInteger maxBalance) {
        return addRule(new MaxBalanceRule(ruleId, maxBalance));
    }

    // ==================== Statistics ====================

    /**
     * Get total rules count
     */
    public int getTotalRulesCount() {
        return rules.size();
    }

    /**
     * Get active rules count
     */
    public int getActiveRulesCount() {
        return (int) rules.values().stream().filter(ComplianceRule::isEnabled).count();
    }

    /**
     * Get audit log size
     */
    public int getAuditLogSize() {
        return auditLog.size();
    }

    /**
     * Get approval rate
     */
    public double getApprovalRate() {
        if (auditLog.isEmpty())
            return 1.0;
        long approved = auditLog.stream().filter(AuditLogEntry::approved).count();
        return (double) approved / auditLog.size();
    }

    // ==================== Event Management ====================

    /**
     * Register an event listener
     */
    public void addEventListener(ComplianceEventListener listener) {
        eventListeners.add(listener);
        Log.debugf("Compliance event listener added: %s", listener.getClass().getSimpleName());
    }

    /**
     * Remove an event listener
     */
    public void removeEventListener(ComplianceEventListener listener) {
        eventListeners.remove(listener);
        Log.debugf("Compliance event listener removed: %s", listener.getClass().getSimpleName());
    }

    private void emitEvent(ComplianceEvent event) {
        for (ComplianceEventListener listener : eventListeners) {
            try {
                listener.onComplianceEvent(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying compliance event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private String generateTransactionId() {
        return "ce-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
