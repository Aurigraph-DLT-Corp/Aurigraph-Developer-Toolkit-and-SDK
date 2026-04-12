package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Tier configuration returned by {@code GET /api/v11/sdk/partner/tier}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TierConfig(
        int tierLevel,
        String tierName,
        Limits limits,
        List<String> allowedTokenTypes,
        boolean grpcAccess,
        int kycLevelRequired
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Limits(
            int mintMonthly,
            int dmrvDaily,
            int compositeMonthly,
            int rateRpm,
            int burst,
            int webhooksMax
    ) {}
}
