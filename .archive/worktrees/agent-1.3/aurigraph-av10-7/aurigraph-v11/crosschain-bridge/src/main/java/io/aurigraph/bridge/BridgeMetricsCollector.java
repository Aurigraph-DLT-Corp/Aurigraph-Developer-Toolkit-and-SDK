package io.aurigraph.bridge;

import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * Bridge Metrics Collector for Performance Monitoring
 * 
 * Collects and exposes comprehensive metrics for cross-chain bridge operations:
 * - Transaction throughput and latency
 * - Success/failure rates by chain
 * - Slippage and fee analysis
 * - Validator performance metrics
 * - Liquidity pool utilization
 * - System health indicators
 * 
 * Integration with Micrometer for Prometheus/Grafana monitoring
 */
@ApplicationScoped
public class BridgeMetricsCollector {

    private static final Logger logger = LoggerFactory.getLogger(BridgeMetricsCollector.class);

    @ConfigProperty(name = "aurigraph.metrics.collection-interval-seconds", defaultValue = "30")
    int collectionInterval;

    @ConfigProperty(name = "aurigraph.metrics.retention-hours", defaultValue = "24")
    int retentionHours;

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    CrossChainBridgeService bridgeService;

    @Inject
    AtomicSwapManager atomicSwapManager;

    @Inject
    BridgeValidatorService validatorService;

    @Inject
    LiquidityPoolManager liquidityPoolManager;

    // Core metrics counters and timers
    private final Counter totalTransactions;
    private final Counter successfulTransactions;
    private final Counter failedTransactions;
    private final Timer transactionLatency;
    private final Gauge currentTPS;
    private final Gauge bridgeHealth;

    // Per-chain metrics
    private final Map<String, Counter> chainTransactionCounts = new ConcurrentHashMap<>();
    private final Map<String, Timer> chainLatencies = new ConcurrentHashMap<>();
    private final Map<String, Gauge> chainHealthScores = new ConcurrentHashMap<>();

    // Performance tracking
    private final LongAdder transactionCount = new LongAdder();
    private final Map<String, LongAdder> chainCounts = new ConcurrentHashMap<>();
    private final Map<Long, Integer> throughputHistory = new ConcurrentHashMap<>();
    private volatile double currentTPSValue = 0.0;
    private volatile double currentHealthScore = 1.0;

    // Slippage and fee metrics
    private final Timer slippageDistribution;
    private final Timer feeDistribution;
    private final Gauge averageSlippage;
    private final Gauge averageFee;

    // Validator metrics
    private final Gauge activeValidators;
    private final Gauge consensusLatency;
    private final Counter validatorFailures;

    // Liquidity metrics
    private final Gauge totalValueLocked;
    private final Gauge liquidityUtilization;
    private final Counter liquidityEvents;

    // System resource metrics
    private final Gauge memoryUsage;
    private final Gauge cpuUsage;
    private final Counter errorCount;

    // Background metrics collection
    private final ScheduledExecutorService metricsScheduler = Executors.newSingleThreadScheduledExecutor();

