package io.aurigraph.v11.rwa.erc3643;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Compliance Rules Engine for ERC-3643 Security Tokens
 *
 * Implements configurable transfer rules for compliant security token operations.
 * Enforces regulatory requirements, investor limits, and transfer restrictions.
 *
 * Key Features:
 * - Configurable transfer rules per token
 * - Maximum holder count per jurisdiction
 * - Holding period requirements (lock-up periods)
 * - Transfer amount limits (daily, per-transaction)
 * - Blacklist/whitelist support
 * - Investor category restrictions
 * - Cross-border transfer rules
 * - Time-based transfer windows
 *
 * Rule Types:
 * 1. JURISDICTION_LIMIT - Max holders per country
 * 2. TOTAL_HOLDER_LIMIT - Max total holders
 * 3. HOLDING_PERIOD - Lock-up requirements
 * 4. TRANSFER_AMOUNT_LIMIT - Max transfer amounts
 * 5. INVESTOR_TYPE_RESTRICTION - Restrict by investor type
 * 6. BLACKLIST - Blocked addresses
 * 7. WHITELIST - Only allowed addresses
 * 8. CROSS_BORDER - Cross-border transfer rules
 * 9. TIME_WINDOW - Trading hours restrictions
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 */
@ApplicationScoped
public class ComplianceRulesEngine {

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ClaimVerifier claimVerifier;

    // Rule storage per token
    private final Map<String, TokenComplianceConfig> tokenConfigs = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> tokenBlacklists = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> tokenWhitelists = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Instant>> holdingStartDates = new ConcurrentHashMap<>();
    private final Map<String, Map<String, TransferHistory>> transferHistories = new ConcurrentHashMap<>();

    /**
     * Token Compliance Configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenComplianceConfig {
        private String tokenId;
        private boolean enabled;

        // Holder limits
        private int maxTotalHolders;
        private Map<String, Integer> maxHoldersByCountry;  // Country code -> max holders

        // Transfer limits
        private BigDecimal maxTransferAmountPerTx;
        private BigDecimal maxTransferAmountDaily;
        private BigDecimal minTransferAmount;

        // Holding period (lock-up)
        private Duration holdingPeriod;
        private boolean holdingPeriodEnabled;

        // Investor type restrictions
        private Set<IdentityRegistry.InvestorType> allowedInvestorTypes;
        private boolean requireAccreditedInvestor;

        // Jurisdiction restrictions
        private Set<String> allowedCountries;
        private Set<String> blockedCountries;
        private boolean allowCrossBorderTransfers;

        // Time-based restrictions
        private boolean tradingWindowEnabled;
        private int tradingWindowStartHour;  // 0-23 UTC
        private int tradingWindowEndHour;    // 0-23 UTC
        private Set<Integer> tradingDays;    // 1-7 (Monday-Sunday)

        // Whitelist mode
        private boolean whitelistEnabled;

        // Created/updated tracking
        private Instant createdAt;
        private Instant updatedAt;
        private String updatedBy;
    }

    /**
     * Transfer History for tracking daily limits
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferHistory {
        private String address;
        private BigDecimal dailyTransferAmount;
        private Instant lastTransferDate;
        private int dailyTransferCount;
        private List<TransferRecord> recentTransfers;
    }

    /**
     * Individual transfer record
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferRecord {
        private String transactionId;
        private BigDecimal amount;
        private String counterparty;
        private Instant timestamp;
        private TransferDirection direction;
    }

    /**
     * Transfer direction
     */
    public enum TransferDirection {
        INCOMING,
        OUTGOING
    }

    /**
     * Compliance check result
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceCheckResult {
        private boolean compliant;
        private String tokenId;
        private String sender;
        private String recipient;
        private BigDecimal amount;
        private List<String> failedRules;
        private List<String> warnings;
        private Instant checkedAt;
        private Map<String, Object> details;
    }

    /**
     * Compliance rule types
     */
    public enum RuleType {
        JURISDICTION_LIMIT,
        TOTAL_HOLDER_LIMIT,
        HOLDING_PERIOD,
        TRANSFER_AMOUNT_LIMIT,
        INVESTOR_TYPE_RESTRICTION,
        BLACKLIST,
        WHITELIST,
        CROSS_BORDER,
        TIME_WINDOW
    }

