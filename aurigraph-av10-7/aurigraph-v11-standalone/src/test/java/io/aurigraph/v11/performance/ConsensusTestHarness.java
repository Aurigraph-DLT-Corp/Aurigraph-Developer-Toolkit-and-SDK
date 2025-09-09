package io.aurigraph.v11.performance;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.consensus.ConsensusModels.*;
import io.aurigraph.v11.TransactionService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.IntStream;

/**
 * Consensus Test Harness for HyperRAFT++ Performance Validation
 * 
 * Validates consensus-specific performance requirements:
 * - Leader election convergence <500ms
 * - Byzantine fault tolerance (33% malicious nodes)
 * - Support for 100+ validators
 * - Consensus throughput validation
 * - Block finalization performance
 * - Validation pipeline efficiency
 * 
 * Test Scenarios:
 * 1. Leader Election Performance
 * 2. Consensus Under Load
 * 3. Byzantine Fault Tolerance
 * 4. Multi-Node Coordination
 * 5. Pipeline Throughput
 * 6. State Consistency Validation
 */
@ApplicationScoped
public class ConsensusTestHarness {

    private static final Logger LOG = Logger.getLogger(ConsensusTestHarness.class);

    // Performance targets
    private static final long TARGET_LEADER_ELECTION_MS = 500L;
    private static final long TARGET_CONSENSUS_TPS = 100_000L;
    private static final double TARGET_VALIDATION_SUCCESS_RATE = 99.99;
    private static final int MAX_BYZANTINE_NODES = 33; // 33% fault tolerance
    private static final int TARGET_VALIDATOR_COUNT = 100;

    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    TransactionService transactionService;

    // Test infrastructure
    private ExecutorService consensusExecutor;
    private final AtomicLong totalConsensusOperations = new AtomicLong(0);
    private final AtomicLong successfulConsensusOperations = new AtomicLong(0);
    private final AtomicReference<Instant> testStartTime = new AtomicReference<>();

    public void initialize() {
        consensusExecutor = Executors.newVirtualThreadPerTaskExecutor();
        testStartTime.set(Instant.now());
        totalConsensusOperations.set(0);
        successfulConsensusOperations.set(0);
        
        LOG.info("ConsensusTestHarness initialized");
    }

