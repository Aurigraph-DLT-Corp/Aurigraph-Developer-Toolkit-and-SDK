package io.aurigraph.v11.contracts.composite.verification;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Third-Party Data Integration Service
 *
 * Manages integration with external data providers for RWAT verification including:
 * - Data provider registry and configuration
 * - Async data request handling with retry logic
 * - Response caching with TTL
 * - Rate limiting per provider
 * - Data normalization and quality scoring
 * - Provider cost tracking and quota management
 *
 * Supports multiple provider types:
 * - Property registries (land records, title companies)
 * - Credit bureaus (financial data)
 * - Government ID verification
 * - Company registries (business verification)
 * - Environmental databases
 * - Valuation databases (market data, comps)
 * - Sanctions lists (AML/compliance)
 * - Insurance databases
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification)
 */
@ApplicationScoped
public class ThirdPartyDataIntegrationService {

    private static final Logger LOG = Logger.getLogger(ThirdPartyDataIntegrationService.class);

    // Storage maps
    private final ConcurrentHashMap<String, DataProvider> providers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DataRequest> activeRequests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CachedResponse> responseCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ProviderRateLimiter> rateLimiters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DataRequest> completedRequests = new ConcurrentHashMap<>();

    // Request queue
    private final ConcurrentLinkedQueue<DataRequest> requestQueue = new ConcurrentLinkedQueue<>();

    // Configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration DEFAULT_CACHE_TTL = Duration.ofHours(24);
    private static final int DEFAULT_RATE_LIMIT = 100; // requests per minute

    public ThirdPartyDataIntegrationService() {
        LOG.info("Initializing Third-Party Data Integration Service");
        initializeDefaultProviders();
    }

    // ==================== PROVIDER TYPES ====================

    /**
     * Types of data providers
     */
    public enum ProviderType {
        // Property Data
        PROPERTY_REGISTRY("Property Registry", "Land and property records"),
        LAND_REGISTRY("Land Registry", "Official land registration records"),
        TITLE_COMPANY("Title Company", "Title search and insurance"),
        MLS_DATABASE("MLS Database", "Multiple listing service data"),

        // Financial Data
        CREDIT_BUREAU("Credit Bureau", "Credit reports and scoring"),
        BANK_VERIFICATION("Bank Verification", "Bank account verification"),
        FINANCIAL_INSTITUTION("Financial Institution", "Financial data verification"),

        // Legal Data
        COURT_RECORDS("Court Records", "Legal proceedings and judgments"),
        LIEN_DATABASE("Lien Database", "Property liens and encumbrances"),
        BANKRUPTCY_RECORDS("Bankruptcy Records", "Bankruptcy filings"),

        // Identity Verification
        GOVERNMENT_ID("Government ID Verification", "Official identity documents"),
        FACIAL_RECOGNITION("Facial Recognition", "Biometric facial verification"),
        BIOMETRIC_VERIFICATION("Biometric Verification", "Multi-factor biometric checks"),

        // Business Data
        COMPANY_REGISTRY("Company Registry", "Business registration records"),
        SEC_FILINGS("SEC Filings", "Securities and Exchange Commission data"),
        BUSINESS_CREDIT("Business Credit", "Commercial credit reports"),

        // Environmental Data
        ENVIRONMENTAL_DATABASE("Environmental Database", "Environmental impact records"),
        FLOOD_ZONE_DATA("Flood Zone Data", "FEMA flood zone mapping"),
        HAZARD_DATABASE("Hazard Database", "Environmental hazard records"),

        // Valuation Data
        VALUATION_DATABASE("Valuation Database", "Property valuation data"),
        COMPARABLE_SALES("Comparable Sales", "Recent comparable transactions"),
        MARKET_DATA("Market Data", "Real estate market analytics"),
        APPRAISAL_DATABASE("Appraisal Database", "Professional appraisal records"),

        // Compliance Data
        SANCTIONS_LIST("Sanctions List", "OFAC and international sanctions"),
        PEP_DATABASE("PEP Database", "Politically exposed persons screening"),
        AML_DATABASE("AML Database", "Anti-money laundering checks"),
        WATCHLIST("Watchlist", "Security and compliance watchlists"),

        // Insurance Data
        INSURANCE_DATABASE("Insurance Database", "Insurance policy verification"),
        CLAIMS_HISTORY("Claims History", "Insurance claims records"),
        UNDERWRITING_DATA("Underwriting Data", "Insurance underwriting information"),

        // Custom Integration
        CUSTOM_API("Custom API", "Custom data provider integration"),
        MANUAL_VERIFICATION("Manual Verification", "Manual data collection process");

        private final String displayName;
        private final String description;

        ProviderType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    // ==================== DATA PROVIDER ====================

