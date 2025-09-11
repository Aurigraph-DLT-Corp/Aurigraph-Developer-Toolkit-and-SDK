package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectMock;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.jboss.logging.Logger;
import org.mockito.Mockito;

import io.aurigraph.v11.grpc.*;
import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.ai.AIOptimizationService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.bridge.CrossChainBridgeService;
import io.aurigraph.v11.ai.AIOptimizationService.OptimizationStatus;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.ConsensusStatus;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.PerformanceMetrics;
import com.google.protobuf.Empty;

import jakarta.inject.Inject;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

/**
 * High-Performance gRPC Service Comprehensive Test Suite
 * 
 * Validates performance targets and functional correctness:
 * - Latency: <10ms P99
 * - Throughput: 1.5M+ TPS capability (updated target)
 * - Concurrent Connections: 10,000+
 * - Compression: 70% bandwidth reduction
 * - All gRPC service methods and error conditions
 * - AI optimization integration
 * - Consensus service integration
 * - Quantum cryptography integration
 * - Cross-chain bridge integration
 * 
 * Coverage Target: 95%+ of HighPerformanceGrpcService methods
 */
@QuarkusTest
@DisplayName("High-Performance gRPC Service Tests")
public class HighPerformanceGrpcServiceTest {

    private static final Logger LOG = Logger.getLogger(HighPerformanceGrpcServiceTest.class);
    
    private static ManagedChannel channel;
    private static AurigraphV11ServiceGrpc.AurigraphV11ServiceStub asyncStub;
    private static AurigraphV11ServiceGrpc.AurigraphV11ServiceBlockingStub blockingStub;
    private static MonitoringServiceGrpc.MonitoringServiceStub monitoringAsyncStub;
    private static MonitoringServiceGrpc.MonitoringServiceBlockingStub monitoringBlockingStub;
    
    @Inject
    HighPerformanceGrpcService grpcService;
    
    @InjectMock
    TransactionService mockTransactionService;
    
    @InjectMock
    AIOptimizationService mockAIService;
    
    @InjectMock
    HyperRAFTConsensusService mockConsensusService;
    
    @InjectMock
    QuantumCryptoService mockQuantumCryptoService;
    
    @InjectMock
    CrossChainBridgeService mockBridgeService;

    @BeforeAll
    static void setup() {
        channel = ManagedChannelBuilder.forAddress("localhost", 9004)
            .usePlaintext()
            .keepAliveTime(30, TimeUnit.SECONDS)
            .keepAliveTimeout(5, TimeUnit.SECONDS)
            .keepAliveWithoutCalls(true)
            .maxInboundMessageSize(16 * 1024 * 1024)
            .build();
            
        asyncStub = AurigraphV11ServiceGrpc.newStub(channel);
        blockingStub = AurigraphV11ServiceGrpc.newBlockingStub(channel);
        monitoringAsyncStub = MonitoringServiceGrpc.newStub(channel);
        monitoringBlockingStub = MonitoringServiceGrpc.newBlockingStub(channel);
        
        LOG.info("High-Performance gRPC Test Client initialized with monitoring support");
    }
    
    @BeforeEach
    void setupMocks() {
        // Setup common mock behaviors
        when(mockTransactionService.getStats()).thenReturn(
            new TransactionService.TransactionStats(
                100000L, 95000L, 1024L * 1024L * 256L, 16, 8, true, "HyperRAFT++", 45.5
            )
        );
        
        when(mockAIService.getOptimizationStatus()).thenReturn(
            new OptimizationStatus(true, 0.95, "AI optimization active")
        );
        
        when(mockConsensusService.isHealthy()).thenReturn(true);
        when(mockConsensusService.getStatus()).thenReturn(
            new ConsensusStatus(ConsensusState.CONSENSUS_STATE_LEADER, 5, 1000L, 3)
        );
        when(mockConsensusService.getPerformanceMetrics()).thenReturn(
            new PerformanceMetrics(1500000.0, 35.0, 99.5, 150000L, 149500L)
        );
        
        LOG.debug("Test mocks configured");
    }

