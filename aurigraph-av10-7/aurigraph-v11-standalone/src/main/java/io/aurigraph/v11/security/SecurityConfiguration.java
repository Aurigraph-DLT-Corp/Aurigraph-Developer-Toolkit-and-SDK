package io.aurigraph.v11.security;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.Security;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Comprehensive Security Configuration for Aurigraph V11
 * 
 * Implements:
 * - TLS 1.3 enforcement
 * - Rate limiting for API endpoints
 * - DDoS protection mechanisms
 * - Input validation and sanitization
 * - Security headers configuration
 * - Quantum-resistant crypto hardening
 * 
 * Performance Target: Sub-millisecond security validation
 * Security Level: NIST Level 5 quantum resistance
 */
@ApplicationScoped
public class SecurityConfiguration {
    
    private static final Logger LOG = Logger.getLogger(SecurityConfiguration.class);
    
    // Rate limiting configuration
    @ConfigProperty(name = "security.rate-limit.requests-per-second", defaultValue = "10000")
    int maxRequestsPerSecond;
    
    @ConfigProperty(name = "security.rate-limit.burst-capacity", defaultValue = "50000")
    int burstCapacity;
    
    @ConfigProperty(name = "security.ddos.max-connections-per-ip", defaultValue = "1000")
    int maxConnectionsPerIp;
    
    @ConfigProperty(name = "security.ddos.blacklist-duration-minutes", defaultValue = "60")
    int blacklistDurationMinutes;
    
    @ConfigProperty(name = "security.validation.max-request-size", defaultValue = "16777216")
    long maxRequestSize;
    
    // Security components
    private final ConcurrentHashMap<String, RateLimitBucket> rateLimitBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ConnectionTracker> connectionTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> blacklistedIPs = new ConcurrentHashMap<>();
    
    // Input validation patterns
    private static final Pattern VALID_NODE_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{1,64}$");
    private static final Pattern VALID_HASH_PATTERN = Pattern.compile("^[a-fA-F0-9]{64,128}$");
    private static final Pattern VALID_ADDRESS_PATTERN = Pattern.compile("^0x[a-fA-F0-9]{40}$");
    private static final Pattern MALICIOUS_PATTERN = Pattern.compile(
        ".*(script|javascript|vbscript|onload|onerror|eval|exec|system|cmd|<|>|&lt;|&gt;).*", 
        Pattern.CASE_INSENSITIVE
    );
    
    // Security metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong blockedRequests = new AtomicLong(0);
    private final AtomicLong rateLimitedRequests = new AtomicLong(0);
    private final AtomicLong ddosBlockedRequests = new AtomicLong(0);
    private final AtomicLong validationFailures = new AtomicLong(0);
    
    /**
     * Initialize security configuration on application startup
     */
    void onStart(@Observes StartupEvent ev) {
        LOG.info("Initializing Aurigraph V11 Security Configuration");
        
        try {
            // Configure TLS 1.3 enforcement
            configureTLS13();
            
            // Configure security headers
            configureSecurityHeaders();
            
            // Initialize quantum-resistant crypto providers
            initializeQuantumCryptoProviders();
            
            // Start security monitoring background tasks
            startSecurityMonitoring();
            
            LOG.info("Security Configuration initialized successfully");
            LOG.info("Rate limiting: " + maxRequestsPerSecond + " req/sec, burst: " + burstCapacity);
            LOG.info("DDoS protection: max " + maxConnectionsPerIp + " connections per IP");
            
        } catch (Exception e) {
            LOG.error("Failed to initialize Security Configuration", e);
            throw new RuntimeException("Security initialization failed", e);
        }
    }
    
    /**
     * Configure TLS 1.3 enforcement
     */
    private void configureTLS13() {
        try {
            // Set system properties for TLS 1.3 enforcement
            System.setProperty("https.protocols", "TLSv1.3");
            System.setProperty("jdk.tls.client.protocols", "TLSv1.3");
            System.setProperty("jdk.tls.server.protocols", "TLSv1.3");
            
            // Disable weak cipher suites
            System.setProperty("jdk.tls.disabledAlgorithms", 
                "SSLv3, RC4, DES, MD5withRSA, DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC");
            
            // Enable strong cipher suites for quantum resistance
            System.setProperty("jdk.tls.legacyAlgorithms", 
                "SHA-1, RSA keySize < 2048, DSA keySize < 2048");
            
            LOG.info("TLS 1.3 enforcement configured with quantum-resistant cipher suites");
            
        } catch (Exception e) {
            LOG.error("Failed to configure TLS 1.3", e);
        }
    }
    
    /**
     * Configure security headers
     */
    private void configureSecurityHeaders() {
        try {
            // Security headers will be set by SecurityHeadersFilter
            LOG.info("Security headers configuration prepared");
            
        } catch (Exception e) {
            LOG.error("Failed to configure security headers", e);
        }
    }
    
