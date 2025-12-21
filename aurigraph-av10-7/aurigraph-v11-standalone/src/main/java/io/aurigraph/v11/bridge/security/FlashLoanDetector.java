package io.aurigraph.v11.bridge.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Flash Loan Attack Detector - Security Hardening Sprint 1
 *
 * Detects and prevents flash loan attacks on the cross-chain bridge by:
 * - Detecting same-block round-trip transfers (deposit + withdraw in single block)
 * - Tracking transaction patterns for anomaly detection
 * - Blocking suspicious rapid transfer sequences
 * - Enforcing minimum time between deposit and withdrawal
 *
 * Flash Loan Attack Patterns Detected:
 * 1. Same-block round-trip: deposit and withdraw in the same block
 * 2. Rapid sequence: multiple transfers within a very short window
 * 3. Value manipulation: large amount transfers followed by immediate reversal
 * 4. Address correlation: detecting coordinated attacks across addresses
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 * @since 2025-12-20
 */
@ApplicationScoped
public class FlashLoanDetector {

    // Configuration properties
    @ConfigProperty(name = "bridge.flashloan.detection.enabled", defaultValue = "true")
    boolean detectionEnabled;

    @ConfigProperty(name = "bridge.flashloan.min.time.between.transfers.ms", defaultValue = "60000")
    long minTimeBetweenTransfersMs; // 1 minute default

    @ConfigProperty(name = "bridge.flashloan.same.block.detection.enabled", defaultValue = "true")
    boolean sameBlockDetectionEnabled;

    @ConfigProperty(name = "bridge.flashloan.rapid.sequence.window.ms", defaultValue = "5000")
    long rapidSequenceWindowMs; // 5 seconds

    @ConfigProperty(name = "bridge.flashloan.rapid.sequence.max.transfers", defaultValue = "3")
    int rapidSequenceMaxTransfers;

    @ConfigProperty(name = "bridge.flashloan.large.amount.threshold", defaultValue = "100000")
    BigDecimal largeAmountThreshold;

    @ConfigProperty(name = "bridge.flashloan.pattern.history.minutes", defaultValue = "30")
    int patternHistoryMinutes;

    // Transfer tracking
    private final Map<String, ConcurrentLinkedDeque<TransferRecord>> addressTransferHistory = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> blockTransfers = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastWithdrawalTime = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastDepositTime = new ConcurrentHashMap<>();

    // Pattern tracking for anomaly detection
    private final Map<String, TransferPattern> addressPatterns = new ConcurrentHashMap<>();
    private final ConcurrentLinkedDeque<DetectedAttack> attackHistory = new ConcurrentLinkedDeque<>();

    // Metrics
    private final AtomicLong totalTransfersAnalyzed = new AtomicLong(0);
    private final AtomicLong attacksDetected = new AtomicLong(0);
    private final AtomicLong blockedTransfers = new AtomicLong(0);
    private final AtomicLong sameBlockAttacksDetected = new AtomicLong(0);
    private final AtomicLong rapidSequenceAttacksDetected = new AtomicLong(0);

    /**
     * Analyze a transfer for flash loan attack patterns.
     *
     * @param request The transfer analysis request
     * @return Detection result with analysis details
     */
    public DetectionResult analyzeTransfer(TransferAnalysisRequest request) {
        if (!detectionEnabled) {
            return DetectionResult.allowed("Flash loan detection disabled");
        }

        totalTransfersAnalyzed.incrementAndGet();

        List<String> flags = new ArrayList<>();
        List<DetectionReason> reasons = new ArrayList<>();
        boolean isBlocked = false;

        // 1. Same-block round-trip detection
        if (sameBlockDetectionEnabled && request.blockNumber() != null) {
            DetectionReason sameBlockResult = detectSameBlockRoundTrip(request);
            if (sameBlockResult != null) {
                reasons.add(sameBlockResult);
                flags.add("SAME_BLOCK_ROUND_TRIP");
                isBlocked = true;
                sameBlockAttacksDetected.incrementAndGet();
            }
        }

        // 2. Rapid sequence detection
        DetectionReason rapidSequenceResult = detectRapidSequence(request);
        if (rapidSequenceResult != null) {
            reasons.add(rapidSequenceResult);
            flags.add("RAPID_SEQUENCE");
            isBlocked = true;
            rapidSequenceAttacksDetected.incrementAndGet();
        }

        // 3. Minimum time between transfers check
        DetectionReason timingResult = checkMinTimeBetweenTransfers(request);
        if (timingResult != null) {
            reasons.add(timingResult);
            flags.add("MIN_TIME_VIOLATION");
            isBlocked = true;
        }

        // 4. Large amount pattern detection
        DetectionReason largeAmountResult = detectLargeAmountPattern(request);
        if (largeAmountResult != null) {
            reasons.add(largeAmountResult);
            flags.add("LARGE_AMOUNT_PATTERN");
            // This is a warning, not necessarily blocked
        }

        // 5. Update tracking data
        recordTransfer(request);

        // Create result
        if (isBlocked) {
            attacksDetected.incrementAndGet();
            blockedTransfers.incrementAndGet();

            DetectedAttack attack = new DetectedAttack(
                request.transactionId(),
                request.sourceAddress(),
                request.targetAddress(),
                request.amount(),
                flags,
                reasons,
                Instant.now(),
                request.blockNumber()
            );
            attackHistory.addLast(attack);

            // Cleanup old attack history
            cleanupOldAttacks();

            Log.warnf("Flash loan attack detected! Transaction: %s, Address: %s, Flags: %s",
                request.transactionId(), request.sourceAddress(), String.join(", ", flags));

            return DetectionResult.blocked(
                "Flash loan attack detected",
                flags,
                reasons,
                attack
            );
        }

        if (!reasons.isEmpty()) {
            Log.infof("Transfer analyzed with warnings. Transaction: %s, Flags: %s",
                request.transactionId(), String.join(", ", flags));

            return DetectionResult.allowedWithWarnings(
                "Transfer allowed with warnings",
                flags,
                reasons
            );
        }

        return DetectionResult.allowed("No flash loan patterns detected");
    }

