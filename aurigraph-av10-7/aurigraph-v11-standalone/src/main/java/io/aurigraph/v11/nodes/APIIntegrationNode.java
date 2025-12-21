package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.AbstractNode;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * APIIntegrationNode - Handles external API integrations for the Aurigraph V12 platform.
 *
 * This node type provides:
 * - External API connectivity and management
 * - Rate limiting and request throttling
 * - Circuit breaker pattern for fault tolerance
 * - Request/Response caching
 * - API health monitoring
 * - Webhook handling
 * - Data transformation and normalization
 *
 * Example integrations:
 * - Weather API (demonstration)
 * - Price feeds and oracles
 * - External blockchain APIs
 * - Enterprise system integrations
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public class APIIntegrationNode extends AbstractNode {

    private static final Logger LOG = Logger.getLogger(APIIntegrationNode.class);

    // Configuration
    private static final int MAX_CONCURRENT_REQUESTS = 100;
    private static final long REQUEST_TIMEOUT_MS = 30_000;
    private static final int MAX_RETRIES = 3;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000;
    private static final int MAX_REQUESTS_PER_WINDOW = 1000;
    private static final int CIRCUIT_BREAKER_THRESHOLD = 5;
    private static final long CIRCUIT_BREAKER_RESET_MS = 60_000;
    private static final int CACHE_MAX_SIZE = 10_000;
    private static final long CACHE_TTL_MS = 300_000; // 5 minutes

    // HTTP Client
    private HttpClient httpClient;

    // API Endpoint Registry
    private final Map<String, APIEndpoint> endpoints = new ConcurrentHashMap<>();

    // Request metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong successfulRequests = new AtomicLong(0);
    private final AtomicLong failedRequests = new AtomicLong(0);
    private final AtomicLong totalLatencyMs = new AtomicLong(0);
    private final AtomicInteger activeRequests = new AtomicInteger(0);

    // Rate limiting
    private final Map<String, RateLimitState> rateLimiters = new ConcurrentHashMap<>();

    // Circuit breakers
    private final Map<String, CircuitBreakerState> circuitBreakers = new ConcurrentHashMap<>();

    // Response cache
    private final Map<String, CachedResponse> responseCache = new ConcurrentHashMap<>();

    // Webhook handlers
    private final Map<String, WebhookHandler> webhookHandlers = new ConcurrentHashMap<>();

    // Executors
    private ExecutorService requestExecutor;
    private ScheduledExecutorService monitoringExecutor;

    public APIIntegrationNode(String nodeId) {
        super(nodeId, io.aurigraph.v11.demo.models.NodeType.BUSINESS);
    }

    @Override
    protected Uni<Void> doStart() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Starting APIIntegrationNode %s", getNodeId());

            // Initialize HTTP client with connection pooling
            httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(REQUEST_TIMEOUT_MS))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

            // Initialize request executor
            requestExecutor = Executors.newFixedThreadPool(
                Math.min(MAX_CONCURRENT_REQUESTS, Runtime.getRuntime().availableProcessors() * 4),
                r -> {
                    Thread t = new Thread(r, "api-request-" + getNodeId());
                    t.setDaemon(true);
                    return t;
                }
            );

            // Initialize monitoring executor
            monitoringExecutor = Executors.newScheduledThreadPool(2, r -> {
                Thread t = new Thread(r, "api-monitor-" + getNodeId());
                t.setDaemon(true);
                return t;
            });

            // Schedule cache cleanup
            monitoringExecutor.scheduleAtFixedRate(
                this::cleanupCache,
                60000,
                60000,
                TimeUnit.MILLISECONDS
            );

            // Schedule health checks
            monitoringExecutor.scheduleAtFixedRate(
                this::performHealthChecks,
                10000,
                30000,
                TimeUnit.MILLISECONDS
            );

            // Register default Weather API endpoint as demonstration
            registerWeatherAPI();

            LOG.infof("APIIntegrationNode %s started successfully", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<Void> doStop() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Stopping APIIntegrationNode %s", getNodeId());

            if (requestExecutor != null) {
                requestExecutor.shutdown();
                try {
                    if (!requestExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                        requestExecutor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    requestExecutor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            if (monitoringExecutor != null) {
                monitoringExecutor.shutdown();
                try {
                    if (!monitoringExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                        monitoringExecutor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    monitoringExecutor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            responseCache.clear();
            endpoints.clear();

            LOG.infof("APIIntegrationNode %s stopped", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<NodeHealth> doHealthCheck() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> components = new HashMap<>();

            // Check endpoint health
            long healthyEndpoints = endpoints.values().stream()
                .filter(ep -> ep.healthy)
                .count();
            components.put("endpoints", Map.of(
                "total", endpoints.size(),
                "healthy", healthyEndpoints,
                "healthyRatio", endpoints.isEmpty() ? 1.0 : (double) healthyEndpoints / endpoints.size()
            ));

            // Check circuit breakers
            long openCircuits = circuitBreakers.values().stream()
                .filter(cb -> cb.state == CircuitState.OPEN)
                .count();
            components.put("circuitBreakers", Map.of(
                "total", circuitBreakers.size(),
                "open", openCircuits,
                "healthy", openCircuits == 0
            ));

            // Check active requests
            components.put("activeRequests", activeRequests.get());
            components.put("requestsHealthy", activeRequests.get() < MAX_CONCURRENT_REQUESTS * 0.9);

            // Check error rate
            double errorRate = getErrorRate();
            components.put("errorRate", errorRate);
            components.put("errorRateHealthy", errorRate < 0.05);

            // Check cache status
            components.put("cacheSize", responseCache.size());
            components.put("cacheHealthy", responseCache.size() < CACHE_MAX_SIZE);

            boolean healthy = healthyEndpoints == endpoints.size()
                && openCircuits == 0
                && activeRequests.get() < MAX_CONCURRENT_REQUESTS * 0.9
                && errorRate < 0.05;

            return new NodeHealth(
                healthy ? io.aurigraph.v11.demo.models.NodeStatus.RUNNING : io.aurigraph.v11.demo.models.NodeStatus.ERROR,
                healthy,
                getUptimeSeconds(),
                components
            );
        });
    }

    @Override
    protected Uni<NodeMetrics> doGetMetrics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> customMetrics = new HashMap<>();
            customMetrics.put("totalRequests", totalRequests.get());
            customMetrics.put("successfulRequests", successfulRequests.get());
            customMetrics.put("failedRequests", failedRequests.get());
            customMetrics.put("activeRequests", activeRequests.get());
            customMetrics.put("registeredEndpoints", endpoints.size());
            customMetrics.put("healthyEndpoints", endpoints.values().stream().filter(ep -> ep.healthy).count());
            customMetrics.put("openCircuitBreakers", circuitBreakers.values().stream()
                .filter(cb -> cb.state == CircuitState.OPEN).count());
            customMetrics.put("cacheSize", responseCache.size());
            customMetrics.put("cacheHitRate", getCacheHitRate());
            customMetrics.put("webhookHandlers", webhookHandlers.size());
            customMetrics.put("errorRate", getErrorRate());

            // Calculate average latency
            long requests = totalRequests.get();
            double avgLatency = requests > 0 ? (double) totalLatencyMs.get() / requests : 0;

            // Calculate requests per second
            long uptime = getUptimeSeconds();
            double rps = uptime > 0 ? (double) totalRequests.get() / uptime : 0;

            return new NodeMetrics(rps, avgLatency, 0, 0, customMetrics);
        });
    }

    // ============================================
    // WEATHER API INTEGRATION (DEMONSTRATION)
    // ============================================

    /**
     * Register the Weather API endpoint for demonstration purposes.
     * Uses Open-Meteo free weather API (no API key required).
     */
    private void registerWeatherAPI() {
        APIEndpoint weatherEndpoint = new APIEndpoint(
            "weather-api",
            "https://api.open-meteo.com/v1/forecast",
            "GET",
            Map.of("Content-Type", "application/json")
        );
        weatherEndpoint.description = "Open-Meteo Weather API for demonstration";
        weatherEndpoint.rateLimit = 60; // requests per minute
        endpoints.put("weather-api", weatherEndpoint);
        initCircuitBreaker("weather-api");
        initRateLimiter("weather-api", 60, RATE_LIMIT_WINDOW_MS);

        LOG.infof("Registered Weather API endpoint for demonstration");
    }

    /**
     * Get current weather data for a location.
     *
     * @param latitude the latitude coordinate
     * @param longitude the longitude coordinate
     * @return CompletableFuture with weather data
     */
    public CompletableFuture<WeatherData> getWeather(double latitude, double longitude) {
        String endpointId = "weather-api";
        String cacheKey = String.format("weather:%.4f:%.4f", latitude, longitude);

        // Check cache first
        CachedResponse cached = responseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return CompletableFuture.completedFuture(parseWeatherResponse(cached.body));
        }

        // Build URL with parameters
        String url = String.format(
            "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto",
            latitude, longitude
        );

        return executeRequest(endpointId, url, "GET", null, null)
            .thenApply(response -> {
                // Cache the response
                responseCache.put(cacheKey, new CachedResponse(response.body, CACHE_TTL_MS));
                return parseWeatherResponse(response.body);
            });
    }

    /**
     * Get weather forecast for a location.
     *
     * @param latitude the latitude coordinate
     * @param longitude the longitude coordinate
     * @param days number of forecast days (1-16)
     * @return CompletableFuture with forecast data
     */
    public CompletableFuture<List<WeatherData>> getWeatherForecast(double latitude, double longitude, int days) {
        String endpointId = "weather-api";
        int forecastDays = Math.min(Math.max(days, 1), 16);
        String cacheKey = String.format("forecast:%.4f:%.4f:%d", latitude, longitude, forecastDays);

        // Check cache first
        CachedResponse cached = responseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return CompletableFuture.completedFuture(parseForecastResponse(cached.body));
        }

        // Build URL with parameters
        String url = String.format(
            "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=%d&timezone=auto",
            latitude, longitude, forecastDays
        );

        return executeRequest(endpointId, url, "GET", null, null)
            .thenApply(response -> {
                // Cache the response
                responseCache.put(cacheKey, new CachedResponse(response.body, CACHE_TTL_MS));
                return parseForecastResponse(response.body);
            });
    }

    /**
     * Parse weather API response into WeatherData object.
     */
    private WeatherData parseWeatherResponse(String jsonResponse) {
        // Simple JSON parsing (in production, use Jackson or Gson)
        WeatherData data = new WeatherData();
        data.timestamp = Instant.now();

        try {
            // Extract temperature
            int tempIndex = jsonResponse.indexOf("\"temperature_2m\":");
            if (tempIndex >= 0) {
                int start = tempIndex + 17;
                int end = jsonResponse.indexOf(",", start);
                if (end < 0) end = jsonResponse.indexOf("}", start);
                data.temperature = Double.parseDouble(jsonResponse.substring(start, end).trim());
            }

            // Extract humidity
            int humidityIndex = jsonResponse.indexOf("\"relative_humidity_2m\":");
            if (humidityIndex >= 0) {
                int start = humidityIndex + 23;
                int end = jsonResponse.indexOf(",", start);
                if (end < 0) end = jsonResponse.indexOf("}", start);
                data.humidity = Double.parseDouble(jsonResponse.substring(start, end).trim());
            }

            // Extract wind speed
            int windIndex = jsonResponse.indexOf("\"wind_speed_10m\":");
            if (windIndex >= 0) {
                int start = windIndex + 17;
                int end = jsonResponse.indexOf(",", start);
                if (end < 0) end = jsonResponse.indexOf("}", start);
                data.windSpeed = Double.parseDouble(jsonResponse.substring(start, end).trim());
            }

            // Extract weather code
            int codeIndex = jsonResponse.indexOf("\"weather_code\":");
            if (codeIndex >= 0) {
                int start = codeIndex + 15;
                int end = jsonResponse.indexOf(",", start);
                if (end < 0) end = jsonResponse.indexOf("}", start);
                int weatherCode = Integer.parseInt(jsonResponse.substring(start, end).trim());
                data.description = getWeatherDescription(weatherCode);
            }
        } catch (Exception e) {
            LOG.warnf(e, "Error parsing weather response");
            data.description = "Unknown";
        }

        return data;
    }

    /**
     * Parse forecast API response into list of WeatherData objects.
     */
    private List<WeatherData> parseForecastResponse(String jsonResponse) {
        List<WeatherData> forecasts = new ArrayList<>();

        // Simple extraction of daily data
        try {
            // Extract max temperatures
            int maxTempIndex = jsonResponse.indexOf("\"temperature_2m_max\":[");
            if (maxTempIndex >= 0) {
                int start = maxTempIndex + 22;
                int end = jsonResponse.indexOf("]", start);
                String[] maxTemps = jsonResponse.substring(start, end).split(",");

                // Extract min temperatures
                int minTempIndex = jsonResponse.indexOf("\"temperature_2m_min\":[");
                start = minTempIndex + 22;
                end = jsonResponse.indexOf("]", start);
                String[] minTemps = jsonResponse.substring(start, end).split(",");

                for (int i = 0; i < maxTemps.length && i < minTemps.length; i++) {
                    WeatherData data = new WeatherData();
                    data.timestamp = Instant.now().plus(java.time.Duration.ofDays(i));
                    data.temperature = (Double.parseDouble(maxTemps[i].trim()) +
                                        Double.parseDouble(minTemps[i].trim())) / 2;
                    data.maxTemperature = Double.parseDouble(maxTemps[i].trim());
                    data.minTemperature = Double.parseDouble(minTemps[i].trim());
                    data.description = "Forecast Day " + (i + 1);
                    forecasts.add(data);
                }
            }
        } catch (Exception e) {
            LOG.warnf(e, "Error parsing forecast response");
        }

        return forecasts;
    }

    /**
     * Convert weather code to description.
     */
    private String getWeatherDescription(int code) {
        return switch (code) {
            case 0 -> "Clear sky";
            case 1, 2, 3 -> "Partly cloudy";
            case 45, 48 -> "Fog";
            case 51, 53, 55 -> "Drizzle";
            case 61, 63, 65 -> "Rain";
            case 71, 73, 75 -> "Snow";
            case 80, 81, 82 -> "Rain showers";
            case 95 -> "Thunderstorm";
            case 96, 99 -> "Thunderstorm with hail";
            default -> "Unknown";
        };
    }

    // ============================================
    // GENERIC API REQUEST HANDLING
    // ============================================

    /**
     * Register an API endpoint.
     */
    public void registerEndpoint(String endpointId, String baseUrl, String method, Map<String, String> headers) {
        APIEndpoint endpoint = new APIEndpoint(endpointId, baseUrl, method, headers);
        endpoints.put(endpointId, endpoint);
        initCircuitBreaker(endpointId);
        initRateLimiter(endpointId, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
        LOG.infof("Registered API endpoint: %s -> %s", endpointId, baseUrl);
    }

    /**
     * Execute an API request.
     */
    public CompletableFuture<APIResponse> executeRequest(String endpointId, String url, String method,
                                                          Map<String, String> headers, String body) {
        return CompletableFuture.supplyAsync(() -> {
            // Check circuit breaker
            if (!checkCircuitBreaker(endpointId)) {
                failedRequests.incrementAndGet();
                throw new APIException("Circuit breaker open for: " + endpointId);
            }

            // Check rate limit
            if (!checkRateLimit(endpointId)) {
                failedRequests.incrementAndGet();
                throw new APIException("Rate limit exceeded for: " + endpointId);
            }

            activeRequests.incrementAndGet();
            long startTime = System.currentTimeMillis();

            try {
                // Build request
                HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(REQUEST_TIMEOUT_MS));

                // Add headers
                if (headers != null) {
                    headers.forEach(requestBuilder::header);
                }

                // Set method and body
                if ("POST".equalsIgnoreCase(method) && body != null) {
                    requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body));
                } else if ("PUT".equalsIgnoreCase(method) && body != null) {
                    requestBuilder.PUT(HttpRequest.BodyPublishers.ofString(body));
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    requestBuilder.DELETE();
                } else {
                    requestBuilder.GET();
                }

                // Execute request with retries
                HttpResponse<String> response = null;
                Exception lastException = null;

                for (int retry = 0; retry < MAX_RETRIES; retry++) {
                    try {
                        response = httpClient.send(requestBuilder.build(),
                            HttpResponse.BodyHandlers.ofString());
                        break;
                    } catch (IOException | InterruptedException e) {
                        lastException = e;
                        if (retry < MAX_RETRIES - 1) {
                            Thread.sleep(1000 * (retry + 1)); // Exponential backoff
                        }
                    }
                }

                if (response == null) {
                    failedRequests.incrementAndGet();
                    recordCircuitBreakerFailure(endpointId);
                    throw new APIException("Request failed after retries", lastException);
                }

                // Record success
                totalRequests.incrementAndGet();
                successfulRequests.incrementAndGet();
                totalLatencyMs.addAndGet(System.currentTimeMillis() - startTime);
                resetCircuitBreaker(endpointId);

                // Update endpoint stats
                APIEndpoint endpoint = endpoints.get(endpointId);
                if (endpoint != null) {
                    endpoint.successCount++;
                    endpoint.lastCalled = Instant.now();
                    endpoint.healthy = true;
                }

                return new APIResponse(endpointId, response.statusCode(), response.body(),
                    System.currentTimeMillis() - startTime);

            } catch (Exception e) {
                totalRequests.incrementAndGet();
                failedRequests.incrementAndGet();
                recordCircuitBreakerFailure(endpointId);

                APIEndpoint endpoint = endpoints.get(endpointId);
                if (endpoint != null) {
                    endpoint.errorCount++;
                }

                throw new APIException("API request failed: " + e.getMessage(), e);
            } finally {
                activeRequests.decrementAndGet();
            }
        }, requestExecutor);
    }

    /**
     * Execute a request with caching.
     */
    public CompletableFuture<APIResponse> executeRequestWithCache(String endpointId, String url, String method,
                                                                   Map<String, String> headers, String body,
                                                                   String cacheKey, long cacheTtlMs) {
        // Check cache first
        CachedResponse cached = responseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return CompletableFuture.completedFuture(
                new APIResponse(endpointId, 200, cached.body, 0));
        }

        return executeRequest(endpointId, url, method, headers, body)
            .thenApply(response -> {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    responseCache.put(cacheKey, new CachedResponse(response.body, cacheTtlMs));
                }
                return response;
            });
    }

    // ============================================
    // WEBHOOK HANDLING
    // ============================================

    /**
     * Register a webhook handler.
     */
    public void registerWebhook(String webhookId, String path, WebhookCallback callback) {
        webhookHandlers.put(webhookId, new WebhookHandler(webhookId, path, callback));
        LOG.infof("Registered webhook handler: %s at %s", webhookId, path);
    }

    /**
     * Process an incoming webhook.
     */
    public CompletableFuture<WebhookResponse> processWebhook(String webhookId, Map<String, String> headers,
                                                              String body) {
        return CompletableFuture.supplyAsync(() -> {
            WebhookHandler handler = webhookHandlers.get(webhookId);
            if (handler == null) {
                return new WebhookResponse(404, "Webhook not found: " + webhookId);
            }

            try {
                handler.callCount++;
                handler.lastCalled = Instant.now();
                Object result = handler.callback.handle(headers, body);
                return new WebhookResponse(200, result != null ? result.toString() : "OK");
            } catch (Exception e) {
                handler.errorCount++;
                LOG.errorf(e, "Webhook handler error: %s", webhookId);
                return new WebhookResponse(500, "Handler error: " + e.getMessage());
            }
        }, requestExecutor);
    }

    // ============================================
    // RATE LIMITING
    // ============================================

    private void initRateLimiter(String endpointId, int maxRequests, long windowMs) {
        rateLimiters.put(endpointId, new RateLimitState(maxRequests, windowMs));
    }

    private boolean checkRateLimit(String endpointId) {
        RateLimitState limiter = rateLimiters.get(endpointId);
        if (limiter == null) return true;

        long now = System.currentTimeMillis();
        synchronized (limiter) {
            // Reset window if expired
            if (now - limiter.windowStart >= limiter.windowMs) {
                limiter.windowStart = now;
                limiter.requestCount = 0;
            }

            if (limiter.requestCount >= limiter.maxRequests) {
                return false;
            }

            limiter.requestCount++;
            return true;
        }
    }

    // ============================================
    // CIRCUIT BREAKER
    // ============================================

    private void initCircuitBreaker(String endpointId) {
        circuitBreakers.put(endpointId, new CircuitBreakerState());
    }

    private boolean checkCircuitBreaker(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) return true;

        if (cb.state == CircuitState.OPEN) {
            if (System.currentTimeMillis() - cb.lastStateChange > CIRCUIT_BREAKER_RESET_MS) {
                cb.state = CircuitState.HALF_OPEN;
                cb.lastStateChange = System.currentTimeMillis();
                return true;
            }
            return false;
        }
        return true;
    }

    private void recordCircuitBreakerFailure(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) return;

        cb.failureCount++;
        if (cb.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
            cb.state = CircuitState.OPEN;
            cb.lastStateChange = System.currentTimeMillis();
            LOG.warnf("Circuit breaker OPEN for: %s", endpointId);

            APIEndpoint endpoint = endpoints.get(endpointId);
            if (endpoint != null) {
                endpoint.healthy = false;
            }
        }
    }

    private void resetCircuitBreaker(String endpointId) {
        CircuitBreakerState cb = circuitBreakers.get(endpointId);
        if (cb == null) return;

        if (cb.state == CircuitState.HALF_OPEN) {
            cb.state = CircuitState.CLOSED;
            cb.lastStateChange = System.currentTimeMillis();
            LOG.infof("Circuit breaker CLOSED for: %s", endpointId);
        }
        cb.failureCount = 0;
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    private void cleanupCache() {
        responseCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    public void clearCache() {
        responseCache.clear();
        LOG.infof("Response cache cleared for node %s", getNodeId());
    }

    public void invalidateCache(String pattern) {
        responseCache.entrySet().removeIf(entry -> entry.getKey().contains(pattern));
    }

    // ============================================
    // HEALTH MONITORING
    // ============================================

    private void performHealthChecks() {
        for (APIEndpoint endpoint : endpoints.values()) {
            // Simple liveness check based on recent activity
            if (endpoint.lastCalled != null) {
                long sinceLastCall = System.currentTimeMillis() -
                    endpoint.lastCalled.toEpochMilli();
                // Mark as potentially unhealthy if no calls in 5 minutes and has errors
                if (sinceLastCall > 300000 && endpoint.errorCount > endpoint.successCount) {
                    endpoint.healthy = false;
                }
            }
        }
    }

    // ============================================
    // METRICS HELPERS
    // ============================================

    private double getErrorRate() {
        long total = successfulRequests.get() + failedRequests.get();
        return total > 0 ? (double) failedRequests.get() / total : 0;
    }

    private double getCacheHitRate() {
        // Simplified - would track hits/misses in production
        return responseCache.isEmpty() ? 0 : 0.8; // Placeholder
    }

    // ============================================
    // PUBLIC GETTERS
    // ============================================

    public Map<String, APIEndpoint> getEndpoints() {
        return Map.copyOf(endpoints);
    }

    public int getActiveRequestCount() {
        return activeRequests.get();
    }

    public long getTotalRequests() {
        return totalRequests.get();
    }

    // ============================================
    // INNER CLASSES
    // ============================================

    public static class APIEndpoint {
        public final String endpointId;
        public final String baseUrl;
        public final String method;
        public final Map<String, String> headers;
        public String description;
        public int rateLimit;
        public volatile boolean healthy = true;
        public Instant lastCalled;
        public long successCount = 0;
        public long errorCount = 0;

        public APIEndpoint(String endpointId, String baseUrl, String method, Map<String, String> headers) {
            this.endpointId = endpointId;
            this.baseUrl = baseUrl;
            this.method = method;
            this.headers = headers != null ? new HashMap<>(headers) : new HashMap<>();
        }
    }

    public static class APIResponse {
        public final String endpointId;
        public final int statusCode;
        public final String body;
        public final long latencyMs;

        public APIResponse(String endpointId, int statusCode, String body, long latencyMs) {
            this.endpointId = endpointId;
            this.statusCode = statusCode;
            this.body = body;
            this.latencyMs = latencyMs;
        }
    }

    public static class WeatherData {
        public Instant timestamp;
        public double temperature;
        public double maxTemperature;
        public double minTemperature;
        public double humidity;
        public double windSpeed;
        public String description;

        @Override
        public String toString() {
            return String.format("WeatherData{temp=%.1f, humidity=%.1f%%, wind=%.1fm/s, desc='%s'}",
                temperature, humidity, windSpeed, description);
        }
    }

    public static class CachedResponse {
        public final String body;
        public final long expiresAt;

        public CachedResponse(String body, long ttlMs) {
            this.body = body;
            this.expiresAt = System.currentTimeMillis() + ttlMs;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    public static class WebhookHandler {
        public final String webhookId;
        public final String path;
        public final WebhookCallback callback;
        public Instant lastCalled;
        public long callCount = 0;
        public long errorCount = 0;

        public WebhookHandler(String webhookId, String path, WebhookCallback callback) {
            this.webhookId = webhookId;
            this.path = path;
            this.callback = callback;
        }
    }

    public static class WebhookResponse {
        public final int statusCode;
        public final String body;

        public WebhookResponse(int statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    @FunctionalInterface
    public interface WebhookCallback {
        Object handle(Map<String, String> headers, String body) throws Exception;
    }

    public static class APIException extends RuntimeException {
        public APIException(String message) {
            super(message);
        }

        public APIException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private enum CircuitState {
        CLOSED, OPEN, HALF_OPEN
    }

    private static class CircuitBreakerState {
        CircuitState state = CircuitState.CLOSED;
        int failureCount = 0;
        long lastStateChange = System.currentTimeMillis();
    }

    private static class RateLimitState {
        final int maxRequests;
        final long windowMs;
        long windowStart = System.currentTimeMillis();
        int requestCount = 0;

        RateLimitState(int maxRequests, long windowMs) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
        }
    }
}
