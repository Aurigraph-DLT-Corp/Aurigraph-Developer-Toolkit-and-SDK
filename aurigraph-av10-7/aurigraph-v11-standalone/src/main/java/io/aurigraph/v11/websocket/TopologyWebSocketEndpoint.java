package io.aurigraph.v11.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.contracts.composite.*;
import io.quarkus.logging.Log;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Topology WebSocket Endpoint - Real-time Topology Updates
 *
 * Sprint 10-11 Implementation (AV11-605-04)
 * WebSocket endpoint for real-time topology visualization updates.
 *
 * Features:
 * <ul>
 *   <li>10K concurrent connection support</li>
 *   <li>Per-topology subscription model</li>
 *   <li>Heartbeat/ping-pong for connection health</li>
 *   <li>Broadcast topology changes in real-time</li>
 *   <li>Connection metrics and monitoring</li>
 * </ul>
 *
 * Message Types:
 * <ul>
 *   <li>SUBSCRIBE - Subscribe to topology updates</li>
 *   <li>UNSUBSCRIBE - Unsubscribe from topology updates</li>
 *   <li>TOPOLOGY_UPDATE - Full topology update</li>
 *   <li>NODE_ADDED - New node added</li>
 *   <li>NODE_UPDATED - Node properties updated</li>
 *   <li>NODE_REMOVED - Node removed</li>
 *   <li>EDGE_ADDED - New edge added</li>
 *   <li>EDGE_REMOVED - Edge removed</li>
 *   <li>VERIFICATION_UPDATE - VVB verification status changed</li>
 *   <li>PING/PONG - Connection health check</li>
 * </ul>
 *
 * @author J4C Development Agent
 * @version 12.2.0
 * @since AV11-605-04
 */
@ServerEndpoint("/topology-ws")
@ApplicationScoped
public class TopologyWebSocketEndpoint {

    @Inject
    TopologyService topologyService;

    @Inject
    ObjectMapper objectMapper;

    // Session management
    private static final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> sessionSubscriptions = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> topologySubscribers = new ConcurrentHashMap<>();

    // Metrics
    private static final AtomicLong totalConnections = new AtomicLong(0);
    private static final AtomicLong totalMessages = new AtomicLong(0);
    private static final AtomicLong totalErrors = new AtomicLong(0);

    // Configuration
    private static final int MAX_CONNECTIONS = 10000;
    private static final int PING_INTERVAL_SECONDS = 30;

    /**
     * Called when a new WebSocket connection is established.
     *
     * @param session The WebSocket session
     */
    @OnOpen
    public void onOpen(Session session) {
        if (sessions.size() >= MAX_CONNECTIONS) {
            Log.warnf("Maximum connections reached (%d), rejecting new connection", MAX_CONNECTIONS);
            try {
                session.close(new CloseReason(CloseReason.CloseCodes.TRY_AGAIN_LATER,
                    "Maximum connections reached"));
            } catch (IOException e) {
                Log.error("Failed to close session", e);
            }
            return;
        }

        String sessionId = session.getId();
        sessions.put(sessionId, session);
        sessionSubscriptions.put(sessionId, ConcurrentHashMap.newKeySet());
        totalConnections.incrementAndGet();

        Log.infof("WebSocket connection opened: %s (total: %d)", sessionId, sessions.size());

        // Send welcome message
        sendMessage(session, Map.of(
            "type", "CONNECTED",
            "sessionId", sessionId,
            "timestamp", Instant.now().toString(),
            "message", "Connected to Topology WebSocket"
        ));
    }

    /**
     * Called when a WebSocket connection is closed.
     *
     * @param session The WebSocket session
     * @param reason The close reason
     */
    @OnClose
    public void onClose(Session session, CloseReason reason) {
        String sessionId = session.getId();

        // Clean up subscriptions
        Set<String> subscriptions = sessionSubscriptions.remove(sessionId);
        if (subscriptions != null) {
            for (String compositeId : subscriptions) {
                Set<String> subscribers = topologySubscribers.get(compositeId);
                if (subscribers != null) {
                    subscribers.remove(sessionId);
                    if (subscribers.isEmpty()) {
                        topologySubscribers.remove(compositeId);
                    }
                }
            }
        }

        sessions.remove(sessionId);

        Log.infof("WebSocket connection closed: %s (reason: %s, total: %d)",
            sessionId, reason.getReasonPhrase(), sessions.size());
    }

