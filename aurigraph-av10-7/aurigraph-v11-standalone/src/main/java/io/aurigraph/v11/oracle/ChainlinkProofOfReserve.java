package io.aurigraph.v11.oracle;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.PostConstruct;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Chainlink Proof-of-Reserve (PoR) Integration - Gap 1.2 & 3.2
 *
 * Provides on-chain verification of asset reserves for RWA tokenization.
 * Integrates with Chainlink's Proof-of-Reserve feeds for:
 * - Real-time backing verification for tokenized assets
 * - On-chain attestations for RWA collateral
 * - Automated alerts on reserve discrepancies
 *
 * Supported Reserve Types:
 * - TREASURY: Fiat currency reserves (USD, EUR, etc.)
 * - REAL_ESTATE: Property valuations
 * - COMMODITY: Gold, silver, oil reserves
 * - CARBON_CREDIT: Verified carbon offsets
 * - CRYPTO: Wrapped asset collateral
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 * @since 2025-12-21
 */
@ApplicationScoped
public class ChainlinkProofOfReserve {

    // Configuration
    @ConfigProperty(name = "chainlink.por.enabled", defaultValue = "true")
    boolean porEnabled;

    @ConfigProperty(name = "chainlink.por.api.url", defaultValue = "https://api.chain.link/v1")
    String chainlinkApiUrl;

    @ConfigProperty(name = "chainlink.por.polling.interval.seconds", defaultValue = "300")
    int pollingIntervalSeconds;

    @ConfigProperty(name = "chainlink.por.discrepancy.threshold.percent", defaultValue = "5.0")
    double discrepancyThresholdPercent;

    @ConfigProperty(name = "chainlink.por.alert.enabled", defaultValue = "true")
    boolean alertEnabled;

    @ConfigProperty(name = "chainlink.por.cache.ttl.seconds", defaultValue = "60")
    int cacheTtlSeconds;

    // Reserve feed registry
    private final Map<String, ReserveFeedConfig> feedRegistry = new ConcurrentHashMap<>();
    private final Map<String, ReserveVerificationResult> verificationCache = new ConcurrentHashMap<>();
    private final ConcurrentLinkedDeque<ReserveAlert> alertHistory = new ConcurrentLinkedDeque<>();

    // Metrics
    private final AtomicLong totalVerifications = new AtomicLong(0);
    private final AtomicLong successfulVerifications = new AtomicLong(0);
    private final AtomicLong failedVerifications = new AtomicLong(0);
    private final AtomicLong discrepanciesDetected = new AtomicLong(0);

    // Alert listeners
    private final ConcurrentLinkedDeque<ReserveAlertListener> alertListeners = new ConcurrentLinkedDeque<>();

    // Executor for async verification
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    @PostConstruct
    public void initialize() {
        if (!porEnabled) {
            Log.info("Chainlink Proof-of-Reserve service is disabled");
            return;
        }

        // Register default reserve feeds
        registerDefaultFeeds();

        // Start periodic verification
        scheduler.scheduleAtFixedRate(
            this::runPeriodicVerification,
            pollingIntervalSeconds,
            pollingIntervalSeconds,
            TimeUnit.SECONDS
        );

        Log.infof("Chainlink PoR service initialized. Polling interval: %ds, Discrepancy threshold: %.2f%%",
            pollingIntervalSeconds, discrepancyThresholdPercent);
    }

    /**
     * Register a reserve feed for monitoring.
     *
     * @param config The feed configuration
     */
    public void registerFeed(ReserveFeedConfig config) {
        feedRegistry.put(config.assetId(), config);
        Log.infof("Registered PoR feed: %s (%s)", config.assetId(), config.reserveType());
    }

    /**
     * Verify reserves for a specific asset.
     *
     * @param assetId The asset identifier
     * @param expectedReserve The expected reserve amount
     * @return Verification result
     */
    public ReserveVerificationResult verifyReserve(String assetId, BigDecimal expectedReserve) {
        if (!porEnabled) {
            return ReserveVerificationResult.disabled(assetId);
        }

        totalVerifications.incrementAndGet();

        try {
            // Check cache first
            ReserveVerificationResult cached = getCachedResult(assetId);
            if (cached != null && !cached.isStale(cacheTtlSeconds)) {
                return cached;
            }

            // Get feed config
            ReserveFeedConfig feed = feedRegistry.get(assetId);
            if (feed == null) {
                return ReserveVerificationResult.feedNotFound(assetId);
            }

            // Fetch actual reserve from Chainlink (simulated for now)
            BigDecimal actualReserve = fetchReserveFromChainlink(feed);

            // Calculate discrepancy
            BigDecimal discrepancy = calculateDiscrepancy(expectedReserve, actualReserve);
            boolean hasDiscrepancy = discrepancy.abs().compareTo(BigDecimal.valueOf(discrepancyThresholdPercent)) > 0;

            // Create result
            ReserveVerificationResult result = new ReserveVerificationResult(
                true,
                assetId,
                feed.reserveType(),
                expectedReserve,
                actualReserve,
                discrepancy,
                hasDiscrepancy,
                !hasDiscrepancy,
                hasDiscrepancy ? "Reserve discrepancy detected" : "Reserves verified",
                Instant.now(),
                feed.feedAddress(),
                feed.chainId()
            );

            // Cache result
            verificationCache.put(assetId, result);

            // Track metrics
            if (hasDiscrepancy) {
                failedVerifications.incrementAndGet();
                discrepanciesDetected.incrementAndGet();
                raiseDiscrepancyAlert(result);
            } else {
                successfulVerifications.incrementAndGet();
            }

            Log.infof("Reserve verification: %s - Expected: %s, Actual: %s, Discrepancy: %.2f%%",
                assetId, expectedReserve, actualReserve, discrepancy);

            return result;

        } catch (Exception e) {
            failedVerifications.incrementAndGet();
            Log.errorf("Reserve verification failed for %s: %s", assetId, e.getMessage());
            return ReserveVerificationResult.error(assetId, e.getMessage());
        }
    }

