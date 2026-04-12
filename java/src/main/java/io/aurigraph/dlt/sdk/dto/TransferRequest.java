package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Request to transfer tokens between wallets.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TransferRequest(
        String from,
        String to,
        BigDecimal amount,
        String currency
) {}
