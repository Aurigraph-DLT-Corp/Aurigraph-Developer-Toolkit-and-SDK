package io.aurigraph.v11.rwa.oracle;

import io.quarkus.logging.Log;
import io.quarkus.scheduler.Scheduled;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * Proof-of-Reserve Oracle for RWA Token Backing Verification
 *
 * Integrates with Chainlink Proof-of-Reserve (PoR) feeds to verify that
 * tokenized assets are properly collateralized by real-world reserves.
 *
 * Key Features:
 * - Chainlink Proof-of-Reserve feed integration
 * - Reserve attestation verification
 * - Collateralization ratio monitoring
 * - Alert on under-collateralization
 * - Multi-asset reserve tracking
 * - Historical reserve data
 * - Automatic refresh scheduling
 *
 * Supported Reserve Types:
 * - Fiat currency reserves (USD, EUR, etc.)
 * - Precious metals (Gold, Silver)
 * - Real estate valuations
 * - Commodity reserves
 * - Cross-chain wrapped assets
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 * @see <a href="https://chain.link/proof-of-reserve">Chainlink Proof-of-Reserve</a>
 */
@ApplicationScoped
public class ProofOfReserveOracle {

    @ConfigProperty(name = "oracle.por.chainlink.api.url", defaultValue = "https://api.chain.link/por")
    String chainlinkApiUrl;

    @ConfigProperty(name = "oracle.por.min.collateral.ratio", defaultValue = "1.0")
    BigDecimal minCollateralRatio;

    @ConfigProperty(name = "oracle.por.warning.threshold", defaultValue = "1.1")
    BigDecimal warningThreshold;

    @ConfigProperty(name = "oracle.por.critical.threshold", defaultValue = "1.05")
    BigDecimal criticalThreshold;

    @ConfigProperty(name = "oracle.por.refresh.interval.seconds", defaultValue = "300")
    int refreshIntervalSeconds;

    // Storage
    private final Map<String, ReserveConfiguration> reserveConfigs = new ConcurrentHashMap<>();
    private final Map<String, ReserveAttestation> latestAttestations = new ConcurrentHashMap<>();
    private final Map<String, List<ReserveAttestation>> attestationHistory = new ConcurrentHashMap<>();
    private final Map<String, CollateralizationStatus> collateralStatus = new ConcurrentHashMap<>();
    private final List<Consumer<CollateralizationAlert>> alertSubscribers = new ArrayList<>();
    private final AtomicLong totalVerifications = new AtomicLong(0);
    private final AtomicLong successfulVerifications = new AtomicLong(0);

    // Chainlink PoR feed addresses (Ethereum mainnet examples)
    private static final Map<String, String> CHAINLINK_POR_FEEDS = Map.of(
        "WBTC", "0x4D7F0a98B4E0E4e3B9D95C4d58DfC9f86B02c68B",
        "TUSD", "0x478f4c42b877c697C4b19E396865D4D533EcB6ea",
        "PAX", "0x95ccafec8fE95f4A2Ed1E4E41d1F89FfC09CC2e8",
        "USDC", "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
        "PAXG", "0x716BB759A5f6faCdfF91F0AfB613F64c89819BB3"
    );

    /**
     * Reserve Configuration - defines how a reserve should be monitored
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReserveConfiguration {
        private String reserveId;
        private String tokenId;                    // Associated token
        private String assetSymbol;                // e.g., "USDC", "PAXG"
        private ReserveType reserveType;
        private String chainlinkFeedAddress;       // Chainlink PoR feed address
        private String custodianName;              // Reserve custodian
        private String custodianAddress;           // Custodian wallet/contract
        private BigDecimal targetCollateralRatio;  // Target ratio (e.g., 1.0 = 100%)
        private BigDecimal minCollateralRatio;     // Minimum allowed ratio
        private Duration attestationFrequency;     // How often to check
        private boolean automaticHalt;             // Halt transfers if under-collateralized
        private Set<String> attestorAddresses;     // Authorized attestors
        private Instant createdAt;
        private Instant lastUpdated;
        private boolean active;
    }

    /**
     * Reserve type classification
     */
    public enum ReserveType {
        FIAT_CURRENCY,      // USD, EUR, etc.
        PRECIOUS_METAL,     // Gold, Silver
        REAL_ESTATE,        // Property valuations
        COMMODITY,          // Oil, Gas, etc.
        WRAPPED_ASSET,      // Cross-chain assets (WBTC, etc.)
        MIXED               // Multiple asset types
    }

