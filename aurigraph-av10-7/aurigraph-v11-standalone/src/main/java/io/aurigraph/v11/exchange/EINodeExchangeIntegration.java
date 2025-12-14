package io.aurigraph.v11.exchange;

import io.aurigraph.v11.exchange.CryptoExchangeService.ExchangeTickerData;
import io.aurigraph.v11.exchange.CryptoExchangeService.ExchangeTradeData;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * External Integration (EI) Node Exchange Integration
 *
 * Connects cryptocurrency exchange data streams to External Integration (EI) Nodes for tokenization.
 * Each External Integration (EI) Node can be assigned to one or more exchange/pair combinations,
 * processing real-time market data and converting it into tokenized assets.
 *
 * Features:
 * - Dynamic exchange-to-ei-node mapping
 * - Automatic load balancing across EI nodes
 * - Tokenization of market data
 * - Real-time metrics and monitoring
 * - Batch processing for high throughput
 *
 * @version 1.0.0 (Dec 8, 2025)
 * @author Backend Development Agent (BDA)
 */
@ApplicationScoped
public class EINodeExchangeIntegration {

    private static final Logger LOG = Logger.getLogger(EINodeExchangeIntegration.class);

    @Inject
    CryptoExchangeService exchangeService;

    @ConfigProperty(name = "aurigraph.slimnode.exchange.batch-size", defaultValue = "100")
    int batchSize;

    @ConfigProperty(name = "aurigraph.slimnode.exchange.batch-interval-ms", defaultValue = "1000")
    long batchIntervalMs;

    @ConfigProperty(name = "aurigraph.slimnode.exchange.enabled", defaultValue = "true")
    boolean integrationEnabled;

    // External Integration (EI) Node configurations
    private final Map<String, EINodeConfig> eiNodes = new ConcurrentHashMap<>();

    // Exchange-to-EINode mappings
    private final Map<String, List<String>> exchangeMappings = new ConcurrentHashMap<>();

    // Active subscriptions
    private final Map<String, io.smallrye.mutiny.subscription.Cancellable> activeSubscriptions = new ConcurrentHashMap<>();

    // Processing metrics
    private final AtomicLong totalTickersProcessed = new AtomicLong(0);
    private final AtomicLong totalTradesProcessed = new AtomicLong(0);
    private final AtomicLong totalTokenizationsCompleted = new AtomicLong(0);
    private final AtomicLong totalBatchesProcessed = new AtomicLong(0);

    // Batching buffers (per EI node)
    private final Map<String, List<ExchangeTickerData>> tickerBuffers = new ConcurrentHashMap<>();
    private final Map<String, List<ExchangeTradeData>> tradeBuffers = new ConcurrentHashMap<>();

    private final AtomicBoolean running = new AtomicBoolean(false);

    @PostConstruct
    void init() {
        if (integrationEnabled) {
            running.set(true);
            LOG.info("✅ External Integration (EI) Node Exchange Integration initialized");
            LOG.infof("   Batch size: %d, Batch interval: %dms", batchSize, batchIntervalMs);

            // Initialize default EI nodes
            initializeDefaultEINodes();

            // Start batch processing
            startBatchProcessing();
        } else {
            LOG.info("⚠️ External Integration (EI) Node Exchange Integration is disabled");
        }
    }

    @PreDestroy
    void shutdown() {
        running.set(false);
        LOG.info("Shutting down External Integration (EI) Node Exchange Integration...");

        // Cancel all active subscriptions
        activeSubscriptions.forEach((key, subscription) -> {
            try {
                subscription.cancel();
            } catch (Exception e) {
                LOG.debugf("Error cancelling subscription %s: %s", key, e.getMessage());
            }
        });
        activeSubscriptions.clear();

        // Process remaining batches
        flushAllBuffers();
    }

