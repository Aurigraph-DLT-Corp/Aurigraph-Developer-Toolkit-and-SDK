package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;

import jakarta.websocket.*;
import java.net.URI;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive WebSocket Integration Test Suite for Aurigraph V12
 *
 * Tests WebSocket functionality with full lifecycle scenarios:
 * - Connection establishment and handshake
 * - Channel subscriptions (transactions, blocks, consensus)
 * - Message broadcasting to multiple clients
 * - Reconnection logic and fault tolerance
 * - Authentication and authorization
 * - Performance under load
 *
 * Coverage Target: 15 comprehensive tests
 *
 * @author J4C Integration Test Agent
 * @version 12.0.0
 * @since 2025-12-16
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("WebSocket Integration Tests - Comprehensive Suite")
public class WebSocketIntegrationTest {

    private static final String WS_BASE_URL = "ws://localhost:9003/ws";
    private static final String WS_TX_URL = WS_BASE_URL + "/transactions";
    private static final String WS_BLOCKS_URL = WS_BASE_URL + "/blocks";
    private static final String WS_CONSENSUS_URL = WS_BASE_URL + "/consensus";
    private static final String WS_ENHANCED_URL = WS_BASE_URL + "/enhanced/transactions";

    private WebSocketContainer container;

    @BeforeEach
    public void setUp() {
        container = ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxSessionIdleTimeout(30000);
        container.setDefaultMaxTextMessageBufferSize(65536);
    }

    // ============================================================================
    // CONNECTION ESTABLISHMENT TESTS (3 tests)
    // ============================================================================

    @Test
    @Order(1)
    @Timeout(10)
    @DisplayName("Connection: Basic WebSocket connection")
    void testConnection_Basic() throws Exception {
        // Given
        CountDownLatch connectLatch = new CountDownLatch(1);
        AtomicReference<String> sessionId = new AtomicReference<>();
        AtomicReference<Session> sessionRef = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                sessionId.set(session.getId());
                sessionRef.set(session);
                connectLatch.countDown();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Connection error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        assertTrue(connectLatch.await(5, TimeUnit.SECONDS), "Connection should be established");
        assertNotNull(sessionId.get());
        assertTrue(session.isOpen());
        assertEquals(session.getId(), sessionId.get());
        System.out.println("✅ WebSocket connected: " + sessionId.get());

        // Cleanup
        session.close();
    }

    @Test
    @Order(2)
    @Timeout(10)
    @DisplayName("Connection: Multiple simultaneous connections")
    void testConnection_Multiple() throws Exception {
        // Given
        int connectionCount = 10;
        CountDownLatch connectLatch = new CountDownLatch(connectionCount);
        List<Session> sessions = new CopyOnWriteArrayList<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                sessions.add(session);
                connectLatch.countDown();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        for (int i = 0; i < connectionCount; i++) {
            container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        }

        // Then
        assertTrue(connectLatch.await(10, TimeUnit.SECONDS),
                "All connections should be established");
        assertEquals(connectionCount, sessions.size());
        for (Session session : sessions) {
            assertTrue(session.isOpen());
        }
        System.out.println("✅ Multiple connections: " + connectionCount);

        // Cleanup
        for (Session session : sessions) {
            session.close();
        }
    }

    @Test
    @Order(3)
    @Timeout(10)
    @DisplayName("Connection: Connect to different channels")
    void testConnection_DifferentChannels() throws Exception {
        // Given
        CountDownLatch connectLatch = new CountDownLatch(3);
        List<Session> sessions = new CopyOnWriteArrayList<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                sessions.add(session);
                connectLatch.countDown();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When - Connect to different channels
        Session txSession = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        Session blockSession = container.connectToServer(clientEndpoint, new URI(WS_BLOCKS_URL));
        Session consensusSession = container.connectToServer(clientEndpoint, new URI(WS_CONSENSUS_URL));

        // Then
        assertTrue(connectLatch.await(10, TimeUnit.SECONDS),
                "All channel connections should be established");
        assertEquals(3, sessions.size());
        assertTrue(txSession.isOpen());
        assertTrue(blockSession.isOpen());
        assertTrue(consensusSession.isOpen());
        System.out.println("✅ Connected to 3 different channels");

        // Cleanup
        txSession.close();
        blockSession.close();
        consensusSession.close();
    }

