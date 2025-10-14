package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.consensus.ConsensusService;
import io.aurigraph.v11.grpc.transaction.TransactionService;
import io.aurigraph.v11.grpc.transaction.TransactionRequest;
import io.aurigraph.v11.grpc.transaction.TransactionResponse;
import io.aurigraph.v11.grpc.transaction.TransactionStatus;
import io.aurigraph.v11.grpc.transaction.TransactionDetail;
import io.aurigraph.v11.grpc.transaction.TransactionBatchRequest;
import io.aurigraph.v11.grpc.transaction.TransactionBatchResponse;
import io.aurigraph.v11.grpc.transaction.TransactionStatusResponse;
import io.aurigraph.v11.grpc.transaction.TransactionQuery;
import io.aurigraph.v11.grpc.transaction.ValidationResponse;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.GrpcClient;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * gRPC Transaction Service Implementation
 * Sprint 13 - Workstream 1: gRPC Service Migration
 *
 * High-performance transaction processing service using gRPC and reactive streams.
 * Targets 2M+ TPS with quantum-resistant cryptography.
 */
@GrpcService
public class TransactionServiceImpl implements TransactionService {

    private static final Logger LOG = Logger.getLogger(TransactionServiceImpl.class);

    // In-memory transaction storage (will be replaced with persistent storage)
    private final Map<String, TransactionDetail> transactionStore = new ConcurrentHashMap<>();

    @GrpcClient("consensus")
    ConsensusService consensusClient;

