package io.aurigraph.v11.websocket.endpoints;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.websocket.WebSocketMessageService;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;

import java.util.HashMap;
import java.util.Map;

/**
 * Compliance WebSocket Endpoint
 *
 * Real-time compliance alerts and notifications.
 * Clients connect to /ws/compliance/alerts to receive compliance events
 * such as certification expiry warnings, renewals, and critical alerts.
 *
 * Supported Commands:
 * - PING: Health check
 * - SUBSCRIBE: Subscribe to alerts (already subscribed on connect)
 * - UNSUBSCRIBE: Unsubscribe from alerts
 * - GET_STATUS: Get current subscription status
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@ServerEndpoint("/ws/compliance/alerts")
@ApplicationScoped
public class ComplianceWebSocket {

    @Inject
    WebSocketMessageService messageService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @OnOpen
    public void onOpen(Session session) {
        Log.infof("WebSocket opened for compliance alerts, session: %s", session.getId());

        // Auto-subscribe on connection
        messageService.subscribeToComplianceAlerts(session);

        // Send welcome message
        sendMessage(session, createWelcomeMessage());
    }

    @OnClose
    public void onClose(Session session) {
        Log.infof("WebSocket closed for compliance alerts, session: %s", session.getId());
        messageService.removeSession(session);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        Log.errorf("WebSocket error for compliance alerts, session: %s - %s",
                session.getId(), throwable.getMessage());
        messageService.removeSession(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
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
                    messageService.subscribeToComplianceAlerts(session);
                    sendAck(session, "Subscribed to compliance alerts");
                    break;

                case "UNSUBSCRIBE":
                    messageService.unsubscribeFromComplianceAlerts(session);
                    sendAck(session, "Unsubscribed from compliance alerts");
                    break;

                case "GET_STATUS":
                    sendStatus(session);
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

    private Map<String, Object> createWelcomeMessage() {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "welcome");
        message.put("message", "Connected to compliance alerts");
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

    private void sendStatus(Session session) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "status");
        response.put("subscribed", true);
        response.put("sessionId", session.getId());
        response.put("subscriberCount", messageService.getComplianceSessionCount());
        response.put("timestamp", java.time.Instant.now().toString());
        sendMessage(session, response);
    }
}
