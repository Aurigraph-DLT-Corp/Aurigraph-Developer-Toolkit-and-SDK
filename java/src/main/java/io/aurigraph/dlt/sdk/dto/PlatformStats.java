package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PlatformStats {
    public long tps;
    public int activeNodes;
    public long blockHeight;
    public Long totalTransactions;
    public Long uptime;

    public PlatformStats() {}
}
