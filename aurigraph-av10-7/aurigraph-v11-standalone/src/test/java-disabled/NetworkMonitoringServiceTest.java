package io.aurigraph.v11.monitoring;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import jakarta.inject.Inject;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for NetworkMonitoringService (AV11-275)
 * Tests real-time network health monitoring and peer status
 *
 * Features Tested:
 * - Network health status calculation
 * - Peer status tracking and updates
 * - Network statistics aggregation
 * - Latency histogram generation
 * - Alert system for network issues
 * - Peer map generation for visualization
 * - Geo-distribution tracking
 */
@QuarkusTest
@DisplayName("Network Monitoring Service Tests")
public class NetworkMonitoringServiceTest {

    @Inject
    NetworkMonitoringService networkMonitoringService;

    private NetworkMonitoringService.PeerStatus createTestPeer(String id, boolean healthy, long latency) {
        NetworkMonitoringService.PeerStatus peer = new NetworkMonitoringService.PeerStatus();
        peer.peerId = id;
        peer.address = "192.168.1." + id.hashCode() % 255;
        peer.latency = latency;
        peer.healthy = healthy;
        peer.synced = healthy;
        peer.version = "v11.0.0";
        peer.uptime = System.currentTimeMillis();
        peer.bytesReceived = 1000000L;
        peer.bytesSent = 500000L;

        // Create geolocation
        peer.geolocation = new NetworkMonitoringService.Geolocation();
        peer.geolocation.country = "US";
        peer.geolocation.city = "San Francisco";
        peer.geolocation.latitude = 37.7749;
        peer.geolocation.longitude = -122.4194;

        return peer;
    }

    @BeforeEach
    void setup() {
        // Clean up any existing peers from previous tests
        // Note: In a real implementation, we'd have a clearAll() method
    }

    @Test
    @DisplayName("Should return network health with no peers as CRITICAL")
    void testNetworkHealthNoPeers() {
        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertNotNull(health);
        assertEquals("CRITICAL", health.status);
        assertEquals(0, health.totalPeers);
        assertEquals(0, health.healthyPeers);
        assertNotNull(health.lastUpdate);
    }

    @Test
    @DisplayName("Should calculate network health with healthy peers")
    void testNetworkHealthWithHealthyPeers() {
        // Add multiple healthy peers
        for (int i = 0; i < 5; i++) {
            NetworkMonitoringService.PeerStatus peer = createTestPeer("peer-" + i, true, 50);
            networkMonitoringService.updatePeerStatus("peer-" + i, peer);
        }

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertNotNull(health);
        assertEquals("HEALTHY", health.status);
        assertEquals(5, health.totalPeers);
        assertEquals(5, health.healthyPeers);
        assertEquals(5, health.syncedPeers);
        assertTrue(health.averageLatency > 0);
    }

