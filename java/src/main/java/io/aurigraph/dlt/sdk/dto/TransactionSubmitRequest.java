package io.aurigraph.dlt.sdk.dto;

public class TransactionSubmitRequest {
    public String fromAddress;
    public String toAddress;
    public String amount;
    public String asset;
    public String memo;
    public String signature;
    public String publicKey;

    public TransactionSubmitRequest() {}

    public TransactionSubmitRequest(String fromAddress, String toAddress, String amount, String asset) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.asset = asset;
    }
}
