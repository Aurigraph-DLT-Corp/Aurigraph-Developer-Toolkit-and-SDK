package io.aurigraph.v11.bridge.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import io.quarkus.logging.Log;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.Map;

/**
 * Bridge Rate Limiter - Security Hardening Sprint 1
 *
 * Implements per-address rate limiting for the cross-chain bridge using
 * a sliding window counter algorithm backed by Caffeine cache.
 *
 * Features:
 * - Per-address rate limiting: max 10 transfers/minute by default
 * - Sliding window counter for accurate rate limiting
 * - Configurable limits per chain or globally
 * - Automatic window expiration
 * - Rate limit headers for client feedback
 * - Metrics and monitoring support
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 * @since 2025-12-20
 */
@ApplicationScoped
public class BridgeRateLimiter {

    // Configuration properties
    @ConfigProperty(name = "bridge.ratelimit.enabled", defaultValue = "true")
    boolean rateLimitEnabled;

    @ConfigProperty(name = "bridge.ratelimit.max.transfers.per.minute", defaultValue = "10")
    int maxTransfersPerMinute;

    @ConfigProperty(name = "bridge.ratelimit.window.seconds", defaultValue = "60")
    int windowSeconds;

    @ConfigProperty(name = "bridge.ratelimit.burst.multiplier", defaultValue = "1.5")
    double burstMultiplier;

    @ConfigProperty(name = "bridge.ratelimit.cache.max.entries", defaultValue = "100000")
    int cacheMaxEntries;

    // Sliding window counters per address using Caffeine cache
    private final Cache<String, SlidingWindowCounter> addressCounters;

    // Metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong allowedRequests = new AtomicLong(0);
    private final AtomicLong rateLimitedRequests = new AtomicLong(0);
    private final Map<String, AtomicInteger> rateLimitedByAddress = new ConcurrentHashMap<>();

    public BridgeRateLimiter() {
        // Initialize Caffeine cache with expiration
        this.addressCounters = Caffeine.newBuilder()
            .maximumSize(100000) // Default, will be overridden by config
            .expireAfterAccess(Duration.ofMinutes(5)) // Remove inactive entries
            .build();
    }

    /**
     * Check if a transfer is allowed for the given address.
     *
     * @param address The address attempting the transfer
     * @return RateLimitResult indicating if the request is allowed
     */
    public RateLimitResult checkRateLimit(String address) {
        return checkRateLimit(address, null);
    }

    /**
     * Check if a transfer is allowed for the given address and chain.
     *
     * @param address The address attempting the transfer
     * @param chainId Optional chain ID for chain-specific limits
     * @return RateLimitResult indicating if the request is allowed
     */
    public RateLimitResult checkRateLimit(String address, String chainId) {
        totalRequests.incrementAndGet();

        if (!rateLimitEnabled) {
            allowedRequests.incrementAndGet();
            return RateLimitResult.allowed(maxTransfersPerMinute, maxTransfersPerMinute, 0);
        }

        if (address == null || address.isBlank()) {
            Log.warn("Rate limit check attempted with null/empty address");
            return RateLimitResult.denied(0, maxTransfersPerMinute, windowSeconds, "Invalid address");
        }

        // Create key for rate limiting (can include chain for chain-specific limits)
        String rateLimitKey = chainId != null ? address + ":" + chainId : address;

        // Get or create sliding window counter
        SlidingWindowCounter counter = addressCounters.get(rateLimitKey, k -> new SlidingWindowCounter(windowSeconds));

        // Calculate current count in the sliding window
        int currentCount = counter.getCount();
        int effectiveLimit = calculateEffectiveLimit();

        if (currentCount >= effectiveLimit) {
            rateLimitedRequests.incrementAndGet();
            rateLimitedByAddress.computeIfAbsent(address, k -> new AtomicInteger()).incrementAndGet();

            long retryAfterSeconds = counter.getSecondsUntilReset();

            Log.warnf("Rate limit exceeded for address %s. Current: %d, Limit: %d, Retry after: %ds",
                address, currentCount, effectiveLimit, retryAfterSeconds);

            return RateLimitResult.denied(
                effectiveLimit - currentCount,
                effectiveLimit,
                retryAfterSeconds,
                "Rate limit exceeded: " + currentCount + "/" + effectiveLimit + " transfers in " + windowSeconds + "s"
            );
        }

        // Increment counter for this request
        counter.increment();
        allowedRequests.incrementAndGet();

        int remaining = effectiveLimit - counter.getCount();

        return RateLimitResult.allowed(remaining, effectiveLimit, counter.getSecondsUntilReset());
    }

