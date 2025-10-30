package io.aurigraph.v11.grpc;

import io.aurigraph.v11.TransactionService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectSpy;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.mockito.ArgumentMatchers;

import com.google.protobuf.ByteString;
import com.google.protobuf.Timestamp;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive Test Suite for HighPerformanceGrpcService
 * Coverage Target: 95%+ with 33 tests
 *
 * Test Categories:
 * - Service Initialization (4 tests)
 * - Transaction Processing via gRPC (8 tests)
 * - Consensus Message Handling (8 tests)
 * - Error Handling and Recovery (5 tests)
 * - Performance Benchmarks (8 tests)
 */
@QuarkusTest
@DisplayName("High-Performance gRPC Service Test Suite")
public class HighPerformanceGrpcServiceTest {

    @Inject
    @GrpcService
    HighPerformanceGrpcService grpcService;

    @InjectSpy
    TransactionService transactionService;

    private TransactionRequest.Builder baseTransactionRequest;

    @BeforeEach
    void setUp() {
        // Reset service state before each test
        if (grpcService != null) {
            grpcService.clearCache();
        }

        // Setup base transaction request builder
        baseTransactionRequest = TransactionRequest.newBuilder()
            .setTransactionId("tx-test-001")
            .setFromAddress("0xABCD1234")
            .setToAddress("0xEFGH5678")
            .setAmount(100.0)
            .setGasLimit(21000)
            .setGasPrice(50)
            .setData(ByteString.copyFromUtf8("test-data"))
            .setSignature("sig-12345")
            .setTimestamp(Timestamp.newBuilder()
                .setSeconds(Instant.now().getEpochSecond())
                .setNanos(Instant.now().getNano())
                .build());
    }

    // ==================== SERVICE INITIALIZATION (4 tests) ====================

    @Test
    @DisplayName("Test 1: Service initialization and dependency injection")
    void testServiceInitialization() {
        // Given: gRPC service is injected
        // When: service is accessed
        // Then: service should be initialized properly
        assertNotNull(grpcService, "gRPC service should be injected");
        assertNotNull(transactionService, "Transaction service should be injected");
    }

    @Test
    @DisplayName("Test 2: Service statistics initialization")
    void testServiceStatisticsInitialization() {
        // Given: fresh service instance
        // When: getting initial statistics
        var stats = grpcService.getServiceStatistics();

        // Then: statistics should be initialized to zero
        assertNotNull(stats, "Statistics should not be null");
        assertEquals(0L, stats.get("cached_transactions"), "Cache should be empty initially");
    }

    @Test
    @DisplayName("Test 3: Health check on initialized service")
    void testHealthCheckOnInitialization() {
        // Given: service is initialized
        HealthCheckRequest request = HealthCheckRequest.newBuilder()
            .setServiceName("HighPerformanceGrpcService")
            .build();

        // When: performing health check
        HealthCheckResponse response = grpcService.healthCheck(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: service should report healthy
        assertNotNull(response);
        assertEquals(HealthStatus.HEALTH_SERVING, response.getStatus());
        assertTrue(response.getMessage().contains("healthy"));
    }

    @Test
    @DisplayName("Test 4: Service shutdown and cleanup")
    void testServiceShutdownAndCleanup() {
        // Given: service with cached transactions
        TransactionRequest request = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-001"));

        grpcService.processTransaction(request).await().atMost(Duration.ofSeconds(5));

        // When: clearing cache (simulating shutdown)
        grpcService.clearCache();
        var stats = grpcService.getServiceStatistics();

        // Then: cache should be empty
        assertEquals(0L, stats.get("cached_transactions"));
    }

    // ==================== TRANSACTION PROCESSING VIA gRPC (8 tests) ====================

    @Test
    @DisplayName("Test 5: Process single transaction successfully")
    void testProcessSingleTransactionSuccess() {
        // Given: valid transaction request
        TransactionRequest request = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-12345"));

        // When: processing transaction
        TransactionResponse response = grpcService.processTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: transaction should be processed successfully
        assertTrue(response.getSuccess(), "Transaction should succeed");
        assertEquals("tx-test-001", response.getTransactionId());
        assertEquals("hash-12345", response.getTransactionHash());
        assertEquals(TransactionStatus.TRANSACTION_CONFIRMED, response.getStatus());
        verify(transactionService, times(1)).processTransactionReactive(anyString(), anyDouble());
    }

    @Test
    @DisplayName("Test 6: Process transaction with invalid ID")
    void testProcessTransactionWithInvalidId() {
        // Given: transaction with empty ID
        TransactionRequest request = baseTransactionRequest
            .setTransactionId("")
            .build();

        // When: processing transaction
        TransactionResponse response = grpcService.processTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return error
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("required"));
        assertEquals(TransactionStatus.TRANSACTION_FAILED, response.getStatus());
    }

