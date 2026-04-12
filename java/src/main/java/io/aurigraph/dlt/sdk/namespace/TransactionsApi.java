package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.Transaction;
import io.aurigraph.dlt.sdk.dto.TransactionReceipt;
import io.aurigraph.dlt.sdk.dto.TransactionSubmitRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Namespace for /api/v11/transactions endpoints.
 */
public class TransactionsApi {

    private final AurigraphClient client;

    public TransactionsApi(AurigraphClient client) {
        this.client = client;
    }

    public List<Transaction> recent(int limit) {
        JsonNode root = client.get("/transactions/recent?limit=" + limit, JsonNode.class);
        JsonNode list = root.isArray() ? root
                : (root.has("transactions") ? root.get("transactions")
                : (root.has("items") ? root.get("items") : null));
        if (list == null || !list.isArray()) return new ArrayList<>();
        try {
            return client.mapper().convertValue(list, new TypeReference<List<Transaction>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public TransactionReceipt submit(TransactionSubmitRequest tx) {
        return client.post("/transactions", tx, TransactionReceipt.class);
    }

    public Transaction get(String txHash) {
        String enc = URLEncoder.encode(txHash, StandardCharsets.UTF_8);
        return client.get("/transactions/" + enc, Transaction.class);
    }
}
