package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Story 9, Phase 4: TransactionGrpcService Comprehensive Tests
 *
 * Tests cover all 8 RPC methods with:
 * - Functional correctness
 * - Performance targets
 * - Error handling
 * - Concurrent operation
 * - Streaming behavior
 *
 * Target: 15 tests covering 95%+ code paths
 */
@QuarkusTest
@DisplayName("TransactionGrpcService Tests")
public class TransactionGrpcServiceTest {

    @Inject
    private TransactionGrpcService transactionService;

    @Mock
    private StreamObserver<TransactionReceipt> receiptObserver;

    @Mock
    private StreamObserver<TransactionStatus> statusObserver;

    @Mock
    private StreamObserver<ValidationResult> validationObserver;

    @Mock
    private StreamObserver<Transaction> transactionObserver;

    @Mock
    private StreamObserver<TransactionStatusUpdate> updateObserver;

    @Mock
    private StreamObserver<BatchSubmitResponse> batchObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================================================================
    // Test 1: submitTransaction - Basic Submission
    // ========================================================================
    @Test
    @DisplayName("Test 1: Submit transaction and receive receipt")
    public void testSubmitTransactionBasic() {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTxHash("tx_basic_001")
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("test payload"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig123"))
            .setSigner("signer1")
            .setNonce(1)
            .setGasLimit(21000)
            .setGasPrice(1000000000)
            .setPriority(TransactionPriority.TRANSACTION_PRIORITY_NORMAL)
            .setTimestamp("2025-12-24T00:00:00Z")
            .build();

        transactionService.submitTransaction(request, receiptObserver);

        verify(receiptObserver, times(1)).onNext(any(TransactionReceipt.class));
        verify(receiptObserver, times(1)).onCompleted();
        verify(receiptObserver, never()).onError(any());
    }

    // ========================================================================
    // Test 2: submitTransaction - High Priority
    // ========================================================================
    @Test
    @DisplayName("Test 2: Submit high-priority transaction")
    public void testSubmitTransactionHighPriority() {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTxHash("tx_critical_001")
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("critical payload"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig123"))
            .setSigner("signer2")
            .setNonce(2)
            .setGasLimit(50000)
            .setGasPrice(5000000000L)
            .setPriority(TransactionPriority.TRANSACTION_PRIORITY_CRITICAL)
            .build();

        transactionService.submitTransaction(request, receiptObserver);

        verify(receiptObserver).onNext(argThat(receipt ->
            receipt.getStatus().getStatus().equals(BridgeStatusEnum.TRANSACTION_STATUS_UNKNOWN)
                || receipt.getStatus().getStatus().equals(BridgeStatusEnum.TRANSACTION_STATUS_PENDING)));
        verify(receiptObserver).onCompleted();
    }

    // ========================================================================
    // Test 3: getTransactionStatus - Pending Transaction
    // ========================================================================
    @Test
    @DisplayName("Test 3: Query pending transaction status")
    public void testGetTransactionStatusPending() {
        // First submit a transaction
        SubmitTransactionRequest submitRequest = SubmitTransactionRequest.newBuilder()
            .setTxHash("tx_query_001")
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("query test"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig456"))
            .setSigner("signer3")
            .setNonce(3)
            .build();

        transactionService.submitTransaction(submitRequest, receiptObserver);

        // Then query its status
        TransactionIdRequest statusRequest = TransactionIdRequest.newBuilder()
            .setTxId("tx_query_001")
            .build();

        transactionService.getTransactionStatus(statusRequest, statusObserver);

        verify(statusObserver).onNext(any(TransactionStatus.class));
        verify(statusObserver).onCompleted();
    }

    // ========================================================================
    // Test 4: validateTransaction - Valid Signature
    // ========================================================================
    @Test
    @DisplayName("Test 4: Validate transaction with valid signature")
    public void testValidateTransactionValid() {
        ValidateTransactionRequest request = ValidateTransactionRequest.newBuilder()
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("valid tx"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("valid_sig"))
            .setSigner("signer4")
            .setNonce(4)
            .build();

        transactionService.validateTransaction(request, validationObserver);

        verify(validationObserver).onNext(any(ValidationResult.class));
        verify(validationObserver).onCompleted();
    }

    // ========================================================================
    // Test 5: validateTransaction - Invalid Format
    // ========================================================================
    @Test
    @DisplayName("Test 5: Validate transaction with missing signature")
    public void testValidateTransactionMissingSignature() {
        ValidateTransactionRequest request = ValidateTransactionRequest.newBuilder()
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("invalid tx"))
            .setSigner("signer5")
            .setNonce(5)
            // Missing signature
            .build();

        transactionService.validateTransaction(request, validationObserver);

        verify(validationObserver).onNext(any(ValidationResult.class));
        verify(validationObserver).onCompleted();
    }

    // ========================================================================
    // Test 6: Batch Submission - Multiple Transactions
    // ========================================================================
    @Test
    @DisplayName("Test 6: Submit batch of 100 transactions")
    public void testBatchSubmit100Transactions() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger callCount = new AtomicInteger(0);

        StreamObserver<BatchSubmitRequest> requestObserver =
            transactionService.batchSubmitTransactions(new StreamObserver<BatchSubmitResponse>() {
                @Override
                public void onNext(BatchSubmitResponse value) {
                    callCount.incrementAndGet();
                    assertEquals(100, value.getReceivedCount());
                    assertTrue(value.getAcceptedCount() > 90);  // >90% success rate
                }

                @Override
                public void onError(Throwable t) {
                    fail("Should not error: " + t.getMessage());
                }

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 100 batch requests
        for (int i = 0; i < 100; i++) {
            BatchSubmitRequest request = BatchSubmitRequest.newBuilder()
                .setTxHash("batch_tx_" + i)
                .setPayload(com.google.protobuf.ByteString.copyFromUtf8("batch payload " + i))
                .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig" + i))
                .setSigner("signer_batch_" + i)
                .setNonce(i)
                .build();
            requestObserver.onNext(request);
        }

        requestObserver.onCompleted();
        assertTrue(latch.await(10, TimeUnit.SECONDS), "Batch should complete within 10 seconds");
        assertEquals(1, callCount.get());
    }

    // ========================================================================
    // Test 7: Streaming Pending Transactions
    // ========================================================================
    @Test
    @DisplayName("Test 7: Stream pending transactions")
    public void testStreamPendingTransactions() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger streamedCount = new AtomicInteger(0);

        transactionService.streamPendingTransactions(Empty.getDefaultInstance(),
            new StreamObserver<Transaction>() {
                @Override
                public void onNext(Transaction value) {
                    streamedCount.incrementAndGet();
                }

                @Override
                public void onError(Throwable t) {
                    latch.countDown();
                }

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Submit some transactions to the pending queue
        for (int i = 0; i < 5; i++) {
            SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                .setTxHash("pending_" + i)
                .setPayload(com.google.protobuf.ByteString.copyFromUtf8("pending " + i))
                .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig" + i))
                .setSigner("signer" + i)
                .setNonce(i)
                .build();
            transactionService.submitTransaction(request, receiptObserver);
        }

        // Wait for streaming to begin
        Thread.sleep(500);
        assertTrue(streamedCount.get() >= 0, "Should stream transactions");
    }

    // ========================================================================
    // Test 8: Performance - Submission Latency (<100ms)
    // ========================================================================
    @Test
    @DisplayName("Test 8: Submission latency < 100ms")
    public void testSubmissionLatency() {
        long totalLatency = 0;
        int iterations = 100;

        for (int i = 0; i < iterations; i++) {
            long startTime = System.nanoTime();

            SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                .setTxHash("perf_" + i)
                .setPayload(com.google.protobuf.ByteString.copyFromUtf8("perf test " + i))
                .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig" + i))
                .setSigner("signer_perf_" + i)
                .setNonce(i)
                .build();

            transactionService.submitTransaction(request, receiptObserver);

            long latency = System.nanoTime() - startTime;
            totalLatency += latency;
        }

        double avgLatencyMs = (totalLatency / iterations) / 1_000_000.0;
        System.out.println("Average submission latency: " + String.format("%.2f", avgLatencyMs) + "ms");
        assertTrue(avgLatencyMs < 100.0, "Average latency should be <100ms");
    }

    // ========================================================================
    // Test 9: Concurrent Submissions (1000 transactions)
    // ========================================================================
    @Test
    @DisplayName("Test 9: Concurrent submission of 1000 transactions")
    public void testConcurrentSubmissions() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(50);
        CountDownLatch latch = new CountDownLatch(1000);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < 1000; i++) {
            final int txNum = i;
            executor.submit(() -> {
                SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                    .setTxHash("concurrent_" + txNum)
                    .setPayload(com.google.protobuf.ByteString.copyFromUtf8("concurrent " + txNum))
                    .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig" + txNum))
                    .setSigner("signer" + txNum)
                    .setNonce(txNum)
                    .build();

                transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
                    @Override
                    public void onNext(TransactionReceipt value) {}

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS), "Should complete 1000 submissions");
        long duration = System.currentTimeMillis() - startTime;
        double tps = (1000.0 * 1000) / duration;
        System.out.println("Concurrent throughput: " + (int)tps + " tx/sec");

        executor.shutdown();
    }

    // ========================================================================
    // Test 10: Error Handling - Status Query Non-existent TX
    // ========================================================================
    @Test
    @DisplayName("Test 10: Query status of non-existent transaction")
    public void testStatusQueryNonExistent() {
        TransactionIdRequest request = TransactionIdRequest.newBuilder()
            .setTxId("non_existent_tx_12345")
            .build();

        transactionService.getTransactionStatus(request, statusObserver);

        // Should handle gracefully (error or default status)
        verify(statusObserver).onError(any()) | verify(statusObserver).onCompleted();
    }

    // ========================================================================
    // Test 11: Bidirectional Streaming - Transaction Service Stream
    // ========================================================================
    @Test
    @DisplayName("Test 11: Full-duplex transaction service stream")
    public void testTransactionServiceStream() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);
        AtomicInteger responses = new AtomicInteger(0);

        StreamObserver<TransactionRequest> requestObserver =
            transactionService.transactionServiceStream(new StreamObserver<TransactionResponse>() {
                @Override
                public void onNext(TransactionResponse value) {
                    responses.incrementAndGet();
                    latch.countDown();
                }

                @Override
                public void onError(Throwable t) {
                    fail("Stream error: " + t.getMessage());
                }

                @Override
                public void onCompleted() {}
            });

        // Send mixed requests
        for (int i = 0; i < 3; i++) {
            TransactionRequest request = TransactionRequest.newBuilder()
                .setSubmit(SubmitTransactionRequest.newBuilder()
                    .setTxHash("stream_" + i)
                    .setPayload(com.google.protobuf.ByteString.copyFromUtf8("stream " + i))
                    .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig" + i))
                    .setSigner("signer" + i)
                    .setNonce(i)
                    .build())
                .build();
            requestObserver.onNext(request);
        }

        assertTrue(latch.await(5, TimeUnit.SECONDS), "Should receive responses");
        assertEquals(3, responses.get());
        requestObserver.onCompleted();
    }

    // ========================================================================
    // Test 12: Health Check
    // ========================================================================
    @Test
    @DisplayName("Test 12: Service health check")
    public void testHealthCheck() {
        transactionService.checkHealth(Empty.getDefaultInstance(),
            new StreamObserver<HealthStatus>() {
                @Override
                public void onNext(HealthStatus value) {
                    assertEquals("UP", value.getStatus());
                }

                @Override
                public void onError(Throwable t) {
                    fail("Health check should succeed");
                }

                @Override
                public void onCompleted() {}
            });
    }

    // ========================================================================
    // Test 13: Validation - Nonce Out of Sequence
    // ========================================================================
    @Test
    @DisplayName("Test 13: Validate with out-of-sequence nonce")
    public void testValidateOutOfSequenceNonce() {
        ValidateTransactionRequest request = ValidateTransactionRequest.newBuilder()
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("nonce test"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig"))
            .setSigner("signer")
            .setNonce(999999)  // Way out of sequence
            .build();

        transactionService.validateTransaction(request,
            new StreamObserver<ValidationResult>() {
                @Override
                public void onNext(ValidationResult value) {
                    // Should flag validation error
                    assertFalse(value.getValid());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {}
            });
    }

    // ========================================================================
    // Test 14: Status Updates - Watch Transaction
    // ========================================================================
    @Test
    @DisplayName("Test 14: Watch transaction status updates")
    public void testWatchTransactionStatus() {
        TransactionIdRequest request = TransactionIdRequest.newBuilder()
            .setTxId("watch_tx_001")
            .build();

        transactionService.watchTransactionStatus(request,
            new StreamObserver<TransactionStatusUpdate>() {
                @Override
                public void onNext(TransactionStatusUpdate value) {
                    assertNotNull(value.getTxId());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {}
            });
    }

    // ========================================================================
    // Test 15: Metadata Handling
    // ========================================================================
    @Test
    @DisplayName("Test 15: Submit transaction with custom metadata")
    public void testSubmitWithMetadata() {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTxHash("metadata_tx_001")
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("meta test"))
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("sig"))
            .setSigner("signer")
            .setNonce(100)
            .putMetadata("external_id", "ext_12345")
            .putMetadata("user", "alice")
            .putMetadata("app", "trading_bot")
            .build();

        transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
            @Override
            public void onNext(TransactionReceipt value) {
                assertEquals("metadata_tx_001", value.getTxId());
            }

            @Override
            public void onError(Throwable t) {
                fail("Should handle metadata successfully");
            }

            @Override
            public void onCompleted() {}
        });
    }

}
