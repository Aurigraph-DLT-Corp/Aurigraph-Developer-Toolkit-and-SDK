package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Receipt returned by POST /api/v11/registries/tokens/{id}/mint.
 * Matches V12 {@code TokenRegistryResource.MintResult}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenMintReceipt {
    public String tokenId;
    public long amount;
    public String recipient;
    public long newTotalSupply;
    public String merkleRootHash;
    public String timestamp;

    public TokenMintReceipt() {}
}