    /**
     * Represents a configured data provider
     */
    public static class DataProvider {
        private final String providerId;
        private final String providerName;
        private final ProviderType providerType;
        private ProviderConfig config;
        private ProviderStatus status;
        private ProviderMetrics metrics;
        private List<String> supportedDataTypes;
        private Map<String, String> customHeaders;
        private Instant registeredAt;
        private Instant lastUsedAt;

        public DataProvider(ProviderType providerType, String providerName) {
            this.providerId = "PROV-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            this.providerType = providerType;
            this.providerName = providerName;
            this.config = new ProviderConfig();
            this.status = ProviderStatus.ACTIVE;
            this.metrics = new ProviderMetrics();
            this.supportedDataTypes = new ArrayList<>();
            this.customHeaders = new HashMap<>();
            this.registeredAt = Instant.now();
        }

        // Getters and setters
        public String getProviderId() { return providerId; }
        public String getProviderName() { return providerName; }
        public ProviderType getProviderType() { return providerType; }
        public ProviderConfig getConfig() { return config; }
        public void setConfig(ProviderConfig config) { this.config = config; }
        public ProviderStatus getStatus() { return status; }
        public void setStatus(ProviderStatus status) { this.status = status; }
        public ProviderMetrics getMetrics() { return metrics; }
        public List<String> getSupportedDataTypes() { return supportedDataTypes; }
        public Map<String, String> getCustomHeaders() { return customHeaders; }
        public Instant getRegisteredAt() { return registeredAt; }
        public Instant getLastUsedAt() { return lastUsedAt; }
        public void updateLastUsed() { this.lastUsedAt = Instant.now(); }
    }

    /**
     * Provider configuration
     */
    public static class ProviderConfig {
        private String apiEndpoint;
        private String apiKey;
        private String apiSecret;
        private String authType; // API_KEY, OAUTH2, BASIC_AUTH, CUSTOM
        private Map<String, String> credentials;
        private Duration timeout;
        private int maxRetries;
        private int rateLimitPerMinute;
        private BigDecimal costPerRequest;
        private String currency;
        private Map<String, Object> customConfig;

        public ProviderConfig() {
            this.credentials = new HashMap<>();
            this.timeout = DEFAULT_TIMEOUT;
            this.maxRetries = MAX_RETRY_ATTEMPTS;
            this.rateLimitPerMinute = DEFAULT_RATE_LIMIT;
            this.costPerRequest = BigDecimal.ZERO;
            this.currency = "USD";
            this.customConfig = new HashMap<>();
        }

        // Builder pattern
        public ProviderConfig apiEndpoint(String endpoint) { this.apiEndpoint = endpoint; return this; }
        public ProviderConfig apiKey(String key) { this.apiKey = key; return this; }
        public ProviderConfig apiSecret(String secret) { this.apiSecret = secret; return this; }
        public ProviderConfig authType(String type) { this.authType = type; return this; }
        public ProviderConfig addCredential(String key, String value) {
            this.credentials.put(key, value); return this;
        }
        public ProviderConfig timeout(Duration timeout) { this.timeout = timeout; return this; }
        public ProviderConfig maxRetries(int retries) { this.maxRetries = retries; return this; }
        public ProviderConfig rateLimit(int limit) { this.rateLimitPerMinute = limit; return this; }
        public ProviderConfig costPerRequest(BigDecimal cost) { this.costPerRequest = cost; return this; }
        public ProviderConfig currency(String currency) { this.currency = currency; return this; }
        public ProviderConfig addCustomConfig(String key, Object value) {
            this.customConfig.put(key, value); return this;
        }

        // Getters
        public String getApiEndpoint() { return apiEndpoint; }
        public String getApiKey() { return apiKey; }
        public String getApiSecret() { return apiSecret; }
        public String getAuthType() { return authType; }
        public Map<String, String> getCredentials() { return credentials; }
        public Duration getTimeout() { return timeout; }
        public int getMaxRetries() { return maxRetries; }
        public int getRateLimitPerMinute() { return rateLimitPerMinute; }
        public BigDecimal getCostPerRequest() { return costPerRequest; }
        public String getCurrency() { return currency; }
        public Map<String, Object> getCustomConfig() { return customConfig; }
    }

    /**
     * Provider status
     */
    public enum ProviderStatus {
        ACTIVE,
        INACTIVE,
        RATE_LIMITED,
        QUOTA_EXCEEDED,
        ERROR,
        MAINTENANCE,
        DEPRECATED
    }

    /**
     * Provider metrics and statistics
     */
    public static class ProviderMetrics {
        private final AtomicInteger totalRequests = new AtomicInteger(0);
        private final AtomicInteger successfulRequests = new AtomicInteger(0);
        private final AtomicInteger failedRequests = new AtomicInteger(0);
        private final AtomicInteger cachedResponses = new AtomicInteger(0);
        private BigDecimal totalCost = BigDecimal.ZERO;
        private Duration averageResponseTime = Duration.ZERO;
        private Instant lastRequestAt;
        private Instant lastSuccessAt;
        private Instant lastFailureAt;
        private String lastErrorMessage;

