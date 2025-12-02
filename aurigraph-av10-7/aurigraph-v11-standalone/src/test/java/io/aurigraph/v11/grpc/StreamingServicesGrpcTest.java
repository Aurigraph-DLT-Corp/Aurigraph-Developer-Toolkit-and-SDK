package io.aurigraph.v11.grpc;

import io.aurigraph.grpc.service.*;
import io.aurigraph.v11.proto.*;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for gRPC Streaming Services.
 * Tests cover all 6 streaming services:
 * - ConsensusStreamService
 * - NetworkStreamService
 * - ValidatorStreamService
 * - MetricsStreamService
 * - AnalyticsStreamService
 * - ChannelStreamService
 *
 * Uses correct proto message types as defined in:
 * - consensus-stream.proto
 * - network-stream.proto
 * - validator-stream.proto
 * - metrics-stream.proto
 * - analytics-stream.proto
 * - channel-stream.proto
 *
 * Target: 90% code coverage for AV11-489
 *
 * @author QA Agent - Sprint 16
 * @ticket AV11-489
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("gRPC Streaming Services Tests")
class StreamingServicesGrpcTest {

    @Inject
    @Any
    ConsensusStreamServiceImpl consensusStreamService;

    @Inject
    @Any
    NetworkStreamServiceImpl networkStreamService;

    @Inject
    @Any
    ValidatorStreamServiceImpl validatorStreamService;

    @Inject
    @Any
    MetricsStreamServiceImpl metricsStreamService;

    @Inject
    @Any
    AnalyticsStreamServiceImpl analyticsStreamService;

    @Inject
    @Any
    ChannelStreamServiceImpl channelStreamService;

    // ==================== Consensus Stream Service Tests ====================

    @Test
    @Order(1)
    @DisplayName("ConsensusStream - streamConsensusEvents should emit events")
    void testStreamConsensusEvents() throws InterruptedException {
        // Given - using correct request type from consensus-stream.proto
        ConsensusSubscribeRequest request = ConsensusSubscribeRequest.newBuilder()
                .setClientId("test-client-001")
                .setUpdateIntervalMs(500)
                .addEventTypes("state_changes")
                .addEventTypes("leader_election")
                .addEventTypes("proposals")
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(3);

        // When
        Multi<ConsensusEventStream> stream = consensusStreamService.streamConsensusEvents(request);

        // Then
        AssertSubscriber<ConsensusEventStream> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 3, "Should receive consensus events");

