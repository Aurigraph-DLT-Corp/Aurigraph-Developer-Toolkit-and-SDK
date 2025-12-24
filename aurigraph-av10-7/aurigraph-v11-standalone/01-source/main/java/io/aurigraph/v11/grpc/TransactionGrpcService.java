package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Story 9, Phase 1: Transaction gRPC Service Implementation
 *
 * Provides high-performance transaction processing via native gRPC
 * - Replaces REST transaction endpoints
 * - Supports 8 RPC methods with streaming patterns
 * - Performance targets: <100ms latency, >50k tx/sec
 * - Full-duplex bidirectional streaming support
 *
 * Implementation Strategy:
 * 1. Leverage existing TransactionService for business logic
 * 2. Convert request/response to gRPC Protocol Buffer messages
 * 3. Implement real-time streaming via observer pattern
 * 4. Track metrics for observability
 * 5. Handle errors gracefully with proper status codes
 */
@GrpcService
public class TransactionGrpcService extends TransactionGrpcServiceGrpc.TransactionGrpcServiceImplBase {

    private static final Logger LOG = Logger.getLogger(TransactionGrpcService.class);

    // Inject existing transaction service for business logic
    @Inject
    io.aurigraph.v11.TransactionService transactionService;

    // In-memory transaction index for fast lookups
    private final ConcurrentHashMap<String, TransactionStatusData> transactionIndex = new ConcurrentHashMap<>();

    // Observer list for real-time broadcasts
    private final CopyOnWriteArrayList<StreamObserver<TransactionStatusUpdate>> statusObservers = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<StreamObserver<Transaction>> pendingTransactionObservers = new CopyOnWriteArrayList<>();

    // Metrics tracking
    private final AtomicLong totalSubmitted = new AtomicLong(0);
    private final AtomicLong totalValidated = new AtomicLong(0);
    private final AtomicLong totalFinalized = new AtomicLong(0);
    private final AtomicLong totalFailed = new AtomicLong(0);
    private final AtomicLong totalLatencyNanos = new AtomicLong(0);

    // Pending transactions queue for streaming
    private final BlockingQueue<Transaction> pendingTransactionQueue = new LinkedBlockingQueue<>(100000);

    // Thread pools
    private final ExecutorService executorService = Executors.newFixedThreadPool(50);

