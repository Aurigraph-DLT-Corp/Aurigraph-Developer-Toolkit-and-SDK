package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.AbstractNode;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * EINode - Enterprise Infrastructure Node for external system integration.
 *
 * Consolidated implementation for EI nodes including:
 * - Exchange connectivity (crypto, stock, commodity exchanges)
 * - Data feed management (market data, price feeds, oracle data)
 * - API gateway functionality
 * - Rate limiting and circuit breakers
 * - Data transformation and normalization
 * - Event streaming and pub/sub
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public class EINode extends AbstractNode {

    private static final Logger LOG = Logger.getLogger(EINode.class);

    // Configuration
    private static final int MAX_CONNECTIONS = 100;
    private static final int MAX_FEEDS = 500;
    private static final long CONNECTION_TIMEOUT_MS = 30_000;
    private static final int MAX_RETRIES = 3;
    private static final int CIRCUIT_BREAKER_THRESHOLD = 5;
    private static final long CIRCUIT_BREAKER_RESET_MS = 60_000;

    // Connection management
    private final Map<String, ExchangeConnection> exchanges = new ConcurrentHashMap<>();
    private final Map<String, DataFeed> dataFeeds = new ConcurrentHashMap<>();
    private final Map<String, APIEndpoint> apiEndpoints = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong messagesReceived = new AtomicLong(0);
    private final AtomicLong messagesSent = new AtomicLong(0);
    private final AtomicLong totalDataBytes = new AtomicLong(0);
    private final AtomicLong failedRequests = new AtomicLong(0);
    private final AtomicLong successfulRequests = new AtomicLong(0);

    // Circuit breaker state
    private final Map<String, CircuitBreakerState> circuitBreakers = new ConcurrentHashMap<>();

    // Event subscribers
    private final Map<String, Set<String>> eventSubscribers = new ConcurrentHashMap<>();

    // Data cache for normalization
    private final Map<String, Object> dataCache = new ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 10_000;

    // Executors
    private ScheduledExecutorService connectionMonitor;
    private ExecutorService dataProcessor;

    public EINode(String nodeId) {
        super(nodeId, io.aurigraph.v11.demo.models.NodeType.BUSINESS); // Use BUSINESS as base type
    }

    @Override
    protected Uni<Void> doStart() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Starting EINode %s", getNodeId());

            // Initialize connection monitor
            connectionMonitor = Executors.newScheduledThreadPool(2, r -> {
                Thread t = new Thread(r, "ei-monitor-" + getNodeId());
                t.setDaemon(true);
                return t;
            });

            // Initialize data processor
            dataProcessor = Executors.newFixedThreadPool(
                Runtime.getRuntime().availableProcessors(),
                r -> {
                    Thread t = new Thread(r, "ei-processor-" + getNodeId());
                    t.setDaemon(true);
                    return t;
                }
            );

            // Start connection health monitoring
            connectionMonitor.scheduleAtFixedRate(
                this::monitorConnections,
                5000,
                10000,
                TimeUnit.MILLISECONDS
            );

            // Start data feed polling
            connectionMonitor.scheduleAtFixedRate(
                this::pollDataFeeds,
                1000,
                1000,
                TimeUnit.MILLISECONDS
            );

            LOG.infof("EINode %s started successfully", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<Void> doStop() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Stopping EINode %s", getNodeId());

            // Close all connections
            exchanges.values().forEach(this::disconnectExchange);
            dataFeeds.values().forEach(feed -> feed.active = false);

            // Shutdown executors
            if (connectionMonitor != null) {
                connectionMonitor.shutdown();
                try {
                    if (!connectionMonitor.awaitTermination(5, TimeUnit.SECONDS)) {
                        connectionMonitor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    connectionMonitor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            if (dataProcessor != null) {
                dataProcessor.shutdown();
                try {
                    if (!dataProcessor.awaitTermination(5, TimeUnit.SECONDS)) {
                        dataProcessor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    dataProcessor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            LOG.infof("EINode %s stopped", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<NodeHealth> doHealthCheck() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> components = new HashMap<>();

            // Check exchange connections
            long activeExchanges = exchanges.values().stream().filter(e -> e.connected).count();
            components.put("exchanges", Map.of(
                "total", exchanges.size(),
                "active", activeExchanges,
                "healthy", activeExchanges == exchanges.size()
            ));

            // Check data feeds
            long activeFeeds = dataFeeds.values().stream().filter(f -> f.active).count();
            components.put("dataFeeds", Map.of(
                "total", dataFeeds.size(),
                "active", activeFeeds,
                "healthy", activeFeeds > 0 || dataFeeds.isEmpty()
            ));

            // Check circuit breakers
            long openCircuits = circuitBreakers.values().stream()
                .filter(cb -> cb.state == CircuitState.OPEN)
                .count();
            components.put("circuitBreakers", Map.of(
                "total", circuitBreakers.size(),
                "open", openCircuits,
                "healthy", openCircuits == 0
            ));

            // Check API endpoints
            long healthyEndpoints = apiEndpoints.values().stream()
                .filter(ep -> ep.healthy)
                .count();
            components.put("apiEndpoints", Map.of(
                "total", apiEndpoints.size(),
                "healthy", healthyEndpoints
            ));

            // Check error rate
            double errorRate = getErrorRate();
            components.put("errorRate", errorRate);
            components.put("errorRateHealthy", errorRate < 0.05);

            boolean healthy = activeExchanges == exchanges.size()
                && openCircuits == 0
                && errorRate < 0.05;

            return new NodeHealth(
                healthy ? io.aurigraph.v11.demo.models.NodeStatus.RUNNING : io.aurigraph.v11.demo.models.NodeStatus.ERROR,
                healthy,
                getUptimeSeconds(),
                components
            );
        });
    }

    @Override
    protected Uni<NodeMetrics> doGetMetrics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> customMetrics = new HashMap<>();
            customMetrics.put("messagesReceived", messagesReceived.get());
            customMetrics.put("messagesSent", messagesSent.get());
            customMetrics.put("totalDataBytes", totalDataBytes.get());
            customMetrics.put("successfulRequests", successfulRequests.get());
            customMetrics.put("failedRequests", failedRequests.get());
            customMetrics.put("exchangeConnections", exchanges.size());
            customMetrics.put("activeDataFeeds", dataFeeds.values().stream().filter(f -> f.active).count());
            customMetrics.put("apiEndpoints", apiEndpoints.size());
            customMetrics.put("openCircuitBreakers", circuitBreakers.values().stream()
                .filter(cb -> cb.state == CircuitState.OPEN).count());
            customMetrics.put("cacheSize", dataCache.size());
            customMetrics.put("eventSubscribers", eventSubscribers.values().stream()
                .mapToInt(Set::size).sum());
            customMetrics.put("errorRate", getErrorRate());

            // Calculate throughput
            long uptime = getUptimeSeconds();
            double messagesPerSecond = uptime > 0 ? (double) messagesReceived.get() / uptime : 0;

            return new NodeMetrics(messagesPerSecond, 0, 0, 0, customMetrics);
        });
    }

    // ============================================
    // EXCHANGE MANAGEMENT
    // ============================================

    /**
     * Connect to an exchange
     */
    public boolean connectExchange(String exchangeId, String url, Map<String, String> credentials) {
        if (exchanges.size() >= MAX_CONNECTIONS) {
            LOG.warnf("Maximum exchange connections reached: %d", MAX_CONNECTIONS);
            return false;
        }

        ExchangeConnection connection = new ExchangeConnection(exchangeId, url, credentials);
        exchanges.put(exchangeId, connection);

        // Simulate connection
        connection.connected = true;
        connection.connectedAt = Instant.now();
        initCircuitBreaker(exchangeId);

        LOG.infof("Connected to exchange: %s at %s", exchangeId, url);
        return true;
    }

    /**
     * Disconnect from an exchange
     */
    public void disconnectExchange(ExchangeConnection connection) {
        if (connection != null) {
            connection.connected = false;
            connection.disconnectedAt = Instant.now();
            LOG.infof("Disconnected from exchange: %s", connection.exchangeId);
        }
    }

    /**
     * Get exchange connection status
     */
    public ExchangeConnection getExchange(String exchangeId) {
        return exchanges.get(exchangeId);
    }

    /**
     * List all exchanges
     */
    public Map<String, ExchangeConnection> getAllExchanges() {
        return Map.copyOf(exchanges);
    }

    /**
     * Send request to exchange
     */
    public CompletableFuture<ExchangeResponse> sendExchangeRequest(String exchangeId, String method, Map<String, Object> params) {
        return CompletableFuture.supplyAsync(() -> {
            ExchangeConnection exchange = exchanges.get(exchangeId);
            if (exchange == null || !exchange.connected) {
                failedRequests.incrementAndGet();
                throw new IllegalStateException("Exchange not connected: " + exchangeId);
            }

            // Check circuit breaker
            if (!checkCircuitBreaker(exchangeId)) {
                failedRequests.incrementAndGet();
                throw new IllegalStateException("Circuit breaker open for: " + exchangeId);
            }

            try {
                // Simulate exchange request
                messagesSent.incrementAndGet();
                Thread.sleep(10); // Simulate network latency

                // Simulate response
                messagesReceived.incrementAndGet();
                successfulRequests.incrementAndGet();
                resetCircuitBreaker(exchangeId);

                return new ExchangeResponse(exchangeId, method, true, Map.of("result", "success"));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                failedRequests.incrementAndGet();
                recordCircuitBreakerFailure(exchangeId);
                throw new RuntimeException("Request interrupted", e);
            }
        }, dataProcessor);
    }

    // ============================================
    // DATA FEED MANAGEMENT
    // ============================================

    /**
     * Subscribe to a data feed
     */
    public boolean subscribeToFeed(String feedId, String source, String dataType, long intervalMs) {
        if (dataFeeds.size() >= MAX_FEEDS) {
            LOG.warnf("Maximum data feeds reached: %d", MAX_FEEDS);
            return false;
        }

        DataFeed feed = new DataFeed(feedId, source, dataType, intervalMs);
        feed.active = true;
        dataFeeds.put(feedId, feed);

        LOG.infof("Subscribed to data feed: %s from %s", feedId, source);
        return true;
    }

    /**
     * Unsubscribe from a data feed
     */
    public void unsubscribeFromFeed(String feedId) {
        DataFeed feed = dataFeeds.remove(feedId);
        if (feed != null) {
            feed.active = false;
            LOG.infof("Unsubscribed from data feed: %s", feedId);
        }
    }

    /**
     * Get latest data from feed
     */
    public Object getFeedData(String feedId) {
        DataFeed feed = dataFeeds.get(feedId);
        if (feed == null) {
            return null;
        }
        return feed.lastData;
    }

    /**
     * Poll all active data feeds
     */
    private void pollDataFeeds() {
        for (DataFeed feed : dataFeeds.values()) {
            if (feed.active && System.currentTimeMillis() - feed.lastPolled >= feed.intervalMs) {
                dataProcessor.submit(() -> pollFeed(feed));
            }
        }
    }

    /**
     * Poll a single feed
     */
    private void pollFeed(DataFeed feed) {
        try {
            // Simulate data fetch
            feed.lastPolled = System.currentTimeMillis();
            feed.lastData = Map.of(
                "timestamp", Instant.now().toString(),
                "source", feed.source,
                "dataType", feed.dataType,
                "value", Math.random() * 100
            );
            feed.messageCount++;
            messagesReceived.incrementAndGet();

            // Publish to subscribers
            publishEvent(feed.feedId, feed.lastData);

        } catch (Exception e) {
            LOG.warnf(e, "Error polling feed: %s", feed.feedId);
            feed.errorCount++;
        }
    }

    // ============================================
    // API GATEWAY
    // ============================================

    /**
     * Register an API endpoint
     */
    public void registerAPIEndpoint(String endpointId, String url, String method, Map<String, String> headers) {
        APIEndpoint endpoint = new APIEndpoint(endpointId, url, method, headers);
        apiEndpoints.put(endpointId, endpoint);
        initCircuitBreaker(endpointId);
        LOG.infof("Registered API endpoint: %s -> %s", endpointId, url);
    }

    /**
     * Call an API endpoint
     */
    public CompletableFuture<APIResponse> callAPI(String endpointId, Map<String, Object> params) {
        return CompletableFuture.supplyAsync(() -> {
            APIEndpoint endpoint = apiEndpoints.get(endpointId);
            if (endpoint == null) {
                failedRequests.incrementAndGet();
                throw new IllegalArgumentException("Endpoint not found: " + endpointId);
            }

            // Check circuit breaker
            if (!checkCircuitBreaker(endpointId)) {
                failedRequests.incrementAndGet();
                throw new IllegalStateException("Circuit breaker open for: " + endpointId);
            }

            try {
                // Simulate API call with retries
                for (int retry = 0; retry < MAX_RETRIES; retry++) {
                    try {
                        messagesSent.incrementAndGet();
                        Thread.sleep(5); // Simulate network latency

                        // Simulate response
                        messagesReceived.incrementAndGet();
                        successfulRequests.incrementAndGet();
                        endpoint.successCount++;
                        endpoint.lastCalled = Instant.now();
                        resetCircuitBreaker(endpointId);

                        return new APIResponse(endpointId, 200, Map.of("status", "success"));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
                throw new RuntimeException("Max retries exceeded");
            } catch (Exception e) {
                endpoint.errorCount++;
                failedRequests.incrementAndGet();
                recordCircuitBreakerFailure(endpointId);
                throw new RuntimeException("API call failed: " + endpointId, e);
            }
        }, dataProcessor);
    }

    // ============================================
    // CIRCUIT BREAKER
    // ============================================

    /**
     * Initialize circuit breaker for an endpoint
     */
    private void initCircuitBreaker(String endpointId) {
        circuitBreakers.put(endpointId, new CircuitBreakerState());
    }

    /**
     * Check if circuit breaker allows request
     */
    private boolean checkCircuitBreaker(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) {
            return true;
        }

        if (cb.state == CircuitState.OPEN) {
            // Check if reset timeout has passed
            if (System.currentTimeMillis() - cb.lastStateChange > CIRCUIT_BREAKER_RESET_MS) {
                cb.state = CircuitState.HALF_OPEN;
                cb.lastStateChange = System.currentTimeMillis();
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * Record circuit breaker failure
     */
    private void recordCircuitBreakerFailure(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) return;

        cb.failureCount++;
        if (cb.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
            cb.state = CircuitState.OPEN;
            cb.lastStateChange = System.currentTimeMillis();
            LOG.warnf("Circuit breaker OPEN for: %s", endpointId);
        }
    }

    /**
     * Reset circuit breaker on success
     */
    private void resetCircuitBreaker(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) return;

        if (cb.state == CircuitState.HALF_OPEN) {
            cb.state = CircuitState.CLOSED;
            cb.lastStateChange = System.currentTimeMillis();
            LOG.infof("Circuit breaker CLOSED for: %s", endpointId);
        }
        cb.failureCount = 0;
    }

    // ============================================
    // EVENT PUB/SUB
    // ============================================

    /**
     * Subscribe to events
     */
    public void subscribeToEvent(String eventType, String subscriberId) {
        eventSubscribers.computeIfAbsent(eventType, k -> ConcurrentHashMap.newKeySet())
            .add(subscriberId);
        LOG.debugf("Subscriber %s subscribed to event: %s", subscriberId, eventType);
    }

    /**
     * Unsubscribe from events
     */
    public void unsubscribeFromEvent(String eventType, String subscriberId) {
        Set<String> subscribers = eventSubscribers.get(eventType);
        if (subscribers != null) {
            subscribers.remove(subscriberId);
        }
    }

    /**
     * Publish an event to subscribers
     */
    public void publishEvent(String eventType, Object data) {
        Set<String> subscribers = eventSubscribers.get(eventType);
        if (subscribers != null && !subscribers.isEmpty()) {
            LOG.debugf("Publishing event %s to %d subscribers", eventType, subscribers.size());
            // In production, would send to actual subscribers
        }
    }

    // ============================================
    // DATA TRANSFORMATION
    // ============================================

    /**
     * Transform and normalize data
     */
    public Map<String, Object> normalizeData(String sourceType, Map<String, Object> rawData) {
        Map<String, Object> normalized = new HashMap<>();

        // Add standard fields
        normalized.put("_source", sourceType);
        normalized.put("_timestamp", Instant.now().toString());
        normalized.put("_nodeId", getNodeId());

        // Copy and normalize data
        rawData.forEach((key, value) -> {
            String normalizedKey = key.toLowerCase().replace(" ", "_");
            normalized.put(normalizedKey, value);
        });

        // Cache the result
        if (dataCache.size() < MAX_CACHE_SIZE) {
            String cacheKey = sourceType + ":" + System.currentTimeMillis();
            dataCache.put(cacheKey, normalized);
        }

        return normalized;
    }

    /**
     * Get cached data
     */
    public Object getCachedData(String key) {
        return dataCache.get(key);
    }

    // ============================================
    // MONITORING
    // ============================================

    /**
     * Monitor all connections
     */
    private void monitorConnections() {
        // Check exchange connections
        for (ExchangeConnection exchange : exchanges.values()) {
            if (exchange.connected) {
                // Simulate health check
                exchange.lastHealthCheck = Instant.now();
            }
        }

        // Check API endpoints
        for (APIEndpoint endpoint : apiEndpoints.values()) {
            endpoint.healthy = !circuitBreakers.containsKey(endpoint.endpointId) ||
                circuitBreakers.get(endpoint.endpointId).state != CircuitState.OPEN;
        }

        LOG.debugf("EINode %s - Exchanges: %d, Feeds: %d, Endpoints: %d",
            getNodeId(), exchanges.size(), dataFeeds.size(), apiEndpoints.size());
    }

    /**
     * Get error rate
     */
    private double getErrorRate() {
        long total = successfulRequests.get() + failedRequests.get();
        return total > 0 ? (double) failedRequests.get() / total : 0;
    }

    // ============================================
    // PUBLIC GETTERS FOR METRICS
    // ============================================

    public long getMessagesReceivedCount() {
        return messagesReceived.get();
    }

    public long getMessagesSentCount() {
        return messagesSent.get();
    }

    public long getTotalDataBytesCount() {
        return totalDataBytes.get();
    }

    public int getExchangeConnectionCount() {
        return exchanges.size();
    }

    public long getActiveDataFeedCount() {
        return dataFeeds.values().stream().filter(f -> f.active).count();
    }

    public long getOpenCircuitBreakerCount() {
        return circuitBreakers.values().stream()
            .filter(cb -> cb.state == CircuitState.OPEN).count();
    }

    public double getCurrentThroughput() {
        long uptime = getUptimeSeconds();
        return uptime > 0 ? (double) messagesReceived.get() / uptime : 0;
    }

    // ============================================
    // INNER CLASSES
    // ============================================

    public static class ExchangeConnection {
        public final String exchangeId;
        public final String url;
        public final Map<String, String> credentials;
        public volatile boolean connected = false;
        public Instant connectedAt;
        public Instant disconnectedAt;
        public Instant lastHealthCheck;

        ExchangeConnection(String exchangeId, String url, Map<String, String> credentials) {
            this.exchangeId = exchangeId;
            this.url = url;
            this.credentials = credentials != null ? new HashMap<>(credentials) : new HashMap<>();
        }
    }

    public static class ExchangeResponse {
        public final String exchangeId;
        public final String method;
        public final boolean success;
        public final Map<String, Object> data;

        ExchangeResponse(String exchangeId, String method, boolean success, Map<String, Object> data) {
            this.exchangeId = exchangeId;
            this.method = method;
            this.success = success;
            this.data = data;
        }
    }

    public static class DataFeed {
        public final String feedId;
        public final String source;
        public final String dataType;
        public final long intervalMs;
        public volatile boolean active = false;
        public volatile long lastPolled = 0;
        public volatile Object lastData;
        public long messageCount = 0;
        public long errorCount = 0;

        DataFeed(String feedId, String source, String dataType, long intervalMs) {
            this.feedId = feedId;
            this.source = source;
            this.dataType = dataType;
            this.intervalMs = intervalMs;
        }
    }

    public static class APIEndpoint {
        public final String endpointId;
        public final String url;
        public final String method;
        public final Map<String, String> headers;
        public volatile boolean healthy = true;
        public Instant lastCalled;
        public long successCount = 0;
        public long errorCount = 0;

        APIEndpoint(String endpointId, String url, String method, Map<String, String> headers) {
            this.endpointId = endpointId;
            this.url = url;
            this.method = method;
            this.headers = headers != null ? new HashMap<>(headers) : new HashMap<>();
        }
    }

    public static class APIResponse {
        public final String endpointId;
        public final int statusCode;
        public final Map<String, Object> body;

        APIResponse(String endpointId, int statusCode, Map<String, Object> body) {
            this.endpointId = endpointId;
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    private enum CircuitState {
        CLOSED, OPEN, HALF_OPEN
    }

    private static class CircuitBreakerState {
        CircuitState state = CircuitState.CLOSED;
        int failureCount = 0;
        long lastStateChange = System.currentTimeMillis();
    }
}
