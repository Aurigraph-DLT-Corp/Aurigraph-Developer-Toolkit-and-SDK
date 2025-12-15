package io.aurigraph.v11.ei;

import io.aurigraph.v11.exchange.CryptoExchangeService;
import io.aurigraph.v11.exchange.EINodeExchangeIntegration;
import io.aurigraph.v11.quantconnect.EINodeDataFeed;
import io.aurigraph.v11.quantconnect.EquityTokenizationRegistry;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;

/**
 * External Integration (EI) Node REST API Resource
 *
 * Provides endpoints for managing EI nodes and their external API integrations:
 * - EI Node status and health
 * - Data feed management (QuantConnect, Exchange data)
 * - External API connections and configurations
 * - Metrics and monitoring
 *
 * EI Nodes (formerly Slim Nodes) handle:
 * - Lightweight data processing
 * - Real-time market data streaming
 * - External API integrations (QuantConnect, Crypto Exchanges)
 * - Tokenization pipeline
 *
 * @version 12.1.0 (December 2025)
 * @author Aurigraph DLT Team
 */
@Path("/api/v12/ei-nodes")
@ApplicationScoped
@PermitAll
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EINodeResource {

    private static final Logger LOG = Logger.getLogger(EINodeResource.class);

    @Inject
    EINodeDataFeed eiNodeDataFeed;

    @Inject
    EINodeExchangeIntegration exchangeIntegration;

    @Inject
    CryptoExchangeService exchangeService;

    @Inject
    EquityTokenizationRegistry registry;

    // ========================================================================
    // EI Node Overview & Health
    // ========================================================================

    /**
     * GET /api/v12/ei-nodes
     * Get overview of all EI nodes and their integrations
     */
    @GET
    public Response getOverview() {
        LOG.info("GET /api/v12/ei-nodes");

        try {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("service", "External Integration (EI) Nodes");
            response.put("version", "12.1.0");
            response.put("description", "Lightweight nodes for external API integrations and data processing");

            // Data Feed Status (with null checks)
            if (eiNodeDataFeed != null) {
                var dataFeedStatus = eiNodeDataFeed.getStatus();
                response.put("dataFeed", Map.of(
                    "nodeId", dataFeedStatus.getEINodeId(),
                    "running", dataFeedStatus.isRunning(),
                    "messagesProcessed", dataFeedStatus.getMessagesProcessed(),
                    "tokenizationsCompleted", dataFeedStatus.getTokenizationsCompleted(),
                    "uptimeSeconds", dataFeedStatus.getUptimeSeconds()
                ));
            } else {
                response.put("dataFeed", Map.of("status", "NOT_INITIALIZED"));
            }

            // Exchange Integration Status (with null checks)
            if (exchangeIntegration != null) {
                var exchangeMetrics = exchangeIntegration.getMetrics();
                response.put("exchangeIntegration", Map.of(
                    "totalNodes", exchangeMetrics.totalEINodes(),
                    "activeSubscriptions", exchangeMetrics.activeSubscriptions(),
                    "tickersProcessed", exchangeMetrics.totalTickersProcessed(),
                    "tradesProcessed", exchangeMetrics.totalTradesProcessed(),
                    "tokenizations", exchangeMetrics.totalTokenizationsCompleted()
                ));
            } else {
                response.put("exchangeIntegration", Map.of("status", "NOT_INITIALIZED"));
            }

            // Registry Stats (with null checks)
            if (registry != null) {
                var registryStats = registry.getStatistics();
                response.put("registry", Map.of(
                    "totalEquities", registryStats.getTotalEquities(),
                    "totalTransactions", registryStats.getTotalTransactions(),
                    "merkleRoot", registryStats.getMerkleRoot()
                ));
            } else {
                response.put("registry", Map.of("status", "NOT_INITIALIZED"));
            }

            // External APIs
            response.put("externalAPIs", getExternalAPIsStatus());
            response.put("timestamp", Instant.now().toString());

            return Response.ok(response).build();
        } catch (Exception e) {
            LOG.errorf(e, "Error getting EI nodes overview");
            return Response.ok(Map.of(
                "service", "External Integration (EI) Nodes",
                "version", "12.1.0",
                "status", "INITIALIZING",
                "message", "EI Node services are starting up",
                "timestamp", Instant.now().toString()
            )).build();
        }
    }

    private List<Map<String, Object>> getExternalAPIsStatus() {
        List<Map<String, Object>> apis = new ArrayList<>();

        // QuantConnect
        boolean qcRunning = eiNodeDataFeed != null && eiNodeDataFeed.getStatus().isRunning();
        apis.add(Map.of(
            "name", "QuantConnect",
            "type", "MARKET_DATA",
            "status", qcRunning ? "ACTIVE" : "IDLE"
        ));

        // Crypto Exchanges
        Map<String, Boolean> exchangeStatus = exchangeService != null
            ? exchangeService.getConnectionStatus()
            : Map.of();

        for (String exchange : List.of("binance", "coinbase", "kraken")) {
            apis.add(Map.of(
                "name", exchange.substring(0, 1).toUpperCase() + exchange.substring(1),
                "type", "CRYPTO_EXCHANGE",
                "status", exchangeStatus.getOrDefault(exchange, false) ? "CONNECTED" : "DISCONNECTED"
            ));
        }

        return apis;
    }

    /**
     * GET /api/v12/ei-nodes/health
     * Get health status of all EI nodes
     */
    @GET
    @Path("/health")
    public Response getHealth() {
        LOG.info("GET /api/v12/ei-nodes/health");

        try {
            Map<String, Object> response = new LinkedHashMap<>();

            boolean dataFeedUp = false;
            boolean exchangeUp = false;
            String nodeId = "ei-node-1";
            int activeNodes = 0;

            if (eiNodeDataFeed != null) {
                var status = eiNodeDataFeed.getStatus();
                dataFeedUp = status.isRunning();
                nodeId = status.getEINodeId();
            }

            if (exchangeIntegration != null) {
                var metrics = exchangeIntegration.getMetrics();
                exchangeUp = metrics.activeSubscriptions() > 0;
                activeNodes = metrics.totalEINodes();
            }

            boolean healthy = dataFeedUp || exchangeUp || activeNodes > 0;
            response.put("status", healthy ? "UP" : "IDLE");
            response.put("components", Map.of(
                "dataFeed", Map.of(
                    "status", dataFeedUp ? "UP" : "IDLE",
                    "nodeId", nodeId
                ),
                "exchangeIntegration", Map.of(
                    "status", exchangeUp ? "UP" : "IDLE",
                    "activeNodes", activeNodes
                )
            ));
            response.put("timestamp", Instant.now().toString());

            return Response.ok(response).build();
        } catch (Exception e) {
            LOG.errorf(e, "Error getting EI nodes health");
            return Response.ok(Map.of(
                "status", "INITIALIZING",
                "message", "EI Node services are starting up",
                "timestamp", Instant.now().toString()
            )).build();
        }
    }

    // ========================================================================
    // Data Feed Management (QuantConnect)
    // ========================================================================

    /**
     * GET /api/v12/ei-nodes/data-feed/status
     * Get data feed status
     */
    @GET
    @Path("/data-feed/status")
    public Response getDataFeedStatus() {
        LOG.info("GET /api/v12/ei-nodes/data-feed/status");

        var status = eiNodeDataFeed.getStatus();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nodeId", status.getEINodeId());
        response.put("running", status.isRunning());
        response.put("messagesProcessed", status.getMessagesProcessed());
        response.put("tokenizationsCompleted", status.getTokenizationsCompleted());
        response.put("totalEquities", status.getTotalEquities());
        response.put("totalTransactions", status.getTotalTransactions());
        response.put("merkleRoot", status.getMerkleRoot());
        response.put("uptimeSeconds", status.getUptimeSeconds());
        response.put("pollIntervalSeconds", status.getPollIntervalSeconds());
        response.put("trackedSymbols", status.getTrackedSymbols());
        response.put("timestamp", status.getTimestamp().toString());

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/ei-nodes/data-feed/start
     * Start data feed
     */
    @POST
    @Path("/data-feed/start")
    public Uni<Response> startDataFeed() {
        LOG.info("POST /api/v12/ei-nodes/data-feed/start");

        return eiNodeDataFeed.start()
            .map(status -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("message", "EI Node data feed started");
                response.put("nodeId", status.getEINodeId());
                response.put("running", status.isRunning());
                response.put("pollIntervalSeconds", status.getPollIntervalSeconds());
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/ei-nodes/data-feed/stop
     * Stop data feed
     */
    @POST
    @Path("/data-feed/stop")
    public Uni<Response> stopDataFeed() {
        LOG.info("POST /api/v12/ei-nodes/data-feed/stop");

        return eiNodeDataFeed.stop()
            .map(status -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("message", "EI Node data feed stopped");
                response.put("nodeId", status.getEINodeId());
                response.put("running", status.isRunning());
                response.put("messagesProcessed", status.getMessagesProcessed());
                response.put("tokenizationsCompleted", status.getTokenizationsCompleted());
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/ei-nodes/data-feed/process
     * Manually process data
     */
    @POST
    @Path("/data-feed/process")
    public Uni<Response> processData(ProcessRequest request) {
        LOG.info("POST /api/v12/ei-nodes/data-feed/process");

        List<String> symbols = request != null && request.symbols != null ? request.symbols : null;
        String type = request != null && request.type != null ? request.type : "equities";

        if ("transactions".equalsIgnoreCase(type)) {
            String symbol = symbols != null && !symbols.isEmpty() ? symbols.get(0) : "AAPL";
            int limit = request != null && request.limit > 0 ? request.limit : 50;

            return eiNodeDataFeed.processTransactions(symbol, limit)
                .map(result -> Response.ok(Map.of(
                    "nodeId", result.getEINodeId(),
                    "type", result.getType(),
                    "processed", result.getProcessed(),
                    "tokenized", result.getTokenized(),
                    "processingTimeMs", result.getProcessingTimeMs(),
                    "merkleRoot", result.getMerkleRoot(),
                    "timestamp", Instant.now().toString()
                )).build());
        } else {
            return eiNodeDataFeed.processEquities(symbols)
                .map(result -> Response.ok(Map.of(
                    "nodeId", result.getEINodeId(),
                    "type", result.getType(),
                    "processed", result.getProcessed(),
                    "tokenized", result.getTokenized(),
                    "processingTimeMs", result.getProcessingTimeMs(),
                    "merkleRoot", result.getMerkleRoot(),
                    "timestamp", Instant.now().toString()
                )).build());
        }
    }

    // ========================================================================
    // Exchange Integration
    // ========================================================================

    /**
     * GET /api/v12/ei-nodes/exchange/nodes
     * Get all EI nodes for exchange integration
     */
    @GET
    @Path("/exchange/nodes")
    public Response getExchangeNodes() {
        LOG.info("GET /api/v12/ei-nodes/exchange/nodes");

        var nodes = exchangeIntegration.getEINodes();

        List<Map<String, Object>> nodeList = new ArrayList<>();
        for (var entry : nodes.entrySet()) {
            var config = entry.getValue();
            nodeList.add(Map.of(
                "nodeId", config.nodeId(),
                "name", config.name(),
                "status", config.status().name(),
                "assignedPairs", config.assignedPairs(),
                "lastUpdated", config.lastUpdated()
            ));
        }

        return Response.ok(Map.of(
            "nodes", nodeList,
            "count", nodeList.size(),
            "timestamp", Instant.now().toString()
        )).build();
    }

    /**
     * GET /api/v12/ei-nodes/exchange/metrics
     * Get exchange integration metrics
     */
    @GET
    @Path("/exchange/metrics")
    public Response getExchangeMetrics() {
        LOG.info("GET /api/v12/ei-nodes/exchange/metrics");

        var metrics = exchangeIntegration.getMetrics();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalTickersProcessed", metrics.totalTickersProcessed());
        response.put("totalTradesProcessed", metrics.totalTradesProcessed());
        response.put("totalTokenizationsCompleted", metrics.totalTokenizationsCompleted());
        response.put("totalBatchesProcessed", metrics.totalBatchesProcessed());
        response.put("totalEINodes", metrics.totalEINodes());
        response.put("activeSubscriptions", metrics.activeSubscriptions());
        response.put("nodeMetrics", metrics.nodeMetrics());
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/ei-nodes/exchange/assign
     * Assign exchange/pairs to an EI node
     */
    @POST
    @Path("/exchange/assign")
    public Uni<Response> assignExchangeToNode(AssignRequest request) {
        LOG.info("POST /api/v12/ei-nodes/exchange/assign");

        if (request == null || request.nodeId == null || request.exchange == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "nodeId and exchange are required"))
                .build());
        }

        List<String> pairs = request.pairs != null ? request.pairs : List.of("BTC/USDT", "ETH/USDT");

        return exchangeIntegration.assignExchangeToEINode(request.nodeId, request.exchange, pairs)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "message", "Exchange assigned to EI node",
                        "nodeId", request.nodeId,
                        "exchange", request.exchange,
                        "pairs", pairs,
                        "timestamp", Instant.now().toString()
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "EI node not found: " + request.nodeId))
                        .build();
                }
            });
    }

    /**
     * POST /api/v12/ei-nodes/exchange/stream/start
     * Start streaming exchange data to EI nodes
     */
    @POST
    @Path("/exchange/stream/start")
    public Uni<Response> startExchangeStream(StreamRequest request) {
        LOG.info("POST /api/v12/ei-nodes/exchange/stream/start");

        if (request == null || request.exchange == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "exchange is required"))
                .build());
        }

        List<String> pairs = request.pairs != null ? request.pairs : List.of("BTC/USDT", "ETH/USDT");

        return exchangeIntegration.startStreaming(request.exchange, pairs)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "message", "Exchange streaming started",
                        "exchange", request.exchange,
                        "pairs", pairs,
                        "timestamp", Instant.now().toString()
                    )).build();
                } else {
                    return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                        .entity(Map.of("error", "Failed to start streaming"))
                        .build();
                }
            });
    }

    /**
     * POST /api/v12/ei-nodes/exchange/stream/stop
     * Stop streaming from an exchange
     */
    @POST
    @Path("/exchange/stream/stop")
    public Response stopExchangeStream(StreamRequest request) {
        LOG.info("POST /api/v12/ei-nodes/exchange/stream/stop");

        if (request == null || request.exchange == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "exchange is required"))
                .build();
        }

        exchangeIntegration.stopStreaming(request.exchange);

        return Response.ok(Map.of(
            "message", "Exchange streaming stopped",
            "exchange", request.exchange,
            "timestamp", Instant.now().toString()
        )).build();
    }

    /**
     * POST /api/v12/ei-nodes/exchange/auto-distribute
     * Auto-distribute exchanges across EI nodes
     */
    @POST
    @Path("/exchange/auto-distribute")
    public Uni<Response> autoDistributeExchanges(AutoDistributeRequest request) {
        LOG.info("POST /api/v12/ei-nodes/exchange/auto-distribute");

        List<String> exchanges = request != null && request.exchanges != null
            ? request.exchanges
            : List.of("binance", "coinbase", "kraken");
        List<String> pairs = request != null && request.pairs != null
            ? request.pairs
            : List.of("BTC/USDT", "ETH/USDT", "SOL/USDT");

        return exchangeIntegration.autoDistributeExchanges(exchanges, pairs)
            .map(distribution -> Response.ok(Map.of(
                "message", "Exchanges auto-distributed across EI nodes",
                "distribution", distribution,
                "exchanges", exchanges,
                "pairs", pairs,
                "timestamp", Instant.now().toString()
            )).build());
    }

    // ========================================================================
    // External API Management
    // ========================================================================

    /**
     * GET /api/v12/ei-nodes/external-apis
     * List all available external API integrations
     */
    @GET
    @Path("/external-apis")
    public Response listExternalAPIs() {
        LOG.info("GET /api/v12/ei-nodes/external-apis");

        var exchangeStatus = exchangeService.getConnectionStatus();
        var dataFeedStatus = eiNodeDataFeed.getStatus();

        List<Map<String, Object>> apis = new ArrayList<>();

        // QuantConnect
        apis.add(Map.of(
            "id", "quantconnect",
            "name", "QuantConnect",
            "type", "MARKET_DATA",
            "description", "Financial market data and algorithmic trading platform",
            "status", dataFeedStatus.isRunning() ? "ACTIVE" : "IDLE",
            "endpoints", List.of(
                "/api/v12/ei-nodes/data-feed/status",
                "/api/v12/ei-nodes/data-feed/start",
                "/api/v12/ei-nodes/data-feed/stop"
            ),
            "supportedAssets", List.of("Equities", "Transactions")
        ));

        // Crypto Exchanges
        for (String exchange : List.of("binance", "coinbase", "kraken", "okx", "bybit")) {
            apis.add(Map.of(
                "id", exchange,
                "name", exchange.substring(0, 1).toUpperCase() + exchange.substring(1),
                "type", "CRYPTO_EXCHANGE",
                "description", "Real-time cryptocurrency market data",
                "status", exchangeStatus.getOrDefault(exchange, false) ? "CONNECTED" : "DISCONNECTED",
                "endpoints", List.of(
                    "/api/v12/exchanges/" + exchange + "/ticker/{pair}",
                    "/api/v12/exchanges/" + exchange + "/connect",
                    "/api/v12/exchanges/" + exchange + "/disconnect"
                ),
                "supportedAssets", List.of("BTC", "ETH", "SOL", "XRP")
            ));
        }

        return Response.ok(Map.of(
            "externalAPIs", apis,
            "count", apis.size(),
            "timestamp", Instant.now().toString()
        )).build();
    }

    /**
     * POST /api/v12/ei-nodes/external-apis/{apiId}/connect
     * Connect to an external API
     */
    @POST
    @Path("/external-apis/{apiId}/connect")
    public Uni<Response> connectExternalAPI(
            @PathParam("apiId") String apiId,
            ConnectAPIRequest request) {
        LOG.infof("POST /api/v12/ei-nodes/external-apis/%s/connect", apiId);

        if ("quantconnect".equalsIgnoreCase(apiId)) {
            return eiNodeDataFeed.start()
                .map(status -> Response.ok(Map.of(
                    "message", "Connected to QuantConnect",
                    "apiId", apiId,
                    "running", status.isRunning(),
                    "timestamp", Instant.now().toString()
                )).build());
        } else {
            // Crypto exchange
            List<String> pairs = request != null && request.pairs != null
                ? request.pairs
                : List.of("BTC/USDT", "ETH/USDT");

            return exchangeService.connectToExchange(apiId.toLowerCase(), pairs)
                .map(success -> {
                    if (success) {
                        return Response.ok(Map.of(
                            "message", "Connected to " + apiId,
                            "apiId", apiId,
                            "pairs", pairs,
                            "timestamp", Instant.now().toString()
                        )).build();
                    } else {
                        return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .entity(Map.of("error", "Failed to connect to " + apiId))
                            .build();
                    }
                });
        }
    }

    /**
     * POST /api/v12/ei-nodes/external-apis/{apiId}/disconnect
     * Disconnect from an external API
     */
    @POST
    @Path("/external-apis/{apiId}/disconnect")
    public Uni<Response> disconnectExternalAPI(@PathParam("apiId") String apiId) {
        LOG.infof("POST /api/v12/ei-nodes/external-apis/%s/disconnect", apiId);

        if ("quantconnect".equalsIgnoreCase(apiId)) {
            return eiNodeDataFeed.stop()
                .map(status -> Response.ok(Map.of(
                    "message", "Disconnected from QuantConnect",
                    "apiId", apiId,
                    "running", status.isRunning(),
                    "timestamp", Instant.now().toString()
                )).build());
        } else {
            // Crypto exchange
            exchangeService.disconnectFromExchange(apiId.toLowerCase());
            return Uni.createFrom().item(Response.ok(Map.of(
                "message", "Disconnected from " + apiId,
                "apiId", apiId,
                "timestamp", Instant.now().toString()
            )).build());
        }
    }

    // ========================================================================
    // Request/Response DTOs
    // ========================================================================

    public static class ProcessRequest {
        public String type;
        public List<String> symbols;
        public int limit;
    }

    public static class AssignRequest {
        public String nodeId;
        public String exchange;
        public List<String> pairs;
    }

    public static class StreamRequest {
        public String exchange;
        public List<String> pairs;
    }

    public static class AutoDistributeRequest {
        public List<String> exchanges;
        public List<String> pairs;
    }

    public static class ConnectAPIRequest {
        public List<String> pairs;
        public Map<String, String> credentials;
    }
}
