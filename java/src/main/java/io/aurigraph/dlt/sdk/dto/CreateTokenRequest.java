package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Request body for POST /api/v11/registries/tokens.
 * Mirrors V12 {@code TokenRegistryResource.CreateTokenRequest}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreateTokenRequest {
    public String tokenType;
    public String name;
    public String symbol;
    public String ownerId;
    public String assetEntryId;
    public String secondaryDataEntryId;
    public Long totalSupply;
    public Integer decimals;
    public Map<String, String> metadata;

    public CreateTokenRequest() {}

    public CreateTokenRequest(String tokenType, String name, String symbol) {
        this.tokenType = tokenType;
        this.name = name;
        this.symbol = symbol;
    }
}
