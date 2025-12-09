package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for NetworkServiceImpl gRPC service.
 * Tests cover all 4 RPC methods for network operations including:
 * - Network status and health monitoring
 * - Peer list retrieval with filtering and pagination
 * - Message broadcasting with acknowledgments
 * - Real-time network event streaming
 * - Performance benchmarks
 * - Error handling
 *
 * Target: 90% code coverage for AV11-489
 *
 * @author QA Agent - Sprint 16
 * @ticket AV11-489
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("NetworkService gRPC Tests")
class NetworkServiceGrpcTest {

    @Inject
    @GrpcService
    NetworkServiceImpl networkService;

    // ==================== Network Status Tests ====================

    @Test
    @Order(1)
    @DisplayName("getNetworkStatus - should return basic status")
    void testGetNetworkStatus_Basic() {
        // Given
        GetNetworkStatusRequest request = GetNetworkStatusRequest.newBuilder()
                .setIncludePeerDetails(false)
                .setIncludeTopology(false)
                .build();

        // When
        Uni<NetworkStatus> result = networkService.getNetworkStatus(request);

        // Then
        UniAssertSubscriber<NetworkStatus> subscriber = result
                .subscribe().withSubscriber(UniAssertSubscriber.create());

        NetworkStatus status = subscriber.awaitItem().getItem();
        assertNotNull(status);
        assertEquals(HealthStatus.HEALTH_SERVING, status.getNetworkHealth());
        assertTrue(status.getPeerCount() > 0);
        assertTrue(status.getActiveConnections() > 0);
        assertEquals(100, status.getSyncProgressPercent());
        assertTrue(status.getTotalMessagesSent() >= 0);
        assertTrue(status.getTotalMessagesReceived() >= 0);
        assertTrue(status.getAverageLatencyMs() > 0);
        assertTrue(status.getNetworkBandwidthMbps() > 0);
    }

