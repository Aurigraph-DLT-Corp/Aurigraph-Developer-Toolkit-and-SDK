package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.databind.JsonNode;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.UseCase;
import io.aurigraph.dlt.sdk.exception.AurigraphException;
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
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link RegistriesApi} — Battua tokens, Battua nodes, Provenews
 * contracts/assets, and Use Cases. Uses hand-rolled StubHttpClient (JDK 25 compatible).
 */
class RegistriesApiTest {

    // ── Test doubles ─────────────────────────────────────────────────────────

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
                throw new IllegalStateException("no more stubbed responses (call " + cursor + ")");
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
        @Override public SSLContext sslContext() { try { return SSLContext.getDefault(); } catch (Exception e) { throw new RuntimeException(e); } }
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
            return java.net.http.HttpHeaders.of(java.util.Map.of(), (a, b) -> true);
        }
        @Override public String body() { return body; }
        @Override public Optional<javax.net.ssl.SSLSession> sslSession() { return Optional.empty(); }
        @Override public java.net.URI uri() { return java.net.URI.create("https://stub/"); }
        @Override public HttpClient.Version version() { return HttpClient.Version.HTTP_1_1; }
    }

    private AurigraphClient clientWith(StubHttpClient http) {
        return AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("test-key")
                .build();
    }

    // ── Battua Tokens ────────────────────────────────────────────────────────

    @Test
    void t1_battuaTokensCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"tokens\":[{\"tokenId\":\"battua-usdt-001\",\"symbol\":\"USDT\","
                        + "\"name\":\"Tether\",\"decimals\":6,\"totalSupply\":\"1000000000\"}]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> tokens = client.registries().battuaTokens();

        assertNotNull(tokens);
        assertEquals(1, tokens.size());
        assertEquals("battua-usdt-001", tokens.get(0).get("tokenId"));
        assertEquals("USDT", tokens.get(0).get("symbol"));

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/registries/battua"), url);
        assertEquals("GET", http.requests.get(0).method());
    }

    @Test
    void t2_battuaTokensReturnsEmptyListOnEmptyEnvelope() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"tokens\":[]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> tokens = client.registries().battuaTokens();
        assertNotNull(tokens);
        assertTrue(tokens.isEmpty());
    }

    // ── Battua Stats ─────────────────────────────────────────────────────────

    @Test
    void t3_battuaStatsReturnsJsonNode() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"totalNodes\":5,\"activeNodes\":3,\"averageUptimeMs\":86400000,\"tokens\":[]}");

        AurigraphClient client = clientWith(http);
        JsonNode stats = client.registries().battuaStats();

        assertNotNull(stats);
        assertEquals(5, stats.get("totalNodes").asInt());
        assertEquals(3, stats.get("activeNodes").asInt());

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/registries/battua"), url);
    }

    // ── Battua Nodes ─────────────────────────────────────────────────────────

    @Test
    void t4_battuaNodesCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"nodes\":[{\"nodeId\":\"battua-node-1\",\"nodeLabel\":\"Mumbai Gateway\","
                        + "\"status\":\"ACTIVE\",\"version\":\"2.2.0\"}]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> nodes = client.registries().battuaNodes();

        assertNotNull(nodes);
        assertEquals(1, nodes.size());
        assertEquals("battua-node-1", nodes.get(0).get("nodeId"));
        assertEquals("ACTIVE", nodes.get(0).get("status"));

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/registries/battua-nodes"), url);
    }

    // ── Battua Node Heartbeat ────────────────────────────────────────────────

    @Test
    void t5_registerBattuaNodeHeartbeatPostsBody() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"nodeId\":\"battua-node-1\",\"status\":\"ACTIVE\"}");

        AurigraphClient client = clientWith(http);
        Map<String, Object> registration = Map.of(
                "nodeId", "battua-node-1",
                "lastHeartbeat", "2026-04-07T12:00:00Z"
        );
        Map<String, Object> result = client.registries().registerBattuaNodeHeartbeat(registration);

        assertEquals("battua-node-1", result.get("nodeId"));
        assertEquals("ACTIVE", result.get("status"));

        HttpRequest sent = http.requests.get(0);
        assertEquals("POST", sent.method());
        assertTrue(sent.uri().toString().endsWith("/api/v11/registries/battua-nodes/register"),
                sent.uri().toString());
    }

    // ── Provenews Contracts ──────────────────────────────────────────────────

    @Test
    void t6_provenewsContractsCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"contracts\":[{\"contractId\":\"550e8400-e29b-41d4-a716-446655440000\","
                        + "\"title\":\"Photo License\",\"documentType\":\"COMMERCIAL\","
                        + "\"status\":\"ACTIVE\"}]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> contracts = client.registries().provenewsContracts();

        assertNotNull(contracts);
        assertEquals(1, contracts.size());
        assertEquals("550e8400-e29b-41d4-a716-446655440000", contracts.get(0).get("contractId"));
        assertEquals("Photo License", contracts.get(0).get("title"));

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/provenews/contracts"), url);
        assertEquals("GET", http.requests.get(0).method());
    }

    @Test
    void t7_provenewsContractsReturnsEmptyOnEmptyEnvelope() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"contracts\":[]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> contracts = client.registries().provenewsContracts();
        assertNotNull(contracts);
        assertTrue(contracts.isEmpty());
    }

    // ── Provenews Assets ─────────────────────────────────────────────────────

    @Test
    void t8_provenewsAssetsCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"assets\":[{\"id\":\"asset-001\",\"assetType\":\"PRIMARY\","
                        + "\"contentHash\":\"" + "a".repeat(64) + "\","
                        + "\"ownerId\":\"owner-1\",\"status\":\"REGISTERED\"}]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> assets = client.registries().provenewsAssets();

        assertNotNull(assets);
        assertEquals(1, assets.size());
        assertEquals("asset-001", assets.get(0).get("id"));
        assertEquals("PRIMARY", assets.get(0).get("assetType"));

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/provenews/ledger/assets"), url);
    }

    @Test
    void t9_provenewsAssetsReturnsEmptyOnNoAssets() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"assets\":[]}");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> assets = client.registries().provenewsAssets();
        assertNotNull(assets);
        assertTrue(assets.isEmpty());
    }

    // ── Use Cases ────────────────────────────────────────────────────────────

    @Test
    void t10_listUseCasesCallsCorrectEndpoint() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"useCases\":[{\"id\":\"UC_BATTERY_AADHAR\",\"name\":\"Battery Aadhar\","
                        + "\"category\":\"ENERGY\",\"description\":\"Battery passport system\","
                        + "\"assetCount\":5,\"contractCount\":2}]}");

        AurigraphClient client = clientWith(http);
        List<UseCase> useCases = client.registries().listUseCases();

        assertNotNull(useCases);
        assertEquals(1, useCases.size());
        assertEquals("UC_BATTERY_AADHAR", useCases.get(0).id);
        assertEquals("Battery Aadhar", useCases.get(0).name);
        assertEquals("ENERGY", useCases.get(0).category);

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/use-cases"), url);
    }

    @Test
    void t11_getUseCaseCallsCorrectEndpointWithId() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"id\":\"UC_PROVENEWS\",\"name\":\"Provenews\","
                        + "\"category\":\"MEDIA\",\"description\":\"Content provenance\"}");

        AurigraphClient client = clientWith(http);
        UseCase uc = client.registries().getUseCase("UC_PROVENEWS");

        assertNotNull(uc);
        assertEquals("UC_PROVENEWS", uc.id);
        assertEquals("Provenews", uc.name);

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.endsWith("/api/v11/use-cases/UC_PROVENEWS"), url);
        assertEquals("GET", http.requests.get(0).method());
    }

    // ── Error handling ───────────────────────────────────────────────────────

    @Test
    void t12_battuaTokens4xxThrowsClientError() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(400,
                "{\"type\":\"about:blank\",\"title\":\"Bad Request\",\"status\":400,"
                        + "\"detail\":\"invalid\",\"errorCode\":\"BATTUA_INVALID\"}");

        AurigraphClient client = clientWith(http);
        assertThrows(AurigraphException.ClientError.class,
                () -> client.registries().battuaTokens());
        assertEquals(1, http.callCount.get());
    }

    @Test
    void t13_provenewsContracts5xxThrowsServerError() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(503,
                "{\"type\":\"about:blank\",\"title\":\"Unavailable\",\"status\":503}");

        AurigraphClient client = clientWith(http);
        assertThrows(AurigraphException.ServerError.class,
                () -> client.registries().provenewsContracts());
    }

    // ── API key verification ─────────────────────────────────────────────────

    @Test
    void t14_apiKeyHeaderIsSentOnRegistriesRequests() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"tokens\":[]}");

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .apiKey("battua-key-123")
                .build();
        client.registries().battuaTokens();

        HttpRequest sent = http.requests.get(0);
        assertEquals("battua-key-123",
                sent.headers().firstValue("X-API-Key").orElse(null));
    }

    // ── Unwrap edge cases ────────────────────────────────────────────────────

    @Test
    void t15_battuaTokensHandlesBareArrayResponse() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "[{\"tokenId\":\"t-1\",\"symbol\":\"USDT\"}]");

        AurigraphClient client = clientWith(http);
        List<Map<String, Object>> tokens = client.registries().battuaTokens();
        assertNotNull(tokens);
        assertEquals(1, tokens.size());
        assertEquals("t-1", tokens.get(0).get("tokenId"));
    }
}
