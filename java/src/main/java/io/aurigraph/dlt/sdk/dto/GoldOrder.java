package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * A single gold trading order.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoldOrder(
        String orderId,
        String type,
        String status,
        BigDecimal amount
) {}
