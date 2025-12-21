package io.aurigraph.v11.rest;

import io.aurigraph.v11.contracts.VVBVerificationService;
import io.aurigraph.v11.contracts.VVBVerificationService.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * VVB Verification REST API Resource
 *
 * Provides REST endpoints for VVB (Validation and Verification Body) verification workflow
 * for ActiveContracts. This resource manages the verification lifecycle including:
 * - Submitting contracts for VVB review
 * - Tracking verification status
 * - Approving/rejecting verifications
 * - Managing VVB verifiers
 * - Querying verification history
 *
 * State flow: FULLY_SIGNED -> VVB_REVIEW -> VVB_APPROVED/VVB_REJECTED -> ACTIVE
 *
 * @version 12.0.0
 * @author Aurigraph V12 Platform
 */
@Path("/api/v12/vvb")
@ApplicationScoped
@Tag(name = "VVB Contract Verification", description = "VVB verification operations for ActiveContracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VVBVerificationResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(VVBVerificationResource.class);

    @Inject
    VVBVerificationService vvbVerificationService;

    // ============================================
    // CONTRACT VERIFICATION ENDPOINTS
    // ============================================

    /**
     * Submit a contract for VVB review
     *
     * POST /api/v12/vvb/contract/{contractId}/submit
     *
     * @param contractId Contract ID to submit for VVB review
     * @return VVB Review record
     */
    @POST
    @Path("/contract/{contractId}/submit")
    @Operation(
        summary = "Submit contract for VVB review",
        description = "Submit a fully-signed contract for VVB (Validation and Verification Body) review. " +
                     "The contract must be fully signed before it can be submitted for VVB review."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Contract submitted for VVB review successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBReview.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Bad request - Contract not fully signed or already under review"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        )
    })
    public Uni<Response> submitForReview(
            @Parameter(description = "Contract ID to submit for VVB review", required = true)
            @PathParam("contractId") String contractId) {

        LOGGER.info("REST: Submitting contract {} for VVB review", contractId);

        return vvbVerificationService.submitForReview(contractId)
            .map(review -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "Contract submitted for VVB review successfully");
                response.put("review", reviewToMap(review));
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure(VVBVerificationException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB submission failed for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_SUBMISSION_FAILED",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Error submitting contract {} for VVB review: {}", contractId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", "Internal server error: " + error.getMessage(),
                        "errorCode", "INTERNAL_ERROR",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            });
    }

    /**
     * Get VVB verification status for a contract
     *
     * GET /api/v12/vvb/contract/{contractId}/status
     *
     * @param contractId Contract ID
     * @return VVB Review status
     */
    @GET
    @Path("/contract/{contractId}/status")
    @Operation(
        summary = "Get VVB verification status",
        description = "Retrieve the current VVB verification status for a contract"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "VVB verification status retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBReview.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "No VVB review found for contract"
        )
    })
    public Uni<Response> getVerificationStatus(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId) {

        LOGGER.info("REST: Getting VVB verification status for contract {}", contractId);

        return vvbVerificationService.getReviewStatus(contractId)
            .map(review -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("contractId", contractId);
                response.put("review", reviewToMap(review));
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure(VVBReviewNotFoundException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB review not found for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_REVIEW_NOT_FOUND",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Error getting VVB status for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", "Internal server error: " + error.getMessage(),
                        "errorCode", "INTERNAL_ERROR",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            });
    }

    /**
     * Approve VVB verification for a contract
     *
     * POST /api/v12/vvb/contract/{contractId}/approve
     *
     * @param contractId Contract ID
     * @param request Approval request with attestation data
     * @return Updated VVB Review
     */
    @POST
    @Path("/contract/{contractId}/approve")
    @Operation(
        summary = "Approve VVB verification",
        description = "Approve VVB verification for a contract. This creates a VVB attestation and updates the contract status."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "VVB verification approved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBReview.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Bad request - Cannot approve (already approved/rejected)"
        ),
        @APIResponse(
            responseCode = "404",
            description = "No VVB review found for contract"
        )
    })
    public Uni<Response> approveVerification(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Approval request with VVB attestation data",
                required = true,
                content = @Content(schema = @Schema(implementation = ApprovalRequest.class))
            )
            ApprovalRequest request) {

        LOGGER.info("REST: Approving VVB verification for contract {} by verifier {}", contractId, request.vvbId);

        // Create attestation request from approval request
        VVBAttestationRequest attestation = new VVBAttestationRequest();
        attestation.setScope(request.scope != null ? request.scope : "Full verification");
        attestation.setFindings(request.findings != null ? request.findings : "Verification completed successfully");
        attestation.setRecommendations(request.recommendations);

        return vvbVerificationService.approve(contractId, request.vvbId, attestation)
            .map(review -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "VVB verification approved successfully");
                response.put("review", reviewToMap(review));
                response.put("attestationId", review.getAttestationId());
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure(VVBReviewNotFoundException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB review not found for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_REVIEW_NOT_FOUND",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure(VVBVerificationException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB approval failed for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_APPROVAL_FAILED",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Error approving VVB verification for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", "Internal server error: " + error.getMessage(),
                        "errorCode", "INTERNAL_ERROR",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            });
    }

    /**
     * Reject VVB verification for a contract
     *
     * POST /api/v12/vvb/contract/{contractId}/reject
     *
     * @param contractId Contract ID
     * @param request Rejection request with reason
     * @return Updated VVB Review
     */
    @POST
    @Path("/contract/{contractId}/reject")
    @Operation(
        summary = "Reject VVB verification",
        description = "Reject VVB verification for a contract with a specified reason"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "VVB verification rejected",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBReview.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Bad request - Cannot reject (already approved/rejected)"
        ),
        @APIResponse(
            responseCode = "404",
            description = "No VVB review found for contract"
        )
    })
    public Uni<Response> rejectVerification(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Rejection request with reason",
                required = true,
                content = @Content(schema = @Schema(implementation = RejectionRequest.class))
            )
            RejectionRequest request) {

        LOGGER.info("REST: Rejecting VVB verification for contract {} by verifier {}", contractId, request.vvbId);

        return vvbVerificationService.reject(contractId, request.vvbId, request.reason)
            .map(review -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "VVB verification rejected");
                response.put("review", reviewToMap(review));
                response.put("rejectionReason", request.reason);
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure(VVBReviewNotFoundException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB review not found for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_REVIEW_NOT_FOUND",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure(VVBVerificationException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB rejection failed for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_REJECTION_FAILED",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Error rejecting VVB verification for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", "Internal server error: " + error.getMessage(),
                        "errorCode", "INTERNAL_ERROR",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            });
    }

    /**
     * Get VVB attestation for a contract
     *
     * GET /api/v12/vvb/contract/{contractId}/attestation
     *
     * @param contractId Contract ID
     * @return VVB Attestation
     */
    @GET
    @Path("/contract/{contractId}/attestation")
    @Operation(
        summary = "Get VVB attestation",
        description = "Retrieve the VVB attestation for an approved contract"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "VVB attestation retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBAttestation.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "No VVB attestation found for contract"
        )
    })
    public Uni<Response> getAttestation(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId) {

        LOGGER.info("REST: Getting VVB attestation for contract {}", contractId);

        return vvbVerificationService.getAttestation(contractId)
            .map(attestation -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("contractId", contractId);
                response.put("attestation", attestationToMap(attestation));
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure(VVBAttestationNotFoundException.class).recoverWithItem(error -> {
                LOGGER.warn("VVB attestation not found for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage(),
                        "errorCode", "VVB_ATTESTATION_NOT_FOUND",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Error getting VVB attestation for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", "Internal server error: " + error.getMessage(),
                        "errorCode", "INTERNAL_ERROR",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            });
    }

    // ============================================
    // PENDING VERIFICATIONS ENDPOINT
    // ============================================

    /**
     * Get all pending VVB verifications
     *
     * GET /api/v12/vvb/pending
     *
     * @param status Optional status filter (PENDING, IN_REVIEW)
     * @param page Page number (0-based)
     * @param size Page size
     * @return List of pending VVB reviews
     */
    @GET
    @Path("/pending")
    @Operation(
        summary = "Get pending verifications",
        description = "Retrieve all pending VVB verifications awaiting review"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Pending verifications retrieved successfully"
        )
    })
    public Uni<Response> getPendingVerifications(
            @Parameter(description = "Status filter (PENDING, IN_REVIEW)")
            @QueryParam("status") String status,
            @Parameter(description = "Page number (0-based)")
            @QueryParam("page") @DefaultValue("0") int page,
            @Parameter(description = "Page size")
            @QueryParam("size") @DefaultValue("20") int size) {

        LOGGER.info("REST: Getting pending VVB verifications - status: {}, page: {}, size: {}", status, page, size);

        return Uni.createFrom().item(() -> {
            // Get metrics which contains pending count
            Map<String, Object> metrics = vvbVerificationService.getMetrics();

            // For now, return metrics-based response
            // In a full implementation, we would have a method to list pending reviews
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("pendingCount", metrics.get("pendingReviews"));
            response.put("totalSubmitted", metrics.get("reviewsSubmitted"));
            response.put("totalApproved", metrics.get("reviewsApproved"));
            response.put("totalRejected", metrics.get("reviewsRejected"));
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalPages", Math.max(1, (Long.parseLong(metrics.get("pendingReviews").toString()) + size - 1) / size)
            ));
            response.put("timestamp", Instant.now().toString());

            return Response.ok(response).build();
        });
    }

    // ============================================
    // VERIFIER MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * Get verifier history
     *
     * GET /api/v12/vvb/verifier/{verifierId}/history
     *
     * @param verifierId Verifier ID
     * @param page Page number
     * @param size Page size
     * @return Verifier's verification history
     */
    @GET
    @Path("/verifier/{verifierId}/history")
    @Operation(
        summary = "Get verifier history",
        description = "Retrieve verification history for a specific VVB verifier"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Verifier history retrieved successfully"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Verifier not found"
        )
    })
    public Uni<Response> getVerifierHistory(
            @Parameter(description = "VVB Verifier ID", required = true)
            @PathParam("verifierId") String verifierId,
            @Parameter(description = "Page number (0-based)")
            @QueryParam("page") @DefaultValue("0") int page,
            @Parameter(description = "Page size")
            @QueryParam("size") @DefaultValue("20") int size) {

        LOGGER.info("REST: Getting history for VVB verifier {}", verifierId);

        return Uni.createFrom().item(() -> {
            // Get registered VVBs to check if verifier exists
            List<VVBEntity> vvbs = vvbVerificationService.getRegisteredVVBs();
            Optional<VVBEntity> verifier = vvbs.stream()
                .filter(v -> v.getVvbId().equals(verifierId))
                .findFirst();

            if (verifier.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", "Verifier not found: " + verifierId,
                        "errorCode", "VERIFIER_NOT_FOUND",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            }

            VVBEntity vvb = verifier.get();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("verifier", entityToMap(vvb));
            // In a full implementation, we would have a method to get verifier's review history
            response.put("verifications", List.of()); // Placeholder for verification history
            response.put("statistics", Map.of(
                "totalVerifications", 0,
                "approved", 0,
                "rejected", 0,
                "pending", 0
            ));
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalPages", 0
            ));
            response.put("timestamp", Instant.now().toString());

            return Response.ok(response).build();
        });
    }

    /**
     * Register as VVB verifier
     *
     * POST /api/v12/vvb/verifier/register
     *
     * @param request Registration request
     * @return Registered VVB entity
     */
    @POST
    @Path("/verifier/register")
    @Operation(
        summary = "Register as VVB verifier",
        description = "Register a new VVB (Validation and Verification Body) verifier"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "201",
            description = "VVB verifier registered successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = VVBEntity.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid registration request"
        ),
        @APIResponse(
            responseCode = "409",
            description = "Verifier already registered"
        )
    })
    public Uni<Response> registerVerifier(
            @RequestBody(
                description = "VVB verifier registration request",
                required = true,
                content = @Content(schema = @Schema(implementation = VerifierRegistrationRequest.class))
            )
            VerifierRegistrationRequest request) {

        LOGGER.info("REST: Registering VVB verifier: {} ({})", request.name, request.vvbId);

        return Uni.createFrom().item(() -> {
            // Validate request
            if (request.vvbId == null || request.vvbId.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", "VVB ID is required",
                        "errorCode", "INVALID_REQUEST",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            }

            if (request.name == null || request.name.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", "VVB name is required",
                        "errorCode", "INVALID_REQUEST",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            }

            // Check if already registered
            List<VVBEntity> existingVVBs = vvbVerificationService.getRegisteredVVBs();
            boolean alreadyExists = existingVVBs.stream()
                .anyMatch(v -> v.getVvbId().equals(request.vvbId));

            if (alreadyExists) {
                return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of(
                        "success", false,
                        "error", "VVB verifier already registered: " + request.vvbId,
                        "errorCode", "VERIFIER_ALREADY_EXISTS",
                        "timestamp", Instant.now().toString()
                    ))
                    .build();
            }

            // Parse VVB type
            VVBType vvbType = VVBType.GENERAL;
            if (request.type != null && !request.type.isEmpty()) {
                try {
                    vvbType = VVBType.valueOf(request.type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    LOGGER.warn("Invalid VVB type: {}, defaulting to GENERAL", request.type);
                }
            }

            // Register the VVB
            VVBEntity vvb = vvbVerificationService.registerVVB(request.vvbId, request.name, vvbType);

            // Update metadata if provided
            if (request.certifications != null) {
                vvb.getCertifications().addAll(request.certifications);
            }
            if (request.metadata != null) {
                vvb.getMetadata().putAll(request.metadata);
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("message", "VVB verifier registered successfully");
            response.put("verifier", entityToMap(vvb));
            response.put("timestamp", Instant.now().toString());

            return Response.status(Response.Status.CREATED).entity(response).build();
        });
    }

    /**
     * List all registered VVB verifiers
     *
     * GET /api/v12/vvb/verifiers
     *
     * @param type Optional type filter
     * @param active Optional active filter
     * @return List of registered VVB entities
     */
    @GET
    @Path("/verifiers")
    @Operation(
        summary = "List registered verifiers",
        description = "Retrieve list of all registered VVB verifiers"
    )
    @APIResponse(
        responseCode = "200",
        description = "Verifiers retrieved successfully"
    )
    public Uni<Response> listVerifiers(
            @Parameter(description = "Filter by VVB type")
            @QueryParam("type") String type,
            @Parameter(description = "Filter by active status")
            @QueryParam("active") Boolean active) {

        LOGGER.info("REST: Listing VVB verifiers - type: {}, active: {}", type, active);

        return Uni.createFrom().item(() -> {
            List<VVBEntity> vvbs = vvbVerificationService.getRegisteredVVBs();

            // Apply filters
            if (type != null && !type.isEmpty()) {
                try {
                    VVBType filterType = VVBType.valueOf(type.toUpperCase());
                    vvbs = vvbs.stream()
                        .filter(v -> v.getType() == filterType)
                        .collect(Collectors.toList());
                } catch (IllegalArgumentException e) {
                    LOGGER.warn("Invalid VVB type filter: {}", type);
                }
            }

            if (active != null) {
                vvbs = vvbs.stream()
                    .filter(v -> v.isActive() == active)
                    .collect(Collectors.toList());
            }

            List<Map<String, Object>> verifierList = vvbs.stream()
                .map(this::entityToMap)
                .collect(Collectors.toList());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("verifiers", verifierList);
            response.put("totalCount", verifierList.size());
            response.put("timestamp", Instant.now().toString());

            return Response.ok(response).build();
        });
    }

    // ============================================
    // METRICS ENDPOINT
    // ============================================

    /**
     * Get VVB verification metrics
     *
     * GET /api/v12/vvb/metrics
     *
     * @return VVB verification metrics
     */
    @GET
    @Path("/metrics")
    @Operation(
        summary = "Get VVB metrics",
        description = "Retrieve VVB verification system metrics"
    )
    @APIResponse(
        responseCode = "200",
        description = "Metrics retrieved successfully"
    )
    public Response getMetrics() {
        LOGGER.info("REST: Getting VVB verification metrics");

        Map<String, Object> metrics = vvbVerificationService.getMetrics();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("metrics", metrics);
        response.put("systemStatus", "OPERATIONAL");
        response.put("version", "12.0.0");
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    /**
     * Health check endpoint
     *
     * GET /api/v12/vvb/health
     *
     * @return Health status
     */
    @GET
    @Path("/health")
    @Operation(
        summary = "Health check",
        description = "Check VVB verification service health"
    )
    @APIResponse(
        responseCode = "200",
        description = "Service is healthy"
    )
    public Response healthCheck() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "VVB Verification Service");
        health.put("version", "12.0.0");
        health.put("metrics", vvbVerificationService.getMetrics());
        health.put("timestamp", Instant.now().toString());

        return Response.ok(health).build();
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private Map<String, Object> reviewToMap(VVBReview review) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("reviewId", review.getReviewId());
        map.put("contractId", review.getContractId());
        map.put("contractName", review.getContractName());
        map.put("contractType", review.getContractType());
        map.put("status", review.getStatus() != null ? review.getStatus().name() : null);
        map.put("submittedAt", review.getSubmittedAt() != null ? review.getSubmittedAt().toString() : null);
        map.put("submittedBy", review.getSubmittedBy());
        map.put("reviewedAt", review.getReviewedAt() != null ? review.getReviewedAt().toString() : null);
        map.put("reviewedBy", review.getReviewedBy());
        map.put("vvbName", review.getVvbName());
        map.put("rejectionReason", review.getRejectionReason());
        map.put("attestationId", review.getAttestationId());
        return map;
    }

    private Map<String, Object> attestationToMap(VVBAttestation attestation) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("attestationId", attestation.getAttestationId());
        map.put("contractId", attestation.getContractId());
        map.put("vvbId", attestation.getVvbId());
        map.put("vvbName", attestation.getVvbName());
        map.put("issuedAt", attestation.getIssuedAt() != null ? attestation.getIssuedAt().toString() : null);
        map.put("validUntil", attestation.getValidUntil() != null ? attestation.getValidUntil().toString() : null);
        map.put("scope", attestation.getScope());
        map.put("findings", attestation.getFindings());
        map.put("recommendations", attestation.getRecommendations());
        map.put("signature", attestation.getSignature());
        map.put("valid", attestation.isValid());
        return map;
    }

    private Map<String, Object> entityToMap(VVBEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("vvbId", entity.getVvbId());
        map.put("name", entity.getName());
        map.put("type", entity.getType() != null ? entity.getType().name() : null);
        map.put("registeredAt", entity.getRegisteredAt() != null ? entity.getRegisteredAt().toString() : null);
        map.put("active", entity.isActive());
        map.put("certifications", entity.getCertifications());
        map.put("metadata", entity.getMetadata());
        return map;
    }

    // ============================================
    // REQUEST/RESPONSE MODELS
    // ============================================

    /**
     * Approval request for VVB verification
     */
    public static class ApprovalRequest {
        public String vvbId;
        public String scope;
        public String findings;
        public String recommendations;
        public Map<String, Object> additionalData;
    }

    /**
     * Rejection request for VVB verification
     */
    public static class RejectionRequest {
        public String vvbId;
        public String reason;
        public List<String> requiredActions;
    }

    /**
     * VVB verifier registration request
     */
    public static class VerifierRegistrationRequest {
        public String vvbId;
        public String name;
        public String type;
        public List<String> certifications;
        public Map<String, String> metadata;
        public String contactEmail;
        public String organization;
    }
}