    private void initializeDefaultEINodes() {
        // Initialize 5 default EI nodes for exchange data processing
        for (int i = 1; i <= 5; i++) {
            String nodeId = "ei-node-exchange-" + i;
            eiNodes.put(nodeId, new EINodeConfig(
                nodeId,
                "Exchange External Integration (EI) Node " + i,
                EINodeStatus.IDLE,
                new ArrayList<>(),
                Instant.now().toString()
            ));
            tickerBuffers.put(nodeId, Collections.synchronizedList(new ArrayList<>()));
            tradeBuffers.put(nodeId, Collections.synchronizedList(new ArrayList<>()));
        }
        LOG.infof("Initialized %d EI nodes for exchange data processing", eiNodes.size());
    }

    // ==========================================================================
    // Exchange-to-EINode Mapping
    // ==========================================================================

    /**
     * Assign an exchange/pair combination to a EI node
     */
    public Uni<Boolean> assignExchangeToEINode(String eiNodeId, String exchange, List<String> pairs) {
        return Uni.createFrom().item(() -> {
            EINodeConfig node = eiNodes.get(eiNodeId);
            if (node == null) {
                LOG.warnf("Slim node not found: %s", eiNodeId);
                return false;
            }

            // Create mapping key
            String mappingKey = exchange + ":" + eiNodeId;

            // Update node configuration
            List<String> assignedPairs = new ArrayList<>(node.assignedPairs());
            for (String pair : pairs) {
                String fullKey = exchange + "/" + pair;
                if (!assignedPairs.contains(fullKey)) {
                    assignedPairs.add(fullKey);
                }
            }

            // Update EI node
            eiNodes.put(eiNodeId, new EINodeConfig(
                node.nodeId(),
                node.name(),
                EINodeStatus.ACTIVE,
                assignedPairs,
                Instant.now().toString()
            ));

            // Update exchange mappings
            exchangeMappings.computeIfAbsent(exchange, k -> new ArrayList<>())
                .add(eiNodeId);

            LOG.infof("Assigned %s pairs from %s to %s", pairs.size(), exchange, eiNodeId);
            return true;
        });
    }

    /**
     * Start streaming exchange data to EI nodes
     */
    public Uni<Boolean> startStreaming(String exchange, List<String> pairs) {
        if (!integrationEnabled) {
            return Uni.createFrom().item(false);
        }

        return Uni.createFrom().item(() -> {
            String subscriptionKey = exchange + ":" + String.join(",", pairs);

            // Cancel existing subscription if any
            io.smallrye.mutiny.subscription.Cancellable existing = activeSubscriptions.remove(subscriptionKey);
            if (existing != null) {
                existing.cancel();
            }

            // Get assigned EI nodes for this exchange
            List<String> assignedNodes = exchangeMappings.getOrDefault(exchange, new ArrayList<>());
            if (assignedNodes.isEmpty()) {
                // Auto-assign to available EI node
                String availableNode = findAvailableEINode();
                if (availableNode != null) {
                    assignExchangeToEINode(availableNode, exchange, pairs).await().indefinitely();
                    assignedNodes = List.of(availableNode);
                } else {
                    LOG.warn("No available EI nodes for exchange streaming");
                    return false;
                }
            }

            // Subscribe to ticker stream
            final List<String> nodes = assignedNodes;
            io.smallrye.mutiny.subscription.Cancellable subscription = exchangeService.streamTickers(exchange, pairs)
                .subscribe().with(
                    ticker -> processTicker(exchange, ticker, nodes),
                    error -> LOG.errorf(error, "Error in %s ticker stream", exchange),
                    () -> LOG.infof("%s ticker stream completed", exchange)
                );

            activeSubscriptions.put(subscriptionKey, subscription);
            LOG.infof("Started streaming %s data with pairs: %s to nodes: %s", exchange, pairs, nodes);

            return true;
        });
    }

    /**
     * Stop streaming from an exchange
     */
    public void stopStreaming(String exchange) {
        activeSubscriptions.entrySet().removeIf(entry -> {
            if (entry.getKey().startsWith(exchange + ":")) {
                entry.getValue().cancel();
                return true;
            }
            return false;
        });
        LOG.infof("Stopped streaming from %s", exchange);
    }

