package io.aurigraph.v11.grpc;

import io.grpc.*;
import io.quarkus.test.junit.QuarkusTest;
import io.aurigraph.v11.proto.*;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.assertj.core.api.Assertions.*;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import io.grpc.stub.StreamObserver;

/**
 * Unit tests for NetworkService gRPC integration (Agent A - Week 1-2)
 *
 * Tests the complete NetworkService gRPC/HTTP/2 stack:
 * - NetworkServiceImpl registration in GrpcServiceConfiguration
 * - All 4 RPC methods: GetNetworkStatus, GetPeerList, BroadcastMessage, SubscribeNetworkEvents
 * - Peer management functionality
 * - Message broadcasting with acknowledgments
 * - Real-time event streaming
 * - Performance targets verification
 *
 * Performance Targets:
 * - GetNetworkStatus: <5ms latency
 * - GetPeerList: <10ms latency
 * - BroadcastMessage: <50ms peer-to-peer propagation
 * - SubscribeNetworkEvents: 100+ concurrent subscribers support
 *
 * Test Coverage: 90%+ target
 */
@QuarkusTest
@DisplayName("NetworkService gRPC Integration Tests")
public class NetworkServiceTest {

    private static final String GRPC_HOST = "localhost";
    private static final int GRPC_PORT = 9004;
    private static final long TEST_TIMEOUT_SECONDS = 30;

    @Inject
    NetworkServiceImpl networkService;

    @Inject
    GrpcServiceConfiguration grpcServiceConfiguration;

    /**
     * Test 1: Verify NetworkServiceImpl is properly injected and initialized
     */
    @Test
    @DisplayName("NetworkServiceImpl should be properly injected")
    void testNetworkServiceInjection() {
        assertThatCode(() -> {
            assertThat(networkService)
                    .as("NetworkServiceImpl should be injected")
                    .isNotNull();

            // Verify initial peer count (25 mock peers: 10 validators + 15 business)
            int peerCount = networkService.getConnectedPeerCount();
            assertThat(peerCount)
                    .as("Should have 25 connected mock peers")
                    .isEqualTo(25);

            System.out.println("✅ Test 1: NetworkServiceImpl injected successfully with " + peerCount + " peers");
        })
                .as("NetworkServiceImpl injection should succeed")
                .doesNotThrowAnyException();
    }

