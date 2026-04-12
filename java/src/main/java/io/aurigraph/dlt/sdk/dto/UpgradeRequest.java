package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * SDK tier upgrade request status.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UpgradeRequest(
        String requestId,
        String currentTier,
        String targetTier,
        String status
) {}
