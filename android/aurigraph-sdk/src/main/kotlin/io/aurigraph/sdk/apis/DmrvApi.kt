package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.BatchReceipt
import io.aurigraph.sdk.models.DmrvEvent
import io.aurigraph.sdk.models.DmrvReceipt
import kotlinx.serialization.json.JsonObject

/**
 * DMRV (Digital Measurement, Reporting, and Verification) -- event recording
 * and audit trail queries.
 */
class DmrvApi(private val client: AurigraphClient) {

    /** Submit a single DMRV measurement event. */
    suspend fun recordEvent(event: DmrvEvent): DmrvReceipt =
        client.post("/dmrv/events", event)

    /** Query the DMRV audit trail with optional filters. */
    suspend fun getEvents(
        contractId: String? = null,
        deviceId: String? = null,
        eventType: String? = null,
        limit: Int? = null,
    ): JsonObject {
        val params = buildString {
            append("/dmrv/audit-trail")
            val parts = mutableListOf<String>()
            contractId?.let { parts += "contractId=$it" }
            deviceId?.let { parts += "deviceId=$it" }
            eventType?.let { parts += "eventType=$it" }
            limit?.let { parts += "limit=$it" }
            if (parts.isNotEmpty()) append("?${parts.joinToString("&")}")
        }
        return client.get(params)
    }

    /**
     * Record many events in a batch. Automatically splits into chunks of 50
     * to respect server limits.
     */
    suspend fun batchRecord(events: List<DmrvEvent>): BatchReceipt {
        if (events.isEmpty()) return BatchReceipt()

        var totalAccepted = 0
        var totalRejected = 0
        val allReceipts = mutableListOf<DmrvReceipt>()
        val allErrors = mutableListOf<BatchReceipt.BatchError>()

        events.chunked(BATCH_CHUNK_SIZE).forEachIndexed { chunkIndex, chunk ->
            val body = mapOf("events" to chunk)
            val receipt: BatchReceipt = client.post("/dmrv/events/batch", body)
            totalAccepted += receipt.accepted
            totalRejected += receipt.rejected
            allReceipts.addAll(receipt.receipts)
            val offset = chunkIndex * BATCH_CHUNK_SIZE
            receipt.errors.forEach { err ->
                allErrors.add(err.copy(index = err.index + offset))
            }
        }

        return BatchReceipt(
            accepted = totalAccepted,
            rejected = totalRejected,
            receipts = allReceipts,
            errors = allErrors,
        )
    }

    companion object {
        /** Maximum events per batch request -- matches the V12 server limit. */
        const val BATCH_CHUNK_SIZE = 50
    }
}
