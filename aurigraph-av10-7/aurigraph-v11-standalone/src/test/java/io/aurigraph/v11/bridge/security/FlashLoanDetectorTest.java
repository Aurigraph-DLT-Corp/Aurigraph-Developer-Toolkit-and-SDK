package io.aurigraph.v11.bridge.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for FlashLoanDetector
 *
 * Tests flash loan attack detection:
 * - Same-block round-trip detection
 * - Rapid sequence detection
 * - Minimum time between transfers
 * - Large amount pattern detection
 * - Tracking and metrics
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
class FlashLoanDetectorTest {

    @Inject
    FlashLoanDetector flashLoanDetector;

    private static final String TEST_ADDRESS = "0xtest1234567890abcdef";
    private static final String TARGET_ADDRESS = "0xtarget567890abcdef12";

    @BeforeEach
    void resetDetector() {
        // Clear address history before each test
        flashLoanDetector.clearAddressHistory(TEST_ADDRESS);
        flashLoanDetector.clearAddressHistory(TARGET_ADDRESS);
    }

    @Test
    @Order(1)
    @DisplayName("Normal transfer should be allowed")
    void testNormalTransferAllowed() {
        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-normal-001",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("1000"),
            FlashLoanDetector.TransferType.BRIDGE,
            1000L,
            "ethereum",
            "polygon"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

        assertTrue(result.allowed());
        assertFalse(result.blocked());
        assertTrue(result.flags().isEmpty());
    }

    @Test
    @Order(2)
    @DisplayName("Same-block round-trip should be detected")
    void testSameBlockRoundTripDetection() {
        Long blockNumber = 12345678L;

        // Record a deposit
        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("10000"), blockNumber, "tx-deposit");

        // Attempt withdrawal in same block
        FlashLoanDetector.TransferAnalysisRequest withdrawRequest = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-withdraw",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("10000"),
            FlashLoanDetector.TransferType.WITHDRAW,
            blockNumber, // Same block!
            "ethereum",
            "aurigraph"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(withdrawRequest);

