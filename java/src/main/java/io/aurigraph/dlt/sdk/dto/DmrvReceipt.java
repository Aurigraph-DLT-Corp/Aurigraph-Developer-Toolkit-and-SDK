package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DmrvReceipt {
    public String eventId;
    public String status;
    public String contractId;
    public String txHash;
    public String timestamp;

    public DmrvReceipt() {}
}
