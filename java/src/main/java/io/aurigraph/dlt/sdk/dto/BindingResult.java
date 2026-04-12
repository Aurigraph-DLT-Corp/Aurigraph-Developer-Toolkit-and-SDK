package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BindingResult {
    public String bindingId;
    public String contractId;
    public String compositeTokenId;
    public String status;
    public String timestamp;

    public BindingResult() {}
}
