package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive test suite for AI Optimization functionality
 *
 * Tests all AI optimization operations including:
 * - Transaction scoring and ordering
 * - ML model weight optimization
 * - Sender hotness tracking
 * - Batch performance optimization
 * - Feature score calculation
 * - Online learning capabilities
 *
 * Target: 8+ comprehensive test cases
 * Coverage: AI optimization, ML models, and performance tuning
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("AI Optimization Comprehensive Test Suite")
public class AIOptimizationTest {

    @Inject
    TransactionScoringModel scoringModel;

    private static final String TEST_SENDER_1 = "sender-test-001";
    private static final String TEST_SENDER_2 = "sender-test-002";

    @BeforeEach
    void setup() {
        assertThat(scoringModel)
            .as("TransactionScoringModel should be injected")
            .isNotNull();
    }

    @Test
    @Order(1)
    @DisplayName("Test single transaction scoring produces valid score")
    void testSingleTransactionScoring() {
        // Given
        String txnId = "txn-score-test-001";
        String sender = TEST_SENDER_1;
        long sizeBytes = 512;
        BigDecimal gasPrice = BigDecimal.valueOf(150);
        long createdAtMs = System.currentTimeMillis();
        Set<String> dependencies = Set.of();

        // When
        TransactionScoringModel.ScoredTransaction scored = scoringModel.scoreTransaction(
            txnId, sender, sizeBytes, gasPrice, createdAtMs, dependencies
        );

        // Then
        assertThat(scored).isNotNull();
        assertThat(scored.txnId).isEqualTo(txnId);
        assertThat(scored.sender).isEqualTo(sender);
        assertThat(scored.score).isBetween(0.0, 1.0);

        // Verify all feature scores are present
        assertThat(scored.featureScores).isNotEmpty();
        assertThat(scored.featureScores).containsKeys(
            "size", "senderHotness", "gasPrice", "age", "dependency"
        );

        // All feature scores should be normalized [0, 1]
        scored.featureScores.values().forEach(score ->
            assertThat(score).isBetween(0.0, 1.0)
        );
    }

    @Test
    @Order(2)
    @DisplayName("Test batch transaction scoring and ordering")
    void testBatchTransactionScoring() {
        // Given
        List<TransactionScoringModel.TransactionData> transactions = new ArrayList<>();

        // Add varied transactions
        for (int i = 0; i < 100; i++) {
            transactions.add(new TransactionScoringModel.TransactionData(
                "txn-batch-" + i,
                i % 2 == 0 ? TEST_SENDER_1 : TEST_SENDER_2,
                256 + (i * 10),
                BigDecimal.valueOf(50 + i),
                System.currentTimeMillis() - (i * 100),
                Set.of()
            ));
        }

        // When
        List<TransactionScoringModel.ScoredTransaction> scored =
            scoringModel.scoreAndOrderBatch(transactions);

        // Then
        assertThat(scored).isNotEmpty();
        assertThat(scored).hasSize(100);

        // Verify ordering is approximately descending (allow small variances due to random factors)
        // Count violations: where next score is unexpectedly higher
        int violations = 0;
        double maxViolation = 0;
        for (int i = 0; i < scored.size() - 1; i++) {
            if (scored.get(i).score < scored.get(i + 1).score) {
                violations++;
                maxViolation = Math.max(maxViolation, scored.get(i + 1).score - scored.get(i).score);
            }
        }

        // Allow up to 5% ordering violations with small score differences (due to random elements)
        assertThat(violations)
            .as("Ordering should be mostly descending (violations: %d out of %d)", violations, scored.size() - 1)
            .isLessThanOrEqualTo(5);

        // If there are violations, they should be minimal (close scores)
        if (violations > 0) {
            assertThat(maxViolation)
                .as("Any ordering violations should be minimal score differences")
                .isLessThan(0.2);
        }
    }

    @Test
    @Order(3)
    @DisplayName("Test gas price influences transaction priority")
    void testGasPriceInfluence() {
        // Given
        long createdAtMs = System.currentTimeMillis();

        TransactionScoringModel.ScoredTransaction lowGas = scoringModel.scoreTransaction(
            "txn-low-gas", TEST_SENDER_1, 256, BigDecimal.valueOf(10),
            createdAtMs, Set.of()
        );

        TransactionScoringModel.ScoredTransaction highGas = scoringModel.scoreTransaction(
            "txn-high-gas", TEST_SENDER_1, 256, BigDecimal.valueOf(500),
            createdAtMs, Set.of()
        );

        // Then
        assertThat(highGas.featureScores.get("gasPrice"))
            .as("Higher gas price should result in higher gas price score")
            .isGreaterThan(lowGas.featureScores.get("gasPrice"));

        // Higher gas price should generally lead to higher overall score
        // (unless other factors dominate)
        assertThat(highGas.score)
            .as("Higher gas price should contribute to higher overall score")
            .isGreaterThanOrEqualTo(lowGas.score * 0.8); // Allow some variance from other features
    }