    /**
     * Record a transfer for rate limiting purposes.
     * Call this after a transfer is successfully initiated.
     *
     * @param address The address that made the transfer
     * @param chainId Optional chain ID
     */
    public void recordTransfer(String address, String chainId) {
        if (address == null || address.isBlank()) {
            return;
        }

        String rateLimitKey = chainId != null ? address + ":" + chainId : address;
        SlidingWindowCounter counter = addressCounters.get(rateLimitKey, k -> new SlidingWindowCounter(windowSeconds));
        counter.increment();

        Log.debugf("Recorded transfer for rate limiting. Address: %s, Current count: %d",
            address, counter.getCount());
    }

    /**
     * Get the current rate limit status for an address.
     *
     * @param address The address to check
     * @return RateLimitStatus with current usage info
     */
    public RateLimitStatus getStatus(String address) {
        return getStatus(address, null);
    }

    /**
     * Get the current rate limit status for an address and chain.
     *
     * @param address The address to check
     * @param chainId Optional chain ID
     * @return RateLimitStatus with current usage info
     */
    public RateLimitStatus getStatus(String address, String chainId) {
        if (address == null || address.isBlank()) {
            return new RateLimitStatus(address, 0, maxTransfersPerMinute, maxTransfersPerMinute, 0, false);
        }

        String rateLimitKey = chainId != null ? address + ":" + chainId : address;
        SlidingWindowCounter counter = addressCounters.getIfPresent(rateLimitKey);

        if (counter == null) {
            return new RateLimitStatus(address, 0, maxTransfersPerMinute, maxTransfersPerMinute, 0, false);
        }

        int currentCount = counter.getCount();
        int effectiveLimit = calculateEffectiveLimit();
        int remaining = Math.max(0, effectiveLimit - currentCount);
        boolean isLimited = currentCount >= effectiveLimit;

        return new RateLimitStatus(
            address,
            currentCount,
            remaining,
            effectiveLimit,
            counter.getSecondsUntilReset(),
            isLimited
        );
    }

    /**
     * Reset the rate limit counter for an address.
     * This is an admin operation.
     *
     * @param address The address to reset
     * @param adminId The admin performing the reset
     */
    public void resetLimit(String address, String adminId) {
        resetLimit(address, null, adminId);
    }

    /**
     * Reset the rate limit counter for an address and chain.
     *
     * @param address The address to reset
     * @param chainId Optional chain ID
     * @param adminId The admin performing the reset
     */
    public void resetLimit(String address, String chainId, String adminId) {
        String rateLimitKey = chainId != null ? address + ":" + chainId : address;
        addressCounters.invalidate(rateLimitKey);

        Log.infof("Rate limit reset for address %s by admin %s", address, adminId);
    }

    /**
     * Get rate limiter statistics.
     *
     * @return RateLimiterStats with usage metrics
     */
    public RateLimiterStats getStats() {
        long total = totalRequests.get();
        long allowed = allowedRequests.get();
        long limited = rateLimitedRequests.get();

        double allowedPercentage = total > 0 ? (double) allowed / total * 100.0 : 100.0;
        double limitedPercentage = total > 0 ? (double) limited / total * 100.0 : 0.0;

        return new RateLimiterStats(
            rateLimitEnabled,
            maxTransfersPerMinute,
            windowSeconds,
            total,
            allowed,
            limited,
            allowedPercentage,
            limitedPercentage,
            addressCounters.estimatedSize(),
            rateLimitedByAddress.size(),
            Instant.now()
        );
    }

