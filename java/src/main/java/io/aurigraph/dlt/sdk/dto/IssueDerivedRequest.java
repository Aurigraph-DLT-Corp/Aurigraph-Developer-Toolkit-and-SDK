package io.aurigraph.dlt.sdk.dto;

import java.util.Map;

public class IssueDerivedRequest {
    public String contractId;
    public String compositeTokenId;
    public Double quantity;
    public String derivedSymbol;
    public String recipient;
    public Map<String, Object> metadata;

    public IssueDerivedRequest() {}
}