    /**
     * Reserve Attestation - a point-in-time verification of reserves
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReserveAttestation {
        private String attestationId;
        private String reserveId;
        private BigDecimal totalSupply;            // Total token supply
        private BigDecimal reserveBalance;         // Verified reserve balance
        private BigDecimal collateralRatio;        // reserve / supply
        private AttestationStatus status;
        private String attestorAddress;            // Who provided attestation
        private String proofHash;                  // Merkle root or proof hash
        private byte[] signature;                  // Attestor signature
        private Instant timestamp;
        private Instant validUntil;
        private String dataSource;                 // "chainlink", "auditor", etc.
        private Map<String, Object> metadata;
    }

    /**
     * Attestation status
     */
    public enum AttestationStatus {
        PENDING,
        VERIFIED,
        FAILED,
        EXPIRED,
        DISPUTED
    }

    /**
     * Collateralization Status - current state of token backing
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollateralizationStatus {
        private String reserveId;
        private String tokenId;
        private BigDecimal currentRatio;
        private CollateralLevel level;
        private BigDecimal totalSupply;
        private BigDecimal totalReserves;
        private BigDecimal deficit;                // Negative if surplus
        private Instant lastUpdated;
        private ReserveAttestation latestAttestation;
        private boolean halted;
        private String haltReason;
    }

    /**
     * Collateral level classification
     */
    public enum CollateralLevel {
        OVER_COLLATERALIZED,    // > 100%
        FULLY_COLLATERALIZED,   // = 100%
        WARNING,                // < warning threshold
        CRITICAL,               // < critical threshold
        UNDER_COLLATERALIZED    // < 100%
    }

    /**
     * Collateralization Alert
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollateralizationAlert {
        private String alertId;
        private String reserveId;
        private String tokenId;
        private AlertSeverity severity;
        private AlertType type;
        private BigDecimal currentRatio;
        private BigDecimal threshold;
        private String message;
        private Instant timestamp;
        private boolean acknowledged;
        private Map<String, Object> details;
    }

    /**
     * Alert severity levels
     */
    public enum AlertSeverity {
        INFO,
        WARNING,
        CRITICAL,
        EMERGENCY
    }

    /**
     * Alert types
     */
    public enum AlertType {
        RATIO_WARNING,
        RATIO_CRITICAL,
        UNDER_COLLATERALIZED,
        ATTESTATION_EXPIRED,
        ATTESTATION_FAILED,
        SUPPLY_MISMATCH,
        ORACLE_UNAVAILABLE,
        HALTED
    }

