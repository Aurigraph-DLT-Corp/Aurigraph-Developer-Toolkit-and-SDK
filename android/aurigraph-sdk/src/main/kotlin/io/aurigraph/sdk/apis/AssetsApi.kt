package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.Asset
import io.aurigraph.sdk.models.UseCase
import kotlinx.serialization.json.JsonObject

/**
 * Asset-agnostic API for querying use cases, assets, and public ledgers.
 *
 * Works with ANY asset type (Gold, Carbon, Real Estate, IP, etc.).
 * Asset-specific behavior is driven by the `useCaseId` parameter.
 *
 * ```kotlin
 * val assets = client.assets.listByUseCase("UC_GOLD")
 * val ledger = client.assets.getPublicLedger("UC_GOLD")
 * ```
 */
class AssetsApi(private val client: AurigraphClient) {

    // ── Use Cases ────────────────────────────────────────────────────────────

    /** List all registered use cases (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.). */
    suspend fun listUseCases(): List<UseCase> = client.get("/use-cases")

    /** Get a specific use case by ID. */
    suspend fun getUseCase(useCaseId: String): UseCase = client.get("/use-cases/$useCaseId")

    // ── Assets (generic) ─────────────────────────────────────────────────────

    /** Query assets with optional filters. Returns raw JSON for maximum flexibility. */
    suspend fun query(
        useCase: String? = null,
        type: String? = null,
        status: String? = null,
        channelId: String? = null,
        limit: Int = 100,
        offset: Int = 0,
    ): JsonObject {
        val params = buildString {
            append("/rwa/query?limit=$limit&offset=$offset")
            useCase?.let { append("&useCase=$it") }
            type?.let { append("&type=$it") }
            status?.let { append("&status=$it") }
            channelId?.let { append("&channelId=$it") }
        }
        return client.get(params)
    }

    /** List all RWA assets across all use cases. */
    suspend fun list(): JsonObject = query()

    /** Get a single asset by ID (any asset type). */
    suspend fun get(assetId: String): Asset = client.get("/rwa/assets/$assetId")

    /** List assets filtered by use case (e.g., "UC_GOLD", "UC_CARBON"). */
    suspend fun listByUseCase(useCaseId: String): JsonObject = query(useCase = useCaseId)

    /** List assets filtered by asset type (e.g., "COMMODITY", "REAL_ESTATE"). */
    suspend fun listByType(type: String): JsonObject = query(type = type)

    /** List assets filtered by channel ID. */
    suspend fun listByChannel(channelId: String): JsonObject = query(channelId = channelId)

    /** Get use case summary with asset counts per use case. */
    suspend fun useCaseSummary(): JsonObject = client.get("/rwa/query/use-cases")

    /** Get type summary with asset counts per type. */
    suspend fun typeSummary(): JsonObject = client.get("/rwa/query/types")

    // ── Multi-Channel Assignments ────────────────────────────────────────────

    /** List all channels an asset is assigned to (many-to-many). */
    suspend fun channelsForAsset(assetId: String): JsonObject =
        client.get("/asset-channels/$assetId")

    /** List all assets in a channel. */
    suspend fun assetsInChannel(channelId: String): JsonObject =
        client.get("/asset-channels/channel/$channelId")

    // ── Secondary Tokens ─────────────────────────────────────────────────────

    /** List derived/secondary tokens for an asset. */
    suspend fun listDerivedTokens(assetId: String): JsonObject =
        client.get("/rwa/$assetId/derived-tokens")

    // ── Compliance (asset-agnostic) ──────────────────────────────────────────

    /** Get compliance status for an asset against a specific framework. */
    suspend fun getComplianceStatus(assetId: String, framework: String): JsonObject =
        client.get("/rwa/$assetId/compliance/$framework")

    // ── Public Ledger ────────────────────────────────────────────────────────

    /** Get public ledger for a specific use case (asset-agnostic). */
    suspend fun getPublicLedger(useCaseId: String): JsonObject {
        val path = when (useCaseId) {
            "UC_GOLD" -> "/rwa/gold/public/ledger"
            "UC_PROVENEWS" -> "/provenews/contracts"
            else -> "/use-cases/$useCaseId/assets"
        }
        return client.get(path)
    }

    /** List active contracts for a use case. */
    suspend fun listContracts(useCaseId: String): JsonObject =
        client.get("/use-cases/$useCaseId/contracts")
}
