package io.aurigraph.dlt.sdk;

import io.aurigraph.dlt.sdk.dto.ChannelCreateRequest;
import io.aurigraph.dlt.sdk.dto.HealthResponse;
import io.aurigraph.dlt.sdk.dto.TransactionReceipt;
import io.aurigraph.dlt.sdk.dto.TransactionSubmitRequest;
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
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link AurigraphClient}.
 *
 * <p>Uses a hand-rolled {@link HttpClient} subclass (rather than Mockito)
 * because on JDK 25 Mockito's inline mocker cannot modify {@code java.net.http.HttpClient}.
 */
class AurigraphClientTest {

    /** Test double: returns canned responses in sequence and records requests. */
    static class StubHttpClient extends HttpClient {
        private final List<HttpResponse<String>> responses = new ArrayList<>();
        final List<HttpRequest> requests = new ArrayList<>();
        final AtomicInteger callCount = new AtomicInteger(0);
        private int cursor = 0;

        void enqueue(int status, String body) {
            responses.add(new StubHttpResponse(status, body));
        }

        /** Enqueue the same response repeatedly (for retry tests). */
        void enqueueRepeating(int status, String body, int times) {
            for (int i = 0; i < times; i++) {
                enqueue(status, body);
            }
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

    /** Minimal HttpResponse test double returning a fixed status + string body. */
    static class StubHttpResponse implements HttpResponse<String> {
        private final int status;
        private final String body;

        StubHttpResponse(int status, String body) {
            this.status = status;
            this.body = body;
        }

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

    @Test
    void builderRejectsMissingBaseUrl() {
        assertThrows(AurigraphException.ConfigError.class,
                () -> AurigraphClient.builder().build());
        assertThrows(AurigraphException.ConfigError.class,
                () -> AurigraphClient.builder().baseUrl("").build());
    }

    @Test
    void healthCallTargetsCorrectUrlWithApiKey() throws Exception {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"status\":\"HEALTHY\",\"durationMs\":7}");

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("test-key-123")
                .httpClient(http)
                .maxRetries(1)
                .timeout(Duration.ofSeconds(5))
                .build();

        HealthResponse health = client.health();
        assertNotNull(health);
        assertEquals("HEALTHY", health.status);
        assertTrue(health.isHealthy());
        assertEquals(Long.valueOf(7L), health.durationMs);

        assertEquals(1, http.callCount.get());
        HttpRequest req = http.requests.get(0);
        assertEquals("https://dlt.aurigraph.io/api/v11/health", req.uri().toString());
        assertEquals("GET", req.method());
        assertEquals("test-key-123", req.headers().firstValue("X-API-Key").orElse(null));
    }

    @Test
    void channelsCreatePostsJsonBodyWithJwt() throws Exception {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"channelId\":\"c-1\",\"name\":\"home\",\"type\":\"HOME\"}");

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .jwtToken("eyJ-fake-jwt")
                .httpClient(http)
                .maxRetries(1)
                .build();

        ChannelCreateRequest req = new ChannelCreateRequest("home", "HOME", "Home channel");
        var channel = client.channels().create(req);
        assertEquals("c-1", channel.channelId);
        assertEquals("home", channel.name);

        assertEquals(1, http.callCount.get());
        HttpRequest sent = http.requests.get(0);
        assertEquals("POST", sent.method());
        assertEquals("Bearer eyJ-fake-jwt", sent.headers().firstValue("Authorization").orElse(null));
        assertEquals("application/json", sent.headers().firstValue("Content-Type").orElse(null));
    }

    @Test
    void clientError4xxDoesNotRetry() throws Exception {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(400,
                "{\"type\":\"about:blank\",\"title\":\"Bad Request\",\"status\":400," +
                "\"detail\":\"invalid nodeId\",\"errorCode\":\"NODE_INVALID\"}");

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(3)
                .build();

        AurigraphException.ClientError err = assertThrows(AurigraphException.ClientError.class,
                () -> client.nodes().get("bad-id"));
        assertEquals(400, err.getStatusCode());
        assertEquals("NODE_INVALID", err.getErrorCode());
        assertEquals(1, http.callCount.get());
    }

    @Test
    void serverError5xxRetriesUpToMaxAttempts() throws Exception {
        StubHttpClient http = new StubHttpClient();
        http.enqueueRepeating(503,
                "{\"type\":\"about:blank\",\"title\":\"Unavailable\",\"status\":503}", 3);

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(3)
                .build();

        AurigraphException.ServerError err = assertThrows(AurigraphException.ServerError.class,
                client::stats);
        assertEquals(503, err.getStatusCode());
        assertEquals(3, http.callCount.get());
    }

    @Test
    void transactionSubmitReturnsReceipt() throws Exception {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"txHash\":\"0xabc123\",\"status\":\"PENDING\",\"blockHeight\":1234}");

        AurigraphClient client = AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .apiKey("k")
                .httpClient(http)
                .maxRetries(1)
                .build();

        TransactionSubmitRequest req = new TransactionSubmitRequest("0xaaa", "0xbbb", "100", "USDT");
        req.memo = "invoice-42";
        TransactionReceipt receipt = client.transactions().submit(req);

        assertEquals("0xabc123", receipt.txHash);
        assertEquals("PENDING", receipt.status);
        assertEquals(Long.valueOf(1234L), receipt.blockHeight);
        assertEquals(1, http.callCount.get());
    }
}
