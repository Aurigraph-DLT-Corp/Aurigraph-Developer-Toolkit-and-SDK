package io.aurigraph.v11.portal;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Test profile for Portal Integration Tests
 * Disables old API resources to prevent endpoint conflicts with PortalAPIGateway
 */
public class PortalIntegrationTestProfile implements QuarkusTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.ofEntries(
            // Disable old API resources during testing
            Map.entry("quarkus.arc.excluded-types",
                "io.aurigraph.v11.AurigraphResource," +
                "io.aurigraph.v11.api.BlockchainApiResource," +
                "io.aurigraph.v11.api.NetworkResource," +
                "io.aurigraph.v11.api.PerformanceResource," +
                "io.aurigraph.v11.websocket.BlockchainWebSocket"),
            // Use Portal API Gateway as single entry point
            Map.entry("quarkus.http.port", "9003"),
            // Test-specific logging
            Map.entry("quarkus.log.level", "INFO")
        );
    }

    @Override
    public String getConfigProfile() {
        return "test";
    }
}
