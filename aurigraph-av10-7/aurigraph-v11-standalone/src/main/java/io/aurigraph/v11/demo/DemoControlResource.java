package io.aurigraph.v11.demo;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * Demo Control REST API
 *
 * Provides endpoints for controlling the unified demo environment.
 *
 * Endpoints:
 * - POST /api/v12/demo/start - Start the demo
 * - POST /api/v12/demo/stop - Stop the demo
 * - GET /api/v12/demo/status - Get demo status
 * - GET /api/v12/demo/health - Demo health check
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@Path("/api/v12/demo")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DemoControlResource {

    private static final Logger LOG = Logger.getLogger(DemoControlResource.class);

    @Inject
    UnifiedDemoStartupService demoService;

    /**
     * Start the unified demo
     * POST /api/v12/demo/start
     */
    @POST
    @Path("/start")
    public Response startDemo() {
        LOG.info("Starting demo via API");

        Map<String, Object> result = demoService.startDemo();
        boolean success = (Boolean) result.getOrDefault("success", false);

        return success
            ? Response.ok(result).build()
            : Response.status(Response.Status.BAD_REQUEST).entity(result).build();
    }

    /**
     * Stop the demo
     * POST /api/v12/demo/stop
     */
    @POST
    @Path("/stop")
    public Response stopDemo() {
        LOG.info("Stopping demo via API");

        Map<String, Object> result = demoService.stopDemo();
        boolean success = (Boolean) result.getOrDefault("success", false);

        return success
            ? Response.ok(result).build()
            : Response.status(Response.Status.BAD_REQUEST).entity(result).build();
    }

    /**
     * Get demo status
     * GET /api/v12/demo/status
     */
    @GET
    @Path("/status")
    public Response getDemoStatus() {
        LOG.debug("Getting demo status");
        return Response.ok(demoService.getDemoStatus()).build();
    }

    /**
     * Demo health check
     * GET /api/v12/demo/health
     */
    @GET
    @Path("/health")
    public Response healthCheck() {
        Map<String, Object> status = demoService.getDemoStatus();
        boolean running = (Boolean) status.getOrDefault("running", false);

        return Response.ok(Map.of(
            "status", running ? "UP" : "READY",
            "demoRunning", running,
            "message", running ? "Demo is running" : "Demo is ready to start"
        )).build();
    }

    /**
     * Get demo configuration
     * GET /api/v12/demo/config
     */
    @GET
    @Path("/config")
    public Response getConfig() {
        return Response.ok(Map.of(
            "endpoints", Map.of(
                "start", "POST /api/v12/demo/start",
                "stop", "POST /api/v12/demo/stop",
                "status", "GET /api/v12/demo/status",
                "health", "GET /api/v12/demo/health"
            ),
            "streamingEndpoints", Map.of(
                "transactions", "GET /api/v12/stream/transactions (SSE)",
                "metrics", "GET /api/v12/stream/metrics (SSE)",
                "consensus", "GET /api/v12/stream/consensus (SSE)",
                "validators", "GET /api/v12/stream/validators (SSE)",
                "network", "GET /api/v12/stream/network (SSE)"
            ),
            "features", Map.of(
                "vvbOptional", "VVB verification is optional in demo mode",
                "autoScaling", "Node auto-scaling is enabled",
                "exchangeStreaming", "Binance/Coinbase data streaming",
                "documentWizard", "PDF/DOC to ActiveContract conversion"
            ),
            "wizardEndpoints", Map.of(
                "upload", "POST /api/v12/contracts/wizard/upload",
                "parties", "GET/PUT /api/v12/contracts/wizard/{sessionId}/parties",
                "terms", "GET/PUT /api/v12/contracts/wizard/{sessionId}/terms",
                "preview", "GET /api/v12/contracts/wizard/{sessionId}/preview",
                "finalize", "POST /api/v12/contracts/wizard/{sessionId}/finalize"
            ),
            "scalingEndpoints", Map.of(
                "config", "GET/PUT /api/v12/nodes/scaling/config",
                "scaleUp", "POST /api/v12/nodes/scaling/scale-up",
                "scaleDown", "POST /api/v12/nodes/scaling/scale-down",
                "nodes", "GET /api/v12/nodes/scaling/nodes",
                "history", "GET /api/v12/nodes/scaling/history"
            )
        )).build();
    }
}
