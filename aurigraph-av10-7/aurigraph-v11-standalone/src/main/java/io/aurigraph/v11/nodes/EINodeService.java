package io.aurigraph.v11.nodes;

import io.aurigraph.v11.nodes.EINode.ExchangeConnection;
import io.aurigraph.v11.nodes.EINode.ExchangeResponse;
import io.aurigraph.v11.nodes.EINode.DataFeed;
import io.aurigraph.v11.nodes.EINode.APIResponse;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EINodeService - Service for managing EINode (Enterprise Infrastructure) instances.
 *
 * Extends GenericNodeService to provide EI-specific functionality:
 * - Exchange connectivity management
 * - Data feed orchestration
 * - API gateway coordination
 * - Cross-node event routing
 * - Unified monitoring
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class EINodeService extends GenericNodeService<EINode> {

    private static final Logger LOG = Logger.getLogger(EINodeService.class);

    // Global exchange registry
    private final Map<String, String> exchangeToNodeMapping = new ConcurrentHashMap<>();

    // Global feed registry
    private final Map<String, String> feedToNodeMapping = new ConcurrentHashMap<>();

    // Event routing table
    private final Map<String, Set<String>> eventRoutingTable = new ConcurrentHashMap<>();

    @Override
    protected EINode createNode(String nodeId) {
        return new EINode(nodeId);
    }

    @Override
    protected void doInit() {
        LOG.info("EINodeService initialized");
    }

    @Override
    protected void doCleanup() {
        exchangeToNodeMapping.clear();
        feedToNodeMapping.clear();
        eventRoutingTable.clear();
        LOG.info("EINodeService cleaned up");
    }

    // ============================================
    // EXCHANGE MANAGEMENT
    // ============================================

    /**
     * Connect to an exchange through a specific node
     */
    public Uni<Boolean> connectExchange(String nodeId, String exchangeId, String url, Map<String, String> credentials) {
        return Uni.createFrom().item(() -> {
            EINode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("EI Node not found: " + nodeId);
            }

            boolean connected = node.connectExchange(exchangeId, url, credentials);
            if (connected) {
                exchangeToNodeMapping.put(exchangeId, nodeId);
            }
            return connected;
        });
    }

    /**
     * Get exchange connection status across all nodes
     */
    public Map<String, ExchangeConnection> getAllExchangeConnections() {
        Map<String, ExchangeConnection> allConnections = new HashMap<>();
        for (EINode node : getAllNodes().values()) {
            allConnections.putAll(node.getAllExchanges());
        }
        return allConnections;
    }

    /**
     * Send request to exchange through appropriate node
     */
    public CompletableFuture<ExchangeResponse> sendExchangeRequest(String exchangeId, String method, Map<String, Object> params) {
        String nodeId = exchangeToNodeMapping.get(exchangeId);
        if (nodeId == null) {
            CompletableFuture<ExchangeResponse> failed = new CompletableFuture<>();
            failed.completeExceptionally(new IllegalArgumentException("Exchange not connected: " + exchangeId));
            return failed;
        }

        EINode node = getNode(nodeId);
        if (node == null || !node.isRunning()) {
            CompletableFuture<ExchangeResponse> failed = new CompletableFuture<>();
            failed.completeExceptionally(new IllegalStateException("Node not available: " + nodeId));
            return failed;
        }

        return node.sendExchangeRequest(exchangeId, method, params);
    }

    // ============================================
    // DATA FEED MANAGEMENT
    // ============================================

    /**
     * Subscribe to a data feed through a specific node
     */
    public Uni<Boolean> subscribeToFeed(String nodeId, String feedId, String source, String dataType, long intervalMs) {
        return Uni.createFrom().item(() -> {
            EINode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("EI Node not found: " + nodeId);
            }

            boolean subscribed = node.subscribeToFeed(feedId, source, dataType, intervalMs);
            if (subscribed) {
                feedToNodeMapping.put(feedId, nodeId);
            }
            return subscribed;
        });
    }

    /**
     * Get all active data feeds across nodes
     */
    public List<Map<String, Object>> getAllActiveFeeds() {
        List<Map<String, Object>> feeds = new ArrayList<>();
        for (Map.Entry<String, EINode> entry : getAllNodes().entrySet()) {
            EINode node = entry.getValue();
            // Each node tracks its own feeds internally
            Map<String, Object> nodeFeedsInfo = new HashMap<>();
            nodeFeedsInfo.put("nodeId", entry.getKey());
            nodeFeedsInfo.put("running", node.isRunning());
            nodeFeedsInfo.put("healthy", node.isHealthy());
            feeds.add(nodeFeedsInfo);
        }
        return feeds;
    }

    /**
     * Get latest data from a feed
     */
    public Object getFeedData(String feedId) {
        String nodeId = feedToNodeMapping.get(feedId);
        if (nodeId == null) {
            return null;
        }

        EINode node = getNode(nodeId);
        if (node == null) {
            return null;
        }

        return node.getFeedData(feedId);
    }

    /**
     * Broadcast data to all nodes
     */
    public Uni<Integer> broadcastFeedData(String feedId, Object data) {
        return Uni.createFrom().item(() -> {
            int published = 0;
            for (EINode node : getAllNodes().values()) {
                if (node.isRunning()) {
                    node.publishEvent(feedId, data);
                    published++;
                }
            }
            return published;
        });
    }

    // ============================================
    // API GATEWAY MANAGEMENT
    // ============================================

    /**
     * Register an API endpoint on a specific node
     */
    public Uni<Void> registerAPIEndpoint(String nodeId, String endpointId, String url, String method, Map<String, String> headers) {
        return Uni.createFrom().item(() -> {
            EINode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("EI Node not found: " + nodeId);
            }

            node.registerAPIEndpoint(endpointId, url, method, headers);
            return null;
        });
    }

    /**
     * Call an API endpoint through load-balanced node selection
     */
    public CompletableFuture<APIResponse> callAPI(String endpointId, Map<String, Object> params) {
        // Find a healthy node that has this endpoint
        EINode selectedNode = selectHealthyNode();
        if (selectedNode == null) {
            CompletableFuture<APIResponse> failed = new CompletableFuture<>();
            failed.completeExceptionally(new IllegalStateException("No healthy EI nodes available"));
            return failed;
        }

        return selectedNode.callAPI(endpointId, params);
    }

    /**
     * Select a healthy node for load balancing
     */
    private EINode selectHealthyNode() {
        return getAllNodes().values().stream()
            .filter(n -> n.isRunning() && n.isHealthy())
            .findFirst()
            .orElse(null);
    }

    // ============================================
    // EVENT ROUTING
    // ============================================

    /**
     * Configure event routing between nodes
     */
    public void addEventRoute(String eventType, String targetNodeId) {
        eventRoutingTable.computeIfAbsent(eventType, k -> ConcurrentHashMap.newKeySet())
            .add(targetNodeId);
    }

    /**
     * Remove event route
     */
    public void removeEventRoute(String eventType, String targetNodeId) {
        Set<String> routes = eventRoutingTable.get(eventType);
        if (routes != null) {
            routes.remove(targetNodeId);
        }
    }

    /**
     * Route event to subscribed nodes
     */
    public Uni<Integer> routeEvent(String eventType, Object data) {
        return Uni.createFrom().item(() -> {
            Set<String> targetNodes = eventRoutingTable.get(eventType);
            if (targetNodes == null || targetNodes.isEmpty()) {
                return 0;
            }

            int routed = 0;
            for (String nodeId : targetNodes) {
                EINode node = getNode(nodeId);
                if (node != null && node.isRunning()) {
                    node.publishEvent(eventType, data);
                    routed++;
                }
            }
            return routed;
        });
    }

    // ============================================
    // DATA TRANSFORMATION
    // ============================================

    /**
     * Normalize data through a specific node
     */
    public Map<String, Object> normalizeData(String nodeId, String sourceType, Map<String, Object> rawData) {
        EINode node = getNode(nodeId);
        if (node == null) {
            throw new IllegalArgumentException("EI Node not found: " + nodeId);
        }
        return node.normalizeData(sourceType, rawData);
    }

    /**
     * Transform data across network
     */
    public Uni<Map<String, Object>> transformAndBroadcast(String sourceType, Map<String, Object> rawData) {
        return Uni.createFrom().item(() -> {
            EINode selectedNode = selectHealthyNode();
            if (selectedNode == null) {
                throw new IllegalStateException("No healthy nodes available");
            }

            Map<String, Object> normalized = selectedNode.normalizeData(sourceType, rawData);

            // Broadcast to all other nodes
            for (EINode node : getAllNodes().values()) {
                if (node != selectedNode && node.isRunning()) {
                    node.publishEvent("data:" + sourceType, normalized);
                }
            }

            return normalized;
        });
    }

    // ============================================
    // METRICS & STATUS
    // ============================================

    /**
     * Get network-wide EI node statistics
     */
    public Map<String, Object> getNetworkStats() {
        Map<String, Object> stats = new ConcurrentHashMap<>();

        long totalMessagesReceived = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("messagesReceived", 0L)).longValue())
            .sum();

        long totalMessagesSent = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("messagesSent", 0L)).longValue())
            .sum();

        long totalDataBytes = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("totalDataBytes", 0L)).longValue())
            .sum();

        long totalExchanges = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("exchangeConnections", 0L)).longValue())
            .sum();

        long totalFeeds = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("activeDataFeeds", 0L)).longValue())
            .sum();

        long openCircuitBreakers = getAllNodes().values().stream()
            .mapToLong(n -> ((Number) n.getMetrics().customMetrics().getOrDefault("openCircuitBreakers", 0L)).longValue())
            .sum();

        double avgThroughput = getAllNodes().values().stream()
            .mapToDouble(n -> n.getMetrics().tps())
            .average()
            .orElse(0);

        stats.put("totalNodes", getNodeCount());
        stats.put("runningNodes", getRunningNodeCount());
        stats.put("healthyNodes", getHealthyNodeCount());
        stats.put("totalMessagesReceived", totalMessagesReceived);
        stats.put("totalMessagesSent", totalMessagesSent);
        stats.put("totalDataBytes", totalDataBytes);
        stats.put("totalExchangeConnections", totalExchanges);
        stats.put("registeredExchanges", exchangeToNodeMapping.size());
        stats.put("totalActiveFeeds", totalFeeds);
        stats.put("registeredFeeds", feedToNodeMapping.size());
        stats.put("openCircuitBreakers", openCircuitBreakers);
        stats.put("eventRoutes", eventRoutingTable.size());
        stats.put("averageThroughput", avgThroughput);

        return stats;
    }

    /**
     * Get total throughput across all EI nodes
     */
    public double getTotalThroughput() {
        return getAllNodes().values().stream()
            .filter(EINode::isRunning)
            .mapToDouble(n -> n.getMetrics().tps())
            .sum();
    }
}