        public void recordRequest() {
            totalRequests.incrementAndGet();
            lastRequestAt = Instant.now();
        }

        public void recordSuccess(Duration responseTime) {
            successfulRequests.incrementAndGet();
            lastSuccessAt = Instant.now();
            updateAverageResponseTime(responseTime);
        }

        public void recordFailure(String errorMessage) {
            failedRequests.incrementAndGet();
            lastFailureAt = Instant.now();
            lastErrorMessage = errorMessage;
        }

        public void recordCachedHit() {
            cachedResponses.incrementAndGet();
        }

        public synchronized void addCost(BigDecimal cost) {
            totalCost = totalCost.add(cost);
        }

        private synchronized void updateAverageResponseTime(Duration newTime) {
            int count = successfulRequests.get();
            if (count == 1) {
                averageResponseTime = newTime;
            } else {
                long avgMillis = averageResponseTime.toMillis();
                long newMillis = newTime.toMillis();
                long updatedAvg = ((avgMillis * (count - 1)) + newMillis) / count;
                averageResponseTime = Duration.ofMillis(updatedAvg);
            }
        }

        public double getSuccessRate() {
            int total = totalRequests.get();
            if (total == 0) return 0.0;
            return (successfulRequests.get() * 100.0) / total;
        }

        // Getters
        public int getTotalRequests() { return totalRequests.get(); }
        public int getSuccessfulRequests() { return successfulRequests.get(); }
        public int getFailedRequests() { return failedRequests.get(); }
        public int getCachedResponses() { return cachedResponses.get(); }
        public BigDecimal getTotalCost() { return totalCost; }
        public Duration getAverageResponseTime() { return averageResponseTime; }
        public Instant getLastRequestAt() { return lastRequestAt; }
        public Instant getLastSuccessAt() { return lastSuccessAt; }
        public Instant getLastFailureAt() { return lastFailureAt; }
        public String getLastErrorMessage() { return lastErrorMessage; }
    }

    // ==================== DATA REQUEST ====================

    /**
     * Represents a data request to a provider
     */
    public static class DataRequest {
        private final String requestId;
        private final String providerId;
        private final String dataType;
        private final Map<String, String> queryParameters;
        private final Map<String, String> headers;
        private RequestPriority priority;
        private RequestStatus status;
        private int retryCount;
        private Instant createdAt;
        private Instant submittedAt;
        private Instant completedAt;
        private Duration processingTime;
        private String requestedBy;
        private String correlationId;
        private DataResponse response;
        private List<String> errorMessages;
        private BigDecimal cost;

        public DataRequest(String providerId, String dataType) {
            this.requestId = "REQ-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            this.providerId = providerId;
            this.dataType = dataType;
            this.queryParameters = new HashMap<>();
            this.headers = new HashMap<>();
            this.priority = RequestPriority.NORMAL;
            this.status = RequestStatus.PENDING;
            this.retryCount = 0;
            this.createdAt = Instant.now();
            this.errorMessages = new ArrayList<>();
        }

        // Builder pattern
        public DataRequest addParameter(String key, String value) {
            this.queryParameters.put(key, value);
            return this;
        }

        public DataRequest addHeader(String key, String value) {
            this.headers.put(key, value);
            return this;
        }

        public DataRequest priority(RequestPriority priority) {
            this.priority = priority;
            return this;
        }

        public DataRequest requestedBy(String user) {
            this.requestedBy = user;
            return this;
        }

        public DataRequest correlationId(String id) {
            this.correlationId = id;
            return this;
        }

        public void markSubmitted() {
            this.status = RequestStatus.SUBMITTED;
            this.submittedAt = Instant.now();
        }

        public void markProcessing() {
            this.status = RequestStatus.PROCESSING;
        }

        public void markCompleted(DataResponse response, BigDecimal cost) {
            this.status = RequestStatus.COMPLETED;
            this.response = response;
            this.completedAt = Instant.now();
            this.cost = cost;
            if (submittedAt != null) {
                this.processingTime = Duration.between(submittedAt, completedAt);
            }
        }

        public void markFailed(String errorMessage) {
            this.status = RequestStatus.FAILED;
            this.completedAt = Instant.now();
            this.errorMessages.add(errorMessage);
        }

        public void incrementRetry() {
            this.retryCount++;
            this.status = RequestStatus.RETRYING;
        }

        public boolean canRetry(int maxRetries) {
            return retryCount < maxRetries && status == RequestStatus.FAILED;
        }

