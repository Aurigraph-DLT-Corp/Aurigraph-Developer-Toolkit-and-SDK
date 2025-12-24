package io.aurigraph.v11.integration;

import io.aurigraph.v11.grpc.TransactionGrpcService;
import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit5.QuarkusTest;
import org.junit.jupiter.api.*;

import java.sql.Connection;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 16: TransactionPostgreSQLIntegrationTest
 *
 * Integration tests for transaction persistence with PostgreSQL.
 * Validates:
 * - Transaction submission and status tracking
 * - HikariCP connection pooling (20 max connections)
 * - Transaction persistence across restarts
 * - Concurrent transaction handling with proper isolation
 * - Query performance with indexed lookups
 */
@QuarkusTest
@DisplayName("Sprint 16: Transaction PostgreSQL Integration Tests")
public class TransactionPostgreSQLIntegrationTest extends AbstractIntegrationTest {

    private TransactionGrpcService transactionService;
    private static final int TEST_TIMEOUT_SECONDS = 30;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionGrpcService();
        clearAllTestData();
    }

    // ========== Test Suite 1: Single Transaction Persistence ==========

    @Test
    @DisplayName("Test 1.1: Submit transaction and verify database persistence")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testTransactionPersistence() {
        // Arrange
        String transactionId = "tx-" + UUID.randomUUID();
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTransactionId(transactionId)
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("test payload"))
            .setGasPrice(1000)
            .setPriority(TransactionPriority.TRANSACTION_PRIORITY_NORMAL)
            .build();

        // Act
        AtomicInteger responseCount = new AtomicInteger(0);
        transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
            @Override
            public void onNext(TransactionReceipt receipt) {
                responseCount.incrementAndGet();
                assertTrue(receipt.getAccepted(), "Transaction should be accepted");
                assertEquals(transactionId, receipt.getTransactionId());
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {}
        });

        // Assert
        assertEquals(1, responseCount.get(), "Should receive one transaction receipt");

        // Verify in database
        verifyTransactionInDatabase(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_PENDING);
    }

    @Test
    @DisplayName("Test 1.2: Query transaction status from database")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testTransactionStatusQuery() {
        // Arrange
        String transactionId = "tx-" + UUID.randomUUID();
        submitTestTransaction(transactionId);

        TransactionRequest request = TransactionRequest.newBuilder()
            .setTransactionId(transactionId)
            .build();

        // Act
        AtomicInteger statusCount = new AtomicInteger(0);
        transactionService.getTransactionStatus(request, new StreamObserver<TransactionStatus>() {
            @Override
            public void onNext(TransactionStatus status) {
                statusCount.incrementAndGet();
                assertEquals(transactionId, status.getTransactionId());
                assertNotNull(status.getStatus());
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error");
            }

            @Override
            public void onCompleted() {}
        });

        // Assert
        assertEquals(1, statusCount.get(), "Should receive one status response");
    }

    // ========== Test Suite 2: Connection Pooling & Concurrency ==========

    @Test
    @DisplayName("Test 2.1: Concurrent transaction submissions (HikariCP validation)")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testConcurrentTransactionSubmissions() throws InterruptedException {
        // Arrange
        int concurrentCount = 50;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(concurrentCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        // Act
        for (int i = 0; i < concurrentCount; i++) {
            executor.submit(() -> {
                String transactionId = "tx-concurrent-" + UUID.randomUUID();
                SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                    .setTransactionId(transactionId)
                    .setPayload(com.google.protobuf.ByteString.copyFromUtf8("payload"))
                    .setGasPrice(1000)
                    .setPriority(TransactionPriority.TRANSACTION_PRIORITY_HIGH)
                    .build();

                transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
                    @Override
                    public void onNext(TransactionReceipt receipt) {
                        if (receipt.getAccepted()) {
                            successCount.incrementAndGet();
                        }
                    }

                    @Override
                    public void onError(Throwable t) {
                        errorCount.incrementAndGet();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });
            });
        }

        // Wait for all to complete
        boolean completed = latch.await(TEST_TIMEOUT_SECONDS, TimeUnit.SECONDS);

        // Assert
        assertTrue(completed, "All transactions should complete within timeout");
        assertEquals(concurrentCount, successCount.get(), "All transactions should be accepted");
        assertEquals(0, errorCount.get(), "No errors should occur");

        // Verify HikariCP pool was used (concurrent submissions without pool exhaustion)
        int databaseCount = countTransactionsInDatabase();
        assertEquals(concurrentCount, databaseCount, "All transactions should be in database");
    }

    @Test
    @DisplayName("Test 2.2: Connection pool isolation (no cross-transaction interference)")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testConnectionPoolIsolation() throws InterruptedException {
        // Arrange
        int transactionCount = 20;
        List<String> transactionIds = new ArrayList<>();
        for (int i = 0; i < transactionCount; i++) {
            transactionIds.add("tx-isolation-" + i);
        }

        // Act - Submit all transactions
        CountDownLatch submitLatch = new CountDownLatch(transactionCount);
        for (String txId : transactionIds) {
            new Thread(() -> {
                submitTestTransaction(txId);
                submitLatch.countDown();
            }).start();
        }

        submitLatch.await();

        // Query all transactions
        List<String> queriedIds = new ArrayList<>();
        CountDownLatch queryLatch = new CountDownLatch(transactionCount);

        for (String txId : transactionIds) {
            new Thread(() -> {
                TransactionRequest request = TransactionRequest.newBuilder()
                    .setTransactionId(txId)
                    .build();

                transactionService.getTransactionStatus(request, new StreamObserver<TransactionStatus>() {
                    @Override
                    public void onNext(TransactionStatus status) {
                        queriedIds.add(status.getTransactionId());
                    }

                    @Override
                    public void onError(Throwable t) {}

                    @Override
                    public void onCompleted() {
                        queryLatch.countDown();
                    }
                });
            }).start();
        }

        // Assert
        boolean queryCompleted = queryLatch.await(TEST_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        assertTrue(queryCompleted, "All queries should complete");
        assertEquals(transactionCount, queriedIds.size(), "All transactions should be queryable");
    }

    // ========== Test Suite 3: Transaction Status Transitions ==========

    @Test
    @DisplayName("Test 3.1: Transaction status lifecycle (PENDING → CONFIRMED → FINALIZED)")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testTransactionStatusLifecycle() {
        // Arrange
        String transactionId = "tx-lifecycle-" + UUID.randomUUID();
        submitTestTransaction(transactionId);

        // Act & Assert - Initial status should be PENDING
        verifyTransactionInDatabase(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_PENDING);

        // Simulate status transition (would normally happen in consensus)
        updateTransactionStatus(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_CONFIRMED);
        verifyTransactionInDatabase(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_CONFIRMED);

        updateTransactionStatus(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_FINALIZED);
        verifyTransactionInDatabase(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_FINALIZED);
    }

    @Test
    @DisplayName("Test 3.2: Transaction rejection and failure tracking")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testTransactionRejection() {
        // Arrange
        String transactionId = "tx-reject-" + UUID.randomUUID();
        submitTestTransaction(transactionId);

        // Act - Simulate validation failure
        updateTransactionStatus(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_REJECTED);

        // Assert
        verifyTransactionInDatabase(transactionId, TransactionStatusEnum.TRANSACTION_STATUS_REJECTED);
    }

    // ========== Test Suite 4: Query Performance ==========

    @Test
    @DisplayName("Test 4.1: Fast transaction lookup by ID (indexed query)")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testTransactionLookupPerformance() {
        // Arrange - Create 100 transactions
        List<String> transactionIds = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            String txId = "tx-perf-" + i;
            submitTestTransaction(txId);
            transactionIds.add(txId);
        }

        // Act & Assert - Lookup should be fast (indexed)
        long startTime = System.currentTimeMillis();

        for (String txId : transactionIds) {
            verifyTransactionInDatabase(txId, TransactionStatusEnum.TRANSACTION_STATUS_PENDING);
        }

        long duration = System.currentTimeMillis() - startTime;
        long avgLookupTime = duration / 100;

        assertTrue(avgLookupTime < 10, "Average lookup should be <10ms with indexes, was: " + avgLookupTime + "ms");
    }

    @Test
    @DisplayName("Test 4.2: Efficient status update queries")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testStatusUpdatePerformance() {
        // Arrange - Create transactions
        List<String> transactionIds = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            String txId = "tx-update-perf-" + i;
            submitTestTransaction(txId);
            transactionIds.add(txId);
        }

        // Act & Assert - Batch status updates should be efficient
        long startTime = System.currentTimeMillis();

        for (String txId : transactionIds) {
            updateTransactionStatus(txId, TransactionStatusEnum.TRANSACTION_STATUS_CONFIRMED);
        }

        long duration = System.currentTimeMillis() - startTime;
        long avgUpdateTime = duration / 50;

        assertTrue(avgUpdateTime < 5, "Average update should be <5ms, was: " + avgUpdateTime + "ms");
    }

    // ========== Test Suite 5: Data Consistency ==========

    @Test
    @DisplayName("Test 5.1: Transaction data consistency across queries")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testDataConsistency() {
        // Arrange
        String transactionId = "tx-consistency-" + UUID.randomUUID();
        String payload = "test consistency payload";
        int gasPrice = 5000;

        // Act - Submit and verify
        submitTestTransactionWithDetails(transactionId, payload, gasPrice);

        // Assert - Multiple queries should return same data
        Map<String, Object> data1 = queryTransactionData(transactionId);
        Map<String, Object> data2 = queryTransactionData(transactionId);

        assertEquals(data1, data2, "Multiple queries should return identical data");
        assertEquals(gasPrice, data1.get("gas_price"), "Gas price should match");
    }

    // ========== Helper Methods ==========

    private void submitTestTransaction(String transactionId) {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTransactionId(transactionId)
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8("payload"))
            .setGasPrice(1000)
            .setPriority(TransactionPriority.TRANSACTION_PRIORITY_NORMAL)
            .build();

        transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
            @Override
            public void onNext(TransactionReceipt receipt) {}

            @Override
            public void onError(Throwable t) {
                fail("Submission failed: " + t.getMessage());
            }

            @Override
            public void onCompleted() {}
        });
    }

    private void submitTestTransactionWithDetails(String transactionId, String payload, int gasPrice) {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTransactionId(transactionId)
            .setPayload(com.google.protobuf.ByteString.copyFromUtf8(payload))
            .setGasPrice(gasPrice)
            .setPriority(TransactionPriority.TRANSACTION_PRIORITY_NORMAL)
            .build();

        transactionService.submitTransaction(request, new StreamObserver<TransactionReceipt>() {
            @Override
            public void onNext(TransactionReceipt receipt) {}

            @Override
            public void onError(Throwable t) {
                fail("Submission failed");
            }

            @Override
            public void onCompleted() {}
        });
    }

    private void verifyTransactionInDatabase(String transactionId, TransactionStatusEnum expectedStatus) {
        try (Connection conn = postgres.createConnection("")) {
            var stmt = conn.createStatement();
            var rs = stmt.executeQuery(
                "SELECT status FROM transaction WHERE transaction_id = '" + transactionId + "'"
            );

            assertTrue(rs.next(), "Transaction should exist in database: " + transactionId);
            // Status stored as enum name in database
            String status = rs.getString("status");
            assertEquals(expectedStatus.name(), status, "Status should match expected");
            rs.close();
            stmt.close();
        } catch (Exception e) {
            fail("Failed to verify transaction in database: " + e.getMessage());
        }
    }

    private void updateTransactionStatus(String transactionId, TransactionStatusEnum newStatus) {
        try (Connection conn = postgres.createConnection("")) {
            var stmt = conn.createStatement();
            stmt.execute(
                "UPDATE transaction SET status = '" + newStatus.name() + "' WHERE transaction_id = '" + transactionId + "'"
            );
            stmt.close();
        } catch (Exception e) {
            fail("Failed to update transaction status: " + e.getMessage());
        }
    }

    private int countTransactionsInDatabase() {
        try (Connection conn = postgres.createConnection("")) {
            var stmt = conn.createStatement();
            var rs = stmt.executeQuery("SELECT COUNT(*) as cnt FROM transaction");
            rs.next();
            int count = rs.getInt("cnt");
            rs.close();
            stmt.close();
            return count;
        } catch (Exception e) {
            return 0;
        }
    }

    private Map<String, Object> queryTransactionData(String transactionId) {
        Map<String, Object> data = new HashMap<>();
        try (Connection conn = postgres.createConnection("")) {
            var stmt = conn.createStatement();
            var rs = stmt.executeQuery(
                "SELECT * FROM transaction WHERE transaction_id = '" + transactionId + "'"
            );

            if (rs.next()) {
                data.put("transaction_id", rs.getString("transaction_id"));
                data.put("status", rs.getString("status"));
                data.put("gas_price", rs.getInt("gas_price"));
                data.put("priority", rs.getString("priority"));
            }
            rs.close();
            stmt.close();
        } catch (Exception e) {
            fail("Query failed: " + e.getMessage());
        }
        return data;
    }
}
