package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.NodeInfo
import io.aurigraph.sdk.models.NodeMetrics
import io.aurigraph.sdk.models.NodeRegisterRequest
import kotlinx.serialization.json.JsonObject

/**
 * Network node management -- listing, registration, and metrics.
 */
class NodesApi(private val client: AurigraphClient) {

    /** List all nodes in the network. */
    suspend fun list(page: Int = 0, pageSize: Int = 50): JsonObject =
        client.get("/nodes?page=$page&pageSize=$pageSize")

    /** Get a specific node by ID. */
    suspend fun get(nodeId: String): NodeInfo = client.get("/nodes/$nodeId")

    /** Get aggregate node metrics (total, active, validators, network status). */
    suspend fun metrics(): NodeMetrics = client.get("/nodes/metrics")

    /** Get node storage stats. */
    suspend fun stats(): JsonObject = client.get("/nodes/stats")

    /** Register a new node in the network. */
    suspend fun register(request: NodeRegisterRequest): NodeInfo =
        client.post("/nodes", request)
}