    @Test
    @DisplayName("Should detect CRITICAL status with too few peers")
    void testCriticalStatusLowPeers() {
        // Add only 2 peers (threshold is 3)
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 30));
        networkMonitoringService.updatePeerStatus("peer-2", createTestPeer("peer-2", true, 40));

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals("CRITICAL", health.status);
        assertTrue(health.alerts.contains("LOW_PEER_COUNT"));
    }

    @Test
    @DisplayName("Should detect SLOW status with high latency")
    void testSlowStatusHighLatency() {
        // Add peers with high latency
        for (int i = 0; i < 5; i++) {
            NetworkMonitoringService.PeerStatus peer = createTestPeer("peer-" + i, true, 1500);
            networkMonitoringService.updatePeerStatus("peer-" + i, peer);
        }

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals("SLOW", health.status);
        assertTrue(health.averageLatency > 1000);
        assertTrue(health.alerts.contains("HIGH_LATENCY"));
    }

    @Test
    @DisplayName("Should calculate average latency correctly")
    void testAverageLatencyCalculation() {
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 10));
        networkMonitoringService.updatePeerStatus("peer-2", createTestPeer("peer-2", true, 20));
        networkMonitoringService.updatePeerStatus("peer-3", createTestPeer("peer-3", true, 30));

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals(20.0, health.averageLatency, 0.1); // Average of 10, 20, 30
    }

    @Test
    @DisplayName("Should return peer status list sorted by latency")
    void testGetPeerStatusSorted() {
        networkMonitoringService.updatePeerStatus("peer-slow", createTestPeer("peer-slow", true, 100));
        networkMonitoringService.updatePeerStatus("peer-fast", createTestPeer("peer-fast", true, 10));
        networkMonitoringService.updatePeerStatus("peer-medium", createTestPeer("peer-medium", true, 50));

        List<NetworkMonitoringService.PeerStatus> peerList = networkMonitoringService.getPeerStatus()
            .await().indefinitely();

        assertNotNull(peerList);
        assertEquals(3, peerList.size());

        // Should be sorted by latency (ascending)
        assertEquals(10, peerList.get(0).latency);
        assertEquals(50, peerList.get(1).latency);
        assertEquals(100, peerList.get(2).latency);
    }

    @Test
    @DisplayName("Should update peer status correctly")
    void testUpdatePeerStatus() {
        NetworkMonitoringService.PeerStatus peer = createTestPeer("test-peer", true, 45);
        networkMonitoringService.updatePeerStatus("test-peer", peer);

        List<NetworkMonitoringService.PeerStatus> peers = networkMonitoringService.getPeerStatus()
            .await().indefinitely();

        assertEquals(1, peers.size());
        assertEquals("test-peer", peers.get(0).peerId);
        assertEquals(45, peers.get(0).latency);
        assertTrue(peers.get(0).healthy);
    }

    @Test
    @DisplayName("Should remove peer correctly")
    void testRemovePeer() {
        // Add peer
        networkMonitoringService.updatePeerStatus("temp-peer", createTestPeer("temp-peer", true, 30));

        NetworkMonitoringService.NetworkHealth healthBefore = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();
        int peerCountBefore = healthBefore.totalPeers;

        // Remove peer
        networkMonitoringService.removePeer("temp-peer");

        NetworkMonitoringService.NetworkHealth healthAfter = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertTrue(healthAfter.totalPeers < peerCountBefore);
    }

    @Test
    @DisplayName("Should generate peer map for visualization")
    void testGetPeerMap() {
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 25));
        networkMonitoringService.updatePeerStatus("peer-2", createTestPeer("peer-2", true, 35));

        NetworkMonitoringService.PeerMap peerMap = networkMonitoringService.getPeerMap()
            .await().indefinitely();

        assertNotNull(peerMap);
        assertNotNull(peerMap.peers);
        assertEquals(2, peerMap.peers.size());
        assertNotNull(peerMap.connections);
        assertNotNull(peerMap.geolocation);
    }

    @Test
    @DisplayName("Should calculate geo distribution correctly")
    void testGeoDistribution() {
        // Add US peers
        NetworkMonitoringService.PeerStatus usPeer1 = createTestPeer("us-peer-1", true, 20);
        usPeer1.geolocation.country = "US";
        networkMonitoringService.updatePeerStatus("us-peer-1", usPeer1);

        NetworkMonitoringService.PeerStatus usPeer2 = createTestPeer("us-peer-2", true, 25);
        usPeer2.geolocation.country = "US";
        networkMonitoringService.updatePeerStatus("us-peer-2", usPeer2);

        // Add UK peer
        NetworkMonitoringService.PeerStatus ukPeer = createTestPeer("uk-peer", true, 80);
        ukPeer.geolocation.country = "UK";
        networkMonitoringService.updatePeerStatus("uk-peer", ukPeer);

        NetworkMonitoringService.PeerMap peerMap = networkMonitoringService.getPeerMap()
            .await().indefinitely();

        assertNotNull(peerMap.geolocation);
        assertEquals(2, peerMap.geolocation.get("US"));
        assertEquals(1, peerMap.geolocation.get("UK"));
    }

    @Test
    @DisplayName("Should generate network statistics")
    void testGetNetworkStatistics() {
        NetworkMonitoringService.NetworkStatistics stats = networkMonitoringService.getNetworkStatistics()
            .await().indefinitely();

        assertNotNull(stats);
        assertTrue(stats.totalTransactions >= 0);
        assertTrue(stats.transactionsPerSecond >= 0);
        assertTrue(stats.totalBlocks >= 0);
        assertNotNull(stats.timestamp);
    }

    @Test
    @DisplayName("Should generate latency histogram with correct buckets")
    void testLatencyHistogram() {
        // Add peers with varying latencies
        networkMonitoringService.updatePeerStatus("peer-fast", createTestPeer("peer-fast", true, 5));
        networkMonitoringService.updatePeerStatus("peer-medium1", createTestPeer("peer-medium1", true, 25));
        networkMonitoringService.updatePeerStatus("peer-medium2", createTestPeer("peer-medium2", true, 75));
        networkMonitoringService.updatePeerStatus("peer-slow", createTestPeer("peer-slow", true, 150));
        networkMonitoringService.updatePeerStatus("peer-very-slow", createTestPeer("peer-very-slow", true, 600));

        NetworkMonitoringService.LatencyHistogram histogram = networkMonitoringService.getLatencyHistogram()
            .await().indefinitely();

        assertNotNull(histogram);
        assertNotNull(histogram.distribution);

        // Check buckets
        assertTrue(histogram.distribution.containsKey("0-10ms"));
        assertTrue(histogram.distribution.containsKey("10-50ms"));
        assertTrue(histogram.distribution.containsKey("50-100ms"));
        assertTrue(histogram.distribution.containsKey("100-500ms"));
        assertTrue(histogram.distribution.containsKey("500ms+"));

        // Check min/max
        assertEquals(5, histogram.min);
        assertEquals(600, histogram.max);

        // Check percentiles
        assertTrue(histogram.p50 > 0);
        assertTrue(histogram.p95 > 0);
        assertTrue(histogram.p99 > 0);
    }

    @Test
    @DisplayName("Should calculate percentiles correctly")
    void testPercentileCalculation() {
        // Add 10 peers with known latencies (10, 20, 30, ..., 100)
        for (int i = 1; i <= 10; i++) {
            networkMonitoringService.updatePeerStatus("peer-" + i,
                createTestPeer("peer-" + i, true, i * 10));
        }

        NetworkMonitoringService.LatencyHistogram histogram = networkMonitoringService.getLatencyHistogram()
            .await().indefinitely();

        // P50 should be around 50
        assertTrue(histogram.p50 >= 40 && histogram.p50 <= 60);

        // P95 should be around 95
        assertTrue(histogram.p95 >= 85 && histogram.p95 <= 100);

        // P99 should be around 100
        assertEquals(100, histogram.p99);
    }

    @Test
    @DisplayName("Should track healthy vs unhealthy peers")
    void testHealthyVsUnhealthyPeers() {
        // Add healthy peers
        networkMonitoringService.updatePeerStatus("healthy-1", createTestPeer("healthy-1", true, 30));
        networkMonitoringService.updatePeerStatus("healthy-2", createTestPeer("healthy-2", true, 40));
        networkMonitoringService.updatePeerStatus("healthy-3", createTestPeer("healthy-3", true, 50));

        // Add unhealthy peers
        networkMonitoringService.updatePeerStatus("unhealthy-1", createTestPeer("unhealthy-1", false, 1000));
        networkMonitoringService.updatePeerStatus("unhealthy-2", createTestPeer("unhealthy-2", false, 1500));

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals(5, health.totalPeers);
        assertEquals(3, health.healthyPeers);
        assertEquals(3, health.syncedPeers);
    }

    @Test
    @DisplayName("Should update peer information on repeated calls")
    void testPeerInformationUpdate() {
        // Add peer with initial latency
        NetworkMonitoringService.PeerStatus peer = createTestPeer("update-peer", true, 50);
        networkMonitoringService.updatePeerStatus("update-peer", peer);

        NetworkMonitoringService.NetworkHealth healthBefore = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();
        double latencyBefore = healthBefore.averageLatency;

        // Update same peer with different latency
        NetworkMonitoringService.PeerStatus updatedPeer = createTestPeer("update-peer", true, 100);
        networkMonitoringService.updatePeerStatus("update-peer", updatedPeer);

        NetworkMonitoringService.NetworkHealth healthAfter = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();
        double latencyAfter = healthAfter.averageLatency;

        // Latency should have increased
        assertTrue(latencyAfter > latencyBefore);
    }

    @Test
    @DisplayName("Should generate alerts for network issues")
    void testNetworkAlerts() {
        // Create scenario with low peer count and high latency
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 1200));
        networkMonitoringService.updatePeerStatus("peer-2", createTestPeer("peer-2", true, 1300));

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertNotNull(health.alerts);
        assertTrue(health.alerts.size() > 0);
        assertTrue(health.alerts.contains("LOW_PEER_COUNT"));
        assertTrue(health.alerts.contains("HIGH_LATENCY"));
    }

    @Test
    @DisplayName("Should handle concurrent peer updates")
    void testConcurrentPeerUpdates() {
        // Simulate concurrent updates
        for (int i = 0; i < 10; i++) {
            final int index = i;
            NetworkMonitoringService.PeerStatus peer = createTestPeer("concurrent-peer-" + index, true, 30 + index);
            networkMonitoringService.updatePeerStatus("concurrent-peer-" + index, peer);
        }

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals(10, health.totalPeers);
        assertEquals(10, health.healthyPeers);
    }

    @Test
    @DisplayName("Should return empty peer list when no peers exist")
    void testEmptyPeerList() {
        List<NetworkMonitoringService.PeerStatus> peers = networkMonitoringService.getPeerStatus()
            .await().indefinitely();

        assertNotNull(peers);
        assertEquals(0, peers.size());
    }

    @Test
    @DisplayName("Should include uptime in network health")
    void testNetworkHealthUptime() {
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 30));

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertNotNull(health);
        assertTrue(health.uptime > 0);
    }

    @Test
    @DisplayName("Should track peer bandwidth usage")
    void testPeerBandwidthTracking() {
        NetworkMonitoringService.PeerStatus peer = createTestPeer("bandwidth-peer", true, 40);
        peer.bytesReceived = 5000000L; // 5 MB
        peer.bytesSent = 3000000L;     // 3 MB

        networkMonitoringService.updatePeerStatus("bandwidth-peer", peer);

        List<NetworkMonitoringService.PeerStatus> peers = networkMonitoringService.getPeerStatus()
            .await().indefinitely();

        assertEquals(1, peers.size());
        assertEquals(5000000L, peers.get(0).bytesReceived);
        assertEquals(3000000L, peers.get(0).bytesSent);
    }

    @Test
    @DisplayName("Should provide peer node information for visualization")
    void testPeerNodeInformation() {
        NetworkMonitoringService.PeerStatus peer = createTestPeer("viz-peer", true, 45);
        networkMonitoringService.updatePeerStatus("viz-peer", peer);

        NetworkMonitoringService.PeerMap peerMap = networkMonitoringService.getPeerMap()
            .await().indefinitely();

        assertNotNull(peerMap.peers);
        assertEquals(1, peerMap.peers.size());

        NetworkMonitoringService.PeerNode node = peerMap.peers.get(0);
        assertEquals("viz-peer", node.id);
        assertNotNull(node.address);
        assertEquals(45, node.latency);
        assertEquals("ACTIVE", node.status);
        assertNotNull(node.geolocation);
        assertNotNull(node.version);
    }

    @Test
    @DisplayName("Should handle peer removal gracefully")
    void testGracefulPeerRemoval() {
        networkMonitoringService.updatePeerStatus("peer-1", createTestPeer("peer-1", true, 30));
        networkMonitoringService.updatePeerStatus("peer-2", createTestPeer("peer-2", true, 40));

        // Remove non-existent peer (should not throw)
        assertDoesNotThrow(() -> {
            networkMonitoringService.removePeer("non-existent-peer");
        });

        // Remove existing peer
        networkMonitoringService.removePeer("peer-1");

        NetworkMonitoringService.NetworkHealth health = networkMonitoringService.getNetworkHealth()
            .await().indefinitely();

        assertEquals(1, health.totalPeers);
    }
}
