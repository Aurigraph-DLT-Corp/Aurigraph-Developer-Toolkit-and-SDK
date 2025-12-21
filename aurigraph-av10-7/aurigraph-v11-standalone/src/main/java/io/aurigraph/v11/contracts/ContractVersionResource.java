package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractVersion;
import io.aurigraph.v11.contracts.models.ContractVersion.ChangeType;
import io.aurigraph.v11.contracts.models.ContractVersion.VersionDiff;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * ContractVersionResource - REST API for Contract Version Control
 *
 * Provides endpoints for:
 * - Listing contract versions
 * - Getting specific versions
 * - Creating new versions with SemVer
 * - Comparing versions (diff)
 * - Creating amendments
 * - Rolling back to previous versions
 *
 * @version 12.0.0
 * @author J4C Development Agent - Sprint 3
 */
@Path("/api/v12/contracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ContractVersionResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(ContractVersionResource.class);

    @Inject
    ContractVersionService versionService;

    // ==================== Version Listing ====================

    /**
     * List all versions for a contract
     *
     * GET /api/v12/contracts/{id}/versions
     *
     * @param contractId Contract ID
     * @return List of versions sorted by version number (newest first)
     */
    @GET
    @Path("/{contractId}/versions")
    public Uni<Response> listVersions(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: List versions for contract: {}", contractId);

        return versionService.getVersions(contractId)
            .map(versions -> Response.ok(Map.of(
                "contractId", contractId,
                "versions", versions,
                "count", versions.size()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to list versions: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get a specific version of a contract
     *
     * GET /api/v12/contracts/{id}/versions/{version}
     *
     * @param contractId Contract ID
     * @param version Version string (e.g., "1.2.3")
     * @return Specific version details
     */
    @GET
    @Path("/{contractId}/versions/{version}")
    public Uni<Response> getVersion(
            @PathParam("contractId") String contractId,
            @PathParam("version") String version
    ) {
        LOGGER.info("REST: Get version {} for contract: {}", version, contractId);

        return versionService.getVersion(contractId, version)
            .map(v -> Response.ok(v).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get version: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Version Creation ====================

    /**
     * Create a new version for a contract
     *
     * POST /api/v12/contracts/{id}/versions
     *
     * Request body:
     * {
     *   "description": "Added new payment terms",
     *   "changeType": "MINOR"  // MAJOR, MINOR, PATCH, AMENDMENT, CORRECTION, INITIAL
     * }
     *
     * @param contractId Contract ID
     * @param request Version creation request
     * @return Created version
     */
    @POST
    @Path("/{contractId}/versions")
    public Uni<Response> createVersion(
            @PathParam("contractId") String contractId,
            VersionCreationRequest request
    ) {
        LOGGER.info("REST: Create version for contract: {} with changeType: {}",
            contractId, request.getChangeType());

        ChangeType changeType = parseChangeType(request.getChangeType());

        return versionService.createVersion(contractId, request.getDescription(), changeType)
            .map(version -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Version created successfully",
                    "version", version
                )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to create version: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Version Comparison ====================

    /**
     * Compare two versions of a contract
     *
     * GET /api/v12/contracts/{id}/versions/compare?from=X&to=Y
     *
     * @param contractId Contract ID
     * @param from From version string
     * @param to To version string
     * @return Version diff with detailed changes
     */
    @GET
    @Path("/{contractId}/versions/compare")
    public Uni<Response> compareVersions(
            @PathParam("contractId") String contractId,
            @QueryParam("from") String from,
            @QueryParam("to") String to
    ) {
        LOGGER.info("REST: Compare versions {} -> {} for contract: {}", from, to, contractId);

        if (from == null || to == null) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Both 'from' and 'to' query parameters are required"))
                    .build()
            );
        }

        return versionService.compareVersions(contractId, from, to)
            .map(diff -> Response.ok(Map.of(
                "contractId", contractId,
                "comparison", diff
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to compare versions: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Amendment Creation ====================

    /**
     * Create an amendment for a contract
     *
     * POST /api/v12/contracts/{id}/amend
     *
     * Request body:
     * {
     *   "description": "Amendment to payment schedule"
     * }
     *
     * @param contractId Contract ID
     * @param request Amendment request
     * @return Created amendment version
     */
    @POST
    @Path("/{contractId}/amend")
    public Uni<Response> createAmendment(
            @PathParam("contractId") String contractId,
            AmendmentRequest request
    ) {
        LOGGER.info("REST: Create amendment for contract: {}", contractId);

        return versionService.createAmendment(contractId, request.getDescription())
            .map(version -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Amendment created successfully",
                    "amendment", version,
                    "amendmentNumber", version.getAmendmentNumber()
                )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to create amendment: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get all amendments for a contract
     *
     * GET /api/v12/contracts/{id}/amendments
     *
     * @param contractId Contract ID
     * @return List of amendment versions
     */
    @GET
    @Path("/{contractId}/amendments")
    public Uni<Response> getAmendments(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get amendments for contract: {}", contractId);

        return versionService.getAmendments(contractId)
            .map(amendments -> Response.ok(Map.of(
                "contractId", contractId,
                "amendments", amendments,
                "count", amendments.size()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get amendments: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Version Rollback ====================

    /**
     * Rollback a contract to a previous version
     *
     * POST /api/v12/contracts/{id}/versions/{version}/rollback
     *
     * @param contractId Contract ID
     * @param version Target version to rollback to
     * @return New version created from rollback
     */
    @POST
    @Path("/{contractId}/versions/{version}/rollback")
    public Uni<Response> rollback(
            @PathParam("contractId") String contractId,
            @PathParam("version") String version
    ) {
        LOGGER.info("REST: Rollback contract {} to version {}", contractId, version);

        return versionService.rollback(contractId, version)
            .map(newVersion -> Response.ok(Map.of(
                "message", String.format("Successfully rolled back to version %s", version),
                "newVersion", newVersion,
                "rolledBackTo", version
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to rollback: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Version Lifecycle ====================

    /**
     * Publish a version (make it effective)
     *
     * POST /api/v12/contracts/{id}/versions/{version}/publish
     *
     * @param contractId Contract ID
     * @param version Version to publish
     * @return Published version
     */
    @POST
    @Path("/{contractId}/versions/{version}/publish")
    public Uni<Response> publishVersion(
            @PathParam("contractId") String contractId,
            @PathParam("version") String version
    ) {
        LOGGER.info("REST: Publish version {} for contract: {}", version, contractId);

        return versionService.publishVersion(contractId, version)
            .map(v -> Response.ok(Map.of(
                "message", "Version published successfully",
                "version", v
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to publish version: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Approve a version
     *
     * POST /api/v12/contracts/{id}/versions/{version}/approve
     *
     * Request body:
     * {
     *   "approver": "user-123"
     * }
     *
     * @param contractId Contract ID
     * @param version Version to approve
     * @param request Approval request
     * @return Updated version
     */
    @POST
    @Path("/{contractId}/versions/{version}/approve")
    public Uni<Response> approveVersion(
            @PathParam("contractId") String contractId,
            @PathParam("version") String version,
            ApprovalRequest request
    ) {
        LOGGER.info("REST: Approve version {} by {} for contract: {}",
            version, request.getApprover(), contractId);

        return versionService.approveVersion(contractId, version, request.getApprover())
            .map(v -> Response.ok(Map.of(
                "message", "Version approved successfully",
                "version", v,
                "approvedBy", request.getApprover()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to approve version: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Version Info ====================

    /**
     * Get version by ID
     *
     * GET /api/v12/contracts/versions/{versionId}
     *
     * @param versionId Version ID
     * @return Version details
     */
    @GET
    @Path("/versions/{versionId}")
    public Uni<Response> getVersionById(@PathParam("versionId") String versionId) {
        LOGGER.info("REST: Get version by ID: {}", versionId);

        return versionService.getVersionById(versionId)
            .map(v -> Response.ok(v).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get version: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get version control API info
     *
     * GET /api/v12/contracts/versions/info
     *
     * @return API information
     */
    @GET
    @Path("/versions/info")
    public Response getVersionApiInfo() {
        LOGGER.info("REST: Get version API info");

        return Response.ok(Map.of(
            "name", "Contract Version Control API",
            "version", "12.0.0",
            "description", "Version control system for ActiveContracts with SemVer, diff, rollback, and amendments",
            "features", List.of(
                "Semantic Versioning (Major.Minor.Patch)",
                "Version comparison and diff generation",
                "Rollback to any previous version",
                "Amendment workflow support",
                "Snapshot storage of contract state",
                "Approval workflow for version publishing"
            ),
            "changeTypes", List.of(
                "MAJOR - Breaking changes",
                "MINOR - Backward-compatible additions",
                "PATCH - Bug fixes and clarifications",
                "AMENDMENT - Formal contract amendment",
                "CORRECTION - Error correction",
                "INITIAL - Initial version"
            ),
            "endpoints", List.of(
                "GET /api/v12/contracts/{id}/versions - List versions",
                "GET /api/v12/contracts/{id}/versions/{version} - Get specific version",
                "POST /api/v12/contracts/{id}/versions - Create new version",
                "GET /api/v12/contracts/{id}/versions/compare?from=X&to=Y - Compare versions",
                "POST /api/v12/contracts/{id}/amend - Create amendment",
                "GET /api/v12/contracts/{id}/amendments - List amendments",
                "POST /api/v12/contracts/{id}/versions/{version}/rollback - Rollback to version",
                "POST /api/v12/contracts/{id}/versions/{version}/publish - Publish version",
                "POST /api/v12/contracts/{id}/versions/{version}/approve - Approve version"
            )
        )).build();
    }

    // ==================== Helper Methods ====================

    private ChangeType parseChangeType(String changeType) {
        if (changeType == null || changeType.isEmpty()) {
            return ChangeType.MINOR; // Default to minor
        }
        try {
            return ChangeType.valueOf(changeType.toUpperCase());
        } catch (IllegalArgumentException e) {
            LOGGER.warn("Invalid change type: {}, defaulting to MINOR", changeType);
            return ChangeType.MINOR;
        }
    }

    // ==================== Request DTOs ====================

    /**
     * Version creation request
     */
    public static class VersionCreationRequest {
        private String description;
        private String changeType;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getChangeType() { return changeType; }
        public void setChangeType(String changeType) { this.changeType = changeType; }
    }

    /**
     * Amendment request
     */
    public static class AmendmentRequest {
        private String description;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    /**
     * Approval request
     */
    public static class ApprovalRequest {
        private String approver;

        public String getApprover() { return approver; }
        public void setApprover(String approver) { this.approver = approver; }
    }
}
