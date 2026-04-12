package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.CreateTokenRequest;
import io.aurigraph.dlt.sdk.dto.TokenDetail;
import io.aurigraph.dlt.sdk.dto.TokenHolder;
import io.aurigraph.dlt.sdk.dto.TokenListResponse;
import io.aurigraph.dlt.sdk.dto.TokenMintReceipt;
import io.aurigraph.dlt.sdk.dto.TokenMintRequest;
import io.aurigraph.dlt.sdk.dto.TokenRegistryStats;
import io.aurigraph.dlt.sdk.dto.TokenTransfer;

import java.math.BigInteger;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Namespace for the generic Token Registry endpoints
 * ({@code /api/v11/registries/tokens}).
 *
 * <p>Lets 3rd-party apps list, create and mint tokens on their own
 * registry entries via a typed Java API.
 *
 * <p>Note: the V12 resource does not expose a {@code /stats} endpoint.
 * {@link #stats()} is a convenience that calls {@link #list} with
 * {@code size=100} and aggregates counts client-side. All list-style
 * methods fall back to empty collections on transport failure to
 * match the Session #117 resilience pattern.
 */
public class TokenRegistryApi {

    private final AurigraphClient client;

    public TokenRegistryApi(AurigraphClient client) {
        this.client = client;
    }

    /** Filter for {@link #list(ListFilter)}. */
    public static class ListFilter {
        public String standard;      // PRIMARY | SECONDARY | COMPOSITE | UTILITY | ...
        public Boolean active;
        public Integer page;
        public Integer size;

        public ListFilter() {}

        public ListFilter standard(String s) { this.standard = s; return this; }
        public ListFilter active(Boolean a)  { this.active = a; return this; }
        public ListFilter page(int p)        { this.page = p; return this; }
        public ListFilter size(int s)        { this.size = s; return this; }
    }

    /** Filter for {@link #getTransfers(String, TransferFilter)}. */
    public static class TransferFilter {
        public String from;
        public String to;
        public Integer page;
        public Integer size;

        public TransferFilter() {}
    }

    // ── List + get ────────────────────────────────────────────────────────────

    /** List tokens with optional filtering. Returns an empty page on error. */
    public TokenListResponse list(ListFilter filter) {
        StringBuilder sb = new StringBuilder("/registries/tokens");
        if (filter != null) {
            List<String> parts = new ArrayList<>();
            if (filter.standard != null) {
                parts.add("standard=" + URLEncoder.encode(filter.standard, StandardCharsets.UTF_8));
            }
            if (filter.active != null) {
                parts.add("active=" + filter.active);
            }
            if (filter.page != null) {
                parts.add("page=" + filter.page);
            }
            if (filter.size != null) {
                parts.add("size=" + filter.size);
            }
            if (!parts.isEmpty()) {
                sb.append("?").append(String.join("&", parts));
            }
        }
        try {
            return client.get(sb.toString(), TokenListResponse.class);
        } catch (Exception e) {
            TokenListResponse empty = new TokenListResponse();
            empty.content = new ArrayList<>();
            return empty;
        }
    }

    public TokenListResponse list() {
        return list(null);
    }

    /** Get token detail by id. Propagates client/server errors. */
    public TokenDetail get(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) {
            throw new IllegalArgumentException("TokenRegistryApi.get: tokenId must be non-blank");
        }
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.get("/registries/tokens/" + enc, TokenDetail.class);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Create a new token registry entry. The V12 resource wraps the response
     * in {@code { token, merkleRootHash, leafIndex }} — this helper unwraps
     * the {@code token} field so callers get a consistent {@link TokenDetail}.
     */
    public TokenDetail create(CreateTokenRequest req) {
        if (req == null || req.symbol == null || req.tokenType == null) {
            throw new IllegalArgumentException(
                    "TokenRegistryApi.create: symbol and tokenType are required");
        }
        JsonNode envelope = client.post("/registries/tokens", req, JsonNode.class);
        if (envelope == null) return null;
        JsonNode inner = envelope.has("token") ? envelope.get("token") : envelope;
        try {
            return client.mapper().treeToValue(inner, TokenDetail.class);
        } catch (Exception e) {
            return null;
        }
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    /**
     * Mint additional supply on an existing token. Requires {@code mint:token}
     * scope on the API key. The Idempotency-Key header is auto-attached by
     * {@link AurigraphClient} on all POST requests when
     * {@code autoIdempotency=true}.
     */
    public TokenMintReceipt mint(String tokenId, TokenMintRequest req) {
        if (tokenId == null || tokenId.isBlank()) {
            throw new IllegalArgumentException("TokenRegistryApi.mint: tokenId must be non-blank");
        }
        if (req == null || req.amount == null) {
            throw new IllegalArgumentException("TokenRegistryApi.mint: amount is required");
        }
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        return client.post("/registries/tokens/" + enc + "/mint", req, TokenMintReceipt.class);
    }

    // ── Holders + transfers ───────────────────────────────────────────────────

    /** List holders for a token. Returns an empty list on transport error. */
    public List<TokenHolder> getHolders(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return new ArrayList<>();
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        try {
            JsonNode root = client.get("/registries/tokens/" + enc + "/holders", JsonNode.class);
            return unwrapArray(root, "content", new TypeReference<List<TokenHolder>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /** List transfers for a token. Returns an empty list on transport error. */
    public List<TokenTransfer> getTransfers(String tokenId, TransferFilter filter) {
        if (tokenId == null || tokenId.isBlank()) return new ArrayList<>();
        String enc = URLEncoder.encode(tokenId, StandardCharsets.UTF_8);
        StringBuilder sb = new StringBuilder("/registries/tokens/").append(enc).append("/transfers");
        if (filter != null) {
            List<String> parts = new ArrayList<>();
            if (filter.from != null) parts.add("from=" + URLEncoder.encode(filter.from, StandardCharsets.UTF_8));
            if (filter.to != null) parts.add("to=" + URLEncoder.encode(filter.to, StandardCharsets.UTF_8));
            if (filter.page != null) parts.add("page=" + filter.page);
            if (filter.size != null) parts.add("size=" + filter.size);
            if (!parts.isEmpty()) sb.append("?").append(String.join("&", parts));
        }
        try {
            JsonNode root = client.get(sb.toString(), JsonNode.class);
            return unwrapArray(root, "content", new TypeReference<List<TokenTransfer>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<TokenTransfer> getTransfers(String tokenId) {
        return getTransfers(tokenId, null);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    /**
     * Aggregate stats computed client-side by listing up to 100 tokens.
     * Falls back to an empty aggregate on transport error.
     */
    public TokenRegistryStats stats() {
        TokenRegistryStats out = new TokenRegistryStats();
        try {
            ListFilter f = new ListFilter();
            f.page = 0;
            f.size = 100;
            TokenListResponse page = list(f);
            if (page == null || page.content == null) return out;

            Map<String, Long> byType = new HashMap<>();
            BigInteger totalSupply = BigInteger.ZERO;
            long activeTokens = 0;

            for (TokenDetail t : page.content) {
                String typ = t.tokenType != null ? t.tokenType : "UNKNOWN";
                byType.merge(typ, 1L, Long::sum);
                if (t.status != null && "ACTIVE".equalsIgnoreCase(t.status)) {
                    activeTokens++;
                }
                if (t.totalSupply != null) {
                    totalSupply = totalSupply.add(BigInteger.valueOf(t.totalSupply));
                }
            }
            out.totalTokens = page.totalElements > 0 ? page.totalElements : page.content.size();
            out.activeTokens = activeTokens;
            out.totalSupply = totalSupply.toString();
            out.byType = byType;
            return out;
        } catch (Exception e) {
            return out;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private <T> List<T> unwrapArray(JsonNode root, String key, TypeReference<List<T>> ref) {
        if (root == null) return new ArrayList<>();
        JsonNode list;
        if (root.isArray()) {
            list = root;
        } else if (root.has(key)) {
            list = root.get(key);
        } else if (root.has("items")) {
            list = root.get("items");
        } else if (root.has("data")) {
            list = root.get("data");
        } else {
            return new ArrayList<>();
        }
        if (list == null || !list.isArray()) return new ArrayList<>();
        try {
            return client.mapper().convertValue(list, ref);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
