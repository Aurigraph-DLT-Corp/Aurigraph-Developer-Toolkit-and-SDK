package io.aurigraph.dlt.sdk;

import io.aurigraph.dlt.sdk.dto.BatchReceipt;
import io.aurigraph.dlt.sdk.dto.DmrvEvent;
import io.aurigraph.dlt.sdk.dto.DmrvReceipt;
import io.aurigraph.dlt.sdk.dto.MintReceipt;
import org.junit.jupiter.api.Test;

import java.io.IOException;
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
 * Tests for {@link io.aurigraph.dlt.sdk.namespace.DmrvApi}.
 *
 * <p>Uses a hand-rolled {@link HttpClient} subclass (rather than Mockito)
 * because on JDK 25 Mockito's inline mocker cannot modify {@code java.net.http.HttpClient}.
 */
class DmrvApiTest {

    private static final String VALID_UUID = "11111111-2222-4333-8444-555555555555";

    /** Test double: returns canned responses in sequence and records requests. */
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

    private AurigraphClient clientWith(StubHttpClient http) {
        return AurigraphClient.builder()
                .baseUrl("https://dlt.aurigraph.io")
                .httpClient(http)
                .maxRetries(1)
                .build();
    }

    @Test
    void t1_recordEventPostsToDmrvEventsAndReturnsReceipt() throws IOException {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200, "{\"eventId\":\"evt-1\",\"status\":\"ACCEPTED\",\"txHash\":\"0xaaa\"}");

        AurigraphClient client = clientWith(http);
        DmrvReceipt receipt = client.dmrv().recordEvent(new DmrvEvent("device-123", "BATTERY_SWAP", 1));

        assertEquals("evt-1", receipt.eventId);
        assertEquals("ACCEPTED", receipt.status);
        assertEquals(1, http.callCount.get());
        HttpRequest req = http.requests.get(0);
        assertEquals("https://dlt.aurigraph.io/api/v11/dmrv/events", req.uri().toString());
        assertEquals("POST", req.method());
    }

    @Test
    void t2_triggerMintWithValidUuidHitsContractEndpoint() throws IOException {
        StubHttpClient http = new StubHttpClient();
        http.enqueue(200,
                "{\"contractId\":\"" + VALID_UUID + "\",\"eventType\":\"CARBON_OFFSET\","
                        + "\"quantity\":5,\"status\":\"MINTED\",\"tokenId\":\"tok-9\",\"txHash\":\"0xbbb\"}");

        AurigraphClient client = clientWith(http);
        MintReceipt receipt = client.dmrv().triggerMint(VALID_UUID, "CARBON_OFFSET", 5);

        assertEquals("MINTED", receipt.status);
        assertEquals("tok-9", receipt.tokenId);
        assertTrue(http.requests.get(0).uri().toString()
                .endsWith("/api/v11/active-contracts/" + VALID_UUID + "/trigger-mint"));
    }

    @Test
    void t3_triggerMintWithBadUuidThrowsClientSideWithoutFetch() {
        StubHttpClient http = new StubHttpClient();
        AurigraphClient client = clientWith(http);

        assertThrows(IllegalArgumentException.class,
                () -> client.dmrv().triggerMint("not-a-uuid", "BATTERY_SWAP", 1));
        assertEquals(0, http.callCount.get(), "no HTTP call should be made");
    }

    @Test
    void t4_batchRecordSplitsIntoChunksOf50() {
        StubHttpClient http = new StubHttpClient();
        // 120 events → 3 chunks (50/50/20)
        http.enqueue(200, "{\"accepted\":50,\"rejected\":0,\"receipts\":[]}");
        http.enqueue(200, "{\"accepted\":50,\"rejected\":0,\"receipts\":[]}");
        http.enqueue(200, "{\"accepted\":20,\"rejected\":0,\"receipts\":[]}");

        AurigraphClient client = clientWith(http);
        List<DmrvEvent> events = new ArrayList<>();
        for (int i = 0; i < 120; i++) {
            events.add(new DmrvEvent("d-" + i, "METER_READING", i));
        }

        BatchReceipt result = client.dmrv().batchRecord(events);
        assertEquals(120, result.accepted);
        assertEquals(0, result.rejected);
        assertEquals(3, http.callCount.get());
    }
}
