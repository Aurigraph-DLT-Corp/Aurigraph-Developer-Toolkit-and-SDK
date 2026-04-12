package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Usage stats returned by {@code GET /api/v11/sdk/partner/usage}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UsageStats(
        TodayUsage today,
        MonthlyUsage monthly,
        QuotaPercent quotaPercent
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TodayUsage(int mintCount, int dmrvCount, int compositeCount, int apiCallCount) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MonthlyUsage(int mintCount, int remaining) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuotaPercent(double mint, double dmrv, double composite) {}
}
