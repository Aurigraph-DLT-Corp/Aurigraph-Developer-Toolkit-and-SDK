package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenHolder {
    public String address;
    public long balance;
    public String lastUpdated;

    public TokenHolder() {}
}
