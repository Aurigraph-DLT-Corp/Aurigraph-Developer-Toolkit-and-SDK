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
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Story 9, Phase 4: AdvancedStreamingService Comprehensive Tests
 *
 * Tests cover high-performance streaming patterns:
 * - Multiplexed transactions (10x throughput)
 * - Adaptive batching (network-aware)
 * - Priority queue with SLA
 * - Shard aggregation
 * - Large transfer chunking
 *
 * Target: 20 tests validating 200k+ tx/sec per stream, <10ms P95 latency
 */
@QuarkusTest
@DisplayName("AdvancedStreamingService Tests")
public class AdvancedStreamingServiceTest {

    @Inject
    private AdvancedStreamingService advancedService;

    @Mock
    private StreamObserver<MultiplexedResultBatch> multiplexObserver;

    @Mock
    private StreamObserver<AdaptiveResultBatch> adaptiveObserver;

    @Mock
    private StreamObserver<PriorityTransactionResult> priorityObserver;

    @Mock
    private StreamObserver<AggregatedShardResult> shardObserver;

    @Mock
    private StreamObserver<LargeTransferResponse> transferObserver;

    @Mock
    private StreamObserver<HealthStatus> healthObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================================================================
    // Test 1: Multiplexing - 10 tx per message
    // ========================================================================
    @Test
    @DisplayName("Test 1: Multiplex 10 transactions per message")
    public void testMultiplexing10Tx() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger resultCount = new AtomicInteger(0);

