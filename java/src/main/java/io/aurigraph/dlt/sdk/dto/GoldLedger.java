package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * Gold RWAT public ledger summary.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoldLedger(
        int totalAssets,
        int activeOrders,
        GoldTradingStats stats,
        List<Map<String, Object>> assets
) {}
