package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.Transaction
import io.aurigraph.sdk.models.TransactionReceipt
import io.aurigraph.sdk.models.TransactionSubmitRequest
import kotlinx.serialization.json.JsonObject

/**
 * Transaction submission and querying.
 */
class TransactionsApi(private val client: AurigraphClient) {

    /** Submit a new transaction to the network. */
    suspend fun submit(request: TransactionSubmitRequest): TransactionReceipt =
        client.post("/transactions", request)

    /** Get a specific transaction by hash. */
    suspend fun get(txHash: String): Transaction = client.get("/transactions/$txHash")

    /** List recent transactions. */
    suspend fun listRecent(limit: Int = 20): JsonObject =
        client.get("/transactions/recent?limit=$limit")
}
