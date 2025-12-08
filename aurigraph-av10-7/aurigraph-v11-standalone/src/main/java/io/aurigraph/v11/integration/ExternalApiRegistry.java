package io.aurigraph.v11.integration;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * External API Registry
 *
 * Central registry for all external API integrations.
 * Provides discovery, management, and admin control for all integrations.
 *
 * Features:
 * - Auto-discovery of all ExternalApiIntegration implementations
 * - Centralized enable/disable control
 * - Health monitoring across all integrations
 * - Configuration management
 *
 * @version 1.0.0 (Dec 8, 2025)
 */
@ApplicationScoped
public class ExternalApiRegistry {

    private static final Logger LOG = Logger.getLogger(ExternalApiRegistry.class);

    @Inject
    Instance<ExternalApiIntegration> integrations;

    private final Map<String, ExternalApiIntegration> registeredIntegrations = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        LOG.info("Initializing External API Registry...");

        // Auto-discover all integrations
        for (ExternalApiIntegration integration : integrations) {
            String id = integration.getIntegrationId();
            registeredIntegrations.put(id, integration);
            LOG.infof("✅ Registered integration: %s (%s) - %s",
                integration.getDisplayName(),
                id,
                integration.isEnabled() ? "ENABLED" : "DISABLED"
            );
        }

        LOG.infof("External API Registry initialized with %d integrations", registeredIntegrations.size());
    }

    /**
     * Get all registered integrations
     */
    public List<ExternalApiIntegration> getAllIntegrations() {
        return List.copyOf(registeredIntegrations.values());
    }

    /**
     * Get integrations by category
     */
    public List<ExternalApiIntegration> getIntegrationsByCategory(String category) {
        return registeredIntegrations.values().stream()
            .filter(i -> i.getCategory().equalsIgnoreCase(category))
            .collect(Collectors.toList());
    }

    /**
     * Get a specific integration by ID
     */
    public Optional<ExternalApiIntegration> getIntegration(String integrationId) {
        return Optional.ofNullable(registeredIntegrations.get(integrationId));
    }

    /**
     * Get all enabled integrations
     */
    public List<ExternalApiIntegration> getEnabledIntegrations() {
        return registeredIntegrations.values().stream()
            .filter(ExternalApiIntegration::isEnabled)
            .collect(Collectors.toList());
    }

    /**
     * Get all disabled integrations
     */
    public List<ExternalApiIntegration> getDisabledIntegrations() {
        return registeredIntegrations.values().stream()
            .filter(i -> !i.isEnabled())
            .collect(Collectors.toList());
    }

    /**
     * Get health status for all integrations
     */
    public Map<String, ExternalApiIntegration.HealthStatus> getAllHealthStatus() {
        Map<String, ExternalApiIntegration.HealthStatus> healthMap = new ConcurrentHashMap<>();

        for (ExternalApiIntegration integration : registeredIntegrations.values()) {
            try {
                ExternalApiIntegration.HealthStatus status = integration.checkHealth()
                    .await().atMost(java.time.Duration.ofSeconds(5));
                healthMap.put(integration.getIntegrationId(), status);
            } catch (Exception e) {
                healthMap.put(integration.getIntegrationId(),
                    ExternalApiIntegration.HealthStatus.unhealthy("Health check failed: " + e.getMessage()));
            }
        }

        return healthMap;
    }

    /**
     * Get summary of all integrations
     */
    public RegistrySummary getSummary() {
        int total = registeredIntegrations.size();
        int enabled = (int) registeredIntegrations.values().stream()
            .filter(ExternalApiIntegration::isEnabled)
            .count();
        int disabled = total - enabled;

        Map<String, Integer> byCategory = registeredIntegrations.values().stream()
            .collect(Collectors.groupingBy(
                ExternalApiIntegration::getCategory,
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));

        return new RegistrySummary(total, enabled, disabled, byCategory);
    }

    /**
     * Get integration info for display
     */
    public List<IntegrationInfo> getIntegrationInfoList() {
        return registeredIntegrations.values().stream()
            .map(i -> new IntegrationInfo(
                i.getIntegrationId(),
                i.getDisplayName(),
                i.getCategory(),
                i.isEnabled(),
                i.getConfig().apiUrl(),
                i.getMetrics().messagesReceived(),
                i.getMetrics().errorsCount()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Registry summary
     */
    public record RegistrySummary(
        int totalIntegrations,
        int enabledIntegrations,
        int disabledIntegrations,
        Map<String, Integer> byCategory
    ) {}

    /**
     * Integration info for display
     */
    public record IntegrationInfo(
        String id,
        String displayName,
        String category,
        boolean enabled,
        String apiUrl,
        long messagesReceived,
        long errorsCount
    ) {}
}
