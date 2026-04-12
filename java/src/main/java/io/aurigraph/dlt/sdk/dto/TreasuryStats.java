package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Governance treasury statistics.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TreasuryStats(
        BigDecimal balance,
        int proposalCount
) {}
