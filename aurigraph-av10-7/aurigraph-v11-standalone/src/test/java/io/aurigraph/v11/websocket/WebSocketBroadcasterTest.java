package io.aurigraph.v11.websocket;

import io.aurigraph.v11.TransactionService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for WebSocketBroadcaster
 * Tests broadcasting logic and connection management
 */
@QuarkusTest
class WebSocketBroadcasterTest {

    @Inject
    WebSocketBroadcaster broadcaster;

    @Inject
    TransactionService transactionService;

    @Test
    void testBroadcasterInjection() {
        assertNotNull(broadcaster, "WebSocketBroadcaster should be injected");
    }

    @Test
    void testTransactionServiceInjection() {
        assertNotNull(transactionService, "TransactionService should be injected");
    }

    @Test
    void testInitialMessageCount() {
        long messagesSent = broadcaster.getMessagesSent();
        assertTrue(messagesSent >= 0, "Messages sent should be non-negative");
    }

    @Test
    void testInitialConnectionCount() {
        int connections = broadcaster.getTotalConnections();
        assertTrue(connections >= 0, "Total connections should be non-negative");
    }

    @Test
    void testBroadcastLatency() {
        long latency = broadcaster.getLastBroadcastLatency();
        assertTrue(latency >= 0, "Broadcast latency should be non-negative");
    }

    @Test
    void testBroadcastTransaction() {
        // This test verifies the broadcast doesn't throw exceptions
        assertDoesNotThrow(() -> {
            broadcaster.broadcastTransaction(
                "0xabcd1234567890",
                "0xfrom123",
                "0xto456",
                "1000000000000000000",
                "PENDING",
                21000
            );
        });
    }

    @Test
    void testBroadcastValidatorStatus() {
        assertDoesNotThrow(() -> {
            broadcaster.broadcastValidatorStatus(
                "0xvalidator123",
                "ACTIVE",
                1000000,
                99.95,
                12345
            );
        });
    }

    @Test
    void testBroadcastConsensusState() {
        assertDoesNotThrow(() -> {
            broadcaster.broadcastConsensusState(
                "0xleader123",
                145,
                3,
                7,
                "COMMITTED",
                0.98,
                156
            );
        });
    }

    @Test
    void testBroadcastNetworkTopology() {
        assertDoesNotThrow(() -> {
            broadcaster.broadcastNetworkTopology(
                "peer-123",
                "192.168.1.100",
                true,
                25,
                "11.4.3"
            );
        });
    }

    @Test
    void testMultipleBroadcasts() {
        long initialCount = broadcaster.getMessagesSent();

        // Broadcast multiple messages
        broadcaster.broadcastTransaction("0xtx1", "0xfrom", "0xto", "1000", "PENDING", 21000);
        broadcaster.broadcastValidatorStatus("0xval1", "ACTIVE", 1000000, 99.5, 100);
        broadcaster.broadcastConsensusState("0xleader", 1, 1, 1, "COMMITTED", 0.98, 5);
        broadcaster.broadcastNetworkTopology("peer1", "192.168.1.1", true, 10, "11.4.3");

        // Message count may or may not increment depending on whether clients are connected
        long finalCount = broadcaster.getMessagesSent();
        assertTrue(finalCount >= initialCount, "Message count should not decrease");
    }

    @Test
    void testConnectionTracking() {
        int metricsConnections = MetricsWebSocket.getConnectionCount();
        int transactionConnections = TransactionWebSocket.getConnectionCount();
        int validatorConnections = ValidatorWebSocket.getConnectionCount();
        int consensusConnections = ConsensusWebSocket.getConnectionCount();
        int networkConnections = NetworkWebSocket.getConnectionCount();
        int totalConnections = broadcaster.getTotalConnections();

        assertEquals(
            metricsConnections + transactionConnections + validatorConnections +
            consensusConnections + networkConnections,
            totalConnections,
            "Total connections should equal sum of individual endpoint connections"
        );
    }
}
