package io.aurigraph.v11.dashboard;

import io.aurigraph.v11.storage.LevelDBService;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Node Transaction Dashboard Resource
 *
 * Provides unified dashboard API for viewing transactions across all node types:
 * - Business Nodes: Core transaction processing
 * - EI Nodes: External Integration and tokenized transactions
 * - Validator Nodes: Transaction validation and consensus
 *
 * Features:
 * - Real-time transaction statistics per node type
 * - Transaction history with filtering
 * - Node health and performance metrics
 * - LevelDB persistence status
 *
 * @version 12.2.0
 * @since 2025-12-19
 */
@Path("/api/v12/dashboard/nodes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@PermitAll
@Tag(name = "Node Transaction Dashboard", description = "Unified dashboard for monitoring node transactions")
public class NodeTransactionDashboardResource {

    private static final Logger LOG = Logger.getLogger(NodeTransactionDashboardResource.class);

    @Inject
    LevelDBService levelDBService;

    @ConfigProperty(name = "node.type", defaultValue = "business")
    String nodeType;

    @ConfigProperty(name = "node.id", defaultValue = "node-1")
    String nodeId;

    // In-memory transaction tracking (persisted to LevelDB)
    private static final Map<String, TransactionRecord> transactionCache = new ConcurrentHashMap<>();
    private static final AtomicLong totalTransactions = new AtomicLong(0);
    private static final AtomicLong businessTransactions = new AtomicLong(0);
    private static final AtomicLong eiTransactions = new AtomicLong(0);
    private static final AtomicLong validatorTransactions = new AtomicLong(0);

    /**
     * Get dashboard overview for all node types
     *
     * GET /api/v12/dashboard/nodes/overview
     */
    @GET
    @Path("/overview")
    @Operation(summary = "Get dashboard overview", description = "Get transaction statistics for all node types")
    public Response getDashboardOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();

        // Current node info
        overview.put("currentNode", Map.of(
            "type", nodeType,
            "id", nodeId,
            "status", "ACTIVE"
        ));

        // Transaction statistics by node type
        overview.put("transactionStats", Map.of(
            "total", totalTransactions.get(),
            "byNodeType", Map.of(
                "business", businessTransactions.get(),
                "ei", eiTransactions.get(),
                "validator", validatorTransactions.get()
            )
        ));

        // Node counts (would be fetched from cluster in production)
        overview.put("nodeStatus", Map.of(
            "business", Map.of("active", 3, "total", 3),
            "ei", Map.of("active", 3, "total", 3),
            "validator", Map.of("active", 1, "total", 1)
        ));

        // LevelDB status
        try {
            var stats = levelDBService.getStats().await().indefinitely();
            overview.put("levelDbStatus", Map.of(
                "status", "ACTIVE",
                "readCount", stats.readCount(),
                "writeCount", stats.writeCount(),
                "batchCount", stats.batchCount(),
                "path", stats.dataPath()
            ));
        } catch (Exception e) {
            overview.put("levelDbStatus", Map.of(
                "status", "ERROR",
                "error", e.getMessage()
            ));
        }

        overview.put("timestamp", Instant.now().toString());

        return Response.ok(overview).build();
    }

    /**
     * Get transactions by node type
     *
     * GET /api/v12/dashboard/nodes/transactions/{nodeType}
     */
    @GET
    @Path("/transactions/{nodeType}")
    @Operation(summary = "Get transactions by node type", description = "List transactions for a specific node type")
    public Response getTransactionsByNodeType(
            @PathParam("nodeType") String targetNodeType,
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset,
            @QueryParam("status") String status) {

        List<Map<String, Object>> transactions = transactionCache.values().stream()
            .filter(tx -> targetNodeType.equalsIgnoreCase(tx.nodeType))
            .filter(tx -> status == null || status.equalsIgnoreCase(tx.status))
            .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
            .skip(offset)
            .limit(limit)
            .map(TransactionRecord::toMap)
            .toList();

        return Response.ok(Map.of(
            "success", true,
            "nodeType", targetNodeType,
            "transactions", transactions,
            "count", transactions.size(),
            "total", transactionCache.values().stream()
                .filter(tx -> targetNodeType.equalsIgnoreCase(tx.nodeType))
                .count()
        )).build();
    }

    /**
     * Record a transaction (called by transaction processing services)
     *
     * POST /api/v12/dashboard/nodes/transactions/record
     */
    @POST
    @Path("/transactions/record")
    @Operation(summary = "Record transaction", description = "Record a transaction for dashboard tracking")
    public Response recordTransaction(TransactionRecordRequest request) {
        try {
            String txId = request.transactionId != null ? request.transactionId :
                "TX-" + UUID.randomUUID().toString().substring(0, 12);

            TransactionRecord record = new TransactionRecord(
                txId,
                request.nodeType != null ? request.nodeType : nodeType,
                request.nodeId != null ? request.nodeId : nodeId,
                request.transactionType,
                request.status != null ? request.status : "PENDING",
                request.amount,
                request.metadata
            );

            transactionCache.put(txId, record);
            totalTransactions.incrementAndGet();

            // Increment node-type specific counter
            switch (record.nodeType.toLowerCase()) {
                case "business" -> businessTransactions.incrementAndGet();
                case "ei" -> eiTransactions.incrementAndGet();
                case "validator" -> validatorTransactions.incrementAndGet();
            }

            // Persist to LevelDB
            persistTransaction(record);

            LOG.debugf("Recorded transaction %s on %s node %s", txId, record.nodeType, record.nodeId);

            return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "transactionId", txId,
                    "nodeType", record.nodeType,
                    "timestamp", record.timestamp.toString()
                ))
                .build();

        } catch (Exception e) {
            LOG.errorf("Failed to record transaction: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get transaction by ID
     *
     * GET /api/v12/dashboard/nodes/transactions/detail/{transactionId}
     */
    @GET
    @Path("/transactions/detail/{transactionId}")
    @Operation(summary = "Get transaction detail", description = "Get detailed transaction information")
    public Response getTransactionDetail(@PathParam("transactionId") String transactionId) {
        TransactionRecord record = transactionCache.get(transactionId);

        if (record == null) {
            // Try to load from LevelDB
            record = loadTransaction(transactionId);
        }

        if (record == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("success", false, "error", "Transaction not found: " + transactionId))
                .build();
        }

        return Response.ok(Map.of(
            "success", true,
            "transaction", record.toMap()
        )).build();
    }

    /**
     * Get EI node tokenized transactions
     *
     * GET /api/v12/dashboard/nodes/ei/tokenized
     */
    @GET
    @Path("/ei/tokenized")
    @Operation(summary = "Get EI tokenized transactions", description = "List tokenized transactions from EI nodes")
    public Response getEiTokenizedTransactions(
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {

        List<Map<String, Object>> transactions = transactionCache.values().stream()
            .filter(tx -> "ei".equalsIgnoreCase(tx.nodeType))
            .filter(tx -> "TOKENIZATION".equalsIgnoreCase(tx.transactionType) ||
                         "TOKEN_TRANSFER".equalsIgnoreCase(tx.transactionType))
            .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
            .skip(offset)
            .limit(limit)
            .map(TransactionRecord::toMap)
            .toList();

        return Response.ok(Map.of(
            "success", true,
            "nodeType", "ei",
            "transactionType", "tokenized",
            "transactions", transactions,
            "count", transactions.size()
        )).build();
    }

    /**
     * Get validator consensus transactions
     *
     * GET /api/v12/dashboard/nodes/validator/consensus
     */
    @GET
    @Path("/validator/consensus")
    @Operation(summary = "Get validator consensus", description = "List consensus transactions from validator nodes")
    public Response getValidatorConsensusTransactions(
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {

        List<Map<String, Object>> transactions = transactionCache.values().stream()
            .filter(tx -> "validator".equalsIgnoreCase(tx.nodeType))
            .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
            .skip(offset)
            .limit(limit)
            .map(TransactionRecord::toMap)
            .toList();

        return Response.ok(Map.of(
            "success", true,
            "nodeType", "validator",
            "transactionType", "consensus",
            "transactions", transactions,
            "count", transactions.size()
        )).build();
    }

    /**
     * Get node performance metrics
     *
     * GET /api/v12/dashboard/nodes/metrics
     */
    @GET
    @Path("/metrics")
    @Operation(summary = "Get node metrics", description = "Get performance metrics for all node types")
    public Response getNodeMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        // Calculate TPS per node type (simplified - would use time windows in production)
        long now = System.currentTimeMillis();
        long windowStart = now - 60000; // Last minute

        long businessTps = transactionCache.values().stream()
            .filter(tx -> "business".equalsIgnoreCase(tx.nodeType))
            .filter(tx -> tx.timestamp.toEpochMilli() > windowStart)
            .count();

        long eiTps = transactionCache.values().stream()
            .filter(tx -> "ei".equalsIgnoreCase(tx.nodeType))
            .filter(tx -> tx.timestamp.toEpochMilli() > windowStart)
            .count();

        long validatorTps = transactionCache.values().stream()
            .filter(tx -> "validator".equalsIgnoreCase(tx.nodeType))
            .filter(tx -> tx.timestamp.toEpochMilli() > windowStart)
            .count();

        metrics.put("tps", Map.of(
            "business", businessTps / 60.0,
            "ei", eiTps / 60.0,
            "validator", validatorTps / 60.0,
            "total", (businessTps + eiTps + validatorTps) / 60.0
        ));

        metrics.put("totals", Map.of(
            "business", businessTransactions.get(),
            "ei", eiTransactions.get(),
            "validator", validatorTransactions.get(),
            "all", totalTransactions.get()
        ));

        metrics.put("currentNode", Map.of(
            "type", nodeType,
            "id", nodeId
        ));

        metrics.put("timestamp", Instant.now().toString());

        return Response.ok(metrics).build();
    }

    /**
     * Health check
     *
     * GET /api/v12/dashboard/nodes/health
     */
    @GET
    @Path("/health")
    @Operation(summary = "Dashboard health", description = "Check dashboard service health")
    public Response health() {
        return Response.ok(Map.of(
            "status", "UP",
            "service", "Node Transaction Dashboard",
            "version", "12.2.0",
            "nodeType", nodeType,
            "nodeId", nodeId,
            "transactionsCached", transactionCache.size(),
            "timestamp", Instant.now().toString()
        )).build();
    }

    // ==================== Persistence Methods ====================

    private void persistTransaction(TransactionRecord record) {
        try {
            String key = "dashboard:tx:" + record.transactionId;
            String value = String.format(
                "%s|%s|%s|%s|%s|%s|%d",
                record.transactionId,
                record.nodeType,
                record.nodeId,
                record.transactionType,
                record.status,
                record.timestamp.toString(),
                record.amount != null ? record.amount : 0
            );
            levelDBService.put(key, value).await().indefinitely();
        } catch (Exception e) {
            LOG.warnf("Failed to persist transaction %s (non-fatal): %s",
                record.transactionId, e.getMessage());
        }
    }

    private TransactionRecord loadTransaction(String transactionId) {
        try {
            String key = "dashboard:tx:" + transactionId;
            String value = levelDBService.get(key).await().indefinitely();
            if (value != null) {
                String[] parts = value.split("\\|");
                if (parts.length >= 6) {
                    return new TransactionRecord(
                        parts[0], // transactionId
                        parts[1], // nodeType
                        parts[2], // nodeId
                        parts[3], // transactionType
                        parts[4], // status
                        parts.length > 6 ? Long.parseLong(parts[6]) : null,
                        null
                    );
                }
            }
        } catch (Exception e) {
            LOG.warnf("Failed to load transaction %s: %s", transactionId, e.getMessage());
        }
        return null;
    }

    // ==================== Data Classes ====================

    public static class TransactionRecordRequest {
        public String transactionId;
        public String nodeType;
        public String nodeId;
        public String transactionType;
        public String status;
        public Long amount;
        public Map<String, Object> metadata;
    }

    public static class TransactionRecord {
        public final String transactionId;
        public final String nodeType;
        public final String nodeId;
        public final String transactionType;
        public final String status;
        public final Long amount;
        public final Map<String, Object> metadata;
        public final Instant timestamp;

        public TransactionRecord(String transactionId, String nodeType, String nodeId,
                                 String transactionType, String status, Long amount,
                                 Map<String, Object> metadata) {
            this.transactionId = transactionId;
            this.nodeType = nodeType;
            this.nodeId = nodeId;
            this.transactionType = transactionType;
            this.status = status;
            this.amount = amount;
            this.metadata = metadata != null ? metadata : new HashMap<>();
            this.timestamp = Instant.now();
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("transactionId", transactionId);
            map.put("nodeType", nodeType);
            map.put("nodeId", nodeId);
            map.put("transactionType", transactionType);
            map.put("status", status);
            map.put("amount", amount);
            map.put("metadata", metadata);
            map.put("timestamp", timestamp.toString());
            return map;
        }
    }
}