        // Getters
        public String getRequestId() { return requestId; }
        public String getProviderId() { return providerId; }
        public String getDataType() { return dataType; }
        public Map<String, String> getQueryParameters() { return queryParameters; }
        public Map<String, String> getHeaders() { return headers; }
        public RequestPriority getPriority() { return priority; }
        public RequestStatus getStatus() { return status; }
        public int getRetryCount() { return retryCount; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getSubmittedAt() { return submittedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public Duration getProcessingTime() { return processingTime; }
        public String getRequestedBy() { return requestedBy; }
        public String getCorrelationId() { return correlationId; }
        public DataResponse getResponse() { return response; }
        public List<String> getErrorMessages() { return errorMessages; }
        public BigDecimal getCost() { return cost; }
    }

    /**
     * Request priority levels
     */
    public enum RequestPriority {
        LOW(1),
        NORMAL(2),
        HIGH(3),
        URGENT(4),
        CRITICAL(5);

        private final int level;
        RequestPriority(int level) { this.level = level; }
        public int getLevel() { return level; }
    }

    /**
     * Request status
     */
    public enum RequestStatus {
        PENDING,
        QUEUED,
        SUBMITTED,
        PROCESSING,
        COMPLETED,
        FAILED,
        RETRYING,
        TIMEOUT,
        CANCELLED,
        CACHED
    }

    // ==================== DATA RESPONSE ====================

    /**
     * Response from a data provider
     */
    public static class DataResponse {
        private final String responseId;
        private final String requestId;
        private final String providerId;
        private Map<String, Object> data;
        private String rawResponse;
        private String dataFormat; // JSON, XML, CSV, etc.
        private DataConfidenceLevel confidenceLevel;
        private double confidenceScore; // 0.0 - 1.0
        private Map<String, String> normalizedFields;
        private List<DataQualityFlag> qualityFlags;
        private Instant dataTimestamp;
        private Instant retrievedAt;
        private String sourceReference;
        private boolean isVerified;
        private String verificationMethod;
        private Map<String, Object> metadata;

        public DataResponse(String requestId, String providerId) {
            this.responseId = "RESP-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            this.requestId = requestId;
            this.providerId = providerId;
            this.data = new HashMap<>();
            this.normalizedFields = new HashMap<>();
            this.qualityFlags = new ArrayList<>();
            this.metadata = new HashMap<>();
            this.retrievedAt = Instant.now();
            this.confidenceScore = 0.0;
        }

        // Builder pattern
        public DataResponse addData(String key, Object value) {
            this.data.put(key, value);
            return this;
        }

        public DataResponse rawResponse(String raw) {
            this.rawResponse = raw;
            return this;
        }

        public DataResponse dataFormat(String format) {
            this.dataFormat = format;
            return this;
        }

        public DataResponse confidenceLevel(DataConfidenceLevel level) {
            this.confidenceLevel = level;
            return this;
        }

        public DataResponse confidenceScore(double score) {
            this.confidenceScore = Math.max(0.0, Math.min(1.0, score));
            assignConfidenceLevel();
            return this;
        }

        public DataResponse addNormalizedField(String key, String value) {
            this.normalizedFields.put(key, value);
            return this;
        }

        public DataResponse addQualityFlag(DataQualityFlag flag) {
            this.qualityFlags.add(flag);
            return this;
        }

        public DataResponse dataTimestamp(Instant timestamp) {
            this.dataTimestamp = timestamp;
            return this;
        }

        public DataResponse sourceReference(String ref) {
            this.sourceReference = ref;
            return this;
        }

        public DataResponse verified(boolean verified) {
            this.isVerified = verified;
            return this;
        }

        public DataResponse verificationMethod(String method) {
            this.verificationMethod = method;
            return this;
        }

        public DataResponse addMetadata(String key, Object value) {
            this.metadata.put(key, value);
            return this;
        }

        private void assignConfidenceLevel() {
            if (confidenceScore >= 0.95) {
                this.confidenceLevel = DataConfidenceLevel.HIGH;
            } else if (confidenceScore >= 0.80) {
                this.confidenceLevel = DataConfidenceLevel.MEDIUM;
            } else if (confidenceScore >= 0.60) {
                this.confidenceLevel = DataConfidenceLevel.LOW;
            } else if (confidenceScore >= 0.40) {
                this.confidenceLevel = DataConfidenceLevel.UNCERTAIN;
            } else {
                this.confidenceLevel = DataConfidenceLevel.MANUAL_REVIEW_REQUIRED;
            }
        }

        // Getters
        public String getResponseId() { return responseId; }
        public String getRequestId() { return requestId; }
        public String getProviderId() { return providerId; }
        public Map<String, Object> getData() { return data; }
        public String getRawResponse() { return rawResponse; }
        public String getDataFormat() { return dataFormat; }
        public DataConfidenceLevel getConfidenceLevel() { return confidenceLevel; }
        public double getConfidenceScore() { return confidenceScore; }
        public Map<String, String> getNormalizedFields() { return normalizedFields; }
        public List<DataQualityFlag> getQualityFlags() { return qualityFlags; }
        public Instant getDataTimestamp() { return dataTimestamp; }
        public Instant getRetrievedAt() { return retrievedAt; }
        public String getSourceReference() { return sourceReference; }
        public boolean isVerified() { return isVerified; }
        public String getVerificationMethod() { return verificationMethod; }
        public Map<String, Object> getMetadata() { return metadata; }
    }

    /**
     * Data confidence level
     */
    public enum DataConfidenceLevel {
        HIGH,                        // 95%+ confidence
        MEDIUM,                      // 80-95% confidence
        LOW,                         // 60-80% confidence
        UNCERTAIN,                   // 40-60% confidence
        MANUAL_REVIEW_REQUIRED      // <40% confidence
    }

    /**
     * Data quality flag
     */
    public static class DataQualityFlag {
        private final String flagId;
        private String flagType;
        private String description;
        private String field;
        private FlagSeverity severity;
        private Instant flaggedAt;

        public DataQualityFlag(String flagType, String description, FlagSeverity severity) {
            this.flagId = "FLAG-" + UUID.randomUUID().toString().substring(0, 8);
            this.flagType = flagType;
            this.description = description;
            this.severity = severity;
            this.flaggedAt = Instant.now();
        }

        public enum FlagSeverity {
            INFO,
            WARNING,
            ERROR,
            CRITICAL
        }

        // Getters
        public String getFlagId() { return flagId; }
        public String getFlagType() { return flagType; }
        public String getDescription() { return description; }
        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
        public FlagSeverity getSeverity() { return severity; }
        public Instant getFlaggedAt() { return flaggedAt; }
    }

    // ==================== CACHED RESPONSE ====================

    /**
     * Cached response with TTL
     */
    private static class CachedResponse {
        private final DataResponse response;
        private final Instant cachedAt;
        private final Duration ttl;
        private final String cacheKey;

        public CachedResponse(DataResponse response, Duration ttl, String cacheKey) {
            this.response = response;
            this.cachedAt = Instant.now();
            this.ttl = ttl;
            this.cacheKey = cacheKey;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(cachedAt.plus(ttl));
        }

        public DataResponse getResponse() { return response; }
        public Instant getCachedAt() { return cachedAt; }
        public String getCacheKey() { return cacheKey; }
    }

    // ==================== RATE LIMITER ====================

    /**
     * Rate limiter for provider requests
     */
    private static class ProviderRateLimiter {
        private final String providerId;
        private final int maxRequestsPerMinute;
        private final Queue<Instant> requestTimestamps;

        public ProviderRateLimiter(String providerId, int maxRequestsPerMinute) {
            this.providerId = providerId;
            this.maxRequestsPerMinute = maxRequestsPerMinute;
            this.requestTimestamps = new LinkedList<>();
        }

        public synchronized boolean allowRequest() {
            Instant now = Instant.now();
            Instant oneMinuteAgo = now.minus(Duration.ofMinutes(1));

            // Remove timestamps older than 1 minute
            while (!requestTimestamps.isEmpty() && requestTimestamps.peek().isBefore(oneMinuteAgo)) {
                requestTimestamps.poll();
            }

            // Check if under limit
            if (requestTimestamps.size() < maxRequestsPerMinute) {
                requestTimestamps.offer(now);
                return true;
            }

            return false;
        }

        public synchronized int getCurrentRequestCount() {
            Instant now = Instant.now();
            Instant oneMinuteAgo = now.minus(Duration.ofMinutes(1));

            // Remove expired timestamps
            while (!requestTimestamps.isEmpty() && requestTimestamps.peek().isBefore(oneMinuteAgo)) {
                requestTimestamps.poll();
            }

            return requestTimestamps.size();
        }

        public synchronized int getRemainingRequests() {
            return maxRequestsPerMinute - getCurrentRequestCount();
        }
    }

    // ==================== SERVICE METHODS ====================

    /**
     * Register a new data provider
     */
    public Uni<String> registerProvider(DataProvider provider) {
        return Uni.createFrom().item(() -> {
            providers.put(provider.getProviderId(), provider);

            // Initialize rate limiter
            rateLimiters.put(
                provider.getProviderId(),
                new ProviderRateLimiter(
                    provider.getProviderId(),
                    provider.getConfig().getRateLimitPerMinute()
                )
            );

            LOG.infof("Registered provider: %s (%s) - ID: %s",
                provider.getProviderName(),
                provider.getProviderType().getDisplayName(),
                provider.getProviderId()
            );

            return provider.getProviderId();
        });
    }

    /**
     * Get provider by ID
     */
    public Uni<Optional<DataProvider>> getProvider(String providerId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(providers.get(providerId)));
    }

