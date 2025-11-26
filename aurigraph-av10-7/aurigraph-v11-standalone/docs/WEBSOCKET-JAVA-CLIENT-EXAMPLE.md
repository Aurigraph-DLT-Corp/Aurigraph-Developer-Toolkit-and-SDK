# WebSocket Java Client Example

This document provides examples of using the Aurigraph V11 WebSocket Real-Time Wrapper in Java applications.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Authentication](#authentication)
3. [Channel Subscriptions](#channel-subscriptions)
4. [Advanced Features](#advanced-features)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Basic Usage

### Maven Dependency

```xml
<dependency>
    <groupId>io.aurigraph</groupId>
    <artifactId>aurigraph-v12-standalone</artifactId>
    <version>12.0.0</version>
</dependency>
```

### Simple Connection

```java
import io.aurigraph.v11.websocket.WebSocketRealTimeWrapper;
import java.net.URI;

public class WebSocketExample {
    public static void main(String[] args) throws Exception {
        // Create wrapper
        URI serverUri = new URI("ws://localhost:9003/ws/v11");
        WebSocketRealTimeWrapper wrapper = new WebSocketRealTimeWrapper(serverUri);

        // Connect
        wrapper.connect();

        // Wait for connection
        Thread.sleep(1000);

        // Check status
        System.out.println("Connected: " + wrapper.isConnected());
    }
}
```

## Authentication

### Authenticate with JWT Token

```java
// Obtain JWT token (e.g., from login API)
String jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Connect and authenticate
wrapper.connect();
wrapper.authenticate(jwtToken);

// Wait for authentication
Thread.sleep(500);

// Check authentication status
if (wrapper.isAuthenticated()) {
    System.out.println("Successfully authenticated");
} else {
    System.err.println("Authentication failed");
}
```

### Complete Login Flow

```java
import io.aurigraph.v11.user.LoginRequest;
import io.aurigraph.v11.user.LoginResponse;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.MediaType;

public class AuthenticatedWebSocketClient {
    public static void main(String[] args) throws Exception {
        // Step 1: Login to get JWT token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.email = "user@example.com";
        loginRequest.password = "securePassword123";

        LoginResponse loginResponse = ClientBuilder.newClient()
            .target("http://localhost:9003/api/v11/users/login")
            .request(MediaType.APPLICATION_JSON)
            .post(Entity.json(loginRequest), LoginResponse.class);

        String jwtToken = loginResponse.token;
        System.out.println("Obtained JWT token");

        // Step 2: Connect to WebSocket
        URI serverUri = new URI("ws://localhost:9003/ws/v11");
        WebSocketRealTimeWrapper wrapper = new WebSocketRealTimeWrapper(serverUri);
        wrapper.connect();

        // Step 3: Authenticate WebSocket connection
        wrapper.authenticate(jwtToken);

        // Step 4: Subscribe to channels
        wrapper.subscribe("transactions", message -> {
            System.out.println("Transaction: " + message);
        });

        // Keep alive
        System.out.println("Press Enter to disconnect...");
        System.in.read();

        wrapper.shutdown();
    }
}
```

## Channel Subscriptions

### Subscribe to Transaction Events

```java
wrapper.subscribe("transactions", message -> {
    Map<String, Object> data = (Map<String, Object>) message;
    System.out.println("New transaction:");
    System.out.println("  ID: " + data.get("id"));
    System.out.println("  Amount: " + data.get("amount"));
    System.out.println("  Status: " + data.get("status"));
});
```

### Subscribe with Filter

```java
// Only receive pending transactions
String filter = "status:pending";
wrapper.subscribe("transactions", filter, 5, message -> {
    System.out.println("Pending transaction: " + message);
});
```

### Subscribe to Multiple Channels

```java
// Real-time analytics
wrapper.subscribe("analytics", message -> {
    Map<String, Object> metrics = (Map<String, Object>) message;
    System.out.printf("TPS: %.2f, Validators: %d, Health: %s%n",
        metrics.get("tps"),
        metrics.get("validators"),
        metrics.get("networkHealth"));
});

// Block events
wrapper.subscribe("blocks", message -> {
    Map<String, Object> block = (Map<String, Object>) message;
    System.out.println("New block: " + block.get("height"));
});

// Bridge events (Ethereum)
String chainFilter = "chainId:ethereum";
wrapper.subscribe("bridge", chainFilter, 0, message -> {
    System.out.println("Bridge transfer: " + message);
});
```

### Unsubscribe from Channel

```java
// Unsubscribe when no longer needed
wrapper.unsubscribe("transactions");
System.out.println("Unsubscribed from transactions channel");
```

## Advanced Features

### Automatic Reconnection

The wrapper automatically reconnects on connection loss with exponential backoff:

```java
wrapper.connect();

// Connection will automatically reconnect if lost
// Subscriptions are restored after reconnection
// Queued messages are delivered after reconnection

System.out.println("Wrapper will reconnect automatically");
```

### Message Queuing During Disconnection

```java
// Messages are automatically queued when disconnected
wrapper.sendMessage(Map.of(
    "type", "custom",
    "data", "This will be queued if disconnected"
));

// Messages are delivered when connection is restored
// Queue size limit: 1000 messages
```

### Binary Message Support (Protocol Buffers)

```java
import com.google.protobuf.Message;

// Send Protocol Buffer message
Message protoMessage = TransactionProto.newBuilder()
    .setId("tx123")
    .setAmount(100.0)
    .build();

byte[] protoBytes = protoMessage.toByteArray();
wrapper.sendBinary(protoBytes);
```

### Compression Support

Messages larger than 1KB are automatically compressed:

```java
// Large messages are automatically compressed
Map<String, Object> largeMessage = Map.of(
    "type", "bulk_data",
    "data", List.of(/* large dataset */)
);

// Wrapper automatically compresses if beneficial
wrapper.sendMessage(largeMessage);

// Check compression savings
Map<String, Object> metrics = wrapper.getMetrics();
System.out.println("Compression savings: " +
    metrics.get("compressionSavings") + " bytes");
```

### Connection Metrics

```java
// Get real-time connection metrics
Map<String, Object> metrics = wrapper.getMetrics();

System.out.println("WebSocket Metrics:");
System.out.println("  Connected: " + metrics.get("connected"));
System.out.println("  Authenticated: " + metrics.get("authenticated"));
System.out.println("  Messages Sent: " + metrics.get("messagesSent"));
System.out.println("  Messages Received: " + metrics.get("messagesReceived"));
System.out.println("  Queue Size: " + metrics.get("queueSize"));
System.out.println("  Reconnection Attempts: " + metrics.get("reconnectionAttempts"));
System.out.println("  Compression Savings: " + metrics.get("compressionSavings") + " bytes");
System.out.println("  Active Subscriptions: " + metrics.get("subscriptions"));
```

## Error Handling

### Handle Connection Errors

```java
try {
    wrapper.connect();
    wrapper.authenticate(jwtToken);
} catch (Exception e) {
    System.err.println("Connection error: " + e.getMessage());
    // Wrapper will automatically retry connection
}
```

### Handle Authentication Errors

```java
wrapper.connect();

try {
    wrapper.authenticate(jwtToken);

    // Wait for authentication response
    Thread.sleep(1000);

    if (!wrapper.isAuthenticated()) {
        System.err.println("Authentication failed - check token validity");
        // Get new token and retry
    }
} catch (Exception e) {
    System.err.println("Authentication error: " + e.getMessage());
}
```

### Handle Subscription Errors

```java
// Register error handler for specific channel
wrapper.subscribe("admin", message -> {
    // This may fail if user doesn't have ADMIN role
    System.out.println("Admin message: " + message);
});

// Check subscription status after some time
Thread.sleep(1000);
if (!wrapper.getMetrics().get("subscriptions").equals(1)) {
    System.err.println("Subscription may have failed (RBAC check)");
}
```

## Best Practices

### 1. Connection Lifecycle Management

```java
public class WebSocketManager {
    private WebSocketRealTimeWrapper wrapper;

    public void start(String serverUrl, String jwtToken) throws Exception {
        wrapper = new WebSocketRealTimeWrapper(new URI(serverUrl));
        wrapper.connect();
        wrapper.authenticate(jwtToken);
    }

    public void stop() {
        if (wrapper != null) {
            wrapper.shutdown();
        }
    }
}

// Use try-with-resources pattern
try (WebSocketManager manager = new WebSocketManager()) {
    manager.start("ws://localhost:9003/ws/v11", jwtToken);
    // Use WebSocket connection
} // Automatically cleaned up
```

### 2. Thread-Safe Message Handling

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

ExecutorService executor = Executors.newFixedThreadPool(4);

wrapper.subscribe("transactions", message -> {
    // Process message in separate thread
    executor.submit(() -> {
        try {
            processTransaction(message);
        } catch (Exception e) {
            System.err.println("Error processing transaction: " + e.getMessage());
        }
    });
});
```

### 3. Token Refresh

```java
import java.time.Instant;

public class TokenManager {
    private String currentToken;
    private Instant tokenExpiry;
    private WebSocketRealTimeWrapper wrapper;

    public void refreshTokenIfNeeded() {
        if (Instant.now().isAfter(tokenExpiry.minusMinutes(5))) {
            // Refresh token
            String newToken = obtainNewToken();

            // Reconnect with new token
            wrapper.disconnect();
            wrapper.connect();
            wrapper.authenticate(newToken);

            currentToken = newToken;
            tokenExpiry = Instant.now().plusHours(24);
        }
    }
}
```

### 4. Graceful Shutdown

```java
// Add shutdown hook for graceful cleanup
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    System.out.println("Shutting down WebSocket connection...");
    wrapper.shutdown();
    System.out.println("WebSocket connection closed");
}));
```

### 5. Production Configuration

```java
public class ProductionWebSocketClient {
    public static void main(String[] args) throws Exception {
        // Use environment variables for configuration
        String serverUrl = System.getenv("WEBSOCKET_URL");
        String jwtToken = System.getenv("JWT_TOKEN");

        if (serverUrl == null || jwtToken == null) {
            System.err.println("Missing required environment variables");
            System.exit(1);
        }

        // Production URI (wss:// for secure WebSocket)
        URI serverUri = new URI(serverUrl); // e.g., wss://dlt.aurigraph.io/ws/v11

        WebSocketRealTimeWrapper wrapper = new WebSocketRealTimeWrapper(serverUri);
        wrapper.connect();
        wrapper.authenticate(jwtToken);

        // Subscribe to channels
        wrapper.subscribe("analytics", message -> {
            // Handle analytics data
        });

        // Keep alive
        Thread.currentThread().join();
    }
}
```

## Complete Example: Real-Time Transaction Monitor

```java
import io.aurigraph.v11.websocket.WebSocketRealTimeWrapper;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class TransactionMonitor {
    private final WebSocketRealTimeWrapper wrapper;
    private final AtomicLong transactionCount = new AtomicLong(0);

    public TransactionMonitor(String serverUrl, String jwtToken) throws Exception {
        wrapper = new WebSocketRealTimeWrapper(new URI(serverUrl));
        wrapper.connect();
        wrapper.authenticate(jwtToken);

        // Subscribe to transactions
        wrapper.subscribe("transactions", this::handleTransaction);

        // Subscribe to analytics
        wrapper.subscribe("analytics", this::handleAnalytics);

        System.out.println("Transaction monitor started");
    }

    private void handleTransaction(Object message) {
        Map<String, Object> tx = (Map<String, Object>) message;
        long count = transactionCount.incrementAndGet();

        System.out.printf("[%d] Transaction %s: %.2f %s -> %s%n",
            count,
            tx.get("id"),
            tx.get("amount"),
            tx.get("sender"),
            tx.get("receiver"));
    }

    private void handleAnalytics(Object message) {
        Map<String, Object> metrics = (Map<String, Object>) message;

        System.out.printf("Network Status: TPS=%.2f, Validators=%d, Health=%s%n",
            metrics.get("tps"),
            metrics.get("validators"),
            metrics.get("networkHealth"));
    }

    public void stop() {
        wrapper.shutdown();
        System.out.println("Transaction monitor stopped");
    }

    public static void main(String[] args) throws Exception {
        String serverUrl = "ws://localhost:9003/ws/v11";
        String jwtToken = "your_jwt_token_here";

        TransactionMonitor monitor = new TransactionMonitor(serverUrl, jwtToken);

        // Run for 60 seconds
        Thread.sleep(60000);

        monitor.stop();
    }
}
```

## Troubleshooting

### Connection Issues

```java
// Enable debug logging
System.setProperty("quarkus.log.category.\"io.aurigraph.v11.websocket\".level", "DEBUG");

// Check connection metrics
Map<String, Object> metrics = wrapper.getMetrics();
System.out.println("Connection status: " + metrics);
```

### Authentication Issues

```java
// Verify token validity
if (!wrapper.isAuthenticated()) {
    System.err.println("Authentication failed");
    System.err.println("Check:");
    System.err.println("1. JWT token is valid and not expired");
    System.err.println("2. User has required permissions");
    System.err.println("3. Server is reachable");
}
```

### Subscription Issues

```java
// Verify RBAC permissions
// Some channels require specific roles:
// - "consensus" -> ADMIN role
// - "network" -> VALIDATOR or ADMIN role
// - "debug" -> DEVELOPER or ADMIN role

// Check user role in JWT token
```

## Resources

- [WebSocket Integration Guide](WEBSOCKET-INTEGRATION-GUIDE.md)
- [JavaScript Client Example](WEBSOCKET-JAVASCRIPT-CLIENT-EXAMPLE.md)
- [API Documentation](https://dlt.aurigraph.io/q/swagger-ui)
- [Enterprise Portal](https://dlt.aurigraph.io)
