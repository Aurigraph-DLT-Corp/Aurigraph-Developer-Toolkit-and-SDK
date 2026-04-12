package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Mint quota returned by {@code GET /api/v11/sdk/mint/quota}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MintQuota(
        int mintMonthlyLimit,
        int mintMonthlyUsed,
        int mintMonthlyRemaining,
        int dmrvDailyLimit,
        int dmrvDailyUsed,
        int dmrvDailyRemaining
) {}
