package io.aurigraph.v11.quantconnect;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;

/**
 * QuantConnect REST API Resource
 *
 * Provides REST endpoints for:
 * - QuantConnect API authentication and data fetching
 * - Equity and transaction tokenization
 * - Merkle tree registry navigation
 * - Verification and proof generation
 *
 * Routes through External Integration (EI) Node for lightweight data processing.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
@Path("/api/v12/quantconnect")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QuantConnectResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(QuantConnectResource.class);

    @Inject
    QuantConnectService quantConnectService;

    @Inject
    EquityTokenizationRegistry registry;

    @Inject
    EINodeDataFeed eiNodeDataFeed;

    // Default symbols to tokenize
    private static final List<String> DEFAULT_SYMBOLS = Arrays.asList(
        "AAPL", "GOOGL", "MSFT", "AMZN", "META",
        "TSLA", "NVDA", "JPM", "V", "JNJ",
        "WMT", "PG", "MA", "UNH", "HD"
    );

    /**
     * GET /api/v12/quantconnect/status
     * Get QuantConnect service status
     */
    @GET
    @Path("/status")
    public Response getStatus() {
        LOGGER.info("GET /api/v12/quantconnect/status");

        QuantConnectService.ServiceStatus status = quantConnectService.getStatus();
        EquityTokenizationRegistry.RegistryStatistics stats = registry.getStatistics();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "QuantConnect Integration");
        response.put("version", "12.0.0");
        response.put("connected", status.isConnected());
        response.put("userId", status.getUserId());
        response.put("cachedEquities", status.getCachedEquities());
        response.put("cachedTransactions", status.getCachedTransactions());
        response.put("registry", Map.of(
            "totalEquitiesTokenized", stats.getTotalEquities(),
            "totalTransactionsTokenized", stats.getTotalTransactions(),
            "merkleRoot", stats.getMerkleRoot(),
            "blockNumber", stats.getBlockNumber(),
            "uniqueSymbols", stats.getUniqueSymbols()
        ));
        response.put("eiNodeId", "ei-node-1");
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/quantconnect/authenticate
     * Authenticate with QuantConnect API
     */
    @POST
    @Path("/authenticate")
    public Uni<Response> authenticate() {
        LOGGER.info("POST /api/v12/quantconnect/authenticate");

        return quantConnectService.authenticate()
            .map(authResponse -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", authResponse.isSuccess());
                response.put("message", authResponse.getMessage());
                response.put("userId", authResponse.getUserId());
                response.put("timestamp", Instant.now().toString());

                if (authResponse.isSuccess()) {
                    return Response.ok(response).build();
                } else {
                    return Response.status(Response.Status.UNAUTHORIZED).entity(response).build();
                }
            });
    }

    /**
     * GET /api/v12/quantconnect/equities
     * Fetch and return equity data (cached)
     */
    @GET
    @Path("/equities")
    public Response getEquities(@QueryParam("symbols") String symbolsParam) {
        LOGGER.info("GET /api/v12/quantconnect/equities");

        List<String> symbols = symbolsParam != null && !symbolsParam.isEmpty()
            ? Arrays.asList(symbolsParam.split(","))
            : DEFAULT_SYMBOLS;

        Map<String, EquityData> cached = quantConnectService.getCachedEquities();

        List<Map<String, Object>> equities = new ArrayList<>();
        for (String symbol : symbols) {
            EquityData equity = cached.get(symbol);
            if (equity != null) {
                equities.add(equityToMap(equity));
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("equities", equities);
        response.put("count", equities.size());
        response.put("source", "QuantConnect");
        response.put("cached", true);
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/quantconnect/fetch
     * Fetch fresh equity data from QuantConnect
     */
    @POST
    @Path("/fetch")
    public Uni<Response> fetchEquities(FetchRequest request) {
        LOGGER.info("POST /api/v12/quantconnect/fetch");

        List<String> symbols = request != null && request.getSymbols() != null && !request.getSymbols().isEmpty()
            ? request.getSymbols()
            : DEFAULT_SYMBOLS;

        return quantConnectService.fetchEquityData(symbols)
            .map(equities -> {
                List<Map<String, Object>> results = new ArrayList<>();
                for (EquityData equity : equities) {
                    results.add(equityToMap(equity));
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("equities", results);
                response.put("count", results.size());
                response.put("source", "QuantConnect");
                response.put("cached", false);
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/quantconnect/tokenize
     * Tokenize equity data and register in Merkle tree
     */
    @POST
    @Path("/tokenize")
    public Uni<Response> tokenizeEquities(TokenizeRequest request) {
        LOGGER.info("POST /api/v12/quantconnect/tokenize");

        List<String> symbols = request != null && request.getSymbols() != null && !request.getSymbols().isEmpty()
            ? request.getSymbols()
            : DEFAULT_SYMBOLS;

        return quantConnectService.batchTokenizeEquities(symbols)
            .map(batchResult -> {
                List<Map<String, Object>> results = new ArrayList<>();
                for (TokenizationResult result : batchResult.getResults()) {
                    results.add(tokenizationResultToMap(result));
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("total", batchResult.getTotal());
                response.put("successful", batchResult.getSuccessful());
                response.put("results", results);
                response.put("merkleRoot", registry.getMerkleRoot());
                response.put("eiNodeId", "ei-node-1");
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * GET /api/v12/quantconnect/transactions/{symbol}
     * Fetch transaction feed for a symbol
     */
    @GET
    @Path("/transactions/{symbol}")
    public Uni<Response> getTransactions(
            @PathParam("symbol") String symbol,
            @QueryParam("limit") @DefaultValue("50") int limit) {

        LOGGER.info("GET /api/v12/quantconnect/transactions/{}", symbol);

        return quantConnectService.fetchTransactionFeed(symbol, limit)
            .map(transactions -> {
                List<Map<String, Object>> results = new ArrayList<>();
                for (TransactionData tx : transactions) {
                    results.add(transactionToMap(tx));
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("symbol", symbol);
                response.put("transactions", results);
                response.put("count", results.size());
                response.put("source", "QuantConnect");
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/quantconnect/tokenize/transactions
     * Tokenize transaction feed for a symbol
     */
    @POST
    @Path("/tokenize/transactions")
    public Uni<Response> tokenizeTransactions(TokenizeTransactionsRequest request) {
        LOGGER.info("POST /api/v12/quantconnect/tokenize/transactions");

        String symbol = request != null && request.getSymbol() != null ? request.getSymbol() : "AAPL";
        int limit = request != null && request.getLimit() > 0 ? request.getLimit() : 50;

        return quantConnectService.fetchTransactionFeed(symbol, limit)
            .flatMap(transactions -> {
                List<TokenizationResult> results = new ArrayList<>();

                for (TransactionData tx : transactions) {
                    TokenizationResult result = quantConnectService.tokenizeTransaction(tx)
                        .await().indefinitely();
                    results.add(result);
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("symbol", symbol);
                response.put("total", results.size());
                response.put("successful", results.stream().filter(TokenizationResult::isSuccess).count());
                response.put("results", results.stream().map(this::tokenizationResultToMap).toList());
                response.put("merkleRoot", registry.getMerkleRoot());
                response.put("eiNodeId", "ei-node-1");
                response.put("timestamp", Instant.now().toString());

                return Uni.createFrom().item(Response.ok(response).build());
            });
    }

    // ========== Registry Navigation Endpoints ==========

    /**
     * GET /api/v12/quantconnect/registry
     * Get registry overview
     */
    @GET
    @Path("/registry")
    public Response getRegistry() {
        LOGGER.info("GET /api/v12/quantconnect/registry");

        EquityTokenizationRegistry.RegistryStatistics stats = registry.getStatistics();
        EquityTokenizationRegistry.RegistryNavigation nav = registry.getNavigation();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalEquities", stats.getTotalEquities());
        response.put("totalTransactions", stats.getTotalTransactions());
        response.put("merkleRoot", stats.getMerkleRoot());
        response.put("blockNumber", stats.getBlockNumber());
        response.put("merkleTreeSize", stats.getMerkleTreeSize());
        response.put("uniqueSymbols", stats.getUniqueSymbols());
        response.put("symbolCounts", nav.getSymbolCounts());
        response.put("lastUpdate", stats.getLastUpdate().toString());
        response.put("eiNodeId", "ei-node-1");
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/stats
     * Get registry statistics
     */
    @GET
    @Path("/registry/stats")
    public Response getRegistryStats() {
        LOGGER.info("GET /api/v12/quantconnect/registry/stats");

        EquityTokenizationRegistry.RegistryStatistics stats = registry.getStatistics();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalEquities", stats.getTotalEquities());
        response.put("totalTransactions", stats.getTotalTransactions());
        response.put("merkleRoot", stats.getMerkleRoot());
        response.put("blockNumber", stats.getBlockNumber());
        response.put("merkleTreeSize", stats.getMerkleTreeSize());
        response.put("uniqueSymbols", stats.getUniqueSymbols());
        response.put("lastUpdate", stats.getLastUpdate().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/navigation
     * Get registry navigation structure
     */
    @GET
    @Path("/registry/navigation")
    public Response getRegistryNavigation() {
        LOGGER.info("GET /api/v12/quantconnect/registry/navigation");

        EquityTokenizationRegistry.RegistryNavigation nav = registry.getNavigation();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("symbolCounts", nav.getSymbolCounts());
        response.put("totalEquities", nav.getTotalEquities());
        response.put("totalTransactions", nav.getTotalTransactions());
        response.put("uniqueSymbols", nav.getUniqueSymbols());
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/equities
     * Get all tokenized equities (paginated)
     */
    @GET
    @Path("/registry/equities")
    public Response getTokenizedEquities(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        LOGGER.info("GET /api/v12/quantconnect/registry/equities?page={}&size={}", page, size);

        List<TokenizedEquity> equities = registry.getAllEquities(page, size);
        EquityTokenizationRegistry.RegistryStatistics stats = registry.getStatistics();

        List<Map<String, Object>> results = new ArrayList<>();
        for (TokenizedEquity equity : equities) {
            results.add(tokenizedEquityToMap(equity));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("equities", results);
        response.put("page", page);
        response.put("size", size);
        response.put("total", stats.getTotalEquities());
        response.put("totalPages", (int) Math.ceil((double) stats.getTotalEquities() / size));
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/transactions
     * Get all tokenized transactions (paginated)
     */
    @GET
    @Path("/registry/transactions")
    public Response getTokenizedTransactions(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        LOGGER.info("GET /api/v12/quantconnect/registry/transactions?page={}&size={}", page, size);

        List<TokenizedTransaction> transactions = registry.getAllTransactions(page, size);
        EquityTokenizationRegistry.RegistryStatistics stats = registry.getStatistics();

        List<Map<String, Object>> results = new ArrayList<>();
        for (TokenizedTransaction tx : transactions) {
            results.add(tokenizedTransactionToMap(tx));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("transactions", results);
        response.put("page", page);
        response.put("size", size);
        response.put("total", stats.getTotalTransactions());
        response.put("totalPages", (int) Math.ceil((double) stats.getTotalTransactions() / size));
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/symbol/{symbol}
     * Get all tokenized assets for a symbol
     */
    @GET
    @Path("/registry/symbol/{symbol}")
    public Response getBySymbol(@PathParam("symbol") String symbol) {
        LOGGER.info("GET /api/v12/quantconnect/registry/symbol/{}", symbol);

        List<TokenizedEquity> equities = registry.getEquitiesBySymbol(symbol);
        List<TokenizedTransaction> transactions = registry.getTransactionsBySymbol(symbol);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("symbol", symbol);
        response.put("equities", equities.stream().map(this::tokenizedEquityToMap).toList());
        response.put("transactions", transactions.stream().map(this::tokenizedTransactionToMap).toList());
        response.put("totalEquities", equities.size());
        response.put("totalTransactions", transactions.size());
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/search
     * Search registry
     */
    @GET
    @Path("/registry/search")
    public Response searchRegistry(
            @QueryParam("q") String query,
            @QueryParam("type") String type,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        LOGGER.info("GET /api/v12/quantconnect/registry/search?q={}&type={}", query, type);

        if (query == null || query.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Query parameter 'q' is required"))
                .build();
        }

        EquityTokenizationRegistry.RegistrySearchResult result = registry.search(query, type, page, size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query", query);
        response.put("type", type != null ? type : "all");
        response.put("results", result.getResults());
        response.put("total", result.getTotal());
        response.put("page", result.getPage());
        response.put("size", result.getSize());
        response.put("totalPages", result.getTotalPages());
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/verify/{tokenId}
     * Verify a token in the registry
     */
    @GET
    @Path("/registry/verify/{tokenId}")
    public Response verifyToken(@PathParam("tokenId") String tokenId) {
        LOGGER.info("GET /api/v12/quantconnect/registry/verify/{}", tokenId);

        boolean verified = registry.verifyToken(tokenId);
        Optional<String> proof = registry.getMerkleProof(tokenId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("tokenId", tokenId);
        response.put("verified", verified);
        response.put("merkleRoot", registry.getMerkleRoot());
        response.put("merkleProof", proof.orElse(null));
        response.put("timestamp", Instant.now().toString());

        if (!verified) {
            return Response.status(Response.Status.NOT_FOUND).entity(response).build();
        }

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/quantconnect/registry/token/{tokenId}
     * Get token details
     */
    @GET
    @Path("/registry/token/{tokenId}")
    public Response getToken(@PathParam("tokenId") String tokenId) {
        LOGGER.info("GET /api/v12/quantconnect/registry/token/{}", tokenId);

        // Try equity first
        Optional<TokenizedEquity> equity = registry.getEquity(tokenId);
        if (equity.isPresent()) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("type", "equity");
            response.put("token", tokenizedEquityToMap(equity.get()));
            response.put("timestamp", Instant.now().toString());
            return Response.ok(response).build();
        }

        // Try transaction
        Optional<TokenizedTransaction> transaction = registry.getTransaction(tokenId);
        if (transaction.isPresent()) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("type", "transaction");
            response.put("token", tokenizedTransactionToMap(transaction.get()));
            response.put("timestamp", Instant.now().toString());
            return Response.ok(response).build();
        }

        return Response.status(Response.Status.NOT_FOUND)
            .entity(Map.of("error", "Token not found", "tokenId", tokenId))
            .build();
    }

    // ========== Helper Methods ==========

    private Map<String, Object> equityToMap(EquityData equity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("symbol", equity.getSymbol());
        map.put("name", equity.getName());
        map.put("price", equity.getPrice());
        map.put("open", equity.getOpen());
        map.put("high", equity.getHigh());
        map.put("low", equity.getLow());
        map.put("volume", equity.getVolume());
        map.put("marketCap", equity.getMarketCap());
        map.put("change24h", equity.getChange24h());
        map.put("exchange", equity.getExchange());
        map.put("currency", equity.getCurrency());
        map.put("timestamp", equity.getTimestamp() != null ? equity.getTimestamp().toString() : null);
        return map;
    }

    private Map<String, Object> transactionToMap(TransactionData tx) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("transactionId", tx.getTransactionId());
        map.put("symbol", tx.getSymbol());
        map.put("type", tx.getType());
        map.put("quantity", tx.getQuantity());
        map.put("price", tx.getPrice());
        map.put("totalValue", tx.getTotalValue());
        map.put("exchange", tx.getExchange());
        map.put("orderId", tx.getOrderId());
        map.put("status", tx.getStatus());
        map.put("fees", tx.getFees());
        map.put("currency", tx.getCurrency());
        map.put("timestamp", tx.getTimestamp() != null ? tx.getTimestamp().toString() : null);
        return map;
    }

    private Map<String, Object> tokenizedEquityToMap(TokenizedEquity equity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("tokenId", equity.getTokenId());
        map.put("symbol", equity.getSymbol());
        map.put("name", equity.getName());
        map.put("price", equity.getPrice());
        map.put("volume", equity.getVolume());
        map.put("marketCap", equity.getMarketCap());
        map.put("change24h", equity.getChange24h());
        map.put("tokenizedAt", equity.getTokenizedAt() != null ? equity.getTokenizedAt().toString() : null);
        map.put("source", equity.getSource());
        map.put("eiNodeId", equity.getEINodeId());
        map.put("merkleRoot", equity.getMerkleRoot());
        map.put("blockHash", equity.getBlockHash());
        map.put("blockNumber", equity.getBlockNumber());
        map.put("verified", equity.isVerified());
        return map;
    }

    private Map<String, Object> tokenizedTransactionToMap(TokenizedTransaction tx) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("tokenId", tx.getTokenId());
        map.put("transactionId", tx.getTransactionId());
        map.put("symbol", tx.getSymbol());
        map.put("type", tx.getType());
        map.put("quantity", tx.getQuantity());
        map.put("price", tx.getPrice());
        map.put("totalValue", tx.getTotalValue());
        map.put("timestamp", tx.getTimestamp() != null ? tx.getTimestamp().toString() : null);
        map.put("tokenizedAt", tx.getTokenizedAt() != null ? tx.getTokenizedAt().toString() : null);
        map.put("source", tx.getSource());
        map.put("eiNodeId", tx.getEINodeId());
        map.put("merkleRoot", tx.getMerkleRoot());
        map.put("blockHash", tx.getBlockHash());
        map.put("blockNumber", tx.getBlockNumber());
        map.put("verified", tx.isVerified());
        return map;
    }

    private Map<String, Object> tokenizationResultToMap(TokenizationResult result) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", result.isSuccess());
        map.put("tokenId", result.getTokenId());
        map.put("merkleRoot", result.getMerkleRoot());
        map.put("blockHash", result.getBlockHash());
        map.put("blockNumber", result.getBlockNumber());
        map.put("eiNodeId", result.getEINodeId());
        map.put("processingTimeMs", result.getProcessingTimeMs());
        map.put("message", result.getMessage());
        if (result.getErrorCode() != null) {
            map.put("errorCode", result.getErrorCode());
        }
        return map;
    }

    // ========== External Integration (EI) Node Endpoints ==========

    /**
     * GET /api/v12/quantconnect/slimnode/status
     * Get External Integration (EI) Node data feed status
     */
    @GET
    @Path("/slimnode/status")
    public Response getEINodeStatus() {
        LOGGER.info("GET /api/v12/quantconnect/slimnode/status");

        EINodeDataFeed.DataFeedStatus status = eiNodeDataFeed.getStatus();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("eiNodeId", status.getEINodeId());
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
     * POST /api/v12/quantconnect/slimnode/start
     * Start External Integration (EI) Node data feed
     */
    @POST
    @Path("/slimnode/start")
    public Uni<Response> startEINode() {
        LOGGER.info("POST /api/v12/quantconnect/slimnode/start");

        return eiNodeDataFeed.start()
            .map(status -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("message", "External Integration (EI) Node data feed started");
                response.put("eiNodeId", status.getEINodeId());
                response.put("running", status.isRunning());
                response.put("pollIntervalSeconds", status.getPollIntervalSeconds());
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/quantconnect/slimnode/stop
     * Stop External Integration (EI) Node data feed
     */
    @POST
    @Path("/slimnode/stop")
    public Uni<Response> stopEINode() {
        LOGGER.info("POST /api/v12/quantconnect/slimnode/stop");

        return eiNodeDataFeed.stop()
            .map(status -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("message", "External Integration (EI) Node data feed stopped");
                response.put("eiNodeId", status.getEINodeId());
                response.put("running", status.isRunning());
                response.put("messagesProcessed", status.getMessagesProcessed());
                response.put("tokenizationsCompleted", status.getTokenizationsCompleted());
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/quantconnect/slimnode/process/equities
     * Manually trigger equity processing through External Integration (EI) Node
     */
    @POST
    @Path("/slimnode/process/equities")
    public Uni<Response> processEquities(EINodeProcessRequest request) {
        LOGGER.info("POST /api/v12/quantconnect/slimnode/process/equities");

        List<String> symbols = request != null && request.getSymbols() != null ? request.getSymbols() : null;

        return eiNodeDataFeed.processEquities(symbols)
            .map(result -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("eiNodeId", result.getEINodeId());
                response.put("type", result.getType());
                response.put("processed", result.getProcessed());
                response.put("tokenized", result.getTokenized());
                response.put("processingTimeMs", result.getProcessingTimeMs());
                response.put("merkleRoot", result.getMerkleRoot());
                response.put("results", result.getResults().stream().map(r -> Map.of(
                    "id", r.getId(),
                    "type", r.getType(),
                    "success", r.isSuccess(),
                    "tokenId", r.getTokenId() != null ? r.getTokenId() : "",
                    "message", r.getMessage() != null ? r.getMessage() : ""
                )).toList());
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v12/quantconnect/slimnode/process/transactions
     * Manually trigger transaction processing through External Integration (EI) Node
     */
    @POST
    @Path("/slimnode/process/transactions")
    public Uni<Response> processTransactions(EINodeTransactionRequest request) {
        LOGGER.info("POST /api/v12/quantconnect/slimnode/process/transactions");

        String symbol = request != null && request.getSymbol() != null ? request.getSymbol() : "AAPL";
        int limit = request != null && request.getLimit() > 0 ? request.getLimit() : 50;

        return eiNodeDataFeed.processTransactions(symbol, limit)
            .map(result -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("eiNodeId", result.getEINodeId());
                response.put("type", result.getType());
                response.put("processed", result.getProcessed());
                response.put("tokenized", result.getTokenized());
                response.put("processingTimeMs", result.getProcessingTimeMs());
                response.put("merkleRoot", result.getMerkleRoot());
                response.put("timestamp", Instant.now().toString());

                return Response.ok(response).build();
            });
    }

    // ========== Request DTOs ==========

    public static class FetchRequest {
        private List<String> symbols;

        public List<String> getSymbols() { return symbols; }
        public void setSymbols(List<String> symbols) { this.symbols = symbols; }
    }

    public static class TokenizeRequest {
        private List<String> symbols;

        public List<String> getSymbols() { return symbols; }
        public void setSymbols(List<String> symbols) { this.symbols = symbols; }
    }

    public static class TokenizeTransactionsRequest {
        private String symbol;
        private int limit;

        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
    }

    public static class EINodeProcessRequest {
        private List<String> symbols;

        public List<String> getSymbols() { return symbols; }
        public void setSymbols(List<String> symbols) { this.symbols = symbols; }
    }

    public static class EINodeTransactionRequest {
        private String symbol;
        private int limit;

        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
    }
}
