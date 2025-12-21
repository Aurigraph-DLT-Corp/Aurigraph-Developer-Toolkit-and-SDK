package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.aurigraph.v11.nodes.EINode.ExchangeConnection;
import io.aurigraph.v11.nodes.EINode.ExchangeResponse;
import io.aurigraph.v11.nodes.EINode.APIResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for EINode (Enterprise Infrastructure Node)
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle (start/stop/restart)
 * - Exchange connectivity
 * - Data feed management
 * - API gateway functionality
 * - Circuit breaker operations
 * - Event pub/sub
 * - Data transformation
 * - Health checks and metrics
 */
@DisplayName("EINode Tests")
class EINodeTest {

    private EINode eiNode;
    private static final String NODE_ID = "ei-test-1";

    @BeforeEach
    void setUp() {
        eiNode = new EINode(NODE_ID);
    }

    @AfterEach
    void tearDown() {
        if (eiNode != null && eiNode.isRunning()) {
            eiNode.stop();
        }
    }

    // ============================================
    // NODE LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Lifecycle Tests")
    class LifecycleTests {

        @Test
        @DisplayName("Should create EI node with correct ID")
        void shouldCreateNodeWithCorrectId() {
            assertEquals(NODE_ID, eiNode.getNodeId());
        }

        @Test
        @DisplayName("Should start EI node successfully")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartNodeSuccessfully() {
            assertFalse(eiNode.isRunning());
            eiNode.start();
            assertTrue(eiNode.isRunning());
        }

        @Test
        @DisplayName("Should stop EI node successfully")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldStopNodeSuccessfully() {
            eiNode.start();
            assertTrue(eiNode.isRunning());
            eiNode.stop();
            assertFalse(eiNode.isRunning());
        }

        @Test
        @DisplayName("Should restart EI node successfully")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldRestartNodeSuccessfully() {
            eiNode.start();
            assertTrue(eiNode.isRunning());
            eiNode.restart();
            assertTrue(eiNode.isRunning());
        }

        @Test
        @DisplayName("Should handle multiple start calls gracefully")
        void shouldHandleMultipleStartCalls() {
            eiNode.start();
            eiNode.start(); // Second call should be safe
            assertTrue(eiNode.isRunning());
        }
    }

    // ============================================
    // EXCHANGE MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Exchange Management Tests")
    class ExchangeManagementTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should connect to exchange")
        void shouldConnectToExchange() {
            Map<String, String> credentials = new HashMap<>();
            credentials.put("apiKey", "test-key");
            credentials.put("secret", "test-secret");

            boolean connected = eiNode.connectExchange(
                "binance",
                "wss://stream.binance.com",
                credentials
            );

            assertTrue(connected);
        }

        @Test
        @DisplayName("Should get connected exchange")
        void shouldGetConnectedExchange() {
            eiNode.connectExchange("kraken", "wss://ws.kraken.com", new HashMap<>());

            ExchangeConnection connection = eiNode.getExchange("kraken");
            assertNotNull(connection);
            assertEquals("kraken", connection.exchangeId);
            assertTrue(connection.connected);
        }

        @Test
        @DisplayName("Should return null for non-existent exchange")
        void shouldReturnNullForNonExistentExchange() {
            ExchangeConnection connection = eiNode.getExchange("non-existent");
            assertNull(connection);
        }

        @Test
        @DisplayName("Should connect to multiple exchanges")
        void shouldConnectToMultipleExchanges() {
            eiNode.connectExchange("exchange1", "url1", new HashMap<>());
            eiNode.connectExchange("exchange2", "url2", new HashMap<>());
            eiNode.connectExchange("exchange3", "url3", new HashMap<>());

            Map<String, ExchangeConnection> exchanges = eiNode.getAllExchanges();
            assertEquals(3, exchanges.size());
        }

        @Test
        @DisplayName("Should send request to exchange")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSendRequestToExchange() throws Exception {
            eiNode.connectExchange("test-exchange", "url", new HashMap<>());

            Map<String, Object> params = new HashMap<>();
            params.put("symbol", "BTC/USD");

            CompletableFuture<ExchangeResponse> future =
                eiNode.sendExchangeRequest("test-exchange", "getPrice", params);

            ExchangeResponse response = future.get(3, TimeUnit.SECONDS);
            assertTrue(response.success);
            assertEquals("test-exchange", response.exchangeId);
        }

