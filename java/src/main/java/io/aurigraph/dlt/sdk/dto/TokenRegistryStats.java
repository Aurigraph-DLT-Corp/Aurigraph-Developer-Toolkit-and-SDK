package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * Client-side aggregate stats for the generic token registry.
 * The V12 resource does not expose a dedicated stats endpoint — these
 * values are computed by the SDK from a single {@code list()} call.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenRegistryStats {
    public long totalTokens;
    public long activeTokens;
    public String totalSupply = "0";
    public Map<String, Long> byType = new HashMap<>();

    public TokenRegistryStats() {}
}
