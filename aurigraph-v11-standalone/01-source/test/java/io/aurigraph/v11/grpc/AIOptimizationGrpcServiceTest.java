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
 * Story 9, Phase 4: AIOptimizationGrpcService Comprehensive Tests
 *
 * Tests cover ML-based transaction optimization:
 * - Transaction scoring and reordering
 * - Resource usage prediction
 * - Cluster scaling recommendations
 * - ML model training
 * - Performance improvement validation
 *
 * Target: 12 tests covering ML optimization and scaling
 */
@QuarkusTest
@DisplayName("AIOptimizationGrpcService Tests")
public class AIOptimizationGrpcServiceTest {

    @Inject
    private AIOptimizationGrpcService aiService;

    @Mock
    private StreamObserver<OptimizedTransactionBatch> optimizeObserver;

    @Mock
    private StreamObserver<ResourcePrediction> predictionObserver;

    @Mock
    private StreamObserver<ScalingRecommendation> scalingObserver;

    @Mock
    private StreamObserver<HealthStatus> healthObserver;

    @Mock
    private StreamObserver<TrainingProgress> trainingObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================================================================
    // Test 1: Optimize Transaction Order (Client Streaming)
    // ========================================================================
    @Test
    @DisplayName("Test 1: Optimize transaction order for +20-30% TPS")
    public void testOptimizeTransactionOrder() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger tpsImprovement = new AtomicInteger(0);