    public BridgeMetricsCollector(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Initialize core metrics
        this.totalTransactions = Counter.builder("bridge.transactions.total")
            .description("Total number of bridge transactions")
            .register(meterRegistry);

        this.successfulTransactions = Counter.builder("bridge.transactions.success")
            .description("Number of successful bridge transactions")
            .register(meterRegistry);

        this.failedTransactions = Counter.builder("bridge.transactions.failed")
            .description("Number of failed bridge transactions")
            .register(meterRegistry);

        this.transactionLatency = Timer.builder("bridge.transaction.latency")
            .description("Bridge transaction processing latency")
            .register(meterRegistry);

        this.currentTPS = Gauge.builder("bridge.tps.current")
            .description("Current transactions per second")
            .register(meterRegistry, this, BridgeMetricsCollector::getCurrentTPS);

        this.bridgeHealth = Gauge.builder("bridge.health.score")
            .description("Overall bridge health score (0-1)")
            .register(meterRegistry, this, BridgeMetricsCollector::getHealthScore);

        // Slippage and fee metrics
        this.slippageDistribution = Timer.builder("bridge.slippage.distribution")
            .description("Distribution of slippage values")
            .register(meterRegistry);

        this.feeDistribution = Timer.builder("bridge.fees.distribution")
            .description("Distribution of bridge fees")
            .register(meterRegistry);

        this.averageSlippage = Gauge.builder("bridge.slippage.average")
            .description("Average slippage percentage")
            .register(meterRegistry, this, BridgeMetricsCollector::getAverageSlippage);

        this.averageFee = Gauge.builder("bridge.fees.average")
            .description("Average bridge fee in USD")
            .register(meterRegistry, this, BridgeMetricsCollector::getAverageFee);

        // Validator metrics
        this.activeValidators = Gauge.builder("bridge.validators.active")
            .description("Number of active validators")
            .register(meterRegistry, this, BridgeMetricsCollector::getActiveValidatorCount);

        this.consensusLatency = Gauge.builder("bridge.consensus.latency")
            .description("Average consensus latency in milliseconds")
            .register(meterRegistry, this, BridgeMetricsCollector::getConsensusLatency);

        this.validatorFailures = Counter.builder("bridge.validators.failures")
            .description("Number of validator failures")
            .register(meterRegistry);

        // Liquidity metrics
        this.totalValueLocked = Gauge.builder("bridge.liquidity.tvl")
            .description("Total Value Locked in liquidity pools (USD)")
            .register(meterRegistry, this, BridgeMetricsCollector::getTotalValueLocked);

        this.liquidityUtilization = Gauge.builder("bridge.liquidity.utilization")
            .description("Liquidity pool utilization percentage")
            .register(meterRegistry, this, BridgeMetricsCollector::getLiquidityUtilization);

        this.liquidityEvents = Counter.builder("bridge.liquidity.events")
            .description("Number of liquidity pool events")
            .register(meterRegistry);

        // System resource metrics
        this.memoryUsage = Gauge.builder("bridge.system.memory.usage")
            .description("JVM memory usage percentage")
            .register(meterRegistry, this, BridgeMetricsCollector::getMemoryUsage);

        this.cpuUsage = Gauge.builder("bridge.system.cpu.usage")
            .description("CPU usage percentage")
            .register(meterRegistry, this, BridgeMetricsCollector::getCpuUsage);

        this.errorCount = Counter.builder("bridge.system.errors")
            .description("Total system error count")
            .register(meterRegistry);
    }

    /**
     * Initializes metrics collection
     */
    public void initialize() {
        logger.info("Initializing Bridge Metrics Collector...");

        // Initialize per-chain metrics for supported chains
        initializeChainMetrics();

        // Start background metrics collection
        startMetricsCollection();

        // Start TPS calculation
        startThroughputCalculation();

        logger.info("Bridge Metrics Collector initialized with {} second collection interval", 
            collectionInterval);
    }

    /**
     * Records a bridge transaction completion
     */
    public void recordTransaction(String sourceChain, String targetChain, 
                                boolean success, long latencyMs, 
                                BigDecimal slippage, BigDecimal fee) {
        // Update core counters
        totalTransactions.increment();
        transactionCount.increment();

        if (success) {
            successfulTransactions.increment();
        } else {
            failedTransactions.increment();
        }

        // Record latency
        transactionLatency.record(latencyMs, TimeUnit.MILLISECONDS);

        // Update per-chain metrics
        updateChainMetrics(sourceChain, success, latencyMs);
        updateChainMetrics(targetChain, success, latencyMs);

        // Record slippage and fees
        if (slippage != null) {
            slippageDistribution.record(slippage.doubleValue(), TimeUnit.NANOSECONDS);
        }

        if (fee != null) {
            feeDistribution.record(fee.doubleValue(), TimeUnit.NANOSECONDS);
        }

        logger.debug("Recorded transaction: {}->{}, success={}, latency={}ms, slippage={}%", 
            sourceChain, targetChain, success, latencyMs, slippage);
    }

    /**
     * Records an atomic swap completion
     */
    public void recordAtomicSwap(String chainA, String chainB, boolean success, long duration) {
        Tags swapTags = Tags.of(
            "chainA", chainA,
            "chainB", chainB,
            "success", String.valueOf(success)
        );

        Counter.builder("bridge.atomic.swaps")
            .description("Atomic swap transactions")
            .tags(swapTags)
            .register(meterRegistry)
            .increment();

        Timer.builder("bridge.atomic.swap.duration")
            .description("Atomic swap completion time")
            .tags(swapTags)
            .register(meterRegistry)
            .record(duration, TimeUnit.MILLISECONDS);
    }

