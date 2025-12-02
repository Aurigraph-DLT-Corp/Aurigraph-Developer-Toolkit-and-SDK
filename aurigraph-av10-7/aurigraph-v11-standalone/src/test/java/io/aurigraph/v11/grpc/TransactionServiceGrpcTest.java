package io.aurigraph.v11.grpc;

import io.aurigraph.grpc.service.TransactionServiceImpl;
import io.aurigraph.v11.proto.*;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.enterprise.inject.Any;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for TransactionServiceImpl gRPC service.
 * Tests cover all 12 RPC methods with various scenarios including:
 * - Happy path tests
 * - Edge cases
 * - Error handling
 * - Performance benchmarks
 * - Streaming functionality
 *
 * Target: 90% code coverage for AV11-489
 *
 * @author QA Agent - Sprint 16
 * @ticket AV11-489
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("TransactionService gRPC Tests")
class TransactionServiceGrpcTest {

    @Inject
    @Any
    TransactionServiceImpl transactionService;

    // ==================== Submit Transaction Tests ====================

    @Test
    @Order(1)
    @DisplayName("submitTransaction - should submit transaction successfully")
    void testSubmitTransaction_Success() {
        // Given - using correct proto field names from core_types.proto
        Transaction tx = Transaction.newBuilder()
                .setFromAddress("0x1234567890abcdef")
                .setToAddress("0xabcdef1234567890")
                .setAmount("1000000000000000000") // 1 token
                .setNonce(1)
                .build();

        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                .setTransaction(tx)
                .build();

        // When
        Uni<TransactionSubmissionResponse> result = transactionService.submitTransaction(request);

        // Then
        UniAssertSubscriber<TransactionSubmissionResponse> subscriber = result
                .subscribe().withSubscriber(UniAssertSubscriber.create());

        TransactionSubmissionResponse response = subscriber.awaitItem().getItem();
        assertNotNull(response);
        assertNotNull(response.getTransactionHash());
        assertFalse(response.getTransactionHash().isEmpty());
        assertEquals(TransactionStatus.TRANSACTION_PENDING, response.getStatus());
        assertNotNull(response.getTimestamp());
        assertEquals("Transaction submitted successfully", response.getMessage());
    }

    @Test
    @Order(2)
    @DisplayName("submitTransaction - should handle empty transaction")
    void testSubmitTransaction_EmptyTransaction() {
        // Given
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder().build();

        // When
        Uni<TransactionSubmissionResponse> result = transactionService.submitTransaction(request);

        // Then
        UniAssertSubscriber<TransactionSubmissionResponse> subscriber = result
                .subscribe().withSubscriber(UniAssertSubscriber.create());

        TransactionSubmissionResponse response = subscriber.awaitItem().getItem();
        assertNotNull(response);
        // Service should still respond gracefully
        assertNotNull(response.getTransactionHash());
    }

    // ==================== Batch Submit Transactions Tests ====================