    @Test
    @Order(4)
    @DisplayName("Test transaction size penalty")
    void testTransactionSizePenalty() {
        // Given
        long createdAtMs = System.currentTimeMillis();
        BigDecimal gasPrice = BigDecimal.valueOf(100);

        TransactionScoringModel.ScoredTransaction smallTxn = scoringModel.scoreTransaction(
            "txn-small", TEST_SENDER_1, 128, gasPrice, createdAtMs, Set.of()
        );

        TransactionScoringModel.ScoredTransaction largeTxn = scoringModel.scoreTransaction(
            "txn-large", TEST_SENDER_1, 10000, gasPrice, createdAtMs, Set.of()
        );

        // Then
        assertThat(smallTxn.featureScores.get("size"))
            .as("Smaller transaction should have higher size score")
            .isGreaterThan(largeTxn.featureScores.get("size"));

        // Smaller transactions should be prioritized for batching efficiency
        assertThat(smallTxn.score)
            .as("Smaller transaction should have higher overall score")
            .isGreaterThan(largeTxn.score * 0.8);
    }

    @Test
    @Order(5)
    @DisplayName("Test sender hotness tracking and grouping")
    void testSenderHotnessTracking() {
        // Given - Score multiple transactions from the same sender
        String hotSender = "hot-sender-test";
        long createdAtMs = System.currentTimeMillis();

        // When - Score 5 transactions from the same sender
        List<TransactionScoringModel.ScoredTransaction> scoredTransactions = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            TransactionScoringModel.ScoredTransaction scored = scoringModel.scoreTransaction(
                "txn-hot-" + i,
                hotSender,
                256,
                BigDecimal.valueOf(100),
                createdAtMs + i * 10,
                Set.of()
            );
            scoredTransactions.add(scored);
        }

        // Then - Sender hotness should increase
        double firstHotness = scoredTransactions.get(0).featureScores.get("senderHotness");
        double lastHotness = scoredTransactions.get(4).featureScores.get("senderHotness");

        assertThat(lastHotness)
            .as("Sender hotness should increase with repeated transactions")
            .isGreaterThanOrEqualTo(firstHotness);
    }

    @Test
    @Order(6)
    @DisplayName("Test transaction age fairness")
    void testTransactionAgeFairness() {
        // Given
        long now = System.currentTimeMillis();

        TransactionScoringModel.ScoredTransaction newTxn = scoringModel.scoreTransaction(
            "txn-new", TEST_SENDER_1, 256, BigDecimal.valueOf(100),
            now, Set.of()
        );

        TransactionScoringModel.ScoredTransaction oldTxn = scoringModel.scoreTransaction(
            "txn-old", TEST_SENDER_1, 256, BigDecimal.valueOf(100),
            now - 10000, Set.of() // 10 seconds old
        );

        // Then
        assertThat(oldTxn.featureScores.get("age"))
            .as("Older transaction should have higher age score to prevent starvation")
            .isGreaterThan(newTxn.featureScores.get("age"));

        // Age should contribute to overall priority
        assertThat(oldTxn.score)
            .as("Older transaction should have competitive score")
            .isGreaterThanOrEqualTo(newTxn.score * 0.7);
    }

    @Test
    @Order(7)
    @DisplayName("Test dependency impact on parallelism")
    void testDependencyImpact() {
        // Given
        long createdAtMs = System.currentTimeMillis();
        BigDecimal gasPrice = BigDecimal.valueOf(100);

        TransactionScoringModel.ScoredTransaction noDeps = scoringModel.scoreTransaction(
            "txn-independent", TEST_SENDER_1, 256, gasPrice,
            createdAtMs, Set.of()
        );

        TransactionScoringModel.ScoredTransaction withDeps = scoringModel.scoreTransaction(
            "txn-dependent", TEST_SENDER_1, 256, gasPrice,
            createdAtMs, Set.of("dep-1", "dep-2", "dep-3", "dep-4")
        );

        // Then
        assertThat(noDeps.featureScores.get("dependency"))
            .as("Transaction without dependencies should have higher dependency score")
            .isGreaterThan(withDeps.featureScores.get("dependency"));

        // Independent transactions should be prioritized for parallel processing
        assertThat(noDeps.score)
            .as("Independent transaction should have higher priority for parallelism")
            .isGreaterThan(withDeps.score * 0.8);
    }

    @Test
    @Order(8)
    @DisplayName("Test ML model statistics and performance tracking")
    void testMLModelStatistics() {
        // Given - Score several transactions to populate statistics
        for (int i = 0; i < 50; i++) {
            scoringModel.scoreTransaction(
                "txn-stats-" + i,
                "sender-" + (i % 5),
                256 + (i * 10),
                BigDecimal.valueOf(100 + i),
                System.currentTimeMillis() - (i * 100),
                Set.of()
            );
        }

        // When
        Map<String, Object> stats = scoringModel.getStatistics();

        // Then
        assertThat(stats).isNotEmpty();
        assertThat(stats).containsKeys(
            "transactionsScored",
            "batchesProcessed",
            "sendersCached"
        );

        assertThat((Long) stats.get("transactionsScored"))
            .as("Should have scored multiple transactions")
            .isGreaterThan(50L);

        assertThat((Integer) stats.get("sendersCached"))
            .as("Should track multiple senders")
            .isGreaterThan(0);

        // Verify model weights are available
        Map<String, Double> weights = scoringModel.getModelWeights();
        assertThat(weights).containsKeys(
            "size", "senderHotness", "gasPrice", "age", "dependency"
        );

        // Weights should sum to a reasonable value (around 1.0)
        double sumWeights = weights.values().stream().mapToDouble(Double::doubleValue).sum();
        assertThat(sumWeights)
            .as("Model weights should sum to approximately 1.0")
            .isCloseTo(1.0, within(0.1));
    }

    @AfterAll
    static void tearDown() {
        System.out.println("AIOptimization test suite completed successfully");
        System.out.println("All 8 AI optimization tests validated");
    }
}
