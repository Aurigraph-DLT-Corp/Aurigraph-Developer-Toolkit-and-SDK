package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class HealthResponse {
    public String status;
    public Long durationMs;
    public String version;
    public String timestamp;

    public HealthResponse() {}

    public boolean isHealthy() {
        return status != null && (status.equalsIgnoreCase("HEALTHY") || status.equalsIgnoreCase("UP"));
    }
}
