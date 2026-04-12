package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Response from {@code GET /api/v11/sdk/handshake/capabilities}.
 *
 * <p>Returns the endpoint list filtered by this app's approved scopes.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CapabilitiesResponse(
        String appId,
        List<String> approvedScopes,
        List<CapabilityEndpoint> endpoints,
        int totalEndpoints
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CapabilityEndpoint(
            String method,
            String path,
            String requiredScope,
            String description
    ) {}
}
