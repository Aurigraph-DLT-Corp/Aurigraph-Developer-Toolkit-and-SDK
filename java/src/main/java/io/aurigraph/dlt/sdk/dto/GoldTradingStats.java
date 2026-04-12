package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Aggregated gold RWAT trading statistics.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoldTradingStats(
        BigDecimal totalVolume,
        int activeOrders,
        BigDecimal avgPrice
) {}