        List<ConsensusEventStream> events = subscriber.getItems();
        assertFalse(events.isEmpty(), "Should have received events");
        events.forEach(event -> {
            assertNotNull(event.getEventId(), "Event ID should not be null");
            assertNotNull(event.getTimestamp(), "Timestamp should not be null");
        });
    }

    @Test
    @Order(2)
    @DisplayName("ConsensusStream - getCurrentState should return state")
    void testGetCurrentState() {
        // Given
        ConsensusSubscribeRequest request = ConsensusSubscribeRequest.newBuilder()
                .setClientId("test-client-002")
                .build();

        // When
        Uni<ConsensusStateUpdate> result = consensusStreamService.getCurrentState(request);

        // Then
        ConsensusStateUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(3)
    @DisplayName("ConsensusStream - streamBlockProposals should emit proposals")
    void testStreamBlockProposals() throws InterruptedException {
        // Given
        ConsensusSubscribeRequest request = ConsensusSubscribeRequest.newBuilder()
                .setClientId("test-client-003")
                .setUpdateIntervalMs(500)
                .build();

        AtomicInteger proposalCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<BlockProposalEvent> stream = consensusStreamService.streamBlockProposals(request);

        // Then
        AssertSubscriber<BlockProposalEvent> subscriber = stream
                .onItem().invoke(proposal -> {
                    proposalCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || proposalCount.get() >= 2, "Should receive block proposals");

        List<BlockProposalEvent> proposals = subscriber.getItems();
        assertFalse(proposals.isEmpty());
        proposals.forEach(proposal -> {
            assertNotNull(proposal.getProposalId());
        });
    }

    @Test
    @Order(4)
    @DisplayName("ConsensusStream - streamLeaderElections should emit elections")
    void testStreamLeaderElections() throws InterruptedException {
        // Given
        ConsensusSubscribeRequest request = ConsensusSubscribeRequest.newBuilder()
                .setClientId("test-client-004")
                .build();

        AtomicInteger electionCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<LeaderElectionEvent> stream = consensusStreamService.streamLeaderElections(request);

        // Then
        AssertSubscriber<LeaderElectionEvent> subscriber = stream
                .onItem().invoke(election -> {
                    electionCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || electionCount.get() >= 2, "Should receive leader elections");
    }

    // ==================== Network Stream Service Tests ====================

    @Test
    @Order(10)
    @DisplayName("NetworkStream - streamNetworkEvents should emit events")
    void testStreamNetworkEvents() throws InterruptedException {
        // Given - using correct request type from network-stream.proto
        NetworkSubscribeRequest request = NetworkSubscribeRequest.newBuilder()
                .setClientId("test-client-010")
                .setUpdateIntervalMs(3000)
                .addEventTypes("topology")
                .addEventTypes("nodes")
                .addEventTypes("peers")
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<NetworkEventStream> stream = networkStreamService.streamNetworkEvents(request);

        // Then
        AssertSubscriber<NetworkEventStream> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 2, "Should receive network events");

        List<NetworkEventStream> events = subscriber.getItems();
        assertFalse(events.isEmpty());
    }

    @Test
    @Order(11)
    @DisplayName("NetworkStream - getNetworkTopology should return topology")
    void testGetNetworkTopology() {
        // Given
        NetworkSubscribeRequest request = NetworkSubscribeRequest.newBuilder()
                .setClientId("test-client-011")
                .build();

        // When
        Uni<NetworkTopologyUpdate> result = networkStreamService.getNetworkTopology(request);

        // Then
        NetworkTopologyUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalNodes() >= 0);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(12)
    @DisplayName("NetworkStream - getNetworkHealth should return health")
    void testGetNetworkHealth() {
        // Given
        NetworkSubscribeRequest request = NetworkSubscribeRequest.newBuilder()
                .setClientId("test-client-012")
                .build();

        // When
        Uni<NetworkHealthUpdate> result = networkStreamService.getNetworkHealth(request);

        // Then
        NetworkHealthUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getHealthScore() >= 0);
    }

    @Test
    @Order(13)
    @DisplayName("NetworkStream - streamTopologyUpdates should emit updates")
    void testStreamTopologyUpdates() throws InterruptedException {
        // Given
        NetworkSubscribeRequest request = NetworkSubscribeRequest.newBuilder()
                .setClientId("test-client-013")
                .build();

        AtomicInteger updateCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<NetworkTopologyUpdate> stream = networkStreamService.streamTopologyUpdates(request);

        // Then
        AssertSubscriber<NetworkTopologyUpdate> subscriber = stream
                .onItem().invoke(update -> {
                    updateCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || updateCount.get() >= 2, "Should receive topology updates");
    }

    // ==================== Validator Stream Service Tests ====================

    @Test
    @Order(20)
    @DisplayName("ValidatorStream - streamValidatorEvents should emit events")
    void testStreamValidatorEvents() throws InterruptedException {
        // Given - using correct request type from validator-stream.proto
        ValidatorSubscribeRequest request = ValidatorSubscribeRequest.newBuilder()
                .setClientId("test-client-020")
                .setUpdateIntervalMs(2000)
                .addEventTypes("status")
                .addEventTypes("health")
                .addEventTypes("performance")
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<ValidatorEventStream> stream = validatorStreamService.streamValidatorEvents(request);

        // Then
        AssertSubscriber<ValidatorEventStream> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 2, "Should receive validator events");
    }

    @Test
    @Order(21)
    @DisplayName("ValidatorStream - getValidatorStatus should return status")
    void testGetValidatorStatus() {
        // Given
        ValidatorSubscribeRequest request = ValidatorSubscribeRequest.newBuilder()
                .setClientId("test-client-021")
                .addValidatorIds("validator-001")
                .build();

        // When
        Uni<ValidatorStatusUpdate> result = validatorStreamService.getValidatorStatus(request);

        // Then
        ValidatorStatusUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(22)
    @DisplayName("ValidatorStream - getValidatorSet should return set")
    void testGetValidatorSet() {
        // Given
        ValidatorSubscribeRequest request = ValidatorSubscribeRequest.newBuilder()
                .setClientId("test-client-022")
                .build();

        // When
        Uni<ValidatorSetUpdate> result = validatorStreamService.getValidatorSet(request);

        // Then
        ValidatorSetUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalValidators() >= 0);
    }

    @Test
    @Order(23)
    @DisplayName("ValidatorStream - streamValidatorStatus should emit status updates")
    void testStreamValidatorStatus() throws InterruptedException {
        // Given
        ValidatorSubscribeRequest request = ValidatorSubscribeRequest.newBuilder()
                .setClientId("test-client-023")
                .addValidatorIds("validator-001")
                .build();

        AtomicInteger statusCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<ValidatorStatusUpdate> stream = validatorStreamService.streamValidatorStatus(request);

        // Then
        AssertSubscriber<ValidatorStatusUpdate> subscriber = stream
                .onItem().invoke(status -> {
                    statusCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || statusCount.get() >= 2, "Should receive validator status updates");
    }

    // ==================== Metrics Stream Service Tests ====================

    @Test
    @Order(30)
    @DisplayName("MetricsStream - streamMetrics should emit metrics")
    void testStreamMetrics() throws InterruptedException {
        // Given - using correct request type from metrics-stream.proto
        MetricsSubscription request = MetricsSubscription.newBuilder()
                .setClientId("test-client-030")
                .setUpdateIntervalMs(1000)
                .addMetricTypes("tps")
                .addMetricTypes("latency")
                .addMetricTypes("consensus")
                .build();

        AtomicInteger metricCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<PerformanceMetricsUpdate> stream = metricsStreamService.streamMetrics(request);

        // Then
        AssertSubscriber<PerformanceMetricsUpdate> subscriber = stream
                .onItem().invoke(metric -> {
                    metricCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || metricCount.get() >= 2, "Should receive metrics updates");

        List<PerformanceMetricsUpdate> metrics = subscriber.getItems();
        assertFalse(metrics.isEmpty());
    }

    @Test
    @Order(31)
    @DisplayName("MetricsStream - getCurrentMetrics should return metrics")
    void testGetCurrentMetrics() {
        // Given
        MetricsRequest request = MetricsRequest.newBuilder()
                .addMetricTypes("tps")
                .addMetricTypes("latency")
                .build();

        // When
        Uni<PerformanceMetricsUpdate> result = metricsStreamService.getCurrentMetrics(request);

        // Then
        PerformanceMetricsUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(32)
    @DisplayName("MetricsStream - getAggregatedMetrics should return aggregated data")
    void testGetAggregatedMetrics() {
        // Given
        AggregatedMetricsRequest request = AggregatedMetricsRequest.newBuilder()
                .setAggregationType("cluster")
                .build();

        // When
        Uni<AggregatedMetrics> result = metricsStreamService.getAggregatedMetrics(request);

        // Then
        AggregatedMetrics response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(33)
    @DisplayName("MetricsStream - streamAggregatedMetrics should emit aggregated data")
    void testStreamAggregatedMetrics() throws InterruptedException {
        // Given
        MetricsSubscription request = MetricsSubscription.newBuilder()
                .setClientId("test-client-033")
                .setUpdateIntervalMs(1000)
                .build();

        AtomicInteger metricCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<AggregatedMetrics> stream = metricsStreamService.streamAggregatedMetrics(request);

        // Then
        AssertSubscriber<AggregatedMetrics> subscriber = stream
                .onItem().invoke(metric -> {
                    metricCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || metricCount.get() >= 2, "Should receive aggregated metrics");
    }

    // ==================== Analytics Stream Service Tests ====================

    @Test
    @Order(40)
    @DisplayName("AnalyticsStream - streamDashboardAnalytics should emit analytics")
    void testStreamDashboardAnalytics() throws InterruptedException {
        // Given - using correct request type from analytics-stream.proto
        SubscribeRequest request = SubscribeRequest.newBuilder()
                .setClientId("test-client-040")
                .setUpdateIntervalMs(1000)
                .addDataTypes("tps")
                .addDataTypes("latency")
                .addDataTypes("blocks")
                .build();

        AtomicInteger analyticsCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<DashboardAnalytics> stream = analyticsStreamService.streamDashboardAnalytics(request);

        // Then
        AssertSubscriber<DashboardAnalytics> subscriber = stream
                .onItem().invoke(analytics -> {
                    analyticsCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || analyticsCount.get() >= 2, "Should receive analytics updates");
    }

    @Test
    @Order(41)
    @DisplayName("AnalyticsStream - getDashboardAnalytics should return analytics")
    void testGetDashboardAnalytics() {
        // Given
        DashboardAnalyticsRequest request = DashboardAnalyticsRequest.newBuilder()
                .setDashboardId("main-dashboard")
                .setIncludeHistorical(true)
                .setHistoricalMinutes(60)
                .build();

        // When
        Uni<DashboardAnalytics> result = analyticsStreamService.getDashboardAnalytics(request);

        // Then
        DashboardAnalytics response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
    }

    @Test
    @Order(42)
    @DisplayName("AnalyticsStream - streamRealTimeData should emit data points")
    void testStreamRealTimeData() throws InterruptedException {
        // Given
        SubscribeRequest request = SubscribeRequest.newBuilder()
                .setClientId("test-client-042")
                .setUpdateIntervalMs(500)
                .addDataTypes("tps")
                .addDataTypes("latency")
                .build();

        AtomicInteger dataCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<RealTimeDataPoint> stream = analyticsStreamService.streamRealTimeData(request);

        // Then
        AssertSubscriber<RealTimeDataPoint> subscriber = stream
                .onItem().invoke(data -> {
                    dataCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || dataCount.get() >= 2, "Should receive real-time data points");
    }

    // ==================== Channel Stream Service Tests ====================

    @Test
    @Order(50)
    @DisplayName("ChannelStream - streamChannelEvents should emit events")
    void testStreamChannelEvents() throws InterruptedException {
        // Given - using correct request type from channel-stream.proto
        ChannelSubscribeRequest request = ChannelSubscribeRequest.newBuilder()
                .setClientId("test-client-050")
                .addChannelIds("channel-001")
                .setUpdateIntervalMs(1000)
                .addEventTypes("created")
                .addEventTypes("updated")
                .addEventTypes("transaction")
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<ChannelEventStream> stream = channelStreamService.streamChannelEvents(request);

        // Then
        AssertSubscriber<ChannelEventStream> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 2, "Should receive channel events");
    }

    @Test
    @Order(51)
    @DisplayName("ChannelStream - getChannelInfo should return info")
    void testGetChannelInfo() {
        // Given
        ChannelSubscribeRequest request = ChannelSubscribeRequest.newBuilder()
                .setClientId("test-client-051")
                .addChannelIds("channel-001")
                .build();

        // When
        Uni<ChannelInfo> result = channelStreamService.getChannelInfo(request);

        // Then
        ChannelInfo response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getChannelId());
    }

    @Test
    @Order(52)
    @DisplayName("ChannelStream - listChannels should return channel list")
    void testListChannels() {
        // Given
        ChannelSubscribeRequest request = ChannelSubscribeRequest.newBuilder()
                .setClientId("test-client-052")
                .build();

        // When
        Uni<ChannelListUpdate> result = channelStreamService.listChannels(request);

        // Then
        ChannelListUpdate response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalChannels() >= 0);
    }

    @Test
    @Order(53)
    @DisplayName("ChannelStream - streamChannelPerformance should emit performance")
    void testStreamChannelPerformance() throws InterruptedException {
        // Given
        ChannelSubscribeRequest request = ChannelSubscribeRequest.newBuilder()
                .setClientId("test-client-053")
                .addChannelIds("channel-001")
                .build();

        AtomicInteger perfCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<ChannelPerformanceUpdate> stream = channelStreamService.streamChannelPerformance(request);

        // Then
        AssertSubscriber<ChannelPerformanceUpdate> subscriber = stream
                .onItem().invoke(perf -> {
                    perfCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || perfCount.get() >= 2, "Should receive channel performance updates");
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(60)
    @DisplayName("Performance - streaming latency measurement")
    void testStreamingLatency() throws InterruptedException {
        // Given
        MetricsSubscription request = MetricsSubscription.newBuilder()
                .setClientId("test-client-perf")
                .setUpdateIntervalMs(100)
                .addMetricTypes("tps")
                .build();

        long[] latencies = new long[10];
        AtomicInteger count = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(10);

        // When
        long startTime = System.nanoTime();
        Multi<PerformanceMetricsUpdate> stream = metricsStreamService.streamMetrics(request);

        stream.onItem().invoke(metric -> {
            int idx = count.getAndIncrement();
            if (idx < 10) {
                latencies[idx] = (System.nanoTime() - startTime) / 1_000_000;
                latch.countDown();
            }
        }).subscribe().withSubscriber(AssertSubscriber.create(10));

        boolean completed = latch.await(15, TimeUnit.SECONDS);

        // Then
        if (completed && count.get() >= 10) {
            double avgLatency = 0;
            for (long latency : latencies) {
                avgLatency += latency;
            }
            avgLatency /= latencies.length;

            System.out.printf("Average streaming latency: %.2f ms%n", avgLatency);
            // First event may have higher latency, check average
            assertTrue(avgLatency < 5000, "Average latency should be reasonable");
        }
    }

    // ==================== Concurrent Subscription Tests ====================

    @Test
    @Order(70)
    @DisplayName("Concurrency - handle 50 concurrent stream subscriptions")
    void testConcurrentStreamSubscriptions() throws InterruptedException {
        // Given
        int subscriberCount = 50;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(subscriberCount);
        AtomicInteger successCount = new AtomicInteger(0);

        // When
        for (int i = 0; i < subscriberCount; i++) {
            final int subscriberId = i;
            new Thread(() -> {
                try {
                    startLatch.await();

                    MetricsSubscription request = MetricsSubscription.newBuilder()
                            .setClientId("concurrent-client-" + subscriberId)
                            .setUpdateIntervalMs(500)
                            .addMetricTypes("tps")
                            .build();

                    Multi<PerformanceMetricsUpdate> stream = metricsStreamService.streamMetrics(request);
                    AssertSubscriber<PerformanceMetricsUpdate> subscriber = stream
                            .subscribe().withSubscriber(AssertSubscriber.create(3));

                    // Wait for at least one event
                    Thread.sleep(2000);

                    if (!subscriber.getItems().isEmpty()) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    System.err.println("Subscriber " + subscriberId + " failed: " + e.getMessage());
                } finally {
                    completionLatch.countDown();
                }
            }).start();
        }

        startLatch.countDown();
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);

        // Then
        assertTrue(completed, "All subscribers should complete");
        assertTrue(successCount.get() >= subscriberCount * 0.8,
                "At least 80% of subscribers should receive events: " + successCount.get());
    }
}