    /**
     * Get all providers by type
     */
    public Uni<List<DataProvider>> getProvidersByType(ProviderType type) {
        return Uni.createFrom().item(() ->
            providers.values().stream()
                .filter(p -> p.getProviderType() == type)
                .filter(p -> p.getStatus() == ProviderStatus.ACTIVE)
                .collect(Collectors.toList())
        );
    }

    /**
     * Submit a data request
     */
    public Uni<DataRequest> submitDataRequest(DataRequest request) {
        return Uni.createFrom().item(() -> {
            // Validate provider exists
            DataProvider provider = providers.get(request.getProviderId());
            if (provider == null) {
                request.markFailed("Provider not found: " + request.getProviderId());
                return request;
            }

            // Check provider status
            if (provider.getStatus() != ProviderStatus.ACTIVE) {
                request.markFailed("Provider not active: " + provider.getStatus());
                return request;
            }

            // Check cache first
            String cacheKey = generateCacheKey(request);
            CachedResponse cached = responseCache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                provider.getMetrics().recordCachedHit();
                request.markCompleted(cached.getResponse(), BigDecimal.ZERO);
                request.status = RequestStatus.CACHED;
                LOG.debugf("Cache hit for request: %s", request.getRequestId());
                return request;
            }

            // Check rate limit
            ProviderRateLimiter rateLimiter = rateLimiters.get(request.getProviderId());
            if (rateLimiter != null && !rateLimiter.allowRequest()) {
                LOG.warnf("Rate limit exceeded for provider: %s (remaining: %d)",
                    provider.getProviderName(),
                    rateLimiter.getRemainingRequests()
                );
                provider.setStatus(ProviderStatus.RATE_LIMITED);
                request.markFailed("Rate limit exceeded");
                return request;
            }

            // Add to active requests
            activeRequests.put(request.getRequestId(), request);
            request.markSubmitted();

            // Queue for processing (simulated async processing)
            requestQueue.offer(request);

            LOG.infof("Submitted data request: %s to provider: %s",
                request.getRequestId(),
                provider.getProviderName()
            );

            // Simulate async processing
            processDataRequest(request, provider);

            return request;
        });
    }

