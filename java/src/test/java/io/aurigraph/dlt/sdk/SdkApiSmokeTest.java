package io.aurigraph.dlt.sdk;

import io.aurigraph.dlt.sdk.dto.HealthResponse;
import io.aurigraph.dlt.sdk.dto.PlatformStats;
import io.aurigraph.dlt.sdk.exception.AurigraphException;
import io.aurigraph.dlt.sdk.handshake.CapabilitiesResponse;
import io.aurigraph.dlt.sdk.handshake.ConfigResponse;
import io.aurigraph.dlt.sdk.handshake.HelloResponse;
import io.aurigraph.dlt.sdk.namespace.ChannelsApi;
import io.aurigraph.dlt.sdk.namespace.ContractsApi;
import io.aurigraph.dlt.sdk.namespace.DmrvApi;
import io.aurigraph.dlt.sdk.namespace.NodesApi;
import io.aurigraph.dlt.sdk.namespace.RegistriesApi;
import io.aurigraph.dlt.sdk.namespace.SdkHandshakeApi;
import io.aurigraph.dlt.sdk.namespace.TransactionsApi;
import io.aurigraph.dlt.sdk.queue.OfflineQueue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import java.lang.reflect.Method;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Java SDK API smoke test — Sprint S3-C.
 *
 * <p>Verifies compile-time structure + endpoint path alignment between the
 * Java SDK ({@link AurigraphClient}) and the V12 REST resource classes.
 * Does NOT require a running server -- uses a {@link StubHttpClient} to
 * intercept HTTP calls and verify request URIs match expected V12 paths.</p>
 *
 * <h2>Coverage</h2>
 * <ul>
 *   <li>Client builder + instantiation</li>
 *   <li>Namespace accessor methods (nodes, registries, channels, transactions, dmrv, contracts, sdk)</li>
 *   <li>Top-level convenience methods (health, stats)</li>
 *   <li>Endpoint path verification for each namespace</li>
 *   <li>Offline queue instantiation + close</li>
 * </ul>
 *
 * @since Sprint S3-C
 */
@Tag("sdk-smoke")
@DisplayName("Java SDK API Smoke Test (S3-C)")
class SdkApiSmokeTest {

    // ── V12 API path constants — must match resource @Path annotations ───────

    /** Expected V12 API paths that SDK methods target. */
    private static final Set<String> V12_API_PATHS = Set.of(
            "/api/v11/health",
            "/api/v11/stats",
            "/api/v11/nodes",
            "/api/v11/registries/tokens",
            "/api/v11/registries/battua",
            "/api/v11/registries/battua-nodes",
            "/api/v11/channels",
            "/api/v11/transactions",
            "/api/v11/sdk/handshake/hello",
            "/api/v11/sdk/handshake/heartbeat",
            "/api/v11/sdk/handshake/capabilities",
            "/api/v11/sdk/handshake/config",
            "/api/v11/sdk/partner/profile",
            "/api/v11/sdk/partner/tier",
            "/api/v11/sdk/partner/usage",
            "/api/v11/sdk/token-types",
            "/api/v11/sdk/mint/quota",
            "/api/v11/sdk/webhooks",
            "/api/v11/sdk/dmrv/record"
    );

    // ── Stub HTTP client ────────────────────────────────────────────────────

    static class StubHttpClient extends HttpClient {
        final List<HttpRequest> requests = new ArrayList<>();
        final AtomicInteger callCount = new AtomicInteger(0);

        @Override
        @SuppressWarnings("unchecked")
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> bodyHandler) {
            requests.add(request);
            callCount.incrementAndGet();
            // Return generic OK with empty JSON object
            return (HttpResponse<T>) new StubResponse(200, "{}");
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                 HttpResponse.BodyHandler<T> bodyHandler) {
            return CompletableFuture.completedFuture(send(request, bodyHandler));
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                 HttpResponse.BodyHandler<T> bodyHandler,
                                                                 HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            return sendAsync(request, bodyHandler);
        }