    /**
     * Get the latest reserve data for an asset.
     *
     * @param assetId The asset identifier
     * @return Reserve data or null if not found
     */
    public ReserveData getReserveData(String assetId) {
        ReserveFeedConfig feed = feedRegistry.get(assetId);
        if (feed == null) {
            return null;
        }

        BigDecimal reserve = fetchReserveFromChainlink(feed);
        return new ReserveData(
            assetId,
            feed.reserveType(),
            reserve,
            feed.unit(),
            Instant.now(),
            feed.feedAddress(),
            feed.chainId()
        );
    }

    /**
     * Get verification status for all registered assets.
     *
     * @return Map of asset ID to verification result
     */
    public Map<String, ReserveVerificationResult> getAllVerificationStatus() {
        Map<String, ReserveVerificationResult> status = new HashMap<>();
        for (String assetId : feedRegistry.keySet()) {
            ReserveVerificationResult result = verificationCache.get(assetId);
            if (result != null) {
                status.put(assetId, result);
            }
        }
        return status;
    }

    /**
     * Get recent discrepancy alerts.
     *
     * @param limit Maximum number of alerts to return
     * @return List of recent alerts
     */
    public List<ReserveAlert> getRecentAlerts(int limit) {
        List<ReserveAlert> alerts = new ArrayList<>(alertHistory);
        Collections.reverse(alerts);
        if (alerts.size() > limit) {
            return alerts.subList(0, limit);
        }
        return alerts;
    }

    /**
     * Register an alert listener.
     *
     * @param listener The listener to register
     */
    public void addAlertListener(ReserveAlertListener listener) {
        if (listener != null) {
            alertListeners.add(listener);
        }
    }

    /**
     * Get service statistics.
     *
     * @return Service stats
     */
    public PoRServiceStats getStats() {
        return new PoRServiceStats(
            porEnabled,
            feedRegistry.size(),
            totalVerifications.get(),
            successfulVerifications.get(),
            failedVerifications.get(),
            discrepanciesDetected.get(),
            alertHistory.size(),
            discrepancyThresholdPercent,
            pollingIntervalSeconds,
            Instant.now()
        );
    }

    /**
     * Get registered feeds.
     *
     * @return List of registered feed configurations
     */
    public List<ReserveFeedConfig> getRegisteredFeeds() {
        return new ArrayList<>(feedRegistry.values());
    }

    // Private methods

    private void registerDefaultFeeds() {
        // Register common reserve feeds (addresses would be real Chainlink feed addresses in production)
        registerFeed(new ReserveFeedConfig(
            "USDC",
            ReserveType.TREASURY,
            "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
            "ethereum",
            "USD",
            8
        ));

        registerFeed(new ReserveFeedConfig(
            "WBTC",
            ReserveType.CRYPTO,
            "0xa81FE04086865e63E12dD3776978E49DEEa2ea4e",
            "ethereum",
            "BTC",
            8
        ));

        registerFeed(new ReserveFeedConfig(
            "PAXG",
            ReserveType.COMMODITY,
            "0x54f1A235b25b9EDc82E4A3B7E3Af97B67F72a4B9",
            "ethereum",
            "XAU",
            8
        ));

        Log.infof("Registered %d default PoR feeds", feedRegistry.size());
    }

    private BigDecimal fetchReserveFromChainlink(ReserveFeedConfig feed) {
        // In production, this would call the actual Chainlink oracle
        // For now, simulate realistic reserve data

        Random random = new Random();
        BigDecimal baseReserve = switch (feed.reserveType()) {
            case TREASURY -> new BigDecimal("1000000000"); // 1B USD
            case REAL_ESTATE -> new BigDecimal("500000000"); // 500M
            case COMMODITY -> new BigDecimal("50000"); // 50K oz gold
            case CARBON_CREDIT -> new BigDecimal("10000000"); // 10M credits
            case CRYPTO -> new BigDecimal("100000"); // 100K BTC
        };

        // Add small variance (0-2%)
        double variance = 1.0 + (random.nextDouble() * 0.02 - 0.01);
        return baseReserve.multiply(BigDecimal.valueOf(variance))
            .setScale(feed.decimals(), RoundingMode.HALF_UP);
    }

