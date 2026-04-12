package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Partner profile returned by {@code GET /api/v11/sdk/partner/profile}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PartnerProfile(
        String profileId,
        String appId,
        String appName,
        int tierLevel,
        String tierName,
        String kycStatus,
        String billingPlan,
        String onboardedAt
) {}
