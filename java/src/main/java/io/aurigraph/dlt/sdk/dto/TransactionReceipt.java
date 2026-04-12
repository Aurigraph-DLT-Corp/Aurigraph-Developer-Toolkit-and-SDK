package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionReceipt {
    public String txHash;
    public String status;
    public Long blockHeight;
    public String timestamp;

    public TransactionReceipt() {}
}
