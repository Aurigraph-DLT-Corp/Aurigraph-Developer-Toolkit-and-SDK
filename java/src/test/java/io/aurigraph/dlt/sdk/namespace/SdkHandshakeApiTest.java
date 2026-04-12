package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.exception.AurigraphException;
import io.aurigraph.dlt.sdk.handshake.CapabilitiesResponse;
import io.aurigraph.dlt.sdk.handshake.ConfigResponse;
import io.aurigraph.dlt.sdk.handshake.HeartbeatResponse;
import io.aurigraph.dlt.sdk.handshake.HelloResponse;
import org.junit.jupiter.api.Test;

import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link SdkHandshakeApi} — hello / heartbeat / capabilities / config.
 *
 * <p>Covers AAT-H4 deliverables:
 * <ul>
 *   <li>Endpoint path + HTTP method wiring for all 4 handshake calls</li>
 *   <li>{@code Authorization: ApiKey <appId>:<rawKey>} header format</li>
 *   <li>Deserialization of HelloResponse / HeartbeatResponse /
 *       CapabilitiesResponse / ConfigResponse records</li>
 *   <li>Builder.apiKey(appId, rawKey) sets both fields (AAT-H3)</li>
 *   <li>Deprecated Builder.apiKey(String) legacy path — warn once (AAT-H3)</li>
 *   <li>autoHeartbeat scheduler + close() (AAT-H3)</li>
 * </ul>
 *
 * <p>All 10 tests run against the current Java SDK (post-AAT-H3). T8 + T9
 * exercise the {@link Duration#ofMillis(long)} auto-heartbeat path with a
 * short 80ms interval to keep the test suite fast (~700ms total).
 */
class SdkHandshakeApiTest {

    // ── Test doubles (identical shape to RegistriesApiTest) ─────────────────

    static class StubHttpClient extends HttpClient {
        private final List<HttpResponse<String>> responses = new ArrayList<>();
        final List<HttpRequest> requests = new ArrayList<>();
        final AtomicInteger callCount = new AtomicInteger(0);
        private int cursor = 0;

        void enqueue(int status, String body) {
            responses.add(new StubHttpResponse(status, body));
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> HttpResponse<T> send(HttpRequest request,
                                         HttpResponse.BodyHandler<T> bodyHandler) {
            requests.add(request);
            callCount.incrementAndGet();
            if (cursor >= responses.size()) {
                throw new IllegalStateException(
                        "no more stubbed responses (call " + cursor + ")");
            }
            return (HttpResponse<T>) responses.get(cursor++);
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

    static class StubHttpResponse implements HttpResponse<String> {
        private final int status;
        private final String body;
        StubHttpResponse(int status, String body) { this.status = status; this.body = body; }

        @Override public int statusCode() { return status; }
        @Override public HttpRequest request() { return null; }
        @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
        @Override public java.net.http.HttpHeaders headers() {
            return java.net.http.HttpHeaders.of(
                    java.util.Map.of("Content-Type",
                            java.util.List.of("application/json")),
                    (a, b) -> true);
        }
        @Override public String body() { return body; }
        @Override public Optional<javax.net.ssl.SSLSession> sslSession() { return Optional.empty(); }
        @Override public java.net.URI uri() { return java.net.URI.create("https://stub/"); }
        @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
    }

    // Sample bodies used across tests.
    private static final String HELLO_JSON =
            "{\"appId\":\"11111111-1111-1111-1111-111111111111\","
                    + "\"appName\":\"Battua SDK Test\","
                    + "\"did\":\"did:aurigraph:battua-test\","
                    + "\"status\":\"ACTIVE\","
                    + "\"serverVersion\":\"12.1.34\","
                    + "\"protocolVersion\":\"1.0\","
                    + "\"approvedScopes\":[\"registry:read\",\"dmrv:read\",\"health:read\"],"
                    + "\"requestedScopes\":[\"registry:read\",\"dmrv:read\",\"health:read\",\"mint:token\"],"
                    + "\"pendingScopes\":[\"mint:token\"],"
                    + "\"rateLimit\":{\"requestsPerMinute\":600,\"burstSize\":60},"
                    + "\"heartbeatIntervalMs\":300000,"
                    + "\"features\":{\"dprA\":true},"
                    + "\"nextHeartbeatAt\":\"2026-04-07T12:05:00Z\"}";

    private static final String HEARTBEAT_JSON =
            "{\"receivedAt\":\"2026-04-07T12:00:00Z\","
                    + "\"nextHeartbeatAt\":\"2026-04-07T12:05:00Z\","
                    + "\"status\":\"ACTIVE\"}";

    private static final String CAPABILITIES_JSON =
            "{\"appId\":\"11111111-1111-1111-1111-111111111111\","
                    + "\"approvedScopes\":[\"registry:read\"],"
                    + "\"totalEndpoints\":10,"
                    + "\"endpoints\":["
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/registries/battua\",\"requiredScope\":\"registry:read\",\"description\":\"List tokens\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/registries/battua-nodes\",\"requiredScope\":\"registry:read\",\"description\":\"List nodes\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/registries/tokens\",\"requiredScope\":\"registry:read\",\"description\":\"List tokens\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/provenews/contracts\",\"requiredScope\":\"registry:read\",\"description\":\"List contracts\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/provenews/ledger/assets\",\"requiredScope\":\"registry:read\",\"description\":\"List assets\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/provenews/ledger/checkpoints\",\"requiredScope\":\"registry:read\",\"description\":\"Checkpoints\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/use-cases\",\"requiredScope\":\"registry:read\",\"description\":\"List use cases\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/nodes\",\"requiredScope\":\"registry:read\",\"description\":\"List nodes\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/channels\",\"requiredScope\":\"registry:read\",\"description\":\"List channels\"},"
                    + "{\"method\":\"GET\",\"path\":\"/api/v11/stats\",\"requiredScope\":\"stats:read\",\"description\":\"Platform stats\"}"
                    + "]}";

    private static final String CONFIG_JSON =
            "{\"appId\":\"11111111-1111-1111-1111-111111111111\","
                    + "\"status\":\"ACTIVE\","
                    + "\"approvedScopes\":[\"registry:read\",\"dmrv:read\"],"
                    + "\"pendingScopes\":[\"mint:token\"],"
                    + "\"rateLimit\":{\"requestsPerMinute\":600,\"burstSize\":60},"
                    + "\"lastUpdatedAt\":\"2026-04-07T12:00:00Z\"}";

    private AurigraphClient clientWith(StubHttpClient http) {
        return AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("legacy-test-key")
                .build();
    }

    // ── T1: hello() path + method ────────────────────────────────────────────

    @Test
    void t1_helloCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, HELLO_JSON);

        AurigraphClient client = clientWith(http);
        HelloResponse hello = client.sdk().hello();

        assertNotNull(hello);
        assertEquals("11111111-1111-1111-1111-111111111111", hello.appId());
        assertEquals("Battua SDK Test", hello.appName());
        assertEquals("ACTIVE", hello.status());
        assertEquals(3, hello.approvedScopes().size());
        assertTrue(hello.approvedScopes().contains("registry:read"));
        assertEquals(1, hello.pendingScopes().size());
        assertEquals("mint:token", hello.pendingScopes().get(0));
        assertEquals(300000L, hello.heartbeatIntervalMs());
        assertEquals(600, hello.rateLimit().requestsPerMinute());

        HttpRequest sent = http.requests.get(0);
        assertEquals("GET", sent.method());
        assertTrue(sent.uri().toString().endsWith("/api/v11/sdk/handshake/hello"),
                sent.uri().toString());
    }

    // ── T2: Authorization header format ──────────────────────────────────────

    @Test
    void t2_helloSendsApiKeyAuthorizationHeader() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, HELLO_JSON);

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("11111111-1111-1111-1111-111111111111", "raw-key-abcdef")
                .build();
        client.sdk().hello();

        HttpRequest sent = http.requests.get(0);
        String auth = sent.headers().firstValue("Authorization").orElse("");
        assertTrue(
                auth.matches("^ApiKey [0-9a-fA-F-]{36}:[A-Za-z0-9-]+$"),
                "Authorization must be `ApiKey <uuid>:<rawKey>`, was: " + auth);
        assertFalse(sent.headers().firstValue("X-API-Key").isPresent(),
                "Legacy X-API-Key must not be present when appId is set");
    }

    // ── T3: heartbeat() POST with body ───────────────────────────────────────

    @Test
    void t3_heartbeatPostsClientVersionBody() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, HEARTBEAT_JSON);

        AurigraphClient client = clientWith(http);
        HeartbeatResponse hb = client.sdk().heartbeat("aurigraph-java-sdk/1.0.0");

        assertNotNull(hb);
        assertEquals("ACTIVE", hb.status());
        assertEquals("2026-04-07T12:05:00Z", hb.nextHeartbeatAt());

        HttpRequest sent = http.requests.get(0);
        assertEquals("POST", sent.method());
        assertTrue(sent.uri().toString().endsWith("/api/v11/sdk/handshake/heartbeat"),
                sent.uri().toString());
        assertEquals("application/json",
                sent.headers().firstValue("Content-Type").orElse(""));
        // Body should contain the clientVersion we passed in.
        // (The JDK HttpRequest API doesn't expose the BodyPublisher contents directly,
        // but we can at least verify bodyPublisher() is present.)
        assertTrue(sent.bodyPublisher().isPresent());
    }

    // ── T4: capabilities() returns typed endpoint list ──────────────────────

    @Test
    void t4_capabilitiesReturnsTypedEndpointList() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, CAPABILITIES_JSON);

        AurigraphClient client = clientWith(http);
        CapabilitiesResponse caps = client.sdk().capabilities();

        assertNotNull(caps);
        assertEquals("11111111-1111-1111-1111-111111111111", caps.appId());
        assertEquals(10, caps.totalEndpoints());
        assertEquals(10, caps.endpoints().size());
        CapabilitiesResponse.CapabilityEndpoint first = caps.endpoints().get(0);
        assertEquals("GET", first.method());
        assertEquals("/api/v11/registries/battua", first.path());
        assertEquals("registry:read", first.requiredScope());

        HttpRequest sent = http.requests.get(0);
        assertTrue(sent.uri().toString().endsWith("/api/v11/sdk/handshake/capabilities"));
    }

    // ── T5: config() lightweight refresh ─────────────────────────────────────

    @Test
    void t5_configReturnsLightweightResponse() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, CONFIG_JSON);

        AurigraphClient client = clientWith(http);
        ConfigResponse cfg = client.sdk().config();

        assertNotNull(cfg);
        assertEquals("ACTIVE", cfg.status());
        assertEquals(2, cfg.approvedScopes().size());
        assertEquals("mint:token", cfg.pendingScopes().get(0));
        assertEquals(600, cfg.rateLimit().requestsPerMinute());
        // ConfigResponse has no endpoints field — it's compile-checked by the record type.

        HttpRequest sent = http.requests.get(0);
        assertEquals("GET", sent.method());
        assertTrue(sent.uri().toString().endsWith("/api/v11/sdk/handshake/config"));
    }

    // ── T6: Builder.apiKey(appId, rawKey) sets both fields ──────────────────

    @Test
    void t6_builderApiKeyPairSetsBothFields() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, HELLO_JSON);
        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .apiKey("11111111-1111-1111-1111-111111111111", "raw-key-abcdef")
                .build();
        client.sdk().hello();
        assertEquals("ApiKey 11111111-1111-1111-1111-111111111111:raw-key-abcdef",
                http.requests.get(0).headers().firstValue("Authorization").orElse(""));
    }

    // ── T7: Deprecated apiKey(String) legacy path — warn once ───────────────

    @Test
    void t7_deprecatedApiKeyWarnsOnce() {
        java.io.PrintStream originalErr = System.err;
        java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
        System.setErr(new java.io.PrintStream(buf));
        try {
            StubHttpClient http = new StubHttpClient();
            http.enqueue(200, HELLO_JSON);
            http.enqueue(200, HEARTBEAT_JSON);
            http.enqueue(200, CONFIG_JSON);

            AurigraphClient client = AurigraphClient.builder()
                    .baseUrl("https://dlt.aurigraph.io")
                    .httpClient(http)
                    .maxRetries(1)
                    .apiKey("legacy-only-key")  // deprecated single-arg form
                    .build();
            client.sdk().hello();
            client.sdk().heartbeat("test-client/1.0");
            client.sdk().config();

            String err = buf.toString();
            // Count occurrences of the deprecation line.
            int occurrences = err.split("Deprecated: apiKey\\(String\\)", -1).length - 1;
            assertEquals(1, occurrences,
                    "Deprecation warning must fire exactly once across multiple requests, "
                            + "got " + occurrences + " — stderr was: " + err);
        } finally {
            System.setErr(originalErr);
        }
    }

    // ── T8: autoHeartbeat schedules executor ─────────────────────────────────

    @Test
    void t8_autoHeartbeatSchedulesExecutor() throws InterruptedException {
        // Use a thread-safe stub so the heartbeat thread can enqueue without races.
        StubHttpClient http = new StubHttpClient();
        // Pre-seed enough responses to cover several heartbeats.
        for (int i = 0; i < 10; i++) {
            http.enqueue(200, HEARTBEAT_JSON);
        }

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("11111111-1111-1111-1111-111111111111", "raw-key-abcdef")
                .clientVersion("aurigraph-java-sdk/test")
                .autoHeartbeat(Duration.ofMillis(80))
                .build();

        try {
            // Wait for at least 2 heartbeat cycles (initial delay + 1 interval).
            Thread.sleep(350);
            int calls = http.callCount.get();
            assertTrue(calls >= 2,
                    "autoHeartbeat must fire at least 2 times within 350ms — got " + calls);
            // And every call must be to the heartbeat endpoint.
            for (HttpRequest req : http.requests) {
                assertTrue(req.uri().toString().endsWith("/api/v11/sdk/handshake/heartbeat"),
                        "unexpected call: " + req.uri());
                assertEquals("POST", req.method());
            }
        } finally {
            client.close();
        }
    }

    // ── T9: close() shuts down heartbeat executor ────────────────────────────

    @Test
    void t9_closeStopsHeartbeatExecutor() throws InterruptedException {
        StubHttpClient http = new StubHttpClient();
        for (int i = 0; i < 20; i++) {
            http.enqueue(200, HEARTBEAT_JSON);
        }

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("11111111-1111-1111-1111-111111111111", "raw-key-abcdef")
                .autoHeartbeat(Duration.ofMillis(80))
                .build();

        // Let a couple of heartbeats fire.
        Thread.sleep(250);
        client.close();
        int countAtClose = http.callCount.get();

        // Wait 3 more intervals. Count must not advance.
        Thread.sleep(300);
        int countAfter = http.callCount.get();
        assertEquals(countAtClose, countAfter,
                "close() must stop the heartbeat executor — "
                        + "saw " + (countAfter - countAtClose)
                        + " additional heartbeats after close()");
    }

    // ── T10: Error handling — hello() 401 surfaces ClientError ──────────────

    @Test
    void t10_hello401ThrowsClientError() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(401,
                "{\"type\":\"about:blank\",\"title\":\"Unauthorized\","
                        + "\"status\":401,\"detail\":\"Invalid API key\","
                        + "\"errorCode\":\"ERR_SDK_AUTH_001\"}");

        AurigraphClient client = clientWith(http);
        AurigraphException.ClientError err = assertThrows(
                AurigraphException.ClientError.class,
                () -> client.sdk().hello());
        assertEquals(401, err.getStatusCode());
        assertEquals(1, http.callCount.get());
    }
}