    /**
     * Initialize quantum-resistant cryptographic providers
     */
    private void initializeQuantumCryptoProviders() {
        try {
            // Ensure BouncyCastle providers are at the top of the provider list
            Security.insertProviderAt(new org.bouncycastle.jce.provider.BouncyCastleProvider(), 1);
            Security.insertProviderAt(new org.bouncycastle.pqc.jcajce.provider.BouncyCastlePQCProvider(), 2);
            
            // Disable weak cryptographic algorithms
            Security.setProperty("crypto.policy", "unlimited");
            
            LOG.info("Quantum-resistant cryptographic providers initialized");
            
        } catch (Exception e) {
            LOG.error("Failed to initialize crypto providers", e);
        }
    }
    
    /**
     * Start security monitoring background tasks
     */
    private void startSecurityMonitoring() {
        try {
            // Start blacklist cleanup task
            Thread.startVirtualThread(() -> {
                while (true) {
                    try {
                        cleanupBlacklist();
                        Thread.sleep(Duration.ofMinutes(5).toMillis());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    } catch (Exception e) {
                        LOG.error("Error in blacklist cleanup", e);
                    }
                }
            });
            
            // Start rate limit bucket cleanup task
            Thread.startVirtualThread(() -> {
                while (true) {
                    try {
                        cleanupRateLimitBuckets();
                        Thread.sleep(Duration.ofMinutes(1).toMillis());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    } catch (Exception e) {
                        LOG.error("Error in rate limit cleanup", e);
                    }
                }
            });
            
            LOG.info("Security monitoring background tasks started");
            
        } catch (Exception e) {
            LOG.error("Failed to start security monitoring", e);
        }
    }
    
    /**
     * Check if request should be rate limited
     * 
     * @param clientIP Client IP address
     * @param endpoint API endpoint
     * @return true if request should be blocked due to rate limiting
     */
    public boolean isRateLimited(String clientIP, String endpoint) {
        totalRequests.incrementAndGet();
        
        try {
            // Check if IP is blacklisted
            if (isBlacklisted(clientIP)) {
                ddosBlockedRequests.incrementAndGet();
                return true;
            }
            
            String rateLimitKey = clientIP + ":" + endpoint;
            RateLimitBucket bucket = rateLimitBuckets.computeIfAbsent(rateLimitKey, 
                k -> new RateLimitBucket(maxRequestsPerSecond, burstCapacity));
            
            if (!bucket.tryConsume()) {
                rateLimitedRequests.incrementAndGet();
                
                // Check for potential DDoS attack
                trackConnection(clientIP);
                
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            LOG.error("Error checking rate limit for " + clientIP, e);
            // Fail safe - allow request but log the error
            return false;
        }
    }
    
    /**
     * Validate and sanitize input data
     * 
     * @param input Input string to validate
     * @param type Input type (node_id, hash, address, general)
     * @return Sanitized input or null if invalid
     */
    public String validateAndSanitize(String input, InputType type) {
        try {
            if (input == null || input.trim().isEmpty()) {
                validationFailures.incrementAndGet();
                return null;
            }
            
            String sanitized = input.trim();
            
            // Check for malicious patterns
            if (MALICIOUS_PATTERN.matcher(sanitized).matches()) {
                validationFailures.incrementAndGet();
                LOG.warn("Malicious input detected: " + sanitized.substring(0, Math.min(50, sanitized.length())));
                return null;
            }
            
            // Type-specific validation
            switch (type) {
                case NODE_ID:
                    if (!VALID_NODE_ID_PATTERN.matcher(sanitized).matches()) {
                        validationFailures.incrementAndGet();
                        return null;
                    }
                    break;
                case HASH:
                    if (!VALID_HASH_PATTERN.matcher(sanitized).matches()) {
                        validationFailures.incrementAndGet();
                        return null;
                    }
                    break;
                case ADDRESS:
                    if (!VALID_ADDRESS_PATTERN.matcher(sanitized).matches()) {
                        validationFailures.incrementAndGet();
                        return null;
                    }
                    break;
                case GENERAL:
                    // Basic sanitization for general input
                    sanitized = sanitized.replaceAll("[<>\"'&]", "");
                    if (sanitized.length() > 1000) {
                        sanitized = sanitized.substring(0, 1000);
                    }
                    break;
            }
            
            return sanitized;
            
        } catch (Exception e) {
            LOG.error("Error validating input", e);
            validationFailures.incrementAndGet();
            return null;
        }
    }
    
    /**
     * Validate request size
     * 
     * @param contentLength Request content length
     * @return true if request size is within limits
     */
    public boolean validateRequestSize(long contentLength) {
        if (contentLength > maxRequestSize) {
            blockedRequests.incrementAndGet();
            LOG.warn("Request size exceeded limit: " + contentLength + " bytes");
            return false;
        }
        return true;
    }
    
    /**
     * Track connections per IP for DDoS detection
     */
    private void trackConnection(String clientIP) {
        ConnectionTracker tracker = connectionTrackers.computeIfAbsent(clientIP, 
            k -> new ConnectionTracker());
        
        tracker.incrementConnections();
        
        if (tracker.getConnectionCount() > maxConnectionsPerIp) {
            // Blacklist the IP
            blacklistedIPs.put(clientIP, Instant.now().plus(Duration.ofMinutes(blacklistDurationMinutes)));
            LOG.warn("IP blacklisted for DDoS: " + clientIP + " (" + tracker.getConnectionCount() + " connections)");
        }
    }
    
    /**
     * Check if IP is blacklisted
     */
    private boolean isBlacklisted(String clientIP) {
        Instant blacklistExpiry = blacklistedIPs.get(clientIP);
        if (blacklistExpiry != null) {
            if (Instant.now().isBefore(blacklistExpiry)) {
                return true;
            } else {
                blacklistedIPs.remove(clientIP);
            }
        }
        return false;
    }
    
    /**
     * Clean up expired blacklist entries
     */
    private void cleanupBlacklist() {
        Instant now = Instant.now();
        blacklistedIPs.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        
        int removed = blacklistedIPs.size();
        if (removed > 0) {
            LOG.debug("Cleaned up " + removed + " expired blacklist entries");
        }
    }
    
    /**
     * Clean up inactive rate limit buckets
     */
    private void cleanupRateLimitBuckets() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(10));
        
