package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Transaction {
    public String txHash;
    public String fromAddress;
    public String toAddress;
    public String amount;
    public String asset;
    public String status;
    public Long blockHeight;
    public String timestamp;
    public String memo;

    public Transaction() {}
}
