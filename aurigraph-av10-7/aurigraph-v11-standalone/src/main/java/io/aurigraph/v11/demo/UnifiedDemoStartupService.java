package io.aurigraph.v11.demo;

import io.aurigraph.v11.grpc.RealTimeGrpcService;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Unified Demo Startup Service
 *
 * Orchestrates all demo components for a complete integration demo:
 * - Node management (Validator, Business, EI nodes)
 * - Demo Channel with Merkle tree
 * - External data streaming (Binance, Coinbase)
 * - Real-time gRPC/SSE streaming
 * - RWAT registry navigation
 * - Token topology visualization
 *
 * Configuration:
 * - demo.mode.enabled=true - Enable demo mode
 * - demo.autostart=true - Start demo automatically
 * - demo.vvb.optional=true - Make VVB verification optional
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@ApplicationScoped
public class UnifiedDemoStartupService {

    private static final Logger LOG = Logger.getLogger(UnifiedDemoStartupService.class);

    @ConfigProperty(name = "demo.mode.enabled", defaultValue = "true")
    boolean demoModeEnabled;

    @ConfigProperty(name = "demo.autostart", defaultValue = "false")
    boolean autoStart;

    @ConfigProperty(name = "demo.vvb.optional", defaultValue = "true")
    boolean vvbOptional;

    @ConfigProperty(name = "demo.nodes.validators", defaultValue = "5")
    int validatorCount;

    @ConfigProperty(name = "demo.nodes.business", defaultValue = "10")
    int businessNodeCount;

    @ConfigProperty(name = "demo.nodes.ei", defaultValue = "5")
    int eiNodeCount;

    @ConfigProperty(name = "demo.exchange.streaming.enabled", defaultValue = "true")
    boolean exchangeStreamingEnabled;

    @Inject
    RealTimeGrpcService grpcService;

    // Component status
    private final AtomicBoolean demoRunning = new AtomicBoolean(false);
    private final AtomicLong transactionCount = new AtomicLong(0);
    private final AtomicLong tokenizedAssets = new AtomicLong(0);

