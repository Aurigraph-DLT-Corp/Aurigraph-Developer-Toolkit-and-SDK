package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.Map;

public class TransactionServiceTestProfile implements QuarkusTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.of(
            // Disable AI optimization for deterministic test performance
            "ai.optimization.enabled", "false",
            // Keep xxHash optimization enabled for best performance
            "xxhash.optimization.enabled", "true"
        );
    }
}