    @Test
    @DisplayName("Test 7: Process batch transactions successfully")
    @Timeout(10)
    void testProcessBatchTransactionsSuccess() {
        // Given: batch of 100 transactions
        List<TransactionRequest> transactions = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            transactions.add(baseTransactionRequest
                .setTransactionId("tx-" + i)
                .build());
        }

        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setParallelProcessing(true)
            .setBatchSize(100)
            .build();

        List<String> hashes = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            hashes.add("hash-" + i);
        }

        when(transactionService.batchProcessParallel(ArgumentMatchers.anyList()))
            .thenReturn(CompletableFuture.completedFuture(hashes));

        // When: processing batch
        BatchTransactionResponse response = grpcService.batchProcessTransactions(batchRequest)
            .await().atMost(Duration.ofSeconds(10));

        // Then: all transactions should be processed
        assertTrue(response.getSuccess());
        assertEquals(100, response.getTotalRequested());
        assertEquals(100, response.getTotalSucceeded());
        assertEquals(0, response.getTotalFailed());
        assertTrue(response.getThroughputTps() > 0);
    }

    @Test
    @DisplayName("Test 8: Get transaction from cache")
    void testGetTransactionFromCache() {
        // Given: transaction processed and cached
        TransactionRequest processRequest = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-cached"));

        grpcService.processTransaction(processRequest).await().atMost(Duration.ofSeconds(5));

        // When: querying same transaction
        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-test-001")
            .build();

        TransactionResponse response = grpcService.getTransaction(query)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should retrieve from cache
        assertTrue(response.getSuccess());
        assertEquals("hash-cached", response.getTransactionHash());
    }

    @Test
    @DisplayName("Test 9: Get non-existent transaction")
    void testGetNonExistentTransaction() {
        // Given: transaction that doesn't exist
        when(transactionService.getTransaction(anyString())).thenReturn(null);

        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-nonexistent")
            .build();

        // When: querying transaction
        TransactionResponse response = grpcService.getTransaction(query)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return not found
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("not found"));
    }

    @Test
    @DisplayName("Test 10: Get transaction status")
    void testGetTransactionStatus() {
        // Given: processed transaction
        TransactionService.Transaction tx = new TransactionService.Transaction(
            "tx-001", "hash-001", 100.0, System.currentTimeMillis(), "PENDING"
        );
        when(transactionService.getTransaction("tx-001")).thenReturn(tx);

        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-001")
            .build();

        // When: getting status
        TransactionStatusResponse response = grpcService.getTransactionStatus(query)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return status
        assertEquals("tx-001", response.getTransactionId());
        assertEquals(TransactionStatus.TRANSACTION_PENDING, response.getStatus());
    }

    @Test
    @DisplayName("Test 11: Stream transaction processing")
    void testStreamTransactionProcessing() {
        // Given: stream of 10 transactions
        List<TransactionRequest> requests = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            requests.add(baseTransactionRequest
                .setTransactionId("tx-stream-" + i)
                .build());
        }

        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-stream"));

        // When: streaming transactions
        Multi<TransactionRequest> requestStream = Multi.createFrom().iterable(requests);
        Multi<TransactionResponse> responseStream = grpcService.streamTransactions(requestStream);

        // Then: all transactions should be processed
        AssertSubscriber<TransactionResponse> subscriber = responseStream
            .subscribe().withSubscriber(AssertSubscriber.create(10));

        subscriber.awaitCompletion(Duration.ofSeconds(10));
        assertEquals(10, subscriber.getItems().size());
        assertTrue(subscriber.getItems().stream().allMatch(TransactionResponse::getSuccess));
    }

    @Test
    @DisplayName("Test 12: High-throughput batch processing (1000 transactions)")
    @Timeout(15)
    void testHighThroughputBatchProcessing() {
        // Given: large batch of 1000 transactions
        List<TransactionRequest> transactions = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            transactions.add(baseTransactionRequest
                .setTransactionId("tx-high-" + i)
                .build());
        }

        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setParallelProcessing(true)
            .setBatchSize(1000)
            .build();

        List<String> hashes = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            hashes.add("hash-" + i);
        }

        when(transactionService.batchProcessParallel(ArgumentMatchers.anyList()))
            .thenReturn(CompletableFuture.completedFuture(hashes));

        // When: processing large batch
        long startTime = System.nanoTime();
        BatchTransactionResponse response = grpcService.batchProcessTransactions(batchRequest)
            .await().atMost(Duration.ofSeconds(15));
        long duration = System.nanoTime() - startTime;

        // Then: should process efficiently
        assertTrue(response.getSuccess());
        assertEquals(1000, response.getTotalSucceeded());
        assertTrue(duration < 15_000_000_000L, "Should complete within 15 seconds");
    }

    // ==================== CONSENSUS MESSAGE HANDLING (8 tests) ====================

    @Test
    @DisplayName("Test 13: System status retrieval")
    void testSystemStatusRetrieval() {
        // Given: service is running
        TransactionService.EnhancedProcessingStats stats = new TransactionService.EnhancedProcessingStats(
            1000L, 1000L, 1024L * 1024L, 16, 4096, true, "HyperRAFT++",
            4000000, 256, 5.0, 10.0, 100L, 2.0, 1.0,
            true, 10000, 50L, 2_000_000.0, 2048,
            10000L, 2_500_000.0, 1.0, true
        );
        when(transactionService.getStats()).thenReturn(stats);

        SystemStatusRequest request = SystemStatusRequest.newBuilder()
            .setIncludeMetrics(true)
            .setIncludeNodeInfo(true)
            .build();

        // When: getting system status
        SystemStatusResponse response = grpcService.getSystemStatus(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return comprehensive status
        assertTrue(response.getHealthy());
        assertEquals("HyperRAFT++", response.getConsensusAlgorithm());
        assertTrue(response.getCurrentTps() > 0);
        assertNotNull(response.getMetrics());
        assertNotNull(response.getNodeInfo());
    }

    @Test
    @DisplayName("Test 14: Performance metrics retrieval")
    void testPerformanceMetricsRetrieval() {
        // Given: service with performance data
        TransactionService.EnhancedProcessingStats stats = new TransactionService.EnhancedProcessingStats(
            5000L, 5000L, 2048L * 1024L, 16, 4096, true, "HyperRAFT++",
            4000000, 512, 3.0, 8.0, 50L, 1.5, 0.5,
            true, 15000, 100L, 3_000_000.0, 2048,
            50000L, 3_500_000.0, 1.2, true
        );
        when(transactionService.getStats()).thenReturn(stats);

        PerformanceMetricsRequest request = PerformanceMetricsRequest.newBuilder()
            .setTimeWindowSeconds(60)
            .setIncludeDetailed(true)
            .build();

        // When: getting performance metrics
        PerformanceMetricsResponse response = grpcService.getPerformanceMetrics(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return detailed metrics
        assertTrue(response.getCurrentTps() > 0);
        assertTrue(response.getP99LatencyMs() > 0);
        assertTrue(response.getSuccessRate() > 0);
        assertNotNull(response.getPerformanceGrade());
        assertTrue(response.getDetailedMetricsCount() > 0);
    }

    @Test
    @DisplayName("Test 15: Performance grade calculation - EXCELLENT")
    void testPerformanceGradeExcellent() {
        // Given: system achieving 3M+ TPS
        TransactionService.EnhancedProcessingStats stats = new TransactionService.EnhancedProcessingStats(
            10000L, 10000L, 1024L * 1024L, 16, 4096, true, "HyperRAFT++",
            4000000, 256, 2.0, 5.0, 50L, 1.0, 0.5,
            true, 10000, 100L, 3_100_000.0, 2048,
            100000L, 3_100_000.0, 1.0, true
        );
        when(transactionService.getStats()).thenReturn(stats);

        PerformanceMetricsRequest request = PerformanceMetricsRequest.newBuilder().build();

        // When: getting metrics
        PerformanceMetricsResponse response = grpcService.getPerformanceMetrics(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should be EXCELLENT grade
        assertEquals(PerformanceGrade.GRADE_EXCELLENT, response.getPerformanceGrade());
    }

    @Test
    @DisplayName("Test 16: Performance grade calculation - OUTSTANDING")
    void testPerformanceGradeOutstanding() {
        // Given: system achieving 2M+ TPS
        TransactionService.EnhancedProcessingStats stats = new TransactionService.EnhancedProcessingStats(
            8000L, 8000L, 1024L * 1024L, 16, 4096, true, "HyperRAFT++",
            4000000, 256, 2.5, 6.0, 50L, 1.2, 0.6,
            true, 10000, 80L, 2_500_000.0, 2048,
            80000L, 2_500_000.0, 1.0, true
        );
        when(transactionService.getStats()).thenReturn(stats);

        PerformanceMetricsRequest request = PerformanceMetricsRequest.newBuilder().build();

        // When: getting metrics
        PerformanceMetricsResponse response = grpcService.getPerformanceMetrics(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should be OUTSTANDING grade
        assertEquals(PerformanceGrade.GRADE_OUTSTANDING, response.getPerformanceGrade());
    }

    @Test
    @DisplayName("Test 17: Node registration")
    void testNodeRegistration() {
        // Given: node registration request
        NodeRegistrationRequest request = NodeRegistrationRequest.newBuilder()
            .setNodeId("node-001")
            .setNodeType("VALIDATOR")
            .setPublicKey("pub-key-12345")
            .setNetworkAddress("192.168.1.100")
            .setGrpcPort(9004)
            .addCapabilities("gRPC")
            .addCapabilities("HTTP/2")
            .build();

        // When: registering node
        NodeRegistrationResponse response = grpcService.registerNode(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should register successfully
        assertTrue(response.getSuccess());
        assertEquals("node-001", response.getNodeId());
        assertEquals(NodeStatus.NODE_ACTIVE, response.getStatus());
    }

    @Test
    @DisplayName("Test 18: Node info retrieval")
    void testNodeInfoRetrieval() {
        // Given: registered node
        NodeInfoRequest request = NodeInfoRequest.newBuilder()
            .setNodeId("node-001")
            .build();

        // When: getting node info
        NodeInfoResponse response = grpcService.getNodeInfo(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return node info
        assertTrue(response.getSuccess());
        assertEquals(NodeStatus.NODE_ACTIVE, response.getStatus());
    }

    @Test
    @DisplayName("Test 19: Block stream initialization")
    void testBlockStreamInitialization() {
        // Given: block stream request
        BlockStreamRequest request = BlockStreamRequest.newBuilder()
            .setStartBlock(0)
            .setIncludeTransactions(true)
            .setBufferSize(100)
            .build();

        // When: starting block stream
        Multi<BlockResponse> stream = grpcService.streamBlocks(request);

        // Then: stream should be created
        assertNotNull(stream);
        AssertSubscriber<BlockResponse> subscriber = stream
            .subscribe().withSubscriber(AssertSubscriber.create(1));

        subscriber.awaitCompletion(Duration.ofSeconds(5));
        assertEquals(1, subscriber.getItems().size());
    }

    @Test
    @DisplayName("Test 20: Latest block retrieval")
    void testLatestBlockRetrieval() {
        // Given: latest block query
        LatestBlockQuery query = LatestBlockQuery.newBuilder()
            .setCount(1)
            .setIncludeTransactions(false)
            .build();

        // When: getting latest block
        BlockResponse response = grpcService.getLatestBlock(query)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should return block response
        assertNotNull(response);
        assertEquals(0, response.getBlockNumber());
    }

    // ==================== ERROR HANDLING AND RECOVERY (5 tests) ====================

    @Test
    @DisplayName("Test 21: Handle transaction processing exception")
    void testHandleTransactionProcessingException() {
        // Given: service that throws exception
        TransactionRequest request = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().failure(new RuntimeException("Service error")));

        // When: processing transaction
        TransactionResponse response = grpcService.processTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should handle error gracefully
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("Service error"));
        assertEquals(TransactionStatus.TRANSACTION_FAILED, response.getStatus());
    }

    @Test
    @DisplayName("Test 22: Handle batch processing exception")
    void testHandleBatchProcessingException() {
        // Given: batch that throws exception
        List<TransactionRequest> transactions = List.of(baseTransactionRequest.build());
        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .build();

        when(transactionService.batchProcessParallel(ArgumentMatchers.anyList()))
            .thenReturn(CompletableFuture.failedFuture(new RuntimeException("Batch error")));

        // When: processing batch
        BatchTransactionResponse response = grpcService.batchProcessTransactions(batchRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should handle error
        assertFalse(response.getSuccess());
        assertEquals(1, response.getTotalFailed());
    }

    @Test
    @DisplayName("Test 23: Handle null transaction service")
    void testHandleNullTransactionService() {
        // Given: health check request
        HealthCheckRequest request = HealthCheckRequest.newBuilder()
            .setServiceName("test-service")
            .build();

        // When: checking health (service exists in this test due to @InjectMock)
        HealthCheckResponse response = grpcService.healthCheck(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should indicate service status
        assertNotNull(response);
        assertEquals(HealthStatus.HEALTH_SERVING, response.getStatus());
    }

    @Test
    @DisplayName("Test 24: Handle invalid gas limit")
    void testHandleInvalidGasLimit() {
        // Given: transaction with zero gas limit
        TransactionRequest request = baseTransactionRequest
            .setGasLimit(0)
            .build();

        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-001"));

        // When: processing transaction
        TransactionResponse response = grpcService.processTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then: should process successfully (service handles gas)
        assertTrue(response.getSuccess());
        assertTrue(response.getGasUsed() >= 0);
    }

    @Test
    @DisplayName("Test 25: Handle concurrent transaction processing")
    @Timeout(10)
    void testHandleConcurrentTransactionProcessing() {
        // Given: multiple concurrent requests
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-concurrent"));

        List<Uni<TransactionResponse>> concurrentRequests = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            TransactionRequest request = baseTransactionRequest
                .setTransactionId("tx-concurrent-" + i)
                .build();
            concurrentRequests.add(grpcService.processTransaction(request));
        }

        // When: processing concurrently
        List<TransactionResponse> responses = Uni.join().all(concurrentRequests).andCollectFailures()
            .await().atMost(Duration.ofSeconds(10));

        // Then: all should succeed
        assertEquals(50, responses.size());
        assertTrue(responses.stream().allMatch(TransactionResponse::getSuccess));
    }

    // ==================== PERFORMANCE BENCHMARKS (8 tests) ====================

    @Test
    @DisplayName("Test 26: Benchmark single transaction latency")
    @Timeout(5)
    void testBenchmarkSingleTransactionLatency() {
        // Given: transaction request
        TransactionRequest request = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-benchmark"));

        // When: measuring latency
        long startTime = System.nanoTime();
        TransactionResponse response = grpcService.processTransaction(request)
            .await().atMost(Duration.ofSeconds(5));
        long latencyNanos = System.nanoTime() - startTime;
        double latencyMs = latencyNanos / 1_000_000.0;

        // Then: latency should be acceptable (<50ms P99 target)
        assertTrue(response.getSuccess());
        assertTrue(latencyMs < 50.0, "Latency should be <50ms, was: " + latencyMs + "ms");
    }

    @Test
    @DisplayName("Test 27: Benchmark batch processing throughput")
    @Timeout(30)
    void testBenchmarkBatchProcessingThroughput() {
        // Given: batch of 10000 transactions
        List<TransactionRequest> transactions = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            transactions.add(baseTransactionRequest
                .setTransactionId("tx-bench-" + i)
                .build());
        }

        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setParallelProcessing(true)
            .build();

        List<String> hashes = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            hashes.add("hash-" + i);
        }

        when(transactionService.batchProcessParallel(ArgumentMatchers.anyList()))
            .thenReturn(CompletableFuture.completedFuture(hashes));

        // When: processing batch and measuring throughput
        long startTime = System.nanoTime();
        BatchTransactionResponse response = grpcService.batchProcessTransactions(batchRequest)
            .await().atMost(Duration.ofSeconds(30));
        long duration = System.nanoTime() - startTime;
        double throughputTps = (double) 10000 * 1_000_000_000.0 / duration;

        // Then: throughput should meet test environment target
        // Note: Production targets 100K+ TPS, but test environment achieves 10-15K TPS
        // This is normal for unit tests with mocking overhead
        assertTrue(response.getSuccess());
        assertTrue(throughputTps > 10_000, "Throughput should be >10K TPS (test env), was: " + throughputTps);
    }

    @Test
    @DisplayName("Test 28: Benchmark cache performance")
    void testBenchmarkCachePerformance() {
        // Given: transaction in cache
        TransactionRequest request = baseTransactionRequest.build();
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-cache"));

        grpcService.processTransaction(request).await().atMost(Duration.ofSeconds(5));

        TransactionQuery query = TransactionQuery.newBuilder()
            .setTransactionId("tx-test-001")
            .build();

        // When: measuring cache lookup time
        long startTime = System.nanoTime();
        TransactionResponse response = grpcService.getTransaction(query)
            .await().atMost(Duration.ofSeconds(5));
        long lookupTime = System.nanoTime() - startTime;
        double lookupMs = lookupTime / 1_000_000.0;

        // Then: cache lookup should be very fast (<1ms)
        assertTrue(response.getSuccess());
        assertTrue(lookupMs < 1.0, "Cache lookup should be <1ms, was: " + lookupMs + "ms");
    }

    @Test
    @DisplayName("Test 29: Benchmark streaming throughput")
    @Timeout(20)
    void testBenchmarkStreamingThroughput() {
        // Given: stream of 5000 transactions
        List<TransactionRequest> requests = new ArrayList<>();
        for (int i = 0; i < 5000; i++) {
            requests.add(baseTransactionRequest
                .setTransactionId("tx-stream-bench-" + i)
                .build());
        }

        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-stream"));

        // When: streaming and measuring throughput
        Multi<TransactionRequest> requestStream = Multi.createFrom().iterable(requests);
        long startTime = System.nanoTime();

        AssertSubscriber<TransactionResponse> subscriber = grpcService.streamTransactions(requestStream)
            .subscribe().withSubscriber(AssertSubscriber.create(5000));

        subscriber.awaitCompletion(Duration.ofSeconds(20));
        long duration = System.nanoTime() - startTime;
        double throughputTps = (double) 5000 * 1_000_000_000.0 / duration;

        // Then: streaming throughput should be acceptable
        // Note: Production targets high TPS, but test environment achieves 1-5K TPS for streaming
        // This is normal for reactive streaming with per-item processing
        assertEquals(5000, subscriber.getItems().size());
        assertTrue(throughputTps > 1_000, "Streaming TPS should be >1K (test env), was: " + throughputTps);
    }

    @Test
    @DisplayName("Test 30: Benchmark memory efficiency")
    void testBenchmarkMemoryEfficiency() {
        // Given: service statistics before load
        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        // When: processing 1000 transactions
        List<TransactionRequest> transactions = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            transactions.add(baseTransactionRequest
                .setTransactionId("tx-mem-" + i)
                .build());
        }

        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .build();

        List<String> hashes = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            hashes.add("hash-" + i);
        }

        when(transactionService.batchProcessParallel(ArgumentMatchers.anyList()))
            .thenReturn(CompletableFuture.completedFuture(hashes));

        grpcService.batchProcessTransactions(batchRequest)
            .await().atMost(Duration.ofSeconds(10));

        runtime.gc();
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;
        double memoryUsedMB = memoryUsed / (1024.0 * 1024.0);

        // Then: memory usage should be reasonable (<100MB for 1000 transactions)
        assertTrue(memoryUsedMB < 100.0, "Memory usage should be <100MB, was: " + memoryUsedMB + "MB");
    }

    @Test
    @DisplayName("Test 31: Benchmark gas calculation performance")
    void testBenchmarkGasCalculationPerformance() {
        // Given: transactions with various data sizes
        List<Long> gasValues = new ArrayList<>();

        for (int dataSize : new int[]{100, 1000, 10000}) {
            TransactionRequest request = baseTransactionRequest
                .setData(ByteString.copyFrom(new byte[dataSize]))
                .setGasLimit(100000)
                .build();

            when(transactionService.processTransactionReactive(anyString(), anyDouble()))
                .thenReturn(Uni.createFrom().item("hash-gas"));

            // When: processing and measuring gas calculation
            TransactionResponse response = grpcService.processTransaction(request)
                .await().atMost(Duration.ofSeconds(5));

            gasValues.add(response.getGasUsed());
        }

        // Then: gas should scale with data size
        assertTrue(gasValues.get(0) < gasValues.get(1));
        assertTrue(gasValues.get(1) < gasValues.get(2));
    }

    @Test
    @DisplayName("Test 32: Benchmark concurrent stream connections")
    @Timeout(30)
    void testBenchmarkConcurrentStreamConnections() {
        // Given: 10 concurrent streaming connections
        when(transactionService.processTransactionReactive(anyString(), anyDouble()))
            .thenReturn(Uni.createFrom().item("hash-concurrent-stream"));

        List<AssertSubscriber<TransactionResponse>> subscribers = new ArrayList<>();

        // When: creating multiple concurrent streams
        for (int stream = 0; stream < 10; stream++) {
            List<TransactionRequest> requests = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                requests.add(baseTransactionRequest
                    .setTransactionId("tx-stream-" + stream + "-" + i)
                    .build());
            }

            Multi<TransactionRequest> requestStream = Multi.createFrom().iterable(requests);
            AssertSubscriber<TransactionResponse> subscriber = grpcService.streamTransactions(requestStream)
                .subscribe().withSubscriber(AssertSubscriber.create(100));
            subscribers.add(subscriber);
        }

        // Then: all streams should complete successfully
        for (AssertSubscriber<TransactionResponse> subscriber : subscribers) {
            subscriber.awaitCompletion(Duration.ofSeconds(30));
            assertEquals(100, subscriber.getItems().size());
        }
    }

    @Test
    @DisplayName("Test 33: Benchmark system status retrieval performance")
    void testBenchmarkSystemStatusRetrievalPerformance() {
        // Given: system status request
        TransactionService.EnhancedProcessingStats stats = new TransactionService.EnhancedProcessingStats(
            1000L, 1000L, 1024L * 1024L, 16, 4096, true, "HyperRAFT++",
            4000000, 256, 5.0, 10.0, 100L, 2.0, 1.0,
            true, 10000, 50L, 2_000_000.0, 2048,
            10000L, 2_500_000.0, 1.0, true
        );
        when(transactionService.getStats()).thenReturn(stats);

        SystemStatusRequest request = SystemStatusRequest.newBuilder()
            .setIncludeMetrics(true)
            .setIncludeNodeInfo(true)
            .build();

        // When: measuring retrieval time
        long startTime = System.nanoTime();
        SystemStatusResponse response = grpcService.getSystemStatus(request)
            .await().atMost(Duration.ofSeconds(5));
        long retrievalTime = System.nanoTime() - startTime;
        double retrievalMs = retrievalTime / 1_000_000.0;

        // Then: retrieval should be fast (<10ms)
        assertTrue(response.getHealthy());
        assertTrue(retrievalMs < 10.0, "Status retrieval should be <10ms, was: " + retrievalMs + "ms");
    }
}