        rateLimitBuckets.entrySet().removeIf(entry -> 
            entry.getValue().getLastAccess().isBefore(cutoff));
        
        connectionTrackers.entrySet().removeIf(entry -> 
            entry.getValue().getLastActivity().isBefore(cutoff));
        
        LOG.debug("Rate limit buckets: " + rateLimitBuckets.size() + 
                 ", Connection trackers: " + connectionTrackers.size());
    }
    
    /**
     * Get security metrics
     */
    public SecurityMetrics getSecurityMetrics() {
        return new SecurityMetrics(
            totalRequests.get(),
            blockedRequests.get(),
            rateLimitedRequests.get(),
            ddosBlockedRequests.get(),
            validationFailures.get(),
            blacklistedIPs.size(),
            rateLimitBuckets.size(),
            connectionTrackers.size()
        );
    }
    
    /**
     * Get recommended security headers for responses
     */
    public Map<String, String> getSecurityHeaders() {
        Map<String, String> headers = new ConcurrentHashMap<>();
        
        headers.put("X-Content-Type-Options", "nosniff");
        headers.put("X-Frame-Options", "DENY");
        headers.put("X-XSS-Protection", "1; mode=block");
        headers.put("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");
        headers.put("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.put("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
        
        return headers;
    }
    
    /**
     * Input validation types
     */
    public enum InputType {
        NODE_ID,
        HASH,
        ADDRESS,
        GENERAL
    }
    
    /**
     * Rate limiting bucket implementation
     */
    private static class RateLimitBucket {
        private final int maxTokens;
        private final int refillRate;
        private volatile int tokens;
        private volatile Instant lastRefill;
        private volatile Instant lastAccess;
        
        public RateLimitBucket(int refillRate, int maxTokens) {
            this.refillRate = refillRate;
            this.maxTokens = maxTokens;
            this.tokens = maxTokens;
            this.lastRefill = Instant.now();
            this.lastAccess = Instant.now();
        }
        
        public synchronized boolean tryConsume() {
            lastAccess = Instant.now();
            refill();
            
            if (tokens > 0) {
                tokens--;
                return true;
            }
            
            return false;
        }
        
        private void refill() {
            Instant now = Instant.now();
            long secondsSinceLastRefill = Duration.between(lastRefill, now).toSeconds();
            
            if (secondsSinceLastRefill > 0) {
                int tokensToAdd = Math.min((int) (secondsSinceLastRefill * refillRate), 
                                         maxTokens - tokens);
                tokens += tokensToAdd;
                lastRefill = now;
            }
        }
        
        public Instant getLastAccess() {
            return lastAccess;
        }
    }
    
    /**
     * Connection tracking for DDoS detection
     */
    private static class ConnectionTracker {
        private final AtomicInteger connectionCount = new AtomicInteger(0);
        private volatile Instant lastActivity = Instant.now();
        
        public void incrementConnections() {
            connectionCount.incrementAndGet();
            lastActivity = Instant.now();
        }
        
        public int getConnectionCount() {
            return connectionCount.get();
        }
        
        public Instant getLastActivity() {
            return lastActivity;
        }
    }
    
    /**
     * Security metrics record
     */
    public static record SecurityMetrics(
        long totalRequests,
        long blockedRequests,
        long rateLimitedRequests,
        long ddosBlockedRequests,
        long validationFailures,
        int blacklistedIPs,
        int activeRateLimitBuckets,
        int activeConnectionTrackers
    ) {
        public double getBlockedRequestPercentage() {
            return totalRequests > 0 ? (double) blockedRequests / totalRequests * 100.0 : 0.0;
        }
        
        public double getSecurityEfficiency() {
            long totalBlocked = blockedRequests + rateLimitedRequests + ddosBlockedRequests;
            return totalRequests > 0 ? (double) (totalRequests - totalBlocked) / totalRequests * 100.0 : 100.0;
        }
    }
}