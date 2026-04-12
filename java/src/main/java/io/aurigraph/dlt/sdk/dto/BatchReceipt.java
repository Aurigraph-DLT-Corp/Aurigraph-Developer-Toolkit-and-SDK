package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BatchReceipt {
    public int accepted;
    public int rejected;
    public List<DmrvReceipt> receipts = new ArrayList<>();
    public List<BatchError> errors = new ArrayList<>();

    public BatchReceipt() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BatchError {
        public int index;
        public String message;
        public String errorCode;

        public BatchError() {}
    }
}
