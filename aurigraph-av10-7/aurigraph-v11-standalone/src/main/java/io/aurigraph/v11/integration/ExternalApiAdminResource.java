package io.aurigraph.v11.integration;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * External API Admin Resource
 *
 * REST API for managing external API integrations from admin settings.
 * Provides endpoints to enable/disable, configure, and monitor all integrations.
 *
 * Features:
 * - List all integrations with status
 * - Enable/disable individual integrations
 * - Update configuration
 * - Health check endpoints
 * - Metrics aggregation
 *
 * @version 1.0.0 (Dec 8, 2025)
 */
@Path("/api/v11/admin/integrations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExternalApiAdminResource {

    private static final Logger LOG = Logger.getLogger(ExternalApiAdminResource.class);

    @Inject
    ExternalApiRegistry registry;

    // ==========================================================================
    // Integration Discovery & Status
    // ==========================================================================

    /**
     * List all registered integrations
     */
    @GET
    public Response listIntegrations() {
        List<IntegrationDto> integrations = registry.getIntegrationInfoList().stream()
            .map(i -> new IntegrationDto(
                i.id(),
                i.displayName(),
                i.category(),
                i.enabled(),
                i.apiUrl(),
                i.messagesReceived(),
                i.errorsCount()
            ))
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "integrations", integrations,
            "summary", registry.getSummary()
        )).build();
    }

    /**
     * Get integration by ID
     */
    @GET
    @Path("/{integrationId}")
    public Response getIntegration(@PathParam("integrationId") String integrationId) {
        return registry.getIntegration(integrationId)
            .map(integration -> {
                IntegrationDetailDto detail = new IntegrationDetailDto(
                    integration.getIntegrationId(),
                    integration.getDisplayName(),
                    integration.getCategory(),
                    integration.isEnabled(),
                    integration.getConfig(),
                    integration.getMetrics()
                );
                return Response.ok(detail).build();
            })
            .orElse(Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Integration not found: " + integrationId))
                .build());
    }

    /**
     * Get integrations by category
     */
    @GET
    @Path("/category/{category}")
    public Response getIntegrationsByCategory(@PathParam("category") String category) {
        List<IntegrationDto> integrations = registry.getIntegrationsByCategory(category).stream()
            .map(i -> new IntegrationDto(
                i.getIntegrationId(),
                i.getDisplayName(),
                i.getCategory(),
                i.isEnabled(),
                i.getConfig().apiUrl(),
                i.getMetrics().messagesReceived(),
                i.getMetrics().errorsCount()
            ))
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "category", category,
            "integrations", integrations,
            "count", integrations.size()
        )).build();
    }

    // ==========================================================================
    // Enable/Disable Integrations
    // ==========================================================================

    /**
     * Enable an integration
     */
    @POST
    @Path("/{integrationId}/enable")
    public Uni<Response> enableIntegration(@PathParam("integrationId") String integrationId) {
        return registry.getIntegration(integrationId)
            .map(integration -> integration.setEnabled(true)
                .chain(() -> integration.start())
                .map(success -> {
                    LOG.infof("Integration %s enabled: %s", integrationId, success);
                    return Response.ok(Map.of(
                        "integrationId", integrationId,
                        "enabled", true,
                        "success", success
                    )).build();
                })
            )
            .orElse(Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Integration not found: " + integrationId))
                    .build()
            ));
    }

    /**
     * Disable an integration
     */
    @POST
    @Path("/{integrationId}/disable")
    public Uni<Response> disableIntegration(@PathParam("integrationId") String integrationId) {
        return registry.getIntegration(integrationId)
            .map(integration -> integration.stop()
                .chain(() -> integration.setEnabled(false))
                .map(success -> {
                    LOG.infof("Integration %s disabled: %s", integrationId, success);
                    return Response.ok(Map.of(
                        "integrationId", integrationId,
                        "enabled", false,
                        "success", success
                    )).build();
                })
            )
            .orElse(Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Integration not found: " + integrationId))
                    .build()
            ));
    }

    /**
     * Bulk enable/disable integrations
     */
    @POST
    @Path("/bulk")
    public Uni<Response> bulkUpdateIntegrations(BulkUpdateRequest request) {
        var results = new java.util.concurrent.ConcurrentHashMap<String, Boolean>();

        return Uni.combine().all().unis(
            request.integrationIds().stream()
                .map(id -> registry.getIntegration(id)
                    .map(integration -> {
                        if (request.enable()) {
                            return integration.setEnabled(true)
                                .chain(() -> integration.start())
                                .onItem().invoke(success -> results.put(id, success));
                        } else {
                            return integration.stop()
                                .chain(() -> integration.setEnabled(false))
                                .onItem().invoke(success -> results.put(id, success));
                        }
                    })
                    .orElse(Uni.createFrom().item(() -> {
                        results.put(id, false);
                        return false;
                    }))
                )
                .collect(Collectors.toList())
        ).with(unis -> {
            return Response.ok(Map.of(
                "action", request.enable() ? "enable" : "disable",
                "results", results
            )).build();
        });
    }

    // ==========================================================================
    // Configuration Management
    // ==========================================================================

    /**
     * Update integration configuration
     */
    @PUT
    @Path("/{integrationId}/config")
    public Uni<Response> updateConfig(
            @PathParam("integrationId") String integrationId,
            ConfigUpdateRequest request) {

        return registry.getIntegration(integrationId)
            .map(integration -> {
                ExternalApiIntegration.IntegrationConfig newConfig =
                    new ExternalApiIntegration.IntegrationConfig(
                        integrationId,
                        request.enabled() != null ? request.enabled() : integration.isEnabled(),
                        request.apiUrl() != null ? request.apiUrl() : integration.getConfig().apiUrl(),
                        request.apiKey() != null ? request.apiKey() : integration.getConfig().apiKey(),
                        request.apiSecret() != null ? request.apiSecret() : integration.getConfig().apiSecret(),
                        request.pollIntervalMs() != null ? request.pollIntervalMs() : integration.getConfig().pollIntervalMs(),
                        request.maxRetryAttempts() != null ? request.maxRetryAttempts() : integration.getConfig().maxRetryAttempts(),
                        request.timeoutSeconds() != null ? request.timeoutSeconds() : integration.getConfig().timeoutSeconds(),
                        request.customSettings() != null ? request.customSettings() : integration.getConfig().customSettings()
                    );

                return integration.updateConfig(newConfig)
                    .map(success -> Response.ok(Map.of(
                        "integrationId", integrationId,
                        "configUpdated", success,
                        "newConfig", newConfig
                    )).build());
            })
            .orElse(Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Integration not found: " + integrationId))
                    .build()
            ));
    }

    // ==========================================================================
    // Health & Metrics
    // ==========================================================================

    /**
     * Get health status for all integrations
     */
    @GET
    @Path("/health")
    public Response getHealthStatus() {
        Map<String, ExternalApiIntegration.HealthStatus> healthMap = registry.getAllHealthStatus();

        long healthyCount = healthMap.values().stream()
            .filter(ExternalApiIntegration.HealthStatus::isHealthy)
            .count();

        return Response.ok(Map.of(
            "status", healthyCount == healthMap.size() ? "ALL_HEALTHY" : "DEGRADED",
            "healthy", healthyCount,
            "total", healthMap.size(),
            "integrations", healthMap
        )).build();
    }

    /**
     * Get health for specific integration
     */
    @GET
    @Path("/{integrationId}/health")
    public Uni<Response> getIntegrationHealth(@PathParam("integrationId") String integrationId) {
        return registry.getIntegration(integrationId)
            .map(integration -> integration.checkHealth()
                .map(health -> Response.ok(Map.of(
                    "integrationId", integrationId,
                    "health", health
                )).build())
            )
            .orElse(Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Integration not found: " + integrationId))
                    .build()
            ));
    }

    /**
     * Get aggregated metrics for all integrations
     */
    @GET
    @Path("/metrics")
    public Response getAggregatedMetrics() {
        List<ExternalApiIntegration> integrations = registry.getAllIntegrations();

        long totalMessages = integrations.stream()
            .mapToLong(i -> i.getMetrics().messagesReceived())
            .sum();

        long totalErrors = integrations.stream()
            .mapToLong(i -> i.getMetrics().errorsCount())
            .sum();

        long totalHttpSuccess = integrations.stream()
            .mapToLong(i -> i.getMetrics().httpRequestsSuccess())
            .sum();

        long totalHttpFailed = integrations.stream()
            .mapToLong(i -> i.getMetrics().httpRequestsFailed())
            .sum();

        Map<String, ExternalApiIntegration.IntegrationMetrics> perIntegration = integrations.stream()
            .collect(Collectors.toMap(
                ExternalApiIntegration::getIntegrationId,
                ExternalApiIntegration::getMetrics
            ));

        return Response.ok(Map.of(
            "aggregate", Map.of(
                "totalMessagesReceived", totalMessages,
                "totalErrors", totalErrors,
                "totalHttpRequestsSuccess", totalHttpSuccess,
                "totalHttpRequestsFailed", totalHttpFailed,
                "successRate", totalHttpSuccess + totalHttpFailed > 0
                    ? (double) totalHttpSuccess / (totalHttpSuccess + totalHttpFailed) * 100
                    : 100.0
            ),
            "perIntegration", perIntegration
        )).build();
    }

    // ==========================================================================
    // DTOs
    // ==========================================================================

    public record IntegrationDto(
        String id,
        String displayName,
        String category,
        boolean enabled,
        String apiUrl,
        long messagesReceived,
        long errorsCount
    ) {}

    public record IntegrationDetailDto(
        String id,
        String displayName,
        String category,
        boolean enabled,
        ExternalApiIntegration.IntegrationConfig config,
        ExternalApiIntegration.IntegrationMetrics metrics
    ) {}

    public record BulkUpdateRequest(
        List<String> integrationIds,
        boolean enable
    ) {}

    public record ConfigUpdateRequest(
        Boolean enabled,
        String apiUrl,
        String apiKey,
        String apiSecret,
        Long pollIntervalMs,
        Integer maxRetryAttempts,
        Integer timeoutSeconds,
        Map<String, String> customSettings
    ) {}
}
