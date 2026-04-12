package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NodeMetrics {
    public int totalNodes;
    public int activeNodes;
    public int validatorCount;
    public Integer businessCount;
    public Integer enterpriseCount;
    public String networkStatus;

    public NodeMetrics() {}
}
