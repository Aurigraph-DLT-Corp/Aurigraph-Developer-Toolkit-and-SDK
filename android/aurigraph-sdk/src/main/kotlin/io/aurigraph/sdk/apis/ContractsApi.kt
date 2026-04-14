package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.ContractDeployRequest
import io.aurigraph.sdk.models.ContractInfo
import io.aurigraph.sdk.models.ContractInvokeRequest
import io.aurigraph.sdk.models.ContractInvokeResult

/**
 * Smart contract operations -- deploy, invoke, and query.
 */
class ContractsApi(private val client: AurigraphClient) {

    /** Deploy a new contract from a template. */
    suspend fun deploy(request: ContractDeployRequest): ContractInfo =
        client.post("/contracts/deploy", request)

    /** Invoke a method on a deployed contract. */
    suspend fun invoke(contractId: String, request: ContractInvokeRequest): ContractInvokeResult =
        client.post("/contracts/$contractId/invoke", request)

    /** Get information about a deployed contract. */
    suspend fun get(contractId: String): ContractInfo =
        client.get("/contracts/$contractId")
}
