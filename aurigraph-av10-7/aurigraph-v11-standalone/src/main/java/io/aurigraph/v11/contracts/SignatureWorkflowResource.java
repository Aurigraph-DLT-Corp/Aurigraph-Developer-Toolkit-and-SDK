package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.SignatureWorkflowService.*;
import io.aurigraph.v11.contracts.models.ContractSignature;
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
 * Signature Workflow REST API for ActiveContracts
 *
 * Provides REST endpoints for managing multi-party signature workflows
 * with RBAC support and quantum-safe CRYSTALS-Dilithium signatures.
 *
 * API Version: v12
 * Base Path: /api/v12/contracts/{id}/signatures
 *
 * Endpoints:
 * - GET  /api/v12/contracts/{id}/signatures           - List all signatures
 * - POST /api/v12/contracts/{id}/signatures           - Submit a signature
 * - GET  /api/v12/contracts/{id}/signatures/requirements - Get required signatures
 * - POST /api/v12/contracts/{id}/signatures/request   - Request signature from party
 * - GET  /api/v12/contracts/{id}/signatures/status    - Get workflow status
 * - GET  /api/v12/contracts/{id}/signatures/{partyId}/verify - Verify specific signature
 *
 * @version 12.0.0 - Sprint 4 RBAC Implementation
 * @since 2025-12-21
 */
