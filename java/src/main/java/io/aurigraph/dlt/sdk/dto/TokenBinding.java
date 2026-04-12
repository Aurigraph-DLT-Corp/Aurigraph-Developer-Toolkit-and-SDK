package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenBinding {
    public String tokenId;
    public String contractId;
    public String tokenType;
    public String symbol;
    public String balance;
    public String mintedAt;

    public TokenBinding() {}
}
