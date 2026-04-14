@file:OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)

package io.aurigraph.sdk

import io.aurigraph.sdk.errors.AurigraphError
import io.aurigraph.sdk.models.HealthResponse
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import kotlin.test.*

class AurigraphClientTest {

    private lateinit var server: MockWebServer
    private lateinit var client: AurigraphClient
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true; explicitNulls = false }

    @BeforeTest
    fun setUp() {
        server = MockWebServer()
        server.start()
        client = AurigraphClient.builder()
            .baseUrl(server.url("/").toString())
            .apiKey("test-key")
            .appId("test-app")
            .maxRetries(0)
            .build()
    }

    @AfterTest
    fun tearDown() {
        client.close()
        server.shutdown()
    }

    // ── Builder Validation ───────────────────────────────────────────────────

    @Test
    fun `builder throws ConfigError when baseUrl is missing`() {
        val ex = assertFailsWith<AurigraphError.ConfigError> {
            AurigraphClient.builder().build()
        }
        assertTrue(ex.message!!.contains("baseUrl"))
    }

    @Test
    fun `builder throws ConfigError when baseUrl is blank`() {
        val ex = assertFailsWith<AurigraphError.ConfigError> {
            AurigraphClient.builder().baseUrl("  ").build()
        }
        assertTrue(ex.message!!.contains("blank"))
    }

    // ── Health ───────────────────────────────────────────────────────────────

    @Test
    fun `health returns parsed HealthResponse`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("""{"status":"UP","durationMs":8,"version":"12.1.34"}""")
        )

        val health = client.health()
        assertEquals("UP", health.status)
        assertEquals(8, health.durationMs)
        assertEquals("12.1.34", health.version)

        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/api/v11/health", request.path)
        assertEquals("ApiKey test-app:test-key", request.getHeader("Authorization"))
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @Test
    fun `stats returns parsed PlatformStats`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("""{"tps":1934728.0,"activeNodes":37,"blockHeight":55000,"totalTransactions":128000}""")
        )

        val stats = client.stats()
        assertEquals(1934728.0, stats.tps)
        assertEquals(37, stats.activeNodes)
        assertEquals(55000, stats.blockHeight)
        assertEquals(128000, stats.totalTransactions)
    }

    // ── Assets API ───────────────────────────────────────────────────────────

    @Test
    fun `assets listByUseCase sends correct path`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("""{"items":[],"total":0}""")
        )

        client.assets.listByUseCase("UC_GOLD")

        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertTrue(request.path!!.contains("useCase=UC_GOLD"))
    }

    // ── Handshake API ────────────────────────────────────────────────────────

    @Test
    fun `handshake hello returns parsed HelloResponse`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(
                    """{
                        "appId":"test-app","appName":"Test","did":"did:aurigraph:test",
                        "status":"ACTIVE","serverVersion":"12.1.34","protocolVersion":"1.0",
                        "approvedScopes":["read"],"requestedScopes":[],"pendingScopes":[],
                        "rateLimit":{"requestsPerMinute":60,"burstSize":10},
                        "heartbeatIntervalMs":300000,"features":{},"nextHeartbeatAt":"2026-04-13T12:00:00Z"
                    }"""
                )
        )

        val hello = client.handshake.hello()
        assertEquals("test-app", hello.appId)
        assertEquals("ACTIVE", hello.status)
        assertEquals(listOf("read"), hello.approvedScopes)

        val request = server.takeRequest()
        assertEquals("/api/v11/sdk/handshake/hello", request.path)
    }

    // ── Error Handling ───────────────────────────────────────────────────────

    @Test
    fun `client error returns ClientError with ProblemDetails`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/problem+json")
                .setBody(
                    """{
                        "type":"about:blank","title":"Not Found","status":404,
                        "detail":"Asset not found","instance":"/api/v11/rwa/assets/unknown",
                        "errorCode":"ASSET_NOT_FOUND","traceId":"abc-123"
                    }"""
                )
        )

        val ex = assertFailsWith<AurigraphError.ClientError> {
            client.assets.get("unknown")
        }
        assertEquals(404, ex.problem.status)
        assertEquals("ASSET_NOT_FOUND", ex.problem.errorCode)
        assertTrue(ex.message!!.contains("Asset not found"))
    }

    @Test
    fun `server error returns ServerError on 500`() = runTest {
        server.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setHeader("Content-Type", "application/json")
                .setBody("""{"type":"about:blank","title":"Internal Server Error","status":500,"detail":"Something went wrong"}""")
        )

        val ex = assertFailsWith<AurigraphError.ServerError> {
            client.health()
        }
        assertEquals(500, ex.problem.status)
    }

    // ── API Key Header ───────────────────────────────────────────────────────

    @Test
    fun `client without appId sends X-API-Key header`() = runTest {
        val noAppClient = AurigraphClient.builder()
            .baseUrl(server.url("/").toString())
            .apiKey("solo-key")
            .maxRetries(0)
            .build()

        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("""{"status":"UP"}""")
        )

        noAppClient.health()
        val request = server.takeRequest()
        assertNull(request.getHeader("Authorization"))
        assertEquals("solo-key", request.getHeader("X-API-Key"))

        noAppClient.close()
    }
}
