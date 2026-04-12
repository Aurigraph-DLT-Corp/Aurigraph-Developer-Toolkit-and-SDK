package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * Bootstrap response from {@code GET /api/v11/sdk/handshake/hello}.
 *
 * <p>Returns full server metadata, app permissions, rate limits, feature flags,
 * and heartbeat scheduling info for the authenticated SDK application.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record HelloResponse(
        String appId,
        String appName,
        String did,
        String status,
        String serverVersion,
        String protocolVersion,
        List<String> approvedScopes,
        List<String> requestedScopes,
        List<String> pendingScopes,
        RateLimit rateLimit,
        long heartbeatIntervalMs,
        Map<String, Boolean> features,
        String nextHeartbeatAt
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RateLimit(int requestsPerMinute, int burstSize) {}
}
