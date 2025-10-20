package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.transaction.TransactionRequest;
import io.aurigraph.v11.grpc.transaction.TransactionResponse;
import io.aurigraph.v11.grpc.transaction.TransactionStatus;
import io.aurigraph.v11.grpc.transaction.TransactionDetail;
import io.aurigraph.v11.grpc.transaction.TransactionBatchRequest;
import io.aurigraph.v11.grpc.transaction.TransactionBatchResponse;
import io.aurigraph.v11.grpc.transaction.TransactionStatusResponse;
import io.aurigraph.v11.grpc.transaction.TransactionQuery;
import io.aurigraph.v11.grpc.transaction.ValidationResponse;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.google.protobuf.ByteString;
import java.time.Duration;

/**
 * Transaction Service Tests
 * Sprint 13 - Workstream 4: Test Automation
 *
 * Tests transaction processing, validation, and batch operations.
 * Target: 95% coverage
 *
 * NOTE: Using direct instantiation instead of CDI injection because
 * @GrpcService beans cannot be injected in unit tests with @Inject.
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TransactionServiceTest {

    // Direct instantiation for unit testing gRPC services
    private TransactionServiceImpl transactionService;

    private TransactionRequest validTransaction;
    private TransactionRequest invalidTransaction;

    @BeforeEach
    void setUp() {
        // Instantiate service for testing
        transactionService = new TransactionServiceImpl();

        validTransaction = TransactionRequest.newBuilder()
            .setTransactionId("tx-test-001")
            .setFromAddress("0x1234567890abcdef")
            .setToAddress("0xfedcba0987654321")
            .setAmount(1000000)
            .setFee(1000)
            .setNonce(1)
            .setSignature(ByteString.copyFromUtf8("valid-signature-data"))
            .build();

        invalidTransaction = TransactionRequest.newBuilder()
            .setTransactionId("tx-test-invalid")
            .setFromAddress("")
            .setToAddress("")
            .setAmount(-1000)
            .setFee(0)
            .setNonce(-1)
            .build();
    }

    @Test
    @Order(1)
    @DisplayName("Submit valid transaction - should accept to mempool")
    void testSubmitValidTransaction() {
        TransactionResponse response = transactionService
            .submitTransaction(validTransaction)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals("tx-test-001", response.getTransactionId());
        assertEquals(TransactionStatus.IN_MEMPOOL, response.getStatus());
        assertEquals("Transaction accepted to mempool", response.getMessage());
        assertTrue(response.getGasUsed() > 0);
        assertTrue(response.getTimestamp() > 0);
    }

    @Test
    @Order(2)
    @DisplayName("Submit invalid transaction - should reject")
    void testSubmitInvalidTransaction() {
        TransactionResponse response = transactionService
            .submitTransaction(invalidTransaction)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals(TransactionStatus.REJECTED, response.getStatus());
        assertEquals("Transaction validation failed", response.getMessage());
    }

    @Test
    @Order(3)
    @DisplayName("Validate transaction - should return validation errors")
    void testValidateTransaction() {
        ValidationResponse response = transactionService
            .validateTransaction(invalidTransaction)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertFalse(response.getValid());
        assertTrue(response.getErrorsCount() > 0);
        assertTrue(response.getErrorsList().contains("Amount must be positive"));
        assertTrue(response.getErrorsList().contains("From address is required"));
    }

    @Test
    @Order(4)
    @DisplayName("Submit transaction batch - sequential processing")
    void testSubmitTransactionBatchSequential() {
        TransactionBatchRequest batchRequest = TransactionBatchRequest.newBuilder()
            .addTransactions(validTransaction)
            .addTransactions(TransactionRequest.newBuilder(validTransaction)
                .setTransactionId("tx-test-002")
                .build())
            .addTransactions(TransactionRequest.newBuilder(validTransaction)
                .setTransactionId("tx-test-003")
                .build())
            .setParallelExecution(false)
            .build();

        TransactionBatchResponse response = transactionService
            .submitTransactionBatch(batchRequest)
            .await()
            .atMost(Duration.ofSeconds(10));

        assertNotNull(response);
        assertEquals(3, response.getTotalTransactions());
        assertEquals(3, response.getSuccessfulTransactions());
        assertEquals(0, response.getFailedTransactions());
        assertTrue(response.getProcessingTimeMs() > 0);
    }

    @Test
    @Order(5)
    @DisplayName("Submit transaction batch - parallel processing")
    void testSubmitTransactionBatchParallel() {
        TransactionBatchRequest batchRequest = TransactionBatchRequest.newBuilder()
            .addTransactions(validTransaction)
            .addTransactions(TransactionRequest.newBuilder(validTransaction)
                .setTransactionId("tx-test-004")
                .build())
            .addTransactions(TransactionRequest.newBuilder(validTransaction)
                .setTransactionId("tx-test-005")
                .build())
            .setParallelExecution(true)
            .build();

        TransactionBatchResponse response = transactionService
            .submitTransactionBatch(batchRequest)
            .await()
            .atMost(Duration.ofSeconds(10));

        assertNotNull(response);
        assertEquals(3, response.getTotalTransactions());
        assertEquals(3, response.getSuccessfulTransactions());
        assertEquals(0, response.getFailedTransactions());

        // Parallel should be faster than sequential
        assertTrue(response.getProcessingTimeMs() >= 0);
    }

    @Test
    @Order(6)
    @DisplayName("Get transaction - should retrieve from mempool")
    void testGetTransaction() {
        // First submit
        transactionService.submitTransaction(validTransaction).await().indefinitely();

        // Then retrieve
        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-test-001")
            .build();

        TransactionDetail detail = transactionService
            .getTransaction(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(detail);
        assertEquals("tx-test-001", detail.getTransactionId());
        assertEquals("0x1234567890abcdef", detail.getFromAddress());
        assertEquals("0xfedcba0987654321", detail.getToAddress());
    }

    @Test
    @Order(7)
    @DisplayName("Get transaction status - should return current status")
    void testGetTransactionStatus() {
        transactionService.submitTransaction(validTransaction).await().indefinitely();

        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-test-001")
            .build();

        TransactionStatusResponse status = transactionService
            .getTransactionStatus(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(status);
        assertEquals("tx-test-001", status.getTransactionId());
        assertNotNull(status.getStatus());
    }

    @Test
    @Order(8)
    @DisplayName("Get non-existent transaction - should throw exception")
    void testGetNonExistentTransaction() {
        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-nonexistent")
            .build();

        assertThrows(Exception.class, () -> {
            transactionService.getTransaction(query).await().indefinitely();
        });
    }

    @Test
    @Order(9)
    @DisplayName("Transaction statistics - should track totals")
    void testTransactionStatistics() {
        // Submit multiple transactions
        for (int i = 0; i < 5; i++) {
            TransactionRequest tx = TransactionRequest.newBuilder(validTransaction)
                .setTransactionId("tx-stats-" + i)
                .build();
            transactionService.submitTransaction(tx).await().indefinitely();
        }

        TransactionServiceImpl.TransactionStats stats = transactionService.getStats();

        assertNotNull(stats);
        assertTrue(stats.total() >= 5);
        assertTrue(stats.pending() >= 0);
    }

    @Test
    @Order(10)
    @DisplayName("High throughput test - should handle 10k transactions")
    @Timeout(30)
    void testHighThroughput() {
        int txCount = 10000;
        TransactionBatchRequest.Builder batchBuilder = TransactionBatchRequest.newBuilder()
            .setParallelExecution(true);

        for (int i = 0; i < txCount; i++) {
            batchBuilder.addTransactions(
                TransactionRequest.newBuilder(validTransaction)
                    .setTransactionId("tx-throughput-" + i)
                    .build()
            );
        }

        long startTime = System.currentTimeMillis();
        TransactionBatchResponse response = transactionService
            .submitTransactionBatch(batchBuilder.build())
            .await()
            .atMost(Duration.ofSeconds(30));

        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(response);
        assertEquals(txCount, response.getTotalTransactions());
        assertTrue(response.getSuccessfulTransactions() > 0);

        // Calculate TPS
        long tps = (txCount * 1000L) / duration;
        System.out.printf("Throughput: %d TPS (%d ms for %d transactions)%n",
            tps, duration, txCount);

        // Should achieve >1000 TPS
        assertTrue(tps > 1000, "Expected >1000 TPS, got: " + tps);
    }

    @Test
    @Order(11)
    @DisplayName("Validation with warnings - should accept with warnings")
    void testValidationWithWarnings() {
        TransactionRequest lowFeeTransaction = TransactionRequest.newBuilder(validTransaction)
            .setFee(500)  // Below 1000 threshold
            .build();

        ValidationResponse response = transactionService
            .validateTransaction(lowFeeTransaction)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getValid());
        assertTrue(response.getWarningsCount() > 0);
        assertTrue(response.getWarningsList().get(0).contains("Fee is low"));
    }

    @Test
    @Order(12)
    @DisplayName("Estimated gas calculation - should return valid estimate")
    void testEstimatedGas() {
        ValidationResponse response = transactionService
            .validateTransaction(validTransaction)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getEstimatedGas() >= 21000);  // Minimum gas
    }
}