    /**
     * Submit a single transaction
     * Sprint 13 - Core implementation
     */
    @Override
    public Uni<TransactionResponse> submitTransaction(TransactionRequest request) {
        LOG.infof("Submitting transaction: %s from %s to %s",
            request.getTransactionId(), request.getFromAddress(), request.getToAddress());

        return Uni.createFrom().item(() -> {
            // Validate transaction
            if (!isValidTransaction(request)) {
                return TransactionResponse.newBuilder()
                    .setTransactionId(request.getTransactionId())
                    .setStatus(TransactionStatus.REJECTED)
                    .setMessage("Transaction validation failed")
                    .setTimestamp(Instant.now().toEpochMilli())
                    .build();
            }

            // Store transaction in mempool
            TransactionDetail detail = TransactionDetail.newBuilder()
                .setTransactionId(request.getTransactionId())
                .setFromAddress(request.getFromAddress())
                .setToAddress(request.getToAddress())
                .setAmount(request.getAmount())
                .setFee(request.getFee())
                .setNonce(request.getNonce())
                .setSignature(request.getSignature())
                .setStatus(TransactionStatus.IN_MEMPOOL)
                .build();

            transactionStore.put(request.getTransactionId(), detail);

            // Return success response
            return TransactionResponse.newBuilder()
                .setTransactionId(request.getTransactionId())
                .setStatus(TransactionStatus.IN_MEMPOOL)
                .setMessage("Transaction accepted to mempool")
                .setTimestamp(Instant.now().toEpochMilli())
                .setGasUsed(21000) // Base gas cost
                .build();
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Submit batch of transactions
     * Sprint 15 - Parallel execution optimization
     */
    @Override
    public Uni<TransactionBatchResponse> submitTransactionBatch(TransactionBatchRequest request) {
        LOG.infof("Processing batch of %d transactions", request.getTransactionsCount());

        long startTime = System.currentTimeMillis();

        return Uni.createFrom().item(() -> {
            List<TransactionResponse> results = new ArrayList<>();
            int successful = 0;
            int failed = 0;

            // Process transactions in parallel if requested
            if (request.getParallelExecution()) {
                // Parallel processing using virtual threads
                results = request.getTransactionsList().parallelStream()
                    .map(tx -> submitTransaction(tx).await().indefinitely())
                    .toList();
            } else {
                // Sequential processing
                for (TransactionRequest tx : request.getTransactionsList()) {
                    TransactionResponse response = submitTransaction(tx).await().indefinitely();
                    results.add(response);
                }
            }

            // Count results
            for (TransactionResponse response : results) {
                if (response.getStatus() == TransactionStatus.IN_MEMPOOL ||
                    response.getStatus() == TransactionStatus.CONFIRMED) {
                    successful++;
                } else {
                    failed++;
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;

            return TransactionBatchResponse.newBuilder()
                .setTotalTransactions(request.getTransactionsCount())
                .setSuccessfulTransactions(successful)
                .setFailedTransactions(failed)
                .addAllResults(results)
                .setProcessingTimeMs(processingTime)
                .build();
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get transaction by ID
     */
    @Override
    public Uni<TransactionDetail> getTransaction(TransactionQuery request) {
        return Uni.createFrom().item(() -> {
            TransactionDetail detail = transactionStore.get(request.getTransactionId());
            if (detail == null) {
                throw new IllegalArgumentException("Transaction not found: " + request.getTransactionId());
            }
            return detail;
        });
    }

    /**
     * Get transaction status
     */
    @Override
    public Uni<TransactionStatusResponse> getTransactionStatus(TransactionQuery request) {
        return Uni.createFrom().item(() -> {
            TransactionDetail detail = transactionStore.get(request.getTransactionId());
            if (detail == null) {
                return TransactionStatusResponse.newBuilder()
                    .setTransactionId(request.getTransactionId())
                    .setStatus(TransactionStatus.REJECTED)
                    .setConfirmations(0)
                    .setFinalized(false)
                    .build();
            }

            return TransactionStatusResponse.newBuilder()
                .setTransactionId(request.getTransactionId())
                .setStatus(detail.getStatus())
                .setConfirmations(detail.getConfirmations())
                .setFinalized(detail.getConfirmations() >= 12)
                .build();
        });
    }

    /**
     * Stream transaction updates (bidirectional streaming)
     * Sprint 13 - Real-time transaction updates
     */
    @Override
    public Multi<TransactionResponse> streamTransactions(Multi<TransactionRequest> requests) {
        LOG.info("Starting transaction stream");

        return requests.onItem().transformToUniAndMerge(request -> {
            return submitTransaction(request);
        });
    }

    /**
     * Validate transaction without submitting
     * Sprint 16 - Validation framework
     */
    @Override
    public Uni<ValidationResponse> validateTransaction(TransactionRequest request) {
        return Uni.createFrom().item(() -> {
            List<String> errors = new ArrayList<>();
            List<String> warnings = new ArrayList<>();

            // Validate amount
            if (request.getAmount() <= 0) {
                errors.add("Amount must be positive");
            }

            // Validate addresses
            if (request.getFromAddress().isEmpty()) {
                errors.add("From address is required");
            }
            if (request.getToAddress().isEmpty()) {
                errors.add("To address is required");
            }

            // Validate signature
            if (request.getSignature().isEmpty()) {
                errors.add("Signature is required");
            }

            // Validate nonce
            if (request.getNonce() < 0) {
                errors.add("Nonce must be non-negative");
            }

            // Check fee
            if (request.getFee() < 1000) {
                warnings.add("Fee is low, transaction may be delayed");
            }

            boolean valid = errors.isEmpty();
            long estimatedGas = calculateEstimatedGas(request);

            return ValidationResponse.newBuilder()
                .setValid(valid)
                .addAllErrors(errors)
                .addAllWarnings(warnings)
                .setEstimatedGas(estimatedGas)
                .build();
        });
    }

    // Helper methods

    /**
     * Internal helper method for quick validation
     * Returns true if transaction is valid, false otherwise
     */
    private boolean isValidTransaction(TransactionRequest request) {
        if (request.getAmount() <= 0) return false;
        if (request.getFromAddress().isEmpty()) return false;
        if (request.getToAddress().isEmpty()) return false;
        if (request.getSignature().isEmpty()) return false;
        if (request.getNonce() < 0) return false;
        return true;
    }

    private long calculateEstimatedGas(TransactionRequest request) {
        long baseGas = 21000L;
        long dataGas = request.getMetadataCount() * 68L;

        return baseGas + dataGas;
    }

    /**
     * Get transaction statistics
     * Sprint 17 - Analytics integration
     */
    public TransactionStats getStats() {
        long totalTransactions = transactionStore.size();
        long pendingTransactions = transactionStore.values().stream()
            .filter(tx -> tx.getStatus() == TransactionStatus.PENDING ||
                         tx.getStatus() == TransactionStatus.IN_MEMPOOL)
            .count();

        long confirmedTransactions = transactionStore.values().stream()
            .filter(tx -> tx.getStatus() == TransactionStatus.CONFIRMED ||
                         tx.getStatus() == TransactionStatus.FINALIZED)
            .count();

        return new TransactionStats(totalTransactions, pendingTransactions, confirmedTransactions);
    }

    public record TransactionStats(long total, long pending, long confirmed) {}
}
