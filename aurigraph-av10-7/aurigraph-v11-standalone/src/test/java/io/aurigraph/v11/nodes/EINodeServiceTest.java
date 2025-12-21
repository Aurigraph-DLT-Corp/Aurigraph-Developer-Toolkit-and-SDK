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
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for EINodeService
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle management
 * - Exchange connectivity coordination
 * - Data feed management
 * - API gateway coordination
 * - Event routing
 * - Network statistics
 */
@DisplayName("EINodeService Tests")
class EINodeServiceTest {

    private EINodeService service;

    @BeforeEach
    void setUp() {
        service = new EINodeService();
        service.init();
    }

    @AfterEach
    void tearDown() {
        service.cleanup();
    }

    // ============================================
    // NODE LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Node Lifecycle Tests")
    class NodeLifecycleTests {

        @Test
        @DisplayName("Should create and register EI node")
        void shouldCreateAndRegisterEINode() {
            EINode node = service.createAndRegister("ei-1").await().indefinitely();

            assertNotNull(node);
            assertEquals("ei-1", node.getNodeId());
            assertTrue(service.hasNode("ei-1"));
        }

        @Test
        @DisplayName("Should throw exception for duplicate node ID")
        void shouldThrowExceptionForDuplicateNodeId() {
            service.createAndRegister("ei-dup").await().indefinitely();

            assertThrows(Exception.class, () ->
                service.createAndRegister("ei-dup").await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should start EI node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartEINode() {
            service.createAndRegister("ei-start").await().indefinitely();
            Boolean result = service.start("ei-start").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("ei-start").isRunning());
        }

        @Test
        @DisplayName("Should stop EI node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldStopEINode() {
            service.createAndRegister("ei-stop").await().indefinitely();
            service.start("ei-stop").await().indefinitely();
            Boolean result = service.stop("ei-stop").await().indefinitely();

            assertTrue(result);
            assertFalse(service.getNode("ei-stop").isRunning());
        }

        @Test
        @DisplayName("Should restart EI node")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldRestartEINode() {
            service.createAndRegister("ei-restart").await().indefinitely();
            service.start("ei-restart").await().indefinitely();
            Boolean result = service.restart("ei-restart").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("ei-restart").isRunning());
        }

        @Test
        @DisplayName("Should remove EI node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldRemoveEINode() {
            service.createAndRegister("ei-remove").await().indefinitely();
            service.start("ei-remove").await().indefinitely();
            Boolean result = service.remove("ei-remove").await().indefinitely();

            assertTrue(result);
            assertFalse(service.hasNode("ei-remove"));
        }
    }

    // ============================================
    // EXCHANGE MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Exchange Management Tests")
    class ExchangeManagementTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("ex-node").await().indefinitely();
            service.start("ex-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should connect exchange on node")
        void shouldConnectExchangeOnNode() {
            Map<String, String> creds = new HashMap<>();
            creds.put("apiKey", "key");

            Boolean result = service.connectExchange("ex-node", "binance", "wss://stream.binance.com", creds)
                .await().indefinitely();

            assertTrue(result);
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.connectExchange("non-existent", "ex", "url", new HashMap<>())
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get all exchanges across nodes")
        void shouldGetAllExchangesAcrossNodes() {
            service.createAndRegister("ex-node-2").await().indefinitely();
            service.start("ex-node-2").await().indefinitely();

            service.connectExchange("ex-node", "ex1", "url1", new HashMap<>()).await().indefinitely();
            service.connectExchange("ex-node-2", "ex2", "url2", new HashMap<>()).await().indefinitely();

            Map<String, ExchangeConnection> exchanges = service.getAllExchangeConnections();
            assertEquals(2, exchanges.size());
        }

        @Test
        @DisplayName("Should send request to exchange")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSendRequestToExchange() throws Exception {
            service.connectExchange("ex-node", "request-ex", "url", new HashMap<>()).await().indefinitely();

            Map<String, Object> params = new HashMap<>();
            params.put("symbol", "BTC/USD");

            CompletableFuture<ExchangeResponse> future = service.sendExchangeRequest("request-ex", "getPrice", params);
            ExchangeResponse response = future.get(3, TimeUnit.SECONDS);

            assertTrue(response.success);
        }

        @Test
        @DisplayName("Should fail for non-existent exchange request")
        void shouldFailForNonExistentExchangeRequest() {
            CompletableFuture<ExchangeResponse> future = service.sendExchangeRequest("no-ex", "method", new HashMap<>());
            assertThrows(Exception.class, () -> future.get(1, TimeUnit.SECONDS));
        }
    }

