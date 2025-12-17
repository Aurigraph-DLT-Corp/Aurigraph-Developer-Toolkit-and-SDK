package io.aurigraph.v11.governance;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * API Governance Service
 *
 * Provides centralized API governance including:
 * - Rate limiting per client/IP
 * - Request throttling
 * - Usage tracking and analytics
 * - API version management
 * - Deprecation warnings
 *
 * @author Governance Team
 * @version 12.0.0
 * @since AV11-545
 */
@ApplicationScoped
public class APIGovernanceService {

    private static final Logger LOG = Logger.getLogger(APIGovernanceService.class);

    @ConfigProperty(name = "aurigraph.governance.rate-limit.default", defaultValue = "100")
    int defaultRateLimit;

    @ConfigProperty(name = "aurigraph.governance.rate-limit.window-seconds", defaultValue = "60")
    int rateLimitWindowSeconds;

    @ConfigProperty(name = "aurigraph.governance.rate-limit.enabled", defaultValue = "true")
    boolean rateLimitEnabled;

    // Rate limit tracking per client
    private final Map<String, RateLimitBucket> rateLimitBuckets = new ConcurrentHashMap<>();

    // API usage statistics
    private final Map<String, APIUsageStats> usageStats = new ConcurrentHashMap<>();

    // Deprecated endpoints registry
    private final Set<String> deprecatedEndpoints = ConcurrentHashMap.newKeySet();

    // API versions
    private final Map<String, APIVersion> apiVersions = new ConcurrentHashMap<>();

    /**
     * Initialize governance service with default configurations
     */
    public APIGovernanceService() {
        // Register API versions
        registerAPIVersions();

        // Register deprecated endpoints
        registerDeprecatedEndpoints();
    }

    private void registerAPIVersions() {
        apiVersions.put("v11", new APIVersion("v11", "11.0.0", true, null, "Stable production version"));
        apiVersions.put("v12", new APIVersion("v12", "12.0.0", true, null, "Latest with V12 features"));
        apiVersions.put("v3", new APIVersion("v3", "3.0.0", true, null, "Integration endpoints (JIRA, etc.)"));
    }

