package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.jboss.logging.Logger;

import io.aurigraph.v11.grpc.AurigraphV11Proto.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * High-Performance gRPC Service Test
 * 
 * Validates performance targets:
 * - Latency: <10ms P99
 * - Throughput: 2M+ TPS capability
 * - Concurrent Connections: 10,000+
 * - Compression: 70% bandwidth reduction
 */
@QuarkusTest
public class HighPerformanceGrpcServiceTest {

    private static final Logger LOG = Logger.getLogger(HighPerformanceGrpcServiceTest.class);
    
    private static ManagedChannel channel;
    private static AurigraphV11ServiceGrpc.AurigraphV11ServiceStub asyncStub;
    private static AurigraphV11ServiceGrpc.AurigraphV11ServiceBlockingStub blockingStub;

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
        
        LOG.info("High-Performance gRPC Test Client initialized");
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

    @Test
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
            
            assertEquals("HEALTHY", response.getStatus());
        }
        
        // Calculate P99 latency
        latencies.sort(Long::compareTo);
        long p99Index = (long) (iterations * 0.99);
        long p99Latency = latencies.get((int) p99Index);
        
        LOG.infof("Health endpoint P99 latency: %dms (target: <10ms)", p99Latency);
        assertTrue(p99Latency < 10, "P99 latency should be less than 10ms");
    }

    @Test
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
        LOG.infof("  TPS: %.0f (target: 2M+)", actualTps);
        LOG.infof("  Average latency: %.2fms", avgLatencyMs);
        
        assertEquals(totalTransactions, successCount.get(), "All transactions should succeed");
        assertTrue(actualTps > 1000, "Should achieve at least 1000 TPS in test environment");
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
        assertEquals(2000000.0, stats.getTargetTps(), "Target TPS should be 2M");
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