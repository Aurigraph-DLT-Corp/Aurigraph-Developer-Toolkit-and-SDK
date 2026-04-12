package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Wallet balance for a given address.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WalletBalance(
        String address,
        BigDecimal available,
        BigDecimal staked,
        String currency
) {}