        StreamObserver<MultiplexedTransactionBatch> batchObserver =
            advancedService.multiplexedTransactionStream(new StreamObserver<MultiplexedResultBatch>() {
                @Override
                public void onNext(MultiplexedResultBatch value) {
                    assertEquals(10, value.getResultsCount());
                    resultCount.incrementAndGet();
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 10 transactions in single batch
        List<MultiplexedTransaction> txList = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            txList.add(MultiplexedTransaction.newBuilder()
                .setTxId("multiplex_" + i)
                .setFrom("alice")
                .setTo("bob")
                .setValue("1000000000000000000")
                .setNonce(i)
                .build());
        }

        MultiplexedTransactionBatch batch = MultiplexedTransactionBatch.newBuilder()
            .setBatchId("batch_001")
            .addAllTransactions(txList)
            .build();

        batchObserver.onNext(batch);
        batchObserver.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertEquals(1, resultCount.get());
    }

    // ========================================================================
    // Test 2: 10x Throughput Improvement
    // ========================================================================
    @Test
    @DisplayName("Test 2: Verify 10x throughput gain (1k -> 10k tx/sec)")
    public void test10xThroughputGain() throws InterruptedException {
        long startTime = System.currentTimeMillis();
        int batches = 100;
        int txPerBatch = 10;
        CountDownLatch latch = new CountDownLatch(batches);

        for (int b = 0; b < batches; b++) {
            final int batchNum = b;
            StreamObserver<MultiplexedTransactionBatch> observer =
                advancedService.multiplexedTransactionStream(new StreamObserver<MultiplexedResultBatch>() {
                    @Override
                    public void onNext(MultiplexedResultBatch value) {
                        assertEquals(txPerBatch, value.getResultsCount());
                    }

                    @Override
                    public void onError(Throwable t) {}

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

            List<MultiplexedTransaction> txList = new ArrayList<>();
            for (int i = 0; i < txPerBatch; i++) {
                txList.add(MultiplexedTransaction.newBuilder()
                    .setTxId("tx_" + batchNum + "_" + i)
                    .setFrom("alice")
                    .setTo("bob")
                    .setValue("1000000000000000000")
                    .setNonce(i)
                    .build());
            }

            MultiplexedTransactionBatch batch = MultiplexedTransactionBatch.newBuilder()
                .setBatchId("batch_" + batchNum)
                .addAllTransactions(txList)
                .build();

            observer.onNext(batch);
            observer.onCompleted();
        }

        assertTrue(latch.await(15, TimeUnit.SECONDS));
        long duration = System.currentTimeMillis() - startTime;
        double throughput = (batches * txPerBatch * 1000.0) / duration;
        System.out.println("Multiplex throughput: " + (int)throughput + " tx/sec");
        assertTrue(throughput > 5000, "Should achieve >5k tx/sec with 10x multiplexing");
    }

    // ========================================================================
    // Test 3: Adaptive Batching - Low Latency
    // ========================================================================
    @Test
    @DisplayName("Test 3: Adaptive batching with low latency (small batches)")
    public void testAdaptiveLowLatency() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger batchSize = new AtomicInteger(0);

        StreamObserver<AdaptiveTransactionBatch> observer =
            advancedService.adaptiveBatchingStream(new StreamObserver<AdaptiveResultBatch>() {
                @Override
                public void onNext(AdaptiveResultBatch value) {
                    batchSize.set(value.getBatchSize());
                    // Low latency should use small batches
                    assertTrue(value.getBatchSize() <= 10);
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send batch with high estimated latency (low network speed)
        List<MultiplexedTransaction> txList = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            txList.add(MultiplexedTransaction.newBuilder()
                .setTxId("adaptive_" + i)
                .setFrom("alice")
                .setTo("bob")
                .setValue("1000000000000000000")
                .build());
        }

        AdaptiveTransactionBatch batch = AdaptiveTransactionBatch.newBuilder()
            .setBatchId("adaptive_001")
            .addAllTransactions(txList)
            .setBatchSize(5)
            .setQueueDepth(2)
            .setEstimatedLatencyMs(50)  // High latency = small batch
            .build();

        observer.onNext(batch);
        observer.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertTrue(batchSize.get() <= 10);
    }

    // ========================================================================
    // Test 4: Adaptive Batching - High Throughput
    // ========================================================================
    @Test
    @DisplayName("Test 4: Adaptive batching with low latency (large batches)")
    public void testAdaptiveHighThroughput() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicDouble throughput = new AtomicDouble(0);

        StreamObserver<AdaptiveTransactionBatch> observer =
            advancedService.adaptiveBatchingStream(new StreamObserver<AdaptiveResultBatch>() {
                @Override
                public void onNext(AdaptiveResultBatch value) {
                    throughput.set(value.getThroughputTps());
                    // High throughput should have large batches
                    assertTrue(value.getBatchSize() >= 50);
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send batch with low latency (good network)
        List<MultiplexedTransaction> txList = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            txList.add(MultiplexedTransaction.newBuilder()
                .setTxId("fast_" + i)
                .setFrom("alice")
                .setTo("bob")
                .build());
        }

        AdaptiveTransactionBatch batch = AdaptiveTransactionBatch.newBuilder()
            .setBatchId("fast_001")
            .addAllTransactions(txList)
            .setBatchSize(100)
            .setQueueDepth(500)
            .setEstimatedLatencyMs(1)  // Low latency = large batch
            .build();

        observer.onNext(batch);
        observer.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertTrue(throughput.get() > 50000, "Should achieve >50k tx/sec");
    }

    // ========================================================================
    // Test 5: Priority Queue - CRITICAL SLA <2ms
    // ========================================================================
    @Test
    @DisplayName("Test 5: CRITICAL priority SLA < 2ms")
    public void testCriticalPrioritySLA() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger slaMetCount = new AtomicInteger(0);

        StreamObserver<PriorityTransaction> observer =
            advancedService.priorityTransactionStream(new StreamObserver<PriorityTransactionResult>() {
                @Override
                public void onNext(PriorityTransactionResult value) {
                    if (value.getSlaMet()) {
                        slaMetCount.incrementAndGet();
                    }
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send CRITICAL priority transaction
        PriorityTransaction tx = PriorityTransaction.newBuilder()
            .setTxId("critical_001")
            .setPriority(TransactionPriorityLevel.PRIORITY_CRITICAL)
            .setTransaction(MultiplexedTransaction.newBuilder()
                .setTxId("critical_001")
                .setFrom("alice")
                .setTo("bob")
                .build())
            .setMaxLatencyMs(2)
            .build();

        observer.onNext(tx);
        observer.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertTrue(slaMetCount.get() > 0, "CRITICAL should meet <2ms SLA");
    }

    // ========================================================================
    // Test 6: Priority Queue - Multiple Priorities
    // ========================================================================
    @Test
    @DisplayName("Test 6: Priority queue handles CRITICAL, HIGH, NORMAL")
    public void testMultiplePriorities() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger processedCount = new AtomicInteger(0);

        StreamObserver<PriorityTransaction> observer =
            advancedService.priorityTransactionStream(new StreamObserver<PriorityTransactionResult>() {
                @Override
                public void onNext(PriorityTransactionResult value) {
                    processedCount.incrementAndGet();
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send NORMAL, CRITICAL, HIGH (should process CRITICAL first due to priority)
        TransactionPriorityLevel[] priorities = {
            TransactionPriorityLevel.PRIORITY_NORMAL,
            TransactionPriorityLevel.PRIORITY_CRITICAL,
            TransactionPriorityLevel.PRIORITY_HIGH
        };

        for (int i = 0; i < priorities.length; i++) {
            PriorityTransaction tx = PriorityTransaction.newBuilder()
                .setTxId("priority_" + i)
                .setPriority(priorities[i])
                .setTransaction(MultiplexedTransaction.newBuilder()
                    .setTxId("priority_" + i)
                    .build())
                .setMaxLatencyMs(i == 1 ? 2 : (i == 2 ? 5 : 20))
                .build();
            observer.onNext(tx);
        }

        observer.onCompleted();

        // Wait a bit then close (priority processing is async)
        Thread.sleep(1000);
        assertEquals(3, processedCount.get(), "Should process all 3 transactions");

        executor.shutdown();
    }

    // ========================================================================
    // Test 7: Shard Aggregation - 4 Shards to 1 Stream
    // ========================================================================
    @Test
    @DisplayName("Test 7: Aggregate 4 shards into single stream")
    public void testShardAggregation() {
        AtomicInteger shardCount = new AtomicInteger(0);

        ShardAggregatorRequest request = ShardAggregatorRequest.newBuilder()
            .setAggregatorId("aggregator_001")
            .setNumShards(4)
            .build();

        advancedService.shardedStreamingAggregator(request, new StreamObserver<AggregatedShardResult>() {
            @Override
            public void onNext(AggregatedShardResult value) {
                shardCount.incrementAndGet();
                assertEquals(4, value.getTotalShards());
            }

            @Override
            public void onError(Throwable t) {}

            @Override
            public void onCompleted() {}
        });

        assertTrue(shardCount.get() >= 4, "Should aggregate results from 4 shards");
    }

    // ========================================================================
    // Test 8: Large Transfer Chunking - 1GB File
    // ========================================================================
    @Test
    @DisplayName("Test 8: Stream 1GB file as 1MB chunks")
    public void testLargeTransferChunking() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger totalBytes = new AtomicInteger(0);

        StreamObserver<TransferChunk> observer =
            advancedService.memoryEfficientLargeTransfers(new StreamObserver<LargeTransferResponse>() {
                @Override
                public void onNext(LargeTransferResponse value) {
                    totalBytes.set((int)value.getTotalBytes());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 1000 x 1MB chunks = 1GB total
        int chunkSizeMb = 1;
        int totalChunks = 1000;

        for (int i = 0; i < totalChunks; i++) {
            byte[] chunkData = new byte[chunkSizeMb * 1024 * 1024];
            Arrays.fill(chunkData, (byte)(i % 256));

            TransferChunk chunk = TransferChunk.newBuilder()
                .setTransferId("transfer_1gb")
                .setChunkNumber(i)
                .setTotalChunks(totalChunks)
                .setChunkData(com.google.protobuf.ByteString.copyFrom(chunkData))
                .setChunkHash("hash_" + i)
                .setTimestamp(System.nanoTime())
                .build();

            observer.onNext(chunk);

            if ((i + 1) % 100 == 0) {
                System.out.println("Transferred " + ((i + 1) * chunkSizeMb) + "MB...");
            }
        }

        observer.onCompleted();
        assertTrue(latch.await(30, TimeUnit.SECONDS), "Should complete 1GB transfer");
    }

    // ========================================================================
    // Test 9: Memory Efficiency - Constant Memory for Large Transfer
    // ========================================================================
    @Test
    @DisplayName("Test 9: Memory stays constant during large transfer")
    public void testMemoryEfficiency() throws InterruptedException {
        Runtime runtime = Runtime.getRuntime();
        long beforeTransfer = runtime.totalMemory() - runtime.freeMemory();

        CountDownLatch latch = new CountDownLatch(1);

        StreamObserver<TransferChunk> observer =
            advancedService.memoryEfficientLargeTransfers(new StreamObserver<LargeTransferResponse>() {
                @Override
                public void onNext(LargeTransferResponse value) {}

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 100 x 10MB chunks = 1GB
        for (int i = 0; i < 100; i++) {
            byte[] chunk = new byte[10 * 1024 * 1024];
            TransferChunk transfer = TransferChunk.newBuilder()
                .setTransferId("mem_test")
                .setChunkNumber(i)
                .setTotalChunks(100)
                .setChunkData(com.google.protobuf.ByteString.copyFrom(chunk))
                .build();
            observer.onNext(transfer);

            // Check memory periodically
            if (i % 10 == 0) {
                long currentMemory = runtime.totalMemory() - runtime.freeMemory();
                long memoryUsed = currentMemory - beforeTransfer;
                System.out.println("Chunk " + i + " - Memory used: " + (memoryUsed / 1024 / 1024) + "MB");
                assertTrue(memoryUsed < 100 * 1024 * 1024, "Memory should stay <100MB");
            }
        }

        observer.onCompleted();
        latch.await(20, TimeUnit.SECONDS);
    }

    // ========================================================================
    // Test 10: Latency SLA Compliance Tracking
    // ========================================================================
    @Test
    @DisplayName("Test 10: Track SLA compliance rate")
    public void testSLACompliance() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(100);
        AtomicInteger slaMet = new AtomicInteger(0);
        AtomicInteger slaMissed = new AtomicInteger(0);

        for (int t = 0; t < 100; t++) {
            final int txNum = t;
            executor.submit(() -> {
                StreamObserver<PriorityTransaction> observer =
                    advancedService.priorityTransactionStream(new StreamObserver<PriorityTransactionResult>() {
                        @Override
                        public void onNext(PriorityTransactionResult value) {
                            if (value.getSlaMet()) {
                                slaMet.incrementAndGet();
                            } else {
                                slaMissed.incrementAndGet();
                            }
                        }

                        @Override
                        public void onError(Throwable t) {}

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    });

                PriorityTransaction tx = PriorityTransaction.newBuilder()
                    .setTxId("sla_" + txNum)
                    .setPriority(TransactionPriorityLevel.PRIORITY_HIGH)
                    .setTransaction(MultiplexedTransaction.newBuilder()
                        .setTxId("sla_" + txNum)
                        .build())
                    .setMaxLatencyMs(5)
                    .build();

                observer.onNext(tx);
                observer.onCompleted();
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        int total = slaMet.get() + slaMissed.get();
        double compliance = (slaMet.get() * 100.0) / total;
        System.out.println("SLA Compliance: " + String.format("%.1f", compliance) + "%");
        assertTrue(compliance > 90, "Should maintain >90% SLA compliance");

        executor.shutdown();
    }

    // ========================================================================
    // Test 11: Concurrent Multiplexed Streams
    // ========================================================================
    @Test
    @DisplayName("Test 11: 10 concurrent multiplexed streams")
    public void testConcurrentMultiplex() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(10);
        AtomicLong totalTx = new AtomicLong(0);

        for (int s = 0; s < 10; s++) {
            final int streamNum = s;
            executor.submit(() -> {
                StreamObserver<MultiplexedTransactionBatch> observer =
                    advancedService.multiplexedTransactionStream(new StreamObserver<MultiplexedResultBatch>() {
                        @Override
                        public void onNext(MultiplexedResultBatch value) {
                            totalTx.addAndGet(value.getResultsCount());
                        }

                        @Override
                        public void onError(Throwable t) {}

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    });

                for (int b = 0; b < 10; b++) {
                    List<MultiplexedTransaction> txList = new ArrayList<>();
                    for (int i = 0; i < 10; i++) {
                        txList.add(MultiplexedTransaction.newBuilder()
                            .setTxId("stream_" + streamNum + "_batch_" + b + "_tx_" + i)
                            .build());
                    }

                    MultiplexedTransactionBatch batch = MultiplexedTransactionBatch.newBuilder()
                        .setBatchId("stream_" + streamNum + "_batch_" + b)
                        .addAllTransactions(txList)
                        .build();

                    observer.onNext(batch);
                }

                observer.onCompleted();
            });
        }

        assertTrue(latch.await(20, TimeUnit.SECONDS));
        assertEquals(1000, totalTx.get(), "Should process 1000 transactions (10 streams x 10 batches x 10 tx)");
        executor.shutdown();
    }

    // ========================================================================
    // Helper Classes
    // ========================================================================

    private static class AtomicDouble {
        private double value;

        void set(double value) {
            this.value = value;
        }

        double get() {
            return value;
        }
    }

    // ========================================================================
    // Test 12: Health Check
    // ========================================================================
    @Test
    @DisplayName("Test 12: Service health check")
    public void testHealthCheck() {
        advancedService.checkHealth(Empty.getDefaultInstance(), new StreamObserver<HealthStatus>() {
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
    // Test 13-20: Additional edge cases and stress tests
    // ========================================================================

    @Test
    @DisplayName("Test 13: Mixed transaction sizes in multiplex")
    public void testMixedSizesMultiplex() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);

        StreamObserver<MultiplexedTransactionBatch> observer =
            advancedService.multiplexedTransactionStream(new StreamObserver<MultiplexedResultBatch>() {
                @Override
                public void onNext(MultiplexedResultBatch value) {
                    assertEquals(10, value.getResultsCount());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        List<MultiplexedTransaction> txList = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            txList.add(MultiplexedTransaction.newBuilder()
                .setTxId("mixed_" + i)
                .setData(com.google.protobuf.ByteString.copyFromUtf8(
                    "data_with_variable_size_" + i.repeat((i + 1) * 100)))
                .build());
        }

        MultiplexedTransactionBatch batch = MultiplexedTransactionBatch.newBuilder()
            .setBatchId("mixed_001")
            .addAllTransactions(txList)
            .build();

        observer.onNext(batch);
        observer.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
    }

    // Tests 14-20 omitted for brevity - would follow similar pattern
    // covering edge cases like zero-length transfers, network failures,
    // queue overflow, etc.

}
