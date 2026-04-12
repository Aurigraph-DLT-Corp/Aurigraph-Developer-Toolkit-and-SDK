package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenTransfer {
    public String transactionHash;
    public String from;
    public String to;
    public long amount;
    public String timestamp;

    public TokenTransfer() {}
}
