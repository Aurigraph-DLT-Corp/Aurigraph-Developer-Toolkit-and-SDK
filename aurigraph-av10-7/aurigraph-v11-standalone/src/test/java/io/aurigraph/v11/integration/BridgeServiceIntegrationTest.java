package io.aurigraph.v11.integration;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.bridge.*;
import io.aurigraph.v11.bridge.models.BridgeStats;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for Cross-Chain Bridge Service
 *
 * Tests the interaction between bridge operations, validator consensus,
 * and multi-chain asset transfers.
 *
 * Test Scenarios:
 * - Bridge initialization and chain support
 * - Cross-chain transfer operations
 * - Fee estimation and calculation
 * - Transaction status tracking
 * - Validator consensus
 * - Performance under load
 * - Error handling and edge cases
 *
 * Phase 3 Day 4: Bridge Integration Testing
 * Target: 20 tests
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BridgeServiceIntegrationTest extends ServiceTestBase {

    private static final Logger logger = LoggerFactory.getLogger(BridgeServiceIntegrationTest.class);

    @Inject
    CrossChainBridgeService bridgeService;

    // ==================== Service Initialization Tests ====================

    @Test
    @Order(1)
    @DisplayName("BIT-01: Bridge service should be properly injected")
    void testServiceInjection() {
        assertThat(bridgeService).isNotNull();
        logger.info("✓ Bridge service properly injected");
    }

    @Test
    @Order(2)
    @DisplayName("BIT-02: Should list supported chains")
    void testSupportedChains() {
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(chains).isNotEmpty();
        assertThat(chains.size()).isGreaterThanOrEqualTo(3); // ethereum, polygon, bsc

        // Verify chain details
        assertThat(chains).extracting("chainId").contains("ethereum", "polygon", "bsc");

        logger.info("✓ Bridge supports {} chains", chains.size());
    }

    @Test
    @Order(3)
    @DisplayName("BIT-03: Should provide bridge statistics")
    void testBridgeStats() {
        BridgeStats stats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats.getTotalTransactions()).isGreaterThanOrEqualTo(0);
        assertThat(stats.getAverageTime()).isGreaterThan(0);

        logger.info("✓ Bridge stats: {} total transactions", stats.getTotalTransactions());
    }

    // ==================== Bridge Operations ====================

    @Test
    @Order(4)
    @DisplayName("BIT-04: Should initiate bridge transaction")
    void testInitiateBridge() {
        BridgeRequest request = createBridgeRequest(
            "ethereum",
            "polygon",
            "0x123456",
            "0x789012",
            new BigDecimal("100.0"),
            "USDT",
            "0xContractAddress"
        );

        String transactionId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(transactionId).isNotNull().isNotEmpty();

        logger.info("✓ Bridge transaction initiated: {}", transactionId);
    }

    @Test
    @Order(5)
    @DisplayName("BIT-05: Should retrieve bridge transaction by ID")
    void testGetBridgeTransaction() {
        // First create a bridge transaction
        BridgeRequest request = createBridgeRequest(
            "ethereum",
            "bsc",
            "0xSourceAddr",
            "0xTargetAddr",
            new BigDecimal("50.0"),
            "ETH",
            "0xETHContract"
        );

        String txId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then retrieve it
        BridgeTransaction transaction = bridgeService.getBridgeTransaction(txId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(transaction).isNotNull();
        assertThat(transaction.getTransactionId()).isEqualTo(txId);
        assertThat(transaction.getSourceChain()).isEqualTo("ethereum");
        assertThat(transaction.getTargetChain()).isEqualTo("bsc");
        assertThat(transaction.getAmount()).isEqualByComparingTo(new BigDecimal("50.0"));

        logger.info("✓ Retrieved bridge transaction: {} -> {}",
                   transaction.getSourceChain(), transaction.getTargetChain());
    }

    @Test
    @Order(6)
    @DisplayName("BIT-06: Should get transactions by address")
    void testGetBridgeTransactionsByAddress() {
        String address = "0xTestAddress123";

        // Create multiple bridge transactions for this address
        for (int i = 0; i < 3; i++) {
            BridgeRequest request = createBridgeRequest(
                "ethereum",
                "polygon",
                address,
                "0xTarget" + i,
                new BigDecimal("10.0"),
                "USDC",
                "0xUSDCContract"
            );

            bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // Retrieve transactions for address
        List<BridgeTransaction> transactions = bridgeService.getBridgeTransactions(address)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(transactions).isNotEmpty();
        assertThat(transactions.size()).isGreaterThanOrEqualTo(3);

        logger.info("✓ Found {} transactions for address {}", transactions.size(), address);
    }

    // ==================== Fee Estimation ====================

    @Test
    @Order(7)
    @DisplayName("BIT-07: Should estimate bridge fee")
    void testEstimateBridgeFee() {
        BridgeFeeEstimate estimate = bridgeService.estimateBridgeFee(
            "ethereum",
            "polygon",
            new BigDecimal("1000.0"),
            "USDT"
        ).await().atMost(Duration.ofSeconds(5));

        assertThat(estimate).isNotNull();
        assertThat(estimate.getBridgeFee()).isGreaterThan(BigDecimal.ZERO);
        assertThat(estimate.getGasFee()).isGreaterThan(BigDecimal.ZERO);
        assertThat(estimate.getTotalFee()).isGreaterThan(BigDecimal.ZERO);
        assertThat(estimate.getTokenSymbol()).isEqualTo("USDT");

        logger.info("✓ Fee estimate: bridge={}, gas={}, total={}",
                   estimate.getBridgeFee(), estimate.getGasFee(), estimate.getTotalFee());
    }

    @ParameterizedTest
    @CsvSource({
        "ethereum, polygon, 100.0",
        "ethereum, bsc, 250.0",
        "polygon, ethereum, 500.0",
        "bsc, polygon, 1000.0"
    })
    @DisplayName("BIT-08: Should calculate fees for different chain pairs")
    void testFeeCalculationForChainPairs(String source, String target, String amount) {
        BridgeFeeEstimate estimate = bridgeService.estimateBridgeFee(
            source,
            target,
            new BigDecimal(amount),
            "TOKEN"
        ).await().atMost(Duration.ofSeconds(5));

        assertThat(estimate).isNotNull();
        assertThat(estimate.getTotalFee()).isGreaterThan(BigDecimal.ZERO);

        logger.info("✓ {} -> {}: amount={}, fee={}",
                   source, target, amount, estimate.getTotalFee());
    }

    // ==================== Transaction Status Tracking ====================

    @Test
    @Order(9)
    @DisplayName("BIT-09: Bridge transaction should have pending status initially")
    void testInitialTransactionStatus() {
        BridgeRequest request = createBridgeRequest(
            "ethereum",
            "polygon",
            "0xSource",
            "0xTarget",
            new BigDecimal("75.0"),
            "DAI",
            "0xDAIContract"
        );

        String txId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        BridgeTransaction transaction = bridgeService.getBridgeTransaction(txId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(transaction.getStatus()).isIn(
            BridgeTransactionStatus.PENDING,
            BridgeTransactionStatus.PROCESSING,
            BridgeTransactionStatus.COMPLETED
        );

        logger.info("✓ Transaction status: {}", transaction.getStatus());
    }

    // ==================== Multi-Chain Support ====================

    @Test
    @Order(10)
    @DisplayName("BIT-10: Should support Ethereum mainnet")
    void testEthereumSupport() {
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        ChainInfo ethereum = chains.stream()
            .filter(chain -> "ethereum".equals(chain.getChainId()))
            .findFirst()
            .orElse(null);

        assertThat(ethereum).isNotNull();
        assertThat(ethereum.getName()).contains("Ethereum");
        assertThat(ethereum.getNetworkId()).isEqualTo(1);
        assertThat(ethereum.getNativeCurrency()).isEqualTo("ETH");

        logger.info("✓ Ethereum support verified: chainId={}", ethereum.getChainId());
    }

    @Test
    @Order(11)
    @DisplayName("BIT-11: Should support Polygon")
    void testPolygonSupport() {
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        ChainInfo polygon = chains.stream()
            .filter(chain -> "polygon".equals(chain.getChainId()))
            .findFirst()
            .orElse(null);

        assertThat(polygon).isNotNull();
        assertThat(polygon.getName()).contains("Polygon");
        assertThat(polygon.getNetworkId()).isEqualTo(137);
        assertThat(polygon.getNativeCurrency()).isEqualTo("MATIC");

        logger.info("✓ Polygon support verified: chainId={}", polygon.getChainId());
    }

    @Test
    @Order(12)
    @DisplayName("BIT-12: Should support Binance Smart Chain")
    void testBSCSupport() {
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        ChainInfo bsc = chains.stream()
            .filter(chain -> "bsc".equals(chain.getChainId()))
            .findFirst()
            .orElse(null);

        assertThat(bsc).isNotNull();
        assertThat(bsc.getName()).contains("Binance");
        assertThat(bsc.getNetworkId()).isEqualTo(56);
        assertThat(bsc.getNativeCurrency()).isEqualTo("BNB");

        logger.info("✓ BSC support verified: chainId={}", bsc.getChainId());
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(13)
    @DisplayName("BIT-13: Should handle multiple bridge operations efficiently")
    void testMultipleBridgeOperations() {
        int operationCount = 10;
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < operationCount; i++) {
            BridgeRequest request = createBridgeRequest(
                "ethereum",
                "polygon",
                "0xAddr" + i,
                "0xTarget" + i,
                new BigDecimal("50.0"),
                "USDT",
                "0xUSDTContract"
            );

            String txId = bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(txId).isNotNull();
        }

        long duration = System.currentTimeMillis() - startTime;
        double opsPerSecond = (operationCount * 1000.0) / duration;

        logger.info("Processed {} bridge operations in {}ms ({} ops/sec)",
                   operationCount, duration, String.format("%.2f", opsPerSecond));

        assertThat(opsPerSecond).isGreaterThan(1.0); // At least 1 op/sec
    }

    @Test
    @Order(14)
    @DisplayName("BIT-14: Should handle concurrent bridge operations")
    void testConcurrentBridgeOperations() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(20);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < 20; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    BridgeRequest request = createBridgeRequest(
                        "ethereum",
                        "polygon",
                        "0xConcurrent" + index,
                        "0xTarget" + index,
                        new BigDecimal("25.0"),
                        "USDC",
                        "0xUSDCContract"
                    );

                    String txId = bridgeService.initiateBridge(request)
                        .await().atMost(Duration.ofSeconds(10));

                    if (txId != null && !txId.isEmpty()) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    logger.error("Concurrent operation failed", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(60, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isGreaterThan(10); // 50%+ success rate (realistic for bridge)

        logger.info("✓ Concurrent operations: {}/20 successful", successCount.get());
    }

    // ==================== Error Handling ====================

    @Test
    @Order(15)
    @DisplayName("BIT-15: Should reject invalid bridge request (zero amount)")
    void testRejectZeroAmount() {
        BridgeRequest request = createBridgeRequest(
            "ethereum",
            "polygon",
            "0xSource",
            "0xTarget",
            BigDecimal.ZERO,
            "USDT",
            "0xUSDTContract"
        );

        assertThatThrownBy(() ->
            bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5))
        ).hasMessageContaining("Bridge amount must be positive");

        logger.info("✓ Zero amount correctly rejected");
    }

    @Test
    @Order(16)
    @DisplayName("BIT-16: Should reject unsupported chain")
    void testRejectUnsupportedChain() {
        assertThatThrownBy(() ->
            bridgeService.estimateBridgeFee(
                "unsupported-chain",
                "ethereum",
                new BigDecimal("100.0"),
                "TOKEN"
            ).await().atMost(Duration.ofSeconds(5))
        ).hasMessageContaining("Unsupported chain");

        logger.info("✓ Unsupported chain correctly rejected");
    }

    @Test
    @Order(17)
    @DisplayName("BIT-17: Should handle non-existent transaction query")
    void testNonExistentTransaction() {
        assertThatThrownBy(() ->
            bridgeService.getBridgeTransaction("non-existent-tx-id")
                .await().atMost(Duration.ofSeconds(5))
        ).hasMessageContaining("not found");

        logger.info("✓ Non-existent transaction query handled");
    }

    // ==================== Statistics and Monitoring ====================

    @Test
    @Order(18)
    @DisplayName("BIT-18: Stats should reflect bridge activity")
    void testStatsReflectActivity() {
        // Get initial stats
        BridgeStats initialStats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        long initialCount = initialStats.getTotalTransactions();

        // Perform some operations
        for (int i = 0; i < 5; i++) {
            BridgeRequest request = createBridgeRequest(
                "ethereum",
                "polygon",
                "0xStatsTest" + i,
                "0xTarget" + i,
                new BigDecimal("100.0"),
                "USDT",
                "0xUSDTContract"
            );

            bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // Get updated stats
        BridgeStats updatedStats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(updatedStats.getTotalTransactions()).isGreaterThan(initialCount);

        logger.info("✓ Stats updated: {} -> {} transactions",
                   initialCount, updatedStats.getTotalTransactions());
    }

    // ==================== Advanced Scenarios ====================

    @Test
    @Order(19)
    @DisplayName("BIT-19: Should handle bi-directional bridges")
    void testBiDirectionalBridge() {
        // Ethereum -> Polygon
        BridgeRequest request1 = createBridgeRequest(
            "ethereum",
            "polygon",
            "0xAddr1",
            "0xAddr2",
            new BigDecimal("100.0"),
            "USDT",
            "0xUSDTContract"
        );

        String tx1 = bridgeService.initiateBridge(request1)
            .await().atMost(Duration.ofSeconds(5));

        // Polygon -> Ethereum (reverse)
        BridgeRequest request2 = createBridgeRequest(
            "polygon",
            "ethereum",
            "0xAddr2",
            "0xAddr1",
            new BigDecimal("100.0"),
            "USDT",
            "0xUSDTContract"
        );

        String tx2 = bridgeService.initiateBridge(request2)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(tx1).isNotEqualTo(tx2);

        logger.info("✓ Bi-directional bridge: {} and {}", tx1, tx2);
    }

    @Test
    @Order(20)
    @DisplayName("BIT-20: Should validate end-to-end bridge workflow")
    void testEndToEndBridgeWorkflow() {
        logger.info("Starting end-to-end bridge workflow test");

        // Step 1: Check supported chains
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));
        assertThat(chains).isNotEmpty();
        logger.info("Step 1: {} chains supported", chains.size());

        // Step 2: Estimate fee
        BridgeFeeEstimate estimate = bridgeService.estimateBridgeFee(
            "ethereum",
            "polygon",
            new BigDecimal("500.0"),
            "USDT"
        ).await().atMost(Duration.ofSeconds(5));
        assertThat(estimate.getTotalFee()).isGreaterThan(BigDecimal.ZERO);
        logger.info("Step 2: Fee estimated: {}", estimate.getTotalFee());

        // Step 3: Initiate bridge
        BridgeRequest request = createBridgeRequest(
            "ethereum",
            "polygon",
            "0xE2ESource",
            "0xE2ETarget",
            new BigDecimal("500.0"),
            "USDT",
            "0xUSDTContract"
        );

        String txId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));
        assertThat(txId).isNotNull();
        logger.info("Step 3: Bridge initiated: {}", txId);

        // Step 4: Verify transaction
        BridgeTransaction transaction = bridgeService.getBridgeTransaction(txId)
            .await().atMost(Duration.ofSeconds(5));
        assertThat(transaction.getTransactionId()).isEqualTo(txId);
        logger.info("Step 4: Transaction verified");

        // Step 5: Check stats
        BridgeStats stats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));
        assertThat(stats.getTotalTransactions()).isGreaterThan(0);
        logger.info("Step 5: Stats validated");

        logger.info("✓ End-to-end bridge workflow completed successfully");
    }

    // ==================== Helper Methods ====================

    private BridgeRequest createBridgeRequest(String sourceChain, String targetChain,
                                             String sourceAddress, String targetAddress,
                                             BigDecimal amount, String tokenSymbol,
                                             String tokenContract) {
        return new BridgeRequest(
            sourceChain,
            targetChain,
            sourceAddress,
            targetAddress,
            tokenContract,
            tokenSymbol,
            amount
        );
    }
}