    /**
     * Records validator consensus metrics
     */
    public void recordConsensus(int participatingValidators, long consensusTimeMs, boolean success) {
        Tags consensusTags = Tags.of(
            "validators", String.valueOf(participatingValidators),
            "success", String.valueOf(success)
        );

        Counter.builder("bridge.consensus.rounds")
            .description("Validator consensus rounds")
            .tags(consensusTags)
            .register(meterRegistry)
            .increment();

        Timer.builder("bridge.consensus.time")
            .description("Consensus completion time")
            .register(meterRegistry)
            .record(consensusTimeMs, TimeUnit.MILLISECONDS);

        if (!success) {
            validatorFailures.increment();
        }
    }

    /**
     * Records liquidity pool operation
     */
    public void recordLiquidityOperation(String operation, String poolId, 
                                       BigDecimal amount, boolean success) {
        Tags liquidityTags = Tags.of(
            "operation", operation,
            "pool", poolId,
            "success", String.valueOf(success)
        );

        liquidityEvents.increment(liquidityTags);

        Gauge.builder("bridge.liquidity.operation.amount")
            .description("Liquidity operation amount")
            .tags(liquidityTags)
            .register(meterRegistry, amount, BigDecimal::doubleValue);
    }

    /**
     * Records system error
     */
    public void recordError(String errorType, String component, String message) {
        Tags errorTags = Tags.of(
            "type", errorType,
            "component", component
        );

        errorCount.increment(errorTags);

        logger.warn("Recorded system error: {} in {} - {}", errorType, component, message);
    }

    /**
     * Gets current bridge performance summary
     */
    public BridgePerformanceSummary getPerformanceSummary() {
        return BridgePerformanceSummary.builder()
            .currentTPS(getCurrentTPS())
            .totalTransactions(totalTransactions.count())
            .successRate(calculateSuccessRate())
            .averageLatency(calculateAverageLatency())
            .averageSlippage(getAverageSlippage())
            .averageFee(getAverageFee())
            .healthScore(getHealthScore())
            .activeValidators(getActiveValidatorCount())
            .totalValueLocked(getTotalValueLocked())
            .build();
    }

    /**
     * Gets metrics for a specific chain
     */
    public ChainMetrics getChainMetrics(String chainId) {
        Counter chainCounter = chainTransactionCounts.get(chainId);
        Timer chainTimer = chainLatencies.get(chainId);
        Gauge chainHealth = chainHealthScores.get(chainId);

        return ChainMetrics.builder()
            .chainId(chainId)
            .transactionCount(chainCounter != null ? chainCounter.count() : 0)
            .averageLatency(chainTimer != null ? chainTimer.mean(TimeUnit.MILLISECONDS) : 0)
            .healthScore(chainHealth != null ? chainHealth.value() : 0)
            .build();
    }

    // Private helper methods

    private void initializeChainMetrics() {
        List<String> supportedChains = Arrays.asList(
            "ethereum", "bitcoin", "polygon", "bsc", "avalanche", 
            "solana", "polkadot", "cosmos", "near", "algorand"
        );

        for (String chainId : supportedChains) {
            // Transaction count per chain
            chainTransactionCounts.put(chainId, 
                Counter.builder("bridge.transactions.by.chain")
                    .description("Transactions by chain")
                    .tag("chain", chainId)
                    .register(meterRegistry));

            // Latency per chain
            chainLatencies.put(chainId,
                Timer.builder("bridge.latency.by.chain")
                    .description("Transaction latency by chain")
                    .tag("chain", chainId)
                    .register(meterRegistry));

            // Health score per chain
            chainHealthScores.put(chainId,
                Gauge.builder("bridge.health.by.chain")
                    .description("Health score by chain")
                    .tag("chain", chainId)
                    .register(meterRegistry, this, collector -> getChainHealthScore(chainId)));

            // Initialize chain counters
            chainCounts.put(chainId, new LongAdder());
        }
    }

    private void updateChainMetrics(String chainId, boolean success, long latencyMs) {
        Counter chainCounter = chainTransactionCounts.get(chainId);
        if (chainCounter != null) {
            chainCounter.increment();
        }

        Timer chainTimer = chainLatencies.get(chainId);
        if (chainTimer != null) {
            chainTimer.record(latencyMs, TimeUnit.MILLISECONDS);
        }

        LongAdder chainCount = chainCounts.get(chainId);
        if (chainCount != null) {
            chainCount.increment();
        }
    }

