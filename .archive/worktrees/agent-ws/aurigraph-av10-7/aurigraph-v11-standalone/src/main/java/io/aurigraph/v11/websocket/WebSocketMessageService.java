package io.aurigraph.v11.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.websocket.dto.AssetUpdateMessage;
import io.aurigraph.v11.websocket.dto.ComplianceAlertMessage;
import io.aurigraph.v11.websocket.dto.RegistryUpdateMessage;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.Session;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * WebSocket Message Service
 *
 * Central coordinator for managing WebSocket sessions and broadcasting messages.
 * Provides thread-safe session management, message broadcasting, and statistics.
 *
 * Features:
 * - Thread-safe session management with ConcurrentHashMap
 * - Subscription-based message routing
 * - Automatic dead session cleanup
 * - Message statistics and monitoring
 * - JSON serialization with Jackson
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@ApplicationScoped
public class WebSocketMessageService {

    // Session storage by subscription type
    private final Map<String, Map<String, Session>> assetSessions = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Session>> registrySessions = new ConcurrentHashMap<>();
    private final Map<String, Session> complianceSessions = new ConcurrentHashMap<>();

    // Statistics
    private final AtomicLong messagesSent = new AtomicLong(0);
    private final AtomicLong messagesFailedToSend = new AtomicLong(0);
    private final AtomicLong totalSessions = new AtomicLong(0);
    private final AtomicLong deadSessionsRemoved = new AtomicLong(0);

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Subscribe session to asset updates for specific trace ID
     */
    public void subscribeToAssetUpdates(String traceId, Session session) {
        assetSessions.computeIfAbsent(traceId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);
        totalSessions.incrementAndGet();
        Log.infof("Session %s subscribed to asset updates for traceId: %s", session.getId(), traceId);
    }

    /**
     * Subscribe session to registry updates for specific registry type
     */
    public void subscribeToRegistryUpdates(String registryType, Session session) {
        registrySessions.computeIfAbsent(registryType, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);
        totalSessions.incrementAndGet();
        Log.infof("Session %s subscribed to registry updates for type: %s", session.getId(), registryType);
    }

    /**
     * Subscribe session to compliance alerts
     */
    public void subscribeToComplianceAlerts(Session session) {
        complianceSessions.put(session.getId(), session);
        totalSessions.incrementAndGet();
        Log.infof("Session %s subscribed to compliance alerts", session.getId());
    }

    /**
     * Unsubscribe session from asset updates
     */
    public void unsubscribeFromAssetUpdates(String traceId, Session session) {
        Map<String, Session> sessions = assetSessions.get(traceId);
        if (sessions != null) {
            sessions.remove(session.getId());
            if (sessions.isEmpty()) {
                assetSessions.remove(traceId);
            }
            totalSessions.decrementAndGet();
            Log.infof("Session %s unsubscribed from asset updates for traceId: %s", session.getId(), traceId);
        }
    }

    /**
     * Unsubscribe session from registry updates
     */
    public void unsubscribeFromRegistryUpdates(String registryType, Session session) {
        Map<String, Session> sessions = registrySessions.get(registryType);
        if (sessions != null) {
            sessions.remove(session.getId());
            if (sessions.isEmpty()) {
                registrySessions.remove(registryType);
            }
            totalSessions.decrementAndGet();
            Log.infof("Session %s unsubscribed from registry updates for type: %s", session.getId(), registryType);
        }
    }

    /**
     * Unsubscribe session from compliance alerts
     */
    public void unsubscribeFromComplianceAlerts(Session session) {
        complianceSessions.remove(session.getId());
        totalSessions.decrementAndGet();
        Log.infof("Session %s unsubscribed from compliance alerts", session.getId());
    }

    /**
     * Remove session from all subscriptions
     */
    public void removeSession(Session session) {
        String sessionId = session.getId();

        // Remove from asset sessions
        assetSessions.values().forEach(sessions -> {
            if (sessions.remove(sessionId) != null) {
                totalSessions.decrementAndGet();
            }
        });

        // Remove from registry sessions
        registrySessions.values().forEach(sessions -> {
            if (sessions.remove(sessionId) != null) {
                totalSessions.decrementAndGet();
            }
        });

        // Remove from compliance sessions
        if (complianceSessions.remove(sessionId) != null) {
            totalSessions.decrementAndGet();
        }

        Log.infof("Session %s removed from all subscriptions", sessionId);
    }

