package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CompositeBinding {
    public String bindingId;
    public String contractId;
    public String compositeTokenId;
    public String derivedTokenId;
    public String status;
    public String createdAt;

    public CompositeBinding() {}
}
