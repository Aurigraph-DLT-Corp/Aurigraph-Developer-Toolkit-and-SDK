package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.CapabilitiesResponse
import io.aurigraph.sdk.models.ConfigResponse
import io.aurigraph.sdk.models.HeartbeatRequest
import io.aurigraph.sdk.models.HeartbeatResponse
import io.aurigraph.sdk.models.HelloResponse
import java.time.Instant

/**
 * SDK Handshake Protocol -- bootstrap, heartbeat, capabilities, and config.
 *
 * The handshake establishes the SDK session with the platform:
 * 1. [hello] -- bootstrap call returning approved scopes and rate limits
 * 2. [heartbeat] -- keep-alive ping (recommended every 5 minutes)
 * 3. [capabilities] -- list endpoints this app is permitted to call
 * 4. [config] -- lightweight refresh of scopes and rate limits
 */
class HandshakeApi(private val client: AurigraphClient) {

    /** Bootstrap handshake -- returns server metadata, approved scopes, rate limits. */
    suspend fun hello(): HelloResponse = client.get("/sdk/handshake/hello")

    /** Keep-alive heartbeat. Call periodically (default interval from [HelloResponse]). */
    suspend fun heartbeat(clientVersion: String? = null): HeartbeatResponse {
        val body = HeartbeatRequest(
            clientVersion = clientVersion,
            timestamp = Instant.now().toString(),
        )
        return client.post("/sdk/handshake/heartbeat", body)
    }

    /** List all endpoints this app is permitted to call. */
    suspend fun capabilities(): CapabilitiesResponse =
        client.get("/sdk/handshake/capabilities")

    /** Lightweight config refresh (scopes, rate limits). */
    suspend fun config(): ConfigResponse = client.get("/sdk/handshake/config")
}