    /**
     * Get the most rate-limited addresses.
     *
     * @param limit Maximum number of addresses to return
     * @return Map of address to rate limit count
     */
    public Map<String, Integer> getMostLimitedAddresses(int limit) {
        return rateLimitedByAddress.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue().get(), a.getValue().get()))
            .limit(limit)
            .collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey,
                e -> e.getValue().get(),
                (a, b) -> a,
                java.util.LinkedHashMap::new
            ));
    }

    // Private helper methods

    private int calculateEffectiveLimit() {
        // Allow burst traffic with multiplier
        return (int) (maxTransfersPerMinute * burstMultiplier);
    }

    // Inner classes

    /**
     * Sliding window counter for accurate rate limiting
     */
    private static class SlidingWindowCounter {
        private final int windowSeconds;
        private final ConcurrentHashMap<Long, AtomicInteger> buckets = new ConcurrentHashMap<>();
        private static final int BUCKET_SIZE_SECONDS = 1; // 1-second buckets

        public SlidingWindowCounter(int windowSeconds) {
            this.windowSeconds = windowSeconds;
        }

        public void increment() {
            long currentBucket = getCurrentBucket();
            buckets.computeIfAbsent(currentBucket, k -> new AtomicInteger()).incrementAndGet();
            cleanup();
        }

        public int getCount() {
            cleanup();
            long currentBucket = getCurrentBucket();
            long windowStart = currentBucket - (windowSeconds / BUCKET_SIZE_SECONDS);

            return buckets.entrySet().stream()
                .filter(e -> e.getKey() >= windowStart)
                .mapToInt(e -> e.getValue().get())
                .sum();
        }

        public long getSecondsUntilReset() {
            // Time until the oldest bucket in the current window expires
            long currentBucket = getCurrentBucket();
            long oldestBucket = buckets.keySet().stream()
                .filter(b -> b >= currentBucket - (windowSeconds / BUCKET_SIZE_SECONDS))
                .min(Long::compareTo)
                .orElse(currentBucket);

            long expiryBucket = oldestBucket + (windowSeconds / BUCKET_SIZE_SECONDS);
            return Math.max(0, (expiryBucket - currentBucket) * BUCKET_SIZE_SECONDS);
        }

        private long getCurrentBucket() {
            return Instant.now().getEpochSecond() / BUCKET_SIZE_SECONDS;
        }

        private void cleanup() {
            long currentBucket = getCurrentBucket();
            long windowStart = currentBucket - (windowSeconds / BUCKET_SIZE_SECONDS) - 1;

            buckets.keySet().removeIf(bucket -> bucket < windowStart);
        }
    }

    // Records

    /**
     * Result of a rate limit check
     */
    public record RateLimitResult(
        boolean allowed,
        int remaining,
        int limit,
        long retryAfterSeconds,
        String message
    ) {
        public static RateLimitResult allowed(int remaining, int limit, long retryAfter) {
            return new RateLimitResult(true, remaining, limit, retryAfter, "Request allowed");
        }

        public static RateLimitResult denied(int remaining, int limit, long retryAfter, String message) {
            return new RateLimitResult(false, remaining, limit, retryAfter, message);
        }

        /**
         * Get HTTP headers for rate limit response
         */
        public Map<String, String> toHeaders() {
            return Map.of(
                "X-RateLimit-Limit", String.valueOf(limit),
                "X-RateLimit-Remaining", String.valueOf(Math.max(0, remaining)),
                "X-RateLimit-Reset", String.valueOf(retryAfterSeconds),
                "Retry-After", String.valueOf(retryAfterSeconds)
            );
        }
    }

    /**
     * Current rate limit status for an address
     */
    public record RateLimitStatus(
        String address,
        int currentCount,
        int remaining,
        int limit,
        long secondsUntilReset,
        boolean isRateLimited
    ) {}

    /**
     * Rate limiter statistics
     */
    public record RateLimiterStats(
        boolean enabled,
        int maxTransfersPerMinute,
        int windowSeconds,
        long totalRequests,
        long allowedRequests,
        long rateLimitedRequests,
        double allowedPercentage,
        double limitedPercentage,
        long trackedAddresses,
        int uniqueRateLimitedAddresses,
        Instant timestamp
    ) {}
}