    /**
     * Process a data request (simulated external API call)
     */
    private void processDataRequest(DataRequest request, DataProvider provider) {
        try {
            request.markProcessing();
            provider.getMetrics().recordRequest();
            provider.updateLastUsed();

            Instant startTime = Instant.now();

            // Simulate API call processing time (100-500ms)
            Thread.sleep((long) (Math.random() * 400 + 100));

            // Simulate success/failure (95% success rate)
            boolean success = Math.random() > 0.05;

            if (success) {
                // Create mock response
                DataResponse response = createMockResponse(request, provider);

                Duration processingTime = Duration.between(startTime, Instant.now());
                provider.getMetrics().recordSuccess(processingTime);

                // Calculate cost
                BigDecimal cost = provider.getConfig().getCostPerRequest();
                provider.getMetrics().addCost(cost);

                request.markCompleted(response, cost);

                // Cache the response
                String cacheKey = generateCacheKey(request);
                responseCache.put(cacheKey, new CachedResponse(response, DEFAULT_CACHE_TTL, cacheKey));

                // Move to completed
                completedRequests.put(request.getRequestId(), request);
                activeRequests.remove(request.getRequestId());

                LOG.infof("Completed request: %s (confidence: %.2f, cost: %s)",
                    request.getRequestId(),
                    response.getConfidenceScore(),
                    cost
                );

            } else {
                // Simulate failure
                String errorMessage = "Provider API error: " + generateRandomError();
                provider.getMetrics().recordFailure(errorMessage);
                request.markFailed(errorMessage);

                // Retry logic
                if (request.canRetry(provider.getConfig().getMaxRetries())) {
                    request.incrementRetry();
                    LOG.warnf("Request failed, retrying: %s (attempt %d)",
                        request.getRequestId(),
                        request.getRetryCount()
                    );
                    // Re-queue for retry
                    requestQueue.offer(request);
                    processDataRequest(request, provider);
                } else {
                    completedRequests.put(request.getRequestId(), request);
                    activeRequests.remove(request.getRequestId());
                    LOG.errorf("Request failed after %d retries: %s",
                        request.getRetryCount(),
                        request.getRequestId()
                    );
                }
            }

        } catch (Exception e) {
            provider.getMetrics().recordFailure(e.getMessage());
            request.markFailed("Processing error: " + e.getMessage());
            completedRequests.put(request.getRequestId(), request);
            activeRequests.remove(request.getRequestId());
            LOG.error("Error processing request: " + request.getRequestId(), e);
        }
    }