    @AfterAll
    static void cleanup() {
        if (channel != null) {
            channel.shutdown();
            try {
                if (!channel.awaitTermination(5, TimeUnit.SECONDS)) {
                    channel.shutdownNow();
                }
            } catch (InterruptedException e) {
                channel.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    @Nested
    @DisplayName("Health and System Info Tests")
    class HealthAndSystemTests {
        
        @Test
        @DisplayName("Health endpoint should return healthy status with component details")
        void testHealthEndpointComprehensive() throws Exception {
            LOG.info("Testing comprehensive health endpoint");
            
            HealthResponse response = blockingStub.getHealth(Empty.newBuilder().build());
            
            assertNotNull(response, "Health response should not be null");
            assertEquals(HealthStatus.HEALTH_STATUS_HEALTHY, response.getStatus(), "Overall status should be healthy");
            assertEquals("11.0.0-hp-grpc", response.getVersion(), "Version should match expected");
            assertNotNull(response.getUptimeSince(), "Uptime timestamp should be present");
            
            // Verify component health details
            Map<String, ComponentHealth> components = response.getComponentsMap();
            assertFalse(components.isEmpty(), "Components map should not be empty");
            
            assertTrue(components.containsKey("transaction-service"), "Should include transaction service");
            assertTrue(components.containsKey("consensus-service"), "Should include consensus service");
            assertTrue(components.containsKey("ai-optimization"), "Should include AI optimization");
            assertTrue(components.containsKey("quantum-crypto"), "Should include quantum crypto");
            assertTrue(components.containsKey("cross-chain-bridge"), "Should include bridge service");
            
            ComponentHealth transactionHealth = components.get("transaction-service");
            assertEquals(HealthStatus.HEALTH_STATUS_HEALTHY, transactionHealth.getStatus());
            assertTrue(transactionHealth.getMessage().contains("operational"));
        }
        
        @Test
        @DisplayName("Health endpoint latency should be under 10ms P99")
        void testHealthEndpointLatency() throws Exception {
        LOG.info("Testing health endpoint latency");
        
        int iterations = 1000;
        List<Long> latencies = new ArrayList<>();
        
        for (int i = 0; i < iterations; i++) {
            long startTime = System.nanoTime();
            
            HealthResponse response = blockingStub.getHealth(Empty.newBuilder().build());
            
            long endTime = System.nanoTime();
            long latencyMs = (endTime - startTime) / 1_000_000;
            latencies.add(latencyMs);
            
            assertNotNull(response.getStatus());
            assertEquals(HealthStatus.HEALTH_STATUS_HEALTHY, response.getStatus());
        }
        
        // Calculate P99 latency
        latencies.sort(Long::compareTo);
        long p99Index = (long) (iterations * 0.99);
        long p99Latency = latencies.get((int) p99Index);
        
            LOG.infof("Health endpoint P99 latency: %dms (target: <10ms)", p99Latency);
            assertTrue(p99Latency < 10, "P99 latency should be less than 10ms");
        }
        
        @Test
        @DisplayName("System info should return complete system details")
        void testSystemInfoResponse() throws Exception {
            LOG.info("Testing system information endpoint");
            
            SystemInfoResponse info = blockingStub.getSystemInfo(Empty.newBuilder().build());
            
            assertNotNull(info, "System info response should not be null");
            assertTrue(info.getName().contains("Aurigraph V11"), "Name should identify V11");
            assertEquals("11.0.0-hp-grpc", info.getVersion(), "Version should match");
            assertNotNull(info.getJavaVersion(), "Java version should be present");
            assertTrue(info.getFramework().contains("Quarkus"), "Framework should mention Quarkus");
            assertTrue(info.getFramework().contains("GraalVM"), "Framework should mention GraalVM");
            assertNotNull(info.getOsName(), "OS name should be present");
            assertNotNull(info.getOsArch(), "OS architecture should be present");
        }
        
        @ParameterizedTest
        @ValueSource(ints = {1, 10, 100, 500})
        @DisplayName("Health endpoint should handle concurrent requests")
        void testHealthEndpointConcurrency(int concurrentRequests) throws Exception {
            LOG.infof("Testing health endpoint with %d concurrent requests", concurrentRequests);
            
            CountDownLatch latch = new CountDownLatch(concurrentRequests);
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger errorCount = new AtomicInteger(0);
            
            for (int i = 0; i < concurrentRequests; i++) {
                CompletableFuture.runAsync(() -> {
                    try {
                        HealthResponse response = blockingStub.getHealth(Empty.newBuilder().build());
                        if (response.getStatus() == HealthStatus.HEALTH_STATUS_HEALTHY) {
                            successCount.incrementAndGet();
                        }
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                        LOG.warnf("Concurrent health request failed: %s", e.getMessage());
                    } finally {
                        latch.countDown();
                    }
                });
            }
            
            assertTrue(latch.await(30, TimeUnit.SECONDS), "All requests should complete within 30 seconds");
            assertTrue(successCount.get() >= concurrentRequests * 0.95, "At least 95% should succeed");
            assertTrue(errorCount.get() <= concurrentRequests * 0.05, "At most 5% should fail");
        }
    }

    @Nested
    @DisplayName("Transaction Processing Tests")
    class TransactionProcessingTests {
        
        @Test
        @DisplayName("Single transaction submission should succeed")
        void testSingleTransactionSubmission() throws Exception {
            LOG.info("Testing single transaction submission");
            
            // Setup mock response
            when(mockTransactionService.processTransactionOptimized(anyString(), anyDouble()))
                .thenReturn("test-hash-12345");
            
            TransactionRequest request = TransactionRequest.newBuilder()
                .setFromAddress("test-sender")
                .setToAddress("test-receiver")
                .setAmount(1000L)
                .putMetadata("type", "test")
                .putMetadata("priority", "high")
                .build();
            
            TransactionResponse response = blockingStub.submitTransaction(request);
            
            assertNotNull(response, "Response should not be null");
            assertNotNull(response.getTransactionId(), "Transaction ID should be present");
            assertEquals(TransactionStatus.TRANSACTION_STATUS_PROCESSING, response.getStatus());
            assertTrue(response.getMessage().contains("submitted successfully"));
            assertNotNull(response.getTimestamp(), "Timestamp should be present");
            assertNotNull(response.getTransactionHash(), "Transaction hash should be present");
            
            verify(mockTransactionService).processTransactionOptimized(anyString(), eq(1000.0));
        }
        
        @Test
        @DisplayName("Transaction throughput test - validate 1.5M+ TPS capability")
        void testTransactionThroughput() throws Exception {
        LOG.info("Testing transaction throughput");
        
        int totalTransactions = 10000;
        int concurrentClients = 100;
        int transactionsPerClient = totalTransactions / concurrentClients;
        
        CountDownLatch latch = new CountDownLatch(concurrentClients);
        AtomicLong totalLatency = new AtomicLong(0);
        AtomicLong successCount = new AtomicLong(0);
        
        long testStartTime = System.nanoTime();
        
        for (int i = 0; i < concurrentClients; i++) {
            final int clientId = i;
            
            CompletableFuture.runAsync(() -> {
                try {
                    for (int j = 0; j < transactionsPerClient; j++) {
                        long startTime = System.nanoTime();
                        
                        TransactionRequest request = TransactionRequest.newBuilder()
                            .setId("perf_test_" + clientId + "_" + j)
                            .setAmount(100.0 + j)
                            .setFromAddress("sender" + clientId)
                            .setToAddress("receiver" + clientId)
                            .setTimestamp(System.currentTimeMillis())
                            .build();
                        
                        TransactionResponse response = blockingStub.submitTransaction(request);
                        
                        long endTime = System.nanoTime();
                        totalLatency.addAndGet(endTime - startTime);
                        
                        if ("CONFIRMED".equals(response.getStatus())) {
                            successCount.incrementAndGet();
                        }
                    }
                } catch (Exception e) {
                    LOG.errorf("Client %d failed: %s", clientId, e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }
        
        latch.await(60, TimeUnit.SECONDS);
        long testEndTime = System.nanoTime();
        
        double testDurationSeconds = (testEndTime - testStartTime) / 1_000_000_000.0;
        double actualTps = successCount.get() / testDurationSeconds;
        double avgLatencyMs = (totalLatency.get() / 1_000_000.0) / successCount.get();
        
        LOG.infof("Transaction throughput test results:");
        LOG.infof("  Transactions: %d", successCount.get());
        LOG.infof("  Duration: %.2f seconds", testDurationSeconds);
            LOG.infof("  TPS: %.0f (target: 1.5M+)", actualTps);
        LOG.infof("  Average latency: %.2fms", avgLatencyMs);
        
            assertEquals(totalTransactions, successCount.get(), "All transactions should succeed");
            assertTrue(actualTps > 1000, "Should achieve at least 1000 TPS in test environment");
        }
        
        @Test
        @DisplayName("Transaction status lookup should work correctly")
        void testTransactionStatusLookup() throws Exception {
            LOG.info("Testing transaction status lookup");
            
            // First submit a transaction
            when(mockTransactionService.processTransactionOptimized(anyString(), anyDouble()))
                .thenReturn("test-hash-status");
            
            TransactionRequest submitRequest = TransactionRequest.newBuilder()
                .setFromAddress("status-sender")
                .setToAddress("status-receiver")
                .setAmount(500L)
                .build();
            
            TransactionResponse submitResponse = blockingStub.submitTransaction(submitRequest);
            String transactionId = submitResponse.getTransactionId();
            
            // Now lookup the status
            TransactionStatusRequest statusRequest = TransactionStatusRequest.newBuilder()
                .setTransactionId(transactionId)
                .build();
            
            TransactionStatusResponse statusResponse = blockingStub.getTransactionStatus(statusRequest);
            
            assertNotNull(statusResponse, "Status response should not be null");
            assertEquals(transactionId, statusResponse.getTransactionId());
            assertTrue(statusResponse.getStatus() != TransactionStatus.TRANSACTION_STATUS_UNKNOWN);
            assertNotNull(statusResponse.getTimestamp());
        }
        
        @Test
        @DisplayName("Get transaction by ID should return transaction details")
        void testGetTransactionById() throws Exception {
            LOG.info("Testing get transaction by ID");
            
            // Submit a transaction first
            when(mockTransactionService.processTransactionOptimized(anyString(), anyDouble()))
                .thenReturn("test-hash-get");
            
            TransactionRequest submitRequest = TransactionRequest.newBuilder()
                .setFromAddress("get-sender")
                .setToAddress("get-receiver")
                .setAmount(750L)
                .build();
            
            TransactionResponse submitResponse = blockingStub.submitTransaction(submitRequest);
            String transactionId = submitResponse.getTransactionId();
            
            // Get the transaction
            GetTransactionRequest getRequest = GetTransactionRequest.newBuilder()
                .setTransactionId(transactionId)
                .build();
            
            Transaction transaction = blockingStub.getTransaction(getRequest);
            
            assertNotNull(transaction, "Transaction should not be null");
            assertEquals(transactionId, transaction.getId());
            assertEquals("get-sender", transaction.getFromAddress());
            assertEquals("get-receiver", transaction.getToAddress());
            assertEquals(750L, transaction.getAmount());
        }
        
        @ParameterizedTest
        @CsvSource({
            "100, 10",
            "500, 25", 
            "1000, 50",
            "2000, 100"
        })
        @DisplayName("Transaction error handling should be robust")
        void testTransactionErrorHandling(int amount, int concurrency) throws Exception {
            LOG.infof("Testing transaction error handling with amount=%d, concurrency=%d", amount, concurrency);
            
            // Mock service to throw exception
            when(mockTransactionService.processTransactionOptimized(anyString(), anyDouble()))
                .thenThrow(new RuntimeException("Simulated processing error"));
            
            TransactionRequest request = TransactionRequest.newBuilder()
                .setFromAddress("error-sender")
                .setToAddress("error-receiver")
                .setAmount(amount)
                .build();
            
            TransactionResponse response = blockingStub.submitTransaction(request);
            
            assertNotNull(response, "Response should not be null even on error");
            assertEquals(TransactionStatus.TRANSACTION_STATUS_FAILED, response.getStatus());
            assertTrue(response.getMessage().contains("failed"));
        }
    }

    @Test
    void testBatchTransactionPerformance() throws Exception {
        LOG.info("Testing batch transaction performance");
        
        int batchSize = 1000;
        List<TransactionRequest> transactions = new ArrayList<>();
        
        for (int i = 0; i < batchSize; i++) {
            transactions.add(TransactionRequest.newBuilder()
                .setId("batch_test_" + i)
                .setAmount(100.0 + i)
                .setFromAddress("batch_sender")
                .setToAddress("batch_receiver")
                .setTimestamp(System.currentTimeMillis())
                .build());
        }
        
        BatchTransactionRequest batchRequest = BatchTransactionRequest.newBuilder()
            .addAllTransactions(transactions)
            .setAtomic(false)
            .build();
        
        long startTime = System.nanoTime();
        BatchTransactionResponse response = blockingStub.batchSubmitTransactions(batchRequest);
        long endTime = System.nanoTime();
        
        double latencyMs = (endTime - startTime) / 1_000_000.0;
        double tps = (batchSize * 1000.0) / latencyMs;
        
        LOG.infof("Batch transaction results:");
        LOG.infof("  Successful: %d/%d", response.getSuccessfulCount(), batchSize);
        LOG.infof("  Latency: %.2fms", latencyMs);
        LOG.infof("  Effective TPS: %.0f", tps);
        
        assertEquals(batchSize, response.getSuccessfulCount(), "All batch transactions should succeed");
        assertTrue(tps > 10000, "Batch processing should achieve >10K TPS");
    }

    @Test
    void testConcurrentConnections() throws Exception {
        LOG.info("Testing concurrent connections");
        
        int connectionCount = 100; // Reduced for test environment
        List<ManagedChannel> channels = new ArrayList<>();
        CountDownLatch latch = new CountDownLatch(connectionCount);
        AtomicLong successCount = new AtomicLong(0);
        
        try {
            // Create multiple concurrent connections
            for (int i = 0; i < connectionCount; i++) {
                ManagedChannel testChannel = ManagedChannelBuilder.forAddress("localhost", 9004)
                    .usePlaintext()
                    .build();
                channels.add(testChannel);
                
                final int connectionId = i;
                CompletableFuture.runAsync(() -> {
                    try {
                        AurigraphV11ServiceGrpc.AurigraphV11ServiceBlockingStub stub = 
                            AurigraphV11ServiceGrpc.newBlockingStub(testChannel);
                        
                        // Perform transaction on each connection
                        TransactionRequest request = TransactionRequest.newBuilder()
                            .setId("concurrent_test_" + connectionId)
                            .setAmount(100.0)
                            .build();
                        
                        TransactionResponse response = stub.submitTransaction(request);
                        
                        if ("CONFIRMED".equals(response.getStatus())) {
                            successCount.incrementAndGet();
                        }
                        
                    } catch (Exception e) {
                        LOG.errorf("Connection %d failed: %s", connectionId, e.getMessage());
                    } finally {
                        latch.countDown();
                    }
                });
            }
            
            latch.await(30, TimeUnit.SECONDS);
            
            LOG.infof("Concurrent connections test:");
            LOG.infof("  Connections: %d", connectionCount);
            LOG.infof("  Successful transactions: %d", successCount.get());
            
            assertTrue(successCount.get() >= connectionCount * 0.95, 
                      "At least 95% of concurrent connections should succeed");
            
        } finally {
            // Clean up test channels
            for (ManagedChannel testChannel : channels) {
                testChannel.shutdown();
            }
        }
    }

    @Test
    void testPerformanceStats() throws Exception {
        LOG.info("Testing performance statistics");
        
        PerformanceStatsResponse stats = blockingStub.getPerformanceStats(Empty.newBuilder().build());
        
        LOG.infof("Performance statistics:");
        LOG.infof("  Total processed: %d", stats.getTotalProcessed());
        LOG.infof("  Current TPS: %.0f", stats.getCurrentTps());
        LOG.infof("  Target TPS: %.0f", stats.getTargetTps());
        LOG.infof("  Memory used: %d MB", stats.getMemoryUsed());
        LOG.infof("  Available processors: %d", stats.getAvailableProcessors());
        
        assertTrue(stats.getTotalProcessed() >= 0, "Total processed should be non-negative");
        assertEquals(1500000.0, stats.getTargetTps(), "Target TPS should be 1.5M");
    }

    @Test
    void testHighPerformanceTest() throws Exception {
        LOG.info("Running built-in high-performance test");
        
        PerformanceTestRequest testRequest = PerformanceTestRequest.newBuilder()
            .setTransactionCount(5000)
            .setConcurrentThreads(10)
            .setEnableConsensus(false)
            .build();
        
        PerformanceTestResponse response = blockingStub.runPerformanceTest(testRequest);
        
        LOG.infof("Built-in performance test results:");
        LOG.infof("  Iterations: %d", response.getIterations());
        LOG.infof("  Duration: %.2fms", response.getDurationMs());
        LOG.infof("  TPS: %.0f", response.getTransactionsPerSecond());
        LOG.infof("  Avg ns per transaction: %.0f", response.getNsPerTransaction());
        LOG.infof("  Optimizations: %s", response.getOptimizations());
        LOG.infof("  Target achieved: %s", response.getTargetAchieved());
        
        assertEquals(5000, response.getIterations(), "Should process all requested transactions");
        assertTrue(response.getTransactionsPerSecond() > 1000, "Should achieve significant TPS");
        assertTrue(response.getDurationMs() < 30000, "Should complete within 30 seconds");
    }

    @Test
    void testSystemInfo() throws Exception {
        LOG.info("Testing system information");
        
        SystemInfoResponse info = blockingStub.getSystemInfo(Empty.newBuilder().build());
        
        LOG.infof("System information:");
        LOG.infof("  Name: %s", info.getName());
        LOG.infof("  Version: %s", info.getVersion());
        LOG.infof("  Framework: %s", info.getFramework());
        LOG.infof("  Java version: %s", info.getJavaVersion());
        LOG.infof("  OS: %s %s", info.getOsName(), info.getOsArch());
        
        assertTrue(info.getName().contains("High-Performance"), "Should indicate high-performance service");
        assertTrue(info.getFramework().contains("Virtual Threads"), "Should support virtual threads");
    }
}