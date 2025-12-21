package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.VVBVerificationService.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * VVB Verification REST API Resource
 *
 * Provides REST endpoints for VVB (Validation and Verification Body) verification workflow:
 * - Submit contracts for VVB review
 * - Get review status
 * - VVB approval/rejection
 * - Attestation management
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@Path("/api/v12/contracts/{contractId}/vvb")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VVBVerificationResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(VVBVerificationResource.class);

    @Inject
    VVBVerificationService vvbService;

    /**
     * Submit a contract for VVB review
     *
     * POST /api/v12/contracts/{contractId}/vvb/submit
     *
     * @param contractId Contract ID
     * @return VVB Review record
     */
    @POST
    @Path("/submit")
    public Uni<Response> submitForReview(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Submit contract {} for VVB review", contractId);

        return vvbService.submitForReview(contractId)
            .map(review -> Response.ok(Map.of(
                "status", "submitted",
                "review", review
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("VVB submission failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get VVB review status
     *
     * GET /api/v12/contracts/{contractId}/vvb/status
     *
     * @param contractId Contract ID
     * @return VVB Review status
     */
    @GET
    @Path("/status")
    public Uni<Response> getReviewStatus(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get VVB review status for contract {}", contractId);

        return vvbService.getReviewStatus(contractId)
            .map(review -> Response.ok(review).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get VVB status failed: {}", error.getMessage());
                if (error instanceof VVBReviewNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * VVB approves a contract
     *
     * POST /api/v12/contracts/{contractId}/vvb/approve
     *
     * Request body:
     * {
     *   "vvbId": "VVB-001",
     *   "scope": "Carbon credit verification",
     *   "findings": "All criteria met",
     *   "recommendations": "None"
     * }
     *
     * @param contractId Contract ID
     * @param request Approval request with attestation data
     * @return Updated VVB Review
     */
    @POST
    @Path("/approve")
    public Uni<Response> approveContract(
            @PathParam("contractId") String contractId,
            VVBApprovalRequest request
    ) {
        LOGGER.info("REST: VVB {} approving contract {}", request.getVvbId(), contractId);

        VVBAttestationRequest attestation = new VVBAttestationRequest();
        attestation.setScope(request.getScope());
        attestation.setFindings(request.getFindings());
        attestation.setRecommendations(request.getRecommendations());

        return vvbService.approve(contractId, request.getVvbId(), attestation)
            .map(review -> Response.ok(Map.of(
                "status", "approved",
                "review", review
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("VVB approval failed: {}", error.getMessage());
                if (error instanceof VVBReviewNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * VVB rejects a contract
     *
     * POST /api/v12/contracts/{contractId}/vvb/reject
     *
     * Request body:
     * {
     *   "vvbId": "VVB-001",
     *   "reason": "Documentation incomplete"
     * }
     *
     * @param contractId Contract ID
     * @param request Rejection request
     * @return Updated VVB Review
     */
    @POST
    @Path("/reject")
    public Uni<Response> rejectContract(
            @PathParam("contractId") String contractId,
            VVBRejectionRequest request
    ) {
        LOGGER.info("REST: VVB {} rejecting contract {}", request.getVvbId(), contractId);

        return vvbService.reject(contractId, request.getVvbId(), request.getReason())
            .map(review -> Response.ok(Map.of(
                "status", "rejected",
                "review", review
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("VVB rejection failed: {}", error.getMessage());
                if (error instanceof VVBReviewNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get VVB attestation for a contract
     *
     * GET /api/v12/contracts/{contractId}/vvb/attestation
     *
     * @param contractId Contract ID
     * @return VVB Attestation
     */
    @GET
    @Path("/attestation")
    public Uni<Response> getAttestation(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get VVB attestation for contract {}", contractId);

        return vvbService.getAttestation(contractId)
            .map(attestation -> Response.ok(attestation).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get VVB attestation failed: {}", error.getMessage());
                if (error instanceof VVBAttestationNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get VVB verification metrics
     *
     * GET /api/v12/contracts/vvb/metrics
     *
     * @return VVB metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics() {
        LOGGER.info("REST: Get VVB verification metrics");
        return Response.ok(vvbService.getMetrics()).build();
    }

    // ============================================
    // REQUEST CLASSES
    // ============================================

    /**
     * VVB Approval Request
     */
    public static class VVBApprovalRequest {
        private String vvbId;
        private String scope;
        private String findings;
        private String recommendations;

        public String getVvbId() { return vvbId; }
        public void setVvbId(String vvbId) { this.vvbId = vvbId; }
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        public String getFindings() { return findings; }
        public void setFindings(String findings) { this.findings = findings; }
        public String getRecommendations() { return recommendations; }
        public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
    }

    /**
     * VVB Rejection Request
     */
    public static class VVBRejectionRequest {
        private String vvbId;
        private String reason;

        public String getVvbId() { return vvbId; }
        public void setVvbId(String vvbId) { this.vvbId = vvbId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
