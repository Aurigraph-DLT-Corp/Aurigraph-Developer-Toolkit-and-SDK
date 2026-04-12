package io.aurigraph.dlt.sdk.dto;

import java.util.Map;

public class CompositeBindRequest {
    public String contractId;
    public String compositeTokenId;
    public Map<String, Object> metadata;

    public CompositeBindRequest() {}

    public CompositeBindRequest(String contractId, String compositeTokenId) {
        this.contractId = contractId;
        this.compositeTokenId = compositeTokenId;
    }
}
