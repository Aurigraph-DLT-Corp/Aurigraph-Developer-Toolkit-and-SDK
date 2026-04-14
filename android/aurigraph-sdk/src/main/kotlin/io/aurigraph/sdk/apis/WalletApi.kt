package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.Transaction
import io.aurigraph.sdk.models.TransferReceipt
import io.aurigraph.sdk.models.TransferRequest
import io.aurigraph.sdk.models.WalletBalance

/**
 * Wallet management and token transfers.
 */
class WalletApi(private val client: AurigraphClient) {

    /** Get the balance for a wallet address. */
    suspend fun getBalance(address: String): WalletBalance =
        client.get("/wallet/$address/balance")

    /** Transfer tokens between wallets. */
    suspend fun transfer(request: TransferRequest): TransferReceipt =
        client.post("/wallet/transfer", request)

    /** Get transaction history for a wallet address. */
    suspend fun getHistory(address: String): List<Transaction> =
        client.get("/wallet/$address/history")
}
