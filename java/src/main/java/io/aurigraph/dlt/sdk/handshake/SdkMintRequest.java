package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Request body for {@code POST /api/v11/sdk/mint} (tier-enforced minting).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SdkMintRequest(
        String typeCode,
        int amount,
        String useCaseId,
        String channelId,
        String toAddress,
        Map<String, Object> metadata
) {
    /** Convenience constructor with required fields only. */
    public SdkMintRequest(String typeCode, int amount) {
        this(typeCode, amount, null, null, null, null);
    }
}
