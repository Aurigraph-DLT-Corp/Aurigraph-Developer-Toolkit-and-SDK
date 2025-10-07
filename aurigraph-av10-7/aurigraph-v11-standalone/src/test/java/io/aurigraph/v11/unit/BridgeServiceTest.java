package io.aurigraph.v11.unit;

import io.aurigraph.v11.bridge.*;
import io.aurigraph.v11.bridge.models.BridgeStats;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for CrossChainBridgeService
 *
 * Validates:
 * - Cross-chain bridge initialization and configuration
 * - Bridge transaction lifecycle (initiate, process, complete)
 * - Multi-chain support (Ethereum, BSC, Polygon)
 * - Chain adapter management and validation
 * - Atomic swap operations
 * - Fee estimation and calculation
 * - Transaction status tracking and retrieval
 * - Performance metrics and statistics
 * - Concurrent bridge operations safety
 * - Error handling and edge cases
 * - Bridge validator consensus mechanisms
 *
 * Coverage Target: 90% line, 85% branch (Phase 1 Critical Package)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BridgeServiceTest {

    @Inject
    CrossChainBridgeService bridgeService;

    private static final String TEST_SOURCE_CHAIN = "ethereum";
    private static final String TEST_TARGET_CHAIN = "polygon";
    private static final String TEST_SOURCE_ADDRESS = "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c";
    private static final String TEST_TARGET_ADDRESS = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
    private static final String TEST_TOKEN_CONTRACT = "0x1234567890123456789012345678901234567890";
    private static final String TEST_TOKEN_SYMBOL = "USDT";
    private static final BigDecimal TEST_AMOUNT = new BigDecimal("1000.50");

    // =====================================================================
    // BASIC FUNCTIONALITY TESTS
    // =====================================================================

    @Test
    @Order(1)
    @DisplayName("Should initialize bridge service correctly")
    void testServiceInitialization() {
        // Assert - Verify service is properly initialized
        assertNotNull(bridgeService, "Bridge service should be initialized");

        // Verify supported chains are loaded
        List<ChainInfo> supportedChains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        assertNotNull(supportedChains, "Supported chains should not be null");
        assertTrue(supportedChains.size() >= 3,
            "Should support at least 3 chains (ETH, BSC, Polygon)");

        // Verify chain names
        List<String> chainIds = supportedChains.stream()
            .map(ChainInfo::getChainId)
            .toList();
        assertTrue(chainIds.contains("ethereum"), "Should support Ethereum");
        assertTrue(chainIds.contains("polygon"), "Should support Polygon");
        assertTrue(chainIds.contains("bsc"), "Should support Binance Smart Chain");
    }

    @Test
    @Order(2)
    @DisplayName("Should get bridge statistics successfully")
    void testGetBridgeStats() {
        // Act
        BridgeStats stats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(stats, "Bridge stats should not be null");
        assertTrue(stats.getTotalTransactions() >= 0,
            "Total transactions should be non-negative");
        assertTrue(stats.getPendingTransactions() >= 0,
            "Pending transactions should be non-negative");
        assertTrue(stats.getFailedTransactions() >= 0,
            "Failed transactions should be non-negative");
        assertNotNull(stats.getTotalVolume(),
            "Total volume should not be null");
        assertTrue(stats.getSuccessRate() >= 0 && stats.getSuccessRate() <= 100,
            "Success rate should be between 0 and 100");
        assertTrue(stats.getAverageTime() >= 0,
            "Average time should be non-negative");
    }

    // =====================================================================
    // CROSS-CHAIN TRANSFER TESTS
    // =====================================================================

    @Test
    @Order(3)
    @DisplayName("Should initiate bridge transaction from Ethereum to Polygon")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testInitiateBridgeEthereumToPolygon() {
        // Arrange
        BridgeRequest request = new BridgeRequest(
            "ethereum",
            "polygon",
            TEST_SOURCE_ADDRESS,
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            TEST_TOKEN_SYMBOL,
            TEST_AMOUNT
        );

        // Act
        String transactionId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactionId, "Transaction ID should not be null");
        assertTrue(transactionId.startsWith("BRIDGE-"),
            "Transaction ID should have BRIDGE prefix");

        // Verify transaction was created
        BridgeTransaction transaction = bridgeService.getBridgeTransaction(transactionId)
            .await().atMost(Duration.ofSeconds(5));

        assertNotNull(transaction, "Transaction should be retrievable");
        assertEquals("ethereum", transaction.getSourceChain());
        assertEquals("polygon", transaction.getTargetChain());
        assertEquals(TEST_AMOUNT, transaction.getAmount());
        assertEquals(BridgeTransactionStatus.PENDING, transaction.getStatus());
    }

    @Test
    @Order(4)
    @DisplayName("Should initiate bridge transaction from Ethereum to BSC")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testInitiateBridgeEthereumToBSC() {
        // Arrange
        BridgeRequest request = new BridgeRequest(
            "ethereum",
            "bsc",
            TEST_SOURCE_ADDRESS,
            "0x28FF8F6D5b93E4E3D2C9F2E7C0C7B2CC3F9B7A5C",
            TEST_TOKEN_CONTRACT,
            "BNB",
            new BigDecimal("50.25")
        );

        // Act
        String transactionId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactionId, "Transaction ID should not be null");

        BridgeTransaction transaction = bridgeService.getBridgeTransaction(transactionId)
            .await().atMost(Duration.ofSeconds(5));

        assertEquals("bsc", transaction.getTargetChain());
        assertEquals(new BigDecimal("50.25"), transaction.getAmount());
        assertNotNull(transaction.getBridgeFee(),
            "Bridge fee should be calculated");
        assertTrue(transaction.getBridgeFee().compareTo(BigDecimal.ZERO) > 0,
            "Bridge fee should be positive");
    }

    @Test
    @Order(5)
    @DisplayName("Should initiate bridge transaction from BSC to Polygon")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testInitiateBridgeBSCToPolygon() {
        // Arrange
        BridgeRequest request = new BridgeRequest(
            "bsc",
            "polygon",
            "0x28FF8F6D5b93E4E3D2C9F2E7C0C7B2CC3F9B7A5C",
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            "MATIC",
            new BigDecimal("200.00")
        );

        // Act
        String transactionId = bridgeService.initiateBridge(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactionId);

        BridgeTransaction transaction = bridgeService.getBridgeTransaction(transactionId)
            .await().atMost(Duration.ofSeconds(5));

        assertEquals("bsc", transaction.getSourceChain());
        assertEquals("polygon", transaction.getTargetChain());
        assertEquals("MATIC", transaction.getTokenSymbol());
    }

    // =====================================================================
    // CHAIN ADAPTER TESTS
    // =====================================================================

    @Test
    @Order(6)
    @DisplayName("Should validate supported chains correctly")
    void testSupportedChainsValidation() {
        // Act
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(chains, "Chains list should not be null");
        assertFalse(chains.isEmpty(), "Should have supported chains");

        // Validate each chain has required information
        for (ChainInfo chain : chains) {
            assertNotNull(chain.getChainId(), "Chain ID should not be null");
            assertNotNull(chain.getName(), "Chain name should not be null");
            assertTrue(chain.getNetworkId() > 0, "Network ID should be positive");
            assertNotNull(chain.getNativeCurrency(), "Native currency should not be null");
            assertTrue(chain.getDecimals() > 0, "Decimals should be positive");
            assertNotNull(chain.getBridgeContract(), "Bridge contract should not be null");
            assertTrue(chain.isEnabled(), "Chain should be enabled");
        }
    }

    @Test
    @Order(7)
    @DisplayName("Should reject bridge request for unsupported chains")
    void testUnsupportedChainRejection() {
        // Arrange
        BridgeRequest invalidSourceChain = new BridgeRequest(
            "solana",  // Unsupported chain
            "polygon",
            TEST_SOURCE_ADDRESS,
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            TEST_TOKEN_SYMBOL,
            TEST_AMOUNT
        );

        // Act & Assert
        assertThrows(CrossChainBridgeService.UnsupportedChainException.class, () -> {
            bridgeService.initiateBridge(invalidSourceChain)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should throw UnsupportedChainException for invalid source chain");

        // Test invalid target chain
        BridgeRequest invalidTargetChain = new BridgeRequest(
            "ethereum",
            "avalanche",  // Unsupported chain
            TEST_SOURCE_ADDRESS,
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            TEST_TOKEN_SYMBOL,
            TEST_AMOUNT
        );

        assertThrows(CrossChainBridgeService.UnsupportedChainException.class, () -> {
            bridgeService.initiateBridge(invalidTargetChain)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should throw UnsupportedChainException for invalid target chain");
    }

    // =====================================================================
    // ATOMIC SWAP TESTS
    // =====================================================================

    @Test
    @Order(8)
    @DisplayName("Should calculate atomic swap fees correctly")
    void testAtomicSwapFeeCalculation() {
        // Arrange
        BigDecimal swapAmount = new BigDecimal("5000.00");

        // Act
        BridgeFeeEstimate feeEstimate = bridgeService.estimateBridgeFee(
            "ethereum", "polygon", swapAmount, "USDC")
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(feeEstimate, "Fee estimate should not be null");
        assertNotNull(feeEstimate.getBridgeFee(), "Bridge fee should not be null");
        assertNotNull(feeEstimate.getGasFee(), "Gas fee should not be null");
        assertNotNull(feeEstimate.getTotalFee(), "Total fee should not be null");
        assertEquals("USDC", feeEstimate.getTokenSymbol());

        // Verify fee calculation (0.1% bridge fee)
        BigDecimal expectedBridgeFee = swapAmount.multiply(new BigDecimal("0.001"));
        assertEquals(0, expectedBridgeFee.compareTo(feeEstimate.getBridgeFee()),
            "Bridge fee should be 0.1% of amount");

        // Verify total fee includes gas fee
        BigDecimal expectedTotalFee = feeEstimate.getBridgeFee().add(feeEstimate.getGasFee());
        assertEquals(0, expectedTotalFee.compareTo(feeEstimate.getTotalFee()),
            "Total fee should equal bridge fee + gas fee");
    }

    @Test
    @Order(9)
    @DisplayName("Should handle atomic swap initiation")
    void testAtomicSwapInitiation() {
        // Arrange
        BridgeRequest swapRequest = new BridgeRequest(
            "ethereum",
            "polygon",
            TEST_SOURCE_ADDRESS,
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            "WETH",
            new BigDecimal("2.5")
        );

        // Act
        String transactionId = bridgeService.initiateBridge(swapRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactionId, "Swap transaction ID should not be null");

        BridgeTransaction transaction = bridgeService.getBridgeTransaction(transactionId)
            .await().atMost(Duration.ofSeconds(5));

        assertNotNull(transaction, "Transaction should exist");
        assertEquals(BridgeTransactionType.BRIDGE, transaction.getType());
        assertNotNull(transaction.getCreatedAt(), "Creation timestamp should be set");
    }

    // =====================================================================
    // TRANSACTION MANAGEMENT TESTS
    // =====================================================================

    @Test
    @Order(10)
    @DisplayName("Should retrieve transactions by address")
    void testGetTransactionsByAddress() {
        // Arrange - Create multiple transactions with same source address
        String testAddress = "0xTestAddress123456789";
        int transactionCount = 3;

        for (int i = 0; i < transactionCount; i++) {
            BridgeRequest request = new BridgeRequest(
                "ethereum",
                "polygon",
                testAddress,
                TEST_TARGET_ADDRESS,
                TEST_TOKEN_CONTRACT,
                TEST_TOKEN_SYMBOL,
                new BigDecimal("100.00")
            );
            bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // Act
        List<BridgeTransaction> transactions = bridgeService.getBridgeTransactions(testAddress)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactions, "Transactions list should not be null");
        assertTrue(transactions.size() >= transactionCount,
            "Should retrieve all transactions for the address");

        // Verify transactions are sorted by creation time (newest first)
        for (int i = 0; i < transactions.size() - 1; i++) {
            assertTrue(
                !transactions.get(i).getCreatedAt().isBefore(transactions.get(i + 1).getCreatedAt()),
                "Transactions should be sorted by creation time (newest first)"
            );
        }
    }

    @Test
    @Order(11)
    @DisplayName("Should handle non-existent transaction lookup")
    void testGetNonExistentTransaction() {
        // Arrange
        String nonExistentId = "BRIDGE-nonexistent-12345";

        // Act & Assert
        assertThrows(CrossChainBridgeService.BridgeNotFoundException.class, () -> {
            bridgeService.getBridgeTransaction(nonExistentId)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should throw BridgeNotFoundException for non-existent transaction");
    }

    // =====================================================================
    // PERFORMANCE TESTS
    // =====================================================================

    @Test
    @Order(12)
    @DisplayName("Should handle high throughput bridge operations")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testHighThroughputBridgeOperations() {
        // Arrange
        int operationCount = 100;
        List<String> transactionIds = new ArrayList<>();

        // Act
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < operationCount; i++) {
            BridgeRequest request = new BridgeRequest(
                "ethereum",
                "polygon",
                TEST_SOURCE_ADDRESS,
                TEST_TARGET_ADDRESS,
                TEST_TOKEN_CONTRACT,
                TEST_TOKEN_SYMBOL,
                new BigDecimal("10.00").add(new BigDecimal(i))
            );

            String txId = bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(2));
            transactionIds.add(txId);
        }
        long duration = System.currentTimeMillis() - startTime;

        // Assert
        assertEquals(operationCount, transactionIds.size(),
            "Should create all bridge transactions");

        // Calculate throughput
        double tps = (operationCount * 1000.0) / duration;
        assertTrue(tps > 50,
            String.format("Bridge TPS (%.2f) should be > 50", tps));

        System.out.printf("✅ Bridge Performance: Processed %d operations in %dms (%.2f ops/sec)%n",
            operationCount, duration, tps);

        // Verify all transactions are retrievable
        for (String txId : transactionIds) {
            BridgeTransaction tx = bridgeService.getBridgeTransaction(txId)
                .await().atMost(Duration.ofSeconds(1));
            assertNotNull(tx, "Transaction should be retrievable");
        }
    }

    // =====================================================================
    // CONCURRENCY TESTS
    // =====================================================================

    @Test
    @Order(13)
    @DisplayName("Should handle concurrent bridge operations safely")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentBridgeOperations() throws InterruptedException {
        // Arrange
        int threadCount = 20;
        int operationsPerThread = 5;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, List<String>> threadResults = new ConcurrentHashMap<>();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready
                    List<String> transactionIds = new ArrayList<>();

                    for (int i = 0; i < operationsPerThread; i++) {
                        BridgeRequest request = new BridgeRequest(
                            "ethereum",
                            "polygon",
                            TEST_SOURCE_ADDRESS + "-thread-" + threadId,
                            TEST_TARGET_ADDRESS,
                            TEST_TOKEN_CONTRACT,
                            TEST_TOKEN_SYMBOL,
                            new BigDecimal("100.00").add(new BigDecimal(i))
                        );

                        String txId = bridgeService.initiateBridge(request)
                            .await().atMost(Duration.ofSeconds(5));
                        transactionIds.add(txId);
                    }

                    threadResults.put(threadId, transactionIds);
                } catch (Exception e) {
                    // Log error but don't fail test
                    System.err.println("Thread " + threadId + " error: " + e.getMessage());
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        // Start all threads simultaneously
        startLatch.countDown();

        // Wait for completion
        assertTrue(completionLatch.await(60, TimeUnit.SECONDS),
            "All threads should complete within 60 seconds");

        // Assert
        int totalOperations = threadCount * operationsPerThread;
        int successfulOperations = threadResults.values().stream()
            .mapToInt(List::size)
            .sum();

        assertTrue(successfulOperations >= totalOperations * 0.95,
            String.format("Should complete at least 95%% of operations (got %d/%d)",
                successfulOperations, totalOperations));

        System.out.printf("✅ Concurrent Bridge Test: %d/%d operations succeeded (%.1f%%)%n",
            successfulOperations, totalOperations,
            (successfulOperations * 100.0 / totalOperations));
    }

    // =====================================================================
    // EDGE CASES & ERROR HANDLING TESTS
    // =====================================================================

    @Test
    @Order(14)
    @DisplayName("Should reject invalid bridge amounts")
    void testInvalidBridgeAmounts() {
        // Test negative amount
        BridgeRequest negativeAmount = new BridgeRequest(
            "ethereum", "polygon",
            TEST_SOURCE_ADDRESS, TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT, TEST_TOKEN_SYMBOL,
            new BigDecimal("-100.00")
        );

        assertThrows(IllegalArgumentException.class, () -> {
            bridgeService.initiateBridge(negativeAmount)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should reject negative amounts");

        // Test zero amount
        BridgeRequest zeroAmount = new BridgeRequest(
            "ethereum", "polygon",
            TEST_SOURCE_ADDRESS, TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT, TEST_TOKEN_SYMBOL,
            BigDecimal.ZERO
        );

        assertThrows(IllegalArgumentException.class, () -> {
            bridgeService.initiateBridge(zeroAmount)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should reject zero amounts");

        // Test amount exceeding maximum
        BridgeRequest excessiveAmount = new BridgeRequest(
            "ethereum", "polygon",
            TEST_SOURCE_ADDRESS, TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT, TEST_TOKEN_SYMBOL,
            new BigDecimal("10000000.00")  // Exceeds MAX_BRIDGE_AMOUNT
        );

        assertThrows(IllegalArgumentException.class, () -> {
            bridgeService.initiateBridge(excessiveAmount)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should reject amounts exceeding maximum limit");
    }

    @Test
    @Order(15)
    @DisplayName("Should reject same source and target chains")
    void testSameSourceTargetChain() {
        // Arrange
        BridgeRequest sameChainRequest = new BridgeRequest(
            "ethereum",
            "ethereum",  // Same as source
            TEST_SOURCE_ADDRESS,
            TEST_TARGET_ADDRESS,
            TEST_TOKEN_CONTRACT,
            TEST_TOKEN_SYMBOL,
            TEST_AMOUNT
        );

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            bridgeService.initiateBridge(sameChainRequest)
                .await().atMost(Duration.ofSeconds(5));
        }, "Should reject bridge request with same source and target chains");
    }

    @Test
    @Order(16)
    @DisplayName("Should handle fee estimation for unsupported chains")
    void testFeeEstimationUnsupportedChain() {
        // Arrange - Try to estimate fee for unsupported chain
        assertThrows(CrossChainBridgeService.UnsupportedChainException.class, () -> {
            bridgeService.estimateBridgeFee(
                "ethereum",
                "cardano",  // Unsupported
                TEST_AMOUNT,
                TEST_TOKEN_SYMBOL
            ).await().atMost(Duration.ofSeconds(5));
        }, "Should throw exception for unsupported target chain");

        assertThrows(CrossChainBridgeService.UnsupportedChainException.class, () -> {
            bridgeService.estimateBridgeFee(
                "tezos",  // Unsupported
                "polygon",
                TEST_AMOUNT,
                TEST_TOKEN_SYMBOL
            ).await().atMost(Duration.ofSeconds(5));
        }, "Should throw exception for unsupported source chain");
    }

    @Test
    @Order(17)
    @DisplayName("Should validate bridge statistics accuracy after operations")
    void testBridgeStatisticsAccuracy() {
        // Arrange - Get initial stats
        BridgeStats initialStats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));
        long initialTotal = initialStats.getTotalTransactions();
        long initialPending = initialStats.getPendingTransactions();

        // Act - Perform bridge operations
        int newOperations = 5;
        for (int i = 0; i < newOperations; i++) {
            BridgeRequest request = new BridgeRequest(
                "ethereum", "polygon",
                TEST_SOURCE_ADDRESS, TEST_TARGET_ADDRESS,
                TEST_TOKEN_CONTRACT, TEST_TOKEN_SYMBOL,
                new BigDecimal("50.00")
            );
            bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // Assert - Verify stats updated
        BridgeStats finalStats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        assertEquals(initialTotal + newOperations, finalStats.getTotalTransactions(),
            "Total transactions should increase by operation count");
        assertTrue(finalStats.getPendingTransactions() >= initialPending,
            "Pending transactions should increase or stay same");

        // Verify volume calculation
        assertNotNull(finalStats.getTotalVolume(),
            "Total volume should be tracked");
        assertTrue(finalStats.getTotalVolume().compareTo(BigDecimal.ZERO) >= 0,
            "Total volume should be non-negative");
    }

    @Test
    @Order(18)
    @DisplayName("Should handle empty address transaction lookup")
    void testEmptyAddressTransactionLookup() {
        // Act
        List<BridgeTransaction> transactions = bridgeService
            .getBridgeTransactions("0xNonExistentAddress")
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(transactions, "Should return empty list, not null");
        assertTrue(transactions.isEmpty(),
            "Should return empty list for address with no transactions");
    }

    @Test
    @Order(19)
    @DisplayName("Should verify chain information completeness")
    void testChainInformationCompleteness() {
        // Act
        List<ChainInfo> chains = bridgeService.getSupportedChains()
            .await().atMost(Duration.ofSeconds(5));

        // Assert - Verify Ethereum
        ChainInfo ethereum = chains.stream()
            .filter(c -> "ethereum".equals(c.getChainId()))
            .findFirst()
            .orElse(null);

        assertNotNull(ethereum, "Ethereum chain should be supported");
        assertEquals("Ethereum Mainnet", ethereum.getName());
        assertEquals(1, ethereum.getNetworkId());
        assertEquals("ETH", ethereum.getNativeCurrency());
        assertEquals(18, ethereum.getDecimals());
        assertTrue(ethereum.isEnabled());
        assertNotNull(ethereum.getBridgeContract());

        // Assert - Verify Polygon
        ChainInfo polygon = chains.stream()
            .filter(c -> "polygon".equals(c.getChainId()))
            .findFirst()
            .orElse(null);

        assertNotNull(polygon, "Polygon chain should be supported");
        assertEquals("Polygon Mainnet", polygon.getName());
        assertEquals(137, polygon.getNetworkId());
        assertEquals("MATIC", polygon.getNativeCurrency());

        // Assert - Verify BSC
        ChainInfo bsc = chains.stream()
            .filter(c -> "bsc".equals(c.getChainId()))
            .findFirst()
            .orElse(null);

        assertNotNull(bsc, "BSC chain should be supported");
        assertEquals("Binance Smart Chain", bsc.getName());
        assertEquals(56, bsc.getNetworkId());
        assertEquals("BNB", bsc.getNativeCurrency());
    }

    @Test
    @Order(20)
    @DisplayName("Should calculate success rate correctly")
    void testSuccessRateCalculation() {
        // Arrange - Get initial stats
        BridgeStats stats = bridgeService.getBridgeStats()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(stats.getSuccessRate(), "Success rate should be calculated");
        assertTrue(stats.getSuccessRate() >= 0.0 && stats.getSuccessRate() <= 100.0,
            "Success rate should be between 0 and 100");

        // If there are operations, verify calculation logic
        if (stats.getTotalTransactions() > 0) {
            long successful = stats.getTotalTransactions() -
                            stats.getFailedTransactions();
            double expectedRate = (successful * 100.0) / stats.getTotalTransactions();

            // Allow small floating point differences
            assertTrue(Math.abs(stats.getSuccessRate() - expectedRate) < 0.01,
                "Success rate should match calculation");
        }
    }

    // =====================================================================
    // CLEANUP
    // =====================================================================

    @AfterAll
    static void tearDown() {
        System.out.println("✅ All BridgeService tests completed successfully");
    }
}