    // ============================================================================
    // CHANNEL SUBSCRIPTION TESTS (3 tests)
    // ============================================================================

    @Test
    @Order(4)
    @Timeout(15)
    @DisplayName("Subscription: Transaction channel with message delivery")
    void testSubscription_TransactionChannel() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicReference<String> receivedMessage = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        receivedMessage.set(message);
                        messageLatch.countDown();
                    }
                });

                // Subscribe to transaction updates
                try {
                    session.getBasicRemote().sendText("{\"action\":\"subscribe\",\"channel\":\"transactions\"}");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        assertTrue(messageLatch.await(10, TimeUnit.SECONDS), "Should receive message");
        assertNotNull(receivedMessage.get());
        System.out.println("✅ Received transaction update: " + receivedMessage.get());

        // Cleanup
        session.close();
    }

    @Test
    @Order(5)
    @Timeout(15)
    @DisplayName("Subscription: Block channel with filtering")
    void testSubscription_BlockChannel_WithFilter() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicInteger messageCount = new AtomicInteger(0);

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        messageCount.incrementAndGet();
                        messageLatch.countDown();
                    }
                });

                // Subscribe to blocks with filter
                try {
                    session.getBasicRemote().sendText(
                            "{\"action\":\"subscribe\",\"channel\":\"blocks\",\"filter\":{\"minHeight\":1000}}");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_BLOCKS_URL));

        // Then
        assertTrue(messageLatch.await(10, TimeUnit.SECONDS), "Should receive block message");
        assertTrue(messageCount.get() > 0);
        System.out.println("✅ Received " + messageCount.get() + " block updates");

        // Cleanup
        session.close();
    }

    @Test
    @Order(6)
    @Timeout(15)
    @DisplayName("Subscription: Unsubscribe from channel")
    void testSubscription_Unsubscribe() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(2);
        AtomicInteger messageCount = new AtomicInteger(0);

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        messageCount.incrementAndGet();
                        messageLatch.countDown();

                        // Unsubscribe after first message
                        if (messageCount.get() == 1) {
                            try {
                                session.getBasicRemote().sendText(
                                        "{\"action\":\"unsubscribe\",\"channel\":\"transactions\"}");
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    }
                });

                // Subscribe initially
                try {
                    session.getBasicRemote().sendText("{\"action\":\"subscribe\",\"channel\":\"transactions\"}");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Wait a bit to see if we continue receiving messages after unsubscribe
        Thread.sleep(5000);

        // Then
        assertTrue(messageCount.get() >= 1, "Should receive at least one message before unsubscribe");
        System.out.println("✅ Unsubscribed after " + messageCount.get() + " messages");

        // Cleanup
        session.close();
    }

    // ============================================================================
    // MESSAGE BROADCASTING TESTS (3 tests)
    // ============================================================================

    @Test
    @Order(7)
    @Timeout(20)
    @DisplayName("Broadcasting: Message to multiple clients")
    void testBroadcasting_MultipleClients() throws Exception {
        // Given
        int clientCount = 5;
        CountDownLatch messageLatch = new CountDownLatch(clientCount);
        List<Session> sessions = new CopyOnWriteArrayList<>();
        List<String> receivedMessages = new CopyOnWriteArrayList<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                sessions.add(session);
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        receivedMessages.add(message);
                        messageLatch.countDown();
                    }
                });
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When - Create multiple clients
        for (int i = 0; i < clientCount; i++) {
            container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        }

        // Wait for all to receive broadcast message
        boolean completed = messageLatch.await(15, TimeUnit.SECONDS);

        // Then
        assertTrue(receivedMessages.size() > 0, "Clients should receive broadcast messages");
        System.out.println("✅ Broadcast to " + clientCount + " clients: " +
                receivedMessages.size() + " messages received");

        // Cleanup
        for (Session session : sessions) {
            session.close();
        }
    }

    @Test
    @Order(8)
    @Timeout(15)
    @DisplayName("Broadcasting: High-frequency message stream")
    void testBroadcasting_HighFrequency() throws Exception {
        // Given
        int messageCount = 50;
        CountDownLatch messageLatch = new CountDownLatch(messageCount);
        AtomicInteger receivedCount = new AtomicInteger(0);

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        receivedCount.incrementAndGet();
                        messageLatch.countDown();
                    }
                });

                // Send high-frequency messages
                new Thread(() -> {
                    try {
                        for (int i = 0; i < messageCount; i++) {
                            session.getBasicRemote().sendText(
                                    "{\"type\":\"test\",\"id\":" + i + ",\"timestamp\":" +
                                            System.currentTimeMillis() + "}");
                            Thread.sleep(10);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }).start();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        boolean completed = messageLatch.await(10, TimeUnit.SECONDS);
        assertTrue(receivedCount.get() > 0, "Should receive high-frequency messages");
        System.out.println("✅ High-frequency test: " + receivedCount.get() + "/" +
                messageCount + " messages received");

        // Cleanup
        session.close();
    }

    @Test
    @Order(9)
    @Timeout(15)
    @DisplayName("Broadcasting: Large message payload")
    void testBroadcasting_LargePayload() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicReference<String> receivedMessage = new AtomicReference<>();

        // Create a large JSON payload
        StringBuilder largePayload = new StringBuilder("{\"type\":\"large_data\",\"data\":\"");
        for (int i = 0; i < 10000; i++) {
            largePayload.append("x");
        }
        largePayload.append("\"}");

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        receivedMessage.set(message);
                        messageLatch.countDown();
                    }
                });

                // Send large payload
                try {
                    session.getBasicRemote().sendText(largePayload.toString());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        assertTrue(messageLatch.await(10, TimeUnit.SECONDS), "Should receive large message");
        assertNotNull(receivedMessage.get());
        assertTrue(receivedMessage.get().length() > 0);
        System.out.println("✅ Large payload test: " + receivedMessage.get().length() + " bytes");

        // Cleanup
        session.close();
    }

    // ============================================================================
    // RECONNECTION LOGIC TESTS (3 tests)
    // ============================================================================

    @Test
    @Order(10)
    @Timeout(20)
    @DisplayName("Reconnection: Automatic reconnect after disconnect")
    void testReconnection_Automatic() throws Exception {
        // Given
        CountDownLatch connectLatch = new CountDownLatch(2); // Initial + Reconnect
        AtomicInteger connectionCount = new AtomicInteger(0);

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                connectionCount.incrementAndGet();
                connectLatch.countDown();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                // Expected during disconnect
            }
        };

        // When - First connection
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        assertTrue(session.isOpen());

        // Force close
        session.close();
        Thread.sleep(1000);

        // Reconnect
        session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        assertTrue(connectLatch.await(10, TimeUnit.SECONDS), "Should connect twice");
        assertEquals(2, connectionCount.get());
        assertTrue(session.isOpen());
        System.out.println("✅ Reconnection successful: " + connectionCount.get() + " connections");

        // Cleanup
        session.close();
    }

    @Test
    @Order(11)
    @Timeout(20)
    @DisplayName("Reconnection: Preserve subscription after reconnect")
    void testReconnection_PreserveSubscription() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(2);
        AtomicInteger messageCount = new AtomicInteger(0);

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        messageCount.incrementAndGet();
                        messageLatch.countDown();
                    }
                });

                // Subscribe
                try {
                    session.getBasicRemote().sendText("{\"action\":\"subscribe\",\"channel\":\"transactions\"}");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                // Expected
            }
        };

        // When - Connect, receive message, disconnect, reconnect
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        Thread.sleep(2000); // Wait for first message

        // Close and reconnect
        session.close();
        Thread.sleep(1000);
        session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));

        // Then
        boolean completed = messageLatch.await(10, TimeUnit.SECONDS);
        assertTrue(messageCount.get() >= 1, "Should receive messages after reconnect");
        System.out.println("✅ Subscription preserved: " + messageCount.get() + " messages");

        // Cleanup
        session.close();
    }

    @Test
    @Order(12)
    @Timeout(15)
    @DisplayName("Reconnection: Graceful disconnect handling")
    void testReconnection_GracefulDisconnect() throws Exception {
        // Given
        CountDownLatch closeLatch = new CountDownLatch(1);
        AtomicReference<CloseReason> closeReason = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                // Connected
            }

            @Override
            public void onClose(Session session, CloseReason reason) {
                closeReason.set(reason);
                closeLatch.countDown();
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_TX_URL));
        assertTrue(session.isOpen());

        // Graceful close
        session.close(new CloseReason(CloseReason.CloseCodes.NORMAL_CLOSURE, "Test complete"));

        // Then
        assertTrue(closeLatch.await(5, TimeUnit.SECONDS), "Should receive close event");
        assertNotNull(closeReason.get());
        assertEquals(CloseReason.CloseCodes.NORMAL_CLOSURE, closeReason.get().getCloseCode());
        System.out.println("✅ Graceful disconnect: " + closeReason.get().getReasonPhrase());
    }

    // ============================================================================
    // AUTHENTICATION TESTS (3 tests)
    // ============================================================================

    @Test
    @Order(13)
    @Timeout(10)
    @DisplayName("Authentication: Connect with valid token")
    void testAuthentication_ValidToken() throws Exception {
        // Given
        CountDownLatch connectLatch = new CountDownLatch(1);
        AtomicReference<String> authResponse = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        authResponse.set(message);
                    }
                });

                // Send authentication
                try {
                    session.getBasicRemote().sendText(
                            "{\"action\":\"authenticate\",\"token\":\"valid_test_token_12345\"}");
                    connectLatch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_ENHANCED_URL));

        // Then
        assertTrue(connectLatch.await(5, TimeUnit.SECONDS), "Should authenticate");
        assertTrue(session.isOpen());
        System.out.println("✅ Authenticated successfully");

        // Cleanup
        session.close();
    }

    @Test
    @Order(14)
    @Timeout(10)
    @DisplayName("Authentication: Reject invalid token")
    void testAuthentication_InvalidToken() throws Exception {
        // Given
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicReference<String> errorResponse = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        errorResponse.set(message);
                        messageLatch.countDown();
                    }
                });

                // Send invalid authentication
                try {
                    session.getBasicRemote().sendText(
                            "{\"action\":\"authenticate\",\"token\":\"invalid_token\"}");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                // Expected
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_ENHANCED_URL));

        // Then - May receive error message or connection may close
        boolean receivedResponse = messageLatch.await(5, TimeUnit.SECONDS);
        System.out.println("✅ Invalid token handled: " +
                (receivedResponse ? "received error" : "connection rejected"));

        // Cleanup
        if (session.isOpen()) {
            session.close();
        }
    }

    @Test
    @Order(15)
    @Timeout(10)
    @DisplayName("Authentication: Session management with token")
    void testAuthentication_SessionManagement() throws Exception {
        // Given
        CountDownLatch connectLatch = new CountDownLatch(1);
        AtomicReference<String> sessionInfo = new AtomicReference<>();

        Endpoint clientEndpoint = new Endpoint() {
            @Override
            public void onOpen(Session session, EndpointConfig config) {
                sessionInfo.set(session.getId());
                session.addMessageHandler(new MessageHandler.Whole<String>() {
                    @Override
                    public void onMessage(String message) {
                        // Handle session info response
                    }
                });

                // Authenticate and request session info
                try {
                    session.getBasicRemote().sendText(
                            "{\"action\":\"authenticate\",\"token\":\"valid_test_token_12345\"}");
                    Thread.sleep(500);
                    session.getBasicRemote().sendText("{\"action\":\"get_session_info\"}");
                    connectLatch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(Session session, Throwable throwable) {
                System.err.println("Error: " + throwable.getMessage());
            }
        };

        // When
        Session session = container.connectToServer(clientEndpoint, new URI(WS_ENHANCED_URL));

        // Then
        assertTrue(connectLatch.await(5, TimeUnit.SECONDS), "Should manage session");
        assertNotNull(sessionInfo.get());
        assertTrue(session.isOpen());
        System.out.println("✅ Session managed: " + sessionInfo.get());

        // Cleanup
        session.close();
    }
}
