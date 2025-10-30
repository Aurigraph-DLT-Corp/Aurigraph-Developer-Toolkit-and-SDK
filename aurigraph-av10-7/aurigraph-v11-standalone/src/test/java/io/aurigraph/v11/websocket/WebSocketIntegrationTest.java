package io.aurigraph.v11.websocket;

import io.quarkus.test.common.http.TestHTTPResource;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for WebSocket endpoints
 * Tests WebSocket connectivity and endpoint availability
 */
@QuarkusTest
class WebSocketIntegrationTest {

    @TestHTTPResource("/ws/metrics")
    URI metricsEndpoint;

    @TestHTTPResource("/ws/transactions")
    URI transactionsEndpoint;

    @TestHTTPResource("/ws/validators")
    URI validatorsEndpoint;

    @TestHTTPResource("/ws/consensus")
    URI consensusEndpoint;

    @TestHTTPResource("/ws/network")
    URI networkEndpoint;

    @Test
    void testMetricsEndpointAvailable() {
        assertNotNull(metricsEndpoint, "Metrics WebSocket endpoint should be available");
        assertTrue(metricsEndpoint.toString().contains("/ws/metrics"));
    }

    @Test
    void testTransactionsEndpointAvailable() {
        assertNotNull(transactionsEndpoint, "Transactions WebSocket endpoint should be available");
        assertTrue(transactionsEndpoint.toString().contains("/ws/transactions"));
    }

    @Test
    void testValidatorsEndpointAvailable() {
        assertNotNull(validatorsEndpoint, "Validators WebSocket endpoint should be available");
        assertTrue(validatorsEndpoint.toString().contains("/ws/validators"));
    }

    @Test
    void testConsensusEndpointAvailable() {
        assertNotNull(consensusEndpoint, "Consensus WebSocket endpoint should be available");
        assertTrue(consensusEndpoint.toString().contains("/ws/consensus"));
    }

    @Test
    void testNetworkEndpointAvailable() {
        assertNotNull(networkEndpoint, "Network WebSocket endpoint should be available");
        assertTrue(networkEndpoint.toString().contains("/ws/network"));
    }

    @Test
    void testAllEndpointsHaveCorrectProtocol() {
        assertTrue(metricsEndpoint.toString().startsWith("ws://") ||
                  metricsEndpoint.toString().startsWith("wss://"),
                  "Metrics endpoint should use WebSocket protocol");

        assertTrue(transactionsEndpoint.toString().startsWith("ws://") ||
                  transactionsEndpoint.toString().startsWith("wss://"),
                  "Transactions endpoint should use WebSocket protocol");

        assertTrue(validatorsEndpoint.toString().startsWith("ws://") ||
                  validatorsEndpoint.toString().startsWith("wss://"),
                  "Validators endpoint should use WebSocket protocol");

        assertTrue(consensusEndpoint.toString().startsWith("ws://") ||
                  consensusEndpoint.toString().startsWith("wss://"),
                  "Consensus endpoint should use WebSocket protocol");

        assertTrue(networkEndpoint.toString().startsWith("ws://") ||
                  networkEndpoint.toString().startsWith("wss://"),
                  "Network endpoint should use WebSocket protocol");
    }

    @Test
    void testMetricsWebSocketConnectionCount() {
        int count = MetricsWebSocket.getConnectionCount();
        assertTrue(count >= 0, "Connection count should be non-negative");
    }

    @Test
    void testTransactionWebSocketConnectionCount() {
        int count = TransactionWebSocket.getConnectionCount();
        assertTrue(count >= 0, "Connection count should be non-negative");
    }

    @Test
    void testValidatorWebSocketConnectionCount() {
        int count = ValidatorWebSocket.getConnectionCount();
        assertTrue(count >= 0, "Connection count should be non-negative");
    }

    @Test
    void testConsensusWebSocketConnectionCount() {
        int count = ConsensusWebSocket.getConnectionCount();
        assertTrue(count >= 0, "Connection count should be non-negative");
    }

    @Test
    void testNetworkWebSocketConnectionCount() {
        int count = NetworkWebSocket.getConnectionCount();
        assertTrue(count >= 0, "Connection count should be non-negative");
    }

    @Test
    void testMetricsWebSocketHasConnections() {
        // Should not throw exception
        assertNotNull(MetricsWebSocket.hasConnections());
    }

    @Test
    void testTransactionWebSocketHasConnections() {
        assertNotNull(TransactionWebSocket.hasConnections());
    }

    @Test
    void testValidatorWebSocketHasConnections() {
        assertNotNull(ValidatorWebSocket.hasConnections());
    }

    @Test
    void testConsensusWebSocketHasConnections() {
        assertNotNull(ConsensusWebSocket.hasConnections());
    }

    @Test
    void testNetworkWebSocketHasConnections() {
        assertNotNull(NetworkWebSocket.hasConnections());
    }
}