    /**
     * Initialize compliance configuration for a token
     *
     * @param tokenId Token identifier
     * @param config Initial configuration
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> initializeToken(String tokenId, TokenComplianceConfig config, String callerAddress) {
        return Uni.createFrom().item(() -> {
            config.setTokenId(tokenId);
            config.setCreatedAt(Instant.now());
            config.setUpdatedAt(Instant.now());
            config.setUpdatedBy(callerAddress);
            config.setEnabled(true);

            if (config.getAllowedInvestorTypes() == null) {
                config.setAllowedInvestorTypes(EnumSet.allOf(IdentityRegistry.InvestorType.class));
            }
            if (config.getMaxHoldersByCountry() == null) {
                config.setMaxHoldersByCountry(new HashMap<>());
            }
            if (config.getTradingDays() == null) {
                config.setTradingDays(Set.of(1, 2, 3, 4, 5)); // Monday-Friday
            }

            tokenConfigs.put(tokenId, config);
            tokenBlacklists.put(tokenId, ConcurrentHashMap.newKeySet());
            tokenWhitelists.put(tokenId, ConcurrentHashMap.newKeySet());
            holdingStartDates.put(tokenId, new ConcurrentHashMap<>());
            transferHistories.put(tokenId, new ConcurrentHashMap<>());

            Log.infof("Initialized compliance config for token: %s", tokenId);
            return true;
        });
    }

    /**
     * Update compliance configuration
     *
     * @param tokenId Token identifier
     * @param config Updated configuration
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateConfig(String tokenId, TokenComplianceConfig config, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig existing = tokenConfigs.get(tokenId);
            if (existing == null) {
                throw new TokenNotConfiguredException("Token not configured: " + tokenId);
            }

            config.setTokenId(tokenId);
            config.setCreatedAt(existing.getCreatedAt());
            config.setUpdatedAt(Instant.now());
            config.setUpdatedBy(callerAddress);

            tokenConfigs.put(tokenId, config);

            Log.infof("Updated compliance config for token: %s", tokenId);
            return true;
        });
    }

    /**
     * Check if a transfer can occur (main compliance check)
     *
     * @param tokenId Token identifier
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return Uni<Boolean> whether transfer is allowed
     */
    public Uni<Boolean> canTransfer(String tokenId, String from, String to, BigDecimal amount) {
        return performComplianceCheck(tokenId, from, to, amount)
                .map(ComplianceCheckResult::isCompliant);
    }