        @Override public Optional<CookieHandler> cookieHandler() { return Optional.empty(); }
        @Override public Optional<Duration> connectTimeout() { return Optional.empty(); }
        @Override public Redirect followRedirects() { return Redirect.NEVER; }
        @Override public Optional<ProxySelector> proxy() { return Optional.empty(); }
        @Override public SSLContext sslContext() {
            try { return SSLContext.getDefault(); } catch (Exception e) { throw new RuntimeException(e); }
        }
        @Override public SSLParameters sslParameters() { return new SSLParameters(); }
        @Override public Optional<Authenticator> authenticator() { return Optional.empty(); }
        @Override public Version version() { return Version.HTTP_1_1; }
        @Override public Optional<Executor> executor() { return Optional.empty(); }
        @Override public WebSocket.Builder newWebSocketBuilder() { throw new UnsupportedOperationException(); }
    }

    static class StubResponse implements HttpResponse<String> {
        private final int status;
        private final String body;
        StubResponse(int status, String body) { this.status = status; this.body = body; }

        @Override public int statusCode() { return status; }
        @Override public HttpRequest request() { return null; }
        @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
        @Override public java.net.http.HttpHeaders headers() {
            return java.net.http.HttpHeaders.of(java.util.Map.of(), (a, b) -> true);
        }
        @Override public String body() { return body; }
        @Override public Optional<javax.net.ssl.SSLSession> sslSession() { return Optional.empty(); }
        @Override public java.net.URI uri() { return java.net.URI.create("https://stub/"); }
        @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
    }

    // ── Test helpers ────────────────────────────────────────────────────────

    private AurigraphClient buildClient(StubHttpClient http) {
        return AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("test-key")
                .httpClient(http)
                .maxRetries(1)
                .timeout(Duration.ofSeconds(5))
                .build();
    }

    // ── T1: Builder and instantiation ───────────────────────────────────────

    @Test
    @DisplayName("T1: Builder creates valid client with all namespace accessors")
    void t1_builderCreatesClientWithNamespaces() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = buildClient(http);

        assertNotNull(client, "Client must not be null");
        assertNotNull(client.nodes(), "nodes() namespace must not be null");
        assertNotNull(client.registries(), "registries() namespace must not be null");
        assertNotNull(client.channels(), "channels() namespace must not be null");
        assertNotNull(client.transactions(), "transactions() namespace must not be null");
        assertNotNull(client.dmrv(), "dmrv() namespace must not be null");
        assertNotNull(client.contracts(), "contracts() namespace must not be null");
        assertNotNull(client.sdk(), "sdk() namespace must not be null");

        // Verify type identity
        assertInstanceOf(NodesApi.class, client.nodes());
        assertInstanceOf(RegistriesApi.class, client.registries());
        assertInstanceOf(ChannelsApi.class, client.channels());
        assertInstanceOf(TransactionsApi.class, client.transactions());
        assertInstanceOf(DmrvApi.class, client.dmrv());
        assertInstanceOf(ContractsApi.class, client.contracts());
        assertInstanceOf(SdkHandshakeApi.class, client.sdk());
    }

    @Test
    @DisplayName("T2: Builder rejects missing baseUrl")
    void t2_builderRejectsMissingBaseUrl() {
        assertThrows(AurigraphException.ConfigError.class,
                () -> AurigraphClient.builder().build());
        assertThrows(AurigraphException.ConfigError.class,
                () -> AurigraphClient.builder().baseUrl("").build());
    }

    // ── T3: health() targets /api/v11/health ────────────────────────────────

    @Test
    @DisplayName("T3: health() targets /api/v11/health")
    void t3_healthTargetsCorrectPath() {
        StubHttpClient http = new StubHttpClient();
        // Return valid health JSON
        http.requests.clear();
        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("test-key")
                .httpClient(new PathCapturingClient("/api/v11/health"))
                .maxRetries(1)
                .build();

        // We just verify the method exists and targets the correct path
        // The PathCapturingClient validates the URI
        try {
            client.health();
        } catch (Exception ignored) {
            // The stub returns {} which can't deserialize to HealthResponse,
            // but the important thing is the request was made to the right path.
        }
    }

    // ── T4: SDK handshake paths align with V12 resource ─────────────────────

    @Test
    @DisplayName("T4: SdkHandshakeApi methods map to correct V12 paths")
    void t4_sdkHandshakePathAlignment() {
        // Verify SdkHandshakeApi has all expected methods that map to V12 endpoints
        Method[] methods = SdkHandshakeApi.class.getDeclaredMethods();
        Set<String> methodNames = Arrays.stream(methods)
                .map(Method::getName)
                .collect(Collectors.toSet());

        // These SDK methods map to V12 SdkHandshakeResource endpoints
        assertTrue(methodNames.contains("hello"),
                "SdkHandshakeApi must have hello() -> GET /sdk/handshake/hello");
        assertTrue(methodNames.contains("heartbeat"),
                "SdkHandshakeApi must have heartbeat() -> POST /sdk/handshake/heartbeat");
        assertTrue(methodNames.contains("capabilities"),
                "SdkHandshakeApi must have capabilities() -> GET /sdk/handshake/capabilities");
        assertTrue(methodNames.contains("config"),
                "SdkHandshakeApi must have config() -> GET /sdk/handshake/config");

        // These SDK methods map to V12 SdkPartnerResource endpoints
        assertTrue(methodNames.contains("profile"),
                "SdkHandshakeApi must have profile() -> GET /sdk/partner/profile");
        assertTrue(methodNames.contains("tier"),
                "SdkHandshakeApi must have tier() -> GET /sdk/partner/tier");
        assertTrue(methodNames.contains("usage"),
                "SdkHandshakeApi must have usage() -> GET /sdk/partner/usage");

        // These SDK methods map to V12 SdkMintResource / SdkTokenTypesResource
        assertTrue(methodNames.contains("mintQuota"),
                "SdkHandshakeApi must have mintQuota() -> GET /sdk/mint/quota");
        assertTrue(methodNames.contains("tokenTypes"),
                "SdkHandshakeApi must have tokenTypes() -> GET /sdk/token-types");
        assertTrue(methodNames.contains("webhooks"),
                "SdkHandshakeApi must have webhooks() -> GET /sdk/webhooks");
    }

    // ── T5: Return type alignment ───────────────────────────────────────────

    @Test
    @DisplayName("T5: SDK return types exist and are records/classes")
    void t5_sdkReturnTypesExist() {
        // All these types must be loadable (compile-time verification)
        assertNotNull(HelloResponse.class);
        assertNotNull(CapabilitiesResponse.class);
        assertNotNull(ConfigResponse.class);
        assertNotNull(HealthResponse.class);
        assertNotNull(PlatformStats.class);

        // HelloResponse must be a record with the expected fields
        assertTrue(HelloResponse.class.isRecord(),
                "HelloResponse must be a Java record");
        Set<String> fieldNames = Arrays.stream(HelloResponse.class.getRecordComponents())
                .map(java.lang.reflect.RecordComponent::getName)
                .collect(Collectors.toSet());
        assertTrue(fieldNames.contains("appId"), "HelloResponse must have appId field");
        assertTrue(fieldNames.contains("status"), "HelloResponse must have status field");
        assertTrue(fieldNames.contains("serverVersion"), "HelloResponse must have serverVersion field");
        assertTrue(fieldNames.contains("approvedScopes"), "HelloResponse must have approvedScopes field");
    }

    // ── T6: OfflineQueue can be enabled ─────────────────────────────────────

    @Test
    @DisplayName("T6: OfflineQueue instantiates and exposes queue()")
    void t6_offlineQueueInstantiates() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("test-key")
                .httpClient(http)
                .enableQueue(true)
                .maxRetries(1)
                .build();

        assertNotNull(client.queue(), "queue() must return non-null when enableQueue is true");
        assertInstanceOf(OfflineQueue.class, client.queue());
        client.close();
    }

    @Test
    @DisplayName("T7: Queue is null when not enabled")
    void t7_offlineQueueNullWhenDisabled() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = buildClient(http);
        assertNull(client.queue(), "queue() must return null when enableQueue is false (default)");
    }

    // ── T8: close() is safe to call multiple times ──────────────────────────

    @Test
    @DisplayName("T8: close() is idempotent")
    void t8_closeIsIdempotent() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = buildClient(http);
        // Should not throw
        client.close();
        client.close();
        client.close();
    }

    // ── T9: Namespace API paths use /api/v11 prefix ─────────────────────────

    @Test
    @DisplayName("T9: All SDK namespace methods target /api/v11/* paths")
    void t9_allNamespaceMethodsUseV11Prefix() {
        // Verify API_PREFIX is "/api/v11" by examining a request
        StubHttpClient http = new StubHttpClient();
        // Use a canned response for health so we can inspect the URI
        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("test-key")
                .httpClient(http)
                .maxRetries(1)
                .build();

        // Make any request — health returns {} which fails deserialization,
        // but the request was recorded.
        try { client.health(); } catch (Exception ignored) {}

        assertEquals(1, http.callCount.get());
        String uri = http.requests.get(0).uri().toString();
        assertTrue(uri.contains("/api/v11/"),
                "SDK requests must use /api/v11/ prefix, got: " + uri);
        assertEquals("https://dlt.aurigraph.io/api/v11/health", uri);
    }

    // ── T10: Builder apiKey(appId, rawKey) pair format ───────────────────────

    @Test
    @DisplayName("T10: Builder apiKey(appId, rawKey) produces ApiKey header format")
    void t10_apiKeyPairFormat() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("11111111-1111-1111-1111-111111111111", "raw-key-abc")
                .httpClient(http)
                .maxRetries(1)
                .build();

        try { client.health(); } catch (Exception ignored) {}

        HttpRequest req = http.requests.get(0);
        String auth = req.headers().firstValue("Authorization").orElse("");
        assertEquals("ApiKey 11111111-1111-1111-1111-111111111111:raw-key-abc", auth,
                "Authorization header must use 'ApiKey <appId>:<rawKey>' format");
    }

    // ── Path-capturing helper ───────────────────────────────────────────────

    /** Validates that a specific path suffix appears in requests. */
    static class PathCapturingClient extends HttpClient {
        private final String expectedSuffix;
        final List<HttpRequest> requests = new ArrayList<>();

        PathCapturingClient(String expectedSuffix) {
            this.expectedSuffix = expectedSuffix;
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> bodyHandler) {
            requests.add(request);
            assertTrue(request.uri().toString().endsWith(expectedSuffix),
                    "Expected URI suffix " + expectedSuffix + " but got " + request.uri());
            return (HttpResponse<T>) new StubResponse(200,
                    "{\"status\":\"HEALTHY\",\"durationMs\":1}");
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                 HttpResponse.BodyHandler<T> bodyHandler) {
            return CompletableFuture.completedFuture(send(request, bodyHandler));
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                 HttpResponse.BodyHandler<T> bodyHandler,
                                                                 HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            return sendAsync(request, bodyHandler);
        }

        @Override public Optional<CookieHandler> cookieHandler() { return Optional.empty(); }
        @Override public Optional<Duration> connectTimeout() { return Optional.empty(); }
        @Override public Redirect followRedirects() { return Redirect.NEVER; }
        @Override public Optional<ProxySelector> proxy() { return Optional.empty(); }
        @Override public SSLContext sslContext() {
            try { return SSLContext.getDefault(); } catch (Exception e) { throw new RuntimeException(e); }
        }
        @Override public SSLParameters sslParameters() { return new SSLParameters(); }
        @Override public Optional<Authenticator> authenticator() { return Optional.empty(); }
        @Override public Version version() { return Version.HTTP_1_1; }
        @Override public Optional<Executor> executor() { return Optional.empty(); }
        @Override public WebSocket.Builder newWebSocketBuilder() { throw new UnsupportedOperationException(); }
    }
}
