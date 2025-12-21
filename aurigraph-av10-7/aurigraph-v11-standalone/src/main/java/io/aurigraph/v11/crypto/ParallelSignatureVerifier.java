package io.aurigraph.v11.crypto;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.PublicKey;
import java.security.Signature;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * Parallel Signature Verification Service
 * Sprint 5: Performance Optimization - Gap 5.2
 *
 * Implements high-performance batch signature verification using:
 * - Java 21 Virtual Threads for massive concurrency
 * - Batch processing for reduced overhead
 * - Configurable thread pool size
 * - Early termination on first failure (optional)
 * - Support for multiple signature algorithms (Dilithium, SPHINCS+, ECDSA)
 *
 * Performance Targets:
 * - 100K+ signature verifications per second
 * - <10ms per signature (P99)
 * - Efficient batch processing for high throughput
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class ParallelSignatureVerifier {

    private static final Logger LOG = Logger.getLogger(ParallelSignatureVerifier.class);

    // Configuration
    @ConfigProperty(name = "signature.verification.threads", defaultValue = "0")
    int verificationThreads; // 0 = use virtual threads

    @ConfigProperty(name = "signature.verification.batch.size", defaultValue = "1000")
    int defaultBatchSize;

    @ConfigProperty(name = "signature.verification.timeout.ms", defaultValue = "5000")
    long verificationTimeoutMs;

    @ConfigProperty(name = "signature.verification.early.termination", defaultValue = "false")
    boolean earlyTerminationOnFailure;

    @ConfigProperty(name = "signature.verification.retry.count", defaultValue = "0")
    int retryCount;

    // Crypto services
    @Inject
    DilithiumSignatureService dilithiumService;

    // Execution services
    private ExecutorService verificationExecutor;
    private ScheduledExecutorService metricsExecutor;

    // Metrics
    private final AtomicLong totalVerifications = new AtomicLong(0);
    private final AtomicLong successfulVerifications = new AtomicLong(0);
    private final AtomicLong failedVerifications = new AtomicLong(0);
    private final AtomicLong totalBatches = new AtomicLong(0);
    private final AtomicLong totalVerificationTimeNanos = new AtomicLong(0);

    // Sliding window metrics
    private final AtomicReference<VerificationMetrics> currentMetrics =
        new AtomicReference<>(new VerificationMetrics());

    // State
    private volatile boolean running = false;

    @PostConstruct
    public void initialize() {
        // Initialize verification executor
        if (verificationThreads <= 0) {
            verificationExecutor = Executors.newVirtualThreadPerTaskExecutor();
            LOG.info("ParallelSignatureVerifier using virtual threads");
        } else {
            verificationExecutor = Executors.newFixedThreadPool(verificationThreads,
                Thread.ofVirtual().name("sig-verifier-", 0).factory());
            LOG.infof("ParallelSignatureVerifier using %d virtual threads", verificationThreads);
        }

        // Initialize metrics executor
        metricsExecutor = Executors.newSingleThreadScheduledExecutor(
            Thread.ofVirtual().name("sig-metrics-", 0).factory());

        // Schedule metrics updates
        metricsExecutor.scheduleAtFixedRate(
            this::updateMetrics, 1, 1, TimeUnit.SECONDS);

        running = true;
        LOG.infof("ParallelSignatureVerifier initialized: batchSize=%d, timeout=%dms, earlyTermination=%b",
            defaultBatchSize, verificationTimeoutMs, earlyTerminationOnFailure);
    }

    @PreDestroy
    public void shutdown() {
        running = false;

        verificationExecutor.shutdown();
        metricsExecutor.shutdown();

        try {
            if (!verificationExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                verificationExecutor.shutdownNow();
            }
            if (!metricsExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                metricsExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            verificationExecutor.shutdownNow();
            metricsExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        LOG.info("ParallelSignatureVerifier shutdown complete");
    }

    /**
     * Verify a single signature
     *
     * @param request The verification request
     * @return VerificationResult with success status and timing
     */
    public VerificationResult verify(VerificationRequest request) {
        if (!running) {
            return VerificationResult.failure(request.transactionId, "Verifier not running");
        }

        long startTime = System.nanoTime();

        try {
            boolean valid = verifySignature(
                request.algorithm,
                request.data,
                request.signature,
                request.publicKey
            );

            long durationNanos = System.nanoTime() - startTime;
            totalVerifications.incrementAndGet();
            totalVerificationTimeNanos.addAndGet(durationNanos);

            if (valid) {
                successfulVerifications.incrementAndGet();
                return VerificationResult.success(request.transactionId, durationNanos);
            } else {
                failedVerifications.incrementAndGet();
                return VerificationResult.failure(request.transactionId, "Invalid signature");
            }

        } catch (Exception e) {
            long durationNanos = System.nanoTime() - startTime;
            totalVerifications.incrementAndGet();
            failedVerifications.incrementAndGet();
            LOG.debugf("Signature verification error for %s: %s", request.transactionId, e.getMessage());
            return VerificationResult.failure(request.transactionId, e.getMessage());
        }
    }

    /**
     * Verify multiple signatures in parallel batch
     *
     * @param requests List of verification requests
     * @return BatchVerificationResult with all results and aggregate metrics
     */
    public BatchVerificationResult verifyBatch(List<VerificationRequest> requests) {
        return verifyBatch(requests, earlyTerminationOnFailure);
    }

    /**
     * Verify multiple signatures in parallel batch with configurable early termination
     *
     * @param requests List of verification requests
     * @param earlyTerminate If true, stop on first failure
     * @return BatchVerificationResult with all results and aggregate metrics
     */
    public BatchVerificationResult verifyBatch(List<VerificationRequest> requests, boolean earlyTerminate) {
        if (!running) {
            return BatchVerificationResult.failure("Verifier not running");
        }

        if (requests == null || requests.isEmpty()) {
            return BatchVerificationResult.success(Collections.emptyList(), 0);
        }

        long startTime = System.nanoTime();
        totalBatches.incrementAndGet();

        List<VerificationResult> results = new ArrayList<>(requests.size());

        if (earlyTerminate) {
            // Early termination mode - stop on first failure
            results = verifyWithEarlyTermination(requests);
        } else {
            // Full verification mode - verify all
            results = verifyAll(requests);
        }

        long durationNanos = System.nanoTime() - startTime;

        int successCount = (int) results.stream().filter(r -> r.valid).count();
        int failedCount = results.size() - successCount;

        double verificationsPerSecond = (requests.size() * 1_000_000_000.0) / durationNanos;
        double avgLatencyMs = (durationNanos / 1_000_000.0) / requests.size();

        LOG.debugf("Batch verification: %d/%d passed in %.2fms (%.0f/s, avg=%.3fms)",
            successCount, requests.size(), durationNanos / 1_000_000.0,
            verificationsPerSecond, avgLatencyMs);

        return new BatchVerificationResult(
            results, successCount, failedCount, durationNanos,
            verificationsPerSecond, avgLatencyMs, !earlyTerminate || failedCount == 0
        );
    }

    /**
     * Verify signatures in parallel batches for ultra-high throughput
     *
     * @param requests All verification requests
     * @param batchSize Size of each parallel batch
     * @return StreamingVerificationResult with streaming results
     */
    public StreamingVerificationResult verifyStreaming(
            List<VerificationRequest> requests, int batchSize) {

        if (!running) {
            return StreamingVerificationResult.failure("Verifier not running");
        }

        long startTime = System.nanoTime();
        List<BatchVerificationResult> batchResults = new ArrayList<>();
        int totalSuccess = 0;
        int totalFailed = 0;

        // Process in batches
        for (int i = 0; i < requests.size(); i += batchSize) {
            int end = Math.min(i + batchSize, requests.size());
            List<VerificationRequest> batch = requests.subList(i, end);

            BatchVerificationResult batchResult = verifyBatch(batch, false);
            batchResults.add(batchResult);

            totalSuccess += batchResult.successCount;
            totalFailed += batchResult.failedCount;
        }

        long durationNanos = System.nanoTime() - startTime;
        double overallVps = (requests.size() * 1_000_000_000.0) / durationNanos;

        return new StreamingVerificationResult(
            batchResults, totalSuccess, totalFailed,
            batchResults.size(), durationNanos, overallVps
        );
    }

    /**
     * Get current verification metrics
     */
    public VerificationMetrics getMetrics() {
        return currentMetrics.get();
    }

    /**
     * Get verification throughput (verifications per second)
     */
    public double getThroughput() {
        VerificationMetrics metrics = currentMetrics.get();
        return metrics.verificationsPerSecond;
    }

    // Private implementation methods

    private List<VerificationResult> verifyAll(List<VerificationRequest> requests) {
        List<CompletableFuture<VerificationResult>> futures = requests.stream()
            .map(req -> CompletableFuture.supplyAsync(() -> verify(req), verificationExecutor))
            .toList();

        return futures.stream()
            .map(future -> {
                try {
                    return future.get(verificationTimeoutMs, TimeUnit.MILLISECONDS);
                } catch (TimeoutException e) {
                    return VerificationResult.failure("timeout", "Verification timed out");
                } catch (Exception e) {
                    return VerificationResult.failure("error", e.getMessage());
                }
            })
            .collect(Collectors.toList());
    }

    private List<VerificationResult> verifyWithEarlyTermination(List<VerificationRequest> requests) {
        List<VerificationResult> results = new ArrayList<>(requests.size());

        // Use structured concurrency for early termination
        List<CompletableFuture<VerificationResult>> futures = new ArrayList<>();
        CompletableFuture<Void> failureFuture = new CompletableFuture<>();

        for (VerificationRequest request : requests) {
            CompletableFuture<VerificationResult> future = CompletableFuture
                .supplyAsync(() -> verify(request), verificationExecutor)
                .whenComplete((result, error) -> {
                    if (error != null || (result != null && !result.valid)) {
                        failureFuture.complete(null); // Signal failure
                    }
                });
            futures.add(future);
        }

        // Wait for all completions or failure signal
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0]));

        try {
            // Race between all completions and failure signal
            CompletableFuture.anyOf(allFutures, failureFuture)
                .get(verificationTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            // Timeout or interruption
        }

        // Collect completed results
        for (CompletableFuture<VerificationResult> future : futures) {
            if (future.isDone()) {
                try {
                    results.add(future.getNow(VerificationResult.failure("unknown", "Not completed")));
                } catch (Exception e) {
                    results.add(VerificationResult.failure("error", e.getMessage()));
                }
            }
        }

        return results;
    }

    private boolean verifySignature(SignatureAlgorithm algorithm, byte[] data,
                                    byte[] signature, PublicKey publicKey) throws Exception {

        return switch (algorithm) {
            case DILITHIUM -> verifyDilithium(data, signature, publicKey);
            case SPHINCS_PLUS -> verifySphincsPlusSimulated(data, signature, publicKey);
            case ECDSA_P256 -> verifyEcdsa(data, signature, publicKey, "SHA256withECDSA");
            case ECDSA_P384 -> verifyEcdsa(data, signature, publicKey, "SHA384withECDSA");
            case ED25519 -> verifyEd25519(data, signature, publicKey);
            case RSA_PSS -> verifyRsaPss(data, signature, publicKey);
        };
    }

    private boolean verifyDilithium(byte[] data, byte[] signature, PublicKey publicKey) {
        try {
            if (dilithiumService != null) {
                return dilithiumService.verify(data, signature, publicKey);
            }
            // Fallback to direct verification
            Signature verifier = Signature.getInstance("Dilithium", "BCPQC");
            verifier.initVerify(publicKey);
            verifier.update(data);
            return verifier.verify(signature);
        } catch (Exception e) {
            LOG.debugf("Dilithium verification failed: %s", e.getMessage());
            return false;
        }
    }

    private boolean verifySphincsPlusSimulated(byte[] data, byte[] signature, PublicKey publicKey) {
        try {
            Signature verifier = Signature.getInstance("SPHINCS+", "BCPQC");
            verifier.initVerify(publicKey);
            verifier.update(data);
            return verifier.verify(signature);
        } catch (Exception e) {
            LOG.debugf("SPHINCS+ verification failed: %s", e.getMessage());
            return false;
        }
    }

    private boolean verifyEcdsa(byte[] data, byte[] signature, PublicKey publicKey,
                               String algorithmName) throws Exception {
        Signature verifier = Signature.getInstance(algorithmName);
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }

    private boolean verifyEd25519(byte[] data, byte[] signature, PublicKey publicKey) throws Exception {
        Signature verifier = Signature.getInstance("Ed25519");
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }

    private boolean verifyRsaPss(byte[] data, byte[] signature, PublicKey publicKey) throws Exception {
        Signature verifier = Signature.getInstance("SHA256withRSA/PSS");
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }

    private void updateMetrics() {
        try {
            long total = totalVerifications.get();
            long success = successfulVerifications.get();
            long failed = failedVerifications.get();
            long batches = totalBatches.get();
            long totalTimeNanos = totalVerificationTimeNanos.get();

            double avgLatencyMs = total > 0 ? (totalTimeNanos / 1_000_000.0) / total : 0;
            double successRate = total > 0 ? (success * 100.0) / total : 100.0;

            // Estimate throughput based on recent activity
            VerificationMetrics prevMetrics = currentMetrics.get();
            long deltaVerifications = total - prevMetrics.totalVerifications;
            double vps = deltaVerifications; // Per second (updated every second)

            currentMetrics.set(new VerificationMetrics(
                total, success, failed, batches,
                avgLatencyMs, successRate, vps
            ));
        } catch (Exception e) {
            LOG.debug("Error updating metrics: " + e.getMessage());
        }
    }

    // Data classes

    /**
     * Supported signature algorithms
     */
    public enum SignatureAlgorithm {
        DILITHIUM,      // CRYSTALS-Dilithium (Post-Quantum)
        SPHINCS_PLUS,   // SPHINCS+ (Post-Quantum)
        ECDSA_P256,     // ECDSA with P-256 curve
        ECDSA_P384,     // ECDSA with P-384 curve
        ED25519,        // Ed25519
        RSA_PSS         // RSA-PSS
    }

    /**
     * Verification request
     */
    public static class VerificationRequest {
        public final String transactionId;
        public final SignatureAlgorithm algorithm;
        public final byte[] data;
        public final byte[] signature;
        public final PublicKey publicKey;

        public VerificationRequest(String transactionId, SignatureAlgorithm algorithm,
                                  byte[] data, byte[] signature, PublicKey publicKey) {
            this.transactionId = transactionId;
            this.algorithm = algorithm;
            this.data = data;
            this.signature = signature;
            this.publicKey = publicKey;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String transactionId;
            private SignatureAlgorithm algorithm = SignatureAlgorithm.DILITHIUM;
            private byte[] data;
            private byte[] signature;
            private PublicKey publicKey;

            public Builder transactionId(String id) { this.transactionId = id; return this; }
            public Builder algorithm(SignatureAlgorithm algo) { this.algorithm = algo; return this; }
            public Builder data(byte[] data) { this.data = data; return this; }
            public Builder signature(byte[] sig) { this.signature = sig; return this; }
            public Builder publicKey(PublicKey key) { this.publicKey = key; return this; }

            public VerificationRequest build() {
                return new VerificationRequest(transactionId, algorithm, data, signature, publicKey);
            }
        }
    }

    /**
     * Result of single verification
     */
    public static class VerificationResult {
        public final String transactionId;
        public final boolean valid;
        public final long durationNanos;
        public final String errorMessage;

        private VerificationResult(String transactionId, boolean valid,
                                  long durationNanos, String errorMessage) {
            this.transactionId = transactionId;
            this.valid = valid;
            this.durationNanos = durationNanos;
            this.errorMessage = errorMessage;
        }

        public static VerificationResult success(String transactionId, long durationNanos) {
            return new VerificationResult(transactionId, true, durationNanos, null);
        }

        public static VerificationResult failure(String transactionId, String error) {
            return new VerificationResult(transactionId, false, 0, error);
        }

        public double getLatencyMs() {
            return durationNanos / 1_000_000.0;
        }
    }

    /**
     * Result of batch verification
     */
    public static class BatchVerificationResult {
        public final List<VerificationResult> results;
        public final int successCount;
        public final int failedCount;
        public final long durationNanos;
        public final double verificationsPerSecond;
        public final double averageLatencyMs;
        public final boolean allValid;
        public final String errorMessage;

        public BatchVerificationResult(List<VerificationResult> results, int successCount,
                                      int failedCount, long durationNanos,
                                      double vps, double avgLatency, boolean allValid) {
            this.results = results;
            this.successCount = successCount;
            this.failedCount = failedCount;
            this.durationNanos = durationNanos;
            this.verificationsPerSecond = vps;
            this.averageLatencyMs = avgLatency;
            this.allValid = allValid;
            this.errorMessage = null;
        }

        public static BatchVerificationResult success(List<VerificationResult> results, long durationNanos) {
            int success = (int) results.stream().filter(r -> r.valid).count();
            int failed = results.size() - success;
            double vps = results.isEmpty() ? 0 : (results.size() * 1_000_000_000.0) / durationNanos;
            double avgLatency = results.isEmpty() ? 0 : (durationNanos / 1_000_000.0) / results.size();
            return new BatchVerificationResult(results, success, failed, durationNanos, vps, avgLatency, failed == 0);
        }

        public static BatchVerificationResult failure(String error) {
            return new BatchVerificationResult(Collections.emptyList(), 0, 0, 0, 0, 0, false);
        }

        public double getTotalLatencyMs() {
            return durationNanos / 1_000_000.0;
        }
    }

    /**
     * Result of streaming verification
     */
    public static class StreamingVerificationResult {
        public final List<BatchVerificationResult> batchResults;
        public final int totalSuccess;
        public final int totalFailed;
        public final int batchCount;
        public final long totalDurationNanos;
        public final double overallVerificationsPerSecond;
        public final String errorMessage;

        public StreamingVerificationResult(List<BatchVerificationResult> batchResults,
                                          int totalSuccess, int totalFailed, int batchCount,
                                          long totalDurationNanos, double overallVps) {
            this.batchResults = batchResults;
            this.totalSuccess = totalSuccess;
            this.totalFailed = totalFailed;
            this.batchCount = batchCount;
            this.totalDurationNanos = totalDurationNanos;
            this.overallVerificationsPerSecond = overallVps;
            this.errorMessage = null;
        }

        public static StreamingVerificationResult failure(String error) {
            return new StreamingVerificationResult(Collections.emptyList(), 0, 0, 0, 0, 0);
        }

        public boolean isAllValid() {
            return totalFailed == 0;
        }

        public double getSuccessRate() {
            int total = totalSuccess + totalFailed;
            return total > 0 ? (totalSuccess * 100.0) / total : 100.0;
        }
    }

    /**
     * Verification metrics snapshot
     */
    public static class VerificationMetrics {
        public final long totalVerifications;
        public final long successfulVerifications;
        public final long failedVerifications;
        public final long totalBatches;
        public final double averageLatencyMs;
        public final double successRate;
        public final double verificationsPerSecond;

        public VerificationMetrics() {
            this(0, 0, 0, 0, 0, 100.0, 0);
        }

        public VerificationMetrics(long total, long success, long failed, long batches,
                                  double avgLatency, double successRate, double vps) {
            this.totalVerifications = total;
            this.successfulVerifications = success;
            this.failedVerifications = failed;
            this.totalBatches = batches;
            this.averageLatencyMs = avgLatency;
            this.successRate = successRate;
            this.verificationsPerSecond = vps;
        }

        @Override
        public String toString() {
            return String.format(
                "VerificationMetrics{total=%d, success=%d, failed=%d, avgLatency=%.2fms, rate=%.1f%%, vps=%.0f}",
                totalVerifications, successfulVerifications, failedVerifications,
                averageLatencyMs, successRate, verificationsPerSecond
            );
        }
    }
}