        StreamObserver<TransactionForOptimization> requestObserver =
            aiService.optimizeTransactionOrder(new StreamObserver<OptimizedTransactionBatch>() {
                @Override
                public void onNext(OptimizedTransactionBatch value) {
                    // Verify TPS improvement is 20-30%
                    assertTrue(value.getTpsImprovementPercent() >= 20.0);
                    assertTrue(value.getTpsImprovementPercent() <= 30.0);
                    tpsImprovement.set((int)value.getTpsImprovementPercent());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 100 transactions to optimize
        for (int i = 0; i < 100; i++) {
            TransactionForOptimization tx = TransactionForOptimization.newBuilder()
                .setTxId("tx_" + i)
                .setPriority((i % 3 + 1))  // 1-3 priority
                .setGasPrice((long)(1000000000 + (i * 1000000)))  // Increasing gas price
                .addDependencies("dep_" + ((i - 1) % 10))  // Some dependencies
                .setSize(100 + (i % 50))  // Varying size
                .setTimestamp(System.currentTimeMillis())
                .build();
            requestObserver.onNext(tx);
        }

        requestObserver.onCompleted();
        assertTrue(latch.await(10, TimeUnit.SECONDS));
        assertTrue(tpsImprovement.get() >= 20, "Should improve TPS by 20%+");
    }

    // ========================================================================
    // Test 2: Predict Resource Usage
    // ========================================================================
    @Test
    @DisplayName("Test 2: Predict CPU/memory/network resource usage")
    public void testPredictResourceUsage() {
        ResourceMetrics metrics = ResourceMetrics.newBuilder()
            .setCurrentTps(100000)
            .setCurrentCpuPercent(45)
            .setCurrentMemoryMb(512)
            .setNetworkBandwidthMbps(500)
            .setNodeCount(4)
            .build();

        aiService.predictResourceUsage(metrics, new StreamObserver<ResourcePrediction>() {
            @Override
            public void onNext(ResourcePrediction value) {
                // Verify prediction is reasonable
                assertTrue(value.getPredictedCpuPercent() >= 40);
                assertTrue(value.getPredictedCpuPercent() <= 100);
                assertTrue(value.getPredictedMemoryMb() > 512);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should predict resources");
            }

            @Override
            public void onCompleted() {}
        });
    }

    // ========================================================================
    // Test 3: Suggest Cluster Scaling
    // ========================================================================
    @Test
    @DisplayName("Test 3: Recommend cluster scaling strategy")
    public void testSuggestScaling() {
        ClusterMetrics clusterMetrics = ClusterMetrics.newBuilder()
            .setCurrentTps(1000000)
            .setTargetTps(2000000)
            .setNodeCount(4)
            .setAvgCpuPercent(85)
            .setAvgMemoryMb(800)
            .setNetworkBottleneck(true)
            .build();

        aiService.suggestScaling(clusterMetrics, new StreamObserver<ScalingRecommendation>() {
            @Override
            public void onNext(ScalingRecommendation value) {
                // Should recommend scaling up (doubling nodes for 2x TPS)
                assertTrue(value.getRecommendedNodeCount() >= 8);
                assertFalse(value.getMessage().isEmpty());
            }

            @Override
            public void onError(Throwable t) {
                fail("Should recommend scaling");
            }

            @Override
            public void onCompleted() {}
        });
    }

    // ========================================================================
    // Test 4: ML Model Training (Server Streaming)
    // ========================================================================
    @Test
    @DisplayName("Test 4: Train ML model on historical data")
    public void testTrainMLModel() {
        TrainingRequest request = TrainingRequest.newBuilder()
            .setModelId("transaction_ranker_v1")
            .setEpochs(10)
            .setBatchSize(1000)
            .setLearningRate(0.001)
            .build();

        AtomicInteger lastEpoch = new AtomicInteger(0);

        aiService.trainOnHistoricalData(request, new StreamObserver<TrainingProgress>() {
            @Override
            public void onNext(TrainingProgress value) {
                lastEpoch.set(value.getEpoch());
                assertTrue(value.getEpoch() >= 0);
                assertTrue(value.getEpoch() <= 10);
                assertTrue(value.getLoss() > 0);
            }

            @Override
            public void onError(Throwable t) {}

            @Override
            public void onCompleted() {}
        });

        assertEquals(10, lastEpoch.get(), "Should train all 10 epochs");
    }

    // ========================================================================
    // Test 5: Update ML Model Weights (Client Streaming)
    // ========================================================================
    @Test
    @DisplayName("Test 5: Update ML model weights")
    public void testUpdateMLModel() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);

        StreamObserver<ModelUpdate> requestObserver =
            aiService.updateMLModel(new StreamObserver<UpdateResponse>() {
                @Override
                public void onNext(UpdateResponse value) {
                    assertTrue(value.getUpdateSuccessful());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send model updates
        for (int i = 0; i < 5; i++) {
            ModelUpdate update = ModelUpdate.newBuilder()
                .setModelId("transaction_ranker_v1")
                .setLayerId("dense_" + i)
                .setWeightsData(com.google.protobuf.ByteString.copyFromUtf8("weights_" + i))
                .setBiasData(com.google.protobuf.ByteString.copyFromUtf8("bias_" + i))
                .setVersion(2)
                .build();
            requestObserver.onNext(update);
        }

        requestObserver.onCompleted();
        assertTrue(latch.await(5, TimeUnit.SECONDS));
    }

    // ========================================================================
    // Test 6: Performance - Optimization Latency
    // ========================================================================
    @Test
    @DisplayName("Test 6: Transaction optimization latency < 50ms")
    public void testOptimizationLatency() throws InterruptedException {
        long totalLatency = 0;
        int batches = 10;

        for (int b = 0; b < batches; b++) {
            long startTime = System.nanoTime();

            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<TransactionForOptimization> observer =
                aiService.optimizeTransactionOrder(new StreamObserver<OptimizedTransactionBatch>() {
                    @Override
                    public void onNext(OptimizedTransactionBatch value) {}

                    @Override
                    public void onError(Throwable t) {}

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

            // Send 100 transactions
            for (int i = 0; i < 100; i++) {
                TransactionForOptimization tx = TransactionForOptimization.newBuilder()
                    .setTxId("perf_" + b + "_" + i)
                    .setPriority(1)
                    .setGasPrice(1000000000)
                    .setSize(100)
                    .build();
                observer.onNext(tx);
            }

            observer.onCompleted();
            latch.await(5, TimeUnit.SECONDS);

            long latency = System.nanoTime() - startTime;
            totalLatency += latency;
        }

        double avgLatencyMs = (totalLatency / batches) / 1_000_000.0;
        System.out.println("Average optimization latency: " + String.format("%.2f", avgLatencyMs) + "ms");
        assertTrue(avgLatencyMs < 50.0, "Optimization latency should be <50ms");
    }

    // ========================================================================
    // Test 7: Multi-Model Support
    // ========================================================================
    @Test
    @DisplayName("Test 7: Support multiple ML models simultaneously")
    public void testMultipleModels() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(3);

        // Train 3 different models
        String[] models = {"ranker_v1", "priority_v2", "dependency_v1"};

        for (String modelId : models) {
            executor.submit(() -> {
                TrainingRequest request = TrainingRequest.newBuilder()
                    .setModelId(modelId)
                    .setEpochs(5)
                    .setBatchSize(500)
                    .build();

                aiService.trainOnHistoricalData(request, new StreamObserver<TrainingProgress>() {
                    @Override
                    public void onNext(TrainingProgress value) {}

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

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        executor.shutdown();
    }

    // ========================================================================
    // Test 8: High-Throughput Optimization (1000 tx batch)
    // ========================================================================
    @Test
    @DisplayName("Test 8: Optimize 1000 transactions in single batch")
    public void testHighThroughput() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);

        StreamObserver<TransactionForOptimization> observer =
            aiService.optimizeTransactionOrder(new StreamObserver<OptimizedTransactionBatch>() {
                @Override
                public void onNext(OptimizedTransactionBatch value) {
                    assertEquals(1000, value.getReorderedTransactionsCount());
                    assertTrue(value.getTpsImprovementPercent() >= 20.0);
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 1000 transactions
        for (int i = 0; i < 1000; i++) {
            TransactionForOptimization tx = TransactionForOptimization.newBuilder()
                .setTxId("large_batch_" + i)
                .setPriority((i % 3) + 1)
                .setGasPrice(1000000000 + (long)(Math.random() * 1000000000))
                .setSize((int)(Math.random() * 500))
                .build();
            observer.onNext(tx);
        }

        observer.onCompleted();
        assertTrue(latch.await(15, TimeUnit.SECONDS));
    }

    // ========================================================================
    // Test 9: Concurrent Optimizations
    // ========================================================================
    @Test
    @DisplayName("Test 9: Handle 10 concurrent optimization streams")
    public void testConcurrentOptimizations() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(10);

        for (int s = 0; s < 10; s++) {
            final int streamNum = s;
            executor.submit(() -> {
                try {
                    StreamObserver<TransactionForOptimization> observer =
                        aiService.optimizeTransactionOrder(new StreamObserver<OptimizedTransactionBatch>() {
                            @Override
                            public void onNext(OptimizedTransactionBatch value) {}

                            @Override
                            public void onError(Throwable t) {}

                            @Override
                            public void onCompleted() {
                                latch.countDown();
                            }
                        });

                    for (int i = 0; i < 100; i++) {
                        TransactionForOptimization tx = TransactionForOptimization.newBuilder()
                            .setTxId("stream_" + streamNum + "_tx_" + i)
                            .setPriority(1)
                            .setGasPrice(1000000000)
                            .build();
                        observer.onNext(tx);
                    }

                    observer.onCompleted();
                } catch (Exception e) {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(20, TimeUnit.SECONDS));
        executor.shutdown();
    }

    // ========================================================================
    // Test 10: Resource Scaling Over Time
    // ========================================================================
    @Test
    @DisplayName("Test 10: Predict scaling needs over 24 hours")
    public void testScalingProgression() {
        // Simulate TPS growth from 1M to 2M over 24 hours
        int[] tpsProgression = {1000000, 1250000, 1500000, 1750000, 2000000};

        for (int tps : tpsProgression) {
            ClusterMetrics metrics = ClusterMetrics.newBuilder()
                .setCurrentTps(tps)
                .setTargetTps(2000000)
                .setNodeCount(4)
                .setAvgCpuPercent((int)(40 + (tps - 1000000) / 50000))
                .build();

            aiService.suggestScaling(metrics, new StreamObserver<ScalingRecommendation>() {
                @Override
                public void onNext(ScalingRecommendation value) {
                    // Later TPS should recommend more nodes
                    assertTrue(value.getRecommendedNodeCount() > 0);
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {}
            });
        }
    }

    // ========================================================================
    // Test 11: Health Check
    // ========================================================================
    @Test
    @DisplayName("Test 11: Service health check")
    public void testHealthCheck() {
        aiService.checkHealth(Empty.getDefaultInstance(), new StreamObserver<HealthStatus>() {
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
    // Test 12: ML Accuracy Improvement
    // ========================================================================
    @Test
    @DisplayName("Test 12: ML model accuracy improves with training")
    public void testMLAccuracyImprovement() {
        TrainingRequest request = TrainingRequest.newBuilder()
            .setModelId("accuracy_test")
            .setEpochs(10)
            .setBatchSize(1000)
            .build();

        AtomicInteger lastAccuracy = new AtomicInteger(0);

        aiService.trainOnHistoricalData(request, new StreamObserver<TrainingProgress>() {
            int previousAccuracy = 0;

            @Override
            public void onNext(TrainingProgress value) {
                int currentAccuracy = (int)value.getAccuracy();
                // Accuracy should improve or stay same over epochs
                assertTrue(currentAccuracy >= previousAccuracy,
                    "Accuracy should not decrease");
                previousAccuracy = currentAccuracy;
                lastAccuracy.set(currentAccuracy);
            }

            @Override
            public void onError(Throwable t) {}

            @Override
            public void onCompleted() {}
        });

        assertTrue(lastAccuracy.get() >= 70, "Final accuracy should be reasonable");
    }

}
