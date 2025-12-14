package io.aurigraph.v11.quantconnect;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * External Integration (EI) Node Data Feed Service
 *
 * Routes QuantConnect market data through Aurigraph External Integration (EI) Nodes for lightweight
 * processing and tokenization. External Integration (EI) Nodes provide:
 * - Lightweight data processing
 * - Real-time market data streaming
 * - Efficient tokenization pipeline
 * - Merkle tree registration
 *
 * Architecture:
 * QuantConnect API --> External Integration (EI) Node --> Tokenization Registry --> Merkle Tree
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
@ApplicationScoped
public class EINodeDataFeed {

    private static final Logger LOGGER = LoggerFactory.getLogger(EINodeDataFeed.class);

    @Inject
    QuantConnectService quantConnectService;

    @Inject
    EquityTokenizationRegistry registry;

    @ConfigProperty(name = "aurigraph.ei-node.id", defaultValue = "ei-node-1")
    String eiNodeId;

    @ConfigProperty(name = "aurigraph.ei-node.poll-interval-seconds", defaultValue = "60")
    int pollIntervalSeconds;

    // Slim node state
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicLong messagesProcessed = new AtomicLong(0);
    private final AtomicLong tokenizationsCompleted = new AtomicLong(0);
    private final Map<String, Instant> lastUpdateBySymbol = new ConcurrentHashMap<>();
    private ScheduledExecutorService scheduler;
    private Instant startTime;

    // Default symbols to track
    private static final List<String> DEFAULT_SYMBOLS = Arrays.asList(
        "AAPL", "GOOGL", "MSFT", "AMZN", "META",
        "TSLA", "NVDA", "JPM", "V", "JNJ",
        "WMT", "PG", "MA", "UNH", "HD"
    );

    /**
     * Start the External Integration (EI) Node data feed
     */
    public Uni<DataFeedStatus> start() {
        return Uni.createFrom().item(() -> {
            if (isRunning.get()) {
                LOGGER.warn("External Integration (EI) Node data feed already running");
                return getStatus();
            }

            LOGGER.info("Starting External Integration (EI) Node data feed: {}", eiNodeId);

            isRunning.set(true);
            startTime = Instant.now();

            // Initialize scheduler for periodic data fetching
            scheduler = Executors.newScheduledThreadPool(2);

            // Schedule periodic equity data fetch and tokenization
            scheduler.scheduleAtFixedRate(
                this::fetchAndTokenizeEquities,
                0,
                pollIntervalSeconds,
                TimeUnit.SECONDS
            );

            // Schedule periodic transaction feed processing
            scheduler.scheduleAtFixedRate(
                this::fetchAndTokenizeTransactions,
                5,
                pollIntervalSeconds * 2,
                TimeUnit.SECONDS
            );

            LOGGER.info("External Integration (EI) Node data feed started successfully. Poll interval: {}s", pollIntervalSeconds);

            return getStatus();
        });
    }

