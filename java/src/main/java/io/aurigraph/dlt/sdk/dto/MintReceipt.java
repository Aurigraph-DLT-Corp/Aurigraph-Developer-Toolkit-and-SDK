package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MintReceipt {
    public String contractId;
    public String eventType;
    public Double quantity;
    public String tokenId;
    public String txHash;
    public String status;
    public String timestamp;

    public MintReceipt() {}
}
