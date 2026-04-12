package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Response from {@code GET /api/v11/sdk/handshake/config}.
 *
 * <p>Lightweight refresh — detects scope/status changes since last hello.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ConfigResponse(
        String appId,
        String status,
        List<String> approvedScopes,
        List<String> pendingScopes,
        HelloResponse.RateLimit rateLimit,
        String lastUpdatedAt
) {}
