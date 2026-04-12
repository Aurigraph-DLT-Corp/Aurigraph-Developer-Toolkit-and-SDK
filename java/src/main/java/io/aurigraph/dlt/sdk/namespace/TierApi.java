package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.UpgradeRequest;
import io.aurigraph.dlt.sdk.handshake.MintQuota;
import io.aurigraph.dlt.sdk.handshake.TierConfig;
import io.aurigraph.dlt.sdk.handshake.UsageStats;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Namespace for /api/v11/sdk/partner endpoints — SDK tier management.
 */
public class TierApi {

    private final AurigraphClient client;

    public TierApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * Get the current partner tier configuration.
     */
    public TierConfig getPartnerTier() {
        return client.get("/sdk/partner/tier", TierConfig.class);
    }

    /**
     * Get current SDK usage statistics.
     */
    public UsageStats getUsage() {
        return client.get("/sdk/partner/usage", UsageStats.class);
    }

    /**
     * Get remaining mint quota for the current billing period.
     */
    public MintQuota getQuota() {
        return client.get("/sdk/partner/quota", MintQuota.class);
    }

    /**
     * Request an upgrade to a higher SDK tier.
     */
    public UpgradeRequest requestUpgrade(String targetTier) {
        String enc = URLEncoder.encode(targetTier, StandardCharsets.UTF_8);
        return client.post("/sdk/partner/tier/upgrade", Map.of("targetTier", enc), UpgradeRequest.class);
    }
}
