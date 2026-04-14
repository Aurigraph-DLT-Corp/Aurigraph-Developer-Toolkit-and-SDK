package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.GraphQLRequest
import io.aurigraph.sdk.models.GraphQLResponse
import kotlinx.serialization.json.JsonObject

/**
 * GraphQL query interface for flexible data fetching.
 */
class GraphQLApi(private val client: AurigraphClient) {

    /** Execute an arbitrary GraphQL query. */
    suspend fun query(query: String, variables: JsonObject? = null): GraphQLResponse =
        client.post("/graphql", GraphQLRequest(query, variables))

    /** Convenience: query channels via GraphQL. */
    suspend fun queryChannels(fields: String = "id name channelType status"): GraphQLResponse =
        query("{ channels { $fields } }")

    /** Convenience: query assets via GraphQL. */
    suspend fun queryAssets(
        useCaseId: String? = null,
        fields: String = "id name assetType status",
    ): GraphQLResponse {
        val filter = useCaseId?.let { "(useCaseId: \"$it\")" } ?: ""
        return query("{ assets$filter { $fields } }")
    }

    /** Convenience: query contracts via GraphQL. */
    suspend fun queryContracts(fields: String = "id templateId status deployedAt"): GraphQLResponse =
        query("{ contracts { $fields } }")

    /** Convenience: query node metrics via GraphQL. */
    suspend fun queryNodeMetrics(fields: String = "totalNodes activeNodes validatorCount networkStatus"): GraphQLResponse =
        query("{ nodeMetrics { $fields } }")
}
