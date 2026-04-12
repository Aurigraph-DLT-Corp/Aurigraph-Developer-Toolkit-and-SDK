package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.exception.AurigraphException;
import io.aurigraph.dlt.sdk.handshake.CapabilitiesResponse;
import io.aurigraph.dlt.sdk.handshake.ConfigResponse;
import io.aurigraph.dlt.sdk.handshake.HeartbeatResponse;
import io.aurigraph.dlt.sdk.handshake.HelloResponse;
import io.aurigraph.dlt.sdk.handshake.MintQuota;
import io.aurigraph.dlt.sdk.handshake.PartnerProfile;
import io.aurigraph.dlt.sdk.handshake.SdkMintRequest;
import io.aurigraph.dlt.sdk.handshake.SdkMintResponse;
import io.aurigraph.dlt.sdk.handshake.TierConfig;
import io.aurigraph.dlt.sdk.handshake.TokenTypeDescriptor;
import io.aurigraph.dlt.sdk.handshake.UsageStats;
import io.aurigraph.dlt.sdk.handshake.WebhookInfo;
import io.aurigraph.dlt.sdk.handshake.WebhookRegistration;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SDK handshake + tier management namespace.
 *
 * <p>Handshake endpoints under {@code /api/v11/sdk/handshake/*} and tier
 * management endpoints under {@code /api/v11/sdk/*} require a valid
 * {@code Authorization: ApiKey <appId>:<rawKey>} header and return metadata
 * scoped to the authenticated SDK application.
 */
public class SdkHandshakeApi {

    private final AurigraphClient client;

    public SdkHandshakeApi(AurigraphClient client) {
        this.client = client;
    }

    // ── Handshake Protocol ────────────────────────────────────────────────────

    /** Bootstrap call — returns full server metadata + app permissions. */
    public HelloResponse hello() {
        return client.get("/sdk/handshake/hello", HelloResponse.class);
    }

    /** Liveness ping — call every 5 minutes. */
    public HeartbeatResponse heartbeat(String clientVersion) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clientVersion", clientVersion != null ? clientVersion : "unknown");
        body.put("timestamp", Instant.now().toString());
        return client.post("/sdk/handshake/heartbeat", body, HeartbeatResponse.class);
    }

    /** Returns endpoint list filtered by this app's approved scopes. */
    public CapabilitiesResponse capabilities() {
        return client.get("/sdk/handshake/capabilities", CapabilitiesResponse.class);
    }

    /** Lightweight refresh — detects scope/status changes. */
    public ConfigResponse config() {
        return client.get("/sdk/handshake/config", ConfigResponse.class);
    }

    // ── Tier Management ───────────────────────────────────────────────────────

    /** Get partner profile + tier details. */
    public PartnerProfile profile() {
        return client.get("/sdk/partner/profile", PartnerProfile.class);
    }

    /** Get current tier config + limits. */
    public TierConfig tier() {
        return client.get("/sdk/partner/tier", TierConfig.class);
    }

    /** Get current period usage stats. */
    public UsageStats usage() {
        return client.get("/sdk/partner/usage", UsageStats.class);
    }

    /** Get remaining quota for mint/DMRV/composite. */
    public MintQuota mintQuota() {
        return client.get("/sdk/mint/quota", MintQuota.class);
    }

    /** List token types available at current tier. */
    public List<TokenTypeDescriptor> tokenTypes() {
        Map<String, List<TokenTypeDescriptor>> raw = client.get(
                "/sdk/token-types",
                new TypeReference<Map<String, List<TokenTypeDescriptor>>>() {}
        );
        if (raw == null) return Collections.emptyList();
        List<TokenTypeDescriptor> types = raw.get("tokenTypes");
        return types != null ? types : Collections.emptyList();
    }

    /** Mint a token with tier enforcement. Defaults useCaseId to UC_BATTUA on server. */
    public SdkMintResponse mint(SdkMintRequest req) {
        return client.post("/sdk/mint", req, SdkMintResponse.class);
    }

    /**
     * Mint with pre-flight quota check. Throws early if quota would be exceeded.
     *
     * @throws AurigraphException.ClientError with status 429 if quota insufficient
     */
    public SdkMintResponse mintSafe(SdkMintRequest req) {
        MintQuota quota = mintQuota();
        if (quota.mintMonthlyLimit() != -1 && quota.mintMonthlyRemaining() < req.amount()) {
            Map<String, Object> problem = new LinkedHashMap<>();
            problem.put("type", "about:blank");
            problem.put("title", "Quota Exceeded");
            problem.put("status", 429);
            problem.put("errorCode", "SDK_QUOTA_PREFLIGHT");
            problem.put("detail", "Mint quota insufficient: " + quota.mintMonthlyRemaining()
                    + " remaining, " + req.amount() + " requested");
            throw new AurigraphException.ClientError(
                    "Mint quota insufficient: " + quota.mintMonthlyRemaining() + " remaining",
                    429, problem, "/sdk/mint");
        }
        return mint(req);
    }

    /** Record a DMRV event with daily quota enforcement. */
    public Map<String, Object> recordDmrv(Map<String, Object> event) {
        return client.post("/sdk/dmrv/record", event,
                new TypeReference<Map<String, Object>>() {});
    }

    /** List webhooks. */
    public List<WebhookInfo> webhooks() {
        Map<String, List<WebhookInfo>> raw = client.get(
                "/sdk/webhooks",
                new TypeReference<Map<String, List<WebhookInfo>>>() {}
        );
        if (raw == null) return Collections.emptyList();
        List<WebhookInfo> hooks = raw.get("webhooks");
        return hooks != null ? hooks : Collections.emptyList();
    }

    /** Register a webhook. */
    public Map<String, Object> registerWebhook(WebhookRegistration reg) {
        return client.post("/sdk/webhooks", reg,
                new TypeReference<Map<String, Object>>() {});
    }

    /** Delete a webhook. */
    public void deleteWebhook(String webhookId) {
        client.delete("/sdk/webhooks/" + webhookId);
    }
}