    /**
     * Create mock response (simulates real API response)
     */
    private DataResponse createMockResponse(DataRequest request, DataProvider provider) {
        DataResponse response = new DataResponse(request.getRequestId(), provider.getProviderId());

        // Generate confidence score (70-100%)
        double confidenceScore = 0.70 + (Math.random() * 0.30);
        response.confidenceScore(confidenceScore);

        // Add mock data based on provider type
        switch (provider.getProviderType()) {
            case PROPERTY_REGISTRY:
                response.addData("propertyId", "PROP-" + UUID.randomUUID().toString().substring(0, 8))
                        .addData("ownerName", "John Doe")
                        .addData("registrationDate", Instant.now().toString())
                        .addNormalizedField("owner", "John Doe")
                        .addNormalizedField("registeredDate", Instant.now().toString());
                break;

            case CREDIT_BUREAU:
                response.addData("creditScore", 750 + (int) (Math.random() * 100))
                        .addData("reportDate", Instant.now().toString())
                        .addNormalizedField("score", "750-850")
                        .addNormalizedField("rating", "Good");
                break;

            case GOVERNMENT_ID:
                response.addData("idVerified", true)
                        .addData("verificationMethod", "Document + Biometric")
                        .addNormalizedField("verified", "true")
                        .verified(true)
                        .verificationMethod("Government ID + Facial Recognition");
                break;

            case VALUATION_DATABASE:
                response.addData("estimatedValue", BigDecimal.valueOf(500000 + (Math.random() * 500000)))
                        .addData("comparableSales", 5)
                        .addNormalizedField("value", "500000-1000000")
                        .addNormalizedField("dataSource", "MLS + Public Records");
                break;

            default:
                response.addData("dataType", request.getDataType())
                        .addData("timestamp", Instant.now().toString());
        }

        // Add quality flags based on confidence
        if (confidenceScore < 0.80) {
            response.addQualityFlag(new DataQualityFlag(
                "LOW_CONFIDENCE",
                "Data confidence below 80%",
                DataQualityFlag.FlagSeverity.WARNING
            ));
        }

        response.dataFormat("JSON")
                .dataTimestamp(Instant.now())
                .sourceReference(provider.getProviderName() + " API")
                .addMetadata("provider", provider.getProviderName())
                .addMetadata("providerType", provider.getProviderType().getDisplayName());

        return response;
    }

    /**
     * Get request status
     */
    public Uni<Optional<DataRequest>> getRequestStatus(String requestId) {
        return Uni.createFrom().item(() -> {
            DataRequest request = activeRequests.get(requestId);
            if (request == null) {
                request = completedRequests.get(requestId);
            }
            return Optional.ofNullable(request);
        });
    }

    /**
     * Get provider metrics
     */
    public Uni<Optional<ProviderMetrics>> getProviderMetrics(String providerId) {
        return Uni.createFrom().item(() -> {
            DataProvider provider = providers.get(providerId);
            return provider != null ? Optional.of(provider.getMetrics()) : Optional.empty();
        });
    }

    /**
     * Get rate limiter status
     */
    public Uni<Map<String, Object>> getRateLimiterStatus(String providerId) {
        return Uni.createFrom().item(() -> {
            ProviderRateLimiter limiter = rateLimiters.get(providerId);
            if (limiter == null) {
                return Map.of("error", "Rate limiter not found");
            }

            return Map.of(
                "providerId", providerId,
                "currentRequests", limiter.getCurrentRequestCount(),
                "remainingRequests", limiter.getRemainingRequests(),
                "maxRequestsPerMinute", limiter.maxRequestsPerMinute
            );
        });
    }

    /**
     * Clear cache for provider or specific request
     */
    public Uni<Integer> clearCache(String providerId) {
        return Uni.createFrom().item(() -> {
            int cleared = 0;
            Iterator<Map.Entry<String, CachedResponse>> iterator = responseCache.entrySet().iterator();

            while (iterator.hasNext()) {
                Map.Entry<String, CachedResponse> entry = iterator.next();
                if (entry.getValue().getResponse().getProviderId().equals(providerId)) {
                    iterator.remove();
                    cleared++;
                }
            }

            LOG.infof("Cleared %d cached responses for provider: %s", cleared, providerId);
            return cleared;
        });
    }