    /**
     * Stop the External Integration (EI) Node data feed
     */
    public Uni<DataFeedStatus> stop() {
        return Uni.createFrom().item(() -> {
            if (!isRunning.get()) {
                LOGGER.warn("External Integration (EI) Node data feed not running");
                return getStatus();
            }

            LOGGER.info("Stopping External Integration (EI) Node data feed: {}", eiNodeId);

            isRunning.set(false);

            if (scheduler != null) {
                scheduler.shutdown();
                try {
                    if (!scheduler.awaitTermination(10, TimeUnit.SECONDS)) {
                        scheduler.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    scheduler.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            LOGGER.info("External Integration (EI) Node data feed stopped");

            return getStatus();
        });
    }

    /**
     * Get current status of the External Integration (EI) Node data feed
     */
    public DataFeedStatus getStatus() {
        Duration uptime = startTime != null ? Duration.between(startTime, Instant.now()) : Duration.ZERO;

        return new DataFeedStatus(
            eiNodeId,
            isRunning.get(),
            messagesProcessed.get(),
            tokenizationsCompleted.get(),
            registry.getStatistics().getTotalEquities(),
            registry.getStatistics().getTotalTransactions(),
            registry.getMerkleRoot(),
            uptime.toSeconds(),
            pollIntervalSeconds,
            lastUpdateBySymbol.size(),
            Instant.now()
        );
    }

    /**
     * Manually trigger equity data fetch and tokenization
     */
    public Uni<BatchProcessingResult> processEquities(List<String> symbols) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();
            List<String> targetSymbols = symbols != null && !symbols.isEmpty() ? symbols : DEFAULT_SYMBOLS;

            LOGGER.info("Processing {} equities through External Integration (EI) Node {}", targetSymbols.size(), eiNodeId);

            int processed = 0;
            int tokenized = 0;
            List<ProcessingResult> results = new ArrayList<>();

            // Fetch equity data
            List<EquityData> equities = quantConnectService.fetchEquityData(targetSymbols)
                .await().indefinitely();

            for (EquityData equity : equities) {
                processed++;
                messagesProcessed.incrementAndGet();

                try {
                    // Tokenize equity
                    TokenizationResult result = quantConnectService.tokenizeEquity(equity)
                        .await().indefinitely();

                    if (result.isSuccess()) {
                        tokenized++;
                        tokenizationsCompleted.incrementAndGet();
                        lastUpdateBySymbol.put(equity.getSymbol(), Instant.now());
                    }

                    results.add(new ProcessingResult(
                        equity.getSymbol(),
                        "equity",
                        result.isSuccess(),
                        result.getTokenId(),
                        result.getMessage()
                    ));

                } catch (Exception e) {
                    LOGGER.error("Failed to process equity {}: {}", equity.getSymbol(), e.getMessage());
                    results.add(new ProcessingResult(
                        equity.getSymbol(),
                        "equity",
                        false,
                        null,
                        e.getMessage()
                    ));
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;

            LOGGER.info("Processed {} equities, tokenized {} in {}ms", processed, tokenized, processingTime);

            return new BatchProcessingResult(
                eiNodeId,
                "equity",
                processed,
                tokenized,
                processingTime,
                results,
                registry.getMerkleRoot()
            );
        });
    }

    /**
     * Manually trigger transaction feed processing
     */
    public Uni<BatchProcessingResult> processTransactions(String symbol, int limit) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();
            String targetSymbol = symbol != null ? symbol : "AAPL";
            int targetLimit = limit > 0 ? limit : 50;

            LOGGER.info("Processing transactions for {} through External Integration (EI) Node {}", targetSymbol, eiNodeId);

            int processed = 0;
            int tokenized = 0;
            List<ProcessingResult> results = new ArrayList<>();

            // Fetch transactions
            List<TransactionData> transactions = quantConnectService.fetchTransactionFeed(targetSymbol, targetLimit)
                .await().indefinitely();

            for (TransactionData tx : transactions) {
                processed++;
                messagesProcessed.incrementAndGet();

                try {
                    // Tokenize transaction
                    TokenizationResult result = quantConnectService.tokenizeTransaction(tx)
                        .await().indefinitely();

                    if (result.isSuccess()) {
                        tokenized++;
                        tokenizationsCompleted.incrementAndGet();
                    }

                    results.add(new ProcessingResult(
                        tx.getTransactionId(),
                        "transaction",
                        result.isSuccess(),
                        result.getTokenId(),
                        result.getMessage()
                    ));

                } catch (Exception e) {
                    LOGGER.error("Failed to process transaction {}: {}", tx.getTransactionId(), e.getMessage());
                    results.add(new ProcessingResult(
                        tx.getTransactionId(),
                        "transaction",
                        false,
                        null,
                        e.getMessage()
                    ));
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;

            LOGGER.info("Processed {} transactions, tokenized {} in {}ms", processed, tokenized, processingTime);

            return new BatchProcessingResult(
                eiNodeId,
                "transaction",
                processed,
                tokenized,
                processingTime,
                results,
                registry.getMerkleRoot()
            );
        });
    }

    // Private helper methods

    private void fetchAndTokenizeEquities() {
        if (!isRunning.get()) return;

        try {
            LOGGER.debug("External Integration (EI) Node {} fetching equity data...", eiNodeId);

            processEquities(DEFAULT_SYMBOLS).await().atMost(Duration.ofSeconds(60));

        } catch (Exception e) {
            LOGGER.error("Error in equity data feed: {}", e.getMessage());
        }
    }

    private void fetchAndTokenizeTransactions() {
        if (!isRunning.get()) return;

        try {
            LOGGER.debug("External Integration (EI) Node {} fetching transaction data...", eiNodeId);

            // Process transactions for a random symbol
            Random random = new Random();
            String symbol = DEFAULT_SYMBOLS.get(random.nextInt(DEFAULT_SYMBOLS.size()));

            processTransactions(symbol, 20).await().atMost(Duration.ofSeconds(60));

        } catch (Exception e) {
            LOGGER.error("Error in transaction data feed: {}", e.getMessage());
        }
    }

    // Inner classes

    public static class DataFeedStatus {
        private final String eiNodeId;
        private final boolean running;
        private final long messagesProcessed;
        private final long tokenizationsCompleted;
        private final long totalEquities;
        private final long totalTransactions;
        private final String merkleRoot;
        private final long uptimeSeconds;
        private final int pollIntervalSeconds;
        private final int trackedSymbols;
        private final Instant timestamp;

        public DataFeedStatus(String eiNodeId, boolean running, long messagesProcessed,
                             long tokenizationsCompleted, long totalEquities, long totalTransactions,
                             String merkleRoot, long uptimeSeconds, int pollIntervalSeconds,
                             int trackedSymbols, Instant timestamp) {
            this.eiNodeId = eiNodeId;
            this.running = running;
            this.messagesProcessed = messagesProcessed;
            this.tokenizationsCompleted = tokenizationsCompleted;
            this.totalEquities = totalEquities;
            this.totalTransactions = totalTransactions;
            this.merkleRoot = merkleRoot;
            this.uptimeSeconds = uptimeSeconds;
            this.pollIntervalSeconds = pollIntervalSeconds;
            this.trackedSymbols = trackedSymbols;
            this.timestamp = timestamp;
        }

        public String getEINodeId() { return eiNodeId; }
        public boolean isRunning() { return running; }
        public long getMessagesProcessed() { return messagesProcessed; }
        public long getTokenizationsCompleted() { return tokenizationsCompleted; }
        public long getTotalEquities() { return totalEquities; }
        public long getTotalTransactions() { return totalTransactions; }
        public String getMerkleRoot() { return merkleRoot; }
        public long getUptimeSeconds() { return uptimeSeconds; }
        public int getPollIntervalSeconds() { return pollIntervalSeconds; }
        public int getTrackedSymbols() { return trackedSymbols; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class BatchProcessingResult {
        private final String eiNodeId;
        private final String type;
        private final int processed;
        private final int tokenized;
        private final long processingTimeMs;
        private final List<ProcessingResult> results;
        private final String merkleRoot;

        public BatchProcessingResult(String eiNodeId, String type, int processed, int tokenized,
                                    long processingTimeMs, List<ProcessingResult> results, String merkleRoot) {
            this.eiNodeId = eiNodeId;
            this.type = type;
            this.processed = processed;
            this.tokenized = tokenized;
            this.processingTimeMs = processingTimeMs;
            this.results = results;
            this.merkleRoot = merkleRoot;
        }

        public String getEINodeId() { return eiNodeId; }
        public String getType() { return type; }
        public int getProcessed() { return processed; }
        public int getTokenized() { return tokenized; }
        public long getProcessingTimeMs() { return processingTimeMs; }
        public List<ProcessingResult> getResults() { return results; }
        public String getMerkleRoot() { return merkleRoot; }
    }

    public static class ProcessingResult {
        private final String id;
        private final String type;
        private final boolean success;
        private final String tokenId;
        private final String message;

        public ProcessingResult(String id, String type, boolean success, String tokenId, String message) {
            this.id = id;
            this.type = type;
            this.success = success;
            this.tokenId = tokenId;
            this.message = message;
        }

        public String getId() { return id; }
        public String getType() { return type; }
        public boolean isSuccess() { return success; }
        public String getTokenId() { return tokenId; }
        public String getMessage() { return message; }
    }
}
