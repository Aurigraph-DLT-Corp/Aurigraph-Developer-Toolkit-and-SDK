package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.AssessmentRequest
import io.aurigraph.sdk.models.AssessmentResult
import io.aurigraph.sdk.models.ComplianceFramework

/**
 * Regulatory compliance assessment -- frameworks, assessments, and results.
 */
class ComplianceApi(private val client: AurigraphClient) {

    /** List all available compliance frameworks. */
    suspend fun listFrameworks(): List<ComplianceFramework> =
        client.get("/compliance/frameworks")

    /** Get a specific compliance framework by ID. */
    suspend fun getFramework(frameworkId: String): ComplianceFramework =
        client.get("/compliance/frameworks/$frameworkId")

    /** Run a compliance assessment for an asset against a specific framework. */
    suspend fun assess(assetId: String, framework: String): AssessmentResult =
        client.post("/compliance/assess", AssessmentRequest(assetId, framework))

    /** Get all assessment results for an asset. */
    suspend fun getAssessments(assetId: String): List<AssessmentResult> =
        client.get("/compliance/assessments/$assetId")
}
