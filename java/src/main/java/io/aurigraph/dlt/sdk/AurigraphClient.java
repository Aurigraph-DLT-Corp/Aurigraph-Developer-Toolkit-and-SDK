package io.aurigraph.dlt.sdk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.dlt.sdk.exception.AurigraphException;
import io.aurigraph.dlt.sdk.namespace.ChannelsApi;
import io.aurigraph.dlt.sdk.namespace.ComplianceApi;
import io.aurigraph.dlt.sdk.namespace.ContractsApi;
import io.aurigraph.dlt.sdk.namespace.DmrvApi;
import io.aurigraph.dlt.sdk.namespace.GdprApi;
import io.aurigraph.dlt.sdk.namespace.AssetsApi;
import io.aurigraph.dlt.sdk.namespace.GovernanceApi;
import io.aurigraph.dlt.sdk.namespace.GraphQLApi;
import io.aurigraph.dlt.sdk.namespace.NodesApi;
import io.aurigraph.dlt.sdk.namespace.RegistriesApi;
import io.aurigraph.dlt.sdk.namespace.SdkHandshakeApi;
import io.aurigraph.dlt.sdk.namespace.TierApi;
import io.aurigraph.dlt.sdk.namespace.TransactionsApi;
import io.aurigraph.dlt.sdk.namespace.WalletApi;
import io.aurigraph.dlt.sdk.queue.OfflineQueue;
import io.aurigraph.dlt.sdk.util.IdempotencyKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * Official Java SDK for the Aurigraph DLT V12 platform (V11 API).
 *
 * <p>Uses {@link java.net.http.HttpClient} — zero external HTTP dependencies
 * beyond Jackson (JSON) and SLF4J (logging).
 *
 * <h2>Quickstart</h2>
 * <pre>{@code
 * AurigraphClient client = AurigraphClient.builder()
 *     .baseUrl("https://dlt.aurigraph.io")
 *     .apiKey(System.getenv("AURIGRAPH_API_KEY"))
 *     .build();
 *
 * HealthResponse health = client.health();
 * PlatformStats stats = client.stats();
 * NodeList nodes = client.nodes().list(0, 100);
 * }</pre>
 */
public class AurigraphClient {

    private static final Logger LOG = LoggerFactory.getLogger(AurigraphClient.class);
    private static final String API_PREFIX = "/api/v11";

    private final String baseUrl;
    private final String appId;
    private final String rawApiKey;
    private final String legacyApiKey;
    private final String jwtToken;
    private final String clientVersion;
    private final Duration timeout;
    private final int maxRetries;
    private final HttpClient http;
    private final ObjectMapper mapper;
    private boolean legacyWarned = false;
    private final ScheduledExecutorService heartbeatExecutor;

    // ── Namespaces ────────────────────────────────────────────────────────────

    private final NodesApi nodesApi;
    private final RegistriesApi registriesApi;
    private final ChannelsApi channelsApi;
    private final TransactionsApi transactionsApi;
    private final DmrvApi dmrvApi;
    private final ContractsApi contractsApi;
    private final GdprApi gdprApi;
    private final GraphQLApi graphQLApi;
    private final TierApi tierApi;
    private final AssetsApi assetsApi;
    private final GovernanceApi governanceApi;
    private final WalletApi walletApi;
    private final ComplianceApi complianceApi;
    private SdkHandshakeApi sdkHandshakeApi;
    private final OfflineQueue offlineQueue;
    private final boolean enableQueue;
    private final boolean autoIdempotency;