    @Test
    @Order(3)
    @DisplayName("batchSubmitTransactions - should submit multiple transactions")
    void testBatchSubmitTransactions_Success() {
        // Given
        Transaction tx1 = Transaction.newBuilder()
                .setFromAddress("0x1111")
                .setToAddress("0x2222")
                .setAmount("100")
                .build();

        Transaction tx2 = Transaction.newBuilder()
                .setFromAddress("0x3333")
                .setToAddress("0x4444")
                .setAmount("200")
                .build();

        BatchTransactionSubmissionRequest request = BatchTransactionSubmissionRequest.newBuilder()
                .addTransactions(tx1)
                .addTransactions(tx2)
                .build();

        // When
        Uni<BatchTransactionSubmissionResponse> result = transactionService.batchSubmitTransactions(request);

        // Then
        UniAssertSubscriber<BatchTransactionSubmissionResponse> subscriber = result
                .subscribe().withSubscriber(UniAssertSubscriber.create());

        BatchTransactionSubmissionResponse response = subscriber.awaitItem().getItem();
        assertNotNull(response);
        assertNotNull(response.getBatchId());
        assertEquals(2, response.getAcceptedCount());
        assertEquals(0, response.getRejectedCount());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 5, 10, 50, 100})
    @Order(4)
    @DisplayName("batchSubmitTransactions - should handle various batch sizes")
    void testBatchSubmitTransactions_VariousSizes(int batchSize) {
        // Given
        BatchTransactionSubmissionRequest.Builder requestBuilder = BatchTransactionSubmissionRequest.newBuilder();
        for (int i = 0; i < batchSize; i++) {
            requestBuilder.addTransactions(Transaction.newBuilder()
                    .setFromAddress("0x" + i)
                    .setToAddress("0x" + (i + 1))
                    .setAmount(String.valueOf(i * 100))
                    .build());
        }

        // When
        Uni<BatchTransactionSubmissionResponse> result = transactionService.batchSubmitTransactions(requestBuilder.build());

        // Then
        BatchTransactionSubmissionResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertEquals(batchSize, response.getAcceptedCount());
    }

    // ==================== Get Transaction Status Tests ====================

    @Test
    @Order(5)
    @DisplayName("getTransactionStatus - should return confirmed status")
    void testGetTransactionStatus_Confirmed() {
        // Given
        String txHash = UUID.randomUUID().toString();
        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
                .setTransactionHash(txHash)
                .build();

        // When
        Uni<TransactionStatusResponse> result = transactionService.getTransactionStatus(request);

        // Then
        TransactionStatusResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertEquals(TransactionStatus.TRANSACTION_CONFIRMED, response.getStatus());
        assertTrue(response.getConfirmations() >= 1);
        assertNotNull(response.getTimestamp());
    }

    // ==================== Get Transaction Receipt Tests ====================

    @Test
    @Order(6)
    @DisplayName("getTransactionReceipt - should return valid receipt")
    void testGetTransactionReceipt_Success() {
        // Given
        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .build();

        // When
        Uni<TransactionReceipt> result = transactionService.getTransactionReceipt(request);

        // Then
        TransactionReceipt receipt = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(receipt);
        assertEquals(TransactionStatus.TRANSACTION_CONFIRMED, receipt.getStatus());
        assertTrue(receipt.getBlockHeight() > 0);
        assertTrue(receipt.getGasUsed() > 0);
        assertNotNull(receipt.getExecutionTime());
    }

    // ==================== Cancel Transaction Tests ====================

    @Test
    @Order(7)
    @DisplayName("cancelTransaction - should cancel pending transaction")
    void testCancelTransaction_Success() {
        // Given - using correct field name from transaction.proto
        CancelTransactionRequest request = CancelTransactionRequest.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .setCancellationReason("User cancelled")
                .build();

        // When
        Uni<CancelTransactionResponse> result = transactionService.cancelTransaction(request);

        // Then
        CancelTransactionResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getCancellationSuccessful());
        assertNotNull(response.getReason());
        assertNotNull(response.getTimestamp());
    }

    // ==================== Resend Transaction Tests ====================

    @Test
    @Order(8)
    @DisplayName("resendTransaction - should resend with new hash")
    void testResendTransaction_Success() {
        // Given
        String originalHash = UUID.randomUUID().toString();
        ResendTransactionRequest request = ResendTransactionRequest.newBuilder()
                .setOriginalTransactionHash(originalHash)
                .build();

        // When
        Uni<ResendTransactionResponse> result = transactionService.resendTransaction(request);

        // Then
        ResendTransactionResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertEquals(originalHash, response.getOriginalTransactionHash());
        assertNotNull(response.getNewTransactionHash());
        assertNotEquals(originalHash, response.getNewTransactionHash());
        assertEquals(TransactionStatus.TRANSACTION_PENDING, response.getStatus());
    }

    // ==================== Estimate Gas Cost Tests ====================

    @Test
    @Order(9)
    @DisplayName("estimateGasCost - should return valid gas estimate")
    void testEstimateGasCost_Success() {
        // Given - using correct field names from transaction.proto
        EstimateGasCostRequest request = EstimateGasCostRequest.newBuilder()
                .setFromAddress("0x1234")
                .setToAddress("0x5678")
                .setAmount("1000")
                .build();

        // When
        Uni<GasEstimate> result = transactionService.estimateGasCost(request);

        // Then
        GasEstimate estimate = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(estimate);
        assertTrue(estimate.getEstimatedGas() > 0);
        assertTrue(estimate.getGasPriceWei() > 0);
        assertNotNull(estimate.getTotalCost());
        assertFalse(estimate.getTotalCost().isEmpty());
    }

    // ==================== Validate Transaction Signature Tests ====================

    @Test
    @Order(10)
    @DisplayName("validateTransactionSignature - should validate signature")
    void testValidateTransactionSignature_Valid() {
        // Given - using correct field names from transaction.proto
        Transaction tx = Transaction.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .setFromAddress("0x1234567890abcdef")
                .setToAddress("0xabcdef1234567890")
                .setAmount("1000")
                .setSignature("0x" + "ab".repeat(65))
                .build();

        ValidateTransactionSignatureRequest request = ValidateTransactionSignatureRequest.newBuilder()
                .setTransaction(tx)
                .setValidateSender(true)
                .setValidateNonce(true)
                .build();

        // When
        Uni<TransactionSignatureValidationResult> result = transactionService.validateTransactionSignature(request);

        // Then
        TransactionSignatureValidationResult validationResult = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(validationResult);
        assertTrue(validationResult.getSignatureValid());
        assertTrue(validationResult.getSenderValid());
        assertTrue(validationResult.getNonceValid());
    }

    // ==================== Get Pending Transactions Tests ====================

    @Test
    @Order(11)
    @DisplayName("getPendingTransactions - should return pending transaction list")
    void testGetPendingTransactions_Success() {
        // Given - using correct field names from transaction.proto
        GetPendingTransactionsRequest request = GetPendingTransactionsRequest.newBuilder()
                .setLimit(10)
                .setSortByFee(true)
                .build();

        // When
        Uni<PendingTransactionsResponse> result = transactionService.getPendingTransactions(request);

        // Then
        PendingTransactionsResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalPending() >= 0);
        assertTrue(response.getAverageGasPrice() > 0);
        assertNotNull(response.getQueryTime());
    }

    // ==================== Get Transaction History Tests ====================

    @Test
    @Order(12)
    @DisplayName("getTransactionHistory - should return history")
    void testGetTransactionHistory_Success() {
        // Given
        GetTransactionHistoryRequest request = GetTransactionHistoryRequest.newBuilder()
                .setAddress("0x1234567890abcdef")
                .setLimit(50)
                .setOffset(0)
                .build();

        // When
        Uni<TransactionHistoryResponse> result = transactionService.getTransactionHistory(request);

        // Then
        TransactionHistoryResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalCount() >= 0);
        assertTrue(response.getReturnedCount() >= 0);
        assertNotNull(response.getQueryTime());
    }

    // ==================== Get TxPool Size Tests ====================

    @Test
    @Order(13)
    @DisplayName("getTxPoolSize - should return pool statistics")
    void testGetTxPoolSize_Success() {
        // Given
        GetTxPoolSizeRequest request = GetTxPoolSizeRequest.newBuilder().build();

        // When
        Uni<TxPoolStatistics> result = transactionService.getTxPoolSize(request);

        // Then
        TxPoolStatistics stats = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(stats);
        assertTrue(stats.getTotalPending() >= 0);
        assertTrue(stats.getTotalQueued() >= 0);
        assertNotNull(stats.getTimestamp());
    }

    // ==================== Stream Transaction Events Tests ====================

    @Test
    @Order(14)
    @DisplayName("streamTransactionEvents - should stream events")
    void testStreamTransactionEvents_Success() throws InterruptedException {
        // Given - using correct field names from transaction.proto
        StreamTransactionEventsRequest request = StreamTransactionEventsRequest.newBuilder()
                .setFilterAddress("0x1234567890abcdef")
                .setIncludeFailed(true)
                .setStreamTimeoutSeconds(10)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(3);

        // When
        Multi<TransactionEvent> stream = transactionService.streamTransactionEvents(request);

        // Then
        AssertSubscriber<TransactionEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(3));

        boolean completed = latch.await(5, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 3, "Should receive at least 3 events");

        List<TransactionEvent> events = subscriber.getItems();
        assertFalse(events.isEmpty());
        events.forEach(event -> {
            assertNotNull(event.getEventType());
            assertNotNull(event.getStatus());
            assertNotNull(event.getTimestamp());
        });
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(15)
    @DisplayName("Performance - submit 1000 transactions under 5 seconds")
    void testPerformance_HighThroughput() {
        // Given
        int transactionCount = 1000;
        long startTime = System.currentTimeMillis();

        // When
        for (int i = 0; i < transactionCount; i++) {
            SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                    .setTransaction(Transaction.newBuilder()
                            .setFromAddress("0x" + i)
                            .setToAddress("0x" + (i + 1))
                            .setAmount(String.valueOf(i))
                            .build())
                    .build();

            transactionService.submitTransaction(request).await().atMost(Duration.ofSeconds(1));
        }

        // Then
        long duration = System.currentTimeMillis() - startTime;
        double tps = (transactionCount * 1000.0) / duration;

        assertTrue(duration < 5000, "Should complete 1000 transactions in under 5 seconds");
        System.out.printf("Performance: %d transactions in %d ms (%.2f TPS)%n", transactionCount, duration, tps);
    }

    @Test
    @Order(16)
    @DisplayName("Performance - batch submit latency under 100ms")
    void testPerformance_BatchLatency() {
        // Given
        BatchTransactionSubmissionRequest.Builder requestBuilder = BatchTransactionSubmissionRequest.newBuilder();
        for (int i = 0; i < 100; i++) {
            requestBuilder.addTransactions(Transaction.newBuilder()
                    .setFromAddress("0x" + i)
                    .setToAddress("0x" + (i + 1))
                    .setAmount(String.valueOf(i))
                    .build());
        }

        // When
        long startTime = System.nanoTime();
        transactionService.batchSubmitTransactions(requestBuilder.build()).await().atMost(Duration.ofSeconds(5));
        long duration = (System.nanoTime() - startTime) / 1_000_000; // Convert to ms

        // Then
        assertTrue(duration < 100, "Batch submit should complete in under 100ms, took: " + duration + "ms");
    }

    // ==================== Concurrency Tests ====================

    @Test
    @Order(17)
    @DisplayName("Concurrency - handle 100 concurrent requests")
    void testConcurrency_ParallelRequests() throws InterruptedException {
        // Given
        int threadCount = 100;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        // When
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            new Thread(() -> {
                try {
                    startLatch.await();
                    SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                            .setTransaction(Transaction.newBuilder()
                                    .setFromAddress("0x" + threadId)
                                    .setToAddress("0x" + (threadId + 1))
                                    .setAmount(String.valueOf(threadId))
                                    .build())
                            .build();

                    TransactionSubmissionResponse response = transactionService.submitTransaction(request)
                            .await().atMost(Duration.ofSeconds(5));

                    if (response != null && response.getTransactionHash() != null) {
                        successCount.incrementAndGet();
                    } else {
                        failureCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    completionLatch.countDown();
                }
            }).start();
        }

        startLatch.countDown(); // Start all threads simultaneously
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);

        // Then
        assertTrue(completed, "All threads should complete within timeout");
        assertEquals(threadCount, successCount.get(), "All requests should succeed");
        assertEquals(0, failureCount.get(), "No requests should fail");
    }
}
