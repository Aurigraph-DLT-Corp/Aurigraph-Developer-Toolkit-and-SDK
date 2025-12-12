package io.aurigraph.v11.verification;

import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API for External Verification services.
 * Provides endpoints for verifying assets against external data sources.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@Path("/api/v12/verification")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExternalVerificationResource {

    private static final Logger LOG = Logger.getLogger(ExternalVerificationResource.class);

    @Inject
    ExternalVerificationService verificationService;

    /**
     * Get available verification services.
     */
    @GET
    @Path("/services")
    public Response getAvailableServices() {
        Map<VerificationType, Boolean> services = verificationService.getAvailableServices();
        return Response.ok(Map.of(
                "services", services,
                "availableTypes", verificationService.getAvailableVerificationTypes()
        )).build();
    }

    /**
     * Verify an asset using specified verification type.
     */
    @POST
    @Path("/verify")
    public Response verify(VerificationRequest request) {
        LOG.infof("Verification request received: type=%s, assetId=%s",
                request.getVerificationType(), request.getAssetId());

        try {
            VerificationResult result = verificationService.verify(request);
            return Response.ok(result).build();
        } catch (Exception e) {
            LOG.error("Verification failed", e);
            return Response.serverError()
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Verify with automatic fallback to manual on failure.
     */
    @POST
    @Path("/verify-with-fallback")
    public Response verifyWithFallback(VerificationRequest request) {
        LOG.infof("Verification with fallback requested: type=%s", request.getVerificationType());

        VerificationResult result = verificationService.verifyWithFallback(request);
        return Response.ok(result).build();
    }

    /**
     * Verify land registry ownership.
     */
    @POST
    @Path("/land-registry")
    public Response verifyLandRegistry(LandRegistryVerificationRequest request) {
        LOG.infof("Land Registry verification: propertyId=%s, jurisdiction=%s",
                request.propertyId, request.jurisdiction);

        VerificationResult result = verificationService.verifyLandRegistry(
                request.assetId, request.propertyId, request.jurisdiction);
        return Response.ok(result).build();
    }

    /**
     * Verify KYC for a user.
     */
    @POST
    @Path("/kyc")
    public Response verifyKYC(KYCVerificationRequest request) {
        LOG.infof("KYC verification: userId=%s, level=%s", request.userId, request.level);

        Map<String, Object> kycData = Map.of(
                "level", request.level != null ? request.level : "STANDARD",
                "documentType", request.documentType != null ? request.documentType : "PASSPORT",
                "documentNumber", request.documentNumber != null ? request.documentNumber : ""
        );

        VerificationResult result = verificationService.verifyKYC(request.userId, kycData);
        return Response.ok(result).build();
    }

    /**
     * Verify carbon credits via VVB.
     */
    @POST
    @Path("/vvb")
    public Response verifyVVB(VVBVerificationRequest request) {
        LOG.infof("VVB verification: projectId=%s, registry=%s", request.projectId, request.registry);

        VerificationResult result = verificationService.verifyVVB(
                request.assetId, request.projectId, request.registry);
        return Response.ok(result).build();
    }

    /**
     * Manual verification bypass for demo purposes.
     */
    @POST
    @Path("/manual")
    public Response manualVerify(ManualVerificationRequest request) {
        LOG.infof("Manual verification: assetId=%s, verifierId=%s, reason=%s",
                request.assetId, request.verifierId, request.reason);

        if (request.reason == null || request.reason.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Bypass reason is required"))
                    .build();
        }

        VerificationResult result = verificationService.manualVerify(
                request.assetId, request.verifierId, request.reason);
        return Response.ok(result).build();
    }

    /**
     * Run multiple verifications for an asset.
     */
    @POST
    @Path("/verify-multiple")
    public Response verifyMultiple(MultipleVerificationRequest request) {
        LOG.infof("Multiple verification: assetId=%s, types=%s", request.assetId, request.types);

        Map<VerificationType, VerificationResult> results = verificationService.verifyMultiple(
                request.assetId, request.types, request.requesterId);
        return Response.ok(results).build();
    }

    /**
     * Get verification types supported for a specific asset category.
     */
    @GET
    @Path("/types/{category}")
    public Response getVerificationTypesForCategory(@PathParam("category") String category) {
        // Map asset categories to relevant verification types
        List<VerificationType> types = switch (category.toUpperCase()) {
            case "REAL_ESTATE" -> List.of(VerificationType.LAND_REGISTRY, VerificationType.KYC);
            case "CARBON_CREDITS" -> List.of(VerificationType.VVB, VerificationType.KYC);
            case "FINANCIAL_SECURITIES" -> List.of(VerificationType.SEC_FILING, VerificationType.KYC);
            case "INTELLECTUAL_PROPERTY" -> List.of(VerificationType.IP_REGISTRY, VerificationType.KYC);
            default -> List.of(VerificationType.KYC, VerificationType.MANUAL);
        };

        return Response.ok(Map.of(
                "category", category,
                "verificationTypes", types
        )).build();
    }

    // Request DTOs

    public static class LandRegistryVerificationRequest {
        public UUID assetId;
        public String propertyId;
        public String jurisdiction;
    }

    public static class KYCVerificationRequest {
        public String userId;
        public String level; // BASIC, STANDARD, ENHANCED
        public String documentType;
        public String documentNumber;
    }

    public static class VVBVerificationRequest {
        public UUID assetId;
        public String projectId;
        public String registry; // VERRA, GOLD_STANDARD, CAR, ACR
    }

    public static class ManualVerificationRequest {
        public UUID assetId;
        public String verifierId;
        public String reason;
    }

    public static class MultipleVerificationRequest {
        public UUID assetId;
        public List<VerificationType> types;
        public String requesterId;
    }
}