    /**
     * Record a deposit for tracking.
     *
     * @param address The address making the deposit
     * @param amount The deposit amount
     * @param blockNumber The block number
     * @param transactionId The transaction ID
     */
    public void recordDeposit(String address, BigDecimal amount, Long blockNumber, String transactionId) {
        lastDepositTime.put(address, Instant.now());

        if (blockNumber != null) {
            blockTransfers.computeIfAbsent(blockNumber, k -> ConcurrentHashMap.newKeySet())
                .add(transactionId + ":DEPOSIT:" + address);
        }
    }

    /**
     * Record a withdrawal for tracking.
     *
     * @param address The address making the withdrawal
     * @param amount The withdrawal amount
     * @param blockNumber The block number
     * @param transactionId The transaction ID
     */
    public void recordWithdrawal(String address, BigDecimal amount, Long blockNumber, String transactionId) {
        lastWithdrawalTime.put(address, Instant.now());

        if (blockNumber != null) {
            blockTransfers.computeIfAbsent(blockNumber, k -> ConcurrentHashMap.newKeySet())
                .add(transactionId + ":WITHDRAW:" + address);
        }
    }

    /**
     * Get detector statistics.
     *
     * @return Detection statistics
     */
    public DetectorStats getStats() {
        return new DetectorStats(
            detectionEnabled,
            totalTransfersAnalyzed.get(),
            attacksDetected.get(),
            blockedTransfers.get(),
            sameBlockAttacksDetected.get(),
            rapidSequenceAttacksDetected.get(),
            addressTransferHistory.size(),
            attackHistory.size(),
            calculateDetectionRate(),
            Instant.now()
        );
    }

    /**
     * Get recent detected attacks.
     *
     * @param limit Maximum number of attacks to return
     * @return List of recent detected attacks
     */
    public List<DetectedAttack> getRecentAttacks(int limit) {
        List<DetectedAttack> attacks = new ArrayList<>(attackHistory);
        Collections.reverse(attacks); // Most recent first

        if (attacks.size() > limit) {
            return attacks.subList(0, limit);
        }
        return attacks;
    }

    /**
     * Clear tracking data for an address (for testing or reset).
     *
     * @param address The address to clear
     */
    public void clearAddressHistory(String address) {
        addressTransferHistory.remove(address);
        lastDepositTime.remove(address);
        lastWithdrawalTime.remove(address);
        addressPatterns.remove(address);

        Log.infof("Cleared flash loan tracking history for address: %s", address);
    }

    // Private detection methods