@Path("/api/v12/contracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SignatureWorkflowResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(SignatureWorkflowResource.class);

    @Inject
    SignatureWorkflowService signatureWorkflowService;

    @Inject
    ActiveContractService contractService;

    // ==================== Signature List & Submit ====================

    /**
     * List all signatures for a contract
     *
     * GET /api/v12/contracts/{id}/signatures
     *
     * @param contractId Contract ID
     * @return List of signatures
     */
    @GET
    @Path("/{contractId}/signatures")
    public Uni<Response> listSignatures(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: List signatures for contract: {}", contractId);

        return contractService.getContract(contractId)
            .map(contract -> Response.ok(contract.getSignatures()).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to list signatures: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Submit a signature for a contract
     *
     * POST /api/v12/contracts/{id}/signatures
     *
     * Request body:
     * {
     *   "partyId": "party-001",
     *   "signature": "base64-encoded-signature",
     *   "signatureType": "CRYSTALS-Dilithium" (optional, default)
     * }
     *
     * @param contractId Contract ID
     * @param request Signature submission request
     * @return Submitted signature with verification status
     */
    @POST
    @Path("/{contractId}/signatures")
    public Uni<Response> submitSignature(
            @PathParam("contractId") String contractId,
            SignatureSubmissionRequest request
    ) {
        LOGGER.info("REST: Submit signature for contract: {} from party: {}",
            contractId, request.getPartyId());

        return signatureWorkflowService.submitSignature(
                contractId,
                request.getPartyId(),
                request.getSignature(),
                request.getSignatureType()
            )
            .map(signature -> Response.status(Response.Status.CREATED)
                .entity(signature)
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to submit signature: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Signature Requirements ====================

    /**
     * Get required signatures for a contract
     *
     * GET /api/v12/contracts/{id}/signatures/requirements
     *
     * Returns list of parties that need to sign, their roles,
     * and current signing status.
     *
     * @param contractId Contract ID
     * @return List of signature requirements
     */
    @GET
    @Path("/{contractId}/signatures/requirements")
    public Uni<Response> getRequiredSignatures(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get signature requirements for contract: {}", contractId);

        return signatureWorkflowService.getRequiredSignatures(contractId)
            .map(requirements -> Response.ok(requirements).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get requirements: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Signature Requests ====================

    /**
     * Request signature from a party
     *
     * POST /api/v12/contracts/{id}/signatures/request
     *
     * Request body:
     * {
     *   "partyId": "party-001",
     *   "message": "Please sign this contract" (optional)
     * }
     *
     * @param contractId Contract ID
     * @param request Signature request
     * @return Signature request details
     */
    @POST
    @Path("/{contractId}/signatures/request")
    public Uni<Response> requestSignature(
            @PathParam("contractId") String contractId,
            SignatureRequestDTO request
    ) {
        LOGGER.info("REST: Request signature for contract: {} from party: {}",
            contractId, request.getPartyId());

        return signatureWorkflowService.requestSignature(contractId, request.getPartyId())
            .map(signatureRequest -> Response.status(Response.Status.CREATED)
                .entity(signatureRequest)
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to request signature: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Workflow Status ====================

    /**
     * Get signature workflow status
     *
     * GET /api/v12/contracts/{id}/signatures/status
     *
     * Returns comprehensive workflow status including:
     * - Current workflow state
     * - Collection mode (sequential/parallel)
     * - Signature counts by role
     * - Fully signed status
     *
     * @param contractId Contract ID
     * @return Workflow status
     */
    @GET
    @Path("/{contractId}/signatures/status")
    public Uni<Response> getWorkflowStatus(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get signature workflow status for contract: {}", contractId);

        return signatureWorkflowService.getSignatureStatus(contractId)
            .map(status -> Response.ok(status).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get workflow status: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Signature Verification ====================

    /**
     * Verify a specific party's signature
     *
     * GET /api/v12/contracts/{id}/signatures/{partyId}/verify
     *
     * @param contractId Contract ID
     * @param partyId Party ID
     * @return Verification result
     */
    @GET
    @Path("/{contractId}/signatures/{partyId}/verify")
    public Uni<Response> verifySignature(
            @PathParam("contractId") String contractId,
            @PathParam("partyId") String partyId
    ) {
        LOGGER.info("REST: Verify signature for contract: {} party: {}", contractId, partyId);

        return signatureWorkflowService.verifySignature(contractId, partyId)
            .map(result -> Response.ok(result).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to verify signature: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Workflow Configuration ====================

    /**
     * Configure signature collection mode
     *
     * PUT /api/v12/contracts/{id}/signatures/config/mode
     *
     * Request body:
     * {
     *   "mode": "SEQUENTIAL" | "PARALLEL"
     * }
     *
     * @param contractId Contract ID
     * @param request Configuration request
     * @return Updated workflow
     */
    @PUT
    @Path("/{contractId}/signatures/config/mode")
    public Uni<Response> setCollectionMode(
            @PathParam("contractId") String contractId,
            CollectionModeRequest request
    ) {
        LOGGER.info("REST: Set collection mode for contract: {} to: {}",
            contractId, request.getMode());

        return signatureWorkflowService.setCollectionMode(
                contractId,
                SignatureWorkflowService.CollectionMode.valueOf(request.getMode().toUpperCase())
            )
            .map(workflow -> Response.ok(workflow).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to set collection mode: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Add role requirement to workflow
     *
     * POST /api/v12/contracts/{id}/signatures/config/roles
     *
     * Request body:
     * {
     *   "role": "VVB",
     *   "minCount": 2
     * }
     *
     * @param contractId Contract ID
     * @param request Role requirement request
     * @return Updated workflow
     */
    @POST
    @Path("/{contractId}/signatures/config/roles")
    public Uni<Response> addRoleRequirement(
            @PathParam("contractId") String contractId,
            RoleRequirementRequest request
    ) {
        LOGGER.info("REST: Add role requirement for contract: {} role: {} count: {}",
            contractId, request.getRole(), request.getMinCount());

        return signatureWorkflowService.addRoleRequirement(
                contractId,
                SignatureWorkflowService.SignatureRole.valueOf(request.getRole().toUpperCase()),
                request.getMinCount()
            )
            .map(workflow -> Response.ok(workflow).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to add role requirement: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Fully Signed Check ====================

    /**
     * Check if contract is fully signed
     *
     * GET /api/v12/contracts/{id}/signatures/fully-signed
     *
     * @param contractId Contract ID
     * @return {fullySigned: boolean}
     */
    @GET
    @Path("/{contractId}/signatures/fully-signed")
    public Uni<Response> isFullySigned(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Check if contract is fully signed: {}", contractId);

        return signatureWorkflowService.isFullySigned(contractId)
            .map(fullySigned -> Response.ok(Map.of(
                "contractId", contractId,
                "fullySigned", fullySigned
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to check fully signed: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== Role Information ====================

    /**
     * Get available signature roles
     *
     * GET /api/v12/contracts/signatures/roles
     *
     * @return List of available roles with descriptions
     */
    @GET
    @Path("/signatures/roles")
    public Response getAvailableRoles() {
        LOGGER.info("REST: Get available signature roles");

        List<Map<String, Object>> roles = new java.util.ArrayList<>();
        for (SignatureWorkflowService.SignatureRole role : SignatureWorkflowService.SignatureRole.values()) {
            roles.add(Map.of(
                "role", role.name(),
                "priority", role.getPriority(),
                "signatureRequired", role.isSignatureRequired(),
                "description", role.getDescription()
            ));
        }

        return Response.ok(Map.of(
            "roles", roles,
            "supportedAlgorithms", List.of("CRYSTALS-Dilithium", "ECDSA", "Ed25519"),
            "defaultAlgorithm", "CRYSTALS-Dilithium",
            "collectionModes", List.of("SEQUENTIAL", "PARALLEL"),
            "workflowStates", List.of("DRAFT", "PENDING_SIGNATURES", "PARTIALLY_SIGNED", "FULLY_SIGNED", "EXPIRED", "REJECTED")
        )).build();
    }

    // ==================== Request DTOs ====================

    /**
     * Signature submission request
     */
    public static class SignatureSubmissionRequest {
        private String partyId;
        private String signature;
        private String signatureType;
        private String publicKey;

        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }

        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }

        public String getSignatureType() { return signatureType; }
        public void setSignatureType(String signatureType) { this.signatureType = signatureType; }

        public String getPublicKey() { return publicKey; }
        public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    }

    /**
     * Signature request DTO
     */
    public static class SignatureRequestDTO {
        private String partyId;
        private String message;
        private Long expirySeconds;

        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Long getExpirySeconds() { return expirySeconds; }
        public void setExpirySeconds(Long expirySeconds) { this.expirySeconds = expirySeconds; }
    }

    /**
     * Collection mode configuration request
     */
    public static class CollectionModeRequest {
        private String mode;

        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
    }

    /**
     * Role requirement request
     */
    public static class RoleRequirementRequest {
        private String role;
        private int minCount;

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public int getMinCount() { return minCount; }
        public void setMinCount(int minCount) { this.minCount = minCount; }
    }
}
