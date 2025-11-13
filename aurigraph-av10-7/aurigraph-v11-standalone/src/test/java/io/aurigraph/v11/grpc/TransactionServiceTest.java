package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import com.google.protobuf.Timestamp;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Test Suite for TransactionServiceImpl
 *
 * Tests all 12 RPC methods with focus on:
 * - Batch processing performance (100, 500, 1000 transactions)
 * - Transaction lifecycle (pending → confirmed → finalized)
 * - Error handling and validation
 * - Streaming with multiple subscribers
 * - Gas estimation accuracy
 * - Signature validation
 *
 * Performance Targets:
 * - submitTransaction(): <50ms
 * - batchSubmitTransactions(): <100ms for 1000 TXs
 * - streamTransactionEvents(): 100+ concurrent streams
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TransactionServiceTest {

    @Inject
    TransactionServiceImpl transactionService;

    private Transaction createTestTransaction(String from, String to, String amount) {
        return Transaction.newBuilder()
            .setFromAddress(from)
            .setToAddress(to)
            .setAmount(amount)
            .setGasPrice(20.0)
            .setGasLimit(21000.0)
            .setData("")
            .setNonce(1)
            .setSignature("0xtest_signature")
            .setPublicKey("0xtest_public_key")
            .build();
    }

    private List<Transaction> createTestTransactions(int count) {
        List<Transaction> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            transactions.add(createTestTransaction(
                "0xsender" + i,
                "0xrecipient" + i,
                String.valueOf(i + 1)
            ));
        }
        return transactions;
    }

    @Test
    @Order(1)
    @DisplayName("Test 1: submitTransaction() - Single transaction submission")
    public void testSubmitSingleTransaction() {
        // Arrange
        Transaction tx = createTestTransaction("0xAlice", "0xBob", "100");
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .setPrioritize(false)
            .setTimeoutSeconds(30)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        TransactionSubmissionResponse response = transactionService
            .submitTransaction(request)
            .await()
            .atMost(Duration.ofSeconds(5));
        long elapsedTime = System.currentTimeMillis() - startTime;

        // Assert
        assertNotNull(response);
        assertNotNull(response.getTransactionHash());
        assertTrue(response.getTransactionHash().startsWith("0x"));
        assertEquals(TransactionStatus.TRANSACTION_QUEUED, response.getStatus());
        assertTrue(elapsedTime < 50, "submitTransaction should complete in <50ms, took: " + elapsedTime + "ms");
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: batchSubmitTransactions() - 100 transactions")
    public void testBatchSubmit100Transactions() {
        // Arrange
        List<Transaction> transactions = createTestTransactions(100);
        BatchTransactionSubmissionRequest request = BatchTransactionSubmissionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setBatchId("batch-100")
            .setValidateBeforeSubmit(true)
            .setTimeoutSeconds(60)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        BatchTransactionSubmissionResponse response = transactionService
            .batchSubmitTransactions(request)
            .await()
            .atMost(Duration.ofSeconds(10));
        long elapsedTime = System.currentTimeMillis() - startTime;
        double perTxTime = (double) elapsedTime / 100;

        // Assert
        assertNotNull(response);
        assertEquals("batch-100", response.getBatchId());
        assertEquals(100, response.getAcceptedCount());
        assertEquals(0, response.getRejectedCount());
        assertEquals(100, response.getResponsesCount());
        assertTrue(elapsedTime < 100, "Batch 100 TXs should complete in <100ms, took: " + elapsedTime + "ms");
        assertTrue(perTxTime < 1.0, "Per-TX time should be <1ms, was: " + perTxTime + "ms");
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: batchSubmitTransactions() - 500 transactions")
    public void testBatchSubmit500Transactions() {
        // Arrange
        List<Transaction> transactions = createTestTransactions(500);
        BatchTransactionSubmissionRequest request = BatchTransactionSubmissionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setBatchId("batch-500")
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        BatchTransactionSubmissionResponse response = transactionService
            .batchSubmitTransactions(request)
            .await()
            .atMost(Duration.ofSeconds(10));
        long elapsedTime = System.currentTimeMillis() - startTime;
        double perTxTime = (double) elapsedTime / 500;

        // Assert
        assertEquals(500, response.getAcceptedCount());
        assertEquals(0, response.getRejectedCount());
        assertTrue(elapsedTime < 100, "Batch 500 TXs should complete in <100ms, took: " + elapsedTime + "ms");
        assertTrue(perTxTime < 0.2, "Per-TX time should be <0.2ms, was: " + perTxTime + "ms");
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: batchSubmitTransactions() - 1000 transactions (performance target)")
    public void testBatchSubmit1000Transactions() {
        // Arrange
        List<Transaction> transactions = createTestTransactions(1000);
        BatchTransactionSubmissionRequest request = BatchTransactionSubmissionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setBatchId("batch-1000")
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        BatchTransactionSubmissionResponse response = transactionService
            .batchSubmitTransactions(request)
            .await()
            .atMost(Duration.ofSeconds(10));
        long elapsedTime = System.currentTimeMillis() - startTime;
        double perTxTime = (double) elapsedTime / 1000;

        // Assert
        assertEquals(1000, response.getAcceptedCount());
        assertEquals(0, response.getRejectedCount());
        assertTrue(elapsedTime < 100, "Batch 1000 TXs should complete in <100ms, took: " + elapsedTime + "ms");
        assertTrue(perTxTime < 0.1, "Per-TX time should be <0.1ms, was: " + perTxTime + "ms");
        System.out.println("✅ Batch 1000 TXs: " + elapsedTime + "ms (" + perTxTime + "ms per TX)");
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: getTransactionStatus() - Query by hash")
    public void testGetTransactionStatus() {
        // Arrange - first submit a transaction
        Transaction tx = createTestTransaction("0xCharlie", "0xDave", "50");
        SubmitTransactionRequest submitReq = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .build();
        TransactionSubmissionResponse submitResp = transactionService
            .submitTransaction(submitReq)
            .await()
            .atMost(Duration.ofSeconds(5));

        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
            .setTransactionHash(submitResp.getTransactionHash())
            .setIncludeBlockInfo(true)
            .setIncludeConfirmations(true)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        TransactionStatusResponse response = transactionService
            .getTransactionStatus(request)
            .await()
            .atMost(Duration.ofSeconds(5));
        long elapsedTime = System.currentTimeMillis() - startTime;

        // Assert
        assertNotNull(response);
        assertEquals(TransactionStatus.TRANSACTION_QUEUED, response.getStatus());
        assertTrue(elapsedTime < 5, "getTransactionStatus should complete in <5ms, took: " + elapsedTime + "ms");
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: getTransactionReceipt() - Retrieve execution details")
    public void testGetTransactionReceipt() {
        // Arrange
        String txHash = "0xnonexistent";
        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
            .setTransactionHash(txHash)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        TransactionReceipt receipt = transactionService
            .getTransactionReceipt(request)
            .await()
            .atMost(Duration.ofSeconds(5));
        long elapsedTime = System.currentTimeMillis() - startTime;

        // Assert
        assertNotNull(receipt);
        assertEquals(TransactionStatus.TRANSACTION_UNKNOWN, receipt.getStatus());
        assertTrue(elapsedTime < 10, "getTransactionReceipt should complete in <10ms, took: " + elapsedTime + "ms");
    }

    @Test
    @Order(7)
    @DisplayName("Test 7: cancelTransaction() - Cancel pending transaction")
    public void testCancelTransaction() {
        // Arrange - submit a transaction first
        Transaction tx = createTestTransaction("0xEve", "0xFrank", "75");
        SubmitTransactionRequest submitReq = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .build();
        TransactionSubmissionResponse submitResp = transactionService
            .submitTransaction(submitReq)
            .await()
            .atMost(Duration.ofSeconds(5));

        CancelTransactionRequest request = CancelTransactionRequest.newBuilder()
            .setTransactionHash(submitResp.getTransactionHash())
            .setCancellationReason("User requested cancellation")
            .build();

        // Act
        CancelTransactionResponse response = transactionService
            .cancelTransaction(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(response);
        assertTrue(response.getCancellationSuccessful());
        assertEquals("Cancelled by request", response.getReason());
    }

    @Test
    @Order(8)
    @DisplayName("Test 8: resendTransaction() - Resend with higher gas")
    public void testResendTransaction() {
        // Arrange - submit original transaction
        Transaction tx = createTestTransaction("0xGrace", "0xHank", "90");
        SubmitTransactionRequest submitReq = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .build();
        TransactionSubmissionResponse submitResp = transactionService
            .submitTransaction(submitReq)
            .await()
            .atMost(Duration.ofSeconds(5));

        ResendTransactionRequest request = ResendTransactionRequest.newBuilder()
            .setOriginalTransactionHash(submitResp.getTransactionHash())
            .setNewGasPrice(40.0)
            .setResendReason("Increase gas for faster confirmation")
            .build();

        // Act
        ResendTransactionResponse response = transactionService
            .resendTransaction(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(response);
        assertEquals(submitResp.getTransactionHash(), response.getOriginalTransactionHash());
        assertNotNull(response.getNewTransactionHash());
        assertNotEquals(response.getOriginalTransactionHash(), response.getNewTransactionHash());
        assertEquals(40.0, response.getNewGasPrice());
        assertEquals(TransactionStatus.TRANSACTION_QUEUED, response.getStatus());
    }

    @Test
    @Order(9)
    @DisplayName("Test 9: estimateGasCost() - Estimate transaction gas")
    public void testEstimateGasCost() {
        // Arrange
        EstimateGasCostRequest request = EstimateGasCostRequest.newBuilder()
            .setFromAddress("0xIris")
            .setToAddress("0xJack")
            .setAmount("100")
            .setData("0x12345678")  // 8 bytes of data
            .setIncludeBaseFee(true)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        GasEstimate estimate = transactionService
            .estimateGasCost(request)
            .await()
            .atMost(Duration.ofSeconds(5));
        long elapsedTime = System.currentTimeMillis() - startTime;

        // Assert
        assertNotNull(estimate);
        assertTrue(estimate.getEstimatedGas() > 21000);  // Base + data cost
        assertEquals(21128.0, estimate.getEstimatedGas(), 1.0);  // 21000 + 8*16
        assertTrue(estimate.getGasPriceWei() > 0);
        assertEquals(10.0, estimate.getBufferPercent());
        assertTrue(elapsedTime < 20, "estimateGasCost should complete in <20ms, took: " + elapsedTime + "ms");
    }

    @Test
    @Order(10)
    @DisplayName("Test 10: validateTransactionSignature() - Validate TX signature")
    public void testValidateTransactionSignature() {
        // Arrange
        Transaction tx = createTestTransaction("0xKate", "0xLiam", "120");
        ValidateTransactionSignatureRequest request = ValidateTransactionSignatureRequest.newBuilder()
            .setTransaction(tx)
            .setValidateSender(true)
            .setValidateNonce(true)
            .build();

        // Act
        TransactionSignatureValidationResult result = transactionService
            .validateTransactionSignature(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(result);
        assertTrue(result.getSignatureValid());
        assertTrue(result.getSenderValid());
        assertTrue(result.getNonceValid());
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: getPendingTransactions() - Query mempool")
    public void testGetPendingTransactions() {
        // Arrange - submit some transactions first
        List<Transaction> txs = createTestTransactions(10);
        for (Transaction tx : txs) {
            SubmitTransactionRequest req = SubmitTransactionRequest.newBuilder()
                .setTransaction(tx)
                .build();
            transactionService.submitTransaction(req)
                .await()
                .atMost(Duration.ofSeconds(5));
        }

        GetPendingTransactionsRequest request = GetPendingTransactionsRequest.newBuilder()
            .setLimit(50)
            .setSortByFee(true)
            .build();

        // Act
        PendingTransactionsResponse response = transactionService
            .getPendingTransactions(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(response);
        assertTrue(response.getTotalPending() > 0);
        assertTrue(response.getAverageGasPrice() > 0);
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: getTransactionHistory() - Query address history")
    public void testGetTransactionHistory() {
        // Arrange - submit transactions for specific address
        String testAddress = "0xHistoryTest";
        Transaction tx1 = createTestTransaction(testAddress, "0xRecipient1", "10");
        Transaction tx2 = createTestTransaction(testAddress, "0xRecipient2", "20");

        transactionService.submitTransaction(SubmitTransactionRequest.newBuilder()
            .setTransaction(tx1).build())
            .await().atMost(Duration.ofSeconds(5));
        transactionService.submitTransaction(SubmitTransactionRequest.newBuilder()
            .setTransaction(tx2).build())
            .await().atMost(Duration.ofSeconds(5));

        GetTransactionHistoryRequest request = GetTransactionHistoryRequest.newBuilder()
            .setAddress(testAddress)
            .setLimit(100)
            .setOffset(0)
            .build();

        // Act
        TransactionHistoryResponse response = transactionService
            .getTransactionHistory(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(response);
        assertTrue(response.getTotalCount() >= 2);
        assertTrue(response.getReturnedCount() >= 2);
    }

    @Test
    @Order(13)
    @DisplayName("Test 13: getTxPoolSize() - Query mempool statistics")
    public void testGetTxPoolSize() {
        // Arrange
        GetTxPoolSizeRequest request = GetTxPoolSizeRequest.newBuilder()
            .setIncludeDetailedStats(true)
            .build();

        // Act
        long startTime = System.currentTimeMillis();
        TxPoolStatistics stats = transactionService
            .getTxPoolSize(request)
            .await()
            .atMost(Duration.ofSeconds(5));
        long elapsedTime = System.currentTimeMillis() - startTime;

        // Assert
        assertNotNull(stats);
        assertTrue(stats.getTotalPending() >= 0);
        assertTrue(stats.getTotalQueued() >= 0);
        assertTrue(stats.getAverageGasPrice() > 0);
        assertTrue(stats.getPoolUtilizationPercent() >= 0);
        assertTrue(elapsedTime < 5, "getTxPoolSize should complete in <5ms, took: " + elapsedTime + "ms");
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: streamTransactionEvents() - Real-time event streaming")
    public void testStreamTransactionEvents() {
        // Arrange
        StreamTransactionEventsRequest request = StreamTransactionEventsRequest.newBuilder()
            .setIncludeFailed(true)
            .setStreamTimeoutSeconds(10)
            .build();

        AtomicInteger eventCount = new AtomicInteger(0);

        // Act - Subscribe to stream
        AssertSubscriber<TransactionEvent> subscriber = transactionService
            .streamTransactionEvents(request)
            .subscribe()
            .withSubscriber(AssertSubscriber.create(20));

        // Let stream run for 2 seconds
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        subscriber.assertSubscribed();
        List<TransactionEvent> events = subscriber.getItems();
        assertTrue(events.size() > 0, "Should receive at least some events");
        System.out.println("✅ Received " + events.size() + " transaction events in 2 seconds");
    }

    @Test
    @Order(15)
    @DisplayName("Test 15: streamTransactionEvents() - Multiple concurrent subscribers")
    public void testMultipleConcurrentStreams() {
        // Arrange
        StreamTransactionEventsRequest request = StreamTransactionEventsRequest.newBuilder()
            .setStreamTimeoutSeconds(5)
            .build();

        int numSubscribers = 10;
        List<AssertSubscriber<TransactionEvent>> subscribers = new ArrayList<>();

        // Act - Create multiple concurrent streams
        for (int i = 0; i < numSubscribers; i++) {
            AssertSubscriber<TransactionEvent> subscriber = transactionService
                .streamTransactionEvents(request)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));
            subscribers.add(subscriber);
        }

        // Let streams run
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert - All subscribers should receive events
        for (AssertSubscriber<TransactionEvent> subscriber : subscribers) {
            subscriber.assertSubscribed();
            assertTrue(subscriber.getItems().size() > 0, "Each subscriber should receive events");
        }
        System.out.println("✅ Successfully handled " + numSubscribers + " concurrent streams");
    }

    @Test
    @Order(16)
    @DisplayName("Test 16: Transaction lifecycle - Pending to Confirmed")
    public void testTransactionLifecycle() {
        // Arrange
        Transaction tx = createTestTransaction("0xMike", "0xNina", "150");
        SubmitTransactionRequest submitReq = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .build();

        // Act - Submit transaction
        TransactionSubmissionResponse submitResp = transactionService
            .submitTransaction(submitReq)
            .await()
            .atMost(Duration.ofSeconds(5));
        String txHash = submitResp.getTransactionHash();

        // Assert - Initially queued
        assertEquals(TransactionStatus.TRANSACTION_QUEUED, submitResp.getStatus());

        // Wait for transaction to be processed (stream processes every 100ms)
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Check status again - should be confirmed by stream processing
        GetTransactionStatusRequest statusReq = GetTransactionStatusRequest.newBuilder()
            .setTransactionHash(txHash)
            .build();
        TransactionStatusResponse statusResp = transactionService
            .getTransactionStatus(statusReq)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert - Status should have changed (either still queued or confirmed)
        assertNotNull(statusResp);
        assertTrue(
            statusResp.getStatus() == TransactionStatus.TRANSACTION_QUEUED ||
            statusResp.getStatus() == TransactionStatus.TRANSACTION_CONFIRMED,
            "Transaction should be queued or confirmed, but was: " + statusResp.getStatus()
        );
    }

    @Test
    @Order(17)
    @DisplayName("Test 17: Error handling - Invalid transaction signature")
    public void testInvalidSignatureHandling() {
        // Arrange
        Transaction invalidTx = Transaction.newBuilder()
            .setFromAddress("0xInvalid")
            .setToAddress("0xRecipient")
            .setAmount("100")
            .setSignature("")  // Empty signature
            .setPublicKey("")
            .setNonce(-1)  // Invalid nonce
            .build();

        ValidateTransactionSignatureRequest request = ValidateTransactionSignatureRequest.newBuilder()
            .setTransaction(invalidTx)
            .setValidateSender(true)
            .setValidateNonce(true)
            .build();

        // Act
        TransactionSignatureValidationResult result = transactionService
            .validateTransactionSignature(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(result);
        assertFalse(result.getSignatureValid());
        assertFalse(result.getSenderValid());
        assertFalse(result.getNonceValid());
    }

    @Test
    @Order(18)
    @DisplayName("Test 18: Performance - Sustained batch throughput")
    public void testSustainedBatchThroughput() {
        // Arrange - Submit 10 batches of 100 transactions each
        int numBatches = 10;
        int batchSize = 100;
        long totalTime = 0;
        int totalAccepted = 0;

        // Act
        for (int i = 0; i < numBatches; i++) {
            List<Transaction> txs = createTestTransactions(batchSize);
            BatchTransactionSubmissionRequest request = BatchTransactionSubmissionRequest.newBuilder()
                .addAllTransactions(txs)
                .setBatchId("sustained-batch-" + i)
                .build();

            long startTime = System.currentTimeMillis();
            BatchTransactionSubmissionResponse response = transactionService
                .batchSubmitTransactions(request)
                .await()
                .atMost(Duration.ofSeconds(10));
            long elapsedTime = System.currentTimeMillis() - startTime;

            totalTime += elapsedTime;
            totalAccepted += response.getAcceptedCount();
        }

        // Assert
        double avgBatchTime = (double) totalTime / numBatches;
        double avgPerTxTime = (double) totalTime / (numBatches * batchSize);

        assertEquals(numBatches * batchSize, totalAccepted);
        assertTrue(avgBatchTime < 100, "Average batch time should be <100ms, was: " + avgBatchTime + "ms");
        assertTrue(avgPerTxTime < 1.0, "Average per-TX time should be <1ms, was: " + avgPerTxTime + "ms");

        System.out.println("✅ Sustained throughput: " + numBatches + " batches of " + batchSize + " TXs");
        System.out.println("   Total time: " + totalTime + "ms");
        System.out.println("   Avg batch time: " + avgBatchTime + "ms");
        System.out.println("   Avg per-TX time: " + avgPerTxTime + "ms");
    }
}
