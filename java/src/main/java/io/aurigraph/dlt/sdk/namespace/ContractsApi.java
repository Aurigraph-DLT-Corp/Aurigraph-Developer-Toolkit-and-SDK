package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.BindingResult;
import io.aurigraph.dlt.sdk.dto.CompositeBindRequest;
import io.aurigraph.dlt.sdk.dto.CompositeBinding;
import io.aurigraph.dlt.sdk.dto.IssuanceReceipt;
import io.aurigraph.dlt.sdk.dto.IssueDerivedRequest;
import io.aurigraph.dlt.sdk.dto.TokenBinding;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Namespace for /api/v11/active-contracts/{id}/tokens and /api/v11/contract-bindings/*.
 */
public class ContractsApi {

    private final AurigraphClient client;

    public ContractsApi(AurigraphClient client) {
        this.client = client;
    }

    public List<TokenBinding> getTokens(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return unwrapList("/active-contracts/" + enc + "/tokens", "tokens",
                new TypeReference<List<TokenBinding>>() {});
    }

    public BindingResult bindComposite(CompositeBindRequest req) {
        return client.post("/contract-bindings/composite", req, BindingResult.class);
    }

    public IssuanceReceipt issueDerivedFromComposite(IssueDerivedRequest req) {
        return client.post("/contract-bindings/issue-derived", req, IssuanceReceipt.class);
    }

    public List<CompositeBinding> getBindingsForContract(String contractId) {
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        return unwrapList("/contract-bindings/contract/" + enc, "bindings",
                new TypeReference<List<CompositeBinding>>() {});
    }

    public List<CompositeBinding> getBindingsForToken(String tokenId) {
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return unwrapList("/contract-bindings/token/" + enc, "bindings",
                new TypeReference<List<CompositeBinding>>() {});
    }

    private <T> List<T> unwrapList(String path, String key, TypeReference<List<T>> ref) {
        Map<String, Object> wrapper = client.get(path,
                new TypeReference<Map<String, Object>>() {});
        if (wrapper == null) return new ArrayList<>();
        Object data = wrapper.get(key);
        if (data == null) data = wrapper.get("items");
        if (data == null) data = wrapper.get("data");
        if (data instanceof List) {
            return client.mapper().convertValue(data, ref);
        }
        return new ArrayList<>();
    }
}
