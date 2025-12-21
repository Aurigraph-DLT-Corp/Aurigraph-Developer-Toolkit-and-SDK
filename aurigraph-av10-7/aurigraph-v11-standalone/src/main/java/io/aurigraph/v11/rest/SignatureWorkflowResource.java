package io.aurigraph.v11.rest;

import io.aurigraph.v11.contracts.SignatureWorkflowService;
import io.aurigraph.v11.contracts.SignatureWorkflowService.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * Signature Workflow REST API Resource
 *
 * Provides REST endpoints for managing multi-party signature workflows
 * with RBAC support and quantum-safe cryptography (CRYSTALS-Dilithium).
 *
 * Features:
 * - Multi-party signature collection (sequential/parallel modes)
 * - RBAC roles: OWNER, PARTY, WITNESS, VVB, REGULATOR
 * - Quantum-safe signature verification
 * - Workflow state management
 *
 * @version 12.0.0 - Sprint 4 RBAC Implementation
 * @since 2025-12-21
 */
@Path("/api/v12/signatures")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Signature Workflow API", description = "Multi-party signature workflow management with RBAC and quantum-safe cryptography")
public class SignatureWorkflowResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(SignatureWorkflowResource.class);

    @Inject
    SignatureWorkflowService signatureWorkflowService;

    // ==================== Status Endpoint ====================

    /**
     * Get workflow status for a contract
     * GET /api/v12/signatures/contract/{contractId}/status
     */
    @GET
    @Path("/contract/{contractId}/status")
    @Operation(
        summary = "Get signature workflow status",
        description = "Retrieve the current status of the signature workflow for a contract, including signed/pending counts and workflow state"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Workflow status retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = SignatureWorkflowStatus.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> getWorkflowStatus(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId) {

        LOGGER.info("GET /api/v12/signatures/contract/{}/status - Fetching workflow status", contractId);

        return signatureWorkflowService.getSignatureStatus(contractId)
            .onItem().transform(status -> {
                LOGGER.info("Workflow status retrieved for contract {}: state={}, signed={}/{}",
                    contractId, status.getState(), status.getSignedCount(), status.getRequiredSignatures());
                return Response.ok(status).build();
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error fetching workflow status for contract {}: {}", contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to retrieve workflow status", throwable.getMessage());
            });
    }

    // ==================== Request Signature Endpoint ====================

    /**
     * Request signature from a party
     * POST /api/v12/signatures/contract/{contractId}/request/{partyId}
     */
    @POST
    @Path("/contract/{contractId}/request/{partyId}")
    @Operation(
        summary = "Request signature from a party",
        description = "Create a signature request for a specific party on a contract. Validates sequential order if in SEQUENTIAL mode."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Signature request created successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = SignatureRequest.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request - party not found, already signed, or sequential order violation",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract or party not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> requestSignature(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @Parameter(description = "Party ID to request signature from", required = true)
            @PathParam("partyId") String partyId) {

        LOGGER.info("POST /api/v12/signatures/contract/{}/request/{} - Requesting signature", contractId, partyId);

        return signatureWorkflowService.requestSignature(contractId, partyId)
            .onItem().transform(request -> {
                LOGGER.info("Signature request created: {} for party {} on contract {}",
                    request.getRequestId(), partyId, contractId);
                return Response.ok(request).build();
            })
            .onFailure(SignatureWorkflowException.class).recoverWithItem(ex -> {
                LOGGER.warn("Signature request failed for party {} on contract {}: {}",
                    partyId, contractId, ex.getMessage());
                return buildErrorResponse(Response.Status.BAD_REQUEST,
                    "Signature request failed", ex.getMessage());
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error requesting signature for party {} on contract {}: {}",
                    partyId, contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to request signature", throwable.getMessage());
            });
    }

    // ==================== Submit Signature Endpoint ====================

    /**
     * Submit a signature for a contract
     * POST /api/v12/signatures/contract/{contractId}/submit
     */
    @POST
    @Path("/contract/{contractId}/submit")
    @Operation(
        summary = "Submit a signature",
        description = "Submit a signature for a contract. The signature is verified using quantum-safe cryptography (CRYSTALS-Dilithium)."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Signature submitted and verified successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = SubmitSignatureResponse.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid signature or verification failed",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract, party, or pending request not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> submitSignature(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Signature submission request",
                required = true,
                content = @Content(schema = @Schema(implementation = SubmitSignatureRequest.class))
            )
            SubmitSignatureRequest request) {

        LOGGER.info("POST /api/v12/signatures/contract/{}/submit - Submitting signature from party {}",
            contractId, request.partyId);

        return signatureWorkflowService.submitSignature(
                contractId,
                request.partyId,
                request.signatureData,
                request.signatureType)
            .onItem().transform(signature -> {
                LOGGER.info("Signature {} submitted and verified for party {} on contract {}",
                    signature.getSignatureId(), request.partyId, contractId);

                SubmitSignatureResponse response = new SubmitSignatureResponse();
                response.signatureId = signature.getSignatureId();
                response.contractId = contractId;
                response.partyId = request.partyId;
                response.verified = signature.isVerified();
                response.algorithm = signature.getAlgorithm();
                response.signedAt = signature.getSignedAt() != null ? signature.getSignedAt().toString() : null;
                response.message = signature.isVerified()
                    ? "Signature submitted and verified successfully"
                    : "Signature submitted but verification failed";

                return Response.ok(response).build();
            })
            .onFailure(SignatureWorkflowException.class).recoverWithItem(ex -> {
                LOGGER.warn("Signature submission failed for party {} on contract {}: {}",
                    request.partyId, contractId, ex.getMessage());
                return buildErrorResponse(Response.Status.BAD_REQUEST,
                    "Signature submission failed", ex.getMessage());
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error submitting signature for party {} on contract {}: {}",
                    request.partyId, contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to submit signature", throwable.getMessage());
            });
    }

    // ==================== Verify Signature Endpoint ====================

    /**
     * Verify a specific signature
     * GET /api/v12/signatures/contract/{contractId}/verify/{partyId}
     */
    @GET
    @Path("/contract/{contractId}/verify/{partyId}")
    @Operation(
        summary = "Verify a signature",
        description = "Verify a specific party's signature on a contract using quantum-safe cryptography"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Signature verification result",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = SignatureVerificationResult.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract or signature not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> verifySignature(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @Parameter(description = "Party ID whose signature to verify", required = true)
            @PathParam("partyId") String partyId) {

        LOGGER.info("GET /api/v12/signatures/contract/{}/verify/{} - Verifying signature", contractId, partyId);

        return signatureWorkflowService.verifySignature(contractId, partyId)
            .onItem().transform(result -> {
                LOGGER.info("Signature verification for party {} on contract {}: valid={}",
                    partyId, contractId, result.isValid());
                return Response.ok(result).build();
            })
            .onFailure(SignatureWorkflowException.class).recoverWithItem(ex -> {
                LOGGER.warn("Signature verification failed for party {} on contract {}: {}",
                    partyId, contractId, ex.getMessage());
                return buildErrorResponse(Response.Status.NOT_FOUND,
                    "Signature not found", ex.getMessage());
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error verifying signature for party {} on contract {}: {}",
                    partyId, contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to verify signature", throwable.getMessage());
            });
    }

    // ==================== Get Requirements Endpoint ====================

    /**
     * Get required signatures for a contract
     * GET /api/v12/signatures/contract/{contractId}/requirements
     */
    @GET
    @Path("/contract/{contractId}/requirements")
    @Operation(
        summary = "Get required signatures",
        description = "Retrieve the list of required signatures for a contract, including which parties have signed and which are pending"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "List of signature requirements",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(type = SchemaType.ARRAY, implementation = SignatureRequirement.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> getRequiredSignatures(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId) {

        LOGGER.info("GET /api/v12/signatures/contract/{}/requirements - Fetching requirements", contractId);

        return signatureWorkflowService.getRequiredSignatures(contractId)
            .onItem().transform(requirements -> {
                LOGGER.info("Retrieved {} signature requirements for contract {}",
                    requirements.size(), contractId);

                SignatureRequirementsResponse response = new SignatureRequirementsResponse();
                response.contractId = contractId;
                response.totalRequired = requirements.size();
                response.signedCount = (int) requirements.stream().filter(SignatureRequirement::isSigned).count();
                response.pendingCount = (int) requirements.stream().filter(r -> !r.isSigned()).count();
                response.requirements = requirements;

                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error fetching requirements for contract {}: {}", contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to retrieve requirements", throwable.getMessage());
            });
    }

    // ==================== Set Collection Mode Endpoint ====================

    /**
     * Set signature collection mode
     * PUT /api/v12/signatures/contract/{contractId}/mode
     */
    @PUT
    @Path("/contract/{contractId}/mode")
    @Operation(
        summary = "Set collection mode",
        description = "Configure the signature collection mode for a contract: SEQUENTIAL (in priority order) or PARALLEL (any order)"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Collection mode updated successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = CollectionModeResponse.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid collection mode",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> setCollectionMode(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Collection mode configuration",
                required = true,
                content = @Content(schema = @Schema(implementation = SetCollectionModeRequest.class))
            )
            SetCollectionModeRequest request) {

        LOGGER.info("PUT /api/v12/signatures/contract/{}/mode - Setting mode to {}", contractId, request.mode);

        CollectionMode mode;
        try {
            mode = CollectionMode.valueOf(request.mode.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                buildErrorResponse(Response.Status.BAD_REQUEST,
                    "Invalid collection mode",
                    "Mode must be SEQUENTIAL or PARALLEL. Received: " + request.mode)
            );
        }

        return signatureWorkflowService.setCollectionMode(contractId, mode)
            .onItem().transform(workflow -> {
                LOGGER.info("Collection mode set to {} for contract {}", mode, contractId);

                CollectionModeResponse response = new CollectionModeResponse();
                response.contractId = contractId;
                response.workflowId = workflow.getWorkflowId();
                response.mode = workflow.getCollectionMode().name();
                response.updatedAt = workflow.getUpdatedAt() != null ? workflow.getUpdatedAt().toString() : null;
                response.message = "Collection mode updated successfully";

                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error setting collection mode for contract {}: {}", contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to set collection mode", throwable.getMessage());
            });
    }

    // ==================== Add Role Requirement Endpoint ====================

    /**
     * Add a role requirement to the workflow
     * POST /api/v12/signatures/contract/{contractId}/role-requirement
     */
    @POST
    @Path("/contract/{contractId}/role-requirement")
    @Operation(
        summary = "Add role requirement",
        description = "Add or update a role-based signature requirement for the contract workflow. Specify the minimum number of signatures required from a specific role."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Role requirement added successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = RoleRequirementResponse.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid role or count",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = MediaType.APPLICATION_JSON)
        )
    })
    public Uni<Response> addRoleRequirement(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Role requirement configuration",
                required = true,
                content = @Content(schema = @Schema(implementation = AddRoleRequirementRequest.class))
            )
            AddRoleRequirementRequest request) {

        LOGGER.info("POST /api/v12/signatures/contract/{}/role-requirement - Adding role {} with minCount {}",
            contractId, request.role, request.minCount);

        // Validate role
        SignatureRole role;
        try {
            role = SignatureRole.valueOf(request.role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                buildErrorResponse(Response.Status.BAD_REQUEST,
                    "Invalid role",
                    "Role must be one of: OWNER, PARTY, WITNESS, VVB, REGULATOR. Received: " + request.role)
            );
        }

        // Validate minCount
        if (request.minCount < 0) {
            return Uni.createFrom().item(
                buildErrorResponse(Response.Status.BAD_REQUEST,
                    "Invalid minimum count",
                    "Minimum count must be non-negative. Received: " + request.minCount)
            );
        }

        return signatureWorkflowService.addRoleRequirement(contractId, role, request.minCount)
            .onItem().transform(workflow -> {
                LOGGER.info("Role requirement {} added with minCount {} for contract {}",
                    role, request.minCount, contractId);

                RoleRequirementResponse response = new RoleRequirementResponse();
                response.contractId = contractId;
                response.workflowId = workflow.getWorkflowId();
                response.role = role.name();
                response.roleDescription = role.getDescription();
                response.minCount = request.minCount;
                response.signatureRequired = role.isSignatureRequired();
                response.priority = role.getPriority();
                response.updatedAt = workflow.getUpdatedAt() != null ? workflow.getUpdatedAt().toString() : null;
                response.message = "Role requirement added successfully";

                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(throwable -> {
                LOGGER.error("Error adding role requirement for contract {}: {}", contractId, throwable.getMessage());
                return buildErrorResponse(Response.Status.INTERNAL_SERVER_ERROR,
                    "Failed to add role requirement", throwable.getMessage());
            });
    }

    // ==================== Helper Methods ====================

    private Response buildErrorResponse(Response.Status status, String error, String message) {
        return Response.status(status)
            .entity(Map.of(
                "status", "error",
                "error", error,
                "message", message,
                "timestamp", java.time.Instant.now().toString()
            ))
            .build();
    }

    // ==================== Request/Response DTOs ====================

    /**
     * Request to submit a signature
     */
    @Schema(description = "Signature submission request")
    public static class SubmitSignatureRequest {
        @Schema(description = "Party ID submitting the signature", required = true, example = "party-001")
        public String partyId;

        @Schema(description = "Base64 encoded signature data", required = true)
        public String signatureData;

        @Schema(description = "Signature algorithm type", example = "CRYSTALS-Dilithium",
                defaultValue = "CRYSTALS-Dilithium")
        public String signatureType;
    }

    /**
     * Response for signature submission
     */
    @Schema(description = "Signature submission response")
    public static class SubmitSignatureResponse {
        @Schema(description = "Generated signature ID")
        public String signatureId;

        @Schema(description = "Contract ID")
        public String contractId;

        @Schema(description = "Party ID that signed")
        public String partyId;

        @Schema(description = "Whether the signature was verified")
        public boolean verified;

        @Schema(description = "Signature algorithm used")
        public String algorithm;

        @Schema(description = "Timestamp when signed")
        public String signedAt;

        @Schema(description = "Status message")
        public String message;
    }

    /**
     * Request to set collection mode
     */
    @Schema(description = "Collection mode configuration request")
    public static class SetCollectionModeRequest {
        @Schema(description = "Collection mode: SEQUENTIAL or PARALLEL", required = true,
                example = "PARALLEL", enumeration = {"SEQUENTIAL", "PARALLEL"})
        public String mode;
    }

    /**
     * Response for collection mode update
     */
    @Schema(description = "Collection mode update response")
    public static class CollectionModeResponse {
        @Schema(description = "Contract ID")
        public String contractId;

        @Schema(description = "Workflow ID")
        public String workflowId;

        @Schema(description = "Updated collection mode")
        public String mode;

        @Schema(description = "Timestamp of update")
        public String updatedAt;

        @Schema(description = "Status message")
        public String message;
    }

    /**
     * Request to add role requirement
     */
    @Schema(description = "Role requirement configuration request")
    public static class AddRoleRequirementRequest {
        @Schema(description = "Role type: OWNER, PARTY, WITNESS, VVB, or REGULATOR", required = true,
                example = "VVB", enumeration = {"OWNER", "PARTY", "WITNESS", "VVB", "REGULATOR"})
        public String role;

        @Schema(description = "Minimum number of signatures required from this role", required = true,
                example = "1", minimum = "0")
        public int minCount;
    }

    /**
     * Response for role requirement update
     */
    @Schema(description = "Role requirement update response")
    public static class RoleRequirementResponse {
        @Schema(description = "Contract ID")
        public String contractId;

        @Schema(description = "Workflow ID")
        public String workflowId;

        @Schema(description = "Role added")
        public String role;

        @Schema(description = "Description of the role")
        public String roleDescription;

        @Schema(description = "Minimum signatures required")
        public int minCount;

        @Schema(description = "Whether signature is required for this role")
        public boolean signatureRequired;

        @Schema(description = "Role priority (lower = higher priority)")
        public int priority;

        @Schema(description = "Timestamp of update")
        public String updatedAt;

        @Schema(description = "Status message")
        public String message;
    }

    /**
     * Response for signature requirements list
     */
    @Schema(description = "Signature requirements response")
    public static class SignatureRequirementsResponse {
        @Schema(description = "Contract ID")
        public String contractId;

        @Schema(description = "Total number of required signatures")
        public int totalRequired;

        @Schema(description = "Number of signatures collected")
        public int signedCount;

        @Schema(description = "Number of pending signatures")
        public int pendingCount;

        @Schema(description = "List of signature requirements")
        public List<SignatureRequirement> requirements;
    }
}
