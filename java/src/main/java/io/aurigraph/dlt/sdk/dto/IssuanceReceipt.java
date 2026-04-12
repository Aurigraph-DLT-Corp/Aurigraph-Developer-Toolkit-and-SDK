package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IssuanceReceipt {
    public String derivedTokenId;
    public String contractId;
    public String compositeTokenId;
    public Double quantity;
    public String txHash;
    public String status;
    public String timestamp;

    public IssuanceReceipt() {}
}