    /**
     * Called when a message is received from a client.
     *
     * @param session The WebSocket session
     * @param message The message content
     */
    @OnMessage
    public void onMessage(Session session, String message) {
        totalMessages.incrementAndGet();
        String sessionId = session.getId();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> msg = objectMapper.readValue(message, Map.class);
            String type = (String) msg.get("type");

            Log.debugf("Received message from %s: type=%s", sessionId, type);

            switch (type != null ? type.toUpperCase() : "") {
                case "SUBSCRIBE":
                    handleSubscribe(session, msg);
                    break;

                case "UNSUBSCRIBE":
                    handleUnsubscribe(session, msg);
                    break;

                case "PONG":
                    // Client responded to ping - connection is healthy
                    Log.debugf("Received PONG from %s", sessionId);
                    break;

                case "GET_TOPOLOGY":
                    handleGetTopology(session, msg);
                    break;

                default:
                    sendError(session, "Unknown message type: " + type);
            }
        } catch (JsonProcessingException e) {
            Log.errorf("Failed to parse message from %s: %s", sessionId, e.getMessage());
            sendError(session, "Invalid JSON message");
            totalErrors.incrementAndGet();
        }
    }

    /**
     * Called when an error occurs on a WebSocket connection.
     *
     * @param session The WebSocket session
     * @param throwable The error
     */
    @OnError
    public void onError(Session session, Throwable throwable) {
        String sessionId = session != null ? session.getId() : "unknown";
        Log.errorf("WebSocket error for session %s: %s", sessionId, throwable.getMessage());
        totalErrors.incrementAndGet();
    }

    /**
     * Handle subscription request.
     */
    private void handleSubscribe(Session session, Map<String, Object> msg) {
        String sessionId = session.getId();
        String compositeId = (String) msg.get("compositeId");

        if (compositeId == null || compositeId.isEmpty()) {
            sendError(session, "compositeId is required for subscription");
            return;
        }

        // Add to subscription maps
        sessionSubscriptions.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet())
            .add(compositeId);
        topologySubscribers.computeIfAbsent(compositeId, k -> ConcurrentHashMap.newKeySet())
            .add(sessionId);

        Log.infof("Session %s subscribed to topology: %s", sessionId, compositeId);

        // Send confirmation
        sendMessage(session, Map.of(
            "type", "SUBSCRIBED",
            "compositeId", compositeId,
            "timestamp", Instant.now().toString()
        ));

        // Send initial topology data
        topologyService.getTopologyForCompositeToken(compositeId, 4, true)
            .subscribe().with(
                topology -> {
                    if (topology != null) {
                        sendTopologyUpdate(session, compositeId, topology);
                    }
                },
                error -> Log.errorf("Failed to get topology for subscription: %s", error.getMessage())
            );
    }

    /**
     * Handle unsubscription request.
     */
    private void handleUnsubscribe(Session session, Map<String, Object> msg) {
        String sessionId = session.getId();
        String compositeId = (String) msg.get("compositeId");

        if (compositeId == null || compositeId.isEmpty()) {
            sendError(session, "compositeId is required for unsubscription");
            return;
        }

        // Remove from subscription maps
        Set<String> subscriptions = sessionSubscriptions.get(sessionId);
        if (subscriptions != null) {
            subscriptions.remove(compositeId);
        }

        Set<String> subscribers = topologySubscribers.get(compositeId);
        if (subscribers != null) {
            subscribers.remove(sessionId);
            if (subscribers.isEmpty()) {
                topologySubscribers.remove(compositeId);
            }
        }

        Log.infof("Session %s unsubscribed from topology: %s", sessionId, compositeId);

        sendMessage(session, Map.of(
            "type", "UNSUBSCRIBED",
            "compositeId", compositeId,
            "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Handle get topology request.
     */
    private void handleGetTopology(Session session, Map<String, Object> msg) {
        String compositeId = (String) msg.get("compositeId");
        Integer depth = (Integer) msg.getOrDefault("depth", 4);

        if (compositeId == null || compositeId.isEmpty()) {
            sendError(session, "compositeId is required");
            return;
        }

        topologyService.getTopologyForCompositeToken(compositeId, depth, true)
            .subscribe().with(
                topology -> {
                    if (topology != null) {
                        sendTopologyUpdate(session, compositeId, topology);
                    } else {
                        sendError(session, "Topology not found for: " + compositeId);
                    }
                },
                error -> sendError(session, "Failed to get topology: " + error.getMessage())
            );
    }

    /**
     * Send topology update to a session.
     */
    private void sendTopologyUpdate(Session session, String compositeId, TokenTopology topology) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        for (TokenTopology.TopologyNode node : topology.getNodes()) {
            Map<String, Object> nodeMap = new LinkedHashMap<>();
            nodeMap.put("id", node.getId());
            nodeMap.put("label", node.getLabel());
            nodeMap.put("group", node.getType().name());
            nodeMap.put("color", node.getStyle().getColor());
            nodeMap.put("size", node.getStyle().getSize());
            nodeMap.put("verified", node.isVerified());
            nodeMap.put("status", node.getStatus());
            nodes.add(nodeMap);
        }

        for (TokenTopology.TopologyEdge edge : topology.getEdges()) {
            Map<String, Object> edgeMap = new LinkedHashMap<>();
            edgeMap.put("source", edge.getSource());
            edgeMap.put("target", edge.getTarget());
            edgeMap.put("type", edge.getType().name());
            edgeMap.put("label", edge.getLabel());
            links.add(edgeMap);
        }

        sendMessage(session, Map.of(
            "type", "TOPOLOGY_UPDATE",
            "compositeId", compositeId,
            "nodes", nodes,
            "links", links,
            "metadata", Map.of(
                "topologyId", topology.getTopologyId(),
                "depth", topology.getDepth(),
                "generatedAt", topology.getGeneratedAt().toString()
            ),
            "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Broadcast a topology event to all subscribers.
     *
     * @param compositeId The composite token ID
     * @param eventType The event type
     * @param data The event data
     */
    public void broadcastEvent(String compositeId, String eventType, Map<String, Object> data) {
        Set<String> subscribers = topologySubscribers.get(compositeId);
        if (subscribers == null || subscribers.isEmpty()) {
            return;
        }

        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", eventType);
        message.put("compositeId", compositeId);
        message.putAll(data);
        message.put("timestamp", Instant.now().toString());

        for (String sessionId : subscribers) {
            Session session = sessions.get(sessionId);
            if (session != null && session.isOpen()) {
                sendMessage(session, message);
            }
        }

        Log.debugf("Broadcast %s to %d subscribers for %s", eventType, subscribers.size(), compositeId);
    }

    /**
     * Broadcast node added event.
     */
    public void broadcastNodeAdded(String compositeId, TokenTopology.TopologyNode node) {
        broadcastEvent(compositeId, "NODE_ADDED", Map.of(
            "node", Map.of(
                "id", node.getId(),
                "label", node.getLabel(),
                "group", node.getType().name(),
                "verified", node.isVerified()
            )
        ));
    }

    /**
     * Broadcast node updated event.
     */
    public void broadcastNodeUpdated(String compositeId, TokenTopology.TopologyNode node) {
        broadcastEvent(compositeId, "NODE_UPDATED", Map.of(
            "node", Map.of(
                "id", node.getId(),
                "label", node.getLabel(),
                "group", node.getType().name(),
                "verified", node.isVerified(),
                "status", node.getStatus() != null ? node.getStatus() : ""
            )
        ));
    }

    /**
     * Broadcast edge added event.
     */
    public void broadcastEdgeAdded(String compositeId, TokenTopology.TopologyEdge edge) {
        broadcastEvent(compositeId, "EDGE_ADDED", Map.of(
            "edge", Map.of(
                "source", edge.getSource(),
                "target", edge.getTarget(),
                "type", edge.getType().name()
            )
        ));
    }

    /**
     * Broadcast verification update event.
     */
    public void broadcastVerificationUpdate(String compositeId, String nodeId, boolean verified) {
        broadcastEvent(compositeId, "VERIFICATION_UPDATE", Map.of(
            "nodeId", nodeId,
            "verified", verified
        ));
    }

    /**
     * Send message to a session.
     */
    private void sendMessage(Session session, Map<String, Object> message) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            session.getAsyncRemote().sendText(json, result -> {
                if (result.getException() != null) {
                    Log.errorf("Failed to send message to %s: %s",
                        session.getId(), result.getException().getMessage());
                    totalErrors.incrementAndGet();
                }
            });
        } catch (JsonProcessingException e) {
            Log.errorf("Failed to serialize message: %s", e.getMessage());
            totalErrors.incrementAndGet();
        }
    }

    /**
     * Send error message to a session.
     */
    private void sendError(Session session, String error) {
        sendMessage(session, Map.of(
            "type", "ERROR",
            "error", error,
            "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Scheduled ping to all connected sessions to maintain connection health.
     */
    @Scheduled(every = "30s")
    void pingConnections() {
        if (sessions.isEmpty()) {
            return;
        }

        Log.debugf("Pinging %d WebSocket connections", sessions.size());

        Map<String, Object> pingMessage = Map.of(
            "type", "PING",
            "timestamp", Instant.now().toString()
        );

        for (Session session : sessions.values()) {
            if (session.isOpen()) {
                sendMessage(session, pingMessage);
            }
        }
    }

    /**
     * Get connection statistics.
     *
     * @return Connection metrics
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("activeConnections", sessions.size());
        stats.put("totalConnections", totalConnections.get());
        stats.put("totalMessages", totalMessages.get());
        stats.put("totalErrors", totalErrors.get());
        stats.put("activeSubscriptions", topologySubscribers.size());
        stats.put("maxConnections", MAX_CONNECTIONS);

        // Subscription details
        Map<String, Integer> subscriptionCounts = new LinkedHashMap<>();
        topologySubscribers.forEach((compositeId, subscribers) ->
            subscriptionCounts.put(compositeId, subscribers.size())
        );
        stats.put("subscriptionsByTopology", subscriptionCounts);

        return stats;
    }

    /**
     * Get the number of active connections.
     *
     * @return Active connection count
     */
    public int getActiveConnections() {
        return sessions.size();
    }

    /**
     * Check if a session is connected.
     *
     * @param sessionId The session ID
     * @return True if connected
     */
    public boolean isConnected(String sessionId) {
        Session session = sessions.get(sessionId);
        return session != null && session.isOpen();
    }
}
