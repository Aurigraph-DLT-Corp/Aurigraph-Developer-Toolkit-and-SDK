package io.aurigraph.v11.api;

import io.aurigraph.v11.hms.*;
import io.aurigraph.v11.hms.models.*;
import io.aurigraph.v11.hms.VerificationService.VerificationStatistics;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * REST API for HMS (Healthcare Management System) Integration
 * Provides endpoints for asset tokenization, verification, and transfer
 */
@Path("/api/v11/hms")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HMSResource {

    @Inject
    HMSIntegrationService hmsService;

    @Inject
    VerificationService verificationService;

    @Inject
    ComplianceService complianceService;

    /**
     * POST /api/v11/hms/assets - Tokenize a healthcare asset
     */
    @POST
    @Path("/assets")
    public Uni<Response> tokenizeAsset(AssetTokenizationRequest request) {
        Log.infof("REST API: Tokenize asset request for type: %s", request.assetType);

        return Uni.createFrom().item(() -> {
            try {
                // Create appropriate asset based on type
                HealthcareAsset asset = createAssetFromRequest(request);

                // Set compliance info
                ComplianceInfo complianceInfo = new ComplianceInfo();
                complianceInfo.setHipaaCompliant(request.hipaaCompliant);
                complianceInfo.setGdprCompliant(request.gdprCompliant);
                complianceInfo.setConsentSignature(request.consentSignature);
                complianceInfo.setConsentTimestamp(Instant.now());
                complianceInfo.setJurisdiction(request.jurisdiction != null ? request.jurisdiction : "US");
                asset.setComplianceInfo(complianceInfo);

                // Set owner
                asset.setOwner(request.ownerId);

                // Add metadata
                if (request.metadata != null) {
                    asset.setMetadata(request.metadata);
                }

                // Tokenize asset
                HMSIntegrationService.TokenizationResult result =
                    hmsService.tokenizeAsset(asset).await().indefinitely();

                if (result.isSuccess()) {
                    TokenizationResponse response = new TokenizationResponse(
                        true,
                        result.getTokenId(),
                        result.getAssetId(),
                        result.getTransactionHash(),
                        result.getBlockNumber(),
                        null
                    );
                    return Response.ok(response).build();
                } else {
                    TokenizationResponse response = new TokenizationResponse(
                        false,
                        null,
                        result.getAssetId(),
                        null,
                        0,
                        result.getErrorMessage()
                    );
                    return Response.status(Response.Status.BAD_REQUEST).entity(response).build();
                }
            } catch (Exception e) {
                Log.errorf(e, "Failed to tokenize asset");
                TokenizationResponse response = new TokenizationResponse(
                    false, null, null, null, 0, e.getMessage()
                );
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(response).build();
            }
        });
    }

    /**
     * GET /api/v11/hms/assets/{id} - Get asset by ID
     */
    @GET
    @Path("/assets/{id}")
    public Uni<Response> getAsset(@PathParam("id") String assetId) {
        Log.infof("REST API: Get asset request for ID: %s", assetId);

        return hmsService.getAsset(assetId)
            .onItem().transform(optionalAsset -> {
                if (optionalAsset.isPresent()) {
                    HealthcareAsset asset = optionalAsset.get();
                    AssetResponse response = new AssetResponse(
                        asset.getAssetId(),
                        asset.getAssetType().name(),
                        asset.getOwner(),
                        asset.getCreatedAt().toString(),
                        asset.getUpdatedAt().toString(),
                        asset.isEncrypted(),
                        asset.getMetadata()
                    );
                    return Response.ok(response).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Asset not found")).build();
                }
            });
    }

    /**
     * POST /api/v11/hms/assets/{id}/verify - Request verification for an asset
     */
    @POST
    @Path("/assets/{id}/verify")
    public Uni<Response> requestVerification(
            @PathParam("id") String assetId,
            VerificationRequest request) {
        Log.infof("REST API: Verification request for asset: %s, tier: %s", assetId, request.tier);

        return Uni.createFrom().item(() -> {
            try {
                VerificationTier tier = request.tier != null ?
                    VerificationTier.valueOf(request.tier) : VerificationTier.TIER_1;

                VerificationService.VerificationResult result =
                    hmsService.requestVerification(assetId, request.verifierId, tier)
                        .await().indefinitely();

                VerificationResponse response = new VerificationResponse(
                    true,
                    result.getVerificationId(),
                    assetId,
                    result.getStatus().name(),
                    result.getRequiredVerifiers(),
                    result.getReceivedVotes(),
                    result.isConsensusReached(),
                    null
                );

                return Response.ok(response).build();
            } catch (Exception e) {
                Log.errorf(e, "Failed to request verification");
                VerificationResponse response = new VerificationResponse(
                    false, null, assetId, null, 0, 0, false, e.getMessage()
                );
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(response).build();
            }
        });
    }

    /**
     * GET /api/v11/hms/assets/{id}/status - Get asset status including verification
     */
    @GET
    @Path("/assets/{id}/status")
    public Uni<Response> getAssetStatus(@PathParam("id") String assetId) {
        Log.infof("REST API: Get asset status for ID: %s", assetId);

        return hmsService.getAssetStatus(assetId)
            .onItem().transform(statusInfo -> {
                if (statusInfo.getAssetId() == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Asset not found")).build();
                }

                AssetStatusResponse response = new AssetStatusResponse(
                    statusInfo.getAssetId(),
                    statusInfo.getTokenId(),
                    statusInfo.getCurrentOwner(),
                    statusInfo.getState() != null ? statusInfo.getState().name() : "UNKNOWN",
                    statusInfo.getVerificationStatus() != null ?
                        statusInfo.getVerificationStatus().name() : "PENDING",
                    statusInfo.getComplianceInfo() != null ?
                        statusInfo.getComplianceInfo().isFullyCompliant() : false,
                    statusInfo.getLastUpdated() != null ?
                        statusInfo.getLastUpdated().toString() : null
                );

                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v11/hms/assets/{id}/transfer - Transfer asset ownership
     */
    @POST
    @Path("/assets/{id}/transfer")
    public Uni<Response> transferAsset(
            @PathParam("id") String assetId,
            TransferRequest request) {
        Log.infof("REST API: Transfer asset %s from %s to %s",
            assetId, request.fromOwner, request.toOwner);

        return hmsService.transferAsset(
                assetId,
                request.fromOwner,
                request.toOwner,
                request.authorizationSignature
            )
            .onItem().transform(result -> {
                if (result.isSuccess()) {
                    TransferResponse response = new TransferResponse(
                        true,
                        result.getTransferId(),
                        assetId,
                        result.getTransactionHash(),
                        result.getBlockNumber(),
                        result.getNewOwner(),
                        null
                    );
                    return Response.ok(response).build();
                } else {
                    TransferResponse response = new TransferResponse(
                        false, null, assetId, null, 0, null, result.getErrorMessage()
                    );
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(response).build();
                }
            });
    }

    /**
     * GET /api/v11/hms/stats - Get HMS statistics
     */
    @GET
    @Path("/stats")
    public Uni<Response> getStatistics() {
        Log.info("REST API: Get HMS statistics");

        return hmsService.getStatistics()
            .onItem().transform(stats -> {
                StatisticsResponse response = new StatisticsResponse(
                    stats.getTotalAssets(),
                    stats.getTotalTokens(),
                    stats.getTotalTokenizations(),
                    stats.getDailyTokenizations(),
                    stats.getAssetsByType(),
                    stats.getVerificationStatistics()
                );
                return Response.ok(response).build();
            });
    }

    /**
     * POST /api/v11/hms/verifiers/register - Register a new verifier
     */
    @POST
    @Path("/verifiers/register")
    public Uni<Response> registerVerifier(VerifierRegistrationRequest request) {
        Log.infof("REST API: Register verifier: %s", request.name);

        return Uni.createFrom().item(() -> {
            try {
                VerificationService.VerifierInfo verifierInfo =
                    new VerificationService.VerifierInfo(
                        request.verifierId,
                        request.name,
                        request.organization,
                        request.certifications != null ? request.certifications : new ArrayList<>(),
                        request.specializations != null ? request.specializations : new ArrayList<>()
                    );

                VerificationService.VerifierRegistrationResult result =
                    verificationService.registerVerifier(verifierInfo).await().indefinitely();

                if (result.isSuccess()) {
                    VerifierRegistrationResponse response = new VerifierRegistrationResponse(
                        true,
                        result.getVerifierId(),
                        result.getTimestamp().toString(),
                        null
                    );
                    return Response.ok(response).build();
                } else {
                    VerifierRegistrationResponse response = new VerifierRegistrationResponse(
                        false,
                        request.verifierId,
                        null,
                        result.getErrorMessage()
                    );
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(response).build();
                }
            } catch (Exception e) {
                Log.errorf(e, "Failed to register verifier");
                VerifierRegistrationResponse response = new VerifierRegistrationResponse(
                    false, request.verifierId, null, e.getMessage()
                );
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(response).build();
            }
        });
    }

    /**
     * POST /api/v11/hms/verifications/{id}/vote - Submit a verification vote
     */
    @POST
    @Path("/verifications/{id}/vote")
    public Uni<Response> submitVote(
            @PathParam("id") String verificationId,
            VoteSubmissionRequest request) {
        Log.infof("REST API: Submit vote for verification: %s by verifier: %s",
            verificationId, request.verifierId);

        return verificationService.submitVote(
                verificationId,
                request.verifierId,
                request.approved,
                request.reason
            )
            .onItem().transform(result -> {
                if (result.isSuccess()) {
                    VoteResponse response = new VoteResponse(
                        true,
                        result.getVerificationId(),
                        result.getVotesReceived(),
                        result.getVotesRequired(),
                        result.isConsensusReached(),
                        result.isApproved(),
                        null
                    );
                    return Response.ok(response).build();
                } else {
                    VoteResponse response = new VoteResponse(
                        false, null, 0, 0, false, false, result.getErrorMessage()
                    );
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(response).build();
                }
            });
    }

    /**
     * GET /api/v11/hms/verifications/{id} - Get verification details
     */
    @GET
    @Path("/verifications/{id}")
    public Uni<Response> getVerificationDetails(@PathParam("id") String verificationId) {
        Log.infof("REST API: Get verification details for: %s", verificationId);

        return verificationService.getVerificationDetails(verificationId)
            .onItem().transform(details -> {
                if (details == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Verification not found")).build();
                }

                VerificationDetailsResponse response = new VerificationDetailsResponse(
                    details.getVerificationId(),
                    details.getAssetId(),
                    details.getTier().name(),
                    details.getStatus().name(),
                    details.getRequiredVerifiers(),
                    details.getReceivedVotes(),
                    details.isConsensusReached(),
                    details.getApprovalRate(),
                    details.getRequestedAt().toString(),
                    details.getCompletedAt() != null ?
                        details.getCompletedAt().toString() : null
                );

                return Response.ok(response).build();
            });
    }

    // Helper method to create assets from requests
    private HealthcareAsset createAssetFromRequest(AssetTokenizationRequest request) {
        switch (request.assetType.toUpperCase()) {
            case "MEDICAL_RECORD":
                MedicalRecord medicalRecord = new MedicalRecord(
                    request.assetId,
                    request.patientId,
                    request.providerId
                );
                if (request.diagnosis != null) {
                    medicalRecord.setDiagnosis(request.diagnosis);
                }
                return medicalRecord;

            case "PRESCRIPTION":
                Prescription prescription = new Prescription(
                    request.assetId,
                    request.patientId,
                    request.providerId
                );
                return prescription;

            case "DIAGNOSTIC_REPORT":
                DiagnosticReport diagnosticReport = new DiagnosticReport(
                    request.assetId,
                    request.patientId,
                    request.providerId,
                    request.reportType != null ? request.reportType : "General"
                );
                if (request.findings != null) {
                    diagnosticReport.setFindings(request.findings);
                }
                return diagnosticReport;

            default:
                throw new IllegalArgumentException("Unsupported asset type: " + request.assetType);
        }
    }

    // Request/Response DTOs
    public static class AssetTokenizationRequest {
        public String assetId;
        public String assetType;
        public String patientId;
        public String providerId;
        public String ownerId;
        public boolean hipaaCompliant;
        public boolean gdprCompliant;
        public String consentSignature;
        public String jurisdiction;
        public Map<String, String> metadata;
        public String diagnosis;
        public String reportType;
        public String findings;
    }

    public static class TokenizationResponse {
        public boolean success;
        public String tokenId;
        public String assetId;
        public String transactionHash;
        public long blockNumber;
        public String errorMessage;

        public TokenizationResponse(boolean success, String tokenId, String assetId,
                                   String transactionHash, long blockNumber, String errorMessage) {
            this.success = success;
            this.tokenId = tokenId;
            this.assetId = assetId;
            this.transactionHash = transactionHash;
            this.blockNumber = blockNumber;
            this.errorMessage = errorMessage;
        }
    }

    public static class AssetResponse {
        public String assetId;
        public String assetType;
        public String owner;
        public String createdAt;
        public String updatedAt;
        public boolean encrypted;
        public Map<String, String> metadata;

        public AssetResponse(String assetId, String assetType, String owner, String createdAt,
                           String updatedAt, boolean encrypted, Map<String, String> metadata) {
            this.assetId = assetId;
            this.assetType = assetType;
            this.owner = owner;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            this.encrypted = encrypted;
            this.metadata = metadata;
        }
    }

    public static class VerificationRequest {
        public String verifierId;
        public String tier;
        public long assetValue;
    }

    public static class VerificationResponse {
        public boolean success;
        public String verificationId;
        public String assetId;
        public String status;
        public int requiredVerifiers;
        public int receivedVotes;
        public boolean consensusReached;
        public String errorMessage;

        public VerificationResponse(boolean success, String verificationId, String assetId,
                                   String status, int requiredVerifiers, int receivedVotes,
                                   boolean consensusReached, String errorMessage) {
            this.success = success;
            this.verificationId = verificationId;
            this.assetId = assetId;
            this.status = status;
            this.requiredVerifiers = requiredVerifiers;
            this.receivedVotes = receivedVotes;
            this.consensusReached = consensusReached;
            this.errorMessage = errorMessage;
        }
    }

    public static class AssetStatusResponse {
        public String assetId;
        public String tokenId;
        public String currentOwner;
        public String state;
        public String verificationStatus;
        public boolean compliant;
        public String lastUpdated;

        public AssetStatusResponse(String assetId, String tokenId, String currentOwner,
                                  String state, String verificationStatus, boolean compliant,
                                  String lastUpdated) {
            this.assetId = assetId;
            this.tokenId = tokenId;
            this.currentOwner = currentOwner;
            this.state = state;
            this.verificationStatus = verificationStatus;
            this.compliant = compliant;
            this.lastUpdated = lastUpdated;
        }
    }

    public static class TransferRequest {
        public String fromOwner;
        public String toOwner;
        public String authorizationSignature;
    }

    public static class TransferResponse {
        public boolean success;
        public String transferId;
        public String assetId;
        public String transactionHash;
        public long blockNumber;
        public String newOwner;
        public String errorMessage;

        public TransferResponse(boolean success, String transferId, String assetId,
                               String transactionHash, long blockNumber, String newOwner,
                               String errorMessage) {
            this.success = success;
            this.transferId = transferId;
            this.assetId = assetId;
            this.transactionHash = transactionHash;
            this.blockNumber = blockNumber;
            this.newOwner = newOwner;
            this.errorMessage = errorMessage;
        }
    }

    public static class StatisticsResponse {
        public long totalAssets;
        public long totalTokens;
        public long totalTokenizations;
        public long dailyTokenizations;
        public Map<AssetType, Long> assetsByType;
        public VerificationStatistics verificationStatistics;

        public StatisticsResponse(long totalAssets, long totalTokens, long totalTokenizations,
                                 long dailyTokenizations, Map<AssetType, Long> assetsByType,
                                 VerificationStatistics verificationStatistics) {
            this.totalAssets = totalAssets;
            this.totalTokens = totalTokens;
            this.totalTokenizations = totalTokenizations;
            this.dailyTokenizations = dailyTokenizations;
            this.assetsByType = assetsByType;
            this.verificationStatistics = verificationStatistics;
        }
    }

    public static class VerifierRegistrationRequest {
        public String verifierId;
        public String name;
        public String organization;
        public List<String> certifications;
        public List<String> specializations;
    }

    public static class VerifierRegistrationResponse {
        public boolean success;
        public String verifierId;
        public String registrationTimestamp;
        public String errorMessage;

        public VerifierRegistrationResponse(boolean success, String verifierId,
                                           String registrationTimestamp, String errorMessage) {
            this.success = success;
            this.verifierId = verifierId;
            this.registrationTimestamp = registrationTimestamp;
            this.errorMessage = errorMessage;
        }
    }

    public static class VoteSubmissionRequest {
        public String verifierId;
        public boolean approved;
        public String reason;
    }

    public static class VoteResponse {
        public boolean success;
        public String verificationId;
        public int votesReceived;
        public int votesRequired;
        public boolean consensusReached;
        public boolean approved;
        public String errorMessage;

        public VoteResponse(boolean success, String verificationId, int votesReceived,
                          int votesRequired, boolean consensusReached, boolean approved,
                          String errorMessage) {
            this.success = success;
            this.verificationId = verificationId;
            this.votesReceived = votesReceived;
            this.votesRequired = votesRequired;
            this.consensusReached = consensusReached;
            this.approved = approved;
            this.errorMessage = errorMessage;
        }
    }

    public static class VerificationDetailsResponse {
        public String verificationId;
        public String assetId;
        public String tier;
        public String status;
        public int requiredVerifiers;
        public int receivedVotes;
        public boolean consensusReached;
        public double approvalRate;
        public String requestedAt;
        public String completedAt;

        public VerificationDetailsResponse(String verificationId, String assetId, String tier,
                                          String status, int requiredVerifiers, int receivedVotes,
                                          boolean consensusReached, double approvalRate,
                                          String requestedAt, String completedAt) {
            this.verificationId = verificationId;
            this.assetId = assetId;
            this.tier = tier;
            this.status = status;
            this.requiredVerifiers = requiredVerifiers;
            this.receivedVotes = receivedVotes;
            this.consensusReached = consensusReached;
            this.approvalRate = approvalRate;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
        }
    }
}