    /**
     * Check if an address can receive tokens
     *
     * @param tokenId Token identifier
     * @param to Recipient address
     * @param amount Amount to receive
     * @return Uni<Boolean> whether receive is allowed
     */
    public Uni<Boolean> canReceive(String tokenId, String to, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig config = tokenConfigs.get(tokenId);
            if (config == null || !config.isEnabled()) {
                return true; // No restrictions if not configured
            }

            List<String> failures = new ArrayList<>();

            // Check blacklist
            if (tokenBlacklists.get(tokenId).contains(to)) {
                failures.add("Recipient is blacklisted");
            }

            // Check whitelist mode
            if (config.isWhitelistEnabled() && !tokenWhitelists.get(tokenId).contains(to)) {
                failures.add("Recipient not in whitelist");
            }

            // Check investor type
            IdentityRegistry.InvestorType investorType =
                identityRegistry.getInvestorType(to).await().indefinitely();

            if (investorType != null && !config.getAllowedInvestorTypes().contains(investorType)) {
                failures.add("Investor type not allowed: " + investorType);
            }

            // Check accreditation requirement
            if (config.isRequireAccreditedInvestor()) {
                boolean accredited = identityRegistry.isAccreditedInvestor(to).await().indefinitely();
                if (!accredited) {
                    failures.add("Accredited investor status required");
                }
            }

            // Check country restrictions
            String countryCode = identityRegistry.getCountryCode(to).await().indefinitely();
            if (countryCode != null) {
                if (config.getBlockedCountries() != null &&
                    config.getBlockedCountries().contains(countryCode)) {
                    failures.add("Recipient country is blocked: " + countryCode);
                }

                if (config.getAllowedCountries() != null &&
                    !config.getAllowedCountries().isEmpty() &&
                    !config.getAllowedCountries().contains(countryCode)) {
                    failures.add("Recipient country not allowed: " + countryCode);
                }
            }

            if (!failures.isEmpty()) {
                Log.debugf("Receive check failed for %s: %s", to, failures);
            }

            return failures.isEmpty();
        });
    }

    /**
     * Perform full compliance check
     *
     * @param tokenId Token identifier
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return Uni<ComplianceCheckResult> detailed compliance result
     */
    public Uni<ComplianceCheckResult> performComplianceCheck(
            String tokenId,
            String from,
            String to,
            BigDecimal amount
    ) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig config = tokenConfigs.get(tokenId);
            List<String> failures = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            Map<String, Object> details = new HashMap<>();

            if (config == null) {
                return ComplianceCheckResult.builder()
                        .compliant(true)
                        .tokenId(tokenId)
                        .sender(from)
                        .recipient(to)
                        .amount(amount)
                        .failedRules(failures)
                        .warnings(List.of("No compliance config found, allowing transfer"))
                        .checkedAt(Instant.now())
                        .details(details)
                        .build();
            }

            if (!config.isEnabled()) {
                return ComplianceCheckResult.builder()
                        .compliant(true)
                        .tokenId(tokenId)
                        .sender(from)
                        .recipient(to)
                        .amount(amount)
                        .failedRules(failures)
                        .warnings(List.of("Compliance is disabled for this token"))
                        .checkedAt(Instant.now())
                        .details(details)
                        .build();
            }

            // 1. Check blacklist
            checkBlacklist(tokenId, from, to, failures, details);

            // 2. Check whitelist
            checkWhitelist(tokenId, config, from, to, failures, details);

            // 3. Check holding period
            checkHoldingPeriod(tokenId, config, from, failures, details);

            // 4. Check transfer amount limits
            checkTransferLimits(tokenId, config, from, amount, failures, warnings, details);

            // 5. Check investor type restrictions
            checkInvestorTypeRestrictions(config, to, failures, details);

            // 6. Check jurisdiction/country restrictions
            checkJurisdictionRestrictions(config, from, to, failures, warnings, details);

            // 7. Check trading window
            checkTradingWindow(config, failures, details);

            // 8. Check holder count limits
            checkHolderLimits(tokenId, config, to, failures, details);

            boolean compliant = failures.isEmpty();

            Log.debugf("Compliance check for %s->%s (%s): compliant=%s, failures=%s",
                      from, to, amount, compliant, failures);

            return ComplianceCheckResult.builder()
                    .compliant(compliant)
                    .tokenId(tokenId)
                    .sender(from)
                    .recipient(to)
                    .amount(amount)
                    .failedRules(failures)
                    .warnings(warnings)
                    .checkedAt(Instant.now())
                    .details(details)
                    .build();
        });
    }

    /**
     * Add address to blacklist
     */
    public Uni<Boolean> addToBlacklist(String tokenId, String address, String callerAddress, String reason) {
        return Uni.createFrom().item(() -> {
            Set<String> blacklist = tokenBlacklists.get(tokenId);
            if (blacklist == null) {
                throw new TokenNotConfiguredException("Token not configured: " + tokenId);
            }
            blacklist.add(address);
            Log.warnf("Added %s to blacklist for token %s. Reason: %s", address, tokenId, reason);
            return true;
        });
    }

    /**
     * Remove address from blacklist
     */
    public Uni<Boolean> removeFromBlacklist(String tokenId, String address, String callerAddress) {
        return Uni.createFrom().item(() -> {
            Set<String> blacklist = tokenBlacklists.get(tokenId);
            if (blacklist != null) {
                blacklist.remove(address);
                Log.infof("Removed %s from blacklist for token %s", address, tokenId);
            }
            return true;
        });
    }

    /**
     * Add address to whitelist
     */
    public Uni<Boolean> addToWhitelist(String tokenId, String address, String callerAddress) {
        return Uni.createFrom().item(() -> {
            Set<String> whitelist = tokenWhitelists.get(tokenId);
            if (whitelist == null) {
                throw new TokenNotConfiguredException("Token not configured: " + tokenId);
            }
            whitelist.add(address);
            Log.infof("Added %s to whitelist for token %s", address, tokenId);
            return true;
        });
    }

    /**
     * Remove address from whitelist
     */
    public Uni<Boolean> removeFromWhitelist(String tokenId, String address, String callerAddress) {
        return Uni.createFrom().item(() -> {
            Set<String> whitelist = tokenWhitelists.get(tokenId);
            if (whitelist != null) {
                whitelist.remove(address);
                Log.infof("Removed %s from whitelist for token %s", address, tokenId);
            }
            return true;
        });
    }

    /**
     * Record token acquisition (for holding period tracking)
     */
    public Uni<Boolean> recordAcquisition(String tokenId, String address, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            Map<String, Instant> holdings = holdingStartDates.get(tokenId);
            if (holdings != null && !holdings.containsKey(address)) {
                holdings.put(address, Instant.now());
                Log.debugf("Recorded acquisition for %s on token %s", address, tokenId);
            }
            return true;
        });
    }

    /**
     * Record a completed transfer (for daily limits)
     */
    public Uni<Boolean> recordTransfer(
            String tokenId,
            String from,
            String to,
            BigDecimal amount,
            String transactionId
    ) {
        return Uni.createFrom().item(() -> {
            Map<String, TransferHistory> histories = transferHistories.get(tokenId);
            if (histories == null) {
                return true;
            }

            Instant now = Instant.now();

            // Update sender history
            TransferHistory senderHistory = histories.computeIfAbsent(from,
                k -> TransferHistory.builder()
                        .address(from)
                        .dailyTransferAmount(BigDecimal.ZERO)
                        .dailyTransferCount(0)
                        .recentTransfers(new ArrayList<>())
                        .build());

            // Reset daily counters if new day
            if (senderHistory.getLastTransferDate() == null ||
                !isSameDay(senderHistory.getLastTransferDate(), now)) {
                senderHistory.setDailyTransferAmount(BigDecimal.ZERO);
                senderHistory.setDailyTransferCount(0);
            }

            senderHistory.setDailyTransferAmount(
                senderHistory.getDailyTransferAmount().add(amount));
            senderHistory.setDailyTransferCount(senderHistory.getDailyTransferCount() + 1);
            senderHistory.setLastTransferDate(now);
            senderHistory.getRecentTransfers().add(
                TransferRecord.builder()
                        .transactionId(transactionId)
                        .amount(amount)
                        .counterparty(to)
                        .timestamp(now)
                        .direction(TransferDirection.OUTGOING)
                        .build()
            );

            // Update receiver holding start date
            recordAcquisition(tokenId, to, amount).await().indefinitely();

            return true;
        });
    }

    /**
     * Set maximum holders for a specific country
     */
    public Uni<Boolean> setMaxHoldersForCountry(
            String tokenId,
            String countryCode,
            int maxHolders,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig config = tokenConfigs.get(tokenId);
            if (config == null) {
                throw new TokenNotConfiguredException("Token not configured: " + tokenId);
            }
            config.getMaxHoldersByCountry().put(countryCode.toUpperCase(), maxHolders);
            config.setUpdatedAt(Instant.now());
            config.setUpdatedBy(callerAddress);
            Log.infof("Set max holders for country %s to %d for token %s",
                     countryCode, maxHolders, tokenId);
            return true;
        });
    }

    /**
     * Set holding period requirement
     */
    public Uni<Boolean> setHoldingPeriod(
            String tokenId,
            Duration holdingPeriod,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig config = tokenConfigs.get(tokenId);
            if (config == null) {
                throw new TokenNotConfiguredException("Token not configured: " + tokenId);
            }
            config.setHoldingPeriod(holdingPeriod);
            config.setHoldingPeriodEnabled(true);
            config.setUpdatedAt(Instant.now());
            config.setUpdatedBy(callerAddress);
            Log.infof("Set holding period to %s for token %s", holdingPeriod, tokenId);
            return true;
        });
    }

    /**
     * Get compliance configuration for a token
     */
    public Uni<TokenComplianceConfig> getConfig(String tokenId) {
        return Uni.createFrom().item(() -> tokenConfigs.get(tokenId));
    }

    /**
     * Check if address is blacklisted
     */
    public Uni<Boolean> isBlacklisted(String tokenId, String address) {
        return Uni.createFrom().item(() -> {
            Set<String> blacklist = tokenBlacklists.get(tokenId);
            return blacklist != null && blacklist.contains(address);
        });
    }

    /**
     * Check if address is whitelisted
     */
    public Uni<Boolean> isWhitelisted(String tokenId, String address) {
        return Uni.createFrom().item(() -> {
            Set<String> whitelist = tokenWhitelists.get(tokenId);
            return whitelist != null && whitelist.contains(address);
        });
    }

    /**
     * Get remaining holding period for an address
     */
    public Uni<Duration> getRemainingHoldingPeriod(String tokenId, String address) {
        return Uni.createFrom().item(() -> {
            TokenComplianceConfig config = tokenConfigs.get(tokenId);
            if (config == null || !config.isHoldingPeriodEnabled()) {
                return Duration.ZERO;
            }

            Map<String, Instant> holdings = holdingStartDates.get(tokenId);
            if (holdings == null) {
                return Duration.ZERO;
            }

            Instant acquisitionDate = holdings.get(address);
            if (acquisitionDate == null) {
                return Duration.ZERO;
            }

            Instant releaseDate = acquisitionDate.plus(config.getHoldingPeriod());
            if (Instant.now().isAfter(releaseDate)) {
                return Duration.ZERO;
            }

            return Duration.between(Instant.now(), releaseDate);
        });
    }

    // ============== Private Compliance Check Methods ==============

    private void checkBlacklist(
            String tokenId,
            String from,
            String to,
            List<String> failures,
            Map<String, Object> details
    ) {
        Set<String> blacklist = tokenBlacklists.get(tokenId);
        if (blacklist != null) {
            if (blacklist.contains(from)) {
                failures.add("BLACKLIST: Sender is blacklisted");
                details.put("blacklistedSender", true);
            }
            if (blacklist.contains(to)) {
                failures.add("BLACKLIST: Recipient is blacklisted");
                details.put("blacklistedRecipient", true);
            }
        }
    }

    private void checkWhitelist(
            String tokenId,
            TokenComplianceConfig config,
            String from,
            String to,
            List<String> failures,
            Map<String, Object> details
    ) {
        if (config.isWhitelistEnabled()) {
            Set<String> whitelist = tokenWhitelists.get(tokenId);
            if (whitelist != null) {
                if (!whitelist.contains(from)) {
                    failures.add("WHITELIST: Sender not whitelisted");
                    details.put("senderWhitelisted", false);
                }
                if (!whitelist.contains(to)) {
                    failures.add("WHITELIST: Recipient not whitelisted");
                    details.put("recipientWhitelisted", false);
                }
            }
        }
    }

    private void checkHoldingPeriod(
            String tokenId,
            TokenComplianceConfig config,
            String from,
            List<String> failures,
            Map<String, Object> details
    ) {
        if (config.isHoldingPeriodEnabled() && config.getHoldingPeriod() != null) {
            Map<String, Instant> holdings = holdingStartDates.get(tokenId);
            if (holdings != null) {
                Instant acquisitionDate = holdings.get(from);
                if (acquisitionDate != null) {
                    Instant releaseDate = acquisitionDate.plus(config.getHoldingPeriod());
                    if (Instant.now().isBefore(releaseDate)) {
                        failures.add("HOLDING_PERIOD: Tokens still in lock-up period");
                        details.put("holdingPeriodEnd", releaseDate.toString());
                        details.put("remainingDays",
                            Duration.between(Instant.now(), releaseDate).toDays());
                    }
                }
            }
        }
    }

    private void checkTransferLimits(
            String tokenId,
            TokenComplianceConfig config,
            String from,
            BigDecimal amount,
            List<String> failures,
            List<String> warnings,
            Map<String, Object> details
    ) {
        // Check minimum amount
        if (config.getMinTransferAmount() != null &&
            amount.compareTo(config.getMinTransferAmount()) < 0) {
            failures.add("TRANSFER_LIMIT: Amount below minimum");
            details.put("minTransferAmount", config.getMinTransferAmount());
        }

        // Check max per-transaction amount
        if (config.getMaxTransferAmountPerTx() != null &&
            amount.compareTo(config.getMaxTransferAmountPerTx()) > 0) {
            failures.add("TRANSFER_LIMIT: Amount exceeds per-transaction limit");
            details.put("maxPerTx", config.getMaxTransferAmountPerTx());
        }

        // Check daily limit
        if (config.getMaxTransferAmountDaily() != null) {
            Map<String, TransferHistory> histories = transferHistories.get(tokenId);
            if (histories != null) {
                TransferHistory history = histories.get(from);
                if (history != null && isSameDay(history.getLastTransferDate(), Instant.now())) {
                    BigDecimal newDailyTotal = history.getDailyTransferAmount().add(amount);
                    if (newDailyTotal.compareTo(config.getMaxTransferAmountDaily()) > 0) {
                        failures.add("TRANSFER_LIMIT: Daily transfer limit exceeded");
                        details.put("currentDailyTotal", history.getDailyTransferAmount());
                        details.put("maxDaily", config.getMaxTransferAmountDaily());
                    } else if (newDailyTotal.compareTo(
                            config.getMaxTransferAmountDaily().multiply(new BigDecimal("0.8"))) > 0) {
                        warnings.add("Approaching daily transfer limit");
                    }
                }
            }
        }
    }

    private void checkInvestorTypeRestrictions(
            TokenComplianceConfig config,
            String to,
            List<String> failures,
            Map<String, Object> details
    ) {
        if (config.getAllowedInvestorTypes() != null && !config.getAllowedInvestorTypes().isEmpty()) {
            IdentityRegistry.InvestorType investorType =
                identityRegistry.getInvestorType(to).await().indefinitely();

            if (investorType != null && !config.getAllowedInvestorTypes().contains(investorType)) {
                failures.add("INVESTOR_TYPE: Recipient investor type not allowed");
                details.put("recipientInvestorType", investorType);
                details.put("allowedTypes", config.getAllowedInvestorTypes());
            }
        }

        if (config.isRequireAccreditedInvestor()) {
            boolean accredited = identityRegistry.isAccreditedInvestor(to).await().indefinitely();
            if (!accredited) {
                failures.add("INVESTOR_TYPE: Accredited investor status required");
                details.put("recipientAccredited", false);
            }
        }
    }

    private void checkJurisdictionRestrictions(
            TokenComplianceConfig config,
            String from,
            String to,
            List<String> failures,
            List<String> warnings,
            Map<String, Object> details
    ) {
        String fromCountry = identityRegistry.getCountryCode(from).await().indefinitely();
        String toCountry = identityRegistry.getCountryCode(to).await().indefinitely();

        details.put("senderCountry", fromCountry);
        details.put("recipientCountry", toCountry);

        // Check blocked countries
        if (config.getBlockedCountries() != null) {
            if (fromCountry != null && config.getBlockedCountries().contains(fromCountry)) {
                failures.add("JURISDICTION: Sender country is blocked");
            }
            if (toCountry != null && config.getBlockedCountries().contains(toCountry)) {
                failures.add("JURISDICTION: Recipient country is blocked");
            }
        }

        // Check allowed countries
        if (config.getAllowedCountries() != null && !config.getAllowedCountries().isEmpty()) {
            if (fromCountry != null && !config.getAllowedCountries().contains(fromCountry)) {
                failures.add("JURISDICTION: Sender country not in allowed list");
            }
            if (toCountry != null && !config.getAllowedCountries().contains(toCountry)) {
                failures.add("JURISDICTION: Recipient country not in allowed list");
            }
        }

        // Check cross-border restrictions
        if (!config.isAllowCrossBorderTransfers() &&
            fromCountry != null && toCountry != null &&
            !fromCountry.equals(toCountry)) {
            failures.add("CROSS_BORDER: Cross-border transfers not allowed");
            details.put("crossBorderTransfer", true);
        }
    }

    private void checkTradingWindow(
            TokenComplianceConfig config,
            List<String> failures,
            Map<String, Object> details
    ) {
        if (config.isTradingWindowEnabled()) {
            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            int hour = cal.get(Calendar.HOUR_OF_DAY);
            int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);

            // Convert to 1-7 (Monday-Sunday) from Java's 1-7 (Sunday-Saturday)
            int adjustedDay = dayOfWeek == 1 ? 7 : dayOfWeek - 1;

            details.put("currentHourUTC", hour);
            details.put("currentDayOfWeek", adjustedDay);

            // Check trading days
            if (config.getTradingDays() != null && !config.getTradingDays().contains(adjustedDay)) {
                failures.add("TIME_WINDOW: Trading not allowed on this day");
            }

            // Check trading hours
            int startHour = config.getTradingWindowStartHour();
            int endHour = config.getTradingWindowEndHour();

            boolean withinWindow;
            if (startHour < endHour) {
                withinWindow = hour >= startHour && hour < endHour;
            } else {
                // Handles overnight windows (e.g., 22:00 - 06:00)
                withinWindow = hour >= startHour || hour < endHour;
            }

            if (!withinWindow) {
                failures.add("TIME_WINDOW: Trading not allowed at this hour");
                details.put("tradingWindowStart", startHour);
                details.put("tradingWindowEnd", endHour);
            }
        }
    }

    private void checkHolderLimits(
            String tokenId,
            TokenComplianceConfig config,
            String to,
            List<String> failures,
            Map<String, Object> details
    ) {
        // Note: In a real implementation, this would query the actual holder count
        // For now, this is a placeholder that would be integrated with the token contract

        if (config.getMaxTotalHolders() > 0) {
            // TODO: Integrate with token contract to get actual holder count
            details.put("maxTotalHolders", config.getMaxTotalHolders());
        }

        if (config.getMaxHoldersByCountry() != null && !config.getMaxHoldersByCountry().isEmpty()) {
            String recipientCountry = identityRegistry.getCountryCode(to).await().indefinitely();
            if (recipientCountry != null) {
                Integer maxForCountry = config.getMaxHoldersByCountry().get(recipientCountry.toUpperCase());
                if (maxForCountry != null) {
                    details.put("maxHoldersForCountry_" + recipientCountry, maxForCountry);
                    // TODO: Check actual holder count for country
                }
            }
        }
    }

    private boolean isSameDay(Instant date1, Instant date2) {
        if (date1 == null || date2 == null) return false;
        Calendar cal1 = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        Calendar cal2 = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        cal1.setTimeInMillis(date1.toEpochMilli());
        cal2.setTimeInMillis(date2.toEpochMilli());
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    // ============== Custom Exceptions ==============

    public static class TokenNotConfiguredException extends RuntimeException {
        public TokenNotConfiguredException(String message) {
            super(message);
        }
    }

    public static class ComplianceViolationException extends RuntimeException {
        private final List<String> violations;

        public ComplianceViolationException(String message, List<String> violations) {
            super(message);
            this.violations = violations;
        }

        public List<String> getViolations() {
            return violations;
        }
    }
}
