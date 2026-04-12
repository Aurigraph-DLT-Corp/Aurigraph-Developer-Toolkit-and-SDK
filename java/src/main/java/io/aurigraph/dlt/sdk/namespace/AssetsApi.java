package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.UseCase;

import java.util.List;
import java.util.Map;

/**
 * Asset-agnostic namespace for /api/v11/rwa and /api/v11/use-cases endpoints.
 *
 * <p>Works with ANY asset type — Gold, Carbon, Real Estate, IP, etc.
 * Asset-specific behavior is driven by the {@code useCaseId} field,
 * not by separate API classes.
 *
 * <h2>Usage</h2>
 * <pre>{@code
 * // List all assets (any type)
 * var assets = client.assets().list();
 *
 * // Filter by use case
 * var goldAssets = client.assets().listByUseCase("UC_GOLD");
 *
 * // Filter by channel
 * var channelAssets = client.assets().listByChannel("ch-a5e40888");
 *
 * // Get single asset (any type)
 * var asset = client.assets().get("asset-uuid");
 *
 * // Get public ledger for a use case
 * var ledger = client.assets().getPublicLedger("UC_GOLD");
 * }</pre>
 */
public class AssetsApi {

    private final AurigraphClient client;

    public AssetsApi(AurigraphClient client) {
        this.client = client;
    }

    // ── Use Cases ─────────────────────────────────────────────────────────────

    /** List all registered use cases (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.) */
    @SuppressWarnings("unchecked")
    public List<UseCase> listUseCases() {
        return client.get("/use-cases", new TypeReference<List<UseCase>>() {});
    }

    /** Get a specific use case by ID. */
    public UseCase getUseCase(String useCaseId) {
        return client.get("/use-cases/" + useCaseId, UseCase.class);
    }

    // ── Assets (generic) ──────────────────────────────────────────────────────

    /** Query assets with optional filters. Returns paginated results. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> query(String useCase, String type, String status,
                                      String channelId, int limit, int offset) {
        StringBuilder path = new StringBuilder("/rwa/query?limit=" + limit + "&offset=" + offset);
        if (useCase != null) path.append("&useCase=").append(useCase);
        if (type != null) path.append("&type=").append(type);
        if (status != null) path.append("&status=").append(status);
        if (channelId != null) path.append("&channelId=").append(channelId);
        return client.get(path.toString(), new TypeReference<Map<String, Object>>() {});
    }

    /** List all RWA assets across all use cases. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> list() {
        return query(null, null, null, null, 100, 0);
    }

    /** Get a single asset by ID (any asset type). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> get(String assetId) {
        return client.get("/rwa/assets/" + assetId, new TypeReference<Map<String, Object>>() {});
    }

    /** List assets filtered by use case (e.g., "UC_GOLD", "UC_CARBON"). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> listByUseCase(String useCaseId) {
        return query(useCaseId, null, null, null, 100, 0);
    }

    /** List assets filtered by channel ID. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> listByChannel(String channelId) {
        return query(null, null, null, channelId, 100, 0);
    }

    /** List assets filtered by asset type (e.g., "COMMODITY", "REAL_ESTATE"). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> listByType(String type) {
        return query(null, type, null, null, 100, 0);
    }

    /** Get use case summary with asset counts per use case. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> useCaseSummary() {
        return client.get("/rwa/query/use-cases", new TypeReference<Map<String, Object>>() {});
    }

    /** Get type summary with asset counts per type. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> typeSummary() {
        return client.get("/rwa/query/types", new TypeReference<Map<String, Object>>() {});
    }

    // ── Public Ledger (per use case) ──────────────────────────────────────────

    /** Get public ledger for a specific use case (asset-agnostic). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getPublicLedger(String useCaseId) {
        String path = switch (useCaseId) {
            case "UC_GOLD" -> "/rwa/gold/public/ledger";
            case "UC_PROVENEWS" -> "/provenews/contracts";
            default -> "/use-cases/" + useCaseId + "/assets";
        };
        return client.get(path, new TypeReference<Map<String, Object>>() {});
    }

    // ── Contracts (per use case) ──────────────────────────────────────────────

    /** List active contracts for a use case. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listContracts(String useCaseId) {
        return client.get("/use-cases/" + useCaseId + "/contracts",
                new TypeReference<List<Map<String, Object>>>() {});
    }

    // ── Multi-Channel Assignments ───────────────────────────────────────────

    /** List all channels an asset is assigned to (many-to-many). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> channelsForAsset(String assetId) {
        return client.get("/asset-channels/" + assetId, new TypeReference<Map<String, Object>>() {});
    }

    /** List all assets in a channel. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> assetsInChannel(String channelId) {
        return client.get("/asset-channels/channel/" + channelId, new TypeReference<Map<String, Object>>() {});
    }

    // ── Compliance (asset-agnostic) ───────────────────────────────────────────

    /** Get compliance status for an asset against a specific framework. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getComplianceStatus(String assetId, String framework) {
        return client.get("/rwa/" + assetId + "/compliance/" + framework,
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Secondary Tokens ──────────────────────────────────────────────────────

    /** List derived/secondary tokens for an asset. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listDerivedTokens(String assetId) {
        return client.get("/rwa/" + assetId + "/derived-tokens",
                new TypeReference<List<Map<String, Object>>>() {});
    }
}
