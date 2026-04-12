package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.UseCase;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Namespace for registry endpoints: Battua tokens, Battua nodes, Provenews,
 * Use Cases, and the generic Token Registry ({@link TokenRegistryApi}).
 */
public class RegistriesApi {

    private final AurigraphClient client;
    private final TokenRegistryApi tokensApi;

    public RegistriesApi(AurigraphClient client) {
        this.client = client;
        this.tokensApi = new TokenRegistryApi(client);
    }

    /** Generic Token Registry — list/get/create/mint /api/v11/registries/tokens. */
    public TokenRegistryApi tokens() { return tokensApi; }

    // ── Battua registry ───────────────────────────────────────────────────────

    public JsonNode battuaStats() {
        return client.get("/registries/battua", JsonNode.class);
    }

    public List<Map<String, Object>> battuaTokens() {
        return unwrap(client.get("/registries/battua", JsonNode.class), "tokens");
    }

    public Map<String, Object> battuaGetToken(String tokenId) {
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.get("/registries/battua/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> battuaGetTokenByTxHash(String txHash) {
        String enc = URLEncoder.encode(txHash, StandardCharsets.UTF_8);
        return client.get("/registries/battua/tx/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> battuaMint(Map<String, Object> mintRequest) {
        return client.post("/registries/battua/mint", mintRequest,
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> battuaNodes() {
        return unwrap(client.get("/registries/battua-nodes", JsonNode.class), "nodes");
    }

    public Map<String, Object> battuaGetNode(String nodeId) {
        String enc = URLEncoder.encode(nodeId, StandardCharsets.UTF_8);
        return client.get("/registries/battua-nodes/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> battuaNodeStats() {
        return client.get("/registries/battua-nodes/stats",
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> registerBattuaNodeHeartbeat(Map<String, Object> registration) {
        return client.post("/registries/battua-nodes/register", registration,
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Provenews contracts ───────────────────────────────────────────────────

    public List<Map<String, Object>> provenewsContracts() {
        return unwrap(client.get("/provenews/contracts", JsonNode.class), "contracts");
    }

    public Map<String, Object> provenewsCreateContract(Map<String, Object> request) {
        return client.post("/provenews/contracts", request,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsGetContract(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return client.get("/provenews/contracts/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsGetContractByToken(String tokenId) {
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.get("/provenews/contracts/token/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> provenewsGetContractsByOwner(String ownerId) {
        String enc = URLEncoder.encode(ownerId, StandardCharsets.UTF_8);
        return unwrap(client.get("/provenews/contracts/owner/" + enc, JsonNode.class), "contracts");
    }

    public Map<String, Object> provenewsRecordRevenue(String contractId, Map<String, Object> request) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return client.post("/provenews/contracts/" + enc + "/revenue", request,
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> provenewsListRevenue(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return unwrap(client.get("/provenews/contracts/" + enc + "/revenue", JsonNode.class), "events");
    }

    public Map<String, Object> provenewsSuspendContract(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return client.put("/provenews/contracts/" + enc + "/suspend", null,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsTerminateContract(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return client.put("/provenews/contracts/" + enc + "/terminate", null,
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Provenews ledger ──────────────────────────────────────────────────────

    public List<Map<String, Object>> provenewsAssets() {
        return unwrap(client.get("/provenews/ledger/assets", JsonNode.class), "assets");
    }

    public Map<String, Object> provenewsRegisterAsset(Map<String, Object> request) {
        return client.post("/provenews/ledger/assets", request,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsGetAsset(String assetId) {
        String enc = URLEncoder.encode(assetId, StandardCharsets.UTF_8);
        return client.get("/provenews/ledger/assets/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsGetAssetProof(String assetId) {
        String enc = URLEncoder.encode(assetId, StandardCharsets.UTF_8);
        return client.get("/provenews/ledger/assets/" + enc + "/proof",
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> provenewsCheckpoints() {
        return unwrap(client.get("/provenews/ledger/checkpoints", JsonNode.class), "checkpoints");
    }

    public Map<String, Object> provenewsGetCheckpoint(String type) {
        String enc = URLEncoder.encode(type, StandardCharsets.UTF_8);
        return client.get("/provenews/ledger/checkpoints/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsOrg() {
        return client.get("/provenews/ledger/org",
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Provenews composite tokens ────────────────────────────────────────────

    public Map<String, Object> provenewsAssembleCompositeToken(Map<String, Object> request) {
        return client.post("/provenews/tokens/composite", request,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsGetToken(String tokenId) {
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.get("/provenews/tokens/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsVerifyToken(String tokenId) {
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.get("/provenews/tokens/" + enc + "/verify",
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> provenewsTokensByOwner(String ownerId) {
        String enc = URLEncoder.encode(ownerId, StandardCharsets.UTF_8);
        return unwrap(client.get("/provenews/tokens/user/" + enc, JsonNode.class), "tokens");
    }

    // ── Provenews devices ─────────────────────────────────────────────────────

    public Map<String, Object> provenewsRegisterDevice(Map<String, Object> request) {
        return client.post("/provenews/devices/register", request,
                new TypeReference<Map<String, Object>>() {});
    }

    public List<Map<String, Object>> provenewsDevicesByUser(String userId) {
        String enc = URLEncoder.encode(userId, StandardCharsets.UTF_8);
        return unwrap(client.get("/provenews/devices/user/" + enc, JsonNode.class), "devices");
    }

    public Map<String, Object> provenewsGetDevice(String deviceId) {
        String enc = URLEncoder.encode(deviceId, StandardCharsets.UTF_8);
        return client.get("/provenews/devices/" + enc,
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Provenews tokenization ────────────────────────────────────────────────

    public List<Map<String, Object>> provenewsTokenizationNodes() {
        return unwrap(client.get("/provenews/tokenization/nodes", JsonNode.class), "nodes");
    }

    public Map<String, Object> provenewsAssignValidators(String assetId, Map<String, Object> request) {
        String enc = URLEncoder.encode(assetId, StandardCharsets.UTF_8);
        return client.post("/provenews/tokenization/assets/" + enc, request,
                new TypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> provenewsTokenizationStatus() {
        return client.get("/provenews/tokenization/status",
                new TypeReference<Map<String, Object>>() {});
    }

    // ── Use Cases ─────────────────────────────────────────────────────────────

    public List<UseCase> listUseCases() {
        JsonNode root = client.get("/use-cases", JsonNode.class);
        JsonNode list = root.isArray() ? root
                : (root.has("useCases") ? root.get("useCases")
                : (root.has("items") ? root.get("items") : root));
        if (list == null || !list.isArray()) return new ArrayList<>();
        try {
            return client.mapper().convertValue(list, new TypeReference<List<UseCase>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public UseCase getUseCase(String id) {
        String enc = URLEncoder.encode(id, StandardCharsets.UTF_8);
        return client.get("/use-cases/" + enc, UseCase.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private List<Map<String, Object>> unwrap(JsonNode root, String key) {
        if (root == null) return new ArrayList<>();
        JsonNode list;
        if (root.isArray()) {
            list = root;
        } else if (root.has(key)) {
            list = root.get(key);
        } else if (root.has("items")) {
            list = root.get("items");
        } else if (root.has("content")) {
            list = root.get("content");
        } else {
            return new ArrayList<>();
        }
        if (!list.isArray()) return new ArrayList<>();
        try {
            return client.mapper().convertValue(list, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