    /**
     * Register a new reserve configuration
     *
     * @param config Reserve configuration
     * @param callerAddress Admin address
     * @return Uni<String> reserve ID
     */
    public Uni<String> registerReserve(ReserveConfiguration config, String callerAddress) {
        return Uni.createFrom().item(() -> {
            String reserveId = generateReserveId(config.getTokenId(), config.getAssetSymbol());
            config.setReserveId(reserveId);
            config.setCreatedAt(Instant.now());
            config.setLastUpdated(Instant.now());
            config.setActive(true);

            // Set defaults if not provided
            if (config.getTargetCollateralRatio() == null) {
                config.setTargetCollateralRatio(BigDecimal.ONE);
            }
            if (config.getMinCollateralRatio() == null) {
                config.setMinCollateralRatio(minCollateralRatio);
            }
            if (config.getAttestationFrequency() == null) {
                config.setAttestationFrequency(Duration.ofMinutes(5));
            }
            if (config.getAttestorAddresses() == null) {
                config.setAttestorAddresses(new HashSet<>());
            }

            // Try to get Chainlink feed address if not provided
            if (config.getChainlinkFeedAddress() == null &&
                CHAINLINK_POR_FEEDS.containsKey(config.getAssetSymbol())) {
                config.setChainlinkFeedAddress(CHAINLINK_POR_FEEDS.get(config.getAssetSymbol()));
            }

            reserveConfigs.put(reserveId, config);
            attestationHistory.put(reserveId, new ArrayList<>());

            Log.infof("Registered reserve configuration: %s for token %s",
                     reserveId, config.getTokenId());

            // Perform initial attestation
            fetchAndVerifyReserves(reserveId).subscribe().with(
                result -> Log.infof("Initial attestation complete for %s", reserveId),
                error -> Log.warnf("Initial attestation failed for %s: %s", reserveId, error.getMessage())
            );

            return reserveId;
        });
    }

    /**
     * Fetch and verify reserves from Chainlink PoR feed
     *
     * @param reserveId Reserve identifier
     * @return Uni<ReserveAttestation> attestation result
     */
    public Uni<ReserveAttestation> fetchAndVerifyReserves(String reserveId) {
        return Uni.createFrom().item(() -> {
            totalVerifications.incrementAndGet();

            ReserveConfiguration config = reserveConfigs.get(reserveId);
            if (config == null) {
                throw new ReserveNotFoundException("Reserve not found: " + reserveId);
            }

            Log.infof("Fetching Proof-of-Reserve for %s from Chainlink", reserveId);

            // In production, this would call the actual Chainlink PoR feed
            // For now, simulate the response
            BigDecimal reserveBalance = fetchFromChainlink(config);
            BigDecimal totalSupply = fetchTotalSupply(config);

            BigDecimal ratio = totalSupply.compareTo(BigDecimal.ZERO) > 0 ?
                reserveBalance.divide(totalSupply, 8, RoundingMode.HALF_UP) :
                BigDecimal.ONE;

            AttestationStatus status = determineAttestationStatus(ratio, config);

            ReserveAttestation attestation = ReserveAttestation.builder()
                    .attestationId(generateAttestationId(reserveId))
                    .reserveId(reserveId)
                    .totalSupply(totalSupply)
                    .reserveBalance(reserveBalance)
                    .collateralRatio(ratio)
                    .status(status)
                    .attestorAddress("chainlink-por-oracle")
                    .proofHash(generateProofHash(reserveBalance, totalSupply))
                    .timestamp(Instant.now())
                    .validUntil(Instant.now().plus(config.getAttestationFrequency()))
                    .dataSource("chainlink")
                    .metadata(Map.of(
                        "feedAddress", config.getChainlinkFeedAddress() != null ?
                            config.getChainlinkFeedAddress() : "simulated",
                        "custodian", config.getCustodianName() != null ?
                            config.getCustodianName() : "unknown"
                    ))
                    .build();

            // Store attestation
            latestAttestations.put(reserveId, attestation);
            attestationHistory.get(reserveId).add(attestation);

            // Update collateral status
            updateCollateralizationStatus(reserveId, attestation, config);

            if (status == AttestationStatus.VERIFIED) {
                successfulVerifications.incrementAndGet();
            }

            Log.infof("Reserve attestation complete: %s - Ratio: %s, Status: %s",
                     reserveId, ratio, status);

            return attestation;
        });
    }

    /**
     * Get current collateralization status
     *
     * @param reserveId Reserve identifier
     * @return Uni<CollateralizationStatus> current status
     */
    public Uni<CollateralizationStatus> getCollateralizationStatus(String reserveId) {
        return Uni.createFrom().item(() -> collateralStatus.get(reserveId));
    }