        assertTrue(result.blocked());
        assertFalse(result.allowed());
        assertTrue(result.flags().contains("SAME_BLOCK_ROUND_TRIP"));
    }

    @Test
    @Order(3)
    @DisplayName("Rapid sequence should be detected")
    void testRapidSequenceDetection() {
        // Make rapid transfers (more than threshold in window)
        for (int i = 0; i < 5; i++) {
            FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
                "tx-rapid-" + i,
                TEST_ADDRESS,
                TARGET_ADDRESS,
                new BigDecimal("1000"),
                FlashLoanDetector.TransferType.BRIDGE,
                null,
                "ethereum",
                "polygon"
            );
            flashLoanDetector.analyzeTransfer(request);
        }

        // Next transfer should trigger rapid sequence detection
        FlashLoanDetector.TransferAnalysisRequest nextRequest = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-rapid-trigger",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("1000"),
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(nextRequest);

        // Should have RAPID_SEQUENCE flag
        assertTrue(result.flags().contains("RAPID_SEQUENCE"));
    }

    @Test
    @Order(4)
    @DisplayName("Large amount transfer should be flagged")
    void testLargeAmountPattern() {
        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-large",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("500000"), // Over 100K threshold
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

        // Large amount is a warning, not necessarily blocked
        assertTrue(result.flags().contains("LARGE_AMOUNT_PATTERN"));
        assertTrue(result.reasons().stream()
            .anyMatch(r -> r.type() == FlashLoanDetector.DetectionType.LARGE_AMOUNT_PATTERN));
    }

    @Test
    @Order(5)
    @DisplayName("Detector stats should be accurate")
    void testDetectorStats() {
        // Make some transfers
        for (int i = 0; i < 5; i++) {
            FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
                "tx-stats-" + i,
                TEST_ADDRESS + i, // Different addresses
                TARGET_ADDRESS,
                new BigDecimal("1000"),
                FlashLoanDetector.TransferType.BRIDGE,
                null,
                "ethereum",
                "polygon"
            );
            flashLoanDetector.analyzeTransfer(request);
        }

        FlashLoanDetector.DetectorStats stats = flashLoanDetector.getStats();

        assertTrue(stats.enabled());
        assertTrue(stats.totalTransfersAnalyzed() >= 5);
        assertNotNull(stats.timestamp());
    }

    @Test
    @Order(6)
    @DisplayName("Recent attacks should be tracked")
    void testRecentAttacksTracking() {
        Long blockNumber = 99999L;

        // Trigger a detectable attack
        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("50000"), blockNumber, "tx-attack-deposit");

        FlashLoanDetector.TransferAnalysisRequest withdrawRequest = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-attack-withdraw",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("50000"),
            FlashLoanDetector.TransferType.WITHDRAW,
            blockNumber,
            "ethereum",
            "aurigraph"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(withdrawRequest);
        assertTrue(result.blocked());

        List<FlashLoanDetector.DetectedAttack> attacks = flashLoanDetector.getRecentAttacks(10);

        assertFalse(attacks.isEmpty());
        assertTrue(attacks.stream()
            .anyMatch(a -> a.transactionId().equals("tx-attack-withdraw")));
    }

    @Test
    @Order(7)
    @DisplayName("Different block numbers should not trigger same-block detection")
    void testDifferentBlocksAllowed() {
        // Record deposit in block 100
        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("10000"), 100L, "tx-dep-100");

        // Withdraw in different block 101
        FlashLoanDetector.TransferAnalysisRequest withdrawRequest = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-wd-101",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("10000"),
            FlashLoanDetector.TransferType.WITHDRAW,
            101L, // Different block
            "ethereum",
            "aurigraph"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(withdrawRequest);

        assertFalse(result.flags().contains("SAME_BLOCK_ROUND_TRIP"));
    }

    @Test
    @Order(8)
    @DisplayName("Detection reasons should have correct severity")
    void testDetectionSeverity() {
        Long blockNumber = 77777L;

        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("10000"), blockNumber, "tx-sev-dep");

        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-sev-wd",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("10000"),
            FlashLoanDetector.TransferType.WITHDRAW,
            blockNumber,
            "ethereum",
            "aurigraph"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

        assertTrue(result.blocked());
        assertTrue(result.reasons().stream()
            .anyMatch(r -> r.severity() == FlashLoanDetector.DetectionSeverity.CRITICAL));
    }

    @Test
    @Order(9)
    @DisplayName("Detection result should include metadata")
    void testDetectionMetadata() {
        Long blockNumber = 88888L;

        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("10000"), blockNumber, "tx-meta-dep");

        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-meta-wd",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("10000"),
            FlashLoanDetector.TransferType.WITHDRAW,
            blockNumber,
            "ethereum",
            "aurigraph"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

        assertTrue(result.blocked());
        assertNotNull(result.attack());
        assertEquals("tx-meta-wd", result.attack().transactionId());
        assertEquals(TEST_ADDRESS, result.attack().sourceAddress());
    }

    @Test
    @Order(10)
    @DisplayName("Cleared address should not have history")
    void testClearAddressHistory() {
        // Make some transfers
        for (int i = 0; i < 3; i++) {
            FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
                "tx-clear-" + i,
                TEST_ADDRESS,
                TARGET_ADDRESS,
                new BigDecimal("1000"),
                FlashLoanDetector.TransferType.BRIDGE,
                null,
                "ethereum",
                "polygon"
            );
            flashLoanDetector.analyzeTransfer(request);
        }

        // Clear history
        flashLoanDetector.clearAddressHistory(TEST_ADDRESS);

        // Next request should be treated as first
        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-after-clear",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("1000"),
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);
        assertTrue(result.allowed());
    }

    @Test
    @Order(11)
    @DisplayName("Deposit transfers should be tracked")
    void testDepositTracking() {
        flashLoanDetector.recordDeposit(TEST_ADDRESS, new BigDecimal("5000"), 500L, "tx-dep-track");

        FlashLoanDetector.DetectorStats stats = flashLoanDetector.getStats();
        assertTrue(stats.addressesTracked() > 0);
    }

    @Test
    @Order(12)
    @DisplayName("Withdrawal transfers should be tracked")
    void testWithdrawalTracking() {
        flashLoanDetector.recordWithdrawal(TEST_ADDRESS, new BigDecimal("5000"), 500L, "tx-wd-track");

        FlashLoanDetector.DetectorStats stats = flashLoanDetector.getStats();
        assertTrue(stats.addressesTracked() > 0);
    }

    @Test
    @Order(13)
    @DisplayName("Multiple large amount transfers should trigger higher severity")
    void testMultipleLargeTransfers() {
        // First large transfer - just warning
        FlashLoanDetector.TransferAnalysisRequest first = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-large-1",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("150000"),
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );
        flashLoanDetector.analyzeTransfer(first);

        // Second large transfer - higher severity
        FlashLoanDetector.TransferAnalysisRequest second = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-large-2",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("200000"),
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );
        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(second);

        assertTrue(result.flags().contains("LARGE_AMOUNT_PATTERN"));
        // Should have HIGH severity for multiple large transfers
        assertTrue(result.reasons().stream()
            .filter(r -> r.type() == FlashLoanDetector.DetectionType.LARGE_AMOUNT_PATTERN)
            .anyMatch(r -> r.severity() == FlashLoanDetector.DetectionSeverity.HIGH ||
                          r.severity() == FlashLoanDetector.DetectionSeverity.MEDIUM));
    }

    @Test
    @Order(14)
    @DisplayName("Detection result allowed() and blocked() should be mutually exclusive")
    void testAllowedBlockedMutuallyExclusive() {
        FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
            "tx-exclusive",
            TEST_ADDRESS,
            TARGET_ADDRESS,
            new BigDecimal("1000"),
            FlashLoanDetector.TransferType.BRIDGE,
            null,
            "ethereum",
            "polygon"
        );

        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

        // Either allowed or blocked, not both
        assertTrue(result.allowed() != result.blocked());
    }

    @Test
    @Order(15)
    @DisplayName("All transfer types should be analyzable")
    void testAllTransferTypes() {
        for (FlashLoanDetector.TransferType type : FlashLoanDetector.TransferType.values()) {
            FlashLoanDetector.TransferAnalysisRequest request = new FlashLoanDetector.TransferAnalysisRequest(
                "tx-type-" + type.name(),
                TEST_ADDRESS + type.ordinal(),
                TARGET_ADDRESS,
                new BigDecimal("1000"),
                type,
                null,
                "ethereum",
                "polygon"
            );

            FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);

            assertNotNull(result);
            assertNotNull(result.message());
        }
    }
}