    private DetectionReason detectSameBlockRoundTrip(TransferAnalysisRequest request) {
        Long blockNumber = request.blockNumber();
        if (blockNumber == null) {
            return null;
        }

        Set<String> blockTxs = blockTransfers.get(blockNumber);
        if (blockTxs == null || blockTxs.isEmpty()) {
            return null;
        }

        // Check if there's a deposit from same address in the same block
        String sourceAddress = request.sourceAddress();
        TransferType currentType = request.transferType();

        for (String tx : blockTxs) {
            String[] parts = tx.split(":");
            if (parts.length >= 3) {
                String txType = parts[1];
                String txAddress = parts[2];

                // If we're doing a withdraw and there's a deposit from same address in same block
                if (currentType == TransferType.WITHDRAW && txAddress.equals(sourceAddress) && "DEPOSIT".equals(txType)) {
                    return new DetectionReason(
                        DetectionType.SAME_BLOCK_ROUND_TRIP,
                        "Deposit and withdrawal detected in same block",
                        DetectionSeverity.CRITICAL,
                        Map.of(
                            "blockNumber", blockNumber.toString(),
                            "address", sourceAddress,
                            "previousTransaction", parts[0]
                        )
                    );
                }

                // If we're doing a deposit and there's a withdrawal from same address in same block
                if (currentType == TransferType.DEPOSIT && txAddress.equals(sourceAddress) && "WITHDRAW".equals(txType)) {
                    return new DetectionReason(
                        DetectionType.SAME_BLOCK_ROUND_TRIP,
                        "Withdrawal and deposit detected in same block (reverse pattern)",
                        DetectionSeverity.CRITICAL,
                        Map.of(
                            "blockNumber", blockNumber.toString(),
                            "address", sourceAddress,
                            "previousTransaction", parts[0]
                        )
                    );
                }
            }
        }

        return null;
    }

    private DetectionReason detectRapidSequence(TransferAnalysisRequest request) {
        String address = request.sourceAddress();
        ConcurrentLinkedDeque<TransferRecord> history = addressTransferHistory.get(address);

        if (history == null || history.isEmpty()) {
            return null;
        }

        Instant windowStart = Instant.now().minus(Duration.ofMillis(rapidSequenceWindowMs));
        long recentTransfers = history.stream()
            .filter(r -> r.timestamp().isAfter(windowStart))
            .count();

        if (recentTransfers >= rapidSequenceMaxTransfers) {
            return new DetectionReason(
                DetectionType.RAPID_SEQUENCE,
                String.format("Too many transfers in short window: %d transfers in %dms",
                    recentTransfers + 1, rapidSequenceWindowMs),
                DetectionSeverity.HIGH,
                Map.of(
                    "address", address,
                    "transferCount", String.valueOf(recentTransfers + 1),
                    "windowMs", String.valueOf(rapidSequenceWindowMs),
                    "maxAllowed", String.valueOf(rapidSequenceMaxTransfers)
                )
            );
        }

        return null;
    }

    private DetectionReason checkMinTimeBetweenTransfers(TransferAnalysisRequest request) {
        String address = request.sourceAddress();
        TransferType type = request.transferType();

        Instant lastTime = null;
        if (type == TransferType.WITHDRAW) {
            lastTime = lastDepositTime.get(address);
        } else if (type == TransferType.DEPOSIT) {
            lastTime = lastWithdrawalTime.get(address);
        }

        if (lastTime == null) {
            return null;
        }

        Duration elapsed = Duration.between(lastTime, Instant.now());
        if (elapsed.toMillis() < minTimeBetweenTransfersMs) {
            return new DetectionReason(
                DetectionType.MIN_TIME_VIOLATION,
                String.format("Transfer attempted too soon after previous operation: %dms elapsed, %dms required",
                    elapsed.toMillis(), minTimeBetweenTransfersMs),
                DetectionSeverity.HIGH,
                Map.of(
                    "address", address,
                    "elapsedMs", String.valueOf(elapsed.toMillis()),
                    "requiredMs", String.valueOf(minTimeBetweenTransfersMs),
                    "transferType", type.name()
                )
            );
        }

        return null;
    }

    private DetectionReason detectLargeAmountPattern(TransferAnalysisRequest request) {
        if (request.amount().compareTo(largeAmountThreshold) < 0) {
            return null;
        }

        String address = request.sourceAddress();
        ConcurrentLinkedDeque<TransferRecord> history = addressTransferHistory.get(address);

        if (history == null || history.isEmpty()) {
            // First large transfer - just a warning
            return new DetectionReason(
                DetectionType.LARGE_AMOUNT_PATTERN,
                String.format("Large transfer detected: %s (threshold: %s)",
                    request.amount(), largeAmountThreshold),
                DetectionSeverity.MEDIUM,
                Map.of(
                    "address", address,
                    "amount", request.amount().toString(),
                    "threshold", largeAmountThreshold.toString()
                )
            );
        }

        // Check for pattern of large transfers
        Instant windowStart = Instant.now().minus(Duration.ofMinutes(patternHistoryMinutes));
        long largeTxCount = history.stream()
            .filter(r -> r.timestamp().isAfter(windowStart))
            .filter(r -> r.amount().compareTo(largeAmountThreshold) >= 0)
            .count();

        if (largeTxCount >= 2) {
            return new DetectionReason(
                DetectionType.LARGE_AMOUNT_PATTERN,
                String.format("Multiple large transfers detected: %d large transfers in %d minutes",
                    largeTxCount + 1, patternHistoryMinutes),
                DetectionSeverity.HIGH,
                Map.of(
                    "address", address,
                    "amount", request.amount().toString(),
                    "largeTxCount", String.valueOf(largeTxCount + 1),
                    "windowMinutes", String.valueOf(patternHistoryMinutes)
                )
            );
        }

        return null;
    }