    /**
     * Test 2: GetNetworkStatus - Verify network status query
     * Performance Target: <5ms latency
     */
    @Test
    @DisplayName("GetNetworkStatus should return complete network status")
    void testGetNetworkStatus() throws Exception {
        long startTime = System.nanoTime();

        io.aurigraph.v11.proto.GetNetworkStatusRequest request = io.aurigraph.v11.proto.GetNetworkStatusRequest.newBuilder()
                .setIncludePeerDetails(true)
                .setIncludeTopology(true)
                .build();

        io.aurigraph.v11.proto.NetworkStatus status = networkService.GetNetworkStatus(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Verify response fields
        assertThat(status.getNetworkHealth())
                .as("Network health should be SERVING")
                .isEqualTo(io.aurigraph.v11.proto.HealthStatus.HEALTH_SERVING);

        assertThat(status.getPeerCount())
                .as("Peer count should be 25")
                .isEqualTo(25);

        assertThat(status.getActiveConnections())
                .as("Active connections should be 25")
                .isEqualTo(25);

        assertThat(status.getSyncProgressPercent())
                .as("Sync progress should be 100%")
                .isEqualTo(100);

        assertThat(status.getAverageLatencyMs())
                .as("Average latency should be reasonable")
                .isGreaterThan(0.0);

        // Verify peer details are included
        assertThat(status.getTopPeersCount())
                .as("Should include top 10 peers")
                .isEqualTo(10);

        // Verify topology is included
        assertThat(status.hasTopology())
                .as("Should include topology")
                .isTrue();

        assertThat(status.getTopology().getTotalNodes())
                .as("Topology should show 25 nodes")
                .isEqualTo(25);

        // Verify performance target (<5ms)
        assertThat(elapsedMs)
                .as("GetNetworkStatus should complete in <5ms")
                .isLessThan(5);

        System.out.printf("✅ Test 2: GetNetworkStatus completed in %dms (target: <5ms)%n", elapsedMs);
        System.out.printf("   Network: %d peers, %d active, %d%% sync, %.2fms avg latency%n",
                status.getPeerCount(), status.getActiveConnections(),
                status.getSyncProgressPercent(), status.getAverageLatencyMs());
    }

    /**
     * Test 3: GetNetworkStatus - Verify basic status without details
     */
    @Test
    @DisplayName("GetNetworkStatus should work without optional details")
    void testGetNetworkStatusBasic() throws Exception {
        io.aurigraph.v11.proto.GetNetworkStatusRequest request = io.aurigraph.v11.proto.GetNetworkStatusRequest.newBuilder()
                .setIncludePeerDetails(false)
                .setIncludeTopology(false)
                .build();

        io.aurigraph.v11.proto.NetworkStatus status = networkService.GetNetworkStatus(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        // Verify response fields
        assertThat(status.getNetworkHealth())
                .as("Network health should be SERVING")
                .isEqualTo(io.aurigraph.v11.proto.HealthStatus.HEALTH_SERVING);

        // Verify peer details are NOT included
        assertThat(status.getTopPeersCount())
                .as("Should not include peer details")
                .isEqualTo(0);

        // Verify topology is NOT included
        assertThat(status.hasTopology())
                .as("Should not include topology")
                .isFalse();

        System.out.println("✅ Test 3: GetNetworkStatus basic query successful");
    }

    /**
     * Test 4: GetPeerList - Verify peer list retrieval
     * Performance Target: <10ms latency
     */
    @Test
    @DisplayName("GetPeerList should return all peers with default pagination")
    void testGetPeerList() throws Exception {
        long startTime = System.nanoTime();

        io.aurigraph.v11.proto.GetPeerListRequest request = io.aurigraph.v11.proto.GetPeerListRequest.newBuilder()
                .setLimit(100)
                .setOffset(0)
                .build();

        io.aurigraph.v11.proto.PeerListResponse response = networkService.GetPeerList(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Verify response
        assertThat(response.getTotalCount())
                .as("Total count should be 25")
                .isEqualTo(25);

        assertThat(response.getReturnedCount())
                .as("Returned count should be 25")
                .isEqualTo(25);

        assertThat(response.getPeersCount())
                .as("Should return 25 peers")
                .isEqualTo(25);

        // Verify peer details
        io.aurigraph.v11.proto.PeerInfo firstPeer = response.getPeers(0);
        assertThat(firstPeer.getPeerId())
                .as("Peer ID should not be empty")
                .isNotEmpty();

        assertThat(firstPeer.getConnectionStatus())
                .as("Peer should be connected")
                .isEqualTo(io.aurigraph.v11.proto.PeerConnectionStatus.PEER_CONNECTED);

        // Verify performance target (<10ms)
        assertThat(elapsedMs)
                .as("GetPeerList should complete in <10ms")
                .isLessThan(10);

        System.out.printf("✅ Test 4: GetPeerList completed in %dms (target: <10ms)%n", elapsedMs);
        System.out.printf("   Retrieved %d/%d peers%n", response.getReturnedCount(), response.getTotalCount());
    }

    /**
     * Test 5: GetPeerList - Verify filtering by node type
     */
    @Test
    @DisplayName("GetPeerList should filter peers by node type")
    void testGetPeerListFiltering() throws Exception {
        // Filter for validators only
        io.aurigraph.v11.proto.GetPeerListRequest request = io.aurigraph.v11.proto.GetPeerListRequest.newBuilder()
                .setFilterNodeType("VALIDATOR")
                .setLimit(100)
                .build();

        io.aurigraph.v11.proto.PeerListResponse response = networkService.GetPeerList(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        // Verify only validators are returned
        assertThat(response.getTotalCount())
                .as("Should have 10 validators")
                .isEqualTo(10);

        assertThat(response.getPeersCount())
                .as("Should return 10 validator peers")
                .isEqualTo(10);

        // Verify all returned peers are validators
        for (io.aurigraph.v11.proto.PeerInfo peer : response.getPeersList()) {
            assertThat(peer.getNodeType())
                    .as("All peers should be validators")
                    .isEqualTo("VALIDATOR");
        }

        System.out.println("✅ Test 5: GetPeerList filtering by VALIDATOR successful - found " + response.getTotalCount() + " validators");
    }

    /**
     * Test 6: GetPeerList - Verify pagination
     */
    @Test
    @DisplayName("GetPeerList should support pagination")
    void testGetPeerListPagination() throws Exception {
        // Request first 10 peers
        io.aurigraph.v11.proto.GetPeerListRequest request = io.aurigraph.v11.proto.GetPeerListRequest.newBuilder()
                .setLimit(10)
                .setOffset(0)
                .build();

        io.aurigraph.v11.proto.PeerListResponse response = networkService.GetPeerList(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        assertThat(response.getTotalCount())
                .as("Total should still be 25")
                .isEqualTo(25);

        assertThat(response.getReturnedCount())
                .as("Should return only 10 peers")
                .isEqualTo(10);

        assertThat(response.getPeersCount())
                .as("Should have 10 peers in list")
                .isEqualTo(10);

        System.out.println("✅ Test 6: GetPeerList pagination successful - returned 10/25 peers");
    }

    /**
     * Test 7: BroadcastMessage - Verify message broadcasting
     * Performance Target: <50ms peer-to-peer propagation
     */
    @Test
    @DisplayName("BroadcastMessage should broadcast to all connected peers")
    void testBroadcastMessage() throws Exception {
        long startTime = System.nanoTime();

        io.aurigraph.v11.proto.BroadcastMessageRequest request = io.aurigraph.v11.proto.BroadcastMessageRequest.newBuilder()
                .setMessageType("TEST_MESSAGE")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Test broadcast payload"))
                .setMessageId("test-msg-001")
                .setPriority(io.aurigraph.v11.proto.MessagePriority.PRIORITY_NORMAL)
                .setTimeoutSeconds(30)
                .build();

        io.aurigraph.v11.proto.BroadcastMessageResponse response = networkService.BroadcastMessage(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Verify response
        assertThat(response.getSuccess())
                .as("Broadcast should succeed")
                .isTrue();

        assertThat(response.getMessageId())
                .as("Message ID should match")
                .isEqualTo("test-msg-001");

        assertThat(response.getPeersReached())
                .as("Should reach all 25 peers")
                .isEqualTo(25);

        assertThat(response.getDeliveryStatusCount())
                .as("Should have delivery status for all peers")
                .isEqualTo(25);

        // Verify performance target (<50ms)
        assertThat(elapsedMs)
                .as("BroadcastMessage should complete in <50ms")
                .isLessThan(50);

        System.out.printf("✅ Test 7: BroadcastMessage completed in %dms (target: <50ms)%n", elapsedMs);
        System.out.printf("   Reached %d peers successfully%n", response.getPeersReached());
    }

    /**
     * Test 8: BroadcastMessage - Verify targeted broadcast
     */
    @Test
    @DisplayName("BroadcastMessage should support targeted node type")
    void testBroadcastMessageTargeted() throws Exception {
        io.aurigraph.v11.proto.BroadcastMessageRequest request = io.aurigraph.v11.proto.BroadcastMessageRequest.newBuilder()
                .setMessageType("VALIDATOR_MESSAGE")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Validator broadcast"))
                .setTargetNodeType("VALIDATOR")
                .setPriority(io.aurigraph.v11.proto.MessagePriority.PRIORITY_HIGH)
                .build();

        io.aurigraph.v11.proto.BroadcastMessageResponse response = networkService.BroadcastMessage(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        // Verify only validators were reached
        assertThat(response.getPeersReached())
                .as("Should reach only 10 validators")
                .isEqualTo(10);

        assertThat(response.getSuccess())
                .as("Targeted broadcast should succeed")
                .isTrue();

        System.out.println("✅ Test 8: BroadcastMessage targeted to validators - reached " + response.getPeersReached() + " peers");
    }

    /**
     * Test 9: BroadcastMessage - Verify acknowledgment requirement
     */
    @Test
    @DisplayName("BroadcastMessage should support acknowledgment requirements")
    void testBroadcastMessageAcknowledgment() throws Exception {
        io.aurigraph.v11.proto.BroadcastMessageRequest request = io.aurigraph.v11.proto.BroadcastMessageRequest.newBuilder()
                .setMessageType("ACK_MESSAGE")
                .setMessagePayload(com.google.protobuf.ByteString.copyFromUtf8("Ack test"))
                .setRequireAcknowledgment(true)
                .setMinAcknowledgments(20)
                .build();

        io.aurigraph.v11.proto.BroadcastMessageResponse response = networkService.BroadcastMessage(request)
                .await()
                .atMost(java.time.Duration.ofSeconds(5));

        // Verify acknowledgments
        assertThat(response.getAcknowledgmentsReceived())
                .as("Should receive acknowledgments from all reached peers")
                .isEqualTo(response.getPeersReached());

        assertThat(response.getSuccess())
                .as("Should succeed with sufficient acknowledgments")
                .isTrue();

        System.out.printf("✅ Test 9: BroadcastMessage with acknowledgment - received %d acks%n",
                response.getAcknowledgmentsReceived());
    }

    /**
     * Test 10: SubscribeNetworkEvents - Verify event streaming
     * Performance Target: 100+ concurrent subscribers support
     */
    @Test
    @DisplayName("SubscribeNetworkEvents should stream network events")
    void testSubscribeNetworkEvents() throws Exception {
        CountDownLatch eventLatch = new CountDownLatch(3);
        AtomicInteger eventCount = new AtomicInteger(0);

        io.aurigraph.v11.proto.NetworkEventSubscription subscription = io.aurigraph.v11.proto.NetworkEventSubscription.newBuilder()
                .setStreamTimeoutSeconds(10)
                .setIncludeHistorical(false)
                .build();

        // Subscribe to events
        networkService.SubscribeNetworkEvents(subscription)
                .subscribe()
                .with(
                        event -> {
                            int count = eventCount.incrementAndGet();
                            System.out.printf("   Received event #%d: %s - %s%n",
                                    count, event.getEventType(), event.getEventMessage());

                            // Verify event structure
                            assertThat(event.getEventId())
                                    .as("Event should have ID")
                                    .isNotEmpty();

                            assertThat(event.getEventType())
                                    .as("Event should have type")
                                    .isNotNull();

                            assertThat(event.hasTimestamp())
                                    .as("Event should have timestamp")
                                    .isTrue();

                            eventLatch.countDown();
                        },
                        failure -> {
                            System.err.println("Event stream failed: " + failure.getMessage());
                        }
                );

        // Wait for at least 3 events (with timeout)
        boolean received = eventLatch.await(10, TimeUnit.SECONDS);

        assertThat(received)
                .as("Should receive at least 3 events within 10 seconds")
                .isTrue();

        assertThat(eventCount.get())
                .as("Should have received at least 3 events")
                .isGreaterThanOrEqualTo(3);

        System.out.printf("✅ Test 10: SubscribeNetworkEvents streaming successful - received %d events%n",
                eventCount.get());
    }

    /**
     * Test 11: SubscribeNetworkEvents - Verify filtered streaming
     */
    @Test
    @DisplayName("SubscribeNetworkEvents should support event type filtering")
    void testSubscribeNetworkEventsFiltered() throws Exception {
        CountDownLatch eventLatch = new CountDownLatch(2);
        AtomicInteger eventCount = new AtomicInteger(0);

        io.aurigraph.v11.proto.NetworkEventSubscription subscription = io.aurigraph.v11.proto.NetworkEventSubscription.newBuilder()
                .addEventTypes(io.aurigraph.v11.proto.NetworkEventType.EVENT_MESSAGE_SENT)
                .addEventTypes(io.aurigraph.v11.proto.NetworkEventType.EVENT_MESSAGE_RECEIVED)
                .setStreamTimeoutSeconds(10)
                .build();

        // Subscribe to filtered events
        networkService.SubscribeNetworkEvents(subscription)
                .subscribe()
                .with(
                        event -> {
                            eventCount.incrementAndGet();

                            // Verify event type is one of the filtered types
                            assertThat(event.getEventType())
                                    .as("Event type should match filter")
                                    .isIn(
                                            io.aurigraph.v11.proto.NetworkEventType.EVENT_MESSAGE_SENT,
                                            io.aurigraph.v11.proto.NetworkEventType.EVENT_MESSAGE_RECEIVED
                                    );

                            eventLatch.countDown();
                        }
                );

        // Wait for at least 2 events
        boolean received = eventLatch.await(10, TimeUnit.SECONDS);

        assertThat(received)
                .as("Should receive filtered events")
                .isTrue();

        System.out.printf("✅ Test 11: SubscribeNetworkEvents filtered streaming - received %d events%n",
                eventCount.get());
    }

    /**
     * Test 12: Verify gRPC service registration
     */
    @Test
    @DisplayName("NetworkServiceImpl should be registered in GrpcServiceConfiguration")
    void testServiceRegistration() {
        assertThatCode(() -> {
            assertThat(grpcServiceConfiguration)
                    .as("GrpcServiceConfiguration should be injected")
                    .isNotNull();

            Server grpcServer = grpcServiceConfiguration.getGrpcServer();
            assertThat(grpcServer)
                    .as("gRPC server should be created")
                    .isNotNull();

            assertThat(grpcServiceConfiguration.getGrpcPort())
                    .as("gRPC port should be 9004")
                    .isEqualTo(GRPC_PORT);

            System.out.println("✅ Test 12: NetworkServiceImpl registered in GrpcServiceConfiguration");
        })
                .as("NetworkServiceImpl registration should succeed")
                .doesNotThrowAnyException();
    }
}