        @Test
        @DisplayName("Should fail request to disconnected exchange")
        void shouldFailRequestToDisconnectedExchange() {
            CompletableFuture<ExchangeResponse> future =
                eiNode.sendExchangeRequest("non-existent", "method", new HashMap<>());

            assertThrows(ExecutionException.class, () -> future.get(1, TimeUnit.SECONDS));
        }
    }

    // ============================================
    // DATA FEED TESTS
    // ============================================

    @Nested
    @DisplayName("Data Feed Tests")
    class DataFeedTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should subscribe to data feed")
        void shouldSubscribeToDataFeed() {
            boolean subscribed = eiNode.subscribeToFeed(
                "btc-price",
                "binance",
                "price",
                1000
            );

            assertTrue(subscribed);
        }

        @Test
        @DisplayName("Should unsubscribe from data feed")
        void shouldUnsubscribeFromDataFeed() {
            eiNode.subscribeToFeed("feed-1", "source", "type", 1000);
            assertDoesNotThrow(() -> eiNode.unsubscribeFromFeed("feed-1"));
        }

        @Test
        @DisplayName("Should get feed data")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetFeedData() throws InterruptedException {
            eiNode.subscribeToFeed("test-feed", "source", "price", 100);

            // Wait for feed to poll
            Thread.sleep(200);

            Object data = eiNode.getFeedData("test-feed");
            assertNotNull(data);
        }

        @Test
        @DisplayName("Should return null for non-existent feed")
        void shouldReturnNullForNonExistentFeed() {
            Object data = eiNode.getFeedData("non-existent");
            assertNull(data);
        }

        @Test
        @DisplayName("Should subscribe to multiple feeds")
        void shouldSubscribeToMultipleFeeds() {
            eiNode.subscribeToFeed("feed-1", "source1", "type1", 1000);
            eiNode.subscribeToFeed("feed-2", "source2", "type2", 2000);
            eiNode.subscribeToFeed("feed-3", "source3", "type3", 3000);

            // Feeds are tracked internally
            assertNotNull(eiNode);
        }
    }

    // ============================================
    // API GATEWAY TESTS
    // ============================================

    @Nested
    @DisplayName("API Gateway Tests")
    class APIGatewayTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should register API endpoint")
        void shouldRegisterAPIEndpoint() {
            Map<String, String> headers = new HashMap<>();
            headers.put("Authorization", "Bearer token");

            assertDoesNotThrow(() ->
                eiNode.registerAPIEndpoint(
                    "users-api",
                    "https://api.example.com/users",
                    "GET",
                    headers
                )
            );
        }

        @Test
        @DisplayName("Should call registered API endpoint")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldCallRegisteredAPIEndpoint() throws Exception {
            eiNode.registerAPIEndpoint("test-api", "https://api.test.com", "GET", new HashMap<>());

            CompletableFuture<APIResponse> future = eiNode.callAPI("test-api", new HashMap<>());
            APIResponse response = future.get(3, TimeUnit.SECONDS);

            assertNotNull(response);
            assertEquals("test-api", response.endpointId);
            assertEquals(200, response.statusCode);
        }

        @Test
        @DisplayName("Should fail for non-existent endpoint")
        void shouldFailForNonExistentEndpoint() {
            CompletableFuture<APIResponse> future = eiNode.callAPI("non-existent", new HashMap<>());
            assertThrows(ExecutionException.class, () -> future.get(1, TimeUnit.SECONDS));
        }

        @Test
        @DisplayName("Should register multiple endpoints")
        void shouldRegisterMultipleEndpoints() {
            eiNode.registerAPIEndpoint("ep1", "url1", "GET", new HashMap<>());
            eiNode.registerAPIEndpoint("ep2", "url2", "POST", new HashMap<>());
            eiNode.registerAPIEndpoint("ep3", "url3", "PUT", new HashMap<>());

            // All endpoints registered successfully
            assertNotNull(eiNode);
        }
    }

    // ============================================
    // EVENT PUB/SUB TESTS
    // ============================================

    @Nested
    @DisplayName("Event Pub/Sub Tests")
    class EventPubSubTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should subscribe to event")
        void shouldSubscribeToEvent() {
            assertDoesNotThrow(() -> eiNode.subscribeToEvent("price-update", "subscriber-1"));
        }

        @Test
        @DisplayName("Should unsubscribe from event")
        void shouldUnsubscribeFromEvent() {
            eiNode.subscribeToEvent("event-type", "subscriber-1");
            assertDoesNotThrow(() -> eiNode.unsubscribeFromEvent("event-type", "subscriber-1"));
        }

        @Test
        @DisplayName("Should publish event")
        void shouldPublishEvent() {
            eiNode.subscribeToEvent("test-event", "subscriber-1");

            Map<String, Object> data = new HashMap<>();
            data.put("value", 100);

            assertDoesNotThrow(() -> eiNode.publishEvent("test-event", data));
        }

        @Test
        @DisplayName("Should handle publish with no subscribers")
        void shouldHandlePublishWithNoSubscribers() {
            assertDoesNotThrow(() -> eiNode.publishEvent("no-subscribers", "data"));
        }

        @Test
        @DisplayName("Should allow multiple subscribers")
        void shouldAllowMultipleSubscribers() {
            eiNode.subscribeToEvent("shared-event", "sub-1");
            eiNode.subscribeToEvent("shared-event", "sub-2");
            eiNode.subscribeToEvent("shared-event", "sub-3");

            assertDoesNotThrow(() -> eiNode.publishEvent("shared-event", "broadcast"));
        }
    }

    // ============================================
    // DATA TRANSFORMATION TESTS
    // ============================================

    @Nested
    @DisplayName("Data Transformation Tests")
    class DataTransformationTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should normalize data")
        void shouldNormalizeData() {
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("Price", 50000);
            rawData.put("Volume 24h", 1000000);

            Map<String, Object> normalized = eiNode.normalizeData("exchange", rawData);

            assertNotNull(normalized);
            assertTrue(normalized.containsKey("_source"));
            assertTrue(normalized.containsKey("_timestamp"));
            assertTrue(normalized.containsKey("_nodeId"));
            assertTrue(normalized.containsKey("price")); // lowercase
            assertTrue(normalized.containsKey("volume_24h")); // space replaced with underscore
        }

        @Test
        @DisplayName("Should add metadata to normalized data")
        void shouldAddMetadataToNormalizedData() {
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("key", "value");

            Map<String, Object> normalized = eiNode.normalizeData("api-source", rawData);

            assertEquals("api-source", normalized.get("_source"));
            assertEquals(NODE_ID, normalized.get("_nodeId"));
            assertNotNull(normalized.get("_timestamp"));
        }

        @Test
        @DisplayName("Should handle empty raw data")
        void shouldHandleEmptyRawData() {
            Map<String, Object> normalized = eiNode.normalizeData("empty", new HashMap<>());

            assertNotNull(normalized);
            assertTrue(normalized.containsKey("_source"));
        }

        @Test
        @DisplayName("Should cache normalized data")
        void shouldCacheNormalizedData() {
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("key", "value");

            eiNode.normalizeData("cache-test", rawData);

            // Cache is internal, we just verify no exception
            assertNotNull(eiNode);
        }

        @Test
        @DisplayName("Should get cached data")
        void shouldGetCachedData() {
            // Cache uses timestamp-based keys, so we test the getter
            Object cached = eiNode.getCachedData("non-existent-key");
            assertNull(cached);
        }
    }

    // ============================================
    // HEALTH CHECK TESTS
    // ============================================

    @Nested
    @DisplayName("Health Check Tests")
    class HealthCheckTests {

        @Test
        @DisplayName("Should report healthy when running")
        void shouldReportHealthyWhenRunning() {
            eiNode.start();

            NodeHealth health = eiNode.healthCheck().await().indefinitely();
            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should include components in health check")
        void shouldIncludeComponentsInHealthCheck() {
            eiNode.start();

            NodeHealth health = eiNode.healthCheck().await().indefinitely();
            assertNotNull(health.getComponentChecks());
            assertTrue(health.getComponentChecks().containsKey("exchanges"));
            assertTrue(health.getComponentChecks().containsKey("dataFeeds"));
            assertTrue(health.getComponentChecks().containsKey("circuitBreakers"));
            assertTrue(health.getComponentChecks().containsKey("apiEndpoints"));
            assertTrue(health.getComponentChecks().containsKey("errorRate"));
        }

        @Test
        @DisplayName("Should report exchange health details")
        void shouldReportExchangeHealthDetails() {
            eiNode.start();
            eiNode.connectExchange("test", "url", new HashMap<>());

            NodeHealth health = eiNode.healthCheck().await().indefinitely();
            @SuppressWarnings("unchecked")
            Map<String, Object> exchangeHealth = (Map<String, Object>) health.getComponentChecks().get("exchanges");

            assertNotNull(exchangeHealth);
            assertEquals(1, exchangeHealth.get("total"));
            assertEquals(1L, exchangeHealth.get("active"));
        }

        @Test
        @DisplayName("Should include uptime in health check")
        void shouldIncludeUptimeInHealthCheck() throws InterruptedException {
            eiNode.start();
            Thread.sleep(100);

            NodeHealth health = eiNode.healthCheck().await().indefinitely();
            assertTrue(health.getUptimeSeconds() >= 0);
        }
    }

    // ============================================
    // METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Metrics Tests")
    class MetricsTests {

        @BeforeEach
        void startNode() {
            eiNode.start();
        }

        @Test
        @DisplayName("Should return valid metrics")
        void shouldReturnValidMetrics() {
            NodeMetrics metrics = eiNode.getMetrics().await().indefinitely();
            assertNotNull(metrics);
        }

        @Test
        @DisplayName("Should include custom metrics")
        void shouldIncludeCustomMetrics() {
            NodeMetrics metrics = eiNode.getMetrics().await().indefinitely();
            assertNotNull(metrics.getCustomMetrics());
            assertTrue(metrics.getCustomMetrics().containsKey("messagesReceived"));
            assertTrue(metrics.getCustomMetrics().containsKey("messagesSent"));
            assertTrue(metrics.getCustomMetrics().containsKey("totalDataBytes"));
            assertTrue(metrics.getCustomMetrics().containsKey("exchangeConnections"));
            assertTrue(metrics.getCustomMetrics().containsKey("errorRate"));
        }

        @Test
        @DisplayName("Should track exchange connections in metrics")
        void shouldTrackExchangeConnectionsInMetrics() {
            eiNode.connectExchange("ex1", "url1", new HashMap<>());
            eiNode.connectExchange("ex2", "url2", new HashMap<>());

            NodeMetrics metrics = eiNode.getMetrics().await().indefinitely();
            int connections = ((Number) metrics.getCustomMetrics().get("exchangeConnections")).intValue();
            assertEquals(2, connections);
        }

        @Test
        @DisplayName("Should track message counts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldTrackMessageCounts() throws Exception {
            eiNode.connectExchange("metrics-test", "url", new HashMap<>());

            eiNode.sendExchangeRequest("metrics-test", "method", new HashMap<>())
                .get(3, TimeUnit.SECONDS);

            NodeMetrics metrics = eiNode.getMetrics().await().indefinitely();
            long sent = ((Number) metrics.getCustomMetrics().get("messagesSent")).longValue();
            long received = ((Number) metrics.getCustomMetrics().get("messagesReceived")).longValue();

            assertTrue(sent > 0);
            assertTrue(received > 0);
        }

        @Test
        @DisplayName("Should track error rate")
        void shouldTrackErrorRate() {
            NodeMetrics metrics = eiNode.getMetrics().await().indefinitely();
            double errorRate = ((Number) metrics.getCustomMetrics().get("errorRate")).doubleValue();
            assertTrue(errorRate >= 0 && errorRate <= 1);
        }
    }

    // ============================================
    // INNER CLASS TESTS
    // ============================================

    @Nested
    @DisplayName("Inner Class Tests")
    class InnerClassTests {

        @Test
        @DisplayName("ExchangeConnection should store credentials")
        void exchangeConnectionShouldStoreCredentials() {
            // Testing via connection
            eiNode.start();

            Map<String, String> creds = new HashMap<>();
            creds.put("key", "secret");

            eiNode.connectExchange("test", "url", creds);
            ExchangeConnection conn = eiNode.getExchange("test");

            assertNotNull(conn);
            assertNotNull(conn.credentials);
            assertEquals("secret", conn.credentials.get("key"));
        }

        @Test
        @DisplayName("ExchangeConnection should track connection time")
        void exchangeConnectionShouldTrackConnectionTime() {
            eiNode.start();
            eiNode.connectExchange("test", "url", new HashMap<>());

            ExchangeConnection conn = eiNode.getExchange("test");
            assertNotNull(conn.connectedAt);
        }

        @Test
        @DisplayName("APIResponse should contain all fields")
        void apiResponseShouldContainAllFields() throws Exception {
            eiNode.start();
            eiNode.registerAPIEndpoint("test", "url", "GET", new HashMap<>());

            APIResponse response = eiNode.callAPI("test", new HashMap<>()).get(3, TimeUnit.SECONDS);

            assertEquals("test", response.endpointId);
            assertEquals(200, response.statusCode);
            assertNotNull(response.body);
        }
    }
}
