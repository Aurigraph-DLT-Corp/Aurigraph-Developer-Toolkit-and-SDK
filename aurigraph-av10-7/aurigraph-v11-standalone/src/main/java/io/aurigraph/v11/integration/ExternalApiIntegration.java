package io.aurigraph.v11.integration;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;

import java.util.Map;

/**
 * External API Integration Interface
 *
 * Base interface for all external API integrations (crypto exchanges, QuantConnect, etc.)
 * Provides a unified contract for admin-configurable API connections.
 *
 * Features:
 * - Standardized enable/disable via admin settings
 * - Unified health check and metrics
 * - HTTP/2 + gRPC streaming support
 * - Credential management
 *
 * @version 1.0.0 (Dec 8, 2025)
 */
public interface ExternalApiIntegration {

    /**
     * Get the unique identifier for this integration
     */
    String getIntegrationId();

    /**
     * Get the display name for this integration
     */
    String getDisplayName();

    /**
     * Get the integration category (e.g., "crypto-exchange", "trading-platform", "data-provider")
     */
    String getCategory();

    /**
     * Check if the integration is enabled
     */
    boolean isEnabled();

    /**
     * Enable or disable the integration
     */
    Uni<Boolean> setEnabled(boolean enabled);

    /**
     * Check if the integration is healthy and connected
     */
    Uni<HealthStatus> checkHealth();

    /**
     * Get current configuration
     */
    IntegrationConfig getConfig();

    /**
     * Update configuration
     */
    Uni<Boolean> updateConfig(IntegrationConfig config);

    /**
     * Get integration metrics
     */
    IntegrationMetrics getMetrics();

    /**
     * Start the integration (connect, begin polling, etc.)
     */
    Uni<Boolean> start();

    /**
     * Stop the integration (disconnect, stop polling, etc.)
     */
    Uni<Boolean> stop();

    /**
     * Health status record
     */
    record HealthStatus(
        boolean isHealthy,
        String status,
        long lastCheckTime,
        String errorMessage,
        Map<String, Object> details
    ) {
        public static HealthStatus healthy() {
            return new HealthStatus(true, "HEALTHY", System.currentTimeMillis(), null, Map.of());
        }

        public static HealthStatus unhealthy(String error) {
            return new HealthStatus(false, "UNHEALTHY", System.currentTimeMillis(), error, Map.of());
        }

        public static HealthStatus disabled() {
            return new HealthStatus(false, "DISABLED", System.currentTimeMillis(), null, Map.of());
        }
    }

    /**
     * Integration configuration
     */
    record IntegrationConfig(
        String integrationId,
        boolean enabled,
        String apiUrl,
        String apiKey,
        String apiSecret,
        long pollIntervalMs,
        int maxRetryAttempts,
        int timeoutSeconds,
        Map<String, String> customSettings
    ) {
        public static IntegrationConfig withDefaults(String id, String apiUrl) {
            return new IntegrationConfig(
                id,
                true,
                apiUrl,
                "",
                "",
                5000,
                3,
                30,
                Map.of()
            );
        }
    }

    /**
     * Integration metrics
     */
    record IntegrationMetrics(
        String integrationId,
        long messagesReceived,
        long messagesProcessed,
        long errorsCount,
        long httpRequestsSuccess,
        long httpRequestsFailed,
        long uptimeSeconds,
        double avgLatencyMs,
        Map<String, Object> customMetrics
    ) {}
}