    // ============================================
    // DATA FEED MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Data Feed Management Tests")
    class DataFeedManagementTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("feed-node").await().indefinitely();
            service.start("feed-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should subscribe to feed on node")
        void shouldSubscribeToFeedOnNode() {
            Boolean result = service.subscribeToFeed("feed-node", "btc-feed", "binance", "price", 1000)
                .await().indefinitely();

            assertTrue(result);
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.subscribeToFeed("non-existent", "feed", "source", "type", 1000)
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get feed data")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetFeedData() throws InterruptedException {
            service.subscribeToFeed("feed-node", "data-feed", "source", "price", 100)
                .await().indefinitely();

            Thread.sleep(200);

            Object data = service.getFeedData("data-feed");
            assertNotNull(data);
        }

        @Test
        @DisplayName("Should return null for non-existent feed")
        void shouldReturnNullForNonExistentFeed() {
            Object data = service.getFeedData("non-existent");
            assertNull(data);
        }

        @Test
        @DisplayName("Should broadcast feed data to all nodes")
        void shouldBroadcastFeedDataToAllNodes() {
            service.createAndRegister("feed-node-2").await().indefinitely();
            service.start("feed-node-2").await().indefinitely();

            Integer published = service.broadcastFeedData("test-feed", "data").await().indefinitely();
            assertEquals(2, published);
        }
    }

    // ============================================
    // API GATEWAY TESTS
    // ============================================

    @Nested
    @DisplayName("API Gateway Tests")
    class APIGatewayTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("api-node").await().indefinitely();
            service.start("api-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should register API endpoint on node")
        void shouldRegisterAPIEndpointOnNode() {
            Map<String, String> headers = new HashMap<>();
            headers.put("Authorization", "Bearer token");

            // registerAPIEndpoint returns Uni<Void>
            assertDoesNotThrow(() ->
                service.registerAPIEndpoint(
                    "api-node",
                    "users-api",
                    "https://api.example.com/users",
                    "GET",
                    headers
                ).await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.registerAPIEndpoint("non-existent", "api", "url", "GET", new HashMap<>())
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should call API endpoint")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldCallAPIEndpoint() throws Exception {
            service.registerAPIEndpoint("api-node", "call-api", "https://api.test.com", "GET", new HashMap<>())
                .await().indefinitely();

            CompletableFuture<APIResponse> future = service.callAPI("call-api", new HashMap<>());
            APIResponse response = future.get(3, TimeUnit.SECONDS);

            assertNotNull(response);
            assertEquals("call-api", response.endpointId);
        }

        @Test
        @DisplayName("Should fail for non-existent endpoint")
        void shouldFailForNonExistentEndpoint() {
            CompletableFuture<APIResponse> future = service.callAPI("non-existent", new HashMap<>());
            assertThrows(Exception.class, () -> future.get(1, TimeUnit.SECONDS));
        }
    }

    // ============================================
    // EVENT ROUTING TESTS
    // ============================================

    @Nested
    @DisplayName("Event Routing Tests")
    class EventRoutingTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("event-node-" + i).await().indefinitely();
                service.start("event-node-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should add event route")
        void shouldAddEventRoute() {
            assertDoesNotThrow(() -> service.addEventRoute("price-update", "event-node-0"));
        }

        @Test
        @DisplayName("Should remove event route")
        void shouldRemoveEventRoute() {
            service.addEventRoute("event-type", "event-node-0");
            assertDoesNotThrow(() -> service.removeEventRoute("event-type", "event-node-0"));
        }

        @Test
        @DisplayName("Should route event to subscribed nodes")
        void shouldRouteEventToSubscribedNodes() {
            // Add routes for all nodes
            for (int i = 0; i < 3; i++) {
                service.addEventRoute("broadcast-event", "event-node-" + i);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("value", 100);

            Integer routed = service.routeEvent("broadcast-event", data).await().indefinitely();
            assertEquals(3, routed);
        }

        @Test
        @DisplayName("Should return 0 when no routes configured")
        void shouldReturnZeroWhenNoRoutesConfigured() {
            Integer routed = service.routeEvent("no-routes", "data").await().indefinitely();
            assertEquals(0, routed);
        }
    }

    // ============================================
    // DATA NORMALIZATION TESTS
    // ============================================

    @Nested
    @DisplayName("Data Normalization Tests")
    class DataNormalizationTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("norm-node").await().indefinitely();
            service.start("norm-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should normalize data on node")
        void shouldNormalizeDataOnNode() {
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("Price", 50000);
            rawData.put("Volume", 1000);

            Map<String, Object> normalized = service.normalizeData("norm-node", "exchange", rawData);

            assertNotNull(normalized);
            assertTrue(normalized.containsKey("_source"));
            assertTrue(normalized.containsKey("_nodeId"));
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.normalizeData("non-existent", "source", new HashMap<>())
            );
        }

        @Test
        @DisplayName("Should transform and broadcast data")
        void shouldTransformAndBroadcastData() {
            service.createAndRegister("norm-node-2").await().indefinitely();
            service.start("norm-node-2").await().indefinitely();

            Map<String, Object> rawData = new HashMap<>();
            rawData.put("data", "value");

            Map<String, Object> normalized = service.transformAndBroadcast("source", rawData)
                .await().indefinitely();

            assertNotNull(normalized);
            assertTrue(normalized.containsKey("_source"));
        }
    }

    // ============================================
    // HEALTH & METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Health & Metrics Tests")
    class HealthMetricsTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 2; i++) {
                service.createAndRegister("health-ei-" + i).await().indefinitely();
                service.start("health-ei-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get node health")
        void shouldGetNodeHealth() {
            NodeHealth health = service.healthCheck("health-ei-0").await().indefinitely();

            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should get node metrics")
        void shouldGetNodeMetrics() {
            NodeMetrics metrics = service.getMetrics("health-ei-0").await().indefinitely();

            assertNotNull(metrics);
            assertNotNull(metrics.getCustomMetrics());
        }

        @Test
        @DisplayName("Should get all nodes health")
        void shouldGetAllNodesHealth() {
            Map<String, NodeHealth> healthMap = service.healthCheckAll().await().indefinitely();

            assertEquals(2, healthMap.size());
        }

        @Test
        @DisplayName("Should get network stats")
        void shouldGetNetworkStats() {
            Map<String, Object> stats = service.getNetworkStats();

            assertNotNull(stats);
            assertTrue(stats.containsKey("totalMessagesReceived"));
            assertTrue(stats.containsKey("totalMessagesSent"));
            assertTrue(stats.containsKey("totalDataBytes"));
            assertTrue(stats.containsKey("totalExchangeConnections"));
        }
    }

    // ============================================
    // NETWORK STATISTICS TESTS
    // ============================================

    @Nested
    @DisplayName("Network Statistics Tests")
    class NetworkStatisticsTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("stats-ei-" + i).await().indefinitely();
                service.start("stats-ei-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get network statistics")
        void shouldGetNetworkStatistics() {
            Map<String, Object> stats = service.getNetworkStats();

            assertNotNull(stats);
            assertEquals(3, stats.get("totalNodes"));
            assertEquals(3L, stats.get("runningNodes"));
            assertTrue((Long) stats.get("healthyNodes") >= 0);
        }

        @Test
        @DisplayName("Should track exchanges in stats")
        void shouldTrackExchangesInStats() {
            service.connectExchange("stats-ei-0", "stat-ex1", "url1", new HashMap<>()).await().indefinitely();
            service.connectExchange("stats-ei-1", "stat-ex2", "url2", new HashMap<>()).await().indefinitely();

            Map<String, Object> stats = service.getNetworkStats();
            long totalExchanges = (Long) stats.get("totalExchangeConnections");
            assertEquals(2, totalExchanges);
        }

        @Test
        @DisplayName("Should track message counts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldTrackMessageCounts() throws Exception {
            service.connectExchange("stats-ei-0", "msg-ex", "url", new HashMap<>()).await().indefinitely();

            service.sendExchangeRequest("msg-ex", "method", new HashMap<>()).get(3, TimeUnit.SECONDS);

            Map<String, Object> stats = service.getNetworkStats();
            long totalSent = (Long) stats.get("totalMessagesSent");
            assertTrue(totalSent > 0);
        }

        @Test
        @DisplayName("Should track average throughput")
        void shouldTrackAverageThroughput() {
            Map<String, Object> stats = service.getNetworkStats();
            double avgThroughput = (Double) stats.get("averageThroughput");
            assertTrue(avgThroughput >= 0);
        }

        @Test
        @DisplayName("Should get total throughput")
        void shouldGetTotalThroughput() {
            double throughput = service.getTotalThroughput();
            assertTrue(throughput >= 0);
        }
    }

    // ============================================
    // ACCESSOR TESTS
    // ============================================

    @Nested
    @DisplayName("Accessor Tests")
    class AccessorTests {

        @Test
        @DisplayName("Should get node by ID")
        void shouldGetNodeById() {
            service.createAndRegister("accessor-ei-test").await().indefinitely();

            EINode node = service.getNode("accessor-ei-test");
            assertNotNull(node);
            assertEquals("accessor-ei-test", node.getNodeId());
        }

        @Test
        @DisplayName("Should return null for non-existent node")
        void shouldReturnNullForNonExistentNode() {
            EINode node = service.getNode("non-existent");
            assertNull(node);
        }

        @Test
        @DisplayName("Should get all nodes")
        void shouldGetAllNodes() {
            service.createAndRegister("all-ei-1").await().indefinitely();
            service.createAndRegister("all-ei-2").await().indefinitely();

            Map<String, EINode> nodes = service.getAllNodes();
            assertEquals(2, nodes.size());
        }

        @Test
        @DisplayName("Should get node count")
        void shouldGetNodeCount() {
            service.createAndRegister("count-ei-1").await().indefinitely();
            service.createAndRegister("count-ei-2").await().indefinitely();
            service.createAndRegister("count-ei-3").await().indefinitely();

            assertEquals(3, service.getNodeCount());
        }

        @Test
        @DisplayName("Should check if node exists")
        void shouldCheckIfNodeExists() {
            service.createAndRegister("exists-ei-test").await().indefinitely();

            assertTrue(service.hasNode("exists-ei-test"));
            assertFalse(service.hasNode("does-not-exist"));
        }

        @Test
        @DisplayName("Should get running node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetRunningNodeCount() {
            service.createAndRegister("running-ei-1").await().indefinitely();
            service.createAndRegister("running-ei-2").await().indefinitely();
            service.start("running-ei-1").await().indefinitely();

            assertEquals(1, service.getRunningNodeCount());
        }

        @Test
        @DisplayName("Should get healthy node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetHealthyNodeCount() {
            service.createAndRegister("healthy-ei-1").await().indefinitely();
            service.start("healthy-ei-1").await().indefinitely();

            assertEquals(1, service.getHealthyNodeCount());
        }
    }
}
