package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Basic token metadata returned by the generic token registry
 * (/api/v11/registries/tokens).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Token {
    public String id;
    public String channelId;
    public String tokenType;
    public String status;
    public String name;
    public String symbol;
    public String ownerId;
    public Long totalSupply;
    public Integer decimals;
    public String createdAt;

    public Token() {}
}