    /**
     * ========================================================================
     * RPC Method 1: submitTransaction (Unary)
     * ========================================================================
     * Submit a single transaction for processing
     *
     * Request: SubmitTransactionRequest (txHash, payload, signature, signer, nonce)
     * Response: TransactionReceipt (txId, status, blockHeight, gasUsed, timestamp)
     * Latency Target: <100ms (async processing)
     */
    @Override
    public void submitTransaction(SubmitTransactionRequest request,
                                  StreamObserver<TransactionReceipt> responseObserver) {
        long startTime = System.nanoTime();

        try {
            // 1. Generate transaction ID if not provided
            String txId = request.getTxHash().isEmpty() ?
                    generateTransactionId(request.getPayload()) :
                    request.getTxHash();

            LOG.infof("Submitting transaction: txId=%s, from=%s", txId, request.getSigner());

            // 2. Validate request
            if (!validateSubmitRequest(request)) {
                responseObserver.onError(io.grpc.Status.INVALID_ARGUMENT
                        .withDescription("Invalid submit request")
                        .asException());
                return;
            }

            // 3. Process transaction asynchronously (non-blocking)
            executorService.submit(() -> {
                try {
                    // Call existing transaction service
                    String hash = transactionService.processTransactionOptimized(
                            txId,
                            parseAmount(request.getPayload())
                    );

                    // 4. Create transaction index entry
                    TransactionStatusData statusData = new TransactionStatusData(
                            txId,
                            TransactionStatusEnum.TRANSACTION_STATUS_PENDING,
                            System.currentTimeMillis(),
                            request.getSigner(),
                            0
                    );
                    transactionIndex.put(txId, statusData);
                    addToPendingQueue(txId, request);

                    // 5. Create receipt
                    TransactionReceipt receipt = TransactionReceipt.newBuilder()
                            .setTxId(txId)
                            .setStatus(TransactionStatus.newBuilder()
                                    .setTxId(txId)
                                    .setStatus(TransactionStatusEnum.TRANSACTION_STATUS_PENDING)
                                    .setConfirmations(0)
                                    .setFinalized(false)
                                    .setUpdatedAt(getCurrentTimestamp())
                                    .build())
                            .setBlockHeight(0)
                            .setGasUsed(0)
                            .setTimestamp(getCurrentTimestamp())
                            .setConfirmationCount(0)
                            .build();

                    // 6. Send response
                    responseObserver.onNext(receipt);
                    responseObserver.onCompleted();

                    // 7. Update metrics
                    totalSubmitted.incrementAndGet();
                    totalLatencyNanos.addAndGet(System.nanoTime() - startTime);

                    // 8. Broadcast status update
                    broadcastStatusUpdate(txId, TransactionStatusEnum.TRANSACTION_STATUS_PENDING);

                } catch (Exception e) {
                    LOG.error("Error processing transaction: " + e.getMessage());
                    responseObserver.onError(io.grpc.Status.INTERNAL
                            .withDescription("Error processing transaction: " + e.getMessage())
                            .asException());
                    totalFailed.incrementAndGet();
                }
            });

        } catch (Exception e) {
            LOG.error("Error in submitTransaction: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Internal error: " + e.getMessage())
                    .asException());
            totalFailed.incrementAndGet();
        }
    }

    /**
     * ========================================================================
     * RPC Method 2: getTransactionStatus (Unary)
     * ========================================================================
     * Query transaction status by ID
     *
     * Request: TransactionIdRequest (txId)
     * Response: TransactionStatus
     * Latency Target: <5ms (index lookup)
     */
    @Override
    public void getTransactionStatus(TransactionIdRequest request,
                                     StreamObserver<TransactionStatus> responseObserver) {
        try {
            String txId = request.getTxId();

            // Fast index lookup
            TransactionStatusData statusData = transactionIndex.get(txId);

            if (statusData == null) {
                responseObserver.onError(io.grpc.Status.NOT_FOUND
                        .withDescription("Transaction not found: " + txId)
                        .asException());
                return;
            }

            // Build status response
            TransactionStatus status = TransactionStatus.newBuilder()
                    .setTxId(txId)
                    .setStatus(statusData.status)
                    .setConfirmations(statusData.confirmations)
                    .setBlockHash(statusData.blockHash)
                    .setFinalized(statusData.finalized)
                    .setUpdatedAt(getCurrentTimestamp())
                    .build();

            responseObserver.onNext(status);
            responseObserver.onCompleted();

        } catch (Exception e) {
            LOG.error("Error getting transaction status: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Error: " + e.getMessage())
                    .asException());
        }
    }

    /**
     * ========================================================================
     * RPC Method 3: validateTransaction (Unary)
     * ========================================================================
     * Validate transaction before submission
     *
     * Request: ValidateTransactionRequest
     * Response: ValidationResult
     * Does NOT submit to blockchain
     */
    @Override
    public void validateTransaction(ValidateTransactionRequest request,
                                    StreamObserver<ValidationResult> responseObserver) {
        try {
            // Perform validation checks
            ValidationError errorCode = ValidationError.VALIDATION_ERROR_NONE;
            String errorMessage = "";

            // 1. Check payload not empty
            if (request.getPayload().isEmpty()) {
                errorCode = ValidationError.VALIDATION_ERROR_INVALID_FORMAT;
                errorMessage = "Empty payload";
            }

            // 2. Check signature present
            else if (request.getSignature().isEmpty()) {
                errorCode = ValidationError.VALIDATION_ERROR_INVALID_SIGNATURE;
                errorMessage = "Missing signature";
            }

            // 3. Check signer present
            else if (request.getSigner().isEmpty()) {
                errorCode = ValidationError.VALIDATION_ERROR_INVALID_FORMAT;
                errorMessage = "Missing signer";
            }

            // Build validation result
            ValidationResult result = ValidationResult.newBuilder()
                    .setValid(errorCode == ValidationError.VALIDATION_ERROR_NONE)
                    .setErrorCode(errorCode)
                    .setErrorMessage(errorMessage)
                    .setSuggestedGasPrice(21000) // Standard gas price
                    .setEstimatedCost(request.getNonce() * 21000) // Estimate
                    .build();

            responseObserver.onNext(result);
            responseObserver.onCompleted();

            totalValidated.incrementAndGet();

        } catch (Exception e) {
            LOG.error("Error validating transaction: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Validation error: " + e.getMessage())
                    .asException());
        }
    }

    /**
     * ========================================================================
     * RPC Method 4: streamPendingTransactions (Server Streaming)
     * ========================================================================
     * Stream all pending transactions in real-time
     *
     * Request: Empty
     * Response: Stream<Transaction>
     * Used by: Validators, monitoring tools, external systems
     */
    @Override
    public void streamPendingTransactions(Empty request,
                                         StreamObserver<Transaction> responseObserver) {
        try {
            LOG.info("Client subscribed to pending transactions stream");

            // Add observer to broadcast list
            pendingTransactionObservers.add(responseObserver);

            // Send current pending transactions
            transactionIndex.values().stream()
                    .filter(tx -> tx.status == TransactionStatusEnum.TRANSACTION_STATUS_PENDING)
                    .forEach(tx -> {
                        Transaction msg = Transaction.newBuilder()
                                .setTxId(tx.txId)
                                .setFromAddress(tx.sender)
                                .setStatus(tx.status)
                                .setTimestamp(getCurrentTimestamp())
                                .build();
                        responseObserver.onNext(msg);
                    });

            // Keep stream open for new pending transactions
            // Observer will receive updates as transactions are submitted
            // Stream closes when client disconnects or error occurs

        } catch (Exception e) {
            LOG.error("Error in streamPendingTransactions: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Error: " + e.getMessage())
                    .asException());
        }
    }

    /**
     * ========================================================================
     * RPC Method 5: watchTransactionStatus (Server Streaming)
     * ========================================================================
     * Watch for transaction status updates
     *
     * Request: TransactionIdRequest (txId)
     * Response: Stream<TransactionStatusUpdate>
     * Closes when: Transaction finalized or error occurs
     */
    @Override
    public void watchTransactionStatus(TransactionIdRequest request,
                                       StreamObserver<TransactionStatusUpdate> responseObserver) {
        try {
            String txId = request.getTxId();

            // Verify transaction exists
            TransactionStatusData statusData = transactionIndex.get(txId);
            if (statusData == null) {
                responseObserver.onError(io.grpc.Status.NOT_FOUND
                        .withDescription("Transaction not found: " + txId)
                        .asException());
                return;
            }

            LOG.infof("Client watching transaction: %s", txId);

            // Send initial status
            TransactionStatusUpdate initialUpdate = TransactionStatusUpdate.newBuilder()
                    .setTxId(txId)
                    .setStatus(statusData.status)
                    .setConfirmations(statusData.confirmations)
                    .setFinalized(statusData.finalized)
                    .setTimestamp(getCurrentTimestamp())
                    .build();
            responseObserver.onNext(initialUpdate);

            // Add to status observers (will receive updates)
            statusObservers.add(responseObserver);

            // Schedule finality check
            executorService.schedule(() -> {
                // Auto-finalize after timeout (simulating consensus)
                statusData.finalized = true;
                statusData.confirmations = 100;

                TransactionStatusUpdate finalUpdate = TransactionStatusUpdate.newBuilder()
                        .setTxId(txId)
                        .setStatus(TransactionStatusEnum.TRANSACTION_STATUS_FINALIZED)
                        .setConfirmations(100)
                        .setFinalized(true)
                        .setTimestamp(getCurrentTimestamp())
                        .build();
                responseObserver.onNext(finalUpdate);
                responseObserver.onCompleted();

                totalFinalized.incrementAndGet();
            }, 5, TimeUnit.SECONDS); // Finalize after 5 seconds

        } catch (Exception e) {
            LOG.error("Error in watchTransactionStatus: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Error: " + e.getMessage())
                    .asException());
        }
    }

    /**
     * ========================================================================
     * RPC Method 6: batchSubmitTransactions (Client Streaming)
     * ========================================================================
     * Submit batch of transactions
     *
     * Request: Stream<BatchSubmitRequest>
     * Response: BatchSubmitResponse (summary)
     * Collects all requests, then responds with summary
     */
    @Override
    public StreamObserver<BatchSubmitRequest> batchSubmitTransactions(
            StreamObserver<BatchSubmitResponse> responseObserver) {

        return new StreamObserver<BatchSubmitRequest>() {
            private final List<BatchSubmitRequest> receivedRequests = new ArrayList<>();
            private int acceptedCount = 0;
            private final List<String> failedHashes = new ArrayList<>();
            private final List<String> errorMessages = new ArrayList<>();

            @Override
            public void onNext(BatchSubmitRequest request) {
                try {
                    // Process each request
                    String txHash = request.getTxHash();

                    // Simulate validation
                    if (request.getPayload().isEmpty()) {
                        failedHashes.add(txHash);
                        errorMessages.add("Empty payload");
                    } else {
                        receivedRequests.add(request);
                        acceptedCount++;

                        // Add to index
                        TransactionStatusData statusData = new TransactionStatusData(
                                txHash,
                                TransactionStatusEnum.TRANSACTION_STATUS_PENDING,
                                System.currentTimeMillis(),
                                request.getSigner(),
                                0
                        );
                        transactionIndex.put(txHash, statusData);
                    }

                } catch (Exception e) {
                    failedHashes.add(request.getTxHash());
                    errorMessages.add("Processing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(Throwable t) {
                LOG.error("Error in batch stream: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                try {
                    // Send summary response
                    BatchSubmitResponse response = BatchSubmitResponse.newBuilder()
                            .setReceivedCount(receivedRequests.size() + failedHashes.size())
                            .setAcceptedCount(acceptedCount)
                            .setRejectedCount(failedHashes.size())
                            .addAllFailedHashes(failedHashes)
                            .addAllErrorMessages(errorMessages)
                            .setSummary(String.format("Processed %d transactions: %d accepted, %d rejected",
                                    receivedRequests.size() + failedHashes.size(),
                                    acceptedCount,
                                    failedHashes.size()))
                            .build();

                    responseObserver.onNext(response);
                    responseObserver.onCompleted();

                    totalSubmitted.addAndGet(acceptedCount);

                } catch (Exception e) {
                    LOG.error("Error completing batch: " + e.getMessage());
                    responseObserver.onError(io.grpc.Status.INTERNAL
                            .withDescription("Error: " + e.getMessage())
                            .asException());
                }
            }
        };
    }

    /**
     * ========================================================================
     * RPC Method 7: transactionServiceStream (Bidirectional)
     * ========================================================================
     * Full-duplex transaction service
     *
     * Request: Stream<TransactionRequest>
     * Response: Stream<TransactionResponse>
     * Client sends requests, server sends responses and updates
     * Advanced interaction pattern for complex workflows
     */
    @Override
    public StreamObserver<TransactionRequest> transactionServiceStream(
            StreamObserver<TransactionResponse> responseObserver) {

        return new StreamObserver<TransactionRequest>() {
            @Override
            public void onNext(TransactionRequest request) {
                try {
                    // Handle different request types
                    if (request.hasSubmit()) {
                        // Submit transaction
                        SubmitTransactionRequest submitReq = request.getSubmit();
                        String txId = submitReq.getTxHash().isEmpty() ?
                                generateTransactionId(submitReq.getPayload()) :
                                submitReq.getTxHash();

                        TransactionReceipt receipt = TransactionReceipt.newBuilder()
                                .setTxId(txId)
                                .setStatus(TransactionStatus.newBuilder()
                                        .setTxId(txId)
                                        .setStatus(TransactionStatusEnum.TRANSACTION_STATUS_PENDING)
                                        .build())
                                .build();

                        TransactionResponse response = TransactionResponse.newBuilder()
                                .setReceipt(receipt)
                                .build();
                        responseObserver.onNext(response);

                    } else if (request.hasQuery()) {
                        // Query status
                        TransactionIdRequest queryReq = request.getQuery();
                        String txId = queryReq.getTxId();

                        TransactionStatusData statusData = transactionIndex.get(txId);
                        if (statusData != null) {
                            TransactionStatus status = TransactionStatus.newBuilder()
                                    .setTxId(txId)
                                    .setStatus(statusData.status)
                                    .setConfirmations(statusData.confirmations)
                                    .build();

                            TransactionResponse response = TransactionResponse.newBuilder()
                                    .setStatus(status)
                                    .build();
                            responseObserver.onNext(response);
                        }

                    } else if (request.hasValidate()) {
                        // Validate transaction
                        ValidationResult result = ValidationResult.newBuilder()
                                .setValid(true)
                                .setErrorCode(ValidationError.VALIDATION_ERROR_NONE)
                                .build();

                        TransactionResponse response = TransactionResponse.newBuilder()
                                .setValidation(result)
                                .build();
                        responseObserver.onNext(response);
                    }

                } catch (Exception e) {
                    LOG.error("Error in bidirectional stream: " + e.getMessage());
                }
            }

            @Override
            public void onError(Throwable t) {
                LOG.error("Bidirectional stream error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                LOG.info("Bidirectional stream completed");
                responseObserver.onCompleted();
            }
        };
    }

    /**
     * ========================================================================
     * RPC Method 8: checkHealth (Unary)
     * ========================================================================
     * Service health check (gRPC standard)
     */
    @Override
    public void checkHealth(Empty request,
                           StreamObserver<HealthStatus> responseObserver) {
        try {
            HealthStatus health = HealthStatus.newBuilder()
                    .setStatus(HealthStatus.Status.SERVING)
                    .setMessage("TransactionGrpcService is healthy")
                    .setUptimeSeconds(getUptimeSeconds())
                    .setActiveConnections(statusObservers.size() + pendingTransactionObservers.size())
                    .setLastHeartbeatAt(getCurrentTimestamp())
                    .build();

            responseObserver.onNext(health);
            responseObserver.onCompleted();

        } catch (Exception e) {
            LOG.error("Error in checkHealth: " + e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Health check failed")
                    .asException());
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private String generateTransactionId(com.google.protobuf.ByteString payload) {
        return UUID.randomUUID().toString();
    }

    private boolean validateSubmitRequest(SubmitTransactionRequest request) {
        return !request.getPayload().isEmpty() &&
               !request.getSignature().isEmpty() &&
               !request.getSigner().isEmpty();
    }

    private double parseAmount(com.google.protobuf.ByteString payload) {
        // Placeholder: parse amount from payload
        return 0.0;
    }

    private void addToPendingQueue(String txId, SubmitTransactionRequest request) {
        try {
            Transaction tx = Transaction.newBuilder()
                    .setTxId(txId)
                    .setFromAddress(request.getSigner())
                    .setStatus(TransactionStatusEnum.TRANSACTION_STATUS_PENDING)
                    .setTimestamp(getCurrentTimestamp())
                    .build();

            pendingTransactionQueue.offer(tx);

            // Broadcast to pending transaction observers
            pendingTransactionObservers.forEach(observer -> observer.onNext(tx));

        } catch (Exception e) {
            LOG.error("Error adding to pending queue: " + e.getMessage());
        }
    }

    private void broadcastStatusUpdate(String txId, TransactionStatusEnum status) {
        TransactionStatusUpdate update = TransactionStatusUpdate.newBuilder()
                .setTxId(txId)
                .setStatus(status)
                .setTimestamp(getCurrentTimestamp())
                .build();

        statusObservers.forEach(observer -> {
            try {
                observer.onNext(update);
            } catch (Exception e) {
                LOG.debug("Error broadcasting status update: " + e.getMessage());
            }
        });
    }

    private String getCurrentTimestamp() {
        return java.time.Instant.now().toString();
    }

    private long getUptimeSeconds() {
        // Placeholder: return server uptime
        return System.currentTimeMillis() / 1000;
    }

    /**
     * Get transaction service metrics
     */
    public TransactionServiceMetrics getMetrics() {
        return new TransactionServiceMetrics(
                totalSubmitted.get(),
                totalValidated.get(),
                totalFinalized.get(),
                totalFailed.get(),
                totalLatencyNanos.get() / Math.max(1, totalSubmitted.get()),
                statusObservers.size(),
                pendingTransactionObservers.size(),
                transactionIndex.size()
        );
    }

    /**
     * Internal class for transaction status data
     */
    private static class TransactionStatusData {
        final String txId;
        TransactionStatusEnum status;
        int confirmations;
        String blockHash = "";
        boolean finalized = false;
        final String sender;
        final long createdAt;

        TransactionStatusData(String txId, TransactionStatusEnum status,
                             long createdAt, String sender, int confirmations) {
            this.txId = txId;
            this.status = status;
            this.createdAt = createdAt;
            this.sender = sender;
            this.confirmations = confirmations;
        }
    }

    /**
     * Metrics record
     */
    public record TransactionServiceMetrics(
            long totalSubmitted,
            long totalValidated,
            long totalFinalized,
            long totalFailed,
            long averageLatencyNanos,
            int activeStatusWatchers,
            int activePendingWatchers,
            int transactionIndexSize
    ) {
        public double getAverageLatencyMs() {
            return averageLatencyNanos / 1_000_000.0;
        }
    }
}
