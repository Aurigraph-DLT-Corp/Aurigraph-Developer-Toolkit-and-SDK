package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.ErasureReceipt
import io.aurigraph.sdk.models.GdprExportPayload

/**
 * GDPR operations -- data export, download, and erasure requests.
 *
 * Implements GDPR Articles 17 (right to erasure) and 20 (data portability).
 */
class GdprApi(private val client: AurigraphClient) {

    /** Export all user data as a structured payload (GDPR Article 20). */
    suspend fun exportUserData(userId: String): GdprExportPayload =
        client.get("/gdpr/export/$userId")

    /** Download user data as raw bytes (GDPR Article 20 portable format). */
    suspend fun downloadUserData(userId: String): ByteArray =
        client.getRaw("/gdpr/download/$userId")

    /** Request erasure of all personal data (GDPR Article 17 -- right to be forgotten). */
    suspend fun requestErasure(userId: String): ErasureReceipt =
        client.delete("/gdpr/erasure/$userId")
}
