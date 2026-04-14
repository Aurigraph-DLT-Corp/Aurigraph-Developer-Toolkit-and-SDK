@file:OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)

package io.aurigraph.sdk

import io.aurigraph.sdk.apis.*
import io.aurigraph.sdk.errors.AurigraphError
import io.aurigraph.sdk.models.HealthResponse
import io.aurigraph.sdk.models.PlatformStats
import io.aurigraph.sdk.models.ProblemDetails
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.Closeable
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Main entry point for the Aurigraph DLT Android/Kotlin SDK.
 *
 * Uses Kotlin coroutines (`suspend` functions) for async operations,
 * OkHttp for HTTP, and kotlinx.serialization for JSON.
 *
 * ```kotlin
 * val client = AurigraphClient.builder()
 *     .baseUrl("https://dlt.aurigraph.io")
 *     .apiKey("your-api-key")
 *     .appId("your-app-id")
 *     .build()
 *
 * val health = client.health()
 * val assets = client.assets.listByUseCase("UC_GOLD")
 *
 * client.close()
 * ```
 */
class AurigraphClient private constructor(
    private val baseUrl: String,
    private val apiKey: String?,
    private val appId: String?,
    private val httpClient: OkHttpClient,
    private val maxRetries: Int,
    internal val json: Json,
) : Closeable {

    /** The base API path appended to all requests. */
    private val apiPrefix = "/api/v11"

    // ── Namespace APIs ───────────────────────────────────────────────────────

    /** Asset-agnostic operations (use cases, assets, channels, public ledger). */
    val assets: AssetsApi by lazy { AssetsApi(this) }

    /** SDK handshake protocol (hello, heartbeat, capabilities, config). */
    val handshake: HandshakeApi by lazy { HandshakeApi(this) }

    /** GDPR data export and erasure. */
    val gdpr: GdprApi by lazy { GdprApi(this) }

    /** Partner tier management. */
    val tier: TierApi by lazy { TierApi(this) }

    /** On-chain governance (proposals, voting, treasury). */
    val governance: GovernanceApi by lazy { GovernanceApi(this) }

    /** Wallet management and token transfers. */
    val wallet: WalletApi by lazy { WalletApi(this) }

    /** Regulatory compliance assessment. */
    val compliance: ComplianceApi by lazy { ComplianceApi(this) }

    /** Network node management. */
    val nodes: NodesApi by lazy { NodesApi(this) }

    /** Channel management. */
    val channels: ChannelsApi by lazy { ChannelsApi(this) }

    /** Transaction submission and querying. */
    val transactions: TransactionsApi by lazy { TransactionsApi(this) }

    /** DMRV (Digital Measurement, Reporting, and Verification). */
    val dmrv: DmrvApi by lazy { DmrvApi(this) }

    /** Smart contract operations. */
    val contracts: ContractsApi by lazy { ContractsApi(this) }

    /** GraphQL query interface. */
    val graphql: GraphQLApi by lazy { GraphQLApi(this) }

    // ── Top-Level Convenience ────────────────────────────────────────────────

    /** Check platform health. */
    suspend fun health(): HealthResponse = get("/health")

    /** Get platform statistics (TPS, active nodes, block height). */
    suspend fun stats(): PlatformStats = get("/stats")

    // ── Internal HTTP Methods ────────────────────────────────────────────────

    /**
     * Perform a GET request and decode the JSON response to [T].
     */
    internal suspend inline fun <reified T> get(path: String): T {
        val request = buildRequest("GET", path)
        val body = executeWithRetry(request)
        return json.decodeFromString(serializer(), body)
    }

    /**
     * Perform a POST request with an optional body and decode the response to [T].
     */
    internal suspend inline fun <reified T> post(path: String, body: Any? = null): T {
        val jsonBody = when (body) {
            null -> "{}".toRequestBody(JSON_MEDIA_TYPE)
            is String -> body.toRequestBody(JSON_MEDIA_TYPE)
            else -> json.encodeToString(serializer(), body).toRequestBody(JSON_MEDIA_TYPE)
        }
        val request = buildRequest("POST", path, jsonBody)
        val responseBody = executeWithRetry(request)
        return json.decodeFromString(serializer(), responseBody)
    }

    /**
     * Perform a DELETE request and decode the response to [T].
     */
    internal suspend inline fun <reified T> delete(path: String): T {
        val request = buildRequest("DELETE", path)
        val body = executeWithRetry(request)
        return json.decodeFromString(serializer(), body)
    }

    /**
     * Perform a GET request and return the raw response body as a [ByteArray].
     */
    internal suspend fun getRaw(path: String): ByteArray {
        val request = buildRequest("GET", path)
        return executeRawWithRetry(request)
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private fun buildRequest(
        method: String,
        path: String,
        body: RequestBody? = null,
    ): Request {
        val fullPath = if (path.startsWith(apiPrefix)) path else "$apiPrefix$path"
        val url = baseUrl.trimEnd('/') + fullPath

        val builder = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")

        // Auth: prefer appId+apiKey combo, fallback to apiKey-only
        if (appId != null && apiKey != null) {
            builder.header("Authorization", "ApiKey $appId:$apiKey")
        } else if (apiKey != null) {
            builder.header("X-API-Key", apiKey)
        }

        when (method) {
            "GET" -> builder.get()
            "POST" -> builder.post(body ?: "{}".toRequestBody(JSON_MEDIA_TYPE))
            "DELETE" -> builder.delete(body)
            "PUT" -> builder.put(body ?: "{}".toRequestBody(JSON_MEDIA_TYPE))
            else -> builder.method(method, body)
        }

        return builder.build()
    }

    /**
     * Execute a request with retry logic for 5xx and network errors.
     * Uses exponential backoff: 500ms, 1000ms, 2000ms, ...
     */
    private suspend fun executeWithRetry(request: Request): String {
        var lastException: Exception? = null
        for (attempt in 0..maxRetries) {
            if (attempt > 0) {
                kotlinx.coroutines.delay(500L * (1L shl (attempt - 1)))
            }
            try {
                val response = executeAsync(request)
                val responseBody = response.body?.string() ?: ""
                val code = response.code

                if (code in 200..299) {
                    return responseBody
                }

                // Parse RFC 7807 problem details
                val problem = tryParseProblem(responseBody, code)

                if (code in 500..599 && attempt < maxRetries) {
                    lastException = AurigraphError.ServerError(problem)
                    continue // retry on 5xx
                }

                if (code in 400..499) {
                    throw AurigraphError.ClientError(problem)
                }
                throw AurigraphError.ServerError(problem)
            } catch (e: AurigraphError) {
                if (e is AurigraphError.ServerError && attempt < maxRetries) {
                    lastException = e
                    continue
                }
                throw e
            } catch (e: IOException) {
                lastException = e
                if (attempt < maxRetries) continue
                throw AurigraphError.NetworkError(e)
            }
        }
        throw lastException ?: AurigraphError.NetworkError(IOException("Request failed after $maxRetries retries"))
    }

    /**
     * Execute a request with retry logic, returning raw bytes.
     */
    private suspend fun executeRawWithRetry(request: Request): ByteArray {
        var lastException: Exception? = null
        for (attempt in 0..maxRetries) {
            if (attempt > 0) {
                kotlinx.coroutines.delay(500L * (1L shl (attempt - 1)))
            }
            try {
                val response = executeAsync(request)
                val bytes = response.body?.bytes() ?: byteArrayOf()
                val code = response.code

                if (code in 200..299) return bytes

                val problem = tryParseProblem(bytes.decodeToString(), code)
                if (code in 500..599 && attempt < maxRetries) {
                    lastException = AurigraphError.ServerError(problem)
                    continue
                }
                if (code in 400..499) throw AurigraphError.ClientError(problem)
                throw AurigraphError.ServerError(problem)
            } catch (e: AurigraphError) {
                if (e is AurigraphError.ServerError && attempt < maxRetries) {
                    lastException = e
                    continue
                }
                throw e
            } catch (e: IOException) {
                lastException = e
                if (attempt < maxRetries) continue
                throw AurigraphError.NetworkError(e)
            }
        }
        throw lastException ?: AurigraphError.NetworkError(IOException("Request failed after $maxRetries retries"))
    }

    private fun tryParseProblem(responseBody: String, statusCode: Int): ProblemDetails {
        return try {
            json.decodeFromString(ProblemDetails.serializer(), responseBody)
        } catch (_: Exception) {
            ProblemDetails(
                title = "HTTP $statusCode",
                status = statusCode,
                detail = responseBody.ifBlank { null },
            )
        }
    }

    /**
     * Bridge OkHttp async callback to a suspend function.
     */
    private suspend fun executeAsync(request: Request): Response =
        suspendCancellableCoroutine { cont ->
            val call = httpClient.newCall(request)
            cont.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    if (cont.isActive) cont.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    if (cont.isActive) cont.resume(response)
                }
            })
        }

    override fun close() {
        httpClient.dispatcher.executorService.shutdown()
        httpClient.connectionPool.evictAll()
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    /**
     * Fluent builder for [AurigraphClient].
     */
    class Builder {
        private var baseUrl: String? = null
        private var apiKey: String? = null
        private var appId: String? = null
        private var timeoutSeconds: Long = 30
        private var maxRetries: Int = 2

        /** Set the platform base URL (e.g., `https://dlt.aurigraph.io`). Required. */
        fun baseUrl(url: String) = apply { this.baseUrl = url.trimEnd('/') }

        /** Set the API key for authentication. */
        fun apiKey(key: String) = apply { this.apiKey = key }

        /** Set the application ID (UUID) issued during 3rd-party registration. */
        fun appId(id: String) = apply { this.appId = id }

        /** Set the per-request timeout in seconds (default: 30). */
        fun timeout(seconds: Long) = apply { this.timeoutSeconds = seconds }

        /** Set the maximum number of retries on 5xx/network errors (default: 2). */
        fun maxRetries(retries: Int) = apply { this.maxRetries = retries }

        /**
         * Build and return a new [AurigraphClient].
         *
         * @throws AurigraphError.ConfigError if required parameters are missing.
         */
        fun build(): AurigraphClient {
            val url = baseUrl
                ?: throw AurigraphError.ConfigError("baseUrl is required")

            if (url.isBlank()) {
                throw AurigraphError.ConfigError("baseUrl must not be blank")
            }

            val httpClient = OkHttpClient.Builder()
                .connectTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .readTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .writeTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .build()

            val json = Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
                explicitNulls = false
            }

            return AurigraphClient(
                baseUrl = url,
                apiKey = apiKey,
                appId = appId,
                httpClient = httpClient,
                maxRetries = maxRetries,
                json = json,
            )
        }
    }

    companion object {
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

        /** Create a new [Builder] for configuring an [AurigraphClient]. */
        fun builder(): Builder = Builder()
    }
}
