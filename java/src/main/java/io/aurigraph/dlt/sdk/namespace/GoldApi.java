package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.GoldLedger;
import io.aurigraph.dlt.sdk.dto.GoldOrder;
import io.aurigraph.dlt.sdk.dto.GoldTradingStats;

import java.util.List;

/**
 * Namespace for /api/v11/rwa/gold endpoints — Gold RWAT tokenization.
 */
public class GoldApi {

    private final AurigraphClient client;

    public GoldApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * Get the gold RWAT public ledger summary.
     */
    public GoldLedger getPublicLedger() {
        return client.get("/rwa/gold/public/ledger", GoldLedger.class);
    }

    /**
     * List all gold trading orders.
     */
    public List<GoldOrder> getOrders() {
        return client.get("/rwa/gold/orders", new TypeReference<List<GoldOrder>>() {});
    }

    /**
     * Get aggregated gold trading statistics.
     */
    public GoldTradingStats getTradingStats() {
        return client.get("/rwa/gold/trading/stats", GoldTradingStats.class);
    }
}