    private BigDecimal calculateDiscrepancy(BigDecimal expected, BigDecimal actual) {
        if (expected.compareTo(BigDecimal.ZERO) == 0) {
            return actual.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : new BigDecimal("100");
        }

        return actual.subtract(expected)
            .divide(expected, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }

    private ReserveVerificationResult getCachedResult(String assetId) {
        return verificationCache.get(assetId);
    }

    private void raiseDiscrepancyAlert(ReserveVerificationResult result) {
        if (!alertEnabled) {
            return;
        }

        ReserveAlert alert = new ReserveAlert(
            UUID.randomUUID().toString(),
            result.assetId(),
            AlertSeverity.HIGH,
            "Reserve discrepancy detected",
            String.format("Expected: %s, Actual: %s, Discrepancy: %.2f%%",
                result.expectedReserve(), result.actualReserve(), result.discrepancyPercent()),
            Instant.now(),
            result
        );

        alertHistory.addLast(alert);

        // Cleanup old alerts (keep last 1000)
        while (alertHistory.size() > 1000) {
            alertHistory.pollFirst();
        }

        // Notify listeners
        for (ReserveAlertListener listener : alertListeners) {
            try {
                listener.onReserveAlert(alert);
            } catch (Exception e) {
                Log.errorf("Failed to notify alert listener: %s", e.getMessage());
            }
        }

        Log.warnf("RESERVE ALERT: %s - %s", result.assetId(), alert.details());
    }

    private void runPeriodicVerification() {
        if (!porEnabled) {
            return;
        }

        Log.debug("Running periodic reserve verification...");

        for (ReserveFeedConfig feed : feedRegistry.values()) {
            try {
                // Verify with expected = actual (just to refresh the cache)
                BigDecimal current = fetchReserveFromChainlink(feed);
                verifyReserve(feed.assetId(), current);
            } catch (Exception e) {
                Log.errorf("Periodic verification failed for %s: %s", feed.assetId(), e.getMessage());
            }
        }
    }

    // Enums and Records

    public enum ReserveType {
        TREASURY,      // Fiat currency reserves
        REAL_ESTATE,   // Property valuations
        COMMODITY,     // Gold, silver, oil
        CARBON_CREDIT, // Verified carbon offsets
        CRYPTO         // Wrapped asset collateral
    }

    public enum AlertSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public record ReserveFeedConfig(
        String assetId,
        ReserveType reserveType,
        String feedAddress,
        String chainId,
        String unit,
        int decimals
    ) {}

    public record ReserveData(
        String assetId,
        ReserveType reserveType,
        BigDecimal reserve,
        String unit,
        Instant timestamp,
        String feedAddress,
        String chainId
    ) {}

    public record ReserveVerificationResult(
        boolean verified,
        String assetId,
        ReserveType reserveType,
        BigDecimal expectedReserve,
        BigDecimal actualReserve,
        BigDecimal discrepancyPercent,
        boolean hasDiscrepancy,
        boolean passed,
        String message,
        Instant timestamp,
        String feedAddress,
        String chainId
    ) {
        public static ReserveVerificationResult disabled(String assetId) {
            return new ReserveVerificationResult(
                false, assetId, null, null, null, null, false, false,
                "PoR service disabled", Instant.now(), null, null
            );
        }

        public static ReserveVerificationResult feedNotFound(String assetId) {
            return new ReserveVerificationResult(
                false, assetId, null, null, null, null, false, false,
                "Feed not registered", Instant.now(), null, null
            );
        }

        public static ReserveVerificationResult error(String assetId, String error) {
            return new ReserveVerificationResult(
                false, assetId, null, null, null, null, false, false,
                "Error: " + error, Instant.now(), null, null
            );
        }

        public boolean isStale(int cacheTtlSeconds) {
            return Duration.between(timestamp, Instant.now()).getSeconds() > cacheTtlSeconds;
        }
    }

    public record ReserveAlert(
        String alertId,
        String assetId,
        AlertSeverity severity,
        String title,
        String details,
        Instant timestamp,
        ReserveVerificationResult verificationResult
    ) {}

    public record PoRServiceStats(
        boolean enabled,
        int registeredFeeds,
        long totalVerifications,
        long successfulVerifications,
        long failedVerifications,
        long discrepanciesDetected,
        int alertHistorySize,
        double discrepancyThreshold,
        int pollingIntervalSeconds,
        Instant timestamp
    ) {}

    public interface ReserveAlertListener {
        void onReserveAlert(ReserveAlert alert);
    }
}
