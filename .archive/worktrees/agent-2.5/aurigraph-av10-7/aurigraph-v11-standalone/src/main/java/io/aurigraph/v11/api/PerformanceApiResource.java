package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

/**
 * Performance API Resource
 *
 * Provides performance monitoring and optimization metrics endpoints.
 * Part of Enterprise Portal V4.8.0 implementation.
 *
 * This resource delegates to AIApiResource for optimization metrics
 * while providing a clean /performance namespace for the enterprise portal.
 *
 * @author Aurigraph V11 Team
 * @version 4.8.0
 */
@Path("/api/v11/performance")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Performance Monitoring", description = "Performance monitoring and AI optimization metrics")
public class PerformanceApiResource {

    private static final Logger LOG = Logger.getLogger(PerformanceApiResource.class);

    @Inject
    AIApiResource aiApiResource;

    /**
     * GET /api/v11/performance/optimization-metrics
     *
     * Returns AI optimization performance metrics for blockchain operations.
     *
     * This endpoint delegates to the AI API resource to provide optimization metrics
     * in the /performance namespace for better organization in the Enterprise Portal.
     *
     * Response includes:
     * - TPS improvement from AI optimization
     * - ML metrics (accuracy, confidence scores)
     * - Consensus optimization results
     * - Resource efficiency gains
     * - Optimization impact analysis
     * - Time-series optimization data
     * - Active optimizations list
     * - Optimization recommendations
     */
    @GET
    @Path("/optimization-metrics")
    @Operation(
        summary = "Get AI optimization metrics",
        description = "Returns comprehensive AI optimization performance metrics including TPS improvement, ML metrics, efficiency gains, and recommendations"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Optimization metrics retrieved successfully",
            content = @Content(mediaType = "application/json")
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Uni<Response> getOptimizationMetrics() {
        LOG.info("GET /api/v11/performance/optimization-metrics - delegating to AI API");

        // Delegate to AIApiResource for the actual implementation
        return aiApiResource.getOptimizationMetrics();
    }
}
