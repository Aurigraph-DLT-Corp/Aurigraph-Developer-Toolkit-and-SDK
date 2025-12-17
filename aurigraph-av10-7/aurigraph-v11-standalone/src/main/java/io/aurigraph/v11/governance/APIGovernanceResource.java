package io.aurigraph.v11.governance;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.util.*;

/**
 * API Governance REST Resource
 *
 * Provides administrative endpoints for API governance:
 * - Rate limit management
 * - Usage statistics
 * - API version info
 * - Deprecation management
 *
 * @author Governance Team
 * @version 12.0.0
 * @since AV11-545
 */
@Path("/api/v12/governance")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "API Governance", description = "API governance and rate limiting management")
public class APIGovernanceResource {

    private static final Logger LOG = Logger.getLogger(APIGovernanceResource.class);

    @Inject
    APIGovernanceService governanceService;

    /**
     * GET /api/v12/governance/summary
     *
     * Get governance summary for dashboard
     */
    @GET
    @Path("/summary")
    @Operation(summary = "Get governance summary", description = "Returns API governance summary including usage stats and rate limiting info")
    @APIResponse(responseCode = "200", description = "Governance summary")
    public Response getSummary() {
        LOG.debug("GET /api/v12/governance/summary");

        APIGovernanceService.GovernanceSummary summary = governanceService.getSummary();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalRequests", summary.totalRequests());
        response.put("successfulRequests", summary.successfulRequests());
        response.put("rateLimitedRequests", summary.rateLimitedRequests());
        response.put("successRate", String.format("%.2f%%", summary.successRate()));
        response.put("trackedEndpoints", summary.trackedEndpoints());
        response.put("activeRateLimitBuckets", summary.activeRateLimitBuckets());
        response.put("deprecatedEndpoints", summary.deprecatedEndpoints());
        response.put("apiVersions", summary.apiVersions());
        response.put("timestamp", java.time.Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/governance/usage
     *
     * Get API usage statistics
     */
    @GET
    @Path("/usage")
    @Operation(summary = "Get API usage statistics", description = "Returns detailed usage statistics for all tracked endpoints")
    @APIResponse(responseCode = "200", description = "Usage statistics")
    public Response getUsageStats(
        @QueryParam("limit") @DefaultValue("20") int limit,
        @QueryParam("sortBy") @DefaultValue("requests") String sortBy
    ) {
        LOG.debugf("GET /api/v12/governance/usage - limit: %d, sortBy: %s", limit, sortBy);

        List<APIGovernanceService.APIUsageStats> stats = governanceService.getTopEndpoints(limit);

        List<Map<String, Object>> usageList = stats.stream().map(s -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("endpoint", s.getEndpoint());
            item.put("totalRequests", s.getTotalRequests());
            item.put("successfulRequests", s.getSuccessfulRequests());
            item.put("failedRequests", s.getFailedRequests());
            item.put("rateLimitedRequests", s.getRateLimitedRequests());
            item.put("uniqueClients", s.getUniqueClients());
            item.put("firstRequest", s.getFirstRequest() != null ? s.getFirstRequest().toString() : null);
            item.put("lastRequest", s.getLastRequest() != null ? s.getLastRequest().toString() : null);
            return item;
        }).toList();

        return Response.ok(Map.of(
            "count", usageList.size(),
            "endpoints", usageList
        )).build();
    }

    /**
     * GET /api/v12/governance/usage/{endpoint}
     *
     * Get usage statistics for a specific endpoint
     */
    @GET
    @Path("/usage/{endpoint}")
    @Operation(summary = "Get usage for specific endpoint", description = "Returns usage statistics for a specific API endpoint")
    public Response getEndpointUsage(@PathParam("endpoint") String endpoint) {
        LOG.debugf("GET /api/v12/governance/usage/%s", endpoint);

        // Decode endpoint path
        String decodedEndpoint = "/" + endpoint.replace("_", "/");
        APIGovernanceService.APIUsageStats stats = governanceService.getUsageStats(decodedEndpoint);

        if (stats == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "No usage data for endpoint: " + decodedEndpoint))
                .build();
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("endpoint", stats.getEndpoint());
        response.put("totalRequests", stats.getTotalRequests());
        response.put("successfulRequests", stats.getSuccessfulRequests());
        response.put("failedRequests", stats.getFailedRequests());
        response.put("rateLimitedRequests", stats.getRateLimitedRequests());
        response.put("uniqueClients", stats.getUniqueClients());
        response.put("successRate", stats.getTotalRequests() > 0
            ? String.format("%.2f%%", stats.getSuccessfulRequests() * 100.0 / stats.getTotalRequests())
            : "100.00%");

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/governance/rate-limits
     *
     * Get rate limit configuration
     */
    @GET
    @Path("/rate-limits")
    @Operation(summary = "Get rate limit configuration", description = "Returns current rate limiting configuration")
    public Response getRateLimits() {
        LOG.debug("GET /api/v12/governance/rate-limits");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("enabled", true);
        response.put("defaultLimit", 100);
        response.put("windowSeconds", 60);
        response.put("description", "100 requests per minute per client");

        // Tier limits
        List<Map<String, Object>> tiers = List.of(
            Map.of("tier", "anonymous", "limit", 100, "window", 60),
            Map.of("tier", "authenticated", "limit", 500, "window", 60),
            Map.of("tier", "premium", "limit", 2000, "window", 60),
            Map.of("tier", "enterprise", "limit", 10000, "window", 60)
        );
        response.put("tiers", tiers);

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/governance/rate-limits/check
     *
     * Check rate limit for a client
     */
    @POST
    @Path("/rate-limits/check")
    @Operation(summary = "Check rate limit", description = "Check if a request is allowed for a client")
    public Response checkRateLimit(RateLimitCheckRequest request) {
        LOG.debugf("POST /api/v12/governance/rate-limits/check - client: %s, endpoint: %s",
            request.clientId(), request.endpoint());

        APIGovernanceService.RateLimitResult result = governanceService.checkRateLimit(
            request.clientId(), request.endpoint());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("allowed", result.allowed());
        response.put("limit", result.limit());
        response.put("remaining", result.remaining());
        response.put("resetTime", result.resetTime());
        response.put("message", result.allowed()
            ? String.format("Request allowed. %d requests remaining.", result.remaining())
            : "Rate limit exceeded. Please wait before retrying.");

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/governance/rate-limits/reset
     *
     * Reset rate limit for a client (admin only)
     */
    @POST
    @Path("/rate-limits/reset/{clientId}")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    @Operation(summary = "Reset client rate limit", description = "Reset rate limit bucket for a specific client (admin only)")
    public Response resetRateLimit(@PathParam("clientId") String clientId) {
        LOG.infof("POST /api/v12/governance/rate-limits/reset/%s", clientId);

        governanceService.resetRateLimit(clientId);

        return Response.ok(Map.of(
            "message", "Rate limit reset for client: " + clientId,
            "clientId", clientId,
            "timestamp", java.time.Instant.now().toString()
        )).build();
    }

    /**
     * GET /api/v12/governance/versions
     *
     * Get API version information
     */
    @GET
    @Path("/versions")
    @Operation(summary = "Get API versions", description = "Returns information about available API versions")
    public Response getAPIVersions() {
        LOG.debug("GET /api/v12/governance/versions");

        List<Map<String, Object>> versions = governanceService.getAllAPIVersions().stream()
            .map(v -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("version", v.version());
                item.put("semanticVersion", v.semanticVersion());
                item.put("supported", v.isSupported());
                item.put("description", v.description());
                if (v.deprecationDate() != null) {
                    item.put("deprecationDate", v.deprecationDate().toString());
                }
                return item;
            })
            .toList();

        return Response.ok(Map.of(
            "currentVersion", "v12",
            "versions", versions
        )).build();
    }

    /**
     * GET /api/v12/governance/deprecations
     *
     * Get deprecated endpoints
     */
    @GET
    @Path("/deprecations")
    @Operation(summary = "Get deprecated endpoints", description = "Returns list of deprecated API endpoints")
    public Response getDeprecations() {
        LOG.debug("GET /api/v12/governance/deprecations");

        List<Map<String, String>> deprecations = List.of(
            Map.of("endpoint", "/api/v10/*", "reason", "V10 API superseded by V11/V12", "migrateTO", "/api/v11/"),
            Map.of("endpoint", "/api/old/*", "reason", "Legacy endpoints removed", "migrateTO", "/api/v12/")
        );

        return Response.ok(Map.of(
            "count", deprecations.size(),
            "deprecations", deprecations,
            "message", "Please migrate to the recommended endpoints to avoid service disruption."
        )).build();
    }

    /**
     * GET /api/v12/governance/health
     *
     * Governance service health check
     */
    @GET
    @Path("/health")
    @Operation(summary = "Governance health check", description = "Check governance service health")
    public Response getHealth() {
        LOG.debug("GET /api/v12/governance/health");

        return Response.ok(Map.of(
            "status", "UP",
            "service", "API Governance",
            "version", "12.0.0",
            "timestamp", java.time.Instant.now().toString()
        )).build();
    }

    // DTOs

    public record RateLimitCheckRequest(
        String clientId,
        String endpoint
    ) {}
}
