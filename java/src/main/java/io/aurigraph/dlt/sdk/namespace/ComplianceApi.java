package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.AssessmentResult;
import io.aurigraph.dlt.sdk.dto.ComplianceFramework;

import java.util.List;
import java.util.Map;

/**
 * Namespace for /api/v11/compliance endpoints — regulatory compliance assessment.
 */
public class ComplianceApi {

    private final AurigraphClient client;

    public ComplianceApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * List all available compliance frameworks.
     */
    public List<ComplianceFramework> listFrameworks() {
        return client.get("/compliance/frameworks", new TypeReference<List<ComplianceFramework>>() {});
    }

    /**
     * Run a compliance assessment for an asset against a specific framework.
     */
    public AssessmentResult assess(String assetId, String framework) {
        return client.post("/compliance/assess",
                Map.of("assetId", assetId, "framework", framework), AssessmentResult.class);
    }
}