    private AurigraphClient(Builder b) {
        if (b.baseUrl == null || b.baseUrl.isBlank()) {
            throw new AurigraphException.ConfigError("AurigraphClient: baseUrl is required");
        }
        this.baseUrl = b.baseUrl.replaceAll("/+$", "");
        this.appId = b.appId;
        this.rawApiKey = b.rawApiKey;
        this.legacyApiKey = b.legacyApiKey;
        this.jwtToken = b.jwtToken;
        this.clientVersion = b.clientVersion != null ? b.clientVersion : "aurigraph-java-sdk/unknown";
        this.timeout = b.timeout != null ? b.timeout : Duration.ofSeconds(10);
        this.maxRetries = b.maxRetries > 0 ? b.maxRetries : 3;
        this.http = b.httpClient != null ? b.httpClient : HttpClient.newBuilder()
                .connectTimeout(this.timeout)
                .build();
        this.mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        this.nodesApi = new NodesApi(this);
        this.registriesApi = new RegistriesApi(this);
        this.channelsApi = new ChannelsApi(this);
        this.transactionsApi = new TransactionsApi(this);
        this.dmrvApi = new DmrvApi(this);
        this.contractsApi = new ContractsApi(this);
        this.gdprApi = new GdprApi(this);
        this.graphQLApi = new GraphQLApi(this);
        this.tierApi = new TierApi(this);
        this.assetsApi = new AssetsApi(this);
        this.governanceApi = new GovernanceApi(this);
        this.walletApi = new WalletApi(this);
        this.complianceApi = new ComplianceApi(this);

        this.enableQueue = b.enableQueue;
        this.autoIdempotency = b.autoIdempotency != null ? b.autoIdempotency : b.enableQueue;
        this.offlineQueue = b.enableQueue
                ? (b.offlineQueue != null ? b.offlineQueue : new OfflineQueue(b.queueMaxSize > 0 ? b.queueMaxSize : 1000))
                : null;
        if (this.offlineQueue != null) {
            this.offlineQueue.setFlushHandler(op -> {
                // Replay through the private internal request path, skipping re-enqueue.
                replayQueued(op.method, op.path, op.body, op.idempotencyKey);
            });
        }

        // ── Auto-heartbeat scheduler (handshake only — requires appId+rawKey) ─
        if (b.autoHeartbeatInterval != null && appId != null && rawApiKey != null) {
            this.heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "aurigraph-sdk-heartbeat");
                t.setDaemon(true);  // don't block JVM shutdown
                return t;
            });
            final long intervalMs = b.autoHeartbeatInterval.toMillis();
            this.heartbeatExecutor.scheduleAtFixedRate(
                    () -> {
                        try {
                            sdk().heartbeat(clientVersion);
                        } catch (Exception ignored) {
                            // Swallow — heartbeat failures must not crash the scheduler.
                        }
                    },
                    intervalMs,
                    intervalMs,
                    TimeUnit.MILLISECONDS
            );
        } else {
            this.heartbeatExecutor = null;
        }
    }

    private void replayQueued(String method, String path, Object body, String idempotencyKey) {
        requestInternal(method, path, body, Object.class, null, idempotencyKey, true);
    }

    public static Builder builder() {
        return new Builder();
    }

    // ── Public namespace accessors ────────────────────────────────────────────

    public NodesApi nodes() { return nodesApi; }
    public RegistriesApi registries() { return registriesApi; }
    public ChannelsApi channels() { return channelsApi; }
    public TransactionsApi transactions() { return transactionsApi; }
    public DmrvApi dmrv() { return dmrvApi; }
    public ContractsApi contracts() { return contractsApi; }
    public GdprApi gdpr() { return gdprApi; }
    public GraphQLApi graphql() { return graphQLApi; }
    public TierApi tier() { return tierApi; }
    /** Asset-agnostic RWA operations — works with any asset type. */
    public AssetsApi assets() { return assetsApi; }
    public GovernanceApi governance() { return governanceApi; }
    public WalletApi wallet() { return walletApi; }
    public ComplianceApi compliance() { return complianceApi; }

    /** SDK handshake namespace (hello / heartbeat / capabilities / config). */
    public SdkHandshakeApi sdk() {
        if (sdkHandshakeApi == null) {
            sdkHandshakeApi = new SdkHandshakeApi(this);
        }
        return sdkHandshakeApi;
    }

    /** Stops the auto-heartbeat scheduler (if any). Safe to call multiple times. */
    public void close() {
        if (heartbeatExecutor != null) {
            heartbeatExecutor.shutdownNow();
        }
    }

    /** Offline queue (null if enableQueue was false). */
    public OfflineQueue queue() { return offlineQueue; }

    // ── Top-level convenience shortcuts ───────────────────────────────────────

    public io.aurigraph.dlt.sdk.dto.HealthResponse health() {
        return get("/health", io.aurigraph.dlt.sdk.dto.HealthResponse.class);
    }

    public io.aurigraph.dlt.sdk.dto.PlatformStats stats() {
        return get("/stats", io.aurigraph.dlt.sdk.dto.PlatformStats.class);
    }

    // ── Core request methods (used by namespace classes) ─────────────────────

    public <T> T get(String path, Class<T> type) {
        return request("GET", path, null, type, null);
    }

    public <T> T get(String path, TypeReference<T> type) {
        return request("GET", path, null, null, type);
    }

    public <T> T post(String path, Object body, Class<T> type) {
        return request("POST", path, body, type, null);
    }

    public <T> T post(String path, Object body, TypeReference<T> type) {
        return request("POST", path, body, null, type);
    }

    public <T> T put(String path, Object body, Class<T> type) {
        return request("PUT", path, body, type, null);
    }

    public <T> T put(String path, Object body, TypeReference<T> type) {
        return request("PUT", path, body, null, type);
    }

    public void delete(String path) {
        request("DELETE", path, null, Void.class, null);
    }

    public <T> T delete(String path, Class<T> type) {
        return request("DELETE", path, null, type, null);
    }

    private <T> T request(String method, String path, Object body, Class<T> cls, TypeReference<T> ref) {
        return requestInternal(method, path, body, cls, ref, null, false);
    }

    @SuppressWarnings("unchecked")
    private <T> T requestInternal(String method, String path, Object body, Class<T> cls,
                                   TypeReference<T> ref, String providedIdempotencyKey,
                                   boolean skipQueue) {
        String url = baseUrl + API_PREFIX + (path.startsWith("/") ? path : "/" + path);

        // Auto-generate idempotency key for mutating requests if enabled.
        final boolean isMutating = !"GET".equalsIgnoreCase(method);
        String idempotencyKey = providedIdempotencyKey;
        if (isMutating && autoIdempotency && idempotencyKey == null) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("method", method);
            payload.put("path", path);
            payload.put("body", body);
            idempotencyKey = IdempotencyKey.generate(payload);
        }
        final String finalKey = idempotencyKey;
        String jsonBody = null;
        if (body != null) {
            try {
                jsonBody = mapper.writeValueAsString(body);
            } catch (Exception e) {
                throw new AurigraphException("Failed to serialize request body: " + e.getMessage(),
                        0, null, url, e);
            }
        }

        AurigraphException lastError = null;
        try {
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(timeout);
                withAuth(reqBuilder);
                if (finalKey != null) {
                    reqBuilder.header("Idempotency-Key", finalKey);
                }
                if (jsonBody != null) {
                    reqBuilder.method(method, HttpRequest.BodyPublishers.ofString(jsonBody));
                } else {
                    reqBuilder.method(method, HttpRequest.BodyPublishers.noBody());
                }

                LOG.debug("→ [attempt {}/{}] {} {}", attempt, maxRetries, method, url);
                HttpResponse<String> resp = http.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
                int status = resp.statusCode();
                String respBody = resp.body();
                LOG.debug("← {} {} {} ({} bytes)", status, method, url,
                        respBody != null ? respBody.length() : 0);

                if (status >= 200 && status < 300) {
                    if (respBody == null || respBody.isEmpty()) {
                        return null;
                    }
                    try {
                        if (cls != null) {
                            return mapper.readValue(respBody, cls);
                        } else {
                            return mapper.readValue(respBody, ref);
                        }
                    } catch (Exception e) {
                        throw new AurigraphException("Failed to deserialize response: " + e.getMessage(),
                                status, null, url, e);
                    }
                }

                Map<String, Object> problem = parseProblem(respBody);
                String title = problem != null && problem.get("title") != null
                        ? problem.get("title").toString() : "";
                String msg = method + " " + path + " failed: " + status + " " + title;

                if (status >= 400 && status < 500) {
                    throw new AurigraphException.ClientError(msg, status, problem, url);
                }
                lastError = new AurigraphException.ServerError(msg, status, problem, url);
                if (attempt < maxRetries) {
                    backoff(attempt);
                    continue;
                }
                throw lastError;
            } catch (AurigraphException.ClientError e) {
                throw e; // 4xx — never retry
            } catch (AurigraphException.ServerError e) {
                lastError = e;
                if (attempt < maxRetries) {
                    backoff(attempt);
                    continue;
                }
                throw e;
            } catch (AurigraphException e) {
                throw e; // config/serialization — do not retry
            } catch (Exception e) {
                lastError = new AurigraphException.NetworkError(
                        method + " " + path + " network error: " + e.getMessage(), url, e);
                if (attempt < maxRetries) {
                    LOG.debug("  network error, retrying: {}", e.getMessage());
                    backoff(attempt);
                    continue;
                }
                throw lastError;
            }
        }
        throw lastError != null ? lastError
                : new AurigraphException.NetworkError("request failed with no error", url, null);
        } catch (AurigraphException finalErr) {
            // Enqueue mutating failures on 5xx / network errors — never on 4xx.
            if (!(finalErr instanceof AurigraphException.ClientError)
                    && !skipQueue && enableQueue && offlineQueue != null && isMutating) {
                offlineQueue.enqueue(method, path, body, finalKey);
            }
            throw finalErr;
        }
    }

    /**
     * Applies auth + content-type headers to a request builder.
     *
     * <p>Precedence:
     * <ol>
     *   <li>JWT {@code Authorization: Bearer <token>}
     *   <li>Paired API key {@code Authorization: ApiKey <appId>:<rawKey>}
     *       (canonical — matches backend {@code SdkApiKeyAuthFilter})
     *   <li>Legacy single-arg API key {@code X-API-Key: <rawKey>} (deprecated)
     * </ol>
     */
    private HttpRequest.Builder withAuth(HttpRequest.Builder req) {
        if (jwtToken != null && !jwtToken.isBlank()) {
            req.header("Authorization", "Bearer " + jwtToken);
        } else if (appId != null && rawApiKey != null) {
            req.header("Authorization", "ApiKey " + appId + ":" + rawApiKey);
        } else if (legacyApiKey != null && !legacyApiKey.isBlank()) {
            if (!legacyWarned) {
                System.err.println("[aurigraph-sdk] Deprecated: apiKey(String) uses "
                        + "X-API-Key header. Production 3rd-party auth requires "
                        + "apiKey(appId, rawKey) — see handshake docs.");
                legacyWarned = true;
            }
            req.header("X-API-Key", legacyApiKey);
        }
        req.header("Content-Type", "application/json");
        req.header("Accept", "application/json");
        return req;
    }

    private Map<String, Object> parseProblem(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            JsonNode node = mapper.readTree(body);
            if (node.isObject()) {
                Map<String, Object> out = new LinkedHashMap<>();
                Iterator<Map.Entry<String, JsonNode>> it = node.fields();
                while (it.hasNext()) {
                    Map.Entry<String, JsonNode> e = it.next();
                    JsonNode v = e.getValue();
                    if (v.isTextual()) out.put(e.getKey(), v.asText());
                    else if (v.isNumber()) out.put(e.getKey(), v.numberValue());
                    else if (v.isBoolean()) out.put(e.getKey(), v.booleanValue());
                    else out.put(e.getKey(), v.toString());
                }
                return out;
            }
        } catch (Exception ignored) {
            // non-JSON error body
        }
        return null;
    }

    private void backoff(int attempt) {
        long base = 200L * (1L << (attempt - 1));
        long jitter = ThreadLocalRandom.current().nextLong(0, 100);
        long delay = base + jitter;
        LOG.debug("  backing off {}ms before retry", delay);
        try {
            Thread.sleep(delay);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    public ObjectMapper mapper() {
        return mapper;
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static class Builder {
        private String baseUrl;
        private String appId;
        private String rawApiKey;
        private String legacyApiKey;
        private String jwtToken;
        private String clientVersion;
        private Duration timeout;
        private int maxRetries;
        private HttpClient httpClient;
        private boolean enableQueue;
        private Boolean autoIdempotency;
        private int queueMaxSize;
        private OfflineQueue offlineQueue;
        private Duration autoHeartbeatInterval;

        public Builder baseUrl(String baseUrl) { this.baseUrl = baseUrl; return this; }

        /**
         * Canonical API key auth — paired {@code appId} + {@code rawKey}.
         * <p>Produces header {@code Authorization: ApiKey <appId>:<rawKey>}
         * matching backend {@code SdkApiKeyAuthFilter}.
         */
        public Builder apiKey(String appId, String rawKey) {
            this.appId = appId;
            this.rawApiKey = rawKey;
            return this;
        }

        /**
         * Legacy single-argument API key — sends {@code X-API-Key} header.
         * @deprecated Use {@link #apiKey(String, String)} for production
         *     third-party auth. Emits a warning on first request.
         */
        @Deprecated
        public Builder apiKey(String rawKey) {
            this.legacyApiKey = rawKey;
            return this;
        }

        public Builder jwtToken(String jwtToken) { this.jwtToken = jwtToken; return this; }
        public Builder clientVersion(String v) { this.clientVersion = v; return this; }
        public Builder timeout(Duration timeout) { this.timeout = timeout; return this; }
        public Builder maxRetries(int maxRetries) { this.maxRetries = maxRetries; return this; }
        public Builder httpClient(HttpClient httpClient) { this.httpClient = httpClient; return this; }
        public Builder enableQueue(boolean enable) { this.enableQueue = enable; return this; }
        public Builder autoIdempotency(boolean enable) { this.autoIdempotency = enable; return this; }
        public Builder queueMaxSize(int size) { this.queueMaxSize = size; return this; }
        public Builder offlineQueue(OfflineQueue q) { this.offlineQueue = q; return this; }

        /**
         * Enables a background daemon thread that fires
         * {@code POST /sdk/handshake/heartbeat} every {@code interval}.
         * <p>Requires paired {@link #apiKey(String, String)}. Silently skipped
         * if legacy key or JWT is used.
         */
        public Builder autoHeartbeat(Duration interval) {
            this.autoHeartbeatInterval = interval;
            return this;
        }

        public AurigraphClient build() { return new AurigraphClient(this); }
    }
}