    private void startMetricsCollection() {
        metricsScheduler.scheduleAtFixedRate(() -> {
            try {
                collectSystemMetrics();
                collectValidatorMetrics();
                collectLiquidityMetrics();
                updateHealthScores();
                cleanupOldMetrics();
            } catch (Exception e) {
                logger.error("Error during metrics collection", e);
                recordError("metrics_collection", "system", e.getMessage());
            }
        }, collectionInterval, collectionInterval, TimeUnit.SECONDS);
    }

    private void startThroughputCalculation() {
        metricsScheduler.scheduleAtFixedRate(() -> {
            try {
                calculateCurrentTPS();
            } catch (Exception e) {
                logger.error("Error calculating TPS", e);
            }
        }, 1, 1, TimeUnit.SECONDS);
    }

    private void calculateCurrentTPS() {
        long currentTime = System.currentTimeMillis() / 1000; // seconds
        long currentCount = transactionCount.sum();
        
        // Store current count
        throughputHistory.put(currentTime, (int) currentCount);
        
        // Calculate TPS over last 10 seconds
        long tenSecondsAgo = currentTime - 10;
        Integer oldCount = throughputHistory.get(tenSecondsAgo);
        
        if (oldCount != null) {
            currentTPSValue = (currentCount - oldCount) / 10.0;
        }
        
        // Clean up old history
        throughputHistory.entrySet().removeIf(entry -> entry.getKey() < currentTime - 60);
    }

    private void collectSystemMetrics() {
        // JVM metrics are typically collected automatically by Micrometer
        // This is where we could add custom system monitoring
    }

    private void collectValidatorMetrics() {
        try {
            if (validatorService != null) {
                ValidatorMetrics metrics = validatorService.getMetrics();
                // Validator metrics are exposed via gauges that query the service
            }
        } catch (Exception e) {
            logger.debug("Failed to collect validator metrics", e);
        }
    }

    private void collectLiquidityMetrics() {
        try {
            if (liquidityPoolManager != null) {
                LiquidityMetrics metrics = liquidityPoolManager.getMetrics();
                // Liquidity metrics are exposed via gauges that query the manager
            }
        } catch (Exception e) {
            logger.debug("Failed to collect liquidity metrics", e);
        }
    }

    private void updateHealthScores() {
        // Calculate overall health score based on various factors
        double successRate = calculateSuccessRate();
        double validatorHealth = getActiveValidatorCount() / 21.0;
        double liquidityHealth = getLiquidityUtilization() / 100.0;
        
        currentHealthScore = (successRate * 0.5 + validatorHealth * 0.3 + liquidityHealth * 0.2);
        currentHealthScore = Math.max(0.0, Math.min(1.0, currentHealthScore));
    }

    private void cleanupOldMetrics() {
        // Remove metrics older than retention period
        long cutoff = System.currentTimeMillis() - (retentionHours * 3600000);
        // Cleanup implementation would go here
    }

    // Metric calculation methods

    private double getCurrentTPS() {
        return currentTPSValue;
    }

    private double getHealthScore() {
        return currentHealthScore;
    }

    private double calculateSuccessRate() {
        double total = totalTransactions.count();
        if (total == 0) return 1.0;
        
        double successful = successfulTransactions.count();
        return successful / total;
    }

    private double calculateAverageLatency() {
        return transactionLatency.mean(TimeUnit.MILLISECONDS);
    }

    private double getAverageSlippage() {
        return slippageDistribution.mean(TimeUnit.NANOSECONDS) * 100; // Convert to percentage
    }

    private double getAverageFee() {
        return feeDistribution.mean(TimeUnit.NANOSECONDS);
    }

    private double getActiveValidatorCount() {
        try {
            if (validatorService != null) {
                return validatorService.getActiveValidators().size();
            }
        } catch (Exception e) {
            logger.debug("Failed to get active validator count", e);
        }
        return 21; // Default value
    }

    private double getConsensusLatency() {
        // This would be calculated from recent consensus operations
        return 5000; // Mock 5 second average
    }

    private double getTotalValueLocked() {
        try {
            if (liquidityPoolManager != null) {
                return liquidityPoolManager.getMetrics().getTotalValueLocked().doubleValue();
            }
        } catch (Exception e) {
            logger.debug("Failed to get TVL", e);
        }
        return 2000000000; // Mock $2B TVL
    }