    /**
     * Auto-distribute exchanges across EI nodes
     */
    public Uni<Map<String, List<String>>> autoDistributeExchanges(List<String> exchanges, List<String> pairs) {
        return Uni.createFrom().item(() -> {
            Map<String, List<String>> distribution = new HashMap<>();
            List<String> nodeIds = new ArrayList<>(eiNodes.keySet());

            if (nodeIds.isEmpty()) {
                LOG.warn("No EI nodes available for distribution");
                return distribution;
            }

            // Round-robin distribution of exchange/pair combinations
            int nodeIndex = 0;
            for (String exchange : exchanges) {
                for (String pair : pairs) {
                    String nodeId = nodeIds.get(nodeIndex % nodeIds.size());
                    distribution.computeIfAbsent(nodeId, k -> new ArrayList<>())
                        .add(exchange + "/" + pair);
                    nodeIndex++;
                }
            }

            // Apply distribution
            for (Map.Entry<String, List<String>> entry : distribution.entrySet()) {
                String nodeId = entry.getKey();
                List<String> assignments = entry.getValue();

                // Group by exchange
                Map<String, List<String>> byExchange = new HashMap<>();
                for (String assignment : assignments) {
                    String[] parts = assignment.split("/", 2);
                    if (parts.length == 2) {
                        byExchange.computeIfAbsent(parts[0], k -> new ArrayList<>()).add(parts[1]);
                    }
                }

                // Assign each exchange's pairs
                for (Map.Entry<String, List<String>> exchangeEntry : byExchange.entrySet()) {
                    assignExchangeToEINode(nodeId, exchangeEntry.getKey(), exchangeEntry.getValue())
                        .await().indefinitely();
                }
            }

            LOG.infof("Auto-distributed %d exchanges across %d EI nodes", exchanges.size(), nodeIds.size());
            return distribution;
        });
    }

    // ==========================================================================
    // Data Processing
    // ==========================================================================

    private void processTicker(String exchange, ExchangeTickerData ticker, List<String> nodes) {
        totalTickersProcessed.incrementAndGet();

        // Distribute to assigned EI nodes (round-robin)
        int nodeIndex = (int) (totalTickersProcessed.get() % nodes.size());
        String nodeId = nodes.get(nodeIndex);

        // Add to buffer
        List<ExchangeTickerData> buffer = tickerBuffers.get(nodeId);
        if (buffer != null) {
            buffer.add(ticker);

            // Process if buffer is full
            if (buffer.size() >= batchSize) {
                processBatch(nodeId);
            }
        }
    }

    private void processTrade(String exchange, ExchangeTradeData trade, List<String> nodes) {
        totalTradesProcessed.incrementAndGet();

        // Distribute to assigned EI nodes (round-robin)
        int nodeIndex = (int) (totalTradesProcessed.get() % nodes.size());
        String nodeId = nodes.get(nodeIndex);

        // Add to buffer
        List<ExchangeTradeData> buffer = tradeBuffers.get(nodeId);
        if (buffer != null) {
            buffer.add(trade);

            // Process if buffer is full
            if (buffer.size() >= batchSize) {
                processBatch(nodeId);
            }
        }
    }

    private void processBatch(String nodeId) {
        List<ExchangeTickerData> tickers;
        List<ExchangeTradeData> trades;

        // Atomically get and clear buffers
        synchronized (tickerBuffers) {
            tickers = new ArrayList<>(tickerBuffers.getOrDefault(nodeId, Collections.emptyList()));
            tickerBuffers.put(nodeId, Collections.synchronizedList(new ArrayList<>()));
        }
        synchronized (tradeBuffers) {
            trades = new ArrayList<>(tradeBuffers.getOrDefault(nodeId, Collections.emptyList()));
            tradeBuffers.put(nodeId, Collections.synchronizedList(new ArrayList<>()));
        }

        if (tickers.isEmpty() && trades.isEmpty()) {
            return;
        }

        totalBatchesProcessed.incrementAndGet();

        // Tokenize the batch
        int tokenized = tokenizeBatch(nodeId, tickers, trades);
        totalTokenizationsCompleted.addAndGet(tokenized);

        LOG.debugf("Processed batch on %s: %d tickers, %d trades, %d tokenized",
            nodeId, tickers.size(), trades.size(), tokenized);
    }

