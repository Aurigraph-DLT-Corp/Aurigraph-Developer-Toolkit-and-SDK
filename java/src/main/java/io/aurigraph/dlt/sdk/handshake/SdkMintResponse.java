package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response from {@code POST /api/v11/sdk/mint}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SdkMintResponse(
        String mintId,
        String typeCode,
        String tokenId,
        int amount,
        String status,
        int quotaRemaining
) {}
