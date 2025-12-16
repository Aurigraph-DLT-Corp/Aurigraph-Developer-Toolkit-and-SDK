package io.aurigraph.v11.api;

import io.aurigraph.v11.websocket.RealTimeUpdateService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * REST API for testing WebSocket broadcasting functionality
 *
 * This resource provides endpoints to trigger WebSocket broadcasts
 * for testing and demonstration purposes.
 *
 * Endpoints:
 * - POST /api/v11/websocket/test/transaction - Broadcast a test transaction
 * - POST /api/v11/websocket/test/validator - Broadcast a test validator status
 * - POST /api/v11/websocket/test/metrics - Broadcast test metrics
 * - GET  /api/v11/websocket/test/status - Get WebSocket connection status
 *
 * @author J4C Backend Agent
 * @version V12.0.0
 * @since December 2025
 */
@Path("/api/v11/websocket/test")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WebSocketTestResource {

    private static final Logger LOG = Logger.getLogger(WebSocketTestResource.class);

    @Inject
    RealTimeUpdateService realTimeUpdateService;

    /**
     * Broadcast a sample transaction
     *
     * POST /api/v11/websocket/test/transaction
     *
     * @return Success response
     */
    @POST
    @Path("/transaction")
    public Response broadcastSampleTransaction() {
        LOG.info("Broadcasting sample transaction via WebSocket");
        realTimeUpdateService.broadcastSampleTransaction();

        return Response.ok(Map.of(
            "status", "success",
            "message", "Sample transaction broadcasted to all connected clients",
            "endpoint", "/ws/transactions"
        )).build();
    }

    /**
     * Broadcast a custom transaction
     *
     * POST /api/v11/websocket/test/transaction/custom
     *
     * Request body:
     * {
     *   "txHash": "0x123...",
     *   "from": "0xabc...",
     *   "to": "0xdef...",
     *   "value": "1000000000000000000",
     *   "status": "CONFIRMED",
     *   "gasUsed": 21000
     * }
     *
     * @param request Transaction data
     * @return Success response
     */
    @POST
    @Path("/transaction/custom")
    public Response broadcastCustomTransaction(Map<String, Object> request) {
        String txHash = (String) request.getOrDefault("txHash", "0x0000000000000000000000000000000000000000000000000000000000000000");
        String from = (String) request.getOrDefault("from", "0x0000000000000000");
        String to = (String) request.getOrDefault("to", "0x0000000000000000");
        String value = (String) request.getOrDefault("value", "0");
        String status = (String) request.getOrDefault("status", "PENDING");
        long gasUsed = ((Number) request.getOrDefault("gasUsed", 21000)).longValue();

        LOG.infof("Broadcasting custom transaction: %s", txHash);
        realTimeUpdateService.broadcastTransaction(txHash, from, to, value, status, gasUsed);

        return Response.ok(Map.of(
            "status", "success",
            "message", "Custom transaction broadcasted",
            "txHash", txHash
        )).build();
    }

    /**
     * Broadcast a sample validator status
     *
     * POST /api/v11/websocket/test/validator
     *
     * @return Success response
     */
    @POST
    @Path("/validator")
    public Response broadcastSampleValidator() {
        LOG.info("Broadcasting sample validator status via WebSocket");
        realTimeUpdateService.broadcastSampleValidator();

        return Response.ok(Map.of(
            "status", "success",
            "message", "Sample validator status broadcasted to all connected clients",
            "endpoint", "/ws/validators"
        )).build();
    }

    /**
     * Broadcast a custom validator status
     *
     * POST /api/v11/websocket/test/validator/custom
     *
     * Request body:
     * {
     *   "validator": "0xvalidator123",
     *   "status": "ACTIVE",
     *   "votingPower": 1000000,
     *   "uptime": 99.95,
     *   "lastBlockProposed": 12345
     * }
     *
     * @param request Validator data
     * @return Success response
     */
    @POST
    @Path("/validator/custom")
    public Response broadcastCustomValidator(Map<String, Object> request) {
        String validator = (String) request.getOrDefault("validator", "0x0000000000000000");
        String status = (String) request.getOrDefault("status", "ACTIVE");
        long votingPower = ((Number) request.getOrDefault("votingPower", 1000000)).longValue();
        double uptime = ((Number) request.getOrDefault("uptime", 99.95)).doubleValue();
        long lastBlockProposed = ((Number) request.getOrDefault("lastBlockProposed", 0)).longValue();

        LOG.infof("Broadcasting custom validator: %s", validator);
        realTimeUpdateService.broadcastValidatorStatus(validator, status, votingPower, uptime, lastBlockProposed);

        return Response.ok(Map.of(
            "status", "success",
            "message", "Custom validator status broadcasted",
            "validator", validator
        )).build();
    }

    /**
     * Broadcast sample metrics
     *
     * POST /api/v11/websocket/test/metrics
     *
     * @return Success response
     */
    @POST
    @Path("/metrics")
    public Response broadcastSampleMetrics() {
        LOG.info("Broadcasting sample metrics via WebSocket");
        realTimeUpdateService.broadcastSampleMetrics();

        return Response.ok(Map.of(
            "status", "success",
            "message", "Sample metrics broadcasted to all connected clients",
            "endpoint", "/ws/metrics"
        )).build();
    }

    /**
     * Broadcast custom metrics
     *
     * POST /api/v11/websocket/test/metrics/custom
     *
     * Request body:
     * {
     *   "tps": 1500000,
     *   "cpu": 45.5,
     *   "memory": 2048,
     *   "connections": 256,
     *   "errorRate": 0.001
     * }
     *
     * @param request Metrics data
     * @return Success response
     */
    @POST
    @Path("/metrics/custom")
    public Response broadcastCustomMetrics(Map<String, Object> request) {
        long tps = ((Number) request.getOrDefault("tps", 1000000)).longValue();
        double cpu = ((Number) request.getOrDefault("cpu", 45.0)).doubleValue();
        long memory = ((Number) request.getOrDefault("memory", 2048)).longValue();
        int connections = ((Number) request.getOrDefault("connections", 256)).intValue();
        double errorRate = ((Number) request.getOrDefault("errorRate", 0.001)).doubleValue();

        LOG.infof("Broadcasting custom metrics: TPS=%d", tps);
        realTimeUpdateService.broadcastMetrics(tps, cpu, memory, connections, errorRate);

        return Response.ok(Map.of(
            "status", "success",
            "message", "Custom metrics broadcasted"
        )).build();
    }

    /**
     * Get WebSocket connection status
     *
     * GET /api/v11/websocket/test/status
     *
     * @return Connection statistics
     */
    @GET
    @Path("/status")
    public Response getWebSocketStatus() {
        int totalConnections = realTimeUpdateService.getTotalConnections();
        boolean hasConnections = realTimeUpdateService.hasActiveConnections();

        return Response.ok(Map.of(
            "status", "active",
            "totalConnections", totalConnections,
            "hasActiveConnections", hasConnections,
            "endpoints", Map.of(
                "transactions", "/ws/transactions",
                "validators", "/ws/validators",
                "metrics", "/ws/metrics",
                "consensus", "/ws/consensus",
                "network", "/ws/network",
                "channels", "/ws/channels"
            ),
            "message", hasConnections
                ? String.format("%d WebSocket client(s) connected", totalConnections)
                : "No WebSocket clients connected"
        )).build();
    }

    /**
     * Broadcast to all channels (comprehensive test)
     *
     * POST /api/v11/websocket/test/all
     *
     * @return Success response
     */
    @POST
    @Path("/all")
    public Response broadcastToAllChannels() {
        LOG.info("Broadcasting to all WebSocket channels");

        realTimeUpdateService.broadcastSampleTransaction();
        realTimeUpdateService.broadcastSampleValidator();
        realTimeUpdateService.broadcastSampleMetrics();

        return Response.ok(Map.of(
            "status", "success",
            "message", "Sample data broadcasted to all channels",
            "channels", 3,
            "totalConnections", realTimeUpdateService.getTotalConnections()
        )).build();
    }
}