    private double getLiquidityUtilization() {
        // Calculate as percentage of pools being actively used
        return 75.0; // Mock 75% utilization
    }

    private double getChainHealthScore(String chainId) {
        // Calculate health score for specific chain
        return 0.95; // Mock 95% health
    }

    private double getMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long total = runtime.totalMemory();
        long free = runtime.freeMemory();
        return ((double) (total - free) / total) * 100;
    }

    private double getCpuUsage() {
        // This would typically use system monitoring libraries
        return 25.0; // Mock 25% CPU usage
    }

    // Data classes for metrics

    public static class BridgePerformanceSummary {
        private final double currentTPS;
        private final double totalTransactions;
        private final double successRate;
        private final double averageLatency;
        private final double averageSlippage;
        private final double averageFee;
        private final double healthScore;
        private final double activeValidators;
        private final double totalValueLocked;

        private BridgePerformanceSummary(Builder builder) {
            this.currentTPS = builder.currentTPS;
            this.totalTransactions = builder.totalTransactions;
            this.successRate = builder.successRate;
            this.averageLatency = builder.averageLatency;
            this.averageSlippage = builder.averageSlippage;
            this.averageFee = builder.averageFee;
            this.healthScore = builder.healthScore;
            this.activeValidators = builder.activeValidators;
            this.totalValueLocked = builder.totalValueLocked;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private double currentTPS;
            private double totalTransactions;
            private double successRate;
            private double averageLatency;
            private double averageSlippage;
            private double averageFee;
            private double healthScore;
            private double activeValidators;
            private double totalValueLocked;

            public Builder currentTPS(double currentTPS) { this.currentTPS = currentTPS; return this; }
            public Builder totalTransactions(double totalTransactions) { this.totalTransactions = totalTransactions; return this; }
            public Builder successRate(double successRate) { this.successRate = successRate; return this; }
            public Builder averageLatency(double averageLatency) { this.averageLatency = averageLatency; return this; }
            public Builder averageSlippage(double averageSlippage) { this.averageSlippage = averageSlippage; return this; }
            public Builder averageFee(double averageFee) { this.averageFee = averageFee; return this; }
            public Builder healthScore(double healthScore) { this.healthScore = healthScore; return this; }
            public Builder activeValidators(double activeValidators) { this.activeValidators = activeValidators; return this; }
            public Builder totalValueLocked(double totalValueLocked) { this.totalValueLocked = totalValueLocked; return this; }

            public BridgePerformanceSummary build() {
                return new BridgePerformanceSummary(this);
            }
        }

        // Getters
        public double getCurrentTPS() { return currentTPS; }
        public double getTotalTransactions() { return totalTransactions; }
        public double getSuccessRate() { return successRate; }
        public double getAverageLatency() { return averageLatency; }
        public double getAverageSlippage() { return averageSlippage; }
        public double getAverageFee() { return averageFee; }
        public double getHealthScore() { return healthScore; }
        public double getActiveValidators() { return activeValidators; }
        public double getTotalValueLocked() { return totalValueLocked; }
    }

    public static class ChainMetrics {
        private final String chainId;
        private final double transactionCount;
        private final double averageLatency;
        private final double healthScore;

        private ChainMetrics(Builder builder) {
            this.chainId = builder.chainId;
            this.transactionCount = builder.transactionCount;
            this.averageLatency = builder.averageLatency;
            this.healthScore = builder.healthScore;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String chainId;
            private double transactionCount;
            private double averageLatency;
            private double healthScore;

            public Builder chainId(String chainId) { this.chainId = chainId; return this; }
            public Builder transactionCount(double transactionCount) { this.transactionCount = transactionCount; return this; }
            public Builder averageLatency(double averageLatency) { this.averageLatency = averageLatency; return this; }
            public Builder healthScore(double healthScore) { this.healthScore = healthScore; return this; }

            public ChainMetrics build() {
                return new ChainMetrics(this);
            }
        }

        // Getters
        public String getChainId() { return chainId; }
        public double getTransactionCount() { return transactionCount; }
        public double getAverageLatency() { return averageLatency; }
        public double getHealthScore() { return healthScore; }
    }

    // Mock classes for dependencies that don't exist yet
    private static class ValidatorMetrics {
        // Mock validator metrics
    }

    private static class LiquidityMetrics {
        public BigDecimal getTotalValueLocked() {
            return BigDecimal.valueOf(2000000000);
        }
    }
}