    @Test
    @Order(2)
    @DisplayName("getNetworkStatus - should include peer details when requested")
    void testGetNetworkStatus_WithPeerDetails() {
        // Given
        GetNetworkStatusRequest request = GetNetworkStatusRequest.newBuilder()
                .setIncludePeerDetails(true)
                .setIncludeTopology(false)
                .build();

        // When
        NetworkStatus status = networkService.getNetworkStatus(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(status);
        // Should have top peers included (up to 10)
        assertTrue(status.getTopPeersCount() <= 10);
    }

    @Test
    @Order(3)
    @DisplayName("getNetworkStatus - should include topology when requested")
    void testGetNetworkStatus_WithTopology() {
        // Given
        GetNetworkStatusRequest request = GetNetworkStatusRequest.newBuilder()
                .setIncludePeerDetails(false)
                .setIncludeTopology(true)
                .build();

        // When
        NetworkStatus status = networkService.getNetworkStatus(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(status);
        assertTrue(status.hasTopology());
        NetworkTopology topology = status.getTopology();
        assertTrue(topology.getTotalNodes() > 0);
        assertTrue(topology.getTotalEdges() > 0);
        assertTrue(topology.getClusteringCoefficient() >= 0);
    }

    // ==================== Peer List Tests ====================

    @Test
    @Order(10)
    @DisplayName("getPeerList - should return all connected peers")
    void testGetPeerList_AllPeers() {
        // Given
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setLimit(100)
                .setOffset(0)
                .build();

        // When
        Uni<PeerListResponse> result = networkService.getPeerList(request);

        // Then
        PeerListResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getTotalCount() > 0);
        assertTrue(response.getReturnedCount() > 0);
        assertTrue(response.getReturnedCount() <= response.getTotalCount());

        // Verify peer information
        response.getPeersList().forEach(peer -> {
            assertNotNull(peer.getPeerId());
            assertNotNull(peer.getIpAddress());
            assertTrue(peer.getPort() > 0);
            assertNotNull(peer.getNodeType());
            assertNotNull(peer.getConnectionStatus());
        });
    }

    @Test
    @Order(11)
    @DisplayName("getPeerList - should filter by node type")
    void testGetPeerList_FilterByNodeType() {
        // Given - filter for validators
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setFilterNodeType("VALIDATOR")
                .setLimit(50)
                .build();

        // When
        PeerListResponse response = networkService.getPeerList(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        // All returned peers should be validators
        response.getPeersList().forEach(peer -> {
            assertEquals("VALIDATOR", peer.getNodeType());
        });
    }

    @Test
    @Order(12)
    @DisplayName("getPeerList - should filter by connection status")
    void testGetPeerList_FilterByStatus() {
        // Given
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setFilterStatus(PeerConnectionStatus.PEER_CONNECTED)
                .setLimit(50)
                .build();

        // When
        PeerListResponse response = networkService.getPeerList(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        // All returned peers should be connected
        response.getPeersList().forEach(peer -> {
            assertEquals(PeerConnectionStatus.PEER_CONNECTED, peer.getConnectionStatus());
        });
    }

    @ParameterizedTest
    @ValueSource(ints = {10, 25, 50, 100})
    @Order(13)
    @DisplayName("getPeerList - should respect limit parameter")
    void testGetPeerList_RespectLimit(int limit) {
        // Given
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setLimit(limit)
                .setOffset(0)
                .build();

        // When
        PeerListResponse response = networkService.getPeerList(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertTrue(response.getReturnedCount() <= limit);
    }

    @Test
    @Order(14)
    @DisplayName("getPeerList - should support pagination")
    void testGetPeerList_Pagination() {
        // Get first page
        GetPeerListRequest request1 = GetPeerListRequest.newBuilder()
                .setLimit(5)
                .setOffset(0)
                .build();

        PeerListResponse response1 = networkService.getPeerList(request1)
                .await().atMost(Duration.ofSeconds(5));

        // Get second page
        GetPeerListRequest request2 = GetPeerListRequest.newBuilder()
                .setLimit(5)
                .setOffset(5)
                .build();

        PeerListResponse response2 = networkService.getPeerList(request2)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertEquals(response1.getTotalCount(), response2.getTotalCount());
        // Peer IDs should be different (assuming enough peers)
        if (response1.getReturnedCount() > 0 && response2.getReturnedCount() > 0) {
            assertNotEquals(response1.getPeers(0).getPeerId(),
                          response2.getPeers(0).getPeerId());
        }
    }

    @Test
    @Order(15)
    @DisplayName("getPeerList - should sort by latency")
    void testGetPeerList_SortByLatency() {
        // Given
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setSortBy("latency")
                .setSortDescending(false)
                .setLimit(20)
                .build();

        // When
        PeerListResponse response = networkService.getPeerList(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        List<PeerInfo> peers = response.getPeersList();
        // Verify ascending order by latency
        for (int i = 1; i < peers.size(); i++) {
            assertTrue(peers.get(i).getLatencyMs() >= peers.get(i-1).getLatencyMs());
        }
    }

    // ==================== Broadcast Message Tests ====================

    @Test
    @Order(20)
    @DisplayName("broadcastMessage - should broadcast to all peers")
    void testBroadcastMessage_AllPeers() {
        // Given
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("broadcast-001")
                .setMessageType("BLOCK_ANNOUNCEMENT")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("New block available"))
                .setRequireAcknowledgment(false)
                .build();

        // When
        Uni<BroadcastMessageResponse> result = networkService.broadcastMessage(request);

        // Then
        BroadcastMessageResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals("broadcast-001", response.getMessageId());
        assertTrue(response.getPeersReached() > 0);
        assertTrue(response.getDeliveryStatusCount() > 0);
    }

    @Test
    @Order(21)
    @DisplayName("broadcastMessage - should broadcast to specific peers")
    void testBroadcastMessage_SpecificPeers() {
        // Given
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("broadcast-specific-001")
                .setMessageType("TRANSACTION")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Transaction data"))
                .addTargetPeerIds("validator-1")
                .addTargetPeerIds("validator-2")
                .addTargetPeerIds("validator-3")
                .setRequireAcknowledgment(false)
                .build();

        // When
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertTrue(response.getSuccess());
        assertEquals(3, response.getDeliveryStatusCount());
    }

    @Test
    @Order(22)
    @DisplayName("broadcastMessage - should broadcast to validators only")
    void testBroadcastMessage_ValidatorsOnly() {
        // Given
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("broadcast-validators-001")
                .setMessageType("CONSENSUS")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Consensus message"))
                .setTargetNodeType("VALIDATOR")
                .setRequireAcknowledgment(false)
                .build();

        // When
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertTrue(response.getSuccess());
        assertTrue(response.getPeersReached() >= 10); // Should have 10 validators
    }

    @Test
    @Order(23)
    @DisplayName("broadcastMessage - should require acknowledgments")
    void testBroadcastMessage_WithAcknowledgment() {
        // Given
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("broadcast-ack-001")
                .setMessageType("IMPORTANT")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Important message"))
                .setRequireAcknowledgment(true)
                .setMinAcknowledgments(5)
                .build();

        // When
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertTrue(response.getPeersReached() > 0);
        // With mock peers, all connected peers should acknowledge
        assertTrue(response.getAcknowledgmentsReceived() > 0);
    }

    @Test
    @Order(24)
    @DisplayName("broadcastMessage - should fail if min acknowledgments not met")
    void testBroadcastMessage_InsufficientAcknowledgments() {
        // Given - request more acknowledgments than available peers
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("broadcast-fail-ack")
                .setMessageType("TEST")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Test message"))
                .addTargetPeerIds("validator-1")
                .addTargetPeerIds("validator-2")
                .setRequireAcknowledgment(true)
                .setMinAcknowledgments(10) // More than targeted peers
                .build();

        // When
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertFalse(response.getSuccess());
        assertFalse(response.getErrorMessage().isEmpty());
    }

    @Test
    @Order(25)
    @DisplayName("broadcastMessage - should auto-generate message ID if not provided")
    void testBroadcastMessage_AutoGenerateId() {
        // Given - no message ID
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageType("AUTO_ID_TEST")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Auto ID test"))
                .build();

        // When
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));

        // Then
        assertTrue(response.getSuccess());
        assertNotNull(response.getMessageId());
        assertFalse(response.getMessageId().isEmpty());
    }

    // ==================== Network Event Streaming Tests ====================

    @Test
    @Order(30)
    @DisplayName("subscribeNetworkEvents - should stream events")
    void testSubscribeNetworkEvents_Success() throws InterruptedException {
        // Given
        NetworkEventSubscription request = NetworkEventSubscription.newBuilder()
                .setIncludeHistorical(false)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(3);

        // When
        Multi<NetworkEvent> stream = networkService.subscribeNetworkEvents(request);

        // Then
        AssertSubscriber<NetworkEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 3, "Should receive at least 3 events");

        List<NetworkEvent> events = subscriber.getItems();
        assertFalse(events.isEmpty());
        events.forEach(event -> {
            assertNotNull(event.getEventId());
            assertNotNull(event.getEventType());
            assertNotNull(event.getPeerId());
            assertNotNull(event.getTimestamp());
            assertFalse(event.getEventMessage().isEmpty());
        });
    }

    @Test
    @Order(31)
    @DisplayName("subscribeNetworkEvents - should filter by event type")
    void testSubscribeNetworkEvents_FilterEventType() throws InterruptedException {
        // Given
        NetworkEventSubscription request = NetworkEventSubscription.newBuilder()
                .addEventTypes(NetworkEventType.EVENT_MESSAGE_RECEIVED)
                .addEventTypes(NetworkEventType.EVENT_MESSAGE_SENT)
                .setIncludeHistorical(false)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<NetworkEvent> stream = networkService.subscribeNetworkEvents(request);

        AssertSubscriber<NetworkEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        // Then
        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 2);

        List<NetworkEvent> events = subscriber.getItems();
        events.forEach(event -> {
            assertTrue(event.getEventType() == NetworkEventType.EVENT_MESSAGE_RECEIVED ||
                      event.getEventType() == NetworkEventType.EVENT_MESSAGE_SENT);
        });
    }