    private int tokenizeBatch(String nodeId, List<ExchangeTickerData> tickers, List<ExchangeTradeData> trades) {
        int tokenized = 0;

        // Tokenize tickers
        for (ExchangeTickerData ticker : tickers) {
            // Create token metadata
            Map<String, Object> tokenData = Map.of(
                "type", "EXCHANGE_TICKER",
                "exchange", ticker.exchange(),
                "pair", ticker.pair(),
                "price", ticker.lastPrice(),
                "volume", ticker.volume24h(),
                "change24h", ticker.changePercent24h(),
                "timestamp", ticker.timestamp(),
                "nodeId", nodeId
            );

            // In production, this would call the tokenization service
            // For now, we just count it
            tokenized++;
        }

        // Tokenize trades
        for (ExchangeTradeData trade : trades) {
            Map<String, Object> tokenData = Map.of(
                "type", "EXCHANGE_TRADE",
                "exchange", trade.exchange(),
                "pair", trade.pair(),
                "price", trade.price(),
                "amount", trade.amount(),
                "side", trade.side(),
                "tradeId", trade.tradeId(),
                "timestamp", trade.timestamp(),
                "nodeId", nodeId
            );

            tokenized++;
        }

        return tokenized;
    }

    private void startBatchProcessing() {
        // Periodic batch processing
        Multi.createFrom().ticks().every(Duration.ofMillis(batchIntervalMs))
            .subscribe().with(
                tick -> {
                    if (running.get()) {
                        eiNodes.keySet().forEach(this::processBatch);
                    }
                },
                error -> LOG.errorf(error, "Error in batch processing")
            );
    }

    private void flushAllBuffers() {
        eiNodes.keySet().forEach(this::processBatch);
    }

    private String findAvailableEINode() {
        // Find EI node with least assignments
        return eiNodes.entrySet().stream()
            .min(Comparator.comparingInt(e -> e.getValue().assignedPairs().size()))
            .map(Map.Entry::getKey)
            .orElse(null);
    }

    // ==========================================================================
    // Status & Metrics
    // ==========================================================================

    public Map<String, EINodeConfig> getEINodes() {
        return new HashMap<>(eiNodes);
    }

    public EINodeIntegrationMetrics getMetrics() {
        Map<String, EINodeMetrics> nodeMetrics = new HashMap<>();

        for (Map.Entry<String, EINodeConfig> entry : eiNodes.entrySet()) {
            String nodeId = entry.getKey();
            EINodeConfig config = entry.getValue();

            int tickerBufferSize = tickerBuffers.getOrDefault(nodeId, Collections.emptyList()).size();
            int tradeBufferSize = tradeBuffers.getOrDefault(nodeId, Collections.emptyList()).size();

            nodeMetrics.put(nodeId, new EINodeMetrics(
                nodeId,
                config.status().name(),
                config.assignedPairs().size(),
                tickerBufferSize,
                tradeBufferSize
            ));
        }

        return new EINodeIntegrationMetrics(
            totalTickersProcessed.get(),
            totalTradesProcessed.get(),
            totalTokenizationsCompleted.get(),
            totalBatchesProcessed.get(),
            eiNodes.size(),
            activeSubscriptions.size(),
            nodeMetrics
        );
    }

    // ==========================================================================
    // Data Records
    // ==========================================================================

    public enum EINodeStatus {
        IDLE,
        ACTIVE,
        PAUSED,
        ERROR
    }

    public record EINodeConfig(
        String nodeId,
        String name,
        EINodeStatus status,
        List<String> assignedPairs,
        String lastUpdated
    ) {}

    public record EINodeMetrics(
        String nodeId,
        String status,
        int assignedPairs,
        int tickerBufferSize,
        int tradeBufferSize
    ) {}

    public record EINodeIntegrationMetrics(
        long totalTickersProcessed,
        long totalTradesProcessed,
        long totalTokenizationsCompleted,
        long totalBatchesProcessed,
        int totalEINodes,
        int activeSubscriptions,
        Map<String, EINodeMetrics> nodeMetrics
    ) {}
}
