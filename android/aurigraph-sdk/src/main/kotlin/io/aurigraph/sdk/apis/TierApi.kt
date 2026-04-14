package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.MintQuota
import io.aurigraph.sdk.models.TierConfig
import io.aurigraph.sdk.models.UpgradeRequest
import io.aurigraph.sdk.models.UpgradeResponse
import io.aurigraph.sdk.models.UsageStats

/**
 * Partner tier management -- tier info, usage stats, quotas, and upgrade requests.
 */
class TierApi(private val client: AurigraphClient) {

    /** Get the current partner tier configuration. */
    suspend fun getPartnerTier(): TierConfig = client.get("/sdk/tier")

    /** Get API usage statistics. */
    suspend fun getUsage(): UsageStats = client.get("/sdk/tier/usage")

    /** Get the current mint quota. */
    suspend fun getQuota(): MintQuota = client.get("/sdk/tier/quota")

    /** Request a tier upgrade. */
    suspend fun requestUpgrade(request: UpgradeRequest): UpgradeResponse =
        client.post("/sdk/tier/upgrade", request)
}