    // Demo state
    private final Map<String, Object> demoState = new LinkedHashMap<>();
    private final List<DemoEvent> demoEvents = Collections.synchronizedList(new ArrayList<>());
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);

    // Node tracking
    private final List<String> activeValidators = Collections.synchronizedList(new ArrayList<>());
    private final List<String> activeBusinessNodes = Collections.synchronizedList(new ArrayList<>());
    private final List<String> activeEiNodes = Collections.synchronizedList(new ArrayList<>());

    /**
     * Auto-start demo on application startup if configured
     */
    void onStart(@Observes StartupEvent ev) {
        if (demoModeEnabled && autoStart) {
            LOG.info("Demo mode enabled with autostart - initializing demo environment...");
            startDemo();
        } else if (demoModeEnabled) {
            LOG.info("Demo mode enabled - call /api/v12/demo/start to begin");
        }
    }

    /**
     * Start the unified demo
     */
    public Map<String, Object> startDemo() {
        if (demoRunning.get()) {
            return Map.of(
                "success", false,
                "message", "Demo is already running",
                "status", getDemoStatus()
            );
        }

        LOG.info("Starting unified demo environment...");
        demoRunning.set(true);
        demoEvents.clear();
        Instant startTime = Instant.now();

        try {
            // Phase 1: Initialize nodes
            initializeNodes();

            // Phase 2: Create demo channel
            createDemoChannel();

            // Phase 3: Start streaming services
            startStreamingServices();

            // Phase 4: Initialize RWAT registry
            initializeRWATRegistry();

            // Phase 5: Start transaction simulation
            startTransactionSimulation();

            // Phase 6: Start exchange data streaming (if enabled)
            if (exchangeStreamingEnabled) {
                startExchangeStreaming();
            }

            // Record startup completion
            addDemoEvent("DEMO_STARTED", "Unified demo environment started successfully");

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "Demo started successfully");
            result.put("startTime", startTime.toString());
            result.put("components", Map.of(
                "validators", validatorCount,
                "businessNodes", businessNodeCount,
                "eiNodes", eiNodeCount,
                "demoChannel", true,
                "streaming", true,
                "rwatRegistry", true,
                "exchangeStreaming", exchangeStreamingEnabled,
                "vvbOptional", vvbOptional
            ));
            result.put("endpoints", Map.of(
                "transactions", "/api/v12/stream/transactions",
                "metrics", "/api/v12/stream/metrics",
                "consensus", "/api/v12/stream/consensus",
                "validators", "/api/v12/stream/validators",
                "network", "/api/v12/stream/network",
                "demo", "/api/v12/demo/status"
            ));

            return result;

        } catch (Exception e) {
            LOG.error("Failed to start demo", e);
            demoRunning.set(false);
            return Map.of(
                "success", false,
                "message", "Demo startup failed: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }

    /**
     * Stop the demo
     */
    public Map<String, Object> stopDemo() {
        if (!demoRunning.get()) {
            return Map.of(
                "success", false,
                "message", "Demo is not running"
            );
        }

        LOG.info("Stopping unified demo environment...");

        // Stop scheduled tasks
        scheduler.shutdownNow();

        // Clear state
        activeValidators.clear();
        activeBusinessNodes.clear();
        activeEiNodes.clear();
        demoRunning.set(false);

        addDemoEvent("DEMO_STOPPED", "Demo environment stopped");

        return Map.of(
            "success", true,
            "message", "Demo stopped successfully",
            "totalTransactions", transactionCount.get(),
            "totalTokenizedAssets", tokenizedAssets.get()
        );
    }

    /**
     * Get demo status
     */
    public Map<String, Object> getDemoStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("running", demoRunning.get());
        status.put("demoModeEnabled", demoModeEnabled);
        status.put("vvbOptional", vvbOptional);

        status.put("nodes", Map.of(
            "validators", activeValidators.size(),
            "businessNodes", activeBusinessNodes.size(),
            "eiNodes", activeEiNodes.size(),
            "total", activeValidators.size() + activeBusinessNodes.size() + activeEiNodes.size()
        ));

        status.put("metrics", Map.of(
            "transactionCount", transactionCount.get(),
            "tokenizedAssets", tokenizedAssets.get()
        ));

        status.put("components", Map.of(
            "grpcStreaming", grpcService != null && grpcService.hasActiveConnections(),
            "exchangeStreaming", exchangeStreamingEnabled
        ));

        status.put("recentEvents", demoEvents.stream()
            .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
            .limit(10)
            .toList());

        return status;
    }

    // ==================== Initialization Methods ====================

    private void initializeNodes() {
        LOG.info("Initializing demo nodes...");

        // Initialize validators
        for (int i = 0; i < validatorCount; i++) {
            String validatorId = "validator-" + String.format("%03d", i);
            activeValidators.add(validatorId);
            addDemoEvent("NODE_STARTED", "Validator " + validatorId + " initialized");
        }

        // Initialize business nodes
        for (int i = 0; i < businessNodeCount; i++) {
            String nodeId = "business-" + String.format("%03d", i);
            activeBusinessNodes.add(nodeId);
            addDemoEvent("NODE_STARTED", "Business node " + nodeId + " initialized");
        }

        // Initialize EI nodes
        for (int i = 0; i < eiNodeCount; i++) {
            String nodeId = "ei-" + String.format("%03d", i);
            activeEiNodes.add(nodeId);
            addDemoEvent("NODE_STARTED", "EI node " + nodeId + " initialized");
        }

        LOG.infof("Nodes initialized: %d validators, %d business, %d EI",
            validatorCount, businessNodeCount, eiNodeCount);
    }

    private void createDemoChannel() {
        LOG.info("Creating demo channel...");

        demoState.put("demoChannel", Map.of(
            "channelId", "demo-channel-001",
            "name", "Aurigraph Demo Channel",
            "status", "ACTIVE",
            "merkleRoot", generateMerkleRoot(),
            "participants", activeValidators.size() + activeBusinessNodes.size(),
            "createdAt", Instant.now().toString()
        ));

        addDemoEvent("CHANNEL_CREATED", "Demo channel created with Merkle tree");
    }

    private void startStreamingServices() {
        LOG.info("Starting streaming services...");

        // gRPC streaming is handled by the injected services
        // SSE streaming is handled by LiveStreamingResource

        addDemoEvent("STREAMING_STARTED", "gRPC and SSE streaming services activated");
    }

    private void initializeRWATRegistry() {
        LOG.info("Initializing RWAT registry...");

        // Create sample RWAT entries
        List<Map<String, Object>> rwatTokens = new ArrayList<>();
        String[] assetTypes = {"CARBON_CREDIT", "REAL_ESTATE", "COMMODITY", "SECURITY"};

        for (int i = 0; i < 5; i++) {
            Map<String, Object> token = new LinkedHashMap<>();
            token.put("tokenId", "RWAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            token.put("assetType", assetTypes[i % assetTypes.length]);
            token.put("status", "VERIFIED");
            token.put("merkleProof", generateMerkleProof());
            token.put("createdAt", Instant.now().toString());
            rwatTokens.add(token);
            tokenizedAssets.incrementAndGet();
        }

        demoState.put("rwatRegistry", Map.of(
            "totalTokens", rwatTokens.size(),
            "tokens", rwatTokens
        ));

        addDemoEvent("RWAT_INITIALIZED", "RWAT registry initialized with " + rwatTokens.size() + " tokens");
    }

    private void startTransactionSimulation() {
        LOG.info("Starting transaction simulation...");

        // Schedule periodic transaction simulation
        scheduler.scheduleAtFixedRate(() -> {
            if (demoRunning.get()) {
                simulateTransaction();
            }
        }, 1, 2, TimeUnit.SECONDS);

        addDemoEvent("SIMULATION_STARTED", "Transaction simulation started (1 tx / 2 seconds)");
    }

    private void startExchangeStreaming() {
        LOG.info("Starting exchange data streaming...");

        // Schedule exchange data polling
        scheduler.scheduleAtFixedRate(() -> {
            if (demoRunning.get()) {
                simulateExchangeData();
            }
        }, 0, 5, TimeUnit.SECONDS);

        addDemoEvent("EXCHANGE_STREAMING", "Exchange data streaming started (Binance, Coinbase)");
    }

    // ==================== Simulation Methods ====================

    private void simulateTransaction() {
        try {
            long txNum = transactionCount.incrementAndGet();
            String txHash = "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 40);

            // Broadcast via gRPC
            if (grpcService != null) {
                grpcService.broadcastTransaction(
                    txHash,
                    "0x" + randomHex(40),
                    "0x" + randomHex(40),
                    String.format("%.4f", Math.random() * 1000),
                    Math.random() > 0.1 ? "CONFIRMED" : "PENDING",
                    21000 + (long)(Math.random() * 100000)
                );
            }

            if (txNum % 100 == 0) {
                LOG.debugf("Simulated %d transactions", txNum);
            }
        } catch (Exception e) {
            LOG.debug("Transaction simulation error", e);
        }
    }

    private void simulateExchangeData() {
        try {
            // Simulate exchange ticker data
            String[] symbols = {"BTC-USD", "ETH-USD", "AURI-USD"};
            for (String symbol : symbols) {
                double price = switch (symbol) {
                    case "BTC-USD" -> 45000 + Math.random() * 5000;
                    case "ETH-USD" -> 2500 + Math.random() * 500;
                    case "AURI-USD" -> 1.5 + Math.random() * 0.5;
                    default -> 100;
                };

                // Tokenize the data
                tokenizedAssets.incrementAndGet();
            }
        } catch (Exception e) {
            LOG.debug("Exchange simulation error", e);
        }
    }

    // ==================== Helper Methods ====================

    private void addDemoEvent(String type, String message) {
        demoEvents.add(new DemoEvent(
            UUID.randomUUID().toString().substring(0, 8),
            type,
            message,
            Instant.now()
        ));
    }

    private String generateMerkleRoot() {
        return "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 64);
    }

    private String generateMerkleProof() {
        return "[\"0x" + randomHex(64) + "\", \"0x" + randomHex(64) + "\"]";
    }

    private String randomHex(int length) {
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return sb.toString();
    }

    // ==================== Data Models ====================

    public record DemoEvent(
        String eventId,
        String type,
        String message,
        Instant timestamp
    ) {}
}