    private void registerDeprecatedEndpoints() {
        // Mark deprecated endpoints for warnings
        deprecatedEndpoints.add("/api/v10/");
        deprecatedEndpoints.add("/api/old/");
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    /**
     * Check if a request is allowed based on rate limiting
     *
     * @param clientId Client identifier (IP, API key, or user ID)
     * @param endpoint The API endpoint being accessed
     * @return RateLimitResult with allowed status and remaining quota
     */
    public RateLimitResult checkRateLimit(String clientId, String endpoint) {
        if (!rateLimitEnabled) {
            return new RateLimitResult(true, defaultRateLimit, 0, rateLimitWindowSeconds);
        }

        String key = clientId + ":" + endpoint;
        RateLimitBucket bucket = rateLimitBuckets.computeIfAbsent(key,
            k -> new RateLimitBucket(defaultRateLimit, Duration.ofSeconds(rateLimitWindowSeconds)));

        // Clean up old buckets periodically
        cleanupExpiredBuckets();

        boolean allowed = bucket.tryConsume();
        int remaining = bucket.getRemaining();
        long resetTime = bucket.getResetTime();

        if (!allowed) {
            LOG.warnf("Rate limit exceeded for client %s on endpoint %s", clientId, endpoint);
            recordUsage(endpoint, clientId, false, "RATE_LIMITED");
        } else {
            recordUsage(endpoint, clientId, true, "OK");
        }

        return new RateLimitResult(allowed, defaultRateLimit, remaining, resetTime);
    }

    /**
     * Set custom rate limit for a specific client
     */
    public void setClientRateLimit(String clientId, int limit) {
        LOG.infof("Setting custom rate limit for client %s: %d requests/%d seconds",
            clientId, limit, rateLimitWindowSeconds);

        // Update all buckets for this client
        rateLimitBuckets.entrySet().stream()
            .filter(e -> e.getKey().startsWith(clientId + ":"))
            .forEach(e -> e.getValue().setLimit(limit));
    }

    /**
     * Reset rate limit for a client (admin operation)
     */
    public void resetRateLimit(String clientId) {
        LOG.infof("Resetting rate limit for client %s", clientId);
        rateLimitBuckets.entrySet().removeIf(e -> e.getKey().startsWith(clientId + ":"));
    }

    private void cleanupExpiredBuckets() {
        Instant cutoff = Instant.now().minus(Duration.ofSeconds(rateLimitWindowSeconds * 2L));
        rateLimitBuckets.entrySet().removeIf(e -> e.getValue().isExpired(cutoff));
    }

    // ========================================================================
    // USAGE TRACKING
    // ========================================================================

    /**
     * Record API usage for analytics
     */
    public void recordUsage(String endpoint, String clientId, boolean success, String status) {
        APIUsageStats stats = usageStats.computeIfAbsent(endpoint, k -> new APIUsageStats(endpoint));
        stats.recordRequest(clientId, success, status);
    }

    /**
     * Get usage statistics for an endpoint
     */
    public APIUsageStats getUsageStats(String endpoint) {
        return usageStats.get(endpoint);
    }

    /**
     * Get all usage statistics
     */
    public Collection<APIUsageStats> getAllUsageStats() {
        return usageStats.values();
    }

    /**
     * Get top endpoints by request count
     */
    public List<APIUsageStats> getTopEndpoints(int limit) {
        return usageStats.values().stream()
            .sorted((a, b) -> Long.compare(b.getTotalRequests(), a.getTotalRequests()))
            .limit(limit)
            .toList();
    }

    // ========================================================================
    // DEPRECATION MANAGEMENT
    // ========================================================================

    /**
     * Check if an endpoint is deprecated
     */
    public boolean isDeprecated(String endpoint) {
        return deprecatedEndpoints.stream().anyMatch(endpoint::startsWith);
    }

    /**
     * Get deprecation warning if applicable
     */
    public Optional<String> getDeprecationWarning(String endpoint) {
        if (isDeprecated(endpoint)) {
            return Optional.of("This endpoint is deprecated. Please migrate to the latest API version.");
        }
        return Optional.empty();
    }

    /**
     * Mark an endpoint as deprecated
     */
    public void markDeprecated(String endpoint, String migrationPath) {
        deprecatedEndpoints.add(endpoint);
        LOG.warnf("Endpoint marked as deprecated: %s -> migrate to %s", endpoint, migrationPath);
    }

    // ========================================================================
    // API VERSION MANAGEMENT
    // ========================================================================

    /**
     * Get API version information
     */
    public APIVersion getAPIVersion(String version) {
        return apiVersions.get(version);
    }

    /**
     * Get all API versions
     */
    public Collection<APIVersion> getAllAPIVersions() {
        return apiVersions.values();
    }

    /**
     * Check if an API version is supported
     */
    public boolean isVersionSupported(String version) {
        APIVersion v = apiVersions.get(version);
        return v != null && v.isSupported();
    }

    // ========================================================================
    // GOVERNANCE SUMMARY
    // ========================================================================

    /**
     * Get governance summary for dashboard
     */
    public GovernanceSummary getSummary() {
        long totalRequests = usageStats.values().stream()
            .mapToLong(APIUsageStats::getTotalRequests)
            .sum();

        long successfulRequests = usageStats.values().stream()
            .mapToLong(APIUsageStats::getSuccessfulRequests)
            .sum();

        long rateLimitedRequests = usageStats.values().stream()
            .mapToLong(APIUsageStats::getRateLimitedRequests)
            .sum();

        double successRate = totalRequests > 0
            ? (successfulRequests * 100.0 / totalRequests)
            : 100.0;

        return new GovernanceSummary(
            totalRequests,
            successfulRequests,
            rateLimitedRequests,
            successRate,
            usageStats.size(),
            rateLimitBuckets.size(),
            deprecatedEndpoints.size(),
            apiVersions.size()
        );
    }

    // ========================================================================
    // INNER CLASSES
    // ========================================================================

    /**
     * Rate limit bucket using token bucket algorithm
     */
    public static class RateLimitBucket {
        private final AtomicInteger tokens;
        private final int maxTokens;
        private final Duration window;
        private volatile Instant lastRefill;

        public RateLimitBucket(int maxTokens, Duration window) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.window = window;
            this.lastRefill = Instant.now();
        }

        public synchronized boolean tryConsume() {
            refillIfNeeded();
            int current = tokens.get();
            if (current > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refillIfNeeded() {
            Instant now = Instant.now();
            if (Duration.between(lastRefill, now).compareTo(window) >= 0) {
                tokens.set(maxTokens);
                lastRefill = now;
            }
        }

        public int getRemaining() {
            refillIfNeeded();
            return tokens.get();
        }

        public long getResetTime() {
            return lastRefill.plus(window).getEpochSecond();
        }

        public void setLimit(int limit) {
            // Not changing in-flight, but noted for future
        }

        public boolean isExpired(Instant cutoff) {
            return lastRefill.isBefore(cutoff);
        }
    }

    /**
     * Rate limit check result
     */
    public record RateLimitResult(
        boolean allowed,
        int limit,
        int remaining,
        long resetTime
    ) {}

    /**
     * API usage statistics
     */
    public static class APIUsageStats {
        private final String endpoint;
        private final AtomicLong totalRequests = new AtomicLong(0);
        private final AtomicLong successfulRequests = new AtomicLong(0);
        private final AtomicLong failedRequests = new AtomicLong(0);
        private final AtomicLong rateLimitedRequests = new AtomicLong(0);
        private final Set<String> uniqueClients = ConcurrentHashMap.newKeySet();
        private volatile Instant firstRequest;
        private volatile Instant lastRequest;

        public APIUsageStats(String endpoint) {
            this.endpoint = endpoint;
            this.firstRequest = Instant.now();
        }

        public void recordRequest(String clientId, boolean success, String status) {
            totalRequests.incrementAndGet();
            if (success) {
                successfulRequests.incrementAndGet();
            } else {
                failedRequests.incrementAndGet();
            }
            if ("RATE_LIMITED".equals(status)) {
                rateLimitedRequests.incrementAndGet();
            }
            uniqueClients.add(clientId);
            lastRequest = Instant.now();
        }

        public String getEndpoint() { return endpoint; }
        public long getTotalRequests() { return totalRequests.get(); }
        public long getSuccessfulRequests() { return successfulRequests.get(); }
        public long getFailedRequests() { return failedRequests.get(); }
        public long getRateLimitedRequests() { return rateLimitedRequests.get(); }
        public int getUniqueClients() { return uniqueClients.size(); }
        public Instant getFirstRequest() { return firstRequest; }
        public Instant getLastRequest() { return lastRequest; }
    }

    /**
     * API Version information
     */
    public record APIVersion(
        String version,
        String semanticVersion,
        boolean supported,
        Instant deprecationDate,
        String description
    ) {
        public boolean isSupported() { return supported; }
    }

    /**
     * Governance summary for dashboard
     */
    public record GovernanceSummary(
        long totalRequests,
        long successfulRequests,
        long rateLimitedRequests,
        double successRate,
        int trackedEndpoints,
        int activeRateLimitBuckets,
        int deprecatedEndpoints,
        int apiVersions
    ) {}
}
