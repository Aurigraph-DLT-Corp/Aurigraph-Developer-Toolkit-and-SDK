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

    /**
     * GET /api/v11/performance/benchmark
     *
     * Returns current performance configuration and benchmark metrics.
     * V12 Priority 5: Performance Optimization - Target 2M+ TPS
     *
     * Response includes:
     * - Version and target TPS
     * - Current TPS baseline
     * - ML optimization settings
     * - Consensus parameters
     * - List of applied optimizations
     * - Expected improvement
     */
    @GET
    @Path("/benchmark")
    @Operation(
        summary = "Get performance benchmark",
        description = "Returns current performance configuration and benchmark metrics for V12 optimization"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Performance benchmark retrieved successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceBenchmark.class))
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Response getPerformanceBenchmark() {
        LOG.info("GET /api/v11/performance/benchmark");

        try {
            PerformanceBenchmark benchmark = new PerformanceBenchmark();
            benchmark.version = "V12.0.0";
            benchmark.targetTps = 2000000L;
            benchmark.currentTpsBaseline = 776000L;
            benchmark.mlOptimizationEnabled = true;
            benchmark.mlBatchThreshold = 10;
            benchmark.virtualThreadsEnabled = true;
            benchmark.consensusBatchSize = 175000;
            benchmark.consensusPipelineDepth = 90;
            benchmark.consensusParallelThreads = 1152;
            benchmark.replicationParallelism = 32;
            benchmark.optimizationsApplied = java.util.Arrays.asList(
                "ML batch threshold lowered (50 -> 10)",
                "Virtual threads enabled for consensus",
                "Replication parallelism increased (16 -> 32)",
                "Election timeout optimized (50-100ms)",
                "Adaptive heartbeat enabled"
            );
            benchmark.expectedImprovement = "+158% (776K -> 2M+ TPS)";
            benchmark.timestamp = java.time.Instant.now().toString();

            return Response.ok(new BenchmarkResponse(200, "Performance benchmark retrieved", benchmark)).build();
        } catch (Exception e) {
            LOG.error("Failed to get performance benchmark", e);
            return Response.status(500).entity(new ErrorResponse(500, "Failed to retrieve performance benchmark: " + e.getMessage())).build();
        }
    }

    // DTO classes for benchmark endpoint
    public static class PerformanceBenchmark {
        public String version;
        public long targetTps;
        public long currentTpsBaseline;
        public boolean mlOptimizationEnabled;
        public int mlBatchThreshold;
        public boolean virtualThreadsEnabled;
        public int consensusBatchSize;
        public int consensusPipelineDepth;
        public int consensusParallelThreads;
        public int replicationParallelism;
        public java.util.List<String> optimizationsApplied;
        public String expectedImprovement;
        public String timestamp;
    }

    public static class BenchmarkResponse {
        public int status;
        public String message;
        public PerformanceBenchmark data;
        public String timestamp;

        public BenchmarkResponse(int status, String message, PerformanceBenchmark data) {
            this.status = status;
            this.message = message;
            this.data = data;
            this.timestamp = java.time.Instant.now().toString();
        }
    }

    public static class ErrorResponse {
        public int status;
        public String message;
        public String timestamp;

        public ErrorResponse(int status, String message) {
            this.status = status;
            this.message = message;
            this.timestamp = java.time.Instant.now().toString();
        }
    }
}