    /**
     * Broadcast asset update to subscribed sessions
     */
    public void broadcastAssetUpdate(String traceId, AssetUpdateMessage message) {
        Map<String, Session> sessions = assetSessions.get(traceId);
        if (sessions == null || sessions.isEmpty()) {
            Log.debugf("No subscribers for asset traceId: %s", traceId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            broadcastToSessions(sessions.values(), json);
            Log.debugf("Broadcast asset update for traceId %s to %d sessions", traceId, sessions.size());
        } catch (Exception e) {
            Log.errorf("Error broadcasting asset update: %s", e.getMessage());
            messagesFailedToSend.incrementAndGet();
        }
    }

    /**
     * Broadcast registry update to subscribed sessions
     */
    public void broadcastRegistryUpdate(String registryType, RegistryUpdateMessage message) {
        Map<String, Session> sessions = registrySessions.get(registryType);
        if (sessions == null || sessions.isEmpty()) {
            Log.debugf("No subscribers for registry type: %s", registryType);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            broadcastToSessions(sessions.values(), json);
            Log.debugf("Broadcast registry update for type %s to %d sessions", registryType, sessions.size());
        } catch (Exception e) {
            Log.errorf("Error broadcasting registry update: %s", e.getMessage());
            messagesFailedToSend.incrementAndGet();
        }
    }

    /**
     * Broadcast compliance alert to all subscribed sessions
     */
    public void broadcastComplianceAlert(ComplianceAlertMessage message) {
        if (complianceSessions.isEmpty()) {
            Log.debugf("No subscribers for compliance alerts");
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            broadcastToSessions(complianceSessions.values(), json);
            Log.debugf("Broadcast compliance alert to %d sessions", complianceSessions.size());
        } catch (Exception e) {
            Log.errorf("Error broadcasting compliance alert: %s", e.getMessage());
            messagesFailedToSend.incrementAndGet();
        }
    }

    /**
     * Broadcast message to collection of sessions
     */
    private void broadcastToSessions(Collection<Session> sessions, String message) {
        List<Session> deadSessions = new ArrayList<>();

        for (Session session : sessions) {
            try {
                if (session.isOpen()) {
                    session.getAsyncRemote().sendText(message);
                    messagesSent.incrementAndGet();
                } else {
                    deadSessions.add(session);
                }
            } catch (Exception e) {
                Log.warnf("Error sending message to session %s: %s", session.getId(), e.getMessage());
                deadSessions.add(session);
                messagesFailedToSend.incrementAndGet();
            }
        }

        // Clean up dead sessions
        deadSessions.forEach(session -> {
            removeSession(session);
            deadSessionsRemoved.incrementAndGet();
        });

        if (!deadSessions.isEmpty()) {
            Log.infof("Removed %d dead sessions", deadSessions.size());
        }
    }

    /**
     * Get statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", totalSessions.get());
        stats.put("assetSubscriptions", assetSessions.values().stream()
                .mapToInt(Map::size).sum());
        stats.put("registrySubscriptions", registrySessions.values().stream()
                .mapToInt(Map::size).sum());
        stats.put("complianceSubscriptions", complianceSessions.size());
        stats.put("messagesSent", messagesSent.get());
        stats.put("messagesFailedToSend", messagesFailedToSend.get());
        stats.put("deadSessionsRemoved", deadSessionsRemoved.get());

        // Breakdown by type
        Map<String, Integer> assetBreakdown = new HashMap<>();
        assetSessions.forEach((key, value) -> assetBreakdown.put(key, value.size()));
        stats.put("assetSubscriptionsByTraceId", assetBreakdown);

        Map<String, Integer> registryBreakdown = new HashMap<>();
        registrySessions.forEach((key, value) -> registryBreakdown.put(key, value.size()));
        stats.put("registrySubscriptionsByType", registryBreakdown);

        return stats;
    }

    /**
     * Get session count for specific asset trace
     */
    public int getAssetSessionCount(String traceId) {
        Map<String, Session> sessions = assetSessions.get(traceId);
        return sessions != null ? sessions.size() : 0;
    }

    /**
     * Get session count for specific registry type
     */
    public int getRegistrySessionCount(String registryType) {
        Map<String, Session> sessions = registrySessions.get(registryType);
        return sessions != null ? sessions.size() : 0;
    }

    /**
     * Get total compliance session count
     */
    public int getComplianceSessionCount() {
        return complianceSessions.size();
    }
}
