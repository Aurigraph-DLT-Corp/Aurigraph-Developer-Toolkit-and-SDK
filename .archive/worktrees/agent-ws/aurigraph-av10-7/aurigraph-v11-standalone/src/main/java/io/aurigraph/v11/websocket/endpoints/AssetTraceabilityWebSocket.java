package io.aurigraph.v11.websocket.endpoints;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.websocket.WebSocketMessageService;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.util.HashMap;
import java.util.Map;

/**
 * Asset Traceability WebSocket Endpoint
 *
 * Real-time updates for asset traceability events.
 * Clients connect to /ws/assets/traceability/{traceId} to receive updates
 * for specific asset traces.
 *
 * Supported Commands:
 * - PING: Health check
 * - SUBSCRIBE: Subscribe to updates (already subscribed on connect)
 * - UNSUBSCRIBE: Unsubscribe from updates
 * - GET_STATUS: Get current subscription status
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@ServerEndpoint("/ws/assets/traceability/{traceId}")
@ApplicationScoped
public class AssetTraceabilityWebSocket {

    @Inject
    WebSocketMessageService messageService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @OnOpen
    public void onOpen(Session session, @PathParam("traceId") String traceId) {
        Log.infof("WebSocket opened for asset traceId: %s, session: %s", traceId, session.getId());

        // Auto-subscribe on connection
        messageService.subscribeToAssetUpdates(traceId, session);

        // Send welcome message
        sendMessage(session, createWelcomeMessage(traceId));
    }

    @OnClose
    public void onClose(Session session, @PathParam("traceId") String traceId) {
        Log.infof("WebSocket closed for asset traceId: %s, session: %s", traceId, session.getId());
        messageService.removeSession(session);
    }

    @OnError
    public void onError(Session session, @PathParam("traceId") String traceId, Throwable throwable) {
        Log.errorf("WebSocket error for asset traceId: %s, session: %s - %s",
                traceId, session.getId(), throwable.getMessage());
        messageService.removeSession(session);
    }

    @OnMessage
    public void onMessage(String message, Session session, @PathParam("traceId") String traceId) {
        Log.debugf("Received message from session %s: %s", session.getId(), message);

        try {
            Map<String, Object> command = objectMapper.readValue(message, Map.class);
            String action = (String) command.get("command");

            if (action == null) {
                sendError(session, "Missing 'command' field");
                return;
            }

            switch (action.toUpperCase()) {
                case "PING":
                    sendPong(session);
                    break;

                case "SUBSCRIBE":
                    messageService.subscribeToAssetUpdates(traceId, session);
                    sendAck(session, "Subscribed to asset updates for " + traceId);
                    break;

                case "UNSUBSCRIBE":
                    messageService.unsubscribeFromAssetUpdates(traceId, session);
                    sendAck(session, "Unsubscribed from asset updates for " + traceId);
                    break;

                case "GET_STATUS":
                    sendStatus(session, traceId);
                    break;

                default:
                    sendError(session, "Unknown command: " + action);
            }
        } catch (Exception e) {
            Log.errorf("Error processing message: %s", e.getMessage());
            sendError(session, "Invalid message format");
        }
    }

    private void sendMessage(Session session, Map<String, Object> message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            session.getAsyncRemote().sendText(json);
        } catch (Exception e) {
            Log.errorf("Error sending message: %s", e.getMessage());
        }
    }

    private Map<String, Object> createWelcomeMessage(String traceId) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "welcome");
        message.put("traceId", traceId);
        message.put("message", "Connected to asset traceability updates");
        message.put("timestamp", java.time.Instant.now().toString());
        message.put("commands", new String[]{"PING", "SUBSCRIBE", "UNSUBSCRIBE", "GET_STATUS"});
        return message;
    }

    private void sendPong(Session session) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "pong");
        response.put("timestamp", java.time.Instant.now().toString());
        sendMessage(session, response);
    }

    private void sendAck(Session session, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "ack");
        response.put("message", message);
        response.put("timestamp", java.time.Instant.now().toString());
        sendMessage(session, response);
    }

    private void sendError(Session session, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "error");
        response.put("error", error);
        response.put("timestamp", java.time.Instant.now().toString());
        sendMessage(session, response);
    }

    private void sendStatus(Session session, String traceId) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "status");
        response.put("traceId", traceId);
        response.put("subscribed", true);
        response.put("sessionId", session.getId());
        response.put("subscriberCount", messageService.getAssetSessionCount(traceId));
        response.put("timestamp", java.time.Instant.now().toString());
        sendMessage(session, response);
    }
}