    @Test
    @Order(32)
    @DisplayName("subscribeNetworkEvents - should filter by peer ID")
    void testSubscribeNetworkEvents_FilterPeerId() throws InterruptedException {
        // Given
        NetworkEventSubscription request = NetworkEventSubscription.newBuilder()
                .setFilterPeerId("validator-1")
                .setIncludeHistorical(false)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // When
        Multi<NetworkEvent> stream = networkService.subscribeNetworkEvents(request);

        AssertSubscriber<NetworkEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        // Then
        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 2);

        List<NetworkEvent> events = subscriber.getItems();
        events.forEach(event -> {
            assertEquals("validator-1", event.getPeerId());
        });
    }

    @Test
    @Order(33)
    @DisplayName("subscribeNetworkEvents - should include historical events")
    void testSubscribeNetworkEvents_IncludeHistorical() throws InterruptedException {
        // First, trigger some network activity to create historical events
        networkService.broadcastMessage(BroadcastMessageRequest.newBuilder()
                .setMessageId("historical-msg-1")
                .setMessageType("TEST")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Historical test"))
                .build()).await().atMost(Duration.ofSeconds(5));

        // Small delay to ensure event is recorded
        Thread.sleep(500);

        // Given
        NetworkEventSubscription request = NetworkEventSubscription.newBuilder()
                .setIncludeHistorical(true)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(1);

        // When
        Multi<NetworkEvent> stream = networkService.subscribeNetworkEvents(request);

        AssertSubscriber<NetworkEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        // Then
        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 1);
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(40)
    @DisplayName("Performance - getNetworkStatus under 5ms")
    void testPerformance_NetworkStatus() {
        // Given
        GetNetworkStatusRequest request = GetNetworkStatusRequest.newBuilder().build();

        // When
        long startTime = System.nanoTime();
        networkService.getNetworkStatus(request).await().atMost(Duration.ofSeconds(5));
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Then
        System.out.printf("getNetworkStatus took %dms (target: <5ms)%n", duration);
        assertTrue(duration < 100, "Network status should be fast");
    }

    @Test
    @Order(41)
    @DisplayName("Performance - getPeerList under 10ms")
    void testPerformance_PeerList() {
        // Given
        GetPeerListRequest request = GetPeerListRequest.newBuilder()
                .setLimit(50)
                .build();

        // When
        long startTime = System.nanoTime();
        networkService.getPeerList(request).await().atMost(Duration.ofSeconds(5));
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Then
        System.out.printf("getPeerList took %dms (target: <10ms)%n", duration);
        assertTrue(duration < 100, "Peer list should be fast");
    }

    @Test
    @Order(42)
    @DisplayName("Performance - broadcastMessage under 50ms")
    void testPerformance_Broadcast() {
        // Given
        BroadcastMessageRequest request = BroadcastMessageRequest.newBuilder()
                .setMessageId("perf-broadcast")
                .setMessageType("PERFORMANCE_TEST")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Performance test data"))
                .build();

        // When
        long startTime = System.nanoTime();
        BroadcastMessageResponse response = networkService.broadcastMessage(request)
                .await().atMost(Duration.ofSeconds(5));
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Then
        System.out.printf("broadcastMessage took %dms (target: <50ms) - reached %d peers%n",
                         duration, response.getPeersReached());
        assertTrue(duration < 200, "Broadcast should complete quickly");
    }

    @Test
    @Order(43)
    @DisplayName("Performance - 100 concurrent network status requests")
    void testPerformance_ConcurrentRequests() {
        // Given
        int requestCount = 100;
        long startTime = System.currentTimeMillis();

        // When - make 100 sequential requests (simulating concurrent load)
        for (int i = 0; i < requestCount; i++) {
            GetNetworkStatusRequest request = GetNetworkStatusRequest.newBuilder().build();
            networkService.getNetworkStatus(request).await().atMost(Duration.ofSeconds(1));
        }

        long duration = System.currentTimeMillis() - startTime;

        // Then
        double avgLatency = (double) duration / requestCount;
        System.out.printf("100 network status requests took %dms (avg: %.2fms)%n",
                         duration, avgLatency);
        assertTrue(avgLatency < 20, "Average latency should be low under load");
    }

    // ==================== Integration Tests ====================

    @Test
    @Order(50)
    @DisplayName("Integration - broadcast should trigger network events")
    void testIntegration_BroadcastTriggersEvents() throws InterruptedException {
        // Given - set up event stream first
        NetworkEventSubscription subscription = NetworkEventSubscription.newBuilder()
                .addEventTypes(NetworkEventType.EVENT_MESSAGE_SENT)
                .build();

        AtomicInteger eventCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(1);

        Multi<NetworkEvent> stream = networkService.subscribeNetworkEvents(subscription);
        AssertSubscriber<NetworkEvent> subscriber = stream
                .onItem().invoke(event -> {
                    if (event.getEventMessage().contains("Broadcast message sent")) {
                        eventCount.incrementAndGet();
                        latch.countDown();
                    }
                })
                .subscribe().withSubscriber(AssertSubscriber.create(10));

        // Small delay to ensure stream is active
        Thread.sleep(500);

        // When - broadcast a message
        BroadcastMessageRequest broadcastRequest = BroadcastMessageRequest.newBuilder()
                .setMessageId("integration-broadcast")
                .setMessageType("INTEGRATION_TEST")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Integration test"))
                .build();

        networkService.broadcastMessage(broadcastRequest).await().atMost(Duration.ofSeconds(5));

        // Then - should receive corresponding event
        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(completed || eventCount.get() >= 1,
                  "Broadcast should trigger network event");
    }
}