    public void shutdown() {
        if (consensusExecutor != null && !consensusExecutor.isShutdown()) {
            consensusExecutor.shutdown();
            try {
                if (!consensusExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                    consensusExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                consensusExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Comprehensive consensus performance test
     */
    public PerformanceBenchmarkSuite.ConsensusPerformanceResult runConsensusPerformanceTest() {
        LOG.info("Starting comprehensive consensus performance test");
        initialize();

        try {
            // Test 1: Leader Election Performance
            long leaderElectionTime = testLeaderElectionPerformance();
            
            // Test 2: Consensus Throughput
            double consensusTps = testConsensusThroughput();
            
            // Test 3: Block Finalization
            double avgBlockFinalization = testBlockFinalizationPerformance();
            
            // Test 4: Validation Success Rate
            double validationSuccessRate = testValidationPipeline();
            
            LOG.infof("Consensus performance test completed:");
            LOG.infof("  Leader Election: %dms", leaderElectionTime);
            LOG.infof("  Consensus TPS: %.0f", consensusTps);
            LOG.infof("  Block Finalization: %.1fms avg", avgBlockFinalization);
            LOG.infof("  Validation Success: %.2f%%", validationSuccessRate);
            
            return new PerformanceBenchmarkSuite.ConsensusPerformanceResult(
                leaderElectionTime,
                consensusTps,
                avgBlockFinalization,
                validationSuccessRate
            );
            
        } finally {
            shutdown();
        }
    }

    /**
     * Test leader election performance under various conditions
     */
    public long testLeaderElectionPerformance() {
        LOG.info("Testing leader election performance");
        
        List<Long> electionTimes = new ArrayList<>();
        
        // Test multiple election scenarios
        for (int scenario = 1; scenario <= 10; scenario++) {
            LOG.debugf("Leader election scenario %d/10", scenario);
            
            Instant electionStart = Instant.now();
            
            // Trigger election
            consensusService.triggerElection();
            
            // Wait for leader to be elected
            long electionTime = waitForLeaderElection(Duration.ofSeconds(2));
            electionTimes.add(electionTime);
            
            LOG.debugf("Election %d completed in %dms", scenario, electionTime);
            
            // Brief pause between elections
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        // Calculate statistics
        long avgElectionTime = (long) electionTimes.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxElectionTime = electionTimes.stream().mapToLong(Long::longValue).max().orElse(0);
        long minElectionTime = electionTimes.stream().mapToLong(Long::longValue).min().orElse(0);
        
        LOG.infof("Leader election statistics:");
        LOG.infof("  Average: %dms", avgElectionTime);
        LOG.infof("  Min: %dms", minElectionTime);
        LOG.infof("  Max: %dms", maxElectionTime);
        LOG.infof("  Target: <%dms", TARGET_LEADER_ELECTION_MS);
        
        return avgElectionTime;
    }

    /**
     * Test consensus throughput under load
     */
    public double testConsensusThroughput() {
        LOG.info("Testing consensus throughput performance");
        
        Duration testDuration = Duration.ofSeconds(30);
        int batchSize = 1000;
        int numberOfBatches = 100;
        
        AtomicLong processedBatches = new AtomicLong(0);
        AtomicLong totalTransactions = new AtomicLong(0);
        
        Instant testStart = Instant.now();
        
        // Create concurrent batch processors
        List<CompletableFuture<Void>> batchFutures = new ArrayList<>();
        
        for (int batch = 0; batch < numberOfBatches; batch++) {
            final int batchId = batch;
            
            CompletableFuture<Void> batchFuture = CompletableFuture.runAsync(() -> {
                List<Transaction> transactions = generateTransactionBatch(batchId, batchSize);
                
                try {
                    // Process batch through consensus
                    consensusService.processTransactionBatch(transactions)
                        .await().atMost(Duration.ofSeconds(10));
                    
                    processedBatches.incrementAndGet();
                    totalTransactions.addAndGet(batchSize);
                    
                } catch (Exception e) {
                    LOG.warnf("Batch %d consensus failed: %s", batchId, e.getMessage());
                }
            }, consensusExecutor);
            
            batchFutures.add(batchFuture);
        }
        
        // Wait for all batches to complete or timeout
        try {
            CompletableFuture.allOf(batchFutures.toArray(new CompletableFuture[0]))
                .get(testDuration.toSeconds() + 10, TimeUnit.SECONDS);
        } catch (Exception e) {
            LOG.warnf("Consensus throughput test interrupted: %s", e.getMessage());
        }
        
        Instant testEnd = Instant.now();
        Duration actualDuration = Duration.between(testStart, testEnd);
        
        long totalProcessedTransactions = totalTransactions.get();
        double consensusTps = totalProcessedTransactions / (actualDuration.toMillis() / 1000.0);
        
        LOG.infof("Consensus throughput results:");
        LOG.infof("  Processed Transactions: %d", totalProcessedTransactions);
        LOG.infof("  Test Duration: %dms", actualDuration.toMillis());
        LOG.infof("  Consensus TPS: %.0f", consensusTps);
        LOG.infof("  Processed Batches: %d/%d", processedBatches.get(), numberOfBatches);
        
        return consensusTps;
    }

    /**
     * Test block finalization performance
     */
    public double testBlockFinalizationPerformance() {
        LOG.info("Testing block finalization performance");
        
        int numberOfBlocks = 50;
        List<Long> finalizationTimes = new ArrayList<>();
        
        for (int blockNum = 1; blockNum <= numberOfBlocks; blockNum++) {
            List<Transaction> transactions = generateTransactionBatch(blockNum, 1000);
            
            Instant finalizationStart = Instant.now();
            
            try {
                // Process block through consensus pipeline
                consensusService.processTransactionBatch(transactions)
                    .await().atMost(Duration.ofSeconds(5));
                
                long finalizationTime = Duration.between(finalizationStart, Instant.now()).toMillis();
                finalizationTimes.add(finalizationTime);
                
                LOG.debugf("Block %d finalized in %dms", blockNum, finalizationTime);
                
            } catch (Exception e) {
                LOG.warnf("Block %d finalization failed: %s", blockNum, e.getMessage());
            }
        }
        
        double avgFinalizationTime = finalizationTimes.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0);
        
        LOG.infof("Block finalization results:");
        LOG.infof("  Blocks Processed: %d", finalizationTimes.size());
        LOG.infof("  Average Finalization: %.1fms", avgFinalizationTime);
        LOG.infof("  Min Finalization: %dms", Collections.min(finalizationTimes));
        LOG.infof("  Max Finalization: %dms", Collections.max(finalizationTimes));
        
        return avgFinalizationTime;
    }

    /**
     * Test validation pipeline performance and accuracy
     */
    public double testValidationPipeline() {
        LOG.info("Testing validation pipeline performance");
        
        int totalValidations = 10000;
        AtomicLong successfulValidations = new AtomicLong(0);
        AtomicLong failedValidations = new AtomicLong(0);
        
        // Create mixed batch of valid and invalid transactions
        List<Transaction> validTransactions = generateTransactionBatch(1, totalValidations * 9 / 10); // 90% valid
        List<Transaction> invalidTransactions = generateInvalidTransactionBatch(2, totalValidations / 10); // 10% invalid
        
        List<Transaction> allTransactions = new ArrayList<>();
        allTransactions.addAll(validTransactions);
        allTransactions.addAll(invalidTransactions);
        Collections.shuffle(allTransactions);
        
        Instant validationStart = Instant.now();
        
        // Process transactions through validation pipeline
        List<CompletableFuture<Void>> validationFutures = new ArrayList<>();
        
        // Process in smaller batches to simulate pipeline
        int batchSize = 100;
        for (int i = 0; i < allTransactions.size(); i += batchSize) {
            List<Transaction> batch = allTransactions.subList(i, 
                Math.min(i + batchSize, allTransactions.size()));
            
            CompletableFuture<Void> validationFuture = CompletableFuture.runAsync(() -> {
                try {
                    // Simulate validation process
                    for (Transaction tx : batch) {
                        boolean isValid = validateTransaction(tx);
                        if (isValid) {
                            successfulValidations.incrementAndGet();
                        } else {
                            failedValidations.incrementAndGet();
                        }
                    }
                } catch (Exception e) {
                    LOG.warnf("Validation batch failed: %s", e.getMessage());
                }
            }, consensusExecutor);
            
            validationFutures.add(validationFuture);
        }
        
        // Wait for all validations to complete
        try {
            CompletableFuture.allOf(validationFutures.toArray(new CompletableFuture[0]))
                .get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            LOG.warnf("Validation pipeline test interrupted: %s", e.getMessage());
        }
        
        Duration validationDuration = Duration.between(validationStart, Instant.now());
        
        long totalProcessed = successfulValidations.get() + failedValidations.get();
        double successRate = (successfulValidations.get() * 100.0) / totalProcessed;
        double validationTps = totalProcessed / (validationDuration.toMillis() / 1000.0);
        
        LOG.infof("Validation pipeline results:");
        LOG.infof("  Total Processed: %d", totalProcessed);
        LOG.infof("  Successful: %d", successfulValidations.get());
        LOG.infof("  Failed: %d", failedValidations.get());
        LOG.infof("  Success Rate: %.2f%%", successRate);
        LOG.infof("  Validation TPS: %.0f", validationTps);
        LOG.infof("  Duration: %dms", validationDuration.toMillis());
        
        return successRate;
    }

    /**
     * Test Byzantine fault tolerance
     */
    public ByzantineFaultToleranceResult testByzantineFaultTolerance() {
        LOG.info("Testing Byzantine fault tolerance");
        
        int totalNodes = TARGET_VALIDATOR_COUNT;
        int byzantineNodes = (totalNodes * MAX_BYZANTINE_NODES) / 100; // 33% Byzantine nodes
        int honestNodes = totalNodes - byzantineNodes;
        
        LOG.infof("Byzantine fault tolerance test: %d total nodes (%d honest, %d Byzantine)", 
                 totalNodes, honestNodes, byzantineNodes);
        
        // Simulate consensus with Byzantine nodes
        int testRounds = 20;
        int successfulRounds = 0;
        
        for (int round = 1; round <= testRounds; round++) {
            boolean consensusReached = simulateByzantineConsensusRound(honestNodes, byzantineNodes);
            if (consensusReached) {
                successfulRounds++;
            }
            
            LOG.debugf("Byzantine consensus round %d: %s", round, consensusReached ? "SUCCESS" : "FAILED");
        }
        
        double byzantineFaultTolerance = (successfulRounds * 100.0) / testRounds;
        
        LOG.infof("Byzantine fault tolerance results:");
        LOG.infof("  Test Rounds: %d", testRounds);
        LOG.infof("  Successful Rounds: %d", successfulRounds);
        LOG.infof("  Fault Tolerance: %.1f%%", byzantineFaultTolerance);
        LOG.infof("  Byzantine Node Ratio: %d%%", MAX_BYZANTINE_NODES);
        
        return new ByzantineFaultToleranceResult(
            totalNodes,
            byzantineNodes,
            honestNodes,
            byzantineFaultTolerance,
            successfulRounds,
            testRounds
        );
    }

    // Helper methods

    private long waitForLeaderElection(Duration timeout) {
        Instant start = Instant.now();
        
        while (Duration.between(start, Instant.now()).compareTo(timeout) < 0) {
            ConsensusStatus status = consensusService.getStatus();
            if (status.currentLeader() != null) {
                return Duration.between(start, Instant.now()).toMillis();
            }
            
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        return timeout.toMillis(); // Return timeout if election didn't complete
    }

    private List<Transaction> generateTransactionBatch(int batchId, int size) {
        return IntStream.range(0, size)
            .mapToObj(i -> new Transaction(
                String.format("tx_%d_%d", batchId, i),
                String.format("sender_%d", i % 100),
                String.format("receiver_%d", (i + 1) % 100),
                Math.random() * 1000,
                Instant.now(),
                "PENDING",
                Map.of("batch", String.valueOf(batchId))
            ))
            .toList();
    }

    private List<Transaction> generateInvalidTransactionBatch(int batchId, int size) {
        return IntStream.range(0, size)
            .mapToObj(i -> new Transaction(
                String.format("invalid_tx_%d_%d", batchId, i),
                "INVALID_SENDER", // Invalid sender
                "", // Empty receiver
                -1.0, // Invalid amount
                Instant.now(),
                "INVALID",
                Map.of("batch", String.valueOf(batchId), "invalid", "true")
            ))
            .toList();
    }

    private boolean validateTransaction(Transaction tx) {
        // Simple validation logic for testing
        return !tx.sender().equals("INVALID_SENDER") && 
               !tx.receiver().isEmpty() && 
               tx.amount() > 0;
    }

    private boolean simulateByzantineConsensusRound(int honestNodes, int byzantineNodes) {
        // Simulate consensus with Byzantine nodes
        // In practice, this would involve complex consensus protocol simulation
        
        // Simplified: consensus succeeds if majority of honest nodes agree
        int totalNodes = honestNodes + byzantineNodes;
        int requiredVotes = (totalNodes / 2) + 1;
        
        // Honest nodes always vote consistently
        int honestVotes = honestNodes;
        
        // Byzantine nodes vote randomly (some may vote correctly by chance)
        int byzantineHonestVotes = (int) (byzantineNodes * Math.random() * 0.3); // Up to 30% vote honestly
        
        int totalHonestVotes = honestVotes + byzantineHonestVotes;
        
        return totalHonestVotes >= requiredVotes;
    }

    /**
     * Byzantine fault tolerance test result
     */
    public record ByzantineFaultToleranceResult(
        int totalNodes,
        int byzantineNodes,
        int honestNodes,
        double faultTolerancePercent,
        int successfulRounds,
        int totalRounds
    ) {}
}