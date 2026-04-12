package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.CreateTokenRequest;
import io.aurigraph.dlt.sdk.dto.TokenDetail;
import io.aurigraph.dlt.sdk.dto.TokenListResponse;
import io.aurigraph.dlt.sdk.dto.TokenMintReceipt;
import io.aurigraph.dlt.sdk.dto.TokenMintRequest;
import io.aurigraph.dlt.sdk.dto.TokenRegistryStats;
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
 * Tests for {@link TokenRegistryApi}. Uses a hand-rolled StubHttpClient to
 * avoid Mockito on {@code java.net.http.HttpClient} (JDK 25 incompatible).
 */
class TokenRegistryApiTest {

    /** Minimal HttpClient that returns canned responses in order and records requests. */
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
                .autoIdempotency(true)
                .apiKey("test-key")
                .build();
    }

    @Test
    void t1_listBuildsCorrectQueryString() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"content\":[{\"id\":\"token-home-channel-agld-001\",\"tokenType\":\"PRIMARY\","
                        + "\"status\":\"ACTIVE\",\"name\":\"Aurigraph Gold Token\",\"symbol\":\"AGLD\","
                        + "\"totalSupply\":10000000,\"decimals\":18}],"
                        + "\"page\":0,\"size\":20,\"totalElements\":1,\"totalPages\":1}");

        AurigraphClient client = clientWith(http);
        TokenRegistryApi.ListFilter filter = new TokenRegistryApi.ListFilter()
                .standard("PRIMARY").active(true).page(0).size(20);
        TokenListResponse page = client.registries().tokens().list(filter);

        assertNotNull(page);
        assertEquals(1, page.content.size());
        assertEquals("AGLD", page.content.get(0).symbol);
        assertEquals(1L, page.totalElements);

        String url = http.requests.get(0).uri().toString();
        assertTrue(url.contains("/api/v11/registries/tokens"), url);
        assertTrue(url.contains("standard=PRIMARY"), url);
        assertTrue(url.contains("active=true"), url);
        assertTrue(url.contains("page=0"), url);
        assertTrue(url.contains("size=20"), url);
    }

    @Test
    void t2_getReturnsTokenDetail() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"id\":\"token-home-channel-acar-002\",\"channelId\":\"home-channel\","
                        + "\"tokenType\":\"PRIMARY\",\"status\":\"ACTIVE\","
                        + "\"name\":\"Aurigraph Carbon Credit\",\"symbol\":\"ACAR\","
                        + "\"totalSupply\":50000000,\"decimals\":18,"
                        + "\"metadata\":{\"backing\":\"carbon-offset\",\"vintage\":\"2025\"}}");

        AurigraphClient client = clientWith(http);
        TokenDetail token = client.registries().tokens().get("token-home-channel-acar-002");

        assertEquals("token-home-channel-acar-002", token.id);
        assertEquals("ACAR", token.symbol);
        assertEquals("2025", token.metadata.get("vintage"));
        assertTrue(http.requests.get(0).uri().toString()
                .endsWith("/api/v11/registries/tokens/token-home-channel-acar-002"));
        assertEquals("GET", http.requests.get(0).method());
    }

    @Test
    void t3_createPostsBodyAndReturnsNewToken() {
        StubHttpClient http = new StubHttpClient();
        // V12 wraps response in { token, merkleRootHash, leafIndex } — helper unwraps.
        http.enqueue(201,
                "{\"token\":{\"id\":\"token-home-channel-abc12345\",\"channelId\":\"home-channel\","
                        + "\"tokenType\":\"UTILITY\",\"status\":\"CREATED\","
                        + "\"name\":\"My Utility Token\",\"symbol\":\"MUT\","
                        + "\"totalSupply\":1000,\"decimals\":18},"
                        + "\"merkleRootHash\":\"deadbeef\",\"leafIndex\":42}");

        AurigraphClient client = clientWith(http);
        CreateTokenRequest req = new CreateTokenRequest("UTILITY", "My Utility Token", "MUT");
        req.totalSupply = 1000L;
        req.decimals = 18;

        TokenDetail token = client.registries().tokens().create(req);

        assertEquals("token-home-channel-abc12345", token.id);
        assertEquals("MUT", token.symbol);
        assertEquals("CREATED", token.status);

        HttpRequest sent = http.requests.get(0);
        assertEquals("POST", sent.method());
        assertTrue(sent.uri().toString().endsWith("/api/v11/registries/tokens"),
                sent.uri().toString());
        assertTrue(sent.headers().firstValue("X-API-Key").isPresent());
        assertEquals("test-key", sent.headers().firstValue("X-API-Key").orElse(""));
    }

    @Test
    void t4_mintAttachesIdempotencyKeyAndReturnsReceipt() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"tokenId\":\"my-token-001\",\"amount\":1000,\"recipient\":\"0xrecipient\","
                        + "\"newTotalSupply\":11000,\"merkleRootHash\":\"cafef00d\","
                        + "\"timestamp\":\"2026-04-06T00:00:00Z\"}");

        AurigraphClient client = clientWith(http);
        TokenMintRequest req = new TokenMintRequest(1000L, "0xrecipient");
        TokenMintReceipt receipt = client.registries().tokens().mint("my-token-001", req);

        assertEquals("my-token-001", receipt.tokenId);
        assertEquals(1000L, receipt.amount);
        assertEquals(11000L, receipt.newTotalSupply);

        HttpRequest sent = http.requests.get(0);
        assertEquals("POST", sent.method());
        assertTrue(sent.uri().toString()
                .endsWith("/api/v11/registries/tokens/my-token-001/mint"), sent.uri().toString());
        // autoIdempotency=true → client attaches header automatically.
        Optional<String> idemKey = sent.headers().firstValue("Idempotency-Key");
        assertTrue(idemKey.isPresent(), "Idempotency-Key header should be set");
        assertTrue(idemKey.get().length() > 8, "Idempotency-Key should be non-trivial");
    }

    @Test
    void t5_statsAggregatesCountsClientSideFromList() {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"content\":["
                        + "{\"id\":\"t1\",\"tokenType\":\"PRIMARY\",\"status\":\"ACTIVE\",\"name\":\"A\",\"symbol\":\"A\",\"totalSupply\":100},"
                        + "{\"id\":\"t2\",\"tokenType\":\"PRIMARY\",\"status\":\"ACTIVE\",\"name\":\"B\",\"symbol\":\"B\",\"totalSupply\":200},"
                        + "{\"id\":\"t3\",\"tokenType\":\"UTILITY\",\"status\":\"PAUSED\",\"name\":\"C\",\"symbol\":\"C\",\"totalSupply\":50}"
                        + "],\"page\":0,\"size\":100,\"totalElements\":3,\"totalPages\":1}");

        AurigraphClient client = clientWith(http);
        TokenRegistryStats stats = client.registries().tokens().stats();

        assertEquals(3L, stats.totalTokens);
        assertEquals(2L, stats.activeTokens);
        assertEquals("350", stats.totalSupply);
        assertEquals(2L, stats.byType.get("PRIMARY").longValue());
        assertEquals(1L, stats.byType.get("UTILITY").longValue());
    }
}