    /**
     * Clean expired cache entries
     */
    public Uni<Integer> cleanExpiredCache() {
        return Uni.createFrom().item(() -> {
            int cleaned = 0;
            Iterator<CachedResponse> iterator = responseCache.values().iterator();

            while (iterator.hasNext()) {
                if (iterator.next().isExpired()) {
                    iterator.remove();
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                LOG.infof("Cleaned %d expired cache entries", cleaned);
            }
            return cleaned;
        });
    }

    /**
     * Get service statistics
     */
    public Uni<Map<String, Object>> getServiceStatistics() {
        return Uni.createFrom().item(() -> {
            int totalProviders = providers.size();
            int activeProviders = (int) providers.values().stream()
                .filter(p -> p.getStatus() == ProviderStatus.ACTIVE)
                .count();

            int totalRequests = activeRequests.size() + completedRequests.size();
            int activeRequestCount = activeRequests.size();
            int completedRequestCount = completedRequests.size();

            int cacheSize = responseCache.size();

            BigDecimal totalCost = providers.values().stream()
                .map(p -> p.getMetrics().getTotalCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            return Map.of(
                "totalProviders", totalProviders,
                "activeProviders", activeProviders,
                "totalRequests", totalRequests,
                "activeRequests", activeRequestCount,
                "completedRequests", completedRequestCount,
                "cachedResponses", cacheSize,
                "totalCost", totalCost,
                "timestamp", Instant.now()
            );
        });
    }

    // ==================== HELPER METHODS ====================

    /**
     * Generate cache key for request
     */
    private String generateCacheKey(DataRequest request) {
        StringBuilder key = new StringBuilder();
        key.append(request.getProviderId()).append(":");
        key.append(request.getDataType()).append(":");

        // Sort parameters for consistent key
        request.getQueryParameters().entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> key.append(e.getKey()).append("=").append(e.getValue()).append(";"));

        return key.toString();
    }

    /**
     * Generate random error message for simulation
     */
    private String generateRandomError() {
        String[] errors = {
            "Connection timeout",
            "Invalid API key",
            "Rate limit exceeded",
            "Service unavailable",
            "Invalid request parameters",
            "Data not found",
            "Authentication failed",
            "Internal server error"
        };
        return errors[(int) (Math.random() * errors.length)];
    }

    /**
     * Initialize default providers for testing
     */
    private void initializeDefaultProviders() {
        // Property Registry Provider
        DataProvider propertyProvider = new DataProvider(ProviderType.PROPERTY_REGISTRY, "National Property Registry");
        propertyProvider.getConfig()
            .apiEndpoint("https://api.property-registry.example.com")
            .apiKey("test-api-key")
            .authType("API_KEY")
            .rateLimit(100)
            .costPerRequest(BigDecimal.valueOf(2.50));
        propertyProvider.getSupportedDataTypes().addAll(List.of("ownership", "title", "registration"));
        registerProvider(propertyProvider).await().indefinitely();

        // Credit Bureau Provider
        DataProvider creditProvider = new DataProvider(ProviderType.CREDIT_BUREAU, "TransUnion Business Credit");
        creditProvider.getConfig()
            .apiEndpoint("https://api.transunion.example.com")
            .apiKey("test-api-key")
            .authType("OAUTH2")
            .rateLimit(50)
            .costPerRequest(BigDecimal.valueOf(5.00));
        creditProvider.getSupportedDataTypes().addAll(List.of("credit-score", "credit-report", "business-credit"));
        registerProvider(creditProvider).await().indefinitely();

        // Government ID Provider
        DataProvider idProvider = new DataProvider(ProviderType.GOVERNMENT_ID, "ID Verification Services");
        idProvider.getConfig()
            .apiEndpoint("https://api.id-verify.example.com")
            .apiKey("test-api-key")
            .authType("API_KEY")
            .rateLimit(200)
            .costPerRequest(BigDecimal.valueOf(1.00));
        idProvider.getSupportedDataTypes().addAll(List.of("passport", "drivers-license", "national-id"));
        registerProvider(idProvider).await().indefinitely();

        // Valuation Database Provider
        DataProvider valuationProvider = new DataProvider(ProviderType.VALUATION_DATABASE, "Real Estate Valuation Network");
        valuationProvider.getConfig()
            .apiEndpoint("https://api.valuation.example.com")
            .apiKey("test-api-key")
            .authType("API_KEY")
            .rateLimit(75)
            .costPerRequest(BigDecimal.valueOf(10.00));
        valuationProvider.getSupportedDataTypes().addAll(List.of("market-value", "comparable-sales", "appraisal"));
        registerProvider(valuationProvider).await().indefinitely();

        LOG.info("Initialized 4 default data providers");
    }

    // ==================== GETTERS ====================

    public Map<String, DataProvider> getAllProviders() {
        return new HashMap<>(providers);
    }

    public Map<String, DataRequest> getActiveRequests() {
        return new HashMap<>(activeRequests);
    }

    public Map<String, DataRequest> getCompletedRequests() {
        return new HashMap<>(completedRequests);
    }

    public int getCacheSize() {
        return responseCache.size();
    }
}