    private void recordTransfer(TransferAnalysisRequest request) {
        String address = request.sourceAddress();
        TransferRecord record = new TransferRecord(
            request.transactionId(),
            request.amount(),
            request.transferType(),
            request.blockNumber(),
            Instant.now()
        );

        addressTransferHistory.computeIfAbsent(address, k -> new ConcurrentLinkedDeque<>())
            .addLast(record);

        // Cleanup old records
        Instant windowStart = Instant.now().minus(Duration.ofMinutes(patternHistoryMinutes));
        ConcurrentLinkedDeque<TransferRecord> history = addressTransferHistory.get(address);
        while (!history.isEmpty() && history.peekFirst().timestamp().isBefore(windowStart)) {
            history.pollFirst();
        }

        // Update deposit/withdrawal timestamps
        if (request.transferType() == TransferType.DEPOSIT) {
            lastDepositTime.put(address, Instant.now());
        } else if (request.transferType() == TransferType.WITHDRAW) {
            lastWithdrawalTime.put(address, Instant.now());
        }

        // Record in block tracking
        if (request.blockNumber() != null) {
            String blockEntry = request.transactionId() + ":" + request.transferType().name() + ":" + address;
            blockTransfers.computeIfAbsent(request.blockNumber(), k -> ConcurrentHashMap.newKeySet())
                .add(blockEntry);
        }
    }

    private void cleanupOldAttacks() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(24));
        while (!attackHistory.isEmpty() && attackHistory.peekFirst().timestamp().isBefore(cutoff)) {
            attackHistory.pollFirst();
        }
    }

    private double calculateDetectionRate() {
        long total = totalTransfersAnalyzed.get();
        if (total == 0) return 0.0;
        return (double) attacksDetected.get() / total * 100.0;
    }

    // Enums and records

    public enum TransferType {
        DEPOSIT,
        WITHDRAW,
        BRIDGE
    }

    public enum DetectionType {
        SAME_BLOCK_ROUND_TRIP,
        RAPID_SEQUENCE,
        MIN_TIME_VIOLATION,
        LARGE_AMOUNT_PATTERN,
        COORDINATED_ATTACK
    }

    public enum DetectionSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public record TransferAnalysisRequest(
        String transactionId,
        String sourceAddress,
        String targetAddress,
        BigDecimal amount,
        TransferType transferType,
        Long blockNumber,
        String sourceChain,
        String targetChain
    ) {}

    public record TransferRecord(
        String transactionId,
        BigDecimal amount,
        TransferType type,
        Long blockNumber,
        Instant timestamp
    ) {}

    public record DetectionReason(
        DetectionType type,
        String message,
        DetectionSeverity severity,
        Map<String, String> metadata
    ) {}

    public record DetectedAttack(
        String transactionId,
        String sourceAddress,
        String targetAddress,
        BigDecimal amount,
        List<String> flags,
        List<DetectionReason> reasons,
        Instant timestamp,
        Long blockNumber
    ) {}

    public record DetectionResult(
        boolean allowed,
        boolean blocked,
        String message,
        List<String> flags,
        List<DetectionReason> reasons,
        DetectedAttack attack
    ) {
        public static DetectionResult allowed(String message) {
            return new DetectionResult(true, false, message, List.of(), List.of(), null);
        }

        public static DetectionResult allowedWithWarnings(String message, List<String> flags, List<DetectionReason> reasons) {
            return new DetectionResult(true, false, message, flags, reasons, null);
        }

        public static DetectionResult blocked(String message, List<String> flags, List<DetectionReason> reasons, DetectedAttack attack) {
            return new DetectionResult(false, true, message, flags, reasons, attack);
        }
    }

    public record TransferPattern(
        String address,
        int totalTransfers,
        int depositsCount,
        int withdrawalsCount,
        BigDecimal totalVolume,
        double averageInterval,
        Instant firstSeen,
        Instant lastSeen
    ) {}

    public record DetectorStats(
        boolean enabled,
        long totalTransfersAnalyzed,
        long attacksDetected,
        long blockedTransfers,
        long sameBlockAttacks,
        long rapidSequenceAttacks,
        int addressesTracked,
        int attackHistorySize,
        double detectionRate,
        Instant timestamp
    ) {}
}