    /**
     * Get latest attestation
     *
     * @param reserveId Reserve identifier
     * @return Uni<ReserveAttestation> latest attestation
     */
    public Uni<ReserveAttestation> getLatestAttestation(String reserveId) {
        return Uni.createFrom().item(() -> latestAttestations.get(reserveId));
    }

    /**
     * Get attestation history
     *
     * @param reserveId Reserve identifier
     * @param limit Maximum records to return
     * @return Uni<List<ReserveAttestation>> attestation history
     */
    public Uni<List<ReserveAttestation>> getAttestationHistory(String reserveId, int limit) {
        return Uni.createFrom().item(() -> {
            List<ReserveAttestation> history = attestationHistory.get(reserveId);
            if (history == null) {
                return Collections.emptyList();
            }
            return history.stream()
                    .sorted(Comparator.comparing(ReserveAttestation::getTimestamp).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Check if a token is properly collateralized
     *
     * @param tokenId Token identifier
     * @return Uni<Boolean> whether fully collateralized
     */
    public Uni<Boolean> isFullyCollateralized(String tokenId) {
        return Uni.createFrom().item(() -> {
            return collateralStatus.values().stream()
                    .filter(s -> tokenId.equals(s.getTokenId()))
                    .allMatch(s -> s.getCurrentRatio().compareTo(BigDecimal.ONE) >= 0);
        });
    }

    /**
     * Get collateralization ratio for a token
     *
     * @param tokenId Token identifier
     * @return Uni<BigDecimal> current ratio
     */
    public Uni<BigDecimal> getCollateralizationRatio(String tokenId) {
        return Uni.createFrom().item(() -> {
            return collateralStatus.values().stream()
                    .filter(s -> tokenId.equals(s.getTokenId()))
                    .map(CollateralizationStatus::getCurrentRatio)
                    .findFirst()
                    .orElse(BigDecimal.ZERO);
        });
    }

    /**
     * Submit manual attestation (for auditor-verified reserves)
     *
     * @param reserveId Reserve identifier
     * @param attestation Attestation details
     * @param signature Auditor signature
     * @param callerAddress Attestor address
     * @return Uni<ReserveAttestation> recorded attestation
     */
    public Uni<ReserveAttestation> submitAttestation(
            String reserveId,
            ReserveAttestation attestation,
            byte[] signature,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            ReserveConfiguration config = reserveConfigs.get(reserveId);
            if (config == null) {
                throw new ReserveNotFoundException("Reserve not found: " + reserveId);
            }

            // Verify attestor is authorized
            if (!config.getAttestorAddresses().isEmpty() &&
                !config.getAttestorAddresses().contains(callerAddress)) {
                throw new UnauthorizedAttestorException("Caller not authorized as attestor");
            }

            attestation.setAttestationId(generateAttestationId(reserveId));
            attestation.setReserveId(reserveId);
            attestation.setAttestorAddress(callerAddress);
            attestation.setSignature(signature);
            attestation.setTimestamp(Instant.now());
            attestation.setDataSource("manual-attestor");

            // Calculate ratio
            BigDecimal ratio = attestation.getTotalSupply().compareTo(BigDecimal.ZERO) > 0 ?
                attestation.getReserveBalance().divide(
                    attestation.getTotalSupply(), 8, RoundingMode.HALF_UP) :
                BigDecimal.ONE;
            attestation.setCollateralRatio(ratio);
            attestation.setStatus(determineAttestationStatus(ratio, config));

            // Store attestation
            latestAttestations.put(reserveId, attestation);
            attestationHistory.get(reserveId).add(attestation);

            // Update status
            updateCollateralizationStatus(reserveId, attestation, config);

            Log.infof("Manual attestation submitted for %s by %s - Ratio: %s",
                     reserveId, callerAddress, ratio);

            return attestation;
        });
    }

    /**
     * Subscribe to collateralization alerts
     *
     * @param subscriber Alert handler
     */
    public void subscribeToAlerts(Consumer<CollateralizationAlert> subscriber) {
        alertSubscribers.add(subscriber);
    }

    /**
     * Unsubscribe from alerts
     *
     * @param subscriber Alert handler to remove
     */
    public void unsubscribeFromAlerts(Consumer<CollateralizationAlert> subscriber) {
        alertSubscribers.remove(subscriber);
    }

    /**
     * Get all reserve configurations
     *
     * @return Uni<List<ReserveConfiguration>> all configurations
     */
    public Uni<List<ReserveConfiguration>> getAllReserveConfigs() {
        return Uni.createFrom().item(() ->
            new ArrayList<>(reserveConfigs.values())
        );
    }

    /**
     * Get reserve configuration
     *
     * @param reserveId Reserve identifier
     * @return Uni<ReserveConfiguration> configuration
     */
    public Uni<ReserveConfiguration> getReserveConfig(String reserveId) {
        return Uni.createFrom().item(() -> reserveConfigs.get(reserveId));
    }

    /**
     * Update reserve configuration
     *
     * @param reserveId Reserve identifier
     * @param config Updated configuration
     * @param callerAddress Admin address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateReserveConfig(
            String reserveId,
            ReserveConfiguration config,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            ReserveConfiguration existing = reserveConfigs.get(reserveId);
            if (existing == null) {
                throw new ReserveNotFoundException("Reserve not found: " + reserveId);
            }

            config.setReserveId(reserveId);
            config.setCreatedAt(existing.getCreatedAt());
            config.setLastUpdated(Instant.now());

            reserveConfigs.put(reserveId, config);

            Log.infof("Updated reserve configuration: %s", reserveId);
            return true;
        });
    }

    /**
     * Pause a reserve (halt related token transfers)
     *
     * @param reserveId Reserve identifier
     * @param reason Halt reason
     * @param callerAddress Admin address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> pauseReserve(String reserveId, String reason, String callerAddress) {
        return Uni.createFrom().item(() -> {
            CollateralizationStatus status = collateralStatus.get(reserveId);
            if (status != null) {
                status.setHalted(true);
                status.setHaltReason(reason);
                status.setLastUpdated(Instant.now());

                // Send alert
                sendAlert(CollateralizationAlert.builder()
                        .alertId(UUID.randomUUID().toString())
                        .reserveId(reserveId)
                        .tokenId(status.getTokenId())
                        .severity(AlertSeverity.CRITICAL)
                        .type(AlertType.HALTED)
                        .message("Reserve halted: " + reason)
                        .timestamp(Instant.now())
                        .build());

                Log.warnf("RESERVE HALTED: %s - Reason: %s", reserveId, reason);
            }
            return true;
        });
    }

    /**
     * Resume a paused reserve
     *
     * @param reserveId Reserve identifier
     * @param callerAddress Admin address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> resumeReserve(String reserveId, String callerAddress) {
        return Uni.createFrom().item(() -> {
            CollateralizationStatus status = collateralStatus.get(reserveId);
            if (status != null) {
                status.setHalted(false);
                status.setHaltReason(null);
                status.setLastUpdated(Instant.now());

                Log.infof("Reserve resumed: %s", reserveId);
            }
            return true;
        });
    }

    /**
     * Get oracle statistics
     *
     * @return Uni<Map<String, Object>> statistics
     */
    public Uni<Map<String, Object>> getOracleStatistics() {
        return Uni.createFrom().item(() -> {
            long total = totalVerifications.get();
            long successful = successfulVerifications.get();
            double successRate = total > 0 ? (double) successful / total * 100 : 0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVerifications", total);
            stats.put("successfulVerifications", successful);
            stats.put("successRate", String.format("%.2f%%", successRate));
            stats.put("activeReserves", reserveConfigs.size());
            stats.put("configuredAlertSubscribers", alertSubscribers.size());

            // Collateralization summary
            long fullyCollateralized = collateralStatus.values().stream()
                    .filter(s -> s.getCurrentRatio().compareTo(BigDecimal.ONE) >= 0)
                    .count();
            long underCollateralized = collateralStatus.size() - fullyCollateralized;

            stats.put("fullyCollateralizedReserves", fullyCollateralized);
            stats.put("underCollateralizedReserves", underCollateralized);

            return stats;
        });
    }

    /**
     * Scheduled task to refresh all reserve attestations
     */
    @Scheduled(every = "${oracle.por.refresh.interval.seconds:300}s")
    void scheduledReserveRefresh() {
        Log.debug("Running scheduled Proof-of-Reserve refresh");

        reserveConfigs.values().stream()
                .filter(ReserveConfiguration::isActive)
                .forEach(config -> {
                    fetchAndVerifyReserves(config.getReserveId())
                            .subscribe().with(
                                result -> Log.debugf("Refreshed attestation for %s",
                                    config.getReserveId()),
                                error -> Log.warnf("Failed to refresh %s: %s",
                                    config.getReserveId(), error.getMessage())
                            );
                });
    }

    // ============== Private Helper Methods ==============

    private BigDecimal fetchFromChainlink(ReserveConfiguration config) {
        // In production, this would call the Chainlink PoR feed
        // Simulate with realistic values
        Random random = new Random(config.getReserveId().hashCode() + System.currentTimeMillis() / 60000);

        // Base reserve amount (typically slightly over 100% for healthy reserves)
        double baseReserve = 1000000.0; // $1M base
        double variance = (random.nextDouble() - 0.3) * 0.1; // Slight positive bias

        return BigDecimal.valueOf(baseReserve * (1.0 + variance))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal fetchTotalSupply(ReserveConfiguration config) {
        // In production, this would query the token contract
        // Simulate with consistent values
        Random random = new Random(config.getTokenId().hashCode());
        double baseSupply = 1000000.0;

        return BigDecimal.valueOf(baseSupply * (0.95 + random.nextDouble() * 0.1))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private AttestationStatus determineAttestationStatus(BigDecimal ratio, ReserveConfiguration config) {
        if (ratio.compareTo(config.getMinCollateralRatio()) < 0) {
            return AttestationStatus.FAILED;
        }
        return AttestationStatus.VERIFIED;
    }

    private void updateCollateralizationStatus(
            String reserveId,
            ReserveAttestation attestation,
            ReserveConfiguration config
    ) {
        BigDecimal ratio = attestation.getCollateralRatio();
        CollateralLevel level = determineCollateralLevel(ratio, config);

        BigDecimal deficit = attestation.getTotalSupply().subtract(attestation.getReserveBalance());

        CollateralizationStatus status = CollateralizationStatus.builder()
                .reserveId(reserveId)
                .tokenId(config.getTokenId())
                .currentRatio(ratio)
                .level(level)
                .totalSupply(attestation.getTotalSupply())
                .totalReserves(attestation.getReserveBalance())
                .deficit(deficit)
                .lastUpdated(Instant.now())
                .latestAttestation(attestation)
                .halted(config.isAutomaticHalt() && level == CollateralLevel.UNDER_COLLATERALIZED)
                .haltReason(level == CollateralLevel.UNDER_COLLATERALIZED ?
                    "Automatic halt due to under-collateralization" : null)
                .build();

        collateralStatus.put(reserveId, status);

        // Send alerts based on level
        if (level == CollateralLevel.WARNING) {
            sendAlert(CollateralizationAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .reserveId(reserveId)
                    .tokenId(config.getTokenId())
                    .severity(AlertSeverity.WARNING)
                    .type(AlertType.RATIO_WARNING)
                    .currentRatio(ratio)
                    .threshold(warningThreshold)
                    .message(String.format("Collateralization ratio at %.2f%%, approaching minimum",
                        ratio.multiply(BigDecimal.valueOf(100))))
                    .timestamp(Instant.now())
                    .build());
        } else if (level == CollateralLevel.CRITICAL) {
            sendAlert(CollateralizationAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .reserveId(reserveId)
                    .tokenId(config.getTokenId())
                    .severity(AlertSeverity.CRITICAL)
                    .type(AlertType.RATIO_CRITICAL)
                    .currentRatio(ratio)
                    .threshold(criticalThreshold)
                    .message(String.format("CRITICAL: Collateralization ratio at %.2f%%",
                        ratio.multiply(BigDecimal.valueOf(100))))
                    .timestamp(Instant.now())
                    .build());
        } else if (level == CollateralLevel.UNDER_COLLATERALIZED) {
            sendAlert(CollateralizationAlert.builder()
                    .alertId(UUID.randomUUID().toString())
                    .reserveId(reserveId)
                    .tokenId(config.getTokenId())
                    .severity(AlertSeverity.EMERGENCY)
                    .type(AlertType.UNDER_COLLATERALIZED)
                    .currentRatio(ratio)
                    .threshold(BigDecimal.ONE)
                    .message(String.format("EMERGENCY: Under-collateralized at %.2f%%. Deficit: %s",
                        ratio.multiply(BigDecimal.valueOf(100)), deficit))
                    .timestamp(Instant.now())
                    .details(Map.of("deficit", deficit, "halted", status.isHalted()))
                    .build());
        }
    }

    private CollateralLevel determineCollateralLevel(BigDecimal ratio, ReserveConfiguration config) {
        if (ratio.compareTo(BigDecimal.ONE) > 0) {
            return CollateralLevel.OVER_COLLATERALIZED;
        } else if (ratio.compareTo(BigDecimal.ONE) == 0) {
            return CollateralLevel.FULLY_COLLATERALIZED;
        } else if (ratio.compareTo(config.getMinCollateralRatio()) < 0) {
            return CollateralLevel.UNDER_COLLATERALIZED;
        } else if (ratio.compareTo(criticalThreshold) < 0) {
            return CollateralLevel.CRITICAL;
        } else if (ratio.compareTo(warningThreshold) < 0) {
            return CollateralLevel.WARNING;
        }
        return CollateralLevel.FULLY_COLLATERALIZED;
    }

    private void sendAlert(CollateralizationAlert alert) {
        for (Consumer<CollateralizationAlert> subscriber : alertSubscribers) {
            try {
                subscriber.accept(alert);
            } catch (Exception e) {
                Log.warnf("Failed to send alert to subscriber: %s", e.getMessage());
            }
        }

        Log.warnf("COLLATERALIZATION ALERT [%s]: %s - %s",
                 alert.getSeverity(), alert.getType(), alert.getMessage());
    }

    private String generateReserveId(String tokenId, String assetSymbol) {
        return "POR-" + tokenId.substring(0, Math.min(8, tokenId.length())).toUpperCase() +
               "-" + assetSymbol.toUpperCase() +
               "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String generateAttestationId(String reserveId) {
        return "ATT-" + reserveId.substring(0, Math.min(8, reserveId.length())) +
               "-" + System.currentTimeMillis();
    }

    private String generateProofHash(BigDecimal reserve, BigDecimal supply) {
        String data = reserve.toPlainString() + ":" + supply.toPlainString() + ":" + Instant.now().toEpochMilli();
        return Base64.getEncoder().encodeToString(data.getBytes()).substring(0, 32);
    }

    // ============== Custom Exceptions ==============

    public static class ReserveNotFoundException extends RuntimeException {
        public ReserveNotFoundException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedAttestorException extends RuntimeException {
        public UnauthorizedAttestorException(String message) {
            super(message);
        }
    }

    public static class AttestationFailedException extends RuntimeException {
        public AttestationFailedException(String message) {
            super(message);
        }
    }
}
